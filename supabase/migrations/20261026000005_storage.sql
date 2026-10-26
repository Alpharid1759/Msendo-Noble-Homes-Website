-- supabase/migrations/20261026000005_storage.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media-raw', 'media-raw', false, 1073741824,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']),
  ('public-media', 'public-media', true, 1073741824,
    array['image/webp', 'image/jpeg', 'image/png', 'video/mp4'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "staff upload raw media into own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media-raw'
    and public.has_permission('media.upload')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "staff read own raw media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'media-raw'
    and public.has_permission('media.upload')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "staff update own raw media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'media-raw'
    and public.has_permission('media.upload')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "staff delete own raw media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media-raw'
    and public.has_permission('media.upload')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
