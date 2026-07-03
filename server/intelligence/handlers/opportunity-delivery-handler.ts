/**
 * Opportunity Delivery Handler (OD1 — twentieth live capability binding)
 * =======================================================================
 * Makes the `opportunity-delivery` capability executable for `report`, `review`,
 * `approve` and `delete`, by delegating every request to the Opportunity Delivery
 * Framework (`server/intelligence/opportunity-delivery/framework.ts`) through an
 * {@link OpportunityDeliveryReadPort}. This is the platform's own governance layer
 * over every Domain Intelligence opportunity producer (today: `food-intelligence`).
 *
 * VERB MAPPING (the closed, canonical 20-verb taxonomy — no new verb invented):
 *   report  — collect, dedupe, prioritise, group and deliver the caller's current
 *             opportunities across every registered producer.
 *   review  — acknowledge an opportunity (mark seen; non-terminal, still delivered
 *             on future reports until dismissed or accepted).
 *   approve — accept an opportunity (terminal; never redelivered).
 *   delete  — dismiss an opportunity (terminal; never redelivered).
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • OWNERSHIP-SCOPED. Every verb requires an authenticated caller — `context.userId`
 *     only, never a client-supplied user/household id (mirrors every other
 *     ownership-scoped verb on this platform).
 *   • NO PRODUCER REASONING. This handler and the framework it delegates to never
 *     compute an opportunity themselves — every opportunity's content is a verbatim
 *     projection of what a registered producer capability already returned via the
 *     ordinary `intelligencePlatform.handle()` path (Rule FI1 — this framework owns
 *     zero business-domain data and zero producer reasoning).
 *   • HONEST GAPS. A missing/invalid `opportunityId`, or an `opportunityId` this
 *     user was never delivered, is a structured honest gap — never a fabricated
 *     acknowledgement, dismissal or acceptance.
 */

import {
  CapabilityExecutionError,
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { OpportunityDeliveryReadPort } from "./opportunity-delivery-read-port.js";
import type {
  DeliverableOpportunity,
  OpportunityDeliveryTrust,
  OpportunityResolution,
} from "../opportunity-delivery/framework.js";
import type { OpportunityDeliveryStatus } from "../opportunity-delivery/delivery-store.js";
import { toInt, requireUserId, gap } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

export interface OpportunityDeliveryReportResult {
  readonly opportunities: readonly DeliverableOpportunity[];
  readonly grouped: Readonly<Record<string, readonly DeliverableOpportunity[]>>;
  readonly trust: OpportunityDeliveryTrust;
  readonly source: "opportunity-delivery-framework";
}

export interface OpportunityResolutionResult extends OpportunityResolution {
  readonly source: "opportunity-delivery-framework";
}

// ---------------------------------------------------------------------------
// Parameter coercion (opportunity-delivery specific — not shared plumbing)
// ---------------------------------------------------------------------------

function toOpportunityId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s.length > 0 ? s : undefined;
}

const RESOLUTION_VERB_LABEL: Readonly<Record<Exclude<OpportunityDeliveryStatus, "delivered">, string>> = {
  acknowledged: "acknowledged",
  dismissed: "dismissed",
  accepted: "accepted",
};

const RESOLUTION_MISSING_ID_MESSAGE: Readonly<Record<Exclude<OpportunityDeliveryStatus, "delivered">, string>> = {
  acknowledged: 'Acknowledging an opportunity needs { opportunityId } — the id returned by a prior "report" call.',
  dismissed: 'Dismissing an opportunity needs { opportunityId } — the id returned by a prior "report" call.',
  accepted: 'Accepting an opportunity needs { opportunityId } — the id returned by a prior "report" call.',
};

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

async function handleReport(
  intent: Intent,
  context: IntelligenceContext,
  port: OpportunityDeliveryReadPort,
): Promise<OpportunityDeliveryReportResult> {
  const params = intent.parameters ?? {};
  const limit = toInt(params.limit);
  const userId = requireUserId(context, "Opportunity Delivery");

  const bundle = await port.collectOpportunities({ userId, limit });

  return {
    opportunities: bundle.opportunities,
    grouped: bundle.grouped,
    trust: bundle.trust,
    source: "opportunity-delivery-framework",
  };
}

async function handleResolve(
  intent: Intent,
  context: IntelligenceContext,
  port: OpportunityDeliveryReadPort,
  targetStatus: Exclude<OpportunityDeliveryStatus, "delivered">,
): Promise<OpportunityResolutionResult> {
  const params = intent.parameters ?? {};
  const opportunityId = toOpportunityId(params.opportunityId);
  const userId = requireUserId(context, "Opportunity Delivery");

  if (!opportunityId) {
    throw gap(RESOLUTION_MISSING_ID_MESSAGE[targetStatus]);
  }

  const resolution = await port.resolveOpportunity(userId, opportunityId, targetStatus);
  if (!resolution) {
    throw gap(
      `Honest gap: no opportunity with id ${JSON.stringify(opportunityId)} has been delivered to you — it cannot be ` +
        `${RESOLUTION_VERB_LABEL[targetStatus]} before it has been delivered. Call "report" first.`,
    );
  }

  return { ...resolution, source: "opportunity-delivery-framework" };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the Opportunity Delivery handler. `resolvePort` provides the framework
 * surface (production: the real Opportunity Delivery Framework + delivery store;
 * tests: an in-memory port). The returned handler is what the Capability Registry
 * binds to the `opportunity-delivery` capability.
 */
export function createOpportunityDeliveryHandler(
  resolvePort: () => Promise<OpportunityDeliveryReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    switch (intent.verb) {
      case "report":
        return handleReport(intent, context, await resolvePort());
      case "review":
        return handleResolve(intent, context, await resolvePort(), "acknowledged");
      case "approve":
        return handleResolve(intent, context, await resolvePort(), "accepted");
      case "delete":
        return handleResolve(intent, context, await resolvePort(), "dismissed");
      default:
        throw new CapabilityExecutionError(
          "gap",
          `Opportunity Delivery is bound to the Intelligence Platform for "report"/"review"/"approve"/"delete" only: ` +
            `"${intent.verb}" is not executable via the platform. This framework never writes to any producer's own ` +
            "business domain — see the producer's own registered capability for that.",
          intent.verb,
        );
    }
  };
}
