/**
 * conversation-gateway.ts — INT18 Phase 1 / Phase 2 / INT24
 * ===========================================================
 * The Conversation Gateway is the SINGLE wiring point between a user utterance
 * and the 11 live read-only capability bindings. It:
 *
 *   1. Gets or creates the user's persistent conversation.
 *   2. Gets or opens the active thread (one per session — no per-navigation
 *      fragmentation, per INT18 Risk R6).
 *   3. Resolves prior entity refs for pronoun resolution.
 *   4. Assembles a ContextFrame (pointer IDs only, via context-frame-assembler).
 *   5. Records the user turn.
 *   6. Detects write intents → returns an honest gap without calling the LLM.
 *   7. Resolves typed intents via the injected IIntentResolver (INT24 Canonical
 *      Intent Engine), replacing the previous inline selectCapabilities routing.
 *   8. Queries those resolved intents via intelligencePlatform.handle(), using
 *      the verb and parameters supplied by the resolver (not hardcoded "read").
 *   9. Classifies unsuccessful turns into the four canonical states (INT35):
 *      no-route / no-knowledge / no-results / internal-error — responding with
 *      the honest state-specific message (and rephrase suggestions) instead of
 *      sending an empty context to the LLM. Unmatched/failed queries are logged
 *      (turn-fallback.ts) without user ids or capability data.
 *  10. Otherwise calls the injected ILlmProvider with the grounding context and
 *      bounded conversation history. The model may ONLY answer from the provided context.
 *  11. Records the assistant turn and returns structured TurnResult.
 *
 * HARD BOUNDARIES:
 *  - Write intents are rejected BEFORE any resolver call (INT18 Risk R4 / INT24).
 *  - The LLM receives data only from intelligencePlatform.handle() results —
 *    never raw storage reads and never data from outside the capability layer.
 *  - intelligencePlatform.contextFor() supplies IntelligenceContext; the gateway
 *    never constructs its own IntelligenceContext.
 *  - No business logic. No storage mutations. No duplicate planner/shopping logic.
 *  - EFSA / health-claim firewall is enforced in the system prompt (model told
 *    never to make medical claims or fabricate nutrition facts).
 *
 * LLM PROVIDER (Phase 2):
 *  - The gateway depends on ILlmProvider, not on OpenAI directly.
 *  - The production singleton uses createDefaultLlmProvider() (OpenAI when the
 *    key is present, NoOpProvider otherwise).
 *  - Tests inject any ILlmProvider implementation (e.g. a stub).
 *
 * INTENT RESOLVER (INT24):
 *  - The gateway depends on IIntentResolver, not on any pattern set directly.
 *  - The production singleton uses patternIntentResolver.
 *  - Tests inject any IIntentResolver implementation (stub or the real resolver).
 *
 * Run tests: npx tsx server/tests/test-intelligence-conversation-gateway.ts
 */

import { intelligencePlatform } from "../intelligence-platform.js";
import {
  DatabaseConversationStore,
  type IConversationStore,
  type ConversationSurface,
  type EntityRef,
  type NewConversationTurn,
} from "./conversation-store.js";
import {
  assembleContextFrame,
  serializeFrameRef,
  type SurfaceHints,
  type ContextFrame,
} from "./context-frame-assembler.js";
import {
  createDefaultLlmProvider,
  type ILlmProvider,
} from "./llm-provider.js";
import type {
  IIntentResolver,
  IntentResolutionHints,
  ResolvedIntent,
} from "../intent-resolver.js";
import { patternIntentResolver } from "../pattern-intent-resolver.js";
import {
  classifyTurn,
  describeQueried,
  formatSuggestions,
  isEmptySearchResult,
  logUnsuccessfulQuery,
  type QueriedIntentOutcome,
  type QueriedIntentStatus,
  type UnsuccessfulTurnState,
} from "./turn-fallback.js";
import {
  systemPromptFragment,
  voiceFallback,
  voiceGuidanceSuggestions,
  voiceEscalation,
  voiceDegradation,
  resolveBehaviour,
  sealBehaviourDecision,
  type BehaviourDecision,
  type BehaviourDecisionInput,
  type BehaviourResolution,
} from "./behaviour-engine.js";
import { storage } from "../../storage.js";
import {
  buildNativeDiscoveryResponse,
  type NativeDiscoveryResponse,
} from "./native-discovery.js";
import {
  buildGuidanceSuggestions,
  buildRecoverySuggestions,
  type GuidanceSuggestion,
} from "./companion-guidance.js";
import {
  buildEnrichment,
  MAX_ENRICHMENT_ITEMS,
  type CompanionEnrichmentItem,
} from "./companion-enrichment.js";
import { buildNutritionEnrichment } from "./nutrition-enrichment.js";
import { assembleKnowledge, type KnowledgePackage } from "./knowledge-assembly.js";
import { deriveFoodIntelligenceExplainFromUplift } from "./capability-composition.js";
import {
  deriveFoodContextQueries,
  toBaselineContextIntent,
} from "./food-intelligence-composition.js";
import type { UpliftMatchResult } from "../../lib/uplift-types.js";
import { buildHouseholdNutritionEnrichment } from "./household-nutrition-enrichment.js";
import {
  composeContext,
  CAPABILITY_CONTEXT_BUDGET_CHARS,
  CONTEXT_TOKEN_BUDGET,
} from "../context/context-composition-engine.js";
import { hasNativeContextView } from "../context/context-view.js";
import {
  companionFeedbackStore,
  type ICompanionFeedbackStore,
} from "./companion-feedback-store.js";
import {
  buildActionProposals,
  type CompanionActionProposalDraft,
} from "./companion-actions.js";
import {
  companionActionStore,
  type ICompanionActionStore,
} from "./companion-action-store.js";
import type { ConversationTurn, Conversation, ConversationThread, CompanionActionProposal } from "../../../shared/schema.js";
import type { Intent, IntelligenceContext, IntentOutcome, IntentVerb } from "../types.js";
import { recordObservation } from "../observation/observation-engine.js";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Public result types
// ---------------------------------------------------------------------------

export interface TurnResult {
  /** The recorded user turn. */
  readonly userTurn:       ConversationTurn;
  /** The recorded assistant turn. */
  readonly assistantTurn:  ConversationTurn;
  /** Plain-text assistant response surfaced to the UI. */
  readonly text:           string;
  /** Entity refs extracted from the response (pointer IDs only). */
  readonly entityRefs:     EntityRef[];
  /** Set when the gateway routed to the intelligence platform. */
  readonly outcome?:       IntentOutcome;
  /**
   * Native THA discovery responses (INT36) — one per discovery domain that
   * returned canonical THA entities. Each carries a summary, canonical THA
   * cards (linking to THA pages, never external URLs) and available actions.
   * Empty when the turn had no discovery results.
   */
  readonly discoveries:    NativeDiscoveryResponse[];
  /**
   * INT38/INT39 cross-domain guidance suggestions. On a SUCCESSFUL turn, a
   * small deterministic set of other Companion Card domains worth exploring
   * next (`guidanceKind: "next-step"`). On an UNSUCCESSFUL turn, INT39
   * alternative/recovery suggestions drawn from the capabilities the resolver
   * actually attempted this turn (`guidanceKind: "recovery"`), offered only
   * where the Capability Guidance Registry has something appropriate. Empty
   * when the turn had no guidance to offer either way.
   */
  readonly guidance:       GuidanceSuggestion[];
  /** Which of the two guidance modes `guidance` was generated in, when non-empty (INT39). */
  readonly guidanceKind?:  "next-step" | "recovery";
  /**
   * INT41 — capability-owned contextual enrichment for this turn (insights,
   * explanations, recommendations, educational content), automatically
   * consumed from the SAME capabilities that produced grounding data this
   * turn (the success signal `guidance` above also uses). Empty when no
   * source capability declared anything to add — an honest gap, not a
   * fabricated default. Never offered on an unsuccessful turn.
   */
  readonly enrichment:     CompanionEnrichmentItem[];
  /**
   * INT40 — Companion Action proposals for this turn, persisted and ready to be
   * confirmed via POST .../actions/:id/confirm. Empty when the turn had nothing
   * executable to propose (an honest gap, not a fabricated action). All proposals
   * on one turn share a single `workflowId` — even a single proposal is a
   * length-1 "workflow" (see companion-action-store.ts).
   */
  readonly actions:        CompanionActionProposal[];
  /**
   * The INT35 unsuccessful-turn state, when this turn did not succeed
   * (no-route / no-knowledge / no-results / internal-error). Undefined on a
   * successful turn. Surfaced (INT35B) so the live Companion and the
   * observability layer identify fallback turns consistently. Derived per turn,
   * never persisted — the assistant turn already stores its honest text.
   */
  readonly fallbackState?: UnsuccessfulTurnState;
  /** The conversation ID (stable per user). */
  readonly conversationId: number;
  /** The thread ID currently active. */
  readonly threadId:       number;
}

