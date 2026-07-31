# Next Task

## Milestone

Sprint 12: Public Catalog Launch Readiness

## Next Task

Sprint 12.20.18 - Controlled Upstash and Vercel Preview Provisioning

Provider-action planning and controlled execution only. Each provisioning, configuration, and deployment action requires separate explicit approval.

## Objective

Prepare and execute the first controlled preview environment needed to verify already-implemented launch boundaries without promoting to production.

## Planning Topics

- Phase A, read-only preflight: determine Vercel account/project and Upstash Marketplace state, verify branch/build, inventory environment-variable names only, verify Supabase Auth redirect requirements, and prepare rollback/smoke checks.
- Phase B, only after explicit approval: create a preview-specific Upstash Redis resource and configure preview-only limiter variable values without recording values; keep production separate.
- Phase C, only after explicit approval: connect the repository/branch to a Vercel preview project/environment, pin the approved Node runtime, and configure values only through a provider-secure mechanism.
- Phase D, only after explicit approval: deploy preview and verify build, trusted client-IP signal, shared limiter and safe 429/503 behavior, auth callback, catalog/detail/start/cover, `/test` 404, teacher auth/dashboard, proxy/auth cost, and cache headers.
- Phase E, review only: no production promotion, production domain, production Supabase Auth Site URL change, legacy-key disablement, or WAF enforcement.

## Out Of Scope

- Application implementation, tests, packages, UI redesign, migrations, SQL, Storage, RLS, publication, runtime, student systems, persistent attempts, assignments, payments, production promotion, production-domain configuration, WAF enforcement, commit, and push.
- Do not record or expose environment values, keys, tokens, cookies, JWTs, raw identities, limiter keys, or private paths.
