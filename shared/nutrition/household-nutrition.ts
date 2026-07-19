/**
 * household-nutrition.ts — HNP1 Household Nutrition Platform Foundation
 * =========================================================================
 * THE PURE REASONING CORE of the Household Nutrition Platform. Zero I/O, no
 * clock, no randomness, no database, no knowledge of its own.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS MODULE IS — AND, MORE IMPORTANTLY, WHAT IT IS NOT
 * ---------------------------------------------------------------------------
 * It is NOT a nutrition engine, and it computes NO nutrition fact.
 *
 * MAT1 (2026-07-18) — this module had NO production caller. Its I/O orchestrator
 * (`server/lib/household-nutrition-assembler.ts`) and its only UI
 * (`client/src/components/HouseholdNutritionPanel.tsx`) were retired as dead code,
 * along with this file's own opportunity limb — see
 * `docs/implementation/MAT1_PLATFORM_MATURITY_AND_TRUST.md` §3.3. The pure core
 * below was KEPT deliberately: unlike the opportunity limb, it duplicates no live
 * observation, and retiring it would have raised the cost of the then-open decision on
 * whether to enrol a nutrition producer.
 *
 * HNP2 (2026-07-19) — THAT DECISION WAS TAKEN, AND THIS MODULE NOW HAS A PRODUCTION
 * CALLER. `server/intelligence/food-intelligence/opportunity-engine.ts` imports
 * `computeHouseholdNutritionScore` and `buildNutritionBalanceOpportunity` and emits the
 * result into the canonical Opportunity Platform as the `nutrition` domain.
 *
 * BE SUSPICIOUS OF THE PARAGRAPH ABOVE — it is the fourth present-tense claim this file
 * has carried about being wired up, and the first three were false (HNP1 asserted it
 * aspirationally; HHP2 asserted "HHP2 MADE THAT TRUE" and built none of it; P0 found and
 * corrected both). It is written here only because it is asserted by execution rather
 * than by comment: `server/tests/test-hnp2-nutrition-balance-opportunity.ts` calls the
 * production generator, and `test-mat1-registry-conformance.ts` walks all four registries
 * the domain must appear in. Both are wired into `npm test`. If those suites are ever
 * removed, treat this paragraph as unproven until you have re-established it yourself.
 *
 * Read the paragraph below in the PAST tense.
 *
 * Every number it touches was already computed by an existing canonical owner and
 * was handed to it as plain data by the retired assembler:
 *
 *   plant diversity      → shared/canonical/plant-classifier (M4 — the single
 *                          canonical owner of "is this a plant, and which kind")
 *   variety components   → the SAME classifier's `VarietyScore` — its own five
 *                          components and its own per-meal caps, unchanged
 *   processing quality   → user_health_trends.averageThaRating (the existing
 *                          time-series owner, written by the UPF/Apple Rating
 *                          service — never recomputed here)
 *   planning consistency → the planner (SoT D14), via the household planner read
 *   food categories      → WS0 knowledge_* registry (SoT D1)
 *
 * This module's ONE job is **Selection**: composing facts that already exist
 * into one household-facing score, band and set of opportunities.
 *
 * That is deliberate, and it is the governing architecture's own instruction.
 * `THA_DECISION_ENGINE_ARCHITECTURE.md` D5 explicitly withholds domain Selection
 * (Planner scoring, COMP1's verdict ladder, uplift-engine) from the Decision
 * Engine and leaves it with the domain owner. A household nutrition score is
 * Selection. So it belongs HERE, in the Nutrition domain, and NOT in the Decision
 * Engine, the Behaviour Engine, or any new engine of its own.
 *
 * ---------------------------------------------------------------------------
 * THE TRUST RULES THIS MODULE ENFORCES STRUCTURALLY
 * ---------------------------------------------------------------------------
 * 1. **A dimension with no data scores NOTHING — it does not score zero.**
 *    `null` and `0` are different claims. A household that has never scanned a
 *    product has no processing-quality evidence; saying "0/100" would be an
 *    accusation THA cannot support. Every dimension is independently nullable.
 *
 * 2. **No data at all → NO SCORE.** `value: null`, and the surface goes silent.
 *    The platform never pads a score to make a dashboard look complete.
 *
 * 3. **The score always declares what it was computed FROM.** `dimensionsCounted`
 *    against `dimensionsTotal`, plus a `confidence` derived from it. A score built
 *    on one dimension is not the same claim as one built on four, and the surface
 *    is never allowed to forget which it is holding.
 *
 * 4. **Rule E1 — no citation, no card.** Every dimension and every opportunity
 *    carries `EvidenceCitation[]` naming the owner its numbers came from. An
 *    opportunity that cites nothing is never emitted.
 *
 * 5. **ATTN1 A2 — `critical` is a closed allowlist.** Nothing here is ever
 *    critical. A quiet week is not a harm signal, and `assertCriticalAllowed`
 *    would (correctly) throw if this module ever tried.
 *
 * 6. **No invented target.** The only target used is WEEKLY_PLANT_TARGET, which
 *    this product already shipped in four separate places before HNP1 (see below).
 *    Every other dimension is scored against a denominator THA itself owns — the
 *    classifier's five variety components, the Apple Rating's own 1–5 range, and
 *    the seven days of a week. No RDA, no reference intake, and no nutrient target
 *    is invented anywhere, because THA stores none and inventing one would be
 *    fabricating certainty.
 *
 * Run tests: npx tsx server/tests/test-household-nutrition.ts
 */

