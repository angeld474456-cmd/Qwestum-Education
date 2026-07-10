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

Next:

- Sprint 12.7 - Teacher Workspace Breadcrumbs / Page Title Analysis.
  - First task: Sprint 12.7.1 analysis only.
  - Analyze shared breadcrumbs, consistent page titles, and whether `QuestWorkspaceNav` needs current quest context.

## Suggested Future Milestones

- Add more task types through the existing registry pattern.
- Improve analytics with real student attempt data.
- Add teacher authentication/authorization boundaries.
- Add richer quest settings, including duration, attempts, grade level, and subject.
- Add student assignment and classroom flows.
- Add automated tests around task rendering and runtime state.
