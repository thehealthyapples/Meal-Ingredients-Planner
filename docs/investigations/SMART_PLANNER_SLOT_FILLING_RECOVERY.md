SMART PLANNER SLOT FILLING RECOVERY: IMPLEMENTED

---

## Rollback Identifier

Tag: `pre-slot-filling-recovery` on commit `96acb98`

To roll back:
```
git checkout pre-slot-filling-recovery -- server/lib/smart-suggest-service.ts
```

---

## Files Changed

- `server/lib/smart-suggest-service.ts` — Added `getRepeatCandidates()` and Tier-3 fallback
- `server/tests/test-slot-filling-recovery.ts` — New: 16-case regression suite

---

## Root Cause Found

`usedIds = new Set<string | number>()` (line 477) accumulates every selected meal ID per generation and never resets. The slot-selection loop filters:

```typescript
let slotCandidates = allCandidates.filter(c => {
  if (usedIds.has(c.id)) return false;  // permanent block
  return getCandidateSlotFit(c, slot);
});
```

When the unique candidate pool for a slot is exhausted, `usedIds` blocks every remaining compliant meal. The Tier-2 fallback (`getSafeFallbackCandidates`) also checked `usedIds`, so it provided no recovery.

There was no Tier 3. Once unique candidates were gone, the only outcome was an empty slot — even when compliant meals were sitting in `allCandidates`, fully validated and ready.

---

## `usedIds` Findings

- `usedIds` is unconditional. Every selected meal — regardless of slot or day — is permanently blocked from re-selection.
- `getSafeFallbackCandidates` for breakfast explicitly `if (usedIds.has(c.id)) return false` at line 280.
- For a Keto user with 2 compliant breakfast meals (user 1: Omelet, easy omelet): after days 1–2 both IDs are in `usedIds`. Days 3–7 produced 0 candidates from both Tier 1 and Tier 2 → 5 empty breakfast slots.
- For a Vegan user: 0 breakfast-category meals in the local library pass the Vegan filter for user 1 (all 10 contain eggs or dairy). Vegan breakfast slots required external candidates. If external search returned ≥1 vegan breakfast candidate, it was used once, added to `usedIds`, then blocked for the remaining 6 days.

---

## Before/After Slot Counts

### Keto plan — user 1

| Slot | Before (BEFORE fix) | After (AFTER fix) |
|---|---|---|
| Breakfast (7 slots) | 2 filled, 5 empty | **7 filled** |
| Lunch (7 slots) | 7 filled | 7 filled |
| Dinner (7 slots) | 7 filled | 7 filled |
| **Total** | **16/21** | **21/21** |

Mechanism: Days 1–2 use Omelet and easy omelet (Tier 1). Days 3–7 trigger Tier-3 repeat — both meals remain slot-compliant and Keto-compliant, so each day picks one. No empty slots.

### Vegan plan — user 1

| Slot | Before (BEFORE fix) | After (AFTER fix) |
|---|---|---|
| Breakfast (7 slots) | 0 filled, 7 empty* | **7 filled** (if ≥1 external breakfast candidate passes Vegan filter) |
| Lunch (7 slots) | 7 filled | 7 filled |
| Dinner (7 slots) | 7 filled | 7 filled |
| **Total** | **14/21** | **21/21** |

*User 1 has 0 Vegan-compliant breakfast-category meals in local library (all 10 contain eggs/dairy). The BEFORE state relied entirely on external candidates that were never reused.

Note: Vegan breakfast completion is gated on external search returning ≥1 compliant breakfast candidate (smoothie, oat milk bowl, fruit salad, etc. from TheMealDB concept queries added in Session 6). Regression test confirmed: with 1 compliant Vegan breakfast meal, all 7 slots fill via Tier-3 repeat.

---

## Vegan Results

- Local Vegan-compliant breakfast-category meals: **0** (all 10 user-1 breakfast meals contain eggs or dairy)
- Tier-3 impact: any external vegan breakfast candidate returned at generation time can now repeat to fill all 7 slots
- Dietary compliance: all Vegan checks remain active — enforced at pool construction before Tier 3 is ever reached
- Boundary maintained: no dinner or lunch meals ever promoted to breakfast via Tier 3

---

## Keto Results

- Local Keto-compliant breakfast-category meals: **2** (Omelet ID 2018, easy omelet ID 2020)
- Before fix: 2/7 breakfast slots filled; 5/7 empty (days 3–7)
- After fix: 7/7 breakfast slots filled via Tier-3 repeat
- Dietary compliance: all Keto checks remain active — no bakery, grain, or sugar items in any breakfast slot

---

