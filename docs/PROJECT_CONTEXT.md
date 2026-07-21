# Qwestum-Education Project Context

Qwestum-Education is an educational quest platform built with Next.js 16, TypeScript, Tailwind, and Supabase.

The product lets teachers create learning quests made of modular tasks, preview those tasks while editing, and run quests in a student-facing play mode.

## Current Branch

- `feature/next-work`

## Current State

Implemented:

- Modular Task Editor
- `TaskTypeRegistry`
- Text task editor and renderer
- Single choice task editor and renderer
- Task content stored in the `quest_tasks.content` JSONB field
- Live Preview
- Task validation
- Preview mode and Play mode
- Runtime task renderer
- Quest runtime engine
- `QuestRunner`
- `RuntimeContext`
- `ProgressBar`
- `TaskNavigator`
- `QuestStartScreen`
- `QuestFinishScreen`
- `QuestResults`

Implemented task types:

- `text`
- `single_choice`

## Teacher Experience Status

Completed Sprint 12 work:

- Sprint 12.1 — Teacher Quest Library at `/dashboard/quests`.
  - Loads owned quests through server-side teacher helpers.
  - Loads owned task counts through server-side teacher helpers.
  - Shows `title`, `description`, `difficulty`, Public/Draft from `is_public`, `created_at`, and task count.
  - Links to settings, edit tasks, preview, and play/test.
- Sprint 12.2 — Teacher Preview / Play Routes.
  - `/dashboard/quests/[id]/preview` renders all tasks read-only with `TaskRenderer` in `mode="preview"`.
  - `/dashboard/quests/[id]/play` mounts `QuestRunner`.
  - Answers and results are not persisted yet.
- Sprint 12.3 — Teacher Quest Settings / Publish Controls.
  - `/dashboard/quests/[id]/settings` edits `title`, `description`, `difficulty`, `is_public`, grade range, and estimated duration.
  - Saves through an authenticated owner-safe teacher API route.
  - `is_public = true` means Public; `is_public = false` means Draft.
  - No `status` field and no migration were added.
- Sprint 12.4 — Teacher Quest Workspace Navigation.
  - `components/dashboard/QuestWorkspaceNav.tsx` is used in settings, preview, and play pages.
  - Task editing intentionally remains at `/quests/[id]/tasks`.
- Sprint 12.5 - Teacher Task Editor Dashboard Integration.
  - Added `QuestWorkspaceNav` to the existing task editor route at `/quests/[id]/tasks`.
  - The task editor now shows workspace navigation with `active="tasks"`.
  - No dashboard task route was created.
  - No editor logic, task components, services, runtime, migrations, or JSONB architecture were changed.
  - The task editor route intentionally remains outside `/dashboard` for now to avoid breaking the existing working editor.
- Sprint 12.6 - Teacher Workspace Polish / Route Consistency.
  - Completed route consistency analysis.
  - `Open / Edit quest` in `/dashboard/quests` now points to `/dashboard/quests/[id]/settings`.
  - Removed the duplicate `Settings` action from quest cards.
  - Current library actions are `Open / Edit quest`, `Edit tasks`, `Preview`, and `Play/Test`.
  - Legacy routes `/quests/[id]` and `/quests/[id]/tasks` are intentionally preserved.
- Sprint 12.7 - Breadcrumbs / Page Title Analysis.
  - No breadcrumbs are planned for the current MVP.
  - No shared `QuestWorkspaceHeader` is planned yet.
  - Current dashboard page titles are acceptable for MVP: `Teacher Quest Library`, `Quest Settings`, `Teacher Preview`, and `Teacher Test Mode`.
  - Task editor title/text remains unchanged because `/quests/[id]/tasks` is a legacy route with Russian UI text and mojibake risk.
- Sprint 12.8 - Teacher Quest Analytics.
  - Added teacher-only content analytics summary to `/dashboard/quests`.
  - Shows Total quests, Public quests, Draft quests, Total tasks, and Total points.
  - Uses owned quest and owned task summary data only.
  - No persisted attempts/results exist yet.
  - Student learning analytics are deferred until answer persistence, auth, privacy, and schema decisions are made.
