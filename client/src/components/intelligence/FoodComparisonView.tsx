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

import { Scale, Home, Info, CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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

      {/* ── Dimension by dimension: the cited, decision-grade detail ── */}
      <div className="space-y-2.5">
        {orderedDimensions.map((d) => (
          <DimensionRow key={d.dimension} outcome={d} subjects={resolved} />
        ))}
      </div>

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

// One dimension: the cross-subject verdict, with each subject's cited fact behind
// a calm progressive-disclosure toggle.
function DimensionRow({
  outcome,
  subjects,
}: {
  outcome: ComparisonDimensionOutcome;
  subjects: ComparisonSubject[];
}) {
  const label = DIMENSION_LABEL[outcome.dimension];
  const perSubject = subjects
    .map((s) => ({ subject: s, entry: s.dimensions[outcome.dimension] }))
    .filter((x) => !!x.entry);

  const hasCitedDetail = perSubject.some(
    (x) => x.entry.status === "evidence" && x.entry.evidence.length > 0,
  );

  return (
    <IntelligenceCard
      icon={outcome.dimension === "householdSuitability" ? <Home className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
      eyebrow={label}
      body={
        outcome.comparable
          ? (outcome.outcome ?? undefined)
          : (outcome.gapReason ?? "Not enough evidence to compare this fairly.")
      }
      details={
        hasCitedDetail ? (
          <ul className="space-y-2">
            {perSubject.map(({ subject, entry }) => (
              <li key={subject.query}>
                <p className="text-xs font-medium text-foreground/80">{subjectLabel(subject)}</p>
                {entry.status === "evidence" ? (
                  <>
                    <p className={subtleText}>{entry.summary}</p>
                    {entry.evidence.map((e, i) => (
                      <p key={i} className={cn(subtleText, "text-muted-foreground/70")}>
                        {e.fact} <span className="text-muted-foreground/50">— {e.owner}</span>
                      </p>
                    ))}
                  </>
                ) : (
                  <p className={subtleText}>{entry.gapReason ?? "No data yet."}</p>
                )}
              </li>
            ))}
          </ul>
        ) : undefined
      }
      detailsLabel="Show the evidence"
      data-testid={`comparison-dimension-${outcome.dimension}`}
    />
  );
}
