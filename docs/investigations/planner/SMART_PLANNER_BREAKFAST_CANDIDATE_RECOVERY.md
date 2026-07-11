# Smart Planner — Breakfast Candidate Recovery
**Session 6 — AMBER Implementation Report**
**Date:** 2026-06-08
**Risk level:** AMBER (two library files modified, no schema changes, no data changes)

---

## Rollback Identifier

```
git stash  # revert working-tree changes
```

Or revert to commit immediately before this work:

```
git checkout cea6e2b -- server/lib/dietRules.ts server/lib/external-meal-service.ts
```

Rollback point: `cea6e2b` — `fix(smart-planner): exclude component recipes from candidate pool`

---

## Problem Statement

Smart Planner breakfast candidate pools were collapsing for Vegan and Keto plans. Three compounding root causes were identified across Sessions 3–5:

1. **Plant milk false positive** — `DAIRY_KEYWORDS` contains `"milk"` matched via word-boundary regex (`\b`). This correctly catches "cow milk" and "whole milk", but also matches "almond milk", "oat milk", "soy milk", "coconut milk", and other plant-based milks — excluding vegan-compliant recipes from the Vegan pool.

2. **TheMealDB label queries return zero results** — Prefixed searches like "keto omelette" and "vegan smoothie" return 0 results from TheMealDB because it is a name-indexed database with no diet-labelled recipes. The external search machinery was running queries that would always fail.

3. **Breakfast classification gap** — `inferCategoryFromCuisineAndName()` recognised only 6 breakfast terms. Common breakfast dishes like frittata, shakshuka, scrambled eggs, overnight oats, and acai bowls were assigned null category and defaulted to the dinner slot, making them invisible to breakfast slot filling.

---

## Scope

Per Session 6 scope lock:

**Implemented:**
- (A) Plant milk false-positive fix in `dietRules.ts`
- (B) Concept-based breakfast discovery in `external-meal-service.ts`
- (C) Breakfast classification expansion in `external-meal-service.ts`

**Not implemented (explicitly out of scope):**
- Meal repeats / `includeLeftovers` dead code
- Freezer planning
- Meal-intent architecture
- New scoring systems
- New database tables or schema changes
- External backfill architecture redesign

---

## Files Changed

### `server/lib/dietRules.ts`

**Change 1 — Added `PLANT_MILK_PHRASES` constant and `removePlantMilkPhrases()` helper**

Added before the `// ─── Helpers ───` section:

```typescript
const PLANT_MILK_PHRASES = [
  "almond milk", "oat milk", "soy milk", "soya milk", "coconut milk",
  "plant milk", "plant-based milk", "rice milk", "hemp milk", "cashew milk",
  "hazelnut milk", "pea milk", "macadamia milk", "oat mylk",
];

function removePlantMilkPhrases(text: string): string {
  let result = text;
  for (const phrase of PLANT_MILK_PHRASES) {
    result = result.split(phrase).join(" ");
  }
  return result;
}
```

14 plant-based milk compound phrases stripped by string replacement (not regex) before dairy keyword scanning runs.

**Change 2 — Fixed `Dairy-Free` restriction check**

```typescript
// Before:
if (dietRestrictions.includes("Dairy-Free")) {
  if (containsAny(lower, DAIRY_KEYWORDS)) return true;
}

// After:
if (dietRestrictions.includes("Dairy-Free")) {
  if (containsAny(removePlantMilkPhrases(lower), DAIRY_KEYWORDS)) return true;
}
```

**Change 3 — Fixed Vegan case**

Converted `case "Vegan":` to a block to allow `const`. Plant milk phrases stripped from a separate variable used only for the dairy scan; all other exclusion checks (meat, fish, egg, honey, dish names) run on the original unmodified text.

```typescript
case "Vegan": {
  const dairyCheckText = removePlantMilkPhrases(lower);
  return (
    containsAny(lower, MEAT_KEYWORDS) ||
    containsAny(lower, FISH_SEAFOOD_KEYWORDS) ||
    containsAny(dairyCheckText, DAIRY_KEYWORDS) ||
    containsAny(lower, ["egg", "eggs", "honey", "gelatin", "gelatine"]) ||
    containsAny(lower, DISH_NAME_MEAT_OR_SEAFOOD)
  );
}
```

---

### `server/lib/external-meal-service.ts`

**Change 1 — Expanded `inferCategoryFromCuisineAndName()`**

