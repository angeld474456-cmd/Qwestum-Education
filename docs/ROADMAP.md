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
- Sprint 12.3 — Teacher Quest Settings / Publish Controls (historical direct Settings behavior; superseded by Sprint 12.20.3).
  - Added `/dashboard/quests/[id]/settings`.
  - Historically supported editing `title`, `description`, `difficulty`, and `is_public`; current Settings PATCH is metadata-only.
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
- Sprint 12.18.8 - Enforce Task Required Before Publication (historical direct Settings PATCH guard; superseded by Sprint 12.20.2-12.20.3).
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
- Sprint 12.18.12 - Publication Readiness Settings UX (historical checkbox UX; superseded by Sprint 12.20.3C4).
  - Settings now loads an owner-safe exact task count server-side.
  - `getOwnedQuestTaskCount(questId)` validates UUID shape and authentication, verifies ownership with quest id plus authenticated `author_id`, returns `null` for missing, foreign, unauthenticated, or invalid requests, and counts only after ownership verification.
  - Task count uses `quest_tasks` exact count with `head: true` and remains separate from the quest DTO.
  - Settings passes `taskCount` to `QuestSettingsForm`.
  - Readiness messaging appears near the publication control for Draft zero-task, ready, and legacy Public zero-task states.
  - Exact UX copy includes `Для публикации нужно хотя бы одно задание.`, `Добавьте задание, затем вернитесь в настройки и включите публикацию.`, `Заданий: {taskCount}`, `Квест можно опубликовать.`, `Квест опубликован, но в нем нет заданий. Снимите публикацию или добавьте задание.`, and `Перейти к заданиям`.
  - The task link points to `/quests/[id]/tasks`.
- Historical note: the publication checkbox was enabled at this point; current Settings has no publication checkbox.
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

Sprint 12.20.23 - Multiple Choice Task Type

- Completed: owner authoring, shared validation, readiness, teacher preview/play selection, public checkbox runtime, and authoritative exact-set/no-partial-credit scoring through live Migration 019.
- Verified by 19 files / 181 tests, lint, build, local browser checks, and controlled Preview exact-correct, missing-option, and empty-answer scoring. Public DTOs omit answer keys. Local limiter `503` is an infrastructure diagnostic only; route-mock/readiness-fixture gaps are accepted non-blocking coverage work.

Sprint 12.20.24 - Teacher Task Ordering

- Completed: live Migration 020 provides authenticated owner-safe atomic full-list task ordering through `public.reorder_owned_quest_tasks(uuid, uuid[])`; parent and child locks, exact membership validation, and contiguous `1..N` normalization prevent partial or stale reorders.
- Teacher Move Up/Move Down controls persist pessimistically with a synchronous rapid-click guard and preserve selected-task identity. Teacher and public reads use `sort_order ASC NULLS LAST, id ASC`; focused 2-file/8-test and full 21-file/189-test verification, lint, build, and browser checks passed.
- No public DTO, content, media, answer-key, scoring, index, or unique-order constraint changed. At the close of this sprint, the route-side create count-plus-one race and absent DOM control harness were non-blocking notes; Sprint 12.20.25 resolves the create race below, while the manual interaction verification remains valid.

Sprint 12.20.25 - Teacher Task Creation Ordering Concurrency Hardening

- Completed: live, metadata-verified Migration 021 provides `public.create_owned_quest_task(...)` as the authenticated owner-only atomic task-create boundary. It locks the owned parent quest before child tasks, serializing create/create and remaining compatible with Migration 020 reorder locking.
- The route now delegates through `services/teacher-task-creation.server.ts`; its former route-side count-plus-one calculation and direct `quest_tasks` insert are removed. Zero RPC rows remain owner-safe not-found, `task_limit_reached` is a fixed deterministic `409`, and malformed or unexpected RPC output is a generic `500`.
- The authoritative cap is 100 tasks. Legacy NULL positions are normalized in current deterministic read order (`sort_order ASC NULLS LAST, id ASC`) before appending; the same path prevents `INT_MAX` overflow. Ordinary numeric gaps, duplicates, and negative positions are not rewritten.
- Focused 2-file/9-test and full 23-file/198-test suites, lint, build, and `git diff --check` passed. Manual checks covered Text, Single Choice, and Multiple Choice append behavior, refresh/reorder persistence, and concurrent two-tab creation; read-only evidence recorded sequential positions 7 and 8.
- No public runtime, catalog, scoring, RLS, Storage, Auth, provider, index, or unique-order constraint changed. At the close of this sprint, direct authenticated base-table task insertion, retry/idempotency semantics, and an ordering index remained separate scope; Sprint 12.20.26 closes the direct INSERT bypass below.

Sprint 12.20.26 - Teacher Task Creation Boundary Enforcement

- Completed: live, policy-verified Migration 022 drops only `Teachers can insert tasks for own quests` from `public.quest_tasks`. RLS remains enabled; existing SELECT, UPDATE, and DELETE policies remain, and no direct authenticated INSERT replacement was added.
- Normal teacher creation remains exclusively on the Migration 021 `public.create_owned_quest_task(...)` RPC, preserving its internal owner check, authoritative cap, and append ordering. Migration 020 reorder and existing teacher PATCH/DELETE owner-scoped base-table policies are unchanged.
- Text, Single Choice, and Multiple Choice creation passed after the policy change. The full 23-file/198-test suite, lint, build, and `git diff --check` passed. No public runtime, catalog, scoring, Storage, Auth, provider, index, or unique-order constraint changed.
- Broader teacher write-boundary unification and create retry/idempotency remain separate scope.

