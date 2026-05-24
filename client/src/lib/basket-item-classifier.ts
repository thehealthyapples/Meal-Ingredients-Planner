import { getIngredientDef } from "./ingredient-catalogue";
export {
  deriveAppleScoreTrustState,
  canShowAuthoritativeAppleScore,
  getUnresolvedScoreLabel,
  type AppleScoreTrustState,
  type AppleScoreGateInput,
} from "@shared/apple-score-trust";
import { canShowAuthoritativeAppleScore } from "@shared/apple-score-trust";

const WHOLE_FOOD_CATEGORIES = new Set(["produce", "fruit", "eggs"]);

type ClassifiableItem = {
  itemType?: string | null;
  category?: string | null;
  normalizedName?: string | null;
  productName?: string | null;
};

export function classifyItem(item: ClassifiableItem): "whole_food" | "packaged" {
  if (item.itemType === "whole_food" || item.itemType === "packaged") {
    return item.itemType;
  }

  const lookupName = item.normalizedName || item.productName || "";
  const def = getIngredientDef(lookupName);
  if (def) return def.itemType;

  if (item.category && WHOLE_FOOD_CATEGORIES.has(item.category.toLowerCase())) {
    return "whole_food";
  }

  return "packaged";
}

export function isWholeFood(item: ClassifiableItem): boolean {
  return classifyItem(item) === "whole_food";
}

/**
 * Client-side Apple Score visibility gate.
 *
 * Extends the canonical trust gate with name-based whole-food detection so
 * items like "Granny Smith apples" (itemType not yet persisted) display their
 * score correctly even when autoSmp didn't back-fill itemType.
 *
 * Use this on all client display surfaces instead of canShowAuthoritativeAppleScore.
 */
export function canShowScoreForItem(
  item: ClassifiableItem & {
    resolutionState?: string | null;
    matchedProductId?: string | null;
  },
): boolean {
  if (isWholeFood(item)) return true;
  return canShowAuthoritativeAppleScore(item);
}
