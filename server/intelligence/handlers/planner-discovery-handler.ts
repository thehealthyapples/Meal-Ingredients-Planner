/**
 * Planner Discovery Handler (INT28)
 * ====================================
 * The execution handler for the `planner-discovery` capability. Makes the capability
 * executable for the `search` verb by delegating every discovery query to the
 * PlannerDiscoveryEngine through a {@link PlannerDiscoveryPort}.
 *
 * HARD BOUNDARIES:
 *   • READ-ONLY, ONE VERB. Only `search` executes. All write verbs are gaps.
 *   • DELEGATION ONLY. All fan-out, name resolution, and filtering live in
 *     PlannerDiscoveryEngine behind the port. This handler contains no source
 *     logic, no match predicates, no business rules.
 *   • OWNERSHIP-SCOPED BY CONSTRUCTION. The port's discover(query, userId) call
 *     passes the resolved userId; getPlannerWeeks(userId) is already caller-scoped.
 *   • HONEST GAPS. An empty or blank query is a gap. No results (totalCount 0) is
 *     ok — not a gap. An unexecutable verb is a gap.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { PlannerDiscoveryPort, PlannerDiscoverySearchResult } from "./planner-discovery-port.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";

const PLANNER_DISCOVERY_EXECUTABLE_INTENTS = ["search"] as const;

async function handleSearch(
  intent: Intent,
  userId: number,
  port: PlannerDiscoveryPort,
): Promise<PlannerDiscoverySearchResult> {
  const params = intent.parameters ?? {};
  const rawQuery = typeof params.query === "string" ? params.query.trim() : "";

  if (!rawQuery) {
    throw gap(
      "Planner discovery needs a non-empty { query } string — e.g. { query: \"chicken\" }.",
    );
  }

  const items = await port.discover(rawQuery, userId);

  return {
    scope: "planner-search",
    query: rawQuery,
    totalCount: items.length,
    results: items,
    weeksScanned: -1,
    source: "planner-discovery",
  };
}

export function createPlannerDiscoveryHandler(
  resolvePort: () => Promise<PlannerDiscoveryPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, PLANNER_DISCOVERY_EXECUTABLE_INTENTS, "Planner Discovery");
    const userId = requireUserId(context, "Planner Discovery");
    const port = await resolvePort();
    return handleSearch(intent, userId, port);
  };
}

export { PLANNER_DISCOVERY_EXECUTABLE_INTENTS };
