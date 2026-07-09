# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue teacher-facing quest management by analyzing route consistency and workspace polish without reworking the completed task editor or quest runtime architecture.

## Next Task

Sprint 12.6.1 - Teacher Workspace Polish / Route Consistency Analysis.

This task is analysis only. Do not write code.

Analyze:

- Whether `/quests/[id]` should remain as a legacy/detail route.
- Whether Open / Edit quest in `/dashboard/quests` should point to `/dashboard/quests/[id]/settings` instead of `/quests/[id]`.
- Whether teacher routes need breadcrumbs or clearer page titles.
- Whether to create `/dashboard/quests/[id]/tasks` later.
- Route consistency between dashboard and non-dashboard pages.
- Risks of changing existing `/quests` routes.

## Constraints

- Do not refactor completed editor/runtime architecture without permission.
- Do not touch editor, runtime, or JSONB architecture unless explicitly approved.
- Preserve Russian UI text.
- Prefer English UI labels in new dashboard pages to reduce encoding risk.
- Keep changes minimal and scoped.
- Reuse existing Supabase service helpers when possible.
- Add small service helpers only when needed.

## Required Verification

Before finishing any implementation:

```powershell
npm.cmd run lint
npm.cmd run build
```

Also check for mojibake before finalizing UI text changes:

```powershell
rg -n "Р’|Рќ|Р |С‹|СЊ|рџ" components app docs
```
