/**
 * framework.ts - EL1 Evidence & Learning Platform
 * ====================================================================
 * Two halves, mirroring the OD1 Opportunity Delivery Framework's own split:
 *
 * 1. PATTERN DETECTION (`detectPatterns`, `bucketConfidence`, `groupEvents`) -
 *    the deterministic, rule-based reasoning this platform is allowed to do.
 *    NO machine learning, NO statistical model, NO LLM judgement - every
 *    threshold is a fixed constant, and every output rationale is a plain
 *    sentence built from counted evidence. These functions are PURE (no I/O,
 *    no clock reads beyond what is passed in), fully unit-testable without a
 *    database.
 *
 * 2. I/O ORCHESTRATION (`recordOutcomeAndDetect`, `listHouseholdSignals`,
 *    `decideSignal`) - thin, injectable wiring between the pure detector above
 *    and the store (evidence-learning-store.ts). No reasoning of its own
 *    beyond what the pure functions already decided.
 *
 * THE HARD RULE THIS MODULE ENFORCES (the ticket's non-negotiable):
 * "Never infer a permanent preference from a single observation." A pattern
 * is never emitted for a dimension with fewer than MIN_EVIDENCE_COUNT events,
 * and never emitted at all unless a clear majority of the considered events
 * agree on a direction (MIN_CONSISTENCY). One inconsistent household outcome
 * can never, by construction, produce a signal - see the guard at the top of
 * `detectPatternForDimension`. `recordOutcomeAndDetect` re-runs detection on
 * every new event, but only ever over that event's OWN dimension - a single
 * event can never manufacture a signal for a dimension it does not belong to.
 *
 * WHAT THIS MODULE DOES NOT DO: it never decides that a detected pattern
 * becomes a household preference - that requires an explicit confirmation
 * action outside this module (the `approve` verb, evidence-learning-handler.ts),
 * and adapting an actual preference store on the strength of a confirmed
 * signal remains a separate, human-triggered write through that preference
 * store's own owning capability (mirrors Rule FI1 - enrichment, not ownership).
 */

import type {
  ConfirmSignalInput,
  DerivedSignalInput,
  EvidenceDirection,
  IEvidenceLearningStore,
  SignalConfidence,
  SignalDirection,
  SignalQuery,
} from "./evidence-learning-store.js";
import type { HouseholdEvidenceEvent, HouseholdLearningSignal } from "@shared/schema";

// ---------------------------------------------------------------------------
// Thresholds - fixed constants, never learned, never tuned by usage data
// ---------------------------------------------------------------------------

/** No pattern is ever detected from fewer than this many polarised (non-neutral) events. */
export const MIN_EVIDENCE_COUNT = 3;

/** No pattern is ever detected unless at least this fraction of polarised events agree. */
export const MIN_CONSISTENCY = 0.7;

/** Deterministic confidence buckets, keyed on evidence count once MIN_CONSISTENCY is already met. */
const CONFIDENCE_THRESHOLDS: ReadonlyArray<{ readonly min: number; readonly confidence: SignalConfidence }> = [
  { min: 8, confidence: "high" },
  { min: 5, confidence: "medium" },
  { min: MIN_EVIDENCE_COUNT, confidence: "low" },
];

export function bucketConfidence(evidenceCount: number): SignalConfidence {
  for (const { min, confidence } of CONFIDENCE_THRESHOLDS) {
    if (evidenceCount >= min) return confidence;
  }
  return "low";
}

// ---------------------------------------------------------------------------
// Input/output shapes - deliberately minimal, not the full DB row
// ---------------------------------------------------------------------------

export interface EvidenceEventInput {
  readonly id: number;
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectKey: string;
  readonly direction: EvidenceDirection;
}

export interface DetectedPattern {
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectKey: string;
  readonly direction: SignalDirection;
  readonly evidenceCount: number;
  readonly consistency: number;
  readonly confidence: SignalConfidence;
  readonly supportingEventIds: readonly number[];
  readonly rationale: string;
}

interface DimensionKey {
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectKey: string;
}

interface DimensionGroup {
  readonly dimension: DimensionKey;
  readonly events: readonly EvidenceEventInput[];
}

