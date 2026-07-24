# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan application-layer consumption of the applied public catalog RPC boundary.

## Next Task

Sprint 12.19.5 - Public Catalog RPC Application Integration Planning.

Planning-only. Do not implement application code, apply SQL, or perform live writes without separate explicit approval.

Current state:

- Migration version `20260724204657` is applied through the linked Supabase CLI. `public.list_public_catalog_quests(text, text, integer, integer, text, integer, integer)` and `public.get_public_catalog_quest(uuid)` provide the allowlisted public catalog boundary.
- The current RPC supports search, subject name, grade, difficulty, language, limit, and offset. It does not implement category or tag filtering.
- Anonymous verification passed for list/detail behavior, DTO boundary, missing-ID zero rows, direct base-table denial, pagination normalization, and deterministic ordering. Verification remains PARTIAL PASS because authenticated smoke testing and independent live ACL/index/RLS/Storage metadata re-inspection were unavailable.

Planning topics:

- Inspect current repository routing, server/client Supabase access patterns, types, and existing quest pages.
- Define a dedicated public catalog service architecture that consumes only the public RPC DTOs.
- Plan catalog list/detail route and page integration without reusing owner-only teacher services or task DTOs.
- Define loading, error, empty, not-found, and unavailable states.
- Map search, subject, grade, difficulty, language, limit, and offset to supported pagination and filtering UX.
- Preserve the cover omission and defer category/tag filtering, student runtime, start flows, and catalog implementation until architecture approval.

Out of scope:

- Application implementation, route creation, public/student runtime, RLS or Storage changes, new RPCs, task exposure, and live data writes.
