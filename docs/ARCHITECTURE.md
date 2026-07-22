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
- `/dashboard/quests/[id]/settings` — basic quest metadata and publish controls.
- `/dashboard/quests/[id]/preview` — read-only teacher preview using `TaskRenderer` in preview mode.
- `/dashboard/quests/[id]/play` — teacher test flow using `QuestRunner`.

In the Teacher Quest Library, the primary `Open / Edit quest` action points to `/dashboard/quests/[id]/settings`. Quest cards also link to edit tasks, preview, and play/test. The duplicate `Settings` action was removed in Sprint 12.6.

The task editor remains on the existing non-dashboard route:

- `/quests/[id]/tasks`

Sprint 12.5 integrated this existing task editor route into the teacher workspace by rendering `QuestWorkspaceNav` with `active="tasks"` directly on the page. The editor was not moved to `/dashboard`, and no new `/dashboard/quests/[id]/tasks` route exists yet.

`components/dashboard/QuestWorkspaceNav.tsx` centralizes teacher workspace links:

- Back to library
- Settings
- Edit tasks
- Preview
- Play/Test

Future route work should analyze breadcrumbs, page titles, and whether a dashboard task route is needed before moving or replacing existing `/quests/*` pages.

Sprint 12.7 decision: do not add breadcrumbs or a shared `QuestWorkspaceHeader` yet. `QuestWorkspaceNav` already provides practical navigation, dashboard header duplication is still small, and the task editor remains on `/quests/[id]/tasks` with existing Russian UI text. Revisit shared headers or breadcrumbs only if the dashboard workspace grows.

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
- Per-tag length up to 24 characters, empty-tag removal, display casing preservation, and case-insensitive duplicate removal are planned for server-side validation in the next app implementation sprint.
- No category/tag indexes, RLS changes, policies, or app code changes are included in Sprint 12.17.12.

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
- Quest creation sets `author_id` from the authenticated server session.
- Quest settings save matches both quest `id` and `author_id`.
- Task CRUD verifies ownership through the parent quest.
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
- Do not add attempt persistence yet.
- Do not touch runtime/editor/JSONB architecture without explicit approval.
- Next safe step is integrating category/tag editing into owner-safe Quest Settings.

Schema mismatch risks:

- Existing legacy tasks may still have `content = null`; single-choice content should be created and saved through the editor before expecting options in preview/play.
- Public reads remain for task images until a private bucket or signed URL plan is approved.
- Public reads remain for task and cover images until a private bucket or signed URL plan is approved.
- Legacy non-owner-scoped `tasks/{uuid}` objects remain for compatibility.
- Upload-before-failed-PATCH races may still orphan unattached owner-scoped image objects.
- Failed best-effort cover cleanup may leave orphaned cover objects.
- Direct quest-column category/tags will need a future normalization path if marketplace taxonomy, multilingual category labels, platform-defined categories, or public catalog indexing become requirements.
- Server-side tag normalization must remove empty tags and case-insensitive duplicates before the UI writes category/tag metadata.
- Expired-session API `401` responses redirect to `/login?error=session_expired` in current teacher client workflows; unsaved edits are not persisted across the login redirect.
- Direct authenticated API edge-case verification for invalid subject UUID, missing subject UUID, and foreign quest PATCH was not executed in Sprint 12.17.5 because no safe controllable authenticated API session was available; those paths were verified by code review and browser save/clear covered the authenticated success path.
- Local migrations are not a reliable source of truth for the live schema yet.
