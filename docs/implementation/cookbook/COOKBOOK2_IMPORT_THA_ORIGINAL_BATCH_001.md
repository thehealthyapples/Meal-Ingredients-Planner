# COOKBOOK2 — Import: The Healthy Apples Original Founding Cookbook, Batch 001

**Status:** Implementation — dev-only data import.
**Created:** 2026-07-10
**Depends on:** `docs/implementation/cookbook/THA_ORIGINAL_FOUNDING_COOKBOOK_BATCH_001.md` (content authoring, 10 recipes).

---

## Mission

Make the 10 Batch 001 recipes visible in the **dev** Cookbook / Meals system.

## Architecture Compliance

Governing architecture reviewed before implementation:
- `docs/architecture/README.md` (Architecture Bootstrap / mandatory entry point).
- `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` (recipe content governance, acquisition lanes, write funnel).
- `docs/architecture/capabilities/meals.md` (Meals / Cookbook capability card — Source of Truth D12, `meals` table, `getSystemMeals()`).

Confirmed:
- **Cookbook owns recipe content only.** The import writes name, category, ingredients, method (instructions) and servings. Nothing else.
- **`servings/times/difficulty where supported`.** Only `servings` is a column on `meals`. Prep time, cook time and difficulty are **not** columns on `shared/schema.ts` `meals`, so they are intentionally omitted (they live in the authoring doc for humans).
- **Acquisition lane honesty (`THA_RECIPE_ACQUISITION_ARCHITECTURE.md` §2/§3).** Every row is written `acquisition_lane='tha_library'`, `acquisition_type='authored'` — THA-owned, THA-authored. `mealSourceType='starter'` also derives to `tha_library/authored` via `deriveAcquisitionFromLegacy`.
- **Canonical write funnel reused.** Inserts go through `storage.createMeal(userId, insertMeal)` — the write funnel named in `THA_RECIPE_ACQUISITION_ARCHITECTURE.md` §5. No new persistence path is created.
- **No adaptation / planning ownership taken.** No household adaptation, swap, leftover, planner or Decision-Engine logic is embedded. Those layers infer later from the canonical recipe content, per the Batch 001 content doc.

## Data Impact

- **Reads existing data:** yes (existing system-meal names, for idempotency).
- **Writes new data:** yes — up to 10 rows in the dev `meals` table (`is_system_meal=true`, `user_id=0`).
- **Changes meaning of existing data:** no.
- **Requires backfill:** no.
- **Schema / migrations:** none. No columns added, no migration files.
- **Production:** **untouched.** The importer refuses to run when `NODE_ENV=production` and only ever connects to the `DATABASE_URL` of the dev environment it is invoked in.

## Implementation

**How recipes become visible in the Cookbook.** The Cookbook/Meals surface merges each user's own meals (`getMeals(userId)`) with the shared system corpus (`getSystemMeals()` → `meals WHERE is_system_meal = true`). The existing founding corpus (384 rows) is stored as system meals owned by the synthetic system user `user_id = 0`. Batch 001 is stored the same way, so it appears in **every** dev user's Cookbook without per-user duplication.

**Script:** `scripts/import-tha-founding-cookbook-batch-001.ts`
- Defines the 10 recipes inline (transcribed verbatim from the Batch 001 authoring doc).
- Guards: aborts if `NODE_ENV=production`; asserts every name begins with `"The Healthy Apples"`.
- For each recipe: skips if a system meal with the exact same `name` already exists; otherwise calls `storage.createMeal(0, {...})`.
- `--rollback` flag deletes the imported rows (`is_system_meal=true AND name ILIKE 'The Healthy Apples%'`).

**Category mapping.** Dev `meal_categories`: `1=Breakfast, 2=Lunch, 3=Dinner` (no "Side" category exists).

| Batch category | count | Cookbook category id |
|---|---|---|
| breakfast | 1 | 1 (Breakfast) |
| lunch | 1 | 2 (Lunch) |
| dinner | 7 | 3 (Dinner) |
| side | 1 | 2 (Lunch) — THA-010 is a "side / lunchbox **main**"; mapped to the closest existing category rather than adding a new schema/category. |

