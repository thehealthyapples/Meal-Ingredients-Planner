# Integrated Development Admin Panel Review — 2026-11-04

## Scope and preflight
- Owning repository/area: `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`, admin/support panel, intelligence telemetry and benchmark review.
- Risk: Amber subject matter; this review was read-only. No controls that approve, publish, reset, seed, or start a benchmark were used. No test suite was run; the task was to inspect existing tests and live admin views.
- Branch: `feat/integrated-dev`; HEAD `3467abad4eca8d82ffc52756fee13874e389597f`.
- Existing worktree was already dirty at inspection (155 status entries after the pre-existing user-started runtime benchmark had generated its records; no repository source changes were made by this review). No staging, commit, reset, stash, or branch switch.
- Governing sources read: repository `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `docs/intelligence/benchmark/README.md`; `BENCHMARK_HOUSEHOLD_WORLD.md`; `BENCHMARK_SCORING_FRAMEWORK.md`; historical readiness report `docs/implementation/benchmarking/INTQ5_INTELLIGENCE_DASHBOARD_AND_TEST_DATA_READINESS_IMPLEMENTATION.md`; `INTQ6_BENCHMARK_HOUSEHOLD_WORLD_IMPLEMENTATION.md`; `INTQ9_BENCHMARK_MEASUREMENT_ACCURACY_HARDENING_IMPLEMENTATION.md`.
- Authority gaps/conflicts: no current architecture conflict found. The dashboard's `WorldModeBanner` copy is stale for the newer `benchmark-world` mode: its generic non-deterministic branch says “your own live household” and “those fixtures do not exist yet.” INTQ6 and the current UI describe a separate seeded 10-household DEV benchmark world. Six certification fixtures remain distinct; the scoring framework correctly says G2/G4 are not measured in `benchmark-world`.

## Findings

### Benchmark and tests
The Intelligence Dashboard showed a latest full run at 78.2/100 over 100 questions and no hard gates among assignable gates, but it is PARTIAL. The report uses deterministic-only judging: judge criteria D1/D2/D5/D6 (68 of 100 weighted points) are not independently judged; it records one watchlist question TS-091 in Trust & Safety (68.3). It also says G2 (dietary hard-constraint) and G4 (cross-household leakage) are not evaluated in this world mode; empty gate lists mean “not measured,” not “clear.” Ten advertised registered capabilities were not executed in that run. Thus the score is a diagnostic signal, not a release/certification result.

The browser-observed ten-household quick batch produced scores between 76.4 and 79.1 across its ten runs, with 100% honest-gap acceptance and 10 questions each. A separate 100-question full run scored 78.2. This is visible run history, not a clean deterministic certification: current admin copy incorrectly describes benchmark-world as a live household, while the canonical world-mode architecture says the 10 seeded DEV world is still not the six certification fixtures.

Existing benchmark regression tests found (not executed):
- `server/tests/test-benchmark-routing-integrity.ts`
- `server/tests/test-benchmark-no-production-branch.ts`
- `server/tests/test-benchmark-conversation-isolation.ts`
- `server/tests/test-benchmark-capability-utilisation.ts`
- Framework/scorer/runner support also exists under `server/tests/benchmark/`.

The admin panel does not expose the repository's unit/integration test runner. It exposes benchmark execution and historical result drill-down. The user-started batch was already active when this inspection began; this review did not start or control it.

### Admin pages reviewed
- **Overview:** 24 knowledge terms await review; latest benchmark partial at 78.8 at first load.
- **Companion Intelligence:** 305 turns; understanding 88%, success 75%; no user helpfulness ratings. Follow-through is near zero (2 of 14,038 displayed suggestions), so proposed guidance is not evidence of effective household use. The dashboard's “84 retained misses” differs from its displayed fallback buckets total (66); definitions/windows are not explained in the UI and should be reconciled before using these as a single count.
- **Observations (last 7 days):** 3,785 observations, 96.2% success, 3.8% failure, 6.2% clarification, mean confidence .77, response 1,751 ms, zero error-severity observations. There are still warning/gap outcomes (notably planner, nutrition-knowledge, diary, discovery). Context reports 171 budget-exceeded compositions out of 244; this is frequent and merits investigation, though no application failure is implied by the metric alone.
- **Behaviour:** 302 decisions, zero rated outcomes, effectiveness unavailable; 226 voiced, 63 honest-gap, 9 experience, 2 escalation, 2 not voiced. Guidance surfaces have almost no recorded follow-through.
- **Activity Monitor:** could not load governed activity data; do not infer “no activity.”
- **Claim Review:** 64 cited claims awaiting review, 3,299 awaiting a source (not publishable), 21 approved/live. Approval propagates broadly across household-facing intelligence, so this is a consequential reviewer action.
- **Knowledge Review:** 24 queued terms remain unresolved; recommendation notes exist from the prior queue task. This is separate from claim approval.
- **Canonical Publication Integrity:** page did not show a result; Re-verify was disabled. Integrity is unknown from this view.
- **Development World:** page remained at “Loading… / 0 of 0” during inspection; no household list could be confirmed.
- **Recipe Sources:** five official/licensed sources are listed; only TheMealDB configured, four require keys and are disabled. Four scraped sources are configured but disabled. No toggles changed.
- **Picks:** product/pick maintenance view; no changes made.
- **Users:** administrative user-management page with role, password, onboarding and account-repair controls; no changes made.
- **Benchmark Households:** describes ten seeded, permanent DEV-only Auto households, reset before runs; no actions taken.

## Evidence and limitations
Evidence came from the local browser at `127.0.0.1:5001` and repository source/docs. Admin summaries use different windows/definitions; counts were not treated as directly comparable without a documented common query. No tests were run because the request was inspection of tests/pages, not verification of an implementation. The browser UI was read-only except navigation; the separately pre-existing benchmark batch completed and appended visible run history during this session.

## Completion
No application code, database, live configuration, or admin state was intentionally modified. No tests executed. This investigation note is saved locally; it was not staged or committed because no commit authorization was given and the worktree contains pre-existing user changes.
