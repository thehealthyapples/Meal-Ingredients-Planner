# Nutrition Boost — Client State Refresh Investigation

**Date:** 2026-06-11  
**Status:** Complete  
**Rollback tag:** `rollback/nutrition-boost-client-state-investigation` at `80c5b75`

---

## ROOT CAUSE

**Fork case (system meals — primary bug):**  
When a user accepts a Nutrition Boost on a **system meal** (`isSystemMeal=true`), the server forks the meal to a user-owned copy. The server updates the planner entry's `mealId` to the fork's ID. The client triggers a background refetch of `/api/planner/full` to pick up that update, but this refetch is async. If the user closes and reopens the modal before the refetch completes, the click handler resolves the meal from the **stale planner entry** (`entry.mealId = originalId`), not the fork. The original system meal has no Pumpkin Seeds. The dialog opens showing the pre-boost ingredient list.

**Non-fork case (user-owned meals — not broken):**  
`setQueryData(["/api/meals"])` immediately updates the cache with the new ingredient synchronously. On modal reopen the live `meals.find(m => m.id === entry.mealId)` lookup in the dialog returns the updated meal. This path works correctly.

---

## FAILING STEP

**Step 14** — "when modal is reopened, which meal object is used"

For the fork case: `getMeal(entry.mealId)` where `entry.mealId = originalId` (stale, planner not yet refetched) → returns the original system meal with no Pumpkin Seeds.

---

## Setup

- Rollback point: tag `rollback/nutrition-boost-client-state-investigation` at commit `80c5b75`  
- Git status at investigation start: working tree had M modifications on tracked files; no investigation code changes were made

---

## Concrete Trace: Chorizo & Tomato Salad + Pumpkin Seeds

> This trace covers the **fork case** (system meal). The table below is annotated for the non-fork case where it differs.

| Step | What happens | Fork case | Non-fork case |
|------|-------------|-----------|---------------|
| 1 | User clicks Add button | `acceptMutation.mutate(suggestion)` fires with `ingredient: "Pumpkin Seeds"` | same |
| 2 | Request payload to POST /api/uplift/accept | `{ mealId: originalId, plannerEntryId: entry.id, suggestions: [{ ingredient: "Pumpkin Seeds", action: "add", ... }] }` | same (mealId is the user meal ID) |
| 3 | Server response | `{ mealId: forkId, forkedFromMealId: originalId, added: ["Pumpkin Seeds"], applications: [...] }` | `{ mealId: originalId, forkedFromMealId: null, added: ["Pumpkin Seeds"], applications: [...] }` |
| 4 | Returned mealId | `forkId` (new user-owned copy) | `originalId` (unchanged) |
| 5 | Returned added ingredients | `["Pumpkin Seeds"]` | `["Pumpkin Seeds"]` |
| 6 | `qc.setQueryData(["/api/meals"])` runs? | **NO** — condition `!data.forkedFromMealId` is false | **YES** — immediately updates meal in cache with Pumpkin Seeds |
| 7 | Exact query key for meals list (WeeklyPlannerPage) | `["/api/meals"]` | same |
| 8 | Exact query key invalidated after accept | `qc.invalidateQueries({ queryKey: ["/api/meals"] })` — prefix match hits meals list AND `["/api/meals", mealId, "uplift-applications"]` | same |
| 9 | Query keys match? | YES — `setQueryData` and `useQuery` both use `["/api/meals"]` | YES |
| 10 | `/api/meals` refetch triggered? | YES — background async refetch fires; `onMealForked` also fires `invalidateQueries(["/api/planner/full"])` | YES — background async refetch fires |
| 11 | `/api/meals` response contains Pumpkin Seeds? | YES — fork (userId=user) is returned by `getMeals(userId)` and includes Pumpkin Seeds | YES — updated meal returned |
| 12 | WeeklyPlannerPage `meals` variable updates? | YES — after refetch, `meals` contains the fork under `forkId` | YES — after `setQueryData` (immediately) and after refetch |
| 13 | Planner entry/card uses `meals` query or snapshot? | Uses `getMeal(entry.mealId)` = `meals.find(m => m.id === entry.mealId)` where `entry.mealId` comes from the `/api/planner/full` cache | same |
| 14 | **When modal is reopened, which meal object is used?** | **`getMeal(entry.mealId)` where `entry.mealId = originalId` (stale `/api/planner/full` — refetch not yet complete) → returns ORIGINAL system meal WITHOUT Pumpkin Seeds** | `getMeal(entry.mealId)` where `entry.mealId = originalId` (user meal, unchanged) → returns UPDATED user meal WITH Pumpkin Seeds ✓ |
| 15 | Exact ingredient array rendered in reopened modal | `originalMeal.ingredients` — Pumpkin Seeds **absent** | `updatedMeal.ingredients` — Pumpkin Seeds **present** ✓ |

