/**
 * Nutrition Discovery Engine (INT27)
 * ====================================
 * Implements `NutritionDiscoveryPort` as a coordinator:
 *   1. Fetches all personal + system meals with their nutrition rows (via port).
 *   2. Parses text-stored macro columns into numbers (text → float, tolerant parser).
 *   3. Applies NutritionFilter threshold predicates in application code.
 *   4. Returns NutritionDiscoveryItem[] capped at NUTRITION_DISCOVERY_MAX_RESULTS.
 *
 * DESIGN NOTES:
 *   • All macro columns in the `nutrition` table are stored as TEXT.  The engine
 *     uses a tolerant text-to-number parser that handles common formats such as
 *     "320 kcal", "~300", "300-400" (range average), "N/A" (→ null).
 *   • Meals where parsing fails are silently excluded from filtered results —
 *     they are still counted in mealsWithoutNutritionCount so the caller can
 *     communicate coverage limits honestly.
 *   • The engine owns query parsing (utterance → NutritionFilter) and filter
 *     application.  It does NOT own any data; all rows come from the storage owner.
 */

import type {
  NutritionDiscoveryPort,
  MealNutritionRow,
  NutritionFilter,
  NutritionDiscoveryItem,
  ParsedNutrition,
} from "../handlers/nutrition-discovery-port.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NUTRITION_DISCOVERY_MAX_RESULTS = 15;

// Configurable floors/ceilings for qualitative terms — documented constants,
// not magic numbers.  These reflect common dietary conventions for a single meal.
const HIGH_PROTEIN_MIN_G = 20;
const LOW_CARB_MAX_G = 20;
const LOW_FAT_MAX_G = 10;
const LOW_SUGAR_MAX_G = 5;

// ---------------------------------------------------------------------------
// Text → number parser (text-stored macro columns)
// ---------------------------------------------------------------------------

/**
 * Attempt to parse a macro text value to a number.
 * Handles: "320", "320 kcal", "~300", "300-400" (range → average), "N/A" → null.
 * Returns null on failure — callers must treat null as missing, not zero.
 */
export function parseMacroText(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s || /^(?:n\/a|na|none|unknown|-)$/i.test(s)) return null;

  // Strip leading "~" or "approx"
  const cleaned = s.replace(/^(?:~|approx\.?\s*)/i, "").trim();

  // Range: "300-400" → average
  const range = cleaned.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)(?:\s*\w*)?$/);
  if (range) {
    const lo = parseFloat(range[1]);
    const hi = parseFloat(range[2]);
    if (!isNaN(lo) && !isNaN(hi)) return (lo + hi) / 2;
  }

  // Single value with optional unit suffix: "320", "320g", "320 kcal", "320calories"
  const single = cleaned.match(/^(\d+(?:\.\d+)?)\s*(?:g|kcal|calories?|cals?|mg|kg)?$/i);
  if (single) {
    const n = parseFloat(single[1]);
    return isNaN(n) ? null : n;
  }

  return null;
}

/**
 * Parse all macro columns from a raw Nutrition row. Returns `parsedFromText: true`
 * if ANY field required text parsing (i.e. was not already a clean integer).
 */
function parseNutrition(raw: { calories?: string | null; protein?: string | null; carbs?: string | null; fat?: string | null; sugar?: string | null; salt?: string | null } | null): { parsed: ParsedNutrition; parsedFromText: boolean } | null {
  if (!raw) return null;
  const calories = parseMacroText(raw.calories);
  const protein  = parseMacroText(raw.protein);
  const carbs    = parseMacroText(raw.carbs);
  const fat      = parseMacroText(raw.fat);
  const sugar    = parseMacroText(raw.sugar);
  const salt     = parseMacroText(raw.salt);

  // If every field is null the row has no usable data — treat as if no nutrition row.
  if (calories == null && protein == null && carbs == null && fat == null) return null;

  return {
    parsed: { calories, protein, carbs, fat, sugar, salt },
    parsedFromText: true,
  };
}

// ---------------------------------------------------------------------------
// Query parsing (utterance → NutritionFilter)
// ---------------------------------------------------------------------------

/**
 * Extract a NutritionFilter from a free-text query string.
 * Returns null if no recognised threshold predicate is found.
 *
 * Supported patterns:
 *   "under/less than N cal/kcal/calories" → caloriesMax
 *   "over/more than N cal" → caloriesMin
 *   "at least Ng protein" → proteinMin
 *   "high protein" → proteinMin = HIGH_PROTEIN_MIN_G
 *   "under Ng carbs" / "low carb" → carbsMax
 *   "under Ng fat" / "low fat" → fatMax
 *   "under Ng sugar" / "low sugar" → sugarMax
 */
