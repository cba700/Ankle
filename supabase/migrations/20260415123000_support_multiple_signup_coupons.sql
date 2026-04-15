drop index if exists public.coupon_templates_single_active_signup_key;

drop index if exists public.user_coupons_user_reason_key;

create unique index if not exists user_coupons_user_template_key
on public.user_coupons (user_id, template_id);

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
  on conflict (user_id, template_id) do nothing;

  get diagnostics v_issued_count = row_count;
  return v_issued_count;
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

  perform public.issue_signup_welcome_coupons(new.id);

  return new;
end;
$$;

drop function if exists public.apply_to_match(uuid);
drop function if exists public.apply_to_match(uuid, uuid);

create or replace function public.apply_to_match(
  p_match_id uuid,
  p_coupon_id uuid default null
)
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

  if p_coupon_id is not null then
    if v_match.price <= 0 then
      raise exception 'COUPON_NOT_APPLICABLE';
    end if;

    select *
    into v_coupon
    from public.user_coupons
    where id = p_coupon_id
      and user_id = v_user_id
      and status = 'available'
    for update;

    if not found then
      raise exception 'COUPON_NOT_FOUND';
    end if;

    v_coupon_discount_amount := least(v_coupon.discount_amount_snapshot, v_match.price);

    if v_coupon_discount_amount <= 0 then
      raise exception 'COUPON_NOT_APPLICABLE';
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
    'couponId',
    case when v_coupon_discount_amount > 0 then v_coupon.id else null end,
    'couponName',
    case when v_coupon_discount_amount > 0 then v_coupon.name_snapshot else null end,
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

grant execute on function public.apply_to_match(uuid, uuid) to authenticated;
