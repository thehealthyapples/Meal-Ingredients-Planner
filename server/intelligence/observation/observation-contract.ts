/**
 * observation-contract.ts — OBS1 Observation Engine
 * ===================================================
 * The store contract and the DB-free in-memory implementation, split from the
 * database store so that pure modules and tests can import the contract
 * without transitively loading server/db.ts (which requires DATABASE_URL at
 * import time). No database import may ever be added to this file.
 */

import type {
  InsertPlatformObservation,
  PlatformObservation,
} from "@shared/schema";

/** Filters accepted by listRecent — every field optional, combined with AND. */
export interface ObservationFilter {
  readonly kind?: string;
  readonly capability?: string;
  readonly severity?: string;
  readonly sessionId?: string;
  /** Free-text match against capability, verb, intent, outcome, recoveryPath, kind. */
  readonly q?: string;
  readonly since?: Date;
  readonly limit?: number;
}

export interface IObservationStore {
  /** Persist one observation. Throws on failure — the engine decides isolation. */
  record(observation: InsertPlatformObservation): Promise<void>;
  /** All observations since a timestamp, oldest first, capped. */
  listSince(since: Date, limit?: number): Promise<PlatformObservation[]>;
  /** Most recent observations matching the filter, newest first. */
  listRecent(filter?: ObservationFilter): Promise<PlatformObservation[]>;
  /** Counts by kind since a timestamp — the operations endpoint's cheap summary. */
  countByKindSince(since: Date): Promise<{ total: number; byKind: Record<string, number> }>;
}

/** In-memory implementation for DB-free tests (same contract, same ordering). */
export class InMemoryObservationStore implements IObservationStore {
  private rows: PlatformObservation[] = [];
  private nextId = 1;

  async record(observation: InsertPlatformObservation): Promise<void> {
    this.rows.push({
      id: this.nextId++,
      observedAt: new Date(),
      kind: observation.kind,
      severity: observation.severity ?? "info",
      outcome: observation.outcome ?? null,
      userId: observation.userId ?? null,
      sessionId: observation.sessionId ?? null,
      surface: observation.surface ?? null,
      capability: observation.capability ?? null,
      verb: observation.verb ?? null,
      intent: observation.intent ?? null,
      contextView: observation.contextView ?? null,
      confidence: observation.confidence ?? null,
      durationMs: observation.durationMs ?? null,
      recoveryPath: observation.recoveryPath ?? null,
      metadata: (observation.metadata ?? {}) as Record<string, unknown>,
    });
  }

  async listSince(since: Date, limit = 50_000): Promise<PlatformObservation[]> {
    return this.rows.filter((r) => r.observedAt >= since).slice(0, limit);
  }

  async listRecent(filter: ObservationFilter = {}): Promise<PlatformObservation[]> {
    const q = filter.q?.toLowerCase();
    return this.rows
      .filter((r) =>
        (!filter.kind || r.kind === filter.kind) &&
        (!filter.capability || r.capability === filter.capability) &&
        (!filter.severity || r.severity === filter.severity) &&
        (!filter.sessionId || r.sessionId === filter.sessionId) &&
        (!filter.since || r.observedAt >= filter.since) &&
        (!q ||
          [r.capability, r.verb, r.intent, r.outcome, r.recoveryPath, r.kind]
            .some((field) => field?.toLowerCase().includes(q))),
      )
      .slice()
      .reverse()
      .slice(0, Math.min(filter.limit ?? 200, 1000));
  }

  async countByKindSince(since: Date): Promise<{ total: number; byKind: Record<string, number> }> {
    const byKind: Record<string, number> = {};
    let total = 0;
    for (const r of this.rows) {
      if (r.observedAt < since) continue;
      byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
      total += 1;
    }
    return { total, byKind };
  }

  /** Test convenience. */
  all(): readonly PlatformObservation[] {
    return this.rows;
  }
}
