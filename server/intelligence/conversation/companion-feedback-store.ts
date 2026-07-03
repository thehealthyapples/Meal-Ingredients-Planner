/**
 * companion-feedback-store.ts — INT38 Companion Guidance & Feedback
 * ====================================================================
 * The SOLE owner of the two INT38 tables — `companion_response_feedback` and
 * `companion_guidance_events` (see
 * docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md). No other
 * module reads or writes these tables directly.
 *
 * Mirrors companion-learning-store.ts's discipline (INT18 Risk R5): an
 * `ICompanionFeedbackStore` interface keeps database coupling out of tests.
 * `InMemoryCompanionFeedbackStore` implements the same interface for unit
 * tests, so `npm test` needs no live database for this module.
 *
 * PRIVACY (same class as INT35/INT35C, see shared/schema.ts header comment):
 * no user id, no household id, no utterance text, no capability result
 * payload. The only linkage either table carries is `conversationTurnId` — an
 * opaque integer pointer, cascade-deleted with the user's own conversation
 * data. ADVISORY ONLY: there is no `applied` column and no code path from
 * either table back into PatternIntentResolver or the Capability Registry —
 * reviewing/reading this data can never change production routing.
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-guidance.ts
 */

import { eq, gte, desc } from "drizzle-orm";
import { db } from "../../db.js";
import {
  companionResponseFeedback,
  companionGuidanceEvents,
  type CompanionResponseFeedback,
  type CompanionGuidanceEvent,
} from "../../../shared/schema.js";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type FeedbackRating = "up" | "down";
export type GuidanceEventKind = "shown" | "clicked";

export interface SubmitFeedbackInput {
  readonly conversationTurnId: number;
  readonly rating: FeedbackRating;
  /** Only meaningful (and only ever set) alongside a "down" rating. */
  readonly reasonCode?: string;
  readonly note?: string;
}

export interface NewGuidanceEvent {
  readonly conversationTurnId: number;
  readonly eventKind: GuidanceEventKind;
  readonly sourceDomain: string;
  readonly domain: string;
  /**
   * INT39 — the underlying Capability Guidance Registry action, when known.
   * Optional so pre-INT39 callers keep working unchanged; the Goal Completion
   * analytics can only classify a "clicked" event as a completed goal when
   * these are present.
   */
  readonly sourceCapabilityId?: string;
  readonly targetCapabilityId?: string;
  readonly targetVerb?: string;
}

// ---------------------------------------------------------------------------
// ICompanionFeedbackStore — keeps database coupling out of tests
// ---------------------------------------------------------------------------

export interface ICompanionFeedbackStore {
  /** Upsert-by-turn: resubmitting a rating for the same turn overwrites it. */
  submitFeedback(input: SubmitFeedbackInput): Promise<CompanionResponseFeedback>;
  getFeedbackForTurn(turnId: number): Promise<CompanionResponseFeedback | undefined>;
  /** All feedback, optionally bounded to rows created at/after `since`. */
  listFeedback(since?: Date): Promise<CompanionResponseFeedback[]>;
  recordGuidanceEvent(input: NewGuidanceEvent): Promise<CompanionGuidanceEvent>;
  /** Batch insert — used for recording every "shown" suggestion on a turn in one call. */
  recordGuidanceEvents(inputs: readonly NewGuidanceEvent[]): Promise<CompanionGuidanceEvent[]>;
  listGuidanceEvents(since?: Date): Promise<CompanionGuidanceEvent[]>;
}

// ---------------------------------------------------------------------------
// DatabaseCompanionFeedbackStore — production implementation
// ---------------------------------------------------------------------------

