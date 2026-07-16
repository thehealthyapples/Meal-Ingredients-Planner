/**
 * test-intelligence-household-discovery-binding.ts (INT29)
 * ==========================================================
 * Verifies the FIFTEENTH live capability binding: Household Discovery. It proves
 * the Port → Handler → Binding pattern against a fifteenth independent owner,
 * end-to-end:
 *
 *   intent → capability registry → permission check → household-discovery (engine) → response
 *
 * WITHOUT a live database, by injecting an in-memory HouseholdDiscoveryPort stub.
 *
 * Covered:
 *   — HouseholdDiscoveryEngine.discover: match by name (case-insensitive)
 *   — discover: match by diet type
 *   — discover: match by hard restriction/allergen
 *   — discover: empty query → return ALL members (not a gap)
 *   — discover: no match → empty results (ok, not a gap)
 *   — discover: user with no household → empty result + gap raised by handler
 *   — Capability lookup (fifteen live capabilities after INT29)
 *   — household-discovery registered + available in the canonical singleton
 *   — executableIntents declares "search"
 *   — Permission: anonymous → denied (before port is touched)
 *   — Search: matching by name → correct item returned
 *   — Search: matching by allergen → correct item returned
 *   — Search: empty query → all members returned
 *   — Search: no match → totalCount 0, empty results (NOT a gap)
 *   — Search: no household → gap
 *   — Write verbs → gap or unsupported
 *   — canExecute("household-discovery", "search") → true on canonical singleton
 *   — canExecute("household-discovery", "recommend") → false on canonical singleton
 *   — Singleton scope lock: exactly FIFTEEN live capabilities
 *
 * Run with: npx tsx server/tests/test-intelligence-household-discovery-binding.ts
 */

import {
  IntelligencePlatform,
  intelligencePlatform,
  HOUSEHOLD_DISCOVERY_CAPABILITY_ID,
  HOUSEHOLD_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  type IntelligenceContext,
} from "../intelligence/index.js";
import { bindHouseholdDiscoveryCapability } from "../intelligence/bindings/household-discovery.js";
import type { HouseholdDiscoveryPort, HouseholdDiscoveryItem } from "../intelligence/handlers/household-discovery-port.js";
import { HouseholdDiscoveryEngine, HOUSEHOLD_DISCOVERY_MAX_RESULTS } from "../intelligence/services/household-discovery-engine.js";

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

const ALICE = {
  id: 1,
  userId: 10,
  displayName: "Alice",
  defaultDietTypes: ["vegan"],
  hardRestrictions: ["gluten"],
};

const BOB = {
  id: 2,
  userId: 11,
  displayName: "Bob",
  defaultDietTypes: ["pescatarian"],
  hardRestrictions: ["dairy", "nuts"],
};

// An eater with no account — NOT a guest. THA's "guest" is GuestEater: a visitor at a
// single planner entry who is not in the household (CONV1 BEH-1).
const CHARLIE_NO_ACCOUNT = {
  id: 3,
  userId: null,
  displayName: "Charlie (no account)",
  defaultDietTypes: [],
  hardRestrictions: [],
};

const household = { id: 100, name: "Smith Household" };
const members = [
  { userId: 10, role: "owner" },
  { userId: 11, role: "member" },
];
const eaters = [ALICE, BOB, CHARLIE_NO_ACCOUNT];

function makeStorage() {
  return {
    getHouseholdByUser: async (_userId: number) => ({ household, members }),
    getHouseholdEaters: async (_householdId: number) => eaters,
  };
}

function makeEmptyStorage() {
  return {
    getHouseholdByUser: async (_userId: number) => null,
    getHouseholdEaters: async (_householdId: number) => [],
  };
}

// ---------------------------------------------------------------------------
// Engine unit tests
// ---------------------------------------------------------------------------

section("HouseholdDiscoveryEngine — discover()");

const engine = new HouseholdDiscoveryEngine(makeStorage() as any);

// Empty query — all members
const allResult = await engine.discover("", 10);
assert(allResult.items.length === 3, "empty query returns all 3 members");
assert(allResult.householdName === "Smith Household", "householdName populated");

// Name match (case-insensitive)
const aliceResult = await engine.discover("alice", 10);
assert(aliceResult.items.length === 1, "query 'alice' matches 1 member");
assert(aliceResult.items[0].displayName === "Alice", "matched member is Alice");
assert(aliceResult.items[0].role === "owner", "Alice's role is 'owner'");
assert(aliceResult.items[0].source === "household-discovery", "result carries source='household-discovery'");
assert(aliceResult.items[0].id.startsWith("household-member:"), "result id prefixed 'household-member:'");

