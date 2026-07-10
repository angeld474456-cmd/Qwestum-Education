# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue teacher-facing quest management by analyzing a minimal analytics surface without reworking the completed task editor or quest runtime architecture.

## Next Task

Sprint 12.8.1 - Teacher Quest Analytics Analysis.

This task is analysis only. Do not write code.

Analyze:

- What analytics data is already available from `quests` and `quest_tasks`.
- Whether MVP analytics can show task count, total points, difficulty, and publication state without new migrations.
- Whether analytics should live in `/dashboard/quests`, a new dashboard route, or a card inside settings.
- Whether student attempt/result analytics should wait until answer persistence exists.
- Risks around unsupported fields, Supabase query shape, duplicated task-count logic, and future attempt data.

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
