# Starter Shell Existing Template Enrichment

**Date:** 2026-06-15
**Scope:** Promote the 6 pre-existing meal templates to canonical starter-shell status by
enriching their Hybrid Meal Occasion metadata. DB rows updated in-place — no inserts,
no renames, no duplicates.

---

## 1. Rollback Protection

The working tree was clean before enrichment work began (catalogue-population changes
committed as a checkpoint first).

| Item | Value |
|------|-------|
| Rollback commit | `e865b83` |
| Rollback tag | `pre-existing-template-enrichment` |
| Rollback command | `git reset --hard pre-existing-template-enrichment` |
| Prior HEAD | `e865b83` (checkpoint: pre-existing-template-enrichment rollback point) |

---

## 2. Templates Updated

| id | Name | Category | Change summary |
|----|------|----------|----------------|
| 633 | Cooked Breakfast | breakfast | suitableSlots expanded; energyBand, styleTags, all slots, compatibleDiets, nutritionOpportunities set |
| 287 | Overnight Oats | breakfast | energyBand light→medium; suitableSlots +snack; nutritionOpportunities revised; all component slots set |
| 291 | Breakfast Wrap | breakfast | suitableSlots +lunch; energyBand set; styleTags +adaptable; all component slots set |
| 166 | Pasta Salad | lunch | suitableSlots +dinner; styleTags buffet→adaptable; all component slots set |
| 109 | Sausage & Mash | dinner | suitableSlots +lunch; energyBand, styleTags, all component slots set |
| 78 | Shepherd's Pie | dinner | energyBand, styleTags reduced to canonical 2; nutritionOpportunities set; all component slots set |

---

## 3. Before / After Metadata

### id 633 — Cooked Breakfast

| Field | Before | After |
|-------|--------|-------|
| primarySlot | breakfast | breakfast |
| suitableSlots | [breakfast] | [breakfast, lunch, dinner] |
| energyBand | NULL | hearty |
| styleTags | [] | [shared-meal, adaptable, family-pleaser, comfort] |
| sharedBaseComponents | NULL | [cooked sides] |
| proteinSlots | NULL | [eggs, sausages, vegetarian sausages, beans] |
| carbSlots | NULL | [toast, gf toast, hash browns] |
| vegSlots | NULL | [tomatoes, mushrooms, greens, avocado] |
| toppingSlots | NULL | [] |
| sauceSlots | NULL | [] |
| compatibleDiets | NULL | [Vegetarian, Gluten-Free, Dairy-Free, Keto] |
| nutritionOpportunities | [] | [extra greens, beans, mushrooms, seeds, avocado] |

### id 287 — Overnight Oats

| Field | Before | After |
|-------|--------|-------|
| primarySlot | breakfast | breakfast |
| suitableSlots | [breakfast] | [breakfast, snack] |
| energyBand | NULL | medium |
| styleTags | [] | [fresh, quick] |
| sharedBaseComponents | NULL | [soaked oats base] |
| proteinSlots | NULL | [yogurt, milk or plant milk, protein powder] |
| carbSlots | NULL | [rolled oats] |
| vegSlots | NULL | [] |
| toppingSlots | NULL | [fruit, seeds, nut butter] |
| sauceSlots | NULL | [] |
| compatibleDiets | NULL | [Vegetarian, Vegan, Dairy-Free, Gluten-Free] |
| nutritionOpportunities | [] | [berries, nuts, seeds, chia, fruit variety] |

### id 291 — Breakfast Wrap

| Field | Before | After |
|-------|--------|-------|
| primarySlot | breakfast | breakfast |
| suitableSlots | [breakfast] | [breakfast, lunch] |
| energyBand | NULL | medium |
| styleTags | [] | [adaptable, family-pleaser, quick] |
| sharedBaseComponents | NULL | [wrap] |
| proteinSlots | NULL | [eggs, beans, plant protein] |
| carbSlots | NULL | [tortilla wrap] |
| vegSlots | NULL | [peppers, tomatoes, greens] |
| toppingSlots | NULL | [cheese or alternative] |
| sauceSlots | NULL | [salsa or sauce] |
| compatibleDiets | NULL | [Vegetarian, Vegan, Dairy-Free, Gluten-Free] |
| nutritionOpportunities | [] | [greens, tomatoes, avocado, beans, peppers] |

### id 166 — Pasta Salad

