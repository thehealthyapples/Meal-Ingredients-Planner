// TIME3 Phase 1 — the canonical owner of household time.
//
// Governing architecture: docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md
// (in force since 2026-07-16; rules HT1–HT18). Built by CONV1 Phase P5 / OWN-4.
//
// This module owns the RULES of household time and NONE of its data (HT1). It is a
// pure, zero-I/O reference vocabulary beside the entity spine — the class
// ARCHITECTURE_PRINCIPLES.md Principle 5 records, and the Source of Truth Register's
// Appendix A already records for ATTN1 (shared/attention/index.ts) and DEC1
// (shared/attention/decision.ts): no table, no cache, no column, no DB owner.
//
// THE ONE QUESTION IT ANSWERS: what time is it for this household?
// Twenty domains ask it today; none of them is entitled to answer it.
//
// The two facts it reads are supplied by callers and owned elsewhere (HT2):
//   • households.timeZone          → Domain 16 (added by CONV1 P5 / SCH-1)
//   • planner_weeks.weekStartDate  → Domain 14 (NOT YET BUILT — Phase 4 / SCH-2)
// Nothing derived here is ever stored (HT3): today, this week, the phase and the
// current planner week are derivations. A column or cache holding one would be the
// permanent sync bridge Principle 7 forbids.
//
// WHAT THIS MODULE MUST NEVER DO (architecture § 5 — as binding as what it owns):
//   • Own the season. It supplies the season rule's INPUT (a civil date), never its
//     ANSWER (HT17). The season rule is shared/seasonal/season-rule.ts (Domain 11).
//   • Own any user-facing word — greetings, week labels, relative phrases (INT21).
//   • Aim light. Time reaches words and doors, never a colour, token, palette,
//     opacity, theme or motion (HT13; THA_KEPT_ROOM_TRANSLATION.md Morning Rhythm § 9).
//   • Decide whether anything is said (INT20) or what surfaces (DEC1).
//   • Reach the model except through a Context View composed by INT17 (HT15).
//
// FIVE DOMAINS MUST NEVER CONSUME IT — a permanent verdict, not a backlog (HT10,
// architecture § 8.1): Trial/Subscription, Auth/Session, Learning/Evidence,
// Caching/TTL, and the Observation Engine (forbidden outright). A duration is not a
// date: those five are correct BECAUSE they need no calendar.
//
// No new dependency: Intl ships in Node and every browser.

/** An IANA time zone identifier, e.g. "Europe/London". */
export type IANAZone = string;

/**
 * A civil date — the date on the household's wall calendar. Has no instant, no
 * zone and no time: it is what a household means by "today". `month` is 1–12
 * (NOT JavaScript's 0-indexed getMonth(), whose off-by-one is the exact hazard
 * CONV1 OWN-3 found split across the three season implementations).
 */
export interface CivilDate {
  year: number;
  /** 1 = January … 12 = December. */
  month: number;
  /** 1–31. */
  day: number;
}

/**
 * The day-of-week key space: 0 = Sunday … 6 = Saturday.
 *
 * HT8 — DECLARED, NEVER RENUMBERED. This matches JavaScript's getDay() and every
 * live planner consumer of planner_days.dayOfWeek. Renumbering it to ISO silently
 * rotates every planner surface by one day and no test would catch it (CONV1 R9).
 * The Planner (Domain 14) stores the integer; this module declares what it means.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * The household week starts MONDAY (ISO-8601, the UK norm).
 *
 * This is the identity and display convention, and it does NOT touch the stored
 * dayOfWeek numbering above — the two coexist deliberately (HT8). The Monday-first
 * reorder map [1,2,3,4,5,6,0] is hand-rolled five times in live display code; this
 * declares what the product already decided five times locally, with no owner.
 */
export const WEEK_STARTS_ON: DayOfWeek = 1;

/** Day names indexed by the declared key space — 0 = Sunday … 6 = Saturday. */
export const DAY_NAMES: readonly string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * The Monday-first display order over the declared key space.
 * The retirement target for the nineteen week-shape declarations across sixteen
 * files (architecture § 14, target 2).
 */
export const MONDAY_FIRST_ORDER: readonly DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0] as const;

