# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Implement the approved public catalog read-boundary migration file without applying it.

## Next Task

Sprint 12.19.4 - Public Catalog Read Boundary Migration File Implementation.

Implementation-only. Create the reviewed migration file only; do not apply SQL or perform a live write without separate explicit approval.

Current state:

- Sprint 12.19.3 passed migration planning. The selected boundary is two separate `LANGUAGE sql`, `STABLE`, `SECURITY DEFINER` functions created by `postgres`: `public.list_public_catalog_quests(text, text, integer, integer, text, integer, integer)` and `public.get_public_catalog_quest(uuid)`.
- Both use fixed `SET search_path = pg_catalog, public`, schema-qualified base tables, pg_catalog-qualified helpers, no dynamic SQL/auth.uid()/role switching/temp objects, and the exact public DTO only. They require `q.is_public IS TRUE` plus internal task `EXISTS`, join only subject name, and expose no task row/count, owner, subject id, cover path, answer, hint, content, scoring, validation, or error detail.
- List parameters are search, subject name, grade, difficulty, language, limit, and offset. Search is trimmed, whitespace-normalized, case-insensitive literal title/description matching with `%`, `_`, and `!` escaped. Subject match is normalized case-insensitive exact name; grade is inclusive; limit clamps to 1-100, offset to non-negative; order is `created_at DESC NULLS LAST, id DESC`.
- The first migration will use ordinary transaction-compatible `CREATE INDEX` for `quest_tasks_quest_id_idx` and `quests_public_catalog_created_at_id_idx`; broader filter indexes are deferred. It will use `CREATE FUNCTION`, explicit PUBLIC/anon/authenticated/service_role revokes, and grants only anon/authenticated EXECUTE. No table grants, RLS, Storage, or service-role application logic changes are approved.
- Preserve task-workspace QA separately: Settings navigation, deletion focus cases, create/reset, API-failure retention, session localization, busy semantics, Save associations, radio-group semantics, and native-confirm decision.

Planning topics:

- Create exactly `database/migrations/012_add_public_catalog_read_boundary.sql` with the reviewed two indexes, two SECURITY DEFINER SQL RPCs, explicit signatures/return fields, fixed search path, and exact REVOKE/GRANT statements.
- Perform static SQL and security review: no `SELECT *`, no public base-table/task policy, no table grants, no application data write, no RLS/Storage change, and no function overload.
- Do not write application code or documentation. Do not apply the migration to Supabase. Separate explicit approval is required before live application.

Out of scope:

- Live SQL application, RLS/grant/Storage policy changes, catalog/detail/start routes, API/service implementation, runtime/student work, and publication behavior changes.
- Live data, Storage writes, task-content/type changes, saves/autosaves, or teacher workflow changes.

Required validation for any later implementation:

```powershell
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
git diff --stat
git status -sb
```
