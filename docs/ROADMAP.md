# Roadmap

## Completed Foundation

- Next.js 16 project setup
- Supabase integration
- Quest creation and quest loading
- Task creation, editing, deletion, and image upload support
- Modular task editor
- Task type registry
- Text task type
- Single choice task type
- Live preview
- Validation
- Runtime task renderer
- Preview mode and Play mode
- Quest runtime engine and result screen

## Current Milestone

Sprint 12: Teacher Experience

Completed:

- Sprint 12.1 — Teacher Quest Library.
  - Added `/dashboard/quests`.
  - Shows quest metadata, Public/Draft state, task count, and teacher actions.
- Sprint 12.2 — Teacher Preview / Play Routes.
  - Added `/dashboard/quests/[id]/preview`.
  - Added `/dashboard/quests/[id]/play`.
- Sprint 12.3 — Teacher Quest Settings / Publish Controls.
  - Added `/dashboard/quests/[id]/settings`.
  - Supports editing `title`, `description`, `difficulty`, and `is_public`.
- Sprint 12.4 — Teacher Quest Workspace Navigation.
  - Added `components/dashboard/QuestWorkspaceNav.tsx`.
  - Reused it on settings, preview, and play pages.
- Sprint 12.5 - Teacher Task Editor Dashboard Integration.
  - Added `QuestWorkspaceNav` to `/quests/[id]/tasks` with `active="tasks"`.
  - Kept the existing task editor route in place.
  - Did not create `/dashboard/quests/[id]/tasks`.
  - Did not refactor editor logic, task components, services, runtime, migrations, or JSONB architecture.
- Sprint 12.6 - Teacher Workspace Polish / Route Consistency.
  - Completed route consistency analysis.
  - Updated `Open / Edit quest` in `/dashboard/quests` to point to `/dashboard/quests/[id]/settings`.
  - Removed the duplicate `Settings` action from quest cards.
  - Preserved `/quests/[id]` and `/quests/[id]/tasks` as existing routes.
- Sprint 12.7 - Teacher Workspace Breadcrumbs / Page Title Analysis.
  - Decided not to add breadcrumbs now.
  - Decided not to create a shared workspace header now.
  - Kept current dashboard page titles as acceptable for MVP.
  - Left task editor title/text unchanged because it remains on `/quests/[id]/tasks`.
- Sprint 12.8 - Teacher Quest Analytics.
  - Completed teacher analytics analysis.
  - Added teacher-only content analytics summary to `/dashboard/quests`.
  - Shows Total quests, Public quests, Draft quests, Total tasks, and Total points.
  - Uses existing `quests` and `quest_tasks` data only.
  - Did not add student attempt analytics, routes, migrations, services, runtime persistence, or JSONB inspection.
- Sprint 12.9 - Attempt Persistence / Student Analytics Architecture.
  - Completed attempt persistence and student analytics analysis.
  - Documented future `quest_attempts` and `quest_attempt_answers` table shapes.
  - Decided Teacher Test Mode remains local-only for now.
  - Deferred migrations, services, routes, runtime persistence, and student analytics until auth/RLS/privacy design is clearer.
- Sprint 12.10 - Auth / RLS Boundaries Architecture.
  - Completed auth, roles, ownership, and RLS boundary analysis.
  - Confirmed active MVP roles should be teacher and student.
  - Deferred admin and school/organization roles.
  - Documented that `author_id` appears intended but is not actively used by current quest services/pages.
  - Documented future RLS boundaries for `quests`, `quest_tasks`, `quest_attempts`, and `quest_attempt_answers`.
  - Deferred persisted student attempts and private teacher analytics until auth, ownership, and RLS are designed.
- Sprint 12.11 - Supabase Schema / RLS Audit.
  - Completed a read-only live Supabase audit using the configured anon client.
  - Confirmed live `quests.author_id` exists, but all 3 visible quests have `author_id IS NULL`.
  - Confirmed live `quest_tasks` is anon-readable and has 10 visible rows.
  - Confirmed live `quest_tasks.content` does not exist, despite local migration/code/runtime expectations.
  - Confirmed anonymous reads can access `quests` and `quest_tasks`.
  - Deferred auth/ownership implementation until schema repair planning is complete.
- Sprint 12.12 - Schema Repair / Migration.
  - Planned the live/local schema repair.
  - Added `database/migrations/003_add_quest_task_content.sql`.
  - The migration was manually applied and verified in live Supabase.
  - Confirmed `public.quest_tasks.content` now exists and is readable as JSONB.
  - Existing legacy task rows may still have `content = null`.
- Task Type Creation Fix.
  - Added `single_choice` to the task creation flow in `components/tasks/TaskForm.tsx`.
  - Task creation now exposes only implemented MVP types: `text` and `single_choice`.
  - Manually verified single-choice creation, editor loading, option saving, correct answer saving, and refresh persistence.
- Sprint 12.13.1 - Documentation Sync.
  - Updated project documentation for schema repair and task type creation.
- Sprint 12.14 - Auth and Owner-Safe Teacher Access.
  - Added Supabase SSR session foundation.
  - Protected dashboard routes with authenticated sessions.
  - Scoped Teacher Quest Library reads to owned quests.
  - Added owner-safe quest creation and settings save.
  - Added owner-safe task CRUD through authenticated server routes.
- Sprint 12.15.2 - Remove Legacy Browser Quest Reads.
  - `/quests` now redirects to `/dashboard/quests`.
  - `/quests/[id]` now redirects to `/dashboard/quests/[id]/preview`.
  - Removed legacy browser-side quest and task table reads from active routes.
- Sprint 12.15.3 - Harden Quests and Quest Tasks RLS.
  - Added and applied `database/migrations/004_harden_quest_rls.sql`.
  - Removed broad public policies from `quests` and `quest_tasks`.
  - `quests` access is owner-scoped for authenticated teachers through `auth.uid()`.
  - `quest_tasks` ownership is derived through the parent quest.
  - Anonymous direct table access is denied.
  - No `quests` DELETE policy exists; quest deletion remains unavailable.
  - Read-only application smoke tests passed after live application.
- Sprint 12.15.4a - Owner-Safe Storage Upload Boundary.
  - Added authenticated owner-safe image upload route.
  - Removed direct browser Supabase Storage uploads from the task editor flow.
  - Added and live-applied `database/migrations/005_harden_quest_image_storage.sql`.
  - Preserved public read for existing task image URLs.
  - Removed public Storage INSERT, UPDATE, and DELETE policies.
  - Added authenticated owner-prefixed INSERT policy.
  - Enforced 5 MB bucket limit and JPEG/PNG/WebP MIME restrictions.
  - Added runtime task image rendering for text and single-choice tasks in Preview and Play/Test.
  - Preserved legacy `tasks/{uuid}` objects.
