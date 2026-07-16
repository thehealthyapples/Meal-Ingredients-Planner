# CBK2 — Intelligent Cookbook Evolution

**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Extends three existing engines and closes a declared capability gap. No new engine, no new capability, no schema change, no migration, no new store. But it puts new cards and new sentences in front of households on a live surface, and it makes one previously-unexecutable verb executable.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/CBK2-intelligent-cookbook-evolution-20260712` |
| Commit SHA | `b4a63af861b2ec14fc5f09b69db7441c81115fab` |
| Rollback to committed state | `git checkout rollback/CBK2-intelligent-cookbook-evolution-20260712` |

> **⚠️ The working tree was DIRTY when this tag was taken** (61 modified tracked files, 28 untracked, from PHASE5A–PHASE5E / HHP / SHOP1, authored by others). Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3, a tag protects **committed state only** — it does **not** cover that uncommitted work. It was snapshotted out-of-repo before any edit:
>
> - `…/scratchpad/CBK2-pre-change-snapshot/tracked-uncommitted.patch` (232 KB)
> - `…/scratchpad/CBK2-pre-change-snapshot/untracked/` (28 files)
>
> CBK2 touched none of that pre-existing work except where a type change mechanically required it (the two `MealsReadPort` test fakes) or where an assertion encoded a premise CBK2 corrects (§8).

---

## 1. SUMMARY

The Cookbook was the platform's last silent surface. Planner, Pantry, Shopping, Nutrition and Home all mounted ambient intelligence in PHASE5C. The Cookbook — the place a household keeps the food it actually cares about — was never wired up. It could store a recipe, search it, and show its ingredients. It could not tell you a single thing about what that recipe *meant for you*.

Everything needed to fix that already existed and had simply never been joined:

- `household-meal-matcher` could score a recipe against every eater in the household — and had only ever been asked about Planner candidates.
- `buildPlannerExplanationContext` already read the pantry, LEARN1, the opportunity producers, seasonality and planner history in one pass — and was named, and used, as if it belonged to the Planner alone.
- `explainability-service` already turned all of that into cited, non-fabricable sentences — and no Cookbook surface had ever called it.
- The FI4 Food Opportunity Engine already had an extension point its own type union advertises.
- `meals` was already a `ConversationSurface`.

CBK2 joins them. **It builds no cookbook engine, adds no capability, and writes no ranking rule.**

### What CBK2 cost, measured

| | |
|---|---|
| New engines | **0** |
| New capabilities | **0** (live count stays **23**) |
| New capability *verbs made executable* | **1** (`meals:explain` — closing a gap the Capability Card declared) |
| Schema changes / migrations | **0** |
| New HTTP routes | **0** (the existing `/api/meals/:id/intelligence` carries it) |
| New scores or ranking rules | **0** — and see §2 |
| New visual patterns | **0** |
| Lines added to `OPPORTUNITY_SOURCES` | **0** (`food-intelligence` was already enrolled) |

### The six faces of the intelligent Cookbook

| Face | Delivered by | Owner reused | Status |
|---|---|---|---|
| **Household-aware recipes** | `reasoning.household-suitability` + `cookbook-recipe-household-conflict` | `household-meal-matcher`; `shared/restrictions` | **New (CBK2)** |
| **Nutrition-aware recipes** | `reasoning.plant-diversity`; existing benefit/uplift sections | `plant-classifier`; KNOW4 evidence gate (pre-existing) | **Extended** |
| **Pantry-aware cooking** | `intelligence.pantry` + `cookbook-recipe-cookable-now` | `resolveCanonicalFood` + pantry owner (SoT D8–11) | **New (CBK2)** |
| **Opportunity-aware recipes** | `reasoning.open-opportunity` | `opportunitiesAdvancedBy` + the registered producers | **New (CBK2)** |
| **Recipe reasoning & explanations** | `generateRecipeExplanation` + the `meals:explain` verb | `explainability-service` (the ONE explanation owner) | **New (CBK2)** |
| **Contextual recipe guidance** | `AmbientIntelligence` on `/cookbook`; the WX1A strip | Decision Engine (DEC1/OD1); `FoodOpportunityCard` | **New (CBK2)** |

---

## 2. THE LOAD-BEARING DECISION — the Planner's explainer would have LIED to the Cookbook

This is the only part of CBK2 that required judgement rather than wiring, and it is the part most likely to be undone by a future edit that does not understand it. It is guarded mechanically by `test-cbk2-intelligent-cookbook.ts` §1.3.

The brief asks for *recipe reasoning and explanations*, and the platform already has a meal explainer: `generateMealExplanation`. The obvious, cheap, wrong implementation of CBK2 is one line:

```ts
generateMealExplanation(candidate, prefs, { context, week: EMPTY_PLANNER_WEEK_STATE })
```

**That would have shipped a fabrication.** Five of the explainer's sixteen dimensions are *week-relative*. Handing them an empty week does not make them silent — it makes two of them **lie**:

| Dimension | Against an empty week | Verdict |
|---|---|---|
| `week-opportunity` | `fishTarget` is null → no citation | Silent ✔ honest |
| `shopping-impact` | `weeklyBudget` is null → no citation | Silent ✔ honest |
| `planner-balance` | `mealsChosen === 0` → no citation | Silent ✔ honest |
| **`plant-diversity`** | `week.plantGroups` is empty, so **every** plant group is "fresh" → *"Adds 5 new plants to **your week**"* | **LIES** ✘ |
| **`open-opportunity`** | `addsNewPlant` is trivially true, so **every** plant-bearing recipe claims to advance the household's diversity gap | **LIES** ✘ |

A cookbook of 200 recipes would have had 200 of them each announcing it would fix the household's plant-diversity gap — on no evidence, about a week that does not exist. Three dimensions degrade honestly; two degrade into confident nonsense. That asymmetry is invisible at the call site, which is exactly why it is written down here and asserted in a test.

**The real distinction, which the codebase had never named:**

| | **The Planner** | **The Cookbook** |
|---|---|---|
| The question | *Why did this candidate win **this slot, this week**, over the others?* | *What does this recipe mean **for us**?* |
| Nature | A **selection**, comparative and week-scoped | A **standing property** of (recipe × household) |
| May it rank? | **Yes** — it must choose one meal over another | **No** — the household already chose. It owns this recipe. |
| Output | `MealExplanation` — with a `scoreBreakdown` | `RecipeExplanation` — **no score, by type** |

So CBK2 reuses the **evidence layer** and *not* the **scoring layer**:

- **Reused wholesale:** `PlannerExplanationContext` (pantry, LEARN1, opportunities, season, history — one composed read), `scoreCandidateCompatibility` (the same household-fit rule the Planner uses, so the two surfaces *cannot* disagree about who a recipe suits), `mealCanonicalFoods`, `mealPlantGroups`, `opportunitiesAdvancedBy`, `matchLearnedPreference`, and the `cite()` non-fabrication discipline.
- **Deliberately not reused:** `ScoredCandidate`, `SCORE_WEIGHTS`, `PlannerWeekState`, and every week-relative dimension.

`RecipeExplanationDimension` is a `Extract<PlannerExplanationDimension, …>` — the eight week-free dimensions, and no others. **The week-relative ones are unreachable from the Cookbook by construction, not by a reviewer remembering not to emit them.**

Both explainers live in **one file**, because they are one concern (explanation) with one evidence vocabulary and one citation rule. A `recipe-explainability-service.ts` beside the existing one would have been the second owner of *"why this meal"* — precisely the duplication CBK2 exists to avoid.

### The corollary: the Cookbook authors no score

The Planner ranks because it *must* choose. The Cookbook is describing a recipe the household **already owns and already chose**. Marking it out of 100 would be a judgement nobody asked for, and would make the Cookbook the second author of a ranking rule the scorer already owns. `RecipeExplanation` therefore has no `score` and no `scoreBreakdown` — asserted by type and by test (§1.5).

---

## 3. THE SECOND DECISION — `explain` was gapped on a false premise

The Meals Capability Card declares:

> `explain` — **no stored rationale field on meals** — gap

True, and irrelevant. **A rationale was never something to store.** It is *derived from its owners at read time* — household eaters, pantry, LEARN1, planner history, the opportunity producers — which is exactly what the Planner has done for a candidate meal since PLAN1, without a rationale column anywhere.

The gap was a **premise error, not a missing column**. Closing it required **no schema change whatsoever**: `meals:explain` is now executable, delegating to the WX1A assembler.

This is not a technicality. The Product Knowledge Registry entry for this capability has claimed since its creation that *"Apple can find and **explain** the household's own recipes."* That sentence was **false** — `explain` returned an honest gap. CBK2 is the change that makes the registry's existing claim true, which is the clearest possible evidence that the gap was a defect and not a design.

`recommend` remains an honest gap, unchanged: ranking still lives inline at the route layer (`rankMealsByPreferences`, `routes.ts:4965`), not behind a delegate-only owner method, so binding it would put business logic in the handler (forbidden by INT7A). CBK2 did not touch it.

---

## 4. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Recipes keyed on meals.id; pantry on user_pantry_items.id. Food identity between a
  recipe ingredient and a pantry item resolves through the ONE canonical resolver
  (resolveCanonicalFood) that every other generator in the engine already uses. No
  second identity mapping created.

☑ One owner per fact
  Household fit    → household-meal-matcher (scoreCandidateCompatibility). CBK2 authors
                     no compatibility rule; the Planner and the Cookbook call the SAME
                     function and therefore cannot disagree about who a recipe suits.
  Restrictions     → shared/restrictions. CBK2 authors no matcher.
  Explanation      → explainability-service (the ONE explanation owner — extended in
                     place, never forked).
  Meal intelligence→ meal-intelligence-assembler (WX1A — extended in place, no second
                     composer beside it).
  Meals rows       → SoT D12. Pantry rows → SoT D8–11. CBK2 writes to NEITHER.

☑ No duplicate entities
  No new entity. Two new *types* on an existing closed union; one new subject entity
  ("meal"). No new table, no new column, no migration.

☑ No duplicate ownership
  No attribute given a second owner. RecipeExplanationDimension is an Extract<> of the
  existing dimension union — not a parallel vocabulary.

☑ No duplicate state
  No user state written at all. Every generator is a PURE function over already-fetched
  rows; the explainer is PURE over an already-composed context. CBK2 has no store, no
  cache, and no background job.

☑ Extends existing architecture
  Extends FI4's opportunity engine at the extension point its own union documents; the
  WX1A assembler in place; the ONE explanation owner in place. Inherits the DEC1/OD1
  Decision Engine wholesale: 0 lines of suppression, ranking, budgeting, lifecycle,
  learning or delivery code written.

☑ Progressive enrichment where appropriate
  Every read is independently optional (Principle 3). No pantry → no pantry section and
  no cookable-now card. No household eaters → no fit line. No userId → exactly the
  pre-CBK2 assembly. One failing owner degrades ONE dimension, never the recipe.

☑ Knowledge domain compliance
  Introduces NO knowledge domain. Consumes five existing ones (Food, Nutrition,
  Household, Recipes, Learning). No new lifecycle invented.

☑ Honest gaps over fabricated information
  THE CENTRAL COMMITMENT OF CBK2 (§2). An unreadable owner is SILENT, never zero
  (asserted §2.1). An unidentifiable ingredient BLOCKS the cookable-now card rather than
  being skipped (asserted §4.6). An ungroundable explanation is a `gap`, never a
  cheerful sourceless sentence (asserted, meals-binding). No week-relative claim can be
  made where there is no week (asserted §1.3, mechanically, against 8 phrases).

☑ No permanent synchronisation bridge
  None. CBK2 reads owners at request time and writes nothing back.

☑ Evolution over replacement
  Nothing replaced. generateMealExplanation is byte-for-byte unchanged and its 124
  Planner assertions (PLAN1+PLAN2) still pass.
```

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform  — meals:explain reached via
                                              intelligencePlatform.handle(); cookbook
                                              opportunities via the food-intelligence
                                              `report` verb, already enrolled
