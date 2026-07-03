/**
 * companion-learning-recommender.ts — INT35C Governed Companion Learning & Dashboard
 * =====================================================================================
 * Orchestrates ADVISORY-ONLY recommendation generation from a Companion gap
 * classification, and queues the result in the review queue. This module
 * combines three proposal generators, none of which ever write to production
 * routing:
 *
 *  1. Matcher recommendations  — reuses matcher-suggester.ts UNCHANGED, over the
 *     resolver-gap backlog only (never the clarification backlog — those are
 *     not misses).
 *  2. Capability recommendations (NEW) — asks the injected LLM to describe, in
 *     human terms, what a capability-gap cluster implies is missing and
 *     propose acceptance criteria. Constrained to the (capability, verb) pairs
 *     ALREADY present in the input — the resolver only ever routes to real,
 *     known capability ids, so this module adds no invention risk on top of
 *     that; a suggestion naming any other capability is dropped defensively.
 *  3. Regression test proposals (NEW) — pure string templating (no LLM call),
 *     one skeleton per accepted matcher/capability suggestion, ready for a
 *     human to paste into test-intent-resolver.ts.
 *
 * THE ONE HARD RULE (inherited from INT35B's matcher-suggester.ts, unchanged):
 *   This module SUGGESTS. It has no import of the resolver's matcher arrays,
 *   the Capability Registry's bind path, or any file-write capability. Every
 *   recommendation reaches storage only as `status: "pending"` — a human
 *   admin reviews it (companion-learning-store.reviewRecommendation), and
 *   ACTING on an approved recommendation remains a separate, human,
 *   code-reviewed edit. Nothing in this module can change production
 *   behaviour by construction.
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-learning.ts
 */

import type { ILlmProvider } from "./llm-provider.js";
import type { IConversationStore, ConversationRole } from "./conversation-store.js";
import { getUnsuccessfulQueryLog } from "./turn-fallback.js";
import { summarizeCompanionHealth } from "./companion-observability.js";
import { classifyGaps, type CompanionGapClassification, type CapabilityGapEntry } from "./companion-gap-classifier.js";
import { suggestMatcherImprovements, type MatcherSuggestion } from "./matcher-suggester.js";
import type {
  ICompanionLearningStore,
  NewRecommendation,
} from "./companion-learning-store.js";
import type { CompanionHealthSnapshot, CompanionLearningRecommendation } from "../../../shared/schema.js";

// ---------------------------------------------------------------------------
// Capability recommendations
// ---------------------------------------------------------------------------

export interface CapabilityRecommendation {
  readonly capability: string;
  readonly verb: string;
  readonly summary: string;
  readonly acceptanceCriteria: readonly string[];
  readonly observedCount: number;
  readonly confidence: "low" | "medium" | "high";
}

const CAPABILITY_ADVISORY_NOTE =
  "Advisory only. These describe capability gaps observed by the Companion for a " +
  "human engineer to review — nothing here has been built. Building a capability " +
  "remains a separate, code-reviewed implementation.";

function buildCapabilitySystemPrompt(allowedPairs: readonly string[]): string {
  return (
`You are helping engineers prioritise product gaps for a UK meal-planning
assistant called "Apple". You are given (capability, verb) pairs the assistant
already routes to correctly, but which either don't exist yet or have no
trusted stored knowledge to answer with, plus how often each was observed and
why (when known).

You may ONLY describe these exact "capability::verb" pairs — do not invent or
substitute any other pair:
${allowedPairs.join(", ")}

For each pair, write a short human-readable summary of what's missing and 2-4
concrete acceptance criteria an engineer could implement against.

Return JSON only in exactly this shape:
{"recommendations":[{"pair":"capability::verb","summary":"…",
"acceptanceCriteria":["…","…"],"confidence":"low|medium|high"}]}`
  );
}

function coerceCapabilityRecommendation(
  raw: unknown,
  allowed: Map<string, CapabilityGapEntry>,
): CapabilityRecommendation | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const pair = typeof r.pair === "string" ? r.pair.trim() : "";
  const gap = allowed.get(pair);
  if (!gap) return null; // never surface a pair the caller did not supply

  const summary = typeof r.summary === "string" && r.summary.trim() ? r.summary.trim() : "No summary provided.";
  const acceptanceCriteria = Array.isArray(r.acceptanceCriteria)
    ? r.acceptanceCriteria.filter((s): s is string => typeof s === "string" && s.trim() !== "")
    : [];
  const confidence = r.confidence === "low" || r.confidence === "medium" || r.confidence === "high" ? r.confidence : "low";

  return {
    capability: gap.capability,
    verb: gap.verb,
    summary,
    acceptanceCriteria,
    observedCount: gap.count,
    confidence,
  };
}

/**
 * Propose human-readable capability recommendations for a batch of capability
 * gaps. Degrades to zero suggestions (never throws) when there is nothing to
 * review, the provider is unavailable, or the provider errors/returns
 * unparseable output — same discipline as matcher-suggester.ts.
 */
