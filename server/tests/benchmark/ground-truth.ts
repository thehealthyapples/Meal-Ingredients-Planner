/**
 * ground-truth.ts — JUDGE_LIVE3
 * ===============================
 * Resolves ONE real snapshot of the acting household's own stored data, read
 * directly from `storage` (the same precedent BENCH-G2's `resolveActiveRestrictions`
 * already set: a side-channel the scorer reads, never the Companion's own seam).
 *
 * Why this exists: the judge is asked to grade D1 Factual Correctness — "is
 * everything the turn asserted true against the household's deterministic data"
 * (SCORING_FRAMEWORK §1) — but until now it was given no data to check a claim
 * against, only a one-line category label (`evidenceExpected`). A specific,
 * correct claim ("You are following a Keto diet pattern") was therefore
 * indistinguishable from a fabrication, and the judge reproducibly scored it 0.
 * This module gives the judge the real household facts so it can actually verify.
 *
 * Resolved ONCE per run (household data does not change mid-run) and handed to
 * every judge call for every question — bounded in size (slices below) so token
 * cost stays predictable regardless of how large a real household's data is.
 */

import { storage } from "../../storage.js";

export interface HouseholdGroundTruth {
  readonly dietary: Awaited<ReturnType<typeof storage.getHouseholdDietaryContext>> | null;
  readonly cookbookMeals: ReadonlyArray<{
    readonly id: number;
    readonly name: string;
    readonly isReadyMeal: boolean;
    readonly isSystemMeal: boolean;
    readonly suitableSlots: readonly string[];
  }>;
  readonly shoppingList: ReadonlyArray<{
    readonly name: string;
    readonly quantity: number | null;
    readonly unit: string | null;
    readonly checked: boolean;
  }>;
  readonly pantryItems: ReadonlyArray<{ readonly name: string }>;
  readonly recentDiaryEntries: ReadonlyArray<{ readonly date: string; readonly mealSlot: string; readonly name: string }>;
  readonly plannerThisWeek: ReadonlyArray<{ readonly dayOfWeek: number; readonly mealType: string; readonly mealName: string | null }>;
}

const MAX_MEALS = 60;
const MAX_SHOPPING = 60;
const MAX_PANTRY = 80;
const MAX_DIARY = 40;

/** Build one real, read-only ground-truth snapshot for `userId`. Never throws —
 *  each source degrades to empty/null independently so one failing query never
 *  blanks out the whole snapshot. */
export async function buildHouseholdGroundTruth(userId: number): Promise<HouseholdGroundTruth> {
  const [dietary, meals, shopping, pantry, diary, week] = await Promise.all([
    storage.getHouseholdDietaryContext(userId).catch(() => null),
    storage.getMealsSummary(userId).catch(() => []),
    storage.getShoppingListItems(userId).catch(() => []),
    storage.getPantryItems(userId).catch(() => []),
    storage.getDiaryEntriesForDiscovery(userId).catch(() => []),
    storage.getCurrentDatedPlannerWeek(userId).catch(() => null),
  ]);

  let plannerThisWeek: HouseholdGroundTruth["plannerThisWeek"] = [];
  if (week) {
    const [entries, days] = await Promise.all([
      storage.getPlannerEntriesForWeek(week.id).catch(() => []),
      storage.getPlannerDays(week.id).catch(() => []),
    ]);
    const dayOfWeekById = new Map(days.map((d) => [d.id, d.dayOfWeek]));
    const mealNameById = new Map(meals.map((m) => [m.id, m.name]));
    plannerThisWeek = entries.map((e) => ({
      dayOfWeek: dayOfWeekById.get(e.dayId) ?? -1,
      mealType: e.mealType,
      mealName: e.mealId != null ? mealNameById.get(e.mealId) ?? null : null,
    }));
  }

  return {
    dietary,
    cookbookMeals: meals.slice(0, MAX_MEALS).map((m) => ({
      id: m.id, name: m.name, isReadyMeal: m.isReadyMeal, isSystemMeal: m.isSystemMeal, suitableSlots: m.suitableSlots,
    })),
    shoppingList: shopping.slice(0, MAX_SHOPPING).map((s) => ({
      name: s.productName, quantity: s.quantityValue, unit: s.unit, checked: s.checked,
    })),
    pantryItems: pantry.slice(0, MAX_PANTRY).map((p) => ({ name: p.displayName ?? p.ingredientKey })),
    recentDiaryEntries: diary.slice(0, MAX_DIARY).map((d) => ({ date: d.date, mealSlot: d.mealSlot, name: d.name })),
    plannerThisWeek,
  };
}
