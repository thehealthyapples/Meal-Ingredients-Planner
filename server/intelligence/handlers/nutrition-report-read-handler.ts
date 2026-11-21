/**
 * Nutrition Report Read Handler (COMP-DET8 — twenty-fourth live capability binding)
 * ====================================================================================
 * Makes the `nutrition-report` capability executable for the READ-ONLY `read` verb,
 * by delegating to the household's real Nutrition Centre via a
 * {@link NutritionReportPort}.
 *
 * HARD BOUNDARIES:
 *   • READ-ONLY, ONE VERB. Only "read" executes. There is no code path here that
 *     writes a planner entry, a diary entry, or any household fact — the assembler
 *     (and the planner/diary owners it reads) remain the sole owners of all of it.
 *   • DELEGATION ONLY. This file contains NO diversity/coverage computation, NO
 *     category-progress logic, NO benefit-ranking of its own. Every figure in the
 *     projection below is `assembleNutritionCentre`'s own output, passed through.
 *   • HONEST GAPS. `available: false` (no planner/diary history in the requested
 *     window) is a structured gap, never an invented "nothing to report" summary
 *     that could be misread as "this household eats nothing".
 *
 * The handler is built by {@link createNutritionReportReadHandler} with a port
 * provider, so the production binding injects the real owning services and tests
 * inject an in-memory owner.
 */

import { type CapabilityHandler, type IntelligenceContext, type Intent } from "../types.js";
import { requireUserId, gap, readOnlyVerbGuard } from "./_read-kit.js";
import type { NutritionCentre, NutritionCentreWindow, NutritionReportPort } from "./nutrition-report-read-port.js";

export const NUTRITION_REPORT_EXECUTABLE_INTENTS = ["read"] as const;

// ---------------------------------------------------------------------------
// Result shape (read projection — the assembler's own output, surfaced honestly)
// ---------------------------------------------------------------------------

export interface NutritionReportReadResult {
  readonly scope: "centre";
  readonly window: NutritionCentreWindow;
  readonly overview: NutritionCentre["overview"];
  readonly journey: NutritionCentre["journey"];
  readonly categories: NutritionCentre["categories"];
  readonly benefits: NutritionCentre["benefits"];
  readonly source: "nutrition-centre-assembler";
  /** COMP-DET8 — same pattern as every other grounded answer tonight: state the
   *  real figures in code rather than handing the LLM a nested JSON object and
   *  hoping it enumerates and phrases every field correctly. */
  readonly deterministicAnswer: string;
}

// ---------------------------------------------------------------------------
// Deterministic answer
// ---------------------------------------------------------------------------

function buildNutritionReportDeterministicAnswer(centre: NutritionCentre, window: NutritionCentreWindow): string {
  const windowLabel = window === "this-week" ? "this week" : window === "this-year" ? "this year" : "overall";
  const parts: string[] = [];

  if (centre.overview) {
    parts.push(
      `${windowLabel.charAt(0).toUpperCase() + windowLabel.slice(1)}, your household has enjoyed ${centre.overview.plantDiversity} distinct plants and ${centre.overview.foodDiversity} distinct foods across ${centre.overview.mealsCooked} meals.`,
    );
  }

  if (centre.journey) {
    parts.push(
      `That covers ${centre.journey.categoriesCovered} of ${centre.journey.categoriesTotal} food categories, with ${centre.journey.nutrientCoverage}% nutrient coverage and ${centre.journey.benefitCoverage}% health-benefit coverage.`,
    );
  }

  const roomToGrow = centre.categories.filter((c) => c.enjoyed < c.total).slice(0, 3);
  if (roomToGrow.length > 0) {
    parts.push(`Categories with room to grow: ${roomToGrow.map((c) => `${c.category} (${c.enjoyed}/${c.total})`).join(", ")}.`);
  }

  return parts.length > 0
    ? parts.join(" ")
    : `No nutrition progress data is available for this household ${windowLabel}.`;
}

// ---------------------------------------------------------------------------
// Verb implementation
// ---------------------------------------------------------------------------

async function handleRead(
  intent: Intent,
  userId: number,
  port: NutritionReportPort,
): Promise<NutritionReportReadResult> {
  const params = intent.parameters ?? {};
  const window: NutritionCentreWindow =
    params.window === "this-week" || params.window === "this-year" ? params.window : "all-time";
  const weekId = typeof params.weekId === "number" ? params.weekId : undefined;

  // COMP-DET8 — the real assembler treats a "this-week" request with no resolved
  // weekNumber as UNFILTERED (silently equivalent to "all-time"), which would answer
  // a week-specific question with the household's entire history and call it "this
  // week". Guarded here, before the port is even called, rather than trusting every
  // caller to supply a week.
  if (window === "this-week" && weekId == null) {
    throw gap(
      "Honest gap: a \"this week\" nutrition report needs the active planner week " +
        "resolved first — without one, the Intelligence Platform will not substitute " +
        "the household's whole history and call it this week's progress.",
    );
  }

  const centre = await port.getNutritionCentre(userId, window, weekId);

  if (!centre.available) {
    throw gap(
      `Honest gap: THA has no nutrition progress data for this household ${window === "this-week" ? "this week" : window === "this-year" ? "this year" : "yet"} — not enough logged planner/diary history to compute plant diversity, category coverage or benefit coverage. The Intelligence Platform will not estimate or invent one.`,
    );
  }

  return {
    scope: "centre",
    window,
    overview: centre.overview,
    journey: centre.journey,
    categories: centre.categories,
    benefits: centre.benefits,
    source: "nutrition-centre-assembler",
    deterministicAnswer: buildNutritionReportDeterministicAnswer(centre, window),
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createNutritionReportReadHandler(
  resolvePort: () => Promise<NutritionReportPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, NUTRITION_REPORT_EXECUTABLE_INTENTS, "Nutrition Report");
    const userId = requireUserId(context, "Nutrition Report");
    const port = await resolvePort();
    return handleRead(intent, userId, port);
  };
}
