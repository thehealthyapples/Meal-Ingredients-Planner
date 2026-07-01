/**
 * test-intelligence-read-kit.ts (INT6B)
 * ======================================
 * Verifies the shared Read Binding Kit — the common infrastructure extracted in
 * INT6B from the three read-only handlers (Planner, Shopping, Nutrition / Knowledge).
 *
 * The kit contains NO business logic and NO domain knowledge. These tests verify
 * only its plumbing: parameter coercion, auth guard, honest-failure helpers, and
 * the read-only verb guard. They do not test any capability handler or business owner.
 *
 * Run with: npx tsx server/tests/test-intelligence-read-kit.ts
 */

import { toInt, requireUserId, gap, denied, readOnlyVerbGuard } from "../intelligence/index.js";
import { CapabilityExecutionError, type IntelligenceContext, type Intent } from "../intelligence/index.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// toInt
// ---------------------------------------------------------------------------

section("toInt — parameter coercion");

assert(toInt(1) === 1, "integer 1 → 1");
assert(toInt(42) === 42, "integer 42 → 42");
assert(toInt(0) === 0, "integer 0 → 0");
assert(toInt("5") === 5, 'string "5" → 5');
assert(toInt("  7  ") === 7, 'string "  7  " (trimmed) → 7');
assert(toInt("123") === 123, 'string "123" → 123');
assert(toInt(undefined) === undefined, "undefined → undefined");
assert(toInt(null) === undefined, "null → undefined");
assert(toInt("") === undefined, 'empty string → undefined');
assert(toInt("abc") === undefined, '"abc" → undefined');
assert(toInt("1.5") === undefined, '"1.5" (not integer string) → undefined');
assert(toInt(1.5) === undefined, "1.5 (float) → undefined");
assert(toInt(-1) === -1, "-1 (negative integer number) → -1 (numeric integers accepted as-is)");
assert(toInt("-5") === undefined, '"-5" (negative string) → undefined (regex rejects non-digit strings)');
assert(toInt({}) === undefined, "object → undefined");
assert(toInt([]) === undefined, "array → undefined");

// ---------------------------------------------------------------------------
// gap and denied helpers
// ---------------------------------------------------------------------------

section("gap — honest gap error constructor");

const g = gap("no answer for this");
assert(g instanceof CapabilityExecutionError, "gap() returns a CapabilityExecutionError");
assert(g instanceof Error, "gap() instance is an Error");
assert(g.failureStatus === "gap", 'gap().failureStatus === "gap"');
assert(g.message === "no answer for this", "gap() preserves message");
assert(g.verb === undefined, "gap() carries no verb (plain gap helper)");

section("denied — honest denied error constructor");

const d = denied("ownership check failed");
assert(d instanceof CapabilityExecutionError, "denied() returns a CapabilityExecutionError");
assert(d.failureStatus === "denied", 'denied().failureStatus === "denied"');
assert(d.message === "ownership check failed", "denied() preserves message");
assert(d.verb === undefined, "denied() carries no verb");

// ---------------------------------------------------------------------------
// requireUserId
// ---------------------------------------------------------------------------

section("requireUserId — authentication guard");

const anonCtx: IntelligenceContext = { role: "user", userId: undefined };
const numericCtx: IntelligenceContext = { role: "user", userId: "42" };
const badCtx: IntelligenceContext = { role: "user", userId: "not-a-number" };
const floatCtx: IntelligenceContext = { role: "user", userId: "3.14" };

assert(requireUserId(numericCtx, "Planner") === 42, 'userId "42" → 42');
assert(requireUserId({ role: "user", userId: "1" }, "Shopping") === 1, 'userId "1" → 1');

let caughtAnon: CapabilityExecutionError | undefined;
try { requireUserId(anonCtx, "Planner"); } catch (e) { caughtAnon = e as CapabilityExecutionError; }
assert(caughtAnon instanceof CapabilityExecutionError, "anonymous context → throws CapabilityExecutionError");
assert(caughtAnon?.failureStatus === "denied", "anonymous context → denied status");
assert(caughtAnon?.message.includes("Planner") ?? false, "denial message includes capability name");
assert(caughtAnon?.message.includes("authenticated user") ?? false, "denial message states auth requirement");

