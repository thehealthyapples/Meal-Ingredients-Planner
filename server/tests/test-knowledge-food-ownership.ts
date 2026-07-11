/**
 * KNOW2 — canonical food knowledge ownership verification.
 *
 * `knowledge_foods` had two writers: the declared owner
 * (`shared/knowledge/foods.ts` → `server/seeds/seed-knowledge-registry.ts`, SoT
 * Register Domain 1) and the NK6D canonical foods importer, which inserted
 * identities straight into the published store. 346 of 610 live foods arrived
 * that way — invisible to the declared source of truth, stamped with the
 * `source` column's "THA editorial" default despite being AI-authored drafts.
 *
 * Rule KC8 — declared is not enforced. A one-owner rule that lives only in a
 * document is a hope. These checks are the enforcement.
 *
 * Two layers:
 *   1. Static checks over the seed and the source tree — always run.
 *   2. Live checks against the seeded DB — only when DATABASE_URL is set.
 *
 * Run with:  npm run test:knowledge-food-ownership
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import {
  FOOD_SEED,
  EDITORIAL_FOOD_SEED,
  GRADUATED_FOOD_SEED,
  GRADUATED_FOOD_SOURCE,
  GRADUATED_FOOD_NUTRIENTS,
  GRADUATED_FOOD_BENEFITS,
  FOOD_NUTRIENT_SEED,
  FOOD_BENEFIT_SEED,
  validateKnowledgeSeed,
} from "../../shared/knowledge/index.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

/** Every .ts file under a directory, recursively. */
function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") out.push(...sourceFiles(p)); }
    else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/**
 * The seed runner is the ONE writer of knowledge FACTS. Anything else that
 * inserts or updates a knowledge_* table is a second owner, whatever it calls
 * itself.
 *
 * KNOW5 adds one further permitted writer, and the boundary between them is a
 * column split, not a table split:
 *
 *   seed-knowledge-registry.ts   owns the FACTS   (identity, links, citations,
 *                                                  is_active) and is forbidden
 *                                                  from writing a sign-off.
 *   signoff-knowledge-claims.ts  owns the REVIEW  (reviewed_at, reviewed_by) and
 *                                                  writes nothing else.
 *
 * That split already governed knowledge_nutrient_benefits before KNOW5 (the
 * sign-off gate has always been the only thing that sets reviewed_at). KNOW5
 * extends the composition edge into the same regime, so the gate now touches
 * knowledgeFoodNutrients too. Rule KC9 requires exactly this: automation authors
 * candidates and a human publishes them, which means the publishing write cannot
 * live in the seed.
 *
 * We scan for Drizzle writes (`.insert(x)` / `.update(x)`) whose target names a
 * knowledge food table. Comments and type-only mentions are ignored — only the
 * call itself counts.
 */
const OWNER = "server/seeds/seed-knowledge-registry.ts";
const SIGNOFF_GATE = "server/seeds/signoff-knowledge-claims.ts";
const KNOWLEDGE_FOOD_TABLES = ["knowledgeFoods", "knowledgeFoodNutrients", "knowledgeFoodBenefits"];
const WRITE_CALL = new RegExp(`\\.(insert|update)\\s*\\(\\s*(?:schema\\.)?(${KNOWLEDGE_FOOD_TABLES.join("|")})\\b`);

