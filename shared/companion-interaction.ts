/**
 * companion-interaction.ts — EWX1 Living Companion Experience, Stage 4
 * =========================================================================
 * The closed set of "emotional moment" shapes the Companion can express.
 * This file carries NO phrasing and NO behaviour — only the vocabulary and
 * the mapping from a notice-engine.ts `NoticeCategory` to the
 * interaction shape a client renders it with (Stage 5's Delight Framework
 * picks its motion/pacing from this, not from the category directly, so a
 * future 7th notice category slots into an EXISTING interaction kind
 * rather than requiring a new one).
 *
 * Shared verbatim between server and client, same discipline as
 * companion-personality.ts, so the interaction vocabulary never drifts
 * between what the server labels a turn/notice and what the client
 * renders.
 */

export const INTERACTION_KINDS = [
  "welcome",
  "encouragement",
  "celebration",
  "milestone",
  "discovery",
  "reminder",
  "completion",
  "reflection",
  "seasonal",
] as const;

export type InteractionKind = (typeof INTERACTION_KINDS)[number];

export function isInteractionKind(value: unknown): value is InteractionKind {
  return typeof value === "string" && (INTERACTION_KINDS as readonly string[]).includes(value);
}

/**
 * Maps each notice-engine.ts category to the interaction kind that best
 * describes it. Defined here (not in notice-engine.ts) so the server's
 * fact-gathering stays independent of how the Companion chooses to express
 * it — the same category could map to a different kind in a future revision
 * without notice-engine.ts changing at all.
 */
export const OBSERVATION_CATEGORY_INTERACTION_KIND = {
  "nutrition-trend": "reflection",
  // PRESENCE2 — `streak-milestone` and `diversity-milestone` are retired (GEA13);
  // their rows go with them. `milestone` remains in INTERACTION_KINDS as an
  // available shape with no current mapping, which is the honest state: the
  // vocabulary is not the thing that was wrong.
  //
  // `household-story` is `reflection`, NOT `celebration` — and the choice is the
  // programme in one line. An observation about how a family eats is something to
  // sit with, not something to be congratulated for. `celebration` would have
  // given it `celebrationPop` in the Delight Framework, which is a room applauding
  // a household for existing.
  "household-story": "reflection",
  "planner-gap": "reminder",
  "pantry-opportunity": "discovery",
  "shopping-opportunity": "reminder",
  "seasonal-highlight": "seasonal",
} as const satisfies Record<string, InteractionKind>;