✓ Uses the Capability Registry              — no new capability; live count stays 23.
                                              ONE existing capability gains ONE verb.
✓ Uses the Intent Engine                    — the Decision Engine's producer fetch, unchanged
✓ Reuses existing business services         — household-meal-matcher, restrictions, canonical
                                              resolver, plant-classifier, LEARN1 (via EL2's one
                                              door), pantry/meals owners. ZERO new services.
✓ Does not create another assistant         — no prompt, no model call, no LLM anywhere in CBK2
✓ Does not duplicate conversation state     — none touched. `meals` was ALREADY a
                                              ConversationSurface; no new surface created.
✓ Uses registered capabilities only         — meals (existing), food-intelligence (already a
                                              producer)
✓ Uses permission-aware access              — `explain` replicates the EXACT ownership gate the
                                              `detail` scope already enforces (meal.userId !==
                                              caller && !isSystemMeal → denied, message identical
                                              so a private id never leaks). Cookbook opportunities
                                              read getMeals(userId) — user-scoped by the owner.
                                              No client-supplied id reaches a port.
✓ Produces honest gaps rather than fabricated knowledge — see the checklist item above
```

```
----------------------------------------
EXPERIENCE & UI GOVERNANCE COMPLIANCE
----------------------------------------
✓ UX Governance Checklist (EXPERIENCE § 18, incl. Premium Standard § 17) — completed.
    Calm before capability: the ambient surface is COLLAPSED by default and no CBK2
    opportunity is `critical`, so none can force it open.
    One primary action: each card carries exactly one suggestedAction, and it is a
    SUGGESTION — CBK2 deletes, hides, edits and cooks nothing on a household's behalf.
    Progressive disclosure: reasoning renders inside the EXISTING Intelligence tab of the
    meal card, which the household opens deliberately. It is not pushed at them.
    Premium standard — the care is felt precisely where it is invisible: THA declining to
    tell a household a recipe is "cookable tonight" when it quietly failed to recognise one
    of the ingredients, and declining to score a recipe they already love.
