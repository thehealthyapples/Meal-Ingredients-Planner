/**
 * matcher-suggester.ts — INT35B Companion Learning & Observability
 * =================================================================
 * AI-ASSISTED, ADVISORY-ONLY matcher improvement. Given the resolver's matcher
 * backlog (the utterances the PatternIntentResolver failed to understand, from
 * companion-observability.ts), it asks the injected LLM to CLUSTER them and
 * PROPOSE how a human engineer might extend resolver coverage — a target
 * capability, verb, example phrasings, and an advisory regex.
 *
 * THE ONE HARD RULE (EWO-INT35B scope items 4 & 5):
 *   This module SUGGESTS. It NEVER modifies the PatternIntentResolver, the
 *   Capability Registry, production routing, or any file. It has no import of
 *   the resolver's matcher arrays and no write path of any kind. Every result is
 *   a proposal for a human to review — `applied` is always false, by
 *   construction. Production routing changes remain a human, code-reviewed edit.
 *
 * OTHER BOUNDARIES:
 *  - No storage reads, no platform calls, no business logic. The only external
 *    call is to the injected ILlmProvider (dependency-injected, stubbable).
 *  - The prompt carries only normalised utterances (already privacy-safe — no
 *    user ids, no parameters, no results) plus the static list of capabilities.
 *  - `suggestedCapability` is constrained to the known capability set; a
 *    suggestion naming anything else is dropped (the LLM cannot invent a
 *    capability into the backlog review).
 *
 * Run tests: npx tsx server/tests/test-intelligence-observability.ts
 */

import type { ILlmProvider } from "./llm-provider.js";

// ---------------------------------------------------------------------------
// Known capabilities the resolver can target (for constraining suggestions)
// ---------------------------------------------------------------------------

/**
 * The capabilities the PatternIntentResolver routes to today. The suggester
 * constrains every proposal to this set so the advisory output stays actionable
 * — it can only ever suggest wiring an utterance to a capability that exists.
 * (Kept as a static list here deliberately: this module must not import the
 * resolver, to guarantee it has no path to modify routing.)
 */
export const KNOWN_CAPABILITIES: readonly string[] = [
  "planner",
  "planner-discovery",
  "shopping",
  "shopping-discovery",
  "pantry",
  "pantry-discovery",
  "diary",
  "diary-discovery",
  "household",
  "household-discovery",
  "meals",
  "meal-discovery",
  "nutrition-knowledge",
  "nutrition-discovery",
  "templates",
  "analyser",
  "partners",
  "profile",
];

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

export interface MatcherSuggestion {
  /** Representative unmatched utterances this suggestion would cover. */
  readonly utteranceCluster: readonly string[];
  /** Proposed target capability — always one of KNOWN_CAPABILITIES. */
  readonly suggestedCapability: string;
  /** Proposed verb (read | search | explain | …). */
  readonly suggestedVerb: string;
  /** Example query string a matcher might extract, when applicable. */
  readonly exampleQuery?: string;
  /** Advisory regular expression a human could adapt. NEVER auto-applied. */
  readonly proposedPattern?: string;
  /** Why the LLM believes this cluster maps to this capability. */
  readonly rationale: string;
  /** The LLM's confidence in the suggestion. */
  readonly confidence: "low" | "medium" | "high";
  /**
   * Always false. Present in the contract so every consumer is reminded these
   * are proposals, never live routing changes.
   */
  readonly applied: false;
}

export interface MatcherSuggestionReport {
  /** True only when a real provider produced suggestions. */
  readonly available: boolean;
  /** The advisory suggestions (empty when unavailable or nothing to review). */
  readonly suggestions: readonly MatcherSuggestion[];
  /** Human-facing note describing what happened / the advisory-only guarantee. */
  readonly note: string;
  /** The model that produced the suggestions, when one did. */
  readonly model?: string;
}

// ---------------------------------------------------------------------------
// Advisory guarantee, surfaced on every report
// ---------------------------------------------------------------------------

