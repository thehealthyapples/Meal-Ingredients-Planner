/**
 * KNOW2 — the human evidence publication workflow for nutrition claims.
 *
 * This module is THE SINGLE AUTHORISED WRITER of `reviewed_at` / `reviewed_by` /
 * `rejected_at` / `rejected_by` / `rejection_reason` on the four claim tables.
 * Before KNOW2 that title belonged to `server/seeds/signoff-knowledge-claims.ts`;
 * that script now delegates here rather than writing its own UPDATE, so the
 * publication fact keeps exactly one owner (ARCHITECTURE_PRINCIPLES.md
 * Principle 2). Adding an admin surface with its own UPDATE would have created
 * the second owner this convergence exists to prevent.
 *
 * WHAT THIS IS NOT
 *
 * It is not a publication system. It writes the same `reviewed_at` column the
 * KNOW5 chain already reads, on the same rows, read by the same gate
 * (`isEvidenceBackedClaim`), through the same one mouth
 * (`server/services/nutrition-knowledge-registry.ts`). That is precisely why an
 * approved claim reaches Food Intelligence, Meal Intelligence, Pantry, Planner,
 * the Companion, nutrition reports and Plant Diversity with no fan-out code and
 * no notification step: those consumers were already reading this column, and
 * were already showing nothing because it was NULL. Approval does not push a
 * claim outwards — it stops withholding it.
 *
 * THE AUDIT WRITE IS NOT BEST-EFFORT
 *
 * `knowledge-review-store.ts:recordAudit` catches and logs its own failures, which
 * is right for a vocabulary alias. It is wrong here. An approval that succeeds
 * while its audit row is lost is a published health claim that no one can be
 * asked about or told to withdraw — the exact condition KNOW5's reviewer-identity
 * rule exists to prevent, arriving by a different door. So every decision writes
 * the claim row and its audit row in ONE transaction: if the history cannot be
 * recorded, the decision does not happen.
 */

import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import {
  knowledgeFoodNutrients,
  knowledgeFoodBenefits,
  knowledgeNutrientBenefits,
  knowledgePreparationEffects,
  knowledgeReviewAudit,
  type KnowledgeReviewAudit,
} from "@shared/schema";
import {
  canApproveClaim,
  deriveClaimReviewStatus,
  isAllowedClaimReviewAction,
  validateClaimLifecycleState,
  validateSourceRef,
  type ClaimReviewAction,
  type ClaimReviewStatus,
  type KnowledgeSourceRef,
} from "@shared/knowledge/evidence";

/** Thrown for every refusal a caller is expected to surface to the reviewer. */
export class ClaimReviewError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = "ClaimReviewError";
  }
}

// ── The edges ────────────────────────────────────────────────────────────────
//
// The four claim tables are one lifecycle over four shapes. They are described
// once, here, rather than branched on at every call site — a `switch` repeated
// across approve / reject / reopen / list / history is four chances to add an
// edge to three of them.

export type ClaimEdge = "composition" | "food-benefit" | "nutrient-benefit" | "preparation-effect";

export const CLAIM_EDGES: readonly ClaimEdge[] = [
  "composition",
  "food-benefit",
  "nutrient-benefit",
  "preparation-effect",
];

export function isClaimEdge(value: unknown): value is ClaimEdge {
  return typeof value === "string" && (CLAIM_EDGES as readonly string[]).includes(value);
}

/**
 * The audit `entity` value for each edge.
 *
 * Namespaced `claim:` so a claim decision can never be confused with a KQ1
 * vocabulary decision in the shared ledger. `knowledge_review_audit.entity` is a
 * free text column with an existing (entity, entity_id) index, so this extends
 * its vocabulary exactly as the table's own header comment anticipates — it adds
 * no table and changes no existing row.
 */
const AUDIT_ENTITY: Readonly<Record<ClaimEdge, string>> = {
  composition: "claim:composition",
  "food-benefit": "claim:food-benefit",
  "nutrient-benefit": "claim:nutrient-benefit",
  "preparation-effect": "claim:preparation-effect",
};

