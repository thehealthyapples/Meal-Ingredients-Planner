// KNOW5 — sourced food↔nutrient composition claim pack.
//
// The composition edge asserts the food-specific premise every benefit chip
// rests on: "this food is a notable source of that nutrient". KNOW5 found that
// edge carried no evidence contract at all — 755 chips rendered, 382 of them on
// an AI-drafted premise no human ever reviewed, wearing an NHS or EFSA citation
// that was earned by the nutrient-level sentence and says nothing about the food.
// `plain-wheat-flour → fibre → gut-health [NHS]` rendered on the false premise
// that refined white starch is a notable fibre source.
//
// This file is the composition edge's answer to claim-sources.ts. It carries the
// citations, and nothing else.
//
// RULES (enforced by validateKnowledgeSeed + test-know5-evidence-contract):
//   • Citations only — every (food, nutrient) pair below must already exist in
//     FOOD_NUTRIENT_SEED. This file adds sources to existing links; it never
//     adds a link. 19 candidate pairs were dropped during authoring for exactly
//     this reason (e.g. `kale → calcium`, which the NHS names but THA does not
//     link): a citation may not introduce a claim.
//   • Every SourceRef must clear Layer 1 (evidence.ts) — https, trusted domain,
//     ISO lastReviewed. No allowlist widening was needed: the NHS states
//     food-specific composition directly, on domains already trusted.
//   • CANDIDATE-stage content (Rule KC9). Seeding this file publishes nothing.
//     Rows stay dark until a human runs `npm run knowledge:signoff --reviewer`,
//     which alone sets reviewed_at + reviewed_by.
//
// PROVENANCE. Every `title` below quotes the source page VERBATIM. Each NHS page
// was fetched and read on 2026-07-09 and the quoted wording copied from it — the
// quote is the evidence, and a reviewer can check it against the URL without
// trusting this file's author. Where the page names a category rather than the
// food ("red meat", "cheese", "oily fish – such as salmon"), the verbatim quote
// makes the instance-of step visible so the reviewer can accept or reject it.
// That judgement is the reviewer's, which is why nothing here renders unsigned.
//
// A MODEL MAY PROPOSE; ONLY A TABLE MAY ATTEST. These citations are public-health
// source pages, not a nutrient composition table. They support "notable source
// of", which is exactly what this edge asserts — never a numeric amount. The
// numeric composition importer (USDA FDC / gov.uk CoFID) is KNOW5E; until it
// exists, `knowledge_food_nutrients.amount` stays unused and uncited.
//
// PORTION PLAUSIBILITY (KNOW5 §10.3). No spice, oil, flour or refined starch
// appears below. They are eaten in gram quantities or have had the nutrient
// refined out; a per-100 g claim about them is a fabrication in effect. Their
// chips go dark and stay dark.
import type { KnowledgeSourceRef } from "./evidence";

export interface SourcedFoodNutrientClaim {
  foodSlug: string;
  nutrientSlug: string;
  /** Sourced composition claims are 'established' — backed by an official source. */
  evidenceStrength: "established";
  sourceRefs: KnowledgeSourceRef[];
}

/** The date every NHS page below was fetched and its wording checked. */
const CHECKED = "2026-07-09";

const nhs = (title: string, url: string): KnowledgeSourceRef => ({
  body: "NHS",
  title,
  url,
  evidenceLevel: "established",
  lastReviewed: CHECKED,
});

// ── The NHS pages this pack cites, and the verbatim wording taken from each ───

const IRON_URL = "https://www.nhs.uk/conditions/vitamins-and-minerals/iron/";
const CALCIUM_URL = "https://www.nhs.uk/conditions/vitamins-and-minerals/calcium/";
const VITAMIN_C_URL = "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-c/";
const VITAMIN_D_URL = "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-d/";
const VITAMIN_K_URL = "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-k/";
const IODINE_URL = "https://www.nhs.uk/conditions/vitamins-and-minerals/iodine/";
const OTHERS_URL = "https://www.nhs.uk/conditions/vitamins-and-minerals/others/";
const B_VITAMINS_URL = "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-b/";
const FIBRE_URL = "https://www.nhs.uk/live-well/eat-well/digestive-health/how-to-get-more-fibre-into-your-diet/";
const OILY_FISH_URL = "https://www.nhs.uk/live-well/eat-well/food-types/fish-and-shellfish-nutrition/";
const FATS_URL = "https://www.nhs.uk/live-well/eat-well/food-types/different-fats-nutrition/";

