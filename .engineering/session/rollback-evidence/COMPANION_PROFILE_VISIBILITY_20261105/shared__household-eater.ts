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
 *   - "account"    — backed by a THA account (linked by userId)
 *   - "no-account" — a household member with no account, identified only by name
 *
 * `kind` is about ACCOUNT BACKING, never about age, and never about hospitality.
 * It was previously "user" / "child" (CONV1 BEH-1): "child" was correct only by
 * accident — a live-in grandparent with no account is not a child, and the word
 * reached the language model. THA states no per-child signals (NK1:418) and holds
 * no age for anyone, so no derivation here can be about age. See GuestEater above
 * for the unrelated, genuine "guest": a visitor at a single planner entry, who is
 * not a member of the household at all.
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
  /** "account" when backed by a THA account; "no-account" otherwise. Never about age. */
  kind: "account" | "no-account";
  /** Present only when kind === "account". */
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
    kind: row.userId != null ? "account" : "no-account",
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
