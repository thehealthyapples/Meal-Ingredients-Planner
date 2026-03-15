import { db } from "../db";
import { ingredientSwaps } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SwapGoal =
  | "vegetarian"
  | "keto"
  | "lower-cost"
  | "less-processed"
  | "under-time"
  | "household";

export interface ChangedIngredient {
  original: string;
  replacement: string;
  reason: string;
}

export interface SwapResult {
  changedIngredients: ChangedIngredient[];
  basketChanges: string[];
  prepTimeChangeDelta: number | null;
  costChange: "lower" | "higher" | "same" | null;
  explanation: string;
}

export interface SwapOptions {
  memberExclusions?: string[];
  maxMinutes?: number;
}

// ─── Goal-specific rule tables ────────────────────────────────────────────────
// Each entry: [keyword-in-ingredient, replacement, reason]
// Matching: ingredient.toLowerCase().includes(keyword)

type RuleRow = [string, string, string];

const VEGETARIAN_RULES: RuleRow[] = [
  ["beef",       "lentils",           "plant-based protein swap"],
  ["mince",      "lentils",           "plant-based protein swap"],
  ["chicken",    "chickpeas",         "plant-based protein swap"],
  ["pork",       "tofu",              "plant-based protein swap"],
  ["bacon",      "smoked tofu",       "plant-based protein swap"],
  ["ham",        "smoked tofu",       "plant-based protein swap"],
  ["lamb",       "lentils",           "plant-based protein swap"],
  ["turkey",     "jackfruit",         "plant-based protein swap"],
  ["salmon",     "smoked paprika tofu","plant-based protein swap"],
  ["tuna",       "butter beans",      "plant-based protein swap"],
  ["prawn",      "edamame",           "plant-based protein swap"],
  ["shrimp",     "edamame",           "plant-based protein swap"],
  ["anchov",     "capers",            "plant-based umami swap"],
  ["fish sauce", "soy sauce",         "plant-based umami swap"],
  ["gelatin",    "agar agar",         "plant-based setting agent"],
];

const KETO_RULES: RuleRow[] = [
  ["pasta",           "courgette noodles",    "low-carb alternative"],
  ["spaghetti",       "courgette noodles",    "low-carb alternative"],
  ["rice",            "cauliflower rice",     "low-carb alternative"],
  ["potato",          "cauliflower",          "low-carb alternative"],
  ["bread",           "lettuce wraps",        "low-carb alternative"],
  ["flour",           "almond flour",         "low-carb alternative"],
  ["sugar",           "erythritol",           "keto-friendly sweetener"],
  ["honey",           "erythritol",           "keto-friendly sweetener"],
  ["oat",             "flaxseed meal",        "low-carb alternative"],
  ["corn",            "courgette",            "low-carb alternative"],
  ["bean",            "edamame",              "lower-carb legume"],
  ["chickpea",        "hemp seeds",           "lower-carb protein"],
  ["lentil",          "hemp seeds",           "lower-carb protein"],
  ["tortilla",        "cheese crisps",        "low-carb wrap alternative"],
];

const LOWER_COST_RULES: RuleRow[] = [
  ["salmon",          "tinned sardines",      "budget-friendly fish"],
  ["sea bass",        "pollock",              "budget-friendly fish"],
  ["beef steak",      "beef mince",           "more economical cut"],
  ["parmesan",        "mature cheddar",       "budget cheese swap"],
  ["pine nut",        "sunflower seeds",      "budget nut/seed swap"],
  ["walnut",          "sunflower seeds",      "budget nut/seed swap"],
  ["almond",          "sunflower seeds",      "budget nut/seed swap"],
  ["saffron",         "turmeric",             "budget spice swap"],
  ["truffle",         "mushroom",             "budget flavour swap"],
  ["prawn",           "white fish",           "budget seafood swap"],
  ["lobster",         "white fish",           "budget seafood swap"],
  ["fresh herb",      "dried herbs",          "budget herb swap"],
  ["burrata",         "mozzarella",           "budget cheese swap"],
];

