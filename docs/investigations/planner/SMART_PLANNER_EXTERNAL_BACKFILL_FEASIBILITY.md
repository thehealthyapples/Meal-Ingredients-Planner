SMART PLANNER EXTERNAL BACKFILL FEASIBILITY: COMPLETE

---

**Rollback Identifier:** `rollback/before-external-backfill-investigation-2026-06-08` → commit `cea6e2b`
**Investigation Date:** 2026-06-08
**Risk Level:** GREEN — investigation only, no code or data changes
**Scope:** Determine whether THA already has the architecture to automatically fill dietary gaps when the local meal library is insufficient

---

## Files Reviewed

| File | Purpose |
|---|---|
| `server/lib/external-meal-service.ts` | External recipe search, ingredient enrichment, source implementations |
| `server/lib/smart-suggest-service.ts` | Smart Planner generation, dietary prefix, external candidate pipeline |
| `server/lib/auto-import-service.ts` | Permanent external recipe import to user meal library |
| `server/lib/recipe-scraper.ts` | Web scraping and JSON-LD extraction for ingredient data |
| `server/lib/meal-scoring-service.ts` | `scoreMeal()`, `convertMealToCandidate()`, `convertExternalToCandidate()` |
| `server/lib/planner-compliance.ts` | System-generated planner write gate |
| `server/lib/dietRules.ts` | `shouldExcludeRecipe()` — single dietary filtering source of truth |
| `server/lib/recipe-source-gate.ts` | Source enable/disable control, `recipeSourceSettings` DB table |
| `server/routes.ts` | Smart Planner route, pre-pool filter chain, auto-import endpoint |

---

## SECTION 1 — External Recipe Search Capability

### What exists today

`external-meal-service.ts` provides search functions for 9 sources:

**Always-on (no credentials required):**
| Source | Function | Type |
|---|---|---|
| TheMealDB | `searchMealDB()` | Official API (free) |
| BBC Good Food | `searchBBCGoodFoodEnhanced()` | Web scrape |
| AllRecipes | `searchAllRecipes()` | Web scrape |
| Jamie Oliver | `searchJamieOliver()` | Web scrape |
| Serious Eats | `searchSeriousEats()` | Web scrape |

**Credential-gated (require env vars):**
| Source | Function | Env Vars Required |
|---|---|---|
| Edamam | `searchEdamam()` | `EDAMAM_APP_ID`, `EDAMAM_APP_KEY` |
| API-Ninjas | `searchApiNinjas()` | `API_NINJAS_API_KEY` |
| BigOven | `searchBigOven()` | `BIGOVEN_API_KEY` |
| FatSecret | `searchFatSecret()` | `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET` |

All are aggregated by `fetchExternalCandidates()`, which deduplicates by normalised name.

### Dietary prefix support (per-diet feasibility)

`smart-suggest-service.ts` defines `DIETARY_SEARCH_PREFIXES` at line 73:

```typescript
const DIETARY_SEARCH_PREFIXES: [string, string][] = [
  ["Vegan", "vegan"],
  ["Vegetarian", "vegetarian"],
  ["Keto", "keto"],
  ["Paleo", "paleo"],
  ["Gluten-Free", "gluten-free"],
  ["Dairy-Free", "dairy-free"],
  ["Low-Carb", "low-carb"],
  ["Mediterranean", "mediterranean"],
];
```

`getDietarySearchPrefix()` maps user `dietTypes` to a prefix string, which is then prepended to every search query.

**DASH, MIND, Flexitarian, and Carnivore are intentionally omitted.** The code comment states: "candidate pools become too sparse and unreliable for those terms, so generic search is preferred." These profiles fall back to unprefixed generic search.

### Diet-by-diet search status

