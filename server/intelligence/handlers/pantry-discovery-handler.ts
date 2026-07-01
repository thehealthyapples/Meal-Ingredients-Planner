/**
 * Pantry Discovery Handler (INT31)
 * ====================================
 * Routes `pantry-discovery/search` intents to the PantryDiscoveryPort.
 *
 * VERB CONTRACT (read-only):
 *   search  → discover items in the caller's pantry matching the query.
 *             An empty query returns ALL items.
 *
 * PERMISSION: auth-required.
 * OWNERSHIP:  no data mutation — pure read.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type {
  PantryDiscoveryPort,
  PantryDiscoverySearchResult,
} from "./pantry-discovery-port.js";
import { requireUserId, readOnlyVerbGuard } from "./_read-kit.js";

export const PANTRY_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;

async function handleSearch(
  intent: Intent,
  userId: number,
  port: PantryDiscoveryPort,
): Promise<PantryDiscoverySearchResult> {
  const params = intent.parameters ?? {};
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";

  const items = await port.discover(rawQuery, userId);

  return {
    scope: "pantry-search",
    query: rawQuery,
    totalCount: items.length,
    results: items,
    source: "pantry-discovery",
  };
}

export function createPantryDiscoveryHandler(
  resolvePort: () => Promise<PantryDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, PANTRY_DISCOVERY_EXECUTABLE_INTENTS, "Pantry Discovery");
    const userId = requireUserId(context, "Pantry Discovery");
    const port = await resolvePort();
    return handleSearch(intent, userId, port);
  };
}
