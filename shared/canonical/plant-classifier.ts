// M4 — Canonical Plant Classifier.
//
// Replaces client/src/lib/nutrition-variety.ts keyword-based plant
// classification with canonical diversity_group resolution.
//
// Every plant diversity calculation derives from resolveCanonicalFood() +
// DIVERSITY_GROUP_SEED — one owner, no keyword lists, no duplicate state.
//
// Honest gaps: if a canonical food has no diversityGroupSlug (null), all
// functions return the honest-gap result: false / null / 0.
import { resolveCanonicalFood } from "./resolver";
import { DIVERSITY_GROUP_SEED } from "./diversity-groups";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VarietyScore {
  fruits: number;
  vegetables: number;
  wholeGrains: number;
  herbsSpices: number;
  oliveOil: number;
  total: number;
}

export const EMPTY_VARIETY_SCORE: VarietyScore = {
  fruits: 0,
  vegetables: 0,
  wholeGrains: 0,
  herbsSpices: 0,
  oliveOil: 0,
  total: 0,
};

export type PlantCategory =
  | "Vegetables"
  | "Fruits"
  | "Whole Grains"
  | "Herbs & Spices"
  | "Olive Oil"
  | "Legumes"
  | "Seeds"
  | "Nuts"
  | "Fermented Foods";

// ── diversityGroupSlug → PlantCategory ───────────────────────────────────────
// Every slug in DIVERSITY_GROUP_SEED that maps to one of the nine PlantCategory
// values. Slugs absent from this map (dark-chocolate, sunflower-oil) produce an
// honest null when getPlantCategory is called.

