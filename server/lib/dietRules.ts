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
  "fish", "salmon", "tuna", "cod", "haddock", "halibut", "sea bass", "trout",
  "mackerel", "sardine", "sardines", "anchovy", "anchovies", "prawn", "prawns",
  "shrimp", "lobster", "crab", "oyster", "oysters", "mussel", "mussels",
  "clam", "clams", "scallop", "scallops", "squid", "octopus", "crayfish",
  "langoustine", "langoustines", "monkfish", "tilapia", "pollock", "plaice",
  "seabream", "sea bream", "smoked salmon", "caviar",
];

const HIGH_CARB_KEYWORDS = [
  "bread", "pasta", "rice", "noodle", "noodles", "potato", "potatoes",
  "flour", "sugar", "oats", "oat", "cereal", "corn", "wheat", "couscous",
  "barley", "rye", "tortilla", "pita", "pitta", "cracker", "crackers",
];

const KETO_EXCLUDE = [
  ...HIGH_CARB_KEYWORDS,
  "beans", "lentils", "legumes", "chickpeas", "hummus", "honey",
  "maple syrup", "agave", "fruit juice", "banana", "grape", "mango",
];

const LOW_CARB_EXCLUDE = [
  "bread", "pasta", "white rice", "noodles", "flour", "sugar",
  "oats", "cereal", "tortilla", "pita", "pitta",
];

const PALEO_EXCLUDE = [
  ...HIGH_CARB_KEYWORDS,
  "milk", "cream", "butter", "cheese", "yogurt", "yoghurt",
  "beans", "lentils", "chickpeas", "hummus", "peanut", "peanuts",
  "soy", "tofu", "edamame", "corn",
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function containsAny(text: string, keywords: string[]): boolean {
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`).test(text)) return true;
  }
  return false;
}

function countMatches(text: string, keywords: string[]): number {
  let count = 0;
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`).test(text)) count++;
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
  { dietPattern, dietRestrictions }: DietContext
): boolean {
  const lower = text.toLowerCase();

  // ── Restriction-based hard filters (stack independently) ──────────────────
  if (dietRestrictions.includes("Gluten-Free") && containsAny(lower, GLUTEN_KEYWORDS)) {
    return true;
  }

  if (dietRestrictions.includes("Dairy-Free") && containsAny(lower, DAIRY_KEYWORDS)) {
    return true;
  }

  // ── Pattern-based hard filters ────────────────────────────────────────────
  if (!dietPattern) return false;

  switch (dietPattern) {
    case "Vegan":
      return (
        containsAny(lower, MEAT_KEYWORDS) ||
        containsAny(lower, FISH_SEAFOOD_KEYWORDS) ||
        containsAny(lower, DAIRY_KEYWORDS) ||
        containsAny(lower, ["egg", "eggs", "honey", "gelatin", "gelatine"])
      );

    case "Vegetarian":
      return (
        containsAny(lower, MEAT_KEYWORDS) ||
        containsAny(lower, FISH_SEAFOOD_KEYWORDS) ||
        containsAny(lower, ["gelatin", "gelatine", "lard", "suet", "rennet"])
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
export function scoreRecipeForDiet(text: string, dietPattern: string | null): number {
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
