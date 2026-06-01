/**
 * Deterministic Substitution Rule Library
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
 *
 * Phase 3B additions:
 * - New DietTrigger values for peanut_free, tree_nut_free, sesame_free,
 *   soy_free, mustard_free, shellfish_free, egg_free, coconut_free
 * - Cross-restriction conflict annotations on strategies
 * - Conflict-aware strategy selection (first safe strategy wins)
 * - matchSubstitutionRulesWithConflicts() for detailed conflict reporting
 * - Existing trigger detection and rule behaviour preserved exactly
 */

import { resolveActiveRestrictions, findRestrictionByAlias } from './restrictions/restriction-resolver.js';

export const RULE_LIBRARY_VERSION = "3.0.0";

// ─── Trigger types ────────────────────────────────────────────────────────────

export type DietTrigger =
  | "vegetarian"
  | "vegan"
  | "dairy_free"
  | "gluten_free"
  | "nut_free"       // legacy — kept for backward compat; also activates peanut_free + tree_nut_free
  | "peanut_free"    // Phase 3B
  | "tree_nut_free"  // Phase 3B
  | "sesame_free"    // Phase 3B
  | "soy_free"       // Phase 3B
  | "mustard_free"   // Phase 3B
  | "shellfish_free" // Phase 3B
  | "egg_free"       // Phase 3B
  | "coconut_free";  // Phase 3B

// ─── Core output types ────────────────────────────────────────────────────────

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

/**
 * Records a strategy that was rejected due to cross-restriction conflict.
 * Returned alongside adjustments in matchSubstitutionRulesWithConflicts.
 * Not returned by the legacy matchSubstitutionRules — callers that need
 * conflict visibility must use the WithConflicts variant.
 */
export interface ConflictReport {
  /** The rule that produced this conflict */
  ruleId: string;
  /** The ingredient string that triggered the rule */
  matchedIngredient: string;
  /** Strategies that were considered but rejected */
  rejectedStrategies: Array<{
    /** The substitute that was rejected */
    replacement: string;
    /** Canonical restriction ids that blocked this strategy */
    conflictingRestrictions: string[];
  }>;
  /**
   * Human-readable summary.
   * Present when ALL strategies were rejected (no safe substitute was found).
   */
  message?: string;
}

// ─── Internal rule structure ──────────────────────────────────────────────────

interface SubstitutionStrategy {
  replacement: string;
  cookingNotes: string[];
  prohibitedPhrases: string[];
  timingAdjustments?: string[];
  /**
   * Canonical restriction ids from the library that would make this strategy
   * unsafe. If ANY of these restriction ids are active for the household, this
   * strategy is skipped and the next one is tried.
   *
   * Examples:
   *   tahini strategy for peanut_butter → conflictsWithRestrictions: ['sesame']
   *   coconut aminos strategy for soy_sauce → conflictsWithRestrictions: ['coconut']
   *   tofu strategy for chicken → conflictsWithRestrictions: ['soy']
   */
  conflictsWithRestrictions?: string[];
}

interface SubstitutionRule {
  id: string;
  version: number;
  /** Regex patterns to detect this ingredient in a single ingredient-list string */
  ingredientPatterns: RegExp[];
  /** Diet triggers that activate this rule */
  triggers: DietTrigger[];
  /** Ranked strategies — first safe (non-conflicting) strategy wins */
  strategies: SubstitutionStrategy[];
  /** Template for the human-readable reason chip */
  reasonTemplate: (restriction: string) => string;
}

// ─── Rule definitions ─────────────────────────────────────────────────────────

