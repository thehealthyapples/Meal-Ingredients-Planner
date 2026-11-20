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
import type { MealSummary } from "@shared/schema";

export interface HouseholdGroundTruth {
  /**
   * JUDGE_LIVE5 — the two facts a judge otherwise has to guess and gets wrong:
   * WHICH person is asking (a question phrased "do I have..." is about this
   * user, not necessarily every household member — live-caught on PH-002,
   * where the judge flagged a correct personal answer as wrong because a
   * DIFFERENT household member carries the restriction), and WHAT "today" is
   * (a planner question needs a real calendar date, not a bare 0-6 index the
   * judge has to assume — live-caught on PL-024, where the judge's own
   * rationale said "assuming today is Monday").
   */
  readonly requesterUserId: number;
  readonly todayDate: string;
  readonly dietary: Awaited<ReturnType<typeof storage.getHouseholdDietaryContext>> | null;
  /**
   * JUDGE_LIVE6 — real, UNCAPPED totals alongside the (necessarily capped,
   * below) sample arrays. Without these, a judge asked to verify a "how many
   * X do I have" claim only ever sees up to the slice limit and has no way
   * to confirm a true count above it — a fully correct answer ("you have
   * 1,021 meals") was reproducibly scored as fabricated (D2=0) because the
   * capped `cookbookMeals` sample (and, before this fix, ITS OWN-MEALS-ONLY
   * query) could never contain more than a fraction of the real total.
   * These totals are exact counts straight from storage, own + system
   * deduplicated by id exactly as the live meals capability does.
   */
  readonly cookbookMealTotal: number;
  readonly ownCookbookMealTotal: number;
  readonly systemCookbookMealTotal: number;
  readonly shoppingListTotal: number;
  readonly pantryItemTotal: number;
  readonly recentDiaryEntryTotal: number;
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
  readonly plannerThisWeek: ReadonlyArray<{ readonly date: string; readonly dayOfWeek: number; readonly mealType: string; readonly mealName: string | null }>;
}

const MAX_MEALS = 60;
const MAX_SHOPPING = 60;
const MAX_PANTRY = 80;
const MAX_DIARY = 40;

/** Pure civil-date math on plain "YYYY-MM-DD" strings — no timezone involved,
 *  matching how `weekStartDate` is itself stored. */
function addIsoDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Build one real, read-only ground-truth snapshot for `userId`. Never throws —
 *  each source degrades to empty/null independently so one failing query never
 *  blanks out the whole snapshot. */
export async function buildHouseholdGroundTruth(userId: number): Promise<HouseholdGroundTruth> {
  const [dietary, ownMeals, systemMeals, shopping, pantry, diary, week] = await Promise.all([
    storage.getHouseholdDietaryContext(userId).catch(() => null),
    storage.getMealsSummary(userId).catch(() => []),
    storage.getSystemMealsSummary().catch(() => []),
    storage.getShoppingListItems(userId).catch(() => []),
    storage.getPantryItems(userId).catch(() => []),
    storage.getDiaryEntriesForDiscovery(userId).catch(() => []),
    storage.getCurrentDatedPlannerWeek(userId).catch(() => null),
  ]);

  // Own + system, deduplicated by id — mirrors how the live meals capability merges them
  // (meals-read-handler.ts) so the ground-truth total matches what the Companion can see.
  const seenMealIds = new Set<number>();
  let ownCookbookMealTotal = 0;
  let systemCookbookMealTotal = 0;
  const meals: MealSummary[] = [];
  for (const m of [...ownMeals, ...systemMeals]) {
    if (seenMealIds.has(m.id)) continue;
    seenMealIds.add(m.id);
    meals.push(m);
    if (m.isSystemMeal) systemCookbookMealTotal++;
    else ownCookbookMealTotal++;
  }

  let plannerThisWeek: HouseholdGroundTruth["plannerThisWeek"] = [];
  if (week) {
    const [entries, days] = await Promise.all([
      storage.getPlannerEntriesForWeek(week.id).catch(() => []),
      storage.getPlannerDays(week.id).catch(() => []),
    ]);
    const dayOfWeekById = new Map(days.map((d) => [d.id, d.dayOfWeek]));
    const mealNameById = new Map(meals.map((m) => [m.id, m.name]));
    plannerThisWeek = entries.map((e) => {
      const dayOfWeek = dayOfWeekById.get(e.dayId) ?? -1;
      return {
        date: dayOfWeek >= 0 && week.weekStartDate ? addIsoDays(week.weekStartDate, dayOfWeek) : "unknown",
        dayOfWeek,
        mealType: e.mealType,
        mealName: e.mealId != null ? mealNameById.get(e.mealId) ?? null : null,
      };
    });
  }

  return {
    requesterUserId: userId,
    todayDate: todayIsoDate(),
    dietary,
    cookbookMealTotal: ownCookbookMealTotal + systemCookbookMealTotal,
    ownCookbookMealTotal,
    systemCookbookMealTotal,
    shoppingListTotal: shopping.length,
    pantryItemTotal: pantry.length,
    recentDiaryEntryTotal: diary.length,
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
