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
import { useQuery } from "@tanstack/react-query";
import { Scale, Home, Info, CheckCircle2, CircleDashed, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import AppleRating from "@/components/AppleRating";
import { nutrientSlugForDisplayName } from "@shared/canonical/food-report-adapter";
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
  /** 2026-11-02 — the real 1-5 Apple Score number, appleScore dimension only. See the server-side mirror's own note. */
  rating?: number;
}

export interface ComparisonSubject {
  query: string;
  kind: "canonical-food" | "scanned-product" | "live-product" | "unresolved";
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

// Shared by FoodComparisonView's own table and WeekFoodExplorer's split-column
// Compare tab (SubjectComparisonPanel below) — one definition of dimension
// order/filtering so the two surfaces never drift.
export function orderedComparisonDimensions(bundle: FoodComparisonBundle): ComparisonDimensionOutcome[] {
  return DIMENSION_ORDER.map((key) => bundle.dimensions.find((d) => d.dimension === key)).filter(
    (d): d is ComparisonDimensionOutcome => !!d,
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

// Split out of FoodComparisonView (which still renders it first, unchanged)
// so WeekFoodExplorer's Compare tab can place the same verdict next to the
// item inputs in its own column instead of stacked above a specific food's
// panel — see WeekFoodExplorer's comment on this (2026-11-01): the verdict is
// a comparison-level fact, not something that belongs attached to whichever
// subject happens to render first.
export function ComparisonVerdict({
  recommendation,
  recommendationGap,
  trust,
}: {
  recommendation: ComparisonRecommendation | null;
  recommendationGap: string | null;
  trust: FoodComparisonBundle["trust"];
}) {
  return (
    <div className="space-y-2.5" data-testid="comparison-verdict">
      {recommendation ? (
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
            {recommendation.name}
          </p>
          {recommendation.basis.length > 0 && (
            <ul className="space-y-1">
              {recommendation.basis.map((reason) => (
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
            recommendationGap ??
            "No dimension produced a grounded, safety-cleared difference between these."
          }
          data-testid="comparison-no-recommendation"
        />
      )}

      <div className="flex items-center gap-1.5" data-testid="comparison-scope">
        <Home className={cn("h-3 w-3", trust.householdAware ? semanticText.positive : "text-muted-foreground/50")} aria-hidden="true" />
        <p className={subtleText}>
          {trust.householdAware
            ? "Weighed against your household's restrictions and what you already cook."
            : "General comparison — no household context was applied."}
        </p>
      </div>
    </div>
  );
}

export function FoodComparisonView({ bundle }: { bundle: FoodComparisonBundle }) {
  const resolved = bundle.subjects.filter((s) => s.kind !== "unresolved");
  const unresolved = bundle.subjects.filter((s) => s.kind === "unresolved");

  const orderedDimensions = orderedComparisonDimensions(bundle);

  return (
    <div className="space-y-4" data-testid="food-comparison">
      {/* ── The verdict: the one thing a household came here to learn ── */}
      <ComparisonVerdict
        recommendation={bundle.recommendation}
        recommendationGap={bundle.recommendationGap}
        trust={bundle.trust}
      />

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
// 2026-11-01 (owner) — "all the WHY dont really show much more": "Why?" used
// to un-clamp a summary sentence that was rarely actually clamped, then hide
// the real citation behind a SECOND interaction (hover a small icon) that,
// even then, only named which owner it came from ("THA's whole-food list"),
// never what that owner actually said. `evidence[].fact` — the specific
// grounding detail — existed in the data the whole time but was never
// rendered anywhere. This shows it directly, in the same click that reveals
// the summary, so "Why?" is substance, not a second door to knock on.
function EvidenceList({ evidence }: { evidence: readonly ComparisonEvidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <ul className="mt-1.5 space-y-1 border-l-2 border-border/40 pl-2.5" data-testid="comparison-cell-evidence">
      {evidence.map((e, i) => (
        <li key={i} className="text-xs leading-snug text-muted-foreground/80">
          <span className="font-medium text-muted-foreground">{e.owner}:</span> {e.fact}
        </li>
      ))}
    </ul>
  );
}

// FOODUI14 — one subject's own comparison data as a standalone vertical
// panel (header, then each dimension stacked), instead of one cell in a
// shared table. WeekFoodExplorer's Compare tab puts every resolved subject
// side by side in its own column (one per subject, like any other food
// detail column on that page) rather than nesting them inside one table
// squeezed into a single column — so this renders the SAME per-subject data
// ComparisonTable renders, just shaped as a column instead of a table row
// slice.
//
// 2026-11-01 (owner) — the verdict ("the summary") used to render at the top
// of this panel for the first subject; the owner didn't want it stacked
// above one food's own name, since it's a comparison-level fact, not that
// food's. It now lives in WeekFoodExplorer's own column 1, below the item
// inputs, as ComparisonVerdict — this panel no longer knows about it at all.
export function SubjectComparisonPanel({
  subject,
  dimensions,
  expandedDimensions,
  onToggleDimension,
}: {
  subject: ComparisonSubject;
  dimensions: ComparisonDimensionOutcome[];
  /** Keyed by dimension, shared by every column the caller renders, so
   *  expanding one food's "Why?" expands the same dimension for every other
   *  food being compared too. */
  expandedDimensions: ReadonlySet<ComparisonDimensionKey>;
  onToggleDimension: (dimension: ComparisonDimensionKey) => void;
}) {
  return (
    <div className="space-y-4" data-testid={`comparison-subject-${subject.query}`}>
      {/* Column header — same shape as any other food column on this page. */}
      <div>
        <h2 className="text-xl font-semibold" data-testid="comparison-subject-name">
          {subjectLabel(subject)}
        </h2>
        {subject.category && <p className="text-sm text-muted-foreground">{subject.category}</p>}
      </div>

      <div className="space-y-3">
        {dimensions.map((d) => {
          const entry = subject.dimensions[d.dimension];
          const label = DIMENSION_LABEL[d.dimension];
          return (
            <div key={d.dimension} data-testid={`comparison-subject-${subject.query}-${d.dimension}`}>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                {d.dimension === "householdSuitability" ? (
                  <Home className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Scale className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {label}
              </p>
              {entry ? (
                <ComparisonCell
                  entry={entry}
                  dimension={d.dimension}
                  expanded={expandedDimensions.has(d.dimension)}
                  onToggle={() => onToggleDimension(d.dimension)}
                />
              ) : (
                <p className={cn(subtleText, "italic")}>No data yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface NutrientPillDetail {
  nutrient: { slug: string; name: string; description: string | null; category: string | null };
  benefits: Array<{ slug: string; name: string; icon: string | null }>;
}

// 2026-11-01 (owner) — "nutrition should be in the pills, but clickable...
// listed alphabetically, vertically". A nutrient name on its own doesn't say
// anything a household can act on; this makes it a real control that reveals
// what the nutrient actually does, using the exact same
// GET /api/knowledge/nutrients/:slug data WeekFoodExplorer's own nutrient
// lookup already reads — lazily, per pill, only once clicked, so comparing
// doesn't fire a fetch for every nutrient nobody asked about. Benefit chips
// (the dimension's other `items` use, healthBenefits) keep the plain static
// chip below instead: there is no equivalent per-benefit detail endpoint to
// open, and a chip that looks clickable but does nothing is worse than one
// that doesn't.
function NutrientPill({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const slug = nutrientSlugForDisplayName(name);
  const { data, isFetching } = useQuery<NutrientPillDetail>({
    queryKey: ["/api/knowledge/nutrients", slug],
    queryFn: async () => {
      const response = await fetch(`/api/knowledge/nutrients/${encodeURIComponent(slug!)}`);
      if (!response.ok) throw new Error("Nutrient detail unavailable");
      return response.json() as Promise<NutrientPillDetail>;
    },
    enabled: open && !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!slug}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/70 disabled:cursor-default disabled:hover:bg-muted/40"
        data-testid={`comparison-nutrient-pill-${name}`}
      >
        {name}
        {slug && <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} aria-hidden="true" />}
      </button>
      {open && (
        <p className="mt-1 pl-1 text-xs leading-relaxed text-muted-foreground">
          {isFetching ? "Loading…" : data?.nutrient.description ?? "No description recorded for this nutrient yet."}
        </p>
      )}
    </div>
  );
}

// 2026-11-01 (owner) — "when expanding a why on one column the same why
// should expand in the other": expand/collapse used to be each cell's own
// local state, so "Why?" under Kale's "How processed" and Cucumber's "How
// processed" — the same dimension, two columns — toggled independently.
// Controlled now: the caller (SubjectComparisonPanel/ComparisonTable) owns
// one expanded-set keyed by dimension and every cell for that dimension,
// across every column, reads and toggles the SAME entry — so expanding one
// expands the reasoning for every food being compared at once.
function ComparisonCell({
  entry,
  dimension,
  expanded,
  onToggle,
}: {
  entry: ComparisonDimensionEntry;
  dimension: ComparisonDimensionKey;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (entry.status !== "evidence") {
    return <p className={cn(subtleText, "italic")}>{entry.gapReason ?? "No data yet."}</p>;
  }

  // 2026-11-02 (owner) — "apple score should be shown... with the top
  // single apple logo... this can have a why dropdown — but the comparison
  // is too wordy": the score was a full sentence by default ("Cucumber is a
  // whole food — THA scores whole foods 5/5 by classification...") with no
  // visual at all. The Analyser already has the real mark for this exact
  // number (AppleRating, the same apple-icon row WholeFoodAnalysisCard and
  // every scanned product use) — this renders that instead, compact by
  // default, with the full sentence one click away via "Why?" (same
  // default-compact/expand-for-prose pattern as the items/metrics branch
  // below, just for a dimension that's a rating rather than a list).
  if (entry.rating != null) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <AppleRating rating={entry.rating} size="small" showTooltip={false} animate={false} />
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            data-testid="comparison-cell-toggle"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
            {expanded ? "Less" : "Why?"}
          </button>
        </div>
        {expanded && (
          <>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">{entry.summary}</p>
            <EvidenceList evidence={entry.evidence} />
          </>
        )}
      </div>
    );
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
          dimension === "nutritionalProfile" ? (
            <div className="flex flex-col items-start gap-1">
              {[...entry.items].sort((a, b) => a.localeCompare(b)).map((item) => (
                <NutrientPill key={item} name={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {[...entry.items].sort((a, b) => a.localeCompare(b)).map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground/80"
                >
                  {item}
                </span>
              ))}
            </div>
          )
        )}
        <div className="mt-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            data-testid="comparison-cell-toggle"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
            {expanded ? "Less" : "Why?"}
          </button>
        </div>
        {expanded && (
          <>
            <p className="mt-1 text-sm leading-relaxed text-foreground/80">{entry.summary}</p>
            <EvidenceList evidence={entry.evidence} />
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className={cn("text-sm leading-relaxed", !expanded && "line-clamp-2")}>{entry.summary}</p>
      <div className="mt-1 flex items-center gap-1">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          data-testid="comparison-cell-toggle"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
          {expanded ? "Less" : "Why?"}
        </button>
      </div>
      {expanded && <EvidenceList evidence={entry.evidence} />}
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
  // Same shared, dimension-keyed expand state as SubjectComparisonPanel — a
  // row's "Why?" already sits in one shared row across every subject's
  // column here, so expanding one subject's cell expands the whole row.
  const [expandedDimensions, setExpandedDimensions] = useState<Set<ComparisonDimensionKey>>(new Set());
  const toggleDimension = (dimension: ComparisonDimensionKey) => {
    setExpandedDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(dimension)) next.delete(dimension);
      else next.add(dimension);
      return next;
    });
  };

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
                      <ComparisonCell
                        entry={entry}
                        dimension={d.dimension}
                        expanded={expandedDimensions.has(d.dimension)}
                        onToggle={() => toggleDimension(d.dimension)}
                      />
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
