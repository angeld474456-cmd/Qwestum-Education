# Changelog

## Sprint 12.20.27 - Owner-Safe Teacher Task Deletion Boundary

- Added live, metadata-verified Migration 023 and the server-only `delete_owned_quest_task(p_quest_id, p_task_id)` path. The authenticated owner-safe RPC locks the parent quest before child work, validates membership, and makes the final-Public-task guard authoritative under the same lock, removing the prior route-side count-then-delete race.
- Added live, policy-verified Migration 024, which removes only `Teachers can delete tasks for own quests`. `public.quest_tasks` remains RLS-enabled with SELECT and UPDATE policies present and direct authenticated INSERT and DELETE policies absent. The deletion service calls the RPC once with only IDs and strictly validates its fixed outcomes.
- Hardened post-delete canonical image cleanup: it starts only after confirmed database deletion and is one-shot best-effort, so returned Storage errors and thrown cleanup exceptions preserve the successful response with `storageDeleted: false` rather than returning a misleading `500`.
- Verified by focused 2-file/16-test and full 25-file/214-test suites, lint, build, and `git diff --check`; browser checks passed for Draft/non-final-Public deletion, final-Public-task blocking, and two-tab concurrent deletion of a two-task Public quest, leaving exactly one task. No PATCH, image route, public runtime, catalog, scoring, Storage policy, Auth, or provider boundary changed.

## Sprint 12.20.26 - Teacher Task Creation Boundary Enforcement

- Added live, policy-verified Migration 022, which removes only the legacy authenticated `public.quest_tasks` INSERT policy, `Teachers can insert tasks for own quests`. RLS remains enabled; the existing SELECT, UPDATE, and DELETE policies remain unchanged, and no replacement direct INSERT policy exists.
- Task creation is now enforced through the authenticated owner-safe `public.create_owned_quest_task(...)` boundary from Migration 021. Its internal `auth.uid()` check, task cap, and append ordering remain authoritative; Migration 020 reorder and existing teacher PATCH/DELETE behavior are unchanged.
- Post-migration Text, Single Choice, and Multiple Choice UI creation passed. The full 23-file/198-test suite, lint, build, and `git diff --check` passed. No public runtime, catalog, scoring, Storage, Auth, or provider boundary changed.

## Sprint 12.20.25 - Teacher Task Creation Ordering Concurrency Hardening

- Replaced the teacher task-create route's race-prone count-plus-one/direct-insert path with the server-only `create_owned_quest_task` boundary backed by live, metadata-verified Migration 021. The authenticated owner-only RPC locks the owned parent quest first, then its child tasks, which serializes concurrent creates and remains compatible with Migration 020 reorders.
- The RPC enforces the authoritative 100-task cap, accepts no client-controlled owner, media, or sort position, and returns fixed outcome rows for the application boundary: owner-safe not-found, deterministic task-limit `409`, and generic handling for malformed, unknown, multi-row, or database-error outcomes.
- Legacy nullable ordering is normalized only when needed, preserving `sort_order ASC NULLS LAST, id ASC`; an `INT_MAX` maximum follows the same normalization path before arithmetic. Otherwise it appends at `MAX(sort_order) + 1`, so every newly created task reads last.
- Verified by focused 2-file/9-test and full 23-file/198-test suites, lint, build, and `git diff --check`. Browser verification passed for all three task types, refresh and reorder persistence, and two-tab creation; controlled read-only evidence showed sequential positions 7 and 8. No public runtime, catalog, scoring, RLS, Storage, Auth, or provider boundary changed.

## Sprint 12.20.24 - Teacher Task Ordering

- Added live Migration 020 and the owner-safe atomic `public.reorder_owned_quest_tasks(uuid, uuid[])` boundary. It locks the owned quest and tasks, validates the full unique task membership, and normalizes `sort_order` to contiguous `1..N` values.
- Added accessible teacher Move Up/Move Down controls with pessimistic persistence, synchronous rapid-click protection, selected-task stability, and deterministic `sort_order ASC NULLS LAST, id ASC` task reads across teacher/public flows.
- Verified by focused 2-file/8-test and full 21-file/189-test suites, lint, build, `git diff --check`, and browser checks for persistence, boundaries, selection, Preview/Play/Public Start order, and rapid clicks. No public DTO, content, media, answer-key, or scoring contract changed.

## Sprint 12.20.23 - Multiple Choice Task Type

- Added teacher-authored `multiple_choice` tasks with ordered `{ id, text }` options and `correctOptionIds`, shared fail-closed validation, readiness support, teacher Preview/Play selection, public checkbox rendering, and structural `selectedOptionIds` submit validation.
- Migration 019 is live and metadata-verified. Its authoritative public runtime scorer uses exact-set comparison: reordered exact selections are correct; missing or extra selections are incorrect; empty selections are unanswered; no partial credit is awarded.
- Verified 19 test files / 181 tests, lint, build, and `git diff --check`; local teacher/public browser checks passed. Controlled Preview verification confirmed exact-correct, missing-option incorrect, and empty unanswered results through the deployed submit path without public answer-key exposure.
- Localhost scoring can fail closed with the existing limiter `503` before the RPC when trusted identity or limiter prerequisites are unavailable; this is infrastructure context, not a Multiple Choice defect. Dedicated task-route Supabase-chain mocks and dedicated MC readiness fixtures remain accepted non-blocking coverage gaps.

## Teacher Quest Library Text Search

- Completed as PASS in commit `4d930ac` (`Add teacher quest library search`). `/dashboard/quests` now accepts a normalized URL-driven `q` parameter that searches only the existing owner-scoped quest list by title or description, case-insensitively, and combines with Category/Tag filters using AND semantics.
- Reset returns exactly to `/dashboard/quests`, clearing `q`, category, and tag; the form remounts from URL-derived state so uncontrolled fields cannot retain stale visual values. Focused tests, 15 test files/147 tests, lint, build, `git diff --check`, and manual browser verification passed. No route, API, database, Storage, provider, or deployment change was made.

## Public Quest Sharing UX

- Completed as PASS in commit `4cf5922` (`Add public quest sharing`). Confirmed Published teacher quests and valid public detail pages provide a keyboard-accessible Copy public link control for the same-origin canonical `/catalog/{questId}` URL; Draft or unpublished quests do not expose it, and `/catalog/{questId}/start` is never shared.
- Copy feedback is fixed and polite; browser or clipboard errors are not exposed. No social integration, QR code, analytics, short-link, invite, route, API, database, Storage, provider, or deployment change was made. Build, lint, `git diff --check`, and 14 test files/144 tests passed; manual browser verification passed.

## Sprint 12.20.20 - Pre-Production Readiness Planning

- Completed as **PASS - PRE-PRODUCTION READINESS PLAN DEFINED**. Continued MVP development is approved; Production promotion is not approved. Mandatory pre-production gates remain controlled authorized Preview `429` evidence, Vercel Production artifact/domain/protection inventory, Production Supabase Auth redirect review, exact rollback deployment identification, and an explicitly approved final promotion smoke plan.
- The accidental initial Production deployment remains a provisioning artifact and should stay untouched until a separately approved release decision. The preferred `429` method is sequential ordinary requests from an already authorized Preview browser DevTools context, stopping at the first `429` without identity manipulation, header spoofing, Redis access, or protection changes.
- Proxy/auth cost review is P1: broadly matched public routes currently incur `auth.getUser()` work. Current dynamic/no-store behavior is correctness-safe and conservative. Provider Firewall/WAF capability review and a documented baseline protection decision remain required before launch; expired magic-link messaging is safe P1 polish.

## Sprint 12.20.19 - Preview Auth, Rate-Limit, and Deployment Safety Verification

- Completed as PASS WITH DEFERRED LIVE 429 EVIDENCE. Preview magic-link/callback, authenticated dashboard and teacher workspace, logout, and protected-route enforcement passed. Public routes remain anonymous; unsafe callback destinations still fall back to `/dashboard`.
- Shared submit limiter review and focused verification passed: validation runs before limiting, limiting before scoring, `429` and fail-closed `503` remain generic no-store responses with `Retry-After`, and scoring does not run after either limiter outcome. Focused tests passed 3 files/18 tests. Browser Preview submit produced both successful `200` and fail-closed `503` observations.
- Live `429` evidence is deferred to the pre-production checklist because external Vercel Preview protection intercepted Codex execution-context requests before application handling. No Preview protection was weakened, and no Production promotion or provider/deployment mutation occurred. The expired magic-link message is a non-blocking future UX follow-up.

## Sprint 12.20.18 - Controlled Upstash and Vercel Preview Provisioning

- Completed controlled Preview provisioning for Vercel project `qwestum-education`: the repository is connected, `main` remains the Production branch, `feature/next-work` has a Preview deployment, and a separate Preview Upstash Redis database serves the shared submit limiter. Approved Preview environment-variable names were configured without recording values.
- Corrected Preview-only formatting issues and commit `147246d` (`Fix Vercel client IP header for submit limiter`) now trusts only `x-forwarded-for`. Final fresh Preview smoke verification passed for public catalog/detail/start, `/test` normal not-found behavior, and provider-backed public submit through a successful Text `not_scored` result. The full suite passed 13 files/140 tests; lint and build passed.
- The initial Vercel CLI-created Production deployment is recorded only as a temporary provisioning artifact, not a production launch. No promotion, production domain rollout, production Supabase/Auth change, or production traffic approval occurred.

## Sprint 12.20.17 - Public Debug Route Removal and Anonymous Surface Verification

- Removed the reachable `/test` debug page; `/test` now returns normal not-found behavior. Added anonymous-surface regression coverage against public/debug route and raw Supabase row/error serialization regressions.
- Focused checks passed 2 tests; the full suite passed 13 files/140 tests, with lint and build passing. Local `/test`, catalog, and linked public-detail smoke checks returned the expected safe statuses. `proxy.ts` was unchanged. Commit `e49d6fd` was pushed.

## Sprint 12.20.16 - Platform Public GET Abuse Controls and Cache Policy Planning

- Completed planning: prefer Vercel platform/WAF protection for anonymous GET traffic and defer hard per-IP GET limits because of school/classroom NAT. Catalog/detail remain dynamic, start remains no-store, and cover success remains private for 60 seconds; no stale-while-revalidate is approved for publication-sensitive responses.
- Vercel account/WAF verification, proxy/auth cost measurement, provider provisioning, secure environment configuration, preview deployment, and deployed limiter/trusted-header verification remain incomplete.

## Sprint 12.20.15A and 12.20.15B - Shared Public Submit Limiter

- Selected and implemented a server-only Upstash Redis limiter for `POST /api/public/quests/[id]/submit` using `@upstash/redis` and `@upstash/ratelimit`. Sprint 12.20.18 superseded the original trusted-header choice: it now trusts only Vercel `x-forwarded-for`, canonicalizes IPv4/IPv6 identity, uses opaque HMAC-SHA-256 keys, and fails closed for invalid identity, configuration, provider, and timeout conditions.
- Both token buckets must allow before scoring: client capacity 75/refill 60 per minute and client-plus-quest capacity 60/refill 45 per minute. Fixed no-store `429` and `503` responses expose no identity, provider, request-body, or answer data. Focused tests passed 3 identity, 5 limiter, and 10 route cases; the full suite passed 12 files/138 tests with lint and build passing. Commit `0605136` was pushed.
- Sprint 12.20.18 later completed separate Preview Upstash/Vercel provisioning and successful submit verification without committing values. Controlled `429` verification, Preview auth/teacher verification, WAF/rate rules, and all production controls remain incomplete.

## Sprint 12.20.14 - Public Endpoint Rate-Limit and Abuse-Control Planning

