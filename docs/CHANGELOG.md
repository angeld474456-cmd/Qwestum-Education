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
