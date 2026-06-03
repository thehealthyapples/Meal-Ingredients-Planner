import { useMemo } from "react";
import { Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ScoreBadge from "@/components/ui/score-badge";
import RestrictionSafetyPanel from "@/components/analyser/RestrictionSafetyPanel";
import { computeRestrictionSafety } from "@shared/restrictions/restriction-safety";
import type { EaterProfile } from "@shared/restrictions/restriction-safety";

// ---------------------------------------------------------------------------
// WholeFoodAnalysisCard
//
// Displays a clearly-labelled "Whole Food Analysis" section for items that
// THA recognises as whole or minimally processed foods.
//
// This component intentionally uses ONLY language that reflects THA's own
// recognition logic — it never claims a product was "found" or "matched"
// in any database.
// ---------------------------------------------------------------------------

interface WholeFoodAnalysisCardProps {
  /** Display name of the food (e.g. "Apples", "Broccoli") */
  foodName: string;
  /** Apple Score — always 5 for recognised whole foods */
  thaRating?: number;
  /** Household eater profiles for restriction safety check */
  householdEaterProfiles?: EaterProfile[];
  className?: string;
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function WholeFoodAnalysisCard({
  foodName,
  thaRating = 5,
  householdEaterProfiles,
  className,
}: WholeFoodAnalysisCardProps) {
  const hasRestrictionsConfigured = (householdEaterProfiles ?? []).some(
    (p) => (p.hardRestrictions ?? []).length > 0,
  );

  // Restriction safety: use the food name as the sole ingredient token.
  // This is sufficient for whole foods — "sesame seeds" correctly triggers
  // sesame restrictions; "apples" correctly shows no flags.
  const restrictionSafetyResults = useMemo(() => {
    if (!hasRestrictionsConfigured) return [];
    const profiles = householdEaterProfiles ?? [];
    return computeRestrictionSafety([foodName.toLowerCase()], profiles);
  }, [foodName, householdEaterProfiles, hasRestrictionsConfigured]);

  const displayName = capitalizeFirst(foodName);

  return (
    <Card
      className={`border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20 ${className ?? ""}`}
      data-testid="whole-food-analysis-card"
    >
      <CardContent className="p-5 space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-green-700 dark:text-green-400">
            Whole Food Analysis
          </span>
        </div>

        {/* ── Food name + Apple Score ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p
              className="text-lg font-semibold text-foreground leading-snug"
              data-testid="whole-food-name"
            >
              {displayName}
            </p>
            <Badge
              className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 no-default-hover-elevate"
            >
              <Leaf className="h-2.5 w-2.5 mr-1" />
              Whole Food
            </Badge>
          </div>
          <div className="shrink-0 pt-0.5" data-testid="whole-food-score-badge">
            <ScoreBadge score={thaRating} size={48} />
          </div>
        </div>

        {/* ── Classification detail ── */}
        <div className="rounded-lg bg-green-100/60 dark:bg-green-900/20 border border-green-200/60 dark:border-green-800/40 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <span className="text-muted-foreground/70">Category</span>
              <p className="font-medium text-foreground mt-0.5">Whole Food</p>
            </div>
            <div>
              <span className="text-muted-foreground/70">Processing</span>
              <p className="font-medium text-green-700 dark:text-green-400 mt-0.5">None / Minimal</p>
            </div>
            <div>
              <span className="text-muted-foreground/70">Additives</span>
              <p className="font-medium text-foreground mt-0.5">None expected</p>
            </div>
            <div>
              <span className="text-muted-foreground/70">Apple Score</span>
              <p className="font-medium text-foreground mt-0.5">{thaRating} / 5</p>
            </div>
          </div>
        </div>

        {/* ── THA classification note ── */}
        <p className="text-xs text-muted-foreground leading-relaxed" data-testid="whole-food-classification-note">
          Recognised by THA as a whole or minimally processed food. No packaged
          product lookup is required — whole foods score {thaRating}/5 by
          classification.
        </p>

        {/* ── Restriction safety ── */}
        {hasRestrictionsConfigured && (
          <RestrictionSafetyPanel
            results={restrictionSafetyResults}
            hasRestrictionsConfigured={hasRestrictionsConfigured}
          />
        )}

      </CardContent>
    </Card>
  );
}
