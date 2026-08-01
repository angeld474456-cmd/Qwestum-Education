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
  - Historical behavior: `/dashboard/quests/[id]/settings` edited `title`, `description`, `difficulty`, `is_public`, grade range, and estimated duration.
  - Saves through an authenticated owner-safe teacher API route.
  - `is_public = true` means Public; `is_public = false` means Draft.
  - No `status` field and no migration were added.
  - This direct Settings publication behavior is superseded by Sprint 12.20.3; Settings PATCH is now metadata-only.
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
- Sprint 12.17.8 - Quest Cover Image Planning.
  - Confirmed live schema had no existing quest cover field or related constraint.
  - Planned a path-only cover image model using the existing public `quest-images` bucket.
  - Confirmed cover work should preserve task image policies and owner-scoped quest RLS.
- Sprint 12.17.9 - Quest Cover Image MVP.
  - Added and live-applied `database/migrations/010_add_quest_cover_image.sql`.
  - `quests.cover_image_path` is nullable text with no default, backfill, index, or quest RLS change.
  - Only the bucket-relative Storage path is persisted; public URLs are derived at render time and are not stored.
  - Cover objects use `teachers/{userId}/quests/{questId}/cover/{uuid}.{ext}`.
  - The server generates paths, derives filename extensions from validated MIME type, and does not trust browser filenames or paths.
  - Cover Storage INSERT and DELETE policies were added for authenticated owner-prefixed cover paths.
  - Exact UUID-shaped quest and filename segments are enforced; nested or malformed cover paths are rejected.
  - Public read remains unchanged, task image policies remain unchanged, no Storage UPDATE policy was added, no service role is used, and no direct browser Storage writes were added.
  - Cover upload runs authentication, owner check, validation, Storage upload, then conditional DB update.
  - Cover replacement uploads the new object, conditionally saves the new path, and then performs best-effort old object cleanup.
  - Failed DB updates attempt best-effort cleanup of the new object; concurrent cover changes return safe HTTP 409 and do not delete a newer cover.
  - Cover removal conditionally clears the DB path and deletes only a validated old owner-scoped cover object.
  - Malformed or unrelated paths are never deleted; cleanup failure after a successful DB update is logged and non-blocking.
  - Quest Settings has a separate `QuestCoverImageManager` for upload, replacement, preview, and removal without submitting the regular settings form.
  - Teacher Library shows a 16:9 cover thumbnail or stable fallback.
  - Teacher Preview shows a larger 16:9 cover when present.
  - Null or malformed cover paths do not show broken images.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - Browser verification confirmed cover upload, persistence after refresh, Settings preview, Library thumbnail, Preview display, replacement, removal, task image regression coverage, and subject/grade/duration/language regression coverage.
- Sprint 12.17.10 - Quest Tags / Category Planning.
  - Approved the MVP category/tag architecture.
  - One optional teacher-defined category and multiple teacher-defined tags will be stored directly on `public.quests`.
  - The MVP model uses `category text null` and `tags text[] not null default '{}'`.
  - Normalized taxonomy tables such as `quest_categories`, `tags`, and `quest_tags` are deferred until marketplace, public catalog, multilingual taxonomy, or platform-defined taxonomy needs are clearer.
  - Quest Library filtering, NewQuestForm changes, Play/Test changes, RLS changes, indexes, and quest deletion are not part of the first category/tag migration slice.
- Sprint 12.17.11 - Quest Category / Tags Migration.
  - Prepared `database/migrations/011_add_quest_category_tags.sql`.
  - The migration adds nullable `quests.category` and `quests.tags text[] not null default '{}'`.
  - It adds idempotent CHECK constraints for category length up to 40 characters and maximum 10 tags.
  - Per-tag length, empty-tag removal, and case-insensitive duplicate removal are planned for server-side validation in the following app implementation sprint.
  - No backfill, index, RLS change, policy change, or application code change is included.
- Sprint 12.17.12 - Apply and Verify Quest Category / Tags Migration.
  - Manually applied `database/migrations/011_add_quest_category_tags.sql` to live Supabase after product-owner approval.
  - Verified `public.quests.category` exists as nullable `text` with default `null`.
  - Verified `public.quests.tags` exists as `text[] not null` with default `'{}'::text[]`.
  - Verified `quests_category_length_check` and `quests_tags_count_check`.
  - Verified all 7 existing quest rows remained present and compatible.
  - Existing categories are `null`, existing tags are empty arrays, and no tag arrays exceed 10 items.
  - Existing quest metadata remained compatible.
  - `public.quests` RLS remains enabled and owner-scoped SELECT, INSERT, and UPDATE policies remained unchanged.
  - No `quests` DELETE policy exists.
  - No application code, RLS policy, index, or unrelated schema change was included.
- Sprint 12.17.13 - Quest Category / Tags Settings Integration.
  - Added `category: string | null` and `tags: string[]` to shared and teacher quest types.
  - Owner-scoped quest reads now include category and tags.
  - The owner-safe Settings PATCH route supports category and tags.
  - Omitted category or tags preserve existing values.
  - Empty category clears to `null`; an empty tags array clears all tags.
  - Category and tag whitespace is normalized.
  - Empty tags are removed.
  - Tags are deduplicated case-insensitively while preserving first-occurrence casing.
  - Category maximum length is 40 characters, maximum tag count is 10, and maximum normalized tag length is 24 characters.
  - The server rejects control characters and returns safe `400` responses for invalid category or tags before updating.
  - Quest Settings now provides Category and comma-separated Tags controls.
  - Defensive handling prevents stale null or undefined tags from crashing the Settings form.
  - Manual authenticated browser verification passed for save, refresh persistence, normalization, validation, dedupe, clearing, and restoration.
  - The test quest was restored to `category = null` and `tags = []`.
  - No Quest Library category/tag display or filtering, NewQuestForm controls, Preview display, Play/Test changes, quest deletion, migration change, RLS/policy change, or index was included.
- Sprint 12.17.14 - Quest Category / Tags Library Display and Filtering.
  - `/dashboard/quests` remains a Server Component and accepts Next.js 16 async `searchParams`.
  - Supported URL parameters are `category` and `tag`.
  - Owned quests are fetched once through `getOwnedQuests()`.
  - Filter values are derived only from the authenticated teacher's owned quests.
  - Filtering is performed in memory for the current MVP scale.
  - Category and tag filters combine with AND semantics.
  - Missing or empty parameters mean no filter; only the first query value is used when an array is supplied.
  - Unknown filter values produce a safe filtered-empty state.
  - Category and tag matching is whitespace-normalized and case-insensitive, while stored display casing is preserved.
  - Filter options are deduplicated case-insensitively and sorted.
  - Quest cards display category and tag chips only when populated.
  - Native GET controls support shareable URLs, refresh persistence, and browser back/forward behavior.
  - Clear filters returns to `/dashboard/quests`.
  - Defensive handling prevents malformed legacy category/tags values from crashing the page.
  - Manual authenticated browser verification passed for all-owned display, category-only filtering, tag-only filtering, combined filtering, clear filters, refresh persistence, browser back/forward, unknown-value empty state, chip wrapping, and existing card actions.
  - No Preview category/tag display, NewQuestForm controls, Play/Test changes, quest deletion, public catalog/student discovery, migration, RLS/policy change, index, or normalized taxonomy was included.
- Sprint 12.17.15 - Quest Category / Tags Preview Display.
  - Teacher Preview now displays category and tags in the existing metadata chip row.
  - Display order is subject, language, grade, duration, category, then tags.
  - No additional service query, type, API, schema, or RLS work was required.
  - Category is defensively normalized for display and omitted when invalid or empty.
  - Tags are defensively handled at runtime, limited to valid string entries, whitespace-normalized, and empty entries are removed.
  - Stored display casing is preserved and all valid tags are displayed.
  - Tag keys are index-qualified to avoid duplicate React key collisions with malformed legacy arrays.
  - Styling matches the Teacher Quest Library: category uses fuchsia styling and tags use neutral styling.
  - Manual authenticated browser verification passed for category chip display, tag chip display/wrapping, metadata order, empty metadata behavior, existing Preview content, read-only behavior, unchanged owner-safe route behavior, and duplicate legacy tag key safety.
  - No editing in Preview, filtering in Preview, NewQuestForm changes, Play/Test changes, quest deletion, public catalog/student discovery, migration, live Supabase write, RLS/policy change, index, or normalized taxonomy was included.
  - Metadata chip logic remains local to Library and Preview.
- Sprint 12.18.2 - New Quest Draft Creation UX.
  - Quest creation is now an explicit two-step workflow.
  - Step 1 creates a minimal draft quest shell; Step 2 redirects to Quest Settings for metadata, cover image, tasks, and publication.
  - `NewQuestForm` sends only title, description, and difficulty.
  - `NewQuestForm` no longer includes publication state or a publication control.
  - The create API ignores any client-provided `is_public` value.
  - The server always inserts `is_public: false`.
  - `author_id` continues to come only from the authenticated server session.
  - Existing title, description, difficulty, validation, loading, error, and redirect behavior remain intact.
  - Manual authenticated browser verification passed with test quest `DRAFT CREATION TEST 12.18.2` (`0a6d4d54-37ca-4274-aea4-3e127c3a593d`).
  - Verified the Settings redirect, Draft status, empty category/tags, no cover image, no tasks, and Teacher Quest Library appearance.
  - Exactly one test quest was created, no other quest data was intentionally changed, and the test quest remains in place because quest deletion is not implemented.
  - No subject, language, grade, duration, category, tags, or cover controls were added to `NewQuestForm`.
  - No Settings, Library, Preview, Play/Test, quest deletion, migration, RLS/policy, index, public catalog, student-facing, direct SQL, or direct API shortcut change was included.
- Sprint 12.18.4 - New Quest Creation UX Polish.
  - `NewQuestForm` now explicitly presents draft creation as `Шаг 1 из 2`.
  - The draft-workflow explanation is localized to Russian.
  - Submit copy is `Создать черновик`.
  - Loading copy is `Создание черновика...`.
  - A secondary `Вернуться к библиотеке` link returns to `/dashboard/quests`.
  - The POST payload remains title, description, and difficulty only.
  - The redirect remains `/dashboard/quests/[id]/settings`.
  - Draft-only server enforcement remains unchanged.
  - No publication control exists.
  - Manual visual browser verification passed on authenticated `/quests/new` without creating a new quest.
  - No create API, route move, metadata expansion, Settings, Library, Preview, Play/Test, quest deletion, migration, live Supabase write, RLS/policy, index, public catalog, or student-facing change was included.
- Sprint 12.18.6 - Quest Creation Step 2 Settings UX.
  - `NewQuestForm` now redirects after creation to `/dashboard/quests/[id]/settings?created=1`.
  - Quest Settings accepts Next.js 16 async `searchParams`.
  - `created` supports `string | string[] | undefined`; arrays use the first value.
  - Only exact `created=1` enables onboarding.
  - The onboarding block is server-rendered, non-persistent, and appears only for post-create query visits.
  - Direct Settings visits remain unchanged.
  - `getOwnedQuest(id)` remains the owner-safe access gate, and onboarding does not affect authorization or data loading.
  - The onboarding task link points to `/quests/[id]/tasks`.
  - Publication behavior remains unchanged.
  - No client state or dismiss behavior was added.
  - Browser verification passed with and without the query parameter, and no data was modified during verification.
  - No create API, schema/migration, RLS/policy, index, `QuestSettingsForm`, `QuestCoverImageManager`, task route/editor, publication gating, deletion, public catalog, or student-facing change was included.
