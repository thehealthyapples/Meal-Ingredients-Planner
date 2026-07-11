/**
 * test-intelligence-food-opportunity-binding.ts (FI4)
 * =====================================================
 * Verifies the Food Opportunity Engine — FI4's ambient extension of the Food
 * Intelligence Engine (FI3): continuous, deterministic identification and
 * prioritisation of Food Opportunities from a caller's own existing planner,
 * pantry and shopping activity. Registered as a THIRD verb (`report`) on the
 * SAME `food-intelligence` capability FI3 already bound — no new capability,
 * no new capability count (still nineteen live capabilities).
 *
 * Coverage:
 *   §1  Pure reasoning core — no I/O, no database:
 *       identifyPlannerGapOpportunities, identifyPantryUnusedOpportunities,
 *       identifyShoppingRestrictionOpportunities, prioritizeOpportunities.
 *       Determinism, evidence on every opportunity (Rule E1), priority ordering,
 *       honest gaps (no activity → no opportunities, never fabricated).
 *   §2  Port → Handler → Binding contract, with an in-memory FoodIntelligenceReadPort:
 *       the `report` verb — authentication requirement, honest gap when no
 *       household resolves, ok with prioritised opportunities, existing
 *       recommend/explain verbs still unaffected by this extension.
 *
 * Run with: npx tsx server/tests/test-intelligence-food-opportunity-binding.ts
 */

import {
  identifyPlannerGapOpportunities,
  identifyPantryUnusedOpportunities,
  identifyShoppingRestrictionOpportunities,
  prioritizeOpportunities,
  type FoodOpportunity,
} from "../intelligence/food-intelligence/opportunity-engine.js";
import {
  IntelligencePlatform,
  CapabilityRegistry,
  createFoodIntelligenceReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type FoodIntelligenceReadPort,
  type FoodOpportunityBundle,
} from "../intelligence/index.js";
import type { RestrictionDefinition } from "../../shared/restrictions/restriction-types.js";

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
// §1 — Pure reasoning core fixtures
// ---------------------------------------------------------------------------

function makeWeek(id: number, weekNumber: number, weekName: string): any {
  return { id, weekNumber, weekName, householdId: 1, userId: 1 };
}
function makeDay(id: number, weekId: number, dayOfWeek: number): any {
  return { id, weekId, dayOfWeek };
}
function makeEntry(id: number, dayId: number): any {
  return { id, dayId, mealType: "dinner", audience: "adult", mealId: 1, position: 0 };
}
function makePantryItem(id: number, ingredientKey: string, displayName: string, isDeleted = false): any {
  return { id, userId: 1, ingredientKey, displayName, category: "larder", isDeleted };
}
function makeShoppingItem(id: number, productName: string, checked = false): any {
  return { id, userId: 1, productName, checked };
}

const TREE_NUT_DEF: RestrictionDefinition = {
  id: "tree_nut",
  displayName: "Tree Nut",
  tier: "major_allergen",
  aliases: ["walnuts", "walnut"],
  derivedIngredients: [],
  hiddenIngredients: [],
  substitutions: [],
  prohibitedPhrases: [],
};

