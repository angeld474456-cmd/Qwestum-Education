# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue building teacher-facing quest management without reworking the completed task editor or quest runtime architecture.

## Recommended Next Slice

Implement or continue the Quest Library and publish workflow:

- Show teacher-owned quests in a library view.
- Display public/private publish status.
- Allow publishing and unpublishing a quest.
- Link each quest to the existing task editor.
- Surface lightweight analytics such as task count and total points.
- Keep the UI consistent with the existing dashboard style.

## Constraints

- Do not refactor completed editor/runtime architecture without permission.
- Preserve Russian UI text.
- Keep changes minimal and scoped.
- Reuse existing Supabase service helpers when possible.
- Add small service helpers only when needed.

## Required Verification

Before finishing any implementation:

```powershell
npm.cmd run lint
npm.cmd run build
```

Also check for mojibake before finalizing UI text changes:

```powershell
rg -n "Р’|Рќ|Р |С‹|СЊ|рџ" components app docs
```
