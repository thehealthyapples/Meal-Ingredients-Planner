// WX2_5 — Intelligence Experience System: chips.
//
// One consistent chip used everywhere intelligence is summarised: nutrients,
// health benefits, seasonality, discoveries, household, planner. Colour is
// chosen by `kind` from the canonical palette in intelligence-tokens.ts, so the
// same kind of intelligence always looks the same on every page.
//
// Presentation only — chips render the text they are given and nothing else.

import { cn } from "@/lib/utils";
import {
  chipBase,
  chipGap,
  chipKindStyles,
  type IntelligenceChipKind,
} from "./intelligence-tokens";

// ── Single chip ───────────────────────────────────────────────────────────────

interface IntelligenceChipProps {
  /** The label to display. Required — an empty chip renders nothing. */
  label: string;
  /** Which canonical palette to use. */
  kind?: IntelligenceChipKind;
  className?: string;
  "data-testid"?: string;
}

export function IntelligenceChip({
  label,
  kind = "nutrient",
  className,
  ...rest
}: IntelligenceChipProps) {
  // Progressive enrichment: nothing to say → nothing rendered.
  if (!label) return null;

  return (
    <span
      className={cn(chipBase, chipKindStyles[kind], className)}
      data-testid={rest["data-testid"]}
    >
      {label}
    </span>
  );
}

// ── Chip group ────────────────────────────────────────────────────────────────

interface IntelligenceChipGroupProps {
  /** Labels to render as chips. Empty array → the group disappears. */
  items: string[];
  kind?: IntelligenceChipKind;
  /** Optional cap so chip rows never overwhelm a compact card. */
  max?: number;
  /** Accessible label for the group of chips. */
  "aria-label"?: string;
  className?: string;
  "data-testid"?: string;
}

export function IntelligenceChipGroup({
  items,
  kind = "nutrient",
  max,
  className,
  ...rest
}: IntelligenceChipGroupProps) {
  const visible = typeof max === "number" ? items.slice(0, max) : items;

  // Progressive enrichment: no validated items → render nothing.
  if (visible.length === 0) return null;

  const overflow = items.length - visible.length;

  return (
    <div
      className={cn("flex flex-wrap items-center", chipGap, className)}
      role="list"
      aria-label={rest["aria-label"]}
      data-testid={rest["data-testid"]}
    >
      {visible.map((label) => (
        <span role="listitem" key={`${kind}-${label}`}>
          <IntelligenceChip label={label} kind={kind} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          role="listitem"
          className="text-[10px] text-muted-foreground/70 px-1 leading-none"
          aria-label={`${overflow} more`}
        >
          +{overflow} more
        </span>
      )}
    </div>
  );
}
