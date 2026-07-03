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
  buildFallbackText,
  classifyTurn,
  isEmptySearchResult,
  logUnsuccessfulQuery,
  type QueriedIntentOutcome,
  type QueriedIntentStatus,
  type UnsuccessfulTurnState,
} from "./turn-fallback.js";
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

const CAP_DATA_MAX_CHARS = 1_800;

/**
 * The single seam through which the gateway reaches the Intelligence Platform.
 * Production uses intelligencePlatform.handle; tests may inject a stub to
 * drive controlled outcomes through the full turn pipeline (INT35).
 */
export type HandleIntentFn = (
  intent: Intent,
  context: IntelligenceContext,
) => Promise<IntentOutcome>;

const defaultHandleIntent: HandleIntentFn = (intent, context) =>
  intelligencePlatform.handle(intent, context);

/** The result of querying one resolved intent through the platform (INT35). */
interface CapabilityQueryResult {
  readonly status: QueriedIntentStatus;
  /** JSON grounding data, present only for "ok-data". */
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
): Promise<CapabilityQueryResult> {
  try {
    const outcome = await handleIntent(
      {
        verb:         intent.verb as IntentVerb,
        capabilityId: intent.capability,
        parameters:   { ...intent.parameters },
      },
      identity,
    );
    if (outcome.status === "ok" && outcome.result != null) {
      if (intent.verb === "search" && isEmptySearchResult(outcome.result)) {
        return { status: "ok-empty", data: null, outcome };
      }
      const raw = JSON.stringify(outcome.result);
      const data = raw.length > CAP_DATA_MAX_CHARS
        ? raw.slice(0, CAP_DATA_MAX_CHARS) + "… [truncated]"
        : raw;
      return { status: "ok-data", data, outcome };
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

  // Write-intent guard (INT18 Risk R4 / INT24) — honest gap, no resolver, no LLM
  const writeAction = detectWriteIntent(utterance);
  if (writeAction) {
    return {
      text:
        `I can read and explain your data, but I can't ${writeAction} yet — ` +
        `that's coming in a future update. For now, make the change directly in ` +
        `the app and I can help you understand or review it afterwards.`,
      entityRefs: [],
      discoveries: [],
      guidance: [],
      enrichment: [],
      resolvedIntent: null,
      actionDrafts: [],
    };
  }

  // Provider unavailable → graceful degradation (no API key configured)
  if (!llmProvider.isAvailable) {
    return {
      text: "The AI assistant isn't available right now — it hasn't been configured yet.",
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
  const resolvedIntents = await intentResolver.resolve(utterance, hints);

  // Query each resolved intent through the platform (verb from resolver, not hardcoded).
  // INT35: per-intent outcomes are retained (not collapsed to null) so the turn can be
  // classified into the four canonical unsuccessful states when no data comes back.
  const capData: Record<string, string> = {};
  const queryResults = new Map<string, CapabilityQueryResult>();
  const queryable = resolvedIntents.filter(ri => !ri.gap);
  await Promise.all(
    queryable.map(async (ri) => {
      const result = await queryCapability(ri, frame.identity, handleIntent);
      queryResults.set(ri.capability, result);
      if (result.data) capData[ri.capability] = result.data;
    }),
  );

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

  // INT35: classify the turn. A non-null state means NO routed capability produced
  // grounding data — respond with the honest state-specific message instead of
  // sending an empty context to the LLM (which produced the generic
  // "I don't have that information right now").
  const fallbackState = classifyTurn(queried);
  if (fallbackState !== null) {
    const clarificationPrompt = resolvedIntents
      .map(ri => ri.gap?.clarificationPrompt)
      .find(p => p && p.trim());
    const gapKind = resolvedIntents.map(ri => ri.gap?.kind).find((k): k is NonNullable<typeof k> => k != null);
    const text = buildFallbackText(fallbackState, {
      surface: frame.surface,
      queried,
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
    const recoverySuggestions = buildRecoverySuggestions(attemptedCapabilityIds);
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

  // INT36: build native THA discovery responses from every discovery capability
  // that returned canonical THA entities. This runs on the SUCCESSFUL path only
  // (a non-null fallbackState above means no data came back). The LLM still
  // writes the natural-language summary and any coordinated multi-capability
  // answer (INT33); these structured cards + actions are attached ALONGSIDE it so
  // the turn as a whole follows the THA pattern — summary (text) + canonical
  // entities (discoveries[].entities) + actions (discoveries[].actions) — and
  // renders natively on Web, Mobile and future clients. Ordered to match the
  // resolver's intent order for deterministic output.
  const discoveries: NativeDiscoveryResponse[] = [];
  for (const ri of queryable) {
    if (ri.baseline === true) continue;
    const outcome = queryResults.get(ri.capability)?.outcome;
    const native = buildNativeDiscoveryResponse(outcome?.result);
    if (native) discoveries.push(native);
  }

  // INT38/INT39: cross-domain "Next Step" guidance, derived from the capabilities
  // that actually produced grounding data this turn (deterministic — no LLM
  // call), read from each capability's own declared guidance via the Capability
  // Guidance Registry. Runs on the SUCCESSFUL path only, matching discoveries above.
  const successCapabilityIds: string[] = [];
  for (const ri of queryable) {
    if (ri.baseline === true) continue;
    if (queryResults.get(ri.capability)?.status !== "ok-data") continue;
    successCapabilityIds.push(ri.capability);
  }
  const guidance = buildGuidanceSuggestions(successCapabilityIds);
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
  const enrichment = [...staticEnrichment, ...nutritionEnrichment].slice(0, MAX_ENRICHMENT_ITEMS);

  // INT40: Companion Action proposals — built from the SAME discoveries just
  // assembled above, gated by executability, honest-gap on missing planner-day
  // context (see companion-actions.ts). Never persisted here — buildGroundedResponse
  // stays a pure read; the caller (processUserTurn) persists once the assistant
  // turn id exists.
  const actionDrafts = buildActionProposals(discoveries, {
    selectedPlannerDayId: frame.selectedPlannerDayId,
    selectedMealSlot: frame.selectedMealSlot,
  });

  // Assemble context sections for the prompt
  const contextSections = Object.entries(capData)
    .map(([cap, data]) => `### ${cap}\n${data}`)
    .join("\n\n");

  // Bounded conversation history (last 5 prior turns, oldest-first)
  const historyLines = recentHistory
    .slice(-5)
    .map(t => `${t.role === "user" ? "User" : "Apple"}: ${t.utterance}`)
    .join("\n");

  const systemPrompt =
`You are Apple, the friendly health assistant inside The Healthy Apples (THA) meal-planning app.

HARD RULES — you must never break these:
1. Answer ONLY from the CONTEXT DATA provided below. Never invent, hallucinate, or assume facts not present in the context.
2. Nutrition and health: only state what is explicitly in the context. Never claim a food "helps with" or "is good for" any medical condition without a source. Never make medical diagnoses, treatment recommendations, or prescriptions.
3. If the context does not contain the answer, say "I don't have that information right now" — never guess.
4. Be warm, encouraging, practical, and concise (1–4 sentences). Never judgemental about food choices.
5. Only reference specific entities (meals, weeks, products) if they appear in the context data with real IDs.

TODAY: ${frame.temporalAnchor}

CONTEXT DATA:
${contextSections.trim() || "(No specific data was retrieved for this query.)"}

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
  try {
    const response = await llmProvider.complete({
      messages,
      temperature: 0.3,
      maxTokens: 400,
      jsonMode: true,
    });
    rawContent = response.content;
  } catch (err) {
    console.error("[ConversationGateway] LLM call failed:", err);
    logUnsuccessfulQuery({
      stage:     "turn-fallback",
      state:     "internal-error",
      surface:   frame.surface,
      utterance,
      intents:   queried.map(q => ({ capability: q.capability, verb: q.verb, status: q.status })),
    });
    return {
      text: buildFallbackText("internal-error"),
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
