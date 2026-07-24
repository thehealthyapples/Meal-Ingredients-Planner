# Planner Continuous Timeline — Implementation Report

**Session ID:** `PLANNER1_Continuous_Timeline`
**Date:** 2026-07-22
**Rollback identifier:** `rollback/PLANNER-continuous-timeline-20260722` → `d3968593`
**Status:** Complete — see § 12 for the commit

---

## 1. Mission

Replace the Planner's fixed six-week rota with a **continuous, dated, unbounded timeline**, while
preserving every existing planner behaviour, API, meal assignment and household-planning path. Extend
the existing planner architecture (`planner_weeks`) rather than replacing it; introduce no second
timeline and duplicate no planner state.

## 2. What the "six-week window" actually was

There was **no retention/pruning mechanism** — nothing in the codebase ever deleted, pruned, or rolled
off old planner weeks, so historical data was *already* preserved indefinitely. The limitation was a
**hard creation cap**: `storage.createPlannerWeeks` eagerly created exactly six weeks
(`for (w = 1; w <= 6; w++)`), the `unique(user_id, week_number)` constraint forbade growth, and
`resolvePlannerWeek` reported `window-expired` once today fell past the last dated slot. The mission is
therefore realised by **removing the cap and making weeks a dated, on-demand, unbounded sequence** — not
by changing any retention policy.

## 3. Design (approved 2026-07-22)

Two decisions were the user's and were taken before implementation:

1. **Amend TIME3 + implement.** `week_number` is promoted from a *"fixed 1–6 slot label"* to an
   **unbounded, per-household ordinal** (a stable id, still `UNIQUE(user_id, week_number)`, still never
   renumbered — HT8). **`week_start_date` is the week's calendar coordinate**; ordering and navigation are
   by date, not by number. This preserves *"weekNumber is not a time coordinate"* (BEH-5) exactly —
   the coordinate is, and always was, the anchor.
2. **Forward-dated, legacy undated.** The dated timeline runs **forward from the household's real current
   week**. The **192 of 195** existing households whose weeks predate the anchor keep their `NULL`-date
   weeks, preserved and shown honestly as **undated legacy weeks**. **No anchor is ever back-filled**
   (HT7). The current dated week is **created on demand** (an observation of the present, exactly as
   `createPlannerWeeks` already anchors), which resolves the **`window-expired`** product decision
   `TIME1 §15.1` deliberately left open: *the window never expires, because the current week is created
   when the household arrives.*

### Single owner, no duplication
`planner_weeks → planner_days → planner_entries` remains the single owner of planner state. No new table,
no second timeline, no parallel store. `resolvePlannerWeek` (the one answer to "which week am I living in")
and `createPlannerWeeks` (the initial six-week onboarding) are **unchanged**.

### New building blocks (all additive)
- `storage.ensureDatedPlannerWeek(userId, mondayCivilDate)` — find-or-create the week for a real Monday;
  next `week_number` via SQL `MAX(week_number)+1`; **INSERTs** `week_start_date`, never UPDATEs it.
- `storage.getCurrentDatedPlannerWeek(userId, now?)` — the household's real current week (`householdWeekOf(
  householdToday(now, zone))`), ensured on demand. The landing week.
- `storage.getPlannerWeekByStartDate(userId, mondayCivilDate)`.
- Batched day/entry loading for `/api/planner/full` (constant queries regardless of history depth).
- `GET /api/planner/timeline/current` (landing) and `POST /api/planner/timeline/week` (navigation
  create-on-demand).
- Index `planner_weeks (household_id, week_start_date)` for efficient dated range access.

## 4. Architecture Compliance

- **Bootstrap read:** `docs/architecture/README.md`, `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (TIME3) §13/§14
  and migration principles, and the Household-Time verification gates in `publication-register.ts`.
- **Governed amendment (TIME3):** the only governing change. `week_number` is redefined as an unbounded
  ordinal and `week_start_date` named the calendar coordinate; migration principle 3 is amended in place
  (not contradicted), and the `window-expired` open decision (`TIME1 §15.1`) is resolved. Recorded in
  `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` and here.
- **HT7 (never back-fill):** honoured absolutely. Existing `NULL` weeks stay `NULL`; the anchor is only
  ever written at INSERT for a real Monday the household is living in or has navigated to.
