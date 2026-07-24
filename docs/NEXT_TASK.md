# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Verify the authoritative live schema and choose a safe public-read database boundary before catalog implementation.

## Next Task

Sprint 12.19.2 - Live Schema and Public Read Boundary Verification.

Read-only and verification-only. Do not implement, apply SQL, or perform a live write without architecture approval and explicit authorization.

Current state:

- Sprint 12.19.1 planning selected anonymous public catalog/detail browsing, login before start, and a server-rendered published-only database boundary with separate public quest and future student-task DTOs. Public catalog reads do not work under current owner-only RLS.
- `QuestRunner` is teacher-local and exposes `answer` plus `content.correctOptionId`; it must not be reused for public/student runtime. Keep `is_public` for initial publication, free-only catalog scope, `/catalog` and `/catalog/[id]`, then a later `/catalog/[id]/start` with safe local return handling.
- `001_initial_schema.sql` is empty, so local migrations are not authoritative for complete live schema. No live schema was inspected in Sprint 12.19.1; no service-role public client is approved. Existing owner task `select("*")` stays private.
- Preserve task-workspace QA separately: Settings navigation, deletion focus cases, create/reset, API-failure retention, session localization, busy semantics, Save associations, radio-group semantics, and native-confirm decision.

Planning topics:

- Inspect authoritative `public.quests` and `public.quest_tasks` columns, types, nullability, foreign keys, indexes, constraints, and current task ordering/content fields.
- Inspect applied RLS policies, functions, views, RPCs, and `quest-images`/cover read policies; compare live state to local migrations and TypeScript types and identify drift.
- Determine whether a view, RPC, or published-only policy is safest for a server-only anon-client public service without weakening teacher owner policies.
- Produce an exact proposed migration plan and rollback SQL, but do not apply SQL, change policy, create a view/RPC, or modify data.
- Define verification evidence needed before later catalog implementation and retain the separate task-workspace QA backlog.

Out of scope:

- SQL application, migrations, views, RPCs, or RLS/Storage policy changes.
- Catalog/detail/start routes, API/service implementation, runtime/student work, or publication behavior changes.
- Live data, Storage writes, task-content/type changes, saves/autosaves, or teacher workflow changes.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
