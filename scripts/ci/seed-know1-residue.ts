/**
 * TRUST1-S10 — TEST FIXTURE: the KNOW1 `plant-protein` residue
 * ============================================================
 * READ THIS BEFORE ASSUMING IT IS A MISTAKE. This script deliberately inserts rows that are,
 * in product terms, WRONG — the residue of a historical bad import. It exists because two
 * suites in `npm test` REQUIRE that residue to be present, and neither can pass without it:
 *
 *   test:know5-evidence-contract      "fixture: the retired `plant-protein` nutrient still has
 *                                      active composition rows"      <- its own word: fixture
 *                                     "reconcile deactivates exactly the 38 orphaned rows"
 *   test:knowledge-food-ownership     "plant-protein residue is exactly the 38 rows KNOW1 recorded"
 *
 * KNOW5's `reconcile` exists to DEACTIVATE orphaned knowledge rows. To prove that it does, the
 * test needs orphaned rows to deactivate — a cleanup test needs dirt to clean. On the long-lived
 * development database the dirt is supplied by accident of history, so nobody ever noticed the
 * dependency. On a fresh database there is none, the fixture assertion fails, and both suites go
 * red for a reason that has nothing to do with the change under review.
 *
 * WHAT THIS IS NOT. It is not fabricating data to make a gate green. Not one assertion in either
 * suite was weakened, and no product code was touched: the rows below are reproduced EXACTLY as
 * they exist today (verified by querying the development database), so the tests assert against
 * the same state they always have. What changed is that the state is now DECLARED instead of
 * inherited.
 *
 * THIS SHOULD NOT EXIST FOREVER. Two suites in this repository are coupled to the residue of a
 * defect, which means they will fail the day someone finally runs `seed:knowledge --reconcile`
 * against a real database and cleans it up — the tests assert that a bug is still there. That is
 * the KNOWLEDGE workstream's to fix (KNOW1/KNOW5), not TRUST1-S10's, and TRUST1-S10 deliberately
 * does not touch their assertions. It is recorded in the S10 implementation report as a finding.
 */

