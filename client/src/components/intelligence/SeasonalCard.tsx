// WX2_5 — Intelligence Experience System: Seasonal card.
//
// Highlights food currently worth enjoying. Only displays when validated
// seasonal intelligence exists.
//
// Trust: never fabricate a season. With no seasonal items the card renders
// nothing.

import { Sun } from "lucide-react";
import { IntelligenceCard, type IntelligenceCardAction } from "./IntelligenceCard";
import { IntelligenceChipGroup } from "./IntelligenceChip";

interface SeasonalCardProps {
  /** Headline, e.g. "In season now" or a seasonal arc title. */
  headline?: string | null;
  /** Validated seasonal foods worth enjoying. Empty → card disappears. */
  items?: string[];
  /** Cap to keep the card compact. */
  maxItems?: number;
  /** Optional single action (e.g. "Explore seasonal ideas"). */
  action?: IntelligenceCardAction;
  className?: string;
  "data-testid"?: string;
}

export function SeasonalCard({
  headline,
  items = [],
  maxItems = 6,
  action,
  className,
  ...rest
}: SeasonalCardProps) {
  // Require validated seasonal content — never imply a season we can't back up.
  if (items.length === 0) return null;

  return (
    <IntelligenceCard
      icon={<Sun className="h-4 w-4" />}
      eyebrow="In season"
      title={headline ?? undefined}
      chips={
        <IntelligenceChipGroup
          items={items}
          kind="seasonal"
          max={maxItems}
          aria-label="In season now"
        />
      }
      action={action}
      className={className}
      data-testid={rest["data-testid"] ?? "intelligence-seasonal"}
    />
  );
}
