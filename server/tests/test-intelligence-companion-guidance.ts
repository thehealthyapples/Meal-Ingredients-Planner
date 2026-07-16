/**
 * test-intelligence-companion-guidance.ts — INT38
 * ==================================================
 * Tests for the Companion Guidance & Action Framework: the deterministic
 * cross-domain "Next Step" suggestion graph, the feedback/guidance-event
 * store, the dashboard analytics, and the gateway wiring that attaches
 * guidance to a successful turn and best-effort records "shown" events.
 *
 * Coverage:
 *   §1  buildGuidanceSuggestions — journey resolution, dedup, cap-at-2, gating
 *   §2  Gateway wiring — guidance attached only on success; "shown" events recorded
 *   §3  companion-feedback-store — feedback upsert-by-turn semantics
 *   §4  companion-feedback-store — guidance event recording + listing
 *   §5  companion-guidance-analytics — helpfulness / trend / top reasons
 *   §6  companion-guidance-analytics — task completion / journeys / abandonment / poor-feedback
 *   §7  privacy — no user/household id/utterance/parameters anywhere
 *   §8  advisory-only regression — feedback/guidance data has no path back into routing
 *   §9  getTurnOwner() — conversation-store additive method
 *
 * Run: npx tsx server/tests/test-intelligence-companion-guidance.ts
 */

import {
  buildGuidanceSuggestions,
  buildRecoverySuggestions,
  type CanExecuteFn,
  type GetCompanionDomainFn,
  type GetGuidanceFn,
} from "../intelligence/conversation/companion-guidance.js";
import { CapabilityRegistry } from "../intelligence/capability-registry.js";
import type { CapabilityGuidance } from "../intelligence/types.js";
import {
  InMemoryCompanionFeedbackStore,
} from "../intelligence/conversation/companion-feedback-store.js";
import {
  computeHelpfulness,
  computeFeedbackTrend,
  computeTopNegativeReasons,
  computeTaskCompletion,
  computeSuccessfulJourneys,
  computePoorFeedbackRecommendations,
  computeAbandonmentOpportunities,
} from "../intelligence/conversation/companion-guidance-analytics.js";
import {
  ConversationGateway,
  type HandleIntentFn,
} from "../intelligence/conversation/conversation-gateway.js";
import {
  InMemoryConversationStore,
  resetInMemoryIds,
} from "../intelligence/conversation/conversation-store.js";
import { patternIntentResolver } from "../intelligence/pattern-intent-resolver.js";
import type { IIntentResolver, ResolvedIntent } from "../intelligence/intent-resolver.js";
import type { ILlmProvider, LlmRequest, LlmResponse } from "../intelligence/conversation/llm-provider.js";
import type { IntelligenceContext, IntentOutcome } from "../intelligence/types.js";
import type { CompanionResponseFeedback, CompanionGuidanceEvent } from "../../shared/schema.js";

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
// Gateway stubs (mirror test-intelligence-companion-learning.ts)
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
// Fake row builders for analytics tests (no store needed — pure functions)
// ---------------------------------------------------------------------------

let clock = 0;
function ts(): Date {
  return new Date(Date.UTC(2026, 6, 2, 0, 0, clock++));
}

function feedbackRow(
  turnId: number,
  rating: "up" | "down",
  reasonCode?: string,
): CompanionResponseFeedback {
  const now = ts();
  return {
    id: turnId,
    conversationTurnId: turnId,
    rating,
    reasonCode: reasonCode ?? null,
    note: null,
    createdAt: now,
    updatedAt: now,
  } as unknown as CompanionResponseFeedback;
}

