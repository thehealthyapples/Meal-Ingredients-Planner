/**
 * household-observation.ts — LEARN1 Household Learning
 * ====================================================================
 * The domain-facing edge of **Rule EL2 — "Evidence flows through one door"**
 * (docs/investigations/intelligence/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md §4).
 *
 * EL2 §4 named this helper, described its shape, and deliberately deferred it to
 * "the same EWO that wires the first real reporter, so that reporter is the first
 * proof the helper's shape is right rather than a second, independent guess."
 * LEARN1 is that EWO. Both directions of the one door live here:
 *
 *   recordHouseholdObservation()  submits Evidence          (the `report` verb)
 *   readConfirmedUnderstanding()  reads what a household has
 *                                 explicitly CONFIRMED       (the `search` verb)
 *
 * Both travel the ordinary Intent Engine pipeline (`intelligencePlatform.handle()`)
 * exactly as every other read and write on this platform does. Nothing in this
 * module imports `evidence-learning-store.ts`, and nothing here touches
 * `household_evidence_events` or `household_learning_signals`. That is Rule EL2's
 * whole point, and this module exists so that obeying the rule is the path of
 * least resistance rather than an act of discipline.
 *
 * WHY BOTH FUNCTIONS ARE TOTAL (neither ever throws)
 * --------------------------------------------------
 * Evidence capture is a side effect of a real user action: dismissing a piece of
 * advice must never fail because the evidence log was unreachable. Learning
 * influence is likewise an enrichment of a recommendation, never a precondition
 * for one. Both therefore degrade to an explicit, honest "nothing recorded" /
 * "nothing confirmed", never an error propagated into the caller's own operation.
 *
 * This is NOT the Observation Engine's fire-and-forget telemetry discipline, and
 * the difference is worth stating because the two are easy to conflate. An
 * Observation is operator telemetry whose loss costs nothing and which nothing may
 * ever read back (THA_OBSERVATION_ENGINE_ARCHITECTURE.md §7). Evidence is a durable
 * household business fact whose loss is small but real. So a failure here is
 * returned to the caller as a stated reason and logged once — never silently
 * discarded, never queued, never retried behind the user's back.
 *
 * WHAT THIS MODULE MAY NEVER DO
 * -----------------------------
 * Write a household preference. A Confirmed Understanding is the *third* gate of
 * EL2 §8's three-gate chain, and even passing it does not license this platform to
 * mutate `user_preferences` or any other business-domain store. Consumers of
 * `readConfirmedUnderstanding()` may only re-weight what their own domain already
 * knows how to produce (NK2 Rule P1: "household learning never generates new facts,
 * only re-weights existing ones").
 */

import { EVIDENCE_LEARNING_CAPABILITY_ID } from "../bindings/evidence-learning.js";
import type { IntelligenceContext } from "../types.js";
import type { EvidenceDirection } from "./evidence-learning-store.js";

// ---------------------------------------------------------------------------
// Submitting Evidence — the `report` verb, reached through the one door
// ---------------------------------------------------------------------------

export interface HouseholdObservationInput {
  /** The authenticated acting user. The household is resolved server-side, never supplied by a caller. */
  readonly userId: number;
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectId: string;
  /** The grouping dimension a Pattern is detected over — never the entity id. */
  readonly subjectKey: string;
  readonly outcomeType: string;
  /** Supplied honestly by the reporting domain from what it actually knows — never a guessed default (EL2 §5). */
  readonly direction: EvidenceDirection;
  readonly context?: Record<string, unknown> | null;
  readonly sourceCapabilityId: string;
}

export type HouseholdObservationResult =
  | { readonly recorded: true }
  | { readonly recorded: false; readonly reason: string };

function contextFor(userId: number): IntelligenceContext {
  return { role: "user", userId: String(userId) };
}

/**
 * Submit one Evidence event. Total: every failure — an unreachable database, a user
 * with no resolvable household, a capability outcome that is not `ok` — returns
 * `{ recorded: false, reason }` rather than throwing into the caller's operation.
 */
