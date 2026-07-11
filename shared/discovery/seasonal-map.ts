// WS8 — Food Discovery Engine: curated UK seasonal seed (Tier 3, editorial).
//
// Seasonal discovery's whole charm is timeliness and RESTRAINT — "courgettes are
// at their best right now" only lands if the list is short and honest. A long
// list defeats the warmth. These are UK seasons (in season ≠ on the shelf —
// imports mean almost everything is buyable year-round; this is about PEAK).
//
// Kept deliberately small per season. All slugs are real canonical food slugs.
//
// SOURCE-OF-TRUTH DECLARATION (WS0X.4 Consolidation Gate, 2026-06-24):
// SEASON_SEED is the CANONICAL representation of seasonality FOR LOGIC. The two
// other forms are DERIVED, not authoritative:
//   • knowledge_foods.seasonality (free text)  → display copy only
//   • food-graph.ts `seasonal_with` relations   → derived editorial pairings
// When `peak_seasons` is added to canonical_food it must ABSORB this seed (this
// becomes a derived curated view), never become a fourth representation.
// See docs/investigations/knowledge/WS0X_4_FOOD_INTELLIGENCE_CONSOLIDATION_GATE.md.

import type { UKSeason } from "./types";

export const SEASON_SEED: Record<UKSeason, Array<{ slug: string; name: string }>> = {
  spring: [
    { slug: "asparagus", name: "Asparagus" },
    { slug: "purple-sprouting-broccoli", name: "Purple Sprouting Broccoli" },
    { slug: "radish", name: "Radish" },
    { slug: "rocket", name: "Rocket" },
    { slug: "spring-onion", name: "Spring Onion" },
    { slug: "watercress", name: "Watercress" },
    { slug: "peas", name: "Peas" },
  ],
  summer: [
    { slug: "tomato", name: "Tomato" },
    { slug: "courgette", name: "Courgette" },
    { slug: "peach", name: "Peach" },
    { slug: "basil", name: "Basil" },
    { slug: "strawberry", name: "Strawberry" },
    { slug: "raspberry", name: "Raspberry" },
    { slug: "cucumber", name: "Cucumber" },
    { slug: "aubergine", name: "Aubergine" },
  ],
  autumn: [
    { slug: "pumpkin", name: "Pumpkin" },
    { slug: "butternut-squash", name: "Butternut Squash" },
    { slug: "apple", name: "Apple" },
    { slug: "pear", name: "Pear" },
    { slug: "beetroot", name: "Beetroot" },
    { slug: "kale", name: "Kale" },
    { slug: "mushroom", name: "Mushroom" },
    { slug: "leek", name: "Leek" },
  ],
  winter: [
    { slug: "swede", name: "Swede" },
    { slug: "parsnip", name: "Parsnip" },
    { slug: "brussels-sprouts", name: "Brussels Sprouts" },
    { slug: "cavolo-nero", name: "Cavolo Nero" },
    { slug: "leek", name: "Leek" },
    { slug: "celeriac", name: "Celeriac" },
    { slug: "red-cabbage", name: "Red Cabbage" },
  ],
};

/** UK meteorological seasons from a date (month-based, geography-honest). */
export function seasonForDate(date: Date): UKSeason {
  const m = date.getMonth(); // 0 = Jan
  if (m >= 2 && m <= 4) return "spring"; // Mar–May
  if (m >= 5 && m <= 7) return "summer"; // Jun–Aug
  if (m >= 8 && m <= 10) return "autumn"; // Sep–Nov
  return "winter"; // Dec–Feb
}

export const SEASON_LABEL: Record<UKSeason, string> = {
  spring: "spring",
  summer: "summer",
  autumn: "autumn",
  winter: "winter",
};
