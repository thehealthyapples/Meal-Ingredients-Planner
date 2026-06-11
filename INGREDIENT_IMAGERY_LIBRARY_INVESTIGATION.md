# Ingredient Imagery Library — Feasibility Investigation

See full report:

`docs/investigations/INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md`

**Date:** 2026-06-10
**Status:** Investigation complete — no implementation
**Rollback tag:** `rollback/ingredient-imagery-library-investigation-20260610`

## Key Findings

**Can THA support ingredient imagery?**
Yes. The canonical key infrastructure already exists. Images attach to `normaliseForReuse()` output, exactly like `PANTRY_KNOWLEDGE` and `BENEFIT_MAP` today.

**Canonical ingredient scale:**
- 565 string keys across all systems
- ~200–250 true visual canonicals after de-duplication
- 50 ingredients currently surfaced to users (highest priority for imagery)

**Recommended source:** Pexels — self-hosting permitted, no attribution required, high quality.

**Smallest path:** 50-image Tier 1 library (Pexels WebP, self-hosted). ~4–8 hours curation.

**100 images:** Covers all active enhancement features. Realistic.
**300 images:** Covers full product surface (Planner, Cookbook, Shopping, Plant Diversity). One sprint.
**1000 images:** Long-term achievable but marginal value beyond 300.

## Implementation Options

| Option | Images | Storage | Effort | Recommended |
|---|---|---|---|---|
| A — Top 100 | ~100 | ~4MB | Half day | Launch target |
| B — Top 300 | ~300 | ~12MB | One sprint | Full feature target |
| C — 1000+ | ~1000 | ~40MB + CDN | Multi-sprint | Long-term only |

## Reuse Potential

Single `getIngredientImage(ingredient)` module shared by:
- Plant Diversity Explorer
- Nutrition Benefit Library
- Planner enhancements
- Shopping
- Cookbook
- Household Familiarity

No duplication. One image store, six consumers.
