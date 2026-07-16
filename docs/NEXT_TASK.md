# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Improve session resilience for long-lived authenticated teacher workflows.

## Next Task

Sprint 12.16.3 - Expired Session / API 401 UX Planning.

Start with analysis/planning only unless implementation is explicitly approved.

Goal:

- Analyze the smallest safe UX improvement for expired-session API `401` responses in teacher pages.

Current state:

- Supabase SSR session foundation is implemented.
- `/dashboard` is protected by an authenticated server-side guard.
- POST-only logout is implemented and manually verified.
- Dashboard header shows teacher email and a `Sign out` control.
- Logout redirects to `/login?logged_out=1`.
- Login/callback feedback uses fixed allowlisted messages.
- Protected teacher API routes return JSON `401` when the session is missing.
- Feature flows currently handle API errors locally with generic messages.

Planning constraints:

- Do not change RLS policies.
- Do not modify Supabase schema or migrations.
- Do not modify quest/task CRUD semantics unless required for expired-session UX.
- Preserve the existing dashboard layout and disabled MVP sidebar links.
- Keep UI labels in English for new dashboard UI.
- Preserve Russian task editor text.
- Keep changes minimal and scoped.

Questions to answer:

- Which teacher client flows call protected APIs and may receive `401` during long sessions?
- Should expired-session UX be handled locally in each client component or through a small shared helper?
- Should a `401` redirect to `/login`, show a message, or both?
- How should unsaved task/editor state be handled if a session expires?
- Should cross-tab logout synchronization remain deferred?

Deferred items:

- Cross-tab logout synchronization.
- Role-aware teacher/student guards.
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
