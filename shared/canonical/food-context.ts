// WS0X.5 — Food Context Foundation: controlled vocabularies + per-food seed.
//
// This module is the AUTHORING input for the three food-context dimensions that
// WS0X.3/WS0X.4 approved. The single RUNTIME source of truth is the
// `canonical_food` table (columns availability / availability_modifiers /
// peak_seasons / origin_region). shared/canonical/index.ts MERGES this map onto
// each canonical_food insert at seed-build time, so there is exactly ONE owner —
// this file is seed input, exactly like CANONICAL_SEED's nested varieties/aliases,
// NOT a parallel runtime store. validateCanonicalSeed() refuses to seed if any
// value here falls outside the controlled vocabularies below or names a slug that
// is not a real canonical food.
//
// Scope decisions (see docs/investigations/WS0X_5_FOOD_CONTEXT_FOUNDATION_IMPLEMENTATION.md):
//   • availability   — UK retail reach, ordinal, single value. NOT per-retailer.
//   • peakSeasons    — UK peak seasons (in season ≠ on the shelf). ABSORBS SEASON_SEED.
//   • originRegion   — the food's geographic/botanical/culinary home (where it COMES
//                      FROM), single controlled slug. Distinct from cuisine association.
//   • modifiers      — orthogonal flags; a food can be "mainstream" AND "imported".
//
// Recommendation tier and household familiarity are DERIVED, never stored here.

// ── Controlled vocabularies ──────────────────────────────────────────────────

/** UK retail reach, ordinal (mainstream is the most obtainable). */
export const AVAILABILITY_LEVELS = ["mainstream", "common", "specialist", "rare"] as const;
export type AvailabilityLevel = (typeof AVAILABILITY_LEVELS)[number];

/** Orthogonal modifiers — kept OUT of the ordinal scale by design. */
export const AVAILABILITY_MODIFIERS = ["imported", "seasonal", "online_only"] as const;
export type AvailabilityModifier = (typeof AVAILABILITY_MODIFIERS)[number];

/** UK meteorological seasons (mirrors discovery UKSeason; defined locally so the
 *  canonical layer carries NO dependency on the discovery engine). */
export const UK_SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type UKSeasonSlug = (typeof UK_SEASONS)[number];

/** Controlled, extensible geographic origin regions. Coarse by design — region
 *  alone serves recommendations; country precision is deferred (WS0X.3 §Phase 2). */
export const ORIGIN_REGIONS = [
  "united-kingdom",
  "europe",
  "mediterranean",
  "north-africa",
  "sub-saharan-africa",
  "middle-east",
  "central-asia",
  "south-asia",
  "east-asia",
  "southeast-asia",
  "north-america",
  "central-america",
  "south-america",
  "oceania",
  "global",
] as const;
export type OriginRegion = (typeof ORIGIN_REGIONS)[number];

export const AVAILABILITY_LEVEL_SET: ReadonlySet<string> = new Set(AVAILABILITY_LEVELS);
export const AVAILABILITY_MODIFIER_SET: ReadonlySet<string> = new Set(AVAILABILITY_MODIFIERS);
export const UK_SEASON_SET: ReadonlySet<string> = new Set(UK_SEASONS);
export const ORIGIN_REGION_SET: ReadonlySet<string> = new Set(ORIGIN_REGIONS);

// ── Seed shape ─────────────────────────────────────────────────────────────-─

export interface FoodContextSeed {
  availability: AvailabilityLevel;
  /** UK peak seasons; [] = no distinct UK peak (year-round / imported). */
  peakSeasons: UKSeasonSlug[];
  /** Geographic/botanical/culinary origin; null = not confidently known (honest gap). */
  originRegion: OriginRegion | null;
  /** Orthogonal availability modifiers; [] = none. */
  modifiers: AvailabilityModifier[];
}

/** Compact constructor so the seed below reads as a reviewable table. */
function fc(
  availability: AvailabilityLevel,
  peakSeasons: UKSeasonSlug[],
  originRegion: OriginRegion | null,
  modifiers: AvailabilityModifier[] = [],
): FoodContextSeed {
  return { availability, peakSeasons, originRegion, modifiers };
}

