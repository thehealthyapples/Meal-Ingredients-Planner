// EWX1 — Living Companion Experience, Stage 5 (Delight Framework).
//
// A small set of REUSABLE presentation primitives for how the Companion's
// moments (Stage 4 — shared/companion-interaction.ts's InteractionKind)
// appear on screen. This module owns NO state and NO data — it is pure
// framer-motion variant/timing config, the same class of artefact as
// FloatingAssistant.tsx's existing inline `motion.div` transitions (this
// file just factors the ones worth reusing across more than one surface out
// of that component, per the brief's "reusable platform components").
//
// Principle carried over from every other stage of this workstream: additive
// only. FloatingAssistant.tsx's own panel-open/close and card animations are
// UNCHANGED by this file; it is consumed only where a NEW moment (the
// Observation banner, Stage 7) needed a variant and reaching for a shared one
// was more honest than inventing a fourth one-off transition.
//
// Never distract: every variant here is short (<=400ms), single-purpose, and
// respects `prefers-reduced-motion` via `reducedMotionVariant`.

import type { Variants } from "framer-motion";
import type { InteractionKind } from "@shared/companion-interaction";

/** A gentle, upward fade-in — the default for a quiet, low-priority moment (reflection, discovery). */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.2, ease: "easeIn" } },
};

/** A slightly livelier entrance for a genuinely notable moment (milestone, celebration) — still brief, never bouncy-loud. */
export const celebrationPop: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

/** For a plain informational reminder — no motion beyond a simple fade, deliberately less emphasis than a celebration. */
export const quietFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/** Picks a variant by the moment's InteractionKind, so a caller never has to hand-pick "which animation for which feeling". */
export function variantForInteraction(kind: InteractionKind): Variants {
  // PX1-W1 (fnd-px-no-reduced-motion): this module always claimed to respect
  // prefers-reduced-motion but left it to callers, and no caller did. Honour it
  // here — a plain fade is the calmest variant this module owns.
  if (prefersReducedMotion()) return quietFade;
  switch (kind) {
    case "celebration":
    case "milestone":
      return celebrationPop;
    case "reminder":
    case "completion":
      return quietFade;
    case "welcome":
    case "encouragement":
    case "discovery":
    case "reflection":
    case "seasonal":
      return fadeInUp;
  }
}

/** True when the user has asked the OS for reduced motion — callers should fall back to `quietFade` (or no animation) when true. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
