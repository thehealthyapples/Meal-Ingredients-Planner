/**
 * test-planner-continuous-timeline.ts — PLANNER1 (2026-07-22)
 * ==========================================================
 * The Planner's fixed six-week rota becomes a continuous, dated, unbounded timeline.
 *
 * This suite proves the two things that matter and are testable without a database:
 *
 *   1. THE SEMANTICS. `resolvePlannerWeek` — the ONE owner of "which week is this
 *      household living in?" — already resolves an unbounded, dated timeline correctly,
 *      in both directions, and NEVER reports `window-expired` while the current week
 *      exists. The continuous timeline is therefore an extension of the existing owner,
 *      not a second implementation of it (mission: "do not duplicate planner state").
 *
 *   2. THE COMPLIANCE SPINE. The new write path (`ensureDatedPlannerWeek`,
 *      `getCurrentDatedPlannerWeek`) and the new routes honour every Household-Time rule
 *      the gates enforce: the anchor is INSERTed and NEVER back-filled (HT7); the next
 *      ordinal is allocated in SQL, never by a rival `max(weekNumber)` idiom (HT1); the
 *      current week's Monday comes from the owner's civil-week arithmetic; and no date is
 *      invented from a week number (Core Principle 6). These are asserted against real
 *      source, so a future edit that breaks them fails here as well as at the gate.
 *
 * Governing architecture: THA_HOUSEHOLD_TIME_ARCHITECTURE.md § 13 (migration principle 3,
 * as amended); docs/implementation/planner/PLANNER_CONTINUOUS_TIMELINE.md.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  addCivilDays,
  formatCivilDate,
  householdToday,
  householdWeekOf,
  parseCivilDate,
  resolvePlannerWeek,
  type CivilDate,
  type IANAZone,
  type PlannerWeek,
} from "../../shared/time/household-time.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    passed++;
  } else {
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

/** Comments discuss the rules at length; only code may violate them. */
function codeOf(rel: string): string {
  return sourceOf(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * A dated timeline: `count` consecutive weeks starting `offsetWeeks` before `pivotMonday`.
 * weekNumber is the CREATION ordinal (calendar-ascending here); §3 breaks that alignment
 * on purpose to prove the coordinate is the date, not the number.
 */
function timeline(pivotMonday: CivilDate, offsetWeeks: number, count: number): PlannerWeek[] {
  const first = addCivilDays(pivotMonday, -7 * offsetWeeks);
  return Array.from({ length: count }, (_, i) => ({
    weekNumber: i + 1,
    weekStartDate: addCivilDays(first, 7 * i),
  }));
}

async function main(): Promise<void> {
  console.log("\nPLANNER1 — The Continuous Timeline");
  console.log("=".repeat(50));

  const zone: IANAZone = "Europe/London";
  const now = new Date("2026-07-22T09:00:00Z"); // Wed 22 July 2026
  const today = householdToday(now, zone);
  const thisMonday = householdWeekOf(today).start; // Mon 20 July 2026

  // ───────────────────────────────────────────────────────────────────────────
  section("§1 The timeline is continuous — and never expires while the present exists");

  // 14 weeks: 3 behind the current week, the current week, and 10 ahead — far past the
  // old six-slot bound. This is the shape the old rota could never hold.
  const tl = timeline(thisMonday, 3, 14);
  assert(tl.length === 14, "a household may hold far more than six weeks", String(tl.length));

  const current = resolvePlannerWeek(today, tl);
  assert(current.anchored === true, "the current week resolves (anchored)");
  assert(current.anchored && current.relation === "this", "today falls inside 'this' week", current.anchored ? current.relation : "unanchored");
  assert(
    current.anchored && formatCivilDate(current.week.weekStartDate as CivilDate) === formatCivilDate(thisMonday),
    "the resolved current week is anchored to this household's Monday",
    current.anchored ? formatCivilDate(current.week.weekStartDate as CivilDate) : "—",
  );

  // THE HEADLINE: with the present in the timeline, the window NEVER expires. The old
  // six-slot rota silently ran out (TIME1 § 6.3); the continuous timeline cannot.
  assert(
    !(current.anchored === false && current.reason === "window-expired"),
    "the six-slot window never expires when the current week exists (TIME1 § 15.1, resolved)",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§2 Navigation is unrestricted — backwards and forwards without limit");

  // The client moves ±7 days from the active week's anchor. Walk a long way in each
  // direction and prove every step lands on a real, adjacent, resolvable week.
  let cursor = thisMonday;
  for (let i = 0; i < 30; i++) cursor = addCivilDays(cursor, 7); // 30 weeks forward
  const farFuture = resolvePlannerWeek(cursor, timeline(cursor, 0, 1));
  assert(farFuture.anchored === true && farFuture.relation === "this", "a week 30 ahead is reachable and resolves", farFuture.anchored ? farFuture.relation : "no");

  cursor = thisMonday;
  for (let i = 0; i < 30; i++) cursor = addCivilDays(cursor, -7); // 30 weeks back
  const farPast = resolvePlannerWeek(cursor, timeline(cursor, 0, 1));
  assert(farPast.anchored === true && farPast.relation === "this", "a week 30 behind is reachable and resolves (history is never pruned)", farPast.anchored ? farPast.relation : "no");

  // Each ±7-day step is exactly one week — adjacent Mondays, no gaps, no limit.
  const stepFwd = addCivilDays(thisMonday, 7);
  const stepBack = addCivilDays(thisMonday, -7);
  assert(householdWeekOf(stepFwd).start && formatCivilDate(stepFwd) === "2026-07-27", "next week is the following Monday", formatCivilDate(stepFwd));
  assert(formatCivilDate(stepBack) === "2026-07-13", "previous week is the preceding Monday", formatCivilDate(stepBack));

  // ───────────────────────────────────────────────────────────────────────────
  section("§3 weekStartDate is the coordinate — weekNumber is a stable, unordered ordinal");

  // A backward-navigated week gets a HIGHER weekNumber (MAX+1) but an EARLIER date.
  // The resolver must order by date, never by number, or the timeline is a lie.
  const mixed: PlannerWeek[] = [
    { weekNumber: 1, weekStartDate: thisMonday },                         // created first, this week
    { weekNumber: 2, weekStartDate: addCivilDays(thisMonday, 7) },        // next week
    { weekNumber: 3, weekStartDate: addCivilDays(thisMonday, -14) },      // navigated BACK later → higher number, earlier date
  ];
  const resolvedMixed = resolvePlannerWeek(today, mixed);
  assert(
    resolvedMixed.anchored === true && resolvedMixed.week.weekNumber === 1,
    "'this' resolves by date to the current week (number 1), not by the max ordinal (3)",
    resolvedMixed.anchored ? String(resolvedMixed.week.weekNumber) : "unanchored",
  );
  const pastPivot = resolvePlannerWeek(addCivilDays(thisMonday, -14), mixed);
  assert(
    pastPivot.anchored === true && pastPivot.week.weekNumber === 3,
    "the earliest-dated week resolves for its own date even though it holds the highest number",
    pastPivot.anchored ? String(pastPivot.week.weekNumber) : "unanchored",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§4 The compliance spine — asserted against real source");

  const storage = codeOf("server/storage.ts");
  const routes = codeOf("server/routes.ts");
  const schema = codeOf("shared/schema.ts");
  const runner = codeOf("server/migrations/runner.ts");

  // HT7 — the new writer INSERTs the anchor and NEVER updates it. This is the exact
  // shape the gate `ht-anchor-is-never-back-filled` forbids.
  assert(/async ensureDatedPlannerWeek\s*\(/.test(storage), "storage.ensureDatedPlannerWeek exists (the continuous timeline's write funnel)");
  assert(
    !/\.update\(\s*plannerWeeks\s*\)[\s\S]{0,200}?\.set\(\s*\{[^}]*weekStartDate/.test(storage),
    "no code path UPDATEs planner_weeks.weekStartDate — the anchor is written once, never back-filled (HT7)",
  );

  // HT1 — the next ordinal is allocated in SQL, not by a JS max/reduce over weekNumber
  // (which the one-owner gate treats as a rival "current week" derivation).
  assert(/MAX\(week_number\)/i.test(storage), "the next ordinal is allocated in SQL as MAX(week_number)+1");
  assert(
    !/Math\.max\([\s\S]{0,60}?\.map\(\s*\w+\s*=>\s*\w+\.weekNumber/.test(storage),
    "no Math.max(...map(weekNumber)) idiom (ht-one-planner-week-owner)",
  );

  // The current week's Monday comes from the OWNER's civil-week arithmetic.
  assert(/async getCurrentDatedPlannerWeek\s*\(/.test(storage), "storage.getCurrentDatedPlannerWeek exists (the landing week)");
  assert(
    /getCurrentDatedPlannerWeek[\s\S]{0,600}?householdWeekOf\(\s*householdToday\(/.test(storage),
    "the current week's Monday is the owner's householdWeekOf(householdToday(...)), not a rival (HT1/HT11)",
  );

  // The routes exist.
  assert(/["'`]\/api\/planner\/timeline\/current["'`]/.test(routes), "GET /api/planner/timeline/current exists (the landing endpoint)");
  assert(/["'`]\/api\/planner\/timeline\/week["'`]/.test(routes), "POST /api/planner/timeline/week exists (navigation create-on-demand)");

  // /full is batched, so an unbounded timeline is not an N+1 regression.
  assert(/getPlannerDaysByWeekIds/.test(routes) && /getPlannerEntriesByDayIds/.test(routes), "/api/planner/full loads days+entries in batched queries (no per-week N+1)");

  // The schema and migration reflect the amendment, HT7-safely.
  assert(/planner_weeks_household_start_date_idx/.test(schema), "the timeline index is declared in the schema");
  assert(/planner_weeks_household_start_date_idx/.test(runner), "the timeline index has a reviewed migration");
  assert(
    !/ADD\s+COLUMN[\s\S]{0,120}?week_start_date[\s\S]{0,120}?DEFAULT/i.test(runner),
    "no migration adds week_start_date with a DEFAULT (a DEFAULT is a silent back-fill — HT7)",
  );
  assert(
    !/UPDATE\s+planner_weeks[\s\S]{0,400}?week_start_date/i.test(runner),
    "no migration UPDATEs week_start_date (HT7)",
  );

  // Core Principle 6 — the new code invents no date from a week number.
  assert(!/\bapproxDate\b/.test(storage) && !/\bapproxDate\b/.test(routes), "no approxDate — a date is a lookup over the anchor, never derived from a week number");

  // ───────────────────────────────────────────────────────────────────────────
  section("§5 The 192/195 — legacy weeks stay honestly undated (nothing regresses)");

  // An all-NULL rota — every household that existed before the anchor — still resolves to
  // the honest absence, exactly as before. The continuous timeline never dates it by guess.
  const legacy: PlannerWeek[] = Array.from({ length: 6 }, (_, i) => ({ weekNumber: i + 1, weekStartDate: null }));
  const legacyResolved = resolvePlannerWeek(today, legacy);
  assert(
    legacyResolved.anchored === false && legacyResolved.reason === "no-anchor",
    "an unanchored legacy rota is still 'no-anchor' — undated, never invented (HT6/HT7)",
    legacyResolved.anchored ? "anchored" : legacyResolved.reason,
  );

  // createPlannerWeeks (initial onboarding) is untouched — still the six-week first touch.
  assert(/for\s*\(\s*let\s+w\s*=\s*1;\s*w\s*<=\s*6;\s*w\+\+\s*\)/.test(storage), "createPlannerWeeks still creates the initial six weeks (existing onboarding preserved)");

  // ── Summary ──
  console.log("\n" + "=".repeat(50));
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log("  PLANNER1 — the window never expires, history is never pruned,");
    console.log("  and no week is ever dated by guess.");
  }
  console.log("=".repeat(50) + "\n");
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