✓ UI Governance Checklist (UI § 18) — completed. ZERO new visual patterns. Cards render
    through the existing FoodOpportunityCard on the existing AmbientIntelligence surface;
    reasoning renders in the existing CookbookMealIntelligenceStrip, in its existing type
    scale and iconography.
✓ Conflicts resolved in EXPERIENCE's favour — none arose.
✓ Nothing owns a fact/decision at the presentation layer — the strip computes NO coverage
    figure, ranks nothing, and writes no reason. Every sentence it renders is a string the
    server's ONE explanation owner authored and cited. `reasons` is derived from `evidence`
    server-side, so an unsourced reason is unrenderable, not merely discouraged.
✓ Any new visual pattern retired its predecessor — N/A, no new visual pattern.
```

```
----------------------------------------
PRODUCT REGISTRY COMPLIANCE
----------------------------------------
✓ Registry impact assessed — YES. "What is THA?" now answers differently: the Cookbook
    reasons about a recipe, and Apple can explain one.
✓ Every new surface has an entry — no new page, route, dialog, integration or setting was
    created. The affected capability entry is UPDATED (below).
✓ Every entry names a human owner — Colin Clapson (unchanged).
✓ Visibility declared deliberately — `household` (unchanged). Recipe reasoning is about a
    specific household's own pantry, eaters and history; it is meaningless without one.
