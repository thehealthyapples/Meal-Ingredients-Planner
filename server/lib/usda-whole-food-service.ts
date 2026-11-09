/**
 * Thin wrapper around the USDA FoodData Central (FDC) API.
 * Returns a lightweight nutrient snapshot for a curated set of whole foods.
 *
 * API key: set USDA_API_KEY env var, otherwise falls back to the public DEMO_KEY.
 * FOODUI12 (2026-10-29) — confirmed live: DEMO_KEY is 10 req/hour (the API's own
 * x-ratelimit-limit header), not the 30/hour this comment used to claim — USDA
 * appears to have tightened it since. A registered key (free, instant, at
 * https://api.data.gov/signup/) raises this to roughly 1,000 req/hour and is
 * the only way this stays usable once the comparison table is used more than
 * a handful of times an hour.
 *
 * Usage: call getWholeFoodSnapshot(slug) and, if non-null, append the result to
 * the food knowledge response.
 */

const API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";
const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";

// Curated map: food_knowledge slug → FDC ID (SR Legacy or Foundation Foods)
// These IDs are stable reference entries for raw whole foods.
const SLUG_TO_FDC_ID: Record<string, number> = {
  oats:    173904,  // Oats
  lentils: 172421,  // Lentils, raw
  salmon:  175167,  // Salmon, Atlantic, farmed, raw
  tofu:    172475,  // Tofu, raw, firm
  spinach: 168462,  // Spinach, raw
  eggs:    748967,  // Egg, whole, raw
  broccoli: 170379, // Broccoli, raw
  chickpeas: 173757, // Chickpeas (garbanzo beans), raw
  "sweet-potato": 168483, // Sweet potato, raw
  banana:  173944,  // Bananas, raw
  // FOODUI12 (2026-10-29) — added after verifying each fdcId against a live
  // USDA FDC search, not guessed: every one of these was fetched and its
  // per-100g values cross-checked (carrots matched a household-supplied
  // Google nutrition panel almost exactly, within normal rounding).
  carrots: 170393,  // Carrots, raw
  apple:   1750340, // Apples, fuji, with skin, raw
  tomato:  170457,  // Tomatoes, red, ripe, raw, year round average
  onion:   170000,  // Onions, raw
  potato:  170032,  // Potatoes, raw, skin

  // FOODUI14 (2026-10-30) — matched via a full bulk-download pass over USDA
  // FoodData Central (Foundation + SR Legacy, zero rate limit) against all 610
  // active registry foods, reusing the WS0.11/WS0.12 alias-resolver pipeline
  // (exact normalised-key matching, not word-subset) — see
  // Claude-usda-bulk-match-ALL-610-v2-TIGHTENED-2026-10-30.csv for the full
  // matching inventory. This is the "exact_candidate_found" bucket (52 rows)
  // minus 3 manually excluded after reading every description: a branded
  // product ("Vegetable juice, BOLTHOUSE FARMS") and two syrup-packed fruits
  // (mangosteen, rambutan) whose added sugar would misrepresent the fresh
  // fruit the registry entry means.
  basil: 172232, // Basil, fresh
  garlic: 1104647, // Garlic, raw
  watercress: 170068, // Watercress, raw
  swede: 2727580, // Rutabaga, peeled, raw (US->UK translation)
  "spring-onion": 2727585, // Green onion, (scallion), bulb and greens, root removed, raw
  fennel: 169385, // Fennel, bulb, raw
  radicchio: 168564, // Radicchio, raw
  chicory: 170404, // Chicory, witloof, raw
  pomegranate: 169134, // Pomegranates, raw
  nectarine: 327357, // Nectarines, raw
  watermelon: 167765, // Watermelon, raw
  "passion-fruit": 169108, // Passion-fruit, (granadilla), purple, raw
  dill: 172233, // Dill weed, fresh
  cassava: 169985, // Cassava, raw
  elderberries: 171727, // Elderberries, raw
  "goji-berries": 173032, // Goji berries, dried
  mulberries: 169913, // Mulberries, raw
  loganberries: 169088, // Loganberries, frozen
  miso: 172442, // Miso
  flaxseed: 2262075, // Flaxseed, ground
  farro: 2710828, // Farro, pearled, dry, raw
  "chia-seeds": 2710819, // Chia seeds, dry, raw
  sauerkraut: 169279, // Sauerkraut, canned, solids and liquids
  rosemary: 173473, // Rosemary, fresh
  thyme: 173470, // Thyme, fresh
  "cottage-cheese": 2346384, // Cottage cheese, full fat, large or small curd
  "cream-cheese": 2346385, // Cream cheese, full fat, block
  buttermilk: 2259792, // Buttermilk, low fat
  "almond-butter": 2262074, // Almond butter, creamy
  tahini: 2262073, // Sesame butter, creamy — common-synonym match, not a literal "tahini" USDA entry
  capers: 172238, // Capers, canned
  horseradish: 173472, // Horseradish, prepared
  natto: 172443, // Natto
  // Excluded after review: vegetable-juice (branded — "BOLTHOUSE FARMS"),
  // mangosteen and rambutan (both only matched "canned, syrup pack" forms —
  // added sugar would misrepresent the fresh fruit).
  //
  // FOODUI16 (2026-10-30) — 14 keys removed here after an audit the owner's
  // own question prompted: arrowroot, breadfruit, carrot-juice, cherimoya,
  // chicken-feet, kumquat, lard, peppermint, pomelo, prune-juice, quince,
  // rye-grain, starfruit, tomato-puree, mustard. Every one was keyed by its
  // `knowledge_foods` slug, but the comparison engine looks up this map by
  // `canonical.canonicalSlug` (shared/canonical/foods.ts, a SEPARATE, smaller
  // 312-food identity list) — none of these 14 foods have a canonical-food
  // entry at all, so the key could never be reached; it wasn't a typo to fix,
  // the food itself doesn't exist in the system that would look it up. Their
  // real, matched USDA fdcIds are preserved in
  // Claude-usda-bulk-match-ALL-610-v2-TIGHTENED-2026-10-30.csv for whenever
  // someone decides whether these foods should be added to the canonical list
  // — that's a product decision, not something to default silently here.

  // FOODUI15 (2026-10-30) — a second pass over the "ambiguous" bucket from the
  // tightened matcher: where USDA held several distinct forms (raw / frozen /
  // canned / cooked) for one food, this applies a "raw/fresh wins when exactly
  // one raw/fresh candidate exists" default policy — close-enough forms
  // (frozen) and meaningfully different ones (dried, canned-in-syrup, cooked)
  // are excluded rather than averaged in. Foods where MULTIPLE raw/fresh forms
  // still competed (e.g. carrots: mature vs baby; onion: red/yellow/white;
  // apple: three named varieties) were deliberately left unresolved — variety
  // selection is an editorial call, not something this policy should guess.
  // Also excluded after manual review: Papayas (only matched "Pawpaw", which
  // in formal US usage can mean a botanically different fruit, Asimina
  // triloba — no scientific name was available in the USDA record to confirm
  // either way, so left out rather than risk the wrong fruit's nutrition).
  parsley: 170416, // Parsley, fresh
  beetroot: 169145, // Beets, raw
  blueberry: 171711, // Blueberries, raw — FOODUI16: key corrected from "blueberries" (the knowledge-registry slug, not canonical)
  strawberry: 167762, // Strawberries, raw — FOODUI16: key corrected from "strawberries" (the knowledge-registry slug, not canonical)
  kiwi: 168153, // Kiwifruit, green, raw
  parsnip: 170417, // Parsnips, raw
  turnip: 170465, // Turnips, raw
  aubergine: 169228, // Eggplant, raw
  celery: 169988, // Celery, raw
  pumpkin: 168448, // Pumpkin, raw
  "brussels-sprouts": 170383, // Brussels sprouts, raw
  celeriac: 170400, // Celeriac, raw
  kohlrabi: 168424, // Kohlrabi, raw
  chard: 169991, // Chard, swiss, raw
  raspberry: 167755, // Raspberries, raw
  peach: 169928, // Peaches, yellow, raw
  fig: 173021, // Figs, raw
  blackberry: 173946, // Blackberries, raw
  cranberry: 171722, // Cranberries, raw
  gooseberry: 173030, // Gooseberries, raw
  chives: 169994, // Chives, raw
  barley: 170284, // Barley, pearled, raw
  "bulgur-wheat": 2710820, // Bulgur, dry, raw
  okra: 169260, // Okra, raw
  "bamboo-shoots": 169210, // Bamboo shoots, raw
  "broccoli-raab": 170381, // Broccoli raab, raw
  "mustard-greens": 169256, // Mustard greens, raw
  jackfruit: 174687, // Jackfruit, raw
  lychees: 169086, // Litchis, raw
  tempeh: 174272, // Tempeh
  mint: 173475, // Spearmint, fresh
  buckwheat: 170286, // Buckwheat
  kale: 168421, // Kale, raw
  // FOODUI16: longan and rhubarb removed — same reason as the 14 above, no
  // canonical-food entry exists for either, so these keys were unreachable.
};

