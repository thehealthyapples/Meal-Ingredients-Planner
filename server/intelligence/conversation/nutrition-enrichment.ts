/**
 * nutrition-enrichment.ts — NUT1 Nutrition Capability Enrichment
 * =================================================================
 * Extends INT41's Capability Enrichment framework with two narrowly-scoped,
 * deterministic sources specific to the `nutrition-knowledge` capability:
 *
 *   1. EVIDENCE CONTEXT — when a turn's nutrition-knowledge result names a
 *      specific canonical food, surface that food's already-curated,
 *      evidence-based context line from shared/canonical/nutrition-context.ts
 *      (the same content the Food Report already displays). No new fact is
 *      authored here; a food with no curated line yields nothing (honest gap).
 *
 *   2. PERSONAL RELEVANCE — when the caller has a stated diet pattern or
 *      restriction (profile — read this turn by the platform's always-on
 *      profile baseline query, never a new read) AND the food actually being
 *      discussed genuinely conflicts with it under the SAME diet-compliance
 *      rules already used for recipe filtering (shared/dietRules.ts), surface
 *      one honest, narrowly-scoped insight. Silent otherwise — this never
 *      asserts a positive "this fits your diet" claim, only a real,
 *      rule-detected conflict.
 *
 * ARCHITECTURE — composed at the gateway, not owned by either capability:
 *   nutrition-knowledge's own read-only handler must never touch profile data
 *   (its documented hard boundary — see nutrition-knowledge-read-handler.ts).
 *   Rather than crossing that boundary, this module is called from
 *   conversation-gateway.ts with BOTH capabilities' own already-computed
 *   results for the same turn — the same pattern the gateway already uses to
 *   read across capabilities for discoveries/actions. Neither capability's
 *   handler gains new data access; nothing here is a second read.
 *
 * Deterministic, no LLM call, no persistence — mirrors companion-enrichment.ts's
 * discipline exactly. Every word traces to either shared/canonical/nutrition-
 * context.ts (nutrition-knowledge's own curated content) or the caller's own
 * profile fields run through shared/dietRules.ts's existing, already-used-in-
 * production compliance check. Nothing is inferred, guessed, or fabricated.
 *
 * Run tests: npx tsx server/tests/test-nutrition-enrichment.ts
 */

import { NUTRITION_CONTEXT } from "@shared/canonical/nutrition-context";
import { shouldExcludeRecipe } from "@shared/dietRules";
import type { CompanionEnrichmentItem } from "./companion-enrichment.js";

// ---------------------------------------------------------------------------
// Loosely-typed shape readers — the actual result/outcome types live in
// nutrition-knowledge-read-handler.ts / profile-read-handler.ts / conversation-
// gateway.ts. This module only reads the handful of fields it needs, defensively,
// so it never throws on an unexpected/absent shape (an honest gap, not a crash).
// ---------------------------------------------------------------------------

interface QueryResultLike {
  readonly status: string;
  readonly outcome?: { readonly result?: unknown };
}

export interface FoodRef {
  readonly slug: string;
  readonly name: string;
  /** Present only for the full "food" read scope — enough text to check diet compliance honestly. */
  readonly complianceText?: string;
}

/** Extract a food reference from a nutrition-knowledge result, whatever its scope. */
export function extractFoodRef(result: unknown): FoodRef | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;

  if (r.scope === "food" && typeof r.slug === "string" && typeof r.name === "string") {
    const parts = [r.name, r.category, r.subcategory, r.description].filter(
      (v): v is string => typeof v === "string" && v.length > 0,
    );
    return { slug: r.slug, name: r.name, complianceText: parts.join(" ").toLowerCase() };
  }

  if (
    (r.scope === "food-benefits" || r.scope === "food-benefit") &&
    typeof r.foodSlug === "string" &&
    typeof r.foodName === "string"
  ) {
    // "explain" scopes carry no category/description — not enough text to run
    // a compliance check honestly, but enough for the evidence-context lookup.
    return { slug: r.foodSlug, name: r.foodName };
  }

  return null;
}

interface DietContext {
  readonly dietPattern: string | null;
  readonly dietRestrictions: string[];
}

/** Extract the caller's own stated diet fields from a profile read result. Null when nothing is stated. */
function extractDietContext(result: unknown): DietContext | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  const profile = r.profile as Record<string, unknown> | undefined;
  if (r.scope !== "profile" || !profile) return null;

  const dietPattern = typeof profile.dietPattern === "string" ? profile.dietPattern : null;
  const dietRestrictions = Array.isArray(profile.dietRestrictions)
    ? profile.dietRestrictions.filter((v): v is string => typeof v === "string")
    : [];
  if (!dietPattern && dietRestrictions.length === 0) return null;

  return { dietPattern, dietRestrictions };
}

// ---------------------------------------------------------------------------
// 1. Evidence context
// ---------------------------------------------------------------------------

/** At most one curated context line surfaced per turn — a short, single insight, not a wall of text. */
const MAX_CONTEXT_LINES = 1;

function buildEvidenceContext(food: FoodRef): CompanionEnrichmentItem[] {
  const lines = NUTRITION_CONTEXT[food.slug];
  if (!lines || lines.length === 0) return [];
  return [
    {
      sourceDomain: "nutrition",
      sourceCapabilityId: "nutrition-knowledge",
      kind: "explanation",
      title: `Worth knowing about ${food.name}`,
      body: lines.slice(0, MAX_CONTEXT_LINES).join(" "),
    },
  ];
}

// ---------------------------------------------------------------------------
// 2. Personal relevance
// ---------------------------------------------------------------------------

function buildPersonalRelevance(food: FoodRef, diet: DietContext): CompanionEnrichmentItem[] {
  if (!food.complianceText) return [];
  const conflicts = shouldExcludeRecipe(food.complianceText, diet);
  if (!conflicts) return [];

  const dietLabel = diet.dietPattern ?? diet.dietRestrictions.join(", ");
  return [
    {
      sourceDomain: "nutrition",
      sourceCapabilityId: "nutrition-knowledge",
      kind: "insight",
      title: "Worth checking against your diet",
      body:
        `Your profile lists "${dietLabel}" — ${food.name} isn't a typical fit for that, ` +
        "so it may be worth double-checking before relying on it for meals under that pattern.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

/**
 * Build NUT1's nutrition-specific enrichment for a turn, given nutrition-
 * knowledge's and profile's own query results (whichever the gateway already
 * computed this turn — never a new read). Returns [] whenever nutrition-
 * knowledge did not succeed with a recognisable food this turn, whenever the
 * food has no curated evidence line AND no genuine diet conflict, or whenever
 * profile data is absent/empty — every branch is an honest gap, never a
 * fabricated fallback.
 */
export function buildNutritionEnrichment(
  nutritionQuery: QueryResultLike | undefined,
  profileQuery: QueryResultLike | undefined,
): CompanionEnrichmentItem[] {
  if (nutritionQuery?.status !== "ok-data") return [];
  const food = extractFoodRef(nutritionQuery.outcome?.result);
  if (!food) return [];

  const items: CompanionEnrichmentItem[] = [...buildEvidenceContext(food)];

  if (profileQuery?.status === "ok-data") {
    const diet = extractDietContext(profileQuery.outcome?.result);
    if (diet) items.push(...buildPersonalRelevance(food, diet));
  }

  return items;
}
