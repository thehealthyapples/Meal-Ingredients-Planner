# Compact Expandable Nutrition Boost Rows

**Date:** 2026-06-11
**Status:** Complete

---

## Summary

Presentation-only redesign of `MealUpliftPanel` in `client/src/components/MealUpliftPanel.tsx`.

**Before:** All pending boost suggestions rendered fully expanded — showing nutrient chips, benefit summary, and Add button for every row simultaneously, making the panel excessively tall.

**After:** Compact accordion list. Each suggestion is a collapsed row showing only the ingredient name and a chevron. Tapping a row expands it inline to reveal:
- Nutrient chips
- Benefit summary (or uplift engine `why` text as fallback)
- Weekly reuse message (if present)
- Add to meal button

Only one row is expanded at a time.

## Files changed

- `client/src/components/MealUpliftPanel.tsx`
  - `expandedWhy` state → `expandedIngredient` (accordion single-open state)
  - `HelpCircle` import removed
  - Suggestion rows rewritten: clickable header button + conditional expanded content block

## Preserved unchanged

- Add to meal acceptance flow and API call
- Shopping list invalidation
- System meal fork handling
- Nutrition recalculation callbacks
- Uplift provenance (accepted applications) section
- Duplicate suppression and ranking logic
- `NutritionBoostPanel` — not modified
