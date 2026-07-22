# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan teacher quest workflow consolidation.

## Next Task

Sprint 12.18.13 - Teacher Quest Workflow Consolidation Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.12 added Settings-side publication-readiness guidance.
- Settings loads an owner-safe exact task count server-side through `getOwnedQuestTaskCount(questId)`.
- The helper validates UUID shape and authentication, verifies ownership with quest id plus authenticated `author_id`, returns `null` for missing, foreign, unauthenticated, or invalid requests, and counts `quest_tasks` only after ownership verification using exact count with `head: true`.
- Task count remains separate from the quest DTO and is passed to `QuestSettingsForm` as `taskCount`.
- Readiness messaging appears near the publication control for Draft zero-task, ready, and legacy Public zero-task states.
- The task link points to `/quests/[id]/tasks`.
- The publication checkbox remains enabled, and the server API remains the publication source of truth.
- Server-rendered count may be stale until refresh; no polling or client-side task-count fetch exists.
- Manual browser verification passed for Draft zero-task, Draft with tasks, and Public with tasks, and no data was modified.
- Publication API enforcement, direct API protection, legacy Public zero-task unpublishing, unrelated Settings saves, error/success display, `created=1` onboarding, owner-safe `notFound`, task CRUD, Preview, and Play/Test remain unchanged.
- No migration, schema, RLS/policy, index, polling, client-side task-count request, readiness metadata checklist, task CRUD refactor, publication API change, public catalog, or student-facing change was included.

Planning topics:

- Review the complete teacher flow: Library -> Create Draft -> Settings -> Tasks -> Preview -> Play/Test.
- Identify inconsistent routes between `/dashboard/quests` and `/quests`.
- Assess whether task editing should move under `/dashboard/quests/[id]/tasks`.
- Preserve backward-compatible redirects.
- Review workspace navigation consistency.
- Identify duplicate headings, guidance, status labels, and actions.
- Identify the smallest safe consolidation scope.
- Avoid broad redesign.
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