- **HT8 (declare, do not renumber):** existing week numbers are never renumbered; `day_of_week` untouched.
- **HT1 / one owner (`ht-one-planner-week-owner`):** no new "current week" derivation — the Monday comes
  from the owner's `householdWeekOf`; the next ordinal is computed in SQL, never via a `max(weekNumber)`
  idiom.
- **Core Principle 6 / `ht-no-fabricated-dates`:** no date is derived from a week number; every date is a
  lookup over `week_start_date` or a real navigated Monday.
- **Experience Constitution Check:** _(§ 8)_.

## 5. Definition of Done

- [x] Existing planner behaviour unchanged — `resolvePlannerWeek`, `createPlannerWeeks`, every
      `/api/planner/*` entry/day/eater/template endpoint untouched; the meal-assignment chain
      (`planner_weeks → planner_days → planner_entries`) is byte-identical. Verified: planner
      suites green (compliance 25/0, rm4 21/0, intelligence-planner-binding 35/0, home2 47/0).
- [x] Historic weeks remain accessible — nothing is pruned or deleted; undated legacy weeks are
      preserved and reachable through the selector (test §5; selector lists all weeks).
- [x] New weeks created correctly — `ensureDatedPlannerWeek` creates dated weeks beyond week 6
      with a real anchor and 7 days (test §1, §2).
- [x] Navigation is unrestricted — prev/next step ±7 days without limit, creating weeks on
      demand in both directions (test §2: 30 weeks forward and back both resolve).
- [x] Current week is the default landing view — `/api/planner/timeline/current` + the landing
      effect; the current week is created on demand so landing never "picks" a week.
- [x] Every week displays real calendar dates where anchored (`formatWeekRange` →
      "20–26 July 2026"); honest name-only where undated (no date invented — test §5).
- [x] No performance regression — `/full` batched to constant queries; timeline index added.
- [x] Tests pass — new suite 27/27; time3 (73/51/60/34, 0 failed); planner suites green;
      `verify:publication` byte-identical to baseline (Household Time 🟢); typecheck 0 new errors.

## 6. Data Impact

- **No destructive change.** No row deleted, no anchor back-filled, no column made `NOT NULL`.
- **Additive schema:** one index on `planner_weeks (household_id, week_start_date)`.
- **Behavioural change for the 192/195 unanchored households:** on their next planner visit a real,
  dated **current week is created** (empty), and their existing undated weeks become **legacy** (fully
  preserved, still reachable, still carrying their meals). This is the approved forward-dated design and
  is honest — THA genuinely cannot know which calendar week their old "Week 1" was (HT7).