const TABLES = {
  composition: knowledgeFoodNutrients,
  "food-benefit": knowledgeFoodBenefits,
  "nutrient-benefit": knowledgeNutrientBenefits,
  "preparation-effect": knowledgePreparationEffects,
} as const;

export const CLAIM_EDGE_LABELS: Readonly<Record<ClaimEdge, string>> = {
  composition: "Food → nutrient (composition)",
  "food-benefit": "Food → benefit (direct)",
  "nutrient-benefit": "Nutrient → benefit (physiological)",
  "preparation-effect": "Food + preparation → effect",
};

/**
 * What each edge means, in the reviewer's terms — shown beside the claim in the
 * Admin surface. A reviewer approving a "composition" row is not approving that
 * the nutrient is good for you; they are approving that this food is a notable
 * source of it. Getting that distinction wrong is how a chip ends up citing a
 * genuine source for a sentence the source never said.
 */
export const CLAIM_EDGE_MEANINGS: Readonly<Record<ClaimEdge, string>> = {
  composition: "You are approving that this food is a notable source of this nutrient — not that the nutrient is beneficial.",
  "food-benefit": "You are approving a source that speaks about this food and this benefit together. Optional corroboration: it raises confidence but never licenses a chip on its own.",
  "nutrient-benefit": "You are approving the physiological claim that this nutrient supports this benefit — not that any particular food provides it.",
  "preparation-effect": "You are approving the exact wording shown to households, not only the underlying effect.",
};

// ── The reviewer's view of one claim ─────────────────────────────────────────

export interface ClaimReviewItem {
  id: number;
  edge: ClaimEdge;
  /** The claim as a reviewer reads it, e.g. "salmon → omega-3". */
  subject: string;
  /** The exact sentence households see, where the edge has one (preparation effects). */
  approvedWording: string | null;
  sourceRefs: KnowledgeSourceRef[];
  /** Per-citation structural problems. A claim with any of these cannot be approved. */
  citationProblems: string[];
  status: ClaimReviewStatus;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  /** Whether approval is legal right now: pending AND at least one valid citation. */
  canApprove: boolean;
  isActive: boolean;
}

function subjectOf(edge: ClaimEdge, row: any): string {
  switch (edge) {
    case "composition":
      return `${row.foodSlug} → ${row.nutrientSlug}`;
    case "food-benefit":
      return `${row.foodSlug} → ${row.benefitSlug}`;
    case "nutrient-benefit":
      return `${row.nutrientSlug} → ${row.benefitSlug}`;
    case "preparation-effect":
      return `${row.foodSlug} + ${row.preparationSlug} → ${row.direction} ${row.targetSlug ?? row.effectKind}`;
  }
}

function toItem(edge: ClaimEdge, row: any): ClaimReviewItem {
  const sourceRefs: KnowledgeSourceRef[] = Array.isArray(row.sourceRefs) ? row.sourceRefs : [];
  return {
    id: row.id,
    edge,
    subject: subjectOf(edge, row),
    approvedWording: edge === "preparation-effect" ? (row.approvedWording ?? null) : null,
    sourceRefs,
    citationProblems: sourceRefs.flatMap((ref) => validateSourceRef(ref)),
    status: deriveClaimReviewStatus(row),
    reviewedAt: row.reviewedAt ?? null,
    reviewedBy: row.reviewedBy ?? null,
    rejectedAt: row.rejectedAt ?? null,
    rejectedBy: row.rejectedBy ?? null,
    rejectionReason: row.rejectionReason ?? null,
    canApprove: canApproveClaim(row),
    isActive: row.isActive,
  };
}

// ── Reading ──────────────────────────────────────────────────────────────────

export interface ListClaimsOptions {
  edge?: ClaimEdge;
  status?: ClaimReviewStatus;
  /** Only claims carrying at least one citation. The publishable-now worklist. */
  citedOnly?: boolean;
  limit?: number;
}

