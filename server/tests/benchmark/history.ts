/**
 * history.ts — INTQ4 append-only run history (AUTOMATION §4)
 * ==========================================================
 * Scored artefacts are appended, never edited, under
 * docs/intelligence/benchmark/history/ — `<runId>.json` (machine) and
 * `<runId>.report.md` (human) — plus a lightweight `index.json` for the trend and
 * baseline selection. An immutable, versioned trail is the whole point.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { HISTORY_DIR, RUBRIC_VERSION, bundleVersionLabel } from "./bundle.js";
import type { BenchmarkResult, HistoryIndexEntry } from "./types.js";
import { renderReport } from "./report.js";

const INDEX_PATH = resolve(HISTORY_DIR, "index.json");

function ensureDir(): void {
  if (!existsSync(HISTORY_DIR)) mkdirSync(HISTORY_DIR, { recursive: true });
}

/** Sanitise a runId into a filesystem-safe basename. */
function safeName(runId: string): string {
  return runId.replace(/[^A-Za-z0-9._-]/g, "_");
}

export function readIndex(): HistoryIndexEntry[] {
  if (!existsSync(INDEX_PATH)) return [];
  try {
    return JSON.parse(readFileSync(INDEX_PATH, "utf8")) as HistoryIndexEntry[];
  } catch {
    return [];
  }
}

function writeIndex(entries: HistoryIndexEntry[]): void {
  writeFileSync(INDEX_PATH, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

function indexEntry(result: BenchmarkResult): HistoryIndexEntry {
  return {
    runId: result.runId,
    mode: result.mode,
    status: result.status,
    executedAt: result.subject.executedAt,
    commit: result.subject.commit,
    branch: result.subject.branch,
    bundleVersion: bundleVersionLabel(result.bundle),
    rubricVersion: result.bundle.rubric,
    headlineScore: result.headline.score,
    honestGapRate: result.headline.honestGapRate,
    gatesFired: result.headline.gatesFired,
    routingGatesFired: result.headline.routingGatesFired,
    intentResolutionAccuracy: result.headline.intentResolutionAccuracy,
    verdict: result.releaseReadiness.verdict,
  };
}

/** MAJOR component of a `vX.Y.Z` (or `X.Y.Z`) version string. */
function major(version: string | undefined): string | null {
  if (!version) return null;
  return version.split(".")[0];
}

/** Persist a run: result.json + report.md + index row. Returns the file paths. */
export function saveRun(result: BenchmarkResult): { jsonPath: string; reportPath: string } {
  ensureDir();
  const base = safeName(result.runId);
  const jsonPath = resolve(HISTORY_DIR, `${base}.json`);
  const reportPath = resolve(HISTORY_DIR, `${base}.report.md`);
  writeFileSync(jsonPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  writeFileSync(reportPath, renderReport(result), "utf8");

  const index = readIndex().filter((e) => e.runId !== result.runId);
  index.push(indexEntry(result));
  index.sort((a, b) => b.executedAt.localeCompare(a.executedAt));
  writeIndex(index);
  return { jsonPath, reportPath };
}

export function loadRun(runId: string): BenchmarkResult | null {
  const path = resolve(HISTORY_DIR, `${safeName(runId)}.json`);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as BenchmarkResult;
  } catch {
    return null;
  }
}

export function loadReport(runId: string): string | null {
  const path = resolve(HISTORY_DIR, `${safeName(runId)}.report.md`);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

export function listRuns(): HistoryIndexEntry[] {
  return readIndex();
}

/**
 * Baseline selection (AUTOMATION §4): the most recent SCORED run at a comparable
 * bundle version. INTQ4 compared within the same questions-version MAJOR.
 *
 * BENCH2 adds the rubric MAJOR to the comparability key. README §4 states that a changed
 * dimension set, weight or gate makes scores "not comparable across the boundary" and must be
 * "reported as a re-baseline, never as a regression/improvement delta." The questions-version
 * MAJOR alone could not express that: BENCH2 changes no question, so every pre-BENCH2 run would
 * still have matched, and the first hardened run would have reported its (correct, much lower)
 * score as a catastrophic regression against a baseline that was never measuring routing at all.
 *
 * Index rows written before BENCH2 carry no `rubricVersion`; they therefore never match the v2
 * rubric and are correctly excluded. `rebuildIndex()` recovers the field from each stored
 * artefact's own `bundle.rubric`, so history is never rewritten to claim a rubric it did not run.
 */
export function selectBaseline(bundleVersion: string, excludeRunId?: string): BenchmarkResult | null {
  const questionsMajor = major(bundleVersion);
  const rubricMajor = major(RUBRIC_VERSION);
  const candidates = readIndex()
    .filter(
      (e) =>
        e.status === "scored" &&
        e.runId !== excludeRunId &&
        major(e.bundleVersion) === questionsMajor &&
        major(e.rubricVersion) === rubricMajor,
    )
    .sort((a, b) => b.executedAt.localeCompare(a.executedAt));
  for (const c of candidates) {
    const run = loadRun(c.runId);
    if (run) return run;
  }
  return null;
}

/** Recover from a partially-written history dir by rebuilding the index from files. */
export function rebuildIndex(): HistoryIndexEntry[] {
  ensureDir();
  const entries: HistoryIndexEntry[] = [];
  for (const file of readdirSync(HISTORY_DIR)) {
    if (!file.endsWith(".json") || file === "index.json") continue;
    try {
      const run = JSON.parse(readFileSync(resolve(HISTORY_DIR, file), "utf8")) as BenchmarkResult;
      entries.push(indexEntry(run));
    } catch { /* skip unreadable artefact */ }
  }
  entries.sort((a, b) => b.executedAt.localeCompare(a.executedAt));
  writeIndex(entries);
  return entries;
}