✓ Visibility keys on ROLE, never tier — unchanged; CBK2 gates nothing on subscription.
✓ Registry labels; access.ts authorises — CBK2 reads no registry value at runtime.
✓ Permission filtering before composition — ownership is checked BEFORE the assembler is
    called. No explanation is built and then withheld.
✓ NO product knowledge in a prompt/template/fallback (Rule PKR27) — CBK2 contains no prompt
    and no model call of any kind.
✓ Predecessor entries retired — none replaced.
✓ New claims have a Marketing Message entry — CBK2 makes NO new marketing claim. It makes an
    EXISTING registry claim TRUE for the first time (§3).
✓ The report names every entry touched — below.
```

**Entries created:** NONE
**Entries updated:** `cap-meals` — now states that Apple explains *why* a recipe suits the household, raises cookable-tonight and no-longer-suits recipes, and explicitly that it does **not** score or rank a recipe the household already owns. `version` 1→2, `last_verified` → 2026-07-12. **Its pre-existing claim that Apple "can … explain" recipes became true with this change (§3).**
**Entries retired:** NONE

---

## 5. DOMAIN IMPACT DECLARATION

```
DOMAIN IMPACT
=============
Domain affected: Cookbook / Meals (SoT D12), reading Pantry (D8–11), Household (D16),
                 Planner history (D14), and LEARN1 household_learning_signals
Declared SoT: DB meals / meal_items (D12)
New store created? NO
Existing store extended? NO — no schema change, no migration, no column added
Consumer created? YES — two pure generators inside the existing FI4 engine; one pure
  explainer inside the existing explanation owner; two sections inside the existing
  WX1A assembler
  If YES: reads from declared SoT? YES — every read goes through an existing owner's
          port or composer. CBK2 opens no database connection of its own.