| Diet Profile | Search Prefix Supported | Evidence |
|---|---|---|
| Vegan | ✅ YES — prefix "vegan" | `DIETARY_SEARCH_PREFIXES` line 74 |
| Vegetarian | ✅ YES — prefix "vegetarian" | `DIETARY_SEARCH_PREFIXES` line 75 |
| Keto | ✅ YES — prefix "keto" | `DIETARY_SEARCH_PREFIXES` line 76 |
| Paleo | ✅ YES — prefix "paleo" | `DIETARY_SEARCH_PREFIXES` line 77 |
| Gluten-Free | ✅ YES — prefix "gluten-free" | `DIETARY_SEARCH_PREFIXES` line 78 |
| Dairy-Free | ✅ YES — prefix "dairy-free" | `DIETARY_SEARCH_PREFIXES` line 79 |
| Low-Carb / Atkins | ✅ YES — prefix "low-carb" | `DIETARY_SEARCH_PREFIXES` line 80 |
| Mediterranean | ✅ YES — prefix "mediterranean" | `DIETARY_SEARCH_PREFIXES` line 81 |
| DASH | ❌ NO — intentionally omitted | Comment on line 71–72 |
| MIND | ❌ NO — intentionally omitted | Comment on line 71–72 |
| Flexitarian | ❌ NO — intentionally omitted | Comment on line 71–72 |
| Carnivore | ❌ NO — intentionally omitted | Comment on line 71–72 |

### Critical limitation: queries are not slot-aware

When `getDietarySearchPrefix()` returns "keto", `fetchExternalCandidates` is called with:

```typescript
const rawExternalCandidates = await fetchExternalCandidates({
  cuisine: settings.preferredCuisine,
  query: settings.preferredCuisine || undefined,
  dietaryPrefix,                              // e.g. "keto"
});
```

The queries built in `searchMealDB()`:
```
"keto chicken", "keto pasta", "keto salad", "keto curry", "keto soup"
```

These are generic cuisine-driven queries, not slot-targeted. No query contains "breakfast". The returned results are overwhelmingly lunch/dinner meals. A Keto breakfast gap is not addressable by the current search design.

### The `category` parameter — accepted but unused in query construction

`fetchExternalCandidates` accepts a `category?: string` parameter. `searchMealDB` also accepts it. However, **`category` is never used in query construction** in any of the 5 default search functions. It is dead parameter state. Passing `category: "breakfast"` would have no effect on which recipes are returned.

---

## SECTION 2 — Import Pipeline

### Transient candidate path (current Smart Planner behaviour)

External candidates are fetched and used per-generation — they are NEVER persisted to the `meals` table automatically. The pipeline is:

```
fetchExternalCandidates()                    ← search 5 sources with dietaryPrefix
        ↓
enrichExternalCandidates()                   ← scrape detail pages for ingredients (JSON-LD + DOM)
        ↓ (candidates without ingredients are DROPPED)
convertExternalToCandidate()                 ← isExternal=true, id=externalId string
        ↓
isHardExcluded() / isDietExcluded()          ← same filters as user meals
        ↓
scoreMeal()                                  ← same scoring function as user meals
        ↓
allCandidates[]                              ← competes with user meals for each slot
        ↓
(generation ends — all candidates discarded) ← no persistence to meals table
```

External candidates are transient. If the same external recipe is selected in two separate Smart Planner generations, it is fetched and scored twice from scratch.

### Permanent import path (manual, separate endpoint)

`auto-import-service.ts` exports `autoImportExternalMeal()`. This:
1. Checks for existing meal with same name or sourceUrl (deduplication)
2. Scrapes the detail page if ingredients are missing
3. Calls `storage.createMeal()` with `mealSourceType: "scratch"`
4. Creates a `mealTemplate` record and links it

Called from `POST /api/smart-suggest/auto-import` in routes.ts (line 4987). This is a **user-triggered manual endpoint**, not invoked by Smart Planner generation.

### Can imported recipes become Smart Planner candidates?

**YES — once imported permanently**, a meal created by `autoImportExternalMeal()` has `mealSourceType='scratch'` and enters `getMeals(userId)`. It passes all Smart Planner pre-pool filters the same as any user-created meal.

**The gap:** There is no code path that says "this slot is empty — auto-import a compliant external recipe and use it here." The backfill must be triggered manually.

---

## SECTION 3 — Dietary Safety

### Filter chain applied to external candidates

The `generateSmartSuggestion()` function applies these filters to ALL external candidates after `enrichExternalCandidates()`:

| Filter | Applied to External Candidates | Code location |
|---|---|---|
| Alcohol/drink exclusion | ✅ YES | Lines 439–447, smart-suggest-service.ts |
| Household hard restrictions | ✅ YES | Lines 449–452, smart-suggest-service.ts |
| Ingredient presence gate | ✅ YES | Lines 457–460 (drops if ingredients=[]) |
| Profile dietary filter (dietRules) | ✅ YES | Lines 462–467, delegates to `shouldExcludeRecipe()` |
| Premium marker filter | ⚠️ Partial — only for user meals | Lines 362–369 (user meals only) |
| Component filter (`kind='component'`) | ⚠️ Not applicable | Applied in routes.ts to userMeals only before service call |
| planner-compliance gate | ⚠️ Not on this path | That gate covers template writes, not Smart Planner generation |

