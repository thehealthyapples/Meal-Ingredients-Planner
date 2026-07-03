/**
 * evidence-learning-store.ts — EL1 Evidence & Learning Platform
 * ==============================================================
 * The SOLE owner of the two EL1 tables — `household_evidence_events` and
 * `household_learning_signals` (see
 * docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md). No other
 * module reads or writes these tables directly.
 *
 * Mirrors delivery-store.ts's discipline (OD1): an `IEvidenceLearningStore`
 * interface keeps database coupling out of tests; `InMemoryEvidenceLearningStore`
 * implements the same interface for unit tests, so `npm test` needs no live
 * database for this module.
 *
 * WHAT THIS STORE IS:
 *   - `household_evidence_events` is an APPEND-ONLY log. Rows are never edited
 *     or deleted once inserted — it is the raw, structured capture of "this
 *     household outcome happened", nothing more.
 *   - `household_learning_signals` is a DERIVED, re-evaluated-in-place pattern
 *     over an accumulation of evidence events. `upsertSignal` enforces the one
 *     hard rule this store owns: once a household has confirmed or declined a
 *     signal, a later re-detection run may refresh its evidence fields but
 *     NEVER resets `status` back to "pending_confirmation" and never silently
 *     flips a decision — that would be relitigating a choice the household
 *     already made (mirrors OD1's terminal-status discipline for deliveries).
 *
 * Run tests: npx tsx server/tests/test-intelligence-evidence-learning-binding.ts
 */

import { eq, and, gte, desc } from "drizzle-orm";
import { db } from "../../db.js";
import {
  householdEvidenceEvents,
  householdLearningSignals,
  type HouseholdEvidenceEvent,
  type HouseholdLearningSignal,
} from "../../../shared/schema.js";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type EvidenceDirection = "positive" | "negative" | "neutral";
export type SignalDirection = "positive" | "negative";
export type SignalConfidence = "low" | "medium" | "high";
export type SignalStatus = "pending_confirmation" | "confirmed" | "declined";

/** A decision already made by a household is never relitigated by re-detection. */
const DECIDED_STATUSES: ReadonlySet<SignalStatus> = new Set<SignalStatus>(["confirmed", "declined"]);

export function isDecidedSignalStatus(status: string): boolean {
  return DECIDED_STATUSES.has(status as SignalStatus);
}

export interface NewEvidenceEvent {
  readonly householdId: number;
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly subjectKey: string;
  readonly outcomeType: string;
  readonly direction: EvidenceDirection;
  readonly context?: Record<string, unknown> | null;
  readonly sourceCapabilityId: string;
  readonly occurredAt?: Date;
}

export interface EvidenceQuery {
  readonly householdId: number;
  readonly domain?: string;
  readonly subjectType?: string;
  readonly subjectKey?: string;
  /** Only events at or after this instant — the detector's rolling window. */
  readonly since?: Date;
}

export interface DerivedSignalInput {
  readonly householdId: number;
  readonly domain: string;
  readonly subjectType: string;
  readonly subjectKey: string;
  readonly direction: SignalDirection;
  readonly evidenceCount: number;
  readonly consistency: number;
  readonly confidence: SignalConfidence;
  readonly supportingEventIds: readonly number[];
  readonly rationale: string;
}

export interface SignalQuery {
  readonly householdId: number;
  readonly domain?: string;
  readonly status?: SignalStatus;
}

export interface ConfirmSignalInput {
  readonly id: number;
  readonly decision: "confirmed" | "declined";
  readonly userId: number;
  readonly notes?: string;
}

// ---------------------------------------------------------------------------
// IEvidenceLearningStore — keeps database coupling out of tests
// ---------------------------------------------------------------------------

export interface IEvidenceLearningStore {
  /** Append one structured household outcome. Never edited after insert. */
  recordEvent(input: NewEvidenceEvent): Promise<HouseholdEvidenceEvent>;
  /** The raw evidence a detection run (or an explainability drill-down) reads from. */
  listEvents(query: EvidenceQuery): Promise<HouseholdEvidenceEvent[]>;
  /**
   * Insert-or-refresh one derived signal for a (household, domain, subjectType,
   * subjectKey, direction) dimension. If an existing row for that dimension is
   * already "confirmed" or "declined", only the evidence fields
   * (evidenceCount/consistency/confidence/supportingEventIds/rationale/
   * lastEvaluatedAt) are refreshed — `status` is left untouched by construction.
   */
  upsertSignal(input: DerivedSignalInput): Promise<HouseholdLearningSignal>;
  listSignals(query: SignalQuery): Promise<HouseholdLearningSignal[]>;
  getSignal(id: number): Promise<HouseholdLearningSignal | undefined>;
  /**
   * The only write path onto a decided signal. Writes ONLY
   * status/confirmedByUserId/confirmedAt/confirmationNotes. A signal already
   * decided is returned unchanged (idempotent — no re-litigating a decision).
   */
  confirmSignal(input: ConfirmSignalInput): Promise<HouseholdLearningSignal>;
}

