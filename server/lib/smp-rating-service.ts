import type { AdditiveMatch } from "./upf-analysis-service";

const DAIRY_MEAT_KEYWORDS = [
  "dairy", "milk", "cheese", "yoghurt", "yogurt", "cream", "butter",
  "beef", "meat", "steak", "mince", "burger", "lamb", "pork", "chicken",
  "turkey", "sausage", "bacon",
];

const ORGANIC_KEYWORDS = ["organic", "bio", "biologique"];

const FREE_RANGE_KEYWORDS = ["free range", "free-range"];

const GRASS_FED_KEYWORDS = [
  "grass fed", "grass-fed", "grass finished", "grass-finished",
  "pasture raised", "pasture-raised", "pasture fed", "pasture-fed",
];

const SUPERFOODS = [
  "quinoa", "chia", "flaxseed", "linseed", "turmeric", "ginger",
  "blueberry", "blueberries", "acai", "spinach", "kale", "broccoli",
  "avocado", "salmon", "sardine", "sardines", "mackerel", "walnut",
  "walnuts", "almond", "almonds", "oats", "sweet potato", "garlic",
  "green tea", "matcha", "pomegranate", "beetroot", "lentil", "lentils",
  "chickpea", "chickpeas", "hemp seed", "hemp seeds", "spirulina",
  "seaweed", "olive oil", "coconut oil", "dark chocolate", "cacao",
];

// ---------------------------------------------------------------------------
// Whole-food recognition
// ---------------------------------------------------------------------------

const WHOLE_FOOD_CORE = new Set([
  // Vegetables
  "onion", "onions", "carrot", "carrots", "potato", "potatoes",
  "sweet potato", "sweet potatoes",
  "tomato", "tomatoes", "cherry tomato", "cherry tomatoes",
  "plum tomato", "plum tomatoes", "vine tomato", "vine tomatoes", "spinach",
  "broccoli", "cauliflower", "cabbage", "lettuce", "celery", "cucumber",
  "courgette", "zucchini", "aubergine", "eggplant", "pepper", "peppers",
  "capsicum", "mushroom", "mushrooms", "garlic", "leek", "leeks",
  "pea", "peas", "bean", "beans", "lentil", "lentils", "chickpea", "chickpeas",
  "sweetcorn", "corn", "parsnip", "turnip", "swede", "beetroot", "beet",
  "asparagus", "artichoke", "kale", "chard", "radish",
  "spring onion", "spring onions", "shallot", "shallots",
  "butternut squash", "pumpkin", "fennel", "pak choi", "bok choy",
  "spring greens", "watercress", "rocket", "arugula", "edamame",
  "mangetout", "sugar snap peas", "broad bean", "broad beans",
  "runner bean", "runner beans", "okra",
  // Tinned/canned compound terms that may reach the name check
  // (ingredient-text validation still required at scoring time)
  "tinned beans", "tinned chickpeas", "tinned lentils", "tinned tomatoes",
  "canned beans", "canned chickpeas", "canned lentils", "canned tomatoes",
  "dried beans", "dried chickpeas", "dried lentils",
  // Fruits
  "apple", "apples", "banana", "bananas", "orange", "oranges",
  "grape", "grapes", "strawberry", "strawberries", "blueberry", "blueberries",
  "raspberry", "raspberries", "mango", "mangoes", "pineapple", "watermelon",
  "melon", "kiwi", "pear", "pears", "plum", "plums", "cherry", "cherries",
  "peach", "peaches", "apricot", "apricots", "lemon", "lemons",
  "lime", "limes", "grapefruit", "avocado", "avocados",
  "fig", "figs", "date", "dates", "nectarine", "nectarines",
  "clementine", "clementines", "satsuma", "satsumas",
  "tangerine", "tangerines", "pomegranate", "pomegranates",
  // Grains / staples
  "oats", "oat", "rice", "quinoa", "barley", "rye", "wheat", "buckwheat",
  "millet", "spelt", "polenta", "cornmeal", "couscous", "bulgur", "bulgur wheat",
  // Seeds & nuts
  "chia seed", "chia seeds", "flaxseed", "linseed",
  "sunflower seed", "sunflower seeds", "pumpkin seed", "pumpkin seeds",
  "sesame seed", "sesame seeds", "hemp seed", "hemp seeds",
  "almond", "almonds", "walnut", "walnuts", "cashew", "cashews",
  "brazil nut", "brazil nuts", "pecan", "pecans",
  "pistachio", "pistachios", "hazelnut", "hazelnuts", "macadamia",
  "pine nut", "pine nuts",
  // Plain protein (meat / fish / eggs)
  "egg", "eggs",
  "chicken", "chicken breast", "chicken thigh", "chicken thighs",
  "chicken leg", "chicken legs",
  "beef", "beef steak", "beef mince", "lamb", "lamb chop", "lamb chops",
  "pork", "pork chop", "pork chops", "turkey", "turkey breast",
  "salmon", "salmon fillet", "salmon fillets", "tuna", "cod",
  "cod fillet", "cod fillets", "haddock", "mackerel", "sardine", "sardines",
  "trout", "herring", "prawn", "prawns", "shrimp", "crab", "lobster",
  "mussel", "mussels",
  "tofu", "tempeh",
  // Plain dairy
  "milk", "butter", "cream",
  "plain yogurt", "plain yoghurt", "natural yogurt", "natural yoghurt",
  "greek yogurt", "greek yoghurt", "greek-style yogurt", "greek-style yoghurt",
  "cottage cheese", "ricotta", "mozzarella", "feta",
  // Herbs / spices (whole or dried)
  "ginger", "turmeric", "cinnamon", "cumin", "coriander", "paprika",
  "black pepper", "pepper", "sea salt", "salt", "thyme", "rosemary",
  "basil", "oregano", "parsley", "dill", "mint", "chilli", "chili",
  "cayenne", "cardamom", "clove", "cloves", "nutmeg",
  "bay leaf", "bay leaves", "star anise", "saffron", "sumac",
  // Oils (unrefined)
  "olive oil", "extra virgin olive oil", "coconut oil",
  // Natural sweeteners
  "honey", "maple syrup",
]);

