Import the THA Original Founding Cookbook 500 Meal Library into dev.

Before changes:
- Read docs/architecture/README.md.
- Confirm git status.
- Create rollback protection.
- Create docs/implementation/cookbook/COOKBOOK3_IMPORT_THA_ORIGINAL_500_MEAL_LIBRARY.md.

Mission:
Import the 500 recipes from tha_original_founding_cookbook_500.json into the dev Cookbook/Meals system.

Scope:
- Dev only.
- No production writes.
- No schema changes.
- No migrations.
- No household adaptations.
- No swaps.
- No planner or leftover logic.
- No generated images.
- No unrelated refactoring.

Important:
- Visible recipe names should NOT be prefixed with "The Healthy Apples".
- Use existing acquisition/provenance fields for THA ownership where supported.
- If the 10 prefixed Batch 001 rows already exist, use legacy_recipe_name/import_key matching to update or replace them safely rather than creating duplicates.

Implementation:
- Reuse the existing system-meal/global Cookbook write path.
- Prefer existing fields: is_system_meal=true, user_id=0, acquisition_lane='tha_library', acquisition_type='authored', mealSourceType='starter' where supported.
- Import all 500 recipes exactly once.
- Import must be idempotent.
- Do not overwrite user-created meals.

Validation:
- Confirm 500 THA Original meals exist in dev.
- Confirm no recipe_name starts with "The Healthy Apples".
- Confirm ingredients and methods are readable.
- Confirm category counts.
- Confirm idempotency after a second run.
- Confirm no production data was touched.

Report:
- rollback identifier
- files changed
- import command
- data rows inserted/updated
- duplicate handling for existing Batch 001
- idempotency result
- rollback command
- manual verification steps
