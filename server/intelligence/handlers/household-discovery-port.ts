/**
 * Household Discovery Port (INT29)
 * =================================
 * Types and production port factory for the `household-discovery` capability.
 *
 * The port exposes a single method — `discover(query, userId)` — that returns
 * household member information matching the search query. An empty query
 * returns ALL members (the "who's in my household?" case).
 *
 * GOVERNANCE: No data is owned here. The household storage owner retains full
 * ownership. This port is the typed seam that keeps the handler testable
 * without a live database.
 */

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/**
 * A single household discovery result — one member of the caller's household
 * that matched the query (or all members when query is empty).
 */
export interface HouseholdDiscoveryItem {
  /** Stable key — "household-member:{userId}". Never persisted. */
  readonly id: string;
  readonly displayName: string;
  readonly userId: number;
  readonly role: string;
  /** Diet types from the member's profile (e.g. "vegan", "gluten-free"). */
  readonly dietTypes: readonly string[];
  /** Hard restriction allergens from the member's household eater record. */
  readonly hardRestrictions: readonly string[];
  readonly source: "household-discovery";
}

/**
 * The result shape returned by the household-discovery/search handler.
 * This is the ONLY shape the conversation gateway and LLM ever see.
 */
export interface HouseholdDiscoverySearchResult {
  readonly scope: "household-search";
  readonly query: string;
  readonly totalCount: number;
  readonly results: readonly HouseholdDiscoveryItem[];
  readonly householdName: string;
  readonly source: "household-discovery";
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * HouseholdDiscoveryPort — the narrow surface the household-discovery handler calls.
 * Production: HouseholdDiscoveryEngine implements this.
 * Tests:      In-memory stub implements this — inject via resolvePort factory.
 */
export interface HouseholdDiscoveryPort {
  /**
   * Search the caller's household members. An empty query returns all members.
   * Filtering is by display name, diet type, or allergen/restriction keywords.
   * Returns an empty array when the user has no household.
   */
  discover(query: string, userId: number): Promise<{
    items: HouseholdDiscoveryItem[];
    householdName: string;
  }>;
}

// ---------------------------------------------------------------------------
// Production port factory
// ---------------------------------------------------------------------------

/**
 * Build the production port backed by HouseholdDiscoveryEngine. Imports are DYNAMIC
 * so loading the Intelligence Platform never opens a database connection at import time.
 */
export async function createProductionHouseholdDiscoveryPort(): Promise<HouseholdDiscoveryPort> {
  const { HouseholdDiscoveryEngine } = await import("../services/household-discovery-engine.js");
  const { storage } = await import("../../storage.js");
  return new HouseholdDiscoveryEngine(storage);
}
