/**
 * PLAN2 — Intelligent Planner Evolution.
 *
 * PLAN1 taught the Planner to EXPLAIN itself. PLAN2 teaches it to CHOOSE by the
 * same facts, which is a far more dangerous thing to get wrong: a bad reason is a
 * bad sentence, but a bad weight is a bad dinner. Five claims, each asserted:
 *
 *   1. NO SILENT BEHAVIOUR CHANGE. `scoreMeal` with no intelligence context is
 *      byte-identical to its pre-PLAN2 self. Every existing call site, and the
 *      golden scoring regressions, are therefore untouched by construction.
 *
 *   2. AN HONEST GAP IS NOT A ZERO. A dimension whose owner could not be read
 *      leaves the DENOMINATOR — it does not score badly. An unreadable pantry must
 *      never become the Planner ruling, on no evidence, that a meal uses nothing
 *      the household owns. This is the claim that keeps Principle 6 true when
 *      knowledge starts moving money.
 *
 *   3. LEARNING RE-WEIGHTS, NEVER EXCLUDES (NK2 Rule P1). A confirmed negative
 *      lowers a score; it can never remove a meal, and it is never spoken back at
 *      the household.
 *
 *   4. OPPORTUNITY-AWARE, NOT OPPORTUNITY-AUTHORING. The Planner advances only the
 *      opportunity types it can honestly discriminate on, cites the producer's own
 *      words, and invents nothing for the types it cannot act on.
 *
 *   5. ONE OWNER OF THE SCORE. The breakdown explains the score it accompanies —
 *      the pre-PLAN2 out-of-band household bonus is gone.
 *
 * Runs entirely without a database: every derivation under test is pure, and the
 * DB-backed reads are gated behind a userId this test never supplies.
 *
 * Run with: npm run test:plan2-planner-evolution
 */
import type { UserPreferences } from "../../shared/schema.js";
import {
  scoreMeal,
  scoreIntelligence,
  INTELLIGENCE_WEIGHTS,
  INTELLIGENCE_SHARE,
  SCORE_WEIGHTS,
  type ScoredCandidate,
  type MealIntelligenceSignals,
} from "../lib/meal-scoring-service.js";
import { generateMealExplanation } from "../lib/explainability-service.js";
import {
  opportunitiesAdvancedBy,
  matchLearnedPreference,
  toPlannerOpportunitySignal,
  PLANNER_ACTIONABLE_OPPORTUNITY_TYPES,
  PLANNER_OPPORTUNITY_PRODUCERS,
  EMPTY_PLANNER_EXPLANATION_CONTEXT,
  EMPTY_PLANNER_WEEK_STATE,
  type PlannerExplanationContext,
  type PlannerOpportunitySignal,
  type LearnedPreference,
} from "../lib/planner-explanation-context.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

const near = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) < eps;

/** Every intelligence dimension inapplicable — the state of a household THA knows nothing about. */
const NO_SIGNALS: MealIntelligenceSignals = {
  householdFitScore: null,
  newPlantGroups: null,
  pantryCoverage: null,
  seasonalCoverage: null,
  learnedDirection: null,
  learnedConfidence: null,
  learningAware: false,
  opportunitiesAdvanced: 0,
  opportunitiesOpen: 0,
  opportunityAware: false,
};

function signals(over: Partial<MealIntelligenceSignals> = {}): MealIntelligenceSignals {
  return { ...NO_SIGNALS, ...over };
}

function candidate(over: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    id: 1, name: "Test Meal", image: null, ingredients: [], instructions: [],
    source: "test", sourceUrl: null, category: null, cuisine: null,
    primaryProtein: null, dietTypes: [], estimatedCost: null, estimatedUPFScore: null,
    score: 50, isExternal: false,
    scoreBreakdown: {
      dietMatch: 0, goalAlignment: 0, budgetAlignment: 0, upfScore: 0,
      varietyScore: 0, overlapScore: 0, cuisineBonus: 0, simplicityBonus: 0,
    },
    ...over,
  };
}

function ctx(over: Partial<PlannerExplanationContext> = {}): PlannerExplanationContext {
  return { ...EMPTY_PLANNER_EXPLANATION_CONTEXT, ...over };
}

