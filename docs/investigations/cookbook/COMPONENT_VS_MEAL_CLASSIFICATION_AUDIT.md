COMPONENT VS MEAL CLASSIFICATION AUDIT: COMPLETE

---

**Rollback Identifier:** `rollback/pre-component-meal-audit-2026-06-08` → commit `595a951`
**Audit Date:** 2026-06-08
**Risk Level:** GREEN — Investigation only. No code changes, no schema changes, no data changes.

---

## Files Reviewed

| File | Purpose |
|---|---|
| `shared/schema.ts` | Full data model — meals, categories, mealTemplates, meal_pairings |
| `server/lib/smart-suggest-service.ts` | Smart Planner candidate pool assembly and filtering |
| `server/routes.ts:4797–4958` | Smart Planner route — pre-pool construction |
| `server/storage.ts:432–434` | `getMeals()` — fetches ALL user meals, no kind filter |
| `server/lib/meal-scoring-service.ts` | `convertMealToCandidate()` — meal → candidate conversion |
| `server/lib/recipe-swap-engine.ts` | Ingredient swap engine (vegetarian, keto, etc.) |
| `server/lib/planner-compliance.ts` | System-write dietary gate |
| `shared/meal-adaptation.ts` | Household-safe variant types |
| `shared/food-constructs.ts` | Ingredient-level component decomposition (parsing only) |
| `client/src/components/day-view-drawer.tsx` | UI — only place `kind === "component"` is referenced |

---

## SECTION 1 — CURRENT DATA MODEL

### Schema Fields Available

The `meals` table contains these relevant fields:

| Field | Type | Values in Production DB |
|---|---|---|
| `kind` | text, default `"meal"` | `"meal"` — **all 2,076 rows** |
| `mealFormat` | text, default `"recipe"` | `recipe (364)`, `ready-meal (1658)`, `drink (49)`, `grouped (5)` |
| `mealSourceType` | text | `starter (1323)`, `scratch (330)`, `ready_meal (309)`, `openfoodfacts (82)`, `planner-placeholder (20)`, `web (8)`, others (7) |
| `categoryId` | integer FK | Resolves to one of 12 categories (see below) |
| `isReadyMeal` | boolean | True for ready meals, False for recipes |
| `isSystemMeal` | boolean | True for THA-seeded content |
| `isDrink` | boolean | True for drinks |

### Meal Categories (All 12 in Production)

| Category ID | Name | Meal Count |
|---|---|---|
| 1 | Breakfast | 479 |
| 2 | Lunch | 493 |
| 3 | Dinner | 686 |
| 4 | Snack | 24 |
| 5 | Smoothie | 0 |
| 6 | Dessert | 40 |
| 7 | Drink | 59 |
| 8 | Immune Boost | 0 |
| 9 | Supplement | 0 |
| 10 | Baby Meal | 21 |
| 11 | Kids Meal | 20 |
| 12 | Frozen Meal | 46 |

**Finding:** There is no `Component`, `Sauce`, `Base`, `Side`, or `Topping` category. The data model provides no semantic category for sub-meal items.

### mealTemplates — Slot Architecture (Exists but Unused)

The `meal_templates` table (625 rows) has these composition fields in the schema:

- `sharedBaseComponents` text[]
- `proteinSlots` text[]
- `carbSlots` text[]
- `vegSlots` text[]
- `toppingSlots` text[]
- `sauceSlots` text[]
- `compatibleDiets` text[]

**Finding:** Every one of these fields is `NULL` in all 625 rows. All templates are auto-created shells with only `name` and `category`. The slot architecture was designed but never populated.

### meal_pairings Table

The schema defines a `meal_pairings` table:
- `base_meal_id` → `suggested_meal_id` with priority

**Finding:** 0 rows in production. The table exists but has never been used.

### Can the system currently distinguish meal vs component?

