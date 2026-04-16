create table if not exists public.notification_dispatches (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null,
  event_type text not null check (
    event_type in (
      'cash_charged',
      'match_confirmed',
      'match_cancelled_user',
      'match_cancelled_admin',
      'match_reminder_day_before',
      'match_reminder_same_day',
      'no_show_notice'
    )
  ),
  status text not null default 'queued' check (
    status in ('queued', 'scheduled', 'sent', 'cancelled', 'failed', 'skipped')
  ),
  channel text not null default 'kakao' check (channel in ('kakao')),
  user_id uuid references public.profiles (id) on delete set null,
  phone_number_e164 text,
  match_id uuid references public.matches (id) on delete set null,
  application_id uuid references public.match_applications (id) on delete set null,
  charge_order_id uuid references public.cash_charge_orders (id) on delete set null,
  provider_group_id text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists notification_dispatches_dedupe_key_key
on public.notification_dispatches (dedupe_key);

create index if not exists notification_dispatches_application_event_idx
on public.notification_dispatches (application_id, event_type)
where application_id is not null;

create index if not exists notification_dispatches_match_event_idx
on public.notification_dispatches (match_id, event_type)
where match_id is not null;

create index if not exists notification_dispatches_charge_order_event_idx
on public.notification_dispatches (charge_order_id, event_type)
where charge_order_id is not null;

create index if not exists notification_dispatches_status_created_at_idx
on public.notification_dispatches (status, created_at desc);

drop trigger if exists set_notification_dispatches_updated_at on public.notification_dispatches;

create trigger set_notification_dispatches_updated_at
before update on public.notification_dispatches
for each row
execute function public.handle_updated_at();

alter table public.notification_dispatches enable row level security;
