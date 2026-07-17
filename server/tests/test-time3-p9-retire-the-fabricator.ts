/**
 * test-time3-p9-retire-the-fabricator.ts (TIME3 Phase 6 — CONV1 P9 / BEH-5)
 * =========================================================================
 * Verifies THE RETIREMENT OF `approxDate` — the last live fabrication in the time
 * family — against the governing architecture `THA_HOUSEHOLD_TIME_ARCHITECTURE.md`
 * (HT1–HT18) and Core Principle 6 (*honest gaps over invented facts*).
 *
 * **The defect this suite exists to make unrepeatable, stated exactly:**
 *
 *     approxDate = now − (weeksAgo × 7 + max(0, 6 − dayOfWeek)) days
 *                ⇒ reportedDay = (now.getDay() + dayOfWeek + 1) mod 7
 *
 * **The weekday Stories reported was the day the household opened the app.** A household
 * who plans curry every Saturday was told "Sunday became curry night" on a Sunday,
 * "Monday became curry night" on a Monday, and so on — correct one day in seven, by
 * coincidence, and carrying *no information whatever* about the household. Every number
 * downstream — the 30/90/180/365 tiers, the 180-day favourite gate, the seasons — was
 * arithmetic on fiction (CONV1 `BEH-5`: *"the platform states invented facts about a
 * household's life in the household's own voice"*).
 *
 * § 1 is the whole case: the retired builder is embedded VERBATIM and shown to be a
 * function of the request rather than of the plan.
 *
 * Coverage:
 *   §1  THE ORACLE — the fabricator, verbatim, proven to report the request's weekday;
 *       and proven to drift as the clock moves while the household changes nothing.
 *   §2  THE REPLACEMENT — a date is a LOOKUP over the anchor: exact, stable, and
 *       frame-independent. The same plan yields the same date whenever you ask.
 *   §3  THE HONEST GAP — an unanchored week yields undated entries, permanently (HT7),
 *       and `isDated` makes that unrepresentable inside a story.
 *   §4  STORIES GO SILENT rather than lie — and Stories' own canon already required it.
 *   §5  WHAT SURVIVES — food identity needs no calendar: `discover()` and Looking Ahead
 *       are untouched. This is why `date` is nullable rather than the entries dropped.
 *   §6  BOTH FABRICATORS ARE GONE (§ 14 target 5: "2 → 0"), asserted over the sources.
 *
 * Run with: npx tsx server/tests/test-time3-p9-retire-the-fabricator.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { MONDAY_FIRST_ORDER } from "../../shared/time/household-time.js";
import { plannerEntryDate } from "../lib/household-history.js";
import { isDated, type MealEntry } from "../../shared/stories/types.js";
import { stories } from "../../shared/stories/engine.js";
import { seasonalStories } from "../../shared/seasonal/engine.js";

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) passed++;
  else {
    failed++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}
function section(name: string): void {
  console.log(`\n${name}`);
}
function sourceOf(rel: string): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return readFileSync(path.resolve(here, "../..", rel), "utf8");
}
function codeOf(rel: string): string {
  return sourceOf(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// ── THE FROZEN ORACLE — the fabricator, verbatim from the code P9 deleted ────
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** VERBATIM from routes.ts and server/lib/household-history.ts before CONV1 P9. */
function retiredApproxDate(now: Date, weeksAgo: number, dayOfWeek: number): Date {
  return new Date(now.getTime() - (weeksAgo * 7 + Math.max(0, 6 - dayOfWeek)) * MS_PER_DAY);
}

// ── THE REPLACEMENT — the REAL function, imported, never re-implemented ──────
//
// The first draft of this suite copied `plannerEntryDate` here rather than importing it,
// and the copy immediately disagreed with the real one about malformed input (the copy
// used `split("-").map(Number)` and produced an Invalid Date; the real function asks
// `parseCivilDate` and answers null). **A test that re-implements the code under test is
// the exact defect this phase retires** — a second copy that drifts — so it imports.

const entry = (food: string, date: Date | null, extra: Partial<MealEntry> = {}): MealEntry => ({
  food, foodName: food, mealName: "Curry", date, source: "planned", ...extra,
});

