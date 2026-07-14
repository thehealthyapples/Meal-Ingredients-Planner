/**
 * dietRules.ts
 * ============
 * Reusable, side-effect-free helpers for diet-based recipe filtering and scoring.
 * Used by meal suggestion and recipe search routes (wired separately).
 *
 * All matching is case-insensitive and operates on a single pre-lowercased text
 * blob (recipe name + ingredients + description concatenated by the caller).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DietContext {
  dietPattern: string | null;
  dietRestrictions: string[];
}

// ─── Canonical diet-pattern vocabulary ───────────────────────────────────────

/**
 * The canonical spelling of every diet pattern this engine implements. This is the
 * vocabulary the switch statements below are written against — it is not new
 * knowledge, it is the existing knowledge, named.
 */
export const DIET_PATTERNS = [
  "Vegan", "Vegetarian", "Keto", "Low-Carb", "Paleo", "Carnivore",
  "Mediterranean", "DASH", "MIND", "Flexitarian",
] as const;

const DIET_PATTERN_BY_LOWER = new Map<string, string>(
  DIET_PATTERNS.map(p => [p.toLowerCase(), p]),
);

/**
 * Map a stored diet pattern onto its canonical spelling, case-insensitively.
 *
 * `shouldExcludeRecipe` switches on exact strings ("Vegan"), and the database holds
 * six rows written in lower case ("vegan", "vegetarian", "mediterranean") by an
 * older write path. Those rows fell through to `default: return false` — so four
 * households who declared themselves vegan or vegetarian received NO hard exclusion
 * whatsoever, and could be recommended beef (SURF1B).
 *
 * Normalising here, at the engine's own door, fixes every caller at once — recipe
 * search, Smart Suggest, the planner gate, the Companion, and the client — rather
 * than asking each of them to remember. An unrecognised pattern is returned
 * unchanged, so the `default` branch still governs genuinely unknown values.
 */
export function canonicaliseDietPattern(pattern: string | null | undefined): string | null {
  if (!pattern) return null;
  return DIET_PATTERN_BY_LOWER.get(pattern.trim().toLowerCase()) ?? pattern;
}

// ─── Keyword Sets ────────────────────────────────────────────────────────────

const GLUTEN_KEYWORDS = [
  "wheat", "flour", "bread", "breadcrumb", "breadcrumbs", "pasta", "noodle", "noodles",
  "couscous", "barley", "rye", "spelt", "bulgur", "bulgur wheat", "semolina",
  "seitan", "gluten", "tortilla", "pita", "pitta", "crouton", "croutons",
  "soy sauce", "teriyaki", "hoisin", "panko",
];

const DAIRY_KEYWORDS = [
  "milk", "cream", "butter", "cheese", "yogurt", "yoghurt", "parmesan", "mozzarella",
  "cheddar", "brie", "camembert", "ricotta", "mascarpone", "gouda", "feta",
  "gruyere", "gruyère", "stilton", "halloumi", "paneer", "ghee", "whey",
  "casein", "lactose", "kefir", "creme fraiche", "crème fraîche", "sour cream",
  "double cream", "single cream", "clotted cream", "ice cream", "custard",
];

const MEAT_KEYWORDS = [
  "chicken", "beef", "pork", "lamb", "turkey", "duck", "veal", "venison",
  "bacon", "ham", "salami", "chorizo", "pepperoni", "sausage", "sausages",
  "mince", "meatball", "meatballs", "steak", "brisket", "rib", "ribs",
  "lard", "suet", "rabbit", "pheasant", "partridge", "goose", "quail",
];

const FISH_SEAFOOD_KEYWORDS = [
  "fish", "seafood",
  "salmon", "tuna", "cod", "haddock", "halibut", "sea bass", "trout",
  "mackerel", "sardine", "sardines", "anchovy", "anchovies", "prawn", "prawns",
  "shrimp", "lobster", "crab", "oyster", "oysters", "mussel", "mussels",
  "clam", "clams", "scallop", "scallops", "squid", "octopus", "crayfish",
  "langoustine", "langoustines", "monkfish", "tilapia", "pollock", "plaice",
  "seabream", "sea bream", "smoked salmon", "caviar",
];

