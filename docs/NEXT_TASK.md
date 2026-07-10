# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue teacher-facing quest management by analyzing persisted attempts/results before adding student learning analytics.

## Next Task

Sprint 12.9.1 - Attempt Persistence / Student Analytics Analysis.

This task is analysis only. Do not write code.

Analyze:

- What data needs to be persisted for real student attempts and results.
- Whether future analytics need `quest_attempts` and `quest_attempt_answers` tables.
- How attempt persistence should relate to `QuestRunner`, `RuntimeContext`, and teacher Play/Test mode without disrupting current runtime behavior.
- Which data should be teacher-only and which, if any, should be visible to students later.
- Privacy, RLS, auth, schema, and migration risks.
- Whether implementation should wait until authentication/authorization boundaries are clearer.

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
