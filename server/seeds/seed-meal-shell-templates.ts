/**
 * Meal shell template seed — Starter Shell Catalogue (Hybrid Meal Occasion).
 *
 * Inserts purpose-built household meal SHELLS — meal-style frameworks, NOT recipes.
 * Each shell carries Hybrid Meal Occasion metadata (primarySlot / suitableSlots /
 * energyBand / styleTags), framework-level shared component slots, the diets it can
 * be ADAPTED to (compatibleDiets), and editorial nutrition-opportunity metadata.
 *
 * Shells describe HOW people eat — shared components, adaptable structure, nutrition
 * opportunities. They intentionally avoid fixed ingredients, fixed calories, fixed
 * cuisines and fixed restrictions. They are frameworks.
 *
 * SCOPE: catalogue population only. This seed NEVER touches planner ranking, scoring,
 * filtering or restrictions, and does NOT activate Tier-4 recovery. styleTags use the
 * canonical slugs in @shared/style-tags (display labels already exist there).
 *
 * Idempotent: case-insensitive name lookup before each insert. Existing rows (incl.
 *             the already-seeded "Cooked Breakfast") are SKIPPED, never overwritten.
 *
 * Usage:
 *   npm run seed:meal-shells              # live insert
 *   DRY_RUN=true npm run seed:meal-shells # preview without writing
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import {
  STYLE_TAG_SLUGS,
  ENERGY_BANDS,
  MEAL_SLOTS,
  isStyleTagSlug,
  isEnergyBand,
  isMealSlot,
} from "@shared/style-tags";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("[meal-shell-seed] DATABASE_URL is not set.");
  process.exit(1);
}

const DRY_RUN = process.env.DRY_RUN === "true";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─── Shell definitions ────────────────────────────────────────────────────────
// styleTags are canonical slugs (see @shared/style-tags STYLE_TAG_DISPLAY_MAP):
//   shared-meal→Family Table  adaptable→Adaptable  family-pleaser→Family Pleaser
//   comfort→Comfort  quick→Quick & Easy  fresh→Fresh  indulgent→Indulgent
//   buffet→Buffet  bar→Bar  one-pot→One Pot
// Component slots hold framework-level ROLES / OPTIONS, never fixed recipes.

interface MealShellDef {
  name: string;
  category: string;
  description: string;
  primarySlot: string;
  suitableSlots: string[];
  energyBand: string;
  styleTags: string[];
  sharedBaseComponents: string[];
  proteinSlots: string[];
  carbSlots: string[];
  vegSlots: string[];
  toppingSlots: string[];
  sauceSlots: string[];
  compatibleDiets: string[];
  nutritionOpportunities: string[];
  estimatedTotalTime: number;
  estimatedExtraTimePerVariant: number;
  costBand: string;
  isActive: boolean;
}

const SHELL = "Household meal shell — framework, not a recipe.";

const MEAL_SHELLS: MealShellDef[] = [
  // ─────────────────────────── BREAKFAST ───────────────────────────
  {
    name: "Cooked Breakfast",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast"],
    energyBand: "hearty",
    styleTags: ["shared-meal", "comfort", "family-pleaser"],
    sharedBaseComponents: ["mushrooms", "tomatoes", "onions", "avocado", "asparagus"],
    proteinSlots: ["eggs", "pork sausages", "chicken breast", "chickpea patty", "plant-based sausages"],
    carbSlots: ["gluten-free roll", "sweet potato hash", "gluten-free keto bread roll"],
    vegSlots: [],
    toppingSlots: [],
    sauceSlots: ["tomato ketchup", "brown sauce"],
    compatibleDiets: ["Vegetarian", "Gluten-Free", "Dairy-Free", "Mediterranean", "Low-Carb", "Keto"],
    nutritionOpportunities: ["extra greens", "grilled tomatoes", "mushrooms", "baked beans", "avocado"],
    estimatedTotalTime: 25,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Continental Breakfast",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast"],
    energyBand: "light",
    styleTags: ["buffet", "fresh", "shared-meal"],
    sharedBaseComponents: ["bread basket", "fresh fruit", "spreads"],
    proteinSlots: ["cheese", "cured meats", "boiled eggs", "plant protein"],
    carbSlots: ["bread or pastries", "wholegrain options"],
    vegSlots: ["sliced vegetables"],
    toppingSlots: ["seeds", "nuts"],
    sauceSlots: ["jam or honey"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["fresh fruit", "seeds", "nuts", "wholegrain bread", "yogurt"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 3,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Smoothie Bowl",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "snack"],
    energyBand: "light",
    styleTags: ["fresh", "quick"],
    sharedBaseComponents: ["blended fruit base"],
    proteinSlots: ["yogurt", "protein powder", "silken tofu"],
    carbSlots: ["oats or granola"],
    vegSlots: ["leafy greens"],
    toppingSlots: ["berries", "seeds", "nut butter"],
    sauceSlots: [],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["berries", "seeds", "nut butter", "greens", "granola"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 3,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Yogurt Bowl",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "snack"],
    energyBand: "light",
    styleTags: ["fresh", "quick"],
    sharedBaseComponents: ["yogurt base"],
    proteinSlots: ["yogurt", "dairy-free yogurt"],
    carbSlots: ["granola or oats"],
    vegSlots: [],
    toppingSlots: ["fresh fruit", "seeds", "nuts"],
    sauceSlots: ["honey or compote"],
    compatibleDiets: ["Vegetarian", "Gluten-Free", "Dairy-Free", "Vegan"],
    nutritionOpportunities: ["berries", "seeds", "nuts", "honey", "granola"],
    estimatedTotalTime: 5,
    estimatedExtraTimePerVariant: 2,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Overnight Oats",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "snack"],
    energyBand: "light",
    styleTags: ["quick", "fresh"],
    sharedBaseComponents: ["soaked oats base"],
    proteinSlots: ["yogurt", "milk or plant milk", "protein powder"],
    carbSlots: ["rolled oats"],
    vegSlots: [],
    toppingSlots: ["fruit", "seeds", "nut butter"],
    sauceSlots: [],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["chia", "seeds", "berries", "nut butter", "cinnamon"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 3,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Porridge Bar",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast"],
    energyBand: "medium",
    styleTags: ["comfort", "buffet", "family-pleaser"],
    sharedBaseComponents: ["porridge base", "milk or plant milk"],
    proteinSlots: ["milk or plant milk", "nut butter"],
    carbSlots: ["oats"],
    vegSlots: [],
    toppingSlots: ["fruit", "seeds", "nuts"],
    sauceSlots: ["honey or syrup"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["seeds", "fresh fruit", "nuts", "nut butter", "cinnamon"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 3,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Breakfast Wrap",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "lunch"],
    energyBand: "medium",
    styleTags: ["quick", "family-pleaser"],
    sharedBaseComponents: ["wrap"],
    proteinSlots: ["eggs", "beans", "plant protein"],
    carbSlots: ["tortilla wrap"],
    vegSlots: ["peppers", "tomatoes", "greens"],
    toppingSlots: ["cheese or alternative"],
    sauceSlots: ["salsa or sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["greens", "tomatoes", "avocado", "beans", "peppers"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Breakfast Bowl",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast"],
    energyBand: "medium",
    styleTags: ["fresh", "quick"],
    sharedBaseComponents: ["grain or potato base"],
    proteinSlots: ["eggs", "beans", "plant protein"],
    carbSlots: ["grains", "potato"],
    vegSlots: ["greens", "tomatoes"],
    toppingSlots: ["avocado", "seeds"],
    sauceSlots: ["dressing or sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "avocado", "seeds", "beans", "tomatoes"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Toast Bar",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "snack"],
    energyBand: "light",
    styleTags: ["bar", "buffet", "quick"],
    sharedBaseComponents: ["bread selection", "spreads"],
    proteinSlots: ["eggs", "nut butter", "cheese or alternative"],
    carbSlots: ["bread", "wholegrain bread"],
    vegSlots: ["tomatoes", "greens"],
    toppingSlots: ["avocado", "seeds"],
    sauceSlots: ["spreads"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["avocado", "seeds", "tomatoes", "nut butter", "eggs"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 2,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Fruit & Nut Plate",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "snack"],
    energyBand: "light",
    styleTags: ["fresh", "quick"],
    sharedBaseComponents: ["seasonal fruit", "mixed nuts"],
    proteinSlots: ["nuts", "yogurt or cheese"],
    carbSlots: [],
    vegSlots: [],
    toppingSlots: ["seeds", "dark chocolate"],
    sauceSlots: [],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["seeds", "nuts", "fresh fruit", "yogurt", "dark chocolate"],
    estimatedTotalTime: 5,
    estimatedExtraTimePerVariant: 2,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Protein Pancakes",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast"],
    energyBand: "medium",
    styleTags: ["family-pleaser", "comfort", "indulgent"],
    sharedBaseComponents: ["pancake batter base"],
    proteinSlots: ["eggs", "protein powder", "yogurt"],
    carbSlots: ["flour or oats"],
    vegSlots: [],
    toppingSlots: ["berries", "banana", "seeds"],
    sauceSlots: ["syrup or compote"],
    compatibleDiets: ["Vegetarian", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["berries", "seeds", "nut butter", "banana", "yogurt"],
    estimatedTotalTime: 20,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Chia Pot",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "snack"],
    energyBand: "light",
    styleTags: ["fresh", "quick"],
    sharedBaseComponents: ["chia base", "milk or plant milk"],
    proteinSlots: ["yogurt", "milk or plant milk"],
    carbSlots: [],
    vegSlots: [],
    toppingSlots: ["fruit", "seeds", "nuts"],
    sauceSlots: ["compote"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["berries", "seeds", "nuts", "coconut", "cacao"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 2,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Breakfast Bake",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast"],
    energyBand: "hearty",
    styleTags: ["shared-meal", "comfort", "one-pot", "family-pleaser"],
    sharedBaseComponents: ["bake base", "vegetables"],
    proteinSlots: ["eggs", "beans", "plant protein"],
    carbSlots: ["potato", "bread"],
    vegSlots: ["peppers", "tomatoes", "mushrooms", "greens"],
    toppingSlots: ["cheese or alternative", "herbs"],
    sauceSlots: [],
    compatibleDiets: ["Vegetarian", "Gluten-Free", "Dairy-Free", "Keto"],
    nutritionOpportunities: ["greens", "peppers", "tomatoes", "mushrooms", "herbs"],
    estimatedTotalTime: 35,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Bagel Bar",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "lunch"],
    energyBand: "medium",
    styleTags: ["bar", "buffet", "family-pleaser"],
    sharedBaseComponents: ["bagels", "spreads"],
    proteinSlots: ["eggs", "smoked fish", "cheese or alternative", "plant protein"],
    carbSlots: ["bagels"],
    vegSlots: ["tomatoes", "greens"],
    toppingSlots: ["avocado", "seeds"],
    sauceSlots: ["cream cheese or alternative"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free"],
    nutritionOpportunities: ["avocado", "tomatoes", "seeds", "smoked fish", "greens"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 3,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Egg Muffins",
    category: "breakfast",
    description: SHELL,
    primarySlot: "breakfast",
    suitableSlots: ["breakfast", "lunch", "snack"],
    energyBand: "light",
    styleTags: ["quick", "family-pleaser"],
    sharedBaseComponents: ["egg base", "vegetables"],
    proteinSlots: ["eggs", "plant protein"],
    carbSlots: [],
    vegSlots: ["peppers", "tomatoes", "mushrooms", "greens"],
    toppingSlots: ["cheese or alternative", "herbs"],
    sauceSlots: [],
    compatibleDiets: ["Vegetarian", "Gluten-Free", "Dairy-Free", "Keto", "Low-Carb"],
    nutritionOpportunities: ["greens", "peppers", "tomatoes", "mushrooms", "herbs"],
    estimatedTotalTime: 25,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },

  // ───────────────────────────── LUNCH ─────────────────────────────
  {
    name: "Soup & Side",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["comfort", "one-pot", "shared-meal"],
    sharedBaseComponents: ["soup base", "vegetables"],
    proteinSlots: ["beans", "lentils", "chicken", "plant protein"],
    carbSlots: ["bread side", "grains"],
    vegSlots: ["seasonal vegetables", "greens"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: [],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["beans", "lentils", "greens", "seeds", "herbs"],
    estimatedTotalTime: 30,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Grain Bowl",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["fresh", "adaptable"],
    sharedBaseComponents: ["grain base"],
    proteinSlots: ["chicken", "beans", "tofu", "eggs"],
    carbSlots: ["grains"],
    vegSlots: ["seasonal vegetables", "greens"],
    toppingSlots: ["seeds", "avocado"],
    sauceSlots: ["dressing"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["greens", "beans", "seeds", "avocado", "herbs"],
    estimatedTotalTime: 25,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Buddha Bowl",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["fresh", "adaptable"],
    sharedBaseComponents: ["grain base", "roasted vegetables"],
    proteinSlots: ["tofu", "beans", "lentils", "chicken"],
    carbSlots: ["grains"],
    vegSlots: ["roasted vegetables", "greens"],
    toppingSlots: ["seeds", "avocado"],
    sauceSlots: ["dressing"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "beans", "lentils", "seeds", "avocado"],
    estimatedTotalTime: 30,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Loaded Salad",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch"],
    energyBand: "light",
    styleTags: ["fresh", "adaptable"],
    sharedBaseComponents: ["leaf base", "vegetables"],
    proteinSlots: ["chicken", "fish", "eggs", "beans", "tofu"],
    carbSlots: ["grains or croutons"],
    vegSlots: ["seasonal vegetables", "greens"],
    toppingSlots: ["seeds", "nuts", "avocado"],
    sauceSlots: ["dressing"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Low-Carb", "Mediterranean"],
    nutritionOpportunities: ["greens", "seeds", "nuts", "avocado", "beans"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Wrap Bar",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch"],
    energyBand: "medium",
    styleTags: ["bar", "buffet", "quick", "family-pleaser"],
    sharedBaseComponents: ["wraps", "fillings bar"],
    proteinSlots: ["chicken", "beans", "falafel", "plant protein"],
    carbSlots: ["tortilla wraps"],
    vegSlots: ["peppers", "greens", "tomatoes"],
    toppingSlots: ["avocado", "seeds"],
    sauceSlots: ["sauces"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["greens", "peppers", "beans", "avocado", "tomatoes"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 3,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Sandwich Bar",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch"],
    energyBand: "light",
    styleTags: ["bar", "buffet", "quick", "family-pleaser"],
    sharedBaseComponents: ["bread selection", "fillings bar"],
    proteinSlots: ["chicken", "fish", "eggs", "cheese or alternative", "beans"],
    carbSlots: ["bread", "wholegrain bread"],
    vegSlots: ["greens", "tomatoes"],
    toppingSlots: ["avocado", "seeds"],
    sauceSlots: ["spreads"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["greens", "tomatoes", "avocado", "seeds", "wholegrain bread"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 3,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Jacket Potato Bar",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["bar", "buffet", "comfort", "family-pleaser"],
    sharedBaseComponents: ["baked potatoes", "toppings bar"],
    proteinSlots: ["beans", "tuna", "chicken", "cheese or alternative"],
    carbSlots: ["baked potato"],
    vegSlots: ["side salad", "greens"],
    toppingSlots: ["cheese or alternative", "seeds"],
    sauceSlots: ["sauces"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["beans", "greens", "tuna", "side salad", "seeds"],
    estimatedTotalTime: 45,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Mezze Plate",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "light",
    styleTags: ["buffet", "shared-meal", "fresh"],
    sharedBaseComponents: ["dips", "flatbread", "vegetables"],
    proteinSlots: ["chickpeas", "halloumi or alternative", "falafel"],
    carbSlots: ["flatbread"],
    vegSlots: ["fresh vegetables", "greens"],
    toppingSlots: ["olives", "seeds"],
    sauceSlots: ["dips"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["chickpeas", "olives", "seeds", "fresh veg", "herbs"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Leftovers Plate",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch"],
    energyBand: "medium",
    styleTags: ["quick", "adaptable"],
    sharedBaseComponents: ["leftover components"],
    proteinSlots: ["leftover protein"],
    carbSlots: ["leftover carbs"],
    vegSlots: ["leftover or fresh vegetables", "greens"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: ["sauces"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "beans", "seeds", "fresh salad", "herbs"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 2,
    costBand: "budget",
    isActive: true,
  },
  {
    name: "Pasta Salad",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch"],
    energyBand: "medium",
    styleTags: ["fresh", "buffet", "family-pleaser"],
    sharedBaseComponents: ["pasta base", "vegetables"],
    proteinSlots: ["chicken", "beans", "cheese or alternative", "tuna"],
    carbSlots: ["pasta"],
    vegSlots: ["peppers", "greens", "tomatoes"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: ["dressing"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["greens", "beans", "seeds", "peppers", "herbs"],
    estimatedTotalTime: 20,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Noodle Bowl",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["fresh", "quick", "comfort"],
    sharedBaseComponents: ["noodle base", "broth or sauce"],
    proteinSlots: ["chicken", "tofu", "egg", "prawns"],
    carbSlots: ["noodles"],
    vegSlots: ["mixed vegetables", "greens"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: ["broth or sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "edamame", "seeds", "herbs", "mixed veg"],
    estimatedTotalTime: 20,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Quesadilla",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch"],
    energyBand: "medium",
    styleTags: ["quick", "comfort", "family-pleaser"],
    sharedBaseComponents: ["tortillas", "filling"],
    proteinSlots: ["beans", "chicken", "cheese or alternative"],
    carbSlots: ["tortillas"],
    vegSlots: ["peppers", "greens"],
    toppingSlots: ["avocado", "seeds"],
    sauceSlots: ["salsa"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["beans", "peppers", "greens", "salsa", "avocado"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 3,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Toastie",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch"],
    energyBand: "light",
    styleTags: ["quick", "comfort", "family-pleaser"],
    sharedBaseComponents: ["bread", "filling"],
    proteinSlots: ["cheese or alternative", "ham", "beans"],
    carbSlots: ["bread", "wholegrain bread"],
    vegSlots: ["tomatoes", "greens", "mushrooms"],
    toppingSlots: ["herbs"],
    sauceSlots: ["sauces"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["tomatoes", "greens", "mushrooms", "wholegrain bread", "herbs"],
    estimatedTotalTime: 10,
    estimatedExtraTimePerVariant: 2,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Bento Box",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch", "snack"],
    energyBand: "light",
    styleTags: ["buffet", "fresh", "adaptable"],
    sharedBaseComponents: ["compartment components"],
    proteinSlots: ["chicken", "edamame", "egg", "tofu"],
    carbSlots: ["rice", "crackers"],
    vegSlots: ["fresh vegetables", "greens"],
    toppingSlots: ["seeds", "fruit"],
    sauceSlots: ["dip"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["edamame", "seeds", "fresh fruit", "greens", "nuts"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Picnic Plate",
    category: "lunch",
    description: SHELL,
    primarySlot: "lunch",
    suitableSlots: ["lunch", "snack"],
    energyBand: "light",
    styleTags: ["buffet", "shared-meal", "fresh"],
    sharedBaseComponents: ["cold spread", "bread or crackers"],
    proteinSlots: ["cheese or alternative", "cold meats", "boiled eggs", "hummus"],
    carbSlots: ["bread", "crackers"],
    vegSlots: ["fresh vegetables", "greens"],
    toppingSlots: ["seeds", "nuts", "fruit"],
    sauceSlots: ["dips"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["fresh veg", "fruit", "seeds", "nuts", "hummus"],
    estimatedTotalTime: 15,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },

  // ───────────────────────────── DINNER ─────────────────────────────
  {
    name: "Curry Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "hearty",
    styleTags: ["shared-meal", "adaptable", "comfort", "one-pot"],
    sharedBaseComponents: ["aromatics", "spice base", "sauce"],
    proteinSlots: ["protein"],
    carbSlots: ["rice or flatbread"],
    vegSlots: ["vegetables"],
    toppingSlots: ["garnish"],
    sauceSlots: ["curry sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Keto", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["extra greens", "lentils", "beans", "fresh herbs", "mixed seeds"],
    estimatedTotalTime: 40,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Taco Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "medium",
    styleTags: ["shared-meal", "buffet", "family-pleaser", "fresh"],
    sharedBaseComponents: ["taco shells", "toppings bar"],
    proteinSlots: ["beef", "chicken", "beans", "plant protein"],
    carbSlots: ["taco shells", "tortillas"],
    vegSlots: ["peppers", "greens", "tomatoes"],
    toppingSlots: ["avocado", "cheese or alternative", "seeds"],
    sauceSlots: ["salsa"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["beans", "greens", "peppers", "avocado", "fresh salsa"],
    estimatedTotalTime: 30,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Pasta Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "family-pleaser", "shared-meal", "one-pot"],
    sharedBaseComponents: ["pasta", "sauce"],
    proteinSlots: ["mince", "chicken", "beans", "lentils"],
    carbSlots: ["pasta"],
    vegSlots: ["vegetables", "greens"],
    toppingSlots: ["cheese or alternative", "herbs"],
    sauceSlots: ["pasta sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["greens", "lentils", "mushrooms", "herbs", "seeds"],
    estimatedTotalTime: 35,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Pizza Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["indulgent", "family-pleaser", "shared-meal", "buffet"],
    sharedBaseComponents: ["pizza base", "sauce", "toppings bar"],
    proteinSlots: ["cheese or alternative", "chicken", "plant protein"],
    carbSlots: ["pizza base"],
    vegSlots: ["peppers", "mushrooms", "greens"],
    toppingSlots: ["herbs", "side salad"],
    sauceSlots: ["tomato sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "peppers", "mushrooms", "side salad", "herbs"],
    estimatedTotalTime: 35,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Stir Fry",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["quick", "fresh", "one-pot", "family-pleaser"],
    sharedBaseComponents: ["wok base", "sauce"],
    proteinSlots: ["chicken", "beef", "tofu", "prawns"],
    carbSlots: ["noodles", "rice"],
    vegSlots: ["mixed vegetables", "greens"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: ["stir fry sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Low-Carb"],
    nutritionOpportunities: ["mixed veg", "greens", "edamame", "seeds", "ginger"],
    estimatedTotalTime: 20,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Burger Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["indulgent", "family-pleaser", "shared-meal", "bar"],
    sharedBaseComponents: ["buns", "toppings bar"],
    proteinSlots: ["beef", "chicken", "bean patty", "plant protein"],
    carbSlots: ["buns"],
    vegSlots: ["salad", "tomatoes", "greens"],
    toppingSlots: ["avocado", "cheese or alternative"],
    sauceSlots: ["sauces"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["salad", "tomatoes", "greens", "avocado", "side veg"],
    estimatedTotalTime: 30,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Roast Dinner",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "shared-meal", "family-pleaser"],
    sharedBaseComponents: ["roast vegetables", "gravy"],
    proteinSlots: ["roast meat", "nut roast", "plant protein"],
    carbSlots: ["potatoes"],
    vegSlots: ["seasonal vegetables", "greens"],
    toppingSlots: ["herbs"],
    sauceSlots: ["gravy"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["extra greens", "root veg", "herbs", "seeds", "beans"],
    estimatedTotalTime: 60,
    estimatedExtraTimePerVariant: 6,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Sheet Pan Dinner",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "medium",
    styleTags: ["quick", "one-pot", "family-pleaser"],
    sharedBaseComponents: ["tray base", "seasoning"],
    proteinSlots: ["chicken", "fish", "tofu", "beans"],
    carbSlots: ["potatoes", "grains"],
    vegSlots: ["mixed vegetables", "greens"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: ["dressing"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["mixed veg", "greens", "beans", "seeds", "herbs"],
    estimatedTotalTime: 40,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Rice Bowl",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["fresh", "adaptable", "comfort"],
    sharedBaseComponents: ["rice base", "sauce"],
    proteinSlots: ["chicken", "tofu", "beans", "egg"],
    carbSlots: ["rice"],
    vegSlots: ["mixed vegetables", "greens"],
    toppingSlots: ["avocado", "seeds"],
    sauceSlots: ["sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "edamame", "beans", "seeds", "avocado"],
    estimatedTotalTime: 25,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Risotto",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "one-pot", "family-pleaser"],
    sharedBaseComponents: ["risotto rice", "stock"],
    proteinSlots: ["chicken", "prawns", "beans", "cheese or alternative"],
    carbSlots: ["risotto rice"],
    vegSlots: ["mushrooms", "peas", "greens"],
    toppingSlots: ["herbs", "seeds"],
    sauceSlots: ["stock"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "mushrooms", "peas", "herbs", "seeds"],
    estimatedTotalTime: 40,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Chilli Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "one-pot", "shared-meal", "family-pleaser"],
    sharedBaseComponents: ["chilli base", "beans", "sauce"],
    proteinSlots: ["mince", "beans", "plant protein"],
    carbSlots: ["rice"],
    vegSlots: ["peppers", "greens"],
    toppingSlots: ["avocado", "cheese or alternative"],
    sauceSlots: ["chilli sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["beans", "lentils", "greens", "peppers", "fresh herbs"],
    estimatedTotalTime: 40,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Casserole",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "one-pot", "shared-meal"],
    sharedBaseComponents: ["casserole base", "sauce"],
    proteinSlots: ["meat", "beans", "lentils", "plant protein"],
    carbSlots: ["potatoes", "grains"],
    vegSlots: ["root vegetables", "greens"],
    toppingSlots: ["herbs"],
    sauceSlots: ["sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["beans", "lentils", "root veg", "greens", "herbs"],
    estimatedTotalTime: 60,
    estimatedExtraTimePerVariant: 6,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Noodle Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["comfort", "quick", "family-pleaser"],
    sharedBaseComponents: ["noodle base", "sauce or broth"],
    proteinSlots: ["chicken", "tofu", "prawns", "egg"],
    carbSlots: ["noodles"],
    vegSlots: ["mixed vegetables", "greens"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: ["sauce or broth"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "edamame", "mixed veg", "seeds", "herbs"],
    estimatedTotalTime: 25,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Fajita Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "medium",
    styleTags: ["shared-meal", "buffet", "family-pleaser", "fresh"],
    sharedBaseComponents: ["tortillas", "peppers and onions", "toppings bar"],
    proteinSlots: ["chicken", "beef", "beans", "plant protein"],
    carbSlots: ["tortillas"],
    vegSlots: ["peppers", "greens"],
    toppingSlots: ["avocado", "cheese or alternative"],
    sauceSlots: ["salsa"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["peppers", "beans", "greens", "avocado", "salsa"],
    estimatedTotalTime: 30,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "BBQ Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["indulgent", "shared-meal", "buffet", "family-pleaser"],
    sharedBaseComponents: ["grill selection", "sides bar"],
    proteinSlots: ["meat", "fish", "halloumi or alternative", "plant protein"],
    carbSlots: ["buns", "corn", "potatoes"],
    vegSlots: ["salad", "greens"],
    toppingSlots: ["slaw", "seeds"],
    sauceSlots: ["bbq sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["salad", "corn", "greens", "slaw", "beans"],
    estimatedTotalTime: 40,
    estimatedExtraTimePerVariant: 6,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Lasagne Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "family-pleaser", "shared-meal", "indulgent"],
    sharedBaseComponents: ["pasta sheets", "sauce", "bechamel"],
    proteinSlots: ["mince", "lentils", "vegetables", "plant protein"],
    carbSlots: ["pasta sheets"],
    vegSlots: ["greens", "mushrooms"],
    toppingSlots: ["cheese or alternative", "herbs"],
    sauceSlots: ["tomato sauce", "white sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "lentils", "mushrooms", "side salad", "herbs"],
    estimatedTotalTime: 60,
    estimatedExtraTimePerVariant: 6,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Sausage & Mash",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "family-pleaser"],
    sharedBaseComponents: ["mash", "gravy"],
    proteinSlots: ["sausages", "plant-based sausages"],
    carbSlots: ["mashed potato"],
    vegSlots: ["peas", "greens", "root vegetables"],
    toppingSlots: ["herbs"],
    sauceSlots: ["gravy"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["greens", "peas", "root veg", "beans", "herbs"],
    estimatedTotalTime: 35,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Fish & Sides",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "medium",
    styleTags: ["fresh", "family-pleaser"],
    sharedBaseComponents: ["fish", "sides"],
    proteinSlots: ["fish"],
    carbSlots: ["potatoes", "grains"],
    vegSlots: ["peas", "greens", "side salad"],
    toppingSlots: ["herbs", "lemon"],
    sauceSlots: ["sauce"],
    compatibleDiets: ["Gluten-Free", "Dairy-Free", "Mediterranean", "Low-Carb"],
    nutritionOpportunities: ["greens", "peas", "side salad", "lemon", "herbs"],
    estimatedTotalTime: 30,
    estimatedExtraTimePerVariant: 4,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Tray Bake",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "medium",
    styleTags: ["quick", "one-pot", "family-pleaser"],
    sharedBaseComponents: ["tray base", "seasoning"],
    proteinSlots: ["chicken", "sausages", "tofu", "beans"],
    carbSlots: ["potatoes", "grains"],
    vegSlots: ["mixed vegetables", "greens"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: ["dressing"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["mixed veg", "greens", "beans", "seeds", "herbs"],
    estimatedTotalTime: 45,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Stew",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "one-pot", "shared-meal"],
    sharedBaseComponents: ["stew base", "broth"],
    proteinSlots: ["meat", "beans", "lentils", "plant protein"],
    carbSlots: ["potatoes", "bread side"],
    vegSlots: ["root vegetables", "greens"],
    toppingSlots: ["herbs"],
    sauceSlots: ["broth"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["beans", "lentils", "root veg", "greens", "herbs"],
    estimatedTotalTime: 60,
    estimatedExtraTimePerVariant: 6,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Paella",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["shared-meal", "one-pot", "fresh"],
    sharedBaseComponents: ["paella rice", "stock"],
    proteinSlots: ["chicken", "seafood", "beans", "plant protein"],
    carbSlots: ["paella rice"],
    vegSlots: ["peppers", "peas", "greens"],
    toppingSlots: ["herbs", "lemon"],
    sauceSlots: ["stock"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["peas", "peppers", "greens", "beans", "herbs"],
    estimatedTotalTime: 45,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Shepherd's Pie",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "hearty",
    styleTags: ["comfort", "one-pot", "family-pleaser", "shared-meal"],
    sharedBaseComponents: ["mince base", "mash topping"],
    proteinSlots: ["mince", "lentils", "plant protein"],
    carbSlots: ["mashed potato"],
    vegSlots: ["peas", "root vegetables", "greens"],
    toppingSlots: ["herbs"],
    sauceSlots: ["gravy"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free"],
    nutritionOpportunities: ["lentils", "beans", "root veg", "greens", "peas"],
    estimatedTotalTime: 50,
    estimatedExtraTimePerVariant: 6,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Kebab Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "medium",
    styleTags: ["shared-meal", "buffet", "fresh", "family-pleaser"],
    sharedBaseComponents: ["flatbreads", "salad bar"],
    proteinSlots: ["meat", "halloumi or alternative", "falafel", "plant protein"],
    carbSlots: ["flatbread"],
    vegSlots: ["salad", "greens"],
    toppingSlots: ["pickles", "herbs"],
    sauceSlots: ["sauces"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["salad", "greens", "chickpeas", "herbs", "pickles"],
    estimatedTotalTime: 30,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Dumpling Night",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["dinner"],
    energyBand: "medium",
    styleTags: ["shared-meal", "comfort", "buffet", "family-pleaser"],
    sharedBaseComponents: ["dumplings", "dipping sauces"],
    proteinSlots: ["pork", "chicken", "tofu", "vegetables"],
    carbSlots: ["dumpling wrappers", "rice"],
    vegSlots: ["mixed vegetables", "greens"],
    toppingSlots: ["seeds", "herbs"],
    sauceSlots: ["dipping sauce"],
    compatibleDiets: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free"],
    nutritionOpportunities: ["greens", "edamame", "mixed veg", "ginger", "herbs"],
    estimatedTotalTime: 35,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
  {
    name: "Mediterranean Platter",
    category: "dinner",
    description: SHELL,
    primarySlot: "dinner",
    suitableSlots: ["lunch", "dinner"],
    energyBand: "medium",
    styleTags: ["buffet", "shared-meal", "fresh"],
    sharedBaseComponents: ["dips", "bread or grains", "vegetables"],
    proteinSlots: ["chicken", "fish", "chickpeas", "halloumi or alternative"],
    carbSlots: ["flatbread", "grains"],
    vegSlots: ["fresh vegetables", "greens"],
    toppingSlots: ["olives", "seeds"],
    sauceSlots: ["dips"],
    compatibleDiets: ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Mediterranean"],
    nutritionOpportunities: ["chickpeas", "olives", "fresh veg", "seeds", "herbs"],
    estimatedTotalTime: 25,
    estimatedExtraTimePerVariant: 5,
    costBand: "standard",
    isActive: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[meal-shell-seed] ${msg}`);
}

async function templateExists(name: string): Promise<{ id: number; name: string } | null> {
  const rows = await db.execute(sql`
    SELECT id, name
    FROM meal_templates
    WHERE LOWER(TRIM(name)) = LOWER(TRIM(${name}))
    LIMIT 1
  `);
  const r = (rows as any).rows ?? rows;
  return r.length > 0 ? r[0] : null;
}

/**
 * Compile-time-style guard: every shell must use only canonical vocabulary.
 * Catches typos before any write. Pure validation — no DB access.
 */
