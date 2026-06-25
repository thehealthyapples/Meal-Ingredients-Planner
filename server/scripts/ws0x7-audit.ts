import { db, pool } from "../db.js";
import { meals } from "../../shared/schema.js";
import { resolveIngredientSlugs, listFoods } from "../services/nutrition-knowledge-registry.js";
import { normalizeIngredientKey } from "../../shared/normalize.js";

async function main() {
  const allMeals = await db.select({ ingredients: meals.ingredients }).from(meals);
  const allIngredients = new Set<string>();
  for (const m of allMeals) for (const ing of m.ingredients) allIngredients.add(ing.trim());

  const foods = await listFoods();
  const ingredientArr = Array.from(allIngredients);

  // Resolve in batches (resolveIngredientSlugs uses the updated engine)
  const slugMap = await resolveIngredientSlugs(ingredientArr);

  const matched = slugMap.size;
  const unmatched: string[] = ingredientArr.filter(r => !slugMap.has(r));
  const total = ingredientArr.length;
  const pct = (n: number) => ((n/total)*100).toFixed(1);

  console.log('WS0 knowledge foods:', foods.length);
  console.log('Total unique ingredients in meals DB:', total);
  console.log(`\nWS0 matched: ${matched} (${pct(matched)}%)`);
  console.log(`Unmatched:   ${unmatched.length} (${pct(unmatched.length)}%)`);

  const cats: Record<string, string[]> = { whole_meal_name:[], qty_prefix:[], prep_leading:[], condiment_stock:[], seasoning:[], unknown:[] };
  for (const raw of unmatched) {
    const l = raw.toLowerCase().trim();
    if (/^(breakfast|lunch|dinner|omelette|omelet|smoothie|salad|soup|pasta|pizza|curry|stew|casserole|pie|sandwich|wrap|bowl|stir.fry|risotto|pilaf|porridge|granola|scrambled|baked|burger)/i.test(l)) cats.whole_meal_name.push(raw);
    else if (/^\d/.test(raw) || /^(a |an |one |some |half )/i.test(raw)) cats.qty_prefix.push(raw);
    else if (/^(chopped|sliced|diced|minced|grated|shredded|toasted|roasted|crushed|dried|cooked|raw|frozen|fresh|peeled|finely|roughly|lightly|wilted|ground|whole|tinned|canned)/i.test(l)) cats.prep_leading.push(raw);
    else if (/sauce|stock|broth|gravy|paste|seasoning|dressing|marinade|vinegar|syrup|extract|concentrate|jus|brine|pickle/i.test(l)) cats.condiment_stock.push(raw);
    else if (/^(salt|pepper|water|ice)\b/i.test(l)) cats.seasoning.push(raw);
    else cats.unknown.push(raw);
  }

  console.log('\n=== FAILURE CATEGORIES ===');
  for (const [cat, items] of Object.entries(cats).sort((a,b)=>b[1].length-a[1].length)) {
    if (!items.length) continue;
    console.log(`\n${cat}: ${items.length} (${((items.length/unmatched.length)*100).toFixed(1)}% of unmatched)`);
    console.log('  ' + items.slice(0,8).join('\n  '));
  }

  const shortUnknown = cats.unknown.filter(s => s.split(' ').length <= 3);
  console.log(`\n=== SHORT UNKNOWN (≤3 words): ${shortUnknown.length} ===`);
  shortUnknown.slice(0,60).forEach(s => console.log(' -', s));
  
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
