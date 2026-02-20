import { lookupPricesForIngredient, type PriceResult } from './price-lookup';
import { detectIngredientCategory, isGarbageIngredient } from './ingredient-utils';
import type { InsertGroceryProduct } from '@shared/schema';

export interface MatchedProductResult {
  ingredientName: string;
  products: InsertGroceryProduct[];
  bestMatch: {
    store: string;
    tier: string;
    price: number | null;
    productName: string;
    imageUrl: string | null;
  } | null;
}

export async function matchProductsForIngredient(
  ingredientName: string,
  category: string,
  quantity: number,
  unit: string
): Promise<MatchedProductResult> {
  if (isGarbageIngredient(ingredientName)) {
    return { ingredientName, products: [], bestMatch: null };
  }

  const detectedCategory = category || detectIngredientCategory(ingredientName);
  const priceResults = await lookupPricesForIngredient(
    ingredientName,
    detectedCategory,
    quantity,
    unit
  );

  const products: InsertGroceryProduct[] = priceResults.map(pr => ({
    ingredientName,
    name: pr.productName,
    brand: null,
    imageUrl: pr.imageUrl,
    weight: pr.productWeight,
    supermarket: pr.supermarket,
    tier: pr.tier,
    price: pr.price,
    currency: pr.currency,
    productUrl: pr.productUrl,
    pricePerUnit: pr.pricePerUnit,
  }));

  let bestMatch: MatchedProductResult['bestMatch'] = null;
  const standardMatches = priceResults.filter(p => p.tier === 'standard' && p.price !== null);
  if (standardMatches.length > 0) {
    const cheapest = standardMatches.reduce((best, curr) =>
      (curr.price! < best.price!) ? curr : best
    );
    bestMatch = {
      store: cheapest.supermarket,
      tier: cheapest.tier,
      price: cheapest.price,
      productName: cheapest.productName,
      imageUrl: cheapest.imageUrl,
    };
  } else {
    const anyMatch = priceResults.find(p => p.price !== null);
    if (anyMatch) {
      bestMatch = {
        store: anyMatch.supermarket,
        tier: anyMatch.tier,
        price: anyMatch.price,
        productName: anyMatch.productName,
        imageUrl: anyMatch.imageUrl,
      };
    }
  }

  return { ingredientName, products, bestMatch };
}

export async function matchProductsForItems(
  items: Array<{
    id: number;
    productName: string;
    category: string | null;
    quantityValue: number | null;
    unit: string | null;
  }>
): Promise<Map<number, MatchedProductResult>> {
  const results = new Map<number, MatchedProductResult>();

  for (const item of items) {
    if (isGarbageIngredient(item.productName)) continue;
    const category = item.category || detectIngredientCategory(item.productName);
    const result = await matchProductsForIngredient(
      item.productName,
      category,
      item.quantityValue || 1,
      item.unit || 'unit'
    );
    results.set(item.id, result);
  }

  return results;
}
