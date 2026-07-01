/**
 * Profile Read Handler (INT12 — sixth live capability binding)
 * ==============================================================
 * The SIXTH execution handler bound to the THA Intelligence Platform. It makes the
 * `profile` capability *executable* for READ-ONLY intents only, by delegating every
 * read to the existing Profile owner (storage) through a {@link ProfileReadPort}. It
 * proves the reusable Port → Handler → Binding pattern (first established for the
 * Planner in INT2) against a sixth, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only the "read" verb executes. "explain" (no stored rationale for any
 *     profile field) and "add" (a write) both fall through `readOnlyVerbGuard` and
 *     return an honest gap — there is NO code path here that changes any profile field
 *     or preference.
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO profile business rule and, critically, NO recomputation of the
 *     derived fields the route layer computes inline (BMI, calculated calories,
 *     `hasPremiumAccess`) — those are route-layer composition, not owner reads, so they
 *     are out of scope for a delegation-only binding (see SCOPE LOCK in the
 *     implementation report). Profile (storage) remains the owner (Principles 2 & 7).
 *   • EXPLICIT ALLOWLIST, NOT A RAW FORWARD. `storage.getUser()` returns the full users
 *     row, including `password`, `emailVerificationToken`, `emailVerificationExpires`,
 *     `passwordResetToken`, and `passwordResetExpires`. The handler projects an explicit
 *     allowlist (mirroring `buildProfileResponse`'s field list in `server/routes.ts`) —
 *     it never forwards the raw row.
 *   • PERMISSION-AWARE / OWN DATA ONLY. The caller must be an authenticated user; both
 *     reads are scoped to that user's own row by the owner getters. Cross-user reads
 *     are impossible by construction — there is no id parameter on this binding's read.
 *   • HONEST GAPS + THA TRUST RULES. A request the Profile owner holds no safe answer
 *     for returns a structured gap, never a fabricated answer (Principle 6). The
 *     handler NEVER invents a profile field or a preference value, and never pulls
 *     household_eaters dietary overrides into a profile read (that belongs to the
 *     household capability).
 *
 * The handler is built by {@link createProfileReadHandler} with a port provider, so the
 * production binding injects the real owning service and tests inject an in-memory owner.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { ProfileReadPort } from "./profile-read-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";
import type { User, UserPreferences } from "@shared/schema";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

/**
 * The caller's profile as the read binding surfaces it — an EXPLICIT allowlist of
 * display-safe `users` columns. Never includes `password`, `emailVerificationToken`,
 * `emailVerificationExpires`, `passwordResetToken`, `passwordResetExpires`,
 * `demoClaimedEmail`, `starterMealsLoaded`, or `updatedAt` (internal/sensitive — not in
 * the allowlist the canonical Capability Card defines).
 */
export interface ProfileView {
  readonly id: number;
  readonly username: string;
  readonly displayName: string | null;
  readonly firstName: string | null;
  readonly profilePhotoUrl: string | null;
  readonly measurementPreference: string;
  readonly preferredPriceTier: string;
  readonly onboardingCompleted: boolean;
  readonly isBetaUser: boolean;
  readonly emailVerified: boolean;
  readonly dietPattern: string | null;
  readonly dietRestrictions: readonly string[] | null;
  readonly eatingSchedule: string | null;
  readonly role: string;
  readonly subscriptionTier: string;
  readonly subscriptionStatus: string | null;
  readonly subscriptionExpiresAt: Date | null;
  readonly isDemo: boolean;
  readonly demoExpiresAt: Date | null;
  readonly createdAt: Date;
  readonly lastLoginAt: Date | null;
  readonly lastSeenAt: Date | null;
  readonly customMetricDefs: ReadonlyArray<{ id: string; name: string; unit: string }> | null;
  readonly diaryExtraMetrics: readonly string[] | null;
}

/**
 * The caller's stored preferences as the read binding surfaces them — every
 * substantive `user_preferences` column (none are sensitive, per the Capability Card).
 * The row's own internal primary key (`id`) and the redundant foreign key (`userId`,
 * already present as `profile.id`) are not surfaced, matching the internal-field
 * exclusion convention used by every other read binding (e.g. Pantry, Diary).
 */
export interface ProfilePreferencesView {
  readonly dietTypes: readonly string[];
  readonly excludedIngredients: readonly string[];
  readonly healthGoals: readonly string[];
  readonly budgetLevel: string;
  readonly preferredStores: readonly string[];
  readonly upfSensitivity: string;
  readonly qualityPreference: string;
  readonly calorieTarget: number | null;
  readonly calorieMode: string;
  readonly heightCm: number | null;
  readonly weightKg: number | null;
  readonly activityLevel: string;
  readonly goalType: string;
  readonly adultsCount: number;
  readonly childrenCount: number;
  readonly babiesCount: number;
  readonly soundEnabled: boolean;
  readonly eliteTrackingEnabled: boolean;
  readonly healthTrendEnabled: boolean;
  readonly barcodeScannerEnabled: boolean;
  readonly plannerShowCalories: boolean;
  readonly plannerEnableBabyMeals: boolean;
  readonly plannerEnableChildMeals: boolean;
  readonly plannerEnableDrinks: boolean;
  readonly preferredIngredients: readonly string[];
  readonly maxPrepTolerance: number | null;
  readonly mealMode: string;
  readonly maxExtraPrepMinutes: number | null;
  readonly maxTotalCookTime: number | null;
  readonly preferLessProcessed: boolean;
  readonly includeRegulatoryAdditivesInScoring: boolean;
}

