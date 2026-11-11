# FULL1 — Full environment review (progress)

Date: 2026-11-11 (Europe/London)
Repository: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
Branch/HEAD: `feat/integrated-dev` / `82f23226f43a3a8e8298f8863c483239a3e2a89d`
Risk: GREEN investigation only. No application source, config, schema, service, database, scheduled task, commit, or push touched.

## Governance preflight receipt

- Objective/scope: read-only audit across UI pages/routes, storage/routes/Capability handlers, performance, workflow, and nutrition knowledge/claims; findings and suggested fixes only.
- Governing chain read: workspace `G:\The Healthy Apples\AGENTS.md`; canonical Bridge `G:\The Healthy Apples\Infrastructure\AI Agent Bridge\AGENTS.md`; repository `AGENTS.md`, `PROJECT_GOVERNANCE.md`; `.engineering/README.md`, `.engineering/OPERATING_MANUAL.md`; `docs/architecture/README.md`, `REPOSITORY_CONVENTIONS.md`, `ENGINEERING_WORKFLOW.md`; `docs/ai-operating-model/README.md`; task-specific `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `NK2_THA_NUTRITION_METHODOLOGY.md`, `INTARCH1_INTELLIGENCE_REASONING_ARCHITECTURE.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_COMPANION_PLATFORM_ARCHITECTURE.md`.
- Authority gaps: Git status/HEAD initially unavailable due dubious ownership; re-read succeeded with command-local safe.directory. No global Git setting changed. Postgres has known EACCES constraint and was not queried. Architecture has numerous cross-domain governing documents; findings are code-review observations, not a substitute for exhaustive domain-specific architecture reconciliation.
- Implementation permitted: NO / not applicable. The user expressly authorized audit/report only; no implementation will occur.
- Baseline status: dirty before work; preserved. Existing modified files include `.engineering/session/CURRENT.md`, four `server/intelligence` resolver/discovery files, and two server test files; pre-existing untracked run/implementation documents also present. Branch is ahead 4. Do not touch or commit these.
- Rollback: none created; no implementation or tracked-file mutation is in scope. Investigation artifacts are new files only.

## Progress

- [x] Governance and branch/status preflight.
- [x] Enumerated 58 page-directory files and inventoried the route declarations.
- [x] Static navigation scan found an actionable query-string loss candidate: `/nutrition?items=...` redirects to `/food` without preserving the query.
- [ ] Complete per-page workflow and link reachability matrix.
- [ ] Complete focused storage/routes/handler correctness and performance review.
- [ ] Complete NK1/NK2/claim-citation consistency review.
- [ ] Produce consolidated report and shared Agent Report.

Verification boundary: code and governing-document reading only so far. No page was opened in a browser; no server or DB was exercised; no tests/profiler/build were run.

## Final progress / handoff

- [x] Governance and branch/status preflight.
- [x] Enumerated 58 page-directory TSX modules; recorded static purpose and reachability notes. Browser loads and end-to-end page workflows were not run, so status is unknown.
- [x] Static navigation/routes review found the Nutrition query-string drop at `/nutrition` -> `/food`; aliases and intentionally withdrawn `/partners` were separated from defects.
- [x] Focused storage/Capability source inspection recorded one concrete N+1 query shape and an unverified concurrency review lead. Exhaustive route/storage certification remains an explicit limitation.
- [x] NK1/NK2/citation consistency sampled; source-gated handler/claim patterns recorded; full render-chain audit remains open.
- [x] Consolidated report saved at `docs/investigations/platform/FULL1_THA_FULL_ENVIRONMENT_REVIEW_20261111.md`.
- [x] Shared Agent Report saved at `G:\The Healthy Apples\Incoming\Agent Reports\2026-11-11__FULL1_THA_FULL_ENVIRONMENT_REVIEW.md`.

Final status: completed as a static first-pass investigation with material runtime and exhaustive-coverage limitations stated. No application files, configuration, schema, services, database, scheduled tasks, or existing dirty files were changed. No commit or push.

## Phase 2 progress

- [x] Reproduced Nutrition URL query loss using a minimal Node URL harness mapped to the exact static redirect target.
- [x] Confirmed the household N+1 application-query shape in source and reproduced its per-member query count with a counted mock. No production latency claim.
- [x] Investigated test mode: injected in-memory Capability tests exist, but `ci:setup-db` provisions Postgres; `server/db.ts` requires a real DATABASE_URL-backed pg pool.
- [x] Ran `test:intelligence-context-composition` (170 passed) and `test:hybrid-intent-resolver` (passed).
- [x] Attempted `test:intelligence-native-discovery`; integration reached Postgres and failed with EACCES on port 5432 after pure checks.
- [ ] ContextViewSpec versus all Full Result types audit.
- [ ] All suggestedAction user-facing rendering/reason audit.
- [ ] Cross-capability discovery/search matcher coverage audit.
- [ ] Product capability docs versus live registry/resolver audit.
- [ ] Page-by-page client→API→owner/storage data-path traces.

No runtime/db/config/source changes. Investigation remains in progress; this is not a full review completion.
