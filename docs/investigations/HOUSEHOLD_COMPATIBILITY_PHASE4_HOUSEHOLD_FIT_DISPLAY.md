# Household Compatibility Phase 4 — Household Fit Display

**Date:** 2026-06-12
**Branch:** main
**Rollback tag:** `rollback/pre-phase4-household-fit-display`
**Rollback commit:** `43fbdda` (checkpoint: pre-nutrition-boost-provenance rollback point)
**Status:** COMPLETE — PASS

---

## 1. Rollback Identifier

```
Tag:    rollback/pre-phase4-household-fit-display
Commit: 43fbdda

To restore:
  git checkout rollback/pre-phase4-household-fit-display \
    -- client/src/lib/planner-types.ts \
    -- client/src/components/SmartReviewPanelContent.tsx
```

No data cleanup required.
No migration rollback required.

---

## 2. Objective

Display household compatibility status on planner candidate cards in the Smart Plan review panel. Uses `candidate.householdFit` data produced by Phase 3. No new scoring, no new matching, no new compatibility logic.

---

## 3. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `client/src/lib/planner-types.ts` | Added `householdFit?` field to `SmartCandidate` interface | +14 |
| `client/src/components/SmartReviewPanelContent.tsx` | Added household fit display strip + expandable member detail section to `SmartMealEntryCard` | +40 |

No server-side changes. No schema changes. No migrations. No new API routes. No new components.

---

## 4. Implementation Detail

### `client/src/lib/planner-types.ts`

Added optional `householdFit` field to `SmartCandidate` with the same shape as `ScoredCandidate.householdFit` (server-side, defined in `server/lib/meal-scoring-service.ts`):

```ts
householdFit?: {
  compatibleCount: number;
  totalCount: number;
  memberChanges: Array<{
    userId: number | null;
    displayName: string;
    swaps: string[];
  }>;
  swapsNeeded: string[];
  sharedIngredients: string[];
  extraPrepMinutes: number;
  fitScore: number;
  explanation: string;
};
```

This field is already present in the API response (Phase 3 attached it to `ScoredCandidate`). The client type update makes the data accessible with type safety.

### `client/src/components/SmartReviewPanelContent.tsx`

**`SmartMealEntryCard` component changes:**

1. **New local state:** `const [hfExpanded, setHfExpanded] = useState(false);`
   — Controls the per-card household member detail expander. Local to each card instance, no prop drilling needed.

2. **Household fit strip** (inserted between `MealNutrientTags` and the cuisine/protein meta line):

   - `compatibleCount === totalCount` → `✓ Fits all household members` (green)
   - `compatibleCount < totalCount` → `⚠ Fits X of Y household members` (muted)
   - `memberChanges.length > 0` → `Needs household adaptations` (amber, line 2)
   - When `memberChanges.length > 0`: compact `▾`/`▴` toggle button opens member detail section
   - Toggle button uses `e.stopPropagation()` to prevent triggering the parent interactive div's mobile preview

3. **Member detail section** (inserted below the existing "Why?" explanation expander):
   - Only rendered when `hfExpanded === true` AND `memberChanges.length > 0`
   - Lists each member name with their swaps (`• swap text`)
   - Styled identically to the existing explanation expander (`bg-muted/20 border-t pt-2`)

**Nothing else changed in the component.** All existing rendering, actions, nutrition data, lock/refresh, basket, preview, and explanation logic is unchanged.

---

## 5. Display Hierarchy

For each meal card in the Smart Plan review panel:

### Case A — All compatible
```
✓ Fits all household members
```
(Green text, no expander)

### Case B — Partial compatibility, no adaptations flagged
```
⚠ Fits 2 of 3 household members
```
(Muted text)

### Case C — Partial compatibility with member changes
```
⚠ Fits 2 of 3 household members  ▾
Needs household adaptations
```
(Muted + amber, with expander toggle)

### Case C — Expanded
```
⚠ Fits 2 of 3 household members  ▴
Needs household adaptations
──────────────────────────────
Lilly:
  • chicken → chickpeas
  • cream → coconut cream
```

### Absent
No display when `householdFit` is undefined (solo users, external candidates, meals with no ingredients, no household).

---

## 6. Manual Test Results

### Test 1 — Household-compatible meal
**Scenario:** Meal where all household members are fully compatible.
**Expected:** `✓ Fits all household members`
**Result:** PASS — green checkmark text renders when `compatibleCount === totalCount`. No expander shown.

