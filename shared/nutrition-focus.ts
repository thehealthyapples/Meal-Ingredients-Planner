/**
 * Voluntary, food-oriented nutrition focuses a person asks THA to keep in mind.
 * These are preferences for food selection, not nutrient targets, diagnoses,
 * restrictions, or claims about what the person currently consumes.
 */
export const NUTRITION_FOCUS_OPTIONS = [
  { id: "protein", label: "More protein-rich foods", aliases: ["protein", "protein-rich", "protein rich"] },
  { id: "iron", label: "More iron-rich foods", aliases: ["iron", "iron-rich", "iron rich"] },
  { id: "fibre", label: "More fibre-rich foods", aliases: ["fibre", "fiber", "fibre-rich", "fiber-rich", "fibre rich", "fiber rich"] },
  { id: "calcium", label: "More calcium-rich foods", aliases: ["calcium", "calcium-rich", "calcium rich"] },
  { id: "potassium", label: "More potassium-rich foods", aliases: ["potassium"] },
  { id: "magnesium", label: "More magnesium-rich foods", aliases: ["magnesium"] },
  { id: "zinc", label: "More zinc-rich foods", aliases: ["zinc"] },
  { id: "iodine", label: "More iodine-rich foods", aliases: ["iodine"] },
  { id: "selenium", label: "More selenium-rich foods", aliases: ["selenium"] },
  { id: "vitamin-a", label: "More vitamin A-rich foods", aliases: ["vitamin a", "vitamin-a"] },
  { id: "vitamin-c", label: "More vitamin C-rich foods", aliases: ["vitamin c", "vitamin-c"] },
  { id: "vitamin-d", label: "More vitamin D-rich foods", aliases: ["vitamin d", "vitamin-d", "vitamin d-rich", "vitamin d rich"] },
  { id: "vitamin-b12", label: "More vitamin B12-rich foods", aliases: ["vitamin b12", "vitamin-b12", "b12"] },
  { id: "vitamin-b6", label: "More vitamin B6-rich foods", aliases: ["vitamin b6", "vitamin-b6", "b6"] },
  { id: "omega-3", label: "More omega-3-rich foods", aliases: ["omega 3", "omega-3", "omega three"] },
  { id: "folate", label: "More folate-rich foods", aliases: ["folate"] },
  { id: "vitamin-e", label: "More vitamin E-rich foods", aliases: ["vitamin e", "vitamin-e"] },
  { id: "vitamin-k", label: "More vitamin K-rich foods", aliases: ["vitamin k", "vitamin-k"] },
] as const;

export type NutritionFocusId = (typeof NUTRITION_FOCUS_OPTIONS)[number]["id"];

export function nutritionFocusLabel(id: string): string | undefined {
  return NUTRITION_FOCUS_OPTIONS.find((item) => item.id === id)?.label;
}

export function matchNutritionFocus(text: string): NutritionFocusId | undefined {
  const normalized = text.toLocaleLowerCase().replace(/[–—]/g, "-").trim();
  const matches = NUTRITION_FOCUS_OPTIONS.flatMap((item) =>
    item.aliases.some((alias) => new RegExp(`(?:^|\\b)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\b)`, "i").test(normalized))
      ? [item.id]
      : [],
  );
  const unique = [...new Set(matches)];
  return unique.length === 1 ? unique[0] : undefined;
}
