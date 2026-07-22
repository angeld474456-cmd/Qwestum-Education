# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest safe Teacher Preview category/tag display slice.

## Next Task

Sprint 12.17.15 - Quest Category / Tags Preview Display Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.17.14 implemented category and tag display/filtering in the Teacher Quest Library.
- `/dashboard/quests` remains a Server Component and accepts Next.js 16 async `searchParams`.
- Supported Library URL parameters are `category` and `tag`.
- Owned quests are fetched once through `getOwnedQuests()`.
- Filter values are derived only from the authenticated teacher's owned quests.
- Filtering is performed in memory for the current MVP scale.
- Category and tag filters combine with AND semantics.
- Native GET controls provide shareable URLs, refresh persistence, and browser back/forward behavior.
- Quest cards display category and tag chips only when populated.
- No Preview category/tag display is implemented yet.

Planning topics:

- Whether category and tags should appear in Teacher Preview.
- Placement relative to title, cover, subject, language, grade, and duration.
- Empty metadata behavior.
- Chip styling and consistency with the Teacher Library.
- Whether Preview needs any additional data loading.
- Responsive layout.
- Accessibility.
- Exact implementation scope.

Out of scope:

- Implementation before architecture approval.
- NewQuestForm changes.
- Play/Test changes.
- Quest deletion.
- Public catalog or student discovery.
- New migrations.
- New RLS policies.
- New indexes.
- Normalized taxonomy tables.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
