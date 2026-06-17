import { Link } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useWeekMealEntries } from "@/hooks/use-week-meal-entries";
import { PlantDiversityReport } from "@/components/PlantDiversityReport";

/**
 * Plant Diversity Report page (route: /plant-diversity).
 *
 * The dedicated-page conversion of the former "30 Plants This Week" modal.
 * Reached from the planner's plant-diversity counter. Answers:
 *   "How did my meals contribute to this week's plant nutrition?"
 *
 * Data is resolved independently via useWeekMealEntries (shared query caches),
 * so the page is deep-linkable and decoupled from planner component state.
 */
export default function PlantDiversityPage() {
  const { weekMeals, isLoading } = useWeekMealEntries();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Back to planner */}
      <Link
        href="/planner"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors mb-3"
        data-testid="link-back-to-planner"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to your week
      </Link>

      <h1 className="text-xl font-semibold mb-4" data-testid="text-plant-diversity-title">
        Plant Diversity Report
      </h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
        </div>
      ) : (
        <PlantDiversityReport weekMeals={weekMeals} />
      )}
    </div>
  );
}
