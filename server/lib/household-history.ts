/**
 * Household History (NTC-P2)
 * ==========================
 * Builds the `HouseholdHistory` — the household's own planned-meal history — that
 * every `shared/` narrative engine (`stories()`, `seasonalStories()`, `discover()`)
 * takes as its input.
 *
 * WHY THIS MODULE EXISTS. This function was a closure inside `registerRoutes`, reachable
 * only by an Express handler in `server/routes.ts`. That is exactly the shape of problem
 * NTC-P2 exists to fix: a canonical derivation that only one caller can reach grows a
 * second copy the moment a second caller needs it. The Notice Engine's gateway needs
 * this history, and it is not a route.
 *
 * Nothing about the derivation changed in the move — it is the WS2 function, verbatim,
 * given a module of its own so it can have more than one honest caller.
 *
 * PURE OVER STORAGE. It reads existing planner tables through `storage` and computes no
 * new fact: no score, no threshold, no ranking. `date` is the same deliberate
 * approximation it has always been (planner weeks carry a week number, not a date), and
 * the engines downstream use it only for recency ordering.
 */

import { storage } from "../storage";
import { parseIngredient as parseIngredientShared } from "@shared/parse-ingredient";
import { singularizeIngredientKey } from "@shared/normalize";
import type { HouseholdHistory, MealEntry } from "../../shared/stories/types";

export async function buildHouseholdHistory(userId: number): Promise<HouseholdHistory> {
  const weeks = await storage.getPlannerWeeks(userId);
  if (!weeks.length) return { entries: [] };

  const now = new Date();
  const maxWeek = Math.max(...weeks.map((w) => w.weekNumber));
  const entries: MealEntry[] = [];
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  for (const week of weeks) {
    const days = await storage.getPlannerDays(week.id);
    const weeksAgo = maxWeek - week.weekNumber;

    for (const day of days) {
      const dayEntries = await storage.getPlannerEntriesForDay(day.id);
      // dayOfWeek: 0 = Monday in plannerDays convention; shift so recent days are closer to now
      const approxDate = new Date(
        now.getTime() - (weeksAgo * 7 + Math.max(0, 6 - day.dayOfWeek)) * MS_PER_DAY,
      );

      for (const entry of dayEntries) {
        const meal = await storage.getMeal(entry.mealId);
        if (!meal) continue;
        const slot =
          entry.mealType === "snacks"
            ? "snack"
            : ["breakfast", "lunch", "dinner"].includes(entry.mealType)
              ? (entry.mealType as "breakfast" | "lunch" | "dinner")
              : undefined;

        for (const rawIng of meal.ingredients) {
          const parsed = parseIngredientShared(rawIng);
          const foodSlug = singularizeIngredientKey(parsed.normalizedName);
          entries.push({
            food: foodSlug,
            foodName: parsed.productName,
            mealName: meal.name,
            date: approxDate,
            mealSlot: slot,
            source: "planned",
          });
        }
      }
    }
  }

  return { entries };
}
