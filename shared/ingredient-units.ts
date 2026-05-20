/**
 * Parser-recognition unit constants for shared ingredient parsing.
 *
 * Scope: token recognition in ingredient strings only.
 * NOT a global unit registry. Does NOT include conversion factors,
 * shopping semantics, UI dropdown options, or nutrition data.
 *
 * Used by:
 *   - shared/parse-ingredient.ts  (shared ingredient parser)
 *
 * Do NOT merge with:
 *   - COMMON_UNITS         (UI dropdown — client/src/components/ingredient-input.tsx)
 *   - COUNTABLE_WORDS      (shopping aggregation — server/lib/ingredient-utils.ts)
 *   - UNIT_CONVERSIONS     (conversion factors — server/lib/ingredient-utils.ts)
 *   - RECIPE_IMPORT_MEASUREMENTS  (web-import detection — server/lib/recipe-import-units.ts)
 */

/**
 * Ordered regex alternation fragments for recognised unit tokens.
 * Order is significant: regex alternation is tried left-to-right.
 * Longer/more-specific alternatives must precede shorter overlapping ones
 * (e.g. "tablespoons?" before "tbsps?", "ounces?" before "oz").
 */
export const INGREDIENT_QUANTITY_UNIT_ALTERNATIVES = [
  // Volume — word forms before abbreviations
  "cups?",
  "tbsps?",
  "tablespoons?",
  "tsps?",
  "teaspoons?",
  // Weight / volume abbreviations
  "oz",
  "ounces?",
  "lbs?",
  "pounds?",
  "grams?",
  "g",
  "kg",
  "ml",
  "liters?",
  "litres?",
  // Countable containers / portion descriptors
  "cloves?",
  "slices?",
  "pieces?",
  "pinch(?:es)?",
  "bunch(?:es)?",
  "sprigs?",
  "stalks?",
  "cans?",
  "packets?",
  "jars?",
  "bottles?",
  "tubs?",
  "sachets?",
  "cartons?",
  "heads?",
  "handfuls?",
  "dash(?:es)?",
] as const;

/**
 * Regex alternation string derived from INGREDIENT_QUANTITY_UNIT_ALTERNATIVES.
 * Suitable for direct embedding inside a RegExp constructor.
 *
 * Example usage:
 *   new RegExp(`^(\\d+)\\s*(${INGREDIENT_QUANTITY_UNIT_PATTERN})\\s+(.+)`, "i")
 */
export const INGREDIENT_QUANTITY_UNIT_PATTERN =
  INGREDIENT_QUANTITY_UNIT_ALTERNATIVES.join("|");
