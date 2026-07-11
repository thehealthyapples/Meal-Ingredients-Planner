# COOKBOOK3 — Import: THA Original Founding Cookbook (500 Meal Library)

**Status:** Implementation — dev-only data import (complete).
**Created:** 2026-07-10
**Source of truth:** `data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json` (500 recipes; `metadata` + `recipes[]`).
**Supersedes:** the 10 prefixed Batch 001 rows (COOKBOOK2), reconciled in place — not duplicated.

---

## Mission

Import all 500 THA-authored recipes into the **dev** Cookbook / Meals system as global system meals, visible to every dev user, idempotently and without duplicates.

## Architecture Compliance

Governing architecture reviewed before implementation:
- `docs/architecture/README.md` (Architecture Bootstrap / mandatory entry point).
- `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` (acquisition lanes; §5 write funnel).
- `docs/architecture/capabilities/meals.md` (Meals / Cookbook capability card — SoT D12, `meals` table, `getSystemMeals()`, `lookupMeals()`).

Confirmed:
- **Cookbook owns recipe content only.** Rows carry name, category, ingredients, method, servings and acquisition provenance. Nothing owned by the Planner, Household Reasoning, Food Intelligence or Decision Engine is written.
- **Reused the canonical write funnel.** Inserts go through `storage.createMeal(userId, insertMeal)` (Recipe Acquisition Architecture §5). Reconciling updates use a scoped `db.update` on `meals` restricted to `is_system_meal=true` — no new persistence path, no new lane, no new vocabulary.
- **Honest provenance, no laundering (§3).** Every row is `acquisition_lane='tha_library'`, `acquisition_type='authored'`, `meal_source_type='starter'` — THA-owned, THA-authored. The external `recipe_id` is preserved via the stable `import_key` (`tha_original:THA-###`) stored in the existing `acquisition_source_key` column; this doubles as the idempotency key. No column meaning is abused: the founding-cookbook package *is* the acquisition source these rows came from.
- **No adaptation / planner ownership taken.** No household adaptation, swap, leftover, or planner/Decision-Engine instruction is embedded. Those layers infer later from the canonical ingredients.
- **No schema change, no migration.** No columns added or altered; no migration file. Fields the `meals` table does not support (`difficulty`, `prep_minutes`, `cook_minutes`, `cuisine_inspiration`, `why_this_works_for_tha`, `planner_readability_notes`, `slug`) are **not** forced into unrelated columns — they remain preserved in the retained source-of-truth JSON. This is deliberate: writing planner-readability notes onto the meal row would re-introduce duplicate ownership the architecture assigns to the Planner/Decision Engine (they are inferred from ingredients).

## Data Impact

- **Reads existing data:** yes — the system-meal corpus (id, name, `acquisition_source_key`) for matching; the source JSON.
- **Writes new data:** 490 new rows inserted into dev `meals`; 10 existing Batch-001 system rows updated in place.
- **Changes meaning of existing data:** the 10 Batch-001 rows are renamed from the `"The Healthy Apples …"` prefix to their clean 500-library names and their content refreshed to the 500-library text. Their row ids (3650–3659) are preserved.
- **User data:** untouched. All matching/writing is scoped to `is_system_meal=true, user_id=0`. Verified: 1,853 user meals unchanged; 0 user meals carry a `tha_original:` key.
- **Schema / migrations:** none.
- **Production:** untouched. The importer refuses to run under `NODE_ENV=production` and only ever connects to the dev environment's `DATABASE_URL`.