// ---------------------------------------------------------------------------
// Write-intent guard — honest gaps, no resolver call, no LLM call
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable action description when the utterance expresses a
 * write intent, or null when it appears to be a read/question.
 *
 * The check is intentionally conservative (false-negative is safer than
 * false-positive): an utterance we can't classify is assumed to be a read and
 * routed normally. The LLM system prompt further constrains it to answer from
 * provided context only, so undetected write attempts still receive a grounded
 * read response rather than a fabricated mutation.
 *
 * Runs BEFORE the intent resolver — write intents never reach resolution (INT24).
 */
export function detectWriteIntent(utterance: string): string | null {
  const l = utterance.toLowerCase();

  // INTQ8 P2 — advisory / exploratory guard. A genuine write intent is an
  // IMPERATIVE command ("add chicken to my list", "swap the salmon for cod").
  // Questions that merely ASK the Companion to reason about a possible change —
  // "which items could I swap for cheaper alternatives?", "what should I add to
  // the pantry?", "suggest a less processed swap for this product" — are READS:
  // they want advice, not a mutation, and must be routed to a capability and
  // answered, never refused as if they were commands (the pre-INTQ8 false
  // positive that gated three benchmark questions on G3). The guard fires only
  // when BOTH an interrogative/advisory frame AND a mutation verb are present,
  // so it never suppresses a plain imperative command (which carries no
  // advisory frame). Preserving the existing trust model: this only ever moves
  // an utterance from "write" to "read"; an undetected write still reaches the
  // read-only capability layer and the context-only LLM, which cannot fabricate
  // a mutation (see the conservative-by-design note above).
  const hasAdvisoryFrame =
    /\b(?:which|what|whats|what's|should\s+i|could\s+i|can\s+i|would\s+it|do\s+you\s+recommend|any\s+(?:ideas|suggestions)|is\s+there|are\s+there|suggest|recommend|ideas?\s+for)\b/.test(l);
  const hasMutationVerb =
    /\b(?:swap|substitute|replace|add|include|buy|get|use|stock|pick)\b/.test(l);
  if (hasAdvisoryFrame && hasMutationVerb) return null;

  if (/\b(add|put)\b.{0,40}\b(to|into)\b.{0,40}\b(planner|plan|week|shopping|basket|list|pantry)\b/.test(l))
    return "add items to the planner or shopping list";
  if (/\b(remove|delete|clear|wipe|drop)\b.{0,40}\b(meal|entry|item|plan|week|dinner|lunch|breakfast|recipe|ingredient)\b/.test(l))
    return "remove or delete items";
  if (/\b(delete|wipe|clear)\b/.test(l) && /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight)\b/.test(l))
    return "remove or delete items";
  if (/\b(move|shift|reschedule|drag)\b.{0,40}\b(meal|to|day|from)\b/.test(l))
    return "move meals in the planner";
  if (/\b(replace|swap|substitute)\b.{0,40}\b(meal|with|for)\b/.test(l))
    return "replace meals";
  if (/\b(create|make|generate|build)\b.{0,30}\b(plan|meal plan|week|shopping list)\b/.test(l))
    return "create a new plan or shopping list";
  if (/\b(update|edit|change|modify|set)\b.{0,30}\b(my.{0,15}(profile|preferences|diet|goal|name|target)|meal|plan)\b/.test(l))
    return "update your profile or plan settings";
  return null;
}

// ---------------------------------------------------------------------------
// Capability data querying (via intelligencePlatform only — no direct storage)
// ---------------------------------------------------------------------------

/**
 * INT17 — the gateway no longer decides what the model sees.
 *
 * The per-capability character ceiling and the turn's token budget both live with
 * the Context Composition Engine that spends them (`server/intelligence/context/`).
 * `CAP_DATA_MAX_CHARS` is retained here, at its unchanged value of 1,800, purely so
 * the constant this module has always exported keeps its name and meaning.
 *
 * What changed is ownership: the gateway used to serialise each capability's result
 * itself (`JSON.stringify(...).slice(0, 1800)`), which cut mid-object — handing the
 * model invalid JSON — and, on a priority-sorted payload, silently deleted every
 * group below the first. It now hands the Full Results to ONE engine and receives
 * ONE composed, budgeted, deterministic CONTEXT DATA block back.
 */
const CAP_DATA_MAX_CHARS = CAPABILITY_CONTEXT_BUDGET_CHARS;

/**
 * The single seam through which the gateway reaches the Intelligence Platform.
 * Production uses intelligencePlatform.handle; tests may inject a stub to
 * drive controlled outcomes through the full turn pipeline (INT35).
 */
export type HandleIntentFn = (
  intent: Intent,
  context: IntelligenceContext,
  // OBS2 — optional correlation context for the invocation observation the
  // Intent Engine records (telemetry only; injected test stubs may ignore it).
  options?: { observation?: { sessionId?: string; surface?: string; turnId?: string } },
) => Promise<IntentOutcome>;

const defaultHandleIntent: HandleIntentFn = (intent, context, options) =>
  intelligencePlatform.handle(intent, context, options);

/** The result of querying one resolved intent through the platform (INT35). */
interface CapabilityQueryResult {
  readonly status: QueriedIntentStatus;
  /**
   * INT17: the capability's serialised Full Result, present only for "ok-data".
   *
   * This is a PRESENCE MARKER and a payload for non-prompt consumers. It is NOT
   * what the model reads: the prompt's CONTEXT DATA block is composed from
   * `outcome.result` by the Context Composition Engine, once, for the whole turn.
   * Nothing here is truncated, because nothing here reaches the LLM.
   */
  readonly data: string | null;
  /** The platform's honest outcome, when one was produced (not for thrown faults). */
  readonly outcome?: IntentOutcome;
}

/**
 * Query a single resolved intent via the platform.
 *
 * INT24: verb and parameters come from the ResolvedIntent, not a hardcoded
 * "read" verb. INT35: instead of collapsing every non-ok into null, the
 * outcome is CLASSIFIED so the gateway can distinguish the four canonical
 * unsuccessful states — an empty search ("ok-empty"), an honest platform gap
 * ("no-knowledge"), and a genuine fault ("error") are no longer conflated.
 * A thrown error is still contained so one capability failure does not abort
 * the entire turn.
 */
