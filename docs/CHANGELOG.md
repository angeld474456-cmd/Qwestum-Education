# Changelog

## Sprint 12 Teacher Experience

- `36e5d94` Add teacher quest library page.
  - Added `/dashboard/quests`.
  - Loads quests with `getQuests()` and task counts with `getAllQuestTasks()`.
  - Shows title, description, difficulty, Public/Draft from `is_public`, `created_at`, and task count.
- `7b5e7c8` Add teacher preview and play routes.
  - Added `/dashboard/quests/[id]/preview` and `/dashboard/quests/[id]/play`.
  - Preview renders tasks read-only with `TaskRenderer` in `mode="preview"`.
  - Play/Test mounts `QuestRunner`; answers/results are not persisted yet.
- `e9b8466` Add teacher quest settings page.
  - Added `/dashboard/quests/[id]/settings`.
  - Editable fields are `title`, `description`, `difficulty`, and `is_public`.
  - Saves through `updateQuest(id, { title, description, difficulty, is_public })`.
- `640ca49` Add teacher quest workspace navigation.
  - Added `components/dashboard/QuestWorkspaceNav.tsx`.
  - Reused it in settings, preview, and play pages.
  - Task editor intentionally remains at `/quests/[id]/tasks`.
- `226237d` Add workspace navigation to task editor.
  - Added `QuestWorkspaceNav` to `app/quests/[id]/tasks/page.tsx`.
  - Kept the existing `/quests/[id]/tasks` route.
  - Did not create a dashboard task route.
  - Did not refactor editor logic, task components, services, runtime, migrations, or JSONB architecture.
- Sprint 12.6.1 - Teacher Workspace Route Consistency Analysis.
  - Confirmed `/quests/[id]` should remain a legacy/detail route for now.
  - Recommended using dashboard settings as the primary teacher edit route.
  - Recommended keeping `/quests/[id]/tasks` until a dashboard task route is intentionally planned.
- Sprint 12.6.2 - Teacher Library Primary Action Polish.
  - Updated `Open / Edit quest` in `/dashboard/quests` to point to `/dashboard/quests/[id]/settings`.
- Sprint 12.6.3 - Teacher Library Action Cleanup.
  - Removed the duplicate `Settings` action from quest cards.
  - Current library actions are `Open / Edit quest`, `Edit tasks`, `Preview`, and `Play/Test`.
- Sprint 12.7.1 - Breadcrumbs / Page Title Analysis.
  - Decided not to implement breadcrumbs now.
  - Decided not to create a shared `QuestWorkspaceHeader` now.
  - Kept current dashboard page titles as acceptable for MVP.
  - Left task editor title/text unchanged because `/quests/[id]/tasks` is still a legacy route with Russian UI text and mojibake risk.
  - Recommended revisiting shared headers or breadcrumbs only if the dashboard workspace grows.
- Sprint 12.8.1 - Teacher Quest Analytics Analysis.
  - Confirmed MVP analytics should be teacher-only content analytics.
  - Confirmed student attempt/result analytics should wait until answer persistence exists.
  - Recommended using existing `quests` and `quest_tasks` data without migrations.
- `0d903f3` Add teacher library analytics summary.
  - Added compact analytics cards to `/dashboard/quests`.
  - Shows Total quests, Public quests, Draft quests, Total tasks, and Total points.
  - Uses existing `getQuests()` and `getAllQuestTasks()`.
  - Added no routes, migrations, services, runtime/editor changes, task editor changes, or JSONB inspection.
- Sprint 12.9.1 - Attempt Persistence / Student Analytics Analysis.
  - Decided not to implement attempt persistence yet.
  - Decided not to create Supabase migrations, attempt services, routes, or runtime persistence yet.
  - Teacher Test Mode should remain local-only for now.
  - Future persistence should focus on real student attempts after auth, privacy, RLS, and schema decisions.
  - Documented future `quest_attempts` and `quest_attempt_answers` table shapes as deferred architecture.
- Sprint 12.10.1 - Auth / RLS Boundaries Analysis.
  - Confirmed the project has early auth pieces, including `lib/supabase.ts`, `components/auth/LoginForm.tsx`, role types in `types/user.ts`, and `author_id` in `types/quest.ts`.
  - Confirmed dashboard routes do not currently enforce session, role, or quest ownership.
  - Confirmed current quest services are broad/id-based: `getQuests()` selects all quests, and `getQuest(id)`, `updateQuest(id)`, and task helpers do not enforce owner checks at service level.
  - Confirmed `app/quests/new/page.tsx` creates quests without setting `author_id`.
  - Recommended active MVP roles of teacher and student, with admin and school/organization roles deferred.
  - Recommended designing ownership and RLS before real student attempts or private teacher analytics are implemented.