Sprint 12.20.27 - Owner-Safe Teacher Task Deletion Boundary

- Completed: live, metadata-verified Migration 023 establishes `public.delete_owned_quest_task(p_quest_id uuid, p_task_id uuid)` as the authenticated owner-safe atomic task-deletion boundary. It derives ownership from `auth.uid()`, locks the parent quest before child work, enforces membership, and keeps the final-Public-task guard inside the serialized RPC.
- The route-side public-task count-then-delete race is removed. Parent-first locking remains compatible with Migration 020 reorder and Migration 021 create; manual two-tab deletion against a two-task Public quest left exactly one task. Strict service result validation maps zero rows to owner-safe not-found, the exact last-Public-task outcome to the existing fixed conflict response, and malformed or failed RPC output to a generic failure.
- Live, policy-verified Migration 024 drops only the direct authenticated `Teachers can delete tasks for own quests` policy. At that sprint's completion, `public.quest_tasks` remained RLS-enabled with SELECT and UPDATE present and INSERT and DELETE absent. Canonical image cleanup runs only after confirmed deletion and remains one-shot best-effort: returned or thrown Storage failures preserve successful deletion with `storageDeleted: false`.
- Focused 2-file/16-test and full 25-file/214-test suites, lint, build, and `git diff --check` passed. Browser verification passed for Draft deletion, non-final Public deletion, final-Public-task blocking, and concurrent deletion. PATCH/image mutation hardening, optimistic concurrency/versioning, tolerated sort-order gaps after deletion, and orphan Storage cleanup tooling remain separate scope; no public runtime, catalog, scoring, Storage policy, Auth, or provider change was made.

Sprint 12.20.28A - Teacher Task Metadata/Content Update Boundary

- Completed: live, metadata-verified Migration 025 establishes `public.update_owned_quest_task_content(p_quest_id uuid, p_task_id uuid, p_title text, p_description text, p_points integer, p_content jsonb)` as the authenticated owner-safe metadata/content update boundary. It locks the owned parent before the target task and is compatible with Migration 020 reorder, Migration 021 create, and Migration 023 delete.
- The teacher PATCH route delegates once through `services/teacher-task-update.server.ts`, with title maximum 500, description maximum 10,000, positive safe-integer points, content, and Multiple Choice validation before the RPC. The RPC accepts no owner, task type, quest reassignment, sort order, or media input; zero rows are owner-safe 404 and malformed, multi-row, or provider output is generic 500. Mixed metadata and image input returns fixed 400 without a write.
- At this sprint's completion, image-only PATCH and image compare-and-clear remained direct, so the direct authenticated UPDATE policy was intentionally present. Replacement cleanup was best-effort after the database commit, including thrown Storage exceptions. Sprint 12.20.28B subsequently migrated both image paths and removed the policy. Focused 2-file/19-test and full 26-file/224-test suites, lint, build, `git diff --check`, and Text/Single Choice/Multiple Choice plus image browser checks passed.
- Next: migrate image set and clear paths to dedicated owner-safe database mutation boundaries; remove the direct UPDATE policy only after both image write paths no longer rely on it. Optimistic concurrency/versioning and publication eligibility after edits remain separate scope.

Sprint 12.20.28B - Teacher Task Image Mutation Boundary

- Completed in `abc989e2` (`Harden teacher task image mutations`). Live, config-verified Migration 026 adds `set_owned_quest_task_image(...)` and `clear_owned_quest_task_image_if_matches(...)`. SET accepts only the canonical owner/quest/task object path, verifies the uploaded `quest-images` object, derives its URL from a private per-environment trusted-origin configuration, and never accepts a caller-selected new hostname. CLEAR needs no config or Storage-object read.
- Both RPCs use authenticated owner checks, parent-first locking, and null-safe expected-image CAS. Stale image operations fail safely; same-value SET returns zero rows to prevent cleanup from deleting the active image. Server-only routes strictly validate outcomes and perform canonical, one-shot, best-effort cleanup only after a confirmed DB mutation.
- Live, policy-verified Migration 027 removes only the final direct `Teachers can update tasks for own quests` policy. `public.quest_tasks` remains RLS-enabled with SELECT retained and direct authenticated INSERT, UPDATE, and DELETE absent. Supported task creates, reorders, deletes, metadata/content updates, image SETs, and image CLEARs now use owner-safe RPC boundaries.
- Focused 4-file/23-test and full 29-file/232-test suites, lint, build, and `git diff --check` passed. Browser verification passed for image persistence, stale DELETE/REPLACE CAS, and post-Migration-027 metadata/image SET/image CLEAR. No public catalog, runtime, Auth, or Storage-policy regression occurred. Per-environment origin bootstrap remains operational configuration and is not committed.

Sprint 12.20.29 - Owner-Safe Teacher Quest Deletion Boundary

- Completed in `f40b56c` (`Harden owner-safe quest deletion`). Migration 028 is live: `public.delete_owned_quest(uuid)` is authenticated owner-only, postgres-owned, `SECURITY DEFINER`, parent-first locked, and returns only allowlisted post-commit cleanup references. It snapshots child task-image URLs before deleting the parent and relies on the existing FK cascade rather than deleting tasks manually.
- Migration 029 is live and removes only `Teachers can delete own quests`; direct `public.quests` DELETE is no longer an application dependency. The service makes one RPC call, strictly validates its result, maps zero rows to owner-safe not-found, and does canonical/deduplicated best-effort Storage cleanup only after confirmed deletion. Draft deletion, library removal, direct-revisit unavailability, FK cascade, cover/task-image cleanup, and post-policy-removal deletion passed.
- A separate verification discovery corrected legacy task image state: controlled live repair normalized `image_url = ''` rows to `NULL`, and live Migration 030 replaces `create_owned_quest_task` with the same identity/security/locking/order contract but inserts `image_url = NULL`. The mapper accepts null and rejects empty strings; a new task's NULL image state and immediate upload passed. Focused deletion 2 files/32 tests, focused creation 2 files/10 tests, and full 29 files/242 tests passed, along with lint, build, and `git diff --check`.

