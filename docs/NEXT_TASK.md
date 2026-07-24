# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest accessible inline validation improvement for task creation.

## Next Task

Sprint 12.18.47 - Task Creation Inline Validation Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.46 verified editor label associations: `Название` -> `#text-task-title`, `Текст задания` -> `#text-task-description`, `Вопрос` -> `#single-choice-task-title`, and `Описание` -> `#single-choice-task-description`. All four labels were manually checked read-only and focused their controls; no Save, server request, or live-data write occurred.
- Stable editor-specific IDs avoid collisions, while type and points associations, validation, save behavior, layout, responsive behavior, APIs, schema, and Storage remain unchanged.
- Deferred QA: an intermittent user-reported navigation to quest Settings while clicking `Добавить вариант` or dragging the far-right document scrollbar has no confirmed static application cause. Runtime isolation remains pending; it is not part of this implementation and no speculative fix is authorized.

Planning topics:

- Inspect the native `alert("Введите название задания")` in `TaskForm`.
- Design the smallest accessible inline validation replacement.
- Determine exact error copy and blank-title focus behavior.
- Preserve entered form values after validation failure.
- Preserve the existing `Promise<boolean>` create contract.
- Distinguish TaskForm creation validation from editor save validation.
- Keep the intermittent Settings-navigation observation as deferred QA, not active implementation scope.
- Identify the smallest safe implementation.
- No implementation or live write without explicit approval.

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
