# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan controlled readiness for the remaining public runtime Single Choice verification gap.

## Next Task

Sprint 12.19.8 - Single Choice Runtime Verification Readiness Planning.

Planning-only. Follow analysis -> architecture -> plan -> code after approval. Do not implement application code, create test data, apply SQL, or perform live writes without separate explicit approval.

Current state:

- Sprint 12.19.7 completed the anonymous, browser-local runtime at `/catalog/[id]/start`, its server-only service, bounded submit API, task/result components, and public-detail start CTA. It preserves no direct anonymous table reads, no answer leakage, and no persistent attempts.
- Text-only browser verification passed. Single Choice correct, incorrect, unanswered, whitespace-only, and foreign-option browser flows remain unverified because no eligible public Single Choice quest was available without live-data mutation.

Planning topics:

- Analyze whether an existing eligible public Single Choice quest can safely support verification without changing live data, and document the publication, ownership, and cleanup constraints.
- Produce the architecture and exact verification plan for correct, incorrect, unanswered, whitespace-only, and foreign-option submissions. Keep answer keys server-side and retain generic invalid/unavailable behavior.
- Define the approval boundary for any future controlled test-data creation, publication change, or cleanup. No application implementation is authorized by this planning task.

Out of scope:

- Code implementation before explicit approval, new RPCs, schema/RLS/Storage changes, persistent attempts/results, authentication, payments, production rate limiting, live data writes, staging, commit, and push.
