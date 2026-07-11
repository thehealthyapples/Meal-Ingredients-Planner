# Nutrition Boost Visible Idea Limit Increase

## Rollback Identifier

**Tag:** `pre-boost-limit-increase`  
**Commit at tag:** `1e83f32` (fix(smart-planner): Tier-3 controlled-repeat fallback for exhausted slot pools)

To rollback:
```
git checkout pre-boost-limit-increase
```

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/MealUpliftPanel.tsx` | Visible slice increased from 2 → 5 |
| `client/src/lib/nutrition-boosts.ts` | Fallback candidate cap increased from 3 → 5 |

---

## Cap Investigation

The visible limit was applied in two places:

### Cap 1 — `nutrition-boosts.ts` line 187 (fallback candidate pool)
Applied **before** merge, inside `getMealBoosts()`:
```typescript
// before
if (result.length >= 3) break;

// after
if (result.length >= 5) break;
```
This limited the deterministic fallback pool to 3 items regardless of how many matching boosts existed for the meal type. Raising to 5 allows up to 5 fallback candidates to enter the merged pool.

### Cap 2 — `MealUpliftPanel.tsx` lines 116–117 (visible ranking slice)
Applied **after merge and ranking**:
```typescript
// before
const selectedReuse = reuseSuggestions.slice(0, 1);
const selectedDiscovery = discoverySuggestions.slice(0, 2 - selectedReuse.length);

// after
const selectedReuse = reuseSuggestions.slice(0, 1);
const selectedDiscovery = discoverySuggestions.slice(0, 5 - selectedReuse.length);
```
This was the binding cap. Previously: max 1 reuse + max 1 discovery = max 2 visible.  
After: max 1 reuse + max 4 discovery = max 5 visible.

---

## Previous Limit vs New Limit

| Metric | Before | After |
|--------|--------|-------|
| `getMealBoosts()` max return | 3 | 5 |
| `MealUpliftPanel` max visible | 2 | 5 |
| Reuse-slot cap | 1 | 1 (unchanged) |
| Discovery-slot cap | 1–2 | 4–5 |

---

## What the Panel Can Now Show

### Example: Salad meal, no server uplift
`MEAL_TYPE_BOOSTS` salad entry: `["Pumpkin Seeds", "Chickpeas", "Sauerkraut", "Walnuts"]`

- `getMealBoosts()` returns all 4 (previously returned 3)
- After dedup (no server uplift): 4 candidates pass through
- `visibleSuggestions` = 4 (capped at 5, only 4 available)
- Header: **"Nutrition Boost · 4 ideas"**
- Previously showed: 2

### Example: Meal with server uplift (1 suggestion) + fallback (4 candidates, 2 deduplicated away)
- Server suggestions: 1
- Fallback after dedup: 2
- Total merged pool: 3
- `visibleSuggestions` = 3
- Header: **"Nutrition Boost · 3 ideas"**

### Example: Meal with server uplift (2 suggestions) + fallback (5 candidates, 0 overlapping)
- Server suggestions: 2
- Fallback: 4 (list cap)
- Total merged pool: 6
- `visibleSuggestions` = 5 (bounded by new cap)
- Header: **"Nutrition Boost · 5 ideas"**

---

## Ranking Logic Preserved

The reuse-aware ranking is unchanged:

```
P1 (reuse) — already used elsewhere this week, max 1 slot
P2 (discovery) — not yet used this week, fills remaining slots up to 5
```

Only the `slice` bounds changed. Scoring, ordering, and the P1/P2 priority structure are identical to before.

---

## Verification Checklist

| Check | Status |
|-------|--------|
| Visible limit increased to 5 | ✓ |
| `getMealBoosts()` fallback cap raised to match | ✓ |
| Ranking logic (P1 reuse / P2 discovery) unchanged | ✓ |
| Duplicate suppression logic unchanged | ✓ |
| Header count auto-updates from `pendingSuggestions.length` | ✓ |
| Add to meal path unchanged (same `acceptMutation` / `/api/uplift/accept`) | ✓ |
| Shopping list invalidation unchanged | ✓ |
| Nutrition recalculation unchanged | ✓ |
| Undo/remove behaviour unchanged | ✓ |
| Provenance tracking unchanged | ✓ |
| No new boost systems introduced | ✓ |
| No pagination or "show more" introduced | ✓ |

---

## Manual Test Guide

### Test 1 — More than 2 boosts visible
Open a salad meal (e.g. "Big Green Salad") with no server uplift.
**Expected:** Panel header shows "Nutrition Boost · 4 ideas". All 4 have "Add to meal".

### Test 2 — Add to meal on all visible suggestions
Click "Add to meal" on each suggestion in turn.
**Expected:** Each ingredient is added. No crash. Meal ingredients update. Panel shows "added" state per ingredient.

### Test 3 — Duplicate suppression still works
Open a meal where server uplift suggests "Spinach". Fallback also suggests "Spinach".
**Expected:** Spinach appears exactly once in the panel.

### Test 4 — Shopping list updates
Add a boost. Check shopping list.
**Expected:** Shopping list refreshes to include the new ingredient.

### Test 5 — Nutrition recalculation
Add a boost. Open meal nutrition view.
**Expected:** Nutrition data reflects the added ingredient.

### Test 6 — Mobile layout
Open the panel on a narrow viewport.
**Expected:** All ideas stack legibly. No overflow or clipping.

---

## Scope Confirmation

Only the visible limit was changed. No other modifications were made to:
- Boost library data
- Meal type keyword matching
- Household restriction filtering
- Diet pattern filtering
- Server uplift engine
- Duplicate suppression logic
- Shopping integration
- Nutrition recalculation path
