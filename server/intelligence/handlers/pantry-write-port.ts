/**
 * Pantry Write Port (COMP_ACT1 — Companion Action Activation)
 * ============================================================
 * The NARROW write delegation surface the Pantry capability handler is allowed to call.
 * Each method is a 1:1 forward to an EXISTING owning-service method — the pantry data
 * owner (`server/storage.ts`, SoT D8). `addPantryItem` and `deletePantryItem` are the
 * SAME calls `POST /api/pantry` and `DELETE /api/pantry/:id` make today.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: both owner methods take the caller's `userId` and scope
 * the write to that user — there is no method here that can write to another user's
 * pantry, so no ownership check needs to be (or can be) relaxed.
 *
 * GOVERNANCE: the Pantry service remains the sole authoritative owner of all pantry data
 * and business rules (TIP1 Principles 2 & 7). This port adds NO pantry business logic.
 */

import type { UserPantryItem } from "@shared/schema";

/** The write-only owning-service surface. Forwards to the existing Pantry owner. */
export interface PantryWritePort {
  /** Pantry owner — add an item to the caller's pantry (user-scoped by the owner). */
  addPantryItem(
    userId: number,
    ingredient: string,
    category: string,
    notes?: string,
    displayName?: string,
    isDefault?: boolean,
    needQuantityValue?: number | null,
    needUnit?: string | null,
  ): Promise<UserPantryItem>;
  /** Pantry owner — delete one of the caller's own pantry items (user-scoped by the owner). */
  deletePantryItem(userId: number, id: number): Promise<void>;
}

/**
 * Build the production port over the real owning service. Import is DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStoragePantryWritePort(): Promise<PantryWritePort> {
  const { storage } = await import("../../storage.js");
  return {
    addPantryItem: (userId, ingredient, category, notes, displayName, isDefault, needQuantityValue, needUnit) =>
      storage.addPantryItem(userId, ingredient, category, notes, displayName, isDefault, needQuantityValue, needUnit),
    deletePantryItem: (userId, id) => storage.deletePantryItem(userId, id),
  };
}
