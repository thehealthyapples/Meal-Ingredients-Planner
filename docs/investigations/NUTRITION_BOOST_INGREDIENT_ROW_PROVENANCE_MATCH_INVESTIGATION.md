# NUTRITION_BOOST_INGREDIENT_ROW_PROVENANCE_MATCH_INVESTIGATION

## Rollback Identifier

Tag: `rollback/provenance-investigation-2026-06-11`  
Commit: `80c5b7586dc8c9c0818952a78963e38d2e88dc86`  
Message: `feat(nutrition-boost): compact UX refinement — multi-expand rows, Add always visible, ingredient visibility fix`

To restore: `git checkout rollback/provenance-investigation-2026-06-11`

---

## ROOT CAUSE

The `acceptMutation` return type in `MealUpliftPanel.tsx` (line 176–180) omits `applications` from the TypeScript cast:

```ts
return res.json() as Promise<{
  mealId: number;
  forkedFromMealId: number | null;
  added: string[];
  // applications is NOT here
}>;
```

The server's `POST /api/uplift/accept` response (routes.ts line 9924–9929) DOES include `applications: MealUpliftApplication[]`. Because the cast strips this field, `data.applications` is `undefined` in `onSuccess`. No `qc.setQueryData` is ever called for the applications cache key. The only path to a populated `activeApplications` array is through the async background refetch triggered by `invalidateQueries`.

## FAILING CONDITION

`activeApplications.length > 0 && open` is `false` at the moment the user can see the ingredient in the list, because:

1. **No immediate cache write from POST response** — the round-trip `GET /api/meals/:forkId/uplift-applications` completes 1–2 seconds after the Add button is clicked. During that window `activeApplications = []`.

2. **For system meals: pre-fork query errors** — initial mount with `effectiveMealId = originalSystemMealId` fires `GET /api/meals/originalId/uplift-applications`, which returns `403`. `apiRequest` (queryClient.ts) throws on any non-200, so the query enters error state with `applications = []`. The correct query (for `forkId`) only fires after `setEffectiveMealId(forkId)` is processed in the next render.

3. **Close/reopen race with planner refetch** — if the user closes and reopens the dialog before the planner query refetches, `entry.mealId` is still `originalId`. MealUpliftPanel receives `mealId = originalId`. Query → 403. `applications = []` until page refresh.

4. **Provenance label exists only inside the panel accordion** — the "Added via THA Boost" section and Remove buttons are inside `{open && (...)}` (MealUpliftPanel.tsx line 336). The main ingredient list in the dialog (weekly-planner-page.tsx lines 3622–3674) renders every ingredient as a plain bullet with no provenance awareness. If the user is looking for the label in the ingredient list, it is not there regardless of query state.

---

## Finding 1: Application rows ARE being created

**Evidence:** `POST /api/uplift/accept` at routes.ts lines 9903–9929:

```ts
const applications = [];
for (const suggestion of suggestions) {
  const wasAdded = added.includes(suggestion.ingredient);
  const application = await storage.createUpliftApplication({
    mealId: meal.id,           // forkId for system meals
    userId,
    ingredient: suggestion.ingredient,  // 'cannellini beans' (lowercase)
    status: wasAdded ? 'accepted' : 'duplicate_skipped',
    ...
  });
  applications.push(application);
}
return res.status(201).json({ mealId, forkedFromMealId, added, skipped, applications });
```

For Cannellini Beans on a soup meal:

- `uplift-rules.ts` line 201 (`soup-legume-fibre` rule): `ingredient: 'cannellini beans'`
- `uplift-rules.ts` line 886 (casserole/stew rule): `ingredient: 'cannellini beans'`
- `mergeUpliftIngredients` in `uplift-persistence.ts` — if the ingredient is not already in `meal.ingredients`, `added = ['cannellini beans']`, `wasAdded = true`, `status = 'accepted'`
- Row is created in `meal_uplift_applications` table: `{ mealId: forkId, ingredient: 'cannellini beans', status: 'accepted' }`

**Application rows are created correctly.** The server returns them in the POST response at line 9929.

---

## Finding 2: GET uplift-applications DOES return the row — but only for owned meals

**Endpoint:** `GET /api/meals/:mealId/uplift-applications` (routes.ts lines 10087–10104)

```ts
const meal = await storage.getMeal(mealId);
if (meal.userId !== req.user!.id) return res.status(403).json({ message: 'Not authorised' });
const applications = await storage.getMealUpliftApplications(mealId);
return res.json({ mealId, applications });
```

**For the fork (user-owned):** `meal.userId === req.user!.id` → 200 → returns row.

**For the original system meal:** `meal.userId !== req.user!.id` → 403 → `apiRequest` THROWS (not silent) → React Query error state → `applications = []`.

`storage.getMealUpliftApplications` (storage.ts lines 3554–3562) filters `status = 'accepted'` only — `duplicate_skipped` and `removed` rows are excluded. For a fresh successful add, the row has `status = 'accepted'`. The query returns it. ✓

