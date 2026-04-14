alter table public.profiles
add column if not exists legal_name text,
add column if not exists birth_date date,
add column if not exists gender text
  check (gender is null or gender in ('male', 'female')),
add column if not exists signup_profile_required boolean not null default false,
add column if not exists signup_profile_completed_at timestamptz;

create table if not exists public.profile_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  consent_type text not null
    check (consent_type in ('age_over_16', 'terms', 'privacy', 'marketing_profile', 'marketing_sms')),
  policy_version text not null,
  is_required boolean not null default false,
  is_agreed boolean not null default false,
  agreed_at timestamptz,
  source text not null default 'signup_form',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profile_consents_user_type_version_key
on public.profile_consents (user_id, consent_type, policy_version);

create index if not exists profile_consents_user_created_at_idx
on public.profile_consents (user_id, created_at desc);

drop trigger if exists set_profile_consents_updated_at on public.profile_consents;

create trigger set_profile_consents_updated_at
before update on public.profile_consents
for each row
execute function public.handle_updated_at();

alter table public.profile_consents enable row level security;

drop policy if exists "Users can read own profile consents" on public.profile_consents;
create policy "Users can read own profile consents"
on public.profile_consents
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile consents" on public.profile_consents;
create policy "Users can insert own profile consents"
on public.profile_consents
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile consents" on public.profile_consents;
create policy "Users can update own profile consents"
on public.profile_consents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

  return new;
end;
$$;
