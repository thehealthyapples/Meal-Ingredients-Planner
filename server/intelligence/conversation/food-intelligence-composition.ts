/**
 * food-intelligence-composition.ts — INT50
 * ==========================================
 * The Conversation Gateway's FOOD INTELLIGENCE COMPOSITION seam: a pure
 * function that decides, AFTER the first wave of capability queries has
 * produced real data, which of the caller's OWN household context sources
 * should additionally ground a food-knowledge answer — so the Companion
 * composes its reply across the platform's existing capabilities instead of
 * answering from a single source.
 *
 * WHAT THIS IS: when a turn is grounded by a food-knowledge capability
 * (Food Intelligence, Nutrition Knowledge, Uplift, Opportunity Delivery,
 * Nutrition Discovery), this module derives context reads against the
 * capabilities that make that answer personally safe and actionable:
 *
 *   - household/read {scope:"dietary-context"}   — ALWAYS for a food-grounded
 *     turn: hard restrictions and diet patterns must ground any food guidance
 *     before it is phrased (safety comes before relevance).
 *   - pantry/read {scope:"list"}                 — recommendation-shaped turns
 *     only: connect what is recommended to what the household already has.
 *   - planner/read {scope:"week", weekId}        — recommendation-shaped turns
 *     only, and ONLY when the surface supplied an active planner week id. The
 *     planner owns no calendar mapping and this module NEVER guesses a week
 *     (Principle 6) — no hint, no query.
 *   - shopping/read {scope:"list"}               — recommendation-shaped turns
 *     only: connect what is recommended to what is already on the list.
 *
 * User Goals need no derivation here: the resolver's ALWAYS-ON profile
 * baseline read already grounds every turn with `preferences.healthGoals`
 * (pinned by the profile:read Context View — see context-view.ts).
 *
 * WHAT THIS IS NOT (the governing architecture's hard boundaries):
 *   - NOT a second Context Composition Engine. This module never serialises,
 *     truncates, orders, or budgets anything the model reads — it only names
 *     which REGISTERED capability reads are worth asking; their Full Results
 *     flow to the one CCE (INT17 §0/§7) exactly like every other result.
 *   - NOT business logic. Every derived query is a registered
 *     (verb × capability) pair executed through intelligencePlatform.handle()
 *     by the gateway — each owner projects its own data; nothing is joined,
 *     re-derived, or asserted here (TIP1 §5, TIP2 §1).
 *   - NOT a new store or conversation state. Pure function; derived per turn
 *     from this turn's own first-wave results; nothing persisted (TIP3 §5).
 *   - NOT an observation consumer. This module reads no telemetry; the
 *     gateway (its I/O-performing caller) records what was composed
 *     (Observation Engine §4 rule 4, §7).
 *
 * HARD BOUNDARIES (mirrors capability-composition.ts, the INT42 seam this
 * generalises):
 *   - PURE. No I/O of its own. The gateway executes the derived queries.
 *   - BASELINE-ONLY. Derived reads are grounding context, not understanding:
 *     the gateway marks them `baseline: true` (the profile always-on
 *     precedent), so they never count as routing, never flip turn
 *     classification, and never claim the primary outcome.
 *   - NEVER OVERWRITES. A capability the resolver already routed this turn
 *     (utterance-driven) is never re-queried or overwritten with a derived
 *     read (the INT42 rule).
 *   - HONEST GAPS. A derived read that the platform answers with a gap (e.g.
 *     no household membership) stays a gap — the pipeline already carries
 *     non-ok statuses honestly; nothing here fabricates a fallback.
 */

import type { IntentVerb } from "../types.js";
import type { ResolvedIntent } from "../intent-resolver.js";

/** One first-wave query as this module needs to see it — shape, not payload. */
export interface FirstWaveQuery {
  readonly capability: string;
  readonly verb: IntentVerb;
  /** True for context-only intents (the always-on profile read). */
  readonly baseline: boolean;
  /** True when the platform answered this query with grounding data ("ok-data"). */
  readonly okData: boolean;
}

/**
 * A context read this module has decided should ground the turn, with the
 * deterministic reason it was composed — surfaced to the Observation Engine
 * by the gateway so every composition decision is explainable to operators.
 */
export interface ComposedContextQuery {
  readonly capability: string;
  readonly verb: IntentVerb;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly reason: string;
}

