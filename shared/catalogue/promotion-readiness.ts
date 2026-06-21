// WS0.12 — Promotion Readiness Score + Promotion Queue.
//
// A catalogue food (tier='catalogue', status='draft') is INTERNAL. Before it can
// climb toward canonical it must be scored for how ready it is. The score is a
// transparent 100-point rubric over the qualities WS0.11 found to matter:
//
//   Name quality        20   (auto 20 / review 12 / manual 0)
//   Category mapped      20
//   Subcategory mapped   20
//   Macros present       20   (scaled by how many of the 5 key macros are present)
//   Aliases resolved     10
//   Scientific name      10
//   ───────────────────────
//   Total               100
//
// The score routes a food to the next STAGE of the promotion pipeline. The bands
// answer the WS0.12 questions:
//
//   ≥ 90 and name not "manual" and macros+category present  → READY FOR CANONICAL
//         (a THA reviewer signs off; nothing left to author)
//   ≥ 50                                                     → READY FOR CLAUDE AUTHORING
//         (enough signal for Claude to draft name/aliases/subcategory)
//   <  50  OR name == "manual"                               → NEEDS THA REVIEW FIRST
//         (a human must resolve the name/identity before automation helps)

import type { NameQuality } from "./name-normaliser";

export type PromotionStage =
  | "ready_for_canonical"
  | "ready_for_claude_authoring"
  | "needs_tha_review";

export interface PromotionInput {
  nameQuality: NameQuality;
  categoryMapped: boolean;       // thaCategory !== "Other"
  subcategoryMapped: boolean;    // thaSubcategory present and not ambiguous
  macrosPresent: number;         // 0..5 of the key macros present (post macro-fallback)
  aliasesResolved: boolean;      // at least one alias candidate harvested
  scientificNamePresent: boolean;
}

export interface PromotionReadiness {
  score: number;                 // 0..100
  stage: PromotionStage;
  breakdown: Record<string, number>;
  blockers: string[];            // why it is not yet ready_for_canonical
}

const NAME_POINTS: Record<NameQuality, number> = { auto: 20, review: 12, manual: 0 };

export function scorePromotionReadiness(input: PromotionInput): PromotionReadiness {
  const breakdown: Record<string, number> = {
    nameQuality: NAME_POINTS[input.nameQuality],
    categoryMapped: input.categoryMapped ? 20 : 0,
    subcategoryMapped: input.subcategoryMapped ? 20 : 0,
    macrosPresent: Math.round((Math.min(5, Math.max(0, input.macrosPresent)) / 5) * 20),
    aliasesResolved: input.aliasesResolved ? 10 : 0,
    scientificName: input.scientificNamePresent ? 10 : 0,
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Blockers that stop a food short of canonical regardless of score.
  const blockers: string[] = [];
  if (input.nameQuality === "manual") blockers.push("Name needs manual authoring");
  if (input.nameQuality === "review") blockers.push("Name phrasing needs human confirmation");
  if (!input.categoryMapped) blockers.push("Category not mapped (landed in Other)");
  if (input.macrosPresent < 4) blockers.push(`Only ${input.macrosPresent}/5 key macros present`);
  if (!input.subcategoryMapped) blockers.push("Subcategory unresolved");

  let stage: PromotionStage;
  if (
    score >= 90 &&
    input.nameQuality !== "manual" &&
    input.categoryMapped &&
    input.macrosPresent >= 4
  ) {
    stage = "ready_for_canonical";
  } else if (score >= 50 && input.nameQuality !== "manual") {
    stage = "ready_for_claude_authoring";
  } else {
    stage = "needs_tha_review";
  }

  return { score, stage, breakdown, blockers };
}

// ── Promotion Queue ──────────────────────────────────────────────────────────
//
// Readiness says "is this food clean?"; the queue says "which clean food do we
// promote FIRST?". WS0.10/0.11 recommend DEMAND-FIRST promotion: a food that
// appears in real household pantries/logs earns curation before an obscure one,
// even at equal readiness. `demandSignal` is an opaque 0..1 weight supplied by
// the caller (e.g. normalised household-log frequency); catalogue scope does not
// read household data itself.

export interface QueueItem {
  slug: string;
  readiness: number;             // 0..100 from scorePromotionReadiness
  demandSignal?: number;         // 0..1, optional; absent = 0
}

export interface RankedQueueItem extends QueueItem {
  priority: number;              // combined ranking score
}

/**
 * Rank catalogue foods for promotion. Demand dominates (a frequently-eaten food
 * is worth curating even at slightly lower readiness), with readiness as the
 * tie-breaker and quality floor. Pure function — no DB, no household reads.
 *
 *   priority = demand * 100 * DEMAND_WEIGHT + readiness * READINESS_WEIGHT
 */
export function rankPromotionQueue(
  items: QueueItem[],
  opts: { demandWeight?: number; readinessWeight?: number } = {},
): RankedQueueItem[] {
  const demandWeight = opts.demandWeight ?? 0.7;
  const readinessWeight = opts.readinessWeight ?? 0.3;
  return items
    .map((it) => ({
      ...it,
      priority: (it.demandSignal ?? 0) * 100 * demandWeight + it.readiness * readinessWeight,
    }))
    .sort((a, b) => b.priority - a.priority || b.readiness - a.readiness || a.slug.localeCompare(b.slug));
}
