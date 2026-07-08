/**
 * turn-fallback.ts — INT35 Intelligent Fallback
 * ==============================================
 * The canonical vocabulary and copy for UNSUCCESSFUL assistant turns. Before
 * INT35 every unsuccessful turn collapsed into one generic LLM line ("I don't
 * have that information right now"). This module gives the Conversation
 * Gateway four honest, distinguishable states:
 *
 *   - "no-route"       : the resolver did not understand the question.
 *   - "no-knowledge"   : understood, but no trusted stored knowledge answers it
 *                        (the platform returned an honest gap / denial).
 *   - "no-results"     : understood AND searched, but nothing matched.
 *   - "internal-error" : a capability or the LLM provider failed unexpectedly.
 *
 * HARD BOUNDARIES:
 *  - No storage reads, no platform calls, no LLM calls, no business logic.
 *  - Pure classification + copy + a bounded in-memory log. The gateway remains
 *    the single wiring point; this module never fabricates an answer
 *    (TIP1 Principle 6 — honest gaps are preserved, never papered over).
 *  - The unsuccessful-query log NEVER records user ids, capability result
 *    payloads, or intent parameters — only the utterance itself (truncated),
 *    the surface, and the (capability, verb, status) routing shape. That is
 *    exactly what future resolver improvement needs and nothing more.
 *
 * Run tests: npx tsx server/tests/test-intelligence-fallback.ts
 */

import type { IntentVerb } from "../types.js";
import type { ResolverGap } from "../intent-resolver.js";
import type { ConversationSurface } from "./conversation-store.js";

// ---------------------------------------------------------------------------
// The four canonical unsuccessful states
// ---------------------------------------------------------------------------

export type UnsuccessfulTurnState =
  /** The resolver produced no utterance-derived intent — we did not understand. */
  | "no-route"
  /** Routed, but every routed capability reported an honest gap/denial — trusted knowledge is missing. */
  | "no-knowledge"
  /** At least one search executed successfully and found nothing — an honest empty result. */
  | "no-results"
  /** A capability handler or the LLM provider failed unexpectedly. */
  | "internal-error";

/**
 * The per-intent outcome shape the gateway feeds into classification, after
 * querying one resolved intent through intelligencePlatform.handle():
 *
 *  - "ok-data"      : platform returned ok with a non-empty result.
 *  - "ok-empty"     : platform returned ok but a search found no matches.
 *  - "no-knowledge" : platform returned an honest non-ok (gap, not_executable,
 *                     unsupported_intent, unknown_capability, denied,
 *                     confirmation_required) — no trusted answer exists.
 *  - "error"        : the handler threw a genuine fault (not a structured
 *                     CapabilityExecutionError — the engine surfaces those as
 *                     non-ok outcomes, mapped to "no-knowledge" above).
 */
export type QueriedIntentStatus = "ok-data" | "ok-empty" | "no-knowledge" | "error";

export interface QueriedIntentOutcome {
  readonly capability: string;
  readonly verb: IntentVerb;
  /**
   * True for context-only intents the resolver always appends regardless of
   * the utterance (the profile personalisation read). Baseline intents never
   * count as "understanding the question" — a turn whose only outcomes are
   * baseline is a no-route turn even if the baseline read succeeded.
   */
  readonly baseline: boolean;
  readonly status: QueriedIntentStatus;
  /** The platform's honest outcome message, for logging (never shown raw to the user). */
  readonly message?: string;
  /** The search query string the intent carried, when it carried one. */
  readonly query?: string;
}

// ---------------------------------------------------------------------------
// Empty-search detection
// ---------------------------------------------------------------------------

/**
 * Decide whether an "ok" search result is an honest EMPTY result. Applied by
 * the gateway to `search`-verb outcomes only — read/explain handlers already
 * throw an honest gap when nothing is stored, so an ok read IS data.
 *
 * Known live search result shapes:
 *  - discovery engines (INT26–INT32): { totalCount: number, results: [...] }
 *  - meals search:                     { mealCount: number, meals: [...] }
 *  - nutrition-knowledge search:       { foods: [], nutrients: [], benefits: [] }
 */
export function isEmptySearchResult(result: unknown): boolean {
  if (result == null) return true;
  if (Array.isArray(result)) return result.length === 0;
  if (typeof result !== "object") return false;

  const record = result as Record<string, unknown>;
  for (const countKey of ["totalCount", "mealCount", "count"]) {
    const v = record[countKey];
    if (typeof v === "number") return v === 0;
  }

  const arrays = Object.values(record).filter(Array.isArray);
  if (arrays.length === 0) return false;
  return arrays.every((a) => (a as unknown[]).length === 0);
}

// ---------------------------------------------------------------------------
// Turn classification
// ---------------------------------------------------------------------------

