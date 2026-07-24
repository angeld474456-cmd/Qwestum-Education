# Architecture

Qwestum-Education uses a modular quest/task architecture.

## Core Areas

- App routes live in `app/`.
- Reusable UI and feature components live in `components/`.
- Teacher quest and task data access lives in server helpers and authenticated API routes. `services/quest.service.ts` currently keeps shared task types used by editor/runtime components.
- Supabase client setup lives in `lib/supabase.ts`.
- Shared quest types live in `types/quest.ts` and service-local interfaces.

## Task Editor

The editor is built around task-type-specific editor components.

Key files:

- `components/tasks/TaskEditor.tsx`
- `components/tasks/TaskForm.tsx`
- `components/tasks/TaskList.tsx`
- `components/tasks/editor/TaskTypeRegistry.ts`
- `components/tasks/editor/TextTaskEditor.tsx`
- `components/tasks/editor/SingleChoiceTaskEditor.tsx`

`TaskTypeRegistry` maps task type ids to editor components. New task types should be added by registering a new editor, not by rewriting the existing editor flow.

Task creation is intentionally limited to implemented MVP task types:

- `text`
- `single_choice`

`TaskTypeRegistry` maps `single_choice` to `SingleChoiceTaskEditor`.

## Task Content

Task-specific data is stored in `quest_tasks.content` as JSONB.

Current usage:

- `text` tasks use the base task fields and text answer flow.
- `single_choice` tasks store options and the correct option id in `content`.

Keep task-specific shape checks close to the editor/runtime code that consumes that shape.

The live Supabase schema now includes `public.quest_tasks.content` after the forward migration `database/migrations/003_add_quest_task_content.sql` was manually applied and verified. Existing legacy task rows may still have `content = null`.

## Preview Layer

Preview components reuse runtime renderers where possible.

Key files:

- `components/tasks/preview/TaskPreview.tsx`
- `components/tasks/preview/TextTaskPreview.tsx`
- `components/tasks/preview/SingleChoiceTaskPreview.tsx`
- `components/tasks/runtime/TaskRenderer.tsx`
- `components/tasks/runtime/TextTaskRenderer.tsx`
- `components/tasks/runtime/SingleChoiceTaskRenderer.tsx`

Preview supports `single_choice` tasks through `TaskRenderer` by reading options and `correctOptionId` from `quest_tasks.content`.

Task images are supported in preview through `TaskRenderer`. `image_url` is passed from owned task rows into the runtime renderers and displayed for both `text` and `single_choice` tasks.

## Quest Runtime

The runtime engine is context-based and manages quest progress, answers, and status.

Key files:

- `components/quest-runtime/QuestRunner.tsx`
- `components/quest-runtime/RuntimeContext.tsx`
- `components/quest-runtime/ProgressBar.tsx`
- `components/quest-runtime/TaskNavigator.tsx`
- `components/quest-runtime/QuestStartScreen.tsx`
- `components/quest-runtime/QuestFinishScreen.tsx`
- `components/quest-runtime/QuestResults.tsx`

Do not bypass `RuntimeContext` for core runtime state unless the architecture is intentionally changed.

Teacher Play/Test supports `single_choice` tasks through `QuestRunner` and `TaskRenderer`. Teacher Test Mode remains local-only and does not persist answers.

Teacher Play/Test also renders task images when `quest_tasks.image_url` is present. Image rendering is shared through the runtime task renderer path.

## Teacher Experience Routes

Teacher-facing quest management currently lives under dashboard routes:

- `/dashboard/quests` — Teacher Quest Library.
- `/dashboard/quests/new` — authenticated draft quest creation.
- `/dashboard/quests/[id]/settings` — basic quest metadata and publish controls.
- `/dashboard/quests/[id]/tasks` — owner-safe task editor.
- `/dashboard/quests/[id]/preview` — read-only teacher preview using `TaskRenderer` in preview mode.
- `/dashboard/quests/[id]/play` — teacher test flow using `QuestRunner`.

In the Teacher Quest Library, the primary `Open / Edit quest` action points to `/dashboard/quests/[id]/settings`. Quest cards also link to edit tasks, preview, and play/test. The duplicate `Settings` action was removed in Sprint 12.6.

Legacy teacher routes remain as server-side redirects for backward compatibility:

- `/quests/new` -> `/dashboard/quests/new`
- `/quests/[id]/tasks` -> `/dashboard/quests/[id]/tasks`
- `/quests` -> `/dashboard/quests`
- `/quests/[id]` -> `/dashboard/quests/[id]/preview`

Sprint 12.18.14 consolidated teacher Create and Tasks under dashboard routes. The canonical dashboard Create page owns the authenticated create implementation, and the canonical dashboard Tasks page owns the owner-safe task editor implementation. The legacy Create and Tasks pages are minimal server-side redirects.

`components/dashboard/QuestWorkspaceNav.tsx` centralizes teacher workspace links:

- Back to library
- Settings
- Edit tasks
- Preview
- Play/Test

Future route work should preserve the dashboard canonical teacher flow and keep legacy redirects working until a public/student `/quests` plan is approved.

Sprint 12.7 decision: do not add breadcrumbs or a shared `QuestWorkspaceHeader` yet. `QuestWorkspaceNav` already provides practical navigation, and dashboard header duplication is still small. Revisit shared headers or breadcrumbs only if the dashboard workspace grows.

## Data Layer

Supabase tables currently used by the app include:

- `quests`
- `quest_tasks`

Teacher data access is owner-scoped:

- `services/teacher-quest.server.ts` loads owned quests and owned quest tasks with the authenticated server Supabase client.
- `app/api/teacher/quests/route.ts` creates quests with `author_id = auth.uid()`.
- `app/api/teacher/quests/[id]/route.ts` updates quest settings by matching both `id` and `author_id`.
- `app/api/teacher/quests/[id]/tasks/*` performs task CRUD only after verifying parent quest ownership.

`services/quest.service.ts` no longer exposes browser-side quest/task table reads or writes.

Quest metadata:

