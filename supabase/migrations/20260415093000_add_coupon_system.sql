create table if not exists public.coupon_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discount_amount integer not null check (discount_amount > 0),
  template_type text not null default 'signup_welcome'
    check (template_type in ('signup_welcome')),
  auto_issue_on_signup boolean not null default true,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists coupon_templates_single_active_signup_key
on public.coupon_templates (template_type)
where template_type = 'signup_welcome'
  and auto_issue_on_signup
  and is_active;

create index if not exists coupon_templates_created_at_idx
on public.coupon_templates (created_at desc);

drop trigger if exists set_coupon_templates_updated_at on public.coupon_templates;

create trigger set_coupon_templates_updated_at
before update on public.coupon_templates
for each row
execute function public.handle_updated_at();

create table if not exists public.user_coupons (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.coupon_templates (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name_snapshot text not null,
  discount_amount_snapshot integer not null check (discount_amount_snapshot > 0),
  status text not null default 'available'
    check (status in ('available', 'used', 'expired')),
  issued_reason text not null default 'signup_welcome'
    check (issued_reason in ('signup_welcome')),
  used_match_application_id uuid,
  issued_at timestamptz not null default timezone('utc', now()),
  used_at timestamptz,
  restored_at timestamptz,
  restore_count integer not null default 0 check (restore_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists user_coupons_user_reason_key
on public.user_coupons (user_id, issued_reason);

create index if not exists user_coupons_user_status_issued_at_idx
on public.user_coupons (user_id, status, issued_at desc);

create index if not exists user_coupons_template_status_idx
on public.user_coupons (template_id, status);

create index if not exists user_coupons_used_match_application_idx
on public.user_coupons (used_match_application_id)
where used_match_application_id is not null;

drop trigger if exists set_user_coupons_updated_at on public.user_coupons;

create trigger set_user_coupons_updated_at
before update on public.user_coupons
for each row
execute function public.handle_updated_at();

alter table public.user_coupons
drop constraint if exists user_coupons_used_match_application_id_fkey;

alter table public.user_coupons
add constraint user_coupons_used_match_application_id_fkey
foreign key (used_match_application_id)
references public.match_applications (id)
on delete set null;

alter table public.match_applications
add column if not exists coupon_id uuid references public.user_coupons (id) on delete set null,
add column if not exists coupon_discount_amount integer not null default 0 check (coupon_discount_amount >= 0),
add column if not exists charged_amount_snapshot integer not null default 0 check (charged_amount_snapshot >= 0);

update public.match_applications
set charged_amount_snapshot = coalesce(price_snapshot, 0)
where charged_amount_snapshot = 0
  and price_snapshot is not null;

grant select on public.coupon_templates to authenticated;
grant insert, update on public.coupon_templates to authenticated;
grant select on public.user_coupons to authenticated;

alter table public.coupon_templates enable row level security;
alter table public.user_coupons enable row level security;

drop policy if exists "Admins can read coupon templates" on public.coupon_templates;
create policy "Admins can read coupon templates"
on public.coupon_templates
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert coupon templates" on public.coupon_templates;
create policy "Admins can insert coupon templates"
on public.coupon_templates
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update coupon templates" on public.coupon_templates;
create policy "Admins can update coupon templates"
on public.coupon_templates
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own user coupons" on public.user_coupons;
create policy "Users can read own user coupons"
on public.user_coupons
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read user coupons" on public.user_coupons;
create policy "Admins can read user coupons"
on public.user_coupons
for select
to authenticated
using (public.is_admin());

create or replace function public.issue_signup_welcome_coupon(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon_id uuid;
  v_template public.coupon_templates%rowtype;
begin
  select *
  into v_template
  from public.coupon_templates
  where template_type = 'signup_welcome'
    and auto_issue_on_signup
    and is_active
  order by updated_at desc, created_at desc
  limit 1;

  if not found then
    return null;
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
    'signup_welcome'
  )
  on conflict (user_id, issued_reason) do nothing
  returning id into v_coupon_id;

  return v_coupon_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    avatar_url,
    onboarding_required,
    phone_verification_required,
    signup_profile_required
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url',
    true,
    true,
    true
  )
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  insert into public.cash_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  perform public.issue_signup_welcome_coupon(new.id);

  return new;
end;
$$;

drop function if exists public.apply_to_match(uuid);

create or replace function public.apply_to_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match public.matches%rowtype;
  v_account public.cash_accounts%rowtype;
  v_confirmed_count integer;
  v_application_id uuid := gen_random_uuid();
  v_transaction_id uuid;
  v_balance_after integer;
  v_coupon public.user_coupons%rowtype;
  v_coupon_discount_amount integer := 0;
  v_charged_amount integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;

  if v_match.status = 'open' and v_match.start_at <= now() then
    update public.matches
    set status = 'closed'
    where id = p_match_id
      and status = 'open';

    raise exception 'MATCH_STARTED';
  end if;

  if v_match.status <> 'open' then
    raise exception 'MATCH_NOT_OPEN';
  end if;

  if exists (
    select 1
    from public.match_applications
    where match_id = p_match_id
      and user_id = v_user_id
      and status = 'confirmed'
  ) then
    raise exception 'ALREADY_APPLIED';
  end if;

  select count(*)::integer
  into v_confirmed_count
  from public.match_applications
  where match_id = p_match_id
    and status = 'confirmed';

  if v_confirmed_count >= v_match.capacity then
    raise exception 'MATCH_FULL';
  end if;

  if v_match.price > 0 then
    select *
    into v_coupon
    from public.user_coupons
    where user_id = v_user_id
      and status = 'available'
      and issued_reason = 'signup_welcome'
    order by issued_at asc
    limit 1
    for update;

    if found then
      v_coupon_discount_amount := least(v_coupon.discount_amount_snapshot, v_match.price);
    end if;
  end if;

  v_charged_amount := greatest(v_match.price - v_coupon_discount_amount, 0);
  v_account := public.ensure_cash_account(v_user_id);

  if v_account.balance < v_charged_amount then
    raise exception 'INSUFFICIENT_CASH';
  end if;

  v_balance_after := v_account.balance;

  if v_charged_amount > 0 then
    update public.cash_accounts
    set balance = balance - v_charged_amount
    where user_id = v_user_id
    returning balance into v_balance_after;

    insert into public.cash_transactions (
      user_id,
      delta_amount,
      balance_after,
      type,
      source_type,
      source_id,
      memo
    )
    values (
      v_user_id,
      -v_charged_amount,
      v_balance_after,
      'match_debit',
      'match_application',
      v_application_id,
      '매치 신청 차감'
    )
    returning id into v_transaction_id;
  end if;

  insert into public.match_applications (
    id,
    match_id,
    user_id,
    status,
    price_snapshot,
    coupon_id,
    coupon_discount_amount,
    charged_amount_snapshot,
    cash_debit_transaction_id
  )
  values (
    v_application_id,
    p_match_id,
    v_user_id,
    'confirmed',
    v_match.price,
    case when v_coupon_discount_amount > 0 then v_coupon.id else null end,
    v_coupon_discount_amount,
    v_charged_amount,
    v_transaction_id
  );

  if v_coupon_discount_amount > 0 then
    update public.user_coupons
    set
      status = 'used',
      used_at = timezone('utc', now()),
      used_match_application_id = v_application_id
    where id = v_coupon.id;
  end if;

  return jsonb_build_object(
    'applicationId',
    v_application_id,
    'couponApplied',
    v_coupon_discount_amount > 0,
    'couponDiscountAmount',
    v_coupon_discount_amount,
    'debitedAmount',
    v_charged_amount,
    'remainingCash',
    v_balance_after
  );
exception
  when unique_violation then
    raise exception 'ALREADY_APPLIED';
end;
$$;

drop function if exists public.cancel_match_application(uuid);

create or replace function public.cancel_match_application(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_application record;
  v_account public.cash_accounts%rowtype;
  v_full_refund_amount integer := 0;
  v_refund_amount integer := 0;
  v_transaction_id uuid;
  v_balance_after integer;
  v_coupon_restored boolean := false;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select
    applications.id,
    applications.price_snapshot,
    applications.charged_amount_snapshot,
    applications.coupon_id,
    matches.start_at
  into v_application
  from public.match_applications as applications
  join public.matches as matches
    on matches.id = applications.match_id
  where applications.match_id = p_match_id
    and applications.user_id = v_user_id
    and applications.status = 'confirmed'
  order by applications.applied_at desc
  limit 1
  for update of applications, matches;

  if v_application.id is null then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;

  v_full_refund_amount := public.get_match_refund_amount(
    v_application.price_snapshot,
    v_application.start_at,
    false
  );

  v_refund_amount := public.get_match_refund_amount(
    v_application.charged_amount_snapshot,
    v_application.start_at,
    false
  );

  v_account := public.ensure_cash_account(v_user_id);
  v_balance_after := v_account.balance;

  if v_refund_amount > 0 then
    update public.cash_accounts
    set balance = balance + v_refund_amount
    where user_id = v_user_id
    returning balance into v_balance_after;

    insert into public.cash_transactions (
      user_id,
      delta_amount,
      balance_after,
      type,
      source_type,
      source_id,
      memo
    )
    values (
      v_user_id,
      v_refund_amount,
      v_balance_after,
      'match_refund',
      'match_application',
      v_application.id,
      '매치 취소 환급'
    )
    returning id into v_transaction_id;
  end if;

  if v_full_refund_amount >= v_application.price_snapshot
    and v_application.coupon_id is not null then
    update public.user_coupons
    set
      status = 'available',
      used_at = null,
      used_match_application_id = null,
      restored_at = timezone('utc', now()),
      restore_count = restore_count + 1
    where id = v_application.coupon_id
      and user_id = v_user_id
      and status = 'used'
      and used_match_application_id = v_application.id;

    v_coupon_restored := found;
  end if;

  update public.match_applications
  set
    status = 'cancelled_by_user',
    cancel_reason = 'user_cancelled',
    cancelled_at = timezone('utc', now()),
    refunded_amount = v_refund_amount,
    refunded_at = case when v_refund_amount > 0 then timezone('utc', now()) else null end,
    cash_refund_transaction_id = v_transaction_id
  where id = v_application.id;

  return jsonb_build_object(
    'applicationId',
    v_application.id,
    'couponRestored',
    v_coupon_restored,
    'refundedAmount',
    v_refund_amount,
    'remainingCash',
    v_balance_after
  );
end;
$$;

create or replace function public.cancel_match_applications_by_admin(
  p_match_id uuid,
  p_reason text default 'admin_cancelled'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application record;
  v_transaction_id uuid;
  v_balance_after integer;
  v_cancelled_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  for v_application in
    select
      applications.id,
      applications.user_id,
      applications.price_snapshot,
      applications.charged_amount_snapshot,
      applications.coupon_id
    from public.match_applications as applications
    where applications.match_id = p_match_id
      and applications.status = 'confirmed'
    order by applications.applied_at asc
    for update of applications
  loop
    v_transaction_id := null;

    perform public.ensure_cash_account(v_application.user_id);

    if v_application.charged_amount_snapshot > 0 then
      update public.cash_accounts
      set balance = balance + v_application.charged_amount_snapshot
      where user_id = v_application.user_id
      returning balance into v_balance_after;

      insert into public.cash_transactions (
        user_id,
        delta_amount,
        balance_after,
        type,
        source_type,
        source_id,
        memo
      )
      values (
        v_application.user_id,
        v_application.charged_amount_snapshot,
        v_balance_after,
        'match_refund',
        'match_application',
        v_application.id,
        '운영 취소 환급'
      )
      returning id into v_transaction_id;
    end if;

    if v_application.coupon_id is not null then
      update public.user_coupons
      set
        status = 'available',
        used_at = null,
        used_match_application_id = null,
        restored_at = timezone('utc', now()),
        restore_count = restore_count + 1
      where id = v_application.coupon_id
        and user_id = v_application.user_id
        and status = 'used'
        and used_match_application_id = v_application.id;
    end if;

    update public.match_applications
    set
      status = 'cancelled_by_admin',
      cancel_reason = p_reason,
      cancelled_at = timezone('utc', now()),
      refunded_amount = v_application.charged_amount_snapshot,
      refunded_at = case
        when v_application.charged_amount_snapshot > 0
          then timezone('utc', now())
        else null
      end,
      cash_refund_transaction_id = v_transaction_id
    where id = v_application.id;

    v_cancelled_count := v_cancelled_count + 1;
  end loop;

  return v_cancelled_count;
end;
$$;

grant execute on function public.apply_to_match(uuid) to authenticated;
grant execute on function public.cancel_match_application(uuid) to authenticated;
grant execute on function public.cancel_match_applications_by_admin(uuid, text) to authenticated;
