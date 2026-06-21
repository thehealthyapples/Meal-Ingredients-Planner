// WS0.10 — Confidence Scorer.
//
// Assigns high / medium / low to a candidate catalogue entry based on
// how complete and unambiguous the data is. This is honest, not decorative:
//   high   → all key fields present, no conflicts, category mapped cleanly
//   medium → minor gaps or ambiguity — human spot-check recommended
//   low    → significant gaps or uncertainty — human review required
//
// Scoring is points-based: max 100 points.
// high = 75+, medium = 50–74, low = <50.

import type { CatalogueNutrients, ConfidenceLevel } from "./types";

export interface ConfidenceScore {
  level: ConfidenceLevel;
  points: number;
  reasons: string[];
}

interface ScoringInput {
  hasNutrients: boolean;
  nutrientCount: number;        // how many of the 5 key nutrients are present
  categoryMapped: boolean;      // USDA category resolved to a THA category
  subcategoryMapped: boolean;   // subcategory resolved (not just "ambiguous")
  aliasResolved: boolean;       // matched an existing canonical food
  scientificNamePresent: boolean;
  nameIsUKEnglish: boolean;     // US→UK translation was applied (slightly penalise — more uncertainty)
  isIngredientLevel: boolean;   // Foundation or SR Legacy (not Branded)
}

export function scoreConfidence(input: ScoringInput): ConfidenceScore {
  let points = 0;
  const reasons: string[] = [];

  // Nutrient completeness (max 35 points)
  const nutrientPoints = Math.min(35, input.nutrientCount * 7);
  points += nutrientPoints;
  if (input.nutrientCount === 5) {
    reasons.push("All 5 key nutrients present (+35)");
  } else if (input.nutrientCount > 0) {
    reasons.push(`${input.nutrientCount}/5 key nutrients present (+${nutrientPoints})`);
  } else {
    reasons.push("No nutrient data (-35 opportunity lost)");
  }

  // Category mapping (max 25 points)
  if (input.categoryMapped && input.subcategoryMapped) {
    points += 25;
    reasons.push("Category + subcategory mapped cleanly (+25)");
  } else if (input.categoryMapped) {
    points += 15;
    reasons.push("Category mapped, subcategory ambiguous (+15)");
  } else {
    reasons.push("Category not mapped (-25 opportunity lost)");
  }

  // Ingredient level data (20 points — Foundation/SR Legacy, not Branded)
  if (input.isIngredientLevel) {
    points += 20;
    reasons.push("Ingredient-level data source (+20)");
  } else {
    reasons.push("Not ingredient-level (branded/survey) — should not reach pipeline");
  }

  // Scientific name (10 points)
  if (input.scientificNamePresent) {
    points += 10;
    reasons.push("Scientific name present (+10)");
  }

  // Alias resolution match — already exists, so this scores differently
  // (aliasResolved means it MATCHED existing, so this result is "matched_existing" not "create")
  // We still score it for confidence reporting purposes.
  if (input.aliasResolved) {
    points += 10;
    reasons.push("Alias resolved to existing canonical food (+10, action: matched_existing)");
  }

  // UK English penalty — US name was translated, more uncertainty about correct THA name
  if (!input.nameIsUKEnglish) {
    points -= 5;
    reasons.push("US English name translated to UK — name normalisation required (-5)");
  }

  const level: ConfidenceLevel = points >= 75 ? "high" : points >= 50 ? "medium" : "low";

  return { level, points, reasons };
}

export function extractNutrients(foodNutrients: Array<{ nutrient: { id: number }; amount: number }>): CatalogueNutrients {
  const get = (id: number) => foodNutrients.find((n) => n.nutrient.id === id)?.amount;
  return {
    energyKcal: get(1008),
    proteinG: get(1003),
    fatG: get(1004),
    carbsG: get(1005),
    fibreG: get(1079),
  };
}

export function countPresentNutrients(nutrients: CatalogueNutrients): number {
  return [nutrients.energyKcal, nutrients.proteinG, nutrients.fatG, nutrients.carbsG, nutrients.fibreG]
    .filter((v) => v !== undefined && v !== null)
    .length;
}
