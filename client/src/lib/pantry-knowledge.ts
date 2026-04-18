export interface PantryKnowledge {
  supports: string[];
  highlights?: string[];
  whyItMatters: string;
  goodToKnow?: string;
  howToChoose?: string[];
  tags: string[];
}

// Keys must match normalizeIngredientKey output: lowercase, no punctuation, single spaces.
export const PANTRY_KNOWLEDGE: Record<string, PantryKnowledge> = {
  // ── Oils ──────────────────────────────────────────────────────────────────
  "olive oil": {
    supports: ["Healthy fats"],
    highlights: ["Rich in monounsaturated fats", "Source of natural polyphenols"],
    whyItMatters: "A key source of monounsaturated fats, widely used in balanced Mediterranean-style cooking.",
    goodToKnow: "Extra virgin is the least processed form and retains more of its natural qualities.",
    howToChoose: [
      "Extra virgin (EVOO) over refined varieties",
      "Cold-pressed",
      "Stored in dark glass or a tin",
      "Check for a recent harvest date",
    ],
    tags: ["healthy fats", "mediterranean"],
  },
  "extra virgin olive oil": {
    supports: ["Healthy fats"],
    highlights: ["Rich in monounsaturated fats", "Source of natural polyphenols"],
    whyItMatters: "The least processed form of olive oil, retaining more of its natural plant compounds.",
    howToChoose: [
      "Cold-pressed",
      "Stored in dark glass or a tin",
      "Recent harvest date on the label",
    ],
    tags: ["healthy fats", "mediterranean"],
  },

  // ── Spices ────────────────────────────────────────────────────────────────
  "turmeric": {
    supports: ["Anti-inflammatory compounds"],
    highlights: ["Naturally rich in curcumin", "Used in small amounts for depth"],
    whyItMatters: "A golden spice with a long history in South Asian cooking, often used to add warmth and depth.",
    goodToKnow: "Often paired with black pepper in recipes, which supports absorption of its active compounds.",
    tags: ["anti-inflammatory", "spice"],
  },
  "ground turmeric": {
    supports: ["Anti-inflammatory compounds"],
    highlights: ["Naturally rich in curcumin", "Used in small amounts for depth"],
    whyItMatters: "A golden spice with a long history in South Asian cooking, often used to add warmth and depth.",
    goodToKnow: "Often paired with black pepper in recipes, which supports absorption of its active compounds.",
    tags: ["anti-inflammatory", "spice"],
  },
  "ginger": {
    supports: ["Digestive comfort"],
    whyItMatters: "A warming root with a long culinary history, often used to support digestion and add depth.",
    tags: ["digestive", "anti-inflammatory", "spice"],
  },
  "fresh ginger": {
    supports: ["Digestive comfort"],
    whyItMatters: "A warming root with a long culinary history, often used to support digestion and add depth.",
    tags: ["digestive", "anti-inflammatory", "spice"],
  },
  "ground ginger": {
    supports: ["Digestive comfort"],
    whyItMatters: "A warming spice often used to add depth to both sweet and savoury dishes.",
    tags: ["digestive", "spice"],
  },

  // ── Legumes ───────────────────────────────────────────────────────────────
  "chickpeas": {
    supports: ["Fibre", "Plant protein"],
    highlights: ["High in soluble fibre", "Good source of plant protein"],
    whyItMatters: "A versatile legume that helps keep meals filling and supports gut health.",
    tags: ["gut health", "plant protein", "legume", "fibre"],
  },
  "tinned chickpeas": {
    supports: ["Fibre", "Plant protein"],
    whyItMatters: "A convenient form of chickpeas — rinsing before use reduces sodium content.",
    tags: ["gut health", "plant protein", "legume", "fibre"],
  },
  "lentils": {
    supports: ["Fibre", "Plant protein", "Iron"],
    highlights: ["High in fibre", "Naturally rich in plant iron"],
    whyItMatters: "One of the most affordable and versatile sources of plant protein and fibre.",
    tags: ["gut health", "plant protein", "legume", "iron"],
  },
  "red lentils": {
    supports: ["Fibre", "Plant protein"],
    whyItMatters: "A quick-cooking legume that adds body and protein to soups and curries.",
    tags: ["gut health", "plant protein", "legume"],
  },
  "green lentils": {
    supports: ["Fibre", "Plant protein", "Iron"],
    whyItMatters: "A firmer lentil that holds its shape well — good for salads and hearty dishes.",
    tags: ["gut health", "plant protein", "legume", "iron"],
  },
  "tinned lentils": {
    supports: ["Fibre", "Plant protein"],
    whyItMatters: "A convenient shortcut to adding plant protein and fibre to meals.",
    tags: ["gut health", "plant protein", "legume"],
  },

  // ── Whole grains ──────────────────────────────────────────────────────────
  "oats": {
    supports: ["Fibre", "Slow-release energy"],
    highlights: ["Rich in beta-glucan fibre", "Slow-release whole grain"],
    whyItMatters: "A whole grain that can support steadier energy levels and a varied breakfast.",
    howToChoose: [
      "Rolled or steel-cut over instant varieties",
      "Plain, unsweetened versions",
    ],
    tags: ["whole grain", "fibre", "energy"],
  },
  "rolled oats": {
    supports: ["Fibre", "Slow-release energy"],
    whyItMatters: "A whole grain that can support steadier energy levels and a varied breakfast.",
    howToChoose: [
      "Plain, unsweetened versions",
      "Avoid pre-sweetened sachets",
    ],
    tags: ["whole grain", "fibre", "energy"],
  },
  "porridge oats": {
    supports: ["Fibre", "Slow-release energy"],
    whyItMatters: "A whole grain that can support steadier energy levels and a varied breakfast.",
    tags: ["whole grain", "fibre", "energy"],
  },
  "brown rice": {
    supports: ["Whole grain", "Fibre"],
    whyItMatters: "Retains more fibre and nutrients than white rice due to less processing.",
    tags: ["whole grain", "fibre"],
  },
  "quinoa": {
    supports: ["Plant protein", "Whole grain"],
    whyItMatters: "One of the few plant foods that provides all essential amino acids.",
    tags: ["plant protein", "whole grain", "gluten free"],
  },

  // ── Vegetables ────────────────────────────────────────────────────────────
  "spinach": {
    supports: ["Iron", "Folate"],
    highlights: ["Naturally high in folate", "Small amounts are very nutrient-rich"],
    whyItMatters: "A leafy green that adds nutritional variety to meals with relatively little effort.",
    goodToKnow: "Pairs well with vitamin C-rich foods, which can help with iron absorption.",
    tags: ["leafy greens", "iron", "folate"],
  },
  "baby spinach": {
    supports: ["Iron", "Folate"],
    whyItMatters: "A mild-flavoured leafy green that's easy to add to salads, pasta, or eggs.",
    tags: ["leafy greens", "iron"],
  },
  "broccoli": {
    supports: ["Fibre", "Vitamin C"],
    whyItMatters: "A versatile brassica that adds texture, colour, and nutrients to many dishes.",
    goodToKnow: "Light steaming tends to preserve more nutrients than boiling.",
    tags: ["vitamin c", "fibre", "brassica"],
  },
  "sweet potato": {
    supports: ["Fibre", "Beta-carotene"],
    whyItMatters: "A naturally sweet root vegetable that provides slow-release energy and a vibrant colour.",
    tags: ["fibre", "beta-carotene", "energy"],
  },
  "sweet potatoes": {
    supports: ["Fibre", "Beta-carotene"],
    whyItMatters: "A naturally sweet root vegetable that provides slow-release energy and a vibrant colour.",
    tags: ["fibre", "beta-carotene", "energy"],
  },
  "garlic": {
    supports: ["Gut health"],
    whyItMatters: "A staple allium that adds depth to cooking and contributes to a varied plant-food diet.",
    tags: ["gut health", "flavour", "allium"],
  },
  "tinned tomatoes": {
    supports: ["Lycopene", "Vegetables"],
    highlights: ["Naturally high in lycopene"],
    whyItMatters: "A versatile store cupboard staple that contributes toward vegetable variety in meals.",
    goodToKnow: "Cooking and processing tomatoes can increase availability of lycopene.",
    tags: ["vegetables", "lycopene"],
  },
  "tomatoes": {
    supports: ["Lycopene", "Vitamin C"],
    whyItMatters: "A widely used salad and cooking ingredient that adds freshness and colour.",
    tags: ["vegetables", "lycopene", "vitamin c"],
  },

  // ── Fruit ─────────────────────────────────────────────────────────────────
  "blueberries": {
    supports: ["Antioxidants"],
    highlights: ["Rich in anthocyanins", "Small but very nutrient-rich"],
    whyItMatters: "Rich in natural plant compounds that support cellular health.",
    goodToKnow: "Frozen blueberries retain their nutrients well and are often more affordable.",
    tags: ["antioxidants", "fruit", "gut health"],
  },

  // ── Nuts & Seeds ──────────────────────────────────────────────────────────
  "walnuts": {
    supports: ["Omega-3", "Healthy fats"],
    highlights: ["Plant source of omega-3", "Naturally rich in polyphenols"],
    whyItMatters: "A good plant-based source of omega-3 fatty acids.",
    howToChoose: [
      "Unsalted and raw where possible",
      "Store in a cool, dark place to keep fresh",
    ],
    tags: ["omega-3", "healthy fats", "nuts"],
  },
  "almonds": {
    supports: ["Healthy fats", "Vitamin E"],
    whyItMatters: "A nutritious snack or ingredient with a good range of fats and minerals.",
    howToChoose: [
      "Whole, unsalted and unroasted",
      "Avoid varieties with added oil or sugar",
    ],
    tags: ["healthy fats", "vitamin e", "nuts"],
  },
  "chia seeds": {
    supports: ["Omega-3", "Fibre"],
    highlights: ["Small but very nutrient-rich", "High in soluble fibre"],
    whyItMatters: "A small seed that provides a useful plant-based source of omega-3 and soluble fibre.",
    goodToKnow: "Soaking them before use makes them easier to digest and creates a useful gel texture.",
    tags: ["omega-3", "fibre", "seeds"],
  },
  "flaxseed": {
    supports: ["Omega-3", "Fibre"],
    whyItMatters: "A good plant-based source of omega-3, best absorbed when ground.",
    goodToKnow: "Ground or milled flaxseed is easier to digest than whole seeds.",
    tags: ["omega-3", "fibre", "seeds"],
  },
  "ground flaxseed": {
    supports: ["Omega-3", "Fibre"],
    whyItMatters: "Ground flaxseed is one of the most accessible plant-based omega-3 sources.",
    tags: ["omega-3", "fibre", "seeds"],
  },
  "linseed": {
    supports: ["Omega-3", "Fibre"],
    whyItMatters: "The same seed as flaxseed — a useful plant-based source of omega-3 and fibre.",
    goodToKnow: "Ground or milled versions are easier to digest than whole seeds.",
    tags: ["omega-3", "fibre", "seeds"],
  },
  "pumpkin seeds": {
    supports: ["Magnesium", "Zinc", "Healthy fats"],
    whyItMatters: "A versatile seed that adds texture and a good range of minerals to meals.",
    tags: ["magnesium", "zinc", "seeds", "healthy fats"],
  },

  // ── Fish ──────────────────────────────────────────────────────────────────
  "salmon": {
    supports: ["Omega-3", "Protein"],
    highlights: ["Rich in long-chain omega-3", "Complete protein source"],
    whyItMatters: "An oily fish that provides long-chain omega-3 fatty acids.",
    howToChoose: [
      "Wild-caught where available",
      "MSC-certified for sustainable sourcing",
    ],
    tags: ["omega-3", "oily fish", "protein"],
  },
  "sardines": {
    supports: ["Omega-3", "Calcium", "Protein"],
    whyItMatters: "One of the most sustainable and nutrient-dense oily fish options.",
    howToChoose: [
      "In spring water or olive oil",
      "MSC-certified where possible",
    ],
    tags: ["omega-3", "oily fish", "calcium", "sustainable"],
  },
  "tinned sardines": {
    supports: ["Omega-3", "Calcium", "Protein"],
    whyItMatters: "A convenient, affordable oily fish option with soft edible bones that add calcium.",
    howToChoose: [
      "In spring water or olive oil over brine",
      "MSC-certified where possible",
    ],
    tags: ["omega-3", "oily fish", "calcium", "sustainable"],
  },
  "mackerel": {
    supports: ["Omega-3", "Protein"],
    whyItMatters: "An affordable oily fish that provides a good source of long-chain omega-3.",
    tags: ["omega-3", "oily fish", "protein"],
  },
  "tinned mackerel": {
    supports: ["Omega-3", "Protein"],
    whyItMatters: "A convenient oily fish option — one of the most affordable sources of omega-3.",
    tags: ["omega-3", "oily fish", "protein"],
  },

  // ── Eggs & Dairy ──────────────────────────────────────────────────────────
  "eggs": {
    supports: ["Protein", "Choline"],
    whyItMatters: "A complete protein source with a wide range of uses across meal types.",
    howToChoose: [
      "Free-range or organic where possible",
      "Check use-by dates carefully",
    ],
    tags: ["protein", "complete protein"],
  },
  "kefir": {
    supports: ["Gut health", "Fermented cultures"],
    whyItMatters: "A fermented milk drink that provides live cultures to support gut diversity.",
    howToChoose: [
      "Plain, unsweetened",
      "Look for live or active cultures on the label",
    ],
    tags: ["gut health", "fermented", "probiotic"],
  },
  "greek yogurt": {
    supports: ["Gut health", "Protein"],
    whyItMatters: "A fermented dairy food that provides protein and live cultures for gut variety.",
    howToChoose: [
      "Plain, unsweetened",
      "Look for live cultures",
    ],
    tags: ["gut health", "fermented", "protein"],
  },
  "natural yogurt": {
    supports: ["Gut health", "Protein"],
    whyItMatters: "A fermented dairy food with live cultures that support gut diversity.",
    howToChoose: [
      "Plain, unsweetened",
      "Look for live active cultures",
    ],
    tags: ["gut health", "fermented", "protein"],
  },
  "yogurt": {
    supports: ["Gut health", "Protein"],
    whyItMatters: "A fermented dairy food that provides protein and can support gut variety.",
    howToChoose: [
      "Plain, unsweetened versions",
      "Check for live active cultures",
    ],
    tags: ["gut health", "fermented", "protein"],
  },

  // ── Other ─────────────────────────────────────────────────────────────────
  "dark chocolate": {
    supports: ["Antioxidants"],
    highlights: ["Rich in flavanols", "Source of natural polyphenols"],
    whyItMatters: "Higher-cocoa varieties contain natural plant compounds that support overall health.",
    goodToKnow: "Generally the higher the cocoa content, the lower the added sugar.",
    howToChoose: [
      "70% cocoa or above",
      "Minimal added ingredients",
    ],
    tags: ["antioxidants", "cocoa"],
  },
  "apple cider vinegar": {
    supports: ["Fermented cultures"],
    whyItMatters: "A fermented condiment with a sharp flavour, commonly used to add acidity to dressings.",
    goodToKnow: "Look for 'with the mother' on the label, which indicates live cultures are present.",
    tags: ["fermented", "condiment"],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPantryKnowledge(ingredientKey: string): PantryKnowledge | null {
  return PANTRY_KNOWLEDGE[ingredientKey] ?? null;
}

// Returns true if the item matches a search query against name + knowledge tokens.
export function pantryItemMatchesQuery(
  name: string,
  ingredientKey: string,
  query: string,
): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (name.toLowerCase().includes(q)) return true;
  const k = getPantryKnowledge(ingredientKey);
  if (!k) return false;
  return (
    k.tags.some(t => t.toLowerCase().includes(q)) ||
    k.supports.some(s => s.toLowerCase().includes(q))
  );
}

// ── Micro-insights ────────────────────────────────────────────────────────────

export const MICRO_INSIGHTS = [
  "Different plant foods feed different gut bacteria.",
  "A mix of colours often brings a wider range of nutrients.",
  "Herbs and spices add both flavour and nutrition.",
  "Whole grains tend to keep you fuller for longer.",
  "Cold-pressed oils preserve more of their natural qualities.",
  "Fermented foods like yogurt and kefir support gut diversity.",
  "Leafy greens are one of the easiest ways to add variety to any meal.",
  "Oily fish a couple of times a week is one of the most widely supported dietary habits.",
  "Seeds like chia and flaxseed are small but surprisingly rich in plant-based omega-3.",
];
