/**
 * execution-timeline.ts — OBS2 Execution Timeline
 * ================================================
 * Pure projections that reconstruct the complete execution path of individual
 * Companion interactions from Observation Engine rows — nothing else. The
 * timeline is the Observation Engine's read model of "what actually ran":
 * intent resolution → capability invocations → knowledge retrieval → context
 * composition → response generation, plus clarifications, recoveries,
 * escalations and later user feedback.
 *
 * OWNERSHIP AND HONESTY RULES:
 *  - Input is PlatformObservation[] only. No conversation, capability, or
 *    Behaviour Engine data is read; the Behaviour Engine never owns timeline
 *    data. There is no timeline table — every view here is computed on read
 *    from platform_observations (no duplicate telemetry or state).
 *  - BEH1: the Behaviour Engine's sealed decision reaches this projection the
 *    same way every other stage does — as an observation row the gateway
 *    recorded. This module never calls the Behaviour Engine, and the Behaviour
 *    Engine never calls this module.
 *  - Correlation uses the Observation Engine's own identifiers: sessionId
 *    (conversation thread) groups an interaction; metadata.turnId (the
 *    persisted user-turn id, recorded since OBS2) groups one turn exactly.
 *    Rows recorded before OBS2 carry no turnId, so they are grouped by an
 *    honest boundary heuristic (a new turn starts at each intent-resolution)
 *    and labelled `correlation: "reconstructed"` — never presented as exact.
 *  - The user's request text is never available here BY DESIGN: the
 *    Observation Engine records shapes, timings and outcomes, never utterance
 *    content next to a user id. The timeline says so instead of guessing.
 *  - Timestamps are recorded when a stage's observation is persisted (stage
 *    end, fire-and-forget), so inter-stage gaps are approximate; per-stage
 *    durationMs is the stage's own measured wall time.
 *
 * DB-free testable: run with rows from the InMemoryObservationStore.
 * Run tests: npx tsx server/tests/test-intelligence-execution-timeline.ts
 */

import type { PlatformObservation } from "@shared/schema";

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

/** One observation, positioned inside a turn's chronological flow. */
export interface TimelineEvent {
  id: number;
  observedAt: string;
  kind: string;
  /** Human-readable stage name for the kind (display only). */
  stage: string;
  severity: string;
  outcome: string | null;
  capability: string | null;
  verb: string | null;
  intent: string | null;
  confidence: number | null;
  /** The stage's own measured processing time, when the capture point timed it. */
  durationMs: number | null;
  /** Approximate gap since the previous event in this turn (persist-time delta). */
  sincePreviousMs: number | null;
  recoveryPath: string | null;
  surface: string | null;
  userId: number | null;
  sessionId: string | null;
  metadata: Record<string, unknown>;
}

/**
 * BEH1 — the Behaviour Engine's sealed decision for one turn, projected from
 * its `behaviour-decision` observation. Read-only telemetry: the Behaviour
 * Engine owns the decision, the Observation Engine owns this row, and the
 * timeline owns neither — it projects.
 */
export interface TimelineBehaviourDecision {
  /** The voice actually applied. */
  personalityId: string | null;
  personalityName: string | null;
  /** The raw stored preference this turn, or null when none was stored. */
  requestedPersonality: string | null;
  overrideApplied: boolean;
  overrideReason: string | null;
  /** Voice provenance (1 = the user's explicit choice; 0 = platform default) — never a quality score. */
  confidence: number | null;
  confidenceBasis: string | null;
  outcome: string | null;
  /** The seams the transform genuinely touched. Empty on a `not-voiced` turn. */
  surfaces: string[];
  /** The engine's own deterministic explanation of the decision. */
  reasoning: string[];
  fallbackState: string | null;
  guidanceCount: number | null;
  /** Present only when no voice transform ran — states which copy spoke instead. */
  notVoicedReason: string | null;
}

/** One reconstructed conversation turn. Every field is honest-null when the
 *  window simply did not record that stage — never a fabricated value. */
