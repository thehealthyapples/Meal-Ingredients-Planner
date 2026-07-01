/**
 * test-intelligence-templates-binding.ts (INT16)
 * ==================================================
 * Verifies the TENTH live capability binding: the read-only Templates capability. It
 * proves the reusable Port → Handler → Binding pattern (shown for the Planner in INT2,
 * Shopping in INT3, Nutrition / Knowledge in INT4, Pantry in INT8, Diary in INT10,
 * Profile in INT12, Household in INT13, Partners in INT14, Meals in INT15) against a
 * tenth, independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → templates (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (TemplatesReadPort) that
 * stands in for storage. The same handler in production is injected with the real
 * owner; the contract under test is identical.
 *
 * Covered: capability lookup (ten live capabilities), permission validation (public
 * scopes allow anonymous reads; own-data scopes deny anonymous), six read scopes
 * (meal-templates / meal-template / plan-templates / plan-templates-mine /
 * plan-templates-default / plan-template), tier resolved from context.premium and NEVER
 * from a request parameter, the plan-template detail gate (published-global ok, own
 * draft ok, foreign draft denied, admin override ok), missing/unsupported scope,
 * unsupported-intent handling, read-only enforcement (explain/search/recommend never
 * execute), and the trust rule that shareToken is never surfaced.
 *
 * Run with: npx tsx server/tests/test-intelligence-templates-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createTemplatesReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type TemplatesReadPort,
} from "../intelligence/index.js";
import type { MealTemplate, MealPlanTemplate, MealPlanTemplateItem } from "../../shared/schema.js";

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
// In-memory owner (stands in for storage.ts).
//
// Meal-shell templates: TEMPLATE_SHELL_1 (public, no ownership concept).
// Plan templates: GLOBAL_FREE (published, global, free tier), GLOBAL_PREMIUM
// (published, global, premium-only), USER1_PRIVATE (owned by user 1, draft),
// USER2_PRIVATE (owned by user 2, draft), DEFAULT_TEMPLATE (isDefault, published).
// ---------------------------------------------------------------------------

function makeMealTemplate(overrides: Partial<MealTemplate> & { id: number; name: string }): MealTemplate {
  return {
    category: "dinner",
    description: null,
    imageUrl: null,
    defaultCalories: null,
    defaultProtein: null,
    defaultCarbs: null,
    defaultFat: null,
    title: null,
    cuisine: null,
    sharedBaseComponents: null,
    proteinSlots: null,
    carbSlots: null,
    vegSlots: null,
    toppingSlots: null,
    sauceSlots: null,
    compatibleDiets: null,
    estimatedTotalTime: null,
    estimatedExtraTimePerVariant: null,
    costBand: null,
    isActive: true,
    primarySlot: null,
    suitableSlots: [],
    energyBand: null,
    styleTags: [],
    nutritionOpportunities: [],
    ...overrides,
  };
}

function makePlanTemplate(
  overrides: Partial<MealPlanTemplate> & { id: string; name: string; ownerUserId: number | null; status: string },
): MealPlanTemplate {
  return {
    description: null,
    isDefault: false,
    isPremium: false,
    season: null,
    createdBy: null,
    publishedAt: null,
    shareToken: "SECRET-SHARE-TOKEN-MUST-NEVER-LEAK",
    visibility: "private",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

const TEMPLATE_SHELL_1 = makeMealTemplate({ id: 1, name: "Taco Base" });

const GLOBAL_FREE = makePlanTemplate({ id: "global-free", name: "Family Favourites", ownerUserId: null, status: "published", visibility: "public" });
const GLOBAL_PREMIUM = makePlanTemplate({ id: "global-premium", name: "Premium Plan", ownerUserId: null, status: "published", isPremium: true, visibility: "public" });
const USER1_PRIVATE = makePlanTemplate({ id: "user1-private", name: "Colin's Plan", ownerUserId: 1, status: "draft" });
const USER2_PRIVATE = makePlanTemplate({ id: "user2-private", name: "Sam's Plan", ownerUserId: 2, status: "draft" });
const DEFAULT_TEMPLATE = makePlanTemplate({ id: "default-1", name: "Default Starter Week", ownerUserId: null, status: "published", isDefault: true, visibility: "public" });

const ITEMS_USER1: MealPlanTemplateItem[] = [
  { id: "item-1", templateId: "user1-private", weekNumber: 1, dayOfWeek: 1, mealSlot: "dinner", mealId: 100, createdAt: new Date() },
];
const ITEMS_DEFAULT: MealPlanTemplateItem[] = [
  { id: "item-2", templateId: "default-1", weekNumber: 1, dayOfWeek: 1, mealSlot: "breakfast", mealId: 200, createdAt: new Date() },
];

const PLAN_TEMPLATES: Record<string, MealPlanTemplate> = {
  "global-free": GLOBAL_FREE,
  "global-premium": GLOBAL_PREMIUM,
  "user1-private": USER1_PRIVATE,
  "user2-private": USER2_PRIVATE,
  "default-1": DEFAULT_TEMPLATE,
};

const PLAN_TEMPLATE_ITEMS: Record<string, MealPlanTemplateItem[]> = {
  "user1-private": ITEMS_USER1,
  "default-1": ITEMS_DEFAULT,
};

const calls: string[] = [];

function makePort(): TemplatesReadPort {
  return {
    getMealTemplates: async () => {
      calls.push("getMealTemplates()");
      return [TEMPLATE_SHELL_1];
    },
    getMealTemplate: async (id) => {
      calls.push(`getMealTemplate(${id})`);
      return id === 1 ? TEMPLATE_SHELL_1 : undefined;
    },
    getPublishedGlobalTemplates: async (tier) => {
      calls.push(`getPublishedGlobalTemplates(${tier})`);
      const rows = tier === "premium" ? [GLOBAL_FREE, GLOBAL_PREMIUM] : [GLOBAL_FREE];
      return rows.map((t) => ({ ...t, itemCount: 3 }));
    },
    getUserPrivateTemplates: async (userId) => {
      calls.push(`getUserPrivateTemplates(${userId})`);
      const rows = Object.values(PLAN_TEMPLATES).filter((t) => t.ownerUserId === userId);
      return rows.map((t) => ({ ...t, itemCount: 1 }));
    },
    getTemplateWithItems: async (id) => {
      calls.push(`getTemplateWithItems(${id})`);
      const t = PLAN_TEMPLATES[id];
      if (!t) return undefined;
      return { ...t, items: PLAN_TEMPLATE_ITEMS[id] ?? [] };
    },
    getDefaultTemplate: async () => {
      calls.push("getDefaultTemplate()");
      return { ...DEFAULT_TEMPLATE, items: ITEMS_DEFAULT };
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const user1Premium: IntelligenceContext = { role: "user", userId: "1", premium: true };
const user2: IntelligenceContext = { role: "user", userId: "2", premium: false };
const admin: IntelligenceContext = { role: "admin", userId: "99", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeTemplates(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("templates", createTemplatesReadHandler(async () => makePort()), ["read"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Templates is the tenth live capability");
  assert(
    intelligencePlatform.getCapability("templates")!.availability === "available",
    "canonical singleton: templates capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("templates")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 13,
    "exactly THIRTEEN capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery) — scope lock (updated by INT27)",
    String(live.length),
  );
  assert(live.some((c) => c.id === "templates"), "templates is among the live capabilities");
  assert(
    intelligencePlatform.getCapability("templates")!.executableIntents.includes("read"),
    "executableIntents declares read (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("templates")!.executableIntents.includes("explain") &&
      !intelligencePlatform.getCapability("templates")!.executableIntents.includes("search") &&
      !intelligencePlatform.getCapability("templates")!.executableIntents.includes("recommend"),
    "explain / search / recommend are NOT in executableIntents (no safe grounded owner — INT6A)",
  );

  const platform = platformWithFakeTemplates();
  assert(platform.getCapability("templates")!.availability === "available", "test platform: templates bound → available");

  // -------------------------------------------------------------------------
  section("Permission validation — public scopes allow anonymous reads");
  const anonMealTemplates = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "meal-templates" } },
    anon,
  );
  assert(anonMealTemplates.status === "ok", "anonymous read of meal-templates (public reference data) → ok", anonMealTemplates.status);

  const anonDefault = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates-default" } },
    anon,
  );
  assert(anonDefault.status === "ok", "anonymous read of plan-templates-default → ok (public)", anonDefault.status);

  const anonGlobalDetail = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-template", planTemplateId: "global-free" } },
    anon,
  );
  assert(anonGlobalDetail.status === "ok", "anonymous read of a published-global plan-template → ok", anonGlobalDetail.status);

  section("Permission validation — own-data scopes deny anonymous reads");
  const anonLibrary = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates" } },
    anon,
  );
  assert(anonLibrary.status === "denied", "anonymous read of plan-templates (library) → denied", anonLibrary.status);
  assert(/authenticated user/.test(anonLibrary.message ?? ""), "denial message cites authentication requirement");

  const anonMine = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates-mine" } },
    anon,
  );
  assert(anonMine.status === "denied", "anonymous read of plan-templates-mine → denied", anonMine.status);

  // -------------------------------------------------------------------------
  section("Read scope: meal-templates — public shell-template list");
  calls.length = 0;
  const shellList = await platform.handle({ verb: "read", capabilityId: "templates", parameters: { scope: "meal-templates" } }, user1);
  assert(shellList.status === "ok", "read scope=meal-templates → ok", shellList.status);
  const sl = shellList.result as any;
  assert(sl?.scope === "meal-templates", "result scope is 'meal-templates'");
  assert(sl?.templateCount === 1 && sl.templates[0].name === "Taco Base", "list surfaces the shell template, unmodified");
  assert(calls.includes("getMealTemplates()"), "delegated to the templates owner — getMealTemplates called");

  section("Read scope: meal-template — detail by id");
  const shellDetail = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "meal-template", mealTemplateId: 1 } },
    user1,
  );
  assert(shellDetail.status === "ok", "read scope=meal-template (known id) → ok", shellDetail.status);
  assert((shellDetail.result as any)?.template?.id === 1, "detail surfaces the requested shell template");

  const shellDetailMissing = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "meal-template", mealTemplateId: 999 } },
    user1,
  );
  assert(shellDetailMissing.status === "gap", "unknown mealTemplateId → honest gap", shellDetailMissing.status);

  const shellDetailNoId = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "meal-template" } },
    user1,
  );
  assert(shellDetailNoId.status === "gap", "meal-template with no mealTemplateId → honest gap", shellDetailNoId.status);
  assert(/mealTemplateId/.test(shellDetailNoId.message ?? ""), "gap message names the missing mealTemplateId parameter");

  // -------------------------------------------------------------------------
  section("Read scope: plan-templates (library) — tier resolved server-side, never from params");
  calls.length = 0;
  const libraryFree = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates" } },
    user1,
  );
  assert(libraryFree.status === "ok", "read scope=plan-templates (free user) → ok", libraryFree.status);
  const lf = libraryFree.result as any;
  assert(lf?.scope === "plan-templates", "result scope is 'plan-templates'");
  assert(
    lf.globalTemplates.length === 1 && lf.globalTemplates[0].id === "global-free",
    "free-tier caller sees only the free-tier global template",
  );
  assert(calls.includes("getPublishedGlobalTemplates(free)"), "tier resolved to 'free' from context.premium=false");

  // A non-premium caller cannot escalate to the premium catalogue via a spoofed parameter.
  const librarySpoofed = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates", tier: "premium" } },
    user1,
  );
  const lfSpoofed = librarySpoofed.result as any;
  assert(
    lfSpoofed.globalTemplates.length === 1 && lfSpoofed.globalTemplates[0].id === "global-free",
    "a client-supplied { tier: 'premium' } parameter is IGNORED — tier always comes from context.premium",
  );

  calls.length = 0;
  const libraryPremium = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates" } },
    user1Premium,
  );
  const lp = libraryPremium.result as any;
  assert(lp.globalTemplates.length === 2, "premium caller (context.premium=true) sees the premium global template too");
  assert(calls.includes("getPublishedGlobalTemplates(premium)"), "tier resolved to 'premium' from context.premium=true");
  assert(
    lf.myTemplates.length === 1 && lf.myTemplates[0].id === "user1-private",
    "library also surfaces the caller's own private templates",
  );

  // -------------------------------------------------------------------------
  section("Read scope: plan-templates-mine — own private templates only");
  const mine1 = await platform.handle({ verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates-mine" } }, user1);
  assert(mine1.status === "ok", "read scope=plan-templates-mine → ok", mine1.status);
  const m1 = mine1.result as any;
  assert(
    m1.templates.length === 1 && m1.templates[0].id === "user1-private",
    "plan-templates-mine surfaces only the caller's own templates",
  );

  const mine2 = await platform.handle({ verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates-mine" } }, user2);
  assert(
    (mine2.result as any).templates[0]?.id === "user2-private",
    "scoping is per-caller — user 2 sees their own template, not user 1's",
  );

  // -------------------------------------------------------------------------
  section("Read scope: plan-templates-default — public default template + items");
  const defaultRead = await platform.handle({ verb: "read", capabilityId: "templates", parameters: { scope: "plan-templates-default" } }, anon);
  assert(defaultRead.status === "ok", "read scope=plan-templates-default → ok", defaultRead.status);
  const dr = defaultRead.result as any;
  assert(dr?.template?.id === "default-1", "default template surfaced");
  assert(Array.isArray(dr?.template?.items) && dr.template.items.length === 1, "default template includes its items");

  // -------------------------------------------------------------------------
  section("Read scope: plan-template — the detail gate (published-global / own / admin)");
  const detailGlobal = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-template", planTemplateId: "global-free" } },
    user2,
  );
  assert(detailGlobal.status === "ok", "any caller can read a published-global plan template", detailGlobal.status);

  const detailOwn = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-template", planTemplateId: "user1-private" } },
    user1,
  );
  assert(detailOwn.status === "ok", "owner can read their own draft plan template", detailOwn.status);

  const detailForeign = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-template", planTemplateId: "user2-private" } },
    user1,
  );
  assert(
    detailForeign.status === "denied",
    "user 1 reading user 2's DRAFT plan template → denied (STRICTER than the existing under-gated route)",
    detailForeign.status,
  );

  const detailForeignAnon = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-template", planTemplateId: "user2-private" } },
    anon,
  );
  assert(detailForeignAnon.status === "denied", "an anonymous caller reading a private draft → denied", detailForeignAnon.status);

  const detailAdmin = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-template", planTemplateId: "user2-private" } },
    admin,
  );
  assert(detailAdmin.status === "ok", "an admin caller CAN read another user's draft plan template", detailAdmin.status);

  const detailUnknown = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-template", planTemplateId: "no-such-id" } },
    user1,
  );
  assert(detailUnknown.status === "gap", "unknown planTemplateId → honest gap (not denied)", detailUnknown.status);

  const detailNoId = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "plan-template" } },
    user1,
  );
  assert(detailNoId.status === "gap", "plan-template with no planTemplateId → honest gap", detailNoId.status);
  assert(/planTemplateId/.test(detailNoId.message ?? ""), "gap message names the missing planTemplateId parameter");

  // -------------------------------------------------------------------------
  section("Honest gaps — missing scope, unsupported scope");
  const noScope = await platform.handle({ verb: "read", capabilityId: "templates", parameters: {} }, user1);
  assert(noScope.status === "gap", "read with no scope → honest gap", noScope.status);
  assert(/Supported scopes/.test(noScope.message ?? ""), "gap message lists the supported scopes");

  const badScope = await platform.handle(
    { verb: "read", capabilityId: "templates", parameters: { scope: "shopping-list" } },
    user1,
  );
  assert(badScope.status === "gap", "read with unsupported scope → honest gap", badScope.status);

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the templates allow-list");
  const importIntent = await platform.handle({ verb: "import", capabilityId: "templates", parameters: {} }, user1, { confirmed: true });
  assert(importIntent.status === "gap", "import (confirmed) → honest gap: write not bound (read-only binding)", importIntent.status);

  const reviewIntent = await platform.handle({ verb: "review", capabilityId: "templates", parameters: {} }, user1);
  assert(reviewIntent.status === "unsupported_intent", "review not in templates allow-list → unsupported_intent", reviewIntent.status);

  // -------------------------------------------------------------------------
  section("Read-only enforcement — explain/search/recommend never execute");
  const explain = await platform.handle({ verb: "explain", capabilityId: "templates", parameters: {} }, user1);
  assert(explain.status === "gap", "explain → honest gap: no stored rationale on a template", explain.status);
  assert(/Templates is bound to the Intelligence Platform read-only/.test(explain.message ?? ""), "gap message states the binding is read-only");

  const search = await platform.handle({ verb: "search", capabilityId: "templates", parameters: { query: "taco" } }, user1);
  assert(search.status === "gap", "search → honest gap: no search-by-name/tag method exists on the owner", search.status);

  const recommend = await platform.handle({ verb: "recommend", capabilityId: "templates", parameters: {} }, user1);
  assert(recommend.status === "gap", "recommend → honest gap: no delegate-only owner ranking method", recommend.status);

  const generateUnconfirmed = await platform.handle({ verb: "generate", capabilityId: "templates", parameters: {} }, user1);
  assert(
    generateUnconfirmed.status === "confirmation_required",
    "generate (unconfirmed) → confirmation_required (never reaches handler)",
    generateUnconfirmed.status,
  );
  const generateConfirmed = await platform.handle({ verb: "generate", capabilityId: "templates", parameters: {} }, user1, { confirmed: true });
  assert(generateConfirmed.status === "gap", "generate (confirmed) → honest gap: write not bound (read-only binding)", generateConfirmed.status);

  const readOk = await platform.handle({ verb: "read", capabilityId: "templates", parameters: { scope: "meal-templates" } }, user1);
  assert(
    readOk.confirmation === "none" || readOk.confirmation === undefined,
    "read-only verbs never require confirmation (no write path)",
  );

  // -------------------------------------------------------------------------
  section("Trust rule — shareToken is never surfaced");
  assert(
    !Object.prototype.hasOwnProperty.call(dr.template, "shareToken") &&
      !Object.prototype.hasOwnProperty.call(lf.globalTemplates[0], "shareToken") &&
      !Object.prototype.hasOwnProperty.call(m1.templates[0], "shareToken") &&
      !Object.prototype.hasOwnProperty.call((detailOwn.result as any).template, "shareToken"),
    "no result shape (library / mine / default / detail) carries shareToken — a join secret, never surfaced",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT16 Templates read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
