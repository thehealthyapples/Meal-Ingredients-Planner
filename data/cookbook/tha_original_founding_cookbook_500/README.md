# THA Original Founding Cookbook — 500 Meal Library

This package contains 500 original THA-authored recipe records for import into The Healthy Apples.

## Naming

Visible recipe names do **not** start with "The Healthy Apples". Ownership should be represented by provenance fields or a UI badge.

## Main files

- `tha_original_founding_cookbook_500.json` — primary import file.
- `tha_original_founding_cookbook_500.csv` — spreadsheet-friendly review file.
- `tha_original_founding_cookbook_500.md` — human-readable cookbook.
- `batches/` — 10 batches of 50 recipes in JSON and Markdown.
- `claude_import_prompt.md` — short Claude prompt for importing safely.
- `validation_report.json` — consistency checks.

## Counts

{
  "breakfast": 75,
  "lunch": 110,
  "dinner": 270,
  "side": 25,
  "snack": 20
}

## Batch 001 note

If dev already contains the 10 prefixed Batch 001 meals, do not duplicate them. The first 10 records include `legacy_recipe_name` so Claude can match and update/replace those existing rows safely.

## Scope

Recipe content only. No household adaptations, swaps, leftover instructions or planner decisions are embedded.
