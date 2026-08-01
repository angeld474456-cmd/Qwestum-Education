# Next Task

## Milestone

Sprint 12: Public Catalog Launch Readiness

## Next Task

Sprint 12.20.20 - Pre-Production Readiness Planning

Planning only. No production action, provider configuration change, or deployment modification is approved.

## Objective

Define the smallest controlled pre-production readiness plan from the completed Preview evidence and the remaining explicit launch gates.

## Planning Topics

- Convert verified Preview Auth, teacher/dashboard, logout, public runtime, and provider-backed submit evidence into an exact pre-production checklist.
- Define a safe, separately approved method to obtain live shared-limiter `429` evidence from an authorized Preview context without weakening Deployment Protection.
- Plan the safe disposition of the accidental initial Production deployment artifact, production gating, rollback, cache/proxy review, and Vercel WAF/Firewall assessment.
- Identify any remaining authentication UX follow-up, including the expired-link message, without implementing it in this planning sprint.

## Out Of Scope

- Application implementation, tests, packages, UI redesign, migrations, SQL, Storage, RLS, publication, runtime, student systems, persistent attempts, assignments, payments, production promotion, production-domain rollout, production Auth Site URL changes, WAF enforcement, commit, and push.
- Do not record or expose environment values, keys, tokens, cookies, JWTs, raw identities, limiter keys, or private paths.
