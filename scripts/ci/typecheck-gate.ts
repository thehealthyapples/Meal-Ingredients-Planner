/**
 * TRUST1-S10 — Typecheck regression gate
 * ======================================
 * `npm run typecheck` (tsc --noEmit) exits NON-ZERO on this repository today and always has.
 * At the time this gate was written there were 175 pre-existing errors. A CI job that simply
 * ran `tsc --noEmit` would therefore be red on its first run and every run after it, and a
 * gate that is permanently red is not a gate — it is a thing people learn to ignore. The
 * Phase 0 plan is explicit about this: "a gate that is red for reasons unrelated to the change
 * under review teaches everyone to bypass it, and a bypassed gate is worse than no gate,
 * because it is believed."
 *
 * So this gate does what TRUST1-S10 actually asks for: it fails on typecheck REGRESSIONS.
 * The known errors are recorded in typecheck-baseline.json and frozen. A new error fails the
 * build. A fixed error also fails the build, with instructions to re-record the baseline —
 * because a baseline that is allowed to go stale silently re-admits the very errors it froze.
 * The debt can therefore only ever shrink.
 *
 *   npm run typecheck:ci        — check against the baseline (this is what CI runs)
 *   npm run typecheck:baseline  — re-record the baseline after fixing or accepting errors
 *
 * KEYING — this is the part that is easy to get wrong, and it was got wrong first.
 * An error is keyed on (file, TS code) with an occurrence count. NOT on line/column, and NOT
 * on the message text. Both alternatives were tried and both are broken:
 *
 *   - line/column: any edit above an error renumbers every error below it, and the gate would
 *     report a whole untouched file as new the moment someone adds an import.
 *   - message text: tsc embeds the ABSOLUTE path of the repository inside some messages
 *     (e.g. TS2339 "...does not exist on type 'typeof import("/abs/path/shared/schema")'"),
 *     so the identical error keys differently depending on what directory the checkout is in.
 *     A baseline recorded locally would therefore be 100% "regressions" on a CI runner, whose
 *     checkout path is different — a gate red on its first run, forever. tsc's type printer is
 *     also not textually stable (this repo has `incremental: true`, and property ordering in
 *     printed anonymous types varied between two runs of the same commit).
 *
 * Counting by (file, code) is insensitive to both. The one blind spot it accepts, honestly:
 * an error that REPLACES another of the same code in the same file leaves the count unchanged
 * and passes. That is a narrow gap, and a far smaller one than a gate nobody can keep green.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE_PATH = resolve(HERE, "typecheck-baseline.json");
const REPO_ROOT = resolve(HERE, "..", "..");

interface Baseline {
  /** Human-facing note. Not read by the gate. */
  readonly note: string;
  /** Total error count when the baseline was recorded. Advisory; the counts map is authoritative. */
  readonly total: number;
  /** "file :: TScode" -> number of occurrences. This is what the gate compares. */
  readonly errors: Record<string, number>;
  /** One example message per key, for humans reading the file. NEVER compared. */
  readonly examples: Record<string, string>;
}

/** A tsc diagnostic line looks like:  path/to/file.ts(12,34): error TS2345: message */
const DIAGNOSTIC = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

/** Key on file + TS code only. See the header comment for why message and line are excluded. */
function keyOf(file: string, code: string): string {
  return `${file} :: ${code}`;
}

/** Absolute paths leak into messages and differ per checkout. Only ever used for display. */
function scrub(message: string): string {
  return message.replace(new RegExp(REPO_ROOT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), ".");
}

interface Observed {
  readonly counts: Map<string, number>;
  readonly examples: Map<string, string>;
}

