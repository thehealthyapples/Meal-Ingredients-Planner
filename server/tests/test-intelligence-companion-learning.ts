/**
 * test-intelligence-companion-learning.ts — INT35C
 * ==================================================
 * Tests for Governed Companion Learning & Intelligence Dashboard. No live
 * database required — companion-learning-store.ts's InMemory implementation
 * and conversation-store.ts's InMemoryConversationStore stand in, same
 * discipline as the rest of the Intelligence test suite.
 *
 * Coverage:
 *   §1  gapKind — additive log field, populated correctly by the gateway
 *   §2  classifyGaps — resolver-gap vs clarification split
 *   §3  classifyGaps — capability-gap vs knowledge-gap vs platform-failure split
 *   §4  computeRateMetrics — honest "no data" state + rate math
 *   §5  companion-learning-store — snapshot recording + trend (0/1/2+ snapshots)
 *   §6  companion-learning-store — recommendation queue CRUD + review hard rule
 *   §7  generateAndQueueRecommendations — advisory-only guarantee, degraded paths
 *   §8  privacy — no user/household id anywhere in a snapshot or recommendation
 *   §9  countTurnsSince — accuracy across role/window filters
 *
 * Run: npx tsx server/tests/test-intelligence-companion-learning.ts
 */

import {
  classifyGaps,
  computeRateMetrics,
  type CompanionGapClassification,
} from "../intelligence/conversation/companion-gap-classifier.js";
import type { UnsuccessfulQueryLogEntry } from "../intelligence/conversation/turn-fallback.js";
import {
  InMemoryCompanionLearningStore,
  computeTrend,
  type NewRecommendation,
} from "../intelligence/conversation/companion-learning-store.js";
import {
  generateAndQueueRecommendations,
  suggestCapabilityImprovements,
} from "../intelligence/conversation/companion-learning-recommender.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  InMemoryConversationStore,
  resetInMemoryIds,
} from "../intelligence/conversation/conversation-store.js";
import { PatternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import type { IIntentResolver, IntentResolutionHints, ResolvedIntent } from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome } from "../intelligence/types.js";

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
    console.error(`  ✗ ${label}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ───────────────────────────────────────────`);
}

// ---------------------------------------------------------------------------
// Log builders
// ---------------------------------------------------------------------------

let clock = 0;
function ts(): string {
  return new Date(Date.UTC(2026, 6, 2, 0, 0, clock++)).toISOString();
}

function unmatched(
  utterance: string,
  gapKind?: UnsuccessfulQueryLogEntry["gapKind"],
  surface: UnsuccessfulQueryLogEntry["surface"] = "floating",
): UnsuccessfulQueryLogEntry {
  return { timestamp: ts(), stage: "resolver-unmatched", gapKind, surface, utterance, intents: [] };
}

function fallback(
  state: NonNullable<UnsuccessfulQueryLogEntry["state"]>,
  utterance: string,
  intents: UnsuccessfulQueryLogEntry["intents"] = [],
  surface: UnsuccessfulQueryLogEntry["surface"] = "floating",
  gapKind?: UnsuccessfulQueryLogEntry["gapKind"],
): UnsuccessfulQueryLogEntry {
  return { timestamp: ts(), stage: "turn-fallback", state, gapKind, surface, utterance, intents };
}

// ---------------------------------------------------------------------------
// Gateway stubs (mirror test-intelligence-observability.ts)
// ---------------------------------------------------------------------------

class StubLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable: boolean;
  calls = 0;
  constructor(
    private readonly reply: string = '{"suggestions":[],"recommendations":[]}',
    private readonly shouldThrow = false,
    available = true,
  ) {
    this.isAvailable = available;
  }
  async complete(_request: LlmRequest): Promise<LlmResponse> {
    this.calls++;
    if (this.shouldThrow) throw new Error("stub LLM failure");
    return { content: this.reply, model: this.modelName };
  }
}

class StubResolver implements IIntentResolver {
  constructor(private readonly results: ResolvedIntent[]) {}
  async resolve(): Promise<ResolvedIntent[]> {
    return this.results;
  }
}

function stubHandle(perCapability: Record<string, IntentOutcome | Error>): HandleIntentFn {
  return async (intent) => {
    const o = perCapability[intent.capabilityId];
    if (o instanceof Error) throw o;
    if (o) return o;
    return { status: "ok", capabilityId: intent.capabilityId, verb: intent.verb, message: "ok", result: { note: "default" } };
  };
}

