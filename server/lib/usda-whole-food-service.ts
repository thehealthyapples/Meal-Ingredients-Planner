/**
 * Thin wrapper around the USDA FoodData Central (FDC) API.
 * Returns a lightweight nutrient snapshot for a curated set of whole foods.
 *
 * API key: set USDA_API_KEY env var, otherwise falls back to the public DEMO_KEY
 * (30 req/hour unauthenticated). This is fine for on-demand food-knowledge lookups.
 *
 * Usage: call getWholeFoodSnapshot(slug) and, if non-null, append the result to
 * the food knowledge response.
 */

const API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";
const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";

// Curated map: food_knowledge slug → FDC ID (SR Legacy or Foundation Foods)
// These IDs are stable reference entries for raw whole foods.
const SLUG_TO_FDC_ID: Record<string, number> = {
  oats:    173904,  // Oats
  lentils: 172421,  // Lentils, raw
  salmon:  175167,  // Salmon, Atlantic, farmed, raw
  tofu:    172475,  // Tofu, raw, firm
  spinach: 168462,  // Spinach, raw
  eggs:    748967,  // Egg, whole, raw
  broccoli: 170379, // Broccoli, raw
  chickpeas: 173757, // Chickpeas (garbanzo beans), raw
  "sweet-potato": 168483, // Sweet potato, raw
  banana:  173944,  // Bananas, raw
};

// USDA nutrient IDs for the fields we care about
const NUTRIENT_IDS: Record<string, number> = {
  calories: 1008,
  protein:  1003,
  carbs:    1005,
  fat:      1004,
  fibre:    1079,
  sugar:    2000,
};

export interface NutrientSnapshot {
  per100g: {
    calories: number | null;
    protein:  number | null;
    carbs:    number | null;
    fat:      number | null;
    fibre:    number | null;
    sugar:    number | null;
  };
  fdcId:   number;
  source:  "usda-fdc";
}

function extractNutrients(foodNutrients: any[]): NutrientSnapshot["per100g"] {
  const find = (id: number) => {
    const match = foodNutrients.find(
      (n: any) => n.nutrientId === id || n.nutrient?.id === id
    );
    return match ? Math.round((match.value ?? match.amount ?? 0) * 10) / 10 : null;
  };
  return {
    calories: find(NUTRIENT_IDS.calories),
    protein:  find(NUTRIENT_IDS.protein),
    carbs:    find(NUTRIENT_IDS.carbs),
    fat:      find(NUTRIENT_IDS.fat),
    fibre:    find(NUTRIENT_IDS.fibre),
    sugar:    find(NUTRIENT_IDS.sugar),
  };
}

export async function getWholeFoodSnapshot(slug: string): Promise<NutrientSnapshot | null> {
  const fdcId = SLUG_TO_FDC_ID[slug];
  if (!fdcId) return null;

  try {
    const url = `${FDC_BASE}/food/${fdcId}?fields=foodNutrients&api_key=${API_KEY}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "THA/1.0 (contact@theappleshop.app)" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const foodNutrients: any[] = data.foodNutrients || [];
    if (foodNutrients.length === 0) return null;

    return {
      per100g: extractNutrients(foodNutrients),
      fdcId,
      source: "usda-fdc",
    };
  } catch {
    return null;
  }
}

/** Returns the list of slugs that have USDA data wired up. */
export function supportedWholeFoodSlugs(): string[] {
  return Object.keys(SLUG_TO_FDC_ID);
}
