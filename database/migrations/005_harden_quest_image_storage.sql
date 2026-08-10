-- Harden quest image storage writes while keeping existing public URLs working.
-- Public read access remains temporarily because task image_url values currently
-- store public URLs from the public quest-images bucket.
-- New writes are restricted to authenticated owner-prefixed paths:
-- teachers/{auth.uid()}/quests/{questId}/tasks/{taskId}/{uuid}.{ext}
-- Legacy tasks/{uuid} objects are preserved. Cleanup and private bucket
-- migration are deferred.

drop policy if exists "Public upload quest images" on storage.objects;
drop policy if exists "Public update quest images" on storage.objects;
drop policy if exists "Public delete quest images" on storage.objects;

drop policy if exists "Teachers can upload own quest images" on storage.objects;

create policy "Teachers can upload own quest images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'quest-images'
  and (storage.foldername(name))[1] = 'teachers'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'quests'
  and (storage.foldername(name))[5] = 'tasks'
);

update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
where id = 'quest-images';
