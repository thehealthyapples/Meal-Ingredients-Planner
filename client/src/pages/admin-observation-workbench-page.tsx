/**
 * admin-observation-workbench-page.tsx — OBS1 Observation Admin Workbench
 * ========================================================================
 * The admin dashboard for the Intelligence Platform's Observation Engine —
 * canonical runtime telemetry. Nine tabs read the observation aggregation
 * endpoints (/api/intelligence/observation/*) and render capability health,
 * intent quality, context composition, companion outcomes, knowledge
 * grounding, planner activity, benchmark runs, and a raw diagnostics feed.
 *
 * The page renders whatever the server reports; it computes nothing itself
 * beyond display formatting, and it degrades gracefully when a window has no
 * data (nulls render as "—", never as a fabricated 0).
 */

import { Fragment, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import NotFound from "./not-found";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Download, Link2 } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, PieChart, Pie,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

// ---------------------------------------------------------------------------
// Status palette — mirrors admin-intelligence-page.tsx. Colour is always
// paired with a label, never the sole carrier of meaning.
// ---------------------------------------------------------------------------
const C_GOOD = "#16a34a";    // green-600
const C_BAD = "#dc2626";     // red-600
const C_WARN = "#f59e0b";    // amber-500
const C_NEUTRAL = "#3b82f6"; // blue-500

const OBSERVATION_KINDS = [
  "intent-resolution", "capability-invocation", "context-composition",
  "knowledge-retrieval", "response-generation", "clarification", "recovery",
  "escalation", "manual-override", "user-feedback", "benchmark-run",
] as const;

const SEVERITIES = ["info", "warning", "error"] as const;

// ---------------------------------------------------------------------------
// API response shapes (client-side mirrors; every field is treated as
// potentially absent so an empty window or an older server never crashes).
// ---------------------------------------------------------------------------
interface KindCount { kind: string; count: number }
interface SeverityCount { severity: string; count: number }
interface DayCount { day: string; total: number; errors: number }
interface OverviewResponse {
  windowDays?: number;
  total?: number;
  successRate?: number | null;
  failureRate?: number | null;
  clarificationRate?: number | null;
  averageConfidence?: number | null;
  averageResponseTimeMs?: number | null;
  averageContextCompositionMs?: number | null;
  byKind?: KindCount[];
  bySeverity?: SeverityCount[];
  byDay?: DayCount[];
}

interface CapabilityTrendPoint { day: string; total: number; failures: number }
interface CapabilityRow {
  capability: string; total: number; ok: number; gaps: number; denied: number; errors: number;
  successRate?: number | null; averageConfidence?: number | null; averageDurationMs?: number | null;
  trend?: CapabilityTrendPoint[];
}
interface CapabilitiesResponse { windowDays?: number; capabilities?: CapabilityRow[] }

interface IntentRow {
  intent: string; capability?: string | null; verb?: string | null;
  total: number; failed: number; clarifications: number; averageConfidence?: number | null;
}
interface IntentsResponse {
  windowDays?: number;
  intents?: IntentRow[];
  failedIntents?: { intent: string; failed: number }[];
  confidenceDistribution?: { bucket: string; count: number }[];
  clarificationRate?: number | null;
}

interface ContextViewRow {
  contextView: string; count: number;
  averageCompositionMs?: number | null; budgetExceededCount?: number;
  /** NCV1 — composed from a `ContextViewSpec` its owning capability declared. */
  nativeCount?: number;
  /** NCV1 — derived by the engine from the payload's structure. */
  genericCount?: number;
  /** NCV1 — recorded before the rollout, so classified neither way. */
  unknownCount?: number;
}
interface ContextResponse {
  windowDays?: number;
  compositionCount?: number;
  averageCompositionMs?: number | null;
  budgetExceededCount?: number;
  missingContextCount?: number;
  /** NCV1 — compositions that classified their views. The rest predate the rollout. */
  classifiedCompositionCount?: number;
  views?: ContextViewRow[];
}

interface CompanionResponse {
  windowDays?: number;
  feedback?: { helpful?: number; notHelpful?: number; byReason?: { reason: string; count: number }[] };
  escalations?: { total?: number; byPath?: { path: string; count: number }[] };
  recoveries?: {
    total?: number;
    byState?: { state: string; count: number }[];
    byPath?: { path: string; count: number }[];
  };
  responseGeneration?: { total?: number; errors?: number; averageDurationMs?: number | null };
}

interface KnowledgeResponse {
  windowDays?: number;
  retrievals?: { total?: number; grounded?: number; gaps?: number; coverageRate?: number | null };
  honestGapRate?: number | null;
  gapKinds?: { kind: string; count: number }[];
  sources?: { capability: string; count: number }[];
}

