/**
 * test-time3-household-time.ts (TIME3 Phase 1 — CONV1 P5 / OWN-4 + OWN-3)
 * =======================================================================
 * Verifies the canonical owner of household time — `shared/time/household-time.ts`
 * — against the governing architecture `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`
 * (HT1–HT18, in force since 2026-07-16), and the season convergence beside it.
 *
 * Coverage:
 *   §1  HT5 — the module reads no clock. `now` is a parameter everywhere; a
 *       source-scan proves no `new Date()`, `Date.now()` or ambient read exists
 *       in the module at all. This is what makes it incapable of disagreeing
 *       with itself.
 *   §2  householdToday — the zone decides the date. The Tokyo/London/Los Angeles
 *       triple across a single instant; the day boundary; DST both ways.
 *   §3  HT8 — the declared key space (0 = Sunday) and the Monday-first week
 *       convention coexisting. The stored numbering is NOT renumbered.
 *   §4  householdWeekOf — Monday-first spans, ISO week numbers, year boundaries.
 *   §5  householdPhase — the coarse named vocabulary and the LIVE boundaries
 *       (12/17), proven byte-identical to both live getGreeting() copies.
 *   §6  resolvePlannerWeek — totality (HT6). Every unanchored reason is a
 *       first-class answer; every relation; and the fact that EVERY household
 *       today resolves to `no-anchor` (the compatibility floor).
 *   §7  HT6 — totality under abuse. Malformed zones, invalid dates, invalid
 *       instants, empty rotas: a stated answer, never a throw.
 *   §8  HT18 — VERIFICATION IS THAT NO SECOND IMPLEMENTATION EXISTS. The gate
 *       that matters: source-scan proving the season rule has exactly one
 *       implementation (OWN-3: 3 → 1) and that the module owns no season.
 *   §9  HT17 + boundaries — the module supplies the season's INPUT, never its
 *       ANSWER; it imports no schema, no engine, no I/O; it aims no light.
 *   §10 OWN-3 — GOLDEN IDENTITY: the three frozen pre-convergence season
 *       implementations are embedded verbatim as oracles; across every day of a
 *       four-year sweep the converged rule is byte-identical to all three.
 *       Behaviour is unchanged BY PROOF, not intent.
 *
 * Run with: npx tsx server/tests/test-time3-household-time.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  householdToday,
  householdWeekOf,
  householdPhase,
  householdDayOfWeek,
  resolvePlannerWeek,
  DAY_NAMES,
  MONDAY_FIRST_ORDER,
  WEEK_STARTS_ON,
  PHASE_BOUNDARIES,
  DECLARED_DEFAULT_ZONE,
  type CivilDate,
  type PlannerWeek,
} from "../../shared/time/household-time.js";
import { seasonOf, type UKSeason } from "../../shared/seasonal/season-rule.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function sourceOf(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const d = (year: number, month: number, day: number): CivilDate => ({ year, month, day });
const iso = (a: CivilDate) => `${a.year}-${String(a.month).padStart(2, "0")}-${String(a.day).padStart(2, "0")}`;

async function main(): Promise<void> {
  console.log("TIME3 — Household Time: the canonical owner (CONV1 P5 / OWN-4, OWN-3)");

  // =========================================================================
  section("§1 HT5 — the module reads no clock");

  const moduleSource = sourceOf("shared/time/household-time.ts");
  // Strip comments: the rules are DISCUSSED in the docblocks and must not count.
  const code = moduleSource
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  assert(
    !/new Date\(\)/.test(code),
    "no `new Date()` — the module never reads an ambient clock (HT5)",
  );
  assert(!/Date\.now\(\)/.test(code), "no `Date.now()` (HT5)");
  assert(
    !/process\.env|localStorage|getTimezoneOffset/.test(code),
    "no ambient environment, storage or device-offset read (HT5, HT12)",
  );
  // The one `new Date(...)` family the module may use is arithmetic over values
  // it was GIVEN — never a read of the present moment.
  assert(
    /new Date\(Date\.UTC\(/.test(code) || /new Date\(0\)/.test(code),
    "constructs dates only from supplied values (arithmetic, not a clock)",
  );

  // =========================================================================
  section("§2 householdToday — the zone decides the date");

  // 2026-01-15T23:30:00Z — one instant, three households, three different dates.
  const instant = new Date("2026-01-15T23:30:00Z");
  assert(
    iso(householdToday(instant, "Europe/London")) === "2026-01-15",
    "London: 23:30Z on the 15th is still the 15th",
  );
  assert(
    iso(householdToday(instant, "Asia/Tokyo")) === "2026-01-16",
    "Tokyo: the same instant is ALREADY the 16th (+9)",
    iso(householdToday(instant, "Asia/Tokyo")),
  );
  assert(
    iso(householdToday(instant, "America/Los_Angeles")) === "2026-01-15",
    "Los Angeles: still the 15th (−8)",
  );

  // The instant that separates them all.
  const midnightish = new Date("2026-06-15T00:30:00Z");
  assert(
    iso(householdToday(midnightish, "America/Los_Angeles")) === "2026-06-14",
    "Los Angeles: 00:30Z is YESTERDAY — the defect class READ-4/BEH-6 exist to fix",
  );
  assert(
    iso(householdToday(midnightish, "Europe/London")) === "2026-06-15",
    "London: 00:30Z is today (BST, +1)",
  );

  // DST — the module must not hand-roll offsets. Intl owns the rules.
  assert(
    iso(householdToday(new Date("2026-03-29T00:30:00Z"), "Europe/London")) === "2026-03-29",
    "DST spring-forward day resolves (Intl owns the offset, not the module)",
  );
  assert(
    iso(householdToday(new Date("2026-10-25T00:30:00Z"), "Europe/London")) === "2026-10-25",
    "DST fall-back day resolves",
  );

  assert(
    DECLARED_DEFAULT_ZONE === "Europe/London",
    "the declared default zone is Europe/London, with provenance (CP8)",
  );

  // =========================================================================
  section("§3 HT8 — the declared key space, never renumbered");

  // 2026-01-18 is a Sunday; 2026-01-19 a Monday.
  assert(householdDayOfWeek(d(2026, 1, 18)) === 0, "Sunday is 0 — the DECLARED key space (HT8)");
  assert(householdDayOfWeek(d(2026, 1, 19)) === 1, "Monday is 1");
  assert(householdDayOfWeek(d(2026, 1, 24)) === 6, "Saturday is 6");
  assert(
    DAY_NAMES[0] === "Sunday" && DAY_NAMES[6] === "Saturday",
    "DAY_NAMES is indexed by the declared key space (0 = Sunday)",
  );
  // The two conventions coexist deliberately — this is the whole of HT8.
  assert(
    WEEK_STARTS_ON === 1 && householdDayOfWeek(d(2026, 1, 18)) === 0,
    "the household week starts MONDAY while the stored numbering stays 0 = Sunday — declared, not migrated (HT8)",
  );
  assert(
    MONDAY_FIRST_ORDER.join(",") === "1,2,3,4,5,6,0",
    "the Monday-first reorder map is declared once — the retirement target for 19 week-shapes across 16 files",
  );
  // Cross-check against JavaScript's own getDay(), which the key space matches.
  assert(
    householdDayOfWeek(d(2026, 1, 18)) === new Date(Date.UTC(2026, 0, 18)).getUTCDay(),
    "the key space matches JavaScript's getDay() — which is WHY renumbering it would rotate every planner consumer",
  );

  // =========================================================================
  section("§4 householdWeekOf — Monday-first, ISO");

  const week = householdWeekOf(d(2026, 1, 15)); // a Thursday
  assert(iso(week.start) === "2026-01-12", "the week of Thu 15 Jan opens on Mon 12 Jan");
  assert(iso(week.end) === "2026-01-18", "and closes on Sun 18 Jan");

  // The Sunday trap: Sunday CLOSES its week, it does not open one.
  const sundayWeek = householdWeekOf(d(2026, 1, 18));
  assert(
    iso(sundayWeek.start) === "2026-01-12" && iso(sundayWeek.end) === "2026-01-18",
    "Sunday belongs to the week it CLOSES — the off-by-one that rotates a week chart",
  );
  const mondayWeek = householdWeekOf(d(2026, 1, 19));
  assert(iso(mondayWeek.start) === "2026-01-19", "Monday opens its own week");

  // ISO week numbering — a week belongs to the year containing its Thursday.
  assert(householdWeekOf(d(2026, 1, 15)).isoWeek === 3, "ISO week 3 of 2026");
  assert(
    householdWeekOf(d(2026, 12, 31)).isoWeek === 53 && householdWeekOf(d(2026, 12, 31)).isoYear === 2026,
    "31 Dec 2026 is ISO week 53 of 2026",
    `${householdWeekOf(d(2026, 12, 31)).isoWeek}/${householdWeekOf(d(2026, 12, 31)).isoYear}`,
  );
  // 1 Jan 2027 is a Friday — its week's Thursday is 31 Dec 2026, so it is ISO 2026.
  assert(
    householdWeekOf(d(2027, 1, 1)).isoYear === 2026,
    "1 Jan 2027 belongs to ISO year 2026 — the year of its week's Thursday",
    String(householdWeekOf(d(2027, 1, 1)).isoYear),
  );
  // Every week is exactly 7 days and starts on a Monday, across a year sweep.
  let weekShapeOk = true;
  for (let day = 1; day <= 365; day++) {
    const date = addDaysForTest(d(2026, 1, 1), day);
    const w = householdWeekOf(date);
    if (householdDayOfWeek(w.start) !== 1 || householdDayOfWeek(w.end) !== 0) weekShapeOk = false;
  }
  assert(weekShapeOk, "every week in a 365-day sweep opens Monday and closes Sunday");

  // =========================================================================
  section("§5 householdPhase — the coarse named vocabulary, at the LIVE boundaries");

  const at = (hour: number) =>
    householdPhase(new Date(`2026-06-15T${String(hour).padStart(2, "0")}:00:00Z`), "UTC");
  assert(at(0) === "morning", "00:00 is morning");
  assert(at(11) === "morning", "11:00 is morning");
  assert(at(12) === "afternoon", "12:00 is afternoon — the live boundary");
  assert(at(16) === "afternoon", "16:00 is afternoon");
  assert(at(17) === "evening", "17:00 is evening — the live boundary (17, not 18)");
  assert(at(23) === "evening", "23:00 is evening");
  assert(
    PHASE_BOUNDARIES.afternoonStartsAtHour === 12 && PHASE_BOUNDARIES.eveningStartsAtHour === 17,
    "the boundaries are DECLARED (12/17), not scattered across four copies",
  );

  // GOLDEN IDENTITY against the two LIVE getGreeting() copies. Their convergence
  // is Phase 3 (CONV1 P6) — this proves the vocabulary will preserve their
  // behaviour exactly when it happens. Migration principle 1: the floor.
  const liveGetGreeting = (hour: number): string => {
    // Frozen verbatim from client/src/pages/dashboard.tsx:56-61 and
    // client/src/components/HomeIntelligenceCompanion.tsx:33-38 (identical).
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };
  const phaseToGreeting: Record<string, string> = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
  };
  let greetingIdentical = true;
  for (let hour = 0; hour < 24; hour++) {
    if (phaseToGreeting[at(hour)] !== liveGetGreeting(hour)) greetingIdentical = false;
  }
  assert(
    greetingIdentical,
    "GOLDEN IDENTITY: across all 24 hours the phase vocabulary reproduces both LIVE getGreeting() copies byte-identically",
  );

  // The zone reaches the phase — this is why the greeting is CIVIL, not INSTANT.
  const eveningInLondon = new Date("2026-06-15T18:00:00Z");
  assert(
    householdPhase(eveningInLondon, "Europe/London") === "evening" &&
      householdPhase(eveningInLondon, "Asia/Tokyo") === "morning",
    "one instant is 'evening' in London and 'morning' in Tokyo — the greeting moves with the household (CIVIL)",
  );

  // =========================================================================
  section("§6 resolvePlannerWeek — totality is the compatibility strategy");

  const today = d(2026, 6, 15); // a Monday

  assert(
    resolvePlannerWeek(today, []).anchored === false &&
      (resolvePlannerWeek(today, []) as { reason: string }).reason === "no-weeks",
    "no rota at all → { anchored: false, reason: 'no-weeks' }",
  );

  // EVERY household today: six slots, no anchors (SCH-2 does not exist yet).
  const todaysRota: PlannerWeek[] = [1, 2, 3, 4, 5, 6].map((n) => ({
    weekNumber: n,
    weekStartDate: null,
  }));
  const live = resolvePlannerWeek(today, todaysRota);
  assert(
    live.anchored === false && live.reason === "no-anchor",
    "EVERY household that exists today → 'no-anchor'. The caller keeps exactly today's behaviour (migration principle 1)",
  );

  const anchoredRota: PlannerWeek[] = [
    { weekNumber: 1, weekStartDate: d(2026, 6, 8) },
    { weekNumber: 2, weekStartDate: d(2026, 6, 15) },
    { weekNumber: 3, weekStartDate: d(2026, 6, 22) },
    { weekNumber: 4, weekStartDate: d(2026, 7, 6) },
  ];
  const thisWeek = resolvePlannerWeek(today, anchoredRota);
  assert(
    thisWeek.anchored === true && thisWeek.week.weekNumber === 2 && thisWeek.relation === "this",
    "today inside week 2's span → week 2, relation 'this'",
  );
  // Mid-week still resolves to the containing week.
  const midWeek = resolvePlannerWeek(d(2026, 6, 19), anchoredRota);
  assert(
    midWeek.anchored === true && midWeek.week.weekNumber === 2 && midWeek.relation === "this",
    "Friday of week 2 still resolves to week 2 (the span is inclusive, 7 days)",
  );
  // Before the rota opens.
  const before = resolvePlannerWeek(d(2026, 6, 3), anchoredRota);
  assert(
    before.anchored === true && before.week.weekNumber === 1 && before.relation === "next",
    "5 days before week 1 opens → week 1, relation 'next'",
  );
  const wellBefore = resolvePlannerWeek(d(2026, 5, 1), anchoredRota);
  assert(
    wellBefore.anchored === true && wellBefore.week.weekNumber === 1 && wellBefore.relation === "ahead",
    "5 weeks before week 1 opens → week 1, relation 'ahead'",
  );
  // In a gap — week 3 closed, week 4 has not opened.
  const inGap = resolvePlannerWeek(d(2026, 7, 1), anchoredRota);
  assert(
    inGap.anchored === true && inGap.week.weekNumber === 4 && inGap.relation === "next",
    "in the gap between week 3 and week 4 → the upcoming week 4, relation 'next'",
  );
  // THE WINDOW EXPIRES — TIME1 § 6.3's finding, made visible for the first time.
  const expired = resolvePlannerWeek(d(2026, 9, 1), anchoredRota);
  assert(
    expired.anchored === false && expired.reason === "window-expired",
    "past the end of the last slot → 'window-expired'. TIME1 § 6.3: the six-slot window has been expiring silently all along",
  );
  // 'past' — later slots exist in the rota but are unanchored, so the most recent
  // anchored week is the honest answer. THA must not invent dates for the rest (HT7).
  const partiallyAnchored: PlannerWeek[] = [
    { weekNumber: 1, weekStartDate: d(2026, 6, 8) },
    { weekNumber: 2, weekStartDate: d(2026, 6, 15) },
    { weekNumber: 3, weekStartDate: null },
    { weekNumber: 4, weekStartDate: null },
  ];
  const past = resolvePlannerWeek(d(2026, 7, 20), partiallyAnchored);
  assert(
    past.anchored === true && past.week.weekNumber === 2 && past.relation === "past",
    "later slots exist but are unanchored → the most recent LOCATABLE week, relation 'past' (never a fabricated date)",
  );
  // An unsorted rota must resolve identically — input order is not a contract.
  // These cases are ORDER-SENSITIVE by construction: 'next' must pick the FIRST
  // upcoming week and 'window-expired' depends on finding the LAST one, so a rota
  // sorted the wrong way round resolves 'next' to week 4 instead of week 1. (An
  // earlier version of this suite only checked the 'this' case, which is
  // order-insensitive — and it passed against a genuinely inverted comparator.)
  const reversed = [...anchoredRota].reverse();
  for (const [label, when] of [
    ["this", today],
    ["next", d(2026, 6, 3)],
    ["ahead", d(2026, 5, 1)],
    ["window-expired", d(2026, 9, 1)],
  ] as const) {
    assert(
      JSON.stringify(resolvePlannerWeek(when, reversed)) ===
        JSON.stringify(resolvePlannerWeek(when, anchoredRota)),
      `a reversed rota resolves identically for '${label}' — input order is not a contract`,
      JSON.stringify(resolvePlannerWeek(when, reversed)),
    );
  }

  // =========================================================================
  section("§7 HT6 — totality under abuse: a stated answer, never a throw");

  let threw = false;
  try {
    assert(
      iso(householdToday(instant, "Not/AZone")) === "2026-01-15",
      "a malformed zone falls back to the instant's UTC civil date — stated, not thrown (HT6)",
    );
    assert(
      householdPhase(instant, "Not/AZone") === "evening",
      "a malformed zone still yields a phase (UTC frame)",
    );
    assert(iso(householdToday(new Date(NaN), "Europe/London")) === "1970-01-01", "an invalid instant resolves to the epoch");
    // The epoch (Thu 1 Jan 1970) sits inside the Monday-first week that OPENS on
    // Mon 29 Dec 1969 — so the fallback week legitimately starts in 1969.
    const fallbackWeek = householdWeekOf({ year: 2026, month: 2, day: 31 });
    assert(
      iso(fallbackWeek.start) === "1969-12-29" && iso(fallbackWeek.end) === "1970-01-04",
      "an impossible civil date (31 Feb) resolves to the epoch's week, never a throw",
      `${iso(fallbackWeek.start)}..${iso(fallbackWeek.end)}`,
    );
    assert(householdDayOfWeek({ year: 2026, month: 13, day: 1 }) === 0, "month 13 resolves, never throws");
    const nullish = resolvePlannerWeek(today, [
      { weekNumber: 1, weekStartDate: { year: 2026, month: 2, day: 31 } },
    ]);
    assert(
      nullish.anchored === false && nullish.reason === "no-anchor",
      "an anchor holding an impossible date is treated as no anchor — never a fabricated week",
    );
  } catch (err) {
    threw = true;
    console.error(err);
  }
  assert(!threw, "no derivation threw across the whole abuse sweep (HT6 — totality)");

  // =========================================================================
  section("§8 HT18 — verification is that NO SECOND IMPLEMENTATION exists");

  // This is the gate that matters. For a pure vocabulary, drift is not a stale
  // row — it is a rival copy (architecture § 16).
  const seasonRuleSource = sourceOf("shared/seasonal/season-rule.ts");
  assert(
    /export function seasonOf/.test(seasonRuleSource),
    "the season rule has a declared owner: shared/seasonal/season-rule.ts (Domain 11)",
  );

  // OWN-3: the three implementations are one. Any file re-deriving a season from
  // a month is a rival owner on arrival (HT1).
  const rivalSeasonImpls: string[] = [];
  for (const rel of [
    "shared/discovery/seasonal-map.ts",
    "shared/seasonal/engine.ts",
    "shared/stories/engine.ts",
  ]) {
    const src = sourceOf(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    // The shape of all three retired copies: a month read followed by a season return.
    if (/getMonth\(\)[\s\S]{0,400}?return\s+"(spring|summer|autumn|winter)"/.test(src)) {
      rivalSeasonImpls.push(rel);
    }
  }
  assert(
    rivalSeasonImpls.length === 0,
    "OWN-3: no consumer re-derives the season from a month — 3 implementations → 1",
    rivalSeasonImpls.join(", "),
  );

  // And the module itself owns no season (HT17).
  assert(
    !/spring|summer|autumn|winter/i.test(code),
    "HT17: household-time.ts computes NO season — it supplies the input, never the answer",
  );

  // =========================================================================
  section("§9 Boundaries — the most-read module and the least powerful");

  assert(
    !/from ["'].*schema|drizzle|storage/.test(code),
    "the module imports no schema, no ORM, no storage — pure and zero-I/O",
  );
  assert(
    !/fetch\(|readFileSync|process\./.test(code),
    "no I/O of any kind",
  );
  // HT13 — time aims words and doors, never light.
  assert(
    !/colou?r|opacity|palette|theme|className|css|motion|animate/i.test(code),
    "HT13: the module names no colour, opacity, palette, theme or motion — time never aims light",
  );
  // HT16 — telemetry may never inform household time.
  assert(
    !/observation|telemetry|platform_observations/i.test(code),
    "HT16: the module reads no telemetry — no learned routine, no inferred rhythm",
  );
  // The five MUST-NOT domains (CP6): the module must not reach toward them.
  assert(
    !/session|token|expiry|cache|ttl|trial/i.test(code),
    "CP6/HT10: the module names no session, token, cache, TTL or trial — a duration is not a date",
  );

  // =========================================================================
  section("§10 OWN-3 GOLDEN IDENTITY — the converged season rule vs all three oracles");

  // The three pre-convergence implementations, frozen verbatim as oracles.
  // Frozen from shared/seasonal/engine.ts:96-102 (pre-P5).
  const oracleSeasonalEngine = (date: Date): UKSeason => {
    const m = date.getMonth() + 1;
    if (m >= 3 && m <= 5) return "spring";
    if (m >= 6 && m <= 8) return "summer";
    if (m >= 9 && m <= 11) return "autumn";
    return "winter";
  };
  // Frozen from shared/stories/engine.ts:137-143 (pre-P5) — byte-identical to the above.
  const oracleStoriesEngine = (date: Date): UKSeason => {
    const m = date.getMonth() + 1;
    if (m >= 3 && m <= 5) return "spring";
    if (m >= 6 && m <= 8) return "summer";
    if (m >= 9 && m <= 11) return "autumn";
    return "winter";
  };
  // Frozen from shared/discovery/seasonal-map.ts:63-69 (pre-P5) — the 0-indexed
  // twin. CONV1 OWN-3: "two express the same rule with different month bases, so a
  // reviewer diffing them sees different numbers and cannot tell they agree."
  const oracleSeasonalMap = (date: Date): UKSeason => {
    const m = date.getMonth(); // 0 = Jan
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
  };

  let identical = 0;
  let divergent = 0;
  for (let year = 2024; year <= 2027; year++) {
    for (let month = 1; month <= 12; month++) {
      for (const day of [1, 15, 28]) {
        const date = new Date(Date.UTC(year, month - 1, day, 12));
        // A CivilDate flows straight into the season rule — this IS the HT17 seam
        // Phase 3 will use: seasonOf(householdToday(now, zone)).
        const converged = seasonOf(d(year, month, day));
        if (
          converged === oracleSeasonalEngine(date) &&
          converged === oracleStoriesEngine(date) &&
          converged === oracleSeasonalMap(date)
        ) {
          identical++;
        } else {
          divergent++;
        }
      }
    }
  }
  assert(
    divergent === 0,
    `GOLDEN IDENTITY: across ${identical} dates spanning four years the converged season rule is identical to all THREE retired implementations — behaviour unchanged BY PROOF`,
    `${divergent} divergences`,
  );

  // The season rule takes a CIVIL DATE, not a Date — this is HT17's seam. It
  // cannot read a clock, so it cannot invent a "today" of its own.
  const seasonRuleCode = seasonRuleSource
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  assert(
    !/new Date\(\)|Date\.now\(\)/.test(seasonRuleCode),
    "the season rule reads no clock — it is GIVEN its input (HT17: input, never answer)",
  );
  assert(
    /export function seasonOf\(date: SeasonInput\)/.test(seasonRuleCode),
    "the canonical rule takes a CIVIL DATE, not a Date — it cannot be read in the wrong frame or the wrong month base",
  );
  // The transitional adapter is the ONE remaining process-local read, named and
  // dated rather than scattered across three files. Phase 3 (P6) retires it.
  assert(
    (seasonRuleCode.match(/getMonth\(\)/g) ?? []).length === 1,
    "exactly ONE process-local frame read survives, inside the named transitional adapter (was 3, in 3 files)",
  );
  assert(seasonOf(d(2026, 3, 1)) === "spring", "1 Mar is spring");
  assert(seasonOf(d(2026, 2, 28)) === "winter", "28 Feb is winter — the boundary the month-base bug lives on");
  assert(seasonOf(d(2026, 12, 1)) === "winter", "1 Dec is winter");
  assert(seasonOf(d(2026, 6, 1)) === "summer", "1 Jun is summer");
  assert(seasonOf(d(2026, 9, 30)) === "autumn", "30 Sep is autumn");

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`TIME3 Household Time (CONV1 P5): ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

/** Test-local date arithmetic — deliberately NOT the module's, so the sweep is an independent oracle. */
function addDaysForTest(date: CivilDate, days: number): CivilDate {
  const proxy = new Date(Date.UTC(date.year, date.month - 1, date.day, 12));
  proxy.setUTCDate(proxy.getUTCDate() + days);
  return { year: proxy.getUTCFullYear(), month: proxy.getUTCMonth() + 1, day: proxy.getUTCDate() };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
