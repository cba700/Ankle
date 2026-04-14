alter table public.cash_transactions
drop constraint if exists cash_transactions_type_check;

alter table public.cash_transactions
add constraint cash_transactions_type_check
check (
  type in (
    'charge',
    'charge_refund',
    'match_debit',
    'match_refund',
    'adjustment',
    'refund_hold',
    'refund_release'
  )
);

alter table public.cash_transactions
drop constraint if exists cash_transactions_source_type_check;

alter table public.cash_transactions
add constraint cash_transactions_source_type_check
check (
  source_type in (
    'charge_order',
    'match_application',
    'admin_adjustment',
    'refund_request'
  )
);

create table if not exists public.cash_refund_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  requested_amount integer not null check (requested_amount > 0),
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'rejected', 'cancelled')),
  hold_transaction_id uuid references public.cash_transactions (id) on delete set null,
  release_transaction_id uuid references public.cash_transactions (id) on delete set null,
  decision_note text,
  processed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists cash_refund_requests_user_pending_key
on public.cash_refund_requests (user_id)
where status = 'pending';

create index if not exists cash_refund_requests_created_at_idx
on public.cash_refund_requests (created_at desc);

create index if not exists cash_refund_requests_status_created_at_idx
on public.cash_refund_requests (status, created_at desc);

drop trigger if exists set_cash_refund_requests_updated_at on public.cash_refund_requests;

create trigger set_cash_refund_requests_updated_at
before update on public.cash_refund_requests
for each row
execute function public.handle_updated_at();

grant select on public.cash_refund_requests to authenticated;

alter table public.cash_refund_requests enable row level security;

drop policy if exists "Users can read own cash refund requests" on public.cash_refund_requests;
create policy "Users can read own cash refund requests"
on public.cash_refund_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read cash refund requests" on public.cash_refund_requests;
create policy "Admins can read cash refund requests"
on public.cash_refund_requests
for select
to authenticated
using (public.is_admin());

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
declare
  v_user_id uuid := auth.uid();
  v_account public.cash_accounts%rowtype;
  v_request_id uuid := gen_random_uuid();
  v_bank_name text := btrim(coalesce(p_bank_name, ''));
  v_account_number text := regexp_replace(coalesce(p_account_number, ''), '\D', '', 'g');
  v_account_holder text := left(regexp_replace(btrim(coalesce(p_account_holder, '')), '\s+', ' ', 'g'), 40);
  v_requested_amount integer;
  v_balance_after integer;
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if v_bank_name not in (
    '국민은행',
    '신한은행',
    '우리은행',
    '하나은행',
    '농협은행',
    '기업은행',
    '카카오뱅크',
    '토스뱅크',
    '케이뱅크',
    'SC제일은행',
    '우체국',
    '수협은행',
    '새마을금고',
    '부산은행',
    '대구은행',
    '광주은행',
    '전북은행',
    '경남은행'
  ) then
    raise exception 'INVALID_BANK_NAME';
  end if;

  if length(v_account_number) < 8 or length(v_account_number) > 20 then
    raise exception 'INVALID_ACCOUNT_NUMBER';
  end if;

  if v_account_holder = '' then
    raise exception 'INVALID_ACCOUNT_HOLDER';
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
  v_requested_amount := v_account.balance;

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
    v_bank_name,
    v_account_number,
    v_account_holder,
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
    '캐시 환불 신청 접수'
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

create or replace function public.approve_cash_refund_request(
  p_request_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.cash_refund_requests%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  select *
  into v_request
  from public.cash_refund_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'REFUND_REQUEST_NOT_FOUND';
  end if;

  if v_request.status = 'processed' then
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

  update public.cash_refund_requests
  set
    status = 'processed',
    processed_at = timezone('utc', now()),
    decision_note = v_note,
    updated_at = timezone('utc', now())
  where id = v_request.id;

  return jsonb_build_object(
    'requestId',
    v_request.id,
    'status',
    'processed',
    'requestedAmount',
    v_request.requested_amount
  );
end;
$$;

create or replace function public.reject_cash_refund_request(
  p_request_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.cash_refund_requests%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_balance_after integer;
  v_transaction_id uuid;
begin
  select *
  into v_request
  from public.cash_refund_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'REFUND_REQUEST_NOT_FOUND';
  end if;

  if v_request.status = 'rejected' then
    select balance
    into v_balance_after
    from public.cash_accounts
    where user_id = v_request.user_id;

    return jsonb_build_object(
      'requestId',
      v_request.id,
      'status',
      v_request.status,
      'requestedAmount',
      v_request.requested_amount,
      'remainingCash',
      coalesce(v_balance_after, 0)
    );
  end if;

  if v_request.status <> 'pending' then
    raise exception 'REFUND_REQUEST_NOT_PENDING';
  end if;

  perform public.ensure_cash_account(v_request.user_id);

  update public.cash_accounts
  set balance = balance + v_request.requested_amount
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
    v_request.requested_amount,
    v_balance_after,
    'refund_release',
    'refund_request',
    v_request.id,
    '캐시 환불 신청 반려'
  )
  returning id into v_transaction_id;

  update public.cash_refund_requests
  set
    status = 'rejected',
    rejected_at = timezone('utc', now()),
    release_transaction_id = v_transaction_id,
    decision_note = v_note,
    updated_at = timezone('utc', now())
  where id = v_request.id;

  return jsonb_build_object(
    'requestId',
    v_request.id,
    'status',
    'rejected',
    'requestedAmount',
    v_request.requested_amount,
    'remainingCash',
    v_balance_after,
    'transactionId',
    v_transaction_id
  );
end;
$$;

revoke execute on function public.submit_cash_refund_request(text, text, text) from public;
grant execute on function public.submit_cash_refund_request(text, text, text) to authenticated;

revoke execute on function public.approve_cash_refund_request(uuid, text) from authenticated;
revoke execute on function public.approve_cash_refund_request(uuid, text) from public;
grant execute on function public.approve_cash_refund_request(uuid, text) to service_role;

revoke execute on function public.reject_cash_refund_request(uuid, text) from authenticated;
revoke execute on function public.reject_cash_refund_request(uuid, text) from public;
grant execute on function public.reject_cash_refund_request(uuid, text) to service_role;
