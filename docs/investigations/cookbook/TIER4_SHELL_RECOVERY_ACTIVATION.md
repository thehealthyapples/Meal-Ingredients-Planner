# Tier-4 Shell Recovery Activation

**Date:** 2026-06-15
**Type:** Feature activation (approved scope: activate primarySlot/suitableSlots slot matching and A/B/C/D tie-breaking in Tier-4 shell recovery)
**Rollback identifier:** tag `rollback/pre-tier4-activation` at commit `5e1eb99`

**To rollback:**
```bash
git reset --hard rollback/pre-tier4-activation
```

---

## Background

THA has:
- A 699-template catalogue including 49 starter shell templates
- Each shell carries Hybrid Meal Occasion metadata: `primarySlot`, `suitableSlots`, `energyBand`, `styleTags`
- Tier-4 shell recovery was wired into `generateSmartSuggestion` (commit for `TIER4_MEAL_SHELL_RECOVERY_IMPLEMENTATION.md`) but the slot eligibility check inside `selectShellRecoveryCandidate` used `category` against `SLOT_CATEGORY_MAPPING` — not `primarySlot`/`suitableSlots`

---

## Root Cause

`selectShellRecoveryCandidate` in `server/lib/smart-suggest-service.ts` checked:
```ts
const allowedCategories = SLOT_CATEGORY_MAPPING[slot] || [slot];
const category = (template.category || "").toLowerCase();
if (!allowedCategories.includes(category)) continue;
```

This ignored `primarySlot` and `suitableSlots`, meaning shells that were explicitly
curated to serve multiple slots (e.g. Soup & Side with `suitableSlots: ["lunch","dinner"]`)
could only fill their category-mapped slot.

Additionally, the function returned the first eligible shell (by matcher fitScore order)
without applying the A/B/C/D tie-breaking rules described in the shell eligibility spec.

---

## Planner Flow Before

```
Tier 1 → unused slot-fit meals
Tier 2 → unused safe fallback (adjacent category)
Tier 3 → repeat-allowed slot-fit meals
Tier 4 → selectShellRecoveryCandidate
         ↓ checked: template.category via SLOT_CATEGORY_MAPPING
         ↓ returned: first eligible shell by matcher fitScore
```

## Planner Flow After

```
Tier 1 → unused slot-fit meals
Tier 2 → unused safe fallback (adjacent category)
Tier 3 → repeat-allowed slot-fit meals
Tier 4 → selectShellRecoveryCandidate
         ↓ checked: primarySlot === slot || suitableSlots.includes(slot)
                    (falls back to category check for legacy templates)
         ↓ collected: all eligible shells
         ↓ sorted by:
             A. primarySlot exact match (true first)
             B. energyBand preference per slot (lower index preferred)
             C. styleTags count (more preferred)
             D. original fitScore order (stable sort preserves for equals)
         ↓ returned: eligible[0].candidate
```

---

## Shell Selection Rules

### Slot eligibility (new)
A shell is eligible for a planner slot if:
1. `primarySlot === slot` (exact primary match), OR
2. `suitableSlots.includes(slot)`

Fallback for legacy templates (no `primarySlot`, empty `suitableSlots`): use `SLOT_CATEGORY_MAPPING` category check.

### Tie-breaking order (A/B/C/D)
| Priority | Rule | Detail |
|----------|------|--------|
| A | `primarySlot` exact match | Shells whose primarySlot equals the target slot are preferred over shells that only appear in suitableSlots |
| B | `energyBand` preference | Per-slot preference ordering (see `SLOT_ENERGY_PREFERENCE` constant) |
| C | `styleTags` count | More style tags preferred |
| D | Random | Stable sort preserves original fitScore ordering from household matcher |

### Energy band preference per slot
```
breakfast: ["light", "medium", "hearty"]
lunch:     ["medium", "light", "hearty"]
dinner:    ["hearty", "medium", "light"]
snack:     ["light", "medium", "hearty"]
```

### Hard gates (unchanged)
- Compatibility score must equal 1 (zero diet conflicts across household eaters)
- Compliant ingredients must be non-empty after filtering hard exclusions + diet pattern + household strict diets
- Assembled candidate must pass whole-candidate hard gates (same as apply-time compliance)

---

## Files Changed

