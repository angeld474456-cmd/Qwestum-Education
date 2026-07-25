# Next Task

## Milestone

Sprint 12: Teacher Experience

## Objective

Plan the safe transition from public quest detail to a future student runtime.

## Next Task

Sprint 12.19.7 - Public Runtime Application Integration Planning.

Planning-only. Follow analysis -> architecture -> plan. Do not implement application code, apply SQL, or perform live writes without separate explicit approval.

Current state:

- Migration version `20260725213130` now supplies `public.get_public_runtime_quest(uuid)` and `public.score_public_runtime_quest(uuid, jsonb)` for the anonymous temporary runtime. Public catalog metadata remains served separately through the existing catalog RPCs and server-only `/catalog` routes.
- The runtime RPCs keep correct answers server-side, expose no direct anonymous base-table reads, return generic zero rows for unavailable/invalid input, and do not persist attempts or results. Live smoke coverage is partial; its documented metadata and dataset limitations remain open verification work.

Planning topics:

- Analyze the teacher-only `QuestRunner`, task renderers, public detail page, and already-applied runtime RPC DTOs before defining application ownership boundaries.
- Produce the architecture and exact file-by-file plan. Planned creates are `types/public-runtime.ts`, `services/public-runtime.server.ts`, `app/api/public/quests/[id]/submit/route.ts`, `app/catalog/[id]/start/page.tsx`, `app/catalog/[id]/start/loading.tsx`, `app/catalog/[id]/start/error.tsx`, `components/public-runtime/PublicQuestRunner.tsx`, `components/public-runtime/PublicTaskRenderer.tsx`, `components/public-runtime/PublicTextTask.tsx`, `components/public-runtime/PublicSingleChoiceTask.tsx`, and `components/public-runtime/PublicQuestResults.tsx`. The planned modification is `components/catalog/PublicQuestDetail.tsx` for the start CTA.
- Define server-only RPC access, request validation, generic unavailable/invalid handling, loading/error/completion states, no-answer-leak guarantees, and no-persistent-attempt behavior.
- Plan publication/taskless withdrawal handling, safe start routing, anonymous verification, and later authentication decisions without reusing teacher Preview/Play or its answer-bearing payload.

Out of scope:

- Code implementation before explicit approval, new RPCs, schema/RLS/Storage changes, persistent attempts/results, authentication, payments, production rate limiting, live data writes, staging, commit, and push.
