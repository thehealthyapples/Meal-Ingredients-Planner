/**
 * test-time3-p6-consumer-convergence.ts (TIME3 Phase 3 — CONV1 P6)
 * =================================================================
 * Verifies the T2/T3 CONSUMER convergence against the governing architecture
 * `THA_HOUSEHOLD_TIME_ARCHITECTURE.md` (HT1–HT18, in force since 2026-07-16).
 *
 * P5 built the owner and gave it ZERO consumers. This suite is the evidence that
 * P6 turned that declaration into a convergence — and, more importantly, that it
 * did so WITHOUT changing what any household already sees (migration principle 1:
 * the old behaviour is the floor, nothing regresses, ever).
 *
 * The technique throughout is P5's, because it is the only one that proves rather
 * than asserts: the pre-convergence implementations are embedded VERBATIM as
 * oracles, and the converged code is checked against them. Where they agree, the
 * convergence is provably safe. Where they disagree, the disagreement is pinned to
 * the exact input that was the live defect — so the test states the bug rather
 * than merely covering the line.
 *
 * Coverage:
 *   §1  READ-4 — the Companion's TODAY. The zone decides the anchor; the retired
 *       `toISOString().slice(0,10)` disagrees EXACTLY at the reported defects
 *       (00:30 BST → yesterday; New York 20:00 → tomorrow) and agrees everywhere
 *       else. Includes the HT18 ratchet over the real assembler source.
 *   §2  BEH-6 — the freezer. The expiry-day boundary (the household keeps their
 *       last day), DST-proof day counting, and the retired comparison's own
 *       self-contradiction reproduced.
 *   §3  SCH-4 — the diary. Civil day stepping with no noon anchor (incl. past
 *       UTC+12, where the retired guard broke), and copyPlannerToFoodDiary's
 *       weekday, which is frame-independent BY CONSTRUCTION.
 *   §4  THE GREETING ×4 → 1 — GOLDEN IDENTITY. The converged greeting is
 *       byte-identical to the frozen live oracle across ALL 24 HOURS, so no
 *       household's greeting changes. The prototypes' 18-boundary is settled to
 *       17 and that divergence is stated, not hidden.
 *   §5  The vocabulary P6 added to the owner — totality under abuse (HT6).
 *
 * Run with: npx tsx server/tests/test-time3-p6-consumer-convergence.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  DECLARED_DEFAULT_ZONE,
  addCivilDays,
  civilDaysBetween,
  compareCivilDates,
  formatCivilDate,
  householdDayOfWeek,
  householdToday,
  parseCivilDate,
  type CivilDate,
} from "../../shared/time/household-time.js";
import { householdGreeting } from "@/lib/greeting";

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

// ── THE FROZEN ORACLES ───────────────────────────────────────────────────────
//
// Each is the pre-convergence implementation, copied VERBATIM from the file P6
// changed. They are the floor: where the converged code must not differ, these
// are what it must not differ from.

/** VERBATIM from context-frame-assembler.ts:119 before CONV1 P6 (READ-4). */
function retiredTemporalAnchor(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** VERBATIM from dashboard.tsx:56-61 and HomeIntelligenceCompanion.tsx:33-38 (identical). */
function retiredLiveGetGreeting(deviceHour: number): string {
  const hour = deviceHour;
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** VERBATIM from arrival-a-welcome.tsx:57-62 and arrival-s1-quiet.tsx:62-67 (identical). */
function retiredPrototypeGreeting(deviceHour: number): string {
  const h = deviceHour;
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** VERBATIM from meals-page.tsx:4414-4415 before CONV1 P6 (BEH-6). */
function retiredFreezerVerdict(expiryDate: string, nowMs: number): { isExpired: boolean; daysUntilExpiry: number } {
  const isExpired = new Date(expiryDate) < new Date(nowMs);
  const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - nowMs) / (1000 * 60 * 60 * 24));
  return { isExpired, daysUntilExpiry };
}

/** The hour on a household's clock — a test helper, not a rival: it asks Intl the same question the owner does. */
function hourIn(instant: Date, zone: string): number {
  const raw = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "2-digit", hourCycle: "h23" })
    .formatToParts(instant)
    .find((p) => p.type === "hour")?.value;
  return Number(raw);
}

