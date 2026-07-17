// WS8 — Food Discovery Engine: public types.
//
// Discovery answers ONE question: "Given a food (and optionally a household's
// tastes), which other foods might this household genuinely enjoy?"
//
// It is NOT ranking, NOT healthy-vs-unhealthy, NOT optimisation. Every value in
// these types is in service of curiosity, variety and inspiration. There are
// deliberately NO scores, NO ratings and NO ordering numbers exposed — ordering
// is expressed only by array position, and the reason behind it is internal.

/** The six — and only six — discovery types WS8 implements. */
export type DiscoveryType =
  | "similar" // 1. Similar foods            (tomato → pepper, aubergine)
  | "cook_with" // 2. Frequently cooked together (tomato → basil, mozzarella)
  | "explore_varieties" // 3. Explore varieties         (apple → gala, braeburn)
  | "broaden_horizons" // 4. Broaden horizons          (chickpeas → butter beans)
  | "cuisine" // 5. Cuisine exploration       (Mediterranean → fennel)
  | "seasonal"; // 6. Seasonal exploration      (summer → courgettes, peaches)

// CONV1 P5 / OWN-3: the season vocabulary is declared with the season rule that
// produces it, so the two cannot drift apart. Re-exported here because WS8's
// consumers import it from this file; this is not a second declaration.
import type { UKSeason } from "../seasonal/season-rule";
export type { UKSeason };

/** What the household already enjoys — used gently, never as judgement. */
export interface HouseholdContext {
  /**
   * Canonical or variety slugs the household already eats / enjoys.
   * Two uses, both non-judgemental:
   *   • ranking — suggestions adjacent to these are surfaced first (familiarity)
   *   • broaden_horizons — the seed set we step one comfortable pace beyond
   * Never used to say "you should eat" or "you're missing".
   */
  enjoys?: string[];
}

export interface DiscoverRequest {
  /**
   * Anchor food (canonical or variety slug). Optional: household-only discovery
   * (broaden_horizons / cuisine / seasonal) is valid with no anchor.
   */
  food?: string;
  household?: HouseholdContext;
  /** Restrict to specific discovery types. Default: every applicable type. */
  types?: DiscoveryType[];
  /** Force a season for seasonal discovery. Default: derived from `now`. */
  season?: UKSeason;
  /** Reference date for seasonal discovery. Default: new Date(). */
  now?: Date;
  /** Max suggestions surfaced per section (the "show few" cap). Default: 3. */
  limitPerType?: number;
}

export interface DiscoverySuggestion {
  slug: string;
  name: string;
  type: DiscoveryType;
  /** One-sentence friend-voice "why". Guaranteed free of ranking language. */
  reason: string;
  /**
   * True when the household already enjoys a food closely related to this one.
   * A RANKING signal only (familiar things surface first). Callers may use it to
   * gently frame ("you already love X") but must NEVER render it as a verdict.
   */
  familiar: boolean;
  /** Provenance. Editorial links are trusted above derived ones in ranking. */
  source: "editorial" | "derived";
}

export interface DiscoverySection {
  type: DiscoveryType;
  /** Friendly, invitational heading (e.g. "You might enjoy"). */
  title: string;
  suggestions: DiscoverySuggestion[];
}

export interface DiscoveryResult {
  /** The food the discovery was anchored on, or null for household-only. */
  anchor: { slug: string; name: string } | null;
  /** Empty sections are omitted entirely — empty is silent, never "nothing yet". */
  sections: DiscoverySection[];
}

/** Friendly section headings. Invitation, never instruction. */
export const SECTION_TITLES: Record<DiscoveryType, string> = {
  similar: "You might enjoy",
  cook_with: "Lovely cooked together",
  explore_varieties: "Varieties to explore",
  broaden_horizons: "If you like these, you might enjoy",
  cuisine: "Explore the cuisine",
  seasonal: "At their best right now",
};
