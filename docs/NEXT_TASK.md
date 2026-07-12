# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan safe quest ownership and dashboard authentication boundaries before implementing owned-only teacher queries, RLS policies, persisted attempts, or private teacher analytics.

## Next Task

Sprint 12.14.1 - Quest Ownership / Auth Guard Planning.

This task is analysis/planning only. Do not write code.

Analyze:

- Current quest ownership state, including existing live quests with `author_id IS NULL`.
- Whether `quests.author_id` type, nullability, and foreign key to `auth.users(id)` are confirmed.
- How to safely backfill or classify existing unowned/demo quests before owned-only dashboard queries.
- Current dashboard routes that do not enforce authentication, role, or ownership.
- How `/dashboard/quests`, settings, preview, play/test, and `/quests/[id]/tasks` should behave before and after auth guards.
- How public/student routes should differ from teacher dashboard routes.
- Current anonymous read exposure for `quests` and `quest_tasks`.
- Storage bucket and image policy uncertainty for `quest-images`.
- The safest implementation order for auth guard, quest creation ownership, owner-scoped queries, and RLS.

## Constraints

- Do not implement auth, RLS, migrations, services, or route changes without separate approval.
- Do not apply owned-only queries until existing `author_id IS NULL` quests have a safe plan.
- Do not modify task editor, runtime, or JSONB architecture unless explicitly approved.
- Do not create or modify Supabase data during analysis.
- Preserve Russian UI text.
- Prefer English UI labels in new dashboard pages to reduce encoding risk.
- Keep changes minimal and scoped.

## Required Verification

Before finishing any implementation:

```powershell
npm.cmd run lint
npm.cmd run build
```

Also check for mojibake before finalizing UI text changes:

```powershell
rg -n "Р вЂ™|Р Сњ|Р  |РЎвЂ№|РЎРЉ|СЂСџ" components app docs
```
