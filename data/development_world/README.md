# THA Development World — Foundation 50 v1

Status: authored canonical dataset, not imported.

This is Option A: 50 high-quality fictional development households designed to be committed under `data/development_world/` and imported later by DEVWORLD2.

## Contents

- `development_world_foundation_50.v1.json` — combined machine-readable world.
- `development_world_foundation_50.v1.yaml` — combined human-readable world.
- `households/` — one JSON and one YAML file per household.
- `indexes/household_index.csv` — quick review index.
- `indexes/meal_reference_index.csv` — recipe references used by households.
- `manifests/validation_manifest.json` — local validation summary.
- `manifests/coverage_summary.json` — coverage counts.
- `prompts/DEVWORLD2_IMPORT_PROMPT.md` — concise Claude prompt for importer work once this folder is in the repo.

## Architecture boundary

The Development World authors household intent only. Recipe bodies stay owned by the THA Original Founding Cookbook. Households reference meals using `recipe_id` and `import_key` only.

Forbidden seeded outputs: nutrition, allergens, meal_allergens, learning signals, platform observations, opportunity deliveries, conversations, ingredient_sources and derived shopping rows.

## Coverage

- Households: 50
- Account identities: 96
- Eaters: 140
- Planner entries: 1352
- Diary entries: 392
- Evidence events: 343
- Pantry items: 775
- Unique THA Original recipe refs: 328
- Cold-start households: 1

## Honest gaps

- Product/ready-meal identities are not referenced because no stable product meal export was supplied with this artifact.
- Favourite meals remain persona narrative/evidence until THA has a favourite-meal schema.
- Skipped meals are not seeded as records. Absence of a diary entry remains the current representation.
- Gluten-free breakfast coverage is intentionally left visible where the founding cookbook does not safely cover it.

## Validation

`validation_manifest.json` reports valid=True with 0 violations.
