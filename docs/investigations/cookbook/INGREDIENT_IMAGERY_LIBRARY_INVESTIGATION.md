# Ingredient Imagery Library — Feasibility Investigation

**Date:** 2026-06-10
**Status:** Investigation complete — no implementation
**Rollback tag:** `rollback/ingredient-imagery-library-investigation-20260610`

---

## 1. Existing Ingredient Architecture

THA has a mature, multi-layer ingredient normalisation pipeline that is well-suited to anchor an imagery system.

### Normalisation Pipeline

```
Raw string (e.g. "2 tbsp Extra Virgin Olive Oil")
    ↓
normalizeIngredientKey()          [shared/normalize.ts]
  - lowercase
  - NFD decompose + strip diacritics
  - trim, strip punctuation, collapse spaces
    ↓
resolveIngredientAlias()          [shared/ingredient-aliases.ts]
  - maps 111 variants → 54 canonical UK-English keys
  - examples: "garlic cloves" → "garlic", "baby spinach" → "spinach"
    ↓
normaliseForReuse()               [client/src/lib/ingredient-reuse.ts]
  - strips quantities, units, 27 prep words before alias resolution
  - used for reuse matching and benefit library lookup
```

### Key Files

| File | Role |
|---|---|
| `shared/normalize.ts` | `normalizeIngredientKey` — core string normalisation |
| `shared/ingredient-aliases.ts` | 111 variant → 54 canonical mappings |
| `shared/ingredient-taxonomy.ts` | ~50 canonical keys with category labels (produce, fruit, dairy…) |
| `shared/food-synonyms.ts` | US/UK synonym expansion, ~80 SYNONYM_MAP entries, ~230-item `FOOD_TERM_DICTIONARY` |
| `client/src/lib/ingredient-reuse.ts` | `normaliseForReuse` — two-pass pipeline |
| `client/src/lib/nutrition-variety.ts` | Word lists: FRUITS, VEGETABLES, WHOLE_GRAINS, HERBS_SPICES, LEGUMES_PULSES, SEEDS_LIST, NUTS_LIST, FERMENTED_FOODS |
| `client/src/lib/pantry-knowledge.ts` | 35 canonical keys with educational content |
| `client/src/lib/nutrition-benefit-library.ts` | 24 canonical keys with nutrient data |
| `client/src/lib/nutrition-boosts.ts` | 23 boost items currently surfaced to users |
| `server/lib/uplift-rules.ts` | ~49 boost ingredient strings in active uplift rules |

### Can Images Attach to Canonical Ingredients?

**Yes.** The canonical key is a stable, normalised string (lowercase, no punctuation, single spaces). It is already used as the lookup key in:
- `PANTRY_KNOWLEDGE` (pantry-knowledge.ts)
- `BENEFIT_MAP` (nutrition-benefit-library.ts)
- `INGREDIENT_TAXONOMY` (ingredient-taxonomy.ts)

An image library would follow the same pattern:

```typescript
const IMAGE_MAP = new Map<string, IngredientImage>([
  ["chickpeas", { src: "/images/ingredients/chickpeas.jpg", alt: "Chickpeas" }],
  ["spinach",   { src: "/images/ingredients/spinach.jpg",  alt: "Spinach"   }],
  // ...
]);

export function getIngredientImage(ingredient: string): IngredientImage | null {
  return IMAGE_MAP.get(normaliseForReuse(ingredient)) ?? null;
}
```

The `normaliseForReuse` pipeline means "fresh baby spinach", "frozen spinach", and "spinach" all resolve to the same key and the same image.

---

## 2. Coverage Analysis

### Total Known Ingredient Keys

