# Next Task

## Milestone

Quest Metadata and Publication Write Boundary

## Next Task

Plan the smallest owner-safe database mutation boundary for the remaining teacher quest metadata/settings and publication write paths.

## Objective

Replace remaining direct teacher quest metadata/publication write paths only after an approved architecture and migration plan. Keep the current Model A boundary and P0 production-readiness work separate.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained.
- Quest deletion is now RPC-only through `delete_owned_quest`; Migration 029 removed the direct `public.quests` DELETE policy. Quest creation, metadata/settings update, cover set/clear, and publication remain the known quest-level write-boundary scope.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Production promotion remains separately gated by the P0 pre-production checklist. Planning only: no migration, policy change, implementation, provider configuration, deployment, commit, or push without explicit approval.
