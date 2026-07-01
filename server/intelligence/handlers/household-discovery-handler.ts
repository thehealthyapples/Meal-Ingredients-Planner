/**
 * Household Discovery Handler (INT29)
 * =====================================
 * Routes `household-discovery/search` intents to the HouseholdDiscoveryPort.
 *
 * VERB CONTRACT (read-only):
 *   search  → discover members in the caller's household matching the query.
 *             An empty query returns ALL members (handles "who's in my household?").
 *
 * PERMISSION: auth-required (userId must be present in context).
 * OWNERSHIP:  no data mutation — pure read.
 */

import type { CapabilityHandler } from "../capability-registry.js";
import type { Intent } from "../types.js";
import type { IntelligenceContext } from "../intelligence-platform.js";
import type {
  HouseholdDiscoveryPort,
  HouseholdDiscoverySearchResult,
} from "./household-discovery-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const HOUSEHOLD_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;

// ---------------------------------------------------------------------------
// Search sub-handler
// ---------------------------------------------------------------------------

async function handleSearch(
  intent: Intent,
  userId: number,
  port: HouseholdDiscoveryPort,
): Promise<HouseholdDiscoverySearchResult> {
  const params = intent.parameters ?? {};
  // Empty string query is allowed — means "list all members"
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";

  const { items, householdName } = await port.discover(rawQuery, userId);

  if (!householdName) {
    throw gap("You don't appear to be part of a household yet. Set one up first to use household discovery.");
  }

  return {
    scope: "household-search",
    query: rawQuery,
    totalCount: items.length,
    results: items,
    householdName,
    source: "household-discovery",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createHouseholdDiscoveryHandler(
  resolvePort: () => Promise<HouseholdDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, HOUSEHOLD_DISCOVERY_EXECUTABLE_INTENTS, "Household Discovery");
    const userId = requireUserId(context, "Household Discovery");
    const port = await resolvePort();
    return handleSearch(intent, userId, port);
  };
}
