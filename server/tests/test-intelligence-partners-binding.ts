/**
 * test-intelligence-partners-binding.ts (INT14)
 * ==================================================
 * Verifies the EIGHTH live capability binding: the read-only Partners capability. It
 * proves the reusable Port → Handler → Binding pattern (shown for the Planner in INT2,
 * Shopping in INT3, Nutrition / Knowledge in INT4, Pantry in INT8, Diary in INT10,
 * Profile in INT12, Household in INT13) against an eighth, independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → partners (owner) → response
 *
 * — WITHOUT touching the real owning module, by injecting an in-memory owner
 * (PartnersReadPort) that stands in for `getBasketSupermarkets()`. The same handler in
 * production is injected with the real owner; the contract under test is identical.
 *
 * Covered: capability lookup (eight live capabilities), permission validation
 * (anonymous → denied), handler invocation + delegation for the single "retailers"
 * scope, missing/unsupported scope (honest gap), unsupported-intent handling,
 * read-only + single-scope enforcement (explain/recommend/compare never execute, and
 * none of them require confirmation since they are all read-only verbs), and the trust
 * rule that no price, comparison, or recommendation is ever fabricated.
 *
 * Run with: npx tsx server/tests/test-intelligence-partners-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createPartnersReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type PartnersReadPort,
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
// In-memory owner (stands in for lib/supermarket-basket-service.ts's
// getBasketSupermarkets()) — the same static 9-retailer shape, trimmed to 3 for the test.
// ---------------------------------------------------------------------------

const RETAILERS = [
  { name: "Tesco", key: "tesco", color: "#00539F", hasDirectBasket: true },
  { name: "Aldi", key: "aldi", color: "#00205B", hasDirectBasket: false },
  { name: "Waitrose", key: "waitrose", color: "#5D8C51", hasDirectBasket: false },
];

const calls: string[] = [];

function makePort(): PartnersReadPort {
  return {
    getBasketSupermarkets: async () => {
      calls.push("getBasketSupermarkets()");
      return RETAILERS;
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakePartners(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("partners", createPartnersReadHandler(async () => makePort()), ["read"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Partners is the eighth live capability");
  assert(
    intelligencePlatform.getCapability("partners")!.availability === "available",
    "canonical singleton: partners capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("partners")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 13,
    "exactly THIRTEEN capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery) — scope lock (updated by INT27)",
    String(live.length),
  );
  assert(
    live.some((c) => c.id === "planner") &&
      live.some((c) => c.id === "shopping") &&
      live.some((c) => c.id === "nutrition-knowledge") &&
      live.some((c) => c.id === "pantry") &&
      live.some((c) => c.id === "diary") &&
      live.some((c) => c.id === "profile") &&
      live.some((c) => c.id === "household") &&
      live.some((c) => c.id === "partners") &&
      live.some((c) => c.id === "meals") &&
      live.some((c) => c.id === "templates"),
    "the ten live capabilities are planner, shopping, nutrition-knowledge, pantry, diary, profile, household, partners, meals and templates",
  );
  assert(
    intelligencePlatform.getCapability("partners")!.executableIntents.includes("read"),
    "executableIntents declares read (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("partners")!.executableIntents.includes("explain") &&
      !intelligencePlatform.getCapability("partners")!.executableIntents.includes("recommend") &&
      !intelligencePlatform.getCapability("partners")!.executableIntents.includes("compare"),
    "explain / recommend / compare are NOT in executableIntents (no safe grounded owner — INT6A)",
  );

  const platform = platformWithFakePartners();
  assert(
    platform.getCapability("partners")!.availability === "available",
    "test platform: partners bound → available",
  );

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous → denied");
  const anonRead = await platform.handle(
    { verb: "read", capabilityId: "partners", parameters: { scope: "retailers" } },
    anon,
  );
  assert(anonRead.status === "denied", "anonymous read → denied (no authenticated user)", anonRead.status);
  assert(
    /authenticated user/.test(anonRead.message ?? ""),
    "denial message cites authentication requirement (mirrors the live route's req.isAuthenticated() gate)",
  );

  // -------------------------------------------------------------------------
  section("Read scope: retailers — the static retailer list, delegated unmodified");
  calls.length = 0;
  const retailersRead = await platform.handle(
    { verb: "read", capabilityId: "partners", parameters: { scope: "retailers" } },
    user1,
  );
  assert(retailersRead.status === "ok", "read scope=retailers → ok", retailersRead.status);
  const rr = retailersRead.result as any;
  assert(rr?.scope === "retailers", "result scope is 'retailers'");
  assert(rr?.retailerCount === 3, "retailerCount matches the owner's list length", String(rr?.retailerCount));
  assert(Array.isArray(rr?.retailers) && rr.retailers.length === 3, "retailers array surfaced from the owner");
  assert(
    rr.retailers.some((r: any) => r.key === "tesco" && r.name === "Tesco" && r.hasDirectBasket === true) &&
      rr.retailers.some((r: any) => r.key === "aldi" && r.hasDirectBasket === false),
    "retailer rows carry name/key/color/hasDirectBasket from the owner, unmodified",
  );
  assert(rr?.source === "retail-intelligence", "result is tagged with its source");
  assert(calls.includes("getBasketSupermarkets()"), "delegated to the partners owner — getBasketSupermarkets called");

  // -------------------------------------------------------------------------
  section("Honest gaps — missing scope, unsupported scope");
  const noScope = await platform.handle({ verb: "read", capabilityId: "partners", parameters: {} }, user1);
  assert(noScope.status === "gap", "read with no scope → honest gap", noScope.status);
  assert(/Supported scope/.test(noScope.message ?? ""), "gap message names the one supported scope");

  const badScope = await platform.handle(
    { verb: "read", capabilityId: "partners", parameters: { scope: "compare" } },
    user1,
  );
  assert(badScope.status === "gap", "read with unsupported scope → honest gap", badScope.status);
  assert(/scope/.test(badScope.message ?? ""), "gap message mentions the unsupported scope");

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the partners allow-list");
  const searchIntent = await platform.handle({ verb: "search", capabilityId: "partners", parameters: {} }, user1);
  assert(searchIntent.status === "unsupported_intent", "search not in partners allow-list → unsupported_intent", searchIntent.status);

  const generateIntent = await platform.handle({ verb: "generate", capabilityId: "partners", parameters: {} }, user1);
  assert(generateIntent.status === "unsupported_intent", "generate not in partners allow-list → unsupported_intent", generateIntent.status);

  // -------------------------------------------------------------------------
  section("Read-only + single-scope enforcement — explain/recommend/compare never execute");
  // All three are read-only verbs (no mutation), so they never require confirmation —
  // they reach the handler directly and are rejected there as an honest gap.
  const explain = await platform.handle({ verb: "explain", capabilityId: "partners", parameters: {} }, user1);
  assert(explain.status === "gap", "explain → honest gap: no live code path", explain.status);
  assert(
    /Partners is bound to the Intelligence Platform read-only/.test(explain.message ?? ""),
    "gap message states the binding is read-only",
  );
  assert(explain.confirmation === "none", "explain (read-only verb) never requires confirmation");

  const recommend = await platform.handle({ verb: "recommend", capabilityId: "partners", parameters: {} }, user1);
  assert(
    recommend.status === "gap",
    "recommend → honest gap: no safe, grounded owner (price synthesis would be a fabrication)",
    recommend.status,
  );
  assert(recommend.confirmation === "none", "recommend (read-only verb) never requires confirmation");

  const compare = await platform.handle({ verb: "compare", capabilityId: "partners", parameters: {} }, user1);
  assert(
    compare.status === "gap",
    "compare → honest gap: no safe, grounded owner (price synthesis would be a fabrication)",
    compare.status,
  );
  assert(compare.confirmation === "none", "compare (read-only verb) never requires confirmation");

  // Read verb must never require confirmation either.
  const readOk = await platform.handle(
    { verb: "read", capabilityId: "partners", parameters: { scope: "retailers" } },
    user1,
  );
  assert(
    readOk.confirmation === "none" || readOk.confirmation === undefined,
    "read-only verbs never require confirmation (no write path)",
  );

  // -------------------------------------------------------------------------
  section("Trust rule — no price, comparison, or recommendation is ever surfaced");
  assert(
    !Object.prototype.hasOwnProperty.call(rr, "price") &&
      !Object.prototype.hasOwnProperty.call(rr, "comparison") &&
      !Object.prototype.hasOwnProperty.call(rr, "recommendation"),
    "the only live result shape (retailers) carries no price/comparison/recommendation field",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT14 Partners read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