/**
 * The phase-of-day vocabulary — COARSE NAMED PHASES, NEVER A CONTINUOUS VARIABLE
 * (architecture § 4.3, honouring HOME2 § 6.3 by name).
 *
 * These three phases and their boundaries DECLARE WHAT IS ALREADY LIVE rather than
 * inventing a distinction the platform does not make: both live getGreeting()
 * copies (client/src/pages/dashboard.tsx, client/src/components/
 * HomeIntelligenceCompanion.tsx) split at 12 and 17. Two prototype copies
 * (client/src/pages/dev/arrival-*.tsx) split at 12 and 18.
 *
 * The 17-vs-18 divergence is REAL and is NOT settled here: converging the four
 * copies is Phase 3's (CONV1 P6, architecture § 14 target 3), and it is INT21 who
 * owns the words in any case. This module declares the boundary the live surfaces
 * use, so that convergence preserves today's behaviour exactly — migration
 * principle 1: the old behaviour is the floor, nothing regresses, ever.
 *
 * No fourth "night" phase is declared. Adding one would invent a distinction no
 * live surface makes and would force P6 to answer "what does THA say at night?" —
 * a product decision this phase is not entitled to take.
 */
export type PhaseOfDay = "morning" | "afternoon" | "evening";

/** The phase boundaries, in the household's own hours. Declared, not derived. */
export const PHASE_BOUNDARIES = {
  /** [0, 12) — morning. */
  afternoonStartsAtHour: 12,
  /** [12, 17) — afternoon. [17, 24) — evening. */
  eveningStartsAtHour: 17,
} as const;

/**
 * The zone THA declares when a household has not told it where it lives.
 *
 * PROVENANCE (CP8 — a DECLARED default is not fabrication; a silent one is):
 * The Healthy Apples is a UK product. Its entire food catalogue, its seasonal seed
 * and its nutrition methodology are UK (shared/discovery/seasonal-map.ts's own
 * source-of-truth declaration). Europe/London is therefore THA's declared civil
 * frame, not a guess about a household — and a household that corrects it is
 * always believed over this constant (SCH-1's correction path).
 *
 * This is NOT a fabricated fact: households.timeZone stays NULL until the household
 * or their device tells THA otherwise (HT7's posture — honest gaps over invented
 * facts). NULL means "THA has not been told", which is different from, and must
 * never be overwritten by, "THA assumed Europe/London".
 */
export const DECLARED_DEFAULT_ZONE: IANAZone = "Europe/London";

/**
 * Whether `zone` is an IANA identifier this runtime knows.
 *
 * Part of owning the time vocabulary: what counts as a zone is a rule of household
 * time, and the alternative to declaring it here is every write door hand-rolling
 * its own validation — the duplication this module exists to end. Intl is the
 * authority; the module keeps no zone list of its own to drift.
 *
 * The zone is the ONE household-time fact the client may supply (HT12: the device
 * may detect the zone at signup and may supply the instant — it may never decide
 * the day), which is exactly why it must be validated before it is stored.
 */
export function isKnownZone(zone: unknown): zone is IANAZone {
  if (typeof zone !== "string" || zone.trim() === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** A calendar week, Monday-first (ISO-8601). Derived, never stored (HT3). */
export interface CalendarWeek {
  /** The Monday that opens the week. */
  start: CivilDate;
  /** The Sunday that closes it. */
  end: CivilDate;
  /** ISO-8601 week number, 1–53. */
  isoWeek: number;
  /** The ISO week-numbering year, which may differ from start.year at a boundary. */
  isoYear: number;
}

/**
 * A planner week as this module needs to see it — a STRUCTURAL type, deliberately
 * not an import of shared/schema.ts: the module is pure and must not depend on the
 * database's shape (or on Drizzle) to stay zero-I/O and universally importable.
 *
 * `weekStartDate` is null for every planner week that exists today: the column is
 * Phase 4 (CONV1 P7 / SCH-2) and does NOT exist yet. When it lands it is written
 * ONLY at week creation and NEVER back-filled (HT7) — existing rows stay null
 * forever, because the moment of creation is the only moment THA can honestly know
 * what a week means. A back-filled anchor is approxDate with a schema (CONV1 R5).
 */
export interface PlannerWeek {
  /** 1–6. A slot label in a fixed rota — NOT a time coordinate (TIME1 § 3.1). */
  weekNumber: number;
  /** The Monday this slot means, or null when THA has never been told. */
  weekStartDate: CivilDate | null;
}

/**
 * The answer to "which planner week is this household living in?".
 *
 * `anchored: false` IS AN ANSWER, NOT AN ERROR (HT6). It is what THA must
 * truthfully say about every household that exists today, and it is the whole
 * difference between this module and the five implementations it replaces: the
 * current code cannot express "I don't know which week this is", so it guesses —
 * and the guess is indistinguishable from knowledge.
 */
export type PlannerWeekResolution =
  | { anchored: true; week: PlannerWeek; relation: "this" | "next" | "past" | "ahead" }
  | { anchored: false; reason: "no-anchor" | "window-expired" | "no-weeks" };

// ── Internal civil-date arithmetic ───────────────────────────────────────────
//
// All of it is done on a UTC-noon proxy Date. Noon, not midnight, because a civil
// date carries no zone and UTC-midnight arithmetic lands on the previous day under
// any negative offset — the exact ±12h class of bug the diary's `T12:00:00` guard
// works around today (architecture § 14, target 8). Here the proxy never escapes
// this module and never meets a zone, so it is arithmetic, not a frame.

function toProxy(date: CivilDate): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0, 0));
}

