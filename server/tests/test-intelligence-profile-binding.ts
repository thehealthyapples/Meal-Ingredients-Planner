/**
 * test-intelligence-profile-binding.ts (INT12)
 * ==============================================
 * Verifies the SIXTH live capability binding: the read-only Profile capability. It
 * proves the reusable Port → Handler → Binding pattern (shown for the Planner in INT2,
 * Shopping in INT3, Nutrition / Knowledge in INT4, Pantry in INT8, Diary in INT10)
 * against a sixth, independent owner, end-to-end —
 *
 *   intent → capability registry → permission check → profile (owner) → response
 *
 * — WITHOUT a live database, by injecting an in-memory owner (ProfileReadPort) that
 * stands in for storage. The same handler in production is injected with the real owner;
 * the contract under test is identical.
 *
 * Covered: capability lookup (six live capabilities), permission validation (auth-only,
 * no id parameter so cross-user reads have no code path), handler invocation, profile
 * + preferences delegation, no-preferences-row → null (not a fabricated default),
 * unsupported scope (including the household-eaters redirect), unsupported intent
 * handling, read-only enforcement (explain/add never execute), and trust rules
 * (password / token fields never surfaced).
 *
 * Run with: npx tsx server/tests/test-intelligence-profile-binding.ts
 */

import {
  IntelligencePlatform,
  CapabilityRegistry,
  createProfileReadHandler,
  intelligencePlatform,
  type IntelligenceContext,
  type ProfileReadPort,
} from "../intelligence/index.js";
import type { User, UserPreferences } from "../../shared/schema.js";

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
// In-memory owner (stands in for storage). Both methods are user-scoped; the
// in-memory version mimics that by returning data keyed to userId 1 only.
// ---------------------------------------------------------------------------

const USER_1: User = {
  id: 1,
  username: "colin",
  password: "super-secret-hash",
  displayName: "Colin",
  firstName: "Colin",
  profilePhotoUrl: "https://example.com/photo.jpg",
  measurementPreference: "metric",
  preferredPriceTier: "standard",
  onboardingCompleted: true,
  starterMealsLoaded: true,
  isBetaUser: false,
  emailVerified: true,
  emailVerificationToken: "verify-token-should-never-leak",
  emailVerificationExpires: null,
  eatingSchedule: "None",
  passwordResetToken: "reset-token-should-never-leak",
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
  lastLoginAt: new Date("2026-06-29T08:00:00Z"),
  lastSeenAt: new Date("2026-06-30T07:00:00Z"),
  customMetricDefs: [{ id: "m1", name: "Hydration", unit: "L" }],
  diaryExtraMetrics: ["hydration"],
};

const PREFS_1: UserPreferences = {
  id: 1,
  userId: 1,
  dietTypes: ["Mediterranean"],
  excludedIngredients: ["peanuts"],
  healthGoals: ["weight-loss"],
  budgetLevel: "standard",
  preferredStores: ["Tesco"],
  upfSensitivity: "moderate",
  qualityPreference: "standard",
  calorieTarget: 2000,
  calorieMode: "manual",
  heightCm: 178,
  weightKg: 75,
  activityLevel: "moderate",
  goalType: "maintain",
  adultsCount: 2,
  childrenCount: 1,
  babiesCount: 0,
  soundEnabled: true,
  eliteTrackingEnabled: true,
  healthTrendEnabled: true,
  barcodeScannerEnabled: true,
  plannerShowCalories: true,
  plannerEnableBabyMeals: false,
  plannerEnableChildMeals: true,
  plannerEnableDrinks: false,
  preferredIngredients: ["olive oil"],
  maxPrepTolerance: 15,
  mealMode: "exact",
  maxExtraPrepMinutes: 10,
  maxTotalCookTime: 45,
  preferLessProcessed: true,
  includeRegulatoryAdditivesInScoring: true,
  mutedOpportunityTypes: [],
  companionPersonality: "companion",
};

// CONV1 P4 / OWN-1: a person's diet lives on their eater row, not the user row —
// the in-memory owner serves it through getPersonDiet, exactly as storage now does.
const DIET_1 = { dietPattern: "Mediterranean", dietTypes: ["mediterranean"], hardRestrictions: ["Gluten-Free"] };

const calls: string[] = [];

function makePort(): ProfileReadPort {
  return {
    getUser: async (userId) => {
      calls.push(`getUser(${userId})`);
      if (userId === 1) return USER_1;
      if (userId === 2) return { ...USER_1, id: 2, username: "no-prefs-user" };
      return undefined;
    },
    getUserPreferences: async (userId) => {
      calls.push(`getUserPreferences(${userId})`);
      if (userId === 1) return PREFS_1;
      return undefined;
    },
    getPersonDiet: async (userId) => {
      calls.push(`getPersonDiet(${userId})`);
      if (userId === 1) return DIET_1;
      return { dietPattern: null, dietTypes: [], hardRestrictions: [] };
    },
  };
}

