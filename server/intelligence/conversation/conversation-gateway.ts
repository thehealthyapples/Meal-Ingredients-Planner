/**
 * conversation-gateway.ts — INT18 Phase 1 / Phase 2
 * ===================================================
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
 *   7. Selects relevant capabilities from the 11 live bindings based on surface
 *      and utterance keywords.
 *   8. Queries those capabilities via intelligencePlatform.handle() (read verb
 *      only) and assembles grounding context.
 *   9. Calls the injected ILlmProvider with the grounding context and bounded
 *      conversation history. The model may ONLY answer from the provided context.
 *  10. Records the assistant turn and returns structured TurnResult.
 *
 * HARD BOUNDARIES:
 *  - Write intents are rejected BEFORE any LLM call (INT18 Risk R4).
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
import type { ConversationTurn, Conversation, ConversationThread } from "../../../shared/schema.js";
import type { IntentOutcome } from "../types.js";

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
  /** The conversation ID (stable per user). */
  readonly conversationId: number;
  /** The thread ID currently active. */
  readonly threadId:       number;
}

// ---------------------------------------------------------------------------
// Write-intent guard — honest gaps, no LLM call for mutations
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
// Capability selection — surface + keyword routing
// ---------------------------------------------------------------------------

/**
 * The surface-to-capability primary map. Surfaces that have no direct
 * capability (e.g. "floating", "voice") default to profile only.
 */
const SURFACE_CAP: Partial<Record<ConversationSurface, string>> = {
  planner:   "planner",
  shopping:  "shopping",
  nutrition: "nutrition-knowledge",
  pantry:    "pantry",
  diary:     "diary",
  household: "household",
  meals:     "meals",
  templates: "templates",
  partners:  "partners",
  analyser:  "analyser",
};

/**
 * Select up to 4 capability IDs to query for this turn, based on surface and
 * keyword signals in the utterance. Profile is always included as it provides
 * personalisation context (name, diet, goals).
 *
 * Exported for unit-test coverage.
 */
export function selectCapabilities(
  utterance: string,
  surface: ConversationSurface,
): string[] {
  const l = utterance.toLowerCase();
  const caps = new Set<string>(["profile"]);

  const primary = SURFACE_CAP[surface];
  if (primary) caps.add(primary);

  if (/\b(planner|week|plan|schedule|meal.{0,10}week)\b/.test(l))          caps.add("planner");
  if (/\b(shop|basket|grocery|groceries|buy|list)\b/.test(l))              caps.add("shopping");
  if (/\b(pantry|fridge|freezer|larder|cupboard|stock)\b/.test(l))        caps.add("pantry");
  if (/\b(diary|log|logged|tracked|weight|mood|sleep|energy)\b/.test(l))  caps.add("diary");
  if (/\b(household|family|member|housemate|everyone)\b/.test(l))         caps.add("household");
  if (/\b(recipe|meal|cook|dish|ingredient)\b/.test(l))                   caps.add("meals");
  if (/\b(nutrients?|vitamins?|minerals?|nutrition|nutritional|benefit)\b/.test(l)) caps.add("nutrition-knowledge");
  if (/\b(template|templates)\b/.test(l))                                 caps.add("templates");
  if (/\b(additive|additives|e.?number|upf|ultra.processed|nova)\b/.test(l)) caps.add("analyser");
  if (/\b(retailer|retailers|supermarket|supermarkets)\b/.test(l))        caps.add("partners");

  // Hard cap at 4 to bound per-turn latency
  return Array.from(caps).slice(0, 4);
}

// ---------------------------------------------------------------------------
// Capability parameter builder
// ---------------------------------------------------------------------------

/**
 * Build the `parameters` object for a `read` intent against a given capability.
 * Handlers vary in what they expect — this maps the ContextFrame's pointers to
 * the handler's expected parameter shapes.
 */