/**
 * The capabilities whose grounding data marks a turn as a FOOD conversation.
 * A closed, evidence-checked list of the platform's registered food-knowledge
 * capabilities — never a keyword guess against the utterance.
 */
const FOOD_KNOWLEDGE_CAPABILITIES: ReadonlySet<string> = new Set([
  "food-intelligence",
  "nutrition-knowledge",
  "uplift",
  "opportunity-delivery",
  "nutrition-discovery",
]);

/**
 * Verbs that make a food-grounded turn RECOMMENDATION-shaped (the platform is
 * suggesting foods/changes) rather than purely informational ("what is
 * vitamin K?"). Recommendations warrant the household's practical context
 * (pantry / planner / shopping); informational answers keep their context
 * tight (household restrictions only).
 */
const RECOMMENDATION_VERBS: ReadonlySet<string> = new Set(["recommend", "report"]);

/**
 * Confidence assigned to derived context intents — deliberately below the
 * resolver's always-on profile baseline (0.50) so composed context never
 * outranks an utterance-driven resolution anywhere confidence is compared.
 */
export const COMPOSED_CONTEXT_CONFIDENCE = 0.45;

/**
 * Given the first wave's already-executed queries (shape + status only —
 * never payloads; this module joins nothing), decide which of the caller's
 * own context capabilities should additionally ground this turn.
 *
 * Returns [] when the turn is not food-grounded — a non-food turn composes
 * nothing, and the pipeline is byte-identical to before INT50.
 */
export function deriveFoodContextQueries(
  firstWave: readonly FirstWaveQuery[],
  hints: { readonly activePlannerWeekId?: number },
): ComposedContextQuery[] {
  // A turn is food-grounded only when a ROUTED (non-baseline) food-knowledge
  // capability actually produced grounding data this turn. Baseline reads and
  // gaps never trigger composition.
  const foodGrounded = firstWave.filter(
    (q) => !q.baseline && q.okData && FOOD_KNOWLEDGE_CAPABILITIES.has(q.capability),
  );
  if (foodGrounded.length === 0) return [];

  const alreadyQueried = new Set(firstWave.map((q) => q.capability));
  const recommendationShaped = foodGrounded.some((q) => RECOMMENDATION_VERBS.has(q.verb));

  const composed: ComposedContextQuery[] = [];

  // Safety first: household hard restrictions / diet patterns ground EVERY
  // food-grounded answer. The dietary-context scope is the household owner's
  // own aggregated projection (never joined or re-derived here).
  if (!alreadyQueried.has("household")) {
    composed.push({
      capability: "household",
      verb: "read",
      parameters: { scope: "dietary-context" },
      reason:
        "food-grounded turn: household hard restrictions and diet patterns must ground food guidance",
    });
  }

  if (recommendationShaped) {
    if (!alreadyQueried.has("pantry")) {
      composed.push({
        capability: "pantry",
        verb: "read",
        parameters: { scope: "list" },
        reason:
          "food recommendation turn: connect recommendations to what the household already has in the pantry",
      });
    }
    // The planner is organised by week-number × day-of-week and owns no
    // calendar mapping. A week is only readable when the surface told us
    // which one is active — this module never guesses a week (Principle 6).
    if (!alreadyQueried.has("planner") && hints.activePlannerWeekId != null) {
      composed.push({
        capability: "planner",
        verb: "read",
        parameters: { scope: "week", weekId: hints.activePlannerWeekId },
        reason:
          "food recommendation turn with an active planner week in view: connect recommendations to what is planned",
      });
    }
    if (!alreadyQueried.has("shopping")) {
      composed.push({
        capability: "shopping",
        verb: "read",
        parameters: { scope: "list" },
        reason:
          "food recommendation turn: connect recommendations to what is already on the shopping list",
      });
    }
  }

  return composed;
}

/**
 * Shape a composed context query as the baseline (grounding-only) intent the
 * gateway executes — the exact vocabulary the resolver's always-on profile
 * read established: still queried for grounding, never counted as
 * "understanding the question".
 */
export function toBaselineContextIntent(query: ComposedContextQuery): ResolvedIntent {
  return {
    capability: query.capability,
    verb: query.verb,
    parameters: query.parameters,
    confidence: COMPOSED_CONTEXT_CONFIDENCE,
    baseline: true,
  };
}