- Identified `POST /api/public/quests/[id]/submit` as the highest-priority application abuse boundary despite its existing JSON/content-type, 32 KiB body, 100-answer, and exact-shape limits. Planned hybrid platform GET protection plus a shared/distributed submit limiter; in-memory production limiting is not acceptable.
- The provisional selection was completed and implemented by Sprint 12.20.15A and 12.20.15B above.

## Sprint 12.20.13 - Auth Callback Redirect Hardening

- Hardened `GET /auth/callback` to accept validated same-origin local paths only. External, malformed, protocol-relative, raw or encoded backslash, control-character, and parser-normalization destinations now fall back to `/dashboard`.
- Focused callback tests passed 23 cases; the full suite passed 127 tests; lint, build, and manual verification passed. Commit `a268817` was pushed.

## Sprint 12.20.12 - Production Deployment Readiness Planning

- Selected Vercel as the primary deployment recommendation, with a Node-compatible managed host such as Render as fallback. Production build health is verified, but deployment remains blocked until launch-readiness controls are completed.
- Recorded required environment names only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Legacy JWT-based anon-key migration remains separate controlled work.

## Sprint 12.20.11 - Production Build Reliability and Local Geist Font

- Replaced `next/font/google` Geist with `next/font/local` and the official Vercel Geist variable font, preserving `--font-sans`, `display: "swap"`, and weights `100 900`. Added the licensed font, exact SIL Open Font License 1.1 text, and a provenance record for `vercel/geist-font` `v1.7.1` / `8b8b75fa63e339db10a3cd52fb28536615b5cc63` with SHA-256 `2FFEBE993E969069A9789D15164B7715D42491B5835516C5E3B935D5F81B05F1`.
- Verified 9 test files / 104 tests, lint, and a production build without live Google Fonts access. Manual checks passed for public and teacher routes, Cyrillic normal/bold rendering, visual stability, and no browser Google-font requests.
- A one-time ignored stale `.next` Turbopack cache issue was resolved locally by cache removal and dev-server restart; it required no source correction. No package, configuration, API, DTO, runtime, Supabase, Storage, SQL, migration, or deployment change occurred. Commit `96adcfb` was pushed.

## Sprint 12.20.10 - Public Catalog Empty, Loading, and Error UX

- Added distinct empty, filtered no-result, and nonzero-offset no-more-result catalog states with targeted local navigation; loading, detail not-found, detail error, and public start state UI now share safe accessible conventions through `PublicCatalogState`.
- Verified manually for catalog filters/reset, zero states, navigation, malformed query normalization, unavailable-detail focus, responsive layout, and independent cover fallback. Automated verification passed: 9 test files, 104 tests passed, 0 failed; lint and `git diff --check` passed.
- Clean production build retries are externally blocked only by the Google Fonts Geist fetch. No TypeScript, Next.js route-boundary, lint, or application-code error was reported; no API, DTO, auth, publication, Supabase, Storage, migration, package, deployment, or configuration boundary changed.

## Sprint 12.20.9B - Public Catalog Cover Delivery

- Applied and verified Migration 016, adding the narrow service-role-only public cover resolver. Catalog list/detail output now provides `has_cover` only; no raw Storage path is public.
- Added the same-origin `GET /api/public/quests/[id]/cover` delivery boundary, server-only cover resolution/download validation, catalog list/detail cover rendering, and a stable 16:9 fallback.
- Verified catalog/detail covers, public start continuity, safe headers and 404s, fallback recovery, unpublish withdrawal, republish restoration, and original-state restoration. Automated verification passed: 9 test files, 104 tests passed, 0 failed; lint and build passed.
- No bucket conversion, Storage-policy change, cover-object mutation, quest metadata/task change, persistent attempt, payment, or deployment capability was added. The local `sb_secret_...` key is server-only and verified without recording a value; legacy JWT-based browser API keys remain temporary pending a separate controlled `sb_publishable_...` migration.

## Sprint 12.20.6 - Controlled Public Publication Lifecycle Verification

- Verified approved Draft lifecycle for `1a206882-650e-4982-840a-fe6108872cac`: Draft baseline, Publish catalog/detail/runtime visibility, one safe Text-only submit, Unpublish withdrawal, stale-runner safe rejection, republish restoration, and final Draft restoration.
- No answer/task content, Storage object, metadata, task, schema, migration, or repository change occurred; no persistent attempt/history was created.

## Sprint 12.20.2-12.20.3C4 - Teacher Publication Flow

- Centralized catalog/runtime publication eligibility through Migration 014 and `public.is_public_runtime_eligible(uuid)`.
- Added owner-scoped readiness service/API/UI, then applied Migration 015 live as `20260728193030` with `public.set_owned_quest_publication_state(uuid, boolean)`.
- Added the dedicated `POST /api/teacher/quests/[id]/publication` action, removed direct Settings PATCH publication mutation, and added guarded teacher Publish/Unpublish controls.
- Manual verification covered readiness, warnings, blockers, Draft-to-Published, Published-to-Draft, metadata invalidation, and refresh persistence. Automated verification passed: 6 test files, 88 tests passed, 0 failed; lint and build passed.
- No student persistence, payments/entitlements, or production deployment capability was added.

## Sprint 12.19.8 - Single Choice Runtime Verification and Cleanup

- Verified controlled Single Choice runtime outcomes: correct selections earned `2/2` with two correct statuses; incorrect selections earned `0/2` with two incorrect statuses; unanswered selections earned `0/2` with two unanswered statuses; four Text tasks remained `not_scored`.
- Verified unknown and foreign option IDs return the same generic public HTTP `404` unavailable-quest response, with no correct-answer leakage. Browser-local retry/reset remained correct.
- Created two temporary Single Choice tasks through the normal teacher UI, then removed only those tasks after verification. The original four Text tasks and prior published state were restored; no quest deletion or Storage cleanup was required.
- No schema, migration, RLS, Storage, function, grant, or application-code change occurred during verification and cleanup.

## Sprint 12.19.7 - Public Runtime Application Integration

- Added the public `/catalog/[id]/start` route, loading/error states, start CTA, sanitized runtime types, server-only runtime RPC service, bounded anonymous submit API, and public runner, task, and result components.
- Kept the runtime temporary and browser-local: Text results are `not_scored`, Single Choice scoring stays server-side, retry/reset is local, no answer key is revealed, and no attempts are persisted.
- Lint, build, and manual anonymous browser checks passed for the Text-only start, submit, aggregate-only result, local reset, return navigation, catalog, teacher redirect, and dashboard redirect flows.
- Single Choice correct, incorrect, unanswered, and foreign-option browser flows were not manually verified because no eligible public Single Choice quest was available without live-data mutation. The reviewed contracts and components passed static review, lint, and build.
- No live Supabase schema, data, RLS, Storage, migration, or grant change occurred during application-layer implementation.

## Sprint 12.19.6 - Public Runtime Database Boundary

- Added the reviewed source migration `database/migrations/013_add_public_runtime_boundary.sql` and byte-identical CLI delivery migration `supabase/migrations/20260725213130_add_public_runtime_boundary.sql`.
- Applied live version `20260725213130`, creating `public.get_public_runtime_quest(uuid)` and `public.score_public_runtime_quest(uuid, jsonb)` for sanitized anonymous runtime fetch and server-side Single Choice scoring; Text tasks remain `not_scored` and no attempts are persisted.
- Read-only smoke checks confirmed eligible fetch, missing-ID zero rows, allowlisted observed DTO fields, valid exact-ID unanswered scoring, unknown-task zero rows, oversized-payload zero rows, and no anonymous REST data exposure from `quests` or `quest_tasks`.
- No table/data/RLS/Storage/index/application change, rollback, or migration repair occurred. Verification remains partial because the available CLI dump path requires Docker Desktop and no eligible public Single Choice runtime quest was available without mutation; metadata re-inspection and several dataset-dependent cases remain unverified.

## Sprint 12.19.5 - Public Catalog RPC Application Integration

- Added anonymous public catalog routes `/catalog` and `/catalog/[id]`, backed by the new server-only `services/public-catalog.server.ts` public RPC boundary.
- Added the allowlisted public DTO mapping, GET-synchronized search/subject/one-grade/difficulty filters, 25-row fetches with 24 rendered cards, and Previous/Next offset pagination.
- Added a metadata-only public detail page with safe UUID/not-found behavior, fallback visual treatment, and no student runtime/start, task, answer, scoring, owner, or cover-path exposure.
- Added the `Каталог квестов` public Header link, expanded its reliable hit target, and prevented a Next self-link at the `10000` offset cap.
- Lint/build passed. Manual browser verification passed for anonymous catalog/detail access, Cyrillic and Latin search, filters, Reset, `/quests` redirect, dashboard behavior, and the Header link. Pagination beyond the first page could not be live exercised because fewer than 24 eligible public quests exist.
- No live schema, data, RLS, Storage, migration, grant, or Supabase change occurred.

## Sprint 12.19.4 - Public Catalog Read Boundary Migration Application

- Created the standard CLI delivery copy at `supabase/migrations/20260724204657_add_public_catalog_read_boundary.sql`; it is byte-identical to the reviewed `database/migrations/012_add_public_catalog_read_boundary.sql` source.
- Applied live migration version `20260724204657`, introducing `quest_tasks_quest_id_idx`, partial `quests_public_catalog_created_at_id_idx`, and the allowlisted public catalog list/detail RPCs.
- Anonymous verification confirmed public DTO-only list/detail behavior, missing UUID zero rows, direct anonymous `quests` and `quest_tasks` denial, pagination normalization, and deterministic ordering.
- Verification is **PARTIAL PASS**: no safe authenticated context was available, and independent live ACL/index/RLS/Storage metadata re-inspection was incomplete in the available CLI environment.
- Migration 012 made no data-row, RLS, or Storage change.

## Sprint 12.19.3 - Public Catalog Read Boundary Migration Planning

- Completed exact migration and rollback planning without creating a migration file, executing SQL, or changing live data/schema/indexes/functions/grants/RLS/Storage.
- Selected indexed, separate `LANGUAGE sql`, `STABLE`, `SECURITY DEFINER` list/detail RPCs owned by `postgres`, with fixed `pg_catalog, public` search path, explicit DTO-only fields, internal published-plus-task-EXISTS eligibility, subject-name join, and no dynamic SQL/auth.uid()/role switching/temp objects.
- List accepts search, subject name, grade, difficulty, language, limit, and offset. It uses normalized literal case-insensitive search, exact normalized subject matching, inclusive grades, clamped offset pagination, and deterministic `created_at DESC NULLS LAST, id DESC` ordering. Detail returns zero or one approved DTO row.
- Planned objects are ordinary `quest_tasks_quest_id_idx`, partial `quests_public_catalog_created_at_id_idx`, the two functions, and PUBLIC/anon/authenticated/service_role execution revokes followed by anon/authenticated grants. `CREATE FUNCTION` is selected; no table grant, RLS, Storage, public-task, or service-role catalog change is planned.
- **NOT APPLIED - REQUIRES SEPARATE APPROVAL** and **NOT EXECUTED** rollback are recorded. Migration deploys and validates before application callers; separate controlled publish/unpublish verification and task-workspace QA remain required.

## Sprint 12.19.2 - Live Schema and Public Read Boundary Verification

