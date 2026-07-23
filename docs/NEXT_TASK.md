# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan controlled write verification for TaskForm points validation.

## Next Task

Sprint 12.18.34 - Points Validation Controlled Write Verification Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.33 completed TaskForm Points validation with raw string state, initial/success-reset `"1"`, temporary empty editing, digit-only safe-integer validation, minimum `1`, and numeric conversion only for the unchanged payload.
- The former root cause was numeric state with `Number(e.target.value)`, which converted empty input to `0` and blocked normal clear-and-retype editing.
- The exact inline error is `Баллы должны быть целым числом не меньше 1.` It appears after invalid submit, uses `aria-invalid` and `aria-describedby="task-points-error"`, clears after valid input, and invalid submit does not call `onSave`.
- POST and PATCH now both require points as a finite safe JSON integer at least `1`; numeric strings and other invalid JSON values are rejected, while omitted PATCH points leave the stored value unchanged.
- No-write browser verification passed: Backspace cleared `1` without producing `0`; replacement typing worked without Ctrl+A; empty and `0` submit showed the exact error without a create request or reset; `7` cleared the error; and normal typing changed `7` to `12`.
- No successful create request or task creation occurred, no Supabase data changed, and no cleanup was required. The `Promise<boolean>` contract, failed-create preservation, success reset, title alert, optional fields, types, labels, layout, selection, editor behavior, images, Preview, and publication/deletion guards remain unchanged.

Planning topics:

- Choose an existing owned disposable Draft quest.
- Create one temporary task with valid points.
- Verify numeric points persistence after reload.
- Verify successful reset returns points to `1`.
- Verify PATCH with a valid safe integer.
- Verify invalid values are blocked without modifying stored data.
- Plan exact deletion cleanup.
- No implementation or live write without explicit approval.
- No implementation until architecture approval.

Out of scope:

- Implementation before architecture approval or explicit live-write authorization.
- Route changes.
- API changes.
- Schema or migration changes.
- RLS policy changes.
- New indexes.
- Task content schema changes.
- Task type changes.
- Save or autosave changes.
- Storage writes.
- Runtime/student changes.
- Publication safety changes.
- Last-public-task deletion guard changes.
- Public catalog or student-facing changes.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
