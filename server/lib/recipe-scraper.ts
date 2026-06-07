import axios from "axios";
import * as cheerio from "cheerio";
import { RECIPE_IMPORT_MEASUREMENT_REGEX } from "./recipe-import-units";

export interface ScrapedRecipe {
  ingredients: string[];
  instructions: string[];
  name?: string;
  image?: string;
}

const SCRAPER_BROWSER_HEADERS: Record<string, string> = {
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

export async function scrapeRecipeFromUrl(
  url: string,
  timeoutMs = 15000,
): Promise<ScrapedRecipe | null> {
  try {
    let html = '';
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const nativeRes = await fetch(url, {
        headers: SCRAPER_BROWSER_HEADERS,
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
          headers: SCRAPER_BROWSER_HEADERS,
          timeout: timeoutMs,
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
      const ingredients = jsonLdRecipe.recipeIngredient
        .map((i: string) => i.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean);
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

    $("li").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length < 3 || text.length > 100) return;
      const isIngredient =
        RECIPE_IMPORT_MEASUREMENT_REGEX.test(text) ||
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

export function extractJsonLdFromPage($: cheerio.CheerioAPI): any {
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

export function extractJsonLdSteps(instructions: any): string[] {
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