- Passed authoritative manual read-only Supabase metadata verification. The live schema contains RLS-enabled `profiles`, `quests`, `quest_tasks`, and `subjects`, but no `categories`; no relevant catalog view, materialized view, function, or RPC exists. No project file, live data, SQL, schema, RLS, grant, Storage, staging, commit, or push changed.
- Recorded current owner-only RLS, broad ACL interpretation, public `quest-images` disclosure tradeoff, missing `supabase_migrations` history, missing catalog/task indexes, live constraints, and type drift. `getOwnedQuestTasks().select("*")` remains private-only.
- Selected two narrow SECURITY DEFINER RPCs with explicit allowlisted fields, fixed search path, internal subject join and task `EXISTS`, no task rows/counts, and no author/raw-path/answer/content/scoring exposure. Security-invoker view, published base-table policy, service role, and a duplicated catalog table are rejected for MVP.
- Recorded the cover decision: initial public DTO omits covers because raw `cover_image_path` cannot cross a public RPC boundary; fallback covers remain acceptable until safe media delivery is decided.
- **NOT APPLIED - REQUIRES SEPARATE APPROVAL:** plan `quest_tasks(quest_id)`, partial public catalog ordering index, `list_public_catalog_quests()`, and `get_public_catalog_quest(uuid)` with revoked default PUBLIC EXECUTE and grants only to anon/authenticated. **NOT EXECUTED:** rollback removes callers, revokes EXECUTE, drops RPCs/indexes, and rechecks anonymous denial plus teacher owner access.
- Recommendation A: Sprint 12.19.3 prepares migration SQL only. Future read-only verification and separately approved temporary publish/unpublish verification are required; the task-workspace QA backlog remains separate.

## Sprint 12 Teacher Experience

- `36e5d94` Add teacher quest library page.
  - Added `/dashboard/quests`.
  - Loads quests with `getQuests()` and task counts with `getAllQuestTasks()`.
  - Shows title, description, difficulty, Public/Draft from `is_public`, `created_at`, and task count.
- `7b5e7c8` Add teacher preview and play routes.
  - Added `/dashboard/quests/[id]/preview` and `/dashboard/quests/[id]/play`.
  - Preview renders tasks read-only with `TaskRenderer` in `mode="preview"`.
  - Play/Test mounts `QuestRunner`; answers/results are not persisted yet.
- `e9b8466` Add teacher quest settings page.
  - Added `/dashboard/quests/[id]/settings`.
  - Editable fields are `title`, `description`, `difficulty`, and `is_public`.
  - Saves through `updateQuest(id, { title, description, difficulty, is_public })`.
- `640ca49` Add teacher quest workspace navigation.
  - Added `components/dashboard/QuestWorkspaceNav.tsx`.
  - Reused it in settings, preview, and play pages.
  - Task editor intentionally remains at `/quests/[id]/tasks`.
- `226237d` Add workspace navigation to task editor.
  - Added `QuestWorkspaceNav` to `app/quests/[id]/tasks/page.tsx`.
  - Kept the existing `/quests/[id]/tasks` route.
  - Did not create a dashboard task route.
  - Did not refactor editor logic, task components, services, runtime, migrations, or JSONB architecture.
- Sprint 12.6.1 - Teacher Workspace Route Consistency Analysis.
  - Confirmed `/quests/[id]` should remain a legacy/detail route for now.
  - Recommended using dashboard settings as the primary teacher edit route.
  - Recommended keeping `/quests/[id]/tasks` until a dashboard task route is intentionally planned.
- Sprint 12.6.2 - Teacher Library Primary Action Polish.
  - Updated `Open / Edit quest` in `/dashboard/quests` to point to `/dashboard/quests/[id]/settings`.
- Sprint 12.6.3 - Teacher Library Action Cleanup.
  - Removed the duplicate `Settings` action from quest cards.
  - Current library actions are `Open / Edit quest`, `Edit tasks`, `Preview`, and `Play/Test`.
- Sprint 12.7.1 - Breadcrumbs / Page Title Analysis.
  - Decided not to implement breadcrumbs now.
  - Decided not to create a shared `QuestWorkspaceHeader` now.
  - Kept current dashboard page titles as acceptable for MVP.
  - Left task editor title/text unchanged because `/quests/[id]/tasks` is still a legacy route with Russian UI text and mojibake risk.
  - Recommended revisiting shared headers or breadcrumbs only if the dashboard workspace grows.
- Sprint 12.8.1 - Teacher Quest Analytics Analysis.
  - Confirmed MVP analytics should be teacher-only content analytics.
  - Confirmed student attempt/result analytics should wait until answer persistence exists.
  - Recommended using existing `quests` and `quest_tasks` data without migrations.
- `0d903f3` Add teacher library analytics summary.
  - Added compact analytics cards to `/dashboard/quests`.
  - Shows Total quests, Public quests, Draft quests, Total tasks, and Total points.
  - Uses existing `getQuests()` and `getAllQuestTasks()`.
  - Added no routes, migrations, services, runtime/editor changes, task editor changes, or JSONB inspection.
- Sprint 12.9.1 - Attempt Persistence / Student Analytics Analysis.
  - Decided not to implement attempt persistence yet.
  - Decided not to create Supabase migrations, attempt services, routes, or runtime persistence yet.
  - Teacher Test Mode should remain local-only for now.
  - Future persistence should focus on real student attempts after auth, privacy, RLS, and schema decisions.
  - Documented future `quest_attempts` and `quest_attempt_answers` table shapes as deferred architecture.
- Sprint 12.10.1 - Auth / RLS Boundaries Analysis.
  - Confirmed the project has early auth pieces, including `lib/supabase.ts`, `components/auth/LoginForm.tsx`, role types in `types/user.ts`, and `author_id` in `types/quest.ts`.
  - Confirmed dashboard routes do not currently enforce session, role, or quest ownership.
  - Confirmed current quest services are broad/id-based: `getQuests()` selects all quests, and `getQuest(id)`, `updateQuest(id)`, and task helpers do not enforce owner checks at service level.
  - Confirmed `app/quests/new/page.tsx` creates quests without setting `author_id`.
  - Recommended active MVP roles of teacher and student, with admin and school/organization roles deferred.
  - Recommended designing ownership and RLS before real student attempts or private teacher analytics are implemented.
- Sprint 12.11.2 - Supabase Schema / RLS Audit.
  - Ran a read-only live Supabase probe with the configured anon client.
  - Confirmed live `quests` is anon-readable, has 3 visible rows, includes `author_id`, and all visible quests have `author_id IS NULL`.
  - Confirmed live `quest_tasks` is anon-readable and has 10 visible rows.
  - Confirmed live `quest_tasks.content` does not exist, which conflicts with local migration/code/runtime expectations.
  - Confirmed broad anon reads are currently possible for `quests` and `quest_tasks`, meaning RLS is either disabled or policies allow broad anon reads.
  - Storage bucket/policy state for `quest-images` remains unconfirmed.
  - Recommended schema repair planning before auth/ownership code changes.
- `57b8438` Add quest task content migration.
  - Added `database/migrations/003_add_quest_task_content.sql` as a forward repair migration.
  - The migration was manually applied in live Supabase after commit.
  - Verified `public.quest_tasks.content` exists and is readable as JSONB.
  - Verified existing 10 visible `quest_tasks` rows currently have `content = null`.
  - Lint, production build, and schema health checks passed during verification.
- `0941973` Add single choice task creation option.
  - Updated task creation to expose only implemented MVP task types: `text` and `single_choice`.
  - Kept `text` as the default task type.
  - Manually verified single-choice creation, `SingleChoiceTaskEditor` loading, option saving, correct answer saving, and refresh persistence.
  - Lint and production build passed before commit.
- `2dd71ac` Add Supabase SSR session foundation.
  - Added SSR-compatible Supabase session handling.
  - Protected `/dashboard` with authenticated session checks.
- `431cf37` Disable unimplemented dashboard links.
  - Disabled sidebar links for unimplemented dashboard sections to avoid 404 navigation.
- `f59764d` Add owner scoped dashboard reads.
  - Scoped Teacher Quest Library, Preview, and Play/Test reads to owned quests.
- `4af5a31` Add owner safe quest creation and settings.
  - Quest creation now sets `author_id` from the authenticated server session.
  - Settings save matches both quest `id` and `author_id`.
- `887cfd6` Add owner safe task CRUD.
  - Task editor initial loading is owner-scoped.
  - Task create/update/delete use authenticated server routes.
  - Task ownership is verified through the parent quest.
- `b6564c0` Remove legacy browser quest reads.
  - `/quests` redirects to `/dashboard/quests`.
  - `/quests/[id]` redirects to `/dashboard/quests/[id]/preview`.
  - Removed legacy browser-side quest/task table helpers from active flows.
- Sprint 12.15.3 - Harden Quests and Quest Tasks RLS.
  - Added `database/migrations/004_harden_quest_rls.sql`.
  - Applied the migration manually in live Supabase.
  - Removed broad public `quests` and `quest_tasks` policies.
  - Added authenticated owner policies for `quests` SELECT, INSERT, and UPDATE.
  - Added authenticated owner-derived policies for `quest_tasks` SELECT, INSERT, UPDATE, and DELETE.
  - Confirmed no public or anon policies remain on `quests` or `quest_tasks`.
  - Confirmed `quests` has no DELETE policy, so quest deletion remains unavailable.
  - Read-only smoke tests passed for dashboard library, settings, task editor, preview, and play/test.
  - Storage upload remains unchanged and is the next ownership/security gap.
- Sprint 12.15.4a - Owner-Safe Storage Upload Boundary.
  - Added authenticated task image upload route at `/api/teacher/quests/[id]/tasks/[taskId]/image`.
  - Removed direct browser Supabase Storage upload from the task editor image flow.
  - New uploads use `teachers/{userId}/quests/{questId}/tasks/{taskId}/{uuid}.{ext}` paths.
  - Uploads verify quest ownership and task relation before Storage writes.
  - Server validation allows JPEG, PNG, and WebP images up to 5 MB.
  - Added and manually applied `database/migrations/005_harden_quest_image_storage.sql`.
  - Preserved public read for `quest-images`, removed public INSERT/UPDATE/DELETE, and added authenticated owner-prefixed INSERT.
  - Confirmed one owner-safe image upload works and displays in the task editor, Teacher Preview, and Teacher Play/Test.
  - Added runtime task image rendering for text and single-choice tasks.
  - Legacy `tasks/{uuid}` objects remain unchanged.
  - Deferred private bucket/signed URLs, magic-byte MIME validation, image removal, old image cleanup, and cleanup when deleting a task.
- Sprint 12.15.5a - Owner-Safe Task Image Removal.
  - Added authenticated owner-safe task image removal through `/api/teacher/quests/[id]/tasks/[taskId]/image`.
  - Browser removal sends no object path or image URL.
  - DELETE route verifies authenticated user, owned quest, and task relation.
  - The task `image_url` is cleared before best-effort Storage deletion.
  - Compare-and-clear protection prevents clearing a newer image URL saved concurrently; conflicts return HTTP 409 and skip Storage deletion.
  - Repeated removal is idempotent.
  - Added and manually applied `database/migrations/006_add_owner_quest_image_delete_policy.sql`.
  - Authenticated owner-prefixed Storage DELETE policy is active; public Storage DELETE remains disabled.
  - Only paths shaped as `teachers/{userId}/quests/{questId}/tasks/{taskId}/{filename}` are eligible for deletion.
  - Legacy `tasks/{uuid}` objects are never deleted.
  - Live removal was verified in the task editor, Teacher Preview, and Teacher Play/Test.
  - Deferred automatic cleanup when replacing an image, cleanup when deleting a task, private bucket/signed URLs, magic-byte MIME validation, and legacy object migration.
