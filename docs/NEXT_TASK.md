# Next Task

## Milestone

P1 Public Content Readiness Planning

## Next Task

Choose the smallest safe public-content readiness milestone, beginning with a read-only architecture review of public task-image delivery for image-dependent quests. Do not begin implementation without separate approval.

## Objective

Resume deliberate Core MVP planning after the first Production release while preserving the anonymous-public plus authenticated-teacher Model A boundary.

## Constraints

- Teacher task creation, reorder, deletion, metadata/content updates, and image SET/CLEAR now use owner-safe RPC boundaries; direct `quest_tasks` INSERT, UPDATE, and DELETE policies are absent while SELECT remains retained. M036 makes duplicate normalized choice-option text fail public eligibility; M037 allows intentional `content: null` choice drafts while readiness remains fail-closed until complete valid content exists.
- Migration 034 makes creation RPC-only through `create_owned_quest`; Migration 035 removes the final direct `public.quests` INSERT policy. Quest metadata, cover SET/CLEAR, publication, and deletion remain on their existing dedicated RPC boundaries. `public.quests` retains only its authenticated owner SELECT policy.
- Preserve the current anonymous-public plus authenticated-teacher Model A boundary. Do not prematurely add student identity, attempts/history, assignments, payments, AI generation, exports, or organizations without a separately approved plan.
- Controlled Preview submit-rate-limit verification is complete: an authorized same-identity/same-quest sequential test accepted normal traffic and returned the fixed no-store `429` on attempt 62 with `Retry-After: 15`; no `503`, header manipulation, concurrency, or Production traffic occurred. No timeout change is required from this evidence.
- Production Auth and environment configuration are complete: the shared Supabase Auth Site URL is `https://qwestum-education.vercel.app`; the deployment-specific Preview, stable branch Preview, and Production callbacks are allowlisted; and all six application runtime variables have distinct Production-scope entries while Preview remains unchanged.
- Preview and first-launch Production intentionally share the existing Supabase project and Upstash database. Production uses a newly generated distinct `RATE_LIMIT_HMAC_SECRET`, producing separate opaque limiter identifiers; shared quota, outage, and credential-operational risk remain accepted first-MVP constraints. Every Preview database write is therefore a live shared-database write.
- The first intentional Production release is complete: PR #1 merged RC `86aaeae1ad7db2aaee99dd969cf58ea3ba4f4138` through merge commit `bfe773a66024d60d6824209290f5990d9c551225`, then passed Production smoke verification after correcting the Production Supabase Project URL value. The initial `/catalog` failure formed `/rest/v1/rest/v1/rpc/list_public_catalog_quests`; no application code or schema change was needed. The public catalog intentionally remains empty because test/demo quests were unpublished before release.
- The P1 post-launch operational baseline is documented. The known-good Production rollback deployment is `dpl_146uK8UYRdnFZFPGyDfrKXsfpG4Y` (`qwestum-education-gskc2mem9-qwestum.vercel.app`), Ready/Current in Production from `main` commit `3e500e2642c19252b8c4d79bd40964c4a6f21e81`. The earlier `bfe773a` deployment with the malformed Supabase URL is not a rollback target. For urgent operations, promote this exact known-good Vercel deployment; for a normal code regression, use a reviewed `git revert` on `main`; never force-push or reset `main`. Rollback does not revert database or data state. Schema remains frozen through Migration 035.
- Current Hobby/free monitoring is manual: review Vercel deployment status, runtime logs and basic Observability for `/`, `/catalog`, `/login`, `/auth/callback`, `/auth/logout`, `/dashboard`, `/dashboard/quests`, and public runtime/submit routes. Investigate repeated 5xx, unexpected auth failures, catalog/runtime RPC failures, and submit `503`; `429` is expected only at limiter threshold. The smoke checklist remains `/`, `/catalog`, login, protected dashboard redirect, teacher dashboard/library, logout, and public runtime/submit only when approved public content exists.
