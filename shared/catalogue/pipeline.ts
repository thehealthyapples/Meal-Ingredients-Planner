// WS0.10 — Catalogue Ingestion Pipeline.
//
// Composes all pipeline stages in order:
//
//   USDAFood
//     → filter (ingredient-level only, skip branded)
//     → alias resolver (US→UK name, check existing canonical)
//     → deduplicator (slug / alias / scientific name check)
//     → category mapper (USDA category → THA category)
//     → confidence scorer (data completeness)
//     → CatalogueIngestionResult
//
// A food exits the pipeline with one of four actions:
//   "matched_existing"  — alias/slug/scientific name matched an existing canonical food
//   "create_catalogue"  — new food, confidence high/medium, ready to stage as tier=catalogue
//   "review_required"   — new food, confidence low, human review needed before staging
//   "skip"              — branded product, zero nutrient data, or explicit exclusion

import type { USDAFood, CatalogueIngestionResult, IngestionReport } from "./types";
import { USDA_NUTRIENT_IDS } from "./types";
import { resolveAlias } from "./alias-resolver";
import { mapCategory } from "./category-mapper";
import { scoreConfidence, extractNutrients, countPresentNutrients } from "./confidence-scorer";
import { checkForDuplicate, nameToSlug } from "./deduplicator";

const SKIP_DATA_TYPES = new Set(["Branded Food", "Market Acquisition", "Survey (FNDDS)"]);

export function ingestFood(food: USDAFood): CatalogueIngestionResult {
  // Filter: ingredient-level only
  if (SKIP_DATA_TYPES.has(food.dataType)) {
    return {
      fdcId: food.fdcId,
      usdaDescription: food.description,
      action: "skip",
      confidence: "low",
      reasons: [`Skipped: dataType="${food.dataType}" is not ingredient-level`],
    };
  }

  // Step 1: Alias resolver — US→UK name + canonical lookup
  const aliasResult = resolveAlias(food.description);

  // Step 2: Deduplication — slug, alias, scientific name axes
  const dedup = checkForDuplicate(aliasResult.resolvedName, food.scientificName);

  if (dedup.isDuplicate) {
    return {
      fdcId: food.fdcId,
      usdaDescription: food.description,
      action: "matched_existing",
      existingSlug: dedup.existingSlug ?? undefined,
      existingName: aliasResult.resolvedName,
      matchType: dedup.matchAxis ?? undefined,
      confidence: "high",
      reasons: [`Matched existing canonical food via ${dedup.matchAxis}: "${dedup.existingSlug}"`],
    };
  }

  // Step 3: Category mapping
  const categoryResult = mapCategory(
    food.foodCategory?.description,
    aliasResult.resolvedName,
    food.scientificName,
  );

  // Step 4: Nutrient extraction
  const nutrients = extractNutrients(food.foodNutrients);
  const nutrientCount = countPresentNutrients(nutrients);

  // Step 5: Confidence scoring
  const score = scoreConfidence({
    hasNutrients: nutrientCount > 0,
    nutrientCount,
    categoryMapped: categoryResult.thaCategory !== "Other",
    subcategoryMapped: categoryResult.confidence !== "ambiguous" && categoryResult.thaSubcategory !== null,
    aliasResolved: false,      // not a duplicate match — new food
    scientificNamePresent: !!food.scientificName,
    nameIsUKEnglish: !aliasResult.wasTranslated,
    isIngredientLevel: true,
  });

  const allReasons = [
    `Category: ${categoryResult.reason}`,
    ...score.reasons,
  ];

  const action = score.level === "low" ? "review_required" : "create_catalogue";

  return {
    fdcId: food.fdcId,
    usdaDescription: food.description,
    action,
    proposedSlug: nameToSlug(aliasResult.resolvedName),
    proposedName: aliasResult.resolvedName,
    thaCategory: categoryResult.thaCategory,
    thaSubcategory: categoryResult.thaSubcategory ?? undefined,
    scientificName: food.scientificName,
    sourceRef: `USDA:${food.fdcId}`,
    nutrients,
    confidence: score.level,
    reasons: allReasons,
  };
}

export function ingestBatch(foods: USDAFood[]): IngestionReport {
  const results = foods.map(ingestFood);

  const report: IngestionReport = {
    total: results.length,
    matchedExisting: results.filter((r) => r.action === "matched_existing").length,
    createCatalogue: results.filter((r) => r.action === "create_catalogue").length,
    reviewRequired: results.filter((r) => r.action === "review_required").length,
    skipped: results.filter((r) => r.action === "skip").length,
    highConfidence: results.filter((r) => r.confidence === "high").length,
    mediumConfidence: results.filter((r) => r.confidence === "medium").length,
    lowConfidence: results.filter((r) => r.confidence === "low").length,
    results,
  };

  return report;
}