- Sprint 12.15.5b - Safe Image Replacement Cleanup.
  - Added a canonical server-only owner-scoped image URL parser.
  - Replacement cleanup reads the previous `image_url` server-side.
  - The new `image_url` is saved before old object cleanup is attempted.
  - Previous objects are deleted only when they match the authenticated user, quest, and task path.
  - Browser replacement sends no previous URL or object path.
  - Legacy `tasks/{uuid}` objects are never deleted.
  - Cleanup failure is non-blocking and does not fail a successfully saved replacement.
  - Explicit image removal behavior remains intact.
  - Live replacement was verified in the task editor, Teacher Preview, and Teacher Play/Test.
  - The new owner-scoped object remained, the previous owner-scoped object was removed, and legacy objects remained unchanged.
  - Concurrent replacements may still orphan an intermediate object.
  - Deferred cleanup when deleting a task, private bucket/signed URLs, magic-byte MIME validation, and legacy object migration.
- Sprint 12.15.5c - Task Delete Image Cleanup.
  - Task DELETE now returns the deleted row `id` and `image_url`.
  - The database row is deleted before best-effort Storage cleanup.
  - Cleanup uses only the deleted row's server-returned `image_url`.
  - The canonical server-only owner-scoped parser is reused.
  - Only paths matching the authenticated user, quest, and task are eligible for deletion.
  - Browser task deletion sends no image URL or object path.
  - Legacy `tasks/{uuid}` objects are never deleted.
  - Cleanup failure is non-blocking.
  - No migration or UI change was required.
  - Live verification confirmed a temporary task was deleted through the UI, the task row was removed, the exact owner-scoped Storage object was removed, legacy objects were unchanged, and the editor remained functional.
  - Upload-before-failed-PATCH races may still orphan an unattached object.
  - Deferred private bucket/signed URLs, magic-byte MIME validation, legacy object migration, and quest deletion.
- Sprint 12.16.1 - Teacher Logout / Session UX Planning.
  - Audited the current Supabase SSR auth/session flow.
  - Recommended a POST-only server logout route, dashboard Sign out control, authenticated `/login` redirect, and safe allowlisted login feedback messages.
- Sprint 12.16.2 - Teacher Logout / Session UX.
  - Added POST-only `/auth/logout` route using the existing Supabase SSR server client.
  - Successful logout redirects with HTTP 303 to `/login?logged_out=1`.
  - Failed logout redirects safely to `/login?error=logout_failed`.
  - Logout accepts no browser-controlled redirect destination.
  - Dashboard header now shows authenticated teacher email and a plain HTML POST `Sign out` control.
  - Dashboard layout remains a Server Component.
  - Authenticated users opening `/login` redirect to `/dashboard`.
  - Login page uses fixed allowlisted messages for `logged_out`, `missing_auth_code`, `auth_callback_failed`, and `logout_failed`.
  - Raw query values and Supabase errors are never displayed.
  - Magic-link callback behavior remains unchanged.
  - Manual verification confirmed logout cleared the session, the signed-out redirect/message worked, `/dashboard` remained inaccessible after logout, browser Back plus hard refresh did not restore access, and magic-link login remained functional.
  - A transient Turbopack/module-resolution issue was caused by stale dev state/file locking and resolved without code changes.
  - No migration or RLS change was required.
  - Deferred global client-side handling of expired-session API 401 responses, cross-tab logout synchronization, role-aware teacher/student guards, private image bucket/signed URLs, and quest deletion.
- Sprint 12.16.3 - Expired Session / API 401 UX Planning.
  - Audited protected teacher client workflows that can receive API `401` responses during long-lived editing sessions.
  - Recommended a small client-only helper with fixed session-expired messaging and no return-path support, global interceptor, token refresh framework, mutation replay, or cross-tab sync.
- Sprint 12.16.4 - Expired Session / API 401 UX.
  - Added `lib/auth/session-expired.client.ts`.
  - Uses fixed message `Your session has expired. Please sign in again.`
  - Redirects only to `/login?error=session_expired` and deduplicates repeated redirect attempts with a module-level guard.
  - Updated task editor, quest settings, new quest form, and storage upload/remove flows to detect `401` before generic error parsing.
  - Prevents technical `Unauthorized.` messages and false success states after expired-session `401` responses.
  - Added `error=session_expired` to the login feedback allowlist.
  - Protected API contracts, RLS policies, Supabase configuration, and migrations were unchanged.
  - Manual verification confirmed logout in another tab followed by a protected action redirected to the fixed session-expired login message, and re-login remained functional.
  - Known limitations: unsaved edits are not persisted across login redirect, no return-to-current-page support, no cross-tab sync, no mutation replay, and upload-success followed by PATCH-401 may leave an orphaned image.
- Sprint 12.17.1 - Quest Settings Metadata Planning.
  - Planned the smallest safe quest metadata expansion for the teacher MVP.
  - Deferred subject UI until `quests.subject_id` lookup/table behavior is verified.
  - Recommended grade range and estimated duration as the first implementation slice.
- Sprint 12.17.2 - Quest Grade Range and Duration Metadata.
  - Added and manually applied `database/migrations/007_add_quest_metadata.sql`.
  - Added nullable `quests.grade_min`, `quests.grade_max`, and `quests.estimated_duration_minutes`.
  - Added CHECK constraints for grade values 1-11, paired grade values, ordered ranges, and duration 5-240 minutes.
  - Added Quest Settings controls for grade range and estimated duration.
  - Empty metadata controls save `null`; Grade-from-only mirrors to Grade-to on submit.
  - Dashboard and Teacher Preview display metadata only when populated.
  - Verified `Grades 5-7`, `45 min`, `Grade 7`, metadata clearing, and existing quest compatibility in the browser.
  - Confirmed all 7 existing quests remained compatible with null metadata.
  - `subject_id` remained untouched, no `subject` text column was added, and existing owner-scoped RLS policies remained unchanged.
- Sprint 12.17.3 - Quest Subject Lookup Planning.
  - Confirmed `quests.subject_id` is nullable UUID and references `public.subjects.id`.
  - Confirmed `public.subjects` has `id uuid`, `name text`, `grade integer nullable`, and `created_at timestamptz`.
  - Confirmed usable subject rows exist, no exact duplicate `name + grade` pairs were found, and all 7 current quests have `subject_id = null`.
  - Recommended reusing `subject_id` with a server-read lookup rather than adding duplicate subject text.
- Sprint 12.17.4 - Subjects Read Policy.
  - Added and manually applied `database/migrations/008_add_subjects_read_policy.sql`.
  - `public.subjects` RLS remains enabled.
  - Added exactly one authenticated SELECT policy: `Authenticated users can read subjects`.
  - No subject INSERT, UPDATE, or DELETE policies exist.
  - Subject row count remained unchanged.
  - Existing `quests` and `quest_tasks` policies were untouched.
  - No subject UI or quest CRUD changes were included.
- Sprint 12.17.5 - Teacher Quest Subject Selector.
  - Added nullable `subject_id` to the active teacher quest DTO/selects and shared quest type.
  - Added a server-only authenticated subject lookup selecting `id`, `name`, and `grade`, ordered by name, grade, and id.
  - Added an optional Subject selector to Quest Settings using existing `quests.subject_id`.
  - `No subject` saves `null`; omitted `subject_id` preserves the current value.
  - The owner-safe settings PATCH validates UUID shape and subject existence.
  - Teacher Library and Teacher Preview display resolved subjects when present; null or unresolved subjects show no placeholder.
  - The library uses one subject lookup and an in-memory map, avoiding N+1 subject queries.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - No migration, RLS change, service role, hardcoded UUID mapping, subject create/edit/delete UI, or taxonomy/admin UI was added.
  - Browser verification passed for subject select/save/refresh, Library display, Preview display, clearing, display removal, and grade/duration regression coverage.
  - Logged-out PATCH was directly verified as `401` with safe JSON.
  - Invalid UUID, missing subject UUID, and foreign/missing quest API cases were reviewed in code but not directly executed.
- Sprint 12.17.6 - Quest Language Metadata Planning.
  - Confirmed live Supabase had no existing language column, enum, language/locale/translation table, or language-related `quests` constraint.
  - Recommended nullable constrained text codes for quest content language: `ru`, `kk`, and `en`.
- Sprint 12.17.7 - Quest Language Metadata.
  - Added and manually applied `database/migrations/009_add_quest_language_metadata.sql`.
  - Added nullable `quests.language_code` text with allowed codes `ru`, `kk`, and `en`.
  - Added labels Russian, Kazakh, and English through a shared `QuestLanguageCode` helper.
  - Added optional Language selector to Quest Settings.
  - `No language specified` clears the value to `null`; omitted `language_code` preserves the current value.
  - Invalid language values return safe `400`; owner-safe `404` and logged-out `401` behavior remain unchanged.
  - Teacher Library and Teacher Preview display language only when populated and resolved.
  - Unknown or null language values render safely without a placeholder.
  - Subject, grade range, and duration metadata remain unchanged.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - No default, backfill, index, RLS change, policy change, lookup table, PostgreSQL enum, admin UI, filtering, or i18n framework was added.
  - Browser verification passed for Russian save/persistence, Library display, Preview display, changing to Kazakh, clearing language, display removal, and subject/grade/duration regression coverage.
- Sprint 12.17.8 - Quest Cover Image Planning.
  - Confirmed live schema had no existing quest cover field or related constraint.
  - Planned a path-only cover image model using the existing public `quest-images` bucket.
  - Recommended owner-safe server upload/removal, authenticated cover Storage policies, Library thumbnail display, and Preview cover display.
- Sprint 12.17.9 - Quest Cover Image MVP.
  - Added and manually applied `database/migrations/010_add_quest_cover_image.sql`.
  - Added nullable `quests.cover_image_path` text.
  - Persisted only bucket-relative Storage paths; public URLs are derived and not stored.
  - Added authenticated owner-prefixed cover INSERT and DELETE policies for `teachers/{userId}/quests/{questId}/cover/{uuid}.{ext}`.
  - Preserved public read, existing task-image policies, quest owner RLS, and no Storage UPDATE policy.
  - Server generates paths, derives extensions from validated JPEG/PNG/WebP MIME types, and rejects nested or malformed cover paths.
  - Added owner-safe cover upload, replacement cleanup, and removal through `/api/teacher/quests/[id]/cover`.
  - Added `QuestCoverImageManager` to Settings; cover actions do not submit the regular Settings form.
  - Teacher Library displays a 16:9 cover thumbnail or fallback.
  - Teacher Preview displays a larger 16:9 cover when present.
  - `NewQuestForm` and Teacher Play/Test remain unchanged.
  - Browser verification passed for upload, persistence after refresh, Settings preview, Library thumbnail, Preview display, replacement, removal, task image regression, and subject/grade/duration/language regression coverage.
  - Known limitations: public bucket reads remain, MIME verification relies on `File.type`, best-effort cleanup can leave orphan objects, no cropper/resizing, no private bucket/signed URLs, no cover in NewQuestForm or Play/Test, and no gallery/multiple covers.
- Sprint 12.17.10 - Quest Tags / Category Planning.
  - Approved one optional teacher-defined category per quest and multiple teacher-defined tags per quest.
  - Chose direct `public.quests` columns for the teacher MVP.
  - Recommended `category text null` and `tags text[] not null default '{}'`.
  - Deferred normalized taxonomy tables until marketplace, public catalog, multilingual taxonomy, or platform-defined taxonomy needs are clearer.
  - Deferred Quest Library filtering, NewQuestForm changes, Play/Test changes, indexes, RLS changes, and quest deletion.
- Sprint 12.17.11 - Quest Category / Tags Migration.
  - Prepared `database/migrations/011_add_quest_category_tags.sql`.
  - The migration adds nullable `quests.category` and `quests.tags text[] not null default '{}'`.
  - Added idempotent CHECK constraints for category length up to 40 characters and maximum 10 tags.
  - Per-tag length, empty-tag removal, and case-insensitive duplicate removal are planned for server-side validation in the app implementation sprint.
  - No live Supabase application, backfill, index, RLS change, policy change, application code change, commit, or push was performed during preparation.
