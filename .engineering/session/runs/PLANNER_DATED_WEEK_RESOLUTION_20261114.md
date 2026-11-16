# PLANNER_DATED_WEEK_RESOLUTION — Session Run — 2026-11-14

## THA Governance Preflight Receipt
- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Worktree / branch:** specified integrated-dev worktree, `feat/integrated-dev`
- **Base HEAD:** `834c1d46cdf8c9108e05fed4e6044252b03a3a20`
- **Pre-change Git status:** 71 dirty paths; preserve all existing work. Target resolver and INT20 tests were already dirty. Byte-exact pre-state copies are under `.engineering/session/prestate/PLANNER_DATED_WEEK_RESOLUTION_20261114/`.
- **User request:** resolve weekday calendar language against uniquely matching dated Planner weeks; retain clarification when no dated week resolves; preserve numbered-week behavior; no backfill; live verify household 44 and an undated household.
- **Mandatory governance read:** root `AGENTS.md`; `PROJECT_GOVERNANCE.md`; `docs/architecture/README.md`; `docs/architecture/ENGINEERING_WORKFLOW.md`; `.engineering/OPERATING_MANUAL.md`; `docs/change-control.md`.
- **Task-specific architecture read:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`; `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`; `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`; `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`; `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`; `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`; `THA_EXPERIENCE_BLUEPRINT.md`; `THA_EXPERIENCE_ARCHITECTURE.md`; `THA_EXPERIENCE_LANGUAGE.md`; `THA_UI_ARCHITECTURE.md`; `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`; `GOVERNING_EXPERIENCE_ARCHITECTURE.md`; AI operating-model `evidence-and-architecture.md`, `implementation-and-compliance.md`, `principles.md`, `risk-and-approval.md`, `rollback-and-output.md`.
- **Existing implementation/assets inspected:** Companion `action-resolution.ts` and `action-language.ts`; Planner capability binding and read handler/port; canonical `shared/time/household-time.ts`; Gateway Context Frame construction; Planner calendar UI (`weekly-planner-page.tsx`); planner binding and INT20 resolver tests.
- **Authorized scope:** Companion weekday targeting through existing Planner read + Household Time owners; tests and reports for this behavior.
- **Explicit non-goals:** no diary changes; no numbered-week behavior changes; no backfill/migration; no direct DB reads/writes; no confirm-route or planner write-handler changes; no new assistant or date owner; no commit, push, deploy, restart.
- **Architecture conflicts:** NONE. The resolver has stale blanket-refusal prose/behavior. Canonical Household Time defines `planner_weeks.weekStartDate` as the calendar identity; HT7 forbids backfilling old null anchors. Conditional dated-week matching extends that owner and retains honest gaps for null anchors.
- **Decision/risk:** Red, approved by direct user instruction. Affects AI action resolution and planner write targeting. Existing Intelligence Platform and Intent Engine remain the only action path; planner reads stay permission-aware and household-scoped; no parallel state/workflow.
- **Implementation permitted:** YES (standing `feat/integrated-dev` dev authority in repo AGENTS/PROJECT_GOVERNANCE).
- **Rollback identifier:** annotated tag `rollback/PLANNER-DATED-WEEK-RESOLUTION-20261114` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.

## Implementation plan / Red controls
- **Options/trade-off:** read the exact dated Planner week via the existing planner capability, using household temporal anchor/canonical civil-date arithmetic. If no unique date exists, ask; do not map to ordinal or active UI week. This is safer than a blanket calendar refusal and preserves HT7.
- **Definition of done:** dated bare/this weekday resolves to its matching dated planner week; next weekday resolves to next calendar week; explicit Week N still resolves by week number; all-null candidates return clarification even when an undated week is active; duplicates/read gaps return clarification; tests cover both resolution and household-scoped read path.
- **Data impact:** reads existing household planner weeks/days; writes no data; changes no stored meaning; no backfill.
- **Trust check:** exact ISO civil week anchor required; no fallback to arbitrary ordinal; target remains existing household planner read/action permission path. Highest remaining claim requiring live evidence: household 44's present DB rows and the all-null household case (Neon project lookup is currently empty).
- **Rollback:** tag above anchors committed HEAD; exact dirty-file snapshots preserve pre-existing target edits. Revert only this task's hunks, retaining the pre-existing dirty hunks. No reset/clean/stash.
- **Scope lock:** only action resolver, planner read handler's existing day-resolution parameter, tests, and required reports. Suggestions are separate.
- **User acceptance:** from Planner, on 2026-11-14 ask to add a meal to bare “Thursday dinner” and confirm proposal targets Thursday 2026-11-19 in week 23 (start 2026-11-16); ask “next Wednesday dinner” and confirm week 23; confirm explicit “Week 1 Thursday” remains Week 1; on household with only null anchors, ask bare Thursday and verify the Companion asks which planner week without proposing a write.
- **Release timing:** dev branch only; no promotion or deployment authorized.
- **Deployment checklist:** not applicable in this task (no deploy, schema, data migration, or production change).

## Work log
- No implementation edits at receipt creation time.
- Neon project discovery returned no projects for `tha-integrated-dev` or `Healthy Apples`; do not claim live database verification unless access becomes available.

## Implementation and verification update
- Implemented conditional date-based weekday routing through the existing Planner read capability; explicit Week N stays on its old branch.
- Focused results: INT20 82/82, Planner binding 55/55, TIME3 P7 anchor 51/51. Typecheck total 16 (baseline 16), zero touched-file errors. git diff --check passed.
- Live DB check blocked: no dev listener on 5000/5173; Neon project searches returned empty. No live row/API verification, no database write, no service restart.
- Latest Planner binding regression run: `npm run test:intelligence-planner-binding` — **56 passed, 0 failed**, including a household whose only Planner week is null-dated. Existing `[ObservationEngine] record failed` diagnostics appear after the test summary.
- `.engineering/scripts/repo-structure-verify.sh` could not start in this Windows sandbox (`Bash/E_ACCESSDENIED`); this is an environment limitation, not a passing result. The implementation report is placed at `docs/implementation/planner/`.
- Owner correction: bare “Thursday dinner” after Thursday 2026-11-12 had passed must target the next occurrence (2026-11-19), not the expired weekday in the current week. Resolver now computes the next weekday occurrence from the household temporal anchor, then queries the exact dated week. Explicit `this <weekday>`, `next <weekday>`, and Week N retain their defined meanings.
- Captured pre-correction source/test snapshots at `.engineering/session/prestate/PLANNER_DATED_WEEK_RESOLUTION_20261114/before-upcoming-week-correction/`; existing rollback tag remains `rollback/PLANNER-DATED-WEEK-RESOLUTION-20261114`.
- Follow-up verification after correction: `npm run test:int20-natural-language-actions` — **82 passed, 0 failed**; `npx tsc --noEmit -p . --pretty false` — **16 existing baseline errors**, with none in the changed resolver or test. Planner binding remains **56/56** and TIME3 remains **51/51** from the immediately preceding verification; neither suite's code changed in this correction.
- Implementation report: docs/implementation/planner/PLANNER_DATED_WEEK_RESOLUTION_20261114.md.
