alter table public.profiles
add column if not exists phone_number_e164 text,
add column if not exists phone_verified_at timestamptz,
add column if not exists phone_verification_required boolean not null default true;

create unique index if not exists profiles_phone_number_e164_key
on public.profiles (phone_number_e164)
where phone_number_e164 is not null;

create table if not exists public.phone_verification_requests (
  id uuid primary key default gen_random_uuid(),
  purpose text not null check (purpose in ('signup', 'activation')),
  user_id uuid references public.profiles (id) on delete cascade,
  phone_number_e164 text not null,
  code_hash text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'consumed', 'expired', 'blocked')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  last_sent_at timestamptz not null default timezone('utc', now()),
  request_ip text,
  user_agent text not null default '',
  vendor text not null default 'solapi',
  vendor_message_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists phone_verification_requests_phone_created_at_idx
on public.phone_verification_requests (phone_number_e164, created_at desc);

create index if not exists phone_verification_requests_status_created_at_idx
on public.phone_verification_requests (status, created_at desc);

create index if not exists phone_verification_requests_user_created_at_idx
on public.phone_verification_requests (user_id, created_at desc)
where user_id is not null;

alter table public.phone_verification_requests enable row level security;

update public.profiles
set phone_verification_required = true
where phone_verified_at is null;

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
    phone_verification_required
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url',
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
