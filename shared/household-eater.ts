/**
 * Guest Eater — Phase 5
 *
 * A one-off guest added to a single planner entry.
 * Not a user account, not a permanent household member.
 * Persists only on the planner entry it was added to.
 */
export interface GuestEater {
  /** Client-generated unique ID (e.g. crypto.randomUUID()). Scoped to one entry. */
  id: string;
  displayName: string;
  /** Soft dietary preferences (optional). */
  dietTypes: string[];
  /** Hard restrictions — always enforced. */
  hardRestrictions: string[];
}

/**
 * Map a GuestEater to an EffectiveDietProfile.
 * No override concept exists for guests — what you see is what is used.
 */
export function guestEaterToProfile(guest: GuestEater): EffectiveDietProfile {
  return {
    dietTypes: guest.dietTypes,
    hardRestrictions: guest.hardRestrictions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Household Eater Model
 *
 * Represents a person in a household who meals can be planned for.
 * Supports two kinds of eater:
 *   - "user"  — an adult with an account (linked by userId)
 *   - "child" — a non-account member (e.g. a child), identified only by name
 *
 * Diet preferences come in two tiers:
 *   - defaultDietTypes    — soft preferences (can be overridden per meal plan)
 *   - hardRestrictions    — non-overridable (allergies, religious, medical)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HouseholdEater {
  /** Stable local identifier (e.g. UUID or sequential id — caller's responsibility). */
  id: string;
  /** Display name shown in the UI (e.g. "Alice", "Toby"). */
  displayName: string;
  /**
   * Soft dietary preferences.
   * These describe what this eater normally eats but can be overridden
   * when planning a specific meal (e.g. a Vegan adult eating a family roast).
   * Values should match ONBOARDING_DIET_OPTIONS values from diets.ts.
   */
  defaultDietTypes: string[];
  /**
   * Hard dietary restrictions that must always be respected.
   * These cannot be overridden — allergies, intolerances, or firm ethical/
   * religious requirements. Values should match ALLERGY_OPTIONS or
   * DIET_RESTRICTIONS values (e.g. "Gluten-Free", "nuts", "Halal").
   */
  hardRestrictions: string[];
  /** "user" when backed by an account; "child" for non-account members. */
  kind: "user" | "child";
  /** Present only when kind === "user". */
  userId?: number;
}

/**
 * An optional per-meal override for a single eater's diet types.
 * Only dietTypes can be overridden; hardRestrictions are always enforced.
 */
export interface DietOverride {
  dietTypes: string[];
}

/**
 * The resolved diet profile for one eater, ready to pass to meal filtering.
 *
 *   dietTypes       — what this eater will eat for this meal
 *   hardRestrictions — what must always be excluded, regardless of anything else
 */
export interface EffectiveDietProfile {
  dietTypes: string[];
  hardRestrictions: string[];
}

// ─── DB → Runtime mapping ─────────────────────────────────────────────────────

/**
 * Convert a raw DB row from the household_eaters table into a HouseholdEater
 * runtime model (Phase 1 type). All planner logic should work with this type,
 * never with the raw DB row directly.
 */
export function dbEaterToHouseholdEater(row: {
  id: number;
  displayName: string;
  userId: number | null;
  defaultDietTypes: string[] | null;
  hardRestrictions: string[] | null;
}): HouseholdEater {
  return {
    id: String(row.id),
    displayName: row.displayName,
    kind: row.userId != null ? "user" : "child",
    userId: row.userId ?? undefined,
    defaultDietTypes: row.defaultDietTypes ?? [],
    hardRestrictions: row.hardRestrictions ?? [],
  };
}

// ─── Pure function ────────────────────────────────────────────────────────────

/**
 * Compute the effective diet profile for a household eater.
 *
 * Rules:
 *   1. hardRestrictions are always included, unchanged.
 *   2. If an override is provided, its dietTypes replace defaultDietTypes.
 *   3. Otherwise defaultDietTypes are used as-is.
 *
 * This is a pure function — no side effects, no I/O.
 *
 * @example
 * // Default only
 * getEffectiveDietProfile({ defaultDietTypes: ["Vegan"], hardRestrictions: ["nuts"], ... })
 * // → { dietTypes: ["Vegan"], hardRestrictions: ["nuts"] }
 *
 * @example
 * // Override applied
 * getEffectiveDietProfile({ defaultDietTypes: ["Vegan"], hardRestrictions: ["nuts"], ... }, { dietTypes: ["Vegetarian"] })
 * // → { dietTypes: ["Vegetarian"], hardRestrictions: ["nuts"] }
 *
 * @example
 * // Hard restriction preserved despite empty override
 * getEffectiveDietProfile({ defaultDietTypes: [], hardRestrictions: ["Gluten-Free"], ... }, { dietTypes: [] })
 * // → { dietTypes: [], hardRestrictions: ["Gluten-Free"] }
 */
export function getEffectiveDietProfile(
  member: HouseholdEater,
  override?: DietOverride,
): EffectiveDietProfile {
  return {
    dietTypes: override ? override.dietTypes : member.defaultDietTypes,
    hardRestrictions: member.hardRestrictions,
  };
}
