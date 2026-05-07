create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  v_code text;
  v_index integer;
  v_try integer;
begin
  for v_try in 1..100 loop
    v_code := '';

    for v_index in 1..5 loop
      v_code := v_code || substr(
        v_alphabet,
        (floor(random() * length(v_alphabet))::integer + 1),
        1
      );
    end loop;

    if not exists (
      select 1
      from public.profiles
      where lower(referral_code) = lower(v_code)
    ) then
      return v_code;
    end if;
  end loop;

  raise exception 'REFERRAL_CODE_GENERATION_FAILED';
end;
$$;

alter table public.profiles
add column if not exists referral_code text;

alter table public.profiles
drop constraint if exists profiles_referral_code_format_check;

alter table public.profiles
add constraint profiles_referral_code_format_check
check (referral_code is null or referral_code ~ '^[A-Za-z0-9]{5}$');

create unique index if not exists profiles_referral_code_lower_key
on public.profiles (lower(referral_code))
where referral_code is not null;

do $$
declare
  v_profile record;
begin
  for v_profile in
    select id
    from public.profiles
    where referral_code is null
  loop
    loop
      begin
        update public.profiles
        set referral_code = public.generate_referral_code()
        where id = v_profile.id;

        exit;
      exception
        when unique_violation then
          null;
      end;
    end loop;
  end loop;
end;
$$;

alter table public.profiles
alter column referral_code set default public.generate_referral_code();

alter table public.profiles
alter column referral_code set not null;

alter table public.coupon_templates
drop constraint if exists coupon_templates_template_type_check;

alter table public.coupon_templates
add constraint coupon_templates_template_type_check
check (template_type in ('signup_welcome', 'referral_inviter', 'referral_invitee'));

alter table public.user_coupons
drop constraint if exists user_coupons_issued_reason_check;

alter table public.user_coupons
add constraint user_coupons_issued_reason_check
check (issued_reason in ('signup_welcome', 'referral_inviter', 'referral_invitee'));

drop index if exists public.user_coupons_user_template_key;

create unique index if not exists user_coupons_signup_template_once_key
on public.user_coupons (user_id, template_id)
where template_id is not null
  and issued_reason = 'signup_welcome';

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  referral_code_snapshot text not null,
  invitee_coupon_id uuid references public.user_coupons (id) on delete set null,
  inviter_coupon_id uuid references public.user_coupons (id) on delete set null,
  invitee_reward_status text not null default 'pending'
    check (invitee_reward_status in ('pending', 'issued')),
  inviter_reward_status text not null default 'pending'
    check (inviter_reward_status in ('pending', 'issued')),
  invitee_reward_issued_at timestamptz,
  inviter_reward_issued_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (inviter_id <> invitee_id)
);

create unique index if not exists referrals_invitee_once_key
on public.referrals (invitee_id);

create index if not exists referrals_inviter_created_at_idx
on public.referrals (inviter_id, created_at desc);

drop trigger if exists set_referrals_updated_at on public.referrals;

create trigger set_referrals_updated_at
before update on public.referrals
for each row
execute function public.handle_updated_at();

grant select on public.referrals to authenticated;

alter table public.referrals enable row level security;

drop policy if exists "Users can read own referrals" on public.referrals;
create policy "Users can read own referrals"
on public.referrals
for select
to authenticated
using (auth.uid() = inviter_id or auth.uid() = invitee_id);

drop policy if exists "Admins can read referrals" on public.referrals;
create policy "Admins can read referrals"
on public.referrals
for select
to authenticated
using (public.is_admin());

