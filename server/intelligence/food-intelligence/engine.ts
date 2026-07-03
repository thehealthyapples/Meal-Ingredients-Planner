/**
 * Food Intelligence Engine (FI3 — Foundation)
 * ============================================
 * The first Food Intelligence Engine: a deterministic JOIN + RANK + EXPLAIN
 * composition over EXISTING canonical owners, producing reusable, explainable
 * Food Intelligence recommendations for any consuming surface (Planner,
 * Shopping, Cookbook, Pantry, Companion — per FI3 scope).
 *
 * GOVERNING ARCHITECTURE: docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md
 * This module IS the "Domain Intelligence" layer named there (§2, §7.1) — it sits
 * between the Intelligence Platform (routing) and the Business Domains (owners).
 * It owns its own reasoning process (this file) and ZERO business-domain data
 * (Rule FI1). Every fact this engine surfaces is read, unmodified, from an
 * existing owner:
 *
 *   Plane 1 (canonical knowledge)  → server/services/nutrition-knowledge-registry.ts
 *                                     (WS0 knowledge_* tables, SoT D1)
 *                                     + shared/canonical/nutrition-context.ts
 *                                     (curated evidence lines, already shown on
 *                                     the Food Report — reused, not re-authored)
 *   Plane 2 (household context)    → the Household capability's own port +
 *                                     enrichment (server/intelligence/handlers/
 *                                     household-read-port.ts, household-read-
 *                                     handler.ts's enrichEater) for restriction
 *                                     safety, and server/lib/food-intelligence-
 *                                     assembler.ts's fetchHouseholdPlannerFoods
 *                                     for planner familiarity (SoT D14)
 *
 * STAGE (Rule LT1 — no stage skips its predecessor's trust bar): this is Stage 1
 * (static, household-independent) with an honest Stage 2 (household-aware)
 * upgrade when a caller's own household resolves. There is NO learning, NO
 * personalisation-event log, NO external signal, and NO predictive ranking —
 * those are named, future-gated FI1 §8 Phase 2+ components, not built here.
 *
 * TRUST RULES ENFORCED HERE:
 *   Rule E1 (no citation, no card) — every recommendation is CONSTRUCTED from a
 *     Plane 1 citation (the food is a candidate only because the registry itself
 *     already links it to the requested benefit/nutrient); there is no code path
 *     that can produce an uncited recommendation.
 *   Rule T0 (safety supersedes everything) — when a household resolves, any
 *     candidate that conflicts with an active hard restriction is EXCLUDED
 *     outright (never merely deprioritised, never shown with a warning).
 *   Rule T1 (food, not bodies) — every explanation string names foods, links,
 *     and counts; none makes a claim about a body, a symptom, or an outcome.
 *   Rule G1 (Generic Knowledge Wall) — Plane 1 candidates and their citations
 *     are read exactly as the registry stores them; household context never
 *     writes back into or reshapes the Plane 1 read.
 *   Honest gaps — an unknown benefit/nutrient slug yields an empty, ungrounded
 *     bundle; a caller with no resolvable household yields Stage 1 (static)
 *     results, never a fabricated household context.
 *
 * TESTABILITY: the reasoning core — {@link rankAndExplain} — is a PURE function
 * (no I/O) over already-fetched candidates and an already-resolved household
 * signal, so the join+rank+explain+safety logic is fully unit-testable without a
 * database. {@link assembleFoodIntelligence} is the thin orchestration layer that
 * fetches from the existing owners above and calls it.
 */

import {
  getBenefitDetailView,
  getNutrientDetailView,
  type FoodCard,
} from "../../services/nutrition-knowledge-registry.js";
import { NUTRITION_CONTEXT } from "@shared/canonical/nutrition-context.js";
import {
  resolveActiveRestrictions,
  resolveIngredientRestrictions,
} from "@shared/restrictions/restriction-resolver.js";
import type { RestrictionDefinition } from "@shared/restrictions/restriction-types.js";
import { fetchHouseholdPlannerFoods } from "../../lib/food-intelligence-assembler.js";
import { createStorageHouseholdReadPort } from "../handlers/household-read-port.js";
import { enrichEater } from "../handlers/household-read-handler.js";

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** The Plane 1 fact that made a food a candidate at all (Rule E1 — no citation, no card). */
export interface FoodIntelligenceCitation {
  readonly factType: "benefit" | "nutrient";
  readonly factSlug: string;
  readonly factName: string;
}

/**
 * Stage 2 household context for one recommendation. Present ONLY when the
 * caller's own household resolved (never a client-supplied household id —
 * mirrors the Household capability's own discipline).
 */
export interface FoodIntelligenceHouseholdContext {
  readonly familiar: boolean;
  readonly plannerAppearanceCount: number;
}

