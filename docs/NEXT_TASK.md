# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Add a small teacher-facing subject selector using the verified existing subject lookup.

## Next Task

Sprint 12.17.5 - Teacher Quest Subject Selector.

Start implementation only after explicit approval.

Goal:

- Let teachers set an optional quest subject in Quest Settings using existing `quests.subject_id` and `public.subjects`.

Current state:

- Supabase SSR session foundation is implemented.
- Dashboard and teacher pages are protected.
- Owner-scoped quest and task CRUD is implemented.
- Quest/task RLS hardening is live.
- Quest Settings supports grade range and estimated duration.
- `quests.subject_id` is nullable UUID and references `public.subjects.id`.
- `public.subjects` has usable seeded rows.
- `public.subjects` RLS is enabled.
- Authenticated users have SELECT-only access to subjects.
- No subject INSERT, UPDATE, or DELETE policies exist.
- All current quests have `subject_id = null`.

Planned scope:

- Add `subject_id` to the active teacher quest DTO and selects.
- Add a server-side subject lookup using the authenticated Supabase server client.
- Add an optional subject selector to Quest Settings.
- Validate submitted UUID and subject existence in the owner-safe PATCH route.
- Allow `null` to clear subject.
- Display subject name in Teacher Library and Preview.
- Keep `NewQuestForm` unchanged.

Out of scope:

- Subject create/edit/delete UI.
- Taxonomy/admin UI.
- Hardcoded UUID mapping.
- Service role.
- New schema migration.
- Quest deletion.
- Task editor/runtime/JSONB changes.

Required verification:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
