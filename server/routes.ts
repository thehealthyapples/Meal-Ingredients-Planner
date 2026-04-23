import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import axios from "axios";
import * as cheerio from "cheerio";
import { parseIngredient, consolidateIngredients, formatQuantityMetric, formatQuantityImperial, detectIngredientCategory, isGarbageIngredient } from "./lib/ingredient-utils";
import { lookupPricesForIngredient } from "./lib/price-lookup";
import { consolidateAndNormalize, normalizeIngredient, convertToGrams } from "./lib/ingredient-normalization-service";
import { matchProductsForIngredient } from "./lib/product-matching-service";
import { analyzeProduct } from "./lib/product-analysis";
import { sendBasketToSupermarket, getSupportedSupermarkets } from "./lib/grocery-integration";
import { filterMealsByPreferences, rankMealsByPreferences } from "./lib/recommendation-service";
import { analyzeProductUPF, buildTHAExplanation } from "./lib/upf-analysis-service";
import { isWholeFoodIngredient } from "./lib/smp-rating-service";
import { createBasket, getBasketSupermarkets } from "./lib/supermarket-basket-service";
import { generateSmartSuggestion, type SmartSuggestSettings, type LockedEntry } from "./lib/smart-suggest-service";
import { searchAllRecipes, searchJamieOliver, searchSeriousEats, searchEdamam, searchApiNinjas, searchBigOven, searchFatSecret, type ExternalMealCandidate } from "./lib/external-meal-service";
import { seedSourceSettings, isSourceCallable, getSourceKeyForUrl, logAuditEvent, getAllSourceSettings, updateSourceSettings, getAuditLogs } from "./lib/recipe-source-gate";
import { shouldExcludeRecipe, scoreRecipeForDiet } from "./lib/dietRules";
import { expandSearchQuery, correctFoodSpelling } from "@shared/food-synonyms";
import { parseIngredient as parseIngredientShared } from "@shared/parse-ingredient";
import { INGREDIENT_TAXONOMY } from "@shared/ingredient-taxonomy";
import { normalizeIngredientKey } from "@shared/normalize";
import { lookupFoodConstruct, isLikelyFoodConstruct, logUnrecognisedConstruct, logConstructMappingFailure } from "@shared/food-constructs";
import { insertMealTemplateSchema, insertMealTemplateProductSchema, insertFreezerMealSchema, updateMealSchema } from "@shared/schema";
import { importGlobalMeals, getImportStatus } from "./lib/openfoodfacts-importer";
import { sanitizeUser } from "./lib/sanitizeUser";
import { classifyAndEnrich, lookupClassification, updateClassification, applyClassificationToItems } from "./lib/classification-store";
import { runBackfill } from "./lib/backfill-classifier";
import { runCategoryNormalisation } from "./lib/normalise-categories";
import { isAdmin, hasPremiumAccess, assertAdmin } from "./lib/access";
import { enrichRetailData, STORE_TAG_MAP, UK_RETAILER_STORE_TAGS } from "./lib/retailIntelligence";
import { getCanonicalProduct, isCompatibleSwap } from "./lib/productCanonicaliser";
import { getHouseholdForUser } from "./lib/household";
import { pool } from "./db";
import { SAVINGS_RATES } from "./lib/savings-config";
import multer from "multer";
import { extractTextFromImage, OcrError } from "./services/ocr";
import { parseScannedText } from "./services/recipeParser";
import { isLikelyNonEnglishIngredients, hasEnglishIngredients } from "./lib/ingredient-language";

// ---------------------------------------------------------------------------

function ingredientMatchesMeal(consolidatedName: string, mealIngredients: string[]): boolean {
  const target = consolidatedName.toLowerCase().trim();
  if (target.length < 2) return false;

  for (const ing of mealIngredients) {
    const parsed = parseIngredient(ing);
    const norm = (parsed.normalizedName || parsed.name).toLowerCase().trim();
    if (norm.length < 2) continue;

    if (norm === target) return true;

    if (target.length >= 6 && norm.length >= 6) {
      if (norm.includes(target) || target.includes(norm)) return true;
    }

    const targetTokens = target.split(/\s+/).filter(t => t.length > 2);
    const normTokens = norm.split(/\s+/).filter(t => t.length > 2);
    if (targetTokens.length > 0 && normTokens.length > 0) {
      const commonCount = targetTokens.filter(t => normTokens.some(n => n === t)).length;
      const matchRatio = commonCount / Math.min(targetTokens.length, normTokens.length);
      if (matchRatio >= 0.6 && commonCount >= 1) return true;
    }
  }
  return false;
}

const MACRO_KEYWORDS = [
  'calories', 'cal', 'energy', 'protein', 'fat', 'carbs', 'carbohydrates',
  'sugar', 'salt', 'sodium', 'nutrition', 'per serving', 'kcal', 'kj',
  'fiber', 'fibre', 'saturated', 'cholesterol', 'vitamin', 'mineral',
  'daily value', 'serving size', 'servings per'
];

function isMacroLine(text: string): boolean {
  const lower = text.toLowerCase();
  return MACRO_KEYWORDS.some(keyword => lower.includes(keyword));
}

interface NormalizedRecipe {
  id: string;
  name: string;
  image: string | null;
  url: string | null;
  category: string | null;
  cuisine: string | null;
  ingredients: string[];
  instructions: string[];
  source: string;
}

async function searchBBCGoodFood(query: string): Promise<NormalizedRecipe[]> {
  try {
    const response = await fetch(
      `https://www.bbcgoodfood.com/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!response.ok) return [];
    const html = await response.text();

    const $ = cheerio.load(html);
    const recipes: NormalizedRecipe[] = [];
    const seen = new Set<string>();

    $('article.card').each((_, el) => {
      const card = $(el);
      const titleLink = card.find('a[href*="/recipes/"]').filter((__, a) => {
        const href = $(a).attr('href') || '';
        return href.match(/\/recipes\/[a-z0-9-]+$/) !== null && !href.includes('collection');
      }).first();

      const href = titleLink.attr('href');
      if (!href || seen.has(href)) return;
      seen.add(href);

      const name = card.find('h2').first().text().trim().replace(/^App only/i, '').trim();
      if (!name) return;

      const img = card.find('img').first();
      let imageUrl = img.attr('src') || '';
      if (imageUrl) {
        imageUrl = imageUrl.split('?')[0] + '?quality=90&resize=440,400';
      }

      const fullUrl = href.startsWith('http') ? href : `https://www.bbcgoodfood.com${href}`;

      recipes.push({
        id: `bbcgf-${href.split('/').pop()}`,
        name,
        image: imageUrl || null,
        url: fullUrl,
        category: null,
        cuisine: 'British',
        ingredients: [],
        instructions: [],
        source: 'BBC Good Food',
      });
    });

    return recipes.slice(0, 10);
  } catch {
    return [];
  }
}

function candidateToRecipe(c: ExternalMealCandidate): NormalizedRecipe {
  return {
    id: c.externalId,
    name: c.name,
    image: c.image,
    url: c.sourceUrl,
    category: c.category,
    cuisine: c.cuisine,
    ingredients: c.ingredients,
    instructions: c.instructions,
    source: c.source,
  };
}

function extractMealDbIngredients(meal: any): string[] {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = (meal[`strIngredient${i}`] || '').trim();
    const measure = (meal[`strMeasure${i}`] || '').trim();
    if (ingredient) {
      ingredients.push(measure ? `${measure} ${ingredient}` : ingredient);
    }
  }
  return ingredients;
}

