import type { Meal } from "@shared/schema";
import type { FullDay } from "@/lib/planner-types";

export interface PlanToShoppingReviewItem {
  key: string;
  dayName: string;
  mealName: string;
  slotName: string;
  exactPantryMatches: string[];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function exactNameKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
}

export function buildPlanToShoppingReview(
  days: FullDay[],
  meals: Meal[],
  pantryNames: string[] = [],
): PlanToShoppingReviewItem[] {
  const mealById = new Map(meals.map((meal) => [meal.id, meal]));
  const pantryByKey = new Map(pantryNames.map((name) => [exactNameKey(name), name.trim()]));

  return days
    .slice()
    .sort((a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7))
    .flatMap((day) => day.entries
      .slice()
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .map((entry) => {
        const meal = mealById.get(entry.mealId);
        const exactPantryMatches = Array.from(new Set((meal?.ingredients ?? [])
          .map((ingredient) => pantryByKey.get(exactNameKey(ingredient)))
          .filter((name): name is string => Boolean(name))));

        return {
          key: String(entry.id),
          dayName: DAY_NAMES[day.dayOfWeek] ?? "Day",
          mealName: meal?.name ?? "Saved meal unavailable",
          slotName: entry.isDrink ? "Drink" : entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1),
          exactPantryMatches,
        };
      }),
    );
}