/**
 * Classify a completed set of per-intent outcomes into one of the four
 * canonical unsuccessful states, or null when the turn succeeded (at least
 * one routed capability produced real grounding data).
 *
 * Precedence (most-informative first) over ROUTED (non-baseline) intents:
 *   1. any ok-data      → null (success — the LLM has real context)
 *   2. any ok-empty     → "no-results"   (a search ran and honestly found nothing)
 *   3. any no-knowledge → "no-knowledge" (understood; no trusted stored answer)
 *   4. anything else    → "internal-error" (only genuine faults remain)
 *   0. no routed intents at all → "no-route" (we did not understand)
 */
export function classifyTurn(
  queried: readonly QueriedIntentOutcome[],
): UnsuccessfulTurnState | null {
  const routed = queried.filter((q) => !q.baseline);
  if (routed.length === 0) return "no-route";
  if (routed.some((q) => q.status === "ok-data")) return null;
  if (routed.some((q) => q.status === "ok-empty")) return "no-results";
  if (routed.some((q) => q.status === "no-knowledge")) return "no-knowledge";
  return "internal-error";
}

// ---------------------------------------------------------------------------
// State-specific response copy
// ---------------------------------------------------------------------------

/** Friendly names for the areas a search covered, for the no-results message. */
const CAPABILITY_FRIENDLY_NAMES: Record<string, string> = {
  "meals":               "your meals",
  "meal-discovery":      "meal ideas",
  "diary":               "your food diary",
  "diary-discovery":     "your food diary",
  "planner":             "your meal plan",
  "planner-discovery":   "your meal plan",
  "pantry":              "your pantry",
  "pantry-discovery":    "your pantry",
  "shopping":            "your shopping list",
  "shopping-discovery":  "your shopping list",
  "household":           "your household",
  "household-discovery": "your household",
  "nutrition-knowledge": "the nutrition knowledge base",
  "nutrition-discovery": "meals by nutrition",
  "templates":           "your plan templates",
  "analyser":            "the additives reference",
  "partners":            "the supported retailers",
};

/**
 * Rephrase suggestions offered when the resolver fails, tuned to the surface
 * the user is on. Every example is a phrasing the PatternIntentResolver is
 * proven (by test) to route — we never suggest a question we cannot answer.
 */
const REPHRASE_SUGGESTIONS: Partial<Record<ConversationSurface, readonly string[]>> = {
  planner:   ["what meals do I have this week", "is chicken planned this week", "meals under 400 calories"],
  shopping:  ["what's on my shopping list", "is pasta on my list", "which supermarkets are supported"],
  pantry:    ["what's in my pantry", "do I have flour in my pantry", "what can I cook with chickpeas"],
  diary:     ["what have I eaten today", "show me a past meal", "did I eat chicken yesterday"],
  nutrition: ["what is broccoli good for", "foods that help with sleep", "what foods are high in iron"],
  meals:     ["what pasta meals have I got", "show me pasta recipes", "meals under 400 calories"],
  household: ["who is in my household", "does anyone in my household have a nut allergy", "what dietary restrictions does my household have"],
};

const DEFAULT_SUGGESTIONS: readonly string[] = [
  "what pasta meals have I got",
  "what's on my shopping list",
  "foods that help with sleep",
];

/** Options for composing a fallback message. */
export interface FallbackTextOptions {
  readonly surface?: ConversationSurface;
  /** The queried outcomes — used to describe what was searched (no-results). */
  readonly queried?: readonly QueriedIntentOutcome[];
  /** A resolver-supplied clarification prompt, surfaced verbatim when present. */
  readonly clarificationPrompt?: string;
}

export function formatSuggestions(surface?: ConversationSurface): string {
  const list = (surface && REPHRASE_SUGGESTIONS[surface]) || DEFAULT_SUGGESTIONS;
  const quoted = list.map((s) => `"${s}"`);
  return `${quoted.slice(0, -1).join(", ")} or ${quoted[quoted.length - 1]}`;
}

/**
 * Name the area(s) that were queried with one of the given statuses, plus a
 * representative query string. Keyed to WHICH fallback state fired: "ok-empty"
 * for a search that returned nothing, "no-knowledge" for an honest platform gap
 * — so a fallback can honestly say WHAT was checked, never just "no" (COMP1).
 */
export function describeQueried(
  queried: readonly QueriedIntentOutcome[] | undefined,
  statuses: readonly QueriedIntentStatus[],
): { areas: string; query?: string } {
  const searched = (queried ?? []).filter((q) => !q.baseline && statuses.includes(q.status));
  const names = Array.from(
    new Set(searched.map((q) => CAPABILITY_FRIENDLY_NAMES[q.capability] ?? q.capability)),
  );
  const areas =
    names.length === 0
      ? "your data"
      : names.length === 1
        ? names[0]
        : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const query = searched.map((q) => q.query?.trim()).find((q) => q);
  return { areas, query };
}

