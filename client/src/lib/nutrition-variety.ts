import { normalizeIngredientKey } from "@shared/normalize";

export interface VarietyScore {
  fruits: number;
  vegetables: number;
  wholeGrains: number;
  herbsSpices: number;
  oliveOil: number;
  total: number;
}

export const EMPTY_VARIETY_SCORE: VarietyScore = {
  fruits: 0,
  vegetables: 0,
  wholeGrains: 0,
  herbsSpices: 0,
  oliveOil: 0,
  total: 0,
};

// ── Word lists ────────────────────────────────────────────────────────────────
// Each list uses exact, mid-string, and end-of-string word matching (see hasWord).
// Keep lists non-overlapping: each ingredient should match at most one category.

const FRUITS = [
  "apple", "apples", "banana", "bananas", "orange", "oranges",
  "lemon", "lemons", "lime", "limes",
  "strawberry", "strawberries", "blueberry", "blueberries",
  "raspberry", "raspberries", "blackberry", "blackberries",
  "mango", "mangoes", "pineapple", "grape", "grapes",
  "peach", "peaches", "plum", "plums", "pear", "pears",
  "cherries", "apricot", "apricots", "avocado", "avocados",
  "melon", "watermelon", "kiwi", "figs", "fig",
  "passion fruit", "grapefruit", "pomegranate",
  "cranberry", "cranberries", "raisins", "sultanas",
  "clementine", "clementines", "mandarin", "mandarins",
  "nectarine", "nectarines", "dates",
];

const VEGETABLES = [
  "broccoli", "spinach", "kale", "lettuce", "cabbage", "cauliflower",
  "carrot", "carrots", "courgette", "courgettes", "zucchini",
  "tomato", "tomatoes", "cherry tomatoes", "cucumber", "cucumbers",
  "red pepper", "green pepper", "yellow pepper", "bell pepper",
  "onion", "onions", "red onion", "red onions",
  "spring onion", "spring onions", "shallot", "shallots",
  "leek", "leeks", "celery", "asparagus", "peas",
  "green beans", "runner beans", "broad beans", "edamame",
  "mushroom", "mushrooms", "aubergine", "eggplant",
  "butternut squash", "squash", "pumpkin",
  "beetroot", "beet", "turnip", "parsnip", "swede",
  "artichoke", "fennel bulb", "bok choy", "pak choi",
  "sweetcorn", "sweet corn", "corn",
  "chilli", "chili", "jalapeno",
  "watercress", "rocket", "arugula",
  "sweet potato", "sweet potatoes", "garlic",
];

const WHOLE_GRAINS = [
  "oats", "oat", "porridge", "rolled oats",
  "brown rice", "wild rice",
  "quinoa", "bulgur", "bulgar", "freekeh",
  "barley", "pearl barley",
  "rye", "wholemeal", "whole wheat", "wholewheat",
  "wholegrain", "whole grain", "wholegrain bread", "wholemeal bread",
  "spelt", "farro", "millet", "amaranth", "buckwheat",
];

const HERBS_SPICES = [
  // fresh/dried herbs
  "basil", "oregano", "thyme", "rosemary", "sage", "parsley",
  "coriander", "cilantro", "mint", "dill", "tarragon", "chives",
  "bay leaf", "bay leaves",
  "dried thyme", "dried oregano", "dried basil", "dried parsley",
  "dried rosemary", "dried herbs", "fresh herbs", "mixed herbs",
  // common spices - single word forms
  "cumin", "turmeric", "paprika", "cayenne", "cinnamon", "nutmeg",
  "cardamom", "allspice", "saffron", "sumac", "lemongrass",
  // compound/ground forms - listed explicitly so they aren't caught by veg list first
  "ground cumin", "ground turmeric", "ground coriander", "ground ginger",
  "ground cinnamon", "ground nutmeg", "ground cardamom",
  "coriander seeds", "fennel seeds", "mustard seeds", "mustard powder",
  "smoked paprika", "sweet paprika",
  "chilli powder", "chili powder", "chilli flakes", "chili flakes",
  "black pepper", "white pepper", "ground pepper",
  "garam masala", "curry powder", "mixed spice",
  "star anise", "chinese five spice",
  "garlic powder", "garlic granules",
  "onion powder",
  "ginger", "fresh ginger",
  "vanilla", "vanilla extract",
  "za'atar", "harissa", "ras el hanout",
];

// ── Matching ──────────────────────────────────────────────────────────────────

// Returns true if `word` appears as a whole word in `text`.
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

// ── Core scorer ──────────────────────────────────────────────────────────────

export function computeMealVariety(ingredients: string[]): VarietyScore {
  let fruits = 0;
  let vegetables = 0;
  let wholeGrains = 0;
  let herbsSpices = 0;
  let oliveOil = 0;

  const seen = new Set<string>();

  for (const raw of ingredients) {
    const norm = normalizeIngredientKey(raw);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);

    // Olive oil: substring check (handles "3 tbsp olive oil")
    if (norm.includes("olive oil")) {
      oliveOil = 1;
      continue;
    }
    // Each ingredient counts toward at most one category (priority order).
    // Herbs/spices checked before vegetables to prevent e.g. "chilli powder"
    // matching "chilli" in vegetables.
    if (herbsSpices === 0 && matchesAny(norm, HERBS_SPICES)) {
      herbsSpices = 1;
    } else if (fruits < 3 && matchesAny(norm, FRUITS)) {
      fruits++;
    } else if (vegetables < 3 && matchesAny(norm, VEGETABLES)) {
      vegetables++;
    } else if (wholeGrains === 0 && matchesAny(norm, WHOLE_GRAINS)) {
      wholeGrains = 1;
    }
  }

  const total = fruits + vegetables + wholeGrains + herbsSpices + oliveOil;
  return { fruits, vegetables, wholeGrains, herbsSpices, oliveOil, total };
}

