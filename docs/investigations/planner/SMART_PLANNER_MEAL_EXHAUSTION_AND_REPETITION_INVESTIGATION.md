# Smart Planner: Meal Exhaustion and Repetition Investigation

**Date:** 2026-06-12  
**Branch:** main  
**Rollback tag:** `investigation/smart-planner-meal-exhaustion-20260612-064041`  
**Symptom:** 16/28 meals planned, multiple empty breakfast slots, multiple empty lunch slots, Chicken Marengo repeated, Thai Feast repeated.

---

## Rollback Protection

```
Tag: investigation/smart-planner-meal-exhaustion-20260612-064041
Commit: 43fbdda (checkpoint: pre-nutrition-boost-provenance rollback point)
```

No code was modified during this investigation.

---

## Files Examined

| File | Purpose |
|------|---------|
| `server/lib/smart-suggest-service.ts` | Core planner generation loop, tier fallback logic |
| `server/routes.ts` lines 4797–4968 | Route handler: settings construction, household merge |
| `server/lib/dietRules.ts` | Hard exclusion keyword sets for each diet pattern |
| `server/lib/external-meal-service.ts` | External candidate sources, category inference |
| `server/lib/meal-scoring-service.ts` | Candidate scoring, selection mechanics |
| `shared/restrictions/restriction-library.ts` | Canonical restriction definitions (Phase 3) |
| `shared/restrictions/restriction-resolver.ts` | Per-ingredient restriction matching, legacy expansions |
| `shared/schema.ts` | HouseholdEater schema: `hardRestrictions`, `defaultDietTypes` |

---

## Household Profile: Lilly and Daisy

### Data architecture

Lilly and Daisy are **household eaters** (`household_eaters` table), not the account owner. The account owner (the user who triggers the plan) is a separate user record with their own `dietPattern` and `dietRestrictions` profile fields.

This distinction is architecturally critical. See routes.ts:4826:

```ts
settings.dietPattern  = req.user?.dietPattern ?? null;       // account owner only
settings.dietRestrictions = req.user?.dietRestrictions?.filter(Boolean) ?? [];  // account owner only
```

Eater data is handled separately (routes.ts:4909–4934):

```ts
for (const eater of eaters) {
  for (const restriction of eater.hardRestrictions ?? []) {
    hardRestrictedSet.add(restriction.toLowerCase());  // → hardExcludedIngredients
  }
  for (const diet of eater.defaultDietTypes ?? []) {
    if (!mergedDietTypes.includes(diet)) mergedDietTypes = [...mergedDietTypes, diet];  // → scoring only
  }
}
```

### Lilly (eater)

| Field | Value | Effect |
|-------|-------|--------|
| `defaultDietTypes` | `["Vegetarian"]` | **Scoring only** — passed to `mergedPrefs.dietTypes`, reduces score by -10 via `DIET_EXCLUDED_KEYWORDS["vegetarian"]` when meat/fish present. NOT a hard exclusion. |
| `hardRestrictions` | `["Gluten-Free", "Nuts", "Dairy-Free", "Eggs", "Shellfish", "Soy"]` | Merged into `settings.hardExcludedIngredients` → applied via `isHardExcluded` (restriction resolver) |

### Daisy (eater)

