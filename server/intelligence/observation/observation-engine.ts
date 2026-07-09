/**
 * observation-engine.ts — OBS1 Observation Engine
 * =================================================
 * The canonical telemetry service of the Intelligence Platform: the single
 * owner of runtime observations. Every component that wants to record "what
 * happened, how confidently, how fast, with what outcome" does it through
 * `recordObservation` — and every operator view of that record is computed by
 * the pure aggregation functions below. No second telemetry system may exist.
 *
 * WHAT THIS ENGINE IS NOT:
 *  - It is NOT the Companion Notice Engine (notice-engine.ts) — user-facing
 *    ambient notices about the household's own data. The two are disjoint by
 *    architecture: notices face the user; observations face the operator.
 *  - It is NOT a capability, and it never changes business behaviour: capture
 *    is fire-and-forget, exception-isolated, and disableable
 *    (OBS_DISABLE_CAPTURE=1) without any functional difference.
 *
 * PRIVACY RULES (enforced at every capture point):
 *  - No utterance and no capability result payload is ever recorded alongside
 *    a user id. Metadata carries shapes, names, counts and timings — not
 *    content. Feedback notes are recorded as `hasNote`, never the text.
 *  - userId is nullable and cascade-deleted with the user.
 *
 * Aggregations are pure functions over PlatformObservation[] so the Admin
 * Workbench views are DB-free testable (run with the InMemoryObservationStore).
 *
 * Run tests: npx tsx server/tests/test-intelligence-observation-telemetry.ts
 */

import type { PlatformObservation } from "@shared/schema";
import type { IObservationStore } from "./observation-contract.js";

// ---------------------------------------------------------------------------
// The closed observation taxonomy
// ---------------------------------------------------------------------------

/**
 * Closed vocabulary of what the platform observes. Growing it is an
 * architecture decision (extend this union + document the capture point);
 * an event that fits no kind is not recorded — never guessed into one.
 *
 * Domain intelligence (planner, shopping, food intelligence, discovery…) is
 * deliberately NOT a separate kind: every domain capability is invoked through
 * the one Intent Engine choke point and therefore appears as
 * `capability-invocation` rows sliced by its capability id.
 */
export const OBSERVATION_KINDS = [
  "intent-resolution",      // resolver ran: top confidence, gap kind, intent count
  "capability-invocation",  // Intent Engine routed one (verb × capability): outcome + duration
  "context-composition",    // Context Composition Engine composed grounding: timings + budget
  "knowledge-retrieval",    // knowledge assembly: grounded vs honest gap
  "response-generation",    // LLM turn: model, duration, ok/error
  "behaviour-decision",     // BEH1: the voice applied to one interaction — provenance, surfaces, outcome
  "clarification",          // the resolver could not understand — clarification surfaced
  "recovery",               // turn fell back: state + recovery path taken
  "escalation",             // refusal/redirect to manual action (e.g. write-intent guard)
  "manual-override",        // a confirmation-gated action was explicitly confirmed
  "user-feedback",          // thumbs up / down on an assistant turn
  "benchmark-run",          // one benchmark execution: score, pass metrics, duration
] as const;

export type ObservationKind = (typeof OBSERVATION_KINDS)[number];

export type ObservationSeverity = "info" | "warning" | "error";

