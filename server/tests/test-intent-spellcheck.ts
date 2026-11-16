/**
 * test-intent-spellcheck.ts — COMP_SC1 deterministic typo correction
 * ====================================================================
 * No database, no network. Run: npx tsx server/tests/test-intent-spellcheck.ts
 */
import { correctUtteranceForIntentMatching } from "../intelligence/intent-spellcheck.js";

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

function main(): void {
  // ── The exact reported typo ───────────────────────────────────────────────
  assert(
    correctUtteranceForIntentMatching("that will boot my immune system") === "that will boost my immune system",
    '"boot" is corrected to "boost" in context',
  );

  // ── Generalises to typos never hand-coded into any regex ─────────────────
  assert(
    /immune/.test(correctUtteranceForIntentMatching("foods that imune system")),
    '"imune" is corrected toward "immune"',
  );

  // ── Correctly-spelled words are left completely alone ────────────────────
  assert(
    correctUtteranceForIntentMatching("what foods help with sleep") === "what foods help with sleep",
    "an already-correct sentence is returned unchanged",
  );
  assert(
    correctUtteranceForIntentMatching("add chicken curry to Tuesday dinner") === "add chicken curry to Tuesday dinner",
    "an ordinary planner command (no vocabulary words) is untouched",
  );

  // ── Short words are never touched (avoids false positives like "egg") ────
  assert(
    correctUtteranceForIntentMatching("add egg and ham to lunch") === "add egg and ham to lunch",
    "words shorter than the minimum length are never corrected",
  );

  // ── Casing/punctuation of the rest of the sentence survives ───────────────
  const corrected = correctUtteranceForIntentMatching("Can you advise on a meal to have for breakfast that will boot my immune system?");
  assert(corrected.startsWith("Can you advise"), "leading casing of untouched words is preserved");
  assert(corrected.endsWith("system?"), "trailing punctuation is preserved");
  assert(/\bboost\b/.test(corrected), "the typo'd word is corrected inside the full sentence");

  console.log("\n══════════════════════════════════════════════════════");
  console.log("COMP_SC1 — Intent Spellcheck");
  console.log(`Passed: ${passed}  Failed: ${failed}`);
  if (failed > 0) {
    console.error("\nFailed assertions:");
    failures.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
  console.log("All tests passed ✓");
}

main();
