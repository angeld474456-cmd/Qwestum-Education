# Next Task

## Milestone

Sprint 12: Public Catalog Launch Readiness

## Next Task

Sprint 12.20.8 - Public Catalog Cover Delivery Planning

Planning-only. Follow analysis -> architecture -> plan -> code after approval. Do not implement application code, tests, or live changes without separate explicit approval.

## Objective

Design a safe public cover delivery boundary for catalog list/detail pages without exposing raw Storage paths or weakening existing Storage/RLS boundaries.

## Planning Topics

- Inspect the current quest-cover storage model and public catalog DTO omissions.
- Compare signed URL, public derived URL, server proxy, and allowlisted media-route approaches.
- Define list/detail delivery needs, caching and expiry, fallbacks, path validation, ownership/publication eligibility, and rollout/rollback.
- Define migration, API, service, UI, test, and browser-verification impact without implementing it.
- Avoid live changes until separately approved.

## Out Of Scope

- Implementation, migration creation/application, Storage policy changes, public bucket changes, and direct SQL/RPC.
- Student authentication/profile/cabinet/history, persistent attempts, assignments, payments, production deployment, package changes, commit, and push.
- Any live Storage, policy, schema, or data change; each requires separate explicit approval.