/** Quote the source page, attributed to the nutrient's own NHS page. */
const iron = (quote: string) => nhs(`Iron — Vitamins and minerals: good sources of iron include “${quote}”`, IRON_URL);
const calcium = (quote: string) => nhs(`Calcium — Vitamins and minerals: sources of calcium include “${quote}”`, CALCIUM_URL);
const vitaminC = (quote: string) => nhs(`Vitamin C — Vitamins and minerals: good sources of vitamin C include “${quote}”`, VITAMIN_C_URL);
const vitaminD = (quote: string) => nhs(`Vitamin D — Vitamins and minerals: good food sources of vitamin D include “${quote}”`, VITAMIN_D_URL);
const vitaminK = (quote: string) => nhs(`Vitamin K — Vitamins and minerals: good sources of vitamin K include “${quote}”`, VITAMIN_K_URL);
const iodine = (quote: string) => nhs(`Iodine — Vitamins and minerals: good sources of iodine include “${quote}”`, IODINE_URL);
const others = (nutrient: string, quote: string) => nhs(`Others — Vitamins and minerals: good sources of ${nutrient} are “${quote}”`, OTHERS_URL);
const bVitamin = (nutrient: string, quote: string) => nhs(`B vitamins and folic acid — good sources of ${nutrient} include “${quote}”`, B_VITAMINS_URL);
const fibre = (quote: string) => nhs(`How to get more fibre into your diet — “${quote}”`, FIBRE_URL);
const oilyFish = (quote: string) => nhs(`Fish and shellfish — “Oily fish are the richest source of long-chain omega-3”; oily fish include “${quote}”`, OILY_FISH_URL);
const unsaturated = (quote: string) => nhs(`Different fats — unsaturated fats are found in “${quote}”`, FATS_URL);

/**
 * 49 cited composition claims across 17 nutrients. Each nutrient here carries at
 * least one signed-off nutrient→benefit claim, so each of these premises can
 * actually complete a chain — citing a premise whose nutrient supports no
 * evidence-backed benefit would light nothing and mean nothing.
 */
