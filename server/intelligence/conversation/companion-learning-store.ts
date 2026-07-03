/**
 * companion-learning-store.ts — INT35C Governed Companion Learning & Dashboard
 * ==============================================================================
 * The SOLE owner of the two INT35C tables — `companion_health_snapshots` and
 * `companion_learning_recommendations` (see
 * docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md). No other
 * module reads or writes these tables directly.
 *
 * Mirrors conversation-store.ts's discipline (INT18 Risk R5): an
 * `ICompanionLearningStore` interface keeps database coupling out of tests.
 * `InMemoryCompanionLearningStore` implements the same interface for unit
 * tests, so `npm test` needs no live database for this module, same as the
 * rest of the Intelligence test suite.
 *
 * Both tables inherit the INT35/INT35B privacy discipline: a snapshot is an
 * aggregate capture of the (already privacy-safe) observability summary and
 * gap classification — no user id, no household id, no intent parameters, no
 * capability result payloads. A recommendation's payload is an advisory
 * proposal (from matcher-suggester.ts / companion-learning-recommender.ts) —
 * never a routing change.
 *
 * THE HARD RULE THIS STORE ENFORCES (INT35B, inherited unchanged):
 *   `reviewRecommendation` writes ONLY status/reviewedBy/reviewedAt/reviewNotes.
 *   It has no path to any other file — approving a recommendation changes its
 *   place in this queue, nothing else. Acting on an approved recommendation
 *   (e.g. editing PatternIntentResolver) remains a separate, human,
 *   code-reviewed change outside this module.
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-learning.ts
 */

import { eq, desc } from "drizzle-orm";
import { db } from "../../db.js";
import {
  companionHealthSnapshots,
  companionLearningRecommendations,
  type CompanionHealthSnapshot,
  type CompanionLearningRecommendation,
} from "../../../shared/schema.js";
import type {
  CompanionObservabilitySummary,
  UnmatchedUtteranceGroup,
} from "./companion-observability.js";
import type { CompanionGapClassification } from "./companion-gap-classifier.js";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface RecordSnapshotInput {
  readonly totalTurns: number;
  readonly summary: CompanionObservabilitySummary;
  readonly classification: CompanionGapClassification;
}

export type RecommendationKind = "matcher" | "capability" | "regression-test";
export type RecommendationStatus = "pending" | "approved" | "rejected" | "completed";

export interface NewRecommendation {
  readonly snapshotId: number;
  readonly kind: RecommendationKind;
  readonly payload: Record<string, unknown>;
  readonly rationale: string;
  readonly confidence: "low" | "medium" | "high";
}

export interface ListRecommendationsFilter {
  readonly status?: RecommendationStatus;
  readonly limit?: number;
}

// ---------------------------------------------------------------------------
// ICompanionLearningStore — keeps database coupling out of tests
// ---------------------------------------------------------------------------

export interface ICompanionLearningStore {
  /** Persist one point-in-time capture of Companion health. Aggregate counts only. */
  recordSnapshot(input: RecordSnapshotInput): Promise<CompanionHealthSnapshot>;
  /** Most recent snapshots first, bounded by `limit`. */
  listHealthSnapshots(limit?: number): Promise<CompanionHealthSnapshot[]>;
  /** Insert a batch of advisory recommendations, all starting `status: "pending"`. */
  insertRecommendations(items: readonly NewRecommendation[]): Promise<CompanionLearningRecommendation[]>;
  listRecommendations(filter?: ListRecommendationsFilter): Promise<CompanionLearningRecommendation[]>;
  getRecommendation(id: number): Promise<CompanionLearningRecommendation | undefined>;
  /**
   * Review a recommendation. Writes ONLY status/reviewedBy/reviewedAt/reviewNotes
   * — see the module header hard rule. Never touches any other file or table.
   */
  reviewRecommendation(
    id: number,
    status: Exclude<RecommendationStatus, "pending">,
    adminUserId: number,
    notes?: string,
  ): Promise<CompanionLearningRecommendation | undefined>;
  countRecommendationsByStatus(): Promise<Record<RecommendationStatus, number>>;
}

const EMPTY_STATUS_COUNTS: Record<RecommendationStatus, number> = {
  pending: 0, approved: 0, rejected: 0, completed: 0,
};

// ---------------------------------------------------------------------------
// DatabaseCompanionLearningStore — production implementation
// ---------------------------------------------------------------------------

