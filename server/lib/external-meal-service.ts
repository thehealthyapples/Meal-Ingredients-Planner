import * as cheerio from "cheerio";

export interface ExternalMealCandidate {
  externalId: string;
  name: string;
  image: string | null;
  ingredients: string[];
  instructions: string[];
  dietTypes: string[];
  estimatedCost: number | null;
  estimatedUPFScore: number | null;
  source: string;
  sourceUrl: string | null;
  category: string | null;
  cuisine: string | null;
  primaryProtein: string | null;
}

const PROTEIN_KEYWORDS: Record<string, string[]> = {
  chicken: ["chicken", "poultry"],
  beef: ["beef", "steak", "mince", "ground beef"],
  pork: ["pork", "bacon", "ham", "sausage"],
  lamb: ["lamb", "mutton"],
  fish: ["fish", "salmon", "tuna", "cod", "haddock", "mackerel", "trout", "sardine", "anchovy", "sea bass", "halibut"],
  seafood: ["prawn", "shrimp", "crab", "lobster", "mussel", "squid", "calamari", "scallop", "clam"],
  vegetarian: ["tofu", "tempeh", "paneer", "quorn", "seitan", "lentil", "chickpea", "bean"],
};

const DIET_INDICATORS: Record<string, string[]> = {
  vegetarian: ["vegetarian", "veggie", "meat-free", "meatless"],
  vegan: ["vegan", "plant-based", "plant based"],
  "gluten-free": ["gluten-free", "gluten free", "coeliac"],
  "dairy-free": ["dairy-free", "dairy free", "lactose-free"],
  keto: ["keto", "low-carb", "low carb"],
  paleo: ["paleo", "primal"],
};

const MEAT_KEYWORDS = ["chicken", "beef", "pork", "lamb", "turkey", "duck", "bacon", "steak", "ham", "mince", "sausage", "veal", "venison"];
const FISH_KEYWORDS = ["fish", "salmon", "tuna", "cod", "prawn", "shrimp", "crab", "lobster", "mussel", "squid", "haddock", "mackerel", "trout", "sardine"];
const DAIRY_KEYWORDS = ["milk", "cheese", "cream", "butter", "yogurt", "yoghurt", "cheddar", "mozzarella", "parmesan"];

const UPF_INDICATOR_KEYWORDS = ["processed", "instant", "packet", "mix", "ready-made", "pre-made", "artificial", "hydrogenated", "modified starch", "high-fructose"];

const CUISINE_QUERIES: Record<string, string[]> = {
  british: ["sunday roast", "shepherd pie", "fish chips"],
  italian: ["pasta", "risotto", "pizza"],
  indian: ["curry", "biryani", "tikka"],
  chinese: ["stir fry", "noodles", "fried rice"],
  mexican: ["tacos", "burrito", "enchilada"],
  thai: ["thai curry", "pad thai", "tom yum"],
  japanese: ["sushi", "ramen", "teriyaki"],
  mediterranean: ["greek salad", "hummus", "falafel"],
  american: ["burger", "mac cheese", "barbecue"],
  french: ["ratatouille", "quiche", "crepe"],
};

function detectPrimaryProtein(ingredients: string[]): string | null {
  const lowerIngs = ingredients.map(i => i.toLowerCase());
  for (const [protein, keywords] of Object.entries(PROTEIN_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerIngs.some(i => i.includes(kw))) {
        return protein;
      }
    }
  }
  return null;
}

function detectDietTypes(name: string, ingredients: string[]): string[] {
  const diets: string[] = [];
  const allText = [name, ...ingredients].join(" ").toLowerCase();

  for (const [diet, indicators] of Object.entries(DIET_INDICATORS)) {
    if (indicators.some(ind => allText.includes(ind))) {
      diets.push(diet);
    }
  }

  const hasMeat = MEAT_KEYWORDS.some(kw => allText.includes(kw));
  const hasFish = FISH_KEYWORDS.some(kw => allText.includes(kw));
  const hasDairy = DAIRY_KEYWORDS.some(kw => allText.includes(kw));

  if (!hasMeat && !hasFish && !diets.includes("vegetarian")) {
    if (!hasDairy) {
      diets.push("vegan");
    }
    diets.push("vegetarian");
  }

  return Array.from(new Set(diets));
}