- Sprint 12.11.2 - Supabase Schema / RLS Audit.
  - Ran a read-only live Supabase probe with the configured anon client.
  - Confirmed live `quests` is anon-readable, has 3 visible rows, includes `author_id`, and all visible quests have `author_id IS NULL`.
  - Confirmed live `quest_tasks` is anon-readable and has 10 visible rows.
  - Confirmed live `quest_tasks.content` does not exist, which conflicts with local migration/code/runtime expectations.
  - Confirmed broad anon reads are currently possible for `quests` and `quest_tasks`, meaning RLS is either disabled or policies allow broad anon reads.
  - Storage bucket/policy state for `quest-images` remains unconfirmed.
  - Recommended schema repair planning before auth/ownership code changes.
- `57b8438` Add quest task content migration.
  - Added `database/migrations/003_add_quest_task_content.sql` as a forward repair migration.
  - The migration was manually applied in live Supabase after commit.
  - Verified `public.quest_tasks.content` exists and is readable as JSONB.
  - Verified existing 10 visible `quest_tasks` rows currently have `content = null`.
  - Lint, production build, and schema health checks passed during verification.
- `0941973` Add single choice task creation option.
  - Updated task creation to expose only implemented MVP task types: `text` and `single_choice`.
  - Kept `text` as the default task type.
  - Manually verified single-choice creation, `SingleChoiceTaskEditor` loading, option saving, correct answer saving, and refresh persistence.
  - Lint and production build passed before commit.
- `2dd71ac` Add Supabase SSR session foundation.
  - Added SSR-compatible Supabase session handling.
  - Protected `/dashboard` with authenticated session checks.
- `431cf37` Disable unimplemented dashboard links.
  - Disabled sidebar links for unimplemented dashboard sections to avoid 404 navigation.
- `f59764d` Add owner scoped dashboard reads.
  - Scoped Teacher Quest Library, Preview, and Play/Test reads to owned quests.
- `4af5a31` Add owner safe quest creation and settings.
  - Quest creation now sets `author_id` from the authenticated server session.
  - Settings save matches both quest `id` and `author_id`.
- `887cfd6` Add owner safe task CRUD.
  - Task editor initial loading is owner-scoped.
  - Task create/update/delete use authenticated server routes.
  - Task ownership is verified through the parent quest.
- `b6564c0` Remove legacy browser quest reads.
  - `/quests` redirects to `/dashboard/quests`.
  - `/quests/[id]` redirects to `/dashboard/quests/[id]/preview`.
  - Removed legacy browser-side quest/task table helpers from active flows.
- Sprint 12.15.3 - Harden Quests and Quest Tasks RLS.
  - Added `database/migrations/004_harden_quest_rls.sql`.
  - Applied the migration manually in live Supabase.
  - Removed broad public `quests` and `quest_tasks` policies.
  - Added authenticated owner policies for `quests` SELECT, INSERT, and UPDATE.
  - Added authenticated owner-derived policies for `quest_tasks` SELECT, INSERT, UPDATE, and DELETE.
  - Confirmed no public or anon policies remain on `quests` or `quest_tasks`.
  - Confirmed `quests` has no DELETE policy, so quest deletion remains unavailable.
  - Read-only smoke tests passed for dashboard library, settings, task editor, preview, and play/test.
  - Storage upload remains unchanged and is the next ownership/security gap.

## Current State On `feature/next-work`

Documented baseline for future Codex chats.

Implemented before this documentation pass:

- Modular Task Editor
- `TaskTypeRegistry`
- Text task type
- Single choice task type
- Task content JSONB support
- Live Preview
- Validation
- Runtime task renderer
- Preview mode and Play mode
- Quest runtime engine
- `QuestRunner`
- `RuntimeContext`
- `ProgressBar`
- `TaskNavigator`
- `QuestStartScreen`
- `QuestFinishScreen`
- `QuestResults`

## Documentation

- Added project context documentation.
- Added architecture overview.
- Added roadmap.
- Added next-task handoff.
- Added coding rules.

## Notes

- No commits or pushes should be made unless explicitly requested.
- Lint and build are required before finishing implementation work.
