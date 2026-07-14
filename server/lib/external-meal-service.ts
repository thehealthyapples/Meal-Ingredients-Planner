import * as cheerio from "cheerio";
import { scrapeRecipeFromUrl } from "./recipe-scraper";
import { getPolicyForSourceLabel, mayFetchSourceContent } from "@shared/recipe-acquisition";
import { isSourceCallable } from "./recipe-source-gate";
import { classifyDietLabels } from "@shared/dietRules";

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

// ── Where "is this meat?" is answered (SURF1B5) ──────────────────────────────
// Not here. Until SURF1B5 this file held MEAT_KEYWORDS, FISH_KEYWORDS and
// DAIRY_KEYWORDS of its own, and `detectDietTypes()` used them to decide whether an
// imported recipe was vegan or vegetarian. They were the last of the rival animal-food
// lists SURF1B4 retired from `dietRules` — it named them a survivor and let them live
// because "a label is a claim, not a gate".
//
// That was true only for as long as nothing treated a label as a gate. Starter meals
// did (SURF1B5). And the lists were as incomplete as the ones SURF1B4 deleted: they
// knew `chicken` but not `prosciutto`, `pancetta`, `gammon`, `mutton`, `gelatine`,
// `bone broth` or `foie gras`, and nothing about eggs or honey. An imported prosciutto
// pizza would have been labelled BOTH vegetarian and vegan.
//
// So the labeller now asks the canonical restriction library the same question the meal
// gate asks it, through the same door (`dietRules.shouldExcludeRecipe`). A label THA
// prints and a meal THA serves cannot disagree about what meat is, because there is
// only one answer to disagree with.
//
// This does NOT make the label a safety gate. It makes it an honest claim. Every gate
// still runs `isMealSafeForHousehold()` over the meal itself, and none of them asks
// this label anything.
//
// ── And where "do we actually KNOW?" is answered (SURF1C1) ───────────────────
// Also not here. SURF1B5 made the labeller ask the right owner; it left it asking on
// whatever evidence it happened to have, INCLUDING NONE. A title-only import — six of
// this file's own call sites pass `detectDietTypes(name, [])` — has no ingredient to
// refuse, so the canonical gate cleared it and it was labelled vegan AND vegetarian.
// That is not a finding of plants; it is a finding of nothing, recorded as a finding
// of plants (SURF1B5's own limitation #2).
//
// `dietRules.classifyDietLabels()` now owns that judgement, and it declines to answer
// without evidence. The labeller asks it, and an import THA cannot characterise arrives
// unclassified — which is the truth about it.

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

/**
 * The diet labels an imported recipe carries into THA.
 *
 * Exported so SURF1B5 can pin the one property that matters: a label THA prints can
 * never contradict the gate THA serves through.
 */
