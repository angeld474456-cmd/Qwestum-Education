# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan automated regression coverage for the verified public runtime boundary and browser behavior.

## Next Task

Sprint 12.19.9 - Public Runtime Automated Regression-Test Planning.

Planning-only. Follow analysis -> architecture -> plan -> code after approval. Do not implement tests or application code, create fixture data, apply SQL, or perform live writes without separate explicit approval.

Current state:

- Sprint 12.19.8 completed controlled Single Choice browser/runtime verification for correct, incorrect, unanswered, unknown-option, and foreign-option submissions. The temporary fixture was removed, the original four Text tasks were restored, and the quest returned to its prior published state.
- Public runtime remains anonymous and browser-local, with server-only RPC access, generic invalid-submission behavior, no answer leakage, and no persistent attempts.

Planning topics:

- Analyze the existing runtime service, submit route, runner, and current test tooling before choosing unit, route-level, and browser-level regression boundaries.
- Produce the architecture and exact file-by-file plan for DTO mapping, input validation, no-answer-leak, Single Choice result handling, retry/reset, and duplicate-submit coverage.
- Define fixture ownership and whether local-only fixtures can replace live data. No test or application implementation is authorized by this planning task.

Out of scope:

- Test or application implementation before explicit approval, new RPCs, schema/RLS/Storage changes, persistent attempts/results, authentication, payments, production rate limiting, live data writes, staging, commit, and push.
