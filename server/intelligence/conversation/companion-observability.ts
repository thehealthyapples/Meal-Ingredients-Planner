/**
 * companion-observability.ts — INT35B Companion Learning & Observability
 * =======================================================================
 * A PURE aggregation over the bounded, privacy-safe unsuccessful-query log that
 * INT35 already records (turn-fallback.ts). It turns the raw ring buffer into a
 * diagnostic summary an operator (or the matcher-suggester) can read to answer:
 *
 *   • How often is the Companion failing, and in which of the four states?
 *   • Which surfaces produce the most misses?
 *   • Which exact utterances did the resolver fail to understand (the matcher
 *     backlog), and how frequently?
 *   • Which routed capabilities are returning gaps / faults (routing failures)?
 *
 * HARD BOUNDARIES (inherited from INT35's log discipline):
 *  - No storage reads, no platform calls, no LLM calls, no business logic. This
 *    module only READS the in-memory log and counts.
 *  - It can surface nothing the log did not already retain: the log carries the
 *    utterance (truncated), surface, stage, state and routing shape — and NEVER
 *    a user id, household id, intent parameters, or capability result payloads.
 *    This module therefore cannot leak sensitive data by construction — it never
 *    receives any.
 *  - Read-only: it never modifies the log, the resolver, or production routing.
 *
 * Run tests: npx tsx server/tests/test-intelligence-observability.ts
 */

import {
  getUnsuccessfulQueryLog,
  type UnsuccessfulQueryLogEntry,
  type UnsuccessfulTurnState,
} from "./turn-fallback.js";
import type { ConversationSurface } from "./conversation-store.js";

// ---------------------------------------------------------------------------
// Public summary contract
// ---------------------------------------------------------------------------

/** One normalised, grouped unmatched utterance with its frequency. */
export interface UnmatchedUtteranceGroup {
  /** The normalised utterance (lower-cased, whitespace-collapsed, trailing punctuation stripped). */
  readonly utterance: string;
  /** How many times an utterance normalising to this text was logged. */
  readonly count: number;
  /** Surfaces the utterance was asked from, most frequent first. */
  readonly surfaces: readonly ConversationSurface[];
}

/** One routed (capability, verb) shape that failed, with its failure count. */
export interface RoutingFailureGroup {
  readonly capability: string;
  readonly verb: string;
  /** The observed non-success statuses for this shape (e.g. "no-knowledge", "error"). */
  readonly statuses: readonly string[];
  readonly count: number;
}

/** The full diagnostic summary of Companion misses. */
export interface CompanionObservabilitySummary {
  /** Total log events considered. */
  readonly totalEvents: number;
  /** ISO timestamp of the oldest / newest retained event, or null when empty. */
  readonly windowStart: string | null;
  readonly windowEnd: string | null;
  /** Event counts per stage. */
  readonly byStage: Readonly<Record<UnsuccessfulQueryLogEntry["stage"], number>>;
  /** Turn-fallback counts per canonical state. */
  readonly byState: Readonly<Record<UnsuccessfulTurnState, number>>;
  /** Miss counts per surface, most frequent first. */
  readonly bySurface: readonly { surface: ConversationSurface; count: number }[];
  /**
   * The matcher backlog: utterances the resolver did not understand, grouped and
   * ranked by frequency. Sourced from resolver-unmatched events and no-route
   * turn-fallbacks — precisely the utterances future matcher work should cover.
   */
  readonly topUnmatchedUtterances: readonly UnmatchedUtteranceGroup[];
  /**
   * Routing failures: routed capability/verb shapes that came back no-knowledge
   * or error (understood, but the platform could not answer). Distinct from the
   * matcher backlog — these are capability-side gaps, not resolver misses.
   */
  readonly routingFailures: readonly RoutingFailureGroup[];
}

// ---------------------------------------------------------------------------
// Utterance normalisation (grouping key)
// ---------------------------------------------------------------------------

/**
 * Normalise an utterance so trivially-different phrasings group together:
 * lower-case, collapse internal whitespace, strip surrounding whitespace and
 * trailing sentence punctuation. Deliberately conservative — it does NOT stem
 * or drop stop-words, so the grouped text stays faithful to what the user typed
 * (that fidelity is what makes it a usable matcher backlog).
 */
export function normalizeUtterance(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?.!,;:]+$/g, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** Cap on the number of distinct unmatched-utterance groups returned. */
const MAX_UNMATCHED_GROUPS = 25;
/** Cap on the number of routing-failure groups returned. */
const MAX_ROUTING_FAILURE_GROUPS = 25;

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

