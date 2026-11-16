/**
 * test-learned-substitution-store.ts — COMP3 Learned Substitution Observations
 * ===============================================================================
 * Coverage:
 *   - Recording the same correction twice from the SAME household is a no-op,
 *     not a second row (repeating yourself across turns must not inflate counts).
 *   - Two DIFFERENT households stating the same fix both count — that
 *     corroboration is the entire reason this table exists.
 *   - Results are scoped exactly to (restrictionId, ingredientKey); a different
 *     ingredient or a different restriction never leaks in.
 *   - Most-corroborated replacement sorts first.
 *   - `listObservations` never exposes which household said something.
 *
 * No database. Run: npx tsx server/tests/test-learned-substitution-store.ts
 */

import { InMemoryLearnedSubstitutionStore } from "../intelligence/conversation/learned-substitution-store.js";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
}

async function main() {
  const store = new InMemoryLearnedSubstitutionStore();

  await store.recordObservation({
    restrictionId: "gluten", ingredientKey: "worcestershire sauce",
    statedReplacement: "gluten-free worcestershire sauce", householdId: 44,
  });
  // The SAME household repeating itself across turns.
  await store.recordObservation({
    restrictionId: "gluten", ingredientKey: "worcestershire sauce",
    statedReplacement: "gluten-free worcestershire sauce", householdId: 44,
  });
  const afterRepeat = await store.listObservations("gluten", "worcestershire sauce");
  assert(
    afterRepeat.length === 1 && afterRepeat[0].householdCount === 1,
    "the same household repeating its own correction is a no-op, not a second count",
  );

  // A DIFFERENT household stating the SAME fix — corroboration.
  await store.recordObservation({
    restrictionId: "gluten", ingredientKey: "worcestershire sauce",
    statedReplacement: "gluten-free worcestershire sauce", householdId: 221,
  });
  const afterCorroboration = await store.listObservations("gluten", "worcestershire sauce");
  assert(
    afterCorroboration.length === 1 && afterCorroboration[0].householdCount === 2,
    "a second, different household stating the same fix raises the count",
  );
  assert(
    !("householdId" in (afterCorroboration[0] as unknown as Record<string, unknown>)),
    "listObservations never exposes which household said it",
  );

  // A different, less-corroborated statement for the SAME ingredient.
  await store.recordObservation({
    restrictionId: "gluten", ingredientKey: "worcestershire sauce",
    statedReplacement: "tamari", householdId: 99,
  });
  const withTwoOptions = await store.listObservations("gluten", "worcestershire sauce");
  assert(
    withTwoOptions.length === 2 && withTwoOptions[0].statedReplacement === "gluten-free worcestershire sauce",
    "the most-corroborated replacement sorts first",
  );

  // Scoping — a different ingredient, and a different restriction, never leak in.
  await store.recordObservation({
    restrictionId: "gluten", ingredientKey: "soy sauce",
    statedReplacement: "gluten-free soy sauce", householdId: 1,
  });
  await store.recordObservation({
    restrictionId: "dairy", ingredientKey: "worcestershire sauce",
    statedReplacement: "a dairy-free brand", householdId: 1,
  });
  const scoped = await store.listObservations("gluten", "worcestershire sauce");
  assert(
    scoped.length === 2 && !scoped.some(o => o.statedReplacement === "gluten-free soy sauce") &&
      !scoped.some(o => o.statedReplacement === "a dairy-free brand"),
    "a different ingredient key or a different restriction never leaks into results",
  );

  // Nothing recorded for this pair yet → empty, not an error.
  const nothingYet = await store.listObservations("nut", "almond butter");
  assert(Array.isArray(nothingYet) && nothingYet.length === 0, "an unobserved ingredient/restriction pair returns empty, not an error");

  console.log("\n══════════════════════════════════════════════════════");
  console.log("COMP3 — Learned Substitution Observations");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    console.error("\nFailed assertions:");
    failures.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
  console.log("All tests passed ✓");
}

main().catch((err) => {
  console.error("[test-learned-substitution-store] Unexpected error:", err);
  process.exit(1);
});
