# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan publication readiness rules for teacher-owned draft quests.

## Next Task

Sprint 12.18.7 - Publication Readiness Rule Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.18.6 implemented Step 2 Settings onboarding for newly created draft quests.
- `NewQuestForm` redirects after creation to `/dashboard/quests/[id]/settings?created=1`.
- Quest Settings accepts Next.js 16 async `searchParams`.
- `created` supports `string | string[] | undefined`; arrays use the first value.
- Only exact `created=1` enables onboarding.
- Onboarding is server-rendered and non-persistent.
- Onboarding appears only for post-create query visits.
- Direct Settings visits remain unchanged.
- `getOwnedQuest(id)` remains the owner-safe access gate.
- Onboarding does not affect authorization or data loading.
- The task link points to `/quests/[id]/tasks`.
- Publication behavior remains unchanged.
- No client state or dismiss behavior was added.
- Browser verification passed with and without the query parameter.
- No data was modified during browser verification.
- No create API, schema/migration, RLS/policy, index, `QuestSettingsForm`, `QuestCoverImageManager`, task route/editor, publication gating, deletion, public catalog, or student-facing change was included.

Planning topics:

- Whether a quest may be published with zero tasks.
- Whether publication should require at least one task.
- Whether cover, category, tags, description, grade, duration, or subject should be required.
- Which rules belong in the API versus UI.
- Exact owner-safe validation path.
- Error-message UX.
- Impact on existing published quests with zero tasks.
- Migration/backward-compatibility considerations.
- Manual verification strategy.

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
