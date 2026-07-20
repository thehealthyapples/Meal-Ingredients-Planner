/**
 * test-intelligence-notice-engine.ts — EWX1
 * =================================================================
 * Tests for the Notice Engine: honest-gap behaviour on thin data,
 * the stateless "notable round number" Silence Rule for milestones,
 * verbatim pass-through of opportunity content, and the personality-aware
 * phrasing dispatch (behaviour-engine.ts's `phraseNotice`).
 *
 * Coverage:
 *   §1  noticeNutritionTrend — honest null passthrough vs real signal
 *   §2  noticeHouseholdStory — verbatim pass-through, honest null
 *   §3  noticeOpportunities — verbatim content, unmapped domain filtered
 *   §4  applySilenceRules — cap, de-dup, priority ordering
 *   §5  phraseNotice — personality voicing per fact kind
 *
 * Run: npx tsx server/tests/test-intelligence-notice-engine.ts
 */

import {
  noticeNutritionTrend,
  noticeHouseholdStory,
  noticeOpportunities,
  noticeSeasonal,
  noticeLearning,
  applySilenceRules,
  MAX_NOTICES_PER_MOMENT,
  type Notice,
  type OpportunityLike,
  type ConfirmedLearningLike,
} from "../intelligence/conversation/notice-engine.js";
import { phraseNotice } from "../intelligence/conversation/behaviour-engine.js";
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
// §1 noticeNutritionTrend
// ---------------------------------------------------------------------------

console.log("\n── §1 noticeNutritionTrend — honest gap vs real signal ────────────────────────");

assert(noticeNutritionTrend([]).length === 0, "no trend rows → no notice (honest gap)");

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
  const obs = noticeNutritionTrend(rows, now);
  assert(obs.length === 1, "sufficient real data → exactly one nutrition-trend notice");
  assert(obs[0]?.category === "nutrition-trend", "notice is categorised as nutrition-trend");
  assert(obs[0]?.fact.kind === "growth", "fact kind is 'growth'");
}

// ---------------------------------------------------------------------------
// §2 noticeHouseholdStory — PRESENCE2
//
// This section replaces the former "noticeStreak / noticeDiversity notability
// gate". Both producers were RETIRED under GEA13 ("THA never scores, ranks,
// streaks, or rewards a household"), so there is no notability gate left to test:
// the thing the gate made tolerable is gone rather than tuned. §2.1 below asserts
// the retirement itself, so it cannot be undone silently.
// ---------------------------------------------------------------------------

console.log("\n── §2 noticeHouseholdStory — verbatim pass-through, honest null ───────────────");

assert(noticeHouseholdStory(null, "favourite", "f").length === 0, "no headline → silence");
assert(noticeHouseholdStory("", "favourite", "f").length === 0, "empty headline → silence");
assert(noticeHouseholdStory("   ", "favourite", "f").length === 0, "whitespace headline → silence");

{
  const headline = "Lentils quietly appeared in more and more meals.";
  const out = noticeHouseholdStory(headline, "favourite", "f");
  assert(out.length === 1, "a real headline → one notice");
  assert(out[0].fact.kind === "story", "the fact kind is `story`");
  assert(
    out[0].fact.kind === "story" && out[0].fact.headline === headline,
    "the Story Engine's headline crosses VERBATIM — never reworded, never truncated",
  );
  assert(out[0].priority === "low", "an observation is always `low` — it never demands attention");
  assert(out[0].category === "household-story", "category is household-story");
}

console.log("\n── §2.1 PRESENCE2 — the scoring producers are retired, not disabled ──────────");

