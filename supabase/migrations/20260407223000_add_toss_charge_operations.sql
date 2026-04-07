alter table public.cash_charge_orders
add column if not exists last_error_code text,
add column if not exists last_error_message text,
add column if not exists refunded_amount integer not null default 0 check (refunded_amount >= 0),
add column if not exists refunded_at timestamptz,
add column if not exists cancel_reason text;

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
    'adjustment'
  )
);

create table if not exists public.cash_charge_order_events (
  id uuid primary key default gen_random_uuid(),
  charge_order_id uuid references public.cash_charge_orders (id) on delete set null,
  order_id text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_result text not null default 'received',
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists cash_charge_order_events_provider_event_id_key
on public.cash_charge_order_events (provider_event_id);

create index if not exists cash_charge_order_events_order_id_created_at_idx
on public.cash_charge_order_events (order_id, created_at desc);

grant select on public.cash_charge_order_events to authenticated;

alter table public.cash_charge_order_events enable row level security;

drop policy if exists "Admins can read cash charge order events" on public.cash_charge_order_events;
create policy "Admins can read cash charge order events"
on public.cash_charge_order_events
for select
to authenticated
using (public.is_admin());

revoke execute on function public.approve_cash_charge_order(text, text, jsonb) from authenticated;
grant execute on function public.approve_cash_charge_order(text, text, jsonb) to service_role;

revoke execute on function public.adjust_cash_balance_by_admin(uuid, integer, text) from authenticated;
grant execute on function public.adjust_cash_balance_by_admin(uuid, integer, text) to service_role;
