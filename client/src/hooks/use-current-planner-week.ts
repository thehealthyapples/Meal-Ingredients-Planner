/**
 * use-current-planner-week.ts — CONV1 P8 / READ-3, OWN-6
 * ======================================================
 * THE ONE CLIENT ANSWER to "which planner week is this household living in?".
 *
 * It replaces the two client-side rivals, both of which invented the answer:
 *
 *   dashboard.tsx            `plannerFull[0]`  ≡ Week 1 — the first row the API returned
 *   home-experience-page.tsx `localStorage`    ≡ Week 1 — `if (!raw) return 1`
 *
 * Neither was a household fact. `plannerFull[0]` is a fact about array order;
 * `planner:active-week` is a fact about *this device* — so one household on a phone and a
 * laptop had two current weeks, and Home rendered Week 1's dinners above Week 6's plant
 * count (`BEH-3`). HOME3 § 4 refused both by name: *"localStorage is not household state."*
 *
 * ---------------------------------------------------------------------------
 * IT DERIVES NOTHING (HT12)
 * ---------------------------------------------------------------------------
 * The week is resolved SERVER-side from the two canonical facts and read here. This hook
 * does no arithmetic, reads no clock, and picks no week — *the client renders household
 * time; it never derives it.* That includes the DAY: `todayDayOfWeek` arrives with the
 * week, from the same resolution, because Home used to choose it with `new Date().getDay()`
 * on the device (HT12) while taking the week from somewhere else entirely — two calendars,
 * one card (HT11).
 *
 * ---------------------------------------------------------------------------
 * `anchored: false` IS THE ANSWER, NOT AN ERROR, NOT A LOADING STATE
 * ---------------------------------------------------------------------------
 * **192 of THA's 195 households are unanchored and always will be** (HT7 — the anchor is
 * written only at week creation and never back-filled, and their weeks predate it). So
 * this is the *ordinary* answer, not an edge case.
 *
 * **A consumer MUST NOT fill it in.** No `?? 1`, no "latest week", no localStorage
 * fallback: `BEH-3` forbids it by name — *"do not pick a week to fix it"* — and picking one
 * is how the platform got five rivals. Render the unanchored state instead
 * (`PlannerNotYetAnchored` on Home). It is not an error state; it is the expected
 * first-run experience until a canonical anchor exists (the governing decision of
 * 2026-07-17, THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 13.1).
 */

import { useQuery } from "@tanstack/react-query";

/** The household's current planner week, or an honest statement that it is unknown. */
export type CurrentPlannerWeek =
  | {
      anchored: true;
      weekId: number;
      weekNumber: number;
      weekName: string;
      weekStartDate: string;
      relation: "this" | "next" | "past" | "ahead";
      /** The household's own day, 0 = Sunday — the planner's declared key space (HT8). */
      todayDayOfWeek: number;
    }
  | {
      anchored: false;
      /**
       * • `no-anchor`      — the household has a rota nobody dated. THE 192.
       * • `no-weeks`       — no rota at all.
       * • `window-expired` — today is past the end of their six slots (TIME1 § 6.3 — a
       *   state that has always existed and that nothing could see until the anchor).
       */
      reason: "no-anchor" | "window-expired" | "no-weeks";
    };

export const CURRENT_PLANNER_WEEK_KEY = "/api/planner/current-week";

export function useCurrentPlannerWeek(enabled = true) {
  return useQuery<CurrentPlannerWeek>({
    queryKey: [CURRENT_PLANNER_WEEK_KEY],
    enabled,
  });
}
