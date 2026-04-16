alter table public.matches
add column if not exists refund_exception_mode text not null default 'none'
  check (
    refund_exception_mode in (
      'none',
      'participant_shortage_day_before',
      'participant_shortage_same_day',
      'rain_notice',
      'rain_change_notice'
    )
  );

create or replace function public.get_match_refund_amount(
  p_amount integer,
  p_start_at timestamptz,
  p_cancelled_by_admin boolean default false
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_now_seoul timestamp without time zone;
  v_start_seoul timestamp without time zone;
  v_date_diff integer;
begin
  if p_cancelled_by_admin then
    return greatest(p_amount, 0);
  end if;

  if p_amount <= 0 then
    return 0;
  end if;

  v_now_seoul := timezone('Asia/Seoul', now());
  v_start_seoul := timezone('Asia/Seoul', p_start_at);
  v_date_diff := v_start_seoul::date - v_now_seoul::date;

  if v_date_diff >= 2 then
    return greatest(p_amount, 0);
  end if;

  if v_date_diff = 1 then
    return greatest(floor((p_amount::numeric) * 0.8)::integer, 0);
  end if;

  if v_date_diff = 0 and v_now_seoul <= v_start_seoul - interval '2 hours' then
    return greatest(floor((p_amount::numeric) * 0.2)::integer, 0);
  end if;

  return 0;
end;
$$;

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
  v_cancelled_at timestamptz := now();
  v_now_seoul timestamp without time zone := timezone('Asia/Seoul', now());
  v_start_seoul timestamp without time zone;
  v_coupon_restore_allowed boolean := false;
  v_has_free_cancel_today boolean := false;
  v_free_cancel_available boolean := false;
  v_exception_full_refund boolean := false;
  v_cancel_reason text := 'user_cancelled';
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select
    applications.id,
    applications.applied_at,
    applications.price_snapshot,
    applications.charged_amount_snapshot,
    applications.coupon_id,
    matches.start_at,
    matches.refund_exception_mode
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

  v_start_seoul := timezone('Asia/Seoul', v_application.start_at);
  v_coupon_restore_allowed := v_now_seoul <= v_start_seoul - interval '2 hours';

  select exists (
    select 1
    from public.match_applications
    where user_id = v_user_id
      and status = 'cancelled_by_user'
      and cancel_reason = 'user_cancelled_free_window'
      and cancelled_at is not null
      and timezone('Asia/Seoul', cancelled_at)::date = v_now_seoul::date
  )
  into v_has_free_cancel_today;

  v_free_cancel_available :=
    v_coupon_restore_allowed
    and v_cancelled_at <= v_application.applied_at + interval '30 minutes'
    and not v_has_free_cancel_today;

  v_exception_full_refund :=
    v_coupon_restore_allowed
    and coalesce(v_application.refund_exception_mode, 'none') in (
      'participant_shortage_day_before',
      'participant_shortage_same_day',
      'rain_notice'
    );

  if v_free_cancel_available then
    v_full_refund_amount := greatest(v_application.price_snapshot, 0);
    v_refund_amount := greatest(v_application.charged_amount_snapshot, 0);
    v_cancel_reason := 'user_cancelled_free_window';
  elsif v_exception_full_refund then
    v_full_refund_amount := greatest(v_application.price_snapshot, 0);
    v_refund_amount := greatest(v_application.charged_amount_snapshot, 0);
    v_cancel_reason := case coalesce(v_application.refund_exception_mode, 'none')
      when 'participant_shortage_day_before' then 'user_cancelled_participant_shortage_day_before'
      when 'participant_shortage_same_day' then 'user_cancelled_participant_shortage_same_day'
      when 'rain_notice' then 'user_cancelled_rain_notice'
      else 'user_cancelled'
    end;
  else
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
  end if;

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

  if v_coupon_restore_allowed
    and v_application.coupon_id is not null then
    update public.user_coupons
    set
      status = 'available',
      used_at = null,
      used_match_application_id = null,
      restored_at = v_cancelled_at,
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
    cancel_reason = v_cancel_reason,
    cancelled_at = v_cancelled_at,
    refunded_amount = v_refund_amount,
    refunded_at = case when v_refund_amount > 0 then v_cancelled_at else null end,
    cash_refund_transaction_id = v_transaction_id
  where id = v_application.id;

  return jsonb_build_object(
    'applicationId',
    v_application.id,
    'cancelReason',
    v_cancel_reason,
    'couponRestored',
    v_coupon_restored,
    'refundedAmount',
    v_refund_amount,
    'remainingCash',
    v_balance_after
  );
end;
$$;

drop function if exists public.cancel_match_application_by_admin(uuid);

create or replace function public.cancel_match_application_by_admin(
  p_application_id uuid,
  p_reason text default 'admin_cancelled'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application record;
  v_account public.cash_accounts%rowtype;
  v_transaction_id uuid;
  v_balance_after integer := 0;
  v_coupon_restored boolean := false;
  v_refund_amount integer := 0;
  v_cancelled_at timestamptz := now();
  v_refund_memo text := case
    when p_reason = 'admin_rain_change_refund' then '강수 변동 현장 환급'
    else '운영 취소 환급'
  end;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select
    id,
    user_id,
    price_snapshot,
    charged_amount_snapshot,
    coupon_id
  into v_application
  from public.match_applications
  where id = p_application_id
    and status = 'confirmed'
  limit 1
  for update;

  if v_application.id is null then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;

  if v_application.user_id is not null then
    v_account := public.ensure_cash_account(v_application.user_id);
    v_balance_after := v_account.balance;
    v_refund_amount := greatest(v_application.charged_amount_snapshot, 0);

    if v_refund_amount > 0 then
      update public.cash_accounts
      set balance = balance + v_refund_amount
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
        v_refund_amount,
        v_balance_after,
        'match_refund',
        'match_application',
        v_application.id,
        v_refund_memo
      )
      returning id into v_transaction_id;
    end if;

    if v_application.coupon_id is not null then
      update public.user_coupons
      set
        status = 'available',
        used_at = null,
        used_match_application_id = null,
        restored_at = v_cancelled_at,
        restore_count = restore_count + 1
      where id = v_application.coupon_id
        and user_id = v_application.user_id
        and status = 'used'
        and used_match_application_id = v_application.id;

      v_coupon_restored := found;
    end if;
  end if;

  update public.match_applications
  set
    status = 'cancelled_by_admin',
    cancel_reason = p_reason,
    cancelled_at = v_cancelled_at,
    refunded_amount = v_refund_amount,
    refunded_at = case when v_refund_amount > 0 then v_cancelled_at else null end,
    cash_refund_transaction_id = v_transaction_id
  where id = v_application.id;

  return jsonb_build_object(
    'applicationId',
    v_application.id,
    'cancelReason',
    p_reason,
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
  v_cancelled_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  for v_application in
    select applications.id
    from public.match_applications as applications
    where applications.match_id = p_match_id
      and applications.status = 'confirmed'
    order by applications.applied_at asc
    for update of applications
  loop
    perform public.cancel_match_application_by_admin(v_application.id, p_reason);
    v_cancelled_count := v_cancelled_count + 1;
  end loop;

  return v_cancelled_count;
end;
$$;

alter table public.notification_dispatches
drop constraint if exists notification_dispatches_event_type_check;

alter table public.notification_dispatches
add constraint notification_dispatches_event_type_check
check (
  event_type in (
    'cash_charged',
    'match_confirmed',
    'match_cancelled_user',
    'match_cancelled_admin',
    'match_reminder_day_before',
    'match_reminder_same_day',
    'no_show_notice',
    'participant_shortage_notice_day_before',
    'participant_shortage_notice_same_day',
    'rain_notice',
    'rain_change_notice'
  )
);

grant execute on function public.cancel_match_application_by_admin(uuid, text) to authenticated;
