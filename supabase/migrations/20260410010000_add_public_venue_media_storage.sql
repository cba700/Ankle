insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'media-public',
  'media-public',
  true,
  10485760,
  array['image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view media-public objects" on storage.objects;
create policy "Public can view media-public objects"
on storage.objects
for select
to public
using (bucket_id = 'media-public');

drop policy if exists "Admins can upload media-public objects" on storage.objects;
create policy "Admins can upload media-public objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media-public'
  and public.is_admin()
);

drop policy if exists "Admins can update media-public objects" on storage.objects;
create policy "Admins can update media-public objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media-public'
  and public.is_admin()
)
with check (
  bucket_id = 'media-public'
  and public.is_admin()
);

drop policy if exists "Admins can delete media-public objects" on storage.objects;
create policy "Admins can delete media-public objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media-public'
  and public.is_admin()
);