| Source | Distinct string keys |
|---|---|
| `ingredient-aliases.ts` canonical targets | 54 |
| `ingredient-aliases.ts` variant sources | 111 |
| `ingredient-taxonomy.ts` | ~50 |
| `nutrition-variety.ts` word lists | ~150 |
| `pantry-knowledge.ts` entries | 35 |
| `nutrition-benefit-library.ts` | 24 |
| `food-synonyms.ts` FOOD_TERM_DICTIONARY + SYNONYM_MAP | ~280 |
| **Cross-system union (de-duplicated)** | **~565** |

After de-duplication for visual purposes (collapsing plural/singular, US/UK variants, prep-word forms that resolve to one image), the **true visual canonical count** is approximately **200–250 distinct ingredient images**.

### Priority Tiers

**Tier 1 — Currently surfaced to users (highest ROI):**
- 24 `BOOST_LIBRARY` / Nutrition Benefit Library ingredients
- ~49 Uplift Rules ingredients (some compound phrases, ~35 imageable singles)
- **Total Tier 1: ~50 canonical images**

These are ingredients THA actively shows users in the enhancement panels right now. Any imagery work should start here.

Tier 1 list (canonical keys):
> almonds, apple cider vinegar, avocado, baked beans, basil, black beans, black pepper, broccoli, brown rice, cannellini beans, chia seeds, chickpeas, chestnut mushrooms, coriander, dark chocolate, edamame, extra virgin olive oil, flax seeds, frozen peas, kale, kimchi, kale, lentils, lemon juice, mint, mixed beans, mixed mushrooms, mixed seeds, natural yogurt, nut butter, overnight oats, parsley, pumpkin seeds, red lentils, rocket, sauerkraut, sesame seeds, spinach, tahini, turmeric, walnuts, wholemeal bread, wholemeal pasta

**Tier 2 — Pantry knowledge + plant variety (broader educational use):**
- All `PANTRY_KNOWLEDGE` keys not in Tier 1
- Full VEGETABLES, FRUITS, HERBS_SPICES word lists
- **Total Tier 2: ~100–150 additional images**

Adds: tomatoes, garlic, sweet potato, oats, quinoa, salmon, sardines, mackerel, eggs, kefir, greek yogurt, blueberries, olive oil, onion, carrot, courgette, pepper, mushroom, broccoli, spinach, etc.

**Tier 3 — Full catalogue (Shopping, Cookbook, comprehensive Planner coverage):**
- Full `FOOD_TERM_DICTIONARY` (~230 entries)
- Remaining SYNONYM_MAP canonicals
- **Total Tier 3: ~200–250 additional images**

Adds: all common UK grocery ingredients — cheese varieties, meat cuts, pasta types, herbs, spices, international ingredients, dairy items.

### Feasibility Summary

| Library size | Distinct images | Verdict |
|---|---|---|
| **100** | ~100 | Comfortable — covers all Tier 1 + common Tier 2 |
| **300** | ~300 | Achievable — covers all Tiers 1 and 2 plus most Tier 3 |
| **1000** | ~1000 | Realistic but requires sustained curation; most of the long tail has low display frequency |

A **100-image library covers all currently active enhancement features** and would deliver immediately visible value. A **300-image library would cover the full expected product surface** (Planner, Cookbook, Shopping, Plant Diversity Explorer) without needing to reach into the long tail.

**1000 images is achievable long-term** but the marginal value per image declines sharply after ~300. Most ingredients beyond that threshold (e.g. specific pasta shapes, regional condiments) would rarely display.

---

## 3. Royalty-Free Image Source Review

### Wikimedia Commons

**Licensing:**
- CC BY-SA (Creative Commons Attribution-ShareAlike) — most common
- CC BY (Attribution only) — some entries
- Public Domain — older botanical illustrations

**Attribution requirements:**
- Required for CC BY and CC BY-SA. Author name, source URL, licence name must be displayed.
- Attribution can be minimal UI element (e.g. small "Source: Wikimedia Commons" link).

**Commercial use suitability:** Yes, under CC BY-SA with attribution. Suitable for an app with commercial intent, provided attribution is shown.

