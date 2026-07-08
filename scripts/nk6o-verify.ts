#!/usr/bin/env tsx
/**
 * NK6O — final verification. Read-only DB checks + a non-mutating proof that the
 * hardened, row-resilient binding isolates a missing FK target instead of
 * dropping the whole set.
 */
import { pool } from "../server/db";
import { bindFoodNutrients } from "../server/lib/canonical-foods-importer";

const LEGUMES = [
  "adzuki-beans","brown-lentils","chana-dal","flageolet-beans","green-split-peas",
  "lupin-beans","marrowfat-peas","mixed-beans","mung-beans","toor-dal","yellow-split-peas",
];

async function main() {
  console.log("NK6O VERIFICATION\n=================\n");

  // 1. Canonical vocabulary present
  const vocab = await pool.query(
    `select slug, family from knowledge_nutrients
     where slug in ('protein','carotenoids','beta-carotene','lycopene','lutein','zeaxanthin')
     order by slug`);
  console.log("1) Vocabulary (protein + carotenoid family):");
  console.table(vocab.rows);
  const total = await pool.query(`select count(*)::int n from knowledge_nutrients`);
  console.log(`   knowledge_nutrients total: ${total.rows[0].n}\n`);

  // 2. Per-legume nutrient bindings, incl. explicit protein check
  const binds = await pool.query(
    `select f.food_slug,
            count(*)::int n,
            bool_or(f.nutrient_slug = 'protein') as has_protein,
            string_agg(f.nutrient_slug, ', ' order by f.ranking) as nutrients
       from knowledge_food_nutrients f
      where f.food_slug = any($1)
      group by f.food_slug order by f.food_slug`, [LEGUMES]);
  console.log("2) Legume nutrient bindings (protein must be true, n>0):");
  console.table(binds.rows);
  const zero = LEGUMES.filter((l) => !binds.rows.find((r) => r.food_slug === l));
  const noProtein = binds.rows.filter((r) => !r.has_protein).map((r) => r.food_slug);
  console.log(`   legumes with ZERO nutrients: ${zero.length ? zero.join(", ") : "none"}`);
  console.log(`   legumes MISSING protein: ${noProtein.length ? noProtein.join(", ") : "none"}\n`);

  // 3. No duplicate legume identities
  const ident = await pool.query(
    `select slug, count(*)::int n from knowledge_foods where slug = any($1) group by slug having count(*) > 1`, [LEGUMES]);
  console.log(`3) Duplicate legume identities: ${ident.rows.length ? JSON.stringify(ident.rows) : "none"}\n`);

  // 4. HARDENING PROOF — bind one REAL (already-present) + one BOGUS nutrient on a
  //    legume. Per-row isolation must bind/skip the real one and drop ONLY the
  //    bogus one, reporting a drop. Mutates nothing (real already exists; bogus FK-fails).
  const proof = await bindFoodNutrients(
    "adzuki-beans",
    ["protein", "__nk6o_nonexistent_nutrient__"],
    new Map([["protein", "established"]]),
  );
  console.log("4) Hardening proof — bind [protein (real), __bogus__] on adzuki-beans:");
  console.log(`   inserted=${proof.inserted} alreadyPresent=${proof.alreadyPresent} dropped=[${proof.dropped.join(", ")}]`);
  const isolated = proof.dropped.length === 1 && proof.dropped[0] === "__nk6o_nonexistent_nutrient__" && proof.alreadyPresent >= 1;
  console.log(`   ⇒ per-row isolation ${isolated ? "CONFIRMED — real survives, bogus dropped alone" : "FAILED"}\n`);

  await pool.end();

  const ok = zero.length === 0 && noProtein.length === 0 && ident.rows.length === 0 && isolated;
  console.log(ok ? "ALL CHECKS PASSED ✅" : "CHECKS FAILED ❌");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
