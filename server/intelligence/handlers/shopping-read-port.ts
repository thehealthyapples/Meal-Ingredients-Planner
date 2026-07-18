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

import type { ShoppingListItem, ShoppingListExtra, ProductMatch } from "@shared/schema";

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
  /**
   * SHOP1 — the retailer products ALREADY matched to the caller's own shopping lines,
   * each carrying the `thaRating` the Analyser (SoT D19) already computed. A 1:1 forward
   * to the existing `storage.getProductMatchesForUser`, which resolves the caller's
   * household internally and returns only that household's rows — so this method inherits
   * the same ownership scoping as the two above.
   *
   * This does NOT match products, fetch live prices or contact a retailer (see the module
   * header): it reads matches THA has already written. The result is flat — matches are
   * not grouped by line, so callers group by `shoppingListItemId` themselves.
   */
  getProductMatchesForUser(userId: number): Promise<ProductMatch[]>;
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
    getProductMatchesForUser: (userId) => storage.getProductMatchesForUser(userId),
  };
}