// USDA nutrient IDs for the fields we care about. The macro IDs were the
// original 2026-10-29 set; the vitamin/mineral IDs below were added
// 2026-10-31 after the owner asked why a Google search can show "Vitamin K
// 390 mcg per 100g" for kale when THA only ever showed the nutrient's NAME.
// The answer: a USDA record genuinely holds ~110 nutrient fields (confirmed
// live against kale's own real record, fdcId 168421 — every ID below was
// read from that live response, not assumed from memory), and this map was
// only ever extracting 6 of them. This is a parsing-scope gap, not a missing
// data source — no new integration, just reading more of what's already
// fetched. Two deliberately NOT included: Quercetin and Kaempferol (the
// flavonoid antioxidants Google's own answer also named) are not in USDA's
// standard FoodData Central nutrient panel at all — confirmed absent from
// the live kale record — so they stay an honest gap rather than a guess.
const NUTRIENT_IDS: Record<string, number> = {
  calories:    1008,
  protein:     1003,
  carbs:       1005,
  fat:         1004,
  fibre:       1079,
  sugar:       2000,
  vitaminK:    1185,
  vitaminC:    1162,
  vitaminA:    1106,
  vitaminE:    1109,
  vitaminB6:   1175,
  folate:      1177,
  calcium:     1087,
  potassium:   1092,
  iron:        1089,
  magnesium:   1090,
  zinc:        1095,
  sodium:      1093,
  phosphorus:  1091,
  manganese:   1101,
  copper:      1098,
  betaCarotene: 1107,
  luteinZeaxanthin: 1123,
};