**Idempotency.** Natural key = exact recipe `name` among system meals. A second run inserts nothing.

## Rollback

- **Rollback identifier (code):** git tag `rollback/cookbook-batch-001-pre` → commit `8e10ea3` (pre-change HEAD).
- **Rollback command (data):**
  ```bash
  npx tsx scripts/import-tha-founding-cookbook-batch-001.ts --rollback
  ```
  Deletes exactly the imported system meals (`is_system_meal=true AND name ILIKE 'The Healthy Apples%'`). Equivalent raw SQL:
  ```sql
  DELETE FROM meals WHERE is_system_meal = true AND name ILIKE 'The Healthy Apples%';
  ```
- **Rollback command (code, if the script/doc are committed):** `git reset --hard rollback/cookbook-batch-001-pre` (branch-local only; not required — the import is data, not code state).

## Validation

All checks passed (see Execution Record for evidence):
- ✅ All 10 meals appear in the dev Cookbook/Meals corpus (`is_system_meal=true`, ids 3650–3659).
- ✅ Ingredients and method are readable (non-empty text arrays; verified sample renders as plain lines).
- ✅ Categories correct: Breakfast ×1, Lunch ×2 (incl. the grain salad), Dinner ×7.
- ✅ No duplicates after a second run (0 inserted / 10 skipped; total count stays 10).
- ✅ No production data touched (dev `DATABASE_URL` only; importer refuses `NODE_ENV=production`).

## Manual Verification Steps

1. Start the dev app: `npm run dev`.
2. Open the Cookbook / Meals surface as any dev user.
3. Confirm the 10 "The Healthy Apples …" recipes appear.
4. Open one recipe (e.g. the curry) and confirm ingredients and method render and are readable.
5. Confirm categories read correctly (Breakfast ×1, Lunch ×2 incl. the grain salad, Dinner ×7).
6. Re-run the importer and confirm it reports 10 skipped / 0 inserted (no duplicates).

## Execution Record

- **Rollback identifier:** git tag `rollback/cookbook-batch-001-pre` → `8e10ea3` (pre-change HEAD).
- **Files changed:**
  - `scripts/import-tha-founding-cookbook-batch-001.ts` (new — dev-only idempotent importer)
  - `docs/implementation/cookbook/COOKBOOK2_IMPORT_THA_ORIGINAL_BATCH_001.md` (new — this document)
  - No schema, migration, or application code changed.
- **Import command used:**
  ```bash
  NODE_ENV=development npx tsx scripts/import-tha-founding-cookbook-batch-001.ts
  ```
- **Imported recipe names (10):**
  1. The Healthy Apples Apple, Oat & Cinnamon Morning Bowl — Breakfast
  2. The Healthy Apples Chickpea, Lemon & Spinach Soup — Lunch
  3. The Healthy Apples Basil Tomato Wholewheat Pasta — Dinner
  4. The Healthy Apples Golden Potato, Chickpea & Spinach Curry — Dinner
  5. The Healthy Apples Gentle Taco Rice Bowls — Dinner
  6. The Healthy Apples Roast Vegetable & Butter Bean Traybake — Dinner
  7. The Healthy Apples Chicken, Leek & Wholewheat Orzo One-Pot — Dinner
  8. The Healthy Apples Lentil & Root Vegetable Cottage Pie — Dinner
  9. The Healthy Apples Salmon, Broccoli & Brown Rice Traybake — Dinner
  10. The Healthy Apples Roasted Carrot, Chickpea & Herb Grain Salad — Lunch (side/lunchbox main)
- **Data rows inserted:** 10 rows in `meals` (dev), ids 3650–3659. No `meal_categories`, `nutrition`, `meal_items` or other rows written.
- **Idempotency result:** second run → 0 inserted, 10 skipped; total THA system meals remains 10.
- **Production check:** `NODE_ENV=production` run exits with "REFUSING TO RUN" and writes nothing.
- **Rollback command (data):** `npx tsx scripts/import-tha-founding-cookbook-batch-001.ts --rollback`
