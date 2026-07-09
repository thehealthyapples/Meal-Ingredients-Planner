/**
 * Food Intelligence Read Port (FI3; extended FI4)
 * =================================================
 * The NARROW, read-only delegation surface the Food Intelligence capability handler
 * is allowed to call. Each method here forwards 1:1 to the Food Intelligence Engine
 * (`server/intelligence/food-intelligence/engine.ts`) or, since FI4, the sibling
 * Food Opportunity Engine (`server/intelligence/food-intelligence/opportunity-engine.ts`)
 * — both Domain Intelligence owners (per THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md
 * §2, §7.1). This port adds NO reasoning of its own; it is a typed seam so that:
 *   • the handler delegates (never re-implements) the join+rank+explain / opportunity
 *     composition, and
 *   • tests can inject an in-memory engine to prove delegation without a live database.
 *
 * Neither engine owns any business-domain data (Rule FI1) — they only compose over
 * existing Plane 1 (Food Knowledge Registry) and Plane 2 (household eaters, planner,
 * pantry, shopping history) owners. This port mirrors the same dynamic-import
 * discipline every other read port in this directory uses.
 */

import type {
  FoodIntelligenceBundle,
  FoodIntelligenceRequest,
} from "../food-intelligence/engine.js";
import type {
  FoodOpportunityBundle,
  FoodOpportunityRequest,
} from "../food-intelligence/opportunity-engine.js";
import type {
  FoodComparisonBundle,
  FoodComparisonRequest,
} from "../food-intelligence/comparison-engine.js";

/** The read-only owning-surface. Forwards to the Food Intelligence Engine, (FI4) the Food Opportunity Engine and (COMP1) the Food Comparison Engine. */
export interface FoodIntelligenceReadPort {
  /** Engine — deterministic join+rank+explain bundle for one benefit or nutrient. */
  assembleFoodIntelligence(request: FoodIntelligenceRequest): Promise<FoodIntelligenceBundle>;
  /** Opportunity Engine (FI4) — deterministic, prioritised Food Opportunities from the caller's own existing business-domain activity. */
  identifyOpportunities(request: FoodOpportunityRequest): Promise<FoodOpportunityBundle>;
  /** Comparison Engine (COMP1) — deterministic, cited comparison of two or more named foods/products, with honest gaps. */
  assembleFoodComparison(request: FoodComparisonRequest): Promise<FoodComparisonBundle>;
}

/**
 * Build the production port over the real Food Intelligence Engine and Food
 * Opportunity Engine. Imports are DYNAMIC so that loading the Intelligence
 * Platform module (and its tests) never opens a database connection at import
 * time — the engines' owners are only touched on first invocation.
 */
export async function createEngineFoodIntelligenceReadPort(): Promise<FoodIntelligenceReadPort> {
  const engine = await import("../food-intelligence/engine.js");
  const opportunityEngine = await import("../food-intelligence/opportunity-engine.js");
  const comparisonEngine = await import("../food-intelligence/comparison-engine.js");
  return {
    assembleFoodIntelligence: (request) => engine.assembleFoodIntelligence(request),
    identifyOpportunities: (request) => opportunityEngine.identifyOpportunities(request),
    assembleFoodComparison: (request) => comparisonEngine.assembleFoodComparison(request),
  };
}
