/**
 * test-time3-p7-planner-week-anchor.ts (TIME3 Phase 4 — CONV1 P7 / SCH-2)
 * ========================================================================
 * Verifies THE ANCHOR — `planner_weeks.weekStartDate` — against the governing
 * architecture `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (HT1–HT18, in force since
 * 2026-07-16) and the design TIME1 § 6 settled.
 *
 * P7 is a strange phase to test, and the shape of this suite says why:
 *
 *   • It CREATES A FACT and converges NO CONSUMER. Every T5 consumer — the five
 *     rival "current weeks", streaks, savings — still guesses, and that is CONV1
 *     P8, not this. So there is no "nothing regresses" oracle to run: nothing
 *     reads the new column yet. What CAN regress is the module's answer for an
 *     UNANCHORED household, and § 5 pins it byte for byte.
 *   • Its central rule is a REFUSAL. HT7 says the anchor is written only at
 *     creation and never back-filled, so most of what follows tests that a thing
 *     did NOT happen — that NULL survived. A back-filled anchor is `approxDate`
 *     with a schema (CONV1 R5): indistinguishable from a real one, which is what
 *     makes it worse than an absent one.
 *
 * Coverage:
 *   §1  THE SPECIFICATION (TIME1 § 6.2) — weekStartDate(N) = mondayOf(
 *       householdToday(now, zone)) + 7 × (N − 1). Six consecutive Mondays; slot 1
 *       is the week the household is living in; slot 2 is next week.
 *   §2  THE ZONE DECIDES THE WEEK (HT4/HT12) — and the test CAN FAIL: at
 *       2026-07-19T23:30Z a London household is already in the week of Mon 20 July
 *       while a New York household is still in the week of Mon 13 July. A
 *       UTC-stamped anchor hands London a rota starting A WHOLE WEEK EARLY.
 *   §3  WHAT THE ANCHOR MAKES POSSIBLE — resolvePlannerWeek over a P7-created rota
 *       answers `anchored: true` for the first time, with a true relation.
 *   §4  HT7 — THE REFUSAL. NULL survives, mixed rotas resolve on what is real, and
 *       the source itself carries no back-fill (migration, funnel, repair path).
 *   §5  THE FLOOR IS UNMOVED — an unanchored household gets exactly the answer it
 *       got before P7. Totality (HT6) is the compatibility strategy.
 *   §6  DESIGN (c) vs THE REJECTED DESIGN (a) — a household that skipped a week is
 *       representable, and resolution is a LOOKUP, never arithmetic. This is the
 *       whole reason the anchor is per-week (TIME1 § 6.1).
 *
 * Run with: npx tsx server/tests/test-time3-p7-planner-week-anchor.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  DECLARED_DEFAULT_ZONE,
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

// ── THE SPECIFICATION, EXECUTABLE ────────────────────────────────────────────
//
// TIME1 § 6.2, verbatim:
//
//     weekStartDate(N) = mondayOf(householdToday(now, zone)) + 7 × (N − 1)
//
// This mirrors `storage.createPlannerWeeks` exactly — and § 4.4 asserts against the
// real funnel's source that it still does, so the two cannot drift apart in silence.
function anchorsAtCreation(now: Date, zone: IANAZone): string[] {
  const thisMonday = householdWeekOf(householdToday(now, zone)).start;
  return [1, 2, 3, 4, 5, 6].map((w) => formatCivilDate(addCivilDays(thisMonday, 7 * (w - 1))));
}

/** The six-slot rota as the module sees it (a structural type, not the DB's). */
function rota(anchors: ReadonlyArray<string | null>): PlannerWeek[] {
  return anchors.map((a, i) => ({
    weekNumber: i + 1,
    weekStartDate: a === null ? null : (parseCivilDate(a) as CivilDate),
  }));
}

/** THE STATE OF EVERY PLANNER WEEK THAT EXISTED BEFORE 2026-07-17. */
const UNANCHORED_ROTA: PlannerWeek[] = rota([null, null, null, null, null, null]);

