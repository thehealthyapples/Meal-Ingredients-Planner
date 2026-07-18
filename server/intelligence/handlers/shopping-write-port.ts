/**
 * Shopping Write Port (INT40)
 * ===========================
 * The NARROW write delegation surface the Shopping capability handler is allowed to
 * call. The single method here is a 1:1 forward to an EXISTING owning-service method —
 * `storage.addShoppingListExtra`, the SAME method `POST /api/shopping-list/extras`
 * calls today (the shopping-list-extras route in server/routes.ts). This port adds NO
 * shopping business logic; it is a typed seam so that:
 *   • the handler delegates (never re-implements) the shopping-extra write, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: the owner method takes a `userId` and resolves the
 * caller's household internally — there is no method here that can write to another
 * user's or household's shopping list.
 *
 * GOVERNANCE: the Shopping service (server/storage.ts, SoT D15) remains the sole
 * authoritative owner of shopping data and business rules (TIP1 Principles 2 & 7).
 * This port only forwards ONE write the owner already exposes; it never matches
 * products, prices, or builds a basket.
 */

import type { ShoppingListExtra } from "@shared/schema";

/** The write-only owning-service surface. Forwards to the existing Shopping owner. */
export interface ShoppingWritePort {
  /** Shopping owner — add a household staple/extra (household-scoped by the owner). */
  addShoppingListExtra(
    userId: number,
    name: string,
    category?: string,
    alwaysAdd?: boolean,
  ): Promise<ShoppingListExtra>;
  /**
   * Shopping owner — delete one of the caller's own shopping-list extras (COMP_ACT1).
   * The SAME call `DELETE /api/shopping-list/extras/:id` makes: the owner method takes
   * `userId` and scopes the delete to that user, so another user's extra can never be
   * removed — own-data only by construction.
   */
  deleteShoppingListExtra(userId: number, id: number): Promise<void>;
}

/**
 * Build the production port over the real owning service. Import is DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageShoppingWritePort(): Promise<ShoppingWritePort> {
  const { storage } = await import("../../storage.js");
  return {
    addShoppingListExtra: (userId, name, category, alwaysAdd) =>
      storage.addShoppingListExtra(userId, name, category, alwaysAdd),
    deleteShoppingListExtra: (userId, id) => storage.deleteShoppingListExtra(userId, id),
  };
}
