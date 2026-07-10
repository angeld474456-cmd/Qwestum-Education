# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue teacher-facing quest management by planning schema repair before auth, ownership, persisted attempts, or private teacher analytics.

## Next Task

Sprint 12.12.1 - Schema Repair / Migration Planning.

This task is analysis only. Do not write code.

Analyze:

- Why live `quest_tasks.content` is missing even though local migration/code/runtime expect it.
- Whether local migrations should be repaired, replaced, or supplemented with a new forward migration.
- How to safely add or confirm `quest_tasks.content jsonb` in live Supabase.
- How to handle existing tasks after adding `content`.
- How to backfill or assign ownership for existing quests where `author_id IS NULL`.
- Whether `quests.author_id` type, nullability, and foreign key should be confirmed or changed.
- Which RLS policies should be planned after schema repair.
- Risks around applying migrations to live data.

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
