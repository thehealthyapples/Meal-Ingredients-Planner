/**
 * Household Read Port (INT13)
 * ============================
 * The NARROW, read-only delegation surface the Household capability handler is allowed
 * to call. Every method here is a 1:1 forward to an EXISTING owning-service method —
 * the household data owner (`server/storage.ts`, SoT D16: households / household_members /
 * household_eaters tables) and the household session-resolver owner (`server/lib/household.ts`).
 * This port adds NO household business logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) household reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * `getUser` remains for the "household" scope's member views. The "eaters" scope no
 * longer needs it: CONV1 P4 (READ-1) deleted the read-time enrichment — eater rows
 * store their own diets and restrictions, being the canonical owner (OWN-1).
 *
 * No write method is exposed here (eater creation happens at membership events in
 * the owner, never in a read binding) — this binding is read-only by construction.
 *
 * GOVERNANCE: the Household service (storage) remains the authoritative owner of all
 * household data and business rules (TIP1 Principles 2 & 7). This port only *reads* what
 * the owner exposes; it has NO write methods by construction (INT13 is read-only).
 */

import type { Household, HouseholdMember, HouseholdEaterRow, User } from "@shared/schema";
import type { HouseholdDietaryContext } from "../../storage.js";

/** A household membership row as the owner returns it, paired with display-safe user fields. */
export interface HouseholdMembershipRow {
  readonly member: HouseholdMember;
  readonly user: { readonly id: number; readonly displayName: string | null; readonly username: string };
}

/**
 * The read-only owning-service surface. Each method forwards to the existing household /
 * household-eater / household-session owner. No method mutates anything.
 */
export interface HouseholdReadPort {
  /** Household-membership owner — resolves the caller's active household (authorization). */
  getHouseholdForUser(userId: number): Promise<number>;
  /** Household owner — household record + active members. */
  getHouseholdWithMembers(householdId: number): Promise<{ household: Household; members: HouseholdMembershipRow[] }>;
  /** Household owner — aggregated diet types/restrictions/exclusions across active members. */
  getHouseholdDietaryContext(userId: number): Promise<HouseholdDietaryContext>;
  /** Household-eaters owner — stored eater rows (adults + children) for a household. */
  getHouseholdEaters(householdId: number): Promise<HouseholdEaterRow[]>;
  /** Profile owner — used only to enrich adult eater rows from their own profile at read time. */
  getUser(userId: number): Promise<User | undefined>;
}

/**
 * Build the production port over the real owning services. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageHouseholdReadPort(): Promise<HouseholdReadPort> {
  const { storage } = await import("../../storage.js");
  const { getHouseholdForUser } = await import("../../lib/household.js");
  return {
    getHouseholdForUser: (userId) => getHouseholdForUser(userId),
    getHouseholdWithMembers: (householdId) => storage.getHouseholdWithMembers(householdId),
    getHouseholdDietaryContext: (userId) => storage.getHouseholdDietaryContext(userId),
    getHouseholdEaters: (householdId) => storage.getHouseholdEaters(householdId),
    getUser: (userId) => storage.getUser(userId),
  };
}