const MEAL = {
  name: "Tomato and Lentil Stew",
  ingredients: ["tomatoes", "lentils", "onion", "garlic"],
  dietTypes: ["vegetarian"],
  estimatedCost: 3.4,
  estimatedUPFScore: 10,
  cuisine: "italian",
  primaryProtein: "vegetarian" as string | null,
};

const PREFS = null as UserPreferences | null;

// ── 1. No silent behaviour change ────────────────────────────────────────────

function verifyBackwardCompatibility(): void {
  console.log("\n1. NO SILENT BEHAVIOUR CHANGE\n");

  const withoutContext = scoreMeal(MEAL, PREFS);
  const withEmptyContext = scoreMeal(MEAL, PREFS, {});
  check("scoreMeal with no context still scores (pre-PLAN2 call site valid)",
    withoutContext.score > 0);
  check("scoreMeal with no intelligence is identical to the empty-context call",
    withoutContext.score === withEmptyContext.score);
  check("no intelligence ⇒ NO intelligence block in the breakdown",
    withoutContext.breakdown.intelligence === undefined);

  // The load-bearing one: a context whose every dimension is inapplicable must not
  // move the score by even a fraction. If this drifts, every pre-PLAN2 expectation
  // in the golden suite silently becomes wrong.
  const allInapplicable = scoreMeal(MEAL, PREFS, { intelligence: NO_SIGNALS });
  check("an all-inapplicable intelligence context does not move the score at all",
    allInapplicable.score === withoutContext.score,
    `${allInapplicable.score} vs ${withoutContext.score}`);
  check("an all-inapplicable context reports achieved = null (nothing applied)",
    allInapplicable.breakdown.intelligence?.achieved === null);
  check("an all-inapplicable context has an empty denominator",
    allInapplicable.breakdown.intelligence?.applicableMax === 0);

  check("the base weights still sum to 100",
    Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0) === 100);
  check("the intelligence weights sum to 30 (the declared share of the envelope)",
    Object.values(INTELLIGENCE_WEIGHTS).reduce((a, b) => a + b, 0) === 30);
  check("INTELLIGENCE_SHARE is 0.30 — base keeps 70 of the 100-point envelope",
    INTELLIGENCE_SHARE === 0.3);
}

// ── 2. An honest gap is not a zero ───────────────────────────────────────────

function verifyHonestGapsAreNotZeros(): void {
  console.log("\n2. AN HONEST GAP IS NOT A ZERO (the denominator rule)\n");

  // A meal that is perfect on everything THA could read. The pantry is unreadable.
  const pantryUnreadable = scoreIntelligence(signals({
    householdFitScore: 100,
    newPlantGroups: 3,
    pantryCoverage: null,     // ← owner could not be read
    seasonalCoverage: 1,
  }));

  check("an unreadable pantry is null, not 0",
    pantryUnreadable.pantryUse === null);
  check("an unreadable pantry LEAVES THE DENOMINATOR",
    pantryUnreadable.applicableMax ===
      INTELLIGENCE_WEIGHTS.householdFit + INTELLIGENCE_WEIGHTS.plantDiversity + INTELLIGENCE_WEIGHTS.seasonality);
  check("a meal perfect on every READABLE dimension still achieves 100% of them",
    pantryUnreadable.achieved !== null && near(pantryUnreadable.achieved, 1));

  // The counterfactual that proves the rule is doing work: had the gap been scored
  // as a zero, this meal would have been demoted for a fact nobody could read.
  const pantryKnownEmpty = scoreIntelligence(signals({
    householdFitScore: 100,
    newPlantGroups: 3,
    pantryCoverage: 0,        // ← owner WAS read: the household genuinely holds none of it
    seasonalCoverage: 1,
  }));
  check("a pantry that was READ and holds nothing DOES score zero for that dimension",
    pantryKnownEmpty.pantryUse === 0);
  check("...and it is counted in the denominator, so the meal is genuinely demoted",
    pantryKnownEmpty.achieved !== null && pantryKnownEmpty.achieved < 1);
  check("'could not read the pantry' and 'the pantry is empty' produce DIFFERENT scores",
    pantryUnreadable.achieved !== pantryKnownEmpty.achieved);

  // An external candidate with no household fit measured must not be punished for it.
  const noHouseholdFit = scoreIntelligence(signals({
    householdFitScore: null,
    newPlantGroups: 3,
    pantryCoverage: 1,
    seasonalCoverage: 1,
  }));
  check("an unmeasured household fit leaves the denominator (no phantom penalty)",
    noHouseholdFit.householdFit === null &&
    noHouseholdFit.applicableMax ===
      INTELLIGENCE_WEIGHTS.plantDiversity + INTELLIGENCE_WEIGHTS.pantryUse + INTELLIGENCE_WEIGHTS.seasonality);
  check("...and it can still achieve a perfect intelligence share",
    noHouseholdFit.achieved !== null && near(noHouseholdFit.achieved, 1));

  const unresolvable = scoreIntelligence(signals({ newPlantGroups: null, pantryCoverage: null }));
  check("a meal whose ingredients do not resolve scores NO food dimension at all",
    unresolvable.plantDiversity === null && unresolvable.pantryUse === null);
}

