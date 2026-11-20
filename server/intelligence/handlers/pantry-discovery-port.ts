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
  /**
   * COMP-DET1 (2026-11-20) — "what's in my pantry?" routes HERE (empty-query
   * search, confidence 0.93), not the plain pantry read handler — live-caught
   * after the pantry/pantry-discovery duplicate-routing bug was fixed and the
   * single surviving route turned out to be this one. A search/list result is
   * still a pure data lookup; the LLM should never re-derive or paraphrase it
   * into a possibly-wrong count or item list.
   */
  readonly deterministicAnswer: string;
}

/**
 * COMP-DET1 (2026-11-20) — `items` stays capped at the engine's own result
 * limit (unbounded prompt/response payloads are their own problem), but
 * `totalCount` is the REAL, uncapped match count. Live-caught: before this,
 * callers had only the capped array and used `.length` as if it were the
 * total — confidently wrong once a real household's data exceeded the cap
 * (138 real pantry items reported as "100").
 */
export interface PantryDiscoverySearchPage {
  readonly items: readonly PantryDiscoveryItem[];
  readonly totalCount: number;
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface PantryDiscoveryPort {
  discover(query: string, userId: number): Promise<PantryDiscoverySearchPage>;
}

// ---------------------------------------------------------------------------
// Production port factory
// ---------------------------------------------------------------------------

export async function createProductionPantryDiscoveryPort(): Promise<PantryDiscoveryPort> {
  const { PantryDiscoveryEngine } = await import("../services/pantry-discovery-engine.js");
  const { storage } = await import("../../storage.js");
  return new PantryDiscoveryEngine(storage);
}
