/**
 * Phase 1 Deterministic Substitution Rule Library
 *
 * Version-controlled, typed, deterministic rules for household-safe ingredient
 * substitutions. These rules are the source of truth for cooking logic.
 *
 * AI is downstream of this module — it may enrich wording but CANNOT override
 * the substitutions, cooking notes, timing adjustments, or prohibited phrases
 * defined here.
 *
 * DO NOT add database-managed rules, user-editable rules, or AI-generated rules
 * to this file. All rules must be authored, reviewed, and versioned here.
 */

export const RULE_LIBRARY_VERSION = "1.0.0";

// ─── Trigger types ────────────────────────────────────────────────────────────

export type DietTrigger =
  | "vegetarian"
  | "vegan"
  | "dairy_free"
  | "gluten_free"
  | "nut_free";

// ─── Core output type ─────────────────────────────────────────────────────────

/**
 * A deterministic substitution decision produced by the rule engine.
 * This is passed as a constraint block to the AI — the AI enriches wording
 * only and cannot override any field here.
 */
export interface CookingAdjustment {
  /** The ingredient string as it appeared in the recipe (for display) */
  matchedIngredient: string;
  /** Canonical replacement name the AI must use */
  replacement: string;
  /** Short human-readable reason (e.g. "vegetarian household") */
  reason: string;
  /**
   * Cooking notes the AI must faithfully implement in the rewritten method.
   * These encode correct culinary behaviour for the substitute ingredient.
   */
  cookingNotes: string[];
  /**
   * Phrases that must NOT appear in the AI's output after substitution.
   * Used for post-generation validation.
   */
  prohibitedPhrases: string[];
  /** Optional timing changes the AI must apply to affected steps */
  timingAdjustments?: string[];
}

// ─── Rule structure ───────────────────────────────────────────────────────────

interface SubstitutionStrategy {
  replacement: string;
  cookingNotes: string[];
  prohibitedPhrases: string[];
  timingAdjustments?: string[];
}

interface SubstitutionRule {
  id: string;
  version: number;
  /** Regex patterns to detect this ingredient in a single ingredient-list string */
  ingredientPatterns: RegExp[];
  /** Diet triggers that activate this rule */
  triggers: DietTrigger[];
  /** Ranked strategies — first usable strategy wins */
  strategies: SubstitutionStrategy[];
  /** Template for the human-readable reason chip */
  reasonTemplate: (restriction: string) => string;
}

// ─── Phase 1 rule definitions ─────────────────────────────────────────────────