// Qualifiers that may precede or follow a core term without disqualifying it.
// NOTE: "tinned" and "canned" are intentionally EXCLUDED here; canned items
// only reach 5 apples if their actual ingredient list is also clean.
const WHOLE_FOOD_QUALIFIER_PREFIXES = [
  "fresh", "frozen", "organic", "raw", "peeled", "chopped", "sliced",
  "diced", "whole", "dried", "plain", "washed", "baby", "new",
  "red", "green", "yellow", "white", "brown", "sweet", "large", "medium",
  "small", "boneless", "skinless", "free-range", "free range",
  "british", "english", "local", "seasonal", "extra virgin",
  "salted", "unsalted", "mixed", "ripe",
];

const WHOLE_FOOD_DISQUALIFIERS = [
  "ring", "rings", "chip", "chips", "crisp", "crisps", "nugget", "nuggets",
  "burger", "burgers", "powder", "extract", "concentrate", "sauce",
  "paste", "vinegar", "pickled", "smoked", "cured", "flavoured", "flavored",
  "coated", "battered", "breaded", "stuffed", "marinated",
  "instant", "microwave", "processed", "reformed",
  "bar", "cake", "cookie", "biscuit", "cracker", "bread", "roll", "wrap",
  "spread", "dip", "relish", "chutney", "ketchup", "mayo", "mayonnaise",
  "soup", "stew", "curry", "casserole", "pie", "tart",
  "artificial", "modified starch",
  "baked beans",  // compound override — baked beans ≠ plain beans
  "in sauce", "in brine with",
];

/**
 * Detects functional additives / processing agents in an ingredient list that
 * disqualify a product from the whole-food override, even if the product name
 * looks like a whole food.
 *
 * Allowed: the food itself + water (any form) + salt (any form).
 * Everything else is a contaminant for this purpose.
 */
const INGREDIENT_CONTAMINANT_PATTERNS: RegExp[] = [
  /\bsugar\b/i,
  /\bglucose\b/i,
  /\bfructose\b/i,
  /\bsyrup\b/i,
  /\bsweetener\b/i,
  /\bsaccharin\b/i,
  /\baspartame\b/i,
  /\bsucralose\b/i,
  /\bstevia\b/i,
  // Sauces / condiments
  /\bsauce\b/i,
  /\btomato\s+paste\b/i,
  /\bketchup\b/i,
  /\bvinegar\b/i,
  /\bmustard\b/i,
  // Flavourings
  /\bflavouring\b/i,
  /\bflavoring\b/i,
  /\bnatural\s+flavour\b/i,
  /\bnatural\s+flavor\b/i,
  /\bartificial\s+flavou?r\b/i,
  /\byeast\s+extract\b/i,
  // Acidity regulators
  /\bacidity\s+regulator\b/i,
  /\bcitric\s+acid\b/i,
  /\blactic\s+acid\b/i,
  /\bacetic\s+acid\b/i,
  /\bascorbic\s+acid\b/i,
  /\bmalic\s+acid\b/i,
  // Firming / preserving agents
  /\bfirming\s+agent\b/i,
  /\bcalcium\s+chloride\b/i,
  /\bpreservative\b/i,
  /\bsodium\s+benzoate\b/i,
  /\bpotassium\s+sorbate\b/i,
  /\bsorbate\b/i,
  /\bbenzoate\b/i,
  // Colours
  /\bcolou?r(ing)?\b/i,
  // Modified starches / UPF markers
  /\bmodified\s+starch\b/i,
  /\bmodified\s+maize\s+starch\b/i,
  /\bmaltodextrin\b/i,
  /\bdextrose\b/i,
  // Emulsifiers / stabilisers
  /\bemulsifier\b/i,
  /\bstabiliser\b/i,
  /\bstabilizer\b/i,
  /\bxanthan\b/i,
  /\bcarrageenan\b/i,
  /\bguar\s+gum\b/i,
  // Spice blends (suggest processed product, not plain)
  /\bspices\b/i,
  /\bseasonings?\b/i,
];

