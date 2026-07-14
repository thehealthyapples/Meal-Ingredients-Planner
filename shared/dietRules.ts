/**
 * dietRules.ts
 * ============
 * Reusable, side-effect-free helpers for diet-based recipe filtering and scoring.
 * Used by meal suggestion and recipe search routes (wired separately).
 *
 * ── Where the animal-food knowledge lives (SURF1B4) ──────────────────────────
 * NOT here. The Vegan and Vegetarian hard exclusions are resolved by the canonical
 * restriction library (`shared/restrictions/`), the governed owner of what meat,
 * fish, shellfish, dairy, eggs and honey ARE.
 *
 * Until SURF1B4 this file held its own MEAT_KEYWORDS and FISH_SEAFOOD_KEYWORDS,
 * written before the library existed. Two owners of one fact, and they had drifted:
 * the library knew `prosciutto`, `pancetta`, `gammon`, `mutton`, `gelatine`,
 * `bone broth` and `foie gras`; these lists did not. So a household whose diet
 * PATTERN was Vegan could be recommended a prosciutto dish, while a household who
 * declared the `meat` RESTRICTION could not — the same food, the same platform, two
 * answers. Those lists are **deleted**, not deprecated (Principle 8), and a test
 * scans this file and fails if a meat or fish keyword ever returns to it.
 *
 * What this file still owns, because the library does not and should not:
 *   · the diet PATTERN vocabulary (Vegan, Keto, Paleo, …) and its canonical spelling
 *   · the carbohydrate/grain/legume dictionaries of Keto, Low-Carb, Paleo, Carnivore
 *   · preference SCORING (boosts and penalties) — never a gate
 *   · the Gluten-Free and Dairy-Free restriction filters it has always applied
 *
 * ── Text versus items ────────────────────────────────────────────────────────
 * `shouldExcludeRecipe` accepts either a recipe's FIELDS or a single string.
 *
 * Prefer the fields. The canonical library's `excludedCompounds` ("vegan sausage",
 * "quorn", "meat-free") are whole-ITEM markers: they say *this thing is not meat*,
 * and they must be evaluated against one item at a time. Flatten a recipe into one
 * blob first and a jar of quorn in the cupboard vouches for the beef stock beside
 * it. Passing fields keeps every item's marker scoped to that item.
 *
 * A plain string is treated as ONE item. That is exactly right for a dish name or a
 * single food, and it is what the legacy callers pass.
 */

import {
  findRestrictionById,
  resolveIngredientRestrictions,
} from "./restrictions/restriction-resolver.js";
import type { RestrictionDefinition } from "./restrictions/restriction-types.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DietContext {
  dietPattern: string | null;
  dietRestrictions: string[];
}

/** A recipe's fields, each evaluated as its own item. Preferred over a blob. */
export interface RecipeFields {
  name?: string | null;
  ingredients?: string[] | null;
  category?: string | null;
  cuisine?: string | null;
  description?: string | null;
}

/** Either a recipe's fields, or a single string treated as one item. */
export type DietCheckable = string | RecipeFields;

