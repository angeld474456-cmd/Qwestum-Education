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

The task editor remains on the existing non-dashboard route:

- `/quests/[id]/tasks`

`components/dashboard/QuestWorkspaceNav.tsx` centralizes teacher workspace links:

- Back to library
- Settings
- Edit tasks
- Preview
- Play/Test

Sprint 12.5 should analyze whether to add this navigation directly to the existing task editor route, create a dashboard task-editor route later, or leave the editor untouched.

## Data Layer

Supabase tables currently used by the app include:

- `quests`
- `quest_tasks`

Important service functions are in `services/quest.service.ts`, including quest loading and task CRUD helpers.
