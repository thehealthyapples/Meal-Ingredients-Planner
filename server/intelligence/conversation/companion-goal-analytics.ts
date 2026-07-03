/**
 * companion-goal-analytics.ts — INT39 Capability Guidance Registry & Goal
 * Completion
 * ============================================================================
 * PURE aggregation over: (a) the INT39 per-turn Goal Completion signal
 * (`GoalSignalTurn` — `fallbackState` + `resolvedIntent`, read via
 * conversation-store.listAssistantTurnGoalSignals()) and (b) the existing
 * INT38 `companion_guidance_events` rows (now carrying the INT39
 * sourceCapabilityId/targetCapabilityId/targetVerb columns).
 *
 * This module distinguishes the six Goal Completion states the EWO requires:
 *   1. Intent recognised   — the resolver routed to at least one capability.
 *   2. Capability executed — a routed capability actually returned data
 *                            (fallbackState === null).
 *   3. Guidance presented  — a "shown" companion_guidance_events row.
 *   4. Guidance followed   — a "clicked" companion_guidance_events row.
 *   5. Goal completed      — a "clicked" row whose (sourceCapabilityId,
 *                            targetCapabilityId, targetVerb) matches a
 *                            completion criterion the SOURCE capability
 *                            declared for itself (Capability Guidance
 *                            Registry) — a stricter, capability-owned
 *                            definition of "done", not just any click.
 *   6. Goal abandoned      — the honest complement of (4) against (3): shown
 *                            but never followed.
 *
 * HARD BOUNDARIES (mirrors companion-guidance-analytics.ts):
 *  - No storage reads, no platform calls beyond reading the (injectable)
 *    Capability Guidance Registry, no LLM calls, no business logic — every
 *    function here is (data in) → (plain object out).
 *  - Honest gaps over fabricated data: every RATE is `null` when its
 *    denominator is zero. Ranked lists carry a `reliable` flag (minimum
 *    sample size) rather than hiding sparse rows.
 *  - "Recovery after a failed conversation" excludes failed turns with no
 *    follow-up turn from its denominator — a turn that never got a reply
 *    honestly cannot be classified as recovered or not.
 *
 * Run tests: npx tsx server/tests/test-intelligence-capability-guidance-goals.ts
 */

import type { CompanionGuidanceEvent } from "../../../shared/schema.js";
import type { GoalSignalTurn } from "./conversation-store.js";
import type { CompletionCriterion } from "../types.js";
import { intelligencePlatform } from "../intelligence-platform.js";

/** Below this many "shown" events for an action, a ranked row is marked unreliable, never hidden. */
const MIN_SAMPLE_SIZE = 3;

/** Injectable completion-criteria lookup — defaults to the production registry, pure/testable otherwise. */
export type GetCompletionCriteriaFn = (capabilityId: string) => readonly CompletionCriterion[];

const defaultGetCompletionCriteria: GetCompletionCriteriaFn = (capabilityId) =>
  intelligencePlatform.registry.getCompletionCriteria(capabilityId);

// ---------------------------------------------------------------------------
// Goal-completing click classification
// ---------------------------------------------------------------------------

type GuidanceEventCapabilityShape = Pick<
  CompanionGuidanceEvent,
  "sourceCapabilityId" | "targetCapabilityId" | "targetVerb"
>;

/**
 * True when a "clicked" guidance event matches a completion criterion the
 * SOURCE capability declared for itself. Requires all three capability
 * identity fields to be present — an event missing them (never emitted by
 * INT39's gateway, but defensively handled) is never fabricated as complete.
 */
export function isGoalCompletingClick(
  event: GuidanceEventCapabilityShape,
  getCompletionCriteria: GetCompletionCriteriaFn = defaultGetCompletionCriteria,
): boolean {
  if (!event.sourceCapabilityId || !event.targetCapabilityId || !event.targetVerb) return false;
  const criteria = getCompletionCriteria(event.sourceCapabilityId);
  return criteria.some(
    (c) =>
      c.satisfiedByAction.capabilityId === event.targetCapabilityId &&
      c.satisfiedByAction.verb === event.targetVerb,
  );
}

// ---------------------------------------------------------------------------
// Goal funnel
// ---------------------------------------------------------------------------

export interface GoalFunnelResult {
  readonly intentRecognised: number;
  readonly capabilityExecuted: number;
  readonly guidancePresented: number;
  readonly guidanceFollowed: number;
  readonly goalCompleted: number;
  /** goalCompleted / guidanceFollowed. Null when nothing has been followed yet. */
  readonly completionRate: number | null;
  /** (guidancePresented - guidanceFollowed) / guidancePresented. Null when nothing has been shown yet. */
  readonly abandonmentRate: number | null;
}

function hasRoutedCapabilities(turn: GoalSignalTurn): boolean {
  return Array.isArray(turn.resolvedIntent?.capabilities) && turn.resolvedIntent!.capabilities!.length > 0;
}

/** Compute the six-state Goal Completion funnel from turns + guidance events. */
export function computeGoalFunnel(
  turns: readonly GoalSignalTurn[],
  guidanceEvents: readonly CompanionGuidanceEvent[],
  getCompletionCriteria: GetCompletionCriteriaFn = defaultGetCompletionCriteria,
): GoalFunnelResult {
  const intentRecognised = turns.filter(hasRoutedCapabilities).length;
  const capabilityExecuted = turns.filter((t) => t.fallbackState === null && hasRoutedCapabilities(t)).length;

  const guidancePresented = guidanceEvents.filter((e) => e.eventKind === "shown").length;
  const clicked = guidanceEvents.filter((e) => e.eventKind === "clicked");
  const guidanceFollowed = clicked.length;
  const goalCompleted = clicked.filter((e) => isGoalCompletingClick(e, getCompletionCriteria)).length;

  return {
    intentRecognised,
    capabilityExecuted,
    guidancePresented,
    guidanceFollowed,
    goalCompleted,
    completionRate: guidanceFollowed > 0 ? goalCompleted / guidanceFollowed : null,
    abandonmentRate: guidancePresented > 0 ? (guidancePresented - guidanceFollowed) / guidancePresented : null,
  };
}

