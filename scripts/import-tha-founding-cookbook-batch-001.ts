/**
 * COOKBOOK2 — Import: The Healthy Apples Original Founding Cookbook, Batch 001
 *
 * Dev-only, idempotent importer for the 10 authored recipes defined in
 *   docs/implementation/cookbook/THA_ORIGINAL_FOUNDING_COOKBOOK_BATCH_001.md
 *
 * Scope (see docs/implementation/cookbook/COOKBOOK2_IMPORT_THA_ORIGINAL_BATCH_001.md):
 *   - Cookbook owns recipe content only: name, category, ingredients, method,
 *     servings. Difficulty / prep / cook times are NOT columns on the `meals`
 *     table and are intentionally omitted ("where supported").
 *   - No schema changes, no migrations, no household adaptations, no swaps,
 *     no planner/leftover logic, no generated images.
 *   - Rows are stored as SYSTEM / THA-LIBRARY meals (user_id=0,
 *     is_system_meal=true, acquisition_lane='tha_library',
 *     acquisition_type='authored'), exactly like the existing founding corpus,
 *     so they appear in every dev user's Cookbook via storage.getSystemMeals().
 *
 * Write path: reuses the canonical write funnel storage.createMeal(userId,
 * insertMeal) — the funnel named in THA_RECIPE_ACQUISITION_ARCHITECTURE.md §5.
 *
 * Idempotency: a recipe is matched by its exact `name` among system meals.
 * Running twice inserts nothing the second time.
 *
 * Usage:
 *   npx tsx scripts/import-tha-founding-cookbook-batch-001.ts            # import
 *   npx tsx scripts/import-tha-founding-cookbook-batch-001.ts --rollback # remove
 *
 * Production guard: refuses to run when NODE_ENV=production.
 */

import { storage } from "../server/storage";
import { db, pool } from "../server/db";
import { meals } from "@shared/schema";
import { and, eq, ilike } from "drizzle-orm";

const SYSTEM_USER_ID = 0;
const NAME_PREFIX = "The Healthy Apples";

// Cookbook meal_categories (dev): 1=Breakfast, 2=Lunch, 3=Dinner.
// There is no "Side" category; THA-010 (side / lunchbox main) maps to Lunch(2).
const CATEGORY = { breakfast: 1, lunch: 2, dinner: 3, side: 2 } as const;

interface FoundingRecipe {
  recipeId: string;
  name: string;
  category: keyof typeof CATEGORY;
  servings: number;
  ingredients: string[];
  method: string[];
}

