/**
 * index.ts — INTQ4 Intelligence Benchmark Execution Platform (public API)
 * =======================================================================
 * The single import surface the admin API and CLI consume. Re-exports the engine,
 * history store, report renderer, and the one-seam adapter. Keeping this the only
 * public entry point makes the framework's core invariant auditable in one place:
 * the ONLY module here that imports the Companion is companion-turn.ts.
 */

export * from "./types.js";
export { runBenchmark, type RunOptions, type TurnRunner } from "./runner.js";
export { makeCompanionTurnRunner, type BenchmarkTurnRunner } from "./companion-turn.js";
export {
  installCapabilityProbe, isCapabilityProbeInstalled,
  type CapabilityProbeHandle,
} from "./capability-probe.js";
export { saveRun, loadRun, loadReport, listRuns, selectBaseline, rebuildIndex, readIndex } from "./history.js";
export { renderReport } from "./report.js";
export { resolveBundle, resolveProvenance, bundleVersionLabel, loadQuestionsFixture } from "./bundle.js";
export {
  deriveExpectation, capabilityFamily, isRegistryCapability,
  resolveCapabilityStatus, registryExecutableCapabilityIds,
  type ExpectationRecord,
} from "./expectations.js";
export {
  scoreDeterministic, classifyRouting, applyGateCaps, statesALimitation,
  R1_CAPABILITY_MISS_CAP, R2_MISROUTE_CAP, type CapturedTurn,
} from "./scorer.js";
export {
  routingPanel, coveragePanel, coverageByDomain, routingFailureReport,
  qualityPanel, hallucinationPanel, capabilityUtilisationPanel,
  releaseReadiness, failedQuestionIds,
  PASS_THRESHOLD, INTENT_ACCURACY_FLOOR, CAPABILITY_REACH_FLOOR,
} from "./aggregate.js";
export { resolveJudge, disabledJudge, type JudgeClient } from "./judge.js";
