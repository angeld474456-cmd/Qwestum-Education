# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Prepare the approved public-read database migration boundary without applying it.

## Next Task

Sprint 12.19.3 - Public Catalog Read Boundary Migration Planning.

Planning-only. Do not implement application code, apply SQL, or perform a live write without separate explicit approval.

Current state:

- Sprint 12.19.2 passed authoritative read-only live-schema verification. `public.profiles`, `public.quests`, `public.quest_tasks`, and `public.subjects` exist with RLS enabled and FORCE RLS disabled; `public.categories` does not exist. `001_initial_schema.sql` remains incomplete foundational history, and no `supabase_migrations` relation or live migration identifiers were available.
- Current owner RLS remains intact: no anonymous published quest policy and no anonymous task-read policy exist. Broad table ACLs for anon/authenticated/service_role do not expose rows while RLS is correct. No service-role catalog client is approved.
- The selected catalog boundary is two narrow SECURITY DEFINER RPCs, `list_public_catalog_quests()` and `get_public_catalog_quest(uuid)`, returning explicit allowlisted fields only. Both require `is_public IS TRUE` and internal task `EXISTS`; no task row/count, author, subject id, raw cover path, answer, hint, content, scoring, or validation data may be returned.
- Subject name is joined within the RPC. Initial public DTOs omit covers because exposing `cover_image_path` through an RPC is rejected; public Storage and owner UUID paths remain a separate existing disclosure tradeoff.
- Include `quest_tasks(quest_id)` and the partial public catalog ordering index in the first approved migration. Defer subject, difficulty, language, and grade indexes until query plans or scale justify them.
- Preserve task-workspace QA separately: Settings navigation, deletion focus cases, create/reset, API-failure retention, session localization, busy semantics, Save associations, radio-group semantics, and native-confirm decision.

Planning topics:

- Design exact SQL for `public.quest_tasks(quest_id)`, the partial public catalog ordering index, `list_public_catalog_quests()`, and `get_public_catalog_quest(uuid)`.
- Define exact PostgreSQL return types, RPC signatures, deterministic ordering, and any optional filter parameters. Keep initial task-existence checks internal through `EXISTS`.
- Define SECURITY DEFINER owner, fixed `search_path`, schema qualification, explicit output columns, and `REVOKE`/`GRANT` statements; verify PostgREST RPC compatibility and naming has no conflict.
- Prepare migration and rollback SQL plus read-only validation queries, but do not apply or execute them.

Out of scope:

- SQL application, migrations, indexes, views, RPCs, RLS/grant/Storage policy changes.
- Catalog/detail/start routes, API/service implementation, runtime/student work, or publication behavior changes.
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
