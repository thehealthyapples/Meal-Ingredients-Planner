import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertCircle, Sparkles, TrendingUp, HelpCircle, MessageCircleQuestion, Wrench, BookOpen,
  ServerCrash, Layers, ThumbsUp, ThumbsDown, Route, LogOut, Target, Redo2, Wand2, XOctagon,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ---------------------------------------------------------------------------
// Palette — reuses the app's established green chart palette (dashboard.tsx)
// ---------------------------------------------------------------------------

const GREEN_DEEP = "hsl(132, 25%, 30%)";
const GREEN_MID = "hsl(132, 18%, 46%)";
const BASKET_FG = "hsl(218, 28%, 42%)";
const BERRY = "hsl(340, 28%, 48%)";

// ---------------------------------------------------------------------------
// API shapes (mirrors server/intelligence/conversation/*.ts contracts)
// ---------------------------------------------------------------------------

interface UnmatchedGroup { utterance: string; count: number; surfaces: string[]; }
interface RoutingFailureGroup { capability: string; verb: string; statuses: string[]; count: number; }
interface CapabilityGapEntry extends RoutingFailureGroup { reason?: string; }
interface TrendEntry { utterance: string; currentCount: number; previousCount: number; growth: number; }

interface DashboardResponse {
  summary: {
    totalEvents: number;
    windowStart: string | null;
    windowEnd: string | null;
    byStage: Record<string, number>;
    byState: Record<string, number>;
    bySurface: { surface: string; count: number }[];
  };
  classification: {
    resolverGaps: UnmatchedGroup[];
    clarifications: UnmatchedGroup[];
    capabilityGaps: CapabilityGapEntry[];
    knowledgeGaps: RoutingFailureGroup[];
    platformFailures: RoutingFailureGroup[];
    counts: {
      resolverGapCount: number;
      clarificationCount: number;
      capabilityGapCount: number;
      knowledgeGapCount: number;
      platformFailureCount: number;
    };
  };
  rates: {
    totalTurns: number;
    totalUnsuccessfulTurns: number;
    understandingRate: number | null;
    successfulConversationRate: number | null;
    clarificationRate: number | null;
  };
  trend: { available: boolean; note: string; fastestGrowingGaps: TrendEntry[] };
  recommendationCounts: { pending: number; approved: number; rejected: number; completed: number };
  history: { id: number; createdAt: string; totalEvents: number; totalTurns: number; gapCounts: Record<string, number> }[];
  // INT38 — Companion Guidance & Feedback
  feedback: {
    helpfulness: { rate: number | null; totalUp: number; totalDown: number };
    trend: { date: string; up: number; down: number }[];
    topNegativeReasons: { reasonCode: string; count: number }[];
  };
  guidance: {
    taskCompletion: { rate: number | null; totalShown: number; totalClicked: number };
    successfulJourneys: PairAggregate[];
    poorFeedbackRecommendations: PoorFeedbackRecommendation[];
    abandonmentOpportunities: PairAggregate[];
  };
  // INT39 — Capability Guidance Registry & Goal Completion
  goalCompletion: {
    funnel: {
      intentRecognised: number;
      capabilityExecuted: number;
      guidancePresented: number;
      guidanceFollowed: number;
      goalCompleted: number;
      completionRate: number | null;
      abandonmentRate: number | null;
    };
    recoveryAfterFailure: {
      rate: number | null;
      totalFailed: number;
      totalRecovered: number;
      totalWithoutFollowUp: number;
    };
    highestConvertingActions: ActionConversion[];
    ignoredActions: ActionConversion[];
  };
  // INT40 — Companion Task Delegation & Assisted Actions
  delegation: {
    completionRate: { rate: number | null; totalSucceeded: number; totalTerminal: number };
    mostDelegatedActions: DelegatedActionCount[];
    successRate: { rate: number | null; numerator: number; denominator: number };
    cancellationRate: { rate: number | null; numerator: number; denominator: number };
    partialCompletionRate: { rate: number | null; numerator: number; denominator: number };
    averageWorkflowDuration: { averageSeconds: number | null; sampleSize: number };
    mostAbandonedWorkflows: WorkflowSignatureResult[];
    mostSuccessfulWorkflows: WorkflowSignatureResult[];
  };
}

