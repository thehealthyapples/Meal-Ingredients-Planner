/**
 * companion-action.ts — INT40 Companion Task Delegation & Assisted Actions
 * ===========================================================================
 * The presentation-logic core of the Companion Action framework. It transforms
 * the raw `CompanionActionProposal[]` a conversation turn returns into a
 * client-agnostic VIEW MODEL FloatingAssistant.tsx renders.
 *
 * DISTINCT FROM COMPANION CARDS (companion-card.ts) — DELIBERATELY:
 *   Companion Cards summarise information and NEVER mutate ("no mutation
 *   happens on a card" — docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md).
 *   Companion Actions are the opposite: structured, EXECUTABLE operations the
 *   Companion performs on the user's behalf, always behind explicit
 *   confirmation. They are rendered in their own block, never inside or
 *   attached to a card. This module does not import from or modify
 *   companion-card.ts — the two stay architecturally separate by construction.
 *
 * This module is pure (no React, no DOM, no "@/" imports) so it is exercised
 * directly by tests and stays reusable on Web, Mobile and future clients,
 * exactly like companion-card.ts.
 */

// ---------------------------------------------------------------------------
// Raw server contract (mirrors shared/schema.ts companionActionProposals, as
// returned over JSON — dates are ISO strings, not Date objects)
// ---------------------------------------------------------------------------

export type ActionProposalStatus =
  | "proposed"
  | "confirmed"
  | "in_progress"
  | "succeeded"
  | "failed"
  | "cancelled";

export type ConfirmationTier = "none" | "light" | "required" | "strong";

export interface CompanionActionProposal {
  id: number;
  conversationTurnId: number;
  workflowId: string;
  capabilityId: string;
  verb: string;
  label: string;
  parameters: Record<string, unknown>;
  confirmationTier: ConfirmationTier;
  status: ActionProposalStatus;
  resultSummary: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// ---------------------------------------------------------------------------
// Presentation view model
// ---------------------------------------------------------------------------

/**
 * How this action's confirmation should be presented, derived purely from its
 * server-computed `confirmationTier` (never re-decided client-side):
 *   - "inline"  — light tier: a single confirm button, no extra dialog.
 *   - "dialog"  — required/strong tier: an explicit echo + confirm dialog
 *                 before the confirm call is made.
 */
export type ConfirmationPresentation = "inline" | "dialog";

export interface CompanionActionView {
  readonly id: number;
  readonly label: string;
  readonly confirmationTier: ConfirmationTier;
  readonly confirmationPresentation: ConfirmationPresentation;
  readonly status: ActionProposalStatus;
  readonly resultSummary: string | null;
  readonly errorMessage: string | null;
  /** True once this action has reached succeeded / failed / cancelled. */
  readonly isTerminal: boolean;
}

export interface CompanionActionWorkflowView {
  readonly workflowId: string;
  readonly actions: CompanionActionView[];
  readonly totalCount: number;
  readonly resolvedCount: number;
  readonly succeededCount: number;
  readonly failedCount: number;
  readonly cancelledCount: number;
  /** True once every action in the workflow has reached a terminal status. */
  readonly isComplete: boolean;
  /** True once complete AND at least one action succeeded and at least one did not. */
  readonly isPartialCompletion: boolean;
}

const TERMINAL: ReadonlySet<ActionProposalStatus> = new Set<ActionProposalStatus>(["succeeded", "failed", "cancelled"]);

function confirmationPresentationFor(tier: ConfirmationTier): ConfirmationPresentation {
  return tier === "required" || tier === "strong" ? "dialog" : "inline";
}

function toActionView(proposal: CompanionActionProposal): CompanionActionView {
  return {
    id: proposal.id,
    label: proposal.label,
    confirmationTier: proposal.confirmationTier,
    confirmationPresentation: confirmationPresentationFor(proposal.confirmationTier),
    status: proposal.status,
    resultSummary: proposal.resultSummary,
    errorMessage: proposal.errorMessage,
    isTerminal: TERMINAL.has(proposal.status),
  };
}

/**
 * Group a turn's Companion Action proposals into one or more workflows
 * (grouped by `workflowId`, in resolved id order) and build the view model for
 * each. A single proposed action is a length-1 workflow — the UI renders it as
 * one confirm button rather than a "step 1 of 1" progress bar.
 */
export function buildCompanionActionWorkflowViews(
  proposals: readonly CompanionActionProposal[],
): CompanionActionWorkflowView[] {
  const byWorkflow = new Map<string, CompanionActionProposal[]>();
  for (const p of proposals) {
    const rows = byWorkflow.get(p.workflowId) ?? [];
    rows.push(p);
    byWorkflow.set(p.workflowId, rows);
  }

  const workflows: CompanionActionWorkflowView[] = [];
  for (const [workflowId, rows] of Array.from(byWorkflow.entries())) {
    const ordered = rows.slice().sort((a, b) => a.id - b.id);
    const actions = ordered.map(toActionView);
    const succeededCount = actions.filter((a) => a.status === "succeeded").length;
    const failedCount = actions.filter((a) => a.status === "failed").length;
    const cancelledCount = actions.filter((a) => a.status === "cancelled").length;
    const resolvedCount = succeededCount + failedCount + cancelledCount;
    const isComplete = resolvedCount === actions.length;
    workflows.push({
      workflowId,
      actions,
      totalCount: actions.length,
      resolvedCount,
      succeededCount,
      failedCount,
      cancelledCount,
      isComplete,
      isPartialCompletion: isComplete && succeededCount > 0 && resolvedCount > succeededCount,
    });
  }
  return workflows;
}

/**
 * A human-readable terminal summary for a completed workflow — names what
 * succeeded, what failed/was cancelled, honestly. Returns null while the
 * workflow is still in progress (no summary is fabricated before it's true).
 */
export function buildWorkflowOutcomeSummary(workflow: CompanionActionWorkflowView): string | null {
  if (!workflow.isComplete) return null;
  if (workflow.failedCount === 0 && workflow.cancelledCount === 0) {
    return workflow.totalCount === 1
      ? `Done — ${workflow.actions[0].label.toLowerCase()}.`
      : `Done — all ${workflow.totalCount} actions completed.`;
  }
  const parts: string[] = [];
  if (workflow.succeededCount > 0) {
    parts.push(`${workflow.succeededCount} of ${workflow.totalCount} succeeded`);
  }
  const failed = workflow.actions.filter((a) => a.status === "failed");
  if (failed.length > 0) {
    parts.push(`couldn't ${failed.map((a) => a.label.toLowerCase()).join("; ")}`);
  }
  const cancelled = workflow.actions.filter((a) => a.status === "cancelled");
  if (cancelled.length > 0) {
    parts.push(`${cancelled.length} cancelled`);
  }
  return parts.join(" — ") + ".";
}
