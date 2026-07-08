import { Fragment, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Search, ChevronLeft, ClipboardList, ArrowUpDown, Pencil, Check, X, Download,
  Upload, ShieldCheck, ThumbsUp, ThumbsDown, PackageOpen,
  GitCompare, AlertTriangle, Scale, Users, Inbox, CheckCircle2,
  Rocket, Activity, RotateCcw, TrendingUp, TrendingDown, Minus, Database,
  FileClock, Link2,
} from "lucide-react";

// KQ1C — Knowledge Review Workbench, Phase 1. The first Knowledge Review
// WORKSPACE: browse, inline & bulk edit of editorial review fields, advanced
// filtering, and export for external LLM review (JSON/CSV). No import, no
// approvals, no canonical changes, no rollback — those are later phases.

interface ReviewContext {
  source: string;
  foodSlug?: string;
  file?: string;
  path?: string;
  note?: string;
  at?: string;
}
interface ReviewItem {
  id: number;
  reviewType: string;
  domain: string;
  dedupeKey: string;
  label: string;
  source: string;
  contexts: ReviewContext[];
  details: Record<string, unknown>;
  occurrenceCount: number;
  status: string;
  priority: string | null;
  knowledgeOrigin: string | null;
  reviewNotes: string | null;
  suggestedCanonicalSlug: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}
interface QueueResponse { items: ReviewItem[]; total: number }
interface CanonicalOption { slug: string; name: string }
interface OptionsResponse {
  priorities: string[];
  statuses: string[];
  origins: string[];
  canonical: { nutrient: CanonicalOption[]; benefit: CanonicalOption[] };
}

// ── KQ1D — Phase 2: imported proposals & batches ────────────────────────────
interface ImportBatch {
  id: number;
  direction: string;
  schemaVersion: string | null;
  checksum: string | null;
  exportedAt: string | null;
  reviewerModel: string | null;
  sourceFilename: string | null;
  itemCount: number;
  proposalCount: number;
  status: string;
  createdAt: string;
}
interface DecisionTerm {
  id: number;
  label: string;
  domain: string;
  dedupeKey: string;
  status: string;
}
interface Decision {
  id: number;
  batchId: number;
  termId: number;
  domain: string | null;
  decisionType: string;
  targetCanonicalSlug: string | null;
  aliasString: string | null;
  proposedNewSlug: string | null;
  proposedNewName: string | null;
  proposedNewDescription: string | null;
  rationale: string | null;
  confidence: string | null;
  reviewer: string | null;
  reviewerModel: string | null;
  reviewerNotes: string | null;
  status: string;
  createdAt: string;
  term: DecisionTerm | null;
}
interface ImportResult {
  batchId: number;
  itemCount: number;
  created: number;
  skippedExisting: number;
  skippedMissingTerm: number;
  skippedInvalid: number;
  warnings: string[];
}

const DECISION_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  alias: "default",
  new_identity: "secondary",
  reject: "destructive",
  defer: "outline",
};
const DECISION_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  proposed: "outline",
  approved: "default",
  rejected: "destructive",
  superseded: "secondary",
};

// ── KQ1E — Phase 3: Consensus & Comparison ──────────────────────────────────
type ConsensusState =
  | "awaiting_review" | "awaiting_consensus" | "conflict" | "consensus" | "approved" | "inactive";
interface ConsensusProposal {
  id: number;
  batchId: number;
  decisionType: string;
  targetCanonicalSlug: string | null;
  aliasString: string | null;
  proposedNewSlug: string | null;
  proposedNewName: string | null;
  proposedNewDescription: string | null;
  rationale: string | null;
  confidence: string | null;
  reviewer: string | null;
  reviewerModel: string | null;
  reviewerNotes: string | null;
  status: string;
  signature: string;
  createdAt: string;
}
interface ConsensusOption { signature: string; count: number; sample: ConsensusProposal }
interface ConsensusGroup {
  term: { id: number; label: string; domain: string; dedupeKey: string; status: string; reviewType: string };
  state: ConsensusState;
  totalProposals: number;
  activeCount: number;
  options: ConsensusOption[];
  agreement: { agreed: boolean; majoritySignature: string | null; majorityCount: number; ratio: number; reviewerCount: number };
  proposals: ConsensusProposal[];
}
interface ConsensusResponse {
  counts: {
    awaitingReview: number; awaitingConsensus: number; conflicting: number;
    awaitingApproval: number; approved: number; totalTerms: number; totalProposals: number;
  };
  groups: ConsensusGroup[];
}

const STATE_LABEL: Record<ConsensusState, string> = {
  awaiting_review: "Awaiting review",
  awaiting_consensus: "Awaiting consensus",
  conflict: "Conflict",
  consensus: "Consensus",
  approved: "Approved",
  inactive: "Inactive",
};
const STATE_VARIANT: Record<ConsensusState, "default" | "secondary" | "outline" | "destructive"> = {
  awaiting_review: "outline",
  awaiting_consensus: "secondary",
  conflict: "destructive",
  consensus: "default",
  approved: "default",
  inactive: "outline",
};

/** Render a decision signature ("alias:omega-3") as a human phrase. */
function signatureLabel(sig: string): string {
  if (sig.startsWith("alias:")) { const s = sig.slice(6); return s ? `alias → ${s}` : "alias → ?"; }
  if (sig.startsWith("new_identity:")) { const s = sig.slice(13); return s ? `new identity: ${s}` : "new identity"; }
  return sig; // reject | defer
}

/** The comparison detail of a single proposal (target / proposed slug). */
function proposalDetail(p: ConsensusProposal): string {
  if (p.decisionType === "alias") return `${p.aliasString ?? "?"} → ${p.targetCanonicalSlug ?? "?"}`;
  if (p.decisionType === "new_identity") return p.proposedNewSlug ? `${p.proposedNewSlug}${p.proposedNewName ? ` (${p.proposedNewName})` : ""}` : "new identity";
  return "—";
}

type SortBy = "lastSeenAt" | "firstSeenAt" | "occurrenceCount" | "label" | "priority" | "status";