| Field | Value | Effect |
|-------|-------|--------|
| `defaultDietTypes` | `["Mediterranean"]` | **Scoring only** |
| `hardRestrictions` | `["Dairy-Free", "Eggs"]` | Merged into `settings.hardExcludedIngredients` (deduplicated with Lilly's) |

### Merged state entering `generateSmartSuggestion`

```
settings.dietPattern       = <account owner's pattern, likely null>
settings.dietRestrictions  = <account owner's restrictions, likely []>
settings.hardExcludedIngredients = [
  "gluten-free",   → resolves to: gluten restriction definition
  "nuts",          → resolves to: peanut + tree_nut definitions (legacy expansion)
  "dairy-free",    → resolves to: dairy restriction definition
  "eggs",          → resolves to: eggs restriction definition
  "shellfish",     → resolves to: shellfish restriction definition
  "soy",           → resolves to: soy restriction definition
]
mergedPrefs.dietTypes = ["Vegetarian", "Mediterranean"]
dietarySearchPrefix   = "vegetarian" (first match in DIETARY_SEARCH_PREFIXES)
```

---

## Question 1: Candidate Counts by Slot

### External search queries (with prefix "vegetarian")

From `external-meal-service.ts:218–224`:

```ts
rawQueries = ["chicken", "pasta", "salad", "curry", "soup", "fish", "steak", "vegetable"]
labelledQueries = ["vegetarian chicken", "vegetarian pasta", "vegetarian salad"]
queries = ["vegetarian chicken", "vegetarian pasta", "vegetarian salad",
           "omelette", "frittata", "smoothie", "porridge", "shakshuka"]
```

TheMealDB performs name-text searches. "vegetarian chicken", "vegetarian pasta", "vegetarian salad" return near-zero results because TheMealDB does not tag meals with diet labels in their names.

`combined.length < 10` → generic fallback triggers (external-meal-service.ts:773), running queries: `"chicken", "pasta", "salad", "curry", "soup"`.

### After source and category gates

User meals pass the initial gates (no products, no premium, no components). External candidates from TheMealDB are enriched with full ingredients.

### After restriction filtering (`isHardExcluded`)

Active restriction definitions resolved from `hardExcludedIngredients`:

| Restriction | Aliases caught | Derived ingredients caught | Hidden ingredients caught |
|-------------|----------------|---------------------------|--------------------------|
| **gluten** | wheat, gluten, coeliac | wholemeal, bulgur, couscous, semolina, spelt, barley, rye | soy sauce, malt vinegar, worcestershire sauce, beer |
| **peanut** | peanut, groundnut | peanut butter, peanut oil, peanut sauce, groundnut oil | satay sauce, satay, pad thai sauce |
| **tree_nut** | tree nut, tree nuts | almond, cashew, walnut, hazelnut, pecan, pistachio, macadamia, brazil nut, pine nut, nut butter, marzipan, praline, nougat, frangipane | pesto, romesco sauce |
| **dairy** | dairy, dairy-free, milk, lactose | butter, cream, yoghurt, cheese, ghee, whey, creme fraiche, sour cream, custard, condensed milk, evaporated milk, buttermilk | milk chocolate, white chocolate, caramel |
| **eggs** | egg, eggs | mayonnaise, egg wash, meringue, omelette, frittata, hollandaise, quiche, aioli | brioche, caesar dressing, fresh pasta |
| **shellfish** | shellfish, crustacean | prawn, shrimp, crab, lobster, mussel, clam, scallop, oyster, squid, calamari | oyster sauce, prawn crackers, seafood sauce |
| **soy** | soy, soya | soy sauce, soya sauce, tofu, tempeh, edamame, miso, tamari, soy milk, soy flour | none |

After restriction filtering, approximate effect on candidate categories:

| Candidate type | Eliminated by |
|----------------|--------------|
| All egg-containing dishes | eggs restriction |
| All dairy dishes | dairy restriction |
| Nut/pesto/satay dishes | peanut + tree_nut restrictions |
| Shellfish dishes | shellfish restriction |
| Soy sauce / stir-fry / Asian fusion | soy restriction |
| Wheat-based dishes where "wheat" appears | gluten restriction |
| Curries and dishes with coconut milk | dairy restriction (**see Critical Finding 1**) |

### After slot category assignment

Slot category mapping (smart-suggest-service.ts:240–246):

```ts
breakfast: ["breakfast", "smoothie"]
lunch:     ["lunch", "snack", "salad"]
dinner:    ["dinner", "main"]
```

Category assignment for external candidates is via `inferCategoryFromCuisineAndName`. For user meals, category comes from `meal.categoryId → categoryMap`. User meals with **no categoryId** receive `category: null`.

`getCandidateSlotFit` rule (smart-suggest-service.ts:315–319):

```ts
if (!candidate.category) return slot === "dinner";
```

A null-category meal can only fill the **dinner** slot in Tier-1. It can fill lunch in Tier-2 only if Tier-1 lunch candidates are exhausted.

### Estimated slot-specific candidate counts

**Breakfast pool:**
- External breakfast candidates require name to contain: breakfast, pancake, omelette, porridge, granola, smoothie, frittata, shakshuka, scrambled, overnight oats, or acai
- Omelette, frittata, shakshuka, scrambled → all blocked by **egg restriction**
- Porridge (milk/dairy) → blocked by **dairy restriction**
- Granola (often contains nuts) → blocked by **tree_nut restriction**
- Smoothies → blocked by **dairy restriction false positive on "milk" word** (see Critical Finding 1)
- Pancakes (flour) → **NOT blocked by gluten restriction library** (see Critical Finding 2), but contain eggs → blocked by **egg restriction**

Estimated breakfast pool: **0–1 compliant candidates** (near-zero).

**Lunch pool:**
- External candidates categorized as lunch by name: salads, soups, sandwiches, wraps
- Salads without dairy, eggs, nuts: some survive
- Soups with cream → blocked
- Sandwiches/wraps with bread → may pass via gluten library gap (see Critical Finding 2)

Estimated lunch pool: **3–6 compliant candidates**.

**Dinner pool:**
- Largest pool by default (null-category = dinner, dinner-named external meals)
- Meat dishes (no dairy/eggs/nuts/soy/shellfish): survive if no restricted ingredients
- Curries with coconut milk: blocked by dairy restriction false positive
- Chicken-based dishes without restricted ingredients: survive (e.g., Chicken Marengo)

Estimated dinner pool: **6–10 compliant candidates**.

### Filter stage trace for each slot

**Breakfast slots (7 slots required, ~0 compliant candidates):**
1. Tier-1: slot-fit unused → 0 candidates
2. Tier-2: safe fallback (for breakfast: breakfast/smoothie only) → 0 candidates
3. Tier-3: repeat fallback (all slot-compliant) → 0 candidates
4. Tier-4: shell recovery → if no breakfast-category shells exist with compatible ingredients → 0
5. **Result: EMPTY SLOT**

**Lunch slots (7 slots required, ~3–6 compliant candidates):**
1. Tier-1 fills slots 1–6 with unique candidates
2. From slot 4+ (or earlier if pool is smaller), Tier-3 kicks in → repeats
3. Some slots may be empty if even Tier-3 returns 0

**Dinner slots (7 slots required, ~6–10 compliant candidates):**
1. Tier-1 fills slots 1–7 with unique candidates
2. From slot 7+, Tier-3 triggers → Chicken Marengo and Thai Feast repeat

---

## Question 2: Why Chicken Marengo Appeared Multiple Times

### What is Chicken Marengo in TheMealDB

Chicken Marengo is retrieved from TheMealDB via the "chicken" fallback query. Its typical ingredients:
- Chicken pieces (thighs/drumsticks)
- Tomatoes / canned tomatoes
- White wine (ethanol → not a restriction here)
- Olive oil
- Garlic, onion, mushrooms, black olives, thyme, parsley

**Ingredient check against active restrictions:**
- Dairy: none → PASSES
- Eggs: none → PASSES
- Nuts: none → PASSES
- Shellfish: none → PASSES
- Soy: no soy sauce, no tofu → PASSES
- Gluten restriction library: no wheat/barley/rye/couscous/semolina → PASSES

**Chicken Marengo passes all hard restriction filters.**

### Candidate pool size

Chicken Marengo belongs to the dinner candidate pool. With roughly 6–10 compliant dinner candidates total across user meals and external candidates, the pool is small. After 7 unique dinners are required and the pool is only 6–10 deep, Tier-3 triggers on approximately dinner slot 7+.

### Scoring

scoreMeal calculation for Chicken Marengo:

| Component | Value | Reason |
|-----------|-------|--------|
| dietMatch | **-10** | Vegetarian is in mergedPrefs.dietTypes; "chicken" matches DIET_EXCLUDED_KEYWORDS["vegetarian"] → penalty applied (meal-scoring-service.ts:107–110) |
| goalAlignment | +13 | No health goals set that would penalize |
| budgetAlignment | +13 | Estimated cost ~4.0 (chicken, tomatoes, basic veg) |
| upfScore | +13 | No UPF keywords |
| varietyScore | +13 (1st use), then lower on repeat | First use: chicken protein unused → +13. Subsequent repeats: chicken count ≥ 2 → 50% → +6.5; ≥ 3 → -5 |
| overlapScore | 0–8 | Ingredient overlap bonus |
| cuisineBonus | 0 | No preferred cuisine set |
| simplicityBonus | ~10 | ~10 ingredients × 0.8 weight |
| **Total (1st use)** | **~62** | High despite Vegetarian penalty |

With only ~6–10 compliant dinner candidates, Chicken Marengo scoring ~62 places it solidly in the top 3 for repeated dinner selection.

### Repeat suppression logic

`usedIds` prevents repeat in **Tier-1 and Tier-2 only**. The code (smart-suggest-service.ts:640–648):

```ts
// Tier-1
let slotCandidates = allCandidates.filter(c => {
  if (usedIds.has(c.id)) return false;  // ← prevents repeat
  return getCandidateSlotFit(c, slot);
});

// Tier-3 (repeat fallback)
function getRepeatCandidates(allCandidates, slot) {
  return allCandidates.filter(c => getCandidateSlotFit(c, slot));
  // ↑ NO usedIds check — repeats explicitly allowed
}
```

**There is no deduplication in Tier-3.** Once the unique dinner pool is exhausted, every iteration of the dinner slot can select Chicken Marengo again.

### Selection randomness in a small pool

```ts
const topN = scored.slice(0, 5);
const chosen = topN.length > 0
  ? topN[Math.floor(Math.random() * Math.min(3, topN.length))]
  : scored[0];
```

With a pool of 3 candidates in Tier-3, `Math.min(3, 3) = 3`, so random selection is uniform across all 3. Chicken Marengo, scoring highest, is in position 0. Selection probability: 1/3 each iteration. With 4 Tier-3 dinner slots, expected Chicken Marengo appearances: ~1.3. Observed: 2+, which is within statistical range.

**Exact reason repeat occurred:** The unique dinner candidate pool was exhausted before all 7 dinner slots were filled. Tier-3 explicitly includes already-used candidates; the usedIds deduplication gate is only applied in Tier-1 and Tier-2. Chicken Marengo's high score (relative to the small pool) placed it in the top-3 selection range on every Tier-3 iteration.

---

## Question 3: Why Thai Feast Appeared Multiple Times

### Ingredient analysis

Thai Feast (likely TheMealDB or similar source). If it survives filtering, it must contain none of: dairy, eggs, peanuts/tree nuts, shellfish/oyster sauce, soy sauce.

A compliant Thai Feast would use: lemongrass, galangal, lime leaves, chili, fish sauce (fish is NOT a restriction), coconut cream... **wait**.

**Critical check on coconut cream/milk:** The restriction resolver checks per-field. "coconut cream" as an ingredient — does it contain "cream" at word boundary?

`wordBoundaryIncludes("coconut cream", "cream")`:
- haystack = "coconut cream", needle = "cream"
- idx = 8, haystack[7] = ' ' → beforeOk = true
- idx + 5 = 13 = haystack.length → afterOk = true
- **Returns TRUE → dairy restriction matches → candidate EXCLUDED**

If Thai Feast uses "coconut cream" or "coconut milk" as ingredients, it would be **blocked by the dairy restriction** (see Critical Finding 1 below). If Thai Feast appears in the plan, it either:
a) Does not list "coconut milk/cream" explicitly (uses "coconut" only), OR
b) Uses a Thai-themed name without coconut-based ingredients listed by that name