async function main(): Promise<void> {
  console.log("\nTIME3 Phase 4 — CONV1 P7 / SCH-2: the planner week anchor");
  console.log("=".repeat(57));

  // ───────────────────────────────────────────────────────────────────────────
  section("§1 The specification — TIME1 § 6.2, the only moment THA may write it");

  // A household creating their planner on Friday 2026-07-17, in the UK.
  const creation = new Date("2026-07-17T09:00:00Z");
  const uk = anchorsAtCreation(creation, "Europe/London");

  assert(uk.length === 6, "six slots are anchored — the rota is bounded 1–6 and all six are created at first touch");
  assert(uk[0] === "2026-07-13", "slot 1 is the Monday of the week the household is living in (Fri 17 July → Mon 13 July)", uk[0]);
  assert(uk[1] === "2026-07-20", "slot 2 IS next week — exactly what the UX has always promised (TIME1 § 6.2)", uk[1]);
  assert(uk[5] === "2026-08-17", "slot 6 is five weeks after slot 1", uk[5]);

  // 7 × (N − 1): consecutive, because at creation they are BEING MADE consecutive.
  const gaps = uk.slice(1).map((d, i) => {
    const a = parseCivilDate(uk[i]) as CivilDate;
    const b = parseCivilDate(d) as CivilDate;
    return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000);
  });
  assert(gaps.every((g) => g === 7), "every slot is exactly 7 days after the last — 7 × (N − 1)", gaps.join(","));

  // Every anchor is a Monday. The week convention is the OWNER's (HT1), not the
  // planner's — so the planner cannot disagree with the platform about where a
  // week starts.
  const allMondays = uk.every((d) => {
    const c = parseCivilDate(d) as CivilDate;
    return formatCivilDate(householdWeekOf(c).start) === d;
  });
  assert(allMondays, "every anchor is a Monday — the household week starts Monday, and that rule is the owner's (HT1)");

  // Slot 1's week genuinely contains the day the household is having. This is what
  // makes anchoring here an OBSERVATION OF THE PRESENT rather than a reconstruction.
  const today = householdToday(creation, "Europe/London");
  const wk = householdWeekOf(today);
  assert(
    formatCivilDate(wk.start) === uk[0],
    "slot 1's Monday opens the week that CONTAINS the household's today — an observation of the present, not a guess about the past",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§2 The zone decides which WEEK — and this test can fail (HT4, HT12)");

  // The instant is chosen because the zones genuinely DISAGREE ABOUT THE WEEK, not
  // merely about the day. P6's § 5 recorded a fixture that could not fail (it ran at
  // an hour when every zone agreed); this one is a whole week wide.
  //
  //   2026-07-19T23:30Z  ·  Sunday night, UTC
  //     London (BST, UTC+1) → it is already Monday 20 July → week of Mon 20 July
  //     New York (UTC-4)    → it is still Sunday 19 July   → week of Mon 13 July
  const boundary = new Date("2026-07-19T23:30:00Z");
  const london = anchorsAtCreation(boundary, "Europe/London");
  const newYork = anchorsAtCreation(boundary, "America/New_York");

  assert(london[0] === "2026-07-20", "London at 00:30 BST Monday anchors slot 1 to the week of Mon 20 July", london[0]);
  assert(newYork[0] === "2026-07-13", "New York at 19:30 EDT Sunday anchors slot 1 to the week of Mon 13 July", newYork[0]);
  assert(london[0] !== newYork[0], "TWO HOUSEHOLDS, ONE INSTANT, DIFFERENT WEEKS — the fixture can fail, so the pass means something");

  // THE DEFECT THE FRAME AVOIDS, stated as the arithmetic that would have caused it.
  // This is the retired shape from READ-4, applied to the anchor: serialise the
  // instant through UTC and read a civil date off it.
  const utcNaiveMonday = formatCivilDate(
    householdWeekOf(parseCivilDate(boundary.toISOString().slice(0, 10)) as CivilDate).start,
  );
  assert(utcNaiveMonday === "2026-07-13", "a UTC-stamped anchor would resolve to the week of Mon 13 July", utcNaiveMonday);
  assert(
    utcNaiveMonday !== london[0],
    "…which is A WHOLE WEEK EARLY for the London household — not a day, a week, across all six of their slots (HT12)",
  );

  // The declared default is a stated answer for a household THA has not been told
  // about — never a silent write to their row (CP8).
  assert(DECLARED_DEFAULT_ZONE === "Europe/London", "the declared default is Europe/London, stated in the owner");
  assert(
    anchorsAtCreation(creation, DECLARED_DEFAULT_ZONE)[0] === "2026-07-13",
    "a household with no zone anchors on the DECLARED default, resolved at write time — a stated answer, not an inference (CP8)",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§3 What the anchor makes possible — anchored:true, for the first time");

  const anchored = rota(uk);
  const inWeek1 = resolvePlannerWeek(householdToday(creation, "Europe/London"), anchored);
  assert(inWeek1.anchored === true, "a P7-created rota resolves ANCHORED — the answer THA could not give before today");
  assert(inWeek1.anchored === true && inWeek1.week.weekNumber === 1, "…to slot 1");
  assert(inWeek1.anchored === true && inWeek1.relation === "this", "…with relation 'this' — 'This Week' finally means the week they are in");

  // Same rota, a fortnight later: the household is living in slot 3. Nothing was
  // rewritten; the ANSWER moved because the calendar did.
  const later = resolvePlannerWeek(parseCivilDate("2026-07-29") as CivilDate, anchored);
  assert(later.anchored === true && later.week.weekNumber === 3, "a fortnight on, the same rota resolves to slot 3 — no row changed, the calendar did");
  assert(later.anchored === true && later.relation === "this", "…still 'this', because slot 3's week contains that day");

  // § 6.3 — the window has been expiring all along, and nothing could see it.
  const expired = resolvePlannerWeek(parseCivilDate("2026-09-14") as CivilDate, anchored);
  assert(
    expired.anchored === false && expired.reason === "window-expired",
    "past the end of the six slots the answer is 'window-expired' — a state that has ALWAYS existed and was invisible (TIME1 § 6.3)",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§4 HT7 — the refusal. NULL is the answer, and it survives");

  // 4.1 — the honest floor for every week that existed before today.
  const floor = resolvePlannerWeek(today, UNANCHORED_ROTA);
  assert(floor.anchored === false, "an unanchored rota resolves anchored:false — never a throw, never a guess (HT6)");
  assert(floor.anchored === false && floor.reason === "no-anchor", "…with reason 'no-anchor': THA states that it does not know");

  // 4.2 — a mixed rota. Weeks created after P7 are anchored; the household's older
  // weeks are not, and are NOT inferred from the ones that are.
  const mixed = rota([null, null, "2026-07-13", "2026-07-20", null, null]);
  const onMixed = resolvePlannerWeek(parseCivilDate("2026-07-15") as CivilDate, mixed);
  assert(onMixed.anchored === true && onMixed.week.weekNumber === 3, "a MIXED rota resolves on the weeks that are real…");

  // The week BEFORE slot 3 is unanchored. Slot 3 opens on Mon 13 July, so it would
  // be trivial — and wrong — to call the week of Mon 6 July "slot 2". THA does not:
  // it names slot 3, the nearest week it can honestly locate, and says it is 'next'.
  // The neighbouring anchor is not evidence about an unanchored week (HT7).
  const beforeMixed = resolvePlannerWeek(parseCivilDate("2026-07-06") as CivilDate, mixed);
  assert(
    beforeMixed.anchored === true && beforeMixed.week.weekNumber === 3 && beforeMixed.relation === "next",
    "…and on the week before slot 3 it names SLOT 3 as 'next' — it does not subtract 7 and call that week 'slot 2'",
  );
  assert(
    beforeMixed.anchored === true && beforeMixed.week.weekStartDate !== null,
    "EVERY week the resolver ever names carries a REAL anchor — an unanchored slot is never returned as an anchored answer (HT7)",
  );

  // 4.3 — THE MIGRATION CARRIES NO BACK-FILL. The R5 mitigation, asserted over the
  // sanctioned DDL path itself rather than trusted.
  const runner = codeOf("server/migrations/runner.ts");
  assert(
    /ALTER TABLE planner_weeks ADD COLUMN IF NOT EXISTS week_start_date text\s*`/.test(runner),
    "the migration adds the column, nullable, with NO DEFAULT — a default would back-fill every row in one statement",
  );
  assert(
    !/UPDATE\s+planner_weeks[\s\S]{0,400}?week_start_date/i.test(runner),
    "no migration UPDATEs the anchor (CONV1 R5 — the one-line 'fix' that would look like housekeeping)",
  );
  assert(
    !/week_start_date[^`]*NOT NULL/i.test(runner),
    "the column is never made NOT NULL — that would make the honest gap unrepresentable",
  );

  // 4.4 — THE FUNNEL. `existing.length > 0 → return existing` is the no-back-fill
  // guarantee, not an optimisation: a household that already has weeks gets them
  // back exactly as they are, NULL included.
  const storage = codeOf("server/storage.ts");
  const funnel = /async createPlannerWeeks\s*\([\s\S]*?\n  \}/.exec(storage)?.[0] ?? "";
  assert(funnel !== "", "createPlannerWeeks is still the Planner's single write funnel (CPuBA4 — no new writer)");
  assert(
    /if \(existing\.length > 0\) return existing;/.test(funnel),
    "existing weeks are returned untouched, BEFORE any anchor is computed — the no-back-fill guarantee in one line (HT7)",
  );
  assert(
    /weekStartDate: formatCivilDate\(addCivilDays\(thisMonday, 7 \* \(w - 1\)\)\)/.test(funnel),
    "the funnel writes the spec verbatim: mondayOf(...) + 7 × (N − 1) — so this suite and the code cannot drift apart",
  );
  assert(
    /const thisMonday = householdWeekOf\(householdToday\(new Date\(\), zone\)\)\.start;/.test(funnel),
    "the Monday comes from the OWNER's week arithmetic, not a private one (HT1/HT11)",
  );
  assert(
    !/getDay\(\)|toISOString\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/.test(funnel),
    "the funnel derives no civil date from an ambient or UTC frame (HT12)",
  );

  // 4.5 — the legacy-row repair path repairs household_id ONLY. This is the most
  // plausible place a back-fill would ever appear: it would look like finishing
  // the repair.
  const repair = /\.update\(plannerWeeks\)\s*\.set\(\{[\s\S]*?\}\)/.exec(funnel)?.[0] ?? "";
  assert(repair !== "", "the legacy null-household repair path is still present");
  assert(
    !/weekStartDate/.test(repair),
    "…and it stamps NO anchor: those rows' creation moment has passed, so their week is unknowable and stays NULL (HT7)",
  );

  // 4.6 — nothing anywhere else writes it.
  for (const file of ["server/routes.ts", "server/benchmark/world-seeder.ts", "scripts/import-development-world.ts"]) {
    const code = codeOf(file);
    const writes = Array.from(
      code.matchAll(/\.update\(\s*plannerWeeks\s*\)[\s\S]{0,200}?\.set\(\s*\{([\s\S]*?)\}\s*\)/g),
    );
    assert(
      !writes.some((m) => /weekStartDate/.test(m[1])),
      `${file} does not update the anchor — createPlannerWeeks is the only writer (HT7)`,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  section("§5 The floor is unmoved — nothing regresses for an unanchored household");

  // P7 converges NO consumer, so the whole of "nothing regresses" is this: the
  // answer for a household with no anchors must be byte-identical to P5/P6's.
  const floorCases: Array<[string, CivilDate]> = [
    ["today", today],
    ["a year ago", parseCivilDate("2025-07-17") as CivilDate],
    ["a year ahead", parseCivilDate("2027-07-17") as CivilDate],
  ];
  for (const [label, d] of floorCases) {
    const r = resolvePlannerWeek(d, UNANCHORED_ROTA);
    assert(
      r.anchored === false && r.reason === "no-anchor",
      `the unanchored floor is unchanged at ${label} — anchored:false / no-anchor, the caller keeps today's behaviour (HT6)`,
    );
  }
  assert(
    resolvePlannerWeek(today, []).anchored === false &&
      (resolvePlannerWeek(today, []) as { reason: string }).reason === "no-weeks",
    "no weeks at all is still 'no-weeks', distinct from 'no-anchor' — totality (HT6)",
  );

  // Totality under abuse: a malformed anchor is not a crash and not a guess.
  const rubbish: PlannerWeek[] = [{ weekNumber: 1, weekStartDate: { year: 2026, month: 2, day: 31 } as CivilDate }];
  const onRubbish = resolvePlannerWeek(today, rubbish);
  assert(onRubbish.anchored === false, "a malformed anchor resolves to anchored:false, never a throw (HT6)");

  // The owner is still the owner: P7 gave it no clock and no season.
  const owner = codeOf("shared/time/household-time.ts");
  assert(!/new Date\(\)|Date\.now\(\)/.test(owner), "HT5: P7 did not give the owner a clock — the funnel reads it, the module never does");
  assert(!/"(spring|summer|autumn|winter)"/.test(owner), "HT17: P7 did not give the owner a season");

  // HT3 — the anchor is a FACT (which week a slot means), not a derivation. Nothing
  // derived from it is stored: "this week" is still computed, every time.
  const schema = codeOf("shared/schema.ts");
  assert(
    !/\bcurrentWeekNumber\b|"current_week_number"|\bcachedToday\b|"cached_today"/.test(schema),
    "HT3: no derivation of household time is stored — the anchor is a fact; 'the current week' remains computed",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§6 Design (c) vs the rejected design (a) — why the anchor is PER WEEK");

  // TIME1 § 6.1 rejected the household epoch ("slot 1 began on D; slot N = D + 7(N−1)")
  // because NOTHING ENFORCES that the six slots stay calendar-consecutive. Here is a
  // household who skipped a fortnight between slot 2 and slot 3 — representable under
  // (c), and silently wrong under (a).
  const skipped = rota(["2026-07-13", "2026-07-20", "2026-08-10", "2026-08-17", null, null]);

  const inSkipped = resolvePlannerWeek(parseCivilDate("2026-08-12") as CivilDate, skipped);
  assert(inSkipped.anchored === true && inSkipped.week.weekNumber === 3, "a household who SKIPPED a fortnight resolves correctly to slot 3 — resolution is a LOOKUP");

  // What design (a) would have said, computed the way an epoch must:
  //   slot(today) = 1 + floor((today − D) / 7)  with D = slot 1's Monday
  const epochAnswer = 1 + Math.floor(
    (Date.UTC(2026, 7, 12) - Date.UTC(2026, 6, 13)) / (7 * 86_400_000),
  );
  assert(epochAnswer === 5, "…where a household epoch would have computed slot 5", String(epochAnswer));
  assert(
    epochAnswer !== 3,
    "THE REJECTED DESIGN IS WRONG BY TWO SLOTS for this household — and it would have been confidently wrong, which is exactly approxDate (TIME1 § 6.1)",
  );

  // And the fortnight they skipped is genuinely unplanned territory. THA does not
  // pretend they are living in a planned week — it names the next week they DID plan
  // and says plainly that it is 'ahead', not 'this'. Under design (a) the same day
  // would have been reported as slot 3 'this', because an epoch cannot express a gap.
  const inGap = resolvePlannerWeek(parseCivilDate("2026-07-29") as CivilDate, skipped);
  assert(
    inGap.anchored === true && inGap.relation === "ahead" && inGap.week.weekNumber === 3,
    "in the skipped fortnight THA names the next week they actually planned (slot 3) and calls it 'ahead'",
  );
  assert(
    inGap.anchored === true && inGap.relation !== "this",
    "…and never 'this': the household is not living in a planned week, and THA does not claim they are",
  );

  // ───────────────────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(57)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log("  CONV1 P7 — the anchor exists. It is written once, at creation,");
  console.log("  and every week that came before it stays honestly unknown.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
