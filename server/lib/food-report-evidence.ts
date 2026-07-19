// PKC2 — One Mouth Convergence: the evidence-gated Food Report composer.
//
// This is the ONE function through which every server (and, via its API
// route, client) consumer must read a Food Report's health-benefit claims.
// It composes two existing, unduplicated owners — never a third store:
//
//   Identity + nutrients + context  → shared/canonical/food-report-adapter.ts
//                                      (buildFoodReport, DB-free, seed-based)
//   Health-benefit CLAIMS           → server/services/nutrition-knowledge-
//                                      registry.ts's getFoodBenefitsForDisplay
//                                      (the Layer-2 evidence gate, PKC Phase 0:
//                                      requires a valid SourceRef + human
//                                      reviewedAt sign-off before a claim may
//                                      render)
//
// Before PKC2, `buildFoodReport()`'s `healthBenefits`/`additionalBenefits`
// read the raw, unsourced editorial seed directly — a second, ungated "mouth"
// for the same fact type the Pantry/Boost surfaces already read only through
// the evidence gate (PKC1 Finding 2). This module closes that gap: it is now
// the only place `healthBenefits`/`additionalBenefits` are populated with
// real content, and every consumer that used to call `buildFoodReport()`
// directly for those two fields now calls this instead.
//
// Server-only (imports the DB-backed registry) — never import this from a
// client-bundled file.
//
// NUTPLAN2 correction: this comment used to end "The client reads it via
// GET /api/foods/:slug/report." THAT ROUTE HAS NEVER EXISTED — the string
// appeared exactly once in the repository, in this comment. The evidence-gated
// report reaches the client only INDIRECTLY, embedded in the payloads of
// `/api/foods/:slug/intelligence`, `/api/foods/:slug/connected` and the meal
// intelligence assembler. A comment that names a route which does not exist is
// worse than no comment: the next reader goes looking for a consumer that was
// never there, and NUTPLAN1 logged exactly that wasted search.

import {
  buildFoodReport,
  type FoodReportKnowledge,
} from "@shared/canonical/food-report-adapter";
import { CANONICAL_SEED } from "@shared/canonical/foods";
import { getFoodBenefitsForDisplay } from "../services/nutrition-knowledge-registry";

/**
 * Assemble the evidence-backed Food Report for a canonical food slug.
 *
 * Identical shape to `buildFoodReport()`, except `healthBenefits` and every
 * variety's `additionalBenefits` are populated from the Layer-2 evidence gate
 * instead of always being empty. Returns null under the same conditions as
 * `buildFoodReport()` (unknown slug, preparation, multi-food container).
 */
export async function getEvidenceBackedFoodReport(
  canonicalSlug: string,
): Promise<FoodReportKnowledge | null> {
  const report = buildFoodReport(canonicalSlug);
  if (!report) return null;

  const entry = CANONICAL_SEED.find((e) => e.food.slug === canonicalSlug);
  const parentKnowledgeSlug = entry?.food.knowledgeFoodSlug ?? null;

  const [parentBenefits, varietyBenefitLists] = await Promise.all([
    parentKnowledgeSlug ? getFoodBenefitsForDisplay(parentKnowledgeSlug) : Promise.resolve([]),
    Promise.all(
      report.varieties.map((v) => {
        const vKnowledgeSlug =
          entry?.varieties?.find((ev) => ev.slug === v.slug)?.knowledgeFoodSlug ?? null;
        return vKnowledgeSlug ? getFoodBenefitsForDisplay(vKnowledgeSlug) : Promise.resolve([]);
      }),
    ),
  ]);

  const parentBenefitNames = parentBenefits.map((b) => b.benefit.name);
  const parentBenefitNameSet = new Set(parentBenefitNames);

  const varieties = report.varieties.map((v, i) => ({
    ...v,
    additionalBenefits: varietyBenefitLists[i]
      .map((b) => b.benefit.name)
      .filter((name) => !parentBenefitNameSet.has(name)),
  }));

  return {
    ...report,
    healthBenefits: parentBenefitNames,
    varieties,
  };
}
