// WS2A — Canonical Food Identity: Diversity Group seed data.
//
// A diversity group is what the 30-plants-a-week counter counts ONCE.
// Editorial decisions (WS1.5):
//   • All tomato varieties (cherry / plum / heirloom) → ONE "tomato" group.
//   • All mushroom varieties (button / chestnut / shiitake / oyster) → ONE
//     "mushroom" group.
//   • Each herb and each spice counts individually → its own group.
//   • Citrus fruits (orange, clementine, …) share ONE "citrus" group even though
//     they are distinct canonical foods (the "same group, different food" case).
import type { InsertDiversityGroup } from "../schema";

export const DIVERSITY_GROUP_SEED: InsertDiversityGroup[] = [
  // ── Vegetables / fruiting ───────────────────────────────────────────────────
  { slug: "tomato", displayName: "Tomato", description: "All tomatoes — including cherry, plum and heirloom — count as one plant.", countAsSinglePlant: true },

  // ── Mushrooms ───────────────────────────────────────────────────────────────
  { slug: "mushroom", displayName: "Mushroom", description: "All mushrooms — button, chestnut, shiitake, oyster — count as one plant.", countAsSinglePlant: true },

  // ── Fruit ───────────────────────────────────────────────────────────────────
  { slug: "apple", displayName: "Apple", description: "All apple varieties count as one plant.", countAsSinglePlant: true },
  { slug: "citrus", displayName: "Citrus", description: "Oranges, clementines and other citrus share one plant group.", countAsSinglePlant: true },
  { slug: "avocado", displayName: "Avocado", countAsSinglePlant: true },

  // ── Herbs (each counts individually) ────────────────────────────────────────
  { slug: "basil", displayName: "Basil", countAsSinglePlant: true },
  { slug: "parsley", displayName: "Parsley", countAsSinglePlant: true },
  { slug: "coriander", displayName: "Coriander", countAsSinglePlant: true },
  { slug: "mint", displayName: "Mint", countAsSinglePlant: true },

  // ── Spices (each counts individually) ───────────────────────────────────────
  { slug: "cumin", displayName: "Cumin", countAsSinglePlant: true },
  { slug: "turmeric", displayName: "Turmeric", countAsSinglePlant: true },
  { slug: "cinnamon", displayName: "Cinnamon", countAsSinglePlant: true },
  { slug: "ginger", displayName: "Ginger", countAsSinglePlant: true },
  { slug: "paprika", displayName: "Paprika", countAsSinglePlant: true },

  // ── Legumes ─────────────────────────────────────────────────────────────────
  { slug: "chickpeas", displayName: "Chickpeas", countAsSinglePlant: true },
  { slug: "black-beans", displayName: "Black Beans", countAsSinglePlant: true },
  { slug: "kidney-beans", displayName: "Kidney Beans", countAsSinglePlant: true },
  { slug: "butter-beans", displayName: "Butter Beans", countAsSinglePlant: true },

  // ── Seeds ───────────────────────────────────────────────────────────────────
  { slug: "pumpkin-seeds", displayName: "Pumpkin Seeds", countAsSinglePlant: true },
  { slug: "sunflower-seeds", displayName: "Sunflower Seeds", countAsSinglePlant: true },
  { slug: "chia-seeds", displayName: "Chia Seeds", countAsSinglePlant: true },
  { slug: "flaxseed", displayName: "Flaxseed", countAsSinglePlant: true },

  // ── Nuts ────────────────────────────────────────────────────────────────────
  { slug: "walnuts", displayName: "Walnuts", countAsSinglePlant: true },
  { slug: "almonds", displayName: "Almonds", countAsSinglePlant: true },

  // ── Healthy fats ────────────────────────────────────────────────────────────
  { slug: "olive-oil", displayName: "Olive Oil", countAsSinglePlant: true },
];
