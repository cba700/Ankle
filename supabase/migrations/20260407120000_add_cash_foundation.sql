create table if not exists public.cash_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_cash_accounts_updated_at on public.cash_accounts;

create trigger set_cash_accounts_updated_at
before update on public.cash_accounts
for each row
execute function public.handle_updated_at();

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta_amount integer not null check (delta_amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  type text not null check (type in ('charge', 'match_debit', 'match_refund', 'adjustment')),
  source_type text not null check (source_type in ('charge_order', 'match_application', 'admin_adjustment')),
  source_id uuid,
  memo text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists cash_transactions_source_once_key
on public.cash_transactions (source_type, source_id, type)
where source_id is not null;

create index if not exists cash_transactions_user_created_at_idx
on public.cash_transactions (user_id, created_at desc);

create table if not exists public.cash_charge_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id text not null unique,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'expired')),
  toss_payment_key text,
  approved_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  failure_message text,
  provider_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists cash_charge_orders_payment_key_key
on public.cash_charge_orders (toss_payment_key)
where toss_payment_key is not null;

create index if not exists cash_charge_orders_user_created_at_idx
on public.cash_charge_orders (user_id, created_at desc);

drop trigger if exists set_cash_charge_orders_updated_at on public.cash_charge_orders;

create trigger set_cash_charge_orders_updated_at
before update on public.cash_charge_orders
for each row
execute function public.handle_updated_at();

insert into public.cash_accounts (user_id)
select id
from public.profiles
on conflict (user_id) do nothing;

alter table public.match_applications
add column if not exists price_snapshot integer,
add column if not exists cash_debit_transaction_id uuid references public.cash_transactions (id) on delete set null,
add column if not exists cash_refund_transaction_id uuid references public.cash_transactions (id) on delete set null,
add column if not exists refunded_amount integer not null default 0 check (refunded_amount >= 0),
add column if not exists refunded_at timestamptz;

update public.match_applications as applications
set price_snapshot = matches.price
from public.matches as matches
where applications.match_id = matches.id
  and applications.price_snapshot is null;

alter table public.match_applications
alter column price_snapshot set not null;

grant select on public.cash_accounts to authenticated;
grant select on public.cash_transactions to authenticated;
grant select on public.cash_charge_orders to authenticated;

alter table public.cash_accounts enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.cash_charge_orders enable row level security;

drop policy if exists "Users can read own cash account" on public.cash_accounts;
create policy "Users can read own cash account"
on public.cash_accounts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read cash accounts" on public.cash_accounts;
create policy "Admins can read cash accounts"
on public.cash_accounts
for select
to authenticated
using (public.is_admin());

drop policy if exists "Users can read own cash transactions" on public.cash_transactions;
create policy "Users can read own cash transactions"
on public.cash_transactions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read cash transactions" on public.cash_transactions;
create policy "Admins can read cash transactions"
on public.cash_transactions
for select
to authenticated
using (public.is_admin());

drop policy if exists "Users can read own cash charge orders" on public.cash_charge_orders;
create policy "Users can read own cash charge orders"
on public.cash_charge_orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read cash charge orders" on public.cash_charge_orders;
create policy "Admins can read cash charge orders"
on public.cash_charge_orders
for select
to authenticated
using (public.is_admin());

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
    avatar_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  insert into public.cash_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.ensure_cash_account(p_user_id uuid)
returns public.cash_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.cash_accounts%rowtype;
begin
  insert into public.cash_accounts (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into v_account
  from public.cash_accounts
  where user_id = p_user_id
  for update;

  return v_account;
end;
$$;

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
  v_hours_until_start numeric;
begin
  if p_cancelled_by_admin then
    return greatest(p_amount, 0);
  end if;

  v_hours_until_start := extract(epoch from (p_start_at - now())) / 3600;

  if v_hours_until_start >= 24 then
    return greatest(p_amount, 0);
  end if;

  if v_hours_until_start >= 6 then
    return greatest(floor(p_amount * 0.5), 0);
  end if;

  return 0;
end;
$$;

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

  v_account := public.ensure_cash_account(v_user_id);

  if v_account.balance < v_match.price then
    raise exception 'INSUFFICIENT_CASH';
  end if;

  update public.cash_accounts
  set balance = balance - v_match.price
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
    -v_match.price,
    v_balance_after,
    'match_debit',
    'match_application',
    v_application_id,
    '매치 신청 차감'
  )
  returning id into v_transaction_id;

  insert into public.match_applications (
    id,
    match_id,
    user_id,
    status,
    price_snapshot,
    cash_debit_transaction_id
  )
  values (
    v_application_id,
    p_match_id,
    v_user_id,
    'confirmed',
    v_match.price,
    v_transaction_id
  );

  return jsonb_build_object(
    'applicationId',
    v_application_id,
    'debitedAmount',
    v_match.price,
    'remainingCash',
    v_balance_after
  );
