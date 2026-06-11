# MealVarietyNudge Retirement

**Date:** 2026-06-10

See full report: `docs/investigations/MEAL_VARIETY_NUDGE_RETIREMENT.md`

---

## Rollback

Tag: `rollback/before-meal-variety-nudge-retirement`

## Summary

Removed `MealVarietyNudge` from the meal dialog render path in
`client/src/pages/weekly-planner-page.tsx`.

Component, engine, and all supporting helpers preserved intact in
`client/src/components/nutrition-variety-chips.tsx`.

Architectural comments added at both the render site and component definition
explaining the oats/pizza problem and the THA philosophy decision.

No logic changes. No data changes. 30 Plants counter unaffected.
