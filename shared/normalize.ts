/**
 * Canonical ingredient key normalizer — shared by server and client.
 * IMPORTANT: Any changes here affect both shopping list matching AND pantry storage.
 * The same function must be used consistently everywhere.
 *
 * Algorithm:
 *  1. Lowercase
 *  2. NFD decomposition + strip combining diacritics (U+0300-U+036F)
 *     e.g. Gruyere, Jalapeno, Creme fraiche
 *  3. Trim
 *  4. Remove all punctuation (keep word chars and spaces)
 *  5. Collapse multiple spaces to one
 *  6. Final trim
 */
export function normalizeIngredientKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Explicit word-level plural → singular map for common UK food terms.
 * Only covers unambiguous cases — no generic stemming.
 * Exported so callers can extend or inspect without re-running normalization.
 */
export const PLURAL_MAP: Record<string, string> = {
  apples:    "apple",   bananas:  "banana",  cherries: "cherry",
  berries:   "berry",   tomatoes: "tomato",  potatoes: "potato",
  grapes:    "grape",   oranges:  "orange",  lemons:   "lemon",
  limes:     "lime",    peaches:  "peach",   pears:    "pear",
  plums:     "plum",    mangoes:  "mango",   mangos:   "mango",
  avocados:  "avocado", kiwis:    "kiwi",    melons:   "melon",
  figs:      "fig",     plumbs:   "plum",
};

/**
 * Apply word-level plural → singular substitutions to an already-normalised key.
 * Used for MATCHING purposes only — never for storing keys in the DB.
 * Example: "pink lady apples" → "pink lady apple"
 *          "cherries" → "cherry"
 */
export function singularizeIngredientKey(normalizedKey: string): string {
  return normalizedKey
    .split(' ')
    .map(w => PLURAL_MAP[w] ?? w)
    .join(' ');
}