const ADVISORY_NOTE =
  "Advisory only. These are AI-generated proposals for a human engineer to " +
  "review — nothing here has been applied. Production routing changes remain a " +
  "code-reviewed edit to the PatternIntentResolver.";

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return (
`You are helping engineers improve the intent resolver for a UK meal-planning
assistant called "Apple". You are given a list of user questions the resolver
FAILED to understand. Cluster similar questions and, for each cluster, propose
how the resolver could be extended to route them.

You may ONLY target these capabilities:
${KNOWN_CAPABILITIES.join(", ")}.

Rules:
- Never invent a capability that is not in that list.
- Prefer a discovery capability (…-discovery) for "find/search my X" questions,
  the knowledge capabilities (nutrition-knowledge / nutrition-discovery) for
  food and nutrition questions, and the plain capability for "read my X" reads.
- If a cluster is genuinely out of scope for every capability (chit-chat,
  unsupported feature), omit it — do not force a mapping.
- proposedPattern must be a plausible JavaScript regular expression (as a
  string) a human could adapt; keep it conservative.

Return JSON only in exactly this shape:
{"suggestions":[{"utteranceCluster":["…"],"suggestedCapability":"…",
"suggestedVerb":"read|search|explain","exampleQuery":"…","proposedPattern":"…",
"rationale":"…","confidence":"low|medium|high"}]}`
  );
}

// ---------------------------------------------------------------------------
// Defensive parsing / validation
// ---------------------------------------------------------------------------

const VALID_CONFIDENCE = new Set(["low", "medium", "high"]);

function coerceSuggestion(raw: unknown): MatcherSuggestion | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const cap = typeof r.suggestedCapability === "string" ? r.suggestedCapability.trim() : "";
  if (!KNOWN_CAPABILITIES.includes(cap)) return null; // never surface an invented capability

  const verb = typeof r.suggestedVerb === "string" && r.suggestedVerb.trim() ? r.suggestedVerb.trim() : "read";

  const cluster = Array.isArray(r.utteranceCluster)
    ? r.utteranceCluster.filter((s): s is string => typeof s === "string" && s.trim() !== "").map((s) => s.trim())
    : [];
  if (cluster.length === 0) return null;

  const confidence = VALID_CONFIDENCE.has(String(r.confidence)) ? (r.confidence as MatcherSuggestion["confidence"]) : "low";
  const rationale = typeof r.rationale === "string" && r.rationale.trim() ? r.rationale.trim() : "No rationale provided.";
  const exampleQuery = typeof r.exampleQuery === "string" && r.exampleQuery.trim() ? r.exampleQuery.trim() : undefined;
  const proposedPattern = typeof r.proposedPattern === "string" && r.proposedPattern.trim() ? r.proposedPattern.trim() : undefined;

  return {
    utteranceCluster: cluster,
    suggestedCapability: cap,
    suggestedVerb: verb,
    ...(exampleQuery ? { exampleQuery } : {}),
    ...(proposedPattern ? { proposedPattern } : {}),
    rationale,
    confidence,
    applied: false,
  };
}

function parseSuggestions(content: string): MatcherSuggestion[] {
  try {
    const parsed = JSON.parse(content) as unknown;
    const list = (parsed as { suggestions?: unknown })?.suggestions;
    if (!Array.isArray(list)) return [];
    return list.map(coerceSuggestion).filter((s): s is MatcherSuggestion => s !== null);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/** Cap on utterances sent to the model per call (token + cost bound). */
const MAX_UTTERANCES = 40;

/**
 * Produce advisory matcher-improvement suggestions for a backlog of unmatched
 * utterances. NEVER modifies routing — the result is a proposal report only.
 *
 * @param backlog     normalised unmatched utterances (from companion-observability)
 * @param llmProvider injected provider; tests pass a stub, production the default
 */
export async function suggestMatcherImprovements(
  backlog: readonly string[],
  llmProvider: ILlmProvider,
): Promise<MatcherSuggestionReport> {
  const utterances = Array.from(new Set(backlog.map((u) => u.trim()).filter(Boolean))).slice(0, MAX_UTTERANCES);

  if (utterances.length === 0) {
    return { available: true, suggestions: [], note: `${ADVISORY_NOTE} No unmatched utterances to review.` };
  }
  if (!llmProvider.isAvailable) {
    return {
      available: false,
      suggestions: [],
      note: `${ADVISORY_NOTE} The AI provider is not configured, so no suggestions were generated.`,
    };
  }

  let content = "";
  let model: string | undefined;
  try {
    const response = await llmProvider.complete({
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: `Unmatched user questions:\n${utterances.map((u) => `- ${u}`).join("\n")}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 900,
      jsonMode: true,
    });
    content = response.content;
    model = response.model;
  } catch (err) {
    console.error("[MatcherSuggester] LLM call failed:", err);
    return {
      available: false,
      suggestions: [],
      note: `${ADVISORY_NOTE} The AI provider errored, so no suggestions were generated.`,
    };
  }

  const suggestions = parseSuggestions(content);
  return {
    available: true,
    suggestions,
    note: ADVISORY_NOTE,
    ...(model ? { model } : {}),
  };
}