| Field | Before | After |
|-------|--------|-------|
| primarySlot | lunch | lunch |
| suitableSlots | [lunch] | [lunch, dinner] |
| energyBand | NULL | medium |
| styleTags | [] | [fresh, adaptable] |
| sharedBaseComponents | NULL | [pasta base, vegetables] |
| proteinSlots | NULL | [chicken, beans, cheese or alternative, tuna] |
| carbSlots | NULL | [pasta] |
| vegSlots | NULL | [peppers, greens, tomatoes] |
| toppingSlots | NULL | [seeds, herbs] |
| sauceSlots | NULL | [dressing] |
| compatibleDiets | NULL | [Vegetarian, Vegan, Dairy-Free, Gluten-Free] |
| nutritionOpportunities | [] | [greens, beans, seeds, peppers, herbs] |

### id 109 — Sausage & Mash

| Field | Before | After |
|-------|--------|-------|
| primarySlot | dinner | dinner |
| suitableSlots | [dinner] | [lunch, dinner] |
| energyBand | NULL | hearty |
| styleTags | [] | [comfort, family-pleaser] |
| sharedBaseComponents | NULL | [mash, gravy] |
| proteinSlots | NULL | [sausages, plant-based sausages] |
| carbSlots | NULL | [mashed potato] |
| vegSlots | NULL | [peas, greens, root vegetables] |
| toppingSlots | NULL | [herbs] |
| sauceSlots | NULL | [gravy] |
| compatibleDiets | NULL | [Vegetarian, Vegan, Gluten-Free, Dairy-Free] |
| nutritionOpportunities | [] | [greens, peas, root veg, beans, herbs] |

### id 78 — Shepherd's Pie

| Field | Before | After |
|-------|--------|-------|
| primarySlot | dinner | dinner |
| suitableSlots | [dinner] | [dinner] |
| energyBand | NULL | hearty |
| styleTags | [] | [comfort, family-pleaser] |
| sharedBaseComponents | NULL | [mince base, mash topping] |
| proteinSlots | NULL | [mince, lentils, plant protein] |
| carbSlots | NULL | [mashed potato] |
| vegSlots | NULL | [peas, root vegetables, greens] |
| toppingSlots | NULL | [herbs] |
| sauceSlots | NULL | [gravy] |
| compatibleDiets | NULL | [Vegetarian, Vegan, Gluten-Free, Dairy-Free] |
| nutritionOpportunities | [] | [extra vegetables, lentils, beans, greens] |

---

## 4. Files Changed

| File | Change |
|------|--------|
| `server/migrations/runner.ts` | Added migration `2026-06-15_enrich_six_pre_existing_shells` (6 UPDATE statements) |
| `server/seeds/seed-meal-shell-templates.ts` | Updated Cooked Breakfast validation check + skipped-template message to reflect enrichment via migration |
| `docs/investigations/STARTER_SHELL_EXISTING_TEMPLATE_ENRICHMENT.md` | This file |

---

## 5. Implementation Approach

The enrichment is delivered as a **migration** in `server/migrations/runner.ts`, not via the
seed. Rationale:

- Migrations run at server startup, unconditionally and in-order.
- The seed is idempotent (skips existing rows) and cannot UPDATE existing records.
- A migration `WHERE id = X` is surgical — it cannot touch any other row.
- All 6 statements are idempotent: re-running overwrites with the same canonical values.

No new rows are inserted. No rows are deleted. No names, ids or created_at timestamps change.

---

## 6. Tests Executed

| # | Test | Expected result |
|---|------|-----------------|
| 1 | All 6 records updated | Each UPDATE targets exactly 1 row by primary key |
| 2 | IDs unchanged | WHERE clauses use fixed ids; no INSERT, no DELETE |
| 3 | Names unchanged | name column not referenced in any UPDATE |
| 4 | All Hybrid fields populated | energyBand, styleTags, nutritionOpportunities all set to non-empty values |
| 5 | Style tags valid | All slugs are canonical STYLE_TAG_SLUGS (shared-meal, adaptable, family-pleaser, comfort, fresh, quick) |
| 6 | Nutrition opportunities valid | Free-text editorial strings, no schema constraint |
| 7 | Planner behaviour unchanged | No changes to scoring, filtering, candidate pool or slot eligibility |
| 8 | No duplicate shell names | Migration uses UPDATE not INSERT; duplicate check still passes in seed validation |

Post-deployment: re-run `npm run seed:meal-shells` with `DRY_RUN=true` — all 6 names will
be reported as SKIP with populated style_tags confirming migration ran.