---

## Required Checks

### A. Query key mismatch

**NOT the cause.**  
`MealUpliftPanel.onSuccess` uses `qc.setQueryData<Meal[]>(["/api/meals"], ...)` and `qc.invalidateQueries({ queryKey: ["/api/meals"] })`. WeeklyPlannerPage's `useQuery` uses `{ queryKey: ["/api/meals"] }`. Keys are identical.

---

### B. staleTime Infinity preventing refetch

**Partial contributor, not the root cause.**  
`queryClient.ts` line 59: `staleTime: Infinity` is the global default. This means without explicit invalidation, queries never auto-refetch. However, `qc.invalidateQueries` bypasses `staleTime` and triggers an immediate background refetch for active observers. The refetch does fire. The problem is the refetch is **async** and the user can close/reopen before it completes.

```typescript
// client/src/lib/queryClient.ts:53-66
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,   // ← global default
      retry: false,
    },
  },
});
```

---

### C. Invalidation not awaited

**Contributing factor.**  
`qc.invalidateQueries` is not awaited in `onSuccess`. It fires a background refetch of `/api/planner/full` asynchronously. The user can close and reopen the modal within the refetch round-trip window (~50–500ms), hitting the race condition.

```typescript
// MealUpliftPanel.tsx onSuccess — fires but is not awaited
qc.invalidateQueries({ queryKey: ["/api/meals"] });

// weekly-planner-page.tsx onMealForked callback — also fires but not awaited  
qc.invalidateQueries({ queryKey: ["/api/planner/full"] });  // line 3649
```

---

### D. Modal uses planner entry embedded meal snapshot

**YES — this IS the mechanism of failure.**  
When the user clicks a planner entry card to open the modal, the click handler captures `entry` from the rendered planner row. `entry` comes from `fullPlanner` (the `/api/planner/full` cache). If the planner cache hasn't been refetched after a fork, `entry.mealId` is still `originalId`. The `setMealDetail` call captures this stale `entry.mealId`.

```typescript
// weekly-planner-page.tsx line 2381 (desktop click handler)
setMealDetail({
  entry,          // ← entry.mealId = originalId when planner hasn't refetched
  meal,           // ← getMeal(entry.mealId) = original system meal
  ...
});
```

---

### E. Planner week data cache not invalidated

**PARTIALLY addressed — but async.**  
`onMealForked` does call `qc.invalidateQueries({ queryKey: ["/api/planner/full"] })` (line 3649). The refetch fires. But there is **no synchronous `setQueryData` for the planner** to update `entry.mealId = forkId` immediately. The planner cache holds `entry.mealId = originalId` until the refetch completes. See failing step 14.

---

### F. Meal detail uses selected planner entry, not meals query

**YES — combined with E, this is the exact failure path.**  
Inside the dialog, the meal is resolved by:

```typescript
// weekly-planner-page.tsx line 3020
const meal = meals.find(m => m.id === mealSnapshot.id) ?? mealSnapshot;
```

