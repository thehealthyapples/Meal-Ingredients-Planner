/**
 * meal-analysis.ts — the single owner of post-create meal derivation
 * ===================================================================
 * When a meal is created, two facts are DERIVED from its ingredients rather than supplied:
 *
 *   1. its `nutrition` row  — scraped from the recipe source when one exists, otherwise
 *      estimated from OpenFoodFacts per-100 g values scaled by parsed ingredient quantities;
 *   2. its `meal_allergens` rows — keyword-matched over the ingredient list.
 *
 * Before BENCHINT2 this lived inside `server/routes.ts` as a route-local function, reachable only
 * by an HTTP request. The Benchmark World seeder wrote meals through `storage.createMeal` and
 * therefore produced meals with NO nutrition and NO allergens — so the Companion Benchmark was
 * measuring the platform's food reasoning against a world with no food data (BENCHINT1 D2).
 *
 * This module is a VERBATIM extraction. No behaviour changed, no rule moved, no threshold was
 * retuned. It is the one owner of meal derivation, and both the meals route and the seeder now
 * call it. It is NOT benchmark-aware: nothing here branches on who is calling.
 *
 * Concurrency and memoisation are preserved exactly as the route had them:
 *   - `analyzedMealIds` suppresses repeat analysis of the same meal within a process lifetime.
 *     Callers that invalidate a meal's nutrition must call `forgetAnalyzedMeal` first, exactly as
 *     the route always did.
 *   - `MAX_CONCURRENT_ANALYSES` bounds in-flight analyses; over the limit, a call returns without
 *     analysing. Sequential `await`ed callers (the seeder) are never affected by this.
 *
 * Extracted under BENCHINT2 (2026-07-10). See
 * docs/implementation/benchmarking/BENCHINT2_BENCHMARK_RUNTIME_CONVERGENCE.md.
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { storage } from "../storage.js";
import {
  isMacroLine,
  extractNutritionFromText,
  extractJsonLdRecipe,
  extractJsonLdNutrition,
} from "./recipe-scraping.js";

// ---------------------------------------------------------------------------
// Ingredient quantity resolution
// ---------------------------------------------------------------------------

/** Per-unit weight in grams (liquids treated as density ≈ 1 g/ml). */
const UNIT_GRAMS: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  mg: 0.001,
  ml: 1, milliliter: 1, millilitre: 1, milliliters: 1, millilitres: 1,
  l: 1000, liter: 1000, litre: 1000, liters: 1000, litres: 1000,
  tsp: 5, tsps: 5, teaspoon: 5, teaspoons: 5,
  tbsp: 15, tbsps: 15, tablespoon: 15, tablespoons: 15,
  cup: 240, cups: 240,
  oz: 28.35, ounce: 28.35, ounces: 28.35,
  lb: 453.59, lbs: 453.59, pound: 453.59, pounds: 453.59,
  'fl oz': 29.57,
  // pinch / dash / handful intentionally excluded: quantities are indeterminate
  // and including them fabricated false nutrition precision.
};

/**
 * Descriptive household units whose gram equivalent cannot be reliably
 * determined. Ingredients described with these words must be excluded from
 * nutrition totals rather than silently receiving a heuristic estimate.
 */
const DESCRIPTIVE_UNITS_RE = /\b(pinch(?:es)?|dash(?:es)?|handful(?:s)?|splash(?:es)?|drizzle[ds]?|knob)\b/i;

/** Returns true when an ingredient uses a vague descriptive unit that cannot
 *  be reliably converted to grams. Such ingredients are excluded from nutrition. */
export function isDescriptiveUnitIngredient(ingredient: string): boolean {
  return DESCRIPTIVE_UNITS_RE.test(ingredient);
}

