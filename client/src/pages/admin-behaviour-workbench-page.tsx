/**
 * admin-behaviour-workbench-page.tsx — OBS2 Execution Timeline
 *                                     · BEH1 Behaviour view
 * ====================================================================
 * The Behaviour Admin Workbench, in two read-only views over the same
 * Observation Engine store:
 *
 *  · Behaviour (BEH1) — what the Companion's voice decided across a window:
 *    the active behaviour selected, the personality applied (live from the one
 *    Personality Registry), behaviour outcome, provenance confidence,
 *    effectiveness, overrides, and analytics.
 *  · Execution Timeline (OBS2) — the complete execution path of one
 *    interaction, including that turn's sealed behaviour decision and the
 *    engine's own reasoning for it.
 *
 * The Behaviour Engine owns no telemetry and no timeline data; every number
 * here is an Observation Engine projection computed on read, and every voice
 * definition is read live from the registry rather than copied. Nothing on
 * this page writes, and nothing the platform does reads it back.
 *
 * The page renders whatever the server reports; nulls render as "—", never a
 * fabricated value, and the user's request text is honestly shown as "not
 * recorded" (the Observation Engine's privacy rule — shapes and timings,
 * never utterance content).
 */

import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import NotFound from "./not-found";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowLeft, Download, ShieldQuestion } from "lucide-react";

// Status palette — mirrors the Observation Workbench. Colour is always paired
// with a label, never the sole carrier of meaning.
const C_GOOD = "#16a34a";    // green-600
const C_BAD = "#dc2626";     // red-600
const C_WARN = "#f59e0b";    // amber-500
const C_NEUTRAL = "#3b82f6"; // blue-500

// ---------------------------------------------------------------------------
// API response shapes (client-side mirrors; every field treated as optional so
// an empty window or an older server never crashes the page).
// ---------------------------------------------------------------------------
interface TimelineEvent {
  id: number; observedAt: string; kind: string; stage: string; severity: string;
  outcome?: string | null; capability?: string | null; verb?: string | null;
  intent?: string | null; confidence?: number | null; durationMs?: number | null;
  sincePreviousMs?: number | null; recoveryPath?: string | null; surface?: string | null;
  userId?: number | null; sessionId?: string | null; metadata?: unknown;
}

interface TimelineBehaviourDecision {
  personalityId?: string | null; personalityName?: string | null;
  requestedPersonality?: string | null;
  overrideApplied?: boolean; overrideReason?: string | null;
  confidence?: number | null; confidenceBasis?: string | null;
  outcome?: string | null; surfaces?: string[]; reasoning?: string[];
  fallbackState?: string | null; guidanceCount?: number | null;
  notVoicedReason?: string | null;
}

interface TimelineTurn {
  turnId?: string | null;
  correlation?: "exact" | "reconstructed";
  startedAt?: string; endedAt?: string;
  wallClockMs?: number | null; stageDurationTotalMs?: number | null;
  intent?: string | null; intentOutcome?: string | null; intentConfidence?: number | null;
  capabilities?: { capability: string; verb?: string | null; outcome?: string | null; durationMs?: number | null }[];
  contextViews?: string[]; knowledgeSources?: string[];
  /** NCV1 — false for turns recorded before the rollout, which classified no view. */
  contextViewsClassified?: boolean;
  nativeContextViews?: string[]; genericContextViews?: string[];
  behaviour?: string | null;
  behaviourDecision?: TimelineBehaviourDecision | null;
  responseGeneration?: { outcome?: string | null; durationMs?: number | null; model?: string | null } | null;
  clarifications?: { outcome?: string | null; hasPrompt?: boolean }[];
  recoveries?: { outcome?: string | null; recoveryPath?: string | null }[];
  escalations?: { outcome?: string | null; recoveryPath?: string | null }[];
  feedback?: { rating?: string | null; reasonCode?: string | null; observedAt?: string }[];
  attention?: boolean;
  events?: TimelineEvent[];
}

interface ExecutionTimelineResponse {
  sessionId?: string; startedAt?: string | null; endedAt?: string | null;
  turnCount?: number; userIds?: number[]; privacyNote?: string;
  turns?: TimelineTurn[]; unassigned?: TimelineEvent[];
}

interface TimelineSession {
  sessionId: string; firstObservedAt: string; lastObservedAt: string;
  observationCount: number; turnCount: number; userIds?: number[];
  surfaces?: string[]; capabilities?: string[]; intents?: string[];
  errorCount?: number; clarificationCount?: number; recoveryCount?: number;
  escalationCount?: number; feedbackUp?: number; feedbackDown?: number;
  attention?: boolean;
}
interface SessionsResponse { windowDays?: number; sessions?: TimelineSession[] }

// BEH1 — the behaviour view: telemetry (Observation Engine) + registry (Behaviour Engine).
interface BehaviourPersonalitySummary {
  personalityId: string;
  decisions: number; voiced: number; voicedFallback: number; voicedError: number; notVoiced: number;
  overrides: number; ratedDecisions: number; helpful: number; notHelpful: number;
  effectiveness?: number | null;
}