export class DatabaseCompanionFeedbackStore implements ICompanionFeedbackStore {
  async submitFeedback(input: SubmitFeedbackInput): Promise<CompanionResponseFeedback> {
    const [row] = await db
      .insert(companionResponseFeedback)
      .values({
        conversationTurnId: input.conversationTurnId,
        rating: input.rating,
        reasonCode: input.reasonCode ?? null,
        note: input.note ?? null,
      })
      .onConflictDoUpdate({
        target: companionResponseFeedback.conversationTurnId,
        set: {
          rating: input.rating,
          reasonCode: input.reasonCode ?? null,
          note: input.note ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async getFeedbackForTurn(turnId: number): Promise<CompanionResponseFeedback | undefined> {
    const [row] = await db
      .select()
      .from(companionResponseFeedback)
      .where(eq(companionResponseFeedback.conversationTurnId, turnId))
      .limit(1);
    return row;
  }

  async listFeedback(since?: Date): Promise<CompanionResponseFeedback[]> {
    const query = db.select().from(companionResponseFeedback);
    return since
      ? query.where(gte(companionResponseFeedback.createdAt, since)).orderBy(desc(companionResponseFeedback.createdAt))
      : query.orderBy(desc(companionResponseFeedback.createdAt));
  }

  async recordGuidanceEvent(input: NewGuidanceEvent): Promise<CompanionGuidanceEvent> {
    const [row] = await db.insert(companionGuidanceEvents).values({
      conversationTurnId: input.conversationTurnId,
      eventKind: input.eventKind,
      sourceDomain: input.sourceDomain,
      domain: input.domain,
      sourceCapabilityId: input.sourceCapabilityId ?? null,
      targetCapabilityId: input.targetCapabilityId ?? null,
      targetVerb: input.targetVerb ?? null,
    }).returning();
    return row;
  }

  async recordGuidanceEvents(inputs: readonly NewGuidanceEvent[]): Promise<CompanionGuidanceEvent[]> {
    if (inputs.length === 0) return [];
    return db.insert(companionGuidanceEvents).values(
      inputs.map((input) => ({
        conversationTurnId: input.conversationTurnId,
        eventKind: input.eventKind,
        sourceDomain: input.sourceDomain,
        domain: input.domain,
        sourceCapabilityId: input.sourceCapabilityId ?? null,
        targetCapabilityId: input.targetCapabilityId ?? null,
        targetVerb: input.targetVerb ?? null,
      })),
    ).returning();
  }

  async listGuidanceEvents(since?: Date): Promise<CompanionGuidanceEvent[]> {
    const query = db.select().from(companionGuidanceEvents);
    return since
      ? query.where(gte(companionGuidanceEvents.createdAt, since)).orderBy(desc(companionGuidanceEvents.createdAt))
      : query.orderBy(desc(companionGuidanceEvents.createdAt));
  }
}

/** The canonical singleton. Import this in production code (routes.ts / conversation-gateway.ts). */
export const companionFeedbackStore = new DatabaseCompanionFeedbackStore();

// ---------------------------------------------------------------------------
// InMemoryCompanionFeedbackStore — for unit tests (no database required)
// ---------------------------------------------------------------------------

export class InMemoryCompanionFeedbackStore implements ICompanionFeedbackStore {
  private feedback: CompanionResponseFeedback[] = [];
  private events: CompanionGuidanceEvent[] = [];
  private nextFeedbackId = 1;
  private nextEventId = 1;

  async submitFeedback(input: SubmitFeedbackInput): Promise<CompanionResponseFeedback> {
    const existing = this.feedback.find((f) => f.conversationTurnId === input.conversationTurnId);
    if (existing) {
      const updated: CompanionResponseFeedback = {
        ...existing,
        rating: input.rating,
        reasonCode: input.reasonCode ?? null,
        note: input.note ?? null,
        updatedAt: new Date(),
      };
      this.feedback = this.feedback.map((f) => (f.id === updated.id ? updated : f));
      return updated;
    }
    const now = new Date();
    const row = {
      id: this.nextFeedbackId++,
      conversationTurnId: input.conversationTurnId,
      rating: input.rating,
      reasonCode: input.reasonCode ?? null,
      note: input.note ?? null,
      createdAt: now,
      updatedAt: now,
    } as unknown as CompanionResponseFeedback;
    this.feedback.push(row);
    return row;
  }

  async getFeedbackForTurn(turnId: number): Promise<CompanionResponseFeedback | undefined> {
    return this.feedback.find((f) => f.conversationTurnId === turnId);
  }

  async listFeedback(since?: Date): Promise<CompanionResponseFeedback[]> {
    return this.feedback
      .filter((f) => !since || f.createdAt.getTime() >= since.getTime())
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async recordGuidanceEvent(input: NewGuidanceEvent): Promise<CompanionGuidanceEvent> {
    const row = {
      id: this.nextEventId++,
      conversationTurnId: input.conversationTurnId,
      eventKind: input.eventKind,
      sourceDomain: input.sourceDomain,
      domain: input.domain,
      sourceCapabilityId: input.sourceCapabilityId ?? null,
      targetCapabilityId: input.targetCapabilityId ?? null,
      targetVerb: input.targetVerb ?? null,
      createdAt: new Date(),
    } as unknown as CompanionGuidanceEvent;
    this.events.push(row);
    return row;
  }

  async recordGuidanceEvents(inputs: readonly NewGuidanceEvent[]): Promise<CompanionGuidanceEvent[]> {
    const rows: CompanionGuidanceEvent[] = [];
    for (const input of inputs) rows.push(await this.recordGuidanceEvent(input));
    return rows;
  }

  async listGuidanceEvents(since?: Date): Promise<CompanionGuidanceEvent[]> {
    return this.events
      .filter((e) => !since || e.createdAt.getTime() >= since.getTime())
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Test hook — clear all in-memory state. */
  reset(): void {
    this.feedback = [];
    this.events = [];
    this.nextFeedbackId = 1;
    this.nextEventId = 1;
  }
}
