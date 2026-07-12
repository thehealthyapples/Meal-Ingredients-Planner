import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AdaptiveDensity } from "@/hooks/use-adaptive-density";
import { densityClasses } from "@/lib/density-tokens";
import { type UpliftMatchResult } from "@/components/MealUpliftPanel";

interface SimplyBetterChoicesPanelProps {
  mealName: string;
  upliftMatches?: UpliftMatchResult[];
  density: AdaptiveDensity;
  onExpand?: () => void;
}

export function SimplyBetterChoicesPanel({
  mealName,
  upliftMatches = [],
  density,
  onExpand,
}: SimplyBetterChoicesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) onExpand?.();
  };

  const suggestionCount = upliftMatches.reduce((acc, m) => acc + m.suggestions.length, 0);

  // PX1-W1 (fnd-px-meal-detail-dead-spacing): shared ladder from lib/density-tokens.
  const { padding: paddingClass, stack: stackClass, title: titleSizeClass, text: textSizeClass } = densityClasses(density);

  return (
    <Card className="border-border/40">
      <CardHeader className={paddingClass}>
        <div className="flex items-center justify-between">
          <CardTitle className={titleSizeClass}>
            Simply Better Choices
            {suggestionCount > 0 && (
              <span className="text-muted-foreground ml-2 font-normal text-sm">
                ({suggestionCount})
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleToggle}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {!isOpen && (
        <CardContent className={paddingClass}>
          <p className={`${textSizeClass} text-muted-foreground`}>
            Simple ways to make this meal even healthier
          </p>
        </CardContent>
      )}

      {isOpen && (
        <CardContent className={`${paddingClass} ${stackClass} pt-0`}>
          {suggestionCount === 0 ? (
            <p className={`${textSizeClass} text-muted-foreground italic`}>
              No suggestions available yet.
            </p>
          ) : (
            <div className={stackClass}>
              {upliftMatches.map(match =>
                match.suggestions.map((suggestion, i) => (
                  <div
                    key={`${match.ruleId}-${i}`}
                    className="border border-border/40 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <Leaf className={`h-4 w-4 mt-0.5 shrink-0 ${
                        match.confidence === "high" ? "text-green-600" : "text-amber-600"
                      }`} />
                      <div className="flex-1">
                        <p className={`${textSizeClass} font-medium`}>
                          {suggestion.ingredient}
                        </p>
                        {suggestion.quantity && (
                          <p className={`${textSizeClass} text-muted-foreground`}>
                            {suggestion.quantity}
                          </p>
                        )}
                      </div>
                    </div>

                    {suggestion.why && (
                      <p className={`${textSizeClass} text-muted-foreground`}>
                        {suggestion.why}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        + Add
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        − Remove
                      </Button>
                      <span className={`${textSizeClass} text-muted-foreground ml-auto`}>
                        Already used this week
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
