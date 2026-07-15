-- Harden teacher-owned quest data access.
--
-- Quest ownership is based on public.quests.author_id = auth.uid().
-- Task ownership is derived through the parent quest, because quest_tasks does
-- not directly store an owner id.
-- Direct anonymous access is intentionally removed from quests and quest_tasks.
-- Public/student task reads are not allowed here because task rows can expose
-- answers and task content such as single_choice correctOptionId.
-- No public storage policies are changed in this migration.

alter table public.quests enable row level security;
alter table public.quest_tasks enable row level security;

drop policy if exists "Allow insert quests" on public.quests;
drop policy if exists "Allow select quests" on public.quests;
drop policy if exists "Teachers can update own quests" on public.quests;

drop policy if exists "Allow delete quest_tasks" on public.quest_tasks;
drop policy if exists "Allow insert quest_tasks" on public.quest_tasks;
drop policy if exists "Allow select quest_tasks" on public.quest_tasks;
drop policy if exists "Allow update quest_tasks" on public.quest_tasks;

drop policy if exists "Teachers can select own quests" on public.quests;
drop policy if exists "Teachers can insert own quests" on public.quests;
drop policy if exists "Teachers can update own quests" on public.quests;

drop policy if exists "Teachers can select tasks for own quests" on public.quest_tasks;
drop policy if exists "Teachers can insert tasks for own quests" on public.quest_tasks;
drop policy if exists "Teachers can update tasks for own quests" on public.quest_tasks;
drop policy if exists "Teachers can delete tasks for own quests" on public.quest_tasks;

create policy "Teachers can select own quests"
on public.quests
for select
to authenticated
using (author_id = auth.uid());

create policy "Teachers can insert own quests"
on public.quests
for insert
to authenticated
with check (author_id = auth.uid());

create policy "Teachers can update own quests"
on public.quests
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "Teachers can select tasks for own quests"
on public.quest_tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.quests as parent_quest
    where parent_quest.id = quest_tasks.quest_id
      and parent_quest.author_id = auth.uid()
  )
);

create policy "Teachers can insert tasks for own quests"
on public.quest_tasks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.quests as parent_quest
    where parent_quest.id = quest_tasks.quest_id
      and parent_quest.author_id = auth.uid()
  )
);

create policy "Teachers can update tasks for own quests"
on public.quest_tasks
for update
to authenticated
using (
  exists (
    select 1
    from public.quests as parent_quest
    where parent_quest.id = quest_tasks.quest_id
      and parent_quest.author_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.quests as parent_quest
    where parent_quest.id = quest_tasks.quest_id
      and parent_quest.author_id = auth.uid()
  )
);

create policy "Teachers can delete tasks for own quests"
on public.quest_tasks
for delete
to authenticated
using (
  exists (
    select 1
    from public.quests as parent_quest
    where parent_quest.id = quest_tasks.quest_id
      and parent_quest.author_id = auth.uid()
  )
);

-- A quests DELETE policy is intentionally omitted. Direct quest deletion remains
-- denied by RLS until the product explicitly implements owner-safe quest
-- deletion. public.quest_tasks.quest_id has ON DELETE CASCADE to public.quests,
-- but quest deletion is not enabled in this Sprint.