/**
 * The reviewer's worklist.
 *
 * `citedOnly` separates the two backlogs KNOW1 §2.1 found were being read as
 * one: a claim with no citation needs a researcher to FIND a source, and a claim
 * with a good citation and no signature needs a reviewer to APPROVE it. Merging
 * them is what buried 64 publishable claims behind 3,299 unresearched ones.
 */
export async function listClaims(options: ListClaimsOptions = {}): Promise<ClaimReviewItem[]> {
  const edges = options.edge ? [options.edge] : CLAIM_EDGES;
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 1000);
  const items: ClaimReviewItem[] = [];

  for (const edge of edges) {
    const table: any = TABLES[edge];
    const conditions = [eq(table.isActive, true)];

    if (options.status === "pending") {
      conditions.push(isNull(table.reviewedAt), isNull(table.rejectedAt));
    } else if (options.status === "approved") {
      conditions.push(isNotNull(table.reviewedAt));
    } else if (options.status === "rejected") {
      conditions.push(isNotNull(table.rejectedAt));
    }
    if (options.citedOnly) {
      conditions.push(sql`jsonb_array_length(COALESCE(${table.sourceRefs}, '[]'::jsonb)) > 0`);
    }

    const rows = await db.select().from(table).where(and(...conditions)).orderBy(asc(table.id)).limit(limit);
    for (const row of rows) items.push(toItem(edge, row));
  }
  return items;
}

/** Counts per edge per state — the Admin surface's summary, and the honest denominator. */
export async function claimReviewSummary(): Promise<
  Array<{ edge: ClaimEdge; pending: number; pendingCited: number; approved: number; rejected: number }>
> {
  const out = [];
  for (const edge of CLAIM_EDGES) {
    const table: any = TABLES[edge];
    const [row] = await db
      .select({
        pending: sql<number>`count(*) FILTER (WHERE ${table.reviewedAt} IS NULL AND ${table.rejectedAt} IS NULL)::int`,
        pendingCited: sql<number>`count(*) FILTER (WHERE ${table.reviewedAt} IS NULL AND ${table.rejectedAt} IS NULL AND jsonb_array_length(COALESCE(${table.sourceRefs}, '[]'::jsonb)) > 0)::int`,
        approved: sql<number>`count(*) FILTER (WHERE ${table.reviewedAt} IS NOT NULL)::int`,
        rejected: sql<number>`count(*) FILTER (WHERE ${table.rejectedAt} IS NOT NULL)::int`,
      })
      .from(table)
      .where(eq(table.isActive, true));
    out.push({
      edge,
      pending: Number(row?.pending ?? 0),
      pendingCited: Number(row?.pendingCited ?? 0),
      approved: Number(row?.approved ?? 0),
      rejected: Number(row?.rejected ?? 0),
    });
  }
  return out;
}

export async function getClaim(edge: ClaimEdge, id: number): Promise<ClaimReviewItem | null> {
  const table: any = TABLES[edge];
  const [row] = await db.select().from(table).where(eq(table.id, id)).limit(1);
  return row ? toItem(edge, row) : null;
}

/** Every decision ever taken on one claim, oldest first. Never filtered, never trimmed. */
export async function getClaimHistory(edge: ClaimEdge, id: number): Promise<KnowledgeReviewAudit[]> {
  return db
    .select()
    .from(knowledgeReviewAudit)
    .where(and(eq(knowledgeReviewAudit.entity, AUDIT_ENTITY[edge]), eq(knowledgeReviewAudit.entityId, id)))
    .orderBy(asc(knowledgeReviewAudit.id));
}

/** The platform-wide decision log, newest first — "who has been approving health claims?" */
export async function listRecentClaimDecisions(limit = 100): Promise<KnowledgeReviewAudit[]> {
  return db
    .select()
    .from(knowledgeReviewAudit)
    .where(sql`${knowledgeReviewAudit.entity} LIKE 'claim:%'`)
    .orderBy(desc(knowledgeReviewAudit.id))
    .limit(Math.min(Math.max(limit, 1), 500));
}

