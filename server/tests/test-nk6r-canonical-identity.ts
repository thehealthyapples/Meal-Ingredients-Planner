/**
 * NK6R — Canonical Food Identity Governance verification tests.
 *
 * Locks in the rulings applied from NK6Q plus the three hierarchy amendments.
 * Pure (no DB): everything here runs against the editorial seed through the ONE
 * shared resolver (GOV2 Rule 5), so it is the same interpretation the importer,
 * search and AI paths get.
 *
 * The suite has two halves and BOTH matter:
 *   1. The splits landed  — a string that used to reach the wrong identity now
 *      reaches the right one (or the identity it names).
 *   2. The merges held    — narrowing ~30 greedy aliases must not have dropped
 *      resolution coverage for the ~53 strings NK6Q ruled genuine merges.
 *
 * Run with:  npm run test:nk6r-canonical-identity
 */
import {
  CANONICAL_FOOD_SEED,
  buildCanonicalIndex,
  resolveCanonicalFood,
  validateCanonicalSeed,
} from "../../shared/canonical/index.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

/** Assert that `input` resolves to canonical food `slug`. */
function resolvesTo(input: string, slug: string) {
  const got = resolveCanonicalFood(input);
  check(`"${input}" → ${slug}`, got.canonicalSlug === slug, got.canonicalSlug ?? "unresolved");
}

const bySlug = new Map(CANONICAL_FOOD_SEED.map((f) => [f.slug, f]));
const childrenOf = (parent: string) => CANONICAL_FOOD_SEED.filter((f) => f.family === parent).map((f) => f.slug);

console.log("\nNK6R — Canonical Food Identity Governance\n");

// ── 0. Seed integrity ────────────────────────────────────────────────────────
console.log("Seed integrity");
{
  const problems = validateCanonicalSeed();
  check("validateCanonicalSeed() is clean", problems.length === 0, problems.slice(0, 3).join(" | "));

  const { conflicts } = buildCanonicalIndex();
  check(
    "no alias_key claimed by two identities (anti-fork lock)",
    conflicts.length === 0,
    conflicts.map((c) => `"${c.key}": ${c.foods.join(" vs ")}`).join(" | "),
  );
}

// ── 1. Amendment 1 — Olive Oil ───────────────────────────────────────────────
console.log("\nAmendment 1 — Olive Oil is the parent, the grades are children");
{
  // The NK6Q §2.5 scope INVERSION: "olive oil" used to land on the narrower EVOO.
  resolvesTo("olive oil", "olive-oil");
  resolvesTo("EVOO", "extra-virgin-olive-oil");
  resolvesTo("extra virgin olive oil", "extra-virgin-olive-oil");
  resolvesTo("virgin olive oil", "virgin-olive-oil");
  resolvesTo("refined olive oil", "refined-olive-oil");
  resolvesTo("light olive oil", "refined-olive-oil");
  resolvesTo("olive pomace oil", "olive-pomace-oil");
  resolvesTo("pomace oil", "olive-pomace-oil");

  const kids = childrenOf("olive-oil").sort();
  check(
    "olive-oil parents exactly the four grades",
    JSON.stringify(kids) === JSON.stringify(["extra-virgin-olive-oil", "olive-pomace-oil", "refined-olive-oil", "virgin-olive-oil"]),
    kids.join(", "),
  );
  check("olive-oil is top-level", bySlug.get("olive-oil")?.family == null);
}

