/**
 * Opportunity Delivery Read Port (OD1)
 * ====================================
 * The NARROW delegation surface the `opportunity-delivery` capability handler is
 * allowed to call. Each method forwards 1:1 to the Opportunity Delivery Framework
 * (`server/intelligence/opportunity-delivery/framework.ts`) — the Domain Intelligence
 * layer that owns cross-producer prioritisation, grouping, dedup, surface selection
 * and the acknowledge/dismiss/accept lifecycle. This port adds NO reasoning of its
 * own; it is a typed seam so that:
 *   • the handler delegates (never re-implements) collection/prioritisation logic, and
 *   • tests can inject an in-memory store to prove delegation without a live database.
 *
 * This port mirrors the same dynamic-import discipline every other read port in this
 * directory uses (e.g. food-intelligence-read-port.ts) — importing the framework and
 * the real delivery store only at call time, not at module load time.
 */

import type {
  OpportunityDeliveryBundle,
  OpportunityDeliveryRequest,
  OpportunityResolution,
} from "../opportunity-delivery/framework.js";
import type { OpportunityDeliveryStatus } from "../opportunity-delivery/delivery-store.js";

/** The delegation surface. Forwards to the Opportunity Delivery Framework. */
export interface OpportunityDeliveryReadPort {
  /** Collect, dedupe, prioritise, group and persist-if-new the caller's current opportunities. */
  collectOpportunities(request: OpportunityDeliveryRequest): Promise<OpportunityDeliveryBundle>;
  /** Acknowledge, dismiss, or accept a previously-delivered opportunity. `null` = no such delivery record (honest gap). */
  resolveOpportunity(
    userId: number,
    opportunityId: string,
    status: Exclude<OpportunityDeliveryStatus, "delivered">,
  ): Promise<OpportunityResolution | null>;
}

/**
 * Build the production port over the real Opportunity Delivery Framework and the
 * real database-backed delivery store. Imports are DYNAMIC so that loading the
 * Intelligence Platform module (and its tests) never opens a database connection at
 * import time — the store and the fan-out to other capabilities are only touched on
 * first invocation.
 */
export async function createEngineOpportunityDeliveryReadPort(): Promise<OpportunityDeliveryReadPort> {
  const framework = await import("../opportunity-delivery/framework.js");
  const { opportunityDeliveryStore } = await import("../opportunity-delivery/delivery-store.js");
  return {
    collectOpportunities: (request) => framework.collectOpportunities(request, { store: opportunityDeliveryStore }),
    resolveOpportunity: (userId, opportunityId, status) =>
      framework.resolveOpportunity(userId, opportunityId, status, opportunityDeliveryStore),
  };
}