### Would a newly sourced Keto breakfast be protected by the same compliance system?

**YES, for the filters that matter most.** An external "Keto Scrambled Eggs" would pass through:
- Ingredient verification (must have real ingredients from enrichment)
- `candidateDietExcluded()` → `dietRules.shouldExcludeRecipe()` → would check for bread, pasta, rice, sugar, potato keywords in ingredients
- Household hard restriction check

The external candidate would be treated identically to a user meal for dietary compliance. A Keto-incompatible recipe found via the "keto" search prefix (e.g., containing "toast") would still be excluded by the dietRules engine.

**Important nuance:** The component filter does not apply to external candidates. An external "Tomato Sauce Base" would not be caught by `kind='component'` — that classification only exists for user meals. However, external candidates would typically be returned as recipe results, not condiments.

---

## SECTION 4 — Candidate Scoring

### Do external candidates use the same scoring?

**YES.** Both user meals and external candidates are passed to the same `scoreMeal()` function in `meal-scoring-service.ts`. The scoring parameters are identical:

| Dimension | Weight | Applied to External |
|---|---|---|
| Diet match | 22 pts | ✅ Same keywords |
| Goal alignment | 13 pts | ✅ Same keywords |
| Budget alignment | 13 pts | ✅ (cost estimated from ingredient count) |
| UPF score | 13 pts | ✅ (UPF estimated from keywords) |
| Variety score | 13 pts | ✅ (usedProteins tracking) |
| Overlap score | 8 pts | ✅ (ingredient reuse across week) |
| Cuisine bonus | 5 pts | ✅ (if cuisine matches preference) |
| Simplicity bonus | 13 pts | ✅ (ingredient count) |

### Asymmetry between user meals and external candidates

| Property | User Meals | External Candidates |
|---|---|---|
| `estimatedCost` | `null` (defaults to 5.0 in scoring) | Set by `estimateCost()` = 1.50 + (0.35 × ingredient count) |
| `estimatedUPFScore` | `null` (0 in scoring) | Set by `estimateUPFScore()` |
| `isExternal` | `false` | `true` |
| `dietTypes` array | `[]` (empty by default) | Detected by `detectDietTypes()` |
| Cost source | Unknown / null | Formula-estimated |

**Practical implication:** External candidates from TheMealDB with 10 ingredients would have `estimatedCost ≈ £5.00`. A user meal with 10 ingredients defaults to £5.00 in scoring. The cost scoring is roughly equivalent. Budget alignment scores similarly for both.

The `isExternal` flag is tracked in stats (`result.stats.externalMeals`) but does not affect scoring or selection.

---

## SECTION 5 — Backfill Feasibility by Diet Profile

The key question: if the local pool is exhausted for a slot, can THA theoretically source compliant recipes today?

| Diet Profile | External Search Prefix | Current Breakfast Gap Coverage | Status |
|---|---|---|---|
| Vegan | "vegan" | PARTIAL — queries are not breakfast-targeted; few vegan breakfast recipes emerge from "vegan chicken/pasta/salad/curry/soup" | **PARTIAL** |
| Vegetarian | "vegetarian" | PARTIAL — same query gap; "vegetarian breakfast" not in query set | **PARTIAL** |
| Keto | "keto" | PARTIAL — "keto breakfast" not queried; 0 keto breakfast external candidates expected from current queries | **PARTIAL** |
| Paleo | "paleo" | PARTIAL — same query gap | **PARTIAL** |
| Gluten-Free | "gluten-free" | PARTIAL — same query gap | **PARTIAL** |
| Dairy-Free | "dairy-free" | PARTIAL — same query gap | **PARTIAL** |
| Low-Carb / Atkins | "low-carb" | PARTIAL — same query gap | **PARTIAL** |
| Mediterranean | "mediterranean" | PARTIAL — same query gap | **PARTIAL** |
| DASH | none (generic) | NO prefix; no dietary filtering | **NO** |
| MIND | none (generic) | NO prefix; no dietary filtering | **NO** |
| Flexitarian | none (generic) | NO prefix; no dietary filtering | **NO** |
| Carnivore | none (generic) | NO prefix; no dietary filtering | **NO** |

