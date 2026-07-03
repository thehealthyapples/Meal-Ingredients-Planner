/**
 * companion-gap-classifier.ts — INT35C Governed Companion Learning & Dashboard
 * =============================================================================
 * A PURE classification layer over INT35B's `CompanionObservabilitySummary` and
 * the raw INT35 miss log. It answers the question INT35B's two-bucket split
 * (matcher backlog vs routing failures) could not: WHY did the Companion fail?
 *
 *   - "resolver-gap"     : the Intent Resolver did not understand the question
 *                          at all (a genuine matcher-coverage gap).
 *   - "clarification"    : the resolver DID understand, but the question was
 *                          ambiguous or needed one more detail from the user —
 *                          not a miss to fix, a normal conversational turn.
 *   - "capability-gap"   : the resolver routed correctly, but the target
 *                          (capability, verb) is not executable today — a
 *                          product/code gap (checked against the live,
 *                          canonical Intelligence Platform's Capability
 *                          Registry — never a private copy of it).
 *   - "knowledge-gap"    : the (capability, verb) IS executable, but the
 *                          platform returned an honest "no-knowledge" outcome
 *                          — the feature exists, the stored content doesn't.
 *   - "platform-failure" : a genuine fault (thrown error), not an honest gap.
 *
 * HARD BOUNDARIES (same discipline as companion-observability.ts):
 *  - No storage reads, no writes, no LLM calls, no business logic.
 *  - Reads the canonical `intelligencePlatform` singleton READ-ONLY
 *    (`canExecute`, `registry.findGap`) — it never binds a handler, never
 *    constructs a second registry, and cannot influence routing.
 *  - Every input it accepts (`CompanionObservabilitySummary`, the raw log) is
 *    already privacy-safe per INT35/INT35B; this module adds no new data
 *    source, so it cannot leak anything the log did not already retain.
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-learning.ts
 */

import { intelligencePlatform } from "../intelligence-platform.js";
import type { IntentVerb } from "../types.js";
import {
  summarizeCompanionHealth,
  normalizeUtterance,
  type CompanionObservabilitySummary,
  type UnmatchedUtteranceGroup,
  type RoutingFailureGroup,
} from "./companion-observability.js";
import {
  getUnsuccessfulQueryLog,
  type UnsuccessfulQueryLogEntry,
} from "./turn-fallback.js";
import type { ConversationSurface } from "./conversation-store.js";

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

export interface CapabilityGapEntry extends RoutingFailureGroup {
  /** The Capability Registry's own recorded reason for this gap, when one exists. */
  readonly reason?: string;
}

export interface CompanionGapClassification {
  /** Genuine "did not understand" misses — the resolver's matcher backlog. */
  readonly resolverGaps: readonly UnmatchedUtteranceGroup[];
  /** Understood, but the resolver correctly asked the user for one more detail. */
  readonly clarifications: readonly UnmatchedUtteranceGroup[];
  /** Understood + routed, but the target capability/verb is not executable yet. */
  readonly capabilityGaps: readonly CapabilityGapEntry[];
  /** Understood + executable, but no trusted stored knowledge answered the ask. */
  readonly knowledgeGaps: readonly RoutingFailureGroup[];
  /** Genuine faults — not honest gaps. */
  readonly platformFailures: readonly RoutingFailureGroup[];
  readonly counts: {
    readonly resolverGapCount: number;
    readonly clarificationCount: number;
    readonly capabilityGapCount: number;
    readonly knowledgeGapCount: number;
    readonly platformFailureCount: number;
  };
}

// ---------------------------------------------------------------------------
// Resolver-gap vs clarification split (reads the raw log — the summary alone
// does not carry gapKind)
// ---------------------------------------------------------------------------

const CLARIFICATION_KINDS = new Set(["ambiguous", "needs-clarification"]);

function splitUnmatchedByGapKind(
  log: readonly UnsuccessfulQueryLogEntry[],
): { resolverGaps: UnmatchedUtteranceGroup[]; clarifications: UnmatchedUtteranceGroup[] } {
  const buckets = {
    resolverGaps: new Map<string, { count: number; surfaces: Map<ConversationSurface, number> }>(),
    clarifications: new Map<string, { count: number; surfaces: Map<ConversationSurface, number> }>(),
  };

  for (const entry of log) {
    const isUnmatchedShaped =
      entry.stage === "resolver-unmatched" ||
      (entry.stage === "turn-fallback" && entry.state === "no-route");
    if (!isUnmatchedShaped) continue;

    const key = normalizeUtterance(entry.utterance);
    if (!key) continue;

    const bucket = entry.gapKind && CLARIFICATION_KINDS.has(entry.gapKind)
      ? buckets.clarifications
      : buckets.resolverGaps;

    const existing = bucket.get(key) ?? { count: 0, surfaces: new Map<ConversationSurface, number>() };
    existing.count += 1;
    existing.surfaces.set(entry.surface, (existing.surfaces.get(entry.surface) ?? 0) + 1);
    bucket.set(key, existing);
  }

  const toGroups = (bucket: Map<string, { count: number; surfaces: Map<ConversationSurface, number> }>): UnmatchedUtteranceGroup[] =>
    Array.from(bucket.entries())
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .map(([utterance, { count, surfaces }]) => ({
        utterance,
        count,
        surfaces: Array.from(surfaces.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([surface]) => surface),
      }));

  return {
    resolverGaps: toGroups(buckets.resolverGaps),
    clarifications: toGroups(buckets.clarifications),
  };
}

