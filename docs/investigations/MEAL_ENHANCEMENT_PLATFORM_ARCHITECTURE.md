# Meal Enhancement Platform Architecture

**Date:** 2026-06-10
**Rollback tag:** `rollback/meal-enhancement-platform-investigation-20260610-164027`
**Rollback commit:** `1e83f32`
**Status:** Investigation only — no implementation

---

## Context

THA's nutrition direction is "What can we add?" rather than "What is missing?".

The Meal Enhancement system is expected to become the long-term enhancement platform for helping households build toward 30 different plants a week, starting from the minimum of 5 a day.

Enhancements should:
- Fit the meal
- Fit the household
- Improve nutrition
- Be practical
- Minimise waste
- Minimise unnecessary spending

---

## 1. Existing Architecture

### Two Systems Currently in Production

There are two separate enhancement systems. Understanding the distinction is essential.

---

#### System 1 — NutritionBoostPanel (Static, Display-Only)

**Files:**
- `client/src/lib/nutrition-boosts.ts`
- `client/src/components/NutritionBoostPanel.tsx`

**What it does:**
- Hard-coded library of 26 ingredients across 8 categories: legumes, seeds, nuts, herbs, mushrooms, fermented, healthy-fats, extra-veg
- 15 meal-type keyword mappings (breakfast, pasta, curry, salad, soup, etc.) plus a 3-item fallback list
- Filters out ingredients already present in the meal
- Filters by household hard restrictions (`computeRestrictionSafety`) and diet patterns (`shouldExcludeRecipe`)
- Renders up to 3 suggestions as read-only text chips

**What it does NOT do:**
- No user interaction — no "Add to meal" button
- No DB writes — no persistence
- No shopping list integration
- No priority ranking
- No weekly or pantry awareness

**Verdict:** This is the older, simpler surface. THA should plan to deprecate it once System 2 covers the same cases with interaction.

---

#### System 2 — MealUpliftPanel (Interactive, DB-Backed)

**Files:**
- `server/lib/uplift-types.ts` — type definitions
- `server/lib/uplift-rules.ts` — human-authored rule registry (42 rule definitions, all reviewed)
- `server/lib/uplift-engine.ts` — deterministic matching engine with reverse index
- `server/lib/uplift-persistence.ts` — ingredient merge, deduplication, fork logic
- `client/src/components/MealUpliftPanel.tsx` — interactive panel component
- **Routes:** `POST /api/uplift/batch`, `POST /api/uplift/accept`, `DELETE /api/uplift/applications/:id`, `GET /api/meals/:mealId/uplift-applications`
- **Table:** `meal_uplift_applications`

**What it does:**
- Rule-based deterministic matching — no AI, sub-30ms for full weekly planner batch
- Approval gate: rules without `reviewedAt` are excluded from matching
- Diet exclusion: rules fire only for compatible diet types
- Slot exclusion: rules can be restricted to breakfast/lunch/dinner/snack
- Interactive: user can add a suggestion to the meal, see it persist, and remove it
- System meal fork: if the meal is a system meal, a user-private copy is created before mutation
- Shopping integration: flows automatically — no extra plumbing required
- Provenance: every accepted suggestion is recorded in `meal_uplift_applications` with ruleId, ingredient, action, quantity, explanation, status

**Verdict:** This is the future platform. Everything THA builds next should extend System 2, not System 1.

---

## 2. Available Signals

### 2.1 Ingredients Already Used This Week

| Attribute | Value |
|-----------|-------|
| Location | `/api/planner/full` → weeks → days → entries → `mealId` → meals table `.ingredients[]` |
| Availability | Fully available at uplift batch time |
| Current usage | Not passed to uplift engine |
| Can be reused | Yes — pass to `UpliftContext` as `weeklyIngredients?: string[]` |

The weekly planner page already assembles `upliftBatchMeals` from `fullPlanner` and `meals` cache (`weekly-planner-page.tsx:600-620`). All meal ingredients for the active week are available client-side at this point. Server-side, the batch route can also query planner entries + associated meal ingredients by `userId`.

---

### 2.2 Ingredients Already Planned This Week

Same as 2.1. The full planned week is available from `/api/planner/full`. This data is already held in `fullPlanner` on the client at the time the uplift batch is called.

