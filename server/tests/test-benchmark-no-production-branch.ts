/**
 * test-benchmark-no-production-branch.ts — BENCHINT2
 * ===================================================
 * Protects the single most important thing the BENCHINT1 audit confirmed (§6, D13):
 *
 *   **The platform contains no benchmark-aware behaviour.**
 *
 * The Companion Benchmark is only worth its score if the thing it measures is the thing that
 * ships. The moment production code can ask "am I being benchmarked?", every number the harness
 * has ever produced becomes a claim about a mode users never enter. That failure is silent — it
 * cannot be caught by any assertion the benchmark itself makes, because the benchmark would be
 * measuring the branch it accidentally created.
 *
 * So this test reads the production source and asserts the branch does not exist. It scans:
 *
 *   - `server/intelligence/**`  — the Companion runtime, engines, registry, capability bindings
 *   - `server/services/**`      — the business services those bindings call
 *
 * and fails on any executable reference to the benchmark, to impersonation, or to a mode flag.
 *
 * ── WHY IT SCANS TEXT RATHER THAN BEHAVIOUR ─────────────────────────────────────────────────
 * A behavioural test can only prove the branches it thinks to exercise. This invariant is about
 * branches nobody thought of. Reading the source is the only check whose failure mode is a false
 * ALARM (a new allow-listed token) rather than a false ALL-CLEAR (an unexercised branch).
 *
 * ── WHAT IS ALLOWED, AND WHY ────────────────────────────────────────────────────────────────
 * Comments may discuss the benchmark freely. Several production files cite benchmark measurement
 * as the *motivation* for an unconditional behaviour — that is documentation of why the code is
 * the shape it is, and it changes nothing at runtime. Stripping comments before scanning is what
 * lets a developer explain themselves without tripping this gate.
 *
 * The Observation Engine's `"benchmark-run"` observation KIND is allowed, and is not a branch on
 * being benchmarked. It is one of ~30 kinds in a closed vocabulary, recorded by the benchmark
 * runner about ITSELF after a run completes, and read back by the admin dashboard. Code that
 * routes on that kind (`execution-timeline.ts` excludes it from conversation timelines) is
 * classifying a stored row, not altering how a user's turn is answered. The distinction that
 * matters: nothing here is reachable from `processUserTurn`.
 *
 *   npm run test:benchmark-no-production-branch
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** The trees that must never learn they are being measured. */
const SCANNED_TREES = ["server/intelligence", "server/services"];

/**
 * Executable tokens that would mean production knows about the benchmark.
 *
 * `impersonat` is included because benchmark-world runs swap the acting user via `req.login`
 * (`routes.ts`, DEV-only, admin-gated). That swap is an ordinary session change: no handler may
 * branch on it. If an impersonation flag ever reaches the Intelligence Platform, the acting user
 * is no longer indistinguishable from a real one, and the benchmark stops measuring production.
 */
const FORBIDDEN = /benchmark|impersonat/i;

/**
 * Exact source substrings that carry a forbidden token but are NOT a benchmark-aware branch.
 * Each is removed from a line before that line is scanned, so an entry can never mask a genuine
 * branch that happens to sit on the same line — only the token itself is elided, not the line.
 *
 * Keep this list SHORT and keep it EXACT. A new entry is a governance decision: it says "this
 * production code names the benchmark and that is correct". If you find yourself adding a
 * conditional here, the test is doing its job and the answer is to remove the conditional.
 */
const ALLOWED_TOKENS: readonly string[] = [
  // The Observation Engine's closed observation-kind vocabulary, and routing on that stored kind.
  '"benchmark-run"',
  "'benchmark-run'",
  // The admin dashboard's human label + rollup for those stored observations.
  '"Benchmark run"',
  "summarizeBenchmarks",
  "benchmarkRows",
];

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

function listTypeScriptFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listTypeScriptFiles(full));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Strip comments so that prose about the benchmark never trips the scan, while leaving every
 * executable character on its own line and at its own line number.
 *
 * This is a deliberate approximation, and its bias is the safe one. It does not parse TypeScript,
 * so a `//` inside a string literal (a URL) truncates the rest of that line. That can only ever
 * cause the scanner to see LESS text — never to invent a token — and a forbidden token hidden
 * behind a URL on the same line is not a shape this codebase produces. Conversely, no comment can
 * survive to be scanned, which is the property the allow-list depends on.
 */
function stripComments(source: string): string[] {
  const lines = source.split("\n");
  const out: string[] = [];
  let inBlock = false;

  for (const raw of lines) {
    let line = raw;
    let result = "";
    let i = 0;

    while (i < line.length) {
      if (inBlock) {
        const end = line.indexOf("*/", i);
        if (end === -1) { i = line.length; break; }
        inBlock = false;
        i = end + 2;
        continue;
      }
      if (line.startsWith("//", i)) break;              // line comment — discard the remainder
      if (line.startsWith("/*", i)) { inBlock = true; i += 2; continue; }
      result += line[i];
      i++;
    }
    out.push(result);
  }
  return out;
}

/** Remove every allow-listed token from a line, leaving any other forbidden token exposed. */
function elideAllowed(line: string): string {
  let out = line;
  for (const token of ALLOWED_TOKENS) out = out.split(token).join("");
  return out;
}

// ---------------------------------------------------------------------------
// The scan
// ---------------------------------------------------------------------------

interface Violation {
  readonly file: string;
  readonly line: number;
  readonly text: string;
}

function scan(): { violations: Violation[]; filesScanned: number; allowedHits: number } {
  const violations: Violation[] = [];
  let filesScanned = 0;
  let allowedHits = 0;

  for (const tree of SCANNED_TREES) {
    for (const file of listTypeScriptFiles(join(REPO_ROOT, tree))) {
      filesScanned++;
      const lines = stripComments(readFileSync(file, "utf-8"));
      lines.forEach((line, idx) => {
        if (!FORBIDDEN.test(line)) return;
        const elided = elideAllowed(line);
        if (!FORBIDDEN.test(elided)) { allowedHits++; return; }
        violations.push({ file: relative(REPO_ROOT, file), line: idx + 1, text: line.trim() });
      });
    }
  }
  return { violations, filesScanned, allowedHits };
}

console.log("\nBENCHINT2 — production code contains no benchmark-aware branch\n");

const { violations, filesScanned, allowedHits } = scan();

check(
  `scanned a non-trivial production surface (${filesScanned} files across ${SCANNED_TREES.join(", ")})`,
  filesScanned > 50,
  `only ${filesScanned} files found — the scan roots are probably wrong, so a PASS here would mean nothing`,
);

check(
  "no executable reference to the benchmark or to impersonation in production code",
  violations.length === 0,
  violations.length === 0
    ? ""
    : violations.map((v) => `${v.file}:${v.line}  ${v.text}`).join("\n      "),
);

// A guard on the guard: if the allow-list stops matching anything, the tokens have been renamed
// and the scan is no longer excluding what it thinks it excludes.
check(
  `the allow-list still matches the observation-kind vocabulary it was written for (${allowedHits} hits)`,
  allowedHits > 0,
  "no allow-listed token was found — either the Observation Engine's kinds were renamed, or the " +
    "scan is not reading the files it should be. Either way this test is no longer protecting D13.",
);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
