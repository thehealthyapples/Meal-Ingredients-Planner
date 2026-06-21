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
import { resolveAlias } from "./alias-resolver";
import { mapCategory } from "./category-mapper";
import { scoreConfidence, extractNutrients, countPresentNutrients } from "./confidence-scorer";
import { checkForDuplicate, nameToSlug } from "./deduplicator";
import { checkPreparedFood } from "./prepared-food-filter";
import { normaliseName } from "./name-normaliser";
import { resolveMacros } from "./macro-fallback";
import { scorePromotionReadiness } from "./promotion-readiness";

const SKIP_DATA_TYPES = new Set(["Branded Food", "Market Acquisition", "Survey (FNDDS)"]);

export function ingestFood(food: USDAFood): CatalogueIngestionResult {
  // Filter 1: ingredient-level only
  if (SKIP_DATA_TYPES.has(food.dataType)) {
    return {
      fdcId: food.fdcId,
      usdaDescription: food.description,
      action: "skip",
      confidence: "low",
      reasons: [`Skipped: dataType="${food.dataType}" is not ingredient-level`],
    };
  }

  // Filter 2 (WS0.12): prepared/composite-dish blocklist — moved from the
  // acquisition script into the pipeline so any source self-protects. Runs on
  // the RAW description before normalisation so no composite slips on a clean name.
  const prepared = checkPreparedFood(food.description);
  if (prepared.isPrepared) {
    return {
      fdcId: food.fdcId,
      usdaDescription: food.description,
      action: "skip",
      confidence: "low",
      preparedToken: prepared.matchedToken ?? undefined,
      reasons: [`Skipped: ${prepared.reason}`],
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

  // Step 4: Name normalisation (WS0.12) — produce a human THA display name from
  // the raw USDA description and harvest alias candidates.
  const norm = normaliseName(food.description);

  // Step 5: Nutrient extraction + macro fallback (WS0.12).
  // Foundation values are authoritative; only MISSING key macros are completed.
  const foundationNutrients = extractNutrients(food.foodNutrients);
  const macro = resolveMacros(foundationNutrients, norm.normalisedName, categoryResult.thaCategory);
  const nutrients = macro.nutrients;
  const nutrientCount = countPresentNutrients(nutrients);

  // Step 6: Confidence scoring
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

  // Step 7: Promotion readiness (WS0.12).
  const categoryMapped = categoryResult.thaCategory !== "Other";
  const subcategoryMapped = categoryResult.confidence !== "ambiguous" && categoryResult.thaSubcategory !== null;
  const promotion = scorePromotionReadiness({
    nameQuality: norm.quality,
    categoryMapped,
    subcategoryMapped,
    macrosPresent: nutrientCount,
    aliasesResolved: norm.aliasCandidates.length > 1,
    scientificNamePresent: !!food.scientificName,
  });

  const allReasons = [
    `Name: "${food.description}" → "${norm.normalisedName}" [${norm.quality}, ${norm.pattern}]`,
    `Category: ${categoryResult.reason}`,
    ...macro.notes,
    ...score.reasons,
    `Promotion: ${promotion.score}/100 → ${promotion.stage}`,
  ];

  const action = score.level === "low" ? "review_required" : "create_catalogue";
  const dominantMacroSource = macro.fallbackUsed
    ? (Object.values(macro.provenance).includes("sr_legacy") ? "sr_legacy" : "derived_pure_fat")
    : "foundation";

  return {
    fdcId: food.fdcId,
    usdaDescription: food.description,
    action,
    proposedSlug: nameToSlug(norm.normalisedName),
    proposedName: norm.normalisedName,
    thaCategory: categoryResult.thaCategory,
    thaSubcategory: categoryResult.thaSubcategory ?? undefined,
    scientificName: food.scientificName,
    sourceRef: `USDA:${food.fdcId}`,
    nutrients,
    confidence: score.level,
    reasons: allReasons,
    rawName: food.description,
    nameQuality: norm.quality,
    aliasCandidates: norm.aliasCandidates,
    macroFallbackUsed: macro.fallbackUsed,
    macroSource: dominantMacroSource,
    promotionScore: promotion.score,
    promotionStage: promotion.stage,
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