---

### 2.3 Ingredients on the Shopping List

| Attribute | Value |
|-----------|-------|
| Location | `shopping_list` table — `productName`, `normalizedName` per row |
| Availability | Available via `GET /api/shopping-list` |
| Current usage | Not passed to uplift engine |
| Can be reused | Yes — query by `userId` at uplift batch time |

The shopping list holds all items currently queued for purchase. Suggesting an ingredient already on the list would be a useful P2-equivalent signal (already committed to buying it this week).

---

### 2.4 Pantry Inventory

| Attribute | Value |
|-----------|-------|
| Location | `user_pantry_items` table — `ingredientKey`, `displayName`, `category`, `defaultHave` |
| Availability | Available via `GET /api/pantry` — already seeded with defaults |
| Current usage | Not passed to uplift engine |
| Can be reused | Yes — one DB query at uplift batch time |

The `defaultHave` flag indicates whether the user normally keeps this item at home. This is the strongest pantry signal for enhancement ranking.

---

### 2.5 Cookbook Ingredient History

| Attribute | Value |
|-----------|-------|
| Location | `meals` table — `ingredients[]` per meal, filtered by `userId` |
| Availability | Available via `GET /api/meals` |
| Current usage | Not passed to uplift engine |
| Can be reused | Yes, but lower priority than weekly/pantry signals |

Cookbook history is a longer-term preference signal. It indicates what ingredients the user has used before in their own recipes, which implies familiarity and likely availability.

---

### 2.6 Household Restrictions

| Attribute | Value |
|-----------|-------|
| Location | `household_eaters` table — `hardRestrictions[]` per eater |
| Availability | Available via `GET /api/household/eaters` |
| Current usage | **Already wired** — filtered in `/api/uplift/batch` route (`routes.ts:9789`) |
| Status | Complete — no gap |

---

### 2.7 Household Diet Patterns

| Attribute | Value |
|-----------|-------|
| Location | `household_eaters` table — `defaultDietTypes[]` per eater |
| Availability | Available via `GET /api/household/eaters` |
| Current usage | **Already wired** — `UpliftContext.dietTypes`, `isDietExcluded()` in engine |
| Status | Complete — no gap |

---

### 2.8 Existing Ingredient Classifications

| Source | Location | Availability |
|--------|----------|--------------|
| `INGREDIENT_TAXONOMY` | `shared/ingredient-taxonomy.ts` | Shared client+server, ~50 items, exact key lookup |
| `INGREDIENT_CATALOGUE` | `client/src/lib/ingredient-catalogue.ts` | Client-side, ~30 items, alias-aware lookup |
| `ingredientClassifications` table | DB | Server-only, AI+manual, `reviewStatus` lifecycle |
| `PANTRY_KNOWLEDGE` | `client/src/lib/pantry-knowledge.ts` | Client-side, ~40 ingredients, supports/highlights/tags |
| `pantryIngredientKnowledge` table | DB | Server-only, DB mirror with enrichment lifecycle |

All classification systems are currently siloed. The uplift engine uses none of them during matching — it relies on hard-coded rule triggers.

---

### 2.9 Existing Measurements and Units

| Source | Location | Purpose |
|--------|----------|---------|
| `COMMON_UNITS` | `ingredient-input.tsx` | UI dropdown: g, kg, ml, l, tbsp, tsp, cup, oz, lb, pinch, dash, slice, piece, breast, fillet, clove, handful, bunch, serving, tin, can, pack, jar, bottle, tub, sachet, carton |
| `INGREDIENT_QUANTITY_UNIT_ALTERNATIVES` | `shared/ingredient-units.ts` | Parser token recognition |
| `UNIT_CONVERSIONS` | `server/lib/ingredient-utils.ts` | Server-side quantity normalisation |
| `COUNTABLE_WORDS` | `server/lib/ingredient-utils.ts` | Shopping aggregation |
| Uplift `quantity?: string` | `uplift-types.ts` | Plain-text per-suggestion (e.g. "½ tsp", "a handful", "3 tbsp") |

Uplift suggestions already carry a plain-text `quantity` string. These are authored directly in each rule. No measurement system plumbing is required.

---

## 3. Reusable Components

