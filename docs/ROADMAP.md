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

Next:

- Sprint 12.5 — Teacher Task Editor Dashboard Integration.
  - First task: Sprint 12.5.1 analysis only.
  - Analyze `app/quests/[id]/tasks/page.tsx`, `QuestWorkspaceNav` integration, and whether a future `/dashboard/quests/[id]/tasks` route is needed.

## Suggested Future Milestones

- Add more task types through the existing registry pattern.
- Improve analytics with real student attempt data.
- Add teacher authentication/authorization boundaries.
- Add richer quest settings, including duration, attempts, grade level, and subject.
- Add student assignment and classroom flows.
- Add automated tests around task rendering and runtime state.
