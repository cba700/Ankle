alter table public.cash_refund_requests
alter column bank_name drop not null,
alter column account_number drop not null,
alter column account_holder drop not null;

create table if not exists public.cash_refund_request_cancellations (
  id uuid primary key default gen_random_uuid(),
  refund_request_id uuid not null references public.cash_refund_requests (id) on delete cascade,
  charge_order_id uuid not null references public.cash_charge_orders (id) on delete restrict,
  payment_key text not null,
  cancel_amount integer not null check (cancel_amount > 0),
  status text not null check (status in ('succeeded', 'failed')),
  idempotency_key text not null,
  provider_snapshot jsonb not null default '{}'::jsonb,
  failure_code text,
  failure_message text,
  processed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists cash_refund_request_cancellations_idempotency_key
on public.cash_refund_request_cancellations (idempotency_key);

create index if not exists cash_refund_request_cancellations_request_id_idx
on public.cash_refund_request_cancellations (refund_request_id);

create index if not exists cash_refund_request_cancellations_charge_order_id_idx
on public.cash_refund_request_cancellations (charge_order_id);

grant select on public.cash_refund_request_cancellations to authenticated;

alter table public.cash_refund_request_cancellations enable row level security;

drop policy if exists "Users can read own cash refund cancellations" on public.cash_refund_request_cancellations;
create policy "Users can read own cash refund cancellations"
on public.cash_refund_request_cancellations
for select
to authenticated
using (
  exists (
    select 1
    from public.cash_refund_requests as requests
    where requests.id = refund_request_id
      and requests.user_id = auth.uid()
  )
);

drop policy if exists "Admins can read cash refund cancellations" on public.cash_refund_request_cancellations;
create policy "Admins can read cash refund cancellations"
on public.cash_refund_request_cancellations
for select
to authenticated
using (public.is_admin());

create or replace function public.submit_cash_refund_request()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_account public.cash_accounts%rowtype;
  v_request_id uuid := gen_random_uuid();
  v_refundable_charge_amount integer := 0;
  v_requested_amount integer;
  v_balance_after integer;
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  perform 1
  from public.cash_refund_requests
  where user_id = v_user_id
    and status = 'pending'
  limit 1;

  if found then
    raise exception 'PENDING_REFUND_REQUEST_EXISTS';
  end if;

  v_account := public.ensure_cash_account(v_user_id);

  select coalesce(sum(greatest(amount - refunded_amount, 0)), 0)
  into v_refundable_charge_amount
  from public.cash_charge_orders
  where user_id = v_user_id
    and status = 'paid'
    and toss_payment_key is not null;

  v_requested_amount := least(v_account.balance, v_refundable_charge_amount);

  if v_requested_amount <= 0 then
    raise exception 'NO_REFUNDABLE_CASH';
  end if;

  insert into public.cash_refund_requests (
    id,
    user_id,
    requested_amount,
    bank_name,
    account_number,
    account_holder,
    status
  )
  values (
    v_request_id,
    v_user_id,
    v_requested_amount,
    null,
    null,
    null,
    'pending'
  );

  update public.cash_accounts
  set balance = balance - v_requested_amount
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
    -v_requested_amount,
    v_balance_after,
    'refund_hold',
    'refund_request',
    v_request_id,
    '결제수단 캐시 환불 요청'
  )
  returning id into v_transaction_id;

  update public.cash_refund_requests
  set hold_transaction_id = v_transaction_id
  where id = v_request_id;

  return jsonb_build_object(
    'requestId',
    v_request_id,
    'requestedAmount',
    v_requested_amount,
    'remainingCash',
    v_balance_after,
    'status',
    'pending'
  );
exception
  when unique_violation then
    raise exception 'PENDING_REFUND_REQUEST_EXISTS';
end;
$$;

