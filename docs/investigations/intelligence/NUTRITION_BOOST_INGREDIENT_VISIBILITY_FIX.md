# Nutrition Boost — Ingredient Visibility Fix

**Date:** 2026-06-11
**Status:** Complete
**Rollback tag:** `rollback/before-nutrition-boost-ingredient-visibility-fix`

---

## Objective

When a user clicks **Add** on a Nutrition Boost inside the meal detail modal, the accepted ingredient must appear in the modal's ingredient list immediately — no close/reopen, no manual refresh.

---

## End-to-end flow trace

| Step | Component | Verdict |
|------|-----------|---------|
| 1. User clicks Add | `MealUpliftPanel` row button | ✓ fires `acceptMutation.mutate(suggestion)` |
| 2. POST /api/uplift/accept | `MealUpliftPanel` → server | ✓ request sent with correct payload |
| 3. Server receives request | `routes.ts` `/api/uplift/accept` | ✓ authenticated, mealId validated |
| 4. Server writes ingredient | `storage.updateMeal(meal.id, { ingredients: merged })` | ✓ `mergeUpliftIngredients` deduplicates then persists |
| 5. Client invalidates cache | `qc.invalidateQueries(["/api/meals"])` | ✓ fires in `onSuccess` |
| 6. Modal resolves meal | `meals.find(m => m.id === mealSnapshot.id) ?? mealSnapshot` | ✗ — reads stale cache until refetch lands |
| 7. Ingredient list renders | `meal.ingredients.map(...)` | ✗ — shows old list during refetch gap |

**Server write is correct throughout.** The failure is entirely on the client display path.

---

## Root cause

### Primary: stale cache gap

`GET /api/meals` is configured with `staleTime: Infinity`. When `qc.invalidateQueries(["/api/meals"])` fires, it marks the query stale and triggers a **background** refetch. During the round-trip time of that refetch (typically 100–500ms), the `meals` array in memory is still the pre-acceptance snapshot.

The dialog resolves the displayed `meal` from this array:
```tsx
const meal = meals.find(m => m.id === mealSnapshot.id) ?? mealSnapshot;
```

So the ingredient list shows old data until the network round-trip completes.

### Secondary: fork case ID mismatch

When the boosted meal is a system meal, it is forked server-side. The fork has a **new ID** (`data.mealId !== original id`). `meals.find(m => m.id === forkId)` returns `undefined` until the refetch adds the fork to the cache. The `mealSnapshot` fallback still holds the original ID and old ingredients.

---

## Fix

### Part A — Immediate cache update (non-fork case)

In `MealUpliftPanel.onSuccess`, before calling `invalidateQueries`, synchronously update the `/api/meals` cache entry via `qc.setQueryData`:

```ts
if (!data.forkedFromMealId && data.added.length > 0) {
  qc.setQueryData<Meal[]>(["/api/meals"], (old = []) =>
    old.map((m) =>
      m.id === data.mealId
        ? { ...m, ingredients: [...(m.ingredients ?? []), ...data.added] }
        : m
    )
  );
}
```

`meals.find(m => m.id === mealSnapshot.id)` now returns the updated meal on the same render tick as the acceptance. No network wait. The subsequent `invalidateQueries` still runs as a background sync to confirm server state.

### Part B — Immediate mealDetail update (fork case + belt-and-braces)

`onUpliftAccepted` callback signature extended to include `addedIngredients: string[]`.

In `weekly-planner-page.tsx` `handleUpliftAccepted`, synchronously update `mealDetail.meal`:

```ts
setMealDetail(prev => {
  if (!prev) return prev;
  const currentIngredients = prev.meal.ingredients ?? [];
  const deduped = addedIngredients.filter(
    a => !currentIngredients.some(i => i.toLowerCase() === a.toLowerCase())
  );
  if (prev.meal.id === mealId && deduped.length === 0) return prev;
  return {
    ...prev,
    meal: {
      ...prev.meal,
      id: mealId,                // fork: updates to new fork ID
      ingredients: deduped.length > 0
        ? [...currentIngredients, ...deduped]
        : currentIngredients,
    },
  };
});
```

For **non-fork**: `mealId === prev.meal.id`; only ingredients are appended. If Part A's `setQueryData` already made `meals.find` return the updated meal, this is belt-and-braces; otherwise it handles the case where `/api/meals` wasn't populated yet.

For **fork**: `mealId !== prev.meal.id`; both ID and ingredients are updated. The `meals.find(m => m.id === forkId)` falls back to `mealSnapshot`, which now has the correct fork ID and new ingredient. When the background refetch completes, `meals.find` returns the authoritative fork from the server.

---

## Trust check

| Check | Status |
|-------|--------|
| Ingredient shown only after server confirms (`onSuccess`) | ✓ — `setQueryData` and `setMealDetail` only called inside `onSuccess` |
| No fake/optimistic add before server response | ✓ |
| Duplicate ingredient prevention | ✓ server: `mergeUpliftIngredients`; client: `deduped` filter in `handleUpliftAccepted` |
| Fork case shows fork ingredients | ✓ — mealDetail updated to fork ID + ingredients |

---

## Files changed

| File | Change |
|------|--------|
| `client/src/components/MealUpliftPanel.tsx` | Import `Meal`; `onUpliftAccepted` signature adds `addedIngredients`; `setQueryData` immediate cache update in `onSuccess`; pass `data.added` to callback |
| `client/src/pages/weekly-planner-page.tsx` | `handleUpliftAccepted` receives `addedIngredients`; synchronously updates `mealDetail.meal.id` and `mealDetail.meal.ingredients` |

---

## Unchanged

- Server write path (`POST /api/uplift/accept`)
- `mergeUpliftIngredients` deduplication
- Shopping list invalidation
- Nutrition recalculation callbacks
- Uplift provenance (accepted applications section)
- `qc.invalidateQueries(["/api/meals"])` still fires (background sync)
- Compact row expansion behaviour
- Ranking and duplicate suppression
- `NutritionBoostPanel` — untouched

---

## Manual test checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Open meal detail modal | Ingredient list shows existing ingredients |
| 2 | Click Add on Pumpkin Seeds | "Pumpkin Seeds" appears in ingredient list immediately (same modal, no reload) |
| 3 | Click Add on Chickpeas | "Chickpeas" also appears; "Pumpkin Seeds" remains |
| 4 | Close modal, reopen same meal | Both added ingredients still visible |
| 5 | System meal fork case | Modal shows forked meal ingredient list including the boost |
| 6 | Shopping list | Added boost ingredient appears as expected |
| 7 | Nutrition | Recalculation path still triggers |

---

## Suggestions (out of scope)

- Auto-collapse the boost row after Add succeeds, so the "Added ✓" badge is visible without the row remaining open
- Animate the new ingredient appearing in the list (fade-in) to make the addition obvious
- Show a subtle "ingredient added" toast for users who may not see the list scroll