**Why PARTIAL and not YES for the 8 supported diets:**

The current external candidate pipeline runs one fixed query set (`["keto chicken", "keto pasta", "keto salad", "keto curry", "keto soup"]`) for every Smart Planner generation regardless of which slots are empty. The system has no concept of "breakfast pool is empty — search for breakfast specifically."

`inferCategoryFromCuisineAndName()` would correctly assign `category: "breakfast"` to any result whose name includes "breakfast", "pancake", "omelette", "porridge", "granola", or "smoothie" — but these terms only appear in recipe names when a breakfast recipe is explicitly returned. The current queries don't ask for breakfast recipes.

If queries included "keto breakfast" or "keto eggs" or "vegan breakfast oats", TheMealDB and scraping sources would return breakfast-tagged results that `inferCategoryFromCuisineAndName` would correctly classify and the breakfast slot would be filled. This is a query-set gap, not an architectural impossibility.

---

## SECTION 6 — Repeat Strategy

### Current state: repeats are globally blocked

```typescript
// smart-suggest-service.ts line 477
const usedIds = new Set<string | number>();
```

The `usedIds` Set is initialised once per `generateSmartSuggestion()` call. It is never reset. The check:

```typescript
allCandidates.filter(c => {
  if (usedIds.has(c.id)) return false;
  ...
})
```

applies to every slot across all 7 days. A meal used on Monday breakfast cannot appear again on Tuesday breakfast. This is unconditional — there is no flag to relax it.

### Could Smart Planner safely support three identical breakfasts?

**No — not without code change.** There is no repeat-tolerance mechanism today.

### The `includeLeftovers` flag — declared but dead

`SmartSuggestSettings.includeLeftovers?: boolean` is declared at line 18. The route parses it:

```typescript
includeLeftovers: body.includeLeftovers === true,
```

But `generateSmartSuggestion()` never reads `settings.includeLeftovers`. The flag is dead. No repeat or leftover logic exists downstream of the declaration.

### What code change would be required for controlled repeats?

Minimal: add a flag `allowRepeatsForThinSlots?: boolean` to `SmartSuggestSettings`, and modify `getSafeFallbackCandidates()` to relax the `usedIds` check when the pool would otherwise be empty. The existing per-generation scope of `usedIds` is correct for preventing same-meal-twice-on-same-week — relaxing it for thin-library fallback is a targeted change.

### Repeat feasibility vs. external backfill

| Approach | Code change required | Risk | Latency impact | Correctness |
|---|---|---|---|---|
| Controlled repeats | ~10 lines in `getSafeFallbackCandidates()` | Very low — no new external calls, no new data | None | Meal shown is known-compliant (already passed all filters on first use) |
| External backfill | Slot-aware query generation + category-targeted search call | Medium — new network calls, new query paths, new failure modes | Adds 2–8s per Smart Planner generation for thin slots | Meal must re-pass enrichment + dietary filter |

---

## SECTION 7 — Household Operations Alignment

### Batch cooking and ingredient reuse

The `overlapScore` dimension in `scoreMeal()` already rewards meals that share ingredients with meals already selected in the week. This is a partial proxy for batch cooking benefit: meals with overlapping ingredients score higher.

**Gap:** The system has no concept of "cooked once, used twice" — it can select a Chicken Curry on Monday and Chicken Stir-Fry on Wednesday (sharing chicken), but it cannot plan "cook chicken in bulk Monday, use leftovers Tuesday."

### Leftovers

No leftovers support exists in the Smart Planner. `includeLeftovers` is dead code (see Section 6). No planner slot is ever filled from a prior meal's leftover prediction.

### Freezer meals

The `freezerMeals` table exists in the schema (6 rows in production) but is not connected to the Smart Planner candidate pipeline. Freezer meals are never added to `allCandidates`.

### Controlled repeats as a household proxy

A household that batch-cooks might want Monday's breakfast (e.g., overnight oats) to appear on Tuesday and Wednesday as well. Controlled repeats with a `maxRepeatsPerMeal` cap would support this use case without requiring freezer or leftover architecture. This is the lowest-friction path to household batch-cooking alignment given the current architecture.

---

## SECTION 8 — Gap Analysis

### Current state flow

