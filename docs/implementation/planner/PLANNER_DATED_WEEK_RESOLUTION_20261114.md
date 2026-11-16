# PLANNER_DATED_WEEK_RESOLUTION — Implementation Report — 2026-11-14

## Architecture Compliance
- **Verified — canonical owners:** `shared/time/household-time.ts` owns civil-date/week arithmetic; `planner_weeks.weekStartDate` is the Planner-owned calendar identity (Household Time Architecture §3; Source of Truth Register Domain 14).
- **Verified — consumers:** the Planner UI reads and navigates dated weeks (`client/src/pages/weekly-planner-page.tsx`); this change makes the existing Companion action resolver a consumer of those same anchors. The planner read port already reads household-owned weeks via `getPlannerWeeks(userId)`.
- **Verified — no duplicate ownership/state/workflow:** action resolution derives the candidate Monday from the per-turn household temporal anchor and uses the existing planner capability read. It stores no date and adds no route, DB writer, assistant, or conversation state.
- **Verified — architecture extended:** Household Time pure helpers and the permission-aware Planner read binding are reused. Intent Engine execution/confirmation and the existing Planner write handler remain the only action path.
- **Capability Registry:** no new capability or verb; planner `read` contract is extended to accept an exact `weekStartDate` for `scope: day`. Planner write permissions remain unchanged.
- **Experience Constitution:** explicit calendar wording resolves only where the household's dated Planner supports it; otherwise the Companion asks. Existing explicit Week N remains untouched.

## Definition of Done
- A bare weekday targets its next occurrence on or after the household temporal anchor; if that falls in a later week, use that dated Planner week. `this <weekday>` means that weekday in the current calendar week, and `next <weekday>` means the following calendar week.
- `next <weekday>` uses the corresponding weekday in the next calendar week.
- Explicit Week N continues to resolve by week number, including a null-dated legacy week.
- No matching dated week, duplicate date, invalid temporal anchor, or absent day returns a clarification/gap; no active-screen or undated ordinal fallback.
- No migration/backfill, no planner write-path change, no diary change.
- Manual acceptance criteria (not performed in this session): on 2026-11-14, household 44 bare `Thursday dinner` resolves to Thursday 2026-11-19 in week 23 (`2026-11-16`); `next Wednesday dinner` resolves to week 23; explicit Week 1 still resolves to Week 1; an all-null household is asked which Planner week.

## Product Registry Impact
- Registry affected: **NO**. This is a conditional resolution improvement within the existing Companion Planner action. It adds no new product capability, entity, page, or user promise.
- Entries created/updated/retired: NONE.
- Product knowledge added to prompt/template/fallback: NO.

## Adoption Register Impact
- Register affected: **NO**. No client-side building block added, adopted, or retired.

## Data Impact
- Reads existing data: **YES** — household planner weeks/day rows and the already-assembled household temporal anchor.
- Writes new data: **NO**.
- Changes meaning of existing data: **NO**.
- Requires backfill: **NO** — HT7 null anchors remain null.

## Trust Check
- Does not imply an undated week has a calendar date. Exact `weekStartDate` lookup must return one row; zero or multiple matches gap.
- Wrong/unavailable date leads to a clarification before a write proposal; the ordinary confirm step still gates execution.
- No guessed target is displayed as fact. Highest-risk claim still Inferred: live rows for household 44 and the selected all-null household could not be queried in this session.
- No new source of truth or duplicated owner: **YES**.

## Rollback Plan
- Annotated rollback tag: `rollback/PLANNER-DATED-WEEK-RESOLUTION-20261114` → `834c1d46cdf8c9108e05fed4e6044252b03a3a20`.
- Pre-edit copies of the already-dirty action resolver and INT20 test, and the clean Planner read handler, are in `.engineering/session/prestate/PLANNER_DATED_WEEK_RESOLUTION_20261114/`.
- `action-language.ts` was already dirty before this task; this task adds only two weekday relation recognition lines. To roll this task back, remove those two lines and the task-specific date-resolution/read-handler hunks, retaining all prior dirty hunks. Do not run blanket `reset`, `clean`, or `checkout`.
- After rollback, rerun the three targeted suites below.

## Architecture Convergence Status
| Field | Value |
|---|---|
| Domain | 14 — Planner, using the Household Time reference vocabulary |
| Current canonical owners | Planner DB `planner_weeks.weekStartDate`; `shared/time/household-time.ts` owns time rules |
| Runtime consumers found | Planner UI; Companion action resolver (now consumes the owner through Planner read) |
| Duplicate owners/state/workflows introduced | None |
| Current convergence | No architecture percentage declared for this specific consumer; existing canonical owners remain unchanged |
| Target convergence | Companion weekday resolution consumes the existing dated-week owner and canonical civil-date rules |
| Next milestone | Live acceptance against household 44 and an all-null household |
| Remaining risk | Cannot verify current database rows/live route from this session |

