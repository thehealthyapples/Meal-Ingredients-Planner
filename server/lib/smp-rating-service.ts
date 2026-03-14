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
  "sweet potato", "sweet potatoes", "tomato", "tomatoes", "spinach",
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
  // Pulses / tinned (minimally processed)
  "tinned beans", "tinned chickpeas", "tinned lentils", "tinned tomatoes",
  "canned beans", "canned chickpeas", "canned lentils", "canned tomatoes",
  "dried beans", "dried chickpeas", "dried lentils",
  // Natural sweeteners
  "honey", "maple syrup",
]);

const WHOLE_FOOD_QUALIFIER_PREFIXES = [
  "fresh", "frozen", "organic", "raw", "peeled", "chopped", "sliced",
  "diced", "whole", "dried", "plain", "washed", "baby", "new",
  "red", "green", "yellow", "white", "brown", "sweet", "large", "medium",
  "small", "boneless", "skinless", "free-range", "free range",
  "british", "english", "local", "seasonal", "extra virgin",
  "salted", "unsalted", "tinned", "canned", "mixed", "ripe",
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
];

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
  // Check productName first, then fall back to ingredientsText (single ingredient).
  // ---------------------------------------------------------------------------
  const nameToCheck = input.productName || input.ingredientsText;
  if (isWholeFoodIngredient(nameToCheck) || (input.ingredientCount <= 1 && isWholeFoodIngredient(input.ingredientsText))) {
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
