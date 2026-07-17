// The canonical owner of THA's season rule. Built by CONV1 Phase P5 / OWN-3.
//
// Domain 11 (Seasonal Stories) is the season's declared owner in
// THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md. This file is that owner's rule,
// extracted to a LEAF so every consumer can reach it: `shared/seasonal/engine.ts`
// already imports `../discovery/engine` (which imports `./seasonal-map`) and
// `../stories/engine`, so those files importing the rule back from engine.ts would
// be a circular import. The rule therefore lives beside engine.ts, importing
// nothing. No ownership moves — Domain 11 is the owner it always was.
//
// WHY THIS FILE EXISTS (CONV1 OWN-3): the rule had THREE implementations —
//   • shared/discovery/seasonal-map.ts  — exported, 9 consumers, getMonth() 0-based
//   • shared/seasonal/engine.ts         — private, 1 consumer (itself), 1-based
//   • shared/stories/engine.ts          — private, byte-identical to the second
// The declared owner's rule was the one nobody imported, and the duplication was
// documented as a virtue ("three engines, one season truth") — which is a comment,
// not an owner. Worse than a plain copy: two expressed the same rule with DIFFERENT
// MONTH BASES, so a reviewer diffing them saw different numbers and could not tell
// they agreed. Now they agree because there is only one of them.
//
// SEASON IS NOT HOUSEHOLD TIME (HT17). This rule is GIVEN a civil date and never
// reads a clock. `shared/time/household-time.ts` supplies its INPUT and never its
// ANSWER; a season computed inside the time module would be the second owner
// Principle 2 forbids. Household Time cites this file; it does not contain it.

/**
 * The four UK meteorological seasons. Declared here, with the rule that produces
 * them, so the vocabulary and its rule cannot drift apart.
 * `shared/discovery/types.ts` and `shared/stories/types.ts` re-export this.
 */
export type UKSeason = "spring" | "summer" | "autumn" | "winter";

/** A civil date — structurally identical to `shared/time/household-time.ts`'s
 *  CivilDate, declared locally to keep this module a true leaf (it imports
 *  nothing). `month` is 1–12. */
export interface SeasonInput {
  /** 1 = January … 12 = December. */
  month: number;
}

/**
 * The season containing a civil date.
 *
 * FIXED UK meteorological seasons: Spring = Mar–May, Summer = Jun–Aug,
 * Autumn = Sep–Nov, Winter = Dec–Feb.
 *
 * Hemisphere/location awareness is deliberately deferred, and the reasoning is
 * unchanged from the implementation this converges (shared/seasonal/engine.ts's
 * own note): the entire current food catalogue and seasonal seed are UK, so a
 * Southern-hemisphere season model would point at the wrong produce anyway.
 *
 * `month` is 1-BASED — not JavaScript's 0-indexed getMonth(). The off-by-one
 * between the two retired copies is exactly why this takes a civil date and not a
 * Date: a civil date cannot be read in the wrong frame or the wrong base.
 */
export function seasonOf(date: SeasonInput): UKSeason {
  const m = date.month;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/**
 * TRANSITIONAL — the season of a JavaScript Date, read in the PROCESS-LOCAL frame.
 *
 * ⚠️ This is the frame every season consumer uses today, and it is why CONV1 OWN-3
 * records that "the season is currently a property of WHERE THA IS DEPLOYED, not of
 * the household" — on the wrong side of a month boundary, "at its best right now"
 * is false. This adapter preserves that behaviour EXACTLY (migration principle 1:
 * the old behaviour is the floor, nothing regresses), while collapsing the three
 * rival implementations into one. It is honest about the frame instead of hiding it
 * in three places.
 *
 * RETIREMENT: Phase 3 (CONV1 P6 — "pantry season input", architecture § 10). Each
 * consumer converges to `seasonOf(householdToday(now, zone))` and this adapter is
 * deleted. It is NOT retired in P5: converging a consumer is P6's work, and a
 * half-converged consumer compares the household against two calendars at once
 * (HT11). Nothing is deleted before its replacement is live (architecture § 14).
 */
export function seasonOfLocalDate(date: Date): UKSeason {
  return seasonOf({ month: date.getMonth() + 1 });
}