- `database/migrations/007_add_quest_metadata.sql` was applied live.
- `quests.grade_min`, `quests.grade_max`, and `quests.estimated_duration_minutes` are nullable integers.
- Grade constraints allow only grades 1-11, require both grade values to be null or both populated, and require `grade_min <= grade_max`.
- Duration is constrained to null or 5-240 minutes.
- No defaults or backfill were added, so legacy quests with null metadata remain valid.
- `subject_id` remains untouched, and no duplicate `subject` text column exists.
- `quests.subject_id` is nullable UUID and references `public.subjects.id`.
- `public.subjects` has `id uuid`, `name text`, `grade integer nullable`, and `created_at timestamptz`.
- Subject lookup rows exist and no exact duplicate `name + grade` pairs were found during Sprint 12.17.3 planning.
- `database/migrations/008_add_subjects_read_policy.sql` was applied live. `public.subjects` RLS remains enabled and authenticated users have SELECT-only lookup access.
- No subject INSERT, UPDATE, or DELETE policies exist, and no subject create/edit/delete UI is planned for the MVP slice.
- `database/migrations/009_add_quest_language_metadata.sql` was applied live after Sprint 12.17.7 verification.
- `quests.language_code` is nullable text and constrained to `ru`, `kk`, or `en` when populated.
- Language labels are Russian, Kazakh, and English. Language describes quest content, not UI locale.
- No language default, backfill, index, lookup table, PostgreSQL enum, RLS change, policy change, admin UI, filtering, or i18n framework was added.
- `database/migrations/010_add_quest_cover_image.sql` was applied live after Sprint 12.17.9 verification.
- `quests.cover_image_path` is nullable text.
- Quest cover images persist only the bucket-relative Storage path. Public URLs are derived at render time and are not stored.
- Cover objects use `teachers/{userId}/quests/{questId}/cover/{uuid}.{ext}`.
- The server generates cover paths, derives file extensions from validated MIME type, and does not trust browser filenames or paths.
- Cover upload allows JPEG, PNG, and WebP images up to 5 MB.
- Cover Storage policies add authenticated INSERT and DELETE for owner-prefixed cover paths only. Exact UUID-shaped quest and filename segments are enforced, nested or malformed paths are rejected, no Storage UPDATE policy was added, public read remains unchanged, and task image policies remain unchanged.
- Cover replacement uploads the new object, conditionally saves the new path, and then performs best-effort cleanup of the previous validated owner-scoped cover object.
- Failed DB updates attempt best-effort cleanup of the newly uploaded object; concurrent cover changes return safe HTTP 409 and do not delete a newer cover.
- Cover removal conditionally clears the DB path and deletes only a validated old owner-scoped cover object.
- Malformed or unrelated cover paths are never deleted; cleanup failure after a successful DB update is logged and non-blocking.
- Quest Settings can edit grade range, estimated duration, optional `subject_id`, and optional `language_code` through the owner-safe settings API.
- Quest Settings has a separate `QuestCoverImageManager` for optional cover upload, replacement, preview, and removal without submitting the regular settings form.
- Quest Settings form copy is Russian-first for teacher-visible labels, placeholders, helper text, local validation messages, success text, save/loading labels, and client-only fallback errors.
- Approved Settings terminology includes `Название квеста`, `Описание`, `Предмет`, `Предмет не указан`, `Язык`, `Язык не указан`, `Категория`, `Теги`, `Сложность`, `Класс от`, `Класс до`, `Не указано`, `Примерная длительность, мин.`, `Статус публикации`, `Черновик`, `Опубликован`, `Сохранение...`, and `Сохранить настройки`.
- Subject/grade display formatting is localized as `Все классы`, `N класс`, and `N-M классы`; stored values, option keys, field names, and payloads are unchanged.
- Generic teacher-facing publication-readiness copy uses `хотя бы одно задание`; `вопрос` remains reserved for actual question-prompt semantics.
- `QuestCoverImageManager` uses Russian teacher-visible copy for `Обложка`, optional 16:9 guidance, upload/replace/remove actions, empty state, alt text, success messages, and client-only fallback errors.
- Protected API/storage boundaries are unchanged: server response shapes, HTTP status handling, server error contracts, `SESSION_EXPIRED_MESSAGE`, Supabase/internal technical errors, Storage passthrough errors, and returned `result.error` display behavior remain intact.
- The subject selector uses a server-only authenticated lookup from `public.subjects` and selects only `id`, `name`, and `grade`, ordered by name, grade, and id.
- No service role or hardcoded subject UUID mapping is used for subject selection.
- `No subject` submits `null`; omitted `subject_id` preserves the current value.
- The settings API validates subject UUID shape and subject existence before saving. Invalid UUID and missing subject UUID inputs return safe `400` responses by implementation review; real lookup/database failures return safe `500` responses with server-side logging.
- A shared `QuestLanguageCode` helper provides language codes, labels, validation, and safe label resolution. Unknown or null language values render without a placeholder.
- `No language specified` submits `null`; omitted `language_code` preserves the current value. Invalid language values return safe `400` responses.
- Dashboard and Teacher Preview show resolved subject and language metadata only when populated. Null or unresolved subjects/languages show no placeholder.
- Teacher Library shows a 16:9 cover thumbnail or stable fallback. Teacher Preview shows a larger 16:9 cover when present. Null or malformed cover paths do not show broken images.
- The Teacher Library uses one subject lookup and an in-memory map, avoiding N+1 subject queries.
- NewQuestForm and Teacher Play/Test remain unchanged.
- Sprint 12.17.10 approved a direct quest-column MVP category/tag model.
- `category` is one optional teacher-defined text value.
- `tags` is a teacher-defined text array with display casing preserved.
- Normalized taxonomy tables such as `quest_categories`, `tags`, and `quest_tags` are deferred until marketplace, public catalog, multilingual taxonomy, or platform-defined taxonomy needs are clearer.
- `database/migrations/011_add_quest_category_tags.sql` was applied live after Sprint 12.17.12 verification.
- Live `quests.category` is nullable `text` with default `null`.
- Live `quests.tags` is `text[] not null` with default `'{}'::text[]`.
- `quests_category_length_check` enforces category values as null or 1-40 characters.
- `quests_tags_count_check` enforces at most 10 tags.
- All 7 existing quests remained compatible after migration; existing categories are null and existing tags are empty arrays.
- Quest Settings can edit optional category and comma-separated tags through the owner-safe settings API.
- Shared and teacher quest types include `category: string | null` and `tags: string[]`.
- Owner-scoped quest reads include category and tags.
- Omitted category or tags preserve existing values in PATCH requests.
- Empty category clears to `null`; an empty tags array clears all tags.
- Category and tag whitespace is normalized, empty tags are removed, and tags are deduplicated case-insensitively while preserving first-occurrence casing.
- Category maximum length is 40 characters, maximum tag count is 10, and maximum normalized tag length is 24 characters.
- Control characters are rejected server-side, and invalid category or tags return safe `400` responses before updates.
- Defensive Settings form handling prevents stale null or undefined tags from crashing the form.
- Manual authenticated browser verification passed, and the test quest was restored to `category = null` and `tags = []`.
- Sprint 12.17.14 added Teacher Library category/tag display and filtering.
- `/dashboard/quests` remains a Server Component and accepts Next.js 16 async `searchParams`.
- Supported Teacher Library URL parameters are `category` and `tag`.
- Owned quests are fetched once through `getOwnedQuests()`, filter values are derived only from the authenticated teacher's owned quests, and filtering is performed in memory for the current MVP scale.
- Category and tag filters combine with AND semantics.
- Missing or empty parameters mean no filter; only the first query value is used when an array is supplied.
- Unknown filter values produce a safe filtered-empty state.
- Category and tag matching is whitespace-normalized and case-insensitive, while stored display casing is preserved.
- Filter options are deduplicated case-insensitively and sorted.
- Quest cards display category and tag chips only when populated.
- Native GET controls support shareable URLs, refresh persistence, and browser back/forward behavior.
- Clear filters returns to `/dashboard/quests`.
- Defensive Library handling prevents malformed legacy category/tags values from crashing the page.
- Manual authenticated browser verification passed for all-owned display, chips, category-only filtering, tag-only filtering, combined filtering, clear filters, refresh persistence, browser back/forward, unknown-value empty state, and existing card metadata/actions.
- No Preview category/tag display, NewQuestForm controls, Play/Test changes, public catalog/student discovery, migration, RLS/policy change, index, normalized taxonomy, or quest deletion are included in Sprint 12.17.14.
- Sprint 12.17.15 added Teacher Preview category/tag display.
- Teacher Preview displays category and tags in the existing metadata chip row after subject, language, grade, and duration.
- No additional service query, type, API, schema, or RLS work was required because `getOwnedQuest()` already returns category and tags.
- Category is defensively normalized for display and omitted when invalid or empty.
- Tags are defensively handled at runtime, limited to valid string entries, whitespace-normalized, and empty entries are removed.
- Stored display casing is preserved and all valid tags are displayed.
- Tag keys are index-qualified to avoid duplicate React key collisions with malformed legacy arrays.
- Preview category/tag styling matches the Teacher Quest Library.
- Manual authenticated browser verification passed for category chip display, tag chip display/wrapping, metadata order, empty metadata behavior, existing title/description/task count/cover/metadata/task previews, read-only behavior, unchanged owner-safe route behavior, and duplicate legacy tag key safety.
- No editing in Preview, filtering in Preview, NewQuestForm changes, Play/Test changes, quest deletion, public catalog/student discovery, migration, live Supabase write, RLS/policy change, index, or normalized taxonomy was included.
- Metadata chip logic remains local to Library and Preview.

Teacher Library analytics are content analytics only. The `/dashboard/quests` summary uses owned quest and owned task summary data to show Total quests, Public quests, Draft quests, Total tasks, and Total points. There are no persisted attempts/results yet, and no student learning analytics should be added before schema, auth, privacy, and runtime persistence are intentionally designed.

## Deferred Attempt Persistence

Attempt persistence is not implemented yet. Do not create migrations, attempt services, routes, runtime persistence, or student analytics until auth, RLS, privacy, and schema boundaries are approved.

Teacher Test Mode should remain local-only for now. Future persistence should focus on real student attempts, not teacher QA/test runs.

Future `quest_attempts` table concept:

- `id`
- `quest_id`
- `user_id` or `student_id`
- `assignment_id` nullable later
- `team_id` nullable later
- `mode`: `student` | `teacher_test`
- `status`: `started` | `submitted` | `abandoned`
- `started_at`
- `submitted_at`
- `score`
- `max_score`
- `completion_percent`
- `created_at`

Future `quest_attempt_answers` table concept:

- `id`
- `attempt_id`
- `task_id`
- `task_type`
- `answer`
- `is_correct`
- `points_awarded`
- `max_points`
- `submitted_at`
- optional `metadata` JSONB later

Scoring notes:

- `single_choice` can compare the selected option id to `content.correctOptionId`.
- `text` can compare normalized answer text to `task.answer`, but may need teacher review later.
- `task.points` is the max score for a task.
- Unknown task types should be treated as ungraded/manual/0 until explicitly supported.
- Do not redesign task JSONB content for attempt persistence yet.

Deferred future analytics routes:

- `/dashboard/quests/[id]/analytics`
- `/dashboard/quests/[id]/attempts`
- `/dashboard/classes/[id]/analytics`

## Auth, Roles, Ownership, And RLS

Auth and owner-scoped teacher access are implemented for the current teacher workspace. The codebase has these auth and role pieces:

- `lib/supabase.ts`, `lib/supabase/client.ts`, and `lib/supabase/server.ts` create browser/server Supabase clients.
- `components/auth/LoginForm.tsx` uses Supabase OTP login.
- `app/auth/callback/route.ts` handles the magic-link callback.
- `app/auth/logout/route.ts` handles POST-only logout through the Supabase SSR server client.
- `proxy.ts` refreshes Supabase sessions.
- `types/user.ts` includes `teacher`, `student`, `school`, and `admin` roles.
- `types/quest.ts` includes `author_id`.

Current limitations:

- Dashboard routes enforce an authenticated session.
- Dashboard header displays the authenticated teacher email and a plain HTML POST `Sign out` control.
- Successful logout redirects with HTTP 303 to `/login?logged_out=1`; failed logout redirects safely to `/login?error=logout_failed`.
- Logout accepts no browser-controlled redirect destination.
- Authenticated users opening `/login` are redirected to `/dashboard`.
- Login feedback uses a fixed allowlist for logout/callback/session-expired states and never displays raw query values or Supabase errors.
- Current protected teacher client workflows use a client-only expired-session helper for API `401` responses. The helper uses the fixed message `Your session has expired. Please sign in again.`, redirects only to `/login?error=session_expired`, and deduplicates repeated redirects with a module-level guard.
- Teacher dashboard reads are owner-scoped.
- Quest creation sets `author_id` from the authenticated server session and always creates a draft by inserting `is_public: false` server-side.
- `NewQuestForm` sends only title, description, and difficulty; it does not include publication state, and any client-provided `is_public` value is ignored by the create API.
- Quest creation is a two-step workflow: create a draft shell first, then complete metadata, cover image, tasks, and publication in Quest Settings.
- `NewQuestForm` presents creation as `Шаг 1 из 2`, uses Russian draft-workflow copy, and offers a secondary link back to `/dashboard/quests`.
- Post-create redirects append `?created=1` so Settings can show server-rendered Step 2 onboarding without persistent state.
- Quest settings save matches both quest `id` and `author_id`.
- Publishing from Draft to Public requires at least one task. The `PATCH /api/teacher/quests/[id]` route loads current `is_public` through the owner-safe quest lookup and only counts `quest_tasks` after authenticated ownership is verified.
- The publication-readiness count uses exact count with `head: true`; client-provided task counts are ignored. Zero or null count returns HTTP 400 with `Добавьте хотя бы одно задание перед публикацией.` before the quest update runs.
- Task-count query failures use the existing safe HTTP 500 settings-save response without exposing Supabase internals.
- Draft saves, already-public saves, and unpublishing do not trigger task counting. Existing public zero-task quests are not automatically modified.
- Task CRUD verifies ownership through the parent quest.
- Task deletion blocks deleting the last task from a Public quest. The task route owner-safe quest lookup includes `is_public`, verifies the target task by task id and quest id, then counts sibling tasks only after authentication, ownership, and target-task verification.
- Public quests with one or fewer tasks return HTTP 400 with `Сначала снимите квест с публикации, затем удалите последнее задание.` before task deletion or Storage cleanup. Public quests with multiple tasks and Draft quests preserve existing deletion behavior.
- Task image uploads use an authenticated server route and verify quest/task ownership before uploading to Storage.
- Task image removal uses an authenticated server route, clears `quest_tasks.image_url` first, and then performs best-effort Storage cleanup only for verified owner-scoped paths.
- Task image replacement cleanup uses a server-only owner-scoped image URL parser, saves the new `image_url` first, and then performs best-effort cleanup of the previous verified owner-scoped object.
- Task deletion deletes the database row first, then performs best-effort Storage cleanup using only the deleted row's server-returned `image_url`.
- Quest cover upload/removal uses an authenticated server route and verifies quest ownership before Storage writes/deletes.
- Cross-tab logout synchronization, return-to-current-page support, unsaved-edit persistence after expired-session redirects, mutation replay, and role-specific authorization beyond an authenticated teacher account are still deferred.

