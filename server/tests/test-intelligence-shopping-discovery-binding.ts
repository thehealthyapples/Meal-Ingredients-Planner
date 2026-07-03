/**
 * test-intelligence-shopping-discovery-binding.ts (INT30)
 * ==========================================================
 * Verifies the SIXTEENTH live capability binding: Shopping Discovery. It proves
 * the Port → Handler → Binding pattern against a sixteenth independent owner,
 * end-to-end:
 *
 *   intent → capability registry → permission check → shopping-discovery (engine) → response
 *
 * WITHOUT a live database, by injecting an in-memory ShoppingDiscoveryPort stub.
 *
 * Covered:
 *   — ShoppingDiscoveryEngine.discover: match by product name (case-insensitive)
 *   — discover: match by normalized name
 *   — discover: empty query → return ALL items (not a gap)
 *   — discover: no match → empty results (ok, not a gap)
 *   — discover: empty list → empty results
 *   — discover: capping at SHOPPING_DISCOVERY_MAX_RESULTS
 *   — Capability lookup (sixteen live capabilities after INT30)
 *   — shopping-discovery registered + available in the canonical singleton
 *   — executableIntents declares "search"
 *   — Permission: anonymous → denied
 *   — Search: matching by name → correct item returned
 *   — Search: empty query → all items returned
 *   — Search: no match → totalCount 0, empty results (NOT a gap)
 *   — Write verbs → gap or unsupported
 *   — canExecute("shopping-discovery", "search") → true
 *   — Singleton scope lock: exactly SIXTEEN live capabilities
 *
 * Run with: npx tsx server/tests/test-intelligence-shopping-discovery-binding.ts
 */

import {
  IntelligencePlatform,
  intelligencePlatform,
  SHOPPING_DISCOVERY_CAPABILITY_ID,
  SHOPPING_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  type IntelligenceContext,
} from "../intelligence/index.js";
import { bindShoppingDiscoveryCapability } from "../intelligence/bindings/shopping-discovery.js";
import type { ShoppingDiscoveryPort, ShoppingDiscoveryItem } from "../intelligence/handlers/shopping-discovery-port.js";
import { ShoppingDiscoveryEngine, SHOPPING_DISCOVERY_MAX_RESULTS } from "../intelligence/services/shopping-discovery-engine.js";

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

const SHOPPING_ITEMS = [
  { id: 1, productName: "Free-Range Chicken Breast", normalizedName: "chicken breast", quantity: "500g", unit: "g", category: "Meat & Fish", checked: false },
  { id: 2, productName: "Organic Pasta", normalizedName: "pasta", quantity: "400g", unit: "g", category: "Dry Goods", checked: false },
  { id: 3, productName: "Full-Fat Milk", normalizedName: "milk", quantity: "2L", unit: "L", category: "Dairy", checked: true },
  { id: 4, productName: null, normalizedName: "olive oil", quantity: "500ml", unit: "ml", category: "Condiments", checked: false },
];

function makeStorage() {
  return {
    getShoppingListItems: async (_userId: number) => SHOPPING_ITEMS,
  };
}

function makeEmptyStorage() {
  return {
    getShoppingListItems: async (_userId: number) => [],
  };
}

// ---------------------------------------------------------------------------
// Engine unit tests
// ---------------------------------------------------------------------------

section("ShoppingDiscoveryEngine — discover()");

const engine = new ShoppingDiscoveryEngine(makeStorage() as any);

// Empty query — all items
const allResult = await engine.discover("", 1);
assert(allResult.length === 4, "empty query returns all 4 items");

// Match by productName
const chickenResult = await engine.discover("chicken", 1);
assert(chickenResult.length === 1, "query 'chicken' matches 1 item");
assert(chickenResult[0].name === "Free-Range Chicken Breast", "matched item is Chicken Breast");
assert(chickenResult[0].source === "shopping-discovery", "result carries source='shopping-discovery'");
assert(chickenResult[0].id.startsWith("shopping-item:"), "result id prefixed 'shopping-item:'");
assert(chickenResult[0].shoppingItemId === 1, "shoppingItemId is 1");

// Match by normalizedName
const pastaResult = await engine.discover("pasta", 1);
assert(pastaResult.length === 1, "query 'pasta' matches 1 item");
assert(pastaResult[0].normalizedName === "pasta", "normalizedName correct");

// Case-insensitive match
const upperResult = await engine.discover("MILK", 1);
assert(upperResult.length === 1, "UPPERCASE query matches milk");
assert(upperResult[0].checked === true, "checked=true is preserved on milk item");

// Match null productName using normalizedName
const oilResult = await engine.discover("olive", 1);
assert(oilResult.length === 1, "query 'olive' matches item with null productName via normalizedName");
assert(oilResult[0].name === "olive oil", "name falls back to normalizedName when productName is null");

// No match
const noMatchResult = await engine.discover("tofu", 1);
assert(noMatchResult.length === 0, "query 'tofu' → empty (not an error)");

// Empty list
const emptyEngine = new ShoppingDiscoveryEngine(makeEmptyStorage() as any);
const emptyResult = await emptyEngine.discover("", 1);
assert(emptyResult.length === 0, "empty list → empty results");

// Capping
const bigStorage = {
  getShoppingListItems: async () =>
    Array.from({ length: SHOPPING_DISCOVERY_MAX_RESULTS + 10 }, (_, i) => ({
      id: i + 1,
      productName: `Item ${i + 1}`,
      normalizedName: `item ${i + 1}`,
      quantity: "1",
      unit: "",
      category: "General",
      checked: false,
    })),
};
const bigEngine = new ShoppingDiscoveryEngine(bigStorage as any);
const bigResult = await bigEngine.discover("", 1);
assert(bigResult.length === SHOPPING_DISCOVERY_MAX_RESULTS, `capping: ${bigResult.length} ≤ ${SHOPPING_DISCOVERY_MAX_RESULTS}`);