- Sprint 12.15.5a - Owner-Safe Task Image Removal.
  - Added authenticated owner-safe task image removal.
  - Browser sends no object path or image URL.
  - DELETE route verifies authenticated user, owned quest, and task relation.
  - Clears `image_url` before best-effort Storage deletion.
  - Added compare-and-clear protection for concurrent image replacement; conflicts return HTTP 409 and skip Storage deletion.
  - Added and live-applied `database/migrations/006_add_owner_quest_image_delete_policy.sql`.
  - Authenticated owner-prefixed Storage DELETE policy is active.
  - Public Storage DELETE remains disabled.
  - Live removal was verified in editor, Preview, and Play/Test.
  - Legacy `tasks/{uuid}` objects remain unchanged.
- Sprint 12.15.5b - Safe Image Replacement Cleanup.
  - Added a canonical server-only owner-scoped image URL parser.
  - Replacement cleanup reads the previous `image_url` server-side.
  - Saves the new `image_url` before old object cleanup is attempted.
  - Deletes the previous object only when it matches the authenticated user, quest, and task path.
  - Browser sends no previous URL or object path.
  - Cleanup failure is non-blocking.
  - Live replacement was verified in editor, Preview, and Play/Test.
  - The new owner-scoped object remained, the previous owner-scoped object was removed, and legacy `tasks/{uuid}` objects remained unchanged.
  - Concurrent replacements may still orphan an intermediate object.
- Sprint 12.15.5c - Task Delete Image Cleanup.
  - Task DELETE now returns the deleted row `id` and `image_url`.
  - Deletes the database row before best-effort Storage cleanup.
  - Uses only the deleted row's server-returned `image_url`.
  - Reuses the canonical server-only owner-scoped parser.
  - Deletes only owner-scoped paths matching authenticated user, quest, and task.
  - Browser sends no image URL or object path.
  - No migration or UI change was required.
  - Live verification confirmed a temporary task row and its owner-scoped Storage object were removed, legacy objects were unchanged, and the editor remained functional.
  - Upload-before-failed-PATCH races may still orphan an unattached object.
- Sprint 12.16.1 - Teacher Logout / Session UX Planning.
  - Audited current Supabase SSR auth/session behavior.
  - Recommended a POST-only server logout route, dashboard Sign out control, safe login feedback messages, and authenticated `/login` redirect.
- Sprint 12.16.2 - Teacher Logout / Session UX.
  - Added POST-only `/auth/logout` route using the Supabase SSR server client.
  - Successful logout redirects with HTTP 303 to `/login?logged_out=1`.
  - Failed logout redirects safely to `/login?error=logout_failed`.
  - Logout accepts no browser-controlled redirect destination.
  - Dashboard header shows teacher email and a plain HTML POST Sign out control.
  - Authenticated `/login` visits redirect to `/dashboard`.
  - Login feedback uses fixed allowlisted messages for logout/callback states.
  - Manual verification confirmed logout cleared the session, dashboard stayed protected after logout, Back plus hard refresh did not restore access, and magic-link login remained functional.
  - No migration or RLS change was required.
- Sprint 12.16.3 - Expired Session / API 401 UX Planning.
  - Audited protected teacher client workflows that call authenticated API routes.
  - Recommended a small client-only helper rather than a global fetch interceptor, token refresh framework, or mutation replay.
- Sprint 12.16.4 - Expired Session / API 401 UX.
  - Added a client-only helper for API `401` detection.
  - Uses fixed message `Your session has expired. Please sign in again.`
  - Redirects only to `/login?error=session_expired` with module-level redirect deduplication.
  - Task editor, quest settings, new quest form, and storage upload/remove flows detect `401` before generic error parsing.
  - Technical `Unauthorized.` messages are not shown for expired sessions, and no success state is applied after `401`.
  - Login feedback allowlist supports `error=session_expired`.
  - Protected API contracts, RLS, Supabase configuration, and migrations were unchanged.
  - Manual verification confirmed logout in another tab followed by a protected action redirects to the fixed session-expired login message and re-login still works.
- Sprint 12.17.1 - Quest Settings Metadata Planning.
  - Analyzed the smallest safe expansion of quest settings metadata for the teacher MVP.
  - Recommended deferring subject until `subject_id` lookup/table behavior is verified.
  - Recommended adding grade range and estimated duration first.
- Sprint 12.17.2 - Quest Grade Range and Duration Metadata.
  - Added and live-applied `database/migrations/007_add_quest_metadata.sql`.
  - Added nullable `grade_min`, `grade_max`, and `estimated_duration_minutes` to `quests`.
  - Added CHECK constraints for grades 1-11, paired grade values, ordered ranges, and duration 5-240 minutes.
  - Added Quest Settings controls for grade range and estimated duration.
  - Dashboard and Teacher Preview display metadata only when populated.
  - `subject_id` remained untouched, no `subject` text column was added, and owner-scoped RLS policies were unchanged.
  - Browser verification passed for `Grades 5-7`, `45 min`, `Grade 7`, metadata clearing, and existing quest compatibility.
- Sprint 12.17.3 - Quest Subject Lookup Planning.
  - Confirmed `quests.subject_id` is nullable UUID with a foreign key to `public.subjects.id`.
  - Confirmed `public.subjects` has usable seeded rows with `id`, `name`, optional `grade`, and `created_at`.
  - Confirmed no exact duplicate `name + grade` pairs were found and all 7 existing quests currently have `subject_id = null`.
  - Recommended reusing `subject_id` with a server-read subject lookup.
- Sprint 12.17.4 - Subjects Read Policy.
  - Added and live-applied `database/migrations/008_add_subjects_read_policy.sql`.
  - `public.subjects` RLS remains enabled.
  - Authenticated users have SELECT-only access to subjects.
  - No subject INSERT, UPDATE, or DELETE policies exist.
  - Subject row count remained unchanged.
  - Existing `quests` and `quest_tasks` policies were untouched.
  - No subject UI or quest CRUD changes were included.
- Sprint 12.17.5 - Teacher Quest Subject Selector.
  - Added `subject_id` to the active teacher quest DTO/selects and shared nullable quest type.
  - Added a server-only authenticated subject lookup selecting `id`, `name`, and `grade`, ordered by name, grade, and id.
  - Added an optional Subject selector to Quest Settings.
  - `No subject` saves `null`; omitted `subject_id` preserves the current value.
  - The owner-safe settings PATCH validates UUID shape and subject existence.
  - Teacher Library and Teacher Preview display resolved subject names when present.
  - Null or unresolved subjects show no placeholder, and the library uses one lookup with an in-memory map.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - No migration, RLS change, hardcoded UUID mapping, service role, subject administration, or taxonomy UI was added.
  - Browser verification passed for subject select/save/refresh, library display, preview display, subject clearing, display removal, and grade/duration regression coverage.
  - Logged-out PATCH was directly verified as `401`; invalid UUID, missing subject UUID, and foreign quest API cases were reviewed in code but not directly executed.
- Sprint 12.17.6 - Quest Language Metadata Planning.
  - Confirmed live Supabase had no language-like column on `public.quests`.
  - Confirmed no public language-related enum, table, or `quests` constraint existed.
  - Recommended nullable constrained text codes for quest content language.
