# Nutrition Boost System Merge — Implementation Report

## Rollback Identifier

**Tag:** `pre-nutrition-boost-merge`  
**Commit at tag:** `1e83f32` (fix(smart-planner): Tier-3 controlled-repeat fallback for exhausted slot pools)

To rollback:
```
git checkout pre-nutrition-boost-merge
```
Note: the tag captures the HEAD commit only. The 6 pre-existing uncommitted file modifications in MealUpliftPanel.tsx, nutrition-variety-chips.tsx, nutrition-variety.ts, weekly-planner-page.tsx, package.json, and server/lib/household-meal-matcher.ts are not captured by the tag (they were already modified before this task began).

---

## Files Changed

### Modified
- `client/src/pages/weekly-planner-page.tsx`

### Not modified (preserved as-is)
- `client/src/lib/nutrition-boosts.ts` — source of deterministic boost data, unchanged
- `client/src/components/NutritionBoostPanel.tsx` — removed from render path, file preserved
- `client/src/components/MealUpliftPanel.tsx` — no changes required

---

## What Changed in weekly-planner-page.tsx

### Imports added
```typescript
import { getMealBoosts } from "@/lib/nutrition-boosts";
import { buildWeeklyReuseMap, normaliseForReuse } from "@/lib/ingredient-reuse";  // normaliseForReuse added
import { computeRestrictionSafety, type EaterProfile } from "@shared/restrictions/restriction-safety";
import { shouldExcludeRecipe } from "@/lib/dietRules";
```

### Import removed
```typescript
// was: import { NutritionBoostPanel } from "@/components/NutritionBoostPanel";
// replaced with:
import { getMealBoosts } from "@/lib/nutrition-boosts";
```

### New module-level function: `buildFallbackUpliftMatch()`

Added just before the `WeeklyPlannerPage` component (line 294).

```typescript
function buildFallbackUpliftMatch(
  mealName: string,
  ingredients: string[],
  householdEaters: HouseholdEater[],
  serverKeys: Set<string>,
): UpliftMatchResult | null
```

This function:
1. Calls `getMealBoosts(mealName, ingredients)` to get deterministic boost candidates
2. Applies the same household filtering as `NutritionBoostPanel` (hard restrictions via `computeRestrictionSafety`, diet patterns via `shouldExcludeRecipe`)
3. Deduplicates against server uplift suggestions using `normaliseForReuse()` key comparison
4. Returns a synthetic `UpliftMatchResult` compatible with `MealUpliftPanel`, or `null` if nothing remains

### Render section — replaced two panels with one

**Before:**
```tsx
{/* Nutrition Boosts — deterministic, meal-aware, no AI */}
<NutritionBoostPanel
  mealName={meal.name}
  ingredients={meal.ingredients ?? []}
  householdEaters={householdEaters}
/>

{/* Nutrition Boost — async uplift panel, shown only when matches exist */}
{(() => {
  const matches = upliftByMealId.get(meal.id) ?? [];
  if (matches.length === 0) return null;
  return <MealUpliftPanel upliftMatches={matches} ... />;
})()}
```

**After:**
```tsx
{/* Single Nutrition Boost panel — merges server uplift with deterministic fallback */}
{(() => {
  const serverMatches = upliftByMealId.get(meal.id) ?? [];
  const serverKeys = new Set(
    serverMatches.flatMap((m) => m.suggestions.map((s) => normaliseForReuse(s.ingredient)))
  );
  const fallbackMatch = buildFallbackUpliftMatch(meal.name, meal.ingredients ?? [], householdEaters, serverKeys);
  const mergedMatches = fallbackMatch ? [...serverMatches, fallbackMatch] : serverMatches;
  if (mergedMatches.length === 0) return null;
  return <MealUpliftPanel upliftMatches={mergedMatches} ... />;
})()}
```

---

## Old Boost Logic Reused

All logic from `NutritionBoostPanel.tsx` and `nutrition-boosts.ts` is preserved and reused:

| Component | What was reused |
|-----------|----------------|
| `getMealBoosts()` | Full function called unchanged — returns meal-type-matched candidates |
| `MEAL_TYPE_BOOSTS` | Used indirectly via `getMealBoosts()` |
| `BOOST_LIBRARY` | Used indirectly via `getMealBoosts()` |
| `FALLBACK_BOOSTS` | Used indirectly via `getMealBoosts()` |
| `computeRestrictionSafety` | Same household hard-restriction filter as `NutritionBoostPanel` |
| `shouldExcludeRecipe` | Same diet-pattern filter as `NutritionBoostPanel` |

---

## Duplicate Suppression Approach

Deduplication operates on **normalised ingredient keys** using `normaliseForReuse()` from `ingredient-reuse.ts`.

This function:
- Strips quantities, units, and prep words ("fresh", "dried", "organic", etc.)
- Resolves aliases via `resolveIngredientAlias()` from `@shared/ingredient-aliases`

Examples covered:
- `"Extra Virgin Olive Oil"` → `"olive oil"` — suppressed if server uplift contains "olive oil"
- `"Basil"` / `"fresh basil"` / `"dried basil"` — all normalise to `"basil"`
- `"Flax Seeds"` / `"flax seed"` / `"linseed"` — all normalise to `"flaxseed"`
- `"Chickpeas"` / `"garbanzo beans"` — both normalise to `"chickpeas"`