Added 5 breakfast terms to the breakfast classification block:

| Term | Dish type | Previously classified as |
|---|---|---|
| `frittata` | Italian baked egg dish | null → dinner slot |
| `shakshuka` | Eggs poached in spiced tomato sauce | null → dinner slot |
| `scrambled` | Scrambled eggs variants | null → dinner slot |
| `overnight oats` | Cold-prepared oat breakfast | null → dinner slot |
| `acai` | Acai bowl / breakfast bowl | null → dinner slot |

Previously recognised: breakfast, pancake, omelette, porridge, granola, smoothie (6 terms).
Now recognises 11 terms total.

**Change 2 — Added concept queries to `searchMealDB()`**

When `dietaryPrefix` is set (i.e. a diet like Vegan or Keto is active), TheMealDB now receives:
- 3 labelled queries (e.g. `"keto chicken"`, `"keto salad"`, `"keto soup"`) — reduced from 5
- 5 concept queries without prefix (`"omelette"`, `"frittata"`, `"smoothie"`, `"porridge"`, `"shakshuka"`)

**Total TheMealDB queries when diet active:** 8 (up from 5)

**Rationale:** TheMealDB has no diet-labelled recipes. "keto omelette" returns 0 results; "omelette" returns real recipes that `dietRules.shouldExcludeRecipe()` then validates post-enrichment.

```typescript
const BREAKFAST_CONCEPT_QUERIES = ["omelette", "frittata", "smoothie", "porridge", "shakshuka"];

const labelledQueries = filters.dietaryPrefix
  ? rawQueries.slice(0, 3).map(q => `${filters.dietaryPrefix} ${q}`)
  : rawQueries.slice(0, 5);

const queries = filters.dietaryPrefix
  ? [...labelledQueries, ...BREAKFAST_CONCEPT_QUERIES]
  : labelledQueries;
```

**Change 3 — Added concept queries to `buildSearchQueries()`**

When `dietaryPrefix` is set, the queries used by BBC Good Food, AllRecipes, Jamie Oliver, and Serious Eats now include:

- Up to 3 labelled terms (e.g. `"vegan healthy dinner"`)
- 3 concept terms: `"omelette"`, `"overnight oats"`, `"smoothie bowl"`
- Total capped at 5

```typescript
if (filters.dietaryPrefix) {
  const labelledTerms = terms.map(q => `${filters.dietaryPrefix} ${q}`);
  const conceptTerms = ["omelette", "overnight oats", "smoothie bowl"];
  return [...labelledTerms, ...conceptTerms].slice(0, 5);
}
```

---

## Verification Trace

### Database breakfast pool (query date: 2026-06-08)

| Metric | Count |
|---|---|
| Total breakfast-category meals (DB) | 38 |
| Breakfast meals with plant milk phrases in name/ingredients | **0** |
| Breakfast meals excluded by DAIRY keywords (old Vegan logic) | 11 |
| Breakfast meals excluded by DAIRY keywords (new Vegan logic) | 11 |
| Breakfast meals passing Vegan filter — BEFORE fix | **18** |
| Breakfast meals passing Vegan filter — AFTER fix | **18** |

**DB impact of plant milk fix: 0 additional meals unlocked.**

This is expected. The existing recipe library does not contain meals with explicit plant-milk ingredient entries like "almond milk" or "oat milk" as separate ingredients. The 11 dairy-excluded breakfast meals are excluded for other dairy reasons (yogurt, cream, butter, cheese) that the fix correctly leaves untouched.

### Where the plant milk fix has real impact

The fix protects **future external candidate meals** fetched from TheMealDB, BBC Good Food, AllRecipes, Jamie Oliver, and Serious Eats during generation. When external searches return recipes like:
- "Almond milk chia pudding" → now correctly passes Vegan filter (was incorrectly excluded)
- "Oat milk overnight oats" → now correctly passes Vegan filter (was incorrectly excluded)
- "Coconut milk breakfast bowl" → now correctly passes Vegan filter (was incorrectly excluded)

These meals are transient (not persisted) and cannot be counted in advance. Their availability depends on live search results at generation time.

### Keto breakfast pool analysis

| Metric | Count |
|---|---|
| Total breakfast-category meals (DB) | 38 |
| Keto-excluded (bakery/dough keywords) | 11 |
| Keto-excluded (grain/cereal keywords) | 7 |
| Keto-excluded (sugar/sweetener keywords) | 4 |
| Keto-excluded (high-carb fruit keywords) | 2 |
| Breakfast meals passing Keto filter | **18** |

