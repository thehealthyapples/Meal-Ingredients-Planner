// WS0.10 — Global Food Catalogue ingestion types.
//
// USDAFood models the FoodData Central API response shape (Foundation + SR Legacy).
// Only ingredient-level data types are ingested (never Branded or Market Acquisition).
// CatalogueIngestionResult is the output of one food through the full pipeline.

export type USDADataType = "Foundation" | "SR Legacy" | "Survey (FNDDS)" | "Branded Food" | "Market Acquisition";

export interface USDANutrient {
  nutrient: {
    id: number;
    name: string;
    unitName: string;
  };
  amount: number;
}

export interface USDAFood {
  fdcId: number;
  description: string;
  dataType: USDADataType;
  foodCategory?: { description: string };
  scientificName?: string;
  foodNutrients: USDANutrient[];
}

// Key USDA nutrient IDs used in ingestion.
export const USDA_NUTRIENT_IDS = {
  ENERGY_KCAL: 1008,
  PROTEIN_G: 1003,
  FAT_G: 1004,
  CARBS_G: 1005,
  FIBRE_G: 1079,
} as const;

export interface CatalogueNutrients {
  energyKcal?: number;
  proteinG?: number;
  fatG?: number;
  carbsG?: number;
  fibreG?: number;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export type IngestionAction =
  | "matched_existing"   // resolved to existing canonical food — no new entry needed
  | "create_catalogue"   // new food, high/medium confidence — ready to stage
  | "review_required"    // new food, low confidence — human review needed
  | "skip";              // branded product, unusable data, or explicit exclusion

export interface CatalogueIngestionResult {
  fdcId: number;
  usdaDescription: string;
  action: IngestionAction;

  // When action = "matched_existing"
  existingSlug?: string;
  existingName?: string;
  matchType?: "slug" | "alias" | "scientific_name";

  // When action = "create_catalogue" | "review_required"
  proposedSlug?: string;
  proposedName?: string;        // UK English name
  thaCategory?: string;
  thaSubcategory?: string;
  scientificName?: string;
  sourceRef?: string;           // e.g., "USDA:167762"
  nutrients?: CatalogueNutrients;

  confidence: ConfidenceLevel;
  reasons: string[];            // human-readable scoring notes

  // WS0.12 — normalisation + promotion readiness (set on create/review actions)
  rawName?: string;             // original USDA description (before normalisation)
  nameQuality?: "auto" | "review" | "manual";
  aliasCandidates?: string[];   // harvested aliases (parentheticals + original)
  macroFallbackUsed?: boolean;  // a missing key macro was completed from fallback
  macroSource?: string;         // dominant macro provenance for reporting
  promotionScore?: number;      // 0..100 promotion readiness
  promotionStage?: "ready_for_canonical" | "ready_for_claude_authoring" | "needs_tha_review";

  // WS0.12 — prepared-food skip
  preparedToken?: string;       // when action="skip" due to a composite-dish token
}

export interface IngestionReport {
  total: number;
  matchedExisting: number;
  createCatalogue: number;
  reviewRequired: number;
  skipped: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  results: CatalogueIngestionResult[];
}
