# Next Task

## Milestone

Sprint 12: Public Catalog Launch Readiness

## Next Task

Sprint 12.20.15A - Shared Submit Limiter Provider and Client Identity Selection

Planning-only. Follow analysis -> architecture -> plan -> code after approval. Do not implement application code, tests, or live changes without separate explicit approval.

## Objective

Select the concrete production-compatible shared limiter backend and trusted client-identity strategy for `POST /api/public/quests/[id]/submit` before implementation.

## Planning Topics

- Compare currently supported Vercel-compatible shared rate-limit options and prefer minimal operational complexity.
- Determine whether an SDK or package is necessary and identify the trusted Vercel client-IP behavior from official documentation.
- Define local and preview behavior, IPv4/IPv6 normalization, privacy-preserving HMAC identity, TTL/state model, provider failure behavior, and final rate values.
- Define environment-variable names only, test seams requiring no live external service, and the smallest implementation scope.

## Out Of Scope

- Limiter implementation, provider provisioning, Vercel configuration, environment changes, package changes, UI redesign, deployment, and application code.
- Supabase, Storage, SQL, migrations, auth, publication, runtime, student systems, persistent attempts, assignments, payments, commit, and push.
