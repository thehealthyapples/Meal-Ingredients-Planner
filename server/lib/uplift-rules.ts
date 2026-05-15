/**
 * uplift-rules.ts
 * ===============
 * Human-authored uplift rules registry.
 *
 * Authoring guidelines:
 * - All rules must have reviewedAt before they appear in production matching
 * - Use approved language only: "supports", "may help", "adds", "associated with", "can improve"
 * - Avoid: cures, prevents, guarantees, detox, miracle, clinically proven
 * - Suggestions must be practical and family-realistic
 * - No unrealistic "superfood" behaviour
 */

import type { UpliftRule } from './uplift-types.js';

export const UPLIFT_RULES: UpliftRule[] = [

  // ── MAC & CHEESE ────────────────────────────────────────────────────────────

  {
    id: 'mac-cheese-turmeric-pepper',
    name: 'Mac & cheese — turmeric + black pepper',
    trigger: {
      mealNamePattern: ['mac', 'macaroni', 'mac and cheese', 'mac & cheese'],
      ingredientPattern: ['macaroni', 'mac and cheese'],
    },
    suggestions: [
      {
        ingredient: 'turmeric',
        action: 'add',
        quantity: '½ tsp',
        why: 'Adds colour and supports anti-inflammatory variety. Pair with a pinch of black pepper.',
        evidenceTopic: 'curcumin-bioavailability',
        learnMoreSlug: 'turmeric-and-black-pepper',
      },
      {
        ingredient: 'black pepper',
        action: 'add',
        quantity: 'a pinch',
        why: 'Supports absorption of turmeric when used together. Adds a mild warmth.',
        evidenceTopic: 'piperine-curcumin',
        learnMoreSlug: 'turmeric-and-black-pepper',
      },
      {
        ingredient: 'frozen peas',
        action: 'add',
        quantity: 'a handful',
        why: 'Adds fibre and plant variety without changing the flavour much.',
        evidenceTopic: 'legume-fibre',
        learnMoreSlug: 'fibre-and-gut-diversity',
      },
    ],
    nutritionTags: ['fibre', 'micronutrient', 'gut-diversity'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'mac-cheese-wholemeal-swap',
    name: 'Mac & cheese — wholemeal pasta swap',
    trigger: {
      mealNamePattern: ['mac', 'macaroni'],
      ingredientPattern: ['macaroni', 'pasta'],
    },
    suggestions: [
      {
        ingredient: 'wholemeal macaroni',
        action: 'swap',
        why: 'Swapping to wholemeal pasta adds fibre and can help maintain steadier energy levels.',
        evidenceTopic: 'wholegrain-fibre',
        learnMoreSlug: 'wholegrain-swaps',
      },
    ],
    nutritionTags: ['fibre', 'wholefood-swap'],
    confidence: 'high',
    priority: 20,
    reviewedAt: '2026-05-01',
  },

  // ── SALAD ───────────────────────────────────────────────────────────────────

  {
    id: 'salad-seeds-evoo-acv',
    name: 'Salad — seeds, olive oil, apple cider vinegar',
    trigger: {
      mealNamePattern: ['salad'],
      categoryPattern: ['salad'],
    },
    suggestions: [
      {
        ingredient: 'mixed seeds',
        action: 'add',
        quantity: '1 tbsp',
        why: 'Adds healthy fats, plant protein, and a satisfying texture.',
        evidenceTopic: 'seeds-omega-fatty-acids',
        learnMoreSlug: 'seeds-in-salads',
      },
      {
        ingredient: 'extra virgin olive oil',
        action: 'add',
        quantity: '1 tbsp',
        why: 'Adds monounsaturated fats and supports absorption of fat-soluble vitamins from the salad.',
        evidenceTopic: 'evoo-fat-soluble-vitamins',
        learnMoreSlug: 'olive-oil-benefits',
      },
      {
        ingredient: 'apple cider vinegar',
        action: 'add',
        quantity: '1 tsp',
        why: 'A tangy dressing base associated with supporting blood sugar balance after meals.',
        evidenceTopic: 'acetic-acid-glycaemic',
        learnMoreSlug: 'apple-cider-vinegar',
      },
    ],
    nutritionTags: ['healthy-fat', 'protein', 'micronutrient'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  // ── PASTA ───────────────────────────────────────────────────────────────────

  {
    id: 'pasta-wholemeal-swap',
    name: 'Pasta — wholemeal swap',
    trigger: {
      mealNamePattern: ['pasta', 'spaghetti', 'penne', 'linguine', 'tagliatelle', 'bolognese', 'carbonara'],
      ingredientPattern: ['pasta', 'spaghetti', 'penne', 'linguine'],
    },
    suggestions: [
      {
        ingredient: 'wholemeal pasta',
        action: 'swap',
        why: 'Wholemeal pasta adds fibre and can support more sustained energy throughout the day.',
        evidenceTopic: 'wholegrain-fibre',
        learnMoreSlug: 'wholegrain-swaps',
      },
    ],
    nutritionTags: ['fibre', 'wholefood-swap'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'pasta-spinach-boost',
    name: 'Pasta — spinach or greens addition',
    trigger: {
      mealNamePattern: ['pasta', 'spaghetti', 'bolognese', 'penne', 'linguine'],
    },
    suggestions: [
      {
        ingredient: 'spinach',
        action: 'add',
        quantity: 'a handful',
        why: 'Wilts easily into hot pasta, adding iron, folate, and plant variety.',
        evidenceTopic: 'leafy-green-micronutrients',
        learnMoreSlug: 'greens-in-pasta',
      },
    ],
    nutritionTags: ['micronutrient', 'fibre', 'gut-diversity'],
    confidence: 'high',
    priority: 20,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'pasta-lentil-protein',
    name: 'Pasta bolognese — lentil protein boost',
    trigger: {
      mealNamePattern: ['bolognese', 'ragu'],
    },
    suggestions: [
      {
        ingredient: 'red lentils',
        action: 'add',
        quantity: '3 tbsp',
        why: 'Red lentils blend into bolognese invisibly, adding fibre, protein, and plant variety.',
        evidenceTopic: 'legume-protein-fibre',
        learnMoreSlug: 'hidden-lentils',
      },
    ],
    nutritionTags: ['fibre', 'protein', 'gut-diversity'],
    confidence: 'high',
    priority: 15,
    reviewedAt: '2026-05-01',
  },

  // ── SOUP ────────────────────────────────────────────────────────────────────

  {
    id: 'soup-legume-fibre',
    name: 'Soup — legume fibre addition',
    trigger: {
      mealNamePattern: ['soup'],
      categoryPattern: ['soup'],
    },
    suggestions: [
      {
        ingredient: 'cannellini beans',
        action: 'add',
        quantity: 'half a tin',
        why: 'Adds fibre and plant protein. Blends well into most soups without overpowering flavour.',
        evidenceTopic: 'legume-fibre',
        learnMoreSlug: 'beans-in-soup',
      },
    ],
    nutritionTags: ['fibre', 'protein', 'gut-diversity'],
    confidence: 'high',
    priority: 15,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'soup-turmeric-boost',
    name: 'Soup — turmeric addition',
    trigger: {
      mealNamePattern: ['soup'],
      categoryPattern: ['soup'],
    },
    suggestions: [
      {
        ingredient: 'turmeric',
        action: 'add',
        quantity: '½ tsp',
        why: 'Adds a mild warmth and colour. Associated with supporting anti-inflammatory variety in the diet.',
        evidenceTopic: 'curcumin-bioavailability',
        learnMoreSlug: 'turmeric-in-soups',
      },
    ],
    nutritionTags: ['micronutrient', 'antioxidant'],
    confidence: 'medium',
    priority: 30,
    reviewedAt: '2026-05-01',
  },

  // ── TOAST ───────────────────────────────────────────────────────────────────

  {
    id: 'toast-wholemeal-swap',
    name: 'Toast — wholemeal bread swap',
    trigger: {
      mealNamePattern: ['toast', 'toasted', 'on toast'],
      mealSlotPattern: ['breakfast'],
    },
    suggestions: [
      {
        ingredient: 'wholemeal bread',
        action: 'swap',
        why: 'Wholemeal bread adds fibre and is associated with supporting steadier blood sugar levels compared to white bread.',
        evidenceTopic: 'wholegrain-glycaemic',
        learnMoreSlug: 'wholegrain-swaps',
      },
    ],
    nutritionTags: ['fibre', 'wholefood-swap'],
    compatibleMealSlots: ['breakfast', 'lunch', 'snack'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'toast-seeds-nut-butter',
    name: 'Toast — nut butter or seeds',
    trigger: {
      mealNamePattern: ['toast', 'toasted'],
      mealSlotPattern: ['breakfast'],
    },
    suggestions: [
      {
        ingredient: 'nut butter',
        action: 'add',
        why: 'Adds healthy fats and protein to make breakfast more filling.',
        evidenceTopic: 'nut-protein-fat',
        learnMoreSlug: 'nut-butter-toast',
      },
    ],
    nutritionTags: ['protein', 'healthy-fat'],
    compatibleMealSlots: ['breakfast', 'snack'],
    confidence: 'high',
    priority: 20,
    reviewedAt: '2026-05-01',
  },

  // ── BREAKFAST CEREAL ─────────────────────────────────────────────────────────

  {
    id: 'cereal-seeds-addition',
    name: 'Cereal — seeds and berries addition',
    trigger: {
      mealNamePattern: ['cereal', 'porridge', 'oat', 'muesli', 'granola'],
      categoryPattern: ['breakfast'],
      mealSlotPattern: ['breakfast'],
    },
    suggestions: [
      {
        ingredient: 'chia seeds',
        action: 'add',
        quantity: '1 tsp',
        why: 'Adds fibre, omega-3 fatty acids, and can improve feeling of fullness.',
        evidenceTopic: 'chia-seeds-fibre-omega3',
        learnMoreSlug: 'seeds-at-breakfast',
      },
      {
        ingredient: 'fresh berries',
        action: 'add',
        quantity: 'a small handful',
        why: 'Adds antioxidants, vitamin C, and natural sweetness without added sugar.',
        evidenceTopic: 'berries-antioxidants',
        learnMoreSlug: 'berries-benefits',
      },
    ],
    nutritionTags: ['fibre', 'healthy-fat', 'antioxidant'],
    compatibleMealSlots: ['breakfast'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'porridge-resistant-starch',
    name: 'Porridge — resistant starch opportunity',
    trigger: {
      mealNamePattern: ['porridge', 'oat', 'overnight oat'],
      ingredientPattern: ['oats', 'porridge oats', 'rolled oats'],
    },
    suggestions: [
      {
        ingredient: 'overnight oats',
        action: 'swap',
        why: 'Cooling cooked oats overnight increases resistant starch content, which may support gut bacteria diversity.',
        evidenceTopic: 'resistant-starch-gut',
        learnMoreSlug: 'resistant-starch',
      },
    ],
    nutritionTags: ['resistant-starch', 'gut-diversity'],
    compatibleMealSlots: ['breakfast'],
    confidence: 'medium',
    priority: 25,
    reviewedAt: '2026-05-01',
  },

  // ── PIZZA ───────────────────────────────────────────────────────────────────

  {
    id: 'pizza-rocket-addition',
    name: 'Pizza — rocket or greens addition',
    trigger: {
      mealNamePattern: ['pizza'],
      categoryPattern: ['pizza'],
    },
    suggestions: [
      {
        ingredient: 'rocket',
        action: 'add',
        quantity: 'a handful',
        why: 'Add fresh rocket after baking to boost micronutrient variety and add a peppery flavour.',
        evidenceTopic: 'leafy-green-micronutrients',
        learnMoreSlug: 'greens-on-pizza',
      },
    ],
    nutritionTags: ['micronutrient', 'fibre'],
    confidence: 'high',
    priority: 15,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'pizza-wholemeal-base',
    name: 'Pizza — wholemeal base swap',
    trigger: {
      mealNamePattern: ['pizza', 'flatbread pizza'],
    },
    suggestions: [
      {
        ingredient: 'wholemeal pizza base',
        action: 'swap',
        why: 'A wholemeal base adds fibre and can help make the meal more filling.',
        evidenceTopic: 'wholegrain-fibre',
        learnMoreSlug: 'wholegrain-swaps',
      },
    ],
    nutritionTags: ['fibre', 'wholefood-swap'],
    confidence: 'medium',
    priority: 25,
    reviewedAt: '2026-05-01',
  },

  // ── RICE MEALS ───────────────────────────────────────────────────────────────

  {
    id: 'rice-resistant-starch',
    name: 'Rice — resistant starch opportunity',
    trigger: {
      mealNamePattern: ['rice', 'fried rice', 'rice bowl'],
      ingredientPattern: ['white rice', 'basmati', 'jasmine rice'],
    },
    suggestions: [
      {
        ingredient: 'cooled cooked rice',
        action: 'boost',
        why: 'Cooking rice and cooling it overnight increases resistant starch, which may support gut bacteria diversity.',
        evidenceTopic: 'resistant-starch-gut',
        learnMoreSlug: 'resistant-starch',
      },
    ],
    nutritionTags: ['resistant-starch', 'gut-diversity'],
    confidence: 'medium',
    priority: 20,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'rice-brown-swap',
    name: 'Rice — brown rice swap',
    trigger: {
      mealNamePattern: ['rice bowl', 'egg fried rice'],
      ingredientPattern: ['white rice', 'basmati', 'jasmine rice'],
    },
    suggestions: [
      {
        ingredient: 'brown rice',
        action: 'swap',
        why: 'Brown rice adds fibre and nutrients retained in the outer grain layer.',
        evidenceTopic: 'wholegrain-fibre',
        learnMoreSlug: 'wholegrain-swaps',
      },
    ],
    nutritionTags: ['fibre', 'wholefood-swap'],
    confidence: 'high',
    priority: 15,
    reviewedAt: '2026-05-01',
  },

  // ── CURRY ────────────────────────────────────────────────────────────────────

  {
    id: 'curry-turmeric-lentil',
    name: 'Curry — turmeric and lentil additions',
    trigger: {
      mealNamePattern: ['curry', 'korma', 'tikka', 'masala', 'dal', 'dhal'],
      categoryPattern: ['curry'],
    },
    suggestions: [
      {
        ingredient: 'red lentils',
        action: 'add',
        quantity: '3 tbsp',
        why: 'Adds fibre and plant protein. Red lentils blend into curry sauces naturally.',
        evidenceTopic: 'legume-protein-fibre',
        learnMoreSlug: 'lentils-in-curry',
      },
      {
        ingredient: 'turmeric',
        action: 'boost',
        quantity: '½ tsp extra',
        why: 'Supports anti-inflammatory variety in the diet. Goes naturally with curry spices.',
        evidenceTopic: 'curcumin-bioavailability',
        learnMoreSlug: 'turmeric-and-black-pepper',
      },
    ],
    nutritionTags: ['fibre', 'protein', 'gut-diversity', 'antioxidant'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'curry-fermented-addition',
    name: 'Curry — fermented side addition',
    trigger: {
      mealNamePattern: ['curry', 'korma', 'tikka', 'masala'],
    },
    suggestions: [
      {
        ingredient: 'natural yoghurt',
        action: 'add',
        quantity: '2 tbsp',
        why: 'A cooling fermented dairy side that can add gut-friendly bacteria variety.',
        evidenceTopic: 'fermented-dairy-gut',
        learnMoreSlug: 'fermented-foods',
      },
    ],
    nutritionTags: ['fermented', 'gut-diversity'],
    excludedDietTypes: ['vegan', 'dairy-free'],
    confidence: 'high',
    priority: 20,
    reviewedAt: '2026-05-01',
  },

  // ── WRAPS ────────────────────────────────────────────────────────────────────

  {
    id: 'wrap-wholemeal-swap',
    name: 'Wraps — wholemeal tortilla swap',
    trigger: {
      mealNamePattern: ['wrap', 'burrito', 'fajita'],
      ingredientPattern: ['tortilla', 'wrap'],
    },
    suggestions: [
      {
        ingredient: 'wholemeal tortilla',
        action: 'swap',
        why: 'Wholemeal wraps add fibre and can help the meal feel more filling.',
        evidenceTopic: 'wholegrain-fibre',
        learnMoreSlug: 'wholegrain-swaps',
      },
    ],
    nutritionTags: ['fibre', 'wholefood-swap'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'wrap-greens-addition',
    name: 'Wraps — leafy greens addition',
    trigger: {
      mealNamePattern: ['wrap', 'burrito', 'fajita'],
    },
    suggestions: [
      {
        ingredient: 'spinach or mixed leaves',
        action: 'add',
        quantity: 'a handful',
        why: 'Adds folate, iron, and plant variety with minimal impact on flavour.',
        evidenceTopic: 'leafy-green-micronutrients',
        learnMoreSlug: 'greens-in-wraps',
      },
    ],
    nutritionTags: ['micronutrient', 'fibre'],
    confidence: 'high',
    priority: 20,
    reviewedAt: '2026-05-01',
  },

  // ── BAKED POTATO ─────────────────────────────────────────────────────────────

  {
    id: 'baked-potato-resistant-starch',
    name: 'Baked potato — resistant starch opportunity',
    trigger: {
      mealNamePattern: ['baked potato', 'jacket potato'],
      ingredientPattern: ['potato', 'baking potato'],
    },
    suggestions: [
      {
        ingredient: 'cooled baked potato',
        action: 'boost',
        why: 'Cooling cooked potato increases resistant starch, which may support gut bacteria variety.',
        evidenceTopic: 'resistant-starch-gut',
        learnMoreSlug: 'resistant-starch',
      },
    ],
    nutritionTags: ['resistant-starch', 'gut-diversity'],
    confidence: 'medium',
    priority: 20,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'baked-potato-legume-topping',
    name: 'Baked potato — legume topping',
    trigger: {
      mealNamePattern: ['baked potato', 'jacket potato'],
    },
    suggestions: [
      {
        ingredient: 'baked beans',
        action: 'add',
        why: 'Classic and practical. Adds fibre and plant protein as a simple topping.',
        evidenceTopic: 'legume-fibre',
        learnMoreSlug: 'beans-benefits',
      },
    ],
    nutritionTags: ['fibre', 'protein'],
    confidence: 'high',
    priority: 15,
    reviewedAt: '2026-05-01',
  },

  // ── SANDWICHES ───────────────────────────────────────────────────────────────

  {
    id: 'sandwich-wholemeal-swap',
    name: 'Sandwich — wholemeal bread swap',
    trigger: {
      mealNamePattern: ['sandwich', 'sarnie', 'sub', 'baguette'],
      ingredientPattern: ['bread', 'baguette', 'roll'],
    },
    suggestions: [
      {
        ingredient: 'wholemeal bread',
        action: 'swap',
        why: 'Wholemeal bread adds fibre to keep you fuller for longer.',
        evidenceTopic: 'wholegrain-fibre',
        learnMoreSlug: 'wholegrain-swaps',
      },
    ],
    nutritionTags: ['fibre', 'wholefood-swap'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'sandwich-greens-addition',
    name: 'Sandwich — leafy greens addition',
    trigger: {
      mealNamePattern: ['sandwich', 'sarnie', 'sub'],
    },
    suggestions: [
      {
        ingredient: 'rocket or spinach leaves',
        action: 'add',
        quantity: 'a small handful',
        why: 'Adds micronutrients and gut-friendly plant variety.',
        evidenceTopic: 'leafy-green-micronutrients',
        learnMoreSlug: 'greens-in-sandwiches',
      },
    ],
    nutritionTags: ['micronutrient', 'fibre'],
    confidence: 'high',
    priority: 20,
    reviewedAt: '2026-05-01',
  },

  // ── CHICKEN DINNER ───────────────────────────────────────────────────────────

  {
    id: 'chicken-dinner-greens',
    name: 'Chicken dinner — greens variety',
    trigger: {
      mealNamePattern: ['roast chicken', 'chicken dinner', 'chicken traybake'],
      ingredientPattern: ['chicken breast', 'chicken thigh', 'whole chicken', 'roast chicken'],
    },
    suggestions: [
      {
        ingredient: 'broccoli',
        action: 'add',
        quantity: 'a portion',
        why: 'Adds fibre, vitamin C, and plant variety alongside chicken.',
        evidenceTopic: 'cruciferous-micronutrients',
        learnMoreSlug: 'cruciferous-vegetables',
      },
      {
        ingredient: 'kale or spring greens',
        action: 'add',
        quantity: 'a handful',
        why: 'A fibre-rich leafy green that adds variety and supports gut diversity.',
        evidenceTopic: 'leafy-green-micronutrients',
        learnMoreSlug: 'greens-benefits',
      },
    ],
    nutritionTags: ['fibre', 'micronutrient', 'gut-diversity'],
    confidence: 'high',
    priority: 10,
    reviewedAt: '2026-05-01',
  },

  {
    id: 'chicken-turmeric-marinade',
    name: 'Chicken — turmeric marinade',
    trigger: {
      ingredientPattern: ['chicken breast', 'chicken thigh', 'chicken drumstick'],
    },
    suggestions: [
      {
        ingredient: 'turmeric',
        action: 'add',
        quantity: '½ tsp into marinade',
        why: 'A simple marinade addition that supports anti-inflammatory variety. Pair with black pepper.',
        evidenceTopic: 'curcumin-bioavailability',
        learnMoreSlug: 'turmeric-and-black-pepper',
      },
    ],
    nutritionTags: ['micronutrient', 'antioxidant'],
    confidence: 'medium',
    priority: 30,
    reviewedAt: '2026-05-01',
  },

  // ── STIR FRY ─────────────────────────────────────────────────────────────────

  {
    id: 'stir-fry-seeds-protein',
    name: 'Stir fry — seeds and extra protein',
    trigger: {
      mealNamePattern: ['stir fry', 'stir-fry', 'noodle stir fry'],
    },
    suggestions: [
      {
        ingredient: 'sesame seeds',
        action: 'add',
        quantity: '1 tsp',
        why: 'Adds healthy fats, calcium, and texture. A traditional finishing touch.',
        evidenceTopic: 'seeds-minerals',
        learnMoreSlug: 'seeds-in-cooking',
      },
      {
        ingredient: 'edamame',
        action: 'add',
        quantity: 'a handful',
        why: 'Adds plant protein and fibre with a mild flavour that suits most stir fries.',
        evidenceTopic: 'legume-protein-fibre',
        learnMoreSlug: 'edamame-benefits',
      },
    ],
    nutritionTags: ['protein', 'healthy-fat', 'fibre'],
    confidence: 'high',
    priority: 15,
    reviewedAt: '2026-05-01',
  },

  // ── UNREVIEWED EXAMPLE ────────────────────────────────────────────────────────
  // This rule has no reviewedAt and must be silently excluded from production matching.

  {
    id: 'draft-omelette-rule',
    name: 'Draft — omelette additions (unreviewed)',
    trigger: {
      mealNamePattern: ['omelette', 'omelet'],
    },
    suggestions: [
      {
        ingredient: 'spinach',
        action: 'add',
        why: 'Draft suggestion — under review.',
      },
    ],
    nutritionTags: ['micronutrient'],
    confidence: 'low',
    priority: 50,
    // reviewedAt intentionally absent — must not appear in production matching
  },
];

export default UPLIFT_RULES;
