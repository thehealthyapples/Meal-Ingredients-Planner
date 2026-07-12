/**
 * Household Companion Fields (PHASE5B)
 * ====================================
 * The four ambient "companion" fields THA shows a household about its own
 * eating history: a celebration, a seasonal highlight, a gentle opportunity
 * and a household insight.
 *
 * WHY THIS MODULE EXISTS. Two routes need these four fields — `/api/home/
 * intelligence` (the Home Intelligence Companion) and `/api/planner/weeks/
 * :weekId/intelligence` (WX3's Planner Intelligence Strip). Until PHASE5B they
 * each carried their own byte-identical copy of the derivation: the same three
 * engine calls, the same section preferences, the same seasonal fallback, down
 * to the comment text. Two copies of one derivation is two places for it to
 * drift, and the two routes differ in exactly one thing — WHICH planner week
 * they report progress for — which is precisely the part that is NOT here.
 *
 * WHAT THIS MODULE IS NOT. It reasons about nothing and owns nothing. The
 * ranking is done entirely by three canonical engines that already own it —
 * `stories()` (WS11), `seasonalStories()` and `discover()` — and this module
 * only reads the FIRST card of an already-ordered section. It scores nothing,
 * sorts nothing and re-weights nothing.
 *
 * NOT THE DECISION ENGINE, AND NOT A SECOND ONE. The `opportunity` field here
 * is a food-*discovery* suggestion ("aubergine is at its best right now"), not
 * a DEC1 `DeliverableOpportunity`. It carries no AttentionLevel, cites no
 * evidence, and is never delivered, muted, suppressed, re-weighted or resolved.
 * The Decision Engine remains the sole owner of the opportunity lifecycle
 * (`opportunity-delivery/framework.ts`), and nothing here touches it. See the
 * PHASE5B implementation record for why the two are not the same thing and why
 * converging them would be a product change, not an activation.
 *
 * PURE. No I/O, no storage, no platform. It takes an already-built
 * `HouseholdHistory` and returns a value — so it is unit-testable without a
 * database, and an empty history is a correct, complete answer of four nulls.
 */

import { discover } from "../../shared/discovery/engine";
import { stories } from "../../shared/stories/engine";
import { seasonalStories } from "../../shared/seasonal/engine";
import type { HouseholdHistory } from "../../shared/stories/types";

export interface HouseholdCompanionFields {
  readonly celebration: { headline: string } | null;
  readonly seasonalHighlight: { headline: string } | null;
  readonly opportunity: { text: string } | null;
  readonly householdInsight: { headline: string } | null;
}

/**
 * Derives the four companion fields from a household's own eating history.
 *
 * Each field is independently `null` when no validated data supports it
 * (progressive enrichment — Principle 3): a household with no history gets four
 * nulls, never a fabricated stand-in.
 */
export function deriveHouseholdCompanionFields(
  history: HouseholdHistory,
): HouseholdCompanionFields {
  // ── Stories — celebration and household insight ────────────────────────────
  let celebration: { headline: string } | null = null;
  let householdInsight: { headline: string } | null = null;

  if (history.entries.length > 0) {
    const storiesResult = stories({ household: history, limitPerType: 2 });

    const celebSection =
      storiesResult.sections.find((s) => s.type === "discovery") ??
      storiesResult.sections.find((s) => s.type === "favourite_foods");
    if (celebSection?.cards[0]) {
      celebration = { headline: celebSection.cards[0].headline };
    }

    const insightSection =
      storiesResult.sections.find(
        (s) => s.type === "family_traditions" || s.type === "seasonal_habits",
      ) ?? storiesResult.sections.find((s) => s !== celebSection);
    if (insightSection?.cards[0]) {
      householdInsight = { headline: insightSection.cards[0].headline };
    }
  }

  // ── Seasonal highlight ─────────────────────────────────────────────────────
  // `enjoys` is derived outside the history guard on purpose: an empty history
  // yields an empty `enjoys`, and both engines below correctly answer "nothing"
  // for it. This preserves the pre-PHASE5B behaviour of both routes exactly.
  let seasonalHighlight: { headline: string } | null = null;

  const enjoys = Array.from(new Set(history.entries.map((e) => e.food)));
  const seasonal = seasonalStories({ household: history, enjoys, limitPerBlock: 3 });
  const lookingAheadBlock = seasonal.blocks.find((b) => b.type === "looking_ahead");
  const discoveriesBlock = seasonal.blocks.find((b) => b.type === "discoveries");

  if (lookingAheadBlock?.cards[0]) {
    seasonalHighlight = { headline: lookingAheadBlock.cards[0].headline };
  } else if (discoveriesBlock?.cards[0]) {
    seasonalHighlight = { headline: discoveriesBlock.cards[0].headline };
  }

  // ── Gentle opportunity ─────────────────────────────────────────────────────
  let opportunity: { text: string } | null = null;

  const disc = discover({
    household: { enjoys },
    types: ["broaden_horizons", "seasonal"],
    limitPerType: 1,
  });
  const oppSection =
    disc.sections.find((s) => s.type === "seasonal") ??
    disc.sections.find((s) => s.type === "broaden_horizons");
  if (oppSection?.suggestions[0]) {
    opportunity = { text: oppSection.suggestions[0].reason };
  }

  // Seasonal highlight fallback: use discover if WS11 yielded nothing.
  if (!seasonalHighlight) {
    const seasonalSection = disc.sections.find((s) => s.type === "seasonal");
    if (seasonalSection?.suggestions[0]) {
      const sug = seasonalSection.suggestions[0];
      seasonalHighlight = { headline: `${sug.name} is at its best right now.` };
    }
  }

  return { celebration, seasonalHighlight, opportunity, householdInsight };
}
