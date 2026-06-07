import { storage } from "../storage";
import type { ExternalMealCandidate } from "./external-meal-service";
import { scrapeRecipeFromUrl } from "./recipe-scraper";

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

