/**
 * Household Health Read Handler (HHP2 — Household Health as a canonical Opportunity Platform)
 * ============================================================================================
 * Makes the `household-health` capability EXECUTABLE for the `report` verb, by delegating
 * every request to HNP1's existing Household Nutrition assembler through a
 * {@link HouseholdHealthReadPort}. It reuses the exact Port → Handler → Binding pattern
 * every other capability on this platform already uses.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS (and what it deliberately is not)
 * ---------------------------------------------------------------------------
 * HNP1 built a complete Household Health domain — a score, four dimensions, insights, and
 * a set of `HouseholdNutritionOpportunity` objects in the EXACT shape FI4 already produces.
 * Its own header stated that those opportunities "flow through the SAME opportunity-delivery
 * framework ... without one line of new delivery code".
 *
 * They did not. HNP1 never enrolled a producer, so its opportunities were reachable only
 * through `GET /api/household-nutrition` and one React panel. They never reached the
 * canonical Decision Engine (DEC1), so they had no muting, no delivery lifecycle, no
 * attention budget, no learning re-weight, no sealed decision, and no Evidence→Learning
 * loop — and the Companion could not say one word about a household's own health.
 *
 * HHP2 closes exactly that gap, and closes it the way the governing architecture says to:
 * DEC1 §7 — "a producer enrols by adding one entry to OPPORTUNITY_SOURCES: a capability id,
 * the verb to call, and an adapt()". This handler IS that capability id's `report` verb.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only `report` executes. Household Health never writes to any business
 *     domain — every write remains owned by that domain's own registered capability.
 *   • DELEGATION ONLY. Every figure is HNP1's, verbatim. This file contains no score, no
 *     threshold, no weight, no ranking and no prose about a household. It re-derives
 *     nothing and second-guesses nothing (DEC1 D5 — domain Selection stays with the domain).
 *   • OWNERSHIP-SCOPED. The household is resolved from the caller's OWN authenticated user
 *     id (`requireUserId`), never from a client-supplied parameter.
 *   • HONEST GAPS. An anonymous caller and an unresolvable household are honest gaps, never
 *     a fabricated household. A household that simply has no history yet is NOT a gap — see
 *     "the empty week is not a gap" below.
 */

import {
  CapabilityExecutionError,
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { HouseholdHealthReadPort } from "./household-health-read-port.js";
import type {
  HouseholdNutritionOpportunity,
  HouseholdNutritionScore,
  NutritionInsight,
  WeeklyNutritionSummary,
} from "../../../shared/nutrition/household-nutrition.js";
import { toInt, requireUserId, gap } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

/**
 * The `report` verb's result — HNP1's own report, projected.
 *
 * `opportunities` is the field the Decision Engine's producer adapter reads. It is
 * deliberately the FIRST field and structurally identical to FI4's
 * `FoodOpportunityReportResult.opportunities`, which is what allows both producers to share
 * ONE adapter in `opportunity-delivery/framework.ts` rather than each getting its own.
 *
 * The remaining fields are carried because HNP1 already composed them and a caller asking
 * the platform about a household's health should not have to make a second, different
 * request to a REST route to learn the score those opportunities came from.
 */
export interface HouseholdHealthReportResult {
  readonly opportunities: readonly HouseholdNutritionOpportunity[];
  /** `null` when not one dimension had data — silence, never a zero (HNP1 Trust Rule 2). */
  readonly score: HouseholdNutritionScore | null;
  readonly weekly: WeeklyNutritionSummary | null;
  readonly insights: readonly NutritionInsight[];
  /**
   * HNP1's own trust block, verbatim: which owners produced this, and which dimensions had
   * no data and were therefore NOT scored (rather than scored as zero).
   */
  readonly trust: {
    readonly available: boolean;
    readonly sources: readonly string[];
    readonly unscoredDimensions: readonly string[];
  };
  readonly source: "household-nutrition-platform";
}

// ---------------------------------------------------------------------------
// The `report` verb
// ---------------------------------------------------------------------------

/**
 * `report` — the household's own Health Opportunities, plus the score they came from.
 *
 * THE EMPTY WEEK IS NOT A GAP. A household whose household resolves but which has planned
 * nothing yet returns `ok` with `available: false` and NO opportunities — it does not throw.
 * That distinction is load-bearing for the Decision Engine's sealed record: a producer that
 * throws is counted as UNREACHED and vanishes from the DeliveryDecision entirely, while one
 * that returns an empty list is counted as reached-and-offered-nothing (`offered: 0`).
 * "This household has no health opportunities right now" is a true and useful statement
 * about a delivery moment; "Household Health was unreachable" would be a false one.
 *
 * A caller with no resolvable household IS a gap: there is no household to say anything
 * about, and HHP2 will not fabricate one.
 */
async function handleReport(
  intent: Intent,
  context: IntelligenceContext,
  port: HouseholdHealthReadPort,
): Promise<HouseholdHealthReportResult> {
  const userId = requireUserId(context, "Household Health");
  const weekNumber = toInt((intent.parameters ?? {}).weekNumber);

  let householdId: number;
  try {
    householdId = await port.getHouseholdForUser(userId);
  } catch {
    throw gap(
      "Honest gap: no household could be resolved for this caller, so there is no planner, " +
        "no analysed products and no nutrition history to report Household Health from. " +
        "The Household Health Platform will not fabricate a household or its activity.",
    );
  }

  const report = await port.assembleHouseholdHealth(userId, householdId, weekNumber);

  return {
    opportunities: report.opportunities,
    score: report.score,
    weekly: report.weekly,
    insights: report.insights,
    trust: {
      available: report.available,
      sources: report.trust.sources,
      unscoredDimensions: report.trust.unscoredDimensions,
    },
    source: "household-nutrition-platform",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the Household Health read-only handler. `resolvePort` provides the owning surface
 * (production: the real household resolver + HNP1 assembler; tests: an in-memory owner).
 */
export function createHouseholdHealthReadHandler(
  resolvePort: () => Promise<HouseholdHealthReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    switch (intent.verb) {
      case "report":
        return handleReport(intent, context, await resolvePort());
      default:
        throw new CapabilityExecutionError(
          "gap",
          `Household Health is bound to the Intelligence Platform read-only (HHP2): "${intent.verb}" ` +
            "is not executable via the platform. Household Health composes over existing owners " +
            "(planner, plant classifier, user_health_trends, Nutrition Centre) and writes to none " +
            "of them — every write remains owned by that domain's own registered capability.",
          intent.verb,
        );
    }
  };
}
