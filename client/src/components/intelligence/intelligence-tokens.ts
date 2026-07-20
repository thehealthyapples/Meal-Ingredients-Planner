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
  | "planner"
  | "preparation";

/** Tailwind classes for each chip kind. */
export const chipKindStyles: Record<IntelligenceChipKind, string> = {
  // Nutrients — neutral, trustworthy primary tint.
  nutrient:
    "bg-primary/5 text-foreground/70 border-border/60",
  // Health benefits — the HOUSE's green, the "good for you" hue.
  //
  // UX2: this was `green-50/800/200` + a four-class dark override — Tailwind's
  // green, not THA's. With the orchard green (hue 74) adopted as the canonical
  // platform primary, a benefit chip rendered in a *different* green was the
  // clearest remaining case of the product owning two greens and meaning the same
  // thing by both. `primary-tint` / `primary-ink` resolve per mode in index.css,
  // so the dark variants are gone rather than restated: one pairing, two hours.
  benefit:
    "bg-primary-tint text-primary-ink border-primary/20 dark:border-primary/30",
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
  // Preparation (SURF1A) — quiet stone. Deliberately the calmest tint in the
  // palette: how a food is prepared is a practical fact, not a health claim, and
  // it must never borrow the visual authority of the benefit or nutrient chips.
  preparation:
    "bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-900/50 dark:text-stone-300 dark:border-stone-700/60",
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
// here. Alarm is reserved for genuine data loss or safety (EXP §14). A food's
// processing score is information, not a safety event.

export type SemanticTone = "notice" | "info" | "positive";

/** Tinted surface (background + border) for each tone. */
export const semanticSurface: Record<SemanticTone, string> = {
  // Something worth reading before you decide. Warm amber — never red.
  notice:
    "bg-amber-50/60 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40",
  // Neutral, factual context: a comparison, an explanation, an alternative.
  info:
    "bg-blue-50/50 border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-800/40",
  // A good thing that has happened, or a food that scores well. UX2 — the house's
  // green, for the same reason as the `benefit` chip above: "good" is the one tone
  // in this palette that speaks with the platform's own voice, so it must speak in
  // the platform's own colour. `notice`, `info` and the chip hues are untouched —
  // they are wayfinding tints keyed to meanings the primary does not own.
  positive:
    "bg-primary-tint/60 border-primary/20 dark:bg-primary-tint/40 dark:border-primary/30",
};

/** Foreground for a value or label sitting on the matching surface. */
export const semanticText: Record<SemanticTone, string> = {
  notice: "text-amber-700 dark:text-amber-400",
  info: "text-blue-700 dark:text-blue-400",
  positive: "text-primary-ink",
};

/** Pill/chip built from a tone, for the pill groups that used raw palette classes. */
export const semanticPill: Record<SemanticTone, string> = {
  notice: `${chipBase} ${semanticSurface.notice} ${semanticText.notice}`,
  info: `${chipBase} ${semanticSurface.info} ${semanticText.info}`,
  positive: `${chipBase} ${semanticSurface.positive} ${semanticText.positive}`,
};
