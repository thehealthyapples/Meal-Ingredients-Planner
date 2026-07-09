/**
 * run-benchmark.ts — INTQ4 CLI runner (AUTOMATION §2)
 * ====================================================
 * The single deterministic entry point, matching the repo's existing test
 * convention. Implements EXECUTION_PROCESS steps 0–6 for on-demand / scheduled use:
 * resolve bundle → execute each question through the one seam → score → aggregate →
 * compare → emit result.json + report.md to history.
 *
 * Usage:
 *   BENCHMARK_MODE=quick BENCHMARK_USER_ID=1 tsx server/tests/benchmark/run-benchmark.ts
 *   npm run test:companion-benchmark -- --mode=full --user=1
 *
 * Modes: quick (10, one per domain) · full (100) · certification (framework only).
 * The acting user supplies the live household world (single-world mode); seeding the
 * six deterministic households is the certification precondition, framework-only here.
 */

import { storage } from "../../storage.js";
import { runBenchmark } from "./runner.js";
import { makeCompanionTurnRunner } from "./companion-turn.js";
import { saveRun, selectBaseline } from "./history.js";
import { resolveBundle, bundleVersionLabel } from "./bundle.js";
import type { BenchmarkMode } from "./types.js";

function arg(name: string, envKey: string, fallback: string): string {
  const flag = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (flag) return flag.split("=")[1];
  return process.env[envKey] ?? fallback;
}

async function main(): Promise<void> {
  const mode = arg("mode", "BENCHMARK_MODE", "quick") as BenchmarkMode;
  if (!["quick", "full", "certification"].includes(mode)) {
    console.error(`Unknown mode "${mode}". Use quick | full | certification.`);
    process.exit(2);
  }

  console.log(`\n── THA Companion Benchmark — ${mode} ──────────────────────────`);

  if (mode === "certification") {
    const result = await runBenchmark({ mode, runTurn: async () => { throw new Error("unreachable"); } });
    const { jsonPath, reportPath } = saveRun(result);
    console.log(`Certification is framework-only. Artefact: ${jsonPath}\nReport: ${reportPath}`);
    return;
  }

  const userId = Number(arg("user", "BENCHMARK_USER_ID", "1"));
  const user = await storage.getUser(userId);
  if (!user) {
    console.error(`No user with id ${userId}. Set --user=<id> or BENCHMARK_USER_ID.`);
    process.exit(2);
  }

  const prefs = await storage.getUserPreferences(userId).catch(() => undefined);
  const personality = prefs?.companionPersonality ?? "default";

  const bundle = resolveBundle();
  const baseline = selectBaseline(bundleVersionLabel(bundle));
  const runTurn = makeCompanionTurnRunner(user, personality);

  const result = await runBenchmark({
    mode,
    runTurn,
    worldMode: "single-world",
    householdLabel: `user-${userId}`,
    baseline,
    onProgress: (done, total, id) => process.stdout.write(`\r  ${done}/${total}  ${id.padEnd(8)}`),
  });

  const { jsonPath, reportPath } = saveRun(result);
  console.log(`\n\nOverall Intelligence Score: ${result.headline.score}/100  ·  ${result.releaseReadiness.verdict}`);
  console.log(`Hard safety gates: ${result.headline.gatesFired}  ·  Routing gates: ${result.headline.routingGatesFired}  ·  Honest-gap rate: ${Math.round(result.headline.honestGapRate * 100)}%`);
  console.log(
    `Routing: reach ${Math.round(result.headline.capabilityReach * 100)}%  ·  ` +
    `intent accuracy ${Math.round(result.headline.intentResolutionAccuracy * 100)}%  ·  ` +
    `${result.routing.capabilityMisses} capability miss(es), ${result.routing.misroutes} misroute(s), ` +
    `${result.routing.unreachableCapabilityCount} unreachable capability/ies`,
  );
  console.log(`Hallucination rate: ${Math.round(result.headline.hallucinationRate * 100)}%`);
  const u = result.capabilityUtilisation;
  console.log(
    u.probeActive
      ? `Capabilities: ${u.totalInvocations} invocation(s)  ·  ${Math.round(u.utilisationPct * 100)}% utilisation  ·  ` +
        `${u.neverExercisedCount} never exercised  ·  ${u.bypassedDefect} question(s) bypassed a registered capability`
      : `Capabilities: NOT OBSERVED (no probe installed) — utilisation is unmeasured, not zero`,
  );
  console.log(`Artefact: ${jsonPath}`);
  console.log(`Report:   ${reportPath}`);

  // CI gate (AUTOMATION §4). BENCH2 adds two non-negotiable failure conditions beyond the
  // hard safety gates: a capability miss (the platform could not reach a capability it
  // advertises) and a run executed with no LLM provider (which measures nothing at all).
  const hardFired = ["G1", "G2", "G3", "G4"].some((g) => (result.safety as any)[g].length > 0);
  if (hardFired) {
    console.error("\nCI GATE: a hard safety gate fired — failing.");
    process.exit(1);
  }
  if (!result.environment.llmProviderAvailable) {
    console.error("\nCI GATE: no LLM provider configured — the run measures nothing. Failing.");
    process.exit(1);
  }
  if (result.routing.capabilityMisses > 0) {
    console.error(
      `\nCI GATE: R1 fired on ${result.routing.capabilityMisses} question(s) — a registered, executable ` +
      `capability was never invoked. See the Routing Failure Report. Failing.`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Benchmark run failed:", err);
  process.exit(1);
});
