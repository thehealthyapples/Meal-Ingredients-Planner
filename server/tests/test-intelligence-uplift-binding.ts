/**
 * test-intelligence-uplift-binding.ts (INT42)
 * ==============================================
 * Verifies the TWENTY-SECOND live capability binding: the read-only Uplift
 * capability — the platform's first binding of a pre-existing,
 * non-Intelligence-Platform domain engine (SoT Domain 17, "Nutrition Boost
 * (Uplift)"). It proves the reusable Port → Handler → Binding pattern against
 * a domain engine that predates the Intelligence Platform entirely, end-to-end:
 *
 *   intent → capability registry → permission check → meal ownership check
 *     → Uplift Engine (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (UpliftReadPort)
 * that stands in for storage + the real rule set. The same handler in
 * production is injected with the real owner; the contract under test is
 * identical.
 *
 * Coverage: capability lookup (22 live capabilities), permission validation
 * (anonymous → denied), ownership enforcement (own meal ok, system meal ok,
 * another user's private meal → denied with the SAME message as a
 * nonexistent id — no existence leak), a meal with no matching rule → honest
 * gap, missing mealId → honest gap, unsupported verb, read-only enforcement.
 *
 * Run with: npx tsx server/tests/test-intelligence-uplift-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createUpliftReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type UpliftReadPort,
} from "../intelligence/index.js";
import type { Meal } from "../../shared/schema.js";
import type { UpliftMatchResult } from "../lib/uplift-types.js";

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
// In-memory owner (stands in for storage.ts + the real Uplift Engine). User 1
// owns meal 100 ("Mac and Cheese", matches a fake rule). User 2 owns meal 200
// (private). Meal 300 is a system meal. Meal 400 (user 1's own) matches no rule.
// ---------------------------------------------------------------------------

function makeMeal(overrides: Partial<Meal> & { id: number; userId: number; name: string }): Meal {
  return {
    ingredients: ["macaroni", "cheese"],
    instructions: null,
    imageUrl: null,
    servings: 2,
    categoryId: null,
    sourceUrl: null,
    mealTemplateId: null,
    mealSourceType: "scratch",
    isReadyMeal: false,
    isSystemMeal: false,
    mealFormat: "recipe",
    dietTypes: [],
    isFreezerEligible: true,
    audience: "adult",
    isDrink: false,
    drinkType: null,
    barcode: null,
    brand: null,
    originalMealId: null,
    kind: "meal",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    isHouseholdSafeVariant: false,
    householdSafeFor: null,
    variantKind: null,
    showInCookbook: false,
    primarySlot: null,
    suitableSlots: [],
    energyBand: null,
    styleTags: [],
    ...overrides,
  } as Meal;
}

const MEAL_100 = makeMeal({ id: 100, userId: 1, name: "Mac and Cheese" });
const MEAL_200 = makeMeal({ id: 200, userId: 2, name: "Sam's Stew", ingredients: ["beef", "carrots"] });
const MEAL_300 = makeMeal({ id: 300, userId: 0, name: "System Pasta", isSystemMeal: true });
const MEAL_400 = makeMeal({ id: 400, userId: 1, name: "Plain Rice", ingredients: ["rice"] });

const FAKE_MATCH: UpliftMatchResult = {
  ruleId: "mac-cheese-turmeric-pepper",
  ruleName: "Mac & cheese — turmeric + black pepper",
  suggestions: [
    { ingredient: "turmeric", action: "add", quantity: "½ tsp", why: "Adds colour and supports anti-inflammatory variety." },
  ],
  nutritionTags: ["antioxidant"],
  confidence: "high",
  priority: 1,
  matchedTriggers: ["mealNamePattern:mac and cheese"],
};

const calls: string[] = [];

function makePort(): UpliftReadPort {
  return {
    getMeal: async (id) => {
      calls.push(`getMeal(${id})`);
      if (id === 100) return MEAL_100;
      if (id === 200) return MEAL_200;
      if (id === 300) return MEAL_300;
      if (id === 400) return MEAL_400;
      return undefined;
    },
    matchMeal: (ctx) => {
      calls.push(`matchMeal(${ctx.mealName})`);
      return ctx.mealName === "Mac and Cheese" || ctx.mealName === "System Pasta" ? [FAKE_MATCH] : [];
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const user2: IntelligenceContext = { role: "user", userId: "2", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeUplift(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("uplift", createUpliftReadHandler(async () => makePort()), ["recommend"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Uplift is the twenty-second live capability");
  assert(
    intelligencePlatform.getCapability("uplift")!.availability === "available",
    "canonical singleton: uplift capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("uplift")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(live.length === 22, "exactly TWENTY-TWO capabilities are live (INT42 adds uplift)", String(live.length));
  assert(live.some((c) => c.id === "uplift"), "uplift is among the live capabilities");
  assert(
    intelligencePlatform.getCapability("uplift")!.executableIntents.includes("recommend"),
    "executableIntents declares recommend (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("uplift")!.executableIntents.includes("explain") &&
      !intelligencePlatform.getCapability("uplift")!.executableIntents.includes("add"),
    "no write verb is executable — accepting/removing a suggestion stays with the existing /api/uplift/* routes",
  );

  const platform = platformWithFakeUplift();
  assert(platform.getCapability("uplift")!.availability === "available", "test platform: uplift bound → available");

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous → denied");
  const anonRecommend = await platform.handle(
    { verb: "recommend", capabilityId: "uplift", parameters: { mealId: 100 } },
    anon,
  );
  assert(anonRecommend.status === "denied", "anonymous recommend → denied", anonRecommend.status);
  assert(/authenticated user/.test(anonRecommend.message ?? ""), "denial message cites authentication requirement");

  // -------------------------------------------------------------------------
  section("Recommend — own meal with a matching rule");
  calls.length = 0;
  const own = await platform.handle(
    { verb: "recommend", capabilityId: "uplift", parameters: { mealId: 100 } },
    user1,
  );
  assert(own.status === "ok", "recommend for own matching meal → ok", own.status);
  const r1 = own.result as any;
  assert(r1?.mealId === 100 && r1?.mealName === "Mac and Cheese", "result names the meal");
  assert(Array.isArray(r1?.matches) && r1.matches.length === 1, "result carries the matched rule");
  assert(r1.matches[0].suggestions[0].ingredient === "turmeric", "suggestion is projected verbatim from the engine");
  assert(r1?.source === "uplift-engine", "source tag is 'uplift-engine'");
  assert(
    calls.includes("getMeal(100)") && calls.includes("matchMeal(Mac and Cheese)"),
    "delegated to the owner — getMeal + matchMeal called",
  );

  section("Recommend — system meal (readable by any authenticated caller)");
  const system = await platform.handle(
    { verb: "recommend", capabilityId: "uplift", parameters: { mealId: 300 } },
    user1,
  );
  assert(system.status === "ok", "recommend for system meal → ok", system.status);

  section("Recommend — another user's private meal → denied, no existence leak");
  const foreign = await platform.handle(
    { verb: "recommend", capabilityId: "uplift", parameters: { mealId: 200 } },
    user1,
  );
  assert(foreign.status === "denied", "user 1 requesting user 2's private meal → denied", foreign.status);

  const missing = await platform.handle(
    { verb: "recommend", capabilityId: "uplift", parameters: { mealId: 999 } },
    user1,
  );
  assert(missing.status === "denied", "nonexistent meal id → denied (not gap)", missing.status);
  assert(foreign.message === missing.message, "foreign meal and nonexistent meal produce the IDENTICAL denial message — no existence leak");

  // -------------------------------------------------------------------------
  section("Honest gaps — no matching rule, missing mealId");
  const noMatch = await platform.handle(
    { verb: "recommend", capabilityId: "uplift", parameters: { mealId: 400 } },
    user1,
  );
  assert(noMatch.status === "gap", "meal with no matching Uplift rule → honest gap", noMatch.status);
  assert(/no reviewed Nutrition Boost rule/.test(noMatch.message ?? ""), "gap message explains no rule matched");

  const noMealId = await platform.handle(
    { verb: "recommend", capabilityId: "uplift", parameters: {} },
    user1,
  );
  assert(noMealId.status === "gap", "recommend with no mealId → honest gap", noMealId.status);
  assert(/mealId/.test(noMealId.message ?? ""), "gap message names the missing mealId parameter");

  // -------------------------------------------------------------------------
  section("Unsupported / read-only enforcement");
  const explain = await platform.handle({ verb: "explain", capabilityId: "uplift", parameters: {} }, user1);
  assert(explain.status === "unsupported_intent", "explain not in uplift's declared supportedIntents → unsupported_intent", explain.status);

  const addUnconfirmed = await platform.handle({ verb: "add", capabilityId: "uplift", parameters: {} }, user1);
  assert(
    addUnconfirmed.status === "unsupported_intent",
    "add not declared on uplift (write path stays with existing /api/uplift/accept route) → unsupported_intent",
    addUnconfirmed.status,
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT42 Uplift binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