`mealSnapshot.id` is `originalId` (from the stale planner entry at click time). `meals.find(m => m.id === originalId)` returns the ORIGINAL system meal — which is always present in `GET /api/meals` (system meals are included via `getSystemMeals()`). That original meal has no Pumpkin Seeds.

Even after `/api/meals` refetches and returns the fork (under `forkId`), the dialog resolves by `originalId` and still finds the original meal. The ingredient remains invisible.

---

### G. Forked meal ID mismatch

**YES — this is the core mechanism.**  
After fork:  
- Planner entry: `mealId = originalId` (stale until `/api/planner/full` refetches)  
- Fork exists in DB under `forkId` with Pumpkin Seeds  
- `meals` cache after refetch: contains BOTH `originalId` (system meal, no Pumpkin Seeds) AND `forkId` (fork, with Pumpkin Seeds)  
- Modal at reopen time looks up by `originalId` → finds original, shows no Pumpkin Seeds  

The ingredient is stored in the DB under `forkId`, but the dialog queries by `originalId`.

---

### H. `/api/meals` endpoint returning updated data but UI not consuming it

**YES for the fork case.**  
After the `/api/meals` refetch, `forkId` (with Pumpkin Seeds) IS in the response and IS in the cache. But the UI resolves the meal by `originalId` (from stale planner entry), not `forkId`. The ingredient is in the cache but indexed under the wrong ID from the dialog's perspective.

---

### I. `/api/meals` endpoint not refetching until browser reload

**NOT the cause.**  
`qc.invalidateQueries({ queryKey: ["/api/meals"] })` fires in `onSuccess` (line 201 in `MealUpliftPanel.tsx`). With `staleTime: Infinity`, `invalidateQueries` bypasses `staleTime` and triggers an immediate background refetch for active queries. WeeklyPlannerPage has an active subscription to `["/api/meals"]`. The refetch fires.

After browser reload, all queries fetch fresh. The planner returns the updated `entry.mealId = forkId`, and the meals query returns the fork with Pumpkin Seeds. The dialog opens with `forkId` → correct meal → ingredient visible. This explains why "browser refresh shows the ingredient".

---

## Data Flow — Fork Case Only

```
POST /api/uplift/accept
  └─ server: creates fork (forkId), updates plannerEntries.mealId = forkId in DB
             returns { mealId: forkId, forkedFromMealId: originalId, added: [...] }

onSuccess in MealUpliftPanel:
  ├─ setEffectiveMealId(forkId)                      ← panel internal state only
  ├─ onMealForked(forkId)                            ← parent callback
  │    ├─ invalidateQueries(["/api/planner/full"])   ← background refetch, async
  │    └─ invalidateQueries(["/api/meals"])          ← background refetch, async
  ├─ setQueryData(["/api/meals", forkId, "uplift-applications"], ...)
  ├─ setQueryData(["/api/meals"]) NOT called         ← forkedFromMealId != null
  ├─ invalidateQueries(["/api/meals"])               ← background refetch, async (duplicate)
  └─ onUpliftAccepted(forkId, ["Pumpkin Seeds"])
       └─ setMealDetail(prev => { meal.id = forkId, meal.ingredients += Pumpkin Seeds })

While modal is open:
  meal = meals.find(m => m.id === forkId) ?? mealSnapshot
       ↑ meals.find returns undefined (fork not in cache yet)
       ↑ falls back to mealSnapshot (has forkId + Pumpkin Seeds)
  → Pumpkin Seeds VISIBLE ✓

User closes modal:
  setMealDetail(null)  ← clears mealDetail including the forkId + ingredient update

Background refetches complete (async, ~50-500ms after close):
  /api/planner/full → entry.mealId = forkId (now correct)
  /api/meals       → fork with Pumpkin Seeds is in the array

User reopens modal (clicks the planner card):
  entry = fullPlanner[...].entries[...]  (from React render of planner grid)
  
  RACE A — refetch NOT yet complete:
    entry.mealId = originalId (stale)
    meal = getMeal(originalId) = original system meal (no Pumpkin Seeds)
    setMealDetail({ entry, meal: originalMeal, ... })
    dialog: mealSnapshot.id = originalId
    meal = meals.find(m => m.id === originalId) = original system meal
    → Pumpkin Seeds ABSENT ✗

  RACE B — refetch complete:
    entry.mealId = forkId (updated)
    meal = getMeal(forkId) = fork meal (with Pumpkin Seeds)
    dialog: mealSnapshot.id = forkId
    meal = meals.find(m => m.id === forkId) = fork (Pumpkin Seeds present)
    → Pumpkin Seeds VISIBLE ✓
```

