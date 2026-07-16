# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue task image lifecycle hardening after owner-safe upload and explicit image removal.

## Next Task

Sprint 12.15.5b - Safe Image Replacement Cleanup.

Start with a small implementation only after approval.

Goal:

- When a teacher replaces an existing owner-scoped task image, clean up the previous owner-scoped Storage object only after the new upload and task `image_url` PATCH both succeed.

Current state:

- New image uploads use authenticated owner-scoped paths:
  `teachers/{userId}/quests/{questId}/tasks/{taskId}/{uuid}.{ext}`.
- Explicit image removal is owner-safe and verified.
- Public reads remain for `quest-images`.
- Public Storage writes and deletes remain disabled.
- Owner-prefixed INSERT and DELETE policies are active.
- Legacy `tasks/{uuid}` objects remain unchanged.

Implementation constraints:

- Do not delete legacy `tasks/{uuid}` objects.
- Do not delete any object before the replacement `image_url` is saved.
- Do not trust object paths or image URLs from the browser.
- Use the server-read previous `image_url`.
- Cleanup failure must not revert the successfully saved replacement image.
- Do not add quest deletion.
- Preserve Russian UI text.
- Keep changes minimal and scoped.

Deferred items:

- Cleanup when deleting a task.
- Private bucket or signed URL access.
- Magic-byte MIME validation.
- Legacy object migration.

Required verification:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git status -sb
```