```

---

## 6. DATA IMPACT

- Reads existing data: **YES** — `meals`, `user_pantry_items`, `household_eaters`, `planner_entries`, `user_preferences`, LEARN1 signals
- Writes new data: **NO** — CBK2 writes nothing. (The Decision Engine's existing delivery-record insert is unchanged and is not CBK2's.)
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## 7. TRUST CHECK

**Could this mislead the user?** The sharpest risk in CBK2 is the one §2 exists to answer, and it is the risk of a *confident sentence about a week that does not exist*. It is closed by construction (the dimension union) and asserted mechanically against eight week-vocabulary phrases.

The second-sharpest is `cookbook-recipe-cookable-now`. Telling a household *"you have everything for this"* and being wrong sends them to the hob without an ingredient. CBK2 therefore refuses the card unless it could resolve **every** ingredient in the recipe — an unrecognised ingredient is a gap in THA's knowledge, **not** evidence the household owns it. This deliberately makes the card fire rarely (§10). Rare and right beats frequent and wrong.

**Could this fabricate certainty?** No. An unreadable owner is silent, never zero — a DB outage must never read as *"you have none of these ingredients"*. An ungroundable explanation is an honest `gap`, never a sourceless "great recipe!".

**Is anything guessed but shown as real?** No. Every reason is *derived from* cited evidence (Rule E1); the code path that would emit an unsourced reason does not exist.

**What happens if the system is wrong?** Nothing is deleted, hidden, edited, or cooked. Every card and every sentence is a suggestion or a description. CBK2 has no write path.

**The honest one — and it is a real one:** `cookbook-recipe-household-conflict` can be *right about the ingredient and wrong about the intent*. A household may have saved a chicken recipe deliberately — to cook for a guest, or to adapt later. This is why the card says *"Adapt it, or keep it as it is"* rather than *"this recipe is wrong for you"*, why it is `medium` and not `critical`, and why CBK2 does **not** delete, hide, or auto-adapt it. It is also why the card names the specific *ingredient* that caused the conflict: a household can dismiss it in one glance if they already knew.

**The second honest one:** a household with a large cookbook and a new restriction could see many conflict cards at once. They are bounded by the Decision Engine's attention budget (inherited, not re-implemented), are `medium` (so fully mutable — ATTN1 invariant A4), and are per-recipe dismissible with dismissal feeding the Decision→Evidence loop. But the *first* delivery after a household change could still be a lot at once. This is stated, not solved (§10).

- No architectural duplication introduced: **YES**
- No new source of truth created: **YES**
- No runtime behaviour altered for existing surfaces: **YES** — `generateMealExplanation` is unchanged and PLAN1/PLAN2's 124 assertions pass; `getMealIntelligence` without a `userId` returns exactly the pre-CBK2 assembly.

---

## 8. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Cookbook Intelligence (recipe reasoning, household fit, pantry-aware cooking)

Current Canonical Owner:
  Explanation         → server/lib/explainability-service.ts (the ONE explanation owner)
  Meal intelligence   → server/lib/meal-intelligence-assembler.ts (WX1A)
  Household fit       → server/lib/household-meal-matcher.ts
  Intelligence context→ server/lib/planner-explanation-context.ts (PLAN1/PLAN2)
  Opportunity delivery→ server/intelligence/opportunity-delivery/framework.ts (DEC1)
  Recipes             → DB meals / meal_items (SoT D12)

Current Runtime Consumer(s):
  Cookbook (/cookbook → meals-page.tsx) via AmbientIntelligence + the WX1A strip;
  the Companion via meals:explain and cookbook-opportunity notices — all through the
  ONE Decision Engine bundle and the ONE Intent Engine.

Duplicate Owners Remaining:
  1. planner-explanation-context.ts is now read by TWO domains (Planner, Cookbook) while
     still NAMED for one. This is a naming debt, not an ownership one — there is exactly
     one composer and both callers use it. Renaming it (and PlannerExplanationDimension /
     PlannerExplanationContext) to `household-*` would touch 5 files and ~40 references
     across PLAN1/PLAN2's test suites. DEC1's precedent governs: "location unchanged at
     designation; naming is governance, not churn." Flagged, deliberately deferred.
  2. `recommend` on meals is STILL answered by rankMealsByPreferences inline at the route
     layer (routes.ts:4965), not by a delegate-only owner method. PRE-DATES CBK2, untouched.

Duplicate State Remaining:
  NONE introduced. CBK2 has no store.

Duplicate Workflows Remaining:
  ONE, pre-existing and untouched: "which meal is better for this household" is answered by
  the Planner's scorer (canonical) and by rankMealsByPreferences at the route layer
  (ungoverned). CBK2 did NOT extend, call, or entrench the route-layer copy — and pointedly
  did not become a THIRD answer, which is what a cookbook score would have been (§2).

Current Convergence (%):
  ~75%. Evidence, counted: of the SIX surfaces that should mount ambient intelligence
  (Planner, Pantry, Shopping, Nutrition, Home, Cookbook), CBK2 brings the count from 5 to
  SIX — the Cookbook was the last silent one. Of the FIVE reasoning inputs a recipe
  explanation needs (household, pantry, learning, opportunities, season), the Cookbook now
  reads all five through their existing owners, versus zero before. The residue is the
  naming debt (1) and the route-layer ranker (2) above.

Target Convergence (%):
  100%

Next Planned Milestone:
  CBK3 — retire the route-layer meal ranker. Move rankMealsByPreferences behind a
  delegate-only owner method, bind `meals:recommend`, and delete the inline route logic.
  Explicitly deferred from CBK2 (it is a Planner/route concern, not a Cookbook one, and
  bundling it would have hidden a ranking change inside a reasoning change).

Remaining Architectural Risks:
  The naming debt (1) is a genuine comprehension hazard: a future engineer reading
  `buildPlannerExplanationContext` in the Cookbook's call stack will reasonably wonder
  whether the Cookbook has accidentally acquired a planner dependency. It has not — but
  nothing in the name says so, and only this document does.
```

---

## 9. CHANGES MADE

### Modified — server (8)