MVP roles:

- `teacher` - owns quests, edits quest metadata, manages tasks, previews/tests quests, and later views attempts for owned quests.
- `student` - views public or assigned quests and later submits real attempts.

Deferred roles:

- `admin`
- `school` / organization admin

Quest ownership model:

- Use `quests.author_id = auth.uid()` for teacher-owned quests.
- Teacher dashboard queries return only quests owned by the current teacher.
- Public/student catalog queries should eventually return only `is_public` quests or assigned quests.
- Updates are allowed only to the owning teacher.
- Quest deletion remains unavailable because no `quests` DELETE policy exists.

Current `quests` and `quest_tasks` RLS boundaries after `database/migrations/004_harden_quest_rls.sql`:

- `quests`
  - Authenticated teachers can select, insert, and update only their own quests through `author_id = auth.uid()`.
  - Direct anonymous access is denied.
  - No DELETE policy exists.
- `quest_tasks`
  - Authenticated teachers can select, insert, update, and delete tasks only when the parent quest belongs to `auth.uid()`.
  - Direct anonymous access is denied.
  - Public/student reads are not allowed because `answer` fields and `content.correctOptionId` may expose correct answers.

Future RLS boundaries:

- Public/student catalog and runtime access should use separate routes/policies that do not expose private teacher data or correct answers.
- Future `quest_attempts`
  - Students can create and select their own attempts.
  - Teachers can read attempts only for quests they own.
  - Submitted attempts should not be casually mutable.
- Future `quest_attempt_answers`
  - Students can insert and select answers only for their own attempts.
  - Teachers can read answers only for attempts tied to their owned quests.
  - Attempt answers must never be public.

Teacher Test Mode remains local-only until persistence is intentionally designed. Persisted student attempts, private teacher analytics, attempt services, and migrations must wait for auth, ownership, privacy, and RLS decisions.

Important risks:

- Public quest/task reads may expose private data or `correctOptionId` data later if reintroduced without care.
- Attempt answers may contain sensitive student data.
- Storage upload paths need owner-aware policies later.
- Storage public reads remain temporarily; private bucket or signed URL design is deferred.
- Private bucket/signed URLs, legacy object migration, and magic-byte MIME validation are deferred.
- School/admin roles require careful scoping and should wait.

## Live Schema / RLS Audit Notes

Sprint 12.11.2 ran a read-only live Supabase probe using the configured anon client. It did not print row contents or secret values.

Live `quests` findings:

- `quests` is readable through the anon client.
- Visible quest count: 3.
- Visible columns include `id`, `title`, `description`, `subject_id`, `author_id`, `difficulty`, `is_public`, and `created_at`.
- `author_id` exists in the live table.
- All 3 visible quests have `author_id IS NULL`.
- `author_id` type, nullability, and foreign key relationship to `auth.users(id)` are not confirmed from anon access.

Live `quest_tasks` findings:

- `quest_tasks` is readable through the anon client.
- Visible task count: 10.
- Visible columns include `id`, `quest_id`, `sort_order`, `title`, `description`, `answer`, `points`, `created_at`, `hint`, `image_url`, `video_url`, `audio_url`, and `task_type`.
- Live `quest_tasks.content` was missing during the Sprint 12.11 audit.
- `database/migrations/003_add_quest_task_content.sql` was added as a forward repair migration.
- The migration was manually applied and verified; live `public.quest_tasks.content` now exists as JSONB.
- Existing legacy task rows may still have `content = null`.

RLS and storage findings:

- Anonymous reads previously accessed `quests` and `quest_tasks` through broad public policies.
- `database/migrations/004_harden_quest_rls.sql` was applied in live Supabase after Sprint 12.15.3 verification.
- Broad public policies on `quests` and `quest_tasks` were removed.
- `quests` now has authenticated owner policies for SELECT, INSERT, and UPDATE.
- `quests` has no DELETE policy, so direct quest deletion remains denied by RLS.
- `quest_tasks` now has authenticated owner-derived policies for SELECT, INSERT, UPDATE, and DELETE through the parent quest.
- Direct anonymous table access to `quests` and `quest_tasks` is denied.
- `database/migrations/005_harden_quest_image_storage.sql` was applied live after Sprint 12.15.4a verification.
- `quest-images` remains public for existing public URLs.
- Public Storage INSERT, UPDATE, and DELETE policies were removed.
- Public read remains.
- Authenticated users can insert only under owner-prefixed paths shaped like `teachers/{auth.uid()}/quests/{questId}/tasks/{taskId}/{filename}`.
- Bucket constraints now limit uploads to 5 MB and JPEG, PNG, or WebP MIME types.
- `database/migrations/006_add_owner_quest_image_delete_policy.sql` was applied live after Sprint 12.15.5a verification.
- Authenticated users can delete only owner-prefixed image paths shaped like `teachers/{auth.uid()}/quests/{questId}/tasks/{taskId}/{filename}`.
- Public Storage DELETE remains disabled.
- Task image removal clears the database reference before best-effort Storage deletion.
- Compare-and-clear protection prevents a remove request from clearing a newer image URL saved concurrently; conflicts return HTTP 409 and skip Storage deletion.
- A canonical server-only parser verifies owner-scoped public image URLs before any cleanup.
- Safe image replacement cleanup reads the previous `image_url` server-side, saves the new `image_url` first, and deletes the previous object only when it matches `teachers/{auth.uid()}/quests/{questId}/tasks/{taskId}/{filename}`.
- Replacement cleanup is best-effort and non-blocking; concurrent replacements may orphan an intermediate object.
- Live replacement verification confirmed the new image rendered in the task editor, Teacher Preview, and Teacher Play/Test, the previous owner-scoped object was removed, and legacy objects remained unchanged.
- Task-delete cleanup uses the deleted row's returned `image_url`, runs only after the database delete succeeds, and deletes only verified owner-scoped paths.
- Task-delete cleanup is best-effort and non-blocking; upload-before-failed-PATCH races may still orphan an unattached object.
- Live task-delete verification confirmed a temporary task row was removed, the exact owner-scoped Storage object was removed, legacy objects remained unchanged, and the editor remained functional.
- Legacy `tasks/{uuid}` objects remain unchanged.
- `database/migrations/007_add_quest_metadata.sql` was applied live after Sprint 12.17.2 verification.
- Live `quests` now includes nullable `grade_min`, `grade_max`, and `estimated_duration_minutes`.
- CHECK constraints enforce grade values 1-11, both grades null or both populated, ordered grade ranges, and duration 5-240 minutes.
- Existing owner-scoped quest policies remained unchanged, RLS remained enabled, and all 7 existing quests remained compatible with null metadata.
- `database/migrations/008_add_subjects_read_policy.sql` was applied live after Sprint 12.17.4 verification.
- `public.subjects` has exactly one SELECT policy for authenticated users; no subject write policies exist.
- Subject row count remained unchanged, and existing `quests` and `quest_tasks` policies were untouched.
- Sprint 12.17.6 language schema audit found no existing language column, enum, table, or constraint.
- `database/migrations/009_add_quest_language_metadata.sql` was applied live after Sprint 12.17.7 verification.
- Live `quests.language_code` is nullable text with allowed values `ru`, `kk`, and `en`.
- No default, backfill, index, RLS change, or policy change was added for language metadata.
- Sprint 12.17.8 planning confirmed live schema had no existing quest cover field.
- `database/migrations/010_add_quest_cover_image.sql` was applied live after Sprint 12.17.9 verification.
- Live `quests.cover_image_path` is nullable text with no default, backfill, index, or quest RLS change.
- The existing public `quest-images` bucket is reused for cover images, remains public, keeps the 5 MB limit, and keeps JPEG/PNG/WebP MIME restrictions.
- Cover Storage policies `Teachers can upload own quest covers` and `Teachers can delete own quest covers` were added for authenticated owner-prefixed cover paths.
- Public read remains unchanged, task image INSERT/DELETE policies remain unchanged, and no Storage UPDATE policy was added.
- Local migrations do not fully represent live schema history.

Decisions after audit:

