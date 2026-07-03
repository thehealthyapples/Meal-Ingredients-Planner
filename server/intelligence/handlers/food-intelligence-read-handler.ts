/**
 * Food Intelligence Read Handler (FI3 — nineteenth live capability binding; extended FI4)
 * ============================================================================================
 * Makes the `food-intelligence` capability *executable* for the `recommend`, `explain`
 * and (FI4) `report` verbs, by delegating every request to the Food Intelligence Engine
 * or the Food Opportunity Engine through a {@link FoodIntelligenceReadPort}. This is the
 * first Domain Intelligence capability on the platform (FI1 §2, §7.1) — it proves the same
 * reusable Port → Handler → Binding pattern used by every other capability against a new
 * kind of owner: a reasoning engine that composes over other owners rather than
 * a single storage table.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only `recommend`, `explain` and `report` execute. There is NO write
 *     path — Food Intelligence never becomes a second owner of any business-domain fact
 *     (Rule FI1) and never writes anywhere itself. `report` (FI4) never modifies the
 *     caller's planner, pantry or shopping list — it only surfaces suggestions (no
 *     autonomous actions, per FI4 scope).
 *   • DELEGATION ONLY. All composition happens in the Food Intelligence Engine / Food
 *     Opportunity Engine via the port. This file contains NO join/rank/explain/prioritise
 *     logic of its own — it projects each engine's already-cited output.
 *   • PUBLIC BY DEFAULT, HOUSEHOLD-AWARE WHEN AUTHENTICATED. Like nutrition-knowledge,
 *     this binding answers anonymous/general `recommend`/`explain` callers with Stage 1
 *     (static, cited) recommendations. When a caller is authenticated, their OWN user id
 *     (never a client-supplied household id) is passed to the engine, which resolves their
 *     own household best-effort for an honest Stage 2 upgrade — never a denial,
 *     never a fabricated household. `report` (FI4) requires an authenticated caller with a
 *     resolvable household by construction — Food Opportunities are generated FROM a
 *     household's own existing activity, so there is no anonymous "general" answer to give.
 *   • HONEST GAPS. An unknown benefit/nutrient slug, a missing required parameter, a food
 *     not among the grounded/safety-cleared candidates, or (FI4) a caller with no
 *     resolvable household for `report` all return a structured honest gap — never a
 *     fabricated recommendation or opportunity (Principle 6).
 */