| File | Change |
|---|---|
| `server/lib/explainability-service.ts` | **The heart of CBK2.** Adds `generateRecipeExplanation` + `RecipeExplanation` / `RecipeExplanationDimension` (an `Extract<>` of the existing union — the week-relative dimensions are unreachable by construction). PURE. No score. `generateMealExplanation` is byte-for-byte unchanged. |
| `server/lib/meal-intelligence-assembler.ts` | Extends the WX1A owner IN PLACE with two sections: `pantry` (pantry-aware cooking) and `reasoning`. New optional 4th param `userId` — additive; every existing caller is unaffected and gets the pre-CBK2 assembly. |
| `server/intelligence/food-intelligence/opportunity-engine.ts` | 2 new types on the existing closed union; 2 new PURE generators (`identifyCookbookCookableNowOpportunities`, `identifyCookbookHouseholdConflictOpportunities`); `cookbook` added to the domain union and `meal` to the subject union; orchestrator reads the caller's own meals through the EXISTING meals read port. |
| `server/intelligence/opportunity-delivery/framework.ts` | ONE row: `DOMAIN_SURFACE.cookbook = "meals"` (an existing `ConversationSurface`). |
| `server/intelligence/conversation/notice-engine.ts` | ONE row in `DOMAIN_TO_CATEGORY` + one member on `NoticeCategory`. **Without this, every cookbook opportunity would be produced, delivered, budgeted, persisted and learned from — then SILENTLY DROPPED one step before the household could read it.** `phraseNotice` needed no change (`fact.kind` is `"opportunity"`, handled since COACH1). |
| `server/intelligence/handlers/meals-read-port.ts` | One method: `getMealReasoning(mealId, userId)` — a 1:1 forward to the WX1A assembler. No business logic. |
| `server/intelligence/handlers/meals-read-handler.ts` | Adds the `explain` verb: ownership gate (identical to `detail`, identical message — a private id never leaks), delegate, project. Contains no reasoning. |
| `server/intelligence/bindings/meals.ts` | `MEALS_EXECUTABLE_INTENTS` gains `"explain"` (§3). |

### Modified — client (3)

| File | Change |
|---|---|
| `client/src/pages/meals-page.tsx` | Mounts `AmbientIntelligence domains={["cookbook"]}` — the last major surface to get one. +2 lines of JSX and one import. |
| `client/src/components/CookbookMealIntelligenceStrip.tsx` | Renders the `pantry` and `reasoning` sections in the existing visual language. Computes nothing, ranks nothing, authors no sentence. |
| `client/src/components/intelligence/FoodOpportunityCard.tsx` | `DOMAIN_LABEL.cookbook = "Cookbook"`. |

### Modified — routes (1)