```
Local library
  ↓ (source filter, component filter, dietary filter)
Slot candidates
  ↓ (if 0)
Fallback candidates (non-breakfast meals for non-breakfast slots)
  ↓ (if 0)
Empty slot ← no further recovery
```

External candidates are mixed INTO `allCandidates` alongside user meals before slot assignment begins — they are not a backfill step. If a keto breakfast external candidate appears in `allCandidates`, it competes normally. The problem is that none currently do, due to the query design.

### Potential future state flow

```
Local library
  ↓ (source filter, component filter, dietary filter)
Slot candidates
  ↓ (if 0 — known-thin slot)
Controlled repeat (same meal, already compliant)
  ↓ (if repeat limit reached or pool has only 1 meal)
Slot-targeted external search ("keto breakfast" queries)
  ↓ (enrich + dietary filter)
External candidates for that slot
  ↓ (if still 0)
Empty slot warning
```

### Which parts already exist

| Component | Exists Today | Evidence |
|---|---|---|
| External recipe search (5 sources) | ✅ YES | `fetchExternalCandidates()` |
| Dietary prefix on external search | ✅ YES | `getDietarySearchPrefix()` + prefix map |
| Ingredient extraction (JSON-LD + DOM scrape) | ✅ YES | `enrichExternalCandidates()` + `scrapeRecipeFromUrl()` |
| Dietary validation on external candidates | ✅ YES | `candidateDietExcluded()` in service pipeline |
| Premium filtering | ✅ YES (user meals) / ⚠️ PARTIAL (external) | Lines 362–369 vs 432–468 |
| Component filtering | ✅ YES (user meals) / ⚠️ N/A (external) | routes.ts pre-pool gate |
| Candidate scoring (external) | ✅ YES | `scoreMeal()` + `convertExternalToCandidate()` |
| Smart Planner external candidate use | ✅ YES | `allCandidates` in `generateSmartSuggestion()` |
| Source enable/disable control | ✅ YES | `recipe-source-gate.ts` + `recipeSourceSettings` table |
| Permanent import to user library | ✅ YES (manual) | `autoImportExternalMeal()` + `/api/smart-suggest/auto-import` |
| Controlled repeat support | ❌ NO | `usedIds` is unconditional |
| Slot-targeted external search | ❌ NO | `category` param exists but unused in queries |
| Slot-aware backfill trigger | ❌ NO | External search is single fixed call, not gap-response |
| Freezer meal candidates | ❌ NO | `freezerMeals` table not fed into planner pool |
| Leftover meal support | ❌ NO | `includeLeftovers` flag declared, never read |

---

## CAPABILITY MATRIX

| Capability | Exists Today | Evidence | Status |
|---|---|---|---|
| External recipe search | YES | `fetchExternalCandidates()` in `external-meal-service.ts` | PASS |
| Recipe import (manual) | YES | `autoImportExternalMeal()` in `auto-import-service.ts` | PASS |
| Ingredient extraction | YES | `enrichExternalCandidates()` + `scrapeRecipeFromUrl()` | PASS |
| Dietary validation | YES | `shouldExcludeRecipe()` via `candidateDietExcluded()` | PASS |
| Premium filtering | PARTIAL | User meals only; external candidates not checked | PARTIAL |
| Component filtering | PARTIAL | User meals only; external have no `kind` field | PARTIAL |
| Candidate scoring | YES | Same `scoreMeal()` for user and external | PASS |
| Smart Planner external candidate use | YES | `allCandidates[]` in `generateSmartSuggestion()` | PASS |
| Repeat support | NO | `usedIds` unconditional; `includeLeftovers` dead | FAIL |
| Slot-targeted backfill | NO | `category` param unused; no thin-slot detection | FAIL |
| Automatic breakfast backfill | NO | Queries don't include breakfast terms | FAIL |

---

## MANDATORY FINDINGS

**1. Can THA already source external compliant meals?**

YES. `fetchExternalCandidates()` runs on every Smart Planner generation. For Vegan and Keto users, it prepends "vegan"/"keto" to search queries. Results are enriched with real ingredients and filtered by `shouldExcludeRecipe()`. The external pipeline is live and active.

**2. Can THA already import them automatically?**

NO. The `autoImportExternalMeal()` function exists and works, but it is only triggered by the manual `POST /api/smart-suggest/auto-import` endpoint. Smart Planner generation uses external candidates transiently — it does not persist them to the user's meal library.

**3. Can THA already score them?**