export async function suggestCapabilityImprovements(
  capabilityGaps: readonly CapabilityGapEntry[],
  llmProvider: ILlmProvider,
): Promise<{ available: boolean; recommendations: readonly CapabilityRecommendation[]; note: string }> {
  if (capabilityGaps.length === 0) {
    return { available: true, recommendations: [], note: `${CAPABILITY_ADVISORY_NOTE} No capability gaps to review.` };
  }
  if (!llmProvider.isAvailable) {
    return {
      available: false,
      recommendations: [],
      note: `${CAPABILITY_ADVISORY_NOTE} The AI provider is not configured, so no recommendations were generated.`,
    };
  }

  const allowed = new Map(capabilityGaps.map((g) => [`${g.capability}::${g.verb}`, g]));
  let content = "";
  try {
    const response = await llmProvider.complete({
      messages: [
        { role: "system", content: buildCapabilitySystemPrompt(Array.from(allowed.keys())) },
        {
          role: "user",
          content: `Observed capability gaps:\n${capabilityGaps
            .map((g) => `- ${g.capability}::${g.verb} (observed ${g.count} time(s)${g.reason ? `; registry reason: ${g.reason}` : ""})`)
            .join("\n")}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 900,
      jsonMode: true,
    });
    content = response.content;
  } catch (err) {
    console.error("[CompanionLearningRecommender] Capability LLM call failed:", err);
    return {
      available: false,
      recommendations: [],
      note: `${CAPABILITY_ADVISORY_NOTE} The AI provider errored, so no recommendations were generated.`,
    };
  }

  let recommendations: CapabilityRecommendation[] = [];
  try {
    const parsed = JSON.parse(content) as { recommendations?: unknown };
    const list = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    recommendations = list
      .map((r) => coerceCapabilityRecommendation(r, allowed))
      .filter((r): r is CapabilityRecommendation => r !== null);
  } catch {
    recommendations = [];
  }

  return { available: true, recommendations, note: CAPABILITY_ADVISORY_NOTE };
}

// ---------------------------------------------------------------------------
// Regression test proposals — pure templating, no LLM
// ---------------------------------------------------------------------------

export interface RegressionTestProposal {
  readonly utterance: string;
  readonly expectedCapability: string;
  readonly expectedVerb: string;
  readonly note: string;
}

/** One skeleton per matcher suggestion — ready to paste into test-intent-resolver.ts. */
function regressionTestsFromMatcherSuggestions(
  suggestions: readonly MatcherSuggestion[],
): RegressionTestProposal[] {
  return suggestions.flatMap((s) =>
    s.utteranceCluster.slice(0, 3).map((utterance) => ({
      utterance,
      expectedCapability: s.suggestedCapability,
      expectedVerb: s.suggestedVerb,
      note: "Add once the matcher proposal below is implemented and code-reviewed.",
    })),
  );
}

/** One skeleton per capability recommendation — an executability test once the capability exists. */
function regressionTestsFromCapabilityRecommendations(
  recommendations: readonly CapabilityRecommendation[],
): RegressionTestProposal[] {
  return recommendations.map((r) => ({
    utterance: "", // no example utterance is retained at the routing-failure grouping level
    expectedCapability: r.capability,
    expectedVerb: r.verb,
    note: `Add an executability + no-honest-gap regression test once ${r.capability}/${r.verb} is bound.`,
  }));
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface GenerateRecommendationsResult {
  readonly snapshot: CompanionHealthSnapshot;
  readonly classification: CompanionGapClassification;
  readonly recommendations: readonly CompanionLearningRecommendation[];
  readonly matcherReport: Awaited<ReturnType<typeof suggestMatcherImprovements>>;
  readonly capabilityReport: Awaited<ReturnType<typeof suggestCapabilityImprovements>>;
}

const TURN_COUNT_ROLE: ConversationRole = "assistant";

/**
 * The single entry point the admin "Generate recommendations" action calls:
 * builds the current summary + classification, records a snapshot, asks the
 * LLM for matcher and capability proposals, derives regression test
 * skeletons, and queues everything as `pending` rows. Every write in this
 * function is additive (a new snapshot row, new pending recommendation rows)
 * — it never mutates or deletes prior history, and it never touches routing.
 */
export async function generateAndQueueRecommendations(
  llmProvider: ILlmProvider,
  conversationStore: IConversationStore,
  learningStore: ICompanionLearningStore,
): Promise<GenerateRecommendationsResult> {
  const log = getUnsuccessfulQueryLog();
  const summary = summarizeCompanionHealth(log);
  const classification = classifyGaps(log, summary);

  const since = summary.windowStart ? new Date(summary.windowStart) : new Date(0);
  const totalTurns = await conversationStore.countTurnsSince(since, TURN_COUNT_ROLE);

  const snapshot = await learningStore.recordSnapshot({ totalTurns, summary, classification });

  const [matcherReport, capabilityReport] = await Promise.all([
    suggestMatcherImprovements(classification.resolverGaps.map((g) => g.utterance), llmProvider),
    suggestCapabilityImprovements(classification.capabilityGaps, llmProvider),
  ]);

  const regressionTests = [
    ...regressionTestsFromMatcherSuggestions(matcherReport.suggestions),
    ...regressionTestsFromCapabilityRecommendations(capabilityReport.recommendations),
  ];

  const toInsert: NewRecommendation[] = [
    ...matcherReport.suggestions.map((s): NewRecommendation => ({
      snapshotId: snapshot.id,
      kind: "matcher",
      payload: s as unknown as Record<string, unknown>,
      rationale: s.rationale,
      confidence: s.confidence,
    })),
    ...capabilityReport.recommendations.map((r): NewRecommendation => ({
      snapshotId: snapshot.id,
      kind: "capability",
      payload: r as unknown as Record<string, unknown>,
      rationale: r.summary,
      confidence: r.confidence,
    })),
    ...regressionTests.map((t): NewRecommendation => ({
      snapshotId: snapshot.id,
      kind: "regression-test",
      payload: t as unknown as Record<string, unknown>,
      rationale: t.note,
      confidence: "medium",
    })),
  ];

  const recommendations = await learningStore.insertRecommendations(toInsert);

  return { snapshot, classification, recommendations, matcherReport, capabilityReport };
}