function validateVocabulary(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenNames = new Set<string>();

  for (const s of MEAL_SHELLS) {
    const key = s.name.trim().toLowerCase();
    if (seenNames.has(key)) errors.push(`Duplicate shell name in seed list: "${s.name}"`);
    seenNames.add(key);

    if (!isMealSlot(s.primarySlot)) errors.push(`"${s.name}": invalid primarySlot "${s.primarySlot}"`);
    for (const slot of s.suitableSlots) {
      if (!isMealSlot(slot)) errors.push(`"${s.name}": invalid suitableSlot "${slot}"`);
    }
    if (!s.suitableSlots.includes(s.primarySlot)) {
      errors.push(`"${s.name}": primarySlot "${s.primarySlot}" not in suitableSlots`);
    }
    if (!isEnergyBand(s.energyBand)) errors.push(`"${s.name}": invalid energyBand "${s.energyBand}"`);
    for (const tag of s.styleTags) {
      if (!isStyleTagSlug(tag)) errors.push(`"${s.name}": invalid styleTag slug "${tag}"`);
    }
    if (s.styleTags.length === 0) errors.push(`"${s.name}": no styleTags`);
    if (s.compatibleDiets.length === 0) errors.push(`"${s.name}": no compatibleDiets`);
    if (s.nutritionOpportunities.length === 0) errors.push(`"${s.name}": no nutritionOpportunities`);
  }

  return { ok: errors.length === 0, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run(): Promise<{ insertedNames: string[]; skippedNames: string[] }> {
  log(DRY_RUN ? "DRY RUN — no data will be written." : "Live run — writing to database.");

  // Vocabulary guard first — never write if the catalogue uses non-canonical values.
  const vocab = validateVocabulary();
  if (!vocab.ok) {
    log(`ABORT — catalogue failed vocabulary validation (${vocab.errors.length} error(s)):`);
    for (const e of vocab.errors) log(`  ✗ ${e}`);
    throw new Error("Catalogue vocabulary validation failed — no data written.");
  }
  log(`Vocabulary OK — ${MEAL_SHELLS.length} shell(s) use only canonical slugs/slots/bands.`);

  const byCat = MEAL_SHELLS.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1;
    return acc;
  }, {});
  log(`Breakdown — breakfast: ${byCat.breakfast ?? 0}, lunch: ${byCat.lunch ?? 0}, dinner: ${byCat.dinner ?? 0}`);

  const insertedNames: string[] = [];
  const skippedNames: string[] = [];

  for (const shell of MEAL_SHELLS) {
    const existing = await templateExists(shell.name);

    if (existing) {
      log(`SKIP  "${shell.name}" — already exists (id=${existing.id}), left unchanged`);
      skippedNames.push(shell.name);
      continue;
    }

    if (DRY_RUN) {
      log(`DRY   "${shell.name}" [${shell.category}/${shell.energyBand}] — would insert; styleTags=[${shell.styleTags.join(", ")}]`);
      insertedNames.push(shell.name);
      continue;
    }

    // Insert — use pool.query() directly so pg's native driver serialises
    // JavaScript string[] to Postgres text[] wire format correctly.
    const result = await pool.query(
      `INSERT INTO meal_templates (
        name,
        category,
        description,
        shared_base_components,
        protein_slots,
        carb_slots,
        veg_slots,
        topping_slots,
        sauce_slots,
        compatible_diets,
        estimated_total_time,
        estimated_extra_time_per_variant,
        cost_band,
        is_active,
        primary_slot,
        suitable_slots,
        energy_band,
        style_tags,
        nutrition_opportunities
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING id`,
      [
        shell.name,
        shell.category,
        shell.description,
        shell.sharedBaseComponents,
        shell.proteinSlots,
        shell.carbSlots,
        shell.vegSlots,
        shell.toppingSlots,
        shell.sauceSlots,
        shell.compatibleDiets,
        shell.estimatedTotalTime,
        shell.estimatedExtraTimePerVariant,
        shell.costBand,
        shell.isActive,
        shell.primarySlot,
        shell.suitableSlots,
        shell.energyBand,
        shell.styleTags,
        shell.nutritionOpportunities,
      ]
    );

    const newId = result.rows[0]?.id;
    log(`INSERT "${shell.name}" — id=${newId}`);
    insertedNames.push(shell.name);
  }

  log("─".repeat(50));
  log(`Inserted : ${insertedNames.length}`);
  log(`Skipped  : ${skippedNames.length} (already existed, left unchanged)`);
  if (skippedNames.length > 0) {
    log(`Name collisions (pre-existing templates, NOT modified): ${skippedNames.join(", ")}`);
  }
  if (DRY_RUN) log("Dry run complete — no data written.");
  return { insertedNames, skippedNames };
}

