# Meal Dialog Information Density Reduction

**Date:** 2026-06-09

See full report: `docs/investigations/MEAL_DIALOG_INFORMATION_DENSITY_REDUCTION.md`

---

## Rollback

Tag: `rollback/before-meal-dialog-density-reduction`

## Summary

Two presentation-only changes to `client/src/pages/weekly-planner-page.tsx`:

1. "Who's Eating This?" collapses by default — shows `Who's eating this? (4) ⌄`
2. Household Adaptation card compressed to single header line — `Household Adaptation (4)  [Tailor]`

No logic, data, schema, or planner changes.
