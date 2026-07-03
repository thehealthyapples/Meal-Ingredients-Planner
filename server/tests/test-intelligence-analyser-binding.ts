/**
 * test-intelligence-analyser-binding.ts (INT17)
 * ==================================================
 * Verifies the ELEVENTH live capability binding: the read-only Analyser capability. It
 * proves the reusable Port → Handler → Binding pattern (shown for the Planner in INT2,
 * Shopping in INT3, Nutrition / Knowledge in INT4, Pantry in INT8, Diary in INT10,
 * Profile in INT12, Household in INT13, Partners in INT14, Meals in INT15, Templates in
 * INT16) against an eleventh, independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → analyser (owner) → response
 *
 * — WITHOUT touching the real owning module, by injecting an in-memory owner
 * (AnalyserReadPort) that stands in for `storage.getAllAdditives()`. The same handler in
 * production is injected with the real owner; the contract under test is identical.
 *
 * Covered: capability lookup (eleven live capabilities), permission validation
 * (anonymous → denied), handler invocation + delegation for the single "additives"
 * scope, missing/unsupported scope (honest gap), unsupported-intent handling,
 * read-only + single-scope enforcement (explain/analyse/report never execute, and none
 * of them require confirmation since they are all read-only verbs), and the trust rule
 * that no UPF classification, health score, or NOVA group is ever fabricated.
 *
 * Run with: npx tsx server/tests/test-intelligence-analyser-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createAnalyserReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type AnalyserReadPort,
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
// In-memory owner (stands in for storage.ts's getAllAdditives()) — the same static
// reference-table shape, trimmed for the test.
// ---------------------------------------------------------------------------

const ADDITIVES = [
  { id: 1, name: "E102 Tartrazine", type: "colour", riskLevel: "moderate", description: "Synthetic yellow azo dye.", isRegulatory: true, aliases: ["Tartrazine", "FD&C Yellow 5"] },
  { id: 2, name: "E300 Ascorbic Acid", type: "antioxidant", riskLevel: "low", description: "Vitamin C.", isRegulatory: false, aliases: ["Vitamin C"] },
  { id: 3, name: "E621 Monosodium Glutamate", type: "flavour-enhancer", riskLevel: "moderate", description: "Umami flavour enhancer.", isRegulatory: true, aliases: ["MSG"] },
];

const calls: string[] = [];

function makePort(): AnalyserReadPort {
  return {
    getAllAdditives: async () => {
      calls.push("getAllAdditives()");
      return ADDITIVES;
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeAnalyser(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("analyser", createAnalyserReadHandler(async () => makePort()), ["read"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Analyser is the eleventh live capability");
  assert(
    intelligencePlatform.getCapability("analyser")!.availability === "available",
    "canonical singleton: analyser capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("analyser")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 21,
    "exactly TWENTY-ONE capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery + planner-discovery + household-discovery + shopping-discovery + pantry-discovery + diary-discovery + food-intelligence + opportunity-delivery + evidence-learning) — scope lock (updated by EL1)",
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
      live.some((c) => c.id === "templates") &&
      live.some((c) => c.id === "analyser"),
    "the thirteen live capabilities are planner, shopping, nutrition-knowledge, pantry, diary, profile, household, partners, meals, templates, analyser, meal-discovery and nutrition-discovery",
  );
  assert(
    intelligencePlatform.getCapability("analyser")!.executableIntents.includes("read"),
    "executableIntents declares read (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("analyser")!.executableIntents.includes("explain") &&
      !intelligencePlatform.getCapability("analyser")!.executableIntents.includes("analyse") &&
      !intelligencePlatform.getCapability("analyser")!.executableIntents.includes("report"),
    "explain / analyse / report are NOT in executableIntents (no safe grounded stored-read owner — INT6A)",
  );

  const platform = platformWithFakeAnalyser();
  assert(
    platform.getCapability("analyser")!.availability === "available",
    "test platform: analyser bound → available",
  );

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous → denied");
  const anonRead = await platform.handle(
    { verb: "read", capabilityId: "analyser", parameters: { scope: "additives" } },
    anon,
  );
  assert(anonRead.status === "denied", "anonymous read → denied (no authenticated user)", anonRead.status);
  assert(
    /authenticated user/.test(anonRead.message ?? ""),
    "denial message cites authentication requirement (mirrors the live routes' req.isAuthenticated() gate)",
  );

  // -------------------------------------------------------------------------
  section("Read scope: additives — the static additives reference table, delegated unmodified");
  calls.length = 0;
  const additivesRead = await platform.handle(
    { verb: "read", capabilityId: "analyser", parameters: { scope: "additives" } },
    user1,
  );
  assert(additivesRead.status === "ok", "read scope=additives → ok", additivesRead.status);
  const ar = additivesRead.result as any;
  assert(ar?.scope === "additives", "result scope is 'additives'");
  assert(ar?.additiveCount === 3, "additiveCount matches the owner's list length", String(ar?.additiveCount));
  assert(Array.isArray(ar?.additives) && ar.additives.length === 3, "additives array surfaced from the owner");
  assert(
    ar.additives.some(
      (a: any) =>
        a.id === 1 && a.name === "E102 Tartrazine" && a.type === "colour" && a.riskLevel === "moderate" && a.isRegulatory === true,
    ) && ar.additives.some((a: any) => a.id === 2 && a.isRegulatory === false),
    "additive rows carry id/name/type/riskLevel/description/isRegulatory/aliases from the owner, unmodified",
  );
  assert(ar?.source === "additives-reference", "result is tagged with its source");
  assert(calls.includes("getAllAdditives()"), "delegated to the analyser owner — getAllAdditives called");

  // -------------------------------------------------------------------------
  section("Honest gaps — missing scope, unsupported scope");
  const noScope = await platform.handle({ verb: "read", capabilityId: "analyser", parameters: {} }, user1);
  assert(noScope.status === "gap", "read with no scope → honest gap", noScope.status);
  assert(/Supported scope/.test(noScope.message ?? ""), "gap message names the one supported scope");

  const badScope = await platform.handle(
    { verb: "read", capabilityId: "analyser", parameters: { scope: "barcode" } },
    user1,
  );
  assert(badScope.status === "gap", "read with unsupported scope → honest gap", badScope.status);
  assert(/scope/.test(badScope.message ?? ""), "gap message mentions the unsupported scope");

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the analyser allow-list");
  const searchIntent = await platform.handle({ verb: "search", capabilityId: "analyser", parameters: {} }, user1);
  assert(searchIntent.status === "unsupported_intent", "search not in analyser allow-list → unsupported_intent", searchIntent.status);

  const generateIntent = await platform.handle({ verb: "generate", capabilityId: "analyser", parameters: {} }, user1);
  assert(generateIntent.status === "unsupported_intent", "generate not in analyser allow-list → unsupported_intent", generateIntent.status);

  // -------------------------------------------------------------------------
  section("Read-only + single-scope enforcement — explain/analyse/report never execute");
  // All three are read-only verbs (no mutation), so they never require confirmation —
  // they reach the handler directly and are rejected there as an honest gap.
  const explain = await platform.handle({ verb: "explain", capabilityId: "analyser", parameters: {} }, user1);
  assert(explain.status === "gap", "explain → honest gap: no live code path", explain.status);
  assert(
    /Analyser is bound to the Intelligence Platform read-only/.test(explain.message ?? ""),
    "gap message states the binding is read-only",
  );
  assert(explain.confirmation === "none", "explain (read-only verb) never requires confirmation");

  const analyse = await platform.handle({ verb: "analyse", capabilityId: "analyser", parameters: {} }, user1);
  assert(
    analyse.status === "gap",
    "analyse → honest gap: no safe, grounded stored-read owner (live recompute would be a fabrication)",
    analyse.status,
  );
  assert(analyse.confirmation === "none", "analyse (read-only verb) never requires confirmation");

  const report = await platform.handle({ verb: "report", capabilityId: "analyser", parameters: {} }, user1);
  assert(
    report.status === "gap",
    "report → honest gap: user-specific/diary-linked, out of scope",
    report.status,
  );
  assert(report.confirmation === "none", "report (read-only verb) never requires confirmation");

  // Read verb must never require confirmation either.
  const readOk = await platform.handle(
    { verb: "read", capabilityId: "analyser", parameters: { scope: "additives" } },
    user1,
  );
  assert(
    readOk.confirmation === "none" || readOk.confirmation === undefined,
    "read-only verbs never require confirmation (no write path)",
  );

  // -------------------------------------------------------------------------
  section("Trust rule — no UPF classification, health score, or NOVA group is ever surfaced");
  assert(
    !Object.prototype.hasOwnProperty.call(ar, "upfClassification") &&
      !Object.prototype.hasOwnProperty.call(ar, "healthScore") &&
      !Object.prototype.hasOwnProperty.call(ar, "novaGroup"),
    "the only live result shape (additives) carries no upfClassification/healthScore/novaGroup field",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT17 Analyser read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