interface BehaviourTelemetry {
  windowDays?: number;
  decisions?: number;
  averageConfidence?: number | null;
  overrideRate?: number | null;
  byPersonality?: BehaviourPersonalitySummary[];
  byOutcome?: { outcome: string; count: number }[];
  bySurface?: { surface: string; count: number }[];
  overrides?: {
    total?: number;
    byReason?: { reason: string; count: number }[];
    recent?: { observedAt: string; requestedPersonality?: string | null; appliedPersonalityId?: string | null; reason?: string | null }[];
    recentLimit?: number;
  };
  effectiveness?: {
    ratedDecisions?: number; helpful?: number; notHelpful?: number;
    rate?: number | null; unattributedFeedback?: number; note?: string;
  };
  byDay?: { day: string; decisions: number; overrides: number }[];
  correlationNote?: string;
}

interface PersonalityDescription {
  id: string; displayName: string; description: string; isDefault?: boolean;
  behaviour?: Record<string, number>;
  priorities?: string[];
  guidanceLabelPrefix?: string;
  systemPromptFragment?: string;
}

interface BehaviourResponse { telemetry?: BehaviourTelemetry; registry?: PersonalityDescription[] }

// ---------------------------------------------------------------------------
// Formatting helpers — null/undefined always render as "—", never 0.
// ---------------------------------------------------------------------------
const DASH = "—";
function fmtMs(v: number | null | undefined): string {
  if (v === null || v === undefined) return DASH;
  return v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`;
}
function fmtConf(v: number | null | undefined): string {
  return v === null || v === undefined ? DASH : v.toFixed(2);
}
/** A rate is either a real percentage or an honest "—". Never a fabricated 0%. */
function fmtRate(v: number | null | undefined): string {
  return v === null || v === undefined ? DASH : `${(v * 100).toFixed(0)}%`;
}
function fmtCount(v: number | null | undefined): string {
  return v === null || v === undefined ? DASH : String(v);
}
/** Human labels for the closed behaviour-outcome vocabulary. */
const OUTCOME_LABELS: Record<string, string> = {
  "voiced": "Voiced",
  "voiced-fallback": "Voiced (honest gap)",
  "voiced-error": "Voiced (internal error)",
  "not-voiced": "Not voiced",
};

/** A voiced honest gap is a healthy outcome, so it is not coloured as a problem. */
function outcomeColor(outcome: string): { color: string } | undefined {
  if (outcome === "voiced") return { color: C_GOOD };
  if (outcome === "voiced-error") return { color: C_BAD };
  if (outcome === "not-voiced") return { color: C_WARN };
  return undefined;
}
function fmtDate(x: string | null | undefined): string {
  if (!x) return DASH;
  try { return new Date(x).toLocaleString(); } catch { return String(x); }
}
function fmtList(xs: string[] | undefined): string {
  return xs && xs.length > 0 ? xs.join(", ") : DASH;
}

/**
 * NCV1 — the Context Views this turn composed, and who shaped each one.
 *
 * A **native** view was declared by the capability that owns the payload; a
 * **generic** view was derived by the engine from the payload's structure. A turn
 * recorded before NCV1 classified neither, and says so — it is never displayed as
 * if every view had been generic, which is the same honesty rule OBS2 applies to a
 * pre-BEH1 turn's behaviour decision.
 */
function ContextViewsComposed({ turn }: { turn: TimelineTurn }): JSX.Element {
  const views = turn.contextViews ?? [];
  if (views.length === 0) return <>{DASH}</>;

  if (turn.contextViewsClassified !== true) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        {views.map((v) => <Badge key={v} variant="outline">{v}</Badge>)}
        <span className="text-xs text-muted-foreground">· native/generic not recorded (pre-NCV1)</span>
      </span>
    );
  }

  const native = new Set(turn.nativeContextViews ?? []);
  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-testid="turn-context-views">
      {views.map((v) => (
        <Badge key={v} variant={native.has(v) ? "secondary" : "outline"} data-testid={`context-view-${v}`}>
          {v}
          <span className="ml-1 text-[10px] uppercase tracking-wide opacity-70">
            {native.has(v) ? "native" : "generic"}
          </span>
        </Badge>
      ))}
    </span>
  );
}

function severityColor(e: TimelineEvent): string {
  if (e.severity === "error") return C_BAD;
  if (e.severity === "warning" || e.kind === "clarification" || e.kind === "recovery" || e.kind === "escalation") return C_WARN;
  if (e.kind === "user-feedback") return e.outcome === "down" ? C_BAD : C_GOOD;
  return C_NEUTRAL;
}

// ---------------------------------------------------------------------------
// Shared presentation atoms
// ---------------------------------------------------------------------------
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

function PageSkeleton() {
  return (
    <div className="space-y-4" data-testid="timeline-skeleton">
      <div className="h-24 bg-muted animate-pulse rounded-lg" />
      <div className="h-56 bg-muted animate-pulse rounded-lg" />
      <div className="h-40 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

function LoadError({ what }: { what: string }) {
  return (
    <Card data-testid="card-timeline-error">
      <CardContent className="flex items-start gap-3 py-5">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Could not load {what}</p>
          <p className="text-xs text-muted-foreground mt-1">
            The timeline endpoint did not respond. It may not be deployed yet, or your admin session may have expired.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-2">{children}</p>;
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="min-w-0">
      <span className="text-muted-foreground">{label}: </span>
      <span className={mono ? "font-mono break-all" : undefined}>{value}</span>
    </p>
  );
}

/** One "label: value" cell of a turn's summary grid. */
function TurnField({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="min-w-0" data-testid={testId}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm mt-0.5 break-words">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The event flow — chronological, click-to-reveal, stage gaps shown.
// ---------------------------------------------------------------------------
function EventFlow({ events, turnKey }: { events: TimelineEvent[]; turnKey: string }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  if (events.length === 0) return <EmptyNote>No events recorded for this turn.</EmptyNote>;

  return (
    <ol className="relative border-l border-border ml-1.5 space-y-0.5" data-testid={`event-flow-${turnKey}`}>
      {events.map((e) => {
        const color = severityColor(e);
        const expanded = expandedId === e.id;
        return (
          <li key={e.id} className="ml-4 relative">
            <span
              className="absolute -left-[1.32rem] top-2 w-2.5 h-2.5 rounded-full border-2 border-background"
              style={{ background: color }}
              aria-hidden
            />
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : e.id)}
              className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/60 transition-colors"
              data-testid={`event-${e.id}`}
            >
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium">{e.stage}</span>
                <Badge variant="outline" className="text-[10px]">{e.kind}</Badge>
                {e.severity !== "info" && <SeverityBadge severity={e.severity} />}
                {e.outcome && e.outcome !== "ok" && (
                  <span className="text-xs" style={{ color: e.severity === "error" ? C_BAD : C_WARN }}>{e.outcome}</span>
                )}
                {e.capability && (
                  <span className="text-xs text-muted-foreground">
                    {e.capability}{e.verb ? ` : ${e.verb}` : ""}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                  {e.sincePreviousMs != null && e.sincePreviousMs > 0 && <span>+{fmtMs(e.sincePreviousMs)}</span>}
                  {e.durationMs != null && <span className="font-medium text-foreground">{fmtMs(e.durationMs)}</span>}
                </span>
              </span>
            </button>
            {expanded && (
              <div className="mx-2 mb-2 mt-1 rounded-md border p-3 space-y-2" data-testid={`event-detail-${e.id}`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                  <DetailField label="Observation" value={String(e.id)} mono />
                  <DetailField label="Observed" value={fmtDate(e.observedAt)} />
                  <DetailField label="Severity" value={e.severity} />
                  <DetailField label="Outcome" value={e.outcome ?? DASH} />
                  <DetailField label="Capability" value={e.capability ?? DASH} />
                  <DetailField label="Verb" value={e.verb ?? DASH} />
                  <DetailField label="Intent" value={e.intent ?? DASH} />
                  <DetailField label="Confidence" value={fmtConf(e.confidence)} />
                  <DetailField label="Duration" value={fmtMs(e.durationMs)} />
                  <DetailField label="Since previous" value={fmtMs(e.sincePreviousMs)} />
                  <DetailField label="Recovery path" value={e.recoveryPath ?? DASH} />
                  <DetailField label="Surface" value={e.surface ?? DASH} />
                  <DetailField label="User" value={e.userId != null ? String(e.userId) : DASH} mono />
                  <DetailField label="Session" value={e.sessionId ?? DASH} mono />
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Metadata</p>
                  <pre className="text-xs overflow-x-auto rounded-md bg-muted p-2">
                    {e.metadata == null ? DASH : JSON.stringify(e.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// BEH1 — the sealed behaviour decision for one turn, with the engine's own
// reasoning. Absent for turns recorded before BEH1: stated, never reconstructed.
// ---------------------------------------------------------------------------
function BehaviourDecisionPanel({ decision, turnKey }: { decision: TimelineBehaviourDecision | null | undefined; turnKey: string }) {
  if (!decision) {
    return (
      <div className="rounded-md border border-dashed p-3" data-testid={`turn-${turnKey}-behaviour-absent`}>
        <p className="text-xs font-medium mb-1">Behaviour decision</p>
        <p className="text-xs text-muted-foreground">
          Not recorded — this turn predates the Behaviour Engine's decision capture (BEH1). Shown as absent rather than reconstructed.
        </p>
      </div>
    );
  }

  const notVoiced = decision.outcome === "not-voiced";
  return (
    <div className="rounded-md border p-3 space-y-2" data-testid={`turn-${turnKey}-behaviour-decision`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium">Behaviour decision</p>
        <Badge variant="outline" className="text-[10px]" style={notVoiced ? { color: C_WARN } : undefined}>
          {OUTCOME_LABELS[decision.outcome ?? ""] ?? decision.outcome ?? DASH}
        </Badge>
        {decision.overrideApplied && (
          <Badge
            variant="outline"
            className="text-[10px]"
            style={{ color: C_WARN }}
            title="The applied voice is not the one requested — the engine's fail-safe default fired."
          >
            override: {decision.overrideReason ?? "unknown"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
        <DetailField label="Personality applied" value={decision.personalityName ?? decision.personalityId ?? DASH} />
        <DetailField label="Requested" value={decision.requestedPersonality ?? "none stored"} />
        <DetailField label="Confidence" value={fmtConf(decision.confidence)} />
        <DetailField label="Confidence basis" value={decision.confidenceBasis ?? DASH} />
        <DetailField label="Surfaces applied" value={(decision.surfaces ?? []).join(", ") || "none"} />
        <DetailField label="Gap voiced" value={decision.fallbackState ?? DASH} />
        <DetailField label="Suggestions voiced" value={fmtCount(decision.guidanceCount)} />
        <DetailField label="Not-voiced reason" value={decision.notVoicedReason ?? DASH} />
      </div>

      <div>
        <p className="text-xs font-medium mb-1">Behaviour reasoning</p>
        {(decision.reasoning ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Not recorded.</p>
        ) : (
          <ul className="list-disc pl-4 space-y-1" data-testid={`turn-${turnKey}-behaviour-reasoning`}>
            {(decision.reasoning ?? []).map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground">{r}</li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        The Behaviour Engine changes how an already-true, already-selected fact is said — never what is true, permitted, selected, or confirmed.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One turn card — the reconstructed execution path of a conversation turn.
// ---------------------------------------------------------------------------
function TurnCard({ turn, index }: { turn: TimelineTurn; index: number }) {
  const turnKey = turn.turnId ?? `r${index}`;
  const failed =
    turn.attention === true ||
    (turn.recoveries ?? []).length > 0 ||
    (turn.escalations ?? []).length > 0;
  const outcomeBadge = turn.responseGeneration?.outcome === "ok"
    ? <Badge variant="outline" className="border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">answered</Badge>
    : (turn.recoveries ?? []).length > 0
      ? <Badge variant="outline" className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">recovered</Badge>
      : (turn.escalations ?? []).length > 0
        ? <Badge variant="outline" className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">escalated</Badge>
        : null;

  const feedback = turn.feedback ?? [];

  return (
    <Card
      className={failed ? "border-l-4 border-l-amber-500" : undefined}
      data-testid={`card-turn-${turnKey}`}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-sm">Turn {index + 1}</CardTitle>
          <span className="text-xs text-muted-foreground">{fmtDate(turn.startedAt)}</span>
          {outcomeBadge}
          {turn.attention && <SeverityBadge severity="warning" />}
          {turn.correlation === "reconstructed" && (
            <Badge variant="outline" className="text-[10px]" title="Recorded before per-turn correlation existed — grouped by stage boundaries, not an exact turn id.">
              reconstructed
            </Badge>
          )}
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            total {fmtMs(turn.wallClockMs)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
          <TurnField label="User request" testId={`turn-${turnKey}-request`}>
            <span className="inline-flex items-center gap-1 text-muted-foreground" title="The Observation Engine records shapes, timings and outcomes — never utterance content alongside a user id.">
              <ShieldQuestion className="w-3.5 h-3.5" />not recorded (privacy)
            </span>
          </TurnField>
          <TurnField label="Intent identified" testId={`turn-${turnKey}-intent`}>
            {turn.intent ?? DASH}
            {turn.intentOutcome && turn.intentOutcome !== "resolved" && (
              <span className="ml-1 text-xs" style={{ color: C_WARN }}>({turn.intentOutcome})</span>
            )}
          </TurnField>
          <TurnField label="Intent confidence">{fmtConf(turn.intentConfidence)}</TurnField>
          <TurnField label="Capability selected" testId={`turn-${turnKey}-capabilities`}>
            {(turn.capabilities ?? []).length === 0 ? DASH : (
              <span className="flex flex-wrap gap-1">
                {(turn.capabilities ?? []).map((c, i) => (
                  <Badge key={`${c.capability}-${i}`} variant="outline"
                         style={c.outcome && c.outcome !== "ok" && c.outcome !== "confirmation_required" ? { color: C_WARN } : undefined}>
                    {c.capability}{c.verb ? ` : ${c.verb}` : ""}
                  </Badge>
                ))}
              </span>
            )}
          </TurnField>
          <TurnField label="Context views composed"><ContextViewsComposed turn={turn} /></TurnField>
          <TurnField label="Knowledge sources consulted">{fmtList(turn.knowledgeSources)}</TurnField>
          <TurnField label="Behaviour selected" testId={`turn-${turnKey}-behaviour`}>
            {turn.behaviourDecision?.personalityName ?? turn.behaviour ?? DASH}
          </TurnField>
          <TurnField label="Response generated">
            {turn.responseGeneration
              ? `${turn.responseGeneration.outcome ?? DASH}${turn.responseGeneration.model ? ` · ${turn.responseGeneration.model}` : ""} · ${fmtMs(turn.responseGeneration.durationMs)}`
              : DASH}
          </TurnField>
          <TurnField label="User feedback" testId={`turn-${turnKey}-feedback`}>
            {feedback.length === 0 ? DASH : feedback.map((f, i) => (
              <span key={i} className="mr-2" style={{ color: f.rating === "down" ? C_BAD : C_GOOD }}>
                {f.rating === "down" ? "not helpful" : "helpful"}{f.reasonCode ? ` (${f.reasonCode})` : ""}
              </span>
            ))}
          </TurnField>
          <TurnField label="Clarifications requested">
            {(turn.clarifications ?? []).length === 0 ? DASH
              : (turn.clarifications ?? []).map((c, i) => <span key={i} style={{ color: C_WARN }}>{c.outcome ?? "clarification"}</span>)}
          </TurnField>
          <TurnField label="Recovery actions">
            {(turn.recoveries ?? []).length === 0 ? DASH
              : (turn.recoveries ?? []).map((r, i) => (
                  <span key={i} className="mr-2" style={{ color: C_WARN }}>
                    {r.outcome ?? "recovery"}{r.recoveryPath ? ` → ${r.recoveryPath}` : ""}
                  </span>
                ))}
          </TurnField>
          <TurnField label="Escalations">
            {(turn.escalations ?? []).length === 0 ? DASH
              : (turn.escalations ?? []).map((e, i) => (
                  <span key={i} className="mr-2" style={{ color: C_WARN }}>
                    {e.outcome ?? "escalation"}{e.recoveryPath ? ` → ${e.recoveryPath}` : ""}
                  </span>
                ))}
          </TurnField>
          <TurnField label="Total execution time">
            {fmtMs(turn.wallClockMs)}
            {turn.stageDurationTotalMs != null && (
              <span className="text-xs text-muted-foreground"> ({fmtMs(turn.stageDurationTotalMs)} measured in stages)</span>
            )}
          </TurnField>
        </div>

        <BehaviourDecisionPanel decision={turn.behaviourDecision} turnKey={turnKey} />

        <div>
          <p className="text-xs font-medium mb-2">Execution flow — click any event for the underlying observation</p>
          <EventFlow events={turn.events ?? []} turnKey={turnKey} />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// The timeline view for one selected session.
// ---------------------------------------------------------------------------
function SessionTimeline({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const { toast } = useToast();
  const { data, isPending, isError } = useQuery<ExecutionTimelineResponse>({
    queryKey: [`/api/intelligence/observation/timeline/session/${sessionId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/intelligence/observation/timeline/session/${encodeURIComponent(sessionId)}`);
      return res.json();
    },
  });

  const exportTimeline = (format: "csv" | "json") => {
    const opened = window.open(
      `/api/intelligence/observation/timeline/session/${encodeURIComponent(sessionId)}/export?format=${format}`,
      "_blank",
    );
    if (!opened) {
      toast({ title: "Export failed", description: "The browser blocked the export window.", variant: "destructive" });
    }
  };

  if (isPending) return <PageSkeleton />;
  if (isError) return <LoadError what="the execution timeline" />;
  const t = data ?? {};
  const turns = t.turns ?? [];
  const unassigned = t.unassigned ?? [];

  return (
    <div className="space-y-4">
      <Card data-testid="card-timeline-header">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-timeline-back">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />Sessions
            </Button>
            <div className="min-w-0">
              <p className="text-sm font-medium">Session <span className="font-mono">{t.sessionId ?? sessionId}</span></p>
              <p className="text-xs text-muted-foreground">
                {fmtDate(t.startedAt)} → {fmtDate(t.endedAt)} · {t.turnCount ?? turns.length} turn{(t.turnCount ?? turns.length) === 1 ? "" : "s"}
                {(t.userIds ?? []).length > 0 && <> · user {(t.userIds ?? []).join(", ")}</>}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => exportTimeline("csv")} data-testid="button-timeline-export-csv">
                <Download className="w-3.5 h-3.5 mr-1.5" />CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportTimeline("json")} data-testid="button-timeline-export-json">
                <Download className="w-3.5 h-3.5 mr-1.5" />JSON
              </Button>
            </div>
          </div>
          {t.privacyNote && (
            <p className="text-xs text-muted-foreground mt-3" data-testid="text-timeline-privacy-note">{t.privacyNote}</p>
          )}
        </CardContent>
      </Card>

      {turns.length === 0 ? (
        <Card><CardContent className="py-5"><EmptyNote>No observations recorded for this session (it may have aged out of the retention window).</EmptyNote></CardContent></Card>
      ) : (
        turns.map((turn, i) => <TurnCard key={turn.turnId ?? `r${i}`} turn={turn} index={i} />)
      )}

      {unassigned.length > 0 && (
        <Card data-testid="card-timeline-unassigned">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Unassigned events</CardTitle>
            <CardDescription className="text-xs">
              Session events recorded before per-turn correlation existed (e.g. older feedback) — shown honestly rather than guessed into a turn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventFlow events={unassigned} turnKey="unassigned" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BEH1 — The Behaviour view: what the Companion's voice decided, over a window.
// ---------------------------------------------------------------------------
function StatTile({ label, value, hint, testId }: { label: string; value: string; hint?: string; testId?: string }) {
  return (
    <div className="rounded-md border p-3" data-testid={testId}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums mt-0.5">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

function BehaviourView({ days }: { days: number }) {
  const { data, isPending, isError } = useQuery<BehaviourResponse>({
    queryKey: ["/api/intelligence/observation/behaviour", { days }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/intelligence/observation/behaviour?days=${days}`);
      return res.json();
    },
  });

  if (isPending) return <PageSkeleton />;
  if (isError) return <LoadError what="the behaviour view" />;

  const t = data?.telemetry ?? {};
  const registry = data?.registry ?? [];
  const personalities = t.byPersonality ?? [];
  const overrides = t.overrides ?? {};
  const effectiveness = t.effectiveness ?? {};
  const decisions = t.decisions ?? 0;

  const displayName = (id: string): string => registry.find((p) => p.id === id)?.displayName ?? id;

  return (
    <div className="space-y-4">
      {/* Behaviour analytics — the window at a glance. */}
      <Card data-testid="card-behaviour-analytics">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Behaviour analytics</CardTitle>
          <CardDescription className="text-xs">
            Every behaviour decision the Companion made in the last {t.windowDays ?? days} day
            {(t.windowDays ?? days) === 1 ? "" : "s"}, projected on read from the Observation Engine. Rates are null when
            there is nothing to judge — never a fabricated 0%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Behaviour decisions" value={fmtCount(decisions)} testId="stat-behaviour-decisions" />
            <StatTile
              label="Behaviour confidence"
              value={fmtConf(t.averageConfidence)}
              hint="Voice provenance: the share of decisions applying an explicit stored preference. Not a quality score."
              testId="stat-behaviour-confidence"
            />
            <StatTile
              label="Behaviour effectiveness"
              value={fmtRate(effectiveness.rate)}
              hint={`${fmtCount(effectiveness.ratedDecisions)} rated · ${fmtCount(effectiveness.helpful)} helpful · ${fmtCount(effectiveness.notHelpful)} not helpful`}
              testId="stat-behaviour-effectiveness"
            />
            <StatTile
              label="Behaviour overrides"
              value={fmtCount(overrides.total)}
              hint={`${fmtRate(t.overrideRate)} of decisions applied the fail-safe default voice`}
              testId="stat-behaviour-overrides"
            />
          </div>

          {decisions === 0 ? (
            <EmptyNote>No behaviour decisions recorded in this window.</EmptyNote>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium mb-2">Behaviour outcome</p>
                <div className="space-y-1">
                  {(t.byOutcome ?? []).map((o) => (
                    <div key={o.outcome} className="flex items-center justify-between text-xs" data-testid={`behaviour-outcome-${o.outcome}`}>
                      <span style={outcomeColor(o.outcome)}>{OUTCOME_LABELS[o.outcome] ?? o.outcome}</span>
                      <span className="tabular-nums">{o.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Surfaces the voice touched</p>
                <div className="space-y-1">
                  {(t.bySurface ?? []).length === 0 ? (
                    <EmptyNote>No voice surface was applied in this window.</EmptyNote>
                  ) : (t.bySurface ?? []).map((s) => (
                    <div key={s.surface} className="flex items-center justify-between text-xs">
                      <span className="font-mono">{s.surface}</span>
                      <span className="tabular-nums">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(t.byDay ?? []).length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2">Decisions per day</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead className="text-right">Decisions</TableHead>
                      <TableHead className="text-right">Overrides</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(t.byDay ?? []).map((d) => (
                      <TableRow key={d.day}>
                        <TableCell className="text-xs">{d.day}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.decisions}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.overrides || DASH}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active behaviour selected + outcome + confidence + effectiveness, per voice. */}
      <Card data-testid="card-behaviour-active">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Active behaviour selected</CardTitle>
          <CardDescription className="text-xs">
            The voice actually applied to each interaction, with the outcome it produced and the feedback that followed.
            {effectiveness.note ? ` ${effectiveness.note}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {personalities.length === 0 ? (
            <EmptyNote>No voice has been applied in this window.</EmptyNote>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Behaviour</TableHead>
                    <TableHead className="text-right">Decisions</TableHead>
                    <TableHead className="text-right">Voiced</TableHead>
                    <TableHead className="text-right">Honest gap</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Not voiced</TableHead>
                    <TableHead className="text-right">Overrides</TableHead>
                    <TableHead className="text-right">Rated</TableHead>
                    <TableHead className="text-right">Effectiveness</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personalities.map((p) => (
                    <TableRow key={p.personalityId} data-testid={`row-behaviour-${p.personalityId}`}>
                      <TableCell className="text-sm font-medium">{displayName(p.personalityId)}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.decisions}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.voiced || DASH}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.voicedFallback || DASH}</TableCell>
                      <TableCell className="text-right tabular-nums" style={p.voicedError > 0 ? { color: C_BAD } : undefined}>
                        {p.voicedError || DASH}
                      </TableCell>
                      <TableCell className="text-right tabular-nums" style={p.notVoiced > 0 ? { color: C_WARN } : undefined}>
                        {p.notVoiced || DASH}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.overrides || DASH}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.ratedDecisions || DASH}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.effectiveness === null || p.effectiveness === undefined ? (
                          <span className="text-muted-foreground" title="No feedback on turns this voice phrased — unscored, not zero.">{DASH}</span>
                        ) : (
                          <span style={{ color: p.effectiveness >= 0.5 ? C_GOOD : C_BAD }}>{fmtRate(p.effectiveness)}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {(effectiveness.unattributedFeedback ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground mt-3" data-testid="text-behaviour-unattributed">
              {effectiveness.unattributedFeedback} feedback rating
              {effectiveness.unattributedFeedback === 1 ? "" : "s"} in this window name no recorded behaviour decision.
              Counted here, attributed to no voice.
            </p>
          )}
          {t.correlationNote && <p className="text-[10px] text-muted-foreground mt-2">{t.correlationNote}</p>}
        </CardContent>
      </Card>

      {/* Behaviour overrides. */}
      <Card data-testid="card-behaviour-overrides">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Behaviour overrides</CardTitle>
          <CardDescription className="text-xs">
            An override is the engine's fail-safe default firing: the requested voice could not be resolved, so the platform
            default was applied. The user always hears a voice — never an error.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(overrides.total ?? 0) === 0 ? (
            <EmptyNote>No overrides in this window — every decision applied the voice the user chose.</EmptyNote>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(overrides.byReason ?? []).map((r) => (
                  <Badge key={r.reason} variant="outline" style={{ color: C_WARN }}>
                    {r.reason}: {r.count}
                  </Badge>
                ))}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(overrides.recent ?? []).map((o, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs whitespace-nowrap">{fmtDate(o.observedAt)}</TableCell>
                        <TableCell className="text-xs font-mono">{o.requestedPersonality ?? "none stored"}</TableCell>
                        <TableCell className="text-xs">{displayName(o.appliedPersonalityId ?? "")}</TableCell>
                        <TableCell className="text-xs">{o.reason ?? DASH}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {(overrides.total ?? 0) > (overrides.recent ?? []).length && (
                <p className="text-xs text-muted-foreground">
                  Showing the {overrides.recentLimit ?? (overrides.recent ?? []).length} most recent of {overrides.total} overrides.
                  The counts above are complete.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personality applied — read live from the one Personality Registry. */}
      <Card data-testid="card-behaviour-registry">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Personality applied</CardTitle>
          <CardDescription className="text-xs">
            The closed set of voices, read live from the one Personality Registry — not a copy captured at record time.
            A behaviour profile dimension picks words; no dimension is read by any business-logic path, confirmation check,
            or capability gate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {registry.length === 0 ? (
            <EmptyNote>The personality registry did not load.</EmptyNote>
          ) : registry.map((p) => {
            const used = personalities.find((x) => x.personalityId === p.id);
            return (
              <div key={p.id} className="rounded-md border p-3 space-y-2" data-testid={`card-personality-${p.id}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{p.displayName}</p>
                  {p.isDefault && <Badge variant="secondary" className="text-[10px]">platform default</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {used ? `${used.decisions} decision${used.decisions === 1 ? "" : "s"} this window` : "not applied this window"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(p.behaviour ?? {}).map(([dim, value]) => (
                    <Badge key={dim} variant="outline" className="text-[10px] font-normal">
                      {dim} {value}
                    </Badge>
                  ))}
                </div>
                <div className="grid gap-1 text-xs sm:grid-cols-2">
                  <DetailField label="Priorities" value={(p.priorities ?? []).join(", ") || DASH} />
                  <DetailField label="Guidance label prefix" value={p.guidanceLabelPrefix ? `"${p.guidanceLabelPrefix}"` : "none"} />
                </div>
                <p className="text-xs text-muted-foreground italic">{p.systemPromptFragment}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The session picker — filters + list.
// ---------------------------------------------------------------------------
interface SessionFilters { userId: string; capability: string; intent: string; sessionId: string }
const EMPTY_FILTERS: SessionFilters = { userId: "", capability: "", intent: "", sessionId: "" };

function SessionPicker({ days, onSelect }: { days: number; onSelect: (sessionId: string) => void }) {
  const [draft, setDraft] = useState<SessionFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<SessionFilters>(EMPTY_FILTERS);

  const { data, isPending, isError } = useQuery<SessionsResponse>({
    queryKey: ["/api/intelligence/observation/timeline/sessions", { days, ...applied }],
    queryFn: async () => {
      const params = new URLSearchParams({ days: String(days) });
      if (applied.userId) params.set("userId", applied.userId);
      if (applied.capability) params.set("capability", applied.capability);
      if (applied.intent) params.set("intent", applied.intent);
      if (applied.sessionId) params.set("sessionId", applied.sessionId);
      const res = await apiRequest("GET", `/api/intelligence/observation/timeline/sessions?${params}`);
      return res.json();
    },
  });

  const sessions = data?.sessions ?? [];
  const applyFilters = () => setApplied(draft);

  const filterInput = (
    key: keyof SessionFilters,
    label: string,
    placeholder: string,
    width = "w-full sm:w-44",
  ) => (
    <div className={width}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <Input
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
        placeholder={placeholder}
        data-testid={`input-timeline-${key}`}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card data-testid="card-timeline-filters">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Find an interaction</CardTitle>
          <CardDescription className="text-xs">
            Filters apply server-side over the selected window; the date filter is the window selector above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-2">
            {filterInput("userId", "User ID", "e.g. 7", "w-full sm:w-28")}
            {filterInput("capability", "Capability", "e.g. planner")}
            {filterInput("intent", "Intent", "e.g. planner:read")}
            {filterInput("sessionId", "Session ID", "Thread id…")}
            <Button onClick={applyFilters} data-testid="button-timeline-apply">Apply</Button>
            <Button
              variant="ghost"
              onClick={() => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); }}
              data-testid="button-timeline-clear"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <PageSkeleton />
      ) : isError ? (
        <LoadError what="timeline sessions" />
      ) : (
        <Card data-testid="card-timeline-sessions">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sessions ({sessions.length})</CardTitle>
            <CardDescription className="text-xs">Click a session to reconstruct its execution timeline.</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <EmptyNote>No sessions match these filters in this window.</EmptyNote>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Last activity</TableHead>
                      <TableHead className="text-right">Turns</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Capabilities</TableHead>
                      <TableHead>Signals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow
                        key={s.sessionId}
                        className="cursor-pointer"
                        onClick={() => onSelect(s.sessionId)}
                        data-testid={`row-timeline-session-${s.sessionId}`}
                      >
                        <TableCell className="font-mono text-xs max-w-[8rem] truncate" title={s.sessionId}>{s.sessionId}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{fmtDate(s.lastObservedAt)}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.turnCount}</TableCell>
                        <TableCell className="text-xs">{(s.userIds ?? []).join(", ") || DASH}</TableCell>
                        <TableCell className="max-w-[16rem]">
                          <span className="flex flex-wrap gap-1">
                            {(s.capabilities ?? []).slice(0, 4).map((c) => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                            {(s.capabilities ?? []).length > 4 && (
                              <span className="text-xs text-muted-foreground">+{(s.capabilities ?? []).length - 4}</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex flex-wrap gap-1 text-xs">
                            {(s.errorCount ?? 0) > 0 && <Badge variant="destructive">{s.errorCount} error{s.errorCount === 1 ? "" : "s"}</Badge>}
                            {(s.recoveryCount ?? 0) > 0 && <Badge variant="outline" style={{ color: C_WARN }}>{s.recoveryCount} recovery</Badge>}
                            {(s.clarificationCount ?? 0) > 0 && <Badge variant="outline" style={{ color: C_WARN }}>{s.clarificationCount} clarification</Badge>}
                            {(s.escalationCount ?? 0) > 0 && <Badge variant="outline" style={{ color: C_WARN }}>{s.escalationCount} escalation</Badge>}
                            {(s.feedbackDown ?? 0) > 0 && <Badge variant="outline" style={{ color: C_BAD }}>{s.feedbackDown} 👎</Badge>}
                            {(s.feedbackUp ?? 0) > 0 && <Badge variant="outline" style={{ color: C_GOOD }}>{s.feedbackUp} 👍</Badge>}
                            {!s.attention && <span className="text-muted-foreground">clean</span>}
                          </span>
                        </TableCell>
                      </TableRow>
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

// ---------------------------------------------------------------------------
// The Behaviour Workbench page
// ---------------------------------------------------------------------------
export default function AdminBehaviourWorkbenchPage() {
  const { user, isLoading } = useUser();
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState<"behaviour" | "timeline">("behaviour");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  if (isLoading) return null;
  if (!user || (user as any)?.role !== "admin") return <NotFound />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="heading-behaviour-workbench">
            Behaviour Workbench
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            The Companion's decision layer — which voice spoke, why, and what followed. Read-only from the Observation
            Engine; the Behaviour Engine owns the decision, never the telemetry.
          </p>
        </div>
        {!selectedSession && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Window</span>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-32" data-testid="select-timeline-window">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 day</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedSession ? (
        <SessionTimeline sessionId={selectedSession} onBack={() => setSelectedSession(null)} />
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as "behaviour" | "timeline")}>
          <TabsList data-testid="tabs-behaviour-workbench">
            <TabsTrigger value="behaviour" data-testid="tab-behaviour">Behaviour</TabsTrigger>
            <TabsTrigger value="timeline" data-testid="tab-timeline">Execution Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="behaviour" className="mt-4">
            <BehaviourView days={days} />
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <SessionPicker days={days} onSelect={setSelectedSession} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
