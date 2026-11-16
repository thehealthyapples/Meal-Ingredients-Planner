/**
 * learned-substitution-store.ts — COMP3 Learned Substitution Observations
 * =========================================================================
 * The SOLE owner of `learned_substitution_observations` (see
 * docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md). No other
 * module reads or writes this table directly.
 *
 * WHAT THIS IS, AND WHAT IT IS NOT.
 * A household that names its own fix for a flagged ingredient the curated
 * rule engine (shared/substitution-rules.ts) has no entry for is recorded
 * here. This is NEVER promoted into the curated rules automatically, and
 * `listObservations` NEVER returns something the caller may present as a
 * verified fact — every caller using this data must attribute it to "other
 * households" and disclaim it as unverified (see action-resolution.ts
 * `restrictionChoiceQuestion`). This table exists to let the household's own
 * knowledge travel to other households that hit the same conflict, never to
 * let the app assert a safety claim on its own authority.
 *
 * PRIVACY: `householdId` is stored for corroboration counting (so three
 * households each independently stating the same fix reads differently from
 * one household saying it three times) and for cascade-delete when a
 * household is removed. It is never returned by `listObservations` — only
 * the distinct replacement text and how many households said it.
 *
 * Mirrors companion-feedback-store.ts's discipline (INT18 Risk R5): an
 * interface keeps database coupling out of tests; an in-memory
 * implementation satisfies the same interface for unit tests.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db.js";
import { learnedSubstitutionObservations } from "../../../shared/schema.js";

export interface RecordObservationInput {
  readonly restrictionId: string;
  readonly ingredientKey: string;
  readonly statedReplacement: string;
  readonly householdId: number;
}

/** One distinct stated replacement for an ingredient, with how many separate households said it. */
export interface ObservedSubstitution {
  readonly statedReplacement: string;
  readonly householdCount: number;
}

export interface ILearnedSubstitutionStore {
  /** Idempotent: the same household repeating the same statement is a no-op, not a new row. */
  recordObservation(input: RecordObservationInput): Promise<void>;
  /** Distinct replacements for this restriction+ingredient, most-corroborated first. Never includes householdId. */
  listObservations(restrictionId: string, ingredientKey: string): Promise<ObservedSubstitution[]>;
}

// ---------------------------------------------------------------------------
// DatabaseLearnedSubstitutionStore — production implementation
// ---------------------------------------------------------------------------

export class DatabaseLearnedSubstitutionStore implements ILearnedSubstitutionStore {
  async recordObservation(input: RecordObservationInput): Promise<void> {
    await db
      .insert(learnedSubstitutionObservations)
      .values({
        restrictionId: input.restrictionId,
        ingredientKey: input.ingredientKey,
        statedReplacement: input.statedReplacement,
        householdId: input.householdId,
      })
      .onConflictDoNothing();
  }

  async listObservations(restrictionId: string, ingredientKey: string): Promise<ObservedSubstitution[]> {
    const rows = await db
      .select({
        statedReplacement: learnedSubstitutionObservations.statedReplacement,
        householdCount: sql<number>`count(distinct ${learnedSubstitutionObservations.householdId})`.mapWith(Number),
      })
      .from(learnedSubstitutionObservations)
      .where(and(
        eq(learnedSubstitutionObservations.restrictionId, restrictionId),
        eq(learnedSubstitutionObservations.ingredientKey, ingredientKey),
      ))
      .groupBy(learnedSubstitutionObservations.statedReplacement)
      .orderBy(sql`count(distinct ${learnedSubstitutionObservations.householdId}) desc`);
    return rows;
  }
}

/** The canonical singleton. Import this in production code (action-resolution.ts). */
export const learnedSubstitutionStore: ILearnedSubstitutionStore = new DatabaseLearnedSubstitutionStore();

// ---------------------------------------------------------------------------
// InMemoryLearnedSubstitutionStore — for unit tests (no database required)
// ---------------------------------------------------------------------------

export class InMemoryLearnedSubstitutionStore implements ILearnedSubstitutionStore {
  private rows: RecordObservationInput[] = [];

  async recordObservation(input: RecordObservationInput): Promise<void> {
    const exists = this.rows.some((r) =>
      r.restrictionId === input.restrictionId &&
      r.ingredientKey === input.ingredientKey &&
      r.statedReplacement === input.statedReplacement &&
      r.householdId === input.householdId,
    );
    if (!exists) this.rows.push(input);
  }

  async listObservations(restrictionId: string, ingredientKey: string): Promise<ObservedSubstitution[]> {
    const matching = this.rows.filter((r) => r.restrictionId === restrictionId && r.ingredientKey === ingredientKey);
    const byReplacement = new Map<string, Set<number>>();
    for (const r of matching) {
      const households = byReplacement.get(r.statedReplacement) ?? new Set<number>();
      households.add(r.householdId);
      byReplacement.set(r.statedReplacement, households);
    }
    return [...byReplacement.entries()]
      .map(([statedReplacement, households]) => ({ statedReplacement, householdCount: households.size }))
      .sort((a, b) => b.householdCount - a.householdCount);
  }
}
