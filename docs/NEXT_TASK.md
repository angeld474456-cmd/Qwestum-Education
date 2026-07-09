# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue teacher-facing quest management by planning task editor dashboard integration without reworking the completed task editor or quest runtime architecture.

## Next Task

Sprint 12.5.1 — Teacher Task Editor Dashboard Integration Analysis.

This task is analysis only. Do not write code.

Analyze:

- `app/quests/[id]/tasks/page.tsx`.
- Whether to add `QuestWorkspaceNav` directly there.
- Whether to create `/dashboard/quests/[id]/tasks` later.
- Whether to leave the existing task editor route untouched for now.
- Risks around scroll behavior, autosave, task selection, image upload, `TaskEditor` state, client/server mismatch, route duplication, mojibake, lint, and build.

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