// ---------------------------------------------------------------------------
// Recovery after a failed conversation
// ---------------------------------------------------------------------------

export interface RecoveryResult {
  /** recovered / (totalFailed - totalWithoutFollowUp). Null when there is nothing to measure. */
  readonly rate: number | null;
  readonly totalFailed: number;
  readonly totalRecovered: number;
  /** Failed turns with no follow-up turn in the thread — excluded from the rate, not counted as unrecovered. */
  readonly totalWithoutFollowUp: number;
}

/**
 * For every unsuccessful assistant turn (fallbackState set), check whether the
 * NEXT assistant turn in the SAME thread succeeded (fallbackState null) — an
 * honest, deterministic proxy for "the user tried again and it worked",
 * without any new business-data ownership. A failed turn with no follow-up
 * turn cannot be classified either way and is excluded from the denominator.
 */
export function computeRecoveryAfterFailure(turns: readonly GoalSignalTurn[]): RecoveryResult {
  const byThread = new Map<number, GoalSignalTurn[]>();
  for (const t of turns) {
    const list = byThread.get(t.threadId) ?? [];
    list.push(t);
    byThread.set(t.threadId, list);
  }

  let totalFailed = 0;
  let totalRecovered = 0;
  let totalWithoutFollowUp = 0;

  for (const list of Array.from(byThread.values())) {
    const ordered = [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].fallbackState === null) continue;
      totalFailed++;
      const next = ordered[i + 1];
      if (!next) {
        totalWithoutFollowUp++;
        continue;
      }
      if (next.fallbackState === null) totalRecovered++;
    }
  }

  const denominator = totalFailed - totalWithoutFollowUp;
  return {
    rate: denominator > 0 ? totalRecovered / denominator : null,
    totalFailed,
    totalRecovered,
    totalWithoutFollowUp,
  };
}

// ---------------------------------------------------------------------------
// Action-level conversion — highest converting / frequently ignored
// ---------------------------------------------------------------------------

export interface ActionConversion {
  readonly sourceCapabilityId: string;
  readonly targetCapabilityId: string;
  readonly verb: string;
  readonly shown: number;
  readonly clicked: number;
  readonly clickThroughRate: number | null;
  readonly reliable: boolean;
}

/**
 * Aggregate shown/clicked counts per distinct guidance ACTION (source
 * capability → target capability + verb) — finer-grained than the existing
 * domain-pair aggregation in companion-guidance-analytics.ts, since one
 * domain (e.g. "shopping") can be served by more than one capability
 * (shopping, shopping-discovery, partners). Events missing capability
 * identity (pre-INT39 rows) are excluded, never guessed at.
 */
function aggregateByAction(events: readonly CompanionGuidanceEvent[]): ActionConversion[] {
  const shownCounts = new Map<string, number>();
  const clickedCounts = new Map<string, number>();
  const keys = new Map<string, { sourceCapabilityId: string; targetCapabilityId: string; verb: string }>();

  for (const e of events) {
    if (!e.sourceCapabilityId || !e.targetCapabilityId || !e.targetVerb) continue;
    const key = `${e.sourceCapabilityId}::${e.targetCapabilityId}::${e.targetVerb}`;
    keys.set(key, {
      sourceCapabilityId: e.sourceCapabilityId,
      targetCapabilityId: e.targetCapabilityId,
      verb: e.targetVerb,
    });
    if (e.eventKind === "shown") shownCounts.set(key, (shownCounts.get(key) ?? 0) + 1);
    else clickedCounts.set(key, (clickedCounts.get(key) ?? 0) + 1);
  }

  return Array.from(keys.entries()).map(([key, k]) => {
    const shown = shownCounts.get(key) ?? 0;
    const clicked = clickedCounts.get(key) ?? 0;
    return {
      ...k,
      shown,
      clicked,
      clickThroughRate: shown > 0 ? clicked / shown : null,
      reliable: shown >= MIN_SAMPLE_SIZE,
    };
  });
}

/**
 * Guidance actions ranked by click-through rate, highest first. Requires the
 * minimum sample size AND at least one click — a reliably-sampled action with
 * zero clicks has no conversion to rank as "highest"; it belongs in
 * computeIgnoredGuidanceActions instead.
 */
export function computeHighestConvertingGuidanceActions(
  events: readonly CompanionGuidanceEvent[],
): ActionConversion[] {
  return aggregateByAction(events)
    .filter((a) => a.reliable && (a.clickThroughRate ?? 0) > 0)
    .sort((a, b) => (b.clickThroughRate ?? 0) - (a.clickThroughRate ?? 0) || b.clicked - a.clicked);
}

/** Click-through rate at/below this is flagged as frequently ignored. */
const IGNORED_MAX_CLICK_THROUGH_RATE = 0.2;

/** Guidance actions shown often but rarely followed, ranked by shown count, most first. */
export function computeIgnoredGuidanceActions(events: readonly CompanionGuidanceEvent[]): ActionConversion[] {
  return aggregateByAction(events)
    .filter((a) => a.reliable && (a.clickThroughRate ?? 0) <= IGNORED_MAX_CLICK_THROUGH_RATE)
    .sort((a, b) => b.shown - a.shown);
}
