# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Close the remaining ownership/security gap in task image upload after quest and task table RLS hardening.

## Next Task

Sprint 12.15.4 - Owner-Safe Storage Upload.

Start with analysis/planning unless implementation is explicitly approved.

Analyze:

- Current browser image upload flow in `services/storage.service.ts`.
- Current use of `ImageUploader` in text and single-choice task editors.
- Current `quest-images` bucket state and storage policies.
- Existing non-owner-scoped paths like `tasks/{uuid}`.
- Whether new uploads should use an authenticated route handler, signed upload URL, or another server-verified path.
- A target path model such as `teachers/{userId}/quests/{questId}/tasks/{taskId}/{uuid}.{ext}`.
- File type and file size validation.
- Image replacement and old-object cleanup behavior.
- How to preserve existing image URLs during transition.

## Constraints

- Do not modify runtime/editor/JSONB architecture without explicit approval.
- Do not modify live storage buckets, objects, or policies without explicit approval.
- Do not implement student/public runtime access yet.
- Do not add quest deletion in this sprint.
- Preserve Russian UI text.
- Prefer English UI labels in new dashboard pages.
- Keep changes minimal and scoped.

## Current Security State

- `database/migrations/004_harden_quest_rls.sql` has been applied live.
- `quests` access is owner-scoped for authenticated teachers.
- `quest_tasks` access is owner-derived through parent quests.
- Anonymous direct table access to `quests` and `quest_tasks` is denied.
- Quest deletion remains unavailable because no `quests` DELETE policy exists.
- Browser image upload and non-owner-scoped storage paths remain unchanged.

## Required Verification

Before finishing any implementation:

```powershell
npm.cmd run lint
npm.cmd run build
```

Also check for mojibake before finalizing UI text changes:

```powershell
rg -n "Р В РІР‚в„ў|Р В РЎСљ|Р В  |Р РЋРІР‚в„–|Р РЋР Р‰|РЎР‚РЎСџ" components app docs
```