**Quality:** Highly variable. For common ingredients (spinach, tomatoes, garlic) quality is good and multiple angles available. For more obscure items (specific bean varieties, regional produce) quality drops.

**Coverage:** Exceptional. Almost every common food ingredient has a category image. Coverage for the full 300-item library is near-100%.

**Implementation complexity:** Medium. Images must be downloaded and hosted locally to comply with licence (cannot hotlink). Attribution metadata must be tracked.

**Verdict:** Technically appropriate but highest maintenance burden. Attribution tracking, licence compliance, and variable image quality require ongoing human review.

---

### Unsplash

**Licensing:**
- Unsplash License — free to use for commercial purposes, no attribution required.
- Images may NOT be compiled into a competing stock photography product.

**Attribution requirements:** None required, though crediting is appreciated.

**Commercial use suitability:** Yes, fully commercial. No attribution required.

**Quality:** Consistently high. All images are curated by Unsplash. Food photography quality is excellent.

**Coverage:** Strong for common ingredients (spinach, avocado, chickpeas, lemon, salmon) and Tier 1/Tier 2 items. Weaker for very specific items (specific bean varieties, niche spices).

**Implementation complexity:** Low. Unsplash API provides direct image URLs. No attribution required. However, TFA's terms prohibit "bulk downloading" for offline storage — images must be served via Unsplash CDN or requested per-use via API.

**Rate limits:** Free tier: 50 requests/hour. Production API key: 5000/hour.

**Key constraint:** Images must be served from Unsplash CDN, not self-hosted. This creates external dependency. Images may change or disappear.

**Verdict:** Best quality/simplicity ratio for MVP. The no-attribution requirement removes UI complexity. External CDN dependency is the primary risk. Not suitable as the sole long-term source.

---

### Pexels

**Licensing:**
- Pexels License — free for commercial use, no attribution required.
- Cannot sell the images themselves.

**Attribution requirements:** None required, optional credit appreciated.

**Commercial use suitability:** Yes, fully commercial.

**Quality:** High, slightly below Unsplash average. More varied photography styles.

**Coverage:** Similar to Unsplash — excellent for Tier 1 and common Tier 2, weaker for niche items.

**Implementation complexity:** Similar to Unsplash — API available, can self-host downloads.

**Key advantage over Unsplash:** Pexels explicitly permits downloading and self-hosting. This resolves the CDN dependency risk.

**Verdict:** Good alternative or complement to Unsplash, especially for items where self-hosting is preferred. Attribution not required.

---

### Open Food Facts

**Licensing:** CC BY-SA — same as Wikimedia Commons, attribution required.

**Attribution requirements:** Yes — author and source must be credited.

**Commercial use suitability:** Yes with attribution.

**Quality:** Mixed. Images are crowd-sourced product photos — packaging shots, not canonical ingredient photography.

**Coverage:** Extensive for branded products (tinned chickpeas, specific pasta brands). Very weak for generic canonical ingredients (raw spinach, a handful of walnuts).

**Verdict:** Not suitable as a primary source for canonical ingredient imagery. Product images conflict with THA's "Canonical Ingredient Image" approach. Could supplement for very specific processed items (tinned tomatoes, baked beans) where a product-adjacent image is acceptable.

---

### Source Comparison Matrix

| Source | Commercial use | Attribution | Self-host | Image quality | Coverage (300 items) | Recommended |
|---|---|---|---|---|---|---|
| **Unsplash** | Yes | Not required | Limited | Excellent | ~85% | MVP source |
| **Pexels** | Yes | Not required | Yes | Very good | ~80% | Primary self-hosting source |
| **Wikimedia Commons** | Yes | Required | Yes | Variable | ~95% | Attribution-only gap-filling |
| **Open Food Facts** | Yes | Required | Yes | Mixed | ~30% | Not recommended |

---

## 4. Storage Strategy

### Option A — Store Locally in THA

Images downloaded from Pexels/Wikimedia, self-hosted in `public/images/ingredients/` or served via a CDN bucket.