// ---------------------------------------------------------------------------
// Handler + binding tests
// ---------------------------------------------------------------------------

section("Binding lifecycle — isolated platform");

const platform = new IntelligencePlatform();

const preBind = platform.registry.get(SHOPPING_DISCOVERY_CAPABILITY_ID);
assert(preBind?.availability !== "available", "shopping-discovery NOT available before binding (seed registers it but handler not yet bound)");

const stubPort: ShoppingDiscoveryPort = {
  discover: async (query: string, _userId: number): Promise<ShoppingDiscoveryItem[]> => {
    if (query.toLowerCase().includes("chicken")) {
      return [{
        id: "shopping-item:1",
        shoppingItemId: 1,
        name: "Free-Range Chicken Breast",
        normalizedName: "chicken breast",
        quantity: "500g",
        unit: "g",
        category: "Meat & Fish",
        checked: false,
        source: "shopping-discovery",
      }];
    }
    if (query === "") {
      return [
        { id: "shopping-item:1", shoppingItemId: 1, name: "Chicken Breast", normalizedName: "chicken breast", quantity: "500g", unit: "g", category: "Meat", checked: false, source: "shopping-discovery" },
        { id: "shopping-item:2", shoppingItemId: 2, name: "Pasta", normalizedName: "pasta", quantity: "400g", unit: "g", category: "Dry Goods", checked: false, source: "shopping-discovery" },
      ];
    }
    return [];
  },
};

bindShoppingDiscoveryCapability(platform, async () => stubPort);

const postBind = platform.registry.get(SHOPPING_DISCOVERY_CAPABILITY_ID);
assert(postBind !== undefined, "shopping-discovery registered after binding");
assert(postBind?.availability === "available", "availability flipped to 'available'");
assert(postBind?.executableIntents.includes("search"), "executableIntents contains 'search'");
assert(!postBind?.executableIntents.includes("recommend"), "executableIntents does NOT contain 'recommend'");

// ---------------------------------------------------------------------------
// Permission guard
// ---------------------------------------------------------------------------

section("Permission guard — anonymous caller denied");

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

const anonResult = await platform.handle(
  { verb: "search", capabilityId: "shopping-discovery", parameters: { query: "chicken" } },
  anon,
);
assert(anonResult.status === "denied", "anonymous → denied");

// ---------------------------------------------------------------------------
// Search scenarios
// ---------------------------------------------------------------------------

section("Search — matching by name");

const foundResult = await platform.handle(
  { verb: "search", capabilityId: "shopping-discovery", parameters: { query: "chicken" } },
  user1,
);
assert(foundResult.status === "ok", "search for 'chicken' → ok");
const foundData = foundResult.result as any;
assert(foundData.scope === "shopping-search", "result scope is 'shopping-search'");
assert(foundData.totalCount === 1, "totalCount 1");
assert(foundData.results[0].name === "Free-Range Chicken Breast", "result name correct");
assert(foundData.source === "shopping-discovery", "result source is 'shopping-discovery'");

section("Search — empty query returns all items");

const allItemsResult = await platform.handle(
  { verb: "search", capabilityId: "shopping-discovery", parameters: { query: "" } },
  user1,
);
assert(allItemsResult.status === "ok", "empty query → ok (all items)");
assert((allItemsResult.result as any).totalCount === 2, "totalCount 2 for all-items query");

section("Search — no matching item");

const noResult = await platform.handle(
  { verb: "search", capabilityId: "shopping-discovery", parameters: { query: "tofu" } },
  user1,
);
assert(noResult.status === "ok", "query with no match → ok (not a gap)");
assert((noResult.result as any).totalCount === 0, "totalCount 0 when no match");

section("Write verbs — all rejected as gaps");

for (const verb of ["add", "delete", "replace", "generate"] as const) {
  const wr = await platform.handle(
    { verb, capabilityId: "shopping-discovery", parameters: {} },
    user1,
  );
  assert(wr.status === "gap" || wr.status === "unsupported_intent", `${verb} → not executed (${wr.status})`);
}

// ---------------------------------------------------------------------------
// Canonical singleton scope lock
// ---------------------------------------------------------------------------

section("Canonical singleton — sixteen live capabilities (scope lock)");

const live = intelligencePlatform.registry.listExecutable();
assert(
  live.length === 21,
  "exactly TWENTY-ONE capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery + planner-discovery + household-discovery + shopping-discovery + pantry-discovery + diary-discovery + food-intelligence + opportunity-delivery + evidence-learning) — scope lock (updated by EL1)",
  String(live.length),
);
assert(live.some((c) => c.id === "shopping-discovery"), "shopping-discovery is among the live capabilities");

const singletonSD = intelligencePlatform.registry.get("shopping-discovery");
assert(singletonSD !== undefined, "shopping-discovery capability is registered on canonical singleton");
assert(singletonSD?.availability === "available", "shopping-discovery is 'available' on canonical singleton");

assert(
  intelligencePlatform.registry.isExecutable("shopping-discovery", "search"),
  "canExecute('shopping-discovery', 'search') → true",
);
assert(
  !intelligencePlatform.registry.isExecutable("shopping-discovery", "recommend"),
  "canExecute('shopping-discovery', 'recommend') → false",
);

assert(
  SHOPPING_DISCOVERY_BINDING_EXECUTABLE_INTENTS.includes("search" as any),
  "SHOPPING_DISCOVERY_BINDING_EXECUTABLE_INTENTS contains 'search'",
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════════════`);
console.log(`  INT30 Shopping Discovery: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════`);
if (failed > 0) process.exit(1);
