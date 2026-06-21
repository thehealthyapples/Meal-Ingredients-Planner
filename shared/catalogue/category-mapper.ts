// WS0.10 — USDA → THA Category Mapper.
//
// USDA FoodData Central uses broad food group categories that do not align with
// THA's subcategory structure. This mapper applies a two-stage translation:
//   1. USDA food group → THA category
//   2. Scientific name / description keyword → THA subcategory
//
// When the USDA category is unambiguous, stage 2 is skipped.
// When it is ambiguous (e.g., "Vegetables" covers Brassicas, Root, Leafy Green,
// Fruiting), stage 2 applies keyword hints to pick the subcategory.
// When neither stage resolves, the result is flagged for review.

export interface CategoryMapping {
  thaCategory: string;
  thaSubcategory: string | null;
  confidence: "mapped" | "keyword_hint" | "ambiguous";
  reason: string;
}

// Stage 1: USDA food group → THA category (broad, unambiguous cases)
const USDA_CATEGORY_TO_THA: Record<string, { category: string; subcategory: string | null }> = {
  // USDA Foundation / SR Legacy food groups
  "Nut and Seed Products":          { category: "Nuts and seeds",   subcategory: null },
  "Fats and Oils":                  { category: "Oils and fats",    subcategory: null },
  "Dairy and Egg Products":         { category: "Dairy",            subcategory: null },
  "Poultry Products":               { category: "Meat and poultry", subcategory: "Poultry" },
  "Beef Products":                  { category: "Meat and poultry", subcategory: "Red meat" },
  "Pork Products":                  { category: "Meat and poultry", subcategory: "Red meat" },
  "Lamb, Veal, and Game Products":  { category: "Meat and poultry", subcategory: "Red meat" },
  "Sausages and Luncheon Meats":    { category: "Meat and poultry", subcategory: "Processed" },
  "Cereal Grains and Pasta":        { category: "Grains",           subcategory: null },
  "Breakfast Cereals":              { category: "Grains",           subcategory: "Breakfast cereals" },
  "Baked Products":                 { category: "Grains",           subcategory: "Bread and baked" },
  "Sweets":                         { category: "Other",            subcategory: null },
  "Beverages":                      { category: "Beverages",        subcategory: null },
  "Spices and Herbs":               { category: "Herbs and spices", subcategory: null },
  "Soups, Sauces and Gravies":      { category: "Other",            subcategory: null },
  "Fast Foods":                     { category: "Other",            subcategory: null },
  "Meals, Entrees, and Side Dishes": { category: "Other",           subcategory: null },
  // Note: Mushrooms, Vegetables/Fruits, Finfish, Shellfish, Legumes need stage 2
};

// Stage 2: keyword hints for ambiguous categories.
// Applied when USDA category maps to "Vegetables" or "Finfish and Shellfish Products".

const BRASSICA_KEYWORDS = [
  "broccoli", "cauliflower", "cabbage", "kale", "brussels", "kohlrabi",
  "pak choi", "bok choy", "rocket", "arugula", "watercress", "radish",
  "turnip", "swede", "rutabaga", "horseradish", "mustard green",
];

const LEAFY_KEYWORDS = [
  "spinach", "lettuce", "chard", "chicory", "endive", "radicchio",
  "chard", "sorrel", "purslane", "arugula", "rocket",
];

const ROOT_KEYWORDS = [
  "carrot", "parsnip", "beetroot", "beet", "potato", "sweet potato",
  "yam", "celeriac", "salsify", "turnip", "swede", "rutabaga",
  "jerusalem artichoke",
];

const FRUITING_KEYWORDS = [
  "tomato", "pepper", "aubergine", "eggplant", "courgette", "zucchini",
  "cucumber", "squash", "pumpkin", "corn", "sweetcorn", "okra",
];

const ALLIUM_KEYWORDS = [
  "onion", "garlic", "leek", "chive", "spring onion", "scallion", "shallot",
];

const OILY_FISH_KEYWORDS = [
  "salmon", "sardine", "mackerel", "tuna", "herring", "anchov", "trout",
  "pilchard", "sprat", "eel",
];

const WHITE_FISH_KEYWORDS = [
  "cod", "haddock", "plaice", "sole", "pollock", "tilapia", "bass",
  "bream", "halibut", "turbot", "whiting", "coley", "skate",
];

const SHELLFISH_KEYWORDS = [
  "shrimp", "prawn", "crab", "lobster", "oyster", "mussel", "clam",
  "scallop", "squid", "octopus", "crayfish",
];

const LEGUME_BEANS_KEYWORDS = [
  "chickpea", "garbanzo", "black bean", "kidney bean", "butter bean",
  "cannellini", "borlotti", "haricot", "navy bean", "lima bean",
  "broad bean", "fava bean",
];

const LEGUME_LENTIL_KEYWORDS = ["lentil"];

const LEGUME_PULSE_KEYWORDS = ["pea", "split pea", "black-eyed", "pigeon pea", "mung bean"];