**Pros:**
- Zero external dependency at runtime
- Full control over naming, dimensions, compression
- No rate limits
- Works offline/in dev environments
- No broken images from upstream changes

**Cons:**
- Upfront download and curation effort per image
- Storage cost (WebP at ~20–40KB/image: 300 images ≈ ~8–12MB)
- Must track attribution for Wikimedia-sourced images
- Manual updates when better images become available

**Storage estimate:** 300 images at 40KB average = 12MB. Acceptable for a product bundle. Could move to CDN (R2/S3) if needed.

**Verdict:** Best long-term option. Reliable, controllable, no runtime dependencies.

---

### Option B — Reference External URLs

Images served directly from Unsplash CDN / Pexels CDN, URLs stored in IMAGE_MAP.

**Pros:**
- Zero download effort at setup
- Always current images (Unsplash CDN)
- No storage cost

**Cons:**
- URLs break when images are deleted/moved (Unsplash does this)
- Network dependency: images fail in offline/poor-network scenarios
- Unsplash prohibits self-compilation of their library, so a large URL-only dataset may breach their terms
- Performance unpredictable

**Verdict:** Acceptable for a prototype only. Not suitable for production.

---

### Option C — Hybrid (Recommended)

1. **Tier 1 (~50 images): self-hosted** — Downloaded from Pexels (Pexels licence permits self-hosting), optimised to WebP, committed to repo or uploaded to CDN. These are the images shown in enhancement panels and Plant Diversity Explorer — always available, always fast.

2. **Tier 2 (~100–150 images): self-hosted** — Batch-downloaded and stored. Serves Planner, Cookbook, Shopping features.

3. **Tier 3 (gap-filling): Unsplash CDN URLs** — For the long tail of items without self-hosted images, fall back to Unsplash API request at display time. If the API request fails or the item isn't found, fall through to the category fallback.

**Pros:**
- Core images are always reliable
- Long tail is available without upfront curation
- Storage cost is proportional to actual feature importance

**Cons:**
- Two code paths (local + API)
- Unsplash fallback requires API key management

**Verdict:** Best balance of reliability, coverage, and maintenance. Tier 1 images should always be self-hosted before any feature ships.

---

## 5. Fallback Strategy

A three-level fallback ensures no UI element is ever empty.

```
Level 1: Ingredient image
  getIngredientImage("black beans") → /images/ingredients/black-beans.webp
      ↓ (not found)
Level 2: Category image
  getCategoryImage("legumes") → /images/categories/legumes.webp
      ↓ (not found)
Level 3: Category emoji / Leaf icon
  getCategoryEmoji("legumes") → "🫘"
  or: <Leaf className="..." /> (current THA icon for plant items)
```

### Category Image / Emoji Fallbacks

| Category | Category image | Emoji fallback |
|---|---|---|
| legumes / beans | A bowl of mixed legumes | 🫘 |
| seeds | Mixed seeds scattered | 🌱 |
| nuts | Mixed nuts in a bowl | 🥜 |
| vegetables | Fresh mixed veg | 🥦 |
| fruits | Fruit bowl | 🍎 |
| whole grains | Grains and oats | 🌾 |
| herbs & spices | Fresh herbs bunch | 🌿 |
| fermented | Fermented jar | — (use Leaf icon) |
| healthy fats | Olive oil + avocado | 🫒 |
| leafy greens | Mixed leafy greens | 🥬 |
| fish | Fish fillet | 🐟 |
| dairy | Dairy items | 🥛 |
| eggs | Eggs | 🥚 |
| meat | — | 🥩 |

### Compound Phrase Handling

Some uplift rule ingredients are compound phrases like "frozen peas or mushy peas" or "spinach or rocket". These should:
1. First attempt to resolve the primary ingredient (before "or"): "frozen peas" → `peas` image
2. Fall back to category image
3. Compound phrases are not good image candidates — they should resolve to the first ingredient or be cleaned up in the rules over time