function describeSearched(queried: readonly QueriedIntentOutcome[] | undefined): {
  areas: string;
  query?: string;
} {
  return describeQueried(queried, ["ok-empty"]);
}

/**
 * Compose the honest, state-specific response for an unsuccessful turn.
 * Replaces the pre-INT35 generic "I don't have that information right now".
 * Never fabricates an answer — each message says exactly what happened.
 */
export function buildFallbackText(
  state: UnsuccessfulTurnState,
  options: FallbackTextOptions = {},
): string {
  switch (state) {
    case "no-route": {
      const clarify = options.clarificationPrompt?.trim();
      if (clarify) return clarify;
      return (
        `I'm not sure I understood that question. Could you try rephrasing it? ` +
        `For example: ${formatSuggestions(options.surface)}.`
      );
    }
    case "no-knowledge":
      return (
        `I understood what you're asking, but I don't have trusted information ` +
        `stored to answer it yet — I'd rather say so than guess.`
      );
    case "no-results": {
      const { areas, query } = describeSearched(options.queried);
      const scope = query ? `${areas} for "${query}"` : areas;
      return (
        `I searched ${scope} but couldn't find any matches. ` +
        `It might not be in the app yet — try different wording, or check the spelling.`
      );
    }
    case "internal-error":
      return (
        `Something went wrong on my side while answering that — it's not you. ` +
        `Please try again in a moment.`
      );
  }
}

// ---------------------------------------------------------------------------
// Unsuccessful-query log (for future resolver improvement)
// ---------------------------------------------------------------------------

/** Maximum utterance length retained in the log. */
const LOG_UTTERANCE_MAX_CHARS = 200;
/** Bounded in-memory ring buffer size. */
const LOG_MAX_ENTRIES = 200;

export interface UnsuccessfulQueryLogEntry {
  readonly timestamp: string;
  /**
   * "resolver-unmatched": the resolver had no utterance-derived route (logged
   *   even when surface context later rescued the turn — these are exactly the
   *   utterances future matcher work should cover).
   * "turn-fallback": the turn ended in one of the four unsuccessful states.
   */
  readonly stage: "resolver-unmatched" | "turn-fallback";
  readonly state?: UnsuccessfulTurnState;
  /**
   * INT35C — the resolver's own gap classification for this turn, when one of
   * the resolved intents carried a gap. Distinguishes a genuine "did not
   * understand" miss ("unknown"/"out-of-scope") from a turn where the resolver
   * DID understand but needed one more detail from the user
   * ("ambiguous"/"needs-clarification"). Both previously collapsed into the
   * same `state: "no-route"` with no way to tell them apart. Additive only —
   * it classifies an outcome that already happened; it changes no routing.
   */
  readonly gapKind?: ResolverGap["kind"];
  readonly surface: ConversationSurface;
  /** The user's utterance, truncated. NO user id, NO parameters, NO result data. */
  readonly utterance: string;
  /** The routing shape only — capability, verb, and (when queried) outcome status. */
  readonly intents: readonly { capability: string; verb: IntentVerb; status?: QueriedIntentStatus }[];
}

const unsuccessfulQueryLog: UnsuccessfulQueryLogEntry[] = [];

/**
 * Record an unmatched / failed query so resolver coverage can be improved
 * later. Deliberately excludes ANY sensitive user data: no user id, no
 * household id, no intent parameters, no capability results — only the
 * utterance itself (truncated) and the routing shape.
 */
export function logUnsuccessfulQuery(
  entry: Omit<UnsuccessfulQueryLogEntry, "timestamp">,
): void {
  const record: UnsuccessfulQueryLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
    utterance: entry.utterance.slice(0, LOG_UTTERANCE_MAX_CHARS),
  };
  unsuccessfulQueryLog.push(record);
  if (unsuccessfulQueryLog.length > LOG_MAX_ENTRIES) {
    unsuccessfulQueryLog.splice(0, unsuccessfulQueryLog.length - LOG_MAX_ENTRIES);
  }
  console.info(
    `[IntelligenceFallback] ${record.stage}` +
      (record.state ? ` state=${record.state}` : "") +
      ` surface=${record.surface}` +
      ` intents=${record.intents.map((i) => `${i.capability}/${i.verb}${i.status ? `:${i.status}` : ""}`).join(",") || "none"}` +
      ` utterance=${JSON.stringify(record.utterance)}`,
  );
}

/** Read the bounded in-memory log (most recent last). */
export function getUnsuccessfulQueryLog(): readonly UnsuccessfulQueryLogEntry[] {
  return unsuccessfulQueryLog;
}

/** Test hook — clear the in-memory log. */
export function resetUnsuccessfulQueryLog(): void {
  unsuccessfulQueryLog.length = 0;
}
