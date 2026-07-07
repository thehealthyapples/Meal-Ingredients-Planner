/**
 * test-intelligence-observation-engine.ts — EWX1
 * =================================================================
 * Tests for the Observation Engine: honest-gap behaviour on thin data,
 * the stateless "notable round number" Silence Rule for milestones,
 * verbatim pass-through of opportunity content, and the personality-aware
 * phrasing dispatch (behaviour-engine.ts's `phraseObservation`).
 *
 * Coverage:
 *   §1  observeNutritionTrend — honest null passthrough vs real signal
 *   §2  observeStreak / observeDiversity — notability gate
 *   §3  observeOpportunities — verbatim content, unmapped domain filtered
 *   §4  applySilenceRules — cap, de-dup, priority ordering
 *   §5  phraseObservation — personality voicing per fact kind
 *
 * Run: npx tsx server/tests/test-intelligence-observation-engine.ts
 */

import {
  observeNutritionTrend,
  observeStreak,
  observeDiversity,
  observeOpportunities,
  observeSeasonal,
  applySilenceRules,
  MAX_OBSERVATIONS_PER_MOMENT,
  type Observation,
  type OpportunityLike,
} from "../intelligence/conversation/observation-engine.js";
import { phraseObservation } from "../intelligence/conversation/behaviour-engine.js";
import { PERSONALITY_IDS } from "../intelligence/conversation/personality-registry.js";
import type { UserHealthTrend, UserStreak } from "../../shared/schema.js";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
}

function trend(date: string, rating: number, samples: number): UserHealthTrend {
  return {
    id: 0,
    userId: 1,
    date,
    averageThaRating: rating,
    sampleCount: samples,
    eliteCount: rating >= 80 ? samples : 0,
    processedCount: 0,
  };
}

function streak(current: number, best: number): UserStreak {
  return {
    id: 0,
    userId: 1,
    currentEliteStreak: current,
    bestEliteStreak: best,
    lastEliteDate: null,
    weeklyEliteCount: 0,
    weekStartDate: null,
  } as UserStreak;
}

// ---------------------------------------------------------------------------
// §1 observeNutritionTrend
// ---------------------------------------------------------------------------

console.log("\n── §1 observeNutritionTrend — honest gap vs real signal ────────────────────────");

assert(observeNutritionTrend([]).length === 0, "no trend rows → no observation (honest gap)");

{
  const now = new Date("2026-07-03");
  const rows: UserHealthTrend[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    rows.push(trend(d.toISOString().slice(0, 10), 80, 3));
  }
  for (let i = 100; i < 106; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    rows.push(trend(d.toISOString().slice(0, 10), 60, 3));
  }
  const obs = observeNutritionTrend(rows, now);
  assert(obs.length === 1, "sufficient real data → exactly one nutrition-trend observation");
  assert(obs[0]?.category === "nutrition-trend", "observation is categorised as nutrition-trend");
  assert(obs[0]?.fact.kind === "growth", "fact kind is 'growth'");
}

// ---------------------------------------------------------------------------
// §2 observeStreak / observeDiversity — notability gate
// ---------------------------------------------------------------------------

console.log("\n── §2 observeStreak / observeDiversity — stateless notability gate ─────────────");

assert(observeStreak(undefined).length === 0, "no streak row → silence");
assert(observeStreak(streak(0, 0)).length === 0, "zero streak → silence");
assert(observeStreak(streak(3, 10)).length === 0, "non-round streak (3) → silence");
assert(observeStreak(streak(7, 10)).length === 1, "round streak (7) → one observation");
assert(observeStreak(streak(14, 14)).length === 1, "round streak (14) → one observation");

assert(observeDiversity(0).length === 0, "zero plant diversity → silence");
assert(observeDiversity(7).length === 0, "non-round diversity (7) → silence");
assert(observeDiversity(20).length === 1, "round diversity (20) → one observation");

// ---------------------------------------------------------------------------
// §3 observeOpportunities — verbatim content, unmapped domain filtered
// ---------------------------------------------------------------------------

console.log("\n── §3 observeOpportunities — verbatim pass-through, no rewording ───────────────");

