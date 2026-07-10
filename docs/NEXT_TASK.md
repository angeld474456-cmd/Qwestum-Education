# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue teacher-facing quest management by planning the smallest safe auth and ownership implementation before adding persisted attempts or private teacher analytics.

## Next Task

Sprint 12.11.1 - Auth / Ownership Implementation Planning.

This task is analysis only. Do not write code.

Analyze:

- Whether `quests.author_id` exists in the live Supabase schema and migrations.
- How quest creation should set `author_id = auth.uid()` when ownership is implemented.
- How `getQuests()`, `getQuest(id)`, `updateQuest(id)`, and task helpers should be scoped after RLS is in place.
- Which dashboard routes should require an authenticated teacher session first.
- Whether public/student quest reads need separate service helpers to avoid exposing answer data.
- What migration or policy work is needed before persisted student attempts.
- Risks around changing current `/quests` and `/dashboard/quests` behavior.

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