const LESS_PROCESSED_RULES: RuleRow[] = [
  ["white rice",      "brown rice",           "whole grain swap"],
  ["white bread",     "wholegrain bread",     "whole grain swap"],
  ["white pasta",     "wholegrain pasta",     "whole grain swap"],
  ["white flour",     "wholemeal flour",      "whole grain swap"],
  ["refined flour",   "wholemeal flour",      "whole grain swap"],
  ["table salt",      "sea salt",             "minimally processed swap"],
  ["vegetable oil",   "olive oil",            "less refined oil"],
  ["sunflower oil",   "extra virgin olive oil","less refined oil"],
  ["margarine",       "butter",               "less processed fat"],
  ["processed cheese","cheddar",              "less processed dairy"],
  ["cream cheese",    "Greek yoghurt",        "less processed dairy"],
  ["ketchup",         "passata",              "less processed condiment"],
  ["ready-made sauce","homemade tomato sauce","less processed base"],
  ["stock cube",      "low-sodium stock",     "less processed stock"],
];

// Time-intensive ingredient keywords — swapping or removing speeds up prep
const UNDER_TIME_RULES: RuleRow[] = [
  ["slow-cooked",     "pan-fried",            "faster cooking method"],
  ["slow cook",       "pan-fried",            "faster cooking method"],
  ["roasted",         "pan-roasted",          "faster oven alternative"],
  ["dried bean",      "tinned beans",         "pre-cooked shortcut"],
  ["dried chickpea",  "tinned chickpeas",     "pre-cooked shortcut"],
  ["dried lentil",    "tinned lentils",       "pre-cooked shortcut"],
  ["caramelised onion","fried onion",         "faster caramelisation shortcut"],
  ["marinated",       "(skip marinade)",      "skip marinating step"],
  ["homemade stock",  "ready-made stock",     "pre-made shortcut"],
];

// Time saved estimate per swap (minutes)
const UNDER_TIME_SAVINGS: Record<string, number> = {
  "slow-cooked": 90,
  "slow cook":   90,
  "roasted":     20,
  "dried bean":  60,
  "dried chickpea": 60,
  "dried lentil":   30,
  "caramelised onion": 25,
  "marinated":   30,
  "homemade stock": 20,
};

const GOAL_RULES: Record<SwapGoal, RuleRow[]> = {
  "vegetarian":    VEGETARIAN_RULES,
  "keto":          KETO_RULES,
  "lower-cost":    LOWER_COST_RULES,
  "less-processed":LESS_PROCESSED_RULES,
  "under-time":    UNDER_TIME_RULES,
  "household":     [],
};

const GOAL_COST_DIRECTION: Record<SwapGoal, SwapResult["costChange"]> = {
  "vegetarian":    "lower",
  "keto":          "higher",
  "lower-cost":    "lower",
  "less-processed":"same",
  "under-time":    "same",
  "household":     null,
};

// ─── Engine ───────────────────────────────────────────────────────────────────