| Component | File | Reuse Potential |
|-----------|------|----------------|
| `mergeUpliftIngredients()` | `uplift-persistence.ts` | Handles deduplication for all ingredient adds |
| `removeUpliftIngredient()` | `uplift-persistence.ts` | Reversible — applies to all enhancement removes |
| `normaliseIngredientForDedupe()` | `uplift-persistence.ts` | Normalises ingredient strings for comparison |
| `ingredientAlreadyPresent()` | `uplift-persistence.ts` | Checks ingredient presence before adding |
| `buildRuleIndex()` | `uplift-engine.ts` | Efficient reverse index over rules |
| `matchUpliftRules()` | `uplift-engine.ts` | Core matching function |
| `batchMatchUplift()` | `uplift-engine.ts` | Batch processing for full planner |
| `PANTRY_KNOWLEDGE` | `pantry-knowledge.ts` | Nutritional benefit text per ingredient |
| `getMealNutrients()` | `nutrition-insights.ts` | NutrientTag detection from ingredient list |
| `computeMealVariety()` | `nutrition-variety.ts` | Plant variety scoring (fruits/veg/whole grains/herbs) |
| `computeRestrictionSafety()` | Restrictions module | Hard restriction filtering (already in System 1 + uplift batch route) |
| `shouldExcludeRecipe()` | `dietRules.ts` | Diet pattern filtering (already in System 1 + uplift batch route) |

---

## 4. Add-To-Meal Reuse Analysis

### How the Uplift Accept Path Works

1. User taps "Add to meal" on a suggestion in `MealUpliftPanel`
2. `acceptMutation` fires: `POST /api/uplift/accept` with `{ mealId, plannerEntryId, suggestions[] }`
3. Server calls `mergeUpliftIngredients(meal.ingredients, [candidate])` — deduplication safe
4. If `meal.isSystemMeal`, server forks meal to user-private copy and updates planner entry reference
5. Server writes updated `meal.ingredients` to DB
6. Server inserts row into `meal_uplift_applications` (provenance)
7. Client invalidates `["/api/meals"]` and all shopping list query keys
8. Shopping list regeneration now includes the new ingredient automatically

### Enhancement Engine Reuse

The same `/api/uplift/accept` path can serve Meal Enhancements without any changes:
- Enhancements are a specific flavour of uplift suggestions
- The accept/remove lifecycle is already implemented
- The fork behaviour for system meals is already handled
- The deduplication logic is already robust

**Conclusion: The add-to-meal capability is fully reusable at zero extra cost.**

---

## 5. Measurement Reuse Analysis

Every `UpliftSuggestion` has an optional `quantity?: string` field (plain text).

Current examples from `uplift-rules.ts`:
- `"½ tsp"` (turmeric)
- `"a pinch"` (black pepper)
- `"a handful"` (frozen peas, spinach)
- `"1 tbsp"` (mixed seeds, olive oil, apple cider vinegar)
- `"3 tbsp"` (red lentils)
- `"half a tin"` (cannellini beans)

These strings are:
1. Stored in `meal_uplift_applications.quantity`
2. Displayed in the UI: `suggestion.ingredient — {suggestion.quantity}` in `MealUpliftPanel`
3. Appended to `meal.ingredients` as a combined string when accepted: the ingredient name is added; the quantity is stored as provenance in the applications table but not yet merged into the ingredient string itself

No new measurement system is needed. Enhancement authors write plain-text quantities in rule definitions, the same way recipes are authored everywhere in THA.

---

## 6. Shopping Integration Reuse Analysis

Shopping flows from `meal.ingredients[]` directly. The key path:

```
enhancement accepted
  → meal.ingredients updated (uplift-persistence.ts)
    → user runs "Add to basket"
      → POST /api/shopping-list/generate-from-meals
        → reads meal.ingredients[]
          → shopping list item created
```

No additional shopping wiring is required. This is explicitly documented in `uplift-persistence.ts:185-195`:

> "Shopping integration: No changes needed. Shopping list generation reads meal.ingredients directly, so uplift ingredients flow naturally once added to the meal."

The ingredient_sources table correctly attributes the uplift ingredient to the meal at list-generation time.

---

## 7. Enhancement Ranking Feasibility

### Priority Model Assessment