import {
  CapabilityExecutionError,
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { FoodIntelligenceReadPort } from "./food-intelligence-read-port.js";
import type { FoodIntelligenceBundle, FoodIntelligenceRecommendation, FoodIntelligenceTrust } from "../food-intelligence/engine.js";
import type { FoodOpportunity, FoodOpportunityTrust } from "../food-intelligence/opportunity-engine.js";
import { toInt, gap } from "./_read-kit.js";

// ---------------------------------------------------------------------------
// Result shapes
// ---------------------------------------------------------------------------

export interface FoodIntelligenceRecommendResult {
  readonly scope: "benefit" | "nutrient";
  readonly querySlug: string;
  readonly queryName: string;
  readonly recommendations: readonly FoodIntelligenceRecommendation[];
  readonly trust: FoodIntelligenceTrust;
  readonly source: "food-intelligence-engine";
}

export interface FoodIntelligenceExplainResult {
  readonly scope: "benefit" | "nutrient";
  readonly querySlug: string;
  readonly queryName: string;
  readonly recommendation: FoodIntelligenceRecommendation;
  readonly source: "food-intelligence-engine";
}

/** FI4 — the `report` verb's result: the caller's own prioritised Food Opportunities. */
export interface FoodOpportunityReportResult {
  readonly opportunities: readonly FoodOpportunity[];
  readonly trust: FoodOpportunityTrust;
  readonly source: "food-opportunity-engine";
}

// ---------------------------------------------------------------------------
// Parameter coercion (food-intelligence specific — not shared plumbing)
// ---------------------------------------------------------------------------

function toScope(value: unknown): "benefit" | "nutrient" | undefined {
  return value === "benefit" || value === "nutrient" ? value : undefined;
}

function toSlug(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s.length > 0 ? s : undefined;
}

const MAX_EXPLAIN_LOOKUP_LIMIT = 20;

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

async function handleRecommend(
  intent: Intent,
  context: IntelligenceContext,
  port: FoodIntelligenceReadPort,
): Promise<FoodIntelligenceRecommendResult> {
  const params = intent.parameters ?? {};
  const scope = toScope(params.scope);
  const slug = toSlug(params.slug);
  const limit = toInt(params.limit);

  if (!scope || !slug) {
    throw gap(
      'A Food Intelligence recommendation needs { scope, slug } — scope is "benefit" or "nutrient", ' +
        "slug is that benefit's or nutrient's canonical key from the Food Knowledge Registry.",
    );
  }

  const bundle: FoodIntelligenceBundle = await port.assembleFoodIntelligence({
    scope,
    slug,
    userId: toInt(context.userId),
    limit,
  });

  if (!bundle.trust.isGrounded || bundle.queryName == null) {
    throw gap(
      `Honest gap: the Food Knowledge Registry has no ${scope} recorded for slug ${JSON.stringify(slug)}. ` +
        "The Food Intelligence Engine will not infer or fabricate a recommendation for an unknown " +
        `${scope}.`,
    );
  }

  return {
    scope: bundle.scope,
    querySlug: bundle.querySlug,
    queryName: bundle.queryName,
    recommendations: bundle.recommendations,
    trust: bundle.trust,
    source: "food-intelligence-engine",
  };
}

async function handleExplain(
  intent: Intent,
  context: IntelligenceContext,
  port: FoodIntelligenceReadPort,
): Promise<FoodIntelligenceExplainResult> {
  const params = intent.parameters ?? {};
  const scope = toScope(params.scope);
  const slug = toSlug(params.slug);
  const foodSlug = toSlug(params.foodSlug);

  if (!scope || !slug || !foodSlug) {
    throw gap(
      'Explaining a Food Intelligence recommendation needs { scope, slug, foodSlug } — scope is ' +
        '"benefit" or "nutrient", slug is that benefit\'s or nutrient\'s canonical key, and foodSlug ' +
        "is the specific food to explain.",
    );
  }

  const bundle = await port.assembleFoodIntelligence({
    scope,
    slug,
    userId: toInt(context.userId),
    limit: MAX_EXPLAIN_LOOKUP_LIMIT,
  });

  if (!bundle.trust.isGrounded || bundle.queryName == null) {
    throw gap(
      `Honest gap: the Food Knowledge Registry has no ${scope} recorded for slug ${JSON.stringify(slug)}. ` +
        "The Food Intelligence Engine will not fabricate an explanation for an unknown " +
        `${scope}.`,
    );
  }

  const recommendation = bundle.recommendations.find((r) => r.slug === foodSlug);
  if (!recommendation) {
    throw gap(
      `Honest gap: ${JSON.stringify(foodSlug)} is not a grounded, safety-cleared recommendation for ` +
        `${scope} ${JSON.stringify(slug)}. Either the Food Knowledge Registry does not link this food to ` +
        `this ${scope}, or it was excluded due to a household hard-restriction conflict (Rule T0). The ` +
        "Food Intelligence Engine will not fabricate an explanation either way.",
    );
  }

  return {
    scope: bundle.scope,
    querySlug: bundle.querySlug,
    queryName: bundle.queryName,
    recommendation,
    source: "food-intelligence-engine",
  };
}

/**
 * FI4 — `report`: the caller's own prioritised, ambient Food Opportunities,
 * generated from their own existing planner, pantry and shopping activity.
 * Requires an authenticated caller with a resolvable household by construction
 * (never a client-supplied household id — `context.userId` only, mirroring every
 * other household-aware verb on this platform). A caller with no resolvable
 * household is an honest gap, never a fabricated report.
 */
async function handleReport(
  intent: Intent,
  context: IntelligenceContext,
  port: FoodIntelligenceReadPort,
): Promise<FoodOpportunityReportResult> {
  const params = intent.parameters ?? {};
  const limit = toInt(params.limit);
  const userId = toInt(context.userId);

  if (userId == null) {
    throw gap(
      "Food Opportunities are generated from your own household's existing planner, pantry and " +
        "shopping activity — sign in to see any. The Food Opportunity Engine will not fabricate " +
        "activity for an anonymous caller.",
    );
  }

  const bundle = await port.identifyOpportunities({ userId, limit });

  if (!bundle.trust.householdAware) {
    throw gap(
      "Honest gap: no household could be resolved for this caller, so there is no existing " +
        "planner, pantry or shopping activity to generate Food Opportunities from. The Food " +
        "Opportunity Engine will not fabricate a household or its activity.",
    );
  }

  return {
    opportunities: bundle.opportunities,
    trust: bundle.trust,
    source: "food-opportunity-engine",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the Food Intelligence read-only handler. `resolvePort` provides the
 * engine surface (production: the real Food Intelligence Engine; tests: an
 * in-memory owner). The returned handler is what the Capability Registry binds
 * to the `food-intelligence` capability (FI3).
 */
export function createFoodIntelligenceReadHandler(
  resolvePort: () => Promise<FoodIntelligenceReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    switch (intent.verb) {
      case "recommend":
        return handleRecommend(intent, context, await resolvePort());
      case "explain":
        return handleExplain(intent, context, await resolvePort());
      case "report":
        return handleReport(intent, context, await resolvePort());
      default:
        throw new CapabilityExecutionError(
          "gap",
          `Food Intelligence is bound to the Intelligence Platform read-only (FI3; extended FI4): "${intent.verb}" ` +
            "is not executable via the platform. Food Intelligence never writes to any business domain — " +
            "every write remains owned by that domain's own registered capability (Rule FI1).",
          intent.verb,
        );
    }
  };
}
