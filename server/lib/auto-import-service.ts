import { storage as defaultStorage } from "../storage";
import type { ExternalMealCandidate } from "./external-meal-service";
import { scrapeRecipeFromUrl } from "./recipe-scraper";
import {
  getPolicyForSourceLabel,
  mayPersistFromSource,
  mayFetchSourceContent,
} from "@shared/recipe-acquisition";

export interface AutoImportResult {
  mealId: number;
  mealTemplateId: number;
  name: string;
  source: string;
}

// Subset of the storage surface autoImportExternalMeal depends on. Declared so the
// shell-to-meal metadata write-path can be unit-tested with a fake (no DB needed).
type AutoImportStorage = Pick<
  typeof defaultStorage,
  | "getMeals"
  | "getMealTemplateByName"
  | "createMealTemplate"
  | "updateMealTemplateId"
  | "createMeal"
  | "applyTemplateMetadataToMeal"
>;

export async function autoImportExternalMeal(
  candidate: ExternalMealCandidate,
  userId: number,
  storage: AutoImportStorage = defaultStorage,
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

    // FS3 acquisition policy gate: only candidates from a registered source
    // whose storage policy is "import" may be persisted. Unregistered sources
    // (including client-supplied "Unknown") and link-only/forbidden sources are
    // refused — closes FS2 C2. Internal THA sources ("Meal Shell") are owned
    // and always persistable.
    const policy = getPolicyForSourceLabel(candidate.source);
    if (!mayPersistFromSource(policy)) {
      console.warn(
        `[AutoImport] Refused to persist "${candidate.name}" — source "${candidate.source}" has no import right (policy: ${policy ? `${policy.licenceState}/${policy.storagePolicy}` : "unregistered"})`,
      );
      return null;
    }

    let ingredients = candidate.ingredients;
    let instructions = candidate.instructions;

    if (candidate.sourceUrl && ingredients.length === 0 && mayFetchSourceContent(policy)) {
      const scraped = await scrapeRecipeFromUrl(candidate.sourceUrl);
      if (scraped) {
        ingredients = scraped.ingredients;
        instructions = scraped.instructions.length > 0 ? scraped.instructions : instructions;
      }
    }

    if (ingredients.length === 0) {
      ingredients = [`${candidate.name} (ingredients to be added)`];
    }

    // Honest provenance (fixes FS2 C2-a): externally acquired content is never
    // labelled "scratch". THA-owned internal sources keep the legacy "scratch"
    // value for compatibility; the acquisition columns carry the truth either way.
    const isOwned = policy!.licenceState === "owned";
    const meal = await storage.createMeal(userId, {
      name: candidate.name,
      ingredients,
      instructions: instructions.length > 0 ? instructions : [],
      imageUrl: candidate.image || undefined,
      sourceUrl: candidate.sourceUrl || undefined,
      mealSourceType: isOwned ? "scratch" : "smart_import",
      acquisitionLane: policy!.lane,
      acquisitionType: isOwned ? "authored" : "licensed_import",
      acquisitionSourceKey: policy!.sourceKey,
      licenceRef: policy!.licenceRef,
      attributionText: policy!.attributionText,
    });

    let template = await storage.getMealTemplateByName(candidate.name);
    if (!template) {
      template = await storage.createMealTemplate({
        name: candidate.name,
        category: candidate.category || "dinner",
      });
    }

    await storage.updateMealTemplateId(meal.id, template.id);

    // Copy template metadata (styleTags / suitableSlots / primarySlot / energyBand)
    // onto the new meal row. For shell-recovery applies the resolved template is the
    // shell template carrying full Hybrid Meal Occasion metadata, so the created meal
    // renders chips and slot info in Planner Meal Card V2. External candidates resolve
    // to a bare template (empty metadata) and harmlessly write empty defaults.
    const persisted = await storage.applyTemplateMetadataToMeal(meal.id, template);

    return {
      mealId: persisted?.id ?? meal.id,
      mealTemplateId: template.id,
      name: meal.name,
      source: candidate.source,
    };
  } catch (err) {
    console.error(`Auto-import failed for "${candidate.name}":`, err);
    return null;
  }
}