- Sprint 12.17.7 - Quest Language Metadata.
  - Added and live-applied `database/migrations/009_add_quest_language_metadata.sql`.
  - Added nullable `quests.language_code` text constrained to `ru`, `kk`, and `en`.
  - Added shared language code/label helper with labels Russian, Kazakh, and English.
  - Added optional Language selector to Quest Settings.
  - `No language specified` clears to `null`; omitted `language_code` preserves the current value.
  - Invalid language values return safe `400`; owner-safe `404` and logged-out `401` remain unchanged.
  - Teacher Library and Teacher Preview display language only when populated and resolved.
  - Subject, grade range, and duration metadata remain unchanged.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - No default, backfill, index, RLS change, policy change, lookup table, enum, admin UI, filtering, or i18n framework was added.
  - Browser verification passed for Russian save/persistence, Library display, Preview display, changing to Kazakh, clearing language, display removal, and subject/grade/duration regression coverage.
- Sprint 12.17.8 - Quest Cover Image Planning.
  - Confirmed live schema had no existing quest cover field or related constraint.
  - Recommended reusing the public `quest-images` bucket with a path-only quest cover model.
  - Planned owner-safe cover upload, replacement, removal, Library thumbnail display, and Preview display.
- Sprint 12.17.9 - Quest Cover Image MVP.
  - Added and manually applied `database/migrations/010_add_quest_cover_image.sql`.
  - Added nullable `quests.cover_image_path` text with no default, backfill, index, or quest RLS change.
  - Persisted only bucket-relative Storage paths; public URLs are derived and not stored.
  - Added authenticated owner-prefixed cover INSERT and DELETE policies for `teachers/{userId}/quests/{questId}/cover/{uuid}.{ext}`.
  - Preserved public read, existing task-image policies, and the absence of a Storage UPDATE policy.
  - Server-generated paths derive extensions from validated JPEG/PNG/WebP MIME types and reject nested or malformed paths.
  - Added owner-safe cover upload, replacement cleanup, and removal through authenticated server routes.
  - Added `QuestCoverImageManager` to Quest Settings without submitting the regular settings form.
  - Teacher Library shows a 16:9 thumbnail or stable fallback; Teacher Preview shows a larger cover when present.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - Browser verification passed for upload, persistence, Settings preview, Library thumbnail, Preview display, replacement, removal, task image regression, and subject/grade/duration/language regression coverage.
- Sprint 12.17.10 - Quest Tags / Category Planning.
  - Approved one optional teacher-defined category per quest and multiple teacher-defined tags per quest.
  - Chose direct `public.quests` columns for the MVP instead of normalized taxonomy tables.
  - Deferred normalized `quest_categories`, `tags`, and `quest_tags` until marketplace, public catalog, multilingual taxonomy, or platform-defined taxonomy needs are clearer.
  - Deferred Quest Library filtering, NewQuestForm changes, Play/Test changes, indexes, RLS changes, and quest deletion.
- Sprint 12.17.11 - Quest Category / Tags Migration.
  - Prepared `database/migrations/011_add_quest_category_tags.sql`.
  - The migration adds nullable `quests.category` and `quests.tags text[] not null default '{}'`.
  - Added planned constraints for category length up to 40 characters and maximum 10 tags.
  - No backfill, index, RLS change, policy change, or application code change is included.
- Sprint 12.17.12 - Apply and Verify Quest Category / Tags Migration.
  - Manually applied `database/migrations/011_add_quest_category_tags.sql` to live Supabase after product-owner approval.
  - Verified `quests.category` exists as nullable `text` with default `null`.
  - Verified `quests.tags` exists as `text[] not null` with default `'{}'::text[]`.
  - Verified `quests_category_length_check` and `quests_tags_count_check`.
  - Confirmed all 7 existing quests remained present and compatible, with null categories and empty tag arrays.
  - Confirmed `public.quests` RLS and owner-scoped policies were unchanged, and no DELETE policy exists.
  - No application code, index, RLS policy, or unrelated schema change was included.
- Sprint 12.17.13 - Quest Category / Tags Settings Integration.
  - Added `category: string | null` and `tags: string[]` to quest types.
  - Owner-scoped quest reads include category and tags.
  - Added owner-safe PATCH support and Quest Settings controls for category and comma-separated tags.
  - Omitted fields preserve existing values; empty category clears to `null`; empty tags array clears all tags.
  - Server-side normalization trims and collapses whitespace, removes empty tags, deduplicates tags case-insensitively, and preserves first-occurrence casing.
  - Server-side validation enforces category max 40, max 10 tags, max 24 characters per tag, and rejects control characters with safe `400` responses before update.
  - Defensive Settings form handling prevents stale null or undefined tags from crashing the form.
  - Manual authenticated browser verification passed, including save, refresh persistence, normalization, validation, clearing, and restoration to `category = null` and `tags = []`.
  - No Quest Library filtering/display, NewQuestForm controls, Preview display, Play/Test changes, migration changes, RLS/policy changes, indexes, or quest deletion were included.
- Sprint 12.17.14 - Quest Category / Tags Library Display and Filtering.
  - Kept `/dashboard/quests` as a Server Component and added Next.js 16 async `searchParams`.
  - Supported URL parameters are `category` and `tag`.
  - Owned quests are fetched once through `getOwnedQuests()`.
  - Filter values are derived only from the authenticated teacher's owned quests.
  - Filtering is performed in memory for the current MVP scale.
  - Category and tag filters combine with AND semantics.
  - Missing or empty parameters mean no filter; only the first query value is used when an array is supplied.
  - Unknown values produce a safe filtered-empty state.
  - Category and tag matching is whitespace-normalized and case-insensitive, while stored display casing is preserved.
  - Filter options are deduplicated case-insensitively and sorted.
  - Quest cards display category and tag chips only when populated.
  - Native GET controls support shareable URLs, refresh persistence, and browser back/forward behavior.
  - Clear filters returns to `/dashboard/quests`.
  - Defensive handling prevents malformed legacy category/tags values from crashing the page.
  - Manual browser verification passed for full owned list display, category chips, tag chips/wrapping, category-only filtering, tag-only filtering, combined AND filtering, clear filters, refresh persistence, browser back/forward, unknown filter empty state, and existing card metadata/actions.
  - No Preview category/tag display, NewQuestForm controls, Play/Test changes, quest deletion, public catalog/student discovery, migration, RLS/policy change, index, or normalized taxonomy was included.
- Sprint 12.17.15 - Quest Category / Tags Preview Display.
  - Added category and tags to the existing Teacher Preview metadata chip row.
  - Display order is subject, language, grade, duration, category, then tags.
  - No additional service query, type, API, schema, or RLS work was required.
  - Category is defensively normalized for display and omitted when invalid or empty.
  - Tags are defensively handled at runtime, limited to valid string entries, whitespace-normalized, and empty entries are removed.
  - Stored display casing is preserved and all valid tags are displayed.
  - Tag keys are index-qualified to avoid duplicate React key collisions with malformed legacy arrays.
  - Styling matches the Teacher Quest Library.
  - Manual browser verification passed for category chip display, tag chip display/wrapping, metadata order, empty metadata behavior, existing Preview content, read-only behavior, unchanged owner-safe route behavior, and duplicate legacy tag key safety.
  - No editing in Preview, filtering in Preview, NewQuestForm changes, Play/Test changes, quest deletion, public catalog/student discovery, migration, live Supabase write, RLS/policy change, index, or normalized taxonomy was included.
  - Metadata chip logic remains local to Library and Preview.
