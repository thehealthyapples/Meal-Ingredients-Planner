/**
 * test-shell-meal-metadata-write-path.ts
 * ======================================
 * Verifies the metadata write-path fix for Planner Meal Card V2:
 * future shell-created meals must copy template metadata (styleTags +
 * suitableSlots, plus primarySlot / energyBand) into the new meal row so the
 * card can render chips and variety info.
 *
 * The shell-apply flow runs through autoImportExternalMeal (see
 * /api/smart-suggest/auto-import). The resolved template — for a shell, the shell
 * template carrying full Hybrid Meal Occasion metadata — is copied onto the meal
 * via storage.applyTemplateMetadataToMeal.
 *
 * DB-free: a fake storage records what gets created/patched and asserts the
 * metadata lands on the meal row.
 *
 * Run with: npx tsx server/tests/test-shell-meal-metadata-write-path.ts
 */

import { autoImportExternalMeal } from '../lib/auto-import-service.js';
import type { ExternalMealCandidate } from '../lib/external-meal-service.js';

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

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ── Fake storage capturing the write-path ────────────────────────────────────
// Records the row created and the patch applied so we can assert metadata flow.
function makeFakeStorage(template: any) {
  const created: any[] = [];
  const patched: Array<{ mealId: number; template: any }> = [];
  let nextId = 100;

  const fake: any = {
    async getMeals() {
      return [];
    },
    async getMealTemplateByName(name: string) {
      // Mimic the real ilike-by-name lookup: shell template resolves by name.
      return template && template.name.toLowerCase() === name.toLowerCase()
        ? template
        : undefined;
    },
    async createMealTemplate(data: any) {
      return { id: 9999, suitableSlots: [], styleTags: [], primarySlot: null, energyBand: null, ...data };
    },
    async updateMealTemplateId() {
      return undefined;
    },
    async createMeal(_userId: number, insertMeal: any) {
      const meal = { id: nextId++, ...insertMeal, styleTags: [], suitableSlots: [], primarySlot: null, energyBand: null };
      created.push(meal);
      return meal;
    },
    async applyTemplateMetadataToMeal(mealId: number, tmpl: any) {
      patched.push({ mealId, template: tmpl });
      const meal = created.find((m) => m.id === mealId);
      // Mirror the real storage method's field mapping.
      Object.assign(meal, {
        styleTags: tmpl.styleTags ?? [],
        suitableSlots: tmpl.suitableSlots ?? [],
        primarySlot: tmpl.primarySlot ?? null,
        energyBand: tmpl.energyBand ?? null,
      });
      return meal;
    },
  };

  return { fake, created, patched };
}

function candidate(partial: Partial<ExternalMealCandidate>): ExternalMealCandidate {
  return {
    externalId: 'x',
    name: 'Test Meal',
    image: null,
    ingredients: ['tomato', 'olive oil', 'basil'],
    instructions: [],
    dietTypes: [],
    estimatedCost: null,
    estimatedUPFScore: null,
    source: 'Meal Shell',
    sourceUrl: null,
    category: 'dinner',
    cuisine: null,
    primaryProtein: null,
    ...partial,
  };
}

async function run() {
  section('Shell-created meal copies template metadata');
  {
    const shellTemplate = {
      id: 42,
      name: 'Family Veggie Traybake',
      category: 'dinner',
      styleTags: ['shared-meal', 'family-pleaser', 'comfort'],
      suitableSlots: ['lunch', 'dinner'],
      primarySlot: 'dinner',
      energyBand: 'hearty',
    };
    const { fake, created, patched } = makeFakeStorage(shellTemplate);

    const result = await autoImportExternalMeal(
      candidate({ name: 'Family Veggie Traybake', source: 'Meal Shell' }),
      1,
      fake,
    );

    assert(result !== null, 'import succeeds for shell candidate');
    assert(created.length === 1, 'exactly one meal row created');
    assert(patched.length === 1, 'metadata patch applied once');

    const meal = created[0];
    assert(
      JSON.stringify(meal.styleTags) ===
        JSON.stringify(['shared-meal', 'family-pleaser', 'comfort']),
      'meal.styleTags copied from shell template',
      JSON.stringify(meal.styleTags),
    );
    assert(
      JSON.stringify(meal.suitableSlots) === JSON.stringify(['lunch', 'dinner']),
      'meal.suitableSlots copied from shell template',
      JSON.stringify(meal.suitableSlots),
    );
    assert(meal.primarySlot === 'dinner', 'meal.primarySlot copied from shell template');
    assert(meal.energyBand === 'hearty', 'meal.energyBand copied from shell template');
  }

  section('External (non-shell) candidate writes empty metadata defaults');
  {
    // No matching template by name → a bare template is created → empty metadata.
    const { fake, created, patched } = makeFakeStorage(null);

    const result = await autoImportExternalMeal(
      candidate({ name: 'Some Web Recipe', source: 'TheMealDB' }),
      1,
      fake,
    );

    assert(result !== null, 'import succeeds for external candidate');
    assert(patched.length === 1, 'metadata patch still runs (defensive)');
    const meal = created[0];
    assert(
      Array.isArray(meal.styleTags) && meal.styleTags.length === 0,
      'external meal gets empty styleTags (no shell metadata)',
      JSON.stringify(meal.styleTags),
    );
    assert(
      Array.isArray(meal.suitableSlots) && meal.suitableSlots.length === 0,
      'external meal gets empty suitableSlots',
      JSON.stringify(meal.suitableSlots),
    );
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