// Diet type match
const veganResult = await engine.discover("vegan", 10);
assert(veganResult.items.length === 1, "query 'vegan' matches 1 member (Alice)");
assert(veganResult.items[0].displayName === "Alice", "vegan member is Alice");

// Allergen/restriction match — two members have dairy
const dairyResult = await engine.discover("dairy", 10);
assert(dairyResult.items.length === 1, "query 'dairy' matches 1 member (Bob)");
assert(dairyResult.items[0].displayName === "Bob", "dairy-restricted member is Bob");

// Query 'nuts' — Bob only
const nutsResult = await engine.discover("nuts", 10);
assert(nutsResult.items.length === 1, "query 'nuts' matches Bob only");

// No match
const noMatchResult = await engine.discover("paleo", 10);
assert(noMatchResult.items.length === 0, "query 'paleo' → empty results (not an error)");

// An account-less member is reported as having no account — never as a "guest" (CONV1 BEH-1)
const noAccountResult = await engine.discover("charlie", 10);
assert(noAccountResult.items.length === 1, "account-less Charlie found by name");
assert(noAccountResult.items[0].role === "no-account", "account-less Charlie's role is 'no-account'");
assert(noAccountResult.items[0].role !== "guest", "the retired 'guest' role never reaches the model");

// Case-insensitive
const upperResult = await engine.discover("BOB", 10);
assert(upperResult.items.length === 1, "UPPERCASE query matches Bob");

// Empty household
const emptyEngine = new HouseholdDiscoveryEngine(makeEmptyStorage() as any);
const emptyResult = await emptyEngine.discover("", 10);
assert(emptyResult.items.length === 0, "no household → empty items");
assert(emptyResult.householdName === "", "no household → householdName is empty string");

// Capping
const bigStorage = {
  getHouseholdByUser: async () => ({ household, members }),
  getHouseholdEaters: async () =>
    Array.from({ length: HOUSEHOLD_DISCOVERY_MAX_RESULTS + 5 }, (_, i) => ({
      id: i + 1,
      userId: i + 1,
      displayName: `Member ${i + 1}`,
      defaultDietTypes: [],
      hardRestrictions: [],
    })),
};
const bigEngine = new HouseholdDiscoveryEngine(bigStorage as any);
const bigResult = await bigEngine.discover("", 10);
assert(bigResult.items.length === HOUSEHOLD_DISCOVERY_MAX_RESULTS, `capping: ${bigResult.items.length} ≤ ${HOUSEHOLD_DISCOVERY_MAX_RESULTS}`);

// ---------------------------------------------------------------------------
// Handler + binding tests
// ---------------------------------------------------------------------------

section("Binding lifecycle — isolated platform");

const platform = new IntelligencePlatform();

const preBind = platform.registry.get(HOUSEHOLD_DISCOVERY_CAPABILITY_ID);
assert(preBind?.availability !== "available", "household-discovery NOT available before binding (seed registers it but handler not yet bound)");

const stubPort: HouseholdDiscoveryPort = {
  discover: async (query: string, _userId: number) => {
    if (query.toLowerCase().includes("alice")) {
      return {
        items: [{
          id: "household-member:10",
          displayName: "Alice",
          userId: 10,
          role: "owner",
          dietTypes: ["vegan"],
          hardRestrictions: ["gluten"],
          source: "household-discovery",
        }],
        householdName: "Smith Household",
      };
    }
    if (query === "") {
      return {
        items: [
          { id: "household-member:10", displayName: "Alice", userId: 10, role: "owner", dietTypes: ["vegan"], hardRestrictions: ["gluten"], source: "household-discovery" },
          { id: "household-member:11", displayName: "Bob", userId: 11, role: "member", dietTypes: ["pescatarian"], hardRestrictions: ["dairy"], source: "household-discovery" },
        ],
        householdName: "Smith Household",
      };
    }
    return { items: [], householdName: "Smith Household" };
  },
};

const noHouseholdStub: HouseholdDiscoveryPort = {
  discover: async () => ({ items: [], householdName: "" }),
};

bindHouseholdDiscoveryCapability(platform, async () => stubPort);