export interface FoodIntelligenceRecommendation {
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  /** 1-based position in the final, ranked, safety-filtered list. */
  readonly rank: number;
  readonly citation: FoodIntelligenceCitation;
  /** Curated evidence line(s) for this food, when authored (shared/canonical/nutrition-context.ts). Empty when none — an honest gap, not a fabricated line. */
  readonly evidenceContext: readonly string[];
  readonly household: FoodIntelligenceHouseholdContext | null;
  /** Human-readable explanation trail — every sentence traces to a Plane 1 or Plane 2 fact above (Rule T1: food, not bodies). */
  readonly explanation: readonly string[];
}

export interface FoodIntelligenceTrust {
  /** False only when the requested benefit/nutrient slug does not resolve. */
  readonly isGrounded: boolean;
  /** True only when the caller's own household resolved and contributed context. */
  readonly householdAware: boolean;
  /** Count of otherwise-eligible candidates excluded for a hard-restriction conflict (Rule T0). */
  readonly excludedForSafety: number;
}

export interface FoodIntelligenceBundle {
  readonly scope: "benefit" | "nutrient";
  readonly querySlug: string;
  /** Null only when querySlug did not resolve — an honest gap, never a guessed name. */
  readonly queryName: string | null;
  readonly recommendations: readonly FoodIntelligenceRecommendation[];
  readonly trust: FoodIntelligenceTrust;
  readonly metadata: { readonly assembledAt: string; readonly sources: readonly string[] };
}

export interface FoodIntelligenceRequest {
  readonly scope: "benefit" | "nutrient";
  readonly slug: string;
  /**
   * The caller's own authenticated user id, used ONLY to resolve their own
   * household for Stage 2 context — never a client-supplied household id.
   * Omit for anonymous/general (Stage 1 static) results.
   */
  readonly userId?: number;
  readonly limit?: number;
}

/**
 * An already-resolved household signal — the pure input {@link rankAndExplain}
 * consumes. `resolved: false` is the honest "no household context" state (Stage 1).
 */
export interface HouseholdSignal {
  readonly resolved: boolean;
  readonly restrictionDefs: readonly RestrictionDefinition[];
  readonly familiarAppearances: ReadonlyMap<string, number>;
  /** The caller's own resolved household id, present only when `resolved` is true. Additive (FI4) — reused by the Food Opportunity Engine so household resolution is never re-derived a second time. */
  readonly householdId?: number;
}

/** The Stage 1 (static, no household) signal — exported so tests and callers share one constant. */
export const NO_HOUSEHOLD_SIGNAL: HouseholdSignal = {
  resolved: false,
  restrictionDefs: [],
  familiarAppearances: new Map(),
};

// ---------------------------------------------------------------------------
// Pure reasoning core — JOIN (candidates already resolved) + RANK + EXPLAIN
// ---------------------------------------------------------------------------

/**
 * Rank, safety-filter and explain a set of already-resolved Plane 1 candidates.
 * PURE — no I/O, no randomness, no clock reads. The same inputs always produce
 * byte-identical output (determinism required by Rule LT3 — the brain stays
 * deterministic — and by Rule E1/T0 below).
 *
 * Rule T0 (safety supersedes everything): any candidate whose name/category
 * conflicts with an active household restriction is EXCLUDED outright, never
 * merely deprioritised.
 *
 * Ranking: familiar (Stage 2 — already planned by this household) candidates
 * first; otherwise the registry's own editorial order (the order the Food
 * Knowledge Registry already returned candidates in) is preserved — a stable
 * sort, never a re-derived score.
 */
export function rankAndExplain(
  candidates: readonly FoodCard[],
  citation: FoodIntelligenceCitation,
  household: HouseholdSignal,
  limit: number = DEFAULT_LIMIT,
): { recommendations: FoodIntelligenceRecommendation[]; excludedForSafety: number } {
  let excludedForSafety = 0;
  const safeCandidates = candidates.filter((food) => {
    if (household.restrictionDefs.length === 0) return true;
    const matches = resolveIngredientRestrictions(`${food.name} ${food.category}`, [...household.restrictionDefs]);
    if (matches.length > 0) {
      excludedForSafety++;
      return false;
    }
    return true;
  });

  const ranked = safeCandidates
    .map((food, editorialIndex) => ({
      food,
      editorialIndex,
      familiar: household.familiarAppearances.has(food.slug),
    }))
    .sort((a, b) => {
      if (a.familiar !== b.familiar) return a.familiar ? -1 : 1;
      return a.editorialIndex - b.editorialIndex;
    });

  const clampedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const limited = ranked.slice(0, clampedLimit);

  const recommendations: FoodIntelligenceRecommendation[] = limited.map(({ food, familiar }, i) => {
    const evidenceContext = NUTRITION_CONTEXT[food.slug] ?? [];
    const appearances = household.familiarAppearances.get(food.slug) ?? 0;

    const explanation: string[] = [
      `${food.name} is linked to "${citation.factName}" in the source-gated Food Knowledge Registry.`,
    ];
    if (evidenceContext.length > 0) explanation.push(evidenceContext[0]);
    if (household.resolved && familiar) {
      explanation.push(
        `Your household has already planned meals with ${food.name} (${appearances} planner appearance${appearances === 1 ? "" : "s"}).`,
      );
    }

    return {
      slug: food.slug,
      name: food.name,
      category: food.category,
      rank: i + 1,
      citation,
      evidenceContext,
      household: household.resolved ? { familiar, plannerAppearanceCount: appearances } : null,
      explanation,
    };
  });

  return { recommendations, excludedForSafety };
}

