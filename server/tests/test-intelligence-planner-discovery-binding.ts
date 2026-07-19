/**
 * test-intelligence-planner-discovery-binding.ts (INT28)
 * =======================================================
 * Verifies the FOURTEENTH live capability binding: Planner Discovery. It proves
 * the Port → Handler → Binding pattern (established in INT2–INT27) against a
 * fourteenth independent owner, end-to-end:
 *
 *   intent → capability registry → permission check → planner-discovery (engine) → response
 *
 * — WITHOUT a live database, by injecting an in-memory PlannerDiscoveryPort stub.
 *
 * Covered:
 *   — PlannerDiscoveryEngine.discover: query match on meal name, case-insensitive
 *   — discover: empty query → empty result (gap handled by handler)
 *   — discover: no matching meals → empty result (ok, not a gap)
 *   — discover: capping at PLANNER_DISCOVERY_MAX_RESULTS
 *   — discover: fan-out across multiple weeks; results carry week name + number
 *   — Capability lookup (fourteen live capabilities after INT28)
 *   — planner-discovery registered + available in the canonical singleton
 *   — executableIntents declares "search"
 *   — Permission: anonymous → denied (before port is touched)
 *   — Search: matching meal → correct item returned
 *   — Search: no match → totalCount 0, empty results (NOT a gap)
 *   — Search: empty query → gap
 *   — Write verbs → gap (read-only binding)
 *   — canExecute("planner-discovery", "search") → true on canonical singleton
 *   — canExecute("planner-discovery", "recommend") → false on canonical singleton
 *   — Singleton scope lock: exactly FOURTEEN live capabilities
 *
 * Run with: npx tsx server/tests/test-intelligence-planner-discovery-binding.ts
 */

import {
  IntelligencePlatform,
  intelligencePlatform,
  PLANNER_DISCOVERY_CAPABILITY_ID,
  PLANNER_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  type IntelligenceContext,
} from "../intelligence/index.js";
import { bindPlannerDiscoveryCapability } from "../intelligence/bindings/planner-discovery.js";
import type { PlannerDiscoveryPort, PlannerDiscoveryItem } from "../intelligence/handlers/planner-discovery-port.js";
import { PlannerDiscoveryEngine, PLANNER_DISCOVERY_MAX_RESULTS } from "../intelligence/services/planner-discovery-engine.js";

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
// Fixtures
// ---------------------------------------------------------------------------

function makeWeek(id: number, weekNumber: number, weekName: string) {
  return { id, weekNumber, weekName, householdId: 1, userId: 1 } as any;
}

function makeEntry(id: number, mealId: number, mealType: string) {
  return { id, dayId: 10, mealId, mealType } as any;
}

function makeMeal(id: number, name: string) {
  return { id, name } as any;
}

// Weeks: W1 (Week 1), W2 (Week 2)
const WEEK1 = makeWeek(1, 1, "Week 1");
const WEEK2 = makeWeek(2, 2, "Week 2");

// Meals
const CHICKEN_CURRY = makeMeal(10, "Chicken Curry");
const PASTA_BAKE = makeMeal(20, "Pasta Bake");
const VEGGIE_STEW = makeMeal(30, "Veggie Stew");

// Entries in Week 1
const ENTRY_CHICKEN = makeEntry(100, 10, "dinner");
const ENTRY_PASTA = makeEntry(101, 20, "lunch");

// Entry in Week 2
const ENTRY_STEW = makeEntry(200, 30, "dinner");
const ENTRY_CHICKEN_W2 = makeEntry(201, 10, "lunch"); // chicken also in week 2

const meals = new Map([
  [10, CHICKEN_CURRY],
  [20, PASTA_BAKE],
  [30, VEGGIE_STEW],
]);

const weeks = [WEEK1, WEEK2];
const entriesByWeek = new Map([
  [1, [ENTRY_CHICKEN, ENTRY_PASTA]],
  [2, [ENTRY_STEW, ENTRY_CHICKEN_W2]],
]);

