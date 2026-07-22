# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the second-step Settings experience after creating a new draft quest.

## Next Task

Sprint 12.18.5 - Quest Creation Step 2 Settings UX Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.2 made quest creation draft-only and redirected successful creation to Quest Settings.
- Sprint 12.18.4 polished `NewQuestForm` as the first step of the workflow.
- `NewQuestForm` now shows `Шаг 1 из 2`.
- The draft-workflow explanation is localized to Russian.
- Submit copy is `Создать черновик`.
- Loading copy is `Создание черновика...`.
- A secondary `Вернуться к библиотеке` link returns to `/dashboard/quests`.
- The form still submits only title, description, and difficulty.
- The redirect remains `/dashboard/quests/[id]/settings`.
- Draft-only server enforcement remains unchanged.
- No publication control exists on the creation form.
- Manual visual browser verification passed on authenticated `/quests/new` without creating a new quest.
- No create API, route move, metadata expansion, Settings, Library, Preview, Play/Test, quest deletion, migration, live Supabase write, RLS/policy, index, public catalog, or student-facing change was included.

Planning topics:

- Whether Quest Settings should show `Шаг 2 из 2` for newly created drafts.
- How to detect post-create arrival without persistent state.
- Whether a query parameter such as `?created=1` is appropriate.
- Whether a temporary onboarding banner is useful.
- Whether the banner should disappear after refresh or persist.
- Whether task creation should be emphasized before publication.
- Whether publication should eventually require at least one task.
- Exact files likely to change.

Out of scope:

- Implementation before architecture approval.
- Quest deletion.
- New migrations.
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
