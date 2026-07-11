# NUTRITION_BOOST_PANEL_PERSISTENCE_AND_CACHE_VERIFICATION

Date: 2026-06-11
Branch: main
Rollback identifier: `rollback/pre-panel-persistence-fix` (HEAD 80c5b75)

---

## Objective

Fix the confirmed issue where MealUpliftPanel unmounts after the only pending boost is accepted. Verify whether the fork meal is added to the `/api/meals` cache immediately after Add.

---

## Root Cause Confirmed

### Render gate (weekly-planner-page.tsx:3576)

```typescript
// BEFORE — unmounts panel when all suggestions are accepted
if (mergedMatches.length === 0) return null;
```

After the last pending suggestion is accepted:
1. The accepted ingredient is added to `meal.ingredients` via the fork
2. `buildFallbackUpliftMatch` no longer suggests it (already in ingredients)
3. `mergedMatches = []`
4. Parent returns null → `MealUpliftPanel` unmounts
5. `effectiveMealId`, `justAdded`, and the open state are destroyed
6. Applications query stops — "Added via THA Boost" label and Remove button disappear

### Component inner guard (MealUpliftPanel.tsx:291–292 pre-fix)

```typescript
// BEFORE — returned null for empty upliftMatches
if (upliftMatches.length === 0) return null;
```

Even if the parent was changed to render MealUpliftPanel with `upliftMatches = []`, this second guard would kill the component output silently.

### Applications query gating

```typescript
enabled: open,  // BEFORE
```

With `open = false` (collapsed state), the applications query never fires, so `activeApplications = []`. The "· N added" label in the collapsed header cannot appear even if accepted applications exist.

---

## Existing boostId tracking

`boostedMealIds` (a `Set<number>`, `useState` in weekly-planner-page) is already maintained:
- `handleUpliftAccepted(mealId)` adds the effective mealId (fork ID after fork) to the set
- `handleUpliftRemoved(mealId)` removes it

This set was used only for planner card indicators before this fix. It now doubles as the signal to keep MealUpliftPanel alive when there are no pending suggestions.

---

## Changes Made

### 1. weekly-planner-page.tsx — render gate (line 3578 post-fix)

```typescript
// AFTER — keep panel alive if this meal had a boost accepted this session
const hasBoostedThisSession = boostedMealIds.has(meal.id);
if (mergedMatches.length === 0 && !hasBoostedThisSession) return null;
```

Panel renders when either:
- `mergedMatches.length > 0` (pending suggestions exist), OR
- `hasBoostedThisSession` (boost was accepted for this meal in the current page session)

### 2. MealUpliftPanel.tsx — removed inner guard (line 291–292 pre-fix)

```typescript
// REMOVED
// Don't render if uplift has no data at all (parent already guards matches.length > 0)
if (upliftMatches.length === 0) return null;
```

The component already handles `upliftMatches = []` gracefully:
- `pendingSuggestions = []` (nothing to filter)
- The accepted applications section renders independently from server query data
- Empty state ("No boost ideas") shows only when both `pendingSuggestions` and `activeApplications` are empty

### 3. MealUpliftPanel.tsx — eager applications query

```typescript
// AFTER — load immediately in accepted-only state (no pending suggestions)
enabled: open || upliftMatches.length === 0,
```

When `upliftMatches.length === 0`, the parent kept us alive because of `boostedMealIds`. The query fires immediately on mount, so "· N added" appears in the collapsed header without requiring the user to expand the panel.

---

## Fork Meal Cache Verification

### Cache path

`/api/meals` (server/routes.ts:1144–1151) returns both user meals AND system meals:
```typescript
const [userMeals, systemMeals] = await Promise.all([
  storage.getMeals(req.user!.id),
  storage.getSystemMeals(),
]);
res.json([...userMeals, ...systemMeals]);
```

The system meal being forked **is in the `/api/meals` cache** at the time Add fires. The synchronous `setQueryData` in `acceptMutation.onSuccess` (MealUpliftPanel.tsx:205–241) will find the original in `prev` and can construct the fork entry immediately.

### Cache update code (pre-existing, MealUpliftPanel.tsx:205–241)

```typescript
qc.setQueryData<Meal[]>(["/api/meals"], (prev) => {
  // Case 1: fork already in cache → update ingredients
  // Case 2: original found → create fork entry with added ingredients
  // Case 3: original not found → log warning, skip (async refetch will carry it)
});
```

All paths are already instrumented with `[BOOST-PROOF] STEP3` logs. The STEP3 log immediately after the `setQueryData` call confirms whether the fork is present and whether its ingredients include the added boost.

### Verification result (static analysis)

Because `/api/meals` returns system meals, the `original = prev.find(m => m.id === data.forkedFromMealId)` lookup will succeed. The fork is added synchronously to cache with the boosted ingredient. The subsequent `qc.invalidateQueries({ queryKey: ["/api/meals"] })` causes a background refetch that confirms the server state.

The STEP3 logs (`[BOOST-PROOF] STEP3 meals cache AFTER setQueryData`) already emit the fork's ingredient list for runtime verification. No additional logging was needed.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/pages/weekly-planner-page.tsx` | Render gate: `mergedMatches.length === 0` → also check `!hasBoostedThisSession` |
| `client/src/components/MealUpliftPanel.tsx` | Removed inner `upliftMatches.length === 0` guard; changed `enabled: open` to `enabled: open \|\| upliftMatches.length === 0` |

---

## Behaviour After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Last pending boost accepted | Panel unmounts | Panel stays mounted |
| Accepted boost label visible | Disappears | Persists |
| Remove button visible | Disappears | Persists |
| Panel accepts a second boost after first | Broken (unmounted) | Works (same fork re-used) |
| Close/reopen dialog (no page refresh) | Accepted boost visible (fork in planner cache) | Same — boostedMealIds persists across dialog open/close |
| "· N added" in collapsed header | Never showed (query only on open) | Appears immediately after accept |

---

## Remaining Limitations

**Post-page-refresh**: After a full browser refresh, `boostedMealIds` resets. If the fork meal has no pending suggestions at dialog open time, the panel will not render. The accepted boost data is in the DB and the applications query would return results — but the parent gate blocks the panel from mounting. Fixing this requires either pre-querying uplift applications for planner meals or making the planner entry carry a "has boosts" flag. This is out of scope for this fix.

**handleUpliftRemoved clears the mealId from boostedMealIds**: If the user removes a boost, `boostedMealIds` loses that mealId. However, the removed ingredient re-appears as a pending suggestion (since it's no longer in `meal.ingredients`), so `mergedMatches.length > 0` keeps the panel alive independently.

---

## Data Impact

- Reads existing data: YES
- Writes existing data: YES (existing Nutrition Boost add/remove flow only, unchanged)
- Changes meaning of existing data: NO
- Schema changes: NO
- Requires backfill: NO

---

## Trust Check

- Label appears only for accepted persisted applications (server `uplift-applications` query)
- Remove appears only for boost-added ingredients (same query)
- UI does not fabricate accepted state — `activeApplications` comes exclusively from the server
- Cache update uses server response `data.mealId` (not a guessed ID)
- No duplicate fork: fork detection via `data.forkedFromMealId !== null && data.mealId !== effectiveMealId` (existing logic, unchanged)
