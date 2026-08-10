# Next Task

## Milestone

P1 Post-Launch Observability and Rollback Baseline Review

## Next Task

Perform a read-only review of the first Production release observability, current deployment identity, and documented rollback target. Do not change application, provider, deployment, or content state without separate approval.

## Objective

Establish the first post-launch operational baseline after the successful Production release while preserving the Model A boundary and keeping later Core MVP work separate.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained.
- Migration 034 makes creation RPC-only through `create_owned_quest`; Migration 035 removes the final direct `public.quests` INSERT policy. Quest metadata, cover SET/CLEAR, publication, and deletion remain on their existing dedicated RPC boundaries. `public.quests` retains only its authenticated owner SELECT policy.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Controlled Preview submit-rate-limit verification is complete: an authorized same-identity/same-quest sequential test accepted normal traffic and returned the fixed no-store `429` on attempt 62 with `Retry-After: 15`; no `503`, header manipulation, concurrency, or Production traffic occurred. No timeout change is required from this evidence.
- Production Auth and environment configuration are complete: the shared Supabase Auth Site URL is `https://qwestum-education.vercel.app`; the deployment-specific Preview, stable branch Preview, and Production callbacks are allowlisted; and all six application runtime variables have distinct Production-scope entries while Preview remains unchanged.
- Preview and first-launch Production intentionally share the existing Supabase project and Upstash database. Production uses a newly generated distinct `RATE_LIMIT_HMAC_SECRET`, producing separate opaque limiter identifiers; shared quota, outage, and credential-operational risk remain accepted first-MVP constraints. Every Preview database write is therefore a live shared-database write.
- The first intentional Production release is complete: PR #1 merged RC `86aaeae1ad7db2aaee99dd969cf58ea3ba4f4138` through merge commit `bfe773a66024d60d6824209290f5990d9c551225`, then passed Production smoke verification after correcting the Production Supabase Project URL value. The initial `/catalog` failure formed `/rest/v1/rest/v1/rpc/list_public_catalog_quests`; no application code or schema change was needed. The public catalog intentionally remains empty because test/demo quests were unpublished before release.
- Next is read-only **P1 Post-Launch Observability and Rollback Baseline Review**. Do not make provider, deployment, migration, policy, implementation, commit, or push changes without explicit approval.
