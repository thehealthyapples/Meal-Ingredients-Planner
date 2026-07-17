// CONV1 P6 (Phase 3) — the ONE time-of-day greeting.
//
// THE RETIREMENT (THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 14, target 3: "getGreeting()
// copies — two live (boundary 17), two in prototypes (boundary 18) — 4 → 1"):
//
//   client/src/pages/dashboard.tsx                    getGreeting()        12 / 17
//   client/src/components/HomeIntelligenceCompanion.tsx  getGreeting()     12 / 17
//   client/src/pages/dev/arrival-a-welcome.tsx        timeOfDayGreeting()  12 / 18
//   client/src/pages/dev/arrival-s1-quiet.tsx         timeOfDayGreeting()  12 / 18
//
// All four read `new Date().getHours()` — THE DEVICE's hour. A phone left on US
// time said "Good evening" to a household eating breakfast in London. The hour is
// now the HOUSEHOLD's, derived by the one owner of household time from their zone
// (HT1). The 17-vs-18 divergence is settled on the boundary the module DECLARES —
// 17, which is what the live surfaces already do, so no household's greeting
// changes (migration principle 1: the old behaviour is the floor).
//
// ── WHAT THIS FILE IS NOT ──────────────────────────────────────────────────────
//
// It is NOT the owner of these words. INT21 (the Behaviour Engine) is the single
// owner of every word the Companion says, and its § 9 growth path already schedules
// their retirement:
//
//   "CP3 — Retire the last three client-side voiced strings (§8.5). The home-page
//    time-of-day greeting ... needs registry content and a route to reach it."
//
// CP3 is a separately gated workstream and INT21 § 9 states plainly that "nothing
// below is authorised by this document". So P6 converges the CLOCK and leaves the
// VOICE exactly where it found it: the three strings below are byte-identical to
// the ones shipping today. This creates no second voice — it collapses four
// grandfathered copies into one, which is the debt INT21 § 10 names as
// "scheduled by §9, not precedent", and it makes CP3 cheaper: one site to retire
// instead of four.
//
// THE NEXT CHANGE TO THIS FILE SHOULD BE ITS DELETION, by CP3.

import { householdPhase, type IANAZone, type PhaseOfDay } from "@shared/time/household-time";

/**
 * The greeting words, byte-identical to the four copies this file retires.
 *
 * Grandfathered debt owned by INT21 and scheduled as CP3 (see above). Do not add
 * a fourth phase, a personality variant, or a household's name here — every one of
 * those is a voice decision, and the voice has an owner that is not this file.
 */
const GREETING_BY_PHASE: Record<PhaseOfDay, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
};

/**
 * The household's time-of-day greeting.
 *
 * `now` is a parameter rather than an ambient read, mirroring the owner's own
 * discipline (HT5) so this is testable without a clock and cannot disagree with
 * itself. The caller supplies the device's instant — which is the one thing HT12
 * lets the device supply — and the household's zone.
 *
 * A clock read here is sanctioned rather than tolerated: `THA_KEPT_ROOM_TRANSLATION.md`
 * *Morning Rhythm* § 6 — "the greeting word (morning/afternoon/evening) is a plain
 * reading of the clock in the once-a-day greeting only".
 *
 * HT13 — this aims a WORD. It must never aim a colour, token, palette, opacity,
 * theme or motion. A caller reading the phase to dim a surface has broken the
 * one-morning law, and the rule to apply is that document's § 9: STOP.
 */
export function householdGreeting(now: Date, zone: IANAZone): string {
  return GREETING_BY_PHASE[householdPhase(now, zone)];
}