function makeGateway(resolver: IIntentResolver, llm: ILlmProvider, handle: HandleIntentFn): ConversationGateway {
  resetInMemoryIds();
  return new ConversationGateway(new InMemoryConversationStore(), llm, resolver, handle);
}

function makeCtx(userId = 42): IntelligenceContext {
  return { role: "user", userId: String(userId), premium: false };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // ── §1 gapKind end-to-end ────────────────────────────────────────────────
  section("§1 gapKind — populated by the gateway, distinguishes clarification from unmatched");
  {
    const ambiguous: ResolvedIntent = {
      capability: "planner",
      verb: "read",
      parameters: {},
      confidence: 0,
      gap: { kind: "needs-clarification", clarificationPrompt: "Which week did you mean?" },
    };
    const gateway = makeGateway(new StubResolver([ambiguous]), new StubLlm(), stubHandle({}));
    const result = await gateway.processUserTurn(1, "meals this week", "floating", {}, makeCtx());
    assert(result.fallbackState === "no-route", "a clarification-needing turn is still classified no-route (unchanged INT35 behaviour)");
    assert(result.text === "Which week did you mean?", "the clarification prompt is surfaced verbatim (unchanged INT35 behaviour)");

    const unknown: ResolvedIntent = { capability: "planner", verb: "read", parameters: {}, confidence: 0, gap: { kind: "unknown" } };
    const gateway2 = makeGateway(new StubResolver([unknown]), new StubLlm(), stubHandle({}));
    const result2 = await gateway2.processUserTurn(1, "wibble flurble", "floating", {}, makeCtx());
    assert(result2.fallbackState === "no-route", "a genuine miss is also no-route");
  }

  // ── §2 classifyGaps — resolver-gap vs clarification ──────────────────────
  section("§2 classifyGaps — resolver-gap vs clarification split");
  {
    clock = 0;
    const log: UnsuccessfulQueryLogEntry[] = [
      unmatched("wibble flurble", "unknown"),
      fallback("no-route", "wibble flurble", [], "floating", "unknown"),
      fallback("no-route", "which week did you mean", [], "floating", "needs-clarification"),
      fallback("no-route", "did you mean chicken or beef", [], "floating", "ambiguous"),
      unmatched("book me a table", undefined), // no gapKind at all (legacy-shaped entry) → treated as resolver-gap
    ];
    const c = classifyGaps(log);
    assert(c.resolverGaps.some((g) => g.utterance === "wibble flurble"), "a genuine 'unknown' miss lands in resolverGaps");
    assert(c.resolverGaps.find((g) => g.utterance === "wibble flurble")?.count === 2, "resolverGaps groups the resolver-unmatched + no-route pair (both gapKind=unknown)");
    assert(c.clarifications.some((g) => g.utterance === "which week did you mean"), "needs-clarification lands in clarifications, not resolverGaps");
    assert(c.clarifications.some((g) => g.utterance === "did you mean chicken or beef"), "ambiguous lands in clarifications, not resolverGaps");
    assert(!c.resolverGaps.some((g) => g.utterance === "which week did you mean"), "clarification utterance is NOT double-counted into resolverGaps");
    assert(c.resolverGaps.some((g) => g.utterance === "book me a table"), "an entry with no gapKind defaults to resolverGaps (conservative — never hides a miss)");
    assert(c.counts.resolverGapCount === 3, "resolverGapCount sums resolverGaps group counts");
    assert(c.counts.clarificationCount === 2, "clarificationCount sums clarifications group counts");
  }

  // ── §3 classifyGaps — capability-gap / knowledge-gap / platform-failure ──
  section("§3 classifyGaps — capability-gap vs knowledge-gap vs platform-failure");
  {
    clock = 0;
    const log: UnsuccessfulQueryLogEntry[] = [
      // shopping/order is NOT executable (real recorded CapabilityGap) → capability-gap
      fallback("no-knowledge", "order my shopping", [{ capability: "shopping", verb: "order", status: "no-knowledge" }]),
      fallback("no-knowledge", "order my shopping again", [{ capability: "shopping", verb: "order", status: "no-knowledge" }]),
      // nutrition-knowledge/explain IS executable → a no-knowledge status here is a content gap
      fallback("no-knowledge", "tell me about zzz", [{ capability: "nutrition-knowledge", verb: "explain", status: "no-knowledge" }]),
      // meals/search IS executable → an error status here is a genuine fault
      fallback("internal-error", "boom", [{ capability: "meals", verb: "search", status: "error" }]),
    ];
    const c = classifyGaps(log);
    assert(c.capabilityGaps.some((g) => g.capability === "shopping" && g.verb === "order"), "non-executable (capability,verb) is classified as a capability-gap");
    assert(c.capabilityGaps.find((g) => g.capability === "shopping")?.count === 2, "capability-gap count reflects observed frequency");
    assert(!!c.capabilityGaps.find((g) => g.capability === "shopping")?.reason, "capability-gap carries the Capability Registry's own recorded reason");
    assert(c.knowledgeGaps.some((g) => g.capability === "nutrition-knowledge" && g.verb === "explain"), "executable capability with no-knowledge status is a knowledge-gap");
    assert(!c.capabilityGaps.some((g) => g.capability === "nutrition-knowledge"), "knowledge-gap is not double-counted as a capability-gap");
    assert(c.platformFailures.some((g) => g.capability === "meals" && g.verb === "search"), "executable capability with only an error status is a platform-failure");
    assert(c.counts.capabilityGapCount === 2 && c.counts.knowledgeGapCount === 1 && c.counts.platformFailureCount === 1, "counts sum correctly across all three buckets");
  }

  // ── §4 computeRateMetrics ─────────────────────────────────────────────────
  section("§4 computeRateMetrics — honest no-data state + rate math");
  {
    const classification: CompanionGapClassification = {
      resolverGaps: [], clarifications: [], capabilityGaps: [], knowledgeGaps: [], platformFailures: [],
      counts: { resolverGapCount: 0, clarificationCount: 0, capabilityGapCount: 0, knowledgeGapCount: 0, platformFailureCount: 0 },
    };
    const noData = computeRateMetrics(classification, 0);
    assert(noData.understandingRate === null && noData.successfulConversationRate === null && noData.clarificationRate === null, "zero turns → honest null rates, not fabricated 100%/0%");

    const withMisses: CompanionGapClassification = {
      ...classification,
      counts: { resolverGapCount: 5, clarificationCount: 10, capabilityGapCount: 5, knowledgeGapCount: 5, platformFailureCount: 5 },
    };
    const rates = computeRateMetrics(withMisses, 100);
    assert(rates.understandingRate === 0.95, "understandingRate = (100 - resolverGapCount) / totalTurns");
    assert(rates.totalUnsuccessfulTurns === 30, "totalUnsuccessfulTurns sums all five categories");
    assert(rates.successfulConversationRate === 0.7, "successfulConversationRate = (totalTurns - totalUnsuccessful) / totalTurns");
    assert(rates.clarificationRate === 0.1, "clarificationRate = clarificationCount / totalTurns");

    const overMissed = computeRateMetrics({ ...classification, counts: { ...withMisses.counts, resolverGapCount: 200 } }, 100);
    assert(overMissed.understandingRate === 0, "rates never go negative — clamped to [0,1]");
  }

  // ── §5 companion-learning-store — snapshots + trend ──────────────────────
  section("§5 companion-learning-store — snapshot recording + trend");
  {
    const store = new InMemoryCompanionLearningStore();
    const summary1 = { totalEvents: 3, windowStart: ts(), windowEnd: ts(), byStage: { "resolver-unmatched": 3, "turn-fallback": 0 }, byState: { "no-route": 0, "no-knowledge": 0, "no-results": 0, "internal-error": 0 }, bySurface: [], topUnmatchedUtterances: [{ utterance: "meal ideas", count: 3, surfaces: ["floating"] }], routingFailures: [] };
    const classification1: CompanionGapClassification = { resolverGaps: [], clarifications: [], capabilityGaps: [], knowledgeGaps: [], platformFailures: [], counts: { resolverGapCount: 3, clarificationCount: 0, capabilityGapCount: 0, knowledgeGapCount: 0, platformFailureCount: 0 } };

    const trendWithZero = computeTrend(await store.listHealthSnapshots());
    assert(trendWithZero.available === false, "zero snapshots → trend unavailable (honest, not fabricated)");

    const snap1 = await store.recordSnapshot({ totalTurns: 50, summary: summary1 as any, classification: classification1 });
    const trendWithOne = computeTrend(await store.listHealthSnapshots());
    assert(trendWithOne.available === false, "one snapshot → trend still unavailable (needs >=2)");

    const summary2 = { ...summary1, topUnmatchedUtterances: [{ utterance: "meal ideas", count: 8, surfaces: ["floating"] }, { utterance: "new gap phrase", count: 4, surfaces: ["floating"] }] };
    await store.recordSnapshot({ totalTurns: 60, summary: summary2 as any, classification: classification1 });
    const snapshots = await store.listHealthSnapshots();
    assert(snapshots.length === 2 && snapshots[0].totalTurns === 60, "listHealthSnapshots returns most-recent-first");

    const trend = computeTrend(snapshots);
    assert(trend.available === true, "two snapshots → trend available");
    const mealIdeasGrowth = trend.fastestGrowingGaps.find((g) => g.utterance === "meal ideas");
    assert(mealIdeasGrowth?.growth === 5, "growth = currentCount - previousCount for a persisting gap");
    const newGap = trend.fastestGrowingGaps.find((g) => g.utterance === "new gap phrase");
    assert(newGap?.previousCount === 0 && newGap?.growth === 4, "a brand-new gap has previousCount 0 and full growth");
    assert(trend.fastestGrowingGaps[0].growth >= trend.fastestGrowingGaps[trend.fastestGrowingGaps.length - 1].growth, "sorted by growth descending");
    assert(snap1.id !== undefined, "recorded snapshot has an id");
  }

  // ── §6 companion-learning-store — recommendation queue ───────────────────
  section("§6 companion-learning-store — recommendation queue CRUD + review hard rule");
  {
    const store = new InMemoryCompanionLearningStore();
    const items: NewRecommendation[] = [
      { snapshotId: 1, kind: "matcher", payload: { a: 1 }, rationale: "test matcher", confidence: "low" },
      { snapshotId: 1, kind: "capability", payload: { b: 2 }, rationale: "test capability", confidence: "medium" },
    ];
    const inserted = await store.insertRecommendations(items);
    assert(inserted.length === 2 && inserted.every((r) => r.status === "pending"), "every inserted recommendation starts pending");

    const pendingOnly = await store.listRecommendations({ status: "pending" });
    assert(pendingOnly.length === 2, "listRecommendations filters by status");
    const approvedOnly = await store.listRecommendations({ status: "approved" });
    assert(approvedOnly.length === 0, "no approved recommendations exist yet");

    const counts = await store.countRecommendationsByStatus();
    assert(counts.pending === 2 && counts.approved === 0, "countRecommendationsByStatus tallies correctly");

    const target = inserted[0];
    const reviewed = await store.reviewRecommendation(target.id, "approved", 99, "looks good");
    assert(reviewed?.status === "approved" && reviewed?.reviewedBy === 99 && reviewed?.reviewNotes === "looks good", "review writes status/reviewedBy/reviewNotes");
    assert(reviewed?.reviewedAt != null, "review stamps reviewedAt");
    assert(!!reviewed?.payload && (reviewed.payload as any).a === 1, "review does NOT alter the original payload (hard rule: status-only write)");
    assert(reviewed?.rationale === "test matcher", "review does NOT alter the rationale");
    assert(reviewed?.kind === "matcher", "review does NOT alter the kind");

    const missing = await store.reviewRecommendation(99999, "rejected", 1);
    assert(missing === undefined, "reviewing a non-existent id returns undefined, not a throw");
  }

  // ── §7 generateAndQueueRecommendations — advisory-only guarantee ─────────
  section("§7 generateAndQueueRecommendations — advisory-only, degraded paths");
  {
    // Seed the live INT35 log (module-level singleton) via the real gateway pipeline
    // so this exercises the true end-to-end wiring, same pattern as test-intelligence-observability.ts §7.
    const { resetUnsuccessfulQueryLog } = await import("../intelligence/conversation/turn-fallback.js");
    resetUnsuccessfulQueryLog();
    const miss: ResolvedIntent = { capability: "planner", verb: "read", parameters: {}, confidence: 0, gap: { kind: "unknown" } };
    const gateway = makeGateway(new StubResolver([miss]), new StubLlm(), stubHandle({}));
    await gateway.processUserTurn(1, "book me a flight", "floating", {}, makeCtx());

    const conversationStore = new InMemoryConversationStore();
    resetInMemoryIds();
    const conv = await conversationStore.getOrCreateConversation(7);
    const thread = await conversationStore.openThread(conv.id, "floating");
    for (let i = 0; i < 10; i++) {
      await conversationStore.appendTurn(thread.id, { role: "assistant", surface: "floating", utterance: `turn ${i}` });
    }

    const learningStore = new InMemoryCompanionLearningStore();

    // Provider unavailable → degrades to zero suggestions, never throws
    const unavailableLlm = new StubLlm(undefined, false, false);
    const degraded = await generateAndQueueRecommendations(unavailableLlm, conversationStore, learningStore);
    assert(degraded.matcherReport.available === false, "matcher report degrades gracefully when the provider is unavailable");
    assert(degraded.capabilityReport.available === true && degraded.capabilityReport.recommendations.length === 0, "capability report short-circuits to an empty, available result when there are no capability gaps to review (provider never consulted)");
    assert(degraded.snapshot.id !== undefined, "a snapshot is still recorded even when the provider is unavailable");
    assert(degraded.recommendations.every((r) => (r as any).applied !== true), "no recommendation ever carries applied:true (there is no such field/path)");
    assert(degraded.recommendations.every((r) => r.status === "pending"), "every generated recommendation starts pending");

    // Provider available with an empty backlog → zero suggestions, not fabricated ones
    resetUnsuccessfulQueryLog();
    const availableLlm = new StubLlm('{"suggestions":[],"recommendations":[]}');
    const emptyBacklogResult = await generateAndQueueRecommendations(availableLlm, conversationStore, learningStore);
    assert(emptyBacklogResult.matcherReport.suggestions.length === 0, "empty backlog → zero matcher suggestions");

    // suggestCapabilityImprovements never invents a pair outside its input
    const invented = new StubLlm('{"recommendations":[{"pair":"made-up::verb","summary":"x","acceptanceCriteria":[],"confidence":"high"}]}');
    const capResult = await suggestCapabilityImprovements(
      [{ capability: "shopping", verb: "order", statuses: ["no-knowledge"], count: 1 }],
      invented,
    );
    assert(capResult.recommendations.length === 0, "a capability recommendation naming a pair outside the input set is dropped");

    const unavailableCapResult = await suggestCapabilityImprovements(
      [{ capability: "shopping", verb: "order", statuses: ["no-knowledge"], count: 1 }],
      new StubLlm(undefined, false, false),
    );
    assert(unavailableCapResult.available === false && unavailableCapResult.recommendations.length === 0, "suggestCapabilityImprovements degrades when the provider is unavailable, given a non-empty backlog");
  }

  // ── §8 privacy — no user/household id anywhere ───────────────────────────
  section("§8 privacy — snapshots and recommendations carry no user identity");
  {
    const store = new InMemoryCompanionLearningStore();
    const summary = { totalEvents: 1, windowStart: ts(), windowEnd: ts(), byStage: { "resolver-unmatched": 1, "turn-fallback": 0 }, byState: { "no-route": 0, "no-knowledge": 0, "no-results": 0, "internal-error": 0 }, bySurface: [{ surface: "floating", count: 1 }], topUnmatchedUtterances: [{ utterance: "meal ideas", count: 1, surfaces: ["floating"] }], routingFailures: [] };
    const classification: CompanionGapClassification = { resolverGaps: [], clarifications: [], capabilityGaps: [{ capability: "shopping", verb: "order", statuses: ["no-knowledge"], count: 1, reason: "no endpoint" }], knowledgeGaps: [], platformFailures: [], counts: { resolverGapCount: 1, clarificationCount: 0, capabilityGapCount: 1, knowledgeGapCount: 0, platformFailureCount: 0 } };
    const snap = await store.recordSnapshot({ totalTurns: 20, summary: summary as any, classification });
    const snapJson = JSON.stringify(snap);
    assert(!/userId|householdId|"parameters"|"result"/i.test(snapJson), "serialized snapshot has no userId/householdId/parameters/result keys");

    const [rec] = await store.insertRecommendations([{ snapshotId: snap.id, kind: "capability", payload: { capability: "shopping", verb: "order" }, rationale: "no checkout endpoint", confidence: "low" }]);
    const recJson = JSON.stringify(rec);
    assert(!/userId|householdId/i.test(recJson), "serialized recommendation has no userId/householdId keys");
  }

  // ── §9 countTurnsSince ────────────────────────────────────────────────────
  section("§9 countTurnsSince — accuracy across role/window filters");
  {
    resetInMemoryIds();
    const store = new InMemoryConversationStore();
    const conv = await store.getOrCreateConversation(1);
    const thread = await store.openThread(conv.id, "floating");
    await store.appendTurn(thread.id, { role: "user", surface: "floating", utterance: "hi" });
    await store.appendTurn(thread.id, { role: "assistant", surface: "floating", utterance: "hello" });
    await store.appendTurn(thread.id, { role: "assistant", surface: "floating", utterance: "how can I help" });

    const allSince1970 = await store.countTurnsSince(new Date(0));
    assert(allSince1970 === 3, "no role filter counts every turn");
    const assistantOnly = await store.countTurnsSince(new Date(0), "assistant");
    assert(assistantOnly === 2, "role filter counts only matching-role turns");
    const future = await store.countTurnsSince(new Date(Date.now() + 60_000));
    assert(future === 0, "a future 'since' date counts nothing");
  }

  // ---------------------------------------------------------------------------
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFailed assertions:");
    failures.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
