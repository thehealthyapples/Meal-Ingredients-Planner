/**
 * COMP3 — the one declaration of the shape a planner explanation travels in.
 *
 * `MealExplanation` and `PlannerExplanationEvidence` were declared TWICE, as
 * structural twins with no shared import: once in
 * `server/lib/explainability-service.ts` (the producer) and once in
 * `client/src/lib/planner-types.ts` (the renderer). Nothing connected them, so
 * nothing could see them disagree — and they already had:
 *
 *   - `evidence` was REQUIRED on the server and OPTIONAL on the client;
 *   - `dimension` was a fourteen-member union on the server and a bare `string`
 *     on the client.
 *
 * A twin type is worse than a duplicated function. A duplicated function drifts
 * loudly — behaviour changes. A duplicated type drifts SILENTLY: the compiler
 * checks each copy against itself and is structurally incapable of noticing that
 * the producer stopped emitting a field the renderer still reads. The drift is
 * only discovered by a household seeing a blank panel.
 *
 * ── Why both copies were right ───────────────────────────────────────────────
 * The optionality difference was not a mistake by either side; it was two
 * different true statements about two different moments:
 *
 *   - the PRODUCER always emits `evidence` — `reasons` is derived from it, so an
 *     explanation without evidence is unreachable by construction;
 *   - the RENDERER may legitimately receive one without — planner sessions
 *     persisted before PLAN1 carry `reasons` with no evidence trail, and those
 *     rows still exist.
 *
 * So this module keeps BOTH invariants rather than flattening them. The wire
 * shape below is the honest one — `evidence` optional, because that is what a
 * reader may actually find. The producer's stronger guarantee is expressed at
 * the producer, as `GeneratedMealExplanation` in `explainability-service.ts`,
 * which narrows `evidence` back to required. Converging a type must not weaken
 * the guarantee the owner actually offers.
 *
 * This module owns the SHAPE only. It authors no sentence, holds no dimension
 * logic, and does not decide what is explained — `explainability-service.ts`
 * remains the single owner of "why was this meal recommended?", exactly as
 * before.
 */

/** The intelligence dimensions a planner recommendation can be explained by. */
export type PlannerExplanationDimension =
  | "diet-match"
  | "household-suitability"
  | "nutrition-goals"
  | "pantry-usage"
  | "seasonal-suitability"
  | "plant-diversity"
  | "week-opportunity"
  | "household-history"
  | "planner-balance"
  | "shopping-impact"
  | "processing-level"
  | "budget-fit"
  | "cuisine-preference"
  | "overall-balance";

/**
 * One explained fact. `source` names the canonical owner the fact was read from.
 * Rule E1, as used by the Food Intelligence engines: no citation, no card.
 */
export interface PlannerExplanationEvidence {
  readonly dimension: PlannerExplanationDimension;
  /** The existing owner this fact came from. Never a model, never a guess. */
  readonly source: string;
  /** The sentence shown to the user. */
  readonly detail: string;
}

/**
 * A planner explanation as it travels and as a reader may find it.
 *
 * `evidence` is optional HERE and required at the producer — see the header.
 * Callers that need the guarantee should take `GeneratedMealExplanation` from
 * `server/lib/explainability-service.ts` rather than re-asserting it.
 */
export interface MealExplanation {
  title: string;
  reasons: string[];
  /** Every reason, with the owner it was read from. `reasons` is derived from this. */
  evidence?: PlannerExplanationEvidence[];
  scoreBreakdown: {
    healthScore: number;
    upfScore: number;
    budgetScore: number;
    preferenceMatch: number;
  };
}
