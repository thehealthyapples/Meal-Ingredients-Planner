/**
 * Meal Discovery Handler (INT26 — Phase 1)
 * ==========================================
 * The execution handler for the `meal-discovery` capability. It makes the
 * capability executable for the `search` verb by delegating every discovery
 * query to the MealDiscoveryEngine through a {@link MealDiscoveryPort}. It
 * follows the established Port → Handler → Binding pattern (INT2 through INT17).
 *
 * HARD BOUNDARIES:
 *   • READ-ONLY, ONE VERB. Only `search` executes. `recommend` (no ranking
 *     owner method yet) is a registered gap. All write verbs are gaps.
 *   • DELEGATION ONLY. All match logic, source fan-out, deduplication, and
 *     ranking live in MealDiscoveryEngine behind the port. This handler
 *     contains no source logic, no match predicates, no business rules.
 *   • OWNERSHIP-SCOPED BY CONSTRUCTION. The port's discover(query, userId)
 *     call passes the resolved userId; PersonalLibrarySource uses
 *     getMeals(userId) which is already caller-scoped by the storage owner.
 *   • NO NUTRITION. MealDiscoveryEngine never reads the nutrition table.
 *     DiscoveryItem carries no nutrition fields; they are never surfaced here.
 *   • HONEST GAPS. Empty results (mealCount 0) are ok, not gap. A missing or
 *     blank query is a gap. An unexecutable verb is a gap (read-only guard).
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { MealDiscoveryPort, MealDiscoverySearchResult, DiscoveryItem } from "./meal-discovery-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";
import { getSourcesQueried, getSafetyExclusion } from "../services/meal-discovery-engine.js";
import { withheldNote, nothingSuitableNote, safetyUnavailableNote } from "@shared/explanations/household-withholding";

/** Maximum results the handler passes through from the port. */
const DISCOVERY_MAX_RESULTS = 15;

/**
 * COMP-DET4 (2026-11-21) — built from fields the engine already computes
 * (`getSafetyExclusion`) and the canonical withholding wording (the same
 * sentences the planner's smart-suggest toast already uses), instead of
 * leaving the LLM to improvise its own ad-hoc explanation and, as live-caught
 * in the CB-012/013/014/018/020/021 cluster, sometimes assert an unverified
 * per-meal dietary conflict the engine never actually told it about.
 */
function buildMealDiscoveryDeterministicAnswer(
  query: string,
  results: readonly DiscoveryItem[],
  excludedForSafety: number,
  safetyStatus: "resolved" | "unavailable" | "unknown",
): string {
  if (safetyStatus === "unavailable") {
    return safetyUnavailableNote({
      subject: "these meals",
      consequence: "no results are shown",
      retryable: true,
    });
  }

  if (results.length === 0) {
    if (excludedForSafety > 0) {
      return nothingSuitableNote({
        attempt: `find a meal matching "${query}"`,
        consequence: `${excludedForSafety} candidate${excludedForSafety === 1 ? "" : "s"} matched the search but ${excludedForSafety === 1 ? "was" : "were"} excluded on dietary-safety grounds`,
      });
    }
    return `No meals matched "${query}".`;
  }

  const shown = results.slice(0, 5).map((r) => r.name);
  const namesText = results.length > shown.length ? `${shown.join(", ")}, and more` : shown.join(", ");
  const base = `Found ${results.length} meal${results.length === 1 ? "" : "s"} matching "${query}": ${namesText}.`;
  return excludedForSafety > 0 ? `${base} ${withheldNote({ count: excludedForSafety, noun: "meal" })}` : base;
}

// ---------------------------------------------------------------------------
// Search verb implementation
// ---------------------------------------------------------------------------

async function handleSearch(
  intent: Intent,
  userId: number,
  port: MealDiscoveryPort,
): Promise<MealDiscoverySearchResult> {
  const params = intent.parameters ?? {};
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";
  // COMP-DET4 — "browse everything, safety-filtered" is a deliberate, narrow opt-in
  // for matchers that genuinely mean "show me what's suitable" with no name/ingredient
  // term to search by (HOUSEHOLD_MEAL_SUITABILITY_COMPOUND, MEAL_GOAL_FIT_COMPOUND in
  // pattern-intent-resolver.ts). An empty query naturally matches every candidate in
  // the engine's own text filter (`"x".includes("")` is always true), so the gate below
  // only widens for an utterance that explicitly asked for exactly that — an ACCIDENTAL
  // blank query from anywhere else still gaps, per this handler's original design.
  const browseAll = params.browseAll === true;

  if (!rawQuery && !browseAll) {
    throw gap(
      "Meal discovery needs a non-empty { query } string — e.g. { query: \"chicken curry\" }.",
    );
  }

  const items = await port.discover(rawQuery, userId);
  const capped = items.slice(0, DISCOVERY_MAX_RESULTS);
  const { excludedForSafety, status } = getSafetyExclusion(items);

  return {
    scope: "discovery",
    query: rawQuery,
    totalCount: capped.length,
    results: capped,
    sourcesQueried: getSourcesQueried(items),
    source: "meal-discovery",
    excludedForSafety,
    safetyStatus: status,
    deterministicAnswer: buildMealDiscoveryDeterministicAnswer(rawQuery || "everything", capped, excludedForSafety, status),
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the meal-discovery handler. `resolvePort` provides the engine surface
 * (production: MealDiscoveryEngine backed by real storage; tests: in-memory stub).
 * The returned handler is what the Capability Registry binds to the
 * `meal-discovery` capability (INT26).
 */
export function createMealDiscoveryHandler(
  resolvePort: () => Promise<MealDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, MEAL_DISCOVERY_EXECUTABLE_INTENTS, "Meal Discovery");

    const userId = requireUserId(context, "Meal Discovery");
    const port = await resolvePort();

    return handleSearch(intent, userId, port);
  };
}

/**
 * The verbs this handler actually executes. Declared here so the binding can
 * import a single source of truth and pass it to readOnlyVerbGuard.
 * `recommend` is registered on the capability but remains a gap until a
 * delegate-only ranking method exists in MealDiscoveryEngine.
 */
export const MEAL_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;