- Sprint 12.18.2 - New Quest Draft Creation UX.
  - Made quest creation the first step of a two-step workflow.
  - `NewQuestForm` now creates a minimal draft shell and explains that metadata, cover image, tasks, and publication are completed after creation in Settings.
  - The form submits only title, description, and difficulty.
  - Publication state/control was removed from the creation form.
  - The create API ignores client-provided `is_public` and always inserts `is_public: false`.
  - `author_id` still comes only from the authenticated server session.
  - Existing title, description, difficulty, validation, loading, error, response, and redirect behavior remain intact.
  - Manual authenticated browser verification passed with test quest `DRAFT CREATION TEST 12.18.2` (`0a6d4d54-37ca-4274-aea4-3e127c3a593d`).
  - Verified redirect to `/dashboard/quests/0a6d4d54-37ca-4274-aea4-3e127c3a593d/settings`, Settings load, Draft status, empty category/tags, no cover, no tasks, and Teacher Quest Library Draft display.
  - Exactly one test quest was created and no other quest data was intentionally changed.
  - No subject, language, grade, duration, category, tags, cover, Settings, Library, Preview, Play/Test, quest deletion, migration, RLS/policy, index, public catalog, student-facing, direct SQL, or direct API shortcut change was included.
- Sprint 12.18.4 - New Quest Creation UX Polish.
  - Added compact `Шаг 1 из 2` framing to `NewQuestForm`.
  - Localized the draft-workflow explanation to Russian.
  - Changed submit copy to `Создать черновик` and loading copy to `Создание черновика...`.
  - Added a secondary `Вернуться к библиотеке` link to `/dashboard/quests`.
  - Preserved the title, description, and difficulty-only POST payload.
  - Preserved the redirect to `/dashboard/quests/[id]/settings`.
  - Draft-only server enforcement remains unchanged and no publication control exists.
  - Manual visual browser verification passed on authenticated `/quests/new` without creating a new quest.
  - No create API, route move, metadata expansion, Settings, Library, Preview, Play/Test, quest deletion, migration, live Supabase write, RLS/policy, index, public catalog, or student-facing change was included.
- Sprint 12.18.6 - Quest Creation Step 2 Settings UX.
  - `NewQuestForm` redirects successful creation to `/dashboard/quests/[id]/settings?created=1`.
  - Quest Settings accepts Next.js 16 async `searchParams`.
  - `created` supports `string | string[] | undefined`; arrays use the first value and only exact `created=1` enables onboarding.
  - Step 2 onboarding is server-rendered and non-persistent.
  - Onboarding appears only for post-create query visits; direct Settings visits remain unchanged.
  - `getOwnedQuest(id)` remains the owner-safe access gate, and onboarding does not affect authorization or data loading.
  - The task link points to `/quests/[id]/tasks`.
  - Publication behavior remains unchanged, and no client state or dismiss behavior was added.
  - Browser verification passed with and without the query parameter, and no data was modified.
  - No create API, schema/migration, RLS/policy, index, `QuestSettingsForm`, `QuestCoverImageManager`, task route/editor, publication gating, deletion, public catalog, or student-facing change was included.
- Sprint 12.18.8 - Enforce Task Required Before Publication.
  - Publication now requires at least one task only during a Draft-to-Public transition.
  - Current `is_public` is loaded through the existing owner-safe quest lookup.
  - Task count is queried only after authenticated ownership verification using `quest_tasks` exact count with `head: true`; client-provided task counts are never trusted.
  - Zero or null task count returns HTTP 400 with `Добавьте хотя бы одно задание перед публикацией.`, and the quest update is not executed.
  - Task-count query failure uses the existing safe HTTP 500 response and does not expose Supabase internals.
  - Direct API requests cannot bypass the rule, and `QuestSettingsForm` already displayed the API error without changes.
  - Manual browser verification passed; the tested quest remained Draft after refresh, and no other quest fields, task, cover, metadata, or publication data changed.
  - Draft remaining draft, public remaining public, editing already-public quests, and unpublishing do not trigger the task count.
  - Legacy public zero-task quests are not modified automatically, and Preview/Play/Test zero-task handling remains unchanged.
  - Deferred limitations: deleting the last task from a public quest may still leave it public with zero tasks; the count and publication update are not transactional; full readiness checklist is deferred; subject, language, grade, duration, category, tags, description, and cover are not publication requirements yet.
  - No migration, schema, RLS/policy, index, `QuestSettingsForm`, Preview, Play/Test, task deletion, public catalog, or student-facing change was included.
- Sprint 12.18.10 - Block Last Public Task Deletion.
  - Deleting the last task from a Public quest is blocked.
  - Teachers must explicitly unpublish before deleting the final task; automatic unpublishing is not performed.
  - The owner-safe task route quest lookup now includes `is_public`.
  - Draft quests skip the new readiness check.
  - Public quests verify the target task before counting sibling tasks, with the target task lookup scoped by task id and quest id.
  - Task count runs only after authentication, ownership, and target-task verification using `quest_tasks` exact count with `head: true`; client-provided task counts are not trusted.
  - Public quests with more than one task can still delete a task; Public quests with one or fewer tasks return HTTP 400 with `Сначала снимите квест с публикации, затем удалите последнее задание.`
  - Blocked deletion performs no task deletion or Storage cleanup.
  - Task-count failure returns the existing safe HTTP 500 response.
  - Successful deletion response and Storage cleanup remain unchanged.
  - `QuestTasksClient` already displays API errors and required no change.
  - Manual browser verification passed; the task and Public state remained unchanged after refresh, no Storage cleanup occurred, and no other task or quest data changed.
  - Draft task deletion, Public multi-task deletion, generic 404, unauthenticated behavior, legacy Public zero-task quests, Preview, and Play/Test remain unchanged.
  - Deferred limitations: count and deletion are non-transactional; concurrent deletion requests on a Public quest with multiple tasks could still race; a future transaction/RPC may provide stronger enforcement; no second confirmation or publication-aware delete UI was added.
  - No automatic unpublishing, transaction/RPC, migration, schema, RLS/policy, index, `QuestTasksClient`, Settings, Preview, Play/Test, public catalog, student-facing, or quest deletion change was included.