- Sprint 12.18.8 - Enforce Task Required Before Publication.
  - Historical direct-Settings PATCH enforcement; superseded by the canonical eligibility and publication-action boundaries in Sprint 12.20.2-12.20.3.
  - Publication now requires at least one task only during a Draft-to-Public transition.
  - Current `is_public` is loaded through the existing owner-safe quest lookup.
  - Task count is queried only after authenticated ownership verification.
  - Task count uses `quest_tasks` with exact count and `head: true`; client-provided task counts are never trusted.
  - Zero or null task count returns HTTP 400 with `Добавьте хотя бы одно задание перед публикацией.`
  - The quest update is not executed when readiness validation fails.
  - Task-count query failure uses the existing safe HTTP 500 response and does not expose Supabase internals.
  - Direct API requests cannot bypass the rule.
  - `QuestSettingsForm` already displayed the API error and required no change.
  - Manual browser verification passed; the tested quest remained Draft after refresh.
  - Draft remaining draft, public remaining public, editing already-public quests, and unpublishing do not trigger the task count.
  - Legacy public zero-task quests are not modified automatically.
  - Existing title, difficulty, metadata, authentication, ownership, 404, 401, Preview, and Play/Test zero-task behavior remains unchanged.
  - Deferred limitations: deleting the last task from a public quest may still leave it public with zero tasks; the count and publication update are not transactional; full readiness checklist is deferred; subject, language, grade, duration, category, tags, description, and cover are not publication requirements yet.
  - No migration, schema, RLS/policy, index, `QuestSettingsForm`, Preview, Play/Test, task deletion, public catalog, or student-facing change was included.
- Sprint 12.18.10 - Block Last Public Task Deletion.
  - Deleting the last task from a Public quest is blocked.
  - Teachers must explicitly unpublish before deleting the final task; automatic unpublishing is not performed.
  - The owner-safe task route quest lookup now includes `is_public`.
  - Draft quests skip the new readiness check.
  - Public quests verify the target task before counting sibling tasks.
  - Target task lookup remains scoped by task id and quest id.
  - Task count runs only after authentication, ownership, and target-task verification.
  - Task count uses `quest_tasks` with exact count and `head: true`; client-provided task counts are not trusted.
  - A Public quest with more than one task can still delete a task.
  - A Public quest with one or fewer tasks returns HTTP 400 with `Сначала снимите квест с публикации, затем удалите последнее задание.`
  - Blocked deletion performs no task deletion or Storage cleanup.
  - Task-count failure returns the existing safe HTTP 500 response.
  - Successful deletion response and Storage cleanup remain unchanged.
  - `QuestTasksClient` already displays API errors and required no change.
  - Manual browser verification passed; the task and Public state remained unchanged after refresh.
  - Preserved behavior: Draft quests with one or multiple tasks may delete tasks; Public quests with multiple tasks may delete one; missing or foreign quest/task keeps existing generic 404; unauthenticated behavior remains unchanged; legacy Public zero-task quests are not modified automatically; Preview and Play/Test remain unchanged.
  - Deferred limitations: count and deletion are non-transactional; concurrent deletion requests on a Public quest with multiple tasks could still race; a future transaction/RPC may provide stronger enforcement; no second confirmation or publication-aware delete UI was added.
  - No automatic unpublishing, transaction/RPC, migration, schema, RLS/policy, index, `QuestTasksClient`, Settings, Preview, Play/Test, public catalog, student-facing, or quest deletion change was included.
- Sprint 12.18.12 - Publication Readiness Settings UX.
  - Historical checkbox-based Settings UX; the enabled publication checkbox is superseded by Sprint 12.20.3C4 teacher Publish/Unpublish controls.
  - Settings now loads an owner-safe exact task count server-side.
  - Added `getOwnedQuestTaskCount(questId)`; it validates UUID shape and authentication, verifies ownership with quest id plus authenticated `author_id`, returns `null` for missing, foreign, unauthenticated, or invalid requests, and counts tasks only after ownership verification.
  - The count uses `quest_tasks` exact count with `head: true`.
  - Task count is kept separate from the quest DTO and passed to `QuestSettingsForm` as `taskCount`.
  - Readiness messaging appears near the publication control for Draft zero-task, ready, and legacy Public zero-task states.
  - Draft zero-task copy: `Для публикации нужно хотя бы одно задание.` and `Добавьте задание, затем вернитесь в настройки и включите публикацию.`
  - Ready-state copy: `Заданий: {taskCount}` and `Квест можно опубликовать.`
  - Legacy Public zero-task copy: `Квест опубликован, но в нем нет заданий. Снимите публикацию или добавьте задание.`
  - The task link says `Перейти к заданиям` and points to `/quests/[id]/tasks`.
  - Historical note: the publication checkbox was enabled at this point; it no longer exists in current Settings.
  - Server-rendered count may be stale until refresh; no polling or client-side task-count fetch exists.
  - Manual browser verification passed for Draft zero-task, Draft with tasks, and Public with tasks, and no data was modified during verification.
  - Publication API enforcement, direct API protection, legacy Public zero-task unpublishing, unrelated Settings saves, error/success display, `created=1` onboarding, owner-safe `notFound`, task CRUD, Preview, and Play/Test remain unchanged.
  - No migration, schema, RLS/policy, index, polling, client-side task-count request, readiness metadata checklist, task CRUD refactor, publication API change, public catalog, or student-facing change was included.
- Sprint 12.18.14 - Dashboard Quest Create and Tasks Route Consolidation.
  - Canonical teacher routes are now Library `/dashboard/quests`, Create `/dashboard/quests/new`, Settings `/dashboard/quests/[id]/settings`, Tasks `/dashboard/quests/[id]/tasks`, Preview `/dashboard/quests/[id]/preview`, and Play/Test `/dashboard/quests/[id]/play`.
  - Legacy redirects are `/quests/new` -> `/dashboard/quests/new`, `/quests/[id]/tasks` -> `/dashboard/quests/[id]/tasks`, `/quests` -> `/dashboard/quests`, and `/quests/[id]` -> `/dashboard/quests/[id]/preview`.
  - The canonical dashboard Create page owns the actual authenticated create implementation; the legacy Create page is a minimal server-side redirect.
  - The canonical dashboard Tasks page owns the actual owner-safe task editor implementation; the legacy Tasks page is a minimal server-side redirect.
  - All internal teacher Create and Tasks links use canonical dashboard routes.
  - `QuestWorkspaceNav` ordering, labels, and active behavior remain unchanged.
  - The post-create Settings redirect remains `/dashboard/quests/[id]/settings?created=1`.
  - `NewQuestForm` and `QuestTasksClient` received only minimal dashboard-layout fit adjustments.
  - Task CRUD, validation, payloads, errors, loading, scrolling behavior, publication behavior, dashboard layout guard, and owner-safe route loading remain intact.
  - Manual browser verification passed for both canonical routes, both legacy redirects, no redirect loops, visible task editor inside dashboard chrome, vertical scrolling, dashboard navigation not covering content, internal links staying within `/dashboard/quests`, and no data changes during verification.
  - Remaining intentional legacy occurrences are `app/quests/new/page.tsx`, `app/quests/[id]/tasks/page.tsx`, historical documentation references, and `/api/teacher/quests` API routes.
  - No API, schema/migration, RLS/policy, index, task CRUD refactor, Preview or Play/Test behavior change, publication behavior change, public catalog/student-facing implementation, broad visual redesign, or broad localization change was included.
- Sprint 12.18.16 - Teacher Workflow Primary Copy Localization.
  - Teacher-facing MVP copy is Russian-first, localization is phased, and Sprint 12.18.16 completed phase 1 only.
  - No i18n framework or shared copy constants were introduced.
  - Navigation terminology is now: `Back to library` -> `К библиотеке`, `Settings` -> `Настройки`, `Tasks`/`Edit tasks` -> `Задания`, `Preview` -> `Предпросмотр`, and `Play/Test` -> `Тестирование`.
  - Status terminology is now `Draft` -> `Черновик` and `Public` -> `Опубликован`.
  - Library high-visibility copy is Russian, including heading/supporting text, create actions, summary cards, filters and clear-filter actions, empty/no-results states, status badges, task-count labels, cover and description fallbacks, and card actions.
  - Route-level localization was added for Settings (`Настройки квеста` and Russian supporting text), Preview (heading, task counts, zero-task state, task action, grade/task labels), and Play/Test (`Тестирование`, Russian supporting text, zero-task state, and task action).
  - Generic teacher-facing task terminology uses `задание`/`задания`; `вопрос` is reserved for an actual question prompt or single-choice semantics.
  - Server API error contracts were not changed.
  - Preserved behavior: routes, canonical dashboard route map, navigation destinations and active-state logic, filtering, sorting, category/tags, task counts, covers, card links, Settings owner-safe loading, `created=1` behavior, Preview rendering, QuestRunner/runtime behavior, task CRUD, and publication behavior remain unchanged.
  - Manual browser verification passed for Library, Settings with and without `created=1`, Tasks without mojibake, Preview, and `Тестирование`; desktop layout and navigation remained usable, and no data changed during verification.
  - Deferred localization scope includes `QuestSettingsForm`, `QuestCoverImageManager`, `QuestTasksClient`, task form/card/editor children, `ImageUploader`, runtime components, and client fallback/server API error consistency.
  - No route, API behavior/error-contract, migration/schema, RLS/policy, index, task CRUD refactor, public catalog/student-facing implementation, or broad visual redesign change was included.

- Sprint 12.18.18 - Settings and Cover Manager Copy Localization.
  - Quest Settings form labels, select placeholders, helper text, category/tag guidance, grade/duration guidance, local validation messages, save/loading labels, success text, client-only fallback errors, and publication state labels are localized to Russian.
  - Approved Settings terminology includes `Название квеста`, `Описание`, `Предмет`, `Предмет не указан`, `Язык`, `Язык не указан`, `Категория`, `Теги`, `Сложность`, `Класс от`, `Класс до`, `Не указано`, `Примерная длительность, мин.`, `Статус публикации`, `Черновик`, `Опубликован`, `Сохранение...`, and `Сохранить настройки`.
  - Subject and grade display formatting is localized as `Все классы`, `N класс`, and `N-M классы`; stored values, option keys, field names, and payloads remain unchanged.
  - Language display labels are localized as `Русский`, `Казахский`, and `Английский` without changing stored language codes.
  - Generic teacher-facing publication-readiness copy now uses `хотя бы одно задание`; `вопрос` remains reserved for actual question-prompt semantics.
  - `QuestCoverImageManager` copy is localized, including `Обложка`, Russian optional 16:9 guidance, `Загрузить обложку`, `Заменить обложку`, `Удалить обложку`, `Обложка не загружена`, `Обложка квеста`, success messages, client-only fallback errors, and accessibility labels.
  - Protected error boundaries are unchanged: server API response shapes, HTTP status handling, server API error contracts, `SESSION_EXPIRED_MESSAGE`, Supabase/internal technical error behavior, Storage service passthrough errors, and returned `result.error` display behavior remain intact.
  - Preserved behavior: routes, owner-safe loading, field names, payload shape, validation rules and numeric limits, category/tag limits, stored public/draft values, publication behavior, cover upload/remove/replace APIs, file input, accepted file types, schema, migrations, RLS, policies, and indexes remain unchanged.
  - Manual browser verification passed for Settings labels/helpers, control usability, status labels, publication-readiness terminology, local invalid-input validation, cover manager copy, mojibake absence, and desktop layout.
  - No save, upload, replace, remove, create, edit, delete, or other live data write was performed during verification.
  - Deferred localization scope includes `QuestTasksClient`, task form/card/editor children, `ImageUploader`, runtime components, broader client/server error consistency, and student/runtime copy outside the teacher-only workflow.

