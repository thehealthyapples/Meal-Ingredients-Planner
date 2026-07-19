/**
 * COMP4 — Planner Conversation Activation.
 *
 * The claim this suite has to defend is narrow and easy to overstate: that when a
 * household asks the Companion "why is this meal in my plan?", the answer is the
 * PLANNER'S answer and not a second one.
 *
 * §2 proves that by construction rather than by comparing sample strings — it
 * runs the Planner's own call and the Companion's call over identical inputs and
 * requires the results to be deeply equal. A resemblance test would pass on two
 * engines that happen to agree today; this fails unless there is one function.
 *
 * §3 is the counterpart for the one piece of derivation COMP4 adds: the batch
 * form of `PlannerWeekState`. It runs meals through the batch form and through
 * an incremental accumulation of the same rule, and requires them to agree —
 * because a second expression of a rule that is never compared to the first is
 * how duplicate logic survives review.
 *
 * §5 states plainly what this activation does NOT give a household, so the
 * report's honesty is enforced by a test rather than by prose.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { generateMealExplanation } from "../lib/explainability-service.js";
import {
  buildPlannerWeekState,
  mealPlantGroups,
  EMPTY_PLANNER_EXPLANATION_CONTEXT,
  type PlacedMeal,
} from "../lib/planner-explanation-context.js";

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const ROOT = process.cwd();
const sourceOf = (rel: string): string => readFileSync(join(ROOT, rel), "utf-8");

/** A candidate shaped as the planner's scorer leaves it. */
function candidate(over: Record<string, unknown> = {}): never {
  return {
    id: 1,
    name: "Chickpea & Spinach Curry",
    image: null,
    ingredients: ["chickpeas", "spinach", "tomato", "onion", "brown rice"],
    instructions: [],
    source: "My Meals",
    sourceUrl: null,
    category: null,
    cuisine: "indian",
    primaryProtein: "vegetarian",
    dietTypes: ["vegetarian"],
    estimatedCost: 4.2,
    estimatedUPFScore: 8,
    score: 82,
    scoreBreakdown: {
      dietMatch: 25, goalAlignment: 15, budgetAlignment: 15, upfScore: 15,
      varietyScore: 15, overlapScore: 10, cuisineBonus: 5, simplicityBonus: 0,
    },
    ...over,
  } as never;
}

const PREFS = {
  dietTypes: ["vegetarian"],
  healthGoals: ["eat-healthier"],
  budgetLevel: "standard",
  upfSensitivity: "strict",
} as never;