// Dish names that imply non-vegan or non-vegetarian content even when no
// ingredient list is available (title-only external candidates). Applied as an
// extra check under Vegan and Vegetarian so obvious non-compliant recipe names
// are blocked before scoring rather than slipping through as ingredient-less
// unknowns. "ragu" also catches "ragù" via diacritic normalisation.
const DISH_NAME_MEAT_OR_SEAFOOD = [
  "carbonara",  // implies bacon/pancetta + eggs + parmesan
  "ragu",       // Italian meat sauce (normalisation catches ragù)
  "bolognese",  // implies ground beef/pork
  "birria",     // implies braised beef or goat
  "ossobuco",   // implies braised veal shank
];

// ─── Keto / Low-Carb Exclusion Dictionary ────────────────────────────────────
// Organised by food category. Both KETO_EXCLUDE and LOW_CARB_EXCLUDE are built
// from these lists so changes stay in sync.

// 1. Sugars and sweeteners
const DICT_SUGARS = [
  "sugar", "brown sugar", "cane sugar", "icing sugar", "powdered sugar",
  "honey", "maple syrup", "agave", "molasses", "caramel",
  "corn syrup", "glucose syrup",
];

// 2. Breads and bakery products
const DICT_BAKERY = [
  "bread", "sandwich bread", "sourdough", "bagel", "muffin",
  "doughnut", "crumpet", "english muffin", "pancake", "waffle", "croissant",
];

// 3. Doughs and pastry (composite carb ingredients — catches "pizza dough", etc.)
const DICT_DOUGHS = [
  "dough", "pizza dough", "pizza base", "pastry", "puff pastry",
  "shortcrust pastry", "filo pastry", "phyllo pastry", "pie crust",
];

// 4. Grain products
const DICT_GRAINS = [
  "wheat", "flour", "rice", "pasta", "noodle", "noodles",
  "couscous", "bulgur", "barley", "oats", "oat", "oatmeal",
  "quinoa", "polenta", "cornmeal", "corn", "cereal", "granola", "muesli",
  "rye", "spelt", "semolina",
];

// 5. Snack carbohydrates
const DICT_SNACK_CARBS = [
  "cracker", "crackers", "pretzel", "pretzels", "popcorn",
  "tortilla chips", "corn chips", "breadcrumbs", "breadcrumb", "panko",
];

// 6. Starchy vegetables
const DICT_STARCHY_VEG = [
  "potato", "potatoes", "sweet potato", "sweet potatoes", "yam", "cassava", "parsnip",
];

// 7. Legumes and beans
const DICT_LEGUMES = [
  "beans", "lentils", "legumes", "chickpeas", "hummus",
  "kidney beans", "black beans", "pinto beans", "split peas",
  "navy beans", "cannellini beans", "lima beans",
];

// 8. High-sugar fruits
const DICT_HIGH_SUGAR_FRUITS = [
  "banana", "grape", "grapes", "raisin", "raisins",
  "dates", "mango", "pineapple", "fruit juice",
];

// 9. Sweetened sauces
const DICT_SWEETENED_SAUCES = [
  "ketchup", "barbecue sauce", "bbq sauce", "teriyaki sauce",
  "sweet chilli sauce", "sweet chili sauce", "hoisin sauce", "sweet and sour sauce",
];

// 10. Composite wrappers and carb-based products
// Bare "wrap"/"wraps" intentionally omitted — "tortilla" already catches flour
// wraps and bare "wrap" would create false positives on keto-friendly lettuce wrap dishes.
const DICT_WRAPPERS = [
  "tortilla", "tortillas", "pita", "pitta",
  "dumpling wrapper", "wonton wrapper", "gyoza wrapper", "spring roll wrapper",
];

