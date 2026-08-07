# Next Task

## Milestone

Teacher Task Image Mutation Boundary

## Next Task

Plan owner-safe image set and image-clear database mutation boundaries.

## Objective

Replace the remaining direct `public.quest_tasks` image UPDATE paths with narrow owner-safe boundaries, then remove the direct UPDATE policy only after both paths are migrated and verified.

## Constraints

- Preserve the existing server-orchestrated image upload, canonical path checks, compare-and-clear semantics, and best-effort Storage cleanup.
- Keep metadata/content updates on Migration 025 and do not broaden the future image boundary to task type, ordering, or unrelated fields.
- Analyze first; no migration, policy change, implementation, provider configuration, deployment, commit, or push without explicit approval.
