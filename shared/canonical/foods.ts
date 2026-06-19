// WS2A — Canonical Food Identity: Food / Variety / Alias seed data.
//
// Authored in a STRUCTURED form (one entry per canonical food, with its
// varieties and aliases nested) so the editorial intent reads top-to-bottom.
// shared/canonical/index.ts flattens this into the per-table insert arrays.
//
// Proving set (NOT the whole world): Tomatoes, Mushrooms, Herbs, Spices, Apples,
// Citrus, Beans, Seeds, Nuts, Healthy fats — chosen to exercise every mechanism:
//   • aliases (singular/plural/common_name/form/misspelling)
//   • varieties (cherry/plum/heirloom tomato; mushroom kinds; apple kinds)
//   • diversity groups (one-food-many-varieties AND many-foods-one-group/citrus)
//
// Editorial rules applied (WS1.5):
//   • Tomato = 1 plant; cherry/plum/heirloom = VARIETIES (not aliases, not foods).
//   • Mushroom = 1 plant; button/chestnut/shiitake/oyster = VARIETIES.
//   • Each herb/spice counts individually; fresh vs dried = ALIASES (form).
import type { InsertCanonicalFood } from "../schema";

export type AliasType = "singular" | "plural" | "common_name" | "brand" | "misspelling" | "form";

export interface VarietySeed {
  slug: string;
  name: string;
  description?: string;
  displayOrder?: number;
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
      { slug: "button-mushroom", name: "Button Mushroom", description: "Also sold as white or closed-cup.", displayOrder: 0 },
      { slug: "chestnut-mushroom", name: "Chestnut Mushroom", description: "Also sold as cremini or brown.", displayOrder: 1 },
      { slug: "shiitake-mushroom", name: "Shiitake Mushroom", displayOrder: 2 },
      { slug: "oyster-mushroom", name: "Oyster Mushroom", displayOrder: 3 },
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
];