| File | Change |
|---|---|
| `server/routes.ts` | `/api/meals/:id/intelligence` now passes `req.user!.id` (the caller's OWN id) to the assembler, unlocking the two user-scoped sections. One argument. |

### Modified — tests (3)

| File | Change |
|---|---|
| `server/tests/test-intelligence-meals-binding.ts` | Mechanical: port fake gains `getMealReasoning`. **Substantive:** the two assertions encoding *"explain never executes because there is no stored rationale"* are **replaced** — not deleted — by stronger ones that guard what actually matters: `explain` on another user's recipe → **denied**; `explain` with nothing groundable → **honest gap**; `explain` **delegates** to the owner. `recommend`'s gap assertion is unchanged. |
| `server/tests/test-intelligence-registry-executability.ts` | Same premise correction, narrowed: `meals` now includes `explain`; still excludes `recommend`/`generate`. |
| `server/tests/test-intelligence-native-discovery.ts` | Mechanical: port fake gains `getMealReasoning`. No assertion changed. |

> **On changing three existing assertions.** They asserted a *premise* (`explain` is impossible without a stored column), not a *behaviour*. CBK2 disproves that premise (§3). Each was rewritten to keep guarding the thing that is still true and still matters — that THA must not fabricate a rationale — by asserting the honest-gap and ownership-denial paths instead. Nothing was weakened, and nothing was deleted to make a test pass.

### Created (2)

| File | Purpose |
|---|---|
| `server/tests/test-cbk2-intelligent-cookbook.ts` | **49 assertions.** §1 recipe reasoning, incl. **§1.3 the WEEK GUARD** — the explainer asserted clean against 8 week-vocabulary phrases, the check that stops a future edit from reintroducing the §2 fabrication. §2 honest gaps. §3 opportunity/learning cited verbatim. §4 pantry-aware cooking (incl. §4.6, the unidentifiable-ingredient refusal). §5 household-aware recipes. §6 the Decision Engine contract, incl. the silent-drop guard. |
| `docs/implementation/cookbook/CBK2_INTELLIGENT_COOKBOOK_EVOLUTION.md` | This report. |

### Updated — Product Knowledge Registry (1)

| File | Change |
|---|---|
| `docs/product/intelligence/intelligence-capabilities/cap-meals.md` | `version` 1→2, `last_verified` → 2026-07-12. States the reasoning, the two cookbook cards, and — explicitly — that Apple does **not** score a recipe the household already owns. |

### Deliberately NOT changed

- **`capability-registry.ts`** — no new capability; live count stays **23**, so no binding test's count assertion needed touching.
- **`OPPORTUNITY_SOURCES`** — `food-intelligence` was already enrolled. CBK2's enrolment cost was **zero lines**, which is the second independent confirmation (after SHOP1) that OD1's enrolment door is real.
- **`generateMealExplanation` / `SCORE_WEIGHTS` / `smart-suggest-service`** — the Planner is untouched.
- **`rankMealsByPreferences`** (route-layer ranker) — not extended, not called, not entrenched. See §8.
- **`planner-explanation-context.ts`** — reused verbatim, not renamed. See §8 risk (1).

---

## 10. VALIDATION PERFORMED

```
npx tsx server/tests/test-cbk2-intelligent-cookbook.ts            49 passed, 0 failed
npx tsx server/tests/test-shop1-intelligent-shopping.ts           34 passed, 0 failed
npx tsx server/tests/test-intelligence-food-opportunity-binding.ts 40 passed, 0 failed
npx tsx server/tests/test-intelligence-meals-binding.ts           75 passed, 0 failed
npx tsx server/tests/test-dec1-decision-engine.ts                 49 passed, 0 failed
npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts 60 passed, 0 failed
npx tsx server/tests/test-plan1-planner-intelligence.ts           58 passed, 0 failed
npx tsx server/tests/test-plan2-planner-evolution.ts              66 passed, 0 failed
npx tsx server/tests/test-intelligence-native-discovery.ts        81 passed, 0 failed
npx tsx server/tests/test-intelligence-registry-executability.ts 126 passed, 0 failed
npx tsx server/tests/test-intelligence-companion-actions.ts       62 passed, 0 failed
npx tsx server/tests/test-attn1-attention-platform.ts             29 passed, 0 failed
npx tsx server/tests/test-coach1-proactive-coaching.ts            72 passed, 0 failed
                                                                 ─────────────────────
                                                                 730 passed, 0 failed
```

`npx tsc --noEmit` — **168 errors before CBK2, 168 after; zero in any file CBK2 touched.** Proven by stashing the change, counting, and restoring. The change is typecheck-neutral. (The 168 are pre-existing and unrelated.)

The PLAN1 + PLAN2 suites (124 assertions) passing unchanged is the evidence that **the Planner's explanation behaviour is byte-for-byte unaltered** — CBK2 extended the explanation owner without disturbing its existing tenant.

**Delivery path verified end-to-end by inspection, link by link:**

*Opportunities:* `report` verb → `port.identifyOpportunities` → **CBK2's two generators** → `OPPORTUNITY_SOURCES["food-intelligence"]` *(already enrolled)* → `collectOpportunities` → `prioritiseAndGroup` → `grouped["cookbook"]` → `GET /api/intelligence/food-opportunities` → `use-food-opportunities` → `AmbientIntelligence domains={["cookbook"]}` (`meals-page.tsx`) → `FoodOpportunityCard` (`DOMAIN_LABEL.cookbook = "Cookbook"`).

*Reasoning:* `GET /api/meals/:id/intelligence` → `getMealIntelligence(…, userId)` → `assembleRecipeReasoning` → `buildPlannerExplanationContext` + `scoreCandidateCompatibility` → `generateRecipeExplanation` → `CookbookMealIntelligenceStrip`. And via the Companion: `intelligencePlatform.handle({capabilityId:"meals", verb:"explain"})` → ownership gate → `port.getMealReasoning` → the same assembler.

### ⚠️ Not performed — the honest state

**No live end-to-end run against a seeded household in a browser.** The generators and the explainer are pure and are covered by 49 unit assertions; the delivery path is covered by the existing OD1/DEC1 suites and verified by inspection. But **nobody has yet *watched* a CBK2 card appear on the Cookbook, or read a reasoning line on a real recipe.** The database-backed paths (`assembleRecipeReasoning`, `getMealReasoning`) are exercised only through in-memory fakes.

This is the same gap SHOP1 declared, and it is the single highest-value thing to do next.

---

## 11. DEFINITION OF DONE

**What success looks like:** a household opens `/cookbook` and finds, quietly, that THA now knows something about their recipes — that tonight's dinner is already in the cupboard; that the curry they saved last year no longer suits the vegetarian who moved in; and, opening any recipe's Intelligence tab, a short list of *why this suits us*, each line naming exactly where it came from, and not one of them a score.

**What must not break:** the Planner's explanations (PLAN1/PLAN2 — 124 assertions, passing); the `shopping-restriction-conflict` critical safety card (untouched, still the sole `critical` emitter); DEC1's golden-identity ordering; the existing WX1A strip sections.

**Manual test steps:**
1. Sign in as a household with eaters, a pantry, and saved recipes.
2. Add a household member with a hard restriction (e.g. vegetarian). Ensure a saved recipe contains meat.
3. Ensure one saved recipe's ingredients are ALL in the pantry (all must be canonically resolvable — e.g. tomato, onion, garlic).
4. Open `/cookbook` → expand *"Worth a look in your cookbook"*.
5. Expect: a `medium` conflict card naming the recipe **and the offending ingredient**, and a `low` "you have everything for X" card.
6. Open any recipe → Intelligence tab. Expect *"Why this suits you"* with cited lines, and a pantry line reading *"You have 2 of 5 — still need …"*.
7. **Confirm no line anywhere says "this week", "your week", "new plant", or "your plan"** — the Cookbook has no week.
8. Confirm no score, percentage, or mark-out-of-ten appears anywhere.

---

## 12. SCOPE LOCK

**Implemented:** household-aware recipes; nutrition-aware recipes; pantry-aware cooking; opportunity-aware recipes; recipe reasoning and explanations (incl. the `meals:explain` verb); contextual recipe guidance (the Cookbook's ambient surface).

**Explicitly excluded (NOT done):**
- Binding `meals:recommend` / retiring `rankMealsByPreferences` (**CBK3** — approved deferral, §8).
- Renaming `planner-explanation-context.ts` → `household-*` (naming debt, §8 risk 1).
- Any cook mode / step-through cooking surface (**none exists in the codebase at all** — greenfield, and far outside this scope).
- Reasoning on the **meal detail page** (`/meals/:id`, `meal-detail-page.tsx`) — see the coverage gap below.
- Reasoning for **system/library meals** in the opportunity generators (deliberate: a THA library recipe is not one this household chose to keep).
- Any schema change, any write path, any model call.

**Suggestions (observed, not implemented, do not action without approval):**

- **The canonical resolver is the binding constraint on pantry-aware cooking.** `cookbook-recipe-cookable-now` requires **every** ingredient in a recipe to resolve canonically (§7). Real recipes contain "1 tbsp olive oil", "a pinch of za'atar", "2 tbsp double cream". Any single unresolvable line silences the card. **This generator will therefore fire rarely in production** — correctly, but rarely. This is a *food-knowledge coverage* problem, not an engineering one, and growing canonical coverage (or teaching the resolver to ignore a curated set of pantry staples) is the single highest-leverage follow-up. It is deliberately NOT solved here, because the alternative — quietly skipping ingredients THA cannot read — is precisely the fabrication §7 refuses.
- **A large cookbook meeting a new restriction could produce many conflict cards at once** (§7). The attention budget bounds what is *delivered*, but the first delivery after a household change may still feel like a pile. A per-type cap, or a "N recipes in your cookbook no longer suit your household" roll-up card, would be the calmer answer.

### ⚠️ Coverage gap: reasoning does not reach `/meals/:id`

The Cookbook is served by **two** surfaces: the grid (`meals-page.tsx`, with an inline expansion carrying the Intelligence tab) and a **separate detail page** (`meal-detail-page.tsx`, route `/meals/:id`, 1,265 lines).

CBK2's reasoning renders in the **strip**, which the grid mounts. `meal-detail-page.tsx` does **not** mount `CookbookMealIntelligenceStrip`. **A household that navigates to a recipe's own page will not see the reasoning** — only those who expand it in the grid will.

This mirrors SHOP1's `/basket` gap exactly, and has the same shape: a domain served by two pages, of which only one carries the intelligence. It is a real, user-visible limit on reach. It was not fixed here because `meal-detail-page.tsx` is a large surface with its own composition (`MealTrustSummary`, `HouseholdAdaptationsSummary`, `SimplyBetterChoicesPanel`) and adding a third household-facing panel to it without first reconciling those is how surfaces become cluttered — an Experience Principle 6 question, not a CBK2 one. **Flagged, not silently assumed.**

---

## 13. REPOSITORY CONVENTIONS NOTE

This report materialises `docs/implementation/cookbook/` as an *implementation* folder. The path was explicitly requested and the folder already exists (holding the COOKBOOK2/COOKBOOK3 import records). It passes the mechanical gate (`repo-structure-verify.sh` enforces *no loose files*, not a folder allowlist), and there is live precedent in this tree (`docs/implementation/shopping/`, `health/`, `nutrition/`).

Per `REPOSITORY_CONVENTIONS.md` §4, *"adding one is a governance decision, not a filing convenience."* **Recommendation:** amend the §4 table to admit `cookbook/` alongside `shopping/` (which SHOP1 raised and which remains outstanding), so the vocabulary and the tree agree. Flagged, not silently assumed.
