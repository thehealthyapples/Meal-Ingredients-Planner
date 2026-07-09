/**
 * observation-store.ts — OBS1 Observation Engine
 * ================================================
 * Sole owner of the `platform_observations` table: the single durable store of
 * runtime observations across the Intelligence Platform. Everything the
 * Observation Admin Workbench reads, and everything the capture points write,
 * flows through this store — there is no second telemetry table. (The
 * never-created `platform_turn_outcomes` design from EWO-PRO1 is retired by
 * OBS1 in favour of this store.)
 *
 * HARD BOUNDARIES:
 *  - Writes are fire-and-forget from the engine's `recordObservation` seam: a
 *    database problem must NEVER fail, slow, or alter the observed operation.
 *  - Bounded retention: rows older than RETENTION_DAYS and rows beyond
 *    MAX_ROWS (newest kept) are pruned opportunistically after writes — the
 *    durable log is an operational window, not an unbounded archive.
 *  - Privacy: the store persists exactly what it is given; the privacy rules
 *    (no utterance or result payload stored next to a user id) are enforced at
 *    the capture points and documented in observation-engine.ts.
 *
 * The store contract and the in-memory test double live in
 * observation-contract.ts, which must stay importable without a database.
 *
 * Run tests: npx tsx server/tests/test-intelligence-observation-telemetry.ts
 */

import { and, desc, eq, gte, ilike, lt, sql, or, type SQL } from "drizzle-orm";
import { db } from "../../db.js";
import {
  platformObservations,
  type InsertPlatformObservation,
  type PlatformObservation,
} from "@shared/schema";
import type { IObservationStore, ObservationFilter } from "./observation-contract.js";

/** Rows older than this are pruned. */
const RETENTION_DAYS = 30;
/** Hard cap on retained rows (newest kept), whatever their age. */
const MAX_ROWS = 50_000;
/** Prune once every N successful writes (cheap opportunistic maintenance). */
const PRUNE_EVERY_N_WRITES = 100;

export class DatabaseObservationStore implements IObservationStore {
  private writesSincePrune = 0;

  async record(observation: InsertPlatformObservation): Promise<void> {
    await db.insert(platformObservations).values(observation);

    this.writesSincePrune += 1;
    if (this.writesSincePrune >= PRUNE_EVERY_N_WRITES) {
      this.writesSincePrune = 0;
      // Fire-and-forget: retention maintenance never blocks the write path.
      this.prune().catch((err) =>
        console.error("[ObservationStore] prune failed:", err),
      );
    }
  }

  async listSince(since: Date, limit = 50_000): Promise<PlatformObservation[]> {
    return db
      .select()
      .from(platformObservations)
      .where(gte(platformObservations.observedAt, since))
      .orderBy(platformObservations.observedAt, platformObservations.id)
      .limit(Math.min(Math.max(limit, 1), MAX_ROWS));
  }

  async listRecent(filter: ObservationFilter = {}): Promise<PlatformObservation[]> {
    const conditions: SQL[] = [];
    if (filter.kind) conditions.push(eq(platformObservations.kind, filter.kind));
    if (filter.capability) conditions.push(eq(platformObservations.capability, filter.capability));
    if (filter.severity) conditions.push(eq(platformObservations.severity, filter.severity));
    if (filter.sessionId) conditions.push(eq(platformObservations.sessionId, filter.sessionId));
    if (filter.since) conditions.push(gte(platformObservations.observedAt, filter.since));
    if (filter.q) {
      const pattern = `%${filter.q}%`;
      const textMatch = or(
        ilike(platformObservations.capability, pattern),
        ilike(platformObservations.verb, pattern),
        ilike(platformObservations.intent, pattern),
        ilike(platformObservations.outcome, pattern),
        ilike(platformObservations.recoveryPath, pattern),
        ilike(platformObservations.kind, pattern),
      );
      if (textMatch) conditions.push(textMatch);
    }

    return db
      .select()
      .from(platformObservations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(platformObservations.observedAt), desc(platformObservations.id))
      .limit(Math.min(Math.max(filter.limit ?? 200, 1), 1000));
  }

  async countByKindSince(since: Date): Promise<{ total: number; byKind: Record<string, number> }> {
    const rows = await db
      .select({
        kind: platformObservations.kind,
        count: sql<number>`count(*)::int`,
      })
      .from(platformObservations)
      .where(gte(platformObservations.observedAt, since))
      .groupBy(platformObservations.kind);

    const byKind: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      byKind[row.kind] = row.count;
      total += row.count;
    }
    return { total, byKind };
  }

  /** Bounded retention: drop rows past the window, and rows beyond the cap. */
  async prune(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await db.delete(platformObservations).where(lt(platformObservations.observedAt, cutoff));
    await db.execute(sql`
      DELETE FROM platform_observations
      WHERE id IN (
        SELECT id FROM platform_observations
        ORDER BY observed_at DESC, id DESC
        OFFSET ${MAX_ROWS}
      )
    `);
  }
}

/** The one durable store instance (lazily connects on first write/read). */
export const observationStore = new DatabaseObservationStore();