async function main(): Promise<void> {
  console.log("\nTIME3 Phase 6 — CONV1 P9 / BEH-5: retire the fabricator");
  console.log("=".repeat(60));

  // ───────────────────────────────────────────────────────────────────────────
  section("§1 The oracle — the weekday Stories reported WAS the request's weekday");

  // A household plans curry on SATURDAY (planner dayOfWeek 6 — 0 = Sunday, HT8).
  const PLANNED = 6;
  const reported: string[] = [];
  for (let i = 0; i < 7; i++) {
    // 2026-07-12 is a Sunday; step a whole week of "request times".
    const now = new Date(Date.UTC(2026, 6, 12 + i, 12));
    reported.push(DAY_NAMES[retiredApproxDate(now, 0, PLANNED).getUTCDay()]);
  }
  assert(
    reported.join(",") === "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday",
    "REPRODUCED: one household, one unchanged plan — and the story's weekday walked through all seven days as the week passed",
    reported.join(","),
  );
  assert(
    new Set(reported).size === 7,
    "…SEVEN different answers to one question, from data that never changed",
  );
  assert(reported[6] === DAY_NAMES[PLANNED], "…it was right exactly once: on a Saturday, by coincidence");
  assert(reported[5] === "Friday", "…and on a Friday it said 'Friday became curry night' — CONV1 BEH-5's headline, reproduced");

  // The algebra, asserted rather than asserted-about: reportedDay = (now.getDay() + dow + 1) mod 7.
  let algebraHolds = true;
  for (let nowDow = 0; nowDow < 7; nowDow++) {
    for (let dow = 0; dow < 7; dow++) {
      const now = new Date(Date.UTC(2026, 6, 12 + nowDow, 12));
      const got = retiredApproxDate(now, 0, dow).getUTCDay();
      if (got !== (now.getUTCDay() + dow + 1) % 7) algebraHolds = false;
    }
  }
  assert(algebraHolds, "reportedDay = (now.getDay() + dayOfWeek + 1) mod 7 — the weekday was a fact about the REQUEST");

  // And `weeksAgo` was itself computed from `maxWeek` ≡ 6 (all six weeks exist from first
  // touch), so a meal planned for next month was timestamped five weeks in the PAST.
  const nextMonthsSlot = retiredApproxDate(new Date(Date.UTC(2026, 6, 17, 12)), 5, 3);
  assert(
    nextMonthsSlot.getTime() < Date.UTC(2026, 6, 17, 12),
    "…and a meal a household plans to eat NEXT MONTH was timestamped five weeks in the past (maxWeek ≡ 6)",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§2 The replacement — a date is a lookup over the anchor, not arithmetic");

  // The household's week opens Monday 2026-07-13. Their Saturday is 2026-07-18.
  const sat = plannerEntryDate("2026-07-13", 6);
  assert(sat !== null && sat.toISOString().slice(0, 10) === "2026-07-18", "Saturday in the week of Mon 13 July IS 18 July", sat?.toISOString().slice(0, 10));
  assert(sat !== null && sat.getUTCDay() === 6, "…and it is a Saturday — the day the household actually planned");

  const mon = plannerEntryDate("2026-07-13", 1);
  assert(mon !== null && mon.toISOString().slice(0, 10) === "2026-07-13", "Monday is the week's own start — offset 0");
  const sun = plannerEntryDate("2026-07-13", 0);
  assert(sun !== null && sun.toISOString().slice(0, 10) === "2026-07-19", "Sunday CLOSES the household week — offset 6, not −1 (the week starts Monday; the key space is 0=Sunday, HT8)");

  // THE PROPERTY THE FABRICATION LACKED: it does not depend on when you ask.
  const asked = [
    plannerEntryDate("2026-07-13", 6)!.getTime(),
    plannerEntryDate("2026-07-13", 6)!.getTime(),
  ];
  assert(asked[0] === asked[1], "the same plan yields the same date, always — no clock is read (the fabricator drifted every day)");

  // Every day of the week maps to a distinct, correct calendar day.
  const all = [0, 1, 2, 3, 4, 5, 6].map((d) => plannerEntryDate("2026-07-13", d)!);
  assert(new Set(all.map((d) => d.getTime())).size === 7, "all seven days map to seven distinct dates");
  assert(all.every((d, i) => d.getUTCDay() === i), "…and each lands on its own weekday — dayOfWeek 0→Sunday … 6→Saturday (HT8)");

  // ───────────────────────────────────────────────────────────────────────────
  section("§3 The honest gap — an unanchored week has no dates, permanently (HT7)");

  assert(plannerEntryDate(null, 6) === null, "a week with no anchor yields NO DATE — never a guess (HT6)");
  assert(plannerEntryDate("not-a-date", 6) === null, "a malformed anchor yields no date, never a throw (HT6)");
  assert(isDated(entry("curry", new Date())) === true, "isDated: a dated entry is dated");
  assert(isDated(entry("curry", null)) === false, "isDated: an undated entry is honestly undated");

  // ───────────────────────────────────────────────────────────────────────────
  section("§4 Stories go silent rather than lie");

  // THE 192: a household planning since before the anchor existed. Enough entries to
  // trigger every threshold — if the engine were willing to invent a date.
  const undated: MealEntry[] = [];
  for (let i = 0; i < 12; i++) undated.push(entry("tomato", null, { mealName: "Pasta" }));
  const silent = stories({ household: { entries: undated } });
  assert(
    silent.sections.length === 0,
    "12 undated entries — well past every threshold — produce NO stories. THA does not know when any of it happened, so it says nothing",
    String(silent.sections.length),
  );

  // The SAME twelve entries, dated, DO produce stories — so § 4's silence is the date's
  // absence talking, not a broken engine.
  const dated: MealEntry[] = [];
  for (let i = 0; i < 12; i++) {
    dated.push(entry("tomato", new Date(Date.UTC(2026, 6, 4 + i * 7, 12)), { mealName: "Pasta" }));
  }
  const spoken = stories({ household: { entries: dated }, now: new Date(Date.UTC(2026, 9, 1, 12)) });
  assert(spoken.sections.length > 0, "the SAME twelve entries, dated, DO produce stories — the silence above is honesty, not breakage", String(spoken.sections.length));

  // A mixed household: only the dated half may be spoken about.
  const mixed = stories({
    household: { entries: [...dated, ...undated] },
    now: new Date(Date.UTC(2026, 9, 1, 12)),
  });
  assert(mixed.sections.length > 0, "a mixed household still gets the stories its DATED entries support…");
  const mixedCounts = JSON.stringify(mixed.sections.map((s) => s.cards.length));
  const datedCounts = JSON.stringify(spoken.sections.map((s) => s.cards.length));
  assert(
    mixedCounts === datedCounts,
    "…and the undated half changes NOTHING — it cannot inflate a count, a tier, or a tradition",
    `${mixedCounts} vs ${datedCounts}`,
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§5 What survives — food identity needs no calendar");

  // This is why `date` is nullable rather than the undated entries being dropped: the
  // route builds `enjoys` from entries.map(e => e.food), and discover()/Looking Ahead
  // need no date at all. Dropping them would have silenced discovery to fix a defect it
  // never had.
  const enjoys = Array.from(new Set(undated.map((e) => e.food)));
  assert(enjoys.length === 1 && enjoys[0] === "tomato", "an UNDATED entry still says what the household plans — its food identity is intact");

  const seasonal = seasonalStories({
    household: { entries: undated },
    enjoys,
    now: new Date(Date.UTC(2026, 6, 17, 12)),
  });
  const lookingAhead = seasonal.blocks.find((b) => b.type === "looking_ahead");
  assert(lookingAhead != null && lookingAhead.cards.length > 0, "Looking Ahead SURVIVES for an unanchored household — it is seeded by `enjoys`, which needs no calendar");
  const seasonBlocks = seasonal.blocks.filter((b) => b.type !== "looking_ahead");
  assert(
    seasonBlocks.every((b) => b.cards.length === 0) || seasonBlocks.length === 0,
    "…while every block that claims a SEASON stays quiet — a window is a claim about when",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§6 Both fabricators are gone — § 14 target 5: 2 → 0");

  const routes = codeOf("server/routes.ts");
  const hh = codeOf("server/lib/household-history.ts");

  assert(!/\bapproxDate\b/.test(routes), "routes.ts: no approxDate");
  assert(!/\bapproxDate\b/.test(hh), "household-history.ts: no approxDate");
  assert(
    !/async function buildHouseholdHistory/.test(routes),
    "routes.ts no longer declares its PRIVATE buildHouseholdHistory closure — the duplicate the extraction existed to prevent (§ 14 target 5)",
  );
  assert(
    /import \{ buildHouseholdHistory \} from "\.\/lib\/household-history"/.test(routes),
    "…it imports the one owner instead (Principle 8 — retire on introduction, finally honoured)",
  );
  assert(!/maxWeek/.test(hh) && !/weeksAgo/.test(hh), "the week-index arithmetic is gone: no maxWeek, no weeksAgo");
  assert(
    !/const now = new Date\(\)/.test(hh),
    "the builder READS NO CLOCK — nothing about a household's planned history depends on when you ask (the fabricator's root defect)",
  );
  assert(/weekStartDate/.test(hh), "…the date comes from the week's anchor (CONV1 P7 / SCH-2)");
  assert(/MONDAY_FIRST_ORDER/.test(hh), "…and the day's offset is the OWNER's week shape, not a private assumption (HT1/HT8)");

  // The engines carry the rule in their types, not in a comment.
  const types = codeOf("shared/stories/types.ts");
  assert(/date: Date \| null/.test(types), "MealEntry.date is nullable — an undated entry is representable, so nobody must invent one");
  assert(/export function isDated/.test(types), "…and the guard is exported for both engines");

  // ───────────────────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log("  CONV1 P9 — THA no longer tells a household which day its own");
  console.log("  curry night is, having made the day up from the clock.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
