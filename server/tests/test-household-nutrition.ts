/**
 * test-household-nutrition.ts (HNP1)
 * ==========================================================================
 * Verifies the Household Nutrition Platform Foundation — the pure reasoning
 * core in `shared/nutrition/household-nutrition.ts` and the ownership
 * boundaries the platform depends on it holding.
 *
 * The core is pure, total and deterministic, so it is tested directly with no
 * database, no clock and no fixtures beyond plain facts. The I/O orchestrator
 * (`server/lib/household-nutrition-assembler.ts`) holds no rule, threshold,
 * weight or sentence, so there is nothing in it to unit-test — what it MUST NOT
 * do is asserted by source-scan in §7 instead.
 *
 * Coverage:
 *   §1  Trust Rules 1 & 2 — a dimension with no data scores NOTHING, not zero;
 *       and no data at all yields a NULL score, never a padded 0. This is the
 *       distinction the whole platform's honesty rests on.
 *   §2  The score — weights renormalised across only the dimensions that have
 *       data, so a 2-of-4 score is a true weighted mean of those two and is
 *       never diluted by absent evidence.
 *   §3  Trust Rule 3 — the score always declares what it was computed FROM
 *       (dimensionsCounted / dimensionsTotal / confidence).
 *   §4  Bands, and the 1–5 Apple Rating mapped onto THA's OWN scale (a rating
 *       of 1 is the floor of the scale, NOT a zero).
 *   §5  Rule E1 — no citation, no card. Every dimension and every opportunity
 *       names the owner its numbers came from.
 *   §6  ATTN1 A2 — nothing here is ever `critical`. Asserted against the real
 *       `assertCriticalAllowed`, which would throw if it ever were.
 *   §7  Ownership (Principle: one owner per fact) — source-scan: the core
 *       invents no target beyond WEEKLY_PLANT_TARGET, the assembler recomputes
 *       no figure it was given, and WEEKLY_PLANT_TARGET is declared exactly
 *       ONCE in the repository.
 *   §8  Purity — same facts in, byte-identical report out.
 *
 * Run with: npx tsx server/tests/test-household-nutrition.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { assertCriticalAllowed } from "../../shared/attention/index.js";
import { EMPTY_VARIETY_SCORE, type VarietyScore } from "../../shared/canonical/plant-classifier.js";
import {
  BAND_LABEL,
  PLANNER_WEEK_DAYS,
  VARIETY_COMPONENT_COUNT,
  WEEKLY_PLANT_TARGET,
  buildInsights,
  buildOpportunities,
  buildWeeklySummary,
  computeHouseholdNutritionScore,
  varietyComponentsPresent,
  type HouseholdNutritionFacts,
} from "../../shared/nutrition/household-nutrition.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n${name}`);
  console.log("-".repeat(56));
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");

function sourceOf(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

// ---------------------------------------------------------------------------
// Fact builders — plain data, exactly as the assembler hands it over
// ---------------------------------------------------------------------------

function variety(partial: Partial<VarietyScore>): VarietyScore {
  const v = { ...EMPTY_VARIETY_SCORE, ...partial };
  v.total = v.fruits + v.vegetables + v.wholeGrains + v.herbsSpices + v.oliveOil;
  return v;
}

/** A household THA knows NOTHING about: no planner, no analysed products. */
const EMPTY_FACTS: HouseholdNutritionFacts = {
  weeklyPlantSlugs: [],
  weeklyVariety: EMPTY_VARIETY_SCORE,
  mealsPlanned: 0,
  daysWithMeals: 0,
  averageAppleRating: null,
  appleRatingSampleCount: 0,
  categoriesCovered: 0,
  categoriesTotal: 0,
  allTimePlantDiversity: null,
  weekNumber: 1,
};

function facts(over: Partial<HouseholdNutritionFacts> = {}): HouseholdNutritionFacts {
  return { ...EMPTY_FACTS, ...over };
}

/** A household with a planned week but NO product ever analysed — the common case. */
const NO_PRODUCTS_SCANNED = facts({
  weeklyPlantSlugs: Array.from({ length: 15 }, (_, i) => `plant-${i}`),
  weeklyVariety: variety({ fruits: 3, vegetables: 3, wholeGrains: 1 }),
  mealsPlanned: 6,
  daysWithMeals: 5,
  averageAppleRating: null,
  appleRatingSampleCount: 0,
});