Sprint 12.20.30 - Quest Metadata and Cover Mutation Boundary

- Completed in `1daaa8e` (`Harden quest metadata and cover mutations`). Live Migration 031 moves owner-safe Settings metadata writes to `update_owned_quest_metadata(...)`; its parent-first locked RPC uses explicit optional-field presence flags, updates only approved metadata, and keeps `is_public`, cover, and author immutable.
- Live Migration 032 moves cover SET/CLEAR to `set_owned_quest_cover_image(...)` and `clear_owned_quest_cover_image_if_matches(...)`. Canonical owner/quest cover paths, exact `quest-images` object verification, expected-path CAS, and post-commit best-effort cleanup preserve cover integrity. Live Migration 033 removes the final direct `Teachers can update own quests` policy.
- `public.quests` then retained only owner INSERT and SELECT policies. Metadata, cover, publication, and deletion use dedicated owner-safe RPCs; Sprint 12.20.31 closes the remaining direct creation boundary. Browser verification passed for metadata, cover, publication, catalog visibility, and zero-task publication blocking. Focused 4-file/28-test and full 32-file/257-test suites, lint, build, and `git diff --check` passed.

Sprint 12.20.31 - Owner-Safe Quest Creation Boundary

- Completed in `a343cc2` (`Harden owner-safe quest creation`). Live Migration 034 adds `create_owned_quest(text, text, integer)`, a narrow authenticated owner-safe Draft creation RPC. It derives ownership from `auth.uid()`, validates title and difficulty, normalizes description, inserts only the creation allowlist, and returns only `{ outcome, id }`.
- Live Migration 035 removes `Teachers can insert own quests`. `public.quests` now retains only authenticated owner SELECT; direct INSERT, UPDATE, and DELETE are absent. Creation, metadata, cover SET/CLEAR, publication, and deletion use their dedicated owner-safe RPC boundaries.
- Browser verification passed for creation through the Settings redirect and owned library, initial Draft/catalog behavior, metadata and cover regressions, publication guards, publication after adding a task, and creation after policy removal. Focused 2-file/27-test and full 34-file/284-test suites, lint, build, and `git diff --check` passed.

Next:

- Sprint 12.20.32 - Controlled Preview 429 Verification.
  - Completed the P0 authorized Preview limiter evidence gate: normal submit returned `200`, then one same-identity/same-quest sequential browser run reached its first fixed no-store `429` at attempt 62 with `Retry-After: 15`. The fixed body was `{"error":"Too many requests. Please try again later."}`; no `503`, concurrency, forwarding-header manipulation, or Production traffic occurred.
  - No timeout, code, provider, environment, deployment, or migration change was made. The earlier Preview fail-closed `503` is not an active unresolved defect. Remaining P0 work is read-only Production deployment/domain/protection/environment inventory, followed by Production Auth, rollback, smoke-plan, and observability gates.

- P0 Production Deployment / Domain / Protection / Environment Inventory.
  - Next approved milestone: read-only inventory only. Do not change provider settings, deploy, send Production traffic, or select a new Core MVP implementation milestone in this gate.

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

- Sprint 12.18.44 - Deleted Task Focus Recovery.
  - Implemented in `QuestTasksClient`, `TaskList`, and `TaskCard`. Selected deletion preserves the existing `syncSelectedTask(nextTasks)` behavior, selects the first remaining task, and focuses its native pencil. Unselected deletion keeps selection and focuses the next surviving task at the deleted index, otherwise the previous task. Only-task deletion focuses the existing `Задания` heading with `tabIndex={-1}`.
  - A current selected-task-id ref resolves selection changes while DELETE is in flight. An identity-safe callback-ref `Map<taskId, HTMLButtonElement>` registers exact pencils and unregisters only when the stored element identity matches, preventing stale cleanup from removing a replacement.
  - The initial controlled test successfully deleted the selected temporary task, synchronized selection, and showed `Задание удалено.`, but focus did not move to the intended remaining pencil and Enter immediately after deletion did not activate it. Temporary data was cleaned up, and the implementation was not committed before the corrective `focusSignal`/`useLayoutEffect` work. Matching ref registration performs the bounded retry for an existing missing ref, while a target absent from current tasks is cleared without unrelated focus.
  - Final controlled retest created and deleted one temporary selected Text task. The remaining task became selected, its intended pencil received focus, Enter activated it immediately without another Tab press, `Задание удалено.` appeared, and temporary-data cleanup restored the original task count. No existing task, image, or Storage object was intentionally modified.
  - Selected temporary-task deletion is live verified. Other selected/unselected first, middle, and last positions and the only-task heading fallback were statically reviewed only. Confirmation, DELETE/API behavior, errors, guards, ordering, TaskForm, editors, images, Preview, schema/RLS, publication, and deletion guards remain unchanged.