### Special Cases

- **"Grilled Tomatoes"**: Maps to `tomatoes` image (grilled appearance negligible)
- **"Roasted Peppers"**: Maps to `peppers` image
- **"Mixed Beans"**: Maps to `legumes` category image (no single-bean canonical)
- **"Mixed Mushrooms"**: Maps to `mushrooms` category image
- **"Extra Virgin Olive Oil"**: Maps to `olive oil` image

---

## 6. Recommended Architecture

### Core Module: `client/src/lib/ingredient-imagery.ts`

```typescript
import { normaliseForReuse } from "@/lib/ingredient-reuse";

export interface IngredientImage {
  src: string;    // path or URL
  alt: string;    // descriptive alt text
  credit?: string; // attribution if Wikimedia-sourced
}

// Canonical keys → image metadata
// Keys use normaliseForReuse() output format
const IMAGE_MAP = new Map<string, IngredientImage>([
  ["chickpeas",          { src: "/images/ingredients/chickpeas.webp",   alt: "Chickpeas" }],
  ["spinach",            { src: "/images/ingredients/spinach.webp",     alt: "Spinach"   }],
  // ... 100–300 entries
]);

// Category fallbacks
const CATEGORY_FALLBACK: Record<string, IngredientImage> = {
  legumes:     { src: "/images/categories/legumes.webp",     alt: "Legumes" },
  seeds:       { src: "/images/categories/seeds.webp",       alt: "Seeds"   },
  // ...
};

export function getIngredientImage(ingredient: string): IngredientImage | null {
  return IMAGE_MAP.get(normaliseForReuse(ingredient)) ?? null;
}

export function getIngredientImageWithFallback(
  ingredient: string,
  category?: string,
): IngredientImage | null {
  return (
    getIngredientImage(ingredient) ??
    (category ? CATEGORY_FALLBACK[category] ?? null : null)
  );
}
```

### File Naming Convention

All self-hosted images use kebab-case canonical key names:

```
public/images/ingredients/
  chickpeas.webp
  spinach.webp
  pumpkin-seeds.webp
  extra-virgin-olive-oil.webp
  ...

public/images/categories/
  legumes.webp
  seeds.webp
  vegetables.webp
  ...
```

### Image Specification

- **Format:** WebP (smaller than JPEG at equivalent quality, well supported in all target browsers)
- **Dimensions:** 200×200px (square, consistent crop) for ingredient tiles; 400×300px for feature headers
- **Compression:** ~80% WebP quality — target ~20–40KB per image
- **Style:** Clean, neutral-background, single-ingredient focus (no text overlays)
- **Aspect ratio:** 1:1 for standard ingredient chips/tiles

---

## 7. Smallest Implementation Path

### Phase 0 — Groundwork (no UI changes)

1. Create `client/src/lib/ingredient-imagery.ts` with empty IMAGE_MAP and fallback logic
2. Create `public/images/ingredients/` and `public/images/categories/` directories
3. Define `IngredientImage` interface and `getIngredientImage` / `getIngredientImageWithFallback` functions
4. Write fallback emoji map

No images yet — the module returns `null` for everything. This enables other components to import and use the API without images breaking the UI.

### Phase 1 — Tier 1 (50 images, highest ROI)

Source: Pexels (self-hosting permitted, no attribution required)

Target ingredients (canonical keys):
```
chickpeas, lentils, black beans, pumpkin seeds, chia seeds, flax seeds,
walnuts, almonds, basil, coriander, parsley, mint, chestnut mushrooms,
sauerkraut, kimchi, avocado, olive oil, spinach, kale, tomatoes,
peppers, broccoli, red lentils, mixed seeds, sesame seeds, turmeric,
cannellini beans, edamame, dark chocolate, brown rice, oats, rocket,
natural yogurt, tahini, mixed beans, frozen peas, nut butter, ginger,
blueberries, sweet potato, garlic, quinoa, flaxseed, apple cider vinegar,
salmon, sardines, eggs, wholemeal bread
```