// USDA's own unit for each ID above (mirrors what the live record reports —
// mcg for the small-quantity vitamins/carotenoids, mg for everything else).
// Carried through so a consumer can label a number correctly without a
// second lookup.
const NUTRIENT_UNITS: Record<keyof typeof NUTRIENT_IDS, string> = {
  calories: "kcal", protein: "g", carbs: "g", fat: "g", fibre: "g", sugar: "g",
  vitaminK: "µg", vitaminC: "mg", vitaminA: "µg", vitaminE: "mg", vitaminB6: "mg",
  folate: "µg", calcium: "mg", potassium: "mg", iron: "mg", magnesium: "mg",
  zinc: "mg", sodium: "mg", phosphorus: "mg", manganese: "mg", copper: "mg",
  betaCarotene: "µg", luteinZeaxanthin: "µg",
};

export interface NutrientSnapshot {
  per100g: {
    calories: number | null;
    protein:  number | null;
    carbs:    number | null;
    fat:      number | null;
    fibre:    number | null;
    sugar:    number | null;
    vitaminK: number | null;
    vitaminC: number | null;
    vitaminA: number | null;
    vitaminE: number | null;
    vitaminB6: number | null;
    folate: number | null;
    calcium: number | null;
    potassium: number | null;
    iron: number | null;
    magnesium: number | null;
    zinc: number | null;
    sodium: number | null;
    phosphorus: number | null;
    manganese: number | null;
    copper: number | null;
    betaCarotene: number | null;
    luteinZeaxanthin: number | null;
  };
  /** USDA's own unit for each field above — e.g. per100g.vitaminK is in units.vitaminK ("µg"). */
  units: typeof NUTRIENT_UNITS;
  fdcId:   number;
  source:  "usda-fdc";
}