interface DelegatedActionCount { capabilityId: string; verb: string; count: number; }
interface WorkflowSignatureResult { signature: string; stepCount: number; count: number; reliable: boolean; }

interface ActionConversion {
  sourceCapabilityId: string;
  targetCapabilityId: string;
  verb: string;
  shown: number;
  clicked: number;
  clickThroughRate: number | null;
  reliable: boolean;
}

interface PairAggregate {
  sourceDomain: string;
  domain: string;
  shown: number;
  clicked: number;
  clickThroughRate: number | null;
  reliable: boolean;
}

interface PoorFeedbackRecommendation {
  sourceDomain: string;
  domain: string;
  shownCount: number;
  downCount: number;
  downRate: number;
  reliable: boolean;
}

const FEEDBACK_REASON_LABELS: Record<string, string> = {
  not_relevant: "Didn't answer my question",
  inaccurate: "Information seemed wrong",
  already_knew: "I already knew this",
  too_generic: "Too generic",
  other: "Other",
};

interface Recommendation {
  id: number;
  snapshotId: number;
  kind: "matcher" | "capability" | "regression-test";
  status: "pending" | "approved" | "rejected" | "completed";
  payload: Record<string, unknown>;
  rationale: string;
  confidence: "low" | "medium" | "high";
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtRate(rate: number | null): string {
  if (rate == null) return "No data yet";
  return `${Math.round(rate * 100)}%`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

function fmtDuration(seconds: number | null): string {
  if (seconds == null) return "No data yet";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)}m`;
}

const KIND_LABELS: Record<Recommendation["kind"], string> = {
  matcher: "Matcher improvement",
  capability: "Capability recommendation",
  "regression-test": "Regression test",
};

const STATUS_VARIANT: Record<Recommendation["status"], "outline" | "secondary" | "default"> = {
  pending: "outline",
  approved: "secondary",
  rejected: "outline",
  completed: "default",
};

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------

function StatTile({ label, value, hint, testId }: { label: string; value: string; hint?: string; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Gap table — shared shape for resolver / capability / knowledge / failure lists
// ---------------------------------------------------------------------------

function GapTable<T>({
  rows, columns, emptyText, onRowClick, testId,
}: {
  rows: T[];
  columns: { header: string; render: (row: T) => React.ReactNode }[];
  emptyText: string;
  onRowClick?: (row: T) => void;
  testId: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-4" data-testid={`${testId}-empty`}>{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table data-testid={testId}>
        <TableHeader>
          <TableRow>
            {columns.map((c) => <TableHead key={c.header} className="text-xs">{c.header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 15).map((row, i) => (
            <TableRow
              key={i}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
              onClick={() => onRowClick?.(row)}
              data-testid={`${testId}-row-${i}`}
            >
              {columns.map((c) => <TableCell key={c.header} className="text-sm">{c.render(row)}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Improvement history chart
// ---------------------------------------------------------------------------

function ImprovementHistoryChart({ history }: { history: DashboardResponse["history"] }) {
  if (history.length < 2) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center" data-testid="text-history-insufficient">
        Not enough history yet — generate at least two snapshots to see a trend line.
      </p>
    );
  }
  const data = history
    .slice()
    .reverse()
    .map((h) => {
      const resolverGaps = h.gapCounts?.resolverGapCount ?? 0;
      const understandingRate = h.totalTurns > 0 ? Math.round(((h.totalTurns - resolverGaps) / h.totalTurns) * 1000) / 10 : null;
      return {
        date: new Date(h.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        understandingRate,
      };
    });
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(132, 14%, 90%)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(132, 10%, 55%)" />
        <YAxis
          tick={{ fontSize: 11 }}
          stroke="hsl(132, 10%, 55%)"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          width={40}
        />
        <Tooltip
          formatter={(v: number) => [`${v}%`, "Understanding rate"]}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Line
          type="monotone"
          dataKey="understandingRate"
          name="Understanding rate"
          stroke={GREEN_MID}
          strokeWidth={2}
          dot={{ r: 3, fill: GREEN_DEEP }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Feedback trend chart (INT38)
// ---------------------------------------------------------------------------

function FeedbackTrendChart({ trend }: { trend: DashboardResponse["feedback"]["trend"] }) {
  if (trend.length < 2) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center" data-testid="text-feedback-trend-insufficient">
        Not enough feedback history yet — trends appear once feedback has been given on at least two different days.
      </p>
    );
  }
  const data = trend.map((b) => ({
    date: new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    up: b.up,
    down: b.down,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(132, 14%, 90%)" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(132, 10%, 55%)" />
        <YAxis tick={{ fontSize: 11 }} stroke="hsl(132, 10%, 55%)" width={30} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="up" name="👍 Helpful" stroke={GREEN_MID} strokeWidth={2} dot={{ r: 3, fill: GREEN_DEEP }} />
        <Line type="monotone" dataKey="down" name="👎 Not helpful" stroke={BERRY} strokeWidth={2} dot={{ r: 3, fill: BERRY }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Recommendation queue
// ---------------------------------------------------------------------------

function RecommendationQueue() {
  const { toast } = useToast();
  const [status, setStatus] = useState<Recommendation["status"]>("pending");

  const { data, isPending } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ["/api/intelligence/learning/recommendations", status],
    queryFn: () => apiRequest("GET", `/api/intelligence/learning/recommendations?status=${status}`).then(r => r.json()),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, next }: { id: number; next: "approved" | "rejected" | "completed" }) => {
      const res = await apiRequest("POST", `/api/intelligence/learning/recommendations/${id}/review`, { status: next });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence/learning/recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence/learning/dashboard"] });
      toast({ title: "Recommendation updated" });
    },
    onError: () => {
      toast({ title: "Update failed", variant: "destructive" });
    },
  });

  return (
    <Card data-testid="card-recommendation-queue">
      <CardHeader className="pb-2">
        <CardTitle>Learning Recommendation Queue</CardTitle>
        <CardDescription className="text-xs">
          Advisory only — approving a recommendation never changes production routing.
          Acting on it remains a separate, human, code-reviewed implementation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={status} onValueChange={(v) => setStatus(v as Recommendation["status"])}>
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value={status} className="mt-3 space-y-3">
            {isPending ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : !data || data.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No {status} recommendations.</p>
            ) : (
              data.recommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-3" data-testid={`row-recommendation-${rec.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{KIND_LABELS[rec.kind]}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{rec.confidence} confidence</Badge>
                      </div>
                      <p className="text-sm mt-1.5">{rec.rationale}</p>
                      <p className="text-xs text-muted-foreground mt-1">Generated {fmtDate(rec.createdAt)}</p>
                    </div>
                    {status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: rec.id, next: "approved" })}
                          data-testid={`button-approve-${rec.id}`}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: rec.id, next: "rejected" })}
                          data-testid={`button-reject-${rec.id}`}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: rec.id, next: "completed" })}
                        data-testid={`button-complete-${rec.id}`}
                      >
                        Mark implemented
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminCompanionIntelligencePage() {
  const { toast } = useToast();
  const [drillDown, setDrillDown] = useState<{ title: string; body: React.ReactNode } | null>(null);

  const { data, isPending, isError } = useQuery<DashboardResponse>({
    queryKey: ["/api/intelligence/learning/dashboard"],
  });

  const snapshotMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/intelligence/learning/snapshot", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence/learning/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intelligence/learning/recommendations"] });
      toast({ title: "Snapshot recorded", description: "New recommendations queued for review." });
    },
    onError: () => {
      toast({ title: "Could not generate recommendations", variant: "destructive" });
    },
  });

  if (isPending) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card data-testid="card-dashboard-error">
          <CardContent className="flex items-start gap-3 py-5">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Could not load the Companion Intelligence Dashboard</p>
              <p className="text-xs text-muted-foreground mt-1">
                This usually means your session has expired or you are not recognised as an admin. Try logging out and back in.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mostRequestedCapabilities = Object.values(
    data.classification.capabilityGaps.reduce<Record<string, { capability: string; count: number }>>((acc, g) => {
      acc[g.capability] = acc[g.capability] ?? { capability: g.capability, count: 0 };
      acc[g.capability].count += g.count;
      return acc;
    }, {}),
  ).sort((a, b) => b.count - a.count);

  const impactRanked = [
    ...data.classification.resolverGaps.map(g => ({ label: g.utterance, category: "Resolver gap", count: g.count })),
    ...data.classification.capabilityGaps.map(g => ({ label: `${g.capability}/${g.verb}`, category: "Capability gap", count: g.count })),
    ...data.classification.knowledgeGaps.map(g => ({ label: `${g.capability}/${g.verb}`, category: "Knowledge gap", count: g.count })),
  ].sort((a, b) => b.count - a.count).slice(0, 15);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="heading-companion-intelligence">
            Companion Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Companion health, learning gaps, and advisory recommendations. Every figure here is aggregate and anonymised —
            no user or household identity is ever shown.
          </p>
        </div>
        <Button variant="default"
          onClick={() => snapshotMutation.mutate()}
          disabled={snapshotMutation.isPending}
          data-testid="button-generate-recommendations"
        >
          <Sparkles className="w-4 h-4 mr-1.5" />
          {snapshotMutation.isPending ? "Generating…" : "Generate recommendations"}
        </Button>
      </div>

      {/* Headline rates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          label="Overall understanding rate"
          value={fmtRate(data.rates.understandingRate)}
          hint={`${data.rates.totalTurns} turns observed`}
          testId="stat-understanding-rate"
        />
        <StatTile
          label="Successful conversation rate"
          value={fmtRate(data.rates.successfulConversationRate)}
          hint={`${data.rates.totalUnsuccessfulTurns} unsuccessful`}
          testId="stat-success-rate"
        />
        <StatTile
          label="Clarification request rate"
          value={fmtRate(data.rates.clarificationRate)}
          hint={`${data.classification.counts.clarificationCount} clarifications`}
          testId="stat-clarification-rate"
        />
      </div>

      {/* Fallback state distribution */}
      <Card data-testid="card-fallback-distribution">
        <CardHeader className="pb-2">
          <CardTitle>Fallback State Distribution</CardTitle>
          <CardDescription className="text-xs">How the {data.summary.totalEvents} retained misses break down.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.summary.totalEvents === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No misses recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(data.summary.byState).map(([state, count]) => (
                <div key={state} className="text-center" data-testid={`stat-state-${state}`}>
                  <p className="text-lg font-semibold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{state.replace(/-/g, " ")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvement history */}
      <Card data-testid="card-improvement-history">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Improvement History
          </CardTitle>
          <CardDescription className="text-xs">Understanding rate across recorded snapshots.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImprovementHistoryChart history={data.history} />
        </CardContent>
      </Card>

      {/* INT38 — Response helpfulness + task completion headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatTile
          label="Response helpfulness rate"
          value={fmtRate(data.feedback.helpfulness.rate)}
          hint={`${data.feedback.helpfulness.totalUp} 👍 · ${data.feedback.helpfulness.totalDown} 👎`}
          testId="stat-helpfulness-rate"
        />
        <StatTile
          label="Task completion rate"
          value={fmtRate(data.guidance.taskCompletion.rate)}
          hint={`${data.guidance.taskCompletion.totalClicked} of ${data.guidance.taskCompletion.totalShown} suggestions followed`}
          testId="stat-task-completion-rate"
        />
      </div>

      {/* INT38 — Feedback trend + top negative reasons */}
      <Card data-testid="card-feedback-trend">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="w-4 h-4" /> Response Feedback Trend
          </CardTitle>
          <CardDescription className="text-xs">
            Anonymous 👍/👎 on Companion responses, day by day. Advisory only — never changes what the Companion says.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedbackTrendChart trend={data.feedback.trend} />
        </CardContent>
      </Card>

      <Card data-testid="card-negative-reasons">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ThumbsDown className="w-4 h-4" /> Most Common Reasons For Negative Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-negative-reasons"
            rows={data.feedback.topNegativeReasons}
            emptyText="No negative feedback with a reason recorded yet."
            columns={[
              { header: "Reason", render: (r) => FEEDBACK_REASON_LABELS[r.reasonCode] ?? r.reasonCode },
              { header: "Count", render: (r) => r.count },
            ]}
          />
        </CardContent>
      </Card>

      {/* INT38 — Guidance journeys, poor-feedback recommendations, abandonment */}
      <Card data-testid="card-successful-journeys">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Route className="w-4 h-4" /> Most Successful Companion Journeys
          </CardTitle>
          <CardDescription className="text-xs">
            "Where to next?" suggestions users actually followed, ranked by completions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-successful-journeys"
            rows={data.guidance.successfulJourneys}
            emptyText="No completed guidance journeys recorded yet."
            columns={[
              { header: "From", render: (r) => <span className="capitalize">{r.sourceDomain}</span> },
              { header: "To", render: (r) => <span className="capitalize">{r.domain}</span> },
              { header: "Shown", render: (r) => r.shown },
              { header: "Followed", render: (r) => r.clicked },
              {
                header: "Click-through",
                render: (r) => (
                  <span>
                    {r.clickThroughRate != null ? `${Math.round(r.clickThroughRate * 100)}%` : "—"}
                    {!r.reliable && <span className="text-muted-foreground text-xs ml-1">(low sample)</span>}
                  </span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card data-testid="card-poor-feedback-recommendations">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ThumbsDown className="w-4 h-4" /> Recommendations With Consistently Poor Feedback
          </CardTitle>
          <CardDescription className="text-xs">
            Guidance suggestions shown on turns that later received 👎 feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-poor-feedback-recommendations"
            rows={data.guidance.poorFeedbackRecommendations}
            emptyText="No guidance suggestions with poor feedback recorded yet."
            columns={[
              { header: "From", render: (r) => <span className="capitalize">{r.sourceDomain}</span> },
              { header: "To", render: (r) => <span className="capitalize">{r.domain}</span> },
              { header: "Shown", render: (r) => r.shownCount },
              { header: "👎 turns", render: (r) => r.downCount },
              {
                header: "Down rate",
                render: (r) => (
                  <span>
                    {Math.round(r.downRate * 100)}%
                    {!r.reliable && <span className="text-muted-foreground text-xs ml-1">(low sample)</span>}
                  </span>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card data-testid="card-abandonment-opportunities">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Abandonment Opportunities
          </CardTitle>
          <CardDescription className="text-xs">
            Suggestions users see often but rarely follow — a signal the suggestion, label, or destination needs work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-abandonment-opportunities"
            rows={data.guidance.abandonmentOpportunities}
            emptyText="No abandonment opportunities recorded yet."
            columns={[
              { header: "From", render: (r) => <span className="capitalize">{r.sourceDomain}</span> },
              { header: "To", render: (r) => <span className="capitalize">{r.domain}</span> },
              { header: "Shown", render: (r) => r.shown },
              { header: "Followed", render: (r) => r.clicked },
              {
                header: "Click-through",
                render: (r) => `${Math.round((r.clickThroughRate ?? 0) * 100)}%`,
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* INT39 — Goal Completion headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          label="Goal completion rate"
          value={fmtRate(data.goalCompletion.funnel.completionRate)}
          hint={`${data.goalCompletion.funnel.goalCompleted} of ${data.goalCompletion.funnel.guidanceFollowed} followed suggestions completed the intended journey`}
          testId="stat-goal-completion-rate"
        />
        <StatTile
          label="Goal abandonment rate"
          value={fmtRate(data.goalCompletion.funnel.abandonmentRate)}
          hint={`${data.goalCompletion.funnel.guidancePresented - data.goalCompletion.funnel.guidanceFollowed} of ${data.goalCompletion.funnel.guidancePresented} shown suggestions were never followed`}
          testId="stat-goal-abandonment-rate"
        />
        <StatTile
          label="Recovery after failed conversation"
          value={fmtRate(data.goalCompletion.recoveryAfterFailure.rate)}
          hint={`${data.goalCompletion.recoveryAfterFailure.totalRecovered} of ${data.goalCompletion.recoveryAfterFailure.totalFailed - data.goalCompletion.recoveryAfterFailure.totalWithoutFollowUp} failed turns recovered next turn`}
          testId="stat-recovery-after-failure-rate"
        />
      </div>

      <Card data-testid="card-goal-funnel">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-4 h-4" /> Goal Completion Funnel
          </CardTitle>
          <CardDescription className="text-xs">
            Intent recognised → capability executed → guidance presented → followed → completed. Each capability
            declares its own "done" (Capability Guidance Registry) — a click only counts as completed when it matches
            that capability's own completion criteria, not just any click.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Intent recognised", value: data.goalCompletion.funnel.intentRecognised },
              { label: "Capability executed", value: data.goalCompletion.funnel.capabilityExecuted },
              { label: "Guidance presented", value: data.goalCompletion.funnel.guidancePresented },
              { label: "Guidance followed", value: data.goalCompletion.funnel.guidanceFollowed },
              { label: "Goal completed", value: data.goalCompletion.funnel.goalCompleted },
            ].map((stage) => (
              <div key={stage.label} className="text-center" data-testid={`stat-funnel-${stage.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <p className="text-lg font-semibold">{stage.value}</p>
                <p className="text-xs text-muted-foreground">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-highest-converting-actions">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Highest Converting Guidance Actions
          </CardTitle>
          <CardDescription className="text-xs">
            Individual capability-owned guidance actions ranked by click-through rate (finer-grained than the
            domain-level journeys above — one domain can be served by more than one capability).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-highest-converting-actions"
            rows={data.goalCompletion.highestConvertingActions}
            emptyText="No guidance actions with a reliable sample yet."
            columns={[
              { header: "From capability", render: (r) => r.sourceCapabilityId },
              { header: "To capability", render: (r) => r.targetCapabilityId },
              { header: "Verb", render: (r) => r.verb },
              { header: "Shown", render: (r) => r.shown },
              { header: "Followed", render: (r) => r.clicked },
              { header: "Click-through", render: (r) => `${Math.round((r.clickThroughRate ?? 0) * 100)}%` },
            ]}
          />
        </CardContent>
      </Card>

      <Card data-testid="card-ignored-actions">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Redo2 className="w-4 h-4" /> Guidance Actions Frequently Ignored
          </CardTitle>
          <CardDescription className="text-xs">
            Capability-owned guidance actions shown often but rarely followed — a candidate for a better label,
            destination, or removal from that capability's declared guidance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-ignored-actions"
            rows={data.goalCompletion.ignoredActions}
            emptyText="No frequently-ignored guidance actions recorded yet."
            columns={[
              { header: "From capability", render: (r) => r.sourceCapabilityId },
              { header: "To capability", render: (r) => r.targetCapabilityId },
              { header: "Verb", render: (r) => r.verb },
              { header: "Shown", render: (r) => r.shown },
              { header: "Followed", render: (r) => r.clicked },
              { header: "Click-through", render: (r) => `${Math.round((r.clickThroughRate ?? 0) * 100)}%` },
            ]}
          />
        </CardContent>
      </Card>

      {/* INT40 — Companion Task Delegation & Assisted Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          label="Delegated task completion rate"
          value={fmtRate(data.delegation.completionRate.rate)}
          hint={`${data.delegation.completionRate.totalSucceeded} of ${data.delegation.completionRate.totalTerminal} resolved actions succeeded`}
          testId="stat-delegation-completion-rate"
        />
        <StatTile
          label="Action success rate"
          value={fmtRate(data.delegation.successRate.rate)}
          hint={`${data.delegation.successRate.numerator} of ${data.delegation.successRate.denominator} confirmed actions succeeded (excludes cancellations)`}
          testId="stat-delegation-success-rate"
        />
        <StatTile
          label="Action cancellation rate"
          value={fmtRate(data.delegation.cancellationRate.rate)}
          hint={`${data.delegation.cancellationRate.numerator} of ${data.delegation.cancellationRate.denominator} resolved actions were cancelled`}
          testId="stat-delegation-cancellation-rate"
        />
        <StatTile
          label="Partial completion rate"
          value={fmtRate(data.delegation.partialCompletionRate.rate)}
          hint={`${data.delegation.partialCompletionRate.numerator} of ${data.delegation.partialCompletionRate.denominator} multi-action workflows had a mix of success and failure`}
          testId="stat-delegation-partial-completion-rate"
        />
        <StatTile
          label="Average delegated workflow duration"
          value={fmtDuration(data.delegation.averageWorkflowDuration.averageSeconds)}
          hint={`Across ${data.delegation.averageWorkflowDuration.sampleSize} fully-resolved workflows`}
          testId="stat-delegation-workflow-duration"
        />
      </div>

      <Card data-testid="card-most-delegated-actions">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Most Frequently Delegated Actions
          </CardTitle>
          <CardDescription className="text-xs">
            Companion Action proposals ranked by how often they were offered — every action here reuses an existing
            platform capability; the Companion never implements its own action logic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-most-delegated-actions"
            rows={data.delegation.mostDelegatedActions}
            emptyText="No Companion Actions have been proposed yet."
            columns={[
              { header: "Capability", render: (r) => r.capabilityId },
              { header: "Verb", render: (r) => r.verb },
              { header: "Proposed", render: (r) => r.count },
            ]}
          />
        </CardContent>
      </Card>

      <Card data-testid="card-most-successful-workflows">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Most Successful Delegated Workflows
          </CardTitle>
          <CardDescription className="text-xs">
            Guided workflows (ordered capability → verb steps) where every action succeeded, most frequent first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-most-successful-workflows"
            rows={data.delegation.mostSuccessfulWorkflows}
            emptyText="No fully-successful delegated workflows recorded yet."
            columns={[
              { header: "Workflow", render: (r) => r.signature },
              { header: "Steps", render: (r) => r.stepCount },
              { header: "Times completed", render: (r) => r.count },
              { header: "Reliable", render: (r) => (r.reliable ? "Yes" : "Low sample") },
            ]}
          />
        </CardContent>
      </Card>

      <Card data-testid="card-most-abandoned-workflows">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <XOctagon className="w-4 h-4" /> Most Abandoned Delegated Workflows
          </CardTitle>
          <CardDescription className="text-xs">
            Guided workflows proposed but never confirmed (every step still "proposed"), most frequent first — a
            candidate for a clearer label, better default parameters, or a lighter confirmation tier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-most-abandoned-workflows"
            rows={data.delegation.mostAbandonedWorkflows}
            emptyText="No abandoned delegated workflows recorded yet."
            columns={[
              { header: "Workflow", render: (r) => r.signature },
              { header: "Steps", render: (r) => r.stepCount },
              { header: "Times abandoned", render: (r) => r.count },
              { header: "Reliable", render: (r) => (r.reliable ? "Yes" : "Low sample") },
            ]}
          />
        </CardContent>
      </Card>

      {/* Top unmatched requests */}
      <Card data-testid="card-top-unmatched">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Top Unmatched Requests</CardTitle>
          <CardDescription className="text-xs">Questions the resolver did not understand — the matcher backlog.</CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-top-unmatched"
            rows={data.classification.resolverGaps}
            emptyText="No unmatched requests recorded yet."
            onRowClick={(row) => setDrillDown({
              title: `"${row.utterance}"`,
              body: (
                <div className="text-sm space-y-2">
                  <p>Asked {row.count} time(s), from: {row.surfaces.join(", ") || "unknown surface"}.</p>
                  <p className="text-muted-foreground text-xs">Anonymised utterance text only — no user or household identity is retained.</p>
                </div>
              ),
            })}
            columns={[
              { header: "Utterance", render: (r) => `"${r.utterance}"` },
              { header: "Count", render: (r) => r.count },
              { header: "Surfaces", render: (r) => r.surfaces.slice(0, 3).join(", ") },
            ]}
          />
        </CardContent>
      </Card>

      {/* Fastest-growing intent gaps */}
      <Card data-testid="card-fastest-growing">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Fastest-Growing Intent Gaps</CardTitle>
          <CardDescription className="text-xs">{data.trend.note}</CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-fastest-growing"
            rows={data.trend.fastestGrowingGaps}
            emptyText={data.trend.available ? "No growing gaps between the last two snapshots." : "Generate at least two snapshots to see trend data."}
            columns={[
              { header: "Utterance", render: (r) => `"${r.utterance}"` },
              { header: "Previous", render: (r) => r.previousCount },
              { header: "Current", render: (r) => r.currentCount },
              { header: "Growth", render: (r) => <Badge variant="outline" className="text-xs">+{r.growth}</Badge> },
            ]}
          />
        </CardContent>
      </Card>

      {/* Capability / Knowledge / Platform-failure analysis */}
      <Card data-testid="card-capability-gaps">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Capability Gap Analysis</CardTitle>
          <CardDescription className="text-xs">Understood and routed, but the feature doesn't exist yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-capability-gaps"
            rows={data.classification.capabilityGaps}
            emptyText="No capability gaps recorded."
            onRowClick={(row) => setDrillDown({
              title: `${row.capability} / ${row.verb}`,
              body: (
                <div className="text-sm space-y-2">
                  <p>Observed {row.count} time(s). Statuses: {row.statuses.join(", ")}.</p>
                  {row.reason && <p className="text-muted-foreground">Registry reason: {row.reason}</p>}
                </div>
              ),
            })}
            columns={[
              { header: "Capability", render: (r) => r.capability },
              { header: "Verb", render: (r) => r.verb },
              { header: "Count", render: (r) => r.count },
              { header: "Reason", render: (r) => r.reason ?? "—" },
            ]}
          />
        </CardContent>
      </Card>

      <Card data-testid="card-knowledge-gaps">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Knowledge Gap Analysis</CardTitle>
          <CardDescription className="text-xs">Feature exists, but no trusted stored knowledge answered the ask.</CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-knowledge-gaps"
            rows={data.classification.knowledgeGaps}
            emptyText="No knowledge gaps recorded."
            columns={[
              { header: "Capability", render: (r) => r.capability },
              { header: "Verb", render: (r) => r.verb },
              { header: "Count", render: (r) => r.count },
            ]}
          />
        </CardContent>
      </Card>

      <Card data-testid="card-platform-failures">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><ServerCrash className="w-4 h-4" /> Routing Failure Analysis (Platform Faults)</CardTitle>
          <CardDescription className="text-xs">Genuine faults — not honest gaps.</CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-platform-failures"
            rows={data.classification.platformFailures}
            emptyText="No platform faults recorded."
            columns={[
              { header: "Capability", render: (r) => r.capability },
              { header: "Verb", render: (r) => r.verb },
              { header: "Count", render: (r) => r.count },
            ]}
          />
        </CardContent>
      </Card>

      {/* Most requested new capabilities */}
      <Card data-testid="card-most-requested">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><Layers className="w-4 h-4" /> Most Requested New Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-most-requested"
            rows={mostRequestedCapabilities}
            emptyText="No capability requests recorded."
            columns={[
              { header: "Capability", render: (r) => r.capability },
              { header: "Requests observed", render: (r) => r.count },
            ]}
          />
        </CardContent>
      </Card>

      {/* Impact-ranked improvement opportunities */}
      <Card data-testid="card-impact-ranked">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><MessageCircleQuestion className="w-4 h-4" /> Improvement Opportunities Ranked by Impact</CardTitle>
          <CardDescription className="text-xs">Impact = observed frequency across all gap categories, ranked descending.</CardDescription>
        </CardHeader>
        <CardContent>
          <GapTable
            testId="table-impact-ranked"
            rows={impactRanked}
            emptyText="No improvement opportunities recorded."
            columns={[
              { header: "Opportunity", render: (r) => r.label },
              { header: "Category", render: (r) => <Badge variant="outline" className="text-xs">{r.category}</Badge> },
              { header: "Frequency", render: (r) => r.count },
            ]}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Recommendation queue */}
      <RecommendationQueue />

      <Dialog open={drillDown != null} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent data-testid="dialog-drill-down">
          <DialogHeader>
            <DialogTitle>{drillDown?.title}</DialogTitle>
            <DialogDescription asChild>
              <div>{drillDown?.body}</div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
