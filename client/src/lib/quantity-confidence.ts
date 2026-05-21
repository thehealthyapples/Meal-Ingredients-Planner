/**
 * Quantity confidence visibility — Shopping Phase 6.
 *
 * Derives operational confidence from existing item state.
 * Pure read-only layer: does NOT change quantities, calculations, or stored data.
 */

export type QuantityConfidence = 'exact' | 'estimated' | 'approximate' | 'assumed';

export interface QtyConfidenceInput {
  resolutionState?: string | null;
  unit?: string | null;
  quantityValue?: number | null;
  quantityInGrams?: number | null;
  itemType?: string | null;
}

const UNIT_COUNT_VALUES = new Set(['unit', 'pack', 'bunch', 'head', '']);

function isUnitCount(unit: string | null | undefined): boolean {
  return !unit || UNIT_COUNT_VALUES.has(unit.toLowerCase());
}

/**
 * Derives quantity confidence from existing item state.
 * Reads resolutionState, unit, quantityValue, quantityInGrams, itemType.
 */
export function deriveQuantityConfidence(item: QtyConfidenceInput): QuantityConfidence {
  const hasQty = item.quantityValue != null || item.quantityInGrams != null;

  if (!hasQty) return 'assumed';

  if (item.unit === 'descriptive') return 'approximate';

  if (item.resolutionState === 'matched_to_product') return 'exact';

  // Packaged item with a unit count = pack-size assumption
  if (item.itemType === 'packaged' && isUnitCount(item.unit)) return 'assumed';

  // Has normalized gram weight = well-estimated (most recipe-derived quantities)
  if (item.quantityInGrams != null && item.quantityInGrams > 0) return 'estimated';

  // Unit count for non-packaged items (e.g. "2 onions") = estimated
  if (isUnitCount(item.unit) && item.quantityValue != null) return 'estimated';

  // Has a value but no gram normalization (unusual unit)
  if (item.quantityValue != null) return 'approximate';

  return 'assumed';
}

/**
 * Returns an operational, household-friendly confidence label.
 * Returns null for 'exact' (no signal needed — calm state).
 */
export function getQuantityConfidenceLabel(
  confidence: QuantityConfidence,
  item: QtyConfidenceInput,
): string | null {
  if (confidence === 'exact') return null;
  if (confidence === 'estimated') return 'Estimated quantity';
  if (confidence === 'approximate') return 'Approximate amount';
  if (confidence === 'assumed') {
    if (!item.quantityValue && !item.quantityInGrams) return 'No quantity set';
    if (item.itemType === 'packaged' && isUnitCount(item.unit)) return 'Pack assumption';
    return 'Assumed amount';
  }
  return null;
}