- Auth/session, owner-scoped teacher reads, owner-safe quest writes, owner-safe task CRUD, and RLS hardening are implemented for the teacher workspace.
- Teacher logout/session UX is implemented for the current MVP.
- Expired-session API `401` UX is implemented for the current teacher client workflows without changing protected API contracts.
- Grade range and estimated duration metadata are implemented for Quest Settings, Dashboard, and Teacher Preview.
- Subject lookup and the Quest Settings subject selector are implemented. Subject creation/editing/deletion, taxonomy administration, subject catalog filtering, and inactive/status semantics remain deferred.
- Quest content language metadata is implemented for Quest Settings, Dashboard, and Teacher Preview. Language during quest creation, catalog language filtering/indexes, multilingual variants, UI localization/i18n, and language administration remain deferred.
- Quest cover images are implemented for Quest Settings, Dashboard, and Teacher Preview. Cover selection during quest creation, image resizing/cropping, private media/signed URLs, and orphan cleanup tooling remain deferred.
- The teacher-MVP category/tag model is approved as direct nullable/array columns on `quests`, with normalized taxonomy deferred.
- `database/migrations/011_add_quest_category_tags.sql` was applied live and verified for category/tag schema only.
- Sprint 12.18.2 verified draft-only quest creation through the authenticated UI with test quest `DRAFT CREATION TEST 12.18.2` (`0a6d4d54-37ca-4274-aea4-3e127c3a593d`).
- The test quest redirected to Settings, loaded as Draft/not public, had empty category/tags, no cover image, and no tasks; it remains in place because quest deletion is not implemented.
- No subject, language, grade, duration, category, tags, cover, Settings, Library, Preview, Play/Test, migration, RLS/policy, index, public catalog, student-facing, direct SQL, or direct API shortcut change was included in Sprint 12.18.2.
- Sprint 12.18.4 polished `NewQuestForm` with `Шаг 1 из 2`, Russian draft-workflow copy, `Создать черновик` submit copy, `Создание черновика...` loading copy, and a secondary `Вернуться к библиотеке` link to `/dashboard/quests`.
- Visual verification passed on authenticated `/quests/new` without creating a new quest.
- Sprint 12.18.4 did not change the create API, routes, metadata fields, Settings, Library, Preview, Play/Test, quest deletion, migration, live Supabase state, RLS/policies, indexes, public catalog, or student-facing behavior.
- Sprint 12.18.6 added Step 2 Settings onboarding for `/dashboard/quests/[id]/settings?created=1`.
- Settings accepts Next.js 16 async `searchParams`; `created` supports `string | string[] | undefined`, arrays use the first value, and only exact `created=1` enables onboarding.
- Direct Settings visits remain unchanged; `getOwnedQuest(id)` remains the owner-safe access gate and the query parameter does not affect authorization or data loading.
- The onboarding is server-rendered, non-persistent, has no client state or dismiss behavior, links to `/quests/[id]/tasks`, and leaves publication behavior unchanged.
- Browser verification passed with and without `created=1`, and no data was modified during verification.
- No create API, schema/migration, RLS/policy, index, `QuestSettingsForm`, `QuestCoverImageManager`, task route/editor, publication gating, deletion, public catalog, or student-facing change was included in Sprint 12.18.6.
- Sprint 12.18.8 added the first publication-readiness rule: Draft-to-Public transitions require at least one task.
- The route reads current `is_public` through the existing owner-safe lookup, counts `quest_tasks` only after authentication and ownership verification, uses exact count with `head: true`, and never trusts client task counts.
- Zero or null task count returns HTTP 400 with `Добавьте хотя бы одно задание перед публикацией.`, and the quest update is not executed.
- Task-count query failure uses the existing safe HTTP 500 response and does not expose Supabase internals; direct API requests cannot bypass the rule.
- `QuestSettingsForm` already displayed the API error and required no change.
- Manual browser verification passed for an owned draft with zero tasks: the UI showed the Russian error, the request was rejected, the quest remained Draft after refresh, and no other quest fields, task, cover, metadata, or publication data changed.
- Preserved behavior: draft remaining draft, public remaining public, editing already-public quests, and unpublishing do not trigger task counting; legacy public zero-task quests are not modified automatically; existing title, difficulty, metadata, authentication, ownership, 404, 401, Preview, and Play/Test zero-task behavior remains unchanged.
- Deferred limitations: deleting the last task from a public quest may still leave it public with zero tasks; the count and publication update are not transactional; full readiness checklist is deferred; subject, language, grade, duration, category, tags, description, and cover are not publication requirements yet.
- No migration, schema, RLS/policy, index, `QuestSettingsForm`, Preview, Play/Test, task deletion, public catalog, or student-facing change was included in Sprint 12.18.8.
- Sprint 12.18.10 blocks deleting the last task from a Public quest.
- Teachers must explicitly unpublish before deleting the final task; automatic unpublishing is not performed.
- The owner-safe task route quest lookup now includes `is_public`; Draft quests skip the new readiness check.
- Public quests verify the target task before counting sibling tasks, with target task lookup scoped by task id and quest id.
- Task count runs only after authentication, ownership, and target-task verification, uses `quest_tasks` exact count with `head: true`, and never trusts client-provided task counts.
- A Public quest with more than one task can still delete a task; a Public quest with one or fewer tasks returns HTTP 400 with `Сначала снимите квест с публикации, затем удалите последнее задание.`
- Blocked deletion performs no task deletion or Storage cleanup.
- Task-count failure returns the existing safe HTTP 500 response; successful deletion response and Storage cleanup remain unchanged.
- `QuestTasksClient` already displays API errors and required no change.
- Manual browser verification passed: an owned Public one-task quest showed the Russian error, the request was rejected, the task remained after refresh, the quest remained Public, no Storage cleanup occurred, and no other task or quest data changed.
- Preserved behavior: Draft quests with one or multiple tasks may delete tasks; Public quests with multiple tasks may delete one; missing or foreign quest/task keeps existing generic 404; unauthenticated behavior remains unchanged; legacy Public zero-task quests are not modified automatically; Preview and Play/Test remain unchanged.
- Deferred limitations: count and deletion are non-transactional; concurrent deletion requests on a Public quest with multiple tasks could still race; a future transaction/RPC may provide stronger enforcement; no second confirmation or publication-aware delete UI was added.
- No automatic unpublishing, transaction/RPC, migration, schema, RLS/policy, index, `QuestTasksClient`, Settings, Preview, Play/Test, public catalog, student-facing, or quest deletion change was included in Sprint 12.18.10.
- Sprint 12.18.12 adds Settings-side publication-readiness guidance without changing publication API enforcement.
- Settings loads an owner-safe exact task count server-side through `getOwnedQuestTaskCount(questId)`.
- The helper validates UUID shape and authentication, verifies ownership with quest id plus authenticated `author_id`, returns `null` for missing, foreign, unauthenticated, or invalid requests, and counts `quest_tasks` only after ownership verification using exact count with `head: true`.
- Task count stays separate from the quest DTO and is passed to `QuestSettingsForm` as `taskCount`.
- Readiness messaging appears near the publication control for Draft zero-task, ready, and legacy Public zero-task states.
- Exact copy: `Для публикации нужно хотя бы одно задание.`, `Добавьте задание, затем вернитесь в настройки и включите публикацию.`, `Заданий: {taskCount}`, `Квест можно опубликовать.`, `Квест опубликован, но в нем нет заданий. Снимите публикацию или добавьте задание.`, and `Перейти к заданиям`.
- The task link points to `/quests/[id]/tasks`.
- The publication checkbox remains enabled because the server API remains authoritative and server-rendered task counts may be stale until refresh.
- No polling or client-side task-count fetch was added.
- Manual browser verification passed for Draft zero-task, Draft with tasks, and Public with tasks; no data was modified during verification.
- Publication API enforcement, direct API protection, legacy Public zero-task unpublishing, unrelated Settings saves, error/success display, `created=1` onboarding, owner-safe `notFound`, task CRUD, Preview, and Play/Test remain unchanged.
- No migration, schema, RLS/policy, index, polling, client-side task-count request, readiness metadata checklist, task CRUD refactor, publication API change, public catalog, or student-facing change was included in Sprint 12.18.12.
- Sprint 12.18.14 consolidated teacher Create and Tasks routes under `/dashboard/quests`.
- The canonical teacher route map is Library `/dashboard/quests`, Create `/dashboard/quests/new`, Settings `/dashboard/quests/[id]/settings`, Tasks `/dashboard/quests/[id]/tasks`, Preview `/dashboard/quests/[id]/preview`, and Play/Test `/dashboard/quests/[id]/play`.
- Legacy redirects are `/quests/new` -> `/dashboard/quests/new`, `/quests/[id]/tasks` -> `/dashboard/quests/[id]/tasks`, `/quests` -> `/dashboard/quests`, and `/quests/[id]` -> `/dashboard/quests/[id]/preview`.
- The canonical dashboard Create page owns the authenticated create implementation; the legacy Create page is a minimal server-side redirect.
- The canonical dashboard Tasks page owns the owner-safe task editor implementation; the legacy Tasks page is a minimal server-side redirect.
- All internal teacher Create and Tasks links use canonical dashboard routes.
- `QuestWorkspaceNav` ordering, labels, and active behavior remain unchanged, and the post-create Settings redirect remains `/dashboard/quests/[id]/settings?created=1`.
- `NewQuestForm` and `QuestTasksClient` received only minimal dashboard-layout fit adjustments.
- Task CRUD, validation, payloads, errors, loading, scrolling behavior, publication behavior, dashboard layout guard, and owner-safe route loading remain intact.
- Manual browser verification passed for both canonical routes, both legacy redirects, no redirect loops, visible task editor inside dashboard chrome, vertical scrolling, dashboard navigation not covering content, internal links staying within `/dashboard/quests`, and no data changes during verification.
- Remaining legacy occurrences are intentional redirect pages, historical documentation references, and `/api/teacher/quests` API paths.
- No API, schema/migration, RLS/policy, index, task CRUD refactor, Preview or Play/Test behavior change, publication behavior change, public catalog/student-facing implementation, broad visual redesign, or broad localization change was included in Sprint 12.18.14.
- Sprint 12.18.16 completed phase 1 of teacher workflow localization.
- The teacher-facing MVP is Russian-first, localization remains phased, and no i18n framework or shared copy constants were introduced.
- Primary navigation now uses `К библиотеке`, `Настройки`, `Задания`, `Предпросмотр`, and `Тестирование`.
- Primary status labels now use `Черновик` and `Опубликован`.
- Library high-visibility copy is Russian for headings/supporting text, create actions, summary cards, filters, clear-filter actions, empty/no-results states, status badges, task-count labels, cover/description fallbacks, and card actions.
- Settings route-level copy now uses `Настройки квеста` and Russian supporting text while preserving Step 2 onboarding behavior.
- Preview route-level copy now uses Russian heading, task counts, zero-task state, task action, grade labels, and task labels.
- Play/Test is labeled `Тестирование` with Russian supporting and zero-task copy.
- Generic teacher-facing task terminology uses `задание`/`задания`; `вопрос` is reserved for an actual question prompt or single-choice semantics.
- Server API error contracts were not changed.
- Canonical routes, navigation destinations, active-state logic, filtering, sorting, category/tags, task counts, covers, card links, Settings owner-safe loading, `created=1` behavior, Preview rendering, QuestRunner/runtime behavior, task CRUD, and publication behavior remain unchanged.
- Manual verification passed across Library, Settings with and without `created=1`, Tasks without mojibake, Preview, and `Тестирование`; no data changed.
- Deferred localization scope includes `QuestSettingsForm`, `QuestCoverImageManager`, `QuestTasksClient`, task form/card/editor children, `ImageUploader`, runtime components, and client fallback/server API error consistency.
- Do not add attempt persistence yet.
- Do not touch runtime/editor/JSONB architecture without explicit approval.
- Sprint 12.18.18 localized Settings form and Cover Manager copy without adding an i18n framework or shared copy constants.
- Settings form visible terminology now includes `Название квеста`, `Описание`, `Предмет`, `Предмет не указан`, `Язык`, `Язык не указан`, `Категория`, `Теги`, `Сложность`, `Класс от`, `Класс до`, `Не указано`, `Примерная длительность, мин.`, `Статус публикации`, `Черновик`, `Опубликован`, `Сохранение...`, and `Сохранить настройки`.
- Subject/grade formatting uses `Все классы`, `N класс`, and `N-M классы`; language labels use `Русский`, `Казахский`, and `Английский`.
- Publication-readiness terminology now uses `хотя бы одно задание`, while `вопрос` remains reserved for actual question-prompt semantics.
- Cover Manager visible terminology now includes `Обложка`, Russian optional 16:9 guidance, `Загрузить обложку`, `Заменить обложку`, `Удалить обложку`, `Обложка не загружена`, and `Обложка квеста`.
- Server API response shapes, HTTP status handling, server error contracts, `SESSION_EXPIRED_MESSAGE`, Supabase/internal technical error behavior, Storage passthrough errors, and returned `result.error` display behavior remain unchanged.
- Manual browser verification passed for Settings form copy, cover manager copy, local invalid-input validation, mojibake absence, and desktop layout; no save or cover write operation was performed.
- Deferred localization scope now includes `QuestTasksClient`, task form/card/editor children, `ImageUploader`, runtime components, broader client/server error consistency, and student/runtime copy outside the teacher-only workflow.
- Sprint 12.18.20 localized the teacher task-editor surface without changing task architecture, routes, endpoints, payloads, stored identifiers, API contracts, schema, RLS/policies, indexes, owner safety, publication safety, last-public-task deletion protection, image behavior, runtime/student copy, or `TaskTypeRegistry` behavior.
- Task type display mapping is local UI copy: `text` renders as `Текстовое задание`, `single_choice` renders as `Выбор одного ответа`, and unknown future task types fall back to the raw identifier. Stored task type values, TypeScript unions, registry keys, and payloads remain unchanged.
- Localized teacher-facing scope includes `QuestTasksClient` shell actions/refresh/client-only fallbacks/success alerts/browser confirms/image fallback messages, `TaskForm` visible `Тип задания` label and Russian create/validation copy, `TaskCard` type labels and edit/delete aria-labels, `TextTaskEditor` copy, `SingleChoiceTaskEditor` copy, and `ImageUploader` upload/remove/empty/accessibility copy.
- Protected boundaries remain unchanged: server API JSON error contracts, HTTP status handling, `SESSION_EXPIRED_MESSAGE`, Supabase/internal technical errors, Storage passthrough errors, and returned `result.error` behavior. Only client fallback, validation, success, confirm, and accessibility copy was localized.
- Correct-answer selection remains stored as `{ options: { id: string; text: string }[], correctOptionId: string }`. Sprint 12.18.20 preserved the existing `checked` and `onChange` radio logic and added `value={option.id}` plus defensive `onClick={() => setCorrectOptionId(option.id)}` after browser verification showed `onChange` alone was not updating controlled state. Both handlers set the same option id, no double-toggle risk was found, and existing saved single-choice tasks remain compatible without migration or live-data repair.
- Browser verification confirmed correct-answer selection works, validation disappears, Save becomes enabled, and Preview reflects the selected answer. Save was not clicked and no live data write occurred.
- Points editing previously was not supported in `TextTaskEditor` or `SingleChoiceTaskEditor`: both rendered `value={task.points}` with `readOnly`, had no local editable points state, and the task update callback/PATCH flow did not persist points. This bug existed before Sprint 12.18.20, was not caused by localization, and required no migration or live-data repair.
- Editable Points support uses local string state initialized from `String(task.points)`, editable number inputs with `type="number"`, `min={1}`, and `step={1}`, temporary empty values while typing, and no forced fallback to `1`. Validation requires a non-empty finite integer at least `1`; decimal values are rejected with `Баллы должны быть целым числом не меньше 1.`
- Editor saves now pass numeric `points`, `TaskEditor` callback typing was minimally extended, and `QuestTasksClient` includes `points` in the existing PATCH body. Title, description, and content behavior remain unchanged.
- The task PATCH route supports optional `points`; validation runs only when supplied, invalid values return HTTP 400 using the existing validation style, and `points` is added to the Supabase update object only when supplied. Requests omitting `points` remain compatible, and authentication, ownership, task-parent scoping, safe 404, response shape, and error handling remain unchanged.
- `TaskList.tsx` was inspected and required no code changes.
- Manual browser verification passed on the canonical dashboard task route for Text and Single Choice localization, visible task type label, hidden raw known identifiers, correct-answer radio selection, validation disappearance, Save enablement, Preview synchronization, and editable Points no-write behavior. Text and Single Choice Points can be changed locally, empty intermediate values remain empty, decimals and zero are rejected, valid positive integers are accepted, Save state updates correctly, and Single Choice Points changes do not reset the selected correct answer. Save was not clicked, no PATCH write was performed, and no live data changed.
- Deferred localization/work includes runtime/student-facing localization, broader client/server error consistency, i18n/shared constants, and task CRUD/autosave refactors.
- Next safe step is planning Task Editor write verification.
- Sprint 12.18.21 completed controlled authenticated write verification for the teacher task editor using normal owner-safe UI/API flows.
- Text task verification created `TEMP - Points persistence text`, changed points to `7`, saved, reloaded, and confirmed points, text/content, internal `text` type, and visible `Текстовое задание` display persisted. The temporary Text task was deleted successfully.
- Single Choice verification created `TEMP - Points persistence single choice`, configured `Alpha` and `Beta`, selected `Beta` as correct, changed points to `9`, saved, reloaded, and confirmed points, options, `correctOptionId`, visible `Выбор одного ответа` display, and Preview state persisted. The temporary Single Choice task was deleted successfully.
- Cleanup passed: both temporary tasks were removed, no temporary task rows remain, no image was uploaded, no orphaned Storage object exists, no new quest was created, no Public quest was modified, no last-public-task deletion test occurred, and original quest/tasks remained otherwise unchanged.
- Optional task `points` PATCH support is now browser-write verified.
- Non-blocking UX issues remain: `TaskForm` has a Points input with an aria-label but no visible `Баллы` label; `TaskCard` has a visible pencil button that does not independently open the editor even though card click selection works.
- Next safe step is planning Task Creation and Card Action UX polish.
- Sprint 12.18.24 implemented the approved Task Creation and Card Action UX fixes in `TaskForm`, `TaskCard`, and `TaskList` only.
- `TaskForm` now has a visible semantic `Баллы` label associated with the Points input through `htmlFor="task-points"` and `id="task-points"` while preserving the existing aria-label, value, min, onChange, default value, and submitted points behavior.
- `TaskCard` now has a typed `onSelect` callback and an enabled pencil button with `type="button"`; the button preserves its Russian aria-label, styling, icon, and selected rendering, calls `event.stopPropagation()`, and invokes the existing task selection/edit behavior exactly once.
- `TaskList` passes `onSelectTask(task)` into `TaskCard`; card click remains unchanged, and pencil click opens the same task without duplicate bubbling.
- Manual authenticated browser verification passed for the visible `Баллы` label, pencil edit action, card click selection, delete confirmation/deletion flow, and layout/console sanity.
- One test task was accidentally deleted during verification. All current quest/task data is test data, no production data was affected, no recovery is needed, and continued development is unaffected.
- Historical non-blocking considerations at the end of Sprint 12.18.24: the static `task-points` id was safe with the current single `TaskForm` instance but should be revisited if multiple forms render simultaneously; delete-button bubbling into the card wrapper was pre-existing then and was superseded by Sprint 12.18.26.
- Next safe step is planning Task Action Event Isolation.
- Sprint 12.18.26 implemented delete-action event isolation in `TaskCard` only.
- The delete button now has `type="button"` and its click handler calls `event.stopPropagation()` before invoking `onDelete(task.id)` exactly once.
- Delete clicks no longer bubble to the parent card selection handler; existing icon, styling, Russian aria-label, confirmation flow, deletion behavior, and keyboard accessibility remain unchanged.
- `TaskList`, `QuestTasksClient`, owner-safe DELETE API behavior, confirmation text, last-Public-task deletion guard, error handling, list refresh, and `syncSelectedTask` fallback remain unchanged.
- Manual browser verification passed without confirming deletion: delete on an unselected task showed confirmation, Cancel preserved the previous selection, the unselected task did not open or become selected, pencil and card clicks remained unchanged, and no console or UI issue was reported.
- Static `task-points` remains acceptable with the current single `TaskForm`; unique-id work remains deferred until multiple simultaneous forms exist.
- Sprint 12.18.28 implemented the approved Teacher Task Workspace responsive layout and label fixes in `QuestTasksClient` and `TaskForm` only.
- `QuestTasksClient` now uses `grid-cols-1 xl:grid-cols-12`; the task list uses `xl:col-span-4`, the editor uses `xl:col-span-8`, narrower screens stack list above editor, and large screens retain the two-column layout.
- No sticky/fixed positioning or state-flow changes were introduced; selection, deletion, task loading, editor rendering, and existing workspace behavior remain unchanged.
- `TaskForm` now has visible semantic labels for `Название задания`, `Описание`, `Правильный ответ`, and `Подсказка`, while preserving the existing `Тип задания` and `Баллы` labels.
- Labels use matching `htmlFor`/`id` associations for `task-title`, `task-description`, `task-answer`, `task-hint`, `task-type`, and `task-points`; placeholders, values, handlers, validation, alert behavior, loading behavior, payload, and default points remain unchanged.
- Accessibility verification passed: labels remain visible while typing, labels focus their associated controls, the current single `TaskForm` has no duplicate ids, and static ids remain acceptable until multiple simultaneous forms exist.
- Manual responsive browser verification passed with no task creation or save: wide screens retained two columns, narrow screens stacked list above editor, no horizontal scrolling or clipped controls appeared, all six labels appeared, and label associations worked.
- Recent fixes remained unchanged: pencil button, delete event isolation, card selection, selected styling, points editing/persistence, correct-answer persistence, editor save behavior, image controls, Preview, localized copy, and last-Public-task guard.
- No route/API, schema/migration/RLS/policy/index, task content/type, create/save/autosave, Storage, runtime/student, publication safety, or deletion-guard change was included in Sprint 12.18.28.
- Next safe step is planning Teacher Task Workspace remaining UX prioritization.
- Sprint 12.18.30 preserves task-creation form state after a handled creation failure.
- The previous defect was that `TaskForm` reset after `onSave` resolved while `QuestTasksClient` handled create errors internally and resolved normally, which could erase a teacher's unsaved task draft.
- The create callback contract is now `Promise<boolean>`: `false` is returned for busy, session-expired, non-OK, malformed-response, and caught network/error paths; `true` is returned only after a valid created task is added to state and selected.
- `TaskForm` resets only after `true` and preserves title, description, correct answer, hint, task type, and points after `false`; endpoint, payload, error display, loading behavior, and successful reset behavior remain unchanged.
- Manual Offline browser verification passed: all TaskForm fields were filled with test values, Chrome DevTools Network mode was set to Offline, and Add task was clicked. The request failed before reaching the server, `Не удалось создать задание.` displayed, no task or Supabase write occurred, every entered field remained, Network mode returned to No throttling, and create was not retried.
- The responsive workspace, visible labels, pencil/delete/card behavior, points and correct-answer persistence, image controls, Preview, and last-Public-task guard remain unchanged.
- Next safe step is planning a disposable successful-create regression verification; no live write is approved until explicitly authorized.
- Sprint 12.18.31 completed controlled successful-create verification in owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`), which remained Draft.
- The unique temporary task `TEMP - Sprint 12.18.31 Create Success DELETE ME` used description `Disposable verification of successful task creation and form reset.`, correct answer `S31-CORRECT`, hint `S31-HINT`, `single_choice`, and points `7`.
- One Add task action produced no error, inserted the task once, selected it, and opened its editor. The stored type remained `single_choice` / `Выбор одного ответа` and points remained `7`.
- TaskForm reset only after success: title, description, correct answer, and hint were empty; type returned to `text`; points returned to `1`; button/loading returned to normal.
- The Single Choice validation `Добавьте минимум два варианта ответа.` and `Выберите один правильный ответ.` was expected because no options were added; no editor save occurred.
- Cleanup confirmed the exact temporary task's type and points, confirmed the native delete dialog once, removed only that task, restored the baseline empty list, left no residue or unexpected error, and preserved Draft status.
- Endpoint/payload, failure preservation, responsive layout, labels, card actions, points/correct-answer persistence, image controls, Preview, and last-Public-task protection remain unchanged. Next safe step is planning task-creation validation and UX review.
- Before Sprint 12.18.33, the task-creation `TaskForm` Points input converted a cleared value to `0`, could not remain temporarily empty, and required selecting the current value or using the numeric stepper for replacement. This non-blocking UX/validation finding was identified in Sprint 12.18.32 planning.
- Sprint 12.18.33 fixed the task-creation Points input root cause: numeric React state and `Number(e.target.value)` converted an empty string to `0`, blocking normal clear-and-retype editing.
- TaskForm now uses raw string points state with initial and successful-reset value `"1"`; temporary empty input is allowed, digit-only values are converted only after validation, and the existing payload remains `points: number`.
- Client validation requires `Number.isSafeInteger(points)` and a minimum of `1`; the inline error is `Баллы должны быть целым числом не меньше 1.`, invalid submission does not call `onSave`, and failed API creation preserves the exact raw input.
- POST and PATCH points validation now matches: JSON number only, finite safe integer, and at least `1`; numeric strings are rejected and omitted PATCH points leave the existing value unchanged.
- No-write browser verification passed: clearing `1` with Backspace left the field empty without `0`, normal replacement typing worked without Ctrl+A, empty and `0` submit showed the exact error without a create request or reset, entering `7` cleared it, and keyboard replacement from `7` to `12` worked. No task was created, no Supabase data changed, and no cleanup was required.
- `Promise<boolean>`, failed-create preservation, successful reset, title alert, optional fields, task types, labels, responsive layout, selection, editor behavior, image controls, Preview, and publication/deletion guards remain unchanged. Next safe step is controlled write verification planning only.
- Sprint 12.18.34 completed controlled create, PATCH, persistence, and cleanup verification in owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`) with an empty task-list baseline.
- The only temporary task was `TEMP - Sprint 12.18.34 Points Verification DELETE ME`: description `Disposable create and PATCH verification for safe integer points.`, correct answer `S34-CORRECT`, hint `S34-HINT`, type `text`, created with points `7`, then PATCH-updated to `12`.
- With No throttling and no request blocking, one successful create selected and opened the task, visibly persisted `7`, reset TaskForm points to `1` with the other fields, and returned loading to normal. One successful points-only PATCH persisted `12`, confirmed after refresh or reopening without unrelated changes.
- Cleanup verified the exact temporary task and points `12`, accepted the native confirmation once, deleted only that task, restored the empty baseline, preserved Draft status, and left no error or residue.
- TextTaskEditor and SingleChoiceTaskEditor retain raw string points state and client-block empty, zero, negative, and decimal values, but use `Number.isInteger` rather than `Number.isSafeInteger`. Unsafe integers can reach PATCH but are safely rejected by its finite safe-integer contract; this is a client/server UX mismatch, not a server data-integrity failure. No unsafe-integer browser write test was performed.
- TaskForm validation, POST/PATCH contracts, creation behavior, ownership/authentication, selection, optional fields, types, images, Preview, publication, and deletion guards remain unchanged. Next safe step is planning editor safe-integer alignment only.
- Sprint 12.18.36 completed shared points validation alignment. `lib/task-points.ts` now exports `parsePositiveSafeInteger(value: string): number | null` plus `Баллы должны быть целым числом не меньше 1.`; it accepts only digit-only positive safe integers and rejects empty, whitespace, signs, decimals, exponent notation, zero, unsafe integers, and overflow.
- TaskForm and both task editors now share that contract while retaining raw string state and temporary empty editing. The editors use conditional `aria-invalid` and `aria-describedby` linked to one visible points error, and Save remains disabled while points are invalid.
- Browser verification in both Text and Single Choice editors checked empty, `0`, decimal, and `9007199254740992` first; each remained invalid with the exact message, and the unsafe integer was not stored. A valid `12` cleared the error, succeeded through PATCH, and remained `12` after refresh without unrelated field changes. No cleanup was required for the existing test task.
- Task type is chosen only during creation. An existing task's stored `text` or `single_choice` type determines which editor opens and cannot be changed in the editor. To use another type, the teacher must create a new task with the desired type and may manually delete the old task if no longer needed. No automatic conversion exists; future conversion requires explicit field-mapping and data-loss rules.
- POST/PATCH contracts, `Promise<boolean>`, failed-create preservation, successful reset, editor fields, options, correct-answer handling, image controls, selection, responsive layout, Preview, publication guards, and deletion guards remain unchanged. Next safe step is planning task type conversion and editor UX only.
- Sprint 12.18.38 added immutable-type helper text below the read-only task-type fields in both editors: `Тип задания выбирается при создании и не меняется после сохранения.` and `Чтобы использовать другой тип, создайте новое задание и при необходимости удалите прежнее.`
- The labels now reference stable editor-specific IDs. The helper is visible to assistive technology, has no interactive semantics, uses secondary text styling, and wraps naturally without changing field or type behavior.
- Wide and narrow no-write visual verification confirmed readable copy, non-editable fields, no clipping or horizontal scroll, stable editor width, and usable Save plus other controls. No save, PATCH, live-data action, or cleanup occurred.
- Current MVP type behavior remains immutable: stored `task_type` selects the editor; teachers create a new task for another type and may manually delete the old task. No automatic conversion or "duplicate as another type" feature exists. Any future conversion or duplication requires explicit field mapping, data-loss rules, API design, and regression coverage.
- Points validation, editor fields/options/correct answers, images, save/loading/error behavior, selection, TaskForm, TaskEditor registry, APIs, schema, RLS, Storage, Preview, publication, and deletion guards remain unchanged. Next safe step is planning workspace accessibility and status messaging only.
- Sprint 12.18.40 updated only `QuestTasksClient`: the existing visible error region now has `role="alert"` plus `aria-live="assertive"`, while one `statusMessage` string conditionally renders a visible `role="status"` plus `aria-live="polite"` success region. No timeout, focus move, API contract, or data behavior was added.
- Exact success messages are `Задание создано.`, `Изменения сохранены.`, `Задание удалено.`, `Изображение загружено.`, and `Изображение удалено.` Each relevant action clears stale status at start; success is set only after successful local state update, and successful save/upload native alerts were replaced.
- The read-only technical route check used only GET and returned the expected protected-route HTTP `307` redirect to `/login` without an authenticated browser session. It performed no POST, PATCH, DELETE, image upload, or image-removal request and caused no live-data change; static roles/lifecycle, lint, build, and diff checks passed. Manual no-write browser verification confirmed no empty status space, stable layout, usable controls, immutable-type guidance, and unchanged local points validation.
- Controlled owned-Draft verification created, saved, and deleted one temporary Text task, confirmed exact create/save/delete messages and replacement lifecycle, preserved selection, restored the original task count through cleanup, and left the quest Draft. No existing task was intentionally modified. Image success paths were statically reviewed but not live-write verified; no image or Storage write occurred.
- At Sprint 12.18.40 completion, task-card interaction and keyboard limitations, primarily visual selected state, TaskForm, editors, points validation, immutable-type helper, APIs/request-response shapes, schema/migrations/RLS/Storage policy, Preview, publication, and deletion guards were otherwise unchanged; Sprint 12.18.42 supersedes the task-card selected-state portion.
- Sprint 12.18.42 updated only `TaskList` and `TaskCard`: `TaskList` derives `isSelected` from existing `selectedTaskId`, and `TaskCard` receives that boolean without new local selection state. The selected card retains its violet ring and adds visible secondary `Выбрано`; metadata remains naturally wrapping.
- The existing card wrapper remains a non-focusable mouse-selection `div` with no role, `tabIndex`, or keyboard handler. The native pencil keeps `stopPropagation()` and `onSelect`, now has `aria-label="Открыть задание «{title}»"`, and uses `aria-current="true"` only for the active task. No `aria-selected`, `aria-pressed`, listbox, option, tab, or composite-widget semantics were added.
- Manual authenticated no-write verification confirmed Tab access, Enter/Space pencil activation, unchanged mouse selection, selected ring/text movement, usable narrow layout, wrapping metadata, and reachable action controls. No Save, Create, Delete, upload, removal, POST, PATCH, DELETE, or live-data action occurred.
- No focus move, refs, or deletion-focus recovery were added; focus remains on the pencil after keyboard activation. Delete confirmation/isolation, status/error messaging, selection synchronization, task display, TaskForm, editors, points validation, immutable-type guidance, APIs, Preview, and guards remain unchanged. Next safe step is planning deleted-task focus recovery only.
- Sprint 12.18.44 implemented deleted-task focus recovery in `QuestTasksClient`, `TaskList`, and `TaskCard`. After successful selected-task deletion, the existing `syncSelectedTask(nextTasks)` algorithm still selects the first remaining task and focus moves to its pencil; after unselected deletion, selection remains unchanged while focus moves to the next surviving task at the deleted index or the previous task. Deleting the only task focuses the existing `Задания` heading using `tabIndex={-1}`.
- A current selected-task-id ref avoids a stale selected/unselected decision when selection changes during DELETE. Cancellation, failed DELETE, session expiry, server rejection, and guards create no focus target.
- The focus registry is an identity-safe `Map<taskId, HTMLButtonElement>` held in a ref. `TaskCard` retains its exact mounted pencil for callback-ref cleanup; removal happens only when `map.get(taskId) === element`, protecting replacement elements from stale cleanup.
- The initial controlled test deleted the selected temporary task successfully, synchronized selection, and showed `Задание удалено.`, but focus did not move to the intended remaining pencil and Enter immediately after deletion did not activate it. Temporary data was cleaned up and the implementation was not committed before the corrective `focusSignal`/`useLayoutEffect` work. Existing missing refs retain their target until only matching registration retries; absent task targets clear from current tasks without redirecting focus; no timer, polling, selector, or editor autofocus is used.
- Final controlled verification created and deleted one temporary selected Text task: `Задание удалено.` appeared, the existing remaining task was selected, its intended pencil received focus, and Enter activated it immediately without another Tab press. Temporary data was removed and cleanup restored the original task count; no existing task, image, or Storage object was modified. Other selected/unselected positions and the only-task heading fallback were statically reviewed, not all live-write verified.
- Task ordering, confirmation, DELETE contract, status and error handling, TaskForm, editors, points validation, immutable-type guidance, images, Preview, schema, RLS, publication, and deletion guards remain unchanged. Next safe step is planning the remaining task-workspace accessibility review.
- Sprint 12.18.46 implemented editor label/control associations only: `Название` -> `#text-task-title`, `Текст задания` -> `#text-task-description`, `Вопрос` -> `#single-choice-task-title`, and `Описание` -> `#single-choice-task-description`.
- These stable, editor-specific IDs do not collide. Existing type-field and points associations, including points `aria-invalid` and `aria-describedby`, remain unchanged; no editor state, validation, save/PATCH payload, image, option, correct-answer, layout, responsive, API, schema, or Storage behavior changed.
- Manual read-only verification confirmed each of the four labels focuses its associated control. No Save, server request, or live-data write occurred.
- Separately, the user reported intermittent navigation to quest Settings while clicking `Добавить вариант` or dragging the outer document scrollbar at the far-right edge. Static inspection found no confirmed application navigation path: the button is `type="button"`, is outside a form and Link, and only updates local option state; the Settings link is normal content-sized navigation, with no confirmed overlay, stretched link, fixed right-edge element, redirect, or horizontal-overflow source. Runtime isolation remains deferred QA; no speculative fix was implemented or claimed.
- Sprint 12.18.48 replaced only TaskForm's native blank-title alert with inline local validation. `titleError` and a typed ref to the existing `#task-title` input make blank or whitespace-only submission show `Введите название задания.`, call `focus()`, and return before points validation or `onSave` without a request or reset.
- The conditional field error is `#task-title-error` with `role="alert"`; the title input conditionally uses `aria-invalid` and `aria-describedby`. Existing label association and red error styling are retained, no extra ARIA naming or ID was added, and API failures remain separately announced by the workspace error region.
- Empty/whitespace behavior, refocus on repeated invalid submit, non-whitespace error clearing, and preservation of type and points were manually verified locally with no Save, POST, upload, removal, cleanup, or live-data write. Successful-create reset and API-failure retention remain static-only review. The create `Promise<boolean>` contract, points validation, payload, selection, layout, APIs, and deferred Settings QA remain unchanged.
- Sprint 12.18.49 accessibility exit review found no MVP blocker for keyboard-only teacher task-workspace completion. Implemented coverage includes separate live regions, field labels and validation associations, immutable type guidance, selected-card semantics, native pencil behavior, isolated deletion, bounded identity-safe focus recovery, and accessible image controls.
- Important non-blocking backlog: session-expired text remains English, redirects immediately, and the login page explains the reason; no arbitrary redirect delay is recommended, so future work should prioritize localization and clearer login feedback. There is also no `aria-busy` or action-specific busy text, and editor Save summaries are not individually associated to every invalid control.
- The Single Choice correct-answer radios have visual context but no programmatic group label; every radio currently exposes the repeated accessible name `Правильный ответ`. A future `fieldset`/`legend` or equivalent group-label review is recommended; no implementation was performed.
- The browser-native `Удалить задание?` confirmation is keyboard accessible and exposed to screen readers by the browser, but omits the task title. It was not independently screen-reader tested in this project. A custom dialog remains optional polish because focus management and regression risk would increase.
- Before internal testing, isolate intermittent Settings navigation. Before public MVP, verify unselected deletion focus positions, only-task heading fallback, valid create/reset, and API-failure retention. The Settings observation remains unresolved deferred QA with no confirmed static code path or speculative fix.
- Sprint 12.19.1 catalog/student-access planning passed. `/` and `/login` are public; legacy `/quests` routes redirect into the session-protected, owner-safe teacher workspace, whose Preview/Play routes are teacher-owner-only. `QuestRunner` is local-only and its authoring payload includes `answer` plus `content.correctOptionId`, so it must not serve public/student runtime; a future sanitized student DTO is required.
- Existing quest fields are `id`, `title`, nullable `description`, `author_id`, `difficulty`, `is_public`, `created_at`, nullable `subject_id`, grades, duration, nullable language/cover/category, and tags. `is_public` is the sole mutable publication state; publishing needs one task but no cover or complete-task validation. There is no slug, published timestamp, price/currency/entitlement, author profile, moderation, or status enum. Legacy task content can be null.
- `001_initial_schema.sql` is empty, therefore local migrations do not authoritatively describe the complete live schema; no live inspection occurred. Verify live columns, foreign keys, indexes, functions, views, RPCs, and applied policies before any database change. Current RLS allows authenticated parent-quest owners only; anonymous/non-owner public reads fail and owner policies must not be broadened.
- The normal anon-key browser/server clients are the only current clients; no service-role public client should be introduced because it bypasses RLS. Teacher services use explicit quest selections but owner task loading uses `select("*")`, which must never become public. Use a dedicated server-only service over a published-only projection, view, or RPC with database-enforced eligibility; decide view versus RPC after live verification.
- Recommended MVP is anonymous `/catalog` and `/catalog/[id]` browsing, login before later `/catalog/[id]/start`, separate public/student DTOs, and no base authoring-row exposure. Keep `is_public`; defer states, timestamps, versioning, moderation, slugs, payments, assignments, entitlements, and attempts. Sprint 12.19.1 initially considered optional validated public cover URLs for cards.
- That cover-URL planning decision is superseded by authoritative Sprint 12.19.2 verification: the first public DTO omits covers, returns no raw `cover_image_path`, and rejects application-side URL construction because it requires the denied raw path. The MVP uses a fallback cover. Future media needs an opaque media boundary, private/signed delivery, or a separate explicit owner-UUID disclosure decision.