Note: Many of these 18 "passing" meals have minimal ingredient data (ingredient = just the meal name). The dietRules.ts check is as accurate as the ingredient data provided. This is a pre-existing data quality issue, not a regression.

---

## Regression Tests

New file: `server/tests/test-plant-milk-vegan.ts`

**27 tests, 27 passed.**

Coverage:
- 7 plant milk variants → correctly pass Vegan filter (were false-positives before fix)
- 5 dairy milk variants → correctly still fail Vegan filter
- 4 plant milk variants → correctly pass Dairy-Free restriction
- 6 edge cases → other Vegan exclusions unaffected by plant milk fix
- 5 Keto breakfast concepts → not excluded by Keto (omelette, frittata, scrambled, shakshuka, avocado)

Sample output:
```
── Plant milks — must pass Vegan filter ──
  ✓ Almond milk chia pudding: NOT excluded by Vegan
  ✓ Oat milk overnight oats: NOT excluded by Vegan
  ✓ Soy milk smoothie: NOT excluded by Vegan
  ✓ Coconut milk porridge: NOT excluded by Vegan

── Vegan exclusions not affected by plant milk fix ──
  ✓ Prawn curry with coconut milk: EXCLUDED by Vegan (prawns)
  ✓ Cheese omelette: EXCLUDED by Vegan (eggs + cheese)
  ✓ Chicken stir-fry with oat milk: EXCLUDED by Vegan (chicken)

PLANT MILK VEGAN TESTS: 27 passed, 0 failed
```

---

## Build and Test Results

| Check | Result |
|---|---|
| `npm run build` | PASS — client + server built, 0 errors |
| `npx tsc --noEmit` | PASS — 0 type errors |
| `npm test` (full suite) | PASS — all test files pass |
| `test-plant-milk-vegan.ts` (new) | PASS — 27/27 |

Full test suite summary:
- `test-smart-suggest-diet-pattern`: 13/13 passed
- `test-diet-reconciliation-bridge`: 12/12 passed
- Keto/Low-Carb dictionary tests: 18/18 passed
- Dietary pattern compliance tests: 76/76 passed
- Planner compliance gate: 25/25 passed

---

## Summary of Impact

| Fix | Expected effect |
|---|---|
| Plant milk false-positive fix | External candidates with plant milk in name/ingredients now pass Vegan and Dairy-Free filter. DB pool unchanged (0 affected). |
| Breakfast concept queries in `searchMealDB()` | 5 concept queries added per Vegan/Keto generation: omelette, frittata, smoothie, porridge, shakshuka. TheMealDB returns real recipes for these terms (unlike labelled queries which return 0). |
| Breakfast concept queries in `buildSearchQueries()` | 3 concept queries added per Vegan/Keto generation for BBC/AllRecipes/Jamie Oliver/Serious Eats: omelette, overnight oats, smoothie bowl. |
| Breakfast classification expansion | 5 new terms recognised as breakfast: frittata, shakshuka, scrambled, overnight oats, acai. External candidates with these names are now routed to breakfast slot rather than defaulting to dinner. |

These changes together increase the probability that a Vegan or Keto Smart Plan generation has sufficient breakfast candidates to fill all 7 breakfast slots. The DB-only pool for these diets remains at ~18 breakfast-compatible meals (many with inadequate ingredient data), but the external search expansion provides a runtime supplement of correctly-classified, diet-validated breakfast options.

---

## Known Limitations

1. **DB ingredient data quality**: ~50% of breakfast-category meals store only the meal name as their sole ingredient. dietRules.ts filtering is only as accurate as the ingredient data. This is a pre-existing issue not addressed here.

2. **`usedIds` still unconditional**: The per-generation deduplication set is never reset. A 7-day Vegan or Keto plan can still exhaust the breakfast candidate pool by day 3–4. This was explicitly out of scope for this session.

3. **External search is not slot-targeted**: The `category` parameter accepted by `fetchExternalCandidates()` is not used in query construction. Concept queries are a workaround, not a full solution. Slot-targeted external search was out of scope.

4. **`scoreRecipeForDiet()` still unused**: This function exists in `dietRules.ts` but is never called by Smart Planner scoring. Dietary alignment is binary (exclude or pass) rather than scored. Out of scope.