function estimateUPFScore(ingredients: string[]): number {
  let score = 0;
  const lowerIngs = ingredients.map(i => i.toLowerCase());
  for (const ing of lowerIngs) {
    for (const kw of UPF_INDICATOR_KEYWORDS) {
      if (ing.includes(kw)) {
        score += 10;
        break;
      }
    }
  }
  if (ingredients.length > 15) score += 10;
  return Math.min(100, score);
}

function estimateCost(ingredients: string[]): number {
  const baseCost = 1.5;
  const perIngredient = 0.35;
  const expensiveKeywords = ["salmon", "steak", "prawn", "lobster", "crab", "lamb", "duck", "truffle", "saffron"];
  let cost = baseCost + ingredients.length * perIngredient;
  const lowerIngs = ingredients.map(i => i.toLowerCase());
  for (const kw of expensiveKeywords) {
    if (lowerIngs.some(i => i.includes(kw))) {
      cost += 1.5;
    }
  }
  return Math.round(cost * 100) / 100;
}

function extractMealDbIngredients(meal: any): string[] {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = (meal[`strIngredient${i}`] || "").trim();
    const measure = (meal[`strMeasure${i}`] || "").trim();
    if (ingredient) {
      ingredients.push(measure ? `${measure} ${ingredient}` : ingredient);
    }
  }
  return ingredients;
}

function inferCategoryFromCuisineAndName(name: string, category: string | null): string | null {
  const lower = name.toLowerCase();
  if (lower.includes("breakfast") || lower.includes("pancake") || lower.includes("omelette") || lower.includes("porridge") || lower.includes("granola") || lower.includes("smoothie")) {
    return "breakfast";
  }
  if (lower.includes("salad") || lower.includes("sandwich") || lower.includes("wrap") || lower.includes("soup")) {
    return "lunch";
  }
  if (lower.includes("cake") || lower.includes("brownie") || lower.includes("cookie") || lower.includes("pudding") || lower.includes("dessert") || lower.includes("ice cream")) {
    return "dessert";
  }
  if (category) {
    const lc = category.toLowerCase();
    if (lc === "breakfast") return "breakfast";
    if (lc === "starter" || lc === "side") return "lunch";
    if (lc === "dessert") return "dessert";
  }
  return "dinner";
}

export async function searchMealDB(filters: {
  cuisine?: string;
  category?: string;
  query?: string;
}): Promise<ExternalMealCandidate[]> {
  const results: ExternalMealCandidate[] = [];

  try {
    const queries: string[] = [];

    if (filters.query) {
      queries.push(filters.query);
    }
    if (filters.cuisine && CUISINE_QUERIES[filters.cuisine.toLowerCase()]) {
      queries.push(...CUISINE_QUERIES[filters.cuisine.toLowerCase()]);
    }
    if (queries.length === 0) {
      queries.push("chicken", "pasta", "salad", "curry", "soup", "fish", "steak", "vegetable");
    }

    const seen = new Set<string>();
    const searchTerms = queries.slice(0, 5);

    for (const term of searchTerms) {
      try {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) continue;
        const data = await res.json() as any;
        const meals = data?.meals || [];
        for (const meal of meals) {
          if (seen.has(meal.idMeal)) continue;
          seen.add(meal.idMeal);

          const ingredients = extractMealDbIngredients(meal);
          const name = meal.strMeal || "";
          const category = meal.strCategory || null;

          results.push({
            externalId: `mealdb-${meal.idMeal}`,
            name,
            image: meal.strMealThumb || null,
            ingredients,
            instructions: meal.strInstructions
              ? meal.strInstructions.split(/\r?\n/).filter((s: string) => s.trim().length > 0)
              : [],
            dietTypes: detectDietTypes(name, ingredients),
            estimatedCost: estimateCost(ingredients),
            estimatedUPFScore: estimateUPFScore(ingredients),
            source: "TheMealDB",
            sourceUrl: meal.strSource || null,
            category: inferCategoryFromCuisineAndName(name, category),
            cuisine: meal.strArea || null,
            primaryProtein: detectPrimaryProtein(ingredients),
          });
        }
      } catch {
        continue;
      }
    }
  } catch {
    // fail silently
  }

  return results;
}

