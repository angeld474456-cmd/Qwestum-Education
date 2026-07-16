# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Continue task image lifecycle hardening after owner-safe upload, explicit image removal, and safe replacement cleanup.

## Next Task

Sprint 12.15.5c - Task Delete Image Cleanup Planning.

Start with analysis/planning only unless implementation is explicitly approved.

Goal:

- Analyze how to safely clean up owner-scoped task image objects when a teacher deletes a task.

Current state:

- New image uploads use authenticated owner-scoped paths:
  `teachers/{userId}/quests/{questId}/tasks/{taskId}/{uuid}.{ext}`.
- Explicit image removal is owner-safe and verified.
- Safe image replacement cleanup is implemented and live-verified.
- Replacement cleanup reads the previous `image_url` server-side, saves the new URL first, and deletes only verified owner-scoped previous objects.
- Public reads remain for `quest-images`.
- Public Storage writes and deletes remain disabled.
- Owner-prefixed INSERT and DELETE policies are active.
- Legacy `tasks/{uuid}` objects remain unchanged.
- Concurrent replacements may still orphan an intermediate object.

Planning constraints:

- Do not delete legacy `tasks/{uuid}` objects.
- Do not trust object paths or image URLs from the browser.
- Use server-read task data before deleting a task.
- Decide whether task image cleanup should happen before or after task deletion.
- Cleanup failure must not create confusing task deletion state.
- Do not add quest deletion.
- Preserve Russian UI text.
- Keep changes minimal and scoped.

Deferred items:

- Private bucket or signed URL access.
- Magic-byte MIME validation.
- Legacy object migration.
- Quest deletion.

Required verification for any future implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git status -sb
```
