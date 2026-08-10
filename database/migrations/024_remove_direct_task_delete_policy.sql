-- Sprint 12.20.27: enforce the owner-safe atomic task-deletion boundary.
-- Authenticated direct base-table DELETE is intentionally removed: task
-- deletion must use public.delete_owned_quest_task(...). RLS remains enabled,
-- and the existing SELECT and UPDATE policies are unchanged.

DROP POLICY IF EXISTS "Teachers can delete tasks for own quests"
ON public.quest_tasks;
