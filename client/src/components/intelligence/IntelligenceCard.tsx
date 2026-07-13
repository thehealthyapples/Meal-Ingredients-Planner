// WX2_5 — Intelligence Experience System: generic card container.
//
// The base container every specific intelligence card builds on. It defines the
// calm surface, the title + icon header, an optional chip row, an optional
// action, and optional progressive disclosure of secondary detail.
//
// Presentation only. It owns no intelligence and fetches nothing. If it has no
// title and no body and no children, it renders nothing (progressive
// enrichment).

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  bodyText,
  cardPadding,
  cardStack,
  eyebrowText,
  focusRing,
  iconSize,
  iconTone,
  titleText,
} from "./intelligence-tokens";

export interface IntelligenceCardAction {
  label: string;
  onClick: () => void;
}

export interface IntelligenceCardProps {
  /** Card heading. */
  title?: string;
  /** Optional small uppercase eyebrow above the title (e.g. "In season"). */
  eyebrow?: string;
  /** Leading icon, tinted calm by default. */
  icon?: React.ReactNode;
  /** Primary body copy. Strings are styled for you; nodes are rendered as-is. */
  body?: React.ReactNode;
  /** Chip row (already-built chips, e.g. <IntelligenceChipGroup />). */
  chips?: React.ReactNode;
  /** Optional single action — rendered as a real, keyboard-reachable button. */
  action?: IntelligenceCardAction;
  /**
   * Optional secondary detail revealed via progressive disclosure. When
   * provided, a compact "More" toggle is shown. Keep primary cards compact and
   * push depth in here (Experience Rule 7).
   */
  details?: React.ReactNode;
  /** Label for the disclosure toggle. Defaults to "More". */
  detailsLabel?: string;
  /** Extra children rendered after body/chips (escape hatch for specific cards). */
  children?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function IntelligenceCard({
  title,
  eyebrow,
  icon,
  body,
  chips,
  action,
  details,
  detailsLabel = "More",
  children,
  className,
  ...rest
}: IntelligenceCardProps) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  // Progressive enrichment: a card with nothing to say disappears entirely.
  const hasContent =
    title || eyebrow || body || chips || action || details || children;
  if (!hasContent) return null;

  // PX1-W4.4 (fnd-px-nine-card-surfaces): this used to declare its own surface
  // (`intelligenceSurface`) beside `ui/card`'s — the ninth rival. It now COMPOSES
  // the canonical Card: one card surface, everywhere. `role="region"` keeps the
  // landmark the old <section> provided.
  return (
    <Card
      role="region"
      className={cn(cardPadding, cardStack, className)}
      aria-label={title ?? eyebrow}
      data-testid={rest["data-testid"]}
    >
      {/* Header: icon + (eyebrow / title) */}
      {(title || eyebrow || icon) && (
        <div className="flex items-start gap-3">
          {icon && (
            <span
              className={cn(
                "mt-0.5 flex-shrink-0 flex items-center justify-center",
                iconSize,
                iconTone,
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 space-y-0.5">
            {eyebrow && <p className={eyebrowText}>{eyebrow}</p>}
            {title && <p className={titleText}>{title}</p>}
          </div>
        </div>
      )}

      {/* Body */}
      {body &&
        (typeof body === "string" ? <p className={bodyText}>{body}</p> : body)}

      {/* Chips */}
      {chips}

      {/* Escape-hatch children */}
      {children}

      {/* Action */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-md",
            focusRing,
          )}
          data-testid={
            rest["data-testid"] ? `${rest["data-testid"]}-action` : undefined
          }
        >
          {action.label}
        </button>
      )}

      {/* Progressive disclosure */}
      {details && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailsId}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md",
              focusRing,
            )}
          >
            {detailsLabel}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
          {open && (
            <div id={detailsId} className={cn("mt-2", bodyText)}>
              {details}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
