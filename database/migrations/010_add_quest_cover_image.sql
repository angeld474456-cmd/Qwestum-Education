-- Add optional quest cover image paths and owner-prefixed Storage policies.
-- Cover objects use:
-- teachers/{auth.uid()}/quests/{questId}/cover/{uuid}.{ext}
-- Existing task image policies and public read policy are intentionally left
-- unchanged.

alter table public.quests
add column if not exists cover_image_path text;

drop policy if exists "Teachers can upload own quest covers" on storage.objects;
drop policy if exists "Teachers can delete own quest covers" on storage.objects;

create policy "Teachers can upload own quest covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'quest-images'
  and (storage.foldername(name))[1] = 'teachers'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'quests'
  and (storage.foldername(name))[4] <> ''
  and (storage.foldername(name))[5] = 'cover'
  and (storage.foldername(name))[6] is null
  and name ~ (
    '^teachers/' || auth.uid()::text ||
    '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
);

create policy "Teachers can delete own quest covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'quest-images'
  and (storage.foldername(name))[1] = 'teachers'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'quests'
  and (storage.foldername(name))[4] <> ''
  and (storage.foldername(name))[5] = 'cover'
  and (storage.foldername(name))[6] is null
  and name ~ (
    '^teachers/' || auth.uid()::text ||
    '/quests/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](jpg|png|webp)$'
  )
);
