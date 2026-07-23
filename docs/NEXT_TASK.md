# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan remaining teacher task workspace UX prioritization after responsive layout and label fixes.

## Next Task

Sprint 12.18.29 - Teacher Task Workspace Remaining UX Prioritization.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.28 implemented the approved responsive layout and TaskForm label fixes in `QuestTasksClient` and `TaskForm` only.
- The task workspace now uses `grid-cols-1 xl:grid-cols-12`; the task list uses `xl:col-span-4`, the editor uses `xl:col-span-8`, narrow screens stack list above editor, and large screens retain the two-column layout.
- `TaskForm` now has visible semantic labels for `Название задания`, `Описание`, `Правильный ответ`, `Подсказка`, `Тип задания`, and `Баллы`.
- Labels use matching `htmlFor`/`id` associations for `task-title`, `task-description`, `task-answer`, `task-hint`, `task-type`, and `task-points`.
- Placeholders, values, handlers, validation, alert behavior, loading behavior, payload, default points, create/save behavior, task data shapes, and task types remain unchanged.
- Manual responsive browser verification passed without creating or saving a task: wide screens retained two columns, narrow screens stacked list above editor, no horizontal scrolling or clipped controls appeared, all six labels appeared, and label associations worked.
- Recent fixes remain unchanged: pencil button, delete event isolation, card selection, selected styling, points editing/persistence, correct-answer persistence, editor save behavior, image controls, Preview, localized copy, and last-Public-task guard.
- Static ids remain acceptable because only one `TaskForm` renders; future unique-id work remains deferred until multiple simultaneous forms exist.

Planning topics:

- Reassess remaining P2 findings.
- Review clickable task-card semantic keyboard behavior.
- Review selected-card state beyond color alone.
- Review unsaved-change indication.
- Review required-field clarity and inline validation.
- Prioritize only launch-relevant improvements.
- Avoid redesigning stable workspace behavior.
- Identify exact files likely to change if follow-up implementation is approved.
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