- Sprint 12.18.46 - Task Editor Field Label Accessibility.
  - Completed the focused accessibility improvement in `TextTaskEditor` and `SingleChoiceTaskEditor`: `Название` -> `#text-task-title`, `Текст задания` -> `#text-task-description`, `Вопрос` -> `#single-choice-task-title`, and `Описание` -> `#single-choice-task-description`.
  - Stable editor-specific IDs prevent collisions; existing type and points associations, points validation associations, editor behavior, layout, responsive behavior, APIs, schema, and Storage remain unchanged. Manual read-only verification confirmed all four labels focus their associated controls; no Save, server request, or live-data write occurred.
  - Deferred QA: the user observed intermittent Settings navigation while using `Добавить вариант` or the far-right document scrollbar. Static inspection found no confirmed code path or geometry cause, so no speculative fix was made. Runtime browser isolation remains pending; this unresolved observation is separate from the verified label work.

- Sprint 12.18.48 - Task Creation Inline Title Validation.
  - Replaced TaskForm's native blank-title alert with local `titleError`, a typed ref to the existing title input, and the exact inline error `Введите название задания.`. Blank and whitespace-only titles focus the input and return before points validation or `onSave`; repeated invalid submissions refocus it without sending a request or resetting fields.
  - Conditional `aria-invalid`, `aria-describedby="task-title-error"`, and `#task-title-error[role="alert"]` provide field-specific semantics while preserving the visible label and existing red error styling. Points validation, `Promise<boolean>` creation, workspace API errors, payload, selection, layout, APIs, and the deferred Settings QA item remain unchanged.
  - Manual local browser verification covered invalid titles, focus, retained type/points, and error clearing after non-whitespace input. No valid create, Save, POST, upload, removal, cleanup, or live-data write occurred; success reset and API-failure retention are static-only review.

- Sprint 12.18.49 - Task Workspace Accessibility Exit Review Planning.
  - Planning review passed and closes immediate task-workspace accessibility implementation: no current MVP blocker was found for keyboard creation/editing/selection/deletion, validation recovery, task-card navigation, or deletion focus recovery. Existing accessibility coverage includes live regions, inline title validation, labels, immutable type guidance, points associations, selected-card cues, isolated delete, focus recovery, and image-control names.
  - Important non-blocking backlog: session-expired text remains English, redirects immediately, and the login page explains the reason; no arbitrary delay is recommended, so future work should improve localization and login feedback. Missing `aria-busy` and action-specific busy text, plus editor Save errors not individually associated to every field, remain.
  - Single Choice correct-answer radios have visual context but no programmatic group label; every radio exposes repeated `Правильный ответ`. Future `fieldset`/`legend` or equivalent group-label review is recommended; no implementation was performed.
  - Browser-native `Удалить задание?` is keyboard accessible and exposed to screen readers by the browser, but omits the task title. It was not independently screen-reader tested in this project. Custom-dialog work remains optional polish because of focus-management and regression risk.
  - Before internal testing: Settings-navigation runtime isolation. Before public MVP: unselected deletion positions, only-task heading fallback, valid create/reset, and API-failure retention. Post-MVP: session localization, busy semantics, Save associations, radio-group semantics, and custom-confirm decision. Settings navigation remains unresolved deferred QA with no speculative fix.

Next:

- Sprint 12.19.1 - Public Quest Catalog and Student Access Planning.
  - Planning passed. Current public routes are `/` and `/login`; `/quests*` redirects into the session-protected, owner-safe teacher workspace, where Preview/Play remain teacher-only. `QuestRunner` is local-only and current tasks expose `answer` plus `content.correctOptionId`, so public/student delivery needs a separate sanitized DTO.
  - Historical planning note: verified quests use `is_public` as their only publication state. The former direct Settings publish/unpublish behavior is superseded by Sprint 12.20.3's dedicated publication action and canonical eligibility boundary. No slug, published timestamp, pricing/entitlement, author profile, moderation, or state enum exists; legacy task content may be null.
  - Local schema history is incomplete because `001_initial_schema.sql` is empty; no live schema inspection occurred. Current RLS is owner-only, anonymous/non-owner public reads fail, and owner policies must not be widened. Normal anon-key clients are used; service-role access is rejected. The owner task `select("*")` service is private and must not be reused publicly.
  - Recommended MVP is anonymous server-rendered `/catalog` and `/catalog/[id]` through a dedicated published-only projection/view/RPC and public service, with login before later `/catalog/[id]/start`. Keep `is_public`, use separate public/student DTOs, preserve `/quests` redirects, defer slugs, and choose view versus RPC after live verification. UUID access requires published-only authorization and indistinguishable 404s.
  - Sprint 12.19.1 initially considered optional covers for cards alongside title, short description, difficulty, grade, language, subject, and action. Sprint 12.19.2 supersedes cover delivery for the first DTO. Server URL filters remain text, subject, grade, difficulty, and language; duration/category/tags/count/date remain deferred; attribution, pricing, popularity, points, and payment state remain omitted. Catalog is free-only; assignments, enrollment, attempts, results, payment, entitlement, and complex roles are later scope.
  - Sprint 12.19.1 initially considered a validated public cover URL in the public DTO. Authoritative Sprint 12.19.2 verification supersedes that plan: the first DTO omits covers, returns no raw `cover_image_path`, and rejects application-side URL construction because it requires the raw path. Catalog MVP uses a fallback cover; future media requires an opaque boundary, private/signed delivery, or a separate explicit owner-UUID disclosure decision. Existing task-workspace QA remains separate.

Next:

- Sprint 12.19.2 - Live Schema and Public Read Boundary Verification.
  - Completed authoritative read-only metadata verification. Live tables are `profiles`, `quests`, `quest_tasks`, and `subjects`; `categories` is absent. All four use RLS without FORCE RLS. No relevant view, materialized view, function, or RPC exists, and no live migration identifiers could be read because `supabase_migrations` has no relation.
  - Exact `profiles`: `id uuid NOT NULL` no default; `full_name text NULL` no default; `email text NOT NULL` no default; `role text NOT NULL DEFAULT 'teacher'`; `avatar_url text NULL` no default; `created_at timestamptz NULL DEFAULT now()`; PRIMARY KEY (`id`); UNIQUE (`email`). Owner is `postgres`, RLS is enabled, FORCE RLS is disabled, and no user-defined trigger exists.
  - Exact `quest_tasks`: `id uuid NOT NULL DEFAULT gen_random_uuid()`; nullable/no-default `quest_id uuid`, `sort_order integer`, `title text`, `description text`, `answer text`, `hint text`, `image_url text`, `video_url text`, `audio_url text`, and `content jsonb`; `points integer NULL DEFAULT 1`; `created_at timestamptz NULL DEFAULT now()`; `task_type text NULL DEFAULT 'text'`. PRIMARY KEY (`id`) and FOREIGN KEY (`quest_id`) REFERENCES `public.quests(id)` ON DELETE CASCADE exist; task type, points, and sort order have no checks. Owner is `postgres`, RLS is enabled, FORCE RLS is disabled, no user-defined trigger exists, `quest_tasks_pkey` is the only index, and neither `quest_id` nor `(quest_id, sort_order)` is indexed.
  - Exact `subjects`: `id uuid NOT NULL DEFAULT gen_random_uuid()`; `name text NOT NULL` no default; `grade integer NULL` no default; `created_at timestamptz NULL DEFAULT now()`; PRIMARY KEY (`id`) and `subjects_pkey` only. Owner is `postgres`, RLS is enabled, FORCE RLS is disabled, and no user-defined trigger exists.
  - `quests` has validated grade/duration/language/category/tags metadata but no difficulty check and only its primary-key index. `quest_tasks` has no task type/points/sort-order checks and only its primary-key index; neither `quest_id` nor catalog ordering is indexed. Current RLS remains authenticated owner-only for quests/tasks, authenticated read-only for subjects, and denies anonymous rows despite broad ACLs.
  - Selected public boundary is two narrow SECURITY DEFINER RPCs, `list_public_catalog_quests()` and `get_public_catalog_quest(uuid)`, with fixed search path, schema-qualified tables, explicit fields, published-plus-task-EXISTS eligibility, subject-name join, revoked default PUBLIC EXECUTE, and grants only to anon/authenticated. Anonymous base-table and task policies, service role, security-invoker view, and published-only base-table policy are rejected.
  - Public list/detail never return task rows/counts, author/subject IDs, raw cover path, publication internals, answers, hints, JSON content, correct-answer IDs, scoring, validation, or database errors. The exact first DTO contains ID, title, nullable description/subject name/difficulty/language/grade range/duration/category/created time, and tags. Covers are omitted because raw paths cannot cross the public RPC boundary; fallback covers are acceptable pending safe media design.
  - **NOT APPLIED - REQUIRES SEPARATE APPROVAL:** add `quest_tasks(quest_id)`, partial `quests(created_at DESC, id DESC) WHERE is_public IS TRUE`, and the two RPCs. Defer subject/difficulty/language/grade indexes. **NOT EXECUTED:** deploy without callers, revoke anon/authenticated EXECUTE, drop detail/list RPCs, drop indexes, then verify anonymous base-table/task reads remain denied and owner reads still work.
  - Future read-only verification inspects deployed function owner/security/search path/grants/indexes and anonymous responses; controlled write verification needs separate approval to temporarily publish then restore an existing owned Draft with a task. No disposable quest is appropriate because quest deletion is unavailable. Security risks are P0 public base/task/answer exposure, P1 SECURITY DEFINER/media/integrity gaps, and P2 missing indexes.

Next:

- Sprint 12.19.3 - Public Catalog Read Boundary Migration Planning.
  - Planning passed without creating a migration file or applying SQL. Selected two separate `LANGUAGE sql`, `STABLE`, `SECURITY DEFINER` RPCs created by `postgres`: `list_public_catalog_quests(text, text, integer, integer, text, integer, integer)` and `get_public_catalog_quest(uuid)`. They use fixed `pg_catalog, public` search path, schema-qualified tables/pg_catalog helpers, no dynamic SQL/auth.uid()/role switching/temp objects, and only the public DTO.
  - Both require public status plus internal task `EXISTS`, return no task/count/owner/path/scoring data, and join only subject name. List includes all approved search/subject/grade/difficulty/language/limit/offset parameters; search is literal case-insensitive with wildcard escaping, subject is normalized exact-name, grade is inclusive, limit clamps 1-100, offset clamps non-negative, and ordering is `created_at DESC NULLS LAST, id DESC`.
  - Plan ordinary transaction-compatible `quest_tasks_quest_id_idx` and partial `quests_public_catalog_created_at_id_idx`; defer broader filter indexes. Use `CREATE FUNCTION` to fail visibly on unexpected signatures. Revoke PUBLIC/anon/authenticated/service_role execution and grant only anon/authenticated; do not alter table grants, RLS, Storage, or public task access.
  - **NOT APPLIED - REQUIRES SEPARATE APPROVAL:** planned migration contains only two indexes, two RPCs, and explicit REVOKE/GRANT statements. **NOT EXECUTED:** rollback removes callers, revokes execution, drops detail/list functions then indexes, and verifies anonymous denial plus teacher owner reads. Migration first, metadata/schema-cache/anonymous validation second, application callers last; transaction failure, signature conflicts, index locks, schema-cache delay, and unpublish caching remain release concerns.
  - Future read-only verification covers metadata/ACL/index/direct-anon/RPC-output checks. Separately approved controlled verification publishes then restores one existing owned Draft with a task. Task-workspace QA remains separate.

