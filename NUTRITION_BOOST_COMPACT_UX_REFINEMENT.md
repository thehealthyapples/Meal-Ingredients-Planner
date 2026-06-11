# Nutrition Boost Compact UX Refinement

**Date:** 2026-06-11
**Status:** Complete
**Rollback tag:** `rollback/before-nutrition-boost-compact-ux-refinement`

See full report: `docs/investigations/NUTRITION_BOOST_COMPACT_UX_REFINEMENT.md`

---

## Summary

Three UX issues corrected in `MealUpliftPanel` and `weekly-planner-page`.

### Change 1 — Add button always visible

Row header split into expand-toggle (left) and Add button (right). Add is visible whether the row is collapsed or expanded. The expanded body no longer contains a duplicate button.

### Change 2 — Multiple rows expandable simultaneously

`expandedIngredient: string | null` → `expandedIngredients: Set<string>`. Each row independently toggles its own entry in the set.

### Change 3 — Added ingredient visible in meal ingredient list

**Root cause:** `mealDetail.meal` is a snapshot captured at dialog-open time. After acceptance, `qc.invalidateQueries(["/api/meals"])` triggers a refetch of the live `meals` query, but the dialog was reading the stale snapshot.

**Fix:** Dialog now resolves `meal` from the live `meals` query (`meals.find(m => m.id === mealSnapshot.id) ?? mealSnapshot`). Fork case handled by updating `mealDetail.meal.id` to the fork ID inside `handleUpliftAccepted`.

## Files changed

- `client/src/components/MealUpliftPanel.tsx`
- `client/src/pages/weekly-planner-page.tsx`
