/**
 * Opportunity Delivery Capability Binding (OD1)
 * ================================================
 * Activates the TWENTIETH live capability on the THA Intelligence Platform: it binds
 * the Opportunity Delivery handler to the `opportunity-delivery` capability, flipping
 * its availability from "registered" (metadata only) to "available" (executable). It
 * reuses the exact Port -> Handler -> Binding pattern proven by every other
 * capability — this is the platform's own governance layer over Domain Intelligence
 * opportunity producers, not a second Domain Intelligence engine itself (Rule FI1 —
 * it owns zero business-domain data and zero producer reasoning).
 *
 * The handler delegates to the Opportunity Delivery Framework and the delivery store
 * via a port built with DYNAMIC imports, so binding here does NOT open a database
 * connection at import time — the store and any producer fan-out are only touched
 * on first invocation.
 *
 * Idempotent: binding twice simply re-binds the same handler (the registry replaces it).
 */

import type { IntelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import { createOpportunityDeliveryHandler } from "../handlers/opportunity-delivery-handler.js";
import {
  createEngineOpportunityDeliveryReadPort,
  type OpportunityDeliveryReadPort,
} from "../handlers/opportunity-delivery-read-port.js";

/** The capability id this binding activates. */
export const OPPORTUNITY_DELIVERY_CAPABILITY_ID = "opportunity-delivery";

/**
 * The verbs this binding actually executes: `report` (collect/dedupe/prioritise/
 * group/deliver), `review` (acknowledge), `approve` (accept), `delete` (dismiss).
 * Declared here so the registry can surface truthful executableIntents and
 * discovery cannot over-advertise (INT6A discipline).
 */
export const OPPORTUNITY_DELIVERY_EXECUTABLE_INTENTS: readonly IntentVerb[] = [
  "report",
  "review",
  "approve",
  "delete",
];

/**
 * Bind the Opportunity Delivery handler to a platform.
 *
 * Production: call with only `platform` — the real framework + delivery-store port
 * is used by default. Tests: pass an in-memory port factory as the second argument
 * so the binding and test share the same registration entry point.
 */
export function bindOpportunityDeliveryCapability(
  platform: IntelligencePlatform,
  resolvePort: () => Promise<OpportunityDeliveryReadPort> = createEngineOpportunityDeliveryReadPort,
): void {
  platform.registerHandler(
    OPPORTUNITY_DELIVERY_CAPABILITY_ID,
    createOpportunityDeliveryHandler(resolvePort),
    OPPORTUNITY_DELIVERY_EXECUTABLE_INTENTS,
  );
}
