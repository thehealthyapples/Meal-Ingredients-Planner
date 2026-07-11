# NUTRITION BOOST RUNTIME PROOF INVESTIGATION

**Date:** 2026-06-11  
**Status:** Investigation Complete — Diagnostic Instrumentation Added  
**Branch:** main  
**Rollback Tag:** `rollback/nutrition-boost-runtime-proof-investigation` (commit `80c5b75`)

---

## ROLLBACK POINT

```
git checkout rollback/nutrition-boost-runtime-proof-investigation
```

---

## ROOT CAUSE

**The MealUpliftPanel unmounts when the only boost suggestion is accepted.** After accepting a boost, the parent dialog computes `mergedMatches = []` (server uplift batch returns nothing for the new fork ID; fallback filters out the just-added ingredient). The parent returns `null` before rendering MealUpliftPanel. The component unmounts. All state — including `open`, `justAdded`, and `effectiveMealId` — is destroyed. The applications query stops.

---

## FAILING STEP

**Step 6 — MealUpliftPanel render gate** (`weekly-planner-page.tsx` line ~3552)

```javascript
if (mergedMatches.length === 0) return null;
```

This fires immediately after the boost is accepted, causing full component unmount.

---

## WHY INGREDIENT DOES NOT APPEAR

After the fork, `meal = meals.find(m => m.id === forkId)` is the resolution path (line 2933). The synchronous `setQueryData` in `MealUpliftPanel.onSuccess` adds the fork to the `meals` cache. **If this path works**, the ingredient appears immediately. **If `setQueryData` returned `prev` unchanged** (e.g., `original` meal not found in cache), `meals.find(forkId)` returns `undefined` and `meal` falls back to `mealSnapshot` — which has `id: forkId` but the OLD ingredients without the boost.

The STEP3 log in `MealUpliftPanel.onSuccess` proves which branch ran.

---

## WHY LABEL DOES NOT APPEAR

After accepting, `MealUpliftPanel` **unmounts** (STEP6 log shows `willRender: false`). Its `activeApplications` query stops. When the uplift batch eventually re-fetches for the fork ID and returns suggestions, MealUpliftPanel remounts fresh with `open = false`. The applications query has `enabled: open` — so it does NOT fetch when the panel is closed. The "Added via THA Boost" label only appears after the user manually opens the accordion, which triggers the applications fetch.

---

## WHY REMOVE DOES NOT APPEAR

Same cause as the label. The remove button is inside the `activeApplications.map(...)` block. `activeApplications = []` until the user opens the accordion and the applications query completes.

---

## TEST CASE TRACE

**Meal:** Chorizo & Tomato Salad (system meal, e.g. id: 42)  
**Boost:** Pumpkin Seeds

---

### STEP 1 — User clicks Add

**Console log output (expected):**
```
[BOOST-PROOF] STEP1 request: {
  mealId: 42,
  plannerEntryId: <ENTRY_ID>,
  ingredient: "Pumpkin Seeds"
}
```

Proves: `effectiveMealId` at time of click was 42 (the system meal).

---

### STEP 2 — Server response

**Console log output (expected):**
```
[BOOST-PROOF] STEP2 response: {
  mealId: 1042,             ← new fork ID
  forkedFromMealId: 42,     ← original system meal
  added: ["Pumpkin Seeds"],
  effectiveMealIdBeforeUpdate: 42
}
```

Proves: server created a fork and returned the fork ID.

**If `added: []`** — the ingredient was deduplicated server-side. Pumpkin Seeds was already in the meal. Boost appeared to succeed but nothing was written. This is a separate failure mode.

---

### STEP 3 — Meals cache after `setQueryData`

**Console log output (expected — success path):**
```
[BOOST-PROOF] STEP3 setQueryData: adding fork to meals cache. forkId: 1042, originalId: 42, added: ["Pumpkin Seeds"]
[BOOST-PROOF] STEP3 meals cache AFTER setQueryData: {
  forkId: 1042,
  forkFoundInCache: true,
  forkIngredients: [..., "Pumpkin Seeds"]
}
```

**Console log output (expected — failure path):**
```
[BOOST-PROOF] STEP3 setQueryData: original meal NOT found in meals cache — fork NOT added. forkedFromMealId: 42, meals count: N, meal ids: [...]
[BOOST-PROOF] STEP3 meals cache AFTER setQueryData: {
  forkId: 1042,
  forkFoundInCache: false,
  forkIngredients: "NOT IN CACHE"
}
```

