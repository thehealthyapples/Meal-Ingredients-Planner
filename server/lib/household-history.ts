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
 * new fact: no score, no threshold, no ranking.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONV1 P9 / BEH-5 — THE FABRICATOR IS RETIRED. `date` is real, or it is null.
 * ─────────────────────────────────────────────────────────────────────────────
 * This docblock used to say: *"`date` is the same deliberate approximation it has always
 * been (planner weeks carry a week number, not a date), and the engines downstream use it
 * only for recency ordering."* **Every clause of that was wrong.**
 *
 *   • It was not an approximation. It was `now − (weeksAgo × 7 + max(0, 6 − dayOfWeek))`,
 *     which reduces to `reportedDay = (now.getDay() + dayOfWeek + 1) mod 7` — **the
 *     weekday it produced was the day the household opened the app.** Right on Saturdays,
 *     wrong the other six days, and carrying no information about the household at all.
 *   • Planner weeks DO carry a date now: `planner_weeks.weekStartDate` (CONV1 P7 / SCH-2).
 *   • The engines do NOT use it only for recency ordering. `stories()` says *"Friday
 *     became curry night"* from `e.date.getDay()`; it gates favourites on 180 days;
 *     `seasonalStories()` windows a whole season by it. All of it was arithmetic on
 *     fiction (CONV1 BEH-5 — *"the platform states invented facts about a household's
 *     life in the household's own voice"*).
 *
 * **The rule now: an entry is dated only if its week is anchored.** The date is that
 * week's Monday plus the day's own offset in the household's Monday-first week — a lookup
 * over facts the household authored, never arithmetic over an assumption. `maxWeek` and
 * `now` are gone: this function no longer reads a clock, because nothing about a
 * household's planned history depends on when you ask.
 *
 * **A week with no anchor yields UNDATED entries, permanently** (HT7 — the anchor is
 * written only at creation and never back-filled). Their food identity is still true and
 * still flows to `discover()`, which needs no calendar; only claims about WHEN go quiet.
 * That is `null` doing its job (`isDated`), and it is the honest answer for the households
 * whose weeks predate the anchor.
 */

import { storage } from "../storage";
import { parseIngredient as parseIngredientShared } from "@shared/parse-ingredient";
import { singularizeIngredientKey } from "@shared/normalize";
import { MONDAY_FIRST_ORDER, parseCivilDate } from "@shared/time/household-time";
import type { HouseholdHistory, MealEntry } from "../../shared/stories/types";

/**
 * The real date of a planner day, or `null` when THA cannot know it.
 *
 * EXPORTED so its own test can exercise THIS function rather than a copy of it. That is
 * not incidental to this phase: P9 exists because a derivation was duplicated (§ 14 target
 * 5), and a test that re-implements the code under test is the same defect wearing a
 * lab coat — the copy drifts, and the test passes against fiction. (It very nearly did:
 * the first draft of the suite re-implemented this with `split("-").map(Number)` and so
 * disagreed with the real function about malformed input.)
 *
 * `weekStartDate` is the MONDAY the household's week opens on. `dayOfWeek` is the
 * planner's declared key space — `0 = Sunday … 6 = Saturday` (HT8), never renumbered — so
 * the day's offset from that Monday is its position in the household's Monday-first week,
 * which is `MONDAY_FIRST_ORDER`'s to declare and not this file's to assume. Monday → +0;
 * Sunday → +6, the day the week closes.
 */
export function plannerEntryDate(weekStartDate: string | null, dayOfWeek: number): Date | null {
  if (weekStartDate == null) return null;
  const monday = parseCivilDate(weekStartDate);
  if (monday == null) return null;
  const offset = MONDAY_FIRST_ORDER.indexOf(dayOfWeek as (typeof MONDAY_FIRST_ORDER)[number]);
  if (offset < 0) return null;
  // UTC noon: a civil date carries no zone, and midnight arithmetic lands on the previous
  // day under any negative offset — the ±12h class of bug CONV1 P6 retired from the diary.
  return new Date(Date.UTC(monday.year, monday.month - 1, monday.day, 12) + offset * 86_400_000);
}

export async function buildHouseholdHistory(userId: number): Promise<HouseholdHistory> {
  const weeks = await storage.getPlannerWeeks(userId);
  if (!weeks.length) return { entries: [] };

  const entries: MealEntry[] = [];

  for (const week of weeks) {
    const days = await storage.getPlannerDays(week.id);

    for (const day of days) {
      const dayEntries = await storage.getPlannerEntriesForDay(day.id);
      const entryDate = plannerEntryDate(week.weekStartDate, day.dayOfWeek);

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
            date: entryDate,
            mealSlot: slot,
            source: "planned",
          });
        }
      }
    }
  }

  return { entries };
}
