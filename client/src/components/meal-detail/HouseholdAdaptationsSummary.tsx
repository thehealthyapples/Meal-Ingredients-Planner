import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { type AdaptiveDensity } from "@/hooks/use-adaptive-density";
import { type Meal } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface EaterAdaptation {
  eaterName: string;
  status: "fully-compatible" | "minor-adjustment" | "easy-adaptation";
  primarySwap?: string;
  reason?: string;
  details?: {
    restrictions: string[];
    changes: Array<{ from: string; to: string }>;
    reasoning: string;
  };
}

interface HouseholdAdaptationsSummaryProps {
  meal: Meal;
  adaptations?: EaterAdaptation[];
  density: AdaptiveDensity;
}

export function HouseholdAdaptationsSummary({
  meal,
  adaptations,
  density,
}: HouseholdAdaptationsSummaryProps) {
  const [expandedEaters, setExpandedEaters] = useState<Set<string>>(new Set());

  const toggleEater = (eaterName: string) => {
    setExpandedEaters(prev => {
      const next = new Set(prev);
      if (next.has(eaterName)) next.delete(eaterName);
      else next.add(eaterName);
      return next;
    });
  };

  // Only render when real adaptation data has been provided
  if (!adaptations) return null;

  const displayedAdaptations: EaterAdaptation[] = adaptations;

  const paddingClass = density === "compact" ? "p-3 sm:p-4" : density === "comfortable" ? "p-4 md:p-5" : "p-5 lg:p-6";
  const gapClass = density === "compact" ? "gap-2" : density === "comfortable" ? "gap-3" : "gap-3 lg:gap-4";
  const titleSizeClass = density === "compact" ? "text-base" : density === "comfortable" ? "text-lg" : "text-lg lg:text-xl";
  const textSizeClass = density === "compact" ? "text-xs" : density === "comfortable" ? "text-sm" : "text-sm lg:text-base";

  const gridColsClass = density === "compact" ? "grid-cols-1" : density === "comfortable" ? "md:grid-cols-2" : "lg:grid-cols-2 xl:grid-cols-3";

  return (
    <Card className="border-border/40">
      <CardHeader className={paddingClass}>
        <CardTitle className={titleSizeClass}>Household Adaptations</CardTitle>
      </CardHeader>
      <CardContent className={`${paddingClass} space-y-${gapClass} pt-0`}>
        {displayedAdaptations.length === 0 ? (
          <p className={`${textSizeClass} text-muted-foreground italic`}>
            No household information available. Adaptations will appear here when connected.
          </p>
        ) : (
          <div className={`grid ${gridColsClass} gap-3`}>
            {displayedAdaptations.map(adaptation => (
              <div
                key={adaptation.eaterName}
                className="border border-border/40 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`${textSizeClass} font-medium`}>
                      {adaptation.eaterName}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {adaptation.status === "fully-compatible" ? (
                        <>
                          <Check className="h-3 w-3 text-green-600" />
                          <span className={`${textSizeClass} text-green-600`}>
                            Fully compatible
                          </span>
                        </>
                      ) : adaptation.status === "minor-adjustment" ? (
                        <>
                          <Check className="h-3 w-3 text-blue-600" />
                          <span className={`${textSizeClass} text-blue-600`}>
                            Minor adjustment
                          </span>
                          {adaptation.primarySwap && (
                            <span className={`${textSizeClass} text-muted-foreground`}>
                              {adaptation.primarySwap}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 text-amber-600" />
                          <span className={`${textSizeClass} text-amber-600`}>
                            Easy adaptation
                          </span>
                          {adaptation.primarySwap && (
                            <span className={`${textSizeClass} text-muted-foreground`}>
                              {adaptation.primarySwap}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {adaptation.details && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => toggleEater(adaptation.eaterName)}
                    >
                      {expandedEaters.has(adaptation.eaterName) ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>

                {expandedEaters.has(adaptation.eaterName) && adaptation.details && (
                  <div className={`${textSizeClass} space-y-2 pt-2 border-t border-border/40`}>
                    {adaptation.details.restrictions.length > 0 && (
                      <div>
                        <p className="font-medium text-muted-foreground">Why changes are needed:</p>
                        <ul className="text-xs space-y-1 mt-1">
                          {adaptation.details.restrictions.map((r, i) => (
                            <li key={i} className="text-muted-foreground">
                              • {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {adaptation.details.changes.length > 0 && (
                      <div>
                        <p className="font-medium text-muted-foreground">Changes needed:</p>
                        <ul className="text-xs space-y-1 mt-1">
                          {adaptation.details.changes.map((c, i) => (
                            <li key={i} className="text-muted-foreground">
                              {c.from} → {c.to}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {adaptation.details.reasoning && (
                      <div className="text-xs text-muted-foreground italic">
                        {adaptation.details.reasoning}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
