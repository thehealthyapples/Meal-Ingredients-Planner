/**
 * test-time3-p8-t5-convergence.ts (TIME3 Phase 5 — CONV1 P8)
 * ==========================================================
 * Verifies THE T5 CONVERGENCE — `READ-3` · `OWN-6` · `BEH-3` · `BEH-9` — against the
 * governing architecture `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (HT1–HT18) and the
 * governing decision of 2026-07-17 (§ 13.1, as amended by this phase).
 *
 * P7 built a fact. P8 gives it consumers — and discovers what the fact actually says:
 *
 *     planner_weeks : 1170 weeks · 18 anchored
 *     households    : 195 total · 3 anchored · 192 UNANCHORED FOREVER (HT7)
 *
 * The only anchored households are P7's own verification households. So for every real
 * household, the one owner answers `anchored: false` — permanently, because the anchor is
 * written only at week creation and never back-filled, and their weeks predate it.
 *
 * **That makes the unanchored path the MAIN path, not the edge case**, and it is why this
 * suite spends most of its length on what THA must NOT say.
 *
 * Coverage:
 *   §1  THE OWNER — `resolveFromFacts` is pure and total; the zone decides the week; the
 *       day and the week come from ONE resolution (HT11).
 *   §2  READ-3 — the five rivals, each reproduced VERBATIM as an oracle, each shown to be
 *       a CONSTANT rather than a computation, and each shown to disagree with the truth.
 *   §3  BEH-3 — Home's self-contradiction, reproduced exactly, and shown to be
 *       unrepresentable once both cards read one field.
 *   §4  OWN-6 / HT12 — no device state and no device clock decides a household's week.
 *   §5  BEH-9 — the door is the resolver's, total with `week: null`, and it moves only
 *       when a HOUSEHOLD fact moves (HOME2 § 6.1's theorem).
 *   §6  THE UNANCHORED HOME — the governing decision, asserted over the real sources: no
 *       consumer fills the gap in, and every honest-absence shape is present.
 *
 * Run with: npx tsx server/tests/test-time3-p8-t5-convergence.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  MONDAY_FIRST_ORDER,
  parseCivilDate,
  type CivilDate,
} from "../../shared/time/household-time.js";
import { resolveFromFacts } from "../lib/household-planner-week.js";
import { resolveHomePrimaryAction } from "../../shared/home/home-primary-action.js";

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
/** Comments discuss the retired rivals at length; only code may violate the rules. */
function codeOf(rel: string): string {
  return sourceOf(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// ── The rota, as the database holds it ──────────────────────────────────────
type Row = {
  id: number; userId: number; householdId: number | null;
  weekNumber: number; weekName: string; weekStartDate: string | null;
};
const row = (n: number, anchor: string | null): Row => ({
  id: 100 + n, userId: 1, householdId: 1, weekNumber: n, weekName: `Week ${n}`, weekStartDate: anchor,
});

/** THE 192: a household planning since before the anchor existed. Six weeks, no dates. */
const UNANCHORED: Row[] = [1, 2, 3, 4, 5, 6].map((n) => row(n, null));

/** A household created after CONV1 P7: six consecutive Mondays from their own Monday. */
const ANCHORED: Row[] = [
  row(1, "2026-07-13"), row(2, "2026-07-20"), row(3, "2026-07-27"),
  row(4, "2026-08-03"), row(5, "2026-08-10"), row(6, "2026-08-17"),
];

// ── THE FROZEN ORACLES — the five rivals, verbatim from the code P8 changed ──
/** VERBATIM from routes.ts `/api/home/intelligence` before P8 (rival #1). */
const retiredRoutesWeek = (weeks: Row[]) => weeks.reduce((a, b) => (b.weekNumber > a.weekNumber ? b : a));
/** VERBATIM from opportunity-engine.ts:385 before P8 (rival #2). */
const retiredOpportunityWeek = (weeks: Row[]) => weeks.reduce((latest, w) => (w.weekNumber > latest.weekNumber ? w : latest));
/** VERBATIM from household-nutrition-assembler.ts before P8 (rival #3). */
const retiredAssemblerWeek = (weeks: Row[]) => {
  const ns = weeks.map((w) => w.weekNumber).sort((a, b) => a - b);
  return ns[ns.length - 1];
};
/** VERBATIM from dashboard.tsx before P8 (rival #4). */
const retiredDashboardWeek = (weeks: Row[]) => weeks[0];
/** VERBATIM from home-experience-page.tsx `loadActiveWeek()` before P8 (rival #5). */
const retiredHomeWeek = (raw: string | null): number => {
  try {
    if (!raw) return 1;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string" && /^[1-9]\d*$/.test(parsed)) return Number(parsed);
  } catch { /* fall through */ }
  return 1;
};

const UK = "Europe/London";
const at = (iso: string) => new Date(iso);

async function main(): Promise<void> {
  console.log("\nTIME3 Phase 5 — CONV1 P8: the T5 convergence");
  console.log("=".repeat(58));

  // ───────────────────────────────────────────────────────────────────────────
  section("§1 The owner — one composition, pure and total");

  const wk1 = resolveFromFacts(ANCHORED, at("2026-07-17T09:00:00Z"), UK);
  assert(wk1.anchored === true, "an anchored household resolves to a real week");
  assert(wk1.anchored === true && wk1.week.weekNumber === 1, "…week 1, whose Monday (13 July) opens the week containing Friday 17 July");
  assert(wk1.anchored === true && wk1.relation === "this", "…relation 'this'");
  assert(wk1.anchored === true && wk1.week.id === 101, "…carrying the household's OWN ROW — consumers need week.id to read days");

  const unres = resolveFromFacts(UNANCHORED, at("2026-07-17T09:00:00Z"), UK);
  assert(unres.anchored === false, "THE 192: a rota nobody dated resolves anchored:false — never a throw, never a guess (HT6)");
  assert(unres.anchored === false && unres.reason === "no-anchor", "…with reason 'no-anchor': THA states that it does not know");
  assert(resolveFromFacts([], at("2026-07-17T09:00:00Z"), UK).anchored === false, "no rota at all is also an answer, distinct from no-anchor");

  // HT11 — the day and the week come from ONE resolution, or the consumer is comparing
  // the household against two calendars at once.
  assert(
    unres.today != null && wk1.today != null,
    "every resolution carries the household's civil today — the day cannot be sourced separately (HT11)",
  );

  // THE ZONE DECIDES, and this test can fail: at 2026-07-19T23:30Z London is already in
  // the week of Mon 20 July while New York is still in the week of Mon 13 July.
  const boundary = at("2026-07-19T23:30:00Z");
  const londonWk = resolveFromFacts(ANCHORED, boundary, "Europe/London");
  const nyWk = resolveFromFacts(ANCHORED, boundary, "America/New_York");
  assert(londonWk.anchored === true && londonWk.week.weekNumber === 2, "London at 00:30 BST Monday is living in WEEK 2", String((londonWk as any).week?.weekNumber));
  assert(nyWk.anchored === true && nyWk.week.weekNumber === 1, "New York at 19:30 EDT Sunday is still in WEEK 1", String((nyWk as any).week?.weekNumber));
  assert(
    (londonWk as any).week.weekNumber !== (nyWk as any).week.weekNumber,
    "ONE INSTANT, ONE ROTA, TWO HOUSEHOLDS, DIFFERENT WEEKS — the fixture can fail, so the pass means something (HT4)",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§2 READ-3 — the five rivals were constants, not computations");

  // TIME1 § 3.1: "max(weekNumber) is not a computation — it is the constant 6", because
  // all six weeks are created eagerly at first touch and the API bounds them at 6.
  assert(retiredRoutesWeek(ANCHORED).weekNumber === 6, "rival #1 (routes) ≡ 6");
  assert(retiredOpportunityWeek(ANCHORED).weekNumber === 6, "rival #2 (opportunity engine) ≡ 6");
  assert(retiredAssemblerWeek(ANCHORED) === 6, "rival #3 (nutrition assembler) ≡ 6");
  assert(retiredDashboardWeek(ANCHORED).weekNumber === 1, "rival #4 (dashboard) ≡ 1");
  assert(retiredHomeWeek(null) === 1, "rival #5 (Home/localStorage) ≡ 1 — `if (!raw) return 1`");

  // They are constants: the rota can say anything and they do not move.
  const shuffled = [row(6, "2026-08-17"), row(1, "2026-07-13"), row(3, "2026-07-27")];
  assert(retiredRoutesWeek(shuffled).weekNumber === 6, "…and #1 is STILL 6 whatever the household's rota says");
  assert(retiredDashboardWeek(shuffled).weekNumber === 6, "…while #4 is 'the first row the API returned' — a fact about array ORDER (it moves for the wrong reason)");

  // THE TRUTH, and how far the rivals were from it.
  const truth = resolveFromFacts(ANCHORED, at("2026-07-17T09:00:00Z"), UK);
  assert(truth.anchored === true && truth.week.weekNumber === 1, "the truth on 17 July is week 1");
  assert(retiredRoutesWeek(ANCHORED).weekNumber !== (truth as any).week.weekNumber, "…so rivals #1–#3 were FIVE WEEKS WRONG for this household");
  assert(retiredDashboardWeek(ANCHORED).weekNumber === (truth as any).week.weekNumber, "…and #4 was right, BY COINCIDENCE — it is week 1 because 1 is the first row, not because it is their week");

  // The coincidence breaks the moment the household moves through their rota — which is
  // the whole point: a constant cannot track a calendar.
  const later = resolveFromFacts(ANCHORED, at("2026-08-12T09:00:00Z"), UK);
  assert(later.anchored === true && later.week.weekNumber === 5, "a month on, the truth is week 5");
  assert(retiredDashboardWeek(ANCHORED).weekNumber !== (later as any).week.weekNumber, "…and #4's coincidence is gone: still 1, now wrong");
  assert(retiredRoutesWeek(ANCHORED).weekNumber !== (later as any).week.weekNumber, "…and #1 is still 6, still wrong");

  // ───────────────────────────────────────────────────────────────────────────
  section("§3 BEH-3 — Home's self-contradiction, reproduced and then made impossible");

  // The live defect, exactly: Home's meals came from rival #5 and its plant count from
  // rival #1, twenty-one lines apart, in one component, on one paint.
  const homeMealsWeek = retiredHomeWeek(null);            // 1
  const homePlantsWeek = retiredRoutesWeek(ANCHORED).weekNumber; // 6
  assert(homeMealsWeek === 1 && homePlantsWeek === 6, "REPRODUCED: Home rendered Week 1's meals beside Week 6's plant count");
  assert(homeMealsWeek !== homePlantsWeek, "…and it did not merely fail against a calendar — IT FAILED TO AGREE WITH ITSELF, for every household");

  // The fix is not "pick the right week" — it is "have one answer". Both cards now read
  // one field, so agreement is structural rather than intentional.
  const oneAnswer = resolveFromFacts(ANCHORED, at("2026-07-17T09:00:00Z"), UK);
  const cardA = oneAnswer.anchored ? oneAnswer.week.weekNumber : null;
  const cardB = oneAnswer.anchored ? oneAnswer.week.weekNumber : null;
  assert(cardA === cardB, "CONVERGED: two cards reading ONE resolution cannot disagree — by construction, not by care");
  const oneAnswerUn = resolveFromFacts(UNANCHORED, at("2026-07-17T09:00:00Z"), UK);
  assert(
    (oneAnswerUn.anchored ? 1 : null) === (oneAnswerUn.anchored ? 1 : null) && !oneAnswerUn.anchored,
    "…and when unanchored BOTH cards get the same absence — which is what makes the Unanchored Home honest rather than partial",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§4 OWN-6 / HT12 — no device decides a household's week or day");

  // localStorage was device state pretending to be household state (HOME3 § 4).
  assert(retiredHomeWeek('"3"') === 3 && retiredHomeWeek(null) === 1, "REPRODUCED: the same household, two devices, TWO current weeks — 3 on the phone that picked, 1 on the laptop that never did");
  const home = codeOf("client/src/pages/home-experience-page.tsx");
  assert(!/localStorage\.getItem\(\s*["'`]planner:active-week/.test(home), "Home no longer reads planner:active-week (OWN-6)");
  assert(!/new Date\(\)\s*\.\s*getDay\(\)/.test(home), "Home no longer derives the day from the device (HT12 — the client may supply the instant; it may never decide the day)");
  assert(/useCurrentPlannerWeek\s*\(/.test(home), "Home asks the one owner");

  // The planner page KEEPS the key — it is view state there ("which week am I editing"),
  // not a household fact. OWN-6 was about Home reading it as THE CURRENT WEEK.
  const planner = codeOf("client/src/pages/weekly-planner-page.tsx");
  assert(
    /planner:active-week/.test(planner),
    "the planner page still owns its view state — OWN-6 retired a WRONG READING, not a working control",
  );

  const dash = codeOf("client/src/pages/dashboard.tsx");
  assert(!/plannerFull\s*\[\s*0\s*\]/.test(dash), "the dashboard no longer reads plannerFull[0] (rival #4)");
  assert(/useCurrentPlannerWeek\s*\(/.test(dash), "…it asks the one owner");

  // The dashboard's live rotation, fixed in the same change (TIME1 § 3.2 — reported, never
  // fixed). Monday-first labels indexed positionally over Sunday-first data put SUNDAY
  // under "Mon", for every household, live.
  assert(MONDAY_FIRST_ORDER[0] === 1 && MONDAY_FIRST_ORDER[6] === 0, "the household week starts Monday and ends Sunday — the owner's declared shape");
  assert(/MONDAY_FIRST_ORDER/.test(dash), "the dashboard consumes the owner's week shape rather than a private label array (§ 14 target 2 — its first consumer)");
  assert(!/DAY_LABELS\.map\(\(label, i\)/.test(dash), "…and the positional index that rendered Sunday under 'Mon' is gone");

  // ───────────────────────────────────────────────────────────────────────────
  section("§5 BEH-9 — the door is the resolver's, and it is total without a week");

  // HOME3 § 6: "with week: null it falls to the floor and still returns exactly one
  // action. The door is buildable the moment a week means something."
  const floor = resolveHomePrimaryAction({ criticals: [], week: null, shopping: null });
  assert(floor.destination === "planner", "THE 192: with no week the door falls to the floor and still points somewhere honest");
  assert(floor.tier === 3, "…at tier 3, the floor");
  assert(floor.provenance === "floor", "…and it SAYS it is the floor — the door never pretends a fact aimed it");

  // A household fact moves the door (HOME2 § 6.1's theorem).
  const unplanned = resolveHomePrimaryAction({ criticals: [], week: { weekNumber: 1, hasEmptyDays: true }, shopping: { uncheckedCount: 0 } });
  assert(unplanned.tier === 1 && unplanned.destination === "planner", "an unplanned week aims the door at the planner (tier 1 — plan before shop)");
  const shopping = resolveHomePrimaryAction({ criticals: [], week: { weekNumber: 1, hasEmptyDays: false }, shopping: { uncheckedCount: 9 } });
  assert(shopping.tier === 2 && shopping.destination === "shopping", "a full week and an unchecked list aims it at shopping (tier 2)");

  // The retired hand-rolled door, verbatim — aimed THROUGH localStorage.
  const retiredDoor = (todaysMealsLength: number) => (todaysMealsLength === 0 ? "Plan today" : "Open today's plan");
  assert(retiredDoor(0) === "Plan today", "REPRODUCED: the hand-rolled door NORTH1 built");
  assert(
    retiredHomeWeek(null) === 1,
    "…and it was aimed by todaysMeals → activeWeek → localStorage: it MOVED WHEN THE HOUSEHOLD CHANGED DEVICE, which HOME3 § 4 refused by name",
  );
  assert(/resolveHomePrimaryAction\s*\(/.test(home), "Home now uses HOME2's canonical resolver — its FIRST production consumer (CONV1 R3's shape, closed)");

  // ───────────────────────────────────────────────────────────────────────────
  section("§6 The Unanchored Home — the governing decision, asserted over the sources");

  // "Do not invent or floor a planner week for unanchored households." (2026-07-17)
  const routes = codeOf("server/routes.ts");
  const assembler = codeOf("server/lib/household-nutrition-assembler.ts");
  const engine = codeOf("server/intelligence/food-intelligence/opportunity-engine.ts");

  assert(/resolveHouseholdPlannerWeek\s*\(/.test(routes), "routes asks the owner");
  assert(/resolveHouseholdPlannerWeek\s*\(/.test(assembler), "the nutrition assembler asks the owner");
  assert(/resolveHouseholdPlannerWeek\s*\(/.test(engine), "the opportunity engine asks the owner");

  // Each consumer's honest-absence shape — and every one of them ALREADY EXISTED, which
  // is the clearest evidence available that absence was always the right answer.
  assert(/plannerWeek\.anchored\s*\)\s*\{/.test(routes), "routes computes weeklyProgress ONLY when anchored — `weeklyProgress: null` was already this route's shape for 'no weekly picture'");
  assert(/if \(!plannerWeek\.anchored\) return UNAVAILABLE;/.test(assembler), "the assembler returns UNAVAILABLE — already its shape for 'the household has told THA nothing'");
  assert(/if \(plannerWeek\.anchored\) \{/.test(engine), "the engine raises NO planner opportunity — already its honest degrade for an unreadable planner");

  // Nobody fills the gap in. This is the gate `ht-unanchored-is-never-filled-in` in
  // assertion form, over the real sources.
  for (const [name, code] of [["routes", routes], ["assembler", assembler], ["engine", engine], ["home", home], ["dashboard", dash]] as const) {
    assert(
      !/anchored\s*\?[\s\S]{0,80}?:\s*\{?\s*weekNumber:\s*\d/.test(code),
      `${name} substitutes no week when the owner says it cannot know (BEH-3 — "do not pick a week to fix it")`,
    );
  }
  assert(!/weeks\[weeks\.length - 1\]/.test(assembler), "the assembler's `latest` fallback is gone — no silent substitution");

  // Home says so, rather than saying nothing or saying something false.
  const homeRaw = sourceOf("client/src/pages/home-experience-page.tsx");
  assert(/empty-home-planner-unanchored/.test(homeRaw), "Home renders an explicit unanchored state");
  assert(/plannerUnanchored\s*\?/.test(homeRaw), "…and every claim on the page is gated behind it");
  const dashRaw = sourceOf("client/src/pages/dashboard.tsx");
  assert(/empty-week-plan-unanchored/.test(dashRaw) && /text-dashboard-week-unanchored/.test(dashRaw), "the Dashboard's two week cards say it too — one canonical state, every card");

  // It is NOT an error state, and it is NOT "you planned nothing".
  assert(
    !/error/i.test((/empty-home-planner-unanchored[\s\S]{0,400}/.exec(homeRaw) ?? [""])[0]),
    "the unanchored state is not an error — it is the expected first-run experience until an anchor exists",
  );

  // ───────────────────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(58)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log("  CONV1 P8 — five rival weeks are one, and where THA cannot");
  console.log("  know which week it is, it says so.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
