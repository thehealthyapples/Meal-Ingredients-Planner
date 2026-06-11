# Meal Enhancement System Consolidation Investigation

**Date:** 2026-06-10

See full report: `docs/investigations/MEAL_ENHANCEMENT_SYSTEM_CONSOLIDATION_INVESTIGATION.md`

---

## Rollback

Tag: `rollback/before-enhancement-consolidation-investigation`

## Summary

Three independent systems are active in the meal dialog:

1. **MealVarietyNudge** — gap detector, client-side, meal-type blind, no action
2. **NutritionBoostPanel** — curated static list, client-side, meal-type aware, no action
3. **MealUpliftPanel** — rule engine, server-side, fully actionable, DB-persisted

They are solving related but distinct sub-problems.

The user's specific confusion ("why is rocket different?") is explained:
rocket comes from MealUpliftPanel (the only system with "Add to meal").
Spinach/Peppers/Mushrooms come from NutritionBoostPanel (informational only).
Oats comes from MealVarietyNudge (variety gap detector, not meal-type aware).

The "oats for pizza" problem is a MealVarietyNudge context-blindness issue —
fixable with a simple meal-type guard, no engine changes required.

No code changes made in this investigation.
