# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the next storage lifecycle step after owner-safe task image uploads.

## Next Task

Sprint 12.15.5 - Storage Follow-up / Image Lifecycle Planning.

This task should begin with analysis/planning only.

Analyze:

- Whether `quest-images` should remain public for MVP or move toward private bucket/signed URL access.
- How existing public `image_url` values should be handled if signed URLs are introduced later.
- Whether old image cleanup should happen when a task image is replaced.
- Whether explicit image removal is needed in the task editor.
- Whether storage objects should be cleaned up when a task is deleted.
- Whether magic-byte MIME validation is needed beyond current server MIME checks.
- How to preserve legacy `tasks/{uuid}` objects safely.
- What storage changes can be implemented without quest deletion.

## Current Security State

- `quests` and `quest_tasks` RLS are hardened and owner-scoped.
- New task image uploads use an authenticated server route.
- New task image paths are owner-prefixed:
  `teachers/{userId}/quests/{questId}/tasks/{taskId}/{uuid}.{ext}`.
- Storage public INSERT, UPDATE, and DELETE policies were removed.
- Authenticated owner-prefixed INSERT policy is active.
- `quest-images` remains public for reads.
- Legacy `tasks/{uuid}` objects remain unchanged.

## Deferred Items

- Private bucket or signed URL access.
- Magic-byte MIME validation.
- Old image cleanup after replacement.
- Explicit image removal.
- Cleanup when deleting a task.
- Quest deletion.

## Constraints

- Do not modify live storage buckets, objects, or policies without explicit approval.
- Do not upload, update, or delete storage objects during analysis.
- Do not add quest deletion unless explicitly required.
- Preserve Russian UI text.
- Prefer English UI labels in new dashboard pages.
- Keep changes minimal and scoped.

## Required Verification

Before finishing any implementation:

```powershell
npm.cmd run lint
npm.cmd run build
```

Also check for mojibake before finalizing UI text changes:

```powershell
rg -n "Р В Р’В Р Р†Р вЂљРІвЂћСћ|Р В Р’В Р РЋРЎС™|Р В Р’В  |Р В Р Р‹Р Р†Р вЂљРІвЂћвЂ“|Р В Р Р‹Р В Р вЂ°|Р РЋР вЂљР РЋРЎСџ" components app docs
```
