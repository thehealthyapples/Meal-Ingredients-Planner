/**
 * test-intelligence-household-binding.ts (INT13)
 * ==================================================
 * Verifies the SEVENTH live capability binding: the read-only Household capability. It
 * proves the reusable Port → Handler → Binding pattern (shown for the Planner in INT2,
 * Shopping in INT3, Nutrition / Knowledge in INT4, Pantry in INT8, Diary in INT10, Profile
 * in INT12) against a seventh, independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → household (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (HouseholdReadPort) that
 * stands in for storage + the household session resolver. The same handler in production
 * is injected with the real owner; the contract under test is identical.
 *
 * Covered: capability lookup (seven live capabilities), permission validation
 * (anonymous → denied; no household membership → honest gap, never denied or a
 * fabricated empty household), handler invocation + delegation for all three read scopes
 * (household / dietary-context / eaters), adult-eater enrichment from the caller's own
 * profile (mirrors server/routes.ts:8526–8541), child eaters left unchanged, missing/
 * unsupported scope, unsupported-intent handling, read-only enforcement (explain/add/
 * delete never execute), and trust rules (inviteCode never surfaced).
 *
 * Run with: npx tsx server/tests/test-intelligence-household-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createHouseholdReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type HouseholdReadPort,
} from "../intelligence/index.js";
import type { User, Household, HouseholdEaterRow } from "../../shared/schema.js";
import type { HouseholdDietaryContext } from "../storage.js";

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
// In-memory owner (stands in for storage + lib/household.ts). Household 10 has two
// adult members (user 1, user 2) and one child eater (no userId).
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<User>): User {
  return {
    id: 1,
    username: "colin",
    password: "hash",
    displayName: "Colin",
    firstName: "Colin",
    profilePhotoUrl: null,
    measurementPreference: "metric",
    preferredPriceTier: "standard",
    onboardingCompleted: true,
    starterMealsLoaded: true,
    isBetaUser: false,
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    dietPattern: null,
    dietRestrictions: [],
    eatingSchedule: "None",
    passwordResetToken: null,
    passwordResetExpires: null,
    role: "user",
    subscriptionTier: "free",
    subscriptionStatus: null,
    subscriptionExpiresAt: null,
    updatedAt: new Date("2026-06-30T12:00:00Z"),
    isDemo: false,
    demoExpiresAt: null,
    demoClaimedEmail: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    lastLoginAt: null,
    lastSeenAt: null,
    customMetricDefs: null,
    diaryExtraMetrics: null,
    ...overrides,
  };
}

const USER_1 = makeUser({ id: 1, username: "colin", displayName: "Colin", dietPattern: "Mediterranean", dietRestrictions: ["Gluten-Free"] });
const USER_2 = makeUser({ id: 2, username: "sam", displayName: "Sam", dietPattern: null, dietRestrictions: ["dairy"] });

const HOUSEHOLD_10: Household = {
  id: 10,
  name: "The Apples",
  inviteCode: "SECRET-JOIN-CODE",
  createdByUserId: 1,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

const MEMBERS_10 = [
  {
    member: { id: 1, householdId: 10, userId: 1, role: "owner", status: "active", joinedAt: new Date(), invitedByUserId: null, leftAt: null },
    user: { id: 1, displayName: "Colin", username: "colin" },
  },
  {
    member: { id: 2, householdId: 10, userId: 2, role: "member", status: "active", joinedAt: new Date(), invitedByUserId: 1, leftAt: null },
    user: { id: 2, displayName: "Sam", username: "sam" },
  },
];

const DIETARY_CONTEXT_10: HouseholdDietaryContext = {
  members: [
    { userId: 1, displayName: "Colin", dietTypes: ["Mediterranean"], dietRestrictions: [], excludedIngredients: ["peanuts"] },
    { userId: 2, displayName: "Sam", dietTypes: [], dietRestrictions: [], excludedIngredients: [] },
  ],
  aggregated: {
    unionDietTypes: ["Mediterranean"],
    unionRestrictions: [],
    unionExclusions: ["peanuts"],
  },
};

const EATERS_10: HouseholdEaterRow[] = [
  { id: 100, householdId: 10, displayName: "Colin", userId: 1, defaultDietTypes: [], hardRestrictions: [] },
  { id: 101, householdId: 10, displayName: "Sam", userId: 2, defaultDietTypes: [], hardRestrictions: [] },
  { id: 102, householdId: 10, displayName: "Toby", userId: null, defaultDietTypes: ["vegetarian"], hardRestrictions: ["nuts"] },
];

const calls: string[] = [];

function makePort(): HouseholdReadPort {
  return {
    getHouseholdForUser: async (userId) => {
      calls.push(`getHouseholdForUser(${userId})`);
      if (userId === 1 || userId === 2) return 10;
      throw new Error(`User ${userId} has no active household membership.`);
    },
    getHouseholdWithMembers: async (householdId) => {
      calls.push(`getHouseholdWithMembers(${householdId})`);
      if (householdId !== 10) throw new Error("Household not found");
      return { household: HOUSEHOLD_10, members: MEMBERS_10 };
    },
    getHouseholdDietaryContext: async (userId) => {
      calls.push(`getHouseholdDietaryContext(${userId})`);
      return DIETARY_CONTEXT_10;
    },
    getHouseholdEaters: async (householdId) => {
      calls.push(`getHouseholdEaters(${householdId})`);
      return householdId === 10 ? EATERS_10 : [];
    },
    getUser: async (userId) => {
      calls.push(`getUser(${userId})`);
      if (userId === 1) return USER_1;
      if (userId === 2) return USER_2;
      return undefined;
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const user2: IntelligenceContext = { role: "user", userId: "2", premium: false };
const userNoHousehold: IntelligenceContext = { role: "user", userId: "99", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeHousehold(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("household", createHouseholdReadHandler(async () => makePort()), ["read"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Household is the seventh live capability");
  assert(
    intelligencePlatform.getCapability("household")!.availability === "available",
    "canonical singleton: household capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("household")!.availability,
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
    intelligencePlatform.getCapability("household")!.executableIntents.includes("read"),
    "executableIntents declares read (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("household")!.executableIntents.includes("explain") &&
      !intelligencePlatform.getCapability("household")!.executableIntents.includes("add") &&
      !intelligencePlatform.getCapability("household")!.executableIntents.includes("delete"),
    "explain / add / delete are NOT in executableIntents (no live code path — INT6A)",
  );

  const platform = platformWithFakeHousehold();
  assert(
    platform.getCapability("household")!.availability === "available",
    "test platform: household bound → available",
  );

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous → denied");
  const anonRead = await platform.handle(
    { verb: "read", capabilityId: "household", parameters: { scope: "household" } },
    anon,
  );
  assert(anonRead.status === "denied", "anonymous read → denied (no authenticated user)", anonRead.status);
  assert(
    /authenticated user/.test(anonRead.message ?? ""),
    "denial message cites authentication requirement",
  );

  // -------------------------------------------------------------------------
  section("Honest gap — caller has no household membership (never denied, never fabricated)");
  const noHousehold = await platform.handle(
    { verb: "read", capabilityId: "household", parameters: { scope: "household" } },
    userNoHousehold,
  );
  assert(
    noHousehold.status === "gap",
    "no active household membership → honest gap, not denied",
    noHousehold.status,
  );
  assert(
    /will not fabricate a household/.test(noHousehold.message ?? ""),
    "gap message refuses to fabricate a household",
  );

  // -------------------------------------------------------------------------
  section("Read scope: household — id, name, myRole, members (no inviteCode)");
  calls.length = 0;
  const householdRead = await platform.handle(
    { verb: "read", capabilityId: "household", parameters: { scope: "household" } },
    user1,
  );
  assert(householdRead.status === "ok", "read scope=household → ok", householdRead.status);
  const hh = householdRead.result as any;
  assert(hh?.scope === "household", "result scope is 'household'");
  assert(hh?.id === 10, "household.id surfaced from owner", String(hh?.id));
  assert(hh?.name === "The Apples", "household.name surfaced from owner");
  assert(hh?.myRole === "owner", "myRole resolved to the caller's own membership row (user 1 = owner)", String(hh?.myRole));
  assert(Array.isArray(hh?.members) && hh.members.length === 2, "members array has both active members");
  assert(
    hh.members.some((m: any) => m.userId === 1 && m.role === "owner") &&
      hh.members.some((m: any) => m.userId === 2 && m.role === "member"),
    "member rows carry userId, displayName, role, status from the owner",
  );
  assert(
    !Object.prototype.hasOwnProperty.call(hh, "inviteCode"),
    "trust: inviteCode (join secret) is never surfaced — resolved OPEN DECISION from the Capability Card",
  );
  assert(
    calls.includes("getHouseholdForUser(1)") && calls.includes("getHouseholdWithMembers(10)"),
    "delegated to the household owner — getHouseholdForUser + getHouseholdWithMembers called",
  );

  const householdReadUser2 = await platform.handle(
    { verb: "read", capabilityId: "household", parameters: { scope: "household" } },
    user2,
  );
  const hh2 = householdReadUser2.result as any;
  assert(hh2?.myRole === "member", "myRole resolves per-caller (user 2 = member)", String(hh2?.myRole));

  // -------------------------------------------------------------------------
  section("Read scope: dietary-context — delegated, not recomputed");
  calls.length = 0;
  const dietaryRead = await platform.handle(
    { verb: "read", capabilityId: "household", parameters: { scope: "dietary-context" } },
    user1,
  );
  assert(dietaryRead.status === "ok", "read scope=dietary-context → ok", dietaryRead.status);
  const dc = dietaryRead.result as any;
  assert(dc?.scope === "dietary-context", "result scope is 'dietary-context'");
  assert(
    JSON.stringify(dc?.aggregated) === JSON.stringify(DIETARY_CONTEXT_10.aggregated),
    "aggregated diet context is the owner's value, unmodified (no recomputation in the handler)",
  );
  assert(
    JSON.stringify(dc?.members) === JSON.stringify(DIETARY_CONTEXT_10.members),
    "per-member diet context is the owner's value, unmodified",
  );
  assert(calls.includes("getHouseholdDietaryContext(1)"), "delegated to the household owner — getHouseholdDietaryContext called");

  // -------------------------------------------------------------------------
  section("Read scope: eaters — adult enrichment from profile, children unchanged");
  calls.length = 0;
  const eatersRead = await platform.handle(
    { verb: "read", capabilityId: "household", parameters: { scope: "eaters" } },
    user1,
  );
  assert(eatersRead.status === "ok", "read scope=eaters → ok", eatersRead.status);
  const er = eatersRead.result as any;
  assert(er?.scope === "eaters", "result scope is 'eaters'");
  assert(Array.isArray(er?.eaters) && er.eaters.length === 3, "all three stored eater rows are surfaced");

  const colinEater = er.eaters.find((e: any) => e.displayName === "Colin");
  assert(colinEater?.kind === "user", "adult eater kind === 'user'");
  assert(
    JSON.stringify(colinEater?.defaultDietTypes) === JSON.stringify(["mediterranean"]),
    "adult eater (user 1) enriched from users.dietPattern via the diet-pattern map (mirrors server/routes.ts:8526-8541)",
    JSON.stringify(colinEater?.defaultDietTypes),
  );
  assert(
    JSON.stringify(colinEater?.hardRestrictions) === JSON.stringify(["Gluten-Free"]),
    "adult eater (user 1) enriched from users.dietRestrictions",
  );

  const samEater = er.eaters.find((e: any) => e.displayName === "Sam");
  assert(
    JSON.stringify(samEater?.defaultDietTypes) === JSON.stringify([]),
    "adult eater with no stored dietPattern → empty defaultDietTypes, never fabricated",
  );
  assert(
    JSON.stringify(samEater?.hardRestrictions) === JSON.stringify(["dairy"]),
    "adult eater (user 2) hardRestrictions enriched from users.dietRestrictions",
  );

  const tobyEater = er.eaters.find((e: any) => e.displayName === "Toby");
  assert(tobyEater?.kind === "child", "child eater (no userId) kind === 'child'");
  assert(tobyEater?.userId === undefined, "child eater has no userId");
  assert(
    JSON.stringify(tobyEater?.defaultDietTypes) === JSON.stringify(["vegetarian"]) &&
      JSON.stringify(tobyEater?.hardRestrictions) === JSON.stringify(["nuts"]),
    "child eater's stored values are surfaced unchanged (no profile enrichment attempted)",
  );
  assert(
    calls.includes("getUser(1)") && calls.includes("getUser(2)"),
    "delegated to the profile owner for each adult eater — getUser called",
  );
  assert(
    !calls.some((c) => c.startsWith("getUser(undefined") || c.startsWith("getUser(null")),
    "no getUser call attempted for the child eater (no userId)",
  );

  // -------------------------------------------------------------------------
  section("Honest gaps — missing scope, unsupported scope");
  const noScope = await platform.handle({ verb: "read", capabilityId: "household", parameters: {} }, user1);
  assert(noScope.status === "gap", "read with no scope → honest gap", noScope.status);
  assert(/Supported read scopes/.test(noScope.message ?? ""), "gap message lists the supported scopes");

  const badScope = await platform.handle(
    { verb: "read", capabilityId: "household", parameters: { scope: "members" } },
    user1,
  );
  assert(badScope.status === "gap", "read with unsupported scope → honest gap", badScope.status);
  assert(/scope/.test(badScope.message ?? ""), "gap message mentions the unsupported scope");

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the household allow-list");
  const searchIntent = await platform.handle({ verb: "search", capabilityId: "household", parameters: {} }, user1);
  assert(searchIntent.status === "unsupported_intent", "search not in household allow-list → unsupported_intent", searchIntent.status);

  const shareIntent = await platform.handle({ verb: "share", capabilityId: "household", parameters: {} }, user1);
  assert(shareIntent.status === "unsupported_intent", "share not in household allow-list → unsupported_intent", shareIntent.status);

  // -------------------------------------------------------------------------
  section("Read-only enforcement — explain/add/delete never execute");
  const explain = await platform.handle(
    { verb: "explain", capabilityId: "household", parameters: {} },
    user1,
    { confirmed: true },
  );
  assert(explain.status === "gap", "explain → honest gap: no stored rationale on membership/eater records", explain.status);
  assert(
    /Household is bound to the Intelligence Platform read-only/.test(explain.message ?? ""),
    "gap message states the binding is read-only",
  );

  const addUnconfirmed = await platform.handle(
    { verb: "add", capabilityId: "household", parameters: { displayName: "New eater" } },
    user1,
  );
  assert(
    addUnconfirmed.status === "confirmation_required",
    "add (unconfirmed) → confirmation_required (never reaches handler)",
    addUnconfirmed.status,
  );
  const addConfirmed = await platform.handle(
    { verb: "add", capabilityId: "household", parameters: { displayName: "New eater" } },
    user1,
    { confirmed: true },
  );
  assert(addConfirmed.status === "gap", "add (confirmed) → honest gap: write not bound (read-only binding)", addConfirmed.status);

  const deleteUnconfirmed = await platform.handle(
    { verb: "delete", capabilityId: "household", parameters: { memberId: 2 } },
    user1,
  );
  assert(
    deleteUnconfirmed.status === "confirmation_required",
    "delete (unconfirmed) → confirmation_required (strong tier — never reaches handler)",
    deleteUnconfirmed.status,
  );
  const deleteConfirmed = await platform.handle(
    { verb: "delete", capabilityId: "household", parameters: { memberId: 2 } },
    user1,
    { confirmed: true },
  );
  assert(deleteConfirmed.status === "gap", "delete (confirmed) → honest gap: write not bound (read-only binding)", deleteConfirmed.status);

  // Read verbs must never require confirmation.
  const readOk = await platform.handle(
    { verb: "read", capabilityId: "household", parameters: { scope: "household" } },
    user1,
  );
  assert(
    readOk.confirmation === "none" || readOk.confirmation === undefined,
    "read-only verbs never require confirmation (no write path)",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT13 Household read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