Schema mismatch risks:

- Existing legacy tasks may still have `content = null`; single-choice content should be created and saved through the editor before expecting options in preview/play.
- Public reads remain for task images until a private bucket or signed URL plan is approved.
- Public reads remain for task and cover images until a private bucket or signed URL plan is approved.
- Legacy non-owner-scoped `tasks/{uuid}` objects remain for compatibility.
- Upload-before-failed-PATCH races may still orphan unattached owner-scoped image objects.
- Failed best-effort cover cleanup may leave orphaned cover objects.
- Direct quest-column category/tags will need a future normalization path if marketplace taxonomy, multilingual category labels, platform-defined categories, or public catalog indexing become requirements.
- Future category/tag filtering may need query/index planning, but indexes are deferred until filtering architecture and data volume justify them.
- Expired-session API `401` responses redirect to `/login?error=session_expired` in current teacher client workflows; unsaved edits are not persisted across the login redirect.
- Direct authenticated API edge-case verification for invalid subject UUID, missing subject UUID, and foreign quest PATCH was not executed in Sprint 12.17.5 because no safe controllable authenticated API session was available; those paths were verified by code review and browser save/clear covered the authenticated success path.
- Local migrations are not a reliable source of truth for the live schema yet.

## Sprint 12.19.2 - Live Schema and Public Read Boundary Verification

