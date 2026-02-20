import { db } from "../db";
import { meals, nutrition, mealCategories } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { log } from "../index";

const SYSTEM_USER_ID = 0;
const BASE_URL = "https://world.openfoodfacts.org";

interface OFFProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  code?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  nova_group?: number;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    sugars_100g?: number;
    salt_100g?: number;
  };
  categories_tags?: string[];
  countries_tags?: string[];
}

interface ImportCategory {
  offCategory: string;
  label: string;
  mealCategoryName: string;
  isDrink: boolean;
  isReadyMeal: boolean;
  audience: "adult" | "baby" | "child";
  isFreezerEligible: boolean;
  mealFormat: string;
  drinkType?: string | null;
}

const IMPORT_CATEGORIES: ImportCategory[] = [
  {
    offCategory: "beverages",
    label: "Drinks",
    mealCategoryName: "Drink",
    isDrink: true,
    isReadyMeal: false,
    audience: "adult",
    isFreezerEligible: false,
    mealFormat: "drink",
    drinkType: "soft",
  },
  {
    offCategory: "baby-foods",
    label: "Baby Food",
    mealCategoryName: "Baby Meal",
    isDrink: false,
    isReadyMeal: true,
    audience: "baby",
    isFreezerEligible: true,
    mealFormat: "ready-meal",
  },
  {
    offCategory: "ready-meals",
    label: "Ready Meals",
    mealCategoryName: "Dinner",
    isDrink: false,
    isReadyMeal: true,
    audience: "adult",
    isFreezerEligible: true,
    mealFormat: "ready-meal",
  },
  {
    offCategory: "frozen-foods",
    label: "Frozen Meals",
    mealCategoryName: "Frozen Meal",
    isDrink: false,
    isReadyMeal: true,
    audience: "adult",
    isFreezerEligible: true,
    mealFormat: "ready-meal",
  },
];

function cleanProductName(product: OFFProduct): string | null {
  const name = product.product_name_en || product.product_name;
  if (!name || name.trim().length < 2) return null;
  let cleaned = name.trim();
  cleaned = cleaned.replace(/\s+/g, " ");
  if (cleaned.length > 100) cleaned = cleaned.substring(0, 100);
  return cleaned;
}

function isUKProduct(product: OFFProduct): boolean {
  const countries = product.countries_tags || [];
  return countries.some(
    (c) =>
      c.includes("united-kingdom") ||
      c.includes("en:united-kingdom") ||
      c.includes("en:uk"),
  );
}

function extractIngredients(product: OFFProduct): string[] {
  const text = product.ingredients_text_en || product.ingredients_text;
  if (!text) return [];
  return text
    .split(/[,;]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0 && i.length < 100)
    .slice(0, 30);
}

async function fetchOFFCategory(
  category: string,
  limit: number,
  prioritiseUK: boolean = true,
): Promise<OFFProduct[]> {
  const results: OFFProduct[] = [];
  const seen = new Set<string>();
  let page = 1;
  const maxPages = Math.ceil((limit * 3) / 24);

  while (results.length < limit && page <= maxPages) {
    try {
      const url = `${BASE_URL}/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(category)}&sort_by=unique_scans_n&page_size=24&page=${page}&json=1`;
      const response = await fetch(url, {
        headers: { "User-Agent": "SmartMealPlanner/1.0 (contact@smartmealplanner.com)" },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        log(`OFF API error ${response.status} for ${category} page ${page}`, "import");
        break;
      }

      const data = await response.json();
      const products = (data.products || []) as OFFProduct[];

      if (products.length === 0) break;

      for (const product of products) {
        if (results.length >= limit) break;

        const name = cleanProductName(product);
        if (!name) continue;

        const key = `${name.toLowerCase()}|${(product.brands || "").toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (prioritiseUK && !isUKProduct(product) && page <= 3) continue;

        if (product.nova_group && product.nova_group >= 1) {
          results.push(product);
        }
      }

      page++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      log(`OFF fetch error for ${category} page ${page}: ${err}`, "import");
      break;
    }
  }

  if (results.length < limit) {
    page = 1;
    while (results.length < limit && page <= maxPages) {
      try {
        const url = `${BASE_URL}/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(category)}&sort_by=unique_scans_n&page_size=24&page=${page}&json=1`;
        const response = await fetch(url, {
          headers: { "User-Agent": "SmartMealPlanner/1.0 (contact@smartmealplanner.com)" },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) break;
        const data = await response.json();
        const products = (data.products || []) as OFFProduct[];
        if (products.length === 0) break;

        for (const product of products) {
          if (results.length >= limit) break;

          const name = cleanProductName(product);
          if (!name) continue;

          const key = `${name.toLowerCase()}|${(product.brands || "").toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);

          if (product.nova_group && product.nova_group >= 1) {
            results.push(product);
          }
        }

        page++;
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        break;
      }
    }
  }

  return results;
}

async function getCategoryMap(): Promise<Map<string, number>> {
  const categories = await db.select().from(mealCategories);
  return new Map(categories.map((c) => [c.name, c.id]));
}

