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
      description: "A ground pepper spice; sweet and smoked are the same food here.",
      knowledgeFoodSlug: "paprika", diversityGroupSlug: "paprika",
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
      { slug: "savoy-cabbage", name: "Savoy Cabbage", displayOrder: 0 },
      { slug: "hispi-cabbage", name: "Hispi Cabbage", description: "Also called pointed or sweetheart cabbage.", displayOrder: 1 },
    ],
    aliases: [
      { alias: "white cabbage", aliasType: "common_name" },
      { alias: "green cabbage", aliasType: "common_name" },
      { alias: "spring cabbage", aliasType: "form" },
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
      { slug: "sugar-snap-peas", name: "Sugar Snap Peas", displayOrder: 0 },
      { slug: "mangetout", name: "Mangetout", displayOrder: 1 },
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
      { alias: "runner beans", aliasType: "common_name" },
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
      knowledgeFoodSlug: "lemon", diversityGroupSlug: "citrus",
    },
    aliases: [
      { alias: "lemons", aliasType: "plural" },
      { alias: "lemon juice", aliasType: "form" },
      { alias: "lemon zest", aliasType: "form" },
      { alias: "preserved lemon", aliasType: "form" },
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
      description: "A fragrant spice from orchid pods, used to flavour baking and desserts.",
      knowledgeFoodSlug: "vanilla", diversityGroupSlug: "vanilla",
    },
    aliases: [
      { alias: "vanilla pods", aliasType: "form" },
      { alias: "vanilla extract", aliasType: "form" },
      { alias: "vanilla paste", aliasType: "form" },
      { alias: "vanilla bean", aliasType: "common_name" },
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
      description: "The world's most widely used spice; whole peppercorns and ground pepper are the same food.",
      knowledgeFoodSlug: "black-pepper", diversityGroupSlug: "black-pepper",
    },
    aliases: [
      { alias: "ground black pepper", aliasType: "form" },
      { alias: "peppercorns", aliasType: "form" },
      { alias: "white pepper", aliasType: "form" },
      { alias: "black peppercorns", aliasType: "form" },
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
      { alias: "tahini", aliasType: "form" },
      { alias: "tahini paste", aliasType: "form" },
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
      knowledgeFoodSlug: "peanuts", diversityGroupSlug: "peanuts",
    },
    aliases: [
      { alias: "peanut", aliasType: "singular" },
      { alias: "groundnuts", aliasType: "common_name" },
      { alias: "monkey nuts", aliasType: "common_name" },
      { alias: "peanut butter", aliasType: "form" },
      { alias: "roasted peanuts", aliasType: "form" },
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
      description: "A nutrient-dense dairy liquid supplying calcium, vitamin D, vitamin B12 and iodine.",
      knowledgeFoodSlug: "milk", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "whole milk", aliasType: "form" },
      { alias: "semi-skimmed milk", aliasType: "form" },
      { alias: "skimmed milk", aliasType: "form" },
      { alias: "full-fat milk", aliasType: "form" },
      { alias: "cow's milk", aliasType: "common_name" },
      { alias: "cows milk", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "yoghurt", name: "Yoghurt", category: "Dairy", subcategory: "Fermented dairy",
      description: "A cultured dairy food supplying calcium and vitamin B12; includes live, natural and Greek-style varieties.",
      knowledgeFoodSlug: "live-yogurt", diversityGroupSlug: null,
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
  {
    food: {
      slug: "cheddar", name: "Cheddar", category: "Dairy", subcategory: "Hard cheese",
      description: "A firm, tangy British cheese and an excellent source of calcium, vitamin B12 and iodine.",
      knowledgeFoodSlug: "cheddar", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "cheddar cheese", aliasType: "form" },
      { alias: "mature cheddar", aliasType: "form" },
      { alias: "mild cheddar", aliasType: "form" },
      { alias: "grated cheddar", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "mozzarella", name: "Mozzarella", category: "Dairy", subcategory: "Fresh cheese",
      description: "A soft, mild Italian cheese supplying calcium and vitamin B12.",
      knowledgeFoodSlug: "mozzarella", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "fresh mozzarella", aliasType: "form" },
      { alias: "buffalo mozzarella", aliasType: "form" },
      { alias: "grated mozzarella", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "halloumi", name: "Halloumi", category: "Dairy", subcategory: "Semi-hard cheese",
      description: "A firm Cypriot cheese with a high melting point; best grilled or pan-fried.",
      knowledgeFoodSlug: "halloumi", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "grilling cheese", aliasType: "common_name" },
      { alias: "haloumi", aliasType: "misspelling" },
    ],
  },
  {
    food: {
      slug: "feta", name: "Feta", category: "Dairy", subcategory: "Soft cheese",
      description: "A crumbly, tangy Greek cheese made from sheep's and goat's milk, supplying calcium.",
      knowledgeFoodSlug: "feta", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "feta cheese", aliasType: "form" },
      { alias: "Greek cheese", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "parmesan", name: "Parmesan", category: "Dairy", subcategory: "Hard cheese",
      description: "A hard, aged Italian cheese with intense umami flavour, rich in calcium and vitamin B12.",
      knowledgeFoodSlug: "parmesan", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "parmigiano reggiano", aliasType: "common_name" },
      { alias: "parmigiano-reggiano", aliasType: "common_name" },
      { alias: "grana padano", aliasType: "common_name" },
      { alias: "grated parmesan", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "ricotta", name: "Ricotta", category: "Dairy", subcategory: "Fresh cheese",
      description: "A soft, mild Italian whey cheese light in flavour and supplying calcium.",
      knowledgeFoodSlug: "ricotta", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "ricotta cheese", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "oat-milk", name: "Oat Milk", category: "Dairy alternatives", subcategory: "Plant milks",
      description: "A plant-based milk made from oats; contributes oat plant diversity and is commonly fortified.",
      knowledgeFoodSlug: "oat-milk", diversityGroupSlug: "oats",
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
      knowledgeFoodSlug: "soy-milk", diversityGroupSlug: "edamame",
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
      knowledgeFoodSlug: "almond-milk", diversityGroupSlug: "almonds",
    },
    aliases: [
      { alias: "almond drink", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "kefir", name: "Kefir", category: "Dairy", subcategory: "Fermented dairy",
      description: "A cultured, drinkable ferment rich in live cultures and calcium.",
      knowledgeFoodSlug: "kefir", diversityGroupSlug: null,
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
      knowledgeFoodSlug: "tempeh", diversityGroupSlug: null,
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
      description: "A red meat with a distinctive flavour supplying iron, zinc and vitamin B12.",
      knowledgeFoodSlug: "lamb", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "lamb chops", aliasType: "form" },
      { alias: "lamb mince", aliasType: "form" },
      { alias: "lamb leg", aliasType: "form" },
      { alias: "lamb shoulder", aliasType: "form" },
      { alias: "mutton", aliasType: "common_name" },
    ],
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
      knowledgeFoodSlug: "miso", diversityGroupSlug: null,
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
      knowledgeFoodSlug: "sauerkraut", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "fermented cabbage", aliasType: "common_name" },
    ],
  },
  {
    food: {
      slug: "kimchi", name: "Kimchi", category: "Fermented foods", subcategory: "Fermented vegetables",
      description: "A Korean ferment of cabbage and spices, rich in live cultures and fibre.",
      knowledgeFoodSlug: "kimchi", diversityGroupSlug: null,
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
      { alias: "porridge oats", aliasType: "form" },
      { alias: "rolled oats", aliasType: "form" },
      { alias: "oat flakes", aliasType: "form" },
      { alias: "jumbo oats", aliasType: "form" },
      { alias: "oat flour", aliasType: "form" },
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
      knowledgeFoodSlug: "white-rice", diversityGroupSlug: "rice",
    },
    aliases: [
      { alias: "basmati rice", aliasType: "form" },
      { alias: "jasmine rice", aliasType: "form" },
      { alias: "long-grain rice", aliasType: "form" },
      { alias: "arborio rice", aliasType: "form" },
      { alias: "risotto rice", aliasType: "form" },
      { alias: "sushi rice", aliasType: "form" },
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
      { alias: "buckwheat groats", aliasType: "form" },
      { alias: "kasha", aliasType: "common_name" },
      { alias: "buckwheat flour", aliasType: "form" },
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
      { alias: "spelt flour", aliasType: "form" },
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
      { alias: "rye bread", aliasType: "form" },
      { alias: "rye flour", aliasType: "form" },
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
      { alias: "whole wheat", aliasType: "form" },
      { alias: "wheat flour", aliasType: "form" },
      { alias: "wholemeal flour", aliasType: "form" },
      { alias: "wheat berries", aliasType: "form" },
      { alias: "wholewheat flour", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "couscous", name: "Couscous", category: "Grains", subcategory: "Wheat products",
      description: "Tiny steamed wheat granules that cook quickly; a staple of North African and Middle Eastern cooking.",
      knowledgeFoodSlug: "couscous", diversityGroupSlug: "wheat",
    },
    aliases: [
      { alias: "wholewheat couscous", aliasType: "form" },
      { alias: "giant couscous", aliasType: "form" },
      { alias: "Israeli couscous", aliasType: "form" },
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
  {
    food: {
      slug: "pasta", name: "Pasta", category: "Grains", subcategory: "Wheat products",
      description: "A versatile wheat-based staple; wholemeal pasta adds significantly more fibre than white pasta.",
      knowledgeFoodSlug: "pasta", diversityGroupSlug: "wheat",
    },
    varieties: [
      { slug: "wholemeal-pasta", name: "Wholemeal Pasta", displayOrder: 0 },
    ],
    aliases: [
      { alias: "spaghetti", aliasType: "form" },
      { alias: "penne", aliasType: "form" },
      { alias: "fusilli", aliasType: "form" },
      { alias: "tagliatelle", aliasType: "form" },
      { alias: "rigatoni", aliasType: "form" },
      { alias: "macaroni", aliasType: "form" },
      { alias: "wholemeal pasta", aliasType: "form" },
    ],
  },
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
      description: "A tropical drupe with fibre-rich flesh; desiccated, coconut milk and coconut cream are all the same plant.",
      knowledgeFoodSlug: "coconut", diversityGroupSlug: "coconut",
    },
    aliases: [
      { alias: "desiccated coconut", aliasType: "form" },
      { alias: "coconut milk", aliasType: "form" },
      { alias: "coconut cream", aliasType: "form" },
      { alias: "coconut water", aliasType: "form" },
      { alias: "coconut flakes", aliasType: "form" },
      { alias: "coconut flour", aliasType: "form" },
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
      knowledgeFoodSlug: "dark-chocolate", diversityGroupSlug: "dark-chocolate",
    },
    aliases: [
      { alias: "cocoa", aliasType: "form" },
      { alias: "cacao", aliasType: "common_name" },
      { alias: "dark choc", aliasType: "form" },
      { alias: "cocoa powder", aliasType: "form" },
      { alias: "70% chocolate", aliasType: "form" },
      { alias: "85% chocolate", aliasType: "form" },
    ],
  },
  {
    food: {
      slug: "butter", name: "Butter", category: "Dairy", subcategory: "Dairy fats",
      description: "A dairy fat made from churned cream, supplying fat-soluble vitamins A and D.",
      knowledgeFoodSlug: "butter", diversityGroupSlug: null,
    },
    aliases: [
      { alias: "unsalted butter", aliasType: "form" },
      { alias: "salted butter", aliasType: "form" },
      { alias: "block butter", aliasType: "form" },
      { alias: "spreadable butter", aliasType: "form" },
      { alias: "ghee", aliasType: "form" },
      { alias: "clarified butter", aliasType: "form" },
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
];
