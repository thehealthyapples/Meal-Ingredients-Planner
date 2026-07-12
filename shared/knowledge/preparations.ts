// Preparation Knowledge — the catalogue vocabulary (PHASE5A; builds WS5A)
// ============================================================================
//
// "The same food. A different thing done to it. Nutrition only changes if the
//  evidence says so."  — WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md
//
// This is a REFERENCE VOCABULARY beside the entity spine (Principle 5), exactly
// as nutrients.ts and health-benefits.ts are. It is not an entity, it mints no
// canonical food (WS5A Risk R6), and it never touches identity resolution: a
// preparation is a SECOND, INDEPENDENT READ of an ingredient string, and the
// identity read is unchanged (WS5A §1.7, the two-reads principle).
//
// ── Where this vocabulary comes from ───────────────────────────────────────
//
// WS5A §10.2 names `commonForms` (shared/knowledge/foods.ts) as "the seed", and
// calls the migration "a re-typing of data THA already authored — no new facts
// invented." That is the right instinct and it needed one correction before it
// could be executed.
//
// `commonForms` holds 308 distinct strings, and only a minority of them are
// preparations. It also holds cuts ("fillet", "breast"), shapes-as-packaging
// ("block", "bottle"), dish usages ("in salads", "in soups"), and other foods
// entirely ("flour", "butter", "hummus", "pasta"). Re-typing all 308 would have
// imported every one of those as a "preparation" — failing WS5A's own three
// tests (§1.3) and its composite exclusion (§1.5 Case D), and handing the
// platform a vocabulary it would then have to un-learn.
//
// So the mapping below is CURATED, not mechanical. Every entry earns its place
// by passing WS5A's tests P1/P2/P3. Everything that does not pass is recorded
// in EXCLUDED_FORMS with the reason it was declined — because a declined
// discovery that is silently dropped has not been declined, it has been
// mislaid, and it will be back (PKCA Rule KC12).
//
// ── The two dimensions, and why only one of them lives here ────────────────
//
// EXISTENCE (this file) — that people eat this food this way. Cheap, editorial,
//   always allowed, no citation required. This is the MVF bar (Rule KC5).
//
// EFFECT (NOT this file) — that a preparation measurably CHANGES nutrition.
//   Expensive, evidence-gated, rare. An effect lives in
//   knowledge_preparation_effects, requires a Layer-1 trusted citation and a
//   named human sign-off, and enters through the existing review workflow. No
//   effect is authored here, and none is seeded: THA states that a preparation
//   exists freely, and states that it CHANGES something only when trusted
//   evidence has earned it the right to speak (WS5A §9.3).

import type { PreparationType } from "../schema";

/** One preparation in the catalogue. */
export interface PreparationSeed {
  slug: string;
  name: string;
  prepType: PreparationType;
  description: string;
  /** Parent preparation (WS5A §1.5 Case F — a shallow hierarchy, not a tree). */
  family?: string;
  displayOrder: number;
}

// ── The catalogue ────────────────────────────────────────────────────────────
//
// Four types, verbatim from WS5A §1.6. `composite` is deliberately not a type:
// a composite ADDS other foods and is not a preparation at all (§1.5 Case D).
//
// The heat methods sit under a generic `cooked` parent. WS5A §1.5 Case F warns
// against splitting children where no evidenced effect distinguishes them —
// that warning governs EFFECTS, not existence. A household recognises "roasted"
// and "steamed" as different things they do, and saying so costs no evidence.
// What the hierarchy buys is that a future effect attached to `cooked` is
// inherited by its children without being restated four times.