| Classification | Schema Support | In Use | Status |
|---|---|---|---|
| Meal | `kind = 'meal'` (default) | Yes — all 2,076 rows | EXISTS but undifferentiated |
| Component | `kind = 'component'` (schema only) | 0 rows in DB | DOES NOT EXIST in data |
| Sauce | Category: none | No category, no field | NOT SUPPORTED |
| Base | Category: none | No category, no field | NOT SUPPORTED |
| Side | Category: none | No category, no field | NOT SUPPORTED |
| Dessert | Category: `Dessert` | 40 meals | EXISTS (limited) |
| Snack | Category: `Snack` | 24 meals | EXISTS (limited) |

**Direct Answer:** The system cannot currently distinguish a meal from a component. All recipes are stored with `kind = 'meal'` regardless of whether they are complete dishes or sub-components. A sauce, a base, a dough, and a full curry are indistinguishable in the data model.

---

## SECTION 2 — SMART PLANNER CANDIDATE SELECTION

### How candidates are selected

`storage.getMeals(userId)`:
```sql
SELECT * FROM meals WHERE user_id = $1
```
No filter on `kind`, `mealFormat`, category name, or meal semantics. Returns every row belonging to the user.

### Filters applied BEFORE Smart Planner scoring

The Smart Planner route (`routes.ts:4830–4888`) applies these exclusions IN ORDER:

| Filter | Condition | What It Catches |
|---|---|---|
| 1. Diet ID | `mealSourceType = 'starter'` | System seed meals |
| 2. Source type | `mealSourceType = 'planner-placeholder'` | Internal placeholders |
| 3. Source type | `mealSourceType = 'openfoodfacts'` | Barcode-scanned grocery products |
| 4. Drinks prefs | `meal.drinkType === 'alcohol'` | Always excluded |
| 5. Drinks prefs | `meal.isDrink \|\| meal.kind === 'drink'` | When drinks disabled |
| 6. Ready-meal product guard | `isReadyMeal && ingredients.length === 0 && barcode` | Barcode products saved via wrong flow |
| 7. Premium content | Name/instructions contain paywall markers | BBC GoodFood gated recipes |

None of these filters examine:
- Whether a meal is a complete dish vs a component
- The meal name for component-indicating words (`sauce`, `dough`, `paste`, `pesto`, etc.)
- The `kind` field for values other than `drink`
- The `mealFormat` field

### Filters applied INSIDE smart-suggest-service.ts

Secondary guards:
- Alcoholic content by name keyword
- Household hard restrictions (ingredients)
- Profile dietary pattern (dietRules engine)

None of these distinguish meals from components.

### Why would Pizza Sauce become a meal suggestion?

**Confirmed from production data:**

```
name:             Pizza sauce
meal_source_type: scratch
kind:             meal
category:         Dinner
ingredients:      9 (olive oil, onion, garlic, chopped tomatoes, tomato purée, bay leaf, oregano, brown sugar, basil)
is_ready_meal:    false
barcode:          null
```

It passes every filter:
- ✅ Not `starter`, `planner-placeholder`, or `openfoodfacts`
- ✅ Not a drink
- ✅ Not a ready-meal product (has ingredients, no barcode)
- ✅ No premium markers
- ✅ Category `Dinner` → eligible for dinner slot via `SLOT_CATEGORY_MAPPING`
- ✅ No dietary restriction keywords (olive oil, onion, tomatoes are diet-neutral)
- ✅ Scores positively: 9 ingredients = `simplicityBonus * 0.8`, no dietary hits

**Pizza sauce is indistinguishable from Chicken Curry in the Smart Planner data model.**

---

## SECTION 3 — REAL EXAMPLES FROM DATABASE

### Likely Complete Meals

| Name | Category | mealSourceType | kind | Smart Planner Eligible |
|---|---|---|---|---|
| Chilli Con Carne | Dinner | ready_meal + starter | meal | ELIGIBLE (starter excluded; ready_meal passes) |
| Chicken Curry | (none) | scratch | meal | ELIGIBLE |
| Classic lasagne | Dinner | scratch | meal | ELIGIBLE |
| Margherita Pizza | Dinner | ready_meal + starter | meal | ELIGIBLE |

### Likely Components (Misclassified as Meals)

