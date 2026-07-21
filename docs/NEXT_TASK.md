# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest owner-safe quest cover image slice for the teacher MVP.

## Next Task

Sprint 12.17.8 - Quest Cover Image Planning.

Analysis/planning only. Start implementation only after explicit approval.

Goal:

- Determine whether quest cover images should be added next, how they should be stored, and how to keep ownership and Storage cleanup safe.

Current state:

- Supabase SSR session foundation is implemented.
- Dashboard and teacher pages are protected.
- Owner-scoped quest and task CRUD is implemented.
- Quest/task RLS hardening is live.
- Owner-safe task image upload, explicit removal, replacement cleanup, and task-delete cleanup are implemented.
- Quest Settings supports grade range, estimated duration, optional subject, and optional language.
- Teacher Library and Teacher Preview display populated metadata.
- `NewQuestForm` and Teacher Play/Test are unchanged for metadata.

Planning scope:

- Audit whether live `quests` already has a cover image field.
- Decide whether a nullable quest cover image URL belongs on `quests`.
- Plan owner-safe upload path shape and Storage policy needs.
- Plan Settings upload/removal/replacement behavior.
- Plan Teacher Library and Preview display behavior.
- Preserve existing task image behavior and owner-scoped quest access.

Out of scope:

- Quest deletion.
- Student catalog filtering.
- Subject administration or taxonomy UI.
- Language administration or i18n.
- Tags/category.
- Attempt limits.
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
