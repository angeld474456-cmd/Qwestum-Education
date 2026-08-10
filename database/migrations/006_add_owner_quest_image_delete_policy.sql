-- Allow authenticated teachers to delete only owner-prefixed quest images.
-- Storage RLS verifies the authenticated path prefix. The app route separately
-- verifies quest ownership and task relation before attempting cleanup.
-- Legacy tasks/{uuid} objects are intentionally not deletable through this
-- policy. The database image_url reference is cleared before best-effort
-- Storage cleanup.

drop policy if exists "Teachers can delete own quest images" on storage.objects;

create policy "Teachers can delete own quest images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'quest-images'
  and (storage.foldername(name))[1] = 'teachers'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'quests'
  and (storage.foldername(name))[5] = 'tasks'
);