Next:

- Sprint 12.19.4 - Public Catalog Read Boundary Migration File Implementation.
  - Implementation-only: create exactly `database/migrations/012_add_public_catalog_read_boundary.sql` with the reviewed two indexes, two SECURITY DEFINER SQL functions, fixed search path, explicit fields/signatures, and grants/revokes. No application or documentation change, no live SQL, and separate approval before application.

- Sprint 12.19.4 - Public Catalog Read Boundary Migration Application.
  - Completed version `20260724204657` through the standard Supabase CLI delivery migration. It adds `quest_tasks_quest_id_idx`, `quests_public_catalog_created_at_id_idx`, and the narrow public list/detail SECURITY DEFINER RPCs without adding public table policies, changing RLS, or changing Storage.
  - Anonymous list/detail, DTO boundary, missing-ID zero rows, direct anonymous base-table denial, pagination normalization, and deterministic ordering passed. Verification is **PARTIAL PASS** because authenticated smoke testing and independent live ACL/index/RLS/Storage metadata re-inspection remain unavailable in the current environment.

Next:

- Sprint 12.19.5 - Public Catalog RPC Application Integration.
  - Completed public `/catalog` and `/catalog/[id]` Server Component routes backed only by the allowlisted public list/detail RPCs through `services/public-catalog.server.ts`.
  - Added GET-synchronized search, subject, one grade, and difficulty filters; category/tags are display-only and language/category/tag filtering remains deferred.
  - Added 25-row fetches with 24 visible results, Previous/Next offset pagination, and the `offset < 10000` Next guard. Public detail is metadata-only with safe not-found behavior and no student runtime/start flow.
  - Manual browser verification passed for anonymous catalog access, Cyrillic/Latin search, filters, Reset, public detail, teacher redirects/dashboard behavior, and the expanded public-header catalog link. Only published quests with at least one task appear; pagination beyond the first page remains unexercised because fewer than 24 eligible quests exist.
  - No live schema, data, RLS, Storage, migration, grant, or Supabase change occurred.

Sprint 12.19.6 - Public Runtime Database Boundary

- Completed live application of migration `20260725213130_add_public_runtime_boundary.sql`, creating the sanitized fetch and server-side scoring RPCs without table/data/RLS/Storage/index/application changes or persistent attempts.
- Read-only smoke checks confirmed eligible fetch, missing-ID zero rows, allowlisted observed DTO fields, valid exact-ID unanswered scoring, unknown-task zero rows, oversized-payload zero rows, and no direct anonymous REST data exposure. Metadata and dataset-dependent cases remain partially unverified because the CLI dump path requires Docker Desktop and no eligible public Single Choice runtime quest was available without mutation.

Sprint 12.19.7 - Public Runtime Application Integration

- Completed runtime types, the server-only RPC service, the bounded anonymous submit API, public runner/task/result components, `/catalog/[id]/start`, loading/error UI, and the public-detail start CTA. The runtime remains anonymous and browser-local, with no persistent attempts or direct anonymous table access.
- Text-only manual browser smoke verification passed for start, submit, aggregate-only results, local retry/reset, and return navigation. Single Choice correct/incorrect/unanswered/foreign-option browser verification remains incomplete because no eligible public Single Choice quest was available without mutating live data.
- Durable attempts, student accounts, assignments, payments, entitlements, production rate limiting, answer explanations, and production launch remain incomplete.

Sprint 12.19.8 - Single Choice Runtime Verification and Cleanup

- Completed controlled temporary-fixture verification for correct, incorrect, and unanswered Single Choice scoring, generic unknown/foreign-option rejection, browser-local retry/reset, result rendering, and the no-answer-leak boundary.
- The temporary two-task fixture was removed after verification. The quest returned from six tasks to its original four Text tasks and prior published state, with no media, Storage, schema, migration, RLS, function, grant, or application-code change.
- Automated regression tests, production rate limiting, durable attempts, student accounts, payments, assignments, and production launch remain incomplete.

Sprint 12.20.2 - Publication Eligibility Boundary / Migration 014

- Completed the canonical publication eligibility boundary. `public.is_public_runtime_eligible(uuid)` is now the shared catalog/runtime predicate; Migration 014 was applied live before its reviewed commit.

Sprint 12.20.3A - Publication Readiness Service and API

- Completed the owner-scoped readiness service and `GET /api/teacher/quests/[id]/publication-readiness`, returning only allowlisted readiness data and fixed safe outcomes.

Sprint 12.20.3B - Teacher Publication Readiness UI

- Completed the manual teacher readiness panel with validated DTO rendering, safe request handling, blockers/warnings, counts, retry, and session-expiry behavior.

Sprint 12.20.3C1 - Owner-Safe Atomic Publication Mutation / Migration 015

- Migration `20260728193030` is live. `public.set_owned_quest_publication_state(uuid, boolean)` performs authenticated owner-safe publication mutation with canonical eligibility recalculation, a task-table lock for the publish-time snapshot, and fixed outcomes.

Sprint 12.20.3C2 - Dedicated Publication Action API

- Completed `POST /api/teacher/quests/[id]/publication`. It accepts only publish/unpublish actions, uses the server publication boundary, and maps fixed safe success and error responses without raw database details.

