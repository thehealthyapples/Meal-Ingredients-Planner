// WS2A — Canonical Food Identity: Diversity Group seed data.
//
// A diversity group is what the 30-plants-a-week counter counts ONCE.
// Editorial decisions (WS1.5):
//   • All tomato varieties (cherry / plum / heirloom) → ONE "tomato" group.
//   • All mushroom varieties (button / chestnut / shiitake / oyster) → ONE
//     "mushroom" group.
//   • Each herb and each spice counts individually → its own group.
//   • Citrus fruits (orange, clementine, lemon, lime, grapefruit) share ONE
//     "citrus" group even though they are distinct canonical foods.
//
// WS0.8 — expanded to cover ~88 new plant groups across 8 waves.
// Non-plant foods (dairy, meat, fish, eggs, fermented products) have
// diversityGroupSlug: null in their canonical entries — no group entry here.
import type { InsertDiversityGroup } from "../schema";

export const DIVERSITY_GROUP_SEED: InsertDiversityGroup[] = [
  // ── Vegetables / fruiting ───────────────────────────────────────────────────
  { slug: "tomato", displayName: "Tomato", description: "All tomatoes — including cherry, plum and heirloom — count as one plant.", countAsSinglePlant: true },

  // ── Mushrooms ───────────────────────────────────────────────────────────────
  { slug: "mushroom", displayName: "Mushroom", description: "All mushrooms — button, chestnut, shiitake, oyster — count as one plant.", countAsSinglePlant: true },

  // ── Fruit ───────────────────────────────────────────────────────────────────
  { slug: "apple", displayName: "Apple", description: "All apple varieties count as one plant.", countAsSinglePlant: true },
  { slug: "citrus", displayName: "Citrus", description: "Oranges, clementines, lemons, limes and grapefruit share one plant group.", countAsSinglePlant: true },
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

  // ══════════════════════════════════════════════════════════════════════════════
  // WS0.8 — Launch Food Coverage Expansion
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Wave 1 — Pantry Essentials ───────────────────────────────────────────────
  { slug: "potato", displayName: "Potato", description: "All potato varieties — King Edward, Maris Piper, Jersey Royal — count as one plant.", countAsSinglePlant: true },
  { slug: "sweet-potato", displayName: "Sweet Potato", countAsSinglePlant: true },
  { slug: "leek", displayName: "Leek", countAsSinglePlant: true },
  { slug: "shallot", displayName: "Shallot", countAsSinglePlant: true },
  { slug: "cauliflower", displayName: "Cauliflower", description: "White, purple and Romanesco cauliflower count as one plant.", countAsSinglePlant: true },
  { slug: "cabbage", displayName: "Cabbage", description: "White, green, savoy and hispi cabbages are cultivars of the same plant.", countAsSinglePlant: true },
  { slug: "butternut-squash", displayName: "Butternut Squash", countAsSinglePlant: true },
  { slug: "pumpkin", displayName: "Pumpkin", countAsSinglePlant: true },
  { slug: "peas", displayName: "Peas", description: "Garden peas, sugar snap peas and mangetout are cultivars of the same plant.", countAsSinglePlant: true },
  { slug: "edamame", displayName: "Edamame", description: "Edamame and soya beans are the same plant at different stages of maturity.", countAsSinglePlant: true },
  { slug: "brussels-sprouts", displayName: "Brussels Sprouts", countAsSinglePlant: true },
  { slug: "celeriac", displayName: "Celeriac", countAsSinglePlant: true },
  { slug: "green-beans", displayName: "Green Beans", description: "French beans, runner beans and haricot verts are the same plant.", countAsSinglePlant: true },
  { slug: "radish", displayName: "Radish", countAsSinglePlant: true },
  { slug: "kohlrabi", displayName: "Kohlrabi", countAsSinglePlant: true },
  { slug: "corn", displayName: "Sweetcorn", countAsSinglePlant: true },

  // ── Wave 2 — Mediterranean Vegetables ───────────────────────────────────────
  { slug: "lettuce", displayName: "Lettuce", description: "Romaine, little gem, iceberg and butterhead lettuces count as one plant.", countAsSinglePlant: true },
  { slug: "olives", displayName: "Olives", description: "Black and green olives are the same fruit at different stages of ripeness.", countAsSinglePlant: true },
  { slug: "chard", displayName: "Chard", countAsSinglePlant: true },
  { slug: "jerusalem-artichoke", displayName: "Jerusalem Artichoke", countAsSinglePlant: true },

  // ── Wave 3 — Beans, Pulses and Legumes ──────────────────────────────────────
  { slug: "cannellini-beans", displayName: "Cannellini Beans", countAsSinglePlant: true },
  { slug: "borlotti-beans", displayName: "Borlotti Beans", countAsSinglePlant: true },
  { slug: "haricot-beans", displayName: "Haricot Beans", countAsSinglePlant: true },

  // ── Wave 4 — Fruit ──────────────────────────────────────────────────────────
  { slug: "banana", displayName: "Banana", countAsSinglePlant: true },
  { slug: "strawberry", displayName: "Strawberry", countAsSinglePlant: true },
  { slug: "blueberry", displayName: "Blueberry", countAsSinglePlant: true },
  { slug: "raspberry", displayName: "Raspberry", countAsSinglePlant: true },
  { slug: "kiwi", displayName: "Kiwi", description: "Green kiwi and golden kiwi are cultivars of the same fruit.", countAsSinglePlant: true },
  { slug: "pear", displayName: "Pear", description: "Conference, Williams and Comice pears count as one plant.", countAsSinglePlant: true },
  { slug: "mango", displayName: "Mango", countAsSinglePlant: true },
  { slug: "grape", displayName: "Grape", description: "Red, green and black grapes count as one plant.", countAsSinglePlant: true },
  { slug: "pomegranate", displayName: "Pomegranate", countAsSinglePlant: true },
  { slug: "peach", displayName: "Peach", description: "Yellow and white peaches count as one plant.", countAsSinglePlant: true },
  { slug: "plum", displayName: "Plum", countAsSinglePlant: true },
  { slug: "cherry", displayName: "Cherry", description: "Sweet and sour cherries count as one plant.", countAsSinglePlant: true },
  { slug: "nectarine", displayName: "Nectarine", countAsSinglePlant: true },
  { slug: "watermelon", displayName: "Watermelon", countAsSinglePlant: true },
  { slug: "pineapple", displayName: "Pineapple", countAsSinglePlant: true },
  { slug: "fig", displayName: "Fig", countAsSinglePlant: true },
  { slug: "apricot", displayName: "Apricot", countAsSinglePlant: true },
  { slug: "passion-fruit", displayName: "Passion Fruit", countAsSinglePlant: true },
  { slug: "blackberry", displayName: "Blackberry", countAsSinglePlant: true },
  { slug: "melon", displayName: "Melon", description: "Honeydew, cantaloupe and galia melons count as one plant.", countAsSinglePlant: true },
  { slug: "cranberry", displayName: "Cranberry", countAsSinglePlant: true },
  { slug: "blackcurrant", displayName: "Blackcurrant", countAsSinglePlant: true },
  { slug: "redcurrant", displayName: "Redcurrant", countAsSinglePlant: true },
  { slug: "gooseberry", displayName: "Gooseberry", countAsSinglePlant: true },
  { slug: "raisins", displayName: "Raisins", description: "Raisins, sultanas and currants are all dried grapes.", countAsSinglePlant: true },

  // ── Wave 5 — Herbs and Spices ────────────────────────────────────────────────
  { slug: "rosemary", displayName: "Rosemary", countAsSinglePlant: true },
  { slug: "thyme", displayName: "Thyme", countAsSinglePlant: true },
  { slug: "oregano", displayName: "Oregano", countAsSinglePlant: true },
  { slug: "dill", displayName: "Dill", countAsSinglePlant: true },
  { slug: "chives", displayName: "Chives", countAsSinglePlant: true },
  { slug: "sage", displayName: "Sage", countAsSinglePlant: true },
  { slug: "tarragon", displayName: "Tarragon", countAsSinglePlant: true },
  { slug: "bay-leaf", displayName: "Bay Leaf", countAsSinglePlant: true },
  { slug: "lemongrass", displayName: "Lemongrass", countAsSinglePlant: true },
  { slug: "vanilla", displayName: "Vanilla", countAsSinglePlant: true },
  { slug: "chilli", displayName: "Chilli", description: "All chilli varieties — bird's eye, jalapeño, habanero — count as one plant.", countAsSinglePlant: true },
  { slug: "black-pepper", displayName: "Black Pepper", countAsSinglePlant: true },
  { slug: "cardamom", displayName: "Cardamom", countAsSinglePlant: true },
  { slug: "star-anise", displayName: "Star Anise", countAsSinglePlant: true },
  { slug: "cloves", displayName: "Cloves", countAsSinglePlant: true },
  { slug: "nutmeg", displayName: "Nutmeg", countAsSinglePlant: true },

  // ── Wave 6 — Nuts and Seeds ──────────────────────────────────────────────────
  { slug: "sesame-seeds", displayName: "Sesame Seeds", countAsSinglePlant: true },
  { slug: "hemp-seeds", displayName: "Hemp Seeds", countAsSinglePlant: true },
  { slug: "hazelnuts", displayName: "Hazelnuts", countAsSinglePlant: true },
  { slug: "cashews", displayName: "Cashews", countAsSinglePlant: true },
  { slug: "pistachios", displayName: "Pistachios", countAsSinglePlant: true },
  { slug: "brazil-nuts", displayName: "Brazil Nuts", countAsSinglePlant: true },
  { slug: "pine-nuts", displayName: "Pine Nuts", countAsSinglePlant: true },
  { slug: "pecans", displayName: "Pecans", countAsSinglePlant: true },
  { slug: "peanuts", displayName: "Peanuts", countAsSinglePlant: true },
  { slug: "macadamia", displayName: "Macadamia", countAsSinglePlant: true },

  // ── Dairy alternatives (share base plant diversity groups) ───────────────────
  // oat-milk → "oats" group; soy-milk → "edamame" group; almond-milk → "almonds" group
  // No separate diversity groups needed for plant milks.

  // ── Grains & Cereals ─────────────────────────────────────────────────────────
  { slug: "oats", displayName: "Oats", countAsSinglePlant: true },
  { slug: "rice", displayName: "Rice", description: "Brown rice and white rice are both the same plant.", countAsSinglePlant: true },
  { slug: "quinoa", displayName: "Quinoa", countAsSinglePlant: true },
  { slug: "buckwheat", displayName: "Buckwheat", countAsSinglePlant: true },
  { slug: "barley", displayName: "Barley", countAsSinglePlant: true },
  { slug: "spelt", displayName: "Spelt", countAsSinglePlant: true },
  { slug: "rye", displayName: "Rye", countAsSinglePlant: true },
  { slug: "wheat", displayName: "Wheat", description: "Wheat, couscous, bulgur wheat, pasta and freekeh all come from the wheat plant.", countAsSinglePlant: true },
  { slug: "millet", displayName: "Millet", countAsSinglePlant: true },

  // ── Other plant foods ────────────────────────────────────────────────────────
  { slug: "coconut", displayName: "Coconut", countAsSinglePlant: true },
  { slug: "dates", displayName: "Dates", countAsSinglePlant: true },
  { slug: "dark-chocolate", displayName: "Dark Chocolate", description: "Dark chocolate comes from the cacao plant and counts as one plant.", countAsSinglePlant: true },
  { slug: "sunflower-oil", displayName: "Sunflower Oil", description: "Sunflower oil comes from the sunflower plant (same as sunflower seeds).", countAsSinglePlant: false },

  // ══════════════════════════════════════════════════════════════════════════════
  // WS0X.8 — Food Intelligence Data Expansion (H1 batch promotion)
  // ══════════════════════════════════════════════════════════════════════════════

  // ── Vegetables (new canonical plants) ───────────────────────────────────────
  { slug: "okra", displayName: "Okra", countAsSinglePlant: true },
  { slug: "runner-beans", displayName: "Runner Beans", countAsSinglePlant: true },
  { slug: "spring-greens", displayName: "Spring Greens", countAsSinglePlant: true },
  { slug: "water-chestnuts", displayName: "Water Chestnuts", countAsSinglePlant: true },
  { slug: "bean-sprouts", displayName: "Bean Sprouts", countAsSinglePlant: true },
  { slug: "bamboo-shoots", displayName: "Bamboo Shoots", countAsSinglePlant: true },
  { slug: "cassava", displayName: "Cassava", countAsSinglePlant: true },
  { slug: "broccoli-raab", displayName: "Broccoli Raab", countAsSinglePlant: true },
  { slug: "mustard-greens", displayName: "Mustard Greens", countAsSinglePlant: true },

  // ── Fruit (new canonical plants) ────────────────────────────────────────────
  { slug: "jackfruit", displayName: "Jackfruit", countAsSinglePlant: true },
  { slug: "elderberry", displayName: "Elderberry", countAsSinglePlant: true },
  { slug: "goji-berry", displayName: "Goji Berry", countAsSinglePlant: true },
  { slug: "lychee", displayName: "Lychee", countAsSinglePlant: true },
  { slug: "papaya", displayName: "Papaya", countAsSinglePlant: true },
  { slug: "mulberry", displayName: "Mulberry", countAsSinglePlant: true },
  { slug: "loganberry", displayName: "Loganberry", countAsSinglePlant: true },
  { slug: "guava", displayName: "Guava", countAsSinglePlant: true },
  { slug: "plantain", displayName: "Plantain", countAsSinglePlant: true },
  { slug: "physalis", displayName: "Physalis", countAsSinglePlant: true },

  // ── Grains (genuinely new plants — processed forms share parent groups) ──────
  { slug: "sorghum", displayName: "Sorghum", countAsSinglePlant: true },
  { slug: "amaranth", displayName: "Amaranth", countAsSinglePlant: true },
  { slug: "farro", displayName: "Farro", description: "Farro (emmer wheat) is a distinct ancient wheat species separate from modern wheat.", countAsSinglePlant: true },
  { slug: "teff", displayName: "Teff", countAsSinglePlant: true },

  // ── Legumes ──────────────────────────────────────────────────────────────────
  { slug: "pinto-beans", displayName: "Pinto Beans", countAsSinglePlant: true },
  { slug: "black-eyed-peas", displayName: "Black-Eyed Peas", countAsSinglePlant: true },

  // ── Seeds ────────────────────────────────────────────────────────────────────
  { slug: "nigella-seeds", displayName: "Nigella Seeds", countAsSinglePlant: true },

  // ── Herbs ────────────────────────────────────────────────────────────────────
  { slug: "marjoram", displayName: "Marjoram", countAsSinglePlant: true },
  { slug: "chervil", displayName: "Chervil", countAsSinglePlant: true },

  // ── Spices & Condiments ──────────────────────────────────────────────────────
  { slug: "capers", displayName: "Capers", countAsSinglePlant: true },
  { slug: "horseradish", displayName: "Horseradish", countAsSinglePlant: true },
  { slug: "caraway-seeds", displayName: "Caraway Seeds", countAsSinglePlant: true },
  { slug: "fenugreek", displayName: "Fenugreek", countAsSinglePlant: true },
  { slug: "sumac", displayName: "Sumac", countAsSinglePlant: true },

  // ── Oils ─────────────────────────────────────────────────────────────────────
  { slug: "rapeseed", displayName: "Rapeseed", description: "Rapeseed oil comes from the rapeseed plant, distinct from sunflower or olive.", countAsSinglePlant: true },
];