**What this proves:** Whether the synchronous `setQueryData` updater ran correctly. If `original` was not found (the system meal was not in the cache), the fork is never added, and `meals.find(forkId)` will return `undefined` in STEP5.

**Note on why `original` might not be found:** `/api/meals` returns `[...userMeals, ...systemMeals]` (routes.ts:1151). System meals ARE included. The original meal SHOULD be in `prev`. If it is missing, the meals cache was cleared or never loaded before this point.

---

### STEP 4 — `handleUpliftAccepted` in weekly-planner-page

**Console log output (expected):**
```
[BOOST-PROOF] STEP4 handleUpliftAccepted: {
  incomingMealId: 1042,
  currentMealDetailMealId: 42,
  willUpdate: true
}
```

Proves: `mealDetail.meal.id` is being updated from 42 → 1042 so the dialog resolves the fork.

**If `willUpdate: false`** and `incomingMealId === currentMealDetailMealId` — both already equal, meaning this is a non-fork (user meal) case. `mealDetail.meal.id` does not change. `mealSnapshot.id` stays as the original user meal ID.

---

### STEP 5 — Meal resolution in dialog render

**Console log output (expected — ingredient visible):**
```
[BOOST-PROOF] STEP5 dialog meal resolution: {
  mealSnapshotId: 1042,
  resolvedFromCache: true,
  resolvedMealId: 1042,
  ingredientsCount: N+1,
  ingredients: [..., "Pumpkin Seeds"],
  plannerEntryMealId: 42   ← stale, not updated in mealDetail.entry
}
```

**Console log output (expected — ingredient NOT visible):**
```
[BOOST-PROOF] STEP5 dialog meal resolution: {
  mealSnapshotId: 1042,
  resolvedFromCache: false,   ← fork not in meals cache
  resolvedMealId: 1042,       ← still reports 1042 (from mealSnapshot fallback)
  ingredientsCount: N,        ← original count, no Pumpkin Seeds
  ingredients: [...without "Pumpkin Seeds"],
  plannerEntryMealId: 42
}
```

**What this proves:** Whether the ingredient list in the dialog reads from the live cache (fork with Pumpkin Seeds) or the stale snapshot (original ingredients).

The `resolvedFromCache: false` line is the definitive proof that `meals.find(forkId)` returned `undefined` — meaning the `setQueryData` in STEP3 did not add the fork.

---

### STEP 6 — MealUpliftPanel render gate

This is the **primary proof** for label and remove failures.

**Console log output immediately after Add (expected):**
```
[BOOST-PROOF] STEP6 MealUpliftPanel render gate: {
  mealId: 1042,
  serverMatchesCount: 0,    ← uplift batch not yet fetched for fork ID
  hasFallbackMatch: false,  ← OR true with suggestions that exclude Pumpkin Seeds
  fallbackSuggestions: [],  ← Pumpkin Seeds filtered out (already in ingredients)
  mergedMatchesCount: 0,    ← ZERO
  willRender: false         ← MealUpliftPanel NOT rendered (UNMOUNTS)
}
```

**What this proves:**

- `serverMatchesCount: 0` — The `upliftByMealId` map is keyed by meal ID. After fork, `meal.id` is the new fork ID (1042). The uplift batch query was last fetched with the original system meal IDs. The fork ID was not in the previous batch. The query key changed (now includes 1042 instead of 42). The new key has never been fetched. `upliftBatchData` for the new key is `undefined`. `upliftByMealId.get(1042) = undefined`.

- `hasFallbackMatch: false` — `buildFallbackUpliftMatch` receives `meal.ingredients` which now includes Pumpkin Seeds. `getMealBoosts` filters out Pumpkin Seeds because `ingredientText.includes("pumpkin seeds")` is true. If Pumpkin Seeds was the only boost suggestion for this meal, no suggestions remain. `fallbackMatch = null`.

- `willRender: false` — The parent IIFE returns `null` before rendering MealUpliftPanel. **The component unmounts.**

---

### STEP 7 — `activeApplications` in MealUpliftPanel

Because MealUpliftPanel unmounts at STEP6, STEP7 will fire ZERO times after the boost is accepted (the component is gone).

**Expected log output: none** (after boost accepted, panel unmounted).

