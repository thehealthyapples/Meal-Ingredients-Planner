// ── Shopping liquid humanization ──────────────────────────────────────────────
//
// Shopping aggregation normalizes liquid volumes to grams via density conversion
// (e.g. 500ml milk → 515g). This looks right for aggregation math but wrong for
// supermarket display ("1 kg milk" vs "1 litre milk").
//
// This table is a conservative subset of the server-side ML_TO_G_DENSITY map.
// Only ingredients users shop BY VOLUME are included.
// Intentionally EXCLUDED (users shop by weight/pack): butter, yogurt, honey,
// maple syrup, golden syrup, peanut butter, tahini, tomato paste, passata, ghee.
export const SHOPPING_LIQUID_DENSITIES: Record<string, number> = {
  'milk': 1.03,
  'cream': 1.01,
  'double cream': 1.01,
  'single cream': 1.01,
  'whipping cream': 1.01,
  'oat milk': 1.03,
  'almond milk': 1.03,
  'soy milk': 1.03,
  'coconut milk': 0.97,
  'water': 1.0,
  'stock': 1.0,
  'broth': 1.0,
  'wine': 1.0,
  'orange juice': 1.04,
  'lemon juice': 1.03,
  'lime juice': 1.03,
  'apple juice': 1.04,
  'olive oil': 0.92,
  'vegetable oil': 0.92,
  'sunflower oil': 0.92,
  'coconut oil': 0.92,
  'sesame oil': 0.92,
  'rapeseed oil': 0.92,
  'oil': 0.92,
  'vinegar': 1.01,
  'balsamic': 1.05,
  'soy sauce': 1.1,
  'fish sauce': 1.1,
};

// Round a raw-ml value to a human-friendly supermarket quantity.
function roundDisplayMl(ml: number): number {
  if (ml >= 1000) return Math.round(ml / 1000) * 1000;
  if (ml >= 100) return Math.round(ml / 50) * 50;
  return Math.round(ml / 10) * 10;
}

/**
 * For known shopping liquids stored as normalized grams, returns the equivalent
 * rounded display-ml so the shopping list shows "1 L milk" instead of "1 kg milk".
 *
 * Presentation-only — does NOT affect stored data, aggregation, or nutrition.
 * Returns null for non-liquid ingredients (caller falls through to g/kg display).
 */
export function getLiquidDisplayMl(grams: number, name: string): number | null {
  if (!name || grams <= 0) return null;
  const lower = name.toLowerCase().trim();

  let density = SHOPPING_LIQUID_DENSITIES[lower];

  if (density === undefined) {
    // Compound name matching: "skimmed milk" → milk; "chicken stock" → stock
    for (const [key, d] of Object.entries(SHOPPING_LIQUID_DENSITIES)) {
      if (lower.endsWith(' ' + key) || lower.startsWith(key + ' ')) {
        density = d;
        break;
      }
    }
  }

  if (density === undefined) return null;
  return roundDisplayMl(grams / density);
}

/**
 * Strips an accidental leading quantity from a productName that was stored without
 * being parsed (e.g. "1 lemon" stored as the name instead of "lemon").
 * Only strips if the leading number matches the item's quantityValue (or quantityValue
 * is null/1), to avoid clobbering legitimate names like "2-in-1 shampoo".
 */
export function cleanProductName(name: string, quantityValue?: number | null): string {
  const match = name.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (!match) return name;
  const leading = parseFloat(match[1]);
  // Only strip if the leading number matches what's already recorded as the qty
  // or if quantityValue wasn't set (i.e. it defaults to 1).
  if (quantityValue == null || quantityValue === leading) return match[2];
  return name;
}

export function formatQuantityMetric(quantity: number, unit: string): string {
  if (unit === 'g') {
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
    return `${Math.round(quantity)} g`;
  }
  if (unit === 'ml') {
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(2).replace(/\.?0+$/, '')} L`;
    return `${Math.round(quantity)} ml`;
  }
  if (unit === 'unit') {
    return `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)}`;
  }
  return `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)} ${unit}`;
}

export function formatQuantityImperial(quantity: number, unit: string): string {
  if (unit === 'g') {
    if (quantity >= 453.592) {
      const lbs = quantity / 453.592;
      return `${lbs.toFixed(2).replace(/\.?0+$/, '')} lb`;
    }
    const oz = quantity / 28.3495;
    return `${oz.toFixed(1).replace(/\.?0+$/, '')} oz`;
  }
  if (unit === 'ml') {
    if (quantity >= 240) {
      const cups = quantity / 240;
      return `${cups.toFixed(1).replace(/\.?0+$/, '')} cups`;
    }
    if (quantity >= 15) {
      const tbsp = quantity / 15;
      return `${tbsp.toFixed(1).replace(/\.?0+$/, '')} tbsp`;
    }
    const tsp = quantity / 5;
    return `${tsp.toFixed(1).replace(/\.?0+$/, '')} tsp`;
  }
  if (unit === 'unit') {
    return `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)}`;
  }
  return `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)} ${unit}`;
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export function formatItemDisplay(
  productName: string,
  quantityValue: number | null,
  unit: string | null,
  preference: 'metric' | 'imperial'
): string {
  const name = capitalizeWords(productName);
  if (quantityValue === null || quantityValue === undefined || !unit) return name;
  if (unit === 'unit' && quantityValue === 1) return name;
  if (unit === 'descriptive') return name;
  const formatted = preference === 'metric'
    ? formatQuantityMetric(quantityValue, unit)
    : formatQuantityImperial(quantityValue, unit);
  if (!formatted) return name;
  return `${name} \u2014 ${formatted}`;
}
