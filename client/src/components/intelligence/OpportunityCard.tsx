// WX2_5 — Intelligence Experience System: Opportunity card.
//
// Surfaces ONE simple, actionable improvement (Experience Rule 2). Only a single
// primary opportunity should ever be shown.
//
// Trust & tone: never shame the user (Experience Rule 4). Framing is always
// invitational — "You could…", never "You failed". With no validated
// opportunity the card renders nothing.

import { Compass } from "lucide-react";
import { IntelligenceCard, type IntelligenceCardAction } from "./IntelligenceCard";

interface OpportunityCardProps {
  /** The single, gentle suggestion. Required & validated by the caller. */
  text?: string | null;
  /** Optional supporting "why", revealed via progressive disclosure. */
  why?: string | null;
  /** Optional single action (e.g. "Add to this week"). */
  action?: IntelligenceCardAction;
  className?: string;
  "data-testid"?: string;
}

export function OpportunityCard({
  text,
  why,
  action,
  className,
  ...rest
}: OpportunityCardProps) {
  // Nothing to suggest → say nothing. Never invent an opportunity.
  if (!text) return null;

  return (
    <IntelligenceCard
      icon={<Compass className="h-4 w-4" />}
      eyebrow="You could"
      body={text}
      details={why ?? undefined}
      detailsLabel="Why"
      action={action}
      className={className}
      data-testid={rest["data-testid"] ?? "intelligence-opportunity"}
    />
  );
}
