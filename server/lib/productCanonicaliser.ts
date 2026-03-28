/**
 * Canonical product identity layer.
 *
 * Collapses naming variations of the same consumable product into a single
 * canonical identity using deterministic token + rule-based matching.
 * No external dependencies; no NLP.
 *
 * Scoped to soft drinks only for safe rollout.
 *
 * Examples resolved to "Cherry Coke":
 *   "Cherry coke", "Coke cherry", "Coca-Cola Cherry",
 *   "Cherry cola", "Coca-ColaCherry" (malformed/concatenated)
 *
 * "Cherry Coke Zero" remains a separate canonical identity.
 */

export interface CanonicalProduct {
  /** Human-readable canonical product name, e.g. "Cherry Coke" */
  name: string;
  /** Canonical brand name, e.g. "Coca-Cola" */
  brand: string;
}

// ── Tokenisation ─────────────────────────────────────────────────────────────

/**
 * Build a normalised set of tokens from product name + brand.
 *
 * Steps:
 *   1. Combine name and brand into a single string
 *   2. Lowercase
 *   3. Replace all non-alphanumeric characters with spaces
 *   4. Split on whitespace
 *   5. Discard single-character noise tokens
 */
function tokenise(productName: string | null, brand: string | null): Set<string> {
  const combined = `${productName ?? ''} ${brand ?? ''}`;
  const tokens = combined
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
  return new Set(tokens);
}

/**
 * Return a normalised phrase string suitable for multi-word pattern matching
 * (e.g. detecting "no sugar" as a phrase rather than two independent tokens).
 */
function normPhrase(productName: string | null, brand: string | null): string {
  return `${productName ?? ''} ${brand ?? ''}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Return true if any token exactly equals `target`, OR if any token contains
 * `target` as a substring (handles malformed/concatenated names such as
 * "Coca-ColaCherry" → token "colacherry" still contains "cola").
 */
function tokenHas(tokens: Set<string>, target: string): boolean {
  if (tokens.has(target)) return true;
  return Array.from(tokens).some(t => t.length > target.length && t.includes(target));
}

// ── Soft-drink rules ─────────────────────────────────────────────────────────

/**
 * Cola-family identifiers. Any one of these present in the token set means
 * the product belongs to the cola family.
 */
const COLA_IDENTIFIERS = ['coke', 'cola', 'cocacola'] as const;

/**
 * Exclusion tokens that mark diet/zero/sugar-free formulations.
 * These keep the product out of the standard (full-sugar) canonical bucket.
 * "sugar" is intentionally absent: it appears in "Real Sugar" variants that
 * are NOT diet products.  The "no sugar" phrase is handled separately below.
 */
const DIET_TOKENS = ['zero', 'diet', 'light'] as const;

function isCola(tokens: Set<string>): boolean {
  return COLA_IDENTIFIERS.some(id => tokenHas(tokens, id));
}

/**
 * Detect diet/zero/no-sugar formulations.
 * Checks individual exclusion tokens (zero, diet, light) AND the multi-word
 * phrase "no sugar" to avoid false-positives on e.g. "Cherry Coke Real Sugar".
 */
function isDietFormulation(tokens: Set<string>, phrase: string): boolean {
  if (DIET_TOKENS.some(t => tokens.has(t))) return true;
  if (/\bno\s+sugar\b/.test(phrase)) return true;
  return false;
}

/**
 * Match soft-drink products against canonical identity rules.
 * Returns null if no rule matches (product should not be canonically merged).
 */
function matchSoftDrinkRules(
  tokens: Set<string>,
  phrase: string,
): CanonicalProduct | null {
  // ── Cherry Cola / Cherry Coke family ──────────────────────────────────────
  if (isCola(tokens) && tokenHas(tokens, 'cherry')) {
    // Diet / Zero / No-Sugar formulations are a separate canonical product
    if (isDietFormulation(tokens, phrase)) {
      return { name: 'Cherry Coke Zero', brand: 'Coca-Cola' };
    }
    return { name: 'Cherry Coke', brand: 'Coca-Cola' };
  }

  // Future soft-drink rules go here following the same pattern.

  return null;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Given a raw product name and brand string from OpenFoodFacts, return the
 * canonical product identity if one can be determined, or null to leave the
 * product ungrouped (existing logic applies).
 *
 * This function is pure and deterministic — same inputs always yield the same
 * output. It introduces no I/O and no external dependencies.
 *
 * Currently scoped to soft drinks only for safe rollout.
 */
export function getCanonicalProduct(
  productName: string | null,
  brand: string | null,
): CanonicalProduct | null {
  const tokens = tokenise(productName, brand);
  const phrase = normPhrase(productName, brand);
  return matchSoftDrinkRules(tokens, phrase);
}