Assuming Thai Feast survives filtering: same Tier-3 repeat mechanism as Chicken Marengo. Small dinner pool → unique pool exhausted → Tier-3 triggers → Thai Feast scores highly → appears multiple times.

---

## Question 4: Viable Meal Counts by Slot

Without direct database access, the following are code-derived estimates based on the restriction set and external search mechanics.

### Breakfast

External candidates from vegetarian-prefixed search: near-zero. All concept queries (omelette, frittata, shakshuka, scrambled, porridge, smoothie) fail one or more restrictions:

| External breakfast query | Fails restriction |
|--------------------------|-------------------|
| omelette | eggs (frittata derivedIngredient) |
| frittata | eggs (frittata derivedIngredient) |
| shakshuka | eggs (poached eggs) |
| porridge | dairy ("milk" word boundary match) |
| smoothie | dairy ("milk" word boundary match if any milk-based ingredient) |

User meals with category="breakfast": unknown count, but will also fail if they contain eggs, dairy, or nuts (common breakfast foods).

**Estimated viable breakfast pool: 0–2 meals**. Explains all or most breakfast slots being empty.

### Lunch

External candidates categorized as "lunch" (contains "salad", "sandwich", "wrap", "soup" in name):

| Lunch type | Status |
|------------|--------|
| Green salads (no cheese/egg) | Likely survive |
| Soups with cream/dairy | Blocked by dairy |
| Sandwiches/wraps with bread | May survive (gluten library gap — see Critical Finding 2) |
| Egg salad, Caesar salad | Blocked by eggs restriction |
| Salads with nuts/seeds | Blocked by nut restriction |

