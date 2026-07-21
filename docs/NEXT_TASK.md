# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest teacher-facing language metadata slice after subject selection.

## Next Task

Sprint 12.17.6 - Quest Language Metadata Planning.

Analysis/planning only. Start implementation only after explicit approval.

Goal:

- Determine whether quest language metadata should be added next for the teacher MVP, and whether it needs a nullable schema migration or can reuse existing schema.

Current state:

- Supabase SSR session foundation is implemented.
- Dashboard and teacher pages are protected.
- Owner-scoped quest and task CRUD is implemented.
- Quest/task RLS hardening is live.
- Quest Settings supports grade range, estimated duration, and optional subject selection.
- `quests.subject_id` uses the existing `public.subjects` lookup.
- Teacher Library and Teacher Preview display populated metadata.
- `NewQuestForm` and Teacher Play/Test are unchanged for metadata.

Planning scope:

- Audit local and live schema for any existing language field or related metadata.
- Decide whether language belongs on `quests` as a nullable value.
- Define a minimal fixed option set if language is implemented.
- Plan Settings validation, Dashboard display, and Preview display.
- Preserve owner-scoped settings save and existing RLS boundaries.

Out of scope:

- Subject administration or taxonomy UI.
- Subject catalog filtering.
- Tags/category.
- Quest cover image.
- Attempt limits.
- Student catalog changes.
- Quest deletion.
- Task editor/runtime/JSONB changes.

Required validation for any implementation sprint:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