const ALL = "all";
const NONE = "__none__"; // sentinel for "clear this field" in selects

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return iso; }
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

// The mutable review fields of one row while it is being edited inline.
interface EditDraft {
  priority: string;            // "" = none
  status: string;
  knowledgeOrigin: string;
  suggestedCanonicalSlug: string;
  reviewNotes: string;
}

function draftFrom(item: ReviewItem): EditDraft {
  return {
    priority: item.priority ?? "",
    status: item.status,
    knowledgeOrigin: item.knowledgeOrigin ?? "",
    suggestedCanonicalSlug: item.suggestedCanonicalSlug ?? "",
    reviewNotes: item.reviewNotes ?? "",
  };
}

// ── KQ1D — Phase 2: imported proposals panel ────────────────────────────────
// Displays imported Knowledge Review Package batches and their proposals, with a
// human approve/reject gate. Approval records intent only — nothing is applied
// to canonical space here (apply/hand-off/rollback are later phases).
function ProposalsPanel() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  const { data: batchData } = useQuery<{ batches: ImportBatch[] }>({
    queryKey: ["/api/admin/knowledge-review/batches"],
    queryFn: () => apiRequest("GET", "/api/admin/knowledge-review/batches").then(r => r.json()),
  });
  const decisionsQs = statusFilter !== ALL ? `?status=${statusFilter}` : "";
  const { data: decisionData, isPending } = useQuery<{ decisions: Decision[] }>({
    queryKey: ["/api/admin/knowledge-review/decisions", decisionsQs],
    queryFn: () => apiRequest("GET", `/api/admin/knowledge-review/decisions${decisionsQs}`).then(r => r.json()),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/decisions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/batches"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/queue"] });
  };

  const gateMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      apiRequest("POST", `/api/admin/knowledge-review/decisions/${id}/${action}`).then(r => r.json()),
    onSuccess: (_res, vars) => { invalidate(); toast({ description: `Proposal ${vars.action === "approve" ? "approved" : "rejected"}.` }); },
    onError: (e: any) => toast({ variant: "destructive", description: e?.message || "Action failed." }),
  });

  const batches = batchData?.batches ?? [];
  const decisions = decisionData?.decisions ?? [];

  function decisionDetail(d: Decision): string {
    if (d.decisionType === "alias") {
      return `${d.aliasString ?? "?"} → ${d.targetCanonicalSlug ?? "?"}`;
    }
    if (d.decisionType === "new_identity") {
      return d.proposedNewSlug ? `${d.proposedNewSlug}${d.proposedNewName ? ` (${d.proposedNewName})` : ""}` : "new identity";
    }
    return "—";
  }

  return (
    <div className="space-y-6">
      {/* Import history */}
      <div>
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <PackageOpen className="h-4 w-4 text-primary" /> Imported packages
        </h2>
        {batches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No packages imported yet. Export a package, have it reviewed, then use “Import package”.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table className="calm-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Reviewer model</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-center">Proposals</TableHead>
                  <TableHead>Provenance</TableHead>
                  <TableHead>Imported</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map(b => (
                  <TableRow key={b.id} data-testid={`row-batch-${b.id}`}>
                    <TableCell className="font-medium">#{b.id}</TableCell>
                    <TableCell className="text-sm">{b.sourceFilename ?? "—"}</TableCell>
                    <TableCell className="text-sm">{b.reviewerModel ?? "—"}</TableCell>
                    <TableCell className="text-center">{b.itemCount}</TableCell>
                    <TableCell className="text-center font-medium">{b.proposalCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-600" /> verified</div>
                      <div className="font-mono truncate max-w-[160px]" title={b.checksum ?? ""}>{b.checksum?.slice(0, 12) ?? "—"}…</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(b.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Proposals */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <h2 className="text-sm font-semibold">Proposals ({decisions.length})</h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9" data-testid="select-proposal-status"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="proposed">Proposed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground mb-3 max-w-3xl">
          Imported proposals awaiting a human decision. Approving records intent only — no alias is applied, no
          canonical vocabulary or entity is changed, and nothing is written to the resolver (those are later phases).
        </p>
        <div className="rounded-md border overflow-x-auto">
          <Table className="calm-table">
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Reviewer model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : decisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No proposals. Import a reviewed Knowledge Review Package to create proposals.
                  </TableCell>
                </TableRow>
              ) : (
                decisions.map(d => (
                  <TableRow key={d.id} data-testid={`row-proposal-${d.id}`}>
                    <TableCell>
                      <div className="font-mono text-sm font-medium">{d.term?.label ?? d.term?.dedupeKey ?? `term ${d.termId}`}</div>
                      {d.rationale && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 max-w-[260px]">{d.rationale}</div>}
                    </TableCell>
                    <TableCell className="capitalize">{d.domain ?? d.term?.domain ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={DECISION_VARIANT[d.decisionType] ?? "outline"}>{d.decisionType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{decisionDetail(d)}</TableCell>
                    <TableCell className="capitalize text-sm">{d.confidence ?? "—"}</TableCell>
                    <TableCell className="text-sm">{d.reviewerModel ?? "—"}</TableCell>
                    <TableCell><Badge variant={DECISION_STATUS_VARIANT[d.status] ?? "outline"}>{d.status}</Badge></TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {d.status === "proposed" ? (
                        <div className="inline-flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-8" disabled={gateMutation.isPending}
                            onClick={() => gateMutation.mutate({ id: d.id, action: "approve" })} data-testid={`button-approve-${d.id}`}>
                            <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" disabled={gateMutation.isPending}
                            onClick={() => gateMutation.mutate({ id: d.id, action: "reject" })} data-testid={`button-reject-${d.id}`}>
                            <ThumbsDown className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ── KQ1E — Phase 3: Consensus & Comparison workspace ────────────────────────
// Groups every reviewer/model's proposal BY review item so a human can compare
// all the evidence before approving. Shows the four backlog counts, highlights
// conflicts, and displays computed consensus (AGREEMENT ONLY — never truth). The
// human approve/reject gate is the only thing that resolves a term, and even
// approval applies nothing to canonical space in this phase.
function ConsensusPanel() {
  const { toast } = useToast();
  const [stateFilter, setStateFilter] = useState<ConsensusState | "all">("all");

  const { data, isPending } = useQuery<ConsensusResponse>({
    queryKey: ["/api/admin/knowledge-review/consensus"],
    queryFn: () => apiRequest("GET", "/api/admin/knowledge-review/consensus").then(r => r.json()),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/consensus"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/decisions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/batches"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/queue"] });
  };
  const gateMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      apiRequest("POST", `/api/admin/knowledge-review/decisions/${id}/${action}`).then(r => r.json()),
    onSuccess: (_r, vars) => { invalidate(); toast({ description: `Proposal ${vars.action === "approve" ? "approved" : "rejected"}.` }); },
    onError: (e: any) => toast({ variant: "destructive", description: e?.message || "Action failed." }),
  });

  const counts = data?.counts;
  const groups = data?.groups ?? [];

  const tiles = [
    { key: "awaiting_review" as const, label: "Awaiting Review", value: counts?.awaitingReview ?? 0, icon: Inbox, tone: "text-muted-foreground" },
    { key: "awaiting_consensus" as const, label: "Awaiting Consensus", value: counts?.awaitingConsensus ?? 0, icon: Users, tone: "text-amber-600" },
    { key: "conflict" as const, label: "Conflicting Reviews", value: counts?.conflicting ?? 0, icon: AlertTriangle, tone: "text-red-600" },
    { key: "consensus" as const, label: "Awaiting Approval", value: counts?.awaitingApproval ?? 0, icon: Scale, tone: "text-green-600" },
  ];

  const visible = groups.filter(g => stateFilter === "all" ? g.state !== "inactive" : g.state === stateFilter);

  function summary(g: ConsensusGroup): string {
    const maj = g.agreement.majoritySignature ? signatureLabel(g.agreement.majoritySignature) : "—";
    switch (g.state) {
      case "conflict":
        return `Conflict — ${g.options.length} distinct decisions across ${g.agreement.reviewerCount} reviewer${g.agreement.reviewerCount === 1 ? "" : "s"}. Plurality: ${g.agreement.majorityCount}/${g.activeCount} favour "${maj}". A human must resolve.`;
      case "consensus":
        return `Consensus — ${g.activeCount} proposals from ${g.agreement.reviewerCount} reviewer${g.agreement.reviewerCount === 1 ? "" : "s"} agree on "${maj}". Agreement measures reviewers, not truth — approve to record the human decision.`;
      case "awaiting_consensus":
        return `Single opinion — one proposal ("${maj}") awaiting corroboration from another reviewer. Import another reviewer's package, or approve on the human gate alone.`;
      case "approved":
        return `Resolved — a human approved a proposal for this term. Nothing was applied to canonical space (apply is a later phase).`;
      default:
        return `No active proposals — awaiting review.`;
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard tiles — click to filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="consensus-dashboard">
        {tiles.map(t => {
          const Icon = t.icon;
          const active = stateFilter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setStateFilter(active ? "all" : t.key)}
              className={`text-left rounded-lg border p-4 transition-colors hover:bg-muted/50 ${active ? "ring-2 ring-primary bg-muted/40" : ""}`}
              data-testid={`tile-${t.key}`}
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className={`h-4 w-4 ${t.tone}`} /> {t.label}
              </div>
              <div className="text-3xl font-semibold mt-2" data-testid={`tile-value-${t.key}`}>{t.value}</div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground max-w-3xl">
        Consensus measures <strong>agreement between reviewers, not truth</strong>. Conflicting proposals are flagged for a human to
        resolve. Approving a proposal records the human decision and supersedes competing proposals for that term — it applies no
        alias, changes no canonical vocabulary or entity, and writes nothing to the resolver (those are later phases).
        {counts && <> {" "}Terms: {counts.totalTerms} · Proposals: {counts.totalProposals} · Approved: {counts.approved}.</>}
      </p>

      {stateFilter !== "all" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtered by</span>
          <Badge variant={STATE_VARIANT[stateFilter]}>{STATE_LABEL[stateFilter]}</Badge>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => setStateFilter("all")} data-testid="button-clear-state-filter">Clear</Button>
        </div>
      )}

      {/* Comparison groups */}
      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-muted-foreground" data-testid="consensus-empty">
          {groups.length === 0
            ? "No proposals to compare yet. Import reviewed Knowledge Review Packages to build consensus."
            : "No review items match this filter."}
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(g => (
            <div
              key={g.term.id}
              className={`rounded-lg border p-4 ${g.state === "conflict" ? "border-red-400/70 bg-red-50/40 dark:border-red-500/40 dark:bg-red-950/10" : ""}`}
              data-testid={`consensus-group-${g.term.id}`}
            >
              {/* Group header */}
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    {g.state === "conflict" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {g.state === "consensus" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    <span className="font-mono text-sm font-semibold">{g.term.label}</span>
                    <Badge variant="outline" className="capitalize">{g.term.domain}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {g.activeCount} active · {g.totalProposals} total proposal{g.totalProposals === 1 ? "" : "s"}
                  </div>
                </div>
                <Badge variant={STATE_VARIANT[g.state]} data-testid={`consensus-state-${g.term.id}`}>{STATE_LABEL[g.state]}</Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-3 max-w-3xl">{summary(g)}</p>

              {/* Vote spread */}
              {g.options.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                  {g.options.map((o, i) => (
                    <Badge
                      key={o.signature}
                      variant={g.state === "conflict" ? (i === 0 ? "default" : "destructive") : "secondary"}
                      className="font-mono"
                      data-testid={`option-${g.term.id}-${i}`}
                    >
                      {signatureLabel(o.signature)} · {o.count}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Proposals comparison table */}
              <div className="rounded-md border overflow-x-auto bg-background">
                <Table className="calm-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Decision</TableHead>
                      <TableHead>Canonical target</TableHead>
                      <TableHead>Rationale</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.proposals.map(p => {
                      const dim = p.status === "rejected" || p.status === "superseded";
                      return (
                        <TableRow key={p.id} className={dim ? "opacity-60" : undefined} data-testid={`consensus-proposal-${p.id}`}>
                          <TableCell className="text-sm">{p.reviewer ?? "—"}</TableCell>
                          <TableCell className="text-sm">{p.reviewerModel ?? "—"}</TableCell>
                          <TableCell className="capitalize text-sm">{p.confidence ?? "—"}</TableCell>
                          <TableCell><Badge variant={DECISION_VARIANT[p.decisionType] ?? "outline"}>{p.decisionType}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">{proposalDetail(p)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[280px]">
                            <span className="line-clamp-3">{p.rationale ?? "—"}</span>
                          </TableCell>
                          <TableCell><Badge variant={DECISION_STATUS_VARIANT[p.status] ?? "outline"}>{p.status}</Badge></TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {p.status === "proposed" ? (
                              <div className="inline-flex items-center gap-1">
                                <Button size="sm" variant="outline" className="h-8" disabled={gateMutation.isPending}
                                  onClick={() => gateMutation.mutate({ id: p.id, action: "approve" })} data-testid={`button-consensus-approve-${p.id}`}>
                                  <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8" disabled={gateMutation.isPending}
                                  onClick={() => gateMutation.mutate({ id: p.id, action: "reject" })} data-testid={`button-consensus-reject-${p.id}`}>
                                  <ThumbsDown className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── KQ1F — Phase 4: Publish, Release Notes & Knowledge Health ────────────────
interface Release {
  id: number;
  publishedAt: string;
  approvedByUserId: number | null;
  approvedByUsername: string | null;
  publishedByUserId: number | null;
  publishedByUsername: string | null;
  rolledBackByUsername: string | null;
  aliasesPublished: number;
  newEntities: number;
  updatedEntities: number;
  rejectedProposals: number;
  deferredProposals: number;
  linkedBatchIds: number[];
  linkedProposalIds: number[];
  rollbackId: number | null;
  notes: string | null;
  status: string;
  rolledBackAt: string | null;
}
interface ReleaseAlias { id: number; kind: string; aliasNormalised: string; canonicalSlug: string; isActive: boolean }
interface ReleaseAudit { id: number; entity: string; entityId: number | null; action: string; actorKind: string; detail: string | null; createdAt: string }
interface ReleaseDetail extends Release { aliases: ReleaseAlias[]; proposals: Decision[]; audit: ReleaseAudit[] }
interface PublishResult {
  releaseId: number; rollbackId: number; aliasesPublished: number; newEntities: number;
  updatedEntities: number; rejectedProposals: number; deferredProposals: number;
  linkedProposalIds: number[]; warnings: string[];
}
interface KnowledgeHealth {
  canonical: { foods: number; nutrients: number; benefits: number; relationships: number };
  coverage: { vocabularyCoveragePct: number; aliasCoveragePct: number; consensusRatePct: number | null };
  backlog: { outstandingReviews: number; awaitingConsensus: number; awaitingApproval: number; unknownTerms: number; deferredReviews: number; rejectedReviews: number };
  timing: { averageReviewTimeHours: number | null; averageTimeToPublishHours: number | null };
  release: { lastReleaseId: number | null; lastReleaseAt: string | null; lastPublishedBy: string | null; totalReleases: number; publishedAliases: number };
  trend: "improving" | "stable" | "declining";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}
function fmtHours(h: number | null): string {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

// Publish approved proposals → automatic Knowledge Release. This is the only
// surface that changes canonical knowledge, and it does so only via the governed
// alias overlay behind the human gate (approved proposals only).
function ReleasesPanel({ onPublished }: { onPublished: () => void }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data: releases, isPending } = useQuery<Release[]>({
    queryKey: ["/api/admin/knowledge-review/releases"],
    queryFn: () => apiRequest("GET", "/api/admin/knowledge-review/releases").then(r => r.json()),
  });
  // How many approved proposals are waiting to be published.
  const { data: approved } = useQuery<Decision[]>({
    queryKey: ["/api/admin/knowledge-review/decisions", "approved"],
    queryFn: () => apiRequest("GET", "/api/admin/knowledge-review/decisions?status=approved").then(r => r.json()),
  });
  const approvedCount = approved?.length ?? 0;

  const invalidateAll = () => {
    for (const k of ["releases", "decisions", "consensus", "queue", "health", "batches"]) {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/knowledge-review/${k}`] });
    }
  };
  const publishMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/knowledge-review/publish", { notes: notes.trim() || undefined }).then(r => r.json()),
    onSuccess: (res: PublishResult) => {
      invalidateAll(); setNotes("");
      toast({ description: `Published release #${res.releaseId}: ${res.aliasesPublished} alias(es), ${res.newEntities} hand-off(s), ${res.rejectedProposals} rejected, ${res.deferredProposals} deferred.` });
      onPublished();
    },
    onError: (e: any) => toast({ variant: "destructive", description: e?.message || "Publish failed." }),
  });
  const rollbackMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/knowledge-review/releases/${id}/rollback`).then(r => r.json()),
    onSuccess: (res: any) => { invalidateAll(); toast({ description: `Release rolled back — ${res.aliasesDeactivated} alias(es) deactivated, ${res.decisionsReverted} proposal(s) reverted.` }); },
    onError: (e: any) => toast({ variant: "destructive", description: e?.message || "Rollback failed." }),
  });

  return (
    <div className="space-y-6">
      {/* Publish control */}
      <div className="rounded-lg border p-4 bg-muted/20">
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Publish approved proposals</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 max-w-3xl">
          Publishing is the <strong>only</strong> operation that changes canonical knowledge. It applies each approved
          <em> alias</em> to the governed overlay the single GOV2 resolver reads, emits a hand-off artifact for each
          <em> new-identity</em> (never auto-minting an entity), records a Knowledge Release, and creates a rollback point.
          Only approved proposals are eligible.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[240px]">
            <Label className="text-xs">Release notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="What this release covers…" data-testid="input-release-notes" />
          </div>
          <Button
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending || approvedCount === 0}
            data-testid="button-publish"
          >
            <Rocket className="h-4 w-4 mr-1.5" />
            Publish {approvedCount > 0 ? `${approvedCount} approved` : "(none approved)"}
          </Button>
        </div>
      </div>

      {/* Release history */}
      {isPending ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (releases?.length ?? 0) === 0 ? (
        <div className="rounded-md border py-12 text-center text-muted-foreground" data-testid="releases-empty">
          No Knowledge Releases yet. Approve proposals on the Consensus tab, then publish them here.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table className="calm-table">
            <TableHeader>
              <TableRow>
                <TableHead>Release</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Approved by</TableHead>
                <TableHead>Published by</TableHead>
                <TableHead className="text-center">Aliases</TableHead>
                <TableHead className="text-center">New</TableHead>
                <TableHead className="text-center">Updated</TableHead>
                <TableHead className="text-center">Rej.</TableHead>
                <TableHead className="text-center">Def.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases!.map(r => (
                <Fragment key={r.id}>
                  <TableRow data-testid={`release-${r.id}`}>
                    <TableCell className="font-mono text-sm">#{r.id}</TableCell>
                    <TableCell className="text-xs">{fmtDate(r.publishedAt)}</TableCell>
                    <TableCell className="text-sm">{r.approvedByUsername ?? "—"}</TableCell>
                    <TableCell className="text-sm">{r.publishedByUsername ?? "—"}</TableCell>
                    <TableCell className="text-center">{r.aliasesPublished}</TableCell>
                    <TableCell className="text-center">{r.newEntities}</TableCell>
                    <TableCell className="text-center">{r.updatedEntities}</TableCell>
                    <TableCell className="text-center">{r.rejectedProposals}</TableCell>
                    <TableCell className="text-center">{r.deferredProposals}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "rolled_back" ? "secondary" : "default"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setOpenId(openId === r.id ? null : r.id)} data-testid={`button-release-detail-${r.id}`}>
                        {openId === r.id ? "Hide" : "Details"}
                      </Button>
                      {r.status === "published" && (
                        <Button size="sm" variant="outline" className="h-8 ml-1" disabled={rollbackMutation.isPending}
                          onClick={() => rollbackMutation.mutate(r.id)} data-testid={`button-rollback-${r.id}`}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Roll back
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {openId === r.id && (
                    <TableRow>
                      <TableCell colSpan={11} className="bg-muted/30">
                        <ReleaseDetailView id={r.id} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ReleaseDetailView({ id }: { id: number }) {
  const { data, isPending } = useQuery<ReleaseDetail>({
    queryKey: [`/api/admin/knowledge-review/releases/${id}`],
    queryFn: () => apiRequest("GET", `/api/admin/knowledge-review/releases/${id}`).then(r => r.json()),
  });
  if (isPending) return <Skeleton className="h-24 w-full" />;
  if (!data) return <span className="text-xs text-muted-foreground">Failed to load release.</span>;
  return (
    <div className="py-3 space-y-3 text-sm">
      {data.notes && <p className="text-muted-foreground"><strong>Notes:</strong> {data.notes}</p>}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span><Link2 className="inline h-3 w-3 mr-1" />Packages: {data.linkedBatchIds.join(", ") || "—"}</span>
        <span>Proposals: {data.linkedProposalIds.join(", ") || "—"}</span>
        <span>Rollback point: {data.rollbackId ?? "—"}</span>
        {data.rolledBackAt && <span className="text-amber-600">Rolled back {fmtDate(data.rolledBackAt)} by {data.rolledBackByUsername ?? "—"}</span>}
      </div>
      {data.aliases.length > 0 && (
        <div>
          <div className="font-medium text-xs mb-1">Published aliases</div>
          <div className="flex flex-wrap gap-1.5">
            {data.aliases.map(a => (
              <Badge key={a.id} variant={a.isActive ? "default" : "secondary"} className="font-mono text-xs" data-testid={`release-alias-${a.id}`}>
                {a.kind}:{a.aliasNormalised} → {a.canonicalSlug}{a.isActive ? "" : " (inactive)"}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {data.audit.length > 0 && (
        <div>
          <div className="font-medium text-xs mb-1 flex items-center gap-1"><FileClock className="h-3 w-3" /> Audit trail</div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {data.audit.map(a => (
              <li key={a.id}><span className="font-mono">{a.entity}#{a.entityId ?? "—"}</span> · {a.action} · {a.actorKind} · {fmtDate(a.createdAt)}{a.detail ? ` · ${a.detail}` : ""}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HealthPanel() {
  const { data, isPending } = useQuery<KnowledgeHealth>({
    queryKey: ["/api/admin/knowledge-review/health"],
    queryFn: () => apiRequest("GET", "/api/admin/knowledge-review/health").then(r => r.json()),
  });
  if (isPending) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!data) return <div className="text-muted-foreground">Failed to load Knowledge Health.</div>;

  const trendIcon = data.trend === "improving" ? TrendingUp : data.trend === "declining" ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendTone = data.trend === "improving" ? "text-green-600" : data.trend === "declining" ? "text-red-600" : "text-muted-foreground";

  const tile = (label: string, value: string | number, testid: string, tone = "") => (
    <div className="rounded-lg border p-4" data-testid={testid}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tone}`}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="health-dashboard">
      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Database className="h-4 w-4" /> Canonical Knowledge</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tile("Canonical Foods", data.canonical.foods, "health-foods")}
          {tile("Canonical Nutrients", data.canonical.nutrients, "health-nutrients")}
          {tile("Canonical Benefits", data.canonical.benefits, "health-benefits")}
          {tile("Canonical Relationships", data.canonical.relationships, "health-relationships")}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Scale className="h-4 w-4" /> Coverage & Consensus</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {tile("Vocabulary Coverage", `${data.coverage.vocabularyCoveragePct}%`, "health-vocab-coverage")}
          {tile("Alias Coverage", `${data.coverage.aliasCoveragePct}%`, "health-alias-coverage")}
          {tile("Consensus Rate", data.coverage.consensusRatePct == null ? "—" : `${data.coverage.consensusRatePct}%`, "health-consensus-rate")}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Inbox className="h-4 w-4" /> Review Backlog</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {tile("Outstanding Reviews", data.backlog.outstandingReviews, "health-outstanding")}
          {tile("Awaiting Consensus", data.backlog.awaitingConsensus, "health-awaiting-consensus")}
          {tile("Awaiting Approval", data.backlog.awaitingApproval, "health-awaiting-approval")}
          {tile("Unknown Terms", data.backlog.unknownTerms, "health-unknown")}
          {tile("Deferred Reviews", data.backlog.deferredReviews, "health-deferred")}
          {tile("Rejected Reviews", data.backlog.rejectedReviews, "health-rejected")}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><FileClock className="h-4 w-4" /> Timing & Releases</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tile("Avg Review Time", fmtHours(data.timing.averageReviewTimeHours), "health-avg-review")}
          {tile("Avg Time to Publish", fmtHours(data.timing.averageTimeToPublishHours), "health-avg-publish")}
          {tile("Total Releases", data.release.totalReleases, "health-total-releases")}
          {tile("Published Aliases", data.release.publishedAliases, "health-published-aliases")}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {tile("Last Knowledge Release", data.release.lastReleaseId ? `#${data.release.lastReleaseId}` : "—", "health-last-release")}
          {tile("Last Release Date", fmtDate(data.release.lastReleaseAt), "health-last-release-date")}
          {tile("Last Published By", data.release.lastPublishedBy ?? "—", "health-last-published-by")}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-2">Knowledge Trend</h3>
        <div className={`inline-flex items-center gap-2 rounded-lg border px-4 py-3 ${trendTone}`} data-testid="health-trend">
          <TrendIcon className="h-6 w-6" />
          <span className="text-lg font-semibold capitalize">{data.trend}</span>
          <span className="text-xs text-muted-foreground ml-2">7-day: terms resolved vs newly captured</span>
        </div>
      </section>
    </div>
  );
}

export default function AdminKnowledgeReviewPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reviewType, setReviewType] = useState<string>(ALL);
  const [domain, setDomain] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [priority, setPriority] = useState<string>(ALL);
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("lastSeenAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [bulkPriority, setBulkPriority] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkOrigin, setBulkOrigin] = useState<string>("");
  const [tab, setTab] = useState<"queue" | "consensus" | "proposals" | "releases" | "health">("queue");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build the filter param set once — reused for the query key and for export.
  const filterParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (search) p.search = search;
    if (reviewType !== ALL) p.reviewType = reviewType;
    if (domain !== ALL) p.domain = domain;
    if (status !== ALL) p.status = status;
    if (priority !== ALL) p.priority = priority;
    if (hasSuggestion) p.hasSuggestion = "true";
    p.sortBy = sortBy;
    p.sortDir = sortDir;
    return p;
  }, [search, reviewType, domain, status, priority, hasSuggestion, sortBy, sortDir]);

  const qs = new URLSearchParams(filterParams).toString();

  const { data, isPending } = useQuery<QueueResponse>({
    queryKey: ["/api/admin/knowledge-review/queue", qs],
    queryFn: () => apiRequest("GET", `/api/admin/knowledge-review/queue?${qs}`).then(r => r.json()),
  });

  const { data: options } = useQuery<OptionsResponse>({
    queryKey: ["/api/admin/knowledge-review/options"],
    queryFn: () => apiRequest("GET", "/api/admin/knowledge-review/options").then(r => r.json()),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/queue"] });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<Record<string, string | null>> }) =>
      apiRequest("PATCH", `/api/admin/knowledge-review/terms/${id}`, patch).then(r => r.json()),
    onSuccess: () => { invalidate(); setEditingId(null); setDraft(null); toast({ description: "Review item updated." }); },
    onError: (e: any) => toast({ variant: "destructive", description: e?.message || "Update failed." }),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, patch }: { ids: number[]; patch: Partial<Record<string, string | null>> }) =>
      apiRequest("PATCH", "/api/admin/knowledge-review/terms/bulk", { ids, patch }).then(r => r.json()),
    onSuccess: (res: { updated: number }) => {
      invalidate();
      setBulkPriority(""); setBulkStatus(""); setBulkOrigin("");
      toast({ description: `Updated ${res.updated} item${res.updated === 1 ? "" : "s"}.` });
    },
    onError: (e: any) => toast({ variant: "destructive", description: e?.message || "Bulk edit failed." }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // Distinct filter values from the loaded page (Phase 1 queue is small).
  const domains = useMemo(() => Array.from(new Set(items.map(i => i.domain))).sort(), [items]);
  const statuses = useMemo(() => Array.from(new Set(items.map(i => i.status))).sort(), [items]);
  const reviewTypes = useMemo(() => Array.from(new Set(items.map(i => i.reviewType))).sort(), [items]);

  // Editable vocab from the server (fallbacks keep the UI usable pre-load).
  const priorities = options?.priorities ?? ["high", "medium", "low"];
  const editableStatuses = options?.statuses ?? ["unresolved", "in_review", "deferred", "rejected"];
  const origins = options?.origins ?? [];

  function canonicalOptionsFor(dom: string): CanonicalOption[] {
    if (!options) return [];
    if (dom === "nutrient") return options.canonical.nutrient;
    if (dom === "benefit") return options.canonical.benefit;
    return [];
  }

  const allSelected = items.length > 0 && items.every(i => selected.has(i.id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map(i => i.id)));
  }
  function toggleOne(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function handleSort(col: SortBy) {
    if (sortBy === col) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  }
  function handleSearch() { setSearch(searchInput.trim()); }

  function startEdit(item: ReviewItem) {
    setEditingId(item.id);
    setDraft(draftFrom(item));
  }
  function saveEdit(item: ReviewItem) {
    if (!draft) return;
    // Send only fields that changed from the original.
    const patch: Record<string, string | null> = {};
    const orig = draftFrom(item);
    if (draft.priority !== orig.priority) patch.priority = draft.priority === "" ? null : draft.priority;
    if (draft.status !== orig.status) patch.status = draft.status;
    if (draft.knowledgeOrigin !== orig.knowledgeOrigin) patch.knowledgeOrigin = draft.knowledgeOrigin || null;
    if (draft.suggestedCanonicalSlug !== orig.suggestedCanonicalSlug) patch.suggestedCanonicalSlug = draft.suggestedCanonicalSlug || null;
    if (draft.reviewNotes !== orig.reviewNotes) patch.reviewNotes = draft.reviewNotes || null;
    if (Object.keys(patch).length === 0) { setEditingId(null); setDraft(null); return; }
    updateMutation.mutate({ id: item.id, patch });
  }

  function applyBulk() {
    const patch: Record<string, string | null> = {};
    if (bulkPriority) patch.priority = bulkPriority === NONE ? null : bulkPriority;
    if (bulkStatus) patch.status = bulkStatus;
    if (bulkOrigin.trim()) patch.knowledgeOrigin = bulkOrigin.trim();
    if (Object.keys(patch).length === 0) {
      toast({ variant: "destructive", description: "Choose at least one field to apply." });
      return;
    }
    bulkMutation.mutate({ ids: Array.from(selected), patch });
  }

  async function runExport(scope: "selected" | "filtered" | "all", format: "json" | "csv") {
    try {
      const body: Record<string, unknown> = { scope, format };
      if (scope === "selected") body.ids = Array.from(selected);
      if (scope === "filtered") body.filters = filterParams;
      const res = await apiRequest("POST", "/api/admin/knowledge-review/export", body);
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const name = cd.match(/filename="(.+?)"/)?.[1] || `knowledge-review-${scope}.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast({ description: `Exported ${scope} items as ${format.toUpperCase()}.` });
    } catch (e: any) {
      toast({ variant: "destructive", description: e?.message || "Export failed." });
    }
  }

  const importMutation = useMutation({
    mutationFn: (payload: { filename: string; package: unknown }) =>
      apiRequest("POST", "/api/admin/knowledge-review/import", payload).then(r => r.json()),
    onSuccess: (res: ImportResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/decisions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/batches"] });
      const skipped = res.skippedExisting + res.skippedMissingTerm + res.skippedInvalid;
      toast({ description: `Imported package: ${res.created} proposal${res.created === 1 ? "" : "s"} created${skipped ? `, ${skipped} skipped` : ""}.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-review/consensus"] });
      setTab("consensus");
    },
    onError: (e: any) => toast({ variant: "destructive", description: e?.message || "Import failed." }),
  });

  async function handleImportFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const pkg = JSON.parse(text);
      importMutation.mutate({ filename: file.name, package: pkg });
    } catch {
      toast({ variant: "destructive", description: "Could not read that file as JSON. Import a Knowledge Review Package (.json)." });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if ((user as any)?.role !== "admin") {
    setLocation("/");
    return null;
  }

  const COL_COUNT = 10;

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4" data-testid="admin-knowledge-review-page">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft className="h-4 w-4" /> Admin
      </Link>

      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="heading-knowledge-review">
            Knowledge Review
          </h1>
        </div>
        <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={e => handleImportFile(e.target.files?.[0] ?? null)}
          data-testid="input-import-file"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={importMutation.isPending}
          data-testid="button-import-package"
        >
          <Upload className="h-4 w-4 mr-2" /> Import package
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" data-testid="button-export-menu">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Selected ({selected.size})</DropdownMenuLabel>
            <DropdownMenuItem disabled={selected.size === 0} onSelect={() => runExport("selected", "json")} data-testid="export-selected-json">Selected · JSON</DropdownMenuItem>
            <DropdownMenuItem disabled={selected.size === 0} onSelect={() => runExport("selected", "csv")} data-testid="export-selected-csv">Selected · CSV</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filtered ({total})</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => runExport("filtered", "json")} data-testid="export-filtered-json">Filtered · JSON</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => runExport("filtered", "csv")} data-testid="export-filtered-csv">Filtered · CSV</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Entire queue</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => runExport("all", "json")} data-testid="export-all-json">Entire queue · JSON</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => runExport("all", "csv")} data-testid="export-all-csv">Entire queue · CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6 max-w-3xl">
        Triage workspace for unresolved knowledge items: edit priority, origin, suggested canonical match,
        notes and status, then export a package for external LLM review. Suggestions are proposals only —
        no imports, approvals, or canonical changes happen here. Canonical vocabularies remain owned by the
        Knowledge Platform.
      </p>

      <Tabs value={tab} onValueChange={v => setTab(v as "queue" | "consensus" | "proposals" | "releases" | "health")}>
        <TabsList className="mb-4">
          <TabsTrigger value="queue" data-testid="tab-queue">Queue</TabsTrigger>
          <TabsTrigger value="consensus" data-testid="tab-consensus">
            <GitCompare className="h-4 w-4 mr-1.5" /> Consensus
          </TabsTrigger>
          <TabsTrigger value="proposals" data-testid="tab-proposals">Proposals</TabsTrigger>
          <TabsTrigger value="releases" data-testid="tab-releases">
            <Rocket className="h-4 w-4 mr-1.5" /> Releases
          </TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-health">
            <Activity className="h-4 w-4 mr-1.5" /> Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
      {/* Controls: search + filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search term…"
            className="pl-9"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            data-testid="input-search-review"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" data-testid="button-search-review">Search</Button>

        <Select value={reviewType} onValueChange={setReviewType}>
          <SelectTrigger className="w-[140px]" data-testid="select-review-type"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {reviewTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="w-[140px]" data-testid="select-domain"><SelectValue placeholder="Domain" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All domains</SelectItem>
            {domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]" data-testid="select-status"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[140px]" data-testid="select-priority-filter"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All priorities</SelectItem>
            {priorities.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
          </SelectContent>
        </Select>

        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox checked={hasSuggestion} onCheckedChange={v => setHasSuggestion(!!v)} data-testid="checkbox-has-suggestion" />
          Has suggested match
        </label>
      </div>

      {/* Bulk edit bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-end gap-3 mb-4 rounded-md border bg-muted/40 p-3" data-testid="bulk-edit-bar">
          <div className="text-sm font-medium mr-1 self-center" data-testid="text-selected-count">{selected.size} selected</div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <Select value={bulkPriority} onValueChange={setBulkPriority}>
              <SelectTrigger className="w-[130px] h-9" data-testid="select-bulk-priority"><SelectValue placeholder="— keep —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Clear priority</SelectItem>
                {priorities.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-bulk-status"><SelectValue placeholder="— keep —" /></SelectTrigger>
              <SelectContent>
                {editableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Knowledge origin</Label>
            <Input
              className="w-[180px] h-9" placeholder="— keep —"
              list="origin-presets"
              value={bulkOrigin} onChange={e => setBulkOrigin(e.target.value)}
              data-testid="input-bulk-origin"
            />
          </div>
          <Button onClick={applyBulk} disabled={bulkMutation.isPending} data-testid="button-apply-bulk">
            Apply to {selected.size}
          </Button>
          <Button variant="ghost" onClick={() => setSelected(new Set())} data-testid="button-clear-selection">Clear</Button>
        </div>
      )}

      <datalist id="origin-presets">
        {origins.map(o => <option key={o} value={o} />)}
      </datalist>

      <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
        <span data-testid="text-queue-count">{total} item{total === 1 ? "" : "s"} in queue</span>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="calm-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" data-testid="checkbox-select-all" />
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("label")} data-testid="sort-label">
                  Term <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("priority")} data-testid="sort-priority">
                  Priority <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("status")} data-testid="sort-status">
                  Status <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Suggested match</TableHead>
              <TableHead className="text-center">
                <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("occurrenceCount")} data-testid="sort-occurrences">
                  Sightings <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("lastSeenAt")} data-testid="sort-last-seen">
                  Last seen <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COL_COUNT }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-12 text-muted-foreground">
                  The review queue is empty. Unresolved terms captured from the resolver/importer will appear here.
                </TableCell>
              </TableRow>
            ) : (
              items.map(item => {
                const reason = typeof item.details?.reason === "string" ? item.details.reason as string : null;
                const isEditing = editingId === item.id;
                const canon = canonicalOptionsFor(item.domain);
                return (
                  <Fragment key={item.id}>
                    <TableRow data-state={selected.has(item.id) ? "selected" : undefined} data-testid={`row-review-${item.id}`}>
                      <TableCell>
                        <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleOne(item.id)} aria-label={`Select ${item.label}`} data-testid={`checkbox-review-${item.id}`} />
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm font-medium">{item.label}</div>
                        {reason && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{reason}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.reviewType}</Badge></TableCell>
                      <TableCell className="capitalize">{item.domain}</TableCell>
                      <TableCell>
                        {item.priority
                          ? <Badge variant={PRIORITY_VARIANT[item.priority] ?? "outline"} className="capitalize">{item.priority}</Badge>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                      <TableCell className="text-sm">
                        {item.suggestedCanonicalSlug
                          ? <span className="font-mono">{item.suggestedCanonicalSlug}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center font-medium" data-testid={`text-occurrences-${item.id}`}>{item.occurrenceCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(item.lastSeenAt)}</TableCell>
                      <TableCell>
                        {!isEditing && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)} aria-label="Edit" data-testid={`button-edit-${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>

                    {isEditing && draft && (
                      <TableRow data-testid={`row-edit-${item.id}`} className="bg-muted/30">
                        <TableCell colSpan={COL_COUNT}>
                          <div className="grid gap-4 py-2 md:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Priority</Label>
                              <Select value={draft.priority || NONE} onValueChange={v => setDraft(d => d && ({ ...d, priority: v === NONE ? "" : v }))}>
                                <SelectTrigger className="h-9" data-testid={`edit-priority-${item.id}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NONE}>None</SelectItem>
                                  {priorities.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Review status</Label>
                              <Select value={draft.status} onValueChange={v => setDraft(d => d && ({ ...d, status: v }))}>
                                <SelectTrigger className="h-9" data-testid={`edit-status-${item.id}`}><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {editableStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Knowledge origin</Label>
                              <Input
                                className="h-9" list="origin-presets" placeholder="e.g. import-draft"
                                value={draft.knowledgeOrigin}
                                onChange={e => setDraft(d => d && ({ ...d, knowledgeOrigin: e.target.value }))}
                                data-testid={`edit-origin-${item.id}`}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs">Suggested canonical match</Label>
                              <Input
                                className="h-9 font-mono" list={`canon-${item.id}`}
                                placeholder={canon.length ? "type or pick a slug…" : "canonical slug"}
                                value={draft.suggestedCanonicalSlug}
                                onChange={e => setDraft(d => d && ({ ...d, suggestedCanonicalSlug: e.target.value }))}
                                data-testid={`edit-suggested-${item.id}`}
                              />
                              <datalist id={`canon-${item.id}`}>
                                {canon.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                              </datalist>
                            </div>
                            <div className="flex flex-col gap-1 lg:col-span-2">
                              <Label className="text-xs">Review notes</Label>
                              <Textarea
                                rows={2} placeholder="Context for the external reviewer…"
                                value={draft.reviewNotes}
                                onChange={e => setDraft(d => d && ({ ...d, reviewNotes: e.target.value }))}
                                data-testid={`edit-notes-${item.id}`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pb-1">
                            <Button size="sm" onClick={() => saveEdit(item)} disabled={updateMutation.isPending} data-testid={`button-save-${item.id}`}>
                              <Check className="h-4 w-4 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setDraft(null); }} data-testid={`button-cancel-${item.id}`}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
        </TabsContent>

        <TabsContent value="consensus">
          <ConsensusPanel />
        </TabsContent>

        <TabsContent value="proposals">
          <ProposalsPanel />
        </TabsContent>

        <TabsContent value="releases">
          <ReleasesPanel onPublished={() => setTab("releases")} />
        </TabsContent>

        <TabsContent value="health">
          <HealthPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