const RECIPES: FoundingRecipe[] = [
  {
    recipeId: "THA-001",
    name: "The Healthy Apples Apple, Oat & Cinnamon Morning Bowl",
    category: "breakfast",
    servings: 4,
    ingredients: [
      "160g rolled wholegrain oats",
      "600ml semi-skimmed milk (or unsweetened oat milk)",
      "200ml water",
      "2 eating apples (e.g. Gala or Braeburn), 1 grated and 1 diced",
      "1 tsp ground cinnamon",
      "1 tbsp mixed seeds (e.g. pumpkin and sunflower)",
      "1 tbsp chopped walnuts (optional)",
      "1 tsp honey to finish, per bowl, only if wanted",
    ],
    method: [
      "Put the oats, milk, water, grated apple and cinnamon in a medium saucepan.",
      "Bring to a gentle simmer over medium heat, stirring often, for 6–8 minutes until thick and creamy.",
      "Stir in half the diced apple in the last minute so it softens slightly but keeps some bite.",
      "Spoon into bowls and top with the remaining diced apple, the seeds and the walnuts.",
      "Finish with a thread of honey only if a sweeter bowl is wanted.",
      "No-cook overnight version: combine oats, milk, grated apple and cinnamon in a lidded container, refrigerate overnight, then top with diced apple, seeds and nuts before serving.",
    ],
  },
  {
    recipeId: "THA-002",
    name: "The Healthy Apples Chickpea, Lemon & Spinach Soup",
    category: "lunch",
    servings: 4,
    ingredients: [
      "1 tbsp olive oil",
      "1 onion, finely chopped",
      "2 carrots, diced",
      "2 celery sticks, diced",
      "3 garlic cloves, crushed",
      "1 tsp ground cumin",
      "1 tsp ground coriander",
      "2 x 400g tins chickpeas, drained and rinsed",
      "1.2 litres low-salt vegetable stock",
      "1 tbsp tomato purée",
      "100g fresh spinach, roughly chopped",
      "Juice of 1 lemon",
      "Black pepper, and salt to taste",
      "Wholegrain bread, to serve",
    ],
    method: [
      "Heat the olive oil in a large pan. Add the onion, carrot and celery and cook gently for 8 minutes until soft.",
      "Stir in the garlic, cumin and coriander and cook for 1 minute until fragrant.",
      "Add the tomato purée and stir for 30 seconds, then tip in the chickpeas and stock.",
      "Simmer for 12–15 minutes until the vegetables are tender.",
      "For a thicker soup, blitz about a third of the soup with a stick blender, then stir it back through.",
      "Add the spinach and cook for 2 minutes until just wilted. Stir in the lemon juice, season with pepper and a little salt, and serve with wholegrain bread.",
    ],
  },
  {
    recipeId: "THA-003",
    name: "The Healthy Apples Basil Tomato Wholewheat Pasta",
    category: "dinner",
    servings: 4,
    ingredients: [
      "350g wholewheat pasta (penne or fusilli)",
      "1 tbsp olive oil",
      "1 onion, finely chopped",
      "3 garlic cloves, finely chopped",
      "2 x 400g tins chopped tomatoes",
      "1 tbsp tomato purée",
      "1 tsp dried oregano",
      "1 tsp balsamic vinegar",
      "A pinch of black pepper, salt to taste",
      "1 large handful fresh basil, torn",
      "30g Parmesan or a vegetarian hard cheese, grated (optional, to serve)",
    ],
    method: [
      "Heat the olive oil in a wide pan. Cook the onion gently for 8 minutes until soft and translucent.",
      "Add the garlic and oregano and cook for 1 minute.",
      "Stir in the tomato purée, then add the chopped tomatoes and balsamic vinegar. Half-fill one empty tin with water, swirl, and add that too.",
      "Simmer gently for 15–18 minutes, stirring now and then, until thickened and rich. Season with pepper and a little salt.",
      "Meanwhile cook the wholewheat pasta in boiling water until just tender. Reserve a mugful of pasta water, then drain.",
      "Toss the pasta through the sauce, loosening with a splash of pasta water if needed. Stir through most of the basil.",
      "Serve topped with the remaining basil and a little grated cheese if wanted.",
    ],
  },
  {
    recipeId: "THA-004",
    name: "The Healthy Apples Golden Potato, Chickpea & Spinach Curry",
    category: "dinner",
    servings: 4,
    ingredients: [
      "1 tbsp vegetable oil",
      "1 onion, finely chopped",
      "3 garlic cloves, crushed",
      "20g fresh ginger, grated",
      "1 tsp ground cumin",
      "1 tsp ground coriander",
      "1 tsp ground turmeric",
      "1 tsp garam masala",
      "500g potatoes, peeled and cut into 2cm cubes",
      "1 x 400g tin chopped tomatoes",
      "1 x 400g tin chickpeas, drained and rinsed",
      "300ml low-salt vegetable stock",
      "100g fresh spinach",
      "Salt to taste",
      "Brown basmati rice or wholemeal flatbreads, to serve",
      "Fresh coriander, to finish (optional)",
    ],
    method: [
      "Heat the oil in a large pan. Cook the onion for 8 minutes until soft.",
      "Add the garlic and ginger and cook for 1 minute, then stir in the cumin, coriander, turmeric and garam masala and cook for 30 seconds until fragrant.",
      "Add the potatoes and stir to coat in the spices. Pour in the chopped tomatoes and stock.",
      "Cover and simmer for 15 minutes, then add the chickpeas and cook, partly covered, for a further 8–10 minutes until the potatoes are tender and the sauce has thickened.",
      "Stir through the spinach until wilted. Season with a little salt.",
      "Serve with brown basmati rice or wholemeal flatbreads, scattered with fresh coriander. Offer chilli flakes or sliced fresh chilli at the table for those who want heat.",
    ],
  },
  {
    recipeId: "THA-005",
    name: "The Healthy Apples Gentle Taco Rice Bowls",
    category: "dinner",
    servings: 4,
    ingredients: [
      "250g brown rice",
      "1 tbsp olive oil",
      "1 onion, finely chopped",
      "1 red pepper, diced",
      "2 garlic cloves, crushed",
      "250g quality lean beef mince (about 12% fat, from a trusted source)",
      "1 tsp ground cumin",
      "1 tsp sweet smoked paprika",
      "1 tsp dried oregano",
      "1 tbsp tomato purée",
      "1 x 400g tin chopped tomatoes",
      "1 x 400g tin black beans, drained and rinsed",
      "200g tin sweetcorn, drained (optional)",
      "Black pepper, salt to taste",
      "To serve: shredded lettuce, diced tomato, diced avocado, a squeeze of lime, natural yoghurt",
    ],
    method: [
      "Cook the brown rice in boiling water until tender, then drain.",
      "Meanwhile, heat the oil in a large pan and cook the onion and red pepper for 6–7 minutes until soft. Add the garlic and cook 1 minute.",
      "Push the vegetables to one side, add the beef mince and brown it well, breaking it up as it cooks.",
      "Stir in the cumin, smoked paprika and oregano, then the tomato purée, and cook for 1 minute.",
      "Add the chopped tomatoes, black beans and sweetcorn. Simmer for 10 minutes until thickened. Season with pepper and a little salt.",
      "Divide the brown rice between bowls, spoon over the taco mixture, and let everyone add their own lettuce, tomato, avocado, lime and yoghurt.",
      "Offer sliced jalapeños or hot sauce at the table for anyone who wants heat.",
    ],
  },
  {
    recipeId: "THA-006",
    name: "The Healthy Apples Roast Vegetable & Butter Bean Traybake",
    category: "dinner",
    servings: 4,
    ingredients: [
      "2 courgettes, cut into chunks",
      "1 red pepper and 1 yellow pepper, cut into chunks",
      "1 red onion, cut into wedges",
      "300g cherry tomatoes",
      "2 x 400g tins butter beans, drained and rinsed",
      "3 garlic cloves, thinly sliced",
      "2 tbsp olive oil",
      "1 tsp dried mixed herbs",
      "1 tbsp tomato purée",
      "1 tsp balsamic vinegar",
      "Black pepper, salt to taste",
      "A handful of fresh parsley or basil, chopped",
      "Wholegrain bread or a spoon of brown rice, to serve",
    ],
    method: [
      "Heat the oven to 200°C fan. Put the courgettes, peppers, red onion and cherry tomatoes into a large roasting tray.",
      "Add the garlic, 1 tbsp of the olive oil and the mixed herbs. Toss to coat and roast for 20 minutes.",
      "Meanwhile, whisk the tomato purée, balsamic vinegar and remaining 1 tbsp olive oil with 3 tbsp water to make a loose dressing.",
      "Take the tray out, add the butter beans, pour over the dressing and toss everything together. Return to the oven for 15–18 minutes until the vegetables are tender and lightly caramelised.",
      "Season with pepper and a little salt, scatter with parsley or basil, and serve with wholegrain bread or brown rice.",
    ],
  },
  {
    recipeId: "THA-007",
    name: "The Healthy Apples Chicken, Leek & Wholewheat Orzo One-Pot",
    category: "dinner",
    servings: 4,
    ingredients: [
      "1 tbsp olive oil",
      "4 skinless, boneless chicken thighs (quality / higher-welfare), each cut into 3",
      "2 leeks, sliced and washed",
      "2 carrots, diced",
      "2 garlic cloves, crushed",
      "1 tsp dried thyme",
      "250g wholewheat orzo",
      "900ml low-salt chicken stock",
      "100g frozen peas",
      "80g fresh spinach",
      "Zest of 1 lemon and a squeeze of juice",
      "Black pepper, salt to taste",
      "Grated Parmesan or hard cheese, to serve (optional)",
    ],
    method: [
      "Heat the oil in a large, deep pan or casserole. Brown the chicken pieces for 4–5 minutes until golden, then lift out and set aside.",
      "Add the leeks and carrots to the pan and cook gently for 6–7 minutes until softening. Stir in the garlic and thyme and cook 1 minute.",
      "Return the chicken to the pan, add the orzo and pour in the stock. Stir well.",
      "Simmer, stirring often so the orzo doesn't stick, for 12–14 minutes until the orzo is tender and the chicken is cooked through.",
      "Stir in the peas and spinach and cook for 2–3 minutes until the greens wilt and the peas are hot.",
      "Add the lemon zest and a squeeze of juice, season with pepper and a little salt, and serve with a little grated cheese if wanted.",
    ],
  },
  {
    recipeId: "THA-008",
    name: "The Healthy Apples Lentil & Root Vegetable Cottage Pie",
    category: "dinner",
    servings: 6,
    ingredients: [
      "1 tbsp olive oil",
      "1 onion, finely chopped",
      "2 carrots, diced",
      "2 celery sticks, diced",
      "1 parsnip, diced",
      "2 garlic cloves, crushed",
      "1 tbsp tomato purée",
      "300g dried green or brown lentils, rinsed (or 2 x 400g tins, drained)",
      "1 x 400g tin chopped tomatoes",
      "600ml low-salt vegetable stock",
      "1 tsp dried thyme",
      "1 tsp dried rosemary",
      "1 tbsp Worcestershire sauce (or a vegetarian equivalent)",
      "150g frozen peas",
      "Black pepper, salt to taste",
      "For the topping: 1kg potatoes, peeled and chopped",
      "For the topping: 200g swede or extra potato, peeled and chopped",
      "For the topping: 30g butter",
      "For the topping: 3 tbsp milk",
      "For the topping: black pepper",
    ],
    method: [
      "Heat the oil in a large pan. Cook the onion, carrot, celery and parsnip gently for 10 minutes until softening. Add the garlic and cook 1 minute.",
      "Stir in the tomato purée, then add the lentils, chopped tomatoes, stock, thyme, rosemary and Worcestershire sauce.",
      "Bring to a simmer, then cook, partly covered, for 30–35 minutes (if using dried lentils) until the lentils are tender and the mixture is thick. Add a splash more stock if it dries out. Stir in the peas and season. If using tinned lentils, simmer for 15 minutes only.",
      "Meanwhile, boil the potatoes and swede until tender, about 18 minutes. Drain well, then mash with the butter and milk and season with pepper.",
      "Heat the oven to 200°C fan. Spoon the lentil base into an ovenproof dish, top evenly with the mash and rough up the surface with a fork.",
      "Bake for 25–30 minutes until the topping is golden and the filling bubbles at the edges. Rest for 5 minutes before serving with a green vegetable.",
    ],
  },
  {
    recipeId: "THA-009",
    name: "The Healthy Apples Salmon, Broccoli & Brown Rice Traybake",
    category: "dinner",
    servings: 4,
    ingredients: [
      "250g brown rice",
      "4 quality salmon fillets (about 120g each)",
      "1 large head of broccoli, cut into small florets",
      "250g cherry tomatoes",
      "1 tbsp olive oil",
      "2 garlic cloves, thinly sliced",
      "Zest and juice of 1 lemon",
      "1 tsp dried oregano",
      "Black pepper, salt to taste",
      "Fresh dill or parsley, chopped, to finish",
    ],
    method: [
      "Cook the brown rice in boiling water until tender, then drain and keep warm.",
      "Heat the oven to 200°C fan. Toss the broccoli florets and cherry tomatoes with the olive oil, garlic, oregano and lemon zest in a large roasting tray. Roast for 12 minutes.",
      "Take the tray out, make four gaps and nestle in the salmon fillets. Squeeze over half the lemon juice and season with pepper and a little salt.",
      "Return to the oven for 12–14 minutes until the salmon flakes easily and the broccoli is tender with lightly charred edges.",
      "Spoon the brown rice onto plates, top with the roasted vegetables and salmon, finish with the remaining lemon juice and a scattering of dill or parsley.",
    ],
  },
  {
    recipeId: "THA-010",
    name: "The Healthy Apples Roasted Carrot, Chickpea & Herb Grain Salad",
    category: "side",
    servings: 4,
    ingredients: [
      "150g wholegrain bulgur wheat",
      "400g carrots, cut into batons",
      "1 x 400g tin chickpeas, drained and rinsed",
      "2 tbsp olive oil",
      "1 tsp ground cumin",
      "1 tsp sweet smoked paprika",
      "Zest and juice of 1 lemon",
      "3 spring onions, sliced",
      "A large handful of fresh parsley and mint, chopped",
      "2 tbsp mixed seeds",
      "Black pepper, salt to taste",
    ],
    method: [
      "Heat the oven to 200°C fan. Toss the carrot batons and chickpeas with 1 tbsp of the olive oil, the cumin and the smoked paprika on a roasting tray. Roast for 25–28 minutes, turning once, until the carrots are tender and the chickpeas are lightly crisp.",
      "Meanwhile, cook the bulgur wheat according to the packet (usually simmer 10–12 minutes, or soak in just-boiled water until tender), then drain any excess and fluff with a fork.",
      "Whisk the remaining 1 tbsp olive oil with the lemon zest and juice and a little pepper and salt.",
      "Combine the bulgur, roasted carrots and chickpeas, spring onions and herbs in a large bowl. Pour over the dressing and toss well.",
      "Scatter with the mixed seeds. Serve warm as a side, or cool and pack into containers for a lunchbox.",
    ],
  },
];

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "REFUSING TO RUN: NODE_ENV=production. This importer is dev-only and must never write to production.",
    );
    process.exit(1);
  }
}