async function getExistingBarcodes(): Promise<Set<string>> {
  const existing = await db
    .select({ barcode: meals.barcode })
    .from(meals);
  return new Set(existing.filter((m) => m.barcode).map((m) => m.barcode!));
}

async function getExistingNameBrands(): Promise<Set<string>> {
  const existing = await db
    .select({ name: meals.name, brand: meals.brand })
    .from(meals);
  return new Set(
    existing.map((m) => `${m.name.toLowerCase()}|${(m.brand || "").toLowerCase()}`),
  );
}

export interface ImportResult {
  category: string;
  fetched: number;
  imported: number;
  skipped: number;
  errors: number;
}

export async function importGlobalMeals(
  limits?: Partial<Record<string, number>>,
): Promise<ImportResult[]> {
  const defaultLimits: Record<string, number> = {
    beverages: 100,
    "baby-foods": 100,
    "ready-meals": 200,
    "frozen-foods": 100,
  };

  const activeLimits = { ...defaultLimits, ...limits };
  const results: ImportResult[] = [];

  const categoryMap = await getCategoryMap();
  const existingBarcodes = await getExistingBarcodes();
  const existingNameBrands = await getExistingNameBrands();

  for (const cat of IMPORT_CATEGORIES) {
    const limit = activeLimits[cat.offCategory] || 50;
    const result: ImportResult = {
      category: cat.label,
      fetched: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    };

    log(`Importing ${cat.label} (limit: ${limit})...`, "import");

    try {
      const products = await fetchOFFCategory(cat.offCategory, limit);
      result.fetched = products.length;

      for (const product of products) {
        try {
          const name = cleanProductName(product);
          if (!name) {
            result.skipped++;
            continue;
          }

          const brand = product.brands?.split(",")[0]?.trim() || "";

          if (product.code && existingBarcodes.has(product.code)) {
            result.skipped++;
            continue;
          }
          const nameBrandKey = `${name.toLowerCase()}|${brand.toLowerCase()}`;
          if (existingNameBrands.has(nameBrandKey)) {
            result.skipped++;
            continue;
          }

          const categoryId = categoryMap.get(cat.mealCategoryName) || null;
          const brandName = product.brands?.split(",")[0]?.trim() || null;
          const imageUrl = product.image_front_url || product.image_url || null;
          const ingredients = extractIngredients(product);

          const [insertedMeal] = await db
            .insert(meals)
            .values({
              userId: SYSTEM_USER_ID,
              name,
              ingredients: ingredients.length > 0 ? ingredients : [name],
              instructions: [],
              servings: 1,
              categoryId,
              isReadyMeal: cat.isReadyMeal,
              isSystemMeal: true,
              mealFormat: cat.mealFormat,
              mealSourceType: "openfoodfacts",
              dietTypes: [],
              isFreezerEligible: cat.isFreezerEligible,
              audience: cat.audience,
              isDrink: cat.isDrink,
              drinkType: cat.drinkType || null,
              barcode: product.code || null,
              brand: brandName,
              imageUrl,
            })
            .returning();

          if (product.code) existingBarcodes.add(product.code);
          existingNameBrands.add(nameBrandKey);

          const n = product.nutriments;
          if (n && insertedMeal) {
            await db.insert(nutrition).values({
              mealId: insertedMeal.id,
              calories: n["energy-kcal_100g"]
                ? `${Math.round(n["energy-kcal_100g"])} kcal`
                : null,
              protein: n.proteins_100g
                ? `${n.proteins_100g.toFixed(1)}g`
                : null,
              carbs: n.carbohydrates_100g
                ? `${n.carbohydrates_100g.toFixed(1)}g`
                : null,
              fat: n.fat_100g ? `${n.fat_100g.toFixed(1)}g` : null,
              sugar: n.sugars_100g
                ? `${n.sugars_100g.toFixed(1)}g`
                : null,
              salt: n.salt_100g ? `${n.salt_100g.toFixed(1)}g` : null,
            });
          }

          result.imported++;
        } catch (err) {
          result.errors++;
          log(
            `Error importing product: ${err instanceof Error ? err.message : err}`,
            "import",
          );
        }
      }
    } catch (err) {
      log(
        `Error fetching ${cat.label}: ${err instanceof Error ? err.message : err}`,
        "import",
      );
    }

    log(
      `${cat.label}: fetched=${result.fetched}, imported=${result.imported}, skipped=${result.skipped}, errors=${result.errors}`,
      "import",
    );
    results.push(result);
  }

  return results;
}

export async function getImportStatus(): Promise<{
  totalImported: number;
  byCategory: Record<string, number>;
}> {
  const imported = await db
    .select()
    .from(meals)
    .where(
      and(eq(meals.isSystemMeal, true), eq(meals.mealSourceType, "openfoodfacts")),
    );

  const byCategory: Record<string, number> = {
    drinks: 0,
    babyMeals: 0,
    readyMeals: 0,
    frozenMeals: 0,
  };

  for (const meal of imported) {
    if (meal.isDrink) byCategory.drinks++;
    else if (meal.audience === "baby") byCategory.babyMeals++;
    else if (meal.isFreezerEligible && meal.isReadyMeal) byCategory.readyMeals++;
    else byCategory.frozenMeals++;
  }

  return { totalImported: imported.length, byCategory };
}
