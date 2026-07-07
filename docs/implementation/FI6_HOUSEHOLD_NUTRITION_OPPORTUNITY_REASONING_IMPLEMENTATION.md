# FI6 — Household Nutrition Opportunity Reasoning — Implementation

**Date:** 2026-07-06
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Additive extension of an already-registered, already-tested Domain Intelligence service (`identifyOpportunities`, FI4). No new capability, no new store, no schema change, no new route, no new identity system. Blast radius is scoped to two new pure generator functions inside `opportunity-engine.ts` plus one additive orchestrator call — every existing generator, capability, and test is unchanged.

**Note on numbering:** `FI1`–`FI5` are each already reused across multiple, differently-titled documents in this repo (e.g. two separate `FI4` docs, two separate `FI5` docs). This document is disambiguated by title, not number, consistent with existing practice.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Working tree already dirty with substantial prior uncommitted work on this branch (INTQ4–INTQ10, EL1, EWO1/EWO2, EWX1, CP1/CP1A/CP1B, FI1–FI5, PKC1–5, PLATFORM_RESILIENCE, etc. — pre-existing, unrelated to this task, not staged or reverted by this task) |
| HEAD at start | `d63d7cd1b9c4a917d36880eb4399ae35e03d781c` |
| Rollback tag | `rollback/before-FI6-household-nutrition-opportunity-reasoning-20260706` → `d63d7cd1b9c4a917d36880eb4399ae35e03d781c` |
| This task's writes | `server/intelligence/food-intelligence/opportunity-engine.ts` (two new generators, one new composer, one new orchestrator call — additive), `server/tests/test-intelligence-food-opportunity-binding.ts` (new test coverage, additive), `docs/implementation/FI6_HOUSEHOLD_NUTRITION_OPPORTUNITY_REASONING_IMPLEMENTATION.md` (this file) |
| Rollback to committed state | `git checkout rollback/before-FI6-household-nutrition-opportunity-reasoning-20260706 -- server/intelligence/food-intelligence/opportunity-engine.ts server/tests/test-intelligence-food-opportunity-binding.ts` (each file is independently revertible — nothing outside this task's own files reads its new exports) |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (rollback protocol, mandatory sections, compliance checklists)
- [x] `server/intelligence/food-intelligence/opportunity-engine.ts` (FI4 — the exact service this task extends; every existing generator, the orchestrator, and the IA3 re-weighting logic read in full before adding anything)
- [x] `server/intelligence/food-intelligence/engine.ts` (FI3 — `resolveHouseholdSignal`, `HouseholdSignal`, confirms the household-resolution seam this task reuses rather than re-deriving)
- [x] `server/lib/food-intelligence-assembler.ts` (WX4 — `fetchHouseholdPlannerFoods`, the exact existing read this task's two new generators compose over; confirmed it is already a multi-consumer, canonical read — "the Nutrition Centre reuses this; it does not re-derive any of these figures elsewhere")
- [x] `server/intelligence/handlers/planner-read-port.ts` (INT2 — confirmed the narrow read port intentionally exposes only `{id, name}` for a meal, never ingredients — this is why `fetchHouseholdPlannerFoods` is the correct reuse seam for food-level reasoning, not a second query through this port)
- [x] `shared/canonical/resolver.ts`, `shared/canonical/foods.ts`, `shared/canonical/diversity-groups.ts` (WS2A/WS0.8 — confirmed `diversityGroupSlug` is the ONE existing cross-food "variety" identity in this codebase — the same grouping the "30 plants a week" concept already counts by — and that `CANONICAL_SEED.find((e) => e.food.slug === slug)` is the existing, already-used slug lookup pattern, e.g. `shared/canonical/food-report-adapter.ts`'s `buildFoodReport`)
- [x] `server/routes.ts` `/api/home/intelligence` and `/api/planner/weeks/:weekId/intelligence` (confirmed these hold a DIFFERENT, older, duplicated-in-two-places "plant count" mechanism — `isPlantIngredient`/`singularizeIngredientKey` — deliberately NOT reused here; see Decision 2)
- [x] `docs/implementation/FI5_HOUSEHOLD_NUTRITION_INTELLIGENCE_IMPLEMENTATION.md` (confirmed FI5's own Scope Lock explicitly named "current-week-only variety" as future work — this task is that future work, using the canonical WS2A mechanism FI5 itself did not touch)
- [x] `server/tests/test-intelligence-food-opportunity-binding.ts` (FI4's own test suite — read in full to match its exact fixture and assertion style before extending it)

---

## MISSION

Enable the Companion to reason about household food opportunities using **existing** Food Intelligence, Household Intelligence and Planner Intelligence — no new food knowledge, no new schema, no new capability, no duplicated business logic.

**Scope for this document (user-approved, smaller-scope decision):** implement exactly two of the five illustrative opportunity types named in the original brief:

1. **`weekly-variety-gap`** — increasing weekly variety / reducing repetition (the brief's two most closely related examples, both answered by one diversity-group-share computation).
2. **`household-new-food`** — introducing foods new to the household.

**Explicitly deferred, not implemented here:** `similar-role-better-choice` (complementing foods already planned / suggesting a better choice between two foods that fulfil a similar role) — deferred by explicit user instruction, to be scoped as a separate future decision.

---

## DECISIONS (why this shape, not another)

1. **Reuse `fetchHouseholdPlannerFoods`, don't add a new read path.** `server/lib/food-intelligence-assembler.ts`'s `fetchHouseholdPlannerFoods(householdId)` already joins `planner_entries`/`planner_days`/`planner_weeks`/`meals`, resolves every ingredient to a canonical slug via `resolveCanonicalFood`, and accumulates `{appearances, firstWeek, lastWeek, mealCounts}` per slug. It is already a shared, multi-consumer read (FI3's `engine.ts` via `resolveHouseholdSignal`, the Food Report page). A third and fourth consumer (this task's two generators) is evolution, not duplication (Architecture Principle 8) — no new join, no new ingredient-resolution logic.

2. **Use the WS2A canonical `diversityGroupSlug`, not the `routes.ts` inline plant-count mechanism.** Two "plant variety" mechanisms exist in this codebase: (a) `shared/canonical/foods.ts`'s `diversityGroupSlug` + `shared/canonical/diversity-groups.ts` (WS2A/WS0.8 — the editorial, canonical "30 plants a week" grouping, e.g. all citrus fruit share one `citrus` group), and (b) an inline, already-duplicated-in-two-places computation in `server/routes.ts` (`/api/home/intelligence` and `/api/planner/weeks/:weekId/intelligence`) using `isPlantIngredient`/`singularizeIngredientKey`. This task uses (a) exclusively: it is the single-owner, already-shared identity every Food Intelligence engine already resolves through (`resolveCanonicalFood`), whereas (b) is a pre-existing, separate duplication this task must not add a THIRD copy of or reuse into a Domain Intelligence engine (routes.ts is a presentation-layer consumer, not an owning service). FI5's own Scope Lock flagged this exact tension and named (b) as "not an extracted reusable service" — this task resolves it by using (a) instead, not by extracting (b).

3. **"This week" is derived from `firstWeek`/`lastWeek`, not a second entries fetch.** `fetchHouseholdPlannerFoods`'s per-slug `lastWeek` is, by construction, the maximum week number any entry containing that food appeared in. Since `identifyOpportunities` already defines "current week" as the household's own highest `weekNumber` (the same convention `identifyPlannerGapOpportunities`, FI4, already established), a food's `lastWeek` equals the current week's number **if and only if** it was planned at least once in that week — there is no later week for `lastWeek` to instead point to. Symmetrically, `firstWeek === currentWeek.weekNumber` means every appearance of that food is within the current week, i.e. it is genuinely new. This lets both generators reuse `fetchHouseholdPlannerFoods`'s existing per-slug aggregation with zero new queries, rather than a second join from `planner_entries.mealId` through `meals.ingredients` (which the narrow, intentionally-`{id,name}`-only `planner-read-port.ts` does not expose, and duplicating the assembler's own join to get it would violate Rule "no duplicate workflows").

4. **`weekly-variety-gap` reasons over distinct foods, not per-entry occurrences.** The available data (`fetchHouseholdPlannerFoods`) tells us WHICH distinct canonical foods appear in the current week, not how many separate entries each one appears in that week specifically (that count is household-wide, not week-scoped). Rather than fabricate an occurrence count the read does not honestly provide, this task reasons at the level the data actually supports: "N of the M distinct plant-based foods planned this week come from the same diversity group" — a real, honestly-grounded signal, not a guessed one.

5. **Injectable-free, fully pure generators — same testability discipline as FI4.** Both `identifyWeeklyVarietyGapOpportunities` and `identifyHouseholdNewFoodOpportunities` are pure functions over an already-composed `HouseholdPlannedFood[]` (no I/O, no clock reads), exactly mirroring `identifyPlannerGapOpportunities`/`identifyPantryUnusedOpportunities`. The composition step (`buildHouseholdPlannedFoods`) is also pure and separately exported/tested, so the WS2A identity lookup (`CANONICAL_SEED.find`) has its own honest-gap test (an unresolvable slug is silently excluded, never fabricated).

6. **No new capability, no new verb, no new conversational routing.** Both generators run inside the SAME `report` verb on the SAME `food-intelligence` capability FI4 already registered and bound. `identifyOpportunities`'s orchestrator already fetches the current week's planner data for `identifyPlannerGapOpportunities`; this task adds one more read (`fetchHouseholdPlannerFoods`) inside the same try-block and two more generator calls. The Companion's existing conversational path to this verb (`intelligencePlatform.handle({verb: "report", capabilityId: "food-intelligence"}, context)`, called from the same place FI4's own opportunities are surfaced) picks up the two new opportunity types automatically — no `pattern-intent-resolver.ts` change, no `MAX_INTENTS` budget impact, no new baseline capability.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No new entity. Every fact keys on identities that already exist: canonical
  food slug (WS2A CANONICAL_SEED, via resolveCanonicalFood — already the
  identity fetchHouseholdPlannerFoods resolves ingredients to), diversity
  group slug (WS2A DIVERSITY_GROUP_SEED), planner week id/number (SoT D14).

☑ One owner per fact
  Planner history stays owned by planner_entries/planner_days/planner_weeks,
  read exclusively via the existing fetchHouseholdPlannerFoods (never a
  second query). Canonical food identity and diversity group stay owned by
  shared/canonical/foods.ts's CANONICAL_SEED (never re-authored — this task
  only reads it, via the same CANONICAL_SEED.find pattern
  food-report-adapter.ts's buildFoodReport already uses).

☑ No duplicate entities
  No new entity introduced. HouseholdPlannedFood is a transient, in-memory
  composition type (not persisted, not a store) joining two already-owned
  facts for the duration of one request — the same role FI3's HouseholdSignal
  and WX4's PlannerFoodAcc already play.

☑ No duplicate ownership
  No attribute is given a second owner. This task computes nothing that
  isn't already derivable from fetchHouseholdPlannerFoods + CANONICAL_SEED.

☑ No duplicate state
  No new state is stored anywhere. Both generators are pure, per-request
  computations; nothing is persisted or cached beyond the request.

☑ Extends existing architecture
  Extends the exact generator pattern opportunity-engine.ts (FI4) already
  established: a pure `identify*Opportunities` function per Business Domain
  read, called from the same orchestrator, contributing to the same closed
  FoodOpportunityType union (Rule 8 — evolution, not replacement).

☑ Progressive enrichment where appropriate
  Every signal is independently optional: a household with fewer than 2
  classified (plant) foods this week yields no weekly-variety-gap opportunity;
  a household where nothing was first-planned this week yields no
  household-new-food opportunity. Both degrade silently to [] — never a
  fabricated pattern from insufficient data.

☑ Honest gaps over fabricated information
  A canonical slug that (should never, but) fails to resolve in
  CANONICAL_SEED is silently excluded from buildHouseholdPlannedFoods, never
  given an invented name or diversity group. A non-plant food (diversityGroupSlug
  null) is never forced into a fabricated group.

☑ No permanent synchronisation bridge
  Read-only, per-request, no caching, no bridge.

☑ Evolution over replacement
  Nothing is replaced. fetchHouseholdPlannerFoods, resolveCanonicalFood,
  CANONICAL_SEED, and DIVERSITY_GROUP_SEED are all reused verbatim,
  unmodified. The pre-existing routes.ts plant-count duplication (Decision 2)
  is neither touched nor extended — named, not worked around.
```

---

## AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform — the two new generators run inside
  the same identifyOpportunities() orchestration the food-intelligence
  capability's `report` verb already calls; no side channel.
✓ Uses the Capability Registry — no new capability, no new verb; food-intelligence
  remains registered exactly as FI3/FI4 left it (recommend/explain/report).
✓ Uses the Intent Engine — reached through the same intent (`report` on
  `food-intelligence`) the resolver/binding already route to; no new intent
  taxonomy entry.
✓ Reuses existing business services — fetchHouseholdPlannerFoods,
  resolveCanonicalFood (transitively, via fetchHouseholdPlannerFoods),
  CANONICAL_SEED, DIVERSITY_GROUP_SEED, all unmodified.
✓ Does not create another assistant — pure, deterministic composition
  functions, no LLM call, no new conversational surface.
✓ Does not duplicate conversation state — nothing persisted.
✓ Uses registered capabilities only — food-intelligence, already registered
  and already executable.
✓ Uses permission-aware access — reuses identifyOpportunities's own existing
  discipline: resolveHouseholdSignal resolves ONLY the caller's own household
  from their own userId; this task adds no new id parameter anywhere.
✓ Produces honest gaps rather than fabricated knowledge — see checklist above.
```

---

## PLATFORM QUALITY COMPLIANCE

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

☑ Security — no new route, no new permission surface. Reuses
  identifyOpportunities's existing authorization: household.householdId is
  only ever the caller's own resolved household (resolveHouseholdSignal),
  never client-suppliable.
☑ Privacy — reads only the caller's own household's planner history, via the
  same fetchHouseholdPlannerFoods(householdId) call already scoped to that
  household; no cross-household read is possible by construction.
☑ Performance — known, bounded cost profile: one additional
  fetchHouseholdPlannerFoods call per request (already a single indexed join
  over the household's own planner rows — the same query FI3's engine already
  performs once per request for a different consumer), plus an O(household's
  distinct foods × CANONICAL_SEED length) linear scan in
  buildHouseholdPlannedFoods, bounded by one household's own data, not
  unbounded/growing platform-wide data. Isolated in its own try/catch so a
  failure here never blocks the planner-gap opportunities already computed
  in the same request.
☑ Observability — failures are caught and degrade honestly (empty result),
  consistent with every other domain read in this file; no swallowed
  exception behaves differently from the existing pattern, no bespoke log line.
☑ Accessibility — output is the same FoodOpportunity shape (id, type,
  owningDomain, priority, explanation, evidence, suggestedAction) every other
  opportunity already uses; renders through the platform's existing
  opportunity structural contract, no ad hoc shape.
☑ Trust — every claim traces to a real read: diversity-group membership
  traces to WS2A CANONICAL_SEED, "first appearance" traces to
  fetchHouseholdPlannerFoods's own firstWeek/lastWeek accumulation. Gaps
  render as an empty array, never invented content.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Intelligence (Domain Intelligence layer) composing over
  Planner (SoT D14) and WS2A canonical food identity (shared/canonical/foods.ts,
  shared/canonical/diversity-groups.ts)
Declared SoT: planner_entries/planner_days/planner_weeks (D14) — unchanged,
  still owned by the Planner business domain; CANONICAL_SEED / DIVERSITY_GROUP_SEED
  — unchanged, still owned by WS2A
New store created? NO
Existing store extended? NO
Consumer created? YES — two new generators inside the already-registered
  food-intelligence capability's `report` verb, reading through the SAME
  fetchHouseholdPlannerFoods() and CANONICAL_SEED FI3/FI4/WX4 already share
  reads from declared SoT? YES — fetchHouseholdPlannerFoods and
    CANONICAL_SEED.find, both unmodified by this task
```

---

## ARCHITECTURE CONVERGENCE STATUS

*(Provided though this is 🟡 AMBER, not 🔴 RED, because this task touches a domain with a named pre-existing duplicate — see Decision 2 — and convergence tracking makes that visible rather than silently ignored.)*

```
Domain:
  Food Intelligence (Domain Intelligence layer) composing over Planner (D14)
  and WS2A canonical food/diversity-group identity

Current Canonical Owner:
  planner_entries/planner_days/planner_weeks (D14, Planner-domain-owned),
  read exclusively through fetchHouseholdPlannerFoods
  (server/lib/food-intelligence-assembler.ts); CANONICAL_SEED /
  DIVERSITY_GROUP_SEED (WS2A, shared/canonical/), read exclusively through
  CANONICAL_SEED.find and DIVERSITY_GROUP_SEED's own display-name map — both
  unmodified by this task.

Current Runtime Consumer(s):
  Food Intelligence Engine (FI3, engine.ts), Food Opportunity Engine (FI4,
  opportunity-engine.ts's existing generators), Food Report (WX4,
  food-intelligence-assembler.ts's own getFoodIntelligence), Companion
  household-nutrition enrichment (FI5, household-nutrition-enrichment.ts),
  and now this task's two new generators — five consumers, two shared,
  unmodified read paths (fetchHouseholdPlannerFoods; CANONICAL_SEED).

Duplicate Owners Remaining:
  ONE, pre-existing and NOT introduced or touched by this task: the "plant
  variety" concept also exists, separately and already duplicated across TWO
  call sites, as inline isPlantIngredient/singularizeIngredientKey logic in
  server/routes.ts (/api/home/intelligence, /api/planner/weeks/:weekId/intelligence).
  This task deliberately does not reuse or extend that duplicate (Decision 2)
  — it uses the WS2A canonical diversityGroupSlug mechanism instead, which
  has exactly one owner (CANONICAL_SEED/DIVERSITY_GROUP_SEED).

Duplicate State Remaining:
  NONE introduced by this task.

Duplicate Workflows Remaining:
  NONE introduced by this task — no second ingredient-resolution workflow, no
  second planner-history join. The pre-existing routes.ts plant-count
  duplication (named above) is unrelated to this task's own workflow and
  untouched.

Current Convergence (%):
  100% for the specific facts this task reads (household planner food
  history, canonical diversity-group membership) — both already have exactly
  one owner and exactly one read path, now shared by a fifth/sixth consumer
  rather than re-derived again. The pre-existing routes.ts plant-count
  duplication named above is a SEPARATE, unrelated fact (an ad hoc
  presentation-layer plant count, not this task's diversity-group-share
  reasoning) and is excluded from this percentage — it was not moved by,
  and is not part of, this task's own domain slice.

Target Convergence (%):
  100% (unchanged by this task for the facts it reads).

Next Planned Milestone:
  N/A for this task's own domain slice. Converging the separate routes.ts
  plant-count duplication onto the WS2A diversityGroupSlug mechanism (FI5's
  own Suggestions section named the routes.ts extraction as future work) is
  named but explicitly out of scope here — see Scope Lock.

Remaining Architectural Risks:
  The routes.ts plant-count duplication named above remains a live,
  pre-existing risk (two call sites, one concept, ad hoc identity) —
  unchanged by this task, named for visibility, not silently worked around.
```

---

## IMPLEMENTATION

### Modified: `server/intelligence/food-intelligence/opportunity-engine.ts`

1. **`FoodOpportunityType` union extended** with `"weekly-variety-gap"` and `"household-new-food"` (Rule 8 — evolution, the same closed-union extension pattern FI4 itself used when it was added).

2. **New module-level lookup:** `DIVERSITY_GROUP_DISPLAY_NAME` — a `Map` built once from `DIVERSITY_GROUP_SEED` (WS2A), giving human-readable group names (e.g. "Citrus") for explanations. Read-only reuse of an existing exported constant, the same pattern `food-report-adapter.ts`'s `nutrientDisplayName` map already established.

3. **New type `HouseholdPlannedFood`** — one canonical food the household has ever planned, with `slug`, `name`, `diversityGroupSlug`, `appearances`, `firstWeekNumber`, `lastWeekNumber`.

4. **New pure function `buildHouseholdPlannedFoods(bySlug)`** — composes `fetchHouseholdPlannerFoods`'s per-slug accumulation with WS2A canonical identity (`CANONICAL_SEED.find`), producing `HouseholdPlannedFood[]`. An unresolvable slug is silently excluded (honest gap — should not happen since every `bySlug` key already came from `resolveCanonicalFood`, but never fabricated if it did).

5. **New pure function `identifyWeeklyVarietyGapOpportunities(week, plannedFoods)`** — filters to foods planned in the current week (`lastWeekNumber === week.weekNumber`) with a known diversity group, requires at least 2 such foods, groups them by `diversityGroupSlug`, and flags any group covering ≥50% of that week's classified foods (`medium`, or `high` when it is literally every classified food that week — zero variety).

6. **New pure function `identifyHouseholdNewFoodOpportunities(week, plannedFoods)`** — filters to foods whose `firstWeekNumber === week.weekNumber` (i.e. this week is their first-ever appearance), one `low`-priority, celebratory opportunity per food, sorted by slug for determinism.

7. **Orchestrator (`identifyOpportunities`) extended** — inside the existing planner `try` block, immediately after `identifyPlannerGapOpportunities` runs and `sources.add("planner")`, a nested `try` calls `fetchHouseholdPlannerFoods(household.householdId)` (a call already made once inside `resolveHouseholdSignal` for a different purpose — see Platform Quality Compliance for the accepted cost), builds `HouseholdPlannedFood[]`, and calls both new generators against the same `currentWeek`. Isolated in its own `try/catch` so a failure here never loses the planner-gap opportunities already pushed. Adds `"planner-history"` to `sources` on success.

### Modified: `server/tests/test-intelligence-food-opportunity-binding.ts`

Added three new `§1` sections (`buildHouseholdPlannedFoods`, `identifyWeeklyVarietyGapOpportunities`, `identifyHouseholdNewFoodOpportunities`), 26 new assertions, mirroring the file's existing fixture/assertion style exactly (`makeWeek`, `assert`, `section`). Covers: WS2A identity composition with an honest-gap case, genuine variety (no false positive), partial repetition (medium), total repetition (high), non-plant foods never counted, foods from an earlier week excluded, determinism, first-week-appearance detection, and familiar foods correctly excluded from "new."

No `package.json` change — the test script (`test:intelligence-food-opportunity-binding`) already exists and already runs in the `test` chain (FI4).

---

## DEFINITION OF DONE

**What success looks like:** a household with real planner history produces `weekly-variety-gap` and/or `household-new-food` opportunities through the exact same `food-intelligence`/`report` verb the Companion already calls, whenever the household's current planner week genuinely exhibits that pattern; a household whose current week has genuine variety, or introduces nothing new, produces neither — silently, never a false positive.

**What must not break:** every existing opportunity generator and its tests (`planner-empty-day`, `pantry-item-unused-in-plan`, `shopping-restriction-conflict`, IA3 re-weighting), the `food-intelligence` capability's registration (still recommend/explain/report, no new verb), the Port → Handler → Binding contract, and `npm test`.

**Manual test steps (validated below, §Validation Performed):**
1. `npx tsx server/tests/test-intelligence-food-opportunity-binding.ts` — all assertions pass, including the 26 new FI6 ones.
2. `identifyOpportunities()` called end-to-end for two real households — no regression, `sources` correctly includes the new `"planner-history"` tag, existing FI4 opportunity types still surface correctly.
3. The two new pure generators exercised directly against two real households' genuine planner history (not fabricated fixtures) — see Validation Performed.

---

## VALIDATION PERFORMED

Run against this environment's live database (not a stub) via a scratch script calling `fetchHouseholdPlannerFoods`, `buildHouseholdPlannedFoods`, and the two new generators directly with real household ids, then deleted (no artifact left behind, matching the FI5 validation convention). Household ids and planner facts below are genuine rows read at validation time.

**Household 44 (2 populated planner weeks: 3 and 5) — reasoning genuinely differs by week, proving this is history-aware reasoning, not retrieval:**

Referencing **Week 3** (the household's first-ever populated week) correctly flags all 11 distinct foods planned that week as new — because it genuinely is their first week:
```json
{
  "id": "household-new-food:15:spinach",
  "type": "household-new-food",
  "priority": "low",
  "explanation": "Spinach first appears in your household's planner this week (\"Week 3\", Week 3) — you haven't planned it in any earlier week.",
  "evidence": [{ "source": "planner-history", "detail": "Spinach has 7 planner appearances so far, all within Week 3." }]
}
```
(10 more, one per distinct food planned that week — Extra Virgin Olive Oil, Pumpkin Seeds, Chicken, Carrots, Mushroom, Tomato, Onion, Avocado, Asparagus, Lentils.)

Referencing **Week 5** (a later week that only repeats three already-familiar staples — Spinach, Extra Virgin Olive Oil, Pumpkin Seeds) correctly produces **zero** `household-new-food` opportunities (nothing new was introduced) and **zero** `weekly-variety-gap` opportunities (the 3 classified foods that week span 3 different diversity groups — genuine variety, no group dominates). This is the reasoning proof: the same household, the same generator, two different real weeks, two genuinely different — and both correct — outputs, driven entirely by what actually changed in their planner history.

**Household 188 (1 populated week, 16 distinct foods spanning 15 different diversity groups) — genuine variety correctly produces no false positive:**
`identifyWeeklyVarietyGapOpportunities` returns `[]` — no diversity group covers ≥50% of the week's classified foods (the closest is 1 of 15), confirming the threshold does not cry wolf on a genuinely well-varied week. `identifyHouseholdNewFoodOpportunities` correctly returns all 16 foods as new (first-ever week), same reasoning as household 44's Week 3.

**End-to-end regression check** — `identifyOpportunities({ userId })` called for real users in households 44 and 188 (not a stub port): both return successfully, `metadata.sources` correctly includes the new `"planner-history"` tag, and all pre-existing FI4 opportunity types (`planner-empty-day`, `pantry-item-unused-in-plan`, `shopping-restriction-conflict`) still surface exactly as before. Both households' actual *current* planner week (the highest `weekNumber`, week 6 for both) is empty of entries in this dev database — a pre-existing environment characteristic (not introduced by this task; `identifyPlannerGapOpportunities`, FI4, already reports it as 7 empty days for the same reason) — so no FI6 opportunity appears for the literal *current* week for these two households specifically. The reasoning proof above uses each household's own most recently *populated* week to exercise the same generators against real data instead.

**Test suite:** `npx tsx server/tests/test-intelligence-food-opportunity-binding.ts` — **76 passed, 0 failed** (50 pre-existing FI4/IA3 assertions unchanged + 26 new FI6 assertions). Regression suites re-run clean: `test:intelligence-food-intelligence-binding` (36/36), `test:household-nutrition-enrichment` (22/22).

`npx tsc --noEmit` — zero errors in `server/intelligence/food-intelligence/opportunity-engine.ts` (confirmed directly; a repo-wide `tsc` run is not a clean signal on this branch because of the large pre-existing uncommitted work unrelated to this task — see Rollback Protection).

---

## DATA IMPACT

- Reads existing data: **YES** — household planner history (D14, via the existing `fetchHouseholdPlannerFoods`) and WS2A canonical food/diversity-group identity, both already read today by other consumers.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- **Could this mislead the user?** No — every sentence names a real food, a real week number, and a real appearance count; nothing is inferred beyond what `fetchHouseholdPlannerFoods` and `CANONICAL_SEED` return.
- **Could this fabricate certainty?** No — a week with genuine variety, or nothing new, yields silence, never a fabricated "you have great variety" claim (this module only ever surfaces a gap, never asserts its absence positively).
- **Is anything guessed but shown as real?** No. Per-week occurrence counts that the data does not honestly provide (see Decision 4) are never approximated or guessed — the reasoning is scoped to exactly what `fetchHouseholdPlannerFoods` supports (distinct-food-level, not per-entry).
- **What happens if the system is wrong?** The new orchestrator read is wrapped in its own `try/catch`; any failure yields an honest `[]` for these two opportunity types only, never a crash and never blocking the planner-gap opportunities already found in the same request.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES**
- No runtime behaviour altered outside the two new opportunity types: **YES** — every existing generator, capability, and route is untouched.

---

## SCOPE LOCK

**Implemented scope:** two new, deterministic Food Opportunity types — `weekly-variety-gap` (increasing weekly variety / reducing repetition) and `household-new-food` (introducing foods new to the household) — added to the existing `opportunity-engine.ts` (FI4) and surfaced through the already-registered `food-intelligence` capability's `report` verb. New test coverage. No capability, schema, route, or store change.

**Explicitly excluded (out of scope — not implemented here, by explicit user instruction):**
- **`similar-role-better-choice`** (complementing foods already planned / suggesting a better choice between two foods that fulfil a similar role). The reuse seam for this (WS2A `diversityGroupSlug` shared by ≥2 distinct canonical foods, e.g. `citrus`, `wheat`, plus the existing evidence-backed benefit relationships in `shared/knowledge/foods.ts`) was identified during design but deliberately not built — a separate future decision.
- **Extracting the `routes.ts` inline plant-count duplication** (Decision 2 / Architecture Convergence Status). Named as a pre-existing, unrelated risk; not touched.
- **Per-entry (occurrence-level) repetition counting.** Decision 4 — the current data honestly supports distinct-food-level reasoning only; fabricating a per-entry count the read does not provide was rejected.
- **Any change to `pattern-intent-resolver.ts`, `MAX_INTENTS`, or any new conversational baseline capability.** The two new opportunity types ride the existing `report` verb path unchanged.
- **Any change to `identifyPlannerGapOpportunities`, `identifyPantryUnusedOpportunities`, `identifyShoppingRestrictionOpportunities`, or `reweightWithConfirmedUnderstanding`.** All four existing generators, and the IA3 re-weighting logic, are untouched and their tests unchanged.

**Suggestions (not implemented without approval):**
- A future `similar-role-better-choice` generator could reuse the same `HouseholdPlannedFood[]` composition this task introduces (already grouped by `diversityGroupSlug`), plus the evidence-backed benefit relationships in `shared/knowledge/foods.ts`, to suggest an underused option within an already-planned group.
- Extracting the `routes.ts` `/api/home/intelligence` / `/api/planner/weeks/:weekId/intelligence` inline plant-count logic into a reusable service (as FI5 also suggested) would let a future task converge that separate duplication onto the same WS2A mechanism this task uses, rather than leaving two "plant variety" concepts live side by side.
