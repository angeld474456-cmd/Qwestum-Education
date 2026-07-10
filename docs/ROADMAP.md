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

Next:

- Sprint 12.10 - Auth / RLS Boundaries Analysis.
  - First task: Sprint 12.10.1 analysis only.
  - Analyze teacher/student/school/admin access rules before implementing attempt persistence or student analytics.

## Suggested Future Milestones

- Add more task types through the existing registry pattern.
- Improve analytics with real student attempt data.
- Add teacher authentication/authorization boundaries.
- Add richer quest settings, including duration, attempts, grade level, and subject.
- Add student assignment and classroom flows.
- Add automated tests around task rendering and runtime state.
