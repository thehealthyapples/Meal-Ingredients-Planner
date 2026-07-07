/**
 * test-platform-turn-outcome-sink.ts — EWO-PRO1
 * ==============================================
 * Tests for the external-sink hook on the turn-outcome classification log.
 * No database required — the durable DB store itself is exercised via a stub
 * sink here; the DB wiring (registerDurableTurnOutcomeSink) is a one-line
 * fire-and-forget adapter over the same contract.
 *
 * Coverage:
 *   §1  The sink receives exactly the PII-scrubbed entry the ring buffer keeps
 *   §2  A throwing sink never breaks logging (turn isolation)
 *   §3  Unregistering the sink stops delivery; in-memory log unaffected
 *
 * Run: npx tsx server/tests/test-platform-turn-outcome-sink.ts
 */

import {
  logUnsuccessfulQuery,
  getUnsuccessfulQueryLog,
  resetUnsuccessfulQueryLog,
  setUnsuccessfulQuerySink,
  type UnsuccessfulQueryLogEntry,
} from "../intelligence/conversation/turn-fallback.js";

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
    console.log(`  ✗ ${label}`);
  }
}

function main(): void {
  // ── §1 Sink receives the scrubbed entry ────────────────────────────────────
  console.log("\n§1 Sink receives exactly the PII-scrubbed entry");
  resetUnsuccessfulQueryLog();
  const received: UnsuccessfulQueryLogEntry[] = [];
  setUnsuccessfulQuerySink((entry) => received.push(entry));

  logUnsuccessfulQuery({
    stage: "turn-fallback",
    state: "no-knowledge",
    surface: "nutrition",
    utterance: "x".repeat(500), // over the 200-char cap
    intents: [{ capability: "nutrition-knowledge", verb: "read", status: "no-knowledge" }],
  });

  assert(received.length === 1, "sink invoked once per logged entry");
  assert(received[0].utterance.length === 200, "sink receives the TRUNCATED utterance (same scrubbing as the ring buffer)");
  assert(received[0] === getUnsuccessfulQueryLog()[0], "sink receives the identical record object the ring buffer retains");
  assert(typeof received[0].timestamp === "string" && !Number.isNaN(Date.parse(received[0].timestamp)), "entry carries a valid ISO timestamp");
  const entryKeys = Object.keys(received[0]).sort();
  assert(
    !entryKeys.some((k) => /user|household|payload|result|parameter/i.test(k)),
    "entry shape carries no user, household, parameter, or result fields",
  );

  // ── §2 A throwing sink never breaks logging ────────────────────────────────
  console.log("\n§2 A throwing sink never breaks logging");
  resetUnsuccessfulQueryLog();
  setUnsuccessfulQuerySink(() => {
    throw new Error("database down");
  });
  let threw = false;
  try {
    logUnsuccessfulQuery({
      stage: "resolver-unmatched",
      surface: "planner",
      utterance: "what should we eat",
      intents: [],
    });
  } catch {
    threw = true;
  }
  assert(!threw, "logUnsuccessfulQuery does not throw when the sink throws");
  assert(getUnsuccessfulQueryLog().length === 1, "the in-memory ring buffer still recorded the entry");

  // ── §3 Unregistering stops delivery ────────────────────────────────────────
  console.log("\n§3 Unregistering the sink stops delivery");
  resetUnsuccessfulQueryLog();
  received.length = 0;
  setUnsuccessfulQuerySink(null);
  logUnsuccessfulQuery({
    stage: "turn-fallback",
    state: "no-route",
    surface: "meals",
    utterance: "gibberish",
    intents: [],
  });
  assert(received.length === 0, "no sink → no delivery");
  assert(getUnsuccessfulQueryLog().length === 1, "in-memory logging unaffected by sink absence");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n════════════════════════════════════════════════════`);
  console.log(`  EWO-PRO1 turn-outcome sink tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) console.log(`   ✗ ${f}`);
    process.exit(1);
  }
  console.log(`════════════════════════════════════════════════════\n`);
}

main();
