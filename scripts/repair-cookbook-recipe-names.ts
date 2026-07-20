/**
 * COOKBOOK1 — Cookbook recipe-name repair
 * =======================================
 * Reports, and optionally repairs, the two naming defects the founding cookbook
 * import (`COOKBOOK3`) left in the `meals` table.
 *
 *   1. CUISINE CAPITALISATION — repairable, and repaired by `--apply`.
 *      The generator lower-cased the cuisine token mid-title, producing
 *      "Australian cafe-Style ..." and "French country-Style ...". It also left
 *      the style suffix capitalised throughout ("Pakistani-Style"), which is not
 *      how the construction is written in English. Both normalise to
 *      "Australian Cafe-style", "Pakistani-style".
 *
 *      This changes no recipe's identity — only its spelling — so it is safe to
 *      apply without an owner decision.
 *
 *   2. COLLISION INTEGERS — reported, NEVER repaired.
 *      Names ending in an integer, running as high as 9, because the generator
 *      collided with itself and appended a counter. EXPREVIEW1 § 6 found one of
 *      them ("... Rice Bowl 2") and correctly called it the moment the illusion
 *      inverts.
 *
 *      This script will not strip them, and that refusal is the point. Stripping
 *      " 2".." 9" does not produce eight well-named recipes; it produces eight
 *      recipes with identical names, because the recipes themselves are near
 *      identical — the integer is a symptom of the collision, not the cause.
 *      The honest repairs are the owner's to choose (§ 8 of the implementation
 *      report): delete the cohort, or have someone author replacements.
 *      A script that quietly renamed them would be hiding the finding.
 *
 * USAGE
 *   npx tsx scripts/repair-cookbook-recipe-names.ts            # report only
 *   npx tsx scripts/repair-cookbook-recipe-names.ts --apply    # apply (1) only
 *
 * The report runs against whatever `DATABASE_URL` points at. `--apply` is
 * idempotent: running it twice changes nothing the second time.
 */

import { db } from "../server/db";
import { meals } from "../shared/schema";
import { eq } from "drizzle-orm";
import {
  isGeneratedLibraryName,
  hasCollisionSuffix,
  repairCuisineCapitalisation,
  shelfForMeal,
} from "../shared/cookbook/curation";

async function main() {
  const apply = process.argv.includes("--apply");

  const rows = await db
    .select({
      id: meals.id,
      name: meals.name,
      isDrink: meals.isDrink,
      mealFormat: meals.mealFormat,
      isReadyMeal: meals.isReadyMeal,
      mealSourceType: meals.mealSourceType,
      isSystemMeal: meals.isSystemMeal,
      sourceUrl: meals.sourceUrl,
    })
    .from(meals);
  // NOT filtered to `isSystemMeal`. The founding import's output did not stay in
  // the system library: `meal-service.ts` copies starter meals into each
  // household's own cookbook at onboarding (`mealSourceType: "starter"`,
  // `isSystemMeal: false`), so template-generated names sit on the household's
  // OWN shelf, where they read as recipes the family chose. Repairing only the
  // system rows would leave the defect exactly where it does the most damage.
  // Re-shelving those copies is an owner decision — see report § 8.

  // Shelving is `shelfForMeal`'s decision, not this script's. A system meal is
  // not necessarily a recipe: the 884 system rows include several hundred drinks
  // and packaged products (7UP, Actimel, baby food), which shelve as `drinks`
  // and `packaged` long before the authored/generated question is asked.
  const shelves = new Map(rows.map(r => [r.id, shelfForMeal(r)]));
  const authored = rows.filter(r => shelves.get(r.id) === "kitchen");
  const generated = rows.filter(r => shelves.get(r.id) === "library");
  const otherShelves = rows.filter(r => {
    const s = shelves.get(r.id);
    return s !== "kitchen" && s !== "library";
  });
  /** Generated recipes copied into a household's own cookbook at onboarding. */
  const starterCopies = rows.filter(
    r => !r.isSystemMeal && r.mealSourceType === "starter" && isGeneratedLibraryName(r.name),
  );
  const collisions = rows.filter(r => hasCollisionSuffix(r.name));
  const needsCaps = rows.filter(r => repairCuisineCapitalisation(r.name) !== r.name);

  console.log("── COOKBOOK1 · recipe-name report ──────────────────────────────");
  console.log(`meals scanned           : ${rows.length}`);
  console.log(`  shelved as "kitchen"  : ${authored.length}  (authored — the founding cookbook)`);
  console.log(`  shelved as "library"  : ${generated.length}  (template-generated variations)`);
  console.log(`  drinks / packaged     : ${otherShelves.length}  (not recipes; shelved elsewhere)`);
  console.log(`generated starter copies: ${starterCopies.length}  (in households' OWN cookbooks — owner decision, § 8)`);
  console.log(`collision integers      : ${collisions.length}  (reported, never repaired)`);
  console.log(`capitalisation defects  : ${needsCaps.length}  ${apply ? "(repairing)" : "(run with --apply to repair)"}`);
  console.log("");

  if (authored.length) {
    console.log("The authored shelf, in full:");
    for (const r of [...authored].sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  · ${r.name}`);
    }
    console.log("");
  }

  if (collisions.length) {
    console.log(`Collision integers (first 10 of ${collisions.length}) — OWNER DECISION, see report § 8:`);
    for (const r of collisions.slice(0, 10)) console.log(`  · ${r.name}`);
    console.log("");
  }

  if (!apply) {
    console.log("Report only. Nothing was written. Re-run with --apply to repair capitalisation.");
    await done();
    return;
  }

  let repaired = 0;
  for (const r of needsCaps) {
    const next = repairCuisineCapitalisation(r.name);
    await db.update(meals).set({ name: next }).where(eq(meals.id, r.id));
    if (repaired < 5) console.log(`  ${r.name}\n→ ${next}`);
    repaired++;
  }
  console.log(`\nRepaired ${repaired} name(s). Collision integers were left untouched, by design.`);
  await done();
}

async function done() {
  // Let the pool drain rather than hanging the process.
  await new Promise(r => setTimeout(r, 100));
  process.exit(0);
}

main().catch(err => {
  console.error("[COOKBOOK1] name repair failed:", err);
  process.exit(1);
});