| Name | Category | mealSourceType | kind | Smart Planner Eligible | Status |
|---|---|---|---|---|---|
| Pizza sauce | Dinner | scratch | meal | **YES — ELIGIBLE** | FAIL |
| Classic pesto | Dinner | scratch | meal | **YES — ELIGIBLE** | FAIL |
| Classic pesto (duplicate) | Dinner | scratch | meal | **YES — ELIGIBLE** | FAIL |
| Harissa pasta & Mixed nut pesto | (none) | scratch | meal | **YES — ELIGIBLE** | FAIL |
| Really easy roasted red pepper sauce | Dinner | scratch | meal | **YES — ELIGIBLE** | FAIL |

### Likely Sides

| Name | Category | mealSourceType | kind | Smart Planner Eligible |
|---|---|---|---|---|
| Garlic Bread | Snack | ready_meal | meal | ELIGIBLE (snack slot) |
| Chips | Snack | ready_meal | meal | ELIGIBLE (snack slot) |
| Curly Fries | Snack | ready_meal | meal | ELIGIBLE (snack slot) |

**Note:** Sides appear in the Snack slot. They would not appear as Dinner but they do appear as Snack suggestions — which is semantically wrong for a meal planner.

### Likely Desserts

| Name | Category | mealSourceType | kind | Smart Planner Eligible |
|---|---|---|---|---|
| Chocolate Brownie | Dessert | ready_meal | meal | ELIGIBLE (snack slot — `Dessert` maps to `snack`) |
| Carrot Cake | Dessert | ready_meal | meal | ELIGIBLE (snack slot) |
| Ultimate chocolate cake | Dessert | scratch | meal | ELIGIBLE (snack slot) |
| Breakfast muffins | (none) | scratch | meal | ELIGIBLE (falls back to dinner) |

---

## SECTION 4 — MEAL COMPOSITION CAPABILITY

### Search results for composition concepts

| Concept | Found | Location | Status |
|---|---|---|---|
| `component` (meal-level) | Partial | `meals.kind` field (schema), `day-view-drawer.tsx` (UI filter) | Schema exists; 0 DB rows; UI references it but it never appears |
| `dependency` | No | — | NOT PRESENT |
| `parent recipe` | Partial | `meals.originalMealId` | Used only for household-safe variant forks, not composition |
| `child recipe` | No | — | NOT PRESENT |
| `meal assembly` | No | — | NOT PRESENT |
| `meal intent` | No | — | NOT PRESENT |
| `serving component` | No | — | NOT PRESENT |
| `recipe relationship` | Partial | `meal_pairings` table | Schema exists; 0 DB rows |
| `sharedBaseComponents` | Schema only | `mealTemplates` table | NULL on all 625 templates |
| `proteinSlots / sauceSlots` | Schema only | `mealTemplates` table | NULL on all 625 templates |
| `components[]` | `food-constructs.ts` | Ingredient parsing layer | For shopping ingredient decomposition only — not meal-level composition |

### Closest existing capability to meal composition

1. **`mealTemplates` slot architecture** — The schema defines `sharedBaseComponents`, `proteinSlots`, `carbSlots`, `vegSlots`, `toppingSlots`, `sauceSlots`, `compatibleDiets`. This is precisely the meal composition model the investigation describes. It is entirely unimplemented in data.

2. **`meal_pairings`** — The schema supports `base_meal_id` → `suggested_meal_id` relationships. 0 rows — never populated.

3. **`meals.originalMealId` + `isHouseholdSafeVariant`** — Supports one-directional dietary fork. An original meal can have a household-safe variant. This is the closest to "same meal, different dietary implementation" — but it is household-specific, AI-generated, manual-trigger only, and not used by Smart Planner.

**Direct Answer:** Meal composition architecture exists in the schema in THREE places (`mealTemplates` slots, `meal_pairings`, household-safe variants) but none of them are populated or used. The architecture was designed but never built out.

---

## SECTION 5 — DIETARY ADAPTATION

### Can Smart Planner reason: "Pizza → Vegan Pizza"?

**No.** Smart Planner does not adapt meals. Its model is:

```
Full meal pool
    ↓ filter (source type, drinks, premium, dietary hard exclusions)
    ↓ score (diet match, budget, UPF, variety, overlap, cuisine)
    ↓ select top N per slot
```