- New/on-demand weeks accrue over time; they are never pruned (the mission's explicit requirement).

## 7. Trust Check

- No fabricated dates: unanchored weeks are shown as undated, never given an invented calendar date.
- No silent data loss: all existing weeks/meals preserved.
- No second source of truth: `planner_weeks` remains the single owner.
- The one behavioural surprise (legacy households landing on a fresh current week) is documented, honest,
  and the direct consequence of an approved decision — not a hidden side effect.

## 8. Experience Constitution Check (§ 18.2)

- **Hospitality (§ 3.1):** the room does the arithmetic — a household arrives and is placed in
  *this week*, dated in their own words, with the whole of their planning history a step away.
  They never meet a "window expired" dead end or have to work out which week they are looking at.
- **Outcome (§ 3.5):** *less to carry* — the Planner now anchors every week to real time, so the
  household never has to translate "Week 3" into a date, and their past plans are never lost.
- **Weight (GEA2):** the room is not heavier — one selector gains dates and two quiet chevrons;
  no new panel, no new decision, no new voice. A more capable Planner is a calmer one.
- **Voice (GEA8/GEA9):** the Planner still only *reports* (dates, weeks, meals). It coaches
  about nothing and congratulates nothing. All new strings are dates and labels.
- **Ownership (§ 7.4, GEA21/22):** the room states facts (which week, what dates); it forms no
  interpretation and makes no observation across time. The date is a *lookup*, never a judgement.
- **Agency (GEA23):** nothing decides for the household. Navigation is theirs; creating a week is
  the household *declaring* it (TIME1 § 6.2). THA never picks a week on their behalf (BEH-3).
- **Restraint (GEA11/13/15):** no score, streak, ranking or reward; undated weeks are shown as
  undated, never dressed up with an invented date.
- **Layer (GEA20):** this change names the principle above it (Household Time / TIME3) and amends
  that Architecture owner *in the same change*, flowing downward from law to implementation.

## 9. Manual Verification Steps

1. **Landing on the current week.** Open the Planner. It lands on the week containing today,
   labelled with real dates (e.g. "20–26 July 2026"). Reload — it lands on the current week again.
2. **Unbounded forward navigation.** Click the right chevron repeatedly, well past six weeks from
   now. Each click advances one week, shows the next date range, and lets you assign meals. No
   "window expired" state ever appears.
3. **Unbounded backward navigation.** Click the left chevron repeatedly into the past. Each click
   goes back one dated week; meals assigned there persist and are reachable again later.
4. **History is preserved.** Assign a meal several weeks back, navigate away and back — it is still
   there. Nothing is pruned.
5. **Meal assignment unchanged.** Add, replace, reorder, duplicate and clear meals on any dated
   week; per-eater overrides, tailoring and week templates behave exactly as before.
6. **Legacy household (unanchored).** For a household whose weeks predate the anchor, the Planner
   lands on a fresh, real, dated current week; their earlier weeks appear in the selector as
   undated legacy weeks (named "Week 1", … — never given an invented date), with their meals intact.
7. **Selector.** The week dropdown lists every week in calendar order, dated where known, name-only
   where undated.

## 10. User Acceptance Evidence

Interactive UAT was not run in this environment (no browser session); the following automated
evidence stands in its place and is reproducible:

- **New behavioural suite** — `npm run test:planner-continuous-timeline`: **27 passed, 0 failed**
  (continuity, unbounded ±30-week navigation, date-as-coordinate, HT7 no-back-fill, legacy-undated).
- **No regression, existing planner** — `planner-compliance` 25/0 · `rm4-planner-ready-meal-library`
  21/0 · `intelligence-planner-binding` 35/0 · `home2-home-primary-action` 47/0.
- **No regression, Household Time** — `time3-household-time` 73/0 · `time3-p7-planner-week-anchor`
  51/0 · `time3-p8-t5-convergence` 60/0 · `time3-p9-retire-the-fabricator` 34/0.
- **Governance gates unchanged** — `verify:publication` byte-identical to the rollback baseline
  (55 passed · 23 warned · 5 failed — all five pre-existing and unrelated; **Household Time 🟢**,
  every HT gate green). `verify:coherence` identical to baseline (2 pre-existing failures, neither
  mine). `adoption:check` identical to baseline (100 passed · 9 pre-existing failures).
- **Type & build** — `tsc --noEmit`: 88 errors, **identical set on baseline and after** (0 new);
  `npm run build` (client vite + server) succeeds.

## 11. Rollback

- **Identifier:** `rollback/PLANNER-continuous-timeline-20260722` → `d3968593`
- **To roll back:** `git reset --hard rollback/PLANNER-continuous-timeline-20260722` (or revert the
  implementation commit). The only schema artifact is an additive index, safe to leave or drop.

## 12. Commit

- **Commit hash:** `72aa04b90ee3bd1b50ce089dd0c35a1d5e638955` (`72aa04b9`)
- **Branch:** `int1-intelligence-platform`
- **Files changed:**
  - `shared/schema.ts` — `weekNumber` redefined as unbounded ordinal; `(household_id, week_start_date)` index
  - `server/migrations/runner.ts` — additive timeline index migration (`2026-07-22_planner1_continuous_timeline_index`)
  - `server/storage.ts` — `ensureDatedPlannerWeek`, `getCurrentDatedPlannerWeek`, `getPlannerWeekByStartDate`, `getPlannerDaysByWeekIds`
  - `server/routes.ts` — `/api/planner/timeline/current`, `/api/planner/timeline/week`; batched `/full`
  - `server/tests/test-planner-continuous-timeline.ts` — new suite (27 assertions)
  - `package.json` — registered + wired the suite into `npm test`
  - `client/src/pages/weekly-planner-page.tsx` — date labels, current-week landing, unbounded prev/next navigation
  - `docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md` — governed amendment (migration principle 3; window-expired resolved)
  - `docs/implementation/planner/PLANNER_CONTINUOUS_TIMELINE.md` — this report
  - `.engineering/session/runs/PLANNER1_Continuous_Timeline.md`, `.engineering/session/CURRENT.md` — session record
