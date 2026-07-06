/**
 * knowledge-assembly.ts — COMP5 Canonical Knowledge Assembly
 * ===========================================================
 *
 * The single authoritative stage that composes all available platform
 * knowledge before response generation or honest gap declaration.
 *
 * RESPONSIBILITIES:
 *  1. Orchestrate progressive knowledge search (GOV1 Tiers 1–3)
 *  2. Apply Silence Rules (de-dupe, cap, prioritize)
 *  3. Determine honest gap state (AFTER exhaustion, not before)
 *  4. Produce complete Knowledge Package for Behaviour Engine
 *
 * NON-RESPONSIBILITIES (explicit boundaries):
 *  - Does NOT retrieve business data directly (uses existing owners)
 *  - Does NOT invoke capabilities (capabilities are pre-invoked)
 *  - Does NOT apply personality voicing (that's Behaviour Engine)
 *  - Does NOT decide HOW to say it (that's Behaviour Engine)
 *
 * ARCHITECTURAL CONSTRAINT:
 *  Knowledge Assembly is the single owner of "what content exists."
 *  Behaviour Engine is the single owner of "how to voice it."
 */

import { classifyTurn, type UnsuccessfulTurnState, type QueriedIntentOutcome } from "./turn-fallback.js";
import type { IntentVerb } from "../types.js";
import type { ContextFrame } from "./context-frame-assembler.js";
import type { NativeDiscoveryResponse } from "./native-discovery.js";
import type { GuidanceSuggestion } from "./companion-guidance.js";

/**
 * The complete context about available knowledge for this turn.
 * Passed to Behaviour Engine, which applies voicing without modification.
 */
export interface KnowledgePackage {
  /** Serialized capability results (Tier 1: direct answer) */
  answerData: Record<string, string>;

  /** Enriched context from composition (Tiers 2–3) */
  enrichments: EnrichmentItem[];

  /** Classification of response state (after searching Tiers 1–3) */
  gapState: UnsuccessfulTurnState | null;

  /** Why there's a gap (if any) — for voicing */
  gapReason?: string;

  /** Capabilities that were queried and their outcomes */
  queriedCapabilities: QueriedIntentOutcome[];

  /** Available guidance suggestions (determined, not composed) */
  guidance: GuidanceSuggestion[];

  /** Available discoveries (canonical THA entities) */
  discoveries: NativeDiscoveryResponse[];

  /** Whether this is a success path or failure path */
  isSuccess: boolean;
}

/**
 * An individual enrichment item (Tier 2–3 content)
 */
export interface EnrichmentItem {
  /** Which tier this came from (GOV1 classification) */
  tier: "tier1-direct" | "tier2-domain" | "tier3-adjacent" | "tier4-general";

  /** Sort priority for Silence Rules */
  priority: number;

  /** Content to present to user */
  title: string;
  description: string;

  /** How to present it */
  kind: "contextual-suggestion" | "related-feature" | "next-step" | "caveat";

  /** Source for debugging */
  source: string;
}

/**
 * Assemble complete knowledge context for this turn.
 *
 * Input: Capability query results (already executed)
 * Output: Knowledge Package (complete context + gap state)
 *
 * This stage:
 * 1. Extracts direct answers (Tier 1)
 * 2. Invokes composition (Tier 2) if applicable
 * 3. Gathers adjacent context (Tier 3)
 * 4. Applies Silence Rules
 * 5. Classifies gap state
 * 6. Returns complete package
 */
export async function assembleKnowledge(input: {
  /** Capability query results (pre-executed) */
  queryResults: Map<string, any>;

  /** What was queried and the outcomes */
  queried: QueriedIntentOutcome[];

  /** User's current context */
  contextFrame: ContextFrame;

  /** Guidance suggestions (pre-built) */
  guidance: GuidanceSuggestion[];

  /** Discovery responses (pre-built) */
  discoveries: NativeDiscoveryResponse[];

  /** User utterance (for composition context) */
  utterance: string;

  /** For logging */
  userId: number;
}): Promise<KnowledgePackage> {
  // TIER 1: Direct answer — do any capabilities have data?
  const answerData: Record<string, string> = {};
  for (const [cap, result] of Array.from(input.queryResults.entries())) {
    if (result.data) {
      answerData[cap] = result.data;
    }
  }

  // Check if we have any direct success data
  const hasDirectData = input.queried.some(q => q.status === "ok-data");

  // TIER 2–3: Enrichments
  // For now, this is a pass-through stub (COMP5 Phase 2).
  // Future implementation will call composition orchestrator.
  const enrichments: EnrichmentItem[] = [];

  // CLASSIFY GAP STATE (after searching Tiers 1–3)
  // This is the key change from COMP4A4: gap is determined AFTER
  // we've looked for enrichments, not before.
  const fallbackState = classifyTurn(input.queried);

  // If there's a gap, create a reason (for voicing)
  let gapReason: string | undefined;
  if (fallbackState) {
    gapReason = describeGapReason(fallbackState, input.queried);
  }

  return {
    answerData,
    enrichments,
    gapState: fallbackState,
    gapReason,
    queriedCapabilities: input.queried,
    guidance: input.guidance,
    discoveries: input.discoveries,
    isSuccess: hasDirectData && fallbackState === null,
  };
}

/**
 * Describe why a gap occurred (for honest gap voicing).
 * This gives the Behaviour Engine context for how to phrase the gap.
 */
function describeGapReason(
  state: UnsuccessfulTurnState,
  queried: QueriedIntentOutcome[]
): string {
  switch (state) {
    case "no-route":
      return "The question didn't match any capability.";
    case "no-knowledge":
      return "The queried capabilities don't have data to answer this.";
    case "no-results":
      return "The search found no matching results.";
    case "internal-error":
      return "An internal error occurred while processing the question.";
    default:
      return "No information available.";
  }
}

/**
 * Apply Silence Rules to enrichments.
 * - De-duplicate by source
 * - Cap at max count
 * - Sort by priority
 */
export function applySilenceRules(
  items: EnrichmentItem[],
  maxCount: number = 3
): EnrichmentItem[] {
  // De-duplicate by source (keep first)
  const seen = new Set<string>();
  const deduped = items.filter(item => {
    if (seen.has(item.source)) return false;
    seen.add(item.source);
    return true;
  });

  // Sort by priority and cap
  return deduped
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxCount);
}
