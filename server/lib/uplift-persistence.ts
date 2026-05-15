/**
 * uplift-persistence.ts
 * =====================
 * Pure business logic for accepted uplift persistence.
 * No DB calls here — only deterministic transformation functions.
 *
 * Architecture:
 * - User-owned meals: uplift ingredient added directly
 * - System meals: forked to user-private copy first, then modified
 * - Shopping flows naturally from updated meal.ingredients (no extra wiring)
 * - Every accepted suggestion recorded in meal_uplift_applications for provenance
 *
 * Recipe instruction augmentation is NOT implemented here.
 * Recommendation: when a user accepts "Add turmeric with spices", append a
 * cooking note such as "Add turmeric with the spice stage." using a future
 * instruction-augmentation pass — deterministic string templates, no AI.
 * That phase should read the suggestion.learnMoreSlug and quantity fields
 * already stored in each application row.
 */

// ─── Normalisation ────────────────────────────────────────────────────────────

const STRIP_WORDS = new Set([
  'fresh', 'dried', 'frozen', 'organic', 'chopped', 'sliced', 'diced',
  'minced', 'grated', 'shredded', 'whole', 'ground', 'crushed',
  'handful', 'pinch', 'splash', 'knob', 'drizzle',
  'a', 'an', 'the', 'of', 'some', 'extra',
]);

/**
 * Produces a normalised key for ingredient deduplication comparison.
 * Strips quantity words, adjectives, and common noise.
 */
export function normaliseIngredientForDedupe(ingredient: string): string {
  return ingredient
    .toLowerCase()
    // Strip unicode fractions and vulgar fraction characters
    .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, '')
    // Strip numeric quantities with optional unit
    .replace(/\d+(\.\d+)?\s*(g|kg|ml|l|tsp|tbsp|cup|cups|oz|lb|lbs|clove|cloves)?\s*/gi, '')
    // Strip bare unit words left behind after fraction/number removal
    .replace(/\b(tsp|tbsp|g|kg|ml|l|oz|lb|lbs|cup|cups|clove|cloves)\b/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 0 && !STRIP_WORDS.has(w))
    .join(' ')
    .trim();
}

/**
 * Returns true if `candidate` already exists (by normalised key) in the
 * ingredient list. Prevents duplicate appending.
 */
export function ingredientAlreadyPresent(
  existingIngredients: string[],
  candidate: string,
): boolean {
  const candidateKey = normaliseIngredientForDedupe(candidate);
  if (!candidateKey) return false;

  return existingIngredients.some(existing => {
    const existingKey = normaliseIngredientForDedupe(existing);
    // Full match or substring containment (e.g. "turmeric" in "ground turmeric")
    return (
      existingKey === candidateKey ||
      existingKey.includes(candidateKey) ||
      candidateKey.includes(existingKey)
    );
  });
}

// ─── Merge logic ──────────────────────────────────────────────────────────────

export interface MergeResult {
  merged: string[];
  added: string[];
  skipped: string[];
}

/**
 * Deterministically merges uplift ingredients into an existing ingredient list.
 * Each candidate is added only if it is not already present.
 * Returns which ingredients were actually added and which were skipped as dupes.
 */
export function mergeUpliftIngredients(
  existing: string[],
  candidates: string[],
): MergeResult {
  const merged = [...existing];
  const added: string[] = [];
  const skipped: string[] = [];

  for (const candidate of candidates) {
    if (ingredientAlreadyPresent(merged, candidate)) {
      skipped.push(candidate);
    } else {
      merged.push(candidate);
      added.push(candidate);
    }
  }

  return { merged, added, skipped };
}

// ─── Removal logic ────────────────────────────────────────────────────────────

export interface RemoveResult {
  ingredients: string[];
  removed: boolean;
}

/**
 * Removes a specific ingredient from the list by normalised key match.
 * Returns the updated list and whether the ingredient was actually found.
 */
export function removeUpliftIngredient(
  existing: string[],
  ingredientToRemove: string,
): RemoveResult {
  const removeKey = normaliseIngredientForDedupe(ingredientToRemove);
  let removed = false;

  const ingredients = existing.filter(ing => {
    const key = normaliseIngredientForDedupe(ing);
    const isMatch =
      key === removeKey ||
      key.includes(removeKey) ||
      removeKey.includes(key);
    if (isMatch) {
      removed = true;
      return false;
    }
    return true;
  });

  return { ingredients, removed };
}

// ─── System meal fork naming ───────────────────────────────────────────────────

/**
 * Produces a display name for a user's forked copy of a system meal.
 * The fork is transparent to the user — it's their meal now.
 */
export function buildForkName(originalName: string): string {
  return originalName;
}

// ─── Accepted suggestion shape ────────────────────────────────────────────────

export interface AcceptedSuggestion {
  ruleId: string;
  ruleName: string;
  ingredient: string;
  action: 'add' | 'swap' | 'boost';
  quantity?: string;
  explanation: string;
}

// ─── Persistence strategy recommendation ──────────────────────────────────────
//
// Where uplift additions should live — by meal type:
//
// USER-OWNED meal (isSystemMeal=false, userId=requester)
//   → Mutate meal.ingredients directly.
//   → Safe: user owns this meal.
//   → Reuse: uplift persists into all future planner uses of this meal.
//   → Templates: if this meal is in a template, the template will reflect the
//     uplift on next use. This is the intended behaviour — the user improved
//     their recipe.
//
// SYSTEM meal (isSystemMeal=true)
//   → Fork to user-private copy (userId=requester, isSystemMeal=false,
//     originalMealId=source.id) BEFORE mutation.
//   → Update plannerEntries.mealId to reference the fork.
//   → The global system meal is never touched.
//
// IMPORTED / EXTERNAL meal (mealSourceType='web', userId=requester)
//   → Same as user-owned — safe to mutate directly.
//
// COOKBOOK meal shared across household
//   → Currently all meals are per-user. Household sharing not yet implemented,
//     so direct mutation of user-owned meals is safe.
//
// COPIED meal (originalMealId set)
//   → Direct mutation safe — the copy is the user's own.
//
// Shopping integration:
//   → No changes needed. shopping list generation reads meal.ingredients
//     directly, so uplift ingredients flow naturally once added to the meal.
//     The ingredient_sources table will correctly attribute the uplift
//     ingredients to the meal at list-generation time.
//
// Future — recipe instruction augmentation (NOT implemented):
//   → Read application.quantity and application.explanation to generate a
//     deterministic cooking note, e.g.:
//     "Add ½ tsp turmeric when adding the spices."
//     Use template strings, not AI. Attach to meal.instructions as a new
//     step or append to the closest instruction step. Implement in a future
//     "instruction augmentation" phase using the stored application rows.