- Sprint 12.18.12 - Publication Readiness Settings UX.
  - Settings now loads an owner-safe exact task count server-side.
  - `getOwnedQuestTaskCount(questId)` validates UUID shape and authentication, verifies ownership with quest id plus authenticated `author_id`, returns `null` for missing, foreign, unauthenticated, or invalid requests, and counts only after ownership verification.
  - Task count uses `quest_tasks` exact count with `head: true` and remains separate from the quest DTO.
  - Settings passes `taskCount` to `QuestSettingsForm`.
  - Readiness messaging appears near the publication control for Draft zero-task, ready, and legacy Public zero-task states.
  - Exact UX copy includes `Для публикации нужно хотя бы одно задание.`, `Добавьте задание, затем вернитесь в настройки и включите публикацию.`, `Заданий: {taskCount}`, `Квест можно опубликовать.`, `Квест опубликован, но в нем нет заданий. Снимите публикацию или добавьте задание.`, and `Перейти к заданиям`.
  - The task link points to `/quests/[id]/tasks`.
  - The publication checkbox remains enabled, and the server API remains the publication source of truth.
  - Server-rendered count may be stale until refresh; no polling or client-side task-count fetch exists.
  - Manual browser verification passed for Draft zero-task, Draft with tasks, and Public with tasks, and no data was modified.
  - Publication API enforcement, direct API protection, legacy Public zero-task unpublishing, unrelated Settings saves, error/success display, `created=1` onboarding, owner-safe `notFound`, task CRUD, Preview, and Play/Test remain unchanged.
  - No migration, schema, RLS/policy, index, polling, client-side task-count request, readiness metadata checklist, task CRUD refactor, publication API change, public catalog, or student-facing change was included.
- Sprint 12.18.14 - Dashboard Quest Create and Tasks Route Consolidation.
  - Canonical teacher routes are now Library `/dashboard/quests`, Create `/dashboard/quests/new`, Settings `/dashboard/quests/[id]/settings`, Tasks `/dashboard/quests/[id]/tasks`, Preview `/dashboard/quests/[id]/preview`, and Play/Test `/dashboard/quests/[id]/play`.
  - Legacy redirects are `/quests/new` -> `/dashboard/quests/new`, `/quests/[id]/tasks` -> `/dashboard/quests/[id]/tasks`, `/quests` -> `/dashboard/quests`, and `/quests/[id]` -> `/dashboard/quests/[id]/preview`.
  - Canonical dashboard Create and Tasks pages own the actual authenticated/owner-safe implementations; legacy Create and Tasks pages are minimal server-side redirects.
  - All internal teacher Create and Tasks links use canonical dashboard routes.
  - `QuestWorkspaceNav` ordering, labels, and active behavior remain unchanged.
  - The post-create Settings redirect remains `/dashboard/quests/[id]/settings?created=1`.
  - `NewQuestForm` and `QuestTasksClient` received only minimal dashboard-layout fit adjustments.
  - Task CRUD, validation, payloads, errors, loading, scrolling behavior, publication behavior, dashboard layout guard, and owner-safe route loading remain intact.
  - Manual browser verification passed for canonical route loading, legacy redirects, no redirect loops, dashboard task-editor layout/scrolling, internal links staying within `/dashboard/quests`, and no data changes.
  - Remaining intentional legacy occurrences are redirect pages, historical documentation references, and `/api/teacher/quests` API routes.
  - No API, schema/migration, RLS/policy, index, task CRUD refactor, Preview or Play/Test behavior change, publication behavior change, public catalog/student-facing implementation, broad visual redesign, or broad localization change was included.
- Sprint 12.18.16 - Teacher Workflow Primary Copy Localization.
  - Completed phase 1 of Russian-first teacher MVP localization without adding an i18n framework or shared copy constants.
  - Navigation labels are `К библиотеке`, `Настройки`, `Задания`, `Предпросмотр`, and `Тестирование`.
  - Status labels are `Черновик` and `Опубликован`.
  - Library high-visibility copy is Russian across heading/supporting text, create actions, summaries, filters, clear filters, empty/no-results states, status badges, task-count labels, fallbacks, and card actions.
  - Settings route-level copy uses `Настройки квеста`; Step 2 onboarding is preserved.
  - Preview and Play/Test route-level copy is Russian; Play/Test is labeled `Тестирование`.
  - Generic task terminology uses `задание`/`задания`, while `вопрос` remains reserved for question prompts or single-choice semantics.
  - Routes, navigation destinations/active states, filtering, sorting, category/tags, task counts, covers, links, Settings owner-safe loading, `created=1`, Preview rendering, QuestRunner/runtime, task CRUD, publication behavior, and API error contracts remain unchanged.
  - Manual browser verification passed for Library, Settings with and without `created=1`, Tasks without mojibake, Preview, and `Тестирование`; no data changed.
  - Deferred localization scope includes Settings form internals, cover manager, task manager/editor children, media uploader, runtime copy, and client fallback/server API error consistency.

- Sprint 12.18.18 - Settings and Cover Manager Copy Localization.
  - Localized `QuestSettingsForm` teacher-visible copy: labels, select placeholders, subject/grade display formatting, language labels, helper text, category/tag guidance, grade/duration guidance, local validation messages, save/loading labels, success text, client-only fallback errors, and publication state labels.
  - Approved Settings terminology includes `Название квеста`, `Описание`, `Предмет`, `Предмет не указан`, `Язык`, `Язык не указан`, `Категория`, `Теги`, `Сложность`, `Класс от`, `Класс до`, `Не указано`, `Примерная длительность, мин.`, `Статус публикации`, `Черновик`, `Опубликован`, `Сохранение...`, and `Сохранить настройки`.
  - Subject/grade display formatting uses `Все классы`, `N класс`, and `N-M классы`; stored values, option keys, field names, and payloads remain unchanged.
  - Generic readiness copy now uses `хотя бы одно задание`; `вопрос` remains reserved for actual question-prompt semantics.
  - Localized `QuestCoverImageManager` teacher-visible copy: `Обложка`, Russian optional 16:9 guidance, `Загрузить обложку`, `Заменить обложку`, `Удалить обложку`, `Обложка не загружена`, `Обложка квеста`, loading/success states, client-only fallback errors, and accessibility labels.
  - Protected boundaries remain unchanged: server API response shapes, HTTP status handling, server error contracts, `SESSION_EXPIRED_MESSAGE`, Supabase/internal technical errors, Storage service passthrough errors, and returned `result.error` display behavior.
  - Routes, owner-safe loading, field names, payload shapes, validation limits, category/tag behavior, stored public/draft values, publication behavior, cover upload/remove/replace APIs, file input, accepted file types, schema, migrations, RLS, policies, and indexes remain unchanged.
  - Manual browser verification passed for Settings labels/helpers, control usability, status labels, readiness terminology, local invalid-input validation, cover manager copy, no mojibake, and desktop layout.
  - No save or cover write was performed during verification, and no live data changed.
  - Deferred localization scope includes `QuestTasksClient`, task form/card/editor children, `ImageUploader`, runtime components, broader client/server error consistency, and student/runtime copy outside the teacher-only workflow.

