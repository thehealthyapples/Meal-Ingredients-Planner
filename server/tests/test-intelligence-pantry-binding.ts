/**
 * test-intelligence-pantry-binding.ts (INT8)
 * ==========================================
 * Verifies the FOURTH live capability binding: the read-only Pantry capability. It
 * proves the reusable Port → Handler → Binding pattern (shown for the Planner in INT2,
 * Shopping in INT3, Nutrition / Knowledge in INT4) against a fourth, independent owner,
 * end-to-end —
 *
 *   intent → capability registry → permission check → pantry (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (PantryReadPort) that
 * stands in for storage. The same handler in production is injected with the real owner;
 * the contract under test is identical.
 *
 * Covered: capability lookup (four live capabilities), permission validation (auth +
 * own-data only), handler invocation, pantry-owner delegation, read list scope, explain
 * (ownership gate + stored knowledge), unknown ingredientKey, unstored knowledge,
 * unsupported intent handling, read-only enforcement (write verbs never execute), and
 * honest-gap behaviour.
 *
 * Run with: npx tsx server/tests/test-intelligence-pantry-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createPantryReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type PantryReadPort,
} from "../intelligence/index.js";
import type { UserPantryItem, PantryIngredientKnowledge } from "../../shared/schema.js";

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
// In-memory owner (stands in for storage). getPantryItems is household-scoped by
// the real owner; the in-memory version mimics that by returning a fixed list keyed
// to userId 1 only. getPantryIngredientKnowledge mimics the static knowledge table.
// ---------------------------------------------------------------------------

const PANTRY_ITEMS: UserPantryItem[] = [
  {
    id: 1,
    userId: 1,
    householdId: 10,
    ingredientKey: "olive-oil",
    displayName: "Olive Oil",
    category: "oils",
    defaultHave: true,
    isDefault: true,
    isDeleted: false,
    sortOrder: 0,
    notes: "Extra virgin",
    needQuantityValue: null,
    needUnit: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
  },
  {
    id: 2,
    userId: 1,
    householdId: 10,
    ingredientKey: "sea-salt",
    displayName: "Sea Salt",
    category: "condiments",
    defaultHave: true,
    isDefault: false,
    isDeleted: false,
    sortOrder: 1,
    notes: null,
    needQuantityValue: null,
    needUnit: null,
    createdAt: new Date("2025-01-02T00:00:00Z"),
  },
];

const OLIVE_OIL_KNOWLEDGE: PantryIngredientKnowledge = {
  id: 1,
  ingredientKey: "olive-oil",
  supports: ["mediterranean-diet", "heart-health"],
  highlights: ["Rich in monounsaturated fats", "Contains antioxidants"],
  whyItMatters: "A cornerstone of the Mediterranean diet with well-studied cardiovascular benefits.",
  goodToKnow: "Cold-pressed extra-virgin retains the most polyphenols.",
  howToChoose: ["Look for PDO/PGI certification", "Check harvest date on label"],
  tags: ["fat", "oil", "staple"],
  enrichmentSource: "manual",
  enrichmentVersion: 1,
  isLocked: true,
  lastEnrichedAt: new Date("2025-06-01T00:00:00Z"),
  createdAt: new Date("2025-01-01T00:00:00Z"),
};

const calls: string[] = [];

function makePort(): PantryReadPort {
  return {
    getPantryItems: async (userId) => {
      calls.push(`getPantryItems(${userId})`);
      if (userId !== 1) return []; // different user/household → empty list (ownership)
      return PANTRY_ITEMS;
    },
    getPantryIngredientKnowledge: async (ingredientKey) => {
      calls.push(`getPantryIngredientKnowledge(${ingredientKey})`);
      if (ingredientKey === "olive-oil") return OLIVE_OIL_KNOWLEDGE;
      return null; // no stored knowledge for other keys
    },
  };
}

const user: IntelligenceContext = { role: "user", userId: "1", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };
const otherUser: IntelligenceContext = { role: "user", userId: "99", premium: false };

function platformWithFakePantry(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("pantry", createPantryReadHandler(async () => makePort()), ["read", "explain"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Pantry is the fourth live capability");
  assert(
    intelligencePlatform.getCapability("pantry")!.availability === "available",
    "canonical singleton: pantry capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("pantry")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 12,
    "exactly TWELVE capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery) — scope lock (updated by INT26)",
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
    intelligencePlatform.getCapability("pantry")!.executableIntents.includes("read") &&
      intelligencePlatform.getCapability("pantry")!.executableIntents.includes("explain"),
    "executableIntents declares read + explain (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("pantry")!.executableIntents.includes("add") &&
      !intelligencePlatform.getCapability("pantry")!.executableIntents.includes("delete") &&
      !intelligencePlatform.getCapability("pantry")!.executableIntents.includes("search") &&
      !intelligencePlatform.getCapability("pantry")!.executableIntents.includes("recommend"),
    "add / delete / search / recommend are NOT in executableIntents (no live code path — INT6A)",
  );

  const platform = platformWithFakePantry();
  assert(
    platform.getCapability("pantry")!.availability === "available",
    "test platform: pantry bound → available",
  );

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous and wrong-user → denied");
  const anonRead = await platform.handle(
    { verb: "read", capabilityId: "pantry", parameters: { scope: "list" } },
    anon,
  );
  assert(anonRead.status === "denied", "anonymous read → denied (no authenticated user)", anonRead.status);
  assert(
    /authenticated user/.test(anonRead.message ?? ""),
    "denial message cites authentication requirement",
  );

  const anonExplain = await platform.handle(
    { verb: "explain", capabilityId: "pantry", parameters: { ingredientKey: "olive-oil" } },
    anon,
  );
  assert(anonExplain.status === "denied", "anonymous explain → denied", anonExplain.status);

  // -------------------------------------------------------------------------
  section("Handler invocation + delegation — read list");
  calls.length = 0;
  const list = await platform.handle(
    { verb: "read", capabilityId: "pantry", parameters: { scope: "list" } },
    user,
  );
  assert(list.status === "ok", "read list → ok", list.status);
  const lr = list.result as any;
  assert(lr?.scope === "list", "result scope is 'list'", String(lr?.scope));
  assert(lr?.itemCount === 2, "itemCount matches owner data (2 items)", String(lr?.itemCount));
  assert(lr?.items?.length === 2, "items array has 2 entries", String(lr?.items?.length));
  assert(
    lr?.items?.[0]?.ingredientKey === "olive-oil" && lr?.items?.[0]?.displayName === "Olive Oil",
    "first item: olive-oil with correct displayName",
    String(lr?.items?.[0]?.ingredientKey),
  );
  assert(
    lr?.items?.[0]?.category === "oils" && lr?.items?.[0]?.defaultHave === true,
    "first item: category and defaultHave surfaced correctly",
  );
  assert(
    !("householdId" in (lr?.items?.[0] ?? {})) && !("userId" in (lr?.items?.[0] ?? {})),
    "internal ownership fields (householdId, userId) are NOT surfaced in the projection",
  );
  assert(
    !("isDeleted" in (lr?.items?.[0] ?? {})),
    "soft-delete internal field (isDeleted) is NOT surfaced",
  );
  assert(calls.some((c) => c === "getPantryItems(1)"), "delegated to the pantry owner (no logic in the platform)");

  // -------------------------------------------------------------------------
  section("Read — honest gap for unknown scope");
  const badScope = await platform.handle(
    { verb: "read", capabilityId: "pantry", parameters: { scope: "freezer" } },
    user,
  );
  assert(badScope.status === "gap", "read with unknown scope → honest gap", badScope.status);

  const noScope = await platform.handle(
    { verb: "read", capabilityId: "pantry", parameters: {} },
    user,
  );
  assert(noScope.status === "gap", "read with no scope param → honest gap", noScope.status);

  // -------------------------------------------------------------------------
  section("Handler invocation + delegation — explain (ownership gate + stored knowledge)");
  calls.length = 0;
  const explain = await platform.handle(
    { verb: "explain", capabilityId: "pantry", parameters: { ingredientKey: "olive-oil" } },
    user,
  );
  assert(explain.status === "ok", "explain olive-oil → ok", explain.status);
  const er = explain.result as any;
  assert(er?.ingredientKey === "olive-oil", "ingredientKey echoed back", String(er?.ingredientKey));
  assert(
    er?.knowledge?.source === "pantry-ingredient-knowledge",
    "result is attributed to the pantry-ingredient-knowledge owner",
  );
  assert(
    Array.isArray(er?.knowledge?.supports) && er.knowledge.supports.includes("heart-health"),
    "supports array surfaced from owner",
  );
  assert(
    er?.knowledge?.whyItMatters === "A cornerstone of the Mediterranean diet with well-studied cardiovascular benefits.",
    "whyItMatters surfaced correctly",
  );
  assert(
    Array.isArray(er?.knowledge?.highlights) && er.knowledge.highlights.length === 2,
    "highlights array surfaced",
  );
  assert(
    er?.knowledge?.enrichmentSource === "manual",
    "enrichmentSource (attribution) surfaced",
  );
  assert(
    !("isLocked" in (er?.knowledge ?? {})) && !("enrichmentVersion" in (er?.knowledge ?? {})),
    "internal management fields (isLocked, enrichmentVersion) are NOT surfaced",
  );
  assert(
    calls.some((c) => c === "getPantryItems(1)"),
    "ownership check: getPantryItems called before knowledge lookup",
  );
  assert(
    calls.some((c) => c === "getPantryIngredientKnowledge(olive-oil)"),
    "knowledge lookup: getPantryIngredientKnowledge called for ingredientKey",
  );

  // -------------------------------------------------------------------------
  section("Explain — own-data only: foreign ingredientKey → denied");
  // otherUser (userId 99) gets empty list from the in-memory owner (simulates a different household).
  const otherHousehold = await platform.handle(
    { verb: "explain", capabilityId: "pantry", parameters: { ingredientKey: "olive-oil" } },
    otherUser,
  );
  assert(
    otherHousehold.status === "denied",
    "ingredientKey not in caller's pantry → denied (no cross-household access, no existence leak)",
    otherHousehold.status,
  );
  assert(
    /no cross-household/.test(otherHousehold.message ?? ""),
    "denial message cites no cross-household access",
  );

  // -------------------------------------------------------------------------
  section("Honest gaps — unstored knowledge, missing param");
  // sea-salt is in the caller's pantry but has no knowledge stored.
  const noKnowledge = await platform.handle(
    { verb: "explain", capabilityId: "pantry", parameters: { ingredientKey: "sea-salt" } },
    user,
  );
  assert(noKnowledge.status === "gap", "explain sea-salt (no stored knowledge) → honest gap", noKnowledge.status);
  assert(
    /will not fabricate/.test(noKnowledge.message ?? ""),
    "gap message refuses to fabricate ingredient knowledge",
  );

  const noKey = await platform.handle(
    { verb: "explain", capabilityId: "pantry", parameters: {} },
    user,
  );
  assert(noKey.status === "gap", "explain with no ingredientKey → honest gap", noKey.status);
  assert(
    /ingredientKey/.test(noKey.message ?? ""),
    "gap message mentions the missing ingredientKey param",
  );

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the allow-list");
  const importIntent = await platform.handle(
    { verb: "import", capabilityId: "pantry", parameters: {} },
    user,
  );
  assert(importIntent.status === "unsupported_intent", "import not in pantry allow-list → unsupported_intent", importIntent.status);

  const share = await platform.handle(
    { verb: "share", capabilityId: "pantry", parameters: {} },
    user,
  );
  assert(share.status === "unsupported_intent", "share not in pantry allow-list → unsupported_intent", share.status);

  // -------------------------------------------------------------------------
  section("Read-only enforcement — write verbs stop at confirmation or return honest gap");
  // 'add' and 'delete' ARE in the pantry allow-list (capabilityClass: "write"), so the
  // engine intercepts them at the CONFIRM step before the handler runs (unconfirmed).
  const addUnconfirmed = await platform.handle(
    { verb: "add", capabilityId: "pantry", parameters: { ingredientKey: "garlic" } },
    user,
  );
  assert(
    addUnconfirmed.status === "confirmation_required",
    "add (unconfirmed) → confirmation_required (never reaches handler)",
    addUnconfirmed.status,
  );

  // When confirmed, the handler is invoked — readOnlyVerbGuard throws an honest gap.
  const addConfirmed = await platform.handle(
    { verb: "add", capabilityId: "pantry", parameters: { ingredientKey: "garlic" } },
    user,
    { confirmed: true },
  );
  assert(addConfirmed.status === "gap", "add (confirmed) → honest gap: write not bound (read-only binding)", addConfirmed.status);
  assert(
    /Pantry is bound to the Intelligence Platform read-only/.test(addConfirmed.message ?? ""),
    "gap message states the binding is read-only",
  );

  const delConfirmed = await platform.handle(
    { verb: "delete", capabilityId: "pantry", parameters: { id: 1 } },
    user,
    { confirmed: true },
  );
  assert(delConfirmed.status === "gap", "delete (confirmed) → honest gap (no delete path)", delConfirmed.status);

  const search = await platform.handle(
    { verb: "search", capabilityId: "pantry", parameters: { query: "salt" } },
    user,
  );
  assert(search.status === "gap", "search → honest gap (no grounded owner search in scope)", search.status);

  const recommend = await platform.handle(
    { verb: "recommend", capabilityId: "pantry", parameters: {} },
    user,
  );
  assert(recommend.status === "gap", "recommend → honest gap (advisory; no grounded read in scope)", recommend.status);

  // Confirm read-only verbs never produce a confirmation tier.
  const readOk = await platform.handle(
    { verb: "read", capabilityId: "pantry", parameters: { scope: "list" } },
    user,
  );
  assert(
    readOk.confirmation === "none" || readOk.confirmation === undefined,
    "read-only verbs never require confirmation (no write path)",
  );

  // -------------------------------------------------------------------------
  section("Trust rules — no fabrication, delegation observed");
  // Re-verify: the handler never invents a value. The only data surfaced is what the
  // in-memory owner returned. No default/fallback values appear when owner returns null.
  const explainSalt = await platform.handle(
    { verb: "explain", capabilityId: "pantry", parameters: { ingredientKey: "sea-salt" } },
    user,
  );
  assert(
    explainSalt.status === "gap",
    "trust: owner returns null knowledge → gap, never an invented description",
    explainSalt.status,
  );
  // The list result must NOT include the isDeleted flag (projection safety).
  const listCheck = await platform.handle(
    { verb: "read", capabilityId: "pantry", parameters: { scope: "list" } },
    user,
  );
  const firstItem = (listCheck.result as any)?.items?.[0];
  assert(
    firstItem && !Object.prototype.hasOwnProperty.call(firstItem, "isDeleted"),
    "trust: isDeleted flag is never surfaced in the pantry list projection",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT8 Pantry read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