/**
 * Joins the composite grouping key from three parts using a delimiter unlikely
 * to appear inside a real domain/subjectType/subjectKey value. The dimension
 * itself is carried alongside each group (not re-parsed from the key string),
 * so this never has to be split back apart - avoiding a whole class of bugs
 * where a subjectKey containing the delimiter would corrupt the round-trip.
 */
const DIMENSION_KEY_DELIMITER = " ";

function dimensionKeyOf(e: EvidenceEventInput): string {
  return [e.domain, e.subjectType, e.subjectKey].join(DIMENSION_KEY_DELIMITER);
}

/** Groups events by (domain, subjectType, subjectKey) - the pattern's dimension. Pure. */
export function groupEvents(events: readonly EvidenceEventInput[]): ReadonlyMap<string, DimensionGroup> {
  const groups = new Map<string, DimensionGroup>();
  for (const event of events) {
    const key = dimensionKeyOf(event);
    const existing = groups.get(key);
    if (existing) {
      groups.set(key, { dimension: existing.dimension, events: [...existing.events, event] });
    } else {
      groups.set(key, {
        dimension: { domain: event.domain, subjectType: event.subjectType, subjectKey: event.subjectKey },
        events: [event],
      });
    }
  }
  return groups;
}

/**
 * Turns one dimension's accumulated evidence events into a candidate pattern,
 * or `undefined` if the evidence does not clear the structural bar (too few
 * polarised events, or no clear majority direction). Pure.
 */
function detectPatternForDimension(dimension: DimensionKey, events: readonly EvidenceEventInput[]): DetectedPattern | undefined {
  const positive = events.filter((e) => e.direction === "positive");
  const negative = events.filter((e) => e.direction === "negative");
  const polarised = positive.length + negative.length;

  // Hard structural guard - see module header. Neutral events accumulate as
  // evidence but never count towards a directional pattern.
  if (polarised < MIN_EVIDENCE_COUNT) return undefined;

  const direction: SignalDirection = positive.length >= negative.length ? "positive" : "negative";
  const agreeing = direction === "positive" ? positive : negative;
  const consistency = agreeing.length / polarised;

  if (consistency < MIN_CONSISTENCY) return undefined;

  const confidence = bucketConfidence(polarised);
  const rationale = `${agreeing.length} of ${polarised} recent outcomes for ${dimension.subjectType} "${dimension.subjectKey}" were ${direction} (${dimension.domain}).`;

  return {
    domain: dimension.domain,
    subjectType: dimension.subjectType,
    subjectKey: dimension.subjectKey,
    direction,
    evidenceCount: polarised,
    consistency,
    confidence,
    supportingEventIds: agreeing.map((e) => e.id),
    rationale,
  };
}

/**
 * Detects candidate patterns across every dimension present in `events`. Pure
 * - the caller (`recordOutcomeAndDetect`, below) is responsible for supplying
 * an already-windowed event list (e.g. "last 90 days") and for persisting the
 * result via `upsertSignal`. Returns at most one pattern per dimension, never
 * more than one direction per dimension (majority wins, per
 * `detectPatternForDimension`).
 */
export function detectPatterns(events: readonly EvidenceEventInput[]): readonly DetectedPattern[] {
  const groups = groupEvents(events);
  const patterns: DetectedPattern[] = [];
  for (const group of Array.from(groups.values())) {
    const pattern = detectPatternForDimension(group.dimension, group.events);
    if (pattern) patterns.push(pattern);
  }
  return patterns;
}

// ---------------------------------------------------------------------------
// I/O orchestration - thin, injectable, no reasoning of its own beyond what
// the pure functions above already decided (mirrors the OD1 Opportunity
// Delivery Framework's collectOpportunities/resolveOpportunity split).
// ---------------------------------------------------------------------------

/** No pattern re-detection looks further back than this - "recent, accumulated evidence", not a household's entire history. */
export const EVIDENCE_WINDOW_DAYS = 90;