/** The items a diet check runs over. A bare string is one item; fields are many. */
function toItems(input: DietCheckable): string[] {
  if (typeof input === "string") return input.trim() ? [input] : [];
  return [
    input.name ?? "",
    input.category ?? "",
    input.cuisine ?? "",
    input.description ?? "",
    ...(input.ingredients ?? []),
  ].filter((s): s is string => typeof s === "string" && s.trim().length > 0);
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

// ─── Vegan / Vegetarian — the canonical delegation (SURF1B4) ─────────────────
//
// The patterns are declared as the canonical restrictions they mean. Not as food.
// Every question of "is this meat?" is put to the library that owns the answer.
//
// Vegetarian excludes the flesh of animals. `meat` is the flesh of land animals and
// their by-products (gelatine, lard, suet, rennet, bone broth, stocks); `fish` and
// `shellfish` are, in law and in medicine, two separate things, and the library
// keeps them separate — which is what lets a Pescatarian exist at all.
const VEGETARIAN_RESTRICTION_IDS = ["meat", "fish", "shellfish"] as const;

// Vegan additionally excludes every other animal-derived food THA already governs.
// No new food knowledge is introduced here: each id names a definition that the
// canonical library already published and every declared restriction already uses.
const VEGAN_RESTRICTION_IDS = [
  ...VEGETARIAN_RESTRICTION_IDS,
  "dairy",
  "eggs",
  "honey",
] as const;

/**
 * Resolve pattern ids to canonical definitions, once, at module load.
 *
 * Throws if an id has no definition. That is deliberate and it is fail-closed: a
 * Vegan gate that silently drops `meat` because someone renamed a definition would
 * serve beef to a vegan household and report success. The platform must not boot.
 */
function definitionsFor(ids: readonly string[]): RestrictionDefinition[] {
  return ids.map((id) => {
    const definition = findRestrictionById(id);
    if (!definition) {
      throw new Error(
        `[dietRules] The canonical restriction "${id}" has no definition. The Vegan ` +
          `and Vegetarian hard exclusions resolve through the restriction library and ` +
          `cannot be enforced without it. Refusing to start rather than fail open.`,
      );
    }
    return definition;
  });
}

const VEGETARIAN_DEFINITIONS = definitionsFor(VEGETARIAN_RESTRICTION_IDS);
const VEGAN_DEFINITIONS = definitionsFor(VEGAN_RESTRICTION_IDS);

/**
 * True when any item conflicts with any of the given canonical restrictions.
 *
 * Per ITEM, never over a joined blob — see the header. This function contains no
 * food term, and it is the only path by which a diet pattern excludes an animal
 * food. Aliases match whole-word, derived and hidden ingredients match as
 * substrings, and a plant-based analogue ("vegan sausage", "oat milk", "quorn")
 * exits its definition through `excludedCompounds` before any of that runs.
 */
function conflictsWithCanonical(
  items: string[],
  definitions: RestrictionDefinition[],
): boolean {
  return items.some(
    (item) => resolveIngredientRestrictions(item, definitions).length > 0,
  );
}

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
// Scope: the Dairy-Free restriction filter only. The Vegan pattern no longer needs
// it — since SURF1B4 that path resolves through the canonical restriction library,
// whose `dairy` definition carries the same plant milks as `excludedCompounds` and
// far more besides. Not applied to Paleo, where all milks (including coconut) are
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
 *
 * Pass the recipe's FIELDS (`{ name, ingredients, category, cuisine, description }`).
 * A string is accepted and treated as a single item — correct for a dish name or one
 * food, and what the legacy callers pass. See the header for why the distinction
 * matters to the Vegan and Vegetarian gates.
 *
 * Hard exclusion only. Preference scoring lives in `scoreRecipeForDiet` and the two
 * never mix: nothing here nudges a rank, and nothing there refuses a meal.
 */
export function shouldExcludeRecipe(
  input: DietCheckable,
  { dietPattern: rawDietPattern, dietRestrictions }: DietContext
): boolean {
  const items = toItems(input);
  const lower = items.join(" ").toLowerCase();
  // Case-normalise before the switch — a lower-cased "vegan" row must not fall
  // through to `default: return false` and hand a vegan household a beef stew.
  const dietPattern = canonicaliseDietPattern(rawDietPattern);

  // ── Restriction-based hard filters (stack independently) ──────────────────
  // These are the two restrictions dietRules has always implemented. They are NOT
  // the platform's restriction enforcement — the canonical library is, via
  // `candidateHardExcluded()`, and it implements all thirteen. These remain because
  // removing a filter is a permissive change, and every filter here must move in the
  // restrictive direction or not at all.
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
    // Vegan and Vegetarian own no food vocabulary of their own. They name the
    // canonical restrictions they mean, and the library that owns those restrictions
    // answers. Plant milks, vegan sausages, meat-free products and kidney beans are
    // admitted by the library's excludedCompounds — not by a whitelist kept here.
    case "Vegan":
      return conflictsWithCanonical(items, VEGAN_DEFINITIONS);

    case "Vegetarian":
      return conflictsWithCanonical(items, VEGETARIAN_DEFINITIONS);

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
 *
 * PREFERENCE ONLY. A score never excludes a meal and an exclusion never adjusts a
 * score; `shouldExcludeRecipe` has already run and has already refused anything that
 * must be refused. The word lists below are ranking signals, not dietary knowledge,
 * which is why they are still allowed to say "beef" in a file forbidden to define it.
 */
export function scoreRecipeForDiet(
  input: DietCheckable,
  rawDietPattern: string | null,
): number {
  const dietPattern = canonicaliseDietPattern(rawDietPattern);
  if (!dietPattern) return 0;

  const lower = toItems(input).join(" ").toLowerCase();

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
