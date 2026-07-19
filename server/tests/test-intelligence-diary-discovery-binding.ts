/**
 * test-intelligence-diary-discovery-binding.ts (INT32)
 * ==========================================================
 * Verifies the EIGHTEENTH live capability binding: Diary Discovery.
 *
 * Covered:
 *   — DiaryDiscoveryEngine.discover: match by food name (case-insensitive)
 *   — discover: empty query → all recent entries
 *   — discover: no match → empty results
 *   — discover: capping at DIARY_DISCOVERY_MAX_RESULTS
 *   — Capability lookup (eighteen live capabilities after INT32)
 *   — Permission: anonymous → denied
 *   — Search: matching by food name → correct item
 *   — Search: empty query → recent entries
 *   — Search: no match → totalCount 0, NOT a gap
 *   — Write verbs → gap or unsupported
 *   — canExecute("diary-discovery", "search") → true on canonical singleton
 *   — Singleton scope lock: exactly EIGHTEEN live capabilities
 *
 * Run with: npx tsx server/tests/test-intelligence-diary-discovery-binding.ts
 */

import {
  IntelligencePlatform,
  intelligencePlatform,
  DIARY_DISCOVERY_CAPABILITY_ID,
  DIARY_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  type IntelligenceContext,
} from "../intelligence/index.js";
import { bindDiaryDiscoveryCapability } from "../intelligence/bindings/diary-discovery.js";
import type { DiaryDiscoveryPort, DiaryDiscoveryItem } from "../intelligence/handlers/diary-discovery-port.js";
import { DiaryDiscoveryEngine, DIARY_DISCOVERY_MAX_RESULTS } from "../intelligence/services/diary-discovery-engine.js";

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

const DIARY_ENTRIES = [
  { id: 1, userId: 10, mealSlot: "dinner", name: "Chicken Curry", date: "2026-06-30" },
  { id: 2, userId: 10, mealSlot: "lunch", name: "Pasta Salad", date: "2026-06-29" },
  { id: 3, userId: 10, mealSlot: "breakfast", name: "Porridge", date: "2026-06-28" },
  { id: 4, userId: 10, mealSlot: "dinner", name: "Grilled Chicken", date: "2026-06-27" },
];

function makeStorage() {
  return { getDiaryEntriesForDiscovery: async (_userId: number) => DIARY_ENTRIES };
}

function makeEmptyStorage() {
  return { getDiaryEntriesForDiscovery: async (_userId: number): Promise<typeof DIARY_ENTRIES> => [] };
}

// ---------------------------------------------------------------------------
// Engine unit tests
// ---------------------------------------------------------------------------

section("DiaryDiscoveryEngine — discover()");

const engine = new DiaryDiscoveryEngine(makeStorage() as any);

// Empty query — all entries
const allResult = await engine.discover("", 10);
assert(allResult.length === 4, "empty query returns all 4 entries");

// Match by food name
const chickenResult = await engine.discover("chicken", 10);
assert(chickenResult.length === 2, "query 'chicken' matches 2 entries");
assert(chickenResult[0].foodName === "Chicken Curry", "first result is Chicken Curry");
assert(chickenResult[1].foodName === "Grilled Chicken", "second result is Grilled Chicken");
assert(chickenResult[0].mealSlot === "dinner", "mealSlot is 'dinner'");
assert(chickenResult[0].date === "2026-06-30", "date is correct");
assert(chickenResult[0].source === "diary-discovery", "source is 'diary-discovery'");
assert(chickenResult[0].id.startsWith("diary-entry:"), "id prefixed 'diary-entry:'");

// Case-insensitive
const upperResult = await engine.discover("PASTA", 10);
assert(upperResult.length === 1, "UPPERCASE query matches Pasta Salad");

// No match
const noMatchResult = await engine.discover("sushi", 10);
assert(noMatchResult.length === 0, "query 'sushi' → empty (not an error)");

// Empty diary
const emptyEngine = new DiaryDiscoveryEngine(makeEmptyStorage() as any);
const emptyResult = await emptyEngine.discover("", 10);
assert(emptyResult.length === 0, "empty diary → empty results");

// Capping
const bigStorage = {
  getDiaryEntriesForDiscovery: async () =>
    Array.from({ length: DIARY_DISCOVERY_MAX_RESULTS + 10 }, (_, i) => ({
      id: i + 1,
      userId: 10,
      mealSlot: "dinner",
      name: `Food ${i + 1}`,
      date: "2026-06-01",
    })),
};
const bigEngine = new DiaryDiscoveryEngine(bigStorage as any);
const bigResult = await bigEngine.discover("", 10);
assert(bigResult.length === DIARY_DISCOVERY_MAX_RESULTS, `capping: ${bigResult.length} ≤ ${DIARY_DISCOVERY_MAX_RESULTS}`);

// ---------------------------------------------------------------------------
// Handler + binding tests
// ---------------------------------------------------------------------------

section("Binding lifecycle — isolated platform");

