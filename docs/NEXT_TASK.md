# Next Task

## Milestone

Core MVP Next Milestone Planning

## Next Task

Select the next smallest coherent Core MVP milestone after completion of the teacher task mutation boundaries.

## Objective

Use the current roadmap and architecture to inventory remaining Model A capabilities, separate first-launch needs from post-launch work, and produce one approved implementation plan. Keep P0 production-readiness work separate from feature development.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Production promotion remains separately gated by the P0 pre-production checklist. Planning only: no migration, policy change, implementation, provider configuration, deployment, commit, or push without explicit approval.