export const PREPARATION_SEED: PreparationSeed[] = [
  // ── state — the baseline. No transformation. The reference point. ──────────
  { slug: "raw", name: "Raw", prepType: "state", description: "Eaten without cooking.", displayOrder: 10 },
  { slug: "fresh", name: "Fresh", prepType: "state", description: "In its unpreserved, just-bought state.", displayOrder: 20 },

  // ── preservation — a format that extends shelf life. What you BUY. ─────────
  { slug: "frozen", name: "Frozen", prepType: "preservation", description: "Preserved by freezing, often at source.", displayOrder: 100 },
  { slug: "tinned", name: "Tinned", prepType: "preservation", description: "Cooked and sealed in a tin or can.", displayOrder: 110 },
  { slug: "dried", name: "Dried", prepType: "preservation", description: "Preserved by removing water.", displayOrder: 120 },
  { slug: "sun-dried", name: "Sun-dried", prepType: "preservation", description: "Dried in the sun, concentrating flavour and weight.", family: "dried", displayOrder: 130 },
  { slug: "pickled", name: "Pickled", prepType: "preservation", description: "Preserved in vinegar or brine.", displayOrder: 140 },
  { slug: "salted", name: "Salted", prepType: "preservation", description: "Preserved with salt.", displayOrder: 150 },
  { slug: "jarred", name: "Jarred", prepType: "preservation", description: "Preserved in a jar, usually in oil, brine or syrup.", displayOrder: 160 },

  // ── cooking — heat applied in the kitchen. The "cooking methods". ──────────
  { slug: "cooked", name: "Cooked", prepType: "cooking", description: "Prepared with heat — the general case.", displayOrder: 200 },
  { slug: "boiled", name: "Boiled", prepType: "cooking", description: "Cooked in boiling water.", family: "cooked", displayOrder: 210 },
  { slug: "steamed", name: "Steamed", prepType: "cooking", description: "Cooked over steam, without submerging.", family: "cooked", displayOrder: 220 },
  { slug: "roasted", name: "Roasted", prepType: "cooking", description: "Cooked with dry heat in an oven.", family: "cooked", displayOrder: 230 },
  { slug: "baked", name: "Baked", prepType: "cooking", description: "Cooked with dry heat, usually in an oven.", family: "cooked", displayOrder: 240 },
  { slug: "grilled", name: "Grilled", prepType: "cooking", description: "Cooked under or over direct high heat.", family: "cooked", displayOrder: 250 },
  { slug: "fried", name: "Fried", prepType: "cooking", description: "Cooked in hot fat or oil.", family: "cooked", displayOrder: 260 },
  { slug: "pan-fried", name: "Pan-fried", prepType: "cooking", description: "Cooked in a shallow layer of fat in a pan.", family: "fried", displayOrder: 270 },
  { slug: "stir-fried", name: "Stir-fried", prepType: "cooking", description: "Cooked quickly in a little fat over high heat, moving constantly.", family: "fried", displayOrder: 280 },
  { slug: "deep-fried", name: "Deep-fried", prepType: "cooking", description: "Cooked submerged in hot oil.", family: "fried", displayOrder: 290 },
  { slug: "poached", name: "Poached", prepType: "cooking", description: "Cooked gently in liquid below boiling.", family: "cooked", displayOrder: 300 },
  { slug: "braised", name: "Braised", prepType: "cooking", description: "Browned, then cooked slowly in a little liquid.", family: "cooked", displayOrder: 310 },
  { slug: "stewed", name: "Stewed", prepType: "cooking", description: "Cooked slowly, submerged in liquid.", family: "cooked", displayOrder: 320 },
  { slug: "sauteed", name: "Sautéed", prepType: "cooking", description: "Cooked quickly in a little fat over moderate heat.", family: "fried", displayOrder: 330 },
  { slug: "seared", name: "Seared", prepType: "cooking", description: "Browned briefly at high heat.", family: "cooked", displayOrder: 340 },
  { slug: "blanched", name: "Blanched", prepType: "cooking", description: "Briefly boiled, then cooled quickly.", family: "cooked", displayOrder: 350 },

  // ── processing — transformation without (or beyond) domestic heat. ─────────
  // These are the "cooking techniques": the non-heat things a kitchen or a
  // factory does to a food.
  { slug: "smoked", name: "Smoked", prepType: "processing", description: "Cured and flavoured with smoke.", displayOrder: 400 },
  { slug: "toasted", name: "Toasted", prepType: "processing", description: "Browned with dry heat, without fat.", displayOrder: 410 },
  { slug: "fermented", name: "Fermented", prepType: "processing", description: "Transformed by micro-organisms.", displayOrder: 420 },
  { slug: "marinated", name: "Marinated", prepType: "processing", description: "Steeped in a seasoned liquid before cooking.", displayOrder: 430 },
  { slug: "soaked", name: "Soaked", prepType: "processing", description: "Left to absorb water before cooking or eating.", displayOrder: 440 },
  { slug: "ground", name: "Ground", prepType: "processing", description: "Milled to a powder or a coarse meal.", displayOrder: 450 },
  { slug: "rolled", name: "Rolled", prepType: "processing", description: "Flattened between rollers.", displayOrder: 460 },
  { slug: "crushed", name: "Crushed", prepType: "processing", description: "Broken down under pressure.", displayOrder: 470 },
  { slug: "mashed", name: "Mashed", prepType: "processing", description: "Crushed to a soft, even texture.", displayOrder: 480 },
  { slug: "grated", name: "Grated", prepType: "processing", description: "Shredded into fine strands.", displayOrder: 490 },
  { slug: "sliced", name: "Sliced", prepType: "processing", description: "Cut into slices.", displayOrder: 500 },
  { slug: "chopped", name: "Chopped", prepType: "processing", description: "Cut into pieces.", displayOrder: 510 },
  { slug: "shredded", name: "Shredded", prepType: "processing", description: "Cut or torn into thin strips.", displayOrder: 520 },
  { slug: "juiced", name: "Juiced", prepType: "processing", description: "Pressed or extracted to a juice.", displayOrder: 530 },
];