import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("[ci:fixture] DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** The 38 orphaned composition rows: [food_slug, ranking, source]. Verified against the dev DB. */
const RESIDUE: ReadonlyArray<readonly [string, number, string]> = [
  ["almond-butter", 2, "THA editorial"],
  ["almond-flour", 2, "THA editorial"],
  ["almonds", 2, "THA editorial"],
  ["amaranth", 0, "THA editorial"],
  ["beluga-lentils", 0, "THA editorial"],
  ["black-beans", 1, "THA editorial"],
  ["black-eyed-peas", 1, "THA editorial"],
  ["borlotti-beans", 1, "THA editorial"],
  ["broad-beans", 0, "THA editorial"],
  ["butter-beans", 1, "THA editorial"],
  ["cannellini-beans", 1, "THA editorial"],
  ["chia-seeds", 3, "THA editorial"],
  ["chickpea-flour", 0, "THA editorial"],
  ["chickpeas", 1, "THA editorial"],
  ["edamame", 0, "THA editorial"],
  ["flaxseed", 2, "THA editorial"],
  ["garden-peas", 1, "THA editorial"],
  ["green-lentils", 0, "THA editorial"],
  ["haricot-beans", 1, "THA editorial"],
  ["hemp-seeds", 0, "THA editorial"],
  ["kefir", 2, "THA editorial"],
  ["kidney-beans", 1, "THA editorial"],
  ["lentils", 0, "NK6 canonical food draft"],
  ["miso", 1, "THA editorial"],
  ["natto", 1, "THA editorial"],
  ["oats", 1, "NK6 canonical food draft"],
  ["peanuts", 0, "THA editorial"],
  ["pinto-beans", 1, "THA editorial"],
  ["pistachios", 3, "THA editorial"],
  ["pumpkin-seeds", 2, "THA editorial"],
  ["puy-lentils", 0, "THA editorial"],
  ["quinoa", 0, "THA editorial"],
  ["red-lentils", 0, "THA editorial"],
  ["soy-milk", 0, "THA editorial"],
  ["tahini", 3, "THA editorial"],
  ["tempeh", 0, "THA editorial"],
  ["tofu", 0, "THA editorial"],
  ["walnuts", 2, "THA editorial"],
];

/** The 2 orphaned nutrient -> benefit rows: [benefit_slug, ranking]. */
const BENEFITS: ReadonlyArray<readonly [string, number]> = [
  ["muscle-recovery", 0],
  ["energy-support", 1],
];

async function main(): Promise<void> {
  // 1. The retired vocabulary row. Still ACTIVE — that is precisely what makes it residue.
  await pool.query(
    `INSERT INTO knowledge_nutrients (slug, name, description, category, source, display_order, is_active)
     VALUES ('plant-protein', 'Plant Protein',
             'Protein from plants such as beans, lentils, nuts and seeds. Used to build and repair the body.',
             'macronutrient', 'THA editorial', 2, true)
     ON CONFLICT (slug) DO NOTHING`,
  );

  // 2. The 38 composition rows the seed cannot reproduce.
  //    Only for foods that actually exist — the FK is on knowledge_foods(slug).
  let inserted = 0;
  for (const [foodSlug, ranking, source] of RESIDUE) {
    const res = await pool.query(
      `INSERT INTO knowledge_food_nutrients (food_slug, nutrient_slug, confidence, ranking, source, is_active)
       SELECT $1, 'plant-protein', 'established', $2, $3, true
       WHERE EXISTS (SELECT 1 FROM knowledge_foods WHERE slug = $1)
         AND NOT EXISTS (
           SELECT 1 FROM knowledge_food_nutrients
           WHERE food_slug = $1 AND nutrient_slug = 'plant-protein')`,
      [foodSlug, ranking, source],
    );
    inserted += res.rowCount ?? 0;
  }

  // 3. The 2 orphaned nutrient -> benefit rows.
  for (const [benefitSlug, ranking] of BENEFITS) {
    await pool.query(
      `INSERT INTO knowledge_nutrient_benefits
         (nutrient_slug, benefit_slug, evidence_strength, ranking, source, is_active)
       SELECT 'plant-protein', $1, 'good', $2, 'THA editorial', true
       WHERE EXISTS (SELECT 1 FROM knowledge_health_benefits WHERE slug = $1)
         AND NOT EXISTS (
           SELECT 1 FROM knowledge_nutrient_benefits
           WHERE nutrient_slug = 'plant-protein' AND benefit_slug = $1)`,
      [benefitSlug, ranking],
    );
  }

  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM knowledge_food_nutrients   WHERE nutrient_slug = 'plant-protein') AS comp,
       (SELECT count(*)::int FROM knowledge_nutrient_benefits WHERE nutrient_slug = 'plant-protein') AS ben`,
  );
  const { comp, ben } = rows[0];
  console.log(`[ci:fixture] KNOW1 residue: ${comp} composition rows (+${inserted} new), ${ben} nutrient-benefit rows`);

  // The two suites assert 38 and 2 exactly. If the fixture cannot produce them, say so LOUDLY
  // here rather than let it surface as a mystifying knowledge-integrity failure 40 suites later.
  if (comp !== 38 || ben !== 2) {
    console.error(
      `\n[ci:fixture] FAILED — expected exactly 38 composition rows and 2 benefit rows, got ${comp} and ${ben}.\n` +
        `             test:know5-evidence-contract and test:knowledge-food-ownership assert these\n` +
        `             counts exactly and will fail. The likeliest cause is that the knowledge seed\n` +
        `             did not run first, so the foods these rows point at do not exist.\n`,
    );
    await pool.end();
    process.exit(1);
  }

  await pool.end();
}

main().catch(async err => {
  console.error("[ci:fixture] FAILED —", err);
  await pool.end().catch(() => {});
  process.exit(1);
});
