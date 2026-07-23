# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest safe focus-recovery behavior after task-card deletion.

## Next Task

Sprint 12.18.43 - Deleted Task Focus Recovery Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.42 updated only `TaskList` and `TaskCard`: `isSelected` is derived from the existing `selectedTaskId` and passed to `TaskCard`, without duplicate selection state or callback/order changes.
- The selected card retains its violet ring and shows visible secondary `Выбрано`; the wrapper remains a non-focusable mouse-selection `div` with no role, `tabIndex`, or keyboard handler. Metadata wraps naturally.
- The native pencil retains `stopPropagation()` and `onSelect`, has accessible name `Открыть задание «{title}»`, and receives `aria-current="true"` only when selected. No `aria-selected`, `aria-pressed`, listbox, option, tab, or composite-widget semantics were added.
- Manual authenticated no-write verification confirmed Tab access, Enter/Space pencil activation, unchanged mouse selection, selected-state movement, readable narrow layout, and reachable actions. No Save, Create, Delete, upload, removal, POST, PATCH, DELETE, or live-data change occurred.
- No automatic focus, refs, or deletion-focus recovery were added. Delete confirmation/isolation, status messaging, selected-task synchronization, task display, TaskForm, editors, points validation, immutable-type guidance, APIs, Preview, and guards remain unchanged.

Planning topics:

- Review focus after deleting a selected task.
- Review focus after deleting an unselected task.
- Prevent focus loss when the deleted card disappears.
- Determine whether focus should move to the next task, previous task, task-list heading, or create-task control.
- Preserve selection synchronization, confirmation, and event isolation.
- Avoid automatic editor focus.
- Verify keyboard and screen-reader behavior.
- Identify the smallest safe implementation.
- Controlled temporary-task deletion requires separate approval.
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
