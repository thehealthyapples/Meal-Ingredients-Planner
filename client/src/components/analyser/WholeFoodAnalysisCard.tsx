import { useMemo } from "react";
import { Link } from "wouter";
import { Leaf, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppleRating from "@/components/AppleRating";
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
  /**
   * FOODUI3 (2026-10-29) — the resolved canonical slug (same resolver the
   * Food Comparison engine and meal-ingredient resolution already use), when
   * one exists. This card used to duplicate a thin, mostly-generic summary
   * of what the real Food Intelligence page (/foods/:slug) already shows
   * properly (real nutrients, benefits, evidence) — it now recognises the
   * food and links straight there instead of re-describing it more thinly.
   * Null means no canonical match was found; the card still confirms
   * recognition and the household-restriction check without a dead link.
   */
  slug?: string | null;
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
  slug = null,
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
            <AppleRating rating={thaRating} sizePx={48} showTooltip={false} animate={false} />
          </div>
        </div>

        {/* ── THA classification note ── */}
        <p className="text-xs text-muted-foreground leading-relaxed" data-testid="whole-food-classification-note">
          Recognised by THA as a whole or minimally processed food. No packaged
          product lookup is required — whole foods score {thaRating}/5 by
          classification.
        </p>

        {/* ── FOODUI3 — the real profile lives at /foods/:slug (nutrients,
            benefits, evidence); this card confirms recognition and links
            there rather than duplicating a thinner summary of it. ── */}
        {slug ? (
          <Button asChild variant="outline" size="sm" className="gap-2" data-testid="link-whole-food-profile">
            <Link href={`/foods/${slug}`}>
              See full food profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground/70 italic" data-testid="text-whole-food-no-profile">
            No detailed food profile found for this name yet.
          </p>
        )}

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