{
  const input: OpportunityLike[] = [
    { id: "a1", domain: "planner", priority: "high", explanation: "Tuesday has no meals planned yet.", suggestedAction: "Add a meal to Tuesday." },
    { id: "b2", domain: "pantry", priority: "low", explanation: "Kale is in your pantry unused.", suggestedAction: "Plan a meal using kale." },
    { id: "c3", domain: "some-future-domain", priority: "low", explanation: "unmapped", suggestedAction: "unmapped" },
  ];
  const obs = observeOpportunities(input);
  assert(obs.length === 2, "unmapped domain is filtered out, not guessed into a category");
  assert(obs[0]?.category === "planner-gap", "planner domain maps to planner-gap");
  assert(obs[0]?.fact.kind === "opportunity" && obs[0].fact.explanation === input[0]!.explanation, "explanation copied verbatim, not reworded");
  assert(obs[1]?.category === "pantry-opportunity", "pantry domain maps to pantry-opportunity");
}

// ---------------------------------------------------------------------------
// §3b observeSeasonal (IA2) — honest gap on no headline, verbatim pass-through
// ---------------------------------------------------------------------------

console.log("\n── §3b observeSeasonal — honest gap vs verbatim pass-through ───────────────────");

assert(observeSeasonal(null).length === 0, "no seasonal headline → no observation (honest gap)");
{
  const obs = observeSeasonal("Looking ahead to autumn, you may enjoy pumpkin.");
  assert(obs.length === 1, "a real headline → exactly one seasonal-highlight observation");
  assert(obs[0]?.category === "seasonal-highlight", "observation is categorised as seasonal-highlight");
  assert(
    obs[0]?.fact.kind === "seasonal" && obs[0].fact.headline === "Looking ahead to autumn, you may enjoy pumpkin.",
    "headline copied verbatim, not reworded",
  );
}

// ---------------------------------------------------------------------------
// §4 applySilenceRules — cap, de-dup, priority ordering
// ---------------------------------------------------------------------------

console.log("\n── §4 applySilenceRules — cap, de-dup, priority ordering ───────────────────────");

{
  const many: Observation[] = [
    { id: "low-1", category: "pantry-opportunity", priority: "low", fact: { kind: "opportunity", explanation: "e", suggestedAction: "a" } },
    { id: "high-1", category: "planner-gap", priority: "high", fact: { kind: "opportunity", explanation: "e", suggestedAction: "a" } },
    { id: "med-1", category: "shopping-opportunity", priority: "medium", fact: { kind: "opportunity", explanation: "e", suggestedAction: "a" } },
    { id: "high-1", category: "planner-gap", priority: "high", fact: { kind: "opportunity", explanation: "e", suggestedAction: "a" } }, // duplicate id
  ];
  const result = applySilenceRules(many);
  assert(result.length <= MAX_OBSERVATIONS_PER_MOMENT, `never exceeds the cap (${MAX_OBSERVATIONS_PER_MOMENT})`);
  assert(result[0]?.id === "high-1", "highest priority observation surfaces first");
  assert(result.filter((o) => o.id === "high-1").length === 1, "duplicate id is de-duplicated");
}

// ---------------------------------------------------------------------------
// §5 phraseObservation — personality voicing per fact kind
// ---------------------------------------------------------------------------

console.log("\n── §5 phraseObservation — voices every fact kind for all 6 personalities ───────");

{
  const streakObs: Observation = {
    id: "streak-milestone",
    category: "streak-milestone",
    priority: "medium",
    fact: { kind: "streak", currentStreak: 14, bestStreak: 20 },
  };
  const oppObs: Observation = {
    id: "opportunity:x",
    category: "planner-gap",
    priority: "high",
    fact: { kind: "opportunity", explanation: "Tuesday has no meals planned yet.", suggestedAction: "Add a meal to Tuesday." },
  };
  const seasonalObs: Observation = {
    id: "seasonal-highlight",
    category: "seasonal-highlight",
    priority: "low",
    fact: { kind: "seasonal", headline: "Looking ahead to autumn, you may enjoy pumpkin." },
  };
  const texts = new Set<string>();
  for (const id of PERSONALITY_IDS) {
    const text = phraseObservation(streakObs, id);
    assert(typeof text === "string" && text.length > 0, `${id}: streak observation produces non-empty text`);
    texts.add(text);

    const oppText = phraseObservation(oppObs, id);
    assert(oppText.includes("Add a meal to Tuesday."), `${id}: opportunity observation preserves the verbatim suggestedAction`);

    const seasonalText = phraseObservation(seasonalObs, id);
    assert(seasonalText.includes("Looking ahead to autumn, you may enjoy pumpkin."), `${id}: seasonal observation preserves the verbatim headline`);
  }
  assert(texts.size > 1, "at least two personalities voice the same streak fact differently");
}

(async () => {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));
  if (failed > 0) {
    console.log("\nFailed:");
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
})();