| File | Change |
|------|--------|
| `server/lib/smart-suggest-service.ts` | Added `shellFitsSlot()` helper, `SLOT_ENERGY_PREFERENCE` constant; rewrote `selectShellRecoveryCandidate` to collect all eligible shells and sort by A/B/C/D |
| `server/tests/test-tier4-shell-recovery-activation.ts` | New: 8-scenario test file covering slot eligibility, tie-breaking, diet compliance, and category fallback |
| `docs/investigations/cookbook/TIER4_SHELL_RECOVERY_ACTIVATION.md` | This file |

---

## Tests Executed

| Test script | Result |
|-------------|--------|
| `npx tsx server/tests/test-tier4-shell-recovery-activation.ts` | See verification results |
| `npx tsx server/tests/test-household-vegan-vegetarian-hard-enforcement.ts` | Regression check |
| `npx tsx server/tests/test-slot-filling-recovery.ts` | Regression check |

---

## Verification Results

| Test suite | Tests | Result |
|-----------|-------|--------|
| `test-tier4-shell-recovery-activation.ts` | 26 | ✅ 26 passed, 0 failed |
| `test-household-vegan-vegetarian-hard-enforcement.ts` | 31 | ✅ 31 passed, 0 failed |
| `test-slot-filling-recovery.ts` | 16 | ✅ 16 passed, 0 failed |
| **Total** | **73** | **✅ All passed** |

### Key scenarios verified
| # | Scenario | Outcome |
|---|----------|---------|
| 1 | `primarySlot=breakfast` eligible for breakfast only (suitableSlots=[]) | ✅ |
| 2 | `suitableSlots` extends eligibility (Soup & Side for lunch+dinner) | ✅ |
| 3 | Cross-slot shell eligible for dinner when suitableSlots includes dinner | ✅ |
| 4 | Tie-breaking A: primarySlot exact match wins over suitableSlots-only | ✅ |
| 5 | Tie-breaking B: energyBand preference per slot (hearty for dinner, light for breakfast) | ✅ |
| 6 | Tie-breaking C: more styleTags preferred when A and B are equal | ✅ |
| 7 | Vegetarian household rejects chicken shell, selects veggie shell | ✅ |
| 8 | Vegan household rejects egg shell, selects plant-based shell | ✅ |
| 9 | Legacy templates (no primarySlot/suitableSlots) use category fallback | ✅ |
| 10 | Lunch slot selects appropriate lunch shells | ✅ |
| 11 | Breakfast slot selects appropriate breakfast shells (light energyBand preferred) | ✅ |
| 12 | No userId → Tier-4 never triggered | ✅ |
| 13 | Empty matches list → null (graceful degradation) | ✅ |
| 14 | Partial compatibility (< 1) rejected | ✅ |
| 15 | Hard exclusion: peanut-only shell rejected, nut-free shell selected | ✅ |

---

## Rollback Plan

| Step | Command |
|------|---------|
| 1. Identify rollback tag | `rollback/pre-tier4-activation` |
| 2. Hard reset | `git reset --hard rollback/pre-tier4-activation` |
| 3. Verify planner | Run `npx tsx server/tests/test-slot-filling-recovery.ts` |
| 4. Verify Tier-4 absent | Run `npx tsx server/tests/test-household-vegan-vegetarian-hard-enforcement.ts` |

**Files restored by rollback:**
- `server/lib/smart-suggest-service.ts` (reverts slot check to category-based)
- `server/tests/test-tier4-shell-recovery-activation.ts` (deleted — file did not exist before)

**How to disable Tier-4 without full rollback:**
In `generateSmartSuggestion`, the Tier-4 block starts at the inner `else` of the Tier-3 block.
Remove or comment out the `selectShellRecoveryCandidate` call and replace with the empty-slot debug log:
```ts
// Tier 4: disabled
console.debug(`[SmartSuggest] No suitable candidates for slot "${slot}" — 0 compliant meals exist`);
```

---

## Scope Confirmation

**Implemented ONLY:**
- Tier-4 shell slot matching via `primarySlot`/`suitableSlots`
- A/B/C/D tie-breaking in `selectShellRecoveryCandidate`

**NOT changed:**
- Planner ranking or scoring
- Diet restriction or household restriction logic
- Planner weighting or candidate ordering
- Planner UI
- Shopping, nutrition, or recipe data
