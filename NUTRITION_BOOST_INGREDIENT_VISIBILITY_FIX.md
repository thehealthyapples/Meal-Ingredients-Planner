# Nutrition Boost — Ingredient Visibility Fix

**Date:** 2026-06-11
**Status:** Complete
**Rollback tag:** `rollback/before-nutrition-boost-ingredient-visibility-fix`

See full report: `docs/investigations/NUTRITION_BOOST_INGREDIENT_VISIBILITY_FIX.md`

---

## Root cause

Server write was correct throughout. The failure was entirely on the client display path.

`GET /api/meals` uses `staleTime: Infinity`. After `qc.invalidateQueries(["/api/meals"])`, the cache refetch is background and async. During the refetch round-trip, the modal's `meals.find(...)` still returns the pre-acceptance snapshot — so the ingredient list showed the old data.

Fork case additionally required `mealDetail.meal.id` to be updated to the fork ID.

## Fix

**Part A — Non-fork:** `qc.setQueryData<Meal[]>(["/api/meals"], ...)` synchronously appends the new ingredient to the cached meal entry before the network refetch lands. `meals.find(m => m.id === mealSnapshot.id)` picks it up on the same render tick.

**Part B — Fork + belt-and-braces:** `onUpliftAccepted` extended to pass `addedIngredients`. `handleUpliftAccepted` synchronously updates `mealDetail.meal.id` (fork ID) and `mealDetail.meal.ingredients` so the `?? mealSnapshot` fallback carries the correct data until the refetch adds the fork to the cache.

## Files changed

- `client/src/components/MealUpliftPanel.tsx`
- `client/src/pages/weekly-planner-page.tsx`