export interface TimelineTurn {
  /** The user-turn correlation id, or null for pre-OBS2 reconstructed turns. */
  turnId: string | null;
  /** "exact" when grouped by turnId; "reconstructed" when boundary-heuristic. */
  correlation: "exact" | "reconstructed";
  startedAt: string;
  endedAt: string;
  /** Persist-time span across the turn's pipeline events (feedback excluded —
   *  it arrives whenever the user rates, not during execution). */
  wallClockMs: number | null;
  /** Sum of the measured per-stage durations (stages can overlap). */
  stageDurationTotalMs: number | null;
  /** The Observation Engine never records the utterance (privacy by design). */
  userRequestRecorded: false;
  intent: string | null;
  intentOutcome: string | null;
  intentConfidence: number | null;
  capabilities: { capability: string; verb: string | null; outcome: string | null; durationMs: number | null }[];
  contextViews: string[];
  /** NCV1 — false for turns recorded before the rollout, whose views carry no classification. */
  contextViewsClassified: boolean;
  /** Views the payload's owner declared in the Context View registry. Empty when unclassified. */
  nativeContextViews: string[];
  /** Views the engine derived generically from the payload's structure. Empty when unclassified. */
  genericContextViews: string[];
  knowledgeSources: string[];
  /** The behaviour (personality voice) that phrased this turn, when recorded. */
  behaviour: string | null;
  /** BEH1 — the full sealed decision. Null for turns recorded before BEH1. */
  behaviourDecision: TimelineBehaviourDecision | null;
  responseGeneration: { outcome: string | null; durationMs: number | null; model: string | null } | null;
  clarifications: { outcome: string | null; hasPrompt: boolean }[];
  recoveries: { outcome: string | null; recoveryPath: string | null }[];
  escalations: { outcome: string | null; recoveryPath: string | null }[];
  feedback: { rating: string | null; reasonCode: string | null; observedAt: string }[];
  /** True when anything in the turn failed, recovered, clarified or escalated. */
  attention: boolean;
  events: TimelineEvent[];
}

export interface ExecutionTimeline {
  sessionId: string;
  startedAt: string | null;
  endedAt: string | null;
  turnCount: number;
  userIds: number[];
  /** Why "User request" never appears: stated, not silently omitted. */
  privacyNote: string;
  turns: TimelineTurn[];
  /** Events that belong to the session but to no reconstructable turn
   *  (e.g. legacy feedback rows recorded before turn correlation existed). */
  unassigned: TimelineEvent[];
}

export interface TimelineSessionSummary {
  sessionId: string;
  firstObservedAt: string;
  lastObservedAt: string;
  observationCount: number;
  turnCount: number;
  userIds: number[];
  surfaces: string[];
  capabilities: string[];
  intents: string[];
  errorCount: number;
  clarificationCount: number;
  recoveryCount: number;
  escalationCount: number;
  feedbackUp: number;
  feedbackDown: number;
  /** True when the session contains anything worth an operator's attention. */
  attention: boolean;
}

/** Filters for the session listing — all optional, combined with AND. */
export interface TimelineSessionFilter {
  readonly userId?: number;
  readonly capability?: string;
  readonly intent?: string;
  readonly sessionId?: string;
}

export const TIMELINE_PRIVACY_NOTE =
  "The user's request text is not recorded by design: the Observation Engine stores " +
  "shapes, timings and outcomes, never utterance content alongside a user id. The " +
  "resolved intent is the closest recorded signal of what was asked.";

// ---------------------------------------------------------------------------
// Stage vocabulary
// ---------------------------------------------------------------------------

/** Display names for the closed observation-kind taxonomy. */
const STAGE_LABELS: Record<string, string> = {
  "intent-resolution": "Intent identified",
  "capability-invocation": "Capability invoked",
  "clarification": "Clarification requested",
  "knowledge-retrieval": "Knowledge consulted",
  "context-composition": "Context composed",
  "behaviour-decision": "Behaviour decided",
  "behaviour-selection": "Companion voice selected",
  "response-generation": "Response generated",
  "recovery": "Recovery action",
  "escalation": "Escalation",
  "manual-override": "Manual override confirmed",
  "user-feedback": "User feedback",
  "benchmark-run": "Benchmark run",
};

function stageLabel(kind: string): string {
  return STAGE_LABELS[kind] ?? kind;
}

// ---------------------------------------------------------------------------
// Row helpers
// ---------------------------------------------------------------------------

function meta(row: PlatformObservation): Record<string, unknown> {
  return (row.metadata ?? {}) as Record<string, unknown>;
}

function metaTurnId(row: PlatformObservation): string | null {
  const value = meta(row).turnId;
  return typeof value === "string" && value ? value : null;
}

