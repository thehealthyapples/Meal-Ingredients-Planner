# Nutrition Boost Compact UX Refinement

**Date:** 2026-06-11
**Status:** Complete
**Rollback tag:** `rollback/before-nutrition-boost-compact-ux-refinement`

---

## Summary

Three UX issues were introduced by the previous compact accordion implementation. This investigation identifies root causes and documents all fixes applied.

---

## Issue 1 — Add button hidden until expansion

**Root cause:** The collapsed row was a single `<button>` containing only the ingredient name and chevron. The Add button was placed inside the expanded body, making it invisible unless the user first tapped to expand.

**Fix:** Split the row into two independent interactive targets:
- Left: a `<button>` spanning the ingredient name + chevron — tapping expands/collapses
- Right: an always-visible `Add` / `Added ✓` control in the row header

The Add button is now visible at all times, before and after expansion. The expanded body no longer contains a duplicate Add button.

**File:** `client/src/components/MealUpliftPanel.tsx`

---

## Issue 2 — Only one row could be expanded at a time

**Root cause:** Expansion state was `expandedIngredient: string | null`, which enforces single-row accordion semantics.

**Fix:** State changed to `expandedIngredients: Set<string>`. Each row independently toggles its own key in the set. Expanding one row no longer affects any other row.

**File:** `client/src/components/MealUpliftPanel.tsx`

---

## Issue 3 — Added ingredient not appearing in ingredient list

**Root cause:** The meal dialog reads `meal.ingredients` from `mealDetail.meal`, which is a snapshot captured at dialog-open time. When a boost is accepted:

1. Server updates `meal.ingredients` in the database ✓
2. `qc.invalidateQueries({ queryKey: ["/api/meals"] })` fires, triggering a background refetch ✓
3. The `meals` live query eventually updates with the new ingredient ✓
4. **But** `mealDetail.meal` is a stale snapshot and is never updated — so the dialog keeps rendering the old ingredient list ✗

**Fix (two-part):**

**Part A** — Live meal resolution (`weekly-planner-page.tsx` line ~2923):
```tsx
const { meal: mealSnapshot, ... } = mealDetail;
const meal = meals.find(m => m.id === mealSnapshot.id) ?? mealSnapshot;
```
The dialog now resolves `meal` from the live `meals` query. As soon as the query refetches after acceptance, the dialog automatically shows the updated ingredients.

**Part B** — Fork case (`handleUpliftAccepted`):
When a system meal is forked, the new fork has a different ID from the original. `mealSnapshot.id` would still point to the original system meal, so the live lookup would miss the fork. Fixed by updating `mealDetail.meal.id` to the fork ID inside `handleUpliftAccepted`, so the live lookup resolves the fork once the query refetches:
```ts
setMealDetail(prev => {
  if (!prev || prev.meal.id === mealId) return prev;
  return { ...prev, meal: { ...prev.meal, id: mealId } };
});
```

**Files:** `client/src/pages/weekly-planner-page.tsx`

**Data path unchanged:** Ingredient is written to the database through the existing `POST /api/uplift/accept` → `storage.updateMeal` flow. No new write paths added.

---

## Files changed

| File | Change |
|------|--------|
| `client/src/components/MealUpliftPanel.tsx` | Multi-expand set state; row header layout; Add button always visible; no Add in expanded body |
| `client/src/pages/weekly-planner-page.tsx` | Live meal resolution from `meals` query; fork-case mealDetail ID update |

---

## Preserved unchanged

- Uplift ranking and duplicate suppression
- Nutrition benefit enrichment (`getNutritionBenefit`)
- Shopping list invalidation (all four query keys)
- Nutrition recalculation callbacks
- Uplift provenance / accepted applications section
- Remove application flow
- `NutritionBoostPanel` — not touched

---

## Manual test checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Open meal with 5 boosts | Add button visible on every row before expanding |
| 2 | Expand 3 rows | All 3 remain expanded simultaneously |
| 3 | Collapse one of the 3 | Others stay expanded |
| 4 | Click Add on Pumpkin Seeds | Button becomes "Added ✓"; ingredient appears in meal ingredient list below after cache refetches |
| 5 | Verify shopping list | Shopping list reflects new ingredient |
| 6 | Verify nutrition | Nutrition data recalculates |
| 7 | Mobile | Compact rows usable; Add button visible at touch target size |

---

## Trust check

- Ingredient is only shown as Added after the server confirms acceptance (optimistic state `justAdded` set in `onSuccess`)
- UI does not imply addition before the API call succeeds
- `mergeUpliftIngredients` on the server prevents duplicate entries
- No second ingredient system created; existing `storage.updateMeal` path used throughout

---

## Suggestions (out of scope)

- Animate expand/collapse with `max-height` transition for smoother feel
- After `wasJustAdded`, auto-collapse the row so the "Added ✓" badge in the header is immediately visible
- Consider making the "Added ✓" state persistent across dialog close/reopen by reading from `activeApplications` rather than the session-scoped `justAdded` set
