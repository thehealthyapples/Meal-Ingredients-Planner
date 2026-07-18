import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import {
  ShieldCheck, Users, Star, Sliders,
  Sparkles, BarChart3, FlaskConical,
  ChevronRight, ChevronDown, ClipboardList, Activity, ListTree, Globe2,
  Server, Brain, BookOpen, UserRound, Wrench,
  CheckCircle2, AlertTriangle, HelpCircle, Loader2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import NotFound from "./not-found";

/**
 * SUP1 — Support Hub Foundation · SUP2 — Steward Dashboard · SUP3 — Check-in.
 *
 * The Admin landing is the Support Hub: "the study off the hall"
 * (THA_EXPERIENCE_BLUEPRINT.md §4.1 — admin is a room in the same house, E0, calm,
 * never a second product). This is a LANDING surface only: every tool, route, guard
 * and behaviour is unchanged. No backend, no new API, no new calculation.
 *
 * SUP3 turns SUP2's four equal-weight question-cards into a calm daily CHECK-IN. The
 * first — and largest — thing an operator discovers is a single executive summary that
 * answers "Is everything okay?": "THA is healthy today. No action required." or
 * "Three things need your attention." Beneath it, ONLY the items that need attention are
 * surfaced; healthy signals quietly collapse into the confirmation rather than demanding
 * equal visual weight. Each attention item carries a short explanation, why it matters,
 * and one recommended action that links to the tool which owns it.
 *
 * It reuses SUP2's signals unchanged — each is an EXISTING, read-only, assertAdmin GET a
 * tool page already owns (publication integrity, knowledge-review health, learning
 * dashboard, benchmark run history). It computes no new health metric, adds no endpoint,
 * and never triggers a benchmark or publish. Honesty is preserved: a signal that cannot be
 * determined becomes an honest "couldn't be checked" item, never a silent healthy
 * (UNKNOWN ≠ green, THA_UI_ARCHITECTURE.md §14).
 */

type Tool = {
  id: string;
  title: string;
  description: string;
  icon: typeof Users;
  href: string;
};

// The existing tools — titles, descriptions and hrefs are carried unchanged from the
// previous Admin landing. Nothing here is new functionality.
const TOOLS: Record<string, Tool> = {
  users: {
    id: "users",
    title: "Users",
    description: "Manage user accounts and roles",
    icon: Users,
    href: "/admin/users",
  },
  picks: {
    id: "picks",
    title: "Picks",
    description: "Manage ingredient products and recommendations",
    icon: Star,
    href: "/admin/ingredient-products",
  },
  "recipe-sources": {
    id: "recipe-sources",
    title: "Recipe Sources",
    description: "Configure recipe acquisition sources",
    icon: Sliders,
    href: "/admin/recipe-sources",
  },
  "companion-intelligence": {
    id: "companion-intelligence",
    title: "Companion Intelligence",
    description: "Manage companion personality and behavior",
    icon: Sparkles,
    href: "/admin/companion-intelligence",
  },
  "intelligence-dashboard": {
    id: "intelligence-dashboard",
    title: "Intelligence Dashboard",
    description: "Monitor AI capability benchmarks",
    icon: BarChart3,
    href: "/admin/intelligence",
  },
  observations: {
    id: "observations",
    title: "Observation Workbench",
    description: "Runtime telemetry across the Intelligence Platform — capability health, intent quality, context composition, companion outcomes and diagnostics.",
    icon: Activity,
    href: "/admin/observations",
  },
  behaviour: {
    id: "behaviour",
    title: "Behaviour Workbench",
    description: "Execution Timeline — reconstruct the complete execution path of an individual Companion interaction from Observation Engine telemetry.",
    icon: ListTree,
    href: "/admin/behaviour",
  },
  "knowledge-review": {
    id: "knowledge-review",
    title: "Knowledge Review",
    description: "Review unresolved knowledge terms from the resolver",
    icon: ClipboardList,
    href: "/admin/knowledge-review",
  },
  "canonical-publication-integrity": {
    id: "canonical-publication-integrity",
    title: "Canonical Publication Integrity",
    description: "Platform-wide verification of canonical domains against their declared owners and publication paths",
    icon: ShieldCheck,
    href: "/admin/canonical-publication-integrity",
  },
  "benchmark-households": {
    id: "benchmark-households",
    title: "Benchmark Households",
    description: "Manage benchmark test households",
    icon: FlaskConical,
    href: "/admin/benchmark-households",
  },
  "development-world": {
    id: "development-world",
    title: "Development World",
    description: "Read-only view of the 50 Development World households (DEV only)",
    icon: Globe2,
    href: "/admin/development-world",
  },
};

type Group = {
  id: string;
  title: string;
  icon: typeof Users;
  blurb: string;
  learnMore: string;
  toolIds: string[];
};

// The five rooms of the study (ADMIN2 IA, renamed to the SUP1 groups). Every existing
// tool belongs to exactly one group — one obvious place to perform each action.
const GROUPS: Group[] = [
  {
    id: "platform",
    title: "Platform",
    icon: Server,
    blurb: "The health and integrity of the platform itself.",
    learnMore:
      "Platform tools watch the parts of THA that keep every household's data honest — that each canonical domain still matches its declared owner, and that what the platform publishes is true at runtime. Come here to check the platform is sound before a release, or when a publication check has flagged something to look into.",
    toolIds: ["canonical-publication-integrity"],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    icon: Brain,
    blurb: "How the Companion learns, performs, and behaves.",
    learnMore:
      "Intelligence tools are the operator's window onto the one Companion: the benchmark score and release-safety gate, the learning queue where routing gaps are triaged, fleet-wide runtime telemetry, and the timeline of a single interaction. Come here to judge whether the Companion is safe and good enough to release, or to understand why it did what it did.",
    toolIds: ["intelligence-dashboard", "companion-intelligence", "observations", "behaviour"],
  },
  {
    id: "knowledge",
    title: "Knowledge",
    icon: BookOpen,
    blurb: "The food, recipe, and knowledge content THA draws on.",
    learnMore:
      "Knowledge tools tend the content THA reasons over: the ingredient Picks it recommends, the recipe sources it draws from, and the review queue where unresolved knowledge terms are approved before they become canonical. Come here to curate what THA knows — and remember that publishing a knowledge release changes what every household sees.",
    toolIds: ["picks", "recipe-sources", "knowledge-review"],
  },
  {
    id: "people",
    title: "People",
    icon: UserRound,
    blurb: "The households and accounts THA serves.",
    learnMore:
      "People tools look after the households behind the accounts — roles, subscriptions, onboarding, and the occasional account repair. Come here to help a specific household, always guarding changes proportionally to their consequence.",
    toolIds: ["users"],
  },
  {
    id: "development",
    title: "Development",
    icon: Wrench,
    blurb: "Synthetic worlds and fixtures for testing (DEV only).",
    learnMore:
      "Development tools are the test worlds THA is measured against: the permanent benchmark households used for reproducible scoring, and the read-only Development World. Come here to seed, inspect, or reset the fixtures the benchmark runs against — none of this touches a real household.",
    toolIds: ["benchmark-households", "development-world"],
  },
];

// ── Support Hub check-in ─────────────────────────────────────────────────────
// Read-only view models over EXISTING admin GETs. These interfaces are the subset of
// each response's fields the check-in reads; the endpoints and their full shapes are owned
// by the tool pages (publication-integrity, knowledge-review, learning, benchmark).
// Nothing here is a new endpoint or a new calculation.

type Verdict = "PASS" | "PARTIAL" | "FAIL";

interface PublicationReport {
  generatedAt: string;
  summary: {
    domains: number;
    healthy: number;
    needsAttention: number;
    publicationFailure: number;
  };
}

interface KnowledgeHealth {
  backlog: { outstandingReviews: number };
}

interface LearningDashboard {
  recommendationCounts: { pending: number };
}

interface BenchmarkRun {
  runId: string;
  mode: string;
  executedAt: string;
  headlineScore: number;
  gatesFired: number;
  verdict: Verdict;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "recently";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "recently";
  const sec = Math.round((Date.now() - then) / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 45) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

const COUNT_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const countWord = (n: number) => COUNT_WORDS[n] ?? String(n);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── The signal model ─────────────────────────────────────────────────────────
// Every signal is evaluated to exactly one of: still loading · quietly healthy (silent) ·
// or an attention item. "attention" = something is wrong; "caution" = worth a look before
// a release; "unknown" = the signal could not be read (honest — never treated as healthy).

type Severity = "attention" | "caution" | "unknown";

interface AttentionItem {
  key: string;
  severity: Severity;
  headline: string; // short explanation — WHAT
  why: string; // WHY it matters
  action: { label: string; href: string }; // WHERE to go — the tool that owns it
}

type SignalResult =
  | { kind: "loading" }
  | { kind: "healthy" }
  | { kind: "item"; item: AttentionItem };

// Colour is spent only on a real state; loading/unknown stay neutral (UNKNOWN ≠ green).
const SEVERITY_META: Record<Severity | "good" | "loading", { icon: LucideIcon; className: string; accent: string; spin?: boolean }> = {
  attention: { icon: AlertTriangle, className: "text-red-600", accent: "border-l-red-500/50" },
  caution: { icon: AlertTriangle, className: "text-amber-600", accent: "border-l-amber-500/50" },
  unknown: { icon: HelpCircle, className: "text-muted-foreground", accent: "border-l-muted-foreground/30" },
  good: { icon: CheckCircle2, className: "text-green-600", accent: "" },
  loading: { icon: Loader2, className: "text-muted-foreground", accent: "", spin: true },
};

const SEVERITY_RANK: Record<Severity, number> = { attention: 0, caution: 1, unknown: 2 };

function AttentionItemCard({ item }: { item: AttentionItem }) {
  const meta = SEVERITY_META[item.severity];
  const Icon = meta.icon;
  return (
    <Card className={`border-l-4 ${meta.accent}`} data-testid={`checkin-item-${item.key}`}>
      <CardHeader className="gap-2">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${meta.className}`} />
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-base font-medium tracking-tight" data-testid={`checkin-headline-${item.key}`}>
              {item.headline}
            </CardTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.why}</p>
            <Link href={item.action.href}>
              <span
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer w-fit mt-0.5"
                data-testid={`checkin-action-${item.key}`}
              >
                {item.action.label}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function SupportCheckIn() {
  // Every query below is an EXISTING, read-only, assertAdmin GET already owned by a tool
  // page. TanStack dedupes with those pages; staleTime is Infinity app-wide. No mutation,
  // no benchmark run, no publish is ever triggered from here.
  const publication = useQuery<PublicationReport>({
    queryKey: ["/api/admin/canonical-publication-integrity"],
  });
  const knowledge = useQuery<KnowledgeHealth>({
    queryKey: ["/api/admin/knowledge-review/health"],
  });
  const learning = useQuery<LearningDashboard>({
    queryKey: ["/api/intelligence/learning/dashboard"],
  });
  const benchmark = useQuery<{ runs: BenchmarkRun[] }>({
    queryKey: ["/api/intelligence/benchmark/runs"],
  });

  const PUBLICATION_HREF = "/admin/canonical-publication-integrity";
  const INTELLIGENCE_HREF = "/admin/intelligence";
  const KNOWLEDGE_HREF = "/admin/knowledge-review";
  const LEARNING_HREF = "/admin/companion-intelligence";

  const latestRun = (() => {
    const runs = benchmark.data?.runs ?? [];
    if (runs.length === 0) return null;
    return [...runs].sort((a, b) => b.executedAt.localeCompare(a.executedAt))[0];
  })();

  // ── Is the platform sound? (publication integrity — the server's own domain status) ──
  const publicationSignal: SignalResult = (() => {
    if (publication.isPending) return { kind: "loading" };
    const s = publication.data?.summary;
    if (publication.isError || !s) {
      return {
        kind: "item",
        item: {
          key: "publication",
          severity: "unknown",
          headline: "The platform's publication check couldn't be run",
          why: "Until it runs, THA can't confirm every canonical domain still matches its declared owner — so this isn't a clean bill of health.",
          action: { label: "Open Publication Integrity", href: PUBLICATION_HREF },
        },
      };
    }
    if (s.publicationFailure > 0) {
      const n = s.publicationFailure;
      return {
        kind: "item",
        item: {
          key: "publication",
          severity: "attention",
          headline: `${n} canonical ${n === 1 ? "domain has" : "domains have"} failed publication`,
          why: "What THA publishes may no longer match its declared owner, so a household could be shown stale or incorrect information.",
          action: { label: "Open Publication Integrity", href: PUBLICATION_HREF },
        },
      };
    }
    if (s.needsAttention > 0) {
      const n = s.needsAttention;
      return {
        kind: "item",
        item: {
          key: "publication",
          severity: "caution",
          headline: `${n} canonical ${n === 1 ? "domain needs" : "domains need"} a look`,
          why: "These domains are still publishing, but a check flagged something worth reviewing before the next release.",
          action: { label: "Open Publication Integrity", href: PUBLICATION_HREF },
        },
      };
    }
    return { kind: "healthy" };
  })();

  // ── Is anything queued for me? (knowledge-review backlog, surfaced verbatim) ──
  const knowledgeSignal: SignalResult = (() => {
    if (knowledge.isPending) return { kind: "loading" };
    if (knowledge.isError || !knowledge.data) {
      return {
        kind: "item",
        item: {
          key: "knowledge",
          severity: "unknown",
          headline: "The knowledge review queue couldn't be read",
          why: "THA can't confirm whether any terms are waiting to be approved, so this isn't a clean bill of health.",
          action: { label: "Open Knowledge Review", href: KNOWLEDGE_HREF },
        },
      };
    }
    const reviews = knowledge.data.backlog.outstandingReviews;
    if (reviews > 0) {
      return {
        kind: "item",
        item: {
          key: "knowledge",
          severity: "caution",
          headline: `${reviews} knowledge ${reviews === 1 ? "term is" : "terms are"} awaiting review`,
          why: "Until they're reviewed, these terms stay unresolved and the Companion can't yet draw on them.",
          action: { label: "Open Knowledge Review", href: KNOWLEDGE_HREF },
        },
      };
    }
    return { kind: "healthy" };
  })();

  // ── Does the Companion have recommendations waiting? (learning queue) ──
  const learningSignal: SignalResult = (() => {
    if (learning.isPending) return { kind: "loading" };
    if (learning.isError || !learning.data) {
      return {
        kind: "item",
        item: {
          key: "learning",
          severity: "unknown",
          headline: "The learning queue couldn't be read",
          why: "THA can't confirm whether the Companion has recommendations waiting to be triaged, so this isn't a clean bill of health.",
          action: { label: "Open Companion Intelligence", href: LEARNING_HREF },
        },
      };
    }
    const pending = learning.data.recommendationCounts.pending;
    if (pending > 0) {
      return {
        kind: "item",
        item: {
          key: "learning",
          severity: "caution",
          headline: `${pending} learning ${pending === 1 ? "recommendation is" : "recommendations are"} pending`,
          why: "These are routing gaps the Companion surfaced from real interactions; they wait here until someone decides what to do with them.",
          action: { label: "Open Companion Intelligence", href: LEARNING_HREF },
        },
      };
    }
    return { kind: "healthy" };
  })();

  // ── Is it safe to release? (latest benchmark verdict — the LAST run, never posed as current) ──
  const releaseSignal: SignalResult = (() => {
    if (benchmark.isPending) return { kind: "loading" };
    if (benchmark.isError) {
      return {
        kind: "item",
        item: {
          key: "release",
          severity: "unknown",
          headline: "Release readiness couldn't be determined",
          why: "The benchmark history didn't load, so THA can't say whether the Companion is safe to release right now.",
          action: { label: "Open Intelligence", href: INTELLIGENCE_HREF },
        },
      };
    }
    if (!latestRun) {
      return {
        kind: "item",
        item: {
          key: "release",
          severity: "unknown",
          headline: "No benchmark has been run yet",
          why: "Without a run on record, release readiness is unknown — run one before shipping a change to the Companion.",
          action: { label: "Open Intelligence", href: INTELLIGENCE_HREF },
        },
      };
    }
    if (latestRun.verdict === "FAIL") {
      return {
        kind: "item",
        item: {
          key: "release",
          severity: "attention",
          headline: "The last benchmark did not pass",
          why: `It scored ${latestRun.headlineScore}/100 ${relativeTime(latestRun.executedAt)}. Releasing now risks shipping a Companion below the quality bar.`,
          action: { label: "Review in Intelligence", href: INTELLIGENCE_HREF },
        },
      };
    }
    if (latestRun.verdict === "PARTIAL") {
      return {
        kind: "item",
        item: {
          key: "release",
          severity: "caution",
          headline: "The last benchmark passed only partially",
          why: `It scored ${latestRun.headlineScore}/100 ${relativeTime(latestRun.executedAt)}, with ${latestRun.gatesFired} ${latestRun.gatesFired === 1 ? "gate" : "gates"} fired. Worth a look before releasing.`,
          action: { label: "Review in Intelligence", href: INTELLIGENCE_HREF },
        },
      };
    }
    return { kind: "healthy" };
  })();

  const signals = [publicationSignal, knowledgeSignal, learningSignal, releaseSignal];
  const stillLoading = signals.some((s) => s.kind === "loading");
  const items = signals
    .filter((s): s is { kind: "item"; item: AttentionItem } => s.kind === "item")
    .map((s) => s.item)
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const needsAction = items.filter((i) => i.severity === "attention" || i.severity === "caution");
  const undetermined = items.filter((i) => i.severity === "unknown");
  const hasFailure = items.some((i) => i.severity === "attention");

  // ── The executive summary — the first and largest thing on the page. ──
  const summary: { tone: Severity | "good" | "loading"; title: string; subtitle: string } = (() => {
    if (stillLoading && items.length === 0) {
      return {
        tone: "loading",
        title: "Checking on things…",
        subtitle: "One moment while THA looks over the house.",
      };
    }
    if (needsAction.length > 0) {
      const n = items.length; // every surfaced item has an action to take
      return {
        tone: hasFailure ? "attention" : "caution",
        title: `${cap(countWord(n))} ${n === 1 ? "thing needs" : "things need"} your attention.`,
        subtitle: "Here's what to look at, and where to go. Everything else is fine.",
      };
    }
    if (undetermined.length > 0) {
      const n = undetermined.length;
      return {
        tone: "unknown",
        title: "THA looks calm — but not everything could be checked.",
        subtitle: `${cap(countWord(n))} ${n === 1 ? "signal" : "signals"} couldn't be read just now, so this isn't a clean bill of health.`,
      };
    }
    return {
      tone: "good",
      title: "THA is healthy today.",
      subtitle: publication.data
        ? `No action required. Everything checked out ${relativeTime(publication.data.generatedAt)}.`
        : "No action required.",
    };
  })();

  const summaryMeta = SEVERITY_META[summary.tone];
  const SummaryIcon = summaryMeta.icon;

  return (
    <section className="flex flex-col gap-6" data-testid="support-checkin">
      {/* Executive summary — the primary focus. Answers "Is everything okay?" in one look. */}
      <div className="flex items-start gap-3.5" data-testid="checkin-summary">
        <SummaryIcon
          className={`h-7 w-7 shrink-0 mt-0.5 ${summaryMeta.className} ${summaryMeta.spin ? "animate-spin" : ""}`}
        />
        <div className="flex flex-col gap-1">
          <h2
            className={`text-xl md:text-2xl font-semibold tracking-tight ${summaryMeta.className}`}
            data-testid="checkin-summary-title"
          >
            {summary.title}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
            {summary.subtitle}
          </p>
        </div>
      </div>

      {/* Only the items that need attention. Healthy signals stay silent — the room stays calm. */}
      {items.length > 0 ? (
        <div className="flex flex-col gap-3" data-testid="checkin-items">
          {items.map((item) => (
            <AttentionItemCard key={item.key} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <Link href={tool.href}>
      <Card
        className="h-full hover:shadow-md transition-shadow cursor-pointer group"
        data-testid={`support-tool-${tool.id}`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>{tool.title}</CardTitle>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <CardDescription className="mt-2 text-xs">
            {tool.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function GroupSection({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  const Icon = group.icon;
  return (
    <section className="flex flex-col gap-4" data-testid={`support-group-${group.id}`}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-medium tracking-tight">{group.title}</h2>
          </div>
          <div className="flex items-center gap-2 pl-[3.25rem]">
            <p className="text-sm text-muted-foreground">{group.blurb}</p>
            <CollapsibleTrigger
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              data-testid={`support-learn-more-${group.id}`}
            >
              Learn more
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
          </div>
        </div>
        <CollapsibleContent>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3 pl-[3.25rem] max-w-3xl">
            {group.learnMore}
          </p>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {group.toolIds.map((id) => (
          <ToolCard key={id} tool={TOOLS[id]} />
        ))}
      </div>
    </section>
  );
}

export default function AdminPage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  if (!user || (user as any)?.role !== "admin") {
    return <NotFound />;
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6 max-w-6xl mx-auto" data-testid="admin-page">
      {/* Arrival — the study's threshold: who's here and what this room is for. */}
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Support Hub</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          The room where The Healthy Apples is kept running. Everything an operator needs to
          support the households THA serves lives here — how the platform is doing, the
          Companion's intelligence, the knowledge THA draws on, and the people it serves. It
          stays as calm and honest as every other room in the house.
        </p>
      </header>

      {/* The check-in — the operator's first look. "Is everything okay?" answered in one line,
          with only the things that need attention surfaced beneath. Surfaces existing status only. */}
      <SupportCheckIn />

      {/* The five rooms of the study. */}
      <div className="flex flex-col gap-10">
        {GROUPS.map((group) => (
          <GroupSection key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