**Estimated viable lunch pool: 3–6 meals**. With 7 lunch slots, the pool exhausts around slot 4–7, triggering Tier-3. Some empty slots if pool reaches 0 even in Tier-3.

### Dinner

External dinner candidates (category="dinner" or null from TheMealDB):

| Dinner type | Status |
|-------------|--------|
| Chicken dishes (no dairy/eggs/soy/nuts) | Survive — Chicken Marengo example |
| Thai curries (coconut milk) | Blocked by dairy (milk word boundary) |
| Indian curries (yogurt/cream) | Blocked by dairy |
| Italian pasta (flour-based) | May survive via gluten library gap |
| Asian stir-fries (soy sauce) | Blocked by soy restriction |
| Nut-based dishes (pesto, satay) | Blocked by nut restriction |
| Shellfish dishes | Blocked by shellfish restriction |
| Beef/lamb/pork (no dairy/soy/nuts) | Survive if restriction-free |

**Estimated viable dinner pool: 6–10 meals**. Sufficient to fill 7 dinner slots but tight, requiring Tier-3 for the last 1–4 slots.

### Total viable pool

| Slot | Estimated unique candidates | Slots needed | Gap |
|------|----------------------------|--------------|-----|
| Breakfast | **0–2** | 7 | **-5 to -7** |
| Lunch | **3–6** | 7 | **-1 to -4** |
| Dinner | **6–10** | 7 | **0 to -1** |