- Sprint 12.17.12 - Apply and Verify Quest Category / Tags Migration.
  - Manually applied `database/migrations/011_add_quest_category_tags.sql` to live Supabase after product-owner approval.
  - Verified `public.quests.category` exists as nullable `text` with default `null`.
  - Verified `public.quests.tags` exists as `text[] not null` with default `'{}'::text[]`.
  - Verified `quests_category_length_check` and `quests_tags_count_check`.
  - Confirmed all 7 existing quest rows remained present and compatible.
  - Confirmed existing categories are `null`, existing tags are empty arrays, and no tag arrays exceed 10 items.
  - Confirmed existing quest metadata remained compatible.
  - Confirmed `public.quests` RLS and owner-scoped SELECT, INSERT, and UPDATE policies were unchanged.
  - Confirmed no `quests` DELETE policy exists.
  - No application TypeScript, React components, API routes, RLS policies, indexes, or migration SQL were changed in this documentation step.
- Sprint 12.17.13 - Quest Category / Tags Settings Integration.
  - Added `category: string | null` and `tags: string[]` to shared and teacher quest types.
  - Owner-scoped quest reads include category and tags.
  - Added owner-safe PATCH support for category and tags.
  - Omitted category or tags preserve existing values.
  - Empty category clears to `null`, and an empty tags array clears all tags.
  - Category and tag whitespace is normalized.
  - Empty tags are removed.
  - Tags are deduplicated case-insensitively while preserving first-occurrence casing.
  - Category maximum length is 40 characters, maximum tag count is 10, and maximum normalized tag length is 24 characters.
  - Control characters are rejected server-side.
  - Invalid category or tags return safe `400` responses before update.
  - Quest Settings provides Category and comma-separated Tags controls.
  - Defensive handling prevents stale null or undefined tags from crashing the Settings form.
  - Manual authenticated browser verification passed for save, refresh persistence, whitespace normalization, empty tag removal, dedupe, validation, clearing, and restoration.
  - The test quest was restored to `category = null` and `tags = []`.
  - No Quest Library category/tag display or filtering, NewQuestForm controls, Preview display, Play/Test changes, quest deletion, migration change, RLS/policy change, or index was included.
- Sprint 12.17.14 - Quest Category / Tags Library Display and Filtering.
  - Kept `/dashboard/quests` as a Server Component and added Next.js 16 async `searchParams`.
  - Supported URL parameters are `category` and `tag`.
  - Owned quests are fetched once through `getOwnedQuests()`.
  - Filter values are derived only from the authenticated teacher's owned quests.
  - Filtering is performed in memory for the current MVP scale.
  - Category and tag filters combine with AND semantics.
  - Missing or empty parameters mean no filter; only the first query value is used when an array is supplied.
  - Unknown values produce a safe filtered-empty state.
  - Category and tag matching is whitespace-normalized and case-insensitive, while stored display casing is preserved.
  - Filter options are deduplicated case-insensitively and sorted.
  - Quest cards display category and tag chips only when populated.
  - Native GET controls support shareable URLs, refresh persistence, and browser back/forward behavior.
  - Clear filters returns to `/dashboard/quests`.
  - Defensive handling prevents malformed legacy category/tags values from crashing the page.
  - Manual browser verification passed for full owned list display, category chips, tag chips/wrapping, category-only filtering, tag-only filtering, combined AND filtering, clear filters, refresh persistence, browser back/forward, unknown filter empty state, and existing card metadata/actions.
  - No Preview category/tag display, NewQuestForm controls, Play/Test changes, quest deletion, public catalog/student discovery, migration, RLS/policy change, index, or normalized taxonomy was included.
- Sprint 12.17.15 - Quest Category / Tags Preview Display.
  - Added category and tags to the existing Teacher Preview metadata chip row.
  - Display order is subject, language, grade, duration, category, then tags.
  - No additional service query, type, API, schema, or RLS work was required.
  - Category is defensively normalized for display and omitted when invalid or empty.
  - Tags are defensively handled at runtime, limited to valid string entries, whitespace-normalized, and empty entries are removed.
  - Stored display casing is preserved and all valid tags are displayed.
  - Tag keys are index-qualified to avoid duplicate React key collisions with malformed legacy arrays.
  - Styling matches the Teacher Quest Library.
  - Manual browser verification passed for category chip display, tag chip display/wrapping, metadata order, empty metadata behavior, existing Preview content, read-only behavior, unchanged owner-safe route behavior, and duplicate legacy tag key safety.
  - No editing in Preview, filtering in Preview, NewQuestForm changes, Play/Test changes, quest deletion, public catalog/student discovery, migration, live Supabase write, RLS/policy change, index, or normalized taxonomy was included.
  - Metadata chip logic remains local to Library and Preview.
- Sprint 12.18.2 - New Quest Draft Creation UX.
  - Made quest creation the first step of a two-step workflow.
  - Step 1 creates a minimal draft shell; Step 2 redirects to Quest Settings for metadata, cover image, tasks, and publication.
  - `NewQuestForm` sends only title, description, and difficulty.
  - `NewQuestForm` no longer includes publication state or a publication control.
  - The create API ignores any client-provided `is_public` value and always inserts `is_public: false`.
  - `author_id` continues to come only from the authenticated server session.
  - Existing title, description, difficulty, validation, loading, error, and redirect behavior remain intact.
  - Manual authenticated browser verification passed with test quest `DRAFT CREATION TEST 12.18.2` (`0a6d4d54-37ca-4274-aea4-3e127c3a593d`).
  - Verified redirect to `/dashboard/quests/0a6d4d54-37ca-4274-aea4-3e127c3a593d/settings`, Settings load, Draft status, empty category/tags, no cover image, no tasks, and Teacher Quest Library Draft display.
  - Exactly one test quest was created, no other quest data was intentionally changed, and the test quest remains in place because quest deletion is not implemented.
  - No subject, language, grade, duration, category, tags, cover, Settings, Library, Preview, Play/Test, quest deletion, migration, RLS/policy, index, public catalog, student-facing, direct SQL, or direct API shortcut change was included.
- Sprint 12.18.4 - New Quest Creation UX Polish.
  - Added `Шаг 1 из 2` framing to `NewQuestForm`.
  - Localized the draft-workflow explanation to Russian.
  - Changed submit copy to `Создать черновик`.
  - Changed loading copy to `Создание черновика...`.
  - Added a secondary `Вернуться к библиотеке` link to `/dashboard/quests`.
  - Preserved the title, description, and difficulty-only POST payload.
  - Preserved the redirect to `/dashboard/quests/[id]/settings`.
  - Draft-only server enforcement remains unchanged.
  - No publication control exists on the creation form.
  - Manual visual browser verification passed on authenticated `/quests/new` without creating a new quest.
  - No create API, route move, metadata expansion, Settings, Library, Preview, Play/Test, quest deletion, migration, live Supabase write, RLS/policy, index, public catalog, or student-facing change was included.
- Sprint 12.18.6 - Quest Creation Step 2 Settings UX.
  - `NewQuestForm` redirects after creation to `/dashboard/quests/[id]/settings?created=1`.
  - Settings accepts Next.js 16 async `searchParams`.
  - `created` supports `string | string[] | undefined`; arrays use the first value and only exact `created=1` enables onboarding.
  - Onboarding is server-rendered, non-persistent, and appears only for post-create query visits.
  - Direct Settings visits remain unchanged.
  - `getOwnedQuest(id)` remains the owner-safe access gate, and onboarding does not affect authorization or data loading.
  - The task link points to `/quests/[id]/tasks`.
  - Publication behavior remains unchanged.
  - No client state or dismiss behavior was added.
  - Browser verification passed with and without the query parameter, and no data was modified during verification.
  - No create API, schema/migration, RLS/policy, index, `QuestSettingsForm`, `QuestCoverImageManager`, task route/editor, publication gating, deletion, public catalog, or student-facing change was included.
- Sprint 12.18.8 - Enforce Task Required Before Publication.
  - Publication now requires at least one task only during a Draft-to-Public transition.
  - Current `is_public` is loaded through the existing owner-safe quest lookup.
  - Task count is queried only after authenticated ownership verification using `quest_tasks` exact count with `head: true`; client-provided task counts are never trusted.
  - Zero or null task count returns HTTP 400 with `Добавьте хотя бы одно задание перед публикацией.`, and the quest update is not executed.
  - Task-count query failure uses the existing safe HTTP 500 response and does not expose Supabase internals.
  - Direct API requests cannot bypass the rule.
  - `QuestSettingsForm` already displayed the API error and required no change.
  - Manual browser verification passed for an owned draft with zero tasks; the UI showed the Russian error, the request was rejected, the quest remained Draft after refresh, and no other quest fields, task, cover, metadata, or publication data changed.
  - Draft remaining draft, public remaining public, editing already-public quests, and unpublishing do not trigger the task count.
  - Legacy public zero-task quests are not modified automatically; existing title, difficulty, metadata, authentication, ownership, 404, 401, Preview, and Play/Test zero-task behavior remains unchanged.
  - Deferred limitations: deleting the last task from a public quest may still leave it public with zero tasks; the count and publication update are not transactional; full readiness checklist is deferred; subject, language, grade, duration, category, tags, description, and cover are not publication requirements yet.
  - No migration, schema, RLS/policy, index, `QuestSettingsForm`, Preview, Play/Test, task deletion, public catalog, or student-facing change was included.
- Sprint 12.18.10 - Block Last Public Task Deletion.
  - Deleting the last task from a Public quest is blocked.
  - Teachers must explicitly unpublish before deleting the final task; automatic unpublishing is not performed.
  - The owner-safe task route quest lookup now includes `is_public`.
  - Draft quests skip the new readiness check.
  - Public quests verify the target task before counting sibling tasks, with target task lookup scoped by task id and quest id.
  - Task count runs only after authentication, ownership, and target-task verification using `quest_tasks` exact count with `head: true`; client-provided task counts are not trusted.
  - A Public quest with more than one task can still delete a task.
  - A Public quest with one or fewer tasks returns HTTP 400 with `Сначала снимите квест с публикации, затем удалите последнее задание.`
  - Blocked deletion performs no task deletion or Storage cleanup.
  - Task-count failure returns the existing safe HTTP 500 response.
  - Successful deletion response and Storage cleanup remain unchanged.
  - `QuestTasksClient` already displays API errors and required no change.
  - Manual browser verification passed; the task and Public state remained unchanged after refresh, no Storage cleanup occurred, and no other task or quest data changed.
  - Preserved behavior: Draft quests with one or multiple tasks may delete tasks; Public quests with multiple tasks may delete one; missing or foreign quest/task keeps existing generic 404; unauthenticated behavior remains unchanged; legacy Public zero-task quests are not modified automatically; Preview and Play/Test remain unchanged.
  - Deferred limitations: count and deletion are non-transactional; concurrent deletion requests on a Public quest with multiple tasks could still race; a future transaction/RPC may provide stronger enforcement; no second confirmation or publication-aware delete UI was added.
  - No automatic unpublishing, transaction/RPC, migration, schema, RLS/policy, index, `QuestTasksClient`, Settings, Preview, Play/Test, public catalog, student-facing, or quest deletion change was included.