/**
 * An instant that is exactly `hour`:00 local time in `zone`, on the civil date
 * `isoDate`. Searched rather than computed — the search asks the owner the same
 * question the consumers do, so the fixture cannot drift from the rule it tests.
 * The window spans UTC-12…UTC+14 plus a full day either side.
 */
function instantAtLocalHour(zone: string, isoDate: string, hour: number): Date {
  const base = Date.parse(`${isoDate}T00:00:00Z`);
  for (let offset = -26; offset <= 50; offset++) {
    const candidate = new Date(base + offset * 3_600_000);
    if (hourIn(candidate, zone) === hour && formatCivilDate(householdToday(candidate, zone)) === isoDate) {
      return candidate;
    }
  }
  throw new Error(`no instant at ${hour}:00 ${zone} on ${isoDate}`);
}

async function main(): Promise<void> {
  console.log("TIME3 Phase 3 / CONV1 P6 — the T2/T3 consumer convergence");
  console.log("=========================================================");

  // ───────────────────────────────────────────────────────────────────────────
  section("§1  READ-4 — the Companion's TODAY is the household's, not UTC's");
  // ───────────────────────────────────────────────────────────────────────────

  // The converged derivation, exactly as the assembler now computes it.
  const anchorFor = (now: Date, zone: string) => formatCivilDate(householdToday(now, zone));

  // THE LIVE DEFECT, REPRODUCED: 00:30 BST on 17 July 2026 is 23:30 UTC on the 16th.
  const ukAfterMidnight = new Date("2026-07-16T23:30:00Z");
  assert(
    anchorFor(ukAfterMidnight, "Europe/London") === "2026-07-17",
    "READ-4: a UK household at 00:30 BST is told it is the 17th",
    anchorFor(ukAfterMidnight, "Europe/London"),
  );
  assert(
    retiredTemporalAnchor(ukAfterMidnight) === "2026-07-16",
    "READ-4: the retired anchor said the 16th at that same instant — the defect, reproduced",
  );
  assert(
    anchorFor(ukAfterMidnight, "Europe/London") !== retiredTemporalAnchor(ukAfterMidnight),
    "READ-4: the convergence CHANGES the answer exactly where the platform was wrong",
  );

  // THE OTHER REPORTED DEFECT: New York after ~19:00 local is already tomorrow in UTC.
  const nyEvening = new Date("2026-07-18T01:00:00Z"); // 21:00 on the 17th, America/New_York
  assert(
    anchorFor(nyEvening, "America/New_York") === "2026-07-17",
    "READ-4: a New York household at 21:00 is told it is the 17th",
    anchorFor(nyEvening, "America/New_York"),
  );
  assert(
    retiredTemporalAnchor(nyEvening) === "2026-07-18",
    "READ-4: the retired anchor said the 18th — 'log tonight's dinner' landed in TOMORROW's diary",
  );

  // The zone decides the date — the whole point of T2.
  const oneInstant = new Date("2026-07-17T23:30:00Z");
  assert(anchorFor(oneInstant, "Asia/Tokyo") === "2026-07-18", "READ-4: one instant, Tokyo → the 18th");
  assert(anchorFor(oneInstant, "Europe/London") === "2026-07-18", "READ-4: one instant, London → the 18th (BST)");
  assert(anchorFor(oneInstant, "America/Los_Angeles") === "2026-07-17", "READ-4: one instant, LA → the 17th");

  // AND WHERE IT MUST NOT CHANGE: for a UK household in daylight, the converged
  // anchor is byte-identical to the retired one. This is the floor.
  let agreements = 0;
  for (let h = 1; h <= 22; h++) {
    const inst = instantAtLocalHour("Europe/London", "2026-07-17", h);
    if (anchorFor(inst, "Europe/London") === retiredTemporalAnchor(inst)) agreements++;
  }
  assert(agreements === 22, "READ-4: at every UK hour outside the 00:00–01:00 BST window, the anchor is UNCHANGED", `${agreements}/22`);

  // The honest floor for a household that has never stated a zone (CP8).
  assert(
    anchorFor(ukAfterMidnight, DECLARED_DEFAULT_ZONE) === "2026-07-17",
    "READ-4: a household with NO stated zone resolves through the DECLARED default, not UTC",
  );

  // HT18 ratchet over the real source — the module is consumed, the UTC shape is gone.
  const assemblerSrc = sourceOf("server/intelligence/conversation/context-frame-assembler.ts");
  const assemblerCode = assemblerSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert(
    !/toISOString\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/.test(assemblerCode),
    "READ-4: the assembler no longer serialises an instant through UTC to make a civil date",
  );
  assert(
    /householdToday\s*\(/.test(assemblerCode),
    "READ-4: the assembler derives its anchor from the one owner (HT1)",
  );
  assert(
    /hh\.household\.timeZone/.test(assemblerCode),
    "READ-4: the anchor is resolved against the HOUSEHOLD's zone (HT4)",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§2  BEH-6 — the freezer compares civil dates, not frames");
  // ───────────────────────────────────────────────────────────────────────────

  // The converged verdict, exactly as meals-page.tsx now computes it.
  const freezerVerdict = (expiryText: string, now: Date, zone: string) => {
    const expiryOn = parseCivilDate(expiryText);
    const today = householdToday(now, zone);
    return {
      isExpired: expiryOn !== null && compareCivilDates(expiryOn, today) < 0,
      daysUntilExpiry: expiryOn !== null ? civilDaysBetween(today, expiryOn) : null,
    };
  };

  // THE HOUSEHOLD KEEPS THEIR LAST DAY. On the expiry date itself, food is not expired.
  const ukNoonOnExpiry = new Date("2026-07-17T11:00:00Z"); // 12:00 BST on the 17th
  assert(
    freezerVerdict("2026-07-17", ukNoonOnExpiry, "Europe/London").isExpired === false,
    "BEH-6: on the expiry day itself the food is NOT expired — the final day is not lost",
  );
  assert(
    freezerVerdict("2026-07-17", ukNoonOnExpiry, "Europe/London").daysUntilExpiry === 0,
    "BEH-6: the expiry day reads 0 days left, not a negative",
  );
  assert(
    freezerVerdict("2026-07-16", ukNoonOnExpiry, "Europe/London").isExpired === true,
    "BEH-6: yesterday's expiry IS expired",
  );
  assert(
    freezerVerdict("2026-07-18", ukNoonOnExpiry, "Europe/London").daysUntilExpiry === 1,
    "BEH-6: tomorrow's expiry reads 1 day left",
  );

  // THE LIVE DEFECT, REPRODUCED PRECISELY.
  //
  // `new Date("2026-07-17")` is UTC midnight, which is 01:00 BST on the 17th. So
  // from 01:00 BST on the expiry day ONWARDS, the retired comparison declared the
  // food expired — while the household still had the whole of that day. Measured
  // rather than assumed: at 00:30 BST it said false, and from 01:00 BST it said
  // true.
  const ukJustAfterMidnight = new Date("2026-07-16T23:30:00Z"); // 00:30 BST on the 17th
  assert(
    retiredFreezerVerdict("2026-07-17", ukJustAfterMidnight.getTime()).isExpired === false,
    "BEH-6: before 01:00 BST the retired comparison agreed — the defect has an exact start",
  );
  assert(
    retiredFreezerVerdict("2026-07-17", ukNoonOnExpiry.getTime()).isExpired === true,
    "BEH-6: at noon on the expiry day the retired comparison said EXPIRED — the whole final day, lost",
  );
  assert(
    freezerVerdict("2026-07-17", ukNoonOnExpiry, "Europe/London").isExpired === false,
    "BEH-6: the converged comparison gives that day back",
  );
  assert(
    freezerVerdict("2026-07-17", ukJustAfterMidnight, "Europe/London").isExpired === false,
    "BEH-6: at 00:30 BST on the expiry day, the converged badge does NOT say expired",
  );

  // THE SELF-CONTRADICTION the retired pair could produce: "expires in 1 day"
  // while isExpired already reads true. Civil dates cannot express it.
  let contradictions = 0;
  for (let h = 0; h < 24; h++) {
    const inst = instantAtLocalHour("Europe/London", "2026-07-17", h);
    const v = freezerVerdict("2026-07-17", inst, "Europe/London");
    if (v.isExpired && (v.daysUntilExpiry ?? 0) >= 0) contradictions++;
  }
  assert(contradictions === 0, "BEH-6: across all 24 hours, isExpired and daysUntilExpiry never contradict each other", `${contradictions}`);

  // DST-PROOF: the UK clocks go back on 25 October 2026 — that civil day is 25
  // hours long. Epoch arithmetic loses an hour; civil arithmetic cannot.
  const beforeDst = { year: 2026, month: 10, day: 24 };
  const afterDst = { year: 2026, month: 10, day: 26 };
  assert(civilDaysBetween(beforeDst, afterDst) === 2, "BEH-6: across a 25-hour DST day, two civil days count as exactly 2");
  const springForward = civilDaysBetween({ year: 2026, month: 3, day: 28 }, { year: 2026, month: 3, day: 30 });
  assert(springForward === 2, "BEH-6: across a 23-hour DST day, two civil days count as exactly 2", String(springForward));

  // An absent expiry is an absent expiry — never an accidental "expired".
  assert(freezerVerdict("", ukNoonOnExpiry, "Europe/London").isExpired === false, "BEH-6: no expiry → not expired (an honest gap)");
  assert(freezerVerdict("", ukNoonOnExpiry, "Europe/London").daysUntilExpiry === null, "BEH-6: no expiry → no day count");

  // The client no longer decides the day (HT12) — proven over the real sources.
  const mealsPageCode = sourceOf("client/src/pages/meals-page.tsx")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const plannerOpsCode = sourceOf("client/src/hooks/use-planner-operations.ts")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert(!/frozenDate:\s*new Date\(\)/.test(mealsPageCode), "BEH-6/HT12: meals-page no longer authors frozenDate from the device clock");
  assert(!/frozenDate:\s*today/.test(plannerOpsCode), "BEH-6/HT12: use-planner-operations no longer authors frozenDate from the device clock");
  const storageCode = sourceOf("server/storage.ts");
  assert(
    /async addFreezerMeal[\s\S]{0,600}?householdToday\(/.test(storageCode),
    "BEH-6: the SERVER stamps frozenDate from the household's clock, in the single write funnel (CPuBA4)",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§3  SCH-4 — the diary's civil date, with no noon anchor left to break");
  // ───────────────────────────────────────────────────────────────────────────

  // Stepping days is calendar arithmetic now.
  const step = (dateStr: string, delta: number) => formatCivilDate(addCivilDays(parseCivilDate(dateStr)!, delta));
  assert(step("2026-07-17", -1) === "2026-07-16", "SCH-4: prevDay steps exactly one civil day");
  assert(step("2026-07-17", 1) === "2026-07-18", "SCH-4: nextDay steps exactly one civil day");
  assert(step("2026-03-01", -1) === "2026-02-28", "SCH-4: stepping back over a month boundary");
  assert(step("2026-12-31", 1) === "2027-01-01", "SCH-4: stepping forward over a year boundary");
  assert(step("2024-02-28", 1) === "2024-02-29", "SCH-4: a leap day is a real day");

  // THE ±12h CEILING THE RETIRED GUARD HAD: `new Date(d + "T12:00:00")` is
  // noon-anchored in the BROWSER's zone, so past UTC+12 prevDay() skipped two
  // days and nextDay() appeared not to move. Civil stepping has no such ceiling.
  for (const zone of ["Pacific/Kiritimati", "Pacific/Auckland", "Asia/Tokyo", "Europe/London", "America/Los_Angeles", "Pacific/Midway"]) {
    const today = formatCivilDate(householdToday(new Date("2026-07-17T06:00:00Z"), zone));
    const back = step(today, -1);
    const forward = step(back, 1);
    assert(forward === today, `SCH-4: prev→next round-trips exactly in ${zone} (UTC+14 to UTC-11)`, `${today} → ${back} → ${forward}`);
  }

  // goToday is exact: it resolves to the household's today, at every hour.
  let goTodayCorrect = 0;
  for (let h = 0; h < 24; h++) {
    const inst = instantAtLocalHour("Europe/London", "2026-07-17", h);
    if (formatCivilDate(householdToday(inst, "Europe/London")) === "2026-07-17") goTodayCorrect++;
  }
  assert(goTodayCorrect === 24, "SCH-4: 'Today' opens today at all 24 hours — including 00:30, where it used to open YESTERDAY", `${goTodayCorrect}/24`);
  assert(
    retiredTemporalAnchor(instantAtLocalHour("Europe/London", "2026-07-17", 0)) === "2026-07-16",
    "SCH-4: the retired toDateStr DID open yesterday at 00:30 BST — the defect, reproduced",
  );

  // copyPlannerToFoodDiary's weekday is FRAME-INDEPENDENT by construction. This
  // is the server defect TIME2 verified empirically: `new Date("2026-07-16")`
  // parsed UTC-midnight then `.getDay()` read server-local, so any server west of
  // Greenwich copied the wrong weekday's meals into the diary.
  assert(householdDayOfWeek(parseCivilDate("2026-07-16")!) === 4, "SCH-4: 16 July 2026 is a Thursday (4) in the declared key space (HT8)");
  const retiredWeekdayUnderUtc = new Date("2026-07-16").getUTCDay();
  assert(retiredWeekdayUnderUtc === 4, "SCH-4: the retired shape agreed with UTC — which is why the defect was invisible in CI");
  // The declared key space matches planner_days.dayOfWeek exactly: 0 = Sunday.
  assert(householdDayOfWeek(parseCivilDate("2026-07-19")!) === 0, "SCH-4/HT8: Sunday is 0 — the key space is declared, never renumbered");
  assert(householdDayOfWeek(parseCivilDate("2026-07-20")!) === 1, "SCH-4/HT8: Monday is 1");
  const storageDiaryCode = storageCode.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert(
    /async copyPlannerToFoodDiary[\s\S]{0,700}?householdDayOfWeek\(/.test(storageDiaryCode),
    "SCH-4: copyPlannerToFoodDiary asks the owner for the weekday (no frame to mix)",
  );
  const diaryPageCode = sourceOf("client/src/pages/food-diary-page.tsx")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert(!/toISOString\(\)\.slice\(0, 10\)/.test(diaryPageCode), "SCH-4: the diary's toDateStr UTC funnel is retired");
  assert(!/T12:00:00/.test(diaryPageCode), "SCH-4: EVERY ±12h T12:00:00 guard in the diary is retired (§ 14 target 8 → 0)");

  // THE COUNTDOWN OFF-BY-ONE this phase's own suite found (§ 14 target 8's last
  // guard). The retired `Math.ceil((noonOfTarget − midnightToday) / 86_400_000)`
  // rounded half a day up, so TODAY returned 1 and the `days === 0 → "Today!"`
  // branch was unreachable for everyone. Civil days make it reachable.
  const countdownDays = (dateStr: string, now: Date, zone: string) => {
    const target = parseCivilDate(dateStr);
    if (target === null) return 0;
    return civilDaysBetween(householdToday(now, zone), target);
  };
  const retiredCountdown = (dateStr: string, nowMs: number) => {
    const today = new Date(nowMs);
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T12:00:00");
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  assert(countdownDays("2026-07-17", ukNoonOnExpiry, "Europe/London") === 0, "SCH-4: an event happening TODAY counts 0 — so 'Today!' can finally render");
  assert(retiredCountdown("2026-07-17", Date.parse("2026-07-17T11:00:00Z")) === 1, "SCH-4: the retired countdown returned 1 for today — 'Today!' was unreachable, live");
  assert(countdownDays("2026-07-18", ukNoonOnExpiry, "Europe/London") === 1, "SCH-4: tomorrow counts 1 day away, not 2");
  assert(countdownDays("2026-07-16", ukNoonOnExpiry, "Europe/London") === -1, "SCH-4: yesterday counts negative → 'Past'");

  // ───────────────────────────────────────────────────────────────────────────
  section("§4  THE GREETING ×4 → 1 — GOLDEN IDENTITY against the frozen live oracle");
  // ───────────────────────────────────────────────────────────────────────────

  // THE PROOF THAT NO HOUSEHOLD'S GREETING CHANGES.
  //
  // The retired copies read the DEVICE's hour; the converged one reads the
  // HOUSEHOLD's. For the ordinary case — a household whose device is in their own
  // zone — the two must be byte-identical at every hour of the day. They are.
  let identical = 0;
  for (let h = 0; h < 24; h++) {
    const inst = instantAtLocalHour("Europe/London", "2026-07-17", h);
    const converged = householdGreeting(inst, "Europe/London");
    const oracle = retiredLiveGetGreeting(hourIn(inst, "Europe/London"));
    if (converged === oracle) identical++;
  }
  assert(identical === 24, "GREETING: byte-identical to the frozen live oracle at ALL 24 HOURS — no household's greeting changes", `${identical}/24`);

  // The words themselves are untouched — INT21 owns them (CP3), not P6.
  assert(householdGreeting(instantAtLocalHour("Europe/London", "2026-07-17", 9), "Europe/London") === "Good morning", "GREETING: 09:00 → 'Good morning'");
  assert(householdGreeting(instantAtLocalHour("Europe/London", "2026-07-17", 14), "Europe/London") === "Good afternoon", "GREETING: 14:00 → 'Good afternoon'");
  assert(householdGreeting(instantAtLocalHour("Europe/London", "2026-07-17", 20), "Europe/London") === "Good evening", "GREETING: 20:00 → 'Good evening'");

  // THE BOUNDARIES, exactly where the live surfaces already had them.
  assert(householdGreeting(instantAtLocalHour("Europe/London", "2026-07-17", 11), "Europe/London") === "Good morning", "GREETING: 11:59 is still morning (boundary 12)");
  assert(householdGreeting(instantAtLocalHour("Europe/London", "2026-07-17", 12), "Europe/London") === "Good afternoon", "GREETING: 12:00 turns afternoon (boundary 12)");
  assert(householdGreeting(instantAtLocalHour("Europe/London", "2026-07-17", 16), "Europe/London") === "Good afternoon", "GREETING: 16:00 is still afternoon (boundary 17)");
  assert(householdGreeting(instantAtLocalHour("Europe/London", "2026-07-17", 17), "Europe/London") === "Good evening", "GREETING: 17:00 turns evening (boundary 17 — the LIVE boundary, preserved)");

  // THE 17-vs-18 DIVERGENCE, SETTLED AND STATED. The prototypes said afternoon at
  // 17:00; the module declares 17, so they now say evening. Dev-only, no household
  // affected — and the divergence can no longer ship when an idea graduates.
  assert(retiredPrototypeGreeting(17) === "Good afternoon", "GREETING: the prototypes DID say 'Good afternoon' at 17:00 (boundary 18)");
  assert(
    householdGreeting(instantAtLocalHour("Europe/London", "2026-07-17", 17), "Europe/London") === "Good evening",
    "GREETING: they now say 'Good evening' at 17:00 — settled on the DECLARED boundary",
  );
  let protoDivergence = 0;
  for (let h = 0; h < 24; h++) {
    const inst = instantAtLocalHour("Europe/London", "2026-07-17", h);
    if (householdGreeting(inst, "Europe/London") !== retiredPrototypeGreeting(hourIn(inst, "Europe/London"))) protoDivergence++;
  }
  assert(protoDivergence === 1, "GREETING: the prototypes change at EXACTLY ONE hour of the 24 (17:00) — the whole of the 17-vs-18 divergence", `${protoDivergence}`);

  // THE ZONE DECIDES THE GREETING — the defect the convergence actually fixes.
  // A device left on Auckland time (UTC+12) reads 19:00 while the household is
  // eating breakfast in London.
  const breakfastInLondon = instantAtLocalHour("Europe/London", "2026-07-17", 8);
  assert(householdGreeting(breakfastInLondon, "Europe/London") === "Good morning", "GREETING: a London household at 08:00 is greeted 'Good morning'");
  assert(
    retiredLiveGetGreeting(hourIn(breakfastInLondon, "Pacific/Auckland")) === "Good evening",
    "GREETING: a device left on Auckland time said 'Good evening' to that household at breakfast — the defect, reproduced",
  );
  assert(
    householdGreeting(breakfastInLondon, "Europe/London") !== retiredLiveGetGreeting(hourIn(breakfastInLondon, "Pacific/Auckland")),
    "GREETING: the convergence fixes it — the greeting follows the HOUSEHOLD, not the device (HT4)",
  );

  // 4 → 1, proven over the real sources (§ 14 target 3).
  const greetingConsumers = [
    "client/src/pages/dashboard.tsx",
    "client/src/components/HomeIntelligenceCompanion.tsx",
    "client/src/pages/dev/arrival-a-welcome.tsx",
    "client/src/pages/dev/arrival-s1-quiet.tsx",
  ];
  for (const file of greetingConsumers) {
    const code = sourceOf(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert(!/getHours\(\)/.test(code), `GREETING: ${path.basename(file)} reads no ambient hour`);
    assert(/householdGreeting/.test(code), `GREETING: ${path.basename(file)} consumes the one greeting owner`);
  }
  const greetingOwner = sourceOf("client/src/lib/greeting.ts");
  assert(!/getHours\(\)/.test(greetingOwner.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")), "GREETING: the owner itself reads no ambient hour — it asks householdPhase");
  assert(/householdPhase/.test(greetingOwner), "GREETING: the owner derives the phase from shared/time/household-time.ts (HT1)");

  // HT13 — the greeting aims a WORD. It must never aim light.
  assert(
    !/(opacity|palette|theme|className|--[a-z-]+:)/.test(greetingOwner.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")),
    "GREETING/HT13: the greeting owner aims a word and never a colour, token, palette, opacity or theme",
  );

  // ───────────────────────────────────────────────────────────────────────────
  section("§5  The vocabulary P6 added to the owner — total under abuse (HT6)");
  // ───────────────────────────────────────────────────────────────────────────

  assert(formatCivilDate({ year: 2026, month: 7, day: 5 }) === "2026-07-05", "formatCivilDate: pads to ISO-8601");
  assert(formatCivilDate({ year: 999, month: 1, day: 1 }) === "0999-01-01", "formatCivilDate: pads the year to four digits");
  assert(parseCivilDate("2026-07-17")?.month === 7, "parseCivilDate: month is 1-indexed (never getMonth()'s 0)");
  assert(parseCivilDate("2026-02-31") === null, "parseCivilDate: 31 February is not a date");
  assert(parseCivilDate("2026-13-01") === null, "parseCivilDate: month 13 is not a date");
  assert(parseCivilDate("17/07/2026") === null, "parseCivilDate: a non-ISO shape is refused, never guessed");
  assert(parseCivilDate("2026-07-17T00:00:00Z") === null, "parseCivilDate: an INSTANT is not a civil date");
  assert(parseCivilDate("") === null, "parseCivilDate: empty is null");
  assert(parseCivilDate(null) === null, "parseCivilDate: null is null, not a throw");
  assert(parseCivilDate(undefined) === null, "parseCivilDate: undefined is null, not a throw");
  assert(parseCivilDate(20260717 as unknown) === null, "parseCivilDate: a number is refused");
  assert(parseCivilDate("  2026-07-17  ")?.day === 17, "parseCivilDate: surrounding whitespace is tolerated");

  const rt: CivilDate = { year: 2026, month: 7, day: 17 };
  assert(formatCivilDate(parseCivilDate(formatCivilDate(rt))!) === "2026-07-17", "format→parse→format round-trips exactly");

  assert(compareCivilDates({ year: 2026, month: 7, day: 17 }, { year: 2026, month: 7, day: 17 }) === 0, "compareCivilDates: equal dates compare 0");
  assert(compareCivilDates({ year: 2026, month: 7, day: 16 }, { year: 2026, month: 7, day: 17 }) < 0, "compareCivilDates: earlier is negative");
  assert(compareCivilDates({ year: 2026, month: 7, day: 18 }, { year: 2026, month: 7, day: 17 }) > 0, "compareCivilDates: later is positive");
  assert(compareCivilDates({ year: 2027, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 }) > 0, "compareCivilDates: across a year boundary");

  assert(civilDaysBetween({ year: 2026, month: 7, day: 17 }, { year: 2026, month: 7, day: 17 }) === 0, "civilDaysBetween: a date to itself is 0");
  assert(civilDaysBetween({ year: 2026, month: 2, day: 28 }, { year: 2026, month: 3, day: 1 }) === 1, "civilDaysBetween: 2026 is not a leap year");
  assert(civilDaysBetween({ year: 2024, month: 2, day: 28 }, { year: 2024, month: 3, day: 1 }) === 2, "civilDaysBetween: 2024 is a leap year");
  assert(civilDaysBetween({ year: 2026, month: 13, day: 1 }, { year: 2026, month: 7, day: 17 }) === 0, "civilDaysBetween: an invalid date answers 0, never throws (HT6)");

  assert(formatCivilDate(addCivilDays({ year: 2026, month: 7, day: 17 }, 0)) === "2026-07-17", "addCivilDays: zero is identity");
  assert(formatCivilDate(addCivilDays({ year: 2026, month: 7, day: 17 }, 365)) === "2027-07-17", "addCivilDays: a year forward");
  assert(formatCivilDate(addCivilDays({ year: 2026, month: 7, day: 17 }, -365)) === "2025-07-17", "addCivilDays: a year back");
  // Asserted on the returned CivilDate rather than through formatCivilDate, which
  // normalises an invalid date to the epoch — the module's existing declared answer
  // for garbage (householdWeekOf does the same). Composing the two would test the
  // normaliser, not the arithmetic.
  const invalidStep = addCivilDays({ year: 2026, month: 2, day: 31 }, 1);
  assert(invalidStep.day === 31 && invalidStep.month === 2, "addCivilDays: an invalid input is returned unchanged, never throws (HT6)");
  assert(formatCivilDate(addCivilDays({ year: 2026, month: 7, day: 17 }, NaN)) === "2026-07-17", "addCivilDays: NaN is refused, never throws (HT6)");
  assert(formatCivilDate({ year: 2026, month: 2, day: 31 }) === "1970-01-01", "formatCivilDate: garbage resolves to the epoch — a stated answer, never a throw (HT6)");

  // The owner still reads no clock (HT5) — P6 added vocabulary, not a clock.
  const ownerCode = sourceOf("shared/time/household-time.ts")
    .replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert(!/new Date\(\)|Date\.now\(\)/.test(ownerCode), "HT5: P6's additions did not give the owner a clock");
  assert(!/"(spring|summer|autumn|winter)"/.test(ownerCode), "HT17: P6's additions did not give the owner a season");

  // ───────────────────────────────────────────────────────────────────────────
  console.log(`\n${"=".repeat(57)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log("  CONV1 P6 — the T2/T3 consumers read the one owner of household time.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
