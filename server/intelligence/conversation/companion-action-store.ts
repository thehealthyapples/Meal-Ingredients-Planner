/**
 * companion-action-store.ts — INT40 Companion Task Delegation & Assisted Actions
 * =================================================================================
 * The SOLE owner of the `companion_action_proposals` table (see
 * docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md). No other module
 * reads or writes this table directly.
 *
 * Mirrors companion-feedback-store.ts's discipline (INT18 Risk R5): an
 * `ICompanionActionStore` interface keeps database coupling out of tests.
 * `InMemoryCompanionActionStore` implements the same interface for unit tests, so
 * `npm test` needs no live database for this module.
 *
 * WHAT THIS STORE IS: the lifecycle record of a proposed Companion Action —
 * proposed → confirmed → succeeded/failed, or → cancelled. It stores the RESOLVED
 * intent (capabilityId, verb, parameters) a proposal was built from, never a
 * free-text utterance and never a copy of the business data the action touches.
 * Execution itself is NOT performed here — server/routes.ts calls
 * intelligencePlatform.handle() directly and reports the outcome back via
 * updateProposalStatus(). This store holds no business logic (Principle 2 & 7).
 *
 * PRIVACY (same class as the INT38 companion tables): no user id, no household id,
 * no raw utterance text. The only linkage is `conversationTurnId` — an opaque
 * integer pointer, cascade-deleted with the user's own conversation data. Ownership
 * (is this the caller's own proposal?) is resolved by joining through the EXISTING
 * `DatabaseConversationStore.getTurnOwner()` — this store does not duplicate that
 * join, callers look up the owning turn id via getProposal() first.
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-actions.ts
 */

import { eq, gte, desc } from "drizzle-orm";
import { db } from "../../db.js";
import {
  companionActionProposals,
  type CompanionActionProposal,
} from "../../../shared/schema.js";
import type { ConfirmationTier, IntentVerb } from "../types.js";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ActionProposalStatus =
  | "proposed"
  | "confirmed"
  | "in_progress"
  | "succeeded"
  | "failed"
  | "cancelled";

/** A terminal status — once reached, a proposal never transitions again. */
const TERMINAL_STATUSES: ReadonlySet<ActionProposalStatus> = new Set<ActionProposalStatus>([
  "succeeded", "failed", "cancelled",
]);

