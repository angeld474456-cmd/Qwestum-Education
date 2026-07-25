# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the safe transition from public quest detail to a future student runtime.

## Next Task

Sprint 12.19.6 - Public Quest Detail-to-Student Runtime Planning.

Planning-only. Follow analysis -> architecture -> plan. Do not implement application code, apply SQL, or perform live writes without separate explicit approval.

Current state:

- Migration version `20260724204657` supplies the allowlisted public catalog RPC boundary. Sprint 12.19.5 now consumes it through server-only `/catalog` and `/catalog/[id]` routes.
- Public catalog access remains metadata-only: no owner data, cover path, task data, answers, hints, points, scoring, or student runtime is exposed. Only published quests with at least one task appear.
- Catalog supports search, subject, one grade, difficulty, and capped offset pagination. Language/category/tag filtering and totals remain deferred.

Planning topics:

- Inspect the teacher-only `QuestRunner`, task renderers, task DTOs, and public detail route to identify data that must never cross a future student boundary.
- Define a sanitized public/student task DTO and delivery architecture without reusing teacher task services or the current answer-bearing runtime payload.
- Plan public detail-to-start routing, authentication requirements, safe local return paths, publication/taskless withdrawal behavior, and generic not-found handling.
- Define loading, error, empty, unavailable, and runtime completion-state requirements plus anonymous/authenticated verification coverage.
- Preserve the catalog DTO denylist, cover omission, current direct-table denial, and separation from teacher Preview/Play.

Out of scope:

- Application implementation, task/start routes, student runtime, new RPCs, schema/RLS/Storage changes, task exposure, attempts/results, live data writes, staging, commit, and push.
