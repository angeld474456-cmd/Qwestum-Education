# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan teacher-facing publication readiness guidance in Quest Settings.

## Next Task

Sprint 12.18.11 - Publication Readiness UX Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.8 requires at least one task only during Draft-to-Public transitions.
- Sprint 12.18.10 blocks deleting the last task from a Public quest.
- Teachers must explicitly unpublish before deleting the final task.
- Automatic unpublishing is not performed.
- The task route owner-safe quest lookup includes `is_public`.
- Draft quests skip the last-public-task readiness check.
- Public quests verify the target task before counting sibling tasks.
- Target task lookup remains scoped by task id and quest id.
- Task count runs only after authentication, ownership, and target-task verification.
- Task count uses `quest_tasks` with exact count and `head: true`.
- Client-provided task counts are not trusted.
- A Public quest with more than one task can still delete a task.
- A Public quest with one or fewer tasks returns HTTP 400 with `Сначала снимите квест с публикации, затем удалите последнее задание.`
- Blocked deletion performs no task deletion or Storage cleanup.
- Task-count failure returns the existing safe HTTP 500 response.
- Successful deletion response and Storage cleanup remain unchanged.
- `QuestTasksClient` already displays API errors and required no change.
- Manual browser verification passed.
- The task and Public state remained unchanged after refresh.
- Draft task deletion, Public multi-task deletion, generic 404, unauthenticated behavior, legacy Public zero-task quests, Preview, and Play/Test remain unchanged.
- Deferred limitations remain: count and deletion are non-transactional; concurrent deletion requests on a Public quest with multiple tasks could still race; a future transaction/RPC may provide stronger enforcement; no second confirmation or publication-aware delete UI was added.
- No automatic unpublishing, transaction/RPC, migration, schema, RLS/policy, index, `QuestTasksClient`, Settings, Preview, Play/Test, public catalog, student-facing, or quest deletion change was included.

Planning topics:

- Whether Settings should show task count.
- Whether Settings should show a compact publication-readiness checklist.
- How to explain that at least one task is required.
- Whether publication control should be disabled when task count is zero.
- Server/API remains the source of truth.
- Owner-safe task-count loading.
- Loading and stale-count behavior.
- Russian UX copy.
- Direct API compatibility.
- Exact files likely to change.
- Manual verification strategy.

Out of scope:

- Implementation before architecture approval.
- Quest deletion.
- New migrations unless explicitly approved after planning.
- Live Supabase writes.
- New RLS policies.
- New indexes.
- Public catalog or student-facing changes.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
