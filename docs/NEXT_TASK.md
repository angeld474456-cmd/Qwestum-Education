# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan a focused UX review of the teacher task workspace after recent localization and action fixes.

## Next Task

Sprint 12.18.27 - Teacher Task Workspace UX Review Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.26 implemented delete-action event isolation in `TaskCard` only.
- The delete button now has `type="button"` and calls `event.stopPropagation()` before `onDelete(task.id)`.
- Delete clicks no longer select/open the parent task card.
- Existing icon, styling, Russian aria-label, confirmation flow, deletion behavior, keyboard accessibility, owner-safe DELETE API behavior, last-Public-task deletion guard, error handling, list refresh, and `syncSelectedTask` fallback remain unchanged.
- Manual browser verification passed without confirming deletion: confirmation appeared, Cancel preserved the previous selection, the unselected task did not open or become selected, pencil and card clicks remained unchanged, and no console or UI issue was reported.
- Static `task-points` remains acceptable because only one `TaskForm` renders; future unique-id work remains deferred until multiple simultaneous forms exist.

Planning topics:

- Review the complete teacher task workspace after recent localization and action fixes.
- Inspect task creation form density.
- Inspect field grouping.
- Inspect selected-card clarity.
- Inspect editor empty states.
- Inspect button hierarchy.
- Inspect destructive action visibility.
- Inspect responsive behavior.
- Inspect accessibility.
- Identify only launch-relevant UX issues.
- Avoid redesigning stable functionality.
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