- Sprint 12.9 - Attempt Persistence / Student Analytics Architecture.
  - No attempt persistence is implemented yet.
  - No migrations, attempt services, routes, runtime changes, task editor changes, or JSONB changes were added.
  - Teacher Test Mode remains local-only for now.
  - Future persistence should target real student attempts after auth, RLS, privacy, and schema decisions.
  - Future table concepts: `quest_attempts` and `quest_attempt_answers`.
- Sprint 12.10 - Auth / RLS Boundaries Architecture.
  - Analysis confirmed the project has early auth pieces but no enforced session, role, or ownership boundary yet.
  - Active MVP roles should be teacher and student.
  - Admin and school/organization roles are deferred.
  - `author_id` appears intended for quest ownership but is not actively used by current quest services/pages.
  - Future teacher dashboard queries should be scoped to owned quests.
  - Future public/student catalog queries should be scoped to public or assigned quests.
  - Real student attempts and private teacher analytics must wait for auth, ownership, and RLS design.
- Sprint 12.11 - Supabase Schema / RLS Audit.
  - A read-only live Supabase probe confirmed `quests.author_id` exists.
  - During the audit, visible live quests had `author_id IS NULL`; these were later assigned to the verified teacher owner before owned-only queries were enabled.
  - During the audit, live `quest_tasks` was readable through the anon client and had 10 visible rows.
  - Live `quest_tasks.content` was missing during the audit, despite local migration/code/runtime expectations.
  - Broad anonymous reads were possible before Sprint 12.15.3 RLS hardening.
  - Storage bucket/policy state for `quest-images` is not confirmed.
  - Attempt persistence remains deferred until ownership, RLS, privacy, and student flows are intentionally designed.
- Sprint 12.12 - Schema Repair / Migration.
  - Added `database/migrations/003_add_quest_task_content.sql`.
  - The migration was manually applied and verified in live Supabase.
  - `public.quest_tasks.content` now exists and is readable as JSONB.
  - Existing legacy task rows may still have `content = null`.
- Task Type Creation Fix.
  - `components/tasks/TaskForm.tsx` now exposes only implemented MVP task types: `text` and `single_choice`.
  - `text` remains the default task type.
  - `single_choice` creation, editor loading, option saving, correct answer saving, and refresh persistence were manually verified.
- Sprint 12.14 - Auth, Ownership, and Owner-Safe Teacher CRUD.
  - Added Supabase SSR session support and protected `/dashboard`.
  - Disabled unimplemented dashboard sidebar links.
  - Scoped teacher dashboard quest reads to owned quests.
  - Added owner-safe quest creation and settings save.
  - Added owner-safe task CRUD through authenticated server routes.
  - Kept storage upload behavior unchanged.
- Sprint 12.15 - Legacy Read Removal and RLS Hardening.
  - Removed legacy browser-side quest and task reads from `/quests` and `/quests/[id]`.
  - `/quests` redirects to `/dashboard/quests`.
  - `/quests/[id]` redirects to `/dashboard/quests/[id]/preview`.
  - Added and applied `database/migrations/004_harden_quest_rls.sql`.
  - Broad public `quests` and `quest_tasks` policies were removed in live Supabase.
  - `quests` access is now owner-scoped for authenticated teachers through `auth.uid()`.
  - `quest_tasks` ownership is derived through the parent quest.
  - Anonymous direct table access to `quests` and `quest_tasks` is denied.
  - Quest deletion remains unavailable because no `quests` DELETE policy exists.
  - Read-only smoke tests passed for library, settings, task editor, preview, and play/test.
