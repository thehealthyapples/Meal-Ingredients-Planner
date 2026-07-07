// FI5 — Food Intelligence UI Activation: Food Opportunity card.
//
// Renders ONE Food Opportunity from the `opportunity-delivery` capability
// (OD1) using the same visual language as every other card in this system.
// Owns no intelligence — `explanation`/`evidence`/`suggestedAction` are
// rendered verbatim, never rephrased or re-derived.
//
// The two buttons are the opportunity's DELIVERY resolution (OD1's
// review/approve/delete verbs), never an autonomous action — no code path
// here adds a planner entry, removes a shopping item, or edits pantry state.
// `suggestedAction` is the plain-language "clear next action" a household
// member can take themselves.

import { Check, Sparkles, X } from "lucide-react";
import { IntelligenceCard } from "./IntelligenceCard";
import { bodyText, subtleText } from "./intelligence-tokens";
import type { FoodOpportunity } from "@/hooks/use-food-opportunities";

const DOMAIN_LABEL: Record<string, string> = {
  planner: "Planner",
  pantry: "Pantry",
  shopping: "Shopping list",
};

interface FoodOpportunityCardProps {
  opportunity: FoodOpportunity;
  onAccept?: (opportunity: FoodOpportunity) => void;
  onDismiss?: (opportunity: FoodOpportunity) => void;
  busy?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function FoodOpportunityCard({
  opportunity,
  onAccept,
  onDismiss,
  busy,
  className,
  ...rest
}: FoodOpportunityCardProps) {
  // Nothing to suggest → say nothing. Never invent an opportunity.
  if (!opportunity?.explanation) return null;

  const testId = rest["data-testid"] ?? "food-opportunity-card";

  return (
    <IntelligenceCard
      icon={<Sparkles className="h-4 w-4" />}
      eyebrow={DOMAIN_LABEL[opportunity.domain] ?? "Food"}
      body={opportunity.explanation}
      details={
        opportunity.evidence.length > 0 ? (
          <ul className="space-y-1">
            {opportunity.evidence.map((e, i) => (
              <li key={`${e.source}-${i}`} className={subtleText}>
                {e.detail}
              </li>
            ))}
          </ul>
        ) : undefined
      }
      detailsLabel="Why"
      className={className}
      data-testid={testId}
    >
      {/* Clear next action, in the household's own language — never executed automatically. */}
      <p className={bodyText} data-testid={`${testId}-suggested-action`}>
        {opportunity.suggestedAction}
      </p>

      {(onAccept || onDismiss) && (
        <div className="flex items-center gap-3 pt-0.5">
          {onAccept && (
            <button
              type="button"
              onClick={() => onAccept(opportunity)}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
              data-testid={`${testId}-accept`}
            >
              <Check className="h-3 w-3" /> Helpful
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(opportunity)}
              disabled={busy}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              data-testid={`${testId}-dismiss`}
            >
              <X className="h-3 w-3" /> Not now
            </button>
          )}
        </div>
      )}
    </IntelligenceCard>
  );
}