- Sprint 12.18.12 - Publication Readiness Settings UX.
  - Settings now loads an owner-safe exact task count server-side.
  - Added `getOwnedQuestTaskCount(questId)` with UUID/auth checks, owner verification by quest id plus authenticated `author_id`, `null` for missing/foreign/unauthenticated/invalid requests, and a post-ownership `quest_tasks` exact count with `head: true`.
  - Task count remains separate from the quest DTO.
  - Settings passes `taskCount` to `QuestSettingsForm`.
  - Readiness messaging appears near the publication control for Draft zero-task, ready, and legacy Public zero-task states.
  - Exact UX copy includes `Для публикации нужно хотя бы одно задание.`, `Добавьте задание, затем вернитесь в настройки и включите публикацию.`, `Заданий: {taskCount}`, `Квест можно опубликовать.`, `Квест опубликован, но в нем нет заданий. Снимите публикацию или добавьте задание.`, and `Перейти к заданиям`.
  - The task link points to `/quests/[id]/tasks`.
  - Historical behavior: the publication checkbox was enabled at this point. It is superseded by the current dedicated teacher Publish/Unpublish controls; the server publication action remains the source of truth.
  - Server-rendered count may be stale until refresh; no polling or client-side task-count fetch exists.
  - Manual browser verification passed for Draft zero-task, Draft with tasks, and Public with tasks, and no data was modified.
  - Publication API enforcement, direct API protection, legacy Public zero-task unpublishing, unrelated Settings saves, error/success display, `created=1` onboarding, owner-safe `notFound`, task CRUD, Preview, and Play/Test remain unchanged.
  - No migration, schema, RLS/policy, index, polling, client-side task-count request, readiness metadata checklist, task CRUD refactor, publication API change, public catalog, or student-facing change was included.
- Sprint 12.18.14 - Dashboard Quest Create and Tasks Route Consolidation.
  - Canonical teacher routes are now Library `/dashboard/quests`, Create `/dashboard/quests/new`, Settings `/dashboard/quests/[id]/settings`, Tasks `/dashboard/quests/[id]/tasks`, Preview `/dashboard/quests/[id]/preview`, and Play/Test `/dashboard/quests/[id]/play`.
  - Legacy redirects are `/quests/new` -> `/dashboard/quests/new`, `/quests/[id]/tasks` -> `/dashboard/quests/[id]/tasks`, `/quests` -> `/dashboard/quests`, and `/quests/[id]` -> `/dashboard/quests/[id]/preview`.
  - The canonical dashboard Create page owns the authenticated create implementation; the legacy Create page is a minimal server-side redirect.
  - The canonical dashboard Tasks page owns the owner-safe task editor implementation; the legacy Tasks page is a minimal server-side redirect.
  - All internal teacher Create and Tasks links use canonical dashboard routes.
  - `QuestWorkspaceNav` ordering, labels, and active behavior remain unchanged, and the post-create Settings redirect remains `/dashboard/quests/[id]/settings?created=1`.
  - `NewQuestForm` and `QuestTasksClient` received only minimal dashboard-layout fit adjustments.
  - Task CRUD, validation, payloads, errors, loading, scrolling behavior, publication behavior, dashboard layout guard, and owner-safe route loading remain intact.
  - Manual browser verification passed for both canonical routes, both legacy redirects, no redirect loops, visible task editor inside dashboard chrome, vertical scrolling, dashboard navigation not covering content, internal links staying within `/dashboard/quests`, and no data changes.
  - Remaining intentional legacy occurrences are redirect pages, historical documentation references, and `/api/teacher/quests` API routes.
  - No API, schema/migration, RLS/policy, index, task CRUD refactor, Preview or Play/Test behavior change, publication behavior change, public catalog/student-facing implementation, broad visual redesign, or broad localization change was included.
- Sprint 12.18.16 - Teacher Workflow Primary Copy Localization.
  - Implemented phase 1 of Russian-first teacher MVP localization.
  - No i18n framework or shared copy constants were introduced.
  - Navigation labels changed to `К библиотеке`, `Настройки`, `Задания`, `Предпросмотр`, and `Тестирование`.
  - Status labels changed to `Черновик` and `Опубликован`.
  - Library high-visibility copy is Russian for heading/supporting copy, create actions, summary cards, filters, clear-filter actions, empty/no-results states, status badges, task-count labels, cover and description fallbacks, and card actions.
  - Settings route-level heading/supporting text is Russian, and Step 2 onboarding remains preserved.
  - Preview high-visibility copy is Russian, including heading, task counts, zero-task state, task action, grade labels, and task labels.
  - Play/Test is now labeled `Тестирование` with Russian supporting and zero-task copy.
  - Generic teacher-facing task terminology uses `задание`/`задания`; `вопрос` is reserved for actual question prompt or single-choice semantics.
  - Server API error contracts were not changed.
  - Routes, canonical dashboard route map, navigation destinations/active state, filtering, sorting, category/tags, task counts, covers, card links, Settings owner-safe loading, `created=1`, Preview rendering, QuestRunner/runtime, task CRUD, and publication behavior remain unchanged.
  - Manual browser verification passed for Library, Settings with and without `created=1`, Tasks without mojibake, Preview, and `Тестирование`; desktop layout/navigation remained usable and no data changed.
  - Deferred localization scope includes `QuestSettingsForm`, `QuestCoverImageManager`, `QuestTasksClient`, `TaskForm`, `TaskCard`, `TaskEditor`, `components/tasks/editor/*`, `components/media/ImageUploader.tsx`, `components/tasks/runtime/*`, and client fallback/server API error consistency.

- Sprint 12.18.18 - Settings and Cover Manager Copy Localization.
  - Localized `QuestSettingsForm` teacher-visible copy for labels, select placeholders, subject/grade display formatting, language labels, helper text, category/tag guidance, grade/duration guidance, local validation messages, save/loading labels, success text, client-only fallback errors, and publication state labels.
  - Approved Settings terminology includes `Название квеста`, `Описание`, `Предмет`, `Предмет не указан`, `Язык`, `Язык не указан`, `Категория`, `Теги`, `Сложность`, `Класс от`, `Класс до`, `Не указано`, `Примерная длительность, мин.`, `Статус публикации`, `Черновик`, `Опубликован`, `Сохранение...`, and `Сохранить настройки`.
  - Subject/grade display formatting uses `Все классы`, `N класс`, and `N-M классы`; stored values, option keys, field names, and payloads remain unchanged.
  - Generic readiness copy now uses `хотя бы одно задание`; `вопрос` remains reserved for actual question-prompt semantics.
  - Localized `QuestCoverImageManager` teacher-visible copy for `Обложка`, Russian optional 16:9 guidance, `Загрузить обложку`, `Заменить обложку`, `Удалить обложку`, `Обложка не загружена`, `Обложка квеста`, loading/success states, client-only fallback errors, and accessibility labels.
  - Protected error boundaries remain unchanged: server API response shapes, HTTP status handling, server API error contracts, `SESSION_EXPIRED_MESSAGE`, Supabase/internal technical errors, Storage passthrough errors, and returned `result.error` display behavior.
  - Routes, owner-safe loading, field names, payload shape, validation rules and numeric limits, category/tag limits, stored public/draft values, publication behavior, cover upload/remove/replace APIs, file input, accepted file types, schema, migrations, RLS, policies, and indexes remain unchanged.
  - Manual browser verification passed for Settings form labels/helpers/control usability/status labels/readiness terminology/local invalid-input validation, Cover Manager copy, no mojibake, and desktop layout.
  - No save, cover upload, cover replace, cover removal, or other live data write occurred during verification.
  - Deferred localization scope includes `QuestTasksClient`, task form/card/editor children, `ImageUploader`, runtime components, broader client/server error consistency, and student/runtime copy outside the teacher-only workflow.

- Sprint 12.18.20 - Task Editor Copy Localization.
  - Localized teacher task-editor copy in `QuestTasksClient`, `TaskForm`, `TaskCard`, `TextTaskEditor`, `SingleChoiceTaskEditor`, and `ImageUploader`.
  - Task type display mapping is `text` -> `Текстовое задание` and `single_choice` -> `Выбор одного ответа`; unknown future task types fall back to the raw identifier.
  - Stored values, TypeScript unions, registry keys, payloads, API contracts, routes, endpoints, CRUD behavior, autosave, `TaskTypeRegistry` behavior, owner safety, publication safety, last-public-task deletion protection, image behavior, runtime/student copy, schema, migrations, RLS, policies, and indexes remain unchanged.
  - `QuestTasksClient` localized shell actions, refresh action, client-only fallback errors, success alerts, browser confirms, and image fallback messages while preserving returned `result.error`, `SESSION_EXPIRED_MESSAGE`, server API JSON error contracts, HTTP status handling, Supabase/internal technical errors, and Storage passthrough errors.
  - `TaskForm` now has a visible `Тип задания` label, Russian task type display names, `Баллы`, and Russian create/validation copy; submitted values remain `text` and `single_choice`.
  - `TaskCard` uses Russian task type labels plus Russian edit/delete aria-labels with unchanged handlers and layout.
  - `TextTaskEditor` now uses `Текстовое задание`, `Текст задания`, `Баллы`, `Сохранить`, and Russian local validation/fallback/success copy.
  - `SingleChoiceTaskEditor` now uses `Выбор одного ответа`, `Вопрос`, `Вариант ответа`, `Добавить вариант`, `Удалить вариант`, `Правильный ответ`, `Баллы`, and `Сохранить` while preserving option structure, payload, validation, and correct-answer logic.
  - `ImageUploader` now uses `Изображение задания`, `Удалить изображение`, and Russian teacher-visible upload/remove/empty/accessibility copy while preserving upload/remove mechanics and Storage passthrough behavior.
  - Correct-answer radio selection now preserves `checked={correctOptionId === option.id}` and `onChange={() => setCorrectOptionId(option.id)}` while adding `value={option.id}` and defensive `onClick={() => setCorrectOptionId(option.id)}`. Both handlers set the same `option.id`; no double-toggle risk was found.
  - The radio issue was browser-observed as visible radios that did not reliably update `correctOptionId`; browser verification confirmed selection works, validation disappears, Save becomes enabled, and Preview reflects the selected answer.
  - Points bug diagnosis: `TextTaskEditor` and `SingleChoiceTaskEditor` previously rendered Points as `value={task.points}` with `readOnly`, had no local editable points state, and the task update callback/PATCH flow did not persist points. The bug existed before Sprint 12.18.20 and was not caused by localization.
  - Editable Points support now uses local string state initialized from `String(task.points)`, editable number inputs with `type="number"`, `min={1}`, and `step={1}`, temporary empty values while typing, and no forced fallback to `1`.
  - Points validation requires a non-empty finite integer at least `1`; decimal values are rejected with `Баллы должны быть целым числом не меньше 1.`
  - Editor saves now pass numeric `points`; `TaskEditor` callback typing was minimally extended; `QuestTasksClient` includes `points` in the existing PATCH body while preserving title, description, and content behavior.
  - The task PATCH route supports optional `points`; validation runs only when supplied, invalid values return HTTP 400 in the existing route style, `points` is added to the Supabase update object only when supplied, and older requests omitting `points` remain compatible. Authentication, ownership, task-parent scoping, safe 404, response shape, and error handling remain unchanged.
  - Existing saved single-choice tasks using `{ options: { id: string; text: string }[], correctOptionId: string }` remain compatible; no data migration or live-data repair was required.
  - `TaskList.tsx` was inspected and required no code changes.
  - Manual browser verification passed on the canonical dashboard task route for Text task localization, Single Choice localization, visible task type label, hidden raw identifiers for known task types, correct-answer radio selection, validation disappearance, Save enablement, Preview synchronization, and editable Points no-write behavior.
  - Text and Single Choice Points can be changed locally, empty intermediate values remain empty, decimals and zero are rejected, valid positive integers are accepted, Save state updates correctly, and changing Single Choice Points does not reset the selected correct answer.
  - Save was not clicked, no PATCH write occurred, no live write occurred, and no task, image, or live data was created, edited, deleted, uploaded, removed, or saved.
  - Deferred scope includes runtime/student-facing localization, broader client/server error consistency, i18n/shared constants, and task CRUD/autosave refactors.