function buildCapabilityParams(
  capId: string,
  frame: ContextFrame,
): Record<string, unknown> {
  switch (capId) {
    case "planner":
      if (frame.activePlannerWeekId != null) {
        return { scope: "week", weekId: frame.activePlannerWeekId };
      }
      return {};
    case "pantry":
      return { scope: "list" };
    case "diary":
      return { scope: "day", date: frame.temporalAnchor };
    case "meals":
      return { scope: "list" };
    case "nutrition-knowledge":
      if (frame.currentFoodSlug) return { scope: "food", slug: frame.currentFoodSlug };
      return { scope: "foods" };
    case "shopping":
      return { scope: "list" };
    case "household":
      return { scope: "household" };
    case "partners":
      return { scope: "retailers" };
    case "templates":
      return { scope: "plan-templates" };
    case "analyser":
      return { scope: "additives" };
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Capability data querying (via intelligencePlatform only — no direct storage)
// ---------------------------------------------------------------------------

const CAP_DATA_MAX_CHARS = 1_800;

/**
 * Query a single capability via intelligencePlatform.handle() and return its
 * result as a JSON string, or null if the capability returned a non-ok outcome.
 * Truncated to CAP_DATA_MAX_CHARS to prevent prompt bloat.
 *
 * Any thrown error is swallowed: one capability failure must not abort the turn.
 */
async function queryCapability(
  capId: string,
  frame: ContextFrame,
): Promise<string | null> {
  try {
    const params = buildCapabilityParams(capId, frame);
    const outcome = await intelligencePlatform.handle(
      { verb: "read", capabilityId: capId, parameters: params },
      frame.identity,
    );
    if (outcome.status === "ok" && outcome.result != null) {
      const raw = JSON.stringify(outcome.result);
      return raw.length > CAP_DATA_MAX_CHARS
        ? raw.slice(0, CAP_DATA_MAX_CHARS) + "… [truncated]"
        : raw;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// LLM grounded response
// ---------------------------------------------------------------------------

/**
 * Build a grounded response for `utterance` using:
 *  - assembled capability data from intelligencePlatform (read-only)
 *  - bounded conversation history (last 5 prior turns)
 *  - gpt-4o-mini constrained to answer from context only
 *
 * Returns: plain text + entity refs + optional platform outcome.
 */
async function buildGroundedResponse(
  utterance: string,
  frame: ContextFrame,
  recentHistory: ConversationTurn[],
  llmProvider: ILlmProvider,
): Promise<{ text: string; entityRefs: EntityRef[]; outcome?: IntentOutcome }> {

  // Write-intent guard (INT18 Risk R4) — honest gap, no LLM call
  const writeAction = detectWriteIntent(utterance);
  if (writeAction) {
    return {
      text:
        `I can read and explain your data, but I can't ${writeAction} yet — ` +
        `that's coming in a future update. For now, make the change directly in ` +
        `the app and I can help you understand or review it afterwards.`,
      entityRefs: [],
    };
  }

  // Provider unavailable → graceful degradation (no API key configured)
  if (!llmProvider.isAvailable) {
    return {
      text: "The AI assistant isn't available right now — it hasn't been configured yet.",
      entityRefs: [],
    };
  }

  // Select and query relevant capabilities
  const capIds = selectCapabilities(utterance, frame.surface);
  const capData: Record<string, string> = {};
  await Promise.all(
    capIds.map(async (capId) => {
      const data = await queryCapability(capId, frame);
      if (data) capData[capId] = data;
    }),
  );

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
    return {
      text: "I ran into a problem generating a response. Please try again in a moment.",
      entityRefs: [],
    };
  }

  // Parse JSON response with graceful fallback
  try {
    const parsed = JSON.parse(rawContent);
    const text =
      typeof parsed.text === "string" && parsed.text.trim()
        ? parsed.text.trim()
        : rawContent;
    const entityRefs: EntityRef[] = Array.isArray(parsed.entityRefs)
      ? parsed.entityRefs.filter(
          (r: unknown): r is EntityRef =>
            r != null &&
            typeof (r as EntityRef).type === "string" &&
            (r as EntityRef).id != null,
        )
      : [];
    return { text, entityRefs };
  } catch {
    return {
      text: rawContent || "I couldn't generate a response. Please try again.",
      entityRefs: [],
    };
  }
}

// ---------------------------------------------------------------------------
// ConversationGateway
// ---------------------------------------------------------------------------

/**
 * The Conversation Gateway — orchestrates the full per-turn pipeline.
 * Instantiated with an IConversationStore so tests can inject an in-memory store.
 * Production code imports and uses the `conversationGateway` singleton.
 */
export class ConversationGateway {
  private readonly llmProvider: ILlmProvider;

  constructor(
    private readonly store: IConversationStore,
    llmProvider?: ILlmProvider,
  ) {
    this.llmProvider = llmProvider ?? createDefaultLlmProvider();
  }

  /**
   * Process one user utterance end-to-end:
   *   assemble context → record user turn → ground response → record assistant turn.
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
    const { text, entityRefs, outcome } = await buildGroundedResponse(
      utterance,
      frame,
      priorTurns,
      this.llmProvider,
    );

    // 6. Record assistant turn
    const assistantTurnData: NewConversationTurn = {
      role: "assistant",
      surface,
      utterance: text,
      contextFrameRef: frameRef,
      entityRefs,
      outcomeRef: outcome
        ? { status: outcome.status, message: outcome.message }
        : null,
    };
    const assistantTurn = await this.store.appendTurn(thread.id, assistantTurnData);

    return {
      userTurn,
      assistantTurn,
      text,
      entityRefs,
      outcome,
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
 * InMemoryConversationStore.
 */
export const conversationGateway = new ConversationGateway(
  new DatabaseConversationStore(),
);