async function main(): Promise<void> {
  console.log("\nHNP1 — Household Nutrition Platform Foundation");
  console.log("=".repeat(56));

  // =========================================================================
  section("§1  Trust Rules 1 & 2 — nothing known is SILENCE, never a zero");
  // =========================================================================

  const empty = computeHouseholdNutritionScore(EMPTY_FACTS);

  assert(
    empty.value === null,
    "a household THA knows nothing about gets a NULL score, not 0",
    `got ${empty.value}`,
  );
  assert(empty.band === null, "a null score carries no band — there is nothing to band");
  assert(
    empty.dimensionsCounted === 0 && empty.dimensionsTotal === 4,
    "the null score still declares it counted 0 of 4 dimensions",
  );
  assert(
    empty.evidence.length === 0,
    "a score computed from nothing cites nothing (Rule E1 — it would have nothing to cite)",
  );
  assert(
    empty.dimensions.every((d) => d.value === null),
    "EVERY dimension is null, not zero — an empty planner is an absence of evidence, not a bad week",
  );

  // The single most important assertion in this file: 0 and null are different claims.
  const scored = computeHouseholdNutritionScore(NO_PRODUCTS_SCANNED);
  const processing = scored.dimensions.find((d) => d.key === "processing-quality")!;
  assert(
    processing.value === null,
    "a household that has never scanned a product scores NULL on processing quality — never 0",
    `got ${processing.value}`,
  );
  assert(
    scored.value !== null && scored.value > 0,
    "…and its OTHER dimensions still score — one missing owner never blocks the rest",
  );
  assert(
    !scored.dimensions.some((d) => d.value === 0 && d.key === "processing-quality"),
    "THA never states an unevidenced 0 — that would be an accusation it cannot support",
  );

  // =========================================================================
  section("§2  The score — weights renormalised over PRESENT dimensions only");
  // =========================================================================

  // Plant 15/30 = 50. Balance 3/5 = 60. Consistency 5/7 = 71. Processing absent.
  // Weights: plant .35, balance .25, consistency .15 → sum .75
  // (50*.35 + 60*.25 + 71*.15) / .75 = (17.5 + 15 + 10.65) / .75 = 57.53 → 58
  const plant = scored.dimensions.find((d) => d.key === "plant-diversity")!;
  const balance = scored.dimensions.find((d) => d.key === "nutrition-balance")!;
  const consistency = scored.dimensions.find((d) => d.key === "planning-consistency")!;

  assert(plant.value === 50, "plant diversity: 15 of 30 → 50", `got ${plant.value}`);
  assert(balance.value === 60, "nutrition balance: 3 of 5 components → 60", `got ${balance.value}`);
  assert(
    consistency.value === 71,
    "planning consistency: 5 of 7 days → 71",
    `got ${consistency.value}`,
  );

  const present = [plant, balance, consistency];
  const wSum = present.reduce((s, d) => s + d.weight, 0);
  const expected = Math.round(present.reduce((s, d) => s + d.value! * d.weight, 0) / wSum);
  assert(
    scored.value === expected,
    `the score is the weighted mean of ONLY the 3 present dimensions (${expected})`,
    `got ${scored.value}`,
  );

  // The renormalisation is the point: absent evidence must not drag the score down.
  const naiveOverAllFour = Math.round(
    present.reduce((s, d) => s + d.value! * d.weight, 0) / 1.0, // as if the absent one were 0
  );
  assert(
    scored.value! > naiveOverAllFour,
    "an absent dimension does NOT silently dilute the score toward zero",
    `renormalised ${scored.value} vs diluted ${naiveOverAllFour}`,
  );

  // A household with EVERY dimension present renormalises over a full weight sum of 1.
  const complete = computeHouseholdNutritionScore(
    facts({
      weeklyPlantSlugs: Array.from({ length: 30 }, (_, i) => `p${i}`),
      weeklyVariety: variety({ fruits: 3, vegetables: 3, wholeGrains: 1, herbsSpices: 1, oliveOil: 1 }),
      mealsPlanned: 7,
      daysWithMeals: 7,
      averageAppleRating: 5,
      appleRatingSampleCount: 12,
    }),
  );
  assert(
    complete.value === 100 && complete.band === "thriving",
    "a perfect week across all four dimensions scores exactly 100 (no rounding drift)",
    `got ${complete.value}`,
  );
  assert(
    complete.dimensionsCounted === 4,
    "…and declares all 4 dimensions counted",
  );

  // =========================================================================
  section("§3  Trust Rule 3 — the score declares what it was computed FROM");
  // =========================================================================

  assert(
    scored.dimensionsCounted === 3 && scored.dimensionsTotal === 4,
    "a 3-of-4 score says so — it is not presented as the same claim as a 4-of-4",
  );
  assert(scored.confidence === "high", "3+ dimensions → high confidence", scored.confidence);
  assert(
    computeHouseholdNutritionScore(
      facts({ mealsPlanned: 1, daysWithMeals: 1, weeklyPlantSlugs: ["a"] }),
    ).confidence === "high",
    "a planned week yields 3 dimensions (plant, balance, consistency) → high",
  );

  const onlyProcessing = computeHouseholdNutritionScore(
    facts({ averageAppleRating: 4, appleRatingSampleCount: 3 }),
  );
  assert(
    onlyProcessing.dimensionsCounted === 1 && onlyProcessing.confidence === "low",
    "a score resting on ONE dimension is explicitly low confidence",
    `${onlyProcessing.dimensionsCounted} dims, ${onlyProcessing.confidence}`,
  );
  assert(
    onlyProcessing.value !== null,
    "…but it is still a real score — a household that only scans products is still told something",
  );

  // =========================================================================
  section("§4  Bands, and the Apple Rating on THA's OWN 1–5 scale");
  // =========================================================================

  // The band ladder is walked with a SINGLE present dimension, so the score IS that
  // dimension's value and the threshold under test is the only thing being measured.
  // (A multi-dimension fixture would renormalise and silently test something else.)
  const bandAtRating = (rating: number) =>
    computeHouseholdNutritionScore(facts({ averageAppleRating: rating, appleRatingSampleCount: 4 }));

  assert(bandAtRating(5).value === 100 && bandAtRating(5).band === "thriving", "100 → thriving");
  assert(bandAtRating(4).value === 75 && bandAtRating(4).band === "strong", "75 → strong");
  assert(bandAtRating(3).value === 50 && bandAtRating(3).band === "developing", "50 → developing");
  assert(bandAtRating(2).value === 25 && bandAtRating(2).band === "building", "25 → building");
  assert(
    BAND_LABEL.thriving === "Thriving" && BAND_LABEL.building === "Building",
    "bands carry a human label, owned here and not written by the client",
  );

  // The 1–5 scale: a rating of 1 is the FLOOR of THA's scale, not a zero.
  const worstRating = computeHouseholdNutritionScore(
    facts({ averageAppleRating: 1, appleRatingSampleCount: 5 }),
  );
  const worstDim = worstRating.dimensions.find((d) => d.key === "processing-quality")!;
  assert(
    worstDim.value === 0,
    "an average Apple Rating of 1 maps to 0 — the bottom of THA's OWN scale, reached by evidence",
    `got ${worstDim.value}`,
  );
  assert(
    worstDim.value !== null,
    "…and it is a real 0, NOT a null — this household HAS evidence, and it is poor. The distinction is the platform's whole claim to honesty.",
  );

  const midRating = computeHouseholdNutritionScore(
    facts({ averageAppleRating: 3, appleRatingSampleCount: 5 }),
  );
  assert(
    midRating.dimensions.find((d) => d.key === "processing-quality")!.value === 50,
    "an average of 3 apples maps to 50 — (3-1)/(5-1), THA's scale kept intact, no new scale invented",
  );

  // =========================================================================
  section("§5  Rule E1 — no citation, no card");
  // =========================================================================

  assert(
    scored.dimensions.every((d) => d.evidence.length > 0),
    "EVERY dimension names the owner its numbers came from",
  );
  assert(
    scored.dimensions.every((d) => d.evidence.every((e) => e.source && e.detail)),
    "every citation carries both a source and a detail — never an empty gesture at provenance",
  );
  assert(
    scored.evidence.length > 0 &&
      !scored.evidence.some((e) => e.source === "user_health_trends"),
    "the score cites ONLY the owners that actually contributed — the absent one is not cited",
  );

  const opportunities = buildOpportunities(NO_PRODUCTS_SCANNED, scored);
  assert(
    opportunities.length > 0 && opportunities.every((o) => o.evidence.length > 0),
    "every opportunity cites evidence — one that cited nothing would never be emitted",
  );

  // =========================================================================
  section("§6  ATTN1 A2 — nothing here is ever critical");
  // =========================================================================

  let threw = false;
  try {
    for (const o of opportunities) assertCriticalAllowed(o.type, o.priority);
  } catch {
    threw = true;
  }
  assert(!threw, "every emitted opportunity passes the real assertCriticalAllowed");
  assert(
    opportunities.every((o) => o.priority !== "critical"),
    "a quiet week is not a harm signal — no nutrition opportunity is ever critical",
  );
  assert(
    opportunities.every((o) => o.owningDomain === "nutrition"),
    "every opportunity declares the nutrition domain as its owner",
  );

  // THA does not manufacture a problem in order to have something to say.
  const strongWeek = computeHouseholdNutritionScore(
    facts({
      weeklyPlantSlugs: Array.from({ length: 28 }, (_, i) => `p${i}`),
      weeklyVariety: variety({ fruits: 3, vegetables: 3, wholeGrains: 1, herbsSpices: 1, oliveOil: 1 }),
      mealsPlanned: 7,
      daysWithMeals: 7,
    }),
  );
  assert(
    buildOpportunities(
      facts({
        weeklyPlantSlugs: Array.from({ length: 28 }, (_, i) => `p${i}`),
        weeklyVariety: variety({ fruits: 3, vegetables: 3, wholeGrains: 1, herbsSpices: 1, oliveOil: 1 }),
        mealsPlanned: 7,
        daysWithMeals: 7,
      }),
      strongWeek,
    ).length === 0,
    "a strong week yields NO opportunities — THA does not invent a problem to fill a card",
  );

  assert(
    buildOpportunities(EMPTY_FACTS, empty).length === 0,
    "a household with no evidence yields NO opportunities — a null dimension produces nothing",
  );

  // =========================================================================
  section("§7  Ownership — one owner per fact");
  // =========================================================================

  const coreSrc = sourceOf("shared/nutrition/household-nutrition.ts");
  const asmSrc = sourceOf("server/lib/household-nutrition-assembler.ts");

  assert(
    !/\bfetch\(|\bdb\b|storage\.|await /.test(coreSrc.replace(/\/\*[\s\S]*?\*\//g, "")),
    "the pure core performs NO I/O — no db, no storage, no fetch, no await",
  );
  assert(
    !/Date\.now\(|Math\.random\(|new Date\(/.test(coreSrc),
    "the pure core has no clock and no randomness — it is deterministic by construction",
  );

  // The assembler must READ owners, never re-derive what they own.
  assert(
    asmSrc.includes("assembleNutritionCentre"),
    "the assembler READS the existing Nutrition Centre (WX8) for all-time diversity — it does not recount plants",
  );
  assert(
    asmSrc.includes("computeMealVariety") && asmSrc.includes("sumVarietyScores"),
    "variety comes from the canonical plant classifier's own functions and its own per-meal caps",
  );
  assert(
    !/averageThaRating\s*[*+/-]/.test(asmSrc.replace(/weighted \+= t\.averageThaRating \* n;/, "")),
    "the Apple Rating is read from user_health_trends and never recomputed",
  );

  // The exact-day-count fix: the platform counts days, it does not infer them from meals.
  assert(
    asmSrc.includes("week.dayIds.size") && !asmSrc.includes("week.mealIds.size"),
    "planning consistency counts DISTINCT PLANNER DAYS exactly — never a proxy inferred from distinct meals",
  );

  // WEEKLY_PLANT_TARGET must be declared exactly ONCE in the whole repository.
  const declarations = [
    "shared/nutrition/household-nutrition.ts",
    "client/src/components/PlantDiversityReport.tsx",
    "client/src/components/nutrition-variety-chips.tsx",
    "client/src/pages/home-experience-page.tsx",
  ].filter((f) => /const WEEKLY_PLANT_TARGET\s*=/.test(sourceOf(f)));

  assert(
    declarations.length === 1 && declarations[0] === "shared/nutrition/household-nutrition.ts",
    "WEEKLY_PLANT_TARGET is declared in EXACTLY ONE place — the consumers import it",
    `declared in: ${declarations.join(", ") || "nowhere"}`,
  );

  assert(
    coreSrc.includes("export const WEEKLY_PLANT_TARGET = 30"),
    "…and that one place is the shared nutrition core",
  );

  // No invented clinical target anywhere (Trust Rule 6). Scanned against CODE only —
  // the header legitimately discusses RDAs in order to disown them.
  const coreCode = coreSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert(
    !/\bRDA\b|reference intake|recommended daily/i.test(coreCode),
    "the core invents no RDA and no reference intake — THA stores none, and inventing one would fabricate certainty",
  );
  // Every bare number in the core is a NAMED denominator, and each name is one THA
  // already owned. A target can only hide in an anonymous literal, so there are none.
  const numericConsts = Array.from(coreCode.matchAll(/const (\w+)\s*=\s*\d+(?:\.\d+)?;/g)).map(
    (m) => m[1],
  );
  const EXPECTED_DENOMINATORS = [
    "WEEKLY_PLANT_TARGET", // 30 — the only target, and it predates HNP1 in four surfaces
    "PLANNER_WEEK_DAYS", // 7  — the days of a planner week
    "APPLE_RATING_MIN", // 1  — the floor of THA's own Apple Rating scale
    "APPLE_RATING_MAX", // 5  — the ceiling of the same scale
    "STRONG_ENOUGH", // 70 — the point past which THA stops manufacturing a problem
  ];
  assert(
    numericConsts.length === EXPECTED_DENOMINATORS.length &&
      numericConsts.every((n) => EXPECTED_DENOMINATORS.includes(n)),
    "every number in the core is a NAMED denominator THA already owned — no anonymous literal to hide an invented target in",
    `found: ${numericConsts.join(", ")}`,
  );

  // =========================================================================
  section("§8  Summary, insights and purity");
  // =========================================================================

  const weekly = buildWeeklySummary(NO_PRODUCTS_SCANNED);
  assert(
    weekly.plantCount === 15 && weekly.plantTarget === WEEKLY_PLANT_TARGET,
    "the weekly summary reports the week's plants against the one canonical target",
  );
  assert(
    weekly.componentsPresent === 3 && weekly.componentsTotal === VARIETY_COMPONENT_COUNT,
    "…and the balance spread across the classifier's own five components",
  );
  assert(
    weekly.daysWithMeals === 5 && PLANNER_WEEK_DAYS === 7,
    "…and the days planned out of a seven-day planner week",
  );
  assert(
    varietyComponentsPresent(variety({ fruits: 2, oliveOil: 1 })) === 2,
    "varietyComponentsPresent counts components with any presence, not their magnitude",
  );

  const insights = buildInsights(NO_PRODUCTS_SCANNED, scored);
  assert(insights.length > 0, "a known week produces insights");
  assert(
    insights.every((i) => i.evidence.length > 0 && i.text.trim().length > 0),
    "every insight is a finished, cited sentence — the client renders it verbatim and writes no prose of its own",
  );
  assert(
    buildInsights(EMPTY_FACTS, empty).length === 0,
    "nothing known about a week → NOTHING is said about it",
  );

  const insightText = insights.map((i) => i.text).join(" ");
  assert(
    !/\byou (just|have just) (reached|hit)\b/i.test(insightText),
    "no insight claims a milestone MOMENT — the platform cannot date one, and does not pretend to",
  );

  // -------------------------------------------------------------------------
  // GRAMMAR. This module is the only author of prose about a household's own
  // nutrition, and the client renders it verbatim — so the grammar is part of the
  // contract, not a cosmetic afterthought. A household reads the sentence, not the
  // number behind it, and "1 distinct plants" undermines every correct figure near it.
  // -------------------------------------------------------------------------

  // Three missing components: a real household case, and the one that exposes bad joins.
  const threeMissing = facts({
    weeklyPlantSlugs: ["a", "b", "c"],
    weeklyVariety: variety({ vegetables: 2, oliveOil: 1 }), // fruit, whole grains, herbs missing
    mealsPlanned: 4,
    daysWithMeals: 3,
  });
  const threeScore = computeHouseholdNutritionScore(threeMissing);
  const allProse = [
    ...buildInsights(threeMissing, threeScore).map((i) => i.text),
    ...buildOpportunities(threeMissing, threeScore).flatMap((o) => [o.explanation, o.suggestedAction]),
  ];

  assert(
    !allProse.some((t) => /\band\b.*\band\b/.test(t) && !/&/.test(t.replace(/herbs & spices/g, ""))),
    'a three-item list reads "a, b and c" — never "a and b and c"',
    allProse.find((t) => /\band\b.*\band\b/.test(t)),
  );
  assert(
    !allProse.some((t) => /\bor\b.*\bor\b/.test(t)),
    'a three-item suggestion reads "a, b or c" — never "a or b or c"',
    allProse.find((t) => /\bor\b.*\bor\b/.test(t)),
  );

  // Pluralisation, at the boundary that actually occurs in production.
  const onePlant = facts({ weeklyPlantSlugs: ["kale"], mealsPlanned: 1, daysWithMeals: 1 });
  const oneScore = computeHouseholdNutritionScore(onePlant);
  const oneProse = [
    ...buildInsights(onePlant, oneScore).map((i) => i.text),
    ...buildOpportunities(onePlant, oneScore).map((o) => o.explanation),
  ].join(" ");
  assert(
    !/\b1 (distinct |different )?plants\b/.test(oneProse),
    'a household with ONE plant is never told it has "1 plants"',
    oneProse,
  );
  assert(
    /\b1 (distinct|different) plant\b/.test(oneProse),
    "…it is told it has 1 plant, in correct English",
  );

  // Every sentence is a sentence. A leading numeral is permitted — "4 days have no meal
  // planned this week." is a deliberate stat-led opening, not a lower-cased fragment.
  assert(
    allProse.every((t) => /^[A-Z0-9]/.test(t)),
    "every generated sentence opens with a capital letter or a figure — never a bare lower-case fragment",
    allProse.find((t) => !/^[A-Z0-9]/.test(t)),
  );
  assert(
    allProse.every((t) => !/ {2}/.test(t) && !/\s+\./.test(t)),
    "no double spaces and no space before a full stop — the string concatenation is clean",
  );

  // Purity: same facts in, byte-identical report out.
  const a = JSON.stringify({
    score: computeHouseholdNutritionScore(NO_PRODUCTS_SCANNED),
    weekly: buildWeeklySummary(NO_PRODUCTS_SCANNED),
    insights: buildInsights(NO_PRODUCTS_SCANNED, scored),
    opportunities: buildOpportunities(NO_PRODUCTS_SCANNED, scored),
  });
  const b = JSON.stringify({
    score: computeHouseholdNutritionScore(NO_PRODUCTS_SCANNED),
    weekly: buildWeeklySummary(NO_PRODUCTS_SCANNED),
    insights: buildInsights(NO_PRODUCTS_SCANNED, scored),
    opportunities: buildOpportunities(NO_PRODUCTS_SCANNED, scored),
  });
  assert(a === b, "the core is pure — the same facts always yield a byte-identical report");

  // Opportunity ids are stable across runs (the delivery framework dedupes on them).
  const ids1 = buildOpportunities(NO_PRODUCTS_SCANNED, scored).map((o) => o.id);
  const ids2 = buildOpportunities(NO_PRODUCTS_SCANNED, scored).map((o) => o.id);
  assert(
    ids1.join("|") === ids2.join("|") && new Set(ids1).size === ids1.length,
    "opportunity ids are stable and unique — the delivery framework dedupes and mutes on them",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`HNP1 Household Nutrition Platform: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
