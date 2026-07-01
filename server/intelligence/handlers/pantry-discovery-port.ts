/**
 * Pantry Discovery Port (INT31)
 * ================================
 * Types and production port factory for the `pantry-discovery` capability.
 *
 * The port exposes a single method — `discover(query, userId)` — that searches
 * the caller's pantry by item name or ingredient key. An empty query returns
 * all pantry items (the "what's in my pantry?" case).
 *
 * GOVERNANCE: No data is owned here. The pantry storage owner retains full
 * ownership. This port is the typed seam that keeps the handler testable
 * without a live database.
 */

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface PantryDiscoveryItem {
  readonly id: string;
  readonly pantryItemId: number;
  readonly name: string;
  readonly ingredientKey: string;
  readonly quantity: number;
  readonly unit: string;
  readonly location: string;
  readonly source: "pantry-discovery";
}

export interface PantryDiscoverySearchResult {
  readonly scope: "pantry-search";
  readonly query: string;
  readonly totalCount: number;
  readonly results: readonly PantryDiscoveryItem[];
  readonly source: "pantry-discovery";
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface PantryDiscoveryPort {
  discover(query: string, userId: number): Promise<PantryDiscoveryItem[]>;
}

// ---------------------------------------------------------------------------
// Production port factory
// ---------------------------------------------------------------------------

export async function createProductionPantryDiscoveryPort(): Promise<PantryDiscoveryPort> {
  const { PantryDiscoveryEngine } = await import("../services/pantry-discovery-engine.js");
  const { storage } = await import("../../storage.js");
  return new PantryDiscoveryEngine(storage);
}
