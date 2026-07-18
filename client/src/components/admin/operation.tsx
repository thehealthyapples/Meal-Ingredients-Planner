import { useState, useCallback, type ReactNode } from "react";
import { Link } from "wouter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert, ShieldCheck, FlaskConical, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Loader2, ListChecks, type LucideIcon,
} from "lucide-react";

/**
 * OPS1 — the canonical Operation experience (ADMIN2 Part 6, "the Operation Card").
 *
 * ONE reusable owner for every privileged admin action — Publish, Verify, Run Benchmark,
 * Learning Snapshot, Rollback. It does not redesign any tool; a tool keeps its own trigger
 * and its own API/mutation. This component owns only the shared LIFECYCLE and presentation:
 *
 *   Purpose → Readiness → Confirm → Progress → Completion summary → Recommended next step
 *
 * Design laws it enforces (so no tool can quietly skip them):
 *  - Confirmation is proportional to consequence — a `canonical` operation gets the full
 *    confirm gate (the guidance IS the gate, ADMIN2 §3.4); a `read-only` re-verify gets a
 *    light one. Colour is spent only on real consequence (THA_UI_ARCHITECTURE.md §14).
 *  - Honest unknowns over fabricated progress (ADMIN2 §4.3): the running state is a calm
 *    indeterminate presentation with the honest expected duration. It advances through named
 *    phases ONLY when the caller reports a real, client-observable step (`ctx.setPhase`) —
 *    it NEVER animates a fake bar or a timed checklist.
 *  - UNKNOWN ≠ green (ADMIN2 §4.2): a failed operation reads the calm three-tier error, never
 *    the last green; the completion summary is rendered from the real result only.
 *  - It reuses the tool's existing API/logic via `spec.run` — no new endpoint, no duplicated
 *    behaviour.
 */

export type OperationImpactLevel = "read-only" | "reversible" | "canonical";

export interface OperationGuidanceItem {
  q: string;
  a: string;
}

export type OperationReadinessState = "ready" | "blocked" | "info";

export interface OperationReadinessSignal {
  label: string;
  state: OperationReadinessState;
  detail?: string;
}

export interface OperationCompletion {
  tone: "good" | "warning";
  headline: string;
  lines?: string[];
}

