/**
 * Canonical Intent Resolver — types and interface (INT24)
 * =======================================================
 * The "PARSE" stage explicitly reserved in types.ts line 183 as a
 * "future workstream / external interpreter". Converts a user utterance into
 * one or more typed, platform-ready intents.
 *
 * Placement rationale (INT23A): this is an intelligence-layer service, peer to
 * IntelligencePlatform. It is NOT a conversation component — it has no
 * conversation state, no thread dependency, and no LLM grounding responsibility.
 * Any caller (Conversation Gateway, Voice adapter, Scan, OCR, future API) can
 * call resolve() without the full conversation pipeline.
 *
 * HARD BOUNDARIES on every IIntentResolver implementation:
 *  • resolve() must not call intelligencePlatform.handle() or read storage.
 *  • resolve() must not fabricate a capability that does not exist.
 *  • resolve() must not contain business logic (no nutrition facts, planner
 *    rules, shopping logic, etc.).
 *  • resolve() must always return at least one ResolvedIntent.
 */

import type { IntentVerb } from "./types.js";
import type { ConversationSurface } from "./conversation/conversation-store.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ResolverGap {
  /**
   * - "ambiguous"            : multiple valid interpretations; clarification needed.
   * - "unknown"              : utterance intent is unrecognisable.
   * - "out-of-scope"         : intent recognised but not expressible via any capability.
   * - "needs-clarification"  : resolvable with one specific missing detail from the user.
   */
  readonly kind: "ambiguous" | "unknown" | "out-of-scope" | "needs-clarification";
  /** Prompt to surface when kind is "ambiguous" or "needs-clarification". */
  readonly clarificationPrompt?: string;
}

/**
 * A fully-resolved, typed intent produced by the resolver.
 * Maps directly to the existing Intent type for platform dispatch.
 * Transient — never persisted. See INT23 §4 for the full shape design.
 */
export interface ResolvedIntent {
  /** Target capability id — must exist in the Capability Registry. */
  readonly capability: string;
  /** The canonical verb from the closed IntentVerb set. */
  readonly verb: IntentVerb;
  /** Handler-ready parameters — validated by the handler, not the resolver. */
  readonly parameters: Readonly<Record<string, unknown>>;
  /** 0.0–1.0. Resolver confidence that this intent captures the utterance. */
  readonly confidence: number;
  /**
   * Raw entity term that may need slug pre-resolution before the handler can
   * use it. Present when a benefit/food concept was extracted from free text
   * but slug matching is uncertain (e.g. "sleep" → benefit slug "better-sleep").
   * The gateway may use this for a search pre-resolve step (INT23A §8 V2 path).
   */
  readonly termQuery?: string;
  /**
   * When present, resolver cannot produce a confident intent. The gateway
   * should surface the clarificationPrompt rather than calling the platform.
   */
  readonly gap?: ResolverGap;
  /**
   * True for context-only intents the resolver appends regardless of the
   * utterance (e.g. the always-on profile personalisation read). Baseline
   * intents are still queried for grounding context, but they never count as
   * "understanding the question" — a turn whose only intents are baseline is
   * classified "no-route" by the gateway (INT35), not answered generically.
   */
  readonly baseline?: boolean;
}

/**
 * Lightweight context snapshot any caller can populate. Does NOT require
 * conversation state — the Conversation Gateway derives it from ContextFrame;
 * Voice and Scan adapters populate it from surface hints. See INT23A §6.
 */
export interface IntentResolutionHints {
  /** Which surface / page the user is currently on. */
  readonly surface: ConversationSurface;
  /** ISO date anchor (YYYY-MM-DD) — grounds temporal utterances. */
  readonly temporalAnchor: string;
  /** Food slug if the user is on a food detail page in the Pantry Explore UI. */
  readonly currentFoodSlug?: string;
  /** Active planner week shown in the UI, if any. */
  readonly activePlannerWeekId?: number;
  /** Meal card currently in focus, if any. */
  readonly selectedMealId?: number;
  /**
   * PHASE5E — the ambient opportunity card the household is asking about, if any
   * (OD1's `DeliverableOpportunity.id`, e.g. `food-intelligence:planner-empty-day:42`).
   *
   * Set ONLY when a surface explicitly asks the Companion about one specific card
   * ("Why this?"). It is a POINTER, exactly like `selectedMealId` — the platform
   * re-reads the opportunity from the Decision Engine before saying a word about it,
   * and an id that is no longer being delivered yields an honest gap, never a
   * fabricated justification.
   */
  readonly selectedOpportunityId?: string;
}

/**
 * The Canonical Intent Resolver contract. Provider-neutral — implementations
 * may be pattern-based (PatternIntentResolver), LLM-based, or hybrid.
 * The gateway and all input adapters depend only on this interface.
 */
export interface IIntentResolver {
  /**
   * Convert a user utterance into one or more typed, ordered intents.
   * Results are sorted by confidence descending. The caller takes the first
   * results at or above its confidence threshold; results with a gap set signal
   * that the gateway should prefer the clarification prompt over calling the
   * platform.
   *
   * Always returns at least one ResolvedIntent (the profile fallback).
   */
  resolve(utterance: string, hints: IntentResolutionHints): Promise<ResolvedIntent[]>;
}
