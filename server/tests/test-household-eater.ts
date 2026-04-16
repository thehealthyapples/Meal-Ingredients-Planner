/**
 * Household Eater — Unit Tests
 *
 * Tests for the HouseholdEater model and getEffectiveDietProfile pure function.
 *
 * Run with:  npm run test:household-eater
 */

import {
  getEffectiveDietProfile,
  type HouseholdEater,
  type EffectiveDietProfile,
} from "../../shared/household-eater.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${e}`);
    console.error(`    received: ${a}`);
    failed++;
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const adultUser: HouseholdEater = {
  id: "eater-1",
  displayName: "Alice",
  kind: "user",
  userId: 42,
  defaultDietTypes: ["Vegan"],
  hardRestrictions: ["nuts"],
};

const childMember: HouseholdEater = {
  id: "eater-2",
  displayName: "Toby",
  kind: "child",
  defaultDietTypes: ["Vegetarian"],
  hardRestrictions: ["Gluten-Free", "dairy"],
};

const noPreferences: HouseholdEater = {
  id: "eater-3",
  displayName: "Sam",
  kind: "user",
  userId: 99,
  defaultDietTypes: [],
  hardRestrictions: [],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\nHouseholdEater — getEffectiveDietProfile\n");

// 1. Default only — no override provided
console.log("1. Default only (no override)");

assert(
  "adult user: dietTypes = defaultDietTypes",
  getEffectiveDietProfile(adultUser),
  { dietTypes: ["Vegan"], hardRestrictions: ["nuts"] } satisfies EffectiveDietProfile,
);

assert(
  "child member: dietTypes = defaultDietTypes",
  getEffectiveDietProfile(childMember),
  { dietTypes: ["Vegetarian"], hardRestrictions: ["Gluten-Free", "dairy"] } satisfies EffectiveDietProfile,
);

assert(
  "eater with no preferences: both arrays empty",
  getEffectiveDietProfile(noPreferences),
  { dietTypes: [], hardRestrictions: [] } satisfies EffectiveDietProfile,
);

// 2. Override applied — override.dietTypes replaces defaultDietTypes
console.log("\n2. Override applied");

assert(
  "override replaces defaultDietTypes",
  getEffectiveDietProfile(adultUser, { dietTypes: ["Flexitarian"] }),
  { dietTypes: ["Flexitarian"], hardRestrictions: ["nuts"] } satisfies EffectiveDietProfile,
);

assert(
  "override with empty array replaces defaultDietTypes",
  getEffectiveDietProfile(adultUser, { dietTypes: [] }),
  { dietTypes: [], hardRestrictions: ["nuts"] } satisfies EffectiveDietProfile,
);

assert(
  "override with multiple values",
  getEffectiveDietProfile(childMember, { dietTypes: ["Vegan", "Gluten-free"] }),
  { dietTypes: ["Vegan", "Gluten-free"], hardRestrictions: ["Gluten-Free", "dairy"] } satisfies EffectiveDietProfile,
);

// 3. Hard restrictions preserved — always included, never overridden
console.log("\n3. Hard restrictions preserved");

assert(
  "hardRestrictions unchanged when override is present",
  getEffectiveDietProfile(childMember, { dietTypes: ["Mediterranean"] }),
  { dietTypes: ["Mediterranean"], hardRestrictions: ["Gluten-Free", "dairy"] } satisfies EffectiveDietProfile,
);

assert(
  "hardRestrictions present even with empty override dietTypes",
  getEffectiveDietProfile(childMember, { dietTypes: [] }),
  { dietTypes: [], hardRestrictions: ["Gluten-Free", "dairy"] } satisfies EffectiveDietProfile,
);

assert(
  "hardRestrictions present even when defaultDietTypes empty and no override",
  getEffectiveDietProfile(noPreferences),
  { dietTypes: [], hardRestrictions: [] } satisfies EffectiveDietProfile,
);

assert(
  "hardRestrictions on adult user preserved with override",
  getEffectiveDietProfile(adultUser, { dietTypes: ["Carnivore"] }),
  { dietTypes: ["Carnivore"], hardRestrictions: ["nuts"] } satisfies EffectiveDietProfile,
);

// ─── Phase 4: Weekly overrides ────────────────────────────────────────────────
// A "weekly override" is simply a DietOverride passed to getEffectiveDietProfile.
// These tests confirm the three required behaviours of Phase 4.
console.log("\n4. Phase 4 — weekly override applied correctly");

assert(
  "weekly override replaces defaultDietTypes for the week",
  getEffectiveDietProfile(adultUser, { dietTypes: ["Mediterranean"] }),
  { dietTypes: ["Mediterranean"], hardRestrictions: ["nuts"] } satisfies EffectiveDietProfile,
);

console.log("\n5. Phase 4 — hard restriction preserved despite weekly override");

assert(
  "hard restriction preserved when weekly override is set",
  getEffectiveDietProfile(childMember, { dietTypes: ["Keto"] }),
  { dietTypes: ["Keto"], hardRestrictions: ["Gluten-Free", "dairy"] } satisfies EffectiveDietProfile,
);

console.log("\n6. Phase 4 — removing override restores defaultDietTypes");

assert(
  "no override (undefined) restores defaultDietTypes",
  getEffectiveDietProfile(adultUser, undefined),
  { dietTypes: ["Vegan"], hardRestrictions: ["nuts"] } satisfies EffectiveDietProfile,
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