**The GET works correctly once `effectiveMealId = forkId`. It fails (403) for the original system meal ID.**

---

## Finding 3: The ingredient list does NOT have access to that row

**Location:** `weekly-planner-page.tsx` lines 3622–3674 (the ingredient list render)

The ingredient list renders every `meal.ingredients` array item as a plain bullet point. There is no reference to:
- `mealDetailApplications`
- `boostAcceptedApplications`
- `uplift-applications` query
- `removeBoostFromDialogMutation`

These were described in `NUTRITION_BOOST_MODAL_STATE_LABEL_REMOVE.md` as the planned implementation but were **never implemented**.

The `activeApplications` array and all provenance rendering exist exclusively inside `MealUpliftPanel.tsx`. They render only inside the collapsible accordion body (line 336: `{open && (...)}`, line 441: `{activeApplications.length > 0 && (...)}`).

**The "Added via Nutrition Boost" label and Remove button in the main ingredient list do not exist.**

---

## Finding 4: Matching logic — no failure for Cannellini Beans

`acceptedIngredientKeys` is built at MealUpliftPanel.tsx line 292–294:

```ts
const acceptedIngredientKeys = new Set(
  activeApplications.map((a) => a.ingredient.toLowerCase().trim())
);
```

Server stores `ingredient: 'cannellini beans'` (lowercase, from uplift rule). `.toLowerCase().trim()` → `'cannellini beans'`.

`pendingSuggestions` filter at line 295–297:

```ts
const pendingSuggestions = visibleSuggestions.filter(
  (s) => !acceptedIngredientKeys.has(s.ingredient.toLowerCase().trim())
);
```

Server suggestion: `ingredient: 'cannellini beans'`. `.toLowerCase().trim()` → `'cannellini beans'`. Match found. ✓

**String matching works correctly for Cannellini Beans.** There is no normalisation gap for this specific ingredient because the server stores it lowercase with no quantity prefix.

However, an edge case exists: if an ingredient stored in `applications.ingredient` included a quantity prefix (e.g., `'half a tin of cannellini beans'` vs suggestion `'cannellini beans'`), the `.toLowerCase().trim()` match would fail. The server-side `normaliseIngredientForDedupe` in `uplift-persistence.ts` strips quantities — the client does not use this function. In the current rules, `ingredient` is stored as the raw string from the rule definition (no quantities embedded), so this is not currently failing for known cases.

**The match would fail if `suggestion.ingredient` (client) differs from `application.ingredient` (DB) by more than case/whitespace.** No evidence this is happening for Cannellini Beans specifically, but the asymmetry is a latent bug.

---

## Finding 5: Smallest safe implementation recommendation

The root cause has two components: (a) missing `setQueryData` from POST response, (b) provenance label never shown in ingredient list. They require different changes.

**Fix A — Immediate applications cache from POST response (MealUpliftPanel.tsx only)**

Update the `mutationFn` return type to include `applications`:

```ts
// client/src/components/MealUpliftPanel.tsx — line 176
return res.json() as Promise<{
  mealId: number;
  forkedFromMealId: number | null;
  added: string[];
  applications: MealUpliftApplication[];  // add this
}>;
```

Add `setQueryData` in `onSuccess` before the `invalidateQueries` calls (after the existing fork cache update block):

```ts
// After the fork setQueryData block, before invalidateQueries
if (data.applications?.length) {
  qc.setQueryData<MealUpliftApplication[]>(
    ["/api/meals", data.mealId, "uplift-applications"],
    (old = []) => [
      ...old.filter(a => !data.applications.some(n => n.id === a.id)),
      ...data.applications,
    ],
  );
}
```

**Impact:** Applications are immediately visible in the panel (zero-wait) after clicking Add. The subsequent `invalidateQueries` still fires to confirm server state, but the user sees provenance instantly. This resolves the timing gap without touching the server, schema, or the ingredient list.

**Fix B — Provenance label in ingredient list (weekly-planner-page.tsx + MealUpliftPanel.tsx)**

This requires the implementation described in `NUTRITION_BOOST_MODAL_STATE_LABEL_REMOVE.md` (not yet implemented):

1. Add `MealUpliftApplication` import to weekly-planner-page.tsx
2. Add `mealDetailApplications` query at dialog level (shares cache key with panel query — no extra network calls after Fix A)
3. Annotate ingredient list rows where `application.ingredient.toLowerCase().trim() === ing.toLowerCase().trim()`
4. Add `removeBoostFromDialogMutation` at dialog level for the Remove button

Fix A is safe to ship standalone. Fix B requires Fix A (or the close/reopen race will leave the ingredient list stale).

---

## Failure Mode Summary