const SUBSTITUTION_RULES: SubstitutionRule[] = [
  // ── 1. Beef mince ──────────────────────────────────────────────────────────
  {
    id: "beef_mince",
    version: 1,
    ingredientPatterns: [
      /\bbeef\s+mince\b/i,
      /\bminced\s+beef\b/i,
      /\bground\s+beef\b/i,
      /\bbeef\s+mincemeat\b/i,
    ],
    triggers: ["vegetarian", "vegan"],
    strategies: [
      {
        replacement: "green or brown lentils",
        cookingNotes: [
          "Lentils do not need browning — add them to the pan once onions are softened and stir to coat in the spices",
          "Simmer lentils for 20–25 minutes (not 8–10 minutes like mince) until tender but not mushy",
          "Add a small splash of extra stock or water if the mixture dries out during simmering",
          "No need to break apart or drain fat — stir gently throughout",
        ],
        prohibitedPhrases: [
          "brown the lentils",
          "break up the lentils",
          "drain the fat",
          "cook until no pink remains",
        ],
        timingAdjustments: [
          "Extend simmer time to 20–25 minutes for lentils (vs 8–10 for mince)",
        ],
      },
      {
        replacement: "plant-based mince (e.g. Quorn or Beyond Meat)",
        cookingNotes: [
          "Plant-based mince cooks faster than beef — 5–8 minutes over medium-high is sufficient",
          "It may release less liquid than beef mince; add a splash of stock if the mixture looks dry",
          "No need to drain fat after browning",
        ],
        prohibitedPhrases: [
          "drain the fat",
          "cook until no pink remains",
        ],
      },
      {
        replacement: "firm tofu, crumbled",
        cookingNotes: [
          "Press tofu for 20 minutes to remove moisture, then crumble by hand into rough mince-sized pieces",
          "Pan-fry crumbled tofu in a little oil over medium-high heat, stirring occasionally, until golden (8–10 minutes)",
          "Season well — tofu absorbs flavour from spices and sauce",
        ],
        prohibitedPhrases: [
          "drain the fat",
          "cook until no pink remains",
          "brown the tofu mince",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — beef substituted`,
  },

  // ── 2. Pork mince ──────────────────────────────────────────────────────────
  {
    id: "pork_mince",
    version: 1,
    ingredientPatterns: [
      /\bpork\s+mince\b/i,
      /\bminced\s+pork\b/i,
      /\bground\s+pork\b/i,
    ],
    triggers: ["vegetarian", "vegan"],
    strategies: [
      {
        replacement: "green or brown lentils",
        cookingNotes: [
          "Lentils do not need browning — add once onions are softened and stir to coat in spices",
          "Simmer for 20–25 minutes until tender",
          "Add a splash of stock or water if the mixture dries out",
        ],
        prohibitedPhrases: [
          "brown the lentils",
          "break up the lentils",
          "drain the fat",
          "cook until no pink remains",
        ],
        timingAdjustments: [
          "Extend simmer time to 20–25 minutes",
        ],
      },
      {
        replacement: "plant-based mince (e.g. Quorn or Beyond Meat)",
        cookingNotes: [
          "Plant-based mince cooks in 5–8 minutes; no fat to drain",
        ],
        prohibitedPhrases: [
          "drain the fat",
          "cook until no pink remains",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — pork substituted`,
  },

  // ── 3. Chicken breast ──────────────────────────────────────────────────────
  {
    id: "chicken_breast",
    version: 1,
    ingredientPatterns: [
      /\bchicken\s+breast[s]?\b/i,
      /\bchicken\s+thigh[s]?\b/i,
      /\bchicken\s+fillet[s]?\b/i,
      /\bdiced\s+chicken\b/i,
      /\bchicken\s+piece[s]?\b/i,
    ],
    triggers: ["vegetarian", "vegan"],
    strategies: [
      {
        replacement: "firm tofu (pressed and cubed)",
        cookingNotes: [
          "Press tofu for 30 minutes before cooking to remove excess moisture — this helps it brown rather than steam",
          "Pan-fry tofu cubes over medium-high heat until golden on each side (3–4 minutes per side); tofu is already safe to eat so no internal temperature check is needed",
          "For curries and stews: add tofu in the last 5 minutes of cooking to prevent it breaking apart",
        ],
        prohibitedPhrases: [
          "check internal temperature",
          "juices run clear",
          "pink inside",
          "cooked through",
          "undercooked chicken",
        ],
      },
      {
        replacement: "chickpeas (drained and rinsed)",
        cookingNotes: [
          "Chickpeas are already cooked — add them in the last 10 minutes of a curry or stew to warm through",
          "No need to check doneness; simply heat until piping hot",
          "For pan dishes, fry briefly over medium-high to give some colour before adding sauce",
        ],
        prohibitedPhrases: [
          "check internal temperature",
          "juices run clear",
          "pink inside",
          "cooked through",
        ],
      },
      {
        replacement: "cauliflower florets",
        cookingNotes: [
          "Cut cauliflower into florets roughly the same size as the original chicken pieces",
          "Roast at 200°C for 20–25 minutes until golden, or add to curries/stews and simmer until tender (15 minutes)",
          "Season well — cauliflower takes on flavour from spices and sauces",
        ],
        prohibitedPhrases: [
          "check internal temperature",
          "juices run clear",
          "pink inside",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — chicken substituted`,
  },

  // ── 4. Bacon & lardons ────────────────────────────────────────────────────
  {
    id: "bacon",
    version: 1,
    ingredientPatterns: [
      /\bbacon\b/i,
      /\blardons?\b/i,
      /\bpancetta\b/i,
      /\bprosciutto\b/i,
      /\bstreaky\s+bacon\b/i,
      /\bback\s+bacon\b/i,
    ],
    triggers: ["vegetarian", "vegan"],
    strategies: [
      {
        replacement: "smoked paprika and mushrooms",
        cookingNotes: [
          "Add ½ tsp smoked paprika per rasher of bacon to the oil at the start of cooking to replicate the smoky flavour",
          "Use portobello or chestnut mushrooms sliced thin to replicate the texture of bacon/lardons",
          "Fry mushrooms over medium-high heat until they release their liquid and begin to colour (5–7 minutes); season with a pinch of salt",
          "There is no fat to render — the oil itself carries the smoky flavour",
        ],
        prohibitedPhrases: [
          "render the fat",
          "bacon fat",
          "crispy bacon strips",
          "until the bacon is crispy",
          "lardons are golden",
        ],
      },
      {
        replacement: "smoked tofu strips",
        cookingNotes: [
          "Slice smoked tofu into thin strips to mimic lardons or bacon rashers",
          "Pan-fry over medium-high heat in a little oil until lightly coloured (4–5 minutes per side)",
          "No fat to render; add directly to the dish as you would bacon",
        ],
        prohibitedPhrases: [
          "render the fat",
          "bacon fat",
          "until the bacon is crispy",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — bacon substituted`,
  },

  // ── 5. Shellfish (prawns, mussels, clams, scallops) ───────────────────────
  {
    id: "shellfish",
    version: 1,
    ingredientPatterns: [
      /\bprawns?\b/i,
      /\bshrimps?\b/i,
      /\bmussels?\b/i,
      /\bclams?\b/i,
      /\bscallops?\b/i,
      /\blogster\b/i,
      /\bcrab\b/i,
      /\bking\s+prawns?\b/i,
      /\btiger\s+prawns?\b/i,
    ],
    triggers: ["vegetarian", "vegan"],
    strategies: [
      {
        replacement: "smoked chickpeas",
        cookingNotes: [
          "Drain and rinse the chickpeas — do not peel or de-vein; chickpeas have no shells or heads",
          "There are no shells or heads to reserve; skip any stock-making step that relied on shellfish shells",
          "Use vegetable stock instead, enhanced with smoked paprika and a strip of dried kelp or kombu for seafood-like depth",
          "Add chickpeas to the pan once the sauce base is ready and warm through for 3–4 minutes",
        ],
        prohibitedPhrases: [
          "de-vein",
          "peel and de-vein",
          "reserve the shells",
          "reserve the heads",
          "prawn stock",
          "shellfish stock",
          "shrimp stock",
          "mussel stock",
          "prawn shells",
          "prawn heads",
        ],
      },
      {
        replacement: "king oyster mushrooms (torn into strips)",
        cookingNotes: [
          "Tear king oyster mushrooms lengthwise into thick strips to mimic the shape of prawns or scallops",
          "Pan-fry over high heat in a little oil until golden and slightly caramelised (3–4 minutes per side)",
          "No shells, heads, or de-veining — season simply with salt, pepper, and a squeeze of lemon",
          "Use vegetable stock, enhanced with smoked paprika or a strip of dried kelp, in place of any shellfish stock",
        ],
        prohibitedPhrases: [
          "de-vein",
          "peel and de-vein",
          "reserve the shells",
          "reserve the heads",
          "prawn stock",
          "shellfish stock",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — shellfish substituted`,
  },

  // ── 6. Cream (double, single, whipping, creme fraiche) ────────────────────
  {
    id: "cream",
    version: 1,
    ingredientPatterns: [
      /\bdouble\s+cream\b/i,
      /\bsingle\s+cream\b/i,
      /\bwhipping\s+cream\b/i,
      /\bheavy\s+cream\b/i,
      /\bcreme\s+fraiche\b/i,
      /\bcrème\s+fraîche\b/i,
      /\bsour\s+cream\b/i,
      /\bfull.?fat\s+cream\b/i,
    ],
    triggers: ["dairy_free", "vegan"],
    strategies: [
      {
        replacement: "oat cream",
        cookingNotes: [
          "Use oat cream as a 1:1 substitute by volume",
          "Oat cream can split at very high temperatures — add it off the heat or at a low simmer (do not boil vigorously after adding)",
          "Stir gently when incorporating; do not whisk aggressively",
        ],
        prohibitedPhrases: [
          "double cream",
          "heavy cream",
          "whipping cream",
          "whipped cream",
        ],
      },
      {
        replacement: "coconut cream",
        cookingNotes: [
          "Use full-fat coconut cream for richness; shake the can well before opening",
          "Coconut cream is best for Asian-inspired, curry, and dessert dishes — it adds a mild coconut flavour",
          "Add off the heat or at a low simmer to avoid splitting",
        ],
        prohibitedPhrases: [
          "double cream",
          "heavy cream",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — dairy-free cream substituted`,
  },

  // ── 7. Cheese ──────────────────────────────────────────────────────────────
  {
    id: "cheese",
    version: 1,
    ingredientPatterns: [
      /\bcheddar\b/i,
      /\bmozzarella\b/i,
      /\bparmesan\b/i,
      /\bparmigiano\b/i,
      /\bgrana\s+padano\b/i,
      /\bfeta\b/i,
      /\bhalloumi\b/i,
      /\bbrie\b/i,
      /\bcamembert\b/i,
      /\bcream\s+cheese\b/i,
      /\bricotta\b/i,
      /\bgouda\b/i,
      /\bedam\b/i,
      /\bgruyère\b/i,
      /\bemmental\b/i,
      /\bstilton\b/i,
      /\bgorgonzola\b/i,
      /\bgrated\s+cheese\b/i,
      /\bhard\s+cheese\b/i,
    ],
    triggers: ["dairy_free", "vegan"],
    strategies: [
      {
        replacement: "dairy-free cheese (e.g. Violife or similar)",
        cookingNotes: [
          "Dairy-free cheese does not melt the same way as dairy cheese — add it in the final 2 minutes of cooking only",
          "For gratins or baked dishes, sprinkle on top and grill for 2–3 minutes to soften without burning",
          "Do not grate onto very hot dishes as it may become oily; add at the end of cooking",
          "For a parmesan-like flavour without melting, use nutritional yeast instead (2 tbsp per 30g parmesan)",
        ],
        prohibitedPhrases: [
          "melt the cheese",
          "until cheese is melted",
          "cheese sauce",
        ],
      },
      {
        replacement: "nutritional yeast",
        cookingNotes: [
          "Use 2 tablespoons of nutritional yeast per 30g of hard cheese (parmesan, pecorino) for a cheesy, umami flavour",
          "Nutritional yeast does not melt — stir it directly into sauces or sprinkle over the finished dish",
          "For a creamier sauce, combine with a small amount of oat cream and blend",
        ],
        prohibitedPhrases: [
          "melt the nutritional yeast",
          "grated parmesan",
          "grated cheese",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — dairy-free cheese substituted`,
  },

  // ── 8. Wheat pasta ─────────────────────────────────────────────────────────
  {
    id: "wheat_pasta",
    version: 1,
    ingredientPatterns: [
      /\bspaghetti\b/i,
      /\bpenne\b/i,
      /\brigatoni\b/i,
      /\bfusilli\b/i,
      /\bfarfalle\b/i,
      /\btagliatelle\b/i,
      /\blinguine\b/i,
      /\bfettuccine\b/i,
      /\borzo\b/i,
      /\blasagne\s+sheets?\b/i,
      /\blasagna\s+sheets?\b/i,
      /\bconchiglie\b/i,
      /\bmacaroni\b/i,
      /\bpasta\b/i,
      /\bnoodles?\b/i,
      /\budon\b/i,
      /\bwheat\s+noodles?\b/i,
    ],
    triggers: ["gluten_free"],
    strategies: [
      {
        replacement: "gluten-free pasta (rice or corn-based)",
        cookingNotes: [
          "Gluten-free pasta overcooks quickly — begin checking for doneness 2 minutes before the package time",
          "Rinse briefly with cold water after draining to prevent clumping",
          "Add the pasta to the sauce immediately after draining — gluten-free pasta dries out and sticks faster than wheat pasta",
          "Use slightly less pasta water in the sauce if starch binding is needed, as GF pasta starch behaves differently",
        ],
        prohibitedPhrases: [
          "al dente wheat pasta",
          "pasta water contains gluten starch",
        ],
        timingAdjustments: [
          "Check pasta for doneness 2 minutes earlier than the package time",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — gluten-free pasta substituted`,
  },
];

// ─── Diet trigger detection ────────────────────────────────────────────────────

/**
 * Maps free-text restriction/diet strings (from eater profiles) to typed triggers.
 */
export function detectActiveTriggers(restrictions: string[]): Set<DietTrigger> {
  const active = new Set<DietTrigger>();
  for (const r of restrictions) {
    const lower = r.toLowerCase();
    if (/\bvegan\b/.test(lower)) {
      active.add("vegan");
      active.add("vegetarian"); // vegan implies vegetarian
      active.add("dairy_free");  // vegan implies dairy-free
    } else if (/\bvegetarian\b/.test(lower)) {
      active.add("vegetarian");
    }
    if (/\bdairy[\s-]?free\b|\bdairy\b|\blactose\b/.test(lower)) {
      active.add("dairy_free");
    }
    if (/\bgluten[\s-]?free\b|\bcoeliac\b|\bceliac\b/.test(lower)) {
      active.add("gluten_free");
    }
    if (/\bnut[\s-]?free\b|\btree\s+nuts?\b|\bpeanut\b/.test(lower)) {
      active.add("nut_free");
    }
  }
  return active;
}

// ─── Rule engine ──────────────────────────────────────────────────────────────

/**
 * Runs the substitution rule engine against a recipe's ingredient list.
 *
 * @param ingredients - Raw ingredient strings from the recipe
 * @param activeRestrictions - All diet types + hard restrictions from conflicting eaters
 * @returns Ordered list of deterministic substitution decisions
 */
export function matchSubstitutionRules(
  ingredients: string[],
  activeRestrictions: string[],
): CookingAdjustment[] {
  const activeTriggers = detectActiveTriggers(activeRestrictions);
  if (activeTriggers.size === 0) return [];

  const adjustments: CookingAdjustment[] = [];
  // Track which rule IDs have already matched to avoid duplicate adjustments
  const matchedRuleIds = new Set<string>();

  for (const ingredient of ingredients) {
    for (const rule of SUBSTITUTION_RULES) {
      if (matchedRuleIds.has(rule.id)) continue;

      // Check if any trigger is active for this rule
      const triggerActive = rule.triggers.some(t => activeTriggers.has(t));
      if (!triggerActive) continue;

      // Check if any ingredient pattern matches
      const matched = rule.ingredientPatterns.some(p => p.test(ingredient));
      if (!matched) continue;

      // Pick first (preferred) strategy
      const strategy = rule.strategies[0];

      // Build reason from first active trigger
      const activeRestriction = activeRestrictions.find(r =>
        rule.triggers.some(t => {
          const lower = r.toLowerCase();
          if (t === "vegetarian") return /\bvegetarian\b/.test(lower);
          if (t === "vegan") return /\bvegan\b/.test(lower);
          if (t === "dairy_free") return /\bdairy[\s-]?free\b|\bdairy\b|\blactose\b/.test(lower);
          if (t === "gluten_free") return /\bgluten[\s-]?free\b|\bcoeliac\b|\bceliac\b/.test(lower);
          if (t === "nut_free") return /\bnut[\s-]?free\b/.test(lower);
          return false;
        })
      ) ?? activeRestrictions[0] ?? "dietary requirement";

      adjustments.push({
        matchedIngredient: ingredient,
        replacement: strategy.replacement,
        reason: rule.reasonTemplate(activeRestriction),
        cookingNotes: strategy.cookingNotes,
        prohibitedPhrases: strategy.prohibitedPhrases,
        timingAdjustments: strategy.timingAdjustments,
      });

      matchedRuleIds.add(rule.id);
    }
  }

  return adjustments;
}

/**
 * Collects all prohibited phrases from a set of cooking adjustments.
 * Used to augment post-generation validation.
 */
export function collectProhibitedPhrases(adjustments: CookingAdjustment[]): string[] {
  return Array.from(new Set(adjustments.flatMap(a => a.prohibitedPhrases)));
}