function fromProxy(proxy: Date): CivilDate {
  return {
    year: proxy.getUTCFullYear(),
    month: proxy.getUTCMonth() + 1,
    day: proxy.getUTCDate(),
  };
}

function addDays(date: CivilDate, days: number): CivilDate {
  const proxy = toProxy(date);
  proxy.setUTCDate(proxy.getUTCDate() + days);
  return fromProxy(proxy);
}

/** Whole days from `a` to `b`; negative when `b` precedes `a`. */
function daysBetween(a: CivilDate, b: CivilDate): number {
  const ms = toProxy(b).getTime() - toProxy(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** True when `date` is a real calendar date (rejects 31 February, month 13, …). */
function isValidCivilDate(date: CivilDate): boolean {
  if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day)) {
    return false;
  }
  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > 31) return false;
  const round = fromProxy(toProxy(date));
  return round.year === date.year && round.month === date.month && round.day === date.day;
}

// ── The public contract (architecture § 6) ───────────────────────────────────
//
// This is the whole of what a consumer may ask for. HT11 — ALL OF IT, OR NONE OF
// IT: a consumer that takes today() from here but keeps its own week arithmetic
// compares the household against two calendars at once, and half-converged is
// worse than unconverged.

/**
 * The date on this household's wall calendar at `now`.
 *
 * HT5 — `now` is a PARAMETER, never an ambient read. This module reads no clock.
 * That is what makes it testable without one, deterministic under replay, and
 * incapable of disagreeing with itself: there is exactly one place the instant
 * enters.
 *
 * HT6 — total. An unknown or malformed zone resolves to the instant's own UTC
 * civil date rather than throwing: UTC is the frame the instant is already in, so
 * the answer is the honest one available without a zone, and it is exactly today's
 * behaviour for every consumer that has no zone (which is all of them). An invalid
 * `now` resolves to the epoch's civil date — a stated answer, never a throw.
 */
export function householdToday(now: Date, zone: IANAZone): CivilDate {
  const instant = Number.isFinite(now?.getTime?.()) ? now : new Date(0);
  const parts = civilPartsIn(instant, zone);
  return parts ?? civilPartsInUTC(instant);
}

function civilPartsInUTC(instant: Date): CivilDate {
  return {
    year: instant.getUTCFullYear(),
    month: instant.getUTCMonth() + 1,
    day: instant.getUTCDate(),
  };
}

/** Returns null when the zone is unknown to Intl — the caller falls back to UTC. */
function civilPartsIn(instant: Date, zone: IANAZone): CivilDate | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(instant);
    const read = (type: string) => {
      const value = parts.find((p) => p.type === type)?.value;
      return value === undefined ? NaN : Number(value);
    };
    const date = { year: read("year"), month: read("month"), day: read("day") };
    if (!Number.isFinite(date.year) || !Number.isFinite(date.month) || !Number.isFinite(date.day)) {
      return null;
    }
    return date;
  } catch {
    // RangeError: an unknown IANA id. Totality (HT6) — never a throw.
    return null;
  }
}

/** The hour (0–23) on this household's clock, or the UTC hour when the zone is unknown. */
function householdHour(now: Date, zone: IANAZone): number {
  const instant = Number.isFinite(now?.getTime?.()) ? now : new Date(0);
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "2-digit",
      hourCycle: "h23",
    });
    const raw = fmt.formatToParts(instant).find((p) => p.type === "hour")?.value;
    const hour = raw === undefined ? NaN : Number(raw);
    return Number.isFinite(hour) ? hour : instant.getUTCHours();
  } catch {
    return instant.getUTCHours();
  }
}

/**
 * The day of the week for a civil date, in the DECLARED key space
 * (0 = Sunday … 6 = Saturday — HT8).
 */
export function householdDayOfWeek(date: CivilDate): DayOfWeek {
  if (!isValidCivilDate(date)) return 0;
  return toProxy(date).getUTCDay() as DayOfWeek;
}

/**
 * The Monday-first calendar week containing `date` (HT6 — total; an invalid date
 * resolves to the week of the epoch rather than throwing).
 */
export function householdWeekOf(date: CivilDate): CalendarWeek {
  const safe = isValidCivilDate(date) ? date : { year: 1970, month: 1, day: 1 };
  const dow = householdDayOfWeek(safe);
  // Sunday (0) closes the week it ends, so it is 6 days after its Monday.
  const daysSinceMonday = dow === 0 ? 6 : dow - 1;
  const start = addDays(safe, -daysSinceMonday);
  const end = addDays(start, 6);
  const { isoWeek, isoYear } = isoWeekOf(start);
  return { start, end, isoWeek, isoYear };
}