// ── commonForms → preparation ────────────────────────────────────────────────
//
// The migration map. LHS is the string as it actually appears in FOOD_SEED's
// `commonForms`; RHS is the catalogue slug. A form absent from this map is NOT
// a preparation and is declined — see EXCLUDED_FORMS below.
//
// `commonForms` itself is UNCHANGED and stays exactly where it is. This map
// reads it; it does not replace it, and nothing about the food-detail surface
// that renders it changes. (WS5A §1.7 — the preparation read never feeds back.)

export const FORM_TO_PREPARATION: Readonly<Record<string, string>> = {
  raw: "raw",
  "sliced raw": "raw",
  fresh: "fresh",
  "whole fresh": "fresh",
  "fresh root": "fresh",
  "fresh leaves": "fresh",
  "fresh fillet": "fresh",
  "fresh stalks": "fresh",
  "fresh log": "fresh",

  frozen: "frozen",
  "frozen chunks": "frozen",
  "frozen packs": "frozen",
  tinned: "tinned",
  "tinned in oil": "tinned",
  "tinned in brine": "tinned",
  "tinned in syrup": "tinned",
  "tinned hearts": "tinned",
  dried: "dried",
  "dried leaves": "dried",
  "dried (as raisins)": "dried",
  dry: "dried",
  desiccated: "dried",
  "sun-dried": "sun-dried",
  pickled: "pickled",
  salted: "salted",
  preserved: "salted",
  "in brine": "salted",
  jarred: "jarred",
  "jarred hearts": "jarred",

  cooked: "cooked",
  "cooked whole": "cooked",
  "in cooking": "cooked",
  boiled: "boiled",
  steamed: "steamed",
  roasted: "roasted",
  baked: "baked",
  grilled: "grilled",
  fried: "fried",
  "pan-fried": "pan-fried",
  "stir-fried": "stir-fried",
  battered: "deep-fried",
  crisps: "deep-fried",
  poached: "poached",
  braised: "braised",
  stewed: "stewed",
  "slow-cooked dishes": "stewed",
  "sautéed": "sauteed",
  seared: "seared",
  blanched: "blanched",
  "blanched fine": "blanched",
  wilted: "cooked",
  scrambled: "cooked",
  confit: "cooked",

  smoked: "smoked",
  toasted: "toasted",
  marinated: "marinated",
  soaked: "soaked",
  ground: "ground",
  "ground almonds": "ground",
  powder: "ground",
  "fine flour": "ground",
  rolled: "rolled",
  "steel-cut": "ground",
  crushed: "crushed",
  mashed: "mashed",
  "purée": "mashed",
  grated: "grated",
  "whole (grated)": "grated",
  shaved: "grated",
  sliced: "sliced",
  chopped: "chopped",
  diced: "chopped",
  cubed: "chopped",
  batons: "chopped",
  sticks: "chopped",
  strips: "chopped",
  snipped: "chopped",
  torn: "chopped",
  shredded: "shredded",
  flaked: "shredded",
  crumbled: "crushed",
  juiced: "juiced",
  juice: "juiced",
  zested: "grated",
};