async function main(): Promise<void> {
  section("§1 identifyPlannerGapOpportunities — empty-day detection, priority, determinism");

  const week1 = makeWeek(1, 3, "Week 3");
  const days7 = Array.from({ length: 7 }, (_, i) => makeDay(100 + i, 1, i));
  // Only Monday (dayOfWeek 0) and Tuesday (dayOfWeek 1) have entries → 5 of 7 empty → high priority.
  const entriesFewFilled = [makeEntry(1, 100), makeEntry(2, 101)];

  const gapsHigh = identifyPlannerGapOpportunities(week1, days7, entriesFewFilled);
  assert(gapsHigh.length === 5, "5 empty days produce 5 opportunities", String(gapsHigh.length));
  assert(gapsHigh.every((o) => o.priority === "high"), "5/7 empty (≥50%) → high priority");
  assert(gapsHigh.every((o) => o.owningDomain === "planner"), "owning domain is 'planner'");
  assert(gapsHigh.every((o) => o.type === "planner-empty-day"), "type is 'planner-empty-day'");
  assert(
    gapsHigh.every((o) => o.evidence.length > 0 && o.evidence[0].source === "planner-week"),
    "every opportunity carries evidence naming its source (Rule E1 — no citation, no card)",
  );
  assert(
    gapsHigh.map((o) => o.explanation.includes("Wednesday") || o.explanation.includes("Thursday") || o.explanation.includes("Friday") || o.explanation.includes("Saturday") || o.explanation.includes("Sunday")).every(Boolean),
    "explanations name the actual empty day (Rule T1 — food, not bodies; grounded, not generic)",
  );

  const runA = identifyPlannerGapOpportunities(week1, days7, entriesFewFilled);
  const runB = identifyPlannerGapOpportunities(week1, days7, entriesFewFilled);
  assert(JSON.stringify(runA) === JSON.stringify(runB), "deterministic: identical input yields byte-identical output (Rule LT3)");

  // 6 of 7 days filled, one empty → 1/7 < 50% → medium priority.
  const entriesMostlyFilled = [makeEntry(1, 100), makeEntry(2, 101), makeEntry(3, 102), makeEntry(4, 103), makeEntry(5, 104), makeEntry(6, 105)];
  const gapsMedium = identifyPlannerGapOpportunities(week1, days7, entriesMostlyFilled);
  assert(gapsMedium.length === 1, "1 empty day of 7 produces exactly 1 opportunity", String(gapsMedium.length));
  assert(gapsMedium[0].priority === "medium", "1/7 empty (<50%) → medium priority");

  const entriesAllFilled = days7.map((d, i) => makeEntry(i + 1, d.id));
  assert(identifyPlannerGapOpportunities(week1, days7, entriesAllFilled).length === 0, "every day filled → no opportunities, never fabricated");
  assert(identifyPlannerGapOpportunities(week1, [], []).length === 0, "no days at all → no opportunities");

  section("§1 identifyPantryUnusedOpportunities — canonical identity reuse, honest gaps");

  const pantryItems = [
    makePantryItem(1, "spinach", "Spinach"),
    makePantryItem(2, "walnuts", "Walnuts"),
    makePantryItem(3, "not-a-real-food-xyz", "Mystery Item"),
    makePantryItem(4, "broccoli", "Broccoli", /* isDeleted */ true),
  ];
  const familiarSlugs = new Set(["spinach"]); // household has already planned spinach

  const pantryOpportunities = identifyPantryUnusedOpportunities(pantryItems, familiarSlugs);
  assert(pantryOpportunities.length === 1, "exactly one unused pantry item surfaced", String(pantryOpportunities.length));
  assert(pantryOpportunities[0].id === "pantry-item-unused-in-plan:2", "the familiar item (spinach) is excluded, the unresolved item is excluded, the deleted item is excluded — only walnuts remains");
  assert(pantryOpportunities[0].owningDomain === "pantry", "owning domain is 'pantry'");
  assert(pantryOpportunities[0].priority === "low", "pantry-unused opportunities are informational (low priority)");
  assert(/Walnuts/.test(pantryOpportunities[0].explanation), "explanation names the actual pantry item");

  assert(identifyPantryUnusedOpportunities([], familiarSlugs).length === 0, "no pantry items → no opportunities");
  assert(
    identifyPantryUnusedOpportunities([makePantryItem(5, "spinach", "Spinach")], familiarSlugs).length === 0,
    "a pantry item already familiar to the household is not an opportunity",
  );

  section("§1 identifyShoppingRestrictionOpportunities — reuses the exact Rule T0 restriction matcher");

  const shoppingItems = [
    makeShoppingItem(1, "Walnuts", false),
    makeShoppingItem(2, "Spinach", false),
    makeShoppingItem(3, "Walnut Halves", /* checked */ true),
  ];

  const shoppingOpportunities = identifyShoppingRestrictionOpportunities(shoppingItems, [TREE_NUT_DEF]);
  assert(shoppingOpportunities.length === 1, "exactly one restriction-conflicting item surfaced", String(shoppingOpportunities.length));
  assert(shoppingOpportunities[0].id === "shopping-restriction-conflict:1", "the unchecked walnut item is flagged; the checked one is not (already actioned)");
  assert(shoppingOpportunities[0].owningDomain === "shopping", "owning domain is 'shopping'");
  assert(shoppingOpportunities[0].priority === "critical", "a restriction conflict is critical — Rule T0's additive face (ATTN1)");
  assert(
    shoppingOpportunities[0].evidence.some((e) => e.source === "household-eaters"),
    "evidence names the household restriction that produced the match",
  );
  assert(
    identifyShoppingRestrictionOpportunities(shoppingItems, []).length === 0,
    "no active restrictions → no opportunities (never invents a conflict)",
  );

  section("§1 prioritizeOpportunities — stable priority ordering, limit clamping");

  const mixed: FoodOpportunity[] = [
    { id: "a", type: "pantry-item-unused-in-plan", owningDomain: "pantry", priority: "low", explanation: "a", evidence: [], suggestedAction: "a" },
    { id: "b", type: "shopping-restriction-conflict", owningDomain: "shopping", priority: "high", explanation: "b", evidence: [], suggestedAction: "b" },
    { id: "c", type: "planner-empty-day", owningDomain: "planner", priority: "medium", explanation: "c", evidence: [], suggestedAction: "c" },
    { id: "d", type: "shopping-restriction-conflict", owningDomain: "shopping", priority: "high", explanation: "d", evidence: [], suggestedAction: "d" },
  ];
  const prioritized = prioritizeOpportunities(mixed);
  assert(
    prioritized.map((o) => o.id).join(",") === "b,d,c,a",
    "high before medium before low; stable within a tier",
    prioritized.map((o) => o.id).join(","),
  );
  assert(prioritizeOpportunities(mixed, 2).length === 2, "limit clamps the result count");
  assert(prioritizeOpportunities([]).length === 0, "no opportunities in → no opportunities out");

  // ---------------------------------------------------------------------------
  // §2 — Port → Handler → Binding contract (the `report` verb)
  // ---------------------------------------------------------------------------

  section("§2 Capability lookup — FI4 adds no new capability (OD1 later adds a twentieth, unrelated one)");
  assert(
    intelligencePlatform.getCapability("food-intelligence")!.availability === "available",
    "canonical singleton: food-intelligence remains 'available'",
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(live.length === 21, "exactly TWENTY-ONE live capabilities — FI4 extends food-intelligence (no new one); OD1 adds opportunity-delivery; EL1 separately adds evidence-learning", String(live.length));
  assert(
    intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("report"),
    "executableIntents now declares 'report' alongside recommend/explain (truthful registry — INT6A)",
  );
  assert(
    intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("recommend") &&
      intelligencePlatform.getCapability("food-intelligence")!.executableIntents.includes("explain"),
    "the pre-existing recommend/explain verbs are unaffected by the FI4 extension",
  );

  function makeOpportunityBundle(overrides: Partial<FoodOpportunityBundle> = {}): FoodOpportunityBundle {
    return {
      opportunities: [
        {
          id: "planner-empty-day:1",
          type: "planner-empty-day",
          owningDomain: "planner",
          priority: "high",
          explanation: "Wednesday has no meals planned yet.",
          evidence: [{ source: "planner-week", detail: "test" }],
          suggestedAction: "Add a meal to Wednesday.",
        },
      ],
      trust: { householdAware: true },
      metadata: { assembledAt: new Date().toISOString(), sources: ["planner"] },
      ...overrides,
    };
  }

  const calls: string[] = [];
  function makePort(): FoodIntelligenceReadPort {
    return {
      assembleFoodIntelligence: async () => {
        throw new Error("report tests must not call assembleFoodIntelligence");
      },
      identifyOpportunities: async (request) => {
        calls.push(`identifyOpportunities(${request.userId})`);
        if (request.userId === 999) {
          return { opportunities: [], trust: { householdAware: false }, metadata: { assembledAt: new Date().toISOString(), sources: [] } };
        }
        return makeOpportunityBundle();
      },
    };
  }

  function platformWithFakeFoodIntelligence(): IntelligencePlatform {
    const p = new IntelligencePlatform(new CapabilityRegistry());
    p.registerHandler("food-intelligence", createFoodIntelligenceReadHandler(async () => makePort()), ["recommend", "explain", "report"]);
    return p;
  }

  const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };
  const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
  const noHouseholdUser: IntelligenceContext = { role: "user", userId: "999", premium: false };

  section("§2 report — requires authentication (never a fabricated household)");
  const platform = platformWithFakeFoodIntelligence();
  calls.length = 0;
  const anonReport = await platform.handle({ verb: "report", capabilityId: "food-intelligence", parameters: {} }, anon);
  assert(anonReport.status === "gap", "anonymous report → honest gap, never fabricated", anonReport.status);
  assert(calls.length === 0, "an anonymous request never reaches the engine port");

  section("§2 report — honest gap when no household resolves");
  const noHouseholdReport = await platform.handle({ verb: "report", capabilityId: "food-intelligence", parameters: {} }, noHouseholdUser);
  assert(noHouseholdReport.status === "gap", "no resolvable household → honest gap", noHouseholdReport.status);
  assert(/will not fabricate a household/.test(noHouseholdReport.message ?? ""), "gap message refuses to fabricate a household");

  section("§2 report — ok with prioritised opportunities for a resolved household");
  const okReport = await platform.handle({ verb: "report", capabilityId: "food-intelligence", parameters: { limit: 5 } }, user1);
  assert(okReport.status === "ok", "report for a resolved household → ok", okReport.status);
  const okResult = okReport.result as any;
  assert(okResult.source === "food-opportunity-engine", "result is attributed to the food-opportunity-engine source");
  assert(okResult.opportunities.length === 1 && okResult.opportunities[0].owningDomain === "planner", "opportunities surfaced from the port");
  assert(calls.includes("identifyOpportunities(1)"), "delegated to the opportunity engine port with the caller's own numeric userId");

  section("§2 Unsupported intent — verbs outside the extended allow-list still rejected");
  const searchIntent = await platform.handle({ verb: "search", capabilityId: "food-intelligence", parameters: {} }, user1);
  assert(searchIntent.status === "unsupported_intent", "search not in allow-list → unsupported_intent", searchIntent.status);

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`FI4 Food Opportunity Engine binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
