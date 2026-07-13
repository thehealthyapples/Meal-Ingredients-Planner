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
// Calm, warm, optimistic — never clinical.
//
// PX1-W4.4: `intelligenceSurface` — a private border/background rivalling
// `ui/card`'s — is RETIRED (fnd-px-nine-card-surfaces). The card surface has
// exactly one owner, `components/ui/card.tsx`; `IntelligenceCard` composes it.
// This module keeps owning intelligence spacing, typography and tone.

/** Compact padding used by every intelligence card. */
export const cardPadding = "px-4 py-3";

/** Vertical rhythm between elements inside a card. */
export const cardStack = "space-y-2.5";

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

// ── Semantic surfaces (PX1-W4b, fnd-px-ad-hoc-semantic-tints) ────────────────
//
// The chip palette above was already the governed, dark-mode-verified answer to
// "what colour is this kind of intelligence". The same question was being answered
// again, independently, every time a SURFACE needed a tint: the Pantry hub reached
// for raw `amber-50/amber-200`, the shopping list for raw `blue-50/blue-200`, and
// the Dashboard for a hard-coded `hsl(132,14%,87%)` literal that did not exist in
// dark mode at all. Same meanings, different colours, per page.
//
// These are the same hues the chips already ship, promoted to surfaces so that a
// tint has ONE owner. They are keyed by MEANING, never by colour — a caller asks
// for `notice`, not for "amber", which is what stops the next page from deciding
// amber means something else.
//
// Colour law (UIA §10) is unchanged: colour is never the only signal. Every
// surface below pairs its tone with an icon and a text label at the call site.
//
// NOT a severity scale, and deliberately not an alarm: `destructive` is not a tone
// here. Alarm is reserved for genuine data loss or safety (EXP §14), which in THA
// means exactly one thing — the restriction conflict that `attentionPresentation`
// below owns. A food's processing score is information, not a safety event.

export type SemanticTone = "notice" | "info" | "positive";

/** Tinted surface (background + border) for each tone. */
export const semanticSurface: Record<SemanticTone, string> = {
  // Something worth reading before you decide. Warm amber — never red.
  notice:
    "bg-amber-50/60 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40",
  // Neutral, factual context: a comparison, an explanation, an alternative.
  info:
    "bg-blue-50/50 border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-800/40",
  // A good thing that has happened, or a food that scores well.
  positive:
    "bg-green-50/60 border-green-200/60 dark:bg-green-950/20 dark:border-green-800/40",
};

/** Foreground for a value or label sitting on the matching surface. */
export const semanticText: Record<SemanticTone, string> = {
  notice: "text-amber-700 dark:text-amber-400",
  info: "text-blue-700 dark:text-blue-400",
  positive: "text-green-800 dark:text-green-300",
};

/** Pill/chip built from a tone, for the pill groups that used raw palette classes. */
export const semanticPill: Record<SemanticTone, string> = {
  notice: `${chipBase} ${semanticSurface.notice} ${semanticText.notice}`,
  info: `${chipBase} ${semanticSurface.info} ${semanticText.info}`,
  positive: `${chipBase} ${semanticSurface.positive} ${semanticText.positive}`,
};

// ── Attention presentation (PHASE5C) ─────────────────────────────────────────
//
// The Decision Engine assigns every opportunity an AttentionLevel (ATTN1), ranks
// by it, and exempts `critical` from the delivery budget entirely. Until PHASE5C
// the cards received that level and rendered every opportunity identically — so
// the platform's ONLY safety-relevant signal (an allergen/restriction conflict on
// the shopping list, the sole member of the closed `critical` allowlist) looked
// exactly like "you haven't cooked your lentils yet".
//
// These tokens map an already-assigned attention level to a look. They DERIVE
// NOTHING: attention is producer-owned and is never re-computed here (DEC1 §3.3).
//
// Colour law: colour is never the only signal. Every level below pairs its tone
// with an icon AND a text label at the card, so meaning survives without colour.

export type AttentionPresentation = {
  /** Surface treatment, replacing the calm default where the level warrants it. */
  readonly surface: string;
  /** Icon tone. */
  readonly icon: string;
  /** Eyebrow tone. */
  readonly eyebrow: string;
  /** The label a household reads. Never a bare colour. */
  readonly label: string | null;
  /** Whether an ambient surface must open itself rather than stay collapsed. */
  readonly demandsAttention: boolean;
};

/**
 * `critical` is the only level that changes the calm default. It is deliberately
 * narrow: THA's closed allowlist has exactly one critical type, and it concerns a
 * named household member's stored hard restriction. Everything else stays quiet
 * (Experience: calm before capability).
 */
export const attentionPresentation: Record<string, AttentionPresentation> = {
  critical: {
    surface:
      "border-destructive/30 bg-destructive/5 dark:border-destructive/40 dark:bg-destructive/10",
    icon: "text-destructive",
    eyebrow: "text-destructive font-semibold",
    label: "Check before you buy",
    demandsAttention: true,
  },
  high: {
    surface: "border-border/50 bg-background/80",
    icon: iconTone,
    eyebrow: eyebrowText,
    label: null,
    demandsAttention: false,
  },
  medium: {
    surface: "",
    icon: iconTone,
    eyebrow: eyebrowText,
    label: null,
    demandsAttention: false,
  },
  low: {
    surface: "",
    icon: iconTone,
    eyebrow: eyebrowText,
    label: null,
    demandsAttention: false,
  },
};

/** An unknown level is an honest fallback to calm — never a guessed alarm. */
export function presentationFor(priority: string): AttentionPresentation {
  return attentionPresentation[priority] ?? attentionPresentation.low;
}
