// FI20 — Food Comparison view (activates COMP1).
//
// Presentation ONLY. It owns no intelligence, computes no difference and fetches
// nothing: it renders an already-assembled, already-cited FoodComparisonBundle
// from the Food Comparison Engine (server/intelligence/food-intelligence/
// comparison-engine.ts, verb `food-intelligence:compare`), surfaced by the
// read-only route GET /api/foods/compare.
//
// Every statement it shows was decided and cited by the engine. This component
// adds no adjective the engine did not (Rule E1 — no citation, no card; Rule LT3
// — the brain stays deterministic, the view only phrases what it was handed).
// The one question every row answers: "how does this help my household?" — the
// engine's household-suitability dimension and its final recommendation carry the
// "for us" signal; this view puts them first.

import { useState } from "react";
import { Scale, Home, Info, CheckCircle2, CircleDashed, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  IntelligenceCard,
  bodyText,
  subtleText,
  eyebrowText,
  semanticSurface,
  semanticText,
} from "@/components/intelligence";

// ── Bundle shape (mirrors the engine's FoodComparisonBundle) ───────────────────
// The client cannot import server types across the boundary, so the read model is
// declared here — the same discipline use-food-opportunities.ts uses for the
// opportunity bundle.

export type ComparisonDimensionKey =
  | "appleScore"
  | "processing"
  | "ingredientQuality"
  | "additives"
  | "nutritionalProfile"
  | "healthBenefits"
  | "valueForMoney"
  | "householdSuitability";

export interface ComparisonEvidence {
  owner: string;
  fact: string;
}

export interface ComparisonDimensionEntry {
  status: "evidence" | "gap";
  summary: string | null;
  gapReason: string | null;
  evidence: ComparisonEvidence[];
  /** FOODUI11 — present only for naturally list-shaped dimensions (nutrients, benefits). */
  items?: string[];
  /** FOODUI12 — real per-100g quantities (currently: USDA macros, nutritionalProfile only, covered foods only). */
  metrics?: { label: string; value: string }[];
}

export interface ComparisonSubject {
  query: string;
  kind: "canonical-food" | "scanned-product" | "unresolved";
  slug: string | null;
  name: string | null;
  category: string | null;
  dimensions: Record<ComparisonDimensionKey, ComparisonDimensionEntry>;
}

export interface ComparisonDimensionOutcome {
  dimension: ComparisonDimensionKey;
  comparable: boolean;
  outcome: string | null;
  gapReason: string | null;
}

export interface ComparisonRecommendation {
  slug: string | null;
  name: string;
  basis: string[];
}

export interface FoodComparisonBundle {
  subjects: ComparisonSubject[];
  dimensions: ComparisonDimensionOutcome[];
  recommendation: ComparisonRecommendation | null;
  recommendationGap: string | null;
  trust: { isGrounded: boolean; householdAware: boolean; gaps: string[] };
  metadata: { assembledAt: string; sources: string[] };
}

// ── Friendly, household-facing labels ──────────────────────────────────────────
// The engine's keys are internal; a household reads these. Order puts the
// "for us" dimension first, then the everyday decision facts.

const DIMENSION_ORDER: readonly ComparisonDimensionKey[] = [
  "householdSuitability",
  "appleScore",
  "processing",
  "ingredientQuality",
  "additives",
  "nutritionalProfile",
  "healthBenefits",
  "valueForMoney",
];

const DIMENSION_LABEL: Record<ComparisonDimensionKey, string> = {
  householdSuitability: "For your household",
  appleScore: "THA apple score",
  processing: "How processed",
  ingredientQuality: "Ingredient quality",
  additives: "Additives",
  nutritionalProfile: "Nutrition",
  healthBenefits: "Health benefits",
  valueForMoney: "Value for money",
};

