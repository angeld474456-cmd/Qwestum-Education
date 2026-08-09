# Next Task

## Milestone

Owner-Safe Quest Creation Boundary

## Next Task

Plan the smallest owner-safe database mutation boundary for the remaining direct teacher quest creation INSERT path.

## Objective

Replace the remaining direct teacher quest creation INSERT path only after an approved architecture and migration plan. Keep the current Model A boundary and P0 production-readiness work separate.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained.
- Quest metadata updates are RPC-only through `update_owned_quest_metadata` (Migration 031); cover SET/CLEAR are RPC-only through `set_owned_quest_cover_image` and `clear_owned_quest_cover_image_if_matches` (Migration 032); publication uses `set_owned_quest_publication_state`; and quest deletion is RPC-only through `delete_owned_quest` (Migration 029). Migration 033 removed the final direct `public.quests` UPDATE policy. Quest creation remains the only direct quest-table mutation path, using INSERT.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Production promotion remains separately gated by the P0 pre-production checklist. Planning only: no migration, policy change, implementation, provider configuration, deployment, commit, or push without explicit approval.
