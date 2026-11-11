/**
 * Read-only projection of quantities already written in recipes placed in a
 * planner week. This derives no household serving size and never estimates a
 * missing amount.
 */
import { parseIngredient, normalizeName } from "../../lib/ingredient-utils.js";

export interface PlannerIngredientAnalysisInput {
  readonly dayOfWeek: number;
  readonly meals: readonly {
    readonly entryId: number;
    readonly mealName: string | null;
    readonly ingredients: readonly string[];
  }[];
}

export interface PlannerIngredientQuantityTotal {
  readonly quantity: number;
  /** `g`, `ml`, or `each`; incompatible units are never combined. */
  readonly unit: string;
  readonly formatted: string;
}

export interface PlannerIngredientAnalysis {
  readonly query: string;
  readonly status: "complete" | "partial" | "unavailable" | "no-match";
  /** Ingredient quantities as each planned recipe is written; no serving scaling. */
  readonly basis: "recipe-amounts-as-written";
  readonly matchingMealCount: number;
  readonly matchingLineCount: number;
  readonly unreadableMealCount: number;
  readonly unquantifiedLineCount: number;
  readonly totals: readonly PlannerIngredientQuantityTotal[];
  readonly byDay: readonly {
    readonly dayOfWeek: number;
    readonly totals: readonly PlannerIngredientQuantityTotal[];
  }[];
}

interface ParsedMatch {
  readonly dayOfWeek: number;
  readonly entryId: number;
  readonly quantity: number | null;
  readonly unit: string | null;
}

function parseNumericQuantity(raw: number): number | null {
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return raw;
}

function formatQuantity(quantity: number): string {
  return Number(quantity.toFixed(2)).toString();
}

function summarize(
  rows: readonly ParsedMatch[],
  dayOfWeek?: number,
): PlannerIngredientQuantityTotal[] {
  const sums = new Map<string, number>();
  for (const row of rows) {
    if (row.quantity === null || row.unit === null) continue;
    if (dayOfWeek !== undefined && row.dayOfWeek !== dayOfWeek) continue;
    sums.set(row.unit, (sums.get(row.unit) ?? 0) + row.quantity);
  }
  return [...sums.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([unit, quantity]) => {
      const formattedValue = formatQuantity(quantity);
      return {
        quantity: Number(formattedValue),
        unit,
        formatted: `${formattedValue} ${unit}`,
      };
    });
}

/**
 * Find recipe ingredient lines that name the requested ingredient and add only
 * quantities whose units are compatible. Incomplete recipe text is surfaced
 * as partial/unavailable rather than rounded into a false total.
 */
export function analyzePlannerIngredient(
  days: readonly PlannerIngredientAnalysisInput[],
  query: string,
): PlannerIngredientAnalysis {
  const cleanQuery = query.trim();
  const normalizedQuery = normalizeName(cleanQuery);
  const unreadableMealCount = days.flatMap((day) => day.meals).filter((meal) => meal.mealName === null).length;
  if (!cleanQuery || !normalizedQuery) {
    return {
      query: cleanQuery,
      status: "unavailable",
      basis: "recipe-amounts-as-written",
      matchingMealCount: 0,
      matchingLineCount: 0,
      unreadableMealCount,
      unquantifiedLineCount: 0,
      totals: [],
      byDay: [],
    };
  }

  const matches: ParsedMatch[] = [];
  for (const day of days) {
    for (const meal of day.meals) {
      for (const rawLine of meal.ingredients) {
        const parsed = parseIngredient(rawLine);
        const normalizedName = normalizeName(parsed.name);
        const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (!new RegExp(`(?:^| )${escapedQuery}(?:$| )`).test(normalizedName)) continue;
        const quantity = parseNumericQuantity(parsed.quantity);
        // The shared recipe parser converts mass to grams and volume to ml.
        // Keep each/unknown units separate; never convert volume to mass.
        const unit = parsed.unit === "g" || parsed.unit === "ml" ? parsed.unit :
          parsed.unit === "unit" ? "each" : parsed.unit;
        matches.push({
          dayOfWeek: day.dayOfWeek,
          entryId: meal.entryId,
          quantity,
          unit: quantity === null ? null : unit,
        });
      }
    }
  }

  const matchingMealCount = new Set(matches.map((match) => match.entryId)).size;
  const unquantifiedLineCount = matches.filter((match) => match.quantity === null).length;
  const totals = summarize(matches);
  const status = matches.length === 0
    ? unreadableMealCount > 0 ? "unavailable" : "no-match"
    : unquantifiedLineCount > 0 || unreadableMealCount > 0 ? "partial" : "complete";

  return {
    query: cleanQuery,
    status,
    basis: "recipe-amounts-as-written",
    matchingMealCount,
    matchingLineCount: matches.length,
    unreadableMealCount,
    unquantifiedLineCount,
    totals,
    byDay: [...new Set(matches.map((match) => match.dayOfWeek))]
      .sort((a, b) => a - b)
      .map((dayOfWeek) => ({ dayOfWeek, totals: summarize(matches, dayOfWeek) })),
  };
}