- Sprint 12.15.4a - Owner-Safe Storage Upload Boundary.
  - Added an authenticated owner-safe image upload route at `/api/teacher/quests/[id]/tasks/[taskId]/image`.
  - Removed direct browser Supabase Storage upload from the task editor flow.
  - New uploads use owner-prefixed paths: `teachers/{userId}/quests/{questId}/tasks/{taskId}/{uuid}.{ext}`.
  - Quest ownership and task-to-quest relation are verified before upload.
  - Server validation allows only JPEG, PNG, and WebP images up to 5 MB.
  - Added and live-applied `database/migrations/005_harden_quest_image_storage.sql`.
  - `quest-images` remains public for existing public URLs, but public INSERT, UPDATE, and DELETE policies were removed.
  - Authenticated owner-prefixed INSERT policy is active.
  - Runtime task images now render in the editor, Teacher Preview, and Teacher Play/Test for text and single-choice tasks.
  - Legacy `tasks/{uuid}` storage objects remain unchanged.
- Sprint 12.15.5a - Owner-Safe Task Image Removal.
  - Added authenticated owner-safe task image removal through the existing image route.
  - Browser removal sends no object path or image URL.
  - The DELETE route verifies authenticated user, owned quest, and task relation before clearing image data.
  - `quest_tasks.image_url` is cleared before best-effort Storage deletion.
  - Compare-and-clear protection returns HTTP 409 and skips Storage deletion if the task image changed concurrently.
  - Repeated removal is idempotent.
  - Only owner-scoped paths shaped as `teachers/{userId}/quests/{questId}/tasks/{taskId}/{filename}` are eligible for deletion.
  - Legacy `tasks/{uuid}` storage objects are never deleted.
  - Added and live-applied `database/migrations/006_add_owner_quest_image_delete_policy.sql`.
  - Authenticated owner-prefixed Storage DELETE policy is active; public Storage DELETE remains disabled.
  - Live removal was verified in the task editor, Teacher Preview, and Teacher Play/Test.
- Sprint 12.15.5b - Safe Image Replacement Cleanup.
  - Added a canonical server-only owner-scoped image URL parser.
  - Image replacement cleanup reads the previous `image_url` server-side.
  - The new `image_url` is saved before old object cleanup is attempted.
  - Previous objects are deleted only when they match the authenticated user, quest, and task path.
  - Browser replacement sends no previous URL or object path.
  - Legacy `tasks/{uuid}` storage objects are never deleted.
  - Cleanup failure is non-blocking and keeps the successfully saved replacement.
  - Explicit image removal behavior remains intact.
  - Live replacement was verified in the task editor, Teacher Preview, and Teacher Play/Test.
  - After verification, the new owner-scoped object remained, the previous owner-scoped object was removed, and legacy objects remained unchanged.
  - Concurrent replacements may still orphan an intermediate object.
- Sprint 12.15.5c - Task Delete Image Cleanup.
  - Task DELETE now returns the deleted row `id` and `image_url`.
  - The database row is deleted before Storage cleanup is attempted.
  - Cleanup uses only the deleted row's server-returned `image_url`.
  - The canonical server-only owner-scoped parser is reused.
  - Only owner-scoped paths matching authenticated user, quest, and task are eligible for deletion.
  - Browser task deletion sends no image URL or object path.
  - Legacy `tasks/{uuid}` storage objects are never deleted.
  - Cleanup failure is non-blocking.
  - No migration or UI change was required.
  - Live verification confirmed a temporary task was deleted through the UI, its row was removed, its owner-scoped Storage object was removed, legacy objects were unchanged, and the editor remained functional.
  - Upload-before-failed-PATCH races may still orphan an unattached object.
