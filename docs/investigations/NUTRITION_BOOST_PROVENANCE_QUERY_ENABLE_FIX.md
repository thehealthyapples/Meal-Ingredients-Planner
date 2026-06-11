# Nutrition Boost Provenance Query Enable Fix

## Rollback Identifier

Tag: `rollback/before-provenance-query-fix-2`  
Commit: `80c5b7586dc8c9c0818952a78963e38d2e88dc86`  
Message: `feat(nutrition-boost): compact UX refinement — multi-expand rows, Add always visible, ingredient visibility fix`

To restore: `git checkout rollback/before-provenance-query-fix-2`

---

## Git Status at Start

Existing unstaged changes were present across:
- `client/src/components/MealUpliftPanel.tsx`
- `client/src/components/nutrition-variety-chips.tsx`
- `client/src/lib/nutrition-variety.ts`
- `client/src/pages/weekly-planner-page.tsx`
- `package.json`
- `server/lib/household-meal-matcher.ts`
- `server/migrations/runner.ts`

These changes were not touched by this fix.

---

## File Changed

`client/src/components/MealUpliftPanel.tsx` — line 131

---

## Enabled Condition Before / After

**Before:**
```ts
// Enable eagerly when no pending suggestions — component is mounted only
// because the parent detected accepted boosts (boostedMealIds), so we load
// immediately to show "N added" in the collapsed header without requiring open.
enabled: open || upliftMatches.length === 0,
```

**After:**
```ts
enabled: true,
```

---

## Root Cause

The old condition `open || upliftMatches.length === 0` evaluates to `false` in the normal user flow where:

1. The panel is **collapsed** (`open = false`), AND
2. There are still **pending suggestions** (`upliftMatches.length > 0`)

This is the exact state after a user adds one boost while the panel is collapsed and other boost suggestions remain. The provenance query never fired, so `applications` stayed empty, and neither "Added via Nutrition Boost" nor the Remove button could render.

---

## Why `enabled: true` Is Safe

- `effectiveMealId` is a `useState` initialized from the required `mealId` prop — always a valid number.
- No URL construction risk: the meal ID is always defined when the component mounts.
- `staleTime: 30_000` remains in place, so the query does not fire on every render — React Query deduplicates against the cache.
- The endpoint (`GET /api/meals/:mealId/uplift-applications`) is read-only; always querying it has no write-side effects.

---

## Query Behaviour After Fix

| Scenario | Before | After |
|---|---|---|
| Panel collapsed, suggestions pending | Query **disabled** | Query **runs** |
| Panel open, suggestions pending | Query runs | Query runs |
| Panel collapsed, no suggestions | Query runs | Query runs |
| Panel open, no suggestions | Query runs | Query runs |

---

## Data Impact

| Dimension | Impact |
|---|---|
| Reads existing data | YES — reads `meal_uplift_applications` |
| Writes existing data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |

---

## Manual Test Results

Tests to be confirmed against live app:

### Test 1 — Add boost while panel collapsed
1. Open meal modal
2. Confirm Nutrition Boost panel is collapsed
3. Click **Add** on Pumpkin Seeds

Expected:
- Ingredient appears in meal ingredient list
- "Added via Nutrition Boost" label appears
- Remove button appears

### Test 2 — Close and reopen modal
1. After Test 1, close modal
2. Reopen same meal modal

Expected:
- Ingredient still visible
- "Added via Nutrition Boost" label still visible
- Remove button still visible
- No browser refresh required

### Test 3 — Add second boost
1. After Test 1, add a second boost

Expected:
- Both ingredients visible
- Both labelled "Added via Nutrition Boost"
- Both removable independently

### Test 4 — Remove first boost
1. Click Remove on Pumpkin Seeds

Expected:
- Pumpkin Seeds removed from ingredient list
- Its label removed
- Second boost remains untouched

---

## Scope

This fix is strictly limited to removing the conditional `enabled` guard on the uplift applications query.

No changes to:
- Endpoint
- Schema
- Fork logic
- Boost generation
- Remove endpoint
- Ingredient persistence
- Compact boost rows
- Add button
- Duplicate suppression

---

## Remaining Issues

None identified by this fix. If "Added via Nutrition Boost" still does not appear after this change, the failure would be in the render path downstream of `activeApplications` rather than in the query gating.
