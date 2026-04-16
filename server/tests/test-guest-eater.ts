/**
 * Guest Eater — Phase 5 Tests
 *
 * Tests for GuestEater type and guestEaterToProfile utility,
 * plus integration scenarios confirming:
 *   1. Add a guest with gluten-free restriction → included in adaptation input
 *   2. Remove a guest → no longer in adaptation input
 *   3. Guest does not appear on other entries (isolation check, logic-level)
 *
 * Run with:  npm run test:guest-eater
 */

import {
  guestEaterToProfile,
  getEffectiveDietProfile,
  type GuestEater,
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

const glutenFreeGuest: GuestEater = {
  id: "guest-abc-1",
  displayName: "Jordan",
  dietTypes: [],
  hardRestrictions: ["Gluten-Free"],
};

const veganGuest: GuestEater = {
  id: "guest-abc-2",
  displayName: "Sam",
  dietTypes: ["Vegan"],
  hardRestrictions: [],
};

const noRestrictionGuest: GuestEater = {
  id: "guest-abc-3",
  displayName: "Alex",
  dietTypes: [],
  hardRestrictions: [],
};

const householdEater: HouseholdEater = {
  id: "eater-1",
  displayName: "Alice",
  kind: "user",
  userId: 1,
  defaultDietTypes: ["Vegetarian"],
  hardRestrictions: [],
};

// ─── Helper: simulate adaptation input builder ────────────────────────────────

/**
 * Simulates what the adapt route does:
 * builds a flat list of profiles from household eaters + guests.
 */
function buildAdaptationProfiles(
  eaters: HouseholdEater[],
  guests: GuestEater[],
): EffectiveDietProfile[] {
  const householdProfiles = eaters.map(e => getEffectiveDietProfile(e));
  const guestProfiles = guests.map(g => guestEaterToProfile(g));
  return [...householdProfiles, ...guestProfiles];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\nGuestEater — guestEaterToProfile\n");

// 1. guestEaterToProfile maps fields correctly
console.log("1. guestEaterToProfile — field mapping");

assert(
  "gluten-free guest: hardRestrictions preserved",
  guestEaterToProfile(glutenFreeGuest),
  { dietTypes: [], hardRestrictions: ["Gluten-Free"] } satisfies EffectiveDietProfile,
);

assert(
  "vegan guest: dietTypes preserved",
  guestEaterToProfile(veganGuest),
  { dietTypes: ["Vegan"], hardRestrictions: [] } satisfies EffectiveDietProfile,
);

assert(
  "no restriction guest: both arrays empty",
  guestEaterToProfile(noRestrictionGuest),
  { dietTypes: [], hardRestrictions: [] } satisfies EffectiveDietProfile,
);

// 2. Add guest with gluten-free restriction → included in adaptation input
console.log("\n2. Guest with gluten-free restriction included in adaptation input");

const entryAGuests = [glutenFreeGuest];
const entryAProfiles = buildAdaptationProfiles([householdEater], entryAGuests);

assert(
  "adaptation has 2 profiles (1 household + 1 guest)",
  entryAProfiles.length,
  2,
);

assert(
  "guest profile has gluten-free hard restriction",
  entryAProfiles.find(p => p.hardRestrictions.includes("Gluten-Free")),
  { dietTypes: [], hardRestrictions: ["Gluten-Free"] } satisfies EffectiveDietProfile,
);

assert(
  "household eater profile still present",
  entryAProfiles.find(p => p.dietTypes.includes("Vegetarian")),
  { dietTypes: ["Vegetarian"], hardRestrictions: [] } satisfies EffectiveDietProfile,
);

// 3. Re-tailor same meal: guest still included (idempotent)
console.log("\n3. Re-tailor: guest still included in second adaptation run");

const retailorProfiles = buildAdaptationProfiles([householdEater], entryAGuests);
assert(
  "re-tailor includes same guest",
  retailorProfiles.length,
  2,
);
assert(
  "re-tailor: gluten-free restriction still present",
  retailorProfiles.some(p => p.hardRestrictions.includes("Gluten-Free")),
  true,
);

// 4. Remove guest → no longer in adaptation input
console.log("\n4. Remove guest → excluded from adaptation input");

const afterRemovalGuests: GuestEater[] = [];
const afterRemovalProfiles = buildAdaptationProfiles([householdEater], afterRemovalGuests);

assert(
  "adaptation has 1 profile after guest removal",
  afterRemovalProfiles.length,
  1,
);

assert(
  "removed guest gluten-free restriction no longer present",
  afterRemovalProfiles.some(p => p.hardRestrictions.includes("Gluten-Free")),
  false,
);

// 5. Guest isolation — does not appear on other planner entries
console.log("\n5. Guest isolation: guest on entry A does not affect entry B");

// Entry B has no guests
const entryBGuests: GuestEater[] = [];
const entryBProfiles = buildAdaptationProfiles([householdEater], entryBGuests);

assert(
  "entry B: guest from entry A is not present",
  entryBProfiles.length,
  1,
);

assert(
  "entry B: gluten-free restriction not present",
  entryBProfiles.some(p => p.hardRestrictions.includes("Gluten-Free")),
  false,
);

// 6. Multiple guests with mixed restrictions
console.log("\n6. Multiple guests with mixed restrictions");

const multiGuestProfiles = buildAdaptationProfiles([householdEater], [glutenFreeGuest, veganGuest]);

assert(
  "3 profiles total (1 household + 2 guests)",
  multiGuestProfiles.length,
  3,
);

assert(
  "vegan guest profile present",
  multiGuestProfiles.some(p => p.dietTypes.includes("Vegan")),
  true,
);

assert(
  "gluten-free guest profile present",
  multiGuestProfiles.some(p => p.hardRestrictions.includes("Gluten-Free")),
  true,
);

// 7. Guest-only (no household eaters selected) — still valid
console.log("\n7. Guest only: adaptation works with just guest eaters");

const guestOnlyProfiles = buildAdaptationProfiles([], [glutenFreeGuest]);
assert(
  "1 profile from guest alone",
  guestOnlyProfiles.length,
  1,
);
assert(
  "guest-only: gluten-free restriction present",
  guestOnlyProfiles[0]?.hardRestrictions.includes("Gluten-Free"),
  true,
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
