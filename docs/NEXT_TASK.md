# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest accessibility and status-messaging improvement for the teacher task workspace.

## Next Task

Sprint 12.18.39 - Task Workspace Accessibility and Status Messaging Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.38 added below both read-only task-type fields: `Тип задания выбирается при создании и не меняется после сохранения.` and `Чтобы использовать другой тип, создайте новое задание и при необходимости удалите прежнее.`
- Type remains immutable: no select, type state, conversion, or duplication action exists. Labels use stable editor-specific IDs, and the visible secondary helper text wraps naturally without interactive semantics.
- No-write visual verification in both editors and on wide/narrow layouts confirmed exact readable copy, non-editable fields, no clipping or horizontal scroll, stable width, and usable Save/other controls. No save, PATCH, live-data action, or cleanup occurred.
- Stored `task_type` still selects the editor; another type requires creating a new task and optionally manually deleting the old one. Automatic conversion remains deferred pending explicit field mapping, data-loss rules, API design, and regression coverage.
- Points validation, editor fields/options/correct answers, images, save/loading/errors, selection, TaskForm, TaskEditor registry, APIs, schema, RLS, Storage, Preview, publication, and deletion guards remain unchanged.

Planning topics:

- Review task editor success and error feedback.
- Review whether successful saves need visible confirmation.
- Review workspace-level error association and focus behavior.
- Review disabled-button explanations.
- Review keyboard navigation through task cards and editor actions.
- Review selected-card accessibility beyond color.
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