const platform = new IntelligencePlatform();
const preBind = platform.registry.get(DIARY_DISCOVERY_CAPABILITY_ID);
assert(preBind?.availability !== "available", "diary-discovery NOT available before binding");

const stubPort: DiaryDiscoveryPort = {
  discover: async (query: string, _userId: number): Promise<DiaryDiscoveryItem[]> => {
    if (query.toLowerCase().includes("chicken")) {
      return [{
        id: "diary-entry:1", diaryEntryId: 1, foodName: "Chicken Curry",
        mealSlot: "dinner", date: "2026-06-30", quantity: 0, unit: "", source: "diary-discovery",
      }];
    }
    if (query === "") {
      return [
        { id: "diary-entry:1", diaryEntryId: 1, foodName: "Chicken Curry", mealSlot: "dinner", date: "2026-06-30", quantity: 0, unit: "", source: "diary-discovery" },
        { id: "diary-entry:2", diaryEntryId: 2, foodName: "Pasta Salad", mealSlot: "lunch", date: "2026-06-29", quantity: 0, unit: "", source: "diary-discovery" },
      ];
    }
    return [];
  },
};

bindDiaryDiscoveryCapability(platform, async () => stubPort);

const postBind = platform.registry.get(DIARY_DISCOVERY_CAPABILITY_ID);
assert(postBind !== undefined, "diary-discovery registered after binding");
assert(postBind?.availability === "available", "availability flipped to 'available'");
assert(postBind?.executableIntents.includes("search"), "executableIntents contains 'search'");

// ---------------------------------------------------------------------------
// Permission guard
// ---------------------------------------------------------------------------

section("Permission guard — anonymous caller denied");

const user1: IntelligenceContext = { role: "user", userId: "10", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

const anonResult = await platform.handle(
  { verb: "search", capabilityId: "diary-discovery", parameters: { query: "chicken" } }, anon,
);
assert(anonResult.status === "denied", "anonymous → denied");

// ---------------------------------------------------------------------------
// Search scenarios
// ---------------------------------------------------------------------------

section("Search — matching by food name");

const foundResult = await platform.handle(
  { verb: "search", capabilityId: "diary-discovery", parameters: { query: "chicken" } }, user1,
);
assert(foundResult.status === "ok", "search for 'chicken' → ok");
const foundData = foundResult.result as any;
assert(foundData.scope === "diary-search", "result scope is 'diary-search'");
assert(foundData.totalCount === 1, "totalCount 1");
assert(foundData.results[0].foodName === "Chicken Curry", "result foodName correct");
assert(foundData.source === "diary-discovery", "result source correct");

section("Search — empty query returns all entries");

const allItemsResult = await platform.handle(
  { verb: "search", capabilityId: "diary-discovery", parameters: { query: "" } }, user1,
);
assert(allItemsResult.status === "ok", "empty query → ok");
assert((allItemsResult.result as any).totalCount === 2, "totalCount 2 for all-entries query");

section("Search — no matching entry");

const noResult = await platform.handle(
  { verb: "search", capabilityId: "diary-discovery", parameters: { query: "sushi" } }, user1,
);
assert(noResult.status === "ok", "no match → ok (not a gap)");
assert((noResult.result as any).totalCount === 0, "totalCount 0 when no match");

section("Write verbs — all rejected");

for (const verb of ["add", "delete", "replace", "generate"] as const) {
  const wr = await platform.handle({ verb, capabilityId: "diary-discovery", parameters: {} }, user1);
  assert(wr.status === "gap" || wr.status === "unsupported_intent", `${verb} → not executed (${wr.status})`);
}

// ---------------------------------------------------------------------------
// Canonical singleton scope lock
// ---------------------------------------------------------------------------

section("Canonical singleton — eighteen live capabilities (scope lock)");

const live = intelligencePlatform.registry.listExecutable();
assert(
  live.length === 23,
  "exactly TWENTY-THREE capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery + planner-discovery + household-discovery + shopping-discovery + pantry-discovery + diary-discovery + food-intelligence + opportunity-delivery + evidence-learning + product-knowledge) — scope lock (updated by PHASE5A)",
  String(live.length),
);
assert(live.some((c) => c.id === "diary-discovery"), "diary-discovery is among the live capabilities");

const singletonDD = intelligencePlatform.registry.get("diary-discovery");
assert(singletonDD !== undefined, "diary-discovery registered on canonical singleton");
assert(singletonDD?.availability === "available", "diary-discovery is 'available' on canonical singleton");
assert(intelligencePlatform.registry.isExecutable("diary-discovery", "search"), "canExecute('diary-discovery', 'search') → true");
assert(!intelligencePlatform.registry.isExecutable("diary-discovery", "recommend"), "canExecute('diary-discovery', 'recommend') → false");
assert(DIARY_DISCOVERY_BINDING_EXECUTABLE_INTENTS.includes("search" as any), "DIARY_DISCOVERY_BINDING_EXECUTABLE_INTENTS contains 'search'");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n══════════════════════════════════════════════`);
console.log(`  INT32 Diary Discovery: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════════════`);
if (failed > 0) process.exit(1);
