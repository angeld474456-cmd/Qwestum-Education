# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan whether task action button clicks should be isolated from task card selection.

## Next Task

Sprint 12.18.25 - Task Action Event Isolation Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.24 implemented the approved small UX fixes for task creation and task card actions.
- `TaskForm` now has a visible semantic `Баллы` label associated with the Points input through `htmlFor="task-points"` and `id="task-points"`.
- Existing Points aria-label, value, min, onChange, default value, and submitted points behavior remain unchanged.
- `TaskCard` has an enabled pencil button with `type="button"` and a typed `onSelect` callback.
- Pencil click calls `event.stopPropagation()` and invokes the existing task selection/edit behavior exactly once.
- `TaskList` passes `onSelectTask(task)` into `TaskCard`; card click remains unchanged.
- Manual browser verification passed for label visibility, pencil edit action, card click selection, delete confirmation/deletion flow, and no reported console or layout issue.
- One test task was accidentally deleted during verification. All current quest/task data is test data, no production data was affected, no recovery is needed, and continued development is unaffected.
- Remaining non-blocking considerations: delete-button click still bubbles to the card wrapper; static `task-points` id is safe with the current single `TaskForm` instance but would need unique ids if multiple forms render simultaneously.

Planning topics:

- Inspect delete-button event propagation.
- Determine whether delete click should avoid selecting/opening the task card.
- Preserve confirmation and deletion behavior.
- Preserve last-public-task protection.
- Preserve keyboard accessibility.
- Avoid changing task CRUD APIs.
- Assess whether static `task-points` id needs future-proofing now or can remain deferred.
- Identify exact files likely to change.
- Define manual verification strategy.
- No implementation until architecture approval.

Out of scope:

- Implementation before architecture approval.
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
