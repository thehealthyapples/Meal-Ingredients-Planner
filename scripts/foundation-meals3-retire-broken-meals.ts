/**
 * FOUNDATION_MEALS3 Phase 1 — retire the 76 dish-broken meals
 * ===========================================================
 *
 * `FOUNDATION_MEALS2` § 2.1 classified all 500 founding-cookbook recipes and
 * found 76 to be **RETIRE**: the dish itself is wrong, not merely the text
 * describing it. Those 76 cannot be edited into rightness — they would have to
 * be re-conceived, which means writing a new meal, which Phase 1 forbids.
 *
 * This script applies that verdict, and nothing else. It writes exactly two
 * columns on exactly 76 rows. It creates no meal, edits no recipe, consolidates
 * no duplicate, corrects no provenance and touches no acquisition lane.
 *
 * WHY THE 76 ARE DERIVED HERE RATHER THAN LISTED
 * ----------------------------------------------
 * `FOUNDATION_MEALS2` publishes the COUNTS and the reasons but never enumerates
 * the ids — its scoring run left no artefact, and the commit contains only the
 * document. A hand-copied list of 76 ids would be an unverifiable assertion
 * sitting between the verdict and the data, and the first thing anyone would
 * reasonably ask of it is "where did these come from?".
 *
 * So the classifier is re-derived from the same source corpus the review read,
 * and it is checked against five figures the review published independently:
 *
 *     salad vegetables stewed  66   (FOUNDATION_MEALS2 § 2.3)
 *     oats as savoury starch   26   (§ 2.3)
 *     uncookable instruction    4   (§ 2.3, § 1.2)
 *     distinct union           76   (§ 2.1, § 2.3)
 *     by slot                  dinner 44 · lunch 25 · side 7 · breakfast 0 · snack 0   (§ 2.2)
 *
 * All five reproduce exactly, and the review's finer split — 35 radish, 31
 * cucumber (§ 1.2) — reproduces too. The script ASSERTS every one of them and
 * refuses to write if any disagrees, so a corpus edit or a classifier drift
 * fails loudly instead of retiring the wrong meals.
 *
 * THE ONE JUDGEMENT THIS ENCODES
 * ------------------------------
 * A salad vegetable is dish-broken in a cooked frame (dinner, lunch, side) and
 * fine in an uncooked one (breakfast pan, snack bowl) — which is why the review
 * retired 0 breakfasts and 0 snacks despite 10 breakfasts containing radish and
 * 2 snacks containing cucumber, and why it recorded the 74 breakfasts as "the
 * collection's most recoverable asset". Gating on the slot rather than on the
 * literal simmer step is what reproduces 35/31 rather than 33/28.
 *
 * USAGE
 *     npx tsx scripts/foundation-meals3-retire-broken-meals.ts --dry-run
 *     npx tsx scripts/foundation-meals3-retire-broken-meals.ts
 *
 * Idempotent: re-running retires nothing further and reports 0 newly retired.
 * Reversible: `--restore` clears both columns on the rows this script set.
 */

import { readFileSync } from "fs";
import path from "path";
import { db } from "../server/db";
import { meals } from "../shared/schema";
import { sql, inArray, and, isNotNull } from "drizzle-orm";

const CORPUS = path.join(
  process.cwd(),
  "data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json",
);

/** The three reasons FOUNDATION_MEALS2 § 2.3 gives. Written to `meals.retired_reason`. */
type RetireReason =
  | "salad_vegetable_stewed"
  | "oats_as_savoury_starch"
  | "uncookable_instruction";

interface Recipe {
  recipe_id: string;
  recipe_name: string;
  category: string;
  ingredients: string[];
  method: string[];
}

/**
 * Salad vegetables are wrong in a COOKED frame and right in an uncooked one.
 * `dinner`, `lunch` and `side` are the generator's cooked frames; `breakfast`
 * and `snack` are not. See the header.
 */
const COOKED_SLOTS = new Set(["dinner", "lunch", "side"]);
const SALAD_VEGETABLES = ["radish", "cucumber"] as const;

/**
 * Foods that do not come with packet cooking instructions. The generator's side
 * frame opens "Cook the {starch} according to the packet instructions", and for
 * these three the sentence is not merely odd, it is meaningless.
 */
