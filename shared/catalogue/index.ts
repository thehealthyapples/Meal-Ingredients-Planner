// WS0.10 — Global Food Catalogue pipeline exports.

export type {
  USDAFood,
  USDADataType,
  USDANutrient,
  CatalogueNutrients,
  ConfidenceLevel,
  IngestionAction,
  CatalogueIngestionResult,
  IngestionReport,
} from "./types";

export { USDA_NUTRIENT_IDS } from "./types";

export {
  US_TO_UK_MAP,
  cleanUSDADescription,
  resolveAlias,
} from "./alias-resolver";

export { mapCategory } from "./category-mapper";

export {
  scoreConfidence,
  extractNutrients,
  countPresentNutrients,
} from "./confidence-scorer";

export { checkForDuplicate, nameToSlug } from "./deduplicator";

export { ingestFood, ingestBatch } from "./pipeline";

export { TEST_FOODS_50 } from "./test-foods";

// WS0.12 — normalisation + promotion readiness
export type { NameQuality, NameNormalisation } from "./name-normaliser";
export { normaliseName } from "./name-normaliser";

export type { PreparedFoodCheck } from "./prepared-food-filter";
export { checkPreparedFood, BLOCK_TOKENS, ALLOW_LIST } from "./prepared-food-filter";

export type { MacroSource, MacroResolution } from "./macro-fallback";
export { resolveMacros, SR_LEGACY_MACROS } from "./macro-fallback";

export type {
  PromotionStage,
  PromotionInput,
  PromotionReadiness,
  QueueItem,
  RankedQueueItem,
} from "./promotion-readiness";
export { scorePromotionReadiness, rankPromotionQueue } from "./promotion-readiness";
