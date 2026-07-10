alter table public.quest_tasks
add column if not exists content jsonb;