Curation approach: One person, one afternoon. Search Pexels for each ingredient name, select best image, download at original resolution, resize to 200×200 WebP.

**Effort estimate:** 4–8 hours. 50 images × ~6 minutes each (search, select, download, resize, name).

### Phase 2 — Tier 2 (150 additional images)

Expand to full Pantry Knowledge and plant variety word lists. Same Pexels-first approach, Wikimedia for gap-filling.

**Effort estimate:** 1–2 days.

### Phase 3 — Tier 3 (full 300-image library)

Remaining common ingredients from FOOD_TERM_DICTIONARY and SYNONYM_MAP. At this scale, a simple batch script (Pexels API search + auto-download) could handle the mechanical part, with human QA pass.

**Effort estimate:** 2–3 days (mostly QA).

---

## 8. Implementation Options

### Option A — Top 100 Ingredients Only

**Complexity:** Low. One file (`ingredient-imagery.ts`), 100 images, one directory.
**Storage impact:** ~3–4MB (100 × 35KB average WebP)
**Maintenance impact:** Low. 100 images is a one-time curation task. Minor additions over time.
**Expected user value:** High. Covers all enhancement panels, Plant Diversity Explorer for common plants, basic Planner and Cookbook support.
**Verdict:** The recommended starting point for any imagery feature launch.

---

### Option B — Top 300 Ingredients

**Complexity:** Low-medium. Same architecture, 3× the images. Batch download script saves time.
**Storage impact:** ~10–12MB (300 × 38KB average WebP)
**Maintenance impact:** Low. Occasional additions as new ingredients are added to uplift rules or boosts.
**Expected user value:** Very high. Full coverage of all THA features including Shopping and Cookbook. Very few gaps for UK household cooking.
**Verdict:** The right target for a full product feature. Achievable in one sprint.

---

### Option C — 1000+ Ingredient Library

**Complexity:** Medium. Tooling (batch API script) required. Attribution tracking for Wikimedia items.
**Storage impact:** ~35–40MB. Should be moved off the repo to a CDN (Cloudflare R2, AWS S3) at this scale.
**Maintenance impact:** Medium. Long tail has occasional breakage (niche items, seasonal produce). Requires periodic QA.
**Expected user value:** Marginal improvement over 300 for most users. The tail covers very specific items (named pasta shapes, regional spice blends, specific cheese varieties) that appear rarely in meal plans.
**Verdict:** Not recommended as the initial target. Build to 300 first; expand if specific product areas (international cuisine mode, specialist dietary features) justify the tail coverage.

---

## 9. Trust Check

### Licensing Suitability

| Source | Licence | Attribution | Commercial | Self-host | Risk |
|---|---|---|---|---|---|
| Pexels | Pexels Licence | Not required | Yes | Yes | Low |
| Unsplash | Unsplash Licence | Not required | Yes | Limited | Medium (CDN only) |
| Wikimedia CC BY-SA | CC BY-SA | Required | Yes | Yes | Low if attribution tracked |
| Open Food Facts | CC BY-SA | Required | Yes | Yes | Low but image quality mismatch |

### Attribution Requirements

If Wikimedia Commons images are used:
- A visible attribution must be displayed in the UI or accessible via a tappable credit
- The attribution metadata (author, source URL, licence) must be stored alongside the image record in IMAGE_MAP
- Recommended: a small "Image: Wikimedia Commons" link on hover/tap in image components

### Long-Term Sustainability

- **Pexels:** Very sustainable. Licence is perpetual for downloaded images. No CDN dependency if self-hosted.
- **Unsplash CDN:** Not sustainable as a sole source. URLs can break. Use only for prototyping or as fallback.
- **Self-hosted WebP:** Most sustainable. Images are owned assets in the repo/CDN.

### Image Ownership Risks

