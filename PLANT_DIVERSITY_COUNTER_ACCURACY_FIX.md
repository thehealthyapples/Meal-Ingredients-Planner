# Plant Diversity Counter Accuracy Fix

See full report:

`docs/investigations/PLANT_DIVERSITY_COUNTER_ACCURACY_FIX.md`

**Date:** 2026-06-10
**Status:** Complete — implemented and verified
**Rollback tag:** `rollback/plant-diversity-counter-accuracy-fix-20260610-194229`

## Summary

Fixed `WeeklyPlantDiversityCounter` with two targeted changes:

1. **Dedup key:** Replaced `raw.toLowerCase().trim()` with `normaliseForReuse(raw)` — ingredient variants like "cherry tomatoes" and "vine tomatoes" now collapse to the same canonical key instead of counting as separate plants.

2. **Plant classification:** Replaced `computeMealVariety([raw]).total > 0` with new `isPlantIngredient(raw)` — added legumes (chickpeas, lentils, beans), seeds (pumpkin, chia, flax), nuts (walnuts, almonds), and fermented foods (sauerkraut, kimchi) to the recognised plant categories.

`computeMealVariety` and `VarietyScore` are unchanged — the five-category meal variety system is unaffected.
