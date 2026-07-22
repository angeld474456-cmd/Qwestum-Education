# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Integrate the live quest category/tags schema into owner-safe Quest Settings.

## Next Task

Sprint 12.17.13 - Quest Category / Tags Settings Integration.

Current state:

- Sprint 12.17.12 applied and verified `database/migrations/011_add_quest_category_tags.sql` in live Supabase.
- `public.quests.category` exists as nullable `text` with default `null`.
- `public.quests.tags` exists as `text[] not null` with default `'{}'::text[]`.
- `quests_category_length_check` and `quests_tags_count_check` were verified.
- All 7 existing quests remained compatible with null categories and empty tag arrays.
- `public.quests` RLS and owner-scoped policies were unchanged.
- No application code has been updated for category/tag editing yet.

Approved scope:

- Add `category` and `tags` to TypeScript quest types.
- Include `category` and `tags` in owner-scoped server selects.
- Add owner-safe PATCH support.
- Add category and tags controls to Quest Settings.
- Implement server-side normalization and validation.
- Preserve tag display casing.
- Deduplicate tags case-insensitively.
- Remove empty tags.
- Enforce maximum category length of 40 characters.
- Enforce maximum 10 tags.
- Enforce maximum tag length of 24 characters.

Out of scope:

- Quest Library filtering.
- NewQuestForm changes.
- Play/Test changes.
- Quest deletion.
- New RLS policies.
- New indexes.
- Normalized taxonomy tables.
- Public/student catalog filtering.

Required validation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