- THA does not own any images in this proposal — all are licensed third-party content
- Perpetual licences (Pexels, Unsplash) mean downloaded images remain usable indefinitely even if the source platforms change their terms
- Attribution-required images (Wikimedia) must have their attribution tracked — losing track creates licence violation risk
- **Recommendation:** For any image sourced from Wikimedia Commons, store the full attribution string in the IMAGE_MAP entry as a `credit` field, regardless of whether it is currently displayed

---

## 10. Future Reuse Assessment

### Plant Diversity Explorer

Highest-value use case. The 30 Plants This Week counter already exists; imagery would make each plant in the weekly count visually distinct and educational.

- **Architecture fit:** `getIngredientImage(raw)` with `normaliseForReuse(raw)` resolves correctly
- **Display context:** Small ingredient chips in a weekly plant grid
- **Image size:** 48×48 or 64×64 thumbnails (can reuse same WebP, `object-fit: cover`)
- **Coverage needed:** All plants in LEGUMES_PULSES + SEEDS_LIST + NUTS_LIST + FERMENTED_FOODS + VEGETABLES + FRUITS + WHOLE_GRAINS + HERBS_SPICES — approximately Tier 1+2

### Nutrition Benefit Library

Already shows ingredient cards in MealUpliftPanel. Image would sit above or alongside the benefit summary.

- **Architecture fit:** Direct. `getNutritionBenefit(ingredient)` returns the benefit; `getIngredientImage(ingredient)` returns the image.
- **Image size:** 60×60 thumbnail in panel card
- **Coverage needed:** 24 ingredients (all in Tier 1 — already the smallest implementation path)

### Planner

Meal detail dialog and slot preview could show ingredient images for boosts and educational content.

- **Architecture fit:** Image lookup by ingredient name, same API
- **Image size:** 48×48 in ingredient lists
- **Coverage needed:** Tier 1 for boost ingredients; Tier 2 for general planner ingredient display

### Shopping

A shopping list with ingredient imagery would significantly improve scannability.

- **Architecture fit:** Shopping list items use normalised ingredient keys — same lookup
- **Image size:** 40×40 in list rows
- **Coverage needed:** Tier 2–3 (shopping covers a much wider ingredient range than enhancements)
- **Important:** Must handle unknown ingredients gracefully — category fallback is essential here

### Cookbook

Recipe cards benefit from ingredient imagery in the "What you'll need" section.

- **Architecture fit:** Meal ingredients are already normalised
- **Image size:** 56×56 in ingredient grid
- **Coverage needed:** Tier 2 for common ingredients; long tail handled by category fallback

### Household Familiarity

When/if implemented, imagery would reinforce which ingredients a household uses frequently.

- **Architecture fit:** Same canonical key infrastructure
- **Coverage needed:** Tier 2

### Single module, no duplication

All six use cases import from the same `getIngredientImage` / `getIngredientImageWithFallback` functions. Images are stored once, used everywhere. There is no need for feature-specific image sets.

---

## 11. Decision Summary

| Question | Answer |
|---|---|
| Can THA support ingredient imagery? | Yes — the canonical key infrastructure already exists |
| Best royalty-free source | Pexels (self-hosting permitted, no attribution, high quality) |
| Smallest implementation path | 50-image Tier 1 library, self-hosted WebP from Pexels |
| 100-image library realistic? | Yes — one afternoon of curation |
| 300-image library realistic? | Yes — achievable in one sprint |
| 1000-image library realistic? | Yes, long-term — but marginal value; not the right first target |
| Should images be self-hosted? | Yes for Tier 1 and 2. Optional CDN fallback for Tier 3 |
| Attribution required? | Not for Pexels. Yes for Wikimedia — track in IMAGE_MAP |

---

## 12. Strict Scope — What Was NOT Done

- No images downloaded
- No image tables created
- No migrations written
- No UI components created or modified
- No schema changes

This document is investigation only.
