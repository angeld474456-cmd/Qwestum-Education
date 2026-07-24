# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Review the remaining launch-relevant accessibility and status behavior in the teacher task workspace.

## Next Task

Sprint 12.18.45 - Task Workspace Accessibility Completion Review Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.44 implemented deleted-task focus recovery in `QuestTasksClient`, `TaskList`, and `TaskCard`. Selected deletion retains existing `syncSelectedTask(nextTasks)` behavior and focuses the selected first remaining pencil; unselected deletion retains selection and focuses the next surviving pencil or the previous one; only-task deletion focuses the existing `Задания` heading outside normal Tab order.
- The current selected task ID is mirrored in a ref for DELETE-response-time decisions. The identity-safe pencil registry stores exact elements in a ref and removes them only when the element identity still matches.
- The initial `useEffect([tasks])` approach failed manual focus verification despite successful deletion and selection sync. `focusSignal` and `useLayoutEffect` now focus after commit; matching registration retries an existing missing target, and a target absent from current tasks clears without unrelated focus.
- Controlled final retest created and deleted one temporary selected Text task: the remaining task became selected, focus moved to its pencil, Enter activated it immediately, and cleanup restored the prior count. Other selected/unselected positions and the only-task fallback remain statically reviewed only.
- Confirmation, DELETE/API behavior, error and status handling, TaskForm, editors, points validation, immutable-type guidance, images, Preview, publication safety, and deletion guards remain unchanged.

Planning topics:

- Review the combined task-workspace accessibility improvements.
- Review remaining TaskForm native alert validation.
- Review disabled Save explanations.
- Review session-expired announcement before redirect.
- Review loading and busy announcements.
- Review unselected-task deletion focus behavior and the empty-list heading fallback.
- Distinguish MVP blockers from optional polish.
- Identify the smallest remaining safe improvement.
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