// ── 2. Amendment 2 — Cheese ──────────────────────────────────────────────────
console.log("\nAmendment 2 — Cheese parent, meaningful families, texture as attribute");
{
  resolvesTo("cheese", "cheese");
  // NK6Q §2.2 — blue-cheese's own description named these while stilton was separate.
  resolvesTo("gorgonzola", "gorgonzola");
  resolvesTo("roquefort", "roquefort");
  resolvesTo("stilton", "stilton");
  resolvesTo("blue cheese", "blue-cheese"); // family survives as the coarse identity
  resolvesTo("grana padano", "grana-padano");
  resolvesTo("parmigiano reggiano", "parmesan");
  resolvesTo("buffalo mozzarella", "buffalo-mozzarella");
  resolvesTo("mozzarella", "mozzarella");

  check("stilton → blue-cheese → cheese (three levels)",
    bySlug.get("stilton")?.family === "blue-cheese" && bySlug.get("blue-cheese")?.family === "cheese");
  check("gorgonzola and roquefort are siblings of stilton",
    bySlug.get("gorgonzola")?.family === "blue-cheese" && bySlug.get("roquefort")?.family === "blue-cheese");
  check("grana-padano is NOT a child of parmesan", bySlug.get("grana-padano")?.family !== "parmesan");

  // The amendment's hard rule: Hard/Soft are attributes, never hierarchy levels.
  const textureWords = /^(hard|soft|semi[- ]?hard|semi[- ]?soft|fresh)$/i;
  const offenders = CANONICAL_FOOD_SEED.filter((f) => f.family && textureWords.test(f.family));
  check("no food is parented by a texture word", offenders.length === 0, offenders.map((f) => `${f.slug}→${f.family}`).join(", "));
  check("texture lives in subcategory instead", textureWords.test(bySlug.get("cheddar")?.subcategory ?? ""), bySlug.get("cheddar")?.subcategory ?? "null");

  const families = childrenOf("cheese");
  for (const f of ["blue-cheese", "fresh-cheese", "brined-cheese", "washed-rind-cheese", "pasta-filata"]) {
    check(`"${f}" is a declared cheese family`, families.includes(f));
  }

  // Maturity is a variety of one cheese, not a second fact owner.
  const mature = resolveCanonicalFood("mature cheddar");
  check('"mature cheddar" → cheddar as a VARIETY', mature.canonicalSlug === "cheddar" && mature.matchType === "variety", mature.matchType);
}

// ── 3. Amendment 3 — Pasta ───────────────────────────────────────────────────
console.log("\nAmendment 3 — pasta TYPE is an identity, pasta SHAPE is a form");
{
  resolvesTo("pasta", "pasta");
  // An unqualified "pasta" is type-unknown, so it must not claim a plant it may not contain.
  check("pasta parent claims no diversity group", resolveCanonicalFood("pasta").diversityGroupSlug === null);

  // TYPES — each owns its own identity and its own plant.
  // NK6S narrowed this from six to five: `spinach-pasta` is a VARIETY of wheat-pasta,
  // not a type, because spinach colours the dough without changing the plant.
  // See test-nk6s-beverage-and-pasta.ts.
  const types = childrenOf("pasta").sort();
  check("pasta parents the five types",
    JSON.stringify(types) === JSON.stringify(["chickpea-pasta", "lentil-pasta", "pea-pasta", "wheat-pasta", "wholewheat-pasta"]),
    types.join(", "));
  resolvesTo("chickpea pasta", "chickpea-pasta");
  resolvesTo("lentil pasta", "lentil-pasta");
  resolvesTo("wholemeal pasta", "wholewheat-pasta");
  check("chickpea pasta counts chickpeas", resolveCanonicalFood("chickpea pasta").diversityGroupSlug === "chickpeas");
  check("lentil pasta counts lentils", resolveCanonicalFood("lentil pasta").diversityGroupSlug === "lentils");

  // SHAPES — forms of the type they are made from, never identities.
  for (const shape of ["spaghetti", "penne", "fusilli", "tagliatelle", "rigatoni", "macaroni", "linguine", "orzo"]) {
    resolvesTo(shape, "wheat-pasta");
  }
  for (const shape of ["spaghetti", "penne", "fusilli"]) {
    check(`"${shape}" is a FORM, not an identity`, resolveCanonicalFood(shape).matchType === "alias");
  }
  check("no pasta shape has its own canonical identity",
    !["spaghetti", "penne", "fusilli", "tagliatelle", "rigatoni", "macaroni"].some((s) => bySlug.has(s)));

  // The wheat shapes must not have lost their plant or their editorial content.
  check('"spaghetti" still counts wheat', resolveCanonicalFood("spaghetti").diversityGroupSlug === "wheat");
  check('"spaghetti" still reaches the pasta knowledge food', resolveCanonicalFood("spaghetti").knowledgeFoodSlug === "pasta");
  // Grain class differs, shape does not: wholewheat spaghetti is the wholewheat TYPE.
  resolvesTo("wholewheat spaghetti", "wholewheat-pasta");
}