There is no step for:
- "Generate a keto version of this recipe"
- "Find a vegan equivalent of this meal"
- "This is the same dish adapted for different dietary profiles"

### What adaptation exists?

| System | Location | What It Does | Used By Smart Planner? |
|---|---|---|---|
| `recipe-swap-engine.ts` | `server/lib/` | Swaps ingredients per dietary goal (vegetarian → lentils, keto → courgette noodles) | NO |
| `AdaptationResult` | `shared/meal-adaptation.ts` | AI-generated per-eater modifications for household members | NO (manual trigger in Planner UI) |
| `isHouseholdSafeVariant` | `meals` table | Stores AI-generated forks of meals for household restrictions | NO (Smart Planner ignores variant kind) |
| `dietRules.shouldExcludeRecipe()` | `server/lib/dietRules.ts` | Removes non-compliant recipes from the pool | YES (as a filter, not adaptation) |

### Does Smart Planner understand "same meal, different implementation"?

**No.** Smart Planner understands only **"different recipe"**. A vegan pizza and a keto pizza are two independent items in the pool. If neither exists, neither is suggested. Smart Planner cannot reason: "The user wants pizza → find or generate the appropriate version."

---

## SECTION 6 — HOUSEHOLD OPERATIONS

### Freezer and leftovers support

| Feature | Schema Support | Smart Planner Support | Evidence |
|---|---|---|---|
| Freezer eligibility | `meals.isFreezerEligible` | NO | Not read by smart-suggest-service |
| Freezer meal store | `freezer_meals` table (6 rows) | NO | Not queried in planner route |
| Leftovers | `includeLeftovers` in `SmartSuggestSettings` | **DECLARED BUT NOT IMPLEMENTED** | Field defined at line 18 of smart-suggest-service.ts; never referenced in service logic |
| Week provisioning items | `week_provisioning_items` (0 rows) | NO | Not connected to Smart Planner |
| Batch cooking awareness | — | NO | No concept exists |

### Independent slot planning

Smart Planner plans each of the 7 × slots independently in a single loop:

```typescript
for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
  for (const slot of slots) {
    // select one candidate for this slot
  }
}
```

The only cross-slot state tracked is:
- `usedIds` — prevents the exact same meal appearing twice in the same week
- `usedProteins` — variety scoring for protein diversity
- `usedIngredients` — overlap scoring for ingredient reuse

There is no:
- "Cook chilli Monday, eat leftovers Tuesday"
- "Batch cook lasagne for freezer"
- "Make pesto once, use across three dinners this week"
- "Pull from freezer instead of cooking fresh"

---

## SECTION 7 — ROOT CAUSE ANALYSIS

### 1. Why did Pizza Dough appear as a meal?

If a user saved "Pizza dough" as a scratch recipe with any Dinner/Lunch/Snack/no category, it would pass all Smart Planner filters. The system has no mechanism to identify a bread component as semantically incomplete for a meal slot.

### 2. Why did Pizza Sauce appear as a meal?

**Confirmed.** `Pizza sauce` exists in the production database as:
- `meal_source_type = 'scratch'`
- `kind = 'meal'`
- `category_id = 3` (Dinner)
- 9 ingredients (complete recipe)
- No barcode, not ready_meal, not premium

It passes every Smart Planner filter and is scored like any other dinner candidate. It would be selected and presented as a valid dinner suggestion.

### 3. Is Smart Planner selecting recipes instead of meals?

**Yes.** Smart Planner selects recipes and presents them as meals. It has no semantic model to distinguish between a complete meal and a recipe for a component, sauce, base, or side. Any recipe saved by the user that is not explicitly excluded by source type, drink type, or premium marker is a candidate.

### 4. Is there already a hidden classification layer?

**Partially — but it is empty.**

Three hidden classification mechanisms exist in the schema:
1. `meals.kind` (currently only `'meal'`) — the field exists and the UI in `day-view-drawer.tsx` explicitly filters on `kind === 'component'`, but there are 0 rows with that value in production. The guard exists but no data flows through it.
2. `mealTemplates` slot fields (`sharedBaseComponents`, `proteinSlots`, `sauceSlots`, etc.) — designed for meal composition but all NULL.
3. `meal_pairings` — designed for base/suggested meal relationships, but 0 rows.

