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
  - `/dashboard/quests/[id]/settings` edits only `title`, `description`, `difficulty`, and `is_public`.
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

Next sprint:

- Sprint 12.15.5b - Safe Image Replacement Cleanup.

## Stack

- Next.js 16
- React
- TypeScript
- Tailwind
- Supabase

## Important Notes For Future Codex Chats

- This is a long-running project. Preserve existing architecture unless the user explicitly asks for a redesign.
- The task editor and runtime renderer are modular. Add new task types through the existing registry/renderer patterns.
- Storage writes are owner-scoped for new task images, but public reads remain and legacy `tasks/{uuid}` objects are preserved.
- Deferred storage work includes automatic cleanup when replacing an image, cleanup when deleting a task, private bucket/signed URLs, magic-byte MIME validation, and legacy object migration.
- Russian UI text exists throughout the app and must be preserved.
- Some shell output may display Russian text as mojibake. Check actual source files before changing UI text.
- Do not commit or push unless explicitly asked.