// ── 3. Learning re-weights, never excludes ───────────────────────────────────

function verifyLearningReweightsOnly(): void {
  console.log("\n3. LEARNING RE-WEIGHTS, NEVER EXCLUDES (NK2 Rule P1)\n");

  const neutral = scoreIntelligence(signals({ learningAware: true }));
  check("a household that has confirmed NOTHING sits at the neutral midpoint",
    neutral.learnedPreference !== null &&
    near(neutral.learnedPreference, INTELLIGENCE_WEIGHTS.learnedPreference * 0.5));
  check("...and the dimension still APPLIES (an unknown is a neutral, not a gap)",
    neutral.applicableMax === INTELLIGENCE_WEIGHTS.learnedPreference);

  const unreachable = scoreIntelligence(signals({ learningAware: false }));
  check("an UNREACHABLE learning owner is a gap, and leaves the denominator",
    unreachable.learnedPreference === null && unreachable.applicableMax === 0);

  const lovedHigh = scoreIntelligence(signals({
    learningAware: true, learnedDirection: "positive", learnedConfidence: "high",
  }));
  const dislikedHigh = scoreIntelligence(signals({
    learningAware: true, learnedDirection: "negative", learnedConfidence: "high",
  }));
  check("a high-confidence positive reaches the FULL learning weight",
    lovedHigh.learnedPreference === INTELLIGENCE_WEIGHTS.learnedPreference);
  check("a high-confidence negative reaches ZERO of it",
    dislikedHigh.learnedPreference === 0);
  check("a positive outranks a neutral, which outranks a negative",
    (lovedHigh.learnedPreference ?? 0) > (neutral.learnedPreference ?? 0) &&
    (neutral.learnedPreference ?? 0) > (dislikedHigh.learnedPreference ?? 0));

  const lovedLow = scoreIntelligence(signals({
    learningAware: true, learnedDirection: "positive", learnedConfidence: "low",
  }));
  check("a LOW-confidence positive moves the score less than a HIGH-confidence one",
    (lovedLow.learnedPreference ?? 0) < (lovedHigh.learnedPreference ?? 0) &&
    (lovedLow.learnedPreference ?? 0) > (neutral.learnedPreference ?? 0));

  // The rule that matters: a confirmed dislike LOWERS a meal. It never removes one.
  // Exclusion belongs to the compliance gates alone.
  const disliked = scoreMeal(MEAL, PREFS, {
    intelligence: signals({ learningAware: true, learnedDirection: "negative", learnedConfidence: "high" }),
  });
  const loved = scoreMeal(MEAL, PREFS, {
    intelligence: signals({ learningAware: true, learnedDirection: "positive", learnedConfidence: "high" }),
  });
  check("a confirmed dislike DEMOTES the meal",
    disliked.score < loved.score);
  check("a confirmed dislike NEVER excludes it — it remains a scoreable candidate",
    disliked.score > 0);

  // Matching is on the two dimensions the Planner already had. It invents no taxonomy.
  const learned: LearnedPreference[] = [{
    domain: "planner", subjectType: "cuisine", subjectKey: "italian",
    direction: "positive", confidence: "high", rationale: "You have chosen Italian meals consistently.",
  }];
  check("a learned CUISINE preference matches a candidate of that cuisine",
    matchLearnedPreference({ cuisine: "Italian", primaryProtein: null }, learned)?.direction === "positive");
  check("it does NOT match a different cuisine",
    matchLearnedPreference({ cuisine: "thai", primaryProtein: null }, learned) === undefined);
  check("a signal from another DOMAIN is never applied to the planner",
    matchLearnedPreference({ cuisine: "italian", primaryProtein: null },
      [{ ...learned[0], domain: "pantry" }]) === undefined);

  // A negative understanding re-weights silently. Announcing it would be a judgement
  // about the household, not a fact about the food.
  const explained = generateMealExplanation(
    candidate({ ingredients: MEAL.ingredients, cuisine: "italian" }),
    PREFS,
    {
      context: ctx({
        learningAware: true,
        learnedPreferences: [{ ...learned[0], direction: "negative", rationale: "You keep rejecting Italian meals." }],
      }),
      week: EMPTY_PLANNER_WEEK_STATE,
    },
  );
  check("a NEGATIVE learned preference is never spoken back at the household",
    !explained.evidence.some((e) => e.dimension === "learned-preference"));

  const explainedPositive = generateMealExplanation(
    candidate({ ingredients: MEAL.ingredients, cuisine: "italian" }),
    PREFS,
    { context: ctx({ learningAware: true, learnedPreferences: learned }), week: EMPTY_PLANNER_WEEK_STATE },
  );
  const learnedEvidence = explainedPositive.evidence.find((e) => e.dimension === "learned-preference");
  check("a POSITIVE learned preference IS cited",
    learnedEvidence !== undefined);
  check("...using LEARN1's own rationale, verbatim (ET6 — no paraphrase)",
    learnedEvidence?.detail === "You have chosen Italian meals consistently.");
}

