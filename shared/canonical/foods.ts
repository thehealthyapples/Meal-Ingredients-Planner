// WS2A — Canonical Food Identity: Food / Variety / Alias seed data.
// Extended in WS2F with spinach, lentils, and variety knowledgeFoodSlug links.
//
// Authored in a STRUCTURED form (one entry per canonical food, with its
// varieties and aliases nested) so the editorial intent reads top-to-bottom.
// shared/canonical/index.ts flattens this into the per-table insert arrays.
//
// Proving set (NOT the whole world): Tomatoes, Mushrooms, Herbs, Spices, Apples,
// Citrus, Beans, Seeds, Nuts, Healthy fats, Leafy greens, Lentils — chosen to
// exercise every mechanism:
//   • aliases (singular/plural/common_name/form/misspelling)
//   • varieties (cherry/plum/heirloom tomato; mushroom kinds; apple kinds;
//     red/green/puy/beluga lentil)
//   • diversity groups (one-food-many-varieties AND many-foods-one-group/citrus)
//
// Editorial rules applied (WS1.5):
//   • Tomato = 1 plant; cherry/plum/heirloom = VARIETIES (not aliases, not foods).
//   • Mushroom = 1 plant; button/chestnut/shiitake/oyster = VARIETIES.
//   • Lentils = 1 plant; red/green/puy/beluga = VARIETIES; preparations (dried,
//     split, tinned) = ALIASES (form).
//   • Each herb/spice counts individually; fresh vs dried = ALIASES (form).
//   • Preparations are NEVER canonical foods (WS2F rule).
import type { InsertCanonicalFood } from "../schema";

export type AliasType = "singular" | "plural" | "common_name" | "brand" | "misspelling" | "form";

export interface VarietySeed {
  slug: string;
  name: string;
  description?: string;
  displayOrder?: number;
  // WS2F: optional link to the WS0 knowledge food that covers this variety.
  // Used by the FoodReportKnowledgeAdapter to surface variety-specific nutrients
  // and benefits without creating a new data store.
  knowledgeFoodSlug?: string | null;
}

export interface AliasSeed {
  alias: string;
  aliasType: AliasType;
}

export interface CanonicalFoodSeed {
  food: InsertCanonicalFood;
  varieties?: VarietySeed[];
  aliases?: AliasSeed[];
}