function runTypecheck(): Observed {
  let output: string;
  try {
    // tsc exits non-zero whenever there is at least one error, which is the normal case here.
    output = execFileSync("npx", ["tsc", "--noEmit"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err: any) {
    output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    if (!output.trim()) {
      console.error("[typecheck-gate] tsc produced no output but failed to run:");
      console.error(err.message);
      process.exit(2);
    }
  }

  const counts = new Map<string, number>();
  const examples = new Map<string, string>();
  for (const line of output.split("\n")) {
    const m = DIAGNOSTIC.exec(line.trim());
    if (!m) continue; // continuation lines of a multi-line diagnostic
    const [, file, , , code, message] = m;
    const key = keyOf(file, code);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!examples.has(key)) examples.set(key, scrub(message).slice(0, 160));
  }
  return { counts, examples };
}

function total(counts: Map<string, number>): number {
  let n = 0;
  for (const c of counts.values()) n += c;
  return n;
}

function record({ counts, examples }: Observed): void {
  const errors: Record<string, number> = {};
  const ex: Record<string, string> = {};
  for (const key of [...counts.keys()].sort()) {
    errors[key] = counts.get(key)!;
    ex[key] = examples.get(key) ?? "";
  }

  const baseline: Baseline = {
    note:
      "TRUST1-S10. Pre-existing tsc errors, frozen so CI fails on NEW ones. Keyed on " +
      "(file :: TS code) with an occurrence count — NOT on line or message, both of which " +
      "vary between checkouts. `examples` is for humans and is never compared. " +
      "This list must only ever shrink: re-record with `npm run typecheck:baseline`.",
    total: total(counts),
    errors,
    examples: ex,
  };

  writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  console.log(`[typecheck-gate] baseline recorded: ${baseline.total} error(s) across ${Object.keys(errors).length} distinct (file, code) site(s)`);
  console.log(`[typecheck-gate] wrote ${BASELINE_PATH}`);
}

function check({ counts, examples }: Observed): void {
  let baseline: Baseline;
  try {
    baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
  } catch {
    console.error(`[typecheck-gate] FAIL — no baseline at ${BASELINE_PATH}.`);
    console.error("[typecheck-gate] Record one with: npm run typecheck:baseline");
    process.exit(1);
  }

  const base = new Map<string, number>(Object.entries(baseline.errors));

  const regressions: string[] = [];
  const fixed: string[] = [];

  for (const [key, now] of counts) {
    const before = base.get(key) ?? 0;
    if (now > before) {
      const what = before === 0 ? `NEW      ${key}` : `WORSE    ${key}  (${before} -> ${now})`;
      regressions.push(`${what}\n           ${examples.get(key) ?? ""}`);
    }
  }
  for (const [key, before] of base) {
    const now = counts.get(key) ?? 0;
    if (now < before) {
      fixed.push(now === 0 ? `FIXED    ${key}` : `IMPROVED ${key}  (${before} -> ${now})`);
    }
  }

  const nowTotal = total(counts);
  console.log(`[typecheck-gate] baseline: ${baseline.total} error(s)   current: ${nowTotal} error(s)`);

  if (regressions.length > 0) {
    console.error("");
    console.error("┌──────────────────────────────────────────────────────────────────────────┐");
    console.error("│  TYPECHECK REGRESSION — this change introduces new type errors.          │");
    console.error("└──────────────────────────────────────────────────────────────────────────┘");
    console.error("");
    for (const r of regressions) console.error(`  ${r}`);
    console.error("");
    console.error(`  ${regressions.length} regression(s). Fix them — do NOT re-record the baseline to make this pass.`);
    console.error("  The baseline exists to freeze pre-existing debt, not to absorb new debt.");
    console.error("");
    process.exit(1);
  }

  if (fixed.length > 0) {
    console.error("");
    console.error("┌──────────────────────────────────────────────────────────────────────────┐");
    console.error("│  TYPECHECK IMPROVED — but the baseline is now stale.                     │");
    console.error("└──────────────────────────────────────────────────────────────────────────┘");
    console.error("");
    for (const f of fixed) console.error(`  ${f}`);
    console.error("");
    console.error("  This is good news, and it still fails the build — deliberately.");
    console.error("  A stale baseline silently re-admits the errors it just froze: the next commit");
    console.error("  could reintroduce these and the gate would say nothing.");
    console.error("");
    console.error("  Run:  npm run typecheck:baseline    then commit the updated baseline.");
    console.error("");
    process.exit(1);
  }

  console.log("[typecheck-gate] PASS — no new type errors. Known debt unchanged.");
}

const mode = process.argv[2] ?? "check";
const counts = runTypecheck();

if (mode === "record") {
  record(counts);
} else if (mode === "check") {
  check(counts);
} else {
  console.error(`[typecheck-gate] unknown mode "${mode}" — expected "check" or "record".`);
  process.exit(2);
}
