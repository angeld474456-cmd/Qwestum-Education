# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan whether existing teacher tasks should support type conversion and identify the smallest safe editor UX improvement.

## Next Task

Sprint 12.18.37 - Task Type Conversion and Editor UX Review Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.36 completed shared points validation alignment with `lib/task-points.ts`. `parsePositiveSafeInteger(value: string): number | null` and `Баллы должны быть целым числом не меньше 1.` are now shared by TaskForm, TextTaskEditor, and SingleChoiceTaskEditor.
- All three surfaces accept digit-only positive safe integers at least `1`, retain raw string state and temporary empty editing, and preserve numeric payload points. Editors retain their validation summaries, disable Save while invalid, and expose conditional `aria-invalid`/`aria-describedby` with one visible points error.
- Browser verification checked invalid values first: empty, `0`, decimal, and `9007199254740992` remained invalid, and the unsafe integer was not stored. A valid `12` cleared the points error, succeeded through PATCH, and remained `12` after refresh with no unrelated field changes. No cleanup was required for the existing test task.
- Task type is chosen only during creation. An existing task's stored `text` or `single_choice` type determines which editor opens and cannot be changed there. To use another type, the teacher must create a new task with the desired type and may manually delete the old task if no longer needed. No automatic conversion exists; future conversion requires explicit field-mapping and data-loss rules.
- POST/PATCH contracts, `Promise<boolean>`, failure preservation/reset, editor fields, options, correct-answer behavior, images, selection, responsive layout, Preview, publication guards, and deletion guards remain unchanged.

Planning topics:

- Review whether changing an existing task type should be supported.
- Compare delete-and-recreate against controlled conversion.
- Identify compatible and incompatible fields between `text` and `single_choice`.
- Define data-loss warnings and preserve task ownership and ordering.
- Assess API and database implications.
- Decide whether conversion belongs in MVP or should be deferred.
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
