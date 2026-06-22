// WS10 — Household Stories Engine: Food Journey seed data.
//
// A journey cluster is a curated group of related foods. When a household has
// tried ≥ 3 confirmed foods from a cluster (each used ≥ 2 times) AND the
// entries span at least 60 days (showing progression, not simultaneous
// discovery), a Food Journey story is generated.
//
// Journeys celebrate broadening horizons — they are OBSERVATIONS, never goals.
// The engine never says "your next step is X" — that is Discovery (WS8).
// It only says "you started here and arrived here" — a backward-looking
// recognition, not a forward prescription.
//
// Cluster slugs must match canonical slugs in CANONICAL_SEED. Varieties are
// not listed here — the engine matches against exact food slugs as used in
// the household's MealEntry records.

export interface JourneyCluster {
  /** Internal key for this cluster. */
  key: string;
  /** Story theme label for headings and formatting. */
  label: string;
  /**
   * Canonical slugs in this food family (order is editorial — loosely from
   * familiar to less familiar, but the engine re-orders by first-seen date).
   */
  foods: string[];
  /**
   * Headline template. {start}, {middle}, {latest} are replaced by the
   * household's first, midpoint, and most-recently-adopted food in the cluster.
   */
  template: string;
}

export const JOURNEY_CLUSTERS: JourneyCluster[] = [
  {
    key: "legumes",
    label: "Your legume journey",
    foods: [
      "chickpeas",
      "lentils",
      "butter-beans",
      "kidney-beans",
      "black-beans",
      "cannellini-beans",
      "edamame",
      "split-peas",
    ],
    template:
      "You started with {start}. Then discovered {middle}. Now you enjoy {latest}.",
  },
  {
    key: "mediterranean",
    label: "Mediterranean cooking",
    foods: [
      "tomato",
      "aubergine",
      "courgette",
      "extra-virgin-olive-oil",
      "feta",
      "chickpeas",
      "olives",
      "artichoke",
      "fennel",
      "basil",
      "oregano",
    ],
    template:
      "Your family embraced Mediterranean cooking: {start}, {middle}, {latest} and more.",
  },
  {
    key: "leafy-greens",
    label: "Your leafy greens exploration",
    foods: [
      "spinach",
      "kale",
      "chard",
      "cavolo-nero",
      "pak-choi",
      "rocket",
      "watercress",
      "spring-greens",
    ],
    template:
      "Your household's leafy greens journey: from {start} to {middle} to {latest}.",
  },
  {
    key: "whole-grains",
    label: "Your whole grains journey",
    foods: [
      "brown-rice",
      "quinoa",
      "oats",
      "bulgur-wheat",
      "farro",
      "barley",
      "freekeh",
      "millet",
    ],
    template: "You explored whole grains: {start}, then {middle}, then {latest}.",
  },
  {
    key: "root-vegetables",
    label: "Root vegetable discovery",
    foods: [
      "sweet-potato",
      "parsnip",
      "celeriac",
      "turnip",
      "beetroot",
      "swede",
    ],
    template:
      "Root vegetables became part of your kitchen: {start}, {middle}, {latest}.",
  },
  {
    key: "fermented",
    label: "Fermented foods exploration",
    foods: [
      "yoghurt",
      "greek-yoghurt",
      "kefir",
      "kimchi",
      "sauerkraut",
      "miso",
      "tempeh",
    ],
    template:
      "Your household discovered fermented foods: {start}, {middle}, {latest}.",
  },
  {
    key: "brassicas",
    label: "Brassica family journey",
    foods: [
      "broccoli",
      "cauliflower",
      "kale",
      "cabbage",
      "brussels-sprouts",
      "cavolo-nero",
      "pak-choi",
      "spring-greens",
    ],
    template:
      "The brassica family became a kitchen staple: {start}, {middle}, {latest}.",
  },
];

/** Find which journey clusters a given food slug belongs to. */
export function getClustersForFood(slug: string): JourneyCluster[] {
  return JOURNEY_CLUSTERS.filter((c) => c.foods.includes(slug));
}
