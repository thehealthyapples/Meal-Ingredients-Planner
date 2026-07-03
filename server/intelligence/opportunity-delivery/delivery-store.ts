/**
 * delivery-store.ts — OD1 Opportunity Delivery Framework
 * =======================================================
 * The SOLE owner of the `opportunity_deliveries` table (see
 * docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md). No other module
 * reads or writes this table directly.
 *
 * Mirrors companion-action-store.ts's discipline (INT40): an `IOpportunityDeliveryStore`
 * interface keeps database coupling out of tests; `InMemoryOpportunityDeliveryStore`
 * implements the same interface for unit tests, so `npm test` needs no live database
 * for this module.
 *
 * WHAT THIS STORE IS: the delivery lifecycle of a Domain Intelligence opportunity —
 * delivered (default, first report) -> acknowledged (seen, non-terminal) -> dismissed
 * or accepted (terminal — never re-delivered). Unlike companion-action-store.ts's
 * `companion_action_proposals` (scoped to a conversation turn), this store is scoped
 * directly to `userId`, because a Domain Intelligence opportunity is AMBIENT — generated
 * from a household's own existing activity, not from an assistant conversation turn.
 *
 * `mutedOpportunityTypes` is read from the EXISTING `user_preferences` owner
 * (server/storage.ts's `getUserPreferences`) — never re-queried directly here, so
 * user_preferences keeps exactly one reader path.
 *
 * Run tests: npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts
 */

import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { storage } from "../../storage.js";
import {
  opportunityDeliveries,
  type OpportunityDelivery,
} from "../../../shared/schema.js";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type OpportunityDeliveryStatus = "delivered" | "acknowledged" | "dismissed" | "accepted";

/** A terminal status — once reached, a delivery record never transitions again (never re-delivered). */
const TERMINAL_STATUSES: ReadonlySet<OpportunityDeliveryStatus> = new Set<OpportunityDeliveryStatus>([
  "dismissed", "accepted",
]);

/**
 * Accepts a plain `string` (not just the narrow `OpportunityDeliveryStatus` union) so
 * a raw DB row's `status` column — typed `string` by drizzle, since it is a plain text
 * column, not a DB enum — can be checked directly without a cast at every call site.
 */
export function isTerminalDeliveryStatus(status: string): boolean {
  return TERMINAL_STATUSES.has(status as OpportunityDeliveryStatus);
}

export interface NewOpportunityDelivery {
  readonly userId: number;
  readonly opportunityId: string;
  readonly capabilityId: string;
  readonly domain: string;
  readonly type: string;
  readonly priority: string;
  readonly surface: string;
}

// ---------------------------------------------------------------------------
// IOpportunityDeliveryStore — keeps database coupling out of tests
// ---------------------------------------------------------------------------

export interface IOpportunityDeliveryStore {
  /** The opportunity `type` values this user has muted — empty means no muting (honest default). */
  getMutedOpportunityTypes(userId: number): Promise<readonly string[]>;
  /** Existing delivery records for this user, keyed by opportunityId (only ids that already exist are present). */
  getRecords(userId: number, opportunityIds: readonly string[]): Promise<Map<string, OpportunityDelivery>>;
  getRecord(userId: number, opportunityId: string): Promise<OpportunityDelivery | undefined>;
  /**
   * Insert first-delivery rows. Never inserts a duplicate for a (userId, opportunityId)
   * that already has a row — this IS "preventing duplicate delivery" at the persistence
   * layer (belt-and-suspenders alongside the caller's own existing-record check).
   */
  insertDelivered(rows: readonly NewOpportunityDelivery[]): Promise<void>;
  /**
   * Transition a delivery record to a new status. Terminal statuses (dismissed/accepted)
   * also stamp `resolvedAt`. Never re-transitions a record already in a terminal status —
   * returns the existing row unchanged (idempotent double-dismiss/double-accept).
   */
  updateStatus(userId: number, opportunityId: string, status: OpportunityDeliveryStatus): Promise<OpportunityDelivery>;
}

// ---------------------------------------------------------------------------
// DatabaseOpportunityDeliveryStore — production implementation
// ---------------------------------------------------------------------------

export class DatabaseOpportunityDeliveryStore implements IOpportunityDeliveryStore {
  async getMutedOpportunityTypes(userId: number): Promise<readonly string[]> {
    const prefs = await storage.getUserPreferences(userId);
    return prefs?.mutedOpportunityTypes ?? [];
  }

