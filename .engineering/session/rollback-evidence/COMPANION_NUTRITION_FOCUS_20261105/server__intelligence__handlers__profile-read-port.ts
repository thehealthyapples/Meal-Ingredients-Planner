/**
 * Profile Read Port (INT12)
 * =========================
 * The narrow delegation surface the Profile capability handler is allowed to call.
 * Reads are 1:1 forwards and the bounded write delegates to the existing owner —
 * the Profile data owner (`server/storage.ts`, SoT D7/D26/D27: users + user_preferences
 * tables). This port adds NO profile business logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) profile reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: adult reads and writes are scoped to the caller's own
 * linked eater record. No adult cross-write is exposed.
 *
 * GOVERNANCE: the Profile service (storage) remains the authoritative owner of all
 * profile data and business rules (TIP1 Principles 2 & 7). This port delegates the one
 * allowed write to storage and introduces no second owner.
 */

import type { User, UserPreferences } from "@shared/schema";

/**
 * The read-only owning-service surface. Each method forwards to the existing Profile
 * owner. Both methods are user-scoped (userId is the access boundary; cross-user
 * access is structurally impossible via this port).
 */
export interface ProfileReadPort {
  /** Profile owner — the caller's user row, or undefined if no such row exists. */
  getUser(userId: number): Promise<User | undefined>;
  /** Profile owner — the caller's stored preferences row, or undefined if none saved yet. */
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  /**
   * The caller's OWN declared diet, read from its canonical owner — their eater row
   * (CONV1 P4 / OWN-1; Register Domain 16). Still a 1:1 forward to an owner method
   * (`storage.getPersonDiet`), still the caller's own data only.
   */
  getPersonDiet(userId: number): Promise<{ dietPattern: string | null; dietTypes: string[]; hardRestrictions: string[] }>;
  getPersonReportedHealthContext?(userId: number): Promise<NonNullable<import("@shared/schema").HouseholdEaterRow["reportedHealthContext"]>>;
  addPersonReportedHealthContext?(userId: number, fact: string, reportedByUserId: number): Promise<NonNullable<import("@shared/schema").HouseholdEaterRow["reportedHealthContext"]>>;
}

/**
 * Build the production port over the real owning service. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageProfileReadPort(): Promise<ProfileReadPort> {
  const { storage } = await import("../../storage.js");
  return {
    getUser: (userId) => storage.getUser(userId),
    getUserPreferences: (userId) => storage.getUserPreferences(userId),
    getPersonDiet: (userId) => storage.getPersonDiet(userId),
    getPersonReportedHealthContext: (userId) => storage.getPersonReportedHealthContext(userId),
    addPersonReportedHealthContext: (userId, fact, reporterId) => storage.addPersonReportedHealthContext(userId, fact, reporterId),
  };
}