/** Normalises vulgar fractions (½, ¼, …) and slash fractions (1/2) to decimal strings. */
function normalizeFractions(text: string): string {
  const VULGAR: Record<string, string> = {
    '½': '0.5', '¼': '0.25', '¾': '0.75',
    '⅓': '0.333', '⅔': '0.667', '⅛': '0.125',
    '⅜': '0.375', '⅝': '0.625', '⅞': '0.875',
  };
  let r = text;
  for (const [f, d] of Object.entries(VULGAR)) r = r.split(f).join(d);
  // "1/2" → "0.5"
  r = r.replace(/\b(\d+)\/(\d+)\b/g, (_, n, d) => String(Number(n) / Number(d)));
  // mixed number: "1 0.5" (after vulgar substitution) → "1.5"
  r = r.replace(/\b(\d+)\s+(0\.\d+)\b/g, (_, w, f) => String(Number(w) + Number(f)));
  return r;
}

/** Parses an ingredient string and returns the quantity in grams (or ml for liquids).
 *  Returns null when no recognisable quantity + unit is present. */
export function parseIngredientGrams(ingredient: string): number | null {
  const text = normalizeFractions(ingredient);
  const unitAlt = Object.keys(UNIT_GRAMS)
    .sort((a, b) => b.length - a.length)                        // longest first
    .map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))        // regex-escape
    .join('|');
  const m = text.match(new RegExp(`(\\d+\\.?\\d*)\\s*(${unitAlt})\\b`, 'i'));
  if (!m) return null;
  return parseFloat(m[1]) * (UNIT_GRAMS[m[2].toLowerCase()] ?? 1);
}

/**
 * Returns a sensible fallback gram weight for an ingredient when no explicit
 * quantity could be parsed. First matching category wins.
 *
 * Gram targets are intentionally conservative — they reflect a realistic
 * single-recipe usage amount for each ingredient class, not a serving size.
 */
