# Ingredient Imagery Infrastructure — Implementation

**Date:** 2026-06-10
**Status:** Complete — implemented and verified
**Rollback tag:** `rollback/ingredient-imagery-infrastructure-20260610`

---

## Objective

Create shared infrastructure for future ingredient imagery in THA. The infrastructure must be ready to accept images without requiring any code changes when images are added. No images are downloaded, no UI is changed, no schema changes are made.

---

## Files Created

| File | Purpose |
|---|---|
| `client/src/lib/ingredient-imagery.ts` | Ingredient image lookup module with full public API |
| `public/images/ingredients/.gitkeep` | Placeholder to commit the empty ingredients folder |
| `public/images/categories/.gitkeep` | Placeholder to commit the empty categories folder |

No other files were created or modified.

---

## Architecture

### Normalisation

All lookups are normalised through `normaliseForReuse` from `client/src/lib/ingredient-reuse.ts` — the same two-pass pipeline (`stripForMatch` + `resolveIngredientAlias`) used by the Nutrition Benefit Library and the Plant Diversity Explorer. This ensures canonical key consistency across all subsystems:

```
"fresh basil"            → "basil"
"baby spinach"           → "spinach"
"extra virgin olive oil" → "olive oil"
"pumpkin seeds"          → "pumpkin seeds"
"400g tinned chickpeas"  → "chickpeas"
```

No duplicate normalisation system was created.

---

### `IngredientImage` interface

```typescript
export interface IngredientImage {
  src: string;
  alt: string;
  credit?: string;
  source?: string;
}
```

The `source` field indicates provenance:
- `"pexels"` — Pexels self-hosted WebP (preferred future source)
- `"category"` — category cover image
- `"emoji-fallback"` — no image available, emoji-only response

Callers can use `source === "emoji-fallback"` to render an emoji `<span>` instead of a broken `<img>`.

---

### `IMAGE_MAP` — ingredient image map

```typescript
const IMAGE_MAP = new Map<string, IngredientImage>([
  // Populated as images are sourced
  // Key: canonical ingredient key (output of normaliseForReuse)
  // Value: IngredientImage
  //
  // Examples (commented):
  // ["spinach",       { src: "/images/ingredients/spinach.webp",       alt: "Spinach",       source: "pexels" }],
  // ["pumpkin seeds", { src: "/images/ingredients/pumpkin-seeds.webp", alt: "Pumpkin Seeds", source: "pexels" }],
  // ["olive oil",     { src: "/images/ingredients/olive-oil.webp",     alt: "Olive Oil",     source: "pexels" }],
]);
```

**Currently empty.** Add entries here as images are sourced. The file key matches the WebP filename convention in `public/images/ingredients/`.

---

### `CATEGORY_IMAGE_MAP` — category cover image map

```typescript
const CATEGORY_IMAGE_MAP = new Map<string, IngredientImage>([
  // Populated when category cover images are placed in public/images/categories/
  //
  // Examples (commented):
  // ["Vegetables",     { src: "/images/categories/vegetables.webp",     alt: "Vegetables"     }],
  // ["Legumes",        { src: "/images/categories/legumes.webp",        alt: "Legumes"        }],
  // ["Fermented Foods",{ src: "/images/categories/fermented-foods.webp",alt: "Fermented Foods"}],
]);
```

**Currently empty.** Used as tier 2 fallback for ingredient images that have no direct match.

---

### `CATEGORY_EMOJI_MAP` — emoji fallback tier

Covers all 9 `PlantCategory` values plus 3 extended categories:

| Category | Emoji |
|---|---|
| Vegetables | 🥦 |
| Fruits | 🍎 |
| Whole Grains | 🌾 |
| Herbs & Spices | 🌿 |
| Olive Oil | 🫒 |
| Legumes | 🫘 |
| Seeds | 🌻 |
| Nuts | 🥜 |
| Fermented Foods | 🫙 |
| Leafy Greens | 🥬 |
| Mushrooms | 🍄 |
| Healthy Fats | 🥑 |
| (unknown / none) | 🌱 |

---

### Exported functions

#### `getCategoryEmoji(category?: string): string`

Returns the emoji for a plant category. Falls back to `🌱` for unknown or undefined categories.

```typescript
getCategoryEmoji("Seeds")          // → "🌻"
getCategoryEmoji("Fermented Foods")// → "🫙"
getCategoryEmoji("Unknown")        // → "🌱"
getCategoryEmoji()                 // → "🌱"
```

#### `getIngredientImage(ingredient: string): IngredientImage | null`

Normalises the ingredient and looks it up in `IMAGE_MAP`. Returns `null` if not found (currently always returns `null` — maps are empty).

```typescript
getIngredientImage("baby spinach")  // → null (map empty)
getIngredientImage("")              // → null (empty input guard)
```

#### `getIngredientImageWithFallback(ingredient: string, category?: string): IngredientImage`

Never returns `null`. Three-tier fallback cascade:

1. **Tier 1** — `IMAGE_MAP` lookup via normalised key
2. **Tier 2** — `CATEGORY_IMAGE_MAP` lookup via category string
3. **Tier 3** — Emoji fallback: `{ src: "", alt: "<emoji> <category>", source: "emoji-fallback" }`

```typescript
// Current state (both maps empty):
getIngredientImageWithFallback("spinach", "Vegetables")
// → { src: "", alt: "🥦 Vegetables", source: "emoji-fallback" }

getIngredientImageWithFallback("unknown item", "Legumes")
// → { src: "", alt: "🫘 Legumes", source: "emoji-fallback" }

getIngredientImageWithFallback("unknown item")
// → { src: "", alt: "🌱", source: "emoji-fallback" }

// Future state (after spinach.webp added to IMAGE_MAP):
getIngredientImageWithFallback("baby spinach", "Vegetables")
// → { src: "/images/ingredients/spinach.webp", alt: "Spinach", source: "pexels" }
```