- Sprint 12.18.20 - Task Editor Copy Localization.
  - Localized teacher task-editor copy in `QuestTasksClient`, `TaskForm`, `TaskCard`, `TextTaskEditor`, `SingleChoiceTaskEditor`, and `ImageUploader`.
  - Task type display mapping is `text` -> `Текстовое задание` and `single_choice` -> `Выбор одного ответа`; unknown future task types fall back to the raw identifier.
  - Stored task type values, TypeScript unions, registry keys, payloads, API contracts, routes, endpoints, CRUD behavior, autosave, `TaskTypeRegistry` behavior, owner safety, publication safety, last-public-task deletion protection, image behavior, runtime/student copy, schema, migrations, RLS, policies, and indexes remain unchanged.
  - `QuestTasksClient` localized shell actions, refresh action, client-only fallback errors, success alerts, browser confirms, and image fallback messages while preserving server API JSON error contracts, HTTP status handling, `SESSION_EXPIRED_MESSAGE`, Supabase/internal technical errors, Storage passthrough errors, and returned `result.error` behavior.
  - `TaskForm` now has a visible `Тип задания` label; submitted task type values remain `text` and `single_choice`.
  - `TaskCard`, `TextTaskEditor`, `SingleChoiceTaskEditor`, and `ImageUploader` now use Russian teacher-visible copy and accessibility labels while preserving handlers, layout, option structure, payloads, validation, and upload/remove mechanics.
  - Correct-answer radio selection now preserves the existing checked/onChange logic and adds `value={option.id}` plus `onClick={() => setCorrectOptionId(option.id)}`; both handlers set the same option id, no double-toggle risk was found, and existing saved tasks using `{ options: { id: string; text: string }[], correctOptionId: string }` remain compatible.
  - Browser verification confirmed correct-answer selection works, validation disappears, Save becomes enabled, and Preview reflects the selected answer; Save was not clicked and no live write occurred.
  - Points bug diagnosis: `TextTaskEditor` and `SingleChoiceTaskEditor` previously rendered Points as `value={task.points}` with `readOnly`, had no local editable points state, and the update callback/PATCH flow did not persist points. The bug existed before Sprint 12.18.20 and was not caused by localization.
  - Editable Points support now uses local string state initialized from `String(task.points)`, editable number inputs with `type="number"`, `min={1}`, and `step={1}`, temporary empty values while typing, and no forced fallback to `1`.
  - Points validation requires a non-empty finite integer at least `1`; decimals are rejected with `Баллы должны быть целым числом не меньше 1.`
  - Editor saves now pass numeric `points`; `TaskEditor` callback typing was minimally extended; `QuestTasksClient` includes `points` in the existing PATCH body while preserving title, description, and content behavior.
  - The task PATCH route supports optional `points`; validation runs only when supplied, invalid values return HTTP 400 in the existing route style, `points` is added to the update object only when supplied, and older requests omitting `points` remain compatible.
  - No migration or live-data repair was required.
  - `TaskList.tsx` was inspected and required no code changes.
  - Manual browser verification passed on the canonical dashboard task route for Text and Single Choice localization, visible task type label, hidden raw identifiers for known task types, correct-answer radio selection, validation disappearance, Save enablement, Preview synchronization, and editable Points no-write behavior.
  - Text and Single Choice Points can be changed locally, empty intermediate values remain empty, decimals and zero are rejected, valid positive integers are accepted, Save state updates correctly, and changing Single Choice Points does not reset the selected correct answer.
  - Save was not clicked; no PATCH write occurred; no live write occurred; no task, image, or live data was created, edited, deleted, uploaded, removed, or saved.
  - Deferred scope includes runtime/student-facing localization, broader client/server error consistency, i18n/shared constants, and task CRUD/autosave refactors.

- Sprint 12.18.21 - Controlled Task Editor Write Verification.
  - Manual authenticated browser write verification passed through normal owner-safe teacher UI/API flows.
  - Text task `TEMP - Points persistence text` was created, edited to points `7`, saved, refreshed/reloaded, and verified: points `7` persisted, text/content persisted, internal type remained `text`, and visible type remained `Текстовое задание`.
  - Single Choice task `TEMP - Points persistence single choice` was created with options `Alpha` and `Beta`, `Beta` was selected as the correct answer, points were set to `9`, saved, refreshed/reloaded, and verified: points `9` persisted, options persisted, `correctOptionId` persisted, and Preview reflected the persisted correct answer.
  - Cleanup passed: both temporary tasks were deleted, no temporary task rows remain, no image was uploaded, no orphaned Storage object exists, no new quest was created, no Public quest was modified, no last-public-task deletion test occurred, and original quest/tasks were otherwise unchanged.
  - Optional `points` PATCH support is now browser-write verified.
  - Non-blocking UX issues recorded: `TaskForm` Points input has an aria-label but no visible `Баллы` label; `TaskCard` pencil button is visible but does not independently open the editor.

- Sprint 12.18.24 - Task Creation and Card Action UX Implementation.
  - Added a visible semantic `Баллы` label to `TaskForm`, associated with the Points input by `htmlFor="task-points"` and `id="task-points"`, while preserving existing aria-label and submitted points behavior.
  - Enabled the `TaskCard` pencil button, added `type="button"`, and wired it through a typed `onSelect` callback to the existing task selection/edit behavior.
  - `TaskList` passes `onSelectTask(task)` into `TaskCard`; card click remains unchanged, and pencil click calls `event.stopPropagation()` to avoid duplicate card selection.
  - Manual browser verification passed for label visibility, pencil edit action, card click selection, delete confirmation/deletion flow, and no reported console or layout issue.
  - One test task was accidentally deleted during verification. All current quest/task data is test data, no production data was affected, no restoration is required, and continued development is unaffected.
  - Historical non-blocking considerations at the end of Sprint 12.18.24: the static `task-points` id was safe for the current single `TaskForm` instance but would need unique ids if multiple forms render together; delete-button bubbling to the card wrapper was pre-existing then and was superseded by Sprint 12.18.26.

- Sprint 12.18.26 - Task Action Event Isolation Implementation.
  - Updated only `components/tasks/TaskCard.tsx`.
  - The delete button now has `type="button"` and calls `event.stopPropagation()` before `onDelete(task.id)`, preserving the existing delete flow exactly once.
  - Delete clicks no longer select/open the parent task card; icon, styling, Russian aria-label, confirmation flow, deletion behavior, and keyboard accessibility remain unchanged.
  - `TaskList`, `QuestTasksClient`, owner-safe DELETE API behavior, confirmation text, last-Public-task deletion guard, error handling, list refresh, and `syncSelectedTask` fallback remain unchanged.
  - Manual browser verification passed without confirming deletion: confirmation appeared, Cancel preserved the previous selection, the unselected task did not open or become selected, pencil/card clicks remained unchanged, and no console or UI issue was reported.
  - Static `task-points` remains acceptable for the current single `TaskForm`; future unique-id work remains deferred until multiple simultaneous forms exist.