Sprint 12.20.3C3 - Remove Settings PATCH Publication Mutation

- Completed metadata-only Settings PATCH. Any own enumerable `is_public` request property is rejected before authentication or data access; ordinary saves preserve stored publication state and invalidate readiness only after success.

Sprint 12.20.3C4 - Publish/Unpublish Teacher Controls

- Completed guarded, confirmed teacher Publish/Unpublish controls in `QuestPublicationReadiness`. Publish requires a current ready result; warnings allow it, blockers prevent it, and Unpublish requires no readiness. Manual browser verification passed for publish, unpublish, warnings, blockers, metadata invalidation, and refresh persistence. The publication flow is complete; public catalog lifecycle regression verification, cover delivery, student authentication/profile, student cabinet/history, persistent attempts, assignments, payments/entitlements, production rate limiting, and deployment remain incomplete.

Sprint 12.20.6 - Controlled Public Publication Lifecycle Verification

- Completed approved browser verification with existing Draft quest `1a206882-650e-4982-840a-fe6108872cac`: catalog list/detail/start and one safe Text-only submit became available after publish; a stale open runner submit was safely rejected after unpublish; republish restored visibility; final state returned to Draft. No metadata, task, cover, Storage, or repository change occurred.

Sprint 12.20.8-12.20.9B - Public Catalog Cover Delivery

- Completed the approved opaque cover boundary: Migration 016 is live and verified; catalog RPCs expose `has_cover` only; list/detail render same-origin cover URLs through `GET /api/public/quests/[id]/cover`; and a stable 16:9 fallback handles unavailable media.
- The media route rechecks public eligibility and returns validated image bytes only. No raw Storage path, direct Storage URL, public bucket conversion, Storage-policy change, or client-side service-role access was introduced. Browser verification covered media headers, safe 404s, fallback recovery, unpublish withdrawal, republish restoration, and original-state restoration. Automated verification passed: 9 test files, 104 tests passed, 0 failed; lint and build passed.
- The local server-only `sb_secret_...` key is configured and verified without recording a value. Legacy JWT-based API keys remain temporarily active for the browser anon client; migration to `sb_publishable_...` remains separate controlled work.

Sprint 12.20.10 - Public Catalog Empty, Loading, and Error UX

- Completed the accessible public catalog state pass: `/catalog` now distinguishes empty, filtered no-result, and nonzero-offset no-more-result states with targeted local navigation; list/detail/start loading, error, and unavailable states now use consistent safe status, busy, focus, retry, and reduced-motion behavior.
- Manual browser verification and code review passed. Automated verification passed: 9 test files, 104 tests passed, 0 failed; lint and `git diff --check` passed. The original external Google Fonts Geist build blocker was resolved by Sprint 12.20.11A with a locally bundled official Geist variable font; no application, route-boundary, TypeScript, or lint defect was reported.
- No public API, DTO, cover delivery, auth, publication, Supabase, Storage, migration, package, deployment, or configuration boundary changed.

- Sprint 12.20.11 - Production Build Reliability and Local Font Strategy.
  - Completed planning and Sprint 12.20.11A implementation. `next/font/google` Geist was replaced by the official locally bundled Vercel Geist variable font through `next/font/local`, with SIL Open Font License 1.1, recorded provenance/checksum, preserved `--font-sans`, `display: "swap"`, and variable weights `100 900`.
  - Production build, 9 test files/104 tests, lint, Cyrillic rendering, normal/bold weights, layout stability, and the absence of browser Google-font requests passed. A stale ignored `.next` cache was a resolved local development incident, not an application defect. No package, configuration, API, DTO, runtime, Supabase, Storage, SQL, migration, or deployment change occurred. Commit `96adcfb` is pushed.

- Sprint 12.20.12 - Production Deployment Readiness Planning.
  - Completed planning: Vercel is the primary target and a Node-compatible managed host such as Render is fallback. Production builds are healthy, but deployment remains blocked on launch controls. Required environment names only are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; legacy anon-key migration remains separate.

- Sprint 12.20.13 - Auth Callback Redirect Hardening.
  - Completed safe local-path-only callback redirects. Invalid or external destinations fail closed to `/dashboard`; 23 focused tests, 127 full tests, lint, build, and manual verification passed. Commit `a268817` is pushed.

- Sprint 12.20.14 - Public Endpoint Rate-Limit and Abuse-Control Planning.
  - Completed planning: platform controls should protect anonymous GET traffic and a shared/distributed limiter should protect `POST /api/public/quests/[id]/submit`. In-memory production limiting is rejected. Sprint 12.20.15A and 12.20.15B supersede the provisional provider, identity, and rate-value selection.

- Sprint 12.20.15A and 12.20.15B - Shared Public Submit Limiter.
  - Completed selection and implementation: Upstash Redis via `@upstash/redis` and `@upstash/ratelimit`; only Vercel `x-forwarded-for` is trusted; canonical IPv4/IPv6 identity becomes opaque HMAC-SHA-256 keys; missing or malformed identity/configuration/provider failures fail closed.
  - Both token buckets must allow before scoring: client capacity 75/refill 60 per minute and client-plus-quest capacity 60/refill 45 per minute. Analytics and ephemeral cache are disabled. Validation remains before limiting; fixed no-store `429` and `503` responses do not expose identity, provider, request, or answer data. Tests passed 12 files/138 tests; lint and build passed. Commit `0605136` is pushed.
  - Sprint 12.20.18 completed separate Preview provider provisioning and successful submit verification. Controlled `429` verification, Vercel WAF/rate rules, Preview auth/teacher verification, and all production controls remain incomplete.