---

## Why "browser refresh" works

After full page reload:
1. `/api/planner/full` fetches fresh → `entry.mealId = forkId` (DB already has this)
2. `/api/meals` fetches fresh → includes fork (userId = user) with Pumpkin Seeds
3. On modal open: `getMeal(forkId)` → fork with Pumpkin Seeds → ingredient visible ✓

There is no race condition after a fresh page load because all queries start from server truth simultaneously.

---

## Why the non-fork case works

For user-owned meals (`isSystemMeal = false`):
- `entry.mealId` does NOT change (no fork)
- `qc.setQueryData(["/api/meals"], updater)` immediately updates the cache with Pumpkin Seeds (condition `!data.forkedFromMealId && data.added.length > 0` is true)
- On reopen: `getMeal(entry.mealId)` finds the updated meal in the cache → Pumpkin Seeds present ✓
- The dialog's live lookup `meals.find(m => m.id === mealSnapshot.id)` also returns the updated meal even if `mealSnapshot` was captured before the `setQueryData` rendered

---

## Secondary Bug (fork case — boost panel state)

When the modal reopens in the fork case (stale planner), the uplift panel queries applications for `originalId`:

```typescript
// weekly-planner-page.tsx line 932-941
const { data: mealDetailApplications = [] } = useQuery<MealUpliftApplication[]>({
  queryKey: ["/api/meals", mealDetail?.meal.id, "uplift-applications"],
  enabled: !!mealDetail,
  staleTime: 30_000,
});
```

`mealDetail?.meal.id = originalId` (stale) → applications endpoint returns 0 results (all applications are recorded for `forkId`). Result: `boostAcceptedApplications = []`.

Consequence: the uplift panel shows Pumpkin Seeds as a **pending suggestion again** (not filtered out). User can click "Add" a second time, triggering a second fork. Each accept on the stale-state modal compounds the fork chain.

---

## Exact Query Keys

| Key | Purpose | Updated by `setQueryData`? | Refetched by `invalidateQueries`? |
|-----|---------|---------------------------|----------------------------------|
| `["/api/meals"]` | Full meal list including ingredients | YES (non-fork only) | YES (both cases) |
| `["/api/planner/full"]` | Planner weeks/days/entries with mealId | **NO** | YES (fork case via `onMealForked`) |
| `["/api/meals", forkId, "uplift-applications"]` | Provenance for fork | YES (populated from response) | YES |
| `["/api/meals", originalId, "uplift-applications"]` | Provenance for original | NO | NO |

---

## Files Involved

| File | Role |
|------|------|
| `client/src/components/MealUpliftPanel.tsx` | Runs `acceptMutation`; fires `setQueryData`, `invalidateQueries`, `onMealForked`, `onUpliftAccepted` in `onSuccess` |
| `client/src/pages/weekly-planner-page.tsx` | `handleUpliftAccepted` updates open modal's `mealDetail`; `onMealForked` triggers planner/meals invalidation; modal opens using `entry.mealId` from planner cache |
| `server/routes.ts:9835` | POST /api/uplift/accept — forks system meal, writes ingredient, calls `updatePlannerEntryMealId` |
| `server/storage.ts:3588` | `updatePlannerEntryMealId` — DB write to update `plannerEntries.mealId = forkId` |