- Sprint 12.18.28 - Teacher Task Workspace Responsive Layout and Labels.
  - Updated only `components/tasks/QuestTasksClient.tsx` and `components/tasks/TaskForm.tsx`.
  - `QuestTasksClient` now uses `grid-cols-1 xl:grid-cols-12`, with the task list at `xl:col-span-4` and the editor at `xl:col-span-8`; narrow screens stack list above editor, while large screens retain the two-column layout.
  - No sticky/fixed positioning or state-flow changes were introduced; task selection, deletion, loading, editor rendering, and existing workspace behavior remain unchanged.
  - `TaskForm` now has visible semantic labels for `Название задания`, `Описание`, `Правильный ответ`, and `Подсказка`, while preserving existing `Тип задания` and `Баллы` labels.
  - Labels use matching `htmlFor`/`id` associations for `task-title`, `task-description`, `task-answer`, `task-hint`, `task-type`, and `task-points`; placeholders, values, handlers, validation, alert behavior, loading behavior, payload, and default points remain unchanged.
  - Accessibility verification passed: labels remain visible while typing, labels focus their associated controls, no duplicate ids exist in the current single-form rendering, and static ids remain acceptable until multiple simultaneous forms exist.
  - Manual responsive browser verification passed without creating or saving a task: wide screens kept list/editor side by side, narrow screens stacked list above editor, no horizontal scrolling or clipped controls appeared, all six visible labels appeared, and label associations worked.
  - Recent fixes remained unchanged: pencil button, delete event isolation, card selection, selected styling, points editing/persistence, correct-answer persistence, editor save behavior, image controls, Preview, localized copy, and last-Public-task guard.
  - Unchanged scope: no route/API changes, schema/migration/RLS/policy/index changes, task content/type changes, create/save/autosave changes, Storage changes, runtime/student changes, publication safety changes, or deletion-guard changes.

Next:

- Sprint 12.18.29 - Teacher Task Workspace Remaining UX Prioritization.
  - Reassess remaining P2 findings.
  - Review clickable task-card semantic keyboard behavior, selected-card state beyond color alone, unsaved-change indication, required-field clarity, and inline validation.
  - Prioritize only launch-relevant improvements and avoid redesigning stable workspace behavior.
  - Planning only until architecture approval.

- Sprint 12.18.30 - Task Creation Failure State Preservation.
  - Fixed the create-form data-loss path where `TaskForm` reset after `onSave` resolved although `QuestTasksClient` had handled a failed create internally.
  - The callback contract is now `Promise<boolean>` with the existing create endpoint and payload unchanged.
  - `handleCreateTask` returns `false` for busy, session-expired, non-OK, malformed-response, and caught network/error paths, and returns `true` only after a valid created task is added to state and selected.
  - `TaskForm` resets only on `true`; failed creation preserves title, description, correct answer, hint, task type, and points.
  - Manual Offline browser verification passed: all TaskForm fields were filled with test values, Chrome DevTools Network mode was set to Offline, and Add task was clicked. The request did not reach the server, `Не удалось создать задание.` displayed, no task or live write occurred, all entered fields remained, Network mode was restored, and creation was not retried.
  - Successful reset, error display, loading, responsive layout, labels, task-card actions, points/correct-answer persistence, image controls, Preview, and the last-Public-task guard remain unchanged.
  - No route/API, schema/migration/RLS/policy/index, task content/type, editor save/autosave, Storage, runtime/student, publication safety, or deletion-guard change was included.

Next:

- Sprint 12.18.31 - Task Creation Success Regression Verification.
  - Planning phase:
    - Required explicit architecture approval and live-write authorization.
    - Defined an owned disposable Draft target, successful form-reset and selection checks, type/points persistence checks, and exact cleanup.
    - Excluded Public quests and live writes before approval.
  - Verification completed:
    - Controlled verification used owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`), which remained Draft.
    - One `TEMP - Sprint 12.18.31 Create Success DELETE ME` task was created with description `Disposable verification of successful task creation and form reset.`, correct answer `S31-CORRECT`, hint `S31-HINT`, `single_choice`, and points `7`.
    - Add task was clicked once without an error; the task appeared once, became selected, opened in the editor, retained `single_choice` / `Выбор одного ответа`, and retained points `7`.
    - TaskForm reset after success: title, description, correct answer, and hint cleared; type returned to `text`; points returned to `1`; button/loading returned to normal.
    - The Single Choice editor showed expected `Добавьте минимум два варианта ответа.` and `Выберите один правильный ответ.` validation because no options were added; no editor save was performed.
    - Cleanup rechecked the unique task's type and points, confirmed the native dialog once, deleted only the temporary task, restored the baseline empty list, produced no unexpected error, left no residue, and preserved Draft status.
    - Create endpoint/payload, `Promise<boolean>` failure preservation, workspace layout, labels, card actions, points/correct-answer persistence, image controls, Preview, and last-Public-task guard remain unchanged.

Next:

- Sprint 12.18.32 - Task Creation Validation and UX Review Planning.
  - Planning only. Review task-creation client validation beyond title, points number/range handling, task-type-specific creation requirements, accessibility and error-message clarity, and the smallest safe improvement.
  - Browser-observed task-creation Points finding at the time: clearing the numeric input caused `0` to appear, so the field could not remain temporarily empty and keyboard replacement required selecting the current value or using the stepper. This was implemented in Sprint 12.18.33.
  - Determine temporary empty-state handling, whether `0` is rejected, positive-integer validation, default-value policy, and the smallest safe keyboard-editing improvement before implementation.
  - No implementation or live write without explicit approval.

Next:

- Sprint 12.18.33 - TaskForm Points Validation.
  - Fixed the task-creation Points root cause where numeric state and `Number(e.target.value)` turned empty input into `0`.
  - TaskForm now uses raw string state with initial/success-reset `"1"`, allows temporary empty input, validates digit-only safe integers at least `1`, and converts to a number only for the existing payload.
  - Exact inline error: `Баллы должны быть целым числом не меньше 1.` Invalid submit does not call `onSave`; failed API creation preserves the raw value.
  - POST and PATCH now both require a JSON finite safe integer at least `1`; numeric strings and invalid JSON values are rejected, while omitted PATCH points remain unchanged.
  - No-write browser verification passed: clearing did not create `0`, replacement typing worked without Ctrl+A, empty/zero submit displayed the error without a create request or reset, `7` cleared the error, and `7` could be replaced with `12` by normal typing. No successful create, task creation, data change, or cleanup occurred.
  - Existing create callback behavior, reset/failure preservation, title alert, optional fields, task types, layout, selection, editor, images, Preview, publication, and deletion guards remain unchanged.

Next:

- Sprint 12.18.34 - Points Validation Controlled Write Verification.
  - Planning phase: selected an owned disposable Draft target, defined one temporary task, points persistence and successful-reset checks, valid PATCH verification, invalid-value protection, and exact cleanup before live-write approval.
  - Controlled live verification used owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`) with an empty baseline.
  - The only temporary task was `TEMP - Sprint 12.18.34 Points Verification DELETE ME`, with the approved description, `S34-CORRECT`, `S34-HINT`, `text`, create points `7`, and PATCH points `12`.
  - With No throttling and request blocking disabled, one successful create selected/opened the task, persisted visible points `7`, reset TaskForm points to `1` and other fields, and returned loading to normal.
  - One points-only PATCH changed `7` to `12`; refresh or reopening confirmed persistence and no unrelated changes.
  - Cleanup confirmed the unique task and points `12`, accepted native delete confirmation once, deleted only that task, restored the empty baseline, preserved Draft status, and left no error or residue.
  - Follow-up: both task editors use `Number.isInteger`, so unsafe integers can reach PATCH; PATCH rejects them safely with its finite safe-integer rule. No unsafe-integer browser write test occurred.

Next:

- Sprint 12.18.35 - Editor Points Safe-Integer Validation Planning.
  - Planning only. Inspect both editor points parsers and align them with TaskForm and PATCH: digit-only safe integers at least `1`, temporary empty editing, preserved unsaved invalid input on failed save, and accessible inline errors.
  - Identify the smallest safe file scope and avoid duplicated validation where practical.
  - No implementation or live write without explicit approval.

Next:

- Sprint 12.18.36 - Shared Editor Points Validation.
  - Added `lib/task-points.ts` with `parsePositiveSafeInteger(value: string): number | null` and the shared message `Баллы должны быть целым числом не меньше 1.`. Digit-only positive safe integers are accepted; empty, whitespace, signs, decimals, exponent notation, zero, unsafe integers, and overflow are rejected.
  - TaskForm, TextTaskEditor, and SingleChoiceTaskEditor now use the same parser/message while retaining raw string state, temporary empty editing, existing create/save behavior, and numeric payload points.
  - Both editors retain their existing validation summaries, disable Save while invalid, and now expose conditional `aria-invalid`/`aria-describedby` linked to one visible points error.
  - Browser verification checked empty, `0`, decimal, and `9007199254740992` first; they remained invalid, and the unsafe integer was not stored. A valid `12` cleared the error, was saved through a successful PATCH, and remained `12` after refresh with no unrelated field changes. No cleanup was required for the existing test task.
  - Task type is chosen only at creation; the stored type selects the editor and cannot be changed there. To use another type, the teacher must create a new task with the desired type and may manually delete the old task if no longer needed. No automatic conversion exists; future conversion requires explicit field-mapping and data-loss rules.
  - POST/PATCH contracts, `Promise<boolean>`, failure preservation/reset, editor fields, options, correct-answer behavior, images, selection, responsive layout, Preview, publication guards, and deletion guards remain unchanged.

Next:

- Sprint 12.18.37 - Task Type Conversion and Editor UX Review Planning.
  - Planning only. Review whether existing task type changes should be supported; compare delete-and-recreate with controlled conversion; identify compatible/incompatible fields, data-loss warnings, task ownership and ordering, API/database implications, and whether conversion belongs in MVP.
  - No implementation or live write without explicit approval.

Next:

- Sprint 12.18.38 - Immutable Task Type Helper Text.
  - Added the exact helper below the read-only task-type field in both editors: `Тип задания выбирается при создании и не меняется после сохранения.` and `Чтобы использовать другой тип, создайте новое задание и при необходимости удалите прежнее.`
  - Type remains immutable; no select, type state, conversion, or duplication action was added. Labels use stable editor-specific IDs, and visible secondary helper text wraps naturally without interactive semantics.
  - No-write visual verification on wide and narrow layouts confirmed exact copy, non-editable fields, no clipping or horizontal scrolling, stable editor width, and usable Save/other controls. No save, PATCH, live-data action, or cleanup occurred.
  - Stored `task_type` still selects the editor. Another type requires a new task and optional manual deletion of the old task; automatic conversion is deferred pending field mapping, data-loss rules, API design, and regression coverage.
  - Points validation, editor fields/options/correct answers, images, save/loading/errors, selection, TaskForm, registry, API/schema/RLS/Storage, Preview, publication, and deletion guards remain unchanged.

Next:

- Sprint 12.18.39 - Task Workspace Accessibility and Status Messaging Planning.
  - Planning only. Review task-editor success and error feedback, workspace error association and focus behavior, disabled-button explanations, keyboard navigation through task cards/editor actions, selected-card accessibility beyond color, and the smallest safe improvement.
  - No implementation or live write without explicit approval.

Next:

- Sprint 12.18.40 - Workspace Status Messaging.
  - Updated only `QuestTasksClient`: visible errors use `role="alert"` with `aria-live="assertive"`; one conditional visible `statusMessage` region uses `role="status"` with `aria-live="polite"`, without timeout or focus movement.
  - Exact success messages: `Задание создано.`, `Изменения сохранены.`, `Задание удалено.`, `Изображение загружено.`, and `Изображение удалено.` Stale status clears at create/save/delete/upload/removal/refresh start, and success is assigned only after local state updates succeed. Save/upload native success alerts were removed.
  - The read-only technical route check used only GET and returned the expected protected-route HTTP `307` redirect to `/login` without an authenticated browser session. It made no POST, PATCH, DELETE, image upload, or image-removal request and caused no live-data change; static roles/lifecycle plus lint, build, and diff checks passed. Manual no-write browser verification confirmed no initial or empty status area, stable narrow layout, usable controls, immutable-type guidance, and local points validation.
  - Controlled owned-Draft verification created, saved, and deleted exactly one temporary Text task; exact create/save/delete messages appeared and replaced each other, no native success alert or workspace error appeared, selection remained correct, cleanup restored the original task count, and the quest remained Draft. No existing task was intentionally modified.
  - Image messages are implemented and statically reviewed but not live-write verified; no image upload, removal, or Storage write occurred. Task cards/keyboard limits, selected state, TaskForm, editors, points validation, immutable-type guidance, APIs, schema/RLS/Storage policies, Preview, publication, and deletion guards remain unchanged.

Next:

- Sprint 12.18.42 - Task Card Selected-State Accessibility.
  - Updated only `TaskList` and `TaskCard`: `isSelected` is derived from the existing `selectedTaskId` and passed to `TaskCard`; selection ownership, callbacks, task order, and the mouse-selection wrapper remain unchanged.
  - The selected task keeps its violet ring and shows visible secondary `Выбрано`. The native pencil still stops propagation and calls the existing `onSelect`; its accessible name is `Открыть задание «{title}»`, and only the selected pencil has `aria-current="true"`. No wrapper role/tabIndex/keyboard handler, `aria-selected`, `aria-pressed`, or composite-widget semantics were added.
  - Manual authenticated no-write verification confirmed Tab access, Enter/Space pencil activation, unchanged mouse selection, selected-state movement, wrapping metadata, reachable actions, and usable narrow layout. No Save, Create, Delete, upload, removal, POST, PATCH, DELETE, or live-data action occurred.
  - No focus management or deletion-focus recovery was added. Delete confirmation/isolation, status messaging, synchronization, task display, TaskForm, editors, validation, immutable-type guidance, APIs, Preview, and guards remain unchanged.

Next:

- Sprint 12.18.43 - Deleted Task Focus Recovery Planning.
  - Planning only. Review focus after deletion of selected and unselected tasks; prevent focus loss when a card disappears; evaluate moving focus to next task, previous task, task-list heading, or create control; preserve selection synchronization, confirmation, and event isolation; avoid automatic editor focus; verify keyboard and screen-reader behavior; identify the smallest safe implementation.
  - Controlled temporary-task deletion requires separate approval. No implementation or live write without explicit approval.

## Suggested Future Milestones

- Add more task types through the existing registry pattern.
- Improve analytics with real student attempt data.
- Add teacher authentication/authorization boundaries.
- Add richer quest settings, including tags/category, attempt limits, catalog filtering, and creation-time metadata where useful.
- Add student assignment and classroom flows.
- Add automated tests around task rendering and runtime state.