const GROUP_TO_PLANT_CATEGORY: Record<string, PlantCategory> = {
  // Vegetables
  tomato: "Vegetables", mushroom: "Vegetables", spinach: "Vegetables",
  kale: "Vegetables", watercress: "Vegetables", rocket: "Vegetables",
  beetroot: "Vegetables", carrots: "Vegetables", parsnip: "Vegetables",
  turnip: "Vegetables", swede: "Vegetables", broccoli: "Vegetables",
  "red-cabbage": "Vegetables", "pak-choi": "Vegetables", garlic: "Vegetables",
  onion: "Vegetables", "spring-onion": "Vegetables", aubergine: "Vegetables",
  courgette: "Vegetables", pepper: "Vegetables", cucumber: "Vegetables",
  fennel: "Vegetables", celery: "Vegetables", asparagus: "Vegetables",
  artichoke: "Vegetables", radicchio: "Vegetables", chicory: "Vegetables",
  potato: "Vegetables", "sweet-potato": "Vegetables", leek: "Vegetables",
  shallot: "Vegetables", cauliflower: "Vegetables", cabbage: "Vegetables",
  "butternut-squash": "Vegetables", pumpkin: "Vegetables", peas: "Vegetables",
  edamame: "Vegetables", "brussels-sprouts": "Vegetables", celeriac: "Vegetables",
  "green-beans": "Vegetables", radish: "Vegetables", kohlrabi: "Vegetables",
  corn: "Vegetables", lettuce: "Vegetables", olives: "Vegetables",
  chard: "Vegetables", "jerusalem-artichoke": "Vegetables",
  "broad-beans": "Vegetables", okra: "Vegetables", "runner-beans": "Vegetables",
  "spring-greens": "Vegetables", "water-chestnuts": "Vegetables",
  "bean-sprouts": "Vegetables", "bamboo-shoots": "Vegetables",
  cassava: "Vegetables", "broccoli-raab": "Vegetables",
  "mustard-greens": "Vegetables",
  // Fruits
  apple: "Fruits", citrus: "Fruits", avocado: "Fruits", banana: "Fruits",
  strawberry: "Fruits", blueberry: "Fruits", raspberry: "Fruits",
  kiwi: "Fruits", pear: "Fruits", mango: "Fruits", grape: "Fruits",
  pomegranate: "Fruits", peach: "Fruits", plum: "Fruits", cherry: "Fruits",
  nectarine: "Fruits", watermelon: "Fruits", pineapple: "Fruits",
  fig: "Fruits", apricot: "Fruits", "passion-fruit": "Fruits",
  blackberry: "Fruits", melon: "Fruits", cranberry: "Fruits",
  blackcurrant: "Fruits", redcurrant: "Fruits", gooseberry: "Fruits",
  raisins: "Fruits", dates: "Fruits", jackfruit: "Fruits",
  elderberry: "Fruits", "goji-berry": "Fruits", lychee: "Fruits",
  papaya: "Fruits", mulberry: "Fruits", loganberry: "Fruits",
  guava: "Fruits", plantain: "Fruits", physalis: "Fruits", coconut: "Fruits",
  // Legumes (dry legumes; green legumes stay in Vegetables per prior behaviour)
  chickpeas: "Legumes", "black-beans": "Legumes", "kidney-beans": "Legumes",
  "butter-beans": "Legumes", lentils: "Legumes", "cannellini-beans": "Legumes",
  "borlotti-beans": "Legumes", "haricot-beans": "Legumes",
  "pinto-beans": "Legumes", "black-eyed-peas": "Legumes",
  // Seeds
  "pumpkin-seeds": "Seeds", "sunflower-seeds": "Seeds",
  "chia-seeds": "Seeds", flaxseed: "Seeds", "sesame-seeds": "Seeds",
  "hemp-seeds": "Seeds", "nigella-seeds": "Seeds",
  // Nuts
  walnuts: "Nuts", almonds: "Nuts", hazelnuts: "Nuts", cashews: "Nuts",
  pistachios: "Nuts", "brazil-nuts": "Nuts", "pine-nuts": "Nuts",
  pecans: "Nuts", peanuts: "Nuts", macadamia: "Nuts",
  // Whole Grains
  oats: "Whole Grains", rice: "Whole Grains", quinoa: "Whole Grains",
  buckwheat: "Whole Grains", barley: "Whole Grains", spelt: "Whole Grains",
  rye: "Whole Grains", wheat: "Whole Grains", millet: "Whole Grains",
  sorghum: "Whole Grains", amaranth: "Whole Grains", farro: "Whole Grains",
  teff: "Whole Grains",
  // Herbs & Spices
  basil: "Herbs & Spices", parsley: "Herbs & Spices",
  coriander: "Herbs & Spices", mint: "Herbs & Spices",
  cumin: "Herbs & Spices", turmeric: "Herbs & Spices",
  cinnamon: "Herbs & Spices", ginger: "Herbs & Spices",
  paprika: "Herbs & Spices", rosemary: "Herbs & Spices",
  thyme: "Herbs & Spices", oregano: "Herbs & Spices",
  dill: "Herbs & Spices", chives: "Herbs & Spices",
  sage: "Herbs & Spices", tarragon: "Herbs & Spices",
  "bay-leaf": "Herbs & Spices", lemongrass: "Herbs & Spices",
  vanilla: "Herbs & Spices", chilli: "Herbs & Spices",
  "black-pepper": "Herbs & Spices", cardamom: "Herbs & Spices",
  "star-anise": "Herbs & Spices", cloves: "Herbs & Spices",
  nutmeg: "Herbs & Spices", capers: "Herbs & Spices",
  horseradish: "Herbs & Spices", "caraway-seeds": "Herbs & Spices",
  fenugreek: "Herbs & Spices", sumac: "Herbs & Spices",
  marjoram: "Herbs & Spices", chervil: "Herbs & Spices",
  // Olive Oil / plant-based oils
  "olive-oil": "Olive Oil", rapeseed: "Olive Oil",
  // dark-chocolate, sunflower-oil: no PlantCategory entry — honest gap
};

// ── diversityGroupSlug → VarietyScore key ────────────────────────────────────
// The 5-category meal variety dots (fruits / vegetables / wholeGrains /
// herbsSpices / oliveOil). Legumes, seeds, and nuts count toward the 30-plants
// weekly counter but are NOT shown as variety dots — preserved from prior behaviour.

type VarietyKey = keyof Omit<VarietyScore, "total">;

