# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the next small teacher-MVP improvement after auth/session hardening.

## Next Task

Sprint 12.17.1 - Quest Settings Metadata Planning.

Start with analysis/planning only unless implementation is explicitly approved.

Goal:

- Analyze the smallest safe expansion of quest settings metadata for the teacher MVP.

Current state:

- Supabase SSR session foundation is implemented.
- Dashboard and teacher pages are protected.
- Owner-scoped quest and task CRUD is implemented.
- Quest/task RLS hardening is live.
- Owner-safe image upload, removal, replacement cleanup, and task-delete cleanup are implemented.
- Teacher logout/session UX is implemented.
- Expired-session API `401` UX is implemented for current teacher client workflows.
- Current quest settings edit only `title`, `description`, `difficulty`, and `is_public`.

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

- Which quest metadata fields are most valuable for the teacher MVP?
- Should fields such as duration, attempts, grade level, subject, or publish notes be added now or deferred?
- Which metadata can be represented with existing schema fields, if any?
- Which metadata requires schema changes or live Supabase migration planning?
- Should the settings page remain the only place for metadata, or should the library cards show some of it?
- What is the smallest independently testable implementation sprint after planning?

Deferred items:

- Quest deletion.
- Student attempt persistence and analytics.
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
