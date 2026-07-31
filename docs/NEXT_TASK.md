# Next Task

## Milestone

Sprint 12: Public Catalog Launch Readiness

## Next Task

Sprint 12.20.19 - Preview Auth, Rate-Limit, and Deployment Safety Verification

Planning and controlled verification only. Any provider change, including production-artifact cleanup, Auth redirect configuration, or production promotion, requires separate explicit approval.

## Objective

Close the remaining Preview authentication, limiter, and deployment-safety evidence gaps without promoting the application to production.

## Planning Topics

- Decide the safe disposition of the accidental initial Vercel Production deployment artifact without treating it as a release or changing production traffic without approval.
- Determine the exact Supabase Auth Preview redirect allowlist required for the existing Preview deployment, then separately approve any provider configuration action.
- Verify Preview magic-link/login and callback behavior, authenticated teacher/dashboard flows, and session-expiry behavior without recording credentials or session data.
- Run a controlled shared-limiter `429` verification and confirm safe throttling, no scoring after denial, and no provider or identity leakage.
- Complete the remaining Preview deployment and security review: proxy/auth cost, cache behavior, Vercel WAF/Firewall capability, rollback, and production gating.

## Out Of Scope

- Application implementation, tests, packages, UI redesign, migrations, SQL, Storage, RLS, publication, runtime, student systems, persistent attempts, assignments, payments, production promotion, production-domain rollout, production Auth Site URL changes, WAF enforcement, commit, and push.
- Do not record or expose environment values, keys, tokens, cookies, JWTs, raw identities, limiter keys, or private paths.
