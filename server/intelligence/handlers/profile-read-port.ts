/**
 * Profile Read Port (INT12)
 * =========================
 * The NARROW, read-only delegation surface the Profile capability handler is allowed
 * to call. Every method here is a 1:1 forward to an EXISTING owning-service method —
 * the Profile data owner (`server/storage.ts`, SoT D7/D26/D27: users + user_preferences
 * tables). This port adds NO profile business logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) profile reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: both methods take `userId` as their access key and the
 * owner's queries are scoped to that row. There is no method here that can read another
 * user's profile or preferences.
 *
 * GOVERNANCE: the Profile service (storage) remains the authoritative owner of all
 * profile data and business rules (TIP1 Principles 2 & 7). This port only *reads* what
 * the owner exposes; it has NO write methods by construction (INT12 is read-only).
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
  };
}
