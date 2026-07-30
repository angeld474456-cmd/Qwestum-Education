# Next Task

## Milestone

Sprint 12: Public Catalog Launch Readiness

## Next Task

Sprint 12.20.11 - Production Build Reliability and Local Font Strategy Planning

Planning-only. Follow analysis -> architecture -> plan -> code after approval. Do not implement application code, tests, or live changes without separate explicit approval.

## Objective

Define a controlled approach that allows production builds to succeed without depending on live Google Fonts access.

## Planning Topics

- Inventory all current `next/font` usage and the Geist dependency path.
- Determine whether the repeated failure is network/environmental or configuration-related.
- Compare locally bundled font files, an approved package-provided font source, and documented build-network/cache requirements.
- Analyze licensing and provenance.
- Define cache, CI, accessibility, visual-regression, rollback, and verification requirements.
- Produce a planning-only implementation recommendation.

## Out Of Scope

- Font implementation, font binaries, package/configuration changes, UI redesign, and deployment.
- Supabase, Storage, SQL, migrations, auth, publication, runtime, student systems, persistent attempts, assignments, payments, commit, and push.