interface PlannerResponse {
  windowDays?: number;
  total?: number;
  byVerb?: { verb: string; total: number; ok: number; failures: number }[];
  generation?: { attempts?: number; gaps?: number; note?: string | null };
  recoveries?: number;
  averageDurationMs?: number | null;
}

interface BenchmarkRun {
  runId: string; mode: string; observedAt: string;
  headlineScore?: number | null; honestGapRate?: number | null;
  meanLatencyMs?: number | null; durationMs?: number | null; questionsScored?: number | null;
}
interface BenchmarksResponse {
  runs?: BenchmarkRun[];
  trend?: { observedAt: string; headlineScore: number }[];
}

interface RecentObservation {
  id: string; observedAt: string; kind: string; severity: string;
  outcome?: string | null; userId?: number | string | null; sessionId?: string | null;
  surface?: string | null; capability?: string | null; verb?: string | null;
  intent?: string | null; contextView?: string | null; confidence?: number | null;
  durationMs?: number | null; recoveryPath?: string | null; metadata?: unknown;
}
interface RecentResponse { observations?: RecentObservation[] }

// ---------------------------------------------------------------------------
// Formatting helpers — null/undefined always render as "—", never 0.
// ---------------------------------------------------------------------------
const DASH = "—";
function fmtPct(v: number | null | undefined): string {
  return v === null || v === undefined ? DASH : `${(v * 100).toFixed(1)}%`;
}
function fmtMs(v: number | null | undefined): string {
  return v === null || v === undefined ? DASH : `${Math.round(v)}ms`;
}
function fmtConf(v: number | null | undefined): string {
  return v === null || v === undefined ? DASH : v.toFixed(2);
}
function fmtInt(v: number | null | undefined): string {
  return v === null || v === undefined ? DASH : String(v);
}
function fmtDate(x: string | null | undefined): string {
  if (!x) return DASH;
  try { return new Date(x).toLocaleString(); } catch { return String(x); }
}

// ---------------------------------------------------------------------------
// Shared query hook — object params in a query key are NOT auto-serialised by
// the default queryFn, so every observation query builds its own URL.
// ---------------------------------------------------------------------------
function useObservationQuery<T>(path: string, days: number) {
  return useQuery<T>({
    queryKey: [`/api/intelligence/observation/${path}`, { days }],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days) });
      const res = await apiRequest("GET", `/api/intelligence/observation/${path}?${params}`);
      return res.json();
    },
  });
}

