// FI5 — Food Intelligence UI Activation: Food Opportunity card.
// PHASE5C — Ambient Intelligence: the card now presents the attention level the
// Decision Engine already assigned, instead of discarding it.
//
// Renders ONE Food Opportunity from the `opportunity-delivery` capability
// (OD1) using the same visual language as every other card in this system.
// Owns no intelligence — `explanation`/`evidence`/`suggestedAction` are
// rendered verbatim, never rephrased or re-derived.
//
// ATTENTION (PHASE5C). `priority` is producer-assigned (ATTN1 invariant A1) and
// is read here VERBATIM — never re-derived, never inflated (DEC1 §3.3). Before
// PHASE5C this field arrived and was dropped, so THA's only safety-relevant
// signal — `shopping-restriction-conflict`, the sole member of the closed
// `critical` allowlist, raised when a product on the household's shopping list
// conflicts with a named member's stored hard restriction — rendered exactly like
// a `low` "you haven't cooked your lentils yet" nudge. It no longer does.
//
// Colour is never the only signal: the critical treatment is tone + icon + an
// explicit text label, so the meaning survives without colour entirely.
//
// The two buttons are the opportunity's DELIVERY resolution (OD1's
// review/approve/delete verbs), never an autonomous action — no code path
// here adds a planner entry, removes a shopping item, or edits pantry state.
// Surfacing never changes acting (ATTN1 A7): a critical card posts the same
// verbs at the same ConfirmationTier as every other card.
// `suggestedAction` is the plain-language "clear next action" a household
// member can take themselves.

import { Check, ShieldAlert, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IntelligenceCard } from "./IntelligenceCard";
import { bodyText, presentationFor, subtleText } from "./intelligence-tokens";
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
  const attention = presentationFor(opportunity.priority);
  const isCritical = attention.demandsAttention;

  return (
    <IntelligenceCard
      icon={
        isCritical ? (
          <ShieldAlert className="h-4 w-4 text-destructive" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )
      }
      // A critical opportunity says what it is before it says where it came from.
      eyebrow={attention.label ?? DOMAIN_LABEL[opportunity.domain] ?? "Food"}
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
      className={cn(attention.surface, className)}
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
              {/* "Helpful" is the wrong word for an allergen conflict. */}
              <Check className="h-3 w-3" /> {isCritical ? "Reviewed" : "Helpful"}
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
