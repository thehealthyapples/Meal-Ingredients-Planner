import { getIngredientDef } from "./ingredient-catalogue";

const WHOLE_FOOD_CATEGORIES = new Set(["produce", "fruit", "eggs"]);

export function classifyItem(item: { itemType?: string | null; category?: string | null; normalizedName?: string | null; productName?: string | null }): "whole_food" | "packaged" {
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

export function isWholeFood(item: { itemType?: string | null; category?: string | null; normalizedName?: string | null; productName?: string | null }): boolean {
  return classifyItem(item) === "whole_food";
}