#### Priority 1 — Already Used This Week

**Signal:** An ingredient appears in another planned meal this week.

**Example:** Basil appears in Friday's Pizza. Suggest Basil for Monday's Salad.

**Data required:** Set of all ingredient strings from all meals in the active week.

**Current gap:** `UpliftContext` does not have a `weeklyIngredients` field. The data is available:
- Client: `fullPlanner` + `meals` cache holds all meal ingredients for the week
- Server: planner entries + meals can be queried by `userId` and `weekId`

**Implementation path:** Add `weeklyIngredients?: string[]` to `UpliftContext`. At uplift batch call time, collect all unique ingredient names from all meals in the planner week and pass them in. In the engine or post-processing, boost priority for suggestions whose ingredient appears in `weeklyIngredients`.

**Complexity:** Low — additive to existing architecture.

**Risk:** Variety concern. See Trust Check section.

---

#### Priority 2 — Already in Pantry

**Signal:** An ingredient is in the user's pantry (defaultHave=true).

**Example:** Pumpkin Seeds are in the pantry. Suggest them first.

**Data required:** Set of normalised ingredient keys from `user_pantry_items` where `defaultHave=true` and `isDeleted=false`.

**Current gap:** `UpliftContext` does not have a `pantryIngredients` field. The data is available from the `userPantryItems` table.

**Implementation path:** At `/api/uplift/batch` time, query `user_pantry_items` by `userId` (already available from `req.user`). Normalise keys. Add `pantryIngredients?: string[]` to `UpliftContext`. In post-processing, boost suggestions whose ingredient key matches a pantry item.

**Complexity:** Low — one additional DB query.

**Risk:** Low — pantry data is already user-scoped and trusted.

---

#### Priority 3 — Requires Purchase

**Signal:** Default. If the ingredient is not in P1 or P2, it will be added to the shopping list when accepted.

**Data required:** None beyond what already exists.

**Current gap:** None — this is the current default behaviour.

**Complexity:** None — emergent from P1/P2 classification.

---

### Priority Ranking Summary

| Priority | Signal | Data Exists | Currently Wired | Complexity to Wire |
|----------|--------|-------------|-----------------|-------------------|
| P1 — Used this week | Weekly ingredients | Yes | No | Low |
| P2 — In pantry | `user_pantry_items` | Yes | No | Low |
| P3 — Requires purchase | Default | Yes | n/a | None |

---

## 8. Nutritional Benefit Metadata Feasibility

### What Already Exists

#### Per-Suggestion `why` Text (Uplift Rules)

Every `UpliftSuggestion` has a `why` field — a short plain-English explanation written by a human rule author.

Examples:
- "Adds colour and supports anti-inflammatory variety. Pair with a pinch of black pepper."
- "Wilts easily into hot pasta, adding iron, folate, and plant variety."
- "Red lentils blend into bolognese invisibly, adding fibre, protein, and plant variety."

These are meal-context-aware (they describe why the ingredient fits this meal), not generic nutritional descriptions.

#### Per-Ingredient `pantry-knowledge.ts` Metadata

`PANTRY_KNOWLEDGE` in `client/src/lib/pantry-knowledge.ts` covers ~40 ingredients with:
- `supports: string[]` — e.g. `["Magnesium", "Zinc", "Healthy fats"]`
- `highlights: string[]` — e.g. `["Rich in magnesium, zinc and plant protein"]`
- `whyItMatters: string` — one-sentence explanation
- `goodToKnow: string` — optional usage tip
- `howToChoose: string[]` — optional buying guidance
- `tags: string[]` — e.g. `["magnesium", "zinc", "seeds", "healthy fats"]`

**Gap:** No direct link between uplift rule suggestions and `PANTRY_KNOWLEDGE` entries. A rule suggests "pumpkin seeds" and `PANTRY_KNOWLEDGE["pumpkin seeds"]` exists — but the engine does not look up or surface the `supports` or `highlights` data.

#### `pantryIngredientKnowledge` DB Table

A DB mirror of `PANTRY_KNOWLEDGE` with enrichment lifecycle support (`lastEnrichedAt`, `enrichmentSource`, `enrichmentVersion`, `isLocked`). Allows admin-managed updates without code deploys.