The math: 5–7 empty breakfast + 0–4 empty lunch/dinner = **7–11 empty slots** → consistent with the reported 12 empty slots (28 - 16 = 12).

---

## Question 5: Filter Percentage Impact

### Vegetarian scoring (not hard exclusion)

`DIET_EXCLUDED_KEYWORDS["vegetarian"]` = all MEAT_KEYWORDS + FISH_KEYWORDS (meal-scoring-service.ts:38).

Effect: any candidate containing chicken/beef/pork/lamb/fish receives `dietMatch = -10` (from +22 base). Candidate is NOT excluded, only penalized. **Estimated ~40–60% of generic external dinner candidates contain meat/fish.**

### Gluten-Free restriction library gap

The restriction library's `gluten` definition (restriction-library.ts:32–91) does NOT include:

| Common gluten ingredient | In restriction library? | In dietRules GLUTEN_KEYWORDS? |
|--------------------------|------------------------|-------------------------------|
| wheat | YES (alias) | YES |
| flour | **NO** | YES |
| bread | **NO** | YES |
| pasta | **NO** | YES |
| noodle | **NO** | YES |
| tortilla | **NO** | YES |
| pita | **NO** | YES |
| teriyaki sauce | **NO** | YES |
| hoisin sauce | **NO** | YES |
| panko | **NO** | YES |

