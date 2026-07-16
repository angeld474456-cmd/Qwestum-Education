# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Improve the authenticated teacher experience after owner-safe quest, task, and image flows are in place.

## Next Task

Sprint 12.16.1 - Teacher Logout / Session UX Planning.

Start with analysis/planning only unless implementation is explicitly approved.

Goal:

- Analyze the smallest safe logout/session UX improvement for authenticated teachers.

Current state:

- Supabase SSR session foundation is implemented.
- `/dashboard` is protected by an authenticated server-side guard.
- Owner-safe quest creation, settings save, dashboard reads, Preview, Play/Test, and task CRUD are implemented.
- Owner-safe task image upload, explicit removal, replacement cleanup, and task-delete cleanup are implemented and live-verified.
- Public reads remain for `quest-images`.
- Quest deletion remains intentionally postponed.

Planning constraints:

- Do not change RLS policies.
- Do not modify Supabase schema or migrations.
- Do not modify quest/task CRUD unless required for logout/session UX.
- Preserve the existing dashboard layout and disabled MVP sidebar links.
- Keep UI labels in English for new dashboard UI.
- Preserve Russian task editor text.
- Keep changes minimal and scoped.

Questions to answer:

- Where should a logout control live for MVP?
- Should logout be implemented through a server action, route handler, or client helper?
- How should the app redirect after logout?
- How should expired sessions be surfaced in dashboard pages?
- Should the teacher email or profile role be displayed now, or deferred?

Deferred items:

- Quest deletion.
- Private bucket or signed URL access.
- Magic-byte MIME validation.
- Legacy object migration.
- Student attempt persistence and analytics.

Required verification for any future implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git status -sb
```
