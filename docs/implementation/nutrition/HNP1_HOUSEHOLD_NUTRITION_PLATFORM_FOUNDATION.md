# HNP1 — Household Nutrition Platform Foundation

**Status:** Implemented
**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/HNP1-household-nutrition-platform-20260712`
**Tests:** `npm run test:hnp1-household-nutrition` (63 assertions)

---

## 0. MANDATE

Give a household one honest answer to *"how are we eating?"* — a score, a weekly
summary, insights, plant diversity, nutrition balance, and opportunities — composed
**entirely from facts THA already owns**, and surfaced on the nutrition dashboard.

Explicitly **not** in scope, and deliberately not done: a new engine, a second
scoring system, a second owner of any nutrition fact, or an invented nutritional
target.

This document also records that HNP1 was **interrupted mid-change** and recovered.
Section 1 is the honest account of what was found, because the state it was found in
is the most useful thing this document can teach.

---

## 1. THE HONEST BASELINE — WHAT WAS ACTUALLY THERE

The work was interrupted **part-way through a single edit**, and the tree did not
compile. The reasoning was essentially complete; the wiring was not.

### 1.1 What was already built and correct

| File | State |
|---|---|
| `shared/nutrition/household-nutrition.ts` | **Complete.** The pure reasoning core — score, dimensions, bands, weekly summary, insights, opportunities. Zero I/O, no clock, no randomness. |
| `server/lib/household-nutrition-assembler.ts` | **Complete.** The thin I/O orchestrator. Reads existing owners, hands plain facts to the core, returns what the core composed. |
| `server/lib/food-intelligence-assembler.ts` | **Partially edited — broken.** See below. |

### 1.2 The break

The interrupted edit was **upgrading planning-consistency from an approximation to an
exact count**, and stopped half-way:

- it added `dayId: plannerDays.id` to the canonical planner query's projection ✅
- it declared `dayIds: Set<number>` on the `PlannerWeekFacts` interface ✅
- it **never initialised or populated `dayIds`** ❌

That single omission produced 6 TypeScript errors (one real, five cascading) and left
`countDaysWithMeals` still computing the old proxy — `Math.min(week.mealIds.size, 7)`
— under a long comment explaining that the day id "is not projected, because no
existing consumer needed it". By then it *was* projected. **The comment had become a
lie, and the code had become a type error.**

### 1.3 What was missing entirely

Nothing consumed the platform. `assembleHouseholdNutrition` had **zero callers**:
no API route, no client component, no test file — despite both module headers
instructing the reader to *"Run tests: npx tsx server/tests/test-household-nutrition.ts"*,
a file that did not exist.

`WEEKLY_PLANT_TARGET` was declared as the single owner in the shared core, whose header
states HNP1 *"makes this the single owner and converts those copies into imports"* —
but the three client copies were still hand-declared. The conversion had not happened.

---

## 2. THE DESIGN (UNCHANGED — IT WAS ALREADY RIGHT)

HNP1 introduces **no engine**. It is a **Selection** layer, which
`THA_DECISION_ENGINE_ARCHITECTURE.md` D5 explicitly withholds from the Decision Engine
and leaves with the domain owner. A household nutrition score is Selection, so it lives
in the Nutrition domain and nowhere else.

**Pure core + thin orchestrator**, the same split FI4's opportunity engine and NTC-P2's
notice gateway already use. Every rule, weight, threshold and sentence is in the core;
every read is in the assembler; neither borrows the other's job.

### 2.1 Every number traces to an existing owner

| Dimension | Owner | HNP1's role |
|---|---|---|
| Plant diversity | `shared/canonical/plant-classifier` (M4) | Counts nothing. Asks the classifier. |
| Nutrition balance | The **same** classifier's `VarietyScore` — its own five components, its own per-meal caps | Scored against the classifier's own denominator, not an invented food pyramid. |
| Processing quality | `user_health_trends.averageThaRating` (the UPF/Apple Rating owner) | Read, never recomputed. Mapped `(r−1)/4` so THA's own 1–5 scale stays intact. |
| Planning consistency | The planner (SoT D14) | Exact distinct-day count. |
| All-time diversity | `assembleNutritionCentre` (WX8) | **Read.** Plant diversity is a contested domain; a second all-time count here would be a second owner. |

### 2.2 The trust rules, enforced structurally

1. **A dimension with no data scores NOTHING — it does not score zero.** `null` and `0`
   are different claims. A household that has never scanned a product has no
   processing-quality evidence; "0/100" would be an accusation THA cannot support.
2. **No data at all → NO SCORE.** `value: null`, and the surface renders nothing. The
   platform never pads a score to make a dashboard look complete.
3. **The score declares what it was computed FROM** — `dimensionsCounted` of
   `dimensionsTotal`, plus a derived `confidence`. A 1-of-4 score and a 4-of-4 score are
   different claims and are never presented as the same one.
4. **Rule E1 — no citation, no card.** Every dimension, insight and opportunity carries
   `EvidenceCitation[]`.
5. **ATTN1 A2 — never `critical`.** A quiet week is not a harm signal.
6. **No invented target.** The only target is `WEEKLY_PLANT_TARGET` (30), which this
   product already shipped in four places. No RDA, no reference intake — THA stores
   none, and inventing one would fabricate certainty.

Weights are renormalised across **only** the dimensions that have data, so an absent
owner never silently drags a household's score toward zero.

---

## 3. CHANGES MADE

### New files (3)

| File | Purpose |
|---|---|
| `server/tests/test-household-nutrition.ts` | 63 assertions. The suite both module headers already promised. |
| `client/src/components/HouseholdNutritionPanel.tsx` | The dashboard surface. Owns no intelligence and writes no prose. |
| `docs/implementation/nutrition/HNP1_HOUSEHOLD_NUTRITION_PLATFORM_FOUNDATION.md` | This document. |

### Modified files (7)

| File | Change |
|---|---|
| `server/lib/food-intelligence-assembler.ts` | **Completed the interrupted edit** — initialise and populate `dayIds`. Fixes the build. |
| `server/lib/household-nutrition-assembler.ts` | `countDaysWithMeals` now counts distinct planner days **exactly**; the stale "honest limitation" comment (which had become false) replaced. |
| `shared/nutrition/household-nutrition.ts` | Grammar: `joinAnd` / `joinOr` / `capitalise` / `plural`. See §4.2. |
| `server/routes.ts` | `GET /api/household-nutrition` (authenticated, read-only). |
| `client/src/pages/plant-diversity-page.tsx` | Mounts the panel above the all-time Nutrition Centre. |
| `client/src/components/PlantDiversityReport.tsx`<br>`client/src/components/nutrition-variety-chips.tsx`<br>`client/src/pages/home-experience-page.tsx` | Local `const WEEKLY_PLANT_TARGET = 30` **deleted**; imported from the single owner. |
| `package.json` | Registered `test:hnp1-household-nutrition` in the `npm test` chain. |

`WEEKLY_PLANT_TARGET` is now declared in **exactly one place** in the repository, and a
test asserts it stays that way.

---

## 4. WHAT VERIFICATION ACTUALLY FOUND

Typecheck, tests and build all passing proved the code *ran*. Driving it against the
**real database** proved it was *right* — and found two things nothing else did.

### 4.1 The day-count fix changes real households' scores (8% of all planner weeks)

Across **128 households / 167 planner weeks**, the exact count differs from the
interrupted proxy in **14 weeks (8%)**:

```
household 51 week 1: exact 7/7 days vs proxy 3/7  (100% vs 43% consistency)
household 51 week 2: exact 5/7 days vs proxy 2/7  ( 71% vs 29% consistency)
household 51 week 3: exact 1/7 days vs proxy 2/7  ( 14% vs 29% consistency)
household 60 week 2: exact 1/7 days vs proxy 3/7  ( 14% vs 43% consistency)
```

A household that had planned **every single day of the week** would have been told it
planned **three days**, and scored 43% on consistency.

Note household 51 week 3 and household 60 week 2: the proxy **over**-reported. The
interrupted code's own comment claimed it *"UNDER-reports rather than over-reports,
which is the correct direction for a figure a household is scored on"*. **That was
false in both directions** — two meals on one day inflates it. The justification was
as broken as the code, which is exactly why the comment was replaced rather than kept.

### 4.2 The generated prose was not shippable

Unit tests on a pure core check numbers. They do not read the sentence. Running against
real households did:

```
✗  "Your household has 1 distinct plants planned this week"
✗  "Fruit and Whole grains and Herbs & spices are not in the plan yet."
✗  "Add fruit or whole grains or herbs & spices to a meal this week"
```

Every figure in those sentences was correct. A household does not read the figure — it
reads the sentence, and that sentence undermines every correct number near it. This
module is the **only** author of prose about a household's own nutrition (the client
renders it verbatim), so the grammar is part of its contract:

```
✓  "Your household has 1 distinct plant planned this week"
✓  "Fruit, whole grains and herbs & spices are not in the plan yet."
✓  "Add fruit, whole grains or herbs & spices to a meal this week"
```

Six assertions now lock this down: Oxford-free list joining, pluralisation at the n=1
boundary, sentence capitalisation, and no double-space/space-before-stop artefacts.

### 4.3 Behaviour against real households

```
household 261 / user 266 — 28 planner entries
  score: 28 · building · computed from 3/4 · high confidence
      3   Plant diversity      (1 of 30)
     20   Nutrition balance    (1 of 5)
      —   Processing quality   (0 of 5)   ← NOT SCORED (null, not zero)
    100   Planning consistency (7 of 7)
  trust.sources: planner, plant-classifier, nutrition-centre
  trust.unscoredDimensions: processing-quality