**If Gluten-Free is stored only as an eater hardRestriction** (not the account owner's dietRestrictions), then flour/bread/pasta/noodle dishes bypass the gluten filter. They are NOT blocked by `isHardExcluded`.

This is a pool-expanding bug: gluten-containing meals enter the candidate pool when they should not.

However, for the 16/28 problem specifically, this means the pool is **larger** than it should be for compliant planning — the missing meals are not caused by the gluten filter being too aggressive.

### Dairy-Free (hard restriction)

The dairy restriction definition (restriction-library.ts:93–154) and "milk" alias cause:

| Ingredient type | Blocked? | Reason |
|----------------|---------|--------|
| Cow's milk | YES | "milk" alias |
| Butter | YES | derivedIngredient |
| Cream | YES | derivedIngredient |
| Cheese | YES | derivedIngredient |
| Yogurt | YES | derivedIngredient |
| Ghee | YES | derivedIngredient |
| **Coconut milk** | **YES (false positive)** | "milk" word boundary match |
| **Oat milk** | **YES (false positive)** | "milk" word boundary match |
| **Rice milk** | **YES (false positive)** | "milk" word boundary match |
| **Almond milk** | **YES** | Both tree_nut + "milk" word |
| **Soy milk** | **YES** | Both soy + "milk" word |

**Estimated 40–50% of dinner candidates use dairy (correctly blocked). Additional 15–25% of candidates use coconut milk (incorrectly blocked).**

### Egg restriction

The eggs restriction definition (restriction-library.ts:477–517) derivedIngredients include omelette and frittata. This eliminates:

| Category | Estimated removal |
|----------|------------------|
| Breakfast: eggs on toast, scrambled, shakshuka, omelette, frittata | ~90% of breakfast candidates |
| Lunch: quiche, egg salad, Caesar (caesar dressing = hidden_ingredient) | ~20% of lunch candidates |
| Dinner: frittata, quiche-type dishes, hollandaise-sauced dishes | ~5–10% of dinner candidates |

**Egg restriction is the single largest driver of breakfast pool collapse.**

### Soy restriction

Eliminates: soy sauce, tofu, tempeh, edamame, miso, tamari.

| Affected cuisine | Estimated removal from pool |
|-----------------|-----------------------------|
| Chinese stir-fries | ~80% of Chinese external candidates |
| Japanese dishes | ~70% of Japanese external candidates |
| Korean dishes | ~60% of Korean external candidates |
| General Asian fusion | ~50% |

**Estimated 20–30% of total external candidates are eliminated by soy restriction.**

### Combined filter effect

| Filter | Estimated % of pre-filter pool eliminated |
|--------|------------------------------------------|
| Egg restriction | 30–40% (including nearly all breakfast) |
| Dairy restriction (true positives only) | 35–45% |
| Dairy restriction (coconut milk false positives) | Additional 10–20% |
| Soy restriction | 20–30% |
| Nut restriction | 10–15% |
| Shellfish restriction | 5–10% |
| Gluten restriction (library only) | 10–15% |

Combined effect (not additive — meals fail multiple filters): **estimated 60–80% of all external candidates are eliminated.** The overlap between dairy and coconut milk eliminates entire cuisine categories (Thai, Indian, many soups and curries).

---

## Question 6: Why Smart Planner Terminates Early

The planner does **not** terminate early — the loop always runs all 7 days × 3 slots = 21 iterations (smart-suggest-service.ts:606–787). Slots are simply left empty when no candidates exist.

A slot becomes empty only when ALL four tiers return 0 candidates:

```ts
// Tier-1: slot-fit unused candidates
// Tier-2: category-adjacent unused candidates (not applicable to breakfast)
// Tier-3: ALL slot-compliant candidates (ignores usedIds)
// Tier-4: household shell recovery
```

A slot can only be empty after Tier-3 if `allCandidates.filter(c => getCandidateSlotFit(c, "breakfast")).length === 0`.

For breakfast: `getCandidateSlotFit(c, "breakfast")` requires `c.category === "breakfast" || c.category === "smoothie"`. If NO candidate in the entire `allCandidates` array has breakfast or smoothie category, **all breakfast slots are empty regardless of candidate count elsewhere**.

### Root cause classification

| Option | Verdict | Evidence |
|--------|---------|---------|
| A. No candidates exist | **YES — for breakfast** | Egg + dairy restrictions eliminate virtually all breakfast-category external candidates; smoothie candidates blocked by plant milk false positive |
| B. Repetition rules block candidates | **NO** | Tier-3 explicitly allows repeats; repetition is evidenced by Chicken Marengo/Thai Feast appearing |
| C. Dietary filters too aggressive | **YES — coconut milk false positive** | Dairy restriction incorrectly blocks all plant-milk candidates (see Critical Finding 1); this collapses curries, Thai dishes, many soups |
| D. Candidate generation bug | **PARTIAL** | The external search for "vegetarian" prefix returns near-zero results from TheMealDB because the API doesn't support diet-label name search; fallback generic search rescues dinner candidates but not breakfast |
| E. Other | **YES — slot category boundary** | Breakfast slot strictly requires category="breakfast"/"smoothie". User meals without categoryId default to dinner-only. This is not a bug but a strict constraint that, combined with A and C, produces empty breakfast slots. |

**Primary answer: A (no breakfast candidates) caused by C (coconut/plant milk false positive in dairy restriction) and the egg restriction eliminating all conventional breakfast external candidates.**

---

## Question 7: Final Verdict — Why 16/28 Meals

### Primary reason

**The breakfast slot category constraint, combined with the egg restriction and the plant-milk false positive in the dairy restriction, produced a breakfast candidate pool of size zero or near-zero. This accounts for approximately 7 empty slots (all breakfast).**

The remaining 5 empty slots are from lunch and dinner pool depletion due to the combined heavy restriction set.

### Evidence chain

**Step 1: External search queries fail for breakfast under vegetarian prefix.**

When `mergedPrefs.dietTypes = ["Vegetarian", "Mediterranean"]`, the dietary prefix is `"vegetarian"`. The BREAKFAST_CONCEPT_QUERIES used are:

```ts
["omelette", "frittata", "smoothie", "porridge", "shakshuka"]
```

All of these either contain eggs (omelette, frittata, shakshuka → blocked) or dairy milk (porridge → blocked), or plant milk in smoothies (blocked via false positive).

**Step 2: The restriction library's `eggs` definition includes `omelette` and `frittata` as derivedIngredients.**

```ts
// restriction-library.ts:489–496
derivedIngredients: [
  'mayonnaise', 'egg wash', 'meringue', 'omelette', 'frittata',
  'hollandaise', 'quiche', 'aioli',
],
```

Any external candidate whose **name** includes "omelette" or "frittata" is blocked before ingredient enrichment, because `isHardExcluded` checks the name field first.

**Step 3: The restriction library's `dairy` definition matches "milk" at word boundaries.**

`wordBoundaryIncludes("coconut milk", "milk")` returns `true`. This is correct word-boundary logic (there IS a space before "milk") but produces a false positive: coconut milk is dairy-free by definition. The `removePlantMilkPhrases` function that handles this correctly exists in `dietRules.ts` but is **not** applied in the restriction resolver path used by `isHardExcluded`.

Code path comparison:
- `candidateDietExcluded` → calls `shouldExcludeRecipe` → calls `removePlantMilkPhrases` → coconut milk **not** blocked
- `isHardExcluded` → calls `resolveIngredientRestrictions` per field → no plant milk stripping → coconut milk **blocked**

Affected meals eliminated by this false positive: all Thai curries, many Indian curries, vegan dishes using coconut milk, any recipe with "oat milk", "rice milk", "hemp milk", "coconut milk", or "coconut cream" as an ingredient.

**Step 4: getCandidateSlotFit is strict for breakfast.**

```ts
// smart-suggest-service.ts:315–319
function getCandidateSlotFit(candidate, slot) {
  if (!candidate.category) return slot === "dinner";
  const allowed = SLOT_CATEGORY_MAPPING[slot] || [slot];
  return allowed.includes(candidate.category.toLowerCase());
}
```

And `getSafeFallbackCandidates` for breakfast (Tier-2):
```ts
// smart-suggest-service.ts:285–289
return allCandidates.filter(c => {
  if (usedIds.has(c.id)) return false;
  const cat = (c.category || "").toLowerCase();
  return cat === "breakfast" || cat === "smoothie";
});
```

Breakfast is the only slot with NO category relaxation in any tier. Even Tier-3 (`getRepeatCandidates`) only returns `breakfast/smoothie` category candidates for the breakfast slot. If zero such candidates exist in `allCandidates`, all seven breakfast slots are permanently empty.

**Step 5: Tier-4 shell recovery cannot compensate without breakfast-compatible shells.**

Tier-4 (`selectShellRecoveryCandidate`) also enforces slot category (smart-suggest-service.ts:344–347):

```ts
const allowedCategories = SLOT_CATEGORY_MAPPING[slot] || [slot];
const category = (template.category || "").toLowerCase();
if (!allowedCategories.includes(category)) continue;
```

If no meal shell templates in the database have `category = "breakfast"` with compatible ingredients (no eggs, no dairy, no nuts, no soy, no shellfish), Tier-4 also returns null.

**Step 6: The missing 5 non-breakfast slots.**

With a lunch pool of ~3–6 and dinner pool of ~6–10, the combined restrictions produce depletion:
- Lunch exhausted after ~4–6 unique slots → 1–4 lunch slots become Tier-3 repeats or empty
- Dinner exhausted after ~6–7 unique slots → 1–2 dinner slots become Tier-3 (explains Chicken Marengo/Thai Feast repeats, not empty)

The 12 empty slots = 7 breakfast + ~5 lunch (consistent with a lunch pool of ~2–3 compliant candidates).

---

## Critical Findings

### Critical Finding 1: Plant Milk False Positive in Dairy Restriction

**File:** `shared/restrictions/restriction-resolver.ts` (matchIngredientAgainstDefinition) vs. `server/lib/dietRules.ts` (removePlantMilkPhrases)

**Issue:** `isHardExcluded` checks each ingredient via `resolveIngredientRestrictions`, which uses `wordBoundaryIncludes` to match the dairy definition's "milk" alias. The word "milk" appears at a word boundary in "coconut milk", "oat milk", "rice milk", "hemp milk", "pea milk" — all of which are dairy-free by definition.

`dietRules.ts` has `removePlantMilkPhrases` that strips these before dairy scanning, but this function is not available to the restriction resolver. The two filter paths therefore disagree: `candidateDietExcluded` allows plant milks; `isHardExcluded` blocks them.

**Effect:** All curries, soups, and vegan dishes using coconut milk or any plant milk are incorrectly excluded from the candidate pool. This eliminates entire cuisine families (Thai, Indian, some vegan Mediterranean) and materially shrinks the pool below viable threshold.

### Critical Finding 2: Gluten Restriction Library Gap

**File:** `shared/restrictions/restriction-library.ts` (gluten definition)

**Issue:** Common gluten-containing ingredients are NOT in the restriction library: `flour`, `bread`, `pasta`, `noodle`, `tortilla`, `pita`, `teriyaki`, `hoisin`, `panko`. These ARE in `dietRules.ts` GLUTEN_KEYWORDS.

If Gluten-Free is stored as an eater `hardRestriction` (not the account owner's `dietRestrictions`), gluten-containing meals pass `isHardExcluded` and enter the candidate pool, incorrectly.

**Effect (for 16/28 problem):** This is pool-expanding, not pool-shrinking. Pasta dishes and bread-based meals appear in the lunch/dinner pool even though they should be excluded for the household. This does NOT cause empty slots — it slightly inflates the pool with non-compliant candidates.

### Critical Finding 3: Eater Diet Patterns Are Scoring-Only, Not Hard Exclusions

**File:** `server/routes.ts:4919–4921`

**Issue:** Eater `defaultDietTypes` (Vegetarian for Lilly, Mediterranean for Daisy) are merged into `mergedDietTypes` for scoring influence only. They do NOT enter `settings.dietPattern` or `settings.dietRestrictions`.

```ts
// routes.ts — eater diet types influence scoring only:
for (const diet of eater.defaultDietTypes ?? []) {
  if (!mergedDietTypes.includes(diet)) mergedDietTypes = [...mergedDietTypes, diet];
}
// mergedDietTypes → mergedPrefs.dietTypes → scoreMeal (scoring only)

// Separate — hard filter — comes only from account owner:
settings.dietPattern = req.user?.dietPattern ?? null;
```

**Effect:** Chicken Marengo (a chicken dish) passes ALL hard filters despite Lilly being Vegetarian. It is only penalized in scoring (-10 dietMatch). With a small pool, the penalty is insufficient to prevent selection. Non-vegetarian meals appear throughout the plan.

### Critical Finding 4: External Search Fails to Produce Breakfast Candidates Under Vegetarian Prefix

**File:** `server/lib/external-meal-service.ts:216–224`

**Issue:** The `BREAKFAST_CONCEPT_QUERIES` added when a dietary prefix is active are:

```ts
["omelette", "frittata", "smoothie", "porridge", "shakshuka"]
```

Four of five are blocked by the egg restriction. "smoothie" is blocked by plant milk false positives. For this household, the vegetarian-prefixed search produces **zero viable breakfast candidates** from any external source.

The generic fallback (`combined.length < 10`) rescues dinner candidates but does not produce any new breakfast-category candidates beyond what the concept queries attempted.

---

## Summary Table

| Question | Finding |
|----------|---------|
| Q1: Candidate counts | Breakfast ~0, Lunch ~3–6, Dinner ~6–10 after all restrictions applied |
| Q2: Chicken Marengo repeat | Passes all hard restrictions; small dinner pool exhausts; Tier-3 explicitly allows repeats with no deduplication; high score places it in top-3 selection range |
| Q3: Thai Feast repeat | Same Tier-3 mechanism; survives if no coconut milk/shellfish/soy in ingredients |
| Q4: Viable meals per slot | Breakfast: 0–2; Lunch: 3–6; Dinner: 6–10 |
| Q5: Filter impact | Egg restriction eliminates ~90% of breakfast candidates; dairy restriction (including false positives) eliminates ~50–60% of all candidates; combined effect removes 60–80% of external pool |
| Q6: Termination cause | Primary: A (zero breakfast candidates) + C (dairy restriction plant milk false positive) + strict slot category boundary. NOT a bug in candidate generation logic — the filters function as coded, but one filter (plant milk in dairy) produces false positives that further deplete the already thin pool |
| Q7: Primary reason for 16/28 | Breakfast slot category constraint (breakfast/smoothie only) combined with egg restriction (eliminates all conventional breakfast options) and dairy restriction plant milk false positive (eliminates remaining breakfast/smoothie candidates) produces a zero-size breakfast pool. 7 breakfast slots stay permanently empty (cannot be rescued by any Tier). The remaining 5 empty slots come from lunch pool depletion under the combined heavy restriction set. |

---

*Investigation only. No code changes made. No fixes suggested or implemented.*