async function existingSystemMealNames(): Promise<Set<string>> {
  const rows = await db
    .select({ name: meals.name })
    .from(meals)
    .where(and(eq(meals.isSystemMeal, true), ilike(meals.name, `${NAME_PREFIX}%`)));
  return new Set(rows.map((r) => r.name));
}

async function runImport() {
  assertNotProduction();

  // Every recipe name must begin with the branding prefix.
  for (const r of RECIPES) {
    if (!r.name.startsWith(NAME_PREFIX)) {
      throw new Error(`Recipe ${r.recipeId} name does not begin with "${NAME_PREFIX}": ${r.name}`);
    }
  }

  const existing = await existingSystemMealNames();
  let inserted = 0;
  let skipped = 0;
  const insertedNames: string[] = [];

  for (const r of RECIPES) {
    if (existing.has(r.name)) {
      skipped++;
      console.log(`SKIP  (already present) ${r.recipeId} — ${r.name}`);
      continue;
    }
    await storage.createMeal(SYSTEM_USER_ID, {
      name: r.name,
      ingredients: r.ingredients,
      instructions: r.method,
      servings: r.servings,
      categoryId: CATEGORY[r.category],
      isSystemMeal: true,
      mealSourceType: "starter", // THA founding/authored → derives tha_library/authored
      mealFormat: "recipe",
      kind: "meal",
      acquisitionLane: "tha_library",
      acquisitionType: "authored",
    });
    inserted++;
    insertedNames.push(r.name);
    console.log(`INSERT ${r.recipeId} — ${r.name} (category ${CATEGORY[r.category]})`);
  }

  console.log("\n──────── SUMMARY ────────");
  console.log(`Recipes in batch : ${RECIPES.length}`);
  console.log(`Inserted         : ${inserted}`);
  console.log(`Skipped (dupes)  : ${skipped}`);
  if (insertedNames.length) {
    console.log("Inserted names:");
    insertedNames.forEach((n) => console.log(`  - ${n}`));
  }
  await pool.end();
}

async function runRollback() {
  assertNotProduction();
  const result = await db
    .delete(meals)
    .where(and(eq(meals.isSystemMeal, true), ilike(meals.name, `${NAME_PREFIX}%`)))
    .returning({ id: meals.id, name: meals.name });
  console.log(`ROLLBACK: deleted ${result.length} system meal(s):`);
  result.forEach((r) => console.log(`  - [${r.id}] ${r.name}`));
  await pool.end();
}

const mode = process.argv.includes("--rollback") ? "rollback" : "import";
(mode === "rollback" ? runRollback() : runImport()).catch((e) => {
  console.error(e);
  process.exit(1);
});
