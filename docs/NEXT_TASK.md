# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Review task-creation validation and UX after successful-create regression verification.

## Next Task

Sprint 12.18.32 - Task Creation Validation and UX Review Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.31 completed successful-create regression verification in owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`), which remained Draft.
- The temporary `TEMP - Sprint 12.18.31 Create Success DELETE ME` task used description `Disposable verification of successful task creation and form reset.`, correct answer `S31-CORRECT`, hint `S31-HINT`, `single_choice`, and points `7`.
- Add task was clicked once with no error; the task appeared once, became selected, opened its editor, and preserved `single_choice` / `Выбор одного ответа` and points `7`.
- TaskForm reset only after success: title, description, correct answer, and hint cleared; type returned to `text`; points returned to `1`; button/loading returned to normal.
- Expected Single Choice validation appeared because no options were added: `Добавьте минимум два варианта ответа.` and `Выберите один правильный ответ.` No editor save was performed.
- Cleanup confirmed the exact task's type and points, confirmed the native dialog once, deleted only the temporary task, restored the baseline empty list, produced no unexpected error, left no residue, and preserved Draft status.
- The create endpoint/payload, `Promise<boolean>` failure preservation, responsive layout, visible labels, card actions, points/correct-answer persistence, image controls, Preview, and last-Public-task guard remain unchanged.
- Browser-observed deferred finding: the TaskForm Points input converts a cleared value to `0`, so it cannot remain temporarily empty; replacing its value requires selecting the current value first or using the numeric stepper. This does not block creation or editing and is a UX/validation concern, not a persistence failure.

Planning topics:

- Review current client-side validation for task creation.
- Identify missing validation beyond title.
- Review number and range handling for points.
- Review temporary empty-state handling for the task-creation Points input.
- Decide whether `0` must be rejected and how positive-integer validation should work.
- Review default points behavior and keyboard editing without requiring Ctrl+A.
- Review task-type-specific creation requirements.
- Review accessibility and error-message clarity.
- Identify the smallest safe improvement.
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
