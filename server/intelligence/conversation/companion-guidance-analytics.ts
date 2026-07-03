/**
 * companion-guidance-analytics.ts — INT38 Companion Guidance & Feedback
 * =========================================================================
 * PURE aggregation over the two INT38 tables' rows (read by routes.ts via
 * companion-feedback-store.ts and passed in here) into the metrics the
 * Intelligence Dashboard surfaces: response helpfulness, feedback trends,
 * task completion following a recommendation, successful journeys, and
 * opportunities (poor feedback / abandonment).
 *
 * HARD BOUNDARIES (mirrors companion-gap-classifier.ts / companion-observability.ts):
 *  - No storage reads, no platform calls, no LLM calls, no business logic —
 *    every function here is (array in) → (plain object out).
 *  - Honest gaps over fabricated data: single aggregate RATES are `null` when
 *    the denominator is zero (same rule as computeRateMetrics) — never a
 *    fabricated 0%/100%. Ranked lists (journeys, opportunities) show real
 *    counts with a `sampleSize`-aware `reliable` flag rather than hiding rows,
 *    exactly like the existing top-unmatched-utterance / routing-failure lists
 *    show every count without a minimum threshold.
 *  - "Task completion following a recommendation" is DEFINED here as a
 *    click-through on a shown guidance suggestion (see computeTaskCompletion).
 *    Deeper cross-page completion tracking (did the user actually finish
 *    adding the meal to the planner?) would require new business-data
 *    ownership this workstream must not introduce — the proxy is documented,
 *    not silently assumed.
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-guidance.ts
 */

import type { CompanionResponseFeedback, CompanionGuidanceEvent } from "../../../shared/schema.js";

/** Below this many "shown" events for a (sourceDomain, domain) pair, a ranked row is marked unreliable, never hidden. */
const MIN_SAMPLE_SIZE = 3;

// ---------------------------------------------------------------------------
// Helpfulness
// ---------------------------------------------------------------------------

export interface HelpfulnessResult {
  readonly rate: number | null;
  readonly totalUp: number;
  readonly totalDown: number;
}

/** Response helpfulness rate — up / (up + down). Null when no feedback exists yet. */
export function computeHelpfulness(
  feedback: readonly CompanionResponseFeedback[],
): HelpfulnessResult {
  const totalUp = feedback.filter((f) => f.rating === "up").length;
  const totalDown = feedback.filter((f) => f.rating === "down").length;
  const total = totalUp + totalDown;
  return { rate: total > 0 ? totalUp / total : null, totalUp, totalDown };
}

// ---------------------------------------------------------------------------
// Feedback trend — day-bucketed up/down counts
// ---------------------------------------------------------------------------

export interface FeedbackTrendBucket {
  readonly date: string; // "YYYY-MM-DD"
  readonly up: number;
  readonly down: number;
}

/** Day-bucketed positive/negative feedback counts, oldest first. Empty when no feedback exists. */
export function computeFeedbackTrend(
  feedback: readonly CompanionResponseFeedback[],
): FeedbackTrendBucket[] {
  const buckets = new Map<string, { up: number; down: number }>();
  for (const f of feedback) {
    const date = f.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(date) ?? { up: 0, down: 0 };
    if (f.rating === "up") b.up += 1;
    else if (f.rating === "down") b.down += 1;
    buckets.set(date, b);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, b]) => ({ date, ...b }));
}

// ---------------------------------------------------------------------------
// Top negative reasons
// ---------------------------------------------------------------------------

export interface TopNegativeReason {
  readonly reasonCode: string;
  readonly count: number;
}

