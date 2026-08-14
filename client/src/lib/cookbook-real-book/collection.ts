import type { Meal } from "@shared/schema";
import { BROWSABLE_SHELVES, shelfForMeal, type CookbookShelf } from "@shared/cookbook/curation";

export type CookbookShelfFilter = CookbookShelf | "all";
export type CookbookSourceFilter = "all" | "cookbook" | "freezer" | "kitchen" | "saved-web" | "internet" | "packaged" | "drinks";

export function filterCookbookMealsBySource(
  meals: readonly Meal[],
  source: CookbookSourceFilter,
  activeFreezerMealIds: ReadonlySet<number>,
): Meal[] {
  if (source === "internet") return [];
  if (source === "freezer") return meals.filter((meal) => activeFreezerMealIds.has(meal.id));
  if (source === "all") return [...meals];

  const shelf: CookbookShelf = source === "cookbook"
    ? "household"
    : source === "saved-web"
      ? "web"
      : source;
  return meals.filter((meal) => shelfForMeal(meal) === shelf);
}

export function filterCookbookMeals(
  meals: readonly Meal[],
  query: string,
  shelf: CookbookShelfFilter,
): Meal[] {
  const needle = query.trim().toLowerCase();
  return meals.filter((meal) => {
    const mealShelf = shelfForMeal(meal);
    if (mealShelf === "retired" || meal.mealSourceType === "planner-placeholder" || meal.variantKind === "household_safe") return false;
    if (shelf !== "all" && mealShelf !== shelf) return false;
    if (!needle) return true;
    return `${meal.name} ${(meal.ingredients ?? []).join(" ")}`.toLowerCase().includes(needle);
  });
}

export function paginateCookbookMeals(meals: readonly Meal[], page: number, pageSize: number): Meal[] {
  if (page < 0 || pageSize < 1) return [];
  return meals.slice(page * pageSize, (page + 1) * pageSize);
}

export function cookbookShelfFilters(): readonly CookbookShelf[] {
  return BROWSABLE_SHELVES;
}