- Sprint 12.16.2 - Teacher Logout / Session UX.
  - Added a POST-only server logout route at `/auth/logout`.
  - Logout uses the existing Supabase SSR server client and accepts no browser-controlled redirect destination.
  - Successful logout redirects with HTTP 303 to `/login?logged_out=1`.
  - Failed logout redirects safely to `/login?error=logout_failed`.
  - Dashboard header now shows the authenticated teacher email and a `Sign out` control.
  - Logout uses a plain HTML POST form and keeps the dashboard layout as a Server Component.
  - Authenticated users opening `/login` are redirected to `/dashboard`.
  - Login feedback uses a fixed allowlist for `logged_out`, `missing_auth_code`, `auth_callback_failed`, and `logout_failed`.
  - Raw query values and Supabase errors are never displayed.
  - Magic-link callback behavior remains unchanged.
  - No migration or RLS change was required.
  - Manual verification confirmed logout cleared the session, the signed-out redirect/message worked, `/dashboard` remained inaccessible after logout, browser Back plus refresh did not restore access, and magic-link login still works.
  - A transient Turbopack/module-resolution issue was caused by stale dev state/file locking and was resolved without code changes.
- Sprint 12.16.4 - Expired Session / API 401 UX.
  - Added a client-only expired-session helper for protected teacher client workflows.
  - The fixed expired-session message is `Your session has expired. Please sign in again.`
  - The fixed redirect target is `/login?error=session_expired`.
  - A module-level guard deduplicates repeated redirect attempts from concurrent `401` responses.
  - Task editor actions, quest settings save, new quest creation, and storage upload/remove flows detect `401` before generic error parsing.
  - Technical `Unauthorized.` messages are no longer shown to users for expired teacher sessions.
  - No success state is applied after `401`, and no automatic mutation retry or replay was added.
  - Login feedback allowlist now supports `error=session_expired`.
  - Protected API contracts, RLS policies, Supabase configuration, and migrations were unchanged.
  - Manual verification confirmed logout in another tab followed by a protected action redirects to the session-expired login message without false success, and re-login still works.
  - Known limitations: unsaved edits are not persisted across login redirect, no return-to-current-page support, no cross-tab sync, no mutation replay, and upload-success followed by PATCH-401 may leave an orphaned image.
- Sprint 12.17.2 - Quest Grade Range and Duration Metadata.
  - Added and live-applied `database/migrations/007_add_quest_metadata.sql`.
  - Added nullable `quests.grade_min`, `quests.grade_max`, and `quests.estimated_duration_minutes`.
  - CHECK constraints enforce grades 1-11, both grade values null or both populated, `grade_min <= grade_max`, and duration 5-240 minutes.
  - No defaults or backfill were added; all 7 existing quests remained compatible with null metadata.
  - `subject_id` remained untouched and no `subject` text column was added.
  - Existing owner-scoped quest RLS policies remained unchanged.
  - Quest Settings supports grade range and estimated duration; empty controls save `null`, and Grade-from-only mirrors to Grade-to on submit.
  - Dashboard and Teacher Preview display metadata only when populated, including `Grades 5-7`, `45 min`, and `Grade 7`.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - Browser verification confirmed range save/persistence, single-grade display, metadata clearing, and existing quest compatibility.
- Sprint 12.17.3 - Quest Subject Lookup Planning.
  - Confirmed `quests.subject_id` is nullable UUID and has a foreign key to `public.subjects.id`.
  - Confirmed `public.subjects` has `id uuid`, `name text`, `grade integer nullable`, and `created_at timestamptz`.
  - Confirmed subject lookup rows exist, exact duplicate `name + grade` pairs were not found, and all 7 existing quests currently have `subject_id = null`.
  - Confirmed subject UI should reuse `subject_id`; no duplicate `subject` text column is planned.
- Sprint 12.17.4 - Subjects Read Policy.
  - Added and live-applied `database/migrations/008_add_subjects_read_policy.sql`.
  - `public.subjects` RLS remains enabled.
  - Authenticated users have SELECT-only access to subjects.
  - No subject INSERT, UPDATE, or DELETE policies exist.
  - Subject row count remained unchanged.
  - Existing `quests` and `quest_tasks` policies were untouched.
  - No subject UI or quest CRUD changes were included.
