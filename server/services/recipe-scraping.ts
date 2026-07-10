/**
 * recipe-scraping.ts — recipe page extraction helpers
 * ====================================================
 * Pure, network-free helpers for pulling recipe facts out of a fetched HTML page:
 * schema.org JSON-LD `Recipe` blocks, and free-text macro lines when no JSON-LD exists.
 *
 * Extracted VERBATIM from `server/routes.ts` under BENCHINT2 (2026-07-10). Nothing here is new,
 * nothing here changed. The extraction exists so that `meal-analysis.ts` — which the meals route
 * AND the Benchmark World seeder both call — can reach these helpers without importing the route
 * module. See docs/implementation/benchmarking/BENCHINT2_BENCHMARK_RUNTIME_CONVERGENCE.md.
 *
 * These functions do no I/O. The caller supplies an already-loaded cheerio document.
 */

import type * as cheerio from "cheerio";

const MACRO_KEYWORDS = [
  'calories', 'cal', 'energy', 'protein', 'fat', 'carbs', 'carbohydrates',
  'sugar', 'salt', 'sodium', 'nutrition', 'per serving', 'kcal', 'kj',
  'fiber', 'fibre', 'saturated', 'cholesterol', 'vitamin', 'mineral',
  'daily value', 'serving size', 'servings per'
];

export function isMacroLine(text: string): boolean {
  const lower = text.toLowerCase();
  return MACRO_KEYWORDS.some(keyword => lower.includes(keyword));
}

export function extractNutritionFromText(texts: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const patterns: [string, RegExp][] = [
    ['calories', /(\d+[\.,]?\d*)\s*(kcal|calories|cal)/i],
    ['protein', /protein[:\s]*(\d+[\.,]?\d*)\s*g/i],
    ['carbs', /carb(?:ohydrate)?s?[:\s]*(\d+[\.,]?\d*)\s*g/i],
    ['fat', /(?:total\s+)?fat[:\s]*(\d+[\.,]?\d*)\s*g/i],
    ['sugar', /sugar[:\s]*(\d+[\.,]?\d*)\s*g/i],
    ['salt', /(?:salt|sodium)[:\s]*(\d+[\.,]?\d*)\s*(?:g|mg)/i],
  ];

  const combined = texts.join(' ');
  for (const [key, regex] of patterns) {
    const match = combined.match(regex);
    if (match) {
      result[key] = key === 'calories' ? `${match[1]} kcal` : `${match[1]}g`;
    }
  }
  return result;
}

export interface JsonLdRecipe {
  name?: string;
  recipeIngredient?: string[];
  recipeInstructions?: any;
  image?: string | string[] | { url: string }[];
  recipeYield?: string | string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  nutrition?: Record<string, any>;
}

export function extractJsonLdRecipe($: cheerio.CheerioAPI): JsonLdRecipe | null {
  let recipeSchema: JsonLdRecipe | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipeSchema) return;
    try {
      const raw = $(el).html();
      if (!raw) return;
      const data = JSON.parse(raw);

      const checkItem = (item: any) => {
        if (item && item['@type']) {
          const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
          if (types.includes('Recipe')) {
            recipeSchema = item;
            return true;
          }
        }
        return false;
      };

      if (checkItem(data)) return;

      if (Array.isArray(data)) {
        for (const item of data) {
          if (checkItem(item)) return;
        }
      }

      if (data['@graph'] && Array.isArray(data['@graph'])) {
        for (const item of data['@graph']) {
          if (checkItem(item)) return;
        }
      }
    } catch {}
  });

  return recipeSchema;
}

export function extractJsonLdNutrition(nutrition: Record<string, any> | undefined): Record<string, string> {
  if (!nutrition) return {};
  const result: Record<string, string> = {};
  if (nutrition.calories) result.calories = String(nutrition.calories).replace(/[^\d.,]/g, '') + ' kcal';
  if (nutrition.proteinContent) result.protein = String(nutrition.proteinContent).replace(/[^\d.,]/g, '') + 'g';
  if (nutrition.carbohydrateContent) result.carbs = String(nutrition.carbohydrateContent).replace(/[^\d.,]/g, '') + 'g';
  if (nutrition.fatContent) result.fat = String(nutrition.fatContent).replace(/[^\d.,]/g, '') + 'g';
  if (nutrition.sugarContent) result.sugar = String(nutrition.sugarContent).replace(/[^\d.,]/g, '') + 'g';
  if (nutrition.sodiumContent) result.salt = String(nutrition.sodiumContent).replace(/[^\d.,]/g, '') + 'g';
  return result;
}
