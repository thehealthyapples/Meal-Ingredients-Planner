// PX1-W4.8 — the canonical owner of "there is nothing here" (fnd-px-no-empty-state-owner).
//
// UIA §17 names the empty state as a concern requiring an owner; PX1 found ≥20
// hand-rolled treatments (vertical padding spanning py-0.5→py-20, five icon
// treatments) and no owner — the only named EmptyState in the client was private
// to PantryKnowledgeHub and doubled as a loading state, so empty and loading
// rendered identically.
//
// The shape is promoted from the Dashboard's empty cards — "the best-designed
// empty states in the codebase" (PX1 §5) — and the semantics from the Pantry hub,
// the only surface that already separated the three truths an absence can mean.
//
// The `variant` discriminator makes it structurally impossible to render
// "you have nothing" when the truth is "we could not load this":
//
//   "empty"       — there is truly nothing yet. Invites the first action.
//   "filtered"    — things exist; the current search or filter hides them.
//   "unavailable" — the thing exists but has nothing to show here. Not an error.
//
// A failed load is none of these. That is `LoadError`'s sentence, and this
// component has no variant with which to say it. Loading is `Skeleton`'s.
// (EXP §12 — never fabricate; EXP §14 — say what happened.)

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Which truth this absence is. There is deliberately no "error" variant. */
  variant: "empty" | "filtered" | "unavailable";
  /** One short sentence naming the absence: "No meals yet". */
  title: string;
  /** What it means, or what to do about it. */
  description?: string;
  icon?: LucideIcon;
  /** The one next action ("Add Your First Meal"), usually a Button in a Link. */
  action?: ReactNode;
  /** Compact fits inside list rows and panels; full is a page-section card. */
  size?: "full" | "compact";
  className?: string;
  "data-testid"?: string;
}

export function EmptyState({
  variant,
  title,
  description,
  icon: Icon,
  action,
  size = "full",
  className,
  "data-testid": testId = "empty-state",
}: EmptyStateProps) {
  if (size === "compact" || variant === "filtered") {
    // The Pantry hub's compact treatment: one quiet line, no ceremony. A filter
    // hiding everything is not an event worth a card.
    return (
      <div
        className={cn("text-center py-6 px-4", className)}
        data-testid={testId}
        data-variant={variant}
      >
        {Icon && (
          <Icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground/50" aria-hidden="true" />
        )}
        <p className="text-sm text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/80 mt-1">{description}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  // The Dashboard shape: dashed card, tinted icon chip, title, one sentence,
  // one action. `border-dashed` is the resting mark of "nothing here yet" —
  // visually distinct from LoadError's solid card at a glance.
  return (
    <Card className={cn("border-dashed", className)} data-testid={testId} data-variant={variant}>
      <CardContent className="py-6 text-center">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 bg-primary/10">
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
        )}
        <h3 className="font-semibold text-base">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </CardContent>
    </Card>
  );
}
