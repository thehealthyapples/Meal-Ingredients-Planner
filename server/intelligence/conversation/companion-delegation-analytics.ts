/**
 * companion-delegation-analytics.ts — INT40 Companion Task Delegation & Assisted Actions
 * ==========================================================================================
 * PURE aggregation over `companion_action_proposals` rows (read by routes.ts via
 * companion-action-store.ts and passed in here) into the metrics the Companion
 * Intelligence Dashboard surfaces for delegated actions.
 *
 * HARD BOUNDARIES (mirrors companion-guidance-analytics.ts):
 *  - No storage reads, no platform calls, no business logic — every function here
 *    is (array in) → (plain object out).
 *  - Honest gaps over fabricated data: every rate is `null` when its denominator is
 *    zero — never a fabricated 0%/100%. Ranked lists carry a `reliable` flag rather
 *    than hiding rows below a minimum sample size.
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-actions.ts
 */

import type { CompanionActionProposal } from "../../../shared/schema.js";

/** Below this many proposals for a grouping key, a ranked row is marked unreliable, never hidden. */
const MIN_SAMPLE_SIZE = 3;

const TERMINAL: ReadonlySet<string> = new Set(["succeeded", "failed", "cancelled"]);

// ---------------------------------------------------------------------------
// Delegated task completion rate
// ---------------------------------------------------------------------------

export interface CompletionRateResult {
  readonly rate: number | null;
  readonly totalSucceeded: number;
  readonly totalTerminal: number;
}

/** succeeded / (succeeded + failed + cancelled). Null when nothing has resolved yet. */
export function computeCompletionRate(
  proposals: readonly CompanionActionProposal[],
): CompletionRateResult {
  const terminal = proposals.filter((p) => TERMINAL.has(p.status));
  const succeeded = terminal.filter((p) => p.status === "succeeded").length;
  return {
    rate: terminal.length > 0 ? succeeded / terminal.length : null,
    totalSucceeded: succeeded,
    totalTerminal: terminal.length,
  };
}

// ---------------------------------------------------------------------------
// Most frequently delegated actions
// ---------------------------------------------------------------------------

export interface DelegatedActionCount {
  readonly capabilityId: string;
  readonly verb: string;
  readonly count: number;
}

