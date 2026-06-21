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

  // ── Vegetables / leafy ──────────────────────────────────────────────────────
  { slug: "spinach", displayName: "Spinach", countAsSinglePlant: true },

  // ── Legumes ─────────────────────────────────────────────────────────────────
  { slug: "chickpeas", displayName: "Chickpeas", countAsSinglePlant: true },
  { slug: "black-beans", displayName: "Black Beans", countAsSinglePlant: true },
  { slug: "kidney-beans", displayName: "Kidney Beans", countAsSinglePlant: true },
  { slug: "butter-beans", displayName: "Butter Beans", countAsSinglePlant: true },
  // All lentil varieties (red / green / puy / beluga) count as one plant.
  { slug: "lentils", displayName: "Lentils", description: "All lentil varieties — red, green, puy and beluga — count as one plant.", countAsSinglePlant: true },

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

  // ── Vegetables — Mediterranean (WS0.6 authoring trial) ──────────────────────
  // Each vegetable is a distinct plant; all count individually.
  { slug: "kale", displayName: "Kale", description: "Curly kale and cavolo nero are cultivars of the same plant.", countAsSinglePlant: true },
  { slug: "watercress", displayName: "Watercress", countAsSinglePlant: true },
  { slug: "rocket", displayName: "Rocket", countAsSinglePlant: true },
  { slug: "beetroot", displayName: "Beetroot", countAsSinglePlant: true },
  { slug: "carrots", displayName: "Carrots", countAsSinglePlant: true },
  { slug: "parsnip", displayName: "Parsnip", countAsSinglePlant: true },
  { slug: "turnip", displayName: "Turnip", countAsSinglePlant: true },
  { slug: "swede", displayName: "Swede", countAsSinglePlant: true },
  { slug: "broccoli", displayName: "Broccoli", description: "Calabrese and purple sprouting broccoli are cultivars of the same plant.", countAsSinglePlant: true },
  { slug: "red-cabbage", displayName: "Red Cabbage", countAsSinglePlant: true },
  { slug: "pak-choi", displayName: "Pak Choi", countAsSinglePlant: true },
  { slug: "garlic", displayName: "Garlic", countAsSinglePlant: true },
  { slug: "onion", displayName: "Onion", description: "Red, brown and white onions are cultivars of the same plant.", countAsSinglePlant: true },
  { slug: "spring-onion", displayName: "Spring Onion", countAsSinglePlant: true },
  { slug: "aubergine", displayName: "Aubergine", countAsSinglePlant: true },
  { slug: "courgette", displayName: "Courgette", countAsSinglePlant: true },
  { slug: "pepper", displayName: "Pepper", description: "Red, green, yellow and orange bell peppers are all the same plant.", countAsSinglePlant: true },
  { slug: "cucumber", displayName: "Cucumber", countAsSinglePlant: true },
  { slug: "fennel", displayName: "Fennel", countAsSinglePlant: true },
  { slug: "celery", displayName: "Celery", countAsSinglePlant: true },
  { slug: "asparagus", displayName: "Asparagus", countAsSinglePlant: true },
  { slug: "artichoke", displayName: "Artichoke", countAsSinglePlant: true },
  { slug: "broad-beans", displayName: "Broad Beans", countAsSinglePlant: true },
  { slug: "radicchio", displayName: "Radicchio", countAsSinglePlant: true },
  { slug: "chicory", displayName: "Chicory", countAsSinglePlant: true },
];
