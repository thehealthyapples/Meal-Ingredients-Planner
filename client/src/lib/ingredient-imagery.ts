/**
 * ingredient-imagery.ts
 * ======================
 * Shared ingredient image lookup infrastructure for THA.
 *
 * Provides a consistent API for resolving ingredient images with graceful
 * category and emoji fallbacks. Designed to be populated incrementally —
 * callers never crash if an image doesn't exist.
 *
 * USAGE PATTERN
 *   Import getIngredientImage for strict lookups (returns null if unknown).
 *   Import getIngredientImageWithFallback where a UI always needs something
 *   to display — it returns a category or emoji fallback instead of null.
 *
 * NORMALISATION
 *   All lookups normalise through normaliseForReuse (ingredient-reuse.ts),
 *   the same pipeline used by the Nutrition Benefit Library and the
 *   Plant Diversity Explorer. This ensures canonical keys are consistent:
 *     "fresh basil"            → "basil"
 *     "baby spinach"           → "spinach"
 *     "extra virgin olive oil" → "olive oil"
 *     "pumpkin seeds"          → "pumpkin seeds"
 *
 * FUTURE IMAGE SOURCE RULES (not yet implemented)
 *   Preferred source:  Pexels self-hosted WebP
 *   Reason:            commercial use allowed, no attribution required,
 *                      self-hosting permitted under Pexels license
 *   Avoid:             runtime image search APIs, hotlinked external URLs,
 *                      Wikimedia Commons (attribution tracking required),
 *                      Open Food Facts images (variable licensing per item)
 *
 * STORAGE CONVENTION (when images are added)
 *   Ingredient images:  public/images/ingredients/<canonical-key>.webp
 *   Category covers:    public/images/categories/<kebab-category>.webp
 *   Max dimensions:     400×400 px for ingredient, 800×400 px for category cover
 *   Format:             WebP, quality 80, lossless not required
 */

import { normaliseForReuse } from "@/lib/ingredient-reuse";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IngredientImage {
  src: string;
  alt: string;
  credit?: string;
  source?: string;
}

// ─── Ingredient image map ─────────────────────────────────────────────────────
// Keyed by normalised canonical ingredient key (output of normaliseForReuse).
// Add entries here as images are sourced and placed in public/images/ingredients/.
//
// Example entries (commented — no images added yet):
//   ["spinach",       { src: "/images/ingredients/spinach.webp",       alt: "Spinach",       source: "pexels" }],
//   ["kale",          { src: "/images/ingredients/kale.webp",           alt: "Kale",          source: "pexels" }],
//   ["chickpeas",     { src: "/images/ingredients/chickpeas.webp",      alt: "Chickpeas",     source: "pexels" }],
//   ["pumpkin seeds", { src: "/images/ingredients/pumpkin-seeds.webp",  alt: "Pumpkin Seeds", source: "pexels" }],
//   ["olive oil",     { src: "/images/ingredients/olive-oil.webp",      alt: "Olive Oil",     source: "pexels" }],
//   ["avocado",       { src: "/images/ingredients/avocado.webp",        alt: "Avocado",       source: "pexels" }],
//   ["blueberries",   { src: "/images/ingredients/blueberries.webp",    alt: "Blueberries",   source: "pexels" }],
//   ["walnuts",       { src: "/images/ingredients/walnuts.webp",        alt: "Walnuts",       source: "pexels" }],
//   ["sauerkraut",    { src: "/images/ingredients/sauerkraut.webp",     alt: "Sauerkraut",    source: "pexels" }],

const IMAGE_MAP = new Map<string, IngredientImage>([
  // Populated when images are sourced — see comments above
]);

// ─── Category image map ───────────────────────────────────────────────────────
// Keyed by PlantCategory / extended category name (exact string match).
// Populated when category cover images are placed in public/images/categories/.
//
// Example entries (commented — no images added yet):
//   ["Vegetables",     { src: "/images/categories/vegetables.webp",     alt: "Vegetables"     }],
//   ["Fruits",         { src: "/images/categories/fruits.webp",          alt: "Fruits"          }],
//   ["Legumes",        { src: "/images/categories/legumes.webp",         alt: "Legumes"         }],
//   ["Whole Grains",   { src: "/images/categories/whole-grains.webp",    alt: "Whole Grains"    }],
//   ["Seeds",          { src: "/images/categories/seeds.webp",           alt: "Seeds"           }],
//   ["Nuts",           { src: "/images/categories/nuts.webp",            alt: "Nuts"            }],
//   ["Herbs & Spices", { src: "/images/categories/herbs-spices.webp",    alt: "Herbs & Spices"  }],
//   ["Olive Oil",      { src: "/images/categories/olive-oil.webp",       alt: "Olive Oil"       }],
//   ["Fermented Foods",{ src: "/images/categories/fermented-foods.webp", alt: "Fermented Foods" }],
//   ["Leafy Greens",   { src: "/images/categories/leafy-greens.webp",    alt: "Leafy Greens"    }],
//   ["Mushrooms",      { src: "/images/categories/mushrooms.webp",       alt: "Mushrooms"       }],
//   ["Healthy Fats",   { src: "/images/categories/healthy-fats.webp",    alt: "Healthy Fats"    }],