function extractNutritionFromText(texts: string[]): Record<string, string> {
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

interface JsonLdRecipe {
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

function parseSocialCaption(rawText: string): {
  title: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
} {
  // Strip Instagram/TikTok metadata prefixes before parsing:
  //   "6,068 likes, 166 comments - quotidianrecipes on March 7, 2026: \"..."
  //   "accountname on Instagram: \"..."
  let text = rawText
    // Remove engagement counts: "6,068 likes, 166 comments - "
    .replace(/^[\d,]+\s+likes?,\s+[\d,]+\s+comments?\s*[-–]\s*/i, '')
    // Remove "username on Instagram:", "username on TikTok:", "username on Month D, YYYY:"
    .replace(/^[^\n:]+\bon\s+(?:instagram|tiktok|[A-Za-z]+\s+\d{1,2},\s+\d{4})\s*:\s*["""\u201c\\]?\s*/i, '')
    // Remove any remaining leading quote or escaped quote
    .replace(/^["""\u201c\\]/, '')
    .replace(/["""\u201d]\s*$/, '')
    .trim();

  const lines = text.split(/\r?\n/).map(l => l.trim());

  // Stop before hashtag footer or promotional lines
  const stopRe = [/^#\w/, /^follow\b/i, /^save\b.*(?:recipe|this)/i, /^tag\b.*friend/i, /^link in bio/i];
  const stopIdx = lines.findIndex(l => stopRe.some(p => p.test(l)));
  const workLines = stopIdx > -1 ? lines.slice(0, stopIdx) : lines;

  const ingredientsHeaderRe = /^(ingredients?|what\s+you(?:'ll)?\s+need|you(?:'ll)?\s+need)\s*:?\s*$/i;
  const instructionsHeaderRe = /^(instructions?|method|directions?|steps?|how\s+to(?:\s+make)?|to\s+make|preparation)\s*:?\s*$/i;
  const metaLineRe = /^(?:prep|cook|total)\s*time\s*:|^servings?\s*:|^serves?\s*:|^makes?\s*:/i;

  let ingredientsIdx = -1;
  let instructionsIdx = -1;
  workLines.forEach((line, i) => {
    if (ingredientsIdx === -1 && ingredientsHeaderRe.test(line)) ingredientsIdx = i;
    if (instructionsIdx === -1 && instructionsHeaderRe.test(line)) instructionsIdx = i;
  });

  // Title: first substantive non-meta line before any section header
  const firstHeaderIdx = [ingredientsIdx, instructionsIdx]
    .filter(i => i > 0)
    .sort((a, b) => a - b)[0] ?? workLines.length;
  const rawTitle = workLines
    .slice(0, firstHeaderIdx)
    .find(l => l.length > 2 && !metaLineRe.test(l)) ?? '';
  // Strip leading bullets/quotes, then strip emojis — keep emoji-free version if still meaningful
  const stripped = rawTitle
    .replace(/^[\-\*•·]\s*/, '')
    .replace(/^[""\\]/, '').replace(/[""\\]$/, '')
    .trim();
  // Strip emoji via surrogate pairs (ES5-compatible, no u flag needed)
  const noEmoji = stripped.replace(/[\uD800-\uDFFF]|[\u2600-\u27FF]/g, '').trim();
  const title = (noEmoji.length > 2 ? noEmoji : stripped) || 'Imported Recipe';

  // Ingredients: from header+1 to instructions header (or end)
  const ingredientsEnd = instructionsIdx > ingredientsIdx && instructionsIdx > -1
    ? instructionsIdx
    : workLines.length;
  const ingredients: string[] = ingredientsIdx > -1
    ? workLines
        .slice(ingredientsIdx + 1, ingredientsEnd)
        .filter(l => l.length > 1 && !metaLineRe.test(l))
        .map(l => l.replace(/^[\-\*•·]\s*/, '').replace(/^\d+[.\)]\s*/, '').trim())
        .filter(l => l.length > 1)
    : [];

  // Instructions: from header+1 to end
  const instructions: string[] = instructionsIdx > -1
    ? workLines
        .slice(instructionsIdx + 1)
        .filter(l => l.length > 3 && !metaLineRe.test(l))
        .map(l => l.replace(/^\d+[.\)]\s*/, '').trim())
        .filter(l => l.length > 3)
    : [];

  // Servings
  let servings = 1;
  const servingsLine = workLines.find(l => /^(?:servings?|serves?|makes?)\s*:?\s*\d+/i.test(l));
  if (servingsLine) {
    const m = servingsLine.match(/\d+/);
    if (m) servings = parseInt(m[0], 10) || 1;
  }

  return { title, ingredients, instructions, servings };
}

function extractJsonLdRecipe($: cheerio.CheerioAPI): JsonLdRecipe | null {
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

function extractJsonLdInstructions(instructions: any): string[] {
  if (!instructions) return [];

  const processItem = (item: any): string[] => {
    if (typeof item === 'string') {
      const cleaned = item.replace(/<[^>]+>/g, '').trim();
      return cleaned ? [cleaned] : [];
    }
    if (item && typeof item === 'object') {
      if (item['@type'] === 'HowToSection' && Array.isArray(item.itemListElement)) {
        const results: string[] = [];
        for (const subStep of item.itemListElement) {
          results.push(...processItem(subStep));
        }
        return results;
      }
      const text = (item.text || item.name || '').replace(/<[^>]+>/g, '').trim();
      return text ? [text] : [];
    }
    return [];
  };

  if (Array.isArray(instructions)) {
    const result: string[] = [];
    for (const step of instructions) {
      result.push(...processItem(step));
    }
    return result;
  }

  return processItem(instructions);
}

function extractJsonLdImage(recipe: JsonLdRecipe): string | null {
  if (!recipe.image) return null;
  if (typeof recipe.image === 'string') return recipe.image;
  if (Array.isArray(recipe.image)) {
    const first = recipe.image[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) return first.url;
  }
  if (typeof recipe.image === 'object' && 'url' in (recipe.image as any)) {
    return (recipe.image as any).url;
  }
  return null;
}

function extractJsonLdNutrition(nutrition: Record<string, any> | undefined): Record<string, string> {
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
  pinch: 0.5, dash: 0.6, handful: 30,
};

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
function parseIngredientGrams(ingredient: string): number | null {
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
function fallbackIngredientGrams(ingredient: string): number {
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

function cleanIngredientForLookup(ingredient: string): string {
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

async function scrapeNutritionFromSource(meal: { id: number; sourceUrl?: string | null; servings?: number | null }): Promise<boolean> {
  if (!meal.sourceUrl) return false;
  try {
    const response = await axios.get(meal.sourceUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartMealPlanner/1.0)' },
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

const analyzedMealIds = new Set<number>();
let activeAnalysisCount = 0;
const MAX_CONCURRENT_ANALYSES = 3;

async function autoAnalyzeMeal(mealId: number) {
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
            `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(cleanIngredient)}&json=1&page_size=3`,
            { timeout: 8000, headers: { 'User-Agent': 'SmartMealPlanner/1.0' } }
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Seed default recipe source settings (idempotent)
  seedSourceSettings().catch(e => console.warn("[recipe-source-gate] Seed failed:", e));

  function buildProfileResponse(user: any, prefs: any) {
    const heightCm = prefs?.heightCm || null;
    const weightKg = prefs?.weightKg || null;
    let bmi: number | null = null;
    let bmiCategory = "";
    if (heightCm && weightKg && heightCm > 0) {
      bmi = Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
      if (bmi < 18.5) bmiCategory = "Underweight";
      else if (bmi < 25) bmiCategory = "Healthy";
      else if (bmi < 30) bmiCategory = "Overweight";
      else bmiCategory = "Obese";
    }

    let calculatedCalories: number | null = null;
    if (weightKg && heightCm) {
      const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 - 78;
      const activityMultipliers: Record<string, number> = {
        low: 1.2, moderate: 1.55, high: 1.725,
      };
      const multiplier = activityMultipliers[prefs?.activityLevel || "moderate"] || 1.55;
      calculatedCalories = Math.round(bmr * multiplier);
      const goal = prefs?.goalType || "maintain";
      if (goal === "lose") calculatedCalories = Math.round(calculatedCalories * 0.85);
      else if (goal === "build") calculatedCalories = Math.round(calculatedCalories * 1.15);
    }

    const dailyCalories = prefs?.calorieMode === "manual"
      ? (prefs?.calorieTarget || calculatedCalories)
      : calculatedCalories;

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName ?? null,
      displayName: user.displayName || user.username,
      profilePhotoUrl: user.profilePhotoUrl,
      measurementPreference: user.measurementPreference,
      isBetaUser: user.isBetaUser,
      role: user.role ?? "user",
      subscriptionTier: user.subscriptionTier ?? "free",
      hasPremiumAccess: hasPremiumAccess(user),
      dietPattern: user.dietPattern ?? null,
      dietRestrictions: user.dietRestrictions ?? [],
      eatingSchedule: user.eatingSchedule ?? null,
      customMetricDefs: (user.customMetricDefs as Array<{ id: string; name: string; unit: string }> | null) ?? [],
      diaryExtraMetrics: (user.diaryExtraMetrics as string[] | null) ?? [],
      preferences: prefs || {},
      health: {
        bmi,
        bmiCategory,
        dailyCalories,
        calculatedCalories,
        heightCm,
        weightKg,
        activityLevel: prefs?.activityLevel || "moderate",
        goalType: prefs?.goalType || "maintain",
      },
      household: {
        adultsCount: prefs?.adultsCount ?? 1,
        childrenCount: prefs?.childrenCount ?? 0,
        babiesCount: prefs?.babiesCount ?? 0,
        mealMode: prefs?.mealMode ?? "exact",
        maxExtraPrepMinutes: prefs?.maxExtraPrepMinutes ?? null,
        maxTotalCookTime: prefs?.maxTotalCookTime ?? null,
        preferLessProcessed: prefs?.preferLessProcessed ?? false,
      },
    };
  }

  app.get('/api/profile', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.getUser(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const prefs = await storage.getUserPreferences(req.user!.id);
    res.json(buildProfileResponse(user, prefs));
  });

  const ALLOWED_DIET_PATTERNS = ["Mediterranean", "DASH", "MIND", "Flexitarian", "Vegetarian", "Vegan", "Keto", "Low-Carb", "Paleo", "Carnivore"] as const;
  const ALLOWED_DIET_RESTRICTIONS = ["Gluten-Free", "Dairy-Free"] as const;
  const ALLOWED_EATING_SCHEDULES = ["None", "Intermittent Fasting"] as const;

  const profileUpdateSchema = z.object({
    firstName: z.string().nullable().optional(),
    displayName: z.string().optional(),
    profilePhotoUrl: z.string().nullable().optional(),
    dietPattern: z.enum(ALLOWED_DIET_PATTERNS).nullable().optional(),
    dietRestrictions: z.array(z.enum(ALLOWED_DIET_RESTRICTIONS)).optional(),
    eatingSchedule: z.enum(ALLOWED_EATING_SCHEDULES).nullable().optional(),
    customMetricDefs: z.array(z.object({ id: z.string(), name: z.string(), unit: z.string() })).optional(),
    diaryExtraMetrics: z.array(z.string()).optional(),
    preferences: z.object({
      calorieMode: z.enum(["auto", "manual"]).optional(),
      calorieTarget: z.number().optional(),
      heightCm: z.number().nullable().optional(),
      weightKg: z.number().nullable().optional(),
      activityLevel: z.enum(["low", "moderate", "high"]).optional(),
      goalType: z.enum(["lose", "maintain", "build", "health"]).optional(),
      adultsCount: z.number().int().min(1).optional(),
      childrenCount: z.number().int().min(0).optional(),
      babiesCount: z.number().int().min(0).optional(),
      dietTypes: z.array(z.string()).optional(),
      healthGoals: z.array(z.string()).optional(),
      budgetLevel: z.string().optional(),
      preferredStores: z.array(z.string()).optional(),
      upfSensitivity: z.string().optional(),
      qualityPreference: z.string().optional(),
      soundEnabled: z.boolean().optional(),
      eliteTrackingEnabled: z.boolean().optional(),
      healthTrendEnabled: z.boolean().optional(),
      barcodeScannerEnabled: z.boolean().optional(),
      mealMode: z.enum(["exact", "shared-with-swaps"]).optional(),
      maxExtraPrepMinutes: z.number().int().min(0).nullable().optional(),
      maxTotalCookTime: z.number().int().min(0).nullable().optional(),
      preferLessProcessed: z.boolean().optional(),
    }).optional(),
  });

  app.put('/api/profile', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = profileUpdateSchema.parse(req.body);

      const profileFields: Partial<Parameters<typeof storage.updateUserProfile>[1]> = {};
      if (parsed.firstName !== undefined) profileFields.firstName = parsed.firstName;
      if (parsed.displayName !== undefined) profileFields.displayName = parsed.displayName;
      if (parsed.profilePhotoUrl !== undefined) profileFields.profilePhotoUrl = parsed.profilePhotoUrl;
      if (parsed.dietPattern !== undefined) profileFields.dietPattern = parsed.dietPattern;
      if (parsed.dietRestrictions !== undefined) profileFields.dietRestrictions = parsed.dietRestrictions;
      if (parsed.eatingSchedule !== undefined) profileFields.eatingSchedule = parsed.eatingSchedule;
      if (parsed.customMetricDefs !== undefined) profileFields.customMetricDefs = parsed.customMetricDefs;
      if (parsed.diaryExtraMetrics !== undefined) profileFields.diaryExtraMetrics = parsed.diaryExtraMetrics;
      if (Object.keys(profileFields).length > 0) {
        await storage.updateUserProfile(req.user!.id, profileFields);
      }

      if (parsed.preferences) {
        await storage.upsertUserPreferences(req.user!.id, parsed.preferences as any);
      }

      const user = await storage.getUser(req.user!.id);
      const prefs = await storage.getUserPreferences(req.user!.id);

      const profileResponse = buildProfileResponse(user!, prefs);
      res.json(profileResponse);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: err.errors });
      }
      console.error("Error updating profile:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch('/api/user/preferences', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { measurementPreference } = req.body;
    if (!measurementPreference || !['metric', 'imperial'].includes(measurementPreference)) {
      return res.status(400).json({ message: 'Invalid preference. Must be "metric" or "imperial".' });
    }
    const user = await storage.updateUserPreference(req.user!.id, measurementPreference);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ measurementPreference: user.measurementPreference });
  });

  app.get(api.categories.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const categories = await storage.getAllCategories();
    res.json(categories);
  });

  app.get(api.basket.supermarkets.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(getSupportedSupermarkets());
  });

  app.post(api.basket.send.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = api.basket.send.input.parse(req.body);
      const whiskApiKey = process.env.WHISK_API_KEY;
      const result = await sendBasketToSupermarket(parsed.supermarket, parsed.items, whiskApiKey);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to send basket" });
    }
  });

  app.post(api.basket.checkout.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = api.basket.checkout.input.parse(req.body);
      const items = await storage.getShoppingListItems(req.user!.id);
      if (items.length === 0) {
        return res.status(400).json({ message: "Basket is empty" });
      }

      const basketItems = items.map(item => ({
        name: item.productName,
        quantity: item.quantityValue || 1,
        unit: item.unit || 'unit',
      }));

      const { generateCheckoutUrls } = await import("./lib/price-lookup");
      const urls = generateCheckoutUrls(basketItems, parsed.supermarket);

      res.json({
        success: true,
        supermarket: parsed.supermarket,
        checkoutUrls: urls,
        itemCount: items.length,
        message: urls.length < items.length
          ? `Opening ${urls.length} of ${items.length} items on ${parsed.supermarket}`
          : `Opening ${urls.length} items on ${parsed.supermarket}`,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post('/api/basket/create', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { supermarket } = req.body;
      if (!supermarket || typeof supermarket !== 'string') {
        return res.status(400).json({ message: "Supermarket name is required" });
      }

      const items = await storage.getShoppingListItems(req.user!.id);
      if (items.length === 0) {
        return res.status(400).json({ message: "Basket is empty" });
      }

      const allMatches = await storage.getProductMatchesForUser(req.user!.id);
      const tier = req.user!.preferredPriceTier || 'standard';
      const result = createBasket(supermarket, items, allMatches, tier);

      res.json(result);
    } catch (err) {
      console.error("Error creating basket:", err);
      res.status(500).json({ message: "Failed to create basket" });
    }
  });

  app.post(api.basket.updateStore.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { store } = api.basket.updateStore.input.parse(req.body);
      await storage.batchUpdateShoppingListStore(req.user!.id, store);
      res.json({ success: true, store });
    } catch (err) {
      console.error("Error updating global store:", err);
      res.status(500).json({ message: "Failed to update store" });
    }
  });

  app.get('/api/basket/supermarkets-enhanced', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(getBasketSupermarkets());
  });

  app.get(api.supermarkets.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const supermarkets = await storage.getAllSupermarkets();
      res.json(supermarkets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supermarkets" });
    }
  });

  app.get(api.supermarkets.byCountry.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const country = req.params.country.toUpperCase();
      const supermarkets = await storage.getSupermarketsByCountry(country);
      res.json(supermarkets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supermarkets" });
    }
  });

  app.get(api.meals.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // TODO [PREMIUM]: hasPremiumAccess(user) — enforce >3 meals limit for free users
    const [userMeals, systemMeals] = await Promise.all([
      storage.getMeals(req.user!.id),
      storage.getSystemMeals(),
    ]);
    res.json([...userMeals, ...systemMeals]);
  });

  app.get("/api/meals/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const [userMeals, systemMeals] = await Promise.all([
      storage.getMealsSummary(req.user!.id),
      storage.getSystemMealsSummary(),
    ]);
    res.json([...userMeals, ...systemMeals]);
  });

  app.get(api.meals.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const meal = await storage.getMeal(Number(req.params.id));
    
    if (!meal || (meal.userId !== req.user!.id && !meal.isSystemMeal)) {
      return res.status(404).json({ message: "Meal not found" });
    }
    
    res.json(meal);
  });

  app.post(api.meals.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const input = api.meals.create.input.parse(req.body);
      const { nutrition: nutritionData, ...mealData } = input;
      if ((mealData as any).kind === 'component' && req.user!.role !== 'admin') {
        (mealData as any).kind = 'meal';
      }
      const meal = await storage.createMeal(req.user!.id, mealData);
      
      if (nutritionData && Object.values(nutritionData).some(v => v)) {
        await storage.createNutrition({
          mealId: meal.id,
          ...nutritionData,
          source: 'recipe_source',
        });
      }
      
      res.status(201).json(meal);
      
      if (!nutritionData || !Object.values(nutritionData).some(v => v)) {
        autoAnalyzeMeal(meal.id).catch(() => {});
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.meals.saveProduct.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const input = api.meals.saveProduct.input.parse(req.body);

      const audience = input.isBabyFood ? 'baby' : 'adult';
      const meal = await storage.createMeal(req.user!.id, {
        name: input.name,
        ingredients: [],
        instructions: input.quantity ? [`Product: ${input.quantity}`] : [],
        imageUrl: input.imageUrl,
        servings: 1,
        categoryId: input.categoryId ?? null,
        isDrink: input.isDrink,
        isReadyMeal: input.isReadyMeal,
        audience,
        barcode: input.barcode,
        brand: input.brand,
        mealSourceType: 'openfoodfacts',
        isFreezerEligible: false,
      });

      if (input.nutrition && Object.values(input.nutrition).some(v => v)) {
        await storage.createNutrition({
          mealId: meal.id,
          ...input.nutrition,
          source: 'openfoodfacts_product',
        });
      }

      res.status(201).json(meal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.meals.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meal = await storage.getMeal(Number(req.params.id));
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }
    if (meal.isSystemMeal) {
      return res.status(403).json({ message: "Cannot delete system meals" });
    }

    await storage.deleteMeal(meal.id);
    res.sendStatus(204);
  });

  app.post(api.meals.copy.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const meal = await storage.getMeal(Number(req.params.id));
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }

    const existingEdited = (await storage.getMeals(req.user!.id)).find(
      m => m.originalMealId === meal.id
    );
    if (existingEdited) {
      return res.status(200).json(existingEdited);
    }

    const newMeal = await storage.createMeal(req.user!.id, {
      name: meal.name + " (Edited)",
      ingredients: meal.ingredients,
      instructions: meal.instructions,
      imageUrl: meal.imageUrl,
      servings: meal.servings,
      categoryId: meal.categoryId,
      sourceUrl: meal.sourceUrl,
      originalMealId: meal.id,
    });

    const mealDiets = await storage.getMealDiets(meal.id);
    if (mealDiets.length > 0) {
      await storage.setMealDiets(newMeal.id, mealDiets.map(d => d.dietId));
    }

    const existingNutrition = await storage.getNutrition(meal.id);
    if (existingNutrition) {
      await storage.createNutrition({
        mealId: newMeal.id,
        calories: existingNutrition.calories,
        protein: existingNutrition.protein,
        carbs: existingNutrition.carbs,
        fat: existingNutrition.fat,
        sugar: existingNutrition.sugar,
        salt: existingNutrition.salt,
      });
    }

    res.status(201).json(newMeal);
  });

  app.put(api.meals.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const meal = await storage.getMeal(Number(req.params.id));
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }

    const parsed = updateMealSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    }

    const updateData: Partial<{ name: string; ingredients: string[]; instructions: string[]; servings: number; kind: string }> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.ingredients !== undefined) updateData.ingredients = parsed.data.ingredients;
    if (parsed.data.instructions !== undefined && parsed.data.instructions !== null) updateData.instructions = parsed.data.instructions;
    if (parsed.data.servings !== undefined) updateData.servings = parsed.data.servings;
    if (parsed.data.kind !== undefined) {
      updateData.kind = (parsed.data.kind === 'component' && req.user!.role !== 'admin') ? 'meal' : parsed.data.kind;
    }

    const updated = await storage.updateMeal(meal.id, updateData);
    res.json(updated);
  });

  app.get(api.meals.getEditedCopy.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const originalId = Number(req.params.id);
    const userMeals = await storage.getMeals(req.user!.id);
    const editedCopy = userMeals.find(m => m.originalMealId === originalId);

    if (editedCopy) {
      return res.json({ exists: true, meal: editedCopy });
    }
    return res.json({ exists: false });
  });

  // ── Generate AI meal image ──────────────────────────────────────────────────
  app.post(api.meals.generateImage.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const meal = await storage.getMeal(Number(req.params.id));
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "Image generation is not configured on this server." });
    }

    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Build a short ingredient list for the prompt (top 8, skip amounts/units)
      const ingredientNames = meal.ingredients
        .slice(0, 8)
        .map(ing => {
          // Strip leading amounts/units — keep only the ingredient name portion
          const parts = ing.trim().split(/\s+/);
          // Skip the first token if it looks like a number or fraction
          const nameStart = /^[\d¼½¾⅓⅔]+/.test(parts[0]) ? 1 : 0;
          // Also skip a common unit token immediately after the number
          const units = new Set(["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "cups", "oz", "lb", "lbs", "pinch", "handful", "piece", "pieces", "slice", "slices", "clove", "cloves"]);
          const nameFrom = nameStart < parts.length && units.has(parts[nameStart]?.toLowerCase()) ? nameStart + 1 : nameStart;
          return parts.slice(nameFrom).join(" ").replace(/[,;.]+$/, "").trim();
        })
        .filter(Boolean);

      const ingredientList = ingredientNames.length > 0
        ? ingredientNames.join(", ")
        : "assorted fresh ingredients";

      const prompt = `Professional food photography of ${meal.name}. ` +
        `Key ingredients: ${ingredientList}. ` +
        `Shot from above or slight angle, natural daylight, shallow depth of field, ` +
        `rustic wooden or marble surface, garnished and ready to eat. ` +
        `No text, no watermarks, no people. Appetising, magazine-quality.`;

      const response = await client.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
        response_format: "url",
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        return res.status(500).json({ message: "No image was returned. Please try again." });
      }

      const updated = await storage.updateMealImageUrl(meal.id, imageUrl);
      res.json(updated);
    } catch (err: any) {
      console.error("[generate-meal-image] error:", err?.message ?? err);
      const msg = err?.status === 400
        ? "The AI couldn't generate an image for this meal. Please try again."
        : "We couldn't generate an image right now. Try again.";
      res.status(500).json({ message: msg });
    }
  });

  app.patch(api.meals.reimportInstructions.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const meal = await storage.getMeal(Number(req.params.id));
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }

    const parsed = api.meals.reimportInstructions.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Please provide a valid URL" });
    }

    try {
      const response = await axios.get(parsed.data.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000,
      });
      const $ = cheerio.load(response.data);

      const instructions: string[] = [];
      const methodSelectors = [
        '.method-steps__list-item p',
        '.method-steps__list-item > div p',
        '.recipe-method li p',
        '.recipe-method li', '.method-steps li', '.recipe-steps li',
        '.instructions li', '.method li', '.steps li', '.directions li',
        '.recipe-method ol li', '.recipe-directions li',
        '[class*="instruction"] li', '[class*="method"] li', '[class*="step"] li', '[class*="direction"] li',
        '.recipe-method p', '.method-steps p',
      ];

      for (const sel of methodSelectors) {
        $(sel).each((_, el) => {
          const text = $(el).text().trim();
          if (text.length >= 5 && text.length <= 1000 && !instructions.includes(text)) {
            instructions.push(text);
          }
        });
        if (instructions.length > 0) break;
      }

      if (instructions.length === 0) {
        $('ol li').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length >= 10 && text.length <= 1000 && !instructions.includes(text)) {
            instructions.push(text);
          }
        });
      }

      const cleanedInstructions = instructions.map(text =>
        text.replace(/^step\s*\d+\s*/i, '').trim()
      ).filter(text => text.length >= 5);

      if (cleanedInstructions.length === 0) {
        return res.status(400).json({ message: "Could not find any instructions on that page." });
      }

      const cleanedIngredients = meal.ingredients.filter(ing =>
        !(/^step\s*\d+/i.test(ing))
      );

      const needsIngredientCleanup = cleanedIngredients.length !== meal.ingredients.length;

      const updatedMeal = await storage.updateMealInstructions(
        meal.id,
        cleanedInstructions,
        needsIngredientCleanup ? cleanedIngredients : undefined
      );

      res.json(updatedMeal);
    } catch (err) {
      console.error('Reimport instructions error:', err);
      res.status(500).json({ message: "Failed to fetch instructions from that URL." });
    }
  });

  app.get(api.nutrition.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const meal = await storage.getMeal(Number(req.params.id));
    if (!meal || (meal.userId !== req.user!.id && meal.userId !== 0)) {
      return res.status(404).json({ message: "Meal not found" });
    }

    let n = await storage.getNutrition(meal.id);

    const hasNoNutrition = !n || !n.calories;
    // 'openfoodfacts' (no suffix) is the pre-fix format: re-run so quantities are applied correctly.
    const isOldBuggyFormat = n?.source === 'openfoodfacts';
    // If we only have estimated data but a source URL exists, try to scrape authoritative values.
    const hasEstimatedAndSourceAvailable = !!(n?.calories && meal.sourceUrl &&
      (n.source === 'openfoodfacts_estimated' || n.source === 'openfoodfacts_quantities'));

    if (hasNoNutrition || isOldBuggyFormat || hasEstimatedAndSourceAvailable) {
      (async () => {
        try {
          // Clear session-level cache so old-format meals are not skipped inside autoAnalyzeMeal.
          if (isOldBuggyFormat) analyzedMealIds.delete(meal.id);
          if (meal.sourceUrl && (hasEstimatedAndSourceAvailable || isOldBuggyFormat)) {
            await scrapeNutritionFromSource(meal);
          }
          if (hasNoNutrition || isOldBuggyFormat) {
            await autoAnalyzeMeal(meal.id);
          }
        } catch {}
      })();
    }
    res.json(n || null);
  });

  app.post("/api/nutrition/bulk", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { mealIds } = req.body;
      if (!Array.isArray(mealIds)) return res.status(400).json({ message: "mealIds must be an array" });
      const numericIds = (mealIds as number[]).filter(id => typeof id === "number" && id > 0);
      if (numericIds.length === 0) return res.json([]);
      const results = await storage.getNutritionBulk(numericIds);
      const missingIds = numericIds.filter(id => !results.some((r: any) => r.mealId === id && r.calories));
      if (missingIds.length > 0) {
        for (const id of missingIds.slice(0, 10)) {
          autoAnalyzeMeal(id).catch(() => {});
        }
      }
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bulk nutrition" });
    }
  });

  app.get(api.search.products.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const q = (req.query.q as string || '').trim();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const includeRegulatoryInScoring = req.query.includeRegulatoryInScoring !== 'false';
      const perPage = 12;
      // Fetch more records than we display so that retailer-specific barcodes
      // (which are separate OFF entries for the same physical product) are
      // included in the deduplication/merge step even if they rank lower.
      // 4x: canonical grouping can collapse many naming/size variants into 1-2
      // results — we need enough raw records to cover all the naming variants.
      const offFetchSize = perPage * 4; // 48

      if (!q) {
        return res.json({ products: [], hasMore: false });
      }

      const offFields = 'code,product_name,product_name_en,brands,image_url,image_front_url,image_front_small_url,nutriments,nutriscore_grade,nova_group,categories_tags,ingredients_text,ingredients_text_en,quantity,serving_size,categories,stores_tags,stores,purchase_places_tags,countries_tags,languages_tags';
      const offHeaders = { timeout: 20000, headers: { 'User-Agent': 'SmartMealPlanner/1.0 (contact: smartmealplanner@replit.app)' } };

      const ukParams = new URLSearchParams({
        search_terms: q,
        json: '1',
        page: String(page),
        page_size: String(offFetchSize + 1),
        tagtype_0: 'countries',
        tag_contains_0: 'contains',
        tag_0: 'united-kingdom',
        fields: offFields,
      });

      const globalParams = new URLSearchParams({
        search_terms: q,
        json: '1',
        page: String(page),
        page_size: String(offFetchSize + 1),
        fields: offFields,
      });

      const ukUrl = `https://world.openfoodfacts.net/cgi/search.pl?${ukParams.toString()}`;
      const globalUrl = `https://world.openfoodfacts.net/cgi/search.pl?${globalParams.toString()}`;

      const [ukResult, globalResult] = await Promise.allSettled([
        axios.get(ukUrl, offHeaders),
        axios.get(globalUrl, offHeaders),
      ]);

      const ukProducts: any[] = ukResult.status === 'fulfilled' ? (ukResult.value.data.products || []) : [];
      const globalProducts: any[] = globalResult.status === 'fulfilled' ? (globalResult.value.data.products || []) : [];

      const ENGLISH_COUNTRY_TAGS = new Set([
        'united-kingdom', 'en:united-kingdom', 'en:uk',
        'united-states', 'en:united-states', 'en:us',
        'canada', 'en:canada', 'australia', 'en:australia',
        'ireland', 'en:ireland', 'new-zealand', 'en:new-zealand',
      ]);

      const isEnglishProduct = (p: any, isUK: boolean): boolean => {
        const langTags: string[] = p.languages_tags || [];
        // Explicitly tagged as English → always include
        if (langTags.some((t: string) => t.toLowerCase() === 'en:english')) return true;
        // UK product: keep unless the only available ingredient text is clearly non-English
        if (isUK) {
          if (p.ingredients_text_en) return true; // English field exists
          if (p.ingredients_text && isLikelyNonEnglishIngredients(p.ingredients_text)) return false;
          return true;
        }
        // Global products: must be from an English-speaking country
        const countryTags: string[] = p.countries_tags || [];
        if (countryTags.some((t: string) => ENGLISH_COUNTRY_TAGS.has(t.toLowerCase()))) return true;
        return false;
      };

      const ukCodes = new Set(ukProducts.map((p: any) => p.code || p.product_name).filter(Boolean));

      // DEBUG: trace store data for key products
      const _debugNairns = q.toLowerCase().includes('nairn');
      const _qLower = q.toLowerCase();
      const _debugCoke = _qLower.includes('cherry') || _qLower.includes('coke') || _qLower.includes('coca');
      const _debugBenJerry = _qLower.includes('ben') && _qLower.includes('jerr');
      const _debugDD = _qLower.includes('double') && _qLower.includes('decker');

      if (_debugNairns) {
        console.log(`[DEBUG-NAIRNS] Query: "${q}" | UK results: ${ukProducts.length} | Global results: ${globalProducts.length}`);
        for (const p of [...ukProducts, ...globalProducts]) {
          const isUK = ukCodes.has(p.code || p.product_name);
          console.log(`[DEBUG-NAIRNS] RAW | barcode:${p.code} | name:"${p.product_name}" | brand:"${p.brands}" | qty:"${p.quantity}" | isUK:${isUK} | stores_tags:${JSON.stringify(p.stores_tags)} | purchase_places_tags:${JSON.stringify(p.purchase_places_tags)} | stores:"${p.stores}"`);
        }
      }
      if (_debugCoke) {
        console.log(`[DEBUG-COKE] Query: "${q}" | UK results: ${ukProducts.length} | Global results: ${globalProducts.length}`);
        for (const p of [...ukProducts, ...globalProducts]) {
          const isUK = ukCodes.has(p.code || p.product_name);
          console.log(`[DEBUG-COKE] RAW | barcode:${p.code} | name:"${p.product_name}" | brand:"${p.brands}" | qty:"${p.quantity}" | isUK:${isUK} | countries_tags:${JSON.stringify(p.countries_tags)} | languages_tags:${JSON.stringify(p.languages_tags)} | stores_tags:${JSON.stringify(p.stores_tags)} | purchase_places_tags:${JSON.stringify(p.purchase_places_tags)} | stores:"${p.stores}"`);
        }
      }

      const seen = new Set<string>();
      const merged: any[] = [];
      for (const p of [...ukProducts, ...globalProducts]) {
        const key = p.code || p.product_name;
        if (!key || seen.has(key)) continue;
        const isUK = ukCodes.has(key);
        // Primary gate: product must have usable English ingredient text.
        // Products with foreign-only or missing ingredients are excluded entirely —
        // they must not appear in results, affect rankings, or influence grouping.
        if (!hasEnglishIngredients(p)) {
          console.log(`[LANG-FILTER] Excluded (no English ingredients): barcode:${p.code} | name:"${p.product_name}"`);
          continue;
        }
        // Secondary gate: product must be from an English-speaking country or
        // carry an English language tag (reduces noise from off-market products).
        if (!isEnglishProduct(p, isUK)) {
          if (_debugNairns && (p.product_name || '').toLowerCase().includes('nairn')) {
            console.log(`[DEBUG-NAIRNS] FILTERED OUT (non-English country): barcode:${p.code} | name:"${p.product_name}"`);
          }
          if (_debugCoke) {
            const pn = (p.product_name || '').toLowerCase();
            if (pn.includes('cherry') || pn.includes('coke') || pn.includes('coca')) {
              console.log(`[DEBUG-COKE] FILTERED OUT (non-English country): barcode:${p.code} | name:"${p.product_name}" | languages:${JSON.stringify(p.languages_tags)}`);
            }
          }
          continue;
        }
        seen.add(key);
        merged.push(p);
      }

      // Don't slice here — pass all fetched records through enrichment and
      // canonical grouping so retailer duplicates (different barcodes for the
      // same product) can be merged before we apply the user-facing page limit.
      const products = merged;

      if (_debugDD) {
        const ddRaw = products.filter((p: any) => (p.product_name || '').toLowerCase().includes('decker'));
        console.log(`[DEBUG-DD] AFTER-LANG-GATE | ${ddRaw.length} double-decker product(s) survived:`);
        for (const p of ddRaw) {
          console.log(`[DEBUG-DD]   barcode:${p.code} | name:"${p.product_name}" | brand:"${p.brands}"`);
        }
      }

      const additiveDb = await storage.getAllAdditives();

      const results = products
        .filter((p: any) => p.product_name)
        .map((p: any) => {
          const n = p.nutriments || {};
          const nutrition = {
            calories: n['energy-kcal_100g'] ? `${Math.round(n['energy-kcal_100g'])} kcal` : null,
            protein: n.proteins_100g != null ? `${Math.round(n.proteins_100g * 10) / 10}g` : null,
            carbs: n.carbohydrates_100g != null ? `${Math.round(n.carbohydrates_100g * 10) / 10}g` : null,
            fat: n.fat_100g != null ? `${Math.round(n.fat_100g * 10) / 10}g` : null,
            sugar: n.sugars_100g != null ? `${Math.round(n.sugars_100g * 10) / 10}g` : null,
            salt: n.salt_100g != null ? `${Math.round(n.salt_100g * 10) / 10}g` : null,
          };

          // Prefer the dedicated English field; fall back to the generic field only
          // when it is actually English.  Non-English text (German, French, etc.)
          // is passed to the scoring function so E-number detection still works,
          // but is never sent to the client for display.
          const ingredientsTextRaw = p.ingredients_text_en || p.ingredients_text || '';
          const ingredientsTextForeign =
            !p.ingredients_text_en &&
            isLikelyNonEnglishIngredients(p.ingredients_text || '');
          // Full text used for scoring (E-numbers are language-agnostic)
          const ingredientsText = ingredientsTextRaw;
          // Display text — null when foreign so UI shows a fallback
          const ingredientsTextDisplay = ingredientsTextForeign ? null : (ingredientsTextRaw || null);
          const categoriesTags = p.categories_tags || [];
          const novaGroup = p.nova_group || null;
          const productNameDisplay = p.product_name_en || p.product_name;

          const upfResult = (ingredientsText || novaGroup)
            ? analyzeProductUPF(
                ingredientsText,
                additiveDb,
                50,
                { productName: p.product_name, categoriesTags, novaGroup: novaGroup ? Number(novaGroup) : null },
                undefined,
                !includeRegulatoryInScoring,
              )
            : null;

          const thaRating = upfResult?.thaRating ?? null;

          const rawStoreTags: string[] = [
            ...(p.stores_tags || []),
            ...(p.purchase_places_tags || []),
            ...((p.stores || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)),
          ];
          const retailEnrichment = enrichRetailData({
            storeTags: rawStoreTags,
            brand: p.brands,
            categoryTags: categoriesTags,
            barcode: p.code || null,
          });
          const availableStores = retailEnrichment.availableStores;
          const storeConfidence = retailEnrichment.storeConfidence;
          const confirmedStores = retailEnrichment.confirmedStores;
          const inferredStores = retailEnrichment.inferredStores;

          // DEBUG: store enrichment stage for Nairn's investigation
          if (_debugNairns && (productNameDisplay || p.product_name || '').toLowerCase().includes('nairn')) {
            console.log(`[DEBUG-NAIRNS] STORE-ENRICH | barcode:${p.code} | name:"${productNameDisplay}" | qty:"${p.quantity}" | rawStoreTags:${JSON.stringify(rawStoreTags)} | unmappedTags:${JSON.stringify(rawStoreTags.filter((s: string) => !STORE_TAG_MAP[s.toLowerCase()]))} | availableStores:${JSON.stringify(availableStores)} | source:${retailEnrichment.inferenceSource}`);
          }
          // DEBUG: store enrichment stage for Cherry Coke investigation
          if (_debugCoke) {
            const pnl = (productNameDisplay || p.product_name || '').toLowerCase();
            if (pnl.includes('cherry') || pnl.includes('coke') || pnl.includes('coca')) {
              console.log(`[DEBUG-COKE] STORE-ENRICH | barcode:${p.code} | name:"${productNameDisplay}" | brand:"${p.brands}" | qty:"${p.quantity}" | rawStoreTags:${JSON.stringify(rawStoreTags)} | unmappedTags:${JSON.stringify(rawStoreTags.filter((s: string) => !STORE_TAG_MAP[s.toLowerCase()]))} | availableStores:${JSON.stringify(availableStores)} | source:${retailEnrichment.inferenceSource}`);
            }
          }

          return {
            barcode: p.code || null,
            product_name: productNameDisplay,
            brand: p.brands || null,
            image_url: p.image_front_url || p.image_front_small_url || p.image_url || null,
            ingredients_text: ingredientsTextDisplay,
            ingredientsUnavailable: ingredientsTextForeign,
            nutriments: nutrition,
            nutriscore_grade: p.nutriscore_grade || null,
            nova_group: novaGroup ? Number(novaGroup) : null,
            categories_tags: categoriesTags,
            availableStores,
            storeConfidence,
            confirmedStores,
            inferredStores,
            isUK: ukProducts.some((up: any) => (up.code || up.product_name) === (p.code || p.product_name)),
            nutriments_raw: p.nutriments || null,
            analysis: ingredientsTextDisplay ? {
              ingredients: ingredientsTextDisplay.split(',').map((ing: string) => {
                const trimmed = ing.trim();
                const isENumber = /e\s?\d{3}/i.test(trimmed);
                return {
                  name: trimmed,
                  percent: null,
                  isUPF: isENumber || /modified|hydrogenated|emulsifier|stabiliser|flavouring|sweetener/i.test(trimmed),
                  isENumber,
                };
              }),
              novaGroup: novaGroup ? Number(novaGroup) : 4,
              healthScore: thaRating != null ? Math.max(0, 100 - thaRating * 20) : null,
              isUltraProcessed: novaGroup === 4 || (thaRating != null && thaRating <= 2),
              warnings: [],
              upfCount: upfResult?.upfIngredientCount || 0,
              totalIngredients: ingredientsTextDisplay.split(',').length,
            } : null,
            upfAnalysis: upfResult ? {
              upfScore: upfResult.upfScore,
              thaRating: upfResult.thaRating,
              additiveCount: upfResult.additiveCount,
              regulatoryCount: upfResult.regulatoryCount,
              additiveMatches: upfResult.additiveMatches.map(m => ({
                name: m.additive.name,
                type: m.additive.type,
                riskLevel: m.additive.riskLevel,
                description: m.additive.description,
                foundIn: m.foundIn,
                isRegulatory: m.isRegulatory,
              })),
              processingIndicators: upfResult.processingIndicators || [],
              ingredientCount: upfResult.ingredientCount || 0,
              upfIngredientCount: upfResult.upfIngredientCount || 0,
              riskBreakdown: upfResult.riskBreakdown || { additiveRisk: 0, processingRisk: 0, ingredientComplexityRisk: 0 },
              thaExplanation: buildTHAExplanation(upfResult, novaGroup ? Number(novaGroup) : null),
              scoringExcludesRegulatory: upfResult.scoringExcludesRegulatory ?? false,
            } : null,
            quantity: p.quantity || null,
            servingSize: p.serving_size || null,
            categories: p.categories || null,
          };
        });

      // ── Canonical product grouping ────────────────────────────────────────
      // The same physical product (e.g. Heinz Ketchup 570g) can exist in OFF
      // under multiple barcodes — one per retailer submission. Group them into
      // a single canonical entry and merge retailer lists.
      //
      // Identity key: normalised(brand) | normalised(name) | normalised(size)
      // Size must match so that 342g and 570g are never merged.
      // Products with empty name or brand still get their own distinct key.
      const _norm = (s: string | null | undefined) =>
        (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Normalise quantity strings so unit-spelling variants don't split groups.
      // "200 g", "200g", "200 gr", "200 grams" all become "200g".
      // "500 ml", "500ml", "500 millilitres" all become "500ml".
      // This only touches unit labels — the numeric part is untouched, so
      // genuinely different sizes (200g vs 400g) will still produce distinct keys.
      const _normQty = (s: string | null | undefined): string => {
        if (!s) return '';
        return s
          .toLowerCase()
          .trim()
          // collapse internal whitespace
          .replace(/\s+/g, ' ')
          // weight: grams variants → g
          .replace(/\b(\d+)\s*(?:grams?|grammes?|gr)\b/g, '$1g')
          // weight: kilograms variants → kg
          .replace(/\b(\d+)\s*(?:kilograms?|kilogrammes?|kgs?)\b/g, '$1kg')
          // volume: millilitres variants → ml
          .replace(/\b(\d+)\s*(?:millilitres?|milliliters?|mls?)\b/g, '$1ml')
          // volume: litres variants → l
          .replace(/\b(\d+)\s*(?:litres?|liters?|lts?)\b/g, '$1l')
          // strip remaining non-alphanumeric so "200 g" → "200g"
          .replace(/[^a-z0-9]/g, '');
      };

      // Strip the brand token from the start or end of the product name before
      // building the key.  This collapses retailer-submitted name variants like
      // "Coca-Cola Cherry" and "Cherry Coca-Cola" into the same bucket while
      // keeping genuinely different products (e.g. "Cherry Zero") distinct.
      // Falls back to the full normalised name if stripping would empty it.
      const _normNameForKey = (brand: string | null, name: string | null): string => {
        const nb = _norm(brand);
        const nn = _norm(name);
        if (!nb) return nn;
        if (nn.startsWith(nb)) return nn.slice(nb.length) || nn;
        if (nn.endsWith(nb)) return nn.slice(0, nn.length - nb.length) || nn;
        return nn;
      };

      const _canonicalKey = (p: any) =>
        `${_norm(p.brand)}|${_normNameForKey(p.brand, p.product_name)}|${_normQty(p.quantity)}`;

      // Score a product entry for use as the "best" representative of a group.
      // Higher = preferred. Criteria in order of weight:
      //   1. UK-sourced product (most likely to have clean, English-market data)
      //   2. Has usable English ingredient text (displayable, not withheld as foreign)
      //   3. Has a product image
      //   4. Title is clean (mixed-case, reasonable length) vs garbled/ALL-CAPS
      const _titleScore = (p: any): number => {
        let score = 0;
        if (p.isUK) score += 8;
        // Prefer products with displayable English ingredient text.
        // ingredientsUnavailable is set when the only available text is non-English;
        // ingredients_text is null in that case. Both checks guard the same condition
        // but are explicit for clarity.
        if (p.ingredients_text && !p.ingredientsUnavailable) score += 5;
        if (p.image_url) score += 4;
        const name: string = p.product_name || '';
        if (name.length >= 3 && name.length <= 80) score += 2;
        // Penalise ALL-CAPS-heavy titles (OCR garble / bad OFF submissions)
        const alphaWords = name.split(/\s+/).filter((w: string) => /[a-zA-Z]{3,}/.test(w));
        if (alphaWords.length > 0) {
          const capsRatio = alphaWords.filter(
            (w: string) => w === w.toUpperCase() && /[A-Z]/.test(w)
          ).length / alphaWords.length;
          if (capsRatio <= 0.35) score += 2; // mostly lower/mixed-case → clean
        }
        return score;
      };

      const _groups = new Map<string, any[]>();
      for (const p of results) {
        const key = _canonicalKey(p);
        if (!_groups.has(key)) _groups.set(key, []);
        _groups.get(key)!.push(p);
      }

      // DEBUG: canonical grouping stage for Nairn's investigation
      if (_debugNairns) {
        for (const [key, group] of Array.from(_groups.entries())) {
          if (group.some((p: any) => (p.product_name || '').toLowerCase().includes('nairn'))) {
            console.log(`[DEBUG-NAIRNS] CANONICAL-GROUP key:"${key}" | members:${group.length}`);
            for (const p of group) {
              console.log(`[DEBUG-NAIRNS]   -> barcode:${p.barcode} | name:"${p.product_name}" | qty:"${p.quantity}" | stores:${JSON.stringify(p.availableStores)}`);
            }
          }
        }
      }
      // DEBUG: canonical grouping stage for Cherry Coke investigation
      if (_debugCoke) {
        for (const [key, group] of Array.from(_groups.entries())) {
          const isCokeGroup = group.some((p: any) => {
            const pn = (p.product_name || '').toLowerCase();
            return pn.includes('cherry') || pn.includes('coke') || pn.includes('coca');
          });
          if (isCokeGroup) {
            console.log(`[DEBUG-COKE] CANONICAL-GROUP key:"${key}" | members:${group.length}`);
            for (const p of group) {
              console.log(`[DEBUG-COKE]   -> barcode:${p.barcode} | name:"${p.product_name}" | brand:"${p.brand}" | qty:"${p.quantity}" | isUK:${p.isUK} | stores:${JSON.stringify(p.availableStores)}`);
            }
          }
        }
      }

      const grouped = Array.from(_groups.values()).map(group => {
        if (group.length === 1) return group[0];
        // Pick the highest-scored representative (UK + image + clean title).
        const best = [...group].sort((a: any, b: any) => _titleScore(b) - _titleScore(a))[0];
        // Merge store arrays across all entries for this canonical product
        const mergedAvailable = Array.from(new Set(group.flatMap((p: any) => p.availableStores || [])));
        const mergedConfirmed = Array.from(new Set(group.flatMap((p: any) => p.confirmedStores || [])));
        const mergedInferred = Array.from(new Set(
          group.flatMap((p: any) => p.inferredStores || []).filter((s: string) => !mergedConfirmed.includes(s))
        ));
        return { ...best, availableStores: mergedAvailable, confirmedStores: mergedConfirmed, inferredStores: mergedInferred };
      });

      // ── Stage 1.5: Canonical product identity ────────────────────────────────
      // Build a lookup Map from each product's stable identity → canonical
      // product descriptor.  Using a Map (rather than mutating the objects)
      // makes the lookup explicit, avoids accidental property shadowing, and
      // works correctly even if the Stage-1 objects come from frozen spreads.
      //
      // Key: barcode when present, otherwise "brand|name" composite.
      // Value: { name, brand } canonical descriptor from the rule matcher.
      //
      // Collapses naming/word-order variations (Cherry Coke / Coke Cherry /
      // Coca-Cola Cherry / Cherry cola / Coca-ColaCherry) into the same canonical
      // identity so Stage-2 groups them under a single consumable key.
      //
      // Diet/Zero/No-Sugar formulations map to a SEPARATE canonical identity
      // ("Cherry Coke Zero") and are never merged with full-sugar variants.
      //
      // Only soft drinks currently matched — no regression for other categories.
      const _canonicalLookup = new Map<string, { name: string; brand: string }>();
      const _productIdent = (p: any): string =>
        p.barcode ? `b:${p.barcode}` : `n:${_norm(p.brand)}|${_norm(p.product_name)}`;

      for (const p of grouped) {
        const canonical = getCanonicalProduct(p.product_name, p.brand);
        if (canonical) {
          _canonicalLookup.set(_productIdent(p), canonical);
        }
      }

      if (_debugDD) {
        const ddGrouped = grouped.filter((p: any) => (p.product_name || '').toLowerCase().includes('decker'));
        console.log(`[DEBUG-DD] STAGE-1 | ${ddGrouped.length} double-decker group(s) after canonical grouping:`);
        for (const p of ddGrouped) {
          const ident = _productIdent(p);
          const canonical = _canonicalLookup.get(ident);
          console.log(`[DEBUG-DD]   ident:"${ident}" | name:"${p.product_name}" | brand:"${p.brand}" | canonical:${JSON.stringify(canonical)}`);
        }
      }

      if (_debugCoke) {
        const canonicalEntries = Array.from(_canonicalLookup.entries());
        console.log(`[DEBUG-COKE] STAGE-1.5 | ${canonicalEntries.length} product(s) resolved to canonical identity:`);
        for (const [ident, can] of canonicalEntries) {
          const p = grouped.find((x: any) => _productIdent(x) === ident);
          console.log(`[DEBUG-COKE]   ident:"${ident}" | raw:"${p?.product_name}" | brand:"${p?.brand}" → canonical:"${can.name}" / "${can.brand}"`);
        }
        const ungrouped = grouped.filter((p: any) => !_canonicalLookup.has(_productIdent(p)));
        console.log(`[DEBUG-COKE] STAGE-1.5 | ${ungrouped.length} product(s) NOT matched by any canonical rule`);
        for (const p of ungrouped) {
          console.log(`[DEBUG-COKE]   not-matched | name:"${p.product_name}" | brand:"${p.brand}"`);
        }
      }

      // ── Stage 2: Consumable grouping ────────────────────────────────────────
      // Collapse pack-size variants of the same consumable product into a single
      // result with merged retailer availability and a packVariants list.
      // e.g. Cherry Coke 330ml / 500ml / 2L → one result with packVariants.
      //
      // Crucially, formulation variants (Zero / Diet / No Sugar / Light) are kept
      // separate — they are genuinely different products.
      //
      // Key: normBrandConsumable(brand) | consumableNameKey(brand, name)
      // Corporate suffixes (Ltd, PLC, GB, UK, Foods…) stripped from brand.
      // Size and pack-count tokens stripped from name.
      const _CORP_RE = /\s+(?:ltd\.?|plc\.?|inc\.?|llc\.?|gb|uk|group|foods|beverages?|company|co\.?)(?:\s|$)/gi;
      const _normBrandConsumable = (brand: string | null | undefined, productName: string): string => {
        const tokens = (brand ?? '')
          .split(',')
          .map(b => _norm(b.replace(_CORP_RE, '').trim()))
          .filter(Boolean);
        if (tokens.length <= 1) return tokens[0] ?? '';
        const nameNorm = _norm(productName);
        const matched = tokens.find(t => t.length > 3 && nameNorm.includes(t));
        return matched ?? tokens[0];
      };

      const _SIZE_RE = /\b[\d.]+\s*(?:x\s*[\d.]+\s*)?(?:m(?:illilitres?|illiliters?|ls?)?|cl|litres?|liters?|l|g(?:rams?|rammes?|r)?|kg(?:ilograms?|ilogrammes?)?|mg|oz)\b/gi;
      // Matches pack-count, container-format and packaging-descriptor tokens that
      // do not carry product identity.  Stripping these before the consumable key
      // is built allows pack/format variants of the same product to collapse into
      // one group.
      //
      // Digit-preceded counts:  "4 bars", "9pk", "16pk", "6 cans", "4 fingers"
      // Named pack descriptors: "multipack", "pack of 12", "twin", "single"
      // Standalone format words: "Fingers", "Bar", "Sticks" (confectionery shape)
      // Packaging language:     "individually wrapped", "4 individually wrapped"
      // Size-tier words:        "mini", "minis", "miniatures", "snack size",
      //                         "fun size", "sharing bag"
      //
      // NOT stripped: flavour/formulation signals — white, dark, salted caramel,
      // gluten free, protein, vegan, zero, diet, original, extra (kept as-is).
      const _PACK_RE = /\b(?:\d+\s*(?:pk|pack|packs?|cans?|bottles?|cartons?|bars?|fingers?|sticks?|pieces?|pouches?|bags?)|pack\s+of\s+\d+|multipack|multi-pack|(?:\d+\s*)?individually\s+wrapped|twin|single|mini(?:atures?|s)?|snack\s+size|fun\s+size|sharing\s+bag|fingers?|bars?|sticks?)\b/gi;
      // Strips common merchandising / sourcing suffixes that vary across retailer
      // submissions of the same product:
      //   "Sustainably Sourced", "Sustainably Sourced Cocoa", "Sourced Cocoa",
      //   "Responsibly Sourced", "Rainforest Alliance Certified", etc.
      const _MERCH_RE = /\b(?:sustainably[\s-]*sourced?(?:\s+cocoa)?|responsibly[\s-]*sourced?(?:\s+cocoa)?|sourced?\s+cocoa|rainforest\s+alliance(?:\s+certified)?|sustainably|responsibly)\b/gi;

      const _consumableNameKey = (brand: string | null, name: string | null): string => {
        const cleaned = (name ?? '')
          .replace(_SIZE_RE, '')
          .replace(_PACK_RE, '')
          .replace(_MERCH_RE, '')
          .replace(/\s+/g, ' ')
          .trim();
        return _normNameForKey(brand, cleaned || name);
      };

      const _consumableKey2 = (p: any): string => {
        // Canonical identity takes priority: all variants of e.g. "Cherry Coke"
        // share a stable key regardless of word order, brand spelling, or size.
        // Look up via the Map built in Stage 1.5 (Map-based, no object mutation).
        // The "_c:" prefix prevents accidental collisions with organic keys.
        const canonical = _canonicalLookup.get(_productIdent(p));
        if (canonical) {
          const cb = _norm(canonical.brand);
          const cn = _norm(canonical.name);
          return `_c:${cb}|${cn}`;
        }
        const b = _normBrandConsumable(p.brand, p.product_name);
        const n = _consumableNameKey(b, p.product_name);
        if (!b && !n) return _norm(p.product_name) || `_unknown_${p.barcode ?? ''}`;
        return `${b}|${n}`;
      };

      const _consumableGroups2 = new Map<string, any[]>();
      for (const p of grouped) {
        const ck = _consumableKey2(p);
        if (!_consumableGroups2.has(ck)) _consumableGroups2.set(ck, []);
        _consumableGroups2.get(ck)!.push(p);
      }

      // DEBUG: consumable grouping for Cherry Coke
      if (_debugCoke) {
        for (const [ck, cgroup] of Array.from(_consumableGroups2.entries())) {
          const isCokeGroup = cgroup.some((p: any) => {
            const pn = (p.product_name || '').toLowerCase();
            return pn.includes('cherry') || pn.includes('coke') || pn.includes('coca');
          });
          if (isCokeGroup) {
            console.log(`[DEBUG-COKE] CONSUMABLE-GROUP key:"${ck}" | members:${cgroup.length}`);
            for (const p of cgroup) {
              console.log(`[DEBUG-COKE]   -> barcode:${p.barcode} | name:"${p.product_name}" | qty:"${p.quantity}"`);
            }
          }
        }
      }

      const consumableGrouped = Array.from(_consumableGroups2.values()).map(cgroup => {
        // Pick the highest-scored representative (UK + image + clean title).
        const best = [...cgroup].sort((a: any, b: any) => _titleScore(b) - _titleScore(a))[0];

        // Resolve canonical identity for this group via the Stage-1.5 Map.
        // All members of a canonical group share the same canonical key, so
        // checking the first member is sufficient.
        const canonicalInfo = _canonicalLookup.get(_productIdent(cgroup[0]));
        const canonicalName: string | undefined = canonicalInfo?.name;
        const canonicalBrand: string | undefined = canonicalInfo?.brand;

        const mergedAvailable = Array.from(new Set(cgroup.flatMap((p: any) => p.availableStores || [])));
        const mergedConfirmed = Array.from(new Set(cgroup.flatMap((p: any) => p.confirmedStores || [])));
        const mergedInferred = Array.from(new Set(
          cgroup.flatMap((p: any) => p.inferredStores || []).filter((s: string) => !mergedConfirmed.includes(s))
        ));
        const mergedStoreConfidence: Record<string, number> = {};
        for (const p of cgroup) {
          for (const [store, conf] of Object.entries(p.storeConfidence || {})) {
            mergedStoreConfidence[store] = Math.max(mergedStoreConfidence[store] ?? 0, conf as number);
          }
        }
        const packVariants = cgroup
          .map((p: any) => p.quantity as string | null)
          .filter((q): q is string => !!q)
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .sort();

        // Collect the original naming variants for provenance / client display.
        // Deduplicate; these are the raw OFF product names before canonicalisation.
        const nameVariants: string[] = canonicalName
          ? Array.from(new Set(cgroup.map((p: any) => p.product_name).filter(Boolean)))
          : [];

        return {
          ...best,
          // Apply canonical name+brand so the client always receives a clean,
          // consistent product title regardless of which OFF entry won "best".
          ...(canonicalName ? {
            product_name: canonicalName,
            brand: canonicalBrand ?? best.brand,
            canonicalProductName: canonicalName,
          } : {}),
          quantity: packVariants.length > 1 ? null : best.quantity,
          availableStores: mergedAvailable,
          confirmedStores: mergedConfirmed,
          inferredStores: mergedInferred,
          storeConfidence: mergedStoreConfidence,
          packVariants: packVariants.length > 1 ? packVariants : [],
          // Variant provenance — useful for detail views and debugging
          nameVariants: nameVariants.length > 1 ? nameVariants : [],
          variantCount: cgroup.length,
        };
      });

      if (_debugDD) {
        const ddFinal = consumableGrouped.filter((p: any) =>
          (p.product_name || '').toLowerCase().includes('decker') ||
          (p.canonicalProductName || '').toLowerCase().includes('decker')
        );
        console.log(`[DEBUG-DD] STAGE-2 FINAL | ${ddFinal.length} double-decker result(s) after consumable grouping:`);
        for (const p of ddFinal) {
          console.log(`[DEBUG-DD]   name:"${p.product_name}" | brand:"${p.brand}" | canonical:"${p.canonicalProductName}" | variants:${p.variantCount} | nameVariants:${JSON.stringify(p.nameVariants)}`);
        }
      }

      // Apply the user-facing page limit after merging so retailer duplicates
      // don't consume slots before they get a chance to be consolidated.
      const hasMore = consumableGrouped.length > perPage;
      const pagedProducts = hasMore ? consumableGrouped.slice(0, perPage) : consumableGrouped;

      // DEBUG: final response shape — confirmed+inferred stores for key test products
      const _logFinalStores = (label: string, p: any) => {
        console.log(`[DEBUG-${label}] FINAL | barcode:${p.barcode} | name:"${p.product_name}" | brand:"${p.brand}" | inferenceSource:${p.storeConfidence ? 'present' : 'absent'}`);
        console.log(`[DEBUG-${label}]   confirmedStores:${JSON.stringify(p.confirmedStores ?? [])} (${(p.confirmedStores ?? []).length})`);
        console.log(`[DEBUG-${label}]   inferredStores:${JSON.stringify(p.inferredStores ?? [])} (${(p.inferredStores ?? []).length})`);
        console.log(`[DEBUG-${label}]   availableStores:${JSON.stringify(p.availableStores ?? [])} (${(p.availableStores ?? []).length})`);
      };
      if (_debugNairns) {
        const hits = pagedProducts.filter((p: any) => (p.product_name || '').toLowerCase().includes('nairn'));
        console.log(`[DEBUG-NAIRNS] FINAL | ${hits.length} Nairn's product(s) in response:`);
        hits.forEach((p: any) => _logFinalStores('NAIRNS', p));
      }
      if (_debugCoke) {
        const hits = pagedProducts.filter((p: any) => {
          const pn = (p.product_name || '').toLowerCase();
          return pn.includes('cherry') || pn.includes('coke') || pn.includes('coca');
        });
        console.log(`[DEBUG-COKE] FINAL | ${hits.length} Cherry Coke product(s) in response:`);
        hits.forEach((p: any) => _logFinalStores('COKE', p));
      }
      if (_debugBenJerry) {
        const hits = pagedProducts.filter((p: any) => (p.product_name || '').toLowerCase().includes('ben'));
        console.log(`[DEBUG-BENJERRY] FINAL | ${hits.length} Ben & Jerry's product(s) in response:`);
        hits.forEach((p: any) => _logFinalStores('BENJERRY', p));
      }

      res.json({ products: pagedProducts, hasMore });
    } catch (error) {
      console.error('Product search error:', error);
      res.json({ products: [], hasMore: false });
    }
  });

  app.get(api.search.recipes.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const q = (req.query.q as string || '').trim();
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      // Diet filtering: explicit query param > user profile > no filter
      // If the query param is absent (undefined) we fall back to the logged-in user's
      // saved preferences. If it is present (even empty string) it acts as an override.
      const queryDietPattern = req.query.dietPattern as string | undefined;
      const queryDietRestrictions = req.query.dietRestrictions as string | undefined;

      const effectiveDietPattern: string | null =
        queryDietPattern !== undefined
          ? queryDietPattern.trim() || null          // explicit param (empty string → null)
          : (req.user?.dietPattern ?? null);         // fall back to profile

      const effectiveDietRestrictions: string[] =
        queryDietRestrictions !== undefined
          ? queryDietRestrictions.trim()             // explicit param provided
            ? queryDietRestrictions.split(',').map(s => s.trim()).filter(Boolean)
            : []
          : (req.user?.dietRestrictions?.filter(Boolean) ?? []);  // fall back to profile

      console.log("[search-recipes] Effective dietPattern:", effectiveDietPattern);
      console.log("[search-recipes] Effective dietRestrictions:", effectiveDietRestrictions);
      const perPage = 9;

      if (!q) {
        return res.json({ recipes: [], hasMore: false });
      }

      // Expand query: correct obvious misspellings + add UK/US synonyms.
      // expandedQueries[0] is always the corrected/canonical form of the user input.
      // Additional entries are synonym variants (e.g. "aubergine" → also "eggplant").
      const expandedQueries = expandSearchQuery(q);
      const primaryQuery = expandedQueries[0]; // corrected canonical form
      const allQueryTerms = expandedQueries.join(' ');

      const keywords = allQueryTerms.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
      const lowerKeywords = Array.from(new Set(keywords.map(k => k.toLowerCase())));

      const filters = { query: primaryQuery };
      const [
        mealDbResults, bbcResults,
        arResults, joResults, seResults,
        edamamResults, apiNinjasResults, bigOvenResults, fatSecretResults,
      ] = await Promise.all([
        // TheMealDB — official API
        (async () => {
          if (!(await isSourceCallable('themealdb'))) return [];
          try {
            if (keywords.length > 1) {
              const keywordResults = await Promise.all(
                keywords.map(async (kw) => {
                  try {
                    const r = await axios.get(
                      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(kw)}`,
                      { timeout: 10000 }
                    );
                    return (r.data.meals || []) as any[];
                  } catch { return [] as any[]; }
                })
              );
              const mealMap = new Map<string, { meal: any; score: number }>();
              for (const meals of keywordResults) {
                for (const m of meals) {
                  const id = m.idMeal as string;
                  if (!mealMap.has(id)) {
                    const nameLower = (m.strMeal || '').toLowerCase();
                    const ingText = extractMealDbIngredients(m).join(' ').toLowerCase();
                    const fullText = nameLower + ' ' + ingText;
                    const matchCount = lowerKeywords.filter(kw => fullText.includes(kw)).length;
                    mealMap.set(id, { meal: m, score: matchCount });
                  }
                }
              }
              return Array.from(mealMap.values()).sort((a, b) => b.score - a.score).map(e => e.meal);
            } else {
              // Single-term: use corrected/canonical query; also try synonym if different
              const responses = await Promise.all(
                Array.from(new Set([primaryQuery, q])).map(term =>
                  axios.get(
                    `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`,
                    { timeout: 10000 }
                  ).then(r => r.data.meals || []).catch(() => [] as any[])
                )
              );
              const seen = new Set<string>();
              const merged: any[] = [];
              for (const batch of responses) {
                for (const m of batch) {
                  if (!seen.has(m.idMeal)) { seen.add(m.idMeal); merged.push(m); }
                }
              }
              return merged;
            }
          } catch { return []; }
        })(),
        // BBC Good Food — scraped
        (async () => (await isSourceCallable('bbcgoodfood')) ? searchBBCGoodFood(primaryQuery) : [])(),
        // AllRecipes — scraped
        (async () => (await isSourceCallable('allrecipes')) ? (await searchAllRecipes(filters)).map(candidateToRecipe) : [])(),
        // Jamie Oliver — scraped
        (async () => (await isSourceCallable('jamieoliver')) ? (await searchJamieOliver(filters)).map(candidateToRecipe) : [])(),
        // Serious Eats — scraped
        (async () => (await isSourceCallable('seriouseats')) ? (await searchSeriousEats(filters)).map(candidateToRecipe) : [])(),
        // Edamam — official API
        (async () => (await isSourceCallable('edamam')) ? (await searchEdamam(primaryQuery)).map(candidateToRecipe) : [])(),
        // API-Ninjas — official API
        (async () => (await isSourceCallable('apininjas')) ? (await searchApiNinjas(primaryQuery)).map(candidateToRecipe) : [])(),
        // BigOven — official API
        (async () => (await isSourceCallable('bigoven')) ? (await searchBigOven(primaryQuery)).map(candidateToRecipe) : [])(),
        // FatSecret — official API
        (async () => (await isSourceCallable('fatsecret')) ? (await searchFatSecret(primaryQuery)).map(candidateToRecipe) : [])(),
      ]);

      const mealDbMapped: NormalizedRecipe[] = mealDbResults.map((m: any) => ({
        id: m.idMeal,
        name: m.strMeal,
        image: m.strMealThumb,
        url: m.strSource || null,
        category: m.strCategory || null,
        cuisine: m.strArea || null,
        ingredients: extractMealDbIngredients(m),
        instructions: m.strInstructions ? m.strInstructions.split(/\r?\n/).filter((s: string) => s.trim().length > 0) : [],
        source: 'TheMealDB',
      }));

      const seenNames = new Set<string>();
      const dedup = (arr: NormalizedRecipe[]): NormalizedRecipe[] => {
        const result: NormalizedRecipe[] = [];
        for (const r of arr) {
          const key = r.name.toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            result.push(r);
          }
        }
        return result;
      };

      const sources = [
        dedup(mealDbMapped),
        dedup(bbcResults),
        dedup(arResults),
        dedup(joResults),
        dedup(seResults),
        dedup(edamamResults),
        dedup(apiNinjasResults),
        dedup(bigOvenResults),
        dedup(fatSecretResults),
      ];

      let interleaved: NormalizedRecipe[] = [];
      const maxLen = Math.max(...sources.map(s => s.length));
      for (let i = 0; i < maxLen; i++) {
        for (const source of sources) {
          if (i < source.length) {
            interleaved.push(source[i]);
          }
        }
      }

      if (effectiveDietPattern || effectiveDietRestrictions.length > 0) {
        const ctx = { dietPattern: effectiveDietPattern, dietRestrictions: effectiveDietRestrictions };

        const scored = interleaved.map(recipe => {
          const text = [
            recipe.name,
            recipe.category || '',
            recipe.cuisine || '',
            ...(recipe.ingredients || []),
          ].join(' ').toLowerCase();

          return {
            recipe,
            excluded: shouldExcludeRecipe(text, ctx),
            score: scoreRecipeForDiet(text, effectiveDietPattern),
          };
        });

        interleaved = scored
          .filter(e => !e.excluded)
          .sort((a, b) => b.score - a.score)
          .map(e => e.recipe);
      }

      const PREMIUM_MARKER = "This is a premium piece of content available to subscribed users.";
      interleaved = interleaved.filter(recipe => {
        const allText = [recipe.name, recipe.category, recipe.cuisine, ...(recipe.ingredients || []), ...(recipe.instructions || [])].filter(Boolean).join("\0");
        return !allText.includes(PREMIUM_MARKER);
      });

      const start = (page - 1) * perPage;
      const end = start + perPage;
      const recipes = interleaved.slice(start, end);
      const hasMore = end < interleaved.length;

      res.json({ recipes, hasMore });
    } catch (err) {
      console.error('Search error:', err);
      res.status(500).json({ message: 'Failed to search recipes' });
    }
  });

  app.post(api.import.recipe.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { url } = api.import.recipe.input.parse(req.body);

      // Detect source platform from hostname
      const urlHostname = (() => { try { return new URL(url).hostname.toLowerCase(); } catch { return ''; } })();
      const sourcePlatform: 'instagram' | 'tiktok' | 'website' =
        urlHostname.includes('instagram.com') ? 'instagram' :
        urlHostname.includes('tiktok.com') ? 'tiktok' :
        'website';

      // Source gate — check if this domain's source is enabled
      const importSourceKey = getSourceKeyForUrl(url);
      if (importSourceKey && !(await isSourceCallable(importSourceKey))) {
        await logAuditEvent({
          userId: (req.user as any)?.id ?? null,
          action: "import",
          sourceName: importSourceKey,
          urlOrQuery: url,
          reason: "source_disabled",
        });
        return res.status(403).json({ message: "This recipe source is currently disabled by the administrator." });
      }

      const browserHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      };

      let html = '';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const nativeRes = await fetch(url, {
          headers: browserHeaders,
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);
        if (nativeRes.ok) {
          html = await nativeRes.text();
        }
      } catch {
        clearTimeout(timeout);
      }

      if (!html) {
        try {
          const axiosRes = await axios.get(url, {
            headers: browserHeaders,
            timeout: 15000,
            maxContentLength: 5 * 1024 * 1024,
            maxRedirects: 5,
            responseType: 'text',
          });
          // Only accept text/html responses — reject JSON, binary, or bot-challenge pages
          const ct = String(axiosRes.headers['content-type'] || '');
          if (typeof axiosRes.data === 'string' && (ct.includes('text/html') || ct.includes('text/plain') || ct === '')) {
            html = axiosRes.data;
          }
        } catch {}
      }

      if (!html) {
        const cleanUrl = url.replace(/#.*$/, '').replace(/\/$/, '') + '/';
        const parsedUrl = new URL(cleanUrl);
        const slug = parsedUrl.pathname.split('/').filter(Boolean).pop();
        if (slug) {
          try {
            const wpApiUrl = `${parsedUrl.origin}/wp-json/wp/v2/posts?slug=${slug}&_fields=title,content`;
            const wpRes = await fetch(wpApiUrl, {
              headers: { 'User-Agent': browserHeaders['User-Agent'] },
            });
            if (wpRes.ok) {
              const wpData = await wpRes.json() as any[];
              if (wpData && wpData.length > 0) {
                const postHtml = wpData[0].content?.rendered || '';
                const postTitle = wpData[0].title?.rendered || '';
                html = `<html><head><title>${postTitle}</title></head><body>${postHtml}</body></html>`;
              }
            }
          } catch {}
        }
      }

      if (!html) {
        // Social platforms failing to load is expected — return structured failure
        if (sourcePlatform === 'instagram' || sourcePlatform === 'tiktok') {
          const platformName = sourcePlatform === 'instagram' ? 'Instagram' : 'TikTok';
          return res.json({
            confidence: 'failed' as const,
            sourcePlatform,
            failureReason: `This ${platformName} post is not publicly accessible. Try pasting the recipe text instead.`,
            title: '', ingredients: [], instructions: [], imageUrl: null, nutrition: {}, servings: 1, extractedText: null,
          });
        }
        // Return as structured failure rather than HTTP 403 so the UI shows the inline error message
        return res.json({
          confidence: 'failed' as const,
          sourcePlatform,
          failureReason: "We couldn't load this page. The site may be blocking automated access. Try copying and pasting the recipe text instead.",
          title: '', ingredients: [], instructions: [], imageUrl: null, nutrition: {}, servings: 1, extractedText: null,
        });
      }

      const $ = cheerio.load(html);

      // ── Social platform extraction (og:meta only — no JSON-LD on these platforms) ──
      if (sourcePlatform === 'instagram' || sourcePlatform === 'tiktok') {
        const platformName = sourcePlatform === 'instagram' ? 'Instagram' : 'TikTok';
        const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || '';
        // og:description tends to be the fuller caption; prefer it as parsing source
        const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || '';
        const rawOgImage = $('meta[property="og:image"]').attr('content') || null;
        // Only use image URL if it's a valid absolute URL — never block import if absent
        const ogImage: string | null = rawOgImage && rawOgImage.startsWith('http') ? rawOgImage : null;
        // Use og:description as primary caption source; fall back to og:title stripped of prefix
        const captionSource = ogDescription || ogTitle;
        const extractedText = [ogTitle, ogDescription].filter(Boolean).join('\n').trim();

        if (!captionSource) {
          return res.json({
            confidence: 'failed' as const,
            sourcePlatform,
            failureReason: `This ${platformName} post is not publicly accessible. Copy the recipe text and paste it manually.`,
            title: '', ingredients: [], instructions: [], imageUrl: null, nutrition: {}, servings: 1, extractedText: null,
          });
        }

        const parsed = parseSocialCaption(captionSource);

        const hasTitle = parsed.title && parsed.title !== 'Imported Recipe';
        const hasIngredients = parsed.ingredients.length > 0;
        const hasInstructions = parsed.instructions.length > 0;

        const confidence =
          hasTitle && hasIngredients && hasInstructions ? 'high' as const
          : hasIngredients || hasInstructions ? 'partial' as const
          : 'partial' as const; // text present but unstructured — let AI handle in Step 5

        const missingParts: string[] = [];
        if (!hasIngredients) missingParts.push('ingredients');
        if (!hasInstructions) missingParts.push('method');
        const failureReason = missingParts.length > 0
          ? `Recipe text was found but ${missingParts.join(' and ')} could not be fully extracted. Please review before saving.`
          : null;

        return res.json({
          confidence,
          sourcePlatform,
          failureReason,
          extractedText,
          title: parsed.title,
          ingredients: parsed.ingredients,
          instructions: parsed.instructions,
          imageUrl: ogImage,
          nutrition: {},
          servings: parsed.servings,
        });
      }

      const jsonLdRecipe = extractJsonLdRecipe($);

      const IMPORT_PREMIUM_MARKER = "This is a premium piece of content available to subscribed users.";

      if (jsonLdRecipe && jsonLdRecipe.recipeIngredient && jsonLdRecipe.recipeIngredient.length > 0) {
        const title = jsonLdRecipe.name || $('h1').first().text().trim() || $('title').text().trim() || 'Imported Recipe';
        const ingredients = jsonLdRecipe.recipeIngredient.map(i => i.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        const instructions = extractJsonLdInstructions(jsonLdRecipe.recipeInstructions);
        const finalInstructions = instructions.length > 0 ? instructions : ["No instructions available"];
        const imageUrl = extractJsonLdImage(jsonLdRecipe) || $('meta[property="og:image"]').attr('content') || null;
        const nutrition = extractJsonLdNutrition(jsonLdRecipe.nutrition);

        const importAllText = [...ingredients, ...finalInstructions].join("\0");
        if (importAllText.includes(IMPORT_PREMIUM_MARKER)) {
          return res.status(403).json({ message: "This recipe is behind a paywall and cannot be imported." });
        }

        let servings = 1;
        if (jsonLdRecipe.recipeYield) {
          const yieldVal = Array.isArray(jsonLdRecipe.recipeYield) ? jsonLdRecipe.recipeYield[0] : jsonLdRecipe.recipeYield;
          const yieldStr = String(yieldVal);
          const numMatch = yieldStr.match(/(\d+)/);
          if (numMatch) servings = parseInt(numMatch[1], 10) || 1;
        }

        return res.json({
          title, ingredients, instructions: finalInstructions, imageUrl, nutrition, servings,
          confidence: 'high' as const,
          sourcePlatform,
          failureReason: null,
          extractedText: null,
        });
      }

      let title = $('h1').first().text().trim();
      if (!title) title = $('title').text().trim();
      if (!title) title = 'Imported Recipe';

      let imageUrl: string | null = null;
      imageUrl = $('meta[property="og:image"]').attr('content') || null;
      if (!imageUrl) {
        const imgSelectors = [
          'img[class*="recipe"]', 'img[class*="hero"]', 'img[class*="main"]',
          'img[class*="featured"]', 'img[id*="recipe"]', 'img[id*="hero"]',
          '.recipe-image img', '.hero-image img', 'article img',
        ];
        for (const sel of imgSelectors) {
          const src = $(sel).first().attr('src');
          if (src) {
            imageUrl = src.startsWith('http') ? src : new URL(src, url).href;
            break;
          }
        }
      }

      const ingredients: string[] = [];
      const macroTexts: string[] = [];
      const measurements = ['g', 'kg', 'ml', 'l', 'cup', 'cups', 'tsp', 'tbsp', 'teaspoon', 'tablespoon', 'pound', 'lb', 'oz', 'ounce', 'pinch', 'dash', 'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces'];
      const measurementRegex = new RegExp(`\\d+\\s*(${measurements.join('|')})`, 'i');

      $('li').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length < 3 || text.length > 100) return;
        
        if (isMacroLine(text)) {
          macroTexts.push(text);
          return;
        }

        const isIngredient = 
          measurementRegex.test(text) || 
          $(el).attr('class')?.toLowerCase().includes('ingredient') || 
          $(el).parent().attr('class')?.toLowerCase().includes('ingredient');

        if (isIngredient && !ingredients.includes(text)) {
          ingredients.push(text);
        }
      });

      if (ingredients.length === 0) {
        $('p, div').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length >= 3 && text.length <= 100 && !isMacroLine(text) && measurementRegex.test(text) && !ingredients.includes(text)) {
            ingredients.push(text);
          }
        });
      }

      $('*').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 0 && text.length < 200 && isMacroLine(text)) {
          macroTexts.push(text);
        }
      });

      const nutritionData = extractNutritionFromText(macroTexts);

      const instructions: string[] = [];
      const methodSelectors = [
        '.method-steps__list-item p',
        '.method-steps__list-item > div p',
        '.recipe-method li p',
        '.recipe-method li', '.method-steps li', '.recipe-steps li',
        '.instructions li', '.method li', '.steps li', '.directions li',
        '.recipe-method ol li', '.recipe-directions li',
        '[class*="instruction"] li', '[class*="method"] li', '[class*="step"] li', '[class*="direction"] li',
        '.recipe-method p', '.method-steps p',
      ];

      for (const sel of methodSelectors) {
        $(sel).each((_, el) => {
          const text = $(el).text().trim();
          if (text.length >= 5 && text.length <= 1000 && !instructions.includes(text)) {
            instructions.push(text);
          }
        });
        if (instructions.length > 0) break;
      }

      if (instructions.length === 0) {
        $('ol li').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length >= 10 && text.length <= 1000 && !measurementRegex.test(text) && !isMacroLine(text) && !ingredients.includes(text) && !instructions.includes(text)) {
            instructions.push(text);
          }
        });
      }

      const cleanedInstructions = instructions.map(text => 
        text.replace(/^step\s*\d+\s*/i, '').trim()
      ).filter(text => text.length >= 5);
      const finalInstructions = cleanedInstructions.length > 0 ? cleanedInstructions : ["No instructions available"];

      let servings = 1;
      const servingsSelectors = [
        '.recipe-serving', '.recipe-servings', '.serves', '.servings',
        '[class*="serving"]', '[class*="yield"]', '[itemprop="recipeYield"]',
      ];
      for (const sel of servingsSelectors) {
        const text = $(sel).first().text().trim();
        if (text) {
          const numMatch = text.match(/(\d+)/);
          if (numMatch) { servings = parseInt(numMatch[1], 10) || 1; break; }
        }
      }

      const fallbackAllText = [...ingredients, ...finalInstructions].join("\0");
      if (fallbackAllText.includes(IMPORT_PREMIUM_MARKER)) {
        return res.status(403).json({ message: "This recipe is behind a paywall and cannot be imported." });
      }

      const fallbackConfidence =
        title && title !== 'Imported Recipe' && ingredients.length >= 2 && finalInstructions[0] !== 'No instructions available'
          ? 'high' as const
          : (title !== 'Imported Recipe' || ingredients.length > 0)
          ? 'partial' as const
          : 'failed' as const;

      res.json({
        title, ingredients, instructions: finalInstructions, imageUrl, nutrition: nutritionData, servings,
        confidence: fallbackConfidence,
        sourcePlatform,
        failureReason: fallbackConfidence === 'failed' ? 'No recipe content found on this page.' : null,
        extractedText: null,
      });
    } catch (err) {
      console.error('Import error:', err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid URL' });
      }
      // Surface as a structured failure so the UI shows the inline error, not a raw error state
      res.json({
        confidence: 'failed' as const,
        sourcePlatform: 'website' as const,
        failureReason: "Something went wrong while importing this recipe. Please try a different URL or paste the recipe text instead.",
        title: '', ingredients: [], instructions: [], imageUrl: null, nutrition: {}, servings: 1, extractedText: null,
      });
    }
  });

  // ── Import recipe from pasted text ──────────────────────────────────────────
  app.post(api.import.recipeFromText.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // ── TEMP DIAG: IRT_DEBUG_2026_04_15 ──────────────────────────────────────
    const irtLog = (msg: string) => console.log(`[IRT_DIAG] ${msg}`);
    const sawOpenAIKey = !!process.env.OPENAI_API_KEY;
    let branch: 'openai_success' | 'openai_error' | 'heuristic_fallback' | 'failed_before_openai' | 'failed_after_openai' = 'failed_before_openai';
    const BUILD_MARKER = 'IRT_DEBUG_2026_04_15';
    irtLog('route hit');
    // ── END TEMP DIAG HEADER ─────────────────────────────────────────────────

    const parseResult = api.import.recipeFromText.input.safeParse(req.body);
    if (!parseResult.success) {
      irtLog(`validation failed — returning failed_before_openai`);
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const { text } = parseResult.data;
    irtLog(`text length: ${text.length}`);
    irtLog(`openai key present: ${sawOpenAIKey}`);

    // Fast path: if no OpenAI key, fall back to deterministic heuristic parser
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[import-recipe-from-text] OPENAI_API_KEY not set — using heuristic parser");
      branch = 'heuristic_fallback';
      irtLog(`returning heuristic_fallback (no key)`);
      const parsed = parseSocialCaption(text);
      const hasTitle = parsed.title && parsed.title !== 'Imported Recipe';
      const hasIngredients = parsed.ingredients.length > 0;
      const hasInstructions = parsed.instructions.length > 0;
      const confidence =
        hasTitle && hasIngredients && hasInstructions ? 'high' as const
        : hasIngredients || hasInstructions ? 'partial' as const
        : 'failed' as const;
      return res.json({
        title: parsed.title,
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        servings: parsed.servings,
        imageUrl: null,
        sourcePlatform: 'manual' as const,
        confidence,
        parsedBy: 'heuristic' as const,
        failureReason: confidence === 'failed'
          ? "We couldn't extract a recipe from this text. Please edit and try again."
          : null,
        extractedText: text,
        nutrition: {},
        buildMarker: BUILD_MARKER,
        debug: { sawOpenAIKey, branch },
      });
    }

    irtLog('entering openai branch');

    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are a recipe extraction assistant. Given raw text (e.g. a TikTok caption, blog post, or pasted recipe), extract the recipe structure.

Return ONLY valid JSON in this exact shape:
{
  "title": string or null,
  "ingredients": string[],
  "instructions": string[],
  "servings": number or null
}

Rules:
- Extract only what is clearly present in the text. Do NOT invent, guess, or hallucinate.
- ingredients: each item as a single line (e.g. "2 cups flour"). Empty array if not found.
- instructions: each step as a single sentence or short paragraph. Empty array if not found.
- servings: a number if mentioned, otherwise null.
- title: the recipe name if present, otherwise null.
- No markdown, no explanation, no extra keys. Just the JSON object.`;

      irtLog('sending openai request');
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });
      irtLog('openai request succeeded');

      let extracted: { title: string | null; ingredients: string[]; instructions: string[]; servings: number | null } = {
        title: null, ingredients: [], instructions: [], servings: null,
      };

      try {
        const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
        const parsed = JSON.parse(raw);

        // Post-process ingredients: must be short single-line strings, trimmed, non-empty
        const rawIngredients: string[] = Array.isArray(parsed.ingredients)
          ? parsed.ingredients.filter((s: any) => typeof s === 'string')
          : [];
        const ingredients = rawIngredients
          .flatMap(s => s.split('\n'))           // split any newline-concatenated items
          .map(s => s.replace(/\s+/g, ' ').trim()) // collapse internal whitespace
          .filter(s => s.length > 0 && s.length <= 200); // remove empty and absurdly long lines

        // Post-process instructions: split long paragraphs into individual steps,
        // strip leading step numbers/bullets, trim, remove empty strings
        const rawInstructions: string[] = Array.isArray(parsed.instructions)
          ? parsed.instructions.filter((s: any) => typeof s === 'string')
          : [];
        const instructions = rawInstructions
          .flatMap(s => s.split(/\n+/))                          // split on newlines
          .flatMap(s => s.split(/(?<=\.)\s+(?=[A-Z])/))          // split "Sentence. Next sentence."
          .map(s => s.replace(/^\s*(?:\d+[\.\)]|[-•*])\s*/, '')) // strip "1." "1)" "-" "•" prefixes
          .map(s => s.replace(/\s+/g, ' ').trim())               // collapse whitespace
          .filter(s => s.length > 0);                            // remove empty strings

        extracted = {
          title: typeof parsed.title === 'string' ? parsed.title.trim() || null : null,
          ingredients,
          instructions,
          servings: typeof parsed.servings === 'number' ? parsed.servings : null,
        };
      } catch (parseErr) {
        console.error('[import-recipe-from-text] Failed to parse AI JSON response:', parseErr instanceof Error ? parseErr.message : parseErr);
      }

      const hasTitle = !!extracted.title;
      const hasIngredients = extracted.ingredients.length > 0;
      const hasInstructions = extracted.instructions.length > 0;

      const confidence =
        hasTitle && hasIngredients && hasInstructions ? 'high' as const
        : hasIngredients || hasInstructions ? 'partial' as const
        : 'failed' as const;

      branch = confidence === 'failed' ? 'failed_after_openai' : 'openai_success';
      irtLog(`returning ${branch}`);

      return res.json({
        title: extracted.title || 'Imported Recipe',
        ingredients: extracted.ingredients,
        instructions: extracted.instructions,
        servings: extracted.servings ?? 1,
        imageUrl: null,
        sourcePlatform: 'manual' as const,
        confidence,
        parsedBy: 'openai' as const,
        failureReason: confidence === 'failed'
          ? "We couldn't extract a recipe from this text. Please edit and try again."
          : null,
        extractedText: text,
        nutrition: {},
        buildMarker: BUILD_MARKER,
        debug: { sawOpenAIKey, branch },
      });
    } catch (err) {
      branch = 'openai_error';
      irtLog(`openai error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('[import-recipe-from-text] AI error — falling back to heuristic parser:', err);
      const parsed = parseSocialCaption(text);
      const hasIngredients = parsed.ingredients.length > 0;
      const hasInstructions = parsed.instructions.length > 0;
      const confidence =
        hasIngredients && hasInstructions ? 'partial' as const
        : hasIngredients || hasInstructions ? 'partial' as const
        : 'failed' as const;
      irtLog(`returning heuristic_fallback (after openai_error)`);
      return res.json({
        title: parsed.title || 'Imported Recipe',
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        servings: parsed.servings ?? 1,
        imageUrl: null,
        sourcePlatform: 'manual' as const,
        confidence,
        parsedBy: 'heuristic' as const,
        failureReason: confidence === 'failed'
          ? "We couldn't extract a recipe from this text. Please edit and try again."
          : null,
        extractedText: text,
        nutrition: {},
        buildMarker: BUILD_MARKER,
        debug: { sawOpenAIKey, branch },
      });
    }
  });

  app.post(api.import.parse.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parseResult = api.import.parse.input.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Invalid request body', errors: parseResult.error.flatten() });
    }

    const { rawText, source } = parseResult.data;
    const startMs = Date.now();

    // Split on newlines, commas, and conjunctions ("and", "plus")
    const lines = rawText
      .split(/[\n,]|\s+and\s+|\s+plus\s+/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // ── Deterministic parse ──────────────────────────────────────────────────
    const items = lines.map((line) => {
      const parsed = parseIngredientShared(line);
      const hasQuantityOrUnit = parsed.quantity !== null || parsed.unit !== null;

      // Apply word-level food spelling correction (deterministic, no AI required).
      // e.g. "brocoli" → "broccoli", "aurbegine" → "aubergine"
      const correctedName = parsed.productName
        .split(/\s+/)
        .map(w => correctFoodSpelling(w))
        .join(' ');
      const correctedNormalized = correctedName !== parsed.productName
        ? normalizeIngredientKey(correctedName)
        : parsed.normalizedName;

      // ── Food constructs layer ─────────────────────────────────────────────
      // Runs after spelling correction + normalisation, before taxonomy lookup.
      // Resolves colloquial / composite inputs ("chip butty", "round of
      // sandwiches", "slice of pizza") to canonical ingredient representations.
      const construct = lookupFoodConstruct(correctedNormalized);
      if (construct) {
        if (!construct.resolvedName) {
          logConstructMappingFailure(construct, "resolvedName is empty");
        } else {
          const resolvedNormalized = normalizeIngredientKey(construct.resolvedName);
          const resolvedCategory =
            construct.category ??
            INGREDIENT_TAXONOMY[resolvedNormalized] ??
            'uncategorised';
          console.log(
            `[food-constructs] resolved: "${line}" → "${construct.resolvedName}"` +
              (construct.unit !== undefined ? ` unit="${construct.unit}"` : "") +
              (construct.quantityMultiplier !== undefined ? ` qty×${construct.quantityMultiplier}` : "")
          );
          return {
            productName: construct.resolvedName,
            normalizedName: resolvedNormalized,
            quantity: construct.quantityMultiplier != null
              ? String(construct.quantityMultiplier)
              : parsed.quantity,
            unit: construct.unit !== undefined ? construct.unit : parsed.unit,
            confidence: 'high' as const,   // constructs are deterministic
            ambiguous: false,
            category: resolvedCategory,
            ...(construct.components ? { components: construct.components } : {}),
          };
        }
      } else if (isLikelyFoodConstruct(correctedNormalized)) {
        // Input looks construct-like but we don't have a mapping for it yet —
        // log so it can be added to EXACT_CONSTRUCTS in the next pass.
        logUnrecognisedConstruct(line, correctedNormalized);
      }

      const category = INGREDIENT_TAXONOMY[correctedNormalized] ?? INGREDIENT_TAXONOMY[parsed.normalizedName] ?? 'uncategorised';
      return {
        productName: correctedName,
        normalizedName: correctedNormalized,
        quantity: parsed.quantity,
        unit: parsed.unit,
        confidence: (hasQuantityOrUnit ? 'high' : 'low') as 'high' | 'low',
        ambiguous: false,
        category,
      };
    });

    // ── AI enhancement for genuinely ambiguous items only ───────────────────
    // Simple 1-3 word inputs that are already clean ingredient names skip AI.
    // Only send inputs that contain filler/informal language suggesting the
    // deterministic result may not reflect what the user actually meant.
    const FILLER_WORDS = new Set([
      'some', 'bit', 'cheeky', 'nice', 'fresh', 'few', 'handful',
      'dash', 'drizzle', 'optional', 'little', 'large', 'big', 'good',
    ]);

    function isClearlySimpleIngredient(raw: string, normalizedName: string): boolean {
      const words = raw.trim().toLowerCase().split(/\s+/);
      if (words.length > 3) return false;
      if (!/^[a-z\s]+$/.test(raw.trim().toLowerCase())) return false;
      if (words.some(w => FILLER_WORDS.has(w))) return false;
      // If the normalized name isn't in the taxonomy and any word is longer than
      // 3 characters, treat as a likely misspelling and send to AI.
      if (!(normalizedName in INGREDIENT_TAXONOMY) && words.some(w => w.length > 3)) return false;
      return true;
    }

    let aiUsed = false;
    const lowIndices = items
      .map((item, i) =>
        item.confidence === 'low' && !isClearlySimpleIngredient(lines[i], item.normalizedName) ? i : -1
      )
      .filter(i => i >= 0);

    console.log('[parse] key present:', !!process.env.OPENAI_API_KEY, '| lowIndices:', lowIndices);

    if (lowIndices.length > 0 && process.env.OPENAI_API_KEY) {
      console.log('[parse] AI branch entered');
      try {
        const ambiguousLines = lowIndices.map(i => lines[i]);
        const { default: OpenAI } = await import("openai");
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const systemPrompt = `You are an ingredient extractor for a UK grocery app. Given a JSON array of informal or messy ingredient descriptions, return a JSON array of the same length with structured items in the same order.

For each item extract:
- productName: clean ingredient name, title case, no quantities or prep notes (e.g. "Chicken breast")
- quantity: numeric string only (e.g. "2", "500"), or null
- unit: unit string only (e.g. "cloves", "g", "ml"), or null

Return ONLY a valid JSON array, no markdown, no explanation, no extra fields.

Example input: ["cheeky chicken breast","some greek yoghurt","a bit of olive oil"]
Example output: [{"productName":"Chicken breast","quantity":null,"unit":null},{"productName":"Greek yoghurt","quantity":null,"unit":null},{"productName":"Olive oil","quantity":null,"unit":null}]`;

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(ambiguousLines) },
          ],
          temperature: 0,
          max_tokens: 800,
        });

        const raw = response.choices[0]?.message?.content?.trim() ?? '';
        console.log('[parse] AI raw response:', raw);
        // Strip markdown code fences that some models add despite instructions
        const cleanedRaw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        const aiResults: Array<{ productName: string; quantity: string | null; unit: string | null } | null> = JSON.parse(cleanedRaw);
        console.log('[parse] aiResults length:', aiResults?.length, 'expected:', lowIndices.length);

        if (Array.isArray(aiResults) && aiResults.length === lowIndices.length) {
          for (let j = 0; j < lowIndices.length; j++) {
            const aiItem = aiResults[j];
            if (aiItem && typeof aiItem.productName === 'string' && aiItem.productName.trim()) {
              const idx = lowIndices[j];
              const resolvedName = aiItem.productName.trim();
              const resolvedNormalized = normalizeIngredientKey(resolvedName);
              const resolvedCategory = INGREDIENT_TAXONOMY[resolvedNormalized] ?? 'uncategorised';
              items[idx] = {
                ...items[idx],
                productName: resolvedName,
                normalizedName: resolvedNormalized,
                quantity: aiItem.quantity ?? items[idx].quantity,
                unit: aiItem.unit ?? items[idx].unit,
                ambiguous: false,
                category: resolvedCategory,
              };
            }
          }
          aiUsed = true;
        }
      } catch (aiErr) {
        console.error('[parse] AI call failed:', aiErr instanceof Error ? aiErr.message : aiErr);
      }
    }

    console.log('[parse] returning aiUsed:', aiUsed, '| items:', items.map(it => it.productName));
    return res.json({
      // Attach needsReview to each item so the client can surface unrecognised
      // items visibly instead of silently adding them with invented prices.
      items: items.map(item => ({
        ...item,
        needsReview: item.category === 'uncategorised',
      })),
      meta: {
        source,
        aiUsed,
        processingMs: Date.now() - startMs,
      },
    });
  });

  app.post('/api/preview-recipe', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { url } = z.object({ url: z.string().url() }).parse(req.body);

      const browserHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      };

      let html = '';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const nativeRes = await fetch(url, { headers: browserHeaders, signal: controller.signal, redirect: 'follow' });
        clearTimeout(timeout);
        if (nativeRes.ok) {
          html = await nativeRes.text();
        } else {
          console.warn(`[preview-recipe] fetch returned non-OK status ${nativeRes.status} for ${url}`);
        }
      } catch (fetchErr) {
        clearTimeout(timeout);
        console.warn(`[preview-recipe] native fetch failed for ${url}:`, fetchErr instanceof Error ? fetchErr.message : fetchErr);
      }

      if (!html) {
        try {
          const axiosRes = await axios.get(url, { headers: browserHeaders, timeout: 15000, maxContentLength: 5 * 1024 * 1024, maxRedirects: 5 });
          html = axiosRes.data;
        } catch (axiosErr) {
          console.warn(`[preview-recipe] axios fallback also failed for ${url}:`, axiosErr instanceof Error ? axiosErr.message : axiosErr);
        }
      }

      if (!html) {
        console.error(`[preview-recipe] all fetch methods failed for ${url} — returning empty result`);
        return res.json({ ingredients: [], instructions: [], error: 'Could not access this recipe page' });
      }

      const $ = cheerio.load(html);
      const jsonLdRecipe = extractJsonLdRecipe($);

      if (jsonLdRecipe && jsonLdRecipe.recipeIngredient && jsonLdRecipe.recipeIngredient.length > 0) {
        const ingredients = jsonLdRecipe.recipeIngredient.map(i => i.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        const instructions = extractJsonLdInstructions(jsonLdRecipe.recipeInstructions);
        return res.json({ ingredients, instructions: instructions.length > 0 ? instructions : [] });
      }

      const ingredients: string[] = [];
      const measurements = ['g', 'kg', 'ml', 'l', 'cup', 'cups', 'tsp', 'tbsp', 'teaspoon', 'tablespoon', 'pound', 'lb', 'oz', 'ounce', 'pinch', 'dash', 'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces'];
      const measurementRegex = new RegExp(`\\d+\\s*(${measurements.join('|')})`, 'i');

      $('li').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length < 3 || text.length > 100) return;
        if (isMacroLine(text)) return;
        const isIngredient = measurementRegex.test(text) || $(el).attr('class')?.toLowerCase().includes('ingredient') || $(el).parent().attr('class')?.toLowerCase().includes('ingredient');
        if (isIngredient && !ingredients.includes(text)) ingredients.push(text);
      });

      if (ingredients.length === 0) {
        $('p, div').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length >= 3 && text.length <= 100 && !isMacroLine(text) && measurementRegex.test(text) && !ingredients.includes(text)) {
            ingredients.push(text);
          }
        });
      }

      const instructions: string[] = [];
      const methodSelectors = [
        '.method-steps__list-item p', '.method-steps__list-item > div p', '.recipe-method li p',
        '.recipe-method li', '.method-steps li', '.recipe-steps li',
        '.instructions li', '.method li', '.steps li', '.directions li',
        '.recipe-method ol li', '.recipe-directions li',
        '[class*="instruction"] li', '[class*="method"] li', '[class*="step"] li', '[class*="direction"] li',
        '.recipe-method p', '.method-steps p',
      ];

      for (const sel of methodSelectors) {
        $(sel).each((_, el) => {
          const text = $(el).text().trim();
          if (text.length >= 5 && text.length <= 1000 && !instructions.includes(text)) instructions.push(text);
        });
        if (instructions.length > 0) break;
      }

      if (instructions.length === 0) {
        $('ol li').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length >= 10 && text.length <= 1000 && !measurementRegex.test(text) && !isMacroLine(text) && !ingredients.includes(text) && !instructions.includes(text)) {
            instructions.push(text);
          }
        });
      }

      const cleanedInstructions = instructions.map(text => text.replace(/^step\s*\d+\s*/i, '').trim()).filter(text => text.length >= 5);

      res.json({ ingredients, instructions: cleanedInstructions });
    } catch (err) {
      console.error('Preview recipe error:', err);
      res.json({ ingredients: [], instructions: [], error: 'Failed to fetch recipe details' });
    }
  });

  app.get('/api/product-alternatives', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const q = (req.query.q as string || '').trim();
      const category = (req.query.category as string || '').trim();

      if (!q) return res.json({ alternatives: [] });

      const allAdditives = await storage.getAllAdditives();

      const searchTerms = category
        ? `${q} organic natural`
        : `${q} organic natural`;

      const altFields = 'code,product_name,product_name_en,brands,image_front_url,image_url,ingredients_text,ingredients_text_en,nutriments,nova_group,nutriscore_grade,countries_tags,categories_tags';
      const altHeaders = { timeout: 15000, headers: { 'User-Agent': 'SmartMealPlanner/1.0 (contact: smartmealplanner@replit.app)' } };

      const [ukAltRes, globalAltRes] = await Promise.allSettled([
        axios.get(`https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&json=1&page_size=12&fields=${altFields}&tagtype_0=countries&tag_contains_0=contains&tag_0=united-kingdom`, altHeaders),
        axios.get(`https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&json=1&page_size=12&fields=${altFields}`, altHeaders),
      ]);

      const ukAltProducts: any[] = ukAltRes.status === 'fulfilled' ? (ukAltRes.value.data.products || []) : [];
      const globalAltProducts: any[] = globalAltRes.status === 'fulfilled' ? (globalAltRes.value.data.products || []) : [];

      const altSeen = new Set<string>();
      const mergedAlts: any[] = [];
      for (const p of [...ukAltProducts, ...globalAltProducts]) {
        const key = `${p.code || ''}:${(p.product_name || '').toLowerCase()}:${(p.brands || '').toLowerCase()}`;
        if (altSeen.has(key)) continue;
        // Exclude products without usable English ingredient text — they must not
        // appear as recommended alternatives or affect swap rankings.
        if (!hasEnglishIngredients(p)) continue;
        altSeen.add(key);
        mergedAlts.push(p);
      }

      const alternatives = mergedAlts
        .map((p: any) => {
          const ingredientsText = p.ingredients_text_en || p.ingredients_text || '';
          // TODO [PREMIUM]: hasPremiumAccess(user) — enforce analysis limit for free users
          const analysis = ingredientsText ? analyzeProduct(ingredientsText, p.nutriments || null, p.nova_group || null) : null;
          const altUpf = ingredientsText && analysis ? analyzeProductUPF(ingredientsText, allAdditives, analysis.healthScore, {
            productName: p.product_name || p.product_name_en || '',
            categoriesTags: p.categories_tags || [],
            novaGroup: p.nova_group || null,
          }, analysis.ingredients) : null;
          const altCountries: string[] = p.countries_tags || [];
          const altIsUK = altCountries.some((c: string) => c === 'en:united-kingdom' || c === 'en:uk');

          return {
            barcode: p.code || null,
            product_name: p.product_name || p.product_name_en || 'Unknown Product',
            brand: p.brands || null,
            image_url: p.image_front_url || p.image_url || null,
            ingredients_text: ingredientsText || null,
            nova_group: p.nova_group || (analysis?.novaGroup ?? null),
            nutriscore_grade: p.nutriscore_grade || null,
            isUK: altIsUK,
            nutriments: p.nutriments ? {
              calories: p.nutriments['energy-kcal_100g'] ? `${p.nutriments['energy-kcal_100g']} kcal` : null,
              protein: p.nutriments.proteins_100g ? `${p.nutriments.proteins_100g}g` : null,
              carbs: p.nutriments.carbohydrates_100g ? `${p.nutriments.carbohydrates_100g}g` : null,
              fat: p.nutriments.fat_100g ? `${p.nutriments.fat_100g}g` : null,
              sugar: p.nutriments.sugars_100g ? `${p.nutriments.sugars_100g}g` : null,
              salt: p.nutriments.salt_100g ? `${p.nutriments.salt_100g}g` : null,
            } : null,
            analysis: analysis || null,
            upfAnalysis: altUpf ? {
              upfScore: altUpf.upfScore,
              thaRating: altUpf.thaRating,
              additiveCount: altUpf.additiveCount,
              regulatoryCount: altUpf.regulatoryCount,
              additiveMatches: altUpf.additiveMatches.map(m => ({
                name: m.additive.name,
                type: m.additive.type,
                riskLevel: m.additive.riskLevel,
                description: m.additive.description,
                foundIn: m.foundIn,
                isRegulatory: m.isRegulatory,
              })),
              processingIndicators: altUpf.processingIndicators,
              ingredientCount: altUpf.ingredientCount,
              upfIngredientCount: altUpf.upfIngredientCount,
              riskBreakdown: altUpf.riskBreakdown,
              thaExplanation: buildTHAExplanation(altUpf, p.nova_group || null),
            } : null,
          };
        })
        .filter((alt: any) => {
          if (!alt.analysis) return false;
          return alt.analysis.novaGroup <= 2 || alt.analysis.healthScore >= 60;
        })
        .sort((a: any, b: any) => (b.analysis?.healthScore ?? 0) - (a.analysis?.healthScore ?? 0))
        .slice(0, 5);

      res.json({ alternatives });
    } catch (err) {
      console.error('Product alternatives error:', err);
      res.status(500).json({ message: 'Failed to find alternatives' });
    }
  });

  const COMMON_ALLERGENS = [
    { name: 'milk', keywords: ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'yoghurt', 'whey', 'casein', 'lactose', 'ghee', 'curd'] },
    { name: 'eggs', keywords: ['egg', 'eggs', 'mayonnaise', 'meringue', 'albumin'] },
    { name: 'fish', keywords: ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'anchovies', 'sardine', 'mackerel', 'trout', 'bass', 'haddock', 'halibut'] },
    { name: 'shellfish', keywords: ['shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop', 'squid', 'calamari', 'crawfish', 'crayfish'] },
    { name: 'nuts', keywords: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'macadamia', 'hazelnut', 'brazil nut', 'pine nut'] },
    { name: 'peanuts', keywords: ['peanut', 'peanuts', 'groundnut'] },
    { name: 'soy', keywords: ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce'] },
    { name: 'wheat', keywords: ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'couscous', 'semolina', 'breadcrumb'] },
    { name: 'gluten', keywords: ['gluten', 'wheat', 'barley', 'rye', 'oat', 'flour', 'bread', 'pasta', 'noodle', 'couscous', 'semolina'] },
  ];

  function detectAllergens(ingredients: string[]): string[] {
    const found = new Set<string>();
    const combined = ingredients.join(' ').toLowerCase();
    for (const allergen of COMMON_ALLERGENS) {
      for (const keyword of allergen.keywords) {
        if (combined.includes(keyword)) {
          found.add(allergen.name);
          break;
        }
      }
    }
    return Array.from(found);
  }

  function calculateHealthScore(nutrition: { sugar?: string | null; salt?: string | null; protein?: string | null }): number {
    let score = 50;
    const parseVal = (v: string | null | undefined) => {
      if (!v) return null;
      const match = v.match(/([\d.]+)/);
      return match ? parseFloat(match[1]) : null;
    };

    const sugar = parseVal(nutrition.sugar);
    const salt = parseVal(nutrition.salt);
    const protein = parseVal(nutrition.protein);

    if (sugar !== null) {
      if (sugar < 5) score += 20;
      else if (sugar < 15) score += 10;
      else if (sugar > 30) score -= 15;
      else if (sugar > 20) score -= 5;
    }

    if (salt !== null) {
      if (salt < 0.5) score += 15;
      else if (salt < 1.5) score += 5;
      else if (salt > 3) score -= 15;
      else if (salt > 2) score -= 5;
    }

    if (protein !== null) {
      if (protein > 30) score += 15;
      else if (protein > 15) score += 10;
      else if (protein > 5) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  app.post(api.analyze.meal.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { mealId } = api.analyze.meal.input.parse(req.body);
      const meal = await storage.getMeal(mealId);
      if (!meal || meal.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal not found" });
      }

      let savedNutrition = null;
      
      if (meal.sourceUrl) {
        const scraped = await scrapeNutritionFromSource(meal);
        if (scraped) {
          savedNutrition = await storage.getNutrition(mealId);
        }
      }

      if (!savedNutrition) {
        const nutritionTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0 };
        let validResults = 0;
        let anyEstimated = false;

        await Promise.all(
          meal.ingredients.map(async (ingredient) => {
            try {
              const cleanIngredient = cleanIngredientForLookup(ingredient);
              const response = await axios.get(
                `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(cleanIngredient)}&json=1&page_size=3`,
                { timeout: 8000, headers: { 'User-Agent': 'SmartMealPlanner/1.0' } }
              );

              const products = response.data.products || [];
              if (products.length === 0) return;

              let count = 0;
              let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0 };

              for (const p of products) {
                const n = p.nutriments;
                if (!n) continue;
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
            } catch {
            }
          })
        );

        const analyzeServings = meal.servings && meal.servings > 0 ? meal.servings : 1;
        if (validResults > 0) {
          const nutritionData = {
            mealId,
            calories: `${Math.round(nutritionTotals.calories / analyzeServings)} kcal`,
            protein: `${Math.round(nutritionTotals.protein / analyzeServings * 10) / 10}g`,
            carbs: `${Math.round(nutritionTotals.carbs / analyzeServings * 10) / 10}g`,
            fat: `${Math.round(nutritionTotals.fat / analyzeServings * 10) / 10}g`,
            sugar: `${Math.round(nutritionTotals.sugar / analyzeServings * 10) / 10}g`,
            salt: `${Math.round(nutritionTotals.salt / analyzeServings * 10) / 10}g`,
            source: anyEstimated ? 'openfoodfacts_estimated' : 'openfoodfacts_quantities',
          };
          savedNutrition = await storage.upsertNutrition(nutritionData);
        } else {
          savedNutrition = await storage.getNutrition(mealId);
        }
      }

      const allergens = detectAllergens(meal.ingredients);
      await storage.setMealAllergens(mealId, allergens);

      const allSwaps = await storage.getAllSwaps();
      const applicableSwaps: { ingredient: string; original: string; healthier: string }[] = [];
      for (const ing of meal.ingredients) {
        const ingLower = ing.toLowerCase();
        for (const swap of allSwaps) {
          if (
            ingLower.includes(swap.original.toLowerCase()) &&
            isCompatibleSwap(ing, swap.healthier)
          ) {
            applicableSwaps.push({ ingredient: ing, original: swap.original, healthier: swap.healthier });
          }
        }
      }

      const healthScore = calculateHealthScore(savedNutrition ?? {});

      res.json({
        nutrition: savedNutrition,
        servings: meal.servings || 1,
        allergens,
        healthScore,
        swaps: applicableSwaps,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error('Analyze meal error:', err);
      res.status(500).json({ message: 'Failed to analyze meal' });
    }
  });

  app.get(api.allergens.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const meal = await storage.getMeal(Number(req.params.id));
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }
    const allergens = await storage.getMealAllergens(meal.id);
    res.json(allergens);
  });

  app.get(api.swaps.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const swaps = await storage.getAllSwaps();
    res.json(swaps);
  });

  app.get(api.diets.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const allDiets = await storage.getAllDiets();
    res.json(allDiets);
  });

  app.get(api.diets.getMealDiets.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const meal = await storage.getMeal(Number(req.params.id));
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }
    const mealDiets = await storage.getMealDiets(meal.id);
    res.json(mealDiets);
  });

  app.post(api.diets.setMealDiets.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const meal = await storage.getMeal(Number(req.params.id));
      if (!meal || meal.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal not found" });
      }
      const { dietIds } = api.diets.setMealDiets.input.parse(req.body);
      const result = await storage.setMealDiets(meal.id, dietIds);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.shoppingList.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const items = await storage.getShoppingListItemsWithAttribution(req.user!.id);
      res.json(items);
    } catch (err) {
      console.error("[ShoppingList] GET error:", err);
      res.status(500).json({ message: "Failed to fetch shopping list" });
    }
  });

  app.post(api.shoppingList.add.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.shoppingList.add.input.parse(req.body);
      // ── Shared Item Resolution Layer ───────────────────────────────────────
      // Every item entering the shopping list goes through resolveItem() so that
      // resolution_state, canonical_name, category enforcement, and ambiguity
      // detection are applied consistently regardless of source.
      const { resolveItem } = await import('./lib/item-resolver');
      let resolved: Awaited<ReturnType<typeof resolveItem>>;
      try {
        resolved = resolveItem(input.productName, {
          callerCategory: input.category ?? null,
        });
      } catch (resolverErr) {
        console.error('[ShoppingList] resolveItem failed — falling back to raw entry:', resolverErr);
        const safeName = (input.productName ?? '').trim();
        const safeNorm = safeName.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        resolved = {
          originalText: safeName,
          productName: safeName,
          normalizedName: safeNorm,
          canonicalName: null,
          category: input.category && input.category !== 'uncategorised' ? input.category : 'other',
          subcategory: null,
          resolutionState: 'needs_review',
          reviewReason: 'unrecognised_item',
          reviewSuggestions: null,
          validationNote: 'Item could not be resolved — please verify',
          needsReview: true,
        };
      }

      // Override productName / normalizedName with resolved values so leading
      // quantities are stripped and the name is clean.
      input.productName = resolved.productName;

      // Build the final insert payload explicitly rather than mutating the Zod
      // result, which is unreliable with Drizzle's default-column handling.
      const insertPayload: Record<string, unknown> = { ...input };

      // Apply resolution fields — these always come from the resolver, not the client
      insertPayload.originalText     = resolved.originalText;
      insertPayload.normalizedName   = resolved.normalizedName;
      insertPayload.canonicalName    = resolved.canonicalName;
      insertPayload.category         = resolved.category;
      insertPayload.subcategory      = resolved.subcategory;
      insertPayload.resolutionState  = resolved.resolutionState;
      insertPayload.reviewReason     = resolved.reviewReason;
      insertPayload.reviewSuggestions= resolved.reviewSuggestions;
      insertPayload.needsReview      = resolved.needsReview;
      insertPayload.validationNote   = resolved.validationNote ?? (input.validationNote as string | undefined) ?? null;

      // Extract quantity from original text if the caller didn't send one
      if (!input.quantityValue) {
        const leadingQtyMatch = resolved.originalText.match(/^(\d+(?:\.\d+)?)\s+/);
        if (leadingQtyMatch) {
          insertPayload.quantityValue = parseFloat(leadingQtyMatch[1]);
        }
      }

      if (input.quantityValue && input.unit) {
        const grams = convertToGrams(input.quantityValue, input.unit);
        if (grams !== null) insertPayload.quantityInGrams = grams;
      }

      // Create / fetch the normalised ingredient record for deduplication
      const ingredient = await storage.getOrCreateNormalizedIngredient(
        resolved.productName, resolved.normalizedName, resolved.category
      );
      insertPayload.ingredientId = ingredient.id;

      const item = await storage.addShoppingListItem(
        req.user!.id,
        insertPayload as typeof input,
      );

      // Fire-and-forget AI classification for items the deterministic resolver
      // could not place. Runs after the response is sent; never blocks the caller.
      if (resolved.resolutionState === 'needs_review' && resolved.reviewReason === 'unrecognised_item') {
        setImmediate(async () => {
          try {
            await classifyAndEnrich(item.id, resolved.normalizedName);
          } catch (e) {
            console.error('[Classifier] background enrichment error:', e instanceof Error ? e.message : e);
          }
        });
      }

      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("[ShoppingList] POST /api/shopping-list error:", err);
      return res.status(500).json({ message: err instanceof Error ? err.message : "Failed to add item" });
    }
  });

  app.patch(api.shoppingList.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = Number(req.params.id);
    const items = await storage.getShoppingListItems(req.user!.id);
    if (!items.find(i => i.id === id)) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const updates: Record<string, any> = {};
    if (req.body.quantity !== undefined) {
      const quantity = Number(req.body.quantity);
      if (isNaN(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Invalid quantity' });
      }
      updates.quantity = quantity;
    }
    if (req.body.productName !== undefined) {
      // Re-resolve whenever the name changes so resolution state stays accurate
      const { resolveItem } = await import('./lib/item-resolver');
      const resolved = resolveItem(String(req.body.productName).trim(), {
        callerCategory: req.body.category ?? null,
      });
      updates.productName      = resolved.productName;
      updates.originalText     = resolved.originalText;
      updates.normalizedName   = resolved.normalizedName;
      updates.canonicalName    = resolved.canonicalName;
      updates.category         = resolved.category;
      updates.subcategory      = resolved.subcategory;
      updates.resolutionState  = resolved.resolutionState;
      updates.reviewReason     = resolved.reviewReason;
      updates.reviewSuggestions= resolved.reviewSuggestions;
      updates.needsReview      = resolved.needsReview;
      updates.validationNote   = resolved.validationNote;
      if (req.body.matchedProductId === undefined) {
        updates.matchedProductId = null;
        updates.matchedStore = null;
        updates.matchedPrice = null;
        updates.availableStores = null;
        updates.imageUrl = null;
      }
    }
    if (req.body.quantityValue !== undefined) {
      const qv = Number(req.body.quantityValue);
      if (!isNaN(qv)) updates.quantityValue = qv;
    }
    if (req.body.unit !== undefined) {
      updates.unit = String(req.body.unit).trim();
    }
    if (req.body.category !== undefined) {
      updates.category = String(req.body.category).trim();
    }
    if (req.body.selectedTier !== undefined) {
      updates.selectedTier = req.body.selectedTier === null ? null : String(req.body.selectedTier).trim();
    }
    if (req.body.checked !== undefined) {
      updates.checked = Boolean(req.body.checked);
    }
    if (req.body.selectedStore !== undefined) {
      const validStores = ['Tesco', "Sainsbury's", 'Asda', 'Morrisons', 'Aldi', 'Lidl', 'Ocado', 'Waitrose', 'Marks & Spencer', 'Amazon Fresh'];
      const storeVal = req.body.selectedStore === null ? null : String(req.body.selectedStore).trim();
      if (storeVal !== null && !validStores.includes(storeVal)) {
        return res.status(400).json({ message: 'Invalid store selection' });
      }
      updates.selectedStore = storeVal;
    }
    if (req.body.matchedProductId !== undefined) {
      updates.matchedProductId = req.body.matchedProductId === null ? null : String(req.body.matchedProductId);
    }
    if (req.body.matchedStore !== undefined) {
      updates.matchedStore = req.body.matchedStore === null ? null : String(req.body.matchedStore).trim();
    }
    if (req.body.matchedPrice !== undefined) {
      updates.matchedPrice = req.body.matchedPrice === null ? null : Number(req.body.matchedPrice);
    }
    if (req.body.availableStores !== undefined) {
      updates.availableStores = req.body.availableStores === null ? null : String(req.body.availableStores);
    }
    if (req.body.thaRating !== undefined) {
      updates.thaRating = req.body.thaRating === null ? null : Number(req.body.thaRating);
    }
    if (req.body.itemType !== undefined) {
      updates.itemType = req.body.itemType === null ? null : String(req.body.itemType).trim();
    }
    if (req.body.variantSelections !== undefined) {
      updates.variantSelections = req.body.variantSelections === null ? null : String(req.body.variantSelections);
    }
    if (req.body.attributePreferences !== undefined) {
      updates.attributePreferences = req.body.attributePreferences === null ? null : String(req.body.attributePreferences);
    }
    if (req.body.confidenceLevel !== undefined) {
      updates.confidenceLevel = req.body.confidenceLevel === null ? null : String(req.body.confidenceLevel).trim();
    }
    if (req.body.confidenceReason !== undefined) {
      updates.confidenceReason = req.body.confidenceReason === null ? null : String(req.body.confidenceReason).trim();
    }
    if (req.body.shopStatus !== undefined) {
      const validStatuses = ['pending', 'already_got', 'need_to_buy', 'in_basket', 'alternate_selected', 'deferred'];
      const val = req.body.shopStatus === null ? null : String(req.body.shopStatus);
      if (val !== null && !validStatuses.includes(val)) {
        return res.status(400).json({ message: 'Invalid shop status' });
      }
      updates.shopStatus = val;
    }
    if (updates.quantityValue !== undefined && updates.unit !== undefined) {
      const grams = convertToGrams(updates.quantityValue, updates.unit);
      if (grams !== null) updates.quantityInGrams = grams;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const item = await storage.updateShoppingListItem(id, updates);
    res.json(item);
  });

  // Correct a basket item: update name/qty/unit/category and optionally
  // rewrite the matching ingredient in every source recipe.
  app.post('/api/shopping-list/:id/correct', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = Number(req.params.id);
      const allItems = await storage.getShoppingListItems(req.user!.id);
      const item = allItems.find(i => i.id === id);
      if (!item) return res.status(404).json({ message: 'Item not found' });

      const { productName, quantityValue, unit, category, updateRecipe } = req.body;

      // Build basket update — clear cached price matches when name changes
      const updates: Record<string, any> = { thaRating: null };
      if (productName !== undefined) {
        updates.productName = String(productName).trim();
        const { normalizeName } = await import('./lib/ingredient-utils');
        updates.normalizedName = normalizeName(updates.productName);
        updates.matchedProductId = null;
        updates.matchedStore = null;
        updates.matchedPrice = null;
        updates.availableStores = null;
        updates.imageUrl = null;
      }
      if (quantityValue !== undefined) {
        const qv = Number(quantityValue);
        if (!isNaN(qv) && qv >= 0) updates.quantityValue = qv;
      }
      if (unit !== undefined) updates.unit = String(unit).trim() || null;
      if (category !== undefined) updates.category = String(category).trim() || null;

      await storage.updateShoppingListItem(id, updates);

      let recipesUpdated = 0;

      if (updateRecipe) {
        const { parseIngredient, normalizeName } = await import('./lib/ingredient-utils');
        const currentNorm = normalizeName(item.normalizedName || item.productName || '').toLowerCase();
        const currentWords = new Set(currentNorm.split(/\s+/).filter(Boolean));

        const sources = await storage.getIngredientSources(id);
        for (const source of sources) {
          const meal = await storage.getMeal(source.mealId);
          // Safety: only update the authenticated user's own meals
          if (!meal || meal.userId !== req.user!.id) continue;

          // Find best-matching ingredient by normalized word overlap
          let bestIdx = -1;
          let bestScore = 0;
          meal.ingredients.forEach((ing, idx) => {
            const parsed = parseIngredient(ing);
            const parsedNorm = normalizeName(parsed.name || '').toLowerCase();
            const parsedWords = parsedNorm.split(/\s+/).filter(Boolean);
            const overlap = parsedWords.filter(w => currentWords.has(w)).length;
            const score = overlap / Math.max(currentWords.size, parsedWords.length, 1);
            if (score > bestScore) { bestScore = score; bestIdx = idx; }
          });

          if (bestIdx >= 0 && bestScore > 0.2) {
            const correctedName = (updates.productName ?? item.productName ?? '').trim();
            const correctedQty = updates.quantityValue ?? item.quantityValue;
            const correctedUnit = updates.unit !== undefined ? updates.unit : (item.unit ?? '');
            const unitStr = correctedUnit && correctedUnit !== 'unit' ? ` ${correctedUnit}` : '';
            const newIngText = correctedQty && Number(correctedQty) > 0
              ? `${correctedQty}${unitStr} ${correctedName}`
              : correctedName;

            const newIngredients = [...meal.ingredients];
            newIngredients[bestIdx] = newIngText;
            await storage.updateMeal(meal.id, { ingredients: newIngredients });
            recipesUpdated++;
          }
        }
      }

      res.json({ updated: true, recipesUpdated });
    } catch (err) {
      console.error('[correct-item] Error:', err);
      res.status(500).json({ message: 'Failed to save correction' });
    }
  });

  app.delete(api.shoppingList.remove.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const items = await storage.getShoppingListItems(req.user!.id);
    if (!items.find(i => i.id === Number(req.params.id))) {
      return res.status(404).json({ message: 'Item not found' });
    }
    await storage.removeShoppingListItem(Number(req.params.id));
    res.sendStatus(204);
  });

  app.post(api.shoppingList.autoSmp.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // force=true re-scores ALL items, not just those missing a rating
      const force = req.body?.force === true;
      const items = await storage.getShoppingListItems(req.user!.id);
      const needsSmp = force
        ? items
        : items.filter(i => i.thaRating === null || i.thaRating === undefined);
      console.log(`[auto-score] ${items.length} total items, ${needsSmp.length} to score (force=${force})`);
      if (needsSmp.length === 0) return res.json({ updated: [] });

      const allAdditives = await storage.getAllAdditives();
      const OFF_FIELDS = 'code,product_name,brands,ingredients_text,ingredients_text_en,nutriments,nova_group';
      const OFF_HEADERS = { timeout: 10000, headers: { 'User-Agent': 'SmartMealPlanner/1.0 (contact: smartmealplanner@replit.app)' } };
      const updated: { id: number; thaRating: number }[] = [];
      const skipped: string[] = [];

      // Matches items that might be in a packaged/processed form — these need
      // actual ingredient validation before we short-circuit to 5 apples.
      const PACKAGED_INDICATOR_RX = /\b(tinned|canned|jarred|bottled|in\s+brine|in\s+water|in\s+oil)\b/i;

      const batchSize = 3;
      for (let i = 0; i < needsSmp.length; i += batchSize) {
        const batch = needsSmp.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item) => {
          try {
            const searchName = (item as any).ingredientName || (item as any).name || item.normalizedName || item.productName;
            const cleanName = searchName.replace(/^\d+[\.\d]*\s*(g|kg|ml|l|oz|lb)\s+/i, '').trim();

            // Whole-food short-circuit: for clearly raw/fresh items we can skip
            // the OpenFoodFacts lookup entirely — no ambiguity about additives.
            // Tinned/canned items still go through OFF so their ingredient list
            // can be validated before granting the override.
            if (isWholeFoodIngredient(cleanName) && !PACKAGED_INDICATOR_RX.test(cleanName)) {
              await storage.updateShoppingListItem(item.id, { thaRating: 5 });
              updated.push({ id: item.id, thaRating: 5 });
              console.log(`[auto-score] Whole-food short-circuit for "${cleanName}" → 5 apples`);
              return;
            }

            const url = `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(cleanName)}&json=1&page_size=5&fields=${OFF_FIELDS}&tagtype_0=countries&tag_contains_0=contains&tag_0=united-kingdom`;
            const response = await axios.get(url, OFF_HEADERS);
            const products = response.data?.products || [];
            if (products.length === 0) {
              skipped.push(`${cleanName}: no OFF results`);
              return;
            }

            const bestProduct = products.find((p: any) => p.ingredients_text || p.ingredients_text_en) || products[0];
            const ingredientsText = bestProduct.ingredients_text || bestProduct.ingredients_text_en || '';
            if (!ingredientsText) {
              skipped.push(`${cleanName}: no ingredients text`);
              return;
            }

            const analysis = analyzeProduct(ingredientsText, bestProduct.nutriments || null, bestProduct.nova_group || null);
            const upfResult = analyzeProductUPF(ingredientsText, allAdditives, analysis.healthScore, {
              productName: bestProduct.product_name || '',
              categoriesTags: bestProduct.categories_tags || [],
              novaGroup: bestProduct.nova_group || null,
            }, analysis.ingredients);
            if (upfResult && upfResult.thaRating > 0) {
              await storage.updateShoppingListItem(item.id, { thaRating: upfResult.thaRating });
              updated.push({ id: item.id, thaRating: upfResult.thaRating });
            } else {
              skipped.push(`${cleanName}: thaRating=0`);
            }
          } catch (err: any) {
            skipped.push(`${item.productName}: error ${err.message || err}`);
          }
        }));
      }

      console.log(`[auto-score] Updated ${updated.length} items, skipped ${skipped.length}: ${skipped.slice(0, 5).join('; ')}`);
      res.json({ updated });
    } catch (err) {
      console.error('[auto-score] Error:', err);
      res.status(500).json({ message: 'Failed to calculate THA ratings' });
    }
  });

  app.delete(api.shoppingList.clear.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.clearShoppingList(req.user!.id);
    res.sendStatus(204);
  });


  app.post(api.shoppingList.generateFromMeals.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      type MealSelection = { mealId: number; count: number; eaterIds?: number[]; guestEaters?: { id: string; displayName: string; dietTypes: string[]; hardRestrictions: string[] }[] };
      let mealSelections: MealSelection[];

      if (req.body.mealIds) {
        mealSelections = (req.body.mealIds as number[]).map(id => ({ mealId: id, count: 1 }));
      } else {
        const parsed = api.shoppingList.generateFromMeals.input.parse(req.body);
        mealSelections = parsed.mealSelections;
      }

      const freezerMeals = await storage.getFreezerMeals(req.user!.id);
      const frozenPortionsByMeal = new Map<number, number>();
      for (const fm of freezerMeals) {
        const existing = frozenPortionsByMeal.get(fm.mealId) || 0;
        frozenPortionsByMeal.set(fm.mealId, existing + fm.remainingPortions);
      }

      // Build a per-mealId context map for later use when creating ingredient sources
      const mealContextMap = new Map<number, { eaterIds?: number[]; guestEaters?: MealSelection["guestEaters"] }>();
      for (const sel of mealSelections) {
        if (sel.eaterIds || sel.guestEaters) {
          mealContextMap.set(sel.mealId, { eaterIds: sel.eaterIds, guestEaters: sel.guestEaters });
        }
      }

      const allIngredients: string[] = [];
      const mealMap: { meal: { id: number; name: string }; count: number; ingredients: string[] }[] = [];

      const readyMealItems: { mealId: number; name: string; count: number }[] = [];

      for (const sel of mealSelections) {
        const meal = await storage.getMeal(sel.mealId);
        if (meal && (meal.userId === req.user!.id || meal.isSystemMeal)) {
          let count = sel.count;
          const frozenPortions = frozenPortionsByMeal.get(meal.id) || 0;
          if (frozenPortions > 0) {
            count = Math.max(0, count - frozenPortions);
          }
          if (count === 0) continue;
          if (meal.isReadyMeal) {
            readyMealItems.push({ mealId: meal.id, name: meal.name, count });
          } else if (meal.mealFormat === "grouped") {
            // Decode component meals and aggregate their ingredients
            let componentIngredients: string[] = [];
            try {
              const raw = (meal.instructions || [])[0];
              if (raw) {
                const gs = JSON.parse(raw) as { __v?: number; sources?: Record<string, { type: string; mealId?: number }> };
                if (gs.sources) {
                  for (const [label, src] of Object.entries(gs.sources)) {
                    if ((src.type === "web" || src.type === "my-meal") && src.mealId) {
                      const compMeal = await storage.getMeal(src.mealId);
                      if (compMeal && compMeal.ingredients && compMeal.ingredients.length > 0) {
                        componentIngredients.push(...compMeal.ingredients);
                      }
                    } else if (src.type === "fresh" || src.type === "frozen" || src.type === "basic") {
                      componentIngredients.push(label);
                    }
                  }
                }
              }
            } catch { /* fall back to meal.ingredients */ }
            const effectiveIngredients = componentIngredients.length > 0 ? componentIngredients : meal.ingredients;
            const multipliedIngredients: string[] = [];
            for (let i = 0; i < count; i++) {
              multipliedIngredients.push(...effectiveIngredients);
            }
            allIngredients.push(...multipliedIngredients);
            mealMap.push({ meal: { id: meal.id, name: meal.name }, count, ingredients: effectiveIngredients });
          } else {
            const multipliedIngredients: string[] = [];
            for (let i = 0; i < count; i++) {
              multipliedIngredients.push(...meal.ingredients);
            }
            allIngredients.push(...multipliedIngredients);
            mealMap.push({ meal: { id: meal.id, name: meal.name }, count, ingredients: meal.ingredients });
          }
        }
      }

      const items = [];

      for (const rm of readyMealItems) {
        const item = await storage.addOrConsolidateShoppingListItem(req.user!.id, {
          productName: rm.name,
          normalizedName: rm.name.toLowerCase().trim(),
          quantityValue: rm.count,
          unit: 'pack',
          quantityInGrams: null,
          quantity: rm.count,
          category: 'ready meals',
          ingredientId: null,
          needsReview: false,
          validationNote: null,
        });
        items.push(item);
        const rmCtx = mealContextMap.get(rm.mealId);
        await storage.addIngredientSource({
          shoppingListItemId: item.id,
          mealId: rm.mealId,
          mealName: rm.name,
          quantityMultiplier: rm.count,
          eaterIds: rmCtx?.eaterIds ?? null,
          guestEaters: (rmCtx?.guestEaters ?? null) as any,
        });
      }

      const WHOLE_FOOD_CATS_SERVER2 = new Set(['produce', 'fruit', 'eggs']);
      const { resolveItem: resolveItem2 } = await import('./lib/item-resolver');
      const consolidated = consolidateAndNormalize(allIngredients);
      for (const c of consolidated) {
        const resolved = resolveItem2(c.displayName, { callerCategory: c.category || null });
        const ingredient = await storage.getOrCreateNormalizedIngredient(
          resolved.productName, resolved.normalizedName, resolved.category
        );
        const item = await storage.addOrConsolidateShoppingListItem(req.user!.id, {
          productName: resolved.productName,
          normalizedName: resolved.normalizedName,
          quantityValue: c.quantity,
          unit: c.unit,
          quantityInGrams: c.quantityInGrams,
          quantity: 1,
          category: resolved.category,
          ingredientId: ingredient.id,
          needsReview: resolved.needsReview,
          validationNote: resolved.validationNote,
          originalText: resolved.originalText,
          canonicalName: resolved.canonicalName,
          subcategory: resolved.subcategory,
          resolutionState: resolved.resolutionState,
          reviewReason: resolved.reviewReason,
          reviewSuggestions: resolved.reviewSuggestions,
        } as any);
        const inferredItemType2 = WHOLE_FOOD_CATS_SERVER2.has((resolved.category || '').toLowerCase()) ? 'whole_food' : 'packaged';
        if (!item.itemType) {
          await storage.updateShoppingListItem(item.id, { itemType: inferredItemType2 });
          item.itemType = inferredItemType2;
        }
        items.push(item);

        for (const mealInfo of mealMap) {
          if (ingredientMatchesMeal(c.normalizedName, mealInfo.ingredients)) {
            const mealCtx = mealContextMap.get(mealInfo.meal.id);
            await storage.addIngredientSource({
              shoppingListItemId: item.id,
              mealId: mealInfo.meal.id,
              mealName: mealInfo.meal.name,
              quantityMultiplier: mealInfo.count,
              eaterIds: mealCtx?.eaterIds ?? null,
              guestEaters: (mealCtx?.guestEaters ?? null) as any,
            });
          }
        }
      }

      res.status(201).json(items);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("[ShoppingList] from-meals error:", err);
      res.status(500).json({ message: "Failed to generate shopping list from meals" });
    }
  });

  app.post(api.shoppingList.lookupPrices.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // Optional store filter: when provided, only match/clear that one store.
      // This is used by ShoppingListView for fast single-store matching.
      const { store } = req.body as { store?: string };

      const items = await storage.getShoppingListItems(req.user!.id);
      if (items.length === 0) {
        return res.json({ matches: [] });
      }

      // Scope the clear to just the requested store so existing data for other
      // stores is preserved when the user is only shopping one store.
      if (store) {
        await storage.clearProductMatchesForStore(req.user!.id, store);
      } else {
        await storage.clearAllProductMatchesForUser(req.user!.id);
      }

      const allStores = ['Tesco', "Sainsbury's", 'Asda', 'Morrisons', 'Aldi', 'Lidl', 'Waitrose', 'Ocado', 'Marks & Spencer'];
      const allMatches = [];
      for (const item of items) {
        if (isGarbageIngredient(item.productName)) continue;

        // HARD FAIL-SAFE: never look up prices for unrecognised items.
        // Use only the stored category — do NOT run keyword detection on the
        // product name here.  The product name may have been assigned by AI
        // from a nonsense input (e.g. "Boorboans"→"Bourbon Biscuits"), and
        // keyword-matching it would silently grant it a real category and
        // trigger fake prices.  Items that reached the DB as 'uncategorised'
        // or 'other' (or with no category) stay unmatched.
        // Also skip any item explicitly marked for review.
        const effectiveCategory = item.category;
        if (!effectiveCategory || effectiveCategory === 'other' || effectiveCategory === 'uncategorised') continue;
        if (item.needsReview === true) continue;

        if (item.matchedProductId && item.matchedPrice) {
          const getSearchUrl = (storeName: string) => {
            const q = encodeURIComponent(item.productName);
            const urls: Record<string, string> = {
              'Tesco': `https://www.tesco.com/groceries/en-GB/search?query=${q}`,
              "Sainsbury's": `https://www.sainsburys.co.uk/gol-ui/SearchResults/${q}`,
              'Asda': `https://groceries.asda.com/search/${q}`,
              'Morrisons': `https://groceries.morrisons.com/search?entry=${q}`,
              'Aldi': `https://groceries.aldi.co.uk/en-GB/Search?keywords=${q}`,
              'Lidl': `https://www.lidl.co.uk/q/search?q=${q}`,
              'Waitrose': `https://www.waitrose.com/ecom/shop/search?searchTerm=${q}`,
              'Ocado': `https://www.ocado.com/search?entry=${q}`,
              'Marks & Spencer': `https://www.ocado.com/search?entry=${q}&dnr=y&bof=marksandspencer`,
            };
            return urls[storeName] || null;
          };
          let knownStores: string[] = [];
          try {
            knownStores = item.availableStores ? JSON.parse(item.availableStores) : [];
          } catch { knownStores = []; }
          const storesToShow = knownStores.length > 0 ? knownStores.filter(s => allStores.includes(s)) : allStores;
          let finalStores = storesToShow.length > 0 ? storesToShow : allStores;
          // Scope to the requested store if one was specified
          if (store) finalStores = finalStores.filter(s => s === store);
          for (const storeName of finalStores) {
            const match = await storage.addProductMatch({
              shoppingListItemId: item.id,
              supermarket: storeName,
              productName: item.productName,
              price: item.matchedPrice,
              pricePerUnit: null,
              productUrl: getSearchUrl(storeName),
              imageUrl: item.imageUrl || null,
              currency: 'GBP',
              tier: 'standard',
              productWeight: null,
              thaRating: item.thaRating || null,
            });
            allMatches.push(match);
          }
          continue;
        }

        const prices = await lookupPricesForIngredient(
          item.productName,
          effectiveCategory,
          item.quantityValue || 1,
          item.unit || 'unit',
          store ? [store] : undefined
        );

        for (const p of prices) {
          const match = await storage.addProductMatch({
            shoppingListItemId: item.id,
            supermarket: p.supermarket,
            productName: p.productName,
            price: p.price,
            pricePerUnit: p.pricePerUnit,
            productUrl: p.productUrl,
            imageUrl: p.imageUrl,
            currency: p.currency,
            tier: p.tier || 'standard',
            productWeight: p.productWeight || null,
          });
          allMatches.push(match);
        }

        // ── Promote to matched_to_product ──────────────────────────────────
        // Only promote when ALL four conditions are true:
        // 1. Item is already confidently resolved (not raw / needs_review)
        // 2. Category is valid and not unresolved (already checked above)
        // 3. At least one match from a genuine lookup has a real price
        // 4. Price came from lookupPricesForIngredient, not legacy fallback data
        const genuinePriceMatches = prices.filter(p => p.price !== null && p.price !== undefined);
        if (
          genuinePriceMatches.length > 0 &&
          (item as any).resolutionState === 'resolved'
        ) {
          await storage.updateShoppingListItem(item.id, { resolutionState: 'matched_to_product' });
        }
      }

      res.json({ matches: allMatches });
    } catch (err) {
      console.error('Price lookup error:', err);
      res.status(500).json({ message: 'Failed to lookup prices' });
    }
  });

  app.get(api.shoppingList.prices.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const matches = await storage.getProductMatchesForUser(req.user!.id);
      res.json(matches);
    } catch (err) {
      console.error('Get prices error:', err);
      res.status(500).json({ message: 'Failed to get prices' });
    }
  });

  app.get(api.shoppingList.totalCost.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const allMatches = await storage.getProductMatchesForUser(req.user!.id);
      const items = await storage.getShoppingListItems(req.user!.id);
      const user = await storage.getUser(req.user!.id);
      const preferredTier = (req.query.tier as string) || user?.preferredPriceTier || 'standard';

      const getItemTier = (item: typeof items[0]) => item.selectedTier || preferredTier;

      const customMatches = allMatches.filter(m => {
        const item = items.find(i => i.id === m.shoppingListItemId);
        if (!item) return false;
        return m.tier === getItemTier(item);
      });

      const byItem = new Map<number, { cheapest: number; supermarket: string }>();
      for (const match of customMatches) {
        if (match.price === null) continue;
        const existing = byItem.get(match.shoppingListItemId);
        if (!existing || match.price < existing.cheapest) {
          byItem.set(match.shoppingListItemId, { cheapest: match.price, supermarket: match.supermarket });
        }
      }

      let totalCheapest = 0;
      const breakdown: { itemId: number; name: string; cheapestPrice: number; supermarket: string }[] = [];
      for (const item of items) {
        const cheapest = byItem.get(item.id);
        if (cheapest) {
          const itemTotal = cheapest.cheapest * item.quantity;
          totalCheapest += itemTotal;
          breakdown.push({
            itemId: item.id,
            name: item.productName,
            cheapestPrice: itemTotal,
            supermarket: cheapest.supermarket,
          });
        }
      }

      const bySupermarket: Record<string, Map<number, number>> = {};
      for (const match of customMatches) {
        if (match.price === null) continue;
        const item = items.find(i => i.id === match.shoppingListItemId);
        const qty = item?.quantity || 1;
        const itemCost = match.price * qty;
        if (!bySupermarket[match.supermarket]) {
          bySupermarket[match.supermarket] = new Map();
        }
        const existing = bySupermarket[match.supermarket].get(match.shoppingListItemId);
        if (existing === undefined || itemCost < existing) {
          bySupermarket[match.supermarket].set(match.shoppingListItemId, itemCost);
        }
      }

      const supermarketTotals = Object.entries(bySupermarket).map(([name, itemMap]) => {
        let total = 0;
        itemMap.forEach(val => { total += val; });
        return { supermarket: name, total: Math.round(total * 100) / 100 };
      }).sort((a, b) => a.total - b.total);

      let customTotal = 0;
      for (const item of items) {
        const itemTier = getItemTier(item);
        const itemMatches = allMatches.filter(m => m.shoppingListItemId === item.id && m.tier === itemTier);
        if (item.selectedStore) {
          const storeMatch = itemMatches.find(m => m.supermarket === item.selectedStore);
          if (storeMatch?.price !== null && storeMatch?.price !== undefined) {
            customTotal += storeMatch.price * item.quantity;
            continue;
          }
        }
        let cheapestPrice = Infinity;
        for (const m of itemMatches) {
          if (m.price !== null && m.price < cheapestPrice) cheapestPrice = m.price;
        }
        if (cheapestPrice < Infinity) customTotal += cheapestPrice * item.quantity;
      }

      const tierTotals: Record<string, number> = {};
      for (const tier of ['budget', 'standard', 'premium', 'organic']) {
        const tierMatches = allMatches.filter(m => m.tier === tier);
        const tierByItem = new Map<number, number>();
        for (const match of tierMatches) {
          if (match.price === null) continue;
          const item = items.find(i => i.id === match.shoppingListItemId);
          const qty = item?.quantity || 1;
          const val = match.price * qty;
          const existing = tierByItem.get(match.shoppingListItemId);
          if (existing === undefined || val < existing) {
            tierByItem.set(match.shoppingListItemId, val);
          }
        }
        let cheapestForTier = 0;
        tierByItem.forEach(val => { cheapestForTier += val; });
        tierTotals[tier] = Math.round(cheapestForTier * 100) / 100;
      }

      res.json({
        totalCheapest: Math.round(totalCheapest * 100) / 100,
        customTotal: Math.round(customTotal * 100) / 100,
        supermarketTotals,
        breakdown,
        currency: 'GBP',
        preferredTier,
        tierTotals: {
          budget: tierTotals['budget'] || 0,
          standard: tierTotals['standard'] || 0,
          premium: tierTotals['premium'] || 0,
          organic: tierTotals['organic'] || 0,
        },
      });
    } catch (err) {
      console.error('Total cost error:', err);
      res.status(500).json({ message: 'Failed to calculate total cost' });
    }
  });

  app.get(api.shoppingList.sources.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const sources = await storage.getIngredientSourcesForUser(req.user!.id);
      res.json(sources);
    } catch (err) {
      console.error('Get sources error:', err);
      res.status(500).json({ message: 'Failed to get ingredient sources' });
    }
  });

  app.get(api.shoppingList.itemMatches.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const itemId = Number(req.params.id);
      const item = await storage.getShoppingListItems(req.user!.id);
      if (!item.find(i => i.id === itemId)) {
        return res.status(404).json({ message: 'Item not found' });
      }
      const matches = await storage.getProductMatches(itemId);
      res.json(matches);
    } catch (err) {
      console.error('Get item matches error:', err);
      res.status(500).json({ message: 'Failed to get item matches' });
    }
  });

  app.patch(api.priceTier.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { tier } = api.priceTier.update.input.parse(req.body);
      const user = await storage.updateUserPriceTier(req.user!.id, tier);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ preferredPriceTier: user.preferredPriceTier });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });


  app.post('/api/meal-plans/smart-suggest', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const body = req.body || {};
      let parsedLocked: LockedEntry[] | undefined;
      if (Array.isArray(body.lockedEntries)) {
        parsedLocked = body.lockedEntries.map((le: any) => ({
          dayOfWeek: Number(le.dayOfWeek),
          slot: String(le.slot),
          candidateId: le.candidateId,
          candidateName: String(le.candidateName || ''),
        }));
      }

      const settings: SmartSuggestSettings = {
        mealsPerDay: body.mealsPerDay ? Number(body.mealsPerDay) : 3,
        includeLeftovers: body.includeLeftovers === true,
        maxWeeklyBudget: body.maxWeeklyBudget ? Number(body.maxWeeklyBudget) : undefined,
        maxWeeklyUPF: body.maxWeeklyUPF ? Number(body.maxWeeklyUPF) : undefined,
        preferredCuisine: body.preferredCuisine || undefined,
        fishPerWeek: body.fishPerWeek !== undefined ? Number(body.fishPerWeek) : undefined,
        redMeatPerWeek: body.redMeatPerWeek !== undefined ? Number(body.redMeatPerWeek) : undefined,
        vegetarianDays: body.vegetarianDays === true,
        dietId: body.dietId ? Number(body.dietId) : undefined,
        calorieTarget: body.calorieTarget ? Number(body.calorieTarget) : undefined,
        peopleCount: body.peopleCount ? Number(body.peopleCount) : 1,
        lockedEntries: parsedLocked,
      };

      let userMeals = await storage.getMeals(req.user!.id);

      if (settings.dietId) {
        const filtered = [];
        for (const meal of userMeals) {
          const mealDietEntries = await storage.getMealDiets(meal.id);
          if (mealDietEntries.some(md => md.dietId === settings.dietId)) {
            filtered.push(meal);
          }
        }
        if (filtered.length > 0) userMeals = filtered;
      }

      const prefs = await storage.getUserPreferences(req.user!.id);

      const mealNutrition = new Map<number, { calories?: string | null }>();
      for (const meal of userMeals) {
        const n = await storage.getNutrition(meal.id);
        if (n) mealNutrition.set(meal.id, { calories: n.calories });
      }

      const allCategories = await storage.getAllCategories();
      const categoryMap = new Map(allCategories.map(c => [c.id, c.name.toLowerCase()]));

      const result = await generateSmartSuggestion(
        userMeals,
        prefs || null,
        settings,
        mealNutrition,
        categoryMap,
      );

      res.json(result);
    } catch (err) {
      console.error('Smart suggest error:', err);
      res.status(500).json({ message: 'Failed to generate smart meal plan suggestion' });
    }
  });

  app.post('/api/smart-suggest/auto-import', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const candidateSchema = z.object({
        candidate: z.object({
          id: z.union([z.string(), z.number()]).optional(),
          name: z.string().min(1),
          image: z.string().nullable().optional(),
          imageUrl: z.string().nullable().optional(),
          ingredients: z.array(z.string()).optional(),
          instructions: z.array(z.string()).optional(),
          dietTypes: z.array(z.string()).optional(),
          estimatedCost: z.number().nullable().optional(),
          estimatedUPFScore: z.number().nullable().optional(),
          source: z.string().optional(),
          sourceUrl: z.string().nullable().optional(),
          category: z.string().nullable().optional(),
          cuisine: z.string().nullable().optional(),
          primaryProtein: z.string().nullable().optional(),
        }),
      });
      const { candidate } = candidateSchema.parse(req.body);
      const { autoImportExternalMeal } = await import("./lib/auto-import-service");

      const externalCandidate = {
        externalId: candidate.id?.toString() || "",
        name: candidate.name,
        image: candidate.imageUrl || candidate.image || null,
        ingredients: candidate.ingredients || [],
        instructions: candidate.instructions || [],
        dietTypes: candidate.dietTypes || [],
        estimatedCost: candidate.estimatedCost || null,
        estimatedUPFScore: candidate.estimatedUPFScore || null,
        source: candidate.source || "Unknown",
        sourceUrl: candidate.sourceUrl || null,
        category: candidate.category || null,
        cuisine: candidate.cuisine || null,
        primaryProtein: candidate.primaryProtein || null,
      };

      const result = await autoImportExternalMeal(externalCandidate, req.user!.id);
      if (!result) {
        return res.status(500).json({ message: "Failed to auto-import meal" });
      }
      res.json(result);
    } catch (err) {
      console.error("Auto-import error:", err);
      res.status(500).json({ message: "Failed to auto-import meal" });
    }
  });

  app.get('/api/user-basket', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const items = await storage.getBasketItems(req.user!.id);
      res.json(items);
    } catch (err) {
      console.error('Get basket error:', err);
      res.status(500).json({ message: 'Failed to get basket' });
    }
  });

  app.post('/api/user-basket', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { mealId, quantity } = req.body;
      const item = await storage.addBasketItem(req.user!.id, Number(mealId), Number(quantity) || 1);
      res.json(item);
    } catch (err) {
      console.error('Add basket item error:', err);
      res.status(500).json({ message: 'Failed to add to basket' });
    }
  });

  app.patch('/api/user-basket/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { quantity } = req.body;
      const result = await storage.updateBasketItemQuantity(Number(req.params.id), Number(quantity));
      res.json(result || { removed: true });
    } catch (err) {
      console.error('Update basket error:', err);
      res.status(500).json({ message: 'Failed to update basket item' });
    }
  });

  app.delete('/api/user-basket/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.removeBasketItem(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error('Remove basket item error:', err);
      res.status(500).json({ message: 'Failed to remove basket item' });
    }
  });

  app.delete('/api/user-basket', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.clearBasket(req.user!.id);
      res.json({ success: true });
    } catch (err) {
      console.error('Clear basket error:', err);
      res.status(500).json({ message: 'Failed to clear basket' });
    }
  });

  app.get("/api/additives", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const allAdditives = await storage.getAllAdditives();
      res.json(allAdditives);
    } catch (err) {
      console.error("Error fetching additives:", err);
      res.status(500).json({ message: "Failed to fetch additives" });
    }
  });

  app.get("/api/meals/lookup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    if (!query) return res.json([]);
    try {
      const results = await storage.lookupMeals(query);
      res.json(results);
    } catch (err) {
      console.error("Meal lookup error:", err);
      res.status(500).json({ message: "Failed to look up meals" });
    }
  });

  app.get("/api/meals/recommended", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const [meals, prefs] = await Promise.all([
        storage.getMeals(req.user!.id),
        storage.getUserPreferences(req.user!.id),
      ]);
      if (!prefs) {
        res.json(meals.map(m => ({ meal: m, result: { compatible: true, score: 100, warnings: [], dietMatch: true, goalMatch: true } })));
        return;
      }
      const ranked = rankMealsByPreferences(meals, prefs);
      res.json(ranked);
    } catch (err) {
      console.error("Error getting recommendations:", err);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  app.get("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const prefs = await storage.getUserPreferences(req.user!.id);
    res.json(prefs || null);
  });

  const preferencesSchema = z.object({
    dietTypes: z.array(z.string()).optional().default([]),
    excludedIngredients: z.array(z.string()).optional().default([]),
    healthGoals: z.array(z.string()).optional().default([]),
    budgetLevel: z.string().optional().default("standard"),
    preferredStores: z.array(z.string()).optional().default([]),
    upfSensitivity: z.string().optional().default("moderate"),
    qualityPreference: z.string().optional().default("standard"),
    calorieTarget: z.number().nullable().optional(),
    // Tracking toggles — set during onboarding (all default OFF for new users)
    calorieMode: z.enum(["auto", "manual"]).optional(),
    eliteTrackingEnabled: z.boolean().optional(),
    healthTrendEnabled: z.boolean().optional(),
  });

  app.put("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = preferencesSchema.parse(req.body);
      const prefs = await storage.upsertUserPreferences(req.user!.id, parsed);
      res.json(prefs);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preferences data", errors: err.errors });
      }
      console.error("Error saving preferences:", err);
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });

  app.post("/api/user/complete-onboarding", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        const onboardingSchema = preferencesSchema.extend({
          firstName: z.string().nullable().optional(),
          dietPattern: z.string().nullable().optional(),
          dietRestrictions: z.array(z.string()).optional(),
          eatingSchedule: z.string().nullable().optional(),
        });
        const parsed = onboardingSchema.parse(req.body);
        const { firstName, dietPattern, dietRestrictions, eatingSchedule, ...prefFields } = parsed;

        const goalsForGoalType: string[] = Array.isArray(prefFields.healthGoals) ? prefFields.healthGoals : [];
        const derivedGoalType = goalsForGoalType.includes("lose-weight") ? "lose"
          : (goalsForGoalType.includes("build-muscle") || goalsForGoalType.includes("put-on-weight")) ? "build"
          : goalsForGoalType.includes("improve-health") ? "health"
          : "maintain";

        await storage.upsertUserPreferences(req.user!.id, { ...prefFields, goalType: derivedGoalType });
        if (parsed.budgetLevel) {
          await storage.updateUserPriceTier(req.user!.id, parsed.budgetLevel);
        }

        const profileUpdate: any = {};
        if (firstName !== undefined && firstName !== null && firstName.trim()) profileUpdate.firstName = firstName.trim();
        if (dietPattern !== undefined) profileUpdate.dietPattern = dietPattern ?? null;
        if (dietRestrictions !== undefined) profileUpdate.dietRestrictions = dietRestrictions ?? [];
        if (eatingSchedule !== undefined) profileUpdate.eatingSchedule = eatingSchedule ?? null;
        if (Object.keys(profileUpdate).length > 0) {
          await storage.updateUserProfile(req.user!.id, profileUpdate);
        }
      }
      const user = await storage.completeOnboarding(req.user!.id);

      try {
        const { preloadStarterMeals } = await import("./lib/meal-service");
        const count = await preloadStarterMeals(req.user!.id);
        if (count > 0) {
          console.log(`Preloaded ${count} starter meals for user ${req.user!.id}`);
        }
      } catch (preloadErr) {
        console.error("Error preloading starter meals:", preloadErr);
      }

      res.json(sanitizeUser(user!));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preferences data", errors: err.errors });
      }
      console.error("Error completing onboarding:", err);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.get("/api/starter-meals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { getStarterMeals } = await import("./lib/meal-service");
      const starterMeals = await getStarterMeals(req.user!.id);
      res.json(starterMeals);
    } catch (err) {
      console.error("Error fetching starter meals:", err);
      res.status(500).json({ message: "Failed to fetch starter meals" });
    }
  });

  app.get("/api/meal-templates", async (_req, res) => {
    try {
      const templates = await storage.getMealTemplates();
      res.json(templates);
    } catch (err) {
      console.error("Error fetching meal templates:", err);
      res.status(500).json({ message: "Failed to fetch meal templates" });
    }
  });

  app.get("/api/meal-templates/:id", async (req, res) => {
    try {
      const template = await storage.getMealTemplate(parseInt(req.params.id));
      if (!template) return res.status(404).json({ message: "Template not found" });
      const implementations = await storage.getMealsForTemplate(template.id);
      const products = await storage.getMealTemplateProducts(template.id);
      res.json({ ...template, implementations, products });
    } catch (err) {
      console.error("Error fetching meal template:", err);
      res.status(500).json({ message: "Failed to fetch meal template" });
    }
  });

  app.post("/api/meal-templates", async (req, res) => {
    try {
      const data = insertMealTemplateSchema.parse(req.body);
      const template = await storage.createMealTemplate(data);
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      console.error("Error creating meal template:", err);
      res.status(500).json({ message: "Failed to create meal template" });
    }
  });

  app.patch("/api/meal-templates/:id", async (req, res) => {
    try {
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        category: z.string().optional(),
        description: z.string().nullable().optional(),
      });
      const data = updateSchema.parse(req.body);
      const template = await storage.updateMealTemplate(parseInt(req.params.id), data);
      if (!template) return res.status(404).json({ message: "Template not found" });
      res.json(template);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      console.error("Error updating meal template:", err);
      res.status(500).json({ message: "Failed to update meal template" });
    }
  });

  app.delete("/api/meal-templates/:id", async (req, res) => {
    try {
      await storage.deleteMealTemplate(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      console.error("Error deleting meal template:", err);
      res.status(500).json({ message: "Failed to delete meal template" });
    }
  });

  app.get("/api/meal-templates/:id/products", async (req, res) => {
    try {
      const products = await storage.getMealTemplateProducts(parseInt(req.params.id));
      res.json(products);
    } catch (err) {
      console.error("Error fetching template products:", err);
      res.status(500).json({ message: "Failed to fetch template products" });
    }
  });

  app.post("/api/meal-templates/:id/products", async (req, res) => {
    try {
      const data = insertMealTemplateProductSchema.parse({ ...req.body, mealTemplateId: parseInt(req.params.id) });
      const product = await storage.addMealTemplateProduct(data);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      console.error("Error adding template product:", err);
      res.status(500).json({ message: "Failed to add template product" });
    }
  });

  app.delete("/api/meal-template-products/:id", async (req, res) => {
    try {
      await storage.removeMealTemplateProduct(parseInt(req.params.id));
      res.sendStatus(204);
    } catch (err) {
      console.error("Error removing template product:", err);
      res.status(500).json({ message: "Failed to remove template product" });
    }
  });

  app.post("/api/meal-templates/:id/resolve", async (req, res) => {
    try {
      const resolveSchema = z.object({
        sourceType: z.enum(['scratch', 'ready_meal', 'hybrid']).optional(),
      });
      const body = resolveSchema.parse(req.body);
      const { resolveTemplate } = await import("./meal-resolution-service");
      const userId = req.isAuthenticated() ? req.user!.id : undefined;
      const resolved = await resolveTemplate(parseInt(req.params.id), userId, body.sourceType);
      if (!resolved) return res.status(404).json({ message: "Template not found" });
      res.json(resolved);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      console.error("Error resolving template:", err);
      res.status(500).json({ message: "Failed to resolve template" });
    }
  });

  app.post("/api/meals/:id/link-template", async (req, res) => {
    try {
      const linkSchema = z.object({
        templateId: z.number().int().positive().optional(),
        sourceType: z.enum(['scratch', 'ready_meal', 'hybrid']).optional(),
      });
      const body = linkSchema.parse(req.body);
      const mealId = parseInt(req.params.id);
      const meal = await storage.getMeal(mealId);
      if (!meal) return res.status(404).json({ message: "Meal not found" });

      let templateId = body.templateId;
      if (!templateId) {
        let existing = await storage.getMealTemplateByName(meal.name);
        if (!existing) {
          existing = await storage.createMealTemplate({
            name: meal.name,
            category: 'dinner',
          });
        }
        templateId = existing.id;
      }

      const updated = await storage.updateMealTemplateId(mealId, templateId);
      if (body.sourceType) {
        await storage.updateMealSourceType(mealId, body.sourceType);
      }
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid data", errors: err.errors });
      console.error("Error linking meal to template:", err);
      res.status(500).json({ message: "Failed to link meal to template" });
    }
  });

  // Recipe adaptation
  app.post("/api/meals/:id/adapt", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { applyRecipeSwaps } = await import("./lib/recipe-swap-engine");
      const bodySchema = z.object({
        goal: z.enum(["vegetarian", "keto", "lower-cost", "less-processed", "under-time", "household"]),
        memberExclusions: z.array(z.string()).optional(),
      });
      const body = bodySchema.parse(req.body);
      const mealId = parseInt(req.params.id);
      const meal = await storage.getMeal(mealId);
      if (!meal) return res.status(404).json({ message: "Meal not found" });
      const result = await applyRecipeSwaps(
        { name: meal.name, ingredients: meal.ingredients },
        body.goal,
        { memberExclusions: body.memberExclusions }
      );
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Invalid goal", errors: err.errors });
      console.error("Error adapting recipe:", err);
      res.status(500).json({ message: "Failed to adapt recipe" });
    }
  });

  // Planner routes (6-week planner)
  app.get("/api/planner/weeks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      let weeks = await storage.getPlannerWeeks(req.user!.id);
      if (weeks.length === 0) {
        weeks = await storage.createPlannerWeeks(req.user!.id);
      }
      res.json(weeks);
    } catch (err) {
      console.error("Error fetching planner weeks:", err);
      res.status(500).json({ message: "Failed to fetch planner weeks" });
    }
  });

  app.get("/api/planner/weeks/:weekId/days", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const week = await storage.getPlannerWeek(Number(req.params.weekId));
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) {
        return res.status(404).json({ message: "Week not found" });
      }
      const days = await storage.getPlannerDays(week.id);
      res.json(days);
    } catch (err) {
      console.error("Error fetching planner days:", err);
      res.status(500).json({ message: "Failed to fetch planner days" });
    }
  });

  app.patch("/api/planner/weeks/:weekId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const week = await storage.getPlannerWeek(Number(req.params.weekId));
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) {
        return res.status(404).json({ message: "Week not found" });
      }
      const { updatePlannerWeekSchema } = await import("@shared/schema");
      const parsed = updatePlannerWeekSchema.parse(req.body);
      const updated = await storage.renamePlannerWeek(week.id, parsed.weekName.trim());
      res.json(updated);
    } catch (err: any) {
      if (err?.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error renaming planner week:", err);
      res.status(500).json({ message: "Failed to rename week" });
    }
  });

  app.put("/api/planner/days/:dayId/entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // TODO [PREMIUM]: hasPremiumAccess(user) — enforce >2 days/week for free users
    try {
      const day = await storage.getPlannerDay(Number(req.params.dayId));
      if (!day) {
        return res.status(404).json({ message: "Day not found" });
      }
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) {
        return res.status(404).json({ message: "Day not found" });
      }
      const { upsertPlannerEntrySchema } = await import("@shared/schema");
      const parsed = upsertPlannerEntrySchema.parse({ ...req.body, dayId: day.id });

      if (parsed.mealId !== null) {
        const meal = await storage.getMeal(parsed.mealId);
        if (!meal || (!meal.isSystemMeal && meal.userId !== req.user!.id)) {
          return res.status(400).json({ message: "Invalid meal ID" });
        }
      }

      const result = await storage.upsertPlannerEntry(
        day.id,
        parsed.mealType,
        parsed.audience,
        parsed.mealId,
        parsed.calories,
        parsed.isDrink,
        parsed.drinkType ?? null,
      );
      res.json(result);
    } catch (err: any) {
      if (err?.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error updating planner entry:", err);
      res.status(500).json({ message: "Failed to update planner entry" });
    }
  });

  app.get("/api/planner/days/:dayId/entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const day = await storage.getPlannerDay(Number(req.params.dayId));
      if (!day) {
        return res.status(404).json({ message: "Day not found" });
      }
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) {
        return res.status(404).json({ message: "Day not found" });
      }
      const entries = await storage.getPlannerEntriesForDay(day.id);
      res.json(entries);
    } catch (err) {
      console.error("Error fetching planner entries:", err);
      res.status(500).json({ message: "Failed to fetch planner entries" });
    }
  });

  app.post("/api/planner/days/:dayId/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const day = await storage.getPlannerDay(Number(req.params.dayId));
      if (!day) return res.status(404).json({ message: "Day not found" });
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Day not found" });

      const guestEaterSchema = z.object({
        id: z.string().min(1),
        displayName: z.string().min(1),
        dietTypes: z.array(z.string()).default([]),
        hardRestrictions: z.array(z.string()).default([]),
      });
      const bodySchema = z.object({
        mealSlot: z.enum(["breakfast", "lunch", "dinner", "snacks"]),
        mealId: z.number().int(),
        position: z.number().int().min(0).optional(),
        audience: z.string().optional().default("adult"),
        calories: z.number().int().optional(),
        isDrink: z.boolean().optional().default(false),
        drinkType: z.string().nullable().optional(),
        // Phase 6: optional context captured at add-to-planner time
        eaterIds: z.array(z.number().int()).optional(),
        guestEaters: z.array(guestEaterSchema).optional(),
      });
      const parsed = bodySchema.parse(req.body);

      const meal = await storage.getMeal(parsed.mealId);
      if (!meal || (!meal.isSystemMeal && meal.userId !== req.user!.id)) {
        return res.status(400).json({ message: "Invalid meal ID" });
      }

      const entry = await storage.addPlannerEntry(
        day.id,
        parsed.mealSlot,
        parsed.audience,
        parsed.mealId,
        parsed.position ?? 0,
        parsed.calories ?? 0,
        parsed.isDrink,
        parsed.drinkType ?? null,
      );

      // Phase 6: persist eater/guest context if provided
      if (parsed.eaterIds && parsed.eaterIds.length > 0) {
        await storage.setPlannerEntryEaters(entry.id, parsed.eaterIds);
      }
      if (parsed.guestEaters && parsed.guestEaters.length > 0) {
        await storage.setEntryGuests(entry.id, parsed.guestEaters);
      }

      res.status(201).json(entry);
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ message: "Invalid input", errors: err.errors });
      console.error("Error adding planner item:", err);
      res.status(500).json({ message: "Failed to add planner item" });
    }
  });

  app.delete("/api/planner/entries/:entryId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const entryId = Number(req.params.entryId);
      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      const day = await storage.getPlannerDay(entry.dayId);
      if (!day) return res.status(404).json({ message: "Entry not found" });
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Entry not found" });
      await storage.deletePlannerEntry(entryId);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting planner entry:", err);
      res.status(500).json({ message: "Failed to delete planner entry" });
    }
  });

  app.delete("/api/planner/weeks/:weekId/entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const weekId = Number(req.params.weekId);
      const week = await storage.getPlannerWeek(weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Week not found" });
      const entries = await storage.getPlannerEntriesForWeek(weekId);
      for (const entry of entries) {
        await storage.deletePlannerEntry(entry.id);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error clearing planner week:", err);
      res.status(500).json({ message: "Failed to clear week" });
    }
  });

  app.patch("/api/planner/entries/:entryId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const entryId = Number(req.params.entryId);
      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      const day = await storage.getPlannerDay(entry.dayId);
      if (!day) return res.status(404).json({ message: "Entry not found" });
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Entry not found" });
      const { position } = z.object({ position: z.number().int() }).parse(req.body);
      const updated = await storage.updatePlannerEntryPosition(entryId, position);
      res.json(updated);
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ message: "Invalid input" });
      console.error("Error updating planner entry position:", err);
      res.status(500).json({ message: "Failed to update planner entry" });
    }
  });

  app.get("/api/planner/full", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      let weeks = await storage.getPlannerWeeks(req.user!.id);
      if (weeks.length === 0) {
        weeks = await storage.createPlannerWeeks(req.user!.id);
      }
      const result = await Promise.all(
        weeks.map(async (week) => {
          const days = await storage.getPlannerDays(week.id);
          const entries = await storage.getPlannerEntriesForWeek(week.id);
          const daysWithEntries = days.map(day => ({
            ...day,
            entries: entries.filter(e => e.dayId === day.id),
          }));
          return { ...week, days: daysWithEntries };
        })
      );
      res.json(result);
    } catch (err) {
      console.error("Error fetching full planner:", err);
      res.status(500).json({ message: "Failed to fetch planner" });
    }
  });

  app.get("/api/products/barcode/:barcode", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = (req.user as any)?.id ?? null;

    async function logBarcodeEvent(opts: {
      barcode: string;
      status: string;
      httpStatus: number;
      offProductCode?: string | null;
      offProductName?: string | null;
      failureReason?: string | null;
      requestUrl?: string | null;
    }) {
      try {
        await pool.query(
          `INSERT INTO barcode_lookup_events
             (user_id, barcode, lookup_source, status, http_status, off_product_code, off_product_name, failure_reason, request_url)
           VALUES ($1, $2, 'off', $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            opts.barcode,
            opts.status,
            opts.httpStatus,
            opts.offProductCode ?? null,
            opts.offProductName ?? null,
            opts.failureReason ?? null,
            opts.requestUrl ?? null,
          ]
        );
      } catch (logErr) {
        console.error("[BARCODE-LOG] Failed to write barcode_lookup_events:", logErr);
      }
    }

    const rawBarcode = req.params.barcode.trim();
    const includeRegulatoryInScoring = req.query.includeRegulatoryInScoring !== 'false';

    console.log(`[BARCODE-SCAN] attempt barcode=${rawBarcode} user=${userId}`);

    if (!rawBarcode || !/^\d{8,14}$/.test(rawBarcode)) {
      console.warn(`[BARCODE-SCAN] invalid format barcode=${rawBarcode}`);
      await logBarcodeEvent({ barcode: rawBarcode || 'EMPTY', status: 'invalid_format', httpStatus: 400, failureReason: 'Barcode did not match \\d{8,14}' });
      return res.status(400).json({ message: "Invalid barcode format" });
    }

    // If a 12-digit barcode arrives (UPC-A), also try the 13-digit EAN-13
    // equivalent (leading zero prepended). OFF stores all products under their
    // canonical EAN-13 code, so a raw UPC-A lookup will always miss.
    const barcode = rawBarcode.length === 12 ? '0' + rawBarcode : rawBarcode;
    if (barcode !== rawBarcode) {
      console.log(`[BARCODE-SCAN] UPC-A→EAN-13 expansion: "${rawBarcode}" → "${barcode}"`);
    }

    console.log(`[SCAN-BACKEND] received="${rawBarcode}" normalised="${barcode}" sent_to_off="${barcode}"`);

    const OFF_FIELDS = 'code,product_name,product_name_en,brands,image_front_url,image_url,ingredients_text,ingredients_text_en,nutriments,nova_group,categories_tags,nutriscore_grade,countries_tags,stores_tags,stores,purchase_places_tags';
    const offUrl = `https://world.openfoodfacts.net/api/v0/product/${barcode}.json?fields=${OFF_FIELDS}`;

    try {
      const response = await axios.get(offUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'SmartMealPlanner/1.0 (contact: smartmealplanner@replit.app)' },
      });

      const offHttpStatus = response.status;
      const offStatus = response.data?.status ?? 'no_data';
      const offCode = response.data?.product?.code ?? 'none';
      const offNameFinal = response.data?.product?.product_name ?? response.data?.product?.product_name_en ?? 'none';
      console.log(`[SCAN-OFF] http_status=${offHttpStatus} off_status=${offStatus} code="${offCode}" name="${offNameFinal}"`);

      if (!response.data || response.data.status !== 1 || !response.data.product) {
        console.warn(`[BARCODE-SCAN] OFF miss barcode=${barcode} off_status=${response.data?.status ?? 'no_data'}`);
        await logBarcodeEvent({ barcode, status: 'not_found_off', httpStatus: 404, failureReason: 'OFF returned status!=1 or no product', requestUrl: offUrl });
        return res.status(404).json({ message: "Product not found", scanStatus: 'not_found_off' });
      }

      const p = response.data.product;
      // offCode and offNameFinal already declared above from response.data — reuse below

      // Determine ingredient confidence for this barcode scan.
      //
      // Hard-block ONLY when the product is positively identified as non-English
      // (non-ASCII character density ≥ 2, or known German/French/Dutch lexical
      // markers). This is the only case we should return a 404.
      //
      // When the language check is inconclusive (e.g. "Free range eggs" — too
      // short to score confidently, but no negative signals), we return the
      // product with scanConfidence:"low" rather than silently 404-ing. This
      // prevents false negatives on simple whole foods.
      const ingredTextForLangCheck = p.ingredients_text_en || p.ingredients_text || '';
      const nonAsciiDensity = (ingredTextForLangCheck.match(/[àáâäæãåçćèéêëîïíìłńñôöòóœøśšûüùúÿžżÄÖÜß]/g) || []).length;
      const isConfirmedNonEnglish = nonAsciiDensity >= 2 || isLikelyNonEnglishIngredients(ingredTextForLangCheck);

      if (isConfirmedNonEnglish) {
        console.warn(`[BARCODE-SCAN] lang-filter BLOCKED barcode=${barcode} off_name="${offNameFinal}" non_ascii=${nonAsciiDensity} text="${ingredTextForLangCheck.slice(0,80)}"`);
        await logBarcodeEvent({ barcode, status: 'lang_filtered', httpStatus: 404, offProductCode: offCode, offProductName: offNameFinal, failureReason: 'Confirmed non-English: non-ASCII density or foreign lexical markers', requestUrl: offUrl });
        return res.status(404).json({ message: "Product not found", scanStatus: 'lang_blocked' });
      }

      const passesFullEnglishCheck = hasEnglishIngredients(p);
      const scanConfidence: 'high' | 'low' = passesFullEnglishCheck ? 'high' : 'low';

      if (scanConfidence === 'low') {
        console.log(`[BARCODE-SCAN] lang-filter LOW-CONFIDENCE barcode=${barcode} off_name="${offNameFinal}" text_len=${ingredTextForLangCheck.length} — returning product with warning`);
      }

      const ingredientsText = p.ingredients_text_en || p.ingredients_text || '';
      const analysis = ingredientsText ? analyzeProduct(ingredientsText, p.nutriments || null, p.nova_group || null) : null;
      const allAdditives = await storage.getAllAdditives();
      const upfAnalysis = ingredientsText && analysis ? analyzeProductUPF(ingredientsText, allAdditives, analysis.healthScore, {
        productName: p.product_name || p.product_name_en || '',
        categoriesTags: p.categories_tags || [],
        novaGroup: p.nova_group || null,
      }, analysis.ingredients, !includeRegulatoryInScoring) : null;

      const countriesTags: string[] = p.countries_tags || [];
      const isUK = countriesTags.some((c: string) => c === 'en:united-kingdom' || c === 'en:uk');

      const rawStores: string[] = [
        ...(p.stores_tags || []),
        ...(p.purchase_places_tags || []),
        ...((p.stores || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)),
      ];
      const barcodeRetail = enrichRetailData({
        storeTags: rawStores,
        brand: p.brands,
        categoryTags: p.categories_tags || [],
        barcode: p.code || barcode,
      });

      const product = {
        barcode: p.code || barcode,
        product_name: p.product_name || p.product_name_en || 'Unknown Product',
        brand: p.brands || null,
        image_url: p.image_front_url || p.image_url || null,
        ingredients_text: ingredientsText || null,
        nova_group: p.nova_group || (analysis?.novaGroup ?? null),
        nutriscore_grade: p.nutriscore_grade || null,
        categories_tags: p.categories_tags || [],
        isUK,
        nutriments: p.nutriments ? {
          calories: p.nutriments['energy-kcal_100g']?.toString() || null,
          protein: p.nutriments.proteins_100g?.toString() || null,
          carbs: p.nutriments.carbohydrates_100g?.toString() || null,
          fat: p.nutriments.fat_100g?.toString() || null,
          sugar: p.nutriments.sugars_100g?.toString() || null,
          salt: p.nutriments.salt_100g?.toString() || null,
        } : null,
        nutriments_raw: p.nutriments || null,
        analysis,
        upfAnalysis: upfAnalysis ? {
          upfScore: upfAnalysis.upfScore,
          thaRating: upfAnalysis.thaRating,
          additiveCount: upfAnalysis.additiveCount,
          regulatoryCount: upfAnalysis.regulatoryCount,
          additiveMatches: upfAnalysis.additiveMatches.map(m => ({
            name: m.additive.name,
            type: m.additive.type,
            riskLevel: m.additive.riskLevel,
            description: m.additive.description,
            foundIn: m.foundIn,
            isRegulatory: m.isRegulatory,
          })),
          processingIndicators: upfAnalysis.processingIndicators,
          ingredientCount: upfAnalysis.ingredientCount,
          upfIngredientCount: upfAnalysis.upfIngredientCount,
          riskBreakdown: upfAnalysis.riskBreakdown,
          thaExplanation: buildTHAExplanation(upfAnalysis, p.nova_group || null),
          scoringExcludesRegulatory: upfAnalysis.scoringExcludesRegulatory ?? false,
        } : null,
        availableStores: barcodeRetail.availableStores,
        storeConfidence: barcodeRetail.storeConfidence,
        confirmedStores: barcodeRetail.confirmedStores,
        inferredStores: barcodeRetail.inferredStores,
      };

      console.log(`[BARCODE-SCAN] success barcode=${barcode} off_name="${offNameFinal}" confidence=${scanConfidence} tha_rating=${upfAnalysis?.thaRating ?? 'n/a'} has_ingredients=${!!ingredientsText}`);
      await logBarcodeEvent({ barcode, status: 'found', httpStatus: 200, offProductCode: offCode, offProductName: offNameFinal, requestUrl: offUrl });

      res.json({
        product: {
          ...product,
          scanConfidence,
          ...(scanConfidence === 'low' ? { scanWarning: "Ingredient data is limited for this product; THA analysis may be incomplete." } : {}),
        },
      });
    } catch (err: any) {
      const isAxiosTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      const isOffNotFound = err?.response?.status === 404;

      if (isOffNotFound) {
        console.warn(`[BARCODE-SCAN] OFF 404 barcode=${barcode}`);
        await logBarcodeEvent({ barcode, status: 'not_found_off', httpStatus: 404, failureReason: 'OFF API returned 404', requestUrl: offUrl });
        return res.status(404).json({ message: "Product not found", scanStatus: 'not_found_off' });
      }

      if (isAxiosTimeout) {
        console.error(`[BARCODE-SCAN] timeout barcode=${barcode} url=${offUrl}`);
        await logBarcodeEvent({ barcode, status: 'timeout', httpStatus: 504, failureReason: `Axios timeout: ${err?.message}`, requestUrl: offUrl });
        return res.status(504).json({ message: "Barcode lookup timed out", scanStatus: 'timeout' });
      }

      console.error(`[BARCODE-SCAN] error barcode=${barcode}`, err?.message ?? err);
      await logBarcodeEvent({ barcode, status: 'error', httpStatus: 500, failureReason: err?.message ?? String(err), requestUrl: offUrl });
      res.status(500).json({ message: "Failed to look up barcode", scanStatus: 'error' });
    }
  });

  app.get("/api/user/streak", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const streak = await storage.getUserStreak(req.user!.id);
      res.json(streak || { currentEliteStreak: 0, bestEliteStreak: 0, weeklyEliteCount: 0, lastEliteDate: null });
    } catch (err) {
      console.error("Error fetching streak:", err);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  app.post("/api/user/streak/record", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { thaRating } = req.body;
      if (typeof thaRating !== 'number' || thaRating < 1 || thaRating > 5) {
        return res.status(400).json({ message: "Invalid thaRating" });
      }

      const userId = req.user!.id;
      const today = new Date().toISOString().split('T')[0];
      const isElite = thaRating === 5;
      const isProcessed = thaRating <= 2;

      const prefs = await storage.getUserPreferences(userId);

      if (prefs?.eliteTrackingEnabled !== false) {
        const existing = await storage.getUserStreak(userId);
        const getWeekStart = (d: Date) => {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(d.setDate(diff)).toISOString().split('T')[0];
        };
        const currentWeekStart = getWeekStart(new Date());

        if (isElite) {
          let newStreak = 1;
          let weeklyCount = 1;

          if (existing) {
            if (existing.lastEliteDate === today) {
              newStreak = existing.currentEliteStreak;
              weeklyCount = existing.weeklyEliteCount;
            } else {
              const lastDate = existing.lastEliteDate ? new Date(existing.lastEliteDate) : null;
              const todayDate = new Date(today);
              if (lastDate) {
                const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                newStreak = diffDays <= 1 ? existing.currentEliteStreak + 1 : 1;
              }
              weeklyCount = existing.weekStartDate === currentWeekStart
                ? existing.weeklyEliteCount + 1 : 1;
            }
          }

          const bestStreak = Math.max(newStreak, existing?.bestEliteStreak ?? 0);
          await storage.upsertUserStreak(userId, {
            currentEliteStreak: newStreak,
            bestEliteStreak: bestStreak,
            lastEliteDate: today,
            weeklyEliteCount: weeklyCount,
            weekStartDate: currentWeekStart,
          });
        } else if (existing) {
          const lastDate = existing.lastEliteDate ? new Date(existing.lastEliteDate) : null;
          const todayDate = new Date(today);
          if (lastDate) {
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
              await storage.upsertUserStreak(userId, {
                currentEliteStreak: 0,
                weeklyEliteCount: existing.weekStartDate === currentWeekStart ? existing.weeklyEliteCount : 0,
                weekStartDate: currentWeekStart,
              });
            }
          }
        }
      }

      if (prefs?.healthTrendEnabled !== false) {
        await storage.upsertUserHealthTrend(userId, today, thaRating, isElite, isProcessed);
      }

      const updatedStreak = await storage.getUserStreak(userId);
      res.json({
        streak: updatedStreak || { currentEliteStreak: 0, bestEliteStreak: 0, weeklyEliteCount: 0 },
        isElite,
      });
    } catch (err) {
      console.error("Error recording streak:", err);
      res.status(500).json({ message: "Failed to record streak" });
    }
  });

  app.get("/api/user/health-trends", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = await storage.getUserHealthTrends(req.user!.id, Math.min(days, 90));
      res.json(trends);
    } catch (err) {
      console.error("Error fetching health trends:", err);
      res.status(500).json({ message: "Failed to fetch health trends" });
    }
  });

  app.get("/api/user/intelligence-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const prefs = await storage.getUserPreferences(req.user!.id);
      res.json({
        soundEnabled: prefs?.soundEnabled ?? true,
        eliteTrackingEnabled: prefs?.eliteTrackingEnabled ?? true,
        healthTrendEnabled: prefs?.healthTrendEnabled ?? true,
        barcodeScannerEnabled: prefs?.barcodeScannerEnabled ?? true,
        includeRegulatoryAdditivesInScoring: prefs?.includeRegulatoryAdditivesInScoring ?? true,
      });
    } catch (err) {
      console.error("Error fetching intelligence settings:", err);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/user/intelligence-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const allowedFields = ['soundEnabled', 'eliteTrackingEnabled', 'healthTrendEnabled', 'barcodeScannerEnabled', 'includeRegulatoryAdditivesInScoring'];
      const updates: Record<string, boolean> = {};
      for (const field of allowedFields) {
        if (typeof req.body[field] === 'boolean') {
          updates[field] = req.body[field];
        }
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const existing = await storage.getUserPreferences(req.user!.id);
      if (existing) {
        const result = await storage.upsertUserPreferences(req.user!.id, {
          ...existing,
          ...updates,
        } as any);
        res.json(result);
      } else {
        const result = await storage.upsertUserPreferences(req.user!.id, updates as any);
        res.json(result);
      }
    } catch (err) {
      console.error("Error updating intelligence settings:", err);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get("/api/user/planner-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const prefs = await storage.getUserPreferences(req.user!.id);
      res.json({
        showCalories: prefs?.plannerShowCalories ?? true,
        enableBabyMeals: prefs?.plannerEnableBabyMeals ?? false,
        enableChildMeals: prefs?.plannerEnableChildMeals ?? false,
        enableDrinks: prefs?.plannerEnableDrinks ?? false,
      });
    } catch (err) {
      console.error("Error fetching planner settings:", err);
      res.status(500).json({ message: "Failed to fetch planner settings" });
    }
  });

  const plannerSettingsSchema = z.object({
    showCalories: z.boolean().optional(),
    enableBabyMeals: z.boolean().optional(),
    enableChildMeals: z.boolean().optional(),
    enableDrinks: z.boolean().optional(),
  }).refine(data => Object.values(data).some(v => v !== undefined), {
    message: "At least one setting must be provided",
  });

  app.patch("/api/user/planner-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = plannerSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid settings" });
      }

      const fieldMap: Record<string, string> = {
        showCalories: 'plannerShowCalories',
        enableBabyMeals: 'plannerEnableBabyMeals',
        enableChildMeals: 'plannerEnableChildMeals',
        enableDrinks: 'plannerEnableDrinks',
      };
      const updates: Record<string, boolean> = {};
      for (const [apiField, dbField] of Object.entries(fieldMap)) {
        if (parsed.data[apiField as keyof typeof parsed.data] !== undefined) {
          updates[dbField] = parsed.data[apiField as keyof typeof parsed.data] as boolean;
        }
      }

      const existing = await storage.getUserPreferences(req.user!.id);
      const merged = { ...(existing || {}), ...updates };
      const result = await storage.upsertUserPreferences(req.user!.id, merged as any);
      res.json(result);
    } catch (err) {
      console.error("Error updating planner settings:", err);
      res.status(500).json({ message: "Failed to update planner settings" });
    }
  });

  app.get("/api/user/product-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getProductHistory(req.user!.id, Math.min(limit, 100));
      res.json(history);
    } catch (err) {
      console.error("Error fetching product history:", err);
      res.status(500).json({ message: "Failed to fetch product history" });
    }
  });

  app.post("/api/user/product-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { barcode, productName, brand, imageUrl, novaGroup, nutriscoreGrade, thaRating, upfScore, healthScore, source } = req.body;
      if (!productName) return res.status(400).json({ message: "productName is required" });
      const result = await storage.addProductHistory(req.user!.id, {
        barcode: barcode || null,
        productName,
        brand: brand || null,
        imageUrl: imageUrl || null,
        novaGroup: novaGroup ?? null,
        nutriscoreGrade: nutriscoreGrade || null,
        thaRating: thaRating ?? null,
        upfScore: upfScore ?? null,
        healthScore: healthScore ?? null,
        scannedAt: new Date().toISOString(),
        source: source || "search",
      });
      res.json(result);
    } catch (err) {
      console.error("Error saving product history:", err);
      res.status(500).json({ message: "Failed to save product history" });
    }
  });

  app.delete("/api/user/product-history/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.deleteProductHistory(req.user!.id, parseInt(req.params.id));
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting product history:", err);
      res.status(500).json({ message: "Failed to delete product history" });
    }
  });

  app.delete("/api/user/product-history", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.clearProductHistory(req.user!.id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error clearing product history:", err);
      res.status(500).json({ message: "Failed to clear product history" });
    }
  });

  app.get("/api/freezer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const items = await storage.getFreezerMeals(req.user!.id);
      res.json(items);
    } catch (err) {
      console.error("Error getting freezer meals:", err);
      res.status(500).json({ message: "Failed to get freezer meals" });
    }
  });

  app.post("/api/freezer", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const data = insertFreezerMealSchema.parse(req.body);
      const meal = await storage.getMeal(data.mealId);
      if (!meal) return res.status(404).json({ message: "Meal not found" });
      if (!meal.isFreezerEligible) return res.status(400).json({ message: "This meal is not marked as freezer eligible" });
      const item = await storage.addFreezerMeal(req.user!.id, data);
      res.json(item);
    } catch (err) {
      console.error("Error adding freezer meal:", err);
      res.status(500).json({ message: "Failed to add freezer meal" });
    }
  });

  app.patch("/api/freezer/:id/use-portion", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getFreezerMeal(id);
      if (!existing) return res.status(404).json({ message: "Freezer meal not found or empty" });
      const householdId = await getHouseholdForUser(req.user!.id);
      if (existing.householdId !== householdId) return res.status(403).json({ message: "Access denied" });
      const result = await storage.useFreezerMealPortion(id);
      if (!result) return res.status(404).json({ message: "Freezer meal not found or empty" });
      res.json(result);
    } catch (err) {
      console.error("Error using freezer portion:", err);
      res.status(500).json({ message: "Failed to use freezer portion" });
    }
  });

  app.patch("/api/freezer/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getFreezerMeal(id);
      if (!existing) return res.status(404).json({ message: "Freezer meal not found" });
      const householdId = await getHouseholdForUser(req.user!.id);
      if (existing.householdId !== householdId) return res.status(403).json({ message: "Access denied" });
      const { remainingPortions } = req.body;
      const result = await storage.updateFreezerMealPortions(id, remainingPortions);
      if (!result) return res.status(404).json({ message: "Freezer meal not found" });
      res.json(result);
    } catch (err) {
      console.error("Error updating freezer meal:", err);
      res.status(500).json({ message: "Failed to update freezer meal" });
    }
  });

  app.delete("/api/freezer/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getFreezerMeal(id);
      if (!existing) return res.status(404).json({ message: "Freezer meal not found" });
      const householdId = await getHouseholdForUser(req.user!.id);
      if (existing.householdId !== householdId) return res.status(403).json({ message: "Access denied" });
      await storage.deleteFreezerMeal(id);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting freezer meal:", err);
      res.status(500).json({ message: "Failed to delete freezer meal" });
    }
  });

  app.patch("/api/meals/:id/freezer-eligible", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { eligible } = req.body;
      const result = await storage.updateMealFreezerEligible(parseInt(req.params.id), eligible);
      if (!result) return res.status(404).json({ message: "Meal not found" });
      res.json(result);
    } catch (err) {
      console.error("Error updating freezer eligibility:", err);
      res.status(500).json({ message: "Failed to update freezer eligibility" });
    }
  });

  app.get("/api/freezer/by-meal/:mealId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const items = await storage.getFreezerMealsByMealId(req.user!.id, parseInt(req.params.mealId));
      res.json(items);
    } catch (err) {
      console.error("Error getting freezer meals by meal:", err);
      res.status(500).json({ message: "Failed to get freezer meals" });
    }
  });

  app.post("/api/admin/import-global-meals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.getUser(req.user!.id);
    if (!isAdmin(user)) return res.status(403).json({ message: "Admin access required" });
    try {
      const limits = req.body?.limits || undefined;
      const results = await importGlobalMeals(limits);
      res.json({ success: true, results });
    } catch (err) {
      console.error("Error importing global meals:", err);
      res.status(500).json({ message: "Failed to import global meals" });
    }
  });

  // ── Template Library (user-facing) ─────────────────────────────────────────

  app.get("/api/plan-templates/library", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user!;
      const tier = hasPremiumAccess(user) ? "premium" : "free";
      const [globalTemplates, myTemplates] = await Promise.all([
        storage.getPublishedGlobalTemplates(tier),
        storage.getUserPrivateTemplates(user.id),
      ]);
      res.json({ globalTemplates, myTemplates });
    } catch (err) {
      console.error("[Templates] library error:", err);
      res.status(500).json({ message: "Failed to fetch template library" });
    }
  });

  app.get("/api/plan-templates/mine", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const templates = await storage.getUserPrivateTemplates(req.user!.id);
      res.json(templates);
    } catch (err) {
      console.error("[Templates] mine list error:", err);
      res.status(500).json({ message: "Failed to fetch your templates" });
    }
  });

  app.post("/api/plan-templates/mine", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user!;
      const MAX_FREE = parseInt(process.env.MAX_PRIVATE_TEMPLATES_FREE || "4");
      if (!hasPremiumAccess(user)) {
        const count = await storage.countUserPrivateTemplates(user.id);
        if (count >= MAX_FREE) {
          return res.status(403).json({ message: `Free plan limit is ${MAX_FREE} saved templates. Upgrade to Premium for unlimited.` });
        }
      }
      const { name, season, description } = z.object({
        name: z.string().min(1),
        season: z.string().optional(),
        description: z.string().optional(),
      }).parse(req.body);

      const template = await storage.createPrivateTemplate(user.id, { name, season, description });
      const { itemCount } = await storage.snapshotPlannerToTemplate(template.id, user.id);
      res.status(201).json({ id: template.id, name: template.name, itemCount });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[Templates] create mine error:", err);
      res.status(500).json({ message: "Failed to save template" });
    }
  });

  app.put("/api/plan-templates/mine/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user!.id;
      const { name, season, description } = z.object({
        name: z.string().min(1).optional(),
        season: z.string().optional(),
        description: z.string().optional(),
      }).parse(req.body);

      const template = await storage.getTemplateWithItems(req.params.id);
      if (!template || template.ownerUserId !== userId) return res.status(404).json({ message: "Template not found" });

      const updated = await storage.updateTemplateMetadata(req.params.id, { name, season, description });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[Templates] update mine error:", err);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.post("/api/plan-templates/mine/:id/snapshot-from-planner", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user!.id;
      const template = await storage.getTemplateWithItems(req.params.id);
      if (!template || template.ownerUserId !== userId) return res.status(404).json({ message: "Template not found" });

      const { itemCount } = await storage.snapshotPlannerToTemplate(req.params.id, userId);
      res.json({ itemCount });
    } catch (err) {
      console.error("[Templates] re-snapshot mine error:", err);
      res.status(500).json({ message: "Failed to snapshot planner into template" });
    }
  });

  app.delete("/api/plan-templates/mine/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.deletePrivateTemplate(req.params.id, req.user!.id);
      res.sendStatus(204);
    } catch (err: any) {
      if (err?.message?.includes("not found")) return res.status(404).json({ message: "Template not found" });
      console.error("[Templates] delete mine error:", err);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  app.post("/api/plan-templates/:id/import", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = req.user!;
      const templateId = req.params.id;
      const { scope, weekNumber, dayOfWeek, mealSlot, mode } = z.object({
        scope: z.enum(["all", "week", "day", "meal"]),
        weekNumber: z.number().int().min(1).max(6).optional(),
        dayOfWeek: z.number().int().min(1).max(7).optional(),
        mealSlot: z.enum(["breakfast", "lunch", "dinner"]).optional(),
        mode: z.enum(["replace", "keep"]).default("replace"),
      }).parse(req.body);

      const template = await storage.getTemplateWithItems(templateId);
      if (!template) return res.status(404).json({ message: "Template not found" });

      if (template.ownerUserId === null || template.ownerUserId === undefined) {
        if (template.status !== "published" && !isAdmin(user)) {
          return res.status(404).json({ message: "Template not found" });
        }
        if (template.isPremium && !hasPremiumAccess(user) && !isAdmin(user)) {
          return res.status(403).json({ message: "Premium required to import this plan" });
        }
      } else {
        if (template.ownerUserId !== user.id && !isAdmin(user)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      if ((scope === "week" || scope === "day" || scope === "meal") && weekNumber === undefined) {
        return res.status(400).json({ message: "weekNumber required for this scope" });
      }
      if ((scope === "day" || scope === "meal") && dayOfWeek === undefined) {
        return res.status(400).json({ message: "dayOfWeek required for this scope" });
      }
      if (scope === "meal" && !mealSlot) {
        return res.status(400).json({ message: "mealSlot required for this scope" });
      }

      const result = await storage.importTemplateItems(user.id, templateId, { type: scope, weekNumber, dayOfWeek, mealSlot }, mode);
      res.json({ templateName: template.name, ...result });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[Templates] import error:", err);
      res.status(500).json({ message: "Failed to import template" });
    }
  });

  // ── Template Sharing ────────────────────────────────────────────────────────

  app.post("/api/plan-templates/mine/:id/share", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user!;
    const templateId = req.params.id;
    try {
      const tier = user.subscriptionTier as string;
      const hasPremium = tier === "premium" || tier === "friends_family";
      if (!hasPremium) {
        const sharedCount = await storage.countSharedTemplates(user.id);
        const templates = await storage.getUserPrivateTemplates(user.id);
        const thisTemplate = templates.find(t => t.id === templateId);
        const alreadyShared = thisTemplate?.visibility === "shared";
        if (!alreadyShared && sharedCount >= 1) {
          return res.status(403).json({ message: "Free accounts can share 1 plan at a time. Upgrade to Premium to share more." });
        }
      }
      const token = await storage.sharePlanTemplate(templateId, user.id);
      const url = `${req.protocol}://${req.get("host")}/shared/${token}`;
      res.json({ shareToken: token, url });
    } catch (err: any) {
      if (err?.message?.includes("not found")) return res.status(404).json({ message: "Template not found" });
      console.error("[Templates] share error:", err);
      res.status(500).json({ message: "Failed to share template" });
    }
  });

  app.post("/api/plan-templates/mine/:id/unshare", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.unsharePlanTemplate(req.params.id, req.user!.id);
      res.sendStatus(200);
    } catch (err: any) {
      if (err?.message?.includes("not found")) return res.status(404).json({ message: "Template not found" });
      console.error("[Templates] unshare error:", err);
      res.status(500).json({ message: "Failed to unshare template" });
    }
  });

  app.get("/api/shared/:token", async (req, res) => {
    try {
      const result = await storage.getSharedTemplate(req.params.token);
      if (!result) return res.status(404).json({ message: "Shared plan not found" });

      const { template, items } = result;
      res.json({
        id: template.id,
        name: template.name,
        description: template.description,
        season: template.season,
        items,
      });
    } catch (err) {
      console.error("[Templates] get shared error:", err);
      res.status(500).json({ message: "Failed to load shared plan" });
    }
  });

  // ── Admin Template Management ────────────────────────────────────────────────

  app.get("/api/admin/plan-templates", assertAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllGlobalTemplatesAdmin();
      res.json(templates);
    } catch (err) {
      console.error("[AdminTemplates] list error:", err);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/admin/plan-templates", assertAdmin, async (req, res) => {
    try {
      const { name, season, description } = z.object({
        name: z.string().min(1),
        season: z.string().optional(),
        description: z.string().optional(),
      }).parse(req.body);

      const template = await storage.createGlobalTemplate({ name, season, description, createdBy: req.user!.id });
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[AdminTemplates] create error:", err);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/admin/plan-templates/:id", assertAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const template = await storage.getTemplateWithItems(id);
      if (!template || template.ownerUserId !== null) return res.status(404).json({ message: "Template not found" });
      if (template.status === "archived") return res.status(400).json({ message: "Cannot edit an archived template" });

      const { name, season, description } = z.object({
        name: z.string().min(1).optional(),
        season: z.string().optional(),
        description: z.string().optional(),
      }).parse(req.body);

      const updated = await storage.updateTemplateMetadata(id, { name, season, description });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[AdminTemplates] update error:", err);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.post("/api/admin/plan-templates/:id/publish", assertAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const template = await storage.getTemplateWithItems(id);
      if (!template || template.ownerUserId !== null) return res.status(404).json({ message: "Template not found" });

      const updated = await storage.setGlobalTemplateStatus(id, "published", new Date());
      res.json(updated);
    } catch (err) {
      console.error("[AdminTemplates] publish error:", err);
      res.status(500).json({ message: "Failed to publish template" });
    }
  });

  app.post("/api/admin/plan-templates/:id/archive", assertAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const template = await storage.getTemplateWithItems(id);
      if (!template || template.ownerUserId !== null) return res.status(404).json({ message: "Template not found" });
      if (template.isDefault) {
        return res.status(400).json({ message: "Cannot archive the Standard template while it is the default. Set another published template as default first." });
      }
      const updated = await storage.setGlobalTemplateStatus(id, "archived", null);
      res.json(updated);
    } catch (err) {
      console.error("[AdminTemplates] archive error:", err);
      res.status(500).json({ message: "Failed to archive template" });
    }
  });

  app.post("/api/admin/plan-templates/:id/restore", assertAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const template = await storage.getTemplateWithItems(id);
      if (!template || template.ownerUserId !== null) return res.status(404).json({ message: "Template not found" });

      const updated = await storage.setGlobalTemplateStatus(id, "draft");
      res.json(updated);
    } catch (err) {
      console.error("[AdminTemplates] restore error:", err);
      res.status(500).json({ message: "Failed to restore template" });
    }
  });

  app.post("/api/admin/plan-templates/:id/snapshot-from-planner", assertAdmin, async (req, res) => {
    try {
      const id = req.params.id as string;
      const template = await storage.getTemplateWithItems(id);
      if (!template || template.ownerUserId !== null) return res.status(404).json({ message: "Template not found" });

      const { itemCount } = await storage.snapshotPlannerToTemplate(id, req.user!.id);
      console.log(`[AdminTemplates] snapshot: template="${template.name}", itemCount=${itemCount}`);
      res.json({ itemCount });
    } catch (err) {
      console.error("[AdminTemplates] snapshot error:", err);
      res.status(500).json({ message: "Failed to snapshot planner into template" });
    }
  });

  // Plan template routes (backwards-compatible)
  app.get("/api/plan-templates/default", async (req, res) => {
    try {
      const template = await storage.getDefaultTemplate();
      if (!template) return res.status(404).json({ message: "No default template found" });
      res.json({ id: template.id, name: template.name, description: template.description, itemCount: template.items.length });
    } catch (err) {
      console.error("[PlanTemplates] getDefault error:", err);
      res.status(500).json({ message: "Failed to fetch default template" });
    }
  });

  app.get("/api/plan-templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplateWithItems(req.params.id);
      if (!template) return res.status(404).json({ message: "Template not found" });
      res.json(template);
    } catch (err) {
      console.error("[PlanTemplates] getById error:", err);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/plan-templates/:id/apply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id;
    const templateId = req.params.id;
    const mode = req.query.mode === "keep" ? "keep" : "replace";

    try {
      const template = await storage.getTemplateWithItems(templateId);
      if (!template) return res.status(404).json({ message: "Template not found" });

      console.log(`[PlanTemplates] apply: user=${userId}, template="${template.name}", mode=${mode}, items=${template.items.length}`);

      // Ensure planner weeks/days exist for user (idempotent)
      const weeks = await storage.createPlannerWeeks(userId);

      // Build lookup map: `${weekNumber}:${plannerDayOfWeek}` → dayId
      // Template dayOfWeek 1-7 (Mon=1, Sun=7) → Planner dayOfWeek 0-6 (Sun=0, Mon=1, Sat=6)
      // Conversion: plannerDay = templateDay % 7
      const dayIdMap = new Map<string, number>();
      const allDayIds: number[] = [];
      for (const week of weeks) {
        const days = await storage.getPlannerDays(week.id);
        for (const day of days) {
          dayIdMap.set(`${week.weekNumber}:${day.dayOfWeek}`, day.id);
          allDayIds.push(day.id);
        }
      }

      // Preload all existing entries in one query
      const existingEntries = await storage.getPlannerEntriesByDayIds(allDayIds);
      const occupiedSlots = new Set(
        existingEntries.map(e => `${e.dayId}:${e.mealType}:${e.audience}`)
      );

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const item of template.items) {
        const plannerDayOfWeek = item.dayOfWeek % 7;
        const dayId = dayIdMap.get(`${item.weekNumber}:${plannerDayOfWeek}`);

        if (dayId === undefined) {
          console.warn(`[PlanTemplates] no day found for W${item.weekNumber}D${item.dayOfWeek}`);
          skippedCount++;
          continue;
        }

        const slotKey = `${dayId}:${item.mealSlot}:adult`;
        const hasExisting = occupiedSlots.has(slotKey);

        if (mode === "keep" && hasExisting) {
          skippedCount++;
          continue;
        }

        await storage.upsertPlannerEntry(dayId, item.mealSlot, "adult", item.mealId);

        if (hasExisting) {
          updatedCount++;
        } else {
          createdCount++;
          occupiedSlots.add(slotKey);
        }
      }

      console.log(`[PlanTemplates] apply done: created=${createdCount}, updated=${updatedCount}, skipped=${skippedCount}`);
      res.json({ templateName: template.name, createdCount, updatedCount, skippedCount });
    } catch (err) {
      console.error("[PlanTemplates] apply error:", err);
      res.status(500).json({ message: "Failed to apply template" });
    }
  });

  // GET /api/admin/meals/export?source=web|custom|all&format=csv|json
  // Guard: authenticated + isBetaUser (same as other admin endpoints)
  // source=web  → meals with a sourceUrl (imported from the web)
  // source=custom → user-created meals with no sourceUrl and not system meals
  // source=all (default) → every meal in the database
  // format=csv (default) → text/csv download; format=json → JSON array
  app.get("/api/admin/meals/export", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.getUser(req.user!.id);
    if (!isAdmin(user)) return res.status(403).json({ message: "Admin access required" });

    const rawSource = req.query.source as string | undefined;
    const source = rawSource === "web" || rawSource === "custom" ? rawSource : "all";
    const format = req.query.format === "json" ? "json" : "csv";

    try {
      const rows = await storage.getMealsExport(source);

      if (format === "json") {
        return res.json(rows);
      }

      // CSV output
      const escape = (v: string | null | undefined) => {
        if (v == null) return "";
        const s = String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };
      const header = "id,name,source,source_url,user_id,created_at";
      const lines = rows.map(r =>
        [r.id, escape(r.name), escape(r.mealSourceType), escape(r.sourceUrl), r.userId, r.createdAt.toISOString()].join(",")
      );
      const csv = [header, ...lines].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="meals-export-${source}-${Date.now()}.csv"`);
      return res.send(csv);
    } catch (err) {
      console.error("[Admin] meals export error:", err);
      res.status(500).json({ message: "Export failed" });
    }
  });

  app.get("/api/admin/import-status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.getUser(req.user!.id);
    if (!isAdmin(user)) return res.status(403).json({ message: "Admin access required" });
    try {
      const status = await getImportStatus();
      res.json(status);
    } catch (err) {
      console.error("Error getting import status:", err);
      res.status(500).json({ message: "Failed to get import status" });
    }
  });

  // ── Admin User Management ────────────────────────────────────────────────────

  app.get("/api/admin/users", assertAdmin, async (req, res) => {
    try {
      const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
      const limit = Math.min(parseInt(String(req.query.limit || "25"), 10) || 25, 100);
      const offset = parseInt(String(req.query.offset || "0"), 10) || 0;

      const result = await storage.searchUsers(query, limit, offset);

      await storage.createAuditLog({
        adminUserId: req.user!.id,
        action: "USER_SEARCH",
        metadata: { queryLength: query.length, resultCount: result.total },
      });

      res.json({ users: result.users, total: result.total, limit, offset });
    } catch (err) {
      console.error("[AdminUsers] search error:", err);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.put("/api/admin/users/:id/subscription", assertAdmin, async (req, res) => {
    try {
      const targetId = parseInt(String(req.params.id), 10);
      if (isNaN(targetId)) return res.status(400).json({ message: "Invalid user id" });

      if (targetId === req.user!.id) {
        return res.status(400).json({ message: "Admins cannot change their own subscription tier via this endpoint" });
      }

      const { subscriptionTier } = z.object({
        subscriptionTier: z.enum(["free", "premium", "friends_family"]),
      }).parse(req.body);

      const currentUser = await storage.getUser(targetId);
      if (!currentUser) return res.status(404).json({ message: "User not found" });

      const oldTier = currentUser.subscriptionTier;
      const updated = await storage.setUserSubscriptionTier(targetId, subscriptionTier);

      await storage.createAuditLog({
        adminUserId: req.user!.id,
        action: "SET_SUBSCRIPTION_TIER",
        targetUserId: targetId,
        metadata: { oldTier, newTier: subscriptionTier },
      });

      console.log(`[AdminUsers] tier change: admin=${req.user!.id}, target=${targetId}, ${oldTier} → ${subscriptionTier}`);

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[AdminUsers] tier update error:", err);
      res.status(500).json({ message: "Failed to update subscription tier" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", assertAdmin, async (req, res) => {
    try {
      const targetId = parseInt(String(req.params.id), 10);
      if (isNaN(targetId)) return res.status(400).json({ message: "Invalid user id" });

      if (targetId === req.user!.id) {
        return res.status(400).json({ message: "Admins cannot reset their own password via this endpoint" });
      }

      const { newPassword } = z.object({
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }).parse(req.body);

      const targetUser = await storage.getUser(targetId);
      if (!targetUser) return res.status(404).json({ message: "User not found" });

      const hashed = await hashPassword(newPassword);
      await storage.updatePassword(targetId, hashed);

      await storage.createAuditLog({
        adminUserId: req.user!.id,
        action: "ADMIN_RESET_PASSWORD",
        targetUserId: targetId,
        metadata: {},
      });

      console.log(`[AdminUsers] password reset: admin=${req.user!.id}, target=${targetId}`);
      res.sendStatus(200);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[AdminUsers] reset-password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/admin/users/:id/run-onboarding", assertAdmin, async (req, res) => {
    try {
      const targetId = parseInt(String(req.params.id), 10);
      if (isNaN(targetId)) return res.status(400).json({ message: "Invalid user id" });

      const targetUser = await storage.getUser(targetId);
      if (!targetUser) return res.status(404).json({ message: "User not found" });

      await storage.resetOnboarding(targetId);

      await storage.createAuditLog({
        adminUserId: req.user!.id,
        action: "ADMIN_RUN_ONBOARDING",
        targetUserId: targetId,
        metadata: {},
      });

      console.log(`[AdminUsers] run-onboarding: admin=${req.user!.id}, target=${targetId}`);
      res.sendStatus(200);
    } catch (err) {
      console.error("[AdminUsers] run-onboarding error:", err);
      res.status(500).json({ message: "Failed to reset onboarding" });
    }
  });

  // ── Site Banner Settings ─────────────────────────────────────────────────────
  app.get("/api/site-settings/banner", async (_req, res) => {
    try {
      const raw = await storage.getSiteSetting("banner");
      const parsed = raw ? JSON.parse(raw) : { enabled: false, text: "" };
      res.json(parsed);
    } catch {
      res.json({ enabled: false, text: "" });
    }
  });

  app.put("/api/admin/site-settings/banner", assertAdmin, async (req, res) => {
    try {
      const { enabled, text } = req.body;
      if (typeof enabled !== "boolean" || typeof text !== "string") {
        return res.status(400).json({ message: "Invalid banner data" });
      }
      const payload = { enabled, text: text.trim() };
      await storage.setSiteSetting("banner", JSON.stringify(payload));
      res.json(payload);
    } catch (err) {
      console.error("[SiteSettings] banner update error:", err);
      res.status(500).json({ message: "Failed to update banner" });
    }
  });

  // ── Pantry Staples ──────────────────────────────────────────────────────────
  app.get("/api/pantry", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      let items = await storage.getPantryItems(req.user!.id);
      if (items.length === 0) {
        await storage.seedDefaultFoodPantryItems(req.user!.id).catch(e =>
          console.warn("[Pantry] Failed to seed food pantry defaults:", e)
        );
        await storage.seedDefaultHouseholdItems(req.user!.id).catch(e =>
          console.warn("[Pantry] Failed to seed household defaults:", e)
        );
        items = await storage.getPantryItems(req.user!.id);
      }
      res.json(items);
    } catch (err) {
      console.error("[Pantry] GET error:", err);
      res.status(500).json({ message: "Failed to fetch pantry items" });
    }
  });

  app.post("/api/pantry", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const schema = z.object({
        ingredient: z.string().min(1),
        displayName: z.string().optional(),
        category: z.enum(["larder", "fridge", "freezer", "household"]),
        notes: z.string().optional(),
      });
      const { ingredient, displayName, category, notes } = schema.parse(req.body);
      const item = await storage.addPantryItem(req.user!.id, ingredient, category, notes, displayName ?? ingredient);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      const msg = String((err as any)?.message ?? "");
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("UNIQUE")) {
        return res.status(409).json({ error: "already_exists" });
      }
      console.error("[Pantry] POST error:", err);
      res.status(500).json({ message: "Failed to add pantry item" });
    }
  });

  app.delete("/api/pantry/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      await storage.deletePantryItem(req.user!.id, id);
      res.sendStatus(204);
    } catch (err) {
      console.error("[Pantry] DELETE error:", err);
      res.status(500).json({ message: "Failed to delete pantry item" });
    }
  });

  // ── Pantry Ingredient Knowledge ───────────────────────────────────────────
  app.get("/api/pantry/knowledge/:key", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { resolveIngredientAlias } = await import("@shared/ingredient-aliases");
      const raw = req.params.key.trim();
      const canonicalKey = resolveIngredientAlias(raw);

      // Check DB first
      let knowledge = await storage.getPantryIngredientKnowledge(canonicalKey);
      if (knowledge) return res.json(knowledge);

      // Fire async enrichment and return null — client will retry or skip
      (async () => {
        try {
          const { enrichIngredient } = await import("./lib/openai-enrichment");
          const enriched = await enrichIngredient(canonicalKey);
          if (enriched) {
            await storage.upsertPantryIngredientKnowledge(canonicalKey, enriched, "ai");
          }
        } catch (err) {
          console.error(`[PantryKnowledge] Async enrichment failed for "${canonicalKey}":`, err);
        }
      })();

      return res.json(null);
    } catch (err) {
      console.error("[PantryKnowledge] GET error:", err);
      res.status(500).json({ message: "Failed to fetch pantry knowledge" });
    }
  });

  // ── Shopping List Extras ──────────────────────────────────────────────────
  app.get("/api/shopping-list/extras", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const extras = await storage.getShoppingListExtras(req.user!.id);
      res.json(extras);
    } catch (err) {
      console.error("[Extras] GET error:", err);
      res.status(500).json({ message: "Failed to fetch extras" });
    }
  });

  app.post("/api/shopping-list/extras", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const schema = z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        alwaysAdd: z.boolean().optional(),
      });
      const { name, category, alwaysAdd } = schema.parse(req.body);
      const item = await storage.addShoppingListExtra(req.user!.id, name, category, alwaysAdd);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[Extras] POST error:", err);
      res.status(500).json({ message: "Failed to add extra" });
    }
  });

  app.patch("/api/shopping-list/extras/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      const schema = z.object({ alwaysAdd: z.boolean().optional(), inBasket: z.boolean().optional() });
      const fields = schema.parse(req.body);
      const result = await storage.updateShoppingListExtra(req.user!.id, id, fields);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[Extras] PATCH error:", err);
      res.status(500).json({ message: "Failed to update extra" });
    }
  });

  app.delete("/api/shopping-list/extras/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      await storage.deleteShoppingListExtra(req.user!.id, id);
      res.sendStatus(204);
    } catch (err) {
      console.error("[Extras] DELETE error:", err);
      res.status(500).json({ message: "Failed to delete extra" });
    }
  });

  // ── Meal Pairings ─────────────────────────────────────────────────────────
  app.get("/api/meal-pairings/:mealId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const mealId = parseInt(req.params.mealId);
      if (isNaN(mealId)) return res.status(400).json({ message: "Invalid mealId" });
      const results = await storage.getMealPairings(mealId);
      res.json(results);
    } catch (err) {
      console.error("[Pairings] GET error:", err);
      res.status(500).json({ message: "Failed to fetch pairings" });
    }
  });

  app.post("/api/admin/meal-pairings", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);
    try {
      const schema = z.object({
        baseMealId: z.number().int(),
        suggestedMealId: z.number().int(),
        note: z.string().optional(),
        priority: z.number().int().optional(),
      });
      const { baseMealId, suggestedMealId, note, priority } = schema.parse(req.body);
      const pairing = await storage.addMealPairing({
        baseMealId,
        suggestedMealId,
        note: note ?? null,
        priority: priority ?? 0,
        createdBy: req.user!.id,
      });
      await storage.createAuditLog({
        adminUserId: req.user!.id,
        action: "meal_pairing_created",
        metadata: { baseMealId, suggestedMealId },
      });
      res.status(201).json(pairing);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      const msg = String((err as any)?.message ?? "");
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("UNIQUE")) {
        return res.status(409).json({ error: "already_exists" });
      }
      console.error("[Pairings] POST admin error:", err);
      res.status(500).json({ message: "Failed to create pairing" });
    }
  });

  app.delete("/api/admin/meal-pairings/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      const deleted = await storage.deleteMealPairing(id);
      if (!deleted) return res.status(404).json({ message: "Pairing not found" });
      await storage.createAuditLog({
        adminUserId: req.user!.id,
        action: "meal_pairing_deleted",
        metadata: { id, baseMealId: deleted.baseMealId, suggestedMealId: deleted.suggestedMealId },
      });
      res.sendStatus(204);
    } catch (err) {
      console.error("[Pairings] DELETE admin error:", err);
      res.status(500).json({ message: "Failed to delete pairing" });
    }
  });

  // ── Ingredient Products (THA Picks) ──────────────────────────────────────────

  app.get("/api/admin/ingredient-products", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);
    try {
      const query = typeof req.query.query === "string" ? req.query.query : "";
      const picks = await storage.searchIngredientProducts(query);
      res.json(picks);
    } catch (err) {
      console.error("[IngredientProducts] GET admin error:", err);
      res.status(500).json({ message: "Failed to fetch THA Picks" });
    }
  });

  app.post("/api/admin/ingredient-products", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);
    try {
      const schema = z.object({
        ingredientKey: z.string().min(1),
        productName: z.string().min(1),
        retailer: z.string().min(1),
        size: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        tags: z.any().optional().nullable(),
        priority: z.number().int().default(0),
        isActive: z.boolean().default(true),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const { normalizeIngredientKey } = await import("@shared/normalize");
      const data = {
        ...parsed.data,
        ingredientKey: normalizeIngredientKey(parsed.data.ingredientKey),
        createdBy: req.user!.id,
      };
      const pick = await storage.createIngredientProduct(data);
      res.status(201).json(pick);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("UNIQUE")) {
        return res.status(409).json({ error: "already_exists" });
      }
      console.error("[IngredientProducts] POST admin error:", err);
      res.status(500).json({ message: "Failed to create THA Pick" });
    }
  });

  app.put("/api/admin/ingredient-products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      const schema = z.object({
        ingredientKey: z.string().min(1).optional(),
        productName: z.string().min(1).optional(),
        retailer: z.string().min(1).optional(),
        size: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        tags: z.any().optional(),
        priority: z.number().int().optional(),
        isActive: z.boolean().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      let data = { ...parsed.data };
      if (data.ingredientKey) {
        const { normalizeIngredientKey } = await import("@shared/normalize");
        data.ingredientKey = normalizeIngredientKey(data.ingredientKey);
      }
      const updated = await storage.updateIngredientProduct(id, data);
      if (!updated) return res.status(404).json({ message: "THA Pick not found" });
      res.json(updated);
    } catch (err) {
      console.error("[IngredientProducts] PUT admin error:", err);
      res.status(500).json({ message: "Failed to update THA Pick" });
    }
  });

  app.delete("/api/admin/ingredient-products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") return res.sendStatus(403);
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id" });
      await storage.deactivateIngredientProduct(id);
      res.sendStatus(204);
    } catch (err) {
      console.error("[IngredientProducts] DELETE admin error:", err);
      res.status(500).json({ message: "Failed to deactivate THA Pick" });
    }
  });

  app.post("/api/ingredient-products/lookup", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const schema = z.object({ ingredientKeys: z.array(z.string()) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.json({ recommendations: {} });
      const { ingredientKeys } = parsed.data;
      if (ingredientKeys.length === 0) return res.json({ recommendations: {} });
      const allPicks = await storage.getAllActiveIngredientProducts();
      const grouped: Record<string, typeof allPicks> = {};
      for (const clientKey of ingredientKeys) {
        const clientWords = new Set(clientKey.split(' ').filter(Boolean));
        for (const pick of allPicks) {
          const pickWords = pick.ingredientKey.split(' ').filter(Boolean);
          if (pickWords.length > 0 && pickWords.every(w => clientWords.has(w))) {
            if (!grouped[clientKey]) grouped[clientKey] = [];
            grouped[clientKey].push(pick);
          }
        }
      }
      res.json({ recommendations: grouped });
    } catch (err) {
      console.error("[IngredientProducts] Lookup error (non-fatal):", err);
      res.json({ recommendations: {} });
    }
  });

  // ─── Admin: Recipe Source Controls ────────────────────────────────────────

  app.get("/api/admin/recipe-sources", assertAdmin, async (req, res) => {
    try {
      const sources = await getAllSourceSettings();
      res.json(sources);
    } catch (err) {
      console.error("[AdminRecipeSources] GET error:", err);
      res.status(500).json({ message: "Failed to load recipe sources" });
    }
  });

  app.put("/api/admin/recipe-sources", assertAdmin, async (req, res) => {
    try {
      const schema = z.object({
        updates: z.array(z.object({ sourceKey: z.string(), enabled: z.boolean() })),
      });
      const { updates } = schema.parse(req.body);
      await updateSourceSettings(updates);
      const sources = await getAllSourceSettings();
      res.json(sources);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[AdminRecipeSources] PUT error:", err);
      res.status(500).json({ message: "Failed to update recipe sources" });
    }
  });

  app.get("/api/admin/recipe-audit-logs", assertAdmin, async (req, res) => {
    try {
      const result = await getAuditLogs({
        page: parseInt(req.query.page as string ?? "1", 10) || 1,
        pageSize: parseInt(req.query.pageSize as string ?? "50", 10) || 50,
        sourceName: req.query.sourceName as string | undefined,
        reason: req.query.reason as string | undefined,
      });
      res.json(result);
    } catch (err) {
      console.error("[AdminRecipeSources] Audit log GET error:", err);
      res.status(500).json({ message: "Failed to load audit logs" });
    }
  });

  // ── Scan (OCR + Parse) ───────────────────────────────────────────────────────

  const scanUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error("INVALID_TYPE"));
    },
  });

  app.post("/api/scan", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    scanUpload.single("image")(req, res, (err) => {
      if (err) {
        if (err.message === "INVALID_TYPE") {
          return res.status(400).json({ message: "That file type isn't supported. Please upload a JPG, PNG, or WEBP image." });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "Image is too large. Maximum size is 10 MB." });
        }
        return res.status(400).json({ message: "File upload failed." });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided." });
      }

      let rawText: string;
      try {
        rawText = await extractTextFromImage(req.file.buffer);
      } catch (err) {
        if (err instanceof OcrError) {
          return res.status(422).json({
            rawText: "",
            error: "OCR_FAILED",
            message: "We couldn't read that image clearly. Try a brighter, sharper photo.",
          });
        }
        throw err;
      }

      const { result: parsed, parsedBy } = await parseScannedText(rawText);
      if (parsedBy === "heuristic") {
        console.warn("[Scan] AI unavailable or failed — result parsed by heuristic fallback");
      }
      res.json({ rawText, parsed, parsedBy });
    } catch (err) {
      console.error("[Scan] Error:", err);
      res.status(500).json({ message: "Scan failed unexpectedly. Please try again." });
    }
  });

  // ── Household Management API ─────────────────────────────────────────────────

  app.get("/api/household", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const userId = req.user!.id;
      const householdId = await getHouseholdForUser(userId);
      const { household, members } = await storage.getHouseholdWithMembers(householdId);
      const myMembership = members.find(m => m.member.userId === userId);
      res.json({
        id: household.id,
        name: household.name,
        inviteCode: household.inviteCode,
        myRole: myMembership?.member.role ?? "member",
        members: members.map(({ member, user }) => ({
          userId: member.userId,
          displayName: user.displayName || user.username,
          role: member.role,
          status: member.status,
        })),
      });
    } catch (err) {
      console.error("[Household] GET error:", err);
      res.status(500).json({ message: "Failed to fetch household" });
    }
  });

  app.post("/api/household", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { name } = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
      const existing = await storage.getHouseholdByUser(req.user!.id);
      if (existing) {
        return res.status(400).json({ message: "You already have an active household." });
      }
      const household = await storage.createHouseholdForUser(req.user!.id, name);
      res.status(201).json(household);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      console.error("[Household] POST error:", err);
      res.status(500).json({ message: "Failed to create household" });
    }
  });

  app.post("/api/household/join", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { inviteCode } = z.object({ inviteCode: z.string().min(1) }).parse(req.body);
      const result = await storage.joinHousehold(req.user!.id, inviteCode);
      res.json({
        id: result.household.id,
        name: result.household.name,
        inviteCode: result.household.inviteCode,
        myRole: result.role,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      if (err?.message === "INVALID_CODE") return res.status(400).json({ message: "Invalid invite code. Please check and try again." });
      if (err?.message === "ALREADY_IN_HOUSEHOLD") return res.status(400).json({ message: "You are already a member of this household." });
      console.error("[Household] JOIN error:", err);
      res.status(500).json({ message: "Failed to join household" });
    }
  });

  app.post("/api/household/leave", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const newHousehold = await storage.leaveHousehold(req.user!.id);
      res.json({ id: newHousehold.id, name: newHousehold.name, inviteCode: newHousehold.inviteCode });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      if (err?.message === "OWNER_HAS_MEMBERS") return res.status(403).json({ message: "You are the owner of a multi-member household. Transfer ownership or remove other members before leaving." });
      if (err?.message === "NO_ACTIVE_HOUSEHOLD") return res.status(400).json({ message: "No active household found." });
      console.error("[Household] LEAVE error:", err);
      res.status(500).json({ message: "Failed to leave household" });
    }
  });

  app.patch("/api/household", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { name } = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
      const householdId = await getHouseholdForUser(req.user!.id);
      const updated = await storage.renameHousehold(req.user!.id, householdId, name);
      res.json(updated);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      if (err?.message === "NOT_OWNER") return res.status(403).json({ message: "Only the household owner can rename it." });
      console.error("[Household] RENAME error:", err);
      res.status(500).json({ message: "Failed to rename household" });
    }
  });

  app.delete("/api/household/members/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const targetUserId = parseInt(req.params.userId);
      if (isNaN(targetUserId)) return res.status(400).json({ message: "Invalid user ID" });
      const members = await storage.removeHouseholdMember(req.user!.id, targetUserId);
      res.json(members.map(({ member, user }) => ({
        userId: member.userId,
        displayName: user.displayName || user.username,
        role: member.role,
        status: member.status,
      })));
    } catch (err: any) {
      if (err?.message === "NOT_OWNER") return res.status(403).json({ message: "Only the household owner can remove members." });
      if (err?.message === "CANNOT_REMOVE_SELF") return res.status(400).json({ message: "You cannot remove yourself. Use the leave option instead." });
      if (err?.message === "MEMBER_NOT_FOUND") return res.status(404).json({ message: "Member not found in your household." });
      console.error("[Household] REMOVE MEMBER error:", err);
      res.status(500).json({ message: "Failed to remove member" });
    }
  });

  // ── Basket Attribution / Planner Intelligence ──────────────────────────────

  app.get("/api/planner/basket-meal-ids", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mealIds = await storage.getBasketMealIds(req.user!.id);
    res.json(mealIds);
  });

  app.get("/api/household/dietary-context", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const context = await storage.getHouseholdDietaryContext(req.user!.id);
      res.json(context);
    } catch (err) {
      console.error("[HouseholdDietary] error:", err);
      res.status(500).json({ message: "Failed to fetch household dietary context" });
    }
  });

  // ── Household Eaters (Phase 2) ────────────────────────────────────────────────

  // List all eaters in the current user's household.
  // Lazily syncs adult household members into household_eaters on every read.
  app.get("/api/household/eaters", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const householdId = await getHouseholdForUser(req.user!.id);
      await storage.syncMembersAsEaters(householdId);
      const rows = await storage.getHouseholdEaters(householdId);
      const { dbEaterToHouseholdEater } = await import("@shared/household-eater.js");
      res.json(rows.map(dbEaterToHouseholdEater));
    } catch (err) {
      console.error("[HouseholdEaters] GET error:", err);
      res.status(500).json({ message: "Failed to fetch household eaters" });
    }
  });

  // Create a new eater (typically a child without an account).
  app.post("/api/household/eaters", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const householdId = await getHouseholdForUser(req.user!.id);
      const parsed = z.object({
        displayName: z.string().min(1).max(100),
        defaultDietTypes: z.array(z.string()).optional(),
        hardRestrictions: z.array(z.string()).optional(),
      }).parse(req.body);
      const row = await storage.createHouseholdEater(householdId, parsed);
      const { dbEaterToHouseholdEater } = await import("@shared/household-eater.js");
      res.status(201).json(dbEaterToHouseholdEater(row));
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ message: "Invalid input", errors: err.errors });
      console.error("[HouseholdEaters] POST error:", err);
      res.status(500).json({ message: "Failed to create household eater" });
    }
  });

  // Edit an existing child eater (kind === "child") — adults are synced from accounts.
  app.patch("/api/household/eaters/:eaterId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const eaterId = Number(req.params.eaterId);
      const householdId = await getHouseholdForUser(req.user!.id);
      const allEaters = await storage.getHouseholdEaters(householdId);
      const target = allEaters.find(e => e.id === eaterId);
      if (!target) return res.status(404).json({ message: "Eater not found" });
      if (target.userId !== null) return res.status(403).json({ message: "Adult eaters cannot be edited here" });

      const parsed = z.object({
        displayName: z.string().min(1).max(100).optional(),
        defaultDietTypes: z.array(z.string()).optional(),
        hardRestrictions: z.array(z.string()).optional(),
      }).parse(req.body);

      const row = await storage.updateHouseholdEater(eaterId, parsed);
      if (!row) return res.status(404).json({ message: "Eater not found" });
      const { dbEaterToHouseholdEater } = await import("@shared/household-eater.js");
      res.json(dbEaterToHouseholdEater(row));
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ message: "Invalid input", errors: err.errors });
      console.error("[HouseholdEaters] PATCH error:", err);
      res.status(500).json({ message: "Failed to update eater" });
    }
  });

  // Get eaters for a planner entry.
  // Default: if none are explicitly set, return all adult (userId != null) household eaters.
  app.get("/api/planner/entries/:entryId/eaters", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const entryId = Number(req.params.entryId);
      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      const day = await storage.getPlannerDay(entry.dayId);
      if (!day) return res.status(404).json({ message: "Entry not found" });
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Entry not found" });

      const { dbEaterToHouseholdEater } = await import("@shared/household-eater.js");
      let rows = await storage.getPlannerEntryEaters(entryId);

      // Default: no explicit selection yet → return all household eaters (adults + children)
      if (rows.length === 0) {
        rows = await storage.getHouseholdEaters(householdId);
      }

      res.json(rows.map(dbEaterToHouseholdEater));
    } catch (err) {
      console.error("[PlannerEntryEaters] GET error:", err);
      res.status(500).json({ message: "Failed to fetch entry eaters" });
    }
  });

  // Set eaters for a planner entry (replaces previous selection).
  app.put("/api/planner/entries/:entryId/eaters", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const entryId = Number(req.params.entryId);
      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      const day = await storage.getPlannerDay(entry.dayId);
      if (!day) return res.status(404).json({ message: "Entry not found" });
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Entry not found" });

      const { eaterIds } = z.object({
        eaterIds: z.array(z.number().int().positive()).min(1, "At least one eater must be selected"),
      }).parse(req.body);

      // Verify all eaterIds belong to this household
      const allEaters = await storage.getHouseholdEaters(householdId);
      const validIds = new Set(allEaters.map(e => e.id));
      if (eaterIds.some(id => !validIds.has(id))) {
        return res.status(400).json({ message: "One or more eater IDs do not belong to this household" });
      }

      await storage.setPlannerEntryEaters(entryId, eaterIds);
      res.json({ success: true });
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ message: "Invalid input", errors: err.errors });
      console.error("[PlannerEntryEaters] PUT error:", err);
      res.status(500).json({ message: "Failed to set entry eaters" });
    }
  });

  // ── Entry guests (Phase 5) ────────────────────────────────────────────────────

  // Get all guest eaters for a planner entry.
  app.get("/api/planner/entries/:entryId/guests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const entryId = Number(req.params.entryId);
      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      const day = await storage.getPlannerDay(entry.dayId);
      if (!day) return res.status(404).json({ message: "Entry not found" });
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Entry not found" });

      const guests = await storage.getEntryGuests(entryId);
      res.json(guests);
    } catch (err) {
      console.error("[EntryGuests] GET error:", err);
      res.status(500).json({ message: "Failed to fetch entry guests" });
    }
  });

  // Add a guest eater to a planner entry.
  app.post("/api/planner/entries/:entryId/guests", async (req, res) => {
    console.log("[GUEST_DIAG] 1. route hit: POST /api/planner/entries/:entryId/guests");
    if (!req.isAuthenticated()) {
      console.log("[GUEST_DIAG] auth failed — 401");
      return res.sendStatus(401);
    }
    try {
      const entryId = Number(req.params.entryId);
      console.log("[GUEST_DIAG] 2. entryId =", entryId);
      console.log("[GUEST_DIAG] 3. authenticated user id =", req.user!.id);

      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) { console.log("[GUEST_DIAG] ownership: entry not found"); return res.status(404).json({ message: "Entry not found" }); }
      const day = await storage.getPlannerDay(entry.dayId);
      if (!day) { console.log("[GUEST_DIAG] ownership: day not found"); return res.status(404).json({ message: "Entry not found" }); }
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) {
        console.log("[GUEST_DIAG] ownership check FAILED — week.householdId =", week?.householdId, "user householdId =", householdId);
        return res.status(404).json({ message: "Entry not found" });
      }
      console.log("[GUEST_DIAG] 4. ownership check passed — householdId =", householdId);

      console.log("[GUEST_DIAG] 5. request payload =", JSON.stringify(req.body));
      const parsed = z.object({
        id: z.string().min(1).max(100),
        displayName: z.string().min(1).max(100),
        dietTypes: z.array(z.string()).default([]),
        hardRestrictions: z.array(z.string()).default([]),
      }).parse(req.body);
      console.log("[GUEST_DIAG] 6. payload validation passed — parsed =", JSON.stringify(parsed));

      const existing = await storage.getEntryGuests(entryId);
      console.log("[GUEST_DIAG] 7. existing guest array loaded — count =", existing.length);

      // Deduplicate by id
      const updated = [...existing.filter(g => g.id !== parsed.id), parsed];
      console.log("[GUEST_DIAG] 8. merged guest array to save — count =", updated.length);

      await storage.setEntryGuests(entryId, updated);
      console.log("[GUEST_DIAG] 9. DB save passed");
      console.log("[GUEST_DIAG] 10. returning status 201");
      res.status(201).json(parsed);
    } catch (err: any) {
      if (err?.name === "ZodError") {
        console.log("[GUEST_DIAG] 6. payload validation FAILED —", JSON.stringify(err.errors));
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("[GUEST_DIAG] 9. DB save FAILED — message:", err?.message);
      console.error("[GUEST_DIAG] stack:", err?.stack);
      console.error("[GUEST_DIAG] 10. returning status 500");
      console.error("[EntryGuests] POST error:", err);
      res.status(500).json({ message: "Failed to add guest" });
    }
  });

  // Remove a guest eater from a planner entry.
  app.delete("/api/planner/entries/:entryId/guests/:guestId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const entryId = Number(req.params.entryId);
      const guestId = req.params.guestId;
      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      const day = await storage.getPlannerDay(entry.dayId);
      if (!day) return res.status(404).json({ message: "Entry not found" });
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Entry not found" });

      const existing = await storage.getEntryGuests(entryId);
      const updated = existing.filter(g => g.id !== guestId);
      await storage.setEntryGuests(entryId, updated);
      res.json({ success: true });
    } catch (err) {
      console.error("[EntryGuests] DELETE error:", err);
      res.status(500).json({ message: "Failed to remove guest" });
    }
  });

  // ── Week eater overrides (Phase 4) ───────────────────────────────────────────

  // Get all overrides for a planner week.
  app.get("/api/planner/weeks/:weekId/eater-overrides", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const weekId = Number(req.params.weekId);
      const week = await storage.getPlannerWeek(weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Week not found" });
      const overrides = await storage.getWeekEaterOverrides(weekId);
      res.json(overrides);
    } catch (err) {
      console.error("[WeekEaterOverrides] GET error:", err);
      res.status(500).json({ message: "Failed to fetch week overrides" });
    }
  });

  // Set (upsert) a single eater's diet override for a week.
  app.put("/api/planner/weeks/:weekId/eater-overrides/:eaterId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const weekId = Number(req.params.weekId);
      const eaterId = Number(req.params.eaterId);
      const week = await storage.getPlannerWeek(weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Week not found" });

      const { dietTypes } = z.object({
        dietTypes: z.array(z.string()),
      }).parse(req.body);

      // Verify eater belongs to this household
      const allEaters = await storage.getHouseholdEaters(householdId);
      if (!allEaters.some(e => e.id === eaterId)) {
        return res.status(400).json({ message: "Eater does not belong to this household" });
      }

      await storage.setWeekEaterOverride(weekId, eaterId, dietTypes);
      res.json({ success: true });
    } catch (err: any) {
      if (err?.name === "ZodError") return res.status(400).json({ message: "Invalid input", errors: err.errors });
      console.error("[WeekEaterOverrides] PUT error:", err);
      res.status(500).json({ message: "Failed to set override" });
    }
  });

  // Remove an eater's diet override for a week (reverts to defaultDietTypes).
  app.delete("/api/planner/weeks/:weekId/eater-overrides/:eaterId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const weekId = Number(req.params.weekId);
      const eaterId = Number(req.params.eaterId);
      const week = await storage.getPlannerWeek(weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Week not found" });
      await storage.deleteWeekEaterOverride(weekId, eaterId);
      res.json({ success: true });
    } catch (err) {
      console.error("[WeekEaterOverrides] DELETE error:", err);
      res.status(500).json({ message: "Failed to remove override" });
    }
  });

  // ── Meal Adaptation (Phase 3) ─────────────────────────────────────────────────

  // Trigger AI adaptation for a planner entry.
  // Gathers meal + selected eaters + diet profiles, calls Claude, stores and returns the result.
  app.post("/api/planner/entries/:entryId/adapt", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    console.log("[ADAPT_DIAG] 1. route hit");
    try {
      const entryId = Number(req.params.entryId);
      if (isNaN(entryId)) return res.status(400).json({ message: "Invalid entry ID" });
      console.log("[ADAPT_DIAG] 2. entryId =", entryId);
      console.log("[ADAPT_DIAG] 3. authenticated user id =", req.user!.id);

      // Ownership check
      const entry = await storage.getPlannerEntryById(entryId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      const day = await storage.getPlannerDay(entry.dayId);
      if (!day) return res.status(404).json({ message: "Entry not found" });
      const week = await storage.getPlannerWeek(day.weekId);
      const householdId = await getHouseholdForUser(req.user!.id);
      if (!week || week.householdId !== householdId) return res.status(404).json({ message: "Entry not found" });
      console.log("[ADAPT_DIAG] 4. ownership check passed — householdId =", householdId);

      // Gather meal
      const meal = await storage.getMeal(entry.mealId);
      if (!meal) return res.status(404).json({ message: "Meal not found" });
      console.log("[ADAPT_DIAG] 5. resolved planner entry — mealId =", entry.mealId, "meal =", meal.name);

      // Gather eaters (Phase 2 logic — fall back to adults if none explicitly set)
      const { dbEaterToHouseholdEater, getEffectiveDietProfile, guestEaterToProfile } = await import("@shared/household-eater.js");
      let eaterRows = await storage.getPlannerEntryEaters(entryId);
      if (eaterRows.length === 0) {
        const allEaters = await storage.getHouseholdEaters(householdId);
        eaterRows = allEaters.filter(e => e.userId != null);
      }

      // Phase 5: also gather guest eaters for this entry
      const guestEaters = await storage.getEntryGuests(entryId);

      if (eaterRows.length === 0 && guestEaters.length === 0) {
        console.log("[ADAPT_DIAG] 6. no eaters found — returning 400");
        return res.status(400).json({ message: "No eaters found for this entry" });
      }
      console.log("[ADAPT_DIAG] 6. resolved eater ids =", eaterRows.map(e => e.id), "names =", eaterRows.map(e => e.displayName), "guests =", guestEaters.map(g => g.displayName));

      const eaters = eaterRows.map(dbEaterToHouseholdEater);

      // Phase 4: apply any weekly overrides before building profiles
      const weekOverrides = await storage.getWeekEaterOverrides(week.id);
      const overrideMap = new Map(weekOverrides.map(o => [o.eaterId, { dietTypes: o.dietTypes }]));

      const householdProfiles = eaters.map(e => ({
        displayName: e.displayName,
        ...getEffectiveDietProfile(e, overrideMap.get(Number(e.id))),
      }));

      // Phase 5: map guest eaters into the same profile shape — no overrides apply to guests
      const guestProfiles = guestEaters.map(g => ({
        displayName: g.displayName,
        ...guestEaterToProfile(g),
      }));

      const profiles = [...householdProfiles, ...guestProfiles];
      console.log("[ADAPT_DIAG] 7. built effective diet profiles =", JSON.stringify(profiles));

      // Build prompt
      const ingredientList = (meal.ingredients ?? []).length > 0
        ? (meal.ingredients ?? []).map(i => `  - ${i}`).join("\n")
        : "  (no ingredients listed)";

      const eatersSection = profiles.map(p => {
        const diets = p.dietTypes.length > 0 ? p.dietTypes.join(", ") : "none";
        const restrictions = p.hardRestrictions.length > 0 ? p.hardRestrictions.join(", ") : "none";
        return `  - ${p.displayName}: diet pattern=${diets}, allergies & intolerances=${restrictions}`;
      }).join("\n");

      const userMessage =
        `Meal: ${meal.name}\n\nIngredients:\n${ingredientList}\n\nEaters:\n${eatersSection}`;

      // Call OpenAI (reuses the same integration as recipe import)
      console.log("[ADAPT_DIAG] 8. about to call AI — OPENAI_API_KEY present =", !!process.env.OPENAI_API_KEY);
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const SYSTEM_PROMPT = `You are a household meal adaptation assistant. Suggest small, practical plate-level adjustments to a shared meal so it works for every eater listed.

CORE RULES:
- One shared meal — never generate separate meals or rewrite the recipe
- Adaptations must happen at plating, serving, or the final cooking stage only
- Minimise extra prep and cooking effort
- Hard restrictions (allergies, intolerances, religious/medical) must NEVER be violated
- If the base meal is unsafe for an eater, state this clearly in their note — never ignore it

ADAPTATION TYPES:
- none: eater needs no changes
- swap: replace one ingredient with another at serving (e.g. swap tuna for butter beans)
- add_on: add something extra on this eater's plate only (e.g. extra grilled chicken on the side)
- omission: leave out an ingredient for this eater's plate

Return a JSON object with exactly these keys:
- baseMealNote: string
- adaptations: array of { eaterName, changeType ("none"|"swap"|"add_on"|"omission"), note, extraIngredients (string array) }
- householdExtraIngredients: string array (deduplicated extras shared across eaters)
- cookingNote: string

Keep notes short and concrete. Never duplicate ingredients across eaters and householdExtraIngredients.`;

      let rawText: string;
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        });
        rawText = completion.choices[0]?.message?.content?.trim() ?? "";
        console.log("[ADAPT_DIAG] 9. AI call succeeded — finish_reason =", completion.choices[0]?.finish_reason);
      } catch (aiErr: any) {
        console.error("[ADAPT_DIAG] 9. AI call FAILED — status =", aiErr?.status, "error =", aiErr?.message, "full =", aiErr);
        throw aiErr;
      }

      console.log("[ADAPT_DIAG] 10. AI raw response (first 500 chars) =", rawText.slice(0, 500));

      let adaptationResult: import("@shared/meal-adaptation").AdaptationResult;
      try {
        adaptationResult = JSON.parse(rawText);
        console.log("[ADAPT_DIAG] 11. JSON parse passed");
      } catch (parseErr: any) {
        console.error("[ADAPT_DIAG] 11. JSON parse FAILED —", parseErr?.message, "| raw =", rawText.slice(0, 200));
        return res.status(502).json({ message: "AI returned invalid JSON — please try again" });
      }

      // Basic shape validation
      if (
        typeof adaptationResult.baseMealNote !== "string" ||
        !Array.isArray(adaptationResult.adaptations) ||
        !Array.isArray(adaptationResult.householdExtraIngredients) ||
        typeof adaptationResult.cookingNote !== "string"
      ) {
        console.error("[ADAPT_DIAG] 11. shape validation FAILED — keys =", Object.keys(adaptationResult));
        return res.status(502).json({ message: "AI returned unexpected shape — please try again" });
      }

      // Persist and return
      try {
        await storage.savePlannerEntryAdaptation(entryId, adaptationResult);
        console.log("[ADAPT_DIAG] 12. DB save passed");
      } catch (dbErr: any) {
        console.error("[ADAPT_DIAG] 12. DB save FAILED —", dbErr?.message, dbErr);
        throw dbErr;
      }

      console.log("[ADAPT_DIAG] 13. returning 200");
      res.json(adaptationResult);

    } catch (err: any) {
      console.error("[ADAPT_DIAG] caught error — message =", err?.message, "| status =", err?.status, "| stack =", err?.stack);
      res.status(500).json({ message: "Failed to generate adaptation — please try again" });
    }
  });

  // ── My Diary ─────────────────────────────────────────────────────────────────

  app.get("/api/food-diary/:date", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Invalid date format" });
    const day = await storage.getFoodDiaryDay(req.user!.id, date);
    const entries = await storage.getFoodDiaryEntries(req.user!.id, date);
    const metrics = await storage.getFoodDiaryMetrics(req.user!.id, date);
    res.json({ day, entries, metrics });
  });

  app.post("/api/food-diary/:date/copy-from-planner", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Invalid date format" });
    const { slots } = z.object({
      slots: z.array(z.string()).optional(),
    }).parse(req.body);
    try {
      const result = await storage.copyPlannerToFoodDiary(req.user!.id, date, slots);
      res.json(result);
    } catch (err) {
      console.error("[Diary] copy-from-planner error:", err);
      res.status(500).json({ message: "Failed to copy from planner" });
    }
  });

  app.post("/api/food-diary/:date/log-meal", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Invalid date format" });
    const { mealId, mealSlot } = z.object({
      mealId: z.number().int(),
      mealSlot: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'drink']),
    }).parse(req.body);
    const meal = await storage.getMeal(mealId);
    if (!meal || (meal.userId !== req.user!.id && !meal.isSystemMeal)) {
      return res.status(404).json({ message: "Meal not found" });
    }
    const result = await storage.logMealToDiary(req.user!.id, date, mealId, mealSlot);
    // Savings: one takeaway_avoided per meal log action (deduped by mealId+date via unique index)
    storage.createSavingsEvent(req.user!.id, {
      userId: req.user!.id,
      date,
      type: 'takeaway_avoided',
      amount: SAVINGS_RATES.takeaway_avoided,
      sourceId: mealId,
      sourceType: 'meal_log',
      note: null,
    }).catch(() => {});
    res.status(201).json(result);
  });

  app.post("/api/food-diary/:date/entries", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Invalid date format" });
    const { name, mealSlot, notes } = z.object({
      name: z.string().min(1),
      mealSlot: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'drink']),
      notes: z.string().optional(),
    }).parse(req.body);
    const entry = await storage.createFoodDiaryEntry(req.user!.id, date, {
      dayId: 0,
      userId: req.user!.id,
      name,
      mealSlot,
      notes: notes ?? null,
      sourceType: 'manual',
      sourcePlannerEntryId: null,
    });
    // Track usage for recent/frequent (Epic 3)
    storage.recordItemUsage(req.user!.id, 'manual', name).catch(() => {});
    // Savings: one takeaway_avoided event per logged entry (fire-and-forget)
    storage.createSavingsEvent(req.user!.id, {
      userId: req.user!.id,
      date,
      type: 'takeaway_avoided',
      amount: SAVINGS_RATES.takeaway_avoided,
      sourceId: entry.id,
      sourceType: 'diary_entry',
      note: null,
    }).catch(() => {});
    res.status(201).json(entry);
  });

  app.patch("/api/food-diary/entries/:entryId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const entryId = Number(req.params.entryId);
    if (isNaN(entryId)) return res.status(400).json({ message: "Invalid entry ID" });
    const data = z.object({
      name: z.string().min(1).optional(),
      notes: z.string().nullable().optional(),
      mealSlot: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'drink']).optional(),
    }).parse(req.body);
    const updated = await storage.updateFoodDiaryEntry(entryId, req.user!.id, data);
    if (!updated) return res.status(404).json({ message: "Entry not found" });
    res.json(updated);
  });

  app.delete("/api/food-diary/entries/:entryId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const entryId = Number(req.params.entryId);
    if (isNaN(entryId)) return res.status(400).json({ message: "Invalid entry ID" });
    await storage.deleteFoodDiaryEntry(entryId, req.user!.id);
    res.sendStatus(204);
  });

  app.patch("/api/food-diary/:date/metrics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: "Invalid date format" });
    const data = z.object({
      weightKg: z.number().positive().nullable().optional(),
      moodApples: z.number().int().min(1).max(5).nullable().optional(),
      sleepHours: z.number().min(0).max(24).nullable().optional(),
      energyApples: z.number().int().min(1).max(5).nullable().optional(),
      notes: z.string().nullable().optional(),
      stuckToPlan: z.boolean().nullable().optional(),
      customValues: z.record(z.string()).nullable().optional(),
    }).parse(req.body);
    const userId = req.user!.id;
    const prefs = await storage.getUserPreferences(userId);
    let bmi: number | null = null;
    if (data.weightKg && prefs?.heightCm) {
      const heightM = prefs.heightCm / 100;
      bmi = Math.round((data.weightKg / (heightM * heightM)) * 10) / 10;
    }
    const metrics = await storage.upsertFoodDiaryMetrics(userId, date, { ...data, bmi });
    res.json(metrics);
  });

  app.get("/api/food-diary/metrics/trends", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const days = req.query.days ? Number(req.query.days) : 90;
    const trends = await storage.getFoodDiaryMetricsTrends(req.user!.id, days);
    res.json(trends);
  });

  app.get("/api/savings/aggregates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const aggregates = await storage.getSavingsAggregates(req.user!.id);
      res.json(aggregates);
    } catch (err) {
      console.error("[Savings] Failed to fetch aggregates:", err);
      res.status(500).json({ message: "Failed to fetch savings aggregates" });
    }
  });

  app.post("/api/food-diary/import/preview", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const rowSchema = z.object({
      date: z.string(),
      weightKg: z.number().optional(),
      sleepHours: z.number().optional(),
      moodApples: z.number().optional(),
      energyApples: z.number().optional(),
      notes: z.string().optional(),
      stuckToPlan: z.boolean().optional(),
      calories: z.number().optional(),
      mealSlot: z.string().optional(),
      entryName: z.string().optional(),
    });
    const bodySchema = z.object({ rows: z.array(z.record(z.unknown())) });
    const { rows } = bodySchema.parse(req.body);
    const validRows: object[] = [];
    const invalidRows: { row: object; errors: string[] }[] = [];
    for (const raw of rows) {
      const errors: string[] = [];
      const r = raw as Record<string, unknown>;
      if (!r.date || typeof r.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
        errors.push("date is required and must be YYYY-MM-DD");
      }
      if (r.moodApples !== undefined) {
        const v = Number(r.moodApples);
        if (isNaN(v) || v < 1 || v > 5) errors.push("moodApples must be 1–5");
      }
      if (r.energyApples !== undefined) {
        const v = Number(r.energyApples);
        if (isNaN(v) || v < 1 || v > 5) errors.push("energyApples must be 1–5");
      }
      if (r.weightKg !== undefined && isNaN(Number(r.weightKg))) errors.push("weightKg must be numeric");
      if (r.sleepHours !== undefined && isNaN(Number(r.sleepHours))) errors.push("sleepHours must be numeric");
      if (r.calories !== undefined && isNaN(Number(r.calories))) errors.push("calories must be numeric");
      if (errors.length > 0) {
        invalidRows.push({ row: raw as object, errors });
      } else {
        const parsed = rowSchema.safeParse({
          ...r,
          weightKg: r.weightKg !== undefined ? Number(r.weightKg) : undefined,
          sleepHours: r.sleepHours !== undefined ? Number(r.sleepHours) : undefined,
          moodApples: r.moodApples !== undefined ? Number(r.moodApples) : undefined,
          energyApples: r.energyApples !== undefined ? Number(r.energyApples) : undefined,
          calories: r.calories !== undefined ? Number(r.calories) : undefined,
        });
        validRows.push(parsed.success ? parsed.data : (raw as object));
      }
    }
    res.json({ validRows, invalidRows });
  });

  app.post("/api/food-diary/import/confirm", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const bodySchema = z.object({
      rows: z.array(z.record(z.unknown())),
      strategy: z.enum(["skip", "overwrite", "merge"]).default("skip"),
    });
    const { rows, strategy } = bodySchema.parse(req.body);
    const userId = req.user!.id;
    const metricRows: Array<Partial<{ weightKg: number; sleepHours: number; moodApples: number; energyApples: number; notes: string; stuckToPlan: boolean }> & { date: string }> = [];
    const entryRows: Array<{ date: string; mealSlot: string; name: string; notes?: string | null }> = [];
    for (const raw of rows) {
      const r = raw as Record<string, unknown>;
      const date = String(r.date);
      const hasMetricData = r.weightKg !== undefined || r.sleepHours !== undefined || r.moodApples !== undefined || r.energyApples !== undefined || r.notes !== undefined || r.stuckToPlan !== undefined;
      const hasEntryData = r.mealSlot !== undefined && r.entryName !== undefined;
      if (hasMetricData) {
        const row: typeof metricRows[number] = { date };
        if (r.weightKg !== undefined) row.weightKg = Number(r.weightKg);
        if (r.sleepHours !== undefined) row.sleepHours = Number(r.sleepHours);
        if (r.moodApples !== undefined) row.moodApples = Number(r.moodApples);
        if (r.energyApples !== undefined) row.energyApples = Number(r.energyApples);
        if (r.notes !== undefined) row.notes = String(r.notes);
        if (r.stuckToPlan !== undefined) row.stuckToPlan = Boolean(r.stuckToPlan);
        metricRows.push(row);
      }
      if (hasEntryData) {
        entryRows.push({
          date,
          mealSlot: String(r.mealSlot),
          name: String(r.entryName),
          notes: r.notes !== undefined ? String(r.notes) : null,
        });
      }
    }
    try {
      const metricsResult = metricRows.length > 0
        ? await storage.bulkUpsertFoodDiaryMetrics(userId, metricRows, strategy)
        : { imported: 0, skipped: 0, failed: 0 };
      const entriesResult = entryRows.length > 0
        ? await storage.bulkCreateFoodDiaryEntries(userId, entryRows, strategy)
        : { imported: 0, skipped: 0, failed: 0 };
      res.json({
        imported: metricsResult.imported + entriesResult.imported,
        skipped: metricsResult.skipped + entriesResult.skipped,
        failed: metricsResult.failed + entriesResult.failed,
      });
    } catch (err) {
      console.error("[DiaryImport] confirm error:", err);
      res.status(500).json({ message: "Import failed" });
    }
  });

  // ── Food Knowledge (Encyclopedia) ──────────────────────────────────────────
  app.get("/api/food-knowledge", async (req, res) => {
    try {
      const entries = await storage.getFoodKnowledgeAll();
      res.json(entries);
    } catch (err) {
      console.error("[FoodKnowledge] list error:", err);
      res.status(500).json({ message: "Failed to fetch food knowledge" });
    }
  });

  app.get("/api/food-knowledge/search", async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    if (!q) return res.json([]);
    try {
      const results = await storage.searchFoodKnowledge(q);
      res.json(results);
    } catch (err) {
      console.error("[FoodKnowledge] search error:", err);
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/food-knowledge/:slug", async (req, res) => {
    try {
      const entry = await storage.getFoodKnowledgeBySlug(req.params.slug);
      if (!entry) return res.status(404).json({ message: "Not found" });

      // Enrich with USDA nutrient snapshot for whole foods (best-effort, non-blocking)
      let nutrientSnapshot = null;
      if (entry.type === "food" || entry.type === "ingredient") {
        const { getWholeFoodSnapshot } = await import("./lib/usda-whole-food-service");
        nutrientSnapshot = await getWholeFoodSnapshot(entry.slug);
      }

      res.json({ ...entry, nutrientSnapshot });
    } catch (err) {
      console.error("[FoodKnowledge] slug error:", err);
      res.status(500).json({ message: "Failed to fetch entry" });
    }
  });

  // ── Meal Items (Epic 1) ───────────────────────────────────────────────────

  app.get("/api/meals/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mealId = Number(req.params.id);
    if (isNaN(mealId)) return res.status(400).json({ message: "Invalid meal ID" });
    const meal = await storage.getMeal(mealId);
    if (!meal || (meal.userId !== req.user!.id && !meal.isSystemMeal)) {
      return res.status(404).json({ message: "Meal not found" });
    }
    res.json(await storage.getMealItems(mealId));
  });

  app.post("/api/meals/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const mealId = Number(req.params.id);
    if (isNaN(mealId)) return res.status(400).json({ message: "Invalid meal ID" });
    const meal = await storage.getMeal(mealId);
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }
    const { type, referenceId, name, quantity } = z.object({
      type: z.enum(['recipe', 'product', 'manual']),
      referenceId: z.number().int().nullable().optional(),
      name: z.string().min(1),
      quantity: z.string().optional(),
    }).parse(req.body);
    const item = await storage.addMealItem({ mealId, type, referenceId: referenceId ?? null, name, quantity: quantity ?? null });
    // Track usage (Epic 3)
    storage.recordItemUsage(req.user!.id, type, name, referenceId ?? null).catch(() => {});
    res.status(201).json(item);
  });

  app.delete("/api/meal-items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const itemId = Number(req.params.id);
    const { mealId } = z.object({ mealId: z.number().int() }).parse(req.body);
    if (isNaN(itemId)) return res.status(400).json({ message: "Invalid item ID" });
    const meal = await storage.getMeal(mealId);
    if (!meal || meal.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal not found" });
    }
    await storage.deleteMealItem(itemId, mealId);
    res.sendStatus(204);
  });

  // ── Recent + Frequent Items (Epic 3) ─────────────────────────────────────

  app.get("/api/user-items/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(await storage.getRecentItems(req.user!.id));
  });

  app.get("/api/user-items/frequent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(await storage.getFrequentItems(req.user!.id));
  });

  // ── Ingredient-based recipe suggestions ───────────────────────────────────

  app.post("/api/suggest-from-ingredients", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ingredients } = z.object({ ingredients: z.string().min(1).max(2000) }).parse(req.body);
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ message: "AI not configured" });
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const systemPrompt = `You are a recipe suggestion assistant. Given a list of ingredients the user has, return exactly 3 meal ideas they could make. Prioritise using all provided ingredients, minimise extra ingredients needed beyond what was listed.

Return ONLY a valid JSON object with this exact shape:
{
  "suggestions": [
    {
      "title": "Recipe Name",
      "description": "One sentence describing the dish",
      "extraIngredients": ["extra1", "extra2"],
      "effort": "easy"
    }
  ]
}

Rules:
- "effort" must be exactly one of: "easy", "medium", "involved"
- "extraIngredients" is an array of key additional ingredients not in the user's list (empty array if none needed)
- Return exactly 3 suggestions, no duplicates
- No markdown, no explanation, no extra keys`;
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Ingredients I have: ${ingredients}` },
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
      const parsed = JSON.parse(raw);
      const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
      res.json({ suggestions });
    } catch (err) {
      console.error("[suggest-from-ingredients]", err);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  app.post("/api/generate-recipe-from-suggestion", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { ingredients, title, description } = z.object({
      ingredients: z.string().min(1).max(2000),
      title: z.string().min(1).max(200),
      description: z.string().max(500).optional(),
    }).parse(req.body);
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ message: "AI not configured" });
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const systemPrompt = `You are a recipe generation assistant. Generate a complete, practical recipe card. Return ONLY a valid JSON object with this exact shape:
{
  "title": "Recipe Name",
  "ingredients": ["200g pasta", "2 cloves garlic, minced"],
  "instructions": ["First step.", "Second step."],
  "servings": 2
}

Rules:
- "ingredients": array of strings, each with quantity and ingredient name
- "instructions": array of strings, each a complete step (do not number them, no leading numbers or bullets)
- "servings": positive integer
- Use the provided base ingredients as the foundation, add only necessary extras
- Keep it practical and home-cook friendly
- No markdown, no extra keys`;
      const userMsg = `Recipe: "${title}"${description ? ` — ${description}` : ''}
Base ingredients the user has: ${ingredients}
Generate a complete recipe using these as the foundation.`;
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? '{}';
      const parsed = JSON.parse(raw);
      res.json({
        title: typeof parsed.title === 'string' ? parsed.title : title,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
        servings: typeof parsed.servings === 'number' && parsed.servings > 0 ? parsed.servings : 2,
        confidence: 'full',
      });
    } catch (err) {
      console.error("[generate-recipe-from-suggestion]", err);
      res.status(500).json({ message: "Failed to generate recipe" });
    }
  });

  // ── Ingredient Classifications — Admin Review System ──────────────────────
  //
  // GET  /api/admin/ingredient-classifications         list (filterable by status)
  // PATCH /api/admin/ingredient-classifications/:id    edit fields
  // POST  /api/admin/ingredient-classifications/:id/approve
  // POST  /api/admin/ingredient-classifications/:id/reject
  // POST  /api/admin/backfill-classifications          run backfill

  const { db: adminDb } = await import('./db');
  const { ingredientClassifications } = await import('@shared/schema');
  const { eq: adminEq, desc: adminDesc } = await import('drizzle-orm');

  app.get('/api/admin/ingredient-classifications', assertAdmin, async (req, res) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const limit  = Math.min(Number(req.query.limit) || 100, 500);
      const offset = Number(req.query.offset) || 0;

      const rows = status
        ? await adminDb.select().from(ingredientClassifications)
            .where(adminEq(ingredientClassifications.reviewStatus, status))
            .orderBy(adminDesc(ingredientClassifications.createdAt))
            .limit(limit).offset(offset)
        : await adminDb.select().from(ingredientClassifications)
            .orderBy(adminDesc(ingredientClassifications.createdAt))
            .limit(limit).offset(offset);

      res.json({ items: rows, count: rows.length, offset, limit });
    } catch (err) {
      console.error('[Admin/Classifications] GET error:', err);
      res.status(500).json({ message: 'Failed to fetch classifications' });
    }
  });

  app.patch('/api/admin/ingredient-classifications/:id', assertAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

      const allowed = ['canonicalName', 'canonicalKey', 'category', 'subcategory', 'aliases', 'source', 'reviewStatus', 'notes'] as const;
      const fields: Record<string, unknown> = {};
      for (const k of allowed) {
        if (req.body[k] !== undefined) fields[k] = req.body[k];
      }
      if (Object.keys(fields).length === 0) return res.status(400).json({ message: 'No valid fields' });

      const updated = await updateClassification(id, fields as Parameters<typeof updateClassification>[1]);
      if (!updated) return res.status(404).json({ message: 'Not found' });

      res.json(updated);
    } catch (err) {
      console.error('[Admin/Classifications] PATCH error:', err);
      res.status(500).json({ message: 'Failed to update classification' });
    }
  });

  app.post('/api/admin/ingredient-classifications/:id/approve', assertAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

      const updated = await updateClassification(id, { reviewStatus: 'approved' });
      if (!updated) return res.status(404).json({ message: 'Not found' });

      // Apply to all matching unresolved items
      const count = await applyClassificationToItems(updated.normalizedKey, updated);
      res.json({ classification: updated, itemsUpdated: count });
    } catch (err) {
      console.error('[Admin/Classifications] approve error:', err);
      res.status(500).json({ message: 'Failed to approve' });
    }
  });

  app.post('/api/admin/ingredient-classifications/:id/reject', assertAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid id' });

      const updated = await updateClassification(id, { reviewStatus: 'rejected' });
      if (!updated) return res.status(404).json({ message: 'Not found' });
      // Rejected classification is excluded from future resolution lookups.
      // Existing items already resolved by this classification are left as-is;
      // admins can correct individual items manually if needed.
      res.json({ classification: updated });
    } catch (err) {
      console.error('[Admin/Classifications] reject error:', err);
      res.status(500).json({ message: 'Failed to reject' });
    }
  });

  app.post('/api/admin/backfill-classifications', (req, res, next) => next(), async (req, res) => {
    try {
      const batchSize = Math.min(Number(req.body.batchSize) || 50, 200);
      const dryRun    = req.body.dryRun === true;

      const triggerUserId = req.user?.id ?? 0;
      console.log(`[Admin] Backfill triggered — batchSize=${batchSize} dryRun=${dryRun} by userId=${triggerUserId}`);
      const result = await runBackfill({ batchSize, dryRun });
      res.json(result);
    } catch (err) {
      console.error('[Admin/Classifications] backfill error:', err);
      res.status(500).json({ message: 'Backfill failed', error: err instanceof Error ? err.message : String(err) });
    }
  });

  // POST /api/admin/normalise-categories
  // Re-evaluates ALL shopping_list items using the current canonical resolver
  // and corrects any category that no longer matches.  Safe to run repeatedly.
  app.post('/api/admin/normalise-categories', (req, res, next) => next(), async (req, res) => {
    try {
      const dryRun = req.body.dryRun === true;
      const triggerUserId = req.user?.id ?? 0;
      console.log(`[Admin] Category normalisation triggered — dryRun=${dryRun} by userId=${triggerUserId}`);
      const result = await runCategoryNormalisation({ dryRun });
      res.json(result);
    } catch (err) {
      console.error('[Admin/Normalise] error:', err);
      res.status(500).json({ message: 'Normalisation failed', error: err instanceof Error ? err.message : String(err) });
    }
  });

  return httpServer;
}
