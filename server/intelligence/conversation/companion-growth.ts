/**
 * companion-growth.ts — EWO2 Companion Personality Platform, Stage 7 (Growth Model)
 * =====================================================================================
 * "The Companion should become more familiar over time... Growth must be based
 * on real platform data. Never fabricate familiarity. Never invent achievements."
 *
 * This module computes a GrowthSignal from ONE existing, already-owned data
 * source — `storage.getUserHealthTrends()` (the per-day Health Score trend
 * already recorded by the existing product-scanning flow, SoT unchanged) —
 * and returns null whenever there isn't enough real history to say anything
 * honestly. It never talks to an LLM, never invents a number, and never
 * widens what counts as "enough data" to force a growth statement to exist.
 *
 * HARD BOUNDARIES:
 *  - Read-only. No new table, no new write path (Data Impact: reads only).
 *  - Pure computation over rows the caller supplies — testable without a DB.
 *  - Returns null (an honest "nothing to say yet"), never a zero-filled or
 *    guessed signal, whenever either comparison window is thin.
 *  - Phrasing is NOT this module's job — see behaviour-engine.ts's
 *    `phraseGrowth`, which turns a GrowthSignal into personality-voiced text
 *    using ONLY the numbers this module already verified.
 *
 * Run tests: npx tsx server/tests/test-intelligence-personality-platform.ts
 */

import type { UserHealthTrend } from "../../../shared/schema.js";
import type { GrowthPhraseInputs } from "./personality-registry.js";

/** Minimum total samples required in EACH window before a signal is offered — avoids a noisy, barely-real claim reading as false familiarity. */
export const MIN_SAMPLES_PER_WINDOW = 5;

/** Recent window: the last N days. */
export const RECENT_WINDOW_DAYS = 30;
/** Earlier window: from RECENT_WINDOW_DAYS ago back to this many days ago. */
export const EARLIER_WINDOW_DAYS = 180;

export interface GrowthSignal {
  readonly metricLabel: string;
  readonly earlierValue: number;
  readonly recentValue: number;
  readonly unit: string;
  readonly earlierWindowLabel: string;
  readonly recentWindowLabel: string;
  readonly earlierSampleCount: number;
  readonly recentSampleCount: number;
}

function weightedAverage(trends: readonly UserHealthTrend[]): { avg: number; samples: number } {
  const samples = trends.reduce((sum, t) => sum + t.sampleCount, 0);
  if (samples === 0) return { avg: 0, samples: 0 };
  const weighted = trends.reduce((sum, t) => sum + t.averageThaRating * t.sampleCount, 0);
  return { avg: Math.round((weighted / samples) * 10) / 10, samples };
}

/**
 * Pure computation — given a set of already-fetched trend rows (oldest to
 * newest, any order accepted), split into a recent window and an earlier
 * comparison window, and return a GrowthSignal ONLY when both windows carry
 * enough real samples to say something honest. Returns null otherwise —
 * the canonical "not enough history yet" honest gap for this feature.
 */
export function computeGrowthSignal(
  trends: readonly UserHealthTrend[],
  now: Date = new Date(),
): GrowthSignal | null {
  const recentCutoff = new Date(now);
  recentCutoff.setDate(recentCutoff.getDate() - RECENT_WINDOW_DAYS);
  const earlierCutoff = new Date(now);
  earlierCutoff.setDate(earlierCutoff.getDate() - EARLIER_WINDOW_DAYS);

  const recentRows = trends.filter((t) => new Date(t.date) >= recentCutoff);
  const earlierRows = trends.filter((t) => new Date(t.date) >= earlierCutoff && new Date(t.date) < recentCutoff);

  const recent = weightedAverage(recentRows);
  const earlier = weightedAverage(earlierRows);

  if (recent.samples < MIN_SAMPLES_PER_WINDOW || earlier.samples < MIN_SAMPLES_PER_WINDOW) {
    return null;
  }

  return {
    metricLabel: "average Health Score",
    earlierValue: earlier.avg,
    recentValue: recent.avg,
    unit: "",
    earlierWindowLabel: `${EARLIER_WINDOW_DAYS / 30}-ish months ago`,
    recentWindowLabel: "recently",
    earlierSampleCount: earlier.samples,
    recentSampleCount: recent.samples,
  };
}

/** Adapts a GrowthSignal into the phrase-builder's input shape (personality-registry.ts). */
export function toGrowthPhraseInputs(signal: GrowthSignal): GrowthPhraseInputs {
  return {
    metricLabel: signal.metricLabel,
    earlierValue: signal.earlierValue,
    recentValue: signal.recentValue,
    unit: signal.unit,
    earlierWindowLabel: signal.earlierWindowLabel,
    recentWindowLabel: signal.recentWindowLabel,
  };
}
