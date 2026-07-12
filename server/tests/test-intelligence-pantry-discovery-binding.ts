/**
 * test-intelligence-pantry-discovery-binding.ts (INT31)
 * ==========================================================
 * Verifies the SEVENTEENTH live capability binding: Pantry Discovery.
 *
 * Covered:
 *   — PantryDiscoveryEngine.discover: match by displayName (case-insensitive)
 *   — discover: match by ingredientKey
 *   — discover: empty query → all items
 *   — discover: deleted items excluded
 *   — discover: no match → empty results
 *   — discover: capping at PANTRY_DISCOVERY_MAX_RESULTS
 *   — Capability lookup (eighteen live capabilities after INT32)
 *   — Permission: anonymous → denied
 *   — Search: matching by name → correct item
 *   — Search: empty query → all items
 *   — Search: no match → totalCount 0, NOT a gap
 *   — Write verbs → gap or unsupported
 *   — canExecute("pantry-discovery", "search") → true on canonical singleton
 *   — Singleton scope lock: exactly EIGHTEEN live capabilities
 *
 * Run with: npx tsx server/tests/test-intelligence-pantry-discovery-binding.ts
 */

import {
  IntelligencePlatform,
  intelligencePlatform,
  PANTRY_DISCOVERY_CAPABILITY_ID,
  PANTRY_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  type IntelligenceContext,
} from "../intelligence/index.js";
import { bindPantryDiscoveryCapability } from "../intelligence/bindings/pantry-discovery.js";
import type { PantryDiscoveryPort, PantryDiscoveryItem } from "../intelligence/handlers/pantry-discovery-port.js";
import { PantryDiscoveryEngine, PANTRY_DISCOVERY_MAX_RESULTS } from "../intelligence/services/pantry-discovery-engine.js";

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

const PANTRY_ITEMS = [
  { id: 1, ingredientKey: "plain-flour", displayName: "Plain Flour", category: "larder", isDeleted: false, needQuantityValue: 500, needUnit: "g" },
  { id: 2, ingredientKey: "olive-oil", displayName: "Olive Oil", category: "larder", isDeleted: false, needQuantityValue: null, needUnit: null },
  { id: 3, ingredientKey: "whole-milk", displayName: null, category: "fridge", isDeleted: false, needQuantityValue: 2, needUnit: "L" },
  { id: 4, ingredientKey: "stale-bread", displayName: "Stale Bread", category: "larder", isDeleted: true, needQuantityValue: null, needUnit: null },
];

function makeStorage() {
  return { getPantryItems: async (_userId: number) => PANTRY_ITEMS };
}

// ---------------------------------------------------------------------------
// Engine unit tests
// ---------------------------------------------------------------------------

section("PantryDiscoveryEngine — discover()");

const engine = new PantryDiscoveryEngine(makeStorage() as any);

// Empty query — all non-deleted items
const allResult = await engine.discover("", 1);
assert(allResult.length === 3, "empty query returns 3 non-deleted items (stale-bread excluded)");

// Match by displayName
const flourResult = await engine.discover("flour", 1);
assert(flourResult.length === 1, "query 'flour' matches 1 item");
assert(flourResult[0].name === "Plain Flour", "matched item is Plain Flour");
assert(flourResult[0].ingredientKey === "plain-flour", "ingredientKey correct");
assert(flourResult[0].location === "larder", "location is 'larder'");
assert(flourResult[0].quantity === 500, "quantity is 500");
assert(flourResult[0].unit === "g", "unit is 'g'");
assert(flourResult[0].source === "pantry-discovery", "source is 'pantry-discovery'");
assert(flourResult[0].id.startsWith("pantry-item:"), "id prefixed 'pantry-item:'");

// Match by ingredientKey when displayName is null
const milkResult = await engine.discover("whole", 1);
assert(milkResult.length === 1, "query 'whole' matches milk via ingredientKey");
assert(milkResult[0].name === "whole-milk", "name falls back to ingredientKey");

// Deleted items excluded
const deletedResult = await engine.discover("stale", 1);
assert(deletedResult.length === 0, "deleted items are excluded");

// Case-insensitive
const upperResult = await engine.discover("OIL", 1);
assert(upperResult.length === 1, "UPPERCASE query matches Olive Oil");

// No match
const noMatchResult = await engine.discover("tofu", 1);
assert(noMatchResult.length === 0, "query 'tofu' → empty (not an error)");

// Capping
const bigStorage = {
  getPantryItems: async () =>
    Array.from({ length: PANTRY_DISCOVERY_MAX_RESULTS + 10 }, (_, i) => ({
      id: i + 1,
      ingredientKey: `item-${i + 1}`,
      displayName: `Item ${i + 1}`,
      category: "larder",
      isDeleted: false,
      needQuantityValue: null,
      needUnit: null,
    })),
};
const bigEngine = new PantryDiscoveryEngine(bigStorage as any);
const bigResult = await bigEngine.discover("", 1);
assert(bigResult.length === PANTRY_DISCOVERY_MAX_RESULTS, `capping: ${bigResult.length} ≤ ${PANTRY_DISCOVERY_MAX_RESULTS}`);