function makeStorage() {
  return {
    getPlannerWeeks: async (_userId: number) => weeks,
    getPlannerEntriesForWeek: async (weekId: number) => entriesByWeek.get(weekId) ?? [],
    getMeal: async (id: number) => meals.get(id),
  };
}

// ---------------------------------------------------------------------------
// Engine unit tests
// ---------------------------------------------------------------------------

section("PlannerDiscoveryEngine — discover()");

const engine = new PlannerDiscoveryEngine(makeStorage());

const chickenResults = await engine.discover("chicken", 1);
assert(chickenResults.length === 2, "chicken matches 2 entries (in week 1 and week 2)");
assert(chickenResults.every((r) => r.mealName === "Chicken Curry"), "all results are Chicken Curry");
assert(chickenResults.some((r) => r.weekNumber === 1), "one result is from Week 1");
assert(chickenResults.some((r) => r.weekNumber === 2), "one result is from Week 2");
assert(chickenResults[0].source === "planner-discovery", "result carries source='planner-discovery'");
assert(chickenResults[0].id.startsWith("planner-entry:"), "result id prefixed 'planner-entry:'");

const pastaResults = await engine.discover("pasta", 1);
assert(pastaResults.length === 1, "pasta matches 1 entry");
assert(pastaResults[0].mealName === "Pasta Bake", "matched meal is Pasta Bake");
assert(pastaResults[0].weekName === "Week 1", "from Week 1");
assert(pastaResults[0].mealType === "lunch", "mealType is 'lunch'");

const caseResults = await engine.discover("CHICKEN", 1);
assert(caseResults.length === 2, "case-insensitive match (CHICKEN → Chicken Curry)");

const noMatchResults = await engine.discover("sushi", 1);
assert(noMatchResults.length === 0, "no match → empty array (not a gap)");

const emptyResults = await engine.discover("", 1);
assert(emptyResults.length === 0, "empty query → empty array (gap raised by handler)");

// Capping: produce more than max
const bigStorage = {
  getPlannerWeeks: async () => Array.from({ length: 5 }, (_, i) => makeWeek(i + 1, i + 1, `Week ${i + 1}`)),
  getPlannerEntriesForWeek: async (_weekId: number) =>
    Array.from({ length: 4 }, (_, j) => makeEntry(j + 1, 10, "dinner")),
  getMeal: async () => CHICKEN_CURRY,
};
const bigEngine = new PlannerDiscoveryEngine(bigStorage as any);
const bigResults = await bigEngine.discover("chicken", 1);
assert(bigResults.length === PLANNER_DISCOVERY_MAX_RESULTS, `capping: ${bigResults.length} ≤ ${PLANNER_DISCOVERY_MAX_RESULTS}`);

// ---------------------------------------------------------------------------
// Handler + binding tests
// ---------------------------------------------------------------------------

section("Binding lifecycle — isolated platform");

const platform = new IntelligencePlatform();

const preBind = platform.registry.get(PLANNER_DISCOVERY_CAPABILITY_ID);
assert(preBind?.availability !== "available", "planner-discovery NOT available before binding (new isolated platform — seed registers it but handler not yet bound)");

const stubPort: PlannerDiscoveryPort = {
  discover: async (query: string, _userId: number): Promise<PlannerDiscoveryItem[]> => {
    if (!query) return [];
    if (query.toLowerCase().includes("chicken")) {
      return [{
        id: "planner-entry:100",
        mealName: "Chicken Curry",
        mealId: 10,
        weekName: "Week 1",
        weekNumber: 1,
        mealType: "dinner",
        source: "planner-discovery",
      }];
    }
    return [];
  },
};

bindPlannerDiscoveryCapability(platform, async () => stubPort);

const postBind = platform.registry.get(PLANNER_DISCOVERY_CAPABILITY_ID);
assert(postBind !== undefined, "planner-discovery registered after binding");
assert(postBind?.availability === "available", "availability flipped to 'available'");
assert(
  postBind?.executableIntents.includes("search"),
  "executableIntents contains 'search'",
);
assert(
  !postBind?.executableIntents.includes("recommend"),
  "executableIntents does NOT contain 'recommend'",
);

