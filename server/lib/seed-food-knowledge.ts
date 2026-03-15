import { db } from "../db";
import { foodKnowledge } from "@shared/schema";
import { log } from "../index";

const ENTRIES = [
  {
    slug: "acidity-regulator",
    type: "additive",
    title: "Acidity Regulator",
    shortSummary: "A food additive used to control or maintain the pH of a product.",
    whyThaHighlightsThis: "Acidity regulators are among the most common additives in processed foods. While many are low-risk (like citric acid), some are used to mask poor-quality ingredients or extend shelf life in ways that signal heavy processing.",
    whatToKnow: "Common acidity regulators include citric acid (E330), lactic acid (E270), and sodium citrate (E331). They appear in everything from fizzy drinks to ready meals and condiments. The additive itself is often harmless, but its presence usually means the food has been significantly processed.",
    simplerAlternatives: "Lemon juice and vinegar are natural ways to add acidity to home-cooked food without any added regulators.",
    tags: ["additive", "acidity", "e-number", "processing"],
    source: null,
    isActive: true,
  },
  {
    slug: "emulsifier",
    type: "additive",
    title: "Emulsifier",
    shortSummary: "Additives that keep fat and water from separating in processed foods.",
    whyThaHighlightsThis: "Emulsifiers like E471 and E472 are widespread in baked goods, spreads, and ready meals. Emerging research suggests some emulsifiers may affect gut microbiome health and promote inflammation, though evidence is still developing.",
    whatToKnow: "You'll find emulsifiers in most shop-bought bread, pastries, chocolate bars, ice cream, and sauces. Common ones to look for: lecithin (E322), mono- and diglycerides of fatty acids (E471), polysorbate 80 (E433). They're a strong signal of ultra-processed food.",
    simplerAlternatives: "Homemade bread, sauces, and dressings need no emulsifiers. An egg yolk or mustard can act as a natural emulsifier in home cooking.",
    tags: ["additive", "emulsifier", "e-number", "gut-health", "ultra-processed"],
    source: null,
    isActive: true,
  },
  {
    slug: "preservative",
    type: "additive",
    title: "Preservative",
    shortSummary: "Additives that extend the shelf life of food by preventing microbial growth.",
    whyThaHighlightsThis: "Preservatives allow manufacturers to produce food far in advance and ship it long distances — convenience that often comes at a cost to nutritional quality and ingredient simplicity. Their presence usually indicates a highly processed product.",
    whatToKnow: "Common preservatives include sodium benzoate (E211), potassium sorbate (E202), and sodium nitrite (E250) found in cured meats. Some, like nitrites, are associated with increased health risks at high intake. Fresh whole foods require no preservatives.",
    simplerAlternatives: "Fresh produce, batch cooking, and freezing are the most effective preservative-free strategies. Fermentation (yoghurt, kimchi, sourdough) is a natural preservation method with added benefits.",
    tags: ["additive", "preservative", "e-number", "shelf-life"],
    source: null,
    isActive: true,
  },
  {
    slug: "stabiliser",
    type: "additive",
    title: "Stabiliser",
    shortSummary: "Additives used to maintain the texture and consistency of processed foods.",
    whyThaHighlightsThis: "Stabilisers are often invisible on the label — used in yoghurt, sauces, ice cream, and ready meals to give a creamy or thick texture that the real ingredients alone wouldn't provide. They are a marker of cost-cutting and heavy processing.",
    whatToKnow: "Common stabilisers include xanthan gum (E415), guar gum (E412), and carrageenan (E407). Carrageenan in particular has been linked to gut irritation in some studies. If a product needs stabilisers to hold together, it's worth asking what's missing from the real ingredients.",
    simplerAlternatives: "Whole-milk natural yoghurt, real cream, and properly reduced sauces achieve texture through natural means — no stabilisers needed.",
    tags: ["additive", "stabiliser", "e-number", "texture", "gut-health"],
    source: null,
    isActive: true,
  },
  {
    slug: "flavouring",
    type: "additive",
    title: "Flavouring",
    shortSummary: "Substances added to food to create or enhance flavour, often replacing real ingredients.",
    whyThaHighlightsThis: "The word 'flavouring' on a label can conceal hundreds of individual chemicals. It's a signal that real food has been replaced with a cheaper imitation. Natural and artificial flavourings are not meaningfully different in terms of how they are produced or regulated.",
    whatToKnow: "Flavourings don't have to be listed individually — manufacturers can group them under one word. This makes it impossible to know exactly what you're eating. They appear heavily in crisps, ready meals, sauces, confectionery, and snack foods.",
    simplerAlternatives: "Fresh herbs, spices, lemon zest, garlic, and quality ingredients provide flavour without the need for any added flavourings.",
    tags: ["additive", "flavouring", "ultra-processed", "transparency"],
    source: null,
    isActive: true,
  },
  {
    slug: "ultra-processed-food",
    type: "processing_flag",
    title: "Ultra-Processed Food (UPF)",
    shortSummary: "Foods that have been substantially altered from their original state, typically containing ingredients not found in home cooking.",
    whyThaHighlightsThis: "Strong and growing evidence links high UPF consumption to increased risk of obesity, type 2 diabetes, cardiovascular disease, and poor mental health. THA is built around reducing UPF intake as a core health goal.",
    whatToKnow: "The NOVA classification system defines ultra-processed foods as those containing additives like emulsifiers, flavourings, and colourings — ingredients that exist to make cheap ingredients taste and look like real food. Examples: most breakfast cereals, supermarket bread, ready meals, fizzy drinks, flavoured yoghurts, and processed meats.",
    simplerAlternatives: "Cook from whole ingredients as often as possible. Batch cooking, freezing meals, and keeping a well-stocked pantry of whole foods (oats, lentils, tinned tomatoes, eggs) makes it easier to avoid UPFs on busy days.",
    tags: ["processing", "upf", "nova", "ultra-processed", "health"],
    source: null,
    isActive: true,
  },
  {
    slug: "tofu",
    type: "ingredient",
    title: "Tofu",
    shortSummary: "A minimally processed soy food made by coagulating soy milk and pressing the curds — a complete plant protein.",
    whyThaHighlightsThis: "Tofu is one of the most nutrient-dense and lowest-impact proteins available. It's a whole-food plant protein that fits into almost any diet and is far removed from the ultra-processed meat alternatives it is sometimes grouped with.",
    whatToKnow: "Plain tofu (firm, silken, or extra-firm) has a very short ingredient list: soybeans, water, and a coagulant (usually nigari or calcium sulphate). It's a good source of protein, calcium, and iron. Avoid heavily marinated or flavoured tofu products which often contain more additives.",
    simplerAlternatives: null,
    tags: ["protein", "plant-based", "whole-food", "soy", "calcium"],
    source: null,
    isActive: true,
  },
  {
    slug: "salmon",
    type: "food",
    title: "Salmon",
    shortSummary: "An oily fish rich in omega-3 fatty acids, protein, and vitamin D.",
    whyThaHighlightsThis: "Salmon is one of the most nutrient-dense animal proteins — providing long-chain omega-3s (EPA and DHA) that are difficult to obtain from plant sources alone. Regular oily fish consumption is consistently associated with better cardiovascular and brain health.",
    whatToKnow: "Both wild and farmed salmon are nutritious. Wild-caught tends to be leaner with a slightly different fatty acid profile. Farmed salmon is more affordable and widely available. Aim for 2 portions of oily fish per week as per NHS guidance. Fresh, frozen, and tinned salmon are all good options.",
    simplerAlternatives: null,
    tags: ["fish", "omega-3", "protein", "whole-food", "oily-fish"],
    source: null,
    isActive: true,
  },
  {
    slug: "oats",
    type: "food",
    title: "Oats",
    shortSummary: "A whole grain with a strong evidence base for heart health, blood sugar management, and sustained energy.",
    whyThaHighlightsThis: "Oats are one of the most affordable, practical, and well-researched whole foods. They contain beta-glucan fibre which lowers LDL cholesterol and supports gut health. Plain oats have no additives — they are exactly what they look like.",
    whatToKnow: "Choose plain rolled oats or steel-cut oats over instant sachets, which often contain added sugar, flavourings, and salt. Oats are naturally gluten-free but often processed in facilities that handle wheat — look for certified GF oats if needed. They work as porridge, overnight oats, granola, and in baking.",
    simplerAlternatives: null,
    tags: ["whole-grain", "fibre", "heart-health", "breakfast", "whole-food"],
    source: null,
    isActive: true,
  },
  {
    slug: "lentils",
    type: "food",
    title: "Lentils",
    shortSummary: "A legume packed with plant protein, fibre, iron, and folate — cheap and highly versatile.",
    whyThaHighlightsThis: "Lentils are one of the most nutrient-dense, affordable, and sustainable foods you can eat. They require no soaking, cook in 20–30 minutes, and are a genuine whole-food source of protein and fibre that the THA score reflects.",
    whatToKnow: "Red, green, and brown lentils all have slightly different textures and uses. Red lentils break down and work well in soups and dals. Green and brown lentils hold their shape for salads and stews. Tinned lentils are equally nutritious and even quicker. Lentils are a key part of the Mediterranean and MIND diets.",
    simplerAlternatives: null,
    tags: ["legume", "plant-protein", "fibre", "whole-food", "iron", "affordable"],
    source: null,
    isActive: true,
  },
  {
    slug: "olive-oil",
    type: "ingredient",
    title: "Olive Oil",
    shortSummary: "A minimally processed fat rich in monounsaturated fatty acids and polyphenols, central to the Mediterranean diet.",
    whyThaHighlightsThis: "Extra-virgin olive oil is one of the most well-studied foods in nutrition. High consumption is consistently linked to reduced cardiovascular risk, lower inflammation, and longer lifespan in Mediterranean populations. It is a whole-food fat with no additives.",
    whatToKnow: "Extra-virgin (EVOO) retains the most polyphenols and flavour. It's suitable for most cooking up to around 180–190°C. 'Light' or 'pure' olive oil is refined and has fewer beneficial compounds. Don't be deterred by the cost — a little goes a long way and it replaces less healthy fats.",
    simplerAlternatives: null,
    tags: ["fat", "mediterranean", "heart-health", "whole-food", "polyphenols"],
    source: null,
    isActive: true,
  },
  {
    slug: "yoghurt",
    type: "food",
    title: "Yoghurt",
    shortSummary: "A fermented dairy food rich in protein, calcium, and live bacterial cultures that support gut health.",
    whyThaHighlightsThis: "Plain whole-milk or Greek yoghurt is a short-ingredient, minimally processed food with real nutritional value. Most flavoured yoghurts, by contrast, are heavily processed products with added sugars, flavourings, and stabilisers — a significant downgrade.",
    whatToKnow: "Look for 'live cultures' on the label and an ingredient list of just milk and bacterial cultures. Greek yoghurt is strained for extra protein and a thicker texture. Avoid low-fat yoghurts that replace fat with sugar or thickeners. Plain yoghurt works as a substitute for cream, soured cream, and mayonnaise in many recipes.",
    simplerAlternatives: null,
    tags: ["dairy", "gut-health", "protein", "calcium", "fermented", "whole-food"],
    source: null,
    isActive: true,
  },
];

export async function seedFoodKnowledge() {
  const existing = await db.select({ slug: foodKnowledge.slug }).from(foodKnowledge);
  if (existing.length >= ENTRIES.length) {
    log(`Food knowledge already seeded (${existing.length} found)`, "seed");
    return;
  }

  const existingSlugs = new Set(existing.map(r => r.slug));
  const toInsert = ENTRIES.filter(e => !existingSlugs.has(e.slug));

  if (toInsert.length === 0) {
    log(`Food knowledge already seeded (${existing.length} found)`, "seed");
    return;
  }

  await db.insert(foodKnowledge).values(toInsert).onConflictDoNothing();
  log(`Seeded ${toInsert.length} food knowledge entries`, "seed");
}