- Sprint 12.18.20 - Task Editor Copy Localization.
  - Localized teacher task-editor copy in `QuestTasksClient`, `TaskForm`, `TaskCard`, `TextTaskEditor`, `SingleChoiceTaskEditor`, and `ImageUploader`.
  - Task type display mapping is `text` -> `Текстовое задание` and `single_choice` -> `Выбор одного ответа`; unknown future task types fall back to the raw identifier.
  - Stored values, TypeScript unions, registry keys, payloads, API contracts, routes, endpoints, CRUD behavior, autosave, `TaskTypeRegistry` behavior, owner safety, publication safety, last-public-task deletion protection, image behavior, runtime/student copy, schema, migrations, RLS, policies, and indexes remain unchanged.
  - `QuestTasksClient` localized shell actions, refresh action, client-only fallback errors, success alerts, browser confirms, and image fallback messages while preserving returned `result.error`, `SESSION_EXPIRED_MESSAGE`, server API JSON error contracts, HTTP status handling, Supabase/internal technical errors, and Storage passthrough errors.
  - `TaskForm` now shows a visible `Тип задания` label, Russian task type display names, `Баллы`, and Russian create/validation copy; submitted task type values remain `text` and `single_choice`.
  - `TaskCard` uses Russian task type labels and Russian edit/delete aria-labels with unchanged handlers and layout.
  - `TextTaskEditor` uses `Текстовое задание`, `Текст задания`, `Баллы`, `Сохранить`, and Russian local validation/fallback/success copy.
  - `SingleChoiceTaskEditor` uses `Выбор одного ответа`, `Вопрос`, `Вариант ответа`, `Добавить вариант`, `Удалить вариант`, `Правильный ответ`, `Баллы`, and `Сохранить` while preserving option structure, payload, validation, and correct-answer data shape.
  - `ImageUploader` uses `Изображение задания`, `Удалить изображение`, and Russian teacher-visible upload/remove/empty/accessibility copy while preserving upload/remove mechanics and Storage passthrough behavior.
  - Correct-answer radio selection now preserves `checked={correctOptionId === option.id}` and `onChange={() => setCorrectOptionId(option.id)}` while adding `value={option.id}` and defensive `onClick={() => setCorrectOptionId(option.id)}`; both handlers set the same option id, no double-toggle risk was found, and existing saved tasks using `{ options: { id: string; text: string }[], correctOptionId: string }` remain compatible.
  - The correct-answer radio issue was browser-observed as visible radios that did not reliably update `correctOptionId`; no stored data shape changed, browser verification confirmed selection now works, validation disappears, Save becomes enabled, and Preview reflects the selected answer.
  - Points bug diagnosis: `TextTaskEditor` and `SingleChoiceTaskEditor` previously rendered Points as `value={task.points}` with `readOnly`, had no local editable points state, and the task update callback/PATCH flow did not persist points. The bug existed before Sprint 12.18.20 and was not caused by localization.
  - Editable Points support now uses local string state initialized with `String(task.points)`, editable `type="number"` inputs with `min={1}` and `step={1}`, temporary empty values while typing, and no forced fallback to `1`.
  - Points validation requires a non-empty finite integer at least `1`; decimal values are rejected with `Баллы должны быть целым числом не меньше 1.`
  - The editor save callback now includes numeric `points`, `TaskEditor` callback typing was minimally extended, and `QuestTasksClient` includes `points` in the existing PATCH body while preserving title, description, and content behavior.
  - The task PATCH route now supports optional `points`; validation runs only when supplied, invalid values return HTTP 400 in the existing route style, `points` is added to the Supabase update object only when supplied, and requests omitting `points` remain compatible. Authentication, ownership, task-parent scoping, safe 404, response shape, and error handling remain unchanged.
  - No data migration or live-data repair was required.
  - `TaskList.tsx` was inspected and required no code changes.
  - Manual browser verification passed on the canonical dashboard task route for Text and Single Choice localization, the visible task type label, hidden raw identifiers for known task types, correct-answer radio selection, validation disappearance, Save enablement, Preview synchronization, and editable Points no-write behavior.
  - No-write Points verification confirmed Text and Single Choice Points can be changed locally, empty intermediate values remain empty, decimals and zero are rejected, valid positive integers are accepted, Save state updates correctly, and changing Single Choice Points does not reset the selected correct answer.
  - Save was not clicked, no PATCH write occurred, no live write occurred, and no task, image, or live data was created, edited, deleted, uploaded, removed, or saved.
  - Deferred scope includes runtime/student-facing localization, broader client/server error consistency, i18n/shared constants, and task CRUD/autosave refactors.

- Sprint 12.18.21 - Controlled Task Editor Write Verification.
  - Manual authenticated browser write verification passed through normal owner-safe teacher UI/API flows.
  - Text task verification used temporary task `TEMP - Points persistence text`: points were changed to `7`, saved, refreshed/reloaded, and verified as persisted; text/content persisted; internal type remained `text`; visible type remained `Текстовое задание`; the temporary Text task was deleted successfully.
  - Single Choice verification used temporary task `TEMP - Points persistence single choice`: options `Alpha` and `Beta` persisted; `Beta` remained the correct answer; `correctOptionId` persistence was confirmed; points `9` persisted after save/reload; visible type remained `Выбор одного ответа`; Preview reflected the persisted correct answer; the temporary Single Choice task was deleted successfully.
  - Cleanup verification passed: both temporary tasks were deleted, no temporary task rows remain, no image was uploaded, no orphaned Storage object exists, no new quest was created, no Public quest was modified, no last-public-task deletion test occurred, and original quest/tasks were otherwise unchanged.
  - Optional `points` PATCH support is now browser-write verified for Text and Single Choice tasks.
  - Non-blocking UX issues found: `TaskForm` Points input has an aria-label but no visible `Баллы` label; `TaskCard` pencil button is visible but does not independently open the editor, while clicking the card itself still opens the editor.
  - Deferred follow-up: plan a small UX sprint to add the visible `Баллы` label and make the pencil edit button functional while preserving card selection and delete behavior.

- Sprint 12.18.24 - Task Creation and Card Action UX Implementation.
  - Implemented the approved small UX fixes in `TaskForm`, `TaskCard`, and `TaskList` only.
  - `TaskForm` now has a visible semantic `Баллы` label associated with the Points input through `htmlFor="task-points"` and `id="task-points"` while preserving the existing aria-label, value, min, onChange, default value, and submitted points behavior.
  - `TaskCard` now accepts a typed `onSelect` callback, the pencil button is enabled, has `type="button"`, preserves the Russian aria-label, styling, icon, and selected rendering, and calls `event.stopPropagation()` before invoking the existing edit/select behavior exactly once.
  - `TaskList` passes the existing `onSelectTask(task)` behavior into `TaskCard`; card click remains unchanged and pencil click opens the same task without duplicate card selection.
  - Manual authenticated browser verification passed: the visible `Баллы` label appeared, the pencil button opened the task editor, card click continued to open/select the task, delete confirmation and deletion worked, and no console or layout issue was reported.
  - One test task was accidentally deleted during verification. All current quest/task data is test data, no production data was affected, no recovery is needed, and continued development is unaffected.
  - Historical non-blocking considerations at the end of Sprint 12.18.24: the static `task-points` id was safe with the current single `TaskForm` instance but would need unique ids if multiple forms render simultaneously; delete-button click still bubbled to the card wrapper then, which Sprint 12.18.26 superseded with `event.stopPropagation()`.
  - Unchanged scope: no route/API changes, schema/migration/RLS/policy/index changes, task content/type changes, save/autosave changes, Storage changes, runtime/student changes, publication safety changes, or deletion-guard changes.

- Sprint 12.18.26 - Task Action Event Isolation Implementation.
  - Implemented the approved delete-action event isolation fix in `components/tasks/TaskCard.tsx` only.
  - The delete button now has `type="button"` and its click handler receives the event, calls `event.stopPropagation()` before `onDelete(task.id)`, and invokes the existing delete flow exactly once.
  - Delete clicks no longer bubble to the parent card selection handler; existing icon, styling, Russian aria-label, confirmation flow, deletion behavior, and keyboard accessibility remain unchanged.
  - No `TaskList` or `QuestTasksClient` change was needed; owner-safe DELETE API behavior, confirmation text, last-Public-task deletion guard, error handling, list refresh, and `syncSelectedTask` fallback remain unchanged.
  - Manual browser verification passed: deleting an unselected task showed confirmation, Cancel left the previous selection unchanged, the unselected task did not open or become selected, pencil click still opened the editor, card click still selected/opened the task, and no console or UI issue was reported.
  - No actual deletion was confirmed during verification, and no live data was changed.
  - Static `task-points` remains acceptable because only one `TaskForm` renders; future unique-id work remains deferred until multiple simultaneous forms exist.

- Sprint 12.18.28 - Teacher Task Workspace Responsive Layout and Labels.
  - Implemented the approved P1 UX fixes in `components/tasks/QuestTasksClient.tsx` and `components/tasks/TaskForm.tsx` only.
  - `QuestTasksClient` now uses `grid-cols-1 xl:grid-cols-12`; the task list uses `xl:col-span-4`, the editor uses `xl:col-span-8`, narrow screens stack list above editor, and large screens retain the two-column layout.
  - No sticky/fixed positioning or state-flow change was introduced; task selection, deletion, loading, editor rendering, and existing behavior remain unchanged.
  - `TaskForm` now has visible semantic labels for `Название задания`, `Описание`, `Правильный ответ`, and `Подсказка`, while preserving the existing visible `Тип задания` and `Баллы` labels.
  - Labels are associated with `task-title`, `task-description`, `task-answer`, `task-hint`, `task-type`, and `task-points`; placeholders, values, handlers, validation, alert behavior, loading behavior, payload, and default points remain unchanged.
  - Accessibility verification passed: labels remain visible while typing, labels focus their associated controls, and the current single `TaskForm` has no duplicate ids. Static ids remain acceptable for the current single-form rendering.
  - Manual responsive browser verification passed: wide screens kept list/editor side by side, narrow screens stacked list above editor, no horizontal scrolling or clipped controls appeared, all six visible labels appeared, label associations worked, and no task was created or saved.
  - Recent fixes remained intact: pencil button, delete event isolation, card selection, selected styling, points editing/persistence, correct-answer persistence, editor save behavior, image controls, Preview, localized copy, and last-Public-task guard.
  - Unchanged scope: no route/API changes, schema/migration/RLS/policy/index changes, task content/type changes, create/save/autosave changes, Storage changes, runtime/student changes, publication safety changes, or deletion-guard changes.

