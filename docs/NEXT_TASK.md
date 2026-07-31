# Next Task

## Milestone

Sprint 12: Public Catalog Launch Readiness

## Next Task

Sprint 12.20.12 - Production Deployment Readiness Planning

Planning-only. Follow analysis -> architecture -> plan -> code after approval. Do not implement application code, tests, or live changes without separate explicit approval.

## Objective

Define the smallest controlled path from the verified local application to deployment readiness without changing production infrastructure.

## Planning Topics

- Inventory the current deployment and CI build path, including the now-local font asset boundary.
- Identify required public versus server-only environment boundaries without recording values.
- Review platform/runtime compatibility, health and smoke checks, cache and static-asset behavior, and production build verification.
- Define rate-limit and abuse-control requirements, safe logging/observability expectations, release sequencing, rollback, and post-deploy verification.
- Produce one narrow planning-only recommendation with explicit approval gates for every production change.

## Out Of Scope

- Deployment implementation, configuration/environment changes, secret provisioning, package changes, UI redesign, and application code.
- Supabase, Storage, SQL, migrations, auth, publication, runtime, student systems, persistent attempts, assignments, payments, commit, and push.