Sprint 12.19.2 passed as a documentation and architecture-verification sprint. The repository was clean and synchronized on `feature/next-work` at `0c5496b`; no project file, SQL, schema, RLS, grant, Storage, or live data change occurred.

Authoritative live schema: `public.profiles`, `public.quests`, `public.quest_tasks`, and `public.subjects` exist, are owned by `postgres`, have RLS enabled, and do not FORCE RLS. `public.categories` does not exist.

`public.profiles`: `id uuid NOT NULL` with no default; `full_name text NULL` with no default; `email text NOT NULL` with no default; `role text NOT NULL DEFAULT 'teacher'`; `avatar_url text NULL` with no default; and `created_at timestamptz NULL DEFAULT now()`. Constraints are PRIMARY KEY (`id`) and UNIQUE (`email`). Its owner is `postgres`, RLS is enabled without FORCE RLS, and no user-defined trigger exists.

`quests` has nullable `author_id`, `subject_id`, `difficulty`, `is_public`, `created_at`, grade, duration, language, cover, and category fields; `tags` is non-null `text[]` with default `{}`. Live foreign keys are `author_id -> profiles(id)` and `subject_id -> subjects(id)`, both NO ACTION. Live checks enforce category length, duration 5-240, grades 1-11 with a complete ordered pair, language `ru|kk|en`, and at most ten tags. There is no difficulty check, user-defined trigger, or catalog index beyond `quests_pkey`.

