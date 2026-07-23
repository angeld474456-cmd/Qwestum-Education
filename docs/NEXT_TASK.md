# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan small UX corrections for task creation and task card edit actions.

## Next Task

Sprint 12.18.23 - Task Creation and Card Action UX Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.21 controlled write verification passed through normal authenticated owner-safe teacher UI/API flows.
- Text task `TEMP - Points persistence text` verified points `7` persistence after save/reload, text/content persistence, internal `text` type, and visible `Текстовое задание` display.
- Single Choice task `TEMP - Points persistence single choice` verified points `9` persistence, `Alpha`/`Beta` option persistence, `Beta` correct answer persistence through `correctOptionId`, visible `Выбор одного ответа` display, and Preview reflecting the persisted correct answer.
- Cleanup passed: both temporary tasks were deleted, no temporary rows remain, no image was uploaded, no orphaned Storage object exists, no new quest was created, no Public quest was modified, no last-public-task deletion test occurred, and original quest/tasks were otherwise unchanged.
- Optional `points` PATCH support is browser-write verified.
- Two non-blocking UX issues remain: `TaskForm` Points input has an aria-label but no visible `Баллы` label; `TaskCard` pencil button is visible but does not independently open the editor.

Planning topics:

- Add a visible semantic `Баллы` label to `TaskForm`.
- Preserve the existing Points aria-label and submitted points behavior.
- Inspect `TaskCard` pencil button wiring.
- Make the pencil button invoke the existing task selection/edit handler.
- Prevent duplicate click behavior from card bubbling.
- Preserve delete button behavior.
- Preserve card selection behavior.
- Verify keyboard accessibility.
- Confirm exact files likely to change.
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
- Storage writes.
- Runtime/student changes.
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
