/**
 * index.ts — INTQ6 Benchmark Household World (public API)
 * ========================================================
 * The single import surface the admin routes consume. The world is DEV-only
 * operational infrastructure: canonical fixtures (world-fixtures.ts) plus the
 * deterministic seeder/reset (world-seeder.ts). It never touches production
 * (every seeder entry point asserts the environment) and never duplicates
 * Intelligence Platform functionality — benchmark execution stays in
 * server/tests/benchmark/ behind the one Companion seam.
 */

export {
  BENCHMARK_WORLD,
  BENCHMARK_WORLD_VERSION,
  getBenchmarkHouseholdFixture,
  benchmarkHouseholdIds,
  allBenchmarkUsernames,
  benchmarkAccountPassword,
  type BenchmarkHouseholdFixture,
} from "./world-fixtures.js";

export {
  benchmarkWorldAllowed,
  assertBenchmarkWorldAllowed,
  seedBenchmarkWorld,
  resetBenchmarkHousehold,
  listBenchmarkHouseholdStates,
  getBenchmarkHouseholdDetail,
  resolveBenchmarkOwner,
  type BenchmarkHouseholdState,
  type BenchmarkHouseholdDetail,
  type HouseholdResetResult,
} from "./world-seeder.js";