  async getRecords(userId: number, opportunityIds: readonly string[]): Promise<Map<string, OpportunityDelivery>> {
    if (opportunityIds.length === 0) return new Map();
    const rows = await db
      .select()
      .from(opportunityDeliveries)
      .where(and(eq(opportunityDeliveries.userId, userId), inArray(opportunityDeliveries.opportunityId, [...opportunityIds])));
    return new Map(rows.map((row) => [row.opportunityId, row]));
  }

  async getRecord(userId: number, opportunityId: string): Promise<OpportunityDelivery | undefined> {
    const [row] = await db
      .select()
      .from(opportunityDeliveries)
      .where(and(eq(opportunityDeliveries.userId, userId), eq(opportunityDeliveries.opportunityId, opportunityId)))
      .limit(1);
    return row;
  }

  async insertDelivered(rows: readonly NewOpportunityDelivery[]): Promise<void> {
    if (rows.length === 0) return;
    await db
      .insert(opportunityDeliveries)
      .values(rows.map((r) => ({ ...r, status: "delivered" as const })))
      .onConflictDoNothing();
  }

  async updateStatus(userId: number, opportunityId: string, status: OpportunityDeliveryStatus): Promise<OpportunityDelivery> {
    const existing = await this.getRecord(userId, opportunityId);
    if (!existing) throw new Error(`No opportunity_deliveries row for user ${userId}, opportunity ${opportunityId}`);
    if (isTerminalDeliveryStatus(existing.status as OpportunityDeliveryStatus)) return existing;

    const [row] = await db
      .update(opportunityDeliveries)
      .set({ status, resolvedAt: isTerminalDeliveryStatus(status) ? new Date() : null })
      .where(and(eq(opportunityDeliveries.userId, userId), eq(opportunityDeliveries.opportunityId, opportunityId)))
      .returning();
    return row;
  }
}

/** The canonical singleton. Import this in production code. */
export const opportunityDeliveryStore = new DatabaseOpportunityDeliveryStore();

// ---------------------------------------------------------------------------
// InMemoryOpportunityDeliveryStore — for unit tests (no database required)
// ---------------------------------------------------------------------------

export class InMemoryOpportunityDeliveryStore implements IOpportunityDeliveryStore {
  private rows: OpportunityDelivery[] = [];
  private nextId = 1;
  private mutedByUser = new Map<number, readonly string[]>();

  /** Test hook — set the muted opportunity types a given user "has saved" in preferences. */
  setMutedOpportunityTypes(userId: number, types: readonly string[]): void {
    this.mutedByUser.set(userId, types);
  }

  async getMutedOpportunityTypes(userId: number): Promise<readonly string[]> {
    return this.mutedByUser.get(userId) ?? [];
  }

  async getRecords(userId: number, opportunityIds: readonly string[]): Promise<Map<string, OpportunityDelivery>> {
    const ids = new Set(opportunityIds);
    const map = new Map<string, OpportunityDelivery>();
    for (const row of this.rows) {
      if (row.userId === userId && ids.has(row.opportunityId)) map.set(row.opportunityId, row);
    }
    return map;
  }

  async getRecord(userId: number, opportunityId: string): Promise<OpportunityDelivery | undefined> {
    return this.rows.find((r) => r.userId === userId && r.opportunityId === opportunityId);
  }

  async insertDelivered(rows: readonly NewOpportunityDelivery[]): Promise<void> {
    for (const r of rows) {
      const alreadyExists = this.rows.some((row) => row.userId === r.userId && row.opportunityId === r.opportunityId);
      if (alreadyExists) continue; // never a duplicate row
      this.rows.push({
        id: this.nextId++,
        userId: r.userId,
        opportunityId: r.opportunityId,
        capabilityId: r.capabilityId,
        domain: r.domain,
        type: r.type,
        priority: r.priority,
        surface: r.surface,
        status: "delivered",
        deliveredAt: new Date(),
        resolvedAt: null,
      } as unknown as OpportunityDelivery);
    }
  }

  async updateStatus(userId: number, opportunityId: string, status: OpportunityDeliveryStatus): Promise<OpportunityDelivery> {
    const existing = this.rows.find((r) => r.userId === userId && r.opportunityId === opportunityId);
    if (!existing) throw new Error(`No opportunity_deliveries row for user ${userId}, opportunity ${opportunityId}`);
    if (isTerminalDeliveryStatus(existing.status as OpportunityDeliveryStatus)) return existing;

    const updated: OpportunityDelivery = {
      ...existing,
      status,
      resolvedAt: isTerminalDeliveryStatus(status) ? new Date() : null,
    };
    this.rows = this.rows.map((r) => (r === existing ? updated : r));
    return updated;
  }

  /** Test hook — clear all in-memory state. */
  reset(): void {
    this.rows = [];
    this.nextId = 1;
    this.mutedByUser.clear();
  }
}
