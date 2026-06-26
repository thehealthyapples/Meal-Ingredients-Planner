// WX2_5 — Intelligence Experience System: visual tokens.
//
// Single source of truth for the *look* of intelligence across The Healthy
// Apples. Every component in this system reads its spacing, sizing, tone and
// colour from here, so the same intelligence always looks the same regardless
// of page (Experience Rule 8).
//
// This file owns NO intelligence. It contains styling constants only.

// ── Surface & layout ──────────────────────────────────────────────────────────
//
// Calm, warm, optimistic — never clinical. A soft translucent surface with a
// faint border, generous-but-compact padding, and a rounded silhouette.

export const intelligenceSurface =
  "rounded-xl border border-border/30 bg-background/60 backdrop-blur-sm";

/** Compact padding used by every intelligence card. */
export const cardPadding = "px-5 py-4";

/** Vertical rhythm between elements inside a card. */
export const cardStack = "space-y-3";

/** Gap between chips in a chip group. */
export const chipGap = "gap-1";

// ── Typography hierarchy ──────────────────────────────────────────────────────

/** Card title — quiet, confident, never shouty. */
export const titleText = "text-sm font-medium text-foreground tracking-tight";

/** Small eyebrow label above a group (e.g. "Supports", "In season"). */
export const eyebrowText =
  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60";

/** Body copy — warm and readable. */
export const bodyText = "text-sm text-foreground/80 leading-relaxed";

/** Secondary, lighter body copy. */
export const subtleText = "text-[11px] text-muted-foreground leading-tight";

// ── Iconography ───────────────────────────────────────────────────────────────

/** Inline icon size used throughout the system. */
export const iconSize = "h-4 w-4";

/** Smaller icon for dense contexts (eyebrows, chips). */
export const iconSizeSmall = "h-3 w-3";

/** Icons stay calm: reduced opacity, tinted toward the primary hue by default. */
export const iconTone = "text-primary/60";

// ── Focus & interaction ───────────────────────────────────────────────────────

/** Consistent, visible focus ring for every interactive element. */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// ── Chip palette ──────────────────────────────────────────────────────────────
//
// One canonical colour per kind of intelligence. These mirror the palette
// already shipped in the variety / benefit chips so contrast is known-good in
// both light and dark themes. Colour is never the only signal — chips always
// carry text, and cards always pair colour with an icon + label.

export type IntelligenceChipKind =
  | "nutrient"
  | "benefit"
  | "seasonal"
  | "discovery"
  | "household"
  | "planner";

/** Tailwind classes for each chip kind. */
export const chipKindStyles: Record<IntelligenceChipKind, string> = {
  // Nutrients — neutral, trustworthy primary tint.
  nutrient:
    "bg-primary/5 text-foreground/70 border-border/60",
  // Health benefits — green, the "good for you" hue.
  benefit:
    "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800/50",
  // Seasonality — warm amber.
  seasonal:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
  // Discoveries — optimistic violet.
  discovery:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60",
  // Household — warm rose, the "home" hue.
  household:
    "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
  // Planner — calm teal.
  planner:
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60",
};

/** Base chip shape, shared by every kind. */
export const chipBase =
  "inline-block whitespace-nowrap text-[10px] rounded-full border px-2 py-0.5 leading-none";
