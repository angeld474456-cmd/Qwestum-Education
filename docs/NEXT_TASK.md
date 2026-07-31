# Next Task

## Milestone

Sprint 12: Public Catalog Launch Readiness

## Next Task

Sprint 12.20.16 - Platform Public GET Abuse Controls and Cache Policy Planning

Planning-only. Follow analysis -> architecture -> plan -> code after approval. Do not implement application code, tests, or live changes without separate explicit approval.

## Objective

Define the production platform protection and cache policy for anonymous GET traffic before creating the first preview deployment.

## Planning Topics

- Inventory `/`, `/catalog`, `/catalog/[id]`, `/catalog/[id]/start`, `/api/public/quests/[id]/cover`, and any other anonymous GET surface.
- Analyze Vercel Firewall/WAF/rate-rule capabilities, bot and volumetric protection, shared-school/NAT behavior, cover bandwidth protection, and whether application-level GET limits are also needed.
- Define CDN and route cache behavior, dynamic versus cacheable responses, negative-response caching, publication-withdrawal freshness, preview versus production behavior, configuration sequence, rollback, and staging verification.

## Out Of Scope

- Vercel configuration, provider provisioning, deployment, application implementation, environment changes, package changes, UI redesign, and live changes.
- Supabase, Storage, SQL, migrations, RLS, auth, publication, runtime, student systems, persistent attempts, assignments, payments, commit, and push.
