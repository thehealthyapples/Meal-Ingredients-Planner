/**
 * SEC4 — An applied uplift must cite a rule its owner authored and reviewed.
 *
 * CONV1 item SEC-4; the defect CPI1 S1-3 found.
 *
 * The chain under test:
 *   1. weekly-planner-page.tsx minted a rule identity that existed nowhere on the
 *      server, wrapping client-side boosts with a `why` string templated in the
 *      browser.
 *   2. MealUpliftPanel POSTed it to /api/uplift/accept.
 *   3. The endpoint persisted the caller's ruleId, ruleName and explanation
 *      VERBATIM, stamped `added_by: 'tha_uplift'` — so a suggestion invented in a
 *      browser was indistinguishable in the database from reviewed guidance, and
 *      the reviewedAt evidence gate (CPuBA3) was bypassed entirely.
 *
 * The endpoint was the defect; the client was only its first exploiter. These tests
 * cover the endpoint's rule — `resolveAcceptedSuggestions` — which is pure, so they
 * need no server and run in the aggregate suite.
 *
 * The client half is guarded by the publication register's `up-client-publisher`
 * check, which asserts the minted identity is absent from the source. It is not
 * duplicated here.
 *
 * Run with:  npm run test:sec4-uplift-rule-provenance
 */

import { resolveAcceptedSuggestions, type AcceptedSuggestion } from "../lib/uplift-persistence.js";
import type { UpliftRule } from "../lib/uplift-types.js";
import UPLIFT_RULES from "../lib/uplift-rules.js";

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

function ok(label: string, condition: boolean): void {
  assert(label, condition, true);
}

/** A minimal fixture registry — the resolver takes its rules as a parameter. */
const REVIEWED: UpliftRule = {
  id: "fixture-reviewed",
  name: "Fixture — reviewed rule",
  trigger: { mealNamePattern: ["fixture"] },
  suggestions: [
    { ingredient: "turmeric", action: "add", quantity: "½ tsp", why: "The owner's own words." },
    { ingredient: "spinach", action: "boost", why: "A boost the owner authored." },
  ],
  nutritionTags: ["micronutrient"],
  confidence: "high",
  priority: 1,
  reviewedAt: "2026-01-01",
};

const UNREVIEWED: UpliftRule = {
  id: "fixture-draft",
  name: "Fixture — draft rule",
  trigger: { mealNamePattern: ["fixture"] },
  suggestions: [{ ingredient: "kale", action: "add", why: "Draft — under review." }],
  nutritionTags: ["fibre"],
  confidence: "low",
  priority: 9,
  // no reviewedAt — the approval gate
};

const RULES = [REVIEWED, UNREVIEWED];