```

This is the platform's central claim working end-to-end: the household has **never
scanned a product**, so processing quality is `null` — not `0` — it is **excluded** from
the score rather than counted against them, the score **says** it rests on 3 of 4
measures, and the surface **names** the dimension it could not measure.

---

## 5. VALIDATION

| Gate | Result |
|---|---|
| `npm run typecheck:ci` | **PASS** — baseline 168, current 168. No new type errors. (Before: 6 errors.) |
| `npm run test:hnp1-household-nutrition` | **PASS** — 63 passed, 0 failed |
| `npm test` (full chain) | **PASS** — no regressions |
| `npm run build` | **PASS** |
| Real-data drive | 3 households end-to-end; 128 households scanned for data impact |
| `GET /api/household-nutrition` | **401** unauthenticated (registered + guarded) |
| Data impact | **Read-only.** No INSERT/UPDATE/DELETE, no schema change, no migration. |

---

## 6. ARCHITECTURE COMPLIANCE

- **No new engine.** Selection sits with the domain owner (Decision Engine D5).
- **No second scoring system.** The Apple Rating is read, never recomputed; the
  Nutrition Centre's all-time diversity is read, never re-derived.
- **One owner per fact.** `WEEKLY_PLANT_TARGET` went from four declarations to one.
- **Rule E1** — every dimension, insight and opportunity cites its owner.
- **ATTN1 A2** — nothing here is ever `critical`; asserted against the real
  `assertCriticalAllowed`.
- **Progressive enrichment** — every owner is read independently and best-effort; one
  missing owner never blocks the others and never yields a fabricated stand-in.
- **The client writes no prose about household data** — every sentence is composed
  server-side and rendered verbatim.

---

## 7. REMAINING GAPS

### G1 — Nutrition opportunities do not enter the OD1 delivery framework

`HouseholdNutritionOpportunity` is shaped **identically** to FI4's `FoodOpportunity`,
and `adaptFoodIntelligence` is structural (it validates plain strings, not the
`FoodOpportunityType` union) — so the shapes genuinely match and would pass today.

They are nonetheless delivered **only** through `/api/household-nutrition` → the
dashboard panel. They do **not** yet flow through `collectOpportunities`, so they do not
inherit prioritisation, muting, de-duplication, the attention budget, the delivery
lifecycle, or the Evidence→Learning loop.

This was **deliberately not done**: OD1 is **pull-based**, and joining it requires
registering a new capability (`OPPORTUNITY_SOURCES` + a registry entry + a binding +
a handler) and adding `nutrition` to `DOMAIN_SURFACE` (it currently falls through to
`"floating"`). That is a new registered capability, which is outside the approved HNP1
scope and warrants its own change. **It is the single largest gap and the obvious HNP2.**

### G2 — No `subject` on nutrition opportunities

`FoodOpportunity` carries a `subject` (PHASE5E) for the "Why this?" affordance.
`HouseholdNutritionOpportunity` does not. Harmless today (the panel does not use it);
becomes real the moment G1 lands, where `opportunity-delivery:explain` would return
`subject: undefined` and `FoodOpportunityCard` would degrade rather than explain.

### G3 — Plant diversity still has multiple derivations

`PlantDiversityReport` and `nutrition-variety-chips` count plants **client-side**;
`WeeklyNutritionSummary.plantCount` counts them **server-side** from canonical planner
slugs. HNP1 unified the **target**, not the **count** — so the two can never disagree
about what "a week" is, but may still disagree about the number. This is the contested
domain NTC-P2 (G3) already named; HNP1 deliberately did not open it.

### G4 — The authenticated UI render was not driven end-to-end

The endpoint is verified registered and auth-guarded (401), and the assembler was driven
against three real households. The **rendered panel** was verified only by typecheck and
build: this environment has no test credentials, and manufacturing a session by resetting
a real user's password was not an acceptable way to obtain one. A brief authenticated
click-through of the Nutrition tab is the honest remaining check.

### G5 — `daysWithMeals` is capped at 7

`countDaysWithMeals` clamps to `PLANNER_WEEK_DAYS`. If a planner week ever carries more
than seven day rows, the excess is silently dropped rather than surfaced. No such week
exists in the data today (verified across 167 weeks), so this is a latent assumption,
not a live defect.