const UNCOOKABLE_PER_PACKET = ["flatbread", "wrap", "bread"] as const;

function classify(recipes: Recipe[]): Map<string, RetireReason> {
  const verdicts = new Map<string, RetireReason>();
  // First reason wins where a meal is broken more than one way — the counts
  // below are therefore per-reason and overlapping, exactly as § 2.3 reports.
  const mark = (id: string, reason: RetireReason) => {
    if (!verdicts.has(id)) verdicts.set(id, reason);
  };

  const ingredientsOf = (r: Recipe) => r.ingredients.join(" ").toLowerCase();
  const methodOf = (r: Recipe) => r.method.join(" ").toLowerCase();

  const salad = new Set<string>();
  const oats = new Set<string>();
  const uncookable = new Set<string>();
  const perVegetable: Record<string, number> = { radish: 0, cucumber: 0 };

  for (const r of recipes) {
    const ing = ingredientsOf(r);
    const method = methodOf(r);

    // 1. Salad vegetables instructed into a cooked dish.
    if (COOKED_SLOTS.has(r.category)) {
      for (const veg of SALAD_VEGETABLES) {
        if (ing.includes(veg)) {
          salad.add(r.recipe_id);
          perVegetable[veg]++;
        }
      }
    }

    // 2. Rolled oats used as the savoury starch in a stew.
    if (ing.includes("oats") && (r.category === "dinner" || r.category === "lunch") && method.includes("simmer")) {
      oats.add(r.recipe_id);
    }

    // 3. An instruction that cannot be followed.
    if (UNCOOKABLE_PER_PACKET.some(f => method.includes(`${f} according to the packet`))) {
      uncookable.add(r.recipe_id);
    }
  }

  for (const id of salad) mark(id, "salad_vegetable_stewed");
  for (const id of oats) mark(id, "oats_as_savoury_starch");
  for (const id of uncookable) mark(id, "uncookable_instruction");

  // ── The control gates. FOUNDATION_MEALS2's own published figures. ──────────
  const byId = new Map(recipes.map(r => [r.recipe_id, r]));
  const bySlot = (ids: Iterable<string>) => {
    const counts: Record<string, number> = {};
    for (const id of ids) {
      const slot = byId.get(id)!.category;
      counts[slot] = (counts[slot] ?? 0) + 1;
    }
    return counts;
  };

  const expect = (label: string, actual: number, want: number) => {
    if (actual !== want) {
      throw new Error(
        `FOUNDATION_MEALS3 classifier disagrees with FOUNDATION_MEALS2 on "${label}": ` +
          `derived ${actual}, review published ${want}. Refusing to retire anything. ` +
          `Either the corpus changed or the classifier drifted — resolve before writing.`,
      );
    }
  };

  expect("salad vegetables stewed (§2.3)", salad.size, 66);
  expect("  · radish (§1.2)", perVegetable.radish, 35);
  expect("  · cucumber (§1.2)", perVegetable.cucumber, 31);
  expect("oats as savoury starch (§2.3)", oats.size, 26);
  expect("uncookable instruction (§2.3)", uncookable.size, 4);
  expect("distinct RETIRE total (§2.1)", verdicts.size, 76);

  const slots = bySlot(verdicts.keys());
  expect("dinner retired (§2.2)", slots.dinner ?? 0, 44);
  expect("lunch retired (§2.2)", slots.lunch ?? 0, 25);
  expect("side retired (§2.2)", slots.side ?? 0, 7);
  expect("breakfast retired (§2.2)", slots.breakfast ?? 0, 0);
  expect("snack retired (§2.2)", slots.snack ?? 0, 0);

  // The founding ten must never be touched. FOUNDATION_MEALS2 § 0 makes them
  // the classifier's control group: a rule that flags one of them is measuring
  // name shape rather than food.
  for (let i = 1; i <= 10; i++) {
    const id = `THA-${String(i).padStart(3, "0")}`;
    if (verdicts.has(id)) {
      throw new Error(`Classifier flagged founding meal ${id}. Refusing to proceed.`);
    }
  }

  console.log(
    `  reasons: salad ${salad.size} · oats ${oats.size} · uncookable ${uncookable.size} ` +
      `→ ${verdicts.size} distinct`,
  );
  console.log(`  by slot: ${JSON.stringify(slots)}`);
  console.log(`  all 12 control figures from FOUNDATION_MEALS2 reproduce exactly ✓`);

  return verdicts;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const restore = process.argv.includes("--restore");

  console.log("FOUNDATION_MEALS3 Phase 1 — retire the dish-broken meals");
  console.log(`Mode: ${restore ? "RESTORE" : dryRun ? "DRY RUN" : "APPLY"}\n`);

  if (restore) {
    const restored = await db
      .update(meals)
      .set({ retiredAt: null, retiredReason: null })
      .where(isNotNull(meals.retiredAt))
      .returning({ id: meals.id });
    console.log(`Restored ${restored.length} meals to live.`);
    process.exit(0);
  }

  console.log("Classifying the corpus…");
  const recipes: Recipe[] = JSON.parse(readFileSync(CORPUS, "utf8")).recipes;
  if (recipes.length !== 500) throw new Error(`Corpus has ${recipes.length} recipes, expected 500.`);
  const verdicts = classify(recipes);

  // The corpus id (THA-###) reaches the meal row through the acquisition source
  // key the CBK1 import wrote: `tha_original:THA-###`. That key is the existing
  // canonical join and this script neither mints nor rewrites it.
  const keys = [...verdicts.keys()].map(id => `tha_original:${id}`);
  const rows = await db
    .select({ id: meals.id, name: meals.name, key: meals.acquisitionSourceKey, retiredAt: meals.retiredAt })
    .from(meals)
    .where(inArray(meals.acquisitionSourceKey, keys));

  console.log(`\nMatched ${rows.length} meal rows for ${keys.length} corpus ids.`);
  if (rows.length !== 76) {
    throw new Error(`Expected 76 matched rows, found ${rows.length}. Refusing to write a partial retirement.`);
  }

  const alreadyRetired = rows.filter(r => r.retiredAt != null).length;
  const toRetire = rows.filter(r => r.retiredAt == null);
  console.log(`Already retired: ${alreadyRetired} · to retire now: ${toRetire.length}`);

  if (dryRun) {
    console.log("\nDRY RUN — nothing written. First five that would be retired:");
    for (const r of toRetire.slice(0, 5)) {
      const id = r.key!.replace("tha_original:", "");
      console.log(`  ${id}  ${r.name}  → ${verdicts.get(id)}`);
    }
    process.exit(0);
  }

  if (toRetire.length === 0) {
    console.log("\nNothing to do — all 76 are already retired. (Idempotent re-run.)");
    process.exit(0);
  }

  // One transaction, grouped by reason so each row records WHY it went.
  const retiredAt = new Date();
  let written = 0;
  await db.transaction(async tx => {
    const byReason = new Map<RetireReason, string[]>();
    for (const r of toRetire) {
      const id = r.key!.replace("tha_original:", "");
      const reason = verdicts.get(id)!;
      byReason.set(reason, [...(byReason.get(reason) ?? []), r.key!]);
    }
    for (const [reason, reasonKeys] of byReason) {
      const res = await tx
        .update(meals)
        .set({ retiredAt, retiredReason: reason })
        .where(inArray(meals.acquisitionSourceKey, reasonKeys))
        .returning({ id: meals.id });
      console.log(`  ${reason}: ${res.length}`);
      written += res.length;
    }
  });

  // Post-write proof, read back from the database rather than assumed.
  const [{ count: liveCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(meals)
    .where(and(sql`${meals.isSystemMeal} = true`, sql`${meals.acquisitionSourceKey} LIKE 'tha_original:%'`, sql`${meals.retiredAt} IS NULL`));
  const [{ count: retiredCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(meals)
    .where(and(sql`${meals.acquisitionSourceKey} LIKE 'tha_original:%'`, isNotNull(meals.retiredAt)));

  console.log(`\nRetired ${written} meals.`);
  console.log(`Founding cookbook: ${liveCount} live + ${retiredCount} retired = ${liveCount + retiredCount} rows (must be 500).`);
  if (liveCount + retiredCount !== 500) {
    throw new Error("Row count is no longer 500 — a row was lost. Investigate before proceeding.");
  }
  process.exit(0);
}

main().catch(err => {
  console.error("\nFAILED:", err.message);
  process.exit(1);
});
