# Archived Visual Asset Inventory (Non-destructive)

**Date:** 2026-11-13
**Active repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003` (`feat/integrated-dev`)
**Risk:** Green, read-only archive investigation.
**Scope:** candidates reported as unique by `docs\investigations\platform\OLDREPO_COMPARISON_20261111.md`; filename-reference check in the active source tree. No archived asset content was opened or copied.

## Finding

The handoff’s “27 items” is not an exact count supported by the comparison report. The report’s hash comparison identifies 29 image/visual candidates across the decom repositories: 2 icons, 17 ingredient images, 9 PNG/JPEG review screenshots, and 1 additional flax-seed ingredient image stored in a review folder. These hashes were reported absent from the active tree by the comparison report. This count does not include the many non-image unique code and documentation files listed by that report.

The number 27 may reflect an earlier selection, but the evidence available here does not establish which 27 were intended. The source comparison report’s table also says Living Larder has 27 files whose old hash exists elsewhere; that is a separate “old hash also elsewhere” metric, not an asset count.

## Candidates

### Meal-Ingredients-Planner-decom — 19 candidates

**Icons (2):**

- `client\src\assets\icons\tha-apple-sort.png`
- `client\src\assets\icons\The healthy apples recommneds.png`

**Ingredient images (17), under `public\images\ingredients\`:**

- `almonds.webp`
- `avocado.webp`
- `basil.webp`
- `blueberries.webp`
- `brown-rice.webp`
- `chia-seeds.webp`
- `chickpeas.webp`
- `coriander.webp`
- `kale.webp`
- `kimchi.webp`
- `lentils.webp`
- `oats.webp`
- `olive-oil.webp`
- `pumpkin-seeds.webp`
- `sauerkraut.webp`
- `spinach.webp`
- `walnuts.webp`

### tha-living-larder-authoritative-decom — 10 candidates

**Review screenshots (9), under `ops-console\public\repository-review\`:**

- `tha-cookbook-page-fidelity-claude\recipe-revision-02.png`
- `tha-cookbook-real-book-functional\collection.png`
- `tha-cookbook-real-book-functional\recipe.png`
- `tha-cookbook-real-book-functional\trusted-preview.png`
- `tha-cookbook-real-book-visual\review-sheet.png`
- `tha-larder-concept-lab\contact-sheet.png`
- `tha-larder-room-remediation\batch-01-orchard-workroom.png`
- `tha-living-larder-authoritative\home.png`
- `tha-living-larder-v2\candidate-01-vs-north-star.jpg`

**Ingredient image (1):** `tha-larder-fruit-nut-assets\flax-seeds.webp` (also under `ops-console\public\repository-review\`).

## Active-tree reference check

**Verified:** `client\src\lib\ingredient-imagery.ts` contains an empty image map. Its ingredient image examples are commented out; they do not load these archived files. Active source currently contains different Living Home images named `chickpeas.png` and `olive-oil.png`, which are not byte/hash evidence that the archived `.webp` candidates are duplicates. The names `avocado`, `blueberries`, `chickpeas`, `kale`, `olive-oil`, `pumpkin-seeds`, `sauerkraut`, `spinach`, and `walnuts` occur in comments/examples in that module, not active asset bindings.

The Living Larder candidates are under its `ops-console` review-material path. The comparison report states that its unique candidates have no same-name or same-hash active match. This report makes no claim that the images are approved for production use, correctly licensed, or desirable to adopt.

## Actions and limits

- Read the comparison report and checked active filename references and current active asset paths.
- Did not open/view image content, extract/copy assets, edit any decom folder, or delete anything.
- The comparison report establishes hash uniqueness against the active tree when generated; this inventory did not recompute all 29 hashes after consolidation.
- No asset-selection decision was made. Keep all decom folders intact pending an explicit selection and destination decision.

## Next decision

If the owner wants to reuse assets, select exact candidates and identify their active product/asset owner and destination before any extraction. `flax-seeds.webp` and the nine review screenshots should not be treated as a uniform production asset set.