- Sprint 12.18.30 - Task Creation Failure State Preservation.
  - Fixed a task-creation data-loss defect: `TaskForm` reset after `onSave` resolved even when `QuestTasksClient` had handled a failed create internally.
  - `TaskForm.onSave` and `handleCreateTask` now use `Promise<boolean>` without changing the create endpoint or payload.
  - `handleCreateTask` returns `false` when busy, on session expiry, non-OK or malformed responses, and caught network/error paths; it returns `true` only after a valid created task is added to state and selected.
  - `TaskForm` resets only on `true`; on failure it preserves title, description, correct answer, hint, task type, and points.
  - Manual Offline browser verification passed: all TaskForm fields were filled with test values, Chrome DevTools Network mode was set to Offline, and Add task was clicked. The request did not reach the server, `Не удалось создать задание.` appeared, no task was created and no Supabase write occurred, every entered field remained, Network mode returned to No throttling, and create was not retried.
  - Successful reset behavior, error display, loading behavior, responsive workspace, visible labels, pencil/delete/card behavior, points and correct-answer persistence, image controls, Preview, and the last-Public-task guard remain unchanged.
  - No route/API, schema/migration/RLS/policy/index, task content/type, editor save/autosave, Storage, runtime/student, publication safety, or deletion-guard change was included.

- Sprint 12.18.31 - Task Creation Success Regression Verification.
  - Successful controlled verification used the owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`); it remained Draft.
  - Created one disposable `TEMP - Sprint 12.18.31 Create Success DELETE ME` task with description `Disposable verification of successful task creation and form reset.`, correct answer `S31-CORRECT`, hint `S31-HINT`, `single_choice` type, and `7` points.
  - Add task was clicked once with no create error. The task appeared exactly once, became selected, and opened its editor; stored type remained `single_choice` / `Выбор одного ответа` and points remained `7`.
  - TaskForm reset only after success: title, description, correct answer, and hint became empty; type reset to `text`; points reset to `1`; button/loading returned to normal.
  - The Single Choice editor's `Добавьте минимум два варианта ответа.` and `Выберите один правильный ответ.` validation was expected because no options were added. No editor save was performed.
  - Cleanup verified the exact temporary task's type and points, confirmed its native delete dialog once, removed only that task, restored the baseline empty list, left no residue or unexpected error, and left the quest Draft.
  - The create endpoint/payload, `Promise<boolean>` failure preservation, responsive workspace, labels, card actions, points/correct-answer persistence, image controls, Preview, and last-Public-task guard remain unchanged.
  - At Sprint 12.18.32 planning, clearing the task-creation Points input caused `0` to appear, preventing a temporary empty editing state and requiring selection of the current value or the numeric stepper to replace it. This non-blocking UX/validation finding was implemented in Sprint 12.18.33.

- Sprint 12.18.33 - TaskForm Points Validation.
  - Fixed the Points editing root cause: numeric React state combined with `Number(e.target.value)` converted an empty value to `0`, blocking normal clear-and-retype input.
  - TaskForm now keeps raw string points state, initially and after successful reset as `"1"`; temporary empty input is allowed, digit-only input is parsed only after validation, and the existing payload still sends numeric `points`.
  - Client validation requires a safe integer at least `1` via `Number.isSafeInteger`; invalid submit shows `Баллы должны быть целым числом не меньше 1.`, does not call `onSave`, and preserves every field after API failure.
  - POST and PATCH now share the strict points contract: JSON number only, finite safe integer, and at least `1`. Numeric strings, zero, negatives, decimals, unsafe integers, null, arrays, objects, and booleans are rejected; omitted PATCH points remain unchanged.
  - No-write browser verification passed: Backspace left `1` empty without producing `0`, replacement typing worked without Ctrl+A, empty and `0` submit showed the exact error without creating a task or resetting the form, entering `7` cleared the error, and normal keyboard replacement from `7` to `12` worked. No successful create request, task creation, Supabase data change, or cleanup occurred.
  - `Promise<boolean>`, failure preservation, successful reset, title alert, optional text fields, task types, labels, layout, selection, editor behavior, images, Preview, and publication/deletion guards remain unchanged.

- Sprint 12.18.34 - Points Validation Controlled Write Verification.
  - Controlled live verification used owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`) with an empty task-list baseline; it remained Draft / `Черновик`.
  - Created and then removed only `TEMP - Sprint 12.18.34 Points Verification DELETE ME`, using description `Disposable create and PATCH verification for safe integer points.`, correct answer `S34-CORRECT`, hint `S34-HINT`, `text`, create points `7`, and PATCH points `12`.
  - With Network set to No throttling and request blocking disabled, Add task was clicked once without error; the task appeared once, became selected, opened its editor, and visibly persisted points `7`. TaskForm reset its points to `1`, reset the remaining creation fields, and returned its button/loading state to normal.
  - Only points changed from `7` to `12`; Save was clicked once without error, editor/task state showed `12`, and refresh or reopening confirmed points `12` persisted without unrelated changes.
  - Cleanup reconfirmed the unique task and points `12`, accepted the native delete dialog once, deleted only that task, restored the empty baseline, left the quest Draft, and produced no unexpected error or residue.
  - Follow-up UX mismatch: TextTaskEditor and SingleChoiceTaskEditor use raw string state and block empty, zero, negative, and decimal values, but still use `Number.isInteger`. Unsafe integers can reach PATCH and are safely rejected by the finite safe-integer API contract; server integrity remains protected. No unsafe-integer browser write test was performed.
  - TaskForm safe-integer validation, strict POST/PATCH contracts, `Promise<boolean>`, failure preservation, successful reset, ownership/authentication, selection, optional fields, types, image controls, Preview, publication guards, and deletion guards remain unchanged.

- Sprint 12.18.36 - Shared Editor Points Validation.
  - Added `lib/task-points.ts` with `parsePositiveSafeInteger(value: string): number | null` and the shared message `Баллы должны быть целым числом не меньше 1.`. The helper accepts digit-only positive safe integers, including leading zeroes and `Number.MAX_SAFE_INTEGER`, and rejects empty, whitespace, signs, decimals, exponent notation, zero, unsafe integers, and overflowing values.
  - TaskForm, TextTaskEditor, and SingleChoiceTaskEditor now share the same digit-only, positive-safe-integer contract while preserving raw string state and temporary empty editing. TaskForm retains submit-triggered validation, `Promise<boolean>`, failed-create preservation, and successful reset to `"1"`.
  - Both editors retain their existing visible validation summary and disable Save while points are invalid. Their points inputs now use conditional `aria-invalid` and `aria-describedby` with one associated visible points error.
  - Browser verification checked invalid values first: empty, `0`, decimal, and `9007199254740992` stayed invalid with the exact message and disabled Save where applicable. The unsafe integer was not stored. A valid `12` then cleared the error, was saved through one successful PATCH, and remained `12` after refresh; no unrelated task fields changed and no cleanup was required for the existing test task.
  - Task type is chosen only during creation; an existing task's stored type selects TextTaskEditor or SingleChoiceTaskEditor and cannot be changed in the editor. To use another type, the teacher must create a new task with the desired type and may manually delete the old task if no longer needed. No automatic conversion exists; future conversion requires explicit field-mapping and data-loss rules.
  - POST/PATCH contracts, editor fields, Single Choice options and correct-answer behavior, image controls, selected-task behavior, responsive layout, Preview, publication guards, and deletion guards remain unchanged.

- Sprint 12.18.38 - Immutable Task Type Helper Text.
  - TextTaskEditor and SingleChoiceTaskEditor now display below their read-only type fields: `Тип задания выбирается при создании и не меняется после сохранения.` and `Чтобы использовать другой тип, создайте новое задание и при необходимости удалите прежнее.`
  - The type field remains immutable: no select, dropdown, type state, conversion, or duplication control was added. Labels use stable editor-specific IDs, and the helper is visible normal text with secondary styling and natural wrapping.
  - No-write visual verification passed in both editors on wide and narrow layouts: exact copy was visible, type fields remained non-editable, text wrapped without clipping or horizontal scrolling, editor width did not expand, and Save plus other controls remained usable. No save, PATCH, live-data action, or cleanup occurred.
  - Current MVP behavior remains: stored `task_type` chooses the editor; another type requires creating a new task and optionally manually deleting the old one. Automatic conversion is deferred pending explicit field mapping, data-loss rules, API design, and regression coverage.
  - Points validation, editor fields, options, correct-answer behavior, images, Save/loading/errors, selected-task behavior, TaskForm, TaskEditor registry, API/schema/RLS/Storage, Preview, publication, and deletion guards remain unchanged.

- Sprint 12.18.40 - Workspace Status Messaging.
  - `QuestTasksClient` now keeps existing visible workspace errors while adding `role="alert"` and `aria-live="assertive"`; one `statusMessage` string renders a visible `role="status"` / `aria-live="polite"` success region only when non-empty. Neither region moves focus or expires automatically.
  - Exact messages are `Задание создано.`, `Изменения сохранены.`, `Задание удалено.`, `Изображение загружено.`, and `Изображение удалено.` Stale status clears at create, save, delete, upload, removal, and refresh start; success is assigned only after successful local state updates, and save/upload native success alerts were removed.
  - The read-only technical route check used only GET and returned the expected protected task-workspace HTTP `307` redirect to `/login` without an authenticated browser session. It made no POST, PATCH, DELETE, image upload, or image-removal request and caused no live-data change; static accessibility/lifecycle checks plus lint, build, and diff checks passed. Manual no-write browser verification confirmed no initial status, no empty status space, stable layout, usable controls, visible immutable-type guidance, and intact local points validation.
  - Controlled verification in an owned Draft quest created, saved, and deleted exactly one temporary Text task. Create/save/delete messages appeared exactly, each replaced the last, no native success alert or workspace error appeared, selection remained correct, cleanup restored the original task count, the task was gone, and the quest remained Draft. No existing task was intentionally modified.
  - Image upload/removal success paths are implemented and statically reviewed, but were not live-write verified; no image upload, removal, or Storage write occurred in this sprint.
  - At Sprint 12.18.40 completion, task-card interaction and keyboard limitations, primarily visual selected state, TaskForm, editors, points validation, immutable-type helper, APIs/request-response shapes, schema/migrations/RLS/Storage policies, Preview, publication, and deletion guards were otherwise unchanged; Sprint 12.18.42 supersedes the task-card selected-state portion.

- Sprint 12.18.42 - Task Card Selected-State Accessibility.
  - `TaskList` derives `isSelected` from its existing `selectedTaskId` and passes the boolean to `TaskCard`; selection ownership, task ordering, and callbacks remain unchanged.
  - `TaskCard` now renders visible secondary `Выбрано` only for the selected task while retaining the violet ring and naturally wrapping metadata. The existing non-focusable mouse-selection wrapper remains a plain `div` with no role, `tabIndex`, or keyboard handler.
  - The native pencil button retains `stopPropagation()` and `onSelect`, and now has the accessible name `Открыть задание «{title}»`. Only the active pencil has `aria-current="true"`; no `aria-selected`, `aria-pressed`, listbox, option, tab, or composite-widget semantics were added.
  - Manual authenticated no-write verification confirmed keyboard Tab access, Enter and Space pencil activation, unchanged mouse selection, selected ring/text movement, readable narrow layout, wrapping metadata, and reachable actions. No Save, Create, Delete, upload, removal, POST, PATCH, DELETE, or live-data change occurred.
  - No automatic focus, refs, or deletion-focus recovery were added. Delete confirmation/isolation, status messaging, selection synchronization, task display, TaskForm, editors, validation, immutable-type guidance, APIs, Preview, and guards remain unchanged.

