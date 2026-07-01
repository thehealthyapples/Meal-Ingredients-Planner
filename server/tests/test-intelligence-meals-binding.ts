/**
 * test-intelligence-meals-binding.ts (INT15)
 * ==================================================
 * Verifies the NINTH live capability binding: the read-only Meals capability. It
 * proves the reusable Port → Handler → Binding pattern (shown for the Planner in INT2,
 * Shopping in INT3, Nutrition / Knowledge in INT4, Pantry in INT8, Diary in INT10,
 * Profile in INT12, Household in INT13, Partners in INT14) against a ninth,
 * independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → meals (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (MealsReadPort) that
 * stands in for storage. The same handler in production is injected with the real
 * owner; the contract under test is identical.
 *
 * Covered: capability lookup (nine live capabilities), permission validation
 * (anonymous → denied), read scopes (list/summary/detail), detail ownership
 * enforcement (own meal ok, system meal ok, another user's private meal → denied with
 * the SAME message as a nonexistent id — no existence leak), missing/unsupported
 * scope, missing mealId, unsupported-intent handling, read-only enforcement
 * (explain/search/recommend never execute), and the trust rule that nutrition is never
 * surfaced.
 *
 * Run with: npx tsx server/tests/test-intelligence-meals-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createMealsReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type MealsReadPort,
} from "../intelligence/index.js";
import type { Meal, MealSummary, MealItem } from "../../shared/schema.js";

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
// In-memory owner (stands in for storage.ts). User 1 owns meal 100 (private).
// User 2 owns meal 200 (private). Meal 300 is a system meal.
// ---------------------------------------------------------------------------

function makeMeal(overrides: Partial<Meal> & { id: number; userId: number; name: string }): Meal {
  return {
    ingredients: ["flour", "water"],
    instructions: ["mix", "bake"],
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
  };
}

function toSummary(m: Meal): MealSummary {
  const { ingredients, instructions, ...rest } = m;
  return { ...rest, ingredientCount: ingredients.length };
}

const MEAL_100 = makeMeal({ id: 100, userId: 1, name: "Colin's Chilli" });
const MEAL_200 = makeMeal({ id: 200, userId: 2, name: "Sam's Stew" });
const MEAL_300 = makeMeal({ id: 300, userId: 0, name: "System Pasta", isSystemMeal: true });

const ITEMS_100: MealItem[] = [
  { id: 1, mealId: 100, type: "manual", referenceId: null, name: "Mince", quantity: "500g", createdAt: new Date() },
  { id: 2, mealId: 100, type: "manual", referenceId: null, name: "Beans", quantity: "1 tin", createdAt: new Date() },
];

const calls: string[] = [];

function makePort(): MealsReadPort {
  return {
    getMeals: async (userId) => {
      calls.push(`getMeals(${userId})`);
      if (userId === 1) return [MEAL_100];
      if (userId === 2) return [MEAL_200];
      return [];
    },
    getSystemMeals: async () => {
      calls.push("getSystemMeals()");
      return [MEAL_300];
    },
    getMealsSummary: async (userId) => {
      calls.push(`getMealsSummary(${userId})`);
      if (userId === 1) return [toSummary(MEAL_100)];
      if (userId === 2) return [toSummary(MEAL_200)];
      return [];
    },
    getSystemMealsSummary: async () => {
      calls.push("getSystemMealsSummary()");
      return [toSummary(MEAL_300)];
    },
    getMeal: async (id) => {
      calls.push(`getMeal(${id})`);
      if (id === 100) return MEAL_100;
      if (id === 200) return MEAL_200;
      if (id === 300) return MEAL_300;
      return undefined;
    },
    getMealItems: async (mealId) => {
      calls.push(`getMealItems(${mealId})`);
      return mealId === 100 ? ITEMS_100 : [];
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const user2: IntelligenceContext = { role: "user", userId: "2", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeMeals(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("meals", createMealsReadHandler(async () => makePort()), ["read"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Meals is the ninth live capability");
  assert(
    intelligencePlatform.getCapability("meals")!.availability === "available",
    "canonical singleton: meals capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("meals")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 11,
    "exactly ELEVEN capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser) — scope lock (updated by INT17)",
    String(live.length),
  );
  assert(
    live.some((c) => c.id === "meals"),
    "meals is among the live capabilities",
  );
  assert(
    intelligencePlatform.getCapability("meals")!.executableIntents.includes("read"),
    "executableIntents declares read (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("meals")!.executableIntents.includes("explain") &&
      !intelligencePlatform.getCapability("meals")!.executableIntents.includes("search") &&
      !intelligencePlatform.getCapability("meals")!.executableIntents.includes("recommend"),
    "explain / search / recommend are NOT in executableIntents (no safe grounded owner — INT6A)",
  );

  const platform = platformWithFakeMeals();
  assert(platform.getCapability("meals")!.availability === "available", "test platform: meals bound → available");

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous → denied");
  const anonRead = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "list" } },
    anon,
  );
  assert(anonRead.status === "denied", "anonymous read → denied (no authenticated user)", anonRead.status);
  assert(/authenticated user/.test(anonRead.message ?? ""), "denial message cites authentication requirement");

  // -------------------------------------------------------------------------
  section("Read scope: list — own meals + system meals, merged");
  calls.length = 0;
  const listRead = await platform.handle({ verb: "read", capabilityId: "meals", parameters: { scope: "list" } }, user1);
  assert(listRead.status === "ok", "read scope=list → ok", listRead.status);
  const lr = listRead.result as any;
  assert(lr?.scope === "list", "result scope is 'list'");
  assert(lr?.mealCount === 2, "mealCount includes own meal + system meal", String(lr?.mealCount));
  assert(
    lr.meals.some((m: any) => m.id === 100 && m.name === "Colin's Chilli") &&
      lr.meals.some((m: any) => m.id === 300 && m.isSystemMeal === true),
    "list includes the caller's own meal and the system meal",
  );
  assert(
    lr.meals.every((m: any) => Array.isArray(m.ingredients) && "instructions" in m),
    "list rows carry full ingredients/instructions (full Meal projection)",
  );
  assert(
    calls.includes("getMeals(1)") && calls.includes("getSystemMeals()"),
    "delegated to the meals owner — getMeals + getSystemMeals called",
  );

  // -------------------------------------------------------------------------
  section("Read scope: summary — lighter projection (ingredientCount, no full text)");
  calls.length = 0;
  const summaryRead = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "summary" } },
    user1,
  );
  assert(summaryRead.status === "ok", "read scope=summary → ok", summaryRead.status);
  const sr = summaryRead.result as any;
  assert(sr?.scope === "summary", "result scope is 'summary'");
  assert(
    sr.meals.every((m: any) => !("ingredients" in m) && !("instructions" in m) && typeof m.ingredientCount === "number"),
    "summary rows carry ingredientCount, never raw ingredients/instructions",
  );
  assert(
    calls.includes("getMealsSummary(1)") && calls.includes("getSystemMealsSummary()"),
    "delegated to the meals owner — getMealsSummary + getSystemMealsSummary called",
  );

  // -------------------------------------------------------------------------
  section("Read scope: detail — own meal, with items");
  calls.length = 0;
  const detailOwn = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "detail", mealId: 100 } },
    user1,
  );
  assert(detailOwn.status === "ok", "read scope=detail (own meal) → ok", detailOwn.status);
  const d1 = detailOwn.result as any;
  assert(d1?.scope === "detail", "result scope is 'detail'");
  assert(d1?.meal?.id === 100, "detail surfaces the requested meal");
  assert(Array.isArray(d1?.items) && d1.items.length === 2, "detail surfaces the meal's typed items");
  assert(
    d1.items.some((i: any) => i.name === "Mince" && i.quantity === "500g"),
    "item rows carry name/quantity from the owner, unmodified",
  );
  assert(
    calls.includes("getMeal(100)") && calls.includes("getMealItems(100)"),
    "delegated to the meals owner — getMeal + getMealItems called",
  );

  section("Read scope: detail — system meal (readable by any authenticated caller)");
  const detailSystem = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "detail", mealId: 300 } },
    user1,
  );
  assert(detailSystem.status === "ok", "read scope=detail (system meal) → ok", detailSystem.status);
  assert((detailSystem.result as any)?.meal?.isSystemMeal === true, "system meal detail surfaced");

  section("Read scope: detail — another user's private meal → denied, no existence leak");
  const detailForeign = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "detail", mealId: 200 } },
    user1,
  );
  assert(detailForeign.status === "denied", "user 1 reading user 2's private meal → denied", detailForeign.status);

  const detailMissing = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "detail", mealId: 999 } },
    user1,
  );
  assert(detailMissing.status === "denied", "nonexistent meal id → denied (not gap)", detailMissing.status);
  assert(
    detailForeign.message === detailMissing.message,
    "foreign meal and nonexistent meal produce the IDENTICAL denial message — no existence leak",
  );

  // Ownership is per-caller, not a blanket block — user 2 can read their own meal 200.
  const detailUser2Own = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "detail", mealId: 200 } },
    user2,
  );
  assert(detailUser2Own.status === "ok", "user 2 reading their OWN meal 200 → ok (ownership, not a blanket block)", detailUser2Own.status);

  // -------------------------------------------------------------------------
  section("Honest gaps — missing scope, unsupported scope, missing mealId");
  const noScope = await platform.handle({ verb: "read", capabilityId: "meals", parameters: {} }, user1);
  assert(noScope.status === "gap", "read with no scope → honest gap", noScope.status);
  assert(/Supported scopes/.test(noScope.message ?? ""), "gap message lists the supported scopes");

  const badScope = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "nutrition" } },
    user1,
  );
  assert(badScope.status === "gap", "read with unsupported scope → honest gap", badScope.status);

  const noMealId = await platform.handle(
    { verb: "read", capabilityId: "meals", parameters: { scope: "detail" } },
    user1,
  );
  assert(noMealId.status === "gap", "detail scope with no mealId → honest gap", noMealId.status);
  assert(/mealId/.test(noMealId.message ?? ""), "gap message names the missing mealId parameter");

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the meals allow-list");
  const importIntent = await platform.handle({ verb: "import", capabilityId: "meals", parameters: {} }, user1, { confirmed: true });
  assert(importIntent.status === "gap", "import (confirmed) → honest gap: write not bound (read-only binding)", importIntent.status);

  const reviewIntent = await platform.handle({ verb: "review", capabilityId: "meals", parameters: {} }, user1);
  assert(reviewIntent.status === "unsupported_intent", "review not in meals allow-list → unsupported_intent", reviewIntent.status);

  // -------------------------------------------------------------------------
  section("Read-only enforcement — explain/search/recommend never execute");
  const explain = await platform.handle({ verb: "explain", capabilityId: "meals", parameters: {} }, user1);
  assert(explain.status === "gap", "explain → honest gap: no stored rationale on a meal", explain.status);
  assert(/Meals is bound to the Intelligence Platform read-only/.test(explain.message ?? ""), "gap message states the binding is read-only");

  const search = await platform.handle({ verb: "search", capabilityId: "meals", parameters: { query: "chilli" } }, user1);
  assert(
    search.status === "gap",
    "search → honest gap: lookupMeals has no ownership scoping (unresolved open decision)",
    search.status,
  );

  const recommend = await platform.handle({ verb: "recommend", capabilityId: "meals", parameters: {} }, user1);
  assert(
    recommend.status === "gap",
    "recommend → honest gap: ranking lives inline at the route layer, not a delegate-only owner method",
    recommend.status,
  );

  const generateUnconfirmed = await platform.handle({ verb: "generate", capabilityId: "meals", parameters: {} }, user1);
  assert(
    generateUnconfirmed.status === "confirmation_required",
    "generate (unconfirmed) → confirmation_required (never reaches handler)",
    generateUnconfirmed.status,
  );
  const generateConfirmed = await platform.handle({ verb: "generate", capabilityId: "meals", parameters: {} }, user1, { confirmed: true });
  assert(generateConfirmed.status === "gap", "generate (confirmed) → honest gap: write not bound (read-only binding)", generateConfirmed.status);

  const readOk = await platform.handle({ verb: "read", capabilityId: "meals", parameters: { scope: "list" } }, user1);
  assert(
    readOk.confirmation === "none" || readOk.confirmation === undefined,
    "read-only verbs never require confirmation (no write path)",
  );

  // -------------------------------------------------------------------------
  section("Trust rule — nutrition is never surfaced");
  assert(
    !Object.prototype.hasOwnProperty.call(d1.meal, "calories") &&
      !Object.prototype.hasOwnProperty.call(d1.meal, "nutrition") &&
      !Object.prototype.hasOwnProperty.call(d1, "nutrition"),
    "no result shape carries a nutrition field — nutrition is a separate table and out of this capability's scope",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT15 Meals read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
