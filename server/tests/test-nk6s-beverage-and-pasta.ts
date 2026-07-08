/**
 * NK6S — Beverage & Pasta taxonomy refinement verification tests.
 *
 * Two approved refinements on top of NK6R:
 *   1. Beverages are a first-class canonical domain with a real hierarchy, built
 *      to absorb the batch-014 tea / coffee / cocoa / juice drafts on promotion.
 *   2. Spinach Pasta is a VARIETY of wheat-pasta, not a sixth pasta type.
 *
 * Pure (no DB): runs against the editorial seed through the ONE shared resolver
 * (GOV2 Rule 5), so it tests the same interpretation the importer, search and AI
 * paths receive.
 *
 * The load-bearing half of this suite is the NEGATIVE space — what must NOT have
 * happened. A hierarchy refinement is exactly the kind of change that silently
 * moves a plant count, re-points a knowledge food, or forks an alias key.
 *
 * Run with:  npm run test:nk6s-beverage-and-pasta
 */
import {
  CANONICAL_FOOD_SEED,
  FOOD_CONTEXT_SEED,
  FOOD_VARIETY_SEED,
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

const BEVERAGE_FAMILIES = [
  "tea", "herbal-infusion", "coffee", "cocoa-beverage", "juice",
  "plant-water", "fermented-beverage", "plant-beverage", "dairy-beverage",
] as const;

console.log("\nNK6S — Beverage & Pasta taxonomy refinement\n");

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

// ── 1. Beverages are a first-class canonical domain ──────────────────────────
console.log("\nRefinement 1 — Beverages: a real domain, not a leftover bucket");
{
  resolvesTo("beverage", "beverage");
  check("beverage is a top-level identity", bySlug.get("beverage")?.family == null);
  check('beverage carries category "Beverages"', bySlug.get("beverage")?.category === "Beverages");

  // NK6R minted an ad-hoc one-member `Drinks` category. It is retired, and the word
  // it used survives as an alias so no user string loses coverage.
  const stillDrinks = CANONICAL_FOOD_SEED.filter((f) => f.category === "Drinks");
  check('no canonical food remains in the retired "Drinks" category', stillDrinks.length === 0,
    stillDrinks.map((f) => f.slug).join(", "));
  resolvesTo("drink", "beverage");
  resolvesTo("drinks", "beverage");

  // The hierarchy exists NOW — it is not deferred behind the batch-014 import.
  const families = childrenOf("beverage").sort();
  check("beverage parents exactly the nine declared families",
    JSON.stringify(families) === JSON.stringify([...BEVERAGE_FAMILIES].sort()),
    families.join(", "));
  for (const f of BEVERAGE_FAMILIES) {
    // Each family is a legitimate coarse identity in its own right (the `blue-cheese`
    // precedent) — it must resolve to ITSELF, never be swallowed by its parent.
    // (Resolve the spoken form: normalizeIngredientKey strips hyphens, so a raw slug
    // is not an index key — "herbal-infusion" is reached as "herbal infusion".)
    check(`"${f}" is a coarse identity that resolves to itself`,
      resolveCanonicalFood(f.replace(/-/g, " ")).canonicalSlug === f);
  }
}

// ── 2. The bindings — family changes, domain untouched ───────────────────────
console.log("\nRefinement 1 — the drink-first foods bind; their DOMAIN is not rewritten");
{
  // category = domain of origin; family = hierarchy. NK6S changes only the latter.
  const bindings: [string, string, string][] = [
    // slug              family                category (unchanged)
    ["coconut-water", "plant-water", "Beverages"],
    ["kombucha", "fermented-beverage", "Fermented foods"],
    ["kefir", "fermented-beverage", "Dairy"],
    ["oat-milk", "plant-beverage", "Dairy alternatives"],
    ["soy-milk", "plant-beverage", "Dairy alternatives"],
    ["almond-milk", "plant-beverage", "Dairy alternatives"],
    ["buttermilk", "dairy-beverage", "Dairy"],
  ];
  for (const [slug, family, category] of bindings) {
    const f = bySlug.get(slug);
    check(`${slug} → family ${family}`, f?.family === family, f?.family ?? "null");
    check(`${slug} keeps its domain "${category}"`, f?.category === category, f?.category ?? "null");
  }

  // The plant a food counts must survive being reparented. This is the silent-loss risk.
  check("oat-milk still counts oats", resolveCanonicalFood("oat milk").diversityGroupSlug === "oats");
  check("soy-milk still counts edamame", resolveCanonicalFood("soy milk").diversityGroupSlug === "edamame");
  check("almond-milk still counts almonds", resolveCanonicalFood("almond milk").diversityGroupSlug === "almonds");
  check("coconut-water still counts coconut", resolveCanonicalFood("coconut water").diversityGroupSlug === "coconut");
  // And so must its editorial content.
  check("kefir still reaches its knowledge food", resolveCanonicalFood("kefir").knowledgeFoodSlug === "kefir");
  check("buttermilk still reaches its knowledge food", resolveCanonicalFood("buttermilk").knowledgeFoodSlug === "buttermilk");
  check("fermented foods stay fermented", bySlug.get("kombucha")?.fermented === true && bySlug.get("kefir")?.fermented === true);
}

// ── 3. What must NOT have happened ───────────────────────────────────────────
console.log("\nRefinement 1 — the deliberate non-changes");
{
  // `milk` is the dairy fact owner and already parents its own fat classes. Pulling
  // that subtree under `beverage` would make a CONSUMPTION attribute a hierarchy
  // level — the move NK6R Amendment 2 rejected when it ruled Hard/Soft descriptive.
  check("milk is NOT parented into the beverage tree", bySlug.get("milk")?.family == null, bySlug.get("milk")?.family ?? "");
  check("milk keeps its fat-class children",
    childrenOf("milk").sort().join(",") === "semi-skimmed-milk,skimmed-milk", childrenOf("milk").join(","));
  resolvesTo("milk", "milk");
  resolvesTo("skimmed milk", "skimmed-milk");

  // ⚠ `cacao-powder` legitimately owns "cocoa" and "cacao" (NK6Q §2.4). Slugging the
  // cocoa DRINK family `cocoa` would be a resolver key collision. It is not.
  check("no canonical food is slugged `cocoa`", !bySlug.has("cocoa"));
  resolvesTo("cocoa", "cacao-powder");
  resolvesTo("cacao", "cacao-powder");
  resolvesTo("cocoa powder", "cacao-powder");
  resolvesTo("hot chocolate", "cocoa-beverage");
  resolvesTo("drinking chocolate", "cocoa-beverage");

  // Rooibos and chamomile are not Camellia sinensis. A different plant is a different
  // food (the `fennel` / `fennel-seeds` discipline), so infusions may not sit under tea.
  check("herbal-infusion is a sibling of tea, not its child",
    bySlug.get("herbal-infusion")?.family === "beverage");
  resolvesTo("herbal tea", "herbal-infusion");
  resolvesTo("tisane", "herbal-infusion");
  resolvesTo("tea", "tea");

  // Core Principle 6 — no fabricated knowledge. A type-unknown parent claims no plant
  // and no editorial content (the `pasta` / `mushroom` rule).
  for (const coarse of ["beverage", "tea", "coffee", "juice", "plant-water", "dairy-beverage"]) {
    const r = resolveCanonicalFood(coarse);
    check(`"${coarse}" claims no diversity group and no knowledge food`,
      r.diversityGroupSlug === null && r.knowledgeFoodSlug === null,
      `plant=${r.diversityGroupSlug} kf=${r.knowledgeFoodSlug}`);
  }

  // The importer hard-BLOCKS a draft only when its own identity resolves to a match
  // carrying a FOREIGN knowledge_food_slug. Every beverage family row carries null,
  // so none of them can ever block the batch-014 import.
  const blockers = ["beverage", ...BEVERAGE_FAMILIES].filter((s) => bySlug.get(s)?.knowledgeFoodSlug != null);
  check("no beverage family row can hard-block an import (all knowledgeFoodSlug=null)",
    blockers.length === 0, blockers.join(", "));
}

// ── 4. Refinement 2 — Spinach Pasta is a variety, not a type ─────────────────
console.log("\nRefinement 2 — Spinach Pasta is a VARIETY of wheat-pasta");
{
  check("spinach-pasta is no longer a canonical identity", !bySlug.has("spinach-pasta"));

  const spinach = resolveCanonicalFood("spinach pasta");
  check('"spinach pasta" → wheat-pasta as a VARIETY',
    spinach.canonicalSlug === "wheat-pasta" && spinach.matchType === "variety",
    `${spinach.canonicalSlug} [${spinach.matchType}]`);
  check('"spinach pasta" names the spinach-pasta variety', spinach.varietySlug === "spinach-pasta", spinach.varietySlug ?? "null");

  // A variety shares its parent's diversity group, so the plant count is IDENTICAL to
  // what NK6R gave it as a standalone identity: wheat, never spinach. One food, one plant.
  check('"spinach pasta" counts WHEAT', spinach.diversityGroupSlug === "wheat", spinach.diversityGroupSlug ?? "null");
  check('"spinach pasta" does NOT count spinach', spinach.diversityGroupSlug !== "spinach");
  // And it now reaches wheat pasta's editorial content, which it previously had none of.
  check('"spinach pasta" reaches the pasta knowledge food', spinach.knowledgeFoodSlug === "pasta", spinach.knowledgeFoodSlug ?? "null");

  // Its aliases came across with it. (An alias resolves to the FOOD, not the variety.)
  resolvesTo("pasta verde", "wheat-pasta");
  resolvesTo("spinach tagliatelle", "wheat-pasta");

  check("spinach-pasta is a variety of wheat-pasta",
    FOOD_VARIETY_SEED.some((v) => v.slug === "spinach-pasta" && v.canonicalFoodSlug === "wheat-pasta"));
  check("no stale food-context entry for the retired identity", !("spinach-pasta" in FOOD_CONTEXT_SEED));
}

// ── 5. The other pasta types are untouched ───────────────────────────────────
console.log("\nRefinement 2 — chickpea / lentil / pea pasta remain separate TYPES");
{
  const types = childrenOf("pasta").sort();
  check("pasta parents exactly the five remaining types",
    JSON.stringify(types) === JSON.stringify(["chickpea-pasta", "lentil-pasta", "pea-pasta", "wheat-pasta", "wholewheat-pasta"]),
    types.join(", "));

  // Each of these CHANGES THE PLANT — which is precisely why they are types and
  // spinach pasta is not. This is the line the refinement draws.
  const typePlants: [string, string, string][] = [
    ["chickpea pasta", "chickpea-pasta", "chickpeas"],
    ["lentil pasta", "lentil-pasta", "lentils"],
    ["pea pasta", "pea-pasta", "peas"],
    ["wheat pasta", "wheat-pasta", "wheat"],
    ["wholewheat pasta", "wholewheat-pasta", "wheat"],
  ];
  for (const [input, slug, plant] of typePlants) {
    const r = resolveCanonicalFood(input);
    check(`"${input}" → ${slug} counting ${plant}`,
      r.canonicalSlug === slug && r.diversityGroupSlug === plant,
      `${r.canonicalSlug} / ${r.diversityGroupSlug}`);
    // A TYPE is reached as its own identity. Contrast `spinach pasta`, which is
    // reached as matchType "variety" — that difference IS the refinement.
    check(`"${input}" is a TYPE (its own identity)`, r.matchType === "canonical", r.matchType);
  }
  // "wholemeal pasta" is the common-name ALIAS of the wholewheat TYPE (NK6R).
  resolvesTo("wholemeal pasta", "wholewheat-pasta");

  // NK6R's rulings on the pasta parent and its shapes must not have regressed.
  resolvesTo("pasta", "pasta");
  check("pasta parent still claims no diversity group", resolveCanonicalFood("pasta").diversityGroupSlug === null);
  for (const shape of ["spaghetti", "penne", "fusilli", "tagliatelle", "rigatoni", "macaroni", "linguine", "orzo"]) {
    resolvesTo(shape, "wheat-pasta");
  }
  check('"spaghetti" still counts wheat', resolveCanonicalFood("spaghetti").diversityGroupSlug === "wheat");
  resolvesTo("wholewheat spaghetti", "wholewheat-pasta");
}

// ── 6. GOV2 — a hierarchy is never an alias ──────────────────────────────────
console.log("\nGOV2 — every child resolves to itself, and every chain terminates");
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

  let unrooted = 0;
  for (const food of CANONICAL_FOOD_SEED) {
    let cur: string | null | undefined = food.family;
    let hops = 0;
    while (cur && hops++ < 16) cur = bySlug.get(cur)?.family ?? null;
    if (hops >= 16) unrooted++;
  }
  check("every family chain terminates at a top-level identity", unrooted === 0);

  // coconut-water → plant-water → beverage. Three levels, exactly like stilton.
  check("coconut-water → plant-water → beverage (three levels)",
    bySlug.get("coconut-water")?.family === "plant-water" && bySlug.get("plant-water")?.family === "beverage");
}

console.log(`\n${failed === 0 ? "✅" : "❌"} NK6S — ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