- Sprint 12.18.44 - Deleted Task Focus Recovery.
  - Implemented deletion-focus recovery across `QuestTasksClient`, `TaskList`, and `TaskCard`. After a successful selected-task deletion, the unchanged `syncSelectedTask(nextTasks)` algorithm selects the first remaining task and focus moves to its native pencil button. After an unselected deletion, selection remains unchanged and focus moves to the next surviving task at the deleted index, or the previous task; focus and selection may intentionally differ. Deleting the only task focuses the existing `Задания` heading with `tabIndex={-1}`.
  - `selectedTaskId` is mirrored in a current ref, so selected versus unselected deletion is decided at successful DELETE response time rather than from a stale closure. Cancellation, session expiry, server rejection, guards, and other failed DELETE paths create no focus target.
  - `QuestTasksClient` owns an identity-safe `Map<taskId, HTMLButtonElement>` in a ref. Each `TaskCard` retains and unregisters its exact mounted pencil element; cleanup deletes only when `map.get(taskId) === element`, so stale callback-ref cleanup cannot remove a replacement.
  - The initial controlled test successfully deleted the selected temporary task, synchronized selection, and showed `Задание удалено.`, but focus did not move to the intended remaining pencil and Enter immediately after deletion did not activate it. Temporary data was cleaned up, and the implementation was not committed before the corrective `focusSignal`/`useLayoutEffect` work. A registered target clears after focus succeeds; an existing target with a temporarily missing button remains pending until only its matching registration retries; a target absent from current tasks clears without redirecting focus.
  - The final controlled retest created and deleted exactly one temporary selected Text task. `Задание удалено.` appeared, an existing remaining task became selected, focus moved to its intended pencil, and Enter immediately activated it without an additional Tab press. Temporary data was removed, the original task count was restored, cleanup completed, no existing task was intentionally modified, and no image or Storage operation occurred.
  - Selected temporary-task deletion is live verified. Selected/unselected first, middle, and last deletion variants, plus the only-task heading fallback, were statically reviewed only and were not all live-write verified. Task ordering, confirmation, DELETE contract, status messages, error handling, TaskForm, editors, points validation, immutable-type guidance, images, Preview, schema, RLS, publication, and deletion guards remain unchanged.

- Sprint 12.18.46 - Task Editor Field Label Accessibility.
  - Implemented only in `TextTaskEditor` and `SingleChoiceTaskEditor`: `Название` labels `#text-task-title`, `Текст задания` labels `#text-task-description`, `Вопрос` labels `#single-choice-task-title`, and `Описание` labels `#single-choice-task-description`.
  - The editor-specific IDs are stable and cannot collide. Existing read-only type-field IDs, points IDs, `aria-invalid`, and `aria-describedby` associations remain unchanged; no state, validation, save, payload, image, option, correct-answer, layout, responsive, API, schema, or Storage behavior changed.
  - Manual read-only browser verification confirmed that all four labels focus their associated controls. No Save action, server request, or live-data write occurred.
  - A separate intermittent QA observation remains unresolved: the user reported occasional navigation to quest Settings while using `Добавить вариант` or dragging the outer document scrollbar at the far-right edge. Static investigation found no confirmed form, Link, parent navigation handler, router call, redirect, stretched link, overlay, fixed right-edge element, or horizontal-overflow source. Runtime isolation is pending; no speculative fix was made or claimed, and this does not describe Sprint 12.18.46 implementation behavior.

- Sprint 12.18.48 - Task Creation Inline Title Validation.
  - `TaskForm` now replaces the native blank-title alert with local `titleError` state, a typed ref to the existing title input, and the exact inline error `Введите название задания.`. Blank and whitespace-only titles set the error, focus the existing input with `focus()`, and return before points validation or `onSave`, with no request and no field reset.
  - The title input conditionally uses `aria-invalid` and `aria-describedby="task-title-error"`; the conditional `#task-title-error` uses `role="alert"` and existing red error styling. The visible label association remains unchanged, no duplicate ID or ARIA naming was added, and API failures remain in the existing `QuestTasksClient` workspace error region.
  - Error lifecycle: initial render has no error; whitespace remains invalid; non-whitespace input clears the error; repeated invalid submission refocuses the field; successful creation clears it. The `Promise<boolean>` contract, points validation/order, create reset, failed-create retention, payload, selection, layout, and APIs remain unchanged.
  - Manual browser verification covered local invalid-title behavior only: empty and whitespace-only titles showed the error, focus returned to title, type and points remained unchanged, and valid typing cleared the error. No valid-title create, Save, POST, upload, removal, cleanup, or live-data write occurred. Successful-create reset and API-failure retention are statically reviewed only.

- Sprint 12.18.49 - Task Workspace Accessibility Exit Review Planning.
  - Planning review passed: no current MVP accessibility blocker was found for keyboard-only task creation, editing, selection, deletion, validation recovery, task-card navigation, or post-delete focus recovery. Immediate task-workspace accessibility implementation stops while launch QA and a non-blocking backlog remain preserved.
  - Completed coverage includes assertive workspace errors and polite conditional success status; inline blank-title recovery; associated editor labels and read-only type guidance; associated points errors; native pencil selection with visible `Выбрано`; isolated delete actions; bounded identity-safe deletion focus recovery; and accessible image upload/removal controls.
  - Important non-blocking findings: session-expired text remains English, redirects immediately, and the login page explains the reason; no arbitrary delay is recommended, so future work should prioritize localization and clearer login feedback. There is no `aria-busy` or action-specific busy text, and editor Save validation is not individually associated to every affected control.
  - The Single Choice correct-answer radios have visual context but no programmatic group label; each currently exposes the repeated accessible name `Правильный ответ`. Future `fieldset`/`legend` or equivalent group-label review is recommended; no implementation was performed.
  - The browser-native `Удалить задание?` confirmation is keyboard accessible and exposed to screen readers by the browser, but omits the task title. It was not independently screen-reader tested in this project. Replacing it with a custom dialog remains optional polish because of focus-management and regression risk.
  - QA backlog: runtime Settings-navigation isolation before internal testing; unselected first/middle/last deletion focus, only-task heading fallback, valid create/reset after Sprint 12.18.48, and API-failure field retention before public MVP; session localization, busy semantics, Save associations, radio-group semantics, and custom-confirm decision after MVP.
  - Settings navigation remains unresolved deferred QA, not part of accessibility implementation: its reported triggers are `Добавить вариант` and far-right document scrolling; static inspection found no form, Link wrapper, overlay, router call, redirect, or confirmed overlap, and no speculative fix was made.

Next sprint:

- Sprint 12.19.1 - Public Quest Catalog and Student Access Planning.
  - Planning passed. Public routes are `/` and `/login`; legacy `/quests`, `/quests/[id]`, and `/quests/[id]/tasks` redirect into the teacher workspace. Teacher routes are `/dashboard/quests`, `/dashboard/quests/new`, and `/dashboard/quests/[id]/{settings,tasks,preview,play}`. Dashboard requires a session, services also enforce `author_id = auth.uid()`, and Preview/Play remain teacher-owner-only.
  - `QuestRunner` is client-local with no persisted answers/results, and its teacher payload includes `answer` and `content.correctOptionId`. It must not be reused for public/student delivery; a future student runtime needs a sanitized task DTO without answer keys.
  - Historical planning note: `is_public` is the only publication state. The former claim that Settings supports publish/unpublish is superseded by Sprint 12.20.3: the dedicated publication action is now authoritative, with canonical eligibility recalculation and separate metadata-only Settings PATCH. There is no slug, `published_at`, price/currency, entitlement, author display profile, moderation workflow, or status enum.
  - `database/migrations/001_initial_schema.sql` is empty, so local history is not authoritative for complete live schema. No live schema inspection occurred; live columns, foreign keys, indexes, functions, views, and applied policies must be verified before database work. Authenticated owners have quest/task access through parent ownership; anonymous and authenticated non-owner published reads are denied, so public catalog reads currently fail. Existing owner policies must not be broadened to expose drafts, owners, or answer keys.
  - Browser/server clients use the anon key with session context. No service-role public client exists or should be added because it bypasses RLS. Teacher quest queries select explicit fields, but `getOwnedQuestTasks()` uses `select("*")` and must never be repurposed publicly; a dedicated public service is required.
  - Recommended MVP: anonymous `/catalog` and `/catalog/[id]` browsing, authentication before later `/catalog/[id]/start`, server-rendered published-only reads, separate public quest and future student-task DTOs, and no direct base authoring rows or weakening of teacher policies. Use a dedicated published-only projection, view, or RPC through a server-only service with the normal anon client and database-enforced published-only access; choose view versus RPC after live verification. UUIDs are acceptable only with published-only authorization and indistinguishable 404s; preserve `/quests` redirects and defer slugs.
  - Keep `is_public` for catalog MVP; defer `published_at`, enum states, versioning, moderation, and snapshots. Sprint 12.19.1 initially considered optional covers alongside title, short description, difficulty, grade, language, subject, and detail/start action. Sprint 12.19.2 supersedes cover delivery for the first DTO; duration/category/tags/task count/publication date remain deferrable, and author attribution, price/free-paid, popularity, total points, and payment state remain omitted. First filters are server-side URL-query text, subject, grade, difficulty, and language; task count needs aggregation and is omitted initially.
  - Public browsing needs no login, Start needs a safe local return path, and current OTP always returns to `/dashboard`. Accept only validated local relative paths and reject external or `//` values. Do not infer teacher/student role from ownership; role design, progress/results, assignments, enrollment, attempts, leaderboards, certificates, purchases, subscriptions, and entitlement remain later scope. First catalog is free-only with no price, badge, checkout, purchase, or fake payment UI.
  - Sprint 12.19.1 initially considered validated public cover URLs because `quest-images` is publicly readable and paths contain owner UUID segments. Sprint 12.19.2 supersedes that decision: the initial public DTO omits covers, returns no raw `cover_image_path`, and rejects application-side URL construction because it requires that denied path. The catalog MVP uses a fallback cover. Future media requires an opaque media boundary, private/signed delivery, or a separate explicit owner-UUID disclosure decision.
  - Security/performance plan: published-only database boundary plus server 404 prevents draft/IDOR exposure; sanitized DTOs prevent answer leakage; short/dynamic server rendering avoids stale withdrawal exposure; plan query limits/pagination before growth and do not precompute counts yet. Missing/draft items use indistinguishable 404, missing covers use fallback, taskless public quests are not playable, and failures use generic messages. Anonymous play is rejected because current runtime exposes answers; login-required browsing harms discovery; assignment-only and marketplace models are deferred.
  - Sequence: verify live schema/policies, define public DTO, add projection/view/RPC and service, catalog/list filters, detail, safe login return, sanitized student runtime, then optional attempts and launch QA for draft withdrawal/caching/exposure. Existing task-workspace QA remains separate.