const GROUP_TO_VARIETY_KEY: Record<string, VarietyKey> = {
  // Fruits
  apple: "fruits", citrus: "fruits", avocado: "fruits", banana: "fruits",
  strawberry: "fruits", blueberry: "fruits", raspberry: "fruits",
  kiwi: "fruits", pear: "fruits", mango: "fruits", grape: "fruits",
  pomegranate: "fruits", peach: "fruits", plum: "fruits", cherry: "fruits",
  nectarine: "fruits", watermelon: "fruits", pineapple: "fruits",
  fig: "fruits", apricot: "fruits", "passion-fruit": "fruits",
  blackberry: "fruits", melon: "fruits", cranberry: "fruits",
  blackcurrant: "fruits", redcurrant: "fruits", gooseberry: "fruits",
  raisins: "fruits", dates: "fruits", jackfruit: "fruits",
  elderberry: "fruits", "goji-berry": "fruits", lychee: "fruits",
  papaya: "fruits", mulberry: "fruits", loganberry: "fruits",
  guava: "fruits", plantain: "fruits", physalis: "fruits", coconut: "fruits",
  // Vegetables (including green legumes: peas, edamame, green/broad/runner beans)
  tomato: "vegetables", mushroom: "vegetables", spinach: "vegetables",
  kale: "vegetables", watercress: "vegetables", rocket: "vegetables",
  beetroot: "vegetables", carrots: "vegetables", parsnip: "vegetables",
  turnip: "vegetables", swede: "vegetables", broccoli: "vegetables",
  "red-cabbage": "vegetables", "pak-choi": "vegetables", garlic: "vegetables",
  onion: "vegetables", "spring-onion": "vegetables", aubergine: "vegetables",
  courgette: "vegetables", pepper: "vegetables", cucumber: "vegetables",
  fennel: "vegetables", celery: "vegetables", asparagus: "vegetables",
  artichoke: "vegetables", radicchio: "vegetables", chicory: "vegetables",
  potato: "vegetables", "sweet-potato": "vegetables", leek: "vegetables",
  shallot: "vegetables", cauliflower: "vegetables", cabbage: "vegetables",
  "butternut-squash": "vegetables", pumpkin: "vegetables", peas: "vegetables",
  edamame: "vegetables", "brussels-sprouts": "vegetables", celeriac: "vegetables",
  "green-beans": "vegetables", radish: "vegetables", kohlrabi: "vegetables",
  corn: "vegetables", lettuce: "vegetables", olives: "vegetables",
  chard: "vegetables", "jerusalem-artichoke": "vegetables",
  "broad-beans": "vegetables", okra: "vegetables", "runner-beans": "vegetables",
  "spring-greens": "vegetables", "water-chestnuts": "vegetables",
  "bean-sprouts": "vegetables", "bamboo-shoots": "vegetables",
  cassava: "vegetables", "broccoli-raab": "vegetables",
  "mustard-greens": "vegetables",
  // Whole Grains
  oats: "wholeGrains", rice: "wholeGrains", quinoa: "wholeGrains",
  buckwheat: "wholeGrains", barley: "wholeGrains", spelt: "wholeGrains",
  rye: "wholeGrains", wheat: "wholeGrains", millet: "wholeGrains",
  sorghum: "wholeGrains", amaranth: "wholeGrains", farro: "wholeGrains",
  teff: "wholeGrains",
  // Herbs & Spices
  basil: "herbsSpices", parsley: "herbsSpices",
  coriander: "herbsSpices", mint: "herbsSpices",
  cumin: "herbsSpices", turmeric: "herbsSpices",
  cinnamon: "herbsSpices", ginger: "herbsSpices",
  paprika: "herbsSpices", rosemary: "herbsSpices",
  thyme: "herbsSpices", oregano: "herbsSpices",
  dill: "herbsSpices", chives: "herbsSpices",
  sage: "herbsSpices", tarragon: "herbsSpices",
  "bay-leaf": "herbsSpices", lemongrass: "herbsSpices",
  vanilla: "herbsSpices", chilli: "herbsSpices",
  "black-pepper": "herbsSpices", cardamom: "herbsSpices",
  "star-anise": "herbsSpices", cloves: "herbsSpices",
  nutmeg: "herbsSpices", capers: "herbsSpices",
  horseradish: "herbsSpices", "caraway-seeds": "herbsSpices",
  fenugreek: "herbsSpices", sumac: "herbsSpices",
  marjoram: "herbsSpices", chervil: "herbsSpices",
  // Olive Oil (only the canonical olive-oil group counts as the olive oil dot)
  "olive-oil": "oliveOil",
  // Legumes / seeds / nuts: NOT in VarietyScore — consistent with prior behaviour.
  // rapeseed, sunflower-oil, dark-chocolate: NOT in VarietyScore.
};