// ── 4. The greedy alias sets NK6Q ordered narrowed ───────────────────────────
console.log("\nNK6Q §2 — over-greedy alias sets narrowed, blocked identities minted");
{
  // §2.1 species livers — the generic used to swallow all three.
  resolvesTo("beef liver", "beef-liver");
  resolvesTo("chicken liver", "chicken-liver");
  resolvesTo("chicken livers", "chicken-liver");
  resolvesTo("lamb liver", "lamb-liver");
  resolvesTo("lambs liver", "lamb-liver");
  resolvesTo("liver", "liver"); // coarse fallback survives

  // §2.3 a milled flour is not its whole grain.
  resolvesTo("buckwheat flour", "buckwheat-flour");
  resolvesTo("oat flour", "oat-flour");
  resolvesTo("rye flour", "rye-flour");
  resolvesTo("wholemeal flour", "wholemeal-flour");
  resolvesTo("wheat flour", "plain-wheat-flour");
  resolvesTo("buckwheat", "buckwheat");
  resolvesTo("oats", "oats");
  resolvesTo("rye", "rye");
  resolvesTo("wheat", "wheat");

  // §2.4 resolver mis-targets: the merge target was the wrong existing food.
  resolvesTo("cocoa powder", "cacao-powder");
  resolvesTo("giant couscous", "pearl-couscous");
  resolvesTo("couscous", "couscous");
  resolvesTo("dark chocolate", "dark-chocolate");

  // §2.5 scope inversions and plant-part splits.
  resolvesTo("fennel", "fennel");             // the bulb VEGETABLE
  resolvesTo("fennel seeds", "fennel-seeds"); // the SPICE
  resolvesTo("fenugreek", "fenugreek");       // the SEED spice
  resolvesTo("fenugreek leaves", "fenugreek-leaves");
  resolvesTo("kasuri methi", "fenugreek-leaves");
  resolvesTo("methi seeds", "fenugreek");
}

// ── 5. Separate identities + splitting preparations ──────────────────────────
console.log("\nNK6Q §4.1 — the separate identities and the preparations that split");
{
  const cases: [string, string][] = [
    ["white pepper", "white-pepper"], ["black pepper", "black-pepper"],
    ["smoked paprika", "smoked-paprika"], ["paprika", "paprika"],
    ["toasted sesame oil", "toasted-sesame-oil"], ["sesame oil", "sesame-oil"],
    ["peanut butter", "peanut-butter"], ["peanuts", "peanuts"],
    ["preserved lemons", "preserved-lemons"], ["lemon", "lemon"],
    ["vanilla extract", "vanilla-extract"], ["vanilla", "vanilla"],
    ["coconut water", "coconut-water"], ["coconut", "coconut"],
    ["cuttlefish", "cuttlefish"], ["squid", "squid"],
    ["mutton", "mutton"], ["lamb", "lamb"],
    ["skimmed milk", "skimmed-milk"], ["semi-skimmed milk", "semi-skimmed-milk"], ["milk", "milk"],
    ["whipping cream", "whipping-cream"], ["double cream", "double-cream"],
    ["wholewheat couscous", "wholewheat-couscous"],
  ];
  for (const [input, slug] of cases) resolvesTo(input, slug);

  // ghee and clarified-butter are ONE identity, and neither is butter.
  resolvesTo("ghee", "ghee");
  resolvesTo("clarified butter", "ghee");
  resolvesTo("butter", "butter");
  check("ghee did not fork clarified-butter into a second slug", !bySlug.has("clarified-butter"));
}