function metaStrings(row: PlatformObservation, key: string): string[] {
  const value = meta(row)[key];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function metaString(row: PlatformObservation, key: string): string | null {
  const value = meta(row)[key];
  return typeof value === "string" ? value : null;
}

function metaNumber(row: PlatformObservation, key: string): number | null {
  const value = meta(row)[key];
  return typeof value === "number" ? value : null;
}

/** BEH1 — project a `behaviour-decision` row into the turn's decision record. */
function toBehaviourDecision(row: PlatformObservation): TimelineBehaviourDecision {
  return {
    personalityId: metaString(row, "personalityId"),
    personalityName: metaString(row, "personalityName"),
    requestedPersonality: metaString(row, "requestedPersonality"),
    overrideApplied: meta(row).overrideApplied === true,
    overrideReason: metaString(row, "overrideReason"),
    // The provenance confidence lives in the row's own column, not the bag.
    confidence: row.confidence,
    confidenceBasis: metaString(row, "confidenceBasis"),
    outcome: row.outcome,
    surfaces: metaStrings(row, "surfaces"),
    reasoning: metaStrings(row, "reasoning"),
    fallbackState: metaString(row, "fallbackState"),
    guidanceCount: metaNumber(row, "guidanceCount"),
    notVoicedReason: metaString(row, "notVoicedReason"),
  };
}

function byTime(a: PlatformObservation, b: PlatformObservation): number {
  return a.observedAt.getTime() - b.observedAt.getTime() || a.id - b.id;
}

function toEvent(row: PlatformObservation, previous: PlatformObservation | null): TimelineEvent {
  return {
    id: row.id,
    observedAt: row.observedAt.toISOString(),
    kind: row.kind,
    stage: stageLabel(row.kind),
    severity: row.severity,
    outcome: row.outcome,
    capability: row.capability,
    verb: row.verb,
    intent: row.intent,
    confidence: row.confidence,
    durationMs: row.durationMs,
    sincePreviousMs: previous ? row.observedAt.getTime() - previous.observedAt.getTime() : null,
    recoveryPath: row.recoveryPath,
    surface: row.surface,
    userId: row.userId,
    sessionId: row.sessionId,
    metadata: meta(row),
  };
}

// ---------------------------------------------------------------------------
// Turn grouping
// ---------------------------------------------------------------------------

interface TurnGroup {
  turnId: string | null;
  correlation: "exact" | "reconstructed";
  rows: PlatformObservation[];
}

/**
 * Group one session's rows into turns.
 *  - Rows carrying metadata.turnId group exactly by that id.
 *  - Legacy rows without a turnId are clustered by boundary heuristic: each
 *    intent-resolution starts a new turn; rows before the first resolution
 *    form their own leading cluster (e.g. a write-intent escalation turn).
 *  - Legacy user-feedback rows without a turnId are NOT guessed into a turn —
 *    feedback can arrive long after execution, so they stay unassigned.
 */
function groupIntoTurns(rows: PlatformObservation[]): { turns: TurnGroup[]; unassigned: PlatformObservation[] } {
  const exact = new Map<string, PlatformObservation[]>();
  const loose: PlatformObservation[] = [];
  const unassigned: PlatformObservation[] = [];

  for (const row of rows) {
    const turnId = metaTurnId(row);
    if (turnId) {
      const list = exact.get(turnId) ?? [];
      list.push(row);
      exact.set(turnId, list);
    } else if (row.kind === "user-feedback") {
      unassigned.push(row);
    } else {
      loose.push(row);
    }
  }

  const turns: TurnGroup[] = Array.from(exact.entries()).map(([turnId, turnRows]) => ({
    turnId,
    correlation: "exact" as const,
    rows: turnRows.slice().sort(byTime),
  }));

  let cluster: PlatformObservation[] = [];
  const flush = () => {
    if (cluster.length > 0) {
      turns.push({ turnId: null, correlation: "reconstructed", rows: cluster });
      cluster = [];
    }
  };
  for (const row of loose) {
    if (row.kind === "intent-resolution") flush();
    cluster.push(row);
  }
  flush();

  turns.sort((a, b) => byTime(a.rows[0], b.rows[0]));
  return { turns, unassigned };
}

function buildTurn(group: TurnGroup): TimelineTurn {
  const rows = group.rows;
  const events: TimelineEvent[] = rows.map((row, i) => toEvent(row, i > 0 ? rows[i - 1] : null));

  const ofKind = (kind: string) => rows.filter((r) => r.kind === kind);
  const pipeline = rows.filter((r) => r.kind !== "user-feedback");
  const durations = pipeline
    .map((r) => r.durationMs)
    .filter((d): d is number => d !== null && d !== undefined);

  const resolution = ofKind("intent-resolution")[0] ?? null;
  const generation = ofKind("response-generation")[0] ?? null;
  const composition = ofKind("context-composition");
  const retrievals = ofKind("knowledge-retrieval");

  // BEH1 — the Behaviour Engine's sealed decision is the canonical record of
  // the voice for this turn. Turns recorded before BEH1 carry no decision row,
  // so the legacy signal is preserved: the personality crumb OBS2 wrote into
  // whichever observation voiced the turn (generation on success, recovery on
  // fallback). Absent both, the voice is honestly unknown — never guessed.
  const decisionRow = ofKind("behaviour-decision")[0] ?? null;
  const behaviourDecision = decisionRow ? toBehaviourDecision(decisionRow) : null;
  const behaviour =
    behaviourDecision?.personalityId ??
    (generation && metaString(generation, "personalityId")) ??
    ofKind("recovery").map((r) => metaString(r, "personalityId")).find((p) => p != null) ??
    null;

  const contextViews = Array.from(new Set(composition.flatMap((r) => metaStrings(r, "views"))));
  const knowledgeSources = Array.from(new Set(retrievals.flatMap((r) => metaStrings(r, "sources"))));

  // NCV1 — which of this turn's Context Views the payload's owner declared, and which
  // the engine derived generically. A turn recorded before NCV1 classified neither, so
  // both lists are empty while `contextViews` is not: absent, never reconstructed —
  // the same discipline OBS2 applies to a pre-OBS2 turn's behaviour decision.
  const contextViewsClassified = composition.some((r) => Array.isArray(meta(r).nativeViews));
  const nativeContextViews = Array.from(new Set(composition.flatMap((r) => metaStrings(r, "nativeViews"))));
  const genericContextViews = Array.from(new Set(composition.flatMap((r) => metaStrings(r, "genericViews"))));

  const attention = rows.some(
    (r) =>
      r.severity === "error" ||
      r.kind === "clarification" ||
      r.kind === "recovery" ||
      r.kind === "escalation" ||
      (r.kind === "user-feedback" && r.outcome === "down"),
  );

  const first = pipeline[0] ?? rows[0];
  const last = pipeline[pipeline.length - 1] ?? rows[rows.length - 1];

  return {
    turnId: group.turnId,
    correlation: group.correlation,
    startedAt: rows[0].observedAt.toISOString(),
    endedAt: rows[rows.length - 1].observedAt.toISOString(),
    wallClockMs: pipeline.length > 0 ? last.observedAt.getTime() - first.observedAt.getTime() + (first.durationMs ?? 0) : null,
    stageDurationTotalMs: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) : null,
    userRequestRecorded: false,
    intent: resolution?.intent ?? null,
    intentOutcome: resolution?.outcome ?? null,
    intentConfidence: resolution?.confidence ?? null,
    capabilities: ofKind("capability-invocation")
      .filter((r) => r.capability !== null)
      .map((r) => ({
        capability: r.capability as string,
        verb: r.verb,
        outcome: r.outcome,
        durationMs: r.durationMs,
      })),
    contextViews,
    contextViewsClassified,
    nativeContextViews,
    genericContextViews,
    knowledgeSources,
    behaviour,
    behaviourDecision,
    responseGeneration: generation
      ? { outcome: generation.outcome, durationMs: generation.durationMs, model: metaString(generation, "model") }
      : null,
    clarifications: ofKind("clarification").map((r) => ({
      outcome: r.outcome,
      hasPrompt: meta(r).hasClarificationPrompt === true,
    })),
    recoveries: ofKind("recovery").map((r) => ({ outcome: r.outcome, recoveryPath: r.recoveryPath })),
    escalations: ofKind("escalation").map((r) => ({ outcome: r.outcome, recoveryPath: r.recoveryPath })),
    feedback: ofKind("user-feedback").map((r) => ({
      rating: r.outcome,
      reasonCode: metaString(r, "reasonCode"),
      observedAt: r.observedAt.toISOString(),
    })),
    attention,
    events,
  };
}