import type { EvidenceCitation } from "../attention/decision.js";
import type { AttentionLevel } from "../attention/index.js";
import { EMPTY_VARIETY_SCORE, type VarietyScore } from "../canonical/plant-classifier.js";

// ---------------------------------------------------------------------------
// The one weekly plant target
// ---------------------------------------------------------------------------

/**
 * 30 distinct plants a week — the widely cited diversity reference this product
 * has always used.
 *
 * IT IS DECLARED HERE BECAUSE IT WAS ALREADY DECLARED IN FOUR PLACES:
 *   client/src/components/PlantDiversityReport.tsx
 *   client/src/components/nutrition-variety-chips.tsx
 *   client/src/pages/home-experience-page.tsx
 *   (and implicitly by every surface that counted plants against "30")
 *
 * Four copies of a number that must always agree is four owners of one fact
 * (Core Principle: one owner per fact). HNP1 makes this the single owner and
 * converts those copies into imports. It is placed in `shared/` because both the
 * server (scoring) and the client (progress rings) legitimately need it, and a
 * constant is the one thing that may safely cross that boundary.
 *
 * This module INVENTS no other target — see Trust Rule 6 in the header.
 */
export const WEEKLY_PLANT_TARGET = 30;

/** The five variety components the canonical plant classifier already models. */
export const VARIETY_COMPONENTS = [
  "fruits",
  "vegetables",
  "wholeGrains",
  "herbsSpices",
  "oliveOil",
] as const satisfies readonly (keyof Omit<VarietyScore, "total">)[];

export const VARIETY_COMPONENT_COUNT = VARIETY_COMPONENTS.length;

/** Days in a planner week — the denominator for planning consistency. */
export const PLANNER_WEEK_DAYS = 7;

/** The Apple Rating scale (1–5) the UPF/Apple owner already produces. */
const APPLE_RATING_MIN = 1;
const APPLE_RATING_MAX = 5;

// ---------------------------------------------------------------------------
// The facts this module is GIVEN (it fetches none of them itself)
// ---------------------------------------------------------------------------

/**
 * Everything the assembler read from the existing owners, in their own shapes.
 * Every field is optional-by-absence: a `null` is that owner's own honest gap,
 * carried through rather than papered over.
 */
