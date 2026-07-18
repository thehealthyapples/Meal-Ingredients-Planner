/**
 * Parser-recognition descriptor constants for shared ingredient parsing.
 *
 * Scope: token recognition in ingredient strings only — the words a recipe
 * writer adds AROUND a food that describe its size, container, form or
 * preparation, and which are not part of the food's canonical identity.
 * NOT a taxonomy, NOT a synonym list, NOT a classification of any kind.
 *
 * Used by:
 *   - shared/parse-ingredient.ts        (trailing prep notes)
 *   - shared/canonical/resolver.ts      (leading descriptors, via ingredientKeyVariants)
 *
 * Do NOT merge with:
 *   - INGREDIENT_QUANTITY_UNIT_ALTERNATIVES  (units — shared/ingredient-units.ts)
 *   - INGREDIENT_ALIASES                     (identity — shared/ingredient-aliases.ts)
 *   - FOOD_SYNONYMS                          (identity — shared/food-synonyms.ts)
 *   - the canonical seed's varieties/aliases (identity — shared/canonical/)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY COLOURS ARE ABSENT, AND MUST STAY ABSENT
 *
 * A colour is not a descriptor in THA's canonical model — it is IDENTITY.
 * Measured against the live seed:
 *
 *     "red cabbage"  → canonical `red-cabbage`, diversity group `red-cabbage`
 *     "cabbage"      → canonical `cabbage`,     diversity group `cabbage`
 *     "black pepper" → canonical `black-pepper`, group `black-pepper`
 *     "pepper"       → canonical `pepper`,       group `pepper`
 *
 * Those are four different foods in two different pairs. A parser that peeled
 * "red" or "black" would silently convert one food into another and change the
 * plant a household is credited with. Colour words are therefore NOT descriptors
 * here and must never be added to these lists.
 *
 * The same protection is given structurally rather than by list membership: the
 * resolver tries the FAITHFUL key first (`ingredientKeyVariants`), so any
 * descriptor that does happen to begin a real canonical name — "dried lentils",
 * "ground cumin", "baby spinach", "tinned tomatoes", "rolled oats" — resolves at
 * full length and is never reduced. Peeling only ever happens after the fuller
 * key has already failed to match.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Size and count descriptors. None of these begins any canonical food name in
 * the seed (measured: `small` 0, `large` 0, `medium` 0), so they carry no
 * identity in any position.
 */
export const INGREDIENT_SIZE_DESCRIPTORS = [
  "small", "medium", "large", "extra", "mini", "baby", "jumbo", "thick", "thin",
] as const;

/**
 * Container and packaging descriptors — how the food was sold, never what it is.
 * Note "tin" (0 canonical names) is distinct from "tinned" (20, e.g. "tinned
 * tomatoes"); both are listed, and faithful-first protects the latter.
 */
export const INGREDIENT_CONTAINER_DESCRIPTORS = [
  "tin", "tinned", "can", "canned", "jar", "jarred", "packet", "pack", "box",
  "boxed", "bottle", "bottled", "carton", "bag", "bagged", "frozen", "tub",
] as const;

/**
 * Form and preparation descriptors — what was done to the food, not what it is.
 */
export const INGREDIENT_PREP_DESCRIPTORS = [
  "chopped", "diced", "minced", "sliced", "crushed", "grated", "shredded",
  "peeled", "trimmed", "halved", "quartered", "cubed", "torn", "rinsed",
  "drained", "washed", "deseeded", "seeded", "cored", "stoned", "pitted",
  "skinned", "boned", "boneless", "skinless", "cooked", "raw", "ripe",
  "fresh", "dried", "ground", "rolled", "whole", "lean", "wholegrain",
  "wholemeal", "finely", "coarsely", "roughly", "thinly", "freshly",
  "roasted", "toasted", "smoked", "unsalted", "salted", "sweetened",
  "unsweetened", "plain", "natural", "organic", "free-range", "mixed",
] as const;

/**
 * Every descriptor that may be peeled from the FRONT of an ingredient key,
 * one word at a time, and only after the fuller key has already failed to
 * resolve. Deliberately excludes colours (see the header).
 */
export const LEADING_INGREDIENT_DESCRIPTORS: ReadonlySet<string> = new Set<string>([
  ...INGREDIENT_SIZE_DESCRIPTORS,
  ...INGREDIENT_CONTAINER_DESCRIPTORS,
  ...INGREDIENT_PREP_DESCRIPTORS,
]);

/**
 * Trailing prep-note words, i.e. what may follow the comma in
 * "400g tin chickpeas, drained". A superset of the form/prep descriptors plus
 * the phrases that only ever appear trailing.
 *
 * Ordered longest-first where one is a prefix of another, because this feeds a
 * regex alternation and alternation is tried left to right.
 */
export const TRAILING_PREP_NOTE_WORDS: readonly string[] = [
  "to taste", "or to taste", "optional", "if using", "for garnish",
  "to serve", "to garnish", "plus extra", "or more",
  ...INGREDIENT_PREP_DESCRIPTORS,
];

/** Regex alternation fragment for the trailing prep-note words. */
export const TRAILING_PREP_NOTE_PATTERN = TRAILING_PREP_NOTE_WORDS
  .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