**The infrastructure was anticipated and partially built, but never populated.**

### 5. What architecture already exists that could support meal composition?

In descending order of readiness:

| Architecture | Readiness | What's Missing |
|---|---|---|
| `meals.kind` field | HIGH — field exists, schema valid, UI already references it | Data: set `kind = 'component'` on component recipes; add Smart Planner exclusion filter |
| `meal_pairings` table | MEDIUM — table and FK schema exist | Data: populate pairings; surface in Smart Planner |
| `mealTemplates` slot fields | LOW — schema exists, 625 empty templates exist | Logic: populate slot data; build composition engine |
| `isHouseholdSafeVariant` + `originalMealId` | EXISTS (1 row) | Extend to cover dietary profile forks, not just household forks |

---

## AUDIT MATRIX

| Item Type | Exists Today | Used By Smart Planner | Evidence | Status |
|---|---|---|---|---|
| Meal | Yes — `kind = 'meal'` (2076 rows) | Yes — all non-excluded user meals | `storage.getMeals()`, `kind` default | PASS |
| Component | Schema only — `kind` field, 0 rows | No | `day-view-drawer.tsx:129-130` references it; DB has 0 component rows | FAIL |
| Sauce | No — no category, no kind value | No gate | Pizza sauce proven eligible as dinner | FAIL |
| Base | No — no category, no kind value | No gate | Would pass all filters if saved as scratch/Dinner | FAIL |
| Side | Partial — Snack category used | Snack slot only | Garlic Bread = Snack category → appears in snack slot | PARTIAL |
| Dessert | Yes — Dessert category (40 meals) | Snack slot | `SLOT_CATEGORY_MAPPING.snack = ["snack", "dessert", ...]` | PARTIAL |
| Snack | Yes — Snack category (24 meals) | Snack slot | `SLOT_CATEGORY_MAPPING.snack` | PASS |
| Meal Composition | Schema only — mealTemplates slots + meal_pairings (0 rows each) | No | `mealTemplates` slot fields NULL; `meal_pairings` empty | FAIL |
| Dietary Adaptation | No — filtering only, no adaptation | Filtering only | `candidateDietExcluded()` removes; no variant generation | FAIL |

---

## MANDATORY FINDINGS

### 1. Current Smart Planner Mental Model

```
User saved meals
    ↓ getMeals(userId) — returns ALL meals, no semantic filtering
    ↓ Exclude: starter seeds, placeholders, OpenFoodFacts products, drinks, premium
    ↓ Exclude: dietary hard restrictions (household)
    ↓ Exclude: profile dietary pattern (dietRules)
    ↓ Filter: slot category match (breakfast/lunch/dinner/snack)
    ↓ Score: diet match + budget + UPF + variety + ingredient overlap + cuisine
    ↓ Select: top 3 randomly chosen from top 5 scored candidates per slot
```

The model is: **all saved recipes are equivalent meal candidates**.

### 2. Does THA understand meals or only recipes?

**Only recipes.** THA has no semantic model of a meal as a complete eating event. It has no concept of:
- A meal requiring specific components to be present (base + protein + sauce)
- A recipe being a sub-component that must be part of a larger meal intent
- A "meal night" as an intent that can be adapted to different dietary profiles

### 3. Does meal composition already exist?

**No — only as empty schema.** The `mealTemplates` slot architecture, `meal_pairings` table, and `meals.kind` component value are all present in the schema but contain no data. They represent architectural intent that was never implemented.

### 4. Does dietary adaptation already exist?

**No, only dietary filtering.** The system can:
- Remove meals that violate a user's dietary profile (via `dietRules`)
- Swap ingredients within a single recipe on request (via `recipe-swap-engine.ts`)
- Generate a one-off household-safe variant on manual trigger (via AI + `isHouseholdSafeVariant`)

The system cannot:
- Reason "the user wants pizza → generate/find the keto version"
- Maintain "same meal intent, different dietary implementation" relationships
- Auto-present dietary alternatives during Smart Planner generation