`public.quest_tasks`: `id uuid NOT NULL DEFAULT gen_random_uuid()`; `quest_id uuid NULL`, `sort_order integer NULL`, `title text NULL`, `description text NULL`, and `answer text NULL`, each with no default; `points integer NULL DEFAULT 1`; `created_at timestamptz NULL DEFAULT now()`; `hint text NULL`, `image_url text NULL`, `video_url text NULL`, and `audio_url text NULL`, each with no default; `task_type text NULL DEFAULT 'text'`; and `content jsonb NULL` with no default. Constraints are PRIMARY KEY (`id`) and FOREIGN KEY (`quest_id`) REFERENCES `public.quests(id)` ON DELETE CASCADE; no checks exist for task type, points, or sort order. Its owner is `postgres`, RLS is enabled without FORCE RLS, no user-defined trigger exists, `quest_tasks_pkey` is its only index, and neither `quest_id` nor `(quest_id, sort_order)` is indexed.

`public.subjects`: `id uuid NOT NULL DEFAULT gen_random_uuid()`; `name text NOT NULL` with no default; `grade integer NULL` with no default; and `created_at timestamptz NULL DEFAULT now()`. PRIMARY KEY (`id`) and `subjects_pkey` are its only constraint/index. Its owner is `postgres`, RLS is enabled without FORCE RLS, and no user-defined trigger exists.

