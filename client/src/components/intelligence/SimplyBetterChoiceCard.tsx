// WX2_5 — Intelligence Experience System: Simply Better Choice card.
//
// Presents ONE nutrition enhancement, derived from the existing Nutrition
// Enhancement owner. This card NEVER generates a recommendation itself — it only
// presents a suggestion the caller has already produced.
//
// Trust & tone: framed as an easy, optional upgrade — never a correction. With
// no suggestion the card renders nothing.

import { Salad } from "lucide-react";
import { IntelligenceCard, type IntelligenceCardAction } from "./IntelligenceCard";

interface SimplyBetterChoiceCardProps {
  /** The suggested change, e.g. "Swap white rice for brown". Required. */
  suggestion?: string | null;
  /** The validated "why" from Nutrition Enhancement, shown via disclosure. */
  why?: string | null;
  /** Optional single action (e.g. "Make the swap"). */
  action?: IntelligenceCardAction;
  className?: string;
  "data-testid"?: string;
}

export function SimplyBetterChoiceCard({
  suggestion,
  why,
  action,
  className,
  ...rest
}: SimplyBetterChoiceCardProps) {
  // Present only — never invent a recommendation.
  if (!suggestion) return null;

  return (
    <IntelligenceCard
      icon={<Salad className="h-4 w-4" />}
      eyebrow="Simply better"
      body={suggestion}
      details={why ?? undefined}
      detailsLabel="Why"
      action={action}
      className={className}
      data-testid={rest["data-testid"] ?? "intelligence-simply-better"}
    />
  );
}
