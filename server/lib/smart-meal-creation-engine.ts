import { normalizeIngredientKey, singularizeIngredientKey } from "@shared/normalize";
import type { Meal } from "@shared/schema";

// ── Staple list ───────────────────────────────────────────────────────────────
// Intentionally small and generic. Eggs, cheese, milk, bread are excluded
// because they are real primary ingredients that should influence ranking.

export const DEFAULT_STAPLES: readonly string[] = [
  "salt", "pepper", "oil", "butter", "garlic", "onion",
  "water", "flour", "sugar", "vinegar", "stock", "herbs",
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IngredientScore {
  meal: Meal;
  /** -1 for ready meals (always sorted last); 0–≈1.24 otherwise */
  score: number;
  primaryMatches: number;
  stapleMatches: number;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function normalizeToken(s: string): string {
  return singularizeIngredientKey(normalizeIngredientKey(s));
}

/**
 * Returns true when `query` appears as a whole-word match inside `target`.
 * Both strings must already be normalised.
 * Word boundary (\b) prevents "oil" matching "foil".
 */
function containsWholeWord(target: string, query: string): boolean {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(target);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Parse a free-text ingredient list (comma, newline, or semicolon separated)
 * into an array of trimmed, non-empty strings ready for scoring.
 */
export function parseUserIngredients(text: string): string[] {
  return text
    .split(/[,\n;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Pure scoring function. No I/O, no side effects.
 *
 * Formula:
 *   primaryCoverage = primaryMatches / max(userIngredients.length, 1)   → 0..1
 *   stapleBonus     = stapleMatches  * 0.02                              → max ≈ 0.24
 *   score           = primaryCoverage + stapleBonus                      (ready meals → -1)
 *
 * Staple bonus is deliberately capped well below a single primary match (0.33
 * for 1-of-3 ingredients), so staples can never promote a zero-primary-match
 * meal above any meal the user's ingredients genuinely fit.
 */
export function scoreByIngredients(
  meal: Meal,
  userIngredients: string[],
  effectiveStaples: string[],
): IngredientScore {
  if (meal.isReadyMeal) {
    return { meal, score: -1, primaryMatches: 0, stapleMatches: 0 };
  }

  const mealTokens = meal.ingredients.map(normalizeToken);
  const normalizedUser = userIngredients.map(normalizeToken).filter(Boolean);
  const normalizedStaples = effectiveStaples.map(normalizeToken).filter(Boolean);

  let primaryMatches = 0;
  for (const query of normalizedUser) {
    if (mealTokens.some(t => containsWholeWord(t, query))) {
      primaryMatches++;
    }
  }

  let stapleMatches = 0;
  for (const staple of normalizedStaples) {
    if (mealTokens.some(t => containsWholeWord(t, staple))) {
      stapleMatches++;
    }
  }

  const primaryCoverage =
    normalizedUser.length > 0 ? primaryMatches / normalizedUser.length : 0;
  const stapleBonus = stapleMatches * 0.02;
  const score = primaryCoverage + stapleBonus;

  return { meal, score, primaryMatches, stapleMatches };
}

/**
 * Rank a collection of meals by how well they match the user's available
 * ingredients.
 *
 * Sort order:
 *   1. Score descending (higher = better primary ingredient coverage).
 *   2. primaryMatches descending (tiebreak: favour absolute ingredient count).
 *   3. Meal name ascending (deterministic final tiebreak).
 *   4. Ready meals always last (score is forced to -1).
 */
export function rankMealsByIngredients(
  meals: Meal[],
  userIngredients: string[],
  cupboardsBare: boolean,
): IngredientScore[] {
  const effectiveStaples = cupboardsBare ? [] : [...DEFAULT_STAPLES];

  return meals
    .map(meal => scoreByIngredients(meal, userIngredients, effectiveStaples))
    .sort((a, b) => {
      const aReady = a.score === -1;
      const bReady = b.score === -1;
      if (aReady !== bReady) return aReady ? 1 : -1;
      if (b.score !== a.score) return b.score - a.score;
      if (b.primaryMatches !== a.primaryMatches) return b.primaryMatches - a.primaryMatches;
      return a.meal.name.localeCompare(b.meal.name);
    });
}
