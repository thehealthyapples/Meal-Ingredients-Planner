/**
 * Shopping Read Port (INT3)
 * =========================
 * The NARROW, read-only delegation surface the Shopping capability handler is allowed
 * to call. Every method here is a 1:1 forward to an EXISTING owning-service method —
 * the Shopping data owner (`server/storage.ts`, SoT D15: shopping_list /
 * shopping_list_extras). This port adds NO shopping business logic; it is a typed seam
 * so that:
 *   • the handler delegates (never re-implements) shopping reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * OWN-DATA ONLY BY CONSTRUCTION: both owner getters take a `userId` and resolve the
 * caller's household internally (`getHouseholdForUser`), returning ONLY that household's
 * rows. The port therefore inherits the owner's ownership scoping — there is no method
 * here that can read another user's or household's shopping data.
 *
 * GOVERNANCE: the Shopping service remains the authoritative owner of all shopping data
 * and business rules (TIP1 Principles 2 & 7). This port only *reads* what the owner
 * exposes; it has NO write methods by construction (INT3 is read-only). Nothing here
 * matches products, fetches live prices, builds baskets, or places orders.
 */

import type { ShoppingListItem, ShoppingListExtra } from "@shared/schema";

/**
 * The read-only owning-service surface. Each method forwards to the existing Shopping
 * owner. Both are household-scoped by the owner from the `userId` alone, so no method
 * mutates anything and no method can reach cross-household data.
 */
export interface ShoppingReadPort {
  /** Shopping owner — the caller's current shopping list items (household-scoped by the owner). */
  getShoppingListItems(userId: number): Promise<ShoppingListItem[]>;
  /** Shopping owner — the caller's "extras" lines (household staples; household-scoped by the owner). */
  getShoppingListExtras(userId: number): Promise<ShoppingListExtra[]>;
}

/**
 * Build the production port over the real owning service. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the owner is only touched on first invocation.
 */
export async function createStorageShoppingReadPort(): Promise<ShoppingReadPort> {
  const { storage } = await import("../../storage.js");
  return {
    getShoppingListItems: (userId) => storage.getShoppingListItems(userId),
    getShoppingListExtras: (userId) => storage.getShoppingListExtras(userId),
  };
}
