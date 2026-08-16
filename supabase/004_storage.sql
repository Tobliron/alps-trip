-- ===========================================================================
-- Shugon : storage buckets for photos, GPX tracks, receipts and confirmations.
-- Run after 002. Safe to re-run.
-- ===========================================================================

-- trip-media : photos, trip covers, profile pictures, GPX tracks.
--   Public read, so <img src> and the map's GPX loader work without signing
--   every URL. Assume anything in here is world-readable.
insert into storage.buckets (id, name, public, file_size_limit)
values ('trip-media', 'trip-media', true, 15728640)          -- 15 MB per file
on conflict (id) do update set public = true, file_size_limit = 15728640;

-- trip-docs : booking confirmations, receipts, tickets.
--   Private. Reading requires a signed URL, which the app mints for viewers.
--   This is where anything with a name, a card, or a reference number goes.
insert into storage.buckets (id, name, public, file_size_limit)
values ('trip-docs', 'trip-docs', false, 15728640)
on conflict (id) do update set public = false, file_size_limit = 15728640;

-- ---------------------------------------------------------------------------
-- Access. Same rule as the tables: anyone can look, only an unlocked editor
-- can change anything. Uploading is a write, so it needs the Edit password.
-- ---------------------------------------------------------------------------
drop policy if exists "media public read"   on storage.objects;
drop policy if exists "media editor write"  on storage.objects;
drop policy if exists "media editor update" on storage.objects;
drop policy if exists "media editor delete" on storage.objects;
drop policy if exists "docs editor read"    on storage.objects;

create policy "media public read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'trip-media');

create policy "docs editor read" on storage.objects
  for select to authenticated using (bucket_id = 'trip-docs');

create policy "media editor write" on storage.objects
  for insert to authenticated with check (bucket_id in ('trip-media','trip-docs'));

create policy "media editor update" on storage.objects
  for update to authenticated
  using (bucket_id in ('trip-media','trip-docs'))
  with check (bucket_id in ('trip-media','trip-docs'));

create policy "media editor delete" on storage.objects
  for delete to authenticated using (bucket_id in ('trip-media','trip-docs'));

-- Path convention used by the app:
--   trip-media/{trip_slug}/cover.jpg
--   trip-media/{trip_slug}/people/{name}.jpg
--   trip-media/{trip_slug}/days/{day_id}/{uuid}-{filename}
--   trip-media/{trip_slug}/gpx/{activity_id}.gpx
--   trip-docs/{trip_slug}/receipts/{uuid}-{filename}
