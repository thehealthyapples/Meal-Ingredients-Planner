/**
 * Nutrition Discovery Handler (INT27)
 * ======================================
 * The THIRTEENTH execution handler bound to the THA Intelligence Platform. It makes
 * the `nutrition-discovery` capability *executable* for SEARCH-ONLY intents, by:
 *
 *   1. Enforcing read-only verb guard (only "search" executes).
 *   2. Requiring an authenticated caller (requireUserId).
 *   3. Extracting and validating the query string.
 *   4. Parsing the query into a NutritionFilter via the engine's parseNutritionFilter.
 *   5. Delegating to the port (→ NutritionDiscoveryEngine).
 *   6. Returning a NutritionDiscoverySearchResult.
 *
 * HARD BOUNDARIES:
 *   • READ-ONLY. No mutation code path exists.
 *   • DELEGATION ONLY. No nutrition logic, no threshold constants — all in the engine.
 *   • HONEST GAPS. Unparseable query, no coverage, anonymous caller → honest gaps, never
 *     fabricated results.
 */

import type { CapabilityHandler, Intent, IntelligenceContext } from "../types.js";
import type { NutritionDiscoveryPort, NutritionDiscoverySearchResult } from "./nutrition-discovery-port.js";
import { parseNutritionFilter, NUTRITION_DISCOVERY_MAX_RESULTS, NutritionDiscoveryEngine } from "../services/nutrition-discovery-engine.js";
import { gap, requireUserId, readOnlyVerbGuard } from "./_read-kit.js";

export const NUTRITION_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;

/**
 * Create the Nutrition Discovery handler. `resolvePort` provides the port
 * (production: the real engine port; tests: an in-memory stub).
 */
export function createNutritionDiscoveryHandler(
  resolvePort: () => Promise<NutritionDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, ["search"], "Nutrition Discovery");

    const userId = requireUserId(context, "Nutrition Discovery");

    const rawQuery = typeof intent.parameters?.query === "string"
      ? intent.parameters.query.trim()
      : "";

    if (!rawQuery) {
      throw gap(
        "Nutrition Discovery needs a non-empty { query } string — e.g. " +
        "\"meals under 400 calories\" or \"high protein meals\".",
      );
    }

    const filter = parseNutritionFilter(rawQuery);
    if (!filter) {
      throw gap(
        "Nutrition Discovery could not parse a nutritional filter from that query. " +
        "Try something like: \"meals under 400 calories\", \"high protein meals\", " +
        "\"low carb recipes\", or \"meals with less than 10g fat\".",
      );
    }

    const port = await resolvePort();
    const engine = new NutritionDiscoveryEngine(port);
    const { results, mealsWithNutritionCount, mealsWithoutNutritionCount } =
      await engine.discover(filter, userId);

    const capped = results.slice(0, NUTRITION_DISCOVERY_MAX_RESULTS);

    const outcome: NutritionDiscoverySearchResult = {
      scope: "nutrition-filter",
      filter,
      rawQuery,
      totalCount: capped.length,
      mealsWithNutritionCount,
      mealsWithoutNutritionCount,
      results: capped,
      source: "nutrition-discovery",
    };

    return outcome;
  };
}