// ── 6. The merges must NOT have regressed ────────────────────────────────────
// Narrowing an alias set is how coverage gets silently lost. Every string NK6Q
// ruled a genuine Merge / Form / Cut / Variety must still reach its base identity.
console.log("\nNK6Q §3 — the ~53 merges still resolve to their base identity");
{
  const merges: [string, string][] = [
    // Merge into existing food
    ["maize", "corn"], ["pilchards", "sardines"], ["coley", "pollock"], ["saithe", "pollock"],
    ["calamari", "squid"], ["shrimp", "prawns"], ["cashew nuts", "cashews"], ["flaxseeds", "flaxseed"],
    ["macadamia nuts", "macadamia"], ["miso paste", "miso"], ["soured cream", "sour-cream"],
    ["whole milk", "milk"], ["hen eggs", "eggs"], ["whole chicken", "chicken"], ["cumin seeds", "cumin"],
    ["fenugreek seeds", "fenugreek"], ["button mushrooms", "mushroom"],
    // Form — a physical format is never an identity
    ["jumbo oats", "oats"], ["rolled oats", "oats"], ["pearl barley", "barley"],
    ["black peppercorns", "black-pepper"], ["chilli flakes", "chilli"], ["ground cumin", "cumin"],
    ["king prawns", "prawns"], ["chicken mince", "chicken"], ["turkey mince", "turkey"],
    ["beef mince", "beef"], ["lamb mince", "lamb"], ["pork mince", "pork"], ["venison mince", "venison"],
    // Cut — no THA-approved cut-level fact owner
    ["chicken breast", "chicken"], ["chicken thighs", "chicken"], ["duck breast", "duck"], ["duck legs", "duck"],
    ["turkey breast", "turkey"], ["lamb chops", "lamb"], ["lamb leg", "lamb"], ["lamb shoulder", "lamb"],
    ["pork belly", "pork"], ["pork chops", "pork"], ["pork tenderloin", "pork"], ["venison steak", "venison"],
    // Variety — a cultivar / breed / maturity of the base
    ["basmati rice", "white-rice"], ["jasmine rice", "white-rice"], ["risotto rice", "white-rice"],
    ["sushi rice", "white-rice"], ["curly parsley", "parsley"], ["flat-leaf parsley", "parsley"],
    ["brown crab", "crab"], ["mature cheddar", "cheddar"], ["mild cheddar", "cheddar"],
  ];
  for (const [input, slug] of merges) resolvesTo(input, slug);
}

// ── 7. A hierarchy is not an alias ───────────────────────────────────────────
// The failure mode this whole workstream exists to prevent: a child that is ALSO
// swallowed by its parent's alias set is just the old over-merge with extra steps.
console.log("\nGOV2 — a child is never an alias of its own parent");
{
  let violations = 0;
  for (const food of CANONICAL_FOOD_SEED) {
    if (!food.family) continue;
    const own = resolveCanonicalFood(food.name);
    if (own.canonicalSlug !== food.slug) {
      violations++;
      console.error(`  ✗ "${food.name}" resolves to ${own.canonicalSlug}, not its own identity ${food.slug}`);
    }
  }
  check("every child identity resolves to itself, not its parent", violations === 0);

  // And every family pointer terminates at a real root.
  let unrooted = 0;
  for (const food of CANONICAL_FOOD_SEED) {
    let cur: string | null | undefined = food.family;
    let hops = 0;
    while (cur && hops++ < 16) cur = bySlug.get(cur)?.family ?? null;
    if (hops >= 16) unrooted++;
  }
  check("every family chain terminates at a top-level identity", unrooted === 0);
}

console.log(`\n${failed === 0 ? "✅" : "❌"} NK6R — ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
