# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest safe keyboard-accessibility improvement for task-card selection.

## Next Task

Sprint 12.18.41 - Task Card Keyboard Accessibility Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.40 added accessible workspace messaging in `QuestTasksClient`: visible errors use `role="alert"` and `aria-live="assertive"`; one visible `statusMessage` region uses `role="status"` and `aria-live="polite"` only when non-empty. Neither region moves focus or uses a timeout.
- Exact success messages are `Задание создано.`, `Изменения сохранены.`, `Задание удалено.`, `Изображение загружено.`, and `Изображение удалено.` Stale status clears at relevant action start, and success is set only after the relevant local state update succeeds.
- Technical GET verification confirmed the protected workspace route redirects unauthenticated requests to `/login`; static roles, lifecycle, lint, build, and diff checks passed. Manual read-only browser verification confirmed no initial/empty status space, stable narrow layout, usable controls, immutable-type guidance, and local points validation without mutations.
- Controlled verification in an owned Draft quest created, saved, and deleted exactly one temporary Text task; create/save/delete messages appeared exactly, each replaced the prior one, no native success alert or workspace error appeared, selection remained correct, cleanup restored the original task count, and the quest remained Draft. No image upload, removal, or Storage write occurred.
- Image upload/removal success messages are implemented and statically reviewed, but were not verified through a live Storage write in Sprint 12.18.40.
- Task cards and their keyboard limitations, selected state primarily conveyed visually, TaskForm, editors, points validation, immutable-type guidance, APIs/request-response shapes, schema/RLS/Storage policy, Preview, publication, and deletion guards remain unchanged.

Planning topics:

- Make task selection keyboard accessible.
- Avoid nested interactive controls.
- Compare a dedicated select/open control with listbox-style semantics.
- Preserve pencil and delete behavior plus delete event isolation.
- Expose selected state beyond color; review `aria-current`, `aria-selected`, visible selected text, and icons.
- Review focus order and narrow-layout behavior.
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
