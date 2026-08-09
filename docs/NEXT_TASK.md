# Next Task

## Milestone

P0 Production Deployment / Domain / Protection / Environment Inventory

## Next Task

Perform a read-only inventory of the current Production deployment artifact, domains/aliases, Deployment Protection and WAF posture, and environment-variable scope. Record findings without changing any provider configuration or sending Production traffic.

## Objective

Close the next remaining P0 evidence gap without implementing a feature or mutating Production. Keep the current Model A boundary and later Core MVP planning separate.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained.
- Migration 034 makes creation RPC-only through `create_owned_quest`; Migration 035 removes the final direct `public.quests` INSERT policy. Quest metadata, cover SET/CLEAR, publication, and deletion remain on their existing dedicated RPC boundaries. `public.quests` retains only its authenticated owner SELECT policy.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Controlled Preview submit-rate-limit verification is complete: an authorized same-identity/same-quest sequential test accepted normal traffic and returned the fixed no-store `429` on attempt 62 with `Retry-After: 15`; no `503`, header manipulation, concurrency, or Production traffic occurred. No timeout change is required from this evidence.
- Production promotion remains separately gated by the remaining P0 pre-production checklist: Production artifact/domain/protection inventory, Production Supabase Auth redirect/callback verification, rollback-target verification, final Production smoke checklist, and monitoring/observability baseline. Read-only inventory only: no provider configuration, deployment, migration, policy change, implementation, commit, or push without explicit approval.
