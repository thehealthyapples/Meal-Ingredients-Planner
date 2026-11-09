/**
 * test-uplift-provenance-classification.ts (Priority 5)
 * =======================================================
 * Pure unit test for classifyUpliftRuleRows (server/lib/uplift-provenance-
 * classification.ts) — the partition logic behind the `up-phantom-rules`
 * publication check. No live database; added per Codex review (2026-11-09)
 * of commit cd10e5d6, which found the classification behavior had no
 * deterministic regression assertion.
 *
 * Covers:
 *   1. An authored-only set of rows never violates.
 *   2. An acknowledged-legacy rule_id is reported in its own bucket — and
 *      STILL violates (the ledger must never clear the check).
 *   3. A not-acknowledged rule_id is reported in its own bucket and violates.
 *   4. Both buckets present simultaneously (the live Priority 5 scenario:
 *      fallback-deterministic-boosts ×8 acknowledged, test_rule_boundary ×7
 *      not acknowledged) — both counted, both bucketed, still violates.
 *   5. The detail text never calls the not-acknowledged bucket "unexamined"
 *      or implies no investigation occurred — Codex's P1 finding.
 *
 * Run with: npx tsx server/tests/test-uplift-provenance-classification.ts
 */

import { classifyUpliftRuleRows, type RuleIdCount } from "../lib/uplift-provenance-classification.js";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string): void {
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

const AUTHORED = new Set(["mac-cheese-turmeric-pepper", "salad-seeds-evoo-acv"]);
const ACKNOWLEDGED = new Set(["fallback-deterministic-boosts"]);

// ---------------------------------------------------------------------------
section("Case 1 — all rows authored: no violation");
// ---------------------------------------------------------------------------
{
  const rows: RuleIdCount[] = [{ rule_id: "mac-cheese-turmeric-pepper", n: 3 }];
  const result = classifyUpliftRuleRows(rows, AUTHORED, ACKNOWLEDGED);
  assert("violated is false", result.violated === false);
  assert("acknowledgedLegacy is empty", result.acknowledgedLegacy.length === 0);
  assert("notAcknowledged is empty", result.notAcknowledged.length === 0);
  assert("detail states all rows are owner-authored", result.detail.includes("owner-authored"));
}

// ---------------------------------------------------------------------------
section("Case 2 — an acknowledged-legacy rule_id: bucketed, but STILL violates");
// ---------------------------------------------------------------------------
{
  const rows: RuleIdCount[] = [{ rule_id: "fallback-deterministic-boosts", n: 8 }];
  const result = classifyUpliftRuleRows(rows, AUTHORED, ACKNOWLEDGED);
  assert("★ violated is TRUE despite the ledger match", result.violated === true);
  assert("acknowledgedLegacy carries the row", result.acknowledgedLegacy.length === 1);
  assert("acknowledgedLegacy row_id matches", result.acknowledgedLegacy[0]?.rule_id === "fallback-deterministic-boosts");
  assert("notAcknowledged is empty", result.notAcknowledged.length === 0);
  assert("detail names it OWNER-ACKNOWLEDGED", result.detail.includes("OWNER-ACKNOWLEDGED"));
}

// ---------------------------------------------------------------------------
section("Case 3 — a not-acknowledged rule_id: bucketed, violates");
// ---------------------------------------------------------------------------
{
  const rows: RuleIdCount[] = [{ rule_id: "test_rule_boundary", n: 7 }];
  const result = classifyUpliftRuleRows(rows, AUTHORED, ACKNOWLEDGED);
  assert("violated is true", result.violated === true);
  assert("notAcknowledged carries the row", result.notAcknowledged.length === 1);
  assert("acknowledgedLegacy is empty", result.acknowledgedLegacy.length === 0);
  assert(
    "★ detail does NOT label the bucket 'UNEXAMINED'",
    !/\bUNEXAMINED\b/.test(result.detail),
    result.detail,
  );
  assert("detail says NOT ACKNOWLEDGED", result.detail.includes("NOT ACKNOWLEDGED"));
  assert(
    "★ detail explicitly disclaims the 'no investigation occurred' reading",
    result.detail.includes("not a claim that it is uninvestigated"),
  );
}

// ---------------------------------------------------------------------------
section("Case 4 — both buckets simultaneously (the live Priority 5 scenario)");
// ---------------------------------------------------------------------------
{
  const rows: RuleIdCount[] = [
    { rule_id: "fallback-deterministic-boosts", n: 8 },
    { rule_id: "test_rule_boundary", n: 7 },
  ];
  const result = classifyUpliftRuleRows(rows, AUTHORED, ACKNOWLEDGED);
  assert("violated is true", result.violated === true);
  assert("acknowledgedLegacy has exactly 1 group", result.acknowledgedLegacy.length === 1);
  assert("notAcknowledged has exactly 1 group", result.notAcknowledged.length === 1);
  assert("detail mentions total of 15", result.detail.includes("15 application row(s)"));
  assert("detail mentions ×8", result.detail.includes("×8"));
  assert("detail mentions ×7", result.detail.includes("×7"));
}

// ---------------------------------------------------------------------------
section("Case 5 — a real UPLIFT_RULES row mixed with phantoms: only phantoms counted");
// ---------------------------------------------------------------------------
{
  const rows: RuleIdCount[] = [
    { rule_id: "mac-cheese-turmeric-pepper", n: 20 },
    { rule_id: "test_rule_boundary", n: 7 },
  ];
  const result = classifyUpliftRuleRows(rows, AUTHORED, ACKNOWLEDGED);
  assert("violated is true (one phantom is enough)", result.violated === true);
  assert("the authored row is excluded from both buckets", result.notAcknowledged.length === 1 && result.acknowledgedLegacy.length === 0);
  assert("detail's total excludes the 20 authored rows", result.detail.includes("7 application row(s)"));
}

console.log(`\n${"=".repeat(60)}`);
console.log(`Uplift provenance classification: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