export interface ProfileReadResult {
  readonly scope: "profile";
  readonly profile: ProfileView;
  /** null when the owner has no stored preferences row yet (e.g. a new user) — never a fabricated default. */
  readonly preferences: ProfilePreferencesView | null;
}

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication)
// ---------------------------------------------------------------------------

function toProfileView(user: User): ProfileView {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? null,
    firstName: user.firstName ?? null,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    measurementPreference: user.measurementPreference,
    preferredPriceTier: user.preferredPriceTier,
    onboardingCompleted: user.onboardingCompleted,
    isBetaUser: user.isBetaUser,
    emailVerified: user.emailVerified,
    dietPattern: user.dietPattern ?? null,
    dietRestrictions: user.dietRestrictions ?? null,
    eatingSchedule: user.eatingSchedule ?? null,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus ?? null,
    subscriptionExpiresAt: user.subscriptionExpiresAt ?? null,
    isDemo: user.isDemo,
    demoExpiresAt: user.demoExpiresAt ?? null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
    lastSeenAt: user.lastSeenAt ?? null,
    customMetricDefs: user.customMetricDefs ?? null,
    diaryExtraMetrics: user.diaryExtraMetrics ?? null,
  };
}

function toPreferencesView(prefs: UserPreferences): ProfilePreferencesView {
  return {
    dietTypes: prefs.dietTypes,
    excludedIngredients: prefs.excludedIngredients,
    healthGoals: prefs.healthGoals,
    budgetLevel: prefs.budgetLevel,
    preferredStores: prefs.preferredStores,
    upfSensitivity: prefs.upfSensitivity,
    qualityPreference: prefs.qualityPreference,
    calorieTarget: prefs.calorieTarget ?? null,
    calorieMode: prefs.calorieMode,
    heightCm: prefs.heightCm ?? null,
    weightKg: prefs.weightKg ?? null,
    activityLevel: prefs.activityLevel,
    goalType: prefs.goalType,
    adultsCount: prefs.adultsCount,
    childrenCount: prefs.childrenCount,
    babiesCount: prefs.babiesCount,
    soundEnabled: prefs.soundEnabled,
    eliteTrackingEnabled: prefs.eliteTrackingEnabled,
    healthTrendEnabled: prefs.healthTrendEnabled,
    barcodeScannerEnabled: prefs.barcodeScannerEnabled,
    plannerShowCalories: prefs.plannerShowCalories,
    plannerEnableBabyMeals: prefs.plannerEnableBabyMeals,
    plannerEnableChildMeals: prefs.plannerEnableChildMeals,
    plannerEnableDrinks: prefs.plannerEnableDrinks,
    preferredIngredients: prefs.preferredIngredients,
    maxPrepTolerance: prefs.maxPrepTolerance ?? null,
    mealMode: prefs.mealMode,
    maxExtraPrepMinutes: prefs.maxExtraPrepMinutes ?? null,
    maxTotalCookTime: prefs.maxTotalCookTime ?? null,
    preferLessProcessed: prefs.preferLessProcessed,
    includeRegulatoryAdditivesInScoring: prefs.includeRegulatoryAdditivesInScoring,
  };
}

// ---------------------------------------------------------------------------
// Verb implementation
// ---------------------------------------------------------------------------

/**
 * Read the caller's own profile + preferences. No id parameter exists on this binding —
 * the row is always the server-resolved caller's own, so cross-user access has no code
 * path. Honest gap if the owner has no `users` row for the resolved id (should not
 * happen for an authenticated session, but never fabricated). An unsupported `scope`
 * param (e.g. household eater overrides) is an honest gap pointing at the right
 * capability rather than silently ignored or fabricated.
 */
async function handleRead(intent: Intent, userId: number, port: ProfileReadPort): Promise<ProfileReadResult> {
  const params = intent.parameters ?? {};
  const scope = params.scope as string | undefined;

  if (scope !== undefined && scope !== "profile") {
    if (scope === "household-eaters" || scope === "eaters") {
      throw gap(
        `Household eater dietary overrides are not part of the Profile capability — ` +
          "they belong to the Household capability. The Intelligence Platform will not pull them into a profile read.",
      );
    }
    throw gap(
      `Unsupported profile read scope ${JSON.stringify(scope)}. ` +
        'Supported scope: "profile" (the caller\'s own profile + preferences).',
    );
  }

  const user = await port.getUser(userId);
  if (!user) {
    throw gap(
      "Honest gap: the Profile owner has no stored user row for the resolved id. " +
        "The Intelligence Platform will not fabricate a profile.",
    );
  }

  const prefs = await port.getUserPreferences(userId);

  return {
    scope: "profile",
    profile: toProfileView(user),
    preferences: prefs ? toPreferencesView(prefs) : null,
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the profile read-only handler. `resolvePort` provides the owning-service
 * surface (production: real storage; tests: in-memory owner). The returned handler is
 * what the Capability Registry binds to the `profile` capability (INT12).
 */
export function createProfileReadHandler(
  resolvePort: () => Promise<ProfileReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" executes. "explain" (no stored rationale for any
    // profile field) and "add" (a write — profile/preference edits remain owned by the
    // Profile service) are both out of scope for this read-only binding and return an
    // honest gap via the guard below. There is no code path here that changes any
    // profile field or preference.
    readOnlyVerbGuard(intent, ["read"], "Profile");

    const userId = requireUserId(context, "Profile");
    const port = await resolvePort();

    return handleRead(intent, userId, port);
  };
}
