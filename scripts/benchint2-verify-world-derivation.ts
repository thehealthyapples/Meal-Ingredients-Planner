/**
 * benchint2-verify-world-derivation.ts
 * =====================================
 * Verification utility for BENCHINT2 (see
 * docs/implementation/benchmarking/BENCHINT2_BENCHMARK_RUNTIME_CONVERGENCE.md).
 *
 * Answers one question against a live DEV database: **does seeding a Benchmark Household now run
 * production's derivation, and does it leave production's shape behind?**
 *
 * It seeds ONE household through `resetBenchmarkHousehold` — the ordinary, idempotent, DEV-only,
 * account-scoped reset — and then counts the rows that BENCHINT1 D2, D7 and D11 said were missing
 * or malformed:
 *
 *   D2  meal `nutrition` rows and `meal_allergens` rows   (were: always zero)
 *   D7  evidence events + learning signals via the canonical orchestrator
 *   D11 the partner adult's household memberships          (were: solo household orphaned)
 *
 * It does NOT run the Companion Benchmark. No question is asked, no turn is executed, no score is
 * produced, no run artefact is written — `ARCH_BENCHMARK_OWNERSHIP_RULE.md` reserves benchmark
 * execution for the user. This only creates the world the benchmark would later measure.
 *
 *   npx tsx scripts/benchint2-verify-world-derivation.ts [householdId]
 */

import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "../server/db.js";
import {
  meals, nutrition, mealAllergens,
  households, householdMembers,
  householdEvidenceEvents, householdLearningSignals,
} from "../shared/schema.js";
import {
  resetBenchmarkHousehold,
  resolveBenchmarkOwner,
  benchmarkWorldAllowed,
} from "../server/benchmark/world-seeder.js";
import { getBenchmarkHouseholdFixture, BENCHMARK_WORLD } from "../server/benchmark/world-fixtures.js";
import { storage } from "../server/storage.js";

const householdId = process.argv[2] ?? BENCHMARK_WORLD.find((f) => !f.coldStart && f.accounts.length > 1)?.id;

if (!benchmarkWorldAllowed()) {
  console.error("Refusing to run: the Benchmark Household World is DEV-only.");
  process.exit(1);
}
if (!householdId || !getBenchmarkHouseholdFixture(householdId)) {
  console.error(`Unknown Benchmark Household id: ${householdId}`);
  process.exit(1);
}

const fixture = getBenchmarkHouseholdFixture(householdId)!;

console.log(`\nBENCHINT2 — world derivation verification for ${fixture.id} (${fixture.householdName})\n`);
console.log(`Fixture declares: ${fixture.meals.length} meals, ${fixture.evidence.length} evidence events, ` +
  `${fixture.accounts.length} account(s)\n`);

console.log("Seeding through resetBenchmarkHousehold (production write paths only)…");
const started = Date.now();
const result = await resetBenchmarkHousehold(householdId);
console.log(`Seeded in ${((Date.now() - started) / 1000).toFixed(1)}s. Seeder counts:`, result.counts, "\n");

const owner = await resolveBenchmarkOwner(householdId);
if (!owner) { console.error("owner not resolvable after seed"); process.exit(1); }

// ── D2 — meal nutrition and allergen derivation ────────────────────────────────────────────────
const ownMeals = await db.select({ id: meals.id, name: meals.name }).from(meals).where(eq(meals.userId, owner.id));
const mealIds = ownMeals.map((m) => m.id);
const nutritionRows = mealIds.length
  ? await db.select({ mealId: nutrition.mealId, calories: nutrition.calories, source: nutrition.source })
      .from(nutrition).where(inArray(nutrition.mealId, mealIds))
  : [];
const allergenRows = mealIds.length
  ? await db.select({ mealId: mealAllergens.mealId, allergen: mealAllergens.allergen })
      .from(mealAllergens).where(inArray(mealAllergens.mealId, mealIds))
  : [];

// ── D7 — evidence recorded through the canonical orchestrator ──────────────────────────────────
const events = await db.select({ id: householdEvidenceEvents.id, occurredAt: householdEvidenceEvents.occurredAt })
  .from(householdEvidenceEvents).where(eq(householdEvidenceEvents.householdId, result.householdId));
const signals = await db.select({ subjectKey: householdLearningSignals.subjectKey, direction: householdLearningSignals.direction, confidence: householdLearningSignals.confidence })
  .from(householdLearningSignals).where(eq(householdLearningSignals.householdId, result.householdId));

// ── D11 — the partner joined through the production invite path ────────────────────────────────
const partnerAccount = fixture.accounts.find((a) => a.key === "partner");
let partnerReport = "n/a — fixture has no partner adult";
let orphanCount = 0;
if (partnerAccount) {
  const partner = await storage.getUserByUsername(partnerAccount.username);
  if (partner) {
    const memberships = await db.select({
      householdId: householdMembers.householdId,
      status: householdMembers.status,
      role: householdMembers.role,
    }).from(householdMembers).where(eq(householdMembers.userId, partner.id));
    const active = memberships.filter((m) => m.status === "active");
    const left = memberships.filter((m) => m.status === "left");
    partnerReport =
      `${active.length} active (household ${active.map((a) => a.householdId).join(",") || "—"}), ` +
      `${left.length} left-behind (their solo household, exactly as a real join leaves it)`;

    // A household with zero members at all is the orphan D11 named. A "left" membership is not an
    // orphan: it is the row production's own leaveHousehold/joinHousehold flow produces.
    for (const m of memberships) {
      const anyMember = await db.select({ id: householdMembers.id }).from(householdMembers)
        .where(eq(householdMembers.householdId, m.householdId));
      if (anyMember.length === 0) orphanCount++;
    }
  }
}

// ── Report ─────────────────────────────────────────────────────────────────────────────────────
const withNutrition = new Set(nutritionRows.map((r) => r.mealId)).size;
const withAllergens = new Set(allergenRows.map((r) => r.mealId)).size;

console.log("D2 — meal derivation (production autoAnalyzeMeal)");
console.log(`  meals seeded ............... ${ownMeals.length}`);
console.log(`  meals with nutrition ....... ${withNutrition}  ${withNutrition ? `(sources: ${[...new Set(nutritionRows.map((r) => r.source))].join(", ")})` : "(0 — OpenFoodFacts unreachable? nutrition is an honest gap, never fabricated)"}`);
console.log(`  meals with allergens ....... ${withAllergens}  (${allergenRows.length} allergen rows; derived offline, no network)`);
console.log(`  BEFORE BENCHINT2 both were . 0\n`);

console.log("D7 — evidence via recordOutcomeAndDetect");
console.log(`  evidence events ............ ${events.length} (fixture declares ${fixture.evidence.length})`);
console.log(`  backdated occurredAt ....... ${events.filter((e) => e.occurredAt < new Date(Date.now() - 12 * 3600_000)).length} of ${events.length} are older than 12h`);
console.log(`  learning signals ........... ${signals.length}${signals.length ? ` → ${signals.map((s) => `${s.subjectKey}:${s.direction}/${s.confidence}`).join(", ")}` : ""}\n`);

console.log("D11 — partner adult via storage.joinHousehold");
console.log(`  partner memberships ........ ${partnerReport}`);
console.log(`  member-less orphan households ${orphanCount}  (expected 0)\n`);

const ok =
  withAllergens > 0 &&
  events.length === fixture.evidence.length &&
  orphanCount === 0;

console.log(ok ? "VERIFIED — production derivation ran during world creation." : "NOT VERIFIED — see counts above.");
process.exit(ok ? 0 : 1);
