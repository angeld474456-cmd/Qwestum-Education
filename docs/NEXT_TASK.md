# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan Task Editor copy localization for the teacher workflow.

## Next Task

Sprint 12.18.19 - Task Editor Copy Localization Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.18 completed Settings and Cover Manager copy localization.
- `QuestSettingsForm` teacher-visible copy is Russian for field labels, select placeholders, helper text, local validation messages, save/loading labels, success text, client-only fallback errors, and publication state labels.
- Approved Settings terminology includes `Название квеста`, `Описание`, `Предмет`, `Предмет не указан`, `Язык`, `Язык не указан`, `Категория`, `Теги`, `Сложность`, `Класс от`, `Класс до`, `Не указано`, `Примерная длительность, мин.`, `Статус публикации`, `Черновик`, `Опубликован`, `Сохранение...`, and `Сохранить настройки`.
- Subject/grade display formatting uses `Все классы`, `N класс`, and `N-M классы`.
- Language display labels are `Русский`, `Казахский`, and `Английский`.
- Generic publication-readiness copy uses `хотя бы одно задание`; `вопрос` is reserved for actual question-prompt semantics.
- `QuestCoverImageManager` copy is Russian for `Обложка`, optional 16:9 guidance, `Загрузить обложку`, `Заменить обложку`, `Удалить обложку`, `Обложка не загружена`, `Обложка квеста`, success messages, client-only fallback errors, and accessibility labels.
- Protected error boundaries remain unchanged: server API response shapes, HTTP status handling, server error contracts, `SESSION_EXPIRED_MESSAGE`, Supabase/internal technical errors, Storage service passthrough errors, and returned `result.error` display behavior.
- Routes, owner-safe loading, field names, payload shapes, validation limits, category/tag behavior, stored Public/Draft values, publication behavior, cover upload/remove/replace APIs, file input, accepted file types, schema, migrations, RLS, policies, and indexes remain unchanged.
- Manual browser verification passed without saving Settings data or executing cover upload/replace/remove writes.

Planning topics:

- Audit `components/tasks/QuestTasksClient.tsx` and all directly used task-editor children.
- Map raw task types to Russian display names without changing stored identifiers.
- `text` -> `Текстовое задание`.
- `single_choice` -> `Выбор одного ответа`.
- Use `Задание` for the entity and `Вопрос` only for a single-choice prompt.
- Localize headings, controls, validation, confirms, success/fallback messages, image copy, and empty states.
- Classify client fallbacks versus protected API/storage errors.
- Inspect mojibake risks in source-aware editor and browser.
- Define exact implementation scope and browser verification plan.
- Avoid broad runtime/student localization.

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
