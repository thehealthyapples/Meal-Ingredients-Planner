// WS9 — Food Alternatives Engine: curated editorial seed.
//
// This is the whole knowledge base of WS9. Every alternative is HAND-AUTHORED and
// reviewed, because the five alternative types cannot be safely derived:
//   • "lower UPF" and "cuisine" alternatives have no algorithmic signal at all
//   • "dietary" / "meal-role" swaps need a human to confirm the ROLE is preserved
// The WS9 investigation's finding holds: alternatives are Tier-3 (curated) trust.
//
// An anchor need NOT be a canonical food. Many of the brief's examples — bacon,
// pizza base, beef mince, tomato sauce, breakfast cereal — are meal COMPONENTS,
// not catalogue foods. WS9 carries its own display names so these can participate
// without polluting the canonical catalogue. Where an anchor IS canonical
// (chicken, milk, white-rice, greek-yoghurt, basil), the slug matches and names
// are enriched from the catalogue at read time.
//
// Authoring rules (enforced by trust.ts at read time, asserted in tests):
//   • role-anchored — every reason says how it fills the SAME role
//   • goal-conditional / possibility framing — "can", "often", "many", "popular"
//   • no verdict on the anchor, no "healthier / better / should switch"
//   • honesty note whenever taste/texture differs materially
//   • `suitableFor` lists ONLY diets the option genuinely satisfies (the gate)

import type { AlternativeType, Diet } from "./types";

export interface SeedOption {
  slug: string;
  name: string;
  reason: string;
  note?: string;
  /** Diets this option satisfies. Default [] (no special suitability claimed). */
  suitableFor?: Diet[];
  /** Only for cuisine options. */
  cuisine?: string;
}

export interface AnchorSeed {
  name: string;
  /** Extra query slugs that resolve to this anchor (e.g. "rice" → white-rice). */
  aliases?: string[];
  /** Diets the ANCHOR itself already satisfies — used to answer "already fits". */
  anchorSuitableFor?: Diet[];
  options: Partial<Record<AlternativeType, SeedOption[]>>;
}

// Common diet bundles, named for readability.
const PLANT: Diet[] = ["vegetarian", "vegan", "dairy_free"];
const PLANT_GF: Diet[] = ["vegetarian", "vegan", "dairy_free", "gluten_free"];

