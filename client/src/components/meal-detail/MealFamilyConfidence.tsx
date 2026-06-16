import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";
import { type AdaptiveDensity } from "@/hooks/use-adaptive-density";

interface MealFamilyConfidenceProps {
  householdCompatibilityPercent?: number;
  substitutionCount?: number;
  weeklyReuseFourWeeks?: number;
  density: AdaptiveDensity;
}

interface ConfidenceLevel {
  level: "very-high" | "high" | "moderate" | "low" | "getting-started";
  label: string;
  stars: number;
  colorClass: string;
  bgClass: string;
}

function calculateConfidence(
  compat?: number,
  subs?: number,
  reuse?: number
): ConfidenceLevel {
  // Simple algorithm: if we have limited data, show generic high confidence
  // Real algorithm will be implemented in Phase 2

  const hasData = compat !== undefined || subs !== undefined || reuse !== undefined;

  if (!hasData) {
    return {
      level: "high",
      label: "Great household match",
      stars: 4,
      colorClass: "text-green-600",
      bgClass: "bg-green-50 border-green-200",
    };
  }

  // Phase 2: Real calculation
  let score = 0.5; // Base score if we have some data
  if (compat !== undefined) score = Math.max(score, compat / 100);
  if (subs !== undefined) score = Math.max(score, Math.max(0, 1 - subs / 3) * 0.8);
  if (reuse !== undefined) score = Math.max(score, Math.min(reuse, 4) / 4);

  if (score >= 0.85) {
    return {
      level: "very-high",
      label: "Very high confidence",
      stars: 5,
      colorClass: "text-green-600",
      bgClass: "bg-green-50 border-green-200",
    };
  }
  if (score >= 0.70) {
    return {
      level: "high",
      label: "High confidence",
      stars: 4,
      colorClass: "text-green-600",
      bgClass: "bg-green-50 border-green-200",
    };
  }
  if (score >= 0.55) {
    return {
      level: "moderate",
      label: "Moderate confidence",
      stars: 3,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50 border-amber-200",
    };
  }
  if (score >= 0.40) {
    return {
      level: "low",
      label: "Low confidence",
      stars: 2,
      colorClass: "text-orange-600",
      bgClass: "bg-orange-50 border-orange-200",
    };
  }
  return {
    level: "getting-started",
    label: "Getting started",
    stars: 1,
    colorClass: "text-gray-600",
    bgClass: "bg-gray-50 border-gray-200",
  };
}

export function MealFamilyConfidence({
  householdCompatibilityPercent,
  substitutionCount,
  weeklyReuseFourWeeks,
  density,
}: MealFamilyConfidenceProps) {
  const confidence = calculateConfidence(
    householdCompatibilityPercent,
    substitutionCount,
    weeklyReuseFourWeeks
  );

  const paddingClass = density === "compact" ? "p-3 sm:p-4" : density === "comfortable" ? "p-4 md:p-5" : "p-5 lg:p-6";
  const gapClass = density === "compact" ? "gap-2" : density === "comfortable" ? "gap-3" : "gap-3 lg:gap-4";
  const titleSizeClass = density === "compact" ? "text-base" : density === "comfortable" ? "text-lg" : "text-lg lg:text-xl";
  const textSizeClass = density === "compact" ? "text-xs" : density === "comfortable" ? "text-sm" : "text-sm lg:text-base";
  const labelSizeClass = density === "compact" ? "text-sm" : density === "comfortable" ? "text-base" : "text-base lg:text-lg";

  return (
    <Card className={`border-2 ${confidence.bgClass}`}>
      <CardHeader className={paddingClass}>
        <CardTitle className={titleSizeClass}>Family Confidence</CardTitle>
      </CardHeader>
      <CardContent className={`${paddingClass} space-y-${gapClass} pt-0`}>
        <div className={`${labelSizeClass} font-semibold ${confidence.colorClass}`}>
          {confidence.label}
        </div>

        <div className={`space-y-${gapClass}`}>
          {householdCompatibilityPercent !== undefined && (
            <div className="flex items-start gap-2">
              <Check className={`h-4 w-4 ${confidence.colorClass} shrink-0 mt-0.5`} />
              <span className={`${textSizeClass} leading-relaxed`}>
                Fits {householdCompatibilityPercent}% of household
              </span>
            </div>
          )}

          {substitutionCount !== undefined && (
            <div className="flex items-start gap-2">
              {substitutionCount === 0 ? (
                <Check className={`h-4 w-4 ${confidence.colorClass} shrink-0 mt-0.5`} />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              )}
              <span className={`${textSizeClass} leading-relaxed`}>
                {substitutionCount === 0 ? "No substitutions required" : `${substitutionCount} substitution${substitutionCount !== 1 ? "s" : ""} needed`}
              </span>
            </div>
          )}

          {weeklyReuseFourWeeks !== undefined && (
            <div className="flex items-start gap-2">
              <Check className={`h-4 w-4 ${confidence.colorClass} shrink-0 mt-0.5`} />
              <span className={`${textSizeClass} leading-relaxed`}>
                {weeklyReuseFourWeeks === 0 ? "New to the family" : `Trusted choice — used ${weeklyReuseFourWeeks} time${weeklyReuseFourWeeks !== 1 ? "s" : ""} recently`}
              </span>
            </div>
          )}
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-1 pt-1">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`text-lg ${
                i < confidence.stars ? confidence.colorClass : "text-gray-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
