// WX2_5 — Intelligence Experience System: Celebration card.
//
// Celebrates ONE genuine achievement (Experience Rule 1). Examples: a new food
// discovered, a plant milestone, a household achievement.
//
// Trust: never invent celebrations. With no validated achievement headline the
// card renders nothing.

import { Sparkles } from "lucide-react";
import { IntelligenceCard, type IntelligenceCardAction } from "./IntelligenceCard";

interface CelebrationCardProps {
  /** The single thing worth celebrating. Required & validated by the caller. */
  headline?: string | null;
  /** Optional warm supporting line. */
  detail?: string | null;
  /** Optional single action (e.g. "See your discoveries"). */
  action?: IntelligenceCardAction;
  className?: string;
  "data-testid"?: string;
}

export function CelebrationCard({
  headline,
  detail,
  action,
  className,
  ...rest
}: CelebrationCardProps) {
  // Never fabricate a celebration.
  if (!headline) return null;

  return (
    <IntelligenceCard
      icon={<Sparkles className="h-4 w-4" />}
      title={headline}
      body={detail ?? undefined}
      action={action}
      className={className}
      data-testid={rest["data-testid"] ?? "intelligence-celebration"}
    />
  );
}