Current live RLS is owner-safe: quests permit authenticated owner SELECT/INSERT/UPDATE but no DELETE or anonymous published read; tasks permit authenticated parent-quest-owner SELECT/INSERT/UPDATE/DELETE and no anonymous task read; subjects permit authenticated SELECT and no anonymous read. No relevant profiles policy was returned. Anon, authenticated, and service_role have broad explicit table ACLs and PUBLIC has USAGE on `public`, but RLS is the effective anon/authenticated row boundary. No existing catalog/view/materialized view/function/RPC or naming conflict exists.

`quest-images` remains public with a 5,242,880-byte limit and JPEG/PNG/WebP MIME allowlist. PUBLIC SELECT supports anonymous image retrieval; authenticated owner-path task image and strict owner-path quest-cover writes/deletes remain. Owner UUIDs remain in object paths, an existing disclosure tradeoff. `pgcrypto` 1.3 and `uuid-ossp` 1.1 are installed; `pg_graphql` is absent. No `supabase_migrations` relation was found, so no live migration identifiers can be inspected and the live schema is authoritative over the empty local `001_initial_schema.sql`.

Live/type drift: `types/quest.ts` omits `grade_min`, `grade_max`, and `estimated_duration_minutes`, and overstates `author_id`, `difficulty`, and `created_at` as non-null. `TeacherQuest` includes grade/duration but should model author, difficulty, and creation time as nullable. `TeacherQuestTask` and `QuestTask` overstate `quest_id`, `sort_order`, title, points, and task type as non-null; JSONB `content` can be any valid JSON shape. `getOwnedQuestTasks()` uses `select("*")` and remains private-only.

Catalog/runtime separation is mandatory: task rows contain answer, hint, content, and scoring-related data. Public list/detail checks task presence only through internal `EXISTS`, return no count or row, and future student runtime requires its own sanitized boundary.

The selected design is two stable, narrow SECURITY DEFINER SQL RPCs: `public.list_public_catalog_quests()` and `public.get_public_catalog_quest(uuid)`. They use fixed `SET search_path = pg_catalog, public`, schema-qualified tables, explicit return columns, `quests.is_public IS TRUE`, and task `EXISTS`; only anon and authenticated receive EXECUTE after default PUBLIC EXECUTE is revoked. No service role, anonymous base-table SELECT policy, public task policy, or weakening of teacher policies is approved. Subject name is joined inside the RPC and `subject_id` is excluded. Missing, draft, and taskless detail requests return no row indistinguishably.

The first public DTO is `PublicQuestCatalogItem`: `id: string`, `title: string`, `description: string | null`, `subjectName: string | null`, `difficulty: number | null`, `languageCode: "ru" | "kk" | "en" | null`, `gradeMin: number | null`, `gradeMax: number | null`, `estimatedDurationMinutes: number | null`, `category: string | null`, `tags: string[]`, and `createdAt: string | null`. It excludes author and subject IDs, raw cover path, publication state, task count, points, answer, hint, content, `correctOptionId`, scoring/validation rules, and database/API error details. Initial public catalog cards omit covers: application-side URL construction needs the raw path and does not satisfy the denylist. A later opaque media boundary, private/signed delivery, or explicit owner-UUID disclosure decision is required; fallback cover is acceptable.

**NOT APPLIED - REQUIRES SEPARATE APPROVAL:** first migration plan is `public.quest_tasks(quest_id)`, partial `public.quests(created_at DESC, id DESC) WHERE is_public IS TRUE`, and the two explicit SECURITY DEFINER RPCs. It must use no `SELECT *`, revoke default PUBLIC EXECUTE, grant only anon/authenticated EXECUTE, and leave table grants plus owner RLS unchanged. Subject, difficulty, language, and grade indexes are deferred until query plans or scale justify them.

**NOT EXECUTED:** rollback order is deploy code that no longer calls the RPCs; revoke EXECUTE from anon/authenticated; drop detail RPC; drop list RPC; drop partial catalog index; drop `quest_tasks(quest_id)` index; then verify anonymous base-table/task reads remain denied and teacher owner reads still work. Existing owner RLS, Storage policies, and application rows are not altered.

Future verification after separately approved migration: inspect function definitions, owners, SECURITY DEFINER status, fixed search path, grants, and indexes; verify direct anonymous quest/task reads remain denied; verify RPC list/detail allow only published quests with tasks and omit all denylisted fields/counts; verify teacher owner flows remain unchanged. Controlled writes require separate approval and an existing owned Draft with at least one task: temporarily publish, verify catalog visibility, unpublish, and restore the original state. Do not create disposable quests because quest deletion is unavailable.

Security classification: P0 for anonymous base-table SELECT, public task policy, or answer/scoring exposure; P1 for SECURITY DEFINER bypass of non-forced RLS and its exact owner/signature/grants/output/search path; P1 existing media disclosure through public owner-UUID paths; P1 integrity gaps for difficulty/task type/points/sort order; P2 performance gaps for missing task-existence and catalog-order indexes. Recommendation A: proceed only with separate approval for a migration-planning sprint; SQL application and catalog code remain separate.
