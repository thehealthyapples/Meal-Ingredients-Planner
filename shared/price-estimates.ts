// Category-rate price estimates used as a SAFE fallback when no real product
// match is found.  Returns price-only — never a product, never a supermarket
// link, never a ProductMatch row.  Caller must always render these as "~£X.XX"
// (with tilde) and surface a legend so the user can distinguish them from
// real provider prices.
export const CATEGORY_PRICE_ESTIMATES: Record<string, { perKg: number; perUnit: number; perLitre: number }> = {
  meat:       { perKg: 8.00,  perUnit: 3.50, perLitre: 0    },
  fish:       { perKg: 12.00, perUnit: 4.00, perLitre: 0    },
  dairy:      { perKg: 3.50,  perUnit: 1.50, perLitre: 1.20 },
  eggs:       { perKg: 0,     perUnit: 0.25, perLitre: 0    },
  produce:    { perKg: 2.00,  perUnit: 0.50, perLitre: 0    },
  fruit:      { perKg: 3.00,  perUnit: 0.40, perLitre: 0    },
  grains:     { perKg: 1.50,  perUnit: 1.00, perLitre: 0    },
  herbs:      { perKg: 15.00, perUnit: 0.80, perLitre: 0    },
  oils:       { perKg: 4.00,  perUnit: 3.00, perLitre: 4.00 },
  condiments: { perKg: 5.00,  perUnit: 2.00, perLitre: 3.00 },
  nuts:       { perKg: 10.00, perUnit: 2.50, perLitre: 0    },
  legumes:    { perKg: 2.50,  perUnit: 1.00, perLitre: 0    },
  bakery:     { perKg: 4.00,  perUnit: 1.50, perLitre: 0    },
  tinned:     { perKg: 2.00,  perUnit: 1.00, perLitre: 0    },
};

const UNRECOGNISED_CATEGORIES = new Set(['', 'other', 'uncategorised']);

/**
 * Returns an estimated price (GBP) for an item with a recognised category, or
 * null if the category is missing/unrecognised.  Pure helper — no side effects,
 * no DB writes, no product objects.  Used by the UI to render "~£X.XX" as a
 * price-only signal alongside an "Estimated price" legend.
 */
export function estimateFallbackPrice(
  category: string | null | undefined,
  quantity: number | null | undefined,
  unit: string | null | undefined,
): number | null {
  if (!category || UNRECOGNISED_CATEGORIES.has(category)) return null;
  const rates = CATEGORY_PRICE_ESTIMATES[category];
  if (!rates) return null;

  const qty = quantity && quantity > 0 ? quantity : 1;
  const u = unit ?? 'unit';

  if (u === 'g') {
    const packKg = qty >= 1000 ? Math.ceil(qty / 1000) : 1;
    const price = Math.round(packKg * rates.perKg * 100) / 100;
    return price > 0 ? price : null;
  }
  if (u === 'ml') {
    const packL = qty >= 1000 ? Math.ceil(qty / 1000) : 1;
    const price = Math.round(packL * rates.perLitre * 100) / 100;
    if (price > 0) return price;
    const unitPrice = Math.round(rates.perUnit * 100) / 100;
    return unitPrice > 0 ? unitPrice : null;
  }
  const unitPrice = Math.round(rates.perUnit * 100) / 100;
  return unitPrice > 0 ? unitPrice : null;
}