{
  const engine = await import("../intelligence/conversation/notice-engine.js");
  assert(!("noticeStreak" in engine), "noticeStreak no longer exists (GEA13 — streaks)");
  assert(!("noticeDiversity" in engine), "noticeDiversity no longer exists (GEA13 — rewards)");
  // The categories are gone from the closed taxonomy too, so a future caller
  // cannot reintroduce the notice merely by constructing the object by hand.
  const cats: readonly string[] = [
    "nutrition-trend", "planner-gap", "pantry-opportunity", "shopping-opportunity",
    "seasonal-highlight", "household-learning", "cookbook-opportunity",
    "nutrition-opportunity", "household-story",
  ];
  assert(!cats.includes("streak-milestone"), "streak-milestone is not a category");
  assert(!cats.includes("diversity-milestone"), "diversity-milestone is not a category");
}

// ---------------------------------------------------------------------------
// §3 noticeOpportunities — verbatim content, unmapped domain filtered
// ---------------------------------------------------------------------------

console.log("\n── §3 noticeOpportunities — verbatim pass-through, no rewording ───────────────");

{
  const input: OpportunityLike[] = [
    { id: "a1", domain: "planner", priority: "high", explanation: "Tuesday has no meals planned yet.", suggestedAction: "Add a meal to Tuesday.", evidence: [{ source: "planner-week", detail: "Week 3 has 1 of 7 day(s) with zero planner entries." }] },
    { id: "b2", domain: "pantry", priority: "low", explanation: "Kale is in your pantry unused.", suggestedAction: "Plan a meal using kale.", evidence: [{ source: "pantry-items", detail: "Kale is a current pantry item with no matching planner entry." }] },
    // Unmapped domain — still fully cited, so the ONLY reason it can be dropped is the domain.
    { id: "c3", domain: "some-future-domain", priority: "low", explanation: "unmapped", suggestedAction: "unmapped", evidence: [{ source: "somewhere", detail: "cited" }] },
  ];
  const obs = noticeOpportunities(input);
  assert(obs.length === 2, "unmapped domain is filtered out, not guessed into a category");
  assert(obs[0]?.category === "planner-gap", "planner domain maps to planner-gap");
  assert(obs[0]?.fact.kind === "opportunity" && obs[0].fact.explanation === input[0]!.explanation, "explanation copied verbatim, not reworded");
  assert(obs[1]?.category === "pantry-opportunity", "pantry domain maps to pantry-opportunity");

  // COACH1 — evidence is carried verbatim and in order, and every notice names its owner.
  assert(
    obs[0]?.fact.kind === "opportunity" && obs[0].fact.evidence.length === 1 && obs[0].fact.evidence[0]!.source === "planner-week",
    "COACH1: the producer's evidence is carried through, not dropped",
  );
  assert(
    obs[0]?.fact.kind === "opportunity" && obs[0].fact.evidence[0]!.detail === input[0]!.evidence![0]!.detail,
    "COACH1: evidence detail copied verbatim, not reworded",
  );
  assert(obs[0]?.source === "opportunity-delivery", "COACH1: an opportunity notice names its owning capability");
}

// COACH1 — Rule E1 at the coaching boundary: an uncited opportunity is dropped.
{
  const uncited: OpportunityLike[] = [
    { id: "no-cite", domain: "planner", priority: "high", explanation: "e", suggestedAction: "a" },
    { id: "empty-cite", domain: "pantry", priority: "low", explanation: "e", suggestedAction: "a", evidence: [] },
  ];
  assert(noticeOpportunities(uncited).length === 0, "COACH1: no citation, no card — an uncited opportunity never becomes a notice");
}

// ---------------------------------------------------------------------------
// §3b noticeSeasonal (IA2) — honest gap on no headline, verbatim pass-through
// ---------------------------------------------------------------------------

console.log("\n── §3b noticeSeasonal — honest gap vs verbatim pass-through ───────────────────");