exception
  when unique_violation then
    raise exception 'ALREADY_APPLIED';
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
  v_refund_amount integer := 0;
  v_transaction_id uuid;
  v_balance_after integer;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select
    applications.id,
    applications.price_snapshot,
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

  v_refund_amount := public.get_match_refund_amount(
    v_application.price_snapshot,
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
      applications.price_snapshot
    from public.match_applications as applications
    where applications.match_id = p_match_id
      and applications.status = 'confirmed'
    order by applications.applied_at asc
    for update of applications
  loop
    perform public.ensure_cash_account(v_application.user_id);

    update public.cash_accounts
    set balance = balance + v_application.price_snapshot
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
      v_application.price_snapshot,
      v_balance_after,
      'match_refund',
      'match_application',
      v_application.id,
      '운영 취소 환급'
    )
    returning id into v_transaction_id;

    update public.match_applications
    set
      status = 'cancelled_by_admin',
      cancel_reason = p_reason,
      cancelled_at = timezone('utc', now()),
      refunded_amount = v_application.price_snapshot,
      refunded_at = timezone('utc', now()),
      cash_refund_transaction_id = v_transaction_id
    where id = v_application.id;

    v_cancelled_count := v_cancelled_count + 1;
  end loop;

  return v_cancelled_count;
end;
$$;

create or replace function public.adjust_cash_balance_by_admin(
  p_user_id uuid,
  p_amount integer,
  p_memo text default '운영 보정'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.cash_accounts%rowtype;
  v_balance_after integer;
  v_transaction_id uuid;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_amount = 0 then
    raise exception 'INVALID_ADJUSTMENT_AMOUNT';
  end if;

  v_account := public.ensure_cash_account(p_user_id);

  if p_amount < 0 and v_account.balance < abs(p_amount) then
    raise exception 'INSUFFICIENT_CASH';
  end if;

  update public.cash_accounts
  set balance = balance + p_amount
  where user_id = p_user_id
  returning balance into v_balance_after;

  insert into public.cash_transactions (
    user_id,
    delta_amount,
    balance_after,
    type,
    source_type,
    memo
  )
  values (
    p_user_id,
    p_amount,
    v_balance_after,
    'adjustment',
    'admin_adjustment',
    p_memo
  )
  returning id into v_transaction_id;

  return jsonb_build_object(
    'transactionId',
    v_transaction_id,
    'remainingCash',
    v_balance_after
  );
end;
$$;

create or replace function public.create_cash_charge_order(
  p_order_id text,
  p_amount integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.cash_charge_orders%rowtype;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_amount <= 0 then
    raise exception 'INVALID_CHARGE_AMOUNT';
  end if;

  insert into public.cash_charge_orders (
    user_id,
    order_id,
    amount,
    status
  )
  values (
    v_user_id,
    p_order_id,
    p_amount,
    'pending'
  )
  on conflict (order_id) do nothing;

  select *
  into v_order
  from public.cash_charge_orders
  where order_id = p_order_id
  for update;

  if v_order.user_id <> v_user_id then
    raise exception 'CHARGE_ORDER_ALREADY_EXISTS';
  end if;

  return jsonb_build_object(
    'chargeOrderId',
    v_order.id,
    'orderId',
    v_order.order_id,
    'amount',
    v_order.amount,
    'status',
    v_order.status
  );
end;
$$;

create or replace function public.approve_cash_charge_order(
  p_order_id text,
  p_toss_payment_key text,
  p_provider_snapshot jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.cash_charge_orders%rowtype;
  v_balance_after integer;
  v_transaction_id uuid;
begin
  if p_toss_payment_key is null or btrim(p_toss_payment_key) = '' then
    raise exception 'INVALID_PAYMENT_KEY';
  end if;

  select *
  into v_order
  from public.cash_charge_orders
  where order_id = p_order_id
  for update;

  if not found then
    raise exception 'CHARGE_ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'paid' then
    select balance
    into v_balance_after
    from public.cash_accounts
    where user_id = v_order.user_id;

    return jsonb_build_object(
      'chargeOrderId',
      v_order.id,
      'orderId',
      v_order.order_id,
      'amount',
      v_order.amount,
      'remainingCash',
      coalesce(v_balance_after, 0),
      'status',
      v_order.status
    );
  end if;

  if v_order.status <> 'pending' then
    raise exception 'CHARGE_ORDER_NOT_PENDING';
  end if;

  perform public.ensure_cash_account(v_order.user_id);

  update public.cash_accounts
  set balance = balance + v_order.amount
  where user_id = v_order.user_id
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
    v_order.user_id,
    v_order.amount,
    v_balance_after,
    'charge',
    'charge_order',
    v_order.id,
    '캐시 충전'
  )
  returning id into v_transaction_id;

  update public.cash_charge_orders
  set
    status = 'paid',
    toss_payment_key = p_toss_payment_key,
    approved_at = timezone('utc', now()),
    provider_snapshot = coalesce(p_provider_snapshot, '{}'::jsonb),
    updated_at = timezone('utc', now())
  where id = v_order.id;

  return jsonb_build_object(
    'chargeOrderId',
    v_order.id,
    'orderId',
    v_order.order_id,
    'amount',
    v_order.amount,
    'remainingCash',
    v_balance_after,
    'transactionId',
    v_transaction_id,
    'status',
    'paid'
  );
exception
  when unique_violation then
    raise exception 'CHARGE_ALREADY_APPLIED';
end;
$$;

grant execute on function public.ensure_cash_account(uuid) to authenticated;
grant execute on function public.get_match_refund_amount(integer, timestamptz, boolean) to authenticated;
grant execute on function public.apply_to_match(uuid) to authenticated;
grant execute on function public.cancel_match_application(uuid) to authenticated;
grant execute on function public.cancel_match_applications_by_admin(uuid, text) to authenticated;
grant execute on function public.adjust_cash_balance_by_admin(uuid, integer, text) to authenticated;
grant execute on function public.create_cash_charge_order(text, integer) to authenticated;
grant execute on function public.approve_cash_charge_order(text, text, jsonb) to authenticated;