function surfacesByFrequency(counts: Map<ConversationSurface, number>): ConversationSurface[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([surface]) => surface);
}

/**
 * Build the diagnostic summary. Defaults to the live in-memory log; a caller
 * (or a test) may pass an explicit log slice. Pure — no side effects.
 */
export function summarizeCompanionHealth(
  log: readonly UnsuccessfulQueryLogEntry[] = getUnsuccessfulQueryLog(),
): CompanionObservabilitySummary {
  const byStage: Record<UnsuccessfulQueryLogEntry["stage"], number> = {
    "resolver-unmatched": 0,
    "turn-fallback": 0,
  };
  const byState: Record<UnsuccessfulTurnState, number> = {
    "no-route": 0,
    "no-knowledge": 0,
    "no-results": 0,
    "internal-error": 0,
  };
  const surfaceCounts = new Map<ConversationSurface, number>();

  // Unmatched utterance grouping (resolver backlog).
  const utteranceCount = new Map<string, number>();
  const utteranceSurfaces = new Map<string, Map<ConversationSurface, number>>();

  // Routing-failure grouping.
  const routingCount = new Map<string, number>();
  const routingStatuses = new Map<string, Set<string>>();

  for (const entry of log) {
    byStage[entry.stage] = (byStage[entry.stage] ?? 0) + 1;
    if (entry.state) byState[entry.state] = (byState[entry.state] ?? 0) + 1;
    surfaceCounts.set(entry.surface, (surfaceCounts.get(entry.surface) ?? 0) + 1);

    // Matcher backlog: resolver could not understand the utterance.
    const isResolverMiss =
      entry.stage === "resolver-unmatched" ||
      (entry.stage === "turn-fallback" && entry.state === "no-route");
    if (isResolverMiss) {
      const key = normalizeUtterance(entry.utterance);
      if (key) {
        utteranceCount.set(key, (utteranceCount.get(key) ?? 0) + 1);
        const surf = utteranceSurfaces.get(key) ?? new Map<ConversationSurface, number>();
        surf.set(entry.surface, (surf.get(entry.surface) ?? 0) + 1);
        utteranceSurfaces.set(key, surf);
      }
    }

    // Routing failures: understood, but a routed capability could not answer.
    if (entry.stage === "turn-fallback" && (entry.state === "no-knowledge" || entry.state === "internal-error")) {
      for (const i of entry.intents) {
        if (!i.status || i.status === "ok-data" || i.status === "ok-empty") continue;
        const key = `${i.capability}::${i.verb}`;
        routingCount.set(key, (routingCount.get(key) ?? 0) + 1);
        const set = routingStatuses.get(key) ?? new Set<string>();
        set.add(i.status);
        routingStatuses.set(key, set);
      }
    }
  }

  const topUnmatchedUtterances: UnmatchedUtteranceGroup[] = Array.from(utteranceCount.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_UNMATCHED_GROUPS)
    .map(([utterance, count]) => ({
      utterance,
      count,
      surfaces: surfacesByFrequency(utteranceSurfaces.get(utterance) ?? new Map()),
    }));

  const routingFailures: RoutingFailureGroup[] = Array.from(routingCount.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_ROUTING_FAILURE_GROUPS)
    .map(([key, count]) => {
      const [capability, verb] = key.split("::");
      return {
        capability,
        verb,
        statuses: Array.from(routingStatuses.get(key) ?? new Set<string>()).sort(),
        count,
      };
    });

  const bySurface = Array.from(surfaceCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([surface, count]) => ({ surface, count }));

  return {
    totalEvents: log.length,
    windowStart: log.length > 0 ? log[0].timestamp : null,
    windowEnd: log.length > 0 ? log[log.length - 1].timestamp : null,
    byStage,
    byState,
    bySurface,
    topUnmatchedUtterances,
    routingFailures,
  };
}

/**
 * The plain utterance backlog — the ranked list of normalised utterances the
 * resolver failed to understand. Convenience wrapper the matcher-suggester reads
 * so it never needs the full summary shape. Read-only, most-frequent first.
 */
export function unmatchedUtteranceBacklog(
  log?: readonly UnsuccessfulQueryLogEntry[],
): readonly string[] {
  return summarizeCompanionHealth(log).topUnmatchedUtterances.map((g) => g.utterance);
}