const KETO_EXCLUDE = [
  ...DICT_SUGARS,
  ...DICT_BAKERY,
  ...DICT_DOUGHS,
  ...DICT_GRAINS,
  ...DICT_SNACK_CARBS,
  ...DICT_STARCHY_VEG,
  ...DICT_LEGUMES,
  ...DICT_HIGH_SUGAR_FRUITS,
  ...DICT_SWEETENED_SAUCES,
  ...DICT_WRAPPERS,
];

// Low-Carb shares Keto's exclusion boundary for Smart Planner recommendations.
const LOW_CARB_EXCLUDE = [...KETO_EXCLUDE];

// Paleo excludes grains, dairy, legumes — but NOT sweet potato (a Paleo staple).
// "potato"/"potatoes" are intentionally omitted to avoid incorrectly catching "sweet potato".
const PALEO_EXCLUDE = [
  "bread", "pasta", "rice", "noodle", "noodles", "flour",
  "oats", "oat", "cereal", "corn", "wheat", "couscous",
  "barley", "rye", "tortilla", "pita", "pitta",
  "panko", "cracker", "crackers",
  "milk", "cream", "butter", "cheese", "yogurt", "yoghurt",
  "beans", "lentils", "chickpeas", "hummus", "peanut", "peanuts",
  "soy", "tofu", "edamame",
];

const CARNIVORE_PLANT_KEYWORDS = [
  "vegetable", "vegetables", "fruit", "fruits", "nuts", "seeds",
  "bread", "pasta", "rice", "oats", "wheat", "flour", "sugar",
  "beans", "lentils", "legumes", "chickpeas", "hummus",
  "tofu", "tempeh", "soy", "plant", "salad", "lettuce", "spinach",
  "kale", "broccoli", "carrot", "onion", "garlic", "tomato",
  "potato", "potatoes", "mushroom", "mushrooms", "aubergine", "courgette",
  "pepper", "peppers", "celery", "cucumber", "avocado",
];

// Words used for Mediterranean / DASH / MIND / Flexitarian scoring

const MEDITERRANEAN_BOOST = [
  "olive oil", "fish", "salmon", "sardine", "anchovy", "tuna",
  "vegetable", "tomato", "garlic", "lemon", "herb", "herbs",
  "legume", "legumes", "beans", "lentils", "chickpeas",
  "whole grain", "wholegrain", "feta", "yogurt", "yoghurt",
  "aubergine", "courgette", "spinach", "pepper", "olives",
];

const DASH_BOOST = [
  "vegetable", "vegetables", "fruit", "fruits", "whole grain", "wholegrain",
  "low-fat", "low fat", "lean", "chicken breast", "turkey", "fish",
  "potassium", "beans", "lentils", "nuts", "seeds",
];

const DASH_PENALTY = [
  "salt", "sodium", "soy sauce", "bacon", "ham", "salami",
  "pepperoni", "processed", "canned", "tinned",
];

const MIND_BOOST = [
  "leafy green", "spinach", "kale", "collard", "lettuce", "arugula",
  "berries", "blueberry", "blueberries", "strawberry", "strawberries",
  "nuts", "olive oil", "fish", "salmon", "sardine", "beans", "lentils",
  "whole grain", "wholegrain", "poultry", "chicken", "turkey",
];

const MIND_PENALTY = [
  "butter", "margarine", "cheese", "red meat", "steak", "beef",
  "pork", "lamb", "sweets", "sweet", "fried", "fry", "pastry",
  "cake", "biscuit", "cookie", "fast food",
];

const FLEXITARIAN_BOOST = [
  "vegetable", "vegetables", "beans", "lentils", "legumes",
  "tofu", "tempeh", "chickpeas", "plant", "nut", "nuts",
  "seed", "seeds", "mushroom", "mushrooms",
];

