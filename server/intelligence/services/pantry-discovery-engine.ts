/**
 * PantryDiscoveryEngine (INT31)
 * ================================
 * Implements PantryDiscoveryPort: fetches the caller's pantry and filters items
 * by the search query against displayName / ingredientKey.
 *
 * An EMPTY query returns ALL non-deleted items — handles "what's in my pantry?"
 *
 * OWNERSHIP: This engine does not own any data. It reads only.
 * HARD BOUNDARIES:
 *   • No cross-user data access: getPantryItems(userId) is ownership-scoped.
 *   • No fabrication: every field comes from a stored row.
 *   • Deleted items (isDeleted = true) are excluded.
 */

import type { PantryDiscoveryItem, PantryDiscoveryPort } from "../handlers/pantry-discovery-port.js";

const PANTRY_DISCOVERY_MAX_RESULTS = 100;

export interface PantryDiscoveryStorage {
  getPantryItems(userId: number): Promise<Array<{
    id: number;
    ingredientKey: string;
    displayName: string | null;
    category: string;
    isDeleted: boolean;
    needQuantityValue: number | null;
    needUnit: string | null;
  }>>;
}

export class PantryDiscoveryEngine implements PantryDiscoveryPort {
  constructor(private readonly storage: PantryDiscoveryStorage) {}

  async discover(query: string, userId: number): Promise<PantryDiscoveryItem[]> {
    const lowerQuery = query.toLowerCase().trim();

    const items = await this.storage.getPantryItems(userId).catch(() => []);
    const results: PantryDiscoveryItem[] = [];

    for (const item of items) {
      if (item.isDeleted) continue;

      const displayName = item.displayName ?? item.ingredientKey;
      const nameLower = displayName.toLowerCase();
      const keyLower = item.ingredientKey.toLowerCase();

      const matches =
        !lowerQuery ||
        nameLower.includes(lowerQuery) ||
        keyLower.includes(lowerQuery);

      if (!matches) continue;

      results.push({
        id: `pantry-item:${item.id}`,
        pantryItemId: item.id,
        name: displayName,
        ingredientKey: item.ingredientKey,
        quantity: item.needQuantityValue ?? 0,
        unit: item.needUnit ?? "",
        location: item.category,
        source: "pantry-discovery",
      });
    }

    return results.slice(0, PANTRY_DISCOVERY_MAX_RESULTS);
  }
}

export { PANTRY_DISCOVERY_MAX_RESULTS };
