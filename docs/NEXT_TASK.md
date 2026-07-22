# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the safest behavior when a published quest would lose its last task.

## Next Task

Sprint 12.18.9 - Published Quest Last-Task Deletion Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.8 implemented the first publication-readiness rule.
- Publication now requires at least one task only during a Draft-to-Public transition.
- Current `is_public` is loaded through the existing owner-safe quest lookup.
- Task count is queried only after authenticated ownership verification.
- Task count uses `quest_tasks` with exact count and `head: true`.
- Client-provided task counts are never trusted.
- Zero or null task count returns HTTP 400 with `Добавьте хотя бы одно задание перед публикацией.`
- The quest update is not executed when readiness validation fails.
- Task-count query failure uses the existing safe HTTP 500 response and does not expose Supabase internals.
- Direct API requests cannot bypass the rule.
- `QuestSettingsForm` already displayed the API error and required no change.
- Manual browser verification passed.
- The tested quest remained Draft after refresh.
- Draft remaining draft, public remaining public, editing already-public quests, and unpublishing do not trigger task counting.
- Legacy public zero-task quests are not modified automatically.
- Existing title, difficulty, metadata, authentication, ownership, 404, 401, Preview, and Play/Test zero-task behavior remains unchanged.
- Deferred limitations remain: deleting the last task from a public quest may still leave it public with zero tasks; the count and publication update are not transactional; full readiness checklist is deferred; subject, language, grade, duration, category, tags, description, and cover are not publication requirements yet.
- No migration, schema, RLS/policy, index, `QuestSettingsForm`, Preview, Play/Test, task deletion, public catalog, or student-facing change was included.

Planning topics:

- What should happen when deleting the last task from a published quest.
- Block deletion versus automatically unpublish.
- Server-side owner-safe enforcement.
- Direct API behavior.
- Concurrency and transaction limitations.
- UI warning and Russian error copy.
- Behavior for legacy published zero-task quests.
- Whether publication state should be returned with task deletion responses.
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