## Scope Lock
- Implemented: temporal weekday relation parsing; exact date-based Planner day read; conditional date resolution in Companion action resolution; regression tests and reports.
- Excluded: database migrations/backfills; numbered-week behavior changes; diary calendar changes; direct DB code or write path; UI changes; server start, database edits, commit/push/deployment.
- SUGGESTIONS: none.

## Implementation Completion Report
- **Architecture Complete: PARTIAL** — canonical owners reused; live household rows unavailable for validation.
- **Engineering Complete: YES** — focused suites and typecheck completed (results below).
- **Interaction Complete: PARTIAL** — unit-level resolution verified; live Companion UI confirmation unavailable because no local server was listening and Neon project discovery returned no projects.
- **Existing Assets Used:** Household Time civil date helpers; planner capability registry/read handler/read port; per-turn temporal anchor; existing clarification and confirmation flow.
- **New Assets Required:** NONE.
- **Remaining Gaps:** live acceptance — environment boundary; impact is that actual week 22 / week 23 / all-null household records were not observed; next action is owner dev-session retest; capability is local Companion UI backed by the authorized dev DB.
- **Stop Test:** no code/test/report work independent of live DB availability was left unattempted.

## Verification
- `npm run test:int20-natural-language-actions` — **82 passed, 0 failed**.
- `npm run test:intelligence-planner-binding` — **56 passed, 0 failed**. Includes exact dated lookup, missing date honest gap, an all-null-dated household honest gap, and household ownership checks. Test process emitted existing `[ObservationEngine] record failed` diagnostics after the passing summary; no test assertion failed.
- `npm run test:time3-p7-planner-week-anchor` — **51 passed, 0 failed**; confirms HT7 null-anchor behavior remains intact.
- `npx tsc --noEmit -p . --pretty false` — **16 errors**, matching the existing baseline of 16; zero errors in the touched resolver, parser, Planner read handler, or targeted tests.
- `git diff --check` for touched source/test files — passed.
- Live verification requested: **not completed**. `Get-NetTCPConnection` found no listeners on 5000/5173; Neon `list_projects` searches for `tha-integrated-dev` and `Healthy Apples` returned empty. No `.env` inspection, service startup, database access, or data mutation was performed.
- Repository structure verification script: **not completed**. `.engineering/scripts/repo-structure-verify.sh` could not start under this Windows sandbox (`Bash/E_ACCESSDENIED`). The implementation report is located under `docs/implementation/planner/` as required; the script result is an environment limitation, not a passing check.
- No commit, push, migration, or deployment.

## Owner correction — upcoming bare weekday (2026-11-14)
- The owner observed that bare `Thursday dinner` on Saturday 2026-11-14 proposed Thursday 2026-11-12, which had already passed. Corrected bare weekday resolution to select the next occurrence on or after the household's temporal anchor; this selects 2026-11-19 and week start 2026-11-16 for the reported case.
- `this <weekday>` still explicitly means the weekday in the current calendar week; `next <weekday>` still means the following calendar week. Explicit Week N remains unchanged.
- Added a pre-correction byte-exact snapshot of `action-resolution.ts` and `test-int20-natural-language-actions.ts` under `.engineering/session/prestate/PLANNER_DATED_WEEK_RESOLUTION_20261114/before-upcoming-week-correction/`. The existing annotated rollback tag remains the clean-HEAD rollback anchor.
- Reverification after correction: `npm run test:int20-natural-language-actions` — **82 passed, 0 failed**; `npx tsc --noEmit -p . --pretty false` — **16 existing baseline errors**, with no errors in the changed resolver or test. Planner binding remains **56/56** and TIME3 remains **51/51** from the immediately preceding verification; neither suite's code was changed by this correction.

## Files changed by this task
- `server/intelligence/conversation/action-language.ts` (already dirty; added weekday relation recognition)
- `server/intelligence/conversation/action-resolution.ts` (already dirty; retained existing changes and added conditional resolver)
- `server/intelligence/handlers/planner-read-handler.ts`
- `server/tests/test-int20-natural-language-actions.ts` (already dirty; retained existing changes and added coverage)
- `server/tests/test-intelligence-planner-binding.ts`
- `.engineering/session/runs/PLANNER_DATED_WEEK_RESOLUTION_20261114.md`
- `.engineering/session/prestate/PLANNER_DATED_WEEK_RESOLUTION_20261114/` (rollback snapshots)
- `docs/implementation/planner/PLANNER_DATED_WEEK_RESOLUTION_20261114.md`
- `G:\The Healthy Apples\Incoming\Agent Reports\Codex_2026-11-14_Planner_Dated_Week_Resolution.md`