export function fallbackIngredientGrams(ingredient: string): number {
  const s = ingredient.toLowerCase();

  // ── Spices, ground spices, dried herbs ── ~½–1 tsp (≈2 g)
  if (
    /\b(turmeric|paprika|cumin|coriander|cinnamon|cardamom|nutmeg|cayenne|oregano|thyme|rosemary|sage|dill|tarragon|fenugreek|allspice|sumac|garam\s+masala|curry\s+powder|ras\s+el\s+hanout|smoked\s+paprika|chilli?\s+flakes?|dried\s+herbs?|mixed\s+herbs?|herb\s+mix|spice\s+mix|bay\s+lea(f|ves))\b/.test(s) ||
    (/\bpepper\b/.test(s) && !/\b(bell|sweet|chilli?)\s+pepper\b/.test(s)) ||
    (/\bginger\b/.test(s) && /\bpowder\b/.test(s))
  ) return 2;

  // ── Garlic (whole / minced, not powder) ── ~1 clove (≈6 g)
  if (/\bgarlic\b/.test(s) && !/\bgarlic\s+powder\b/.test(s)) return 6;

  // ── Superfood / supplement powders ── ~1 tsp (≈5 g)
  if (
    /\b(spirulina|matcha|cacao\s+powder|cocoa\s+powder|protein\s+powder|whey|pea\s+protein|collagen|beetroot\s+powder|mushroom\s+powder|wheatgrass|barley\s+grass|maca|moringa|acai|chlorella|spinach\s+powder|kale\s+powder|greens?\s+powder|superfood\s+powder)\b/.test(s)
  ) return 5;

  // ── Extracts, essences, flavourings ── a few drops / ml (≈3 g)
  if (/\b(extract|essence|flavou?ring|vanilla\s+(bean|pod)|food\s+colou?r(ing)?)\b/.test(s)) return 3;

  // ── Oils ── ~1 tsp (≈5 g)
  if (/\b(olive\s+oil|coconut\s+oil|vegetable\s+oil|sunflower\s+oil|sesame\s+oil|rapeseed\s+oil|avocado\s+oil|oil)\b/.test(s)) return 5;

  // ── Small-volume sauces and condiment liquids ── ~2 tsp (≈10 g)
  if (/\b(soy\s+sauce|tamari|fish\s+sauce|worcestershire|hot\s+sauce|vinegar|lemon\s+juice|lime\s+juice)\b/.test(s)) return 10;

  // ── Nut butters, spreads, pastes ── ~1 tbsp (≈15 g)
  if (
    /\b(peanut\s+butter|almond\s+butter|cashew\s+butter|tahini|miso|harissa|sriracha|ketchup|mayonnaise|mayo|mustard|jam|marmalade|maple\s+syrup|agave|chutney|pesto|hummus|honey|syrup)\b/.test(s)
  ) return 15;

  // ── Nuts and seeds ── small handful (≈20 g)
  if (
    /\b(almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|brazil\s+nut|pine\s+nut|peanut|sunflower\s+seed|pumpkin\s+seed|sesame|chia|flax(seed)?|hemp\s+seed|poppy\s+seed)\b/.test(s)
  ) return 20;

  // ── Oats, wholegrains, cereals ── small dry portion (≈40 g)
  if (/\b(oats?|rolled\s+oat|porridge|quinoa|couscous|barley|millet|buckwheat|bulgur|polenta|cornmeal|bran|granola|muesli)\b/.test(s)) return 40;

  // ── Berries and frozen fruit ── good handful (≈80 g)
  if (
    /\b(raspberry|raspberries|blueberr(y|ies)|strawberr(y|ies)|blackberr(y|ies)|cherr(y|ies)|frozen\s+fruit|mixed\s+berr)\b/.test(s)
  ) return 80;

  // ── Fresh / whole fruit ── medium piece (≈80 g)
  if (/\b(mango|banana|apple|pear|peach|plum|apricot|melon|watermelon|grape|kiwi|pineapple)\b/.test(s)) return 80;

  // ── Dairy / plant milks, stock, juice, yoghurt ── small glass (≈100 g)
  if (
    /\b(milk|almond\s+milk|oat\s+milk|soy\s+milk|coconut\s+milk|coconut\s+cream|cream|stock|broth|juice|yoghurt|yogurt|kefir|buttermilk)\b/.test(s)
  ) return 100;

  // ── Vegetables ── modest portion (≈80 g)
  if (
    /\b(spinach|kale|lettuce|chard|cabbage|broccoli|cauliflower|courgette|zucchini|carrot|onion|shallot|leek|celery|tomato|cucumber|avocado|sweet\s+potato|potato|butternut|squash|pumpkin|beetroot|beet|parsnip|turnip|aubergine|eggplant|mushroom|corn|pea|bean|lentil|chickpea|tofu)\b/.test(s)
  ) return 80;

  // ── Generic fallback ──
  return 50;
}

