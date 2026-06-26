import { Link } from "wouter";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import { useWeekMealEntries } from "@/hooks/use-week-meal-entries";
import { PlantDiversityReport } from "@/components/PlantDiversityReport";
import { HouseholdNutritionCentre } from "@/components/HouseholdNutritionCentre";

/**
 * Household Nutrition Centre page (route: /plant-diversity).
 *
 * Full redesign from the former "30 Plants This Week" modal.
 * Shows what the household ate, how it contributes to nutrition,
 * and helps users broaden variety across the week.
 *
 * Two layers, both read-only over canonical owners:
 *  - HouseholdNutritionCentre — household-lifetime assembly (WX8). Self-fetches
 *    /api/nutrition-centre and hides entirely when no planner history exists.
 *  - PlantDiversityReport — the existing weekly view, preserved unchanged.
 *
 * Data resolved via useWeekMealEntries (shared query cache) — page is
 * deep-linkable and decoupled from planner component state.
 */
export default function PlantDiversityPage() {
  const { weekMeals, isLoading } = useWeekMealEntries();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      {/* Back to planner */}
      <Link
        href="/planner"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors mb-5"
        data-testid="link-back-to-planner"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to your week
      </Link>

      {/* Page hero */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1.5">
          <BarChart3 className="h-5 w-5 text-emerald-600/70 dark:text-emerald-400/70 flex-shrink-0" />
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-nutrition-report-title"
          >
            Household Nutrition Centre
          </h1>
        </div>
        <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-2xl">
          Understand what your household eats, how it supports your health, and
          discover ingredients to try next.
        </p>
      </div>

      {/* Household-lifetime Centre (WX8) — hides itself when no history exists */}
      <HouseholdNutritionCentre />

      {/* Weekly report — preserved unchanged below the Centre */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
          </div>
        ) : (
          <PlantDiversityReport weekMeals={weekMeals} />
        )}
      </div>
    </div>
  );
}