const FLEXITARIAN_PENALTY = [
  "red meat", "beef", "lamb", "pork", "steak", "brisket", "mince",
];

// ─── Plant-milk whitelist ─────────────────────────────────────────────────────
// Plant-based milk alternatives are vegan and dairy-free by definition.
// The standalone word "milk" they contain would otherwise match DAIRY_KEYWORDS
// via the word-boundary regex. These compound phrases are stripped from the text
// before dairy keyword scanning so the residual "milk" does not false-positive.
//
// Scope: applied only when checking dairy compliance (Vegan case, Dairy-Free
// restriction). Not applied to Paleo, where all milks (including coconut) are
// excluded by that diet's own rules.
const PLANT_MILK_PHRASES = [
  "almond milk", "oat milk", "soy milk", "soya milk", "coconut milk",
  "plant milk", "plant-based milk", "rice milk", "hemp milk", "cashew milk",
  "hazelnut milk", "pea milk", "macadamia milk", "oat mylk",
  // Plant creams — contain "cream" keyword but are dairy-free by definition
  "coconut cream", "oat cream", "soya cream", "soy cream",
  "almond cream", "cashew cream", "rice cream",
];

// Replaces all PLANT_MILK_PHRASES with a space so surrounding keyword boundaries
// are preserved for other checks. "coconut milk" → "coconut " (not "coconutmilk").
function removePlantMilkPhrases(text: string): string {
  let result = text;
  for (const phrase of PLANT_MILK_PHRASES) {
    result = result.split(phrase).join(" ");
  }
  return result;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Strips diacritical marks so keywords match regardless of accent variant.
// "ragù" → "ragu", "crème fraîche" → "creme fraiche", etc.
// Applied to both the search text and each keyword so both sides normalise
// consistently — no separate accent-stripped duplicate entries are required.
function normalizeForSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function containsAny(text: string, keywords: string[]): boolean {
  const normText = normalizeForSearch(text);
  for (const kw of keywords) {
    const normKw = normalizeForSearch(kw);
    const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`).test(normText)) return true;
  }
  return false;
}

function countMatches(text: string, keywords: string[]): number {
  const normText = normalizeForSearch(text);
  let count = 0;
  for (const kw of keywords) {
    const normKw = normalizeForSearch(kw);
    const escaped = normKw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`).test(normText)) count++;
  }
  return count;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns `true` when a recipe should be excluded for the given diet context.
 * The `text` argument should be a lowercased concatenation of the recipe's
 * name, ingredient list, and any description.
 */
export function shouldExcludeRecipe(
  text: string,
  { dietPattern: rawDietPattern, dietRestrictions }: DietContext
): boolean {
  const lower = text.toLowerCase();
  // Case-normalise before the switch — a lower-cased "vegan" row must not fall
  // through to `default: return false` and hand a vegan household a beef stew.
  const dietPattern = canonicaliseDietPattern(rawDietPattern);

  // ── Restriction-based hard filters (stack independently) ──────────────────
  if (dietRestrictions.includes("Gluten-Free") && containsAny(lower, GLUTEN_KEYWORDS)) {
    return true;
  }

  if (dietRestrictions.includes("Dairy-Free")) {
    // Strip plant-based milk phrases before dairy scan — almond/oat/soy/coconut
    // milk are dairy-free by definition and must not trigger this restriction.
    if (containsAny(removePlantMilkPhrases(lower), DAIRY_KEYWORDS)) return true;
  }

  // ── Pattern-based hard filters ────────────────────────────────────────────
  if (!dietPattern) return false;

  switch (dietPattern) {
    case "Vegan": {
      // Strip plant-based milk phrases before dairy scan — almond/oat/soy/coconut
      // milk are vegan by definition. The word "milk" they contain must not match
      // DAIRY_KEYWORDS. All other exclusion checks run on the unmodified text.
      const dairyCheckText = removePlantMilkPhrases(lower);
      return (
        containsAny(lower, MEAT_KEYWORDS) ||
        containsAny(lower, FISH_SEAFOOD_KEYWORDS) ||
        containsAny(dairyCheckText, DAIRY_KEYWORDS) ||
        containsAny(lower, ["egg", "eggs", "honey", "gelatin", "gelatine"]) ||
        containsAny(lower, DISH_NAME_MEAT_OR_SEAFOOD)
      );
    }

    case "Vegetarian":
      return (
        containsAny(lower, MEAT_KEYWORDS) ||
        containsAny(lower, FISH_SEAFOOD_KEYWORDS) ||
        containsAny(lower, ["gelatin", "gelatine", "lard", "suet", "rennet"]) ||
        containsAny(lower, DISH_NAME_MEAT_OR_SEAFOOD)
      );

    case "Keto":
      return containsAny(lower, KETO_EXCLUDE);

    case "Low-Carb":
      return containsAny(lower, LOW_CARB_EXCLUDE);

    case "Paleo":
      return containsAny(lower, PALEO_EXCLUDE);

    case "Carnivore":
      return containsAny(lower, CARNIVORE_PLANT_KEYWORDS);

    // Mediterranean, DASH, MIND, Flexitarian — no hard exclusions, only scoring
    default:
      return false;
  }
}

