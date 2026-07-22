# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan whether quest metadata chip display should be consolidated across Teacher Library and Teacher Preview.

## Next Task

Sprint 12.17.16 - Quest Metadata Display Consolidation Planning.

Planning only. Do not implement until architecture is approved.

Current state:

- Sprint 12.17.14 implemented category and tag display/filtering in the Teacher Quest Library.
- Sprint 12.17.15 implemented category and tag display in Teacher Preview.
- Teacher Library and Teacher Preview both display category and tag chips only when populated.
- Teacher Preview remains read-only and has no editing or filtering controls.
- Metadata chip logic remains local to Library and Preview.
- No service query, type, API, schema, migration, RLS, policy, index, NewQuestForm, Play/Test, public catalog, student discovery, normalized taxonomy, or quest deletion change was included in Sprint 12.17.15.

Planning topics:

- Whether Library and Preview metadata chip logic should be extracted.
- Shared metadata normalization helpers.
- Shared chip styling.
- Component boundaries.
- Prop design.
- Owner-safe data flow.
- Avoiding over-abstraction.
- Whether consolidation is justified now or should be deferred.
- Exact files that would change.

Out of scope:

- Implementation before architecture approval.
- New metadata fields.
- Quest Settings changes.
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