function eventRow(
  turnId: number,
  eventKind: "shown" | "clicked",
  sourceDomain: string,
  domain: string,
): CompanionGuidanceEvent {
  return {
    id: turnId * 100 + Math.floor(Math.random() * 100),
    conversationTurnId: turnId,
    eventKind,
    sourceDomain,
    domain,
    createdAt: ts(),
  } as unknown as CompanionGuidanceEvent;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// INT39 — a small, self-contained fake Capability Guidance Registry so §1 is
// isolated from the exact contents of the production capability-registry.ts
// seed (which is free to evolve). Mirrors the SHAPE of the real declarations.
// ---------------------------------------------------------------------------

const FAKE_GUIDANCE: Record<string, CapabilityGuidance> = {
  "nutrition-knowledge": {
    primaryAction: { capabilityId: "meals", verb: "read", label: "Find Matching Meals" },
    relatedActions: [{ capabilityId: "meal-discovery", verb: "search", label: "Search Meals by Nutrition" }],
    followUpActions: [{ capabilityId: "planner", verb: "read", label: "Plan This Week" }],
  },
  household: {
    primaryAction: { capabilityId: "planner", verb: "read", label: "Plan Around Preferences" },
  },
  diary: {
    primaryAction: { capabilityId: "nutrition-knowledge", verb: "read", label: "See Nutrition Insights" },
    followUpActions: [{ capabilityId: "planner", verb: "read", label: "Adjust This Week's Plan" }],
  },
  planner: {
    primaryAction: { capabilityId: "nutrition-knowledge", verb: "read", label: "Check Nutrition Balance" },
    relatedActions: [{ capabilityId: "household", verb: "read", label: "Check Household Preferences" }],
    followUpActions: [{ capabilityId: "shopping", verb: "read", label: "Build Shopping List" }],
  },
  shopping: {
    primaryAction: { capabilityId: "pantry", verb: "read", label: "Compare with Pantry" },
    relatedActions: [{ capabilityId: "partners", verb: "read", label: "Compare Supermarkets" }],
  },
};
const fakeGetGuidance: GetGuidanceFn = (id) => FAKE_GUIDANCE[id];

async function main(): Promise<void> {
  // ── §1 buildGuidanceSuggestions / buildRecoverySuggestions ───────────────
  section("§1 buildGuidanceSuggestions/buildRecoverySuggestions — registry resolution, dedup, cap, gating");
  {
    const allowAll: CanExecuteFn = () => true;

    const fromNutrition = buildGuidanceSuggestions(["nutrition-knowledge"], allowAll, fakeGetGuidance);
    assert(fromNutrition.length === 2, "nutrition-knowledge success yields exactly 2 suggestions (primary + follow-up; the related action collides with the primary's domain)");
    assert(fromNutrition.every((s) => s.sourceDomain === "nutrition"), "every suggestion records its source domain");
    assert(fromNutrition.every((s) => s.sourceCapabilityId === "nutrition-knowledge"), "every suggestion records its source capability id (INT39)");
    assert(fromNutrition.some((s) => s.domain === "meal" && s.targetCapabilityId === "meals" && s.verb === "read"), "nutrition-knowledge's declared primary action journeys towards meal");
    assert(fromNutrition.some((s) => s.domain === "planner" && s.targetCapabilityId === "planner"), "nutrition-knowledge's declared follow-up action journeys towards planner");

    const single = buildGuidanceSuggestions(["household"], allowAll, fakeGetGuidance);
    assert(single.length === 1, "household declares only a primary action — never fabricates a second");

    const dedup = buildGuidanceSuggestions(["nutrition-knowledge", "diary"], allowAll, fakeGetGuidance);
    const targets = dedup.map((s) => s.domain);
    assert(new Set(targets).size === targets.length, "no duplicate target domains even across multiple source capabilities");
    assert(dedup.length <= 2, "overall suggestions are still capped at 2 across multiple sources");

    const noneExecutable: CanExecuteFn = () => false;
    const gated = buildGuidanceSuggestions(["nutrition-knowledge"], noneExecutable, fakeGetGuidance);
    assert(gated.length === 0, "when no target capability is executable, guidance is silently empty — never fabricated");

    // A domain reachable via more than one capability (meal: meals OR meal-discovery)
    // is still offered through the alternative capability when only one is gapped —
    // an honest substitution, not a fabrication (a different real capability serves it).
    const blockMealsOnly: CanExecuteFn = (capabilityId) => capabilityId !== "meals";
    const substituted = buildGuidanceSuggestions(["nutrition-knowledge"], blockMealsOnly, fakeGetGuidance);
    assert(substituted.some((s) => s.domain === "meal" && s.targetCapabilityId === "meal-discovery"), "when the primary route to a domain is gapped, an alternative capability serving the same domain is still offered");

    // A domain reachable via only ONE capability disappears entirely when that
    // capability is gapped — omitted, never substituted with a fabricated route.
    const blockHousehold: CanExecuteFn = (capabilityId) => capabilityId !== "household";
    const householdGapped = buildGuidanceSuggestions(["planner"], blockHousehold, fakeGetGuidance);
    assert(!householdGapped.some((s) => s.domain === "household"), "a target domain reachable through only one gapped capability is omitted entirely");
    assert(householdGapped.some((s) => s.domain === "nutrition"), "other targets from the same source are unaffected by one gap");
    assert(householdGapped.some((s) => s.domain === "shopping"), "the follow-up target is still offered even though the related target was gapped");

    // CONV1 BEH-8 — the domain is read from the Capability Registry that owns it.
    // There is no CAPABILITY_DOMAIN table here any more to test against.
    const registry = new CapabilityRegistry();
    assert(registry.getCompanionDomain("planner-discovery") === "planner", "discovery capability ids map to the same domain as their base capability");
    assert(registry.getCompanionDomain("meals") === "meal", "base capability ids map to their Companion Card domain");

    // BEH-8 regression — the defect the parallel table caused. Every capability an
    // ordinary household can reach declares a Companion domain, so none can be
    // silently unreachable again. This assertion is the gate: register a
    // user-facing capability without a companionDomain and it fails here.
    const userReachable = registry.list().filter(
      (c) => c.availability !== "never" && c.permissions.minimumRole === "user" && c.permissions.knowledgeClass === "public",
    );
    const undeclared = userReachable.filter((c) => !c.companionDomain).map((c) => c.id);
    assert(undeclared.length === 0, `every user-reachable capability declares a Companion domain (undeclared: ${undeclared.join(", ") || "none"})`);

    // BEH-8 — and the exclusions are DECLARED, not forgotten. The admin and
    // developer planes must never be reachable from an ordinary Companion turn
    // (TIP1 §7). Giving either a companionDomain would be a privilege escalation.
    assert(registry.getCompanionDomain("administration") === undefined, "the admin plane declares no Companion domain — never reachable from an ordinary turn");
    assert(registry.getCompanionDomain("developer") === undefined, "the developer plane declares no Companion domain — physically isolated (TIP1 §7)");

    // BEH-8 — a cross-cutting platform capability may be attributed but never routed to.
    assert(registry.getCompanionDomain("food-intelligence") === "platform", "a capability owning zero business-domain data declares itself platform, not a room");
    assert(registry.isCompanionDestination("food-intelligence") === false, "a platform capability is never a Next Step destination — it has no landing page");
    assert(registry.isCompanionDestination("planner") === true, "a room is a destination");
    assert(registry.isCompanionDestination("administration") === false, "an unreachable capability is not a destination");

    // BEH-8 — the live defect, end to end: food-intelligence declares a guidance
    // block, and before BEH-8 the table's silence killed it outright.
    const fiDomain: GetCompanionDomainFn = (id) => new CapabilityRegistry().getCompanionDomain(id);
    const fiGuidance: GetGuidanceFn = (id) =>
      id === "food-intelligence"
        ? { primaryAction: { capabilityId: "planner", verb: "read", label: "Plan This Week" } }
        : undefined;
    const fiSuggestions = buildGuidanceSuggestions(["food-intelligence"], allowAll, fiGuidance, fiDomain);
    assert(fiSuggestions.length === 1, "a platform capability is a valid guidance SOURCE — its registered guidance block resolves");
    assert(fiSuggestions[0].domain === "planner", "a platform source routes to a real room");
    assert(fiSuggestions[0].sourceDomain === "platform", "and attributes itself honestly as platform, not as a room it does not own");

    // BEH-8 — the converse: a platform capability offered as a TARGET is refused.
    const platformTarget: GetGuidanceFn = (id) =>
      id === "planner"
        ? { primaryAction: { capabilityId: "evidence-learning", verb: "read", label: "See Patterns" } }
        : undefined;
    const noPlatformTarget = buildGuidanceSuggestions(["planner"], allowAll, platformTarget, fiDomain);
    assert(noPlatformTarget.length === 0, "a Next Step never routes to a platform capability — there is no page to land on");

    const noSelfLoop = buildGuidanceSuggestions(["planner", "shopping"], allowAll, fakeGetGuidance);
    assert(!noSelfLoop.some((s) => s.domain === "planner" || s.domain === "shopping"), "never re-suggests a domain already answered this turn");

    // Recovery mode — tries the lateral related action BEFORE the deeper primary
    // action (success mode does the opposite), and returns [] when the attempted
    // capability declares no guidance at all rather than fabricating one.
    const successFromPlanner = buildGuidanceSuggestions(["planner"], allowAll, fakeGetGuidance);
    assert(successFromPlanner[0]?.domain === "nutrition", "success mode tries the primary action before lateral related actions");

    const recoveryFromPlanner = buildRecoverySuggestions(["planner"], allowAll, fakeGetGuidance);
    assert(recoveryFromPlanner.length === 2, "recovery mode still respects the cap");
    assert(recoveryFromPlanner[0]?.domain === "household", "recovery mode tries the lateral related action before the deeper primary action");

    const noGuidanceDeclared = buildRecoverySuggestions(["meal-discovery"], allowAll, fakeGetGuidance);
    assert(noGuidanceDeclared.length === 0, "recovery returns no suggestions when the attempted capability declares no guidance — never fabricated");
  }

  // ── §2 Gateway wiring ─────────────────────────────────────────────────────
  section("§2 Gateway wiring — guidance attached only on success; shown events recorded");
  {
    resetInMemoryIds();
    const feedbackStore = new InMemoryCompanionFeedbackStore();
    const nutritionRead: ResolvedIntent = { capability: "nutrition-knowledge", verb: "read", parameters: {}, confidence: 1 };
    const gateway = new ConversationGateway(
      new InMemoryConversationStore(),
      new StubLlm(),
      new StubResolver([nutritionRead]),
      stubHandle({ "nutrition-knowledge": { status: "ok", capabilityId: "nutrition-knowledge", verb: "read", message: "ok", result: { foods: ["broccoli"] } } }),
      feedbackStore,
    );
    const result = await gateway.processUserTurn(1, "what is broccoli good for", "floating", {}, makeCtx());
    assert(result.guidance.length > 0, "a successful turn grounded in nutrition data carries guidance suggestions");
    assert(result.guidance.every((g) => g.sourceDomain === "nutrition"), "guidance is sourced from the domain that actually succeeded");

    const events = await feedbackStore.listGuidanceEvents();
    assert(events.length === result.guidance.length, "one 'shown' event is recorded per guidance suggestion");
    assert(events.every((e) => e.eventKind === "shown" && e.conversationTurnId === result.assistantTurn.id), "shown events reference the real assistant turn id");

    // Unsuccessful turn (resolver miss) — no guidance, no shown events.
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
    const failResult = await gateway2.processUserTurn(1, "wibble flurble", "floating", {}, makeCtx());
    assert(failResult.guidance.length === 0, "an unsuccessful (no-route) turn carries no guidance");
    assert((await feedbackStore2.listGuidanceEvents()).length === 0, "no shown events are recorded for an unsuccessful turn");
  }

  // ── §3 companion-feedback-store — feedback upsert ────────────────────────
  section("§3 companion-feedback-store — upsert-by-turn semantics");
  {
    const store = new InMemoryCompanionFeedbackStore();
    const first = await store.submitFeedback({ conversationTurnId: 501, rating: "up" });
    assert(first.rating === "up", "initial submission is stored");
    assert((await store.listFeedback()).length === 1, "one feedback row exists after the first submission");

    const second = await store.submitFeedback({ conversationTurnId: 501, rating: "down", reasonCode: "inaccurate" });
    assert(second.id === first.id, "resubmitting for the same turn overwrites, not appends (same row id)");
    assert(second.rating === "down" && second.reasonCode === "inaccurate", "the overwrite reflects the new rating and reason");
    assert((await store.listFeedback()).length === 1, "still exactly one feedback row after the overwrite");

    const forTurn = await store.getFeedbackForTurn(501);
    assert(forTurn?.rating === "down", "getFeedbackForTurn returns the latest rating");
    assert((await store.getFeedbackForTurn(999999)) === undefined, "a turn with no feedback returns undefined, not a throw");
  }

  // ── §4 companion-feedback-store — guidance events ────────────────────────
  section("§4 companion-feedback-store — guidance event recording + listing");
  {
    const store = new InMemoryCompanionFeedbackStore();
    const shown = await store.recordGuidanceEvents([
      { conversationTurnId: 10, eventKind: "shown", sourceDomain: "nutrition", domain: "meal" },
      { conversationTurnId: 10, eventKind: "shown", sourceDomain: "nutrition", domain: "planner" },
    ]);
    assert(shown.length === 2, "batch recordGuidanceEvents inserts every event");
    await store.recordGuidanceEvent({ conversationTurnId: 10, eventKind: "clicked", sourceDomain: "nutrition", domain: "meal" });

    const all = await store.listGuidanceEvents();
    assert(all.length === 3, "listGuidanceEvents returns every recorded event");
    assert(all.filter((e) => e.eventKind === "clicked").length === 1, "a click event is recorded distinctly from shown events");

    const emptyBatch = await store.recordGuidanceEvents([]);
    assert(emptyBatch.length === 0, "recording an empty batch is a safe no-op");
  }

  // ── §5 analytics — helpfulness / trend / negative reasons ───────────────
  section("§5 companion-guidance-analytics — helpfulness, trend, top negative reasons");
  {
    const noFeedback = computeHelpfulness([]);
    assert(noFeedback.rate === null, "zero feedback → honest null rate, not a fabricated 0%/100%");

    const feedback = [
      feedbackRow(1, "up"),
      feedbackRow(2, "up"),
      feedbackRow(3, "down", "inaccurate"),
      feedbackRow(4, "down", "inaccurate"),
      feedbackRow(5, "down", "not_relevant"),
    ];
    const helpfulness = computeHelpfulness(feedback);
    assert(helpfulness.rate === 0.4, "helpfulness rate = up / (up + down)");
    assert(helpfulness.totalUp === 2 && helpfulness.totalDown === 3, "totals are counted correctly");

    const reasons = computeTopNegativeReasons(feedback);
    assert(reasons[0].reasonCode === "inaccurate" && reasons[0].count === 2, "most common negative reason ranks first");
    assert(reasons.every((r) => r.count > 0), "no zero-count reason is ever surfaced");

    const trend = computeFeedbackTrend(feedback);
    assert(trend.length >= 1, "feedback trend produces at least one day bucket for same-day feedback");
    assert(trend.reduce((sum, b) => sum + b.up + b.down, 0) === feedback.length, "trend buckets account for every feedback row");
  }

  // ── §6 analytics — task completion / journeys / abandonment / poor feedback ──
  section("§6 companion-guidance-analytics — task completion, journeys, abandonment, poor feedback");
  {
    const noEvents = computeTaskCompletion([]);
    assert(noEvents.rate === null, "zero guidance events → honest null completion rate");

    const events: CompanionGuidanceEvent[] = [
      eventRow(1, "shown", "nutrition", "meal"),
      eventRow(1, "clicked", "nutrition", "meal"),
      eventRow(2, "shown", "nutrition", "meal"),
      eventRow(3, "shown", "nutrition", "planner"),
      eventRow(4, "shown", "nutrition", "planner"),
      eventRow(4, "clicked", "nutrition", "planner"),
    ];
    const completion = computeTaskCompletion(events);
    assert(completion.totalShown === 4 && completion.totalClicked === 2, "shown/clicked totals count every event of each kind");
    assert(completion.rate === 0.5, "completion rate = clicked / shown");

    const journeys = computeSuccessfulJourneys(events);
    assert(journeys.every((j) => j.clicked > 0), "successful journeys only include pairs with at least one completion");
    assert(journeys.some((j) => j.sourceDomain === "nutrition" && j.domain === "meal"), "a completed journey is surfaced");
    assert(!journeys.some((j) => j.sourceDomain === "nutrition" && j.domain === "planner" && j.clicked === 0), "a pair with zero clicks never appears as 'successful'");

    // Abandonment: shown often, rarely clicked, needs the minimum sample size.
    const abandonEvents: CompanionGuidanceEvent[] = [
      eventRow(10, "shown", "shopping", "pantry"),
      eventRow(11, "shown", "shopping", "pantry"),
      eventRow(12, "shown", "shopping", "pantry"),
      eventRow(13, "shown", "shopping", "pantry"),
    ];
    const abandonment = computeAbandonmentOpportunities(abandonEvents);
    assert(abandonment.some((a) => a.sourceDomain === "shopping" && a.domain === "pantry"), "a frequently-shown, never-clicked pair is flagged as an abandonment opportunity");

    const tooFewEvents: CompanionGuidanceEvent[] = [eventRow(20, "shown", "diary", "nutrition")];
    const tooFewAbandonment = computeAbandonmentOpportunities(tooFewEvents);
    assert(!tooFewAbandonment.some((a) => a.domain === "nutrition" && a.sourceDomain === "diary"), "a single shown event (below the sample-size floor) is not flagged as an abandonment opportunity");

    // Poor feedback: correlate a "down" turn's feedback with which suggestions were shown on it.
    const poorFeedback = [
      feedbackRow(101, "down", "not_relevant"),
      feedbackRow(102, "down", "not_relevant"),
      feedbackRow(103, "down", "not_relevant"),
      feedbackRow(104, "up"),
    ];
    const poorEvents: CompanionGuidanceEvent[] = [
      eventRow(101, "shown", "planner", "shopping"),
      eventRow(102, "shown", "planner", "shopping"),
      eventRow(103, "shown", "planner", "shopping"),
      eventRow(104, "shown", "planner", "shopping"),
    ];
    const poor = computePoorFeedbackRecommendations(poorFeedback, poorEvents);
    const row = poor.find((r) => r.sourceDomain === "planner" && r.domain === "shopping");
    assert(row !== undefined, "a suggestion shown on multiple down-voted turns is surfaced");
    assert(row?.shownCount === 4 && row?.downCount === 3, "shown/down counts are correlated correctly by turn id");
    assert(Math.abs((row?.downRate ?? 0) - 0.75) < 1e-9, "down rate = downCount / shownCount");
    assert(row?.reliable === true, "a sample of 4 meets the reliability floor");
  }

  // ── §7 privacy ────────────────────────────────────────────────────────────
  section("§7 privacy — no user/household identity, utterance, or parameters anywhere");
  {
    const store = new InMemoryCompanionFeedbackStore();
    const feedback = await store.submitFeedback({ conversationTurnId: 1, rating: "down", reasonCode: "inaccurate", note: "test note" });
    const feedbackJson = JSON.stringify(feedback);
    assert(!/userId|householdId|utterance|"parameters"|"result"/i.test(feedbackJson), "serialized feedback row has no user/household/utterance/parameters/result keys");

    const [event] = await store.recordGuidanceEvents([
      { conversationTurnId: 1, eventKind: "shown", sourceDomain: "nutrition", domain: "planner" },
    ]);
    const eventJson = JSON.stringify(event);
    assert(!/userId|householdId|utterance|"parameters"|"result"/i.test(eventJson), "serialized guidance event has no user/household/utterance/parameters/result keys");
  }

  // ── §8 advisory-only regression ───────────────────────────────────────────
  section("§8 advisory-only — feedback/guidance data has no path back into routing");
  {
    const utterances = ["what is broccoli good for", "what's on my shopping list", "meals this week"];
    const before = await Promise.all(utterances.map((u) => patternIntentResolver.resolve(u, { surface: "floating", temporalAnchor: "2026-07-02" })));

    // Submit a batch of feedback and guidance events through the new store —
    // this must be structurally incapable of influencing resolution.
    const store = new InMemoryCompanionFeedbackStore();
    for (let i = 0; i < 20; i++) {
      await store.submitFeedback({ conversationTurnId: i, rating: i % 2 === 0 ? "up" : "down", reasonCode: i % 2 === 0 ? undefined : "inaccurate" });
      await store.recordGuidanceEvent({ conversationTurnId: i, eventKind: "shown", sourceDomain: "nutrition", domain: "planner" });
    }

    const after = await Promise.all(utterances.map((u) => patternIntentResolver.resolve(u, { surface: "floating", temporalAnchor: "2026-07-02" })));
    assert(JSON.stringify(before) === JSON.stringify(after), "resolver output is byte-identical before/after feedback and guidance events are submitted — no code path exists from this data back into routing");
  }

  // ── §9 getTurnOwner() ──────────────────────────────────────────────────────
  section("§9 getTurnOwner — conversation-store additive ownership lookup");
  {
    resetInMemoryIds();
    const store = new InMemoryConversationStore();
    const conv = await store.getOrCreateConversation(77);
    const thread = await store.openThread(conv.id, "floating");
    const userTurn = await store.appendTurn(thread.id, { role: "user", surface: "floating", utterance: "hi" });
    const assistantTurn = await store.appendTurn(thread.id, { role: "assistant", surface: "floating", utterance: "hello" });

    const owner = await store.getTurnOwner(assistantTurn.id);
    assert(owner?.userId === 77, "getTurnOwner resolves the owning user id via thread → conversation");
    assert(owner?.role === "assistant", "getTurnOwner also returns the turn's role");

    const userOwner = await store.getTurnOwner(userTurn.id);
    assert(userOwner?.role === "user", "getTurnOwner correctly reports a user-role turn");

    const missing = await store.getTurnOwner(999999);
    assert(missing === null, "a non-existent turn id resolves to null, not a throw");
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