function subjectLabel(s: ComparisonSubject): string {
  return s.name ?? s.query;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function FoodComparisonView({ bundle }: { bundle: FoodComparisonBundle }) {
  const resolved = bundle.subjects.filter((s) => s.kind !== "unresolved");
  const unresolved = bundle.subjects.filter((s) => s.kind === "unresolved");

  const orderedDimensions = DIMENSION_ORDER.map((key) =>
    bundle.dimensions.find((d) => d.dimension === key),
  ).filter((d): d is ComparisonDimensionOutcome => !!d);

  return (
    <div className="space-y-4" data-testid="food-comparison">
      {/* ── The verdict: the one thing a household came here to learn ── */}
      {bundle.recommendation ? (
        <Card
          role="region"
          aria-label="Better choice for your household"
          className={cn("px-4 py-3.5 space-y-2", semanticSurface.positive)}
          data-testid="comparison-recommendation"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className={cn("h-4 w-4 flex-shrink-0", semanticText.positive)} aria-hidden="true" />
            <p className={cn(eyebrowText)}>The better choice for you</p>
          </div>
          <p className="text-base font-semibold tracking-tight" data-testid="comparison-winner">
            {bundle.recommendation.name}
          </p>
          {bundle.recommendation.basis.length > 0 && (
            <ul className="space-y-1">
              {bundle.recommendation.basis.map((reason) => (
                <li key={reason} className={cn(bodyText, "flex gap-2")}>
                  <span aria-hidden="true" className="text-foreground/30">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <IntelligenceCard
          icon={<Info className="h-4 w-4" />}
          eyebrow="No clear winner"
          title="These are close — here's the honest picture"
          body={
            bundle.recommendationGap ??
            "No dimension produced a grounded, safety-cleared difference between these."
          }
          data-testid="comparison-no-recommendation"
        />
      )}

      {/* ── Whose data this used ── */}
      <div className="flex items-center gap-1.5" data-testid="comparison-scope">
        <Home className={cn("h-3 w-3", bundle.trust.householdAware ? semanticText.positive : "text-muted-foreground/50")} aria-hidden="true" />
        <p className={subtleText}>
          {bundle.trust.householdAware
            ? "Weighed against your household's restrictions and what you already cook."
            : "General comparison — no household context was applied."}
        </p>
      </div>

      {/* ── Side by side: every subject in one column each, every dimension a row.
            FOODUI2 (2026-10-29) — a vertical dimension-by-dimension list made a
            household read N summaries just to find the one line about the food
            they actually had in mind. A household scans left to right across
            what they're choosing between (the same reason Analyser's own compare
            table, products-page.tsx, is built this way) — this view now matches
            it, same table shape, for one consistent comparison pattern app-wide. ── */}
      {resolved.length > 0 && (
        <ComparisonTable dimensions={orderedDimensions} subjects={resolved} />
      )}

      {/* ── Honest gaps + sources ── */}
      {(bundle.trust.gaps.length > 0 || unresolved.length > 0) && (
        <IntelligenceCard
          icon={<CircleDashed className="h-4 w-4" />}
          eyebrow="What we couldn't compare"
          body={
            <ul className="space-y-1">
              {unresolved.map((s) => (
                <li key={s.query} className={bodyText}>
                  We don't know <span className="font-medium">{s.query}</span> yet, so it couldn't be compared.
                </li>
              ))}
              {bundle.trust.gaps.map((g) => (
                <li key={g} className={bodyText}>{g}</li>
              ))}
            </ul>
          }
          data-testid="comparison-gaps"
        />
      )}

      {bundle.metadata.sources.length > 0 && (
        <p className={cn(subtleText, "pt-1")} data-testid="comparison-sources">
          Sources: {bundle.metadata.sources.join(" · ")}
        </p>
      )}
    </div>
  );
}

// FOODUI2 — one table: a column per subject, a row per dimension. Mirrors
// products-page.tsx's own compare table shape (sticky first column, one
// column per thing being compared) so the two comparison surfaces in the app
// read as one pattern, not two. Each cell is that subject's OWN cited summary
// for that row — the engine already computes this per-subject (Rule E1, no
// citation no card); this view just stops hiding it behind a per-dimension
// list the household had to re-scan for every row.
// FOODUI9 — a cell's full prose summary is the evidence-grounded claim (Rule
// E1); this never shortens or rewrites it. What changes is DEFAULT VISIBILITY:
// collapsed to two lines with a toggle, same text, full text one click away —
// so the table reads at a glance instead of forcing a full read of every row
// to find the one line that actually differs between two foods.
// FOODUI11 — the "Why?" source tooltip, shared by both the prose and the
// badge-grid cell shapes so expanding either one reveals the same citation.
function CellSourceTooltip({ evidence }: { evidence: ComparisonEvidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground/50 hover:text-muted-foreground" data-testid="comparison-cell-source">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-60 text-xs">{evidence.map((e) => e.owner).join(", ")}</TooltipContent>
    </Tooltip>
  );
}

function ComparisonCell({
  entry,
}: {
  entry: ComparisonDimensionEntry;
}) {
  const [expanded, setExpanded] = useState(false);

  if (entry.status !== "evidence") {
    return <p className={cn(subtleText, "italic")}>{entry.gapReason ?? "No data yet."}</p>;
  }

  // FOODUI11/12 — a naturally list-shaped or quantified dimension (nutrients,
  // benefits, USDA macros) reads as scannable chips/numbers by default, not a
  // sentence to parse. The same evidence-grounded summary is still one click
  // away via "Why?" — nothing is hidden, only the DEFAULT shape changes to
  // match what the data actually is.
  if ((entry.items && entry.items.length > 0) || (entry.metrics && entry.metrics.length > 0)) {
    return (
      <div>
        {/* FOODUI12 — real quantities get their own row, distinct from named-only chips. */}
        {entry.metrics && entry.metrics.length > 0 && (
          <div className="mb-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
            {entry.metrics.map((m) => (
              <div key={m.label} className="flex items-baseline justify-between gap-1">
                <span className="text-[11px] text-muted-foreground/70">{m.label}</span>
                <span className="text-sm font-semibold tabular-nums">{m.value}</span>
              </div>
            ))}
          </div>
        )}
        {entry.items && entry.items.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.items.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground/80"
              >
                {item}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            data-testid="comparison-cell-toggle"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
            {expanded ? "Less" : "Why?"}
          </button>
          {expanded && <CellSourceTooltip evidence={entry.evidence} />}
        </div>
        {expanded && <p className="mt-1 text-sm leading-relaxed text-foreground/80">{entry.summary}</p>}
      </div>
    );
  }

  return (
    <div>
      <p className={cn("text-sm leading-relaxed", !expanded && "line-clamp-2")}>{entry.summary}</p>
      <div className="mt-1 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          data-testid="comparison-cell-toggle"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
          {expanded ? "Less" : "Why?"}
        </button>
        {expanded && <CellSourceTooltip evidence={entry.evidence} />}
      </div>
    </div>
  );
}

function ComparisonTable({
  dimensions,
  subjects,
}: {
  dimensions: ComparisonDimensionOutcome[];
  subjects: ComparisonSubject[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60" data-testid="comparison-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="sticky left-0 z-10 min-w-28 bg-background p-3 text-left text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
              Dimension
            </th>
            {subjects.map((s, i) => (
              <th
                key={s.query}
                className={cn(
                  "min-w-[160px] p-3 text-center text-base font-semibold",
                  i === 0 && "bg-muted/40",
                )}
              >
                {subjectLabel(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dimensions.map((d) => {
            const label = DIMENSION_LABEL[d.dimension];
            return (
              <tr key={d.dimension} className="border-b border-border/50 last:border-0 align-top">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-background p-3 text-left text-sm font-semibold text-foreground/80"
                >
                  {d.dimension === "householdSuitability" ? (
                    <Home className="mb-1 h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
                  ) : (
                    <Scale className="mb-1 h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
                  )}
                  <br />
                  {label}
                </th>
                {subjects.map((s, i) => {
                  const entry = s.dimensions[d.dimension];
                  if (!entry) {
                    return <td key={s.query} className={cn("p-3 text-center", subtleText, i === 0 && "bg-muted/40")} />;
                  }
                  return (
                    <td
                      key={s.query}
                      className={cn("p-3 align-top", i === 0 && "bg-muted/40")}
                      data-testid={`comparison-cell-${d.dimension}-${s.query}`}
                    >
                      <ComparisonCell entry={entry} />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
