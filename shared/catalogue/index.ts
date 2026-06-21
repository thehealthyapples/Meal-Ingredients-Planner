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