const SUBSTITUTION_RULES: SubstitutionRule[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // EXISTING RULES (Phase 1) — preserved exactly, conflict annotations added
  // ══════════════════════════════════════════════════════════════════════════

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
        // Phase 3B: soy restriction makes tofu unsafe
        conflictsWithRestrictions: ["soy"],
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
        // Phase 3B: soy restriction makes tofu unsafe
        conflictsWithRestrictions: ["soy"],
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
        // Phase 3B: soy restriction makes tofu unsafe
        conflictsWithRestrictions: ["soy"],
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

  // ── 5. Shellfish (vegetarian/vegan + shellfish allergen) ──────────────────
  //
  // Phase 3B: added shellfish_free trigger so allergen households also get
  // a safe substitution. Strategies (chickpeas, mushrooms) are safe for both
  // vegetarians and shellfish-allergic non-vegetarians.
  {
    id: "shellfish",
    version: 2,
    ingredientPatterns: [
      /\bprawns?\b/i,
      /\bshrimps?\b/i,
      /\bmussels?\b/i,
      /\bclams?\b/i,
      /\bscallops?\b/i,
      /\blobster\b/i,
      /\bcrab\b/i,
      /\bking\s+prawns?\b/i,
      /\btiger\s+prawns?\b/i,
    ],
    triggers: ["vegetarian", "vegan", "shellfish_free"],
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
  //
  // Phase 3B: coconut cream is listed first (preferred for richness and flavour).
  // When coconut is ALSO restricted, it is rejected and oat cream is selected.
  // This makes the cross-restriction conflict visible in ConflictReport.
  {
    id: "cream",
    version: 2,
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
        replacement: "coconut cream",
        // Phase 3B: coconut restriction makes coconut cream unsafe — falls through to oat cream
        conflictsWithRestrictions: ["coconut"],
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

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 3B RULES — new allergen and restriction substitutions
  // ══════════════════════════════════════════════════════════════════════════

  // ── 9. Peanut butter ──────────────────────────────────────────────────────
  //
  // Tahini is the preferred culinary substitute for peanut butter.
  // When sesame is ALSO restricted, tahini is unsafe and the system falls
  // back to sunflower seed butter. This ordering means the cross-restriction
  // conflict (tahini rejected due to sesame) is visible in ConflictReport.
  {
    id: "peanut_butter",
    version: 1,
    ingredientPatterns: [
      /\bpeanut\s+butter\b/i,
    ],
    triggers: ["peanut_free", "nut_free"],
    strategies: [
      {
        replacement: "tahini (sesame seed butter)",
        // Unsafe when sesame is also restricted — falls through to sunflower seed butter
        conflictsWithRestrictions: ["sesame"],
        cookingNotes: [
          "Tahini is thinner than peanut butter — use slightly less (about ¾ of the stated amount)",
          "Tahini adds a slightly bitter, toasty flavour; balance with a small amount of honey or maple syrup if needed",
          "Works particularly well in Asian-style dressings and satay-style sauces",
        ],
        prohibitedPhrases: [
          "peanut butter",
          "peanut",
          "groundnut",
        ],
      },
      {
        replacement: "sunflower seed butter",
        cookingNotes: [
          "Use sunflower seed butter as a 1:1 substitute by volume and weight",
          "The flavour is slightly milder than peanut butter — add a pinch of salt if the dish needs more depth",
          "Works well in sauces, baking, and as a spread",
        ],
        prohibitedPhrases: [
          "peanut butter",
          "peanut",
          "groundnut",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — peanut butter substituted`,
  },

  // ── 10. Peanut oil / groundnut oil ────────────────────────────────────────
  {
    id: "peanut_oil",
    version: 1,
    ingredientPatterns: [
      /\bpeanut\s+oil\b/i,
      /\bgroundnut\s+oil\b/i,
    ],
    triggers: ["peanut_free", "nut_free"],
    strategies: [
      {
        replacement: "neutral oil (sunflower or rapeseed oil)",
        cookingNotes: [
          "Use sunflower or rapeseed oil as a direct 1:1 substitute by volume",
          "Both have a similarly high smoke point to peanut oil and are suitable for stir-frying and deep-frying",
        ],
        prohibitedPhrases: [
          "peanut oil",
          "groundnut oil",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — peanut oil substituted`,
  },

  // ── 11. Satay sauce ────────────────────────────────────────────────────────
  {
    id: "satay_sauce_peanut",
    version: 1,
    ingredientPatterns: [
      /\bsatay\s+sauce\b/i,
      /\bpeanut\s+sauce\b/i,
    ],
    triggers: ["peanut_free", "nut_free"],
    strategies: [
      {
        replacement: "sunflower seed satay-style sauce",
        cookingNotes: [
          "Replace peanut butter with sunflower seed butter in the same quantity",
          "Add coconut milk (or oat cream if coconut is restricted), soy sauce or coconut aminos, lime juice, garlic, and ginger to make the sauce",
          "Taste and adjust seasoning — sunflower seed butter is milder and may need a touch more salt",
        ],
        prohibitedPhrases: [
          "peanut butter",
          "peanut sauce",
          "satay sauce with peanuts",
          "groundnut",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — satay sauce adapted`,
  },

  // ── 12. Almond milk ───────────────────────────────────────────────────────
  {
    id: "almond_milk",
    version: 1,
    ingredientPatterns: [
      /\balmond\s+milk\b/i,
      /\balmond\s+drink\b/i,
    ],
    triggers: ["tree_nut_free", "nut_free"],
    strategies: [
      {
        replacement: "oat milk",
        cookingNotes: [
          "Use oat milk as a 1:1 substitute by volume",
          "Oat milk is mild and slightly sweet — it works well in baking, porridge, and hot drinks",
          "For cooking sauces, barista-style oat milk holds together better at high temperatures",
        ],
        prohibitedPhrases: [
          "almond milk",
          "almond drink",
        ],
      },
      {
        replacement: "oat milk or soy milk",
        // Soy milk conflicts if soy is also restricted; oat milk is always safe
        conflictsWithRestrictions: ["soy"],
        cookingNotes: [
          "Use oat milk or soy milk as a 1:1 substitute; both are neutral in flavour",
        ],
        prohibitedPhrases: [
          "almond milk",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — almond milk substituted`,
  },

  // ── 13. Almond flour / almond meal ────────────────────────────────────────
  //
  // Oat flour is listed first (more widely available and commonly recommended).
  // When gluten is ALSO restricted, oat flour is rejected and sunflower seed flour
  // is selected. This makes the cross-restriction conflict visible in ConflictReport.
  {
    id: "almond_flour",
    version: 1,
    ingredientPatterns: [
      /\balmond\s+flour\b/i,
      /\balmond\s+meal\b/i,
      /\bground\s+almonds?\b/i,
    ],
    triggers: ["tree_nut_free", "nut_free"],
    strategies: [
      {
        replacement: "oat flour",
        // Unsafe when gluten is also restricted — falls through to sunflower seed flour
        conflictsWithRestrictions: ["gluten"],
        cookingNotes: [
          "Blend rolled oats in a food processor until fine to make oat flour",
          "Use as a 1:1 substitute in most recipes; the texture will be slightly denser",
          "Oat flour adds a mild, slightly sweet flavour",
        ],
        prohibitedPhrases: [
          "almond flour",
          "ground almonds",
        ],
      },
      {
        replacement: "sunflower seed flour (ground sunflower seeds)",
        cookingNotes: [
          "Blend raw sunflower seeds in a food processor until fine to make seed flour",
          "Use as a 1:1 substitute by weight in most baking recipes",
          "Sunflower seed flour may turn baked goods slightly green due to a reaction with baking powder — this is harmless; reduce baking powder slightly if appearance matters",
        ],
        prohibitedPhrases: [
          "almond flour",
          "almond meal",
          "ground almonds",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — almond flour substituted`,
  },

  // ── 14. Nut butter (general) ──────────────────────────────────────────────
  {
    id: "nut_butter_general",
    version: 1,
    ingredientPatterns: [
      /\bnut\s+butter\b/i,
      /\bcashew\s+butter\b/i,
      /\bhazelnut\s+butter\b/i,
      /\bwalnut\s+butter\b/i,
      /\bpistachio\s+butter\b/i,
    ],
    triggers: ["tree_nut_free", "nut_free"],
    strategies: [
      {
        replacement: "sunflower seed butter",
        cookingNotes: [
          "Use sunflower seed butter as a 1:1 substitute by volume",
          "It is slightly milder in flavour — a pinch of salt can enhance the depth",
        ],
        prohibitedPhrases: [
          "nut butter",
          "cashew butter",
          "hazelnut",
          "walnut butter",
        ],
      },
      {
        replacement: "tahini (sesame seed butter)",
        // Unsafe when sesame is also restricted
        conflictsWithRestrictions: ["sesame"],
        cookingNotes: [
          "Use tahini as a 1:1 substitute — it is thinner, so start with slightly less",
          "Tahini adds a toasty, slightly bitter note; balance with a little sweetener if needed",
        ],
        prohibitedPhrases: [
          "nut butter",
          "cashew butter",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — nut butter substituted`,
  },

  // ── 15. Tahini ────────────────────────────────────────────────────────────
  {
    id: "tahini_sesame",
    version: 1,
    ingredientPatterns: [
      /\btahini\b/i,
      /\bsesame\s+paste\b/i,
      /\bsesame\s+butter\b/i,
    ],
    triggers: ["sesame_free"],
    strategies: [
      {
        replacement: "sunflower seed butter",
        cookingNotes: [
          "Use sunflower seed butter as a 1:1 substitute by volume",
          "Thin with a little water or lemon juice if the consistency needs adjusting",
          "Sunflower seed butter is milder — add a pinch of salt and a dash of lemon juice to mimic tahini's tangy depth",
        ],
        prohibitedPhrases: [
          "tahini",
          "sesame paste",
          "sesame butter",
          "sesame",
        ],
      },
      {
        replacement: "olive oil (for dressings and dips)",
        cookingNotes: [
          "Replace tahini in dressings and dips with olive oil — it is thinner so use about half the volume",
          "Add a squeeze of lemon juice and a pinch of cumin to compensate for the lost depth",
        ],
        prohibitedPhrases: [
          "tahini",
          "sesame",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — tahini substituted`,
  },

  // ── 16. Sesame oil ────────────────────────────────────────────────────────
  {
    id: "sesame_oil",
    version: 1,
    ingredientPatterns: [
      /\bsesame\s+oil\b/i,
      /\btoasted\s+sesame\s+oil\b/i,
    ],
    triggers: ["sesame_free"],
    strategies: [
      {
        replacement: "neutral oil with a drop of toasted sunflower oil for depth",
        cookingNotes: [
          "Use a neutral oil (sunflower or rapeseed) in the same quantity as the sesame oil",
          "For finishing dishes where sesame oil provides aroma, a tiny drizzle of extra virgin olive oil can replicate the finishing-oil role",
          "The toasty flavour of sesame oil cannot be fully replicated — increase seasoning (soy or coconut aminos) slightly to compensate",
        ],
        prohibitedPhrases: [
          "sesame oil",
          "toasted sesame oil",
          "sesame",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — sesame oil substituted`,
  },

  // ── 17. Soy sauce ─────────────────────────────────────────────────────────
  {
    id: "soy_sauce",
    version: 1,
    ingredientPatterns: [
      /\bsoy\s+sauce\b/i,
      /\bsoya\s+sauce\b/i,
      /\blight\s+soy\s+sauce\b/i,
      /\bdark\s+soy\s+sauce\b/i,
    ],
    triggers: ["soy_free"],
    strategies: [
      {
        replacement: "coconut aminos",
        // Coconut aminos conflict when coconut is also restricted
        conflictsWithRestrictions: ["coconut"],
        cookingNotes: [
          "Use coconut aminos as a 1:1 substitute by volume — it is slightly sweeter and less salty than soy sauce",
          "Reduce any added sugar in the recipe slightly to compensate",
          "Works well in marinades, stir-fries, and as a dipping sauce base",
        ],
        prohibitedPhrases: [
          "soy sauce",
          "soya sauce",
        ],
      },
      {
        replacement: "a pinch of salt with a dash of balsamic vinegar",
        cookingNotes: [
          "For marinades and sauces: use a pinch of salt plus ½ tsp balsamic vinegar per tablespoon of soy sauce",
          "Add a small amount of stock to compensate for the lost liquid volume",
          "This gives umami depth without soy or coconut",
        ],
        prohibitedPhrases: [
          "soy sauce",
          "soya sauce",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — soy sauce substituted`,
  },

  // ── 18. Tofu (as a recipe ingredient, not a substitute) ───────────────────
  {
    id: "tofu_allergen",
    version: 1,
    ingredientPatterns: [
      /\btofu\b/i,
      /\bsilken\s+tofu\b/i,
      /\bfirm\s+tofu\b/i,
      /\bextra.?firm\s+tofu\b/i,
      /\bsmoked\s+tofu\b/i,
    ],
    triggers: ["soy_free"],
    strategies: [
      {
        replacement: "chickpeas (drained and rinsed)",
        cookingNotes: [
          "Chickpeas are already cooked — add them in the last 10 minutes of cooking and warm through",
          "For pan dishes, fry briefly until lightly coloured before adding sauce",
          "No pressing needed — just drain and rinse from the tin",
        ],
        prohibitedPhrases: [
          "tofu",
          "soy",
        ],
      },
      {
        replacement: "butter beans (drained and rinsed)",
        cookingNotes: [
          "Butter beans have a creamy texture similar to silken tofu in some applications",
          "For soups and stews, blend partially for a thick, creamy consistency",
          "Add in the last 10 minutes to warm through",
        ],
        prohibitedPhrases: [
          "tofu",
          "soy",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — tofu substituted`,
  },

  // ── 19. Miso ─────────────────────────────────────────────────────────────
  {
    id: "miso_allergen",
    version: 1,
    ingredientPatterns: [
      /\bmiso\b/i,
      /\bwhite\s+miso\b/i,
      /\bred\s+miso\b/i,
      /\bmiso\s+paste\b/i,
    ],
    triggers: ["soy_free"],
    strategies: [
      {
        replacement: "umami stock paste with nutritional yeast",
        cookingNotes: [
          "For each tablespoon of miso, use 1 tsp of good-quality vegetable stock paste plus 1 tsp nutritional yeast",
          "Stir in off the heat — do not boil after adding, as miso (and this substitute) loses flavour at high temperatures",
          "Add a few drops of rice vinegar or lemon juice for the fermented tang that miso provides",
        ],
        prohibitedPhrases: [
          "miso",
          "miso paste",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — miso substituted`,
  },

  // ── 20. Edamame ───────────────────────────────────────────────────────────
  {
    id: "edamame_allergen",
    version: 1,
    ingredientPatterns: [
      /\bedamame\b/i,
      /\bsoya\s+beans?\b/i,
    ],
    triggers: ["soy_free"],
    strategies: [
      {
        replacement: "broad beans (podded or frozen)",
        cookingNotes: [
          "Broad beans are closest in texture and colour to edamame",
          "Cook from frozen in boiling water for 3–4 minutes; drain and refresh in cold water",
          "Remove the outer skin for a brighter green colour if presentation matters",
        ],
        prohibitedPhrases: [
          "edamame",
          "soya beans",
        ],
      },
      {
        replacement: "peas (frozen or fresh)",
        cookingNotes: [
          "Frozen peas are the simplest substitute — cook from frozen in 2–3 minutes",
          "They are smaller and sweeter than edamame but work well in salads, grain bowls, and stir-fries",
        ],
        prohibitedPhrases: [
          "edamame",
          "soya beans",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — edamame substituted`,
  },

  // ── 21. Tamari ───────────────────────────────────────────────────────────
  {
    id: "tamari_allergen",
    version: 1,
    ingredientPatterns: [
      /\btamari\b/i,
    ],
    triggers: ["soy_free"],
    strategies: [
      {
        replacement: "coconut aminos",
        conflictsWithRestrictions: ["coconut"],
        cookingNotes: [
          "Use coconut aminos as a 1:1 substitute — slightly sweeter and less salty",
          "Reduce added sugar slightly if the recipe is sweet-savoury",
        ],
        prohibitedPhrases: [
          "tamari",
          "soy sauce",
        ],
      },
      {
        replacement: "a pinch of salt with a dash of balsamic vinegar",
        cookingNotes: [
          "For each tablespoon of tamari, use a pinch of salt plus ½ tsp balsamic vinegar",
          "Add a little extra stock to compensate for the lost liquid",
        ],
        prohibitedPhrases: [
          "tamari",
          "soy",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — tamari substituted`,
  },

  // ── 22. Mustard ──────────────────────────────────────────────────────────
  {
    id: "mustard_allergen",
    version: 1,
    ingredientPatterns: [
      /\bdijon\s+mustard\b/i,
      /\benglish\s+mustard\b/i,
      /\bwholegrain\s+mustard\b/i,
      /\bwhole\s+grain\s+mustard\b/i,
      /\bfrench\s+mustard\b/i,
      /\byellow\s+mustard\b/i,
      /\bamerican\s+mustard\b/i,
      /\bmustard\s+powder\b/i,
      /\bmustard\s+seeds?\b/i,
      /\bmustard\s+oil\b/i,
      /\bmustard\b/i,
    ],
    triggers: ["mustard_free"],
    strategies: [
      {
        replacement: "a mixture of herbs and a pinch of turmeric",
        cookingNotes: [
          "For dijon/English mustard in dressings: use ½ tsp white wine vinegar plus a pinch of turmeric and dried thyme per teaspoon of mustard",
          "For mustard in cooking: use a pinch of turmeric for colour and a little extra seasoning for depth",
          "The sharp, pungent heat of mustard cannot be fully replicated — adjust seasoning to taste",
        ],
        prohibitedPhrases: [
          "mustard",
          "dijon",
          "wholegrain mustard",
        ],
      },
      {
        replacement: "horseradish sauce (check other allergens)",
        cookingNotes: [
          "Use a small amount of prepared horseradish sauce as a 1:1 substitute in dressings and marinades",
          "Horseradish has a similar sharp heat to English mustard",
          "Check the label — some horseradish products contain mustard; choose a pure horseradish product",
        ],
        prohibitedPhrases: [
          "mustard",
          "dijon",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — mustard substituted`,
  },

  // ── 23. Oyster sauce (shellfish allergen) ─────────────────────────────────
  {
    id: "oyster_sauce_shellfish",
    version: 1,
    ingredientPatterns: [
      /\boyster\s+sauce\b/i,
    ],
    triggers: ["shellfish_free"],
    strategies: [
      {
        replacement: "dark mushroom sauce or hoisin sauce",
        cookingNotes: [
          "Dark mushroom stir-fry sauce is the closest substitute — use a 1:1 ratio",
          "Alternatively, hoisin sauce provides a similar dark, sweet-savoury depth",
          "Neither contains shellfish; check labels to confirm",
        ],
        prohibitedPhrases: [
          "oyster sauce",
          "shellfish",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — oyster sauce substituted`,
  },

  // ── 24. Egg wash ─────────────────────────────────────────────────────────
  {
    id: "egg_wash",
    version: 1,
    ingredientPatterns: [
      /\begg\s+wash\b/i,
      /\bbrushed\s+with\s+egg\b/i,
    ],
    triggers: ["egg_free"],
    strategies: [
      {
        replacement: "plant-based milk wash",
        cookingNotes: [
          "Brush pastry or bread with oat milk, soy milk, or another plant-based milk in place of egg wash",
          "Plant-based milk gives a slightly less golden colour — brush generously and bake at the stated temperature",
          "For extra shine, add a pinch of sugar to the milk before brushing",
        ],
        prohibitedPhrases: [
          "egg wash",
          "brush with egg",
          "beaten egg",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — egg wash substituted`,
  },

  // ── 25. Eggs (baking binder) ──────────────────────────────────────────────
  //
  // Negative lookahead prevents "egg wash" from matching this rule —
  // egg wash is handled by its own rule (egg_wash) with a different strategy.
  {
    id: "eggs_baking",
    version: 1,
    ingredientPatterns: [
      /\beggs?\b(?!\s+wash)/i,
      /\bbeaten\s+eggs?\b/i,
      /\bfree[\s-]?range\s+eggs?\b/i,
      /\blarge\s+eggs?\b/i,
      /\bmedium\s+eggs?\b/i,
    ],
    triggers: ["egg_free"],
    strategies: [
      {
        replacement: "flax egg (1 tbsp ground flaxseed + 3 tbsp water per egg, rested 5 minutes)",
        cookingNotes: [
          "Mix 1 tablespoon of ground flaxseed with 3 tablespoons of cold water; leave for 5 minutes until it forms a gel",
          "One flax egg replaces one hen's egg as a binder in baking (cakes, muffins, cookies, pancakes)",
          "Flax egg does not provide the same lift as a whisked egg — use alongside baking powder or bicarbonate for rise",
          "The baked result will be slightly denser and may have a faint nutty flavour",
        ],
        prohibitedPhrases: [
          "beat the eggs",
          "whisk the eggs",
          "egg yolk",
          "egg white",
        ],
      },
      {
        replacement: "aquafaba (3 tbsp chickpea water per egg)",
        cookingNotes: [
          "Use 3 tablespoons of aquafaba (liquid from a tin of chickpeas) per egg",
          "Aquafaba can be whisked to stiff peaks for meringues, mousses, and some frostings",
          "For baking, use unwhipped aquafaba as a binder — it works well in brownies and dense cakes",
        ],
        prohibitedPhrases: [
          "beat the eggs",
          "whisk the eggs",
          "egg yolk",
          "egg white",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — eggs substituted`,
  },

  // ── 26. Meringue ─────────────────────────────────────────────────────────
  {
    id: "meringue_egg",
    version: 1,
    ingredientPatterns: [
      /\bmeringue\b/i,
    ],
    triggers: ["egg_free"],
    strategies: [
      {
        replacement: "aquafaba meringue (whipped chickpea water)",
        cookingNotes: [
          "Use the liquid from a tin of chickpeas (aquafaba) in place of egg whites — 3 tbsp aquafaba equals 1 egg white",
          "Whisk with an electric mixer until stiff, glossy peaks form (this takes longer than egg whites — allow 5–10 minutes)",
          "Add cream of tartar (¼ tsp per 3 tbsp aquafaba) to stabilise the foam",
          "Bake at 100°C for 90 minutes for crisp meringues; the texture and colour will be very similar to egg meringue",
        ],
        prohibitedPhrases: [
          "egg whites",
          "meringue",
          "beat the whites",
          "stiff peaks from eggs",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — meringue adapted`,
  },

  // ── 27. Coconut milk ─────────────────────────────────────────────────────
  {
    id: "coconut_milk",
    version: 1,
    ingredientPatterns: [
      /\bcoconut\s+milk\b/i,
      /\blight\s+coconut\s+milk\b/i,
    ],
    triggers: ["coconut_free"],
    strategies: [
      {
        replacement: "oat cream",
        cookingNotes: [
          "Use oat cream as a 1:1 substitute by volume — it gives a creamy texture without coconut flavour",
          "Add off the heat or on a low simmer to prevent splitting",
          "For curries: add a little extra seasoning to compensate for the lost sweetness of coconut",
        ],
        prohibitedPhrases: [
          "coconut milk",
          "coconut",
        ],
      },
      {
        replacement: "dairy cream (check dairy restriction)",
        // Conflicts if dairy is also restricted
        conflictsWithRestrictions: ["dairy"],
        cookingNotes: [
          "Use single or double cream as a 1:1 substitute by volume",
          "It provides richness without coconut flavour and works in curries, soups, and desserts",
        ],
        prohibitedPhrases: [
          "coconut milk",
          "coconut",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — coconut milk substituted`,
  },

  // ── 28. Coconut cream ────────────────────────────────────────────────────
  {
    id: "coconut_cream",
    version: 1,
    ingredientPatterns: [
      /\bcoconut\s+cream\b/i,
      /\bcreamed\s+coconut\b/i,
    ],
    triggers: ["coconut_free"],
    strategies: [
      {
        replacement: "oat cream",
        cookingNotes: [
          "Use oat cream as a 1:1 substitute by volume",
          "For very thick applications (e.g. puddings): reduce oat cream slightly on the heat first to thicken",
        ],
        prohibitedPhrases: [
          "coconut cream",
          "creamed coconut",
          "coconut",
        ],
      },
      {
        replacement: "dairy cream (check dairy restriction)",
        conflictsWithRestrictions: ["dairy"],
        cookingNotes: [
          "Double cream can replace coconut cream 1:1 in most recipes",
          "It provides similar richness without coconut flavour",
        ],
        prohibitedPhrases: [
          "coconut cream",
          "coconut",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — coconut cream substituted`,
  },

  // ── 29. Coconut oil ──────────────────────────────────────────────────────
  {
    id: "coconut_oil",
    version: 1,
    ingredientPatterns: [
      /\bcoconut\s+oil\b/i,
    ],
    triggers: ["coconut_free"],
    strategies: [
      {
        replacement: "neutral oil (sunflower or rapeseed oil)",
        cookingNotes: [
          "Use a neutral oil as a 1:1 substitute by volume",
          "For baking where coconut oil is solid at room temperature: use a mild olive oil or melted vegan butter",
          "There will be no coconut flavour in the final dish, which is often the goal",
        ],
        prohibitedPhrases: [
          "coconut oil",
          "coconut",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — coconut oil substituted`,
  },

  // ── 30. Coconut yoghurt ───────────────────────────────────────────────────
  {
    id: "coconut_yoghurt",
    version: 1,
    ingredientPatterns: [
      /\bcoconut\s+yogh?urt\b/i,
      /\bcoconut\s+yogh?urt\b/i,
    ],
    triggers: ["coconut_free"],
    strategies: [
      {
        replacement: "natural yoghurt",
        // Dairy yoghurt conflicts if dairy is also restricted
        conflictsWithRestrictions: ["dairy"],
        cookingNotes: [
          "Use natural yoghurt as a 1:1 substitute",
          "It provides the same creamy, slightly tangy quality without coconut flavour",
        ],
        prohibitedPhrases: [
          "coconut yoghurt",
          "coconut",
        ],
      },
      {
        replacement: "oat-based yoghurt",
        cookingNotes: [
          "Oat-based yoghurt is dairy-free and coconut-free — use as a 1:1 substitute",
          "The texture is slightly thinner than coconut yoghurt; drain through a cloth for 30 minutes if a thicker consistency is needed",
        ],
        prohibitedPhrases: [
          "coconut yoghurt",
          "coconut",
        ],
      },
    ],
    reasonTemplate: (r) => `${r} — coconut yoghurt substituted`,
  },

];

// ─── Diet trigger detection ────────────────────────────────────────────────────

/**
 * Maps free-text restriction/diet strings (from eater profiles) to typed
 * DietTrigger values that activate substitution rules.
 *
 * Phase 3B: uses the canonical restriction resolver for allergen triggers so
 * any alias the resolver recognises (e.g. "coeliac", "sesame seed") is
 * automatically converted to the correct trigger.
 * Existing vegan/vegetarian/dairy/gluten detection is preserved exactly.
 */
export function detectActiveTriggers(restrictions: string[]): Set<DietTrigger> {
  const active = new Set<DietTrigger>();

  // ── Existing diet-type detection (preserved exactly) ──────────────────────
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

  // ── Phase 3B: allergen trigger detection via canonical resolver ────────────
  // The resolver handles legacy expansion (nut_free → peanut + tree_nut),
  // aliases (coeliac → gluten), and all Phase 3 restrictions.
  const canonicalDefs = resolveActiveRestrictions(restrictions);
  for (const def of canonicalDefs) {
    switch (def.id) {
      case 'gluten':    active.add('gluten_free'); break;
      case 'dairy':     active.add('dairy_free'); break;
      case 'peanut':    active.add('peanut_free'); active.add('nut_free'); break;
      case 'tree_nut':  active.add('tree_nut_free'); active.add('nut_free'); break;
      case 'sesame':    active.add('sesame_free'); break;
      case 'soy':       active.add('soy_free'); break;
      case 'mustard':   active.add('mustard_free'); break;
      case 'shellfish': active.add('shellfish_free'); break;
      case 'eggs':      active.add('egg_free'); break;
      case 'coconut':   active.add('coconut_free'); break;
    }
  }

  return active;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns the set of canonical restriction ids active for a household.
 * Used by the strategy selector to check cross-restriction conflicts.
 */
function resolveActiveRestrictionIds(activeRestrictions: string[]): Set<string> {
  return new Set(resolveActiveRestrictions(activeRestrictions).map(d => d.id));
}

/**
 * Selects the first strategy that does not conflict with any active restriction.
 * Returns null if all strategies are blocked.
 */
function selectSafeStrategy(
  strategies: SubstitutionStrategy[],
  activeRestrictionIds: Set<string>,
): {
  strategy: SubstitutionStrategy;
  rejectedStrategies: ConflictReport['rejectedStrategies'];
} | null {
  const rejectedStrategies: ConflictReport['rejectedStrategies'] = [];

  for (const strategy of strategies) {
    const conflicts = (strategy.conflictsWithRestrictions ?? []).filter(r =>
      activeRestrictionIds.has(r)
    );
    if (conflicts.length === 0) {
      return { strategy, rejectedStrategies };
    }
    rejectedStrategies.push({
      replacement: strategy.replacement,
      conflictingRestrictions: conflicts,
    });
  }

  return null; // all strategies conflicted
}

/**
 * Builds the reason string for a matched rule.
 * Finds the first raw restriction string that maps to one of the rule's triggers.
 */
function buildReasonString(
  rule: SubstitutionRule,
  activeRestrictions: string[],
): string {
  const found = activeRestrictions.find(r =>
    rule.triggers.some(t => {
      const lower = r.toLowerCase();
      if (t === "vegetarian")    return /\bvegetarian\b/.test(lower);
      if (t === "vegan")         return /\bvegan\b/.test(lower);
      if (t === "dairy_free")    return /\bdairy[\s-]?free\b|\bdairy\b|\blactose\b/.test(lower);
      if (t === "gluten_free")   return /\bgluten[\s-]?free\b|\bcoeliac\b|\bceliac\b/.test(lower);
      if (t === "nut_free")      return /\bnut[\s-]?free\b/.test(lower);
      // Phase 3B triggers — resolve via resolver for accurate mapping
      const def = findRestrictionByAlias(r);
      if (!def) return false;
      if (t === "peanut_free")    return def.id === 'peanut';
      if (t === "tree_nut_free")  return def.id === 'tree_nut';
      if (t === "sesame_free")    return def.id === 'sesame';
      if (t === "soy_free")       return def.id === 'soy';
      if (t === "mustard_free")   return def.id === 'mustard';
      if (t === "shellfish_free") return def.id === 'shellfish';
      if (t === "egg_free")       return def.id === 'eggs';
      if (t === "coconut_free")   return def.id === 'coconut';
      return false;
    })
  );
  return found ?? activeRestrictions[0] ?? "dietary requirement";
}

// ─── Rule engines ──────────────────────────────────────────────────────────────

/**
 * Runs the substitution rule engine against a recipe's ingredient list.
 * Returns both deterministic adjustments and any cross-restriction conflict reports.
 *
 * When all strategies for a rule are blocked by active restrictions, the rule
 * produces a ConflictReport but no CookingAdjustment — fail-safe behaviour.
 *
 * @param ingredients - Raw ingredient strings from the recipe
 * @param activeRestrictions - All diet types + hard restrictions from the household
 */
export function matchSubstitutionRulesWithConflicts(
  ingredients: string[],
  activeRestrictions: string[],
): { adjustments: CookingAdjustment[]; conflicts: ConflictReport[] } {
  const activeTriggers = detectActiveTriggers(activeRestrictions);
  if (activeTriggers.size === 0) return { adjustments: [], conflicts: [] };

  const activeRestrictionIds = resolveActiveRestrictionIds(activeRestrictions);
  const adjustments: CookingAdjustment[] = [];
  const conflicts: ConflictReport[] = [];
  const matchedRuleIds = new Set<string>();

  for (const ingredient of ingredients) {
    for (const rule of SUBSTITUTION_RULES) {
      if (matchedRuleIds.has(rule.id)) continue;

      const triggerActive = rule.triggers.some(t => activeTriggers.has(t));
      if (!triggerActive) continue;

      const matched = rule.ingredientPatterns.some(p => p.test(ingredient));
      if (!matched) continue;

      const result = selectSafeStrategy(rule.strategies, activeRestrictionIds);
      const reason = buildReasonString(rule, activeRestrictions);

      if (result !== null) {
        // A safe strategy was found
        adjustments.push({
          matchedIngredient: ingredient,
          replacement: result.strategy.replacement,
          reason: rule.reasonTemplate(reason),
          cookingNotes: result.strategy.cookingNotes,
          prohibitedPhrases: result.strategy.prohibitedPhrases,
          timingAdjustments: result.strategy.timingAdjustments,
        });

        // Record any rejected strategies (even though a safe one was found)
        if (result.rejectedStrategies.length > 0) {
          conflicts.push({
            ruleId: rule.id,
            matchedIngredient: ingredient,
            rejectedStrategies: result.rejectedStrategies,
          });
        }
      } else {
        // All strategies conflicted — fail safe: no substitution, report conflict
        conflicts.push({
          ruleId: rule.id,
          matchedIngredient: ingredient,
          rejectedStrategies: rule.strategies.map(s => ({
            replacement: s.replacement,
            conflictingRestrictions: (s.conflictsWithRestrictions ?? []).filter(r =>
              activeRestrictionIds.has(r)
            ),
          })),
          message: `No safe substitution found for "${ingredient}" — all strategies conflict with active restrictions`,
        });
      }

      matchedRuleIds.add(rule.id);
    }
  }

  return { adjustments, conflicts };
}

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
  return matchSubstitutionRulesWithConflicts(ingredients, activeRestrictions).adjustments;
}

/**
 * Collects all prohibited phrases from a set of cooking adjustments.
 * Used to augment post-generation validation.
 */
export function collectProhibitedPhrases(adjustments: CookingAdjustment[]): string[] {
  return Array.from(new Set(adjustments.flatMap(a => a.prohibitedPhrases)));
}
