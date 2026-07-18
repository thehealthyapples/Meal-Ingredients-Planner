/**
 * ingredient-reuse.ts
 * ====================
 * Weekly ingredient reuse detection for Meal Enhancements.
 *
 * Identifies which enhancement suggestions are already in use elsewhere
 * in the current planner week, enabling "Already used this week" labels
 * and reuse-aware suggestion ranking.
 *
 * Normalisation pipeline:
 *   1. stripForMatch — strips quantities, units, and prep words
 *   2. resolveIngredientAlias — canonicalises variants (fresh basil → basil)
 *
 * Matching uses EXACT equality on the normalised key.
 * Substring matching is intentionally avoided — false positives on
 * user-facing labels are unacceptable.
 */

import { resolveIngredientAlias } from "@shared/ingredient-aliases";

// Same set as server/lib/uplift-persistence.ts normaliseIngredientForDedupe.
// Kept in sync manually — if that set changes, update here too.
const STRIP_WORDS = new Set([
  'fresh', 'dried', 'frozen', 'organic', 'chopped', 'sliced', 'diced',
  'minced', 'grated', 'shredded', 'whole', 'ground', 'crushed',
  'handful', 'pinch', 'splash', 'knob', 'drizzle',
  'a', 'an', 'the', 'of', 'some', 'extra',
]);

function stripForMatch(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, '')
    // NUT_VERIFY1 — the unit alternation had NO trailing word boundary, so a
    // number followed by a food beginning with a unit letter had that letter
    // eaten as the unit: "3 garlic cloves, crushed" matched "3 g" as *3 grams*
    // and reduced to "arlic", which is what the Nutrition room displayed.
    // `\b` inside the optional group means a unit, IF matched, must end at a
    // word boundary; "g" in "garlic" no longer qualifies, so only "3 " is
    // stripped. "200g garlic" and "1 clove garlic" are unaffected.
    .replace(/\d+(\.\d+)?\s*(?:(?:g|kg|ml|l|tsp|tbsp|cup|cups|oz|lb|lbs|clove|cloves)\b)?\s*/gi, '')
    .replace(/\b(tsp|tbsp|g|kg|ml|l|oz|lb|lbs|cup|cups|clove|cloves)\b/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 0 && !STRIP_WORDS.has(w))
    .join(' ')
    .trim();
}

/**
 * Normalises an ingredient string to a canonical key for reuse matching.
 * Strips quantities and prep words, then resolves known aliases.
 *
 * Examples:
 *   "fresh basil"            → "basil"
 *   "a handful of basil"     → "basil"
 *   "½ tsp turmeric"         → "turmeric"
 *   "baby spinach"           → "spinach"
 *   "extra virgin olive oil" → "olive oil"
 */
export function normaliseForReuse(ingredient: string): string {
  return resolveIngredientAlias(stripForMatch(ingredient));
}

/**
 * Builds a map from normalised ingredient key → list of meal names
 * that use that ingredient in the current planner week.
 *
 * Pass the full active-week meal list. The panel filters out its own
 * meal name at lookup time to avoid self-references.
 */
export function buildWeeklyReuseMap(
  meals: { name: string; ingredients: string[] }[],
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const meal of meals) {
    for (const raw of meal.ingredients) {
      const key = normaliseForReuse(raw);
      if (!key) continue;
      const existing = map.get(key) ?? [];
      if (!existing.includes(meal.name)) {
        map.set(key, [...existing, meal.name]);
      }
    }
  }
  return map;
}

/**
 * Returns a display string listing the meal names that use this ingredient,
 * excluding the current meal to avoid self-references.
 *
 * Returns null if the ingredient is not found in other meals this week.
 *
 * Examples:
 *   ["Pizza Night"]                            → "Pizza Night"
 *   ["Pizza Night", "Tomato Pasta"]            → "Pizza Night, Tomato Pasta"
 *   ["Pizza Night", "Tomato Pasta", "Risotto"] → "Pizza Night, Tomato Pasta and 1 more"
 */
export function getReuseLabel(
  ingredient: string,
  weeklyReuseMap: Map<string, string[]>,
  currentMealName: string,
): string | null {
  const key = normaliseForReuse(ingredient);
  const mealNames = weeklyReuseMap.get(key)?.filter(n => n !== currentMealName);
  if (!mealNames?.length) return null;
  if (mealNames.length === 1) return mealNames[0];
  if (mealNames.length === 2) return `${mealNames[0]}, ${mealNames[1]}`;
  return `${mealNames[0]}, ${mealNames[1]} and ${mealNames.length - 2} more`;
}