When the uplift batch eventually refetches for the fork ID and returns suggestions, MealUpliftPanel mounts fresh. STEP7 fires:

```
[BOOST-PROOF] STEP7 activeApplications changed: {
  effectiveMealId: 1042,
  open: false,        ← panel remounted closed
  applicationsCount: 0,
  activeCount: 0,
  activeIngredients: []
}
```

`open: false` because the panel remounted with `useState(false)`. The applications query has `enabled: open` = `enabled: false`. **No fetch happens.** No label. No remove.

---

### STEP 8 — `boostApp` evaluation

`boostApp` is not a named variable in the current code. The equivalent is `activeApplications.find(a => a.ingredient === "Pumpkin Seeds")`.

**Does boostApp exist after Add?** NO — because MealUpliftPanel unmounted and remounted with empty applications and `open: false`.

---

### STEP 9 — Close modal, reopen without refresh

After close and reopen:
- `mealDetail` is reset (`setMealDetail(null)`)
- Re-open: `setMealDetail({ entry, meal, ... })` where `entry.mealId` is now the fork ID (if `fullPlanner` was updated) OR still the system meal ID (if `fullPlanner` refetch hasn't completed)

**State divergence point:**
If `fullPlanner` still has `entry.mealId = 42` (refetch not complete), `getMeal(42)` = system meal, dialog opens with system meal. Ingredient not in system meal's original list. Worse than before.

If `fullPlanner` has `entry.mealId = 1042` (refetch complete), `getMeal(1042)` = fork with Pumpkin Seeds. Ingredient visible.

The planner refetch was triggered but is asynchronous. This is a race condition between modal re-open timing and refetch completion.

---

### STEP 10 — After browser refresh

After full page reload:
1. `/api/planner/full` returns updated plan with `entry.mealId = 1042`
2. `/api/meals` returns fork (user meal) with Pumpkin Seeds in ingredients
3. User opens dialog for that planner entry: `getMeal(1042)` = fork ✓
4. `mealDetail.meal.id = 1042`, `mealDetail.meal.ingredients` includes Pumpkin Seeds ✓
5. Ingredient visible ✓
6. Uplift panel mounts with `upliftBatchMeals` including fork (1042)
7. Uplift batch fetches for fork → server returns suggestions (excluding Pumpkin Seeds) → `mergedMatches.length > 0`
8. MealUpliftPanel renders ✓
9. User opens accordion → applications query fetches → `activeApplications` includes Pumpkin Seeds
10. Label and remove visible ✓

Everything works after refresh because:
- All async state has settled (refetches completed)
- MealUpliftPanel starts fresh with the correct data immediately available

---

## EXACT FAILING STEP SUMMARY

| Failure | Failing Step | Reason |
|---------|-------------|--------|
| Ingredient not visible | STEP3 / STEP5 | `setQueryData` may return `prev` unchanged if original meal not in cache; OR the ingredient IS visible immediately but is overwritten by background refetch returning stale data |
| Label not visible | STEP6 | `mergedMatches.length === 0` → parent returns null → MealUpliftPanel unmounts |
| Remove not visible | STEP6 | Same as label — component unmounts before applications can be rendered |

---

## EXECUTION PATH MAP

```
User clicks Add
  │
  ├─ [MealUpliftPanel] acceptMutation.mutationFn
  │     POST /api/uplift/accept { mealId: 42, ... }
  │     ← 201 { mealId: 1042, forkedFromMealId: 42, added: ["Pumpkin Seeds"] }
  │
  ├─ [MealUpliftPanel] onSuccess fires
  │     setEffectiveMealId(1042)                   ← queued state update
  │     onMealForked(1042)
  │       qc.setQueryData(["/api/planner/full"])   ← sync: entry.mealId → 1042
  │       qc.invalidateQueries(["/api/planner/full"]) ← async refetch scheduled
  │       qc.invalidateQueries(["/api/meals"])     ← FIRST meals invalidation
  │     setJustAdded(+PumpkinSeeds)                ← queued state update
  │     qc.setQueryData(["/api/meals"], updater)   ← sync: adds fork to cache
  │       └─ IF original (id:42) found in prev → fork added to array ✓
  │       └─ IF original NOT found → returns prev unchanged ✗
  │     qc.invalidateQueries(["/api/meals"])       ← SECOND meals invalidation
  │     qc.invalidateQueries(["/api/meals",1042,"uplift-applications"])
  │     onUpliftAccepted(1042)
  │       handleUpliftAccepted(1042)
  │         setBoostedMealIds(+1042)               ← queued state update
  │         setMealDetail(prev → meal.id: 1042)   ← queued state update
  │
  ├─ React 18 batched render fires
  │     meals = [...prev, fork{1042, ingredients:[...+PumpkinSeeds]}]  ← from setQueryData
  │     mealDetail.meal.id = 1042
  │
  ├─ [WeeklyPlannerPage dialog render]
  │     mealSnapshot.id = 1042
  │     meal = meals.find(m => m.id === 1042)
  │       ✓ found → meal.ingredients includes PumpkinSeeds  [INGREDIENT VISIBLE]
  │       ✗ not found → meal = mealSnapshot (no PumpkinSeeds) [INGREDIENT NOT VISIBLE]
  │
  ├─ [WeeklyPlannerPage uplift gate]
  │     serverMatches = upliftByMealId.get(1042) = undefined → []
  │     fallbackMatch = buildFallbackUpliftMatch(meal.ingredients incl. PumpkinSeeds)
  │       └─ getMealBoosts filters out PumpkinSeeds (already in ingredients)
  │       └─ IF no other suggestions → fallbackMatch = null
  │     mergedMatches = []
  │     if (mergedMatches.length === 0) return null    ← MealUpliftPanel UNMOUNTS
  │
  ├─ MealUpliftPanel is GONE from DOM
  │     activeApplications query stops
  │     open, effectiveMealId, justAdded states destroyed
  │
  └─ [ASYNC — minutes later] uplift batch refetches for fork IDs
        if fork has suggestions → MealUpliftPanel remounts fresh
          open = false → applications query disabled → label/remove still NOT shown
          user must manually open accordion → applications fetch → label/remove appear
```

---

## CACHE UPDATE EVIDENCE REQUIRED

Run the app, open the Chorizo & Tomato Salad dialog, open the Nutrition Boost accordion, add Pumpkin Seeds. Then inspect the browser console for these logs in order:

1. `STEP1` — confirms request payload
2. `STEP2` — confirms server response (fork ID + forkedFromMealId)
3. `STEP3` — confirms whether fork was added to meals cache
4. `STEP4` — confirms mealDetail.meal.id update
5. `STEP5` — confirms which ingredient list is rendered
6. `STEP6` — **KEY LOG** — confirms `willRender: false` (MealUpliftPanel unmounts)
7. `STEP7` — should NOT appear (component unmounted)

---

## SMALLEST SAFE FIX

This section is provided for awareness only. No implementation has been made.

**Fix for label and remove:**  
The parent should not gate MealUpliftPanel rendering on `mergedMatches.length`. When a meal has accepted applications, the panel must remain rendered to show them. The panel should render if EITHER `mergedMatches.length > 0` OR there are accepted applications for the current meal.

The accepted applications count can be determined by checking the `/api/meals/:id/uplift-applications` result — but this requires a separate query before the panel renders, which introduces complexity.

Alternative: remove the `if (mergedMatches.length === 0) return null` guard from the parent, and let MealUpliftPanel render even with an empty `upliftMatches` array. The panel's internal `activeApplications` section would still appear. The "no ideas" empty state would render alongside it.

**Fix for ingredient:**  
The `setQueryData` logic is correct in principle. If `original` is not found in `prev`, the fork is not added to the cache, and the ingredient does not appear until the background refetch completes. The fix is to not rely on `setQueryData` for UI freshness — instead trigger `invalidateQueries` and let the refetch drive the UI. However, this introduces a brief delay (the refetch round-trip).

---

## DATA IMPACT DECLARATION

- Reads existing data: YES (meals cache, planner cache, uplift applications)
- Writes existing data: YES — diagnostic console.log statements only (no database writes)
- Changes meaning of existing data: NO
- Requires backfill: NO
- Schema changes: NO

---

## TRUST CHECK

This report is based on static code analysis. The `[BOOST-PROOF]` console.log statements have been added to the following files to provide runtime evidence:

- `client/src/components/MealUpliftPanel.tsx` — STEP1, STEP2, STEP3, STEP7
- `client/src/pages/weekly-planner-page.tsx` — STEP4, STEP5, STEP6

Run the test case and share the browser console output to confirm or refute this analysis.

The STEP6 log is the most important. `willRender: false` immediately after clicking Add is definitive proof of the unmount root cause.