// ---------------------------------------------------------------------------
// DatabaseEvidenceLearningStore — production implementation
// ---------------------------------------------------------------------------

export class DatabaseEvidenceLearningStore implements IEvidenceLearningStore {
  async recordEvent(input: NewEvidenceEvent): Promise<HouseholdEvidenceEvent> {
    const [row] = await db
      .insert(householdEvidenceEvents)
      .values({
        householdId: input.householdId,
        domain: input.domain,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        subjectKey: input.subjectKey,
        outcomeType: input.outcomeType,
        direction: input.direction,
        context: input.context ?? null,
        sourceCapabilityId: input.sourceCapabilityId,
        ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
      })
      .returning();
    return row;
  }

  async listEvents(query: EvidenceQuery): Promise<HouseholdEvidenceEvent[]> {
    const conditions = [eq(householdEvidenceEvents.householdId, query.householdId)];
    if (query.domain) conditions.push(eq(householdEvidenceEvents.domain, query.domain));
    if (query.subjectType) conditions.push(eq(householdEvidenceEvents.subjectType, query.subjectType));
    if (query.subjectKey) conditions.push(eq(householdEvidenceEvents.subjectKey, query.subjectKey));
    if (query.since) conditions.push(gte(householdEvidenceEvents.occurredAt, query.since));

    return db
      .select()
      .from(householdEvidenceEvents)
      .where(and(...conditions))
      .orderBy(desc(householdEvidenceEvents.occurredAt));
  }

  async upsertSignal(input: DerivedSignalInput): Promise<HouseholdLearningSignal> {
    const [existing] = await db
      .select()
      .from(householdLearningSignals)
      .where(and(
        eq(householdLearningSignals.householdId, input.householdId),
        eq(householdLearningSignals.domain, input.domain),
        eq(householdLearningSignals.subjectType, input.subjectType),
        eq(householdLearningSignals.subjectKey, input.subjectKey),
        eq(householdLearningSignals.direction, input.direction),
      ))
      .limit(1);

    const evidenceFields = {
      evidenceCount: input.evidenceCount,
      consistency: input.consistency,
      confidence: input.confidence,
      supportingEventIds: input.supportingEventIds,
      rationale: input.rationale,
      lastEvaluatedAt: new Date(),
    };

    if (!existing) {
      const [row] = await db
        .insert(householdLearningSignals)
        .values({
          householdId: input.householdId,
          domain: input.domain,
          subjectType: input.subjectType,
          subjectKey: input.subjectKey,
          direction: input.direction,
          status: "pending_confirmation",
          ...evidenceFields,
        })
        .returning();
      return row;
    }

    // A decided signal keeps its decision — only evidence strength refreshes.
    const [row] = await db
      .update(householdLearningSignals)
      .set(evidenceFields)
      .where(eq(householdLearningSignals.id, existing.id))
      .returning();
    return row;
  }

  async listSignals(query: SignalQuery): Promise<HouseholdLearningSignal[]> {
    const conditions = [eq(householdLearningSignals.householdId, query.householdId)];
    if (query.domain) conditions.push(eq(householdLearningSignals.domain, query.domain));
    if (query.status) conditions.push(eq(householdLearningSignals.status, query.status));

    return db
      .select()
      .from(householdLearningSignals)
      .where(and(...conditions))
      .orderBy(desc(householdLearningSignals.detectedAt));
  }

  async getSignal(id: number): Promise<HouseholdLearningSignal | undefined> {
    const [row] = await db.select().from(householdLearningSignals).where(eq(householdLearningSignals.id, id)).limit(1);
    return row;
  }

  async confirmSignal(input: ConfirmSignalInput): Promise<HouseholdLearningSignal> {
    const existing = await this.getSignal(input.id);
    if (!existing) throw new Error(`No household_learning_signals row for id ${input.id}`);
    if (isDecidedSignalStatus(existing.status)) return existing;

    const [row] = await db
      .update(householdLearningSignals)
      .set({
        status: input.decision,
        confirmedByUserId: input.userId,
        confirmedAt: new Date(),
        confirmationNotes: input.notes ?? null,
      })
      .where(eq(householdLearningSignals.id, input.id))
      .returning();
    return row;
  }
}

