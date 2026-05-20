/**
 * Shared measurement units used for web recipe ingredient-line detection.
 *
 * This constant is scoped to web-import detection only — it is NOT a global
 * unit registry or canonical unit source for the rest of the application.
 *
 * Used by:
 *   - server/lib/auto-import-service.ts  (auto-import scraping)
 *   - server/routes.ts  api.import.recipe.path  (import recipe route)
 *   - server/routes.ts  /api/preview-recipe      (preview recipe route)
 */
export const RECIPE_IMPORT_MEASUREMENTS = [
  "g", "kg", "ml", "l",
  "cup", "cups",
  "tsp", "tbsp", "teaspoon", "tablespoon",
  "pound", "lb", "oz", "ounce",
  "pinch", "dash",
  "clove", "cloves",
  "slice", "slices",
  "piece", "pieces",
  "jar", "jars",
  "bottle", "bottles",
  "tub", "tubs",
  "sachet", "sachets",
  "carton", "cartons",
  "bunch", "bunches",
] as const;

/**
 * Pre-built regex derived from RECIPE_IMPORT_MEASUREMENTS.
 * Matches a leading quantity followed by a known measurement unit.
 * Case-insensitive. No global flag — safe to reuse across calls.
 */
export const RECIPE_IMPORT_MEASUREMENT_REGEX = new RegExp(
  `\\d+\\s*(${RECIPE_IMPORT_MEASUREMENTS.join("|")})`,
  "i",
);
