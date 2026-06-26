import React from "react";
import { type Meal, type MealDiet, type Diet, type MealAllergen } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { type AdaptiveDensity } from "@/hooks/use-adaptive-density";

interface MealTrustSummaryProps {
  meal: Meal;
  mealDiets: MealDiet[];
  allDiets: Diet[];
  allergens: MealAllergen[];
  density: AdaptiveDensity;
}

interface Reason {
  icon: JSX.Element;
  text: string;
}

export function MealTrustSummary({
  meal,
  mealDiets,
  allDiets,
  allergens,
  density,
}: MealTrustSummaryProps) {
  const reasons: Reason[] = [];

  // Reason 1: Category (if available)
  if (meal.categoryId) {
    reasons.push({
      icon: <Check className="h-4 w-4 text-green-600" />,
      text: "Great for a balanced meal plan",
    });
  }

  // Reason 2-N: Diet tags (up to 3 additional)
  const dietNames = mealDiets
    .slice(0, 3)
    .map(md => allDiets.find(d => d.id === md.dietId)?.name)
    .filter(Boolean);

  if (dietNames.length > 0) {
    dietNames.forEach(dietName => {
      reasons.push({
        icon: <Check className="h-4 w-4 text-green-600" />,
        text: `${dietName} friendly`,
      });
    });
  }

  // Reason: Allergen-free if applicable
  if (allergens.length === 0) {
    reasons.push({
      icon: <Check className="h-4 w-4 text-green-600" />,
      text: "No common allergens detected",
    });
  }

  // Cap at 6 reasons; skip the card entirely when no real reasons exist
  const displayedReasons = reasons.slice(0, 6);
  if (displayedReasons.length === 0) return null;
  const hiddenCount = reasons.length - displayedReasons.length;

  const paddingClass = density === "compact" ? "p-3 sm:p-4" : density === "comfortable" ? "p-4 md:p-5" : "p-5 lg:p-6";
  const gapClass = density === "compact" ? "gap-2" : density === "comfortable" ? "gap-3" : "gap-3 lg:gap-4";
  const titleSizeClass = density === "compact" ? "text-base" : density === "comfortable" ? "text-lg" : "text-lg lg:text-xl";
  const textSizeClass = density === "compact" ? "text-xs" : density === "comfortable" ? "text-sm" : "text-sm lg:text-base";

  return (
    <Card className="border-border/40">
      <CardHeader className={paddingClass}>
        <CardTitle className={titleSizeClass}>Why THA chose this</CardTitle>
      </CardHeader>
      <CardContent className={`${paddingClass} space-y-${gapClass} pt-0`}>
        <div className={`space-y-${gapClass}`}>
          {displayedReasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-2">
              {reason.icon}
              <span className={`${textSizeClass} leading-relaxed`}>{reason.text}</span>
            </div>
          ))}
        </div>
        {hiddenCount > 0 && (
          <button className={`text-xs text-muted-foreground hover:text-foreground transition-colors`}>
            +{hiddenCount} more reasons
          </button>
        )}
      </CardContent>
    </Card>
  );
}
