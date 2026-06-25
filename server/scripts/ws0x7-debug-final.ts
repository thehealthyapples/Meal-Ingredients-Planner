import { resolveIngredientSlugs } from "../services/nutrition-knowledge-registry.js";

const tests = [
  "Free-range chicken breast",
  "tinned chopped tomatoes",
  "4 large Egg",
  "1 red onion cut into thin wedges",
  "1 yellow pepper finely sliced",
  "3 large garlic cloves crushed",
  "1 heaped tsp sweet smoked paprika",
  "1 tsp coriander seeds crushed",
  "Tenderstem broccoli",
  "spring onions",
  "Mixed salad leaves",
  "new potatoes",
  "½ small bunch coriander roughly chopped",
  "small bunch basil",
  "pinch chilli flakes",
  "roast potatoes",
  "braised red cabbage",
  "smoked salmon",
  "cauliflower cheese",
  "2 salmon fillets",
  "500g spaghetti",
  "400g can chickpeas",
  "200g basmati rice",
  "cocoa powder",
  "4 large free range eggs",
  "pack of baby spinach",
];

async function main() {
  const results = await resolveIngredientSlugs(tests);
  for (const t of tests) {
    const slug = results.get(t);
    console.log(`${slug ? '✓' : '✗'} ${slug ?? 'UNMATCHED'} ← "${t}"`);
  }
}

main().catch(console.error);