const CATEGORY_IMAGE_MAP = new Map<string, IngredientImage>([
  // Populated when category cover images are sourced — see comments above
]);

// ─── Category emoji map ───────────────────────────────────────────────────────
// Used as the final fallback tier when no ingredient or category image exists.
// Covers PlantCategory values plus additional extended categories.

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  "Vegetables":      "🥦",
  "Fruits":          "🍎",
  "Whole Grains":    "🌾",
  "Herbs & Spices":  "🌿",
  "Olive Oil":       "🫒",
  "Legumes":         "🫘",
  "Seeds":           "🌻",
  "Nuts":            "🥜",
  "Fermented Foods": "🫙",
  "Leafy Greens":    "🥬",
  "Mushrooms":       "🍄",
  "Healthy Fats":    "🥑",
};

const GENERIC_PLANT_EMOJI = "🌱";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the category emoji for a plant category, or a generic plant emoji
 * if the category is unknown or undefined.
 *
 * Examples:
 *   getCategoryEmoji("Seeds")         → "🌻"
 *   getCategoryEmoji("Fermented Foods") → "🫙"
 *   getCategoryEmoji("Unknown")       → "🌱"
 *   getCategoryEmoji()                → "🌱"
 */
export function getCategoryEmoji(category?: string): string {
  if (!category) return GENERIC_PLANT_EMOJI;
  return CATEGORY_EMOJI_MAP[category] ?? GENERIC_PLANT_EMOJI;
}

/**
 * Looks up an ingredient image by name. Returns null if no image exists.
 *
 * The ingredient name is normalised through normaliseForReuse before lookup
 * so display-form variants all resolve to the same canonical key.
 *
 * Returns null when IMAGE_MAP is empty (current state — no images added yet).
 *
 * Examples (once IMAGE_MAP is populated):
 *   getIngredientImage("baby spinach")            → { src: "/images/ingredients/spinach.webp", ... }
 *   getIngredientImage("extra virgin olive oil")  → { src: "/images/ingredients/olive-oil.webp", ... }
 *   getIngredientImage("unknown ingredient")      → null
 */
export function getIngredientImage(ingredient: string): IngredientImage | null {
  if (!ingredient.trim()) return null;
  const key = normaliseForReuse(ingredient);
  return IMAGE_MAP.get(key) ?? null;
}

/**
 * Returns an ingredient image with guaranteed fallback — never returns null.
 *
 * Fallback cascade:
 *   1. Exact ingredient match in IMAGE_MAP (normalised key)
 *   2. Category image from CATEGORY_IMAGE_MAP (exact category string)
 *   3. Emoji fallback object — { src: "", alt: "<emoji> <category>", source: "emoji-fallback" }
 *
 * The source field on the returned object indicates which tier was used:
 *   "ingredient"     — direct IMAGE_MAP match
 *   "category"       — CATEGORY_IMAGE_MAP match
 *   "emoji-fallback" — no image exists, emoji-only fallback
 *
 * Callers can use source === "emoji-fallback" to render an emoji span
 * instead of an <img> element.
 *
 * Examples (current state — maps empty):
 *   getIngredientImageWithFallback("spinach", "Vegetables")
 *     → { src: "", alt: "🥦 Vegetables", source: "emoji-fallback" }
 *   getIngredientImageWithFallback("unknown item", "Legumes")
 *     → { src: "", alt: "🫘 Legumes", source: "emoji-fallback" }
 *   getIngredientImageWithFallback("unknown item")
 *     → { src: "", alt: "🌱", source: "emoji-fallback" }
 */
export function getIngredientImageWithFallback(
  ingredient: string,
  category?: string,
): IngredientImage {
  // Tier 1: exact ingredient match
  const directMatch = getIngredientImage(ingredient);
  if (directMatch) return directMatch;

  // Tier 2: category image
  if (category) {
    const categoryMatch = CATEGORY_IMAGE_MAP.get(category);
    if (categoryMatch) return categoryMatch;
  }

  // Tier 3: emoji fallback
  const emoji = getCategoryEmoji(category);
  const alt = category ? `${emoji} ${category}` : emoji;
  return { src: "", alt, source: "emoji-fallback" };
}