The planned live-schema and public-read-boundary verification completed without applying SQL, changing policy, implementing catalog code, or modifying live data. Preserve the separate task-workspace QA backlog.

## Stack

- Next.js 16
- React
- TypeScript
- Tailwind
- Supabase

## Sprint 12.20.2-12.20.3 Publication Flow

- Publication eligibility is centralized by Migration 014 through `public.is_public_runtime_eligible(uuid)`, which is the catalog/runtime eligibility predicate.
- The owner-safe readiness boundary is `GET /api/teacher/quests/[id]/publication-readiness`. It returns only allowlisted readiness data: `ready`, blockers/warnings, task count, and supported-task count.
- Migration 015 is live as version `20260728193030`. Its authenticated-only function is `public.set_owned_quest_publication_state(uuid, boolean)`: `VOLATILE`, `SECURITY DEFINER`, with fixed `pg_catalog, public` search path. It owner-scopes the mutation, recalculates canonical eligibility at publish time, locks `public.quest_tasks` for the short eligibility snapshot, and returns fixed `published`, `already_published`, `unpublished`, or `already_draft` outcomes. Anonymous and service-role EXECUTE are not granted.
- `POST /api/teacher/quests/[id]/publication` accepts only `{ "action": "publish" | "unpublish" }`, maps only fixed safe success and `400`/`401`/`404`/`409`/`500` responses, and exposes no raw Supabase or database detail.
- Settings PATCH is metadata-only. It rejects any own enumerable `is_public` property with `Publication state must be changed through the publication action.` A successful metadata save invalidates client readiness but does not mutate displayed publication state.
- `QuestPublicationReadiness` is the sole client owner of displayed publication state. Readiness remains manual; warnings allow Publish, blockers prevent it, Publish requires current `ready === true`, Unpublish requires no readiness, and neither action is optimistic. Native confirmations, guarded requests, stale-readiness clearing, and safe feedback are used.
- Manual browser verification passed for Draft readiness then Publish, Published then Unpublish, warnings allowing Publish, blockers preventing Publish, settings invalidation, and state surviving refresh. Automated verification passed: 6 test files, 88 tests passed, 0 failed; lint and production build passed.
- No persistent student attempts, student accounts/cabinet, assignments, payments/entitlements, production rate limiting, or production deployment capability was added.

## Sprint 12.20.6 - Controlled Public Publication Lifecycle Verification

- With product-owner approval, the normal teacher UI was used with existing Draft quest `1a206882-650e-4982-840a-fe6108872cac`. Its original and final state were both Draft.
- The quest had two tasks, two supported tasks, zero readiness blockers, and seven recommendations; readiness remained available before and after the controlled flow.
- The anonymous Draft baseline was verified: the quest was absent from the public catalog, public detail was unavailable, and public runtime start was unavailable.
- Publishing through the teacher UI survived refresh and made the quest visible in catalog list/detail and available in the public runtime. One safe Text-only browser submission returned zero correct, incorrect, and unanswered tasks with two `not_scored` tasks; no answer or sensitive data was exposed and no attempt/history was persisted.
- Unpublishing through the teacher UI survived refresh. An already-open runner remained visible locally, but its next submission was rejected through the generic safe UI path; hard-refreshed catalog, detail, and start views withdrew access.
- Republishing restored list/detail/runtime visibility. The mandatory final unpublish restored the exact original Draft baseline.
- No metadata, task, cover, Storage object, repository file, schema, migration, or application code changed during verification.

## Sprint 12.20.9B - Public Catalog Cover Delivery

- Migration 016 is applied and verified in live Supabase. It adds the narrow service-role-only cover resolver while preserving the public catalog list/detail boundary and without converting a Storage bucket or exposing raw cover paths.
- Public catalog list/detail rows expose only `has_cover` for cover availability. The application derives an opaque same-origin cover route from the public quest ID; neither the catalog DTO nor browser markup exposes a Storage object path.
- `GET /api/public/quests/[id]/cover` rechecks public eligibility server-side, resolves and validates the stored cover internally, and returns only validated image bytes or generic `404`/`500` responses. The catalog list and detail use a reserved 16:9 cover area with a stable fallback when media is unavailable.
- The local server-only `sb_secret_...` key is configured and verified without recording its value. Legacy JWT-based API keys remain temporarily active because the browser still uses the legacy anon key; a controlled migration to `sb_publishable_...` is separate future work.
- Automated verification passed: 9 test files, 104 tests passed, 0 failed; lint and build passed. Controlled browser verification confirmed catalog/detail covers, public start continuity, safe media headers and 404s, stable fallback and recovery, unpublish withdrawal, republish restoration, and restoration of the original public state.
- No cover object, cover path, quest metadata, task, Storage policy, bucket configuration, persistent attempt, payment, student system, or deployment capability was changed by this sprint.

## Sprint 12.20.10 - Public Catalog Empty, Loading, and Error UX

- `/catalog` now distinguishes a completely empty catalog, filtered/search no-results, and no-more-results for a nonzero offset. Targeted Reset, Previous, and return-to-start catalog navigation preserve the normalized supported filters.
- Loading UI now has visible progress text, polite announcements, busy semantics, decorative skeletons hidden from assistive technology, and reduced-motion handling. Detail has route-local loading and error boundaries; detail not-found and public start loading/error now follow the same accessible state conventions through `PublicCatalogState`.
- Catalog query normalization remains silent for malformed, repeated, and out-of-range parameters. The cover fallback remains an independent stable 16:9 media fallback and never becomes a page-level error.
- Automated verification passed: 9 test files, 104 tests passed, 0 failed; lint and `git diff --check` passed. Code review found no implementation blocker. Manual browser verification passed for normal catalog rendering, cards/covers, filters/reset, filtered and high-offset states, return navigation, parameter normalization, unavailable-detail focus, responsive layout, and cover fallback.
- The original production-build retries were externally blocked because `Geist` could not be fetched from `fonts.googleapis.com`. Sprint 12.20.11A supersedes that resolved environment dependency with the official local Geist variable font; no TypeScript, Next.js route-boundary, lint, or application-code defect was found.
- No API, DTO, auth, publication, Supabase, Storage, migration, package, deployment, or configuration change occurred in this sprint.

## Sprint 12.20.11 - Production Build Reliability and Local Geist Font

- Sprint 12.20.11 planning identified the live Google Fonts Geist fetch as the production-build reliability blocker. Sprint 12.20.11A replaced `next/font/google` with `next/font/local` in `app/layout.tsx` while preserving `--font-sans`, the existing HTML integration, `display: "swap"`, and the variable `100 900` weight range.
- The locally bundled official Vercel Geist asset is `app/fonts/GeistVF.woff2`, sourced from `vercel/geist-font` release `v1.7.1` at immutable commit `8b8b75fa63e339db10a3cd52fb28536615b5cc63`: original `fonts/Geist/webfonts/Geist[wght].woff2`, 69,760 bytes, SHA-256 `2FFEBE993E969069A9789D15164B7715D42491B5835516C5E3B935D5F81B05F1`, licensed under SIL Open Font License 1.1. `app/fonts/SOURCE.md` and `app/fonts/LICENSE.txt` preserve provenance and license text.
- Production builds now complete without live Google Fonts access. Automated verification passed: 9 test files, 104 tests passed, 0 failed; lint and production build passed. Manual verification passed for `/`, `/catalog`, public detail, `/dashboard/quests`, Russian/Cyrillic text, normal and bold weights, no visible typography/layout regression, and no browser requests to Google font hosts.
- A one-time local dev-server task-database error came from ignored stale `.next` Turbopack cache state. Stopping the dev server, deleting only ignored `.next`, and restarting resolved it; no source-code correction was required and it is not an application defect.
- No package, configuration, API, DTO, auth, publication, Supabase, Storage, SQL, migration, deployment, or runtime behavior changed. Commit `96adcfb` is pushed and `feature/next-work` is synchronized with origin.

## Sprint 12.20.12 - Production Deployment Readiness Planning

- Planning selected Vercel as the primary production deployment target, with a Node-compatible managed host such as Render as a fallback. The production build is healthy, but production deployment remains blocked until launch-readiness controls are completed.
- Required production environment names are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; no values are recorded. The legacy JWT-based anon-key migration remains separate controlled work and must not be disabled yet.

## Sprint 12.20.13 - Auth Callback Redirect Hardening

- `app/auth/callback/route.ts` now accepts only safe same-origin local paths. It fails closed for malformed, external, protocol-relative, raw or encoded backslash, control-character, and parser-normalization destinations, falling back to `/dashboard`.
- Focused callback verification passed 23 tests; the full suite passed 127 tests; lint, build, and manual browser verification passed. Commit `a268817` (`Harden auth callback redirects`) is pushed and `feature/next-work` is synchronized with origin.

## Sprint 12.20.14 - Public Endpoint Rate-Limit and Abuse-Control Planning

- Public catalog, runtime, cover, and submit surfaces were inventoried. `POST /api/public/quests/[id]/submit` is the highest-priority application abuse boundary because it can invoke scoring after its existing JSON/content-type, 32 KiB body, 100-answer, and bounded-shape validation.
- The recommended future model is hybrid: platform protection for volumetric anonymous GET traffic plus a privacy-preserving shared/distributed application limiter for submit. A production in-memory `Map` limiter is not acceptable. Generic throttling responses must not log request bodies, answers, cookies, tokens, or raw client identity.
- The originally provisional submit-limiter selection is superseded by Sprint 12.20.15A and Sprint 12.20.15B below.

## Sprint 12.20.15A and 12.20.15B - Shared Public Submit Limiter