export const FOOD_NUTRIENT_SOURCES: SourcedFoodNutrientClaim[] = [
  // ── Iron ────────────────────────────────────────────────────────────────────
  { foodSlug: "liver", nutrientSlug: "iron", evidenceStrength: "established", sourceRefs: [iron("liver (but avoid this during pregnancy)")] },
  { foodSlug: "kidney-beans", nutrientSlug: "iron", evidenceStrength: "established", sourceRefs: [iron("beans, such as red kidney beans, edamame beans and chickpeas")] },
  { foodSlug: "chickpeas", nutrientSlug: "iron", evidenceStrength: "established", sourceRefs: [iron("beans, such as red kidney beans, edamame beans and chickpeas")] },
  // Instance-of: beef is red meat. The quote shows the reviewer the step.
  { foodSlug: "beef", nutrientSlug: "iron", evidenceStrength: "established", sourceRefs: [iron("red meat")] },

  // ── Calcium ─────────────────────────────────────────────────────────────────
  { foodSlug: "milk", nutrientSlug: "calcium", evidenceStrength: "established", sourceRefs: [calcium("milk, cheese and other dairy foods")] },
  { foodSlug: "cheddar", nutrientSlug: "calcium", evidenceStrength: "established", sourceRefs: [calcium("milk, cheese and other dairy foods")] },
  { foodSlug: "sardines", nutrientSlug: "calcium", evidenceStrength: "established", sourceRefs: [calcium("fish where you eat the bones – such as sardines and pilchards")] },
  // NOTE: the same NHS page explicitly EXCLUDES spinach ("green leafy vegetables
  // – such as curly kale, okra but not spinach"). `spinach → calcium` is not
  // cited here and its chips do not render. This is the pack working as intended.

  // ── Vitamin C ───────────────────────────────────────────────────────────────
  { foodSlug: "oranges", nutrientSlug: "vitamin-c", evidenceStrength: "established", sourceRefs: [vitaminC("citrus fruit, such as oranges and orange juice")] },
  { foodSlug: "red-pepper", nutrientSlug: "vitamin-c", evidenceStrength: "established", sourceRefs: [vitaminC("peppers")] },
  { foodSlug: "strawberries", nutrientSlug: "vitamin-c", evidenceStrength: "established", sourceRefs: [vitaminC("strawberries")] },
  { foodSlug: "broccoli", nutrientSlug: "vitamin-c", evidenceStrength: "established", sourceRefs: [vitaminC("broccoli")] },
  { foodSlug: "brussels-sprouts", nutrientSlug: "vitamin-c", evidenceStrength: "established", sourceRefs: [vitaminC("brussels sprouts")] },
  { foodSlug: "potato", nutrientSlug: "vitamin-c", evidenceStrength: "established", sourceRefs: [vitaminC("potatoes")] },

  // ── Vitamin D ───────────────────────────────────────────────────────────────
  { foodSlug: "salmon", nutrientSlug: "vitamin-d", evidenceStrength: "established", sourceRefs: [vitaminD("oily fish – such as salmon, sardines, trout, herring or mackerel")] },
  { foodSlug: "sardines", nutrientSlug: "vitamin-d", evidenceStrength: "established", sourceRefs: [vitaminD("oily fish – such as salmon, sardines, trout, herring or mackerel")] },
  { foodSlug: "mackerel", nutrientSlug: "vitamin-d", evidenceStrength: "established", sourceRefs: [vitaminD("oily fish – such as salmon, sardines, trout, herring or mackerel")] },
  { foodSlug: "eggs", nutrientSlug: "vitamin-d", evidenceStrength: "established", sourceRefs: [vitaminD("egg yolks")] },

  // ── Vitamin K ───────────────────────────────────────────────────────────────
  { foodSlug: "broccoli", nutrientSlug: "vitamin-k", evidenceStrength: "established", sourceRefs: [vitaminK("green leafy vegetables – such as broccoli and spinach")] },
  { foodSlug: "spinach", nutrientSlug: "vitamin-k", evidenceStrength: "established", sourceRefs: [vitaminK("green leafy vegetables – such as broccoli and spinach")] },

  // ── Magnesium ───────────────────────────────────────────────────────────────
  { foodSlug: "spinach", nutrientSlug: "magnesium", evidenceStrength: "established", sourceRefs: [others("magnesium", "spinach, nuts, wholemeal bread")] },

  // ── Potassium ───────────────────────────────────────────────────────────────
  { foodSlug: "bananas", nutrientSlug: "potassium", evidenceStrength: "established", sourceRefs: [others("potassium", "bananas, some vegetables – such as broccoli, parsnips and brussels sprouts, beans and pulses, nuts and seeds, fish, beef, chicken, turkey")] },

  // ── Selenium ────────────────────────────────────────────────────────────────
  { foodSlug: "brazil-nuts", nutrientSlug: "selenium", evidenceStrength: "established", sourceRefs: [others("selenium", "brazil nuts, fish, meat, eggs")] },
  { foodSlug: "eggs", nutrientSlug: "selenium", evidenceStrength: "established", sourceRefs: [others("selenium", "brazil nuts, fish, meat, eggs")] },

  // ── Vitamin B6 ──────────────────────────────────────────────────────────────
  { foodSlug: "chicken", nutrientSlug: "vitamin-b6", evidenceStrength: "established", sourceRefs: [bVitamin("vitamin B6", "poultry, such as chicken or turkey")] },
  { foodSlug: "turkey", nutrientSlug: "vitamin-b6", evidenceStrength: "established", sourceRefs: [bVitamin("vitamin B6", "poultry, such as chicken or turkey")] },
  { foodSlug: "bananas", nutrientSlug: "vitamin-b6", evidenceStrength: "established", sourceRefs: [bVitamin("vitamin B6", "bananas")] },

  // ── Vitamin B12 ─────────────────────────────────────────────────────────────
  { foodSlug: "milk", nutrientSlug: "vitamin-b12", evidenceStrength: "established", sourceRefs: [bVitamin("vitamin B12", "meat, fish, milk, cheese, eggs")] },
  { foodSlug: "cheddar", nutrientSlug: "vitamin-b12", evidenceStrength: "established", sourceRefs: [bVitamin("vitamin B12", "meat, fish, milk, cheese, eggs")] },
  { foodSlug: "eggs", nutrientSlug: "vitamin-b12", evidenceStrength: "established", sourceRefs: [bVitamin("vitamin B12", "meat, fish, milk, cheese, eggs")] },

  // ── Folate ──────────────────────────────────────────────────────────────────
  { foodSlug: "broccoli", nutrientSlug: "folate", evidenceStrength: "established", sourceRefs: [bVitamin("folate", "broccoli")] },
  { foodSlug: "brussels-sprouts", nutrientSlug: "folate", evidenceStrength: "established", sourceRefs: [bVitamin("folate", "brussels sprouts")] },
  { foodSlug: "spinach", nutrientSlug: "folate", evidenceStrength: "established", sourceRefs: [bVitamin("folate", "leafy green vegetables, such as cabbage, kale, spring greens and spinach")] },
  { foodSlug: "chickpeas", nutrientSlug: "folate", evidenceStrength: "established", sourceRefs: [bVitamin("folate", "peas, chickpeas and kidney beans")] },
  { foodSlug: "liver", nutrientSlug: "folate", evidenceStrength: "established", sourceRefs: [bVitamin("folate", "liver (avoid liver if you are pregnant)")] },

  // ── Iodine ──────────────────────────────────────────────────────────────────
  { foodSlug: "milk", nutrientSlug: "iodine", evidenceStrength: "established", sourceRefs: [iodine("cows' milk and dairy products")] },
  { foodSlug: "eggs", nutrientSlug: "iodine", evidenceStrength: "established", sourceRefs: [iodine("eggs")] },

  // ── Omega-3 ─────────────────────────────────────────────────────────────────
  { foodSlug: "salmon", nutrientSlug: "omega-3", evidenceStrength: "established", sourceRefs: [oilyFish("herring (bloater, kipper and hilsa are types of herring), pilchards, salmon, sardines, sprats, trout, mackerel")] },
  { foodSlug: "sardines", nutrientSlug: "omega-3", evidenceStrength: "established", sourceRefs: [oilyFish("herring (bloater, kipper and hilsa are types of herring), pilchards, salmon, sardines, sprats, trout, mackerel")] },
  { foodSlug: "trout", nutrientSlug: "omega-3", evidenceStrength: "established", sourceRefs: [oilyFish("herring (bloater, kipper and hilsa are types of herring), pilchards, salmon, sardines, sprats, trout, mackerel")] },
  { foodSlug: "herring", nutrientSlug: "omega-3", evidenceStrength: "established", sourceRefs: [oilyFish("herring (bloater, kipper and hilsa are types of herring), pilchards, salmon, sardines, sprats, trout, mackerel")] },
  { foodSlug: "mackerel", nutrientSlug: "omega-3", evidenceStrength: "established", sourceRefs: [oilyFish("herring (bloater, kipper and hilsa are types of herring), pilchards, salmon, sardines, sprats, trout, mackerel")] },

  // ── Unsaturated fats ────────────────────────────────────────────────────────
  { foodSlug: "avocado", nutrientSlug: "unsaturated-fats", evidenceStrength: "established", sourceRefs: [unsaturated("avocados")] },
  { foodSlug: "almonds", nutrientSlug: "unsaturated-fats", evidenceStrength: "established", sourceRefs: [unsaturated("some nuts, such as almonds, brazils, and peanuts")] },
  { foodSlug: "walnuts", nutrientSlug: "unsaturated-fats", evidenceStrength: "established", sourceRefs: [unsaturated("nuts that have higher amounts of omega-6 include: walnuts, almonds, cashews")] },

  // ── Fibre ───────────────────────────────────────────────────────────────────
  // Only whole foods the page names. Refined starches are absent by design: the
  // NHS page names wholegrains, and F1's defect class was refined flour.
  { foodSlug: "lentils", nutrientSlug: "fibre", evidenceStrength: "established", sourceRefs: [fibre("beans, lentils or chickpeas")] },
  { foodSlug: "chickpeas", nutrientSlug: "fibre", evidenceStrength: "established", sourceRefs: [fibre("beans, lentils or chickpeas")] },
  { foodSlug: "kidney-beans", nutrientSlug: "fibre", evidenceStrength: "established", sourceRefs: [fibre("beans, lentils or chickpeas")] },
  { foodSlug: "oats", nutrientSlug: "fibre", evidenceStrength: "established", sourceRefs: [fibre("plain wholewheat biscuits (like Weetabix) or plain shredded whole grain (like Shredded Wheat), or porridge")] },
  { foodSlug: "brown-rice", nutrientSlug: "fibre", evidenceStrength: "established", sourceRefs: [fibre("choose wholegrains like wholewheat pasta, bulgur wheat or brown rice")] },
];

