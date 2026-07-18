import { normalizeIngredientKey } from "./normalize";
import { INGREDIENT_QUANTITY_UNIT_PATTERN } from "./ingredient-units";
import { TRAILING_PREP_NOTE_PATTERN } from "./ingredient-descriptors";

/**
 * Canonical ingredient string parser — shared by client and server.
 *
 * Parses a raw ingredient string (e.g. "2 cloves garlic, crushed") into its
 * constituent parts. Implementation is based on the richer pattern set from
 * meals-page.tsx, extended to return quantity and unit as separate fields.
 *
 * Pure TypeScript — no browser or Node globals, no side effects.
 */
export function parseIngredient(raw: string): {
  productName: string;
  normalizedName: string;
  quantity: string | null;
  unit: string | null;
} {
  // NUT_VERIFY2 — the multiplier form. "1 x 400g tin chopped tomatoes" and
  // "2 × 400g tins" defeated every pattern below: pattern 1 needs the digits
  // adjacent to a unit, so the leading "1 x " survived into the key as
  // "x 400g tin chopped tomatoes". Removing the multiplier hands the remaining
  // text to the existing patterns unchanged; it introduces no new pattern.
  const text = raw.trim().replace(/^\d+\s*[x×]\s*(?=\d)/i, "");

  const UNIT_PATTERN = INGREDIENT_QUANTITY_UNIT_PATTERN;

  // NUT_VERIFY2 — the prep-note vocabulary now has ONE owner
  // (`shared/ingredient-descriptors.ts`), shared with the resolver's leading-
  // descriptor peeling. The previous inline list omitted common recipe words —
  // "drained", "shredded", "rinsed", "to serve" — so "400g tin chickpeas,
  // drained" kept "drained" in its key and could never resolve.
  const PREP_NOTES = new RegExp(`,\\s*(?:${TRAILING_PREP_NOTE_PATTERN}).*$`, "i");

  function capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function cleanName(s: string): string {
    return capitalise(s.replace(PREP_NOTES, "").trim());
  }

  // Pattern 1: numeric quantity + explicit unit + ingredient name
  // e.g. "2 cloves garlic", "500g chicken breast", "1 tbsp olive oil"
  const pattern1 = new RegExp(
    `^(\\d+[\\d\\/\\s]*)\\s*(${UNIT_PATTERN})\\s+(?:of\\s+)?(.+)`,
    "i"
  );
  const m1 = text.match(pattern1);
  if (m1) {
    return {
      productName: cleanName(m1[3]),
      normalizedName: normalizeIngredientKey(cleanName(m1[3])),
      quantity: m1[1].trim(),
      unit: m1[2].trim(),
    };
  }

  // Pattern 2: numeric quantity (no unit) + ingredient name
  // e.g. "2 eggs", "3 apples"
  const pattern2 = /^(\d+[\d\/\s]*)\s+(.+)/;
  const m2 = text.match(pattern2);
  if (m2) {
    return {
      productName: cleanName(m2[2]),
      normalizedName: normalizeIngredientKey(cleanName(m2[2])),
      quantity: m2[1].trim(),
      unit: null,
    };
  }

  // Pattern 3: informal quantity + ingredient name
  // e.g. "a handful of spinach", "a pinch of salt", "a few sprigs of thyme"
  const pattern3 = /^(a\s+(?:few|pinch|dash|handful)\s+(?:of\s+)?)(.+)/i;
  const m3 = text.match(pattern3);
  if (m3) {
    return {
      productName: cleanName(m3[2]),
      normalizedName: normalizeIngredientKey(cleanName(m3[2])),
      quantity: m3[1].trim(),
      unit: null,
    };
  }

  // Fallback: no quantity detected — strip prep notes and capitalise
  const name = cleanName(text);
  return {
    productName: name,
    normalizedName: normalizeIngredientKey(name),
    quantity: null,
    unit: null,
  };
}