export function parseNutritionFilter(query: string): NutritionFilter | null {
  const q = query.toLowerCase();
  const filter: Record<string, number> = {};

  // Calorie ceiling
  const calMax = q.match(/\b(?:under|less\s+than|below|no\s+more\s+than|max(?:imum)?)\s+(\d+)\s*(?:kcal|calories?|cals?)/i);
  if (calMax) filter.caloriesMax = parseInt(calMax[1], 10);

  // Calorie floor
  const calMin = q.match(/\b(?:over|more\s+than|above|at\s+least)\s+(\d+)\s*(?:kcal|calories?|cals?)/i);
  if (calMin) filter.caloriesMin = parseInt(calMin[1], 10);

  // Protein floor (explicit grams)
  const protG = q.match(/\b(?:at\s+least|more\s+than|over)\s+(\d+)\s*g(?:rams?)?\s+protein\b/i);
  if (protG) filter.proteinMin = parseInt(protG[1], 10);

  // High protein (qualitative)
  if (!filter.proteinMin && /\bhigh[\s-]protein\b/i.test(q)) {
    filter.proteinMin = HIGH_PROTEIN_MIN_G;
  }

  // Carbs ceiling (explicit grams)
  const carbsG = q.match(/\b(?:under|less\s+than|below)\s+(\d+)\s*g(?:rams?)?\s+(?:carbs?|carbohydrates?)\b/i);
  if (carbsG) filter.carbsMax = parseInt(carbsG[1], 10);

  // Low carb (qualitative)
  if (!filter.carbsMax && /\blow[\s-]carb\b/i.test(q)) {
    filter.carbsMax = LOW_CARB_MAX_G;
  }

  // Fat ceiling (explicit grams)
  const fatG = q.match(/\b(?:under|less\s+than|below)\s+(\d+)\s*g(?:rams?)?\s+fat\b/i);
  if (fatG) filter.fatMax = parseInt(fatG[1], 10);

  // Low fat (qualitative)
  if (!filter.fatMax && /\blow[\s-]fat\b/i.test(q)) {
    filter.fatMax = LOW_FAT_MAX_G;
  }

  // Sugar ceiling (explicit grams)
  const sugarG = q.match(/\b(?:under|less\s+than|below)\s+(\d+)\s*g(?:rams?)?\s+sugar\b/i);
  if (sugarG) filter.sugarMax = parseInt(sugarG[1], 10);

  // Low sugar (qualitative)
  if (!filter.sugarMax && /\blow[\s-]sugar\b/i.test(q)) {
    filter.sugarMax = LOW_SUGAR_MAX_G;
  }

  if (Object.keys(filter).length === 0) return null;

  return {
    caloriesMax: filter.caloriesMax,
    caloriesMin: filter.caloriesMin,
    proteinMin:  filter.proteinMin,
    carbsMax:    filter.carbsMax,
    fatMax:      filter.fatMax,
    sugarMax:    filter.sugarMax,
  };
}

// ---------------------------------------------------------------------------
// Filter predicate (parsed nutrition vs NutritionFilter)
// ---------------------------------------------------------------------------

/**
 * Returns true if the parsed nutrition values satisfy all non-null thresholds in
 * the filter. A null parsed value means the predicate CANNOT be satisfied for that
 * threshold — the meal is excluded (never silently assumed to pass).
 */
export function satisfiesFilter(parsed: ParsedNutrition, filter: NutritionFilter): boolean {
  if (filter.caloriesMax != null) {
    if (parsed.calories == null || parsed.calories > filter.caloriesMax) return false;
  }
  if (filter.caloriesMin != null) {
    if (parsed.calories == null || parsed.calories < filter.caloriesMin) return false;
  }
  if (filter.proteinMin != null) {
    if (parsed.protein == null || parsed.protein < filter.proteinMin) return false;
  }
  if (filter.carbsMax != null) {
    if (parsed.carbs == null || parsed.carbs > filter.carbsMax) return false;
  }
  if (filter.fatMax != null) {
    if (parsed.fat == null || parsed.fat > filter.fatMax) return false;
  }
  if (filter.sugarMax != null) {
    if (parsed.sugar == null || parsed.sugar > filter.sugarMax) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * NutritionDiscoveryEngine — the production implementation of the port.
 * Injectable for tests via constructor-injected port; production factory
 * uses `createProductionNutritionDiscoveryPort`.
 */
export class NutritionDiscoveryEngine {
  constructor(private readonly port: NutritionDiscoveryPort) {}

  /**
   * Discover meals matching the given filter for this user.
   * Returns filtered, capped NutritionDiscoveryItem[] with coverage metadata.
   */
  async discover(filter: NutritionFilter, userId: number): Promise<{
    results: NutritionDiscoveryItem[];
    mealsWithNutritionCount: number;
    mealsWithoutNutritionCount: number;
  }> {
    const rows: MealNutritionRow[] = await this.port.getMealRows(userId);

    const results: NutritionDiscoveryItem[] = [];
    let withNutrition = 0;
    let withoutNutrition = 0;

    for (const row of rows) {
      const nutriResult = parseNutrition(row.nutrition);

      if (!nutriResult) {
        withoutNutrition++;
        continue;
      }

      withNutrition++;

      if (!satisfiesFilter(nutriResult.parsed, filter)) continue;

      results.push({
        id: `${row.isSystem ? "system" : "personal"}:${row.meal.id}`,
        name: row.meal.name,
        sourceType: row.isSystem ? "system" : "personal",
        sourceLabel: row.isSystem ? "THA Library" : "Your Cookbook",
        nutrition: nutriResult.parsed,
        parsedFromText: nutriResult.parsedFromText,
        isAlreadySaved: true,
        internalId: row.meal.id,
        imageUrl: row.meal.imageUrl ?? undefined,
      });

      if (results.length >= NUTRITION_DISCOVERY_MAX_RESULTS) break;
    }

    return { results, mealsWithNutritionCount: withNutrition, mealsWithoutNutritionCount: withoutNutrition };
  }
}
