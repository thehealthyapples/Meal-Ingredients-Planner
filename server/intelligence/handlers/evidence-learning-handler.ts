/**
 * Evidence & Learning Handler (EL1 - twenty-first live capability binding)
 * ============================================================================
 * Makes the `evidence-learning` capability executable for `report` (capture a
 * structured household outcome), `search` (list this household's current
 * learning signals), `approve` (confirm a pending signal) and `delete`
 * (decline a pending signal), by delegating every request to the EL1
 * framework through an {@link EvidenceLearningReadPort}.
 *
 * VERB MAPPING (the closed, canonical 20-verb taxonomy - no new verb invented,
 * mirrors OD1's own report/review/approve/delete reuse):
 *   report  - append one structured household outcome and re-run pattern
 *             detection over its own dimension only.
 *   search  - list this household's current learning signals (patterns),
 *             optionally filtered by domain/status - what Domain Intelligence
 *             and the household itself can see THA has (and has not) learned.
 *   approve - confirm a pending signal. Strong confirmation tier (platform
 *             default for "approve", TIP2 Sec5.1) - this is the ONLY door
 *             through which a detected pattern may ever be treated as
 *             something a household actually confirmed.
 *   delete  - decline a pending signal. Strong confirmation tier. A declined
 *             signal is never silently re-asked (evidence-learning-store.ts's
 *             decided-status discipline).
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   - OWNERSHIP-SCOPED. Every verb requires an authenticated caller -
 *     `context.userId` only, never a client-supplied household id. The
 *     household is always resolved server-side via `getHouseholdForUser`.
 *   - NEVER ADAPTS A PREFERENCE ITSELF. Confirming a signal (`approve`) only
 *     changes ITS OWN status/confirmedBy/confirmedAt fields - exactly like
 *     companion-learning-store.ts's `reviewRecommendation` hard rule. It has
 *     no path to any preference store. Acting on a confirmed signal (writing
 *     an actual household preference) remains a separate, human-triggered
 *     write through that preference store's own owning capability.
 *   - NEVER INFERS FROM ONE EVENT. `report` never itself decides a signal is
 *     ready - that is entirely the pure detector's job (framework.ts), which
 *     structurally refuses to emit a pattern below MIN_EVIDENCE_COUNT/
 *     MIN_CONSISTENCY (see that module's header).
 *   - HONEST GAPS. A missing/invalid parameter, or a signal id this household
 *     was never given, is a structured honest gap - never a fabricated
 *     capture or confirmation.
 */

import {
  CapabilityExecutionError,
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { EvidenceLearningReadPort } from "./evidence-learning-read-port.js";
import type {
  RecordOutcomeResult,
} from "../evidence-learning/framework.js";
import type {
  EvidenceDirection,
  SignalStatus,
} from "../evidence-learning/evidence-learning-store.js";
import type { HouseholdLearningSignal } from "@shared/schema";
import { toInt, requireUserId, gap } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Port-facing param shapes
// ---------------------------------------------------------------------------

export interface RecordOutcomeParams {
  readonly householdId: number;
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly subjectKey: string;
  readonly outcomeType: string;
  readonly direction: EvidenceDirection;
  readonly context?: Record<string, unknown> | null;
  readonly sourceCapabilityId: string;
}

export interface ListSignalsQuery {
  readonly householdId: number;
  readonly domain?: string;
  readonly status?: SignalStatus;
}

export interface DecideSignalInput {
  readonly id: number;
  readonly decision: "confirmed" | "declined";
  readonly userId: number;
  readonly householdId: number;
  readonly notes?: string;
}

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

export interface EvidenceOutcomeResult extends RecordOutcomeResult {
  readonly source: "evidence-learning-framework";
}

export interface LearningSignalsResult {
  readonly signals: readonly HouseholdLearningSignal[];
  readonly source: "evidence-learning-framework";
}

export interface SignalDecisionResult {
  readonly signal: HouseholdLearningSignal;
  readonly source: "evidence-learning-framework";
}

// ---------------------------------------------------------------------------
// Parameter coercion (evidence-learning specific - not shared plumbing)
// ---------------------------------------------------------------------------

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s.length > 0 ? s : undefined;
}

function toDirection(value: unknown): EvidenceDirection | undefined {
  return value === "positive" || value === "negative" || value === "neutral" ? value : undefined;
}

