/**
 * Hybrid Meal Occasion — Style Tags & slot/energy vocabulary
 * ==========================================================
 * Canonical machine slugs + human display labels for the meal Style Tag system,
 * plus the shared meal-slot and energy-band vocabularies used by the Hybrid Meal
 * Occasion model (primarySlot / suitableSlots / energyBand / styleTags).
 *
 * SCOPE: display + derivation helpers only. These tags are DISPLAY-ONLY metadata —
 * they never affect planner scoring, filtering, or slot eligibility. `Fuss Free` is
 * intentionally NOT a slug: it is merged into `Quick & Easy`.
 */

// ─── Meal slots ──────────────────────────────────────────────────────────────
export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export function isMealSlot(value: string): value is MealSlot {
  return (MEAL_SLOTS as readonly string[]).includes(value);
}

// ─── Energy bands ────────────────────────────────────────────────────────────
// Editorial metadata only — never affects planner eligibility.
export const ENERGY_BANDS = ["light", "medium", "hearty"] as const;
export type EnergyBand = (typeof ENERGY_BANDS)[number];

export function isEnergyBand(value: string): value is EnergyBand {
  return (ENERGY_BANDS as readonly string[]).includes(value);
}

// ─── Style tag canonical slugs ───────────────────────────────────────────────
export const STYLE_TAG_SLUGS = [
  "shared-meal",
  "adaptable",
  "family-pleaser",
  "quick",
  "comfort",
  "fresh",
  "indulgent",
  "buffet",
  "bar",
  "one-pot",
] as const;
export type StyleTagSlug = (typeof STYLE_TAG_SLUGS)[number];

export function isStyleTagSlug(value: string): value is StyleTagSlug {
  return (STYLE_TAG_SLUGS as readonly string[]).includes(value);
}

/**
 * Canonical slug → human display label.
 * ALL UI must render the display label, never the raw slug.
 */
export const STYLE_TAG_DISPLAY_MAP: Record<StyleTagSlug, string> = {
  "shared-meal": "Family Table",
  adaptable: "Adaptable",
  "family-pleaser": "Family Pleaser",
  quick: "Quick & Easy",
  comfort: "Comfort",
  fresh: "Fresh",
  indulgent: "Indulgent",
  buffet: "Buffet",
  bar: "Bar",
  "one-pot": "One Pot",
};

/** Returns the human display label for a slug, falling back to the raw value if unknown. */
export function getStyleTagDisplayLabel(slug: string): string {
  return isStyleTagSlug(slug) ? STYLE_TAG_DISPLAY_MAP[slug] : slug;
}

// ─── Category → slot mapping (inverse of planner SLOT_CATEGORY_MAPPING) ───────
// Derived strictly from server SLOT_CATEGORY_MAPPING so suitableSlots backfill
// reproduces existing planner eligibility exactly. Keep in sync if that mapping
// ever changes. Used by the additive migration backfill and by tests.
export const CATEGORY_SLOT_MAPPING: Record<string, MealSlot[]> = {
  breakfast: ["breakfast"],
  smoothie: ["breakfast", "snack"],
  lunch: ["lunch"],
  snack: ["lunch", "snack"],
  salad: ["lunch"],
  dinner: ["dinner"],
  main: ["dinner"],
  dessert: ["snack"],
  drink: ["snack"],
};

/** Derives suitableSlots for a category using the inverse mapping. Unknown → []. */
export function deriveSuitableSlots(category: string | null | undefined): MealSlot[] {
  if (!category) return [];
  return CATEGORY_SLOT_MAPPING[category.toLowerCase()] ?? [];
}

// ─── System-derived style tags ───────────────────────────────────────────────
// Deterministic, confidence-high derivations ONLY. Never AI-generated. Only the
// three system-derivable slugs are ever returned here; all other slugs are
// curated/editorial and must be supplied by humans.
export interface DerivableTemplateShape {
  proteinSlots?: string[] | null;
  carbSlots?: string[] | null;
  vegSlots?: string[] | null;
  sauceSlots?: string[] | null;
  toppingSlots?: string[] | null;
  compatibleDiets?: string[] | null;
  estimatedTotalTime?: number | null;
}

/**
 * Returns the subset of system-derivable style tag slugs that apply to a template.
 * - `shared-meal`: any protein/carb/veg/sauce/topping slot is present.
 * - `adaptable`: compatibleDiets has at least 2 entries.
 * - `quick`: estimatedTotalTime is known and under 20 minutes.
 * Pure function — does not write anything. Curated tags are never produced here.
 */
export function deriveSystemStyleTags(template: DerivableTemplateShape): StyleTagSlug[] {
  const tags: StyleTagSlug[] = [];

  const hasComponentSlots =
    (template.proteinSlots?.length ?? 0) > 0 ||
    (template.carbSlots?.length ?? 0) > 0 ||
    (template.vegSlots?.length ?? 0) > 0 ||
    (template.sauceSlots?.length ?? 0) > 0 ||
    (template.toppingSlots?.length ?? 0) > 0;
  if (hasComponentSlots) tags.push("shared-meal");

  if ((template.compatibleDiets?.length ?? 0) >= 2) tags.push("adaptable");

  if (template.estimatedTotalTime != null && template.estimatedTotalTime < 20) {
    tags.push("quick");
  }

  return tags;
}
