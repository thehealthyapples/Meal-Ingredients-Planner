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
  const formatted = preference === 'metric'
    ? formatQuantityMetric(quantityValue, unit)
    : formatQuantityImperial(quantityValue, unit);
  if (!formatted) return name;
  return `${name} \u2014 ${formatted}`;
}