export class DatabaseCompanionLearningStore implements ICompanionLearningStore {
  async recordSnapshot(input: RecordSnapshotInput): Promise<CompanionHealthSnapshot> {
    const [row] = await db
      .insert(companionHealthSnapshots)
      .values({
        totalEvents: input.summary.totalEvents,
        totalTurns: input.totalTurns,
        byStage: input.summary.byStage,
        byState: input.summary.byState,
        bySurface: input.summary.bySurface,
        gapCounts: input.classification.counts,
        topUnmatchedUtterances: input.summary.topUnmatchedUtterances,
        routingFailures: input.summary.routingFailures,
        capabilityGapClusters: input.classification.capabilityGaps,
      })
      .returning();
    return row;
  }

  async listHealthSnapshots(limit = 30): Promise<CompanionHealthSnapshot[]> {
    return db
      .select()
      .from(companionHealthSnapshots)
      .orderBy(desc(companionHealthSnapshots.createdAt))
      .limit(limit);
  }

  async insertRecommendations(items: readonly NewRecommendation[]): Promise<CompanionLearningRecommendation[]> {
    if (items.length === 0) return [];
    return db
      .insert(companionLearningRecommendations)
      .values(items.map((r) => ({
        snapshotId: r.snapshotId,
        kind: r.kind,
        payload: r.payload,
        rationale: r.rationale,
        confidence: r.confidence,
        status: "pending" as const,
      })))
      .returning();
  }

  async listRecommendations(filter: ListRecommendationsFilter = {}): Promise<CompanionLearningRecommendation[]> {
    const query = db.select().from(companionLearningRecommendations);
    return filter.status
      ? query.where(eq(companionLearningRecommendations.status, filter.status)).orderBy(desc(companionLearningRecommendations.createdAt)).limit(filter.limit ?? 200)
      : query.orderBy(desc(companionLearningRecommendations.createdAt)).limit(filter.limit ?? 200);
  }

  async getRecommendation(id: number): Promise<CompanionLearningRecommendation | undefined> {
    const [row] = await db
      .select()
      .from(companionLearningRecommendations)
      .where(eq(companionLearningRecommendations.id, id))
      .limit(1);
    return row;
  }

  async reviewRecommendation(
    id: number,
    status: Exclude<RecommendationStatus, "pending">,
    adminUserId: number,
    notes?: string,
  ): Promise<CompanionLearningRecommendation | undefined> {
    const [row] = await db
      .update(companionLearningRecommendations)
      .set({ status, reviewedBy: adminUserId, reviewedAt: new Date(), reviewNotes: notes ?? null })
      .where(eq(companionLearningRecommendations.id, id))
      .returning();
    return row;
  }

  async countRecommendationsByStatus(): Promise<Record<RecommendationStatus, number>> {
    const all = await db.select().from(companionLearningRecommendations);
    const counts = { ...EMPTY_STATUS_COUNTS };
    for (const row of all) {
      const status = row.status as RecommendationStatus;
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }
}

/** The canonical singleton. Import this in production code (routes.ts). */
export const companionLearningStore = new DatabaseCompanionLearningStore();

// ---------------------------------------------------------------------------
// InMemoryCompanionLearningStore — for unit tests (no database required)
// ---------------------------------------------------------------------------

export class InMemoryCompanionLearningStore implements ICompanionLearningStore {
  private snapshots: CompanionHealthSnapshot[] = [];
  private recommendations: CompanionLearningRecommendation[] = [];
  private nextSnapshotId = 1;
  private nextRecommendationId = 1;

  async recordSnapshot(input: RecordSnapshotInput): Promise<CompanionHealthSnapshot> {
    const row = {
      id: this.nextSnapshotId++,
      totalEvents: input.summary.totalEvents,
      totalTurns: input.totalTurns,
      byStage: input.summary.byStage,
      byState: input.summary.byState,
      bySurface: input.summary.bySurface,
      gapCounts: input.classification.counts,
      topUnmatchedUtterances: input.summary.topUnmatchedUtterances,
      routingFailures: input.summary.routingFailures,
      capabilityGapClusters: input.classification.capabilityGaps,
      createdAt: new Date(),
    } as unknown as CompanionHealthSnapshot;
    this.snapshots.push(row);
    return row;
  }

  async listHealthSnapshots(limit = 30): Promise<CompanionHealthSnapshot[]> {
    return this.snapshots
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id)
      .slice(0, limit);
  }

