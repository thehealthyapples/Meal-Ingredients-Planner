// WS2G — Food Report UI Foundation.
//
// Renders the canonical Food Report knowledge for a single food.
// Consumes buildFoodReport() from the WS2F adapter — no logic duplicated here.
//
// Sections rendered (in order):
//   Overview · Key Nutrients · Nutrition Context ·
//   Your Variety · Broaden Your Variety · Variety Additional Knowledge
//
// Rules:
//   • Returns null when buildFoodReport() returns null (no crash, no placeholders)
//   • Omits any section that has no data
//   • Never fabricates content
//   • Variety additional knowledge shown only when variety has unique facts
//
// KNOW4 — this component renders NO health benefits, and it is the absence that
// is deliberate. A benefit is a claim, and PKC Phase 0 admits a claim only with
// a valid SourceRef and a human `reviewedAt` sign-off — a database column no
// browser bundle can read. buildFoodReport() therefore returns no benefits, and
// a component that calls it in the browser has nothing it is entitled to say.
// The gated claims live behind getEvidenceBackedFoodReport() on the server; a
// surface that wants to render them must fetch them, not derive them here.

import { useMemo } from "react";
import { Check } from "lucide-react";
import {
  buildFoodReport,
  type FoodReportVariety,
} from "@shared/canonical/food-report-adapter";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FoodReportProps {
  /** WS2A canonical food slug, e.g. "tomato", "spinach". Returns null if not found. */
  canonicalSlug: string;
  /**
   * Display labels of varieties the household has already eaten (from WS2B).
   * Used to split "Your Variety" (eaten) vs "Broaden Your Variety" (uneaten).
   * When omitted, all varieties appear in "Broaden Your Variety".
   */
  eatenVarietyLabels?: readonly string[];
}

// ─── Variety Additional Knowledge ─────────────────────────────────────────────

function VarietyAdditionalKnowledge({ variety }: { variety: FoodReportVariety }) {
  // `variety.additionalBenefits` is always empty here (see the header note), so
  // only the nutrient half of a variety's extra knowledge can be shown.
  if (variety.additionalNutrients.length === 0) return null;

  return (
    <div
      className="mt-1.5 pl-2 border-l-2 border-border/30"
      data-testid={`variety-additional-${variety.slug}`}
    >
      <p className="text-[10px] text-muted-foreground/45 font-medium mb-1">
        Also in {variety.label}:
      </p>
      <div className="flex flex-wrap gap-1">
        {variety.additionalNutrients.map((n) => (
          <span
            key={n}
            className="inline-flex items-center px-1.5 py-px rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FoodReport({ canonicalSlug, eatenVarietyLabels }: FoodReportProps) {
  const report = useMemo(() => buildFoodReport(canonicalSlug), [canonicalSlug]);

  const { yourVarieties, broadenVarieties } = useMemo(() => {
    if (!report) return { yourVarieties: [], broadenVarieties: [] };
    const eatenSet = new Set(eatenVarietyLabels ?? []);
    return {
      yourVarieties: report.varieties.filter((v) => eatenSet.has(v.label)),
      broadenVarieties: report.varieties.filter((v) => !eatenSet.has(v.label)),
    };
  }, [report, eatenVarietyLabels]);

  if (!report) return null;

  const hasVarietyKnowledge = report.varieties.some((v) => v.additionalNutrients.length > 0);

  return (
    <div
      className="space-y-3"
      data-testid={`food-report-${canonicalSlug}`}
    >
      {/* Overview */}
      {report.overview.description && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1">
            About {report.overview.name}
          </p>
          <p className="text-xs text-foreground/65 leading-relaxed">
            {report.overview.description}
          </p>
        </div>
      )}

      {/* Key Nutrients */}
      {report.keyNutrients.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
            Key Nutrients
          </p>
          <div className="flex flex-wrap gap-1.5">
            {report.keyNutrients.map((n) => (
              <span
                key={n}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Health Benefits — deliberately absent. See the KNOW4 note in the header. */}

      {/* Nutrition Context */}
      {report.nutritionContext.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
            Nutrition Context
          </p>
          <ul className="space-y-1">
            {report.nutritionContext.map((note, i) => (
              <li key={i} className="text-xs text-foreground/65 leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Your Variety */}
      {yourVarieties.length > 0 && (
        <div data-testid={`variety-yours-${canonicalSlug}`}>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
            Your Variety
          </p>
          <div className="flex flex-wrap gap-1.5">
            {yourVarieties.map((v) => (
              <span
                key={v.slug}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
              >
                <Check className="h-2.5 w-2.5" aria-hidden="true" />
                {v.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Broaden Your Variety */}
      {broadenVarieties.length > 0 && (
        <div data-testid={`variety-broaden-${canonicalSlug}`}>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
            Broaden Your Variety
          </p>
          <div className="flex flex-wrap gap-1.5">
            {broadenVarieties.map((v) => (
              <span
                key={v.slug}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-muted/50 text-foreground/60 border border-border/40"
              >
                <span
                  className="h-2 w-2 rounded-full border border-muted-foreground/40"
                  aria-hidden="true"
                />
                {v.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Variety Additional Knowledge — only varieties with unique facts */}
      {hasVarietyKnowledge && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wide mb-1.5">
            What Each Variety Adds
          </p>
          <div className="space-y-2">
            {report.varieties.map((v) => (
              <VarietyAdditionalKnowledge key={v.slug} variety={v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