assert(noticeSeasonal(null).length === 0, "no seasonal headline → no notice (honest gap)");
{
  const obs = noticeSeasonal("Looking ahead to autumn, you may enjoy pumpkin.");
  assert(obs.length === 1, "a real headline → exactly one seasonal-highlight notice");
  assert(obs[0]?.category === "seasonal-highlight", "notice is categorised as seasonal-highlight");
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
  const cited = [{ source: "planner-week", detail: "d" }];
  const many: Notice[] = [
    { id: "low-1", category: "pantry-opportunity", priority: "low", source: "opportunity-delivery", fact: { kind: "opportunity", explanation: "e", suggestedAction: "a", evidence: cited } },
    { id: "high-1", category: "planner-gap", priority: "high", source: "opportunity-delivery", fact: { kind: "opportunity", explanation: "e", suggestedAction: "a", evidence: cited } },
    { id: "med-1", category: "shopping-opportunity", priority: "medium", source: "opportunity-delivery", fact: { kind: "opportunity", explanation: "e", suggestedAction: "a", evidence: cited } },
    { id: "high-1", category: "planner-gap", priority: "high", source: "opportunity-delivery", fact: { kind: "opportunity", explanation: "e", suggestedAction: "a", evidence: cited } }, // duplicate id
  ];
  const result = applySilenceRules(many);
  assert(result.length <= MAX_NOTICES_PER_MOMENT, `never exceeds the cap (${MAX_NOTICES_PER_MOMENT})`);
  assert(result[0]?.id === "high-1", "highest priority notice surfaces first");
  assert(result.filter((o) => o.id === "high-1").length === 1, "duplicate id is de-duplicated");
}

// ---------------------------------------------------------------------------
// §5 phraseNotice — personality voicing per fact kind
// ---------------------------------------------------------------------------

console.log("\n── §5 phraseNotice — voices every fact kind for all 6 personalities ───────");

{
  // PRESENCE2 — was a `streak` notice. A story notice replaces it, and the
  // assertion below is deliberately the OPPOSITE of the one it replaces: a streak
  // had to be voiced differently per personality, whereas an observation must be
  // voiced IDENTICALLY, because the voice may change how THA sounds and never what
  // it claims is true.
  const storyObs: Notice = {
    id: "household-story:favourite",
    category: "household-story",
    priority: "low",
    source: "household-stories",
    fact: { kind: "story", headline: "Lentils quietly appeared in more and more meals.", section: "favourite" },
  };
  const oppObs: Notice = {
    id: "opportunity:x",
    category: "planner-gap",
    priority: "high",
    source: "opportunity-delivery",
    fact: {
      kind: "opportunity",
      explanation: "Tuesday has no meals planned yet.",
      suggestedAction: "Add a meal to Tuesday.",
      evidence: [{ source: "planner-week", detail: "Week 3 has 1 of 7 day(s) with zero planner entries." }],
    },
  };
  const seasonalObs: Notice = {
    id: "seasonal-highlight",
    category: "seasonal-highlight",
    priority: "low",
    source: "seasonal-stories",
    fact: { kind: "seasonal", headline: "Looking ahead to autumn, you may enjoy pumpkin." },
  };
  const texts = new Set<string>();
  for (const id of PERSONALITY_IDS) {
    const text = phraseNotice(storyObs, id);
    assert(typeof text === "string" && text.length > 0, `${id}: story notice produces non-empty text`);
    assert(
      text === "Lentils quietly appeared in more and more meals.",
      `${id}: an observation crosses the voice seam VERBATIM — no prefix, no rewording`,
    );
    texts.add(text);

    const oppText = phraseNotice(oppObs, id);
    assert(oppText.includes("Add a meal to Tuesday."), `${id}: opportunity notice preserves the verbatim suggestedAction`);

    const seasonalText = phraseNotice(seasonalObs, id);
    assert(seasonalText.includes("Looking ahead to autumn, you may enjoy pumpkin."), `${id}: seasonal notice preserves the verbatim headline`);
  }
  // PRESENCE2 — this assertion is INVERTED from the one it replaces, deliberately.
  // It used to read "at least two personalities voice the same streak fact
  // differently". A streak was a THA opinion, so it was the voice's to colour. An
  // observation is the household's own fact, so it is not: all six voices must say
  // it identically, or the personality has become a source of truth.
  assert(texts.size === 1, "all six personalities voice an observation IDENTICALLY — voice may not vary a fact");
}

