alter table public.venues
add column if not exists weather_grid_nx integer check (weather_grid_nx > 0),
add column if not exists weather_grid_ny integer check (weather_grid_ny > 0);

alter table public.matches
add column if not exists weather_grid_nx integer check (weather_grid_nx > 0),
add column if not exists weather_grid_ny integer check (weather_grid_ny > 0);

update public.matches as matches
set
  weather_grid_nx = coalesce(matches.weather_grid_nx, venues.weather_grid_nx),
  weather_grid_ny = coalesce(matches.weather_grid_ny, venues.weather_grid_ny)
from public.venues as venues
where venues.id = matches.venue_id;

alter table public.notification_dispatches
drop constraint if exists notification_dispatches_event_type_check;

alter table public.notification_dispatches
add constraint notification_dispatches_event_type_check
check (
  event_type in (
    'cash_charged',
    'cash_refund_processed',
    'match_applied',
    'match_confirmed',
    'match_cancelled_user',
    'match_cancelled_admin',
    'match_reminder_day_before',
    'match_reminder_same_day',
    'no_show_notice',
    'rain_alert',
    'rain_alert_changed',
    'rain_match_cancelled'
  )
);

create table if not exists public.match_weather_states (
  match_id uuid primary key references public.matches (id) on delete cascade,
  last_checked_at timestamptz,
  forecast_base_at timestamptz,
  last_precipitation_mm numeric(6, 1),
  last_payload jsonb not null default '{}'::jsonb,
  rain_alert_sent_at timestamptz,
  rain_alert_changed_sent_at timestamptz,
  rain_cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_match_weather_states_updated_at on public.match_weather_states;

create trigger set_match_weather_states_updated_at
before update on public.match_weather_states
for each row
execute function public.handle_updated_at();

grant select, insert, update on public.match_weather_states to authenticated;

alter table public.match_weather_states enable row level security;

drop policy if exists "Admins can read match weather states" on public.match_weather_states;
create policy "Admins can read match weather states"
on public.match_weather_states
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage match weather states" on public.match_weather_states;
create policy "Admins can manage match weather states"
on public.match_weather_states
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
