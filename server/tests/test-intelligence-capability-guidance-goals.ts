/**
 * test-intelligence-capability-guidance-goals.ts — INT39
 * ==================================================================================
 * Tests for the Capability Guidance Registry (guidance declared ON capabilities,
 * not the Companion) and Goal Completion tracking (intent recognised → capability
 * executed → guidance presented → followed → completed / abandoned).
 *
 * Coverage:
 *   §1  Capability Guidance Registry — every declared guidance action/criterion
 *       in the production registry points at a real, registered capability+verb
 *       (no dangling or fabricated reference)
 *   §2  Gateway wiring — an unsuccessful (but recognised) turn offers recovery
 *       guidance from the Capability Guidance Registry; shown events carry
 *       capability identity
 *   §3  Persisted Goal Completion signal — fallbackState + resolvedIntent on
 *       conversation_turns (previously ephemeral, now durable)
 *   §4  companion-feedback-store — capability identity on guidance events
 *   §5  companion-goal-analytics — funnel, recovery-after-failure, action-level
 *       conversion, honest nulls, minimum-sample-size discipline
 *
 * Run: npx tsx server/tests/test-intelligence-capability-guidance-goals.ts
 */

import { intelligencePlatform } from "../intelligence/intelligence-platform.js";
import {
  buildGuidanceSuggestions,
  buildRecoverySuggestions,
} from "../intelligence/conversation/companion-guidance.js";
import {
  InMemoryCompanionFeedbackStore,
} from "../intelligence/conversation/companion-feedback-store.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  InMemoryConversationStore,
  resetInMemoryIds,
  type GoalSignalTurn,
} from "../intelligence/conversation/conversation-store.js";
import {
  computeGoalFunnel,
  computeRecoveryAfterFailure,
  computeHighestConvertingGuidanceActions,
  computeIgnoredGuidanceActions,
  isGoalCompletingClick,
  type GetCompletionCriteriaFn,
} from "../intelligence/conversation/companion-goal-analytics.js";
import type { IIntentResolver, ResolvedIntent } from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome, IntentVerb, CompletionCriterion } from "../intelligence/types.js";
import type { CompanionGuidanceEvent } from "../../shared/schema.js";

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
// Gateway stubs (mirror test-intelligence-companion-guidance.ts)
// ---------------------------------------------------------------------------

class StubLlm implements ILlmProvider {
  readonly modelName = "stub";
  readonly isAvailable = true;
  async complete(_request: LlmRequest): Promise<LlmResponse> {
    return { content: '{"text":"ok","entityRefs":[]}', model: this.modelName };
  }
}

class StubResolver implements IIntentResolver {
  constructor(private readonly results: ResolvedIntent[]) {}
  async resolve(): Promise<ResolvedIntent[]> {
    return this.results;
  }
}

function stubHandle(perCapability: Record<string, IntentOutcome>): HandleIntentFn {
  return async (intent) => {
    const o = perCapability[intent.capabilityId];
    if (o) return o;
    return { status: "gap", capabilityId: intent.capabilityId, verb: intent.verb, message: "no data" };
  };
}

function makeCtx(userId = 42): IntelligenceContext {
  return { role: "user", userId: String(userId), premium: false };
}

// ---------------------------------------------------------------------------
// Fixture builders for pure analytics tests
// ---------------------------------------------------------------------------

let clock = 0;
function ts(offsetSeconds = 0): Date {
  return new Date(Date.UTC(2026, 6, 2, 0, 0, clock++ + offsetSeconds));
}

function turnSignal(
  id: number,
  threadId: number,
  fallbackState: string | null,
  capabilities?: { capabilityId: string; verb: string; status: string }[],
): GoalSignalTurn {
  return {
    id,
    threadId,
    createdAt: ts(),
    fallbackState,
    resolvedIntent: capabilities ? { capabilities } : null,
  };
}