/** Most common reasons given for a "down" rating, most frequent first. */
export function computeTopNegativeReasons(
  feedback: readonly CompanionResponseFeedback[],
): TopNegativeReason[] {
  const counts = new Map<string, number>();
  for (const f of feedback) {
    if (f.rating !== "down" || !f.reasonCode) continue;
    counts.set(f.reasonCode, (counts.get(f.reasonCode) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([reasonCode, count]) => ({ reasonCode, count }));
}

// ---------------------------------------------------------------------------
// Task completion (defined as click-through on a shown guidance suggestion)
// ---------------------------------------------------------------------------

export interface TaskCompletionResult {
  readonly rate: number | null;
  readonly totalShown: number;
  readonly totalClicked: number;
}

/** Click-through rate on shown guidance suggestions. Null when nothing has been shown yet. */
export function computeTaskCompletion(
  events: readonly CompanionGuidanceEvent[],
): TaskCompletionResult {
  const totalShown = events.filter((e) => e.eventKind === "shown").length;
  const totalClicked = events.filter((e) => e.eventKind === "clicked").length;
  return { rate: totalShown > 0 ? totalClicked / totalShown : null, totalShown, totalClicked };
}

// ---------------------------------------------------------------------------
// Pair aggregation shared by journeys / abandonment
// ---------------------------------------------------------------------------

interface PairAggregate {
  readonly sourceDomain: string;
  readonly domain: string;
  readonly shown: number;
  readonly clicked: number;
  readonly clickThroughRate: number | null;
  readonly reliable: boolean;
}

function aggregateByPair(events: readonly CompanionGuidanceEvent[]): PairAggregate[] {
  const shownCounts = new Map<string, number>();
  const clickedCounts = new Map<string, number>();
  const pairs = new Map<string, { sourceDomain: string; domain: string }>();
  for (const e of events) {
    const key = `${e.sourceDomain}::${e.domain}`;
    pairs.set(key, { sourceDomain: e.sourceDomain, domain: e.domain });
    if (e.eventKind === "shown") shownCounts.set(key, (shownCounts.get(key) ?? 0) + 1);
    else clickedCounts.set(key, (clickedCounts.get(key) ?? 0) + 1);
  }
  return Array.from(pairs.entries()).map(([key, pair]) => {
    const shown = shownCounts.get(key) ?? 0;
    const clicked = clickedCounts.get(key) ?? 0;
    return {
      ...pair,
      shown,
      clicked,
      clickThroughRate: shown > 0 ? clicked / shown : null,
      reliable: shown >= MIN_SAMPLE_SIZE,
    };
  });
}

// ---------------------------------------------------------------------------
// Most successful journeys
// ---------------------------------------------------------------------------

export interface JourneyResult extends PairAggregate {}

/** Journeys (sourceDomain → domain) ranked by completed click-throughs, most first. */
export function computeSuccessfulJourneys(
  events: readonly CompanionGuidanceEvent[],
): JourneyResult[] {
  return aggregateByPair(events)
    .filter((j) => j.clicked > 0)
    .sort((a, b) => b.clicked - a.clicked || (b.clickThroughRate ?? 0) - (a.clickThroughRate ?? 0));
}

// ---------------------------------------------------------------------------
// Abandonment opportunities — shown often, rarely clicked
// ---------------------------------------------------------------------------

/** Click-through rate at/below this is flagged as an abandonment opportunity. */
const ABANDONMENT_MAX_CLICK_THROUGH_RATE = 0.2;

export interface AbandonmentOpportunity extends PairAggregate {}

/**
 * Suggestions users see and don't act on: shown at least MIN_SAMPLE_SIZE times
 * with a click-through rate at/below ABANDONMENT_MAX_CLICK_THROUGH_RATE.
 */
export function computeAbandonmentOpportunities(
  events: readonly CompanionGuidanceEvent[],
): AbandonmentOpportunity[] {
  return aggregateByPair(events)
    .filter((j) => j.reliable && (j.clickThroughRate ?? 0) <= ABANDONMENT_MAX_CLICK_THROUGH_RATE)
    .sort((a, b) => b.shown - a.shown);
}

// ---------------------------------------------------------------------------
// Recommendations with consistently poor feedback
// ---------------------------------------------------------------------------

export interface PoorFeedbackRecommendation {
  readonly sourceDomain: string;
  readonly domain: string;
  readonly shownCount: number;
  readonly downCount: number;
  readonly downRate: number;
  readonly reliable: boolean;
}

/**
 * Correlates a turn's "down" feedback with which guidance suggestions were
 * shown on that SAME turn (joined in-memory by conversationTurnId — never a
 * user id, never a household id). Ranked by down-rate, most concerning first.
 * `reliable` is false below MIN_SAMPLE_SIZE shown events — shown, not hidden.
 */
export function computePoorFeedbackRecommendations(
  feedback: readonly CompanionResponseFeedback[],
  events: readonly CompanionGuidanceEvent[],
): PoorFeedbackRecommendation[] {
  const downTurns = new Set(
    feedback.filter((f) => f.rating === "down").map((f) => f.conversationTurnId),
  );
  const shownEvents = events.filter((e) => e.eventKind === "shown");

  const shownCounts = new Map<string, number>();
  const downCounts = new Map<string, number>();
  const pairs = new Map<string, { sourceDomain: string; domain: string }>();
  for (const e of shownEvents) {
    const key = `${e.sourceDomain}::${e.domain}`;
    pairs.set(key, { sourceDomain: e.sourceDomain, domain: e.domain });
    shownCounts.set(key, (shownCounts.get(key) ?? 0) + 1);
    if (downTurns.has(e.conversationTurnId)) {
      downCounts.set(key, (downCounts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(pairs.entries())
    .map(([key, pair]) => {
      const shownCount = shownCounts.get(key) ?? 0;
      const downCount = downCounts.get(key) ?? 0;
      return {
        ...pair,
        shownCount,
        downCount,
        downRate: shownCount > 0 ? downCount / shownCount : 0,
        reliable: shownCount >= MIN_SAMPLE_SIZE,
      };
    })
    .filter((r) => r.downCount > 0)
    .sort((a, b) => b.downRate - a.downRate || b.downCount - a.downCount);
}