/**
 * Returns a numeric score delta (positive = boost, negative = penalty) for a
 * recipe based on how well it matches the diet pattern.
 * Caller adds this to the recipe's base score before ranking.
 * Returns 0 when dietPattern is null or has no scoring rules.
 */
export function scoreRecipeForDiet(text: string, rawDietPattern: string | null): number {
  const dietPattern = canonicaliseDietPattern(rawDietPattern);
  if (!dietPattern) return 0;

  const lower = text.toLowerCase();

  switch (dietPattern) {
    case "Mediterranean": {
      const boosts = countMatches(lower, MEDITERRANEAN_BOOST);
      return boosts * 2; // up to +20 for a well-matched recipe
    }

    case "DASH": {
      const boosts = countMatches(lower, DASH_BOOST);
      const penalties = countMatches(lower, DASH_PENALTY);
      return boosts * 2 - penalties * 3;
    }

    case "MIND": {
      const boosts = countMatches(lower, MIND_BOOST);
      const penalties = countMatches(lower, MIND_PENALTY);
      return boosts * 2 - penalties * 3;
    }

    case "Flexitarian": {
      const boosts = countMatches(lower, FLEXITARIAN_BOOST);
      const penalties = countMatches(lower, FLEXITARIAN_PENALTY);
      return boosts * 2 - penalties * 1; // small red-meat penalty
    }

    case "Keto": {
      // Boost high-fat / protein-dense signals
      const boosts = countMatches(lower, ["avocado", "cheese", "bacon", "egg", "eggs", "cream", "butter", "nuts", "seeds", "salmon", "beef", "chicken"]);
      return boosts * 2;
    }

    case "Low-Carb": {
      const boosts = countMatches(lower, ["vegetable", "vegetables", "protein", "chicken", "fish", "egg", "eggs", "nuts", "seeds"]);
      return boosts * 1;
    }

    case "Paleo": {
      const boosts = countMatches(lower, ["meat", "fish", "egg", "eggs", "vegetable", "vegetables", "fruit", "nuts", "seeds", "sweet potato"]);
      return boosts * 1;
    }

    case "Carnivore": {
      const boosts = countMatches(lower, ["beef", "steak", "lamb", "chicken", "pork", "bacon", "egg", "eggs", "salmon", "tuna", "butter"]);
      return boosts * 2;
    }

    case "Vegetarian":
    case "Vegan": {
      // Boost plant-forward signals
      const boosts = countMatches(lower, ["vegetable", "vegetables", "beans", "lentils", "chickpeas", "tofu", "tempeh", "nuts", "seeds", "whole grain", "wholegrain"]);
      return boosts * 1;
    }

    default:
      return 0;
  }
}
