import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Meal } from "@shared/schema";
import type { FullWeek } from "@/lib/planner-types";
import type { WeekMealEntry } from "@/components/PlantDiversityReport";

// Mirror of the planner's active-week persistence so a standalone page can
// resolve the same week without inheriting planner local state.
// (weekly-planner-page.tsx: ACTIVE_WEEK_KEY / loadActiveWeek)
const ACTIVE_WEEK_KEY = "planner:active-week";
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function loadActiveWeek(): string {
  try {
    const raw = localStorage.getItem(ACTIVE_WEEK_KEY);
    if (!raw) return "1";
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string" && /^[1-9]\d*$/.test(parsed)) return parsed;
    return "1";
  } catch {
    return "1";
  }
}

export interface UseWeekMealEntriesResult {
  weekMeals: WeekMealEntry[];
  isLoading: boolean;
  activeWeek: string;
  hasWeek: boolean;
}

/**
 * Resolves the active week's meals as WeekMealEntry[] — the same shape the
 * planner builds for the plant diversity report — but sourced independently via
 * the shared react-query caches (`/api/planner/full`, `/api/meals`). This keeps
 * the Plant Diversity Report page deep-linkable and decoupled from planner
 * component state. Read-only; writes no data.
 */
export function useWeekMealEntries(): UseWeekMealEntriesResult {
  const activeWeek = loadActiveWeek();

  const { data: fullPlanner = [], isPending: plannerLoading } = useQuery<FullWeek[]>({
    queryKey: ["/api/planner/full"],
  });
  const { data: meals = [], isPending: mealsLoading } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
  });

  const mealById = useMemo(
    () => new Map(meals.map((m) => [m.id, m])),
    [meals],
  );

  const activeWeekData = useMemo(
    () => fullPlanner.find((w) => w.weekNumber === Number(activeWeek)),
    [fullPlanner, activeWeek],
  );

  const weekMeals = useMemo<WeekMealEntry[]>(() => {
    if (!activeWeekData) return [];
    const result: WeekMealEntry[] = [];
    for (const day of activeWeekData.days) {
      const dayName = DAY_SHORT[day.dayOfWeek];
      for (const entry of day.entries) {
        const meal = mealById.get(entry.mealId);
        if (meal?.ingredients?.length) {
          result.push({ mealName: meal.name, dayName, ingredients: meal.ingredients });
        }
      }
    }
    return result;
  }, [activeWeekData, mealById]);

  return {
    weekMeals,
    isLoading: plannerLoading || mealsLoading,
    activeWeek,
    hasWeek: !!activeWeekData,
  };
}
