/**
 * household-planner-week.ts — CONV1 P8 / READ-3
 * =============================================
 * THE ONE ANSWER to "which planner week is this household living in?".
 *
 * Before this file, THA had FIVE answers and none of them was a computation:
 *
 *   server  routes.ts `/api/home/intelligence` → reduce(max weekNumber) ≡ 6
 *   server  opportunity-engine.ts              → reduce(max weekNumber) ≡ 6
 *   server  household-nutrition-assembler.ts   → last of sorted weeks   ≡ 6
 *   client  dashboard.tsx                      → plannerFull[0]         ≡ 1
 *   client  home-experience-page.tsx           → localStorage           ≡ 1
 *
 * `max(weekNumber)` is *"a constant wearing the costume of a computation"* (TIME1 § 3.1):
 * all six weeks are created eagerly at first touch and the API bounds them at 6, so the
 * "current week" was the number six — a fact about `createPlannerWeeks`, never about the
 * household (HOME3 § 4). The client's was the number one, for the same kind of reason.
 * **They are not close and they never converge**, and the proof was Home, rendering Week 1's
 * dinners twenty-one lines above Week 6's plant count (`BEH-3`).
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE IS, AND IS NOT
 * ---------------------------------------------------------------------------
 * It is a **thin I/O orchestrator over a pure core** — the split this codebase already
 * uses for the opportunity engine, the notice gateway and the nutrition assembler. It
 * fetches the two facts Household Time needs and hands them to the owner:
 *
 *   households.timeZone         (Domain 16 — CONV1 P5 / SCH-1)
 *   planner_weeks.weekStartDate (Domain 14 — CONV1 P7 / SCH-2)
 *          ↓
 *   resolvePlannerWeek(householdToday(now, zone), weeks)   ← shared/time/household-time.ts
 *
 * **It owns no rule.** It does not decide where a week starts, what "this week" means, or
 * what today is — all three are the module's (HT1). It reads the clock so the module never
 * has to (HT5). It stores nothing (HT3).
 *
 * **It is not a second owner of household time.** If this file ever computes a week
 * boundary, compares two dates, or picks a week when the module says it cannot, it has
 * become the sixth rival and the gate `ht-one-planner-week-owner` should fail.
 *
 * ---------------------------------------------------------------------------
 * `anchored: false` IS AN ANSWER — AND CALLERS MAY NOT INVENT ONE (HT6)
 * ---------------------------------------------------------------------------
 * **192 of THA's 195 households are unanchored, and under HT7 they always will be**: the
 * anchor is written only at week creation and never back-filled, and their weeks were
 * created before it existed. So for every household that exists today, this function
 * truthfully answers *"I do not know which week this is."*
 *
 * **That is not an error, and it is not a gap to be papered over with a fallback.**
 * Governed by the user's decision of 2026-07-17 (CONV1 P8's report § 3) and by
 * THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 13.1 as amended in the same change:
 *
 *   > Home must never imply certainty where none exists. Every Home card must resolve
 *   > from the same canonical planner state. If no anchor exists, Home honestly
 *   > communicates that the planner is not yet anchored, rather than mixing data from
 *   > different fallback weeks. This is not an error state — it is the expected
 *   > first-run experience until a canonical anchor exists.
 *
 * **A caller that answers `anchored: false` by substituting week 6, or week 1, or "the
 * latest", has re-created the defect this file exists to retire** — and `BEH-3` forbids it
 * by name: *"Do not pick a week to fix it."* The honest shapes already existed in three of
 * the five consumers (`weeklyProgress: null`, `UNAVAILABLE`, no planner opportunities), which
 * is the clearest evidence available that absence was always the right answer.
 *
 * The one legitimate route to anchoring an existing week is **the household declaring it**
 * (TIME1 § 6.2) — an extension point, not built, and not this file's to invent.
 */

import { eq } from "drizzle-orm";

import { households, type PlannerWeek as PlannerWeekRow } from "@shared/schema";
import {
  DECLARED_DEFAULT_ZONE,
  householdToday,
  parseCivilDate,
  resolvePlannerWeek,
  type CivilDate,
  type IANAZone,
} from "@shared/time/household-time";

import { db } from "../db";
import { getHouseholdForUser } from "./household";

/**
 * The resolution, carrying the household's actual planner row rather than the module's
 * structural view of it — consumers need `week.id` to read days and entries.
 *
 * Deliberately mirrors `PlannerWeekResolution` (HT6) instead of collapsing it to
 * `PlannerWeekRow | null`: a caller must be able to tell "no rota at all" from "a rota
 * nobody dated" from "you are past the end of your six slots", because those are three
 * different things to say to a household and only one of them is a first run.
 */
export type HouseholdPlannerWeek =
  | {
      anchored: true;
      week: PlannerWeekRow;
      relation: "this" | "next" | "past" | "ahead";
      /**
       * The household's civil today — the same one the week was resolved against.
       *
       * Carried here rather than left for the caller to recompute, because HT11 is
       * exact: *all of it, or none of it*. A consumer that took the week from this
       * resolution and then derived its own day would be comparing the household
       * against two calendars at once — which is how Home came to render Week 1's
       * meals against a device's Saturday. One clock read, one zone fetch, one
       * answer: the day and the week cannot disagree.
       */
      today: CivilDate;
    }
  | { anchored: false; reason: "no-anchor" | "window-expired" | "no-weeks"; today: CivilDate };

/** The household's zone, or the declared default. Resolved at READ time, never written (CP8). */
async function zoneOf(userId: number): Promise<IANAZone> {
  const householdId = await getHouseholdForUser(userId);
  const household = await db.query.households.findFirst({ where: eq(households.id, householdId) });
  return household?.timeZone ?? DECLARED_DEFAULT_ZONE;
}

/**
 * PURE. The whole of the decision, given the facts — so it is testable without a database
 * and without a clock, and so the rules stay in one place (the module) rather than being
 * re-derived per caller.
 */
export function resolveFromFacts(
  weeks: readonly PlannerWeekRow[],
  now: Date,
  zone: IANAZone,
): HouseholdPlannerWeek {
  const today = householdToday(now, zone);
  const resolution = resolvePlannerWeek(
    today,
    weeks.map((w) => ({
      weekNumber: w.weekNumber,
      weekStartDate: w.weekStartDate == null ? null : parseCivilDate(w.weekStartDate),
    })),
  );
  if (!resolution.anchored) return { anchored: false, reason: resolution.reason, today };

  // Map the module's structural answer back to the household's own row. The module is
  // deliberately blind to the database's shape, so this is the seam — and `weekNumber` is
  // unique per household by the schema's own constraint, so the lookup is exact.
  const row = weeks.find((w) => w.weekNumber === resolution.week.weekNumber);
  // Unreachable in practice: the resolution's week came from this very array. If it ever
  // fires, saying "I don't know" is the only honest answer available (HT6).
  if (!row) return { anchored: false, reason: "no-anchor", today };
  return { anchored: true, week: row, relation: resolution.relation, today };
}

/**
 * The household's current planner week, resolved from the two canonical facts.
 *
 * Reads the clock HERE so the owner never does (HT5). Every consumer of "the current
 * planner week" calls this and nothing else.
 */
export async function resolveHouseholdPlannerWeek(
  userId: number,
  weeks: readonly PlannerWeekRow[],
  now: Date = new Date(),
): Promise<HouseholdPlannerWeek> {
  return resolveFromFacts(weeks, now, await zoneOf(userId));
}
