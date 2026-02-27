import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
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
import { analyzeProductUPF } from "./lib/upf-analysis-service";
import { createBasket, getBasketSupermarkets } from "./lib/supermarket-basket-service";
import { generateSmartSuggestion, type SmartSuggestSettings, type LockedEntry } from "./lib/smart-suggest-service";
import { searchAllRecipes, searchJamieOliver, searchSeriousEats, type ExternalMealCandidate } from "./lib/external-meal-service";
import { shouldExcludeRecipe, scoreRecipeForDiet } from "./lib/dietRules";
import { insertMealTemplateSchema, insertMealTemplateProductSchema, insertFreezerMealSchema, updateMealSchema } from "@shared/schema";
import { importGlobalMeals, getImportStatus } from "./lib/openfoodfacts-importer";
import { sanitizeUser } from "./lib/sanitizeUser";

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

async function autoAnalyzeMeal(mealId: number) {
  try {
    const meal = await storage.getMeal(mealId);
    if (!meal) return;

    if (meal.sourceUrl) {
      const scraped = await scrapeNutritionFromSource(meal);
      if (scraped) return;
    }

    const existingNutrition = await storage.getNutrition(mealId);
    const hasValidNutrition = existingNutrition && existingNutrition.calories && parseFloat(existingNutrition.calories) > 0;
    if (hasValidNutrition) return;

    const nutritionTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0 };
    let validResults = 0;

    await Promise.all(
      meal.ingredients.map(async (ingredient) => {
        try {
          const cleanIngredient = cleanIngredientForLookup(ingredient);
          const response = await axios.get(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanIngredient)}&json=1&page_size=3`,
            { timeout: 8000, headers: { 'User-Agent': 'SmartMealPlanner/1.0' } }
          );

          const products = response.data.products || [];
          if (products.length === 0) return;

          let count = 0;
          let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0 };

          for (const p of products) {
            const n = p.nutriments;
            if (!n) continue;
            const cal = n['energy-kcal_100g'] || n['energy-kcal'];
            if (cal) {
              totals.calories += Number(cal) || 0;
              totals.protein += Number(n.proteins_100g || n.proteins) || 0;
              totals.carbs += Number(n.carbohydrates_100g || n.carbohydrates) || 0;
              totals.fat += Number(n.fat_100g || n.fat) || 0;
              totals.sugar += Number(n.sugars_100g || n.sugars) || 0;
              totals.salt += Number(n.salt_100g || n.salt) || 0;
              count++;
            }
          }

          if (count > 0) {
            nutritionTotals.calories += totals.calories / count;
            nutritionTotals.protein += totals.protein / count;
            nutritionTotals.carbs += totals.carbs / count;
            nutritionTotals.fat += totals.fat / count;
            nutritionTotals.sugar += totals.sugar / count;
            nutritionTotals.salt += totals.salt / count;
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
        source: 'openfoodfacts',
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
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

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
      displayName: user.displayName || user.username,
      profilePhotoUrl: user.profilePhotoUrl,
      measurementPreference: user.measurementPreference,
      isBetaUser: user.isBetaUser,
      dietPattern: user.dietPattern ?? null,
      dietRestrictions: user.dietRestrictions ?? [],
      eatingSchedule: user.eatingSchedule ?? null,
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
    displayName: z.string().optional(),
    profilePhotoUrl: z.string().nullable().optional(),
    dietPattern: z.enum(ALLOWED_DIET_PATTERNS).nullable().optional(),
    dietRestrictions: z.array(z.enum(ALLOWED_DIET_RESTRICTIONS)).optional(),
    eatingSchedule: z.enum(ALLOWED_EATING_SCHEDULES).nullable().optional(),
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
    }).optional(),
  });

  app.put('/api/profile', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const parsed = profileUpdateSchema.parse(req.body);

      const profileFields: Partial<Parameters<typeof storage.updateUserProfile>[1]> = {};
      if (parsed.displayName !== undefined) profileFields.displayName = parsed.displayName;
      if (parsed.profilePhotoUrl !== undefined) profileFields.profilePhotoUrl = parsed.profilePhotoUrl;
      if (parsed.dietPattern !== undefined) profileFields.dietPattern = parsed.dietPattern;
      if (parsed.dietRestrictions !== undefined) profileFields.dietRestrictions = parsed.dietRestrictions;
      if (parsed.eatingSchedule !== undefined) profileFields.eatingSchedule = parsed.eatingSchedule;
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
    const [userMeals, systemMeals] = await Promise.all([
      storage.getMeals(req.user!.id),
      storage.getSystemMeals(),
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

    const updateData: Partial<{ name: string; ingredients: string[]; instructions: string[]; servings: number }> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.ingredients !== undefined) updateData.ingredients = parsed.data.ingredients;
    if (parsed.data.instructions !== undefined && parsed.data.instructions !== null) updateData.instructions = parsed.data.instructions;
    if (parsed.data.servings !== undefined) updateData.servings = parsed.data.servings;

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
    const hasOFEstimateButSourceAvailable = n && n.calories && meal.sourceUrl && (!n.source || n.source === 'openfoodfacts');
    
    if (hasNoNutrition || hasOFEstimateButSourceAvailable) {
      (async () => {
        try {
          if (meal.sourceUrl && hasOFEstimateButSourceAvailable) {
            await scrapeNutritionFromSource(meal);
          }
          if (!n || !n.calories) {
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
      const perPage = 12;

      if (!q) {
        return res.json({ products: [], hasMore: false });
      }

      const offFields = 'code,product_name,brands,image_url,image_front_url,image_front_small_url,nutriments,nutriscore_grade,nova_group,categories_tags,ingredients_text,quantity,serving_size,categories';
      const offHeaders = { timeout: 20000, headers: { 'User-Agent': 'SmartMealPlanner/1.0 (contact: smartmealplanner@replit.app)' } };

      const ukParams = new URLSearchParams({
        search_terms: q,
        json: '1',
        page: String(page),
        page_size: String(perPage + 1),
        tagtype_0: 'countries',
        tag_contains_0: 'contains',
        tag_0: 'united-kingdom',
        fields: offFields,
      });

      const globalParams = new URLSearchParams({
        search_terms: q,
        json: '1',
        page: String(page),
        page_size: String(perPage + 1),
        fields: offFields,
      });

      const ukUrl = `https://world.openfoodfacts.org/cgi/search.pl?${ukParams.toString()}`;
      const globalUrl = `https://world.openfoodfacts.org/cgi/search.pl?${globalParams.toString()}`;

      const [ukResult, globalResult] = await Promise.allSettled([
        axios.get(ukUrl, offHeaders),
        axios.get(globalUrl, offHeaders),
      ]);

      const ukProducts: any[] = ukResult.status === 'fulfilled' ? (ukResult.value.data.products || []) : [];
      const globalProducts: any[] = globalResult.status === 'fulfilled' ? (globalResult.value.data.products || []) : [];

      const seen = new Set<string>();
      const merged: any[] = [];
      for (const p of [...ukProducts, ...globalProducts]) {
        const key = p.code || p.product_name;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(p);
      }

      const hasMore = merged.length > perPage;
      const products = hasMore ? merged.slice(0, perPage) : merged;

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

          const ingredientsText = p.ingredients_text || '';
          const categoriesTags = p.categories_tags || [];
          const novaGroup = p.nova_group || null;

          const upfResult = (ingredientsText || novaGroup)
            ? analyzeProductUPF(
                ingredientsText,
                additiveDb,
                50,
                { productName: p.product_name, categoriesTags, novaGroup: novaGroup ? Number(novaGroup) : null },
              )
            : null;

          const smpRating = upfResult?.smpRating ?? 3;
          const smpScore = upfResult?.smpScore ?? 55;

          return {
            barcode: p.code || null,
            product_name: p.product_name,
            brand: p.brands || null,
            image_url: p.image_front_url || p.image_front_small_url || p.image_url || null,
            ingredients_text: ingredientsText || null,
            nutriments: nutrition,
            nutriscore_grade: p.nutriscore_grade || null,
            nova_group: novaGroup ? Number(novaGroup) : null,
            categories_tags: categoriesTags,
            isUK: ukProducts.some((up: any) => (up.code || up.product_name) === (p.code || p.product_name)),
            nutriments_raw: p.nutriments || null,
            analysis: ingredientsText ? {
              ingredients: ingredientsText.split(',').map((ing: string) => {
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
              healthScore: Math.max(0, 100 - (smpScore > 50 ? 100 - smpScore : smpScore)),
              isUltraProcessed: novaGroup === 4 || smpRating <= 2,
              warnings: [],
              upfCount: upfResult?.upfIngredientCount || 0,
              totalIngredients: ingredientsText.split(',').length,
            } : null,
            upfAnalysis: upfResult ? {
              upfScore: upfResult.upfScore,
              smpRating: upfResult.smpRating,
              hasCape: upfResult.hasCape,
              smpScore: upfResult.smpScore,
              additiveMatches: upfResult.additiveMatches || [],
              processingIndicators: upfResult.processingIndicators || [],
              ingredientCount: upfResult.ingredientCount || 0,
              upfIngredientCount: upfResult.upfIngredientCount || 0,
              riskBreakdown: upfResult.riskBreakdown || { additiveRisk: 0, processingRisk: 0, ingredientComplexityRisk: 0 },
              smpPenalties: upfResult.smpPenalties,
              smpBonuses: upfResult.smpBonuses,
            } : null,
            quantity: p.quantity || null,
            servingSize: p.serving_size || null,
            categories: p.categories || null,
          };
        });

      res.json({ products: results, hasMore });
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
      const dietPattern = (req.query.dietPattern as string || '').trim() || null;
      const dietRestrictionsRaw = (req.query.dietRestrictions as string || '').trim();
      const dietRestrictions = dietRestrictionsRaw
        ? dietRestrictionsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const perPage = 9;

      if (!q) {
        return res.json({ recipes: [], hasMore: false });
      }

      const keywords = q.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
      const lowerKeywords = keywords.map(k => k.toLowerCase());

      const [mealDbResults, bbcResults, extraSiteResults] = await Promise.all([
        (async () => {
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
                  } catch {
                    return [] as any[];
                  }
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
              return Array.from(mealMap.values())
                .sort((a, b) => b.score - a.score)
                .map(e => e.meal);
            } else {
              const response = await axios.get(
                `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,
                { timeout: 10000 }
              );
              return response.data.meals || [];
            }
          } catch {
            return [];
          }
        })(),
        searchBBCGoodFood(q),
        (async () => {
          const filters = { query: q };
          const [ar, jo, se] = await Promise.all([
            searchAllRecipes(filters),
            searchJamieOliver(filters),
            searchSeriousEats(filters),
          ]);
          return [...ar, ...jo, ...se].map(candidateToRecipe);
        })(),
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

      const allRecipesResults = extraSiteResults.filter(r => r.source === 'AllRecipes');
      const jamieOliverResults = extraSiteResults.filter(r => r.source === 'Jamie Oliver');
      const seriousEatsResults = extraSiteResults.filter(r => r.source === 'Serious Eats');

      const sources = [
        dedup(mealDbMapped),
        dedup(bbcResults),
        dedup(allRecipesResults),
        dedup(jamieOliverResults),
        dedup(seriousEatsResults),
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

      if (dietPattern || dietRestrictions.length > 0) {
        const ctx = { dietPattern, dietRestrictions };

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
            score: scoreRecipeForDiet(text, dietPattern),
          };
        });

        interleaved = scored
          .filter(e => !e.excluded)
          .sort((a, b) => b.score - a.score)
          .map(e => e.recipe);
      }

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
          });
          html = axiosRes.data;
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
        return res.status(403).json({
          message: 'This website is blocking automated access. Try pasting the recipe URL from a different site like BBC Good Food or AllRecipes.',
        });
      }

      const $ = cheerio.load(html);

      const jsonLdRecipe = extractJsonLdRecipe($);

      if (jsonLdRecipe && jsonLdRecipe.recipeIngredient && jsonLdRecipe.recipeIngredient.length > 0) {
        const title = jsonLdRecipe.name || $('h1').first().text().trim() || $('title').text().trim() || 'Imported Recipe';
        const ingredients = jsonLdRecipe.recipeIngredient.map(i => i.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        const instructions = extractJsonLdInstructions(jsonLdRecipe.recipeInstructions);
        const finalInstructions = instructions.length > 0 ? instructions : ["No instructions available"];
        const imageUrl = extractJsonLdImage(jsonLdRecipe) || $('meta[property="og:image"]').attr('content') || null;
        const nutrition = extractJsonLdNutrition(jsonLdRecipe.nutrition);

        let servings = 1;
        if (jsonLdRecipe.recipeYield) {
          const yieldVal = Array.isArray(jsonLdRecipe.recipeYield) ? jsonLdRecipe.recipeYield[0] : jsonLdRecipe.recipeYield;
          const yieldStr = String(yieldVal);
          const numMatch = yieldStr.match(/(\d+)/);
          if (numMatch) servings = parseInt(numMatch[1], 10) || 1;
        }

        return res.json({ title, ingredients, instructions: finalInstructions, imageUrl, nutrition, servings });
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

      res.json({ title, ingredients, instructions: finalInstructions, imageUrl, nutrition: nutritionData, servings });
    } catch (err) {
      console.error('Import error:', err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid URL' });
      }
      res.status(500).json({ message: 'Failed to fetch or parse recipe from URL' });
    }
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
        if (nativeRes.ok) html = await nativeRes.text();
      } catch { clearTimeout(timeout); }

      if (!html) {
        try {
          const axiosRes = await axios.get(url, { headers: browserHeaders, timeout: 15000, maxContentLength: 5 * 1024 * 1024, maxRedirects: 5 });
          html = axiosRes.data;
        } catch {}
      }

      if (!html) {
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
        axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&json=1&page_size=12&fields=${altFields}&tagtype_0=countries&tag_contains_0=contains&tag_0=united-kingdom`, altHeaders),
        axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&json=1&page_size=12&fields=${altFields}`, altHeaders),
      ]);

      const ukAltProducts: any[] = ukAltRes.status === 'fulfilled' ? (ukAltRes.value.data.products || []) : [];
      const globalAltProducts: any[] = globalAltRes.status === 'fulfilled' ? (globalAltRes.value.data.products || []) : [];

      const altSeen = new Set<string>();
      const mergedAlts: any[] = [];
      for (const p of [...ukAltProducts, ...globalAltProducts]) {
        const key = `${p.code || ''}:${(p.product_name || '').toLowerCase()}:${(p.brands || '').toLowerCase()}`;
        if (altSeen.has(key)) continue;
        altSeen.add(key);
        mergedAlts.push(p);
      }

      const alternatives = mergedAlts
        .map((p: any) => {
          const ingredientsText = p.ingredients_text || p.ingredients_text_en || '';
          const analysis = ingredientsText ? analyzeProduct(ingredientsText, p.nutriments || null, p.nova_group || null) : null;
          const altUpf = ingredientsText && analysis ? analyzeProductUPF(ingredientsText, allAdditives, analysis.healthScore, {
            productName: p.product_name || p.product_name_en || '',
            categoriesTags: p.categories_tags || [],
            novaGroup: p.nova_group || null,
          }) : null;
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
              smpRating: altUpf.smpRating,
              hasCape: altUpf.hasCape,
              smpScore: altUpf.smpScore,
              additiveMatches: altUpf.additiveMatches.map(m => ({
                name: m.additive.name,
                type: m.additive.type,
                riskLevel: m.additive.riskLevel,
                description: m.additive.description,
                foundIn: m.foundIn,
              })),
              processingIndicators: altUpf.processingIndicators,
              ingredientCount: altUpf.ingredientCount,
              upfIngredientCount: altUpf.upfIngredientCount,
              riskBreakdown: altUpf.riskBreakdown,
              smpPenalties: altUpf.smpPenalties,
              smpBonuses: altUpf.smpBonuses,
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

        await Promise.all(
          meal.ingredients.map(async (ingredient) => {
            try {
              const cleanIngredient = cleanIngredientForLookup(ingredient);
              const response = await axios.get(
                `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanIngredient)}&json=1&page_size=3`,
                { timeout: 8000, headers: { 'User-Agent': 'SmartMealPlanner/1.0' } }
              );

              const products = response.data.products || [];
              if (products.length === 0) return;

              let count = 0;
              let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, salt: 0 };

              for (const p of products) {
                const n = p.nutriments;
                if (!n) continue;
                const cal = n['energy-kcal_100g'] || n['energy-kcal'];
                if (cal) {
                  totals.calories += Number(cal) || 0;
                  totals.protein += Number(n.proteins_100g || n.proteins) || 0;
                  totals.carbs += Number(n.carbohydrates_100g || n.carbohydrates) || 0;
                  totals.fat += Number(n.fat_100g || n.fat) || 0;
                  totals.sugar += Number(n.sugars_100g || n.sugars) || 0;
                  totals.salt += Number(n.salt_100g || n.salt) || 0;
                  count++;
                }
              }

              if (count > 0) {
                nutritionTotals.calories += totals.calories / count;
                nutritionTotals.protein += totals.protein / count;
                nutritionTotals.carbs += totals.carbs / count;
                nutritionTotals.fat += totals.fat / count;
                nutritionTotals.sugar += totals.sugar / count;
                nutritionTotals.salt += totals.salt / count;
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
            source: 'openfoodfacts',
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
          if (ingLower.includes(swap.original.toLowerCase())) {
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
    const items = await storage.getShoppingListItems(req.user!.id);
    res.json(items);
  });

  app.post(api.shoppingList.add.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.shoppingList.add.input.parse(req.body);
      if (input.quantityValue && input.unit) {
        const grams = convertToGrams(input.quantityValue, input.unit);
        if (grams !== null) (input as any).quantityInGrams = grams;
      }
      if (input.normalizedName) {
        const { normalizeName, detectIngredientCategory: detect } = await import('./lib/ingredient-utils');
        const cat = input.category || detect(input.normalizedName);
        const ingredient = await storage.getOrCreateNormalizedIngredient(
          input.productName, input.normalizedName, cat
        );
        (input as any).ingredientId = ingredient.id;
      }
      const item = await storage.addShoppingListItem(req.user!.id, input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
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
      updates.productName = String(req.body.productName).trim();
      const { normalizeName } = await import('./lib/ingredient-utils');
      updates.normalizedName = normalizeName(updates.productName);
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
    if (req.body.smpRating !== undefined) {
      updates.smpRating = req.body.smpRating === null ? null : Number(req.body.smpRating);
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
      const items = await storage.getShoppingListItems(req.user!.id);
      const needsSmp = items.filter(i => i.smpRating === null || i.smpRating === undefined);
      console.log(`[auto-smp] ${items.length} total items, ${needsSmp.length} need SMP rating`);
      if (needsSmp.length === 0) return res.json({ updated: [] });

      const allAdditives = await storage.getAllAdditives();
      const OFF_FIELDS = 'code,product_name,brands,ingredients_text,ingredients_text_en,nutriments,nova_group';
      const OFF_HEADERS = { timeout: 10000, headers: { 'User-Agent': 'SmartMealPlanner/1.0 (contact: smartmealplanner@replit.app)' } };
      const updated: { id: number; smpRating: number }[] = [];
      const skipped: string[] = [];

      const batchSize = 3;
      for (let i = 0; i < needsSmp.length; i += batchSize) {
        const batch = needsSmp.slice(i, i + batchSize);
        await Promise.all(batch.map(async (item) => {
          try {
            const searchName = item.normalizedName || item.productName;
            const cleanName = searchName.replace(/^\d+[\.\d]*\s*(g|kg|ml|l|oz|lb)\s+/i, '').trim();
            const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanName)}&json=1&page_size=5&fields=${OFF_FIELDS}&tagtype_0=countries&tag_contains_0=contains&tag_0=united-kingdom`;
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
            });
            if (upfResult && upfResult.smpRating > 0) {
              await storage.updateShoppingListItem(item.id, { smpRating: upfResult.smpRating });
              updated.push({ id: item.id, smpRating: upfResult.smpRating });
            } else {
              skipped.push(`${cleanName}: smpRating=0`);
            }
          } catch (err: any) {
            skipped.push(`${item.productName}: error ${err.message || err}`);
          }
        }));
      }

      console.log(`[auto-smp] Updated ${updated.length} items, skipped ${skipped.length}: ${skipped.slice(0, 5).join('; ')}`);
      res.json({ updated });
    } catch (err) {
      console.error('[auto-smp] Error:', err);
      res.status(500).json({ message: 'Failed to calculate SMP ratings' });
    }
  });

  app.delete(api.shoppingList.clear.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.clearShoppingList(req.user!.id);
    res.sendStatus(204);
  });

  app.post(api.shoppingList.generateFromPlan.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { planId } = api.shoppingList.generateFromPlan.input.parse(req.body);
      const plan = await storage.getMealPlan(planId);
      if (!plan || plan.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      const planEntries = await storage.getMealPlanEntries(plan.id);

      const { resolveTemplate } = await import("./meal-resolution-service");
      const resolvedMealIds: number[] = [];
      for (const entry of planEntries) {
        if (entry.mealTemplateId) {
          const resolved = await resolveTemplate(entry.mealTemplateId, req.user!.id);
          if (resolved?.resolvedMealId) {
            resolvedMealIds.push(resolved.resolvedMealId);
          } else if (entry.mealId) {
            resolvedMealIds.push(entry.mealId);
          }
        } else if (entry.mealId) {
          resolvedMealIds.push(entry.mealId);
        }
      }
      const mealIds = Array.from(new Set(resolvedMealIds));

      const freezerMeals = await storage.getFreezerMeals(req.user!.id);
      const frozenPortionsByMeal = new Map<number, number>();
      for (const fm of freezerMeals) {
        const existing = frozenPortionsByMeal.get(fm.mealId) || 0;
        frozenPortionsByMeal.set(fm.mealId, existing + fm.remainingPortions);
      }

      const allIngredients: string[] = [];
      const mealMap: { meal: { id: number; name: string }; count: number; ingredients: string[] }[] = [];
      const readyMealItems: { mealId: number; name: string; count: number }[] = [];

      for (const mealId of mealIds) {
        const meal = await storage.getMeal(mealId);
        if (meal) {
          let count = resolvedMealIds.filter(id => id === mealId).length;
          const frozenPortions = frozenPortionsByMeal.get(mealId) || 0;
          if (frozenPortions > 0) {
            count = Math.max(0, count - frozenPortions);
          }
          if (count === 0) continue;
          if (meal.isReadyMeal) {
            readyMealItems.push({ mealId: meal.id, name: meal.name, count });
          } else {
            for (let i = 0; i < count; i++) {
              allIngredients.push(...meal.ingredients);
            }
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
        await storage.addIngredientSource({
          shoppingListItemId: item.id,
          mealId: rm.mealId,
          mealName: rm.name,
          quantityMultiplier: rm.count,
        });
      }

      const consolidated = consolidateAndNormalize(allIngredients);
      for (const c of consolidated) {
        const ingredient = await storage.getOrCreateNormalizedIngredient(
          c.displayName, c.normalizedName, c.category
        );
        const item = await storage.addOrConsolidateShoppingListItem(req.user!.id, {
          productName: c.displayName,
          normalizedName: c.normalizedName,
          quantityValue: c.quantity,
          unit: c.unit,
          quantityInGrams: c.quantityInGrams,
          quantity: 1,
          category: c.category,
          ingredientId: ingredient.id,
          needsReview: c.needsReview || false,
          validationNote: c.validationNote || null,
        });
        items.push(item);

        for (const mealInfo of mealMap) {
          if (ingredientMatchesMeal(c.normalizedName, mealInfo.ingredients)) {
            await storage.addIngredientSource({
              shoppingListItemId: item.id,
              mealId: mealInfo.meal.id,
              mealName: mealInfo.meal.name,
              quantityMultiplier: mealInfo.count,
            });
          }
        }
      }

      res.status(201).json(items);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.shoppingList.generateFromMeals.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      let mealSelections: { mealId: number; count: number }[];

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
        await storage.addIngredientSource({
          shoppingListItemId: item.id,
          mealId: rm.mealId,
          mealName: rm.name,
          quantityMultiplier: rm.count,
        });
      }

      const consolidated = consolidateAndNormalize(allIngredients);
      for (const c of consolidated) {
        const ingredient = await storage.getOrCreateNormalizedIngredient(
          c.displayName, c.normalizedName, c.category
        );
        const item = await storage.addOrConsolidateShoppingListItem(req.user!.id, {
          productName: c.displayName,
          normalizedName: c.normalizedName,
          quantityValue: c.quantity,
          unit: c.unit,
          quantityInGrams: c.quantityInGrams,
          quantity: 1,
          category: c.category,
          ingredientId: ingredient.id,
          needsReview: c.needsReview || false,
          validationNote: c.validationNote || null,
        });
        items.push(item);

        for (const mealInfo of mealMap) {
          if (ingredientMatchesMeal(c.normalizedName, mealInfo.ingredients)) {
            await storage.addIngredientSource({
              shoppingListItemId: item.id,
              mealId: mealInfo.meal.id,
              mealName: mealInfo.meal.name,
              quantityMultiplier: mealInfo.count,
            });
          }
        }
      }

      res.status(201).json(items);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.shoppingList.lookupPrices.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const items = await storage.getShoppingListItems(req.user!.id);
      if (items.length === 0) {
        return res.json({ matches: [] });
      }

      await storage.clearAllProductMatchesForUser(req.user!.id);

      const allMatches = [];
      for (const item of items) {
        if (isGarbageIngredient(item.productName)) continue;

        if (item.matchedProductId) {
          const getSearchUrl = (store: string) => {
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
            return urls[store] || null;
          };
          let knownStores: string[] = [];
          try {
            knownStores = item.availableStores ? JSON.parse(item.availableStores) : [];
          } catch { knownStores = []; }
          const allStores = ['Tesco', "Sainsbury's", 'Asda', 'Morrisons', 'Aldi', 'Lidl', 'Waitrose', 'Ocado', 'Marks & Spencer'];
          const storesToShow = knownStores.length > 0 ? knownStores.filter(s => allStores.includes(s)) : allStores;
          const finalStores = storesToShow.length > 0 ? storesToShow : allStores;
          for (const store of finalStores) {
            const match = await storage.addProductMatch({
              shoppingListItemId: item.id,
              supermarket: store,
              productName: item.productName,
              price: item.matchedPrice || null,
              pricePerUnit: null,
              productUrl: getSearchUrl(store),
              imageUrl: item.imageUrl || null,
              currency: 'GBP',
              tier: 'standard',
              productWeight: null,
              smpRating: item.smpRating || null,
            });
            allMatches.push(match);
          }
          continue;
        }

        const category = item.category || detectIngredientCategory(item.productName);
        const prices = await lookupPricesForIngredient(
          item.productName,
          category,
          item.quantityValue || 1,
          item.unit || 'unit'
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

  // --- Meal Planner Endpoints ---

  app.get(api.mealPlans.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plans = await storage.getMealPlans(req.user!.id);
    res.json(plans);
  });

  app.get(api.mealPlans.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plan = await storage.getMealPlan(Number(req.params.id));
    if (!plan || plan.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal plan not found" });
    }
    res.json(plan);
  });

  app.post(api.mealPlans.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.mealPlans.create.input.parse(req.body);
      const plan = await storage.createMealPlan(req.user!.id, input);
      res.status(201).json(plan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.mealPlans.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plan = await storage.getMealPlan(Number(req.params.id));
    if (!plan || plan.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal plan not found" });
    }
    await storage.deleteMealPlan(plan.id);
    res.sendStatus(204);
  });

  app.get(api.mealPlans.getEntries.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const plan = await storage.getMealPlan(Number(req.params.id));
    if (!plan || plan.userId !== req.user!.id) {
      return res.status(404).json({ message: "Meal plan not found" });
    }
    const entries = await storage.getMealPlanEntries(plan.id);
    res.json(entries);
  });

  app.post(api.mealPlans.addEntry.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const plan = await storage.getMealPlan(Number(req.params.id));
      if (!plan || plan.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      const input = api.mealPlans.addEntry.input.parse(req.body);
      const entry = await storage.addMealPlanEntry({ ...input, planId: plan.id });
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.mealPlans.removeEntry.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const entry = await storage.getMealPlanEntry(Number(req.params.id));
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    const plan = await storage.getMealPlan(entry.planId);
    if (!plan || plan.userId !== req.user!.id) {
      return res.status(404).json({ message: "Entry not found" });
    }
    await storage.removeMealPlanEntry(entry.id);
    res.sendStatus(204);
  });

  app.post(api.mealPlans.duplicate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const plan = await storage.getMealPlan(Number(req.params.id));
      if (!plan || plan.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      const { weekStart, name } = api.mealPlans.duplicate.input.parse(req.body);
      const newPlan = await storage.createMealPlan(req.user!.id, { weekStart, name });
      const entries = await storage.getMealPlanEntries(plan.id);
      for (const entry of entries) {
        await storage.addMealPlanEntry({
          planId: newPlan.id,
          dayOfWeek: entry.dayOfWeek,
          slot: entry.slot,
          mealId: entry.mealId,
        });
      }
      res.status(201).json(newPlan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- AI Suggest Weekly Meal Plan (ingredient overlap + calorie targeting) ---
  app.post(api.mealPlans.suggest.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const body = req.body || {};
      const dietId = body.dietId ? Number(body.dietId) : undefined;
      const calorieTarget = body.calorieTarget ? Number(body.calorieTarget) : undefined;
      const peopleCount = body.peopleCount ? Number(body.peopleCount) : 1;

      let userMeals = await storage.getMeals(req.user!.id);

      if (dietId) {
        const filtered = [];
        for (const meal of userMeals) {
          const mealDietEntries = await storage.getMealDiets(meal.id);
          if (mealDietEntries.some(md => md.dietId === dietId)) {
            filtered.push(meal);
          }
        }
        userMeals = filtered;
      }

      if (userMeals.length < 3) {
        return res.status(400).json({
          message: "You need at least 3 meals to generate a suggestion. Add more meals first.",
        });
      }

      const allCategories = await storage.getAllCategories();
      const categoryMap = new Map(allCategories.map(c => [c.id, c.name.toLowerCase()]));

      const slotCategoryMapping: Record<string, string[]> = {
        breakfast: ['breakfast', 'smoothie', 'drink'],
        lunch: ['lunch', 'snack'],
        dinner: ['dinner'],
        snack: ['snack', 'smoothie', 'dessert', 'drink', 'immune boost', 'supplement'],
      };

      const slotCalorieRatio: Record<string, [number, number]> = {
        breakfast: [0.22, 0.33],
        lunch: [0.28, 0.39],
        dinner: [0.33, 0.44],
        snack: [0.03, 0.11],
      };

      const getMealCategory = (meal: typeof userMeals[0]): string => {
        if (meal.categoryId) {
          return categoryMap.get(meal.categoryId) || 'dinner';
        }
        return 'dinner';
      };

      const mealCalories = new Map<number, number>();
      if (calorieTarget) {
        for (const meal of userMeals) {
          const n = await storage.getNutrition(meal.id);
          if (n?.calories) {
            const calNum = parseFloat(n.calories.replace(/[^0-9.]/g, ''));
            if (!isNaN(calNum) && calNum > 0) {
              const perServing = meal.servings > 1 ? calNum / meal.servings : calNum;
              mealCalories.set(meal.id, perServing);
            }
          }
        }
      }

      const normalizeIngs = (ingredients: string[]): string[] => {
        const keywords: string[] = [];
        for (const ing of ingredients) {
          const cleaned = ing
            .toLowerCase()
            .replace(/^\d+[\s/]*(?:g|kg|ml|l|cups?|tsp|tbsp|teaspoons?|tablespoons?|pounds?|lb|oz|ounces?|pinch|dash|cloves?|slices?|pieces?|large|medium|small|of)\s*/gi, '')
            .trim();
          const words = cleaned.split(/\s+/).filter(w => w.length > 2);
          words.forEach(w => { if (!keywords.includes(w)) keywords.push(w); });
        }
        return keywords;
      };

      const jaccardSimilarity = (a: string[], b: string[]): number => {
        const setB = new Set(b);
        const intersection = a.filter(x => setB.has(x));
        const unionSet = new Set([...a, ...b]);
        return unionSet.size > 0 ? intersection.length / unionSet.size : 0;
      };

      const mealKeywords = userMeals.map(m => ({
        meal: m,
        keywords: normalizeIngs(m.ingredients),
        category: getMealCategory(m),
        calories: mealCalories.get(m.id) || 0,
      }));

      const getMealsForSlot = (slot: string): typeof mealKeywords => {
        const allowedCategories = slotCategoryMapping[slot] || [slot];
        const matching = mealKeywords.filter(mk => allowedCategories.includes(mk.category));
        return matching.length > 0 ? matching : mealKeywords;
      };

      const pickBestMeal = (
        candidates: typeof mealKeywords,
        usedIds: Set<number>,
        alreadySelected: typeof userMeals,
        calorieMin?: number,
        calorieMax?: number
      ): typeof mealKeywords[0] => {
        let pool = candidates.filter(c => !usedIds.has(c.meal.id));
        if (pool.length === 0) pool = candidates;

        if (calorieMin !== undefined && calorieMax !== undefined) {
          const tolerance = 0.1;
          const minCal = calorieMin * (1 - tolerance);
          const maxCal = calorieMax * (1 + tolerance);
          const calorieFiltered = pool.filter(c => c.calories > 0 && c.calories >= minCal && c.calories <= maxCal);
          if (calorieFiltered.length > 0) pool = calorieFiltered;
        }

        if (alreadySelected.length === 0) {
          return pool[Math.floor(Math.random() * pool.length)];
        }

        let bestScore = -1;
        let bestMeal = pool[0];
        for (const mk of pool) {
          let totalSimilarity = 0;
          for (const sel of alreadySelected) {
            const selKw = mealKeywords.find(m => m.meal.id === sel.id);
            if (selKw) {
              totalSimilarity += jaccardSimilarity(mk.keywords, selKw.keywords);
            }
          }
          const avgSim = totalSimilarity / alreadySelected.length;
          if (avgSim > bestScore) {
            bestScore = avgSim;
            bestMeal = mk;
          }
        }
        return bestMeal;
      };

      const slots = ['breakfast', 'lunch', 'dinner'] as const;
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const suggestion: { dayOfWeek: number; day: string; slot: string; mealId: number; mealName: string; calories?: number }[] = [];
      const allSelected: typeof userMeals = [];
      const usedIds = new Set<number>();

      for (let d = 0; d < 7; d++) {
        for (const slot of slots) {
          const candidates = getMealsForSlot(slot);
          let calorieMin: number | undefined;
          let calorieMax: number | undefined;

          if (calorieTarget) {
            const perPerson = calorieTarget / peopleCount;
            const [minRatio, maxRatio] = slotCalorieRatio[slot] || [0.25, 0.4];
            calorieMin = perPerson * minRatio;
            calorieMax = perPerson * maxRatio;
          }

          const best = pickBestMeal(candidates, usedIds, allSelected, calorieMin, calorieMax);
          suggestion.push({
            dayOfWeek: d,
            day: days[d],
            slot,
            mealId: best.meal.id,
            mealName: best.meal.name,
            calories: best.calories > 0 ? Math.round(best.calories) : undefined,
          });
          allSelected.push(best.meal);
          usedIds.add(best.meal.id);
        }
      }

      const snackMeals = mealKeywords.filter(mk =>
        ['snack', 'smoothie', 'dessert', 'drink', 'immune boost', 'supplement'].includes(mk.category)
      );
      if (snackMeals.length > 0) {
        const snackDays = [0, 2, 4];
        for (const d of snackDays) {
          let snackCalMin: number | undefined;
          let snackCalMax: number | undefined;
          if (calorieTarget) {
            const perPerson = calorieTarget / peopleCount;
            const [minR, maxR] = slotCalorieRatio['snack'];
            snackCalMin = perPerson * minR;
            snackCalMax = perPerson * maxR;
          }
          const best = pickBestMeal(snackMeals, usedIds, allSelected, snackCalMin, snackCalMax);
          suggestion.push({
            dayOfWeek: d,
            day: days[d],
            slot: 'snack',
            mealId: best.meal.id,
            mealName: best.meal.name,
            calories: best.calories > 0 ? Math.round(best.calories) : undefined,
          });
          allSelected.push(best.meal);
          usedIds.add(best.meal.id);
        }
      }

      const allUsedKeywords: Record<string, number> = {};
      for (const m of allSelected) {
        const kws = normalizeIngs(m.ingredients);
        for (const kw of kws) {
          allUsedKeywords[kw] = (allUsedKeywords[kw] || 0) + 1;
        }
      }
      const sharedIngredients: string[] = [];
      for (const kw of Object.keys(allUsedKeywords)) {
        if (allUsedKeywords[kw] >= 2) sharedIngredients.push(kw);
      }

      const uniqueIngredients = new Set<string>();
      for (const m of allSelected) {
        for (const ing of m.ingredients) {
          uniqueIngredients.add(ing.toLowerCase().trim());
        }
      }

      let estimatedDailyCal: number | undefined;
      if (calorieTarget) {
        let totalCalories = 0;
        let counted = 0;
        for (const entry of suggestion) {
          const cal = mealCalories.get(entry.mealId);
          if (cal) {
            totalCalories += cal;
            counted++;
          }
        }
        if (counted > 0) {
          estimatedDailyCal = Math.round((totalCalories / suggestion.length) * (suggestion.length / 7));
        }
      }

      res.json({
        suggestion,
        stats: {
          totalMeals: allSelected.length,
          uniqueIngredients: uniqueIngredients.size,
          sharedIngredients: sharedIngredients.slice(0, 10),
          ingredientReuse: sharedIngredients.length,
          estimatedDailyCalories: estimatedDailyCal,
          calorieTarget: calorieTarget ? Math.round(calorieTarget / peopleCount) : undefined,
        },
      });
    } catch (err) {
      console.error('Suggest plan error:', err);
      res.status(500).json({ message: 'Failed to generate meal plan suggestion' });
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
          dietPattern: z.string().nullable().optional(),
          dietRestrictions: z.array(z.string()).optional(),
          eatingSchedule: z.string().nullable().optional(),
        });
        const parsed = onboardingSchema.parse(req.body);
        const { dietPattern, dietRestrictions, eatingSchedule, ...prefFields } = parsed;
        await storage.upsertUserPreferences(req.user!.id, prefFields);
        if (parsed.budgetLevel) {
          await storage.updateUserPriceTier(req.user!.id, parsed.budgetLevel);
        }
        if (dietPattern !== undefined || dietRestrictions !== undefined || eatingSchedule !== undefined) {
          await storage.updateUserProfile(req.user!.id, {
            dietPattern: dietPattern ?? null,
            dietRestrictions: dietRestrictions ?? [],
            eatingSchedule: eatingSchedule ?? null,
          });
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
      if (!week || week.userId !== req.user!.id) {
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
      if (!week || week.userId !== req.user!.id) {
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
    try {
      const day = await storage.getPlannerDay(Number(req.params.dayId));
      if (!day) {
        return res.status(404).json({ message: "Day not found" });
      }
      const week = await storage.getPlannerWeek(day.weekId);
      if (!week || week.userId !== req.user!.id) {
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
      if (!week || week.userId !== req.user!.id) {
        return res.status(404).json({ message: "Day not found" });
      }
      const entries = await storage.getPlannerEntriesForDay(day.id);
      res.json(entries);
    } catch (err) {
      console.error("Error fetching planner entries:", err);
      res.status(500).json({ message: "Failed to fetch planner entries" });
    }
  });

  app.delete("/api/planner/entries/:entryId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.deletePlannerEntry(Number(req.params.entryId));
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting planner entry:", err);
      res.status(500).json({ message: "Failed to delete planner entry" });
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
    try {
      const barcode = req.params.barcode.trim();
      if (!barcode || !/^\d{8,14}$/.test(barcode)) {
        return res.status(400).json({ message: "Invalid barcode format" });
      }

      const OFF_FIELDS = 'code,product_name,product_name_en,brands,image_front_url,image_url,ingredients_text,ingredients_text_en,nutriments,nova_group,categories_tags,nutriscore_grade,countries_tags,stores_tags,stores,purchase_places_tags';
      const offUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json?fields=${OFF_FIELDS}`;
      const response = await axios.get(offUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'SmartMealPlanner/1.0 (contact: smartmealplanner@replit.app)' },
      });

      if (!response.data || response.data.status !== 1 || !response.data.product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const p = response.data.product;
      const ingredientsText = p.ingredients_text || p.ingredients_text_en || '';
      const analysis = ingredientsText ? analyzeProduct(ingredientsText, p.nutriments || null, p.nova_group || null) : null;
      const allAdditives = await storage.getAllAdditives();
      const upfAnalysis = ingredientsText && analysis ? analyzeProductUPF(ingredientsText, allAdditives, analysis.healthScore, {
        productName: p.product_name || p.product_name_en || '',
        categoriesTags: p.categories_tags || [],
        novaGroup: p.nova_group || null,
      }) : null;

      const countriesTags: string[] = p.countries_tags || [];
      const isUK = countriesTags.some((c: string) => c === 'en:united-kingdom' || c === 'en:uk');

      const rawStores: string[] = [
        ...(p.stores_tags || []),
        ...(p.purchase_places_tags || []),
        ...((p.stores || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)),
      ];
      const storeMapping: Record<string, string> = {
        'tesco': 'Tesco', 'en:tesco': 'Tesco',
        "sainsbury's": "Sainsbury's", "en:sainsbury-s": "Sainsbury's", "sainsburys": "Sainsbury's",
        'asda': 'Asda', 'en:asda': 'Asda',
        'morrisons': 'Morrisons', 'en:morrisons': 'Morrisons',
        'aldi': 'Aldi', 'en:aldi': 'Aldi',
        'lidl': 'Lidl', 'en:lidl': 'Lidl',
        'waitrose': 'Waitrose', 'en:waitrose': 'Waitrose',
        'ocado': 'Ocado', 'en:ocado': 'Ocado',
      };
      const availableStores: string[] = [];
      for (const s of rawStores) {
        const mapped = storeMapping[s.toLowerCase()];
        if (mapped && !availableStores.includes(mapped)) availableStores.push(mapped);
      }

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
          smpRating: upfAnalysis.smpRating,
          hasCape: upfAnalysis.hasCape,
          smpScore: upfAnalysis.smpScore,
          additiveMatches: upfAnalysis.additiveMatches,
          processingIndicators: upfAnalysis.processingIndicators,
          ingredientCount: upfAnalysis.ingredientCount,
          upfIngredientCount: upfAnalysis.upfIngredientCount,
          riskBreakdown: upfAnalysis.riskBreakdown,
          smpPenalties: upfAnalysis.smpPenalties,
          smpBonuses: upfAnalysis.smpBonuses,
        } : null,
        availableStores,
      };

      res.json({ product });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return res.status(404).json({ message: "Product not found" });
      }
      console.error("Error looking up barcode:", err);
      res.status(500).json({ message: "Failed to look up barcode" });
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
      const { smpRating } = req.body;
      if (typeof smpRating !== 'number' || smpRating < 1 || smpRating > 5) {
        return res.status(400).json({ message: "Invalid smpRating" });
      }

      const userId = req.user!.id;
      const today = new Date().toISOString().split('T')[0];
      const isElite = smpRating === 5;
      const isProcessed = smpRating <= 2;

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
        await storage.upsertUserHealthTrend(userId, today, smpRating, isElite, isProcessed);
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
      });
    } catch (err) {
      console.error("Error fetching intelligence settings:", err);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.patch("/api/user/intelligence-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const allowedFields = ['soundEnabled', 'eliteTrackingEnabled', 'healthTrendEnabled', 'barcodeScannerEnabled'];
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
      const { barcode, productName, brand, imageUrl, novaGroup, nutriscoreGrade, smpRating, upfScore, healthScore, source } = req.body;
      if (!productName) return res.status(400).json({ message: "productName is required" });
      const result = await storage.addProductHistory(req.user!.id, {
        barcode: barcode || null,
        productName,
        brand: brand || null,
        imageUrl: imageUrl || null,
        novaGroup: novaGroup ?? null,
        nutriscoreGrade: nutriscoreGrade || null,
        smpRating: smpRating ?? null,
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
      const result = await storage.useFreezerMealPortion(parseInt(req.params.id));
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
      const { remainingPortions } = req.body;
      const result = await storage.updateFreezerMealPortions(parseInt(req.params.id), remainingPortions);
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
      await storage.deleteFreezerMeal(parseInt(req.params.id));
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
    if (!user?.isBetaUser) return res.status(403).json({ message: "Admin access required" });
    try {
      const limits = req.body?.limits || undefined;
      const results = await importGlobalMeals(limits);
      res.json({ success: true, results });
    } catch (err) {
      console.error("Error importing global meals:", err);
      res.status(500).json({ message: "Failed to import global meals" });
    }
  });

  app.get("/api/admin/import-status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.getUser(req.user!.id);
    if (!user?.isBetaUser) return res.status(403).json({ message: "Admin access required" });
    try {
      const status = await getImportStatus();
      res.json(status);
    } catch (err) {
      console.error("Error getting import status:", err);
      res.status(500).json({ message: "Failed to get import status" });
    }
  });

  return httpServer;
}
