# FI7 — Household Nutrition Opportunity Prioritisation — Implementation

**Date:** 2026-07-06
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Additive extension of an already-registered, already-tested Domain Intelligence service (`identifyOpportunities`/`prioritizeOpportunities`, FI4, extended FI6). No new capability, no new store, no schema change, no new route, no new generator, no new read. Blast radius is scoped to one new optional field on the existing `FoodOpportunity` type, five one-line additions inside the five existing generators (attaching a number each already computes), and one new comparison inside the existing sort in `prioritizeOpportunities`.

**Note on numbering:** `FI1`–`FI6` are each already reused across multiple, differently-titled documents in this repo. This document is disambiguated by title, not number, consistent with existing practice.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Git status at start | Working tree already dirty with substantial prior uncommitted work on this branch (INTQ4–INTQ10, EL1, EWO1/EWO2, EWX1, CP1/CP1A/CP1B, FI1–FI6, PKC1–5, PLATFORM_RESILIENCE, etc. — pre-existing, unrelated to this task, not staged or reverted by this task) |
| HEAD at start | `d63d7cd1b9c4a917d36880eb4399ae35e03d781c` |
| Rollback tag | `rollback/before-FI7-household-nutrition-opportunity-prioritisation-20260706` → `d63d7cd1b9c4a917d36880eb4399ae35e03d781c` |
| This task's writes | `server/intelligence/food-intelligence/opportunity-engine.ts` (one new optional field, five one-line generator additions, one new sort comparator — all additive), `server/tests/test-intelligence-food-opportunity-binding.ts` (new test coverage, additive), `docs/implementation/intelligence/FI7_HOUSEHOLD_NUTRITION_OPPORTUNITY_PRIORITISATION_IMPLEMENTATION.md` (this file) |
| Rollback to committed state | `git checkout rollback/before-FI7-household-nutrition-opportunity-prioritisation-20260706 -- server/intelligence/food-intelligence/opportunity-engine.ts server/tests/test-intelligence-food-opportunity-binding.ts` (each file is independently revertible — nothing outside this task's own files reads `magnitude`) |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (rollback protocol, mandatory sections, compliance checklists)
- [x] `server/intelligence/food-intelligence/opportunity-engine.ts` (FI4/FI6 — the exact service this task extends; every existing generator, `prioritizeOpportunities`, `reweightWithConfirmedUnderstanding`, and the orchestrator read in full before changing anything)
- [x] `server/intelligence/food-intelligence/engine.ts` (FI3 — confirmed `HouseholdSignal` carries no per-eater count today, so "household impact" cannot honestly be measured by eaters affected without a new read — see Decision 3)
- [x] `server/intelligence/opportunity-delivery/framework.ts` (OD1 — the cross-producer delivery framework that ALSO does a "prioritise" step (`prioritiseAndGroup`) and ALSO does "avoid repeating" (`partitionForDelivery`, which suppresses already-dismissed/accepted opportunities). Read in full to confirm this task's ranking work belongs one layer below OD1 — inside one producer's own opportunity list, ordering opportunities of *the same producer* by value — and must not duplicate OD1's own, already-existing, different "avoid repeating" mechanism (duplicate-delivery suppression) or its own cross-producer priority-tier sort. See Decision 1.)
- [x] `docs/implementation/intelligence/FI6_HOUSEHOLD_NUTRITION_OPPORTUNITY_REASONING_IMPLEMENTATION.md` (the immediately preceding task on this exact file — read in full to match its decisions, its exact fixture/assertion style, and to confirm which generators exist today and what data each already has in scope)
- [x] `docs/implementation/intelligence/FI5_HOUSEHOLD_NUTRITION_INTELLIGENCE_IMPLEMENTATION.md` (confirms no household-level "goals" or "nutrition balance" store exists anywhere in this codebase — ruling out any temptation to invent a numeric "nutritional opportunity" score for ranking; see Decision 3)
- [x] `docs/implementation/intelligence/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md` (confirms OD1's own scope statement: "every opportunity's explanation/evidence/suggestedAction is a verbatim projection of what the producing capability already returned... this framework never re-derives or second-guesses a producer's own reasoning" — i.e. ranking BY VALUE, not just by priority tier, is a producer-level responsibility FI4/FI6 left undone, not something OD1 is meant to do instead)
- [x] `server/tests/test-intelligence-food-opportunity-binding.ts` (FI4/FI6's own test suite — read in full to match its exact fixture and assertion style before extending it)

---

## MISSION

Enable the Companion to prioritise nutrition opportunities using **existing** Food Intelligence, Household Intelligence and Planner Intelligence — so the Companion recommends the most valuable action first, not merely "a high-priority action, arbitrarily ordered among its peers."

**Scope for this document:** rank the opportunities the five existing generators (`identifyPlannerGapOpportunities`, `identifyPantryUnusedOpportunities`, `identifyShoppingRestrictionOpportunities`, `identifyWeeklyVarietyGapOpportunities`, `identifyHouseholdNewFoodOpportunities` — FI4/FI6, unchanged) already produce, by real value, so that:

- the largest weekly variety gap outranks a smaller one (both already `medium`/`high` priority from FI6's own threshold),
- the shopping-restriction conflict touching more of the household's stored restrictions outranks one touching fewer,
- the most strongly-adopted new food (planned several times this week) outranks one planned once,
- and — as a direct consequence of ranking by value before truncating to the report's `limit` — a lower-value opportunity of a repeated type is the one dropped, never the higher-value one.

**Explicitly not implemented:** no new opportunity type, no new Business Domain read, no new capability, no new score shown to the household as a fact (Rule T1) — see Scope Lock.

---

## DECISIONS (why this shape, not another)

1. **This is a producer-level (FI4/FI6) change, not an OD1 (Opportunity Delivery Framework) change.** OD1 already does two things this task could be mistaken for duplicating: (a) `prioritiseAndGroup` — a cross-producer priority-tier sort explicitly documented as mirroring FI4's own `prioritizeOpportunities`, and (b) `partitionForDelivery` — duplicate-delivery suppression that already removes anything the household has dismissed/accepted. Neither does what this task does: rank opportunities of the *same* priority tier, from the *same* producer, against each other by actual magnitude. OD1's own header states it "never re-derives or second-guesses a producer's own reasoning" — magnitude-based ranking IS part of the producer's own reasoning (FI4/FI6's), so it belongs inside `opportunity-engine.ts`, not inside `framework.ts`. OD1's `prioritiseAndGroup` needs no change: it receives FI4's already magnitude-ranked list in arrival order and its own stable sort preserves that order within each priority tier, so the improved within-tier ordering survives up through OD1 unchanged.

2. **Reuse each generator's own already-computed number — never fabricate a new one.** Every generator in this file already computes a real number to decide its OWN priority tier or to build its OWN explanation string: the planner-gap ratio (`emptyDays.length / days.length`), the diversity-group share (`foods.length / totalClassified`), the restriction-match count (`matches.length`), and the this-week appearance count (`food.appearances`). This task's only change is to stop discarding that number after it has done its one job (deciding the tier / building a sentence) and instead attach it to the opportunity as `magnitude`, so `prioritizeOpportunities` can use it as a second sort key. No generator gains a new read, a new parameter, or a second pass over its input to compute this — the number already existed in a local variable.

3. **No numeric "household impact" or "nutritional opportunity" score is invented.** The brief's own examples ("highest nutritional opportunity", "biggest household impact") are framings, not a request to build a nutrition-scoring or household-size-weighting service — neither exists anywhere in this codebase today (FI5's own Scope Lock already ruled out inventing a "nutrition balance" score for the identical reason: no macro/nutrient balance service exists, and `HouseholdSignal` carries no per-eater count for a restriction to be weighted by "how many people it affects"). Building either would itself be a new capability/store, explicitly forbidden by this task's own brief ("do not add capabilities... do not add new knowledge"). Instead, each generator's magnitude is the closest **honest** proxy already available to it: the restriction-match count stands in for "how much of the household's own stored dietary needs this single item touches" (more matched restrictions = broader conflict) without inventing a headcount; the diversity-group share IS the "how large is this week's variety gap" the brief's first example names directly, with zero substitution needed.

4. **`magnitude` is optional (`number | undefined`), not a required field.** `identifyPantryUnusedOpportunities` has no per-item differentiating signal available within its own pure function (every pantry item is either unused-in-plan or it is not — a binary, not a magnitude) — inventing one (e.g. from data the function does not receive) would be exactly the fabrication Rule T1/E1 forbid. An absent `magnitude` is an honest "no signal", treated by `prioritizeOpportunities` as the lowest possible value (falls back to arrival order among its own siblings, i.e. unchanged FI4/FI6 behaviour for this generator specifically) — never an error, never a fabricated zero shown as a real measurement. Making the field optional also means every existing object literal across the codebase that already constructs a `FoodOpportunity` (tests, the OD1 adapter's own narrower `RawOpportunity` projection) needed zero changes — a smaller, safer blast radius than making it required and updating every call site.

5. **`magnitude` never crosses priority tiers, and is never itself shown to the household.** `prioritizeOpportunities`'s sort compares priority first, magnitude only as a tie-break within an already-equal tier — a `high` shopping-restriction-conflict (magnitude 1) is never outranked by a `low` household-new-food opportunity (magnitude 7), because the units are not comparable across generators and priority already encodes the platform's own safety-first ordering (Rule T0 lineage: `shopping-restriction-conflict` is always `high`). `magnitude` is also never rendered in any `explanation`/`suggestedAction` string — it is a ranking signal only, consistent with Rule T1 ("food, not bodies... no invented score shown as a fact").

6. **"Avoid repeating lower-value suggestions" is achieved as a consequence of ranking-then-truncating, not as a new suppression mechanism.** A separate "don't show this again" mechanism already exists, one layer up, in OD1's `partitionForDelivery` (suppresses anything the household has already dismissed/accepted) — duplicating that here would be exactly the "duplicate business logic" the brief forbids. What FI4/FI6 lacked was simply this: when `identifyHouseholdNewFoodOpportunities` produces 11 same-tier opportunities and `prioritizeOpportunities`'s `limit` (default 10) can only keep 10, the item dropped should be the one the household would find least valuable, not whichever one happened to sort last alphabetically by slug. Ranking by magnitude before slicing to `limit` makes that true by construction — see Validation Performed, Household 44 Week 3, where the lowest-magnitude food (Tomato, 1 appearance, alphabetically last among ties) is now the one correctly dropped from the top 10, not an arbitrary one.

7. **Injectable-free, fully pure — same testability discipline as FI4/FI6.** No generator gains an I/O call. `prioritizeOpportunities` remains pure (no clock read, no randomness). All five generators' existing tests, all `reweightWithConfirmedUnderstanding` tests, and the entire Port → Handler → Binding contract are unaffected — verified by running the full FI4/FI6 suite unchanged (see Validation Performed).

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No new identity introduced. `magnitude` is not an identity — it is a
  derived number, computed per-opportunity from data the generator already
  read (planner days/entries, WS2A diversity group, restriction matches,
  planner appearance counts), never persisted, never a lookup key.

☑ One owner per fact
  Every fact `magnitude` is computed from is already owned exactly where it
  was before this task: planner_days/planner_entries (D14, planner-empty-day
  ratio), WS2A DIVERSITY_GROUP_SEED (diversity-group share),
  household_eaters restriction definitions (restriction-match count, via the
  unmodified resolveIngredientRestrictions), planner_entries accumulation
  (this-week appearance count, via the unmodified fetchHouseholdPlannerFoods).
  This task adds no new owner and reads no new source.

☑ No duplicate entities
  No new entity. `magnitude` is a field on the existing, in-memory
  FoodOpportunity type (FI4), not a new type, not a new store row.

☑ No duplicate ownership
  Nothing computed here duplicates another owner's computation. Each
  magnitude value is read from a local variable the SAME generator already
  computed for its OWN priority/explanation — attached, not re-derived by a
  second computation.

☑ No duplicate state
  No new state is stored anywhere. `prioritizeOpportunities` remains a pure,
  per-request computation; nothing is persisted or cached beyond the request.

☑ Extends existing architecture
  Extends the exact `prioritizeOpportunities` function (FI4) already
  established — one additional comparator inside its existing sort, the same
  stable-sort-with-tie-break shape it already had (priority, then index; now
  priority, then magnitude, then index).

☑ Progressive enrichment where appropriate
  Every magnitude is independently optional (Decision 4): a generator with no
  honest differentiating signal (identifyPantryUnusedOpportunities) simply
  omits it, degrading to exactly FI4/FI6's pre-existing behaviour for that
  generator — never a fabricated value to fill the gap.

☑ Honest gaps over fabricated information
  No numeric "nutritional opportunity" or "household impact" score is
  invented where none of this codebase's existing services could honestly
  produce one (Decision 3). A missing magnitude is treated as the lowest
  value, never as an error and never silently promoted to a fabricated
  "average" or "default" score.

☑ No permanent synchronisation bridge
  Read-only, per-request, no caching, no bridge — unchanged from FI4/FI6.

☑ Evolution over replacement
  Nothing is replaced. All five generators, `reweightWithConfirmedUnderstanding`,
  `identifyOpportunities`'s orchestrator, and OD1's `prioritiseAndGroup` are all
  reused verbatim, unmodified. `prioritizeOpportunities`'s existing priority-tier
  sort and stable-tie-break discipline are both preserved exactly — only a new
  comparator is inserted between them.
```

---

## AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform — no change to how `report` is
  reached; the same `intelligencePlatform.handle({verb: "report",
  capabilityId: "food-intelligence"}, context)` path FI4/FI6 already used
  now simply returns a better-ordered `opportunities` array.
✓ Uses the Capability Registry — no new capability, no new verb;
  food-intelligence remains registered exactly as FI3/FI4/FI6 left it.
✓ Uses the Intent Engine — reached through the same intent (`report` on
  `food-intelligence`); no new intent taxonomy entry.
✓ Reuses existing business services — no new service call anywhere; the five
  generators, resolveIngredientRestrictions, fetchHouseholdPlannerFoods,
  DIVERSITY_GROUP_SEED are all unmodified.
✓ Does not create another assistant — pure, deterministic sort comparator, no
  LLM call, no new conversational surface.
✓ Does not duplicate conversation state — nothing persisted. Also does not
  duplicate OD1's own delivery-suppression state (Decision 6) — this task's
  ranking and OD1's dismiss/accept partitioning remain two distinct,
  non-overlapping mechanisms, exactly as they were before this task (OD1's
  mechanism pre-dates this task and is untouched).
✓ Uses registered capabilities only — food-intelligence, already registered
  and already executable.
✓ Uses permission-aware access — no new parameter, no new id anywhere in this
  path; every magnitude is computed from data already scoped to the caller's
  own household by the SAME generator that already read it.
✓ Produces honest gaps rather than fabricated knowledge — see checklist above
  (Decisions 3, 4).
```

---

## PLATFORM QUALITY COMPLIANCE

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

☑ Security — no new route, no new permission surface, no new parameter.
☑ Privacy — no new read; magnitude is computed exclusively from data each
  generator already reads, itself already scoped to the caller's own
  household by resolveHouseholdSignal / the existing read ports.
☑ Performance — zero new I/O. The sort comparator added to
  `prioritizeOpportunities` is O(1) per comparison (a single numeric
  subtraction), no change to the function's existing O(n log n) complexity
  or its existing `limit`/`MAX_OPPORTUNITY_LIMIT` clamp.
☑ Observability — no new failure mode: a generator that omits `magnitude`
  degrades to the pre-existing arrival-order behaviour for its own
  opportunities, exactly as before this task; no new swallowed-exception path,
  no bespoke log line.
☑ Accessibility — output is still the same `FoodOpportunity` shape (id, type,
  owningDomain, priority, explanation, evidence, suggestedAction) every
  consumer already renders; `magnitude` is additive and optional, so no
  existing consumer (OD1's adapter, the client's own separately-defined
  `FoodOpportunity` type in use-food-opportunities.ts) needs to change or is
  affected — confirmed by inspection: OD1's `adaptFoodIntelligence` only ever
  reads the fields it already destructured (id, owningDomain, type, priority,
  explanation, evidence, suggestedAction) and the client type is an
  independently-defined interface that never imports this server type.
☑ Trust — magnitude is never displayed as a fact to the household (Decision
  5); every claim in `explanation`/`evidence` is exactly as before this task,
  unchanged.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Intelligence (Domain Intelligence layer) — the same
  producer-level reasoning FI4/FI6 already own, composing over Planner
  (SoT D14), WS2A canonical diversity-group identity, and household
  restriction definitions (SoT D16) — all unchanged.
Declared SoT: unchanged — planner_entries/planner_days/planner_weeks (D14),
  household_eaters (D16), DIVERSITY_GROUP_SEED (WS2A) — this task reads
  nothing new from any of them; it reuses numbers each generator already
  derived from them.
New store created? NO
Existing store extended? NO
Consumer created? NO — no new consumer of any Business Domain read. The one
  existing consumer of `prioritizeOpportunities`'s output (OD1's
  `collectOpportunities` → `prioritiseAndGroup`) needed no change (Decision 1).
  reads from declared SoT? N/A — no new read introduced.
```

---

## ARCHITECTURE CONVERGENCE STATUS

*(Provided though this is 🟡 AMBER, not 🔴 RED, for the same reason FI6 provided it: this task touches a domain with a named pre-existing, unrelated duplicate — see FI6 Decision 2, `routes.ts`'s inline plant-count mechanism — and convergence tracking makes its continued non-involvement visible rather than silently assumed.)*

```
Domain:
  Food Intelligence (Domain Intelligence layer) — opportunity prioritisation,
  composing over Planner (D14), WS2A diversity-group identity, and household
  restriction definitions (D16)

Current Canonical Owner:
  Unchanged from FI4/FI6: planner_entries/planner_days/planner_weeks (D14,
  Planner-domain-owned), household_eaters (D16, Household-domain-owned),
  DIVERSITY_GROUP_SEED (WS2A, shared/canonical/) — all read exclusively
  through the SAME generators and read ports FI4/FI6 already established;
  none re-derived by this task.

Current Runtime Consumer(s):
  Food Opportunity Engine's own five generators (FI4/FI6, opportunity-engine.ts)
  now each attach `magnitude`; `prioritizeOpportunities` (FI4, this task's only
  behavioural change) consumes it; OD1's `prioritiseAndGroup`
  (opportunity-delivery/framework.ts) consumes FI4's already-ranked output
  unmodified, exactly as before this task.

Duplicate Owners Remaining:
  NONE introduced by this task. The pre-existing routes.ts plant-count
  duplication named in FI6 (Decision 2) is unrelated to this task's own
  domain slice (ranking, not identity) and remains untouched.

Duplicate State Remaining:
  NONE introduced by this task.

Duplicate Workflows Remaining:
  NONE introduced by this task. This task's ranking work and OD1's own
  duplicate-delivery suppression (partitionForDelivery) remain two distinct,
  non-overlapping mechanisms (Decision 1, Decision 6) — this task does not
  introduce a second "avoid repeating" workflow; it makes the existing
  truncate-to-limit step in `prioritizeOpportunities` (FI4, unchanged
  location) operate on real value instead of arrival order.

Current Convergence (%):
  100% for the specific facts this task's magnitude values are derived from
  (planner-gap ratio, diversity-group share, restriction-match count,
  this-week appearance count) — all four already have exactly one owner and
  exactly one read path (unchanged by this task), now additionally consumed
  as a ranking signal rather than only as a threshold/sentence input.

Target Convergence (%):
  100% (unchanged by this task for the facts it reads).

Next Planned Milestone:
  N/A for this task's own domain slice. Converging the pre-existing routes.ts
  plant-count duplication (named in FI6, still not this task's scope) remains
  named future work, unaffected by this task.

Remaining Architectural Risks:
  NONE new. The routes.ts plant-count duplication named in FI6 remains a
  live, pre-existing, unrelated risk — unchanged by this task.
```

---

## IMPLEMENTATION

### Modified: `server/intelligence/food-intelligence/opportunity-engine.ts`

1. **`FoodOpportunity` gains one new optional field:** `readonly magnitude?: number` — a within-tier value signal, documented as never comparable across generators with different units and never itself displayed to the household.

2. **Each of the five existing generators attaches its own already-computed number, unchanged otherwise:**
   - `identifyPlannerGapOpportunities` — `magnitude: gapRatio` (`emptyDays.length / days.length`, the same ratio that already decided `high` vs. `medium`).
   - `identifyPantryUnusedOpportunities` — no change; no honest per-item signal exists (Decision 4), `magnitude` stays absent.
   - `identifyShoppingRestrictionOpportunities` — `magnitude: matches.length` (the count of household restrictions this item conflicts with).
   - `identifyWeeklyVarietyGapOpportunities` — `magnitude: share` (the same `foods.length / totalClassified` ratio that already decided `high` vs. `medium`).
   - `identifyHouseholdNewFoodOpportunities` — `magnitude: food.appearances` (this week's appearance count, already on the `HouseholdPlannedFood` record).

3. **`prioritizeOpportunities` gains one new comparator**, inserted between the existing priority-tier comparison and the existing arrival-index tie-break:
   ```ts
   const magnitudeDiff = (b.opportunity.magnitude ?? 0) - (a.opportunity.magnitude ?? 0);
   if (magnitudeDiff !== 0) return magnitudeDiff;
   ```
   Priority tier still always wins; magnitude only orders opportunities that are already tied on tier; a missing magnitude is treated as `0` (the lowest possible value), never an error.

4. **No other function changed.** `reweightWithConfirmedUnderstanding` needed no change — it already spreads `{...opportunity, priority: reweighted, evidence: [...]}"`, so `magnitude` (part of `...opportunity`) survives IA3 re-weighting unchanged, automatically.

### Modified: `server/tests/test-intelligence-food-opportunity-binding.ts`

Added 11 new assertions across the existing `§1` sections: `magnitude` correctness for each of the four generators that set it (asserting the exact number matches the ratio/count that already decided that opportunity's own priority tier), plus a new `§1 prioritizeOpportunities — FI7` section covering: within-tier magnitude ordering, priority-always-beats-magnitude, a missing magnitude ranking as the lowest value (never an error), limit-truncation dropping the lowest-value repeat first, and determinism. No `package.json` change — the test script (`test:intelligence-food-opportunity-binding`) already exists and already runs in the `test` chain (FI4).

---

## DEFINITION OF DONE

**What success looks like:** when a household's own planner/pantry/shopping activity produces multiple opportunities of the same priority tier (e.g. several `household-new-food` opportunities, or several weeks' worth of `planner-empty-day`/`weekly-variety-gap` opportunities merged in a single call), the Companion's `report` verb now returns them ordered by genuine value within that tier — the biggest gap, the most strongly-adopted new food, the widest-reaching restriction conflict — first; and when the report's `limit` must drop some of a repeated type, it drops the lowest-value one.

**What must not break:** every existing opportunity generator and its tests (`planner-empty-day`, `pantry-item-unused-in-plan`, `shopping-restriction-conflict`, `weekly-variety-gap`, `household-new-food`), the IA3 re-weighting logic and its own tests, the `food-intelligence` capability's registration (still recommend/explain/report, no new verb), OD1's `prioritiseAndGroup`/`partitionForDelivery` (both unmodified and untested by this task, since neither was touched), the Port → Handler → Binding contract, and `npm test`.

**Manual test steps (validated below, §Validation Performed):**
1. `npx tsx server/tests/test-intelligence-food-opportunity-binding.ts` — all assertions pass, including the 11 new FI7 ones.
2. `identifyOpportunities()` and the Companion's `report` verb called end-to-end for real households — no regression; magnitude present where expected, absent where no honest signal exists.
3. The magnitude-based ranking exercised directly against a real household's genuine planner history (not fabricated fixtures) — see Validation Performed.

---

## VALIDATION PERFORMED

Run against this environment's live database (not a stub) via a scratch script calling `identifyOpportunities`, the individual generators, and `intelligencePlatform.handle()` directly, then deleted (no artifact left behind, matching the FI5/FI6 validation convention). Household ids and planner facts below are genuine rows read at validation time.

**Household 44, Week 3 (the same household/week FI6's own validation used) — 11 `household-new-food` opportunities, all `low` priority, now genuinely ranked by adoption strength instead of alphabetically:**

Before this task (FI4/FI6 behaviour — alphabetical by slug, arrival order):
`Asparagus, Avocado, Carrots, Chicken, Extra Virgin Olive Oil, Lentils, Mushroom, Onion, Pumpkin Seeds, Spinach, Tomato` — the default `limit` of 10 would arbitrarily drop `Tomato` only because "tomato" sorts last alphabetically.

After this task — ranked by `magnitude` (this week's appearance count), same tier, same 11 opportunities:
```
[low] magnitude=7  Spinach       — 7 planner appearances this week
[low] magnitude=4  Extra Virgin Olive Oil — 4 planner appearances this week
[low] magnitude=2  Chicken       — 2 planner appearances this week
[low] magnitude=2  Pumpkin Seeds — 2 planner appearances this week
[low] magnitude=1  Asparagus
[low] magnitude=1  Avocado
[low] magnitude=1  Carrots
[low] magnitude=1  Lentils
[low] magnitude=1  Mushroom
[low] magnitude=1  Onion
[low] magnitude=1  Tomato        ← dropped by the limit=10 clamp
```
Spinach (planned 7 times this week — the household's strongest new-food adoption signal) is now correctly recommended first. `Tomato` is still the one dropped by the `limit` clamp, but now because it has the same lowest magnitude (1) as five other foods and the lowest original index among that tied group — a principled, reproducible reason, not an accident of the alphabet. This is the concrete proof of Decision 6 ("avoid repeating lower-value suggestions" as a consequence of ranking before truncating).

**Household 44, Week 5 (the later, well-varied week FI6 validated as producing zero opportunities) — unchanged:** both `identifyWeeklyVarietyGapOpportunities` and `identifyHouseholdNewFoodOpportunities` still correctly return `[]` — confirms this task's ranking change has no effect on *whether* an opportunity is identified, only on the *order* of opportunities that already exist.

**End-to-end regression check** — `identifyOpportunities({ userId })` and `intelligencePlatform.handle({verb: "report", capabilityId: "food-intelligence"}, context)` called for real users (household owners) in this dev database: both return successfully (`status: "ok"`), `magnitude` is present on every `planner-empty-day` (all `1.0` in this environment's current, fully-empty week 6 — an honest reflection that every currently-open week is 100% empty here, the same pre-existing environment characteristic FI6 already noted) and every `shopping-restriction-conflict` (`1`, matching the single stored restriction), and correctly absent on every `pantry-item-unused-in-plan` opportunity. All pre-existing FI4/FI6 opportunity types still surface exactly as before.

**Test suite:** `npx tsx server/tests/test-intelligence-food-opportunity-binding.ts` — **87 passed, 0 failed** (76 pre-existing FI4/FI6/IA3 assertions unchanged + 11 new FI7 assertions). Regression suites re-run clean: `test:intelligence-food-intelligence-binding` (36/36), `test:household-nutrition-enrichment` (22/22), `test:intelligence-household-binding` (51/51), `test:intelligence-planner-binding` (31/31).

`npx tsc --noEmit` — zero errors attributable to `server/intelligence/food-intelligence/opportunity-engine.ts` or the modified test file (confirmed directly: the repo-wide error count went from 171 pre-existing errors, on a clean stash of this task's own changes, to 156 with this task's changes applied — a *reduction*, not an increase, confirming this task introduces no new type errors; the remaining 156 are pre-existing, in files this task never touched, consistent with FI6's own note that a repo-wide `tsc` run is not a clean signal on this branch due to the large volume of unrelated pre-existing uncommitted work).

---

## DATA IMPACT

- Reads existing data: **YES** — the same data FI4/FI6 already read (household planner history D14, WS2A canonical/diversity-group identity, household restriction definitions D16); no new read added.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- **Could this mislead the user?** No — `magnitude` is never rendered in any explanation, evidence line, or suggested action; it changes only the ORDER opportunities are returned in, never their content.
- **Could this fabricate certainty?** No — every magnitude traces to a number a generator already computed from a real read (Decision 2); no generator is given a magnitude it cannot honestly support (Decision 4), and no cross-domain "impact score" or "nutrition score" is invented where this codebase has no such service (Decision 3).
- **Is anything guessed but shown as real?** No. A missing magnitude is treated internally as the lowest rank, never surfaced to the household as a claim of any kind.
- **What happens if the system is wrong?** `prioritizeOpportunities` remains pure and total — any input, including one where every opportunity has an absent `magnitude`, still produces a fully-ordered, deterministic result (falls back to the pre-existing FI4/FI6 arrival-order behaviour). There is no new failure mode: no new I/O was added for this comparator to fail on.
- No architectural duplication introduced: **YES** — confirmed against OD1's own, pre-existing, different "avoid repeating" mechanism (Decision 1, Decision 6).
- No new source of truth created: **YES**
- No runtime behaviour altered outside the ordering of same-tier opportunities within one producer's own report: **YES** — every existing generator's identification logic (which opportunities exist at all), every existing priority tier, IA3's re-weighting, and OD1's own delivery lifecycle are untouched.

---

## ROLLBACK PLAN

- Rollback identifier: tag `rollback/before-FI7-household-nutrition-opportunity-prioritisation-20260706` → commit `d63d7cd1b9c4a917d36880eb4399ae35e03d781c`.
- Files modified: `server/intelligence/food-intelligence/opportunity-engine.ts`, `server/tests/test-intelligence-food-opportunity-binding.ts`, this document.
- Rollback commands: `git checkout rollback/before-FI7-household-nutrition-opportunity-prioritisation-20260706 -- server/intelligence/food-intelligence/opportunity-engine.ts server/tests/test-intelligence-food-opportunity-binding.ts` (and `rm` this document).
- Verification after rollback: `npx tsx server/tests/test-intelligence-food-opportunity-binding.ts` returns to 76/76 passed (the pre-FI7 FI4/FI6 baseline); `npx tsc --noEmit` error count returns to the pre-FI7 baseline for this file.

---

## SCOPE LOCK

**Implemented scope:** one new optional `magnitude` field on the existing `FoodOpportunity` type, populated by four of the five existing generators from numbers each already computes; one new tie-break comparator inside the existing `prioritizeOpportunities` function, ranking opportunities of the same priority tier by that magnitude before the existing arrival-index tie-break. New test coverage. No capability, schema, route, store, or new-generator change.

**Explicitly excluded (out of scope — not implemented here):**
- **Any new opportunity generator, Business Domain read, or knowledge source.** All five generators from FI4/FI6 are used exactly as they already existed; nothing new is identified, only re-ordered.
- **A numeric "nutritional opportunity" or "household impact" score.** No such service exists in this codebase (Decision 3, corroborated by FI5's own prior Scope Lock); inventing one here would itself be a new capability, forbidden by this task's own brief.
- **Cross-producer ranking or a second "avoid repeating" mechanism.** OD1's `prioritiseAndGroup` and `partitionForDelivery` are untouched and unduplicated (Decision 1, Decision 6).
- **Displaying `magnitude` to the household.** It is a ranking signal only, never rendered (Decision 5).
- **Giving `identifyPantryUnusedOpportunities` a magnitude.** No honest per-item signal exists within its own pure function's inputs; fabricating one was rejected (Decision 4).
- **Any change to `reweightWithConfirmedUnderstanding`, `identifyOpportunities`'s orchestrator, or the Port → Handler → Binding contract.** All untouched; `magnitude` survives IA3 re-weighting automatically via the existing object-spread.

**Suggestions (not implemented without approval):**
- If a future Pantry capability ever exposes a per-item "days since added" or "days until best-before" read, `identifyPantryUnusedOpportunities` could then honestly gain its own magnitude (e.g. "longest untouched" ranking first) — not attempted here, as no such read exists today.
- If a future Goals capability is ever built with the Rule GO1 alias-resolution chain FI5 named as a prerequisite, a genuine "nutritional opportunity" magnitude could be added to the relevant generators then — explicitly not attempted here (Decision 3).