export interface OperationNextStep {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface OperationRunContext {
  /** Advance the visible phase — call ONLY on a real, client-observable step boundary. */
  setPhase: (index: number) => void;
}

export interface OperationSpec<TResult> {
  id: string;
  title: string;
  /** One honest, plain sentence — the Purpose beat. */
  purpose: string;
  /** Consequence classification — drives confirm weight and colour. */
  impact: { level: OperationImpactLevel; line: string };
  /** The guidance questions (ADMIN2 §3.3). Shown collapsed; expands into the confirm gate. */
  guidance?: OperationGuidanceItem[];
  /** Readiness signals shown before confirm. Any `blocked` signal disables the action. */
  readiness?: OperationReadinessSignal[];
  /** The confirm button label. Defaults to the title. */
  confirmLabel?: string;
  /** Honest expected-duration text (no fabricated countdown). */
  expectedDuration?: string;
  /** Named phases the operation moves through — shown as "what happens", advanced only by real steps. */
  phases?: string[];
  /** Reuses the tool's EXISTING api/mutation. Receives a context to report real phase steps. */
  run: (ctx: OperationRunContext) => Promise<TResult>;
  /** Renders the completion summary from the REAL result. */
  summarise: (result: TResult) => OperationCompletion;
  /** The one recommended next step (never demanded). */
  nextStep?: (result: TResult) => OperationNextStep | null;
  /** Page-owned side effects on success (e.g. invalidate its queries). */
  onComplete?: (result: TResult) => void;
}

const IMPACT_META: Record<OperationImpactLevel, { icon: LucideIcon; badge: string; label: string; tone: string }> = {
  "read-only": { icon: ShieldCheck, badge: "bg-muted text-muted-foreground", label: "Read-only", tone: "text-muted-foreground" },
  reversible: { icon: FlaskConical, badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400", label: "Reversible", tone: "text-amber-700 dark:text-amber-400" },
  canonical: { icon: ShieldAlert, badge: "bg-red-500/10 text-red-700 dark:text-red-400", label: "Changes canonical knowledge", tone: "text-red-700 dark:text-red-400" },
};

const READINESS_META: Record<OperationReadinessState, { icon: LucideIcon; className: string }> = {
  ready: { icon: CheckCircle2, className: "text-green-600" },
  blocked: { icon: XCircle, className: "text-red-600" },
  info: { icon: ChevronRight, className: "text-muted-foreground" },
};

type Phase = "confirm" | "running" | "done" | "error";

export function OperationDialog<TResult>({
  spec,
  open,
  onOpenChange,
}: {
  spec: OperationSpec<TResult>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(0);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const impact = IMPACT_META[spec.impact.level];
  const ImpactIcon = impact.icon;
  const blocked = (spec.readiness ?? []).some((r) => r.state === "blocked");

  const reset = useCallback(() => {
    setPhase("confirm");
    setGuidanceOpen(false);
    setActivePhase(0);
    setResult(null);
    setError(null);
  }, []);

  // Prevent dismissal mid-run — an operation in flight is not something to lose by accident.
  const handleOpenChange = (next: boolean) => {
    if (!next && phase === "running") return;
    if (!next) reset();
    onOpenChange(next);
  };

  const start = async () => {
    setPhase("running");
    setActivePhase(0);
    setError(null);
    try {
      const r = await spec.run({ setPhase: (i) => setActivePhase(i) });
      setResult(r);
      setPhase("done");
      spec.onComplete?.(r);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "The operation could not be completed.");
      setPhase("error");
    }
  };

  const completion = phase === "done" && result !== null ? spec.summarise(result) : null;
  const next = phase === "done" && result !== null ? spec.nextStep?.(result) ?? null : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg"
        data-testid={`operation-${spec.id}`}
        onInteractOutside={(e) => { if (phase === "running") e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (phase === "running") e.preventDefault(); }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${impact.badge}`}>
              <ImpactIcon className="h-3 w-3" />
              {impact.label}
            </span>
          </div>
          <DialogTitle className="text-lg tracking-tight">{spec.title}</DialogTitle>
          {/* Purpose — one honest sentence, always shown. */}
          <DialogDescription className="leading-relaxed">{spec.purpose}</DialogDescription>
        </DialogHeader>

        {/* ── CONFIRM (Purpose · Readiness · guidance-as-gate) ───────────────── */}
        {phase === "confirm" ? (
          <div className="flex flex-col gap-4" data-testid={`operation-confirm-${spec.id}`}>
            {/* Production impact — where colour is spent. */}
            <div className={`flex items-start gap-2 text-sm ${impact.tone}`}>
              <ImpactIcon className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{spec.impact.line}</span>
            </div>

            {/* Readiness */}
            {spec.readiness && spec.readiness.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" /> Readiness
                </div>
                <ul className="flex flex-col gap-1.5">
                  {spec.readiness.map((r) => {
                    const m = READINESS_META[r.state];
                    const Icon = m.icon;
                    return (
                      <li key={r.label} className="flex items-start gap-2 text-sm">
                        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${m.className}`} />
                        <span className="leading-relaxed">
                          {r.label}
                          {r.detail ? <span className="text-muted-foreground"> — {r.detail}</span> : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {/* Guidance — the seven questions; collapsed by default, this IS the confirm gate. */}
            {spec.guidance && spec.guidance.length > 0 ? (
              <Collapsible open={guidanceOpen} onOpenChange={setGuidanceOpen}>
                <CollapsibleTrigger
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`operation-guidance-${spec.id}`}
                >
                  What does this do?
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${guidanceOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <dl className="flex flex-col gap-2.5 mt-3 pl-1">
                    {spec.guidance.map((g) => (
                      <div key={g.q} className="flex flex-col gap-0.5">
                        <dt className="text-xs font-medium">{g.q}</dt>
                        <dd className="text-sm text-muted-foreground leading-relaxed">{g.a}</dd>
                      </div>
                    ))}
                  </dl>
                </CollapsibleContent>
              </Collapsible>
            ) : null}

            {spec.expectedDuration ? (
              <p className="text-xs text-muted-foreground">This can take {spec.expectedDuration}.</p>
            ) : null}
          </div>
        ) : null}

        {/* ── RUNNING (honest indeterminate; phases advance only on real steps) ─ */}
        {phase === "running" ? (
          <div className="flex flex-col gap-4" data-testid={`operation-running-${spec.id}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Working…</span>
            </div>
            {/* Calm indeterminate bar — a shape that says "working", not a fabricated percentage.
                It pulses; it never claims a position, because the server reports none (ADMIN2 §4.3). */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-full rounded-full bg-primary/40 animate-pulse" />
            </div>
            {spec.phases && spec.phases.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {spec.phases.map((p, i) => {
                  const state = i < activePhase ? "done" : i === activePhase ? "active" : "pending";
                  return (
                    <li key={p} className="flex items-center gap-2 text-sm">
                      {state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      ) : state === "active" ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                        </span>
                      )}
                      <span className={state === "pending" ? "text-muted-foreground" : ""}>{p}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {spec.expectedDuration
                ? `This can take ${spec.expectedDuration}. You can keep this open — it will report the outcome here.`
                : "This will report the outcome here when it finishes."}
            </p>
          </div>
        ) : null}

        {/* ── COMPLETION SUMMARY + recommended next step ────────────────────── */}
        {phase === "done" && completion ? (
          <div className="flex flex-col gap-4" data-testid={`operation-done-${spec.id}`}>
            <div className="flex items-start gap-2.5">
              {completion.tone === "good" ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
              )}
              <div className="flex flex-col gap-1">
                <p className={`text-base font-medium ${completion.tone === "good" ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"}`}>
                  {completion.headline}
                </p>
                {completion.lines && completion.lines.length > 0 ? (
                  <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                    {completion.lines.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── ERROR (calm three tiers: what · what it means · one way forward) ─ */}
        {phase === "error" ? (
          <div className="flex flex-col gap-2" data-testid={`operation-error-${spec.id}`}>
            <div className="flex items-start gap-2.5">
              <XCircle className="h-6 w-6 shrink-0 text-red-600" />
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium text-red-700 dark:text-red-400">The operation didn't complete.</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nothing was reported as finished. You can try again, or check the tool for the current state.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          {phase === "confirm" ? (
            <>
              <Button variant="ghost" onClick={() => handleOpenChange(false)} data-testid={`operation-cancel-${spec.id}`}>
                Cancel
              </Button>
              <Button
                variant={spec.impact.level === "canonical" ? "destructive" : "default"}
                onClick={start}
                disabled={blocked}
                data-testid={`operation-start-${spec.id}`}
              >
                {spec.confirmLabel ?? spec.title}
              </Button>
            </>
          ) : null}

          {phase === "running" ? (
            <Button variant="ghost" disabled data-testid={`operation-running-action-${spec.id}`}>
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Working…
            </Button>
          ) : null}

          {phase === "done" ? (
            <>
              {next ? (
                next.href ? (
                  <Link href={next.href}>
                    <Button variant="default" onClick={() => handleOpenChange(false)} data-testid={`operation-next-${spec.id}`}>
                      {next.label}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="default"
                    onClick={() => { next.onClick?.(); handleOpenChange(false); }}
                    data-testid={`operation-next-${spec.id}`}
                  >
                    {next.label}
                  </Button>
                )
              ) : null}
              <Button variant="ghost" onClick={() => handleOpenChange(false)} data-testid={`operation-close-${spec.id}`}>
                Done
              </Button>
            </>
          ) : null}

          {phase === "error" ? (
            <>
              <Button variant="ghost" onClick={() => handleOpenChange(false)} data-testid={`operation-error-close-${spec.id}`}>
                Close
              </Button>
              <Button variant="default" onClick={start} data-testid={`operation-retry-${spec.id}`}>
                Try again
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A thin convenience wrapper: renders a trigger and owns the open state, for the common case.
 * A page can also drive <OperationDialog> directly with its own open state.
 */
export function OperationTrigger<TResult>({
  spec,
  children,
}: {
  spec: OperationSpec<TResult>;
  children: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {children(() => setOpen(true))}
      <OperationDialog spec={spec} open={open} onOpenChange={setOpen} />
    </>
  );
}