create or replace function public.issue_signup_welcome_coupons(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_issued_count integer := 0;
begin
  insert into public.user_coupons (
    template_id,
    user_id,
    name_snapshot,
    discount_amount_snapshot,
    status,
    issued_reason
  )
  select
    templates.id,
    p_user_id,
    templates.name,
    templates.discount_amount,
    'available',
    'signup_welcome'
  from public.coupon_templates as templates
  where templates.template_type = 'signup_welcome'
    and templates.auto_issue_on_signup
    and templates.is_active
  on conflict do nothing;

  get diagnostics v_issued_count = row_count;
  return v_issued_count;
end;
$$;

create or replace function public.issue_referral_reward_coupon(
  p_user_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon_id uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_template public.coupon_templates%rowtype;
begin
  if v_reason not in ('referral_inviter', 'referral_invitee') then
    raise exception 'INVALID_REFERRAL_REWARD_REASON';
  end if;

  select *
  into v_template
  from public.coupon_templates
  where template_type = v_reason
    and is_active
  order by updated_at desc, created_at desc
  limit 1;

  if not found then
    raise exception 'REFERRAL_REWARD_TEMPLATE_NOT_FOUND';
  end if;

  insert into public.user_coupons (
    template_id,
    user_id,
    name_snapshot,
    discount_amount_snapshot,
    status,
    issued_reason
  )
  values (
    v_template.id,
    p_user_id,
    v_template.name,
    v_template.discount_amount,
    'available',
    v_reason
  )
  returning id into v_coupon_id;

  return v_coupon_id;
end;
$$;

insert into public.coupon_templates (
  name,
  discount_amount,
  template_type,
  auto_issue_on_signup,
  is_active
)
select
  '친구 초대 가입 쿠폰',
  2000,
  'referral_invitee',
  false,
  true
where not exists (
  select 1
  from public.coupon_templates
  where template_type = 'referral_invitee'
    and is_active
);

insert into public.coupon_templates (
  name,
  discount_amount,
  template_type,
  auto_issue_on_signup,
  is_active
)
select
  '친구 초대 보상 쿠폰',
  3000,
  'referral_inviter',
  false,
  true
where not exists (
  select 1
  from public.coupon_templates
  where template_type = 'referral_inviter'
    and is_active
);

create or replace function public.validate_referral_code_for_signup(
  p_invitee_id uuid,
  p_referral_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := btrim(coalesce(p_referral_code, ''));
  v_inviter_id uuid;
  v_referral_code text;
begin
  if v_code = '' then
    return jsonb_build_object('valid', false, 'reason', 'empty');
  end if;

  if v_code !~ '^[A-Za-z0-9]{5}$' then
    raise exception 'REFERRAL_CODE_INVALID';
  end if;

  select id, referral_code
  into v_inviter_id, v_referral_code
  from public.profiles
  where lower(referral_code) = lower(v_code)
  limit 1;

  if v_inviter_id is null then
    raise exception 'REFERRAL_CODE_NOT_FOUND';
  end if;

  if p_invitee_id is not null and v_inviter_id = p_invitee_id then
    raise exception 'SELF_REFERRAL_NOT_ALLOWED';
  end if;

  if p_invitee_id is not null and exists (
    select 1
    from public.referrals
    where invitee_id = p_invitee_id
  ) then
    raise exception 'REFERRAL_ALREADY_APPLIED';
  end if;

  return jsonb_build_object(
    'valid',
    true,
    'inviterId',
    v_inviter_id,
    'referralCode',
    v_referral_code
  );
end;
$$;

create or replace function public.record_referral_signup(
  p_invitee_id uuid,
  p_referral_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := btrim(coalesce(p_referral_code, ''));
  v_inviter public.profiles%rowtype;
  v_invitee public.profiles%rowtype;
  v_existing public.referrals%rowtype;
  v_invitee_coupon_id uuid;
  v_inviter_coupon_id uuid;
  v_issued_at timestamptz := timezone('utc', now());
  v_referral_id uuid;
begin
  if p_invitee_id is null then
    raise exception 'INVITEE_REQUIRED';
  end if;

  if v_code = '' then
    return jsonb_build_object('applied', false, 'reason', 'empty');
  end if;

  if v_code !~ '^[A-Za-z0-9]{5}$' then
    raise exception 'REFERRAL_CODE_INVALID';
  end if;

  select *
  into v_invitee
  from public.profiles
  where id = p_invitee_id
  for update;

  if not found then
    raise exception 'INVITEE_PROFILE_NOT_FOUND';
  end if;

  select *
  into v_inviter
  from public.profiles
  where lower(referral_code) = lower(v_code)
  limit 1
  for update;

  if not found then
    raise exception 'REFERRAL_CODE_NOT_FOUND';
  end if;

  if v_inviter.id = p_invitee_id then
    raise exception 'SELF_REFERRAL_NOT_ALLOWED';
  end if;

  select *
  into v_existing
  from public.referrals
  where invitee_id = p_invitee_id
  for update;

  if found then
    if v_existing.inviter_id = v_inviter.id then
      return jsonb_build_object(
        'applied',
        true,
        'referralId',
        v_existing.id,
        'inviteeCouponId',
        v_existing.invitee_coupon_id,
        'inviterCouponId',
        v_existing.inviter_coupon_id,
        'status',
        'already_applied'
      );
    end if;

    raise exception 'REFERRAL_ALREADY_APPLIED';
  end if;

  v_invitee_coupon_id := public.issue_referral_reward_coupon(
    p_invitee_id,
    'referral_invitee'
  );
  v_inviter_coupon_id := public.issue_referral_reward_coupon(
    v_inviter.id,
    'referral_inviter'
  );

  insert into public.referrals (
    inviter_id,
    invitee_id,
    referral_code_snapshot,
    invitee_coupon_id,
    inviter_coupon_id,
    invitee_reward_status,
    inviter_reward_status,
    invitee_reward_issued_at,
    inviter_reward_issued_at
  )
  values (
    v_inviter.id,
    p_invitee_id,
    v_inviter.referral_code,
    v_invitee_coupon_id,
    v_inviter_coupon_id,
    'issued',
    'issued',
    v_issued_at,
    v_issued_at
  )
  returning id into v_referral_id;

  return jsonb_build_object(
    'applied',
    true,
    'referralId',
    v_referral_id,
    'inviteeCouponId',
    v_invitee_coupon_id,
    'inviterCouponId',
    v_inviter_coupon_id,
    'status',
    'issued'
  );
exception
  when unique_violation then
    raise exception 'REFERRAL_ALREADY_APPLIED';
end;
$$;

grant execute on function public.validate_referral_code_for_signup(uuid, text) to authenticated, service_role;
grant execute on function public.record_referral_signup(uuid, text) to authenticated, service_role;