export function cleanIngredientForLookup(ingredient: string): string {
  return ingredient
    .replace(/\(.*?\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\d+[\s/½¼¾⅓⅔⅛]*(?:g|kg|ml|l|fl\s*oz|cups?|tsp|tbsp|teaspoons?|tablespoons?|pounds?|lb|oz|ounces?|pints?|pinch|dash|cloves?|slices?|pieces?|large|medium|small|tins?|cans?|bunche?s?|heads?|stalks?|sticks?|sprigs?|handful|tub)\b/gi, '')
    .replace(/^[\s/]*(?:of\s+)?/i, '')
    .replace(/\s+(?:plus|or|about|approx|approximately|roughly|use|at room temperature|for the)[\s\S]*/i, '')
    .replace(/[½¼¾⅓⅔⅛]+/g, '')
    .replace(/\b\d+[\s/]*\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Derivation 1 — nutrition
// ---------------------------------------------------------------------------

export async function scrapeNutritionFromSource(meal: { id: number; sourceUrl?: string | null; servings?: number | null }): Promise<boolean> {
  if (!meal.sourceUrl) return false;
  try {
    const response = await axios.get(meal.sourceUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'TheHealthyApples/1.0 (+https://thehealthyapples.com; support@thehealthyapples.com)' },
    });
    const $ = cheerio.load(response.data);
    const jsonLdRecipe = extractJsonLdRecipe($);
    let nutritionData: Record<string, string> = {};

    if (jsonLdRecipe?.nutrition) {
      nutritionData = extractJsonLdNutrition(jsonLdRecipe.nutrition);
    }

    if (!nutritionData.calories) {
      const macroTexts: string[] = [];
      $('*').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 0 && text.length < 200 && isMacroLine(text)) {
          macroTexts.push(text);
        }
      });
      nutritionData = extractNutritionFromText(macroTexts);
    }

    if (nutritionData.calories || nutritionData.protein || nutritionData.carbs || nutritionData.fat) {
      await storage.upsertNutrition({
        mealId: meal.id,
        calories: nutritionData.calories || null,
        protein: nutritionData.protein || null,
        carbs: nutritionData.carbs || null,
        fat: nutritionData.fat || null,
        sugar: nutritionData.sugar || null,
        salt: nutritionData.salt || null,
        source: 'recipe_source',
      });
      console.log(`Scraped nutrition from source for meal ${meal.id}: ${JSON.stringify(nutritionData)}`);
      return true;
    }
  } catch (err) {
    console.error(`Failed to scrape nutrition from source for meal ${meal.id}:`, err);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Derivation 2 — allergens, and the combined entry point
// ---------------------------------------------------------------------------

const analyzedMealIds = new Set<number>();
let activeAnalysisCount = 0;
const MAX_CONCURRENT_ANALYSES = 3;

/**
 * Drop a meal from the process-lifetime "already analysed" memo, so the next `autoAnalyzeMeal`
 * re-derives it. Callers invalidate a meal whose ingredients or servings changed, or whose stored
 * nutrition is in a superseded format.
 *
 * This is the same `analyzedMealIds.delete(id)` the route performed inline before the extraction —
 * named, because a private module-level Set cannot be reached from outside.
 */
export function forgetAnalyzedMeal(mealId: number): void {
  analyzedMealIds.delete(mealId);
}

export async function autoAnalyzeMeal(mealId: number) {
  if (analyzedMealIds.has(mealId)) return;
  if (activeAnalysisCount >= MAX_CONCURRENT_ANALYSES) return;
  analyzedMealIds.add(mealId);
  activeAnalysisCount++;
  try {
    const meal = await storage.getMeal(mealId);
    if (!meal) return;

    if (meal.sourceUrl) {
      const scraped = await scrapeNutritionFromSource(meal);
      if (scraped) return;
    }

    const existingNutrition = await storage.getNutrition(mealId);
    // 'openfoodfacts' (no suffix) is the pre-fix format that did not scale by quantity — always re-calculate it.
    const hasValidNutrition = existingNutrition &&
      existingNutrition.calories &&
      parseFloat(existingNutrition.calories) > 0 &&
      existingNutrition.source !== 'openfoodfacts';
    if (hasValidNutrition) return;

    const nutritionTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0 };
    let validResults = 0;
    let anyEstimated = false;

    await Promise.all(
      meal.ingredients.map(async (ingredient) => {
        try {
          const cleanIngredient = cleanIngredientForLookup(ingredient);
          const response = await axios.get(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanIngredient)}&json=1&page_size=3`,
            { timeout: 8000, headers: { 'User-Agent': 'TheHealthyApples/1.0 (+https://thehealthyapples.com; support@thehealthyapples.com)' } }
          );

          const products = response.data.products || [];
          if (products.length === 0) return;

          let count = 0;
          let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0 };

          for (const p of products) {
            const n = p.nutriments;
            if (!n) continue;
            // Always use the explicit _100g fields to avoid accidentally picking up
            // per-serving or whole-product values from the non-suffixed fields.
            const cal = n['energy-kcal_100g'];
            if (cal) {
              totals.calories += Number(cal) || 0;
              totals.protein += Number(n.proteins_100g) || 0;
              totals.carbs += Number(n.carbohydrates_100g) || 0;
              totals.fat += Number(n.fat_100g) || 0;
              totals.sugar += Number(n.sugars_100g) || 0;
              totals.salt += Number(n.salt_100g) || 0;
              count++;
            }
          }

          if (count > 0) {
            // Descriptive units (pinch, dash, handful, splash, drizzle, knob)
            // cannot be reliably converted to grams — exclude from totals.
            if (isDescriptiveUnitIngredient(ingredient)) return;

            // Scale from per-100 g to the actual quantity used in the recipe.
            const quantityGrams = parseIngredientGrams(ingredient);
            if (quantityGrams === null) anyEstimated = true;
            const grams = quantityGrams ?? fallbackIngredientGrams(ingredient);
            const scale = grams / 100;

            nutritionTotals.calories += (totals.calories / count) * scale;
            nutritionTotals.protein += (totals.protein / count) * scale;
            nutritionTotals.carbs += (totals.carbs / count) * scale;
            nutritionTotals.fat += (totals.fat / count) * scale;
            nutritionTotals.sugar += (totals.sugar / count) * scale;
            nutritionTotals.salt += (totals.salt / count) * scale;
            validResults++;
          }
        } catch {}
      })
    );

    const servings = meal.servings && meal.servings > 0 ? meal.servings : 1;
    if (validResults > 0) {
      const nutritionData = {
        mealId,
        calories: `${Math.round(nutritionTotals.calories / servings)} kcal`,
        protein: `${Math.round(nutritionTotals.protein / servings * 10) / 10}g`,
        carbs: `${Math.round(nutritionTotals.carbs / servings * 10) / 10}g`,
        fat: `${Math.round(nutritionTotals.fat / servings * 10) / 10}g`,
        sugar: `${Math.round(nutritionTotals.sugar / servings * 10) / 10}g`,
        salt: `${Math.round(nutritionTotals.salt / servings * 10) / 10}g`,
        // Distinguish estimated (fallback quantities used) from quantity-derived results.
        source: anyEstimated ? 'openfoodfacts_estimated' : 'openfoodfacts_quantities',
      };

      await storage.upsertNutrition(nutritionData);
    }

    const COMMON_ALLERGENS_LIST = [
      { name: 'milk', keywords: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'yoghurt', 'whey', 'casein', 'lactose', 'ghee', 'curd'] },
      { name: 'eggs', keywords: ['egg', 'eggs', 'mayonnaise', 'meringue', 'albumin'] },
      { name: 'fish', keywords: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'anchovies', 'sardine', 'mackerel', 'trout', 'bass', 'haddock', 'halibut'] },
      { name: 'shellfish', keywords: ['shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'squid', 'calamari'] },
      { name: 'nuts', keywords: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'macadamia', 'hazelnut', 'brazil nut', 'pine nut'] },
      { name: 'peanuts', keywords: ['peanut', 'peanuts', 'groundnut'] },
      { name: 'soy', keywords: ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce'] },
      { name: 'wheat', keywords: ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'couscous', 'semolina', 'breadcrumb'] },
      { name: 'gluten', keywords: ['gluten', 'wheat', 'barley', 'rye', 'oat', 'flour', 'bread', 'pasta', 'noodle', 'couscous', 'semolina'] },
    ];

    const allergens = new Set<string>();
    const combined = meal.ingredients.join(' ').toLowerCase();
    for (const allergen of COMMON_ALLERGENS_LIST) {
      for (const keyword of allergen.keywords) {
        if (combined.includes(keyword)) {
          allergens.add(allergen.name);
          break;
        }
      }
    }
    await storage.setMealAllergens(mealId, Array.from(allergens));

    console.log(`Auto-analysis complete for meal ${mealId}`);
  } catch (err) {
    console.error(`Auto-analysis failed for meal ${mealId}:`, err);
  } finally {
    activeAnalysisCount--;
  }
}
