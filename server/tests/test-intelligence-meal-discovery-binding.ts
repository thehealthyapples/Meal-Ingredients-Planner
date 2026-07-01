/**
 * test-intelligence-meal-discovery-binding.ts (INT26)
 * ======================================================
 * Verifies the TWELFTH live capability binding: Meal Discovery. It proves the
 * Port → Handler → Binding pattern (established in INT2–INT17) against a twelfth
 * independent owner, end-to-end:
 *
 *   intent → capability registry → permission check → meal-discovery (engine) → response
 *
 * — WITHOUT a live database, by injecting an in-memory MealDiscoveryPort stub
 * that stands in for MealDiscoveryEngine. The same handler in production uses the
 * real engine; the contract under test is identical.
 *
 * Covered:
 *   — Capability lookup (twelve live capabilities after INT26)
 *   — meal-discovery registered and available in the canonical singleton
 *   — executableIntents declares "search"; "recommend" is NOT executable
 *   — Permission: anonymous → denied (before port is touched)
 *   — Search: personal result matched and surfaced correctly
 *   — Search: system result matched (sourceType "system") and surfaced correctly
 *   — Search: template result matched (sourceType "template") and surfaced correctly
 *   — Search: mixed results from all three source types in one query
 *   — Search: no match → ok (totalCount 0, empty results), NOT a gap
 *   — Search: empty query → honest gap
 *   — Search: missing query param → honest gap
 *   — DiscoveryItem shape: id, name, sourceType, sourceLabel, isAlreadySaved, importable
 *   — Result shape: scope "discovery", source "meal-discovery", sourcesQueried present
 *   — Capping: engine returns > DISCOVERY_MAX_RESULTS → handler caps to 15
 *   — Read-only enforcement: write verbs → confirmation_required or gap
 *   — Unsupported intent (review) → unsupported_intent
 *   — recommend verb → honest gap (no delegate-only ranking owner yet)
 *   — canExecute("meal-discovery", "search") → true on canonical singleton
 *   — canExecute("meal-discovery", "recommend") → false on canonical singleton
 *
 * Run with: npx tsx server/tests/test-intelligence-meal-discovery-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  intelligencePlatform,
  MEAL_DISCOVERY_CAPABILITY_ID,
  MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS,
  type IntelligenceContext,
} from "../intelligence/index.js";
import { bindMealDiscoveryCapability } from "../intelligence/bindings/meal-discovery.js";
import type { MealDiscoveryPort, DiscoveryItem } from "../intelligence/handlers/meal-discovery-port.js";

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
// In-memory port stub — three fixture items, one per source type
// ---------------------------------------------------------------------------

const PERSONAL_ITEM: DiscoveryItem = {
  id: "personal:42",
  name: "Colin's Chilli",
  description: "A warm, hearty chilli",
  servings: 4,
  mealFormat: "recipe",
  dietTypes: [],
  sourceType: "personal",
  sourceLabel: "Your Cookbook",
  imageUrl: undefined,
  isAlreadySaved: true,
  importable: false,
  internalId: 42,
};

const SYSTEM_ITEM: DiscoveryItem = {
  id: "system:100",
  name: "THA Classic Pasta",
  description: undefined,
  servings: 2,
  mealFormat: "recipe",
  dietTypes: ["vegetarian"],
  sourceType: "system",
  sourceLabel: "THA Library",
  imageUrl: undefined,
  isAlreadySaved: true,
  importable: false,
  internalId: 100,
};

const TEMPLATE_ITEM: DiscoveryItem = {
  id: "template:7",
  name: "Chicken Rice Bowl Template",
  description: "Build your own rice bowl",
  servings: undefined,
  mealFormat: undefined,
  dietTypes: [],
  sourceType: "template",
  sourceLabel: "Meal Templates",
  imageUrl: undefined,
  isAlreadySaved: false,
  importable: false,
  internalId: undefined,
};

const portCalls: string[] = [];

function makePort(): MealDiscoveryPort {
  return {
    discover: async (query: string, userId: number): Promise<DiscoveryItem[]> => {
      portCalls.push(`discover(${JSON.stringify(query)}, ${userId})`);
      const lower = query.toLowerCase();

      const results: DiscoveryItem[] = [];
      if (PERSONAL_ITEM.name.toLowerCase().includes(lower) || lower === "chilli") {
        results.push(PERSONAL_ITEM);
      }
      if (SYSTEM_ITEM.name.toLowerCase().includes(lower) || lower === "pasta") {
        results.push(SYSTEM_ITEM);
      }
      if (TEMPLATE_ITEM.name.toLowerCase().includes(lower) || lower === "chicken") {
        results.push(TEMPLATE_ITEM);
      }
      return results;
    },
  };
}

/** A stub that returns more than 15 items — used to verify the handler cap. */
function makeOverflowPort(): MealDiscoveryPort {
  return {
    discover: async (): Promise<DiscoveryItem[]> => {
      return Array.from({ length: 20 }, (_, i) => ({
        ...PERSONAL_ITEM,
        id: `personal:${i + 1}`,
        name: `Chilli Variant ${i + 1}`,
      }));
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeDiscovery(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  bindMealDiscoveryCapability(p, async () => makePort());
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — meal-discovery is the twelfth live capability");
  // -------------------------------------------------------------------------
  assert(
    intelligencePlatform.getCapability(MEAL_DISCOVERY_CAPABILITY_ID)!.availability === "available",
    "canonical singleton: meal-discovery capability is 'available' (handler bound)",
    intelligencePlatform.getCapability(MEAL_DISCOVERY_CAPABILITY_ID)!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 12,
    "exactly TWELVE capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery) — scope lock (updated by INT26)",
    String(live.length),
  );
  assert(
    live.some((c) => c.id === MEAL_DISCOVERY_CAPABILITY_ID),
    "meal-discovery is among the live capabilities",
  );
  assert(
    intelligencePlatform.getCapability(MEAL_DISCOVERY_CAPABILITY_ID)!.executableIntents.includes("search"),
    "executableIntents declares search (INT26 — cross-source discovery — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability(MEAL_DISCOVERY_CAPABILITY_ID)!.executableIntents.includes("recommend"),
    "recommend is NOT in executableIntents — no delegate-only ranking owner yet (INT26 design §4)",
  );
  assert(
    (MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS as readonly string[]).includes("search"),
    "MEAL_DISCOVERY_BINDING_EXECUTABLE_INTENTS constant declares search",
  );

  // -------------------------------------------------------------------------
  section("canExecute() on the canonical singleton");
  // -------------------------------------------------------------------------
  assert(
    intelligencePlatform.canExecute(MEAL_DISCOVERY_CAPABILITY_ID, "search"),
    "platform.canExecute meal-discovery/search → true",
  );
  assert(
    !intelligencePlatform.canExecute(MEAL_DISCOVERY_CAPABILITY_ID, "recommend"),
    "platform.canExecute meal-discovery/recommend → false (no ranking owner method)",
  );
  assert(
    !intelligencePlatform.canExecute(MEAL_DISCOVERY_CAPABILITY_ID, "generate"),
    "platform.canExecute meal-discovery/generate → false (write not bound)",
  );

  // -------------------------------------------------------------------------
  section("Test platform — binding via fake port");
  // -------------------------------------------------------------------------
  const platform = platformWithFakeDiscovery();
  assert(
    platform.getCapability(MEAL_DISCOVERY_CAPABILITY_ID)!.availability === "available",
    "test platform: meal-discovery bound → available",
  );

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous → denied");
  // -------------------------------------------------------------------------
  portCalls.length = 0;
  const anonSearch = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "chilli" } },
    anon,
  );
  assert(anonSearch.status === "denied", "anonymous search → denied (no authenticated user)", anonSearch.status);
  assert(/authenticated user/.test(anonSearch.message ?? ""), "denial message cites authentication requirement");
  assert(portCalls.length === 0, "port is NEVER touched for anonymous callers (permission fires first)");

  // -------------------------------------------------------------------------
  section("Search verb — personal source result");
  // -------------------------------------------------------------------------
  portCalls.length = 0;
  const searchChilli = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "chilli" } },
    user1,
  );
  assert(searchChilli.status === "ok", "search 'chilli' → ok", searchChilli.status);
  const sc = searchChilli.result as any;
  assert(sc?.scope === "discovery", "result scope is 'discovery'");
  assert(sc?.query === "chilli", "result echoes the original query");
  assert(sc?.source === "meal-discovery", "source tag is 'meal-discovery'");
  assert(typeof sc?.sourcesQueried === "string" && sc.sourcesQueried.length > 0, "sourcesQueried is a non-empty string");
  assert(sc?.totalCount === 1, "totalCount === 1 for chilli search", String(sc?.totalCount));
  assert(Array.isArray(sc?.results), "results is an array");
  assert(sc?.results?.[0]?.id === "personal:42", "personal item id is 'personal:42'");
  assert(sc?.results?.[0]?.name === "Colin's Chilli", "personal item name surfaced correctly");
  assert(sc?.results?.[0]?.sourceType === "personal", "sourceType is 'personal'");
  assert(sc?.results?.[0]?.sourceLabel === "Your Cookbook", "sourceLabel is 'Your Cookbook'");
  assert(sc?.results?.[0]?.isAlreadySaved === true, "personal item isAlreadySaved is true");
  assert(sc?.results?.[0]?.importable === false, "personal item importable is false (Phase 1)");
  assert(sc?.results?.[0]?.internalId === 42, "internalId is set for personal result");
  assert(portCalls.some((c) => c.startsWith("discover(")), "port.discover() was called");

  // -------------------------------------------------------------------------
  section("Search verb — system source result");
  // -------------------------------------------------------------------------
  const searchPasta = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "pasta" } },
    user1,
  );
  assert(searchPasta.status === "ok", "search 'pasta' → ok", searchPasta.status);
  const sp = searchPasta.result as any;
  assert(sp?.totalCount === 1, "totalCount === 1 for pasta search", String(sp?.totalCount));
  assert(sp?.results?.[0]?.sourceType === "system", "sourceType is 'system'");
  assert(sp?.results?.[0]?.sourceLabel === "THA Library", "sourceLabel is 'THA Library'");
  assert(sp?.results?.[0]?.isAlreadySaved === true, "system item isAlreadySaved is true");
  assert(sp?.results?.[0]?.importable === false, "system item importable is false");
  assert(sp?.results?.[0]?.internalId === 100, "internalId is set for system result");

  // -------------------------------------------------------------------------
  section("Search verb — template source result");
  // -------------------------------------------------------------------------
  const searchTemplate = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "chicken" } },
    user1,
  );
  assert(searchTemplate.status === "ok", "search 'chicken' → ok", searchTemplate.status);
  const st = searchTemplate.result as any;
  assert(st?.totalCount === 1, "totalCount === 1 for chicken search (template match)", String(st?.totalCount));
  assert(st?.results?.[0]?.sourceType === "template", "sourceType is 'template'");
  assert(st?.results?.[0]?.sourceLabel === "Meal Templates", "sourceLabel is 'Meal Templates'");
  assert(st?.results?.[0]?.isAlreadySaved === false, "template isAlreadySaved is false — not a saved recipe");
  assert(st?.results?.[0]?.importable === false, "template importable is false (Phase 1)");
  assert(st?.results?.[0]?.internalId === undefined, "template internalId is absent");

  // -------------------------------------------------------------------------
  section("Search verb — mixed results (all three source types)");
  // -------------------------------------------------------------------------
  // The stub returns all 3 items when query matches all: use a query that all contain
  // A simple "a" will match "pasta", "chilli" → "Colin's Chilli" (has 'a'), etc.
  // Let's use a term in all three: "rice" only matches template; "classic" matches system only.
  // Use stub with override: query = "ta" matches "pasta" and "template" name and "chilli" not.
  // Actually, let's use a query that matches all three: "c" matches "chilli", "classic pasta", "chicken rice bowl".
  const searchAll = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "c" } },
    user1,
  );
  assert(searchAll.status === "ok", "search 'c' (matches all three fixtures) → ok", searchAll.status);
  const sa = searchAll.result as any;
  assert(sa?.totalCount === 3, "totalCount === 3 for mixed results", String(sa?.totalCount));
  assert(
    sa?.results?.some((r: any) => r.sourceType === "personal") &&
      sa?.results?.some((r: any) => r.sourceType === "system") &&
      sa?.results?.some((r: any) => r.sourceType === "template"),
    "results contain items from all three source types",
  );

  // -------------------------------------------------------------------------
  section("Search verb — no match → ok (empty results, not gap)");
  // -------------------------------------------------------------------------
  const searchNoMatch = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "zzznomatch999" } },
    user1,
  );
  assert(searchNoMatch.status === "ok", "no-match search → ok (not a gap)", searchNoMatch.status);
  const snm = searchNoMatch.result as any;
  assert(snm?.totalCount === 0, "totalCount is 0 for no-match", String(snm?.totalCount));
  assert(Array.isArray(snm?.results) && snm.results.length === 0, "results is an empty array");
  assert(snm?.scope === "discovery", "scope is still 'discovery' even for empty results");

  // -------------------------------------------------------------------------
  section("Search verb — honest gaps (empty / missing query)");
  // -------------------------------------------------------------------------
  const searchEmpty = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "" } },
    user1,
  );
  assert(searchEmpty.status === "gap", "empty query string → honest gap", searchEmpty.status);
  assert(/non-empty/.test(searchEmpty.message ?? ""), "gap message references non-empty query requirement");

  const searchMissing = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: {} },
    user1,
  );
  assert(searchMissing.status === "gap", "missing { query } param → honest gap", searchMissing.status);

  const searchWhitespace = await platform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "   " } },
    user1,
  );
  assert(searchWhitespace.status === "gap", "whitespace-only query → honest gap (trim → empty)", searchWhitespace.status);

  // -------------------------------------------------------------------------
  section("Result capping — more than 15 items → handler caps to 15");
  // -------------------------------------------------------------------------
  const overflowPlatform = new IntelligencePlatform(new CapabilityRegistry());
  bindMealDiscoveryCapability(overflowPlatform, async () => makeOverflowPort());
  const searchOverflow = await overflowPlatform.handle(
    { verb: "search", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: { query: "chilli" } },
    user1,
  );
  assert(searchOverflow.status === "ok", "overflow search → ok", searchOverflow.status);
  const sov = searchOverflow.result as any;
  assert(sov?.results?.length === 15, "results capped at 15 even when port returns 20", String(sov?.results?.length));
  assert(sov?.totalCount === 15, "totalCount reflects the capped count", String(sov?.totalCount));

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the meal-discovery allow-list");
  // -------------------------------------------------------------------------
  const reviewIntent = await platform.handle(
    { verb: "review", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: {} },
    user1,
  );
  assert(
    reviewIntent.status === "unsupported_intent",
    "review not in meal-discovery allow-list → unsupported_intent",
    reviewIntent.status,
  );

  // -------------------------------------------------------------------------
  section("Read-only enforcement — write verbs never execute");
  // -------------------------------------------------------------------------
  // meal-discovery has supportedIntents: ["search", "recommend"] only.
  // Verbs outside that list → unsupported_intent immediately (the platform
  // never reaches the confirmation tier for unsupported verbs).
  const generateIntent = await platform.handle(
    { verb: "generate", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: {} },
    user1,
  );
  assert(
    generateIntent.status === "unsupported_intent",
    "generate → unsupported_intent ('generate' is not in meal-discovery supportedIntents — discovery is read-only)",
    generateIntent.status,
  );
  const addIntent = await platform.handle(
    { verb: "add", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: {} },
    user1,
  );
  assert(
    addIntent.status === "unsupported_intent",
    "add → unsupported_intent (meal-discovery is a read-only discovery surface, no write verbs)",
    addIntent.status,
  );

  // -------------------------------------------------------------------------
  section("Recommend verb → honest gap (no ranking owner method yet)");
  // -------------------------------------------------------------------------
  const recommend = await platform.handle(
    { verb: "recommend", capabilityId: MEAL_DISCOVERY_CAPABILITY_ID, parameters: {} },
    user1,
  );
  assert(
    recommend.status === "gap",
    "recommend → honest gap: ranking lives inline, not a delegate-only owner method (INT26 design §4)",
    recommend.status,
  );

  // -------------------------------------------------------------------------
  section("DiscoveryItem shape invariants");
  // -------------------------------------------------------------------------
  const item = sc?.results?.[0];
  assert(typeof item?.id === "string" && item.id.includes(":"), "id is a composite 'sourceType:internalId' string");
  assert(typeof item?.name === "string" && item.name.length > 0, "name is a non-empty string");
  assert(typeof item?.sourceType === "string", "sourceType is a string");
  assert(typeof item?.sourceLabel === "string", "sourceLabel is a string");
  assert(typeof item?.isAlreadySaved === "boolean", "isAlreadySaved is a boolean");
  assert(typeof item?.importable === "boolean", "importable is a boolean");
  assert(Array.isArray(item?.dietTypes), "dietTypes is an array");
  assert(
    !("calories" in (item ?? {})) && !("nutrition" in (item ?? {})),
    "DiscoveryItem carries NO nutrition fields — out of scope (trust boundary)",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(60)}`);
  console.log(`INT26 Meal Discovery binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
