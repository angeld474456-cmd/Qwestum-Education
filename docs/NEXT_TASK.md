# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the safest successful task-creation regression verification after failure-state preservation.

## Next Task

Sprint 12.18.31 - Task Creation Success Regression Verification Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.30 fixed the create-form failure data-loss path in `QuestTasksClient` and `TaskForm` only.
- `TaskForm.onSave` now returns `Promise<boolean>` without changing the create payload.
- `handleCreateTask` returns `false` when busy, on session expiry, non-OK or malformed responses, and caught network/error paths; it returns `true` only after a valid created task is added and selected.
- `TaskForm` resets only on `true` and preserves title, description, correct answer, hint, task type, and points on `false`.
- Manual Offline verification passed: the request did not reach the server, `Не удалось создать задание.` displayed, no task or Supabase write occurred, all entered values remained, Network mode was restored, and the create action was not retried.
- Existing successful reset, error display, loading behavior, responsive layout, visible labels, pencil/delete/card behavior, points/correct-answer persistence, image controls, Preview, and last-Public-task guard remain unchanged.

Planning topics:

- Determine the safest disposable successful-create verification.
- Verify successful creation still resets all TaskForm fields.
- Verify the new task appears and becomes selected.
- Verify submitted type and points persist.
- Plan exact cleanup.
- Use only existing owned disposable Draft test data.
- Avoid Public quests.
- No live write until explicit approval.
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
