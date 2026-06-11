# NUTRITION_BOOST_PROVENANCE_DISPLAY_INVESTIGATION

ROOT CAUSE:
The uplift applications query in `MealUpliftPanel` is disabled whenever the panel is collapsed (`open = false`) AND there are still pending suggestions (`upliftMatches.length > 0`). After adding a boost with the always-visible Add button (without expanding the panel), the query is never enabled, no cache is built, and on modal close/reopen `applications = []`. Neither the "Added via THA Boost" label nor the Remove button renders.

FAILING CONDITION:
```
enabled: open || upliftMatches.length === 0
```
evaluates to `false` when `open = false` and `upliftMatches.length > 0`, which is the case after adding one boost (e.g. Pumpkin Seeds) when other suggestions remain (e.g. Chickpeas, Sauerkraut, Walnuts).

---

## Rollback identifier

Tag created before investigation: `rollback/provenance-display-investigation-20260611-214416` (HEAD: `80c5b75`)

Existing uncommitted changes to 7 tracked files are unchanged — investigation was read-only.

---

## 1. Whether application rows are being created

YES. The `POST /api/uplift/accept` route at `server/routes.ts:9835` calls `storage.createUpliftApplication(...)` for every accepted suggestion and returns them in the response body:

```
// routes.ts:9903-9921
const application = await storage.createUpliftApplication({
  mealId: meal.id,          // fork ID (Y)
  userId,
  ingredient: suggestion.ingredient,
  status: wasAdded ? 'accepted' : 'duplicate_skipped',
  ...
});
applications.push(application);
```

For Pumpkin Seeds added to Chorizo & Tomato Salad:
- Meal is a system meal → forked to user-private copy (ID = Y)
- Application row inserted: `mealId = Y`, `ingredient = "Pumpkin Seeds"`, `status = "accepted"`, `forkedFromMealId = X`
- Server responds `201` with `{ mealId: Y, forkedFromMealId: X, added: ["Pumpkin Seeds"], applications: [{ id: Z, mealId: Y, ... }] }`

---

## 2. Which meal ID owns the application row

The application row is written against the **fork ID (Y)**, not the original system meal ID (X).

From `routes.ts:9885-9886`:
```
forkedFromMealId = meal.id;  // original system meal ID (X)
meal = forked;               // fork: meal.id = Y
```

All subsequent writes use `meal.id = Y`:
- `storage.updateMeal(meal.id, { ingredients: merged })` → updates fork Y
- `storage.createUpliftApplication({ mealId: meal.id, ... })` → row references fork Y

The `getMealUpliftApplications` query at `storage.ts:3559` filters by `mealId` and `status = 'accepted'`:

```typescript
async getMealUpliftApplications(mealId: number): Promise<MealUpliftApplication[]> {
  return db
    .select()
    .from(mealUpliftApplications)
    .where(
      and(
        eq(mealUpliftApplications.mealId, mealId),
        eq(mealUpliftApplications.status, 'accepted'),
      )
    );
}
```

- `GET /api/meals/Y/uplift-applications` → returns `[{ id: Z, ingredient: "Pumpkin Seeds", ... }]` ✅
- `GET /api/meals/X/uplift-applications` → returns `[]` (no rows reference the original system meal ID) ✅

---

## 3. Which meal ID the modal queries

After the fork is accepted during the first session open:

**In `MealUpliftPanel.tsx:185-198`:**
```typescript
if (data.forkedFromMealId && data.mealId !== effectiveMealId) {
  setEffectiveMealId(data.mealId);   // Y
  onMealForked?.(data.mealId);       // fires onMealForked(Y)
}
```

**In `weekly-planner-page.tsx:431-445`** (`handleUpliftAccepted`):
```typescript
setMealDetail(prev => {
  if (!prev || prev.meal.id === mealId) return prev;
  return { ...prev, meal: { ...prev.meal, id: mealId } };  // updates to Y
});
```