/** The canonical singleton. Import this in production code. */
export const evidenceLearningStore = new DatabaseEvidenceLearningStore();

// ---------------------------------------------------------------------------
// InMemoryEvidenceLearningStore — for unit tests (no database required)
// ---------------------------------------------------------------------------

export class InMemoryEvidenceLearningStore implements IEvidenceLearningStore {
  private events: HouseholdEvidenceEvent[] = [];
  private signals: HouseholdLearningSignal[] = [];
  private nextEventId = 1;
  private nextSignalId = 1;

  async recordEvent(input: NewEvidenceEvent): Promise<HouseholdEvidenceEvent> {
    const row = {
      id: this.nextEventId++,
      householdId: input.householdId,
      domain: input.domain,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      subjectKey: input.subjectKey,
      outcomeType: input.outcomeType,
      direction: input.direction,
      context: input.context ?? null,
      sourceCapabilityId: input.sourceCapabilityId,
      occurredAt: input.occurredAt ?? new Date(),
      recordedAt: new Date(),
    } as unknown as HouseholdEvidenceEvent;
    this.events.push(row);
    return row;
  }

  async listEvents(query: EvidenceQuery): Promise<HouseholdEvidenceEvent[]> {
    return this.events
      .filter((e) => e.householdId === query.householdId)
      .filter((e) => !query.domain || e.domain === query.domain)
      .filter((e) => !query.subjectType || e.subjectType === query.subjectType)
      .filter((e) => !query.subjectKey || e.subjectKey === query.subjectKey)
      .filter((e) => !query.since || e.occurredAt >= query.since)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async upsertSignal(input: DerivedSignalInput): Promise<HouseholdLearningSignal> {
    const existing = this.signals.find((s) =>
      s.householdId === input.householdId &&
      s.domain === input.domain &&
      s.subjectType === input.subjectType &&
      s.subjectKey === input.subjectKey &&
      s.direction === input.direction,
    );

    if (!existing) {
      const row = {
        id: this.nextSignalId++,
        householdId: input.householdId,
        domain: input.domain,
        subjectType: input.subjectType,
        subjectKey: input.subjectKey,
        direction: input.direction,
        evidenceCount: input.evidenceCount,
        consistency: input.consistency,
        confidence: input.confidence,
        supportingEventIds: input.supportingEventIds,
        rationale: input.rationale,
        status: "pending_confirmation" as const,
        detectedAt: new Date(),
        lastEvaluatedAt: new Date(),
        confirmedByUserId: null,
        confirmedAt: null,
        confirmationNotes: null,
      } as unknown as HouseholdLearningSignal;
      this.signals.push(row);
      return row;
    }

    const updated: HouseholdLearningSignal = {
      ...existing,
      evidenceCount: input.evidenceCount,
      consistency: input.consistency,
      confidence: input.confidence,
      supportingEventIds: input.supportingEventIds as unknown as HouseholdLearningSignal["supportingEventIds"],
      rationale: input.rationale,
      lastEvaluatedAt: new Date(),
    };
    this.signals = this.signals.map((s) => (s === existing ? updated : s));
    return updated;
  }

  async listSignals(query: SignalQuery): Promise<HouseholdLearningSignal[]> {
    return this.signals
      .filter((s) => s.householdId === query.householdId)
      .filter((s) => !query.domain || s.domain === query.domain)
      .filter((s) => !query.status || s.status === query.status)
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  async getSignal(id: number): Promise<HouseholdLearningSignal | undefined> {
    return this.signals.find((s) => s.id === id);
  }

  async confirmSignal(input: ConfirmSignalInput): Promise<HouseholdLearningSignal> {
    const existing = this.signals.find((s) => s.id === input.id);
    if (!existing) throw new Error(`No household_learning_signals row for id ${input.id}`);
    if (isDecidedSignalStatus(existing.status)) return existing;

    const updated: HouseholdLearningSignal = {
      ...existing,
      status: input.decision,
      confirmedByUserId: input.userId,
      confirmedAt: new Date(),
      confirmationNotes: input.notes ?? null,
    };
    this.signals = this.signals.map((s) => (s === existing ? updated : s));
    return updated;
  }

  /** Test hook — clear all in-memory state. */
  reset(): void {
    this.events = [];
    this.signals = [];
    this.nextEventId = 1;
    this.nextSignalId = 1;
  }
}
