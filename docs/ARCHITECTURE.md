# Architecture

Qwestum-Education uses a modular quest/task architecture.

## Core Areas

- App routes live in `app/`.
- Reusable UI and feature components live in `components/`.
- Quest and task data access lives in `services/quest.service.ts`.
- Supabase client setup lives in `lib/supabase.ts`.
- Shared quest types live in `types/quest.ts` and service-local interfaces.

## Task Editor

The editor is built around task-type-specific editor components.

Key files:

- `components/tasks/TaskEditor.tsx`
- `components/tasks/TaskForm.tsx`
- `components/tasks/TaskList.tsx`
- `components/tasks/editor/TaskTypeRegistry.ts`
- `components/tasks/editor/TextTaskEditor.tsx`
- `components/tasks/editor/SingleChoiceTaskEditor.tsx`

`TaskTypeRegistry` maps task type ids to editor components. New task types should be added by registering a new editor, not by rewriting the existing editor flow.

## Task Content

Task-specific data is stored in `quest_tasks.content` as JSONB.

Current usage:

- `text` tasks use the base task fields and text answer flow.
- `single_choice` tasks store options and the correct option id in `content`.

Keep task-specific shape checks close to the editor/runtime code that consumes that shape.

## Preview Layer

Preview components reuse runtime renderers where possible.

Key files:

- `components/tasks/preview/TaskPreview.tsx`
- `components/tasks/preview/TextTaskPreview.tsx`
- `components/tasks/preview/SingleChoiceTaskPreview.tsx`
- `components/tasks/runtime/TaskRenderer.tsx`
- `components/tasks/runtime/TextTaskRenderer.tsx`
- `components/tasks/runtime/SingleChoiceTaskRenderer.tsx`

## Quest Runtime

The runtime engine is context-based and manages quest progress, answers, and status.

Key files:

- `components/quest-runtime/QuestRunner.tsx`
- `components/quest-runtime/RuntimeContext.tsx`
- `components/quest-runtime/ProgressBar.tsx`
- `components/quest-runtime/TaskNavigator.tsx`
- `components/quest-runtime/QuestStartScreen.tsx`
- `components/quest-runtime/QuestFinishScreen.tsx`
- `components/quest-runtime/QuestResults.tsx`

Do not bypass `RuntimeContext` for core runtime state unless the architecture is intentionally changed.

## Teacher Experience Routes

Teacher-facing quest management currently lives under dashboard routes:

- `/dashboard/quests` — Teacher Quest Library.
- `/dashboard/quests/[id]/settings` — basic quest metadata and publish controls.
- `/dashboard/quests/[id]/preview` — read-only teacher preview using `TaskRenderer` in preview mode.
- `/dashboard/quests/[id]/play` — teacher test flow using `QuestRunner`.

In the Teacher Quest Library, the primary `Open / Edit quest` action points to `/dashboard/quests/[id]/settings`. Quest cards also link to edit tasks, preview, and play/test. The duplicate `Settings` action was removed in Sprint 12.6.

The task editor remains on the existing non-dashboard route:

- `/quests/[id]/tasks`

Sprint 12.5 integrated this existing task editor route into the teacher workspace by rendering `QuestWorkspaceNav` with `active="tasks"` directly on the page. The editor was not moved to `/dashboard`, and no new `/dashboard/quests/[id]/tasks` route exists yet.

`components/dashboard/QuestWorkspaceNav.tsx` centralizes teacher workspace links:

- Back to library
- Settings
- Edit tasks
- Preview
- Play/Test

Future route work should analyze breadcrumbs, page titles, and whether a dashboard task route is needed before moving or replacing existing `/quests/*` pages.

Sprint 12.7 decision: do not add breadcrumbs or a shared `QuestWorkspaceHeader` yet. `QuestWorkspaceNav` already provides practical navigation, dashboard header duplication is still small, and the task editor remains on `/quests/[id]/tasks` with existing Russian UI text. Revisit shared headers or breadcrumbs only if the dashboard workspace grows.

## Data Layer

Supabase tables currently used by the app include:

- `quests`
- `quest_tasks`

Important service functions are in `services/quest.service.ts`, including quest loading and task CRUD helpers.

Teacher Library analytics are content analytics only. The `/dashboard/quests` summary uses existing `getQuests()` and `getAllQuestTasks()` data to show Total quests, Public quests, Draft quests, Total tasks, and Total points. There are no persisted attempts/results yet, and no student learning analytics should be added before schema, auth, privacy, and runtime persistence are intentionally designed.