/**
 * ISO-8601 week number of the week opened by `monday`. The ISO rule: a week
 * belongs to the year containing its Thursday.
 */
function isoWeekOf(monday: CivilDate): { isoWeek: number; isoYear: number } {
  const thursday = addDays(monday, 3);
  const firstOfIsoYear = { year: thursday.year, month: 1, day: 1 };
  const days = daysBetween(firstOfIsoYear, thursday);
  return { isoWeek: Math.floor(days / 7) + 1, isoYear: thursday.year };
}

/**
 * The coarse, named phase of this household's day.
 *
 * HT13 — this may aim what THA SAYS and which door it OPENS. It may never aim a
 * colour, token, palette, opacity, theme or motion. A consumer reading this to dim
 * a surface has broken the one-morning law, and the rule to apply is
 * THA_KEPT_ROOM_TRANSLATION.md Morning Rhythm § 9: STOP.
 */
export function householdPhase(now: Date, zone: IANAZone): PhaseOfDay {
  const hour = householdHour(now, zone);
  if (hour < PHASE_BOUNDARIES.afternoonStartsAtHour) return "morning";
  if (hour < PHASE_BOUNDARIES.eveningStartsAtHour) return "afternoon";
  return "evening";
}

/**
 * Which planner week this household is living in, and how it relates to today.
 *
 * TOTAL (HT6). Every unanchored outcome is a first-class answer:
 *   • "no-weeks"       — the household has no planner rota at all.
 *   • "no-anchor"      — the rota exists but no slot carries weekStartDate. THIS IS
 *                        EVERY HOUSEHOLD TODAY, and stays true for every week
 *                        created before SCH-2 lands: anchors are never back-filled
 *                        (HT7). The caller keeps EXACTLY today's behaviour — that
 *                        is migration principle 1, and totality IS the
 *                        compatibility strategy.
 *   • "window-expired" — today is past the end of the last slot in the rota. TIME1
 *                        § 6.3's finding: the six-slot window has been silently
 *                        expiring all along and no surface could see it. What the
 *                        Planner should DO about it is a product decision TIME1
 *                        § 15.1 deliberately left open — this module makes the
 *                        state visible and does not decide what it means.
 *
 * The relations, when a week is anchored:
 *   • "this"  — today falls inside this week.
 *   • "next"  — this week opens within the 7 days after today.
 *   • "ahead" — it opens later than that.
 *   • "past"  — it closed before today, and no later slot can be located because
 *               every later slot is unanchored. It is the most recent week THA can
 *               honestly name.
 */
export function resolvePlannerWeek(
  today: CivilDate,
  weeks: readonly PlannerWeek[],
): PlannerWeekResolution {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return { anchored: false, reason: "no-weeks" };
  }
  if (!isValidCivilDate(today)) {
    return { anchored: false, reason: "no-anchor" };
  }

  // Ascending by anchor. `daysBetween(a, b)` is b − a, so the operands are
  // reversed here to give a − b: the comparator must be negative when `a` opens
  // first. (Passing them the other way sorts the rota backwards, which resolves
  // "next" to the LAST week of the rota instead of the first.)
  const anchored = weeks
    .filter((w) => w?.weekStartDate != null && isValidCivilDate(w.weekStartDate))
    .sort((a, b) => daysBetween(b.weekStartDate as CivilDate, a.weekStartDate as CivilDate));

  if (anchored.length === 0) return { anchored: false, reason: "no-anchor" };

  const containing = anchored.find((w) => {
    const offset = daysBetween(w.weekStartDate as CivilDate, today);
    return offset >= 0 && offset <= 6;
  });
  if (containing) return { anchored: true, week: containing, relation: "this" };

  const upcoming = anchored.find((w) => daysBetween(today, w.weekStartDate as CivilDate) > 0);
  if (upcoming) {
    const days = daysBetween(today, upcoming.weekStartDate as CivilDate);
    return { anchored: true, week: upcoming, relation: days <= 7 ? "next" : "ahead" };
  }

  // Today is past every anchored week. If unanchored slots remain later in the
  // rota, the most recent anchored week is still the honest answer — THA cannot
  // locate the later ones and must not invent dates for them (HT7).
  const last = anchored[anchored.length - 1];
  const laterSlotExists = weeks.some((w) => w.weekNumber > last.weekNumber);
  if (laterSlotExists) return { anchored: true, week: last, relation: "past" };

  return { anchored: false, reason: "window-expired" };
}
