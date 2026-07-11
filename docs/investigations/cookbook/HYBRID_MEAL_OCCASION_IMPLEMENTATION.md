# Hybrid Meal Occasion + Human-Centred Style Tags — Implementation Record

Status: COMPLETE
Date: 2026-06-14
Approved scope: primarySlot, suitableSlots, energyBand, styleTags, styleTagDisplayMap, fallback compatibility. Additive only. No planner behaviour change, no shell seeding.

---

## 1. Rollback identifier

- **Rollback tag:** `rollback/pre-hybrid-meal-occasion`
- **Points to commit:** `39de34907459bccd0322fd89b074e4471b8f0409` (HEAD of `main` before this work)
- Tracked working tree was clean at tag time (only untracked investigation docs/scripts present, unaffected by a code revert).

Restore with: `git reset --hard rollback/pre-hybrid-meal-occasion` (code) + the migration rollback in §7.

---

## 2. Schema changes

Columns added to **both** `meal_templates` and `meals` (Drizzle `shared/schema.ts`):

| Column          | DB type          | Drizzle               | Nullability / default |
|-----------------|------------------|-----------------------|------------------------|
| `primary_slot`  | `TEXT`           | `text("primary_slot")` | nullable |
| `suitable_slots`| `TEXT[]`         | `text(...).array().notNull().default([])` | NOT NULL, default `{}` |
| `energy_band`   | `TEXT`           | `text("energy_band")`  | nullable |
| `style_tags`    | `TEXT[]`         | `text(...).array().notNull().default([])` | NOT NULL, default `{}` |

Allowed values (validated in app layer / constants, not DB CHECK to keep additive + non-breaking):
- `primary_slot` / `suitable_slots[]`: `breakfast | lunch | dinner | snack`
- `energy_band`: `light | medium | hearty`
- `style_tags[]` canonical slugs: `shared-meal, adaptable, family-pleaser, quick, comfort, fresh, indulgent, buffet, bar, one-pot`

---

## 3. Migration

ID: `2026-06-14_add_hybrid_meal_occasion` (appended to `server/migrations/runner.ts`).

Additive only. Adds the four columns with `IF NOT EXISTS` to both tables, then backfills:

- `primary_slot = lower(category)` only where the category is one of the four canonical slots
  (`breakfast/lunch/dinner/snack`). For `meals`, category is resolved via `category_id → meal_categories.name`.
- `suitable_slots` = the **exact inverse** of the existing `SLOT_CATEGORY_MAPPING`
  (category → set of slots that admit it). Derived strictly from the live mapping so the planner
  fallback (§5) reproduces today's eligibility byte-for-byte.
- `energy_band` = NULL (column default).
- `style_tags` = `{}` (column default).

Backfill guards every UPDATE with `... IS NULL` / empty-array checks so re-runs are no-ops.
No data deleted. No existing column altered. Existing rows remain valid.

### Inverse mapping applied (from live `SLOT_CATEGORY_MAPPING`)
```
breakfast -> [breakfast]
smoothie  -> [breakfast, snack]
lunch     -> [lunch]
snack     -> [lunch, snack]
salad     -> [lunch]
dinner    -> [dinner]
main      -> [dinner]
dessert   -> [snack]
drink     -> [snack]
```
> Note: the brief's illustrative examples (e.g. `salad -> [lunch, dinner]`) were intentionally
> NOT used for backfill — they would widen eligibility and change planner output. They are
> editorial/curation targets for future per-meal data, and the schema fully accepts them.

---

## 4. Files changed

- `shared/schema.ts` — four columns on `mealTemplates` + `meals`; `insertMealTemplateSchema` extended.
- `shared/style-tags.ts` — NEW. Canonical slugs, `STYLE_TAG_DISPLAY_MAP`, energy bands, meal slots,
  `CATEGORY_SLOT_MAPPING`, `deriveSystemStyleTags()`, `getStyleTagDisplayLabel()`.
- `server/migrations/runner.ts` — appended migration `2026-06-14_add_hybrid_meal_occasion`.
- `server/lib/meal-scoring-service.ts` — `ScoredCandidate` gains optional `primarySlot`, `suitableSlots`, `energyBand`.
- `server/lib/smart-suggest-service.ts` — `getCandidateSlotFit` gains the suitableSlots fallback branch (exported for tests).
- `server/tests/test-hybrid-meal-occasion.ts` — NEW test suite.
- `package.json` — `test:hybrid-meal-occasion` script.

---

## 5. Fallback behaviour

`getCandidateSlotFit(candidate, slot)`:
1. If `candidate.suitableSlots` is present and non-empty → `suitableSlots.includes(slot)`.
2. Else (legacy, unchanged): null category → `slot === "dinner"`; otherwise
   `SLOT_CATEGORY_MAPPING[slot].includes(category)`.

Existing converters (`convertMealToCandidate`, `convertExternalToCandidate`) do NOT populate
`suitableSlots`, so at runtime the field is undefined and path (2) runs — identical output.
Path (1) only activates for explicitly curated candidates supplied in future. This is why
backfilled DB data does not alter planner behaviour: the planner candidate pipeline does not
read the backfilled column today.

`energyBand` is metadata only — referenced nowhere in scoring/filtering/eligibility.

---

## 6. Style Tag label map