export function detectDietTypes(name: string, ingredients: string[]): string[] {
  const allText = [name, ...ingredients].join(" ").toLowerCase();

  // What the source CLAIMS — "vegan", "meat-free", "gluten-free" in its own words.
  const claimed: string[] = [];
  for (const [diet, indicators] of Object.entries(DIET_INDICATORS)) {
    if (indicators.some(ind => allText.includes(ind))) {
      claimed.push(diet);
    }
  }

  // What the meal's own EVIDENCE proves. The single owner of that derivation is
  // `dietRules.classifyDietLabels()` (SURF1C1), which puts every question about food to
  // the same canonical library the meal gate asks — so a label THA prints and a meal THA
  // serves cannot disagree.
  //
  // It returns NOTHING when the meal carries no ingredient evidence. Until SURF1C1 this
  // function labelled such a meal vegan AND vegetarian: it asked "is anything here meat?",
  // an empty ingredient list answered "no", and the absence was recorded as a finding of
  // plants. Six of this file's own call sites pass `[]`. They now import unlabelled — which
  // is what THA actually knows about them.
  const proven = classifyDietLabels({ name, ingredients }).labels;

  // Every other diet keeps the claim-based behaviour it has always had — gluten-free,
  // dairy-free, keto and paleo are outside SURF1C1's mandate and are not touched.
  const diets = claimed.filter(diet => diet !== "vegan" && diet !== "vegetarian");

  // A source's Vegan/Vegetarian claim can now only ever REMOVE a label, never add one.
  //
  //   · VETOED by contradicting evidence (SURF1B5) — "vegan carbonara" listing pancetta
  //     is labelled neither. An import is exactly where a wrong claim enters THA.
  //   · HONOURED when it UNDER-claims (SURF1B5 §7) — a source that says "vegetarian" and
  //     not "vegan" may be telling us something its ingredient list does not show, and
  //     SURF1C1 does not overrule a claim in the permissive direction. It costs the
  //     household ordering, never the meal: the gate, not the label, decides what is served.
  //   · NEVER TRUSTED on its own. No evidence, no label, however loudly the source claims.
  const underClaimsVegetarian = claimed.includes("vegetarian") && !claimed.includes("vegan");

  if (proven.includes("vegetarian")) diets.push("vegetarian");
  if (proven.includes("vegan") && !underClaimsVegetarian) diets.push("vegan");

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

// P1/P0: drink/cocktail/beverage/alcohol category terms that must never map to a meal slot.
const DRINK_CATEGORY_TERMS = ["cocktail", "drink", "beverage", "alcohol", "mocktail", "spirits", "liqueur"];

// P1: alcohol name keywords used for category inference — prevents external cocktail/drink recipes
// from defaulting to "dinner" when no better category is detectable.
const ALCOHOL_NAME_TERMS = [
  "cocktail", "mojito", "margarita", "wine", "beer", "vodka", "whiskey",
  "gin", "rum", "tequila", "champagne", "prosecco", "cider",
  "lager", "ale", "stout", "bourbon", "brandy", "liqueur",
];

function inferCategoryFromCuisineAndName(name: string, category: string | null): string | null {
  const lower = name.toLowerCase();

  // P1: exclude drink/cocktail categories — return null so they are excluded from the candidate pool.
  // Previously these fell through to "dinner" which allowed cocktails to appear as dinner suggestions.
  if (DRINK_CATEGORY_TERMS.some(t => lower.includes(t))) return null;
  if (ALCOHOL_NAME_TERMS.some(t => lower.includes(t))) return null;
  if (category) {
    const lc = category.toLowerCase();
    if (DRINK_CATEGORY_TERMS.some(t => lc.includes(t))) return null;
  }

  if (
    lower.includes("breakfast") ||
    lower.includes("pancake") ||
    lower.includes("omelette") ||
    lower.includes("porridge") ||
    lower.includes("granola") ||
    lower.includes("smoothie") ||
    // Extended breakfast terms — common breakfast dishes not previously classified:
    lower.includes("frittata") ||         // Italian baked egg dish
    lower.includes("shakshuka") ||        // Eggs poached in spiced tomato sauce
    lower.includes("scrambled") ||        // Scrambled eggs variants
    lower.includes("overnight oats") ||   // Cold-prepared oat breakfast
    lower.includes("acai")                // Acai bowl / breakfast bowl
  ) {
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
  dietaryPrefix?: string;
}): Promise<ExternalMealCandidate[]> {
  const results: ExternalMealCandidate[] = [];

  try {
    const rawQueries: string[] = [];

    if (filters.query) {
      rawQueries.push(filters.query);
    }
    if (filters.cuisine && CUISINE_QUERIES[filters.cuisine.toLowerCase()]) {
      rawQueries.push(...CUISINE_QUERIES[filters.cuisine.toLowerCase()]);
    }
    if (rawQueries.length === 0) {
      rawQueries.push("chicken", "pasta", "salad", "curry", "soup", "fish", "steak", "vegetable");
    }

    // When a dietary prefix is active, also queue breakfast concept queries WITHOUT
    // the prefix. TheMealDB is a name-indexed database with no diet-labelled recipes
    // ("keto omelette" returns 0 results), but "omelette" returns real recipes that
    // dietRules then validates as compliant post-enrichment. Concept queries run
    // alongside the prefixed queries in the same iteration — deduplication in
    // fetchExternalCandidates removes any overlaps before enrichment.
    const BREAKFAST_CONCEPT_QUERIES = ["omelette", "frittata", "smoothie", "porridge", "shakshuka"];

    const labelledQueries = filters.dietaryPrefix
      ? rawQueries.slice(0, 3).map(q => `${filters.dietaryPrefix} ${q}`)
      : rawQueries.slice(0, 5);

    const queries = filters.dietaryPrefix
      ? [...labelledQueries, ...BREAKFAST_CONCEPT_QUERIES]
      : labelledQueries;

    const seen = new Set<string>();
    const searchTerms = queries;

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
  dietaryPrefix?: string;
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

  const prefixedQueries = filters.dietaryPrefix
    ? queries.map(q => `${filters.dietaryPrefix} ${q}`)
    : queries;

  const seen = new Set<string>();

  for (const query of prefixedQueries.slice(0, 3)) {
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

function buildSearchQueries(filters: { query?: string; cuisine?: string; dietaryPrefix?: string }): string[] {
  const queries: string[] = [];
  if (filters.query) queries.push(filters.query);
  if (filters.cuisine && CUISINE_QUERIES[filters.cuisine.toLowerCase()]) {
    queries.push(...CUISINE_QUERIES[filters.cuisine.toLowerCase()].slice(0, 2));
  }
  if (queries.length === 0) {
    queries.push("healthy dinner", "quick lunch", "easy breakfast");
  }
  const terms = queries.slice(0, 3);

  if (filters.dietaryPrefix) {
    const labelledTerms = terms.map(q => `${filters.dietaryPrefix} ${q}`);
    // Supplement labelled queries with breakfast concept terms. Scraping sites
    // (BBC GoodFood, AllRecipes) carry these as real recipes and return compliant
    // content — dietRules validates compliance after ingredient enrichment.
    const conceptTerms = ["omelette", "overnight oats", "smoothie bowl"];
    return [...labelledTerms, ...conceptTerms].slice(0, 5);
  }
  return terms;
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
  dietaryPrefix?: string;
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
  dietaryPrefix?: string;
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
  dietaryPrefix?: string;
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

export async function searchEdamam(query: string): Promise<ExternalMealCandidate[]> {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) return [];
  try {
    const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=${appId}&app_key=${appKey}&field=label&field=image&field=url&field=ingredientLines&field=yield&field=cuisineType&field=mealType&field=dietLabels`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];
    const data = await response.json() as any;
    const hits = data?.hits ?? [];
    return hits.slice(0, 10).map((hit: any) => {
      const recipe = hit.recipe;
      const uriSlug = (recipe.uri ?? '').split('#recipe_').pop() ?? '';
      return {
        externalId: `edamam-${uriSlug}`,
        name: recipe.label ?? 'Unknown',
        image: recipe.image ?? null,
        ingredients: recipe.ingredientLines ?? [],
        instructions: [],
        dietTypes: detectDietTypes(recipe.label ?? '', recipe.ingredientLines ?? []),
        estimatedCost: null,
        estimatedUPFScore: null,
        source: "Edamam",
        sourceUrl: recipe.url ?? null,
        category: inferCategoryFromCuisineAndName(recipe.label ?? '', recipe.mealType?.[0] ?? null),
        cuisine: recipe.cuisineType?.[0] ?? null,
        primaryProtein: detectPrimaryProtein(recipe.ingredientLines ?? []),
      } as ExternalMealCandidate;
    });
  } catch {
    return [];
  }
}

export async function searchApiNinjas(query: string): Promise<ExternalMealCandidate[]> {
  const apiKey = process.env.API_NINJAS_API_KEY;
  if (!apiKey) return [];
  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/recipe?query=${encodeURIComponent(query)}`,
      { headers: { 'X-Api-Key': apiKey }, signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) return [];
    const data = await response.json() as any[];
    return data.slice(0, 10).map((item: any) => {
      const ingredients = typeof item.ingredients === 'string'
        ? item.ingredients.split('|').map((s: string) => s.trim()).filter(Boolean)
        : [];
      const instructions = typeof item.instructions === 'string'
        ? item.instructions.split(/\r?\n/).filter((s: string) => s.trim().length > 0)
        : [];
      return {
        externalId: `apininjas-${item.title?.toLowerCase().replace(/[^a-z0-9]/g, '-') ?? Math.random()}`,
        name: item.title ?? 'Unknown',
        image: null,
        ingredients,
        instructions,
        dietTypes: detectDietTypes(item.title ?? '', ingredients),
        estimatedCost: null,
        estimatedUPFScore: null,
        source: "API-Ninjas",
        sourceUrl: null,
        category: inferCategoryFromCuisineAndName(item.title ?? '', null),
        cuisine: null,
        primaryProtein: detectPrimaryProtein(ingredients),
      } as ExternalMealCandidate;
    });
  } catch {
    return [];
  }
}

export async function searchBigOven(query: string): Promise<ExternalMealCandidate[]> {
  const apiKey = process.env.BIGOVEN_API_KEY;
  if (!apiKey) return [];
  try {
    const response = await fetch(
      `https://api.bigoven.com/recipes?any_kw=${encodeURIComponent(query)}&api_key=${apiKey}&pg=1&rpp=10`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) return [];
    const data = await response.json() as any;
    const results = data?.Results ?? [];
    return results.map((item: any) => ({
      externalId: `bigoven-${item.RecipeID}`,
      name: item.Title ?? 'Unknown',
      image: item.PhotoUrl ?? null,
      ingredients: [],
      instructions: [],
      dietTypes: detectDietTypes(item.Title ?? '', []),
      estimatedCost: null,
      estimatedUPFScore: null,
      source: "BigOven",
      sourceUrl: item.WebURL ?? null,
      category: inferCategoryFromCuisineAndName(item.Title ?? '', item.Category ?? null),
      cuisine: item.Cuisine ?? null,
      primaryProtein: detectPrimaryProtein([item.Title ?? '']),
    } as ExternalMealCandidate));
  } catch {
    return [];
  }
}

let fatSecretToken: { value: string; expiresAt: number } | null = null;

async function getFatSecretToken(): Promise<string | null> {
  if (fatSecretToken && Date.now() < fatSecretToken.expiresAt) return fatSecretToken.value;
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const body = new URLSearchParams({ grant_type: 'client_credentials', scope: 'basic' });
    const res = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json() as any;
    fatSecretToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
    return fatSecretToken.value;
  } catch {
    return null;
  }
}

export async function searchFatSecret(query: string): Promise<ExternalMealCandidate[]> {
  const token = await getFatSecretToken();
  if (!token) return [];
  try {
    const params = new URLSearchParams({
      method: 'recipes.search',
      search_expression: query,
      format: 'json',
      max_results: '10',
    });
    const res = await fetch(`https://platform.fatsecret.com/rest/server.api?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json() as any;
    const recipes = data?.recipes?.recipe;
    if (!recipes) return [];
    const arr = Array.isArray(recipes) ? recipes : [recipes];
    return arr.map((item: any) => ({
      externalId: `fatsecret-${item.recipe_id}`,
      name: item.recipe_name ?? 'Unknown',
      image: item.recipe_image ?? null,
      ingredients: item.recipe_description ? [item.recipe_description] : [],
      instructions: [],
      dietTypes: detectDietTypes(item.recipe_name ?? '', []),
      estimatedCost: null,
      estimatedUPFScore: null,
      source: "FatSecret",
      sourceUrl: item.recipe_url ?? null,
      category: inferCategoryFromCuisineAndName(item.recipe_name ?? '', item.recipe_types?.recipe_type ?? null),
      cuisine: null,
      primaryProtein: detectPrimaryProtein([item.recipe_name ?? '']),
    } as ExternalMealCandidate));
  } catch {
    return [];
  }
}

export async function fetchExternalCandidates(filters: {
  query?: string;
  cuisine?: string;
  category?: string;
  dietaryPrefix?: string;
}): Promise<ExternalMealCandidate[]> {
  // FS3: every automated acquisition source passes through the source gate
  // (acquisition policy + admin toggle + credentials) — closes FS2 C1-a. The
  // four scraped sources are unlicensed (storagePolicy: forbidden) and are
  // never callable; their search functions remain only for the day a source
  // gains a licence register entry.
  const searchers: Array<{ key: string; run: (f: typeof filters) => Promise<ExternalMealCandidate[]> }> = [
    { key: "themealdb",   run: searchMealDB },
    { key: "bbcgoodfood", run: searchBBCGoodFoodEnhanced },
    { key: "allrecipes",  run: searchAllRecipes },
    { key: "jamieoliver", run: searchJamieOliver },
    { key: "seriouseats", run: searchSeriousEats },
  ];

  const runGated = async (f: typeof filters): Promise<ExternalMealCandidate[][]> =>
    Promise.all(
      searchers.map(async ({ key, run }) => ((await isSourceCallable(key)) ? run(f) : [])),
    );

  const resultsBySource = await runGated(filters);

  const seen = new Set<string>();
  const combined: ExternalMealCandidate[] = [];

  for (const result of resultsBySource.flat()) {
    const key = result.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    combined.push(result);
  }

  // Fallback: if dietary search returned too few candidates, also run generic search and merge
  if (filters.dietaryPrefix && combined.length < 10) {
    console.log(`[ExternalSearch] Dietary prefix "${filters.dietaryPrefix}" returned ${combined.length} candidates — running generic fallback search`);
    const genericResults = await runGated({ ...filters, dietaryPrefix: undefined });
    for (const result of genericResults.flat()) {
      const key = result.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(key)) continue;
      seen.add(key);
      combined.push(result);
    }
  }

  return combined;
}

// ─── Ingredient Enrichment ────────────────────────────────────────────────────

/**
 * Fetches and extracts ingredients for a single external candidate.
 *
 * - Candidates that already have ingredients (TheMealDB, Edamam) return immediately.
 * - Candidates missing ingredients may have their detail page fetched ONLY when
 *   the source's acquisition policy permits content fetch (`allowContentFetch`,
 *   shared/recipe-acquisition.ts). No current source permits it — this encodes
 *   the FS3 no-THA-initiated-scraping rule and the Edamam never-fetch rule
 *   (FS2 R7) in the function itself rather than in its callers.
 * - Returns null when ingredients cannot be obtained — the caller must exclude
 *   the candidate from Smart Planner recommendation.
 *
 * Timeout is shorter than the import path (8 s vs 15 s) to limit planner latency.
 */
export async function enrichCandidateIngredients(
  candidate: ExternalMealCandidate,
): Promise<ExternalMealCandidate | null> {
  if (candidate.ingredients.length > 0) return candidate;
  if (!candidate.sourceUrl) return null;

  const policy = getPolicyForSourceLabel(candidate.source);
  if (!mayFetchSourceContent(policy)) {
    console.debug(
      `[ExternalSearch] Enrichment refused for "${candidate.name}" — source "${candidate.source}" does not permit content fetch`,
    );
    return null;
  }

  const scraped = await scrapeRecipeFromUrl(candidate.sourceUrl, 8000);
  if (!scraped || scraped.ingredients.length === 0) return null;

  return {
    ...candidate,
    ingredients: scraped.ingredients,
    instructions: scraped.instructions.length > 0 ? scraped.instructions : candidate.instructions,
  };
}

/**
 * Enriches a batch of external candidates with ingredient data, fetching detail
 * pages in parallel (capped at `concurrency` simultaneous requests).
 *
 * Candidates where ingredient extraction fails are dropped from the result —
 * they are ineligible for Smart Planner recommendation per the unknown-ingredient
 * policy.
 */
export async function enrichExternalCandidates(
  candidates: ExternalMealCandidate[],
  concurrency = 5,
): Promise<ExternalMealCandidate[]> {
  if (candidates.length === 0) return [];

  const enriched: ExternalMealCandidate[] = [];
  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(c => enrichCandidateIngredients(c)));
    for (const r of results) {
      if (r !== null) enriched.push(r);
    }
  }

  console.log(
    `[ExternalSearch] Ingredient enrichment: ${enriched.length}/${candidates.length} candidates retained`,
  );
  return enriched;
}
