export interface WholeFoodAlternative {
  title: string;
  emoji: string;
  effort: 'easy' | 'medium' | 'involved';
  timeMinutes: number;
  ingredients: string[];
  method: string;
  tip?: string;
}

type PatternEntry = {
  patterns: RegExp[];
  alternative: WholeFoodAlternative;
};

const ALTERNATIVES: PatternEntry[] = [
  {
    patterns: [/\b(tortilla|wrap|chapati|chapatti|roti|flatbread)\b/i],
    alternative: {
      title: 'Homemade Flatbreads',
      emoji: '🫓',
      effort: 'medium',
      timeMinutes: 30,
      ingredients: [
        '200g plain or wholemeal flour',
        '100ml warm water',
        '½ tsp salt',
        '1 tbsp olive oil',
      ],
      method:
        'Mix flour, salt, oil and water into a soft dough. Rest 10 minutes, then divide into 4–6 balls and roll thin. Dry-fry in a hot pan for 1–2 minutes each side until lightly charred.',
      tip: 'Stack with baking paper and freeze — reheat in a pan in 2 minutes. Far fewer additives than any shop version.',
    },
  },
  {
    patterns: [/\b(naan)\b/i],
    alternative: {
      title: 'Homemade Naan',
      emoji: '🫓',
      effort: 'medium',
      timeMinutes: 45,
      ingredients: [
        '300g plain flour',
        '150g natural yoghurt',
        '1 tsp baking powder',
        '1 tbsp neutral oil',
        'pinch of salt',
      ],
      method:
        'Combine all ingredients into a soft dough. Rest 20 minutes. Divide, roll thin, and cook in a very hot dry pan or under a hot grill for 1–2 minutes each side.',
      tip: 'No yeast needed. Works well from frozen — reheat in a hot pan from frozen.',
    },
  },
  {
    patterns: [/\b(pizza\s*base|pizza\s*dough)\b/i],
    alternative: {
      title: 'Homemade Pizza Dough',
      emoji: '🍕',
      effort: 'medium',
      timeMinutes: 75,
      ingredients: [
        '500g strong white flour',
        '7g fast-action yeast',
        '1 tsp salt',
        '300ml warm water',
        '1 tbsp olive oil',
      ],
      method:
        'Mix into a dough and knead 10 minutes. Prove 1 hour until doubled. Divide into 4 balls, roll very thin. Top and bake at maximum oven temperature for 8–12 minutes.',
      tip: 'Freeze as balls of dough after the first prove. Defrost overnight in the fridge for great pizza any day.',
    },
  },
  {
    patterns: [/\b(pesto)\b/i],
    alternative: {
      title: 'Homemade Pesto',
      emoji: '🌿',
      effort: 'easy',
      timeMinutes: 10,
      ingredients: [
        'Large bunch of fresh basil',
        '30g pine nuts or walnuts',
        '30g parmesan (or nutritional yeast)',
        '1 clove garlic',
        '4–5 tbsp extra-virgin olive oil',
        'squeeze of lemon',
        'salt to taste',
      ],
      method:
        'Blitz all ingredients in a food processor until a rough paste forms. Add more oil if too thick. Taste and adjust seasoning.',
      tip: 'Cover the surface with a thin layer of oil to stop browning. Keeps 1 week in the fridge, or freeze in ice cube trays.',
    },
  },
  {
    patterns: [/\b(tomato\s*sauce|pasta\s*sauce|marinara|passata)\b/i],
    alternative: {
      title: 'Simple Tomato Sauce',
      emoji: '🍅',
      effort: 'easy',
      timeMinutes: 20,
      ingredients: [
        '1 tin (400g) chopped tomatoes',
        '2 cloves garlic',
        '1 tbsp olive oil',
        'small bunch basil (or 1 tsp dried)',
        'salt and black pepper',
      ],
      method:
        'Fry sliced garlic in olive oil for 1 minute. Add tomatoes, season well, and simmer on a low heat for 15 minutes until thickened. Add basil at the end.',
      tip: 'Batch cook and freeze in portions. Far lower in sugar and additives than most jarred sauces.',
    },
  },
  {
    patterns: [/\b(curry\s*paste|curry\s*sauce)\b/i],
    alternative: {
      title: 'Simple Curry Paste',
      emoji: '🫙',
      effort: 'medium',
      timeMinutes: 15,
      ingredients: [
        '2 tsp each: ground cumin, coriander',
        '1 tsp turmeric',
        '1–2 tsp chilli powder',
        '1 thumb-sized piece of fresh ginger',
        '3 cloves garlic',
        '1 tbsp neutral oil',
      ],
      method:
        'Pound or blitz all ingredients to a rough paste. Fry in a little oil for 2 minutes before adding other ingredients to a curry.',
      tip: 'Make a larger batch and store in the fridge for up to 2 weeks. No thickeners, colours or preservatives.',
    },
  },
  {
    patterns: [/\b(hummus|houmous)\b/i],
    alternative: {
      title: 'Homemade Hummus',
      emoji: '🫘',
      effort: 'easy',
      timeMinutes: 10,
      ingredients: [
        '1 tin (400g) chickpeas, drained',
        '2 tbsp tahini',
        'juice of 1 lemon',
        '1 small clove garlic',
        '2 tbsp olive oil',
        'salt and cold water to loosen',
      ],
      method:
        'Blitz all ingredients in a food processor until smooth, adding a little cold water for a creamier texture. Taste and adjust seasoning.',
      tip: 'A stick blender works fine. Ready in 5 minutes, no preservatives or thickeners.',
    },
  },
  {
    patterns: [/\b(guacamole)\b/i],
    alternative: {
      title: 'Homemade Guacamole',
      emoji: '🥑',
      effort: 'easy',
      timeMinutes: 5,
      ingredients: [
        '2 ripe avocados',
        'juice of 1 lime',
        '½ small red onion, finely diced',
        'salt',
        'optional: 1 chilli, small bunch coriander, 1 diced tomato',
      ],
      method:
        'Halve and scoop avocados. Mash with a fork — leave slightly chunky. Stir in lime, onion and seasoning. Taste and adjust.',
      tip: 'Best eaten the same day. Press cling film directly onto the surface to slow browning.',
    },
  },
  {
    patterns: [/\b(salsa)\b/i],
    alternative: {
      title: 'Fresh Tomato Salsa',
      emoji: '🍅',
      effort: 'easy',
      timeMinutes: 10,
      ingredients: [
        '4 ripe tomatoes',
        '½ red onion',
        'juice of 1 lime',
        'small bunch coriander',
        'salt',
        'optional: 1 fresh chilli',
      ],
      method:
        'Dice everything finely, combine, and season well. Leave 10 minutes for the flavours to develop.',
      tip: 'Much more vibrant than jarred salsa. No preservatives and you control the heat.',
    },
  },
  {
    patterns: [/\b(salad\s*dressing|vinaigrette|dressing)\b/i],
    alternative: {
      title: 'Simple Vinaigrette',
      emoji: '🫙',
      effort: 'easy',
      timeMinutes: 5,
      ingredients: [
        '3 tbsp extra-virgin olive oil',
        '1 tbsp red wine vinegar or lemon juice',
        '½ tsp Dijon mustard',
        'pinch of salt',
        'optional: ½ tsp honey',
      ],
      method:
        'Add everything to a small jar and shake well. Adjust oil-to-acid ratio to taste.',
      tip: 'Whole jar in 2 minutes, lasts a week in the fridge. No emulsifiers or stabilisers.',
    },
  },
  {
    patterns: [/\b(mayonnaise|mayo)\b/i],
    alternative: {
      title: 'Quick Mayonnaise',
      emoji: '🥚',
      effort: 'medium',
      timeMinutes: 10,
      ingredients: [
        '1 egg yolk',
        '1 tsp Dijon mustard',
        '200ml light olive or sunflower oil',
        'juice of ½ lemon',
        'salt',
      ],
      method:
        'Whisk egg yolk and mustard together. Add the oil drop by drop at first, whisking constantly — as it thickens, pour in a slow thin stream. Season with lemon and salt.',
      tip: 'Use a stick blender with a wide-mouthed jar for a near-foolproof emulsion in under 60 seconds.',
    },
  },
  {
    patterns: [/\b(granola)\b/i],
    alternative: {
      title: 'Homemade Granola',
      emoji: '🥣',
      effort: 'easy',
      timeMinutes: 30,
      ingredients: [
        '200g rolled oats',
        '3 tbsp honey or maple syrup',
        '2 tbsp neutral oil',
        'handful of mixed nuts or seeds',
        'pinch of cinnamon',
        'optional: dried fruit, added after baking',
      ],
      method:
        'Mix oats, syrup, oil and cinnamon. Spread in a thin layer on a baking tray. Bake at 160°C for 20–25 minutes, stirring halfway. Cool completely before storing.',
      tip: 'Must cool fully to get a crisp texture. Keeps 2 weeks in an airtight jar. Far less sugar than most shop versions.',
    },
  },
  {
    patterns: [/\b(muesli)\b/i],
    alternative: {
      title: 'Simple Homemade Muesli',
      emoji: '🥣',
      effort: 'easy',
      timeMinutes: 5,
      ingredients: [
        '200g rolled oats',
        'handful each: mixed nuts, seeds',
        'handful of dried fruit (raisins, apricots, dates)',
        'optional: coconut flakes, cacao nibs',
      ],
      method:
        'Simply combine all ingredients in a jar or container. No cooking required.',
      tip: 'Use unsweetened dried fruit — they add enough natural sweetness. Control your own sugar level completely.',
    },
  },
  {
    patterns: [/\b(energy\s*bar|snack\s*bar|cereal\s*bar|oat\s*bar|flapjack)\b/i],
    alternative: {
      title: 'Homemade Oat Bars',
      emoji: '🟫',
      effort: 'easy',
      timeMinutes: 40,
      ingredients: [
        '200g oats',
        '100g nut butter or unsalted butter',
        '4 tbsp honey or maple syrup',
        'handful mixed seeds or dried fruit',
        'pinch of salt',
      ],
      method:
        'Melt butter and honey together. Stir in oats, seeds and salt. Press firmly into a lined tin. Bake at 160°C for 20 minutes or chill 2 hours for softer bars.',
      tip: 'Cut while still warm for cleanest slices. No added sugars, syrup or preservatives beyond what you add yourself.',
    },
  },
  {
    patterns: [/\b(breadcrumb|panko)\b/i],
    alternative: {
      title: 'Homemade Breadcrumbs',
      emoji: '🍞',
      effort: 'easy',
      timeMinutes: 15,
      ingredients: [
        'Stale bread — any type',
      ],
      method:
        'Blitz in a food processor or grate coarsely. For dried breadcrumbs, spread on a tray and bake at 150°C for 10–15 minutes until just golden.',
      tip: 'Never throw away stale bread. Freeze fresh breadcrumbs in a bag and use straight from frozen. Zero additives.',
    },
  },
  {
    patterns: [/\b(spice\s*mix|spice\s*blend|seasoning\s*mix|mixed\s*spice)\b/i],
    alternative: {
      title: 'Blend Your Own Spice Mix',
      emoji: '🌶️',
      effort: 'easy',
      timeMinutes: 5,
      ingredients: [
        'Individual ground spices to your mix (e.g. cumin, coriander, paprika, turmeric, chilli, ginger, cinnamon)',
        'Mix ratios to taste',
        'Store in an airtight jar',
      ],
      method:
        'Measure your spices into a small jar and shake to combine. Label it and use within 6 months.',
      tip: 'Buying individual spices costs less per portion and avoids the anti-caking agents common in blended mixes.',
    },
  },
  {
    patterns: [/\b(stock|broth|bouillon)\b/i],
    alternative: {
      title: 'Simple Homemade Stock',
      emoji: '🍲',
      effort: 'medium',
      timeMinutes: 60,
      ingredients: [
        'Vegetable peelings, bones or a carcass',
        '1 onion, 2 carrots, 2 celery stalks',
        'bay leaves, peppercorns',
        'cold water to cover',
      ],
      method:
        'Put everything in a large pot, cover with cold water and bring to the boil. Reduce heat and simmer for 45–60 minutes. Strain through a sieve and season lightly.',
      tip: 'Freeze in ice cube trays for easy portioning. Dramatically lower in salt than most stock cubes and no added flavour enhancers.',
    },
  },
  {
    patterns: [/\b(falafel)\b/i],
    alternative: {
      title: 'Homemade Falafel',
      emoji: '🫘',
      effort: 'medium',
      timeMinutes: 35,
      ingredients: [
        '1 tin (400g) chickpeas, drained and dried well',
        '½ onion',
        '2 cloves garlic',
        '1 tsp each: ground cumin, ground coriander',
        '2 tbsp plain flour',
        'salt and pepper',
        'oil for frying or baking',
      ],
      method:
        'Blitz chickpeas, onion, garlic and spices to a rough paste in a food processor — not too smooth. Mix in flour and season. Shape into balls or patties. Fry in shallow oil, or bake at 190°C for 20–25 minutes.',
      tip: 'Baked falafel is leaner and less messy. Make a big batch — cooked falafel freezes well and reheats in the oven in 10 minutes.',
    },
  },
  {
    patterns: [/\b(yoghurt|yogurt)\b/i],
    alternative: {
      title: 'Homemade Yoghurt',
      emoji: '🍦',
      effort: 'involved',
      timeMinutes: 480,
      ingredients: [
        '1 litre whole milk',
        '2 tbsp live plain yoghurt (as starter)',
      ],
      method:
        'Heat milk to 85°C, then cool to 43°C. Stir in the live yoghurt thoroughly. Pour into a pre-warmed vacuum flask or a bowl in a very low oven (50°C max). Leave undisturbed for 6–8 hours until set. Refrigerate.',
      tip: 'You need a thermometer, but once the method is routine it is practically hands-off. Rich in live cultures with no added sugars, thickeners or stabilisers.',
    },
  },
  {
    patterns: [/\b(bread|loaf|sourdough)\b/i],
    alternative: {
      title: 'Simple Homemade Bread',
      emoji: '🍞',
      effort: 'involved',
      timeMinutes: 120,
      ingredients: [
        '500g strong white or wholemeal flour',
        '7g fast-action dried yeast',
        '1 tsp salt',
        '300ml warm water',
        '1 tbsp oil (optional)',
      ],
      method:
        'Combine into a dough and knead for 10 minutes. Prove in a covered bowl for 1 hour until doubled. Shape, transfer to a tin, prove 30 minutes. Bake at 220°C for 25–30 minutes until hollow when tapped.',
      tip: 'Takes about 2 hours total but mostly waiting. Slice and freeze — just pop slices straight in the toaster from frozen.',
    },
  },
];

export function getWholeFoodAlternative(itemName: string): WholeFoodAlternative | null {
  const lower = itemName.toLowerCase();
  for (const entry of ALTERNATIVES) {
    if (entry.patterns.some(rx => rx.test(lower))) {
      return entry.alternative;
    }
  }
  return null;
}

export function effortLabel(effort: WholeFoodAlternative['effort']): string {
  switch (effort) {
    case 'easy': return 'Easy';
    case 'medium': return 'Medium';
    case 'involved': return 'Takes some time';
  }
}

export function effortColor(effort: WholeFoodAlternative['effort']): string {
  switch (effort) {
    case 'easy': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40';
    case 'medium': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40';
    case 'involved': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40';
  }
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `~${h} hr`;
  return `~${h} hr ${m} min`;
}
