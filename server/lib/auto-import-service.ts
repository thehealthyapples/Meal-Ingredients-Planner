import axios from "axios";
import * as cheerio from "cheerio";
import { storage } from "../storage";
import type { ExternalMealCandidate } from "./external-meal-service";

export interface AutoImportResult {
  mealId: number;
  mealTemplateId: number;
  name: string;
  source: string;
}

export async function autoImportExternalMeal(
  candidate: ExternalMealCandidate,
  userId: number,
): Promise<AutoImportResult | null> {
  try {
    const existingMeals = await storage.getMeals(userId);
    const existingMatch = existingMeals.find(m =>
      m.name.toLowerCase().trim() === candidate.name.toLowerCase().trim() ||
      (candidate.sourceUrl && m.sourceUrl === candidate.sourceUrl)
    );
    if (existingMatch) {
      let template = await storage.getMealTemplateByName(existingMatch.name);
      if (!template) {
        template = await storage.createMealTemplate({
          name: existingMatch.name,
          category: candidate.category || "dinner",
        });
        await storage.updateMealTemplateId(existingMatch.id, template.id);
      }
      return {
        mealId: existingMatch.id,
        mealTemplateId: template.id,
        name: existingMatch.name,
        source: candidate.source,
      };
    }

    let ingredients = candidate.ingredients;
    let instructions = candidate.instructions;

    if (candidate.sourceUrl && ingredients.length === 0) {
      const scraped = await scrapeRecipeFromUrl(candidate.sourceUrl);
      if (scraped) {
        ingredients = scraped.ingredients;
        instructions = scraped.instructions.length > 0 ? scraped.instructions : instructions;
      }
    }

    if (ingredients.length === 0) {
      ingredients = [`${candidate.name} (ingredients to be added)`];
    }

    const meal = await storage.createMeal(userId, {
      name: candidate.name,
      ingredients,
      instructions: instructions.length > 0 ? instructions : [],
      imageUrl: candidate.image || undefined,
      sourceUrl: candidate.sourceUrl || undefined,
      mealSourceType: "scratch",
    });

    let template = await storage.getMealTemplateByName(candidate.name);
    if (!template) {
      template = await storage.createMealTemplate({
        name: candidate.name,
        category: candidate.category || "dinner",
      });
    }

    await storage.updateMealTemplateId(meal.id, template.id);

    return {
      mealId: meal.id,
      mealTemplateId: template.id,
      name: meal.name,
      source: candidate.source,
    };
  } catch (err) {
    console.error(`Auto-import failed for "${candidate.name}":`, err);
    return null;
  }
}

async function scrapeRecipeFromUrl(url: string): Promise<{ ingredients: string[]; instructions: string[]; name?: string; image?: string } | null> {
  try {
    const browserHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
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
    const fetchTimeout = setTimeout(() => controller.abort(), 15000);
    try {
      const nativeRes = await fetch(url, {
        headers: browserHeaders,
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(fetchTimeout);
      if (nativeRes.ok) {
        html = await nativeRes.text();
      }
    } catch {
      clearTimeout(fetchTimeout);
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

    if (!html) return null;

    const $ = cheerio.load(html);

    const jsonLdRecipe = extractJsonLdFromPage($);
    if (jsonLdRecipe && jsonLdRecipe.recipeIngredient && jsonLdRecipe.recipeIngredient.length > 0) {
      const ingredients = jsonLdRecipe.recipeIngredient.map((i: string) => i.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      const instructions = extractJsonLdSteps(jsonLdRecipe.recipeInstructions);
      let image: string | undefined;
      if (jsonLdRecipe.image) {
        if (typeof jsonLdRecipe.image === 'string') image = jsonLdRecipe.image;
        else if (Array.isArray(jsonLdRecipe.image)) {
          const first = jsonLdRecipe.image[0];
          image = typeof first === 'string' ? first : first?.url;
        }
      }
      return { ingredients, instructions, name: jsonLdRecipe.name, image };
    }

    const ingredients: string[] = [];
    const instructions: string[] = [];

    const measurements = ["g", "kg", "ml", "l", "cup", "cups", "tsp", "tbsp", "teaspoon", "tablespoon", "pound", "lb", "oz", "ounce", "pinch", "dash", "clove", "cloves", "slice", "slices"];
    const measurementRegex = new RegExp(`\\d+\\s*(${measurements.join("|")})`, "i");

    $("li").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length < 3 || text.length > 100) return;
      const isIngredient =
        measurementRegex.test(text) ||
        $(el).attr("class")?.toLowerCase().includes("ingredient") ||
        $(el).parent().attr("class")?.toLowerCase().includes("ingredient");
      if (isIngredient && !ingredients.includes(text)) {
        ingredients.push(text);
      }
    });

    const stepSelectors = [
      ".method-steps__list-item",
      ".recipe-method__list-item",
      '[class*="instruction"] li',
      '[class*="method"] li',
      '[class*="step"] li',
      ".recipe-steps li",
    ];
    for (const sel of stepSelectors) {
      $(sel).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 10 && !instructions.includes(text)) {
          instructions.push(text);
        }
      });
      if (instructions.length > 0) break;
    }

    return { ingredients, instructions };
  } catch {
    return null;
  }
}

function extractJsonLdFromPage($: cheerio.CheerioAPI): any {
  let recipeSchema: any = null;

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

function extractJsonLdSteps(instructions: any): string[] {
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
