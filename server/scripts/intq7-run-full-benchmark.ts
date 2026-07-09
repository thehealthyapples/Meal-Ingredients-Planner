/**
 * INTQ7 — Execute the First THA Companion Intelligence Benchmark.
 * =================================================================
 * Runs the Full Benchmark (100 questions) against all ten Benchmark
 * Household World households (BW01-BW10), through the one Companion seam
 * only, saving one artefact per household into the canonical append-only
 * history. Mirrors POST /api/admin/benchmark-households/run-benchmark
 * exactly (server/routes.ts), run standalone (no HTTP/admin session needed).
 *
 * This script measures only: it does not change Companion behaviour,
 * benchmark scoring, or benchmark questions.
 */
import { storage } from "../storage.js";
import { benchmarkHouseholdIds, resolveBenchmarkOwner, resetBenchmarkHousehold } from "../benchmark/index.js";
import { runBenchmark, makeCompanionTurnRunner, saveRun } from "../tests/benchmark/index.js";
import { writeFileSync } from "node:fs";

async function main() {
  const mode = (process.env.INTQ7_MODE ?? "full") as "quick" | "full";
  const idsFilter = process.env.INTQ7_HOUSEHOLDS ? process.env.INTQ7_HOUSEHOLDS.split(",") : null;
  const ids = (idsFilter ?? benchmarkHouseholdIds()) as string[];
  const summaries: any[] = [];
  const startedAll = Date.now();
  console.log(`INTQ7 run: mode=${mode} households=${ids.join(",")}`);

  for (const id of ids) {
    console.log(`\n=== ${id} — resetting ===`);
    await resetBenchmarkHousehold(id);
    const owner = await resolveBenchmarkOwner(id);
    if (!owner) {
      console.error(`${id}: no owner resolved after reset — skipping`);
      continue;
    }
    const prefs = await storage.getUserPreferences(owner.id).catch(() => undefined);
    const personality = prefs?.companionPersonality ?? "default";
    console.log(`${id}: owner userId=${owner.id} personality=${personality} — running FULL (100 questions)`);

    const runTurn = makeCompanionTurnRunner(owner, personality);
    const startedOne = Date.now();
    const result = await runBenchmark({
      mode,
      runTurn,
      worldMode: "benchmark-world",
      householdLabel: id,
      baseline: null,
      onProgress: (done, total, qid) => {
        if (done % 10 === 0 || done === total) {
          process.stdout.write(`\r  ${id} ${done}/${total} (${qid})   `);
        }
      },
    });
    const elapsed = Math.round((Date.now() - startedOne) / 1000);
    const { jsonPath, reportPath } = saveRun(result);
    console.log(`\n  ${id}: headline=${result.headline.score} honestGap=${Math.round(result.headline.honestGapRate * 100)}% gates=${result.headline.gatesFired} verdict=${result.releaseReadiness.verdict} (${elapsed}s)`);
    console.log(`  artefact: ${jsonPath}`);

    summaries.push({
      householdId: id,
      ownerUserId: owner.id,
      username: owner.username,
      personality,
      runId: result.runId,
      jsonPath,
      reportPath,
      headline: result.headline,
      dimensions: result.dimensions,
      domains: result.domains,
      capabilities: result.capabilities,
      personalities: result.personalities,
      safety: result.safety,
      failedQuestions: result.failedQuestions,
      releaseReadiness: result.releaseReadiness,
      questions: result.questions,
      elapsedSeconds: elapsed,
    });
  }

  const totalElapsed = Math.round((Date.now() - startedAll) / 1000);
  console.log(`\n\nAll households complete in ${totalElapsed}s.`);

  const outPath = "/tmp/claude-1000/-home-runner-workspace/68fe126c-efe1-45c1-ba9c-a3cffa9820eb/scratchpad/intq7-run-summaries.json";
  writeFileSync(outPath, JSON.stringify(summaries, null, 2), "utf8");
  console.log(`Summary written to ${outPath}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("INTQ7 full benchmark run failed:", err);
  process.exit(1);
});
