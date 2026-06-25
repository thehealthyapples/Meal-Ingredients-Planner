import { normalizeIngredientKey } from "../../shared/normalize.js";
import { resolveIngredientAlias } from "../../shared/ingredient-aliases.js";
import { listFoods, resolveIngredientSlugs } from "../services/nutrition-knowledge-registry.js";
import { pool } from "../db.js";

const tests = [
  "4 large Egg",
  "1 red onion cut into thin wedges",
  "1 red pepper finely sliced",
  "1 yellow pepper finely sliced",
  "3 large garlic cloves crushed",
  "1 heaped tsp sweet smoked paprika",
  "1 tsp coriander seeds crushed",
  "Tenderstem broccoli",
  "Free-range chicken breast",
  "spring onions",
  "Mixed salad leaves",
  "new potatoes",
  "coriander seeds",
  "ground coriander",
  "tinned chopped tomatoes",
  "400g can cherry tomatoes",
  "115g baby spinach",
  "4 medium eggs",
];

async function main() {
  const result = await resolveIngredientSlugs(tests);
  for (const t of tests) {
    const slug = result.get(t);
    console.log(slug ? `✓ ${slug.padEnd(25)} ← "${t}"` : `✗ UNMATCHED              ← "${t}"`);
  }
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
