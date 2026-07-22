# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the next small polish pass for the new-quest draft creation workflow.

## Next Task

Sprint 12.18.3 - New Quest Creation UX Polish Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.2 implemented the new-quest draft creation UX.
- Quest creation is an explicit two-step workflow.
- Step 1 creates a minimal draft quest shell.
- Step 2 redirects to Quest Settings for metadata, cover image, tasks, and publication.
- `NewQuestForm` sends only title, description, and difficulty.
- `NewQuestForm` no longer includes publication state or a publication control.
- The create API ignores any client-provided `is_public` value and always inserts `is_public: false`.
- `author_id` continues to come only from the authenticated server session.
- Existing title, description, difficulty, validation, loading, error, and redirect behavior remain intact.
- Manual authenticated browser verification passed with test quest `DRAFT CREATION TEST 12.18.2` (`0a6d4d54-37ca-4274-aea4-3e127c3a593d`).
- Verified redirect to `/dashboard/quests/0a6d4d54-37ca-4274-aea4-3e127c3a593d/settings`, Settings load, Draft status, empty category/tags, no cover image, no tasks, and Teacher Quest Library appearance.
- Exactly one test quest was created, no other quest data was intentionally changed, and the test quest remains in place because quest deletion is not implemented.
- No subject, language, grade, duration, category, tags, cover, Settings, Library, Preview, Play/Test, quest deletion, migration, RLS/policy, index, public catalog, student-facing, direct SQL, or direct API shortcut change was included.

Planning topics:

- Whether the draft-workflow copy should be localized consistently.
- Whether the create form needs clearer step numbering.
- Whether difficulty should remain required at creation.
- Whether description should remain required.
- Whether the route should use `/dashboard/quests/new` instead of `/quests/new` later.
- Whether a progress indicator is justified.
- Whether the test quest cleanup strategy should wait for quest deletion.
- Exact files that would change.

Out of scope:

- Implementation before architecture approval.
- New metadata fields in the creation form.
- Cover upload during creation.
- Quest Settings changes.
- Quest Library changes.
- Preview changes.
- Play/Test changes.
- Quest deletion.
- Public catalog or student discovery.
- New migrations.
- New RLS policies.
- New indexes.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