---

## Recommended Smallest Fix

**Add a synchronous `setQueryData` for `/api/planner/full` in the `onMealForked` callback** to update the entry's `mealId` to `forkId` immediately — before the background refetch arrives.

```typescript
// weekly-planner-page.tsx — inside the MealUpliftPanel JSX block, onMealForked callback
onMealForked={(newMealId) => {
  // Immediately update the planner entry in cache so modal-reopen
  // uses forkId, not the stale originalId.
  qc.setQueryData<FullWeek[]>(["/api/planner/full"], (old = []) =>
    old.map(w => ({
      ...w,
      days: w.days.map(d => ({
        ...d,
        entries: d.entries.map(e =>
          e.id === entry.id ? { ...e, mealId: newMealId } : e
        ),
      })),
    }))
  );
  qc.invalidateQueries({ queryKey: ["/api/planner/full"] });
  qc.invalidateQueries({ queryKey: ["/api/meals"] });
}}
```

This uses `entry` from the surrounding dialog closure (the same `entry` from `mealDetail`), which IS the correct planner entry being modified. The `setQueryData` runs synchronously before the dialog closes, so the next click to reopen the modal finds `entry.mealId = forkId`.

The `invalidateQueries` calls still fire for server-confirmed state.

**Why this is the smallest fix:** It targets exactly the data gap — the stale `entry.mealId` in the planner cache — without restructuring the mutation flow, the query invalidation strategy, or the modal state management. One `setQueryData` call eliminates the race window.

---

## Trust Check

| Check | Result |
|-------|--------|
| DB write succeeds | Confirmed by user: "ingredient persists to database" |
| Server response includes `forkId` and `added: ["Pumpkin Seeds"]` | FACT — routes.ts line 9924 returns these |
| `onMealForked` fires `invalidateQueries(["/api/planner/full"])` | FACT — weekly-planner-page.tsx line 3649 |
| `/api/planner/full` refetch is async (race window exists) | FACT — `invalidateQueries` never awaited |
| Original system meal is always in `GET /api/meals` response | FACT — `getSystemMeals()` returns all `isSystemMeal=true` regardless of fork |
| Dialog's `meals.find(originalId)` returns original (no ingredient) | FACT — original system meal is immutable, ingredient is on the fork |
| Browser refresh eliminates race (fetches both queries fresh simultaneously) | FACT — explains "browser refresh DOES show ingredient" |
| Non-fork path unaffected (`setQueryData` immediate, entry.mealId unchanged) | FACT — provable from code |

---

## Data Impact Declaration

| Category | Status |
|----------|--------|
| Reads existing data | YES |
| Writes existing data | NO (investigation only; no DB writes made) |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |

---

## Summary

1. **Root cause:** Fork case. After a system meal is boosted and forked, `/api/planner/full` is refetched asynchronously. The modal close clears `mealDetail`. On reopen, the click handler uses `entry.mealId = originalId` from the stale planner cache, finds the original system meal (no ingredient), and opens the dialog with the wrong meal.

2. **Exact failing step:** Step 14 — on modal reopen, `getMeal(entry.mealId)` uses `originalId` (stale) and returns the original system meal.

3. **Query keys involved:** `["/api/meals"]` and `["/api/planner/full"]`.

4. **Invalidation fires:** YES.

5. **Refetch fires:** YES (background async).

6. **Refetch response contains ingredient:** YES (under `forkId`), but dialog resolves by `originalId`.

7. **State used by reopened modal:** `entry.mealId` from `/api/planner/full` cache (stale, `= originalId`).

8. **Recommended smallest fix:** `setQueryData(["/api/planner/full"])` in `onMealForked` to synchronously update `entry.mealId = forkId` before the user can reopen the modal.
