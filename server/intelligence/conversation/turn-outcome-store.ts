/**
 * turn-outcome-store.ts — EWO-PRO1 Platform Resilience & Operations
 * ==================================================================
 * The durable, external sink for the platform's turn-outcome classification
 * log — closing the Observability gap named in the Platform Quality
 * Architecture (§2 "in-memory, unexported, no external sink"; §11.3).
 *
 * Sole owner of the `platform_turn_outcomes` table. The in-memory ring buffer
 * in turn-fallback.ts remains exactly what it was — a bounded, process-local
 * recent-window cache that the existing INT35B/C aggregations read — while
 * this store is the durable record that survives restarts and deploys, so
 * operational excellence (PQA §8) has evidence beyond one process's uptime.
 *
 * HARD BOUNDARIES:
 *  - Receives ONLY the already-PII-scrubbed log entry turn-fallback.ts built:
 *    no user id, no household id, no intent parameters, no result payloads.
 *    This store cannot leak what it never receives.
 *  - Writes are fire-and-forget from the sink: a database problem must NEVER
 *    fail, slow, or alter a user's conversation turn.
 *  - Bounded retention: rows older than RETENTION_DAYS and rows beyond
 *    MAX_ROWS (newest kept) are pruned opportunistically after writes —
 *    the durable log is an operational window, not an unbounded archive.
 *
 * Run tests: npx tsx server/tests/test-platform-turn-outcome-sink.ts
 */

import { desc, gte, lt, sql } from "drizzle-orm";
import { db } from "../../db.js";
import { platformTurnOutcomes, type PlatformTurnOutcome } from "@shared/schema";
import type { UnsuccessfulQueryLogEntry, UnsuccessfulTurnState } from "./turn-fallback.js";
import { setUnsuccessfulQuerySink } from "./turn-fallback.js";

/** Rows older than this are pruned. */
const RETENTION_DAYS = 30;
/** Hard cap on retained rows (newest kept), whatever their age. */
const MAX_ROWS = 5_000;
/** Prune once every N successful writes (cheap opportunistic maintenance). */
const PRUNE_EVERY_N_WRITES = 50;

export class DatabaseTurnOutcomeStore {
  private writesSincePrune = 0;

  /** Persist one already-scrubbed log entry. Throws on DB failure — callers decide isolation. */
  async record(entry: UnsuccessfulQueryLogEntry): Promise<void> {
    await db.insert(platformTurnOutcomes).values({
      stage: entry.stage,
      state: entry.state ?? null,
      gapKind: entry.gapKind ?? null,
      surface: entry.surface,
      utterance: entry.utterance,
      intents: entry.intents.map((i) => ({
        capability: i.capability,
        verb: i.verb,
        ...(i.status ? { status: i.status } : {}),
      })),
      createdAt: new Date(entry.timestamp),
    });

    this.writesSincePrune += 1;
    if (this.writesSincePrune >= PRUNE_EVERY_N_WRITES) {
      this.writesSincePrune = 0;
      // Fire-and-forget: retention maintenance never blocks the write path.
      this.prune().catch((err) =>
        console.error("[TurnOutcomeStore] prune failed:", err),
      );
    }
  }

  /** Most recent entries, newest first. */
  async listRecent(limit = 200): Promise<PlatformTurnOutcome[]> {
    return db
      .select()
      .from(platformTurnOutcomes)
      .orderBy(desc(platformTurnOutcomes.createdAt), desc(platformTurnOutcomes.id))
      .limit(Math.min(Math.max(limit, 1), 1000));
  }

  /**
   * Counts by canonical unsuccessful state since a timestamp — the operations
   * endpoint's "what failed, how often" answer (PQA §2 Observability).
   */
  async countByStateSince(since: Date): Promise<{
    total: number;
    byState: Record<UnsuccessfulTurnState, number>;
    byStage: Record<UnsuccessfulQueryLogEntry["stage"], number>;
  }> {
    const rows = await db
      .select({
        stage: platformTurnOutcomes.stage,
        state: platformTurnOutcomes.state,
        count: sql<number>`count(*)::int`,
      })
      .from(platformTurnOutcomes)
      .where(gte(platformTurnOutcomes.createdAt, since))
      .groupBy(platformTurnOutcomes.stage, platformTurnOutcomes.state);

    const byState: Record<UnsuccessfulTurnState, number> = {
      "no-route": 0,
      "no-knowledge": 0,
      "no-results": 0,
      "internal-error": 0,
    };
    const byStage: Record<UnsuccessfulQueryLogEntry["stage"], number> = {
      "resolver-unmatched": 0,
      "turn-fallback": 0,
    };
    let total = 0;
    for (const row of rows) {
      total += row.count;
      if (row.stage === "resolver-unmatched" || row.stage === "turn-fallback") {
        byStage[row.stage] += row.count;
      }
      if (row.state && row.state in byState) {
        byState[row.state as UnsuccessfulTurnState] += row.count;
      }
    }
    return { total, byState, byStage };
  }

  /** Apply the bounded-retention policy. Returns the number of rows deleted. */
  async prune(): Promise<number> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const aged = await db
      .delete(platformTurnOutcomes)
      .where(lt(platformTurnOutcomes.createdAt, cutoff))
      .returning({ id: platformTurnOutcomes.id });

    // Count cap: delete everything below the id of the MAX_ROWS-th newest row.
    const excess = await db.execute(sql`
      DELETE FROM platform_turn_outcomes
      WHERE id < COALESCE(
        (SELECT id FROM platform_turn_outcomes ORDER BY id DESC OFFSET ${MAX_ROWS - 1} LIMIT 1),
        0
      )
    `);

    const excessCount = (excess as unknown as { rowCount?: number }).rowCount ?? 0;
    return aged.length + excessCount;
  }
}

export const turnOutcomeStore = new DatabaseTurnOutcomeStore();

/**
 * Wire the durable sink into turn-fallback's classification log. Called once
 * at server startup (server/index.ts). Every write is isolated: a failing
 * database can never fail, slow, or alter a conversation turn — the entry is
 * still in the in-memory ring buffer and the console line either way.
 */
export function registerDurableTurnOutcomeSink(
  store: DatabaseTurnOutcomeStore = turnOutcomeStore,
): void {
  setUnsuccessfulQuerySink((entry) => {
    store.record(entry).catch((err) =>
      console.error("[TurnOutcomeStore] durable write failed (turn unaffected):", err),
    );
  });
  console.log("[TurnOutcomeStore] durable turn-outcome sink registered (platform_turn_outcomes)");
}
