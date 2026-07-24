# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan public quest discovery and student access without weakening teacher ownership boundaries.

## Next Task

Sprint 12.19.1 - Public Quest Catalog and Student Access Planning.

Planning only. Do not implement or perform a live write until architecture approval and explicit write authorization.

Current state:

- Sprint 12.18.49 exit review found no current MVP accessibility blocker for keyboard-only task creation, editing, selection, deletion, validation recovery, task-card navigation, or focus recovery. Immediate task-workspace accessibility implementation stops; QA backlog remains.
- Completed coverage includes workspace live regions, inline title validation, field associations, immutable-type guidance, points associations, selected-card cues, isolated delete, deletion focus recovery, and image-control names.
- Important non-blocking: English immediate session-expiry/login feedback, no `aria-busy` or action-specific busy text, Save errors not individually associated to every invalid editor field, and missing programmatic Single Choice radio-group labeling. Native `Удалить задание?` is optional polish.
- Deferred QA: runtime Settings-navigation isolation before internal testing; unselected deletion positions, only-task heading fallback, valid create/reset, and API-failure retention before public MVP. Settings navigation remains unresolved and no speculative fix is authorized.

Planning topics:

- Inspect the current quest publication model and public-read eligibility fields.
- Confirm Draft exclusion, existing public and legacy routes, and Preview/Play behavior.
- Inspect RLS and server-read boundaries; compare authenticated, anonymous, and server-only public-read designs without weakening owner-only teacher policies.
- Design public catalog routes, cards, required metadata, and subject/grade/difficulty/language/free-paid/search filters.
- Design student public browsing, sign-in, start-quest, and later assignment/enrollment boundaries.
- Identify schema, publication-state, cover-image, API/service, and security gaps without implementing changes.
- Define static and browser test plans and distinguish MVP catalog scope from later marketplace/payment features.
- Retain task-workspace QA references: Settings navigation, deletion focus, create/reset, API-failure retention, session localization, busy semantics, Save associations, radio-group semantics, and confirm decision.
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
