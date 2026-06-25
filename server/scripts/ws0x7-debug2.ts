import { resolveIngredientAlias } from "../../shared/ingredient-aliases.js";
import { normalizeIngredientKey } from "../../shared/normalize.js";
import { pool } from "../db.js";

const tests = ['Free-range chicken breast', 'tinned chopped tomatoes', 'Tinned chopped tomatoes', 'free range chicken breast'];
for (const t of tests) {
  const norm = normalizeIngredientKey(t);
  const alias = resolveIngredientAlias(t);
  console.log(`"${t}" -> norm:"${norm}" -> alias:"${alias}"`);
}
await pool.end();
