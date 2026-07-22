# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the smallest safe Teacher Library category/tag display and filtering slice.

## Next Task

Sprint 12.17.14 - Quest Category / Tags Library Display and Filtering Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.17.13 implemented category and tags in owner-safe Quest Settings.
- Shared and teacher quest types include `category: string | null` and `tags: string[]`.
- Owner-scoped quest reads include category and tags.
- Settings PATCH supports category and tags with server-side normalization and validation.
- Category max length is 40 characters.
- Tags are comma-separated in Settings, normalized server-side, deduplicated case-insensitively, and preserve first-occurrence casing.
- Maximum tag count is 10 and maximum normalized tag length is 24 characters.
- Empty category clears to `null`; empty tags array clears all tags.
- Manual authenticated browser verification passed and the test quest was restored to `category = null` and `tags = []`.

Planning topics:

- Category and tag chips in the Teacher Quest Library.
- Category and tag filter controls.
- Client-side versus server-query filtering.
- URL search parameter behavior.
- Empty metadata behavior.
- Owner-scoped filter values.
- Possible Preview display.
- Whether indexes are justified at the current data volume.

Out of scope:

- Implementation before architecture approval.
- NewQuestForm changes.
- Play/Test changes.
- Quest deletion.
- New RLS policies.
- New indexes unless separately approved after planning.
- Normalized taxonomy tables.
- Public/student catalog filtering.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
