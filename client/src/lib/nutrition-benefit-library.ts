/**
 * nutrition-benefit-library.ts
 * ============================
 * Reusable Nutrition Benefit Library for the THA enhancement system.
 *
 * Provides concise educational context for boost ingredients:
 *   - key nutrients (2–3 per ingredient)
 *   - one-sentence benefit summary
 *   - category
 *
 * Design principles:
 *   - No medical claims. Nutrient content only.
 *   - One-sentence summaries. Educational snippets, not nutrition reports.
 *   - Reusable: designed for Planner, Cookbook, Analyser, Smart Planner.
 *   - Lookup is normalisation-aware — uses the same two-pass pipeline as
 *     ingredient-reuse.ts so "fresh pumpkin seeds" and "Pumpkin Seeds" match.
 *
 * Future reuse:
 *   Import getNutritionBenefit(ingredient) from this module.
 *   Returns NutritionBenefit | null — always handle the null case.
 */

import { normaliseForReuse } from "@/lib/ingredient-reuse";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NutritionBenefit {
  name: string;
  category: string;
  keyNutrients: string[];
  summary: string;
}

// ─── Library ──────────────────────────────────────────────────────────────────

const LIBRARY: NutritionBenefit[] = [
  // Seeds
  {
    name: "Pumpkin Seeds",
    category: "Seeds",
    keyNutrients: ["Magnesium", "Zinc", "Plant Protein"],
    summary: "Rich in magnesium and zinc. Supports plant diversity.",
  },
  {
    name: "Chia Seeds",
    category: "Seeds",
    keyNutrients: ["Omega-3", "Fibre", "Calcium"],
    summary: "A source of omega-3 and fibre. Easy to stir into almost anything.",
  },
  {
    name: "Flax Seeds",
    category: "Seeds",
    keyNutrients: ["Omega-3", "Lignans", "Fibre"],
    summary: "A good plant-based source of omega-3. Adds to weekly plant diversity.",
  },

  // Nuts
  {
    name: "Walnuts",
    category: "Nuts",
    keyNutrients: ["Omega-3", "Vitamin E", "Plant Protein"],
    summary: "One of the richest plant sources of omega-3 fatty acids.",
  },
  {
    name: "Almonds",
    category: "Nuts",
    keyNutrients: ["Vitamin E", "Magnesium", "Calcium"],
    summary: "A good source of vitamin E and magnesium. Adds nutritional variety.",
  },

  // Legumes
  {
    name: "Chickpeas",
    category: "Legumes",
    keyNutrients: ["Plant Protein", "Fibre", "Folate"],
    summary: "High in plant protein and fibre. Counts towards weekly plant diversity.",
  },
  {
    name: "Lentils",
    category: "Legumes",
    keyNutrients: ["Plant Protein", "Iron", "Folate"],
    summary: "A versatile source of plant protein and iron. Counts as a plant this week.",
  },
  {
    name: "Black Beans",
    category: "Legumes",
    keyNutrients: ["Plant Protein", "Fibre", "Antioxidants"],
    summary: "Rich in plant protein and fibre. Contributes to weekly plant diversity.",
  },
  {
    name: "Mixed Beans",
    category: "Legumes",
    keyNutrients: ["Plant Protein", "Fibre", "Iron"],
    summary: "A practical way to add plant protein and variety to any meal.",
  },

  // Herbs
  {
    name: "Basil",
    category: "Herbs",
    keyNutrients: ["Vitamin K", "Antioxidants"],
    summary: "Adds plant diversity and a burst of fresh flavour. Source of vitamin K.",
  },
  {
    name: "Coriander",
    category: "Herbs",
    keyNutrients: ["Vitamin K", "Antioxidants"],
    summary: "Brightens dishes and contributes to weekly plant variety.",
  },
  {
    name: "Parsley",
    category: "Herbs",
    keyNutrients: ["Vitamin K", "Vitamin C", "Folate"],
    summary: "One of the more nutrient-rich herbs. Adds to your weekly plant count.",
  },
  {
    name: "Mint",
    category: "Herbs",
    keyNutrients: ["Antioxidants", "Vitamin A"],
    summary: "Adds freshness and plant variety. A simple way to broaden your herb range.",
  },

  // Mushrooms
  {
    name: "Chestnut Mushrooms",
    category: "Mushrooms",
    keyNutrients: ["Vitamin D", "B Vitamins", "Selenium"],
    summary: "One of the few plant sources of vitamin D. Adds to weekly plant diversity.",
  },
  {
    name: "Mixed Mushrooms",
    category: "Mushrooms",
    keyNutrients: ["Vitamin D", "B Vitamins", "Selenium"],
    summary: "Variety in mushroom choice adds plant diversity and vitamin D.",
  },

  // Fermented
  {
    name: "Sauerkraut",
    category: "Fermented",
    keyNutrients: ["Probiotics", "Vitamin C", "Fibre"],
    summary: "A fermented food that adds gut-friendly variety to your diet.",
  },
  {
    name: "Kimchi",
    category: "Fermented",
    keyNutrients: ["Probiotics", "Vitamin C", "Vitamin K"],
    summary: "Adds plant diversity and fermented food variety to your week.",
  },

  // Healthy fats
  {
    name: "Avocado",
    category: "Healthy Fats",
    keyNutrients: ["Monounsaturated Fats", "Potassium", "Folate"],
    summary: "A source of heart-healthy fats and folate. Adds plant diversity.",
  },
  {
    name: "Extra Virgin Olive Oil",
    category: "Healthy Fats",
    keyNutrients: ["Monounsaturated Fats", "Vitamin E", "Polyphenols"],
    summary: "Rich in monounsaturated fats and polyphenols.",
  },

  // Extra veg & leafy greens
  {
    name: "Spinach",
    category: "Leafy Greens",
    keyNutrients: ["Iron", "Folate", "Vitamin K"],
    summary: "Adds iron and folate. Wilts easily into most cooked dishes.",
  },
  {
    name: "Kale",
    category: "Leafy Greens",
    keyNutrients: ["Vitamin K", "Vitamin C", "Calcium"],
    summary: "One of the more nutrient-dense leafy greens. Adds to plant diversity.",
  },
  {
    name: "Rocket",
    category: "Leafy Greens",
    keyNutrients: ["Vitamin K", "Folate", "Nitrates"],
    summary: "Adds plant diversity and a peppery flavour. A source of vitamin K.",
  },
  {
    name: "Grilled Tomatoes",
    category: "Extra Veg",
    keyNutrients: ["Lycopene", "Vitamin C", "Potassium"],
    summary: "Cooking tomatoes concentrates lycopene. Adds to plant diversity.",
  },
  {
    name: "Roasted Peppers",
    category: "Extra Veg",
    keyNutrients: ["Vitamin C", "Vitamin A", "Antioxidants"],
    summary: "One of the richest plant sources of vitamin C. Counts as a plant this week.",
  },
];

// ─── Lookup map (built once at module load) ───────────────────────────────────
// Keys are normalised using the same two-pass pipeline as ingredient-reuse.ts,
// so lookups are tolerant of prep words, quantities, and known aliases.

const BENEFIT_MAP = new Map<string, NutritionBenefit>(
  LIBRARY.map((b) => [normaliseForReuse(b.name), b]),
);

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns nutrition benefit data for an ingredient, or null if not in the library.
 * Input is normalised before lookup — quantities, prep words, and known aliases
 * are handled automatically.
 *
 * Examples:
 *   getNutritionBenefit("Pumpkin Seeds")     → { name: "Pumpkin Seeds", ... }
 *   getNutritionBenefit("fresh pumpkin seeds") → same entry
 *   getNutritionBenefit("unknown ingredient")  → null
 */
export function getNutritionBenefit(ingredient: string): NutritionBenefit | null {
  return BENEFIT_MAP.get(normaliseForReuse(ingredient)) ?? null;
}
