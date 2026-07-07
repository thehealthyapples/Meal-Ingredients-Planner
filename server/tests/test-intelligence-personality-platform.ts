/**
 * test-intelligence-personality-platform.ts — EWO2
 * ==================================================
 * Tests for the Companion Personality Platform: the closed registry, the
 * Behaviour Engine's pure phrasing transforms, the Growth Model's honest-gap
 * discipline, and an end-to-end gateway check that the SAME gap fires under
 * two different personalities with only wording differing (the EWO1 §5 hard
 * invariant, exercised for real).
 *
 * Coverage:
 *   §1  personality-registry — closed set, normalisation, defaults
 *   §2  behaviour-engine — fallback voicing preserves disclosure across all 6
 *   §3  behaviour-engine — guidance reordering never adds/drops/retargets
 *   §4  companion-growth — honest gap on thin data; real computation otherwise
 *   §5  gateway end-to-end — same gap, two voices, both honest
 *
 * Run: npx tsx server/tests/test-intelligence-personality-platform.ts
 */

import {
  PERSONALITY_IDS,
  PERSONALITY_REGISTRY,
  DEFAULT_PERSONALITY_ID,
  normalizePersonalityId,
  isPersonalityId,
  getPersonality,
} from "../intelligence/conversation/personality-registry.js";
import {
  systemPromptFragment,
  voiceFallback,
  prioritizeGuidance,
  voiceGuidanceSuggestions,
  buildGreeting,
  buildCelebration,
  phraseGrowth,
} from "../intelligence/conversation/behaviour-engine.js";
import {
  computeGrowthSignal,
  toGrowthPhraseInputs,
  MIN_SAMPLES_PER_WINDOW,
} from "../intelligence/conversation/companion-growth.js";
import type { GuidanceSuggestion } from "../intelligence/conversation/companion-guidance.js";
import type { UserHealthTrend } from "../../shared/schema.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import { InMemoryConversationStore, resetInMemoryIds } from "../intelligence/conversation/conversation-store.js";
import { patternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome } from "../intelligence/types.js";
import { db } from "../db.js";
import { userPreferences } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// §1 personality-registry
// ---------------------------------------------------------------------------

console.log("\n── §1 personality-registry — closed set, normalisation, defaults ───────────────");

assert(PERSONALITY_IDS.length === 6, "exactly 6 registered personalities");
assert(DEFAULT_PERSONALITY_ID === "companion", "default personality is 'companion'");
assert(normalizePersonalityId("sergeant") === "sergeant", "normalize passes through a valid id");
assert(normalizePersonalityId("nonexistent") === "companion", "normalize defaults an unknown value to companion (P6)");
assert(normalizePersonalityId(undefined) === "companion", "normalize defaults undefined to companion");
assert(normalizePersonalityId(null) === "companion", "normalize defaults null to companion");
assert(isPersonalityId("chef") === true, "isPersonalityId true for a valid id");
assert(isPersonalityId("wizard") === false, "isPersonalityId false for an invalid id");
for (const id of PERSONALITY_IDS) {
  const def = getPersonality(id);
  assert(def.id === id, `getPersonality(${id}) returns matching definition`);
  assert(def.displayName.length > 0, `${id} has a display name`);
  assert(def.priorities.length > 0, `${id} has a non-empty priorities list`);
  assert(def.systemPromptFragment.length > 0, `${id} has a system prompt fragment`);
  for (const state of ["no-route", "no-knowledge", "no-results", "internal-error"] as const) {
    const text = def.fallbackTemplates[state]({ suggestionExamples: '"a", "b"' });
    assert(typeof text === "string" && text.length > 0, `${id}.fallbackTemplates.${state} produces non-empty text`);
  }
}
// Registry object key set matches PERSONALITY_IDS exactly (no drift).
assert(
  Object.keys(PERSONALITY_REGISTRY).sort().join(",") === [...PERSONALITY_IDS].sort().join(","),
  "PERSONALITY_REGISTRY keys exactly match PERSONALITY_IDS",
);

// ---------------------------------------------------------------------------
// §2 behaviour-engine — fallback voicing preserves disclosure
// ---------------------------------------------------------------------------

console.log("\n── §2 behaviour-engine — fallback voicing across all 6 personalities ───────────");