// ---------------------------------------------------------------------------
// Handler + binding tests
// ---------------------------------------------------------------------------

section("Binding lifecycle — isolated platform");

const platform = new IntelligencePlatform();
const preBind = platform.registry.get(PANTRY_DISCOVERY_CAPABILITY_ID);
assert(preBind?.availability !== "available", "pantry-discovery NOT available before binding");

const stubPort: PantryDiscoveryPort = {
  discover: async (query: string, _userId: number): Promise<PantryDiscoveryItem[]> => {
    if (query.toLowerCase().includes("flour")) {
      return [{ id: "pantry-item:1", pantryItemId: 1, name: "Plain Flour", ingredientKey: "plain-flour", quantity: 500, unit: "g", location: "larder", source: "pantry-discovery" }];
    }
    if (query === "") {
      return [
        { id: "pantry-item:1", pantryItemId: 1, name: "Plain Flour", ingredientKey: "plain-flour", quantity: 500, unit: "g", location: "larder", source: "pantry-discovery" },
        { id: "pantry-item:2", pantryItemId: 2, name: "Olive Oil", ingredientKey: "olive-oil", quantity: 0, unit: "", location: "larder", source: "pantry-discovery" },
      ];
    }
    return [];
  },
};

bindPantryDiscoveryCapability(platform, async () => stubPort);

const postBind = platform.registry.get(PANTRY_DISCOVERY_CAPABILITY_ID);
assert(postBind !== undefined, "pantry-discovery registered after binding");
assert(postBind?.availability === "available", "availability flipped to 'available'");
assert(postBind?.executableIntents.includes("search"), "executableIntents contains 'search'");

// ---------------------------------------------------------------------------
// Permission guard
// ---------------------------------------------------------------------------

section("Permission guard — anonymous caller denied");

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

const anonResult = await platform.handle(
  { verb: "search", capabilityId: "pantry-discovery", parameters: { query: "flour" } }, anon,
);
assert(anonResult.status === "denied", "anonymous → denied");

// ---------------------------------------------------------------------------
// Search scenarios
// ---------------------------------------------------------------------------

section("Search — matching by name");

const foundResult = await platform.handle(
  { verb: "search", capabilityId: "pantry-discovery", parameters: { query: "flour" } }, user1,
);
assert(foundResult.status === "ok", "search for 'flour' → ok");
const foundData = foundResult.result as any;
assert(foundData.scope === "pantry-search", "result scope is 'pantry-search'");
assert(foundData.totalCount === 1, "totalCount 1");
assert(foundData.results[0].name === "Plain Flour", "result name correct");
assert(foundData.source === "pantry-discovery", "result source correct");

section("Search — empty query returns all items");

const allItemsResult = await platform.handle(
  { verb: "search", capabilityId: "pantry-discovery", parameters: { query: "" } }, user1,
);
assert(allItemsResult.status === "ok", "empty query → ok");
assert((allItemsResult.result as any).totalCount === 2, "totalCount 2 for all-items query");

section("Search — no matching item");

const noResult = await platform.handle(
  { verb: "search", capabilityId: "pantry-discovery", parameters: { query: "tofu" } }, user1,
);
assert(noResult.status === "ok", "no match → ok (not a gap)");
assert((noResult.result as any).totalCount === 0, "totalCount 0 when no match");

section("Write verbs — all rejected");

for (const verb of ["add", "delete", "replace", "generate"] as const) {
  const wr = await platform.handle({ verb, capabilityId: "pantry-discovery", parameters: {} }, user1);
  assert(wr.status === "gap" || wr.status === "unsupported_intent", `${verb} → not executed (${wr.status})`);
}

// ---------------------------------------------------------------------------
// Canonical singleton scope lock
// ---------------------------------------------------------------------------

section("Canonical singleton — eighteen live capabilities (scope lock)");

const live = intelligencePlatform.registry.listExecutable();
assert(
  live.length === 22,
  "exactly TWENTY-TWO capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery + planner-discovery + household-discovery + shopping-discovery + pantry-discovery + diary-discovery + food-intelligence + opportunity-delivery + evidence-learning + product-knowledge) — scope lock (updated by PHASE5A)",
  String(live.length),
);
assert(live.some((c) => c.id === "pantry-discovery"), "pantry-discovery is among the live capabilities");

const singletonPD = intelligencePlatform.registry.get("pantry-discovery");
assert(singletonPD !== undefined, "pantry-discovery registered on canonical singleton");
assert(singletonPD?.availability === "available", "pantry-discovery is 'available' on canonical singleton");
assert(intelligencePlatform.registry.isExecutable("pantry-discovery", "search"), "canExecute('pantry-discovery', 'search') → true");
assert(!intelligencePlatform.registry.isExecutable("pantry-discovery", "recommend"), "canExecute('pantry-discovery', 'recommend') → false");
assert(PANTRY_DISCOVERY_BINDING_EXECUTABLE_INTENTS.includes("search" as any), "PANTRY_DISCOVERY_BINDING_EXECUTABLE_INTENTS contains 'search'");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════════════`);
console.log(`  INT31 Pantry Discovery: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════`);
if (failed > 0) process.exit(1);