**On modal close/reopen** — user clicks the meal card:
```typescript
// weekly-planner-page.tsx:2300-2309
setMealDetail({ entry, meal, ... });
```

Where `meal = mealById.get(entry.mealId)`:
- `entry.mealId` was updated to Y by `qc.setQueryData<FullWeek[]>(["/api/planner/full"], ...)` inside `onMealForked`
- `mealById.get(Y)` returns the fork from the meals cache (added synchronously via `qc.setQueryData<Meal[]>(["/api/meals"], ...)`)

In the dialog render (`weekly-planner-page.tsx:2939`):
```typescript
const meal = meals.find(m => m.id === mealSnapshot.id) ?? mealSnapshot;
// mealSnapshot.id = Y → meal.id = Y
```

**The modal queries the correct fork ID (Y).** There is no ID mismatch.

The panel receives `mealId = Y` as a prop, initialises `effectiveMealId = Y`, and constructs query key `["/api/meals", Y, "uplift-applications"]`.

---

## 4. Whether the query returns data

**The query does not run at all.** This is the root cause.

In `MealUpliftPanel.tsx:121-136`:
```typescript
const { data: applications = [] } = useQuery<MealUpliftApplication[]>({
  queryKey: ["/api/meals", effectiveMealId, "uplift-applications"],
  queryFn: async () => { ... },
  enabled: open || upliftMatches.length === 0,  // ← FAILING CONDITION
  staleTime: 30_000,
});
```

After the modal is closed and reopened, the panel mounts with `useState(false)` → `open = false`.

`upliftMatches` comes from the parent render (`weekly-planner-page.tsx:3551-3566`):
```typescript
const serverMatches = upliftByMealId.get(meal.id) ?? [];   // matches for fork Y
const fallbackMatch = buildFallbackUpliftMatch(
  meal.name,
  meal.ingredients ?? [],   // now includes "Pumpkin Seeds"
  householdEaters,
  serverKeys,
);
```

`buildFallbackUpliftMatch` calls `getMealBoosts("Chorizo & Tomato Salad", [..., "Pumpkin Seeds"])`. The `getMealBoosts` function (`client/src/lib/nutrition-boosts.ts:163`) filters out ingredients already present:
```typescript
const ingredientText = ingredients.join(" ").toLowerCase();
const filtered = candidates.filter(
  (boost) => !ingredientText.includes(boost.toLowerCase()),
);
```

For "salad" keyword match, candidates are `["Pumpkin Seeds", "Chickpeas", "Sauerkraut", "Walnuts"]`. Pumpkin Seeds is filtered out (already in `ingredientText`). The remaining suggestions — **Chickpeas, Sauerkraut, Walnuts** — are returned.

Therefore `fallbackMatch` is non-null with 3 suggestions.
`mergedMatches.length = 1` (the fallback match object).
`upliftMatches.length = 1 > 0`.

The `enabled` condition:
```
enabled: false || (1 === 0)  →  false
```

**The query is disabled. React Query does not fetch. `applications` defaults to `[]`.**

**Cache state on reopen:**
- If the user expanded the panel in the first session (`open = true` before closing), the query fired and cached `[{ id: Z, ... }]`. On remount with `enabled = false`, React Query returns the cached (stale) data. Provenance renders in this path.
- If the user added the boost with the panel **collapsed** (using the always-visible Add button — the UX introduced in commit `80c5b75`), the query was never enabled in the first session. No cache exists. On remount with `enabled = false`, `applications = []`. **This is the primary failing path.**

---

## 5. Whether matching fails by ID, status, or ingredient string

Matching does not fail — the query never runs, so there is nothing to match against.

For completeness: if `applications` were populated correctly, the downstream matching works:

**Filtering accepted applications for display** (`MealUpliftPanel.tsx:295-299`):
```typescript
const acceptedIngredientKeys = new Set(
  activeApplications.map((a) => a.ingredient.toLowerCase().trim())
);
const pendingSuggestions = visibleSuggestions.filter(
  (s) => !acceptedIngredientKeys.has(s.ingredient.toLowerCase().trim())
);
```

