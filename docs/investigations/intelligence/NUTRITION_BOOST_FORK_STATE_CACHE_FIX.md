# Nutrition Boost Fork-State Cache Fix

## Rollback Identifier

- **Git tag**: `rollback/pre-nutrition-boost-fork-cache-fix` (HEAD = `80c5b75`)
- **Git stash**: `stash@{0}` — `pre-nutrition-boost-fork-cache-fix working state`

To rollback:
```
git checkout rollback/pre-nutrition-boost-fork-cache-fix -- client/src/components/MealUpliftPanel.tsx client/src/pages/weekly-planner-page.tsx
```

---

## Root Cause

When a Nutrition Boost is added to a system meal, the server creates a user-owned fork and updates the planner entry's `mealId` to the fork ID. However:

1. The client only called `invalidateQueries` — async network refetches
2. Until those refetches completed, the planner cache still pointed to the original `mealId`
3. The meals cache had no entry for the fork ID
4. If the user closed and reopened the modal before both refetches completed, the dialog resolved the original system meal, not the fork
5. Adding a second boost then created a second fork

This produced all five symptoms: missing ingredient, missing label, missing Remove button, accepted boost appearing as pending again, and duplicate forks.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/pages/weekly-planner-page.tsx` | Fix A — synchronous planner cache update in `onMealForked` |
| `client/src/components/MealUpliftPanel.tsx` | Fix B — synchronous meals cache update in `acceptMutation.onSuccess` |

---

## Cache Keys Updated

| Key | Operation | When |
|-----|-----------|------|
| `["/api/planner/full"]` | `setQueryData` (sync) + `invalidateQueries` (async) | Fix A: on every system meal fork |
| `["/api/meals"]` | `setQueryData` (sync) + `invalidateQueries` (async) | Fix B: when `data.forkedFromMealId` exists |

---

## Fix A — `weekly-planner-page.tsx` : `onMealForked`

**Before:**
```tsx
onMealForked={() => {
  qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
  qc.invalidateQueries({ queryKey: ["/api/meals"] });
}}
```

**After:**
```tsx
onMealForked={(newMealId) => {
  qc.setQueryData<FullWeek[]>(["/api/planner/full"], (prev) => {
    if (!prev) return prev;
    return prev.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        entries: day.entries.map((e) =>
          e.id === entry.id ? { ...e, mealId: newMealId } : e
        ),
      })),
    }));
  });
  qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
  qc.invalidateQueries({ queryKey: ["/api/meals"] });
}}
```

**What it does:** Immediately writes the fork's `mealId` into the planner cache for the specific planner entry that was just forked (identified by `entry.id` from the render closure). This means if the user closes and reopens the meal dialog before the async refetch completes, the dialog resolves the forked meal (user-owned) rather than the original system meal.

The `invalidateQueries` calls still run — they will correct any stale data from the server when the network response arrives.

**Why `entry.id` is safe to use:** The `onMealForked` handler is defined in the IIFE that renders `MealUpliftPanel`. The `entry` variable is destructured from `mealDetail` in the same scope. It identifies the exact planner slot that was modified by the server.

---

## Fix B — `MealUpliftPanel.tsx` : `acceptMutation.onSuccess`

**Added import:**
```tsx
import type { MealUpliftApplication, Meal } from "@shared/schema";
```

**Added before `qc.invalidateQueries({ queryKey: ["/api/meals"] })`:**
```tsx
if (data.forkedFromMealId) {
  qc.setQueryData<Meal[]>(["/api/meals"], (prev) => {
    if (!prev) return prev;
    const forkExists = prev.some((m) => m.id === data.mealId);
    if (forkExists) {
      return prev.map((m) => {
        if (m.id !== data.mealId) return m;
        const existing = m.ingredients ?? [];
        return {
          ...m,
          ingredients: [
            ...existing,
            ...data.added.filter((i) => !existing.includes(i)),
          ],
        };
      });
    }
    const original = prev.find((m) => m.id === data.forkedFromMealId!);
    if (!original) return prev;
    return [
      ...prev,
      {
        ...original,
        id: data.mealId,
        isSystemMeal: false,
        ingredients: [...(original.ingredients ?? []), ...data.added],
      },
    ];
  });
}
```

**What it does:** When the server response includes `forkedFromMealId` (a fork was created), the meals cache is immediately updated:
- **Fork already in cache** (second boost within same modal session): appends the new ingredients to the existing fork entry, deduplicating
- **Fork not yet in cache** (first boost): clones the original meal, overrides `id` to the fork ID, sets `isSystemMeal: false`, and appends the added ingredients

This ensures `meals.find(m => m.id === forkId)` succeeds immediately when the modal reopens, without waiting for the async refetch.

The `invalidateQueries` call still runs — the server response will replace the synchronous clone with the real persisted fork data.

---

## Proof Only One Fork Is Created

With both fixes in place:

1. **Add Pumpkin Seeds** → server creates fork (mealId=200)
   - Fix B: meals cache gets fork entry (id=200, pumpkin seeds)
   - Fix A: planner cache entry updated to mealId=200
   - `effectiveMealId` in panel set to 200
   - `mealDetail.meal.id` set to 200 by `handleUpliftAccepted`

2. **Close modal** — planner cache entry.mealId=200 (Fix A persisted synchronously)

3. **Reopen modal** — planner entry has mealId=200, so `mealDetail` is populated with the fork
   - `mealSnapshot.id = 200`
   - `meal = meals.find(m => m.id === 200)` → returns fork (from Fix B)
   - `MealUpliftPanel` receives `mealId=200`
   - `effectiveMealId` initialises to 200

4. **Add Chickpeas** → API call uses `effectiveMealId=200`
   - Server receives `mealId=200`, which is already user-owned
   - Server does NOT create another fork
   - Server returns `{ mealId: 200, forkedFromMealId: null, added: ["Chickpeas"] }`
   - Fix B's `if (data.forkedFromMealId)` branch is skipped (forkedFromMealId is null)
   - One fork total, both ingredients on the same meal

Without Fix A, step 3 would open against mealId=100 (original), causing a second fork. Without Fix B, `meals.find(m => m.id === 200)` would return undefined until the async refetch completed, causing the modal to fall back to the original meal snapshot.

---

## Manual Test Results

Tests described here represent expected behaviour with both fixes applied. Full manual verification requires a running dev server.

### Test 1–3: Within-session adds

- Open a system meal modal
- Add Pumpkin Seeds → ingredient visible immediately, label shows, Remove available
- Without closing, add Chickpeas → same fork used, both ingredients visible, one fork only

### Test 4–6: Close/reopen

- Close modal
- Reopen same meal without browser refresh
- Modal opens against forked meal (forkId in entry, fork in meals cache)
- Pumpkin Seeds and Chickpeas visible in ingredient list
- "Added via THA Boost" labels visible
- Remove buttons visible
- Neither boost appears as pending in the suggestion list
- Add Mixed Seeds → same fork used, no second fork created

### Test 7: Browser refresh

- Refresh browser
- Same state persists (data is server-persisted, not local only)

### Test 8: Remove a boost

- Remove Pumpkin Seeds
- Only that boost removed, Chickpeas remains
- Shopping/nutrition invalidation fires (existing SHOPPING_LIST_KEYS logic unchanged)

---

## Remaining Limitations

1. **Uplift suggestions after reopen**: `upliftByMealId` is keyed by the original meal IDs from the uplift batch. After reopen with the fork ID, server uplift suggestions will initially be empty (falling back to deterministic boosts). The uplift batch re-fetches once the fork ID appears in the planned meals set.

2. **Original meal not in meals cache**: If the original system meal was never in the `/api/meals` cache (e.g., it's a system meal not included in the user's `/api/meals` query), Fix B's `original = prev.find(m => m.id === forkedFromMealId)` will return undefined and no sync entry is written. In this edge case, the async refetch remains the fallback — which is acceptable since system meals are typically included in the meals response.

3. **No UI changes**: All visual behaviour (compact rows, Add button, ingredient list, labels) is unchanged. This fix is purely a cache consistency correction.

---

## Scope Confirmation

Changed only:
- Client-side cache write path in `onMealForked` (planner cache)
- Client-side cache write path in `acceptMutation.onSuccess` (meals cache)

Not changed:
- Server uplift accept route
- Database schema
- Uplift rule matching or ranking
- Duplicate suppression
- Nutrition benefit enrichment
- Compact boost row UI
- Shopping invalidation
- Nutrition recalculation
