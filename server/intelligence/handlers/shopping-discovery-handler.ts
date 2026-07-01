/**
 * Shopping Discovery Handler (INT30)
 * =====================================
 * Routes `shopping-discovery/search` intents to the ShoppingDiscoveryPort.
 *
 * VERB CONTRACT (read-only):
 *   search  → discover items on the caller's shopping list matching the query.
 *             An empty query returns ALL items (handles "what's on my list?").
 *
 * PERMISSION: auth-required (userId must be present in context).
 * OWNERSHIP:  no data mutation — pure read.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type {
  ShoppingDiscoveryPort,
  ShoppingDiscoverySearchResult,
} from "./shopping-discovery-port.js";
import { requireUserId, readOnlyVerbGuard } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SHOPPING_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;

// ---------------------------------------------------------------------------
// Search sub-handler
// ---------------------------------------------------------------------------

async function handleSearch(
  intent: Intent,
  userId: number,
  port: ShoppingDiscoveryPort,
): Promise<ShoppingDiscoverySearchResult> {
  const params = intent.parameters ?? {};
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";

  const items = await port.discover(rawQuery, userId);

  return {
    scope: "shopping-search",
    query: rawQuery,
    totalCount: items.length,
    results: items,
    source: "shopping-discovery",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createShoppingDiscoveryHandler(
  resolvePort: () => Promise<ShoppingDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, SHOPPING_DISCOVERY_EXECUTABLE_INTENTS, "Shopping Discovery");
    const userId = requireUserId(context, "Shopping Discovery");
    const port = await resolvePort();
    return handleSearch(intent, userId, port);
  };
}
