
# Session: AFI2_Planner_Ambient_Intelligence

| Field | Value |
|---|---|
| **Session ID** | `AFI2_Planner_Ambient_Intelligence` |
| **Rollback ID** | `rollback/AFI2-planner-ambient-intelligence-20260718` |
| **Start time** | 2026-07-18T00:00:00Z UTC |
| **Current stage** | Complete — awaiting owner review (implementation + verification + 3 screenshots + doc all done) |

## Rollback
| Item | Value |
|---|---|
| Tag | `rollback/AFI2-planner-ambient-intelligence-20260718` → `7bfad50c` |
| Working tree at start | **Dirty — NOT MINE.** 217 pre-existing sibling-session / FI20 / AFI1 uncommitted entries. Tag protects committed state (`7bfad50c`) only. Do NOT commit sibling work. Scope AFI2 to its own additive files. Hazard: a concurrent sibling process has clobbered untracked docs before (see AFI1) — back up new docs/screenshots to scratchpad. |

## Objective
Extend Ambient Food Intelligence INTO THE PLANNER. Reuse the EXISTING
Observation → Insight → Recommendation pipeline (FI4 opportunity engine / OD1
delivery / DEC1 decision / PHASE5C ambient surface). Do NOT create a second
recommendation engine. Do NOT add new nutrition knowledge. Surface calm,
household-specific observations WHILE PLANNING — opportunities such as plant
diversity, nutritional balance, ingredient reuse, leftovers, seasonal, household
suitability. Only genuinely-useful observations. Prefer ONE excellent
recommendation over many average. Every recommendation answers "How does this
improve THIS WEEK'S plan?" Evidence-aware, household-specific, actionable, calm.

## DESIGN — pivot recorded (see "DESIGN DISCOVERY" below)
**Final: new ambient type `planner-batch-cook`** (owningDomain `planner`, priority `low`,
subject entity `planner-meal`). ONE per week (prefer one excellent). See discovery note.

### DESIGN DISCOVERY (why the first design was abandoned)
The first locked design re-voiced the EXISTING household-nutrition core's plant-diversity/
balance observations via `assembleHouseholdNutrition`. **Runtime probe proved that whole
subsystem is BROKEN at the committed HEAD (7bfad50c):** `household-nutrition-assembler.ts`
reads `planner.byWeek` / `PlannerWeekFacts`, but `fetchHouseholdPlannerFoods` never returns
them (neither file is dirty — the breakage is baseline; its `/api/household-nutrition` route
isn't even live and the panel is self-described as orphaned). Building on dead code = a card
that can never surface. Plant diversity is also a CONTESTED domain — the codebase explicitly
forbids a second computation of it, so I must NOT re-derive it in the ambient engine. Both
roads are closed without fixing a sibling subsystem (out of scope, dirty-tree hazard). Logged
as follow-on #1.

**Pivot to `planner-batch-cook`** — squarely in the brief's list ("ingredient reuse",
"leftovers"), reuses ONLY working reads, touches no contested domain:
- **Observation:** the SAME meal planned on ≥2 distinct days of the household's CURRENT week
  (reuses the `plannedMeals` the AFI1 path ALREADY resolves — entryId, dayOfWeek, mealId,
  mealName — so ZERO new read).
- **Insight:** a meal on multiple days = cook one batch, cover them all.
- **Recommendation:** ONE — the meal repeated on the MOST days (ties → earliest day, stable);
  "You've planned "[Meal]" on N days this week (…) — cook one batch and it covers them all."
- **Reuses (no new knowledge):** the planner read + `resolveHouseholdPlannerWeek` +
  `resolveHouseholdSignal`, all already in `identifyOpportunities`. No nutrition knowledge,
  no contested plant domain, no dependency on the broken assembler.
- Verified feasible on the seeded demo household (Overnight Oats → 3 days).

**Reconnaissance result:** the plant-diversity + nutritional-balance observations the
brief names ALREADY EXIST as a pure, cited, calm, food-not-bodies core —
`shared/nutrition/household-nutrition.ts` `buildOpportunities(facts, score)` emits
`nutrition-plant-diversity-gap` ("N plants planned this week, R short of a diverse 30")
and `nutrition-balance-gap` ("covers X of Y food components; [missing] missing"),
keyed to THIS week (`facts.weekNumber`), assembled by `assembleHouseholdNutrition`.
They are NOT registered in the ambient OD1 pipeline (only `food-intelligence` is).

**AFI2 = the bridge, not a second engine.** A new pure generator re-voices the SINGLE
most useful current-week nutrition observation as ONE planner-domain ambient
`FoodOpportunity`, authoring NO nutrition sentence, threshold, or fact:
- **Observation:** the current anchored planner week (`resolveHouseholdPlannerWeek`).
- **Insight:** the EXISTING `assembleHouseholdNutrition(userId, householdId, weekNumber)`
  → its already-computed `.opportunities` for this week (plant diversity / balance).
- **Recommendation:** drop `nutrition-planning-gap` (already surfaced by
  `planner-empty-day` — no duplication), pick the highest-attention remaining
  (plant-diversity `medium` > balance `low`; tie → core order), emit exactly ONE
  `FoodOpportunity` reusing the core's `explanation`/`suggestedAction`/`evidence`/
  `priority` VERBATIM (Rule E1 satisfied by reuse). subject = `planner-week` (week.id).
