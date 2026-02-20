import {
  parseIngredient,
  consolidateIngredients,
  normalizeName,
  detectIngredientCategory,
  isGarbageIngredient,
  formatQuantityMetric,
  formatQuantityImperial,
  type ParsedIngredient,
  type ConsolidatedItem,
} from './ingredient-utils';

const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  ml: 1,
  kg: 1000,
  mg: 0.001,
  l: 1000,
  oz: 28.3495,
  lb: 453.592,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  'fl oz': 29.5735,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
};

export interface NormalizedIngredientData {
  originalText: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit: string;
  quantityInGrams: number | null;
  category: string;
}

export function normalizeIngredient(text: string): NormalizedIngredientData {
  const parsed = parseIngredient(text);
  const category = detectIngredientCategory(parsed.normalizedName);
  const quantityInGrams = convertToGrams(parsed.quantity, parsed.unit);

  return {
    originalText: text.trim(),
    name: parsed.name,
    normalizedName: parsed.normalizedName,
    quantity: parsed.quantity,
    unit: parsed.unit,
    quantityInGrams,
    category,
  };
}

export function convertToGrams(quantity: number, unit: string): number | null {
  const baseUnit = unit.toLowerCase();
  if (baseUnit === 'g' || baseUnit === 'ml') {
    return quantity;
  }
  const factor = UNIT_TO_GRAMS[baseUnit];
  if (factor) {
    return quantity * factor;
  }
  return null;
}

export function convertFromGrams(
  gramsValue: number,
  baseUnit: string,
  preference: 'metric' | 'imperial'
): { value: number; unit: string; display: string } {
  if (preference === 'metric') {
    return convertFromGramsMetric(gramsValue, baseUnit);
  }
  return convertFromGramsImperial(gramsValue, baseUnit);
}

function convertFromGramsMetric(
  gramsValue: number,
  baseUnit: string
): { value: number; unit: string; display: string } {
  if (baseUnit === 'ml') {
    if (gramsValue >= 1000) {
      const val = gramsValue / 1000;
      return { value: val, unit: 'L', display: `${val.toFixed(2).replace(/\.?0+$/, '')} L` };
    }
    return { value: Math.round(gramsValue), unit: 'ml', display: `${Math.round(gramsValue)} ml` };
  }
  if (baseUnit === 'g') {
    if (gramsValue >= 1000) {
      const val = gramsValue / 1000;
      return { value: val, unit: 'kg', display: `${val.toFixed(2).replace(/\.?0+$/, '')} kg` };
    }
    return { value: Math.round(gramsValue), unit: 'g', display: `${Math.round(gramsValue)} g` };
  }
  return { value: gramsValue, unit: baseUnit, display: `${gramsValue}` };
}

function convertFromGramsImperial(
  gramsValue: number,
  baseUnit: string
): { value: number; unit: string; display: string } {
  if (baseUnit === 'ml') {
    if (gramsValue >= 240) {
      const cups = gramsValue / 240;
      return { value: cups, unit: 'cups', display: `${cups.toFixed(1).replace(/\.?0+$/, '')} cups` };
    }
    if (gramsValue >= 15) {
      const tbsp = gramsValue / 15;
      return { value: tbsp, unit: 'tbsp', display: `${tbsp.toFixed(1).replace(/\.?0+$/, '')} tbsp` };
    }
    const tsp = gramsValue / 5;
    return { value: tsp, unit: 'tsp', display: `${tsp.toFixed(1).replace(/\.?0+$/, '')} tsp` };
  }
  if (baseUnit === 'g') {
    if (gramsValue >= 453.592) {
      const lbs = gramsValue / 453.592;
      return { value: lbs, unit: 'lb', display: `${lbs.toFixed(2).replace(/\.?0+$/, '')} lb` };
    }
    const oz = gramsValue / 28.3495;
    return { value: oz, unit: 'oz', display: `${oz.toFixed(1).replace(/\.?0+$/, '')} oz` };
  }
  return { value: gramsValue, unit: baseUnit, display: `${gramsValue}` };
}

export interface ConsolidatedNormalizedItem extends ConsolidatedItem {
  quantityInGrams: number | null;
}

export function consolidateAndNormalize(ingredients: string[]): ConsolidatedNormalizedItem[] {
  const consolidated = consolidateIngredients(ingredients);
  return consolidated.map(item => ({
    ...item,
    quantityInGrams: convertToGrams(item.quantity, item.unit),
  }));
}

export function formatDisplayQuantity(
  quantityValue: number | null,
  unit: string | null,
  quantityInGrams: number | null,
  preference: 'metric' | 'imperial'
): string {
  if (quantityInGrams !== null && unit && (unit === 'g' || unit === 'ml')) {
    const converted = convertFromGrams(quantityInGrams, unit, preference);
    return converted.display;
  }

  if (quantityValue !== null && unit) {
    if (preference === 'metric') {
      return formatQuantityMetric(quantityValue, unit);
    }
    return formatQuantityImperial(quantityValue, unit);
  }

  if (quantityValue !== null) {
    return quantityValue % 1 === 0 ? String(quantityValue) : quantityValue.toFixed(1);
  }

  return '';
}

export { normalizeName, detectIngredientCategory, isGarbageIngredient, parseIngredient };