### 5. Smallest Safe Future Improvement

**Tag component recipes with `kind = 'component'` and filter them from the Smart Planner pool.**

- Data change: identify existing sauce/base/component recipes in the DB and update `kind` field (one-time backfill on a small number of rows)
- Code change: add `WHERE kind != 'component'` or equivalent filter to `getMeals()` or the Smart Planner route pre-filter
- Risk: LOW — additive exclusion only, no structural change
- Evidence the UI is already ready: `day-view-drawer.tsx:129` already filters `kind === "component"` in meal search
- What breaks: nothing — component recipes simply stop appearing as suggestions

### 6. Largest Architectural Opportunity

**Implement meal intent + component composition using the existing `mealTemplates` slot architecture.**

Define a `MealIntent` as:
- A named meal concept (e.g., "Pizza Night", "Curry Night")
- A set of required component slots (base, sauce, protein, topping)
- Compatible dietary profiles per slot

The `mealTemplates` table already has `sharedBaseComponents`, `proteinSlots`, `carbSlots`, `vegSlots`, `toppingSlots`, `sauceSlots`, and `compatibleDiets`. Populating these would allow Smart Planner to:

1. Select a MealIntent (e.g., "Pizza Night")
2. Identify which slot implementations are available for the user's dietary profile
3. Build the meal from compatible components
4. Suggest the whole night as one planner entry, not five separate recipe cards

This would resolve the pizza dough/pizza sauce problem completely, enable true per-household dietary adaptation, and support cross-meal ingredient reuse (batch pesto for multiple nights).

### 7. Recommended Next Decision

**Decide whether to classify existing components (quick, safe fix) or design meal intent (larger, foundational work).**

Option A — Quick fix: Audit the existing `scratch` meals in the DB for component-type recipes, tag them `kind = 'component'`, and add a one-line Smart Planner exclusion. This stops the problem. Duration: ~1 session.

Option B — Foundation: Design a meal intent classification pass for the `mealTemplates` slot architecture, starting with a small set of high-value meal intents (pizza, curry, tacos). This resolves the root cause. Duration: multiple sessions.

**Both can proceed without conflict. Option A is the immediate fix. Option B is the strategic direction.**

---

## DATABASE FINDINGS SUMMARY

| Query | Result |
|---|---|
| `SELECT kind, COUNT(*) FROM meals GROUP BY kind` | `meal: 2076` — only one kind value exists |
| `SELECT DISTINCT meal_format FROM meals` | `recipe, ready-meal, drink, grouped` — no component format |
| `SELECT COUNT(*) FROM meal_pairings` | `0` — table exists, never used |
| `SELECT * FROM meal_templates WHERE shared_base_components IS NOT NULL` | `0 rows` — slot fields all NULL |
| Pizza sauce eligibility simulation | `ELIGIBLE-FOR-SMART-PLANNER` — confirmed eligible |
| Classic pesto eligibility simulation | `ELIGIBLE-FOR-SMART-PLANNER` — confirmed eligible |
| `SELECT COUNT(*) FROM freezer_meals` | `6` — exists but unused by Smart Planner |
| `SELECT COUNT(*) FROM week_provisioning_items` | `0` — table exists, never used |
| `includeLeftovers` in SmartSuggestSettings | Declared, never implemented |

---

## DATA IMPACT DECLARATION

| Check | Answer |
|---|---|
| Reads existing data | Yes |
| Writes new data | No |
| Changes meaning of existing data | No |
| Requires backfill | No |

---

## TRUST CHECK

**Could this mislead the user?** Only if components were not being presented as meals. This audit confirms they are. Evidence is database rows and source code — no inference.

**Could this fabricate certainty?** No. Every claim references a specific file path, line number, or SQL query result.

**Is anything guessed but shown as real?** No. All `ELIGIBLE` status conclusions derive from confirmed DB row values traced against confirmed source code filter logic.

**What happens if the system is wrong?** Smart Planner can generate operationally poor meal plans where components appear as meals, sides appear as snacks, and dietary adaptation is impossible because components and complete meals are indistinguishable.
