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
      knowledgeFoodSlug: "parsley", diversityGroupSlug: "parsley",
    },
    aliases: [
      { alias: "flat leaf parsley", aliasType: "common_name" },
      { alias: "curly parsley", aliasType: "common_name" },
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
      knowledgeFoodSlug: null, diversityGroupSlug: "cumin",
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
      knowledgeFoodSlug: null, diversityGroupSlug: "turmeric",
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
      knowledgeFoodSlug: null, diversityGroupSlug: "cinnamon",
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
      knowledgeFoodSlug: null, diversityGroupSlug: "ginger",
    },
    aliases: [
      { alias: "fresh ginger", aliasType: "form" },
      { alias: "ground ginger", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "paprika", name: "Paprika", category: "Spices", subcategory: "Ground spices",
      description: "A ground pepper spice; sweet and smoked are the same food here.",
      knowledgeFoodSlug: null, diversityGroupSlug: "paprika",
    },
    aliases: [
      { alias: "smoked paprika", aliasType: "form" },
      { alias: "sweet paprika", aliasType: "form" },
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
      knowledgeFoodSlug: null, diversityGroupSlug: "citrus",
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
      { slug: "green-lentil", name: "Green Lentils", displayOrder: 1 },
      { slug: "puy-lentil", name: "Puy Lentils", displayOrder: 2 },
      { slug: "beluga-lentil", name: "Beluga Lentils", displayOrder: 3 },
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
      { alias: "ground almonds", aliasType: "form" },
      { alias: "flaked almonds", aliasType: "form" },
    ],
  },

  // ════════════════════════ Healthy fats ════════════════════════
  {
    food: {
      slug: "extra-virgin-olive-oil", name: "Extra Virgin Olive Oil", category: "Healthy fats", subcategory: "Oils",
      description: "A cold-pressed oil rich in unsaturated fats and polyphenols.",
      knowledgeFoodSlug: "extra-virgin-olive-oil", diversityGroupSlug: "olive-oil",
    },
    aliases: [
      { alias: "olive oil", aliasType: "common_name" },
      { alias: "evoo", aliasType: "common_name" },
      { alias: "virgin olive oil", aliasType: "form" },
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
      { slug: "purple-sprouting-broccoli", name: "Purple Sprouting Broccoli", displayOrder: 1 },
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
      description: "An aromatic bulb vegetable with an aniseed flavour; the bulb, fronds and seeds are all the same plant.",
      knowledgeFoodSlug: "fennel", diversityGroupSlug: "fennel",
    },
    aliases: [
      { alias: "fennel bulb", aliasType: "form" },
      { alias: "florence fennel", aliasType: "common_name" },
      { alias: "fennel seed", aliasType: "form" },
      { alias: "fennel seeds", aliasType: "form" },
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
];