// ---------------------------------------------------------------------------
// I/O orchestration — fetches from existing owners, then calls the pure core
// ---------------------------------------------------------------------------

/**
 * Resolve the caller's own household context, honestly. A caller with no
 * active household membership (or no userId at all) yields {@link NO_HOUSEHOLD_SIGNAL}
 * — Stage 1 static behaviour — never a thrown error surfaced to the
 * recommendation caller and never a fabricated household.
 *
 * Exported (FI4) so the Food Opportunity Engine (`opportunity-engine.ts`) reuses
 * this exact household resolution rather than re-deriving it a second time — the
 * same reuse discipline FI3 already established for `enrichEater`.
 */
export async function resolveHouseholdSignal(userId: number | undefined): Promise<HouseholdSignal> {
  if (userId == null) return NO_HOUSEHOLD_SIGNAL;

  try {
    const port = await createStorageHouseholdReadPort();
    const householdId = await port.getHouseholdForUser(userId);
    const [eaterRows, planner] = await Promise.all([
      port.getHouseholdEaters(householdId),
      fetchHouseholdPlannerFoods(householdId),
    ]);
    const eaters = await Promise.all(eaterRows.map((row) => enrichEater(row, port)));
    const allHardRestrictions = eaters.flatMap((e) => e.hardRestrictions);
    const restrictionDefs = resolveActiveRestrictions(allHardRestrictions);

    const familiarAppearances = new Map<string, number>();
    for (const slug of planner.enjoys) {
      const acc = planner.bySlug.get(slug);
      if (acc) familiarAppearances.set(slug, acc.appearances);
    }

    return { resolved: true, restrictionDefs, familiarAppearances, householdId };
  } catch {
    // No active household membership, or a household read failed — an honest
    // fallback to Stage 1, never a fabricated household context.
    return NO_HOUSEHOLD_SIGNAL;
  }
}

/**
 * Assemble a deterministic, cited, explainable Food Intelligence bundle for a
 * single canonical benefit or nutrient. Always returns a complete bundle —
 * never throws. An unknown slug yields an ungrounded, empty bundle.
 */
export async function assembleFoodIntelligence(
  request: FoodIntelligenceRequest,
): Promise<FoodIntelligenceBundle> {
  const now = new Date();

  let factName: string;
  let candidates: readonly FoodCard[];

  if (request.scope === "benefit") {
    const detail = await getBenefitDetailView(request.slug);
    if (!detail) {
      return {
        scope: request.scope,
        querySlug: request.slug,
        queryName: null,
        recommendations: [],
        trust: { isGrounded: false, householdAware: false, excludedForSafety: 0 },
        metadata: { assembledAt: now.toISOString(), sources: [] },
      };
    }
    factName = detail.benefit.name;
    candidates = detail.foods;
  } else {
    const detail = await getNutrientDetailView(request.slug);
    if (!detail) {
      return {
        scope: request.scope,
        querySlug: request.slug,
        queryName: null,
        recommendations: [],
        trust: { isGrounded: false, householdAware: false, excludedForSafety: 0 },
        metadata: { assembledAt: now.toISOString(), sources: [] },
      };
    }
    factName = detail.nutrient.name;
    candidates = detail.foods;
  }

  const sources: string[] = ["nutrition-knowledge-registry"];
  const household = await resolveHouseholdSignal(request.userId);
  if (household.resolved) sources.push("household-eaters", "planner-history");

  const citation: FoodIntelligenceCitation = {
    factType: request.scope,
    factSlug: request.slug,
    factName,
  };

  const { recommendations, excludedForSafety } = rankAndExplain(
    candidates,
    citation,
    household,
    request.limit ?? DEFAULT_LIMIT,
  );

  return {
    scope: request.scope,
    querySlug: request.slug,
    queryName: factName,
    recommendations,
    trust: {
      isGrounded: true,
      householdAware: household.resolved,
      excludedForSafety,
    },
    metadata: { assembledAt: now.toISOString(), sources: Array.from(new Set(sources)) },
  };
}