function eventRow(
  turnId: number,
  eventKind: "shown" | "clicked",
  sourceCapabilityId: string,
  targetCapabilityId: string,
  targetVerb: string,
): CompanionGuidanceEvent {
  return {
    id: turnId * 1000 + Math.floor(Math.random() * 1000),
    conversationTurnId: turnId,
    eventKind,
    sourceDomain: sourceCapabilityId,
    domain: targetCapabilityId,
    sourceCapabilityId,
    targetCapabilityId,
    targetVerb,
    createdAt: ts(),
  } as unknown as CompanionGuidanceEvent;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // ── §1 Capability Guidance Registry — honest declarations ────────────────
  section("§1 Capability Guidance Registry — every declared action is real, not fabricated");
  {
    const capabilitiesWithGuidance = [
      "nutrition-knowledge", "meals", "planner", "shopping", "pantry", "diary", "household",
    ];
    for (const capId of capabilitiesWithGuidance) {
      const guidance = intelligencePlatform.getGuidance(capId);
      assert(guidance !== undefined, `${capId} declares Capability Guidance Registry guidance`);

      const actions = [
        ...(guidance?.primaryAction ? [guidance.primaryAction] : []),
        ...(guidance?.relatedActions ?? []),
        ...(guidance?.followUpActions ?? []),
        ...(guidance?.recommendedJourneys ?? []),
      ];
      assert(actions.length > 0, `${capId} declares at least one guidance action`);

      for (const action of actions) {
        const targetCap = intelligencePlatform.getCapability(action.capabilityId);
        assert(targetCap !== undefined, `${capId}'s guidance action points at a registered capability ("${action.capabilityId}")`);
        assert(
          !!targetCap?.supportedIntents.includes(action.verb as IntentVerb),
          `${capId}'s guidance action verb "${action.verb}" is in ${action.capabilityId}'s declared supportedIntents`,
        );
      }

      for (const criterion of guidance?.completionCriteria ?? []) {
        const targetCap = intelligencePlatform.getCapability(criterion.satisfiedByAction.capabilityId);
        assert(targetCap !== undefined, `${capId}'s completion criterion points at a registered capability`);
      }
    }

    // Every guidance action used above resolves through a currently-executable
    // (capabilityId, verb) pair in production — proves the suggestions built
    // from these declarations will not silently disappear at gate-time.
    assert(intelligencePlatform.canExecute("meals", "read"), "sanity: meals/read is executable in production");
    assert(intelligencePlatform.canExecute("planner", "read"), "sanity: planner/read is executable in production");

    // A capability with no declared guidance returns undefined, not a fabricated default.
    assert(intelligencePlatform.getGuidance("administration") === undefined, "a capability with no declared guidance returns undefined, not a fabricated default");
  }

  // ── §2 Gateway wiring — recovery guidance on an unsuccessful turn ────────
  section("§2 Gateway wiring — recovery guidance offered from the capability the resolver actually attempted");
  {
    resetInMemoryIds();
    const feedbackStore = new InMemoryCompanionFeedbackStore();
    const plannerGap: ResolvedIntent = { capability: "planner", verb: "read", parameters: {}, confidence: 1 };
    const gateway = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([plannerGap]),
      stubHandle({ planner: { status: "gap", capabilityId: "planner", verb: "read", message: "no data" } }),
      feedbackStore,
    );
    const result = await gateway.processUserTurn(1, "what's happening with my plan", "floating", {}, makeCtx());

    assert(result.fallbackState === "no-knowledge", "a routed capability reporting an honest gap classifies as no-knowledge");
    assert(result.guidance.length > 0, "an unsuccessful turn with a recognised capability offers recovery guidance where the registry has one");
    assert(result.guidanceKind === "recovery", "the guidance is tagged as recovery, not next-step, on an unsuccessful turn");
    assert(result.guidance.every((g) => g.sourceDomain === "planner"), "recovery guidance is sourced from the capability the resolver actually attempted");

    const events = await feedbackStore.listGuidanceEvents();
    assert(events.length === result.guidance.length, "one 'shown' event is recorded per recovery suggestion");
    assert(events.every((e) => e.sourceCapabilityId === "planner"), "shown recovery events carry the source capability id (INT39)");
    assert(events.every((e) => !!e.targetCapabilityId && !!e.targetVerb), "shown recovery events carry the target capability id + verb (INT39)");

    // A genuine no-route turn (resolver produced nothing) has no capability to recover from.
    resetInMemoryIds();
    const feedbackStore2 = new InMemoryCompanionFeedbackStore();
    const miss: ResolvedIntent = { capability: "planner", verb: "read", parameters: {}, confidence: 0, gap: { kind: "unknown" } };
    const gateway2 = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([miss]),
      stubHandle({}),
      feedbackStore2,
    );
    const noRouteResult = await gateway2.processUserTurn(1, "wibble flurble", "floating", {}, makeCtx());
    assert(noRouteResult.fallbackState === "no-route", "an unmatched utterance classifies as no-route");
    assert(noRouteResult.guidance.length === 0, "a no-route turn has nothing routed to recover from — no recovery guidance");
  }

  // ── §3 Persisted Goal Completion signal ──────────────────────────────────
  section("§3 Persisted Goal Completion signal — fallbackState + resolvedIntent on conversation_turns");
  {
    resetInMemoryIds();
    const store = new InMemoryConversationStore();
    const feedbackStore = new InMemoryCompanionFeedbackStore();

    const successResolved: ResolvedIntent = { capability: "nutrition-knowledge", verb: "read", parameters: {}, confidence: 1 };
    const gatewaySuccess = new ConversationGateway(
      store, new StubLlm(), new StubResolver([successResolved]),
      stubHandle({ "nutrition-knowledge": { status: "ok", capabilityId: "nutrition-knowledge", verb: "read", message: "ok", result: { foods: ["broccoli"] } } }),
      feedbackStore,
    );
    await gatewaySuccess.processUserTurn(5, "what is broccoli good for", "floating", {}, makeCtx(5));

    const missResolved: ResolvedIntent = { capability: "planner", verb: "read", parameters: {}, confidence: 0, gap: { kind: "unknown" } };
    const gatewayMiss = new ConversationGateway(
      store, new StubLlm(), new StubResolver([missResolved]), stubHandle({}), feedbackStore,
    );
    await gatewayMiss.processUserTurn(5, "wibble", "floating", {}, makeCtx(5));

    const signals = await store.listAssistantTurnGoalSignals();
    assert(signals.length === 2, "both assistant turns persisted a Goal Completion signal");

    const successSignal = signals.find((s) => s.fallbackState === null);
    assert(successSignal !== undefined, "the successful turn's fallbackState is persisted as null");
    assert(successSignal?.resolvedIntent?.capabilities?.[0]?.capabilityId === "nutrition-knowledge", "the successful turn's resolvedIntent records the executed capability");
    assert(successSignal?.resolvedIntent?.capabilities?.[0]?.status === "ok-data", "the successful turn's resolvedIntent records an ok-data status");

    const noRouteSignal = signals.find((s) => s.fallbackState === "no-route");
    assert(noRouteSignal !== undefined, "the no-route turn's fallbackState is persisted");
    assert(noRouteSignal?.resolvedIntent === null, "a pure no-route turn persists a null resolvedIntent — nothing was routed, nothing is fabricated");
  }

  // ── §4 companion-feedback-store — capability identity on guidance events ─
  section("§4 companion-feedback-store — capability identity carried on guidance events");
  {
    const store = new InMemoryCompanionFeedbackStore();
    await store.recordGuidanceEvents([
      { conversationTurnId: 1, eventKind: "shown", sourceDomain: "nutrition", domain: "planner", sourceCapabilityId: "nutrition-knowledge", targetCapabilityId: "planner", targetVerb: "read" },
    ]);
    await store.recordGuidanceEvent({ conversationTurnId: 1, eventKind: "clicked", sourceDomain: "nutrition", domain: "planner", sourceCapabilityId: "nutrition-knowledge", targetCapabilityId: "planner", targetVerb: "read" });

    const events = await store.listGuidanceEvents();
    assert(events.length === 2, "both events are recorded");
    assert(events.every((e) => e.sourceCapabilityId === "nutrition-knowledge" && e.targetCapabilityId === "planner" && e.targetVerb === "read"), "capability identity round-trips through the store");

    // A pre-INT39-style event (no capability identity) is still accepted — additive, not breaking.
    const legacy = await store.recordGuidanceEvent({ conversationTurnId: 2, eventKind: "shown", sourceDomain: "meal", domain: "planner" });
    assert(legacy.sourceCapabilityId == null && legacy.targetCapabilityId == null, "an event submitted without capability identity is stored with it null, not fabricated");
  }

  // ── §5 companion-goal-analytics ───────────────────────────────────────────
  section("§5 companion-goal-analytics — funnel, recovery, action-level conversion");
  {
    const fakeCriteria: GetCompletionCriteriaFn = (capId): readonly CompletionCriterion[] =>
      capId === "nutrition-knowledge"
        ? [{ id: "x", description: "d", satisfiedByAction: { capabilityId: "planner", verb: "read", label: "Plan This Week" } }]
        : [];

    // isGoalCompletingClick
    assert(
      isGoalCompletingClick(
        { sourceCapabilityId: "nutrition-knowledge", targetCapabilityId: "planner", targetVerb: "read" },
        fakeCriteria,
      ),
      "a click matching the source capability's declared completion criterion is goal-completing",
    );
    assert(
      !isGoalCompletingClick(
        { sourceCapabilityId: "nutrition-knowledge", targetCapabilityId: "meals", targetVerb: "read" },
        fakeCriteria,
      ),
      "a click that does not match any declared completion criterion is not goal-completing",
    );
    assert(
      !isGoalCompletingClick({ sourceCapabilityId: null, targetCapabilityId: null, targetVerb: null }, fakeCriteria),
      "an event missing capability identity can never be classified as goal-completing",
    );

    // computeGoalFunnel — honest nulls
    const emptyFunnel = computeGoalFunnel([], [], fakeCriteria);
    assert(emptyFunnel.completionRate === null && emptyFunnel.abandonmentRate === null, "zero data → honest null rates, never fabricated 0%/100%");

    const turns: GoalSignalTurn[] = [
      turnSignal(1, 100, null, [{ capabilityId: "nutrition-knowledge", verb: "read", status: "ok-data" }]),
      turnSignal(2, 100, "no-route", undefined),
      turnSignal(3, 100, "no-knowledge", [{ capabilityId: "planner", verb: "read", status: "no-knowledge" }]),
    ];
    const events: CompanionGuidanceEvent[] = [
      eventRow(1, "shown", "nutrition-knowledge", "planner", "read"),
      eventRow(1, "clicked", "nutrition-knowledge", "planner", "read"),
      eventRow(1, "shown", "nutrition-knowledge", "meals", "read"),
      eventRow(1, "clicked", "nutrition-knowledge", "meals", "read"),
    ];
    const funnel = computeGoalFunnel(turns, events, fakeCriteria);
    assert(funnel.intentRecognised === 2, "intent recognised counts every turn with a routed (non-baseline) capability");
    assert(funnel.capabilityExecuted === 1, "capability executed counts only turns that succeeded (fallbackState null)");
    assert(funnel.guidancePresented === 2 && funnel.guidanceFollowed === 2, "presented/followed count shown/clicked events");
    assert(funnel.goalCompleted === 1, "only the click matching the declared completion criterion counts as completed");
    assert(funnel.completionRate === 0.5, "completion rate = goalCompleted / guidanceFollowed");
    assert(funnel.abandonmentRate === 0, "abandonment rate = (presented - followed) / presented");

    // computeRecoveryAfterFailure
    const emptyRecovery = computeRecoveryAfterFailure([]);
    assert(emptyRecovery.rate === null, "zero turns → honest null recovery rate");

    const recoveryTurns: GoalSignalTurn[] = [
      turnSignal(10, 1, "no-knowledge"), turnSignal(11, 1, null), // thread 1: failed then recovered
      turnSignal(20, 2, "no-results"),                            // thread 2: failed, no follow-up turn
      turnSignal(30, 3, "internal-error"), turnSignal(31, 3, "no-route"), // thread 3: failed, still failed (turn 31 is itself also a failed turn with no follow-up)
    ];
    const recovery = computeRecoveryAfterFailure(recoveryTurns);
    // Failed turns: 10, 20, 30, 31 (four) — every unsuccessful turn is counted, including
    // a failed turn that is itself the last turn in its thread (20 and 31).
    assert(recovery.totalFailed === 4, "every unsuccessful turn is counted as failed, including one with no follow-up of its own");
    assert(recovery.totalWithoutFollowUp === 2, "failed turns with no follow-up turn (20 and 31) are excluded from the rate, not counted as unrecovered");
    assert(recovery.totalRecovered === 1, "a failed turn followed by a successful turn in the same thread counts as recovered");
    assert(Math.abs((recovery.rate ?? 0) - 0.5) < 1e-9, "recovery rate = recovered / (failed - withoutFollowUp) = 1 / (4 - 2)");

    // computeHighestConvertingGuidanceActions / computeIgnoredGuidanceActions
    const actionEvents: CompanionGuidanceEvent[] = [
      eventRow(1, "shown", "planner", "shopping", "read"),
      eventRow(2, "shown", "planner", "shopping", "read"),
      eventRow(3, "shown", "planner", "shopping", "read"),
      eventRow(1, "clicked", "planner", "shopping", "read"),
      eventRow(2, "clicked", "planner", "shopping", "read"),
      eventRow(2, "clicked", "planner", "shopping", "read"),
      eventRow(4, "shown", "shopping", "pantry", "read"),
      eventRow(5, "shown", "shopping", "pantry", "read"),
      eventRow(6, "shown", "shopping", "pantry", "read"),
    ];
    const highConverting = computeHighestConvertingGuidanceActions(actionEvents);
    assert(highConverting[0]?.sourceCapabilityId === "planner" && highConverting[0]?.targetCapabilityId === "shopping", "the highest click-through action ranks first");
    assert(!highConverting.some((a) => a.targetCapabilityId === "pantry"), "a reliably-sampled action with zero clicks has no conversion to rank as highest-converting — it belongs in ignored instead");

    const ignored = computeIgnoredGuidanceActions(actionEvents);
    assert(ignored.some((a) => a.sourceCapabilityId === "shopping" && a.targetCapabilityId === "pantry"), "a reliably-sampled, never-clicked action is flagged as frequently ignored");
    assert(!ignored.some((a) => a.targetCapabilityId === "shopping"), "a well-converting action is never flagged as ignored");

    const tooFewSample: CompanionGuidanceEvent[] = [eventRow(1, "shown", "diary", "nutrition-knowledge", "read")];
    assert(computeIgnoredGuidanceActions(tooFewSample).length === 0, "an action below the minimum sample size is never flagged as ignored, even with zero clicks");
    assert(computeHighestConvertingGuidanceActions(tooFewSample).length === 0, "an action below the minimum sample size never ranks as highest-converting either");
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