for (const id of PERSONALITY_IDS) {
  const noKnowledge = voiceFallback("no-knowledge", id, { suggestionExamples: '"x"' });
  assert(noKnowledge.length > 0, `${id}: no-knowledge produces a disclosure`);
  // Hard invariant spot-check: no personality's no-knowledge text claims an answer exists.
  assert(
    !/here('s| is) (the|your) answer/i.test(noKnowledge),
    `${id}: no-knowledge never claims to have the answer`,
  );

  const noResults = voiceFallback("no-results", id, {
    suggestionExamples: '"x"',
    searchedAreas: "your pantry",
    searchedQuery: "kale",
  });
  assert(noResults.length > 0, `${id}: no-results produces text`);

  const fragment = systemPromptFragment(id);
  assert(fragment.length > 0, `${id}: system prompt fragment is non-empty`);
}
// Distinct personalities produce distinct wording for the same state (voice actually varies).
const companionText = voiceFallback("no-knowledge", "companion", { suggestionExamples: "" });
const sergeantText = voiceFallback("no-knowledge", "sergeant", { suggestionExamples: "" });
assert(companionText !== sergeantText, "companion and sergeant voice the same gap differently");

// ---------------------------------------------------------------------------
// §3 behaviour-engine — guidance reordering never adds/drops/retargets
// ---------------------------------------------------------------------------

console.log("\n── §3 behaviour-engine — guidance priority reordering is reorder-only ──────────");

const sampleSuggestions: GuidanceSuggestion[] = [
  { sourceDomain: "planner", domain: "nutrition", label: "See nutrition", sourceCapabilityId: "planner", targetCapabilityId: "nutrition-knowledge", verb: "explain" },
  { sourceDomain: "planner", domain: "shopping", label: "Add to list", sourceCapabilityId: "planner", targetCapabilityId: "shopping", verb: "add" },
];
const reorderedForChef = prioritizeGuidance(sampleSuggestions, "chef"); // chef priorities favour nothing here → stable order
assert(reorderedForChef.length === sampleSuggestions.length, "prioritizeGuidance never changes the count");
assert(
  new Set(reorderedForChef.map((s) => s.targetCapabilityId)).size === 2 &&
    reorderedForChef.every((s) => sampleSuggestions.some((o) => o.targetCapabilityId === s.targetCapabilityId)),
  "prioritizeGuidance never introduces or drops a target capability",
);

const voicedForCoach = voiceGuidanceSuggestions(sampleSuggestions, "coach");
assert(
  voicedForCoach.every((s, i) => s.label.startsWith("Next step: ")),
  "coach's guidance label prefix is applied to every suggestion",
);
assert(
  voicedForCoach.every((s) => sampleSuggestions.some((o) => o.domain === s.domain && o.targetCapabilityId === s.targetCapabilityId)),
  "voiced suggestions still point at the same real targets",
);

// buildGreeting/buildCelebration never throw and never fabricate a detail beyond what's passed in.
for (const id of PERSONALITY_IDS) {
  assert(buildGreeting(id, 0).length > 0, `${id}: buildGreeting produces a line`);
  const celebration = buildCelebration(id, "3 new plant varieties this week", 0);
  assert(celebration.includes("3 new plant varieties this week"), `${id}: celebration includes only the supplied, verified detail`);
}

// ---------------------------------------------------------------------------
// §4 companion-growth — honest gap on thin data
// ---------------------------------------------------------------------------

console.log("\n── §4 companion-growth — never fabricates familiarity ───────────────────────────");

function trendRow(daysAgo: number, rating: number, samples: number): UserHealthTrend {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: daysAgo,
    userId: 1,
    date: d.toISOString().split("T")[0],
    averageThaRating: rating,
    sampleCount: samples,
    eliteCount: 0,
    processedCount: 0,
  } as UserHealthTrend;
}

assert(computeGrowthSignal([]) === null, "no trend rows at all → null (honest gap)");
assert(
  computeGrowthSignal([trendRow(10, 80, MIN_SAMPLES_PER_WINDOW - 1)]) === null,
  "below the minimum sample floor in the recent window → null, never a thin/fabricated signal",
);