export async function applyRecipeSwaps(
  meal: { name: string; ingredients: string[] },
  goal: SwapGoal,
  options: SwapOptions = {}
): Promise<SwapResult> {
  const dbSwapRows = await db.select().from(ingredientSwaps);
  const dbSwapMap = new Map<string, string>();
  for (const row of dbSwapRows) {
    dbSwapMap.set(row.original.toLowerCase(), row.healthier);
  }

  const changed: ChangedIngredient[] = [];
  const seen = new Set<string>();
  let prepTimeDelta = 0;

  const goalRules = GOAL_RULES[goal];

  // Build exclusion rules for household goal
  const exclusions = (options.memberExclusions ?? []).map((e) => e.toLowerCase());

  for (const ingredient of meal.ingredients) {
    const lower = ingredient.toLowerCase();

    if (goal === "household") {
      // 1. Try DB swap rules for excluded items
      const matchedExclusion = exclusions.find(
        (ex) => lower.includes(ex) || ex.includes(lower)
      );
      if (matchedExclusion) {
        const dbReplacement = dbSwapMap.get(matchedExclusion);
        const key = ingredient + "|household";
        if (!seen.has(key)) {
          seen.add(key);
          changed.push({
            original: ingredient,
            replacement: dbReplacement ?? `${ingredient} (excluded)`,
            reason: dbReplacement
              ? "excluded by household member — swap rule applied"
              : "excluded by household member — consider removing",
          });
        }
      }
      continue;
    }

    // 2. Apply goal-specific rules
    for (const [keyword, replacement, reason] of goalRules) {
      if (lower.includes(keyword)) {
        const key = ingredient + "|" + keyword;
        if (!seen.has(key)) {
          seen.add(key);
          changed.push({ original: ingredient, replacement, reason });
          if (goal === "under-time") {
            prepTimeDelta -= UNDER_TIME_SAVINGS[keyword] ?? 10;
          }
        }
        break; // one rule per ingredient
      }
    }

    // 3. For less-processed and lower-cost, also check DB swap rules
    if (goal === "less-processed" || goal === "lower-cost") {
      for (const [keyword, dbReplacement] of Array.from(dbSwapMap.entries())) {
        if (lower.includes(keyword) && !seen.has(ingredient + "|db")) {
          const alreadySwapped = changed.some((c) => c.original === ingredient);
          if (!alreadySwapped) {
            seen.add(ingredient + "|db");
            changed.push({
              original: ingredient,
              replacement: dbReplacement,
              reason: "swap rule match",
            });
          }
          break;
        }
      }
    }
  }

  const basketChanges = changed.map(
    (c) => `Replace "${c.original}" with "${c.replacement}"`
  );

  const explanation = buildSwapExplanation(goal, changed, prepTimeDelta);

  return {
    changedIngredients: changed,
    basketChanges,
    prepTimeChangeDelta: goal === "under-time" ? prepTimeDelta : null,
    costChange: GOAL_COST_DIRECTION[goal],
    explanation,
  };
}

// ─── Explanation ──────────────────────────────────────────────────────────────

function buildSwapExplanation(
  goal: SwapGoal,
  changed: ChangedIngredient[],
  prepTimeDelta: number
): string {
  const n = changed.length;

  if (n === 0) {
    const goalLabel: Record<SwapGoal, string> = {
      vegetarian:    "vegetarian",
      keto:          "keto-friendly",
      "lower-cost":  "lower cost",
      "less-processed": "less processed",
      "under-time":  "quicker",
      household:     "household-friendly",
    };
    return `No changes needed — this recipe is already ${goalLabel[goal]}.`;
  }

  const prefix: Record<SwapGoal, string> = {
    vegetarian:    `${n} meat/fish ingredient${n > 1 ? "s" : ""} swapped for plant-based alternatives.`,
    keto:          `${n} high-carb ingredient${n > 1 ? "s" : ""} swapped for low-carb alternatives.`,
    "lower-cost":  `${n} ingredient${n > 1 ? "s" : ""} replaced with more affordable options.`,
    "less-processed": `${n} processed ingredient${n > 1 ? "s" : ""} replaced with whole-food alternatives.`,
    "under-time":  `${n} slow ingredient${n > 1 ? "s" : ""} swapped. Estimated ${Math.abs(prepTimeDelta)} min saved.`,
    household:     `${n} ingredient${n > 1 ? "s" : ""} adjusted for household preferences.`,
  };

  const examples = changed
    .slice(0, 2)
    .map((c) => `${c.original} → ${c.replacement}`)
    .join("; ");

  return `${prefix[goal]}${examples ? ` e.g. ${examples}.` : ""}`;
}
