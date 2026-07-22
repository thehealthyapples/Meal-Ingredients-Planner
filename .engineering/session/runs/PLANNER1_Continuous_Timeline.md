
# Session: PLANNER1_Continuous_Timeline

| Field | Value |
|---|---|
| **Session ID** | `PLANNER1_Continuous_Timeline` |
| **Rollback ID** | `rollback/PLANNER-continuous-timeline-20260722` |
| **Start time** | 2026-07-22T08:22:26Z UTC |
| **Current stage** | Complete |
| **Commit** | `72aa04b90ee3bd1b50ce089dd0c35a1d5e638955` (`72aa04b9`) |

## Objective
Replace the Planner's fixed six-week rota with a continuous, dated, unbounded timeline; extend `planner_weeks` (single owner — no second timeline); preserve all history and existing planner APIs, meal assignments and household planning; governed amendment to TIME3.

## Approved design (user decisions 2026-07-22)
- **Amend TIME3 + implement**: `weekNumber` becomes an unbounded per-household ordinal; `weekStartDate` is the week's calendar coordinate. Renumbering still forbidden (HT8).
- **Forward-dated, legacy undated**: continuous dated timeline runs forward from the household's real current week; existing NULL-anchor weeks preserved and shown as undated legacy weeks. Zero back-fill (HT7). The current dated week is CREATED on demand (present observation), which resolves the TIME1 §15.1 "window-expired" open decision — the window never expires.

## Gate-safety constraints (confirmed from publication-register.ts)
- INSERT-only for `weekStartDate` — never `.update(plannerWeeks).set({weekStartDate})` (`ht-anchor-is-never-back-filled`).
- Next ordinal computed in SQL `MAX(week_number)+1` — avoid `Math.max(...map(weekNumber))` / `reduce(...weekNumber>...)` idioms (`ht-one-planner-week-owner`).
- No `approxDate`/`now − weeks×7` date derivation; a date is a lookup over `weekStartDate` or a real navigated Monday (`ht-no-fabricated-dates`).
- No `?? 1` / week substitution when unanchored — create a real week, never pick one (`ht-unanchored-is-never-filled-in`).

## Files being modified
- `shared/schema.ts` — amend `weekNumber` comment (unbounded ordinal); add index on `(householdId, weekStartDate)`
- `server/migrations/runner.ts` — additive migration: the timeline index (no column/DEFAULT/UPDATE — gate-safe)
- `server/storage.ts` — `ensureDatedPlannerWeek`, `getCurrentDatedPlannerWeek`, `getPlannerWeekByStartDate`, batched day/entry fetch for `/full`; `createPlannerWeeks` unchanged (still 6, HT7)
- `server/routes.ts` — `GET /api/planner/timeline/current` (landing), `POST /api/planner/timeline/week` (nav create-on-demand); batch `/full`
- `docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md` — governed amendment (migration principle 3 + continuous-timeline section)
- `client/src/pages/weekly-planner-page.tsx` — real-date labels, current-week landing, unbounded prev/next date navigation
- `server/tests/test-planner-continuous-timeline.ts` — new suite; `package.json` — register + wire into `npm test`
- `docs/implementation/PLANNER_CONTINUOUS_TIMELINE.md` — the report

## Scope refusals (decisions, not omissions)
- **No back-fill** of the 192/195 unanchored households' existing weeks (HT7) — they become undated legacy.
- **No change to `resolvePlannerWeek`** or `createPlannerWeeks`' formula — existing time3 suites stay green.
- **No second timeline / no duplicated planner state** — `planner_weeks` remains the single owner.

## Checkpoints
- [x] Architecture bootstrap read (README, TIME3 §13/§14 + migration principles, HT gates)
- [x] Planner architecture mapped (schema, storage, routes, client, tests)
- [x] User decisions captured (amend TIME3; forward-dated/legacy-undated)
- [x] Rollback protection created and reported
- [x] TIME3 governed amendment authored (migration principle 3 + window-expired resolution)
- [x] Schema comment + timeline index migration (`2026-07-22_planner1_continuous_timeline_index`)
- [x] Storage: `ensureDatedPlannerWeek` / `getCurrentDatedPlannerWeek` / `getPlannerWeekByStartDate` / `getPlannerDaysByWeekIds`
- [x] Routes: `/timeline/current`, `/timeline/week`, batched `/full`
- [x] Backend typecheck clean (0 new errors; 88 pre-existing both sides); verify:publication identical to baseline (Household Time 🟢)
- [x] New suite `test-planner-continuous-timeline` 27/27; time3 (73/51/60/34) + planner suites green
- [x] Client: date labels (`formatWeekRange`) + current-week landing + unbounded prev/next nav; design-system `Button` + direct apiRequest (adoption back to baseline 100/9)
- [x] Client typecheck clean; full build (vite + server) succeeds
- [x] Committed `72aa04b9`; hash recorded in report § 12 and here

**Last checkpoint:** Committed `72aa04b9`. Implementation complete; all gates byte-neutral vs baseline.

## Next action
Complete — nothing outstanding. (Documentation-only follow-up amendment for the hash is committed separately.)

## Blockers
None.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