- Sprint 12.20.15A completed the implementation selection: Upstash Redis with `@upstash/redis` and `@upstash/ratelimit`, initially using Vercel's `x-vercel-forwarded-for` as the trusted client-identity source, opaque HMAC-SHA-256 keys, fail-closed behavior, and token buckets suitable for shared school NAT. Sprint 12.20.18 superseded that header choice with `x-forwarded-for` after Preview verification; it remains the sole trusted source.
- Sprint 12.20.15B added server-only identity normalization and the shared limiter for `POST /api/public/quests/[id]/submit`. IPv4 and canonical IPv6 are supported; IPv4-mapped IPv6 becomes IPv4; missing, malformed, comma-separated, or zone-qualified values fail closed. Raw identity is never persisted, logged, returned, or sent in provider keys.
- The client bucket has capacity 75 and refills 60 per minute. The client-plus-quest bucket has capacity 60 and refills 45 per minute. Both must allow before scoring. Analytics and ephemeral cache are disabled.
- The route preserves UUID, content type, 32 KiB body, JSON, strict shape, and 100-answer validation before rate limiting. Invalid requests do not consume limiter capacity. A limit denial returns fixed `429` JSON with `Retry-After` and `Cache-Control: no-store`; unavailable identity, configuration, or provider returns fixed `503` JSON with `Retry-After: 60` and `Cache-Control: no-store`. Scoring does not run after either response.
- Only the environment variable names `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `RATE_LIMIT_HMAC_SECRET` are referenced; no values are committed. Focused tests passed 3 identity, 5 limiter, and 10 route cases; the full suite passed 12 files and 138 tests, with lint and production build passing. Commit `0605136` is pushed.
- Upstash and Vercel resources, preview/production environment configuration, WAF/rate rules, staging verification, and deployment remain incomplete. The code is not production-operational until those controls are separately configured and verified.

## Sprint 12.20.16 - Platform Public GET Abuse Controls and Cache Policy Planning

- Audited anonymous GET surfaces and selected Vercel platform/WAF protection over application Redis limits for general public GET traffic. Hard per-IP GET limits are intentionally deferred because school and classroom NAT could create false positives.
- `/catalog` and `/catalog/[id]` remain dynamic and are not approved for shared CDN caching. `/catalog/[id]/start` remains no-store and publication-sensitive. The public cover route uses `private, max-age=60, must-revalidate` on success and `no-store` on errors; stale-while-revalidate is not approved for publication-sensitive responses.
- Publication withdrawal targets are effectively zero stale window for runtime start/errors and no more than 30 seconds for any future shared catalog/detail/cover cache after preview validation. Global proxy/Supabase auth cost on public matched requests must be measured in preview. Vercel WAF/Firewall capabilities and plan entitlement still require account verification.

## Sprint 12.20.17 - Public Debug Route Removal and Anonymous Surface Verification

- Removed `app/test/page.tsx`; `/test` now receives normal not-found behavior. Added `tests/app/anonymous-surface.test.ts` to prevent public/debug routes from reintroducing raw Supabase row or error serialization.
- Focused verification passed 2 tests; the full suite passed 13 files and 140 tests. Lint and build passed. Local smoke checks returned `/test` 404, `/catalog` 200, and a linked public quest detail 200. `proxy.ts` remained unchanged.
- Commit `e49d6fd` (`Remove public debug route`) is pushed and `feature/next-work` is synchronized with origin. No provider, environment, deployment, Supabase, Storage, schema, or configuration action occurred.
- Sprint 12.20.18 completed controlled Preview provisioning and smoke verification. The GitHub repository is connected to Vercel project `qwestum-education`; `main` remains the Production branch and `feature/next-work` serves the controlled Preview deployment. A separate Preview Upstash Redis database is configured for the shared submit limiter. Preview configuration uses only the approved names `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `RATE_LIMIT_HMAC_SECRET`; values are never documented.
- Preview diagnostics found formatting issues, not application data or schema failures: the initial Preview had an incorrectly formatted Supabase URL; early submit `503` responses occurred before Upstash; commit `147246d78c67aeffc5922a53361468e4ffe17949` (`Fix Vercel client IP header for submit limiter`) changed the sole trusted header to `x-forwarded-for`; and a later provider-reaching `503` was resolved by correcting the two Upstash Preview values in Vercel. No fallback to `x-vercel-forwarded-for` or `x-real-ip` is used. The commit is pushed; 13 files/140 tests, lint, and build passed.
- Final fresh Preview smoke verification passed for `/`, public catalog, public detail, public runtime start, `/test` normal not-found behavior, and a real provider-backed public submit through its result page. The verified Text task result was `not_scored` (`Не оценивается`); no runtime errors were observed after the corrected deployment. The limiter reached the configured Preview provider without exposing identity, provider, answer, or credential data.
- An initial Vercel CLI deployment was created as a temporary Production provisioning artifact because first deployment behavior selected Production. It is not a production launch or promotion: no production promotion, domain rollout, Supabase/Auth configuration change, or production traffic approval exists. Remaining work is the safe disposition of that artifact, exact Supabase Auth Preview redirect allowlist, Preview magic-link/login and teacher/dashboard verification, controlled `429` verification, and the remaining deployment/security review. All provider actions remain separately approval-gated.

## Sprint 12.20.19 - Preview Auth, Rate-Limit, and Deployment Safety Verification

- Completed as **PASS WITH DEFERRED LIVE 429 EVIDENCE**. Manual browser verification passed for the configured Preview Auth callback, magic-link return, authenticated `/dashboard` and `/dashboard/quests`, logout, and renewed protected-route enforcement. Public routes remain intentionally anonymous. The callback is constructed from `window.location.origin` with `/auth/callback?next=/dashboard`; validated same-origin local `next` paths are required, and malformed or external values fall back to `/dashboard`.
- The shared submit limiter passed implementation review and focused tests: request validation precedes limiting, limiting precedes scoring, `limited` produces fixed no-store `429` with `Retry-After`, unavailable limiter state produces fixed fail-closed no-store `503` with `Retry-After`, and scoring is not invoked for either path. The only trusted client-identity source is `x-forwarded-for`; `x-real-ip` and `x-vercel-forwarded-for` are not fallbacks. Focused verification passed 3 files/18 tests.
- Browser Preview verification confirmed the public runtime and a provider-backed submit can reach the application: one submit completed with `200`, while another returned fail-closed `503`. A live shared-limiter `429` was not safely established. Codex execution-context public GETs were intercepted by Vercel-marked redirects and submit by external `401` before application handling; the public submit and proxy sources have no `401` path. This is consistent with external Preview/Deployment Protection, not a limiter defect. Do not weaken or disable Preview protection solely to obtain `429` evidence.
- No Production promotion, cleanup, deletion, aliasing, rollback, provider mutation, or deployment change occurred. The accidental initial Production deployment remains a temporary provisioning artifact, not a release. The safe repository rollback reference remains `24f8b71`; the last Vercel client-IP runtime fix remains `147246d`. Live `429` evidence remains a required pre-production verification item. An expired magic-link surfaced Supabase `otp_expired` behind a more generic login message; this is a non-blocking future UX follow-up.

## Sprint 12.20.20 - Pre-Production Readiness Planning

- Completed as **PASS - PRE-PRODUCTION READINESS PLAN DEFINED**. Continued MVP development is approved; Production promotion is not approved. The remaining launch-readiness work is not a blocker for continued feature development, but all P0 gates must be completed before intentional Production launch.
- P0 pre-production gates are: obtain one controlled shared-limiter `429` from an authorized Preview browser context; inspect the current Vercel Production artifact, domains/aliases, Production branch, Deployment Protection, relevant access settings, and Firewall/WAF capabilities; confirm Production Supabase Auth callback/redirect requirements; identify the exact known-good deployment and rollback reference; and define and explicitly approve the final Production smoke-test plan.
- The `429` method must use ordinary sequential browser requests with a known valid public payload, stop on the first `429`, and record only request count, numeric `Retry-After`, `Cache-Control`, fixed response body, and leakage verdict. Do not weaken Preview protection, manipulate identity or Redis, spoof forwarding headers, or run concurrent load testing; repeated `503` responses are a blocker.
- The accidental initial Production deployment remains a provisioning artifact, not the Production launch. Leave it untouched until an approved release decision; inspect aliases/domains before any deletion, reassignment, rollback, or promotion. `24f8b71` remains the stable pre-documentation rollback baseline and `147246d` remains the Vercel client-IP limiter fix reference.
- `proxy.ts` currently matches nearly all non-static routes, so anonymous public routes and APIs incur `updateSession()` / Supabase `auth.getUser()` work. This is P1 latency/cost review, not a current security blocker; any matcher narrowing needs a separately tested implementation sprint. Public runtime start is force-dynamic and submit responses use `Cache-Control: no-store`; this conservative cache posture is correctness-safe. Application-level dual fail-closed Upstash submit limiting does not replace provider-level volumetric protection, so a documented Vercel Firewall/WAF baseline is required before launch. Expired magic-link feedback remains safe P1 polish.
- Development direction returns to neutral **Core MVP Next Milestone Planning**. Do not force `429` evidence through protected Codex execution; retain the P0 checklist for the point when intentional Production promotion approaches.

## Important Notes For Future Codex Chats

- This is a long-running project. Preserve existing architecture unless the user explicitly asks for a redesign.
- The task editor and runtime renderer are modular. Add new task types through the existing registry/renderer patterns.
- Storage writes and owner-scoped deletes are supported for new task images and quest cover images. Public reads remain and legacy `tasks/{uuid}` objects are preserved.
- Deferred storage work includes private bucket/signed URLs, magic-byte MIME validation, orphan cleanup tooling, image resizing/cropping, and legacy object migration.
- Expired-session API `401` responses now use a small shared client helper in current teacher workflows.
- Deferred auth/session work includes cross-tab logout synchronization, return-to-current-page support, unsaved-edit persistence, mutation replay, and role-aware teacher/student guards.
- Deferred quest metadata work includes possible metadata chip consolidation, language during quest creation, catalog filtering/indexes, multilingual quest variants, UI localization/i18n, language administration, cover selection during quest creation, attempt limits, and subject catalog filtering/administration.
- Quest creation intentionally creates draft shells first; Settings remains the canonical place for metadata, cover image, tasks, and publication.
- Russian UI text exists throughout the app and must be preserved.
- Some shell output may display Russian text as mojibake. Check actual source files before changing UI text.
- Do not commit or push unless explicitly asked.

## Sprint 12.19.2 - Live Schema and Public Read Boundary Verification

- Passed from authoritative manual read-only metadata inspection. Live `profiles`, `quests`, `quest_tasks`, and `subjects` have RLS enabled without FORCE RLS; `categories` is absent. `quests` and `quest_tasks` have primary-key indexes only, with no catalog or `quest_id` index. No relevant catalog view, materialized view, function, or RPC exists.
- Exact `public.profiles`: `id uuid NOT NULL` no default; `full_name text NULL` no default; `email text NOT NULL` no default; `role text NOT NULL DEFAULT 'teacher'`; `avatar_url text NULL` no default; `created_at timestamptz NULL DEFAULT now()`. PRIMARY KEY (`id`) and UNIQUE (`email`) are present. Owner is `postgres`, RLS is enabled, FORCE RLS is disabled, and no user-defined trigger exists.
- Exact `public.quest_tasks`: `id uuid NOT NULL DEFAULT gen_random_uuid()`; `quest_id uuid NULL`, `sort_order integer NULL`, `title text NULL`, `description text NULL`, `answer text NULL`, `hint text NULL`, `image_url text NULL`, `video_url text NULL`, `audio_url text NULL`, and `content jsonb NULL`, each with no default; `points integer NULL DEFAULT 1`; `created_at timestamptz NULL DEFAULT now()`; and `task_type text NULL DEFAULT 'text'`. PRIMARY KEY (`id`) and FOREIGN KEY (`quest_id`) REFERENCES `public.quests(id)` ON DELETE CASCADE exist; no task type, points, or sort-order checks exist. Owner is `postgres`, RLS is enabled, FORCE RLS is disabled, no user-defined trigger exists, `quest_tasks_pkey` is the only index, and neither `quest_id` nor `(quest_id, sort_order)` is indexed.
- Exact `public.subjects`: `id uuid NOT NULL DEFAULT gen_random_uuid()`; `name text NOT NULL` no default; `grade integer NULL` no default; and `created_at timestamptz NULL DEFAULT now()`. PRIMARY KEY (`id`) and `subjects_pkey` are the only constraint/index. Owner is `postgres`, RLS is enabled, FORCE RLS is disabled, and no user-defined trigger exists.
- Owner-safe RLS remains the row boundary despite broad anon/authenticated/service_role table ACLs: anonymous published quest and task reads remain denied. No service-role catalog client, anonymous base-table policy, or public task policy is approved.
- Live `quests` validates grades, duration, language, category, and tag count but not difficulty. Live `quest_tasks` validates neither task type, points, nor sort order. `quest_tasks.content` is arbitrary JSONB. Local `001_initial_schema.sql` is empty and no `supabase_migrations` relation exists, so the live schema is authoritative.
- Type drift is recorded: `Quest` omits grade/duration and overstates nullable author/difficulty/created fields; `TeacherQuest` needs nullable author/difficulty/created fields; teacher/shared task types overstate multiple nullable task columns and restrict JSONB content too narrowly. Owner `getOwnedQuestTasks().select("*")` remains private and must never feed a public DTO.
- Selected safe catalog boundary: two explicit SECURITY DEFINER RPCs, `list_public_catalog_quests()` and `get_public_catalog_quest(uuid)`, with fixed `search_path`, schema qualification, published-plus-task-EXISTS eligibility, internal subject-name join, explicit allowlisted output, revoked default PUBLIC EXECUTE, and grants only to anon/authenticated. List/detail expose no task row/count, owner, subject id, raw cover path, answers, hints, content, correct-answer identifier, scoring, validation, or database errors.
- Initial `PublicQuestCatalogItem` contains public ID/title/description, nullable subject name/difficulty/language/grades/duration/category/created time, and tags. It intentionally omits covers: returning raw `cover_image_path` through a public RPC is rejected, and application URL construction would require that denied value. Catalog MVP can use a fallback until opaque/private/signed media delivery or explicit path-disclosure approval.
- `quest-images` remains public for JPEG/PNG/WebP up to 5,242,880 bytes, with PUBLIC SELECT and existing owner-path write/delete policies. Owner UUID path disclosure is an existing separate P1 media tradeoff.
- **NOT APPLIED - REQUIRES SEPARATE APPROVAL:** first migration plan includes `quest_tasks(quest_id)`, partial public catalog ordering index, and the two narrow RPCs. No SQL, index, function, grant, RLS, Storage, or application change exists yet. **NOT EXECUTED:** rollback first removes callers, then revokes EXECUTE, drops detail/list RPCs, drops indexes, and verifies anonymous direct reads remain denied.
- Recommendation A: safe to prepare migration SQL only in Sprint 12.19.3. Read-only verification must inspect the deployed RPC security and output; controlled verification must temporarily publish and restore an existing owned Draft with a task. Task-workspace QA remains separate.

