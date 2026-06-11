# MealVarietyNudge Retirement

**Date:** 2026-06-10
**Scope:** Presentation-only removal. No component deleted. No engine changed.

---

## Rollback Identifier

Tag: `rollback/before-meal-variety-nudge-retirement`

To restore the render call:
```
git checkout rollback/before-meal-variety-nudge-retirement -- client/src/pages/weekly-planner-page.tsx
```

---

## Files Changed

| File | Change |
|---|---|
| `client/src/pages/weekly-planner-page.tsx` | Removed render call + import. Added architectural comment block. |
| `client/src/components/nutrition-variety-chips.tsx` | Added architectural comment above component definition. |

---

## Exact Render Location Removed

**File:** `client/src/pages/weekly-planner-page.tsx`

**Before (lines ~3382–3386):**
```jsx
{/* Variety nudge */}
<MealVarietyNudge
  score={computeMealVariety(meal.ingredients ?? [])}
  pantryItems={pantryNames}
/>
```

**After:** Replaced with a multi-line architectural comment block explaining:
- Why the component was built
- Why it was removed (oats/pizza example)
- Why it should not be automatically reintroduced
- Difference between MealVarietyNudge and Meal Enhancements
- What the component's engine still powers (30 Plants counter, day dots, planner legend)

**Import line (line 36) before:**
```ts
import { NutritionVarietyDots, PlannerVarietyLegend, MealVarietyNudge, WeeklyPlantDiversityCounter } from "@/components/nutrition-variety-chips";
```

**After:**
```ts
import { NutritionVarietyDots, PlannerVarietyLegend, WeeklyPlantDiversityCounter } from "@/components/nutrition-variety-chips";
```

`MealVarietyNudge` removed from named import (was unused after render removal).

---

## Architectural Comment Added

### Location 1 — Render site (`weekly-planner-page.tsx`, ~line 3382)

Explains to future developers:
- What MealVarietyNudge does (category gap detector, pantry-aware)
- The specific failure mode: "Matambre a la Pizza → Oats would add a whole grain element"
- Why re-adding it would reproduce the same problem without meal-type awareness
- Distinction: MealVarietyNudge = gap analysis / Meal Enhancements = meal-relevant enrichment
- What THA philosophy now requires (meal-aware and household-aware suggestions)
- What the underlying engine continues to power (30 Plants, variety dots, legend)

### Location 2 — Component definition (`nutrition-variety-chips.tsx`, above `MealVarietyNudge`)

Explains:
- The retirement decision and date
- Why the component and helpers (FALLBACKS, findPantryItemForCategory) are preserved
- The specific oats/pizza example
- The philosophical shift from "What's missing?" to "What enriches this meal?"
- Explicit DO NOT instruction for future developers before re-adding to meal dialog

---

## What Was NOT Changed

| Item | Status |
|---|---|
| `MealVarietyNudge` component definition | Preserved |
| `findPantryItemForCategory` helper | Preserved |
| `FALLBACKS` constant | Preserved |
| `computeMealVariety` engine | Preserved |
| `nutrition-variety.ts` | Untouched |
| `WeeklyPlantDiversityCounter` | Untouched — still active |
| `NutritionVarietyDots` | Untouched — still active in planner card rows |
| `PlannerVarietyLegend` | Untouched — still active in planner header |
| `NutritionBoostPanel` | Untouched |
| `MealUpliftPanel` (Meal Enhancements) | Untouched |
| Plant variety scoring logic | Untouched |
| 30 Plants This Week counter | Untouched |

---

## Before/After UI Summary

| Element | Before | After |
|---|---|---|
| Meal dialog — variety nudge text | Present — e.g. "Oats would add a whole grain element." | Removed |
| Meal dialog — Nutrition Boosts | Present | Unchanged |
| Meal dialog — Meal Enhancements | Present | Unchanged |
| Planner card — variety dots | Present | Unchanged |
| Planner header — variety legend | Present | Unchanged |
| 30 Plants This Week counter | Present | Unchanged |

---

## Manual Test Checklist

1. Open meal dialog for any pizza meal — variety nudge text no longer appears
2. Open meal dialog — Nutrition Boosts section unchanged
3. Open meal dialog — Meal Enhancements section unchanged
4. Planner grid — coloured variety dots on meal cards unchanged
5. Planner header — variety legend unchanged
6. 30 Plants This Week counter shows correct value, unchanged
7. Progress bar on 30 Plants counter unchanged

---

## Data Impact Declaration

- Reads existing data: YES
- Writes new data: NO
- Changes meaning of existing data: NO
- Requires backfill: NO
- Schema changes: NO
- Migration required: NO

---

## Trust Check

Could this mislead users? No. The component produced contextually inappropriate suggestions. Its removal improves suggestion quality.

Could this fabricate certainty? No. This is a UX simplification.