// ---------------------------------------------------------------------------
// Permission guard
// ---------------------------------------------------------------------------

section("Permission guard — anonymous caller denied");

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

const anonResult = await platform.handle(
  { verb: "search", capabilityId: "planner-discovery", parameters: { query: "chicken" } },
  anon,
);
assert(anonResult.status === "denied", "anonymous → denied");

// ---------------------------------------------------------------------------
// Search scenarios
// ---------------------------------------------------------------------------

section("Search — matching meal");

const foundResult = await platform.handle(
  { verb: "search", capabilityId: "planner-discovery", parameters: { query: "chicken" } },
  user1,
);
assert(foundResult.status === "ok", "search for chicken → ok");
const foundData = foundResult.result as any;
assert(foundData.scope === "planner-search", "result scope is 'planner-search'");
assert(foundData.totalCount === 1, "totalCount 1");
assert(foundData.results[0].mealName === "Chicken Curry", "result mealName correct");
assert(foundData.source === "planner-discovery", "result source is 'planner-discovery'");

section("Search — no matching meal");

const noResult = await platform.handle(
  { verb: "search", capabilityId: "planner-discovery", parameters: { query: "sushi" } },
  user1,
);
assert(noResult.status === "ok", "search with no match → ok (not a gap)");
assert((noResult.result as any).totalCount === 0, "totalCount 0 when no match");

section("Search — empty query");

const emptyResult = await platform.handle(
  { verb: "search", capabilityId: "planner-discovery", parameters: { query: "" } },
  user1,
);
assert(emptyResult.status === "gap", "empty query → gap");

const missingQueryResult = await platform.handle(
  { verb: "search", capabilityId: "planner-discovery", parameters: {} },
  user1,
);
assert(missingQueryResult.status === "gap", "missing query param → gap");

section("Write verbs — all rejected as gaps");

for (const verb of ["add", "delete", "replace", "generate"] as const) {
  const wr = await platform.handle(
    { verb, capabilityId: "planner-discovery", parameters: {} },
    user1,
  );
  assert(wr.status === "gap" || wr.status === "unsupported_intent", `${verb} → not executed (${wr.status})`);
}

// ---------------------------------------------------------------------------
// Canonical singleton scope lock
// ---------------------------------------------------------------------------

section("Canonical singleton — fourteen live capabilities (scope lock)");

const live = intelligencePlatform.registry.listExecutable();
assert(
  live.length === 23,
  "exactly TWENTY-THREE capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery + planner-discovery + household-discovery + shopping-discovery + pantry-discovery + diary-discovery + food-intelligence + opportunity-delivery + evidence-learning + product-knowledge) — scope lock (updated by PHASE5A)",
  String(live.length),
);
assert(live.some((c) => c.id === "planner-discovery"), "planner-discovery is among the live capabilities");

const singletonPD = intelligencePlatform.registry.get("planner-discovery");
assert(singletonPD !== undefined, "planner-discovery capability is registered on canonical singleton");
assert(singletonPD?.availability === "available", "planner-discovery is 'available' on canonical singleton");

assert(
  intelligencePlatform.registry.isExecutable("planner-discovery", "search"),
  "canExecute('planner-discovery', 'search') → true",
);
assert(
  !intelligencePlatform.registry.isExecutable("planner-discovery", "recommend"),
  "canExecute('planner-discovery', 'recommend') → false",
);

// PLANNER_DISCOVERY_BINDING_EXECUTABLE_INTENTS shape check
assert(
  PLANNER_DISCOVERY_BINDING_EXECUTABLE_INTENTS.includes("search" as any),
  "PLANNER_DISCOVERY_BINDING_EXECUTABLE_INTENTS contains 'search'",
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════════════`);
console.log(`  INT28 Planner Discovery: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════`);
if (failed > 0) process.exit(1);