export const ALTERNATIVES_SEED: Record<string, AnchorSeed> = {
  // ── 1. CHICKEN ────────────────────────────────────────────────────────────────
  // Dietary: the brief's canonical example (tofu / tempeh / lentils). Meal-role:
  // turkey / pork keep the same white-meat preparation. Lower-UPF: chicken is a
  // whole food — deliberately SILENT (see investigation). Household: drawn from
  // the dietary pool per eater.
  chicken: {
    name: "Chicken",
    options: {
      dietary: [
        {
          slug: "tofu", name: "Tofu", suitableFor: PLANT_GF,
          reason: "Firm tofu takes on marinades and can be baked, grilled or stir-fried in the same way as chicken — a popular vegetarian protein.",
          note: "Milder on its own, so it leans on its seasoning.",
        },
        {
          slug: "tempeh", name: "Tempeh", suitableFor: PLANT_GF,
          reason: "A fermented plant protein with a firm bite; slices and cubes work wherever chicken goes in stir-fries and traybakes.",
        },
        {
          slug: "lentils", name: "Lentils", suitableFor: PLANT_GF,
          reason: "Often used to carry the protein in stews, curries and ragùs where chicken would be the main protein.",
        },
        {
          slug: "chickpeas", name: "Chickpeas", suitableFor: PLANT_GF,
          reason: "A satisfying plant protein that can fill a similar role in curries and traybakes — one most kitchens already stock.",
        },
        {
          slug: "quorn-pieces", name: "Quorn Pieces", suitableFor: ["vegetarian"],
          reason: "Mycoprotein pieces are frequently chosen as a like-for-like in stir-fries and curries.",
        },
      ],
      meal_role: [
        {
          slug: "turkey", name: "Turkey",
          reason: "Lean poultry with a mild flavour that works in most chicken recipes with no change to the cooking method.",
        },
        {
          slug: "pork", name: "Pork",
          reason: "Another light meat that roasts, grills and stir-fries in a similar way.",
        },
      ],
    },
  },

  // ── 2. MILK ───────────────────────────────────────────────────────────────────
  // Dietary: the brief's plant-milk example. Lower-UPF: milk is minimally
  // processed — plant drinks are usually MORE processed, so a "lower-UPF milk"
  // claim would be dishonest. Deliberately SILENT (investigation F.3).
  milk: {
    name: "Milk",
    anchorSuitableFor: ["vegetarian", "gluten_free", "nut_free"],
    options: {
      dietary: [
        {
          slug: "oat-milk", name: "Oat Milk", suitableFor: ["vegetarian", "vegan", "dairy_free", "nut_free"],
          reason: "A common dairy-free choice that sits well on cereal, in tea and in cooking thanks to its mild taste.",
        },
        {
          slug: "soy-milk", name: "Soy Milk", suitableFor: ["vegetarian", "vegan", "dairy_free", "gluten_free", "nut_free"],
          reason: "The plant drink closest to milk on protein; a popular dairy-free option for drinks, cereal and cooking.",
        },
        {
          slug: "almond-milk", name: "Almond Milk", suitableFor: ["vegetarian", "vegan", "dairy_free", "gluten_free", "soya_free"],
          reason: "A light, slightly nutty dairy-free option many households enjoy on cereal and in smoothies.",
          note: "Lower in protein than milk.",
        },
      ],
    },
  },

  // ── 3. RICE ───────────────────────────────────────────────────────────────────
  // Anchor is the canonical white-rice; "rice" aliases to it. Meal-role: the
  // brief's brown rice / quinoa / cauliflower rice. Rice is already vegan + GF, so
  // dietary alternatives are mostly N/A — except KETO, where cauliflower rice fills
  // the base role (tagged keto under meal_role; the gate surfaces it).
  "white-rice": {
    name: "White Rice",
    aliases: ["rice"],
    anchorSuitableFor: ["vegetarian", "vegan", "dairy_free", "gluten_free", "nut_free", "soya_free"],
    options: {
      meal_role: [
        {
          slug: "brown-rice", name: "Brown Rice", suitableFor: ["vegetarian", "vegan", "dairy_free", "gluten_free"],
          reason: "Wholegrain rice that fills exactly the same base role and cooks much the same way.",
          note: "A little nuttier and chewier, and a touch slower to cook.",
        },
        {
          slug: "quinoa", name: "Quinoa", suitableFor: ["vegetarian", "vegan", "dairy_free", "gluten_free"],
          reason: "A grain-like seed often used where rice would go, filling the same base role.",
          note: "Firmer, with a slight bite and a more distinct flavour.",
        },
        {
          slug: "bulgur-wheat", name: "Bulgur Wheat", suitableFor: ["vegetarian", "vegan", "dairy_free"],
          reason: "A quick-cooking wheat grain that fills the base role in Mediterranean and Middle Eastern dishes.",
        },
        {
          slug: "cauliflower-rice", name: "Cauliflower Rice",
          suitableFor: ["vegetarian", "vegan", "dairy_free", "gluten_free", "keto", "lower_carb"],
          reason: "Grated cauliflower stands in for the base in lighter dishes.",
          note: "Much lighter and softer — it doesn't absorb sauce the way rice does.",
        },
      ],
    },
  },

  // ── 4. GREEK YOGHURT ──────────────────────────────────────────────────────────
  // Meal-role: the brief's skyr / kefir / cottage cheese (same thick, high-protein
  // role). Dietary: dairy-free pots. Lower-UPF: the honest move is WITHIN the food
  // — plain vs flavoured (investigation F.5).
  "greek-yoghurt": {
    name: "Greek Yoghurt",
    aliases: ["greek-yogurt"],
    anchorSuitableFor: ["vegetarian", "gluten_free", "nut_free", "soya_free"],
    options: {
      meal_role: [
        {
          slug: "skyr", name: "Skyr", suitableFor: ["vegetarian", "gluten_free"],
          reason: "An Icelandic strained dairy with a similarly thick texture; frequently used the same way as Greek yoghurt.",
        },
        {
          slug: "kefir", name: "Kefir", suitableFor: ["vegetarian", "gluten_free"],
          reason: "A drinkable cultured dairy with live cultures that fills a similar breakfast and dressing role.",
          note: "Thinner — it pours rather than spoons.",
        },
        {
          slug: "cottage-cheese", name: "Cottage Cheese", suitableFor: ["vegetarian", "gluten_free"],
          reason: "A fresh curd cheese often chosen for the same creamy, high-protein role at breakfast or in dips.",
          note: "Lumpier in texture, milder in tang.",
        },
      ],
      dietary: [
        {
          slug: "soya-yoghurt", name: "Soya Yoghurt", suitableFor: ["vegetarian", "vegan", "dairy_free", "gluten_free"],
          reason: "The dairy-free yoghurt closest on protein; a common choice for breakfast bowls and dressings.",
        },
        {
          slug: "coconut-yoghurt", name: "Coconut Yoghurt",
          suitableFor: ["vegetarian", "vegan", "dairy_free", "gluten_free", "soya_free", "nut_free"],
          reason: "A creamy dairy-free pot many households enjoy in the same role.",
          note: "Lower in protein than Greek yoghurt.",
        },
      ],
      lower_upf: [
        {
          slug: "plain-greek-yoghurt", name: "Plain Greek Yoghurt", suitableFor: ["vegetarian", "gluten_free"],
          reason: "Plain pots are less processed than the flavoured ones and fill the same creamy role — you sweeten them yourself with fruit or honey.",
        },
      ],
    },
  },

  // ── 5. BACON ──────────────────────────────────────────────────────────────────
  // Editorial-only anchor (a meal component, not a catalogue food). Dietary:
  // meat-free rashers / tempeh / eggs keep the savoury fry-up role. Lower-UPF:
  // grilled fresh pork or eggs are less processed than cured rashers.
  bacon: {
    name: "Bacon",
    options: {
      dietary: [
        {
          slug: "vegetarian-bacon", name: "Meat-free Rashers", suitableFor: ["vegetarian", "vegan"],
          reason: "Smoky meat-free rashers frequently chosen to keep the savoury, crispy role in a fry-up.",
        },
        {
          slug: "tempeh", name: "Tempeh", suitableFor: PLANT_GF,
          reason: "Sliced thin and marinated, tempeh crisps into a smoky, savoury element many households enjoy.",
        },
        {
          slug: "eggs", name: "Eggs", suitableFor: ["vegetarian", "gluten_free", "nut_free", "soya_free"],
          reason: "A classic cooked-breakfast protein that fills the savoury role without the rashers.",
        },
      ],
      meal_role: [
        {
          slug: "sausage", name: "Sausage",
          reason: "Another cooked-breakfast protein that fills the savoury role on the plate.",
        },
        {
          slug: "mushrooms", name: "Mushrooms", suitableFor: PLANT_GF,
          reason: "Pan-fried mushrooms bring a savoury, umami element to a fry-up.",
        },
      ],
      lower_upf: [
        {
          slug: "grilled-pork", name: "Grilled Fresh Pork",
          reason: "A grilled fresh pork cut is less processed than cured rashers and fills the same savoury breakfast role.",
          note: "Different texture — not crispy the way rashers are.",
        },
        {
          slug: "eggs", name: "Eggs", suitableFor: ["vegetarian", "gluten_free", "nut_free", "soya_free"],
          reason: "A minimally processed cooked-breakfast protein in the same savoury role.",
        },
      ],
    },
  },

  // ── 6. PIZZA BASE ─────────────────────────────────────────────────────────────
  // Editorial-only anchor. The brief's household example: traditional / keto / GF
  // base. These are dietary base variations (so the whole household can share one
  // pizza night). Lower-UPF: a homemade dough.
  "pizza-base": {
    name: "Pizza Base",
    aliases: ["pizza"],
    anchorSuitableFor: ["vegetarian"],
    options: {
      dietary: [
        {
          slug: "gluten-free-base", name: "Gluten-free Base", suitableFor: ["vegetarian", "gluten_free"],
          reason: "A gluten-free base holds the toppings the same way, so the whole household can share the pizza.",
          note: "Usually thinner and a little crisper.",
        },
        {
          slug: "keto-base", name: "Keto Base", suitableFor: ["vegetarian", "gluten_free", "keto", "lower_carb"],
          reason: "A cauliflower or almond base keeps the pizza role for a keto or lower-carb plate.",
          note: "Softer and not bread-like.",
        },
        {
          slug: "wholemeal-base", name: "Wholemeal Base", suitableFor: ["vegetarian", "vegan"],
          reason: "A wholemeal base fills exactly the same role with a nuttier flavour.",
        },
      ],
      lower_upf: [
        {
          slug: "homemade-base", name: "Homemade Base", suitableFor: ["vegetarian", "vegan"],
          reason: "A simple homemade dough is less processed than a shop-bought base and fills exactly the same role — you control what goes in.",
        },
      ],
    },
  },

  // ── 7. BEEF MINCE ─────────────────────────────────────────────────────────────
  // Editorial-only anchor. The brief's lasagne household example: beef for the
  // family, Quorn mince for Lilly. Dietary: Quorn / soya mince / lentils. Meal-
  // role: turkey or pork mince. Lower-UPF: plain mince vs pre-seasoned mixes.
  "beef-mince": {
    name: "Beef Mince",
    aliases: ["minced-beef", "beef-mince-lasagne"],
    options: {
      dietary: [
        {
          slug: "quorn-mince", name: "Quorn Mince", suitableFor: ["vegetarian"],
          reason: "Mycoprotein mince frequently chosen as a like-for-like in bolognese, chilli and lasagne.",
        },
        {
          slug: "soya-mince", name: "Soya Mince", suitableFor: ["vegetarian", "vegan"],
          reason: "Dried or frozen soya mince fills the same savoury base role in ragùs and chillis.",
        },
        {
          slug: "lentils", name: "Lentils", suitableFor: PLANT_GF,
          reason: "Brown or green lentils give a hearty, savoury base in bolognese and cottage pie.",
        },
      ],
      meal_role: [
        {
          slug: "turkey-mince", name: "Turkey Mince",
          reason: "A lean mince that browns and seasons just like beef in the same dishes.",
        },
        {
          slug: "pork-mince", name: "Pork Mince",
          reason: "Another mince that fills the same savoury base role.",
        },
      ],
      lower_upf: [
        {
          slug: "plain-beef-mince", name: "Plain Beef Mince",
          reason: "Plain mince is less processed than ready-seasoned mince mixes and fills the same role — you season it yourself.",
        },
      ],
    },
  },

  // ── 8. TOMATO SAUCE ───────────────────────────────────────────────────────────
  // Editorial-only anchor (a jar of shop sauce). The brief's lower-UPF example:
  // passata / chopped tomatoes / homemade. Dietary N/A (already plant) → silent.
  "tomato-sauce": {
    name: "Tomato Sauce",
    aliases: ["processed-sauce", "pasta-sauce", "jar-sauce"],
    anchorSuitableFor: PLANT,
    options: {
      lower_upf: [
        {
          slug: "passata", name: "Passata", suitableFor: PLANT_GF,
          reason: "Sieved tomatoes are a minimally processed base that fills the same sauce role — you season it yourself.",
        },
        {
          slug: "chopped-tomatoes", name: "Chopped Tomatoes", suitableFor: PLANT_GF,
          reason: "Tinned chopped tomatoes simmer down into the same sauce with a fresher taste.",
        },
        {
          slug: "homemade-tomato-sauce", name: "Homemade Tomato Sauce", suitableFor: PLANT_GF,
          reason: "A simple sauce from tomatoes, garlic and herbs fills the same role and you control what goes in.",
          note: "Takes a little longer to cook from scratch.",
        },
      ],
    },
  },

  // ── 9. BREAKFAST CEREAL ───────────────────────────────────────────────────────
  // Editorial-only anchor. The brief's lower-UPF example: porridge / bircher /
  // muesli all fill the same breakfast-bowl role with less processing.
  "breakfast-cereal": {
    name: "Breakfast Cereal",
    aliases: ["cereal"],
    anchorSuitableFor: ["vegetarian"],
    options: {
      lower_upf: [
        {
          slug: "porridge-oats", name: "Porridge Oats", suitableFor: ["vegetarian", "vegan", "dairy_free"],
          reason: "Oats cooked into porridge are a minimally processed breakfast that fills the same warm-bowl role.",
        },
        {
          slug: "bircher-muesli", name: "Bircher Oats", suitableFor: ["vegetarian"],
          reason: "Oats soaked overnight with fruit make a less processed breakfast bowl.",
        },
        {
          slug: "muesli", name: "Muesli", suitableFor: ["vegetarian"],
          reason: "A mix of oats, fruit and nuts that fills the cereal-bowl role with less processing than many boxed cereals.",
        },
      ],
    },
  },

  // ── 10. BASIL ─────────────────────────────────────────────────────────────────
  // Canonical anchor. The brief's CUISINE example: parsley / coriander / mint each
  // fill the "fresh green herb finish" role, depending on the cuisine.
  basil: {
    name: "Basil",
    anchorSuitableFor: PLANT_GF,
    options: {
      cuisine: [
        {
          slug: "parsley", name: "Parsley", suitableFor: PLANT_GF, cuisine: "European",
          reason: "Often used as the fresh green herb finish in European and Middle Eastern dishes.",
        },
        {
          slug: "coriander", name: "Coriander", suitableFor: PLANT_GF, cuisine: "Asian & Latin American",
          reason: "Frequently chosen as the fresh herb in Thai, Indian, Vietnamese and Mexican cooking.",
        },
        {
          slug: "mint", name: "Mint", suitableFor: PLANT_GF, cuisine: "Middle Eastern & North African",
          reason: "Used as the bright fresh herb in Middle Eastern and North African dishes.",
        },
      ],
    },
  },
};

/** Build the alias → canonical-anchor-key lookup once. */
let _aliasIndex: Map<string, string> | null = null;

export function resolveAnchorKey(slug: string): string | null {
  if (ALTERNATIVES_SEED[slug]) return slug;
  if (!_aliasIndex) {
    _aliasIndex = new Map();
    for (const [key, seed] of Object.entries(ALTERNATIVES_SEED)) {
      for (const alias of seed.aliases ?? []) _aliasIndex.set(alias, key);
    }
  }
  return _aliasIndex.get(slug) ?? null;
}

/** All anchor keys WS9 can answer for (canonical keys, not aliases). */
export function anchorKeys(): string[] {
  return Object.keys(ALTERNATIVES_SEED);
}
