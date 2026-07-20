// PX1-W1 (fnd-px-meal-detail-dead-spacing) — the adaptive-density class ladder.
//
// This ladder was copy-pasted verbatim into four meal-detail components, which
// is how one bug replicated seven times: each copy interpolated its gap rung
// into `space-y-${gapClass}`, emitting the non-existent class `space-y-gap-2`
// and leaving the flagship meal surface with zero vertical rhythm.
//
// One owner now maps an AdaptiveDensity (owned by hooks/use-adaptive-density)
// to complete, real Tailwind class strings. Values are unchanged from the four
// copies — only the vertical-rhythm rung is expressed as the space-y-* classes
// the copies always intended. Full class names are written out literally so
// Tailwind's content scan can see them; never interpolate fragments of these.

import type { AdaptiveDensity } from "@/hooks/use-adaptive-density";

export interface DensityClasses {
  /** Card section padding (CardHeader / CardContent). */
  padding: string;
  /** Vertical rhythm between stacked children — a complete space-y-* string. */
  stack: string;
  /** Card title size. */
  title: string;
  /** Body text size. */
  text: string;
}

const DENSITY_CLASSES: Record<AdaptiveDensity, DensityClasses> = {
  compact: {
    padding: "p-3 sm:p-4",
    stack: "space-y-2",
    title: "text-base",
    text: "text-xs",
  },
  comfortable: {
    padding: "p-4 md:p-5",
    stack: "space-y-3",
    title: "text-lg",
    text: "text-sm",
  },
  expanded: {
    padding: "p-5 lg:p-6",
    stack: "space-y-3 lg:space-y-4",
    title: "text-lg lg:text-xl",
    text: "text-sm lg:text-base",
  },
  // UX3 — the fourth rung, for genuinely large desktops (≥ 1920, the one `3xl`
  // breakpoint truth). NOTE WHAT IS AND IS NOT DIFFERENT FROM `expanded`:
  //
  //   padding  ↑   more air around the content
  //   stack    ↑   more room between things
  //   title    =   IDENTICAL
  //   text     =   IDENTICAL
  //
  // The type scale is deliberately untouched, and that is the whole idea. A 32-inch
  // monitor does not mean the household's eyes moved further away, so growing the
  // type would be the room "simply becoming bigger" — the failure the brief names.
  // What a large room actually earns is BREATHING SPACE: the same well-proportioned
  // furniture, with more air around it. Reading comfort improves because the measure
  // stays calm and the surroundings quieten, never because the words got larger.
  spacious: {
    padding: "p-6 3xl:p-8",
    stack: "space-y-4 3xl:space-y-6",
    title: "text-lg lg:text-xl",
    text: "text-sm lg:text-base",
  },
};

export function densityClasses(density: AdaptiveDensity): DensityClasses {
  return DENSITY_CLASSES[density];
}