---

## Folder Structure

```
public/
  images/
    ingredients/     ← future: spinach.webp, kale.webp, chickpeas.webp, etc.
      .gitkeep
    categories/      ← future: vegetables.webp, legumes.webp, etc.
      .gitkeep
```

**File naming convention (for when images are added):**
- Use the canonical ingredient key from `normaliseForReuse` with spaces replaced by hyphens
- All lowercase, `.webp` extension
- Examples: `pumpkin-seeds.webp`, `olive-oil.webp`, `extra-virgin-olive-oil.webp` → `olive-oil.webp`

---

## Future Image Source Rules

**Preferred:** Pexels self-hosted WebP  
**Reason:** commercial use allowed, no attribution required in UI, self-hosting permitted under Pexels license  

**Avoid:**
- Runtime image search APIs (Unsplash API, Pexels API) — latency and rate limits
- Hotlinked external image URLs — CDN dependency, potential 403s over time
- Wikimedia Commons — attribution tracking required per image; legally risky at scale
- Open Food Facts — variable licensing per product; no safe blanket use

---

## Trust Check Results

### `getIngredientImage("spinach")` when map is empty

Returns `null`. ✓

### `getIngredientImageWithFallback("spinach", "Vegetables")`

Tier 1: no match. Tier 2: no match. Tier 3: `{ src: "", alt: "🥦 Vegetables", source: "emoji-fallback" }`. ✓

### `getCategoryEmoji("Seeds")`

Returns `"🌻"`. ✓

### `getCategoryEmoji("Unknown")`

Returns `"🌱"` (generic plant fallback). ✓

### `getCategoryEmoji(undefined)`

Returns `"🌱"` (early return on falsy). ✓

### TypeScript

`npx tsc --noEmit` — zero new errors. All 8 pre-existing server-side errors unchanged.

---

## Manual Tests / Dev Checks

### Test 1 — getIngredientImage with empty map

```typescript
import { getIngredientImage } from "@/lib/ingredient-imagery";
console.log(getIngredientImage("spinach")); // → null
console.log(getIngredientImage("baby spinach")); // → null (normalises to "spinach", still null)
console.log(getIngredientImage("")); // → null (empty input guard)
```

### Test 2 — getIngredientImageWithFallback with category

```typescript
import { getIngredientImageWithFallback } from "@/lib/ingredient-imagery";
const r = getIngredientImageWithFallback("spinach", "Vegetables");
// r.source === "emoji-fallback"
// r.alt === "🥦 Vegetables"
// r.src === ""
```

### Test 3 — getCategoryEmoji

```typescript
import { getCategoryEmoji } from "@/lib/ingredient-imagery";
getCategoryEmoji("Seeds");          // "🌻"
getCategoryEmoji("Fermented Foods");// "🫙"
getCategoryEmoji("Healthy Fats");   // "🥑"
getCategoryEmoji("Mushrooms");      // "🍄"
getCategoryEmoji();                 // "🌱"
getCategoryEmoji("Unknown");        // "🌱"
```

### Test 4 — no UI changed

The file is a standalone library module. It does not import any UI components. It is not imported by any existing component. Zero UI changes.

### Test 5 — no images in repo

```bash
ls public/images/ingredients/  # → .gitkeep only
ls public/images/categories/   # → .gitkeep only
```

---

## Definition of Done

- [x] `client/src/lib/ingredient-imagery.ts` exists
- [x] `public/images/ingredients/.gitkeep` exists
- [x] `public/images/categories/.gitkeep` exists
- [x] `getIngredientImage` exported
- [x] `getIngredientImageWithFallback` exported
- [x] `getCategoryEmoji` exported
- [x] `IngredientImage` interface exported
- [x] Existing `normaliseForReuse` reused — no duplicate normalisation
- [x] Canonical key examples all correct (fresh basil → basil, baby spinach → spinach, etc.)
- [x] Category/emoji fallback works for all 9 PlantCategory values + 3 extended categories
- [x] No UI changes
- [x] No image downloads
- [x] No schema changes
- [x] No API changes
- [x] TypeScript passes with zero new errors

---

## What Was NOT Implemented (Scope Lock)

- Actual image files — `IMAGE_MAP` is empty; `.gitkeep` files hold the folders
- Plant Diversity Explorer imagery integration
- Nutrition Benefit Library UI imagery
- Shopping list imagery
- Cookbook/recipe imagery
- External image API integration
- Attribution UI

---

## Suggestions (Not Implemented)

**Populate IMAGE_MAP** — Batch-source ~20 high-value ingredient images from Pexels (spinach, kale, avocado, chickpeas, lentils, pumpkin seeds, chia seeds, walnuts, almonds, blueberries, oats, brown rice, basil, coriander, olive oil, sauerkraut, kimchi). These 17 cover every ingredient in the Plant Diversity Explorer suggestion list. Estimated scope: 1–2 hours of sourcing + resize to 400×400 WebP.

**Populate CATEGORY_IMAGE_MAP** — 9–12 category cover images for use in category-level UI (e.g. future category browsing, Explorer category headers).

**Plant Diversity Explorer integration** — Uncomment the image placeholder in `PlantTableRow` and wire `getIngredientImageWithFallback(row.canonicalKey, row.category)` to show the emoji chip or ingredient image. The extension point is already in the component.

**Nutrition Benefit Library integration** — Add a small ingredient image or emoji to each entry in the Nutrition Benefit Library display.

**Image preloading** — When the Explorer opens, preload images for the top-N plants in the current week using `<link rel="preload">` or `new Image()`.