| # | Condition | Effect | Status |
|---|-----------|--------|--------|
| 1 | POST response `applications` dropped by TS cast | No immediate `setQueryData`; provenance only appears after async GET completes | **Root cause — unfixed** |
| 2 | System meal pre-fork query returns 403 | `applications = []` until `effectiveMealId` transitions to `forkId` | Partially mitigated by `enabled: true` fix; 1-render delay remains |
| 3 | Close/reopen before planner refetch | Dialog reopens with `mealId = originalId`; query → 403; no provenance until refresh | **Unfixed — requires Fix A + planner invalidation before dialog open** |
| 4 | Provenance label not in ingredient list | User sees plain bullet; no "Added via THA Boost" in ingredient rows | **Architecture gap — requires Fix B** |
| 5 | `open = false` hides provenance section | Panel must be expanded to see label/Remove | By-design UX; header shows `· N added` counter as collapsed hint |

---

## Trace: Cannellini Beans — Full Stack

1. **Batch query** — `POST /api/uplift/batch` receives meal `{ id: systemMealId, name: 'Minestrone Soup', ingredients: [...] }`. Engine matches `soup-legume-fibre` rule → returns `{ mealId: systemMealId, suggestions: [{ ingredient: 'cannellini beans', ... }] }`.

2. **MealUpliftPanel mounts** — `mealId = systemMealId`. `effectiveMealId = systemMealId`. Provenance query fires: `GET /api/meals/systemMealId/uplift-applications` → 403 → error state → `applications = []`.

3. **User clicks Add** — `acceptMutation.mutationFn` → `POST /api/uplift/accept { mealId: systemMealId, suggestions: [{ ingredient: 'cannellini beans' }] }`.

4. **Server forks** — creates user-owned fork (`forkId`). Adds `'cannellini beans'` to fork ingredients. Creates application `{ mealId: forkId, ingredient: 'cannellini beans', status: 'accepted' }`. Returns `{ mealId: forkId, forkedFromMealId: systemMealId, added: ['cannellini beans'], applications: [{ id: N, mealId: forkId, ingredient: 'cannellini beans', status: 'accepted' }] }`.

5. **`onSuccess`** — `data.applications` is `undefined` (stripped by TS cast). No `setQueryData` for applications cache. `setEffectiveMealId(forkId)` queued. `invalidateQueries(["/api/meals"])` fires. `invalidateQueries(["/api/meals", forkId, "uplift-applications"])` fires (key not in cache yet — no effect).

6. **Next render** — `effectiveMealId = forkId`. New query key. Cache miss. `GET /api/meals/forkId/uplift-applications` fires.

7. **GET returns** — `{ applications: [{ mealId: forkId, ingredient: 'cannellini beans', status: 'accepted' }] }`. `activeApplications.length = 1`.

8. **Render** — `open && activeApplications.length > 0` → "Added via THA Boost" section and Remove button render inside the open accordion. The main ingredient list shows `'cannellini beans'` as a plain bullet (no label, no Remove).

9. **User closes dialog** — If planner refetch has not yet completed, `entry.mealId` is still `systemMealId`. Reopening the dialog passes `mealId = systemMealId` to MealUpliftPanel. Query → 403. Provenance gone until refresh.

---

## Files Read

| File | Purpose |
|------|---------|
| `client/src/components/MealUpliftPanel.tsx` | Full read — provenance query, acceptMutation return type, onSuccess cache updates, render gate |
| `client/src/pages/weekly-planner-page.tsx` | Lines 3568–3674 — hasBoostedThisSession gate, handleUpliftAccepted, ingredient list render |
| `server/routes.ts` | Lines 9835–9935, 10087–10104 — POST accept response shape, GET applications endpoint |
| `server/lib/uplift-persistence.ts` | Full read — normaliseIngredientForDedupe, mergeUpliftIngredients |
| `server/lib/uplift-engine.ts` | Lines 190–355 — existing ingredient filtering in batch match |
| `server/storage.ts` | Lines 3554–3586 — getMealUpliftApplications (status='accepted' filter) |
| `server/lib/uplift-rules.ts` | Lines 195–210, 880–895 — cannellini beans rule entries |
| `client/src/lib/queryClient.ts` | throwIfResNotOk — confirmed throws on 403 |
| `client/src/lib/nutrition-boosts.ts` | BOOST_LIBRARY — confirmed no Cannellini Beans (suggestion comes from server rules) |
| `server/migrations/runner.ts` | Confirmed migration 2026-06-11_add_meal_uplift_applications present |

## Investigation Documents Referenced

| Document | Relevance |
|----------|-----------|
| `NUTRITION_BOOST_RUNTIME_PROOF_INVESTIGATION.md` | Original unmount root cause; hasBoostedThisSession fix |
| `NUTRITION_BOOST_PROVENANCE_QUERY_ENABLE_FIX.md` | enabled: true fix; "Remaining Issues: None" claim now superseded |
| `NUTRITION_BOOST_MODAL_STATE_LABEL_REMOVE.md` | Describes planned (unimplemented) ingredient list annotation + dialog-level query |
