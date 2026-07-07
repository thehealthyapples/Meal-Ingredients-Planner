/**
 * test-platform-resilience.ts — EWO-PRO1
 * =======================================
 * Tests for the platform's shared resilience primitives.
 * No database, no network, no API keys required (all operations are stubs).
 *
 * Coverage:
 *   §1  withTimeout — completes inside the budget, TimeoutError outside it
 *   §2  executeWithResilience — success and failure accounting
 *   §3  Retry — retries transient failures, then succeeds
 *   §4  Circuit breaker — opens after threshold, refuses fast, recovers via half-open
 *   §5  Health report — operational facts only, sorted, resettable
 *
 * Run: npx tsx server/tests/test-platform-resilience.ts
 */

import {
  withTimeout,
  executeWithResilience,
  getDependencyHealthReport,
  resetDependencyHealth,
  TimeoutError,
  DependencyUnavailableError,
} from "../lib/platform-resilience.js";

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<void> {
  // ── §1 withTimeout ─────────────────────────────────────────────────────────
  console.log("\n§1 withTimeout");
  {
    const result = await withTimeout("fast-dep", 200, async () => "done");
    assert(result === "done", "operation inside the budget resolves normally");
  }
  {
    let caught: unknown;
    try {
      await withTimeout("slow-dep", 30, () => sleep(200).then(() => "late"));
    } catch (err) {
      caught = err;
    }
    assert(caught instanceof TimeoutError, "operation outside the budget throws TimeoutError");
    assert(
      caught instanceof Error && caught.message.includes("slow-dep"),
      "TimeoutError names the dependency",
    );
  }

  // ── §2 executeWithResilience accounting ───────────────────────────────────
  console.log("\n§2 executeWithResilience — success and failure accounting");
  resetDependencyHealth();
  {
    const value = await executeWithResilience("acc-dep", async () => 42);
    assert(value === 42, "successful call returns the operation's value");
    let caught: unknown;
    try {
      await executeWithResilience("acc-dep", async () => {
        throw new Error("upstream 500");
      });
    } catch (err) {
      caught = err;
    }
    assert(caught instanceof Error && caught.message === "upstream 500", "failure propagates the original error");

    const report = getDependencyHealthReport();
    const dep = report.find((d) => d.name === "acc-dep");
    assert(dep !== undefined, "dependency appears in the health report");
    assert(dep?.totalCalls === 2, "totalCalls counts both attempts");
    assert(dep?.totalFailures === 1, "totalFailures counts the failure");
    assert(dep?.lastError === "upstream 500", "lastError records the message only");
    assert(dep?.lastSuccessAt !== null && dep?.lastFailureAt !== null, "success and failure timestamps recorded");
    assert(dep?.circuitState === "closed", "one failure does not open the circuit");
  }

  // ── §3 Retry ───────────────────────────────────────────────────────────────
  console.log("\n§3 Retry — transient failure then success");
  resetDependencyHealth();
  {
    let attempts = 0;
    const value = await executeWithResilience(
      "flaky-dep",
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("transient");
        return "recovered";
      },
      { retries: 3, retryDelayMs: 5 },
    );
    assert(value === "recovered", "retry recovers from transient failures");
    assert(attempts === 3, "operation ran exactly 3 times (2 failures + 1 success)");
    const dep = getDependencyHealthReport().find((d) => d.name === "flaky-dep");
    assert(dep?.totalCalls === 3 && dep?.totalFailures === 2, "every attempt is accounted for");
    assert(dep?.consecutiveFailures === 0, "success resets consecutive failures");
  }

  // ── §4 Circuit breaker ─────────────────────────────────────────────────────
  console.log("\n§4 Circuit breaker — open, refuse, half-open, recover");
  resetDependencyHealth();
  {
    const opts = { circuitOpenThreshold: 3, circuitCooldownMs: 80 };
    const failing = async () => {
      throw new Error("dead upstream");
    };

    for (let i = 0; i < 3; i++) {
      try {
        await executeWithResilience("dead-dep", failing, opts);
      } catch {
        /* expected */
      }
    }
    let dep = getDependencyHealthReport().find((d) => d.name === "dead-dep");
    assert(dep?.circuitState === "open", "circuit opens after threshold consecutive failures");

    let refused: unknown;
    try {
      await executeWithResilience("dead-dep", async () => "should not run", opts);
    } catch (err) {
      refused = err;
    }
    assert(refused instanceof DependencyUnavailableError, "open circuit refuses immediately with DependencyUnavailableError");
    dep = getDependencyHealthReport().find((d) => d.name === "dead-dep");
    assert(dep?.totalRefused === 1, "refused calls are counted, not executed");

    await sleep(100); // let the cooldown elapse

    // Half-open probe that fails re-opens the circuit.
    try {
      await executeWithResilience("dead-dep", failing, opts);
    } catch {
      /* expected */
    }
    dep = getDependencyHealthReport().find((d) => d.name === "dead-dep");
    assert(dep?.circuitState === "open", "failed half-open probe re-opens the circuit");

    await sleep(100);

    // Half-open probe that succeeds closes the circuit.
    const value = await executeWithResilience("dead-dep", async () => "alive again", opts);
    assert(value === "alive again", "successful half-open probe returns the value");
    dep = getDependencyHealthReport().find((d) => d.name === "dead-dep");
    assert(dep?.circuitState === "closed", "successful probe closes the circuit");
    assert(dep?.consecutiveFailures === 0, "recovery resets consecutive failures");
  }

  // ── §5 Health report hygiene ───────────────────────────────────────────────
  console.log("\n§5 Health report — operational facts only");
  resetDependencyHealth();
  {
    await executeWithResilience("b-dep", async () => 1);
    await executeWithResilience("a-dep", async () => 1);
    const report = getDependencyHealthReport();
    assert(report.length === 2, "report contains exactly the called dependencies");
    assert(report[0].name === "a-dep" && report[1].name === "b-dep", "report is sorted by name");
    const keys = Object.keys(report[0]).sort();
    assert(
      !keys.some((k) => /payload|body|request|user/i.test(k)),
      "report shape carries no payload or user fields",
    );
    resetDependencyHealth();
    assert(getDependencyHealthReport().length === 0, "resetDependencyHealth clears all accounting");
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n════════════════════════════════════════════════════`);
  console.log(`  EWO-PRO1 resilience tests: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) console.log(`   ✗ ${f}`);
    process.exit(1);
  }
  console.log(`════════════════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("Test run crashed:", err);
  process.exit(1);
});