// ── Writing — the one place a claim's publication state changes ──────────────

export interface ClaimDecision {
  edge: ClaimEdge;
  claimId: number;
  action: ClaimReviewAction;
  /** The human taking responsibility. Stored on the row, as KNOW5 requires. */
  reviewer: string;
  /** The reviewer's account, where the decision came from an authenticated surface. */
  reviewerUserId?: number | null;
  /** Mandatory for `reject`. Free text, retained forever. */
  reason?: string | null;
}

export interface ClaimDecisionResult {
  claim: ClaimReviewItem;
  auditId: number;
}

/**
 * Record one reviewer's decision on one claim.
 *
 * Every refusal below is a deliberate one; none is defensive coding:
 *
 *  - an unnamed reviewer is refused because KNOW5 established that an anonymous
 *    approval can never be audited or withdrawn;
 *  - an illegal transition is refused because `rejected → approve` in one step
 *    would let a mis-click reverse a colleague's refusal of a health claim;
 *  - approving an uncited claim is refused because approval writes the very
 *    column the Trust Gate reads, so the reviewer's judgement is necessary but
 *    never sufficient — Layer 1 must pass first;
 *  - a reason-less rejection is refused because an unexplained refusal cannot be
 *    appealed or reversed by anyone who was not in the room.
 */
export async function recordClaimDecision(
  decision: ClaimDecision,
  /**
   * An existing transaction to run inside.
   *
   * Supplied only by the KNOW2 verification suite, which exercises the whole
   * lifecycle against real rows and then rolls the transaction back, so proving
   * the workflow works costs no fabricated sign-off on a real health claim.
   * When omitted — which is every production caller — this opens its own
   * transaction, and the claim row and its audit row still commit together or
   * not at all.
   */
  existingTx?: any,
): Promise<ClaimDecisionResult> {
  const { edge, claimId, action } = decision;
  const reviewer = decision.reviewer?.trim();
  const reason = decision.reason?.trim() || null;

  if (!isClaimEdge(edge)) throw new ClaimReviewError(`Unknown claim edge "${edge}".`);
  if (!reviewer) {
    throw new ClaimReviewError(
      "A decision on a health claim must name the reviewer who made it. " +
        "An anonymous decision cannot be audited, attributed, or withdrawn.",
    );
  }
  if (action === "reject" && !reason) {
    throw new ClaimReviewError("A rejection must record why. An unexplained refusal cannot be reviewed or reversed.");
  }

  const table: any = TABLES[edge];

  const apply = async (tx: any): Promise<ClaimDecisionResult> => {
    // Locked for the length of the decision: two reviewers opening the same
    // pending claim is the ordinary case, and without this the second one's
    // approval would silently overwrite the first one's rejection.
    const rows: any[] = await tx.select().from(table).where(eq(table.id, claimId)).limit(1).for("update");
    const before: any = rows[0];
    if (!before) throw new ClaimReviewError(`No ${edge} claim with id ${claimId}.`, 404);

    const status = deriveClaimReviewStatus(before);
    if (!isAllowedClaimReviewAction(status, action)) {
      throw new ClaimReviewError(
        `Cannot ${action} a claim that is ${status}.` +
          (status === "rejected" && action === "approve"
            ? " Reopen it first — reversing a colleague's refusal of a health claim is a deliberate two-step act, never one click."
            : ""),
        409,
      );
    }
    if (action === "approve" && !canApproveClaim(before)) {
      throw new ClaimReviewError(
        "This claim carries no structurally valid Layer-1 citation, so it cannot be approved. " +
          "Approval writes the column the Trust Gate reads — a reviewer may not vouch a claim past a missing source.",
      );
    }

    const now = new Date();
    const patch =
      action === "approve"
        ? { reviewedAt: now, reviewedBy: reviewer, rejectedAt: null, rejectedBy: null, rejectionReason: null }
        : action === "reject"
          ? { reviewedAt: null, reviewedBy: null, rejectedAt: now, rejectedBy: reviewer, rejectionReason: reason }
          : { reviewedAt: null, reviewedBy: null, rejectedAt: null, rejectedBy: null, rejectionReason: null };

    // The invariant the database also enforces. Checked here too so a violation
    // surfaces as a stated reason rather than a constraint name.
    const lifecycleProblems = validateClaimLifecycleState({ ...before, ...patch });
    if (lifecycleProblems.length > 0) {
      throw new ClaimReviewError(`Refusing to write an inconsistent review state: ${lifecycleProblems.join("; ")}`);
    }

    const [after] = await tx.update(table).set(patch).where(eq(table.id, claimId)).returning();

    // Same transaction as the state change. If this insert fails the decision is
    // rolled back — an unrecorded approval of a health claim is worse than a
    // failed one.
    const [audit] = await tx
      .insert(knowledgeReviewAudit)
      .values({
        entity: AUDIT_ENTITY[edge],
        entityId: claimId,
        action: action === "approve" ? "approved" : action === "reject" ? "rejected" : "reopened",
        actorKind: "human",
        actorUserId: decision.reviewerUserId ?? null,
        before: auditSnapshot(edge, before),
        after: auditSnapshot(edge, after),
        detail:
          `${CLAIM_EDGE_LABELS[edge]}: ${subjectOf(edge, before)} — ${action} by ${reviewer}` +
          (reason ? ` — ${reason}` : ""),
      })
      .returning({ id: knowledgeReviewAudit.id });

    return { claim: toItem(edge, after), auditId: audit.id };
  };

  return existingTx ? apply(existingTx) : db.transaction(apply);
}