/** (capabilityId, verb) pairs ranked by how often they were proposed, most first. */
export function computeMostDelegatedActions(
  proposals: readonly CompanionActionProposal[],
): DelegatedActionCount[] {
  const counts = new Map<string, DelegatedActionCount>();
  for (const p of proposals) {
    const key = `${p.capabilityId}::${p.verb}`;
    const existing = counts.get(key);
    counts.set(key, { capabilityId: p.capabilityId, verb: p.verb, count: (existing?.count ?? 0) + 1 });
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Action success / cancellation / partial-completion rates
// ---------------------------------------------------------------------------

export interface RateResult {
  readonly rate: number | null;
  readonly numerator: number;
  readonly denominator: number;
}

/** succeeded / (succeeded + failed) — excludes cancellations, which are a user decision, not a failure. */
export function computeActionSuccessRate(
  proposals: readonly CompanionActionProposal[],
): RateResult {
  const succeeded = proposals.filter((p) => p.status === "succeeded").length;
  const failed = proposals.filter((p) => p.status === "failed").length;
  const denominator = succeeded + failed;
  return { rate: denominator > 0 ? succeeded / denominator : null, numerator: succeeded, denominator };
}

/** cancelled / all terminal proposals. */
export function computeActionCancellationRate(
  proposals: readonly CompanionActionProposal[],
): RateResult {
  const terminal = proposals.filter((p) => TERMINAL.has(p.status));
  const cancelled = terminal.filter((p) => p.status === "cancelled").length;
  return { rate: terminal.length > 0 ? cancelled / terminal.length : null, numerator: cancelled, denominator: terminal.length };
}

/** Workflows (workflowId groups) with >=2 actions where at least one succeeded and at least one did not. */
export function computePartialCompletionRate(
  proposals: readonly CompanionActionProposal[],
): RateResult {
  const byWorkflow = groupByWorkflow(proposals);
  const multiActionWorkflows = Array.from(byWorkflow.values()).filter((rows) => rows.length >= 2);
  const partial = multiActionWorkflows.filter((rows) => {
    const terminal = rows.filter((r) => TERMINAL.has(r.status));
    if (terminal.length === 0) return false;
    const hasSuccess = terminal.some((r) => r.status === "succeeded");
    const hasNonSuccess = terminal.some((r) => r.status !== "succeeded");
    return hasSuccess && hasNonSuccess;
  });
  return {
    rate: multiActionWorkflows.length > 0 ? partial.length / multiActionWorkflows.length : null,
    numerator: partial.length,
    denominator: multiActionWorkflows.length,
  };
}

// ---------------------------------------------------------------------------
// Workflow grouping shared by duration / abandonment / success ranking
// ---------------------------------------------------------------------------

function groupByWorkflow(
  proposals: readonly CompanionActionProposal[],
): Map<string, CompanionActionProposal[]> {
  const byWorkflow = new Map<string, CompanionActionProposal[]>();
  for (const p of proposals) {
    const rows = byWorkflow.get(p.workflowId) ?? [];
    rows.push(p);
    byWorkflow.set(p.workflowId, rows);
  }
  return byWorkflow;
}

/** A deterministic, human-readable signature for a workflow — its ordered (capabilityId:verb) steps. */
function workflowSignature(rows: readonly CompanionActionProposal[]): string {
  return rows
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((r) => `${r.capabilityId}:${r.verb}`)
    .join(" → ");
}

// ---------------------------------------------------------------------------
// Average delegated workflow duration
// ---------------------------------------------------------------------------

export interface WorkflowDurationResult {
  readonly averageSeconds: number | null;
  readonly sampleSize: number;
}

/** Average (last resolvedAt − first createdAt) across fully-resolved workflows, in seconds. */
export function computeAverageWorkflowDuration(
  proposals: readonly CompanionActionProposal[],
): WorkflowDurationResult {
  const byWorkflow = groupByWorkflow(proposals);
  const durations: number[] = [];
  for (const rows of Array.from(byWorkflow.values())) {
    if (!rows.every((r) => TERMINAL.has(r.status))) continue; // only fully-resolved workflows
    const starts = rows.map((r) => r.createdAt.getTime());
    const ends = rows.map((r) => r.resolvedAt?.getTime()).filter((t): t is number => t != null);
    if (ends.length !== rows.length) continue; // honest gap — a terminal row without resolvedAt is malformed, skip rather than guess
    durations.push((Math.max(...ends) - Math.min(...starts)) / 1000);
  }
  if (durations.length === 0) return { averageSeconds: null, sampleSize: 0 };
  const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  return { averageSeconds: average, sampleSize: durations.length };
}

// ---------------------------------------------------------------------------
// Most abandoned / most successful delegated workflows
// ---------------------------------------------------------------------------

export interface WorkflowSignatureResult {
  readonly signature: string;
  readonly stepCount: number;
  readonly count: number;
  readonly reliable: boolean;
}

/**
 * Workflow signatures (ordered capability:verb steps) ranked by how often they were
 * ABANDONED — every proposal in the workflow still sitting in "proposed" (never
 * confirmed, never cancelled), most abandoned first.
 */
export function computeMostAbandonedWorkflows(
  proposals: readonly CompanionActionProposal[],
): WorkflowSignatureResult[] {
  const byWorkflow = groupByWorkflow(proposals);
  const counts = new Map<string, number>();
  for (const rows of Array.from(byWorkflow.values())) {
    if (!rows.every((r) => r.status === "proposed")) continue;
    const sig = workflowSignature(rows);
    counts.set(sig, (counts.get(sig) ?? 0) + 1);
  }
  return rankSignatures(counts);
}

/**
 * Workflow signatures ranked by how often EVERY action in the workflow succeeded,
 * most successful first.
 */
export function computeMostSuccessfulWorkflows(
  proposals: readonly CompanionActionProposal[],
): WorkflowSignatureResult[] {
  const byWorkflow = groupByWorkflow(proposals);
  const counts = new Map<string, number>();
  for (const rows of Array.from(byWorkflow.values())) {
    if (!rows.every((r) => r.status === "succeeded")) continue;
    const sig = workflowSignature(rows);
    counts.set(sig, (counts.get(sig) ?? 0) + 1);
  }
  return rankSignatures(counts);
}

function rankSignatures(counts: Map<string, number>): WorkflowSignatureResult[] {
  return Array.from(counts.entries())
    .map(([signature, count]) => ({
      signature,
      stepCount: signature.split(" → ").length,
      count,
      reliable: count >= MIN_SAMPLE_SIZE,
    }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Aggregate dashboard payload
// ---------------------------------------------------------------------------

export interface DelegationDashboardStats {
  readonly completionRate: CompletionRateResult;
  readonly mostDelegatedActions: DelegatedActionCount[];
  readonly successRate: RateResult;
  readonly cancellationRate: RateResult;
  readonly partialCompletionRate: RateResult;
  readonly averageWorkflowDuration: WorkflowDurationResult;
  readonly mostAbandonedWorkflows: WorkflowSignatureResult[];
  readonly mostSuccessfulWorkflows: WorkflowSignatureResult[];
}

/** Compute every INT40 dashboard metric from one array of proposal rows. */
export function computeDelegationDashboardStats(
  proposals: readonly CompanionActionProposal[],
): DelegationDashboardStats {
  return {
    completionRate: computeCompletionRate(proposals),
    mostDelegatedActions: computeMostDelegatedActions(proposals),
    successRate: computeActionSuccessRate(proposals),
    cancellationRate: computeActionCancellationRate(proposals),
    partialCompletionRate: computePartialCompletionRate(proposals),
    averageWorkflowDuration: computeAverageWorkflowDuration(proposals),
    mostAbandonedWorkflows: computeMostAbandonedWorkflows(proposals),
    mostSuccessfulWorkflows: computeMostSuccessfulWorkflows(proposals),
  };
}
