# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Review whether the teacher task workspace has any remaining launch-blocking accessibility issues.

## Next Task

Sprint 12.18.49 - Task Workspace Accessibility Exit Review Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.48 replaced the native TaskForm blank-title alert with local `titleError`, a typed ref to the existing title input, and `Введите название задания.`. Blank and whitespace-only titles focus the input and stop before points validation or `onSave`; no request or field reset occurs.
- The title input conditionally uses `aria-invalid` and `aria-describedby="task-title-error"`; `#task-title-error` is conditional, has `role="alert"`, and preserves existing red styling and visible label association. Points behavior, `Promise<boolean>` creation, workspace API errors, payload, selection, layout, and APIs remain unchanged.
- Manual browser verification covered local invalid-title behavior, focus, whitespace handling, retained type/points, and error clearing after valid input. No valid create, Save, POST, upload, removal, cleanup, or live-data write occurred. Success reset and API-failure retention are static-only review.
- Deferred QA: intermittent user-reported navigation to quest Settings while clicking `Добавить вариант` or dragging the far-right document scrollbar remains unconfirmed and outside active implementation scope.

Planning topics:

- Review complete workspace accessibility after Sprints 12.18.38-12.18.48.
- Determine whether any remaining issue blocks MVP launch.
- Review session-expiry wording and login explanation.
- Review loading and busy semantics.
- Review disabled editor Save explanations.
- Review native delete confirmation usage.
- Review unselected-deletion and empty-list focus verification gaps.
- Retain intermittent Settings navigation as deferred QA.
- Classify findings as MVP blockers, important non-blocking, or optional polish.
- Recommend whether to stop accessibility work and move to the next product feature.
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