/**
 * What a decision preserves about the claim.
 *
 * The citations are captured verbatim on BOTH sides. A reviewer approves a claim
 * as it read at that moment; if its `source_refs` are edited afterwards, the
 * audit row is the only remaining evidence of what was actually vouched for.
 */
function auditSnapshot(edge: ClaimEdge, row: any): Record<string, unknown> {
  return {
    edge,
    subject: subjectOf(edge, row),
    status: deriveClaimReviewStatus(row),
    reviewedAt: row.reviewedAt ?? null,
    reviewedBy: row.reviewedBy ?? null,
    rejectedAt: row.rejectedAt ?? null,
    rejectedBy: row.rejectedBy ?? null,
    rejectionReason: row.rejectionReason ?? null,
    sourceRefs: Array.isArray(row.sourceRefs) ? row.sourceRefs : [],
    ...(edge === "preparation-effect" ? { approvedWording: row.approvedWording ?? null } : {}),
  };
}

/**
 * Approve every pending claim on an edge whose citations are structurally valid.
 *
 * This is the CLI's approve-all-valid behaviour (KNOW1 finding F5), preserved so
 * `npm run knowledge:signoff` keeps working, and routed through the per-claim
 * path so each row still gets its own audit trail and its own named reviewer.
 * It is deliberately NOT exposed to the Admin API: a bulk button is the rubber
 * stamp F5 warns about at import scale, and the honest place for it is a command
 * a reviewer must type after reading a printed list.
 */
export async function approveAllValid(
  edge: ClaimEdge,
  reviewer: string,
  reviewerUserId?: number | null,
): Promise<{ approved: number; skipped: number }> {
  const pending = await listClaims({ edge, status: "pending", citedOnly: true, limit: 1000 });
  let approved = 0;
  let skipped = 0;
  for (const claim of pending) {
    if (!claim.canApprove) {
      skipped++;
      continue;
    }
    await recordClaimDecision({ edge, claimId: claim.id, action: "approve", reviewer, reviewerUserId });
    approved++;
  }
  return { approved, skipped };
}
