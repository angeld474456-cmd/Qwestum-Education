-- Sprint 12.20.26: enforce the owner-safe atomic task-creation boundary.
-- Authenticated direct base-table INSERT is intentionally removed: task
-- creation must use public.create_owned_quest_task(...). RLS remains enabled,
-- and the existing SELECT, UPDATE, and DELETE policies are unchanged.

DROP POLICY IF EXISTS "Teachers can insert tasks for own quests"
ON public.quest_tasks;
