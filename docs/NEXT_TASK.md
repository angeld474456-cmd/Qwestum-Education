# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue teacher-facing quest management by analyzing authentication, authorization, and RLS boundaries before adding persisted attempts or student analytics.

## Next Task

Sprint 12.10.1 - Auth / RLS Boundaries Analysis.

This task is analysis only. Do not write code.

Analyze:

- Current auth/login state and any role assumptions in the codebase.
- Which teacher dashboard routes should be teacher-only.
- Which future student attempt data should be visible to teachers, students, schools, and admins.
- What RLS policies would be required before adding `quest_attempts` and `quest_attempt_answers`.
- Whether assignments/classes must exist before student analytics can be implemented safely.
- Risks around privacy, public quests, shared devices, and unauthenticated access.

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
