alter table quest_tasks
add column if not exists content jsonb;