**Category mapping.** Dev `meal_categories`: `1=Breakfast, 2=Lunch, 3=Dinner, 4=Snack` — there is no "Side" category. Mapping: breakfast→1, lunch→2, dinner→3, snack→4, **side→2 (Lunch)** (consistent with COOKBOOK2's THA-010). Source counts (breakfast 75, lunch 110, dinner 270, side 25, snack 20) therefore land as DB categories Breakfast 75 / Lunch 135 / Dinner 270 / Snack 20.

## Trust Check

- **No copied recipes / no external adaptation.** Source is THA's own authored corpus (`acquisition_lane='tha_library'`, `acquisition_type='authored'`); no external provider is contacted; no scraping.
- **No fabricated provenance.** Provenance fields state only THA ownership; `acquisition_source_key` records the founding-cookbook import key, nothing more.
- **No fabricated nutrition.** No nutrition rows were written; nutrition remains a separate table, gapped rather than estimated (per the meals capability card trust rules).
- **No hard-coded household adaptations / no leftover / no planner logic** embedded in any row.
- **No duplicates, no user-meal overwrites** — verified below.

## Rollback Plan

- **Rollback identifier (code):** git tag `rollback/cookbook-500-pre` → commit `8e10ea3` (pre-change HEAD).
- **Pre-import data snapshot:** `docs/implementation/cookbook/COOKBOOK3_pre_import_system_meal_ids.json` — the 394 system-meal ids/names/keys before import (audit/restore reference).
- **Rollback command (data):**
  ```bash
  npx tsx scripts/import-tha-founding-cookbook-500.ts --rollback
  ```
  Deletes exactly the 500 THA Original rows (`is_system_meal=true AND acquisition_source_key LIKE 'tha_original:%'`). Equivalent SQL:
  ```sql
  DELETE FROM meals WHERE is_system_meal = true AND acquisition_source_key LIKE 'tha_original:%';
  ```
  This also removes the 10 reconciled Batch-001 rows. To restore the prior Batch-001 state afterwards, re-run `scripts/import-tha-founding-cookbook-batch-001.ts`.
- No schema/migration state to roll back.

## Manual Verification

1. `npm run dev`.
2. Open the Cookbook / Meals surface as any dev user → confirm the THA Original recipes appear (clean names, no "The Healthy Apples" prefix).
3. Open several recipes (e.g. "Golden Potato, Chickpea & Spinach Curry", "Lentil & Root Vegetable Cottage Pie") → confirm ingredients and method render and read correctly.
4. Search the Cookbook for "chickpea", "salmon", "Morning Bowl" → confirm THA Original meals are returned.
5. Confirm categories read correctly (Breakfast / Lunch / Dinner / Snack).
6. Re-run the importer → confirm 0 inserted / 500 reconciled and the total THA Original count stays 500.
7. Confirm a personal (user-created) meal is unchanged.

## User Acceptance Evidence

Automated validation against the dev DB after import (see Execution Record for commands):

| Check | Result |
|---|---|
| THA Original meals exist | **500** (`acquisition_source_key LIKE 'tha_original:%'`) |
| Unique names / unique import keys | **500 / 500** — no duplicate names, no duplicate keys |
| Recipe names starting "The Healthy Apples" | **0** (all reconciled to clean names) |
| Category distribution | Dinner 270, Lunch 135, Breakfast 75, Snack 20 (= 500) |
| Provenance uniformity | 500 × `tha_library / authored / starter` |
| Ingredients missing | **0** |
| Method missing | **0** |
| User meals with a `tha_original:` key (overwrite check) | **0** (1,853 user meals untouched) |
| Visible in Cookbook (`getSystemMeals()`) | 884 system meals total, **500** THA Original included |
| Search (`storage.lookupMeals`) | "chickpea" → 20/20 THA Original; "Morning Bowl" → reconciled THA-001 found |
| Planner access | THA Original rows are `is_system_meal=true` → available to `getSystemMeals()` / meal resolution |
| Idempotency (2nd run) | 0 inserted, 500 reconciled in place, count stays 500 |
| Production guard | `NODE_ENV=production` → "REFUSING TO RUN", exit 1, no writes |

## Imported Recipe Count

- **Source recipes:** 500.
- **Inserted (new rows):** 490.
- **Reconciled (existing Batch-001 rows updated in place):** 10.
- **THA Original rows in dev after import:** 500.

## Duplicate Handling Summary

- **Match order (system meals only):** `acquisition_source_key == import_key` → clean `recipe_name` → `legacy_recipe_name`. First hit is updated in place; otherwise a new row is inserted.
- **Batch-001 reconciliation:** the 10 pre-existing prefixed rows were matched via `legacy_recipe_name` and updated (renamed to clean names, content refreshed, `import_key` set, row ids 3650–3659 preserved) — no duplicate created.
- **Pre-import safety checks:** 0 clean-name collisions with existing system meals; 0 clean-name collisions with user meals; 0 pre-existing `tha_original:` keys.
- **Idempotency:** a second run matched all 500 via `acquisition_source_key` and inserted nothing. Post-import uniqueness verified: 500 distinct names and 500 distinct import keys.

## Files Changed

- **Added:** `scripts/import-tha-founding-cookbook-500.ts` (dev-only idempotent importer).
- **Added:** `docs/implementation/cookbook/COOKBOOK3_IMPORT_THA_ORIGINAL_FOUNDING_COOKBOOK.md` (this document).
- **Added:** `docs/implementation/cookbook/COOKBOOK3_pre_import_system_meal_ids.json` (pre-import snapshot, rollback aid).
- **Data (dev DB only):** 490 rows inserted, 10 rows reconciled in `meals`.
- No schema, migration, or application code changed.

## Execution Record

- **Rollback identifier:** git tag `rollback/cookbook-500-pre` → `8e10ea3`.
- **Import command:** `NODE_ENV=development npx tsx scripts/import-tha-founding-cookbook-500.ts`
- **First run:** 490 inserted, 10 reconciled (all via `legacy_recipe_name`), 500 total, 0 prefixed.
- **Second run (idempotency):** 0 inserted, 500 reconciled in place, 500 total.
- **Rollback command:** `npx tsx scripts/import-tha-founding-cookbook-500.ts --rollback`