// ---------------------------------------------------------------------------
// Routing-failure split: capability-gap / knowledge-gap / platform-failure
// ---------------------------------------------------------------------------

function classifyRoutingFailures(routingFailures: readonly RoutingFailureGroup[]): {
  capabilityGaps: CapabilityGapEntry[];
  knowledgeGaps: RoutingFailureGroup[];
  platformFailures: RoutingFailureGroup[];
} {
  const capabilityGaps: CapabilityGapEntry[] = [];
  const knowledgeGaps: RoutingFailureGroup[] = [];
  const platformFailures: RoutingFailureGroup[] = [];

  for (const group of routingFailures) {
    const verb = group.verb as IntentVerb;
    if (!intelligencePlatform.canExecute(group.capability, verb)) {
      const gap = intelligencePlatform.registry.findGap(group.capability, verb);
      capabilityGaps.push({ ...group, ...(gap ? { reason: gap.reason } : {}) });
    } else if (group.statuses.includes("no-knowledge")) {
      knowledgeGaps.push(group);
    } else {
      platformFailures.push(group);
    }
  }

  return { capabilityGaps, knowledgeGaps, platformFailures };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

const sumCounts = (groups: readonly { count: number }[]): number =>
  groups.reduce((acc, g) => acc + g.count, 0);

/**
 * Classify the current Companion misses into the five gap categories. Pure —
 * reads the live log/summary and the canonical registry, writes nothing.
 */
export function classifyGaps(
  log: readonly UnsuccessfulQueryLogEntry[] = getUnsuccessfulQueryLog(),
  summary: CompanionObservabilitySummary = summarizeCompanionHealth(log),
): CompanionGapClassification {
  const { resolverGaps, clarifications } = splitUnmatchedByGapKind(log);
  const { capabilityGaps, knowledgeGaps, platformFailures } = classifyRoutingFailures(summary.routingFailures);

  return {
    resolverGaps,
    clarifications,
    capabilityGaps,
    knowledgeGaps,
    platformFailures,
    counts: {
      resolverGapCount: sumCounts(resolverGaps),
      clarificationCount: sumCounts(clarifications),
      capabilityGapCount: sumCounts(capabilityGaps),
      knowledgeGapCount: sumCounts(knowledgeGaps),
      platformFailureCount: sumCounts(platformFailures),
    },
  };
}

// ---------------------------------------------------------------------------
// Rate metrics — overall understanding / successful conversation / clarification
// ---------------------------------------------------------------------------

export interface CompanionRateMetrics {
  /** Turns considered — the denominator (from conversation-store.countTurnsSince). */
  readonly totalTurns: number;
  readonly totalUnsuccessfulTurns: number;
  /**
   * Share of turns where the resolver produced a route at all (i.e. NOT a
   * resolver-gap). A clarification turn counts as "understood" — the resolver
   * correctly identified what it needed, it just isn't answerable yet.
   * `null` when there is no turn volume to divide by (honest "no data" state).
   */
  readonly understandingRate: number | null;
  /** Share of turns that reached a real, grounded answer (none of the five gap categories). */
  readonly successfulConversationRate: number | null;
  /** Share of turns where the resolver asked the user for one more detail. */
  readonly clarificationRate: number | null;
}

/**
 * Derive headline dashboard rates from a gap classification + turn volume.
 *
 * ACCEPTED APPROXIMATION (documented, not hidden): the classification's counts
 * are event/shape counts from the bounded INT35 miss log (a ring buffer of the
 * most recent misses, and — for routingFailures — a count of failing
 * (capability, verb) occurrences, which can exceed 1 per turn when a turn
 * queries more than one capability). `totalTurns` should be counted over the
 * same window the log currently spans (its `windowStart`) for the rates to be
 * meaningful. See INT35C implementation doc §"Behavioural notes" for the
 * full trade-off discussion.
 */
export function computeRateMetrics(
  classification: CompanionGapClassification,
  totalTurns: number,
): CompanionRateMetrics {
  if (totalTurns <= 0) {
    return {
      totalTurns: 0,
      totalUnsuccessfulTurns: 0,
      understandingRate: null,
      successfulConversationRate: null,
      clarificationRate: null,
    };
  }
  const { resolverGapCount, clarificationCount, capabilityGapCount, knowledgeGapCount, platformFailureCount } =
    classification.counts;
  const totalUnsuccessfulTurns =
    resolverGapCount + clarificationCount + capabilityGapCount + knowledgeGapCount + platformFailureCount;

  const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

  return {
    totalTurns,
    totalUnsuccessfulTurns,
    understandingRate: clamp01((totalTurns - resolverGapCount) / totalTurns),
    successfulConversationRate: clamp01((totalTurns - totalUnsuccessfulTurns) / totalTurns),
    clarificationRate: clamp01(clarificationCount / totalTurns),
  };
}