async function queryCapability(
  intent: ResolvedIntent,
  identity: ReturnType<typeof intelligencePlatform.contextFor>,
  handleIntent: HandleIntentFn,
  // OBS2 — correlation for the invocation observation only; never read by routing.
  observation?: { sessionId?: string; surface?: string; turnId?: string },
): Promise<CapabilityQueryResult> {
  try {
    const outcome = await handleIntent(
      {
        verb:         intent.verb as IntentVerb,
        capabilityId: intent.capability,
        parameters:   { ...intent.parameters },
      },
      identity,
      observation ? { observation } : undefined,
    );
    if (outcome.status === "ok" && outcome.result != null) {
      if (intent.verb === "search" && isEmptySearchResult(outcome.result)) {
        return { status: "ok-empty", data: null, outcome };
      }
      // INT17: no truncation, no shaping, no decision about the prompt happens here.
      // `outcome.result` is carried untouched to the Context Composition Engine,
      // which is the single owner of what the model is shown.
      return { status: "ok-data", data: JSON.stringify(outcome.result), outcome };
    }
    // Honest structured non-ok from the platform: gap, not_executable,
    // unsupported_intent, unknown_capability, denied, confirmation_required.
    return { status: "no-knowledge", data: null, outcome };
  } catch (err) {
    console.error(
      `[ConversationGateway] capability "${intent.capability}" (${intent.verb}) failed:`,
      err,
    );
    return { status: "error", data: null };
  }
}

// ---------------------------------------------------------------------------
// LLM grounded response
// ---------------------------------------------------------------------------

/**
 * Build a grounded response for `utterance` using:
 *  - Canonical Intent Resolver (INT24) for typed intent → capability routing
 *  - Capability data assembled via intelligencePlatform.handle() (verb from resolver)
 *  - Bounded conversation history (last 5 prior turns)
 *  - The injected ILlmProvider constrained to answer from context only
 *
 * Returns: plain text + entity refs + optional platform outcome.
 */
