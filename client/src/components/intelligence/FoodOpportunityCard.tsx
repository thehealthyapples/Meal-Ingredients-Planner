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

import { Check, HelpCircle, ShieldAlert, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IntelligenceCard } from "./IntelligenceCard";
import { bodyText, presentationFor, subtleText } from "./intelligence-tokens";
import { useAskCompanion } from "@/components/conversation/companion-context";
import type { FoodOpportunity } from "@/hooks/use-food-opportunities";
// MAT1 (AFI_VERIFY1 §4.3) — the domain labels are no longer re-declared here.
// They are the canonical shared registry, so the ONE test pipeline can assert
// that every registered domain has a label before a household ever sees a card
// fall through to the generic "Food". Rendering behaviour is unchanged.
import {
  OPPORTUNITY_DOMAIN_FALLBACK_LABEL,
  OPPORTUNITY_DOMAIN_LABELS,
} from "@shared/attention/index";

interface FoodOpportunityCardProps {
  opportunity: FoodOpportunity;
  onAccept?: (opportunity: FoodOpportunity) => void;
  onDismiss?: (opportunity: FoodOpportunity) => void;
  /**
   * PHASE5E — "seen, but not resolved". Non-terminal: the card stays. Fired when the
   * household asks the Companion about it (see `askWhy` below).
   */
  onAcknowledge?: (opportunity: FoodOpportunity) => void;
  busy?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function FoodOpportunityCard({
  opportunity,
  onAccept,
  onDismiss,
  onAcknowledge,
  busy,
  className,
  ...rest
}: FoodOpportunityCardProps) {
  const askCompanion = useAskCompanion();

  // Nothing to suggest → say nothing. Never invent an opportunity.
  if (!opportunity?.explanation) return null;

  const testId = rest["data-testid"] ?? "food-opportunity-card";
  const attention = presentationFor(opportunity.priority);
  const isCritical = attention.demandsAttention;

  /**
   * PHASE5E — "Why this?" — the affordance PHASE5D built, deleted, and left instructions
   * for. It is honest now for the reasons recorded in `companion-context.tsx`: the
   * question routes to `opportunity-delivery:explain`, which narrates the evidence the
   * Decision Engine ALREADY produced for THIS card. It invents no justification, and it
   * cannot silently answer about the domain instead.
   *
   * It also ACKNOWLEDGES the opportunity, and that is not a side effect — it is what
   * `acknowledged` means. The household has demonstrably seen this card and engaged with
   * it, without accepting or dismissing it. The verb has been plumbed end-to-end since
   * PHASE5B with no caller, so COACH1's "seen yields to unseen" ordering has never had a
   * signal to order by. Now it does. It is non-terminal (the card stays, because nothing
   * has been decided) and it emits NO Evidence — being seen is not an opinion, and must
   * never become one, or THA would learn from attention rather than from choice.
   */
  const askWhy = () => {
    onAcknowledge?.(opportunity);
    askCompanion({
      utterance: "Why are you suggesting this?",
      hints: { selectedOpportunityId: opportunity.id },
    });
  };

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
      eyebrow={
        attention.label ??
        OPPORTUNITY_DOMAIN_LABELS[opportunity.domain] ??
        OPPORTUNITY_DOMAIN_FALLBACK_LABEL
      }
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
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
          {/*
            The third action is a QUESTION, not a resolution — so it is styled as the
            quietest of the three and sits last. A household should never feel they must
            justify a suggestion to themselves before dismissing it.
          */}
          <button
            type="button"
            onClick={askWhy}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            data-testid={`${testId}-why`}
          >
            <HelpCircle className="h-3 w-3" /> Why this?
          </button>
        </div>
      )}
    </IntelligenceCard>
  );
}