const richHistory: UserHealthTrend[] = [
  // Earlier window: ~150 days ago, lower score, enough samples.
  trendRow(150, 60, 3), trendRow(145, 62, 3), trendRow(140, 58, 3),
  // Recent window: last 10 days, higher score, enough samples.
  trendRow(5, 85, 3), trendRow(3, 88, 3), trendRow(1, 90, 3),
];
const signal = computeGrowthSignal(richHistory);
assert(signal !== null, "sufficient real samples in both windows → a signal is produced");
if (signal) {
  assert(signal.recentValue > signal.earlierValue, "recent average genuinely exceeds earlier average (real numbers, not invented)");
  assert(signal.recentSampleCount >= MIN_SAMPLES_PER_WINDOW, "recent sample count meets the floor");
  for (const id of PERSONALITY_IDS) {
    const phrase = phraseGrowth(toGrowthPhraseInputs(signal), id);
    assert(
      phrase.includes(String(signal.recentValue)) && phrase.includes(String(signal.earlierValue)),
      `${id}: growth phrase cites the real earlier/recent numbers, not invented ones`,
    );
  }
}

// ---------------------------------------------------------------------------
// §5 gateway end-to-end — same gap, two voices
// ---------------------------------------------------------------------------

console.log("\n── §5 gateway end-to-end — same honest gap, two personalities ──────────────────");

class StubLlmProvider implements ILlmProvider {
  readonly isAvailable = true;
  readonly modelName = "stub";
  async complete(_req: LlmRequest): Promise<LlmResponse> {
    return { content: JSON.stringify({ text: "unused — no-knowledge short-circuits before this" }), model: "stub" };
  }
}

// A stub intent resolver that always routes to one capability the stub handler answers with an honest gap.
const stubResolver = {
  async resolve() {
    return [
      { capability: "nutrition-knowledge", verb: "explain", parameters: {}, baseline: false },
    ];
  },
};

const stubHandleIntent: HandleIntentFn = async (): Promise<IntentOutcome> => ({
  status: "gap",
  message: "no trusted stored knowledge",
});

const GATEWAY_TEST_USER_ID = 900_100_002; // Unlikely to collide with a real seeded user.

async function runGatewayVoicingCheck(): Promise<void> {
  await db.delete(userPreferences).where(eq(userPreferences.userId, GATEWAY_TEST_USER_ID));
  try {
    resetInMemoryIds();
    await db.insert(userPreferences).values({ userId: GATEWAY_TEST_USER_ID, companionPersonality: "sergeant" } as any);

    const gateway = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlmProvider(),
      stubResolver as any,
      stubHandleIntent,
    );
    const ctx: IntelligenceContext = { userId: GATEWAY_TEST_USER_ID, role: "user", tier: "free" } as any;
    const result = await gateway.processUserTurn(
      GATEWAY_TEST_USER_ID,
      "what is broccoli good for",
      "nutrition",
      {},
      ctx,
    );
    assert(result.fallbackState === "no-knowledge", "gateway classifies the stubbed gap as no-knowledge for sergeant");
    // COMP1 — the sergeant template now names the actual area checked (via
    // describeQueried) and adds a next action, so the text is no longer a
    // fixed literal — assert the registered template's own dynamic wording.
    assert(
      result.text ===
        `No documented answer for the nutrition knowledge base. Not guessing. Name the specific target and I'll check again. ` +
        `Or try: "what is broccoli good for", "foods that help with sleep" or "what foods are high in iron".`,
      "sergeant's registered wording is used verbatim",
    );

    await db.update(userPreferences).set({ companionPersonality: "friend" }).where(eq(userPreferences.userId, GATEWAY_TEST_USER_ID));
    resetInMemoryIds();
    const gateway2 = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlmProvider(),
      stubResolver as any,
      stubHandleIntent,
    );
    const result2 = await gateway2.processUserTurn(
      GATEWAY_TEST_USER_ID,
      "what is broccoli good for",
      "nutrition",
      {},
      ctx,
    );
    assert(result2.fallbackState === "no-knowledge", "gateway classifies the SAME stubbed gap as no-knowledge for friend — disclosure unchanged");
    assert(
      result2.text !== result.text,
      "friend's wording differs from sergeant's — the voice actually changed",
    );
    assert(
      /don't have solid info|didn't want to just guess/.test(result2.text),
      "friend's wording still honestly discloses the gap, just in a different voice",
    );
  } finally {
    await db.delete(userPreferences).where(eq(userPreferences.userId, GATEWAY_TEST_USER_ID));
  }
}

(async () => {
  await runGatewayVoicingCheck();

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------

  console.log("\n" + "=".repeat(60));
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));
  if (failed > 0) {
    console.log("\nFailed:");
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
})();
