# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest teacher-MVP tags/category metadata slice after subject, language, grade/duration, and cover image support.

## Next Task

Sprint 12.17.10 - Quest Tags / Category Planning.

Analysis/planning only. Start implementation only after explicit approval.

Goal:

- Decide whether tags/category should be added now, what schema or UI is justified for MVP, and how to avoid introducing taxonomy/admin complexity too early.

Current state:

- Supabase SSR session foundation is implemented.
- Dashboard and teacher pages are protected.
- Owner-scoped quest and task CRUD is implemented.
- Quest/task RLS hardening is live.
- Owner-safe task image upload, explicit removal, replacement cleanup, and task-delete cleanup are implemented.
- Quest Settings supports grade range, estimated duration, optional subject, optional language, and optional cover image.
- Teacher Library and Teacher Preview display populated metadata and cover images.
- `NewQuestForm` and Teacher Play/Test remain unchanged for cover and metadata.

Planning scope:

- Audit whether live `quests` already has tags/category-like columns.
- Decide whether tags/category should be nullable text, arrays, a lookup table, or deferred.
- Plan teacher Settings behavior only if the model is MVP-ready.
- Preserve owner-scoped quest access, current RLS, and existing metadata behavior.
- Keep public/student catalog filtering as a later step unless the data model requires planning now.

Out of scope:

- Quest deletion.
- Cover image enhancements.
- Student catalog filtering implementation.
- Subject or language administration.
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
