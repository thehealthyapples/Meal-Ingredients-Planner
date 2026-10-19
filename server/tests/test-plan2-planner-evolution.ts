/**
 * PLAN2 — Planner scoring guardrails.
 *
 * This suite protects the implemented scoring path and public explanation contract.
 * Proposed intelligence-weighted scoring, denominator handling, learned reweighting,
 * and opportunity-driven scoring remain deferred design requirements until their
 * production APIs exist. See docs/implementation/intelligence/AFI3_5_AMBIENT_FOOD_INTELLIGENCE_COMPLETION.md.
 *
 * Run with: npm run test:plan2-planner-intelligence-activation
 */
import type { UserPreferences } from "../../shared/schema.js";
import { scoreMeal, type ScoredCandidate } from "../lib/meal-scoring-service.js";
import { generateMealExplanation } from "../lib/explainability-service.js";

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail = ""): void {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
}

const meal = {
  name: "Tomato and Lentil Stew",
  ingredients: ["tomatoes", "lentils", "onion", "garlic"],
  dietTypes: ["vegetarian"],
  estimatedCost: 3.4,
  estimatedUPFScore: 10,
  cuisine: "italian",
  primaryProtein: "vegetarian" as string | null,
};
const prefs = null as UserPreferences | null;

function candidate(overrides: Partial<ScoredCandidate> = {}): ScoredCandidate {
  return {
    id: 1, name: meal.name, image: null, ingredients: meal.ingredients,
    instructions: ["Cook until tender."], source: "test", sourceUrl: null,
    category: null, cuisine: "italian", primaryProtein: "vegetarian",
    dietTypes: ["vegetarian"], estimatedCost: 3.4, estimatedUPFScore: 10,
    score: 0, isExternal: false,
    scoreBreakdown: { dietMatch: 0, goalAlignment: 0, budgetAlignment: 0,
      upfScore: 0, varietyScore: 0, overlapScore: 0, cuisineBonus: 0,
      simplicityBonus: 0 },
    ...overrides,
  };
}

async function main(): Promise<void> {
  console.log("\nPLAN2 implemented scoring and explanation safeguards\n");
  const legacy = scoreMeal(meal, prefs);
  const emptyContext = scoreMeal(meal, prefs, {});
  check("scoreMeal remains callable without context", Number.isFinite(legacy.score));
  check("empty context preserves the no-context score", legacy.score === emptyContext.score);
  check("score remains within the public 0–100 range", legacy.score >= 0 && legacy.score <= 100);
  const breakdownTotal = Object.values(legacy.breakdown).reduce((sum, value) => sum + value, 0);
  check("public breakdown is the single source of the returned score",
    legacy.score === Math.max(0, Math.min(100, Math.round(breakdownTotal))),
    `${legacy.score} vs ${breakdownTotal}`);
  check("breakdown exposes only implemented scoring dimensions",
    Object.keys(legacy.breakdown).sort().join(",") ===
      ["budgetAlignment", "cuisineBonus", "dietMatch", "goalAlignment", "overlapScore", "simplicityBonus", "upfScore", "varietyScore"].sort().join(","));

  const explanation = generateMealExplanation(candidate({ score: legacy.score, scoreBreakdown: legacy.breakdown }), prefs);
  check("explanation is generated from the current scored candidate", Boolean(explanation));
  const text = JSON.stringify(explanation).toLowerCase();
  check("explanation makes no medical or guaranteed outcome claim",
    !/cure|treats? (?:diabetes|disease)|guaranteed weight loss/.test(text));
  console.log(`\nPLAN2 scoring safeguards: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((error) => { console.error(error); process.exit(1); });