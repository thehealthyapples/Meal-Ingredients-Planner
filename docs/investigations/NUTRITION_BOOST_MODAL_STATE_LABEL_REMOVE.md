# NUTRITION_BOOST_MODAL_STATE_LABEL_REMOVE

## Rollback Identifier

Tag: `rollback-before-boost-modal-state-label-remove` at commit `80c5b75`

To rollback: `git checkout rollback-before-boost-modal-state-label-remove`

---

## Objective

Fix the meal detail modal so that after a Nutrition Boost ingredient is accepted:

1. The ingredient appears **immediately** in the ingredient list (no refresh required)
2. The ingredient is labelled **"Added via Nutrition Boost"**
3. A **Remove** action appears inline with the ingredient
4. Remove safely strips the ingredient and provenance

---

## Root Cause

### Why ingredients didn't immediately update

The meal detail dialog in `weekly-planner-page.tsx` already had two synchronous mechanisms in `acceptMutation.onSuccess` (inside `MealUpliftPanel`):

- `qc.setQueryData(["/api/meals"])` to immediately update the ingredients list in the React Query cache
- `onUpliftAccepted(mealId, addedIngredients)` → `setMealDetail(...)` to update the dialog's local snapshot

These were in place since commit `80c5b75`. The immediate ingredient update was **already working**.

### Why labels and remove buttons were absent from the ingredient list

The `activeApplications` provenance data (from `GET /api/meals/:id/uplift-applications`) was only loaded and rendered **inside** `MealUpliftPanel`. The accordion section in the panel showed "Added via THA Boost" labels with remove buttons — but only inside the collapsible panel, not in the main ingredient list.

The main ingredient list in the dialog (lines ~3600–3650) rendered every ingredient as a plain bullet point with no awareness of uplift provenance.

### Why the panel label did not appear immediately after Add

`MealUpliftPanel.acceptMutation.onSuccess` called `qc.invalidateQueries` for the applications cache (triggering a background refetch) but did NOT call `setQueryData` first. The panel's "Added via THA Boost" section therefore only appeared after the background refetch returned — 1–2 network round-trips after the Add button click.

The server response from `POST /api/uplift/accept` already returns the full `applications` array, so we had all the data needed for an immediate cache update, we just weren't using it.

---

## Implementation Approach

### 1. MealUpliftPanel.tsx — immediate applications cache update

Updated the `acceptMutation.mutationFn` return type to include `applications: MealUpliftApplication[]` (the server already returns this).

In `acceptMutation.onSuccess`, added a `qc.setQueryData` call **before** the invalidation:

```ts
if (data.applications?.length) {
  qc.setQueryData<MealUpliftApplication[]>(
    ["/api/meals", data.mealId, "uplift-applications"],
    (old = []) => [...old, ...data.applications]
  );
}
```

This means the applications cache is immediately populated from the server response — no round-trip wait before the panel shows the accepted ingredient.

### 2. weekly-planner-page.tsx — applications query at dialog level

Added a `useQuery` for uplift applications keyed on `mealDetail?.meal.id`:

```ts
const { data: mealDetailApplications = [] } = useQuery<MealUpliftApplication[]>({
  queryKey: ["/api/meals", mealDetail?.meal.id, "uplift-applications"],
  queryFn: ...,
  enabled: !!mealDetail,
  staleTime: 30_000,
});
```

Shares the same React Query cache key as MealUpliftPanel's internal query. When MealUpliftPanel calls `setQueryData` after accept, this query immediately reflects the update with zero extra network calls.

### 3. weekly-planner-page.tsx — remove mutation at dialog level

Added `removeBoostFromDialogMutation` with optimistic update:

- Immediately marks the application as `removed` in the cache
- Immediately removes the ingredient from `mealDetail` and `/api/meals` cache
- On success: invalidates applications, meals, and shopping list queries
- On error: invalidates to re-sync state

### 4. weekly-planner-page.tsx — annotate ingredient list

In the IIFE that renders the ingredient rows (inside the "Ingredients" section of the dialog), the `else` branch (plain ingredient) was updated to check for a matching boost application:

```ts
const boostApp = boostAcceptedApplications.find(
  a => a.ingredient.toLowerCase().trim() === ing.toLowerCase().trim()
);
```

If found: renders ingredient name + "Added via Nutrition Boost" label + Remove button inline.
If not found: renders as before (plain bullet point, no change).

---

## Provenance / Label Source

- Data source: `GET /api/meals/:mealId/uplift-applications`
- Filter: `status === "accepted"` only (not `duplicate_skipped`, not `removed`)
- Shared React Query cache key with MealUpliftPanel — no duplicate network requests
- Label only appears after server confirms the add (not before `acceptMutation.onSuccess`)

---

## Safety — Why Remove Is Safe

The DELETE endpoint (`/api/uplift/applications/:id`) already:
1. Verifies ownership of the meal
2. Removes the ingredient from the meal's ingredient list
3. Marks the application as `removed` (preserving audit history)

The dialog-level remove mutation looks up the application by ID from the server-confirmed provenance data. It cannot match original recipe ingredients because:
- Only ingredients with a confirmed `status === "accepted"` application are shown with the remove action
- Original recipe ingredients have no uplift application records
- The match is by application `id`, not by ingredient name guessing

For system meal forks: the fork creates a new meal with a new `mealId`. Applications are created against the forked meal ID. `mealDetail.meal.id` tracks the forked ID (updated by `handleUpliftAccepted`). The query and remove mutation both use `mealDetail.meal.id`, so they correctly target the fork.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/MealUpliftPanel.tsx` | Updated accept mutation return type; added `setQueryData` for applications after accept |
| `client/src/pages/weekly-planner-page.tsx` | Added `MealUpliftApplication` import; added uplift applications query + remove mutation; annotated ingredient list with boost labels + remove buttons |

---

## Trust Check

| Check | Status |
|-------|--------|
| Label appears only after server confirms add | ✓ — set in `acceptMutation.onSuccess`, not `onMutate` |
| Ingredient appears immediately in modal | ✓ — existing `setQueryData` + `setMealDetail` in `handleUpliftAccepted` |
| Remove only appears for boost-accepted ingredients | ✓ — filtered by `status === "accepted"` from provenance data |
| Remove does not delete original recipe ingredients | ✓ — only shown when `status === "accepted"` application exists |
| Remove does not create duplicate state | ✓ — optimistic update + invalidate pattern |
| Forked system meals handled correctly | ✓ — `mealDetail.meal.id` updated to forked ID via `handleUpliftAccepted` |

---

## What is NOT Changed

- Add to meal flow (POST /api/uplift/accept) — unchanged
- Boost generation and ranking — unchanged
- MealUpliftPanel compact row expansion — unchanged
- MealUpliftPanel duplicate suppression — unchanged
- Shopping list invalidation — unchanged
- Nutrition recalculation — unchanged
- System meal forking — unchanged
- Accepted boost history — unchanged (status preserved)

---

## Suggestions (Future Work — Not Implemented)

- The MealUpliftPanel's existing "Added via THA Boost" section (inside the accordion) now duplicates what the ingredient list shows. Consider removing the accordion section in a future pass to reduce visual repetition.
- "THA Boost" label inside MealUpliftPanel could be updated to "Nutrition Boost" to match the ingredient list label.
- Could add a brief toast confirmation after Remove to help users who miss the inline state change.