- Sprint 12.18.21 - Controlled Task Editor Write Verification.
  - Manual authenticated browser write verification passed through normal owner-safe teacher UI/API flows.
  - Text task flow: temporary task `TEMP - Points persistence text` was created, points were changed to `7`, the task was saved, the page was refreshed/reloaded, points `7` persisted, text/content persisted, internal type remained `text`, visible type remained `Текстовое задание`, and the temporary Text task was deleted successfully.
  - Single Choice flow: temporary task `TEMP - Points persistence single choice` was created, options `Alpha` and `Beta` were saved, `Beta` remained the correct answer, `correctOptionId` persistence was confirmed, points `9` persisted after save/reload, visible type remained `Выбор одного ответа`, Preview reflected the persisted correct answer, and the temporary Single Choice task was deleted successfully.
  - Cleanup passed: both temporary tasks were deleted, no temporary rows remain, no image was uploaded, no orphaned Storage object exists, no new quest was created, no Public quest was modified, no last-public-task deletion test occurred, and original quest/tasks were otherwise unchanged.
  - Optional `points` PATCH support is now browser-write verified.
  - Non-blocking UX issues recorded for future planning: `TaskForm` Points input has an aria-label but no visible `Баллы` label; `TaskCard` pencil button is visible but does not independently open the editor even though card click selection works.
  - Unchanged scope: no route changes, API changes beyond already-implemented optional points support, schema/migration/RLS/policy/index changes, task content schema changes, task type changes, Storage writes, or runtime/student changes.

- Sprint 12.18.24 - Task Creation and Card Action UX Implementation.
  - Added a visible semantic `Баллы` label to `TaskForm`, associated with the existing Points input through `htmlFor="task-points"` and `id="task-points"`, while preserving aria-label, value, min, onChange, default value, and submitted points behavior.
  - Added a typed `onSelect` callback to `TaskCard`, enabled the pencil button, added `type="button"`, preserved its Russian aria-label, styling, icon, and selected rendering, and wired click handling to call `event.stopPropagation()` before invoking the existing task selection/edit behavior exactly once.
  - `TaskList` now passes `onSelectTask(task)` into `TaskCard`; card click remains unchanged, and pencil click opens the same task without duplicate bubbling.
  - Manual authenticated browser verification passed: visible `Баллы` label appeared, pencil button opened the task editor, card click continued to open/select the task, delete confirmation and deletion worked, and no console or layout issue was reported.
  - One test task was accidentally deleted during verification. All current quest/task data is test data, no production data was affected, no restoration is required, and continued development is unaffected.
  - Historical non-blocking considerations at the end of Sprint 12.18.24: static `task-points` was safe with the current single `TaskForm` instance but would need unique ids if multiple forms render simultaneously; delete-button bubbling into the card wrapper was pre-existing then and was superseded by Sprint 12.18.26.
  - Unchanged scope: no route/API, schema/migration/RLS/policy/index, task content/type, save/autosave, Storage, runtime/student, publication safety, or deletion-guard change.

- Sprint 12.18.26 - Task Action Event Isolation Implementation.
  - Updated only `components/tasks/TaskCard.tsx`.
  - The delete button now has `type="button"` and its click handler receives the event, calls `event.stopPropagation()` before `onDelete(task.id)`, and invokes the existing delete flow exactly once.
  - Delete click no longer bubbles to the parent card selection handler; existing icon, styling, Russian aria-label, confirmation flow, deletion behavior, and keyboard accessibility remain unchanged.
  - No `TaskList` or `QuestTasksClient` change was needed.
  - Owner-safe DELETE API behavior, confirmation text, last-Public-task deletion guard, error handling, list refresh, and `syncSelectedTask` fallback remain unchanged.
  - Manual browser verification passed without confirming deletion: delete on an unselected task showed confirmation, Cancel left the previous selection unchanged, the unselected task did not open or become selected, pencil click and card click remained unchanged, and no console or UI issue was reported.
  - Static `task-points` remains acceptable because only one `TaskForm` renders; future unique-id work remains deferred until multiple simultaneous forms exist.
  - Unchanged scope: no route/API, schema/migration/RLS/policy/index, task content/type, save/autosave, Storage, runtime/student, publication safety, or deletion-guard change.

- Sprint 12.18.28 - Teacher Task Workspace Responsive Layout and Labels.
  - Updated only `components/tasks/QuestTasksClient.tsx` and `components/tasks/TaskForm.tsx`.
  - `QuestTasksClient` now uses `grid-cols-1 xl:grid-cols-12`; the task list uses `xl:col-span-4`, the editor uses `xl:col-span-8`, narrow screens stack list above editor, and large screens retain the two-column layout.
  - No sticky/fixed positioning or state-flow changes were introduced; task selection, deletion, loading, editor rendering, and existing workspace behavior remain unchanged.
  - `TaskForm` now has visible semantic labels for `Название задания`, `Описание`, `Правильный ответ`, and `Подсказка`, while preserving the existing `Тип задания` and `Баллы` labels.
  - Labels use matching `htmlFor`/`id` associations for `task-title`, `task-description`, `task-answer`, `task-hint`, `task-type`, and `task-points`; placeholders, values, handlers, validation, alert behavior, loading behavior, payload, and default points remain unchanged.
  - Accessibility verification passed: labels remain visible while typing, labels focus their associated controls, the current single `TaskForm` has no duplicate ids, and static ids remain acceptable for current rendering.
  - Manual responsive browser verification passed without creating or saving a task: wide screens kept list/editor side by side, narrow screens stacked list above editor, no horizontal scrolling or clipped controls appeared, all six visible labels appeared, label associations worked, and recent fixes remained functional.
  - Recent fixes remained unchanged: pencil button, delete event isolation, card selection, selected styling, points editing/persistence, correct-answer persistence, editor save behavior, image controls, Preview, localized copy, and last-Public-task guard.
  - Unchanged scope: no route/API, schema/migration/RLS/policy/index, task content/type, create/save/autosave, Storage, runtime/student, publication safety, or deletion-guard change.

- Sprint 12.18.30 - Task Creation Failure State Preservation.
  - Fixed the data-loss path where `TaskForm` reset after `onSave` resolved despite `QuestTasksClient` handling a failed creation internally.
  - The create callback now returns `Promise<boolean>` while retaining the existing endpoint and payload.
  - `false` covers busy, session-expired, non-OK, malformed-response, and caught network/error paths; `true` is returned only after valid task state insertion and selection.
  - The form resets only on success and preserves title, description, correct answer, hint, task type, and points after failure.
  - Offline browser verification passed: all TaskForm fields were filled with test values, Chrome DevTools Network mode was set to Offline, and Add task was clicked. The request never reached the server, `Не удалось создать задание.` appeared, no task or live write occurred, all entered values remained, Network mode was restored, and creation was not retried.
  - Successful reset, error display, loading behavior, workspace responsiveness, labels, task-card actions, points/correct-answer persistence, image controls, Preview, and last-Public-task protection remain unchanged.
  - No route/API, schema/migration/RLS/policy/index, task content/type, editor save/autosave, Storage, runtime/student, publication safety, or deletion-guard change.