export interface HouseholdNutritionFacts {
  /** Distinct canonical plant slugs the household planned this week (plant-classifier). */
  readonly weeklyPlantSlugs: readonly string[];
  /** The week's summed VarietyScore — the classifier's own components and caps. */
  readonly weeklyVariety: VarietyScore;
  /** Planner entries placed this week, and how many of the 7 days have a meal. */
  readonly mealsPlanned: number;
  readonly daysWithMeals: number;
  /**
   * The household's average Apple Rating from `user_health_trends`, and how many
   * samples it rests on. `null` when the household has never had a product analysed —
   * the common case, and an honest gap, never a zero.
   */
  readonly averageAppleRating: number | null;
  readonly appleRatingSampleCount: number;
  /** WS0 food categories the week's foods fell into, and how many exist in total. */
  readonly categoriesCovered: number;
  readonly categoriesTotal: number;
  /** All-time distinct plants (the Nutrition Centre's existing figure) — context, not scored. */
  readonly allTimePlantDiversity: number | null;
  /** The planner week this report describes. */
  readonly weekNumber: number | null;
}

// ---------------------------------------------------------------------------
// The score
// ---------------------------------------------------------------------------

export type NutritionDimensionKey =
  | "plant-diversity"
  | "nutrition-balance"
  | "processing-quality"
  | "planning-consistency";

/**
 * One scored dimension. `value` is `null` when its owner had no data — the
 * dimension is then EXCLUDED from the score rather than counted as zero
 * (Trust Rule 1).
 */
export interface NutritionDimension {
  readonly key: NutritionDimensionKey;
  readonly label: string;
  /** 0–100, or null when this dimension's owner had nothing to say. */
  readonly value: number | null;
  /** The raw pair this dimension was derived from, for an honest "12 of 30" caption. */
  readonly actual: number;
  readonly target: number;
  /** The weight this dimension carries when present. Renormalised over present dimensions. */
  readonly weight: number;
  /** Rule E1 — the owner(s) this dimension's numbers came from. Never empty. */
  readonly evidence: readonly EvidenceCitation[];
}

export type NutritionBand = "building" | "developing" | "strong" | "thriving";

export type NutritionConfidence = "low" | "medium" | "high";

export interface HouseholdNutritionScore {
  /**
   * 0–100, or `null` when NOT ONE dimension had data. A null score is silence:
   * the surface renders nothing at all. It is never displayed as 0 (Trust Rule 2).
   */
  readonly value: number | null;
  readonly band: NutritionBand | null;
  readonly dimensions: readonly NutritionDimension[];
  /**
   * Trust Rule 3 — what this score was actually computed from. A 3-of-4 score and
   * a 1-of-4 score are different claims and must never be presented as the same one.
   */
  readonly dimensionsCounted: number;
  readonly dimensionsTotal: number;
  readonly confidence: NutritionConfidence;
  readonly evidence: readonly EvidenceCitation[];
}

/** The weights, declared once. Renormalised across whichever dimensions have data. */
const WEIGHTS: Readonly<Record<NutritionDimensionKey, number>> = {
  // Plant diversity carries the most weight because it is the belief THA is built on
  // (NK2 — diversity of plants over precision of macros). This is a stated product
  // judgement, not a clinical claim, and it is stated HERE rather than buried in a sum.
  "plant-diversity": 0.35,
  "nutrition-balance": 0.25,
  "processing-quality": 0.25,
  "planning-consistency": 0.15,
};

const BAND_THRESHOLDS: readonly { readonly min: number; readonly band: NutritionBand }[] = [
  { min: 80, band: "thriving" },
  { min: 60, band: "strong" },
  { min: 40, band: "developing" },
  { min: 0, band: "building" },
];

export const BAND_LABEL: Readonly<Record<NutritionBand, string>> = {
  building: "Building",
  developing: "Developing",
  strong: "Strong",
  thriving: "Thriving",
};

function bandFor(value: number): NutritionBand {
  for (const t of BAND_THRESHOLDS) if (value >= t.min) return t.band;
  return "building";
}

/** Clamp a ratio into 0–100. Pure, total, no surprises. */
function pct(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round(Math.max(0, Math.min(1, actual / target)) * 100);
}