let caughtBad: CapabilityExecutionError | undefined;
try { requireUserId(badCtx, "Shopping"); } catch (e) { caughtBad = e as CapabilityExecutionError; }
assert(caughtBad?.failureStatus === "denied", "non-integer userId → denied");
assert(caughtBad?.message.includes("Shopping") ?? false, "denial message includes Shopping capability name");

let caughtFloat: CapabilityExecutionError | undefined;
try { requireUserId(floatCtx, "Planner"); } catch (e) { caughtFloat = e as CapabilityExecutionError; }
assert(caughtFloat?.failureStatus === "denied", 'float userId "3.14" → denied');

// Capability name appears in both the start and the lowercase reference.
const plannerDenial = (() => {
  try { requireUserId(anonCtx, "Planner"); return ""; }
  catch (e) { return (e as CapabilityExecutionError).message; }
})();
assert(plannerDenial.startsWith("Planner access"), "denial message starts with capability name");
assert(plannerDenial.toLowerCase().includes("planner access"), "lowercase occurrence present");

// ---------------------------------------------------------------------------
// readOnlyVerbGuard
// ---------------------------------------------------------------------------

section("readOnlyVerbGuard — read-only verb enforcement");

function makeIntent(verb: string, capabilityId = "planner"): Intent {
  return { verb: verb as Intent["verb"], capabilityId };
}

// Executable verbs → no throw.
let noThrow = true;
try { readOnlyVerbGuard(makeIntent("read"), ["read", "explain"], "Planner"); }
catch { noThrow = false; }
assert(noThrow, '"read" in ["read", "explain"] → no throw');

noThrow = true;
try { readOnlyVerbGuard(makeIntent("explain"), ["read", "explain"], "Planner"); }
catch { noThrow = false; }
assert(noThrow, '"explain" in ["read", "explain"] → no throw');

noThrow = true;
try { readOnlyVerbGuard(makeIntent("search"), ["read", "search", "explain"], "NutritionKnowledge"); }
catch { noThrow = false; }
assert(noThrow, '"search" in ["read", "search", "explain"] → no throw');

// Non-executable verbs → throw gap.
let caughtVerb: CapabilityExecutionError | undefined;
try { readOnlyVerbGuard(makeIntent("add"), ["read", "explain"], "Planner"); }
catch (e) { caughtVerb = e as CapabilityExecutionError; }
assert(caughtVerb instanceof CapabilityExecutionError, '"add" not in ["read","explain"] → throws CapabilityExecutionError');
assert(caughtVerb?.failureStatus === "gap", 'non-executable verb → gap status');
assert(caughtVerb?.verb === "add", "error carries the attempted verb");
assert(caughtVerb?.message.includes("Planner") ?? false, "gap message includes capability name");
assert(caughtVerb?.message.includes("add") ?? false, 'gap message references the unexecutable verb "add"');

let caughtDelete: CapabilityExecutionError | undefined;
try { readOnlyVerbGuard(makeIntent("delete"), ["read", "explain"], "Shopping"); }
catch (e) { caughtDelete = e as CapabilityExecutionError; }
assert(caughtDelete?.failureStatus === "gap", '"delete" → gap for Shopping read-only binding');
assert(caughtDelete?.verb === "delete", "delete error carries the verb");
assert(caughtDelete?.message.includes("Shopping") ?? false, "Shopping appears in gap message");

let caughtGenerate: CapabilityExecutionError | undefined;
try { readOnlyVerbGuard(makeIntent("generate"), ["read", "explain"], "Planner"); }
catch (e) { caughtGenerate = e as CapabilityExecutionError; }
assert(caughtGenerate?.failureStatus === "gap", '"generate" → gap');
assert(caughtGenerate?.verb === "generate", "generate error carries the verb");

// Edge: empty executable list — every verb is a gap.
let caughtAll: CapabilityExecutionError | undefined;
try { readOnlyVerbGuard(makeIntent("read"), [], "EmptyCapability"); }
catch (e) { caughtAll = e as CapabilityExecutionError; }
assert(caughtAll?.failureStatus === "gap", "empty executableVerbs → every verb is a gap");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${"=".repeat(60)}`);
console.log(`INT6B Read Binding Kit: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