YES. External candidates pass through `scoreMeal()` identically to user meals. The `isExternal` flag is recorded in stats but does not affect scoring.

**4. Can THA already use them in Smart Planner?**

YES — for dinner and lunch slots. External candidates are already added to `allCandidates` in `generateSmartSuggestion()` and compete for any slot where they have the correct category. However, because search queries don't include breakfast terms, external breakfast candidates for Keto/Vegan are rarely or never returned.

**5. Is repeat support easier than external backfill?**

YES, significantly. Controlled repeat support requires modifying approximately 10 lines in `getSafeFallbackCandidates()` to relax the `usedIds` check when the pool is genuinely exhausted and repeats are below a configurable cap. External backfill requires: slot-aware thin-pool detection, category-targeted query construction, a second round-trip to external sources, additional enrichment latency, and handling of new failure modes (external service unavailability). Repeat support has no network dependency and uses meals already verified as compliant.

**6. Which approach is lower risk?**

Controlled repeats. The meal is already in the user's library, already passed all filters, and is a known quantity. The only change is relaxing the uniqueness constraint when the pool is exhausted. External backfill introduces external network calls on the critical path of plan generation, with scraping fragility, timing sensitivity, and new test surface.

**7. What is the smallest safe improvement?**

Add controlled repeat support as a fallback-of-last-resort. Specifically:

When `getSafeFallbackCandidates()` returns 0 for a slot AND a `allowRepeatsForThinSlots` flag is true, remove the `usedIds.has(c.id)` check for that slot only. Cap repeats per meal at a configurable maximum (e.g., 3 per week). This:
- Fills Keto breakfast slots 3–7 with Omelet or easy omelet rather than leaving them empty
- Fills Vegan breakfast slots 1–7 with whatever vegan breakfast meals exist (currently 0, but once added, repeats would be allowed)
- Requires no new external calls
- Requires no schema changes
- Requires no data changes
- Total code change: ~15 lines in `smart-suggest-service.ts`

**8. What is the strategic long-term solution?**

A slot-aware external backfill that:
1. Detects which slots are below a minimum viable pool size after dietary filtering
2. For those slots, issues targeted queries combining diet prefix + slot name (e.g., "keto breakfast", "vegan breakfast oats")
3. Enriches and validates resulting candidates against the same dietary pipeline
4. Feeds validated candidates directly into that slot's candidate set for that generation
5. Optionally persists high-scoring external candidates to the user's library to build it over time

This requires: thin-pool detection logic, slot-category-to-query-term mapping, a second async `fetchExternalCandidates` call scoped to the thin slots, and stable breakfast query term lists per diet. It would permanently solve the structural library thinness problem rather than working around it.

---

## RECOMMENDED NEXT DECISION

**Do not implement external backfill as the first step.** The architecture is close but the query gap is the blocker — the `category` parameter accepted by `fetchExternalCandidates` is dead code in all 5 search functions, so slot-targeted search would require changes to 5 independent search functions plus the call site. That is a medium-risk AMBER change.

**Implement controlled repeats first (GREEN risk).** Relaxing `usedIds` for genuinely exhausted slots is a one-function change, provably safe, and immediately resolves the visible "empty breakfast" problem for Keto. It is the right decision today even if external backfill is the right decision in 3 months.

**Sequence of smallest safe improvements:**

| Step | What | Risk | Impact |
|---|---|---|---|
| 1 | Add `allowRepeatsForThinSlots` flag + relax `usedIds` in `getSafeFallbackCandidates()` | GREEN | Keto breakfast 2→7 slots filled |
| 2 | Classify meal 2215 (Quick pizza dough) as `kind='component'` | GREEN | Removes last uncategorised dough from dinner slot |
| 3 | Assign categories to 12 null-category user meals | GREEN | Reduces lunch/dinner pool cross-contamination |
| 4 | Add vegan/keto breakfast recipes to local library | GREEN | Fills breakfast pool structurally |
| 5 | Implement slot-targeted external search for thin slots | AMBER | Permanent architecture for any diet combination |

---

## SCOPE COMPLIANCE DECLARATION

This investigation was GREEN risk. No code, schema, or data was changed.

| Check | Answer |
|---|---|
| Code changed | No |
| Schema changed | No |
| Data changed | No |
| External searches executed | No |
| New recipes imported | No |
| Smart Planner modified | No |
| dietRules modified | No |
