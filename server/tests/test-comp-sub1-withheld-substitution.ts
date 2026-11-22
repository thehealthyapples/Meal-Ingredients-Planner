/**
 * test-comp-sub1-withheld-substitution.ts
 * ==========================================
 * COMP_SUB1 — when PROD3's response-safety gate withholds a meal the Companion
 * was about to suggest, it now offers the SAME curated/community substitution
 * the planner-add flow already offers, as a one-tap `meals.replace` Companion
 * Action — instead of just refusing and saying "ask me again".
 *
 * No database: `HouseholdSafetyContext` and the meal are both hand-built, and
 * the storage read is stubbed for this one test's duration.
 *
 * Run: npx tsx server/tests/test-comp-sub1-withheld-substitution.ts
 */
import type { HouseholdSafetyContext } from "../lib/household-dietary-safety.js";
import { RESTRICTION_DEFINITIONS } from "../../shared/restrictions/restriction-library.js";
import { storage } from "../storage.js";
import {
  validateResponseSafety,
  buildWithheldMealSubstitutionDraft,
} from "../intelligence/conversation/conversation-gateway.js";
import type { PlannerMealCheck } from "../intelligence/conversation/action-resolution.js";
import type { Meal } from "../../shared/schema.js";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, label: string, detail?: unknown): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}${detail !== undefined ? ` — got ${JSON.stringify(detail)}` : ""}`);
  }
}

const GLUTEN_RESTRICTION = RESTRICTION_DEFINITIONS.find((d) => d.id === "gluten");
if (!GLUTEN_RESTRICTION) throw new Error("fixture setup: canonical 'gluten' restriction not found");

const DAIRY_RESTRICTION = RESTRICTION_DEFINITIONS.find((d) => d.id === "dairy");
if (!DAIRY_RESTRICTION) throw new Error("fixture setup: canonical 'dairy' restriction not found");

function glutenHousehold(): HouseholdSafetyContext {
  return {
    status: "resolved",
    householdId: 9101,
    requesterUserId: 9101,
    requesterDietPattern: null,
    requesterDietPatterns: [],
    members: [{ userId: 9101, displayName: "Test", hardRestrictions: ["gluten"], dietPattern: null, dietPatterns: [], dietTypes: [], excludedIngredients: [] }],
    hardRestrictions: ["gluten"],
    activeRestrictions: [GLUTEN_RESTRICTION!],
    dietPatterns: [],
    preferences: { dietTypes: [], excludedIngredients: [] },
  };
}

function dairyHousehold(): HouseholdSafetyContext {
  return {
    status: "resolved",
    householdId: 9102,
    requesterUserId: 9102,
    requesterDietPattern: null,
    requesterDietPatterns: [],
    members: [{ userId: 9102, displayName: "Test", hardRestrictions: ["dairy"], dietPattern: null, dietPatterns: [], dietTypes: [], excludedIngredients: [] }],
    hardRestrictions: ["dairy"],
    activeRestrictions: [DAIRY_RESTRICTION!],
    dietPatterns: [],
    preferences: { dietTypes: [], excludedIngredients: [] },
  };
}

const BOLOGNESE: Meal = {
  id: 90001,
  name: "Test Spaghetti Bolognese",
  ingredients: ["1tbsp worcestershire sauce", "350g spaghetti", "500g beef mince"],
} as Meal;

async function main() {
  // ── §1 The core lookup: a withheld meal with a curated fix gets a draft ──
  {
    const original = storage.getMeal;
    storage.getMeal = (async (id: number) => (id === BOLOGNESE.id ? BOLOGNESE : undefined)) as typeof storage.getMeal;
    try {
      const result = await validateResponseSafety(
        "You could try Test Spaghetti Bolognese tonight.",
        [{ type: "meal", id: BOLOGNESE.id }],
        glutenHousehold(),
      );
      assert(result.withheld === 1, "the unsafe meal is withheld (1)", result.withheld);
      assert(result.entityRefs.length === 0, "the unsafe ref is dropped from entityRefs");
      assert(!!result.substitutionDraft, "a substitution draft is offered when a curated fix exists", result);
      if (result.substitutionDraft) {
        assert(result.substitutionDraft.capabilityId === "meals", "draft targets the meals capability");
        assert(result.substitutionDraft.verb === "replace", "draft verb is replace");
        const params = result.substitutionDraft.parameters as Record<string, unknown>;
        assert(params.mealId === BOLOGNESE.id, "draft carries the correct mealId", params);
        assert(params.ingredient === "1tbsp worcestershire sauce", "draft carries the exact conflicting ingredient line", params);
        assert(typeof params.replacement === "string" && (params.replacement as string).length > 0, "draft carries a real replacement string", params);
      }
      assert(/confirm below/i.test(result.text), "the withheld message invites a one-tap confirm, not just 'ask me again'", result.text);
      assert(!/ask me again/i.test(result.text), "the old dead-end phrasing is replaced when a fix is offered", result.text);
    } finally {
      storage.getMeal = original;
    }
  }

  // ── §2 Restriction-agnostic wording — must not hardcode "gluten" ─────────
  {
    const original = storage.getMeal;
    const CHEESE_SAUCE: Meal = { id: 90002, name: "Test Cheese Sauce Pasta", ingredients: ["200ml double cream", "50g parmesan"] } as Meal;
    storage.getMeal = (async (id: number) => (id === CHEESE_SAUCE.id ? CHEESE_SAUCE : undefined)) as typeof storage.getMeal;
    try {
      const result = await validateResponseSafety(
        "Cheese Sauce Pasta might work.",
        [{ type: "meal", id: CHEESE_SAUCE.id }],
        dairyHousehold(),
      );
      if (result.substitutionDraft) {
        assert(!/gluten/i.test(result.text), "a dairy-restricted household's offer text never mentions gluten", result.text);
      } else {
        // No curated dairy fix for this exact ingredient is an acceptable honest
        // outcome too — the invariant under test is just "never say gluten for
        // a dairy household", which an unoffered draft trivially satisfies.
        assert(!/gluten/i.test(result.text), "no-draft fallback text also never mentions gluten for a dairy household", result.text);
      }
    } finally {
      storage.getMeal = original;
    }
  }

  // ── §3 No alternative exists → falls back to the original honest refusal ──
  {
    const original = storage.getMeal;
    const PLAIN_UNSAFE: Meal = { id: 90003, name: "Test Unfixable Meal", ingredients: ["an ingredient with no curated or community fix xyzzy123"] } as Meal;
    storage.getMeal = (async (id: number) => (id === PLAIN_UNSAFE.id ? PLAIN_UNSAFE : undefined)) as typeof storage.getMeal;
    try {
      const result = await validateResponseSafety(
        "Test Unfixable Meal could work.",
        [{ type: "meal", id: PLAIN_UNSAFE.id }],
        glutenHousehold(),
      );
      // This specific ingredient carries no gluten term at all, so it is not
      // even flagged restricted by the gluten gate — covered for completeness,
      // not as the primary assertion (the primary no-alternative case is
      // exercised structurally by buildWithheldMealSubstitutionDraft below).
      assert(result.withheld === 0 || !result.substitutionDraft, "an ingredient with no real conflict/fix never gets a fabricated draft", result);
    } finally {
      storage.getMeal = original;
    }
  }

  // ── §4 buildWithheldMealSubstitutionDraft: no ingredient → no draft ──────
  {
    const check: Extract<PlannerMealCheck, { kind: "restricted" }> = {
      kind: "restricted",
      mealName: "X",
      restrictionNames: ["Gluten"],
      restrictionIds: ["gluten"],
      ingredient: null,
      matchedTerm: null,
      alternatives: ["gluten-free pasta"],
      communityAlternatives: [],
      householdId: 1,
    };
    assert(buildWithheldMealSubstitutionDraft(1, check) === null, "no conflicting ingredient recorded → no draft, even with alternatives listed");
  }

  // ── §5 buildWithheldMealSubstitutionDraft: no alternatives → no draft ────
  {
    const check: Extract<PlannerMealCheck, { kind: "restricted" }> = {
      kind: "restricted",
      mealName: "X",
      restrictionNames: ["Gluten"],
      restrictionIds: ["gluten"],
      ingredient: "350g spaghetti",
      matchedTerm: "spaghetti",
      alternatives: [],
      communityAlternatives: [],
      householdId: 1,
    };
    assert(buildWithheldMealSubstitutionDraft(1, check) === null, "no curated or community alternative → honestly no draft");
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log("COMP_SUB1 — Withheld-meal substitution offer");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    console.error("\nFailed assertions:");
    failures.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
  console.log("All tests passed ✓");
}

main().catch((err) => {
  console.error("[test-comp-sub1-withheld-substitution] Unexpected error:", err);
  process.exit(1);
});