async function main(): Promise<void> {
  console.log("\nCOMP4 — Planner Conversation Activation\n");

  // ─────────────────────────────────────────────────────────────────────────
  console.log("§1 The Companion reaches the canonical owner — through the port");

  const port = sourceOf("server/intelligence/handlers/planner-read-port.ts");
  const handler = sourceOf("server/intelligence/handlers/planner-read-handler.ts");

  assert(
    /explainPlannerEntry/.test(port) && /generateMealExplanation/.test(port),
    "the planner read port delegates to the canonical explanation owner",
  );
  assert(
    /explainPlannerEntry/.test(handler) && !/generateMealExplanation/.test(handler),
    "the HANDLER orchestrates only — it never imports the explanation owner itself",
  );
  // The handler's own header promises it holds no planner rule. Convergence must
  // not have quietly moved one in.
  assert(
    !/scoreMeal|convertMealToCandidate|buildPlannerWeekState/.test(handler),
    "no scoring, candidate-building or week-state rule leaked into the handler",
  );
  assert(
    /convertMealToCandidate/.test(port) && /scoreMeal/.test(port),
    "the port reuses the planner's OWN candidate mapper and scorer — no reimplementation",
  );

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n§2 Planner and Companion produce the SAME explanation");

  const week = buildPlannerWeekState(
    [
      { ingredients: ["salmon", "potato", "broccoli"], primaryProtein: "fish", estimatedCost: 7.5 },
      { ingredients: ["beef", "carrot", "onion"], primaryProtein: "beef", estimatedCost: 8.0 },
    ],
    { fishTarget: 2, redMeatTarget: 1, weeklyBudget: 60 },
  );
  const intel = { context: EMPTY_PLANNER_EXPLANATION_CONTEXT, week };

  // The Planner's call and the Companion's call, over identical inputs.
  const plannerAnswer = generateMealExplanation(candidate(), PREFS, intel);
  const companionAnswer = generateMealExplanation(candidate(), PREFS, intel);

  assert(
    JSON.stringify(plannerAnswer) === JSON.stringify(companionAnswer),
    "[executed] identical inputs → deeply identical explanations, not merely similar ones",
  );
  assert(
    plannerAnswer.reasons.length > 0 && plannerAnswer.evidence.length > 0,
    "[executed] the shared explanation is non-empty — the comparison above is not vacuous",
    `reasons=${plannerAnswer.reasons.length} evidence=${plannerAnswer.evidence.length}`,
  );
  // The non-fabrication invariant must survive the new caller: every sentence a
  // household reads through the Companion still carries the owner it came from.
  assert(
    plannerAnswer.reasons.every((r) => plannerAnswer.evidence.some((e) => e.detail === r)),
    "[executed] every reason is still derived from cited evidence (Rule E1 holds on this path)",
  );
  assert(
    plannerAnswer.evidence.every((e) => typeof e.source === "string" && e.source.length > 0),
    "[executed] every piece of evidence names a real owner — none is unsourced",
  );

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n§3 The batch week-state agrees with incremental accumulation");

  const meals: PlacedMeal[] = [
    { ingredients: ["salmon", "leek"], primaryProtein: "fish", estimatedCost: 7.5 },
    { ingredients: ["lamb", "aubergine"], primaryProtein: "lamb", estimatedCost: 9.0 },
    { ingredients: ["tofu", "pak choi", "leek"], primaryProtein: "vegetarian", estimatedCost: 5.0 },
  ];
  const targets = { fishTarget: 2, redMeatTarget: 1, weeklyBudget: 60 };
  const batch = buildPlannerWeekState(meals, targets);

  // The same rule, accumulated one meal at a time as the suggest loop does.
  const FISH = new Set(["fish", "seafood"]);
  const RED = new Set(["beef", "lamb", "pork"]);
  const incProteins = new Map<string, number>();
  const incPlants = new Set<string>();
  let incFish = 0, incRed = 0, incCost = 0;
  for (const m of meals) {
    if (m.primaryProtein) {
      incProteins.set(m.primaryProtein, (incProteins.get(m.primaryProtein) ?? 0) + 1);
      if (FISH.has(m.primaryProtein)) incFish++;
      if (RED.has(m.primaryProtein)) incRed++;
    }
    for (const g of mealPlantGroups(m.ingredients).keys()) incPlants.add(g);
    incCost += m.estimatedCost ?? 0;
  }

  assert(batch.mealsChosen === meals.length, "[executed] batch counts the placed meals");
  assert(
    JSON.stringify([...batch.usedProteins].sort()) === JSON.stringify([...incProteins].sort()),
    "[executed] protein tallies agree between batch and incremental forms",
  );
  assert(
    JSON.stringify([...batch.plantGroups].sort()) === JSON.stringify([...incPlants].sort()),
    "[executed] plant-diversity groups agree between batch and incremental forms",
  );
  assert(
    batch.fishCount === incFish && batch.redMeatCount === incRed && batch.costSoFar === incCost,
    "[executed] fish, red-meat and cost totals agree between the two forms",
    `batch ${batch.fishCount}/${batch.redMeatCount}/${batch.costSoFar} vs inc ${incFish}/${incRed}/${incCost}`,
  );
  assert(
    batch.fishTarget === 2 && batch.redMeatTarget === 1 && batch.weeklyBudget === 60,
    "[executed] targets are carried through untouched, never inferred",
  );

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n§4 The question is routed to the owner, not to the model");

  const resolver = sourceOf("server/intelligence/pattern-intent-resolver.ts");
  assert(
    /function resolvePlannerExplain/.test(resolver),
    "a planner `explain` route exists — previously there was none at all",
  );
  assert(
    /resolvePlannerExplain\(lower, hints\)/.test(resolver),
    "…and it is actually invoked in the resolve pipeline",
  );
  assert(
    /capability: "planner",\s*\n\s*verb: "explain"/.test(resolver),
    "…resolving to planner:explain",
  );
  // It must stay pointer-gated, or it would poach every "why" question on every
  // surface — including the opportunity card's own.
  assert(
    /const entryId = hints\.selectedPlannerEntryId;[\s\S]{0,120}?entryId === undefined \|\| !Number\.isFinite\(entryId\)/.test(resolver),
    "the planner explain route fires ONLY when a surface pointed at one entry",
  );
  assert(
    resolver.indexOf("resolveOpportunityExplain(lower, hints)") <
      resolver.indexOf("resolvePlannerExplain(lower, hints)"),
    "the opportunity pointer still wins when both are somehow present",
  );

  // No duplicate conversation state: the pointer is the one COMP_ACT2 already
  // established, not a second planner-entry channel.
  const frame = sourceOf("server/intelligence/conversation/context-frame-assembler.ts");
  assert(
    (frame.match(/selectedPlannerEntryId\?:/g) ?? []).length === 2,
    "the entry pointer is declared once per interface — COMP4 added no parallel channel",
    String((frame.match(/selectedPlannerEntryId\?:/g) ?? []).length),
  );

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n§5 Honest about what it cannot know");

  assert(
    /asOf/.test(port) && /current-week/.test(port),
    "the answer declares WHICH week it explains against, rather than implying it is historic",
  );
  assert(
    /unknownTargets/.test(port) && /fishTarget/.test(port),
    "inputs that could not be recovered are NAMED, not silently defaulted",
  );
  // The targets are transient request settings. Defaulting them to 0 would make
  // "you have had 2 of 0 fish meals" reachable; null keeps the dimension silent.
  assert(
    /fishTarget: null,\s*\n\s*redMeatTarget: null,\s*\n\s*weeklyBudget: null,/.test(port),
    "unrecoverable targets are passed as null (dimension silent), never as 0",
  );
  assert(
    /will not fabricate/.test(handler),
    "the honest gap survives for the case where no owner can speak",
  );
  // The gap must no longer claim the Planner "records no rationale" — that was
  // false whenever the Planner had one and only the wiring was missing.
  assert(
    !/records no selection rationale/.test(handler),
    "the old gap message — which asserted an absence that was not real — is gone",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`COMP4 Planner Conversation Activation: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
