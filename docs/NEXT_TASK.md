# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan teacher workflow copy consistency.

## Next Task

Sprint 12.18.15 - Teacher Workflow Copy Consistency Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.14 consolidated teacher Create and Tasks routes under `/dashboard/quests`.
- Canonical teacher routes are Library `/dashboard/quests`, Create `/dashboard/quests/new`, Settings `/dashboard/quests/[id]/settings`, Tasks `/dashboard/quests/[id]/tasks`, Preview `/dashboard/quests/[id]/preview`, and Play/Test `/dashboard/quests/[id]/play`.
- Legacy redirects remain for `/quests/new`, `/quests/[id]/tasks`, `/quests`, and `/quests/[id]`.
- All internal teacher Create and Tasks links use canonical dashboard routes.
- `QuestWorkspaceNav` ordering, labels, and active behavior remain unchanged.
- The post-create Settings redirect remains `/dashboard/quests/[id]/settings?created=1`.
- `NewQuestForm` and `QuestTasksClient` received only minimal dashboard-layout fit adjustments.
- Task CRUD, validation, payloads, errors, loading, scrolling behavior, publication behavior, dashboard layout guard, and owner-safe route loading remain intact.
- Manual browser verification passed for both canonical routes, both legacy redirects, no redirect loops, dashboard task-editor layout/scrolling, internal links staying within `/dashboard/quests`, and no data changes.
- Remaining intentional legacy occurrences are redirect pages, historical documentation references, and `/api/teacher/quests` API routes.
- No API, schema/migration, RLS/policy, index, task CRUD refactor, Preview or Play/Test behavior change, publication behavior change, public catalog/student-facing implementation, broad visual redesign, or broad localization change was included.

Planning topics:

- Audit Russian and English copy across Library, Create, Settings, Tasks, Preview, and Play/Test.
- Review status labels `Draft` and `Public`.
- Review navigation labels `Settings`, `Edit tasks`, `Preview`, and `Play/Test`.
- Review headings and supporting text.
- Assess task editor mojibake risk.
- Define consistent terminology for quest, task, and question.
- Decide whether localization should be Russian-only for the MVP.
- Identify exact files likely to change.
- Plan a phased low-risk copy update.

Out of scope:

- Implementation before architecture approval.
- Quest deletion.
- New migrations unless explicitly approved after planning.
- Live Supabase writes.
- New RLS policies.
- New indexes.
- Public catalog or student-facing changes.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