/** How many of the classifier's five components the week actually contained. */
export function varietyComponentsPresent(variety: VarietyScore): number {
  return VARIETY_COMPONENTS.filter((c) => (variety[c] ?? 0) > 0).length;
}

/**
 * Compose the four dimensions. Each returns `value: null` when its owner had no
 * data — and each is scored against a denominator THA already owns.
 */
export function scoreDimensions(facts: HouseholdNutritionFacts): NutritionDimension[] {
  const plantCount = facts.weeklyPlantSlugs.length;
  const componentsPresent = varietyComponentsPresent(facts.weeklyVariety);

  // A week with NO planner entries has no plant, balance or consistency evidence at
  // all — not a score of zero. This is the single most important `null` in the module:
  // an empty planner is an absence of evidence, and THA does not grade a household on
  // a week it knows nothing about.
  const hasWeek = facts.mealsPlanned > 0;

  return [
    {
      key: "plant-diversity",
      label: "Plant diversity",
      value: hasWeek ? pct(plantCount, WEEKLY_PLANT_TARGET) : null,
      actual: plantCount,
      target: WEEKLY_PLANT_TARGET,
      weight: WEIGHTS["plant-diversity"],
      evidence: [
        {
          source: "planner",
          detail: `${plantCount} distinct plants across ${facts.mealsPlanned} planned meals`,
        },
      ],
    },
    {
      key: "nutrition-balance",
      label: "Nutrition balance",
      // Scored against the classifier's OWN five components — not an invented food
      // pyramid, and not a macro target THA does not store.
      value: hasWeek ? pct(componentsPresent, VARIETY_COMPONENT_COUNT) : null,
      actual: componentsPresent,
      target: VARIETY_COMPONENT_COUNT,
      weight: WEIGHTS["nutrition-balance"],
      evidence: [
        {
          source: "plant-classifier",
          detail:
            `${componentsPresent} of ${VARIETY_COMPONENT_COUNT} food components present ` +
            `(fruits, vegetables, whole grains, herbs & spices, olive oil)`,
        },
      ],
    },
    {
      key: "processing-quality",
      label: "Processing quality",
      // The Apple Rating is 1–5, so a 1 is the floor of the scale, not a zero. Mapping
      // it as (r-1)/4 keeps THA's own scale intact instead of inventing a new one.
      value:
        facts.averageAppleRating != null && facts.appleRatingSampleCount > 0
          ? pct(facts.averageAppleRating - APPLE_RATING_MIN, APPLE_RATING_MAX - APPLE_RATING_MIN)
          : null,
      actual: facts.averageAppleRating ?? 0,
      target: APPLE_RATING_MAX,
      weight: WEIGHTS["processing-quality"],
      evidence: [
        {
          source: "user_health_trends",
          detail:
            facts.averageAppleRating != null && facts.appleRatingSampleCount > 0
              ? `Average ${facts.averageAppleRating.toFixed(1)} apples across ${facts.appleRatingSampleCount} analysed products`
              : "No products analysed yet — this dimension is not scored",
        },
      ],
    },
    {
      key: "planning-consistency",
      label: "Planning consistency",
      value: hasWeek ? pct(facts.daysWithMeals, PLANNER_WEEK_DAYS) : null,
      actual: facts.daysWithMeals,
      target: PLANNER_WEEK_DAYS,
      weight: WEIGHTS["planning-consistency"],
      evidence: [
        {
          source: "planner",
          detail: `${facts.daysWithMeals} of ${PLANNER_WEEK_DAYS} days planned`,
        },
      ],
    },
  ];
}

function confidenceFor(counted: number): NutritionConfidence {
  if (counted >= 3) return "high";
  if (counted === 2) return "medium";
  return "low";
}

/**
 * THE HOUSEHOLD NUTRITION SCORE. Pure, total, deterministic.
 *
 * A weighted mean over ONLY the dimensions that have data, with the weights
 * renormalised across them. No dimension is ever counted as zero for want of
 * evidence; it is simply not counted, and the score says so (`dimensionsCounted`).
 */