// ── Declined forms — recorded, not forgotten (PKCA Rule KC12) ────────────────
//
// Each of these appears in `commonForms` and is NOT a preparation. Written down
// so that the next audit does not rediscover them and re-ask the same question.
// They remain in `commonForms`, untouched, doing the display job they already do.

export const EXCLUDED_FORMS: Readonly<Record<string, string>> = {
  cuts: "A cut of meat or fish (fillet, breast, thigh, loin, chop, leg, steak, mince, rack, belly, shoulder, drumstick, escalope, tenderloin) names WHICH PART of the animal, not what was done to it. It fails WS5A test P1 — this is not the same food transformed, it is a different part. A future Cut concept, if one is ever needed, is its own layer.",
  packaging: "A container or retail format (bottle, jar, jarred, tub, block, bagged, pot, ball, vacuum-packed, bar, pods, podded, shelled, in shells) is how the food is SOLD, not what was done to it. It fails test P2 — nothing has been done to the food itself.",
  "dish-usages": 'A usage ("in salads", "in soups", "in baking", "on pizza", "in curries", "with pasta") names a DISH THE FOOD GOES INTO. It is a serving suggestion, not a state of the food, and it fails test P3.',
  composites: "A composite (granola, trail mix, hummus, tahini, dhal, baked beans, coleslaw, remoulade, pâté, chocolate, jam, jelly, sauce, dressing, cordial) ADDS OTHER FOODS. WS5A §1.5 Case D excludes these explicitly: treating them as preparations would let them inherit a single food's clean nutrition profile — 'granola is just prepared oats, so it's healthy' is precisely the failure (Risk R9).",
  "separate-foods": "A derived food (flour, butter, oil, bread, pasta, noodles, semolina, cocoa powder, coconut milk, passata, juice-as-a-drink) is its own canonical food with its own identity and its own nutrition, not a preparation of its parent. Minting it as a preparation would fork identity (Risk R6).",
  grades: "A grade or quality tier (virgin, refined, cold-pressed, aged, mature, mild, ripe, young, barista, king, tiger, jumbo, queen, giant) describes how it was PRODUCED or SOURCED. WS5A §1.4 rules these a QUALIFIER — settled before the kitchen — and a Qualifier layer (WS3B) is a separate, unbuilt concept.",
  "fat-and-composition-variants": "A composition variant (full-fat, low-fat, half-fat, reduced-fat, semi-skimmed, skimmed, light, unsweetened, sweet, plain, natural, white, brown, green, red, wholemeal, whole grain, wholewheat) names a DIFFERENT PRODUCT with a different nutrition profile, not the same food prepared differently. Several are genuinely separate canonical foods.",
  textures: "A texture or size descriptor with no transformation implied (whole, halves, halved, segments, wedge, rings, tubes, chunks, kernels, cob, florets, grains, groats, berries, seeds, leaves, whole leaves, fine, coarse, firm, silken, smooth, crunchy, solid, liquid, spreadable, pourable) is a description, not an act. Where a real act exists it is already mapped above (sliced, chopped, grated).",
};

