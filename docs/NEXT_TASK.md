# Next Task

## Milestone

P0 Pre-Launch Public Catalog and Release Candidate Audit

## Next Task

Perform a read-only inventory of every currently Public quest, identify test/demo/verification content, and classify each item as launch-approved or requiring unpublication. Do not mutate data without explicit approval; then prepare final tests/build and release-candidate pinning.

## Objective

Close the remaining shared-data launch-preparation gap without deploying, sending Production traffic, or selecting a new Core MVP feature. Keep Model A and later Core MVP planning separate.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained.
- Migration 034 makes creation RPC-only through `create_owned_quest`; Migration 035 removes the final direct `public.quests` INSERT policy. Quest metadata, cover SET/CLEAR, publication, and deletion remain on their existing dedicated RPC boundaries. `public.quests` retains only its authenticated owner SELECT policy.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Controlled Preview submit-rate-limit verification is complete: an authorized same-identity/same-quest sequential test accepted normal traffic and returned the fixed no-store `429` on attempt 62 with `Retry-After: 15`; no `503`, header manipulation, concurrency, or Production traffic occurred. No timeout change is required from this evidence.
- Production Auth and environment configuration are complete: the shared Supabase Auth Site URL is `https://qwestum-education.vercel.app`; the deployment-specific Preview, stable branch Preview, and Production callbacks are allowlisted; and all six application runtime variables now have distinct Production-scope entries while Preview remains unchanged. No Production deployment or traffic occurred.
- Preview and first-launch Production intentionally share the existing Supabase project and Upstash database. Production uses a newly generated distinct `RATE_LIMIT_HMAC_SECRET`, producing separate opaque limiter identifiers; shared quota, outage, and credential-operational risk remain accepted first-MVP constraints. Every Preview database write is therefore a live shared-database write.
- Production promotion remains blocked by the mandatory public-catalog/publication audit, final tests/build against an approved release candidate, release-candidate/PR-to-`main` approval, first intentional Production deployment, source SHA/alias verification, Production smoke verification, formal rollback target, and observability baseline review. No provider, deployment, migration, policy, implementation, commit, or push action is approved by this handoff.
