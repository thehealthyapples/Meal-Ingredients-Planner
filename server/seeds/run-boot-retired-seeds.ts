/**
 * The three seeds CONV1 WRITE-4 unwired from the boot path.
 * =========================================================
 *
 * Until 2026-07-16 these ran on every server boot, each `.catch()`-swallowed and
 * none declared in the Source of Truth Register — a second, invisible publication
 * mechanism beside the one THA actually declares (`npm run seed:*`, operator-
 * invoked; CPuBA4). This file is the declared mechanism they were converged onto.
 * It did not exist, which is the part of WRITE-4 the item did not know it needed:
 * "unwire the boot path" alone would not have moved these writers to the front
 * door, it would have removed the door.
 *
 * Each seed is idempotent and safe to re-run. Each is also runnable on its own:
 *
 *     npm run seed:ready-meals      # meal categories + the ready-meal/drink set
 *     npm run seed:food-knowledge   # food_knowledge entries
 *     npm run seed:pantry-knowledge # pantry_ingredient_knowledge entries
 *     npm run seed:all              # all three, in the order above
 *
 * ORDER MATTERS, and only here. seedReadyMeals creates the meal categories that
 * scripts/import-tha-founding-cookbook-500.ts depends on ("the app must boot once
 * (seedReadyMeals creates the categories) before the cookbook is seeded" — that
 * comment is now stale in its mechanism and correct in its dependency: run
 * `npm run seed:ready-meals` instead of booting). The other two are independent.
 *
 * PROVISIONING A NEW ENVIRONMENT is now a deliberate act rather than a side
 * effect of starting a process. That is the convergence, not a regression: a boot
 * that publishes cannot be observed, ordered, or failed, and for as long as these
 * ran at boot a seed error was printed to a log nobody reads while the platform
 * came up half-published and served requests.
 */

import { seedReadyMeals } from "../lib/seed-ready-meals.js";
import { seedFoodKnowledge } from "../lib/seed-food-knowledge.js";
import { seedPantryKnowledge } from "./seed-pantry-knowledge.js";

type SeedName = "ready-meals" | "food-knowledge" | "pantry-knowledge";

const SEEDS: ReadonlyArray<{ name: SeedName; run: () => Promise<unknown> }> = [
  { name: "ready-meals", run: seedReadyMeals },
  { name: "food-knowledge", run: seedFoodKnowledge },
  { name: "pantry-knowledge", run: seedPantryKnowledge },
];

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const requested = process.argv[2];
  const selected =
    !requested || requested === "all"
      ? SEEDS
      : SEEDS.filter((s) => s.name === requested);

  if (selected.length === 0) {
    console.error(
      `Unknown seed "${requested}". Known: ${SEEDS.map((s) => s.name).join(", ")}, all.`,
    );
    process.exit(1);
  }

  for (const seed of selected) {
    console.log(`\n[seed:${seed.name}] running…`);
    // Deliberately NOT caught. At boot every one of these was
    // `.catch()`-swallowed, so a failed publication printed a line and the server
    // served anyway. An operator-invoked seed must exit non-zero and say so.
    await seed.run();
    console.log(`[seed:${seed.name}] done.`);
  }

  console.log(`\nSeeded: ${selected.map((s) => s.name).join(", ")}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\nSeed FAILED — nothing further was run.\n", err);
  process.exit(1);
});