#### `NutrientTag` Taxonomy (nutrition-insights.ts)

5 nutrient tags: `Vitamin C`, `Fibre`, `Healthy fats`, `Vitamin D`, `Iron`. Each tag has a list of trigger ingredients and a set of suggestion strings.

#### `NutritionTag` Taxonomy (uplift-types.ts)

9 uplift tags: `fibre`, `protein`, `healthy-fat`, `micronutrient`, `gut-diversity`, `antioxidant`, `resistant-starch`, `fermented`, `wholefood-swap`. Applied per uplift rule match result.

### What Is Missing

1. **No benefit text in the NutritionBoostPanel.** System 1 shows ingredient name and category label only. No `why` text, no `supports` values, no highlights.
2. **No link from uplift rule suggestions to pantry-knowledge benefit text.** The `why` field covers meal-fit rationale; `PANTRY_KNOWLEDGE.highlights` covers general nutritional benefit. These are complementary and not yet combined.
3. **No "Adds to weekly plant count" indicator.** No surface currently tells the user how many distinct plants this enhancement would add to their week.

### Smallest Implementation Path

Lookup by ingredient name at render time:
- When rendering a suggestion in `MealUpliftPanel`, call `getPantryKnowledge(normalizeIngredientKey(suggestion.ingredient))`
- If a record exists, display `knowledge.highlights[0]` as a secondary benefit line beneath the `why` text
- No DB change required — `PANTRY_KNOWLEDGE` is already client-side

---

## 9. Implementation Options

### Option A — Minimal Evolution

**Scope:** Wire weekly ingredient list and pantry items into the uplift engine for priority-ranked suggestions.

**Files affected:**
1. `server/lib/uplift-types.ts` — add `weeklyIngredients?: string[]` and `pantryIngredients?: string[]` to `UpliftContext`
2. `server/routes.ts` — query `user_pantry_items` at `/api/uplift/batch` time; pass both fields in context
3. `server/lib/uplift-engine.ts` — post-process `UpliftMatchResult[]` to add a `priorityTier: 'P1' | 'P2' | 'P3'` field per suggestion
4. `client/src/pages/weekly-planner-page.tsx` — include weekly ingredient list in uplift batch payload

**Complexity:** Low. No schema changes. No migrations. No new tables.

**Risk:** Low. Changes are additive. Engine core is untouched.

**Expected user value:** Users see "already have this at home" and "already using this week" labels on enhancement suggestions. Reduces unnecessary spending. Reduces food waste. Makes enhancements feel more personal.

---

### Option B — Recommended Evolution

**Scope:** Option A, plus nutritional benefit text from `PANTRY_KNOWLEDGE` displayed inline per suggestion, and plant-count contribution indicator.

**Files affected (in addition to Option A):**
5. `client/src/components/MealUpliftPanel.tsx` — look up `getPantryKnowledge(normalizeIngredientKey(suggestion.ingredient))` and render `highlights[0]` or `supports` as a secondary benefit line
6. `client/src/lib/nutrition-boosts.ts` or `NutritionBoostPanel.tsx` — deprecation note or feature flag to retire in favour of System 2

**Complexity:** Medium. Client-only additions for benefit text. Minimal logic.

**Risk:** Low. Pantry knowledge is already available client-side. No API change required for the benefit text part.

**Expected user value:** Users understand *why* an enhancement is good for them, not just *that* it is suggested. Benefit text like "Rich in magnesium, zinc and plant protein" (pumpkin seeds) supports informed decisions. Deprecating System 1 removes duplicate surface and consolidates enhancement logic.

---

### Option C — Long-Term Enhancement Platform

**Scope:** Option B, plus per-enhancement plant-variety contribution tracking, shopping-list awareness for P2.5 (already on shopping list this week), full benefit metadata for all uplift-eligible ingredients, and an analytics surface for tracking enhancement acceptance rates.

**Files affected (in addition to Option B):**
7. `server/lib/uplift-types.ts` — add `shoppingListIngredients?: string[]` to `UpliftContext`; add `P2.5` tier for "already on shopping list"
8. `server/routes.ts` — query `shopping_list` for current items at uplift batch time
9. `client/src/lib/pantry-knowledge.ts` — extend coverage to all 26 BOOST_LIBRARY ingredients and all uplift rule suggestion ingredients
10. `server/lib/uplift-rules.ts` — add `plantCountContribution?: number` field to each suggestion (1 if it adds a new plant to the week)
11. Analytics or event logging for enhancement acceptance rates by rule