// ── 4. Opportunity-aware, not opportunity-authoring ──────────────────────────

const PLANT_GAP: PlannerOpportunitySignal = {
  id: "nutrition-plant-diversity-gap:1",
  type: "nutrition-plant-diversity-gap",
  domain: "nutrition",
  explanation: "Your household has 8 distinct plants planned this week, 22 short of a diverse 30.",
  subjectFoodSlug: null,
  subjectLabel: null,
};

const PANTRY_UNUSED: PlannerOpportunitySignal = {
  id: "pantry-item-unused-in-plan:9",
  type: "pantry-item-unused-in-plan",
  domain: "pantry",
  explanation: "Lentils have been in your pantry for a while and are not in this week's plan.",
  subjectFoodSlug: "lentils",
  subjectLabel: "Lentils",
};

function verifyOpportunityAwareness(): void {
  console.log("\n4. OPPORTUNITY-AWARE, NOT OPPORTUNITY-AUTHORING\n");

  const foods = new Map([["tomato", "Tomato"], ["lentils", "Lentils"]]);
  const plants = new Map([["tomato", "Tomato"], ["lentils", "Lentils"]]);

  const advancesPlantGap = opportunitiesAdvancedBy([PLANT_GAP], foods, plants, new Set());
  check("a meal bringing plants the week lacks ADVANCES the plant-diversity gap",
    advancesPlantGap.length === 1);

  const weekAlreadyHasThem = opportunitiesAdvancedBy(
    [PLANT_GAP], foods, plants, new Set(["tomato", "lentils"]),
  );
  check("a meal whose plants are ALREADY on the week advances nothing",
    weekAlreadyHasThem.length === 0,
    "credit must be for what the meal ADDS, not what it contains");

  const advancesPantry = opportunitiesAdvancedBy([PANTRY_UNUSED], foods, plants, new Set());
  check("a meal containing the unused pantry item advances the pantry opportunity",
    advancesPantry.length === 1);

  const otherFoods = new Map([["chicken", "Chicken"]]);
  check("a meal WITHOUT the named pantry item does not advance it",
    opportunitiesAdvancedBy([PANTRY_UNUSED], otherFoods, new Map(), new Set()).length === 0);

  // The types the Planner cannot honestly discriminate on are left strictly alone.
  const notActionable: PlannerOpportunitySignal = {
    id: "x", type: "nutrition-balance-gap", domain: "nutrition",
    explanation: "This week's plan covers 3 of 5 food components.",
    subjectFoodSlug: null, subjectLabel: null,
  };
  check("an opportunity the Planner cannot discriminate on is NEVER advanced",
    opportunitiesAdvancedBy([notActionable], foods, plants, new Set()).length === 0);
  check("...and it is not even admitted as a planner-actionable signal",
    toPlannerOpportunitySignal({
      id: "x", type: "nutrition-balance-gap", owningDomain: "nutrition",
      explanation: "…", suggestedAction: "…",
    }) === null);
  check("the actionable set is exactly the two types with a real predicate",
    PLANNER_ACTIONABLE_OPPORTUNITY_TYPES.size === 2 &&
    PLANNER_ACTIONABLE_OPPORTUNITY_TYPES.has("nutrition-plant-diversity-gap") &&
    PLANNER_ACTIONABLE_OPPORTUNITY_TYPES.has("pantry-item-unused-in-plan"));

  // THE COMPLIANCE INVARIANT. Reading `opportunity-delivery` would call insertDelivered
  // and mark opportunities as SEEN by a household that never saw them. The Planner
  // reads producers, and this asserts it can never quietly start doing otherwise.
  check("the Planner reads PRODUCERS, never the Decision Engine's delivery door",
    !PLANNER_OPPORTUNITY_PRODUCERS.includes("opportunity-delivery"),
    "reading `opportunity-delivery:report` would consume the household's unseen notices");
  check("the producers it reads are exactly the two registered, read-only ones",
    PLANNER_OPPORTUNITY_PRODUCERS.length === 2 &&
    PLANNER_OPPORTUNITY_PRODUCERS.includes("household-health") &&
    PLANNER_OPPORTUNITY_PRODUCERS.includes("food-intelligence"));

  const malformed = toPlannerOpportunitySignal({ id: "x", type: "pantry-item-unused-in-plan" });
  check("a malformed producer opportunity is SKIPPED, never coerced", malformed === null);

  // Scoring: applies only when the household actually has an opportunity open.
  const noneOpen = scoreIntelligence(signals({ opportunityAware: true, opportunitiesOpen: 0 }));
  check("with NO opportunities open, the dimension does not apply (it would only dilute)",
    noneOpen.opportunityFit === null);

  const advanced = scoreIntelligence(signals({
    opportunityAware: true, opportunitiesOpen: 2, opportunitiesAdvanced: 2,
  }));
  const ignored = scoreIntelligence(signals({
    opportunityAware: true, opportunitiesOpen: 2, opportunitiesAdvanced: 0,
  }));
  check("a meal advancing every open opportunity earns the full weight",
    advanced.opportunityFit === INTELLIGENCE_WEIGHTS.opportunityFit);
  check("a meal advancing none earns zero of it",
    ignored.opportunityFit === 0);

  // The producer's own words reach the household — the Planner does not re-author them.
  const explained = generateMealExplanation(
    candidate({ ingredients: ["lentils", "tomatoes"] }),
    PREFS,
    {
      context: ctx({ opportunityAware: true, openOpportunities: [PANTRY_UNUSED] }),
      week: EMPTY_PLANNER_WEEK_STATE,
    },
  );
  const oppEvidence = explained.evidence.find((e) => e.dimension === "open-opportunity");
  check("an advanced opportunity is cited in the explanation",
    oppEvidence !== undefined);
  check("...carrying the PRODUCER's own explanation, not a Planner rewrite",
    oppEvidence?.detail.includes("in your pantry for a while") === true);
  check("...and naming the producing domain as its source",
    oppEvidence?.source.includes("pantry") === true);
}