// ── Extended plant categories for cross-week counting ────────────────────────
// These supplement the five existing categories (fruits, vegetables, whole
// grains, herbs/spices, olive oil) for the WeeklyPlantDiversityCounter.
// They are intentionally NOT added to computeMealVariety / VarietyScore — that
// would add category chips to NutritionVarietyDots and DayVarietySummary, which
// is out of scope for this accuracy fix.

const LEGUMES_PULSES = [
  // Chickpeas
  "chickpea", "chickpeas",
  // Lentils
  "lentil", "lentils",
  "red lentil", "red lentils", "green lentil", "green lentils",
  "puy lentil", "puy lentils", "beluga lentil", "beluga lentils",
  // Beans
  "black bean", "black beans",
  "kidney bean", "kidney beans", "red kidney bean", "red kidney beans",
  "butter bean", "butter beans",
  "cannellini bean", "cannellini beans", "cannellini",
  "haricot bean", "haricot beans",
  "borlotti bean", "borlotti beans",
  "mixed beans", "five bean mix", "bean mix",
  "baked beans",
  "split pea", "split peas",
  // Soy-based
  "tofu", "silken tofu", "firm tofu",
  "tempeh",
];

const SEEDS_LIST = [
  "pumpkin seed", "pumpkin seeds",
  "chia seed", "chia seeds",
  "flax seed", "flax seeds", "flaxseed", "linseed",
  "sesame seed", "sesame seeds",
  "sunflower seed", "sunflower seeds",
  "hemp seed", "hemp seeds",
  "poppy seed", "poppy seeds",
  "mixed seeds",
];

const NUTS_LIST = [
  "walnut", "walnuts",
  "almond", "almonds",
  "cashew", "cashews", "cashew nut", "cashew nuts",
  "pecan", "pecans",
  "pistachio", "pistachios",
  "hazelnut", "hazelnuts",
  "pine nut", "pine nuts",
  "brazil nut", "brazil nuts",
  "macadamia", "macadamia nut", "macadamia nuts",
  "peanut", "peanuts",
  "chestnut", "chestnuts",
  "mixed nuts",
];

const FERMENTED_FOODS = [
  "sauerkraut",
  "kimchi",
  "miso",
  "tempeh",
  "kombucha",
  "kefir",
];

/**
 * Returns true if an ingredient string counts as a plant food for the purpose
 * of the 30 Plants This Week counter.
 *
 * Covers all plant categories: fruits, vegetables, whole grains, herbs & spices,
 * olive oil, legumes, seeds, nuts, and fermented plant foods.
 *
 * Used only by WeeklyPlantDiversityCounter — not by computeMealVariety, which
 * intentionally limits itself to 5 categories for the meal variety dots/chips.
 */
export function isPlantIngredient(ingredient: string): boolean {
  const norm = normalizeIngredientKey(ingredient);
  if (!norm) return false;
  if (norm.includes("olive oil")) return true;
  return (
    matchesAny(norm, FRUITS) ||
    matchesAny(norm, VEGETABLES) ||
    matchesAny(norm, WHOLE_GRAINS) ||
    matchesAny(norm, HERBS_SPICES) ||
    matchesAny(norm, LEGUMES_PULSES) ||
    matchesAny(norm, SEEDS_LIST) ||
    matchesAny(norm, NUTS_LIST) ||
    matchesAny(norm, FERMENTED_FOODS)
  );
}

export type PlantCategory =
  | "Vegetables"
  | "Fruits"
  | "Whole Grains"
  | "Herbs & Spices"
  | "Olive Oil"
  | "Legumes"
  | "Seeds"
  | "Nuts"
  | "Fermented Foods";

/**
 * Returns the plant category for an ingredient, or null if not a plant.
 * Uses the same priority order as isPlantIngredient — herbs before vegetables
 * to prevent e.g. "chilli powder" matching "chilli" in the vegetables list.
 *
 * Used by PlantDiversityExplorer to group plants by category.
 */
export function getPlantCategory(ingredient: string): PlantCategory | null {
  const norm = normalizeIngredientKey(ingredient);
  if (!norm) return null;
  if (norm.includes("olive oil")) return "Olive Oil";
  if (matchesAny(norm, HERBS_SPICES)) return "Herbs & Spices";
  if (matchesAny(norm, FRUITS)) return "Fruits";
  if (matchesAny(norm, VEGETABLES)) return "Vegetables";
  if (matchesAny(norm, WHOLE_GRAINS)) return "Whole Grains";
  if (matchesAny(norm, LEGUMES_PULSES)) return "Legumes";
  if (matchesAny(norm, SEEDS_LIST)) return "Seeds";
  if (matchesAny(norm, NUTS_LIST)) return "Nuts";
  if (matchesAny(norm, FERMENTED_FOODS)) return "Fermented Foods";
  return null;
}

export function sumVarietyScores(scores: VarietyScore[]): VarietyScore {
  return scores.reduce(
    (acc, s) => ({
      fruits: acc.fruits + s.fruits,
      vegetables: acc.vegetables + s.vegetables,
      wholeGrains: acc.wholeGrains + s.wholeGrains,
      herbsSpices: acc.herbsSpices + s.herbsSpices,
      oliveOil: acc.oliveOil + s.oliveOil,
      total: acc.total + s.total,
    }),
    { ...EMPTY_VARIETY_SCORE },
  );
}