| Slug            | Display label  | Derivation |
|-----------------|----------------|------------|
| `shared-meal`   | Family Table   | System-derived when any protein/carb/veg/sauce/topping slot exists |
| `adaptable`     | Adaptable      | System-derived when `compatibleDiets.length >= 2` |
| `family-pleaser`| Family Pleaser | Curated only |
| `quick`         | Quick & Easy   | System-derived (templates) when `estimatedTotalTime < 20`; otherwise curated |
| `comfort`       | Comfort        | Curated only |
| `fresh`         | Fresh          | Curated only |
| `indulgent`     | Indulgent      | Curated only (editorial) |
| `buffet`        | Buffet         | Curated only |
| `bar`           | Bar            | Curated only (e.g. Jacket Potato / Wrap / Taco Bar) |
| `one-pot`       | One Pot        | Curated only |

`Fuss Free` intentionally NOT implemented — merged into `Quick & Easy`.

---

## 7. Rollback plan

1. **Code revert:** `git reset --hard rollback/pre-hybrid-meal-occasion`.
2. **Migration rollback** (only if columns must be removed):
   ```sql
   ALTER TABLE meal_templates DROP COLUMN IF EXISTS primary_slot, DROP COLUMN IF EXISTS suitable_slots,
     DROP COLUMN IF EXISTS energy_band, DROP COLUMN IF EXISTS style_tags;
   ALTER TABLE meals DROP COLUMN IF EXISTS primary_slot, DROP COLUMN IF EXISTS suitable_slots,
     DROP COLUMN IF EXISTS energy_band, DROP COLUMN IF EXISTS style_tags;
   DELETE FROM schema_migrations WHERE id = '2026-06-14_add_hybrid_meal_occasion';
   ```
   Columns are additive; leaving them in place is also safe (no code depends on them being present
   except the new optional reads, which tolerate absence).
3. Existing `category` / `category_id` values are never touched — preserved.
4. No meal data deleted.
5. No planner entry cleanup required.

---

## 8. Tests executed

New suite `server/tests/test-hybrid-meal-occasion.ts` (`npm run test:hybrid-meal-occasion`):
**159 passed, 0 failed.** Coverage maps 1:1 to the brief's required tests:

1. Old meal (category only) still works — legacy slot fit matches the live mapping for all
   9 categories × 4 slots, plus null-category → dinner. ✓
2. Meal with primarySlot + suitableSlots works. ✓
3. Cooked Breakfast (primary breakfast, suitable [breakfast, lunch, dinner]) valid. ✓
4. Smoothie (primary breakfast, suitable [breakfast, snack]) valid. ✓
5. Soup & Side (primary lunch, suitable [lunch, dinner]) valid. ✓
6. energyBand (light/medium/hearty) does not change eligibility. ✓
7. styleTags present do not change eligibility (display-only). ✓
8. Backfilled suitableSlots reproduces legacy eligibility exactly (parity test) +
   existing planner behaviour unchanged. ✓
   Plus: style-tag display map correctness, system-derivation subset, inverse-mapping integrity.

Regression / wider suite:
- `npm test` (additives, extracts, scoring, ingredient-language, product-dedup,
  planner-compliance): all green — 14/14, 13/13, 12/12, 18, 76, 25.
- `tsc --noEmit`: zero new type errors introduced (baseline 20 tracked errors unchanged;
  the only delta vs baseline is the 3 pre-existing untracked query-script errors). Fixed
  the one consequential type touch: `storage.ts::summaryFields()` now selects the four new
  `meals` columns so `MealSummary` stays satisfied.

## 9. Verification results (live DB)

Migration `2026-06-14_add_hybrid_meal_occasion` applied cleanly (newlyApplied: 1, schema at head).

Columns confirmed on both tables: `primary_slot TEXT` (nullable), `suitable_slots TEXT[] NOT NULL
DEFAULT '{}'`, `energy_band TEXT` (nullable), `style_tags TEXT[] NOT NULL DEFAULT '{}'`.

Backfill confirmed:
- `breakfast → breakfast / [breakfast]`, `lunch → lunch / [lunch]`, `dinner → dinner / [dinner]`,
  `snack → snack / [lunch,snack]`, `dessert → null / [snack]`, `drink → null / [snack]`.
- Unmapped categories (`baby meal`, `frozen meal`, `kids meal`) and null-category meals →
  `primary_slot` null, `suitable_slots []` → planner fallback path runs → behaviour preserved.
- Zero out-of-enum `primary_slot` values.

## 10. Final outcome

Approved scope delivered in full and nothing beyond it:
- Added: primarySlot, suitableSlots, energyBand, styleTags (both tables), styleTagDisplayMap,
  and the planner suitableSlots fallback branch.
- NOT done (respecting SCOPE LOCK): no shell seeding, no planner ranking/scoring/filtering
  change, no restriction/browsing/nutrition-boost change, no AI-generated tags. No UI surface
  added (no existing surface renders these tags yet; the display map is provided in
  `@shared/style-tags` for future rendering, ensuring labels like "Family Table" never show as
  raw slugs).
- Backward compatibility: existing `category` / `category_id` untouched; legacy candidates take
  the unchanged code path; backfilled `suitable_slots` is the exact inverse of the live mapping,
  so planner output is identical for existing meals.
