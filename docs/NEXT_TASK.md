# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the next small teacher-MVP metadata improvement after grade range and duration.

## Next Task

Sprint 12.17.3 - Quest Subject Lookup Planning.

Start with analysis/planning only unless implementation is explicitly approved.

Goal:

- Verify whether existing `quests.subject_id` can support teacher-facing subject metadata without adding a duplicate subject text column.

Current state:

- Supabase SSR session foundation is implemented.
- Dashboard and teacher pages are protected.
- Owner-scoped quest and task CRUD is implemented.
- Quest/task RLS hardening is live.
- Owner-safe image upload, removal, replacement cleanup, and task-delete cleanup are implemented.
- Teacher logout/session UX and expired-session API `401` UX are implemented.
- Quest Settings now supports grade range and estimated duration.
- Migration 007 is applied live.
- `subject_id` exists in live `quests` but is not used by active teacher CRUD.
- No usable subject lookup model has been confirmed.
- No duplicate `subject` text column has been added.

Planning constraints:

- Do not create migrations without separate approval.
- Do not change RLS policies.
- Do not modify Supabase schema or data.
- Do not modify task editor/runtime/JSONB architecture.
- Do not add quest deletion unless explicitly required.
- Preserve existing auth/session behavior.
- Keep UI labels in English for new dashboard UI.
- Keep changes minimal and scoped.

Questions to answer:

- Does `quests.subject_id` have a live foreign key?
- What table does it reference, if any?
- Does the subject table have stable display-name fields and usable rows?
- Can authenticated teacher routes safely read subject names under current RLS?
- Should subject UI reuse `subject_id`, wait for seed/taxonomy repair, or be deferred?
- What is the smallest independently testable implementation sprint after planning?

Deferred items:

- Quest deletion.
- Student attempt persistence and analytics.
- Language.
- Tags/category.
- Quest cover image.
- Attempt limits.
- Catalog filtering/indexes.
- Cross-tab logout synchronization.
- Return-to-current-page after session expiry.
- Unsaved-edit persistence across login redirects.
- Private bucket or signed URL access.
- Magic-byte MIME validation.
- Legacy object migration.

Required verification for any future implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git status -sb
```
