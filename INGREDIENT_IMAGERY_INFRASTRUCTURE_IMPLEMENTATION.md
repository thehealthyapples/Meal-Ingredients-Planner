# Ingredient Imagery Infrastructure — Implementation

See full report:

`docs/investigations/INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md`

**Date:** 2026-06-10
**Status:** Complete — implemented and verified
**Rollback tag:** `rollback/ingredient-imagery-infrastructure-20260610`

## Summary

Created the shared ingredient image lookup infrastructure for THA. Provides a consistent API for resolving ingredient images with graceful category and emoji fallbacks. No images downloaded, no UI changes, no schema changes.

## Files Created

| File | Change |
|---|---|
| `client/src/lib/ingredient-imagery.ts` | New — lookup module with full public API |
| `public/images/ingredients/.gitkeep` | New — empty folder for future ingredient images |
| `public/images/categories/.gitkeep` | New — empty folder for future category cover images |

## Exported API

| Function | Returns |
|---|---|
| `getIngredientImage(ingredient)` | `IngredientImage \| null` |
| `getIngredientImageWithFallback(ingredient, category?)` | `IngredientImage` (never null) |
| `getCategoryEmoji(category?)` | `string` (emoji) |

## Key Design Decisions

- **Reuses `normaliseForReuse`** — consistent canonical keys across imagery, nutrition benefits, and plant diversity
- **Tier 3 fallback cascade**: ingredient image → category image → emoji fallback object
- **`source` field on fallback**: callers can check `source === "emoji-fallback"` to render emoji span instead of `<img>`
- **Empty maps**: IMAGE_MAP and CATEGORY_IMAGE_MAP are empty — all lookups return emoji fallbacks until images are added
