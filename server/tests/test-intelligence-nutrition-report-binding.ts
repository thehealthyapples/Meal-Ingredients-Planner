/**
 * test-intelligence-nutrition-report-binding.ts (COMP-DET8)
 * =============================================================
 * Verifies the TWENTY-FOURTH live capability binding: the read-only Nutrition Report
 * capability — the household's own Nutrition Centre progress (plant/food diversity,
 * category/benefit coverage), computed from the household's own planner/diary history.
 * Proves the reusable Port → Handler → Binding pattern against nutrition-centre-
 * assembler.ts, end-to-end —
 *
 *   intent → capability registry → permission check → nutrition-report (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (NutritionReportPort) that
 * stands in for `assembleNutritionCentre`. The same handler in production is injected
 * with the real owner; the contract under test is identical.
 *
 * Covered: capability lookup (twenty-four live capabilities), permission validation,
 * handler invocation, owner delegation, available vs unavailable windows (honest gap,
 * never a fabricated "nothing to report"), deterministic answer construction from real
 * figures, unsupported intent handling, and the absence of any write path.
 *
 * Run with: npx tsx server/tests/test-intelligence-nutrition-report-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createNutritionReportReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type NutritionReportPort,
  type NutritionCentre,
} from "../intelligence/index.js";

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

// ---------------------------------------------------------------------------
// In-memory owner (stands in for nutrition-centre-assembler.ts's real output).
// ---------------------------------------------------------------------------

const AVAILABLE_CENTRE: NutritionCentre = {
  available: true,
  overview: { plantDiversity: 12, foodDiversity: 34, mealsCooked: 9, foodsDiscovered: 4, seasonalFoodsEnjoyed: 2, seasonLabel: "autumn" },
  journey: { nutrientCoverage: 62, benefitCoverage: 48, categoriesCovered: 8, categoriesTotal: 14 },
  categories: [
    { category: "vegetables", enjoyed: 5, total: 10 },
    { category: "legumes", enjoyed: 1, total: 8 },
  ],
  benefits: [{ slug: "heart-health", name: "Heart health", icon: "heart", householdFoodCount: 6 }],
  trends: { mostFrequent: [{ slug: "chicken", name: "Chicken", appearances: 4 }] },
  discovery: null,
  simplyBetter: [],
  incomplete: false,
};

const UNAVAILABLE_CENTRE: NutritionCentre = {
  available: false,
  overview: null,
  journey: null,
  categories: [],
  benefits: [],
  trends: null,
  discovery: null,
  simplyBetter: [],
  incomplete: false,
};

const calls: string[] = [];

function makePort(): NutritionReportPort {
  return {
    getNutritionCentre: async (userId, window, weekId) => {
      calls.push(`getNutritionCentre(${userId}, ${window}, ${weekId ?? "none"})`);
      // Household 1 has data for "all-time" and "this-week" (with a weekId), but a
      // brand-new window with no logged history ("this-year") is honestly empty.
      if (window === "this-year") return UNAVAILABLE_CENTRE;
      if (window === "this-week" && weekId == null) return UNAVAILABLE_CENTRE;
      return AVAILABLE_CENTRE;
    },
  };
}

const user: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeNutritionReport(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("nutrition-report", createNutritionReportReadHandler(async () => makePort()), ["read"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Nutrition Report is the twenty-fourth live capability");
  assert(
    intelligencePlatform.getCapability("nutrition-report")!.availability === "available",
    "canonical singleton: nutrition-report capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("nutrition-report")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(live.length === 24, "exactly TWENTY-FOUR capabilities are live — scope lock (COMP-DET8 adds nutrition-report)", String(live.length));
  assert(
    intelligencePlatform.getCapability("nutrition-report")!.capabilityClass === "read-only",
    "nutrition-report is a read-only capability (no write/confirmation surface)",
  );
  assert(
    intelligencePlatform.getCapability("nutrition-report")!.permissions.ownershipScoped === true,
    "nutrition-report is ownership-scoped (user-specific, diary-linked data — unlike general-knowledge nutrition-knowledge)",
  );

  const platform = platformWithFakeNutritionReport();
  assert(platform.getCapability("nutrition-report")!.availability === "available", "test platform: nutrition-report bound → available");

  // -------------------------------------------------------------------------
  section("Handler invocation + owner delegation (all-time window, default)");
  calls.length = 0;
  const allTime = await platform.handle({ verb: "read", capabilityId: "nutrition-report", parameters: {} }, user);
  assert(allTime.status === "ok", "read with no window param defaults to all-time → ok", allTime.status);
  const atr = allTime.result as any;
  assert(atr?.window === "all-time", "defaults to window 'all-time' when none given", atr?.window);
  assert(atr?.source === "nutrition-centre-assembler", "result is attributed to the real owning assembler");
  assert(calls.some((c) => c.includes("all-time")), "delegated to the owner with the resolved window (no logic in the platform)");

  // -------------------------------------------------------------------------
  section("Real figures surfaced, not re-derived");
  assert(atr?.overview?.plantDiversity === 12 && atr?.overview?.foodDiversity === 34, "overview figures pass through unmodified", JSON.stringify(atr?.overview));
  assert(atr?.journey?.categoriesCovered === 8 && atr?.journey?.categoriesTotal === 14, "journey figures pass through unmodified", JSON.stringify(atr?.journey));
  assert(Array.isArray(atr?.categories) && atr.categories[0]?.category === "vegetables", "category progress rows pass through unmodified");

  // -------------------------------------------------------------------------
  section("Deterministic answer — states the real figures, not a fabricated summary");
  assert(typeof atr?.deterministicAnswer === "string" && atr.deterministicAnswer.includes("12") && atr.deterministicAnswer.includes("34"), "deterministicAnswer cites the real plant/food diversity counts", atr?.deterministicAnswer);
  assert(atr?.deterministicAnswer.includes("8 of 14"), "deterministicAnswer cites the real category coverage fraction", atr?.deterministicAnswer);

  // -------------------------------------------------------------------------
  section("This-week window — needs a resolved weekId to mean anything");
  const thisWeekNoId = await platform.handle({ verb: "read", capabilityId: "nutrition-report", parameters: { window: "this-week" } }, user);
  assert(thisWeekNoId.status === "gap", "this-week with no weekId resolved → honest gap (nothing to anchor the week to)", thisWeekNoId.status);

  const thisWeekWithId = await platform.handle({ verb: "read", capabilityId: "nutrition-report", parameters: { window: "this-week", weekId: 4126 } }, user);
  assert(thisWeekWithId.status === "ok", "this-week WITH a resolved weekId → ok", thisWeekWithId.status);
  assert(calls.some((c) => c.includes("this-week, 4126")), "the weekId is passed through to the port for resolution to a real weekNumber");

  // -------------------------------------------------------------------------
  section("Honest gaps — no planner/diary history in the window → gap, never a fabricated 'nothing eaten'");
  const noHistory = await platform.handle({ verb: "read", capabilityId: "nutrition-report", parameters: { window: "this-year" } }, user);
  assert(noHistory.status === "gap", "available:false from the owner → honest gap, not an empty-but-ok summary", noHistory.status);
  assert(/will not estimate or invent/.test((noHistory as any).message ?? ""), "gap message refuses to estimate or invent a progress figure");

  // -------------------------------------------------------------------------
  section("Permission validation");
  const anonRead = await platform.handle({ verb: "read", capabilityId: "nutrition-report", parameters: {} }, anon);
  assert(anonRead.status === "denied", "anonymous caller → denied (ownership-scoped, auth required)", anonRead.status);

  // -------------------------------------------------------------------------
  section("Unsupported intent + read-only enforcement — no write path exists");
  const explain = await platform.handle({ verb: "explain", capabilityId: "nutrition-report", parameters: {} }, user);
  assert(explain.status === "unsupported_intent", "explain is not in the allow-list → unsupported_intent", explain.status);

  const add = await platform.handle({ verb: "add", capabilityId: "nutrition-report", parameters: {} }, user);
  assert(add.status === "unsupported_intent", "write verb (add) not supported → unsupported_intent (no write path)", add.status);

  const readNoConfirm = await platform.handle({ verb: "read", capabilityId: "nutrition-report", parameters: {} }, user);
  assert(readNoConfirm.confirmation === "none" || readNoConfirm.confirmation === undefined, "read never requires confirmation (no write path)");

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`COMP-DET8 Nutrition Report read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