export async function searchBBCGoodFoodEnhanced(filters: {
  query?: string;
  cuisine?: string;
}): Promise<ExternalMealCandidate[]> {
  const results: ExternalMealCandidate[] = [];
  const queries: string[] = [];

  if (filters.query) queries.push(filters.query);
  if (filters.cuisine && CUISINE_QUERIES[filters.cuisine.toLowerCase()]) {
    queries.push(...CUISINE_QUERIES[filters.cuisine.toLowerCase()].slice(0, 2));
  }
  if (queries.length === 0) {
    queries.push("healthy dinner", "quick lunch", "easy breakfast");
  }

  const seen = new Set<string>();

  for (const query of queries.slice(0, 3)) {
    try {
      const response = await fetch(
        `https://www.bbcgoodfood.com/search?q=${encodeURIComponent(query)}`,
        {
          headers: browserHeaders,
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!response.ok) continue;
      const html = await response.text();

      const $ = cheerio.load(html);

      $("article.card").each((_, el) => {
        const card = $(el);
        const titleLink = card
          .find('a[href*="/recipes/"]')
          .filter((__, a) => {
            const href = $(a).attr("href") || "";
            return href.match(/\/recipes\/[a-z0-9-]+$/) !== null && !href.includes("collection");
          })
          .first();

        const href = titleLink.attr("href");
        if (!href || seen.has(href)) return;
        seen.add(href);

        const name = card.find("h2").first().text().trim().replace(/^App only/i, "").trim();
        if (!name) return;

        const img = card.find("img").first();
        let imageUrl = img.attr("src") || "";
        if (imageUrl) imageUrl = imageUrl.split("?")[0] + "?quality=90&resize=440,400";

        const fullUrl = href.startsWith("http") ? href : `https://www.bbcgoodfood.com${href}`;
        const slug = href.split("/").pop() || "";

        results.push({
          externalId: `bbcgf-${slug}`,
          name,
          image: imageUrl || null,
          ingredients: [],
          instructions: [],
          dietTypes: detectDietTypes(name, []),
          estimatedCost: 4.0,
          estimatedUPFScore: 5,
          source: "BBC Good Food",
          sourceUrl: fullUrl,
          category: inferCategoryFromCuisineAndName(name, null),
          cuisine: "British",
          primaryProtein: detectPrimaryProtein([name]),
        });
      });
    } catch {
      continue;
    }
  }

  return results;
}

const browserHeaders: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

function buildSearchQueries(filters: { query?: string; cuisine?: string }): string[] {
  const queries: string[] = [];
  if (filters.query) queries.push(filters.query);
  if (filters.cuisine && CUISINE_QUERIES[filters.cuisine.toLowerCase()]) {
    queries.push(...CUISINE_QUERIES[filters.cuisine.toLowerCase()].slice(0, 2));
  }
  if (queries.length === 0) {
    queries.push("healthy dinner", "quick lunch", "easy breakfast");
  }
  return queries.slice(0, 3);
}

function scrapeRecipeLinks(
  $: cheerio.CheerioAPI,
  recipeUrlPattern: RegExp,
  baseUrl: string,
  maxResults: number = 10,
): { name: string; url: string; image: string | null }[] {
  const recipeLinks: { name: string; url: string; image: string | null }[] = [];
  const seen = new Set<string>();

  $('a').each((_, el) => {
    if (recipeLinks.length >= maxResults) return false;
    const href = $(el).attr('href') || '';
    if (!href.match(recipeUrlPattern)) return;
    const fullUrl = href.startsWith('http') ? href : baseUrl + href;
    if (seen.has(fullUrl)) return;
    seen.add(fullUrl);

    let name = $(el).text().trim().replace(/\s+/g, ' ');
    if (!name || name.length < 3 || name.length > 200) {
      name = $(el).closest('article, [class*="card"], div').find('h2, h3, h4, [class*="title"]').first().text().trim().replace(/\s+/g, ' ');
    }
    if (!name || name.length < 3 || name.length > 200) return;

    const card = $(el).closest('article, [class*="card"], div');
    const image = card.find('img').first().attr('src') || card.find('img').first().attr('data-src') || null;

    recipeLinks.push({ name, url: fullUrl, image });
  });

  return recipeLinks;
}

export async function searchAllRecipes(filters: {
  query?: string;
  cuisine?: string;
}): Promise<ExternalMealCandidate[]> {
  const results: ExternalMealCandidate[] = [];
  const queries = buildSearchQueries(filters);
  const seen = new Set<string>();

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://www.allrecipes.com/search?q=${encodeURIComponent(query)}`,
        { headers: browserHeaders, signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) continue;
      const html = await response.text();
      const $ = cheerio.load(html);

      const links = scrapeRecipeLinks($, /\/recipe\/\d+/, 'https://www.allrecipes.com', 10 - results.length);

      for (const link of links) {
        if (seen.has(link.url)) continue;
        seen.add(link.url);
        const slug = link.url.split('/').filter(Boolean).pop() || '';

        results.push({
          externalId: `allrecipes-${slug}`,
          name: link.name,
          image: link.image,
          ingredients: [],
          instructions: [],
          dietTypes: detectDietTypes(link.name, []),
          estimatedCost: 4.0,
          estimatedUPFScore: 5,
          source: "AllRecipes",
          sourceUrl: link.url,
          category: inferCategoryFromCuisineAndName(link.name, null),
          cuisine: null,
          primaryProtein: detectPrimaryProtein([link.name]),
        });

        if (results.length >= 10) break;
      }
    } catch {
      continue;
    }
    if (results.length >= 10) break;
  }

  return results;
}

