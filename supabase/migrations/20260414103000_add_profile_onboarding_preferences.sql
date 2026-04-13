alter table public.profiles
add column if not exists temporary_level text
  check (temporary_level is null or temporary_level in ('Basic 1', 'Middle 1', 'High 1', 'Star 1')),
add column if not exists preferred_weekdays text[] not null default '{}'
  check (
    preferred_weekdays <@ array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']::text[]
  ),
add column if not exists preferred_time_slots text[] not null default '{}'
  check (
    preferred_time_slots <@ array['morning', 'lunch', 'afternoon', 'evening']::text[]
  ),
add column if not exists onboarding_required boolean not null default false,
add column if not exists onboarding_completed_at timestamptz;

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
    onboarding_required
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url',
    true
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