async function buildGroundedResponse(
  utterance: string,
  frame: ContextFrame,
  recentHistory: ConversationTurn[],
  llmProvider: ILlmProvider,
  intentResolver: IIntentResolver,
  handleIntent: HandleIntentFn,
  // EWO2 — Companion Personality Platform: the user's stored voice choice,
  // read once per turn by the caller (never cached beyond this request, per
  // EWO1 §6). Changes WORDING at the seams below only — see behaviour-engine.ts.
  // BEH1 — it arrives as a resolved BehaviourResolution (voice + provenance),
  // so the one decision this turn is made once, by the engine, before any seam.
  behaviour: BehaviourResolution,
  // FI5 — the caller's own authenticated user id (already resolved by
  // processUserTurn), used ONLY to resolve their own household for the
  // household-nutrition enrichment below — never a client-suppliable id.
  userId: number,
  // OBS1 — correlation id for observation capture (the active thread id).
  // Telemetry-only: no behaviour reads it. Optional so existing test callers
  // are unchanged; absent means observations record without a session.
  sessionId?: string,
  // OBS2 — per-turn correlation id (the persisted user-turn id). Telemetry
  // only, like sessionId: every observation this turn emits carries it so the
  // Execution Timeline can group the turn's events exactly.
  turnId?: string,
): Promise<{
  text: string;
  entityRefs: EntityRef[];
  outcome?: IntentOutcome;
  discoveries: NativeDiscoveryResponse[];
  guidance: GuidanceSuggestion[];
  guidanceKind?: "next-step" | "recovery";
  /** INT41 — capability-owned contextual enrichment, empty on any unsuccessful turn. */
  enrichment: CompanionEnrichmentItem[];
  fallbackState?: UnsuccessfulTurnState;
  /** INT39 — the routed (non-baseline) capabilities this turn, for persisting on the assistant turn. */
  resolvedIntent: { capabilities: { capabilityId: string; verb: IntentVerb; status: QueriedIntentStatus }[] } | null;
  /** INT40 — unpersisted Companion Action proposals for this turn (persisted by the caller once the assistant turn id exists). */
  actionDrafts: CompanionActionProposalDraft[];
}> {

  // OBS1 — shared correlation fields for every observation this turn emits.
  // Capture is fire-and-forget and changes nothing about the turn.
  // OBS2 adds turnId so the Execution Timeline can group a turn exactly.
  const obs = { userId, sessionId, surface: frame.surface as string, turnId };

  // BEH1 — the voice this turn, decided once by the engine before any seam.
  const personalityId = behaviour.personalityId;

  /**
   * BEH1 — record the Companion's behaviour decision for this interaction.
   *
   * The Behaviour Engine seals the decision (pure); the GATEWAY records it,
   * because the Observation Engine's capture discipline forbids a pure module
   * from recording its own telemetry (Observation Engine §4 rule 4). Exactly
   * one of these fires per interaction, on every exit path.
   *
   * CP2: all five exit paths now VOICE. The two that BEH1 recorded honestly as
   * `not-voiced` (the write-intent refusal and the provider-unavailable copy)
   * are registry content in the user's register, so the gateway emits no
   * `not-voiced` decision at all. The outcome value survives in the engine's
   * vocabulary precisely so a future unvoiced surface must still declare
   * itself — see BEHAVIOUR_OUTCOMES.
   *
   * Severity mirrors the decision, never editorialises it: a fallback voiced
   * in the user's register is a healthy outcome (the recovery row already
   * carries the warning), so only a failed generation is a warning here.
   */
  const recordBehaviourDecision = (input: BehaviourDecisionInput): BehaviourDecision => {
    const decision = sealBehaviourDecision(input);
    recordObservation({
      kind: "behaviour-decision",
      severity: decision.outcome === "voiced-error" ? "warning" : "info",
      outcome: decision.outcome,
      confidence: decision.confidence,
      metadata: {
        personalityId: decision.personalityId,
        personalityName: decision.personalityName,
        requestedPersonality: decision.requestedPersonality,
        overrideApplied: decision.overrideApplied,
        overrideReason: decision.overrideReason,
        confidenceBasis: decision.confidenceBasis,
        surfaces: decision.surfaces,
        reasoning: decision.reasoning,
        fallbackState: decision.fallbackState,
        guidanceCount: decision.guidanceCount,
        notVoicedReason: decision.notVoicedReason,
      },
      ...obs,
    });
    return decision;
  };

  // Write-intent guard (INT18 Risk R4 / INT24) — honest gap, no resolver, no LLM
  const writeAction = detectWriteIntent(utterance);
  if (writeAction) {
    // OBS1: the refusal redirects the user to manual action — an escalation.
    recordObservation({
      kind: "escalation",
      severity: "info",
      outcome: "not_executable",
      recoveryPath: "manual-action-redirect",
      metadata: { reason: "write-intent-refusal", writeAction },
      ...obs,
    });
    // CP2: the refusal is now Personality Registry content, voiced in the
    // user's chosen register — the last of BEH1's two `not-voiced` gateway
    // paths to close. `writeAction` is detectWriteIntent's own closed-set
    // description, so the template fills a caller-verified slot and invents
    // nothing. WHICH utterances are writes, and that the platform refuses
    // them, is still decided above this line and is untouched by the voice.
    recordBehaviourDecision({
      resolution: behaviour,
      outcome: "voiced-escalation",
      surfaces: ["escalation-voicing"],
    });
    const text = voiceEscalation(personalityId, { action: writeAction });
    return {
      text,
      entityRefs: [],
      // INTQ8 P1: the write-intent refusal is a first-class HONEST GAP — the
      // Companion understood a mutation was requested and honestly declined
      // because the platform is read-only today. Surface it as a structured
      // `not_executable` IntentOutcome (an honest-gap status the scorer and the
      // observability layer already recognise) rather than an untagged turn that
      // downstream code cannot distinguish from a successful answer. This is the
      // correct layer for the signal: the refusal short-circuits BEFORE the
      // resolver runs, so there is no resolver-pipeline `fallbackState` to set —
      // the honest gap lives in the platform outcome vocabulary instead.
      outcome: {
        status: "not_executable",
        message: `Write intent ("${writeAction}") declined — the Companion is read-only today and proposes or refuses writes, never claims to have executed one.`,
      },
      discoveries: [],
      guidance: [],
      enrichment: [],
      resolvedIntent: null,
      actionDrafts: [],
    };
  }

  // Provider unavailable → graceful degradation (no API key configured)
  if (!llmProvider.isAvailable) {
    // CP2: the degradation copy is now registry content too. Whether a provider
    // exists is llm-provider.ts's fact, checked on the line above; the voice
    // only phrases it. Every voice embeds `notConfigured()` verbatim, so no
    // register can imply the assistant is merely busy rather than absent.
    recordBehaviourDecision({
      resolution: behaviour,
      outcome: "voiced-degradation",
      surfaces: ["degradation-voicing"],
    });
    return {
      text: voiceDegradation(personalityId),
      entityRefs: [],
      discoveries: [],
      guidance: [],
      enrichment: [],
      resolvedIntent: null,
      actionDrafts: [],
    };
  }

  // INT24: resolve typed intents via the Canonical Intent Engine (platform service)
  const hints: IntentResolutionHints = {
    surface:             frame.surface,
    temporalAnchor:      frame.temporalAnchor,
    currentFoodSlug:     frame.currentFoodSlug,
    activePlannerWeekId: frame.activePlannerWeekId,
    selectedMealId:      frame.selectedMealId,
  };
  const resolveStarted = Date.now();
  const resolvedIntents = await intentResolver.resolve(utterance, hints);

  // OBS1: observe the resolution itself — top routed intent + confidence.
  // No utterance is recorded (privacy rule: shapes and scores, not content).
  {
    const top = resolvedIntents[0];
    const gapKind = resolvedIntents.map((ri) => ri.gap?.kind).find((k) => k != null);
    recordObservation({
      kind: "intent-resolution",
      severity: "info",
      outcome: gapKind ?? "resolved",
      capability: top?.capability,
      verb: top?.verb,
      confidence: typeof top?.confidence === "number" ? top.confidence : undefined,
      durationMs: Date.now() - resolveStarted,
      metadata: {
        intentCount: resolvedIntents.length,
        routedCount: resolvedIntents.filter((ri) => !ri.gap && ri.baseline !== true).length,
      },
      ...obs,
    });
  }

  // Query each resolved intent through the platform (verb from resolver, not hardcoded).
  // INT35: per-intent outcomes are retained (not collapsed to null) so the turn can be
  // classified into the four canonical unsuccessful states when no data comes back.
  const queryResults = new Map<string, CapabilityQueryResult>();
  let queryable = resolvedIntents.filter(ri => !ri.gap);
  await Promise.all(
    queryable.map(async (ri) => {
      const result = await queryCapability(ri, frame.identity, handleIntent, obs);
      queryResults.set(ri.capability, result);
    }),
  );

  // INT42 — sequential composition: "help make this meal healthier" resolves
  // Meals + Uplift in parallel (the MEAL_HEALTHIER_COMPOUND matcher, step 0).
  // Uplift's own top suggestion, once computed, names a follow-up Food
  // Intelligence question ("why is <ingredient> grounded for <nutrient/
  // benefit>?") that could not be parameterised until Uplift's result
  // existed — capability-composition.ts decides whether that question is
  // worth asking (only when a grounded mapping exists; never a guess).
  // Skipped when this turn already resolved food-intelligence independently
  // (never overwrite a genuine, utterance-driven match with a derived one).
  const upliftResult = queryable.some(ri => ri.capability === "uplift") ? queryResults.get("uplift") : undefined;
  const alreadyQueriedFoodIntelligence = queryable.some(ri => ri.capability === "food-intelligence");
  if (upliftResult?.status === "ok-data" && !alreadyQueriedFoodIntelligence) {
    const upliftPayload = upliftResult.outcome?.result as { matches?: UpliftMatchResult[] } | undefined;
    const derived = upliftPayload?.matches
      ? deriveFoodIntelligenceExplainFromUplift(upliftPayload.matches)
      : null;
    if (derived) {
      const derivedIntent: ResolvedIntent = {
        capability: derived.capability,
        verb: derived.verb,
        parameters: derived.parameters,
        confidence: 0.75,
      };
      const result = await queryCapability(derivedIntent, frame.identity, handleIntent, obs);
      queryResults.set(derivedIntent.capability, result);
      queryable = [...queryable, derivedIntent];
    }
  }

  // INT50 — Food Intelligence composition: when this turn is grounded by a
  // food-knowledge capability (Food Intelligence, Nutrition Knowledge, Uplift,
  // Opportunity Delivery, Nutrition Discovery), derive the caller's OWN
  // household context reads — household dietary-context always; pantry /
  // planner (only with an active week in view) / shopping when the turn is
  // recommendation-shaped — so the answer is composed across the platform's
  // existing capabilities instead of a single source. Every derived query is
  // a registered (verb × capability) pair executed through the same
  // queryCapability seam; each is BASELINE (grounding-only, the profile
  // always-on vocabulary), so composition never counts as routing, never
  // flips turn classification, and never claims the primary outcome. A
  // capability the resolver already routed this turn is never re-queried
  // (the INT42 rule). See food-intelligence-composition.ts for the full
  // boundary statement.
  const composedContext = deriveFoodContextQueries(
    queryable.map((ri) => ({
      capability: ri.capability,
      verb: ri.verb as IntentVerb,
      baseline: ri.baseline === true,
      okData: queryResults.get(ri.capability)?.status === "ok-data",
    })),
    { activePlannerWeekId: frame.activePlannerWeekId },
  );
  if (composedContext.length > 0) {
    const derivedContextIntents = composedContext.map(toBaselineContextIntent);
    await Promise.all(
      derivedContextIntents.map(async (di) => {
        const result = await queryCapability(di, frame.identity, handleIntent, obs);
        queryResults.set(di.capability, result);
      }),
    );
    queryable = [...queryable, ...derivedContextIntents];
  }

  // INT35: describe every queried intent for classification + logging (deduplicated
  // per capability by the resolver, so the capability key is unique).
  const queried: QueriedIntentOutcome[] = queryable.map((ri) => {
    const result = queryResults.get(ri.capability);
    return {
      capability: ri.capability,
      verb:       ri.verb as IntentVerb,
      baseline:   ri.baseline === true,
      status:     result?.status ?? "error",
      message:    result?.outcome?.message,
      query:      typeof ri.parameters.query === "string" ? ri.parameters.query : undefined,
    };
  });

  // INT39: the routed (non-baseline) capabilities this turn, persisted on the
  // assistant turn as resolvedIntent — the "intent recognised" / "capability
  // executed" Goal Completion signal. Null when nothing was routed at all
  // (a pure no-route turn — baseline-only reads never count as understanding).
  const routedQueried = queried.filter(q => !q.baseline);
  const resolvedIntentPayload =
    routedQueried.length > 0
      ? { capabilities: routedQueried.map(q => ({ capabilityId: q.capability, verb: q.verb, status: q.status })) }
      : null;

  // INT35: the resolver had no utterance-derived route — log the unmatched query for
  // future matcher coverage, even when surface context still rescues this turn.
  const resolverUnmatched = resolvedIntents.some(ri => ri.gap?.kind === "unknown");
  if (resolverUnmatched) {
    logUnsuccessfulQuery({
      stage:     "resolver-unmatched",
      gapKind:   "unknown",
      surface:   frame.surface,
      utterance,
      intents:   queried.map(q => ({ capability: q.capability, verb: q.verb, status: q.status })),
    });
  }

  // OBS1: a clarification observation whenever the resolver surfaced a gap the
  // user will be asked to resolve — an unmatched utterance or an explicit
  // needs-clarification / ambiguous resolution.
  {
    const clarificationGap = resolvedIntents
      .map((ri) => ri.gap)
      .find((g) => g != null && (g.kind === "needs-clarification" || g.kind === "ambiguous"));
    if (resolverUnmatched || clarificationGap) {
      recordObservation({
        kind: "clarification",
        severity: "warning",
        outcome: clarificationGap?.kind ?? "unknown",
        metadata: {
          hasClarificationPrompt: Boolean(clarificationGap?.clarificationPrompt),
          queriedCapabilities: queried.map((q) => q.capability),
        },
        ...obs,
      });
    }
  }

  // INT38/INT39: cross-domain "Next Step" guidance — build early so it's available
  // for both success and failure paths (guidance is used on recovery path too).
  const successCapabilityIds: string[] = [];
  for (const ri of queryable) {
    if (ri.baseline === true) continue;
    if (queryResults.get(ri.capability)?.status !== "ok-data") continue;
    successCapabilityIds.push(ri.capability);
  }
  const baseGuidance = buildGuidanceSuggestions(successCapabilityIds);

  // INT36: extract discoveries early for Knowledge Assembly
  const discoveries: NativeDiscoveryResponse[] = [];
  for (const ri of queryable) {
    if (ri.baseline === true) continue;
    const outcome = queryResults.get(ri.capability)?.outcome;
    const native = buildNativeDiscoveryResponse(outcome?.result);
    if (native) discoveries.push(native);
  }

  // COMP5: Assemble complete knowledge context for this turn.
  // This stage orchestrates all available platform knowledge (Tiers 1–3)
  // and determines gap state AFTER searching, not before.
  const knowledgeStarted = Date.now();
  const knowledgePackage = await assembleKnowledge({
    queryResults,
    queried,
    contextFrame: frame,
    guidance: baseGuidance,
    discoveries,
    utterance,
    userId,
  });

  // OBS1: observe knowledge retrieval — grounded (canonical capability data)
  // vs honest gap. `sources` are the capabilities whose data grounds the turn.
  recordObservation({
    kind: "knowledge-retrieval",
    severity: knowledgePackage.gapState === null ? "info" : "warning",
    outcome: knowledgePackage.gapState === null ? "ok" : knowledgePackage.gapState,
    durationMs: Date.now() - knowledgeStarted,
    metadata: {
      sources: queried.filter((q) => q.status === "ok-data").map((q) => q.capability),
      queriedCount: queried.length,
      enrichmentCount: knowledgePackage.enrichments.length,
      // INT50 — which context reads the Food Intelligence composition seam
      // derived this turn, and the deterministic reason each was composed.
      // Telemetry only (nothing reads it back); explains every composition
      // decision to operators. Empty on every non-food turn.
      composedContext: composedContext.map((c) => ({
        capability: c.capability,
        reason: c.reason,
      })),
    },
    ...obs,
  });

  // INT35: classify the turn. A non-null state means NO routed capability produced
  // grounding data — respond with the honest state-specific message instead of
  // sending an empty context to the LLM (which produced the generic
  // "I don't have that information right now").
  const fallbackState = knowledgePackage.gapState;
  if (fallbackState !== null) {
    const clarificationPrompt = resolvedIntents
      .map(ri => ri.gap?.clarificationPrompt)
      .find(p => p && p.trim());
    const gapKind = resolvedIntents.map(ri => ri.gap?.kind).find((k): k is NonNullable<typeof k> => k != null);
    // EWO2: personality voices the SAME disclosure turn-fallback.ts classified —
    // describeQueried/formatSuggestions are turn-fallback.ts's own dynamic-fact
    // helpers, re-used verbatim so no personality template can invent what was
    // checked (EWO1 §5 invariant 5). COMP1 — Graceful Honest Gaps: the status
    // set is keyed to WHICH state fired, so "no-knowledge" names the area(s)
    // routed with an honest platform gap (not just "no-results" search areas)
    // — every fallback state can honestly say WHAT was checked, never just "no".
    const areaStatus: QueriedIntentStatus | null =
      fallbackState === "no-results" ? "ok-empty" : fallbackState === "no-knowledge" ? "no-knowledge" : null;
    const { areas: searchedAreas, query: searchedQuery } = areaStatus
      ? describeQueried(queried, [areaStatus])
      : { areas: undefined, query: undefined };
    const text = voiceFallback(fallbackState, personalityId, {
      suggestionExamples: formatSuggestions(frame.surface),
      searchedAreas,
      searchedQuery,
      clarificationPrompt,
    });
    logUnsuccessfulQuery({
      stage:     "turn-fallback",
      state:     fallbackState,
      gapKind,
      surface:   frame.surface,
      utterance,
      intents:   queried.map(q => ({ capability: q.capability, verb: q.verb, status: q.status })),
    });
    // Surface the first routed platform outcome for turn traceability (outcomeRef).
    const firstRoutedOutcome = queryable
      .filter(ri => ri.baseline !== true)
      .map(ri => queryResults.get(ri.capability)?.outcome)
      .find(o => o != null);
    // INT39: offer recovery/alternative suggestions from whichever capabilities the
    // resolver actually attempted this turn, even though none produced grounding
    // data. Reuses the same Capability Guidance Registry as the success path — an
    // honest "you could also try" when the platform has one, [] when it doesn't.
    const attemptedCapabilityIds = Array.from(new Set(routedQueried.map(q => q.capability)));
    // EWO2 Stage 3/4: personality reorders + relabels the SAME eligible
    // suggestions companion-guidance.ts already resolved — never a different set.
    const recoverySuggestions = voiceGuidanceSuggestions(buildRecoverySuggestions(attemptedCapabilityIds), personalityId);

    // OBS1: observe the recovery path taken for this fallback turn.
    // OBS2: personalityId is the behaviour (voice) that phrased the disclosure.
    recordObservation({
      kind: "recovery",
      severity: fallbackState === "internal-error" ? "error" : "warning",
      outcome: fallbackState,
      recoveryPath: recoverySuggestions.length > 0 ? "recovery-suggestions" : "honest-disclosure",
      metadata: {
        gapKind: gapKind ?? null,
        capabilities: attemptedCapabilityIds,
        personalityId,
      },
      ...obs,
    });

    // BEH1: the voice phrased the SAME disclosure turn-fallback.ts classified,
    // and reordered/relabelled the SAME recovery suggestions companion-guidance.ts
    // resolved. The tone fragment never ran — this path makes no LLM call.
    recordBehaviourDecision({
      resolution: behaviour,
      outcome: "voiced-fallback",
      surfaces: recoverySuggestions.length > 0
        ? ["fallback-voicing", "guidance-voicing"]
        : ["fallback-voicing"],
      fallbackState,
      guidanceCount: recoverySuggestions.length,
    });

    return {
      text,
      entityRefs: [],
      outcome: firstRoutedOutcome,
      discoveries: [],
      guidance: recoverySuggestions,
      guidanceKind: recoverySuggestions.length > 0 ? "recovery" : undefined,
      enrichment: [],
      fallbackState,
      resolvedIntent: resolvedIntentPayload,
      actionDrafts: [],
    };
  }

  // EWO2 Stage 3/4: personality reorders (by its own priority emphasis) and
  // relabels (cosmetic prefix only) the SAME eligible suggestions — never a
  // different target, domain, or capability than companion-guidance.ts resolved.
  const guidance = voiceGuidanceSuggestions(baseGuidance, personalityId);
  const guidanceKind: "next-step" | undefined = guidance.length > 0 ? "next-step" : undefined;

  // INT41: capability-owned contextual enrichment — the SAME success signal as
  // guidance above, additionally carrying each source's verb so a capability
  // can scope an item to only the verbs it is relevant for (see
  // companion-enrichment.ts). Deterministic, no LLM call, runs on the
  // SUCCESSFUL path only.
  const enrichmentSources = queryable
    .filter(ri => ri.baseline !== true && queryResults.get(ri.capability)?.status === "ok-data")
    .map(ri => ({ capabilityId: ri.capability, verb: ri.verb as IntentVerb }));
  const staticEnrichment = buildEnrichment(enrichmentSources);

  // NUT1: a second, narrowly-scoped enrichment source — composed HERE, at the
  // gateway, not inside nutrition-knowledge's own read-only handler (which must
  // never touch profile data — see its documented hard boundary). Reads only
  // data already fetched this turn: nutrition-knowledge's own result (for
  // curated per-food evidence context) and the always-on profile baseline
  // query's own result (the caller's own diet fields, for personal relevance).
  // Honest gap (adds nothing) when either source is missing, unsuccessful, or
  // has nothing genuinely relevant to say — see nutrition-enrichment.ts.
  const nutritionEnrichment = buildNutritionEnrichment(
    queryResults.get("nutrition-knowledge"),
    queryResults.get("profile"),
  );

  // FI5: household-nutrition enrichment — a third, narrowly-scoped source,
  // composed the same way as NUT1 above but against the caller's HOUSEHOLD
  // (planner familiarity + household hard restrictions) rather than their own
  // profile. Reuses resolveHouseholdSignal (FI3/FI4's own shared service) —
  // no new read path. See household-nutrition-enrichment.ts.
  const householdNutritionEnrichment = await buildHouseholdNutritionEnrichment(
    queryResults.get("nutrition-knowledge"),
    userId,
  );
  const enrichment = [...staticEnrichment, ...nutritionEnrichment, ...householdNutritionEnrichment].slice(
    0,
    MAX_ENRICHMENT_ITEMS,
  );

  // INT40: Companion Action proposals — built from the SAME discoveries just
  // assembled above, gated by executability, honest-gap on missing planner-day
  // context (see companion-actions.ts). Never persisted here — buildGroundedResponse
  // stays a pure read; the caller (processUserTurn) persists once the assistant
  // turn id exists.
  const actionDrafts = buildActionProposals(discoveries, {
    selectedPlannerDayId: frame.selectedPlannerDayId,
    selectedMealSlot: frame.selectedMealSlot,
  });

  // INTQ8 P1: surface the turn's PRIMARY platform outcome on the success path.
  // Before this, buildGroundedResponse only ever returned an `outcome` on the
  // unsuccessful (fallback) branch, so every genuinely successful, well-grounded
  // answer carried outcome=null — indistinguishable, to the scorer and to any
  // observability/guidance code keyed off TurnResult.outcome, from an un-routed
  // turn. The evidence needed to build it (`queryResults`) is already in scope.
  //
  // Selection rule: among the routed (non-baseline) capabilities that produced
  // grounding data this turn, prefer a domain-OWNING capability over its
  // discovery/search sibling (`*-discovery`) — the owning capability is the
  // Source-of-Truth owner of the data and the more useful signal to surface —
  // otherwise fall back to the highest-confidence match (queryable is already
  // ordered by the resolver's descending confidence).
  const successOutcomes = queryable
    .filter((ri) => ri.baseline !== true && queryResults.get(ri.capability)?.status === "ok-data")
    .map((ri) => queryResults.get(ri.capability)?.outcome)
    .filter((o): o is IntentOutcome => o != null);
  const primaryOutcome =
    successOutcomes.find((o) => o.capabilityId != null && !o.capabilityId.endsWith("-discovery")) ??
    successOutcomes[0];

  // INT17: THE ONE PLACE THE LLM'S GROUNDING CONTEXT IS ASSEMBLED.
  //
  // Every capability's Full Result and every COMP6 enrichment item goes to the
  // Context Composition Engine, which selects against the user's intent, balances
  // across contributing capabilities, removes duplicate evidence, preserves entity
  // ids and provenance, respects one token budget, and emits deterministic
  // structured context. The gateway no longer serialises, truncates, orders or
  // budgets anything — it hands over Full Results and receives a prompt block.
  //
  // Section order is the RESOLVER's order, not `queryResults`' Map insertion order.
  // That Map is populated inside `Promise.all`, i.e. in capability COMPLETION
  // order, so the pre-INT17 prompt varied run-to-run for identical inputs.
  const compositionStarted = Date.now();
  const composition = composeContext({
    utterance,
    capabilities: queryable
      .filter(ri => queryResults.get(ri.capability)?.status === "ok-data")
      .map(ri => ({
        capabilityId: ri.capability,
        verb:         ri.verb,
        result:       queryResults.get(ri.capability)!.outcome!.result,
        confidence:   typeof ri.confidence === "number" ? ri.confidence : 0,
        baseline:     ri.baseline === true,
      })),
    enrichment: enrichment.map(e => ({ title: e.title, body: e.body })),
    tokenBudget: CONTEXT_TOKEN_BUDGET,
    perCapabilityCharCeiling: CAP_DATA_MAX_CHARS,
  });

  // OBS1: observe the composition — the engine's own metrics, verbatim, plus
  // wall time. The Context Views used are the `${capabilityId}:${verb}` keys.
  //
  // NCV1: and which of them were NATIVE — declared by the payload's owner in the
  // Context View registry — rather than derived generically from the payload's
  // natural structure. The engine cannot tell the two apart (INT17 §2.1) and must
  // not: the question is asked HERE, at the capture point, of the registry that
  // owns the answer, and the result is telemetry that nothing reads back.
  //
  // `views` stays a plain string list, unchanged, because every operator surface
  // and every stored row already speaks it. `nativeViews` is a subset of it.
  const composedViews = composition.metrics.perCapability.map((pc) => ({
    key: `${pc.capabilityId}:${pc.verb}`,
    native: hasNativeContextView(pc.capabilityId, pc.verb),
  }));
  recordObservation({
    kind: "context-composition",
    severity: "info",
    outcome: composition.metrics.budgetExceeded ? "budget-exceeded" : "ok",
    durationMs: Date.now() - compositionStarted,
    metadata: {
      estimatedTokens: composition.metrics.estimatedTokens,
      tokenBudget: composition.metrics.tokenBudget,
      budgetExceeded: composition.metrics.budgetExceeded,
      sections: composition.metrics.sections,
      capabilitiesContributing: composition.metrics.capabilitiesContributing,
      capabilitiesRepresented: composition.metrics.capabilitiesRepresented,
      views: composedViews.map((v) => v.key),
      nativeViews: composedViews.filter((v) => v.native).map((v) => v.key),
      genericViews: composedViews.filter((v) => !v.native).map((v) => v.key),
    },
    ...obs,
  });

  const fullContextSections = composition.text;

  // The engine emits the reading instructions its own output actually needs, and
  // nothing more. A turn that withheld nothing, hoisted nothing and de-duplicated
  // nothing emits no note at all, and reads exactly the prompt it read before.
  const compactionNote = composition.formatNote ? `\n${composition.formatNote}` : "";

  // Bounded conversation history (last 5 prior turns, oldest-first)
  const historyLines = recentHistory
    .slice(-5)
    .map(t => `${t.role === "user" ? "User" : "Apple"}: ${t.utterance}`)
    .join("\n");

  // EWO2 Stage 4/Risk P1: the personality voice fragment is appended AFTER
  // every hard rule below, as its own clearly-labelled paragraph — never
  // interleaved with, prepended before, or allowed to replace rules 1–5.
  // It may only add tone words; the grounding/firewall/format rules are
  // identical for every personality (EWO1 §5 hard invariant).
  const systemPrompt =
`You are Apple, the health assistant inside The Healthy Apples (THA) meal-planning app.

HARD RULES — you must never break these:
1. Answer ONLY from the CONTEXT DATA provided below. Never invent, hallucinate, or assume facts not present in the context.
2. Nutrition and health: only state what is explicitly in the context. Never claim a food "helps with" or "is good for" any medical condition without a source. Never make medical diagnoses, treatment recommendations, or prescriptions.
3. If the specific detail asked for is not in the context, do NOT guess or invent it. Instead answer honestly in a full sentence: say what you DO have that is relevant, or state plainly that it isn't recorded yet (e.g. "You don't have a diet pattern recorded in your profile yet.") — never the bare phrase "I don't have that information right now" on its own, and never a fabricated fact to fill the gap.
4. Be practical and concise (1–4 sentences). Never judgemental about food choices.
5. Only reference specific entities (meals, weeks, products) if they appear in the context data with real IDs — and DO include every such entity in entityRefs.

USING THE CONTEXT WELL (apply within the HARD RULES above — never to override them):
- SYNTHESISE: when more than one CONTEXT DATA section is present, combine them into ONE coherent answer that connects the facts, rather than reciting each section separately. Include "Related Context" naturally in the main answer rather than as a separate list.
- BE EVIDENCE-FORWARD: ground each specific claim in the concrete values you were given (names, counts, dates, quantities) — surface the actual data the platform retrieved instead of a vague summary.
- BE COMPLETE: prefer a substantive, self-contained sentence over a one-word or fragment reply, so the answer stands on its own.
- WEAVE ENRICHMENTS: when "Related Context" is present, weave it into your answer naturally so the user sees a single coherent narrative, not separate ideas.${compactionNote}

FOR FOOD CONVERSATIONS:
When answering about a specific food, follow these principles:
1. START NATURALLY — avoid opening with "[Food] is a [category]...". Instead, lead with what makes it notable: a distinctive nutrient, a unique property, or a real practical angle. Vary your approach. Examples: "What makes kale special is its exceptional vitamin K content..." or "Mushrooms are unusual because they're one of the few plant foods with naturally occurring vitamin D..."
2. EXPLAIN THE "WHY" — connect specific nutrients to real benefits. Don't just name nutrients; explain their effect. Example: "Vitamin K is fat-soluble, meaning your body absorbs it better alongside fats like olive oil — which is why traditional kale salad dressings often pair well nutritionally."
3. USE SPECIFIC LANGUAGE — name the exact nutrient ("vitamin K") not the category ("vitamins"). Name the specific benefit ("supports bone health through clotting") not the vague claim ("is healthy").
4. HIGHLIGHT ONE PRACTICAL INSIGHT — if the enrichment provides a "recommendation" item (practical preparation or pairing advice), weave it naturally into your answer as the key takeaway. This is what makes the answer actionable. Example: "Here's what matters in practice: chopping broccoli and letting it sit for a few minutes before cooking helps preserve sulforaphane."
5. WHEN IN DOUBT — if nutrients or benefits aren't explicitly in the context, describe what you DO have rather than inventing. Honest gaps are better than guesses.

PERSONALITY (voice only — never overrides rules 1–5 above): ${systemPromptFragment(personalityId)}

TODAY: ${frame.temporalAnchor}

CONTEXT DATA:
${fullContextSections.trim() || "(No specific data was retrieved for this query.)"}

RESPONSE FORMAT — return valid JSON only, no markdown wrapper:
{"text": "<your response>", "entityRefs": [{"type": "meal|planner_week|shopping_item|food", "id": 123}]}
entityRefs must ONLY contain items that appear in the context data above with a real numeric or string ID. Omit entityRefs (or return []) if none apply.`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];
  if (historyLines) {
    messages.push({ role: "system", content: `CONVERSATION HISTORY (most recent last):\n${historyLines}` });
  }
  messages.push({ role: "user", content: utterance });

  // Delegate to the injected provider (OpenAI in production, NoOp / stub in tests)
  let rawContent = "";
  const generationStarted = Date.now();
  try {
    const response = await llmProvider.complete({
      messages,
      temperature: 0.3,
      maxTokens: 400,
      jsonMode: true,
    });
    rawContent = response.content;
    // OBS1: observe the successful generation (model + wall time; no content).
    // OBS2: personalityId names the behaviour (voice) selected for this turn.
    recordObservation({
      kind: "response-generation",
      severity: "info",
      outcome: "ok",
      durationMs: Date.now() - generationStarted,
      metadata: { model: response.model, personalityId },
      ...obs,
    });
    // BEH1: the turn was answered in the user's voice. Recorded once here
    // rather than at each return below, because both the parsed and the
    // raw-content return paths carry the same already-applied transforms.
    recordBehaviourDecision({
      resolution: behaviour,
      outcome: "voiced",
      surfaces: guidance.length > 0
        ? ["system-prompt-fragment", "guidance-voicing"]
        : ["system-prompt-fragment"],
      guidanceCount: guidance.length,
    });
  } catch (err) {
    console.error("[ConversationGateway] LLM call failed:", err);
    logUnsuccessfulQuery({
      stage:     "turn-fallback",
      state:     "internal-error",
      surface:   frame.surface,
      utterance,
      intents:   queried.map(q => ({ capability: q.capability, verb: q.verb, status: q.status })),
    });
    // OBS1: the failed generation and the recovery path it forced.
    recordObservation({
      kind: "response-generation",
      severity: "error",
      outcome: "error",
      durationMs: Date.now() - generationStarted,
      metadata: { model: llmProvider.modelName, personalityId },
      ...obs,
    });
    recordObservation({
      kind: "recovery",
      severity: "error",
      outcome: "internal-error",
      recoveryPath: "honest-disclosure",
      ...obs,
    });
    // BEH1: the tone fragment reached the model before it failed; the voice
    // then phrased the internal-error disclosure. Both surfaces genuinely ran.
    recordBehaviourDecision({
      resolution: behaviour,
      outcome: "voiced-error",
      surfaces: ["system-prompt-fragment", "fallback-voicing"],
      fallbackState: "internal-error",
    });
    return {
      text: voiceFallback("internal-error", personalityId, { suggestionExamples: "" }),
      entityRefs: [],
      discoveries: [],
      guidance: [],
      enrichment: [],
      fallbackState: "internal-error",
      resolvedIntent: resolvedIntentPayload,
      actionDrafts: [],
    };
  }

  // Parse JSON response with graceful fallback
  try {
    const parsed = JSON.parse(rawContent);
    const text =
      typeof parsed.text === "string" && parsed.text.trim()
        ? parsed.text.trim()
        : rawContent;
    const llmRefs: EntityRef[] = Array.isArray(parsed.entityRefs)
      ? parsed.entityRefs.filter(
          (r: unknown): r is EntityRef =>
            r != null &&
            typeof (r as EntityRef).type === "string" &&
            (r as EntityRef).id != null,
        )
      : [];
    return {
      text,
      entityRefs: mergeEntityRefs(llmRefs, discoveries),
      outcome: primaryOutcome,
      discoveries,
      guidance,
      guidanceKind,
      enrichment,
      resolvedIntent: resolvedIntentPayload,
      actionDrafts,
    };
  } catch {
    return {
      text: rawContent || "I couldn't generate a response. Please try again.",
      entityRefs: mergeEntityRefs([], discoveries),
      outcome: primaryOutcome,
      discoveries,
      guidance,
      guidanceKind,
      enrichment,
      resolvedIntent: resolvedIntentPayload,
      actionDrafts,
    };
  }
}

