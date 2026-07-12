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
 *   explain — PHASE5E. Narrate ONE already-delivered opportunity from the evidence the
 *             Decision Engine already produced. A READ verb (permissions.ts
 *             READ_ONLY_VERBS → ConfirmationTier "none"): it collects nothing new,
 *             resolves nothing, and writes nothing. Adds no reasoning — see
 *             `handleExplain`.
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
// DEC1 — the one canonical delivery budget. `explain` searches the FULL delivered set
// rather than the caller's display limit, so a card is never unexplainable purely
// because it sat below a surface's own cap. The constant is imported, never restated.
import { DELIVERY_MAX_LIMIT } from "../../../shared/attention/decision.js";
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

/**
 * PHASE5E — the result of `explain`: ONE already-delivered opportunity, narrated
 * from what the Decision Engine already holds.
 *
 * Every field is a VERBATIM projection of the opportunity the framework already
 * produced. This handler computes nothing, re-ranks nothing, and adds not one
 * sentence of its own — the "narration" IS the producer's `explanation`, the
 * producer's `evidence`, and the producer's `suggestedAction`, returned as a
 * structured Full Result so the Context Composition Engine (INT17) can ground the
 * model on them under its own budget.
 *
 * That is the entire point: PHASE5D withdrew the "Why this?" affordance because the
 * only reachable answer was about the DOMAIN, not the card. The evidence that
 * justifies the card has existed all along — it was simply not addressable. This
 * makes it addressable. It does not invent it.
 */
export interface OpportunityExplanationResult {
  readonly opportunityId: string;
  readonly capabilityId: string;
  readonly domain: string;
  readonly type: string;
  readonly priority: DeliverableOpportunity["priority"];
  readonly explanation: string;
  readonly evidence: DeliverableOpportunity["evidence"];
  readonly suggestedAction: string;
  readonly subject?: DeliverableOpportunity["subject"];
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

  // DEC1 capture discipline (mirrors BEH1's): the Decision Engine SEALS the
  // decision (pure, inside collectOpportunities); this one platform choke
  // point RECORDS it — every consuming surface reaches `report` through here,
  // so each delivery moment is recorded exactly once. Fire-and-forget,
  // exception-isolated: telemetry never fails the user's own report. Nothing
  // reads the record back, and it is never serialised onto the wire result
  // below (operator-facing only).
  if (bundle.decision) {
    const decision = bundle.decision;
    try {
      const { recordObservation } = await import("../observation/observation-engine.js");
      recordObservation({
        kind: "delivery-decision",
        severity: "info",
        outcome: !bundle.trust.resolved
          ? "no-producer-reached"
          : decision.delivered > 0
            ? "delivered"
            : "nothing-to-deliver",
        userId,
        capability: intent.capabilityId,
        verb: intent.verb,
        metadata: { ...decision },
      });
    } catch {
      // Capture is a side effect of the report, never a precondition for it.
    }
  }

  return {
    opportunities: bundle.opportunities,
    grouped: bundle.grouped,
    trust: bundle.trust,
    source: "opportunity-delivery-framework",
  };
}

/**
 * PHASE5E — `explain`: narrate ONE opportunity from the Decision Engine's own output.
 *
 * WHY IT RE-COLLECTS. An opportunity's CONTENT is never persisted — OD1 stores only
 * the delivery lifecycle (`opportunity_deliveries`: who saw what, and how it ended).
 * The Notice Engine architecture §3 makes that a rule, not an accident: "The
 * opportunity … recomputed fresh per request. **Never persisted.**" So the only
 * honest way to explain one is to recompute the household's current opportunities and
 * find it — through the SAME `collectOpportunities` path every other surface uses,
 * never by reaching into FI4's engine internals or a producer's tables.
 *
 * Three consequences, all of them correct:
 *
 *   • An opportunity the household already ACCEPTED or DISMISSED is suppressed by the
 *     framework's own lifecycle filter, so it is not found here — and the household is
 *     told honestly that it is no longer active, rather than being handed an
 *     explanation for a card that no longer exists.
 *   • An opportunity that has become UNTRUE since it was rendered (they filled the
 *     empty day in another tab) is likewise not found. THA declines to explain a
 *     recommendation it would no longer make. A stale explanation is a confident wrong
 *     answer, which TIP3 §12.2 names as the worst thing this product can produce.
 *   • It asks for the FULL delivery budget, not the default, so an explanation is never
 *     refused merely because the card sat below the caller's display limit.
 *
 * NO `delivery-decision` OBSERVATION IS RECORDED HERE. DEC1 §5 scopes that capture to
 * "delivery moments only (the `report` choke point)". Explaining a card the household
 * is already looking at is not a delivery moment, and recording one would corrupt the
 * operator's count of what THA actually surfaced.
 */
async function handleExplain(
  intent: Intent,
  context: IntelligenceContext,
  port: OpportunityDeliveryReadPort,
): Promise<OpportunityExplanationResult> {
  const params = intent.parameters ?? {};
  const opportunityId = toOpportunityId(params.opportunityId);
  const userId = requireUserId(context, "Opportunity Delivery");

  if (!opportunityId) {
    throw gap(
      'Explaining an opportunity needs { opportunityId } — the id returned by a prior "report" call. ' +
        "This capability explains one already-delivered suggestion; it never explains the domain in general.",
    );
  }

  const bundle = await port.collectOpportunities({ userId, limit: DELIVERY_MAX_LIMIT });
  const found = bundle.opportunities.find((o) => o.id === opportunityId);

  if (!found) {
    // Honest gap — never a fabricated justification, and never a fallback answer about
    // the domain (the trust defect PHASE5D §9.1 refused to ship).
    throw gap(
      `Honest gap: no active opportunity with id ${JSON.stringify(opportunityId)} is currently being delivered to ` +
        "you. It may have been accepted, dismissed, or it may simply no longer be true — in which case there is " +
        "nothing left to explain.",
    );
  }

  return {
    opportunityId: found.id,
    capabilityId: found.capabilityId,
    domain: found.domain,
    type: found.type,
    priority: found.priority,
    explanation: found.explanation,
    evidence: found.evidence,
    suggestedAction: found.suggestedAction,
    subject: found.subject,
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
      case "explain":
        return handleExplain(intent, context, await resolvePort());
      case "review":
        return handleResolve(intent, context, await resolvePort(), "acknowledged");
      case "approve":
        return handleResolve(intent, context, await resolvePort(), "accepted");
      case "delete":
        return handleResolve(intent, context, await resolvePort(), "dismissed");
      default:
        throw new CapabilityExecutionError(
          "gap",
          `Opportunity Delivery is bound to the Intelligence Platform for "report"/"explain"/"review"/"approve"/` +
            `"delete" only: "${intent.verb}" is not executable via the platform. This framework never writes to any ` +
            "producer's own business domain — see the producer's own registered capability for that.",
          intent.verb,
        );
    }
  };
}