## Sprint 12.19.3 - Public Catalog Read Boundary Migration Planning

- Planning passed without creating a migration file or changing application code, live data, SQL, schema, indexes, functions, grants, RLS, Storage, staging, commit, or push.
- The exact boundary is separate `LANGUAGE sql`, `STABLE`, `SECURITY DEFINER` list/detail functions owned by `postgres`, with fixed `pg_catalog, public` search path, schema-qualified tables and pg_catalog helpers, no dynamic SQL/auth.uid()/role switching/temp objects, and only the approved DTO. They require public status plus internal task `EXISTS`, join only subject name, and expose no owner/raw path/task/count/scoring/error data.
- List signature is `list_public_catalog_quests(text, text, integer, integer, text, integer, integer)` with all seven approved MVP filters/defaults; detail is `get_public_catalog_quest(uuid)`. Search is trimmed, whitespace-normalized, literal case-insensitive title/description matching with wildcard escaping; subject is normalized case-insensitive exact name; grade is inclusive; null filters disable filtering; mismatches return empty results. Offset pagination clamps limit to 1-100 and offset non-negative, ordered by `created_at DESC NULLS LAST, id DESC`.
- Planned indexes are ordinary transaction-compatible `quest_tasks_quest_id_idx` and partial `quests_public_catalog_created_at_id_idx`; broader filters remain deferred. Use `CREATE FUNCTION` so unexpected signatures fail visibly. Revoke PUBLIC/anon/authenticated/service_role execution and grant only anon/authenticated; no table grants, RLS, Storage, public task access, or service-role catalog logic changes.
- **NOT APPLIED - REQUIRES SEPARATE APPROVAL:** only those indexes, two functions, and explicit grants/revokes are planned. **NOT EXECUTED:** rollback removes callers, revokes execution, drops detail/list functions then indexes, and verifies anonymous denial plus teacher owner reads. Deployment is migration, metadata/schema-cache/anonymous validation, then application; transactional failures roll back and cache/lock timing remain release checks.
- Future read-only checks cover function metadata/security/signatures/ACLs/indexes/direct anon denial/RPC denylist/filtering; separately approved controlled verification publishes then restores one existing owned Draft with a task. Sprint 12.19.4 creates one reviewed migration file only; task-workspace QA remains separate.

## Sprint 12.19.4 - Public Catalog Read Boundary Migration Application

- Migration version `20260724204657` was successfully applied to live Supabase through the linked Supabase CLI delivery file. Linked migration history records the version locally and remotely, and the linked dry run reports the remote database is up to date.
- Public catalog reads now use `public.list_public_catalog_quests(text, text, integer, integer, text, integer, integer)` and `public.get_public_catalog_quest(uuid)`. The DTO allowlist excludes owner IDs, `subject_id`, `cover_image_path`, task content, answers, hints, points, correct-answer data, and scoring data.
- Anonymous direct reads of `quests` and `quest_tasks` remain blocked. Anonymous list/detail behavior, missing-UUID zero rows, pagination normalization, and deterministic ordering were verified without changing data.
- Verification is **PARTIAL PASS**: no safe authenticated JWT/browser context was available, and independent live catalog re-inspection of ACL, index, RLS, and Storage metadata was incomplete in the available CLI environment. Migration 012 itself made no data-row, RLS, or Storage change.

## Sprint 12.19.5 - Public Catalog RPC Application Integration

- Implemented anonymous public routes `/catalog` and `/catalog/[id]`. Existing `/quests` and `/quests/[id]` teacher redirects remain unchanged.
- `services/public-catalog.server.ts` is the server-only application boundary for `public.list_public_catalog_quests(...)` and `public.get_public_catalog_quest(uuid)`. It uses the normal server Supabase client only, performs no direct `quests` or `quest_tasks` read, uses no service-role credential, maps the allowlisted RPC rows from snake_case to camelCase, normalizes tags, and keeps generic failures separate from zero-row detail results.
- Catalog MVP exposes search, subject, one grade value, and difficulty through GET query parameters. Language, category, and tag filtering are not exposed; category and tags remain display-only metadata.
- The list fetches 25 rows, renders 24, and uses Previous/Next offset pagination while preserving supported filters. Next renders only when `hasNext` and `offset < 10000`, preventing a capped-offset self-link.
- Public detail renders allowlisted metadata only with a fallback visual, generic not-found behavior for malformed, missing, unpublished, or taskless IDs, and no student start, play, task, answer, scoring, or owner-data exposure.
- Manual browser verification passed for anonymous `/catalog`, Cyrillic and Latin search, grade/difficulty filters, Reset, public detail, `/quests` redirect, dashboard behavior, and the expanded `Каталог квестов` header hit area. Only published quests with at least one task appear. Pagination beyond the first page could not be live exercised because fewer than 24 eligible public quests exist.
- No live schema, data, RLS, Storage, migration, grant, or Supabase change occurred during this application sprint.

## Sprint 12.19.6 - Public Runtime Database Boundary

- Migration `013_add_public_runtime_boundary.sql` was applied live as Supabase CLI version `20260725213130`. The byte-identical reviewed source remains `database/migrations/013_add_public_runtime_boundary.sql`; the linked CLI delivery file is `supabase/migrations/20260725213130_add_public_runtime_boundary.sql`. Local and remote migration histories match, and the linked dry run reports the remote database is up to date.
- The anonymous temporary runtime model is now limited to `public.get_public_runtime_quest(uuid)` and `public.score_public_runtime_quest(uuid, jsonb)`. The fetch RPC returns a sanitized runtime DTO; scoring remains server-side, keeps correct answers server-side, treats Text tasks as `not_scored`, and creates no persistent attempts, results, or other data rows.
- Live read-only smoke checks confirmed one eligible anonymous fetch row, missing-UUID zero rows, approved observed fetch/task fields only, one valid exact-task-ID unanswered scoring result, unknown-task zero rows, and zero rows for an over-32-KiB payload. Direct anonymous REST requests for `quests` and `quest_tasks` exposed no data. No rollback or migration repair occurred.
- Verification remains partial. The available CLI dump path requires Docker Desktop, so independent live inspection of function owner/volatility/SECURITY DEFINER/search path/ACLs, RLS, Storage, indexes, and catalog-RPC grants was not completed. No eligible public Single Choice runtime quest was available without mutation, so correct/incorrect, whitespace-only selection, and foreign-option cases were not live exercised. Draft, taskless, malformed/unsupported, deterministic-ordering, and true over-100-answer cases also remain unverified; the reviewed migration source is the basis for their intended behavior.

## Sprint 12.19.7 - Public Runtime Application Integration

- The public runtime application layer is implemented at `/catalog/[id]/start`. It provides anonymous, temporary browser-local play only: `types/public-runtime.ts` defines sanitized application DTOs, and `services/public-runtime.server.ts` is the server-only boundary to `public.get_public_runtime_quest(uuid)` and `public.score_public_runtime_quest(uuid, jsonb)`.
- The bounded `POST /api/public/quests/[id]/submit` route validates and normalizes the anonymous submission before calling the server-only service. The runner exposes no direct browser RPC or table access, no service-role credential, no answer key, and no persistent attempt, result, or other data write.
- Text tasks are rendered as `not_scored`; Single Choice scoring remains server-side. Initial payloads, API results, and client state do not reveal correct answers, expected answers, raw task content, task points, owner data, or database details.
- Manual anonymous browser verification passed for the public-detail start CTA, the valid start route, quest metadata/progress/local-progress warning, a Text task without an input, successful submit (`HTTP 200`), the aggregate-only result, local retry/reset without a refetch or immediate POST, return to public detail, and the existing catalog, teacher redirect, and anonymous dashboard redirect behavior. The Text-only result reported `0` correct, `0` incorrect, `0` unanswered, and `1` not scored.
- Single Choice correct, incorrect, unanswered, and foreign-option browser flows were not manually exercised because no eligible public runtime quest with a Single Choice task was available without mutating live data. Their reviewed database/service contracts and component behavior passed static review, lint, and build, but this is not manual browser proof.

## Sprint 12.19.8 - Single Choice Runtime Verification and Cleanup

- Controlled verification used owned quest `71fb1759-24e7-4bd4-a497-615f2bb0e261`, initially published with four Text tasks. The quest was temporarily unpublished, received two valid Single Choice tasks through the normal teacher UI, and was republished only for verification; no media or Storage object was created.
- Live browser/runtime checks confirmed server-side Single Choice scoring: both correct answers produced earned/possible points `2/2` with `correctCount` `2`; both incorrect produced `0/2` with `incorrectCount` `2`; and both unanswered produced `0/2` with `unansweredCount` `2`. Every run retained `notScoredCount` `4`, and no correct answer was revealed.
- DevTools public-submit checks rejected a nonblank unknown option ID and an option ID belonging to the other Single Choice task with the same generic HTTP `404` unavailable-quest response. Browser-local retry/reset continued to work without answer leakage.
- Cleanup completed: the quest was unpublished first, only the two temporary Single Choice tasks were deleted, the exact four original Text tasks remained, and the quest returned to its prior published state. The public Text-only runtime works again; no quest deletion or Storage cleanup was required.