export function isTerminalStatus(status: ActionProposalStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export interface NewActionProposal {
  readonly capabilityId: string;
  readonly verb: IntentVerb;
  readonly label: string;
  readonly parameters: Readonly<Record<string, unknown>>;
  readonly confirmationTier: ConfirmationTier;
}

export interface ResolveProposalFields {
  readonly resultSummary?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

// ---------------------------------------------------------------------------
// ICompanionActionStore — keeps database coupling out of tests
// ---------------------------------------------------------------------------

export interface ICompanionActionStore {
  /** Persist a bundle of proposals built together on one turn, sharing one workflowId. */
  createProposals(
    conversationTurnId: number,
    workflowId: string,
    proposals: readonly NewActionProposal[],
  ): Promise<CompanionActionProposal[]>;
  getProposal(id: number): Promise<CompanionActionProposal | undefined>;
  listProposalsForWorkflow(workflowId: string): Promise<CompanionActionProposal[]>;
  /**
   * Transition a proposal to a new status. Terminal statuses (succeeded/failed/
   * cancelled) also stamp `resolvedAt`. Never re-transitions a proposal already in a
   * terminal status — returns the existing row unchanged (idempotent double-confirm).
   */
  updateProposalStatus(
    id: number,
    status: ActionProposalStatus,
    fields?: ResolveProposalFields,
  ): Promise<CompanionActionProposal>;
  /** All proposals, optionally bounded to rows created at/after `since` — for dashboard analytics. */
  listProposals(since?: Date): Promise<CompanionActionProposal[]>;
}

// ---------------------------------------------------------------------------
// DatabaseCompanionActionStore — production implementation
// ---------------------------------------------------------------------------

export class DatabaseCompanionActionStore implements ICompanionActionStore {
  async createProposals(
    conversationTurnId: number,
    workflowId: string,
    proposals: readonly NewActionProposal[],
  ): Promise<CompanionActionProposal[]> {
    if (proposals.length === 0) return [];
    return db.insert(companionActionProposals).values(
      proposals.map((p) => ({
        conversationTurnId,
        workflowId,
        capabilityId: p.capabilityId,
        verb: p.verb,
        label: p.label,
        parameters: p.parameters,
        confirmationTier: p.confirmationTier,
        status: "proposed" as const,
      })),
    ).returning();
  }

  async getProposal(id: number): Promise<CompanionActionProposal | undefined> {
    const [row] = await db
      .select()
      .from(companionActionProposals)
      .where(eq(companionActionProposals.id, id))
      .limit(1);
    return row;
  }

  async listProposalsForWorkflow(workflowId: string): Promise<CompanionActionProposal[]> {
    return db
      .select()
      .from(companionActionProposals)
      .where(eq(companionActionProposals.workflowId, workflowId))
      .orderBy(companionActionProposals.id);
  }

  async updateProposalStatus(
    id: number,
    status: ActionProposalStatus,
    fields: ResolveProposalFields = {},
  ): Promise<CompanionActionProposal> {
    const existing = await this.getProposal(id);
    if (!existing) throw new Error(`Companion action proposal ${id} not found`);
    if (isTerminalStatus(existing.status as ActionProposalStatus)) return existing;

    const [row] = await db
      .update(companionActionProposals)
      .set({
        status,
        resultSummary: fields.resultSummary ?? null,
        errorCode: fields.errorCode ?? null,
        errorMessage: fields.errorMessage ?? null,
        resolvedAt: isTerminalStatus(status) ? new Date() : null,
      })
      .where(eq(companionActionProposals.id, id))
      .returning();
    return row;
  }

  async listProposals(since?: Date): Promise<CompanionActionProposal[]> {
    const query = db.select().from(companionActionProposals);
    return since
      ? query.where(gte(companionActionProposals.createdAt, since)).orderBy(desc(companionActionProposals.createdAt))
      : query.orderBy(desc(companionActionProposals.createdAt));
  }
}

/** The canonical singleton. Import this in production code (routes.ts / conversation-gateway.ts). */
export const companionActionStore = new DatabaseCompanionActionStore();

// ---------------------------------------------------------------------------
// InMemoryCompanionActionStore — for unit tests (no database required)
// ---------------------------------------------------------------------------

export class InMemoryCompanionActionStore implements ICompanionActionStore {
  private rows: CompanionActionProposal[] = [];
  private nextId = 1;

  async createProposals(
    conversationTurnId: number,
    workflowId: string,
    proposals: readonly NewActionProposal[],
  ): Promise<CompanionActionProposal[]> {
    const created: CompanionActionProposal[] = proposals.map((p) => ({
      id: this.nextId++,
      conversationTurnId,
      workflowId,
      capabilityId: p.capabilityId,
      verb: p.verb,
      label: p.label,
      parameters: p.parameters,
      confirmationTier: p.confirmationTier,
      status: "proposed",
      resultSummary: null,
      errorCode: null,
      errorMessage: null,
      createdAt: new Date(),
      resolvedAt: null,
    }) as unknown as CompanionActionProposal);
    this.rows.push(...created);
    return created;
  }

  async getProposal(id: number): Promise<CompanionActionProposal | undefined> {
    return this.rows.find((r) => r.id === id);
  }

  async listProposalsForWorkflow(workflowId: string): Promise<CompanionActionProposal[]> {
    return this.rows.filter((r) => r.workflowId === workflowId).sort((a, b) => a.id - b.id);
  }

  async updateProposalStatus(
    id: number,
    status: ActionProposalStatus,
    fields: ResolveProposalFields = {},
  ): Promise<CompanionActionProposal> {
    const existing = this.rows.find((r) => r.id === id);
    if (!existing) throw new Error(`Companion action proposal ${id} not found`);
    if (isTerminalStatus(existing.status as ActionProposalStatus)) return existing;

    const updated: CompanionActionProposal = {
      ...existing,
      status,
      resultSummary: fields.resultSummary ?? null,
      errorCode: fields.errorCode ?? null,
      errorMessage: fields.errorMessage ?? null,
      resolvedAt: isTerminalStatus(status) ? new Date() : null,
    };
    this.rows = this.rows.map((r) => (r.id === id ? updated : r));
    return updated;
  }

  async listProposals(since?: Date): Promise<CompanionActionProposal[]> {
    return this.rows
      .filter((r) => !since || r.createdAt.getTime() >= since.getTime())
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Test hook — clear all in-memory state. */
  reset(): void {
    this.rows = [];
    this.nextId = 1;
  }
}
