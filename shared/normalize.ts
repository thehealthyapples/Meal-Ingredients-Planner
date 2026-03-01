/**
 * Canonical ingredient key normalizer — shared by server and client.
 * IMPORTANT: Any changes here affect both shopping list matching AND pantry storage.
 * The same function must be used consistently everywhere.
 *
 * Algorithm:
 *  1. Lowercase
 *  2. Trim
 *  3. Remove all punctuation (keep word chars and spaces)
 *  4. Collapse multiple spaces to one
 *  5. Final trim
 */
export function normalizeIngredientKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