**Complexity:** Medium-high. Multiple file changes. No schema changes required unless plant-count analytics are persisted.

**Risk:** Medium. More surface area to test. Risk is primarily in expanding pantry-knowledge coverage accurately.

**Expected user value:** Full platform. Users see personalised, ranked, benefit-described enhancements that respect what they already have, what they are already buying, and what fits their household's nutrition goals. Contributes directly to the 30 plants/week goal with visible feedback.

---

## 10. Data Impact Declaration

| Dimension | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Reads existing data | Yes | Yes | Yes |
| Writes new data | No | No | No |
| Changes meaning of existing data | No | No | No |
| Requires backfill | No | No | No |
| Schema changes | No | No | No |

All three options are purely additive. No migrations, no schema changes, no data backfills.

---

## 11. Trust Check

### Could Enhancement Ranking Mislead Users?

**Priority 1 (used this week):** Could a user be steered toward the same ingredient repeatedly because it happens to be in multiple meals this week?

This is the key trust tension. Using basil because it is already in Pizza this week is genuinely practical (reduces waste, uses opened packet). However, if basil is the only P1 candidate every week, it reduces variety. 

**Mitigation:** Priority signals should inform order, not exclude other suggestions. P1 should appear first; P2 and P3 suggestions should still be shown. The cap of 2-3 visible suggestions per meal limits the damage of a single repeated ingredient dominating.

---

### Could Pantry Bias Reduce Nutritional Quality?

If pantry items are always boosted to P2, a household with only "olive oil" and "salt" in their pantry will always see those at the top — regardless of nutritional value.

**Mitigation:** The enhancement rules are authored independently of pantry status. The rules already ensure nutritional relevance. The pantry signal only reorders suggestions within an already-nutritionally-filtered set. It does not add new candidates.

---

### Could Weekly Ingredient Reuse Reduce Variety?

If a user eats lentils on Monday and the engine suggests lentils for Tuesday, Wednesday, and Thursday because they are P1, variety suffers.

**Mitigation:** This risk is real but manageable. Two mechanisms:
1. Cap the number of P1 suggestions per enhancement to 1. Allow P2 and P3 suggestions to fill the remaining slots.
2. Consider a deduplication rule: if an ingredient already appears in 2 or more meals this week, demote it from P1 to P2.

---

### How Should THA Balance Practicality, Cost, Nutrition, and Variety?

The enhancement philosophy should be:

| Weight | Signal |
|--------|--------|
| Highest | Household hard restrictions (already enforced — never show unsafe items) |
| High | Meal fit (rule trigger ensures nutritional relevance to this meal type) |
| Medium | Practicality (P1/P2 surface items the household already has) |
| Medium | Cost (P3 flagged as a new purchase — user is informed) |
| Lower | Nutritional completeness (uplift tags + pantry-knowledge text inform but do not rank) |
| Lowest | Variety (protect against repetition but do not override practicality) |

THA's philosophy "what can we add" means the default should lean toward practical, low-friction enhancements. The 30 plants/week goal is built from consistent small additions, not from radical daily variety.

---

## Summary

The new Meal Enhancement system (`MealUpliftPanel` + uplift engine + uplift persistence) is already a capable platform.

The core loop — suggest, accept, persist to meal, flow to shopping — is fully operational with 42 reviewed rules.

The three gaps between current state and a full priority-ranked enhancement platform are:

1. **Weekly ingredient awareness** — data exists in the planner, not yet passed to the uplift engine
2. **Pantry awareness** — data exists in `user_pantry_items`, not yet passed to the uplift engine
3. **Benefit text display** — `PANTRY_KNOWLEDGE` has nutritional descriptions for ~40 ingredients, not yet surfaced in `MealUpliftPanel`

All three gaps are low-risk, additive changes with no schema requirements.

The System 1 `NutritionBoostPanel` should be retired once System 2 has equivalent meal-type coverage, to avoid duplicate surfaces and conflicting user experiences.