export const CANONICAL_SEED: CanonicalFoodSeed[] = [
  // ════════════════════════ Tomatoes ════════════════════════
  {
    food: {
      slug: "tomato", name: "Tomato", category: "Vegetables", subcategory: "Fruiting vegetables",
      description: "A fruiting vegetable eaten fresh, tinned or cooked; the single plant behind all tomato varieties.",
      knowledgeFoodSlug: "tomatoes", diversityGroupSlug: "tomato",
    },
    varieties: [
      { slug: "cherry-tomato", name: "Cherry Tomato", displayOrder: 0 },
      { slug: "plum-tomato", name: "Plum Tomato", displayOrder: 1 },
      { slug: "heirloom-tomato", name: "Heirloom Tomato", displayOrder: 2 },
    ],
    aliases: [
      { alias: "tomatoes", aliasType: "plural" },
      { alias: "tomatos", aliasType: "misspelling" },
      { alias: "tinned tomatoes", aliasType: "form" },
      { alias: "canned tomatoes", aliasType: "form" },
      { alias: "chopped tomatoes", aliasType: "form" },
      { alias: "passata", aliasType: "form" },
    ],
  },

  // ════════════════════════ Mushrooms ════════════════════════
  {
    food: {
      slug: "mushroom", name: "Mushroom", category: "Mushrooms", subcategory: "Cultivated",
      description: "Edible fungi; the single plant-diversity group behind all mushroom varieties.",
      // No single Knowledge Registry food — WS0 models the kinds separately.
      knowledgeFoodSlug: null, diversityGroupSlug: "mushroom",
    },
    varieties: [
      { slug: "button-mushroom", name: "Button Mushroom", description: "Also sold as white or closed-cup.", displayOrder: 0, knowledgeFoodSlug: "white-mushrooms" },
      { slug: "chestnut-mushroom", name: "Chestnut Mushroom", description: "Also sold as cremini or brown.", displayOrder: 1, knowledgeFoodSlug: "chestnut-mushrooms" },
      { slug: "shiitake-mushroom", name: "Shiitake Mushroom", displayOrder: 2, knowledgeFoodSlug: "shiitake-mushrooms" },
      { slug: "oyster-mushroom", name: "Oyster Mushroom", displayOrder: 3, knowledgeFoodSlug: "oyster-mushrooms" },
    ],
    aliases: [
      { alias: "mushrooms", aliasType: "plural" },
    ],
  },

  // ════════════════════════ Herbs ════════════════════════
  // Each herb counts individually. Fresh / dried are aliases (form).
  {
    food: {
      slug: "basil", name: "Basil", category: "Herbs", subcategory: "Soft herbs",
      description: "A fragrant soft herb; fresh and dried are the same food.",
      knowledgeFoodSlug: "basil", diversityGroupSlug: "basil",
    },
    aliases: [
      { alias: "sweet basil", aliasType: "common_name" },
      { alias: "fresh basil", aliasType: "form" },
      { alias: "dried basil", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "parsley", name: "Parsley", category: "Herbs", subcategory: "Soft herbs",
      description: "A soft herb used fresh or dried.",
      knowledgeFoodSlug: "parsley", diversityGroupSlug: "parsley", family: null,
    },
    varieties: [
      // NK6Q batch 009 — leaf-shape VARIETIES of one herb, promoted from plain aliases.
      { slug: "flat-leaf-parsley", name: "Flat-Leaf Parsley", displayOrder: 0 },
      { slug: "curly-parsley", name: "Curly Parsley", displayOrder: 1 },
    ],
    aliases: [
      { alias: "flat leaf parsley", aliasType: "common_name" },
      { alias: "italian parsley", aliasType: "common_name" },
      { alias: "fresh parsley", aliasType: "form" },
      { alias: "dried parsley", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "coriander", name: "Coriander", category: "Herbs", subcategory: "Soft herbs",
      description: "A soft herb (US: cilantro); leaf and seed forms collapse to one food here.",
      knowledgeFoodSlug: "coriander", diversityGroupSlug: "coriander",
    },
    aliases: [
      { alias: "cilantro", aliasType: "common_name" },
      { alias: "fresh coriander", aliasType: "form" },
      { alias: "dried coriander", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "mint", name: "Mint", category: "Herbs", subcategory: "Soft herbs",
      description: "A cooling soft herb used fresh or dried.",
      knowledgeFoodSlug: "mint", diversityGroupSlug: "mint",
    },
    aliases: [
      { alias: "spearmint", aliasType: "common_name" },
      { alias: "fresh mint", aliasType: "form" },
    ],
  },

  // ════════════════════════ Spices ════════════════════════
  // Each spice counts individually. Ground / fresh forms are aliases (form).
  // No WS0 editorial entry yet → knowledgeFoodSlug null (canonical is a superset).
  {
    food: {
      slug: "cumin", name: "Cumin", category: "Spices", subcategory: "Ground spices",
      description: "An earthy spice from cumin seeds; whole and ground are the same food.",
      knowledgeFoodSlug: "cumin", diversityGroupSlug: "cumin",
    },
    aliases: [
      { alias: "ground cumin", aliasType: "form" },
      { alias: "cumin seeds", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "turmeric", name: "Turmeric", category: "Spices", subcategory: "Ground spices",
      description: "A golden root spice, usually used ground.",
      knowledgeFoodSlug: "turmeric", diversityGroupSlug: "turmeric",
    },
    aliases: [
      { alias: "ground turmeric", aliasType: "form" },
      { alias: "fresh turmeric", aliasType: "form" },
      { alias: "tumeric", aliasType: "misspelling" },
    ],
  },
  {
    food: {
      slug: "cinnamon", name: "Cinnamon", category: "Spices", subcategory: "Ground spices",
      description: "A warm sweet spice from tree bark; stick and ground are the same food.",
      knowledgeFoodSlug: "cinnamon", diversityGroupSlug: "cinnamon",
    },
    aliases: [
      { alias: "ground cinnamon", aliasType: "form" },
      { alias: "cinnamon stick", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "ginger", name: "Ginger", category: "Spices", subcategory: "Root spices",
      description: "A pungent root used fresh or ground.",
      knowledgeFoodSlug: "ginger", diversityGroupSlug: "ginger",
    },
    aliases: [
      { alias: "fresh ginger", aliasType: "form" },
      { alias: "ground ginger", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "paprika", name: "Paprika", category: "Spices", subcategory: "Ground spices",
      description: "Sweet red peppers dried and ground to a mild, fruity spice.",
      knowledgeFoodSlug: "paprika", diversityGroupSlug: "paprika", family: null,
    },
    aliases: [
      // "smoked paprika" REMOVED (NK6Q batch 010) — smoke-drying over oak makes pimentón a
      // distinct spice product in flavour and use, not a format of sweet paprika.
      { alias: "sweet paprika", aliasType: "form" },
      { alias: "ground paprika", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "smoked-paprika", name: "Smoked Paprika", category: "Spices", subcategory: "Ground spices",
      description: "Peppers slowly smoke-dried over oak before grinding, giving a deep smoky flavour; sold sweet, bittersweet or hot.",
      knowledgeFoodSlug: null, diversityGroupSlug: "paprika", family: null,
    },
    aliases: [
      // "pimentón" is omitted: it normalises to the same alias_key as "pimenton",
      // and one key may map to only one alias row (the anti-fork lock).
      { alias: "pimenton", aliasType: "common_name" },
      { alias: "spanish smoked paprika", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Apples ════════════════════════
  {
    food: {
      slug: "apple", name: "Apple", category: "Fruit", subcategory: "Top fruit",
      description: "A top fruit; all apple varieties count as one plant.",
      knowledgeFoodSlug: "apples", diversityGroupSlug: "apple",
    },
    varieties: [
      { slug: "gala-apple", name: "Gala Apple", displayOrder: 0 },
      { slug: "braeburn-apple", name: "Braeburn Apple", displayOrder: 1 },
      { slug: "granny-smith-apple", name: "Granny Smith Apple", displayOrder: 2 },
    ],
    aliases: [
      { alias: "apples", aliasType: "plural" },
    ],
  },

  // ════════════════════════ Citrus (same group, different foods) ════════════════════════
  {
    food: {
      slug: "orange", name: "Orange", category: "Fruit", subcategory: "Citrus",
      description: "A citrus fruit.",
      knowledgeFoodSlug: "oranges", diversityGroupSlug: "citrus",
    },
    aliases: [
      { alias: "oranges", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "clementine", name: "Clementine", category: "Fruit", subcategory: "Citrus",
      description: "A small easy-peel citrus fruit; distinct from orange but shares the citrus plant group.",
      knowledgeFoodSlug: "clementine", diversityGroupSlug: "citrus",
    },
    aliases: [
      { alias: "clementines", aliasType: "plural" },
      { alias: "satsuma", aliasType: "common_name" },
      { alias: "satsumas", aliasType: "common_name" },
      { alias: "mandarin", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Vegetables — Leafy greens ════════════════════════
  // WS2F: Spinach added — exists in WS0 registry, high cross-system presence.
  // WS2F Amendment: baby-spinach and mature-spinach are VARIETIES (not aliases).
  // Variety matters for user recognition, exploration and food report usefulness.
  // Fresh / frozen are forms (preparation aliases), not varieties.
  {
    food: {
      slug: "spinach", name: "Spinach", category: "Vegetables", subcategory: "Leafy greens",
      description: "A leafy green vegetable rich in folate, iron and vitamin K.",
      knowledgeFoodSlug: "spinach", diversityGroupSlug: "spinach",
    },
    varieties: [
      { slug: "baby-spinach", name: "Baby Spinach", displayOrder: 0 },
      { slug: "mature-spinach", name: "Mature Spinach", displayOrder: 1 },
    ],
    aliases: [
      { alias: "fresh spinach", aliasType: "form" },
      { alias: "frozen spinach", aliasType: "form" },
    ],
  },

  // ════════════════════════ Beans / Legumes ════════════════════════
  {
    food: {
      slug: "chickpeas", name: "Chickpeas", category: "Legumes", subcategory: "Beans",
      description: "A versatile legume, the base of hummus.",
      knowledgeFoodSlug: "chickpeas", diversityGroupSlug: "chickpeas",
    },
    aliases: [
      { alias: "garbanzo beans", aliasType: "common_name" },
      { alias: "chana", aliasType: "common_name" },
      { alias: "tinned chickpeas", aliasType: "form" },
      { alias: "canned chickpeas", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "black-beans", name: "Black Beans", category: "Legumes", subcategory: "Beans",
      description: "Dark beans rich in fibre and plant protein.",
      knowledgeFoodSlug: "black-beans", diversityGroupSlug: "black-beans",
    },
    aliases: [
      { alias: "turtle beans", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "kidney-beans", name: "Kidney Beans", category: "Legumes", subcategory: "Beans",
      description: "Hearty beans; always cook thoroughly.",
      knowledgeFoodSlug: "kidney-beans", diversityGroupSlug: "kidney-beans",
    },
    aliases: [
      { alias: "red kidney beans", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "butter-beans", name: "Butter Beans", category: "Legumes", subcategory: "Beans",
      description: "Large, creamy beans.",
      knowledgeFoodSlug: "butter-beans", diversityGroupSlug: "butter-beans",
    },
    aliases: [
      { alias: "lima beans", aliasType: "common_name" },
    ],
  },
  // WS2F: Lentils added as one canonical food with four varieties (WS2E
  // recommended decision: generic lentil = 1 food + red/green/puy/beluga
  // varieties). knowledgeFoodSlug is null to avoid conflating the generic
  // "lentils" with red-lentils nutritionally; each variety wires to WS0.
  // Preparations (dried/split/tinned) are form ALIASES, never foods.
  {
    food: {
      slug: "lentils", name: "Lentils", category: "Legumes", subcategory: "Lentils",
      description: "A versatile legume available in several varieties; a good source of plant protein and fibre.",
      knowledgeFoodSlug: null, diversityGroupSlug: "lentils",
    },
    varieties: [
      { slug: "red-lentil", name: "Red Lentils", displayOrder: 0, knowledgeFoodSlug: "red-lentils" },
      { slug: "green-lentil", name: "Green Lentils", displayOrder: 1, knowledgeFoodSlug: "green-lentils" },
      { slug: "puy-lentil", name: "Puy Lentils", displayOrder: 2, knowledgeFoodSlug: "puy-lentils" },
      { slug: "beluga-lentil", name: "Beluga Lentils", displayOrder: 3, knowledgeFoodSlug: "beluga-lentils" },
    ],
    aliases: [
      { alias: "dried lentils", aliasType: "form" },
      { alias: "split lentils", aliasType: "form" },
      { alias: "tinned lentils", aliasType: "form" },
      { alias: "cooked lentils", aliasType: "form" },
    ],
  },

  // ════════════════════════ Seeds ════════════════════════
  {
    food: {
      slug: "pumpkin-seeds", name: "Pumpkin Seeds", category: "Seeds", subcategory: "Whole seeds",
      description: "Green seeds rich in magnesium and zinc.",
      knowledgeFoodSlug: "pumpkin-seeds", diversityGroupSlug: "pumpkin-seeds",
    },
    aliases: [
      { alias: "pumpkin seed", aliasType: "singular" },
      { alias: "pepitas", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "sunflower-seeds", name: "Sunflower Seeds", category: "Seeds", subcategory: "Whole seeds",
      description: "Small seeds supplying vitamin E.",
      knowledgeFoodSlug: "sunflower-seeds", diversityGroupSlug: "sunflower-seeds",
    },
    aliases: [
      { alias: "sunflower seed", aliasType: "singular" },
      { alias: "sunflower kernels", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "chia-seeds", name: "Chia Seeds", category: "Seeds", subcategory: "Whole seeds",
      description: "Tiny seeds high in fibre and plant omega-3.",
      knowledgeFoodSlug: "chia-seeds", diversityGroupSlug: "chia-seeds",
    },
    aliases: [
      { alias: "chia seed", aliasType: "singular" },
      { alias: "chia", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "flaxseed", name: "Flaxseed", category: "Seeds", subcategory: "Whole seeds",
      description: "Seeds rich in fibre and plant omega-3; best ground.",
      knowledgeFoodSlug: "flaxseed", diversityGroupSlug: "flaxseed",
    },
    aliases: [
      { alias: "linseed", aliasType: "common_name" },
      { alias: "flax seeds", aliasType: "common_name" },
      { alias: "flaxseeds", aliasType: "plural" },
      { alias: "ground flaxseed", aliasType: "form" },
      { alias: "ground linseed", aliasType: "form" },
    ],
  },

  // ════════════════════════ Nuts ════════════════════════
  {
    food: {
      slug: "walnuts", name: "Walnuts", category: "Nuts", subcategory: "Tree nuts",
      description: "A tree nut and plant source of omega-3.",
      knowledgeFoodSlug: "walnuts", diversityGroupSlug: "walnuts",
    },
    aliases: [
      { alias: "walnut", aliasType: "singular" },
      { alias: "walnut halves", aliasType: "form" },
      { alias: "walnut pieces", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "almonds", name: "Almonds", category: "Nuts", subcategory: "Tree nuts",
      description: "A versatile nut supplying vitamin E and magnesium.",
      knowledgeFoodSlug: "almonds", diversityGroupSlug: "almonds",
    },
    aliases: [
      { alias: "almond", aliasType: "singular" },
      { alias: "flaked almonds", aliasType: "form" },
    ],
  },

  // ════════════════════════ Healthy fats ════════════════════════

  // ── Olive oil (NK6R Amendment 1) ────────────────────────────────────────────
  // NK6Q §2.5 recorded a scope INVERSION: the generic `olive-oil` resolved into
  // the NARROWER `extra-virgin-olive-oil`, because EVOO greedily aliased "olive
  // oil". The grades genuinely disagree on facts (polyphenol content, smoke
  // point, extraction method), so under the GOV2 scope test each is its own
  // identity — and "Olive Oil" is their parent, not their synonym.
  {
    food: {
      slug: "olive-oil", name: "Olive Oil", category: "Healthy fats", subcategory: "Oils",
      description: "Oil pressed from olives. The parent identity for the olive-oil grades — extra virgin, virgin, refined and pomace — which differ in extraction, polyphenol content and smoke point.",
      // Editorial content for this identity arrives with the deferred import of
      // batch-012/olive-oil.yaml (NK6R §7). Honest gap until then.
      knowledgeFoodSlug: null, diversityGroupSlug: "olive-oil", family: null,
    },
    aliases: [
      { alias: "olive oils", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "extra-virgin-olive-oil", name: "Extra Virgin Olive Oil", category: "Healthy fats", subcategory: "Oils",
      description: "The highest grade of olive oil: mechanically cold-pressed, unrefined, and richest in polyphenols.",
      knowledgeFoodSlug: "extra-virgin-olive-oil", diversityGroupSlug: "olive-oil", family: "olive-oil",
    },
    aliases: [
      // "olive oil" and "virgin olive oil" REMOVED — they name the parent and a
      // sibling grade respectively. Aliasing them here collapsed three identities
      // into one (GOV2 fail test 5).
      { alias: "evoo", aliasType: "common_name" },
      { alias: "cold pressed olive oil", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "virgin-olive-oil", name: "Virgin Olive Oil", category: "Healthy fats", subcategory: "Oils",
      description: "An unrefined olive oil pressed mechanically like extra virgin, but held to a less strict grade on acidity and flavour.",
      knowledgeFoodSlug: null, diversityGroupSlug: "olive-oil", family: "olive-oil",
    },
  },
  {
    food: {
      slug: "refined-olive-oil", name: "Refined Olive Oil", category: "Healthy fats", subcategory: "Oils",
      description: "Olive oil refined with heat or solvents, giving a neutral flavour and a higher smoke point but far fewer polyphenols than virgin grades.",
      knowledgeFoodSlug: null, diversityGroupSlug: "olive-oil", family: "olive-oil",
    },
    aliases: [
      { alias: "light olive oil", aliasType: "common_name" },
      { alias: "pure olive oil", aliasType: "common_name" },
      { alias: "mild olive oil", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "olive-pomace-oil", name: "Olive Pomace Oil", category: "Healthy fats", subcategory: "Oils",
      description: "Oil solvent-extracted from the pomace left after pressing, then refined; the lowest olive-oil grade.",
      knowledgeFoodSlug: null, diversityGroupSlug: "olive-oil", family: "olive-oil",
    },
    aliases: [
      { alias: "pomace oil", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "avocado", name: "Avocado", category: "Healthy fats", subcategory: "Fruit fats",
      description: "A creamy fruit rich in unsaturated fats, fibre and potassium.",
      knowledgeFoodSlug: "avocado", diversityGroupSlug: "avocado",
    },
    aliases: [
      { alias: "avocados", aliasType: "plural" },
    ],
  },

  // ════════════════════════ Mediterranean Vegetables (WS0.6) ════════════════════════

  // ── Leafy greens ─────────────────────────────────────────────────────────────
  {
    food: {
      slug: "kale", name: "Kale", category: "Vegetables", subcategory: "Leafy greens",
      description: "A hardy leafy green; curly kale and cavolo nero are cultivars of the same plant.",
      knowledgeFoodSlug: "kale", diversityGroupSlug: "kale",
    },
    varieties: [
      { slug: "curly-kale", name: "Curly Kale", displayOrder: 0 },
      { slug: "cavolo-nero", name: "Cavolo Nero", description: "Also known as Tuscan kale or black kale.", displayOrder: 1 },
    ],
    aliases: [
      { alias: "black kale", aliasType: "common_name" },
      { alias: "Tuscan kale", aliasType: "common_name" },
      { alias: "kale leaves", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "watercress", name: "Watercress", category: "Vegetables", subcategory: "Leafy greens",
      description: "A peppery aquatic leafy green rich in vitamin K, vitamin C and beta-carotene.",
      knowledgeFoodSlug: "watercress", diversityGroupSlug: "watercress",
    },
    aliases: [
      { alias: "water cress", aliasType: "misspelling" },
    ],
  },
  {
    food: {
      slug: "rocket", name: "Rocket", category: "Vegetables", subcategory: "Leafy greens",
      description: "A peppery salad leaf; known as arugula in the US and roquette in France.",
      knowledgeFoodSlug: "rocket", diversityGroupSlug: "rocket",
    },
    aliases: [
      { alias: "arugula", aliasType: "common_name" },
      { alias: "roquette", aliasType: "common_name" },
      { alias: "rocket leaves", aliasType: "form" },
    ],
  },

  // ── Root vegetables ───────────────────────────────────────────────────────────
  {
    food: {
      slug: "beetroot", name: "Beetroot", category: "Vegetables", subcategory: "Root vegetables",
      description: "A deep-red root rich in dietary nitrates and anthocyanins; eaten raw, cooked or juiced.",
      knowledgeFoodSlug: "beetroot", diversityGroupSlug: "beetroot",
    },
    aliases: [
      { alias: "beet", aliasType: "common_name" },
      { alias: "beets", aliasType: "common_name" },
      { alias: "raw beetroot", aliasType: "form" },
      { alias: "cooked beetroot", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "carrots", name: "Carrots", category: "Vegetables", subcategory: "Root vegetables",
      description: "A crunchy root vegetable and one of the richest plant sources of beta-carotene.",
      knowledgeFoodSlug: "carrots", diversityGroupSlug: "carrots",
    },
    aliases: [
      { alias: "carrot", aliasType: "singular" },
      { alias: "baby carrots", aliasType: "form" },
      { alias: "grated carrot", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "parsnip", name: "Parsnip", category: "Vegetables", subcategory: "Root vegetables",
      description: "A sweet, cream-coloured root vegetable rich in fibre and folate; popular roasted or in soups.",
      knowledgeFoodSlug: "parsnip", diversityGroupSlug: "parsnip",
    },
    aliases: [
      { alias: "parsnips", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "turnip", name: "Turnip", category: "Vegetables", subcategory: "Root vegetables",
      description: "A mild brassica root with white flesh and purple-tinged skin, supplying vitamin C and fibre.",
      knowledgeFoodSlug: "turnip", diversityGroupSlug: "turnip",
    },
    aliases: [
      { alias: "turnips", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "swede", name: "Swede", category: "Vegetables", subcategory: "Root vegetables",
      description: "A mild, slightly sweet brassica root; known as rutabaga in North America.",
      knowledgeFoodSlug: "swede", diversityGroupSlug: "swede",
    },
    aliases: [
      { alias: "swedes", aliasType: "plural" },
      { alias: "rutabaga", aliasType: "common_name" },
    ],
  },

  // ── Brassicas ─────────────────────────────────────────────────────────────────
  {
    food: {
      slug: "broccoli", name: "Broccoli", category: "Vegetables", subcategory: "Brassicas",
      description: "A green brassica rich in vitamin C, sulforaphane and folate; calabrese and sprouting are the same plant.",
      knowledgeFoodSlug: "broccoli", diversityGroupSlug: "broccoli",
    },
    varieties: [
      { slug: "calabrese-broccoli", name: "Calabrese Broccoli", description: "The standard large-headed variety found in most supermarkets.", displayOrder: 0 },
      { slug: "purple-sprouting-broccoli", name: "Purple Sprouting Broccoli", displayOrder: 1, knowledgeFoodSlug: "purple-sprouting-broccoli" },
    ],
    aliases: [
      { alias: "calabrese", aliasType: "common_name" },
      { alias: "tender stem broccoli", aliasType: "form" },
      { alias: "tenderstem", aliasType: "form" },
      { alias: "frozen broccoli", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "red-cabbage", name: "Red Cabbage", category: "Vegetables", subcategory: "Brassicas",
      description: "A vivid purple brassica packed with anthocyanins and fibre; excellent raw, pickled or braised.",
      knowledgeFoodSlug: "red-cabbage", diversityGroupSlug: "red-cabbage",
    },
    aliases: [
      { alias: "purple cabbage", aliasType: "common_name" },
      { alias: "pickled red cabbage", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "pak-choi", name: "Pak Choi", category: "Vegetables", subcategory: "Brassicas",
      description: "A mild Chinese brassica with crisp white stems and dark leafy tops; used in stir-fries and soups.",
      knowledgeFoodSlug: "pak-choi", diversityGroupSlug: "pak-choi",
    },
    aliases: [
      { alias: "bok choy", aliasType: "common_name" },
      { alias: "bok choi", aliasType: "common_name" },
      { alias: "pak choy", aliasType: "misspelling" },
      { alias: "baby pak choi", aliasType: "form" },
    ],
  },

  // ── Alliums ───────────────────────────────────────────────────────────────────
  {
    food: {
      slug: "garlic", name: "Garlic", category: "Vegetables", subcategory: "Alliums",
      description: "An aromatic allium bulb that releases allicin when crushed; fresh and dried forms are the same food.",
      knowledgeFoodSlug: "garlic", diversityGroupSlug: "garlic",
    },
    aliases: [
      { alias: "garlic clove", aliasType: "form" },
      { alias: "garlic cloves", aliasType: "form" },
      { alias: "garlic bulb", aliasType: "form" },
      { alias: "crushed garlic", aliasType: "form" },
      { alias: "garlic powder", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "onion", name: "Onion", category: "Vegetables", subcategory: "Alliums",
      description: "A kitchen staple allium; red, brown and white onions are cultivars of the same plant.",
      knowledgeFoodSlug: "onion", diversityGroupSlug: "onion",
    },
    aliases: [
      { alias: "onions", aliasType: "plural" },
      { alias: "red onion", aliasType: "common_name" },
      { alias: "brown onion", aliasType: "common_name" },
      { alias: "white onion", aliasType: "common_name" },
      { alias: "yellow onion", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "spring-onion", name: "Spring Onion", category: "Vegetables", subcategory: "Alliums",
      description: "A slender mild allium eaten whole; a distinct species from the common onion.",
      knowledgeFoodSlug: "spring-onion", diversityGroupSlug: "spring-onion",
    },
    aliases: [
      { alias: "spring onions", aliasType: "plural" },
      { alias: "scallion", aliasType: "common_name" },
      { alias: "scallions", aliasType: "common_name" },
      { alias: "green onion", aliasType: "common_name" },
      { alias: "salad onion", aliasType: "common_name" },
    ],
  },

  // ── Fruiting vegetables ───────────────────────────────────────────────────────
  {
    food: {
      slug: "aubergine", name: "Aubergine", category: "Vegetables", subcategory: "Fruiting vegetables",
      description: "A deep-purple nightshade fruit used as a vegetable; known as eggplant in the US and brinjal in South Asia.",
      knowledgeFoodSlug: "aubergine", diversityGroupSlug: "aubergine",
    },
    aliases: [
      { alias: "aubergines", aliasType: "plural" },
      { alias: "eggplant", aliasType: "common_name" },
      { alias: "brinjal", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "courgette", name: "Courgette", category: "Vegetables", subcategory: "Fruiting vegetables",
      description: "A tender summer squash; known as zucchini in the US, Italy and Australia.",
      knowledgeFoodSlug: "courgette", diversityGroupSlug: "courgette",
    },
    aliases: [
      { alias: "courgettes", aliasType: "plural" },
      { alias: "zucchini", aliasType: "common_name" },
    ],
  },
  {
    // knowledgeFoodSlug is null: the canonical "pepper" covers all colours;
    // "red-pepper" knowledge food covers red only. Variety wires red to that entry.
    food: {
      slug: "pepper", name: "Pepper", category: "Vegetables", subcategory: "Fruiting vegetables",
      description: "A sweet bell pepper; all colours (red, green, yellow, orange) count as one plant for diversity.",
      knowledgeFoodSlug: null, diversityGroupSlug: "pepper",
    },
    varieties: [
      { slug: "red-pepper", name: "Red Pepper", displayOrder: 0, knowledgeFoodSlug: "red-pepper" },
      { slug: "green-pepper", name: "Green Pepper", displayOrder: 1 },
      { slug: "yellow-pepper", name: "Yellow Pepper", displayOrder: 2 },
      { slug: "orange-pepper", name: "Orange Pepper", displayOrder: 3 },
    ],
    aliases: [
      { alias: "peppers", aliasType: "plural" },
      { alias: "bell pepper", aliasType: "common_name" },
      { alias: "bell peppers", aliasType: "common_name" },
      { alias: "capsicum", aliasType: "common_name" },
      { alias: "sweet pepper", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "cucumber", name: "Cucumber", category: "Vegetables", subcategory: "Fruiting vegetables",
      description: "A refreshing, high-water-content vegetable with a cool, mild flavour; eaten raw or pickled.",
      knowledgeFoodSlug: "cucumber", diversityGroupSlug: "cucumber",
    },
    aliases: [
      { alias: "cucumbers", aliasType: "plural" },
    ],
  },

  // ── Bulb and stem vegetables ──────────────────────────────────────────────────
  {
    food: {
      slug: "fennel", name: "Fennel", category: "Vegetables", subcategory: "Bulb vegetables",
      description: "An aromatic bulb vegetable with an aniseed flavour, eaten raw or roasted. The seed is a separate spice food.",
      knowledgeFoodSlug: "fennel", diversityGroupSlug: "fennel", family: null,
    },
    aliases: [
      // "fennel seed(s)" REMOVED (NK6Q §2.5). This identity is the bulb VEGETABLE; the
      // seed is a different plant part with a different use and profile — exactly as
      // `coriander-seeds` is separate from the herb `coriander`.
      { alias: "fennel bulb", aliasType: "form" },
      { alias: "florence fennel", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "fennel-seeds", name: "Fennel Seeds", category: "Spices", subcategory: "Seeds and pods",
      description: "The dried seed of the fennel plant, used whole or ground as a warm, aniseed-flavoured spice.",
      knowledgeFoodSlug: null, diversityGroupSlug: "fennel", family: null,
    },
    aliases: [
      { alias: "fennel seed", aliasType: "singular" },
      { alias: "ground fennel", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "celery", name: "Celery", category: "Vegetables", subcategory: "Stem vegetables",
      description: "A crunchy stem vegetable with a mild savoury flavour, rich in vitamin K and commonly used as a cooking base.",
      knowledgeFoodSlug: "celery", diversityGroupSlug: "celery",
    },
    aliases: [
      { alias: "celery sticks", aliasType: "form" },
      { alias: "celery stalks", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "asparagus", name: "Asparagus", category: "Vegetables", subcategory: "Stem vegetables",
      description: "A seasonal spring vegetable rich in folate and vitamin K, with a distinctive savoury flavour.",
      knowledgeFoodSlug: "asparagus", diversityGroupSlug: "asparagus",
    },
    aliases: [
      { alias: "asparagus spears", aliasType: "form" },
      { alias: "green asparagus", aliasType: "form" },
    ],
  },

  // ── Speciality vegetables ─────────────────────────────────────────────────────
  {
    food: {
      slug: "artichoke", name: "Artichoke", category: "Vegetables", subcategory: "Speciality vegetables",
      description: "A thistle vegetable prized for its heart; the globe artichoke is a Mediterranean staple with outstanding fibre content.",
      knowledgeFoodSlug: "artichoke", diversityGroupSlug: "artichoke",
    },
    aliases: [
      { alias: "globe artichoke", aliasType: "common_name" },
      { alias: "artichoke heart", aliasType: "form" },
      { alias: "artichoke hearts", aliasType: "form" },
      { alias: "tinned artichokes", aliasType: "form" },
    ],
  },
  {
    // Broad beans are botanically legumes but culinarily treated as vegetables
    // when fresh or frozen; categorised here under Vegetables.
    food: {
      slug: "broad-beans", name: "Broad Beans", category: "Vegetables", subcategory: "Pods and beans",
      description: "A hearty legume eaten as a vegetable; a good source of plant protein and folate, and a Mediterranean staple.",
      knowledgeFoodSlug: "broad-beans", diversityGroupSlug: "broad-beans",
    },
    aliases: [
      { alias: "broad bean", aliasType: "singular" },
      { alias: "fava beans", aliasType: "common_name" },
      { alias: "fava bean", aliasType: "common_name" },
      { alias: "frozen broad beans", aliasType: "form" },
    ],
  },

  // ── Chicory family ────────────────────────────────────────────────────────────
  {
    food: {
      slug: "radicchio", name: "Radicchio", category: "Vegetables", subcategory: "Chicory",
      description: "A vivid red chicory variety from Italy with a distinctive bitter flavour and high anthocyanin content.",
      knowledgeFoodSlug: "radicchio", diversityGroupSlug: "radicchio",
    },
    aliases: [
      { alias: "red chicory", aliasType: "common_name" },
      { alias: "Italian chicory", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "chicory", name: "Chicory", category: "Vegetables", subcategory: "Chicory",
      description: "A pale, tightly furled endive with a mild bitter flavour; includes Belgian and witloof varieties.",
      knowledgeFoodSlug: "chicory", diversityGroupSlug: "chicory",
    },
    aliases: [
      { alias: "Belgian endive", aliasType: "common_name" },
      { alias: "witloof", aliasType: "common_name" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // WS0.8 — Launch Food Coverage Expansion
  // ══════════════════════════════════════════════════════════════════════════════

  // ════════════════════════ Wave 1: Pantry Essentials ════════════════════════

  {
    food: {
      slug: "potato", name: "Potato", category: "Vegetables", subcategory: "Root vegetables",
      description: "A starchy root vegetable and UK kitchen staple; all varieties count as one plant.",
      knowledgeFoodSlug: "potato", diversityGroupSlug: "potato",
    },
    varieties: [
      { slug: "maris-piper-potato", name: "Maris Piper", displayOrder: 0 },
      { slug: "king-edward-potato", name: "King Edward", displayOrder: 1 },
      { slug: "jersey-royal-potato", name: "Jersey Royal", displayOrder: 2 },
      { slug: "charlotte-potato", name: "Charlotte", displayOrder: 3 },
    ],
    aliases: [
      { alias: "potatoes", aliasType: "plural" },
      { alias: "spud", aliasType: "common_name" },
      { alias: "spuds", aliasType: "common_name" },
      { alias: "new potato", aliasType: "form" },
      { alias: "new potatoes", aliasType: "form" },
      { alias: "baked potato", aliasType: "form" },
      { alias: "jacket potato", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "sweet-potato", name: "Sweet Potato", category: "Vegetables", subcategory: "Root vegetables",
      description: "A naturally sweet orange-fleshed root rich in beta-carotene and fibre.",
      knowledgeFoodSlug: "sweet-potato", diversityGroupSlug: "sweet-potato",
    },
    aliases: [
      { alias: "sweet potatoes", aliasType: "plural" },
      { alias: "yam", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "leek", name: "Leek", category: "Vegetables", subcategory: "Alliums",
      description: "A mild, sweet allium rich in folate, vitamin K and prebiotic fibre.",
      knowledgeFoodSlug: "leek", diversityGroupSlug: "leek",
    },
    aliases: [
      { alias: "leeks", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "shallot", name: "Shallot", category: "Vegetables", subcategory: "Alliums",
      description: "A small, sweet allium with a milder flavour than onion; banana shallots are the most widely sold variety.",
      knowledgeFoodSlug: "shallot", diversityGroupSlug: "shallot",
    },
    aliases: [
      { alias: "shallots", aliasType: "plural" },
      { alias: "banana shallot", aliasType: "common_name" },
      { alias: "echalion", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "cauliflower", name: "Cauliflower", category: "Vegetables", subcategory: "Brassicas",
      description: "A white brassica rich in vitamin C; purple and Romanesco varieties are the same plant.",
      knowledgeFoodSlug: "cauliflower", diversityGroupSlug: "cauliflower",
    },
    varieties: [
      { slug: "white-cauliflower", name: "White Cauliflower", displayOrder: 0 },
      { slug: "purple-cauliflower", name: "Purple Cauliflower", displayOrder: 1 },
      { slug: "romanesco-cauliflower", name: "Romanesco", displayOrder: 2 },
    ],
    aliases: [
      { alias: "cauliflowers", aliasType: "plural" },
      { alias: "cauli", aliasType: "common_name" },
      { alias: "cauliflower rice", aliasType: "form" },
      { alias: "cauliflower florets", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cabbage", name: "Cabbage", category: "Vegetables", subcategory: "Brassicas",
      description: "A brassica family staple; white, green, savoy and hispi are cultivars of the same plant.",
      knowledgeFoodSlug: "cabbage", diversityGroupSlug: "cabbage",
    },
    varieties: [
      { slug: "savoy-cabbage", name: "Savoy Cabbage", displayOrder: 0, knowledgeFoodSlug: "savoy-cabbage" },
      { slug: "hispi-cabbage", name: "Hispi Cabbage", description: "Also called pointed or sweetheart cabbage.", displayOrder: 1 },
      { slug: "white-cabbage", name: "White Cabbage", description: "A firm, pale-green round cabbage widely used raw in coleslaw or cooked in soups and stews.", displayOrder: 2, knowledgeFoodSlug: "white-cabbage" },
    ],
    aliases: [
      { alias: "white cabbage", aliasType: "common_name" },
      { alias: "green cabbage", aliasType: "common_name" },
      { alias: "Dutch cabbage", aliasType: "common_name" },
      { alias: "hard cabbage", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "butternut-squash", name: "Butternut Squash", category: "Vegetables", subcategory: "Squash",
      description: "A sweet winter squash with orange flesh rich in beta-carotene and vitamin C.",
      knowledgeFoodSlug: "butternut-squash", diversityGroupSlug: "butternut-squash",
    },
    aliases: [
      { alias: "butternut", aliasType: "common_name" },
      { alias: "butternut squashes", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "pumpkin", name: "Pumpkin", category: "Vegetables", subcategory: "Squash",
      description: "A large round squash with vibrant orange flesh high in beta-carotene.",
      knowledgeFoodSlug: "pumpkin", diversityGroupSlug: "pumpkin",
    },
    aliases: [
      { alias: "pumpkins", aliasType: "plural" },
      { alias: "tinned pumpkin", aliasType: "form" },
      { alias: "pumpkin puree", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "peas", name: "Peas", category: "Vegetables", subcategory: "Pods and beans",
      description: "Small sweet legumes eaten as a vegetable; garden peas, sugar snaps and mangetout are the same plant.",
      knowledgeFoodSlug: "garden-peas", diversityGroupSlug: "peas",
    },
    varieties: [
      { slug: "sugar-snap-peas", name: "Sugar Snap Peas", displayOrder: 0, knowledgeFoodSlug: "sugar-snap-peas" },
      { slug: "mangetout", name: "Mangetout", displayOrder: 1, knowledgeFoodSlug: "mangetout" },
    ],
    aliases: [
      { alias: "garden peas", aliasType: "common_name" },
      { alias: "frozen peas", aliasType: "form" },
      { alias: "fresh peas", aliasType: "form" },
      { alias: "petits pois", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "edamame", name: "Edamame", category: "Vegetables", subcategory: "Pods and beans",
      description: "Young green soya beans eaten in the pod or shelled, offering complete plant protein and folate.",
      knowledgeFoodSlug: "edamame", diversityGroupSlug: "edamame",
    },
    aliases: [
      { alias: "soya beans", aliasType: "common_name" },
      { alias: "frozen edamame", aliasType: "form" },
      { alias: "edamame beans", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "brussels-sprouts", name: "Brussels Sprouts", category: "Vegetables", subcategory: "Brassicas",
      description: "Small brassica buds rich in vitamin C, vitamin K and sulforaphane.",
      knowledgeFoodSlug: "brussels-sprouts", diversityGroupSlug: "brussels-sprouts",
    },
    aliases: [
      { alias: "sprouts", aliasType: "common_name" },
      { alias: "brussels sprout", aliasType: "singular" },
    ],
  },
  {
    food: {
      slug: "celeriac", name: "Celeriac", category: "Vegetables", subcategory: "Root vegetables",
      description: "A knobbly root vegetable with a mild celery flavour, supplying vitamin C and fibre.",
      knowledgeFoodSlug: "celeriac", diversityGroupSlug: "celeriac",
    },
    aliases: [
      { alias: "celery root", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "green-beans", name: "Green Beans", category: "Vegetables", subcategory: "Pods and beans",
      description: "Slender pod vegetables eaten whole; French beans, fine beans and haricot verts are the same plant.",
      knowledgeFoodSlug: "green-beans", diversityGroupSlug: "green-beans",
    },
    aliases: [
      { alias: "French beans", aliasType: "common_name" },
      { alias: "fine beans", aliasType: "common_name" },
      { alias: "haricot verts", aliasType: "common_name" },
      { alias: "string beans", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "radish", name: "Radish", category: "Vegetables", subcategory: "Root vegetables",
      description: "A crisp, peppery brassica root eaten raw in salads or pickled; a quick-growing seasonal vegetable.",
      knowledgeFoodSlug: "radish", diversityGroupSlug: "radish",
    },
    aliases: [
      { alias: "radishes", aliasType: "plural" },
      { alias: "breakfast radish", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "kohlrabi", name: "Kohlrabi", category: "Vegetables", subcategory: "Brassicas",
      description: "A crunchy brassica bulb with a mild, slightly sweet flavour; green and purple varieties are the same plant.",
      knowledgeFoodSlug: "kohlrabi", diversityGroupSlug: "kohlrabi",
    },
    aliases: [
      { alias: "german turnip", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "corn", name: "Sweetcorn", category: "Vegetables", subcategory: "Grain vegetables",
      description: "A sweet grain vegetable rich in fibre and folate, available fresh, frozen or tinned.",
      knowledgeFoodSlug: "corn", diversityGroupSlug: "corn",
    },
    aliases: [
      { alias: "sweetcorn", aliasType: "common_name" },
      { alias: "maize", aliasType: "common_name" },
      { alias: "corn on the cob", aliasType: "form" },
      { alias: "sweet corn", aliasType: "common_name" },
      { alias: "tinned sweetcorn", aliasType: "form" },
      { alias: "frozen sweetcorn", aliasType: "form" },
    ],
  },

  // ════════════════════════ Wave 2: Mediterranean Vegetables ══════════════════

  {
    food: {
      slug: "lettuce", name: "Lettuce", category: "Vegetables", subcategory: "Leafy greens",
      description: "Leafy salad greens; romaine, little gem, iceberg and butterhead are all the same plant.",
      knowledgeFoodSlug: "lettuce", diversityGroupSlug: "lettuce",
    },
    varieties: [
      { slug: "romaine-lettuce", name: "Romaine Lettuce", displayOrder: 0 },
      { slug: "little-gem-lettuce", name: "Little Gem", displayOrder: 1 },
      { slug: "iceberg-lettuce", name: "Iceberg Lettuce", displayOrder: 2 },
      { slug: "butterhead-lettuce", name: "Butterhead Lettuce", displayOrder: 3 },
    ],
    aliases: [
      { alias: "salad leaves", aliasType: "common_name" },
      { alias: "cos lettuce", aliasType: "common_name" },
      { alias: "mixed salad", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "olives", name: "Olives", category: "Vegetables", subcategory: "Fruiting vegetables",
      description: "A Mediterranean fruit drupe rich in unsaturated fats and polyphenols; black and green are the same fruit at different ripeness.",
      knowledgeFoodSlug: "olives", diversityGroupSlug: "olives",
    },
    aliases: [
      { alias: "black olives", aliasType: "common_name" },
      { alias: "green olives", aliasType: "common_name" },
      { alias: "kalamata olives", aliasType: "common_name" },
      { alias: "pitted olives", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "chard", name: "Chard", category: "Vegetables", subcategory: "Leafy greens",
      description: "A leafy green with colourful stems, rich in vitamin K, magnesium and beta-carotene; Swiss chard and rainbow chard are the same plant.",
      knowledgeFoodSlug: "chard", diversityGroupSlug: "chard",
    },
    aliases: [
      { alias: "Swiss chard", aliasType: "common_name" },
      { alias: "rainbow chard", aliasType: "common_name" },
      { alias: "silverbeet", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "jerusalem-artichoke", name: "Jerusalem Artichoke", category: "Vegetables", subcategory: "Root vegetables",
      description: "A knobby tuber from the sunflower family, exceptionally high in inulin fibre.",
      knowledgeFoodSlug: "jerusalem-artichoke", diversityGroupSlug: "jerusalem-artichoke",
    },
    aliases: [
      { alias: "sunchoke", aliasType: "common_name" },
      { alias: "earth apple", aliasType: "common_name" },
      { alias: "Jerusalem artichokes", aliasType: "plural" },
    ],
  },

  // ════════════════════════ Wave 3: Beans, Pulses and Legumes ════════════════

  {
    food: {
      slug: "cannellini-beans", name: "Cannellini Beans", category: "Legumes", subcategory: "Beans",
      description: "Large, creamy white beans rich in fibre and plant protein; widely used in Italian cooking.",
      knowledgeFoodSlug: "cannellini-beans", diversityGroupSlug: "cannellini-beans",
    },
    aliases: [
      { alias: "cannellini bean", aliasType: "singular" },
      { alias: "white kidney beans", aliasType: "common_name" },
      { alias: "white beans", aliasType: "common_name" },
      { alias: "tinned cannellini", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "borlotti-beans", name: "Borlotti Beans", category: "Legumes", subcategory: "Beans",
      description: "Speckled Italian beans with a creamy, nutty flavour, rich in fibre and plant protein.",
      knowledgeFoodSlug: "borlotti-beans", diversityGroupSlug: "borlotti-beans",
    },
    aliases: [
      { alias: "borlotti bean", aliasType: "singular" },
      { alias: "romano beans", aliasType: "common_name" },
      { alias: "cranberry beans", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "haricot-beans", name: "Haricot Beans", category: "Legumes", subcategory: "Beans",
      description: "Small, oval white beans high in fibre and plant protein; the classic bean used in baked beans.",
      knowledgeFoodSlug: "haricot-beans", diversityGroupSlug: "haricot-beans",
    },
    aliases: [
      { alias: "haricot bean", aliasType: "singular" },
      { alias: "navy beans", aliasType: "common_name" },
      { alias: "baked beans", aliasType: "form" },
    ],
  },

  // ════════════════════════ Wave 4: Fruit ════════════════════════

  {
    food: {
      slug: "banana", name: "Banana", category: "Fruit", subcategory: "Tropical fruit",
      description: "A portable, naturally sweet fruit supplying potassium, vitamin B6 and fibre.",
      knowledgeFoodSlug: "bananas", diversityGroupSlug: "banana",
    },
    aliases: [
      { alias: "bananas", aliasType: "plural" },
      { alias: "ripe banana", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "strawberry", name: "Strawberry", category: "Fruit", subcategory: "Berries",
      description: "A sweet red berry rich in vitamin C, flavonoids and fibre.",
      knowledgeFoodSlug: "strawberries", diversityGroupSlug: "strawberry",
    },
    aliases: [
      { alias: "strawberries", aliasType: "plural" },
      { alias: "frozen strawberries", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "blueberry", name: "Blueberry", category: "Fruit", subcategory: "Berries",
      description: "Small blue berries rich in anthocyanins, polyphenols and vitamin C.",
      knowledgeFoodSlug: "blueberries", diversityGroupSlug: "blueberry",
    },
    aliases: [
      { alias: "blueberries", aliasType: "plural" },
      { alias: "frozen blueberries", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "raspberry", name: "Raspberry", category: "Fruit", subcategory: "Berries",
      description: "Soft red berries exceptionally high in fibre, vitamin C and flavonoids.",
      knowledgeFoodSlug: "raspberry", diversityGroupSlug: "raspberry",
    },
    aliases: [
      { alias: "raspberries", aliasType: "plural" },
      { alias: "frozen raspberries", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "kiwi", name: "Kiwi", category: "Fruit", subcategory: "Exotic fruit",
      description: "A tangy green fruit exceptionally rich in vitamin C and fibre; golden kiwi is a variety of the same plant.",
      knowledgeFoodSlug: "kiwi", diversityGroupSlug: "kiwi",
    },
    varieties: [
      { slug: "green-kiwi", name: "Green Kiwi", displayOrder: 0 },
      { slug: "golden-kiwi", name: "Golden Kiwi", displayOrder: 1 },
    ],
    aliases: [
      { alias: "kiwifruit", aliasType: "common_name" },
      { alias: "kiwi fruit", aliasType: "common_name" },
      { alias: "kiwis", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "pear", name: "Pear", category: "Fruit", subcategory: "Top fruit",
      description: "A gently sweet fruit high in fibre and vitamin C; Conference, Williams and Comice are cultivars.",
      knowledgeFoodSlug: "pear", diversityGroupSlug: "pear",
    },
    varieties: [
      { slug: "conference-pear", name: "Conference Pear", displayOrder: 0 },
      { slug: "williams-pear", name: "Williams Pear", displayOrder: 1 },
    ],
    aliases: [
      { alias: "pears", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "mango", name: "Mango", category: "Fruit", subcategory: "Tropical fruit",
      description: "A sweet tropical fruit rich in beta-carotene, vitamin C and folate.",
      knowledgeFoodSlug: "mango", diversityGroupSlug: "mango",
    },
    aliases: [
      { alias: "mangoes", aliasType: "plural" },
      { alias: "frozen mango", aliasType: "form" },
      { alias: "dried mango", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "grape", name: "Grape", category: "Fruit", subcategory: "Top fruit",
      description: "Small juicy fruits rich in flavonoids; red and black grapes also supply anthocyanins.",
      knowledgeFoodSlug: "grape", diversityGroupSlug: "grape",
    },
    varieties: [
      { slug: "red-grape", name: "Red Grape", displayOrder: 0 },
      { slug: "green-grape", name: "Green Grape", displayOrder: 1 },
      { slug: "black-grape", name: "Black Grape", displayOrder: 2 },
    ],
    aliases: [
      { alias: "grapes", aliasType: "plural" },
      { alias: "seedless grapes", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "lemon", name: "Lemon", category: "Fruit", subcategory: "Citrus",
      description: "A tart citrus fruit rich in vitamin C; belongs to the citrus plant group.",
      knowledgeFoodSlug: "lemon", diversityGroupSlug: "citrus", family: null,
    },
    aliases: [
      // "preserved lemon" REMOVED (NK6Q batch 013) — salt-fermented, very high in sodium,
      // and used as a condiment. It is not the fresh fruit.
      { alias: "lemons", aliasType: "plural" },
      { alias: "lemon juice", aliasType: "form" },
      { alias: "lemon zest", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "preserved-lemons", name: "Preserved Lemons", category: "Fermented foods", subcategory: "Preserved fruit",
      description: "Whole lemons packed in salt and left to ferment until the rind softens; a intensely savoury, very salty condiment used a sliver at a time.",
      knowledgeFoodSlug: null, diversityGroupSlug: "citrus", family: null, fermented: true,
    },
    aliases: [
      { alias: "preserved lemon", aliasType: "singular" },
      { alias: "salted lemons", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "lime", name: "Lime", category: "Fruit", subcategory: "Citrus",
      description: "A small, bright citrus fruit rich in vitamin C; belongs to the citrus plant group.",
      knowledgeFoodSlug: "lime", diversityGroupSlug: "citrus",
    },
    aliases: [
      { alias: "limes", aliasType: "plural" },
      { alias: "lime juice", aliasType: "form" },
      { alias: "lime zest", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "pomegranate", name: "Pomegranate", category: "Fruit", subcategory: "Exotic fruit",
      description: "A jewel-seeded fruit rich in anthocyanins, polyphenols and vitamin C.",
      knowledgeFoodSlug: "pomegranate", diversityGroupSlug: "pomegranate",
    },
    aliases: [
      { alias: "pomegranates", aliasType: "plural" },
      { alias: "pomegranate seeds", aliasType: "form" },
      { alias: "pomegranate arils", aliasType: "form" },
      { alias: "pomegranate juice", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "peach", name: "Peach", category: "Fruit", subcategory: "Stone fruit",
      description: "A sweet stone fruit with soft, fragrant flesh rich in beta-carotene and vitamin C; yellow and white varieties are the same plant.",
      knowledgeFoodSlug: "peach", diversityGroupSlug: "peach",
    },
    varieties: [
      { slug: "yellow-peach", name: "Yellow Peach", displayOrder: 0 },
      { slug: "white-peach", name: "White Peach", displayOrder: 1 },
    ],
    aliases: [
      { alias: "peaches", aliasType: "plural" },
      { alias: "tinned peaches", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "plum", name: "Plum", category: "Fruit", subcategory: "Stone fruit",
      description: "A sweet-tart stone fruit rich in fibre and vitamin C; Victoria, damson and greengage are varieties.",
      knowledgeFoodSlug: "plum", diversityGroupSlug: "plum",
    },
    varieties: [
      { slug: "victoria-plum", name: "Victoria Plum", displayOrder: 0 },
      { slug: "damson", name: "Damson", displayOrder: 1 },
    ],
    aliases: [
      { alias: "plums", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "cherry", name: "Cherry", category: "Fruit", subcategory: "Stone fruit",
      description: "Small stone fruits rich in anthocyanins and vitamin C; sweet and sour varieties are the same plant.",
      knowledgeFoodSlug: "cherry", diversityGroupSlug: "cherry",
    },
    aliases: [
      { alias: "cherries", aliasType: "plural" },
      { alias: "sweet cherry", aliasType: "common_name" },
      { alias: "morello cherry", aliasType: "common_name" },
      { alias: "frozen cherries", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "nectarine", name: "Nectarine", category: "Fruit", subcategory: "Stone fruit",
      description: "A smooth-skinned stone fruit closely related to the peach, rich in beta-carotene and vitamin C.",
      knowledgeFoodSlug: "nectarine", diversityGroupSlug: "nectarine",
    },
    aliases: [
      { alias: "nectarines", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "watermelon", name: "Watermelon", category: "Fruit", subcategory: "Melon",
      description: "A large, refreshing fruit with high water content, supplying lycopene, potassium and vitamin C.",
      knowledgeFoodSlug: "watermelon", diversityGroupSlug: "watermelon",
    },
    aliases: [
      { alias: "watermelons", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "pineapple", name: "Pineapple", category: "Fruit", subcategory: "Tropical fruit",
      description: "A tropical fruit rich in vitamin C and manganese, with a sweet and tangy flavour.",
      knowledgeFoodSlug: "pineapple", diversityGroupSlug: "pineapple",
    },
    aliases: [
      { alias: "pineapples", aliasType: "plural" },
      { alias: "tinned pineapple", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "fig", name: "Fig", category: "Fruit", subcategory: "Exotic fruit",
      description: "A soft, sweet fruit rich in fibre, calcium and potassium; enjoyed fresh in summer or dried year-round.",
      knowledgeFoodSlug: "fig", diversityGroupSlug: "fig",
    },
    aliases: [
      { alias: "figs", aliasType: "plural" },
      { alias: "dried figs", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "apricot", name: "Apricot", category: "Fruit", subcategory: "Stone fruit",
      description: "A golden stone fruit rich in beta-carotene and vitamin C; dried apricots are a concentrated source of iron.",
      knowledgeFoodSlug: "apricot", diversityGroupSlug: "apricot",
    },
    aliases: [
      { alias: "apricots", aliasType: "plural" },
      { alias: "dried apricots", aliasType: "form" },
      { alias: "tinned apricots", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "grapefruit", name: "Grapefruit", category: "Fruit", subcategory: "Citrus",
      description: "A large, bitter-sweet citrus fruit rich in vitamin C and folate; belongs to the citrus plant group.",
      knowledgeFoodSlug: null, diversityGroupSlug: "citrus",
    },
    aliases: [
      { alias: "grapefruits", aliasType: "plural" },
      { alias: "pink grapefruit", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "passion-fruit", name: "Passion Fruit", category: "Fruit", subcategory: "Exotic fruit",
      description: "A tropical fruit with aromatic, seedy pulp rich in fibre and vitamin C.",
      knowledgeFoodSlug: "passion-fruit", diversityGroupSlug: "passion-fruit",
    },
    aliases: [
      { alias: "passionfruit", aliasType: "common_name" },
      { alias: "passion fruits", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "blackberry", name: "Blackberry", category: "Fruit", subcategory: "Berries",
      description: "Deep purple berries rich in anthocyanins, fibre and vitamin C.",
      knowledgeFoodSlug: "blackberry", diversityGroupSlug: "blackberry",
    },
    aliases: [
      { alias: "blackberries", aliasType: "plural" },
      { alias: "bramble", aliasType: "common_name" },
      { alias: "frozen blackberries", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "melon", name: "Melon", category: "Fruit", subcategory: "Melon",
      description: "A refreshing fruit with high water content; honeydew, cantaloupe and galia are the most widely available varieties.",
      knowledgeFoodSlug: "melon", diversityGroupSlug: "melon",
    },
    varieties: [
      { slug: "cantaloupe-melon", name: "Cantaloupe", displayOrder: 0 },
      { slug: "honeydew-melon", name: "Honeydew", displayOrder: 1 },
      { slug: "galia-melon", name: "Galia", displayOrder: 2 },
    ],
    aliases: [
      { alias: "melons", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "cranberry", name: "Cranberry", category: "Fruit", subcategory: "Berries",
      description: "Tart red berries rich in flavonoids and vitamin C; commonly dried or juiced.",
      knowledgeFoodSlug: "cranberry", diversityGroupSlug: "cranberry",
    },
    aliases: [
      { alias: "cranberries", aliasType: "plural" },
      { alias: "dried cranberries", aliasType: "form" },
      { alias: "cranberry juice", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "blackcurrant", name: "Blackcurrant", category: "Fruit", subcategory: "Berries",
      description: "Small, intensely flavoured berries with exceptional vitamin C content and anthocyanins.",
      knowledgeFoodSlug: "blackcurrant", diversityGroupSlug: "blackcurrant",
    },
    aliases: [
      { alias: "blackcurrants", aliasType: "plural" },
      { alias: "black currant", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "redcurrant", name: "Redcurrant", category: "Fruit", subcategory: "Berries",
      description: "Tart, jewel-like berries rich in vitamin C and flavonoids, used in jams and as a cooking ingredient.",
      knowledgeFoodSlug: "redcurrant", diversityGroupSlug: "redcurrant",
    },
    aliases: [
      { alias: "redcurrants", aliasType: "plural" },
      { alias: "red currant", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "gooseberry", name: "Gooseberry", category: "Fruit", subcategory: "Berries",
      description: "A tart British berry rich in vitamin C and fibre, traditionally used in crumbles and jams.",
      knowledgeFoodSlug: "gooseberry", diversityGroupSlug: "gooseberry",
    },
    aliases: [
      { alias: "gooseberries", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "raisins", name: "Raisins", category: "Fruit", subcategory: "Dried fruit",
      description: "Dried grapes concentrated in fibre, potassium and iron; sultanas and currants are related dried grape products.",
      knowledgeFoodSlug: "raisins", diversityGroupSlug: "raisins",
    },
    aliases: [
      { alias: "sultanas", aliasType: "common_name" },
      { alias: "currants", aliasType: "common_name" },
      { alias: "mixed dried fruit", aliasType: "form" },
    ],
  },

  // ════════════════════════ Wave 5: Herbs ════════════════════════

  {
    food: {
      slug: "rosemary", name: "Rosemary", category: "Herbs", subcategory: "Woody herbs",
      description: "An aromatic woody herb rich in protective polyphenols, used in Mediterranean cooking.",
      knowledgeFoodSlug: "rosemary", diversityGroupSlug: "rosemary",
    },
    aliases: [
      { alias: "fresh rosemary", aliasType: "form" },
      { alias: "dried rosemary", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "thyme", name: "Thyme", category: "Herbs", subcategory: "Woody herbs",
      description: "A small-leaved woody herb full of aromatic polyphenols, used in many European cuisines.",
      knowledgeFoodSlug: "thyme", diversityGroupSlug: "thyme",
    },
    aliases: [
      { alias: "fresh thyme", aliasType: "form" },
      { alias: "dried thyme", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "oregano", name: "Oregano", category: "Herbs", subcategory: "Woody herbs",
      description: "An aromatic herb central to Mediterranean cooking, rich in protective polyphenols.",
      knowledgeFoodSlug: "oregano", diversityGroupSlug: "oregano",
    },
    aliases: [
      { alias: "dried oregano", aliasType: "form" },
      { alias: "fresh oregano", aliasType: "form" },
      { alias: "wild marjoram", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "dill", name: "Dill", category: "Herbs", subcategory: "Soft herbs",
      description: "A feathery soft herb with a fresh, anise-like flavour, supplying vitamin C and folate.",
      knowledgeFoodSlug: "dill", diversityGroupSlug: "dill",
    },
    aliases: [
      { alias: "fresh dill", aliasType: "form" },
      { alias: "dried dill", aliasType: "form" },
      { alias: "dill weed", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "chives", name: "Chives", category: "Herbs", subcategory: "Soft herbs",
      description: "A slender allium herb with a mild onion flavour, supplying vitamin K.",
      knowledgeFoodSlug: "chives", diversityGroupSlug: "chives",
    },
    aliases: [
      { alias: "fresh chives", aliasType: "form" },
      { alias: "garlic chives", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "sage", name: "Sage", category: "Herbs", subcategory: "Woody herbs",
      description: "A robust, earthy woody herb rich in polyphenols; used in roasting, butter sauces and Italian cooking.",
      knowledgeFoodSlug: "sage", diversityGroupSlug: "sage",
    },
    aliases: [
      { alias: "fresh sage", aliasType: "form" },
      { alias: "dried sage", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "tarragon", name: "Tarragon", category: "Herbs", subcategory: "Soft herbs",
      description: "An aromatic herb with a distinctive anise-like flavour, central to French cooking.",
      knowledgeFoodSlug: "tarragon", diversityGroupSlug: "tarragon",
    },
    aliases: [
      { alias: "French tarragon", aliasType: "common_name" },
      { alias: "fresh tarragon", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "bay-leaf", name: "Bay Leaf", category: "Herbs", subcategory: "Woody herbs",
      description: "The leaf of the bay laurel tree; dried or fresh, used to add depth to slow-cooked dishes.",
      knowledgeFoodSlug: "bay-leaf", diversityGroupSlug: "bay-leaf",
    },
    aliases: [
      { alias: "bay leaves", aliasType: "plural" },
      { alias: "dried bay leaf", aliasType: "form" },
      { alias: "bay laurel", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "lemongrass", name: "Lemongrass", category: "Herbs", subcategory: "Stem herbs",
      description: "A fragrant stem herb with a bright citrus flavour, widely used in South East Asian cooking.",
      knowledgeFoodSlug: "lemongrass", diversityGroupSlug: "lemongrass",
    },
    aliases: [
      { alias: "lemon grass", aliasType: "misspelling" },
      { alias: "lemongrass paste", aliasType: "form" },
    ],
  },

  // ════════════════════════ Wave 5: Spices ════════════════════════

  {
    food: {
      slug: "vanilla", name: "Vanilla", category: "Spices", subcategory: "Sweet spices",
      description: "The cured seed pod of a climbing orchid, split and scraped to flavour baking and desserts.",
      knowledgeFoodSlug: "vanilla", diversityGroupSlug: "vanilla", family: null,
    },
    aliases: [
      // "vanilla extract" REMOVED (NK6Q batch 008) — alcohol extraction makes a different
      // pantry product with a different composition and use from the pod.
      { alias: "vanilla pods", aliasType: "form" },
      { alias: "vanilla bean", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "vanilla-extract", name: "Vanilla Extract", category: "Spices", subcategory: "Sweet spices",
      description: "Vanilla pods macerated in alcohol and water to draw out the flavour; a liquid baking ingredient, not the pod itself.",
      knowledgeFoodSlug: null, diversityGroupSlug: "vanilla", family: null,
    },
    aliases: [
      { alias: "vanilla essence", aliasType: "common_name" },
      { alias: "vanilla paste", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "chilli", name: "Chilli", category: "Spices", subcategory: "Chillies",
      description: "A hot pepper supplying vitamin C and protective polyphenols; fresh, dried and ground forms are the same plant.",
      knowledgeFoodSlug: "chilli", diversityGroupSlug: "chilli",
    },
    aliases: [
      { alias: "chili", aliasType: "misspelling" },
      { alias: "red chilli", aliasType: "form" },
      { alias: "green chilli", aliasType: "form" },
      { alias: "chilli flakes", aliasType: "form" },
      { alias: "chilli powder", aliasType: "form" },
      { alias: "dried chilli", aliasType: "form" },
      { alias: "bird's eye chilli", aliasType: "common_name" },
      { alias: "jalapeño", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "black-pepper", name: "Black Pepper", category: "Spices", subcategory: "Peppercorns",
      description: "The world's most widely used spice, from unripe berries dried with the hull on; whole peppercorns and ground pepper are the same food.",
      knowledgeFoodSlug: "black-pepper", diversityGroupSlug: "black-pepper", family: null,
    },
    aliases: [
      // "white pepper" REMOVED (NK6Q batch 010). Same species, but the ripe berry with the
      // hull removed — a distinct pantry spice with its own flavour and use. Whole-vs-ground
      // FORMATS stay: those really are the same food.
      { alias: "ground black pepper", aliasType: "form" },
      { alias: "peppercorns", aliasType: "form" },
      { alias: "black peppercorns", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "white-pepper", name: "White Pepper", category: "Spices", subcategory: "Peppercorns",
      description: "The ripe peppercorn with its dark hull removed before drying; hotter and more musty than black pepper, and used where dark specks are unwanted.",
      knowledgeFoodSlug: null, diversityGroupSlug: "black-pepper", family: null,
    },
    aliases: [
      { alias: "white peppercorns", aliasType: "form" },
      { alias: "ground white pepper", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cardamom", name: "Cardamom", category: "Spices", subcategory: "Pod spices",
      description: "A fragrant aromatic spice from the ginger family used in South Asian, Nordic and Middle Eastern cooking.",
      knowledgeFoodSlug: "cardamom", diversityGroupSlug: "cardamom",
    },
    aliases: [
      { alias: "green cardamom", aliasType: "form" },
      { alias: "ground cardamom", aliasType: "form" },
      { alias: "cardamom pods", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "star-anise", name: "Star Anise", category: "Spices", subcategory: "Pod spices",
      description: "A star-shaped spice with an intense aniseed flavour, used in Chinese five-spice and braised dishes.",
      knowledgeFoodSlug: "star-anise", diversityGroupSlug: "star-anise",
    },
    aliases: [
      { alias: "star anise", aliasType: "common_name" },
      { alias: "ground star anise", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cloves", name: "Cloves", category: "Spices", subcategory: "Ground spices",
      description: "Intensely aromatic dried flower buds rich in polyphenols; whole and ground are the same food.",
      knowledgeFoodSlug: "cloves", diversityGroupSlug: "cloves",
    },
    aliases: [
      { alias: "whole cloves", aliasType: "form" },
      { alias: "ground cloves", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "nutmeg", name: "Nutmeg", category: "Spices", subcategory: "Ground spices",
      description: "A warm spice grated from a tropical tree seed; used in béchamel, baking and spiced drinks.",
      knowledgeFoodSlug: "nutmeg", diversityGroupSlug: "nutmeg",
    },
    aliases: [
      { alias: "whole nutmeg", aliasType: "form" },
      { alias: "ground nutmeg", aliasType: "form" },
    ],
  },

  // ════════════════════════ Wave 6: Nuts and Seeds ════════════════════════

  {
    food: {
      slug: "sesame-seeds", name: "Sesame Seeds", category: "Seeds", subcategory: "Whole seeds",
      description: "Small seeds supplying calcium and healthy fats; also pressed into tahini.",
      knowledgeFoodSlug: "sesame-seeds", diversityGroupSlug: "sesame-seeds",
    },
    aliases: [
      { alias: "sesame seed", aliasType: "singular" },
      { alias: "sesame", aliasType: "common_name" },
      { alias: "black sesame seeds", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "hemp-seeds", name: "Hemp Seeds", category: "Seeds", subcategory: "Whole seeds",
      description: "Soft seeds offering complete plant protein and a balance of healthy fats.",
      knowledgeFoodSlug: "hemp-seeds", diversityGroupSlug: "hemp-seeds",
    },
    aliases: [
      { alias: "hemp seed", aliasType: "singular" },
      { alias: "hemp hearts", aliasType: "common_name" },
      { alias: "hulled hemp seeds", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "hazelnuts", name: "Hazelnuts", category: "Nuts", subcategory: "Tree nuts",
      description: "A round tree nut rich in vitamin E, magnesium and copper with a buttery flavour.",
      knowledgeFoodSlug: "hazelnuts", diversityGroupSlug: "hazelnuts",
    },
    aliases: [
      { alias: "hazelnut", aliasType: "singular" },
      { alias: "cobnuts", aliasType: "common_name" },
      { alias: "filberts", aliasType: "common_name" },
      { alias: "ground hazelnuts", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cashews", name: "Cashews", category: "Nuts", subcategory: "Tree nuts",
      description: "Creamy tree nuts supplying magnesium, copper, zinc and unsaturated fats.",
      knowledgeFoodSlug: "cashews", diversityGroupSlug: "cashews",
    },
    aliases: [
      { alias: "cashew nut", aliasType: "singular" },
      { alias: "cashew nuts", aliasType: "plural" },
      { alias: "roasted cashews", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "pistachios", name: "Pistachios", category: "Nuts", subcategory: "Tree nuts",
      description: "Green tree nuts rich in vitamin B6, potassium and copper.",
      knowledgeFoodSlug: "pistachios", diversityGroupSlug: "pistachios",
    },
    aliases: [
      { alias: "pistachio", aliasType: "singular" },
      { alias: "pistachio nut", aliasType: "singular" },
      { alias: "shelled pistachios", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "brazil-nuts", name: "Brazil Nuts", category: "Nuts", subcategory: "Tree nuts",
      description: "Large South American nuts and one of the richest food sources of selenium.",
      knowledgeFoodSlug: "brazil-nuts", diversityGroupSlug: "brazil-nuts",
    },
    aliases: [
      { alias: "brazil nut", aliasType: "singular" },
    ],
  },
  {
    food: {
      slug: "pine-nuts", name: "Pine Nuts", category: "Nuts", subcategory: "Tree nuts",
      description: "Small, soft seeds from pine trees rich in magnesium and vitamin E; essential in traditional pesto.",
      knowledgeFoodSlug: "pine-nuts", diversityGroupSlug: "pine-nuts",
    },
    aliases: [
      { alias: "pine nut", aliasType: "singular" },
      { alias: "pine kernels", aliasType: "common_name" },
      { alias: "pignoli", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "pecans", name: "Pecans", category: "Nuts", subcategory: "Tree nuts",
      description: "A rich, buttery tree nut supplying unsaturated fats, copper and manganese.",
      knowledgeFoodSlug: "pecans", diversityGroupSlug: "pecans",
    },
    aliases: [
      { alias: "pecan", aliasType: "singular" },
      { alias: "pecan nut", aliasType: "singular" },
      { alias: "pecan halves", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "peanuts", name: "Peanuts", category: "Nuts", subcategory: "Legume nuts",
      description: "Technically a legume, peanuts supply plant protein, magnesium, vitamin E and zinc.",
      knowledgeFoodSlug: "peanuts", diversityGroupSlug: "peanuts", family: null,
    },
    aliases: [
      // "peanut butter" REMOVED (NK6Q batch 013) — a distinct pantry product, and one that
      // often carries added oil, sugar and salt. Whole nuts and a ground paste with an
      // ingredient list of its own cannot share a fact owner.
      { alias: "peanut", aliasType: "singular" },
      { alias: "groundnuts", aliasType: "common_name" },
      { alias: "monkey nuts", aliasType: "common_name" },
      { alias: "roasted peanuts", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "peanut-butter", name: "Peanut Butter", category: "Healthy fats", subcategory: "Nut butters",
      description: "Roasted peanuts ground to a paste. Check the label: 100% peanuts is a whole food, but many jars add palm oil, sugar and salt.",
      knowledgeFoodSlug: null, diversityGroupSlug: "peanuts", family: null,
    },
    aliases: [
      { alias: "crunchy peanut butter", aliasType: "form" },
      { alias: "smooth peanut butter", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "macadamia", name: "Macadamia Nuts", category: "Nuts", subcategory: "Tree nuts",
      description: "Rich, buttery Australian tree nuts high in unsaturated fats and manganese.",
      knowledgeFoodSlug: "macadamia", diversityGroupSlug: "macadamia",
    },
    aliases: [
      { alias: "macadamia nut", aliasType: "singular" },
      { alias: "macadamias", aliasType: "plural" },
    ],
  },

  // ════════════════════════ Wave 7: Dairy and Alternatives ════════════════════

  {
    food: {
      slug: "milk", name: "Milk", category: "Dairy", subcategory: "Cow's milk",
      description: "A nutrient-dense dairy liquid supplying calcium, vitamin D, vitamin B12 and iodine. Whole milk is the default; the reduced-fat classes are separate foods.",
      knowledgeFoodSlug: "milk", diversityGroupSlug: null, family: null,
    },
    aliases: [
      // "skimmed milk" REMOVED (NK6Q batch 020) — a fat class, and `semi-skimmed-milk` and
      // `lactose-free-milk` were already minted as their own identities. "semi-skimmed milk"
      // REMOVED for the same reason: leaving it here forked the identity that already exists.
      // "whole milk" STAYS — whole milk IS this identity (NK6Q: Merge).
      { alias: "whole milk", aliasType: "form" },
      { alias: "full-fat milk", aliasType: "form" },
      { alias: "cow's milk", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "semi-skimmed-milk", name: "Semi-Skimmed Milk", category: "Dairy", subcategory: "Cow's milk",
      description: "Cow's milk with roughly half the fat removed (about 1.7%); the most-bought milk in the UK.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "milk",
    },
    aliases: [
      { alias: "semi skimmed milk", aliasType: "common_name" },
      { alias: "2% milk", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "skimmed-milk", name: "Skimmed Milk", category: "Dairy", subcategory: "Cow's milk",
      description: "Cow's milk with virtually all the fat removed (about 0.1%); the same protein and calcium as whole milk, with less fat-soluble vitamin A and D.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "milk",
    },
    aliases: [
      { alias: "fat-free milk", aliasType: "common_name" },
      { alias: "non-fat milk", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "yoghurt", name: "Yoghurt", category: "Dairy", subcategory: "Fermented dairy",
      description: "A cultured dairy food supplying calcium and vitamin B12; includes live, natural and Greek-style varieties.",
      knowledgeFoodSlug: "live-yogurt", diversityGroupSlug: null, fermented: true,
    },
    varieties: [
      { slug: "greek-yoghurt", name: "Greek Yoghurt", description: "Strained yoghurt with a much higher protein content and richer texture.", displayOrder: 0, knowledgeFoodSlug: "greek-yoghurt" },
    ],
    aliases: [
      { alias: "natural yoghurt", aliasType: "form" },
      { alias: "plain yoghurt", aliasType: "form" },
      { alias: "live yoghurt", aliasType: "form" },
      { alias: "yogurt", aliasType: "misspelling" },
      { alias: "natural yogurt", aliasType: "form" },
      { alias: "plain yogurt", aliasType: "form" },
    ],
  },
  // ── Cheese (NK6R Amendment 2) ───────────────────────────────────────────────
  // `cheese` is the parent canonical identity. Beneath it sit MEANINGFUL FAMILIES
  // — groupings by how the cheese is MADE (curd handling, ripening), which is what
  // actually predicts a cheese's character:
  //     fresh · whey · brined · bloomy-rind · washed-rind · blue · pasta-filata ·
  //     pressed · cooked-pressed
  //
  // HARD and SOFT ARE NOT HIERARCHY LEVELS. Texture is a DESCRIPTIVE ATTRIBUTE and
  // lives in `subcategory` ("Hard", "Semi-hard", "Soft", "Fresh"). It cuts across
  // families — a blue cheese may be soft (Dolcelatte) or hard (aged Stilton) — so
  // it can never be a parent. Nothing branches on `subcategory`; it is display copy.
  //
  // Each named cheese keeps its own identity and facts (GOV2 Rule 1): milk source,
  // PDO rules and ageing make Gorgonzola and Roquefort disagree on facts with each
  // other and with the `blue-cheese` family row. The family row remains a legitimate
  // coarse identity for "some blue cheese" — it is a parent, not a synonym, which is
  // exactly why NK6Q §2.2 struck `gorgonzola`/`roquefort` from its alias set.
  {
    food: {
      slug: "cheese", name: "Cheese", category: "Dairy", subcategory: "Cheese",
      description: "Milk curdled, drained and ripened. The parent identity behind the cheese families; how a cheese is made — and from whose milk — decides its texture, flavour and nutrient profile.",
      // Abstract parent: the families and the named cheeses own the facts (cf. `mushroom`).
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: null,
    },
    aliases: [
      { alias: "cheeses", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "fresh-cheese", name: "Fresh Cheese", category: "Dairy", subcategory: "Cheese",
      description: "Unripened cheese eaten soon after the curd is set — mild, moist and high in moisture.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cheese",
    },
    aliases: [
      { alias: "unripened cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "whey-cheese", name: "Whey Cheese", category: "Dairy", subcategory: "Cheese",
      description: "Cheese made by recooking the whey left over from another cheese, rather than from the curd itself.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cheese",
    },
  },
  {
    food: {
      slug: "brined-cheese", name: "Brined Cheese", category: "Dairy", subcategory: "Cheese",
      description: "Cheese ripened and stored in salt brine, giving a firm, salty, tangy result that keeps well.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cheese",
    },
    aliases: [
      { alias: "pickled cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "bloomy-rind-cheese", name: "Bloomy Rind Cheese", category: "Dairy", subcategory: "Cheese",
      description: "Cheese ripened from the outside in beneath a soft white mould rind, growing creamier with age.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cheese",
    },
    aliases: [
      { alias: "soft-ripened cheese", aliasType: "common_name" },
      { alias: "white rind cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "washed-rind-cheese", name: "Washed Rind Cheese", category: "Dairy", subcategory: "Cheese",
      description: "Cheese whose rind is repeatedly washed in brine, wine or beer during ripening, producing a pungent aroma and a supple paste.",
      // No canonical member yet: Taleggio, Reblochon, Raclette, Morbier and Limburger
      // currently exist as knowledge_foods only (batch 022), awaiting spine promotion.
      // Declared now so those imports have a correct parent to bind to (NK6R §7).
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cheese",
    },
    aliases: [
      { alias: "smear-ripened cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "pasta-filata", name: "Pasta Filata", category: "Dairy", subcategory: "Cheese",
      description: "Cheese whose curd is heated and stretched into elastic strands before shaping, giving the characteristic pull and melt.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cheese",
    },
    aliases: [
      { alias: "stretched curd cheese", aliasType: "common_name" },
      { alias: "spun paste cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "pressed-cheese", name: "Pressed Cheese", category: "Dairy", subcategory: "Cheese",
      description: "Cheese whose curd is pressed to expel whey and then aged, without cooking the curd; firm and sliceable.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cheese",
    },
    aliases: [
      { alias: "uncooked pressed cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "cooked-pressed-cheese", name: "Cooked-Pressed Cheese", category: "Dairy", subcategory: "Cheese",
      description: "Cheese whose curd is heated before pressing and long ageing, producing a dense, granular, intensely savoury result.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cheese",
    },
  },

  {
    food: {
      slug: "cheddar", name: "Cheddar", category: "Dairy", subcategory: "Hard",
      description: "A firm, tangy British cheese and an excellent source of calcium, vitamin B12 and iodine.",
      knowledgeFoodSlug: "cheddar", diversityGroupSlug: null, family: "pressed-cheese",
    },
    varieties: [
      // NK6Q batch 021: maturity is a named variety of the same cheese, not a new
      // fact owner. Mild/mature/extra-mature are the same curd, aged for longer.
      { slug: "mild-cheddar", name: "Mild Cheddar", displayOrder: 0 },
      { slug: "mature-cheddar", name: "Mature Cheddar", displayOrder: 1 },
      { slug: "extra-mature-cheddar", name: "Extra Mature Cheddar", displayOrder: 2 },
    ],
    aliases: [
      { alias: "cheddar cheese", aliasType: "form" },
      { alias: "grated cheddar", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "mozzarella", name: "Mozzarella", category: "Dairy", subcategory: "Semi-soft",
      description: "A mild, stretched-curd Italian cheese made from cow's milk, supplying calcium and vitamin B12.",
      knowledgeFoodSlug: "mozzarella", diversityGroupSlug: null, family: "pasta-filata",
    },
    aliases: [
      // "buffalo mozzarella" REMOVED — buffalo milk is a different milk source with a
      // different profile (NK6Q batch 022). It becomes its own identity; this record
      // is the cow's-milk mozzarella.
      { alias: "fresh mozzarella", aliasType: "form" },
      { alias: "grated mozzarella", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "halloumi", name: "Halloumi", category: "Dairy", subcategory: "Semi-hard",
      description: "A firm Cypriot brined cheese with a high melting point; best grilled or pan-fried.",
      knowledgeFoodSlug: "halloumi", diversityGroupSlug: null, family: "brined-cheese",
    },
    aliases: [
      { alias: "grilling cheese", aliasType: "common_name" },
      { alias: "haloumi", aliasType: "misspelling" },
    ],
  },
  {
    food: {
      slug: "feta", name: "Feta", category: "Dairy", subcategory: "Soft",
      description: "A crumbly, tangy Greek brined cheese made from sheep's and goat's milk, supplying calcium.",
      knowledgeFoodSlug: "feta", diversityGroupSlug: null, family: "brined-cheese",
    },
    aliases: [
      { alias: "feta cheese", aliasType: "form" },
      { alias: "Greek cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "parmesan", name: "Parmesan", category: "Dairy", subcategory: "Hard",
      description: "A hard, long-aged Italian cheese with intense umami flavour, rich in calcium and vitamin B12.",
      knowledgeFoodSlug: "parmesan", diversityGroupSlug: null, family: "cooked-pressed-cheese",
    },
    aliases: [
      // "grana padano" REMOVED — a distinct PDO with its own production rules and
      // ageing (NK6Q batch 021). It becomes its own identity in the same family.
      { alias: "parmigiano reggiano", aliasType: "common_name" },
      { alias: "parmigiano-reggiano", aliasType: "common_name" },
      { alias: "grated parmesan", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "ricotta", name: "Ricotta", category: "Dairy", subcategory: "Fresh",
      description: "A soft, mild Italian whey cheese, light in flavour and supplying calcium.",
      knowledgeFoodSlug: "ricotta", diversityGroupSlug: null, family: "whey-cheese",
    },
    aliases: [
      { alias: "ricotta cheese", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "oat-milk", name: "Oat Milk", category: "Dairy alternatives", subcategory: "Plant milks",
      description: "A plant-based milk made from oats; contributes oat plant diversity and is commonly fortified.",
      // NK6S — a plant beverage. Domain stays "Dairy alternatives"; the plant it counts
      // stays `oats`, since a variety-free child keeps its own diversity group.
      knowledgeFoodSlug: "oat-milk", diversityGroupSlug: "oats", family: "plant-beverage",
    },
    aliases: [
      { alias: "oat drink", aliasType: "common_name" },
      { alias: "oat milk barista", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "soy-milk", name: "Soy Milk", category: "Dairy alternatives", subcategory: "Plant milks",
      description: "A plant-based milk made from soybeans, supplying plant protein; commonly fortified.",
      knowledgeFoodSlug: "soy-milk", diversityGroupSlug: "edamame", family: "plant-beverage",
    },
    aliases: [
      { alias: "soya milk", aliasType: "common_name" },
      { alias: "soya drink", aliasType: "common_name" },
      { alias: "soy drink", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "almond-milk", name: "Almond Milk", category: "Dairy alternatives", subcategory: "Plant milks",
      description: "A plant-based milk made from almonds, supplying some vitamin E; commonly fortified.",
      knowledgeFoodSlug: "almond-milk", diversityGroupSlug: "almonds", family: "plant-beverage",
    },
    aliases: [
      { alias: "almond drink", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "kefir", name: "Kefir", category: "Dairy", subcategory: "Fermented dairy",
      description: "A cultured, drinkable ferment rich in live cultures and calcium.",
      // NK6S — the drink IS the food; there is no non-liquid kefir. Domain stays Dairy.
      knowledgeFoodSlug: "kefir", diversityGroupSlug: null, family: "fermented-beverage", fermented: true,
    },
    aliases: [
      { alias: "milk kefir", aliasType: "common_name" },
      { alias: "kefir drink", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "tempeh", name: "Tempeh", category: "Fermented foods", subcategory: "Fermented soya",
      description: "A firm fermented soya cake offering complete plant protein and fibre.",
      knowledgeFoodSlug: "tempeh", diversityGroupSlug: null, fermented: true,
    },
    aliases: [
      { alias: "fermented soya", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "tofu", name: "Tofu", category: "Legumes", subcategory: "Soya",
      description: "A versatile soya food supplying plant protein, calcium and iron; available in firm and silken varieties.",
      knowledgeFoodSlug: "tofu", diversityGroupSlug: null,
    },
    varieties: [
      { slug: "firm-tofu", name: "Firm Tofu", displayOrder: 0 },
      { slug: "silken-tofu", name: "Silken Tofu", displayOrder: 1 },
    ],
    aliases: [
      { alias: "bean curd", aliasType: "common_name" },
      { alias: "extra-firm tofu", aliasType: "form" },
      { alias: "smoked tofu", aliasType: "form" },
    ],
  },

  // ════════════════════════ Wave 8: Proteins ════════════════════════

  {
    food: {
      slug: "eggs", name: "Eggs", category: "Proteins", subcategory: "Eggs",
      description: "A complete protein food supplying vitamin D, vitamin B12, selenium and iodine.",
      knowledgeFoodSlug: "eggs", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "egg", aliasType: "singular" },
      { alias: "hen eggs", aliasType: "common_name" },
      { alias: "free-range eggs", aliasType: "form" },
      { alias: "organic eggs", aliasType: "form" },
      { alias: "boiled egg", aliasType: "form" },
      { alias: "scrambled eggs", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "chicken", name: "Chicken", category: "Proteins", subcategory: "Poultry",
      description: "A widely eaten white meat supplying selenium, vitamin B6, zinc and vitamin B12.",
      knowledgeFoodSlug: "chicken", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "chicken breast", aliasType: "form" },
      { alias: "chicken thigh", aliasType: "form" },
      { alias: "chicken leg", aliasType: "form" },
      { alias: "whole chicken", aliasType: "form" },
      { alias: "chicken mince", aliasType: "form" },
      { alias: "roast chicken", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "turkey", name: "Turkey", category: "Proteins", subcategory: "Poultry",
      description: "A lean white meat supplying selenium, vitamin B6, zinc and vitamin B12.",
      knowledgeFoodSlug: "turkey", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "turkey breast", aliasType: "form" },
      { alias: "turkey mince", aliasType: "form" },
      { alias: "turkey steak", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "beef", name: "Beef", category: "Proteins", subcategory: "Red meat",
      description: "A red meat supplying well-absorbed iron, zinc and vitamin B12.",
      knowledgeFoodSlug: "beef", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "beef mince", aliasType: "form" },
      { alias: "minced beef", aliasType: "form" },
      { alias: "ground beef", aliasType: "form" },
      { alias: "steak", aliasType: "form" },
      { alias: "sirloin", aliasType: "form" },
      { alias: "rump steak", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "lamb", name: "Lamb", category: "Proteins", subcategory: "Red meat",
      description: "The meat of a young sheep; a red meat with a distinctive flavour supplying iron, zinc and vitamin B12.",
      knowledgeFoodSlug: "lamb", diversityGroupSlug: null, family: null,
    },
    aliases: [
      // "mutton" REMOVED (NK6Q batch 018) — the meat of an ADULT sheep, distinct in flavour,
      // fat and texture. Mirrors `veal` (young beef) being minted separately from `beef`.
      // Cuts and mince below stay: no THA-approved cut-level fact owner (`form_policy`).
      { alias: "lamb chops", aliasType: "form" },
      { alias: "lamb mince", aliasType: "form" },
      { alias: "lamb leg", aliasType: "form" },
      { alias: "lamb shoulder", aliasType: "form" },
      { alias: "minced lamb", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "mutton", name: "Mutton", category: "Proteins", subcategory: "Red meat",
      description: "The meat of an adult sheep, over a year old; darker, fattier and more strongly flavoured than lamb, and suited to slow cooking.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: null,
    },
  },
  {
    food: {
      slug: "pork", name: "Pork", category: "Proteins", subcategory: "White meat",
      description: "A versatile white meat supplying vitamin B6, vitamin B12, selenium and zinc.",
      knowledgeFoodSlug: "pork", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "pork chops", aliasType: "form" },
      { alias: "pork loin", aliasType: "form" },
      { alias: "pork belly", aliasType: "form" },
      { alias: "pork mince", aliasType: "form" },
      { alias: "pork tenderloin", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "duck", name: "Duck", category: "Proteins", subcategory: "Poultry",
      description: "A rich, dark poultry meat supplying iron, zinc and vitamin B12.",
      knowledgeFoodSlug: "duck", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "duck breast", aliasType: "form" },
      { alias: "duck leg", aliasType: "form" },
      { alias: "whole duck", aliasType: "form" },
      { alias: "duck confit", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "salmon", name: "Salmon", category: "Healthy fats", subcategory: "Oily fish",
      description: "An oily fish rich in omega-3 fats and vitamin D.",
      knowledgeFoodSlug: "salmon", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "salmon fillet", aliasType: "form" },
      { alias: "smoked salmon", aliasType: "form" },
      { alias: "tinned salmon", aliasType: "form" },
      { alias: "fresh salmon", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "sardines", name: "Sardines", category: "Healthy fats", subcategory: "Oily fish",
      description: "Small oily fish rich in omega-3, calcium and vitamin D; often available tinned.",
      knowledgeFoodSlug: "sardines", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "pilchards", aliasType: "common_name" },
      { alias: "tinned sardines", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "tuna", name: "Tuna", category: "Healthy fats", subcategory: "Oily fish",
      description: "An oily fish supplying omega-3 fats, selenium and vitamin D; tinned tuna is a pantry staple.",
      knowledgeFoodSlug: "tuna", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "tinned tuna", aliasType: "form" },
      { alias: "tuna steak", aliasType: "form" },
      { alias: "tuna in spring water", aliasType: "form" },
      { alias: "tuna in brine", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "mackerel", name: "Mackerel", category: "Healthy fats", subcategory: "Oily fish",
      description: "A rich oily fish and one of the best sources of omega-3 fats, vitamin D and vitamin B12.",
      knowledgeFoodSlug: "mackerel", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "smoked mackerel", aliasType: "form" },
      { alias: "mackerel fillet", aliasType: "form" },
      { alias: "tinned mackerel", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cod", name: "Cod", category: "Proteins", subcategory: "White fish",
      description: "A mild-flavoured white fish supplying selenium, vitamin B12 and iodine.",
      knowledgeFoodSlug: "cod", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "cod fillet", aliasType: "form" },
      { alias: "cod loin", aliasType: "form" },
      { alias: "salt cod", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "haddock", name: "Haddock", category: "Proteins", subcategory: "White fish",
      description: "A firm white fish with a slightly sweet flavour, supplying selenium, vitamin B12 and iodine.",
      knowledgeFoodSlug: "haddock", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "haddock fillet", aliasType: "form" },
      { alias: "smoked haddock", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "anchovies", name: "Anchovies", category: "Healthy fats", subcategory: "Oily fish",
      description: "Small, intensely flavoured oily fish supplying omega-3 fats, calcium and vitamin D.",
      knowledgeFoodSlug: "anchovies", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "anchovy", aliasType: "singular" },
      { alias: "tinned anchovies", aliasType: "form" },
      { alias: "salted anchovies", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "prawns", name: "Prawns", category: "Proteins", subcategory: "Shellfish",
      description: "A lean shellfish supplying selenium, zinc, iodine and vitamin B12.",
      knowledgeFoodSlug: "prawns", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "prawn", aliasType: "singular" },
      { alias: "shrimp", aliasType: "common_name" },
      { alias: "king prawns", aliasType: "form" },
      { alias: "tiger prawns", aliasType: "form" },
      { alias: "cooked prawns", aliasType: "form" },
      { alias: "frozen prawns", aliasType: "form" },
    ],
  },

  // ════════════════════════ Fermented Foods (Canonical) ═══════════════════════

  {
    food: {
      slug: "miso", name: "Miso", category: "Fermented foods", subcategory: "Fermented soya",
      description: "A savoury fermented soya bean paste used to add depth and live cultures to soups and sauces.",
      knowledgeFoodSlug: "miso", diversityGroupSlug: null, fermented: true,
    },
    aliases: [
      { alias: "miso paste", aliasType: "form" },
      { alias: "white miso", aliasType: "form" },
      { alias: "red miso", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "sauerkraut", name: "Sauerkraut", category: "Fermented foods", subcategory: "Fermented vegetables",
      description: "Fermented cabbage providing live cultures and fibre; choose unpasteurised for live cultures.",
      knowledgeFoodSlug: "sauerkraut", diversityGroupSlug: null, fermented: true,
    },
    aliases: [
      { alias: "fermented cabbage", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "kimchi", name: "Kimchi", category: "Fermented foods", subcategory: "Fermented vegetables",
      description: "A Korean ferment of cabbage and spices, rich in live cultures and fibre.",
      knowledgeFoodSlug: "kimchi", diversityGroupSlug: null, fermented: true,
    },
    aliases: [
      { alias: "kimchee", aliasType: "misspelling" },
    ],
  },

  // ════════════════════════ Grains & Cereals ═══════════════════════════════════

  {
    food: {
      slug: "oats", name: "Oats", category: "Grains", subcategory: "Whole grains",
      description: "A whole grain rich in soluble fibre (beta-glucan), magnesium and iron; associated with heart health.",
      knowledgeFoodSlug: "oats", diversityGroupSlug: "oats",
    },
    aliases: [
      // "oat flour" REMOVED (NK6Q §2.3) — a milled flour is a first-class fact owner,
      // not a form of the whole grain. Flake FORMATS below stay: they are the same grain.
      { alias: "porridge oats", aliasType: "form" },
      { alias: "rolled oats", aliasType: "form" },
      { alias: "oat flakes", aliasType: "form" },
      { alias: "jumbo oats", aliasType: "form" },
      { alias: "oatmeal", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "brown-rice", name: "Brown Rice", category: "Grains", subcategory: "Whole grains",
      description: "A whole grain with the bran layer intact, supplying fibre, magnesium and manganese.",
      knowledgeFoodSlug: "brown-rice", diversityGroupSlug: "rice",
    },
    aliases: [
      { alias: "wholegrain rice", aliasType: "common_name" },
      { alias: "long-grain brown rice", aliasType: "form" },
      { alias: "brown basmati rice", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "white-rice", name: "White Rice", category: "Grains", subcategory: "Refined grains",
      description: "A refined grain staple; basmati and jasmine are the most popular varieties in UK households.",
      knowledgeFoodSlug: "white-rice", diversityGroupSlug: "rice", family: null,
    },
    varieties: [
      // NK6Q batch 007 — cultivars of the same refined grain, promoted from `form` aliases
      // to what they actually are: named VARIETIES. Nutrient profile ≈ white rice.
      { slug: "basmati-rice", name: "Basmati Rice", description: "Long-grain aromatic rice. Brown basmati belongs to brown-rice.", displayOrder: 0 },
      { slug: "jasmine-rice", name: "Jasmine Rice", description: "Aromatic long-grain rice.", displayOrder: 1 },
      { slug: "risotto-rice", name: "Risotto Rice", description: "Short-grain, high-starch cultivars such as arborio and carnaroli.", displayOrder: 2 },
      { slug: "sushi-rice", name: "Sushi Rice", description: "Short-grain rice. Seasoned sushi rice is a preparation, not this food.", displayOrder: 3 },
    ],
    aliases: [
      { alias: "long-grain rice", aliasType: "form" },
      { alias: "arborio rice", aliasType: "common_name" },
      { alias: "carnaroli rice", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "quinoa", name: "Quinoa", category: "Grains", subcategory: "Pseudo-cereals",
      description: "A seed used as a grain; one of few plant foods supplying all essential amino acids.",
      knowledgeFoodSlug: "quinoa", diversityGroupSlug: "quinoa",
    },
    aliases: [
      { alias: "white quinoa", aliasType: "form" },
      { alias: "red quinoa", aliasType: "form" },
      { alias: "tricolour quinoa", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "buckwheat", name: "Buckwheat", category: "Grains", subcategory: "Pseudo-cereals",
      description: "A naturally gluten-free pseudo-cereal rich in fibre, magnesium and manganese.",
      knowledgeFoodSlug: "buckwheat", diversityGroupSlug: "buckwheat",
    },
    aliases: [
      // "buckwheat flour" REMOVED (NK6Q §2.3) — see `oats` above.
      { alias: "buckwheat groats", aliasType: "form" },
      { alias: "kasha", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "barley", name: "Barley", category: "Grains", subcategory: "Whole grains",
      description: "A chewy, nutty whole grain rich in soluble fibre and selenium.",
      knowledgeFoodSlug: "barley", diversityGroupSlug: "barley",
    },
    aliases: [
      { alias: "pearl barley", aliasType: "form" },
      { alias: "pot barley", aliasType: "form" },
      { alias: "barley flakes", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "spelt", name: "Spelt", category: "Grains", subcategory: "Whole grains",
      description: "An ancient variety of wheat with a nutty, slightly sweet flavour, supplying fibre and magnesium.",
      knowledgeFoodSlug: "spelt", diversityGroupSlug: "spelt",
    },
    aliases: [
      { alias: "wholegrain spelt", aliasType: "form" },
      { alias: "spelt pasta", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "rye", name: "Rye", category: "Grains", subcategory: "Whole grains",
      description: "A dense, flavourful grain with high fibre content and a lower glycaemic impact than wheat.",
      knowledgeFoodSlug: "rye", diversityGroupSlug: "rye",
    },
    aliases: [
      // "rye flour" REMOVED (NK6Q §2.3) — see `oats` above.
      { alias: "rye bread", aliasType: "form" },
      { alias: "dark rye", aliasType: "form" },
      { alias: "rye crispbread", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "wheat", name: "Wheat", category: "Grains", subcategory: "Whole grains",
      description: "The world's most widely grown cereal grain; whole wheat retains the most fibre and nutrients.",
      knowledgeFoodSlug: "wheat", diversityGroupSlug: "wheat",
    },
    aliases: [
      // All "…flour" aliases REMOVED (NK6Q §2.3) — the grain is not the flour.
      { alias: "whole wheat", aliasType: "form" },
      { alias: "wheat berries", aliasType: "form" },
    ],
  },
  // NK6R — the milled flours NK6Q ruled `Separate canonical food`, consistent with the
  // 19 flours already minted (plain-wheat-flour, semolina-flour, chestnut-flour, …).
  {
    food: {
      slug: "plain-wheat-flour", name: "Plain Wheat Flour", category: "Grains", subcategory: "Flours",
      description: "White wheat flour with the bran and germ milled out; the default UK baking and thickening flour.",
      knowledgeFoodSlug: null, diversityGroupSlug: "wheat", family: null,
    },
    aliases: [
      { alias: "wheat flour", aliasType: "common_name" },
      { alias: "plain flour", aliasType: "common_name" },
      { alias: "white flour", aliasType: "common_name" },
      { alias: "all-purpose flour", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "wholemeal-flour", name: "Wholemeal Flour", category: "Grains", subcategory: "Flours",
      description: "Wheat flour milled from the whole grain, retaining the bran and germ; the wholemeal counterpart of plain wheat flour.",
      knowledgeFoodSlug: null, diversityGroupSlug: "wheat", family: null,
    },
    aliases: [
      { alias: "wholewheat flour", aliasType: "common_name" },
      { alias: "whole wheat flour", aliasType: "common_name" },
      { alias: "wholemeal wheat flour", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "oat-flour", name: "Oat Flour", category: "Grains", subcategory: "Flours",
      description: "Flour milled from whole oats; naturally gluten-free when processed separately from wheat.",
      knowledgeFoodSlug: null, diversityGroupSlug: "oats", family: null,
    },
  },
  {
    food: {
      slug: "buckwheat-flour", name: "Buckwheat Flour", category: "Grains", subcategory: "Flours",
      description: "Flour milled from buckwheat groats; naturally gluten-free, earthy, and the base of galettes and soba.",
      knowledgeFoodSlug: null, diversityGroupSlug: "buckwheat", family: null,
    },
  },
  {
    food: {
      slug: "rye-flour", name: "Rye Flour", category: "Grains", subcategory: "Flours",
      description: "Flour milled from rye grain; dense, dark and high in fibre, and the base of sourdough rye breads.",
      knowledgeFoodSlug: null, diversityGroupSlug: "rye", family: null,
    },
  },
  {
    food: {
      slug: "couscous", name: "Couscous", category: "Grains", subcategory: "Wheat products",
      description: "Tiny steamed granules of refined durum wheat semolina that cook quickly; a staple of North African and Middle Eastern cooking.",
      knowledgeFoodSlug: "couscous", diversityGroupSlug: "wheat", family: null,
    },
    aliases: [
      // "wholewheat couscous" REMOVED — whole-vs-refined is a fact-owning split here as
      // everywhere (brown-rice ≠ white-rice). "giant couscous" / "Israeli couscous" REMOVED
      // (NK6Q §2.4 resolver mis-target): giant couscous IS pearl couscous, a different
      // pasta-like grain, not a form of this one.
      { alias: "cous cous", aliasType: "misspelling" },
    ],
  },
  {
    food: {
      slug: "wholewheat-couscous", name: "Wholewheat Couscous", category: "Grains", subcategory: "Wheat products",
      description: "Couscous rolled from wholegrain durum wheat, retaining the bran; higher in fibre than refined couscous.",
      knowledgeFoodSlug: null, diversityGroupSlug: "wheat", family: null,
    },
    aliases: [
      { alias: "wholemeal couscous", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "pearl-couscous", name: "Pearl Couscous", category: "Grains", subcategory: "Wheat products",
      description: "Larger, toasted spheres of wheat dough, chewier than couscous and cooked like pasta.",
      knowledgeFoodSlug: null, diversityGroupSlug: "wheat", family: null,
    },
    aliases: [
      // NK6Q §2.4 — these named the wrong food while `pearl-couscous` already existed.
      { alias: "giant couscous", aliasType: "common_name" },
      { alias: "Israeli couscous", aliasType: "common_name" },
      { alias: "mograbiah", aliasType: "common_name" },
      { alias: "ptitim", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "bulgur-wheat", name: "Bulgur Wheat", category: "Grains", subcategory: "Wheat products",
      description: "Pre-cooked cracked wheat with a nutty flavour, high in fibre; used in tabbouleh and pilafs.",
      knowledgeFoodSlug: "bulgur-wheat", diversityGroupSlug: "wheat",
    },
    aliases: [
      { alias: "bulgur", aliasType: "common_name" },
      { alias: "bulgar wheat", aliasType: "misspelling" },
      { alias: "cracked wheat", aliasType: "common_name" },
    ],
  },
  // ── Pasta (NK6R Amendment 3, refined by NK6S) ───────────────────────────────
  // TYPE and SHAPE are different axes and were previously conflated: the old
  // `pasta` entry aliased six SHAPES (spaghetti, penne, …) as forms of a single
  // wheat identity, leaving nowhere for a chickpea or lentil pasta to live.
  //   • TYPE (wheat, wholewheat, chickpea, lentil, pea) = what it is made FROM.
  //     Types disagree on fibre, protein and plant group, so each is its own
  //     canonical identity under the `pasta` parent.
  //   • SHAPE (penne, fusilli, spaghetti, tagliatelle, …) = a physical format.
  //     `form_policy`: format is never an identity. Shapes stay FORM ALIASES of
  //     the type they are made from.
  //   • NK6S — spinach pasta is NOT a sixth type. It is durum wheat dough with
  //     spinach folded in for colour: same grain, same plant, same fibre and
  //     protein class. It is a VARIETY of `wheat-pasta` — a named sub-kind that
  //     shares its parent's diversity group — exactly as `mature-cheddar` is a
  //     variety of `cheddar`. Chickpea, lentil and pea pasta remain separate
  //     TYPES, because each of those changes the plant.
  {
    food: {
      slug: "pasta", name: "Pasta", category: "Grains", subcategory: "Pasta",
      description: "A shaped, dried or fresh dough staple. The parent identity behind the pasta types; what a pasta is made from — wheat, wholewheat, chickpea, lentil, pea — decides its fibre, protein and plant group.",
      // No single Knowledge Registry food and no single plant: the TYPES own the
      // facts and the diversity group (cf. `mushroom` above). An unqualified
      // "pasta" is type-unknown, so it must not claim a plant it may not contain.
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: null,
    },
    aliases: [
      { alias: "pastas", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "wheat-pasta", name: "Wheat Pasta", category: "Grains", subcategory: "Pasta",
      description: "The default UK pasta: durum wheat semolina dough, sold dried in every shape.",
      knowledgeFoodSlug: "pasta", diversityGroupSlug: "wheat", family: "pasta",
    },
    varieties: [
      // NK6S — spinach pasta is wheat pasta coloured with spinach. A variety shares
      // its parent's diversity group, so this counts WHEAT and never a spinach
      // portion (one food = one plant), which is the same answer NK6R gave it as a
      // standalone identity — reached now without minting a second fact owner.
      { slug: "spinach-pasta", name: "Spinach Pasta", description: "Durum wheat dough coloured and lightly flavoured with spinach; sold as tagliatelle, lasagne sheets and fresh sheets.", displayOrder: 0 },
    ],
    aliases: [
      { alias: "white pasta", aliasType: "common_name" },
      { alias: "durum wheat pasta", aliasType: "common_name" },
      { alias: "plain pasta", aliasType: "common_name" },
      // SHAPES — forms of this type, never identities of their own (NK6Q batch 023).
      { alias: "spaghetti", aliasType: "form" },
      { alias: "penne", aliasType: "form" },
      { alias: "fusilli", aliasType: "form" },
      { alias: "tagliatelle", aliasType: "form" },
      { alias: "rigatoni", aliasType: "form" },
      { alias: "macaroni", aliasType: "form" },
      { alias: "linguine", aliasType: "form" },
      { alias: "fettuccine", aliasType: "form" },
      { alias: "farfalle", aliasType: "form" },
      { alias: "conchiglie", aliasType: "form" },
      { alias: "orzo", aliasType: "form" },
      { alias: "lasagne sheets", aliasType: "form" },
      // NK6S — inherited from the retired `spinach-pasta` identity. An alias resolves
      // to the FOOD, not the variety, so these reach `wheat-pasta` directly; the
      // "spinach pasta" string itself reaches the variety via its name/slug.
      { alias: "pasta verde", aliasType: "common_name" },
      { alias: "spinach tagliatelle", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "wholewheat-pasta", name: "Wholewheat Pasta", category: "Grains", subcategory: "Pasta",
      description: "Pasta made from wholegrain wheat flour, retaining the bran and germ; substantially higher in fibre than white pasta.",
      // Was a food_variety of `pasta`. Promoted to an identity: whole-vs-refined is
      // a fact-owning distinction across this platform (brown-rice ≠ white-rice).
      knowledgeFoodSlug: null, diversityGroupSlug: "wheat", family: "pasta",
    },
    aliases: [
      { alias: "wholemeal pasta", aliasType: "common_name" },
      { alias: "whole wheat pasta", aliasType: "common_name" },
      { alias: "brown pasta", aliasType: "common_name" },
      // Shapes of THIS type — the grain class differs, not the shape (NK6Q batch 023).
      { alias: "wholewheat spaghetti", aliasType: "form" },
      { alias: "wholemeal spaghetti", aliasType: "form" },
      { alias: "wholewheat penne", aliasType: "form" },
      { alias: "wholemeal penne", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "chickpea-pasta", name: "Chickpea Pasta", category: "Grains", subcategory: "Pasta",
      description: "Pasta made from chickpea flour; higher in plant protein and fibre than wheat pasta, and naturally gluten-free.",
      knowledgeFoodSlug: null, diversityGroupSlug: "chickpeas", family: "pasta",
    },
    aliases: [
      { alias: "chickpea penne", aliasType: "form" },
      { alias: "chickpea fusilli", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "lentil-pasta", name: "Lentil Pasta", category: "Grains", subcategory: "Pasta",
      description: "Pasta made from lentil flour; higher in plant protein and fibre than wheat pasta, and naturally gluten-free.",
      knowledgeFoodSlug: null, diversityGroupSlug: "lentils", family: "pasta",
    },
    aliases: [
      { alias: "red lentil pasta", aliasType: "form" },
      { alias: "green lentil pasta", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "pea-pasta", name: "Pea Pasta", category: "Grains", subcategory: "Pasta",
      description: "Pasta made from yellow or green pea flour; a naturally gluten-free, higher-protein alternative to wheat pasta.",
      knowledgeFoodSlug: null, diversityGroupSlug: "peas", family: "pasta",
    },
    aliases: [
      { alias: "green pea pasta", aliasType: "form" },
      { alias: "yellow pea pasta", aliasType: "form" },
    ],
  },
  // NK6S — `spinach-pasta` was an identity here (NK6R). It is now a VARIETY of
  // `wheat-pasta` above: the spinach colours the dough, it does not change the
  // grain, the plant or the nutrient class, so it owns no facts of its own.
  {
    food: {
      slug: "millet", name: "Millet", category: "Grains", subcategory: "Whole grains",
      description: "A small gluten-free grain supplying magnesium, iron and fibre, with a mild, slightly sweet flavour.",
      knowledgeFoodSlug: "millet", diversityGroupSlug: "millet",
    },
    aliases: [
      { alias: "millet flakes", aliasType: "form" },
      { alias: "millet flour", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "freekeh", name: "Freekeh", category: "Grains", subcategory: "Wheat products",
      description: "Roasted green durum wheat with a smoky, nutty flavour and high fibre and iron content.",
      knowledgeFoodSlug: "freekeh", diversityGroupSlug: "wheat",
    },
    aliases: [
      { alias: "freekah", aliasType: "misspelling" },
      { alias: "farik", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Other Pantry Staples ═══════════════════════════════

  {
    food: {
      slug: "coconut", name: "Coconut", category: "Healthy fats", subcategory: "Tropical nuts",
      description: "A tropical drupe with fibre-rich flesh; desiccated coconut, coconut milk and coconut cream are all pressed or dried from that flesh.",
      knowledgeFoodSlug: "coconut", diversityGroupSlug: "coconut", family: null,
    },
    aliases: [
      // "coconut water" REMOVED (NK6Q batch 014) — the clear liquid endosperm is a different
      // food from the flesh: electrolytes and sugars, essentially no fat.
      { alias: "desiccated coconut", aliasType: "form" },
      { alias: "coconut milk", aliasType: "form" },
      { alias: "coconut cream", aliasType: "form" },
      { alias: "coconut flakes", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "coconut-water", name: "Coconut Water", category: "Beverages", subcategory: "Plant waters",
      description: "The clear liquid inside a young green coconut; lightly sweet and a source of potassium, with almost none of the fat of the flesh.",
      // NK6S — category was the ad-hoc one-member "Drinks" NK6R minted; the domain is
      // now the real `Beverages`, and this food has a real parent to sit under.
      knowledgeFoodSlug: null, diversityGroupSlug: "coconut", family: "plant-water",
    },
    aliases: [
      { alias: "coconut juice", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "dates", name: "Dates", category: "Fruit", subcategory: "Dried fruit",
      description: "A naturally sweet dried fruit rich in fibre, potassium and iron from the date palm.",
      knowledgeFoodSlug: "dates", diversityGroupSlug: "dates",
    },
    aliases: [
      { alias: "medjool dates", aliasType: "form" },
      { alias: "dried dates", aliasType: "form" },
      { alias: "deglet nour", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "dark-chocolate", name: "Dark Chocolate", category: "Healthy fats", subcategory: "Cacao",
      description: "Dark chocolate from 70%+ cocoa content is rich in polyphenols, magnesium and iron from the cacao plant.",
      knowledgeFoodSlug: "dark-chocolate", diversityGroupSlug: "dark-chocolate", family: null,
    },
    aliases: [
      // "cocoa" / "cacao" / "cocoa powder" REMOVED (NK6Q §2.4 resolver mis-target). Cocoa
      // powder is DEFATTED cocoa solids — it is not chocolate, which is cocoa solids plus
      // cocoa butter plus sugar. They belong to `cacao-powder` below.
      { alias: "dark choc", aliasType: "form" },
      { alias: "70% chocolate", aliasType: "form" },
      { alias: "85% chocolate", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cacao-powder", name: "Cacao Powder", category: "Healthy fats", subcategory: "Cacao",
      description: "Cocoa solids with most of the cocoa butter pressed out, then milled to a powder; intensely bitter, and rich in polyphenols, magnesium and iron.",
      // NK6Q §2.4 — `cocoa-powder` is a synonym of this identity, NOT of `dark-chocolate`.
      // Raw cacao vs roasted cocoa is a processing note, not a second identity.
      knowledgeFoodSlug: null, diversityGroupSlug: "dark-chocolate", family: null,
    },
    aliases: [
      { alias: "cocoa powder", aliasType: "common_name" },
      { alias: "cocoa", aliasType: "common_name" },
      { alias: "cacao", aliasType: "common_name" },
      { alias: "raw cacao powder", aliasType: "form" },
      { alias: "unsweetened cocoa powder", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "butter", name: "Butter", category: "Dairy", subcategory: "Dairy fats",
      description: "A dairy fat made from churned cream, supplying fat-soluble vitamins A and D.",
      knowledgeFoodSlug: "butter", diversityGroupSlug: null, family: null,
    },
    aliases: [
      // "ghee" / "clarified butter" REMOVED (NK6Q batch 012). Removing the water and milk
      // solids changes the food: no lactose or casein, and a far higher smoke point. Salt
      // and shape below really are formats of butter; clarifying is not.
      { alias: "unsalted butter", aliasType: "form" },
      { alias: "salted butter", aliasType: "form" },
      { alias: "block butter", aliasType: "form" },
      { alias: "spreadable butter", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "ghee", name: "Ghee", category: "Dairy", subcategory: "Dairy fats",
      description: "Butter simmered until the water evaporates and the milk solids brown and are strained out; nutty, lactose- and casein-free, with a high smoke point.",
      // NK6Q batch 012 ruled `ghee` and `clarified-butter` ONE identity, distinct from
      // butter. Ghee is cooked longer than plain clarified butter; the drafts describe the
      // same pantry product, so `clarified butter` is recorded here as an alias, not a
      // second slug (GOV2 Rule 7).
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: null,
    },
    aliases: [
      { alias: "clarified butter", aliasType: "common_name" },
      { alias: "desi ghee", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "sunflower-oil", name: "Sunflower Oil", category: "Healthy fats", subcategory: "Oils",
      description: "A light, neutral oil supplying vitamin E and unsaturated fats, widely used for cooking and baking.",
      knowledgeFoodSlug: "sunflower-oil", diversityGroupSlug: "sunflower-oil",
    },
    aliases: [
      { alias: "sunflower cooking oil", aliasType: "form" },
      { alias: "vegetable oil", aliasType: "form" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // WS0X.8 — Food Intelligence Data Expansion (H1 batch promotion)
  // 68 new canonical foods promoted from WS0X.2 H1 knowledge batch.
  // All context pre-staged in food-context.ts; no changes to food-context.ts needed.
  // ══════════════════════════════════════════════════════════════════════════════

  // ════════════════════════ Fish & Seafood ═════════════════════════════════════

  {
    food: {
      slug: "pollock", name: "Pollock", category: "Proteins", subcategory: "White fish",
      description: "A lean white fish widely used in UK fish and chips and fish fingers; a good source of protein, iodine and B vitamins.",
      knowledgeFoodSlug: "pollock", diversityGroupSlug: null,
    },
    aliases: [
      // NK6Q batch 015 — coley/saithe is biologically a distinct Pollachius species, but is
      // sold and cooked interchangeably as the same near-identical white fish. Market synonym.
      { alias: "pollack", aliasType: "common_name" },
      { alias: "coley", aliasType: "common_name" },
      { alias: "saithe", aliasType: "common_name" },
      { alias: "coalfish", aliasType: "common_name" },
      { alias: "Alaska pollock", aliasType: "common_name" },
      { alias: "pollock fillet", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "tilapia", name: "Tilapia", category: "Proteins", subcategory: "White fish",
      description: "A mild, firm white fish farmed widely and available fresh or frozen in UK supermarkets; a lean source of protein and selenium.",
      knowledgeFoodSlug: "tilapia", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "tilapia fillet", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "sea-bass", name: "Sea Bass", category: "Proteins", subcategory: "White fish",
      description: "A popular white fish with delicate, flaky flesh; rich in protein and selenium, widely available at UK fish counters.",
      knowledgeFoodSlug: "sea-bass", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "seabass", aliasType: "common_name" },
      { alias: "European sea bass", aliasType: "common_name" },
      { alias: "branzino", aliasType: "common_name" },
      { alias: "sea bass fillet", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "sea-bream", name: "Sea Bream", category: "Proteins", subcategory: "White fish",
      description: "A sweet, mild white fish popular in Mediterranean cooking and widely sold in UK supermarkets; a lean source of protein and iodine.",
      knowledgeFoodSlug: "sea-bream", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "seabream", aliasType: "common_name" },
      { alias: "gilt-head bream", aliasType: "common_name" },
      { alias: "dorade", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "squid", name: "Squid", category: "Proteins", subcategory: "Seafood",
      description: "A lean, firm-textured cephalopod (Loligo) widely available fresh, frozen or as rings; rich in protein and selenium.",
      knowledgeFoodSlug: "squid", diversityGroupSlug: null, family: null,
    },
    aliases: [
      // "cuttlefish" REMOVED (NK6Q batch 016) — a different animal (Sepia), not a squid.
      // "calamari" STAYS: it is genuinely the culinary name for squid.
      { alias: "calamari", aliasType: "common_name" },
      { alias: "squid rings", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cuttlefish", name: "Cuttlefish", category: "Proteins", subcategory: "Seafood",
      description: "A cephalopod (Sepia) with a broader body and thicker flesh than squid; meatier, and the source of culinary squid ink.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: null,
    },
    aliases: [
      { alias: "seppia", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "mussels", name: "Mussels", category: "Proteins", subcategory: "Seafood",
      description: "A sustainable shellfish farmed widely around the British Isles; rich in protein, iron and omega-3 fats.",
      knowledgeFoodSlug: "mussels", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "mussel", aliasType: "singular" },
      { alias: "blue mussels", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "crab", name: "Crab", category: "Proteins", subcategory: "Seafood",
      description: "A shellfish widely caught around UK coasts; a rich source of protein, selenium and vitamin B12.",
      knowledgeFoodSlug: "crab", diversityGroupSlug: null, family: null,
    },
    varieties: [
      // NK6Q batch 016 — the common edible crab, promoted from a plain alias to a VARIETY.
      // Note "brown crab MEAT" is a different thing (a cut/format), not this variety.
      { slug: "brown-crab", name: "Brown Crab", description: "The common edible crab (Cancer pagurus).", displayOrder: 0 },
    ],
    aliases: [
      { alias: "crab meat", aliasType: "form" },
      { alias: "dressed crab", aliasType: "form" },
      { alias: "tinned crab", aliasType: "form" },
      { alias: "white crab meat", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "scallops", name: "Scallops", category: "Proteins", subcategory: "Seafood",
      description: "A sweet, delicately flavoured shellfish caught around UK coasts; a lean source of protein and zinc.",
      knowledgeFoodSlug: "scallops", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "scallop", aliasType: "singular" },
      { alias: "king scallops", aliasType: "form" },
      { alias: "queen scallops", aliasType: "form" },
    ],
  },

  // ════════════════════════ Meat ═══════════════════════════════════════════════

  {
    food: {
      slug: "venison", name: "Venison", category: "Proteins", subcategory: "Game",
      description: "A lean, richly flavoured red meat from deer; a good source of iron and vitamin B12, lower in fat than beef.",
      knowledgeFoodSlug: "venison", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "deer meat", aliasType: "common_name" },
      { alias: "venison steak", aliasType: "form" },
      { alias: "venison mince", aliasType: "form" },
      { alias: "venison haunch", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "liver", name: "Liver", category: "Proteins", subcategory: "Offal",
      description: "An organ meat exceptionally rich in iron, vitamin B12, folate and vitamin A. The coarse identity for liver whose species is not known; the species livers differ materially and own their own facts.",
      knowledgeFoodSlug: "liver", diversityGroupSlug: null, family: null,
    },
    aliases: [
      // NK6Q §2.1 — every species-specific string REMOVED. This alias set is why
      // beef/chicken/lamb liver hard-blocked as merges, while `pork-liver` and
      // `calves-liver` were minted as their own identities in the same run. Species
      // livers differ materially on vitamin A, copper and iron. `liver` stays as the
      // coarse fallback only.
      { alias: "livers", aliasType: "plural" },
    ],
  },
  // NK6R — species livers (NK6Q batches 017/019), consistent with the already-minted
  // `pork-liver` and `calves-liver`. Editorial nutrition arrives with the deferred import.
  {
    food: {
      slug: "beef-liver", name: "Beef Liver", category: "Proteins", subcategory: "Offal",
      description: "The liver of cattle; the richest common source of vitamin A and copper among the species livers, with a strong, mineral flavour.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "liver",
    },
    aliases: [
      { alias: "ox liver", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "chicken-liver", name: "Chicken Liver", category: "Proteins", subcategory: "Offal",
      description: "The liver of chickens; milder and more delicate than the red-meat livers, and the base of pâté and parfait.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "liver",
    },
    aliases: [
      { alias: "chicken livers", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "lamb-liver", name: "Lamb's Liver", category: "Proteins", subcategory: "Offal",
      description: "The liver of lambs; softer and milder than beef liver, and the usual UK butcher's liver.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "liver",
    },
    aliases: [
      // The slug itself already keys "lamb liver"; these cover the possessive spellings.
      { alias: "lambs liver", aliasType: "common_name" },
      { alias: "sheep's liver", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Vegetables ═════════════════════════════════════════

  {
    food: {
      slug: "okra", name: "Okra", category: "Vegetables", subcategory: "Pods",
      description: "A green pod vegetable widely used in South Asian, West African and Caribbean cooking; a source of fibre, folate and vitamin C.",
      knowledgeFoodSlug: "okra", diversityGroupSlug: "okra",
    },
    aliases: [
      { alias: "lady's fingers", aliasType: "common_name" },
      { alias: "bhindi", aliasType: "common_name" },
      { alias: "bamia", aliasType: "common_name" },
      { alias: "gumbo", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "runner-beans", name: "Runner Beans", category: "Vegetables", subcategory: "Pods and beans",
      description: "A quintessential British summer vegetable with long flat pods; a source of fibre, folate and vitamin C.",
      knowledgeFoodSlug: "runner-beans", diversityGroupSlug: "runner-beans",
    },
    aliases: [
      { alias: "runner bean", aliasType: "singular" },
      { alias: "flat beans", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "spring-greens", name: "Spring Greens", category: "Vegetables", subcategory: "Brassicas",
      description: "Loose-leaf cabbage harvested young in early spring, with a mild, sweet flavour; rich in vitamin K, folate and vitamin C.",
      knowledgeFoodSlug: "spring-greens", diversityGroupSlug: "spring-greens",
    },
    aliases: [
      { alias: "spring green", aliasType: "singular" },
      { alias: "spring cabbage", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "water-chestnuts", name: "Water Chestnuts", category: "Vegetables", subcategory: "Root and tuber",
      description: "A crunchy, white-fleshed aquatic tuber widely used in Asian cooking; sold tinned in UK supermarkets and retains crunch when cooked.",
      knowledgeFoodSlug: "water-chestnuts", diversityGroupSlug: "water-chestnuts",
    },
    aliases: [
      { alias: "water chestnut", aliasType: "singular" },
      { alias: "Chinese water chestnuts", aliasType: "common_name" },
      { alias: "tinned water chestnuts", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "bean-sprouts", name: "Bean Sprouts", category: "Vegetables", subcategory: "Sprouted",
      description: "Sprouted mung beans with a crisp texture widely used in Asian cooking and stir-fries; a source of vitamin C.",
      knowledgeFoodSlug: "bean-sprouts", diversityGroupSlug: "bean-sprouts",
    },
    aliases: [
      { alias: "beansprouts", aliasType: "common_name" },
      { alias: "mung bean sprouts", aliasType: "common_name" },
      { alias: "bean shoots", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "bamboo-shoots", name: "Bamboo Shoots", category: "Vegetables", subcategory: "Other vegetables",
      description: "Young shoots of bamboo plants, crisp and mild; sold tinned in UK supermarkets and widely used in East and South-East Asian cooking.",
      knowledgeFoodSlug: "bamboo-shoots", diversityGroupSlug: "bamboo-shoots",
    },
    aliases: [
      { alias: "bamboo shoot", aliasType: "singular" },
      { alias: "tinned bamboo shoots", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cassava", name: "Cassava", category: "Vegetables", subcategory: "Root and tuber",
      description: "A starchy root vegetable native to South America, widely eaten across Africa, the Caribbean and Latin America; available in many UK supermarkets.",
      knowledgeFoodSlug: "cassava", diversityGroupSlug: "cassava",
    },
    aliases: [
      { alias: "yuca", aliasType: "common_name" },
      { alias: "manioc", aliasType: "common_name" },
      { alias: "tapioca root", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "broccoli-raab", name: "Broccoli Raab", category: "Vegetables", subcategory: "Brassicas",
      description: "An Italian brassica with pleasantly bitter florets, stems and leaves; rich in folate, vitamin K and vitamin C.",
      knowledgeFoodSlug: "broccoli-raab", diversityGroupSlug: "broccoli-raab",
    },
    aliases: [
      { alias: "rapini", aliasType: "common_name" },
      { alias: "broccoli rabe", aliasType: "common_name" },
      { alias: "cime di rapa", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "mustard-greens", name: "Mustard Greens", category: "Vegetables", subcategory: "Leafy greens",
      description: "Peppery, slightly bitter leafy greens widely used in South Asian cooking; a source of folate, vitamin K and vitamin C.",
      knowledgeFoodSlug: "mustard-greens", diversityGroupSlug: "mustard-greens",
    },
    aliases: [
      { alias: "mustard leaves", aliasType: "common_name" },
      { alias: "Indian mustard", aliasType: "common_name" },
      { alias: "sarson ka saag", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Fruit ══════════════════════════════════════════════

  {
    food: {
      slug: "jackfruit", name: "Jackfruit", category: "Fruit", subcategory: "Tropical fruit",
      description: "A large tropical fruit with a meaty, fibrous texture when unripe; popular as a plant-based alternative in curries, widely sold tinned in UK supermarkets.",
      knowledgeFoodSlug: "jackfruit", diversityGroupSlug: "jackfruit",
    },
    aliases: [
      { alias: "young jackfruit", aliasType: "form" },
      { alias: "green jackfruit", aliasType: "form" },
      { alias: "tinned jackfruit", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "elderberries", name: "Elderberries", category: "Fruit", subcategory: "Berries",
      description: "Small, dark purple berries from the elder tree common in UK hedgerows, used to make cordials and jams; must be cooked before eating.",
      knowledgeFoodSlug: "elderberries", diversityGroupSlug: "elderberry",
    },
    aliases: [
      { alias: "elderberry", aliasType: "singular" },
    ],
  },
  {
    food: {
      slug: "goji-berries", name: "Goji Berries", category: "Fruit", subcategory: "Berries",
      description: "Small, dried red berries from Central Asia, widely sold in UK supermarkets' health food sections; a source of vitamin C and iron.",
      knowledgeFoodSlug: "goji-berries", diversityGroupSlug: "goji-berry",
    },
    aliases: [
      { alias: "goji berry", aliasType: "singular" },
      { alias: "wolfberries", aliasType: "common_name" },
      { alias: "wolfberry", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "lychees", name: "Lychees", category: "Fruit", subcategory: "Tropical fruit",
      description: "A sweet, fragrant tropical fruit with white, juicy flesh; widely sold fresh and tinned in UK supermarkets.",
      knowledgeFoodSlug: "lychees", diversityGroupSlug: "lychee",
    },
    aliases: [
      { alias: "lychee", aliasType: "singular" },
      { alias: "litchi", aliasType: "common_name" },
      { alias: "tinned lychees", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "papayas", name: "Papaya", category: "Fruit", subcategory: "Tropical fruit",
      description: "A soft, orange-fleshed tropical fruit with a sweet flavour and the digestive enzyme papain; sold ripe and green in UK supermarkets.",
      knowledgeFoodSlug: "papayas", diversityGroupSlug: "papaya",
    },
    aliases: [
      { alias: "pawpaw", aliasType: "common_name" },
      { alias: "papaw", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "mulberries", name: "Mulberries", category: "Fruit", subcategory: "Berries",
      description: "Soft, dark berries from mulberry trees, rich in vitamin C, anthocyanins and iron; grown in UK gardens in season.",
      knowledgeFoodSlug: "mulberries", diversityGroupSlug: "mulberry",
    },
    aliases: [
      { alias: "mulberry", aliasType: "singular" },
      { alias: "black mulberry", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "loganberries", name: "Loganberries", category: "Fruit", subcategory: "Berries",
      description: "A large, dark red berry — a natural cross between a blackberry and raspberry — commonly grown in UK gardens and sold at farm shops.",
      knowledgeFoodSlug: "loganberries", diversityGroupSlug: "loganberry",
    },
    aliases: [
      { alias: "loganberry", aliasType: "singular" },
    ],
  },
  {
    food: {
      slug: "guava", name: "Guava", category: "Fruit", subcategory: "Tropical fruit",
      description: "A tropical fruit with sweet, pink or white flesh and a distinctive floral aroma; exceptionally high in vitamin C and increasingly available in UK supermarkets.",
      knowledgeFoodSlug: "guava", diversityGroupSlug: "guava",
    },
    aliases: [
      { alias: "guavas", aliasType: "plural" },
      { alias: "pink guava", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "plantain", name: "Plantain", category: "Fruit", subcategory: "Tropical fruit",
      description: "A starchy, banana-like fruit cooked as a vegetable or side dish; widely available in UK African and Caribbean food stores and many supermarkets.",
      knowledgeFoodSlug: "plantain", diversityGroupSlug: "plantain",
    },
    aliases: [
      { alias: "plantains", aliasType: "plural" },
      { alias: "green plantain", aliasType: "form" },
      { alias: "ripe plantain", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "physalis", name: "Physalis", category: "Fruit", subcategory: "Berries",
      description: "A small orange berry encased in a papery husk; sold in UK supermarkets as a garnish and sweet snack, a source of vitamin C.",
      knowledgeFoodSlug: "physalis", diversityGroupSlug: "physalis",
    },
    aliases: [
      { alias: "cape gooseberry", aliasType: "common_name" },
      { alias: "goldenberry", aliasType: "common_name" },
      { alias: "ground cherry", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Grains ══════════════════════════════════════════════

  {
    food: {
      slug: "sorghum", name: "Sorghum", category: "Grains", subcategory: "Ancient grains",
      description: "An ancient gluten-free grain originating in Africa; a source of fibre, iron and B vitamins, available in UK health food stores.",
      knowledgeFoodSlug: "sorghum", diversityGroupSlug: "sorghum",
    },
    aliases: [
      { alias: "jowar", aliasType: "common_name" },
      { alias: "grain sorghum", aliasType: "common_name" },
      { alias: "sorghum grain", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "amaranth", name: "Amaranth", category: "Grains", subcategory: "Ancient grains",
      description: "A gluten-free pseudo-cereal and one of few plant foods containing all essential amino acids; available in UK health food stores.",
      knowledgeFoodSlug: "amaranth", diversityGroupSlug: "amaranth",
    },
    aliases: [
      { alias: "amaranth grain", aliasType: "form" },
      { alias: "popped amaranth", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "farro", name: "Farro", category: "Grains", subcategory: "Ancient grains",
      description: "An ancient wheat grain from the Mediterranean with a nutty flavour and chewy texture; available in UK supermarkets including Waitrose and M&S.",
      knowledgeFoodSlug: "farro", diversityGroupSlug: "farro",
    },
    aliases: [
      { alias: "emmer wheat", aliasType: "common_name" },
      { alias: "pearled farro", aliasType: "form" },
      { alias: "farro perlato", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "semolina", name: "Semolina", category: "Grains", subcategory: "Processed grains",
      description: "Coarsely ground durum wheat used for semolina pudding, pasta-making and coatings; a source of fibre and B vitamins.",
      knowledgeFoodSlug: "semolina", diversityGroupSlug: "wheat",
    },
    aliases: [
      { alias: "durum semolina", aliasType: "form" },
      { alias: "coarse semolina", aliasType: "form" },
      { alias: "fine semolina", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "black-rice", name: "Black Rice", category: "Grains", subcategory: "Rice varieties",
      description: "A richly coloured wholegrain rice with a deep purple-black hue when cooked; the colour comes from anthocyanins, the same pigments found in blueberries.",
      knowledgeFoodSlug: "black-rice", diversityGroupSlug: "rice",
    },
    aliases: [
      { alias: "forbidden rice", aliasType: "common_name" },
      { alias: "purple rice", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "polenta", name: "Polenta", category: "Grains", subcategory: "Processed grains",
      description: "Ground dried maize widely used in Italian cooking; can be cooked soft or set and grilled, available in all UK supermarkets.",
      knowledgeFoodSlug: "polenta", diversityGroupSlug: "corn",
    },
    aliases: [
      { alias: "cornmeal", aliasType: "common_name" },
      { alias: "corn grits", aliasType: "common_name" },
      { alias: "instant polenta", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "teff", name: "Teff", category: "Grains", subcategory: "Ancient grains",
      description: "A tiny ancient grain from Ethiopia, the basis for injera flatbread; naturally gluten-free and a good source of iron and calcium.",
      knowledgeFoodSlug: "teff", diversityGroupSlug: "teff",
    },
    aliases: [
      { alias: "tef", aliasType: "common_name" },
      { alias: "teff flour", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "rice-flour", name: "Rice Flour", category: "Grains", subcategory: "Flours",
      description: "Finely ground rice used in gluten-free cooking and baking; a staple in East and South-East Asian cuisines, widely available in UK supermarkets.",
      knowledgeFoodSlug: "rice-flour", diversityGroupSlug: "rice",
    },
    aliases: [
      { alias: "white rice flour", aliasType: "form" },
      { alias: "brown rice flour", aliasType: "form" },
      { alias: "ground rice", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "barley-flour", name: "Barley Flour", category: "Grains", subcategory: "Flours",
      description: "Flour milled from barley grain with a slightly sweet, malty flavour; used in baking and as a thickener.",
      knowledgeFoodSlug: "barley-flour", diversityGroupSlug: "barley",
    },
    aliases: [
      { alias: "wholemeal barley flour", aliasType: "form" },
      { alias: "barley meal", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Legumes ═════════════════════════════════════════════

  {
    food: {
      slug: "pinto-beans", name: "Pinto Beans", category: "Legumes", subcategory: "Beans",
      description: "A speckled cream-and-tan bean popular in Mexican cooking; rich in plant protein and fibre, widely available dried or tinned in UK supermarkets.",
      knowledgeFoodSlug: "pinto-beans", diversityGroupSlug: "pinto-beans",
    },
    aliases: [
      { alias: "pinto bean", aliasType: "singular" },
      { alias: "speckled beans", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "black-eyed-peas", name: "Black-Eyed Peas", category: "Legumes", subcategory: "Beans",
      description: "Small cream-coloured beans with a distinctive black spot, widely used in African, Caribbean and American Southern cooking; available dried and tinned in UK supermarkets.",
      knowledgeFoodSlug: "black-eyed-peas", diversityGroupSlug: "black-eyed-peas",
    },
    aliases: [
      { alias: "black-eyed beans", aliasType: "common_name" },
      { alias: "black eyed beans", aliasType: "common_name" },
      { alias: "cowpeas", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "chickpea-flour", name: "Chickpea Flour", category: "Legumes", subcategory: "Flours",
      description: "A high-protein flour made from ground dried chickpeas, central to South Asian cooking for pakoras and flatbreads; widely available in UK supermarkets.",
      knowledgeFoodSlug: "chickpea-flour", diversityGroupSlug: "chickpeas",
    },
    aliases: [
      { alias: "gram flour", aliasType: "common_name" },
      { alias: "besan", aliasType: "common_name" },
      { alias: "garbanzo flour", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Dairy ═══════════════════════════════════════════════

  {
    food: {
      slug: "cottage-cheese", name: "Cottage Cheese", category: "Dairy", subcategory: "Fresh",
      description: "A mild, fresh cheese with a lumpy curd texture; a high-protein, lower-fat dairy food widely available in UK supermarkets.",
      knowledgeFoodSlug: "cottage-cheese", diversityGroupSlug: null, family: "fresh-cheese",
    },
    aliases: [
      { alias: "low-fat cottage cheese", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cream-cheese", name: "Cream Cheese", category: "Dairy", subcategory: "Soft",
      description: "A soft, creamy fresh cheese used in cooking, baking and as a spread; a UK kitchen staple available in all supermarkets.",
      knowledgeFoodSlug: "cream-cheese", diversityGroupSlug: null, family: "fresh-cheese",
    },
    aliases: [
      { alias: "full-fat cream cheese", aliasType: "form" },
      { alias: "soft cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "sour-cream", name: "Sour Cream", category: "Dairy", subcategory: "Cream",
      description: "Cream fermented with lactic acid bacteria, giving it a characteristic tangy flavour; widely used in cooking and as a topping.",
      knowledgeFoodSlug: "sour-cream", diversityGroupSlug: null, fermented: true,
    },
    aliases: [
      { alias: "soured cream", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "creme-fraiche", name: "Crème Fraîche", category: "Dairy", subcategory: "Cream",
      description: "A thick, rich cultured cream with a mild tang; a UK supermarket staple widely used in French and British cooking.",
      knowledgeFoodSlug: "creme-fraiche", diversityGroupSlug: null, fermented: true,
    },
    aliases: [
      { alias: "creme fraiche", aliasType: "misspelling" },
    ],
  },
  {
    food: {
      slug: "buttermilk", name: "Buttermilk", category: "Dairy", subcategory: "Dairy drinks",
      description: "A tangy liquid cultured from low-fat milk; used in baking to create light, tender textures in scones, pancakes and soda bread.",
      // NK6S — its own subcategory already declared it a dairy drink. Domain stays Dairy.
      knowledgeFoodSlug: "buttermilk", diversityGroupSlug: null, family: "dairy-beverage", fermented: true,
    },
    aliases: [
      { alias: "cultured buttermilk", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "blue-cheese", name: "Blue Cheese", category: "Dairy", subcategory: "Semi-hard",
      description: "The family of cheeses veined with blue or green mould; strongly flavoured, and the coarse identity for a blue cheese whose name is not known.",
      knowledgeFoodSlug: "blue-cheese", diversityGroupSlug: null, family: "cheese",
    },
    aliases: [
      // "gorgonzola" and "roquefort" REMOVED (NK6Q §2.2). This record's own description
      // used to name them — while `stilton` already had its own identity. Named PDO blue
      // cheeses differ on milk source, rules and ageing; they are CHILDREN of this family,
      // not synonyms of it. The greedy alias set is what hard-blocked their import.
      { alias: "blue-veined cheese", aliasType: "common_name" },
      { alias: "bleu cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "gouda", name: "Gouda", category: "Dairy", subcategory: "Semi-hard",
      description: "A semi-hard Dutch cheese with a smooth, slightly sweet flavour; a good source of calcium and protein, widely available in UK supermarkets.",
      knowledgeFoodSlug: "gouda", diversityGroupSlug: null, family: "pressed-cheese",
    },
    aliases: [
      { alias: "Dutch gouda", aliasType: "common_name" },
      { alias: "smoked gouda", aliasType: "form" },
      { alias: "aged gouda", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "brie", name: "Brie", category: "Dairy", subcategory: "Soft",
      description: "A soft French cheese with an edible white rind and creamy interior; a source of calcium, protein and B vitamins, widely available in UK supermarkets.",
      knowledgeFoodSlug: "brie", diversityGroupSlug: null, family: "bloomy-rind-cheese",
    },
    aliases: [
      { alias: "baked brie", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "camembert", name: "Camembert", category: "Dairy", subcategory: "Soft",
      description: "A soft, creamy French cheese with a white bloomy rind; famous for baking whole and serving with bread, widely available in UK supermarkets.",
      knowledgeFoodSlug: "camembert", diversityGroupSlug: null, family: "bloomy-rind-cheese",
    },
    aliases: [
      { alias: "baked camembert", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "stilton", name: "Stilton", category: "Dairy", subcategory: "Semi-hard",
      description: "A celebrated English blue cheese with PDO status, made in Derbyshire, Leicestershire and Nottinghamshire; rich and strongly flavoured.",
      knowledgeFoodSlug: "stilton", diversityGroupSlug: null, family: "blue-cheese",
    },
    aliases: [
      { alias: "Blue Stilton", aliasType: "common_name" },
      { alias: "White Stilton", aliasType: "common_name" },
    ],
  },
  // NK6R — identities NK6Q ruled `Separate canonical food`, unblocked by narrowing the
  // greedy alias sets above. `knowledgeFoodSlug: null` is an HONEST GAP, not an omission:
  // the editorial nutrition content lives in the batch-021/022 drafts and is bound when
  // the deferred governed import runs (NK6R §7). Minting the identity now is what stops
  // the resolver silently answering "Gorgonzola" with the wrong food.
  {
    food: {
      slug: "gorgonzola", name: "Gorgonzola", category: "Dairy", subcategory: "Soft",
      description: "An Italian PDO blue cheese made from cow's milk; sold young and mild (dolce) or aged and firm (piccante).",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "blue-cheese",
    },
    aliases: [
      { alias: "gorgonzola dolce", aliasType: "form" },
      { alias: "gorgonzola piccante", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "roquefort", name: "Roquefort", category: "Dairy", subcategory: "Soft",
      description: "A French PDO blue cheese made from sheep's milk and ripened in the caves of Roquefort-sur-Soulzon; sharp, salty and rich.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "blue-cheese",
    },
  },
  {
    food: {
      slug: "grana-padano", name: "Grana Padano", category: "Dairy", subcategory: "Hard",
      description: "An Italian PDO hard cheese from the Po valley; made under different rules and aged for less time than Parmigiano Reggiano, giving a milder, less granular result.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "cooked-pressed-cheese",
    },
  },
  {
    food: {
      slug: "buffalo-mozzarella", name: "Buffalo Mozzarella", category: "Dairy", subcategory: "Semi-soft",
      description: "An Italian PDO mozzarella made from water buffalo milk; softer, richer and higher in fat than the cow's-milk cheese.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "pasta-filata",
    },
    aliases: [
      { alias: "mozzarella di bufala", aliasType: "common_name" },
      { alias: "buffalo mozzarella cheese", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "goat-cheese", name: "Goat's Cheese", category: "Dairy", subcategory: "Soft",
      description: "A tangy, soft cheese made from goat's milk; lower in lactose than cow's milk cheese, widely available fresh or aged in UK supermarkets.",
      // Family reflects the dominant UK product (the fresh log / chèvre). Milk source is
      // an attribute of this identity, never a hierarchy level — `hard-goat-cheese` and
      // `goat-curd` (batch 022) will bind to `pressed-cheese` and `fresh-cheese` in turn.
      knowledgeFoodSlug: "goat-cheese", diversityGroupSlug: null, family: "fresh-cheese",
    },
    aliases: [
      { alias: "goat cheese", aliasType: "common_name" },
      { alias: "chevre", aliasType: "common_name" },
      { alias: "fresh goat's cheese", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "mascarpone", name: "Mascarpone", category: "Dairy", subcategory: "Soft",
      description: "A thick, rich Italian cream cheese used in tiramisu and as a cooking ingredient; available in all UK supermarkets.",
      knowledgeFoodSlug: "mascarpone", diversityGroupSlug: null, family: "fresh-cheese",
    },
    aliases: [
      { alias: "mascarpone cheese", aliasType: "form" },
      { alias: "Italian cream cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "double-cream", name: "Double Cream", category: "Dairy", subcategory: "Cream",
      description: "The thickest UK cream, around 48% fat; whips stiffly and will not split when boiled.",
      knowledgeFoodSlug: "double-cream", diversityGroupSlug: null, family: null,
    },
    aliases: [
      // "whipping cream" REMOVED (NK6Q batch 020) — a distinct grade at ~35% fat, consistent
      // with `single-cream` already being its own identity.
      { alias: "heavy cream", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "whipping-cream", name: "Whipping Cream", category: "Dairy", subcategory: "Cream",
      description: "A cream grade of around 35% fat — enough to whip to soft peaks, but lighter than double cream.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: null,
    },
  },

  // ════════════════════════ Nuts & Seeds ════════════════════════════════════════

  {
    food: {
      slug: "almond-butter", name: "Almond Butter", category: "Healthy fats", subcategory: "Nut butters",
      description: "A spread made from ground almonds; a source of vitamin E, healthy fats and plant protein, widely available in UK supermarkets.",
      knowledgeFoodSlug: "almond-butter", diversityGroupSlug: "almonds",
    },
    aliases: [
      { alias: "smooth almond butter", aliasType: "form" },
      { alias: "crunchy almond butter", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "tahini", name: "Tahini", category: "Healthy fats", subcategory: "Nut butters",
      description: "A smooth paste made from ground sesame seeds; central to Middle Eastern cooking in hummus and dressings, widely available in UK supermarkets.",
      knowledgeFoodSlug: "tahini", diversityGroupSlug: "sesame-seeds",
    },
    aliases: [
      { alias: "tahini paste", aliasType: "form" },
      { alias: "tahina", aliasType: "common_name" },
      { alias: "sesame paste", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "nigella-seeds", name: "Nigella Seeds", category: "Seeds", subcategory: "Whole seeds",
      description: "Tiny black seeds with a peppery, slightly bitter flavour; widely used in South Asian and Middle Eastern cooking, available in most UK supermarkets.",
      knowledgeFoodSlug: "nigella-seeds", diversityGroupSlug: "nigella-seeds",
    },
    aliases: [
      { alias: "nigella seed", aliasType: "singular" },
      { alias: "black seed", aliasType: "common_name" },
      { alias: "black cumin", aliasType: "common_name" },
      { alias: "kalonji", aliasType: "common_name" },
      { alias: "black onion seeds", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Herbs ═══════════════════════════════════════════════

  {
    food: {
      slug: "marjoram", name: "Marjoram", category: "Herbs", subcategory: "Woody herbs",
      description: "A fragrant Mediterranean herb closely related to oregano but sweeter and more delicate; available fresh and dried in UK supermarkets.",
      knowledgeFoodSlug: "marjoram", diversityGroupSlug: "marjoram",
    },
    aliases: [
      { alias: "sweet marjoram", aliasType: "common_name" },
      { alias: "dried marjoram", aliasType: "form" },
      { alias: "fresh marjoram", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "chervil", name: "Chervil", category: "Herbs", subcategory: "Delicate herbs",
      description: "A delicate herb with feathery leaves and a mild anise flavour, central to French cuisine; available fresh in specialist UK supermarkets.",
      knowledgeFoodSlug: "chervil", diversityGroupSlug: "chervil",
    },
    aliases: [
      { alias: "French parsley", aliasType: "common_name" },
      { alias: "garden chervil", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Spices & Condiments ════════════════════════════════

  {
    food: {
      slug: "capers", name: "Capers", category: "Herbs", subcategory: "Condiments",
      description: "The pickled flower buds of the caper bush; widely used in Mediterranean cooking to add a sharp, salty flavour, available in all UK supermarkets.",
      knowledgeFoodSlug: "capers", diversityGroupSlug: "capers",
    },
    aliases: [
      { alias: "caper", aliasType: "singular" },
      { alias: "capers in brine", aliasType: "form" },
      { alias: "salted capers", aliasType: "form" },
      { alias: "caperberries", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "horseradish", name: "Horseradish", category: "Herbs", subcategory: "Condiments",
      description: "A pungent root used as a condiment, traditionally paired with roast beef in British cooking; available fresh, grated or as sauce in UK supermarkets.",
      knowledgeFoodSlug: "horseradish", diversityGroupSlug: "horseradish",
    },
    aliases: [
      { alias: "horseradish root", aliasType: "form" },
      { alias: "horseradish sauce", aliasType: "form" },
      { alias: "prepared horseradish", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "caraway-seeds", name: "Caraway Seeds", category: "Spices", subcategory: "Seeds and pods",
      description: "Small, crescent-shaped seeds with an anise-like, earthy flavour; used in rye bread, sauerkraut and Central European cooking.",
      knowledgeFoodSlug: "caraway-seeds", diversityGroupSlug: "caraway-seeds",
    },
    aliases: [
      { alias: "caraway seed", aliasType: "singular" },
      { alias: "caraway", aliasType: "common_name" },
      { alias: "Persian cumin", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "fenugreek", name: "Fenugreek", category: "Spices", subcategory: "Seeds and pods",
      description: "The hard, slightly bitter, maple-scented seed of the fenugreek plant, used whole or ground in South Asian cooking. The leaf is a separate food.",
      knowledgeFoodSlug: "fenugreek", diversityGroupSlug: "fenugreek", family: null,
    },
    aliases: [
      // Leaf strings REMOVED (NK6Q §2.5 / batch 009). This identity is the SEED spice;
      // the fresh/dried leaf (methi) is a different plant part. Scope confirmed = seed.
      { alias: "fenugreek seeds", aliasType: "form" },
      { alias: "methi seeds", aliasType: "common_name" },
      { alias: "ground fenugreek", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "fenugreek-leaves", name: "Fenugreek Leaves", category: "Herbs", subcategory: "Leafy herbs",
      description: "The leaf of the fenugreek plant — fresh methi cooked as a green, or dried kasuri methi crumbled in as a finishing herb.",
      knowledgeFoodSlug: null, diversityGroupSlug: "fenugreek", family: null,
    },
    aliases: [
      { alias: "methi", aliasType: "common_name" },
      { alias: "methi leaves", aliasType: "common_name" },
      { alias: "kasuri methi", aliasType: "common_name" },
      { alias: "dried fenugreek leaves", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "sumac", name: "Sumac", category: "Spices", subcategory: "Ground spices",
      description: "A deep red-purple ground spice made from dried sumac berries; central to Middle Eastern cooking for its fruity, lemony tang, widely available in UK supermarkets.",
      knowledgeFoodSlug: "sumac", diversityGroupSlug: "sumac",
    },
    aliases: [
      { alias: "ground sumac", aliasType: "form" },
      { alias: "sumac berries", aliasType: "form" },
    ],
  },

  // ════════════════════════ Oils ════════════════════════════════════════════════

  {
    food: {
      slug: "coconut-oil", name: "Coconut Oil", category: "Healthy fats", subcategory: "Oils",
      description: "An oil pressed from coconut flesh; solid at room temperature and widely used in cooking, baking and plant-based recipes.",
      knowledgeFoodSlug: "coconut-oil", diversityGroupSlug: "coconut",
    },
    aliases: [
      { alias: "virgin coconut oil", aliasType: "form" },
      { alias: "refined coconut oil", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "rapeseed-oil", name: "Rapeseed Oil", category: "Healthy fats", subcategory: "Oils",
      description: "A light, golden oil pressed from UK-grown rapeseed with a neutral flavour and high smoke point; the UK's native cooking oil, available in all supermarkets.",
      knowledgeFoodSlug: "rapeseed-oil", diversityGroupSlug: "rapeseed",
    },
    aliases: [
      { alias: "canola oil", aliasType: "common_name" },
      { alias: "cold-pressed rapeseed oil", aliasType: "form" },
      { alias: "British rapeseed oil", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "sesame-oil", name: "Sesame Oil", category: "Healthy fats", subcategory: "Oils",
      description: "A light oil pressed from raw sesame seeds; neutral enough to cook with.",
      knowledgeFoodSlug: "sesame-oil", diversityGroupSlug: "sesame-seeds", family: null,
    },
    aliases: [
      // "toasted"/"dark sesame oil" REMOVED (NK6Q batch 012) — pressed from ROASTED seeds,
      // it is a finishing condiment rather than a cooking oil. Different product, own facts.
      { alias: "sesame seed oil", aliasType: "common_name" },
      { alias: "light sesame oil", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "toasted-sesame-oil", name: "Toasted Sesame Oil", category: "Healthy fats", subcategory: "Oils",
      description: "Oil pressed from roasted sesame seeds; dark, intensely nutty, and used a few drops at a time to finish a dish rather than to cook in.",
      knowledgeFoodSlug: null, diversityGroupSlug: "sesame-seeds", family: null,
    },
    aliases: [
      { alias: "dark sesame oil", aliasType: "common_name" },
      { alias: "roasted sesame oil", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ Fermented ══════════════════════════════════════════

  {
    food: {
      slug: "natto", name: "Natto", category: "Fermented foods", subcategory: "Fermented soya",
      description: "A traditional Japanese food made from fermented soybeans with a sticky texture; an exceptionally rich source of vitamin K2 and beneficial bacteria.",
      knowledgeFoodSlug: "natto", diversityGroupSlug: "edamame", fermented: true,
    },
    aliases: [
      { alias: "fermented soybeans", aliasType: "common_name" },
      { alias: "Japanese natto", aliasType: "form" },
    ],
  },

  // ════════════════════════ M4.5 — Fermented Food Additions ════════════════════
  {
    food: {
      slug: "kombucha", name: "Kombucha", category: "Fermented foods", subcategory: "Fermented drinks",
      description: "A naturally fizzy fermented tea made using a SCOBY (symbiotic culture of bacteria and yeast); contains live cultures and organic acids.",
      // NK6S — its own subcategory already declared it a drink. Category (its domain)
      // is unchanged; only the beverage hierarchy is added.
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "fermented-beverage", fermented: true,
    },
    aliases: [
      { alias: "fermented tea", aliasType: "common_name" },
      { alias: "jun tea", aliasType: "common_name" },
    ],
  },

  // ════════════════════════ M5 — Trusted Food Intelligence Activation ══════════
  // Five knowledge foods from the WS0X.2 H1 editorial batch that had food context
  // pre-staged in food-context.ts but lacked canonical entries. Added here to give
  // each food its own canonical identity, resolver coverage, and diversity group.

  {
    food: {
      slug: "almond-flour", name: "Almond Flour", category: "Grains", subcategory: "Flours",
      description: "Finely ground almonds used in gluten-free baking; supplies vitamin E, magnesium and plant protein.",
      knowledgeFoodSlug: "almond-flour", diversityGroupSlug: "almonds",
    },
    aliases: [
      { alias: "ground almonds", aliasType: "form" },
      { alias: "almond meal", aliasType: "form" },
      { alias: "blanched almond flour", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "baby-corn", name: "Baby Corn", category: "Vegetables", subcategory: "Grain vegetables",
      description: "Miniature corn cobs harvested before the kernels develop; eaten whole and widely available fresh, frozen or tinned.",
      knowledgeFoodSlug: "baby-corn", diversityGroupSlug: "corn",
    },
    aliases: [
      { alias: "baby corn", aliasType: "common_name" },
      { alias: "baby sweetcorn", aliasType: "common_name" },
      { alias: "miniature corn", aliasType: "common_name" },
      { alias: "young corn", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "coconut-flour", name: "Coconut Flour", category: "Grains", subcategory: "Flours",
      description: "A high-fibre flour made from dried coconut flesh; used in gluten-free baking.",
      knowledgeFoodSlug: "coconut-flour", diversityGroupSlug: "coconut",
    },
    aliases: [
      { alias: "coconut flour", aliasType: "common_name" },
      { alias: "desiccated coconut flour", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "spelt-flour", name: "Spelt Flour", category: "Grains", subcategory: "Flours",
      description: "Flour milled from spelt grain; supplies fibre, magnesium, iron and zinc with a mild nutty flavour.",
      knowledgeFoodSlug: "spelt-flour", diversityGroupSlug: "spelt",
    },
    aliases: [
      { alias: "spelt flour", aliasType: "common_name" },
      { alias: "whole spelt flour", aliasType: "form" },
      { alias: "white spelt flour", aliasType: "form" },
      { alias: "spelt wholemeal flour", aliasType: "form" },
    ],
  },

  // ════════════════════════ NK6S — Beverages ═══════════════════════════════════
  // Beverages are a FIRST-CLASS canonical domain, not a leftover bucket. NK6R §6.4
  // minted an ad-hoc `Drinks` category for a single member (`coconut-water`) and
  // left the batch-014 tea/coffee/juice foods with nowhere to land. NK6S promotes
  // that placeholder into a real hierarchy rooted at the `beverage` identity.
  //
  // Two axes, kept apart (the NK6R §1 discipline):
  //   • `category` = the food's DOMAIN OF ORIGIN, and it is NOT rewritten by joining
  //     this tree. A plant milk is still a dairy alternative; kombucha is still a
  //     fermented food. Only foods with no other domain (tea, coffee, juice, cocoa,
  //     infusions, plant waters) carry category "Beverages".
  //   • `family`  = the hierarchy. A food joins it when the DRINK IS THE FOOD.
  //
  // Every family row below is a legitimate coarse identity in its own right (the
  // `blue-cheese` precedent): "tea" names a real thing when the kind is unknown.
  // Several carry no canonical member yet — the batch-014 drafts bind to them on
  // promotion. That is the `washed-rind-cheese` precedent: a declared parent is
  // what stops a future import being forced under a category string. An honest
  // gap, not dead data.
  //
  //   beverage
  //     ├── tea                 → green, black, white, oolong, matcha (batch 014)
  //     ├── herbal-infusion     → rooibos, chamomile, nettle, peppermint (batch 014)
  //     ├── coffee              → beans, ground, instant, decaf (batch 014)
  //     ├── cocoa-beverage      → drinking chocolate  ⚠ NOT slugged `cocoa`
  //     ├── juice               → beetroot, carrot, tomato, prune (batch 014)
  //     ├── plant-water         → coconut-water
  //     ├── fermented-beverage  → kombucha, kefir
  //     ├── plant-beverage      → oat-milk, soy-milk, almond-milk
  //     └── dairy-beverage      → buttermilk
  //
  // `milk` is DELIBERATELY not parented here. It is the dairy fact owner and already
  // parents its own fat classes (`skimmed-milk`, `semi-skimmed-milk`); pulling that
  // subtree under `beverage` would make a CONSUMPTION attribute into a hierarchy
  // level — the very move Amendment 2 rejected when it ruled Hard/Soft descriptive.
  {
    food: {
      slug: "beverage", name: "Beverage", category: "Beverages", subcategory: "Beverages",
      description: "A drink. The parent identity behind the beverage classes; what a beverage is made from — leaf, bean, fruit, grain, nut or milk — decides its nutrients and its plant group.",
      // Type-unknown, exactly like the `pasta` and `mushroom` parents: an unqualified
      // "drink" must not claim a knowledge food or a plant it may not contain.
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: null,
    },
    aliases: [
      { alias: "beverages", aliasType: "plural" },
      // Preserves the word NK6R's retired `Drinks` category used, as a resolvable alias.
      { alias: "drink", aliasType: "common_name" },
      { alias: "drinks", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "tea", name: "Tea", category: "Beverages", subcategory: "Leaf infusions",
      description: "An infusion of the leaves of Camellia sinensis; the parent identity behind green, black, white, oolong and matcha, which differ by oxidation rather than by plant.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage",
    },
    aliases: [
      { alias: "teas", aliasType: "plural" },
      { alias: "brewed tea", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "herbal-infusion", name: "Herbal Infusion", category: "Beverages", subcategory: "Herbal infusions",
      description: "An infusion of a plant that is not Camellia sinensis — rooibos, chamomile, nettle, peppermint. Sold as \"herbal tea\", but botanically not tea at all; each plant is its own food.",
      // The `fennel` / `fennel-seeds` discipline (NK6Q §2.5): a different plant is a
      // different food. Rooibos is NOT a tea, so it may not sit under `tea`.
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage",
    },
    aliases: [
      { alias: "herbal tea", aliasType: "common_name" },
      { alias: "herbal teas", aliasType: "plural" },
      { alias: "tisane", aliasType: "common_name" },
      { alias: "fruit tea", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "coffee", name: "Coffee", category: "Beverages", subcategory: "Coffee",
      description: "A brewed infusion of roasted coffee beans; the parent identity behind whole-bean, ground, instant and decaffeinated coffee, which differ by processing rather than by plant.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage",
    },
    aliases: [
      { alias: "brewed coffee", aliasType: "form" },
      { alias: "black coffee", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "cocoa-beverage", name: "Cocoa Beverage", category: "Beverages", subcategory: "Cocoa",
      description: "A hot drink made by dissolving cocoa solids in milk or water; a preparation, distinct from the cocoa powder it is made with.",
      // ⚠ NOT slugged `cocoa`. `cacao-powder` legitimately owns the alias keys "cocoa"
      // and "cacao" (NK6Q §2.4) — cocoa powder is an INGREDIENT, not a drink. Slugging
      // this family `cocoa` would be a resolver key collision and validateCanonicalSeed
      // would refuse to seed. The narrower name is the correct one either way.
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage",
    },
    aliases: [
      { alias: "drinking chocolate", aliasType: "common_name" },
      { alias: "hot chocolate", aliasType: "common_name" },
      { alias: "hot cocoa", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "juice", name: "Juice", category: "Beverages", subcategory: "Juices",
      description: "The pressed liquid of a fruit or vegetable. The parent identity behind the named juices; an unqualified juice is source-unknown, so it counts no plant.",
      // Same rule as the `pasta` parent: type-unknown claims no diversity group.
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage",
    },
    aliases: [
      { alias: "juices", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "plant-water", name: "Plant Water", category: "Beverages", subcategory: "Plant waters",
      description: "The naturally occurring liquid drawn from a plant — coconut, birch, maple — drunk as-is rather than pressed from flesh.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage",
    },
    aliases: [
      { alias: "plant waters", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "fermented-beverage", name: "Fermented Beverage", category: "Beverages", subcategory: "Fermented drinks",
      description: "A drink transformed by micro-organisms — kombucha, kefir, water kefir — carrying live cultures or their organic acids.",
      // `fermented` stays a per-food attribute (M4.5): this family is a hierarchy
      // level, and membership of it is NOT what makes a food fermented.
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage", fermented: true,
    },
    aliases: [
      { alias: "fermented drink", aliasType: "common_name" },
      { alias: "fermented drinks", aliasType: "plural" },
    ],
  },
  {
    food: {
      slug: "plant-beverage", name: "Plant Beverage", category: "Beverages", subcategory: "Plant milks",
      description: "A drink pressed or blended from a grain, nut, seed or pulse and sold in place of dairy milk; each one counts the plant it is made from.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage",
    },
    aliases: [
      { alias: "plant milk", aliasType: "common_name" },
      { alias: "plant milks", aliasType: "plural" },
      { alias: "plant based milk", aliasType: "common_name" },
      { alias: "non-dairy milk", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "dairy-beverage", name: "Dairy Beverage", category: "Beverages", subcategory: "Dairy drinks",
      description: "A drink whose base is dairy milk. The coarse identity for drinkable dairy; `milk` itself remains the dairy fact owner and is not parented here.",
      knowledgeFoodSlug: null, diversityGroupSlug: null, family: "beverage",
    },
    aliases: [
      { alias: "dairy drink", aliasType: "common_name" },
      { alias: "dairy drinks", aliasType: "plural" },
      { alias: "milk drink", aliasType: "common_name" },
    ],
  },
];
