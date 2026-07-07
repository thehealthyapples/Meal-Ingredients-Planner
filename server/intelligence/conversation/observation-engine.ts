/**
 * observation-engine.ts — EWX1 Living Companion Experience, Stage 1
 * =========================================================================
 * "Observations should be generated from existing platform intelligence...
 *  Observations must never fabricate knowledge."
 *
 * This module contains NO new business logic and performs NO reasoning of
 * its own. It is a thin, pure ADAPTER that wraps facts already computed by
 * existing, unmodified owners into one common `Observation` shape, so the
 * Companion can voice them consistently (via behaviour-engine.ts's
 * `phraseObservation`) wherever it is present in the platform (Stage 7).
 *
 * EVERY fact an Observation carries traces to an existing owner:
 *   - nutrition-trend      → companion-growth.ts's `computeGrowthSignal`
 *                            (EWO2 Stage 7 — reads `storage.getUserHealthTrends`)
 *   - streak-milestone     → `storage.getUserStreak` (existing table, INT/streak
 *                            feature — read-only here, never written)
 *   - diversity-milestone  → `assembleNutritionCentre`'s `plantDiversity`
 *                            (WX8 — existing, all-time, household-owned count)
 *   - planner-gap / pantry-opportunity / shopping-opportunity
 *                          → the `opportunity-delivery` capability (OD1/FI4),
 *                            called through the SAME `intelligencePlatform.
 *                            handle()` path FI5's route already uses — every
 *                            field is a VERBATIM projection of what that
 *                            capability already produced. This module never
 *                            rewords or re-derives an opportunity's content.
 *   - seasonal-highlight   → `shared/seasonal/engine.ts`'s `seasonalStories()`
 *                            (WS11 — already read by the Home Intelligence and
 *                            Planner Intelligence Strip routes; the Companion
 *                            is its third consuming surface, IA2). This module
 *                            never calls `seasonalStories()` itself — the
 *                            caller (server/routes.ts) does, exactly as it
 *                            already does for the other four sources, and
 *                            hands this producer only the one already-chosen
 *                            headline string.
 *
 * HARD INVARIANT (mirrors EWO1 §5 / EWO2's Core Principle, extended to
 * observations): an Observation may summarise or select from data that
 * already exists. It may NEVER compute a new metric, invent a threshold that
 * implies more certainty than the underlying data supports, or claim a
 * "just happened" milestone the platform cannot actually date. Where the
 * underlying data is cumulative/all-time (diversity), the Observation is
 * phrased as a present-state fact, never as "you just achieved this".
 *
 * SILENCE RULES (Stage 6) live here too — `applySilenceRules` is a pure,
 * stateless filter (no new persisted state, no new table) that:
 *   - drops any observation whose underlying signal was thin/absent (never
 *     surfaces a guess)
 *   - only lets a milestone-shaped observation (streak/diversity) through
 *     when the number is a "notable" round figure — a stateless, honest
 *     heuristic for "worth mentioning", not a fabricated "you just crossed
 *     this" claim (this module cannot know exactly when a threshold was
 *     crossed without new persisted state — see SUGGESTIONS in the EWX1 doc)
 *   - caps the total number of observations returned per gather, so the
 *     Companion never reads as a notification feed
 *   - de-duplicates by id
 *
 * Run tests: npx tsx server/tests/test-intelligence-observation-engine.ts
 */

import type { UserHealthTrend, UserStreak } from "../../../shared/schema.js";
import {
  computeGrowthSignal,
  toGrowthPhraseInputs,
  type GrowthSignal,
} from "./companion-growth.js";
import type { GrowthPhraseInputs } from "./personality-registry.js";

// ---------------------------------------------------------------------------
// Observation shape
// ---------------------------------------------------------------------------

/**
 * The closed set of observation categories (Stage 1 examples from the brief,
 * minus the ones with no existing, honest data source — see the EWX1 doc's
 * Trust Validation for which brief examples were NOT implemented and why).
 */
export type ObservationCategory =
  | "nutrition-trend"
  | "streak-milestone"
  | "diversity-milestone"
  | "planner-gap"
  | "pantry-opportunity"
  | "shopping-opportunity"
  | "seasonal-highlight";

export type ObservationPriority = "high" | "medium" | "low";

export interface Observation {
  readonly id: string;
  readonly category: ObservationCategory;
  readonly priority: ObservationPriority;
  /**
   * The verified fact this observation carries, in the SAME shape the source
   * owner already produced it — never a value this module computed itself,
   * except `growth` (a straight pass of companion-growth.ts's own signal).
   */
  readonly fact:
    | { readonly kind: "growth"; readonly signal: GrowthSignal }
    | { readonly kind: "streak"; readonly currentStreak: number; readonly bestStreak: number }
    | { readonly kind: "diversity"; readonly plantCount: number }
    | { readonly kind: "opportunity"; readonly explanation: string; readonly suggestedAction: string }
    | { readonly kind: "seasonal"; readonly headline: string };
}

// ---------------------------------------------------------------------------
// Producers — one per existing data source, each a pure function over
// already-fetched rows (mirrors opportunity-engine.ts's own "pure reasoning
// core, thin I/O orchestrator" split so every rule here is unit-testable
// without a database).
// ---------------------------------------------------------------------------

