/**
 * Canonical product identity layer.
 *
 * Collapses naming variations of the same consumable product into a single
 * canonical identity using deterministic token + rule-based matching.
 * No external dependencies; no NLP.
 *
 * Examples resolved by category:
 *
 * Soft drinks:
 *   "Cherry coke", "Coke cherry", "Coca-Cola Cherry",
 *   "Cherry cola", "Coca-ColaCherry" (malformed/concatenated)
 *   → "Cherry Coke"
 *
 * Confectionery:
 *   "Double Decker", "Cadbury Double Decker",
 *   "Cadbury double DECKER 4BAR BARS SUSTAINABLY SOURCE",
 *   "Cadbury double decker chocolate",
 *   "Cadbury double DECKER 4BARS SOURCED COCOA ..."
 *   → "Cadbury Double Decker"
 *
 *   "Rustlers The Mighty Double Decker" (brand: Rustlers) → NOT matched (different brand)
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

// ── Confectionery rules ───────────────────────────────────────────────────────

/**
 * Brands known to make a non-Cadbury "Double Decker" product.
 */
const NON_CADBURY_DOUBLE_DECKER_BRANDS = ['rustlers', 'rollover'] as const;

/**
 * Tokens that indicate a product is clearly NOT the Cadbury chocolate bar,
 * even though it carries the words "double decker" in its name.
 * e.g. "Double Decker cheese pizza", "Double Decker Oatmeal Creme Pie",
 *      "Cheesy double decker taco", "Double Decker New York-Style Cheesecake"
 */
const NON_CHOCOLATE_SIGNALS = [
  'pizza', 'burger', 'taco', 'pie', 'pies', 'cheesecake', 'cookie', 'cookies',
  'licorice', 'liquorice', 'banana', 'oatmeal', 'fudge', 'creme', 'sandwich',
  'cheese', 'meatball', 'pepperoni', 'cheeseburger', 'wrapped', 'moonpie',
] as const;

/**
 * Match confectionery products against canonical identity rules.
 *
 * Double Decker rule:
 *  - Explicit Cadbury brand → always match (handles all branded variants)
 *  - No brand / brand missing in OFF → match only if the name has no
 *    non-chocolate signals ("pizza", "pie", "burger", etc.)
 *    This captures the common OFF data quality issue where the Cadbury
 *    chocolate bar is submitted without a brand field.
 *  - Known competing brands (Rustlers, Rollover) → never match
 */
function matchConfectioneryRules(
  tokens: Set<string>,
  _phrase: string,
): CanonicalProduct | null {
  // ── Cadbury Double Decker ──────────────────────────────────────────────────
  if (
    tokenHas(tokens, 'double') &&
    tokenHas(tokens, 'decker') &&
    !NON_CADBURY_DOUBLE_DECKER_BRANDS.some(b => tokenHas(tokens, b))
  ) {
    // Explicit Cadbury brand → definite match
    if (tokenHas(tokens, 'cadbury')) {
      return { name: 'Cadbury Double Decker', brand: 'Cadbury' };
    }
    // No competing brand token, and no non-chocolate signals → likely the
    // Cadbury bar submitted without a brand field in OFF
    if (!NON_CHOCOLATE_SIGNALS.some(s => tokenHas(tokens, s))) {
      return { name: 'Cadbury Double Decker', brand: 'Cadbury' };
    }
  }

  return null;
}

// ── Broad food-type classification for swap compatibility ─────────────────────

/**
 * Tokens that strongly indicate a product is a savory/fast-food item.
 * Used to prevent confectionery ingredients being paired with savory swap
 * suggestions (e.g. chocolate bar → burger).
 */
const SAVORY_FOOD_SIGNALS = [
  'burger', 'pizza', 'taco', 'sandwich', 'kebab', 'hotdog', 'sausage',
  'meatball', 'cheeseburger', 'pepperoni', 'rustlers', 'rollover',
  'wrap', 'burrito', 'quesadilla', 'nachos', 'fries',
] as const;

/**
 * Tokens that strongly indicate a product is a sweet/confectionery item.
 */
const CONFECTIONERY_SIGNALS = [
  'chocolate', 'cadbury', 'candy', 'sweet', 'biscuit', 'brownie',
  'nestle', 'kitkat', 'twix', 'snickers', 'bounty', 'milkyway',
  'haribo', 'caramel', 'nougat', 'truffle', 'praline', 'fudge',
] as const;

type BroadFoodType = 'confectionery' | 'savory';

function getBroadFoodType(tokens: Set<string>): BroadFoodType | null {
  if (SAVORY_FOOD_SIGNALS.some(s => tokenHas(tokens, s))) return 'savory';
  if (CONFECTIONERY_SIGNALS.some(s => tokenHas(tokens, s))) return 'confectionery';
  return null;
}

/**
 * Returns false when the healthier swap suggestion is clearly in a different
 * broad food category than the ingredient — e.g. a chocolate bar should not
 * be swapped for a burger product just because they share a product name fragment.
 *
 * Only rejects when BOTH sides have a detectable food type AND they differ.
 * If either side is ambiguous (type = null), the swap is allowed through.
 */
export function isCompatibleSwap(ingredient: string, healthierAlternative: string): boolean {
  const ingType = getBroadFoodType(tokenise(ingredient, null));
  const altType = getBroadFoodType(tokenise(healthierAlternative, null));
  if (ingType !== null && altType !== null && ingType !== altType) return false;
  return true;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Given a raw product name and brand string from OpenFoodFacts, return the
 * canonical product identity if one can be determined, or null to leave the
 * product ungrouped (existing logic applies).
 *
 * This function is pure and deterministic — same inputs always yield the same
 * output. It introduces no I/O and no external dependencies.
 */
export function getCanonicalProduct(
  productName: string | null,
  brand: string | null,
): CanonicalProduct | null {
  const tokens = tokenise(productName, brand);
  const phrase = normPhrase(productName, brand);

  return (
    matchSoftDrinkRules(tokens, phrase) ??
    matchConfectioneryRules(tokens, phrase)
  );
}