function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export function mapCategory(
  usdaCategory: string | undefined,
  resolvedName: string,
  scientificName?: string,
): CategoryMapping {
  const hint = `${resolvedName} ${scientificName ?? ""}`.toLowerCase();

  // Mushrooms
  if (usdaCategory?.toLowerCase().includes("mushroom") || hint.includes("mushroom")) {
    return { thaCategory: "Mushrooms", thaSubcategory: "Cultivated", confidence: "mapped", reason: "Mushroom category or keyword" };
  }

  // Finfish and shellfish
  if (usdaCategory?.includes("Finfish") || usdaCategory?.includes("Shellfish") || usdaCategory?.includes("Fish")) {
    if (matchesAny(hint, SHELLFISH_KEYWORDS)) {
      return { thaCategory: "Fish and seafood", thaSubcategory: "Shellfish", confidence: "keyword_hint", reason: "Shellfish keyword" };
    }
    if (matchesAny(hint, OILY_FISH_KEYWORDS)) {
      return { thaCategory: "Fish and seafood", thaSubcategory: "Oily fish", confidence: "keyword_hint", reason: "Oily fish keyword" };
    }
    if (matchesAny(hint, WHITE_FISH_KEYWORDS)) {
      return { thaCategory: "Fish and seafood", thaSubcategory: "White fish", confidence: "keyword_hint", reason: "White fish keyword" };
    }
    return { thaCategory: "Fish and seafood", thaSubcategory: null, confidence: "ambiguous", reason: "Fish but subcategory unclear — review required" };
  }

  // Legumes
  if (usdaCategory?.includes("Legume")) {
    if (matchesAny(hint, LEGUME_LENTIL_KEYWORDS)) {
      return { thaCategory: "Legumes", thaSubcategory: "Lentils", confidence: "keyword_hint", reason: "Lentil keyword" };
    }
    if (matchesAny(hint, LEGUME_PULSE_KEYWORDS)) {
      return { thaCategory: "Legumes", thaSubcategory: "Pulses", confidence: "keyword_hint", reason: "Pulse keyword" };
    }
    if (matchesAny(hint, LEGUME_BEANS_KEYWORDS)) {
      return { thaCategory: "Legumes", thaSubcategory: "Beans", confidence: "keyword_hint", reason: "Bean keyword" };
    }
    return { thaCategory: "Legumes", thaSubcategory: null, confidence: "ambiguous", reason: "Legume but type unclear" };
  }

  // Fruits
  if (usdaCategory?.includes("Fruit")) {
    return { thaCategory: "Fruit", thaSubcategory: null, confidence: "mapped", reason: "Fruit category" };
  }

  // Vegetables — most complex mapping
  if (usdaCategory?.includes("Vegetable")) {
    if (matchesAny(hint, BRASSICA_KEYWORDS)) {
      return { thaCategory: "Vegetables", thaSubcategory: "Brassicas", confidence: "keyword_hint", reason: "Brassica keyword" };
    }
    if (matchesAny(hint, ALLIUM_KEYWORDS)) {
      return { thaCategory: "Vegetables", thaSubcategory: "Alliums", confidence: "keyword_hint", reason: "Allium keyword" };
    }
    if (matchesAny(hint, ROOT_KEYWORDS)) {
      return { thaCategory: "Vegetables", thaSubcategory: "Root vegetables", confidence: "keyword_hint", reason: "Root vegetable keyword" };
    }
    if (matchesAny(hint, LEAFY_KEYWORDS)) {
      return { thaCategory: "Vegetables", thaSubcategory: "Leafy greens", confidence: "keyword_hint", reason: "Leafy green keyword" };
    }
    if (matchesAny(hint, FRUITING_KEYWORDS)) {
      return { thaCategory: "Vegetables", thaSubcategory: "Fruiting vegetables", confidence: "keyword_hint", reason: "Fruiting vegetable keyword" };
    }
    return { thaCategory: "Vegetables", thaSubcategory: null, confidence: "ambiguous", reason: "Vegetable but subcategory unclear — review required" };
  }

  // Direct USDA category lookup
  const direct = USDA_CATEGORY_TO_THA[usdaCategory ?? ""];
  if (direct) {
    return { thaCategory: direct.category, thaSubcategory: direct.subcategory, confidence: "mapped", reason: `Direct USDA mapping: ${usdaCategory}` };
  }

  // Spices and herbs — catch-all keyword fallback
  if (matchesAny(hint, ["herb", "basil", "thyme", "rosemary", "oregano", "sage", "dill", "chive", "tarragon", "bay"])) {
    return { thaCategory: "Herbs and spices", thaSubcategory: "Herbs", confidence: "keyword_hint", reason: "Herb keyword" };
  }
  if (matchesAny(hint, ["spice", "cumin", "turmeric", "cinnamon", "paprika", "cardamom", "pepper", "nutmeg", "clove", "star anise"])) {
    return { thaCategory: "Herbs and spices", thaSubcategory: "Spices", confidence: "keyword_hint", reason: "Spice keyword" };
  }

  return {
    thaCategory: "Other",
    thaSubcategory: null,
    confidence: "ambiguous",
    reason: `No THA mapping for USDA category "${usdaCategory ?? "unknown"}" — review required`,
  };
}
