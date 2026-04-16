alter table public.profiles
add column if not exists account_status text not null default 'active'
  check (account_status in ('active', 'withdrawal_pending', 'withdrawn')),
add column if not exists withdrawal_requested_at timestamptz,
add column if not exists withdrawn_at timestamptz;

create index if not exists profiles_account_status_idx
on public.profiles (account_status);

create table if not exists public.account_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  refund_request_id uuid references public.cash_refund_requests (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),
  requested_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists account_withdrawal_requests_user_pending_key
on public.account_withdrawal_requests (user_id)
where status = 'pending';

create unique index if not exists account_withdrawal_requests_refund_request_key
on public.account_withdrawal_requests (refund_request_id)
where refund_request_id is not null;

create index if not exists account_withdrawal_requests_created_at_idx
on public.account_withdrawal_requests (created_at desc);

drop trigger if exists set_account_withdrawal_requests_updated_at on public.account_withdrawal_requests;

create trigger set_account_withdrawal_requests_updated_at
before update on public.account_withdrawal_requests
for each row
execute function public.handle_updated_at();

grant select on public.account_withdrawal_requests to authenticated;

alter table public.account_withdrawal_requests enable row level security;

drop policy if exists "Users can read own account withdrawal requests" on public.account_withdrawal_requests;
create policy "Users can read own account withdrawal requests"
on public.account_withdrawal_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read account withdrawal requests" on public.account_withdrawal_requests;
create policy "Admins can read account withdrawal requests"
on public.account_withdrawal_requests
for select
to authenticated
using (public.is_admin());

create table if not exists public.withdrawal_rejoin_blocks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone_number_e164 text not null,
  blocked_until timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists withdrawal_rejoin_blocks_phone_blocked_until_idx
on public.withdrawal_rejoin_blocks (phone_number_e164, blocked_until desc);

drop trigger if exists set_withdrawal_rejoin_blocks_updated_at on public.withdrawal_rejoin_blocks;

create trigger set_withdrawal_rejoin_blocks_updated_at
before update on public.withdrawal_rejoin_blocks
for each row
execute function public.handle_updated_at();

alter table public.withdrawal_rejoin_blocks enable row level security;