  async insertRecommendations(items: readonly NewRecommendation[]): Promise<CompanionLearningRecommendation[]> {
    const rows = items.map((r) => ({
      id: this.nextRecommendationId++,
      snapshotId: r.snapshotId,
      kind: r.kind,
      payload: r.payload,
      rationale: r.rationale,
      confidence: r.confidence,
      status: "pending" as const,
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
    } as unknown as CompanionLearningRecommendation));
    this.recommendations.push(...rows);
    return rows;
  }

  async listRecommendations(filter: ListRecommendationsFilter = {}): Promise<CompanionLearningRecommendation[]> {
    const rows = this.recommendations
      .filter((r) => !filter.status || r.status === filter.status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id);
    return rows.slice(0, filter.limit ?? 200);
  }

  async getRecommendation(id: number): Promise<CompanionLearningRecommendation | undefined> {
    return this.recommendations.find((r) => r.id === id);
  }

  async reviewRecommendation(
    id: number,
    status: Exclude<RecommendationStatus, "pending">,
    adminUserId: number,
    notes?: string,
  ): Promise<CompanionLearningRecommendation | undefined> {
    const row = this.recommendations.find((r) => r.id === id);
    if (!row) return undefined;
    const updated = { ...row, status, reviewedBy: adminUserId, reviewedAt: new Date(), reviewNotes: notes ?? null };
    this.recommendations = this.recommendations.map((r) => (r.id === id ? updated : r));
    return updated;
  }

  async countRecommendationsByStatus(): Promise<Record<RecommendationStatus, number>> {
    const counts = { ...EMPTY_STATUS_COUNTS };
    for (const row of this.recommendations) {
      const status = row.status as RecommendationStatus;
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  /** Test hook — clear all in-memory state. */
  reset(): void {
    this.snapshots = [];
    this.recommendations = [];
    this.nextSnapshotId = 1;
    this.nextRecommendationId = 1;
  }
}

// ---------------------------------------------------------------------------
// Trend — "fastest-growing intent gaps" / improvement history (pure, source-agnostic)
// ---------------------------------------------------------------------------

export interface IntentGapTrendEntry {
  readonly utterance: string;
  readonly currentCount: number;
  readonly previousCount: number;
  readonly growth: number;
}

export interface TrendResult {
  /** False when fewer than two snapshots exist — an honest "not enough history" state. */
  readonly available: boolean;
  readonly note: string;
  readonly fastestGrowingGaps: readonly IntentGapTrendEntry[];
}

/**
 * Compare the two most recent snapshots' unmatched-utterance backlogs. Requires
 * at least two persisted snapshots — with fewer, returns an honest empty result
 * rather than inventing a trend from a single data point (Architecture
 * Principle 6 — honest gaps over fabricated information).
 */
export function computeTrend(snapshotsMostRecentFirst: readonly CompanionHealthSnapshot[]): TrendResult {
  if (snapshotsMostRecentFirst.length < 2) {
    return {
      available: false,
      note: "Not enough history yet — at least two snapshots are needed to compute a trend.",
      fastestGrowingGaps: [],
    };
  }
  const [current, previous] = snapshotsMostRecentFirst;
  const currentGroups = (current.topUnmatchedUtterances as UnmatchedUtteranceGroup[]) ?? [];
  const previousGroups = (previous.topUnmatchedUtterances as UnmatchedUtteranceGroup[]) ?? [];
  const currentMap = new Map(currentGroups.map((g) => [g.utterance, g.count]));
  const previousMap = new Map(previousGroups.map((g) => [g.utterance, g.count]));
  const utterances = new Set(Array.from(currentMap.keys()).concat(Array.from(previousMap.keys())));

  const fastestGrowingGaps: IntentGapTrendEntry[] = Array.from(utterances)
    .map((utterance) => {
      const currentCount = currentMap.get(utterance) ?? 0;
      const previousCount = previousMap.get(utterance) ?? 0;
      return { utterance, currentCount, previousCount, growth: currentCount - previousCount };
    })
    .filter((e) => e.growth > 0)
    .sort((a, b) => b.growth - a.growth || a.utterance.localeCompare(b.utterance))
    .slice(0, 25);

  return {
    available: true,
    note: "Growth compares the two most recently recorded snapshots.",
    fastestGrowingGaps,
  };
}
