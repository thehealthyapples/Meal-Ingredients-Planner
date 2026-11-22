/**
 * Nutrition / Knowledge Read Port (INT4)
 * ======================================
 * The NARROW, read-only delegation surface the Nutrition / Knowledge capability handler
 * is allowed to call. Every method here is a 1:1 forward to an EXISTING owning-service
 * helper — the Nutrition / Knowledge owner (`server/services/nutrition-knowledge-registry.ts`,
 * SoT D1: WS0 `knowledge_*` tables). This port adds NO nutrition logic; it is a typed seam
 * so that:
 *   • the handler delegates (never re-implements) knowledge reads, and
 *   • tests can inject an in-memory owner to prove delegation without a live database.
 *
 * SOURCE-GATED BY CONSTRUCTION: every method forwarded here is one of the registry's
 * already display-safe helpers — they strip the internal `evidenceStrength` / `confidence`
 * / `source` editorial signals before returning. The port therefore inherits the owner's
 * non-fabrication and source-gating guarantees; there is no method here that exposes a raw
 * evidence signal, authors a claim, or writes anything (INT4 is read-only).
 *
 * GENERAL KNOWLEDGE ONLY: every method returns general, non-user-specific food knowledge.
 * There is no method that takes a `userId` or reaches user-specific / diary-linked data —
 * those summaries are owned elsewhere and are out of INT4 scope.
 *
 * GOVERNANCE: the Nutrition / Knowledge service remains the authoritative owner of all
 * nutrition facts, health-benefit wording and source references (TIP1 Principles 2 & 7).
 * This port only *reads* what the owner already exposes as display-safe.
 */

import type {
  FoodDetailView,
  NutrientDetailView,
  BenefitDetailView,
  DisplayBenefit,
  FoodCard,
  KnowledgeSearchResult,
} from "../../services/nutrition-knowledge-registry.js";

/**
 * COMP-DET2 (2026-11-20) — a THA Food Knowledge Encyclopedia entry
 * (`food_knowledge` table, authored by `seed-food-knowledge.ts`, served directly
 * at `/api/food-knowledge/*` for the standalone encyclopedia page). This is a
 * SEPARATE owner from the evidence-linked `knowledge_*` graph above — editorial,
 * general, non-personalized, and reviewed (gated on `isActive`) but without a
 * per-claim citation chain. The handler uses it ONLY as a fallback when the
 * evidence-linked benefit graph has nothing recorded for a food, so a caller
 * never gets a bare honest gap when THA's own encyclopedia already has an
 * answer sitting unused.
 */
export interface FoodKnowledgeEncyclopediaEntry {
  readonly slug: string;
  readonly title: string;
  readonly type: string;
  readonly shortSummary: string | null;
  readonly whatToKnow: string | null;
  readonly whyThaHighlightsThis: string | null;
  readonly simplerAlternatives: string | null;
}

/**
 * The read-only owning-service surface. Each method forwards to an existing,
 * display-safe Nutrition / Knowledge owner helper. No method mutates anything and no
 * method reaches user-specific data.
 */
export interface NutritionKnowledgeReadPort {
  /** Owner — display-safe food detail (benefits + nutrients) for a slug, or undefined if unknown/inactive. */
  getFoodDetailView(slug: string): Promise<FoodDetailView | undefined>;
  /** Owner — display-safe nutrient detail (foods + benefits) for a slug, or undefined if unknown/inactive. */
  getNutrientDetailView(slug: string): Promise<NutrientDetailView | undefined>;
  /** Owner — display-safe benefit detail (supporting foods) for a slug, or undefined if unknown/inactive. */
  getBenefitDetailView(slug: string): Promise<BenefitDetailView | undefined>;
  /** Owner — a food's health benefits with the internal evidence signal stripped (source-gated). */
  getFoodBenefitsForDisplay(foodSlug: string): Promise<DisplayBenefit[]>;
  /** Owner — unified partial search over foods / nutrients / benefits. */
  searchKnowledgeRegistry(query: string): Promise<KnowledgeSearchResult>;
  /** Owner — distinct food categories with counts, in editorial order. */
  listFoodCategories(): Promise<{ category: string; count: number }[]>;
  /** Owner — active foods, optionally filtered to one category, as display-safe cards. */
  listFoodCards(category?: string): Promise<FoodCard[]>;
  /** COMP-DET2 — the Food Knowledge Encyclopedia's entry for a slug (food or
   *  additive-concept), or undefined if it has none. Fallback source only. */
  getEncyclopediaEntry(slug: string): Promise<FoodKnowledgeEncyclopediaEntry | undefined>;
  /** FOODUI7 — the single best food match for free text, ranked exact-name > exact-alias
   *  > name-starts-with > alias-starts-with > substring (never the first SUBSTRING match
   *  `searchKnowledgeRegistry` would return, which is right for a results list but wrong
   *  for resolving "the one food a slug alias means" — see its own doc comment). */
  findBestFoodMatch(query: string): Promise<{ slug: string } | null>;
}

/**
 * Build the production port over the real owning service. Imports are DYNAMIC so that
 * loading the Intelligence Platform module (and its tests) never opens a database
 * connection at import time — the registry's `db` import is only executed on first
 * invocation.
 */
export async function createRegistryNutritionKnowledgeReadPort(): Promise<NutritionKnowledgeReadPort> {
  const registry = await import("../../services/nutrition-knowledge-registry.js");
  return {
    getFoodDetailView: (slug) => registry.getFoodDetailView(slug),
    getNutrientDetailView: (slug) => registry.getNutrientDetailView(slug),
    getBenefitDetailView: (slug) => registry.getBenefitDetailView(slug),
    getFoodBenefitsForDisplay: (foodSlug) => registry.getFoodBenefitsForDisplay(foodSlug),
    searchKnowledgeRegistry: (query) => registry.searchKnowledgeRegistry(query),
    listFoodCategories: () => registry.listFoodCategories(),
    listFoodCards: (category) => registry.listFoodCards(category),
    findBestFoodMatch: (query) => registry.findBestFoodMatch(query),
    getEncyclopediaEntry: async (slug) => {
      const { storage } = await import("../../storage.js");
      const row = await storage.getFoodKnowledgeBySlug(slug);
      if (!row) return undefined;
      return {
        slug: row.slug,
        title: row.title,
        type: row.type,
        shortSummary: row.shortSummary,
        whatToKnow: row.whatToKnow,
        whyThaHighlightsThis: row.whyThaHighlightsThis,
        simplerAlternatives: row.simplerAlternatives,
      };
    },
  };
}