/** Fast lookup for the seed runner: "food→nutrient" → its citations. */
export const FOOD_NUTRIENT_SOURCE_BY_PAIR: ReadonlyMap<string, SourcedFoodNutrientClaim> = new Map(
  FOOD_NUTRIENT_SOURCES.map((s) => [`${s.foodSlug}→${s.nutrientSlug}`, s]),
);

/**
 * Attach composition citations to the unified food→nutrient seed.
 *
 * Called by the seed runner — the single writer — and nowhere else. It is NOT
 * done inside `food-relationships.ts` on purpose: that module is client-bundled
 * via `food-report-adapter.ts`, and the browser must never carry the citation
 * pack for claims it is not permitted to speak (KNOW4). Rows keep `reviewedAt`
 * NULL: seeding attaches sources, it never publishes (Rule KC9).
 */
export function attachCompositionSources<T extends { foodSlug: string; nutrientSlug: string }>(
  rows: readonly T[],
): Array<T & { sourceRefs: KnowledgeSourceRef[] }> {
  return rows.map((row) => {
    const sourced = FOOD_NUTRIENT_SOURCE_BY_PAIR.get(`${row.foodSlug}→${row.nutrientSlug}`);
    return { ...row, sourceRefs: sourced ? sourced.sourceRefs : [] };
  });
}