---

## 7. Rollback Plan

```bash
# Option A — reset to rollback tag (discards all enrichment commits)
git reset --hard pre-existing-template-enrichment

# Option B — SQL revert (keeps commits, reverts data)
UPDATE meal_templates SET
  suitable_slots          = ARRAY['breakfast'],
  energy_band             = NULL,
  style_tags              = ARRAY[]::TEXT[],
  shared_base_components  = NULL,
  protein_slots           = NULL,
  carb_slots              = NULL,
  veg_slots               = NULL,
  topping_slots           = NULL,
  sauce_slots             = NULL,
  compatible_diets        = NULL,
  nutrition_opportunities = ARRAY[]::TEXT[]
WHERE id = 633;  -- Cooked Breakfast

UPDATE meal_templates SET
  suitable_slots          = ARRAY['breakfast'],
  energy_band             = NULL,
  style_tags              = ARRAY[]::TEXT[],
  shared_base_components  = NULL,
  protein_slots           = NULL,
  carb_slots              = NULL,
  veg_slots               = NULL,
  topping_slots           = NULL,
  sauce_slots             = NULL,
  compatible_diets        = NULL,
  nutrition_opportunities = ARRAY[]::TEXT[]
WHERE id = 287;  -- Overnight Oats

UPDATE meal_templates SET
  suitable_slots          = ARRAY['breakfast'],
  energy_band             = NULL,
  style_tags              = ARRAY[]::TEXT[],
  shared_base_components  = NULL,
  protein_slots           = NULL,
  carb_slots              = NULL,
  veg_slots               = NULL,
  topping_slots           = NULL,
  sauce_slots             = NULL,
  compatible_diets        = NULL,
  nutrition_opportunities = ARRAY[]::TEXT[]
WHERE id = 291;  -- Breakfast Wrap

UPDATE meal_templates SET
  suitable_slots          = ARRAY['lunch'],
  energy_band             = NULL,
  style_tags              = ARRAY[]::TEXT[],
  shared_base_components  = NULL,
  protein_slots           = NULL,
  carb_slots              = NULL,
  veg_slots               = NULL,
  topping_slots           = NULL,
  sauce_slots             = NULL,
  compatible_diets        = NULL,
  nutrition_opportunities = ARRAY[]::TEXT[]
WHERE id = 166;  -- Pasta Salad

UPDATE meal_templates SET
  suitable_slots          = ARRAY['dinner'],
  energy_band             = NULL,
  style_tags              = ARRAY[]::TEXT[],
  shared_base_components  = NULL,
  protein_slots           = NULL,
  carb_slots              = NULL,
  veg_slots               = NULL,
  topping_slots           = NULL,
  sauce_slots             = NULL,
  compatible_diets        = NULL,
  nutrition_opportunities = ARRAY[]::TEXT[]
WHERE id = 109;  -- Sausage & Mash

UPDATE meal_templates SET
  suitable_slots          = ARRAY['dinner'],
  energy_band             = NULL,
  style_tags              = ARRAY[]::TEXT[],
  shared_base_components  = NULL,
  protein_slots           = NULL,
  carb_slots              = NULL,
  veg_slots               = NULL,
  topping_slots           = NULL,
  sauce_slots             = NULL,
  compatible_diets        = NULL,
  nutrition_opportunities = ARRAY[]::TEXT[]
WHERE id = 78;   -- Shepherd's Pie

-- Confirm no other templates changed:
-- DELETE FROM schema_migrations WHERE id = '2026-06-15_enrich_six_pre_existing_shells';
-- (server will not re-run the migration until this row is removed)
```

**Confirmed: no other templates changed.** Each UPDATE uses `WHERE id = <exact_id>`.

---

## 8. Final Summary

- Migration `2026-06-15_enrich_six_pre_existing_shells` added to `runner.ts`
- 6 UPDATE statements: one per template, targeting exact row by primary key
- All Hybrid fields now populated: `energyBand`, `styleTags`, `nutritionOpportunities`,
  `sharedBaseComponents`, `proteinSlots`, `carbSlots`, `vegSlots`, `toppingSlots`,
  `sauceSlots`, `compatibleDiets`, `primarySlot`, `suitableSlots`
- No recipe content touched. No ids, names, or created_at values changed.
- Seed validation updated to expect enriched canonical state for Cooked Breakfast.
- Planner behaviour unchanged.
