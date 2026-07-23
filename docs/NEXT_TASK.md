# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan live-write verification for the localized teacher task editor.

## Next Task

Sprint 12.18.21 - Task Editor Write Verification Planning.

Planning only. Do not perform live writes until explicit product-owner approval.

Current state:

- Sprint 12.18.20 localized teacher task-editor copy for `QuestTasksClient`, `TaskForm`, `TaskCard`, `TextTaskEditor`, `SingleChoiceTaskEditor`, and `ImageUploader`.
- Task type display names are `Текстовое задание` for `text` and `Выбор одного ответа` for `single_choice`; stored identifiers, unions, registry keys, payloads, and API contracts remain unchanged.
- Unknown future task types fall back to the raw identifier.
- Correct-answer radio selection now has `value={option.id}` plus defensive `onClick={() => setCorrectOptionId(option.id)}` while preserving `checked` and `onChange`; browser verification confirmed selection, validation disappearance, Save enablement, and Preview synchronization.
- Editable Points support now uses local string state in Text and Single Choice editors, validates non-empty finite integers at least `1`, rejects decimals and zero, and sends numeric `points` through the existing PATCH flow.
- The task PATCH route supports optional `points`; requests omitting `points` remain compatible.
- No-write browser verification confirmed Text and Single Choice Points can be edited locally, empty intermediate values remain empty, invalid values block Save, valid positive integers enable Save, and changing Single Choice Points does not reset the selected correct answer.
- Save was not clicked and no live data was created, edited, uploaded, removed, deleted, saved, or PATCHed during verification.
- Protected API/storage/session boundaries remain unchanged.

Planning topics:

- Define one disposable owned draft quest/task write-test scenario.
- Create one temporary text task.
- Create one temporary single-choice task.
- Verify save and refresh persistence.
- Verify Text task points persistence after save and refresh.
- Verify Single Choice points and correct-answer persistence after save and refresh.
- Verify image upload/remove only with explicit product-owner approval.
- Verify deletion cleanup and final test-data state.
- Avoid testing last Public task deletion.
- Document the exact cleanup and rollback sequence before any write test.
- Confirm the manual verification path uses canonical `/dashboard/quests/[id]/tasks`.
- No live writes until explicit approval.

Out of scope:

- Implementation changes before planning approval.
- Live writes without explicit approval.
- Route changes.
- API behavior or error-contract changes.
- Task CRUD or autosave refactors.
- Runtime/student-facing localization.
- New migrations.
- RLS policy changes.
- New indexes.
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
