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
  // common spices — single word forms
  "cumin", "turmeric", "paprika", "cayenne", "cinnamon", "nutmeg",
  "cardamom", "allspice", "saffron", "sumac", "lemongrass",
  // compound/ground forms — listed explicitly so they aren't caught by veg list first
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