// -----------------------------------------------------------------------------
// §7 PHASE5E (NTC-P4) — noticeLearning: the eighth notice source
//
// The Notice Engine Architecture §2.2 authorises exactly one shape for this: "only for
// signals with `status = confirmed`. A `pending_confirmation` signal is a QUESTION for
// the household, not a notice." That single rule is the difference between THA telling a
// household something they agreed is true, and THA announcing a conclusion it drew about
// them behind their back. It is asserted first, and hardest.
// -----------------------------------------------------------------------------
console.log("\n── §7 noticeLearning (NTC-P4) — confirmed only, verbatim, uncited never ───────");

function learningSignal(overrides: Partial<ConfirmedLearningLike> = {}): ConfirmedLearningLike {
  return {
    id: 1,
    domain: "planner",
    subjectKey: "fish",
    direction: "negative",
    confidence: "high",
    evidenceCount: 6,
    rationale: "Your household has swapped out fish meals in 6 of the last 7 weeks.",
    status: "confirmed",
    ...overrides,
  };
}

{
  const confirmed = noticeLearning([learningSignal()]);
  assert(confirmed.length === 1, "a CONFIRMED signal becomes a notice");
  assert(confirmed[0].category === "household-learning", "…in the household-learning category");
  assert(confirmed[0].priority === "low", "…at low attention — a confirmed preference is calm, never a demand");
  assert(
    confirmed[0].source === "household-learning",
    "…citing the same owner OD1 cites when learning moves a ranking, so provenance answers identically",
  );

  const fact = confirmed[0].fact as { kind: string; rationale: string; evidenceCount: number };
  assert(fact.kind === "learning", "the fact kind is `learning`");
  assert(
    fact.rationale === learningSignal().rationale,
    "the rationale is EL1's OWN sentence, verbatim — never paraphrased, because a paraphrase is where " +
      "'you tend to skip fish on weeknights' quietly becomes 'you don't like fish'",
  );
  assert(fact.evidenceCount === 6, "EL1's evidence count rides through unchanged");
}

// The rule the whole category turns on.
for (const status of ["pending_confirmation", "declined"]) {
  assert(
    noticeLearning([learningSignal({ status })]).length === 0,
    `a ${status} signal is NEVER noticed — THA does not tell a household what it has learned about them ` +
      "until they have agreed it is true",
  );
}

// Rule E1 — no citation, no card. Enforced exactly as noticeOpportunities enforces it.
assert(
  noticeLearning([learningSignal({ rationale: "" })]).length === 0,
  "a signal with no rationale is dropped — no citation, no card (Rule E1)",
);
assert(
  noticeLearning([learningSignal({ rationale: "   " })]).length === 0,
  "…and a whitespace-only rationale is not a citation either",
);

// Honest absence, never padding.
assert(noticeLearning([]).length === 0, "no confirmed signals → no notices (silence is a first-class outcome)");

// The voice seam handles the new fact kind, in every personality, without rewording it.
{
  const notice = noticeLearning([learningSignal()])[0];
  for (const pid of PERSONALITY_IDS) {
    const text = phraseNotice(notice, pid);
    assert(
      text.includes(learningSignal().rationale),
      `phraseNotice(${pid}) carries EL1's rationale VERBATIM — the voice may prefix it, never reword it`,
    );
  }
}

// It competes for the same attention budget as every other notice, and — being `low` —
// it yields to anything that matters more. No new budget, no privileged channel.
{
  const learning = noticeLearning([learningSignal()]);
  const critical = noticeOpportunities([
    {
      id: "shopping-restriction-conflict:1",
      domain: "shopping",
      priority: "critical",
      explanation: "x",
      suggestedAction: "y",
      evidence: [{ source: "shopping-list", detail: "d" }],
    },
  ]);
  const selected = applySilenceRules([...learning, ...critical]);
  assert(
    selected[0].category === "shopping-opportunity",
    "a low-attention learning notice never outranks a critical — it passes through the ONE Silence Rules budget",
  );
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