// ── Diversity groups that count as ONE distinct plant in the 30-plants counter ─
// sunflower-oil has countAsSinglePlant: false — excluded intentionally.
const SINGLE_PLANT_SLUGS = new Set(
  DIVERSITY_GROUP_SEED
    .filter((g) => g.countAsSinglePlant !== false)
    .map((g) => g.slug),
);

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Returns true if the ingredient resolves to a canonical plant food that counts
 * as a distinct plant for the 30-plants-a-week counter.
 * Returns false for non-canonical foods and for foods with diversityGroupSlug null.
 */
export function isPlantIngredient(ingredient: string): boolean {
  const r = resolveCanonicalFood(ingredient);
  if (!r.matched || !r.diversityGroupSlug) return false;
  return SINGLE_PLANT_SLUGS.has(r.diversityGroupSlug);
}

/**
 * Returns the plant category for an ingredient, or null if not a recognised
 * plant food. Used by the Plant Diversity Report to group plants by category.
 */
export function getPlantCategory(ingredient: string): PlantCategory | null {
  const r = resolveCanonicalFood(ingredient);
  if (!r.matched || !r.diversityGroupSlug) return null;
  return GROUP_TO_PLANT_CATEGORY[r.diversityGroupSlug] ?? null;
}

/**
 * Returns a VarietyScore for a meal's ingredient list.
 * Counts up to 3 distinct fruit groups and 3 distinct vegetable groups;
 * herbs/spices, whole grains, and olive oil each cap at 1.
 * Deduplication is by diversity group slug — tomato varieties all collapse to one.
 */
export function computeMealVariety(ingredients: string[]): VarietyScore {
  let fruits = 0;
  let vegetables = 0;
  let wholeGrains = 0;
  let herbsSpices = 0;
  let oliveOil = 0;

  const seen = new Set<string>();

  for (const raw of ingredients) {
    if (!raw) continue;
    const r = resolveCanonicalFood(raw);
    if (!r.matched || !r.diversityGroupSlug) continue;
    if (seen.has(r.diversityGroupSlug)) continue;
    seen.add(r.diversityGroupSlug);

    const key = GROUP_TO_VARIETY_KEY[r.diversityGroupSlug];
    if (!key) continue;

    switch (key) {
      case "fruits":      if (fruits < 3) fruits++;     break;
      case "vegetables":  if (vegetables < 3) vegetables++; break;
      case "wholeGrains": if (wholeGrains < 1) wholeGrains = 1; break;
      case "herbsSpices": if (herbsSpices < 1) herbsSpices = 1; break;
      case "oliveOil":    if (oliveOil < 1) oliveOil = 1;    break;
    }
  }

  const total = fruits + vegetables + wholeGrains + herbsSpices + oliveOil;
  return { fruits, vegetables, wholeGrains, herbsSpices, oliveOil, total };
}

export function sumVarietyScores(scores: VarietyScore[]): VarietyScore {
  return scores.reduce(
    (acc, s) => ({
      fruits: acc.fruits + s.fruits,
      vegetables: acc.vegetables + s.vegetables,
      wholeGrains: acc.wholeGrains + s.wholeGrains,
      herbsSpices: acc.herbsSpices + s.herbsSpices,
      oliveOil: acc.oliveOil + s.oliveOil,
      total: acc.total + s.total,
    }),
    { ...EMPTY_VARIETY_SCORE },
  );
}