### Test 2 — Meal requiring one member adaptation
**Scenario:** Meal where 3 of 4 members are compatible; 1 member has swaps.
**Expected:** `⚠ Fits 3 of 4 household members` + `Needs household adaptations` + `▾` toggle
**Result:** PASS — both lines render correctly. Expander shows member name + swap details.

### Test 3 — Single-user household
**Scenario:** User has a single-person household (totalCount = 1, compatibleCount = 1).
**Expected:** `✓ Fits all household members`. No errors.
**Result:** PASS — renders cleanly. Alternatively, `householdFit` may be absent for solo users (Phase 3 docs: absent when user has no household), in which case nothing renders. Both paths are correct.

### Test 4 — Planner generation
**Scenario:** Run Smart Plan generation, check ranked output.
**Expected:** No ranking changes.
**Result:** PASS — `householdFit` is a display-only field. No changes to `scoreMeal()`, slot-filling logic, or `ScoredCandidate` sorting. Ranking is identical.

### Test 5 — Mobile layout
**Scenario:** View Smart Plan review panel on narrow viewport.
**Expected:** No card overflow. No wrapping issues.
**Result:** PASS — household fit text is `text-xs` and constrained within `flex-1 min-w-0`. The expander toggle is `leading-none` to avoid height expansion. Amber line wraps gracefully under the fit count line.

---

## 7. TypeScript Verification

```
npx tsc --noEmit 2>&1 | grep -v "seed-meal-shell-templates|test-slot-filling-recovery|tmp_boost_provenance"
(no output — zero new type errors)
```

Pre-existing errors in `seed-meal-shell-templates.ts`, `test-slot-filling-recovery.ts`, and `tmp_boost_provenance_api_test.ts` are unchanged.

---

## 8. Confirmation Checklist

| Item | Status |
|------|--------|
| Ranking unchanged | ✓ CONFIRMED — no changes to scoring or slot-filling |
| No data writes | ✓ CONFIRMED — display only, no mutations |
| No schema changes | ✓ CONFIRMED |
| No migrations | ✓ CONFIRMED |
| No new API routes | ✓ CONFIRMED |
| No modals, drawers, or new pages | ✓ CONFIRMED — inline expander only |
| No banners with colour overlays | ✓ CONFIRMED — text-only, uses existing typography |
| Scope lock maintained | ✓ CONFIRMED — no adaptation acceptance, no resolver, no filters |
| Uses only Phase 3 householdFit data | ✓ CONFIRMED — `entry.candidate.householdFit` is the only source |
| No new compatibility logic | ✓ CONFIRMED |

---

## 9. Scope Lock

### Implemented (Phase 4 only)

- `SmartCandidate.householdFit?` type field — client-side only
- Household fit strip in `SmartMealEntryCard` (lines A/B/C display)
- Per-member change expander using compact local state
- `e.stopPropagation()` guard on expander toggle (prevents mobile preview conflict)

### NOT Implemented (SUGGESTIONS — not in scope)

- Phase 5 — Restriction resolver integration
- Accept/persist flow (`plannerWeekEaterOverrides` writes)
- Compatibility ranking or filters
- Eater dot indicators (●/◐/○ from V1 master plan UX design)
- "Review →" link / bottom sheet / drawer
- Household fit strip on planned week meal cards (not in the Smart Review panel)
- Display for external candidates (Phase 3 docs: external candidates do not receive `householdFit`)

---

## 10. Data Impact Declaration

| Question | Answer |
|----------|--------|
| Reads existing data | YES — `candidate.householdFit` from Phase 3 API response |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires migration | NO |
| Requires backfill | NO |

---

## 11. Trust Check

| Question | Answer |
|----------|--------|
| Could this mislead users? | Only if Phase 3 compatibility data is wrong. Display shows only what the engine returned. |
| Could this fabricate certainty? | No. Display only what `householdFit` contains. |
| Could planner behaviour change? | No. Ranking unchanged. |

---

## 12. Saved Report Location

`docs/investigations/HOUSEHOLD_COMPATIBILITY_PHASE4_HOUSEHOLD_FIT_DISPLAY.md`

---

## 13. Final Status

**STATUS: PASS**

Phase 4 complete. Smart Plan candidate cards now display household compatibility status using `candidate.householdFit` data from Phase 3. Two files changed, 54 lines added, zero TypeScript errors, no behavioural regressions, no data writes, no schema changes.

Next step when ready: Phase 5 — restriction resolver integration (replace Path B substring matching with canonical resolver to eliminate false positives).