// ── Per-food context seed (keyed by canonical_food slug) ─────────────────────-─
// Authored from established food geography + UK retail knowledge. peakSeasons for
// the SEASON_SEED foods are deliberately aligned so the seasonality consolidation
// holds (validateCanonicalSeed enforces SEASON_SEED ⊆ canonical peakSeasons).
// NOT fabricated: where origin is genuinely uncertain the value is null.

export const FOOD_CONTEXT_SEED: Record<string, FoodContextSeed> = {
  // ── Vegetables ──────────────────────────────────────────────────────────────
  tomato: fc("mainstream", ["summer"], "south-america", ["imported", "seasonal"]),
  spinach: fc("mainstream", [], "middle-east", []),
  kale: fc("mainstream", ["autumn"], "europe", ["seasonal"]),
  watercress: fc("common", ["spring"], "europe", ["seasonal"]),
  rocket: fc("mainstream", ["spring"], "mediterranean", ["seasonal"]),
  beetroot: fc("mainstream", ["autumn"], "mediterranean", ["seasonal"]),
  carrots: fc("mainstream", [], "central-asia", []),
  parsnip: fc("mainstream", ["winter"], "europe", ["seasonal"]),
  turnip: fc("common", ["winter"], "europe", ["seasonal"]),
  swede: fc("mainstream", ["winter"], "europe", ["seasonal"]),
  broccoli: fc("mainstream", [], "mediterranean", []),
  "red-cabbage": fc("mainstream", ["winter"], "europe", ["seasonal"]),
  "pak-choi": fc("common", [], "east-asia", ["imported"]),
  garlic: fc("mainstream", [], "central-asia", []),
  onion: fc("mainstream", [], "central-asia", []),
  "spring-onion": fc("mainstream", ["spring"], "central-asia", ["seasonal"]),
  aubergine: fc("mainstream", ["summer"], "south-asia", ["imported", "seasonal"]),
  courgette: fc("mainstream", ["summer"], "central-america", ["seasonal"]),
  pepper: fc("mainstream", [], "central-america", ["imported"]),
  cucumber: fc("mainstream", ["summer"], "south-asia", ["seasonal"]),
  fennel: fc("common", [], "mediterranean", []),
  celery: fc("mainstream", [], "mediterranean", []),
  asparagus: fc("common", ["spring"], "europe", ["seasonal"]),
  artichoke: fc("specialist", [], "mediterranean", ["imported"]),
  "broad-beans": fc("common", ["summer"], "mediterranean", ["seasonal"]),
  radicchio: fc("specialist", [], "mediterranean", ["imported"]),
  chicory: fc("common", [], "europe", []),
  potato: fc("mainstream", [], "south-america", []),
  "sweet-potato": fc("mainstream", [], "central-america", ["imported"]),
  leek: fc("mainstream", ["autumn", "winter"], "europe", ["seasonal"]),
  shallot: fc("common", [], "central-asia", []),
  cauliflower: fc("mainstream", [], "mediterranean", []),
  cabbage: fc("mainstream", [], "europe", []),
  "butternut-squash": fc("mainstream", ["autumn"], "central-america", ["seasonal"]),
  pumpkin: fc("mainstream", ["autumn"], "central-america", ["seasonal"]),
  peas: fc("mainstream", ["spring"], "mediterranean", ["seasonal"]),
  edamame: fc("common", [], "east-asia", ["imported"]),
  "brussels-sprouts": fc("mainstream", ["winter"], "europe", ["seasonal"]),
  celeriac: fc("common", ["winter"], "mediterranean", ["seasonal"]),
  "green-beans": fc("mainstream", [], "central-america", ["imported"]),
  radish: fc("mainstream", ["spring"], "east-asia", ["seasonal"]),
  kohlrabi: fc("specialist", [], "europe", []),
  corn: fc("mainstream", ["summer"], "central-america", ["seasonal"]),
  lettuce: fc("mainstream", [], "mediterranean", []),
  olives: fc("mainstream", [], "mediterranean", ["imported"]),
  chard: fc("common", [], "mediterranean", []),
  "jerusalem-artichoke": fc("specialist", ["autumn", "winter"], "north-america", ["seasonal"]),

  // ── Mushrooms ─────────────────────────────────────────────────────────────--
  mushroom: fc("mainstream", ["autumn"], "europe", ["seasonal"]),

  // ── Herbs ──────────────────────────────────────────────────────────────────-
  basil: fc("mainstream", ["summer"], "south-asia", ["seasonal"]),
  parsley: fc("mainstream", [], "mediterranean", []),
  coriander: fc("mainstream", [], "mediterranean", []),
  mint: fc("mainstream", [], "mediterranean", []),
  rosemary: fc("mainstream", [], "mediterranean", []),
  thyme: fc("mainstream", [], "mediterranean", []),
  oregano: fc("mainstream", [], "mediterranean", []),
  dill: fc("common", [], "mediterranean", []),
  chives: fc("common", [], "europe", []),
  sage: fc("common", [], "mediterranean", []),
  tarragon: fc("common", [], "central-asia", []),
  "bay-leaf": fc("common", [], "mediterranean", []),
  lemongrass: fc("specialist", [], "southeast-asia", ["imported"]),

  // ── Spices ─────────────────────────────────────────────────────────────────-
  cumin: fc("mainstream", [], "middle-east", ["imported"]),
  turmeric: fc("mainstream", [], "south-asia", ["imported"]),
  cinnamon: fc("mainstream", [], "south-asia", ["imported"]),
  ginger: fc("mainstream", [], "southeast-asia", ["imported"]),
  paprika: fc("mainstream", [], "central-america", ["imported"]),
  vanilla: fc("specialist", [], "central-america", ["imported"]),
  chilli: fc("mainstream", [], "central-america", ["imported"]),
  "black-pepper": fc("mainstream", [], "south-asia", ["imported"]),
  cardamom: fc("common", [], "south-asia", ["imported"]),
  "star-anise": fc("specialist", [], "east-asia", ["imported"]),
  cloves: fc("common", [], "southeast-asia", ["imported"]),
  nutmeg: fc("common", [], "southeast-asia", ["imported"]),

  // ── Fruit ──────────────────────────────────────────────────────────────────-
  apple: fc("mainstream", ["autumn"], "central-asia", ["seasonal"]),
  orange: fc("mainstream", ["winter"], "east-asia", ["imported", "seasonal"]),
  clementine: fc("mainstream", ["winter"], "east-asia", ["imported", "seasonal"]),
  banana: fc("mainstream", [], "southeast-asia", ["imported"]),
  strawberry: fc("mainstream", ["summer"], "europe", ["seasonal"]),
  blueberry: fc("mainstream", ["summer"], "north-america", ["imported"]),
  raspberry: fc("mainstream", ["summer"], "europe", ["seasonal"]),
  kiwi: fc("mainstream", [], "east-asia", ["imported"]),
  pear: fc("mainstream", ["autumn"], "europe", ["seasonal"]),
  mango: fc("mainstream", [], "south-asia", ["imported"]),
  grape: fc("mainstream", [], "middle-east", ["imported"]),
  lemon: fc("mainstream", [], "south-asia", ["imported"]),
  lime: fc("mainstream", [], "southeast-asia", ["imported"]),
  pomegranate: fc("common", ["autumn"], "middle-east", ["imported"]),
  peach: fc("mainstream", ["summer"], "east-asia", ["imported", "seasonal"]),
  plum: fc("mainstream", ["summer"], "europe", ["seasonal"]),
  cherry: fc("mainstream", ["summer"], "europe", ["seasonal"]),
  nectarine: fc("mainstream", ["summer"], "east-asia", ["imported", "seasonal"]),
  watermelon: fc("mainstream", ["summer"], "sub-saharan-africa", ["imported", "seasonal"]),
  pineapple: fc("mainstream", [], "south-america", ["imported"]),
  fig: fc("common", [], "mediterranean", ["imported"]),
  apricot: fc("common", ["summer"], "central-asia", ["imported", "seasonal"]),
  grapefruit: fc("mainstream", [], "central-america", ["imported"]),
  "passion-fruit": fc("specialist", [], "south-america", ["imported"]),
  blackberry: fc("common", ["autumn"], "europe", ["seasonal"]),
  melon: fc("mainstream", ["summer"], "sub-saharan-africa", ["imported", "seasonal"]),
  cranberry: fc("common", ["winter"], "north-america", ["imported"]),
  blackcurrant: fc("common", ["summer"], "europe", ["seasonal"]),
  redcurrant: fc("common", ["summer"], "europe", ["seasonal"]),
  gooseberry: fc("common", ["summer"], "europe", ["seasonal"]),
  raisins: fc("mainstream", [], "middle-east", ["imported"]),
  dates: fc("common", [], "middle-east", ["imported"]),

  // ── Legumes ────────────────────────────────────────────────────────────────-
  chickpeas: fc("mainstream", [], "middle-east", ["imported"]),
  "black-beans": fc("common", [], "central-america", ["imported"]),
  "kidney-beans": fc("mainstream", [], "central-america", ["imported"]),
  "butter-beans": fc("common", [], "south-america", ["imported"]),
  lentils: fc("mainstream", [], "middle-east", ["imported"]),
  "cannellini-beans": fc("common", [], "central-america", ["imported"]),
  "borlotti-beans": fc("common", [], "central-america", ["imported"]),
  "haricot-beans": fc("common", [], "central-america", ["imported"]),
  tofu: fc("mainstream", [], "east-asia", ["imported"]),

  // ── Seeds ──────────────────────────────────────────────────────────────────-
  "pumpkin-seeds": fc("mainstream", [], "central-america", ["imported"]),
  "sunflower-seeds": fc("mainstream", [], "north-america", ["imported"]),
  "chia-seeds": fc("common", [], "central-america", ["imported"]),
  flaxseed: fc("common", [], "middle-east", ["imported"]),
  "sesame-seeds": fc("mainstream", [], "south-asia", ["imported"]),
  "hemp-seeds": fc("common", [], "central-asia", ["imported"]),

  // ── Nuts ───────────────────────────────────────────────────────────────────-
  walnuts: fc("mainstream", [], "central-asia", ["imported"]),
  almonds: fc("mainstream", [], "middle-east", ["imported"]),
  hazelnuts: fc("mainstream", [], "europe", ["imported"]),
  cashews: fc("mainstream", [], "south-america", ["imported"]),
  pistachios: fc("mainstream", [], "central-asia", ["imported"]),
  "brazil-nuts": fc("common", [], "south-america", ["imported"]),
  "pine-nuts": fc("common", [], "mediterranean", ["imported"]),
  pecans: fc("common", [], "north-america", ["imported"]),
  peanuts: fc("mainstream", [], "south-america", ["imported"]),
  macadamia: fc("specialist", [], "oceania", ["imported"]),

  // ── Healthy fats ───────────────────────────────────────────────────────────-
  "extra-virgin-olive-oil": fc("mainstream", [], "mediterranean", ["imported"]),
  avocado: fc("mainstream", [], "central-america", ["imported"]),
  salmon: fc("mainstream", [], "europe", []),
  sardines: fc("mainstream", [], "mediterranean", []),
  tuna: fc("mainstream", [], "global", ["imported"]),
  mackerel: fc("mainstream", [], "europe", []),
  anchovies: fc("common", [], "mediterranean", ["imported"]),
  coconut: fc("mainstream", [], "southeast-asia", ["imported"]),
  "dark-chocolate": fc("mainstream", [], "south-america", ["imported"]),
  "sunflower-oil": fc("mainstream", [], "north-america", ["imported"]),

  // ── Dairy ──────────────────────────────────────────────────────────────────-
  milk: fc("mainstream", [], "united-kingdom", []),
  yoghurt: fc("mainstream", [], "middle-east", []),
  cheddar: fc("mainstream", [], "united-kingdom", []),
  mozzarella: fc("mainstream", [], "europe", []),
  halloumi: fc("mainstream", [], "mediterranean", ["imported"]),
  feta: fc("mainstream", [], "mediterranean", ["imported"]),
  parmesan: fc("mainstream", [], "europe", ["imported"]),
  ricotta: fc("common", [], "europe", []),
  kefir: fc("common", [], "central-asia", []),
  butter: fc("mainstream", [], "united-kingdom", []),

  // ── Dairy alternatives ─────────────────────────────────────────────────────-
  "oat-milk": fc("mainstream", [], "europe", []),
  "soy-milk": fc("mainstream", [], "east-asia", []),
  "almond-milk": fc("mainstream", [], "middle-east", []),

  // ── Fermented foods ────────────────────────────────────────────────────────-
  tempeh: fc("common", [], "southeast-asia", ["imported"]),
  miso: fc("common", [], "east-asia", ["imported"]),
  sauerkraut: fc("common", [], "europe", []),
  kimchi: fc("common", [], "east-asia", ["imported"]),

  // ── Proteins ───────────────────────────────────────────────────────────────-
  eggs: fc("mainstream", [], "united-kingdom", []),
  chicken: fc("mainstream", [], "southeast-asia", []),
  turkey: fc("mainstream", [], "north-america", []),
  beef: fc("mainstream", [], "middle-east", []),
  lamb: fc("mainstream", [], "middle-east", []),
  pork: fc("mainstream", [], "middle-east", []),
  duck: fc("mainstream", [], "east-asia", []),
  cod: fc("mainstream", [], "europe", []),
  haddock: fc("mainstream", [], "europe", []),
  prawns: fc("mainstream", [], "global", ["imported"]),

  // ── Grains ─────────────────────────────────────────────────────────────────-
  oats: fc("mainstream", [], "europe", []),
  "brown-rice": fc("mainstream", [], "east-asia", ["imported"]),
  "white-rice": fc("mainstream", [], "east-asia", ["imported"]),
  quinoa: fc("mainstream", [], "south-america", ["imported"]),
  buckwheat: fc("common", [], "east-asia", ["imported"]),
  barley: fc("mainstream", [], "middle-east", []),
  spelt: fc("common", [], "middle-east", []),
  rye: fc("common", [], "middle-east", []),
  wheat: fc("mainstream", [], "middle-east", []),
  couscous: fc("mainstream", [], "north-africa", ["imported"]),
  "bulgur-wheat": fc("common", [], "middle-east", ["imported"]),
  pasta: fc("mainstream", [], "europe", []),
  millet: fc("common", [], "sub-saharan-africa", ["imported"]),
  freekeh: fc("specialist", [], "middle-east", ["imported"]),

  // ── Pre-staged H1 promotion candidates ─────────────────────────────────────
  // Context authored here so promotion auto-tagging requires no manual step.
  // These slugs are not yet in CANONICAL_SEED; they are staged for future promotion.

  // Fish & Seafood
  pollock: fc("common", [], "europe", []),
  tilapia: fc("common", [], "sub-saharan-africa", ["imported"]),
  "sea-bass": fc("common", [], "europe", []),
  "sea-bream": fc("common", [], "mediterranean", ["imported"]),
  squid: fc("common", [], "mediterranean", ["imported"]),
  mussels: fc("common", ["autumn", "winter"], "europe", ["seasonal"]),
  crab: fc("common", ["summer"], "europe", ["seasonal"]),
  scallops: fc("common", ["autumn", "winter"], "europe", ["seasonal"]),

  // Meat
  venison: fc("specialist", ["autumn", "winter"], "europe", ["seasonal"]),
  liver: fc("common", [], "united-kingdom", []),

  // Vegetables
  okra: fc("common", [], "south-asia", ["imported"]),
  "runner-beans": fc("common", ["summer"], "central-america", ["seasonal"]),
  mangetout: fc("common", [], "east-asia", ["imported"]),
  "sugar-snap-peas": fc("common", [], "north-america", ["imported"]),
  "purple-sprouting-broccoli": fc("common", ["winter", "spring"], "europe", ["seasonal"]),
  "spring-greens": fc("common", ["spring"], "europe", ["seasonal"]),
  "savoy-cabbage": fc("mainstream", ["autumn", "winter"], "europe", ["seasonal"]),
  "white-cabbage": fc("mainstream", [], "europe", []),
  "water-chestnuts": fc("specialist", [], "east-asia", ["imported"]),
  "baby-corn": fc("common", [], "southeast-asia", ["imported"]),
  "bean-sprouts": fc("common", [], "east-asia", ["imported"]),
  "bamboo-shoots": fc("specialist", [], "east-asia", ["imported"]),
  cassava: fc("specialist", [], "south-america", ["imported"]),
  "broccoli-raab": fc("specialist", [], "mediterranean", ["imported"]),
  "mustard-greens": fc("specialist", [], "south-asia", ["imported"]),

  // Fruit
  jackfruit: fc("common", [], "south-asia", ["imported"]),
  elderberries: fc("specialist", ["autumn"], "europe", ["seasonal"]),
  "goji-berries": fc("common", [], "east-asia", ["imported"]),
  lychees: fc("common", ["summer"], "southeast-asia", ["imported", "seasonal"]),
  papayas: fc("common", [], "central-america", ["imported"]),
  mulberries: fc("rare", ["summer"], "middle-east", ["imported", "seasonal"]),
  loganberries: fc("rare", ["summer"], "north-america", ["seasonal"]),
  guava: fc("specialist", [], "central-america", ["imported"]),
  plantain: fc("common", [], "central-america", ["imported"]),
  physalis: fc("specialist", [], "south-america", ["imported"]),

  // Grains (H1 specialty)
  sorghum: fc("specialist", [], "sub-saharan-africa", ["imported"]),
  amaranth: fc("specialist", [], "south-america", ["imported"]),
  farro: fc("common", [], "mediterranean", ["imported"]),
  semolina: fc("mainstream", [], "middle-east", ["imported"]),
  "black-rice": fc("common", [], "east-asia", ["imported"]),
  polenta: fc("common", [], "europe", ["imported"]),
  teff: fc("specialist", [], "sub-saharan-africa", ["imported"]),
  "rice-flour": fc("mainstream", [], "east-asia", ["imported"]),
  "almond-flour": fc("common", [], "middle-east", ["imported"]),
  "coconut-flour": fc("common", [], "southeast-asia", ["imported"]),
  "spelt-flour": fc("common", [], "europe", []),
  "barley-flour": fc("common", [], "europe", []),

  // Legumes (H1)
  "pinto-beans": fc("common", [], "central-america", ["imported"]),
  "black-eyed-peas": fc("common", [], "sub-saharan-africa", ["imported"]),
  "chickpea-flour": fc("common", [], "middle-east", ["imported"]),

  // Dairy (H1)
  "cottage-cheese": fc("mainstream", [], "united-kingdom", []),
  "cream-cheese": fc("mainstream", [], "united-kingdom", []),
  "sour-cream": fc("mainstream", [], "europe", []),
  "creme-fraiche": fc("mainstream", [], "europe", []),
  buttermilk: fc("common", [], "united-kingdom", []),
  "blue-cheese": fc("mainstream", [], "europe", []),
  gouda: fc("mainstream", [], "europe", ["imported"]),
  brie: fc("mainstream", [], "europe", ["imported"]),
  camembert: fc("mainstream", [], "europe", ["imported"]),
  stilton: fc("common", ["winter"], "united-kingdom", ["seasonal"]),
  "goat-cheese": fc("mainstream", [], "europe", ["imported"]),
  mascarpone: fc("common", [], "europe", ["imported"]),
  "double-cream": fc("mainstream", [], "united-kingdom", []),

  // Nuts & Seeds (H1)
  "almond-butter": fc("mainstream", [], "middle-east", ["imported"]),
  tahini: fc("mainstream", [], "middle-east", ["imported"]),
  "nigella-seeds": fc("common", [], "middle-east", ["imported"]),

  // Herbs (H1)
  marjoram: fc("common", [], "mediterranean", []),
  chervil: fc("specialist", [], "europe", []),

  // Spices & Condiments (H1)
  capers: fc("common", [], "mediterranean", ["imported"]),
  horseradish: fc("common", [], "europe", []),
  "caraway-seeds": fc("common", [], "europe", ["imported"]),
  fenugreek: fc("common", [], "south-asia", ["imported"]),
  sumac: fc("common", [], "middle-east", ["imported"]),

  // Oils (H1)
  "coconut-oil": fc("mainstream", [], "southeast-asia", ["imported"]),
  "rapeseed-oil": fc("mainstream", [], "europe", []),
  "sesame-oil": fc("mainstream", [], "southeast-asia", ["imported"]),

  // Fermented (H1)
  natto: fc("specialist", [], "east-asia", ["imported"]),

  // M4.5 — Fermented Food Attribute additions
  kombucha: fc("common", [], "east-asia", ["imported"]),

  // ── NK6R — Canonical Food Identity Governance ───────────────────────────────
  // Context for the identities minted when NK6Q's rulings and the three hierarchy
  // amendments were applied. Origin is the food's geographic/culinary home, not
  // where a UK shopper buys it; null where it is genuinely not one place.

  // Amendment 1 — olive oil grades. All Mediterranean, all imported, all year-round.
  "olive-oil": fc("mainstream", [], "mediterranean", ["imported"]),
  "virgin-olive-oil": fc("common", [], "mediterranean", ["imported"]),
  "refined-olive-oil": fc("mainstream", [], "mediterranean", ["imported"]),
  "olive-pomace-oil": fc("specialist", [], "mediterranean", ["imported"]),

  // Amendment 2 — cheese parent + families. The families are classification anchors
  // rather than shelf products; availability reflects how readily a UK shopper meets
  // an example of the family, and origin is null where the family spans regions.
  cheese: fc("mainstream", [], null, []),
  "fresh-cheese": fc("mainstream", [], null, []),
  "whey-cheese": fc("mainstream", [], "europe", []),
  "brined-cheese": fc("mainstream", [], "mediterranean", []),
  "bloomy-rind-cheese": fc("mainstream", [], "europe", []),
  "washed-rind-cheese": fc("specialist", [], "europe", ["imported"]),
  "pasta-filata": fc("mainstream", [], "mediterranean", []),
  "pressed-cheese": fc("mainstream", [], "europe", []),
  "cooked-pressed-cheese": fc("mainstream", [], "europe", []),
  // Named cheeses (NK6Q batches 021/022).
  gorgonzola: fc("common", [], "europe", ["imported"]),
  roquefort: fc("common", [], "europe", ["imported"]),
  "grana-padano": fc("mainstream", [], "europe", ["imported"]),
  "buffalo-mozzarella": fc("common", [], "europe", ["imported"]),

  // Amendment 3 — pasta parent + types.
  "wheat-pasta": fc("mainstream", [], "mediterranean", []),
  "wholewheat-pasta": fc("mainstream", [], "mediterranean", []),
  "chickpea-pasta": fc("common", [], null, []),
  "lentil-pasta": fc("common", [], null, []),
  "pea-pasta": fc("specialist", [], null, []),
  // NK6S — `spinach-pasta` is no longer a canonical food (it is a variety of
  // `wheat-pasta`). A variety carries no context of its own, so its entry is removed
  // rather than left here as a pre-staged orphan for a promotion that will not come.

  // Species livers (NK6Q §2.1).
  "beef-liver": fc("common", [], "united-kingdom", []),
  "chicken-liver": fc("mainstream", [], "united-kingdom", []),
  "lamb-liver": fc("mainstream", [], "united-kingdom", []),

  // Milled flours (NK6Q §2.3) — the grain's origin, not the mill's.
  "plain-wheat-flour": fc("mainstream", [], "middle-east", []),
  "wholemeal-flour": fc("mainstream", [], "middle-east", []),
  "oat-flour": fc("common", [], "europe", []),
  "buckwheat-flour": fc("common", [], "central-asia", ["imported"]),
  "rye-flour": fc("common", [], "europe", []),

  // Couscous split (NK6Q §2.4 / batch 007).
  "wholewheat-couscous": fc("common", [], "north-africa", []),
  "pearl-couscous": fc("common", [], "middle-east", ["imported"]),

  // Plant-part splits (NK6Q §2.5).
  "fennel-seeds": fc("common", [], "mediterranean", ["imported"]),
  "fenugreek-leaves": fc("specialist", [], "south-asia", ["imported"]),

  // Separate spices and grades.
  "white-pepper": fc("common", [], "south-asia", ["imported"]),
  "smoked-paprika": fc("mainstream", [], "europe", ["imported"]),
  mutton: fc("specialist", [], "united-kingdom", []),
  cuttlefish: fc("specialist", [], "mediterranean", []),
  "semi-skimmed-milk": fc("mainstream", [], "united-kingdom", []),
  "skimmed-milk": fc("mainstream", [], "united-kingdom", []),
  "whipping-cream": fc("mainstream", [], "united-kingdom", []),

  // Preparations that own their own facts (NK6Q §4.1).
  ghee: fc("common", [], "south-asia", ["imported"]),
  "vanilla-extract": fc("mainstream", [], "central-america", ["imported"]),
  "toasted-sesame-oil": fc("mainstream", [], "east-asia", ["imported"]),
  "peanut-butter": fc("mainstream", [], "north-america", []),
  "preserved-lemons": fc("specialist", [], "north-africa", ["imported"]),
  "cacao-powder": fc("mainstream", [], "south-america", ["imported"]),
  "coconut-water": fc("mainstream", [], "southeast-asia", ["imported"]),

  // ── NK6S — the Beverages domain ──────────────────────────────────────────────
  // The parent and family rows are coarse identities, not specific products, so
  // availability is that of the class ("can you buy a tea?") and origin is the
  // class's home, or `global` where the class has no single one.
  beverage: fc("mainstream", [], "global", []),
  tea: fc("mainstream", [], "east-asia", []),
  "herbal-infusion": fc("mainstream", [], "global", []),
  coffee: fc("mainstream", [], "sub-saharan-africa", ["imported"]),
  "cocoa-beverage": fc("mainstream", [], "south-america", ["imported"]),
  juice: fc("mainstream", [], "global", []),
  "plant-water": fc("common", [], "global", ["imported"]),
  "fermented-beverage": fc("common", [], "global", []),
  "plant-beverage": fc("mainstream", [], "global", []),
  "dairy-beverage": fc("mainstream", [], "united-kingdom", []),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Look up the authored context for a canonical food slug (undefined if none). */
export function getFoodContext(slug: string): FoodContextSeed | undefined {
  return FOOD_CONTEXT_SEED[slug];
}

/** Validate a single context record against the controlled vocabularies.
 *  Returns human-readable problems (empty = clean). Shared by the seed validator
 *  and the promotion auto-tagging path so both enforce the SAME rules. */
export function validateFoodContext(slug: string, ctx: FoodContextSeed): string[] {
  const problems: string[] = [];
  if (!AVAILABILITY_LEVEL_SET.has(ctx.availability)) {
    problems.push(`food-context "${slug}": invalid availability "${ctx.availability}"`);
  }
  for (const s of ctx.peakSeasons) {
    if (!UK_SEASON_SET.has(s)) problems.push(`food-context "${slug}": invalid peak season "${s}"`);
  }
  if (new Set(ctx.peakSeasons).size !== ctx.peakSeasons.length) {
    problems.push(`food-context "${slug}": duplicate peak season`);
  }
  for (const m of ctx.modifiers) {
    if (!AVAILABILITY_MODIFIER_SET.has(m)) problems.push(`food-context "${slug}": invalid modifier "${m}"`);
  }
  if (ctx.originRegion !== null && !ORIGIN_REGION_SET.has(ctx.originRegion)) {
    problems.push(`food-context "${slug}": invalid origin region "${ctx.originRegion}"`);
  }
  return problems;
}
