/**
 * Shopping Discovery Port (INT30)
 * =================================
 * Types and production port factory for the `shopping-discovery` capability.
 *
 * The port exposes a single method — `discover(query, userId)` — that searches
 * the caller's shopping list by ingredient/product name. An empty query returns
 * all items (the "what's on my shopping list?" case).
 *
 * GOVERNANCE: No data is owned here. The shopping-list storage owner retains
 * full ownership. This port is the typed seam that keeps the handler testable
 * without a live database.
 */

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/**
 * A single shopping discovery result — one shopping list item that matched
 * the query (or all items when query is empty).
 */
export interface ShoppingDiscoveryItem {
  /** Stable key — "shopping-item:{id}". Never persisted. */
  readonly id: string;
  readonly shoppingItemId: number;
  readonly name: string;
  readonly normalizedName: string;
  readonly quantity: string;
  readonly unit: string;
  readonly category: string;
  readonly checked: boolean;
  readonly source: "shopping-discovery";
}

/**
 * The result shape returned by the shopping-discovery/search handler.
 * This is the ONLY shape the conversation gateway and LLM ever see.
 */
export interface ShoppingDiscoverySearchResult {
  readonly scope: "shopping-search";
  readonly query: string;
  readonly totalCount: number;
  readonly results: readonly ShoppingDiscoveryItem[];
  readonly source: "shopping-discovery";
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * ShoppingDiscoveryPort — the narrow surface the shopping-discovery handler calls.
 * Production: ShoppingDiscoveryEngine implements this.
 * Tests:      In-memory stub implements this — inject via resolvePort factory.
 */
export interface ShoppingDiscoveryPort {
  /**
   * Search the caller's shopping list. An empty query returns all items.
   * Filtering is by ingredient name (productName / normalizedName).
   * Returns an empty array when the list is empty or no items match.
   */
  discover(query: string, userId: number): Promise<ShoppingDiscoveryItem[]>;
}

// ---------------------------------------------------------------------------
// Production port factory
// ---------------------------------------------------------------------------

/**
 * Build the production port backed by ShoppingDiscoveryEngine. Imports are DYNAMIC
 * so loading the Intelligence Platform never opens a database connection at import time.
 */
export async function createProductionShoppingDiscoveryPort(): Promise<ShoppingDiscoveryPort> {
  const { ShoppingDiscoveryEngine } = await import("../services/shopping-discovery-engine.js");
  const { storage } = await import("../../storage.js");
  return new ShoppingDiscoveryEngine(storage);
}