/** Wraps companion-growth.ts's own signal — returns [] on the honest null (thin data). */
export function observeNutritionTrend(trends: readonly UserHealthTrend[], now: Date = new Date()): Observation[] {
  const signal = computeGrowthSignal(trends, now);
  if (!signal) return [];
  return [
    {
      id: "nutrition-trend",
      category: "nutrition-trend",
      priority: "low",
      fact: { kind: "growth", signal },
    },
  ];
}

/**
 * A streak is "notable" (worth mentioning) only at a round multiple — a
 * stateless heuristic for what deserves a moment, not a persisted
 * "just crossed" detector (see module header). Zero/undefined streak is
 * silence, not a fabricated "starting from zero" observation.
 */
const STREAK_NOTABLE_MULTIPLE = 7;

export function observeStreak(streak: UserStreak | undefined): Observation[] {
  if (!streak || streak.currentEliteStreak <= 0) return [];
  if (streak.currentEliteStreak % STREAK_NOTABLE_MULTIPLE !== 0) return [];
  return [
    {
      id: "streak-milestone",
      category: "streak-milestone",
      priority: "medium",
      fact: {
        kind: "streak",
        currentStreak: streak.currentEliteStreak,
        bestStreak: streak.bestEliteStreak,
      },
    },
  ];
}

/** Same "notable round number" discipline as observeStreak, applied to the household's all-time plant count. */
const DIVERSITY_NOTABLE_MULTIPLE = 10;

export function observeDiversity(plantDiversity: number): Observation[] {
  if (plantDiversity <= 0) return [];
  if (plantDiversity % DIVERSITY_NOTABLE_MULTIPLE !== 0) return [];
  return [
    {
      id: "diversity-milestone",
      category: "diversity-milestone",
      priority: "low",
      fact: { kind: "diversity", plantCount: plantDiversity },
    },
  ];
}

/**
 * A single already-produced Food Opportunity (OD1's `DeliverableOpportunity`,
 * `server/intelligence/opportunity-delivery/framework.ts`) — the SAME shape
 * FI5's `/api/intelligence/food-opportunities` route already returns.
 * `domain` selects the Observation category — content is copied verbatim,
 * never reworded (Trust: "every opportunity's content is a verbatim
 * projection of what a registered producer capability already returned").
 * An unmapped domain is an honest no-op (filtered out), never a guess.
 */
export interface OpportunityLike {
  readonly id: string;
  readonly domain: string;
  readonly priority: ObservationPriority;
  readonly explanation: string;
  readonly suggestedAction: string;
}

const DOMAIN_TO_CATEGORY: Readonly<Record<string, ObservationCategory>> = {
  planner: "planner-gap",
  pantry: "pantry-opportunity",
  shopping: "shopping-opportunity",
};

export function observeOpportunities(opportunities: readonly OpportunityLike[]): Observation[] {
  const result: Observation[] = [];
  for (const o of opportunities) {
    const category = DOMAIN_TO_CATEGORY[o.domain];
    if (!category) continue;
    result.push({
      id: `opportunity:${o.id}`,
      category,
      priority: o.priority,
      fact: { kind: "opportunity", explanation: o.explanation, suggestedAction: o.suggestedAction },
    });
  }
  return result;
}

/**
 * Wraps a single already-chosen seasonal headline (WS11's `seasonalStories()`
 * — the SAME derivation `/api/home/intelligence` and
 * `/api/planner/weeks/:weekId/intelligence` already compute) into an
 * Observation. `headline` is `null` when the season has nothing worth
 * mentioning yet (WS11's own "not enough of a season yet — staying silent"
 * discipline) — an honest no-op, never a guess. This is a pure pass-through:
 * the caller derives the headline, this function only shapes it.
 */
export function observeSeasonal(headline: string | null): Observation[] {
  if (!headline) return [];
  return [
    {
      id: "seasonal-highlight",
      category: "seasonal-highlight",
      priority: "low",
      fact: { kind: "seasonal", headline },
    },
  ];
}

// ---------------------------------------------------------------------------
// Silence Rules (Stage 6) — a pure, stateless filter over an already-gathered
// list. See module header for what this can and cannot detect without new
// persisted state.
// ---------------------------------------------------------------------------

export const MAX_OBSERVATIONS_PER_MOMENT = 2;

const PRIORITY_RANK: Record<ObservationPriority, number> = { high: 0, medium: 1, low: 2 };

/**
 * Ranks by priority (safety/actionable gaps first), de-duplicates by id, and
 * caps the total count. This is the ONLY place presentation order/volume is
 * decided — callers must never re-sort or re-slice a gathered list themselves.
 */
export function applySilenceRules(
  observations: readonly Observation[],
  maxCount: number = MAX_OBSERVATIONS_PER_MOMENT,
): Observation[] {
  const seen = new Set<string>();
  const deduped = observations.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
  return deduped
    .slice()
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, maxCount);
}

// ---------------------------------------------------------------------------
// toGrowthPhraseInputs re-export — behaviour-engine.ts's phraseObservation
// needs this adapter for the "growth" fact kind without importing
// companion-growth.ts a second time under a different path.
// ---------------------------------------------------------------------------

export { toGrowthPhraseInputs };
export type { GrowthPhraseInputs };