- Sprint 12.17.5 - Teacher Quest Subject Selector.
  - Added nullable `subject_id` to the active teacher quest DTO/selects; shared `Quest.subject_id` matches the nullable live schema.
  - Added a server-only subject lookup using the authenticated Supabase server client.
  - Subject lookup selects only `id`, `name`, and `grade`, with deterministic ordering by name, grade, and id.
  - No service role or hardcoded subject UUID mapping is used.
  - Quest Settings now has an optional Subject selector; `No subject` submits `null`.
  - The owner-safe settings PATCH preserves the current value when `subject_id` is omitted.
  - Implementation review confirmed invalid UUID and missing subject UUID inputs return safe `400` responses, real lookup/database errors return safe `500` responses with server-side logging, and foreign/missing quests remain generic `404`.
  - Logged-out PATCH was directly verified as `401` with safe JSON.
  - Teacher Library and Teacher Preview display the resolved subject when present; null or unresolved subjects show no placeholder.
  - The library uses one subject lookup and an in-memory map, avoiding N+1 subject queries.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - No migration, RLS change, subject create/edit/delete UI, or taxonomy/admin UI was added.
  - Browser verification confirmed subject select/save/refresh, library display, preview display, subject clearing, display removal, and grade/duration regression coverage.
- Sprint 12.17.6 - Quest Language Metadata Planning.
  - Confirmed live Supabase had no existing language-like column on `public.quests`.
  - Confirmed no public language-related enum, table, or `quests` constraint existed.
  - Recommended nullable constrained text on `quests` for content language using stable codes `ru`, `kk`, and `en`.
  - Confirmed language describes quest content, not UI locale.
- Sprint 12.17.7 - Quest Language Metadata.
  - Added and live-applied `database/migrations/009_add_quest_language_metadata.sql`.
  - Added nullable `quests.language_code` as text.
  - Allowed codes are `ru`, `kk`, and `en`, displayed as Russian, Kazakh, and English.
  - No default, backfill, index, RLS change, or policy change was added.
  - Existing quests remain compatible with null language metadata.
  - Added a shared `QuestLanguageCode` helper for codes, labels, validation, and safe label resolution.
  - Quest Settings now has an optional Language selector; `No language specified` clears to `null`.
  - The owner-safe settings PATCH preserves the current value when `language_code` is omitted and returns safe `400` for invalid language values.
  - Owner-safe `404` and logged-out `401` behavior remain unchanged.
  - Teacher Library and Teacher Preview display language only when populated and resolved; unknown or null values render without a placeholder.
  - Subject, grade range, and duration metadata remain unchanged.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - No language lookup table, PostgreSQL enum, admin UI, filtering, or i18n framework was added.
  - Browser verification confirmed Russian save/persistence, library display, preview display, changing to Kazakh, clearing language, display removal, and subject/grade/duration regression coverage.

Next sprint:

- Sprint 12.17.8 - Quest Cover Image Planning.

## Stack

- Next.js 16
- React
- TypeScript
- Tailwind
- Supabase

## Important Notes For Future Codex Chats

- This is a long-running project. Preserve existing architecture unless the user explicitly asks for a redesign.
- The task editor and runtime renderer are modular. Add new task types through the existing registry/renderer patterns.
- Storage writes and owner-scoped deletes are supported for new task images, including explicit removal, replacement cleanup, and task-delete cleanup. Public reads remain and legacy `tasks/{uuid}` objects are preserved.
- Deferred storage work includes private bucket/signed URLs, magic-byte MIME validation, and legacy object migration.
- Expired-session API `401` responses now use a small shared client helper in current teacher workflows.
- Deferred auth/session work includes cross-tab logout synchronization, return-to-current-page support, unsaved-edit persistence, mutation replay, and role-aware teacher/student guards.
- Deferred quest metadata work includes language during quest creation, catalog language filtering/indexes, multilingual quest variants, UI localization/i18n, language administration, tags/category, quest cover image, attempt limits, and subject catalog filtering/administration.
- Russian UI text exists throughout the app and must be preserved.
- Some shell output may display Russian text as mojibake. Check actual source files before changing UI text.
- Do not commit or push unless explicitly asked.