export function computeHouseholdNutritionScore(
  facts: HouseholdNutritionFacts,
): HouseholdNutritionScore {
  const dimensions = scoreDimensions(facts);
  const present = dimensions.filter(
    (d): d is NutritionDimension & { value: number } => d.value !== null,
  );

  const dimensionsTotal = dimensions.length;
  const dimensionsCounted = present.length;

  // Trust Rule 2 — nothing to score is SILENCE, never a zero.
  if (dimensionsCounted === 0) {
    return {
      value: null,
      band: null,
      dimensions,
      dimensionsCounted: 0,
      dimensionsTotal,
      confidence: "low",
      evidence: [],
    };
  }

  const weightSum = present.reduce((sum, d) => sum + d.weight, 0);
  const weighted = present.reduce((sum, d) => sum + d.value * d.weight, 0);
  const value = Math.round(weighted / weightSum);

  return {
    value,
    band: bandFor(value),
    dimensions,
    dimensionsCounted,
    dimensionsTotal,
    confidence: confidenceFor(dimensionsCounted),
    // Rule E1 — the score cites every owner that actually contributed to it, and only those.
    evidence: present.flatMap((d) => d.evidence),
  };
}

// ---------------------------------------------------------------------------
// Weekly summary
// ---------------------------------------------------------------------------

export interface WeeklyNutritionSummary {
  readonly weekNumber: number | null;
  readonly mealsPlanned: number;
  readonly daysWithMeals: number;
  readonly plantCount: number;
  readonly plantTarget: number;
  readonly variety: VarietyScore;
  readonly componentsPresent: number;
  readonly componentsTotal: number;
  readonly evidence: readonly EvidenceCitation[];
}

