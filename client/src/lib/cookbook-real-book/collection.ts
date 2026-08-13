import type { Meal } from "@shared/schema";
import { BROWSABLE_SHELVES, shelfForMeal, type CookbookShelf } from "@shared/cookbook/curation";

export type CookbookShelfFilter = CookbookShelf | "all";

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
