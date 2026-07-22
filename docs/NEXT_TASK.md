# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan teacher forms and task editor copy localization.

## Next Task

Sprint 12.18.17 - Teacher Forms and Task Editor Copy Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.16 completed phase 1 of Russian-first teacher MVP localization.
- High-visibility Library, workspace navigation, Settings route-level, Preview route-level, and Play/Test route-level copy is now Russian.
- Workspace navigation labels are `К библиотеке`, `Настройки`, `Задания`, `Предпросмотр`, and `Тестирование`.
- Status labels are `Черновик` and `Опубликован`.
- Generic teacher-facing task terminology uses `задание`/`задания`; `вопрос` is reserved for actual question prompt or single-choice semantics.
- Server API error contracts were not changed.
- Canonical dashboard routes, navigation destinations and active-state logic, filtering, sorting, category/tags, task counts, covers, card links, Settings owner-safe loading, `created=1`, Preview rendering, QuestRunner/runtime behavior, task CRUD, and publication behavior remain unchanged.
- Manual browser verification passed for Library, Settings with and without `created=1`, Tasks without mojibake, Preview, and `Тестирование`; no data changed.
- Deferred localization scope includes `QuestSettingsForm`, `QuestCoverImageManager`, `QuestTasksClient`, task form/card/editor children, `ImageUploader`, runtime components, and client fallback/server API error consistency.

Planning topics:

- Localize `components/dashboard/QuestSettingsForm.tsx`.
- Localize `components/dashboard/QuestCoverImageManager.tsx`.
- Audit `components/tasks/QuestTasksClient.tsx` and task editor child components.
- Standardize `задание` versus `вопрос`.
- Localize field labels, buttons, helper text, empty states, prompts, and client fallback errors.
- Identify strings that must remain stable because they are API contracts.
- Inspect encoding and mojibake risks before changing Russian text.
- Determine phased implementation files.

Out of scope:

- Implementation before architecture approval.
- Route changes.
- API behavior or error-contract changes unless explicitly approved.
- Quest deletion.
- New migrations unless explicitly approved after planning.
- Live Supabase writes.
- RLS policy changes.
- New indexes.
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
