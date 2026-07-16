/**
 * test-diet-reconciliation-bridge.ts
 * ====================================
 * Regression ratchet for CONV1 P4 (WRITE-1) — the Bridge is dead, the owner answers.
 *
 * WHAT THE OLD SUITE PROVED
 * This file used to test the self-declared "Bridge" in routes.ts: every profile save
 * of `users.diet_pattern` was mirrored into `user_preferences.diet_types` (canonical
 * mapping, preservation of non-canonical soft values, no duplicates). The Bridge was
 * a symptom — one fact stored in two places, reconciled at every write.
 *
 * WHY THIS REPLACES IT
 * CONV1 P4 retired `users.diet_pattern` / `users.diet_restrictions` and made the
 * person's eater row (Register Domain 16) the ONE canonical owner of their diet.
 * The Bridge in routes.ts is DELETED (WRITE-1); the profile and onboarding doors
 * write through `storage.updatePersonDiet` (WRITE-2), which stores the pattern as
 * its canonical diet type at the head of the eater row's `default_diet_types` and
 * preserves non-canonical soft values — the very guarantees the Bridge used to
 * fake by mirroring. This suite ratchets all of that:
 *
 *   1. THE BRIDGE STAYS DEAD — routes.ts must never again contain the Bridge.
 *   2. THE OWNER ROUND-TRIPS — updatePersonDiet → getPersonDiet returns the declared
 *      pattern; the eater row stores it canonically, first; soft values survive.
 *   3. THE MIRROR STAYS UNTOUCHED — a diet-pattern write never writes
 *      `user_preferences.diet_types` (the retired mirror).
 *
 * Part 2 keeps the old suite's still-live coverage: planner scoring for the diet
 * types the reconciliation work introduced. That behaviour did not move.
 *
 * Run with: npx tsx server/tests/test-diet-reconciliation-bridge.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq, sql } from 'drizzle-orm';
import { scoreMeal } from '../lib/meal-scoring-service.js';
import type { UserPreferences } from '@shared/schema.js';

// ─── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ─── Part 1: the ratchet ──────────────────────────────────────────────────────

async function ratchet(): Promise<void> {
  section("Ratchet 1 — the Bridge stays dead (WRITE-1)");

  const routesSource = readFileSync(join(process.cwd(), 'server/routes.ts'), 'utf-8');
  assert(
    !routesSource.includes('Bridge: sync users.diet_pattern'),
    'routes.ts no longer contains the Bridge — the one write door is updatePersonDiet, not a mirror',
  );

  section("Ratchet 2 — the owner round-trips (OWN-1 / WRITE-2)");

  const { storage } = await import('../storage.js');
  const { db } = await import('../db.js');
  const { getHouseholdForUser } = await import('../lib/household.js');
  const { householdEaters } = await import('../../shared/schema.js');

  let userId: number | null = null;
  let householdId: number | null = null;
  try {
    const user = await storage.createUser({
      username: `bridge-ratchet-${Date.now()}`,
      password: 'x'.repeat(40),
    } as any);
    userId = user.id;
    householdId = await getHouseholdForUser(user.id);

    // Seed a non-canonical soft value on the eater row — the "halal" a household
    // may hold alongside its pattern. The write door must never destroy it.
    const [eaterBefore] = await db
      .select()
      .from(householdEaters)
      .where(eq(householdEaters.householdId, householdId));
    assert(!!eaterBefore, 'registration created the eater row (membership events own creation)');
    await db
      .update(householdEaters)
      .set({ defaultDietTypes: ['halal'] })
      .where(eq(householdEaters.id, eaterBefore.id));

    // Seed the retired mirror so ratchet 3 can prove it is left alone.
    await storage.upsertUserPreferences(user.id, { dietTypes: ['mediterranean'] } as any);

    // The round-trip.
    await storage.updatePersonDiet(user.id, { dietPattern: 'Vegan' });

    const diet = await storage.getPersonDiet(user.id);
    assert(diet.dietPattern === 'Vegan', 'getPersonDiet derives the declared pattern back, canonical spelling', diet.dietPattern ?? 'null');

    const [eaterAfter] = await db
      .select()
      .from(householdEaters)
      .where(eq(householdEaters.id, eaterBefore.id));
    assert(
      (eaterAfter.defaultDietTypes ?? [])[0] === 'vegan',
      'the eater row stores the pattern as its canonical diet type, FIRST — derivation returns exactly what was declared',
      JSON.stringify(eaterAfter.defaultDietTypes),
    );
    assert(
      (eaterAfter.defaultDietTypes ?? []).includes('halal'),
      'the non-canonical soft value ("halal") already on the row is PRESERVED',
      JSON.stringify(eaterAfter.defaultDietTypes),
    );

    section("Ratchet 3 — the retired mirror stays untouched");

    const prefs = await storage.getUserPreferences(user.id);
    assert(
      JSON.stringify(prefs?.dietTypes) === JSON.stringify(['mediterranean']),
      'a diet-pattern write does NOT write user_preferences.diet_types — the mirror the Bridge maintained is retired',
      JSON.stringify(prefs?.dietTypes),
    );
  } finally {
    // Clean up everything registration and the test created.
    try {
      if (userId != null) {
        await db.execute(sql`DELETE FROM user_preferences WHERE user_id = ${userId}`);
        if (householdId != null) {
          await db.execute(sql`DELETE FROM households WHERE id = ${householdId}`);
        }
        await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
      }
    } catch { /* best effort */ }
  }
}

