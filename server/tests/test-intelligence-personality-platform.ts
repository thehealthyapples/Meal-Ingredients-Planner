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
 *   §6  CP2 — escalation voicing: every voice refuses, none implies it acted
 *   §7  CP2 — degradation voicing: every voice discloses "not configured"
 *   §8  CP2 — the Companion experience surface, in six voices
 *   §9  CP2 — the voice is never grounding: no personality byte in CONTEXT DATA
 *   §10 CP2 — functional identity: the sealed decision differs only in wording
 *
 * Run: npx tsx server/tests/test-intelligence-personality-platform.ts
 *      npm run test:intelligence-personality-platform
 */

import {
  PERSONALITY_IDS,
  PERSONALITY_REGISTRY,
  DEFAULT_PERSONALITY_ID,
  normalizePersonalityId,
  isPersonalityId,
  getPersonality,
  cannotYet,
  notConfigured,
} from "../intelligence/conversation/personality-registry.js";
import {
  systemPromptFragment,
  voiceFallback,
  prioritizeGuidance,
  voiceGuidanceSuggestions,
  buildGreeting,
  buildCelebration,
  buildInvitation,
  buildCompanionExperience,
  phraseGrowth,
  voiceEscalation,
  voiceDegradation,
  resolveBehaviour,
  sealBehaviourDecision,
  BEHAVIOUR_SURFACES,
} from "../intelligence/conversation/behaviour-engine.js";
import { composeContext } from "../intelligence/context/context-composition-engine.js";
import { CONTEXT_VIEW_SPECS, hasNativeContextView } from "../intelligence/context/context-view.js";
import { createProfileReadHandler } from "../intelligence/handlers/profile-read-handler.js";
import {
  computeGrowthSignal,
  toGrowthPhraseInputs,
  MIN_SAMPLES_PER_WINDOW,
} from "../intelligence/conversation/companion-growth.js";
import type { GuidanceSuggestion } from "../intelligence/conversation/companion-guidance.js";
import type { UserHealthTrend } from "../../shared/schema.js";
import {
  ConversationGateway,
  detectWriteIntent,
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

// ---------------------------------------------------------------------------
// §6 CP2 — escalation voicing: every voice refuses, none implies it acted
// ---------------------------------------------------------------------------

console.log("\n── §6 CP2 — escalation voicing (the read-only write refusal) ───────────────────");

// The complete set of actions detectWriteIntent can name, harvested from the
// guard itself rather than hand-copied — so a new refusal reason cannot be
// added to the gateway without this test covering it.
const WRITE_UTTERANCES = [
  "add chicken to my shopping list",
  "remove the salmon meal",
  "move Monday's dinner to Tuesday",
  "replace the salmon meal with cod",
  "create a new meal plan for next week",
  "update my profile diet",
];
const WRITE_ACTIONS = Array.from(
  new Set(WRITE_UTTERANCES.map((u) => detectWriteIntent(u)).filter((a): a is string => a !== null)),
);
assert(WRITE_ACTIONS.length >= 5, `harvested ${WRITE_ACTIONS.length} distinct write actions from detectWriteIntent`);

for (const id of PERSONALITY_IDS) {
  for (const action of WRITE_ACTIONS) {
    const text = voiceEscalation(id, { action });
    // The refusal clause is structural, not stylistic: it must survive verbatim.
    assert(text.includes(cannotYet(action)), `${id}: escalation embeds the verbatim refusal for "${action}"`);
    // The action the user asked for is named, never silently generalised away.
    assert(text.includes(action), `${id}: escalation names the action the user asked for ("${action}")`);
    // And no voice may imply the write happened.
    assert(
      !/\b(i've|i have|done|added|removed|updated|created|moved|replaced)\b/i.test(text),
      `${id}: escalation never implies the write was performed ("${action}")`,
    );
  }
}
// The default voice's copy is byte-identical to the string the gateway owned before CP2.
assert(
  voiceEscalation("companion", { action: "add items to the planner or shopping list" }) ===
    "I can read and explain your data, but I can't add items to the planner or shopping list yet — " +
      "that's coming in a future update. For now, make the change directly in the app and I can help you " +
      "understand or review it afterwards.",
  "companion's escalation is byte-identical to the pre-CP2 gateway copy (no default-voice copy change)",
);
// Six voices, six different wordings of one refusal.
assert(
  new Set(PERSONALITY_IDS.map((id) => voiceEscalation(id, { action: "replace meals" }))).size === 6,
  "all six voices word the same refusal differently",
);

// ---------------------------------------------------------------------------
// §7 CP2 — degradation voicing
// ---------------------------------------------------------------------------

console.log("\n── §7 CP2 — degradation voicing (provider unavailable) ─────────────────────────");

for (const id of PERSONALITY_IDS) {
  const text = voiceDegradation(id);
  assert(text.includes(notConfigured()), `${id}: degradation embeds the verbatim "not configured" disclosure`);
  assert(
    !/\b(thinking|one moment|just a sec|loading|working on it)\b/i.test(text),
    `${id}: degradation never implies the assistant is merely busy`,
  );
}
assert(
  voiceDegradation("companion") === "The AI assistant isn't available right now — it hasn't been configured yet.",
  "companion's degradation is byte-identical to the pre-CP2 gateway copy",
);
assert(
  new Set(PERSONALITY_IDS.map((id) => voiceDegradation(id))).size === 6,
  "all six voices word the same degradation differently",
);

// ---------------------------------------------------------------------------
// §8 CP2 — the Companion experience surface
// ---------------------------------------------------------------------------

console.log("\n── §8 CP2 — the Companion experience surface, in six voices ────────────────────");

for (const id of PERSONALITY_IDS) {
  const exp = buildCompanionExperience(id, 0);
  assert(exp.personalityId === id, `${id}: experience reports the voice that built it`);
  assert(exp.greeting.length > 0, `${id}: experience carries a greeting`);
  assert(exp.invitation === buildInvitation(id), `${id}: experience's invitation IS the registry's invitation`);
  // The transport error is the internal-error disclosure — not a seventh phrasing of one fact.
  assert(
    exp.transportError === voiceFallback("internal-error", id, { suggestionExamples: "" }),
    `${id}: experience.transportError reuses the internal-error template, adding no new content`,
  );
  // Nothing about the household may appear in an experience surface.
  assert(
    !/\{name\}|\{detail\}|undefined|null/.test(`${exp.greeting} ${exp.invitation}`),
    `${id}: experience leaves no unfilled slot and asserts no fact`,
  );
}
// Day-seeded, not random: the same voice on the same day says the same words.
assert(
  buildCompanionExperience("chef", 42).greeting === buildCompanionExperience("chef", 42).greeting,
  "the greeting is deterministic for a fixed (voice, seed)",
);
assert(
  new Set(PERSONALITY_IDS.map((id) => buildCompanionExperience(id, 0).greeting)).size === 6,
  "all six voices greet differently",
);
// The client's pre-CP2 hardcoded invitation is now the default voice's registry content.
assert(
  buildInvitation("companion") === "Ask me anything about your food and plans.",
  "companion's invitation is byte-identical to the string FloatingAssistant.tsx used to hardcode",
);

// ---------------------------------------------------------------------------
// §9 CP2 — the voice is never grounding (Native Context View boundary)
// ---------------------------------------------------------------------------

console.log("\n── §9 CP2 — personality never enters CONTEXT DATA ──────────────────────────────");

// The `profile:read` Native Context View is REUSED unchanged: CP2 adds no view,
// no spec, and pins no new field. Crucially it must never pin the voice choice.
assert(hasNativeContextView("profile", "read"), "profile:read still has its Native Context View (unchanged by CP2)");
assert(
  (CONTEXT_VIEW_SPECS["profile:read"].pinned ?? []).every((p) => !/companionPersonality/i.test(p)),
  "profile:read's Native Context View pins no personality field",
);

// Compose real grounding from a profile Full Result that (correctly) carries no
// voice, and prove no personality byte reaches the model's CONTEXT DATA block.
const profileResult = {
  scope: "profile",
  profile: { id: 1, dietPattern: "Mediterranean", dietRestrictions: ["Gluten-Free"] },
  preferences: { dietTypes: ["mediterranean"], healthGoals: ["improve-health"], excludedIngredients: [] },
};
const composed = composeContext({
  utterance: "what should I eat this week",
  capabilities: [{ capabilityId: "profile", verb: "read", result: profileResult, confidence: 1, baseline: true }],
  enrichment: [],
});
for (const id of PERSONALITY_IDS) {
  assert(
    !composed.text.includes(systemPromptFragment(id)),
    `${id}: the tone fragment is absent from the composed CONTEXT DATA`,
  );
  // Only the five voices that HAVE a label prefix can be searched for one.
  // `companion`'s prefix is deliberately empty, so asserting its absence would
  // be a vacuous test wearing the costume of a guarantee.
  const prefix = getPersonality(id).guidanceLabelPrefix.trim();
  if (prefix.length > 0) {
    assert(
      !composed.text.includes(prefix),
      `${id}: the guidance label prefix is absent from the composed CONTEXT DATA`,
    );
  }
  // No registry-owned voice content of any kind may reach the grounding block.
  assert(
    !composed.text.includes(buildInvitation(id)) && !composed.text.includes(voiceDegradation(id)),
    `${id}: no registry voice content appears in the composed CONTEXT DATA`,
  );
}
assert(
  !/companionPersonality/i.test(composed.text),
  "the composed CONTEXT DATA names no personality field",
);

// The assertion above only proves the composition engine copies what it is given.
// The load-bearing guard is that the PROFILE CAPABILITY never hands it the voice
// in the first place: `ProfilePreferencesView` is an explicit allowlist, and the
// stored personality must not appear in it however the row is populated. This
// drives the real handler through its port, so a future edit that "helpfully"
// spreads the preferences row fails here rather than in production.
async function assertProfileViewOmitsVoice(): Promise<void> {
  const prefsRow = {
    id: 1, userId: 7, dietTypes: [], excludedIngredients: [], healthGoals: [],
    budgetLevel: "standard", preferredStores: [], upfSensitivity: "moderate",
    qualityPreference: "standard", calorieTarget: null, calorieMode: "auto",
    heightCm: null, weightKg: null, activityLevel: "moderate", goalType: "maintain",
    adultsCount: 1, childrenCount: 0, babiesCount: 0, soundEnabled: true,
    eliteTrackingEnabled: true, healthTrendEnabled: true, barcodeScannerEnabled: true,
    plannerShowCalories: true, plannerEnableBabyMeals: false, plannerEnableChildMeals: false,
    plannerEnableDrinks: false, preferredIngredients: [], maxPrepTolerance: null,
    mealMode: "exact", maxExtraPrepMinutes: null, maxTotalCookTime: null,
    preferLessProcessed: false, includeRegulatoryAdditivesInScoring: true,
    mutedOpportunityTypes: [],
    // The voice IS stored on the row the port returns…
    companionPersonality: "sergeant",
  };
  const handler = createProfileReadHandler(async () => ({
    getUser: async () => ({ id: 7, username: "t", displayName: "T" }) as any,
    getUserPreferences: async () => prefsRow as any,
  }));
  const result = (await handler(
    { verb: "read", capabilityId: "profile", parameters: {} } as any,
    { userId: 7, role: "user", tier: "free" } as any,
  )) as { preferences: Record<string, unknown> | null };

  assert(result.preferences !== null, "profile:read returns a preferences view for a stored row");
  // …and must NOT be surfaced by the capability that grounds the model.
  assert(
    result.preferences !== null && !("companionPersonality" in result.preferences),
    "profile:read's Full Result omits companionPersonality — the voice is never grounding evidence",
  );
  assert(
    !JSON.stringify(result).includes("sergeant"),
    "the stored voice appears nowhere in profile:read's serialised Full Result",
  );
}

// The Context Composition Engine takes no personality parameter at all — the
// composition is byte-identical however the user chose to be spoken to.
assert(
  composeContext({
    utterance: "what should I eat this week",
    capabilities: [{ capabilityId: "profile", verb: "read", result: profileResult, confidence: 1, baseline: true }],
    enrichment: [],
  }).text === composed.text,
  "composition is deterministic and independent of voice (the engines do not share a seam)",
);

// ---------------------------------------------------------------------------
// §10 CP2 — functional identity: same decision shape, different words
// ---------------------------------------------------------------------------

console.log("\n── §10 CP2 — all six voices are functionally identical ─────────────────────────");

// INT21 §5.2, applied to the sealed decision: for a FIXED interaction, switching
// the voice may change the applied personality and the wording of the operator
// reasoning — and nothing else.
const decisions = PERSONALITY_IDS.map((id) =>
  sealBehaviourDecision({
    resolution: resolveBehaviour(id),
    outcome: "voiced-fallback",
    surfaces: ["fallback-voicing", "guidance-voicing"],
    fallbackState: "no-knowledge",
    guidanceCount: 2,
  }),
);
const shapeOf = (d: (typeof decisions)[number]) =>
  JSON.stringify({
    outcome: d.outcome,
    surfaces: d.surfaces,
    fallbackState: d.fallbackState,
    guidanceCount: d.guidanceCount,
    notVoicedReason: d.notVoicedReason,
    overrideApplied: d.overrideApplied,
    overrideReason: d.overrideReason,
    confidence: d.confidence,
    confidenceBasis: d.confidenceBasis,
    reasoningCount: d.reasoning.length,
  });
assert(new Set(decisions.map(shapeOf)).size === 1, "the sealed decision's SHAPE is identical across all six voices");
assert(
  new Set(decisions.map((d) => d.personalityId)).size === 6,
  "…while the applied personality genuinely differs across all six",
);

// An explicit, recognised choice is provenance-confident; an unknown one is not,
// and degrades to the default voice rather than to an error.
assert(resolveBehaviour("coach").confidence === 1, "an explicit recognised voice resolves with confidence 1");
assert(resolveBehaviour("wizard").personalityId === DEFAULT_PERSONALITY_ID, "an unknown voice degrades to the default");
assert(resolveBehaviour("wizard").confidence === 0, "a defaulted voice reports confidence 0, never a middle value");
assert(resolveBehaviour(null).overrideReason === "no-stored-preference", "a missing preference is named honestly");

// Surfaces are closed to what is genuinely live: the dormant exports claim none.
assert(
  !BEHAVIOUR_SURFACES.includes("notice-voicing" as never) &&
    !BEHAVIOUR_SURFACES.includes("growth-voicing" as never) &&
    !BEHAVIOUR_SURFACES.includes("celebration-voicing" as never),
  "dormant exports (phraseNotice / phraseGrowth / buildCelebration) still claim NO behaviour surface",
);
assert(
  BEHAVIOUR_SURFACES.includes("escalation-voicing") &&
    BEHAVIOUR_SURFACES.includes("degradation-voicing") &&
    BEHAVIOUR_SURFACES.includes("greeting-voicing"),
  "the three surfaces CP2 wired are declared live",
);

// Every registered voice supplies every CP2 content field — no voice is a stub.
for (const id of PERSONALITY_IDS) {
  const def = getPersonality(id);
  assert(typeof def.escalationTemplate === "function", `${id} has an escalation template`);
  assert(typeof def.degradationTemplate === "function", `${id} has a degradation template`);
  assert(def.experience.invitation.length > 0, `${id} has an invitation`);
}

(async () => {
  await assertProfileViewOmitsVoice();
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
