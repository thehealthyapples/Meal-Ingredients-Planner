import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft, ShieldCheck, ThumbsUp, ThumbsDown, RotateCcw, ExternalLink,
  FileClock, AlertTriangle, CheckCircle2, Inbox,
} from "lucide-react";

// KNOW2 — the Admin review experience for nutrition health claims.
//
// This is NOT the Knowledge Review Workbench (/admin/knowledge-review). That
// surface governs VOCABULARY ALIASES — which string means which nutrient — and
// never touches claim evidence. This one governs CLAIMS: whether a statement
// about food and health may be shown to a household at all. KNOW1 finding F6
// records that the two lifecycles are easily mistaken for one, so they are kept
// visibly separate, and each says on its face what it decides.
//
// Three properties of this page are deliberate and should survive future edits:
//
//  1. THERE IS NO BULK APPROVE. Claims are reviewed one at a time. The
//     approve-all-valid path still exists behind `npm run knowledge:signoff`,
//     where a reviewer must read a printed list and type a confirmation flag.
//     A "select all → approve" button is the rubber stamp KNOW1 finding F5
//     warns about, and it would make a health claim approvable by mis-click.
//
//  2. THE CITATION IS THE PAGE. A reviewer cannot judge a claim from its slugs,
//     so every source is rendered as a real, clickable link with its publisher
//     and the date it was last checked. Approving without opening the source is
//     still possible — no interface can prevent that — but nothing here
//     encourages it.
//
//  3. EACH EDGE STATES WHAT APPROVAL MEANS. Approving a composition row is not
//     approving that the nutrient is good for you; it is approving that this
//     food is a notable source of it. The server sends that sentence per edge
//     rather than the page inventing one, so the two cannot drift.

type ClaimEdge = "composition" | "food-benefit" | "nutrient-benefit" | "preparation-effect";
type ClaimStatus = "pending" | "approved" | "rejected";

interface SourceRef {
  body: string;
  title: string;
  url: string;
  evidenceLevel: "established" | "emerging";
  lastReviewed: string;
}

interface ClaimItem {
  id: number;
  edge: ClaimEdge;
  subject: string;
  approvedWording: string | null;
  sourceRefs: SourceRef[];
  citationProblems: string[];
  status: ClaimStatus;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  canApprove: boolean;
  isActive: boolean;
}

interface ClaimsResponse {
  claims: ClaimItem[];
  labels: Record<ClaimEdge, string>;
  meanings: Record<ClaimEdge, string>;
}

interface SummaryRow {
  edge: ClaimEdge;
  pending: number;
  pendingCited: number;
  approved: number;
  rejected: number;
}

interface AuditRow {
  id: number;
  entity: string;
  entityId: number | null;
  action: string;
  actorKind: string;
  actorUserId: number | null;
  detail: string | null;
  createdAt: string;
}

const ALL = "__all__";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  if (status === "approved") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600" data-testid="badge-status-approved">Approved</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive" data-testid="badge-status-rejected">Rejected</Badge>;
  }
  return <Badge variant="secondary" data-testid="badge-status-pending">Awaiting review</Badge>;
}