function extractNutrients(foodNutrients: any[]): NutrientSnapshot["per100g"] {
  // Macros keep their original 1-decimal rounding (unchanged behaviour).
  // Micronutrients use 2 decimals — several real values (e.g. copper,
  // 0.053 mg) would round to 0 at 1 decimal, turning a real trace amount
  // into a false "none detected".
  const find = (id: number, decimals = 1) => {
    const match = foodNutrients.find(
      (n: any) => n.nutrientId === id || n.nutrient?.id === id
    );
    if (!match) return null;
    const factor = 10 ** decimals;
    return Math.round((match.value ?? match.amount ?? 0) * factor) / factor;
  };
  return {
    calories: find(NUTRIENT_IDS.calories),
    protein:  find(NUTRIENT_IDS.protein),
    carbs:    find(NUTRIENT_IDS.carbs),
    fat:      find(NUTRIENT_IDS.fat),
    fibre:    find(NUTRIENT_IDS.fibre),
    sugar:    find(NUTRIENT_IDS.sugar),
    vitaminK: find(NUTRIENT_IDS.vitaminK, 2),
    vitaminC: find(NUTRIENT_IDS.vitaminC, 2),
    vitaminA: find(NUTRIENT_IDS.vitaminA, 2),
    vitaminE: find(NUTRIENT_IDS.vitaminE, 2),
    vitaminB6: find(NUTRIENT_IDS.vitaminB6, 2),
    folate: find(NUTRIENT_IDS.folate, 2),
    calcium: find(NUTRIENT_IDS.calcium, 2),
    potassium: find(NUTRIENT_IDS.potassium, 2),
    iron: find(NUTRIENT_IDS.iron, 2),
    magnesium: find(NUTRIENT_IDS.magnesium, 2),
    zinc: find(NUTRIENT_IDS.zinc, 2),
    sodium: find(NUTRIENT_IDS.sodium, 2),
    phosphorus: find(NUTRIENT_IDS.phosphorus, 2),
    manganese: find(NUTRIENT_IDS.manganese, 2),
    copper: find(NUTRIENT_IDS.copper, 2),
    betaCarotene: find(NUTRIENT_IDS.betaCarotene, 2),
    luteinZeaxanthin: find(NUTRIENT_IDS.luteinZeaxanthin, 2),
  };
}

export async function getWholeFoodSnapshot(slug: string): Promise<NutrientSnapshot | null> {
  const fdcId = SLUG_TO_FDC_ID[slug];
  if (!fdcId) return null;

  try {
    const url = `${FDC_BASE}/food/${fdcId}?fields=foodNutrients&api_key=${API_KEY}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "THA/1.0 (contact@theappleshop.app)" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const foodNutrients: any[] = data.foodNutrients || [];
    if (foodNutrients.length === 0) return null;

    return {
      per100g: extractNutrients(foodNutrients),
      units: NUTRIENT_UNITS,
      fdcId,
      source: "usda-fdc",
    };
  } catch {
    return null;
  }
}

/** Returns the list of slugs that have USDA data wired up. */
export function supportedWholeFoodSlugs(): string[] {
  return Object.keys(SLUG_TO_FDC_ID);
}