- Sprint 12.18.31 - Task Creation Success Regression Verification.
  - Completed controlled successful-create verification in owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`); the quest remained Draft.
  - Created and then removed only `TEMP - Sprint 12.18.31 Create Success DELETE ME`, using description `Disposable verification of successful task creation and form reset.`, correct answer `S31-CORRECT`, hint `S31-HINT`, `single_choice`, and `7` points.
  - The single Add task action had no error; the task appeared once, became selected, opened its editor, and preserved `single_choice` / `Выбор одного ответа` plus points `7`.
  - TaskForm reset only after success: title, description, correct answer, and hint cleared; type returned to `text`; points returned to `1`; button/loading returned to normal.
  - Expected Single Choice validation appeared because no options were added: `Добавьте минимум два варианта ответа.` and `Выберите один правильный ответ.` No editor save occurred.
  - Cleanup confirmed the exact temporary task's type and points, confirmed the native dialog once, restored the baseline empty list, produced no unexpected error, and left no residue.
  - Endpoint/payload, `Promise<boolean>` failure preservation, workspace layout, labels, card actions, points/correct-answer persistence, image controls, Preview, and last-Public-task protection remain unchanged.
  - Sprint 12.18.32 planning recorded the task-creation UX finding that clearing the Points numeric input produced `0`, preventing a temporary empty state and requiring current-value selection or the numeric stepper for replacement. Sprint 12.18.33 implemented the resulting validation work.

- Sprint 12.18.33 - TaskForm Points Validation.
  - Fixed the numeric-state root cause where `Number(e.target.value)` converted cleared Points input to `0` and blocked normal keyboard replacement.
  - TaskForm now stores raw string points, initially and after successful reset as `"1"`; temporary empty input is allowed, validation accepts digit-only safe integers at least `1`, and numeric conversion occurs only for the unchanged `points: number` payload.
  - Invalid submit displays `Баллы должны быть целым числом не меньше 1.`, does not call `onSave`, and preserves values after failed creation; `aria-invalid` and `aria-describedby="task-points-error"` support the inline error.
  - POST and PATCH use the same strict contract: JSON number only, finite safe integer, minimum `1`; numeric strings, zero, negatives, decimals, unsafe integers, null, arrays, objects, and booleans are rejected. Omitted PATCH points remain unchanged.
  - No-write browser verification passed: clearing `1` remained empty without `0`, replacement typing worked without Ctrl+A, empty/zero submit displayed the error without a create request or reset, entering `7` cleared the error, and normal keyboard editing changed `7` to `12`.
  - No successful create request, task creation, Supabase data change, or cleanup occurred. Existing creation, failure/reset, UI, editor, image, Preview, publication, and deletion-guard behavior remains unchanged.

- Sprint 12.18.34 - Points Validation Controlled Write Verification.
  - Controlled verification used owned Draft quest `ej57j` (`1a206882-650e-4982-840a-fe6108872cac`) with an empty task-list baseline.
  - Created and removed only `TEMP - Sprint 12.18.34 Points Verification DELETE ME`, using the approved description, `S34-CORRECT`, `S34-HINT`, `text`, create points `7`, and PATCH points `12`.
  - With No throttling and no request blocking, one Add task action had no error, produced one selected/open editor task with points `7`, reset TaskForm points to `1` and its other fields, and returned loading to normal.
  - One points-only Save updated `7` to `12` without error; refresh or reopening confirmed persistence and no unrelated changes.
  - Cleanup verified the exact task/points `12`, confirmed native deletion once, removed only that task, restored the empty baseline, preserved Draft status, and left no error or residue.
  - Follow-up client/server UX mismatch: both task editors use `Number.isInteger`, so unsafe integers can reach PATCH; PATCH safely rejects them because its strict contract requires a finite safe integer at least `1`. No unsafe-integer browser write test occurred.
  - TaskForm, strict API contracts, creation/failure/reset behavior, ownership, selection, optional fields/types, images, Preview, publication, and deletion guards remain unchanged.

- Sprint 12.18.36 - Shared Editor Points Validation.
  - Added `lib/task-points.ts` with the shared `parsePositiveSafeInteger(value: string): number | null` parser and exact message `Баллы должны быть целым числом не меньше 1.`. The parser accepts digit-only positive safe integers and rejects empty, whitespace, signs, decimals, exponent notation, zero, unsafe integers, and overflow.
  - TaskForm, TextTaskEditor, and SingleChoiceTaskEditor now use the shared contract without changing raw-state editing, temporary empty input, payload types, create/save behavior, or existing validation flow.
  - Both editors now expose conditional `aria-invalid` and `aria-describedby` linked to one visible points error while retaining their existing validation summary and disabled Save behavior.
  - Browser verification checked invalid empty, zero, decimal, and unsafe-integer values first; the unsafe integer was not stored. A valid `12` cleared the points error, succeeded through PATCH, and remained `12` after refresh with no unrelated field changes. No cleanup was required for the existing test task.
  - Task type is chosen only during creation; an existing task's stored type selects the editor and cannot be changed there. To use another type, the teacher must create a new task with the desired type and may manually delete the old task if no longer needed. No automatic conversion exists; future conversion requires explicit field-mapping and data-loss rules.
  - POST/PATCH contracts, `Promise<boolean>`, failure preservation/reset, editor fields, Single Choice options/correct-answer behavior, image controls, selection, responsive layout, Preview, publication guards, and deletion guards remain unchanged.

- Sprint 12.18.38 - Immutable Task Type Helper Text.
  - Added below both read-only type fields: `Тип задания выбирается при создании и не меняется после сохранения.` and `Чтобы использовать другой тип, создайте новое задание и при необходимости удалите прежнее.`
  - No type select/state, conversion, or duplication action was added. Stable editor-specific label IDs and visible, secondary, naturally wrapping helper text preserve accessibility without interactive semantics.
  - Wide and narrow no-write visual verification confirmed exact readable copy, non-editable fields, no clipping or horizontal scroll, stable width, and usable Save/other controls. No save, PATCH, live-data action, or cleanup occurred.
  - Stored `task_type` still selects the editor; another type requires a new task and optional manual deletion of the old one. Automatic conversion remains deferred pending explicit field mapping, data-loss rules, API design, and regression coverage.
  - Points validation, editor fields/options/correct answers, images, save/loading/errors, selection, TaskForm, registry, API/schema/RLS/Storage, Preview, publication, and deletion guards remain unchanged.

- Sprint 12.18.40 - Workspace Status Messaging.
  - Updated only `QuestTasksClient`: existing visible workspace errors now use `role="alert"` and `aria-live="assertive"`; one conditional visible `statusMessage` region uses `role="status"` and `aria-live="polite"`. No focus movement or timeout was added.
  - Added `Задание создано.`, `Изменения сохранены.`, `Задание удалено.`, `Изображение загружено.`, and `Изображение удалено.` Status clears at relevant action start and is set only after success; native success alerts were removed for task save and image upload.
  - The read-only technical route check used only GET and returned the expected protected-route HTTP `307` redirect to `/login` without an authenticated browser session. It made no POST, PATCH, DELETE, image upload, or image-removal request and caused no live-data change; static checks, lint, build, and diff checks passed. Manual no-write browser verification confirmed no initial status, no empty status space, stable layout, usable controls, immutable-type guidance, and local points validation.
  - Controlled owned-Draft verification created, saved, and deleted one temporary Text task. Exact create/save/delete messages appeared, each replaced the previous one, no native success alert or workspace error appeared, cleanup restored the original task count, the quest remained Draft, and no existing task was intentionally modified.
  - Image upload/removal success paths were statically reviewed but not live-write verified; no image upload, removal, or Storage write occurred. At Sprint 12.18.40 completion, task cards and keyboard limitations, selected-state behavior, TaskForm, editors, APIs, schema/RLS/Storage policies, Preview, publication, and deletion guards were otherwise unchanged; Sprint 12.18.42 supersedes the selected-state portion.

- Sprint 12.18.42 - Task Card Selected-State Accessibility.
  - Updated only `TaskList` and `TaskCard`: `isSelected` is derived from existing `selectedTaskId`, passed to `TaskCard`, and does not introduce duplicate selection state. Task order, callbacks, and selection ownership remain unchanged.
  - The selected task retains its violet ring and adds visible secondary `Выбрано`. The card wrapper remains the existing non-focusable mouse-selection `div`, with no role, `tabIndex`, or keyboard handler.
  - The native pencil retains `stopPropagation()` and `onSelect`, has accessible name `Открыть задание «{title}»`, and receives `aria-current="true"` only for the selected task. No `aria-selected`, `aria-pressed`, listbox, option, tab, or composite-widget semantics were added.
  - Manual authenticated no-write verification confirmed keyboard Tab access, Enter/Space pencil activation, unchanged mouse selection, selected-state movement, wrapping metadata, reachable narrow-layout actions, and no live write. No Save, Create, Delete, upload, removal, POST, PATCH, DELETE, or live-data change occurred.
  - No automatic focus, refs, or deletion-focus recovery were added; delete confirmation/isolation, status messages, synchronization, task display, TaskForm, editors, validation, immutable-type guidance, APIs, Preview, and guards remain unchanged.

- Sprint 12.18.44 - Deleted Task Focus Recovery.
  - Added post-successful-DELETE focus recovery in `QuestTasksClient`, `TaskList`, and `TaskCard`. The unchanged selected-task sync selects the first remaining task after selected deletion and its pencil receives focus; unselected deletion retains selection and focuses the next surviving task at the deleted index or the previous task; only-task deletion focuses the existing `Задания` heading with `tabIndex={-1}`.
  - A current selected-task-id ref handles selection races during DELETE. The identity-safe pencil registry stores exact DOM elements in a ref, and callback-ref cleanup removes an entry only when its identity still matches.
  - The initial controlled test successfully deleted the selected temporary task, synchronized selection, and showed `Задание удалено.`, but focus did not move to the intended remaining pencil and Enter immediately after deletion did not activate it. Temporary data was cleaned up, and the implementation was not committed before the corrective `focusSignal`/`useLayoutEffect` work. Only matching registration now retries a temporarily absent existing target, while an absent task target clears safely without unrelated focus.
  - Final controlled retest created and deleted one temporary selected Text task. The remaining task became selected, its intended pencil focused, Enter activated it immediately without another Tab press, `Задание удалено.` appeared, and temporary-data cleanup restored the original task count. No existing task, image, or Storage object was intentionally modified.
  - The selected temporary-task path is live verified; other selected/unselected positions and the only-task fallback were statically reviewed only. Confirmation, DELETE/API behavior, errors, guards, TaskForm, editors, points validation, immutable-type guidance, images, Preview, schema/RLS, publication, and deletion guards remain unchanged.

- Sprint 12.18.46 - Task Editor Field Label Accessibility.
  - Added stable label/control associations in the two editors: `Название` -> `#text-task-title`, `Текст задания` -> `#text-task-description`, `Вопрос` -> `#single-choice-task-title`, and `Описание` -> `#single-choice-task-description`.
  - Type and points associations, validation, save and payload behavior, images, options, correct answers, layout, responsive behavior, APIs, schema, and Storage remain unchanged. Manual read-only verification confirmed all four labels focus their controls; no Save, server request, or live-data write occurred.
  - Separately recorded deferred QA for an intermittent user-observed transition to quest Settings while clicking `Добавить вариант` or dragging the far-right document scrollbar. Static inspection found no confirmed application code path, so no speculative fix was made or claimed; runtime isolation remains pending.

- Sprint 12.18.48 - Task Creation Inline Title Validation.
  - Replaced the TaskForm native blank-title alert with `titleError`, a typed title-input ref, and the inline `Введите название задания.` error. Blank and whitespace-only titles focus the existing input and return before points validation or `onSave`; no request or reset occurs.
  - Added conditional `aria-invalid`, `aria-describedby="task-title-error"`, and `#task-title-error` with `role="alert"`; visible labeling, red error styling, points validation, `Promise<boolean>` behavior, API error ownership, payload, selection, layout, and APIs remain unchanged.
  - Manual browser verification covered invalid local-title behavior only: focus, whitespace handling, retained type/points, and non-whitespace error clearing. No valid create, Save, POST, upload, removal, cleanup, or live-data write occurred. Success reset and API-failure retention are static-only review; intermittent Settings navigation remains separate deferred QA.

- Sprint 12.18.49 - Task Workspace Accessibility Exit Review Planning.
  - Planning review passed: the teacher task workspace has no currently evidenced MVP accessibility blocker for keyboard creation, editing, selection, deletion, validation recovery, card navigation, or deletion focus recovery. Immediate accessibility implementation ends; launch QA and non-blocking backlog remain.
  - Important non-blocking: session-expired text remains English, redirects immediately, and the login page explains the reason; no arbitrary delay is recommended, so future work should improve localization and login feedback. No busy semantics and incomplete individual Save-error associations remain.
  - Single Choice correct-answer radios have visual context but no programmatic group label; every radio exposes repeated `Правильный ответ`. Future `fieldset`/`legend` or equivalent review is recommended; no implementation was performed.
  - Browser-native `Удалить задание?` is keyboard accessible and exposed to screen readers by the browser, but omits the task title. It was not independently screen-reader tested in this project. A custom dialog is optional polish because of focus-management and regression risk.
  - QA timing: isolate Settings navigation before internal testing; verify unselected deletion focus, only-task heading fallback, valid create/reset, and API-failure retention before public MVP; defer session localization, busy semantics, Save associations, radio-group semantics, and confirm redesign to post-MVP. No additional live verification occurred.

- Sprint 12.19.1 - Public Quest Catalog and Student Access Planning.
  - Planning passed: current public routes are `/` and `/login`; legacy `/quests*` routes redirect to the session-protected, owner-safe teacher workspace, including owner-only Preview/Play. Current local `QuestRunner` payload exposes answer data and `content.correctOptionId`, so it cannot be used for public/student runtime.
  - `is_public` is the sole mutable publication state; publishing needs one task, while cover/completeness requirements, slug, `published_at`, state enum, price/currency/entitlement, author profile, moderation, and versioning do not exist. Legacy task content can be null. `001_initial_schema.sql` is empty, so no local migration history is authoritative and no live schema inspection occurred.
  - Current RLS denies anonymous and authenticated non-owner published reads; existing owner policies stay intact. Normal anon-key clients are used, no service-role public client is acceptable, and the owner task `select("*")` service stays private. The selected direction is server-rendered anonymous catalog/detail reads through a published-only projection/view/RPC, public quest DTO, and later student task DTO; exact view versus RPC awaits live verification.
  - MVP uses `/catalog`, `/catalog/[id]`, and later login-gated `/catalog/[id]/start`; free-only cards/filtering with no payments, results, assignment, enrollment, or role inference. DTOs exclude ownership, paths, draft data, answers, hints, `correctOptionId`, scoring/raw JSON, and errors. Covers are optional but current public paths include owner UUIDs; use validated URLs/fallback and decide disclosure acceptance.
  - Next is read-only Sprint 12.19.2 live schema/public-read-boundary verification: inspect columns/types/keys/indexes/policies/functions/views/RPCs/Storage, compare drift, and produce unapplied migration/rollback plans. No SQL, migration, RLS/Storage change, catalog code, or live-data modification is authorized. Existing task-workspace QA remains separate.

## Current State On `feature/next-work`

Documented baseline for future Codex chats.

Implemented before this documentation pass:

- Modular Task Editor
- `TaskTypeRegistry`
- Text task type
- Single choice task type
- Task content JSONB support
- Live Preview
- Validation
- Runtime task renderer
- Preview mode and Play mode
- Quest runtime engine
- `QuestRunner`
- `RuntimeContext`
- `ProgressBar`
- `TaskNavigator`
- `QuestStartScreen`
- `QuestFinishScreen`
- `QuestResults`

## Documentation

- Added project context documentation.
- Added architecture overview.
- Added roadmap.
- Added next-task handoff.
- Added coding rules.

## Notes

- No commits or pushes should be made unless explicitly requested.
- Lint and build are required before finishing implementation work.