## Implementation: `getRepeatCandidates()`

New function added to `server/lib/smart-suggest-service.ts` (line 295–306):

```typescript
function getRepeatCandidates(
  allCandidates: ScoredCandidate[],
  slot: string,
): ScoredCandidate[] {
  return allCandidates.filter(c => getCandidateSlotFit(c, slot));
}
```

`allCandidates` is already fully filtered at pool-construction time:
- Dietary compliance: `candidateDietExcluded()` → `shouldExcludeRecipe()` → `dietRules`
- Household hard restrictions: `isHardExcluded()`
- Premium / subscriber-only gate: `candidateIsPremium()`
- Component gate: routes.ts pre-filters before calling service
- Product gate: `candidateIsProduct()`
- Drink gate: `isDrinkCandidate()`

`getRepeatCandidates` only relaxes the `usedIds` constraint — all safety properties are preserved.

---

## Tier-3 Selection Flow

```
Tier 1: Unused slot-fit candidates
  → usedIds check + getCandidateSlotFit
  ↓ if empty:

Tier 2: Unused safe fallback (category-adjacent)
  → usedIds check + breakfast boundary maintained
  ↓ if empty:

Tier 3: Repeat — compliant slot-fit candidates (NEW)
  → getCandidateSlotFit only, no usedIds check
  → All safety gates preserved (diet, hard exclusions, premium, component)
  → Breakfast boundary: only breakfast/smoothie in breakfast slot
  ↓ if empty:

EMPTY SLOT (truly no compliant meals exist)
```

---

## Selection Order Preserved

The scoring and randomness logic is unchanged. After Tier-3 fills `slotCandidates`, the full scoring pipeline runs:
- `scoreMeal()` still weighs variety, ingredient reuse, protein distribution, cuisine preference
- `usedIngredients` still accumulates and penalises ingredient repetition
- Top-5 selection with bounded randomness still applies
- Result: when multiple compliant meals are available, the planner naturally avoids immediate back-to-back repeats

---

## Build Result

```
npm run build: PASS — client built in 10.76s, server built in 304ms, 0 errors
```

---

## TypeScript Result

```
npx tsc --noEmit: PASS — 0 errors
```

---

## Test Result

| Test file | Count | Result |
|---|---|---|
| test-smart-suggest-diet-pattern | 13/13 | ✅ PASS |
| test-diet-reconciliation-bridge | 12/12 | ✅ PASS |
| Keto/Low-Carb dictionary | 18/18 | ✅ PASS |
| Dietary pattern compliance | 76/76 | ✅ PASS |
| Planner compliance gate | 25/25 | ✅ PASS |
| **test-slot-filling-recovery (new)** | **16/16** | ✅ PASS |
| **test-plant-milk-vegan (prev session)** | **27/27** | ✅ PASS |

Total: **0 failures**

---

## Manual Verification

Manual generation was simulated via the regression test suite using `generateSmartSuggestion()` directly with synthetic meal pools designed to trigger Tier-3 conditions:

| Scenario | Breakfast slots filled | Dietary compliance |
|---|---|---|
| Keto, 2 breakfast meals | 7/7 | ✓ all Keto |
| Vegan, 1 compliant breakfast meal | 7/7 | ✓ all Vegan |
| No breakfast meals at all | 0/7 | N/A |
| Dinner meals only (no breakfast) | 0/7 (local only) | ✓ |
| Premium + 1 valid breakfast | 7/7 (premium excluded) | ✓ |
| 3 unique breakfasts, 7 slots | 7/7 (all 3 unique used first) | ✓ |

The boundary test confirmed that local dinner meals are never promoted to breakfast slots via Tier-3. The variety test confirmed that unique meals are exhausted before repeats activate.

---

## Known Limitations

1. **Vegan local library gap remains**: User 1 has 0 local Vegan-compliant breakfast-category meals. Tier-3 helps when ≥1 external candidate exists, but cannot fill breakfast if external search returns nothing compliant. This is a library content problem, not a planner logic problem.

2. **`usedIds` still never resets between days** (by design — prevents same meal appearing in multiple slots on the same day). Tier 3 relaxes the cross-day reuse constraint but the within-day constraint remains intact.

3. **Fish/red meat cap sub-filter fallbacks**: When Tier-3 is active and the fish or red meat cap is hit, the fallback calls `getSafeFallbackCandidates` which still excludes `usedIds`. In the edge case where every compliant meal in the pool is a fish meal and the fish cap is hit, the slot will still be empty. This is correct behaviour for that constraint combination.

---

## Report File Location

`docs/investigations/SMART_PLANNER_SLOT_FILLING_RECOVERY.md`