create or replace function public.finalize_account_withdrawal_request(
  p_withdrawal_request_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.account_withdrawal_requests%rowtype;
  v_refund_request public.cash_refund_requests%rowtype;
  v_profile public.profiles%rowtype;
  v_blocked_until timestamptz;
begin
  select *
  into v_request
  from public.account_withdrawal_requests
  where id = p_withdrawal_request_id
  for update;

  if not found then
    raise exception 'WITHDRAWAL_REQUEST_NOT_FOUND';
  end if;

  if v_request.status = 'completed' then
    select blocked_until
    into v_blocked_until
    from public.withdrawal_rejoin_blocks
    where user_id = v_request.user_id;

    return v_blocked_until;
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

    if v_refund_request.status <> 'processed' then
      raise exception 'REFUND_REQUEST_NOT_PROCESSED';
    end if;
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_request.user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_blocked_until :=
    coalesce(v_profile.withdrawal_requested_at, timezone('utc', now()))
    + interval '30 days';

  if v_profile.phone_number_e164 is not null then
    insert into public.withdrawal_rejoin_blocks (
      user_id,
      phone_number_e164,
      blocked_until
    )
    values (
      v_request.user_id,
      v_profile.phone_number_e164,
      v_blocked_until
    )
    on conflict (user_id) do update
    set
      phone_number_e164 = excluded.phone_number_e164,
      blocked_until = excluded.blocked_until,
      updated_at = timezone('utc', now());
  else
    delete from public.withdrawal_rejoin_blocks
    where user_id = v_request.user_id;
  end if;

  update public.user_coupons
  set status = 'expired'
  where user_id = v_request.user_id
    and status = 'available';

  update public.profiles
  set
    account_status = 'withdrawn',
    withdrawn_at = timezone('utc', now()),
    phone_number_e164 = null,
    phone_verified_at = null,
    phone_verification_required = true,
    active_session_key = gen_random_uuid()::text
  where id = v_request.user_id;

  update public.account_withdrawal_requests
  set
    status = 'completed',
    completed_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = v_request.id;

  return v_blocked_until;
end;
$$;

create or replace function public.begin_account_withdrawal(
  p_bank_name text default null,
  p_account_number text default null,
  p_account_holder text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_pending_refund public.cash_refund_requests%rowtype;
  v_existing_request public.account_withdrawal_requests%rowtype;
  v_refund_payload jsonb;
  v_refund_request_id uuid;
  v_requested_amount integer := 0;
  v_pending_charge_order_count integer := 0;
  v_upcoming_match_count integer := 0;
  v_withdrawal_request_id uuid := gen_random_uuid();
  v_requested_at timestamptz := timezone('utc', now());
  v_blocked_until timestamptz;
  v_status text := 'withdrawal_pending';
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if coalesce(v_profile.account_status, 'active') <> 'active' then
    raise exception 'ACCOUNT_NOT_ACTIVE';
  end if;

  select *
  into v_existing_request
  from public.account_withdrawal_requests
  where user_id = v_user_id
    and status = 'pending'
  limit 1
  for update;

  if found then
    raise exception 'ACCOUNT_WITHDRAWAL_ALREADY_PENDING';
  end if;

  select count(*)
  into v_upcoming_match_count
  from public.match_applications as applications
  inner join public.matches as matches
    on matches.id = applications.match_id
  where applications.user_id = v_user_id
    and applications.status = 'confirmed'
    and matches.start_at > timezone('utc', now());

  if v_upcoming_match_count > 0 then
    raise exception 'UPCOMING_MATCH_APPLICATIONS_EXIST';
  end if;

  select count(*)
  into v_pending_charge_order_count
  from public.cash_charge_orders
  where user_id = v_user_id
    and status = 'pending';

  if v_pending_charge_order_count > 0 then
    raise exception 'PENDING_CHARGE_ORDER_EXISTS';
  end if;

  select *
  into v_pending_refund
  from public.cash_refund_requests
  where user_id = v_user_id
    and status = 'pending'
  limit 1
  for update;

  if found then
    v_refund_request_id := v_pending_refund.id;
    v_requested_amount := v_pending_refund.requested_amount;
  else
    perform public.ensure_cash_account(v_user_id);

    select balance
    into v_requested_amount
    from public.cash_accounts
    where user_id = v_user_id;

    if coalesce(v_requested_amount, 0) > 0 then
      v_refund_payload := public.submit_cash_refund_request(
        p_bank_name,
        p_account_number,
        p_account_holder
      );
      v_refund_request_id := (v_refund_payload ->> 'requestId')::uuid;
      v_requested_amount := coalesce((v_refund_payload ->> 'requestedAmount')::integer, 0);
    end if;
  end if;

  insert into public.account_withdrawal_requests (
    id,
    user_id,
    refund_request_id,
    status,
    requested_at
  )
  values (
    v_withdrawal_request_id,
    v_user_id,
    v_refund_request_id,
    'pending',
    v_requested_at
  );

  update public.profiles
  set
    account_status = 'withdrawal_pending',
    withdrawal_requested_at = v_requested_at,
    active_session_key = gen_random_uuid()::text
  where id = v_user_id;

  if v_refund_request_id is null then
    v_blocked_until := public.finalize_account_withdrawal_request(
      v_withdrawal_request_id
    );
    v_status := 'withdrawn';
  end if;

  return jsonb_build_object(
    'withdrawalRequestId',
    v_withdrawal_request_id,
    'refundRequestId',
    v_refund_request_id,
    'requestedAmount',
    v_requested_amount,
    'status',
    v_status,
    'blockedUntil',
    v_blocked_until
  );
exception
  when unique_violation then
    if SQLERRM like '%account_withdrawal_requests_user_pending_key%' then
      raise exception 'ACCOUNT_WITHDRAWAL_ALREADY_PENDING';
    end if;

    if SQLERRM like '%cash_refund_requests_user_pending_key%' then
      raise exception 'PENDING_REFUND_REQUEST_EXISTS';
    end if;

    raise;
end;
$$;

create or replace function public.finalize_account_withdrawal(
  p_withdrawal_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.account_withdrawal_requests%rowtype;
  v_blocked_until timestamptz;
begin
  select *
  into v_request
  from public.account_withdrawal_requests
  where id = p_withdrawal_request_id
  for update;

  if not found then
    raise exception 'WITHDRAWAL_REQUEST_NOT_FOUND';
  end if;

  v_blocked_until := public.finalize_account_withdrawal_request(
    p_withdrawal_request_id
  );

  return jsonb_build_object(
    'withdrawalRequestId',
    v_request.id,
    'status',
    'withdrawn',
    'blockedUntil',
    v_blocked_until
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
  v_refund_status text;
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
    select status
    into v_refund_status
    from public.cash_refund_requests
    where id = v_request.refund_request_id
    for update;

    if not found then
      raise exception 'REFUND_REQUEST_NOT_FOUND';
    end if;

    if v_refund_status = 'processed' then
      raise exception 'REFUND_REQUEST_ALREADY_PROCESSED';
    end if;

    if v_refund_status = 'pending' then
      raise exception 'REFUND_REQUEST_NOT_RESOLVED';
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

create or replace function public.reactivate_withdrawn_account()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_rejoin_block public.withdrawal_rejoin_blocks%rowtype;
  v_blocked_until timestamptz;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if coalesce(v_profile.account_status, 'active') = 'active' then
    return jsonb_build_object(
      'status',
      'active'
    );
  end if;

  if v_profile.account_status = 'withdrawal_pending' then
    raise exception 'ACCOUNT_WITHDRAWAL_PENDING';
  end if;

  select *
  into v_rejoin_block
  from public.withdrawal_rejoin_blocks
  where user_id = v_user_id
  limit 1
  for update;

  v_blocked_until := coalesce(
    v_rejoin_block.blocked_until,
    coalesce(v_profile.withdrawal_requested_at, v_profile.withdrawn_at, timezone('utc', now()))
      + interval '30 days'
  );

  if v_blocked_until > timezone('utc', now()) then
    raise exception 'REJOIN_BLOCK_ACTIVE';
  end if;

  delete from public.withdrawal_rejoin_blocks
  where user_id = v_user_id;

  update public.profiles
  set
    account_status = 'active',
    withdrawal_requested_at = null,
    withdrawn_at = null,
    phone_number_e164 = null,
    phone_verified_at = null,
    phone_verification_required = true,
    active_session_key = gen_random_uuid()::text
  where id = v_user_id;

  return jsonb_build_object(
    'status',
    'active'
  );
end;
$$;

revoke execute on function public.finalize_account_withdrawal_request(uuid) from public;
revoke execute on function public.finalize_account_withdrawal_request(uuid) from authenticated;

revoke execute on function public.begin_account_withdrawal(text, text, text) from public;
grant execute on function public.begin_account_withdrawal(text, text, text) to authenticated;

revoke execute on function public.finalize_account_withdrawal(uuid) from authenticated;
revoke execute on function public.finalize_account_withdrawal(uuid) from public;
grant execute on function public.finalize_account_withdrawal(uuid) to service_role;

revoke execute on function public.cancel_account_withdrawal(uuid) from authenticated;
revoke execute on function public.cancel_account_withdrawal(uuid) from public;
grant execute on function public.cancel_account_withdrawal(uuid) to service_role;

revoke execute on function public.reactivate_withdrawn_account() from public;
grant execute on function public.reactivate_withdrawn_account() to authenticated;