const postBind = platform.registry.get(HOUSEHOLD_DISCOVERY_CAPABILITY_ID);
assert(postBind !== undefined, "household-discovery registered after binding");
assert(postBind?.availability === "available", "availability flipped to 'available'");
assert(postBind?.executableIntents.includes("search"), "executableIntents contains 'search'");
assert(!postBind?.executableIntents.includes("recommend"), "executableIntents does NOT contain 'recommend'");

// ---------------------------------------------------------------------------
// Permission guard
// ---------------------------------------------------------------------------

section("Permission guard — anonymous caller denied");

const user1: IntelligenceContext = { role: "user", userId: "10", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

const anonResult = await platform.handle(
  { verb: "search", capabilityId: "household-discovery", parameters: { query: "alice" } },
  anon,
);
assert(anonResult.status === "denied", "anonymous → denied");

// ---------------------------------------------------------------------------
// Search scenarios
// ---------------------------------------------------------------------------

section("Search — matching by name");

const foundResult = await platform.handle(
  { verb: "search", capabilityId: "household-discovery", parameters: { query: "alice" } },
  user1,
);
assert(foundResult.status === "ok", "search for 'alice' → ok");
const foundData = foundResult.result as any;
assert(foundData.scope === "household-search", "result scope is 'household-search'");
assert(foundData.totalCount === 1, "totalCount 1");
assert(foundData.results[0].displayName === "Alice", "result displayName correct");
assert(foundData.householdName === "Smith Household", "householdName present in result");
assert(foundData.source === "household-discovery", "result source is 'household-discovery'");

section("Search — empty query returns all members");

const allMembersResult = await platform.handle(
  { verb: "search", capabilityId: "household-discovery", parameters: { query: "" } },
  user1,
);
assert(allMembersResult.status === "ok", "empty query → ok (all members)");
assert((allMembersResult.result as any).totalCount === 2, "totalCount 2 for all-members query");

section("Search — no matching member");

const noResult = await platform.handle(
  { verb: "search", capabilityId: "household-discovery", parameters: { query: "charlie" } },
  user1,
);
assert(noResult.status === "ok", "query with no match → ok (not a gap)");
assert((noResult.result as any).totalCount === 0, "totalCount 0 when no match");

section("Search — no household → gap");

// Create a second isolated platform with the no-household stub
const platform2 = new IntelligencePlatform();
bindHouseholdDiscoveryCapability(platform2, async () => noHouseholdStub);

const noHouseholdResult = await platform2.handle(
  { verb: "search", capabilityId: "household-discovery", parameters: { query: "" } },
  user1,
);
assert(noHouseholdResult.status === "gap", "no household → gap");

section("Write verbs — all rejected as gaps");

for (const verb of ["add", "delete", "replace", "generate"] as const) {
  const wr = await platform.handle(
    { verb, capabilityId: "household-discovery", parameters: {} },
    user1,
  );
  assert(wr.status === "gap" || wr.status === "unsupported_intent", `${verb} → not executed (${wr.status})`);
}

// ---------------------------------------------------------------------------
// Canonical singleton scope lock
// ---------------------------------------------------------------------------

section("Canonical singleton — fifteen live capabilities (scope lock)");

const live = intelligencePlatform.registry.listExecutable();
assert(
  live.length === 22,
  "exactly TWENTY-TWO capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery + planner-discovery + household-discovery + shopping-discovery + pantry-discovery + diary-discovery + food-intelligence + opportunity-delivery + evidence-learning + product-knowledge) — scope lock (updated by PHASE5A)",
  String(live.length),
);
assert(live.some((c) => c.id === "household-discovery"), "household-discovery is among the live capabilities");

const singletonHD = intelligencePlatform.registry.get("household-discovery");
assert(singletonHD !== undefined, "household-discovery capability is registered on canonical singleton");
assert(singletonHD?.availability === "available", "household-discovery is 'available' on canonical singleton");

assert(
  intelligencePlatform.registry.isExecutable("household-discovery", "search"),
  "canExecute('household-discovery', 'search') → true",
);
assert(
  !intelligencePlatform.registry.isExecutable("household-discovery", "recommend"),
  "canExecute('household-discovery', 'recommend') → false",
);

assert(
  HOUSEHOLD_DISCOVERY_BINDING_EXECUTABLE_INTENTS.includes("search" as any),
  "HOUSEHOLD_DISCOVERY_BINDING_EXECUTABLE_INTENTS contains 'search'",
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════════════`);
console.log(`  INT29 Household Discovery: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════`);
if (failed > 0) process.exit(1);