/** Source with block and line comments stripped, so prose is never a writer. */
function codeOf(file: string): string {
  return readFileSync(file, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/**
 * The test suite is excluded from the RUNTIME writer scan. This check exists to
 * find a second owner in code that ships; a test is not an owner, it is a driver
 * of one. test-know5-evidence-contract.ts deliberately writes these tables — it
 * imports the seed runner's own reconciliation helpers and exercises them inside
 * a transaction it then rolls back, which is the only way to prove that
 * "publishing is reversible" is more than a comment. Excluding the directory
 * keeps that proof possible without licensing a second owner anywhere real.
 */
const NOT_RUNTIME = "server/tests";

function writersOfKnowledgeFoods(): string[] {
  const writers: string[] = [];
  for (const file of [...sourceFiles("server"), ...sourceFiles("shared"), ...sourceFiles("scripts")]) {
    const path = file.replace(/\\/g, "/");
    if (path.startsWith(NOT_RUNTIME + "/")) continue;
    if (WRITE_CALL.test(codeOf(file))) writers.push(path);
  }
  return writers.sort();
}

/** The columns a `.set({ … })` call assigns, across a whole file. */
function assignedColumns(file: string): Set<string> {
  const cols = new Set<string>();
  for (const m of Array.from(codeOf(file).matchAll(/\.set\s*\(\s*\{([^}]*)\}/g))) {
    for (const c of Array.from(m[1].matchAll(/(\w+)\s*:/g))) cols.add(c[1]);
  }
  return cols;
}

async function run() {
  console.log("── One writer (static) ──");

  const writers = writersOfKnowledgeFoods();
  check(
    "exactly two modules write the knowledge food tables: the seed runner and the sign-off gate",
    writers.length === 2 && writers[0] === OWNER && writers[1] === SIGNOFF_GATE,
    `found: ${writers.join(", ") || "(none)"}`,
  );
  check("the fact writer is the declared seed runner (SoT Register Domain 1)", writers.includes(OWNER));

  // KNOW5 — the column split that keeps "two writers" from meaning "two owners".
  const seedCols = assignedColumns(OWNER);
  const gateCols = assignedColumns(SIGNOFF_GATE);
  check(
    "the seed never writes a sign-off (Rule KC9: automation authors, never publishes)",
    !seedCols.has("reviewedAt") && !seedCols.has("reviewedBy"),
    `seed assigns: ${Array.from(seedCols).join(", ")}`,
  );
  check(
    "the sign-off gate writes ONLY the review columns — never a fact",
    Array.from(gateCols).every((c) => c === "reviewedAt" || c === "reviewedBy"),
    `gate assigns: ${Array.from(gateCols).join(", ")}`,
  );
  check("the sign-off gate does set reviewedBy (no anonymous sign-off)", gateCols.has("reviewedBy"));
  check(
    "the seed owns is_active, so retirement is reversible and belongs to the fact owner",
    seedCols.has("isActive"),
  );

  const gate = "server/lib/canonical-foods-gate.ts";
  check("the retired importer no longer exists", !existsSync("server/lib/canonical-foods-importer.ts"));
  check("the gate exists in its place", existsSync(gate));
  if (existsSync(gate)) {
    const src = readFileSync(gate, "utf-8");
    check("the gate imports no database handle", !/^\s*import\s.*from\s+["']\.\.\/db["']/m.test(src));
    check("the gate exports no bind/write helper",
      !/export\s+(async\s+)?function\s+(bindFood|importCanonicalFood)/.test(src));
  }
  check("the retired import CLI is gone", !existsSync("server/cli/import-canonical-foods.ts"));
  check("the graduation CLI replaces it", existsSync("server/cli/graduate-canonical-foods.ts"));

  console.log("\n── One owner, honest provenance (static) ──");

  const problems = validateKnowledgeSeed();
  check("composed seed passes referential integrity", problems.length === 0, problems.slice(0, 3).join("; "));

  check("FOOD_SEED is exactly editorial + graduated",
    FOOD_SEED.length === EDITORIAL_FOOD_SEED.length + GRADUATED_FOOD_SEED.length,
    `${FOOD_SEED.length} vs ${EDITORIAL_FOOD_SEED.length}+${GRADUATED_FOOD_SEED.length}`);

  const editorialSlugs = new Set(EDITORIAL_FOOD_SEED.map((f) => f.slug));
  const collisions = GRADUATED_FOOD_SEED.filter((f) => editorialSlugs.has(f.slug)).map((f) => f.slug);
  check("no graduated identity collides with an editorial one", collisions.length === 0, collisions.join(", "));

  check("every graduated food declares draft provenance",
    GRADUATED_FOOD_SEED.every((f: any) => f.source === GRADUATED_FOOD_SOURCE));
  check("no graduated food wears the 'THA editorial' stamp",
    GRADUATED_FOOD_SEED.every((f: any) => f.source !== "THA editorial"));
  check("no graduated food carries a machine enum as a description",
    GRADUATED_FOOD_SEED.every((f: any) => f.description == null));

  const gradSlugs = new Set(GRADUATED_FOOD_SEED.map((f) => f.slug));
  check("every graduated relationship row is stamped as draft-sourced",
    [...GRADUATED_FOOD_NUTRIENTS, ...GRADUATED_FOOD_BENEFITS].every((r: any) => r.source === GRADUATED_FOOD_SOURCE));

  // The importer reached a handful of EDITORIAL identities with --force-upsert,
  // so some graduated links legitimately hang off editorial foods: 11 rows in the
  // DB (6 nutrient, 5 benefit) across blueberries, broccoli, greek-yoghurt, oats,
  // spinach, eggs and salmon. Ten graduate; `oats/plant-protein` is withheld as
  // retired vocabulary. A silent change to this set means a new writer appeared.
  const onEditorial = [...GRADUATED_FOOD_NUTRIENTS, ...GRADUATED_FOOD_BENEFITS]
    .filter((r: any) => !gradSlugs.has(r.foodSlug)).map((r: any) => r.foodSlug);
  check("graduated links on editorial foods are the 10 KNOW2 recorded",
    onEditorial.length === 10, `got ${onEditorial.length}: ${Array.from(new Set(onEditorial)).join(", ")}`);

  console.log("\n── Retired vocabulary stays retired (static) ──");

  // `plant-protein` was removed from NUTRIENT_SEED (NK6M) but survives in the DB
  // as 38 dangling rows. It must never be resurrected by graduation.
  check("no graduated link references retired `plant-protein` vocabulary",
    ![...GRADUATED_FOOD_NUTRIENTS].some((r: any) => r.nutrientSlug === "plant-protein"));

  if (!process.env.DATABASE_URL) {
    console.log("\n(DATABASE_URL not set — skipping live ownership checks)");
  } else {
    console.log("\n── The seed is the whole truth (live DB) ──");
    const { pool } = await import("../db.js");
    const q = async (text: string) => (await pool.query(text)).rows as any[];

    const liveFoods = await q("select slug, source from knowledge_foods");
    const liveSlugs = new Set(liveFoods.map((r) => r.slug));
    const seedSlugs = new Set(FOOD_SEED.map((f) => f.slug));

    const unseeded = Array.from(liveSlugs).filter((s) => !seedSlugs.has(s));
    check("every live knowledge_food is described by the seed", unseeded.length === 0,
      `${unseeded.length} orphan(s): ${unseeded.slice(0, 5).join(", ")}`);
    check("seed and live table agree on row count", liveFoods.length === FOOD_SEED.length,
      `live=${liveFoods.length} seed=${FOOD_SEED.length}`);

    const misstamped = liveFoods.filter((r) => gradSlugs.has(r.slug) && r.source !== GRADUATED_FOOD_SOURCE);
    check("no live graduated row still claims 'THA editorial'", misstamped.length === 0,
      `${misstamped.length} row(s), e.g. ${misstamped.slice(0, 3).map((r) => r.slug).join(", ")}`);

    const liveDesc = await q(
      `select count(*)::int c from knowledge_foods where description = 'whole_or_minimally_processed'`);
    check("no live row serves the classification enum as a description", liveDesc[0].c === 0, `${liveDesc[0].c} row(s)`);

    // Relationship rows the seed cannot reproduce. KNOW2 leaves the 38
    // `plant-protein` rows alone (KNOW1's documented residue) and nothing else.
    const fnPairs = new Set(FOOD_NUTRIENT_SEED.map((r) => `${r.foodSlug}|${r.nutrientSlug}`));
    const liveFn = await q("select food_slug, nutrient_slug from knowledge_food_nutrients");
    const orphanFn = liveFn.filter((r) => !fnPairs.has(`${r.food_slug}|${r.nutrient_slug}`));
    check("the only unreproducible nutrient links are the retired plant-protein residue",
      orphanFn.every((r) => r.nutrient_slug === "plant-protein"),
      `${orphanFn.filter((r) => r.nutrient_slug !== "plant-protein").length} unexpected`);
    check("plant-protein residue is exactly the 38 rows KNOW1 recorded",
      orphanFn.length === 38, `got ${orphanFn.length}`);

    const fbPairs = new Set(FOOD_BENEFIT_SEED.map((r) => `${r.foodSlug}|${r.benefitSlug}`));
    const liveFb = await q("select food_slug, benefit_slug from knowledge_food_benefits");
    const orphanFb = liveFb.filter((r) => !fbPairs.has(`${r.food_slug}|${r.benefit_slug}`));
    check("every live benefit link is reproducible from the seed", orphanFb.length === 0, `${orphanFb.length} orphan(s)`);

    await pool.end();
  }

  console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => { console.error(err); process.exit(1); });