- Sprint 12.20.16 - Platform Public GET Abuse Controls and Cache Policy Planning.
  - Completed planning: Vercel platform/WAF protection is preferred for anonymous GET traffic; hard per-IP GET limits are deferred for shared school/classroom NAT. Catalog/detail remain dynamic, start remains no-store, cover success remains private for 60 seconds, and publication-sensitive responses must not use stale-while-revalidate.
  - Proxy/auth cost, Vercel WAF/Firewall capability and entitlement, and preview validation remain unresolved before configuration.

- Sprint 12.20.17 - Public Debug Route Removal and Anonymous Surface Verification.
  - Removed the reachable `/test` debug page. `/test` now returns normal not-found behavior; an anonymous-surface regression test prevents public/debug route and raw Supabase row/error serialization regressions.
  - Focused tests, 13-file/140-test suite, lint, build, and local `/test`, catalog, and public-detail smoke checks passed. `proxy.ts` and public contracts were unchanged. Commit `e49d6fd` is pushed.

- Sprint 12.20.18 - Controlled Upstash and Vercel Preview Provisioning.
  - Completed controlled Preview setup for the `qwestum-education` Vercel project: the repository is connected, `main` remains the Production branch, `feature/next-work` has a Preview deployment, and a separate Preview Upstash Redis database serves the shared submit limiter. Preview configuration uses the approved Supabase, Upstash, and HMAC environment-variable names only; no values are recorded.
  - Corrected early Preview formatting issues and the trusted client-IP source in commit `147246d` (`Fix Vercel client IP header for submit limiter`), which now accepts only `x-forwarded-for`. Final Preview smoke verification passed for public catalog/detail/start, `/test` not-found behavior, and a real provider-backed submit through its successful result. The Text result remained `not_scored`; no runtime error was observed. Tests passed 13 files/140 tests; lint and build passed.
  - The initial Vercel CLI-created Production deployment is a temporary provisioning artifact, not a production release. No promotion, production domain rollout, production Supabase/Auth change, or production traffic approval exists.

- Sprint 12.20.19 - Preview Auth, Rate-Limit, and Deployment Safety Verification.
  - Completed as PASS WITH DEFERRED LIVE 429 EVIDENCE. Preview magic-link/callback, authenticated dashboard and teacher workspace, logout, and renewed protected-route enforcement passed. The callback uses the current origin and only accepts validated same-origin local destinations; public routes remain anonymous.
  - Public submit implementation and focused evidence passed: validation precedes the shared limiter, limiting precedes scoring, fixed no-store `429`/`503` responses include `Retry-After`, and scoring is skipped when the limiter is limited or unavailable. The sole trusted identity header remains `x-forwarded-for`; focused tests passed 3 files/18 tests.
  - Browser Preview submit reached the application with both a successful `200` and a fail-closed `503`. Live `429` evidence is deferred: external Vercel Preview protection intercepted Codex execution-context public GETs and submit before application handling, while browser access was authorized. This is not a limiter defect and must remain a pre-production verification requirement; do not weaken Preview protection solely to obtain it.
  - No production promotion, cleanup, deletion, aliasing, rollback, provider mutation, or deployment change occurred. The accidental initial Production deployment remains a provisioning artifact, not a release. The expired magic-link message is a non-blocking future UX follow-up.

Sprint 12.20.20 - Pre-Production Readiness Planning

- Completed as **PASS - PRE-PRODUCTION READINESS PLAN DEFINED**. Continued MVP development is approved; Production promotion remains separately gated by authorized Preview `429` evidence, Vercel Production inventory/protection review, Production Auth review, exact rollback deployment, and an approved final smoke plan.
- The accidental initial Production deployment remains a provisioning artifact. It must not be deleted, reassigned, rolled back, or promoted without explicit approval after domain/alias inspection.

Public Quest Sharing UX

- Completed as PASS in commit `4cf5922`. Confirmed Published teacher quests and valid public quest details can copy only the same-origin canonical `/catalog/{questId}` URL; Draft/unpublished quests do not expose sharing, and public runtime `/start` is never a target.
- Fixed polite success/failure feedback is keyboard accessible and exposes no clipboard exception or private quest data. Build, lint, `git diff --check`, 14 test files/144 tests, and manual browser verification passed. No route, API, database, provider, deployment, or configuration change occurred.

Teacher Quest Library Text Search

- Completed as PASS in commit `4d930ac`. The existing authenticated owner-scoped library now supports a normalized URL-driven `q` search over quest title or description, with case-insensitive substring matching and AND semantics alongside the existing Category/Tag filters.
- Reset navigates exactly to `/dashboard/quests`, clears all three filters, and remounts URL-derived uncontrolled controls to prevent stale visual values. Focused tests, 15 test files/147 tests, lint, build, `git diff --check`, and manual browser verification passed. No route, API, database, provider, deployment, or configuration change occurred.

Next:

- Core MVP Next Milestone Planning.
  - Planning-only handoff: choose one smallest supported core-MVP milestone through analysis -> architecture -> plan before implementation approval, while preserving all P0 pre-production gates for a later intentional launch.
  - No provider configuration, deployment change, Production promotion, migration, SQL, or implementation is in scope.

## Suggested Future Milestones

- Add more task types through the existing registry pattern.
- Improve analytics with real student attempt data.
- Add teacher authentication/authorization boundaries.
- Add richer quest settings, including tags/category, attempt limits, catalog filtering, and creation-time metadata where useful.
- Add student assignment and classroom flows.
- Add automated tests around task rendering and runtime state.
