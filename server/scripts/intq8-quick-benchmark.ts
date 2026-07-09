/**
 * INTQ8 — Quick Benchmark comparison harness.
 * ============================================
 * Runs the Quick Benchmark (10 questions, one per canonical domain) against the
 * Benchmark Household World, through the one Companion seam only, capturing
 * per-question detail for a before/after comparison. Unlike the INTQ7 full-run
 * script it does NOT call saveRun() — it never writes the append-only history;
 * it writes a single comparison artefact to the path given by INTQ8_OUT.
 *
 * Reuses the exact execution path the admin route uses (resetBenchmarkHousehold
 * → resolveBenchmarkOwner → makeCompanionTurnRunner → runBenchmark). Measures
 * only; changes no Companion behaviour, scoring, or questions.
 */
import { storage } from "../storage.js";
import { benchmarkHouseholdIds, resolveBenchmarkOwner, resetBenchmarkHousehold } from "../benchmark/index.js";
import { runBenchmark, makeCompanionTurnRunner } from "../tests/benchmark/index.js";
import { writeFileSync } from "node:fs";

async function main() {
  const idsFilter = process.env.INTQ8_HOUSEHOLDS ? process.env.INTQ8_HOUSEHOLDS.split(",") : null;
  const ids = (idsFilter ?? benchmarkHouseholdIds()) as string[];
  const out = process.env.INTQ8_OUT ?? "/tmp/intq8-quick.json";
  const households: any[] = [];
  const startedAll = Date.now();
  console.log(`INTQ8 quick run: households=${ids.join(",")}`);

  for (const id of ids) {
    await resetBenchmarkHousehold(id);
    const owner = await resolveBenchmarkOwner(id);
    if (!owner) { console.error(`${id}: no owner — skipping`); continue; }
    const prefs = await storage.getUserPreferences(owner.id).catch(() => undefined);
    const personality = prefs?.companionPersonality ?? "default";
    const runTurn = makeCompanionTurnRunner(owner, personality);
    const result = await runBenchmark({
      mode: "quick",
      runTurn,
      worldMode: "benchmark-world",
      householdLabel: id,
      baseline: null,
    });
    const questions = result.questions.map((q: any) => ({
      id: q.id,
      category: q.category,
      capability: q.capability,
      capabilityFamily: q.capabilityFamily,
      composite: q.composite,
      rawComposite: q.rawComposite,
      gate: q.gate,
      reachedCapability: q.reachedCapability,
      fallbackState: q.fallbackState,
      correctAnswerType: q.correctAnswerType,
      bands: Object.fromEntries(Object.entries(q.bands).map(([k, v]: any) => [k, v.band])),
      preview: q.responsePreview?.slice(0, 120),
    }));
    console.log(`  ${id}: headline=${result.headline.score} gates=${result.headline.gatesFired} verdict=${result.releaseReadiness.verdict}`);
    households.push({
      householdId: id,
      personality,
      headline: result.headline,
      dimensions: result.dimensions,
      domains: result.domains,
      questions,
    });
  }

  const pooledScore =
    households.reduce((s, h) => s + h.headline.score, 0) / (households.length || 1);
  const artefact = {
    generatedAt: new Date().toISOString(),
    mode: "quick",
    households,
    pooledHeadline: Math.round(pooledScore * 10) / 10,
    pooledGatesFired: households.reduce((s, h) => s + h.headline.gatesFired, 0),
  };
  writeFileSync(out, JSON.stringify(artefact, null, 2), "utf8");
  console.log(`\nPooled headline=${artefact.pooledHeadline} gates=${artefact.pooledGatesFired} in ${Math.round((Date.now() - startedAll) / 1000)}s`);
  console.log(`Written to ${out}`);
  process.exit(0);
}

main().catch((err) => { console.error("INTQ8 quick run failed:", err); process.exit(1); });
