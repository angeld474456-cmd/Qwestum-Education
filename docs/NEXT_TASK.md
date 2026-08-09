# Next Task

## Milestone

Core MVP Next Milestone Planning

## Next Task

Review the completed quest and task write boundaries, current Model A scope, roadmap, and P0 readiness list to select the next smallest approved Core MVP milestone.

## Objective

Do not presume a feature implementation until planning identifies one. Keep the current Model A boundary and P0 production-readiness work separate.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained.
- Migration 034 makes creation RPC-only through `create_owned_quest`; Migration 035 removes the final direct `public.quests` INSERT policy. Quest metadata, cover SET/CLEAR, publication, and deletion remain on their existing dedicated RPC boundaries. `public.quests` retains only its authenticated owner SELECT policy.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Production promotion remains separately gated by the P0 pre-production checklist. Planning only: no migration, policy change, implementation, provider configuration, deployment, commit, or push without explicit approval.