- Application stores `ingredient: "Pumpkin Seeds"` (exact string from `AcceptedSuggestion.ingredient`)
- Fallback suggestion uses `boost.name` = `"Pumpkin Seeds"` (from `BOOST_LIBRARY`)
- `.toLowerCase().trim()` comparison: `"pumpkin seeds" === "pumpkin seeds"` ✅

**Status filter** (`MealUpliftPanel.tsx:139`):
```typescript
const activeApplications = applications.filter((a) => a.status !== "removed");
```

The server's `getMealUpliftApplications` already filters to `status = 'accepted'` only. The client filter is redundant but harmless. Status filtering is not the problem.

**The problem is that `applications` is always `[]` on reopen** because the query is disabled.

---

## 6. Smallest safe implementation recommendation

**Change the `enabled` condition in `MealUpliftPanel.tsx:134` from:**
```typescript
enabled: open || upliftMatches.length === 0,
```

**To:**
```typescript
enabled: true,
```

**Why this is safe:**
- The endpoint `GET /api/meals/:mealId/uplift-applications` is a single cheap SQL SELECT by primary key + status filter
- The query has `staleTime: 30_000` — no duplicate fetches within 30 seconds
- The query only fires once per component mount (no intervals, no polling)
- Always loading provenance enables the collapsed header to show "· N added" immediately on mount, which is the intended design per the existing comment
- No schema, migration, or other route changes required

**Why the original condition was wrong:**
The comment at line 131 says `"Enable eagerly when no pending suggestions"`, intending to load provenance for the collapsed "N added" header. But the condition `upliftMatches.length === 0` is only `true` when there are zero remaining suggestions. With multiple boost categories (legumes, seeds, nuts, herbs, etc.), there are almost always remaining suggestions after the first boost is accepted. The "eager" load never fires in the real scenario where it is most needed.

**What does NOT need changing:**
- Server routes — all correct
- Fork mechanism — all correct
- Invalidation calls in `acceptMutation.onSuccess` — correct, but ineffective with disabled query
- The `removeUpliftApplication` / `getMealUpliftApplications` storage methods — correct
- Ingredient matching logic — correct
- `mealId` resolution on modal close/reopen — correctly resolves to fork ID

---

## Trace summary for Chorizo & Tomato Salad + Pumpkin Seeds

| Step | What happens | Result |
|------|-------------|--------|
| 1. POST /api/uplift/accept | System meal forked (X→Y), ingredient added to Y, application row created (mealId=Y, status='accepted') | 201 ✅ |
| 2. GET /api/meals/Y/uplift-applications | Returns `[{ id: Z, ingredient: "Pumpkin Seeds", status: "accepted" }]` | ✅ |
| 2b. GET /api/meals/X/uplift-applications | Returns `[]` — original meal owns no application rows | ✅ |
| 3. Modal meal ID after fork | `mealDetail.meal.id` updated to Y via `handleUpliftAccepted`. Planner entry's `mealId` updated to Y. On reopen, `meal.id = Y` | ✅ |
| 4. Query key on reopen | `["/api/meals", Y, "uplift-applications"]` — correct fork ID | ✅ |
| 4b. Query enabled on reopen | `false` — panel collapsed, still has 3 other pending suggestions | ❌ |
| 5. Ingredient matching | Would work if query ran: `"pumpkin seeds" === "pumpkin seeds"` | N/A |
| 6. Render branch reached | `activeApplications.length > 0` check at line 444 fails because `activeApplications = []` | ❌ |

---

## Data impact declaration

- Reads existing data: YES (investigation read all relevant files)
- Writes existing data: NO (no boost was added during this investigation)
- Changes meaning of existing data: NO
- Requires backfill: NO
- Schema changes: NO
- Migration required: NO