// ── 5. One owner of the score ────────────────────────────────────────────────

function verifySingleScoreOwner(): void {
  console.log("\n5. ONE OWNER OF THE SCORE\n");

  const fitted = scoreMeal(MEAL, PREFS, { intelligence: signals({ householdFitScore: 100 }) });
  const unfitted = scoreMeal(MEAL, PREFS, { intelligence: signals({ householdFitScore: 0 }) });

  check("household fit is now scored INSIDE scoreMeal",
    fitted.breakdown.intelligence?.householdFit === INTELLIGENCE_WEIGHTS.householdFit);
  check("a household that the meal suits scores higher than one it does not",
    fitted.score > unfitted.score);
  check("the breakdown EXPLAINS the score it accompanies (no out-of-band bonus)",
    fitted.breakdown.intelligence !== undefined &&
    fitted.breakdown.intelligence.achieved !== null);

  // The envelope holds: intelligence can never push a score past 100, nor below 0.
  const best = scoreMeal(MEAL, PREFS, {
    intelligence: signals({
      householdFitScore: 100, newPlantGroups: 9, pantryCoverage: 1, seasonalCoverage: 1,
      learningAware: true, learnedDirection: "positive", learnedConfidence: "high",
      opportunityAware: true, opportunitiesOpen: 1, opportunitiesAdvanced: 1,
    }),
  });
  const worst = scoreMeal(MEAL, PREFS, {
    intelligence: signals({
      householdFitScore: 0, newPlantGroups: 0, pantryCoverage: 0, seasonalCoverage: 0,
      learningAware: true, learnedDirection: "negative", learnedConfidence: "high",
      opportunityAware: true, opportunitiesOpen: 1, opportunitiesAdvanced: 0,
    }),
  });
  check("a fully-intelligent best case stays within the 100-point envelope",
    best.score <= 100 && best.score > 0);
  check("a fully-intelligent worst case stays at or above 0",
    worst.score >= 0);
  check("intelligence genuinely separates the best candidate from the worst",
    best.score > worst.score,
    `${best.score} vs ${worst.score}`);

  // The whole point of PLAN2, stated as an assertion: the Planner now PREFERS the
  // meal that uses what you have, in the season you are in, with the plants your
  // week lacks — over an identical meal that does none of those things.
  const contextual = scoreMeal(MEAL, PREFS, {
    intelligence: signals({ pantryCoverage: 1, seasonalCoverage: 1, newPlantGroups: 3 }),
  });
  const contextless = scoreMeal(MEAL, PREFS, {
    intelligence: signals({ pantryCoverage: 0, seasonalCoverage: 0, newPlantGroups: 0 }),
  });
  check("PLAN1's gap is CLOSED: the Planner no longer merely explains context — it chooses by it",
    contextual.score > contextless.score,
    `contextual ${contextual.score} vs contextless ${contextless.score}`);
}

