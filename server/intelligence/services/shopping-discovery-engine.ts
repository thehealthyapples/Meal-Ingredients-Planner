/**
 * ShoppingDiscoveryEngine (INT30)
 * =================================
 * Implements ShoppingDiscoveryPort: fetches the caller's shopping list and
 * filters items by the search query against productName / normalizedName.
 *
 * An EMPTY query returns ALL items — this handles "what's on my shopping list?"
 * without requiring a gap response.
 *
 * OWNERSHIP: This engine does not own any data. It reads only. The shopping-list
 * storage owner (storage.ts) retains full ownership.
 *
 * HARD BOUNDARIES:
 *   • No cross-user data access: getShoppingListItems(userId) is ownership-scoped.
 *   • No fabrication: every field in ShoppingDiscoveryItem comes from a stored row.
 *   • Empty query returns all items (not a gap — answered by the handler differently
 *     only if the engine returns empty AND list was actually empty).
 */

import type {
  ShoppingDiscoveryItem,
  ShoppingDiscoveryPort,
} from "../handlers/shopping-discovery-port.js";

/** Maximum discovery results returned per query. */
const SHOPPING_DISCOVERY_MAX_RESULTS = 50;

// ---------------------------------------------------------------------------
// Minimal storage surface
// ---------------------------------------------------------------------------

export interface ShoppingDiscoveryStorage {
  getShoppingListItems(userId: number): Promise<Array<{
    id: number;
    productName: string | null;
    normalizedName: string | null;
    quantity: string | null;
    unit: string | null;
    category: string | null;
    checked: boolean | null;
  }>>;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class ShoppingDiscoveryEngine implements ShoppingDiscoveryPort {
  constructor(private readonly storage: ShoppingDiscoveryStorage) {}

  async discover(query: string, userId: number): Promise<ShoppingDiscoveryItem[]> {
    const lowerQuery = query.toLowerCase().trim();

    const items = await this.storage.getShoppingListItems(userId).catch(() => []);
    if (items.length === 0) return [];

    const results: ShoppingDiscoveryItem[] = [];

    for (const item of items) {
      const name = item.productName ?? item.normalizedName ?? "";
      const normalizedName = item.normalizedName ?? item.productName ?? "";

      const nameLower = name.toLowerCase();
      const normLower = normalizedName.toLowerCase();

      const matches =
        !lowerQuery ||
        nameLower.includes(lowerQuery) ||
        normLower.includes(lowerQuery);

      if (!matches) continue;

      results.push({
        id: `shopping-item:${item.id}`,
        shoppingItemId: item.id,
        name: name || normalizedName,
        normalizedName,
        quantity: item.quantity ?? "",
        unit: item.unit ?? "",
        category: item.category ?? "uncategorised",
        checked: item.checked ?? false,
        source: "shopping-discovery",
      });
    }

    return results.slice(0, SHOPPING_DISCOVERY_MAX_RESULTS);
  }
}

/** Exported so tests can assert against the capping constant without magic numbers. */
export { SHOPPING_DISCOVERY_MAX_RESULTS };