/**
 * Returns true if the ingredient list is clean enough to permit the whole-food
 * override. An empty / missing ingredients string is treated as clean (no info
 * to contradict the name-level check).
 *
 * "Clean" means: the only non-food ingredients are water and salt in any form.
 */
export function isCleanIngredientListForWholeFood(ingredientsText: string): boolean {
  if (!ingredientsText || ingredientsText.trim().length < 2) return true;
  return !INGREDIENT_CONTAMINANT_PATTERNS.some(rx => rx.test(ingredientsText));
}

export function isWholeFoodIngredient(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (!lower) return false;

  if (WHOLE_FOOD_DISQUALIFIERS.some(d => lower.includes(d))) return false;

  if (WHOLE_FOOD_CORE.has(lower)) return true;

  const qualifierRx = new RegExp(
    `^(${WHOLE_FOOD_QUALIFIER_PREFIXES.map(q => q.replace(/[-]/g, "[-]")).join("|")})\\s+`,
    "i",
  );
  const suffixRx = new RegExp(
    `\\s+(${WHOLE_FOOD_QUALIFIER_PREFIXES.map(q => q.replace(/[-]/g, "[-]")).join("|")})$`,
    "i",
  );

  const stripped = lower.replace(qualifierRx, "").trim();
  if (stripped !== lower && WHOLE_FOOD_CORE.has(stripped)) return true;

  const strippedSuffix = lower.replace(suffixRx, "").trim();
  if (strippedSuffix !== lower && WHOLE_FOOD_CORE.has(strippedSuffix)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Existing rating helpers
// ---------------------------------------------------------------------------

export interface SMPRatingInput {
  novaGroup: number;
  additiveMatches: AdditiveMatch[];
  ingredientsText: string;
  ingredientCount: number;
  productName: string;
  categoriesTags: string[];
}

export interface SMPRatingResult {
  score: number;
  smpRating: number;
  hasCape: boolean;
  isWholeFoodOverride: boolean;
  isOrganic: boolean;
  penalties: {
    nova: number;
    highRiskAdditives: number;
    emulsifiers: number;
    acidityRegulators: number;
    bovaerRisk: number;
  };
  bonuses: {
    organic: number;
    freeRange: number;
    grassFed: number;
    superfoods: number;
    simplicity: number;
  };
}

function isDairyOrMeat(productName: string, categoriesTags: string[]): boolean {
  const lowerName = productName.toLowerCase();
  const lowerCats = categoriesTags.map(c => c.toLowerCase()).join(" ");
  const combined = `${lowerName} ${lowerCats}`;
  return DAIRY_MEAT_KEYWORDS.some(kw => combined.includes(kw));
}

function isOrganic(productName: string, ingredientsText: string, categoriesTags: string[]): boolean {
  const combined = `${productName} ${ingredientsText} ${categoriesTags.join(" ")}`.toLowerCase();
  return ORGANIC_KEYWORDS.some(kw => combined.includes(kw));
}

function isFreeRange(productName: string, categoriesTags: string[]): boolean {
  const combined = `${productName} ${categoriesTags.join(" ")}`.toLowerCase();
  return FREE_RANGE_KEYWORDS.some(kw => combined.includes(kw));
}

function isGrassFed(productName: string, categoriesTags: string[]): boolean {
  const combined = `${productName} ${categoriesTags.join(" ")}`.toLowerCase();
  return GRASS_FED_KEYWORDS.some(kw => combined.includes(kw));
}

function countSuperfoods(ingredientsText: string): number {
  const lower = ingredientsText.toLowerCase();
  let count = 0;
  for (const sf of SUPERFOODS) {
    if (lower.includes(sf)) count++;
  }
  return count;
}

const ZERO_PENALTIES = { nova: 0, highRiskAdditives: 0, emulsifiers: 0, acidityRegulators: 0, bovaerRisk: 0 };
const ZERO_BONUSES = { organic: 0, freeRange: 0, grassFed: 0, superfoods: 0, simplicity: 0 };

export function calculateStrictSMPRating(input: SMPRatingInput): SMPRatingResult {
  const organic = isOrganic(input.productName, input.ingredientsText, input.categoriesTags);

  // ---------------------------------------------------------------------------
  // Whole-food override: plain whole foods always score 5 apples.
  //
  // Two-gate check:
  //   Gate 1 — name-level: product/ingredient name must be a recognised whole food.
  //   Gate 2 — ingredient-level: if an actual ingredient list is present, it must
  //            not contain functional additives (sugar, sauce, flavourings, acidity
  //            regulators, etc.). This prevents canned products with additives from
  //            being pulled up to 5 apples via the name check alone.
  // ---------------------------------------------------------------------------
  const nameToCheck = input.productName || input.ingredientsText;
  const nameIsWholeFood = isWholeFoodIngredient(nameToCheck)
    || (input.ingredientCount <= 1 && isWholeFoodIngredient(input.ingredientsText));

  if (nameIsWholeFood && isCleanIngredientListForWholeFood(input.ingredientsText)) {
    return {
      score: 100,
      smpRating: 5,
      hasCape: true,
      isWholeFoodOverride: true,
      isOrganic: organic,
      penalties: ZERO_PENALTIES,
      bonuses: { ...ZERO_BONUSES, simplicity: 20 },
    };
  }

  // ---------------------------------------------------------------------------
  // Standard scoring path
  // ---------------------------------------------------------------------------
  let score = 100;

  let novaPenalty = 0;
  if (input.novaGroup === 2) novaPenalty = 5;
  else if (input.novaGroup === 3) novaPenalty = 15;
  else if (input.novaGroup === 4) novaPenalty = 40;
  score -= novaPenalty;

  let highRiskCount = 0;
  let emulsifierCount = 0;
  let acidityRegulatorCount = 0;

  for (const match of input.additiveMatches) {
    if (match.additive.riskLevel === "high") highRiskCount++;
    const type = match.additive.type.toLowerCase();
    if (type === "emulsifier") emulsifierCount++;
    if (type === "acidity regulator") acidityRegulatorCount++;
  }

  const highRiskPenalty = highRiskCount * 8;
  const emulsifierPenalty = emulsifierCount * 6;
  const acidityPenalty = acidityRegulatorCount * 13;
  score -= highRiskPenalty;
  score -= emulsifierPenalty;
  score -= acidityPenalty;

  const dairyMeat = isDairyOrMeat(input.productName, input.categoriesTags);
  const freeRange = !organic && isFreeRange(input.productName, input.categoriesTags);
  const grassFed = !organic && isGrassFed(input.productName, input.categoriesTags);

  let bovaerPenalty = 0;
  if (dairyMeat && !organic && !freeRange && !grassFed) {
    bovaerPenalty = 10;
    score -= bovaerPenalty;
  }

  let organicBonus = 0;
  if (organic) {
    organicBonus = 15;
    score += organicBonus;
  }

  let grassFedBonus = 0;
  if (grassFed) {
    grassFedBonus = 13;
    score += grassFedBonus;
  }

  let freeRangeBonus = 0;
  if (freeRange) {
    freeRangeBonus = 8;
    score += freeRangeBonus;
  }

  const superfoodCount = countSuperfoods(input.ingredientsText);
  const superfoodBonusPerItem = input.novaGroup <= 1 ? 5 : 2;
  const superfoodBonus = superfoodCount * superfoodBonusPerItem;
  score += superfoodBonus;

  let simplicityBonus = 0;
  const totalAdditiveCount = input.additiveMatches.length;
  if (input.novaGroup <= 1 && input.ingredientCount <= 3 && totalAdditiveCount === 0) {
    simplicityBonus = 20;
    score += simplicityBonus;
  }

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  if (input.novaGroup === 4 && score > 55) score = 55;

  let smpRating: number;
  if (score >= 90) smpRating = 5;
  else if (score >= 75) smpRating = 4;
  else if (score >= 55) smpRating = 3;
  else if (score >= 35) smpRating = 2;
  else smpRating = 1;

  const hasCape = score >= 90 && totalAdditiveCount === 0 && (organic || superfoodCount > 0 || input.novaGroup === 1);

  return {
    score,
    smpRating,
    hasCape,
    isWholeFoodOverride: false,
    isOrganic: organic,
    penalties: {
      nova: novaPenalty,
      highRiskAdditives: highRiskPenalty,
      emulsifiers: emulsifierPenalty,
      acidityRegulators: acidityPenalty,
      bovaerRisk: bovaerPenalty,
    },
    bonuses: {
      organic: organicBonus,
      freeRange: freeRangeBonus,
      grassFed: grassFedBonus,
      superfoods: superfoodBonus,
      simplicity: simplicityBonus,
    },
  };
}
