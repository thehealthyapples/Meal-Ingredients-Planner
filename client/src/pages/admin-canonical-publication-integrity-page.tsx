import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CircleDashed,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import NotFound from "./not-found";
import { OperationDialog, type OperationSpec } from "@/components/admin/operation";

// Mirrors server/verification/publication-types.ts — the API is the owner.
type CheckOutcome = "pass" | "warn" | "fail" | "skipped";
type DomainStatus = "healthy" | "needs-attention" | "publication-failure";

interface CheckResult {
  id: string;
  law: string;
  title: string;
  outcome: CheckOutcome;
  detail: string;
  cpi1?: string;
}

interface DomainResult {
  id: string;
  name: string;
  variant: string;
  canonicalOwner: string;
  authorisedWriters: string[];
  publicationPath: string;
  runtimeReadPath: string;
  sotRegisterRef?: string;
  knownGaps: string[];
  status: DomainStatus;
  checks: CheckResult[];
}

interface PlatformVerificationReport {
  generatedAt: string;
  databaseAvailable: boolean;
  summary: {
    domains: number;
    healthy: number;
    needsAttention: number;
    publicationFailure: number;
    checksRun: number;
    passed: number;
    warned: number;
    failed: number;
    skipped: number;
  };
  domains: DomainResult[];
  crossCutting: CheckResult[];
}