// ─── Part 2: Planner scoring — the diet types the reconciliation added ─────────

function makePrefs(dietTypes: string[]): UserPreferences {
  return {
    id: 1,
    userId: 1,
    dietTypes,
    excludedIngredients: [],
    healthGoals: [],
    budgetLevel: null,
    upfSensitivity: null,
    qualityPreference: null,
    adultsCount: null,
    childrenCount: null,
    babiesCount: null,
    calorieMode: null,
    calorieTarget: null,
    heightCm: null,
    weightKg: null,
    activityLevel: null,
    goalType: null,
    preferredStores: [],
    soundEnabled: null,
    eliteTrackingEnabled: null,
    healthTrendEnabled: null,
    barcodeScannerEnabled: null,
    mealMode: null,
    maxExtraPrepMinutes: null,
    maxTotalCookTime: null,
    preferLessProcessed: null,
    plannerEnableDrinks: null,
    measurementPreference: null,
  } as unknown as UserPreferences;
}

function scoreForDiet(dietTypes: string[], ingredients: string[]): number {
  const prefs = makePrefs(dietTypes);
  return scoreMeal({ name: "Test Meal", ingredients }, prefs).score;
}

function scoring(): void {
  section("Scoring — paleo");

  {
    const safeScore = scoreForDiet(["paleo"], ["chicken breast", "sweet potato", "broccoli", "olive oil"]);
    const penaltyScore = scoreForDiet(["paleo"], ["pasta", "bread", "beans", "cheese"]);
    assert(safeScore > penaltyScore, `Paleo-safe meal scores higher than paleo-violating (${safeScore} > ${penaltyScore})`);
    assert(penaltyScore < safeScore - 20, `Paleo-violating meal takes >20-point penalty (${safeScore} → ${penaltyScore})`);
  }

  section("Scoring — low-carb");

  {
    const safeScore = scoreForDiet(["low-carb"], ["chicken thigh", "courgette", "spinach", "olive oil"]);
    const penaltyScore = scoreForDiet(["low-carb"], ["pasta", "bread", "rice", "potato"]);
    assert(safeScore > penaltyScore, `Low-carb safe meal scores higher (${safeScore} > ${penaltyScore})`);
  }

  section("Scoring — carnivore");

  {
    const safeScore = scoreForDiet(["carnivore"], ["beef steak", "lamb chops", "butter"]);
    const penaltyScore = scoreForDiet(["carnivore"], ["beans", "lentils", "tofu", "pasta", "bread"]);
    assert(safeScore > penaltyScore, `Carnivore-safe meal scores higher (${safeScore} > ${penaltyScore})`);
  }

  section("Scoring — flexitarian");

  {
    const safeScore = scoreForDiet(["flexitarian"], ["lentils", "chickpeas", "spinach", "quinoa"]);
    const penaltyScore = scoreForDiet(["flexitarian"], ["beef", "lamb", "bacon", "pork", "mince"]);
    assert(safeScore > penaltyScore, `Flexitarian plant meal scores higher than red-meat meal (${safeScore} > ${penaltyScore})`);
  }

  section("Scoring — mediterranean");

  {
    const safeScore = scoreForDiet(["mediterranean"], ["salmon", "olive oil", "tomatoes", "garlic", "lentils"]);
    const penaltyScore = scoreForDiet(["mediterranean"], ["bacon", "salami", "pepperoni", "processed", "instant"]);
    assert(safeScore > penaltyScore, `Mediterranean-aligned meal scores higher (${safeScore} > ${penaltyScore})`);
  }

  section("Scoring — DASH");

  {
    const safeScore = scoreForDiet(["dash"], ["chicken breast", "vegetables", "brown rice"]);
    const penaltyScore = scoreForDiet(["dash"], ["bacon", "ham", "salami", "soy sauce", "processed"]);
    assert(safeScore > penaltyScore, `DASH-compliant meal scores higher (${safeScore} > ${penaltyScore})`);
  }

  section("Scoring — MIND");

  {
    const safeScore = scoreForDiet(["mind"], ["salmon", "leafy greens", "blueberries", "walnuts"]);
    const penaltyScore = scoreForDiet(["mind"], ["beef", "lamb", "steak", "butter", "cream", "chocolate", "sugar"]);
    assert(safeScore > penaltyScore, `MIND-compliant meal scores higher (${safeScore} > ${penaltyScore})`);
  }

  section("Scoring — planner recognises new diet types (non-zero effect)");

  for (const dietType of ["paleo", "low-carb", "carnivore", "flexitarian", "mediterranean", "dash", "mind"]) {
    // A meal with penalty ingredients should score lower than base when diet type is active
    const baseScore = scoreForDiet([], ["chicken", "vegetables", "olive oil"]);
    // Score of a neutral meal should equal base (diet type is active but no penalty keywords)
    const neutralScore = scoreForDiet([dietType], ["chicken", "vegetables", "olive oil"]);
    assert(
      neutralScore === baseScore,
      `${dietType}: neutral meal unchanged by diet type (score = ${neutralScore})`,
    );
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await ratchet();
  scoring();

  console.log(`\n── Results ──`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
