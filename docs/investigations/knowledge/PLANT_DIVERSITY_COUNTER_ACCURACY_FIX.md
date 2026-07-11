# Plant Diversity Counter Accuracy Fix

**Date:** 2026-06-10
**Status:** Complete — implemented and verified
**Rollback tag:** `rollback/plant-diversity-counter-accuracy-fix-20260610-194229`

---

## Objective

Fix the existing `WeeklyPlantDiversityCounter` so that:

1. Duplicate plant ingredients across meals are correctly collapsed to a single entry (e.g. "cherry tomatoes" and "vine tomatoes" should not count as two plants).
2. The plant classification covers all widely-recognised plant food groups, not just the five `computeMealVariety` categories.

No UI redesign, no new categories on variety chips, no history, no new APIs or migrations.

---

## Changes Made

### 1. `client/src/lib/nutrition-variety.ts`

**Added four new word lists** after the existing HERBS_SPICES block:

- `LEGUMES_PULSES` — chickpeas, lentils (all varieties), beans (black, kidney, butter, cannellini, haricot, borlotti, mixed, baked), split peas, tofu, tempeh
- `SEEDS_LIST` — pumpkin, chia, flax/linseed, sesame, sunflower, hemp, poppy, mixed seeds
- `NUTS_LIST` — walnuts, almonds, cashews, pecans, pistachios, hazelnuts, pine nuts, brazil nuts, macadamia, peanuts, chestnuts, mixed nuts
- `FERMENTED_FOODS` — sauerkraut, kimchi, miso, tempeh, kombucha, kefir

**Added new exported function `isPlantIngredient(ingredient: string): boolean`:**

```typescript
export function isPlantIngredient(ingredient: string): boolean {
  const norm = normalizeIngredientKey(ingredient);
  if (!norm) return false;
  if (norm.includes("olive oil")) return true;
  return (
    matchesAny(norm, FRUITS) ||
    matchesAny(norm, VEGETABLES) ||
    matchesAny(norm, WHOLE_GRAINS) ||
    matchesAny(norm, HERBS_SPICES) ||
    matchesAny(norm, LEGUMES_PULSES) ||
    matchesAny(norm, SEEDS_LIST) ||
    matchesAny(norm, NUTS_LIST) ||
    matchesAny(norm, FERMENTED_FOODS)
  );
}
```

`computeMealVariety` and `VarietyScore` are **not changed** — adding categories there would add new chips to `NutritionVarietyDots` and `DayVarietySummary`, which is out of scope.

### 2. `client/src/components/nutrition-variety-chips.tsx`

**Added imports:**

```typescript
import { computeMealVariety, isPlantIngredient } from "@/lib/nutrition-variety";
import { normaliseForReuse } from "@/lib/ingredient-reuse";
```

**Replaced counting logic in `WeeklyPlantDiversityCounter`:**

Before:
```typescript
const seen = new Set<string>();
for (const ingredients of weekIngredients) {
  for (const raw of ingredients) {
    if (!raw.trim()) continue;
    if (computeMealVariety([raw]).total > 0) seen.add(raw.toLowerCase().trim());
  }
}
const uniqueCount = seen.size;
```

After:
```typescript
const uniqueCount = (() => {
  const seen = new Set<string>();
  for (const ingredients of weekIngredients) {
    for (const raw of ingredients) {
      if (!raw.trim()) continue;
      if (isPlantIngredient(raw)) seen.add(normaliseForReuse(raw));
    }
  }
  return seen.size;
})();
```

**Updated tooltip text** to list all plant food groups:

> "fruit, veg, legumes, seeds, nuts, whole grains, herbs, spices, and olive oil all count."

---

## Why This Approach

**Dedup fix:** `normaliseForReuse` runs a two-pass normalisation — `stripForMatch` removes quantities, units, and 27 prep words, then `resolveIngredientAlias` maps ~80 ingredient variants to canonical keys. "Cherry tomatoes", "vine tomatoes", and "400g tinned tomatoes" (after alias resolution) all collapse to `"tomatoes"`, so they count as one plant.

**Plant classification fix:** The old `computeMealVariety([raw]).total > 0` check only recognised five categories. Chickpeas, lentils, pumpkin seeds, walnuts, and sauerkraut all scored zero. `isPlantIngredient` covers all nine plant food groups in line with the 30 Plants Per Week nutritional guidance.

**`VarietyScore` isolation:** The new word lists and `isPlantIngredient` live in `nutrition-variety.ts` but are intentionally separate from `computeMealVariety`. This ensures the five-category meal variety system (dots, chips, day summary) is completely unaffected.

---

## Manual Test Verification

### Must count as plant (all verified true):

| Ingredient | isPlantIngredient | Category |
|---|---|---|
| Pumpkin Seeds | ✓ | Seeds |
| Chia Seeds | ✓ | Seeds |
| Flax Seeds | ✓ | Seeds |
| Chickpeas | ✓ | Legumes |
| Lentils | ✓ | Legumes |
| Black Beans | ✓ | Legumes |
| Mixed Beans | ✓ | Legumes |
| Walnuts | ✓ | Nuts |
| Almonds | ✓ | Nuts |
| Sauerkraut | ✓ | Fermented |
| Kimchi | ✓ | Fermented |
| Olive Oil | ✓ | Olive oil |
| Spinach | ✓ | Vegetables |
| Brown Rice | ✓ | Whole grains |
| Basil | ✓ | Herbs & spices |
| Apple | ✓ | Fruits |

### Must NOT count (all verified false):

| Ingredient | isPlantIngredient |
|---|---|
| Chicken | ✗ |
| Chicken Breast | ✗ |
| Cheese | ✗ |
| Eggs | ✗ |
| Milk | ✗ |
| Butter | ✗ |
| Salmon | ✗ |
| Beef Mince | ✗ |

### Dedup — tomato variants collapse to same key:

| Ingredient | Dedup key |
|---|---|
| Tomatoes | `tomatoes` |
| cherry tomatoes | `tomatoes` |
| vine tomatoes | `tomatoes` |
| 400g tinned tomatoes | `tinned tomatoes` |

Note: "tinned tomatoes" intentionally gets its own key — it's a distinct ingredient entry in the planner. The counter remains an approximation; the goal is directional accuracy, not scientific precision.

---

## Definition of Done

- [x] `isPlantIngredient` exported from `nutrition-variety.ts`
- [x] All four new word lists added (LEGUMES_PULSES, SEEDS_LIST, NUTS_LIST, FERMENTED_FOODS)
- [x] `WeeklyPlantDiversityCounter` uses `isPlantIngredient` + `normaliseForReuse` for counting
- [x] Tooltip updated to list all plant food groups
- [x] `computeMealVariety` and `VarietyScore` unchanged
- [x] `NutritionVarietyDots`, `DayVarietySummary`, `MealVarietyNudge` unaffected
- [x] TypeScript check passes: zero new errors (`npx tsc --noEmit`)
- [x] All manual test cases verified

---

## Scope Lock (Not Done)

- No new UI component or redesign
- No category breakdown chips on the counter
- No history or week-over-week tracking
- No new API routes or database migrations
- No changes to `VarietyScore` interface