const STATUS_META: Record<DomainStatus, { emoji: string; label: string; className: string }> = {
  healthy: { emoji: "🟢", label: "Healthy", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  "needs-attention": { emoji: "🟡", label: "Needs Attention", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  "publication-failure": { emoji: "🔴", label: "Publication Failure", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

function prettifyLaw(law: string): string {
  const text = law.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function OutcomeIcon({ outcome }: { outcome: CheckOutcome }) {
  switch (outcome) {
    case "pass":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="pass" />;
    case "warn":
      return <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-label="warn" />;
    case "fail":
      return <XCircle className="h-4 w-4 shrink-0 text-red-600" aria-label="fail" />;
    case "skipped":
      return <CircleDashed className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="skipped" />;
  }
}

function CheckRow({ check }: { check: CheckResult }) {
  return (
    <div className="flex items-start gap-2 py-1.5" data-testid={`check-${check.id}`}>
      <OutcomeIcon outcome={check.outcome} />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">
          {check.title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {prettifyLaw(check.law)}
            {check.cpi1 ? ` · CPI1 ${check.cpi1}` : ""}
          </span>
        </p>
        <p className="text-xs text-muted-foreground break-words">{check.detail}</p>
      </div>
    </div>
  );
}

function DeclarationField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xs break-words">{value}</p>
    </div>
  );
}

function DomainRow({ domain }: { domain: DomainResult }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[domain.status];
  const issueCount = domain.checks.filter((c) => c.outcome !== "pass").length;

  return (
    <div className="border rounded-lg" data-testid={`domain-${domain.id}`}>
      <button
        type="button"
        className="w-full flex items-center gap-3 p-3 text-left"
        onClick={() => setExpanded((v) => !v)}
        data-testid={`domain-toggle-${domain.id}`}
      >
        <span className="text-base" aria-hidden>{meta.emoji}</span>
        <span className="flex-1 min-w-0">
          <span className="text-sm font-medium">{domain.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">{domain.variant}</span>
        </span>
        <Badge variant="secondary" className={meta.className} data-testid={`domain-status-${domain.id}`}>
          {meta.label}
        </Badge>
        {issueCount > 0 && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {issueCount} finding{issueCount === 1 ? "" : "s"}
          </span>
        )}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <DeclarationField label="Canonical Owner" value={domain.canonicalOwner} />
            <DeclarationField label="Runtime Read Path" value={domain.runtimeReadPath} />
            <DeclarationField label="Publication Path" value={domain.publicationPath} />
            <DeclarationField
              label="Authorised Writers"
              value={domain.authorisedWriters.length > 0 ? domain.authorisedWriters.join(", ") : "none (dormant by design)"}
            />
          </div>
          <Separator />
          <div>
            {domain.checks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </div>
          {domain.knownGaps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Known gaps — real findings not yet machine-checked (do not score)
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                {domain.knownGaps.map((gap) => (
                  <li key={gap} className="text-xs text-muted-foreground">{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryTile({ emoji, label, count, testId }: { emoji: string; label: string; count: number; testId: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-2xl font-semibold tracking-tight" data-testid={testId}>
          <span aria-hidden className="mr-1.5">{emoji}</span>
          {count}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminCanonicalPublicationIntegrityPage() {
  const { user, isLoading: userLoading } = useUser();

  const { data: report, isPending, isError, refetch, isRefetching } = useQuery<PlatformVerificationReport>({
    queryKey: ["/api/admin/canonical-publication-integrity"],
    enabled: !!user && (user as any)?.role === "admin",
  });

  // OPS1 — Verify Publication runs through the one canonical Operation experience. It reuses the
  // page's existing query (via refetch) — no new endpoint. Read-only, so a light confirm and no
  // destructive weight; the completion summary reports the server's own domain classification.
  const [verifyOpen, setVerifyOpen] = useState(false);
  const verifySpec: OperationSpec<PlatformVerificationReport> = {
    id: "verify-publication",
    title: "Verify Publication",
    purpose: "Re-check every canonical domain against its declared owner, writers, publication path and runtime read path.",
    impact: { level: "read-only", line: "Read-only — this reads and verifies; it changes nothing any household sees." },
    guidance: [
      { q: "What does this do?", a: "Runs the full CPI audit across every canonical domain and cross-cutting check, live." },
      { q: "Why would I run it?", a: "To confirm the platform is publishing correctly — before a release, or after a publish or a suspected drift." },
      { q: "What happens?", a: "Each domain is checked against its owner and publication path; the result is classified healthy / needs-attention / failure. Skipped is never treated as healthy." },
      { q: "Production impact", a: "None — it only reads and verifies." },
    ],
    expectedDuration: "a few moments",
    run: async () => {
      const res = await refetch();
      if (res.error || !res.data) throw (res.error ?? new Error("Verification could not run. Check the server logs and try again."));
      return res.data;
    },
    summarise: (r) => {
      const bad = r.summary.needsAttention + r.summary.publicationFailure;
      return {
        tone: r.summary.publicationFailure > 0 ? "warning" : bad > 0 ? "warning" : "good",
        headline: r.summary.publicationFailure > 0
          ? `${r.summary.publicationFailure} domain${r.summary.publicationFailure === 1 ? "" : "s"} failed publication.`
          : bad > 0
            ? `${r.summary.needsAttention} domain${r.summary.needsAttention === 1 ? "" : "s"} need a look.`
            : "All canonical domains are healthy.",
        lines: [
          `${r.summary.healthy} of ${r.summary.domains} domains healthy`,
          `${r.summary.checksRun} checks — ${r.summary.passed} passed, ${r.summary.warned} warned, ${r.summary.failed} failed, ${r.summary.skipped} skipped`,
        ],
      };
    },
    // No next-step button: the full domain breakdown is on this page, revealed the moment the
    // dialog closes. The completion summary points there without a redundant navigation.
  };

  if (userLoading) return null;
  if (!user || (user as any)?.role !== "admin") {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto" data-testid="admin-publication-integrity-page">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Canonical Publication Integrity</h1>
            <p className="text-sm text-muted-foreground">
              Every canonical domain, verified against its declared owner, writers, publication path and
              runtime read path — the CPI1 audit, running continuously.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVerifyOpen(true)}
          disabled={isPending || isRefetching}
          data-testid="button-rerun-verification"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
          Re-verify
        </Button>
      </div>

      {/* OPS1 — the canonical Operation experience for Verify Publication. */}
      <OperationDialog spec={verifySpec} open={verifyOpen} onOpenChange={setVerifyOpen} />


      {isPending && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="pt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <WifiOff className="h-4 w-4" />
            Verification could not run. Check the server logs and try again.
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          {!report.databaseAvailable && (
            <Card>
              <CardContent className="pt-6 flex items-center gap-2 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4" />
                The database was unreachable — projection checks report as skipped, and skipped is never
                treated as healthy.
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 grid-cols-3">
            <SummaryTile emoji="🟢" label="Healthy" count={report.summary.healthy} testId="summary-healthy" />
            <SummaryTile emoji="🟡" label="Needs Attention" count={report.summary.needsAttention} testId="summary-needs-attention" />
            <SummaryTile emoji="🔴" label="Publication Failure" count={report.summary.publicationFailure} testId="summary-publication-failure" />
          </div>

          <p className="text-xs text-muted-foreground" data-testid="text-checks-summary">
            {report.summary.checksRun} checks across {report.summary.domains} domains — {report.summary.passed} passed,{" "}
            {report.summary.warned} warned, {report.summary.failed} failed, {report.summary.skipped} skipped. Verified{" "}
            {new Date(report.generatedAt).toLocaleString()}.
          </p>

          <div className="space-y-2">
            {report.domains.map((domain) => (
              <DomainRow key={domain.id} domain={domain} />
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cross-cutting findings</CardTitle>
              <CardDescription>
                Platform-wide checks that belong to no single domain (CPI1 §4).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.crossCutting.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
