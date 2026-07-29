# Next Task

## Milestone

Sprint 12: Teacher Experience / Public Publication Lifecycle

## Next Task

Sprint 12.20.5 - Public Catalog Publication Lifecycle Regression Verification Planning

Planning-only. Follow analysis -> architecture -> plan -> code after approval. Do not implement tests or application code, apply SQL, or perform live writes without separate explicit approval.

## Objective

Plan controlled verification that teacher publishing and unpublishing correctly affects public catalog list/detail visibility, public runtime start eligibility, and restoration after cleanup.

## Planning Topics

- Identify a safe existing teacher-owned candidate and define a pre-verification snapshot.
- Define a reversible publish/unpublish sequence.
- Verify public catalog list and detail visibility, plus public runtime start eligibility.
- Verify withdrawal after unpublish and restoration after re-publication.
- Define cache expectations, exact cleanup/restoration checks, and a regression matrix.
- Identify future automated contract coverage without implementing tests.

## Out Of Scope

- Any live publish/unpublish mutation; it requires separate explicit approval.
- Application code, tests, migrations, SQL execution, Supabase writes, catalog redesign, and cover delivery.
- Student authentication/profile/cabinet/history, persistent attempts, assignments, payments, production deployment, package changes, commit, and push.
