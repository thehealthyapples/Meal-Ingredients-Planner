/**
 * Lightweight nutrient-awareness layer.
 *
 * Translates ingredient lists into simple, trustworthy nutrient tags.
 * No numbers, no percentages, no deficiency language.
 * Only maps when the association is well-established and unambiguous.
 */
import { normalizeIngredientKey } from "@shared/normalize";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NutrientTag =
  | "Vitamin C"
  | "Fibre"
  | "Healthy fats"
  | "Vitamin D"
  | "Iron";

export interface NutrientGoal {
  id: string;
  label: string;
  nutrient: NutrientTag;
  suggestions: string[];
}

// ── Matching helpers (mirrors nutrition-variety.ts pattern) ───────────────────

function hasWord(text: string, word: string): boolean {
  return (
    text === word ||
    text.startsWith(word + " ") ||
    text.endsWith(" " + word) ||
    text.includes(" " + word + " ")
  );
}

function matchesAny(norm: string, words: string[]): boolean {
  return words.some((w) => hasWord(norm, w));
}

// ── Nutrient → ingredient triggers ───────────────────────────────────────────
// Lists are intentionally conservative: only include ingredients where the
// nutritional association is well-known and unlikely to mislead.

const NUTRIENT_TRIGGERS: Record<NutrientTag, string[]> = {
  "Vitamin C": [
    // citrus
    "orange", "oranges", "lemon", "lemons", "lime", "limes",
    "grapefruit", "clementine", "clementines", "mandarin", "mandarins",
    // berries
    "strawberries", "strawberry", "blueberries", "blueberry",
    "raspberries", "raspberry", "blackberries", "blackberry", "kiwi",
    // peppers (high Vitamin C)
    "red pepper", "green pepper", "yellow pepper", "bell pepper",
    // vegetables
    "broccoli", "kale", "cauliflower", "sweet potato", "sweet potatoes",
    "tomatoes", "tomato", "cherry tomatoes",
  ],

  "Fibre": [
    // legumes
    "lentils", "lentil", "chickpeas", "chickpea",
    "kidney beans", "black beans", "cannellini beans", "butter beans",
    "peas", "edamame", "broad beans", "baked beans",
    // whole grains
    "oats", "oat", "brown rice", "quinoa", "bulgur", "bulgar",
    "barley", "pearl barley", "rye", "wholemeal", "whole wheat",
    "wholewheat", "wholegrain", "whole grain", "spelt", "farro",
    // high-fibre vegetables
    "broccoli", "spinach", "kale", "carrot", "carrots",
    "sweet potato", "sweet potatoes", "courgette", "courgettes",
    "beetroot", "parsnip", "peas",
    // fruits
    "apple", "apples", "pear", "pears", "banana", "bananas",
    "raspberries", "blackberries",
  ],

  "Healthy fats": [
    // olive oil (matches "3 tbsp olive oil" via endsWith)
    "olive oil",
    // avocado
    "avocado", "avocados",
    // nuts
    "almonds", "walnuts", "cashews", "pistachios", "pine nuts",
    "pecans", "hazelnuts", "peanuts",
    // seeds
    "chia seeds", "flaxseed", "sunflower seeds", "pumpkin seeds",
    "sesame seeds",
    // oily fish
    "salmon", "mackerel", "sardines", "trout", "herring",
  ],

  "Vitamin D": [
    // eggs
    "egg", "eggs",
    // oily fish
    "salmon", "mackerel", "sardines", "trout", "herring",
    // mushrooms (UV-exposed mushrooms are a meaningful plant source)
    "mushroom", "mushrooms",
  ],

  "Iron": [
    // leafy greens
    "spinach", "kale", "watercress", "rocket",
    // legumes
    "lentils", "lentil", "chickpeas", "chickpea",
    "kidney beans", "black beans", "edamame",
    // red meat
    "beef", "lamb", "venison", "steak", "beef mince", "mince",
    // tofu
    "tofu",
    // seeds
    "pumpkin seeds", "sesame seeds",
  ],
};

// ── Core function ─────────────────────────────────────────────────────────────

/**
 * Returns the set of nutrient tags supported by the given ingredient list.
 * One ingredient can contribute to multiple nutrients.
 * Unknown ingredients are silently ignored.
 */
export function getMealNutrients(ingredients: string[]): NutrientTag[] {
  const found = new Set<NutrientTag>();
  for (const raw of ingredients) {
    const norm = normalizeIngredientKey(raw);
    if (!norm) continue;
    for (const tag of Object.keys(NUTRIENT_TRIGGERS) as NutrientTag[]) {
      if (matchesAny(norm, NUTRIENT_TRIGGERS[tag])) {
        found.add(tag);
      }
    }
  }
  return Array.from(found);
}

/**
 * Merges nutrient arrays from multiple meals, deduplicating the result.
 */
export function mergeNutrients(perMealNutrients: NutrientTag[][]): NutrientTag[] {
  const combined = new Set<NutrientTag>();
  for (const list of perMealNutrients) {
    for (const tag of list) combined.add(tag);
  }
  return Array.from(combined);
}

// ── "I want to support…" goal definitions ─────────────────────────────────────
// Suggestions use readable names from the known ingredient vocabulary.

export const NUTRIENT_GOALS: NutrientGoal[] = [
  {
    id: "immunity",
    label: "Immunity",
    nutrient: "Vitamin C",
    suggestions: ["Bell peppers", "Broccoli", "Oranges", "Strawberries", "Kiwi"],
  },
  {
    id: "bone-health",
    label: "Bone health",
    nutrient: "Vitamin D",
    suggestions: ["Salmon", "Eggs", "Mushrooms", "Mackerel"],
  },
  {
    id: "energy",
    label: "Energy",
    nutrient: "Iron",
    suggestions: ["Spinach", "Lentils", "Chickpeas", "Lean red meat", "Pumpkin seeds"],
  },
  {
    id: "gut-health",
    label: "Gut health",
    nutrient: "Fibre",
    suggestions: ["Oats", "Lentils", "Broccoli", "Brown rice", "Apples"],
  },
];