export interface RecordOutcomeRequest {
  readonly householdId: number;
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly subjectKey: string;
  readonly outcomeType: string;
  readonly direction: EvidenceDirection;
  readonly context?: Record<string, unknown> | null;
  readonly sourceCapabilityId: string;
  /**
   * When the outcome actually happened. Omitted by every live caller, because a live outcome
   * happens now, and the store defaults to `NOW()`.
   *
   * It exists for callers reconstructing a household's accumulated history rather than observing
   * it as it occurs — today, only the Benchmark World seeder, whose fixtures express evidence as
   * day-offsets from the reset instant. Before this, that seeder had to bypass this orchestrator
   * and re-implement detection against the raw store, which is how it came to run detection with
   * no `EVIDENCE_WINDOW_DAYS` filter at all (BENCHINT1 D7).
   *
   * This does not weaken the window. A backdated event still enters detection through the same
   * `since` filter below, so an event older than EVIDENCE_WINDOW_DAYS is recorded and then
   * correctly ignored by detection — exactly as an event that aged out would be.
   */
  readonly occurredAt?: Date;
}

export interface RecordOutcomeResult {
  readonly event: HouseholdEvidenceEvent;
  /** The re-evaluated signal for this exact dimension, if this event's window now clears the detection bar. Null when no pattern exists yet - never fabricated, never a partial guess. */
  readonly signal: HouseholdLearningSignal | null;
}

/**
 * Appends one evidence event, then re-runs detection over ONLY that event's own
 * dimension (household + domain + subjectType + subjectKey) within the last
 * EVIDENCE_WINDOW_DAYS. A single new event can only ever refresh (or, once the
 * structural bar is cleared, create) the pattern for its OWN dimension - it can
 * never single-handedly manufacture a signal for a dimension it does not belong
 * to, and (per detectPatterns' own guard) can never alone push a fresh dimension
 * over MIN_EVIDENCE_COUNT.
 */
export async function recordOutcomeAndDetect(
  request: RecordOutcomeRequest,
  store: IEvidenceLearningStore,
): Promise<RecordOutcomeResult> {
  const event = await store.recordEvent(request);

  const since = new Date(Date.now() - EVIDENCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const windowEvents = await store.listEvents({
    householdId: request.householdId,
    domain: request.domain,
    subjectType: request.subjectType,
    subjectKey: request.subjectKey,
    since,
  });

  // windowEvents is already scoped to exactly one dimension, so at most one pattern returns.
  const [pattern] = detectPatterns(
    windowEvents.map((e) => ({
      id: e.id,
      domain: e.domain,
      subjectType: e.subjectType,
      subjectKey: e.subjectKey,
      direction: e.direction as EvidenceDirection,
    })),
  );

  if (!pattern) return { event, signal: null };

  const signal = await store.upsertSignal({
    householdId: request.householdId,
    domain: pattern.domain,
    subjectType: pattern.subjectType,
    subjectKey: pattern.subjectKey,
    direction: pattern.direction,
    evidenceCount: pattern.evidenceCount,
    consistency: pattern.consistency,
    confidence: pattern.confidence,
    supportingEventIds: pattern.supportingEventIds,
    rationale: pattern.rationale,
  } satisfies DerivedSignalInput);

  return { event, signal };
}

/** 1:1 forward - kept here (not called directly in the handler) so every store access for this capability goes through this module, mirroring the rest of the platform's port discipline. */
export async function listHouseholdSignals(
  query: SignalQuery,
  store: IEvidenceLearningStore,
): Promise<readonly HouseholdLearningSignal[]> {
  return store.listSignals(query);
}

/**
 * Confirm or decline a pending signal. Returns `null` (an honest gap for the
 * handler to surface) when no signal with this id exists, OR when it exists
 * but belongs to a different household - the caller's own householdId is
 * always checked here so a guessed/borrowed signal id can never resolve
 * another household's pattern (no cross-household read or write, mirrors
 * every other ownership-scoped verb on this platform).
 */
export async function decideSignal(
  input: ConfirmSignalInput,
  householdId: number,
  store: IEvidenceLearningStore,
): Promise<HouseholdLearningSignal | null> {
  const existing = await store.getSignal(input.id);
  if (!existing || existing.householdId !== householdId) return null;
  return store.confirmSignal(input);
}