export async function recordHouseholdObservation(
  input: HouseholdObservationInput,
): Promise<HouseholdObservationResult> {
  try {
    const { intelligencePlatform } = await import("../intelligence-platform.js");
    const outcome = await intelligencePlatform.handle(
      {
        capabilityId: EVIDENCE_LEARNING_CAPABILITY_ID,
        verb: "report",
        parameters: {
          domain: input.domain,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          subjectKey: input.subjectKey,
          outcomeType: input.outcomeType,
          direction: input.direction,
          sourceCapabilityId: input.sourceCapabilityId,
          ...(input.context ? { context: input.context } : {}),
        },
      },
      contextFor(input.userId),
    );

    if (outcome.status !== "ok") {
      const reason = `evidence-learning "report" returned status "${outcome.status}"`;
      console.warn(`[LEARN1] evidence not recorded: ${reason}`);
      return { recorded: false, reason };
    }
    return { recorded: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[LEARN1] evidence not recorded: ${reason}`);
    return { recorded: false, reason };
  }
}

// ---------------------------------------------------------------------------
// Reading Confirmed Understanding — the `search` verb, status="confirmed"
// ---------------------------------------------------------------------------

/**
 * One thing a household has explicitly confirmed it wants understood. This is the
 * ONLY learning shape any consumer may act on: a `pending_confirmation` Pattern is
 * a candidate, not a belief (EL2 §2, ET5), and a `declined` Pattern is a refusal.
 *
 * `direction` is narrowed to the two values a signal can actually carry —
 * `detectPatternForDimension` only ever emits `positive` or `negative`, because a
 * dimension with no majority direction produces no signal at all.
 */
export interface ConfirmedUnderstanding {
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectKey: string;
  readonly direction: "positive" | "negative";
  readonly confidence: "low" | "medium" | "high";
  readonly evidenceCount: number;
  /** ET6 — every Confirmed Understanding explains itself. A row without one is never acted on. */
  readonly rationale: string;
}

const CONFIRMED_STATUS = "confirmed";
const DIRECTIONS: ReadonlySet<string> = new Set(["positive", "negative"]);
const CONFIDENCES: ReadonlySet<string> = new Set(["low", "medium", "high"]);

/**
 * Narrows raw `household_learning_signals` rows to the confirmed, self-explaining,
 * directional subset a consumer is permitted to act on. PURE — no I/O, fully
 * unit-testable.
 *
 * Each guard below is load-bearing rather than defensive noise:
 *   • `status === "confirmed"` is re-checked here even though the query already
 *     filtered on it. Confirmation is the gate that separates a statistical claim
 *     about evidence from a claim about what a household wants (ET5); a consumer
 *     must never be able to act on a Pattern because a query filter was dropped.
 *   • a row with no `rationale` is discarded rather than acted on silently. ET6
 *     makes the explanation structural, so an unexplainable understanding is not a
 *     weaker understanding — it is not one at all.
 *   • a non-directional row cannot re-weight anything, so it is dropped rather than
 *     coerced into a direction it never had.
 */
export function toConfirmedUnderstanding(rows: readonly unknown[]): ConfirmedUnderstanding[] {
  const understood: ConfirmedUnderstanding[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;

    if (r.status !== CONFIRMED_STATUS) continue;
    if (typeof r.domain !== "string" || typeof r.subjectType !== "string" || typeof r.subjectKey !== "string") continue;
    if (typeof r.direction !== "string" || !DIRECTIONS.has(r.direction)) continue;
    if (typeof r.confidence !== "string" || !CONFIDENCES.has(r.confidence)) continue;
    if (typeof r.rationale !== "string" || r.rationale.trim().length === 0) continue;

    const evidenceCount = typeof r.evidenceCount === "number" && Number.isFinite(r.evidenceCount) ? r.evidenceCount : 0;

    understood.push({
      domain: r.domain,
      subjectType: r.subjectType,
      subjectKey: r.subjectKey,
      direction: r.direction as "positive" | "negative",
      confidence: r.confidence as "low" | "medium" | "high",
      evidenceCount,
      rationale: r.rationale,
    });
  }
  return understood;
}

/**
 * Read every Confirmed Understanding for this user's household, optionally narrowed
 * to one domain. Total: an unreachable store, an unresolvable household, or a
 * non-`ok` outcome all yield `[]` — the honest gap that means "this household's
 * behaviour is still unknown", never a fabricated or partial understanding.
 */
export async function readConfirmedUnderstanding(
  userId: number,
  domain?: string,
): Promise<readonly ConfirmedUnderstanding[]> {
  try {
    const { intelligencePlatform } = await import("../intelligence-platform.js");
    const outcome = await intelligencePlatform.handle(
      {
        capabilityId: EVIDENCE_LEARNING_CAPABILITY_ID,
        verb: "search",
        parameters: { status: CONFIRMED_STATUS, ...(domain ? { domain } : {}) },
      },
      contextFor(userId),
    );

    if (outcome.status !== "ok") return [];
    const signals = (outcome.result as { signals?: unknown } | null | undefined)?.signals;
    return Array.isArray(signals) ? toConfirmedUnderstanding(signals) : [];
  } catch {
    return [];
  }
}
