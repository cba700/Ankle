create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  image_url text not null check (char_length(btrim(image_url)) > 0),
  href text not null check (href = '/' or (href like '/%' and href not like '//%')),
  display_order integer not null default 100,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (starts_at is null or ends_at is null or starts_at < ends_at)
);

create index if not exists home_banners_public_order_idx
on public.home_banners (is_active, display_order, created_at);

drop trigger if exists set_home_banners_updated_at on public.home_banners;

create trigger set_home_banners_updated_at
before update on public.home_banners
for each row
execute function public.handle_updated_at();

grant select on public.home_banners to anon, authenticated;
grant insert, update, delete on public.home_banners to authenticated;

alter table public.home_banners enable row level security;

drop policy if exists "Public can read active home banners" on public.home_banners;
create policy "Public can read active home banners"
on public.home_banners
for select
to anon, authenticated
using (
  is_active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

drop policy if exists "Admins can manage home banners" on public.home_banners;
create policy "Admins can manage home banners"
on public.home_banners
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
