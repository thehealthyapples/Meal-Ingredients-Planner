/**
 * Shopping domain — purchase-intent inference (Domain 15 owns quantity).
 *
 * A Living Home "add to shopping" communicates INTENT ("I need to buy this"),
 * never a literal quantity. The Shopping domain decides the most likely purchase:
 *
 *   1. Household purchase history   (if they normally buy six apples, suggest six)
 *   3. Common retail packaging      (apples → a pack of six; milk → a 2-litre bottle)
 *   4. Sensible default             (one, to start with)
 *
 * (Household composition — tier 2 — is a future refinement; the shape below already
 * accepts a history hint so it can be layered in without changing callers.)
 *
 * This module owns NO storage and mints no new owner: it is a pure decision the
 * Shopping route calls, then writes through the existing shopping-list surface.
 */

export interface InferredPurchase {
  quantityValue: number;
  unit: string;
  /** why — the Companion may quietly explain this. */
  note: string;
  basis: "history" | "retail-packaging" | "default";
}

// Common UK household retail packaging — how a family normally buys each thing.
// Matched by keyword against the normalised + display name.
const RETAIL: Array<{ match: RegExp; q: number; unit: string; note: string }> = [
  { match: /\bapple/,                                q: 6,   unit: "pack",      note: "a pack of six — the usual way apples are sold" },
  { match: /\b(satsuma|clementine|mandarin|tangerine)/, q: 1, unit: "bag",     note: "a bag — how satsumas are normally sold" },
  { match: /\borange/,                               q: 1,   unit: "bag",       note: "a bag" },
  { match: /\bbanana/,                               q: 1,   unit: "bunch",     note: "a bunch" },
  { match: /\bpear/,                                 q: 4,   unit: "pack",      note: "a pack" },
  { match: /\bgrape/,                                q: 1,   unit: "punnet",    note: "a punnet" },
  { match: /\b(berr|strawberr|blueberr|raspberr)/,   q: 1,   unit: "punnet",    note: "a punnet" },
  { match: /\bmango/,                                q: 1,   unit: "each",      note: "one" },
  { match: /\bavocado/,                              q: 1,   unit: "pack",      note: "a pack of two" },
  { match: /\bcarrot/,                               q: 1,   unit: "kg",        note: "a 1 kg bag" },
  { match: /\bsweet potato/,                         q: 1,   unit: "kg",        note: "a 1 kg bag" },
  { match: /\bpotato/,                               q: 2.5, unit: "kg",        note: "a 2.5 kg bag" },
  { match: /\b(onion|shallot)/,                      q: 1,   unit: "bag",       note: "a bag" },
  { match: /\bgarlic/,                               q: 1,   unit: "pack",      note: "a pack" },
  { match: /\bmilk/,                                 q: 2,   unit: "litre",     note: "a 2-litre bottle" },
  { match: /\begg/,                                  q: 6,   unit: "box",       note: "a box of six" },
  { match: /\bbutter/,                               q: 1,   unit: "pack",      note: "one pack" },
  { match: /\b(yoghurt|yogurt)/,                     q: 1,   unit: "pot",       note: "a pot" },
  { match: /\bcheese/,                               q: 1,   unit: "pack",      note: "one pack" },
  { match: /\btomato/,                               q: 1,   unit: "multipack", note: "a multipack of tins" },
  { match: /\b(bean|chickpea|lentil|pulse)/,         q: 1,   unit: "multipack", note: "a multipack of tins" },
  { match: /\bsoup/,                                 q: 1,   unit: "multipack", note: "a multipack" },
  { match: /\b(tuna|sardine|mackerel|salmon)/,       q: 1,   unit: "multipack", note: "a multipack of tins" },
  { match: /\bcoconut/,                              q: 1,   unit: "tin",       note: "a tin" },
  { match: /\bflour/,                                q: 1,   unit: "bag",       note: "a bag" },
  { match: /\b(rice|pasta|penne|fusilli|couscous|bulgur|barley|oats|granola)/, q: 1, unit: "pack", note: "a pack" },
  { match: /\b(oil|vinegar)/,                        q: 1,   unit: "bottle",    note: "a bottle" },
  { match: /\bsugar/,                                q: 1,   unit: "bag",       note: "a bag" },
  { match: /\b(tea|coffee|hot chocolate|cocoa)/,     q: 1,   unit: "pack",      note: "a pack" },
  { match: /\b(bread|loaf|roll|wrap|bagel)/,         q: 1,   unit: "pack",      note: "a pack" },
];

/**
 * Decide the most likely purchase for a product the household intends to buy.
 * `history` is the household's usual quantity/unit for this item, if known.
 */
export function inferPurchaseIntent(
  productName: string,
  normalizedName: string,
  _category: string | null,
  history?: { quantityValue: number | null; unit: string | null } | null,
): InferredPurchase {
  // 1. Household purchase history — reuse what they normally buy.
  if (history && history.quantityValue != null && history.unit) {
    return {
      quantityValue: history.quantityValue,
      unit: history.unit,
      basis: "history",
      note: `${history.quantityValue} ${history.unit} — what your household usually buys`,
    };
  }

  // 3. Common retail packaging.
  const hay = `${normalizedName} ${productName}`.toLowerCase();
  for (const r of RETAIL) {
    if (r.match.test(hay)) return { quantityValue: r.q, unit: r.unit, basis: "retail-packaging", note: r.note };
  }

  // 4. Sensible default.
  return { quantityValue: 1, unit: "pack", basis: "default", note: "one, to start with" };
}
