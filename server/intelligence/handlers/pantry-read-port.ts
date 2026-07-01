/**
 * Pantry Read Port (INT8)
 * =======================
 * The NARROW, read-only delegation surface the Pantry capability handler is allowed
 * to call. Every method here is a 1:1 forward to an EXISTING owning-service method —
 * the Pantry data owner (`server/storage.ts`, SoT D8–11: userPantryItems +
 * pantry_ingredient_knowledge tables). This port adds NO pantry business logic; it is a
 * typed seam so that:
 *   • the handler delegates (never re-implements) pantry reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: `getPantryItems` takes a `userId` and the owner
 * resolves the caller's household internally, returning ONLY that household's non-deleted
 * rows. The port therefore inherits the owner's household-scoping — there is no method
 * here that can read another household's pantry data.
 *
 * `getPantryIngredientKnowledge` is keyed by `ingredientKey` and returns static,
 * admin-enriched knowledge stored by the owner. The handler gates this behind an
 * ownership check (item must be in the caller's pantry) before exposing knowledge.
 *
 * GOVERNANCE: the Pantry service remains the authoritative owner of all pantry data and
 * business rules (TIP1 Principles 2 & 7). This port only *reads* what the owner exposes;
 * it has NO write methods by construction (INT8 is read-only).
 */

import type { UserPantryItem, PantryIngredientKnowledge } from "@shared/schema";

/**
 * The read-only owning-service surface. Each method forwards to the existing Pantry
 * owner. `getPantryItems` is household-scoped by the owner from `userId` alone;
 * `getPantryIngredientKnowledge` looks up static knowledge by ingredientKey.
 */
export interface PantryReadPort {
  /** Pantry owner — the caller's household pantry items (non-deleted, sorted by the owner). */
  getPantryItems(userId: number): Promise<UserPantryItem[]>;
  /** Pantry owner — admin-enriched static knowledge for an ingredientKey, or null if not stored. */
  getPantryIngredientKnowledge(ingredientKey: string): Promise<PantryIngredientKnowledge | null>;
}

/**
 * Build the production port over the real owning service. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStoragePantryReadPort(): Promise<PantryReadPort> {
  const { storage } = await import("../../storage.js");
  return {
    getPantryItems: (userId) => storage.getPantryItems(userId),
    getPantryIngredientKnowledge: (ingredientKey) =>
      storage.getPantryIngredientKnowledge(ingredientKey),
  };
}