The fallback match is appended **after** server matches in the merged array. Within `MealUpliftPanel`, the existing reuse-aware ranking (`selectedReuse` + `selectedDiscovery`, max 2 shown initially) applies across all suggestions regardless of source.

---

## Add to Meal Verification

Fallback boost suggestions are passed to `MealUpliftPanel` as `UpliftSuggestion` objects with:
- `action: "add"` — renders as "Add [ingredient]"
- `ruleId: "fallback-deterministic-boosts"` — flows through the existing `/api/uplift/accept` endpoint

The `/api/uplift/accept` endpoint receives:
```json
{
  "mealId": ...,
  "plannerEntryId": ...,
  "suggestions": [{ "ruleId": "fallback-deterministic-boosts", "ingredient": "Pumpkin Seeds", "action": "add", ... }]
}
```

The server accept path does not require a pre-registered ruleId; it persists the ingredient addition and handles meal forking for system meals. The same add/undo/remove flow works for fallback suggestions as for server uplift suggestions.

Post-add paths preserved:
- Meal ingredients updated ✓
- Nutrition recalculation path (via meal invalidation) ✓
- Shopping list invalidation (`SHOPPING_LIST_KEYS`) ✓
- Provenance tracking (`/api/meals/:id/uplift-applications`) ✓
- Remove/undo support ✓

---

## Nutrition Benefit Display

Every ingredient in `BOOST_LIBRARY` has a matching entry in `nutrition-benefit-library.ts`. When `MealUpliftPanel` renders a fallback suggestion, `getNutritionBenefit(ingredient)` will find a match and display:
- Nutrient tags (e.g. "Magnesium · Zinc · Plant Protein")
- Benefit summary (e.g. "Rich in magnesium and zinc. Supports plant diversity.")

The `why` fallback text on `UpliftSuggestion` (e.g. "A nutritious seeds suggestion for this meal.") will only show if a benefit library match is not found — which should not occur for any current boost ingredient.

---

## Manual Test Guide

### Test 1 — Single panel only
Open a planner meal that previously showed two Nutrition Boost sections.
**Expected:** One `MealUpliftPanel` only. No separate passive list.

### Test 2 — Old-style suggestions visible
Open a meal like "Big Green Salad" (no server uplift).
**Expected:** Fallback boosts (e.g. Pumpkin Seeds, Chickpeas, Sauerkraut) appear in the single panel with nutrient tags and "Add to meal" buttons.

### Test 3 — Add to meal from fallback
Click "Add to meal" on a fallback-derived boost (e.g. Spinach on a Pasta dish).
**Expected:** Ingredient added to meal. No crash. Meal ingredient list refreshes. Shopping list invalidated.

### Test 4 — Duplicate suppression
Open a meal where server uplift already suggests "olive oil" or "spinach".
**Expected:** Fallback boost for the same ingredient does not appear as a second suggestion.

### Test 5 — Server uplift still works
Open a meal with server uplift matches.
**Expected:** Server-backed suggestions appear first, with normal behaviour. Fallback suggestions (if any) appear after, deduplicated.

### Test 6 — No server uplift, fallback only
Open a meal that has no server uplift matches but `getMealBoosts()` finds suggestions.
**Expected:** Panel renders with fallback suggestions. "Add to meal" works normally.

### Test 7 — Household restriction respected
With a nut-free household eater, open any meal.
**Expected:** Walnuts and Almonds do not appear in the panel.

### Test 8 — Mobile
Open a meal detail dialog on a narrow viewport.
**Expected:** Single panel remains readable and compact.

---

## Remaining Limitations

1. **Fallback boost suggestions do not carry quantity guidance.** Server uplift suggestions can include a `quantity` field (e.g. "1 tbsp"). Fallback suggestions have no quantity; `MealUpliftPanel` displays these without a quantity addendum, which is acceptable.

2. **"Added via THA Boost" label.** All accepted uplift applications (including fallback-derived ones) show "THA Boost" in the provenance section. This is accurate — no change needed.

3. **`NutritionBoostPanel.tsx` file is not deleted.** The file remains on disk to avoid accidental loss of the household-filtering logic (which was extracted into `buildFallbackUpliftMatch`). It is no longer imported anywhere in the render path. It can be deleted in a future cleanup commit once the merge is confirmed stable.

4. **`nutrition-boosts.ts` file is not deleted.** It is still used by `buildFallbackUpliftMatch` via `getMealBoosts()`. It should be retained.

---

## Suggestions (out of scope for this task)

- Delete `NutritionBoostPanel.tsx` once the merge is confirmed stable in production.
- Add a `quantity` field to some BOOST_LIBRARY entries to surface portion guidance (e.g. "1 tbsp" for chia seeds).
- Consider extending `MEAL_TYPE_BOOSTS` to cover more meal types as the recipe catalogue grows.
- Investigate whether `ruleId: "fallback-deterministic-boosts"` should be split per category for finer provenance tracking.

---

## Data Impact

| Area | Impact |
|------|--------|
| Reads existing data | Yes — reads meal ingredients to filter duplicates |
| Writes new data | Only when user clicks "Add to meal" — uses existing uplift accept path |
| Changes meaning of existing data | No |
| Requires backfill | No |
| Schema changes | No |
| Migration required | No |