export function buildWeeklySummary(facts: HouseholdNutritionFacts): WeeklyNutritionSummary {
  return {
    weekNumber: facts.weekNumber,
    mealsPlanned: facts.mealsPlanned,
    daysWithMeals: facts.daysWithMeals,
    plantCount: facts.weeklyPlantSlugs.length,
    plantTarget: WEEKLY_PLANT_TARGET,
    variety: facts.weeklyVariety ?? EMPTY_VARIETY_SCORE,
    componentsPresent: varietyComponentsPresent(facts.weeklyVariety),
    componentsTotal: VARIETY_COMPONENT_COUNT,
    evidence: [
      {
        source: "planner",
        detail: `${facts.mealsPlanned} meals across ${facts.daysWithMeals} days`,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Insights — sentences THIS module composes, from numbers it was GIVEN
// ---------------------------------------------------------------------------

/**
 * An insight is a finished sentence about the household's own week, written by the
 * fact's owner and rendered VERBATIM by the client.
 *
 * The client writes no prose about household data — that rule is already load-bearing
 * elsewhere in this codebase (`server/lib/meal-unlock.ts` was extracted precisely
 * because a component had started authoring sentences about a household's own data),
 * and HNP1 holds to it from the start rather than having to be corrected into it.
 *
 * An insight makes NO recommendation — that is what an opportunity is for. It states
 * what is true, and cites where it came from.
 */
export interface NutritionInsight {
  readonly id: string;
  readonly text: string;
  readonly evidence: readonly EvidenceCitation[];
}

export function buildInsights(
  facts: HouseholdNutritionFacts,
  score: HouseholdNutritionScore,
): NutritionInsight[] {
  const insights: NutritionInsight[] = [];
  const plantCount = facts.weeklyPlantSlugs.length;

  // Nothing is known about this week → nothing is said about it.
  if (score.value === null) return insights;

  if (facts.mealsPlanned > 0) {
    insights.push({
      id: "weekly-plants",
      text:
        `Your household planned ${plantCount} different ${plantCount === 1 ? "plant" : "plants"} ` +
        `this week, towards a diverse ${WEEKLY_PLANT_TARGET} a week.`,
      evidence: [
        { source: "planner", detail: `${facts.mealsPlanned} planned meals this week` },
        { source: "plant-classifier", detail: `${plantCount} distinct canonical plants` },
      ],
    });
  }

  const componentsPresent = varietyComponentsPresent(facts.weeklyVariety);
  if (componentsPresent > 0 && componentsPresent < VARIETY_COMPONENT_COUNT) {
    const missing = VARIETY_COMPONENTS.filter((c) => (facts.weeklyVariety[c] ?? 0) === 0);
    insights.push({
      id: "balance-spread",
      text:
        `You covered ${componentsPresent} of ${VARIETY_COMPONENT_COUNT} food components this week. ` +
        `${capitalise(joinAnd(missing.map(componentLabel)))} ${plural(missing.length, "is", "are")} not in the plan yet.`,
      evidence: [
        {
          source: "plant-classifier",
          detail: `${componentsPresent}/${VARIETY_COMPONENT_COUNT} components present`,
        },
      ],
    });
  }

  // All-time context, from the Nutrition Centre's OWN existing figure. Present-state,
  // never phrased as "you just reached this" — the platform cannot date that
  // (the same discipline notice-engine.ts already applies to diversity milestones).
  if (facts.allTimePlantDiversity != null && facts.allTimePlantDiversity > plantCount) {
    insights.push({
      id: "all-time-diversity",
      text:
        `Across everything your household has cooked, you have enjoyed ` +
        `${facts.allTimePlantDiversity} different plants.`,
      evidence: [
        {
          source: "nutrition-centre",
          detail: `${facts.allTimePlantDiversity} distinct plants all-time`,
        },
      ],
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// The ONE opportunity this module composes (HNP2)
// ---------------------------------------------------------------------------
//
// HISTORY, IN THE PAST TENSE — read it before adding a second type here.
//
// This module once carried a THREE-type opportunity limb. MAT1 (2026-07-18) §3.3
// retired all three, because two of them duplicated observations the LIVE Food
// Opportunity Engine already makes:
//
//   nutrition-plant-diversity-gap  → duplicated `planner-meal-uplift`   (FI4, live)
//   nutrition-planning-gap         → duplicated `planner-empty-day`     (FI4, live)
//   nutrition-balance-gap          → NOT a duplicate. Nothing else observes it.
//
// Enrolling all three would have shipped visible duplicate advice on day one. HNP2
// therefore revives EXACTLY ONE — the third — and the other two must never return.
// `server/tests/test-hnp2-nutrition-balance-opportunity.ts` asserts their absence by
// name, so a future edit cannot quietly reinstate the duplication MAT1 removed.
//
// WHY THIS ONE IS NOT A DUPLICATE, verified rather than assumed: no generator in
// `server/intelligence/food-intelligence/opportunity-engine.ts` reads `wholeGrains`,
// `herbsSpices`, `oliveOil`, `VARIETY_COMPONENT*` or `varietyComponentsPresent`.
// "Your week has no whole grains" is a claim only this module is in a position to make.
//
// This function ADDS NO FACT. It restates a dimension `scoreDimensions` already
// computed, cites that dimension's own evidence, and proposes the action it implies.

/** The single opportunity type this module owns. Not a union — there is exactly one. */
export const NUTRITION_BALANCE_GAP_TYPE = "nutrition-balance-gap";

/** The `nutrition` domain's opportunity, in the shape the delivery framework's contract defines. */
export interface HouseholdNutritionOpportunity {
  readonly id: string;
  readonly type: typeof NUTRITION_BALANCE_GAP_TYPE;
  readonly owningDomain: "nutrition";
  readonly priority: AttentionLevel;
  readonly explanation: string;
  readonly evidence: readonly EvidenceCitation[];
  readonly suggestedAction: string;
  /** The components absent from the week, lower-case, for a caller composing a subject label. */
  readonly missingComponents: readonly string[];
}

/**
 * Compose the household's balance-gap opportunity, or `null` when there is nothing
 * honest to say. Pure, total, deterministic.
 *
 * Returns `null` — never a padded card — when:
 *   • the balance dimension scored `null` (no week, no evidence → no card, Rule E1)
 *   • no component is actually missing (a full week has no gap to name)
 *
 * THE THRESHOLD THAT IS DELIBERATELY NOT HERE. The retired limb suppressed this card
 * unless the dimension scored below `STRONG_ENOUGH = 70`. HNP2 does not revive that
 * constant, and the omission is the point: 70 was neither a denominator nor a number
 * THA owned anywhere else — it was invented, and `test-household-nutrition.ts` §7 asserts
 * that the core contains no such number. Its only real effect was to stay silent when
 * exactly ONE of the five components was missing, which is a gap the household would
 * plainly want named.
 *
 * So the gate is the honest one — is a component actually absent? — and the noise
 * question is answered where it is already owned: `low` priority, the attention budget,
 * muting, and dismissal. This module does not get to pre-empt those by inventing a
 * number to go quiet behind.
 *
 * ATTN1 A2 — `priority` is `low` and can never be `critical`. A quiet week is not a
 * harm signal, and `CRITICAL_TYPES` does not contain this type.
 */
export function buildNutritionBalanceOpportunity(
  facts: HouseholdNutritionFacts,
  score: HouseholdNutritionScore,
): HouseholdNutritionOpportunity | null {
  const balance = score.dimensions.find((d) => d.key === "nutrition-balance");
  if (!balance || balance.value === null) return null;

  const missing = VARIETY_COMPONENTS.filter((c) => (facts.weeklyVariety[c] ?? 0) === 0);
  if (missing.length === 0) return null;

  const labels = missing.map(componentLabel);

  return {
    // The week scopes the id, so a new week re-surfaces the card and the same week
    // does not. `?? 0` mirrors the delivery framework's own tolerance for an
    // unnumbered week rather than inventing a number.
    id: `${NUTRITION_BALANCE_GAP_TYPE}:${facts.weekNumber ?? 0}`,
    type: NUTRITION_BALANCE_GAP_TYPE,
    owningDomain: "nutrition",
    priority: "low",
    explanation:
      `This week's plan covers ${balance.actual} of ${VARIETY_COMPONENT_COUNT} food components. ` +
      `${capitalise(joinAnd(labels))} ${plural(missing.length, "is", "are")} missing.`,
    // Rule E1 — the dimension's OWN citation, not a second one written here.
    evidence: balance.evidence,
    suggestedAction: `Add ${joinOr(labels)} to a meal this week`,
    missingComponents: labels,
  };
}

/**
 * The components as they read INSIDE a sentence — lower case, because that is where
 * they are used. A sentence that begins with one is capitalised by `capitalise()`,
 * so the noun is never carried around pre-capitalised and dropped mid-clause.
 */
const COMPONENT_LABEL: Readonly<Record<(typeof VARIETY_COMPONENTS)[number], string>> = {
  fruits: "fruit",
  vegetables: "vegetables",
  wholeGrains: "whole grains",
  herbsSpices: "herbs & spices",
  oliveOil: "olive oil",
};

function componentLabel(c: (typeof VARIETY_COMPONENTS)[number]): string {
  return COMPONENT_LABEL[c];
}

// ---------------------------------------------------------------------------
// Sentence construction
// ---------------------------------------------------------------------------
//
// These exist because this module is the ONLY author of prose about a household's
// own nutrition — the client renders its sentences verbatim and writes none of its
// own. A module that owns the sentence owns the grammar too: "Fruit and Whole grains
// and Herbs & spices are missing" and "1 distinct plants" are not acceptable output
// just because the numbers behind them are correct. A household reads the sentence,
// not the number.

/** "a" · "a and b" · "a, b and c" — never "a and b and c". */
function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "a" · "a or b" · "a, b or c" — never "a or b or c". */
function joinOr(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

function capitalise(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