function claim(over: Partial<AcceptedSuggestion> = {}): AcceptedSuggestion {
  return {
    ruleId: "fixture-reviewed",
    ruleName: "Fixture — reviewed rule",
    ingredient: "turmeric",
    action: "add",
    quantity: "½ tsp",
    explanation: "The owner's own words.",
    ...over,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\nSEC4 — uplift rule provenance\n");

// ── Case 1: the phantom rule ───────────────────────────────────────────────────
console.log("Case 1 — a rule the owner never authored is rejected");

const phantom = resolveAcceptedSuggestions(
  [claim({ ruleId: "fallback-deterministic-boosts", ruleName: "Nutrition Boost" })],
  RULES,
);
assert("★ the exact identity the client used to mint is rejected", phantom.ok, false);
ok(
  "and the reason names the unknown rule",
  !phantom.ok && phantom.reason.includes("Unknown uplift rule"),
);

const invented = resolveAcceptedSuggestions([claim({ ruleId: "anything-i-invent" })], RULES);
assert("★ ANY invented rule id is rejected, not just the known one", invented.ok, false);

const missingId = resolveAcceptedSuggestions(
  [claim({ ruleId: undefined as unknown as string })], RULES,
);
assert("a missing ruleId is rejected, not defaulted", missingId.ok, false);

// ── Case 2: the approval gate ─────────────────────────────────────────────────
console.log("\nCase 2 — a real but UNREVIEWED rule is rejected (the reviewedAt gate)");

const draft = resolveAcceptedSuggestions(
  [claim({ ruleId: "fixture-draft", ingredient: "kale", quantity: undefined })],
  RULES,
);
assert("★ an unreviewed rule cannot be accepted", draft.ok, false);
ok(
  "and the reason names the approval gate",
  !draft.ok && draft.reason.includes("not approved for use"),
);

// ── Case 3: a real rule cannot smuggle an unauthored suggestion ───────────────
console.log("\nCase 3 — a real rule cannot carry a suggestion it does not author");

const smuggled = resolveAcceptedSuggestions([claim({ ingredient: "double cream" })], RULES);
assert("★ citing a real rule with an invented ingredient is rejected", smuggled.ok, false);
ok(
  "and the reason names the rule and the suggestion",
  !smuggled.ok && smuggled.reason.includes("does not author suggestion"),
);

const wrongAction = resolveAcceptedSuggestions([claim({ action: "swap" })], RULES);
assert("a real ingredient with the wrong action is rejected", wrongAction.ok, false);

// ── Case 4: the owner's copy wins — the caller's is discarded ─────────────────
console.log("\nCase 4 — the owner's values are returned, the caller's are discarded");

const lied = resolveAcceptedSuggestions(
  [
    claim({
      ruleName: "Doctor-approved miracle cure",
      quantity: "700 kg",
      explanation: "Clinically proven to prevent disease.",
    }),
  ],
  RULES,
);
ok("a lying-but-resolvable claim still resolves", lied.ok);
if (lied.ok) {
  assert("★ ruleName comes from the owner, not the caller", lied.resolved[0].rule.name, "Fixture — reviewed rule");
  assert("★ quantity comes from the owner", lied.resolved[0].suggestion.quantity, "½ tsp");
  assert("★ explanation comes from the owner", lied.resolved[0].suggestion.why, "The owner's own words.");
  assert("ingredient is the owner's", lied.resolved[0].suggestion.ingredient, "turmeric");
}

// ── Case 5: legitimate accepts still work ─────────────────────────────────────
console.log("\nCase 5 — a legitimate accept resolves (the fix must not break the feature)");

const good = resolveAcceptedSuggestions([claim()], RULES);
ok("★ an honest claim resolves", good.ok);
if (good.ok) {
  assert("one resolved suggestion", good.resolved.length, 1);
  assert("the rule is the owner's", good.resolved[0].rule.id, "fixture-reviewed");
}

const both = resolveAcceptedSuggestions(
  [claim(), claim({ ingredient: "spinach", action: "boost", quantity: undefined })],
  RULES,
);
ok("multiple suggestions from one rule resolve", both.ok);
if (both.ok) assert("both resolved", both.resolved.length, 2);

// Case-insensitive / whitespace tolerance — the client echoes the owner's string,
// but a resolver that broke on " Turmeric " would reject a legitimate accept.
const spaced = resolveAcceptedSuggestions([claim({ ingredient: "  Turmeric  " })], RULES);
ok("ingredient matching tolerates case and surrounding whitespace", spaced.ok);

// ── Case 6: all-or-nothing ────────────────────────────────────────────────────
console.log("\nCase 6 — one bad suggestion rejects the whole request");

const mixed = resolveAcceptedSuggestions([claim(), claim({ ruleId: "invented" })], RULES);
assert("★ a batch containing one phantom is rejected entirely", mixed.ok, false);

// ── Case 7: the real registry ─────────────────────────────────────────────────
console.log("\nCase 7 — against the live UPLIFT_RULES registry");

const realPhantom = resolveAcceptedSuggestions(
  [claim({ ruleId: "fallback-deterministic-boosts", ruleName: "Nutrition Boost", ingredient: "chia seeds" })],
  UPLIFT_RULES,
);
assert("★ the phantom is rejected by the real registry too", realPhantom.ok, false);

const realRule = UPLIFT_RULES.find(r => r.reviewedAt)!;
const realSuggestion = realRule.suggestions[0];
const realAccept = resolveAcceptedSuggestions(
  [
    {
      ruleId: realRule.id,
      ruleName: realRule.name,
      ingredient: realSuggestion.ingredient,
      action: realSuggestion.action,
      quantity: realSuggestion.quantity,
      explanation: realSuggestion.why,
    },
  ],
  UPLIFT_RULES,
);
ok(`★ a real reviewed rule (${realRule.id}) still resolves`, realAccept.ok);

const unreviewedReal = UPLIFT_RULES.find(r => !r.reviewedAt);
if (unreviewedReal) {
  const gated = resolveAcceptedSuggestions(
    [
      {
        ruleId: unreviewedReal.id,
        ruleName: unreviewedReal.name,
        ingredient: unreviewedReal.suggestions[0].ingredient,
        action: unreviewedReal.suggestions[0].action,
        explanation: unreviewedReal.suggestions[0].why,
      },
    ],
    UPLIFT_RULES,
  );
  assert(`★ the live unreviewed rule (${unreviewedReal.id}) is rejected`, gated.ok, false);
} else {
  console.log("  – no unreviewed rule in the live registry to gate (skipped)");
}

// ─── Result ────────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