/** Input to recordObservation — everything optional except the kind. */
export interface NewObservation {
  readonly kind: ObservationKind;
  readonly severity?: ObservationSeverity;
  readonly outcome?: string;
  readonly userId?: number;
  readonly sessionId?: string;
  /**
   * OBS2 — per-turn correlation id (the persisted user-turn id for
   * conversation observations). Finer-grained than sessionId: every
   * observation one conversation turn emits shares the same turnId, so the
   * Execution Timeline can group a turn's events exactly instead of guessing
   * at boundaries. Stored in the metadata bag (the schema's extensibility
   * rule: new analytical needs never add columns).
   */
  readonly turnId?: string;
  readonly surface?: string;
  readonly capability?: string;
  readonly verb?: string;
  readonly contextView?: string;
  readonly confidence?: number;
  readonly durationMs?: number;
  readonly recoveryPath?: string;
  readonly metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// The record seam — fire-and-forget, exception-isolated, disableable
// ---------------------------------------------------------------------------

let activeStore: IObservationStore | null = null;
let storeLoadFailed = false;

/** Tests (and boot code) may inject a store; otherwise the durable one loads lazily. */
export function setObservationStore(store: IObservationStore | null): void {
  activeStore = store;
  storeLoadFailed = false;
}

function captureDisabled(): boolean {
  return process.env.OBS_DISABLE_CAPTURE === "1";
}

async function resolveStore(): Promise<IObservationStore | null> {
  if (activeStore) return activeStore;
  if (storeLoadFailed) return null;
  try {
    // Lazy import so pure consumers and DB-free tests never load server/db.ts.
    const { observationStore } = await import("./observation-store.js");
    activeStore = observationStore;
    return activeStore;
  } catch (err) {
    storeLoadFailed = true;
    console.error(
      "[ObservationEngine] durable store unavailable — capture disabled:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Record one observation. Never throws, never blocks, never alters the
 * observed operation — a telemetry failure is logged and swallowed.
 */
export function recordObservation(input: NewObservation): void {
  if (captureDisabled()) return;
  try {
    const row = {
      kind: input.kind,
      severity: input.severity ?? "info",
      outcome: input.outcome ?? null,
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      surface: input.surface ?? null,
      capability: input.capability ?? null,
      verb: input.verb ?? null,
      intent:
        input.capability && input.verb
          ? `${input.capability}:${input.verb}`
          : null,
      contextView: input.contextView ?? null,
      confidence: input.confidence ?? null,
      durationMs: input.durationMs ?? null,
      recoveryPath: input.recoveryPath ?? null,
      // OBS2: the turn correlation id rides in the metadata bag, never a column.
      metadata: input.turnId ? { turnId: input.turnId, ...input.metadata } : input.metadata ?? {},
    };
    void resolveStore()
      .then((store) => store?.record(row))
      .catch((err) =>
        console.error(
          "[ObservationEngine] record failed:",
          err instanceof Error ? err.message : err,
        ),
      );
  } catch (err) {
    console.error(
      "[ObservationEngine] record failed:",
      err instanceof Error ? err.message : err,
    );
  }
}

// ---------------------------------------------------------------------------
// Pure aggregation helpers (shared)
// ---------------------------------------------------------------------------

/** Outcomes counted as success / neutral for capability invocations. */
const OK_OUTCOME = "ok";
const NEUTRAL_OUTCOMES = new Set(["confirmation_required"]);

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function round(value: number | null, dp = 3): number | null {
  if (value === null || Number.isNaN(value)) return null;
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}

function dayOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function countBy<T>(items: T[], key: (item: T) => string | null | undefined): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

function toCounts(map: Map<string, number>): { key: string; count: number }[] {
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

function ofKind(rows: PlatformObservation[], kind: ObservationKind): PlatformObservation[] {
  return rows.filter((r) => r.kind === kind);
}

function durations(rows: PlatformObservation[]): number[] {
  return rows.map((r) => r.durationMs).filter((d): d is number => d !== null && d !== undefined);
}

function confidences(rows: PlatformObservation[]): number[] {
  return rows.map((r) => r.confidence).filter((c): c is number => c !== null && c !== undefined);
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface ObservationOverview {
  windowDays: number;
  total: number;
  successRate: number | null;
  failureRate: number | null;
  clarificationRate: number | null;
  averageConfidence: number | null;
  averageResponseTimeMs: number | null;
  averageContextCompositionMs: number | null;
  byKind: { kind: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byDay: { day: string; total: number; errors: number }[];
}

export function summarizeOverview(rows: PlatformObservation[], windowDays: number): ObservationOverview {
  const invocations = ofKind(rows, "capability-invocation");
  const resolutions = ofKind(rows, "intent-resolution");
  const clarifications = ofKind(rows, "clarification");
  const generation = ofKind(rows, "response-generation");
  const composition = ofKind(rows, "context-composition");

  const okCount = invocations.filter((r) => r.outcome === OK_OUTCOME).length;
  const neutralCount = invocations.filter((r) => r.outcome !== null && NEUTRAL_OUTCOMES.has(r.outcome)).length;
  const judged = invocations.length - neutralCount;

  const byDayMap = new Map<string, { total: number; errors: number }>();
  for (const r of rows) {
    const day = dayOf(r.observedAt);
    const entry = byDayMap.get(day) ?? { total: 0, errors: 0 };
    entry.total += 1;
    if (r.severity === "error") entry.errors += 1;
    byDayMap.set(day, entry);
  }

  return {
    windowDays,
    total: rows.length,
    successRate: judged > 0 ? round(okCount / judged) : null,
    failureRate: judged > 0 ? round((judged - okCount) / judged) : null,
    clarificationRate:
      resolutions.length > 0 ? round(clarifications.length / resolutions.length) : null,
    averageConfidence: round(mean(confidences(resolutions))),
    averageResponseTimeMs: round(mean(durations(generation)), 0),
    averageContextCompositionMs: round(mean(durations(composition)), 1),
    byKind: toCounts(countBy(rows, (r) => r.kind)).map(({ key, count }) => ({ kind: key, count })),
    bySeverity: toCounts(countBy(rows, (r) => r.severity)).map(({ key, count }) => ({ severity: key, count })),
    byDay: Array.from(byDayMap.entries())
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day)),
  };
}

// ---------------------------------------------------------------------------
// Capability view
// ---------------------------------------------------------------------------

export interface CapabilityObservationSummary {
  capability: string;
  total: number;
  ok: number;
  gaps: number;
  denied: number;
  errors: number;
  successRate: number | null;
  averageConfidence: number | null;
  averageDurationMs: number | null;
  trend: { day: string; total: number; failures: number }[];
}

export function summarizeCapabilities(rows: PlatformObservation[], windowDays: number): {
  windowDays: number;
  capabilities: CapabilityObservationSummary[];
} {
  const invocations = ofKind(rows, "capability-invocation");
  const resolutions = ofKind(rows, "intent-resolution");
  const byCapability = new Map<string, PlatformObservation[]>();
  for (const r of invocations) {
    if (!r.capability) continue;
    const list = byCapability.get(r.capability) ?? [];
    list.push(r);
    byCapability.set(r.capability, list);
  }

  const capabilities = Array.from(byCapability.entries()).map(([capability, capRows]) => {
    const ok = capRows.filter((r) => r.outcome === OK_OUTCOME).length;
    const gaps = capRows.filter((r) => r.outcome === "gap" || r.outcome === "unsupported_intent" || r.outcome === "not_executable").length;
    const denied = capRows.filter((r) => r.outcome === "denied").length;
    const errors = capRows.filter((r) => r.severity === "error").length;
    const neutral = capRows.filter((r) => r.outcome !== null && NEUTRAL_OUTCOMES.has(r.outcome)).length;
    const judged = capRows.length - neutral;

    const trendMap = new Map<string, { total: number; failures: number }>();
    for (const r of capRows) {
      const day = dayOf(r.observedAt);
      const entry = trendMap.get(day) ?? { total: 0, failures: 0 };
      entry.total += 1;
      if (r.outcome !== OK_OUTCOME && !(r.outcome !== null && NEUTRAL_OUTCOMES.has(r.outcome))) entry.failures += 1;
      trendMap.set(day, entry);
    }

    return {
      capability,
      total: capRows.length,
      ok,
      gaps,
      denied,
      errors,
      successRate: judged > 0 ? round(ok / judged) : null,
      averageConfidence: round(mean(confidences(resolutions.filter((r) => r.capability === capability)))),
      averageDurationMs: round(mean(durations(capRows)), 1),
      trend: Array.from(trendMap.entries())
        .map(([day, v]) => ({ day, ...v }))
        .sort((a, b) => a.day.localeCompare(b.day)),
    };
  });

  return { windowDays, capabilities: capabilities.sort((a, b) => b.total - a.total) };
}

// ---------------------------------------------------------------------------
// Intent view
// ---------------------------------------------------------------------------

export interface IntentObservationSummary {
  intent: string;
  capability: string | null;
  verb: string | null;
  total: number;
  failed: number;
  clarifications: number;
  averageConfidence: number | null;
}

export function summarizeIntents(rows: PlatformObservation[], windowDays: number): {
  windowDays: number;
  intents: IntentObservationSummary[];
  failedIntents: { intent: string; failed: number }[];
  confidenceDistribution: { bucket: string; count: number }[];
  clarificationRate: number | null;
} {
  const invocations = ofKind(rows, "capability-invocation");
  const resolutions = ofKind(rows, "intent-resolution");
  const clarifications = ofKind(rows, "clarification");

  const byIntent = new Map<string, PlatformObservation[]>();
  for (const r of invocations) {
    if (!r.intent) continue;
    const list = byIntent.get(r.intent) ?? [];
    list.push(r);
    byIntent.set(r.intent, list);
  }

  const intents = Array.from(byIntent.entries())
    .map(([intent, intentRows]) => {
      const failed = intentRows.filter(
        (r) => r.outcome !== OK_OUTCOME && !(r.outcome !== null && NEUTRAL_OUTCOMES.has(r.outcome)),
      ).length;
      return {
        intent,
        capability: intentRows[0]?.capability ?? null,
        verb: intentRows[0]?.verb ?? null,
        total: intentRows.length,
        failed,
        clarifications: 0, // clarifications precede routing and carry no intent — reported at window level
        averageConfidence: round(mean(confidences(resolutions.filter((r) => r.intent === intent)))),
      };
    })
    .sort((a, b) => b.total - a.total);

  const buckets = new Array(10).fill(0) as number[];
  for (const c of confidences(resolutions)) {
    const idx = Math.min(9, Math.max(0, Math.floor(c * 10)));
    buckets[idx] += 1;
  }

  return {
    windowDays,
    intents,
    failedIntents: intents
      .filter((i) => i.failed > 0)
      .sort((a, b) => b.failed - a.failed)
      .map((i) => ({ intent: i.intent, failed: i.failed })),
    confidenceDistribution: buckets.map((count, i) => ({
      bucket: `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`,
      count,
    })),
    clarificationRate:
      resolutions.length > 0 ? round(clarifications.length / resolutions.length) : null,
  };
}

// ---------------------------------------------------------------------------
// Context view
// ---------------------------------------------------------------------------

export function summarizeContext(rows: PlatformObservation[], windowDays: number): {
  windowDays: number;
  compositionCount: number;
  averageCompositionMs: number | null;
  budgetExceededCount: number;
  missingContextCount: number;
  views: { contextView: string; count: number; averageCompositionMs: number | null; budgetExceededCount: number }[];
} {
  const composition = ofKind(rows, "context-composition");
  const viewCounts = new Map<string, number>();
  let budgetExceededCount = 0;
  let missingContextCount = 0;

  for (const r of composition) {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    if (meta.budgetExceeded === true) budgetExceededCount += 1;
    if (typeof meta.capabilitiesContributing === "number" && meta.capabilitiesContributing === 0) {
      missingContextCount += 1;
    }
    const views = Array.isArray(meta.views) ? (meta.views as unknown[]) : [];
    for (const view of views) {
      if (typeof view !== "string") continue;
      viewCounts.set(view, (viewCounts.get(view) ?? 0) + 1);
    }
  }

  return {
    windowDays,
    compositionCount: composition.length,
    averageCompositionMs: round(mean(durations(composition)), 1),
    budgetExceededCount,
    missingContextCount,
    views: Array.from(viewCounts.entries())
      .map(([contextView, count]) => ({
        contextView,
        count,
        // Composition is timed per turn, not per view — an honest null, never a guess.
        averageCompositionMs: null,
        budgetExceededCount: 0,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

// ---------------------------------------------------------------------------
// Companion view
// ---------------------------------------------------------------------------

export function summarizeCompanion(rows: PlatformObservation[], windowDays: number): {
  windowDays: number;
  feedback: { helpful: number; notHelpful: number; byReason: { reason: string; count: number }[] };
  escalations: { total: number; byPath: { path: string; count: number }[] };
  recoveries: { total: number; byState: { state: string; count: number }[]; byPath: { path: string; count: number }[] };
  responseGeneration: { total: number; errors: number; averageDurationMs: number | null };
} {
  const feedback = ofKind(rows, "user-feedback");
  const escalations = ofKind(rows, "escalation");
  const recoveries = ofKind(rows, "recovery");
  const generation = ofKind(rows, "response-generation");

  return {
    windowDays,
    feedback: {
      helpful: feedback.filter((r) => r.outcome === "up").length,
      notHelpful: feedback.filter((r) => r.outcome === "down").length,
      byReason: toCounts(
        countBy(feedback, (r) => {
          const meta = (r.metadata ?? {}) as Record<string, unknown>;
          return typeof meta.reasonCode === "string" ? meta.reasonCode : null;
        }),
      ).map(({ key, count }) => ({ reason: key, count })),
    },
    escalations: {
      total: escalations.length,
      byPath: toCounts(countBy(escalations, (r) => r.recoveryPath)).map(({ key, count }) => ({ path: key, count })),
    },
    recoveries: {
      total: recoveries.length,
      byState: toCounts(countBy(recoveries, (r) => r.outcome)).map(({ key, count }) => ({ state: key, count })),
      byPath: toCounts(countBy(recoveries, (r) => r.recoveryPath)).map(({ key, count }) => ({ path: key, count })),
    },
    responseGeneration: {
      total: generation.length,
      errors: generation.filter((r) => r.severity === "error").length,
      averageDurationMs: round(mean(durations(generation)), 0),
    },
  };
}

// ---------------------------------------------------------------------------
// Behaviour view (BEH1) — the Behaviour Admin Workbench's telemetry half
// ---------------------------------------------------------------------------
//
// A pure projection of `behaviour-decision` rows, joined to `user-feedback`
// rows by the OBS2 turn correlation id. It is an OPERATOR view, exactly like
// every other summarizer here: nothing in the platform reads it back, no voice
// adapts to it, and `OBS_DISABLE_CAPTURE=1` removing it changes no behaviour.
// "Effectiveness" therefore means "the feedback observed on turns this voice
// phrased" — never a quality score the platform acts on. There is no learning
// loop here, autonomous or otherwise (BEH1 Scope Lock).

/** How many override rows the view lists individually. Counts are never truncated. */
const BEHAVIOUR_RECENT_OVERRIDES_LIMIT = 20;

export interface BehaviourPersonalitySummary {
  personalityId: string;
  decisions: number;
  voiced: number;
  voicedFallback: number;
  voicedError: number;
  notVoiced: number;
  overrides: number;
  /** Decisions that later attracted at least one feedback rating. */
  ratedDecisions: number;
  helpful: number;
  notHelpful: number;
  /** helpful / (helpful + notHelpful). `null` when this voice has no ratings — never a fabricated 0. */
  effectiveness: number | null;
}

export interface BehaviourObservationSummary {
  windowDays: number;
  decisions: number;
  /** Mean voice-provenance confidence: the share of decisions applying an explicit stored preference. */
  averageConfidence: number | null;
  overrideRate: number | null;
  byPersonality: BehaviourPersonalitySummary[];
  byOutcome: { outcome: string; count: number }[];
  bySurface: { surface: string; count: number }[];
  overrides: {
    total: number;
    byReason: { reason: string; count: number }[];
    recent: {
      observedAt: string;
      requestedPersonality: string | null;
      appliedPersonalityId: string | null;
      reason: string | null;
    }[];
    recentLimit: number;
  };
  effectiveness: {
    ratedDecisions: number;
    helpful: number;
    notHelpful: number;
    rate: number | null;
    /** Feedback in the window that names no recorded behaviour decision — shown, never guessed into one. */
    unattributedFeedback: number;
    note: string;
  };
  byDay: { day: string; decisions: number; overrides: number }[];
  correlationNote: string;
}

const BEHAVIOUR_EFFECTIVENESS_NOTE =
  "Effectiveness is the user-feedback rate observed on turns a voice phrased — an operator signal only. " +
  "No component reads it, and nothing adapts to it: telemetry is never an input to behaviour.";

const BEHAVIOUR_CORRELATION_NOTE =
  "Feedback is attributed to a voice only when both rows carry the same turn correlation id. " +
  "Turns recorded before the Behaviour Engine's decision capture (BEH1) have no decision row and are absent here, " +
  "not reconstructed; their feedback is counted as unattributed.";

export function summarizeBehaviour(
  rows: PlatformObservation[],
  windowDays: number,
): BehaviourObservationSummary {
  const decisions = ofKind(rows, "behaviour-decision");
  const feedback = ofKind(rows, "user-feedback");

  const metaOf = (r: PlatformObservation): Record<string, unknown> =>
    (r.metadata ?? {}) as Record<string, unknown>;
  const metaStr = (r: PlatformObservation, key: string): string | null => {
    const v = metaOf(r)[key];
    return typeof v === "string" && v ? v : null;
  };

  // Join key: the OBS2 per-turn correlation id, carried in the metadata bag.
  const personalityByTurn = new Map<string, string>();
  for (const d of decisions) {
    const turnId = metaStr(d, "turnId");
    const personalityId = metaStr(d, "personalityId");
    if (turnId && personalityId) personalityByTurn.set(turnId, personalityId);
  }

  // Ratings per turn, then per voice. A turn with several ratings counts once
  // as "rated" but contributes each rating to the up/down tallies.
  const ratedTurns = new Map<string, { helpful: number; notHelpful: number }>();
  let unattributedFeedback = 0;
  for (const f of feedback) {
    const turnId = metaStr(f, "turnId");
    if (!turnId || !personalityByTurn.has(turnId)) {
      unattributedFeedback += 1;
      continue;
    }
    const entry = ratedTurns.get(turnId) ?? { helpful: 0, notHelpful: 0 };
    if (f.outcome === "up") entry.helpful += 1;
    else if (f.outcome === "down") entry.notHelpful += 1;
    ratedTurns.set(turnId, entry);
  }

  const blank = (personalityId: string): BehaviourPersonalitySummary => ({
    personalityId,
    decisions: 0,
    voiced: 0,
    voicedFallback: 0,
    voicedError: 0,
    notVoiced: 0,
    overrides: 0,
    ratedDecisions: 0,
    helpful: 0,
    notHelpful: 0,
    effectiveness: null,
  });

  const byPersonality = new Map<string, BehaviourPersonalitySummary>();
  const surfaceCounts = new Map<string, number>();
  const byDayMap = new Map<string, { decisions: number; overrides: number }>();
  const overrideRows: PlatformObservation[] = [];

  for (const d of decisions) {
    const personalityId = metaStr(d, "personalityId") ?? "unknown";
    const entry = byPersonality.get(personalityId) ?? blank(personalityId);
    entry.decisions += 1;
    if (d.outcome === "voiced") entry.voiced += 1;
    else if (d.outcome === "voiced-fallback") entry.voicedFallback += 1;
    else if (d.outcome === "voiced-error") entry.voicedError += 1;
    else if (d.outcome === "not-voiced") entry.notVoiced += 1;

    const overrideApplied = metaOf(d).overrideApplied === true;
    if (overrideApplied) {
      entry.overrides += 1;
      overrideRows.push(d);
    }

    const turnId = metaStr(d, "turnId");
    const rating = turnId ? ratedTurns.get(turnId) : undefined;
    if (rating) {
      entry.ratedDecisions += 1;
      entry.helpful += rating.helpful;
      entry.notHelpful += rating.notHelpful;
    }
    byPersonality.set(personalityId, entry);

    const surfaces = metaOf(d).surfaces;
    for (const s of Array.isArray(surfaces) ? (surfaces as unknown[]) : []) {
      if (typeof s !== "string") continue;
      surfaceCounts.set(s, (surfaceCounts.get(s) ?? 0) + 1);
    }

    const day = dayOf(d.observedAt);
    const dayEntry = byDayMap.get(day) ?? { decisions: 0, overrides: 0 };
    dayEntry.decisions += 1;
    if (overrideApplied) dayEntry.overrides += 1;
    byDayMap.set(day, dayEntry);
  }

  const personalities = Array.from(byPersonality.values()).map((p) => {
    const judged = p.helpful + p.notHelpful;
    return { ...p, effectiveness: judged > 0 ? round(p.helpful / judged) : null };
  });

  const helpful = personalities.reduce((a, p) => a + p.helpful, 0);
  const notHelpful = personalities.reduce((a, p) => a + p.notHelpful, 0);
  const judged = helpful + notHelpful;
  const overrideTotal = overrideRows.length;

  return {
    windowDays,
    decisions: decisions.length,
    averageConfidence: round(mean(confidences(decisions))),
    overrideRate: decisions.length > 0 ? round(overrideTotal / decisions.length) : null,
    byPersonality: personalities.sort((a, b) => b.decisions - a.decisions),
    byOutcome: toCounts(countBy(decisions, (r) => r.outcome)).map(({ key, count }) => ({ outcome: key, count })),
    bySurface: toCounts(surfaceCounts).map(({ key, count }) => ({ surface: key, count })),
    overrides: {
      total: overrideTotal,
      byReason: toCounts(countBy(overrideRows, (r) => metaStr(r, "overrideReason"))).map(({ key, count }) => ({
        reason: key,
        count,
      })),
      recent: overrideRows
        .slice()
        .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime())
        .slice(0, BEHAVIOUR_RECENT_OVERRIDES_LIMIT)
        .map((r) => ({
          observedAt: r.observedAt.toISOString(),
          requestedPersonality: metaStr(r, "requestedPersonality"),
          appliedPersonalityId: metaStr(r, "personalityId"),
          reason: metaStr(r, "overrideReason"),
        })),
      recentLimit: BEHAVIOUR_RECENT_OVERRIDES_LIMIT,
    },
    effectiveness: {
      ratedDecisions: personalities.reduce((a, p) => a + p.ratedDecisions, 0),
      helpful,
      notHelpful,
      rate: judged > 0 ? round(helpful / judged) : null,
      unattributedFeedback,
      note: BEHAVIOUR_EFFECTIVENESS_NOTE,
    },
    byDay: Array.from(byDayMap.entries())
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    correlationNote: BEHAVIOUR_CORRELATION_NOTE,
  };
}

// ---------------------------------------------------------------------------
// Knowledge view
// ---------------------------------------------------------------------------

export function summarizeKnowledge(rows: PlatformObservation[], windowDays: number): {
  windowDays: number;
  retrievals: { total: number; grounded: number; gaps: number; coverageRate: number | null };
  honestGapRate: number | null;
  gapKinds: { kind: string; count: number }[];
  sources: { capability: string; count: number }[];
} {
  const retrievals = ofKind(rows, "knowledge-retrieval");
  const grounded = retrievals.filter((r) => r.outcome === OK_OUTCOME).length;
  const gaps = retrievals.length - grounded;

  const sourceCounts = new Map<string, number>();
  for (const r of retrievals) {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    const sources = Array.isArray(meta.sources) ? (meta.sources as unknown[]) : [];
    for (const source of sources) {
      if (typeof source !== "string") continue;
      sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
    }
  }

  return {
    windowDays,
    retrievals: {
      total: retrievals.length,
      grounded,
      gaps,
      coverageRate: retrievals.length > 0 ? round(grounded / retrievals.length) : null,
    },
    honestGapRate: retrievals.length > 0 ? round(gaps / retrievals.length) : null,
    gapKinds: toCounts(
      countBy(retrievals.filter((r) => r.outcome !== OK_OUTCOME), (r) => r.outcome),
    ).map(({ key, count }) => ({ kind: key, count })),
    sources: Array.from(sourceCounts.entries())
      .map(([capability, count]) => ({ capability, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// ---------------------------------------------------------------------------
// Planner view
// ---------------------------------------------------------------------------

export function summarizePlanner(rows: PlatformObservation[], windowDays: number): {
  windowDays: number;
  total: number;
  byVerb: { verb: string; total: number; ok: number; failures: number }[];
  generation: { attempts: number; gaps: number; note: string };
  recoveries: number;
  averageDurationMs: number | null;
} {
  const plannerRows = ofKind(rows, "capability-invocation").filter(
    (r) => r.capability !== null && r.capability.startsWith("planner"),
  );

  const byVerbMap = new Map<string, { total: number; ok: number; failures: number }>();
  for (const r of plannerRows) {
    const verb = r.verb ?? "unknown";
    const entry = byVerbMap.get(verb) ?? { total: 0, ok: 0, failures: 0 };
    entry.total += 1;
    if (r.outcome === OK_OUTCOME) entry.ok += 1;
    else if (!(r.outcome !== null && NEUTRAL_OUTCOMES.has(r.outcome))) entry.failures += 1;
    byVerbMap.set(verb, entry);
  }

  const generationAttempts = plannerRows.filter((r) => r.verb === "generate");

  const recoveries = ofKind(rows, "recovery").filter((r) => {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    const caps = Array.isArray(meta.capabilities) ? (meta.capabilities as unknown[]) : [];
    return caps.some((c) => typeof c === "string" && c.startsWith("planner"));
  }).length;

  return {
    windowDays,
    total: plannerRows.length,
    byVerb: Array.from(byVerbMap.entries())
      .map(([verb, v]) => ({ verb, ...v }))
      .sort((a, b) => b.total - a.total),
    generation: {
      attempts: generationAttempts.length,
      gaps: generationAttempts.filter((r) => r.outcome !== OK_OUTCOME).length,
      note: "Planner generation is an honest gap by design — `generate` is not an executable planner intent; attempts are recorded and disclosed, never fabricated.",
    },
    recoveries,
    averageDurationMs: round(mean(durations(plannerRows)), 1),
  };
}

// ---------------------------------------------------------------------------
// Benchmark view
// ---------------------------------------------------------------------------

export function summarizeBenchmarks(rows: PlatformObservation[]): {
  runs: {
    runId: string | null;
    mode: string | null;
    observedAt: string;
    headlineScore: number | null;
    honestGapRate: number | null;
    meanLatencyMs: number | null;
    durationMs: number | null;
    questionsScored: number | null;
  }[];
  trend: { observedAt: string; headlineScore: number | null }[];
} {
  const benchmarkRows = ofKind(rows, "benchmark-run")
    .slice()
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());

  const runs = benchmarkRows.map((r) => {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    const num = (v: unknown): number | null => (typeof v === "number" ? v : null);
    const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
    return {
      runId: str(meta.runId) ?? r.sessionId,
      mode: str(meta.mode),
      observedAt: r.observedAt.toISOString(),
      headlineScore: num(meta.headlineScore),
      honestGapRate: num(meta.honestGapRate),
      meanLatencyMs: num(meta.meanLatencyMs),
      durationMs: r.durationMs,
      questionsScored: num(meta.questionsScored),
    };
  });

  return {
    runs,
    trend: runs
      .slice()
      .reverse()
      .map((r) => ({ observedAt: r.observedAt, headlineScore: r.headlineScore })),
  };
}
