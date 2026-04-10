create table if not exists public.match_wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists match_wishlist_items_user_match_key
on public.match_wishlist_items (user_id, match_id);

create index if not exists match_wishlist_items_user_created_at_idx
on public.match_wishlist_items (user_id, created_at desc);

create index if not exists match_wishlist_items_match_id_idx
on public.match_wishlist_items (match_id);

grant select, insert, delete on public.match_wishlist_items to authenticated;

alter table public.match_wishlist_items enable row level security;

drop policy if exists "Users can read own wishlist items" on public.match_wishlist_items;
create policy "Users can read own wishlist items"
on public.match_wishlist_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own wishlist items" on public.match_wishlist_items;
create policy "Users can insert own wishlist items"
on public.match_wishlist_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own wishlist items" on public.match_wishlist_items;
create policy "Users can delete own wishlist items"
on public.match_wishlist_items
for delete
to authenticated
using (auth.uid() = user_id);
