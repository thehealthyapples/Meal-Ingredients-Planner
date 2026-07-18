// WX1A — Cookbook Meal Intelligence Surface.
//
// Presents assembled meal intelligence from MealIntelligenceAssembler
// in a compact format suitable for Cookbook meal cards.
//
// Trust rules (enforced here):
//   - Empty sections are hidden; no placeholder text is shown.
//   - No content is fabricated or estimated.
//   - Confidence percentages are not displayed.

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { type UpliftMatchResult } from "@/components/MealUpliftPanel";
import { Leaf, Sparkles, CalendarDays, Repeat2, Utensils } from "lucide-react";

// ── Types (mirror server MealIntelligence) ────────────────────────────────────

interface MealIntelligence {
  mealId: number;
  meal: { name: string } | null;
  healthBenefits: string[];
  seasonality: {
    seasonLabel: string;
    seasonalIngredients: Array<{ name: string; canonicalSlug: string }>;
  } | null;
  household: {
    plannerAppearanceCount: number;
    lastPlannerWeekNumber: number | null;
  } | null;
  // HOUSE_ACT3 — typed to the canonical UpliftMatchResult rather than a local
  // structural subset. The assembler already returns exactly this type
  // (meal-intelligence-assembler.ts:196), and meal-detail-page now feeds these
  // matches straight into SimplyBetterChoicesPanel, whose prop is
  // `UpliftMatchResult[]`. A narrower local shape here would have made the one
  // real consumer impossible to type without a cast.
  nutritionEnhancement: {
    matches: UpliftMatchResult[];
  } | null;
  /** Ingredient-resolution confidence ONLY — never a household or quality judgement. */
  trust: {
    totalIngredients: number;
    resolvedIngredients: number;
    confidenceLevel: "high" | "medium" | "low" | "unknown";
  } | null;
  foods: Array<{ canonicalName: string; canonicalSlug: string }>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCookbookMealIntelligence(
  mealId: number | null,
  enabled = true
) {
  return useQuery<MealIntelligence>({
    queryKey: ["/api/meals", mealId, "intelligence"],
    queryFn: async () => {
      const res = await fetch(`/api/meals/${mealId}/intelligence`);
      if (!res.ok) throw new Error("Failed to load meal intelligence");
      return res.json();
    },
    enabled: !!mealId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Strip component ───────────────────────────────────────────────────────────

interface Props {
  mealId: number;
  /** Pass true only when the user has opened the Intelligence tab — avoids N+1 fetches. */
  active: boolean;
  /**
   * Whether to show the nutrition-uplift line. Defaults to true. Surfaces that
   * already render an actionable uplift panel (e.g. the planner meal-detail
   * dialog with MealUpliftPanel) pass false to avoid showing the same
   * suggestion twice.
   */
  showUplift?: boolean;
}

export function CookbookMealIntelligenceStrip({
  mealId,
  active,
  showUplift = true,
}: Props) {
  const { data, isPending: isLoading } = useCookbookMealIntelligence(mealId, active);

  if (!active) return null;

  if (isLoading) {
    return (
      <div className="space-y-1.5 animate-pulse" data-testid={`intelligence-loading-${mealId}`}>
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    );
  }

  if (!data) return null;

  const benefits = data.healthBenefits.slice(0, 4);
  const seasonalItems = data.seasonality?.seasonalIngredients ?? [];
  const cookedCount = data.household?.plannerAppearanceCount ?? 0;
  const upliftSuggestion = data.nutritionEnhancement?.matches[0] ?? null;
  const canonicalFoods = data.foods.slice(0, 4);

  const hasBenefits = benefits.length > 0;
  const hasSeasonal = seasonalItems.length > 0;
  const hasHousehold = cookedCount > 0;
  const hasUplift = showUplift && !!upliftSuggestion;
  const hasFoods = canonicalFoods.length > 0;
  const hasAnything = hasBenefits || hasSeasonal || hasHousehold || hasUplift || hasFoods;

  if (!hasAnything) return null;

  return (
    <div
      className="space-y-2"
      data-testid={`intelligence-strip-${mealId}`}
    >
      {hasBenefits && (
        <div data-testid={`intelligence-benefits-${mealId}`}>
          <div className="flex items-center gap-1 mb-1">
            <Leaf className="h-3 w-3 text-green-600/70 shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Supports
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {benefits.map((b) => (
              <span
                key={b}
                className="inline-block text-[10px] bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50 rounded-full px-2 py-0.5 leading-none"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasFoods && (
        <div data-testid={`intelligence-foods-${mealId}`}>
          <div className="flex items-center gap-1 mb-1">
            <Utensils className="h-3 w-3 text-primary/50 shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Introduces
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {canonicalFoods.map((f) => (
              // Slug comes from the canonical resolver, so the food page is
              // guaranteed to exist — safe to link.
              <Link
                key={f.canonicalSlug}
                href={`/foods/${f.canonicalSlug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-block text-[10px] bg-primary/5 text-foreground/70 hover:text-foreground hover:bg-primary/10 border border-border/60 rounded-full px-2 py-0.5 leading-none transition-colors"
                data-testid={`food-link-${f.canonicalSlug}`}
              >
                {f.canonicalName}
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasSeasonal && (
        <div
          className="flex items-start gap-1.5"
          data-testid={`intelligence-seasonal-${mealId}`}
        >
          <CalendarDays className="h-3 w-3 text-amber-500/80 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-tight">
            <span className="font-medium text-foreground/80">
              {seasonalItems[0].name}
            </span>
            {seasonalItems.length > 1 && (
              <> &amp; {seasonalItems.length - 1} more</>
            )}{" "}
            in season now
          </p>
        </div>
      )}

      {hasHousehold && (
        <div
          className="flex items-center gap-1.5"
          data-testid={`intelligence-household-${mealId}`}
        >
          <Repeat2 className="h-3 w-3 text-primary/50 shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            Cooked{" "}
            <span className="font-medium text-foreground/80">
              {cookedCount} {cookedCount === 1 ? "time" : "times"}
            </span>
          </p>
        </div>
      )}

      {hasUplift && upliftSuggestion.suggestions[0] && (
        <div
          className="flex items-start gap-1.5"
          data-testid={`intelligence-uplift-${mealId}`}
        >
          <Sparkles className="h-3 w-3 text-primary/60 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-tight">
            {upliftSuggestion.suggestions[0].why}
          </p>
        </div>
      )}
    </div>
  );
}
