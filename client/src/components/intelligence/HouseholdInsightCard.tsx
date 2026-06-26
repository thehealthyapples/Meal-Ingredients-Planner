// WX2_5 — Intelligence Experience System: Household Insight card.
//
// Surfaces ONE meaningful household observation. Examples: favourite foods,
// forgotten foods, cooking habits.
//
// Trust: only validated evidence. With no headline the card renders nothing.

import { Heart } from "lucide-react";
import { IntelligenceCard, type IntelligenceCardAction } from "./IntelligenceCard";
import { IntelligenceChipGroup } from "./IntelligenceChip";

interface HouseholdInsightCardProps {
  /** The observation, already phrased warmly by the caller. */
  headline?: string | null;
  /** Optional supporting foods (e.g. the favourites being referenced). */
  items?: string[];
  /** Cap to keep the card compact. */
  maxItems?: number;
  /** Optional single action. */
  action?: IntelligenceCardAction;
  className?: string;
  "data-testid"?: string;
}

export function HouseholdInsightCard({
  headline,
  items = [],
  maxItems = 6,
  action,
  className,
  ...rest
}: HouseholdInsightCardProps) {
  // Only surface observations backed by validated evidence.
  if (!headline) return null;

  return (
    <IntelligenceCard
      icon={<Heart className="h-4 w-4" />}
      eyebrow="Your kitchen"
      body={headline}
      chips={
        items.length > 0 ? (
          <IntelligenceChipGroup
            items={items}
            kind="household"
            max={maxItems}
            aria-label="Household foods"
          />
        ) : undefined
      }
      action={action}
      className={className}
      data-testid={rest["data-testid"] ?? "intelligence-household-insight"}
    />
  );
}