const user1: IntelligenceContext = { role: "user", userId: "1", premium: false };
const user2NoPrefs: IntelligenceContext = { role: "user", userId: "2", premium: false };
const user99Missing: IntelligenceContext = { role: "user", userId: "99", premium: false };
const anon: IntelligenceContext = { role: "user", userId: undefined, premium: false };

function platformWithFakeProfile(): IntelligencePlatform {
  const p = new IntelligencePlatform(new CapabilityRegistry());
  p.registerHandler("profile", createProfileReadHandler(async () => makePort()), ["read"]);
  return p;
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("Capability lookup — Profile is the sixth live capability");
  assert(
    intelligencePlatform.getCapability("profile")!.availability === "available",
    "canonical singleton: profile capability is 'available' (handler bound)",
    intelligencePlatform.getCapability("profile")!.availability,
  );
  const live = intelligencePlatform.listCapabilities().filter((c) => c.availability === "available");
  assert(
    live.length === 22,
    "exactly TWENTY-TWO capabilities are live (planner + shopping + nutrition-knowledge + pantry + diary + profile + household + partners + meals + templates + analyser + meal-discovery + nutrition-discovery + planner-discovery + household-discovery + shopping-discovery + pantry-discovery + diary-discovery + food-intelligence + opportunity-delivery + evidence-learning + product-knowledge) — scope lock (updated by PHASE5A)",
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
    intelligencePlatform.getCapability("profile")!.executableIntents.includes("read"),
    "executableIntents declares read (truthful registry — INT6A)",
  );
  assert(
    !intelligencePlatform.getCapability("profile")!.executableIntents.includes("explain") &&
      !intelligencePlatform.getCapability("profile")!.executableIntents.includes("add"),
    "explain / add are NOT in executableIntents (no live code path — INT6A)",
  );

  const platform = platformWithFakeProfile();
  assert(
    platform.getCapability("profile")!.availability === "available",
    "test platform: profile bound → available",
  );

  // -------------------------------------------------------------------------
  section("Permission validation — anonymous → denied");
  const anonRead = await platform.handle({ verb: "read", capabilityId: "profile", parameters: {} }, anon);
  assert(anonRead.status === "denied", "anonymous read → denied (no authenticated user)", anonRead.status);
  assert(
    /authenticated user/.test(anonRead.message ?? ""),
    "denial message cites authentication requirement",
  );

  // -------------------------------------------------------------------------
  section("Handler invocation + delegation — own profile + preferences");
  calls.length = 0;
  const read = await platform.handle({ verb: "read", capabilityId: "profile", parameters: {} }, user1);
  assert(read.status === "ok", "read → ok", read.status);
  const r = read.result as any;
  assert(r?.scope === "profile", "result scope is 'profile'", String(r?.scope));
  assert(r?.profile?.id === 1, "profile.id matches the caller", String(r?.profile?.id));
  assert(r?.profile?.username === "colin", "profile.username surfaced from owner", String(r?.profile?.username));
  assert(r?.profile?.displayName === "Colin", "profile.displayName surfaced from owner");
  assert(r?.profile?.dietPattern === "Mediterranean", "profile.dietPattern surfaced from the canonical diet owner via getPersonDiet (CONV1 P4 / OWN-1)");
  assert(
    JSON.stringify(r?.profile?.dietRestrictions) === JSON.stringify(["Gluten-Free"]),
    "profile.dietRestrictions surfaced from the canonical diet owner via getPersonDiet",
  );
  assert(r?.profile?.role === "user", "profile.role surfaced from owner");
  assert(r?.profile?.subscriptionTier === "free", "profile.subscriptionTier surfaced from owner");
  assert(
    r?.profile?.customMetricDefs?.[0]?.name === "Hydration",
    "profile.customMetricDefs surfaced from owner",
  );
  assert(r?.preferences?.calorieTarget === 2000, "preferences.calorieTarget surfaced from owner");
  assert(r?.preferences?.heightCm === 178, "preferences.heightCm surfaced from owner");
  assert(r?.preferences?.adultsCount === 2, "preferences.adultsCount surfaced from owner");
  assert(
    r?.preferences?.includeRegulatoryAdditivesInScoring === true,
    "preferences.includeRegulatoryAdditivesInScoring surfaced from owner",
  );
  assert(
    calls.some((c) => c === "getUser(1)"),
    "delegated to the profile owner — getUser called",
  );
  assert(
    calls.some((c) => c === "getUserPreferences(1)"),
    "delegated to the profile owner — getUserPreferences called",
  );

  // -------------------------------------------------------------------------
  section("No stored preferences row — null, never a fabricated default");
  const noPrefs = await platform.handle({ verb: "read", capabilityId: "profile", parameters: {} }, user2NoPrefs);
  assert(noPrefs.status === "ok", "read for a user with no preferences row → still ok", noPrefs.status);
  const npr = noPrefs.result as any;
  assert(npr?.preferences === null, "preferences is null — never a fabricated default object", String(npr?.preferences));
  assert(npr?.profile?.id === 2, "profile still surfaced correctly", String(npr?.profile?.id));

  // -------------------------------------------------------------------------
  section("Honest gaps — no user row, unsupported scope");
  const noUser = await platform.handle({ verb: "read", capabilityId: "profile", parameters: {} }, user99Missing);
  assert(noUser.status === "gap", "read for an id with no stored user row → honest gap", noUser.status);
  assert(
    /will not fabricate a profile/.test(noUser.message ?? ""),
    "gap message refuses to fabricate a profile",
  );

  const badScope = await platform.handle(
    { verb: "read", capabilityId: "profile", parameters: { scope: "household-members" } },
    user1,
  );
  assert(badScope.status === "gap", "read with unsupported scope → honest gap", badScope.status);
  assert(/scope/.test(badScope.message ?? ""), "gap message mentions the unsupported scope");

  const householdEaters = await platform.handle(
    { verb: "read", capabilityId: "profile", parameters: { scope: "household-eaters" } },
    user1,
  );
  assert(
    householdEaters.status === "gap",
    "read for household eater overrides via profile → honest gap (belongs to household capability)",
    householdEaters.status,
  );
  assert(
    /Household capability/.test(householdEaters.message ?? ""),
    "gap message redirects to the Household capability",
  );

  // Explicit scope: "profile" is accepted (same result as omitting scope).
  const explicitScope = await platform.handle(
    { verb: "read", capabilityId: "profile", parameters: { scope: "profile" } },
    user1,
  );
  assert(explicitScope.status === "ok", 'explicit scope: "profile" → ok', explicitScope.status);

  // -------------------------------------------------------------------------
  section("Unsupported intent — verbs outside the allow-list");
  const shareIntent = await platform.handle({ verb: "share", capabilityId: "profile", parameters: {} }, user1);
  assert(shareIntent.status === "unsupported_intent", "share not in profile allow-list → unsupported_intent", shareIntent.status);

  const searchIntent = await platform.handle({ verb: "search", capabilityId: "profile", parameters: {} }, user1);
  assert(searchIntent.status === "unsupported_intent", "search not in profile allow-list → unsupported_intent", searchIntent.status);

  // -------------------------------------------------------------------------
  section("Read-only enforcement — explain/add never execute");
  const explain = await platform.handle({ verb: "explain", capabilityId: "profile", parameters: {} }, user1, { confirmed: true });
  assert(explain.status === "gap", "explain → honest gap: no stored rationale for any profile field", explain.status);
  assert(
    /Profile is bound to the Intelligence Platform read-only/.test(explain.message ?? ""),
    "gap message states the binding is read-only",
  );

  // 'add' is in the profile allow-list (capabilityClass: "write"), so the engine
  // intercepts it at the CONFIRM step before the handler runs (unconfirmed).
  const addUnconfirmed = await platform.handle(
    { verb: "add", capabilityId: "profile", parameters: { displayName: "New Name" } },
    user1,
  );
  assert(
    addUnconfirmed.status === "confirmation_required",
    "add (unconfirmed) → confirmation_required (never reaches handler)",
    addUnconfirmed.status,
  );

  const addConfirmed = await platform.handle(
    { verb: "add", capabilityId: "profile", parameters: { displayName: "New Name" } },
    user1,
    { confirmed: true },
  );
  assert(addConfirmed.status === "gap", "add (confirmed) → honest gap: write not bound (read-only binding)", addConfirmed.status);

  // Read verbs must never produce a confirmation tier.
  const readOk = await platform.handle({ verb: "read", capabilityId: "profile", parameters: {} }, user1);
  assert(
    readOk.confirmation === "none" || readOk.confirmation === undefined,
    "read-only verbs never require confirmation (no write path)",
  );

  // -------------------------------------------------------------------------
  section("Trust rules — sensitive fields never surfaced, no cross-user read path");
  const trustCheck = await platform.handle({ verb: "read", capabilityId: "profile", parameters: {} }, user1);
  const profile = (trustCheck.result as any)?.profile ?? {};
  const SENSITIVE_FIELDS = [
    "password",
    "emailVerificationToken",
    "emailVerificationExpires",
    "passwordResetToken",
    "passwordResetExpires",
    "demoClaimedEmail",
    "starterMealsLoaded",
    "updatedAt",
  ];
  for (const field of SENSITIVE_FIELDS) {
    assert(
      !Object.prototype.hasOwnProperty.call(profile, field),
      `trust: '${field}' is never surfaced in the profile projection`,
    );
  }
  const preferences = (trustCheck.result as any)?.preferences ?? {};
  assert(
    !Object.prototype.hasOwnProperty.call(preferences, "id") &&
      !Object.prototype.hasOwnProperty.call(preferences, "userId"),
    "trust: internal preferences row keys (id, userId) are never surfaced",
  );
  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`INT12 Profile read-only binding: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
