# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue teacher-facing quest management by planning the next workspace polish step without reworking the completed task editor or quest runtime architecture.

## Next Task

Sprint 12.7.1 - Teacher Workspace Breadcrumbs / Page Title Analysis.

This task is analysis only. Do not write code.

Analyze:

- Whether teacher workspace pages need shared breadcrumbs.
- Whether page titles should be standardized across settings, task editor, preview, and play/test.
- Whether `QuestWorkspaceNav` needs additional context such as the current quest title.
- How to improve navigation clarity without touching editor/runtime/JSONB architecture.
- Risks around Russian UI text, client/server component boundaries, layout shifts, and route duplication.

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