function toStatus(value: unknown): SignalStatus | undefined {
  return value === "pending_confirmation" || value === "confirmed" || value === "declined" ? value : undefined;
}

function toContext(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

const REPORT_MISSING_FIELD_MESSAGE =
  'Recording a household outcome needs { domain, subjectType, subjectId, subjectKey, outcomeType, direction, sourceCapabilityId } - ' +
  '"direction" must be one of "positive" | "negative" | "neutral".';

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

async function handleReport(
  intent: Intent,
  context: IntelligenceContext,
  port: EvidenceLearningReadPort,
): Promise<EvidenceOutcomeResult> {
  const params = intent.parameters ?? {};
  const userId = requireUserId(context, "Evidence & Learning");
  const householdId = await port.getHouseholdForUser(userId);

  const domain = toNonEmptyString(params.domain);
  const subjectType = toNonEmptyString(params.subjectType);
  const subjectId = toNonEmptyString(params.subjectId);
  const subjectKey = toNonEmptyString(params.subjectKey);
  const outcomeType = toNonEmptyString(params.outcomeType);
  const direction = toDirection(params.direction);
  const sourceCapabilityId = toNonEmptyString(params.sourceCapabilityId);

  if (!domain || !subjectType || !subjectId || !subjectKey || !outcomeType || !direction || !sourceCapabilityId) {
    throw gap(REPORT_MISSING_FIELD_MESSAGE);
  }

  const result = await port.recordOutcome({
    householdId,
    domain,
    subjectType,
    subjectId,
    subjectKey,
    outcomeType,
    direction,
    context: toContext(params.context) ?? null,
    sourceCapabilityId,
  });

  return { ...result, source: "evidence-learning-framework" };
}

async function handleSearch(
  intent: Intent,
  context: IntelligenceContext,
  port: EvidenceLearningReadPort,
): Promise<LearningSignalsResult> {
  const params = intent.parameters ?? {};
  const userId = requireUserId(context, "Evidence & Learning");
  const householdId = await port.getHouseholdForUser(userId);

  const signals = await port.listSignals({
    householdId,
    domain: toNonEmptyString(params.domain),
    status: toStatus(params.status),
  });

  return { signals, source: "evidence-learning-framework" };
}

async function handleDecide(
  intent: Intent,
  context: IntelligenceContext,
  port: EvidenceLearningReadPort,
  decision: "confirmed" | "declined",
): Promise<SignalDecisionResult> {
  const params = intent.parameters ?? {};
  const userId = requireUserId(context, "Evidence & Learning");
  const householdId = await port.getHouseholdForUser(userId);

  const signalId = toInt(params.signalId);
  if (signalId === undefined) {
    throw gap(
      `${decision === "confirmed" ? "Confirming" : "Declining"} a learning signal needs { signalId } - the id ` +
        'returned by a prior "search" call.',
    );
  }

  const signal = await port.decideSignal({
    id: signalId,
    decision,
    userId,
    householdId,
    notes: toNonEmptyString(params.notes),
  });

  if (!signal) {
    throw gap(
      `Honest gap: no learning signal with id ${signalId} belongs to your household - it cannot be ` +
        `${decision} before it exists for you. Call "search" first.`,
    );
  }

  return { signal, source: "evidence-learning-framework" };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the Evidence & Learning handler. `resolvePort` provides the
 * framework/store surface (production: the real EL1 store + framework;
 * tests: an in-memory port).
 */
export function createEvidenceLearningHandler(
  resolvePort: () => Promise<EvidenceLearningReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    switch (intent.verb) {
      case "report":
        return handleReport(intent, context, await resolvePort());
      case "search":
        return handleSearch(intent, context, await resolvePort());
      case "approve":
        return handleDecide(intent, context, await resolvePort(), "confirmed");
      case "delete":
        return handleDecide(intent, context, await resolvePort(), "declined");
      default:
        throw new CapabilityExecutionError(
          "gap",
          `Evidence & Learning is bound to the Intelligence Platform for "report"/"search"/"approve"/"delete" only: ` +
            `"${intent.verb}" is not executable via the platform. This platform never adapts a household preference ` +
            "itself - see the owning preference store's own registered capability for that.",
          intent.verb,
        );
    }
  };
}