- **Reuses (no new knowledge):** the household-nutrition pure core (plant target 30,
  variety model, balance — all owned there), plant-classifier (M4), `assembleHouseholdNutrition`,
  `resolveHouseholdPlannerWeek`, `resolveHouseholdSignal` (householdId). Framework/
  delivery/card/companion are generic on `type` — new type flows through with ZERO
  framework change.

**Surfacing:** the planner's existing `AmbientIntelligence domains={["planner"]}` mount
(weekly-planner-page.tsx) picks it up automatically — ZERO client change. Home/Dashboard
aggregate + Companion Notice Engine voice it automatically too.

**Not a second face of the Nutrition Panel:** the panel is a full report a household
visits; AFI2 brings the ONE most useful planner-relevant nutrition observation INTO the
planner flow, calm and timely (the AFI1 precedent — food page showed uplift statically,
AFI1 made it ambient/timely in the planner). Connection, not duplication.

## Checkpoints
- [x] Rollback tag created + resolved (`7bfad50c`); session registered in CURRENT.md
- [x] Server pipeline mapped (Explore) — producers, type union, DEC1, API, planner data, evidence, tests
- [x] Design PIVOTED — `planner-batch-cook`: "cook once, cover the week" for a meal planned on ≥2 days (brief's ingredient-reuse/leftovers). First design (`planner-week-nutrition`) abandoned — see DESIGN DISCOVERY: `assembleHouseholdNutrition` broken at HEAD + plant diversity is a contested domain.
- [x] Server: `identifyPlannerBatchCookOpportunities` generator + `planner-batch-cook` type + `mealId` on `PlannedMealRef` + `joinDays` helper + orchestration (reuses AFI1's `plannedMeals`, no new read)
- [x] Tests extended (food-opportunity-binding) → 64 passed, 0 failed (was 51; +13 AFI2). Downstream clear: OD1 60/60, DEC1 49/49, ATTN1 29/29, notice-engine 65/65
- [x] Typecheck: opportunity-engine.ts clean (0 errors); only pre-existing COMP1 `assembleFoodComparison` stub in test §2 fixture (documented AFI1 §6.2)
- [x] Verified in running app — API end-to-end (demo 201 → food-opportunities returns cited `planner-batch-cook`: "Overnight Oats with Berries" on 3 days (Tue/Wed/Fri) → cook one batch; evidence planner-week; in the planner group)
- [x] Screenshots (3): planner-batchcook-card (focused, clear), planner-ambient-batchcook (full surface), home-ambient-aggregate (beside the AFI1 uplift). docs/implementation/assets/afi2/
- [x] AFI2 doc + report — docs/implementation/AFI2_PLANNER_AMBIENT_INTELLIGENCE.md
- [x] Deliverables backed up to scratchpad (clobber hazard); temp probe script removed

**Last checkpoint (COMPLETE 2026-07-18):** AFI2 delivered. New `planner-batch-cook`
ambient recommendation through the EXISTING FI4/OD1/DEC1/PHASE5C pipeline (no new
pipeline, no second engine, no new knowledge, no contested-domain computation, no client
change). Verified end-to-end (API cited output, 64/64 unit + 203 downstream assertions
green, typecheck-clean, 3 screenshots). Doc: `docs/implementation/AFI2_PLANNER_AMBIENT_INTELLIGENCE.md`.

**Implementation notes:** (1) selection/ordering MUST go through `orderByAttention`
(canonical mechanics) — direct `ATTENTION_RANK` indexing trips the DEC1 "no local
attention sort" guard; (2) project target flags raw `Map`/`Set` for-of/spread — use
`Array.from(...)` (codebase convention). Both fixed.

## Resume verification (2026-07-18, later session)
Session resumed; **no work re-done** — AFI2 was already Complete. Verified the recorded
deliverables still exist and still pass at the current tree:
- Rollback tag present and correct: `rollback/AFI2-planner-ambient-intelligence-20260718`
  (annotated) → `7bfad50c`; HEAD still `7bfad50c` — committed state protected, nothing drifted.
- Source intact: `planner-batch-cook` union member, `identifyPlannerBatchCookOpportunities`
  (opportunity-engine.ts:491), stable id `planner-batch-cook:${week.id}:${mealId}`, orchestrator
  push (:652) all present. `opportunity-engine.ts` still dirty-uncommitted (expected — layered
  on AFI1's uncommitted edits).
- Tests **re-run green: 64 passed, 0 failed** (unchanged from the recorded result). The trailing
  `platform_observations_user_id_fkey` log line is pre-existing test-harness noise, not a failure.
- Doc intact (17,841 bytes, §1–§9) and 3 screenshots valid PNGs + manifest.
- **Clobber hazard re-mitigated:** the scratchpad recorded in the earlier checkpoint belonged to
  a previous session dir and is gone. Deliverables (doc + assets + this run file) re-backed up to
  the current session scratchpad: `.../0cf0c9f7-.../scratchpad/afi2-deliverables/`. Note for any
  future resume: scratchpad backups do NOT survive across sessions — the durable fix is commit.

## Next action
None — deliverables complete. Owner to review the doc and decide commit (recommended
soon, given the shared-dirty-tree clobber hazard; AFI2 builds on AFI1's uncommitted
opportunity-engine.ts) + the 5 follow-ons (esp. #1 repair the broken nutrition subsystem,
then re-voice plant diversity/balance through this same seam).

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