// ── Deriving the food ↔ preparation existence edges ──────────────────────────

export interface FoodPreparationEdge {
  foodSlug: string;
  preparationSlug: string;
  ranking: number;
}

/** The shape this reads from FOOD_SEED — declared structurally so this module
 *  stays importable from seeds, scripts and tests without a cycle. */
export interface FoodWithForms {
  slug: string;
  commonForms?: string[] | readonly string[];
}

const PREPARATION_SLUGS = new Set(PREPARATION_SEED.map((p) => p.slug));

/**
 * Project each food's authored `commonForms` onto the preparation catalogue.
 *
 * This invents NOTHING. Every edge it emits traces to a string a human already
 * wrote in `commonForms`, mapped through FORM_TO_PREPARATION above. A food with
 * no recognised form gets no preparations — an honest gap, not a default set.
 *
 * `ranking` preserves the order the editor listed the forms in, which is the
 * only prominence signal the source data actually carries. Inventing a
 * different order would be asserting an editorial judgement nobody made.
 */
export function deriveFoodPreparations(foods: readonly FoodWithForms[]): FoodPreparationEdge[] {
  const edges: FoodPreparationEdge[] = [];
  for (const food of foods) {
    const seen = new Set<string>();
    let rank = 0;
    for (const form of food.commonForms ?? []) {
      const prep = FORM_TO_PREPARATION[form.trim().toLowerCase()];
      if (!prep || !PREPARATION_SLUGS.has(prep) || seen.has(prep)) continue;
      seen.add(prep);
      edges.push({ foodSlug: food.slug, preparationSlug: prep, ranking: rank++ });
    }
  }
  return edges;
}

// ── Seed validation (Rule KC8 — declared is not enforced) ────────────────────

/** Structural problems in the catalogue. Empty = valid. Run by the seeder. */
export function validatePreparationSeed(): string[] {
  const problems: string[] = [];
  const slugs = new Set<string>();

  for (const prep of PREPARATION_SEED) {
    if (slugs.has(prep.slug)) problems.push(`duplicate preparation slug: ${prep.slug}`);
    slugs.add(prep.slug);
    if (!/^[a-z0-9-]+$/.test(prep.slug)) problems.push(`preparation slug is not a clean slug: ${prep.slug}`);
    if (!prep.name.trim()) problems.push(`preparation ${prep.slug} has no name`);
    if (!prep.description.trim()) problems.push(`preparation ${prep.slug} has no description`);
  }

  // The family graph must resolve and must not cycle — the same rule
  // validateCanonicalSeed() enforces for canonical_food.family (NK6R).
  for (const prep of PREPARATION_SEED) {
    if (!prep.family) continue;
    if (prep.family === prep.slug) {
      problems.push(`preparation ${prep.slug} is its own family`);
      continue;
    }
    if (!slugs.has(prep.family)) {
      problems.push(`preparation ${prep.slug} names family "${prep.family}", which is not in the catalogue`);
      continue;
    }
    const seen = new Set<string>([prep.slug]);
    let cursor: string | undefined = prep.family;
    while (cursor) {
      if (seen.has(cursor)) {
        problems.push(`preparation family graph has a cycle at ${prep.slug} → ${cursor}`);
        break;
      }
      seen.add(cursor);
      cursor = PREPARATION_SEED.find((p) => p.slug === cursor)?.family;
    }
  }

  // Every mapped target must exist. A map pointing at a slug the catalogue does
  // not hold would silently drop that form on seed — the exact silent failure
  // this validator exists to make loud.
  for (const [form, prep] of Object.entries(FORM_TO_PREPARATION)) {
    if (!slugs.has(prep)) problems.push(`FORM_TO_PREPARATION maps "${form}" → "${prep}", which is not in the catalogue`);
  }

  return problems;
}
