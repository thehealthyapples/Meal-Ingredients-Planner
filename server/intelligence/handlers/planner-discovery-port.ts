/**
 * Planner Discovery Port (INT28)
 * ================================
 * Types and production port factory for the `planner-discovery` capability.
 *
 * The port exposes a single method — `discover(query, userId)` — that is the
 * complete public surface of the PlannerDiscoveryEngine from the handler's
 * perspective. All week fan-out, meal-name resolution, and filtering happen
 * behind this interface; the handler never imports the engine directly.
 *
 * GOVERNANCE: No data is owned here. The engine delegates to the existing
 * planner and meal storage owners. This port is the typed seam that keeps
 * the handler testable without a live database.
 */

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/**
 * A single planner discovery result — one planned meal entry that matched the query.
 * `weekName` and `weekNumber` give the user context about where in their plan it appears.
 */
export interface PlannerDiscoveryItem {
  /** Composite stable key — "planner-entry:{entryId}". Never persisted. */
  readonly id: string;
  readonly mealName: string;
  readonly mealId: number;
  readonly weekName: string;
  readonly weekNumber: number;
  /** The meal slot from the planner entry (e.g. "breakfast", "lunch", "dinner"). */
  readonly mealType: string;
  readonly source: "planner-discovery";
}

/**
 * The result shape returned by the planner-discovery/search handler.
 * This is the ONLY shape the conversation gateway and LLM ever see.
 */
export interface PlannerDiscoverySearchResult {
  readonly scope: "planner-search";
  readonly query: string;
  readonly totalCount: number;
  readonly results: readonly PlannerDiscoveryItem[];
  /** Total number of weeks scanned (including weeks with no match). */
  readonly weeksScanned: number;
  readonly source: "planner-discovery";
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

/**
 * PlannerDiscoveryPort — the narrow surface the planner-discovery handler calls.
 * One method. All week fan-out, meal resolution, and filtering are behind this interface.
 *
 * Production: PlannerDiscoveryEngine implements this.
 * Tests:      In-memory stub implements this — inject via resolvePort factory.
 */
export interface PlannerDiscoveryPort {
  /**
   * Search across all planner weeks for the caller for entries whose meal name
   * matches the query. Returns matched items, capped by the engine's DISCOVERY_MAX_RESULTS.
   * Never throws — returns an empty array if all sources fail.
   */
  discover(query: string, userId: number): Promise<PlannerDiscoveryItem[]>;
}

// ---------------------------------------------------------------------------
// Production port factory
// ---------------------------------------------------------------------------

/**
 * Build the production port backed by PlannerDiscoveryEngine. Imports are DYNAMIC
 * so loading the Intelligence Platform never opens a database connection at
 * import time — the engine and storage are only resolved on first invocation.
 */
export async function createProductionPlannerDiscoveryPort(): Promise<PlannerDiscoveryPort> {
  const { PlannerDiscoveryEngine } = await import("../services/planner-discovery-engine.js");
  const { storage } = await import("../../storage.js");
  return new PlannerDiscoveryEngine(storage);
}