// ---------------------------------------------------------------------------
// The timeline projection
// ---------------------------------------------------------------------------

/** Reconstruct the execution timeline of one session (conversation thread). */
export function buildExecutionTimeline(rows: PlatformObservation[], sessionId: string): ExecutionTimeline {
  const sessionRows = rows
    .filter((r) => r.sessionId === sessionId && r.kind !== "benchmark-run")
    .sort(byTime);

  const { turns, unassigned } = groupIntoTurns(sessionRows);

  return {
    sessionId,
    startedAt: sessionRows.length > 0 ? sessionRows[0].observedAt.toISOString() : null,
    endedAt: sessionRows.length > 0 ? sessionRows[sessionRows.length - 1].observedAt.toISOString() : null,
    turnCount: turns.length,
    userIds: Array.from(new Set(sessionRows.map((r) => r.userId).filter((u): u is number => u !== null))),
    privacyNote: TIMELINE_PRIVACY_NOTE,
    turns: turns.map(buildTurn),
    unassigned: unassigned.map((row) => toEvent(row, null)),
  };
}

// ---------------------------------------------------------------------------
// Session listing (the timeline picker)
// ---------------------------------------------------------------------------

/**
 * Summaries of every session in the window, newest activity first, filterable
 * by user, capability, intent and session id (date bounding is the caller's
 * window). Benchmark runs use sessionId as a run id, not a conversation — they
 * are excluded so the picker lists interactions only.
 */