// ─── Validation (post-insert, skipped on dry run) ─────────────────────────────

async function validate(insertedNames: string[], skippedNames: string[]) {
  if (DRY_RUN) {
    log("Validation skipped in dry run mode.");
    return;
  }

  log("─".repeat(50));
  log("Running post-insert validation...");

  let pass = 0;
  let fail = 0;
  const ok = (m: string) => { log(`PASS  — ${m}`); pass++; };
  const bad = (m: string) => { log(`FAIL  — ${m}`); fail++; };
  const insertedSet = new Set(insertedNames.map(n => n.trim().toLowerCase()));

  // 1. Every NEWLY-INSERTED shell exists exactly once and exposes ALL Hybrid fields
  //    (primarySlot, suitableSlots, energyBand, styleTags). Pre-existing name
  //    collisions are validated separately (they are intentionally left unchanged).
  for (const shell of MEAL_SHELLS) {
    if (!insertedSet.has(shell.name.trim().toLowerCase())) continue;

    const rows = await db.execute(sql`
      SELECT id, name, category, primary_slot, suitable_slots, energy_band, style_tags,
             compatible_diets, nutrition_opportunities
      FROM meal_templates
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(${shell.name}))
    `);
    const r = (rows as any).rows ?? rows;

    if (r.length !== 1) {
      bad(`"${shell.name}" — expected exactly 1 row, found ${r.length}`);
      continue;
    }
    const t = r[0];
    const hasHybrid =
      t.primary_slot && Array.isArray(t.suitable_slots) && t.suitable_slots.length > 0 &&
      t.energy_band && Array.isArray(t.style_tags) && t.style_tags.length > 0 &&
      Array.isArray(t.nutrition_opportunities) && t.nutrition_opportunities.length > 0;

    if (hasHybrid) {
      ok(`"${shell.name}" — primarySlot=${t.primary_slot} suitableSlots=[${t.suitable_slots.join(",")}] energyBand=${t.energy_band} styleTags=[${t.style_tags.join(",")}]`);
    } else {
      bad(`"${shell.name}" — missing one or more Hybrid fields: ${JSON.stringify({ primary_slot: t.primary_slot, suitable_slots: t.suitable_slots, energy_band: t.energy_band, style_tags: t.style_tags, nutrition_opportunities: t.nutrition_opportunities })}`);
    }
  }

  // 1b. Pre-existing name collisions: confirm they still exist and were NOT modified
  //     (we never write to them, so they must retain empty curated metadata).
  if (skippedNames.length > 0) {
    log("─".repeat(50));
    log(`Confirming ${skippedNames.length} pre-existing name collision(s) left unchanged...`);
    for (const name of skippedNames) {
      const rows = await db.execute(sql`
        SELECT id, name, style_tags, energy_band, nutrition_opportunities
        FROM meal_templates WHERE LOWER(TRIM(name)) = LOWER(TRIM(${name}))
      `);
      const r = (rows as any).rows ?? rows;
      if (r.length >= 1) {
        const t = r[0];
        ok(`"${name}" — pre-existing (id=${t.id}) exists; shell metadata applied via migration 2026-06-15_enrich_six_pre_existing_shells (style_tags=[${(t.style_tags ?? []).join(",")}])`);
      } else {
        bad(`"${name}" — expected to still exist, found ${r.length} rows`);
      }
    }
  }

  // 2. Cooked Breakfast (id 633) — enriched by migration 2026-06-15_enrich_six_pre_existing_shells.
  //    Verify it exists and has the canonical enriched values; the seed skips it, never writes it.
  log("─".repeat(50));
  log("Confirming Cooked Breakfast row is canonical (enriched via migration)...");
  const cb = await db.execute(sql`
    SELECT id, name, category, primary_slot, suitable_slots, energy_band, style_tags,
           shared_base_components, protein_slots, carb_slots, sauce_slots, compatible_diets,
           nutrition_opportunities
    FROM meal_templates WHERE LOWER(TRIM(name)) = 'cooked breakfast'
  `);
  const cbr = ((cb as any).rows ?? cb);
  if (cbr.length === 1) {
    const t = cbr[0];
    // Post-migration canonical values: primarySlot=breakfast, suitableSlots includes dinner,
    // energyBand=hearty, styleTags includes adaptable, proteinSlots includes eggs.
    const canonical =
      t.primary_slot === "breakfast" &&
      Array.isArray(t.suitable_slots) && t.suitable_slots.includes("dinner") &&
      t.energy_band === "hearty" &&
      Array.isArray(t.style_tags) && t.style_tags.includes("adaptable") &&
      Array.isArray(t.protein_slots) && t.protein_slots.includes("eggs");
    if (canonical) ok(`Cooked Breakfast canonical (id=${t.id}, primarySlot=${t.primary_slot}, suitableSlots=[${t.suitable_slots.join(",")}], energyBand=${t.energy_band})`);
    else bad(`Cooked Breakfast missing enrichment — check migration 2026-06-15_enrich_six_pre_existing_shells: ${JSON.stringify(t)}`);
  } else {
    bad(`Cooked Breakfast — expected 1 row, found ${cbr.length}`);
  }

  // 3. The seed introduced no duplicate of any CATALOGUE shell name. (Pre-existing
  //    unrelated duplicates in the original templates are out of scope and not flagged.)
  log("─".repeat(50));
  const catalogueNames = MEAL_SHELLS.map(s => s.name.trim().toLowerCase());
  const dupeRes = await pool.query(
    `SELECT LOWER(TRIM(name)) AS n, COUNT(*)::int AS c
       FROM meal_templates
      WHERE LOWER(TRIM(name)) = ANY($1)
      GROUP BY LOWER(TRIM(name)) HAVING COUNT(*) > 1`,
    [catalogueNames]
  );
  const dupeRows = dupeRes.rows;
  if (dupeRows.length === 0) ok("No duplicate catalogue shell names in meal_templates");
  else bad(`Duplicate catalogue shell names detected: ${dupeRows.map((d: any) => `${d.n}×${d.c}`).join(", ")}`);

  // 4. Total catalogue count of shells (by our description marker) for reporting.
  const total = await db.execute(sql`SELECT COUNT(*)::int AS c FROM meal_templates`);
  log(`INFO  — Total meal_templates rows: ${((total as any).rows ?? total)[0].c}`);

  log("─".repeat(50));
  log(`Validation complete — ${pass} pass, ${fail} fail.`);
  if (fail > 0) throw new Error(`Validation reported ${fail} failure(s).`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

run()
  .then(({ insertedNames, skippedNames }) => validate(insertedNames, skippedNames))
  .then(() => pool.end())
  .catch(err => {
    console.error("[meal-shell-seed] Fatal error:", err);
    pool.end().finally(() => process.exit(1));
  });