/**
 * Union the LLM-supplied entity refs with the canonical THA refs from native
 * discovery responses (INT36), deduplicated by type+id. This guarantees a
 * discovery turn carries canonical THA page refs even when the LLM omits them —
 * so meal-discovery links always open THA meal pages — and never introduces an
 * external URL (native discovery refs are canonical THA refs by construction).
 */
function mergeEntityRefs(
  llmRefs: EntityRef[],
  discoveries: NativeDiscoveryResponse[],
): EntityRef[] {
  const merged: EntityRef[] = [...llmRefs];
  const seen = new Set(llmRefs.map((r) => `${r.type}:${r.id}`));
  for (const d of discoveries) {
    for (const ref of d.entityRefs) {
      const key = `${ref.type}:${ref.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(ref);
      }
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// ConversationGateway
// ---------------------------------------------------------------------------

/**
 * The Conversation Gateway — orchestrates the full per-turn pipeline.
 * Instantiated with an IConversationStore so tests can inject an in-memory store.
 * Production code imports and uses the `conversationGateway` singleton.
 *
 * INT24: constructor accepts an optional IIntentResolver. Defaults to the
 * production patternIntentResolver singleton. Tests may inject a stub.
 *
 * INT35: constructor accepts an optional HandleIntentFn. Defaults to
 * intelligencePlatform.handle. Tests inject a stub to drive controlled
 * platform outcomes (ok / empty search / gap / fault) through the pipeline.
 *
 * INT38: constructor accepts an optional ICompanionFeedbackStore, used only to
 * best-effort record "shown" guidance events after the assistant turn is
 * persisted. Defaults to the production companionFeedbackStore singleton.
 * Tests inject an in-memory store.
 */
export class ConversationGateway {
  private readonly llmProvider: ILlmProvider;
  private readonly intentResolver: IIntentResolver;
  private readonly handleIntent: HandleIntentFn;
  private readonly feedbackStore: ICompanionFeedbackStore;
  private readonly actionStore: ICompanionActionStore;

  constructor(
    private readonly store: IConversationStore,
    llmProvider?: ILlmProvider,
    intentResolver?: IIntentResolver,
    handleIntent?: HandleIntentFn,
    feedbackStore?: ICompanionFeedbackStore,
    actionStore?: ICompanionActionStore,
  ) {
    this.llmProvider = llmProvider ?? createDefaultLlmProvider();
    this.intentResolver = intentResolver ?? patternIntentResolver;
    this.handleIntent = handleIntent ?? defaultHandleIntent;
    this.feedbackStore = feedbackStore ?? companionFeedbackStore;
    this.actionStore = actionStore ?? companionActionStore;
  }

  /**
   * Process one user utterance end-to-end:
   *   assemble context → record user turn → resolve intents → ground response → record assistant turn.
   *
   * Thread policy (Phase 1):
   *   - Reuse the active thread if one exists (no per-navigation fragmentation).
   *   - Open a new thread only when there is no active thread.
   */
  async processUserTurn(
    userId: number,
    utterance: string,
    surface: ConversationSurface,
    surfaceHints: SurfaceHints,
    intelligenceCtx: ReturnType<typeof intelligencePlatform.contextFor>,
  ): Promise<TurnResult> {
    // 1. Conversation + thread
    const conversation = await this.store.getOrCreateConversation(userId);
    let thread = await this.store.getActiveThread(conversation.id);
    if (!thread) {
      thread = await this.store.openThread(conversation.id, surface);
    }

    // EWO2 — Companion Personality Platform: read the user's stored voice
    // choice fresh, once per turn, from its one owner (user_preferences).
    // Never cached beyond this request, never written into a conversation
    // turn — mirrors how the Context Frame itself is re-read every turn
    // (EWO1 §6 non-duplication guarantee).
    //
    // BEH1 — the raw stored value goes to the Behaviour Engine, which is the
    // single owner of the decision "which voice speaks this interaction, and
    // do we actually know it is the one the user chose?". The gateway performs
    // the read (I/O); the engine performs the decision (pure).
    const prefs = await storage.getUserPreferences(userId);
    const behaviour = resolveBehaviour(prefs?.companionPersonality);

    // 2. Prior entity refs (pronoun resolution)
    const priorEntityRefs = await this.store.getLastEntityRefs(thread.id);

    // 3. Assemble context frame (pointers only)
    const frame = await assembleContextFrame(
      userId,
      surface,
      surfaceHints,
      priorEntityRefs,
      intelligenceCtx,
    );
    const frameRef = serializeFrameRef(frame);

    // 4. Record user turn
    const userTurnData: NewConversationTurn = {
      role: "user",
      surface,
      utterance,
      contextFrameRef: frameRef,
    };
    const userTurn = await this.store.appendTurn(thread.id, userTurnData);

    // 5. Build grounded response (using prior history, excluding just-appended user turn)
    const recentHistory = await this.store.getRecentTurns(thread.id, 7);
    const priorTurns = recentHistory.filter(t => t.id !== userTurn.id);
    const { text, entityRefs, outcome, discoveries, guidance, guidanceKind, enrichment, fallbackState, resolvedIntent, actionDrafts } =
      await buildGroundedResponse(
        utterance,
        frame,
        priorTurns,
        this.llmProvider,
        this.intentResolver,
        this.handleIntent,
        behaviour,
        userId,
        // OBS1: thread id as the observation correlation id (telemetry only).
        String(thread.id),
        // OBS2: the just-persisted user turn id as the per-turn correlation id,
        // so the Execution Timeline groups this turn's observations exactly.
        String(userTurn.id),
      );

    // 6. Record assistant turn. INT39: fallbackState and resolvedIntent are
    // persisted (previously ephemeral) — they are the durable Goal Completion
    // signal ("intent recognised" / "capability executed" / recovery-after-
    // failure) the dashboard reads back via listAssistantTurnGoalSignals().
    const assistantTurnData: NewConversationTurn = {
      role: "assistant",
      surface,
      utterance: text,
      contextFrameRef: frameRef,
      entityRefs,
      outcomeRef: outcome
        ? { status: outcome.status, message: outcome.message }
        : null,
      resolvedIntent,
      fallbackState: fallbackState ?? null,
    };
    const assistantTurn = await this.store.appendTurn(thread.id, assistantTurnData);

    // 6b. INT40: persist Companion Action proposals for this turn, all sharing one
    // workflowId (even a single proposal is a length-1 "workflow" — see
    // companion-action-store.ts). Wrapped so a persistence failure never fails the
    // turn itself — a Companion Action is an addition to a successful answer, not
    // a precondition of one.
    let actions: CompanionActionProposal[] = [];
    if (actionDrafts.length > 0) {
      try {
        actions = await this.actionStore.createProposals(assistantTurn.id, randomUUID(), actionDrafts);
      } catch (err) {
        console.error("[ConversationGateway] failed to persist Companion Action proposals:", err);
      }
    }

    // 7. INT38/INT39: best-effort record "shown" guidance events (next-step OR
    // recovery). Wrapped so an
    // analytics write can never fail the turn — guidance is advisory-only.
    if (guidance.length > 0) {
      try {
        await this.feedbackStore.recordGuidanceEvents(
          guidance.map((g) => ({
            conversationTurnId: assistantTurn.id,
            eventKind: "shown" as const,
            sourceDomain: g.sourceDomain,
            domain: g.domain,
            sourceCapabilityId: g.sourceCapabilityId,
            targetCapabilityId: g.targetCapabilityId,
            targetVerb: g.verb,
          })),
        );
      } catch (err) {
        console.error("[ConversationGateway] failed to record guidance-shown events:", err);
      }
    }

    return {
      userTurn,
      assistantTurn,
      text,
      entityRefs,
      outcome,
      discoveries,
      guidance,
      guidanceKind,
      enrichment,
      fallbackState,
      actions,
      conversationId: conversation.id,
      threadId: thread.id,
    };
  }

  /** Expose conversation + thread list for the GET /threads route. */
  async getConversationState(userId: number): Promise<{
    conversation: Conversation;
    threads: ConversationThread[];
  }> {
    const conversation = await this.store.getOrCreateConversation(userId);
    const threads = await this.store.listThreads(conversation.id);
    return { conversation, threads };
  }

  /** Expose recent turns for the GET /turns route. */
  async getRecentTurns(
    userId: number,
    limit: number,
  ): Promise<{ turns: ConversationTurn[]; threadId: number | null }> {
    const conversation = await this.store.getOrCreateConversation(userId);
    const thread = await this.store.getActiveThread(conversation.id);
    if (!thread) return { turns: [], threadId: null };
    const turns = await this.store.getRecentTurns(thread.id, limit);
    return { turns, threadId: thread.id };
  }
}

// ---------------------------------------------------------------------------
// Canonical singleton
// ---------------------------------------------------------------------------

/**
 * The production singleton. Routes import this — do not construct a second
 * gateway. Tests instantiate ConversationGateway directly with an
 * InMemoryConversationStore (and optionally a resolver stub).
 */
export const conversationGateway = new ConversationGateway(
  new DatabaseConversationStore(),
);
