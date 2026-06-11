/**
 * nutrition-boosts.ts
 * ====================
 * Deterministic, hard-coded Nutrition Boost Library for Release 1.
 *
 * Design principles:
 * - No DB, no migrations, no admin tooling
 * - Meal-aware: boosts must feel natural to the meal type
 * - Deterministic: same meal name → same suggestions every time
 * - Easy to extend: add entries to BOOST_LIBRARY or MEAL_TYPE_BOOSTS
 */

// ─── Boost Library ────────────────────────────────────────────────────────────

export interface BoostItem {
  name: string;
  category: BoostCategory;
}

export type BoostCategory =
  | "legumes"
  | "seeds"
  | "nuts"
  | "herbs"
  | "mushrooms"
  | "fermented"
  | "healthy-fats"
  | "extra-veg";

export const BOOST_LIBRARY: Record<BoostCategory, BoostItem[]> = {
  legumes: [
    { name: "Chickpeas", category: "legumes" },
    { name: "Lentils", category: "legumes" },
    { name: "Black Beans", category: "legumes" },
    { name: "Mixed Beans", category: "legumes" },
  ],
  seeds: [
    { name: "Pumpkin Seeds", category: "seeds" },
    { name: "Chia Seeds", category: "seeds" },
    { name: "Flax Seeds", category: "seeds" },
  ],
  nuts: [
    { name: "Walnuts", category: "nuts" },
    { name: "Almonds", category: "nuts" },
  ],
  herbs: [
    { name: "Basil", category: "herbs" },
    { name: "Coriander", category: "herbs" },
    { name: "Parsley", category: "herbs" },
    { name: "Mint", category: "herbs" },
  ],
  mushrooms: [
    { name: "Chestnut Mushrooms", category: "mushrooms" },
    { name: "Mixed Mushrooms", category: "mushrooms" },
  ],
  fermented: [
    { name: "Sauerkraut", category: "fermented" },
    { name: "Kimchi", category: "fermented" },
  ],
  "healthy-fats": [
    { name: "Avocado", category: "healthy-fats" },
    { name: "Extra Virgin Olive Oil", category: "healthy-fats" },
  ],
  "extra-veg": [
    { name: "Spinach", category: "extra-veg" },
    { name: "Kale", category: "extra-veg" },
    { name: "Grilled Tomatoes", category: "extra-veg" },
    { name: "Roasted Peppers", category: "extra-veg" },
  ],
};

// ─── Meal-type boost mapping ───────────────────────────────────────────────────
// Each entry is a list of boost item names in priority order.
// The first 3 that don't already appear in the meal's ingredients are shown.

interface MealTypeBoosts {
  keywords: string[];           // meal name substrings (lowercase) that match this type
  boosts: string[];             // boost item names from BOOST_LIBRARY, in priority order
}

const MEAL_TYPE_BOOSTS: MealTypeBoosts[] = [
  {
    keywords: ["breakfast", "cooked breakfast", "fry up", "full english"],
    boosts: ["Spinach", "Avocado", "Grilled Tomatoes", "Chestnut Mushrooms"],
  },
  {
    keywords: ["porridge", "oatmeal", "overnight oat"],
    boosts: ["Chia Seeds", "Walnuts", "Flax Seeds", "Pumpkin Seeds"],
  },
  {
    keywords: ["smoothie", "smoothie bowl"],
    boosts: ["Chia Seeds", "Flax Seeds", "Walnuts", "Pumpkin Seeds"],
  },
  {
    keywords: ["taco", "fajita", "burrito", "quesadilla", "mexican"],
    boosts: ["Black Beans", "Avocado", "Coriander", "Mixed Beans"],
  },
  {
    keywords: ["pasta", "spaghetti", "linguine", "tagliatelle", "penne", "rigatoni", "carbonara", "bolognese", "ragu", "lasagna", "lasagne"],
    boosts: ["Lentils", "Chestnut Mushrooms", "Basil", "Spinach"],
  },
  {
    keywords: ["curry", "korma", "tikka", "masala", "jalfrezi", "dhal", "dal", "lentil curry"],
    boosts: ["Chickpeas", "Spinach", "Coriander", "Kale"],
  },
  {
    keywords: ["salad", "slaw", "grain bowl", "buddha bowl"],
    boosts: ["Pumpkin Seeds", "Chickpeas", "Sauerkraut", "Walnuts"],
  },
  {
    keywords: ["wrap", "flatbread", "pitta", "pita"],
    boosts: ["Avocado", "Mixed Beans", "Coriander", "Parsley"],
  },
  {
    keywords: ["stir fry", "stir-fry", "noodle", "pad thai", "fried rice"],
    boosts: ["Extra Virgin Olive Oil", "Mixed Mushrooms", "Kale", "Spinach"],
  },
  {
    keywords: ["soup", "stew", "broth", "chowder", "bisque"],
    boosts: ["Lentils", "Mixed Beans", "Parsley", "Kale"],
  },
  {
    keywords: ["chilli", "chili"],
    boosts: ["Black Beans", "Mixed Beans", "Avocado", "Coriander"],
  },
  {
    keywords: ["pizza"],
    boosts: ["Spinach", "Roasted Peppers", "Mixed Mushrooms", "Basil"],
  },
  {
    keywords: ["burger", "patty"],
    boosts: ["Avocado", "Sauerkraut", "Mixed Mushrooms", "Spinach"],
  },
  {
    keywords: ["roast", "sunday roast", "sheet pan", "traybake"],
    boosts: ["Kale", "Roasted Peppers", "Extra Virgin Olive Oil", "Parsley"],
  },
  {
    keywords: ["fish", "salmon", "cod", "tuna", "haddock", "sea bass", "mackerel"],
    boosts: ["Roasted Peppers", "Spinach", "Parsley", "Extra Virgin Olive Oil"],
  },
];

// Fallback boosts used when no keyword matches — gentle and broadly applicable
const FALLBACK_BOOSTS: string[] = [
  "Spinach",
  "Extra Virgin Olive Oil",
  "Pumpkin Seeds",
];

// ─── Public API ───────────────────────────────────────────────────────────────

export interface NutritionBoostSuggestion {
  name: string;
  category: BoostCategory;
}

/**
 * Returns up to 3 contextually relevant boost suggestions for a meal.
 * Filters out items already present in the meal's ingredient list.
 * Deterministic: same inputs → same outputs.
 */
export function getMealBoosts(
  mealName: string,
  ingredients: string[],
): NutritionBoostSuggestion[] {
  const nameLower = mealName.toLowerCase();
  const ingredientText = ingredients.join(" ").toLowerCase();

  // Find the first matching meal type
  const match = MEAL_TYPE_BOOSTS.find((mt) =>
    mt.keywords.some((kw) => nameLower.includes(kw)),
  );

  const candidates = match?.boosts ?? FALLBACK_BOOSTS;

  // Filter out items already in the meal
  const filtered = candidates.filter(
    (boost) => !ingredientText.includes(boost.toLowerCase()),
  );

  // Map to full BoostItem objects (with category)
  const all = Object.values(BOOST_LIBRARY).flat();
  const result: NutritionBoostSuggestion[] = [];

  for (const name of filtered) {
    if (result.length >= 5) break;
    const item = all.find((b) => b.name === name);
    if (item) result.push(item);
  }

  return result;
}