create or replace function public.submit_cash_refund_request(
  p_bank_name text,
  p_account_number text,
  p_account_holder text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.submit_cash_refund_request();
end;
$$;

create or replace function public.record_cash_refund_cancellation_result(
  p_refund_request_id uuid,
  p_charge_order_id uuid,
  p_payment_key text,
  p_cancel_amount integer,
  p_status text,
  p_idempotency_key text,
  p_provider_snapshot jsonb default '{}'::jsonb,
  p_failure_code text default null,
  p_failure_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.cash_refund_request_cancellations%rowtype;
  v_order public.cash_charge_orders%rowtype;
  v_status text := btrim(coalesce(p_status, ''));
begin
  if p_cancel_amount <= 0 then
    raise exception 'INVALID_CANCEL_AMOUNT';
  end if;

  if v_status not in ('succeeded', 'failed') then
    raise exception 'INVALID_CANCEL_STATUS';
  end if;

  select *
  into v_existing
  from public.cash_refund_request_cancellations
  where idempotency_key = p_idempotency_key
  for update;

  if found then
    return jsonb_build_object(
      'cancellationId',
      v_existing.id,
      'status',
      v_existing.status,
      'cancelAmount',
      v_existing.cancel_amount
    );
  end if;

  select *
  into v_order
  from public.cash_charge_orders
  where id = p_charge_order_id
  for update;

  if not found then
    raise exception 'CHARGE_ORDER_NOT_FOUND';
  end if;

  if v_order.toss_payment_key is distinct from p_payment_key then
    raise exception 'PAYMENT_KEY_MISMATCH';
  end if;

  if v_status = 'succeeded' then
    if v_order.refunded_amount + p_cancel_amount > v_order.amount then
      raise exception 'REFUND_AMOUNT_EXCEEDS_CHARGE_ORDER';
    end if;

    update public.cash_charge_orders
    set
      refunded_amount = refunded_amount + p_cancel_amount,
      refunded_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    where id = v_order.id;
  end if;

  insert into public.cash_refund_request_cancellations (
    refund_request_id,
    charge_order_id,
    payment_key,
    cancel_amount,
    status,
    idempotency_key,
    provider_snapshot,
    failure_code,
    failure_message,
    processed_at
  )
  values (
    p_refund_request_id,
    p_charge_order_id,
    p_payment_key,
    p_cancel_amount,
    v_status,
    p_idempotency_key,
    coalesce(p_provider_snapshot, '{}'::jsonb),
    nullif(btrim(coalesce(p_failure_code, '')), ''),
    nullif(btrim(coalesce(p_failure_message, '')), ''),
    timezone('utc', now())
  )
  returning * into v_existing;

  return jsonb_build_object(
    'cancellationId',
    v_existing.id,
    'status',
    v_existing.status,
    'cancelAmount',
    v_existing.cancel_amount
  );
end;
$$;

create or replace function public.complete_cash_refund_request(
  p_request_id uuid,
  p_processed_amount integer,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.cash_refund_requests%rowtype;
  v_processed_amount integer := coalesce(p_processed_amount, 0);
  v_release_amount integer;
  v_balance_after integer;
  v_release_transaction_id uuid;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if v_processed_amount < 0 then
    raise exception 'INVALID_PROCESSED_AMOUNT';
  end if;

  select *
  into v_request
  from public.cash_refund_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'REFUND_REQUEST_NOT_FOUND';
  end if;

  if v_request.status in ('processed', 'rejected') then
    return jsonb_build_object(
      'requestId',
      v_request.id,
      'status',
      v_request.status,
      'requestedAmount',
      v_request.requested_amount
    );
  end if;

  if v_request.status <> 'pending' then
    raise exception 'REFUND_REQUEST_NOT_PENDING';
  end if;

  if v_processed_amount > v_request.requested_amount then
    raise exception 'PROCESSED_AMOUNT_EXCEEDS_REQUEST';
  end if;

  v_release_amount := v_request.requested_amount - v_processed_amount;

  if v_release_amount > 0 then
    perform public.ensure_cash_account(v_request.user_id);

    update public.cash_accounts
    set balance = balance + v_release_amount
    where user_id = v_request.user_id
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
      v_request.user_id,
      v_release_amount,
      v_balance_after,
      'refund_release',
      'refund_request',
      v_request.id,
      '결제수단 환불 미처리 캐시 반환'
    )
    returning id into v_release_transaction_id;
  end if;

  if v_processed_amount > 0 then
    update public.cash_refund_requests
    set
      status = 'processed',
      processed_at = timezone('utc', now()),
      decision_note = v_note,
      release_transaction_id = coalesce(v_release_transaction_id, release_transaction_id),
      updated_at = timezone('utc', now())
    where id = v_request.id;
  else
    update public.cash_refund_requests
    set
      status = 'rejected',
      rejected_at = timezone('utc', now()),
      decision_note = v_note,
      release_transaction_id = coalesce(v_release_transaction_id, release_transaction_id),
      updated_at = timezone('utc', now())
    where id = v_request.id;
  end if;

  return jsonb_build_object(
    'requestId',
    v_request.id,
    'status',
    case when v_processed_amount > 0 then 'processed' else 'rejected' end,
    'requestedAmount',
    v_request.requested_amount,
    'processedAmount',
    v_processed_amount,
    'releasedAmount',
    v_release_amount
  );
end;
$$;

create or replace function public.cancel_account_withdrawal(
  p_withdrawal_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.account_withdrawal_requests%rowtype;
  v_refund_request public.cash_refund_requests%rowtype;
  v_release_amount integer := 0;
begin
  select *
  into v_request
  from public.account_withdrawal_requests
  where id = p_withdrawal_request_id
  for update;

  if not found then
    raise exception 'WITHDRAWAL_REQUEST_NOT_FOUND';
  end if;

  if v_request.status = 'cancelled' then
    return jsonb_build_object(
      'withdrawalRequestId',
      v_request.id,
      'status',
      'cancelled'
    );
  end if;

  if v_request.status <> 'pending' then
    raise exception 'WITHDRAWAL_REQUEST_NOT_PENDING';
  end if;

  if v_request.refund_request_id is not null then
    select *
    into v_refund_request
    from public.cash_refund_requests
    where id = v_request.refund_request_id
    for update;

    if not found then
      raise exception 'REFUND_REQUEST_NOT_FOUND';
    end if;

    if v_refund_request.status = 'pending' then
      raise exception 'REFUND_REQUEST_NOT_RESOLVED';
    end if;

    if v_refund_request.status = 'processed' then
      if v_refund_request.release_transaction_id is not null then
        select coalesce(delta_amount, 0)
        into v_release_amount
        from public.cash_transactions
        where id = v_refund_request.release_transaction_id;
      end if;

      if coalesce(v_release_amount, 0) <= 0 then
        raise exception 'REFUND_REQUEST_ALREADY_PROCESSED';
      end if;
    end if;
  end if;

  delete from public.withdrawal_rejoin_blocks
  where user_id = v_request.user_id;

  update public.profiles
  set
    account_status = 'active',
    withdrawal_requested_at = null,
    withdrawn_at = null,
    active_session_key = gen_random_uuid()::text
  where id = v_request.user_id;

  update public.account_withdrawal_requests
  set
    status = 'cancelled',
    cancelled_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = v_request.id;

  return jsonb_build_object(
    'withdrawalRequestId',
    v_request.id,
    'status',
    'cancelled'
  );
end;
$$;

revoke execute on function public.submit_cash_refund_request() from public;
grant execute on function public.submit_cash_refund_request() to authenticated;

revoke execute on function public.submit_cash_refund_request(text, text, text) from public;
grant execute on function public.submit_cash_refund_request(text, text, text) to authenticated;

revoke execute on function public.record_cash_refund_cancellation_result(uuid, uuid, text, integer, text, text, jsonb, text, text) from authenticated;
revoke execute on function public.record_cash_refund_cancellation_result(uuid, uuid, text, integer, text, text, jsonb, text, text) from public;
grant execute on function public.record_cash_refund_cancellation_result(uuid, uuid, text, integer, text, text, jsonb, text, text) to service_role;

revoke execute on function public.complete_cash_refund_request(uuid, integer, text) from authenticated;
revoke execute on function public.complete_cash_refund_request(uuid, integer, text) from public;
grant execute on function public.complete_cash_refund_request(uuid, integer, text) to service_role;

revoke execute on function public.cancel_account_withdrawal(uuid) from authenticated;
revoke execute on function public.cancel_account_withdrawal(uuid) from public;
grant execute on function public.cancel_account_withdrawal(uuid) to service_role;