export async function searchJamieOliver(filters: {
  query?: string;
  cuisine?: string;
}): Promise<ExternalMealCandidate[]> {
  const results: ExternalMealCandidate[] = [];
  const queries = buildSearchQueries(filters);
  const seen = new Set<string>();

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://www.jamieoliver.com/search/?s=${encodeURIComponent(query)}`,
        { headers: browserHeaders, signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) continue;
      const html = await response.text();
      const $ = cheerio.load(html);

      const links = scrapeRecipeLinks($, /\/recipes\//, 'https://www.jamieoliver.com', 10 - results.length);

      for (const link of links) {
        if (seen.has(link.url)) continue;
        seen.add(link.url);
        const slug = link.url.split('/').filter(Boolean).pop() || '';

        results.push({
          externalId: `jamieoliver-${slug}`,
          name: link.name,
          image: link.image,
          ingredients: [],
          instructions: [],
          dietTypes: detectDietTypes(link.name, []),
          estimatedCost: 4.0,
          estimatedUPFScore: 5,
          source: "Jamie Oliver",
          sourceUrl: link.url,
          category: inferCategoryFromCuisineAndName(link.name, null),
          cuisine: "British",
          primaryProtein: detectPrimaryProtein([link.name]),
        });

        if (results.length >= 10) break;
      }
    } catch {
      continue;
    }
    if (results.length >= 10) break;
  }

  return results;
}

export async function searchSeriousEats(filters: {
  query?: string;
  cuisine?: string;
}): Promise<ExternalMealCandidate[]> {
  const results: ExternalMealCandidate[] = [];
  const queries = buildSearchQueries(filters);
  const seen = new Set<string>();

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://www.seriouseats.com/search?q=${encodeURIComponent(query)}`,
        { headers: browserHeaders, signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) continue;
      const html = await response.text();
      const $ = cheerio.load(html);

      const links = scrapeRecipeLinks($, /\/(recipes\/|.*-recipe-)/, 'https://www.seriouseats.com', 10 - results.length);

      for (const link of links) {
        if (seen.has(link.url)) continue;
        seen.add(link.url);
        const slug = link.url.split('/').filter(Boolean).pop() || '';

        results.push({
          externalId: `seriouseats-${slug}`,
          name: link.name,
          image: link.image,
          ingredients: [],
          instructions: [],
          dietTypes: detectDietTypes(link.name, []),
          estimatedCost: 4.0,
          estimatedUPFScore: 5,
          source: "Serious Eats",
          sourceUrl: link.url,
          category: inferCategoryFromCuisineAndName(link.name, null),
          cuisine: null,
          primaryProtein: detectPrimaryProtein([link.name]),
        });

        if (results.length >= 10) break;
      }
    } catch {
      continue;
    }
    if (results.length >= 10) break;
  }

  return results;
}

export async function fetchExternalCandidates(filters: {
  query?: string;
  cuisine?: string;
  category?: string;
}): Promise<ExternalMealCandidate[]> {
  const [mealDbResults, bbcResults, allRecipesResults, jamieOliverResults, seriousEatsResults] = await Promise.all([
    searchMealDB(filters),
    searchBBCGoodFoodEnhanced(filters),
    searchAllRecipes(filters),
    searchJamieOliver(filters),
    searchSeriousEats(filters),
  ]);

  const seen = new Set<string>();
  const combined: ExternalMealCandidate[] = [];

  const interleave = [...mealDbResults, ...bbcResults, ...allRecipesResults, ...jamieOliverResults, ...seriousEatsResults];
  for (const result of interleave) {
    const key = result.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(result);
  }

  return combined;
}
