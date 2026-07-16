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
 * Every number it touches was already computed by an existing canonical owner
 * and is handed to it as plain data by `server/lib/household-nutrition-assembler.ts`:
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

// ---------------------------------------------------------------------------
// Opportunities — the SAME shape FI4 already produces
// ---------------------------------------------------------------------------

/**
 * A household nutrition opportunity, in the EXACT shape FI4's `FoodOpportunity` already
 * uses — so that it flows through the SAME `opportunity-delivery` framework, adapted by the
 * SAME shared adapter (`adaptOpportunityReport`), and inherits its prioritisation, muting,
 * de-duplication, delivery lifecycle, attention budget and Evidence→Learning loop without
 * one line of new delivery code.
 *
 * HHP2 (2026-07-12) MADE THAT TRUE. HNP1 wrote the sentence above in the present tense while
 * building none of it: these opportunities were composed correctly and then returned only to
 * `GET /api/household-nutrition` and one React panel. No producer was ever enrolled in
 * `OPPORTUNITY_SOURCES`, so they never reached the Decision Engine — no muting, no lifecycle,
 * no budget, no learning, no Companion. The shape was right and the wiring was absent, which
 * is the most expensive kind of near-miss, because the comment asserting it had shipped is
 * exactly what stops the next reader from checking.
 *
 * The claim is now load-bearing rather than aspirational: the `household-health` capability
 * (HHP2) exposes these via its `report` verb, and it is registered in `OPPORTUNITY_SOURCES`.
 * Asserted by `server/tests/test-hhp2-household-health-opportunities.ts`.
 *
 * `owningDomain` is `"nutrition"`. Priority is NEVER `critical` (ATTN1 A2 — a quiet week is
 * not a harm signal, and `assertCriticalAllowed` would throw at the producer adapter if it
 * tried).
 */
export interface HouseholdNutritionOpportunity {
  readonly id: string;
  readonly type: string;
  readonly owningDomain: "nutrition";
  readonly priority: AttentionLevel;
  readonly explanation: string;
  readonly evidence: readonly EvidenceCitation[];
  readonly suggestedAction: string;
}

export const NUTRITION_OPPORTUNITY_TYPES = {
  plantDiversity: "nutrition-plant-diversity-gap",
  balance: "nutrition-balance-gap",
  planning: "nutrition-planning-gap",
} as const;

/**
 * Turn the WEAK dimensions of an existing score into opportunities. This adds no
 * fact: every opportunity restates a dimension the score already computed, cites the
 * same owner, and proposes the action that dimension implies.
 *
 * Emitted only where there is genuinely something to say:
 *   - a dimension that scored `null` produces NOTHING (no evidence → no card, Rule E1)
 *   - a dimension already at or above `STRONG_ENOUGH` produces nothing (THA does not
 *     manufacture a problem to have something to say)
 */
const STRONG_ENOUGH = 70;

export function buildOpportunities(
  facts: HouseholdNutritionFacts,
  score: HouseholdNutritionScore,
): HouseholdNutritionOpportunity[] {
  const out: HouseholdNutritionOpportunity[] = [];
  const by = new Map(score.dimensions.map((d) => [d.key, d]));

  const plant = by.get("plant-diversity");
  if (plant?.value != null && plant.value < STRONG_ENOUGH) {
    const remaining = WEEKLY_PLANT_TARGET - plant.actual;
    out.push({
      id: `${NUTRITION_OPPORTUNITY_TYPES.plantDiversity}:${facts.weekNumber ?? 0}`,
      type: NUTRITION_OPPORTUNITY_TYPES.plantDiversity,
      owningDomain: "nutrition",
      priority: "medium",
      explanation:
        `Your household has ${plant.actual} distinct ${plural(plant.actual, "plant", "plants")} ` +
        `planned this week, ${remaining} short of a diverse ${WEEKLY_PLANT_TARGET}.`,
      evidence: plant.evidence,
      suggestedAction: "Add a meal with a plant your household has not cooked recently",
    });
  }

  const balance = by.get("nutrition-balance");
  if (balance?.value != null && balance.value < STRONG_ENOUGH) {
    const missing = VARIETY_COMPONENTS.filter((c) => (facts.weeklyVariety[c] ?? 0) === 0);
    if (missing.length > 0) {
      out.push({
        id: `${NUTRITION_OPPORTUNITY_TYPES.balance}:${facts.weekNumber ?? 0}`,
        type: NUTRITION_OPPORTUNITY_TYPES.balance,
        owningDomain: "nutrition",
        priority: "low",
        explanation:
          `This week's plan covers ${balance.actual} of ${VARIETY_COMPONENT_COUNT} food components. ` +
          `${capitalise(joinAnd(missing.map(componentLabel)))} ${plural(missing.length, "is", "are")} missing.`,
        evidence: balance.evidence,
        suggestedAction: `Add ${joinOr(missing.map(componentLabel))} to a meal this week`,
      });
    }
  }

  const consistency = by.get("planning-consistency");
  if (consistency?.value != null && consistency.value < STRONG_ENOUGH) {
    const empty = PLANNER_WEEK_DAYS - consistency.actual;
    out.push({
      id: `${NUTRITION_OPPORTUNITY_TYPES.planning}:${facts.weekNumber ?? 0}`,
      type: NUTRITION_OPPORTUNITY_TYPES.planning,
      owningDomain: "nutrition",
      priority: "low",
      explanation: `${empty} ${empty === 1 ? "day has" : "days have"} no meal planned this week.`,
      evidence: consistency.evidence,
      suggestedAction: "Plan a meal for an empty day",
    });
  }

  return out;
}
