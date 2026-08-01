-- Allow authenticated teachers to delete only quests they own.
-- Child tasks are removed by the existing ON DELETE CASCADE foreign key.

CREATE POLICY "Teachers can delete own quests"
ON public.quests
FOR DELETE
TO authenticated
USING (author_id = auth.uid());
