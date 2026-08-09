# Next Task

## Milestone

P0 Production Environment and Auth Configuration Planning

## Next Task

Define the exact Production environment-variable mapping, Supabase Auth URL requirements, safe provider-change order, rollback gate, and smoke gate. Planning only: do not change any provider configuration or send Production traffic.

## Objective

Plan the next remaining P0 configuration work without implementing a feature or mutating Production. Keep the current Model A boundary and later Core MVP planning separate.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained.
- Migration 034 makes creation RPC-only through `create_owned_quest`; Migration 035 removes the final direct `public.quests` INSERT policy. Quest metadata, cover SET/CLEAR, publication, and deletion remain on their existing dedicated RPC boundaries. `public.quests` retains only its authenticated owner SELECT policy.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Controlled Preview submit-rate-limit verification is complete: an authorized same-identity/same-quest sequential test accepted normal traffic and returned the fixed no-store `429` on attempt 62 with `Retry-After: 15`; no `503`, header manipulation, concurrency, or Production traffic occurred. No timeout change is required from this evidence.
- Production inventory is complete: the current Production deployment is stale (`7282256`, from `feature/next-work`) and not an approved launch build; its runtime variables are Preview-only; and the Production domain is absent from Supabase Auth URL configuration. Vercel Standard Protection behavior and the Firewall baseline are verified, but no Production traffic was sent.
- Production promotion remains blocked by Production environment configuration, Supabase Auth Site/Redirect URL readiness, an approved current Production build, Production smoke verification, and a formally established rollback target. Planning only: no provider configuration, deployment, migration, policy change, implementation, commit, or push without explicit approval.