// ── The Planner still makes no health claim ──────────────────────────────────

const CLAIM_WORDS = [
  "reduces", "prevents", "protects against", "anti-inflammatory", "cures",
  "lowers your risk", "boosts immunity", "detox",
];

function verifyNoHealthClaims(): void {
  console.log("\n6. THE PLANNER STILL SPEAKS NO HEALTH CLAIM\n");

  const explained = generateMealExplanation(
    candidate({ ingredients: ["lentils", "tomatoes", "spinach"], cuisine: "italian" }),
    PREFS,
    {
      context: ctx({
        learningAware: true,
        learnedPreferences: [{
          domain: "planner", subjectType: "cuisine", subjectKey: "italian",
          direction: "positive", confidence: "high",
          rationale: "You have chosen Italian meals consistently.",
        }],
        opportunityAware: true,
        openOpportunities: [PLANT_GAP],
      }),
      week: EMPTY_PLANNER_WEEK_STATE,
    },
  );

  const spoken = [...explained.reasons, ...explained.evidence.map((e) => e.detail)]
    .join(" ").toLowerCase();
  for (const word of CLAIM_WORDS) {
    check(`the new PLAN2 dimensions speak no health claim ("${word}")`, !spoken.includes(word));
  }

  check("every reason is still DERIVED from an evidence entry (PLAN1's invariant holds)",
    explained.reasons.every((r) => explained.evidence.some((e) => e.detail === r)));
  check("every evidence entry still names the owner it was read from",
    explained.evidence.every((e) => e.source.length > 0));
}

// ─────────────────────────────────────────────────────────────────────────────
try {
  verifyBackwardCompatibility();
  verifyHonestGapsAreNotZeros();
  verifyLearningReweightsOnly();
  verifyOpportunityAwareness();
  verifySingleScoreOwner();
  verifyNoHealthClaims();
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
} catch (err) {
  console.error("Test harness failed:", err);
  process.exit(1);
}