export default function AdminKnowledgeClaimsPage() {
  const [edge, setEdge] = useState<string>(ALL);
  const [status, setStatus] = useState<string>("pending");
  const [citedOnly, setCitedOnly] = useState(true);

  // The claim a reviewer is rejecting, and the reason they are typing.
  const [rejecting, setRejecting] = useState<ClaimItem | null>(null);
  const [reason, setReason] = useState("");
  // The claim whose full decision history is open.
  const [historyFor, setHistoryFor] = useState<ClaimItem | null>(null);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (edge !== ALL) p.edge = edge;
    if (status !== ALL) p.status = status;
    if (citedOnly) p.citedOnly = "true";
    return new URLSearchParams(p).toString();
  }, [edge, status, citedOnly]);

  const { data, isPending } = useQuery<ClaimsResponse>({
    queryKey: ["/api/admin/knowledge-claims", params],
    queryFn: () => apiRequest("GET", `/api/admin/knowledge-claims?${params}`).then(r => r.json()),
  });

  const { data: summaryData } = useQuery<{ summary: SummaryRow[] }>({
    queryKey: ["/api/admin/knowledge-claims/summary"],
    queryFn: () => apiRequest("GET", "/api/admin/knowledge-claims/summary").then(r => r.json()),
  });

  const { data: historyData, isPending: historyPending } = useQuery<{ claim: ClaimItem; history: AuditRow[] }>({
    queryKey: ["/api/admin/knowledge-claims/history", historyFor?.edge, historyFor?.id],
    queryFn: () =>
      apiRequest("GET", `/api/admin/knowledge-claims/${historyFor!.edge}/${historyFor!.id}/history`).then(r => r.json()),
    enabled: historyFor !== null,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-claims"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-claims/summary"] });
  }

  const decide = useTrackedMutation({
    mutationFn: (vars: { claim: ClaimItem; action: "approve" | "reject" | "reopen"; reason?: string }) =>
      apiRequest("POST", `/api/admin/knowledge-claims/${vars.claim.edge}/${vars.claim.id}/decision`, {
        action: vars.action,
        reason: vars.reason ?? null,
      }).then(r => r.json()),
    onSuccess: () => {
      invalidate();
      setRejecting(null);
      setReason("");
    },
    feedback: {
      success: (_data, vars) =>
        vars.action === "approve" ? "Claim approved" : vars.action === "reject" ? "Claim rejected" : "Claim reopened",
      successDescription: (_data, vars) =>
        vars.action === "approve"
          ? "It is now visible to households wherever this claim is used. The decision is recorded permanently."
          : vars.action === "reject"
            ? "It will never be shown to a household. The decision and your reason are recorded permanently."
            : "It is back in the review queue, and dark until someone approves it.",
      failure: "That decision could not be recorded",
      failureDescription: "Nothing was changed. Try again, and if it keeps failing the claim is safest left as it is.",
      /**
       * A refusal is not a failure.
       *
       * The store declines decisions on purpose — a claim with no valid citation
       * cannot be approved, a rejected claim must be reopened before it can be
       * approved again — and each refusal carries the reason a reviewer needs in
       * order to act. Raising those in red, in the same voice THA uses for lost
       * data, would train reviewers to dismiss the one message that tells them
       * what to do next. A 5xx is a real failure and still alarms.
       */
      satisfied: (error: any) => {
        const match = /^(\d{3}): (.*)$/s.exec(error?.message ?? "");
        if (!match) return null;
        const status = Number(match[1]);
        if (status >= 500) return null;
        let message = match[2];
        try { message = JSON.parse(match[2])?.message ?? message; } catch { /* plain text body */ }
        return { title: "That decision was declined", description: message };
      },
    },
  });

  const claims = data?.claims ?? [];
  const summary = summaryData?.summary ?? [];
  const totals = summary.reduce(
    (acc, row) => ({
      pending: acc.pending + row.pending,
      pendingCited: acc.pendingCited + row.pendingCited,
      approved: acc.approved + row.approved,
      rejected: acc.rejected + row.rejected,
    }),
    { pending: 0, pendingCited: 0, approved: 0, rejected: 0 },
  );

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4" data-testid="admin-knowledge-claims-page">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Admin
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="heading-knowledge-claims">
          Nutrition Claim Review
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
        Every claim approved here becomes visible to households across Food, Meal, Pantry and Planner
        Intelligence, the Companion, nutrition reports and Plant Diversity. Nothing renders until a
        named reviewer approves it, and every decision is recorded permanently.{" "}
        <Link href="/admin/knowledge-review" className="underline hover:text-foreground">
          Vocabulary aliases are reviewed separately
        </Link>
        .
      </p>

      {/* The honest denominator: what is waiting, what is publishable, what has been decided. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Publishable now", value: totals.pendingCited, hint: "cited, awaiting a reviewer", icon: Inbox },
          { label: "Awaiting a source", value: totals.pending - totals.pendingCited, hint: "cannot be approved yet", icon: AlertTriangle },
          { label: "Approved", value: totals.approved, hint: "live to households", icon: CheckCircle2 },
          { label: "Rejected", value: totals.rejected, hint: "refused, never shown", icon: ThumbsDown },
        ].map(card => (
          <div key={card.label} className="rounded-lg border p-3" data-testid={`summary-${card.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <card.icon className="h-3.5 w-3.5" /> {card.label}
            </div>
            <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
            <div className="text-xs text-muted-foreground">{card.hint}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="grid gap-1.5">
          <Label className="text-xs">Claim type</Label>
          <Select value={edge} onValueChange={setEdge}>
            <SelectTrigger className="w-[260px]" data-testid="select-edge"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All claim types</SelectItem>
              {(Object.entries(data?.labels ?? {}) as Array<[ClaimEdge, string]>).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]" data-testid="select-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Awaiting review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value={ALL}>All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={citedOnly ? "default" : "outline"}
          onClick={() => setCitedOnly(v => !v)}
          data-testid="button-toggle-cited"
        >
          {citedOnly ? "Showing cited only" : "Showing all"}
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : claims.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground" data-testid="empty-claims">
          <Inbox className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-foreground mb-1">Nothing here</p>
          <p className="text-sm">
            {status === "pending" && citedOnly
              ? "No cited claim is waiting for a reviewer. Claims without a source are hidden — switch to “Showing all” to see them."
              : "No claims match these filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map(claim => (
            <div key={`${claim.edge}-${claim.id}`} className="rounded-lg border p-4" data-testid={`claim-${claim.edge}-${claim.id}`}>
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div>
                  <div className="font-medium" data-testid={`claim-subject-${claim.id}`}>{claim.subject}</div>
                  <div className="text-xs text-muted-foreground">{data?.labels?.[claim.edge]}</div>
                </div>
                <StatusBadge status={claim.status} />
              </div>

              {/* What the reviewer is actually vouching for. */}
              <p className="text-xs text-muted-foreground italic mb-3">{data?.meanings?.[claim.edge]}</p>

              {/* The exact sentence households see, where the edge has one. */}
              {claim.approvedWording && (
                <blockquote className="border-l-2 pl-3 text-sm mb-3" data-testid={`claim-wording-${claim.id}`}>
                  “{claim.approvedWording}”
                </blockquote>
              )}

              <div className="space-y-1.5 mb-3">
                {claim.sourceRefs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No citation. This claim cannot be approved until a source is attached.
                  </p>
                ) : (
                  claim.sourceRefs.map((ref, i) => (
                    <div key={i} className="text-sm">
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline hover:text-primary"
                        data-testid={`claim-source-${claim.id}-${i}`}
                      >
                        {ref.body}: {ref.title} <ExternalLink className="h-3 w-3" />
                      </a>
                      <span className="text-xs text-muted-foreground ml-2">
                        {ref.evidenceLevel} · link checked {ref.lastReviewed}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {claim.citationProblems.length > 0 && (
                <div className="rounded border border-destructive/40 bg-destructive/5 p-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-destructive mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> This citation cannot clear Layer 1
                  </div>
                  <ul className="text-xs text-muted-foreground list-disc pl-5">
                    {claim.citationProblems.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {claim.status === "approved" && (
                <p className="text-xs text-muted-foreground mb-3" data-testid={`claim-approval-${claim.id}`}>
                  Approved by <strong>{claim.reviewedBy ?? "an unnamed reviewer"}</strong> on {formatDate(claim.reviewedAt)}
                </p>
              )}
              {claim.status === "rejected" && (
                <div className="text-xs text-muted-foreground mb-3" data-testid={`claim-rejection-${claim.id}`}>
                  Rejected by <strong>{claim.rejectedBy}</strong> on {formatDate(claim.rejectedAt)}
                  <div className="mt-1 italic">“{claim.rejectionReason}”</div>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {claim.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      disabled={!claim.canApprove || decide.isPending}
                      onClick={() => decide.mutate({ claim, action: "approve" })}
                      data-testid={`button-approve-${claim.id}`}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decide.isPending}
                      onClick={() => { setRejecting(claim); setReason(""); }}
                      data-testid={`button-reject-${claim.id}`}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" /> Reject
                    </Button>
                    {!claim.canApprove && (
                      <span className="text-xs text-muted-foreground">
                        Approval needs at least one valid Layer-1 citation.
                      </span>
                    )}
                  </>
                )}
                {claim.status === "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decide.isPending}
                    onClick={() => { setRejecting(claim); setReason(""); }}
                    data-testid={`button-withdraw-${claim.id}`}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" /> Withdraw
                  </Button>
                )}
                {claim.status === "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ claim, action: "reopen" })}
                    data-testid={`button-reopen-${claim.id}`}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" /> Reopen for review
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setHistoryFor(claim)}
                  data-testid={`button-history-${claim.id}`}
                >
                  <FileClock className="h-4 w-4 mr-2" /> History
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection: a reason is mandatory, because an unexplained refusal cannot
          be appealed or reversed by anyone who was not in the room. */}
      <Dialog open={rejecting !== null} onOpenChange={open => { if (!open) { setRejecting(null); setReason(""); } }}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>
              {rejecting?.status === "approved" ? "Withdraw this claim" : "Reject this claim"}
            </DialogTitle>
            <DialogDescription>
              {rejecting?.subject}
              {rejecting?.status === "approved"
                ? " — this claim is currently visible to households. Withdrawing it hides it immediately."
                : " — it will stop appearing in the review queue and will never be shown to a household."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-reason">Why are you rejecting it?</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. the cited NHS page does not support this specific claim about this food"
              data-testid="input-reject-reason"
            />
            <p className="text-xs text-muted-foreground">
              Recorded permanently and shown to whoever reviews this claim next.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setRejecting(null); setReason(""); }} data-testid="button-cancel-reject">
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || decide.isPending}
              onClick={() => rejecting && decide.mutate({ claim: rejecting, action: "reject", reason: reason.trim() })}
              data-testid="button-confirm-reject"
            >
              {rejecting?.status === "approved" ? "Withdraw" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* The full, unfiltered decision history for one claim. */}
      <Dialog open={historyFor !== null} onOpenChange={open => { if (!open) setHistoryFor(null); }}>
        <DialogContent data-testid="dialog-history">
          <DialogHeader>
            <DialogTitle>Decision history</DialogTitle>
            <DialogDescription>{historyFor?.subject}</DialogDescription>
          </DialogHeader>
          {historyPending ? (
            <Skeleton className="h-24 w-full" />
          ) : (historyData?.history ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="history-empty">
              No decision has been recorded for this claim yet.
            </p>
          ) : (
            <ul className="space-y-3 max-h-[50vh] overflow-y-auto">
              {(historyData?.history ?? []).map(row => (
                <li key={row.id} className="border-l-2 pl-3" data-testid={`history-row-${row.id}`}>
                  <div className="text-sm font-medium capitalize">{row.action}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</div>
                  {row.detail && <div className="text-xs mt-1">{row.detail}</div>}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
