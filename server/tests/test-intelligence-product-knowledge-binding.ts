/**
 * test-intelligence-product-knowledge-binding.ts (PHASE5A)
 * ========================================================
 * Verifies the Product Knowledge capability binding end-to-end without touching
 * the filesystem, by injecting an in-memory registry through the port.
 *
 * The centre of gravity of this suite is NOT "does it return entries". It is the
 * permission model, because Product Knowledge is the first knowledge domain in
 * THA where an incomplete record is a SECURITY defect rather than an invisible
 * fact (PKCA Rule KC13), and the first where the failure mode is disclosure
 * rather than fabrication.
 *
 * The four properties that must hold, and that this suite exists to hold down:
 *
 *   1. MONOTONIC (Rule PKR23)    a higher tier sees everything a lower tier sees.
 *   2. FAILS CLOSED (Rule PKR22) a missing/garbage visibility → developer → nobody.
 *   3. ROLE, NOT TIER (PKR24)    a free household is told what premium does.
 *   4. SILENT (Rule PKR29)       a filtered entry is indistinguishable from a
 *                                non-existent one — no "there's something here
 *                                I can't show you", which would disclose the very
 *                                fact the tier protected.
 *
 * Run with: npx tsx server/tests/test-intelligence-product-knowledge-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createProductKnowledgeReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type ProductKnowledgeReadPort,
} from "../intelligence/index.js";
import {
  listEntries,
  getEntry,
  listSections,
  searchEntries,
  normaliseVisibility,
  viewerTier,
  tierPermits,
  __setInventoryForTests,
  type ProductEntry,
  type ProductVisibility,
} from "../services/product-knowledge-registry.js";

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
// An in-memory registry: one entry at each of the four tiers, plus one with a
// visibility THAT DOES NOT EXIST (the fail-closed case).
// ---------------------------------------------------------------------------

const entry = (
  id: string,
  visibility: ProductVisibility,
  section: string,
  related: string[] = [],
): ProductEntry => ({
  id,
  name: id,
  section,
  status: "live",
  visibility,
  purpose: `What ${id} is for.`,
  owner: "Colin Clapson",
  sources: ["client/src/pages/example.tsx"],
  related,
  lastVerified: "2026-07-11",
});

const FIXTURE: ProductEntry[] = [
  entry("msg-premium", "public", "marketing-messages"),
  entry("dom-planner", "household", "domains", ["msg-premium", "adm-diagnostics"]),
  entry("adm-diagnostics", "admin", "admin-experiences"),
  entry("dev-internals", "developer", "developer-experiences"),
  // Visibility is the string "internal", which is NOT one of the four tiers.
  // Rule PKR22: it must fail closed to `developer` — never to `public`.
  { ...entry("broken-label", "public", "pages"), visibility: "internal" as unknown as ProductVisibility },
];

function makePort(): ProductKnowledgeReadPort {
  return {
    listEntries: async (tier, sec) => listEntries(tier, sec),
    getEntry: async (tier, id) => getEntry(tier, id),
    listSections: async (tier) => listSections(tier),
    searchEntries: async (tier, q) => searchEntries(tier, q),
  };
}

const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };
const freeHousehold: IntelligenceContext = { role: "user", userId: "1", premium: false };
const premiumHousehold: IntelligenceContext = { role: "user", userId: "2", premium: true };
const admin: IntelligenceContext = { role: "admin", userId: "3", premium: true };

function platformWithFakeRegistry(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("product-knowledge", createProductKnowledgeReadHandler(async () => makePort()), [
    "read",
    "search",
    "explain",
  ]);
  return p;
}

async function main(): Promise<void> {
  __setInventoryForTests(FIXTURE);

  // -------------------------------------------------------------------------
  section("Capability lookup + scope lock");

  assert(
    intelligencePlatform.getCapability("product-knowledge")!.availability === "available",
    "canonical singleton: product-knowledge is 'available' (handler bound)",
    intelligencePlatform.getCapability("product-knowledge")!.availability,
  );

  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(live.length === 22, "exactly TWENTY-TWO capabilities are live — scope lock (PHASE5A adds product-knowledge)", String(live.length));

  const cap = intelligencePlatform.getCapability("product-knowledge")!;
  assert(
    cap.executableIntents.includes("read") &&
      cap.executableIntents.includes("search") &&
      cap.executableIntents.includes("explain") &&
      !cap.executableIntents.includes("report"),
    "executableIntents is truthful: read/search/explain execute; report is NOT listed (it gaps)",
    cap.executableIntents.join(","),
  );
  assert(
    intelligencePlatform.getCapability("product-knowledge")!.availability === "available" &&
      !cap.executableIntents.includes("add") &&
      !cap.executableIntents.includes("delete"),
    "read-only by construction: no write verb is executable",
  );

  // -------------------------------------------------------------------------
  section("Rule PKR22 — visibility FAILS CLOSED (the security property)");

  assert(normaliseVisibility(undefined) === "developer", "a MISSING visibility resolves to developer, never public");
  assert(normaliseVisibility("internal") === "developer", "an UNRECOGNISED visibility resolves to developer, never public");
  assert(normaliseVisibility("") === "developer", "an EMPTY visibility resolves to developer, never public");
  assert(normaliseVisibility("public") === "public", "a valid visibility is preserved");

  assert(
    getEntry("admin", "broken-label") === undefined,
    "an entry with a malformed visibility is served to NO ONE — not even an admin (it fell closed to developer)",
  );

  // -------------------------------------------------------------------------
  section("Rule PKR23 — visibility is MONOTONIC (developer ⊇ admin ⊇ household ⊇ public)");

  assert(tierPermits("admin", "public") && tierPermits("admin", "household") && tierPermits("admin", "admin"),
    "admin is told everything household and public are told, plus admin");
  assert(tierPermits("household", "public") && !tierPermits("household", "admin"),
    "household is told public, but NOT admin");
  assert(!tierPermits("public", "household") && !tierPermits("public", "admin"),
    "public is told neither household nor admin");

  const publicIds = listEntries("public").map((e) => e.id);
  const householdIds = listEntries("household").map((e) => e.id);
  const adminIds = listEntries("admin").map((e) => e.id);

  assert(
    publicIds.every((id) => householdIds.includes(id)) && householdIds.every((id) => adminIds.includes(id)),
    "each tier's entries are a strict superset of the tier below — no fact is admin-invisible but household-visible",
  );
  assert(
    publicIds.length === 1 && householdIds.length === 2 && adminIds.length === 3,
    "counts hold: public=1, household=2, admin=3 (the developer entry and the broken one reach nobody)",
    `${publicIds.length}/${householdIds.length}/${adminIds.length}`,
  );

  // -------------------------------------------------------------------------
  section("Rule PKR24 — visibility keys on ROLE, never on subscription tier");

  const freeTier = viewerTier(freeHousehold.role, freeHousehold.userId != null);
  const premiumTier = viewerTier(premiumHousehold.role, premiumHousehold.userId != null);
  assert(
    freeTier === premiumTier && freeTier === "household",
    "a FREE household and a PREMIUM household resolve to the SAME tier — knowing what premium does is not access to it",
    `${freeTier} vs ${premiumTier}`,
  );

  const platform = platformWithFakeRegistry();
  const freeSeesPremiumMsg = await platform.handle(
    { capabilityId: "product-knowledge", verb: "read", parameters: { id: "msg-premium" } },
    freeHousehold,
  );
  assert(
    freeSeesPremiumMsg.status === "ok",
    "a FREE household CAN be told about a premium marketing message — a product that will not explain what it sells is indefensible",
    freeSeesPremiumMsg.status,
  );

  // -------------------------------------------------------------------------
  section("Rule PKR25 — the registry CLASSIFIES; access.ts AUTHORISES");

  assert(
    viewerTier("admin", true) === "admin" && viewerTier("user", true) === "household" && viewerTier("user", false) === "public",
    "the tier is DERIVED from the role the platform already resolved — the registry never decides who anyone is",
  );
  assert(
    viewerTier("user", true) !== "admin",
    "no registry value can promote a user to admin: role is the only input, and it comes from access.ts",
  );

  // -------------------------------------------------------------------------
  section("Rule PKR29 — absence is NEVER explained (the disclosure test)");

  const anonymousOnAdmin = await platform.handle(
    { capabilityId: "product-knowledge", verb: "read", parameters: { id: "adm-diagnostics" } },
    anon,
  );
  const anonymousOnNonsense = await platform.handle(
    { capabilityId: "product-knowledge", verb: "read", parameters: { id: "no-such-entry-at-all" } },
    anon,
  );

  assert(anonymousOnAdmin.status === "gap", "an admin entry requested anonymously is a GAP", anonymousOnAdmin.status);
  assert(anonymousOnNonsense.status === "gap", "a non-existent entry is a GAP", anonymousOnNonsense.status);

  // The critical assertion of this whole suite. If these two messages differed,
  // the caller could distinguish "exists but hidden" from "does not exist", and
  // the existence of every admin surface would be enumerable by a stranger.
  const hiddenMsg = (anonymousOnAdmin as any).message ?? "";
  const missingMsg = (anonymousOnNonsense as any).message ?? "";
  assert(
    hiddenMsg.replace("adm-diagnostics", "X") === missingMsg.replace("no-such-entry-at-all", "X"),
    "a HIDDEN entry and a NON-EXISTENT entry produce the SAME message — the existence of a hidden surface is itself admin knowledge",
  );
  assert(
    !/admin|permission|not allowed|cannot show|withheld|restricted/i.test(hiddenMsg),
    "the gap message never hints that something exists but is withheld",
    hiddenMsg,
  );

  // -------------------------------------------------------------------------
  section("Rule PKR29 — the related graph is filtered too");

  const explainAsHousehold = await platform.handle(
    { capabilityId: "product-knowledge", verb: "explain", parameters: { id: "dom-planner" } },
    freeHousehold,
  );
  assert(explainAsHousehold.status === "ok", "explain resolves for a household-visible entry", explainAsHousehold.status);

  const relatedIds = ((explainAsHousehold as any).result?.related ?? []).map((r: any) => r.id);
  assert(
    relatedIds.includes("msg-premium") && !relatedIds.includes("adm-diagnostics"),
    "dom-planner's related graph names an admin entry — it is DROPPED for a household, not listed-but-empty (naming the id would disclose the surface)",
    relatedIds.join(","),
  );

  const explainAsAdmin = await platform.handle(
    { capabilityId: "product-knowledge", verb: "explain", parameters: { id: "dom-planner" } },
    admin,
  );
  const adminRelated = ((explainAsAdmin as any).result?.related ?? []).map((r: any) => r.id);
  assert(
    adminRelated.includes("adm-diagnostics"),
    "the SAME entry, read by an admin, DOES surface the admin-tier related entry",
    adminRelated.join(","),
  );

  // -------------------------------------------------------------------------
  section("Search is filtered BEFORE it matches, not after");

  const householdSearch = searchEntries("household", "what");   // matches every purpose string
  const adminSearch = searchEntries("admin", "what");
  assert(
    householdSearch.length === 2 && adminSearch.length === 3,
    "the same query returns fewer results at a lower tier — and the caller is never told how many were filtered",
    `${householdSearch.length} vs ${adminSearch.length}`,
  );
  assert(
    !householdSearch.some((e) => e.id === "adm-diagnostics" || e.id === "dev-internals"),
    "no above-tier entry leaks through search",
  );

  // -------------------------------------------------------------------------
  section("The projection does not leak governance metadata");

  const view = getEntry("household", "dom-planner")!;
  assert(
    !("owner" in view) && !("sources" in view) && !("lastVerified" in view),
    "owner / sources / last_verified are NOT projected — a household asking what the Planner is should not be told which .tsx file renders it",
    Object.keys(view).join(","),
  );

  // -------------------------------------------------------------------------
  section("Honest gaps over fabricated product knowledge");

  const emptySearch = await platform.handle(
    { capabilityId: "product-knowledge", verb: "search", parameters: { query: "quantum blockchain toaster" } },
    freeHousehold,
  );
  assert(
    emptySearch.status === "gap",
    "a question the registry cannot answer is a GAP — if the registry does not hold it, THA does not claim it",
    emptySearch.status,
  );

  const reportVerb = await platform.handle(
    { capabilityId: "product-knowledge", verb: "report", parameters: {} },
    admin,
  );
  assert(
    reportVerb.status === "gap" || reportVerb.status === "unsupported_intent",
    "`report` is an honest gap: summarising what matters about THA is the owners' editorial judgement, not the platform's",
    reportVerb.status,
  );

  const writeVerb = await platform.handle(
    { capabilityId: "product-knowledge", verb: "add", parameters: {}, confirmed: true } as any,
    admin,
  );
  assert(
    writeVerb.status === "gap" || writeVerb.status === "unsupported_intent",
    "a write verb gaps EVEN WHEN confirmed — the registry is authored in docs/product/, never at runtime",
    writeVerb.status,
  );

  // -------------------------------------------------------------------------
  section("The registry is the only source (Rule PKR27 — no product knowledge in code)");

  __setInventoryForTests([]);
  const emptyRegistry = await platform.handle(
    { capabilityId: "product-knowledge", verb: "search", parameters: { query: "planner" } },
    freeHousehold,
  );
  assert(
    emptyRegistry.status === "gap",
    "with an EMPTY registry the capability knows nothing about THA — there is no hardcoded fallback set of product facts to fall back on",
    emptyRegistry.status,
  );
  __setInventoryForTests(FIXTURE);

  // -------------------------------------------------------------------------
  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed\n`);
  __setInventoryForTests(null);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