// ---------------------------------------------------------------------------
// Shared presentation atoms
// ---------------------------------------------------------------------------
function StatTile({ label, value, hint, accent, testId }: { label: string; value: string; hint?: string; accent?: string; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight mt-1" style={accent ? { color: accent } : undefined}>{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "error") return <Badge variant="destructive">error</Badge>;
  if (severity === "warning") {
    return (
      <Badge variant="outline" className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        warning
      </Badge>
    );
  }
  return <Badge variant="secondary">{severity || "info"}</Badge>;
}

function TabSkeleton() {
  return (
    <div className="space-y-4" data-testid="tab-skeleton">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
      </div>
      <div className="h-56 bg-muted animate-pulse rounded-lg" />
      <div className="h-40 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

function TabError({ what }: { what: string }) {
  return (
    <Card data-testid="card-tab-error">
      <CardContent className="flex items-start gap-3 py-5">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Could not load {what}</p>
          <p className="text-xs text-muted-foreground mt-1">
            The observation endpoint did not respond. It may not be deployed yet, or your admin session may have expired.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-2">{children}</p>;
}

/** A small key/count table used across tabs (byKind, bySeverity, reasons, paths…). */
function CountTable({
  title, rows, keyHeader, renderKey, testId, empty,
}: {
  title: string;
  rows: { key: string; count: number }[];
  keyHeader: string;
  renderKey?: (key: string) => React.ReactNode;
  testId: string;
  empty?: string;
}) {
  return (
    <Card data-testid={`card-${testId}`}>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyNote>{empty ?? "No data in this window."}</EmptyNote>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{keyHeader}</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key} data-testid={`row-${testId}-${r.key}`}>
                    <TableCell>{renderKey ? renderKey(r.key) : r.key}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Overview
// ---------------------------------------------------------------------------
function OverviewTab({ days }: { days: number }) {
  const { data, isPending, isError } = useObservationQuery<OverviewResponse>("overview", days);
  if (isPending) return <TabSkeleton />;
  if (isError) return <TabError what="the observation overview" />;
  const d = data ?? {};

  const byKind = d.byKind ?? [];
  const bySeverity = d.bySeverity ?? [];
  const byDay = d.byDay ?? [];
  const errorCount = bySeverity.find((s) => s.severity === "error")?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Total observations" value={fmtInt(d.total)} testId="stat-obs-total" />
        <StatTile label="Success rate" value={fmtPct(d.successRate)} accent={d.successRate != null ? C_GOOD : undefined} testId="stat-obs-success-rate" />
        <StatTile label="Failure rate" value={fmtPct(d.failureRate)} accent={d.failureRate != null && d.failureRate > 0 ? C_BAD : undefined} testId="stat-obs-failure-rate" />
        <StatTile label="Clarification rate" value={fmtPct(d.clarificationRate)} testId="stat-obs-clarification-rate" />
        <StatTile label="Avg confidence" value={fmtConf(d.averageConfidence)} testId="stat-obs-avg-confidence" />
        <StatTile label="Avg response time" value={fmtMs(d.averageResponseTimeMs)} testId="stat-obs-avg-response" />
        <StatTile label="Avg context composition" value={fmtMs(d.averageContextCompositionMs)} testId="stat-obs-avg-context" />
        <StatTile label="Errors" value={String(errorCount)} accent={errorCount > 0 ? C_BAD : undefined} hint="severity=error observations" testId="stat-obs-errors" />
      </div>

      <Card data-testid="card-obs-by-day">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Observations per day</CardTitle>
          <CardDescription className="text-xs">Total observations vs errors across the window.</CardDescription>
        </CardHeader>
        <CardContent>
          {byDay.length === 0 ? (
            <EmptyNote>No observations recorded in this window.</EmptyNote>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={byDay} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke={C_NEUTRAL} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="errors" name="Errors" stroke={C_BAD} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CountTable
          title="By kind" keyHeader="Kind" testId="by-kind"
          rows={byKind.map((k) => ({ key: k.kind, count: k.count }))}
          renderKey={(k) => <Badge variant="outline">{k}</Badge>}
        />
        <CountTable
          title="By severity" keyHeader="Severity" testId="by-severity"
          rows={bySeverity.map((s) => ({ key: s.severity, count: s.count }))}
          renderKey={(s) => <SeverityBadge severity={s} />}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Capabilities
// ---------------------------------------------------------------------------
function CapabilitiesTab({ days }: { days: number }) {
  const { data, isPending, isError } = useObservationQuery<CapabilitiesResponse>("capabilities", days);
  const [expanded, setExpanded] = useState<string | null>(null);
  if (isPending) return <TabSkeleton />;
  if (isError) return <TabError what="capability health" />;

  const rows = (data?.capabilities ?? []).slice().sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const chartData = rows.map((r) => ({ capability: r.capability, total: r.total ?? 0 }));
  const chartHeight = Math.max(120, chartData.length * 30 + 24);

  return (
    <div className="space-y-4">
      <Card data-testid="card-cap-invocations-chart">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Invocations by capability</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyNote>No capability invocations in this window.</EmptyNote>
          ) : (
            <div style={{ width: "100%", height: chartHeight }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.25} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="capability" width={160} tick={{ fontSize: 11 }} interval={0} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total" name="Invocations" fill={C_NEUTRAL} radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-cap-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Capability health</CardTitle>
          <CardDescription className="text-xs">Click a row to see its daily trend.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyNote>No capability invocations in this window.</EmptyNote>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Capability</TableHead>
                    <TableHead className="text-right">Invocations</TableHead>
                    <TableHead className="text-right">Success %</TableHead>
                    <TableHead className="text-right">Gaps</TableHead>
                    <TableHead className="text-right">Denied</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Avg confidence</TableHead>
                    <TableHead className="text-right">Avg latency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <Fragment key={r.capability}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpanded(expanded === r.capability ? null : r.capability)}
                        data-testid={`row-capability-${r.capability}`}
                      >
                        <TableCell className="font-medium">{r.capability}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtInt(r.total)}</TableCell>
                        <TableCell className="text-right tabular-nums" style={r.successRate != null && r.successRate < 0.9 ? { color: C_WARN } : undefined}>
                          {fmtPct(r.successRate)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{fmtInt(r.gaps)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtInt(r.denied)}</TableCell>
                        <TableCell className="text-right tabular-nums" style={(r.errors ?? 0) > 0 ? { color: C_BAD } : undefined}>{fmtInt(r.errors)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtConf(r.averageConfidence)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtMs(r.averageDurationMs)}</TableCell>
                      </TableRow>
                      {expanded === r.capability && (
                        <TableRow data-testid={`row-capability-trend-${r.capability}`}>
                          <TableCell colSpan={8}>
                            {(r.trend ?? []).length === 0 ? (
                              <EmptyNote>No daily trend recorded for this capability.</EmptyNote>
                            ) : (
                              <div style={{ width: "100%", height: 160 }}>
                                <ResponsiveContainer>
                                  <LineChart data={r.trend} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ fontSize: 12 }} />
                                    <Line type="monotone" dataKey="total" name="Total" stroke={C_NEUTRAL} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                                    <Line type="monotone" dataKey="failures" name="Failures" stroke={C_BAD} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Intents
// ---------------------------------------------------------------------------
function IntentsTab({ days }: { days: number }) {
  const { data, isPending, isError } = useObservationQuery<IntentsResponse>("intents", days);
  if (isPending) return <TabSkeleton />;
  if (isError) return <TabError what="intent quality" />;
  const d = data ?? {};

  const intents = (d.intents ?? []).slice().sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const failedIntents = d.failedIntents ?? [];
  const distribution = d.confidenceDistribution ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Distinct intents" value={String(intents.length)} testId="stat-intents-distinct" />
        <StatTile label="Clarification rate" value={fmtPct(d.clarificationRate)} testId="stat-intents-clarification-rate" />
      </div>

      <Card data-testid="card-confidence-distribution">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Confidence distribution</CardTitle>
          <CardDescription className="text-xs">Resolved-intent confidence, bucketed 0.0–1.0.</CardDescription>
        </CardHeader>
        <CardContent>
          {distribution.length === 0 ? (
            <EmptyNote>No intent resolutions in this window.</EmptyNote>
          ) : (
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={distribution} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Resolutions" fill={C_NEUTRAL} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-common-intents">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Most common intents</CardTitle></CardHeader>
        <CardContent>
          {intents.length === 0 ? (
            <EmptyNote>No intents observed in this window.</EmptyNote>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intent</TableHead>
                    <TableHead>Capability : verb</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right">Clarifications</TableHead>
                    <TableHead className="text-right">Avg confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {intents.map((r) => (
                    <TableRow key={r.intent} data-testid={`row-intent-${r.intent}`}>
                      <TableCell className="font-medium">{r.intent}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.capability ? `${r.capability}${r.verb ? ` : ${r.verb}` : ""}` : DASH}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtInt(r.total)}</TableCell>
                      <TableCell className="text-right tabular-nums" style={(r.failed ?? 0) > 0 ? { color: C_BAD } : undefined}>{fmtInt(r.failed)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtInt(r.clarifications)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtConf(r.averageConfidence)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CountTable
        title="Failed intents" keyHeader="Intent" testId="failed-intents"
        rows={failedIntents.map((f) => ({ key: f.intent, count: f.failed }))}
        empty="No failed intents in this window."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Context
// ---------------------------------------------------------------------------
function ContextTab({ days }: { days: number }) {
  const { data, isPending, isError } = useObservationQuery<ContextResponse>("context", days);
  if (isPending) return <TabSkeleton />;
  if (isError) return <TabError what="context composition telemetry" />;
  const d = data ?? {};
  const views = d.views ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Compositions" value={fmtInt(d.compositionCount)} testId="stat-ctx-count" />
        <StatTile label="Avg composition time" value={fmtMs(d.averageCompositionMs)} testId="stat-ctx-avg-ms" />
        <StatTile label="Budget exceeded" value={fmtInt(d.budgetExceededCount)} accent={(d.budgetExceededCount ?? 0) > 0 ? C_WARN : undefined} testId="stat-ctx-budget" />
        <StatTile label="Missing context" value={fmtInt(d.missingContextCount)} accent={(d.missingContextCount ?? 0) > 0 ? C_BAD : undefined} testId="stat-ctx-missing" />
      </div>

      <Card data-testid="card-context-views">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Context views</CardTitle>
          <CardDescription className="text-xs">
            Compositions by context view over the window. <strong>Native</strong> views are declared by the
            capability that owns the payload; <strong>generic</strong> views are derived by the engine from the
            payload's structure. Turns recorded before the NCV1 rollout classified neither and are shown as
            not recorded, never as generic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {views.length === 0 ? (
            <EmptyNote>No context compositions in this window.</EmptyNote>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Context view</TableHead>
                    <TableHead>Composed by</TableHead>
                    <TableHead className="text-right">Compositions</TableHead>
                    <TableHead className="text-right">Avg composition</TableHead>
                    <TableHead className="text-right">Budget exceeded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {views.map((v) => (
                    <TableRow key={v.contextView} data-testid={`row-context-view-${v.contextView}`}>
                      <TableCell className="font-medium">{v.contextView}</TableCell>
                      {/* NCV1 — a view is native (its capability declared it), generic (the
                          engine derived it), or unknown (recorded before the rollout). A row
                          that classified nothing is shown as unknown, never as generic. */}
                      <TableCell data-testid={`context-view-origin-${v.contextView}`}>
                        <span className="inline-flex flex-wrap gap-1">
                          {(v.nativeCount ?? 0) > 0 && <Badge variant="secondary">native × {fmtInt(v.nativeCount)}</Badge>}
                          {(v.genericCount ?? 0) > 0 && <Badge variant="outline">generic × {fmtInt(v.genericCount)}</Badge>}
                          {(v.unknownCount ?? 0) > 0 && (
                            <Badge variant="outline" className="text-muted-foreground">not recorded × {fmtInt(v.unknownCount)}</Badge>
                          )}
                          {(v.nativeCount ?? 0) + (v.genericCount ?? 0) + (v.unknownCount ?? 0) === 0 && DASH}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtInt(v.count)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMs(v.averageCompositionMs)}</TableCell>
                      <TableCell className="text-right tabular-nums" style={(v.budgetExceededCount ?? 0) > 0 ? { color: C_WARN } : undefined}>
                        {fmtInt(v.budgetExceededCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 5 — Companion
// ---------------------------------------------------------------------------
function CompanionTab({ days }: { days: number }) {
  const { data, isPending, isError } = useObservationQuery<CompanionResponse>("companion", days);
  if (isPending) return <TabSkeleton />;
  if (isError) return <TabError what="companion outcomes" />;
  const d = data ?? {};

  const helpful = d.feedback?.helpful ?? 0;
  const notHelpful = d.feedback?.notHelpful ?? 0;
  const donut = [
    { name: "Helpful", value: helpful, fill: C_GOOD },
    { name: "Not helpful", value: notHelpful, fill: C_BAD },
  ].filter((x) => x.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatTile label="Helpful" value={String(helpful)} accent={C_GOOD} testId="stat-comp-helpful" />
        <StatTile label="Not helpful" value={String(notHelpful)} accent={notHelpful > 0 ? C_BAD : undefined} testId="stat-comp-not-helpful" />
        <StatTile label="Escalations" value={fmtInt(d.escalations?.total)} testId="stat-comp-escalations" />
        <StatTile label="Recoveries" value={fmtInt(d.recoveries?.total)} testId="stat-comp-recoveries" />
        <StatTile label="Generation errors" value={fmtInt(d.responseGeneration?.errors)} accent={(d.responseGeneration?.errors ?? 0) > 0 ? C_BAD : undefined} testId="stat-comp-gen-errors" />
        <StatTile label="Avg generation time" value={fmtMs(d.responseGeneration?.averageDurationMs)} hint={`across ${fmtInt(d.responseGeneration?.total)} generations`} testId="stat-comp-gen-ms" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="card-feedback-donut">
          <CardHeader className="pb-2"><CardTitle className="text-sm">User feedback</CardTitle></CardHeader>
          <CardContent>
            {donut.length === 0 ? (
              <EmptyNote>No user feedback in this window.</EmptyNote>
            ) : (
              <div className="flex items-center gap-4">
                <div style={{ width: 150, height: 150 }} className="shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={donut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={2} isAnimationActive={false}>
                        {donut.map((x) => <Cell key={x.name} fill={x.fill} stroke="var(--background)" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip formatter={(v: number, n) => [`${v}`, n]} contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: C_GOOD }} /><span className="font-medium">{helpful}</span> Helpful</p>
                  <p className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: C_BAD }} /><span className="font-medium">{notHelpful}</span> Not helpful</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <CountTable
          title="Not-helpful reasons" keyHeader="Reason" testId="feedback-reasons"
          rows={(d.feedback?.byReason ?? []).map((r) => ({ key: r.reason, count: r.count }))}
          empty="No feedback reasons recorded."
        />
        <CountTable
          title="Escalations by path" keyHeader="Path" testId="escalation-paths"
          rows={(d.escalations?.byPath ?? []).map((r) => ({ key: r.path, count: r.count }))}
          empty="No escalations in this window."
        />
        <CountTable
          title="Recoveries by state" keyHeader="State" testId="recovery-states"
          rows={(d.recoveries?.byState ?? []).map((r) => ({ key: r.state, count: r.count }))}
          empty="No recoveries in this window."
        />
        <CountTable
          title="Recoveries by path" keyHeader="Path" testId="recovery-paths"
          rows={(d.recoveries?.byPath ?? []).map((r) => ({ key: r.path, count: r.count }))}
          empty="No recoveries in this window."
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 6 — Knowledge
// ---------------------------------------------------------------------------
function KnowledgeTab({ days }: { days: number }) {
  const { data, isPending, isError } = useObservationQuery<KnowledgeResponse>("knowledge", days);
  if (isPending) return <TabSkeleton />;
  if (isError) return <TabError what="knowledge grounding telemetry" />;
  const d = data ?? {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile label="Retrievals" value={fmtInt(d.retrievals?.total)} testId="stat-know-retrievals" />
        <StatTile label="Grounded (canonical)" value={fmtInt(d.retrievals?.grounded)} accent={C_GOOD} testId="stat-know-grounded" />
        <StatTile label="Honest gaps" value={fmtInt(d.retrievals?.gaps)} testId="stat-know-gaps" />
        <StatTile label="Coverage rate" value={fmtPct(d.retrievals?.coverageRate)} testId="stat-know-coverage" />
        <StatTile label="Honest gap rate" value={fmtPct(d.honestGapRate)} testId="stat-know-gap-rate" />
      </div>

      <p className="text-xs text-muted-foreground">
        Every grounded answer is composed from canonical capability data; honest gaps are disclosed, never generated.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CountTable
          title="Gap kinds" keyHeader="Kind" testId="gap-kinds"
          rows={(d.gapKinds ?? []).map((g) => ({ key: g.kind, count: g.count }))}
          empty="No knowledge gaps in this window."
        />
        <CountTable
          title="Knowledge source usage — capability data grounding the answer" keyHeader="Capability" testId="knowledge-sources"
          rows={(d.sources ?? []).map((s) => ({ key: s.capability, count: s.count }))}
          empty="No knowledge retrievals in this window."
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 7 — Planner
// ---------------------------------------------------------------------------
function PlannerTab({ days }: { days: number }) {
  const { data, isPending, isError } = useObservationQuery<PlannerResponse>("planner", days);
  if (isPending) return <TabSkeleton />;
  if (isError) return <TabError what="planner telemetry" />;
  const d = data ?? {};
  const byVerb = d.byVerb ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile label="Planner observations" value={fmtInt(d.total)} testId="stat-plan-total" />
        <StatTile label="Generation attempts" value={fmtInt(d.generation?.attempts)} testId="stat-plan-gen-attempts" />
        <StatTile label="Generation gaps" value={fmtInt(d.generation?.gaps)} accent={(d.generation?.gaps ?? 0) > 0 ? C_WARN : undefined} testId="stat-plan-gen-gaps" />
        <StatTile label="Recoveries" value={fmtInt(d.recoveries)} testId="stat-plan-recoveries" />
        <StatTile label="Avg duration" value={fmtMs(d.averageDurationMs)} testId="stat-plan-avg-ms" />
      </div>

      {d.generation?.note && (
        <p className="text-xs text-muted-foreground" data-testid="text-planner-generation-note">{d.generation.note}</p>
      )}

      <Card data-testid="card-planner-verbs">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Planner activity by verb</CardTitle></CardHeader>
        <CardContent>
          {byVerb.length === 0 ? (
            <EmptyNote>No planner activity in this window.</EmptyNote>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Verb</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">OK</TableHead>
                    <TableHead className="text-right">Failures</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byVerb.map((v) => (
                    <TableRow key={v.verb} data-testid={`row-planner-verb-${v.verb}`}>
                      <TableCell className="font-medium">{v.verb}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtInt(v.total)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtInt(v.ok)}</TableCell>
                      <TableCell className="text-right tabular-nums" style={(v.failures ?? 0) > 0 ? { color: C_BAD } : undefined}>{fmtInt(v.failures)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 8 — Benchmarks (no window param — the runs list is global)
// ---------------------------------------------------------------------------
function BenchmarksTab() {
  const { data, isPending, isError } = useQuery<BenchmarksResponse>({
    queryKey: ["/api/intelligence/observation/benchmarks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/intelligence/observation/benchmarks");
      return res.json();
    },
  });
  if (isPending) return <TabSkeleton />;
  if (isError) return <TabError what="benchmark observations" />;

  const runs = (data?.runs ?? []).slice().sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime(),
  );
  const trend = (data?.trend ?? []).map((t) => ({
    label: fmtDate(t.observedAt),
    headlineScore: t.headlineScore,
  }));

  return (
    <div className="space-y-4">
      <Card data-testid="card-benchmark-trend">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Headline score trend</CardTitle>
          <CardDescription className="text-xs">Benchmark headline score across observed runs.</CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <EmptyNote>No benchmark runs observed yet.</EmptyNote>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="headlineScore" name="Score" stroke={C_GOOD} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-benchmark-runs">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Observed benchmark runs</CardTitle></CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <EmptyNote>No benchmark runs observed yet.</EmptyNote>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Observed</TableHead>
                    <TableHead>Run</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Honest gaps</TableHead>
                    <TableHead className="text-right">Mean latency</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r.runId} data-testid={`row-benchmark-${r.runId}`}>
                      <TableCell className="text-xs">{fmtDate(r.observedAt)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.runId}</TableCell>
                      <TableCell><Badge variant="outline">{r.mode}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{fmtInt(r.headlineScore)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtPct(r.honestGapRate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMs(r.meanLatencyMs)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMs(r.durationMs)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtInt(r.questionsScored)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link href="/admin/intelligence" className="text-primary underline" data-testid="link-benchmark-dashboard">
          Open the Benchmark dashboard for full drill-down →
        </Link>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 9 — Diagnostics (raw observation feed + filters + export)
// ---------------------------------------------------------------------------
interface DiagnosticsFilters { q: string; kind: string; severity: string; sessionId: string }
const EMPTY_FILTERS: DiagnosticsFilters = { q: "", kind: "", severity: "", sessionId: "" };
const ALL = "__all__"; // Radix Select cannot represent "" as an item value.

function DiagnosticsTab({ days }: { days: number }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<DiagnosticsFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<DiagnosticsFilters>(EMPTY_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isPending, isError } = useQuery<RecentResponse>({
    queryKey: ["/api/intelligence/observation/recent", { limit: 200, ...applied }],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "200" });
      if (applied.q) params.set("q", applied.q);
      if (applied.kind) params.set("kind", applied.kind);
      if (applied.severity) params.set("severity", applied.severity);
      if (applied.sessionId) params.set("sessionId", applied.sessionId);
      const res = await apiRequest("GET", `/api/intelligence/observation/recent?${params}`);
      return res.json();
    },
  });

  const observations = data?.observations ?? [];

  const applyFilters = () => {
    setExpandedId(null);
    setApplied(draft);
  };
  const correlateSession = (sessionId: string) => {
    const next = { ...draft, sessionId };
    setDraft(next);
    setApplied(next);
    setExpandedId(null);
  };
  const exportObservations = (format: "csv" | "json") => {
    const opened = window.open(`/api/intelligence/observation/export?days=${days}&format=${format}`, "_blank");
    if (!opened) {
      toast({ title: "Export failed", description: "The browser blocked the export window.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card data-testid="card-diagnostics-filters">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Filters</CardTitle>
          <CardDescription className="text-xs">Applied server-side to the most recent 200 observations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-56">
              <p className="text-xs text-muted-foreground mb-1">Search</p>
              <Input
                value={draft.q}
                onChange={(e) => setDraft({ ...draft, q: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
                placeholder="Free-text search…"
                data-testid="input-diagnostics-q"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Kind</p>
              <Select value={draft.kind || ALL} onValueChange={(v) => setDraft({ ...draft, kind: v === ALL ? "" : v })}>
                <SelectTrigger className="w-52" data-testid="select-diagnostics-kind">
                  <SelectValue placeholder="All kinds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All kinds</SelectItem>
                  {OBSERVATION_KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Severity</p>
              <Select value={draft.severity || ALL} onValueChange={(v) => setDraft({ ...draft, severity: v === ALL ? "" : v })}>
                <SelectTrigger className="w-36" data-testid="select-diagnostics-severity">
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All severities</SelectItem>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-56">
              <p className="text-xs text-muted-foreground mb-1">Session ID</p>
              <Input
                value={draft.sessionId}
                onChange={(e) => setDraft({ ...draft, sessionId: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
                placeholder="Session ID…"
                data-testid="input-diagnostics-session"
              />
            </div>
            <Button onClick={applyFilters} data-testid="button-diagnostics-apply">Apply</Button>
            <Button
              variant="ghost"
              onClick={() => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setExpandedId(null); }}
              data-testid="button-diagnostics-clear"
            >
              Clear
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => exportObservations("csv")} data-testid="button-export-csv">
                <Download className="w-3.5 h-3.5 mr-1.5" />CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportObservations("json")} data-testid="button-export-json">
                <Download className="w-3.5 h-3.5 mr-1.5" />JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <TabSkeleton />
      ) : isError ? (
        <TabError what="recent observations" />
      ) : (
        <Card data-testid="card-diagnostics-table">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent observations ({observations.length})</CardTitle>
            <CardDescription className="text-xs">Click a row for the full observation, including metadata.</CardDescription>
          </CardHeader>
          <CardContent>
            {observations.length === 0 ? (
              <EmptyNote>No observations match these filters.</EmptyNote>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Capability : verb</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Session</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observations.map((o) => (
                      <Fragment key={o.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                          data-testid={`row-observation-${o.id}`}
                        >
                          <TableCell className="text-xs whitespace-nowrap">{fmtDate(o.observedAt)}</TableCell>
                          <TableCell><Badge variant="outline">{o.kind}</Badge></TableCell>
                          <TableCell><SeverityBadge severity={o.severity} /></TableCell>
                          <TableCell className="text-xs">
                            {o.capability ? `${o.capability}${o.verb ? ` : ${o.verb}` : ""}` : DASH}
                          </TableCell>
                          <TableCell className="text-xs">{o.outcome ?? DASH}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtConf(o.confidence)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtMs(o.durationMs)}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[10rem] truncate" title={o.sessionId ?? undefined}>
                            {o.sessionId ?? DASH}
                          </TableCell>
                        </TableRow>
                        {expandedId === o.id && (
                          <TableRow data-testid={`row-observation-detail-${o.id}`}>
                            <TableCell colSpan={8}>
                              <div className="space-y-2 py-1">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                                  <DetailField label="ID" value={o.id} mono />
                                  <DetailField label="Observed" value={fmtDate(o.observedAt)} />
                                  <DetailField label="User" value={o.userId != null ? String(o.userId) : DASH} mono />
                                  <DetailField label="Session" value={o.sessionId ?? DASH} mono />
                                  <DetailField label="Surface" value={o.surface ?? DASH} />
                                  <DetailField label="Intent" value={o.intent ?? DASH} />
                                  <DetailField label="Context view" value={o.contextView ?? DASH} />
                                  <DetailField label="Recovery path" value={o.recoveryPath ?? DASH} />
                                </div>
                                {o.sessionId && (
                                  <Button
                                    size="sm" variant="outline"
                                    onClick={(e) => { e.stopPropagation(); correlateSession(o.sessionId!); }}
                                    data-testid={`button-correlate-${o.id}`}
                                  >
                                    <Link2 className="w-3.5 h-3.5 mr-1.5" />Correlate session
                                  </Button>
                                )}
                                <div>
                                  <p className="text-xs font-medium mb-1">Metadata</p>
                                  <pre className="text-xs overflow-x-auto rounded-md bg-muted p-2">
                                    {o.metadata == null ? DASH : JSON.stringify(o.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="min-w-0">
      <span className="text-muted-foreground">{label}: </span>
      <span className={mono ? "font-mono break-all" : undefined}>{value}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// The Observation Workbench page
// ---------------------------------------------------------------------------
export default function AdminObservationWorkbenchPage() {
  const { user, isLoading } = useUser();
  const [days, setDays] = useState(7);

  if (isLoading) return null;
  if (!user || (user as any)?.role !== "admin") return <NotFound />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="heading-observation-workbench">
            Observation Workbench
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Canonical runtime telemetry for the Intelligence Platform (OBS1)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Window</span>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32" data-testid="select-observation-window">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 1 day</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview" data-testid="tab-obs-overview">Overview</TabsTrigger>
          <TabsTrigger value="capabilities" data-testid="tab-obs-capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="intents" data-testid="tab-obs-intents">Intents</TabsTrigger>
          <TabsTrigger value="context" data-testid="tab-obs-context">Context</TabsTrigger>
          <TabsTrigger value="companion" data-testid="tab-obs-companion">Companion</TabsTrigger>
          <TabsTrigger value="knowledge" data-testid="tab-obs-knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="planner" data-testid="tab-obs-planner">Planner</TabsTrigger>
          <TabsTrigger value="benchmarks" data-testid="tab-obs-benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="diagnostics" data-testid="tab-obs-diagnostics">Diagnostics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab days={days} /></TabsContent>
        <TabsContent value="capabilities" className="mt-4"><CapabilitiesTab days={days} /></TabsContent>
        <TabsContent value="intents" className="mt-4"><IntentsTab days={days} /></TabsContent>
        <TabsContent value="context" className="mt-4"><ContextTab days={days} /></TabsContent>
        <TabsContent value="companion" className="mt-4"><CompanionTab days={days} /></TabsContent>
        <TabsContent value="knowledge" className="mt-4"><KnowledgeTab days={days} /></TabsContent>
        <TabsContent value="planner" className="mt-4"><PlannerTab days={days} /></TabsContent>
        <TabsContent value="benchmarks" className="mt-4"><BenchmarksTab /></TabsContent>
        <TabsContent value="diagnostics" className="mt-4"><DiagnosticsTab days={days} /></TabsContent>
      </Tabs>
    </div>
  );
}