export function summarizeTimelineSessions(
  rows: PlatformObservation[],
  filter: TimelineSessionFilter = {},
): TimelineSessionSummary[] {
  const bySession = new Map<string, PlatformObservation[]>();
  for (const row of rows) {
    if (!row.sessionId || row.kind === "benchmark-run") continue;
    const list = bySession.get(row.sessionId) ?? [];
    list.push(row);
    bySession.set(row.sessionId, list);
  }

  const summaries: TimelineSessionSummary[] = [];
  // Array.from: this tsconfig's target cannot iterate MapIterator directly.
  for (const [sessionId, sessionRows] of Array.from(bySession.entries())) {
    sessionRows.sort(byTime);
    const userIds = Array.from(new Set(sessionRows.map((r) => r.userId).filter((u): u is number => u !== null)));
    const capabilities = Array.from(
      new Set(sessionRows.map((r) => r.capability).filter((c): c is string => c !== null)),
    );
    const intents = Array.from(new Set(sessionRows.map((r) => r.intent).filter((i): i is string => i !== null)));

    if (filter.sessionId && sessionId !== filter.sessionId) continue;
    if (filter.userId !== undefined && !userIds.includes(filter.userId)) continue;
    if (filter.capability && !capabilities.includes(filter.capability)) continue;
    if (filter.intent && !intents.includes(filter.intent)) continue;

    const { turns } = groupIntoTurns(sessionRows);
    const count = (kind: string) => sessionRows.filter((r) => r.kind === kind).length;
    const errorCount = sessionRows.filter((r) => r.severity === "error").length;
    const feedbackUp = sessionRows.filter((r) => r.kind === "user-feedback" && r.outcome === "up").length;
    const feedbackDown = sessionRows.filter((r) => r.kind === "user-feedback" && r.outcome === "down").length;

    summaries.push({
      sessionId,
      firstObservedAt: sessionRows[0].observedAt.toISOString(),
      lastObservedAt: sessionRows[sessionRows.length - 1].observedAt.toISOString(),
      observationCount: sessionRows.length,
      turnCount: turns.length,
      userIds,
      surfaces: Array.from(new Set(sessionRows.map((r) => r.surface).filter((s): s is string => s !== null))),
      capabilities,
      intents,
      errorCount,
      clarificationCount: count("clarification"),
      recoveryCount: count("recovery"),
      escalationCount: count("escalation"),
      feedbackUp,
      feedbackDown,
      attention: errorCount > 0 || count("clarification") > 0 || count("recovery") > 0 || count("escalation") > 0 || feedbackDown > 0,
    });
  }

  return summaries.sort((a, b) => b.lastObservedAt.localeCompare(a.lastObservedAt) || a.sessionId.localeCompare(b.sessionId));
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Flatten a timeline to CSV: one row per event, carrying its turn context. */
export function timelineToCsv(timeline: ExecutionTimeline): string {
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    "sessionId", "turnId", "turnCorrelation", "observationId", "observedAt", "stage",
    "kind", "severity", "outcome", "capability", "verb", "intent", "confidence",
    "durationMs", "sincePreviousMs", "recoveryPath", "surface", "userId", "metadata",
  ];
  const eventRow = (turnId: string | null, correlation: string, e: TimelineEvent): string =>
    [
      timeline.sessionId, turnId, correlation, e.id, e.observedAt, e.stage,
      e.kind, e.severity, e.outcome, e.capability, e.verb, e.intent, e.confidence,
      e.durationMs, e.sincePreviousMs, e.recoveryPath, e.surface, e.userId, e.metadata,
    ].map(esc).join(",");

  return [
    header.join(","),
    ...timeline.turns.flatMap((t) => t.events.map((e) => eventRow(t.turnId, t.correlation, e))),
    ...timeline.unassigned.map((e) => eventRow(null, "unassigned", e)),
  ].join("\n");
}
