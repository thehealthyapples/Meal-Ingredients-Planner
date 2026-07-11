/**
 * REL1 — Release packaging verification
 * =====================================
 * Answers one question, mechanically: **can production be reproduced from a clean checkout?**
 *
 * The failure this exists to prevent already happened. `data/development_world/` and
 * `data/cookbook/` sat untracked for weeks while `server/development-world/world-reader.ts`
 * read the first of them at runtime and `world-reader.ts:145` described it, in a comment, as
 * "a committed, immutable file". It was neither committed nor, therefore, present in any
 * deploy. The code shipped; the data stayed on one laptop. Nothing failed until a clean
 * checkout ran the feature, and by then the assumption was three commits old.
 *
 * That class of defect is invisible to typecheck, to the test suite, and to the build — all of
 * which run against a working tree that still has the files. It is only visible to a check that
 * asks git what is actually *in* the repository. That is the whole job of this script.
 *
 * THE FIVE CHECKS
 * ---------------
 *   1. DECLARED RUNTIME ASSETS ARE TRACKED — every file in RUNTIME_ASSETS below exists on disk
 *      AND is tracked by git. The manifest is the canonical, reviewed list of non-source files
 *      the platform loads. Adding a runtime asset means adding it here.
 *
 *   2. NO UNTRACKED FILES IN ASSET DIRECTORIES — nothing under data/, server/data/,
 *      attached_assets/ or client/public/ may be untracked. This is the check that would have
 *      caught REL1's defect on the day it was introduced, and it catches the *next* dataset
 *      somebody forgets to commit without anyone having to remember to update a manifest.
 *
 *   3. SERVER `data/` REFERENCES RESOLVE TO TRACKED FILES — every quoted `../data/…` literal in
 *      server runtime source is resolved relative to its own file and must land on a tracked
 *      path. Catches a new reference to a file that was never committed.
 *
 *   4. REPO-ROOT `data/` IS NEVER READ BY UNGUARDED PRODUCTION CODE — `data/` is a development
 *      and seed-source tree; it is NOT part of the production release package (see RELEASE.md).
 *      Any server runtime file that reaches into repo-root `data/` must therefore refuse to run
 *      in production. Today exactly one does — world-reader.ts, via assertDevelopmentWorldAllowed().
 *      If a second appears without a guard, production would depend on a directory the release
 *      package does not ship, and this check fails.
 *
 *   5. BUILD ARTEFACT COMPLETENESS — when dist/ exists, it contains the two things `npm start`
 *      actually serves. Skipped (not failed) when dist/ is absent, so the gate is useful before
 *      a build as well as after one.
 *
 * WHAT IT IS NOT
 * --------------
 * It does not verify the *database* is seeded — that is `scripts/verify-prod.ts`, which owns
 * schema-and-data verification against a live production DB and is not duplicated here. A repo
 * can pass this gate and still serve an empty Cookbook, because the 500 founding recipes live in
 * the `meals` table, not in the release artefact. REL1 documents that boundary rather than
 * blurring it.
 *
 * Usage:
 *   npm run verify:release-packaging
 *
 * Touches no database, needs no DATABASE_URL, and writes nothing. It reads files and asks git.
 * Exits 1 if any check fails.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * The canonical list of non-source files the platform loads, and who loads them.
 * A file here is part of the reproducible checkout. Adding a runtime asset means adding it here.
 */
const RUNTIME_ASSETS: ReadonlyArray<{ path: string; loadedBy: string; stage: string }> = [
  {
    path: "eng.traineddata",
    loadedBy: "tesseract.js via server/services/ocr.ts",
    stage: "PRODUCTION — resolved from the working directory at runtime",
  },
  {
    path: "server/data/canonical-map.json",
    loadedBy: "server/lib/item-resolver.ts",
    stage: "BUILD — inlined into dist/index.cjs by esbuild's JSON loader",
  },
  {
    path: "server/data/ambiguity-map.json",
    loadedBy: "server/lib/item-resolver.ts",
    stage: "BUILD — inlined into dist/index.cjs by esbuild's JSON loader",
  },
  {
    path: "data/development_world/development_world_foundation_50.v1.json",
    loadedBy: "server/development-world/world-reader.ts",
    stage: "DEV ONLY — production refuses via assertDevelopmentWorldAllowed()",
  },
  {
    path: "data/development_world/manifests/validation_manifest.json",
    loadedBy: "server/development-world/world-reader.ts",
    stage: "DEV ONLY — production refuses via assertDevelopmentWorldAllowed()",
  },
  {
    path: "data/cookbook/tha_original_founding_cookbook_500/tha_original_founding_cookbook_500.json",
    loadedBy: "scripts/import-tha-founding-cookbook-500.ts",
    stage: "SEED SOURCE — imported into the `meals` table; never read at runtime",
  },
];

/** Directories whose entire contents must be committed. */
const ASSET_DIRS = ["data", "server/data", "attached_assets", "client/public"] as const;

/** Server source that is NOT production runtime — tests, one-off scripts, CLIs, seeds. */
const NON_RUNTIME_SERVER = ["server/tests/", "server/scripts/", "server/cli/", "server/seeds/"];

type Status = "PASS" | "FAIL" | "SKIP";
const results: Array<{ name: string; status: Status; detail: string }> = [];
const push = (name: string, status: Status, detail: string) => results.push({ name, status, detail });

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

/** Every path tracked by git, as a set of repo-relative POSIX paths. */
function trackedPaths(): Set<string> {
  return new Set(git(["ls-files"]).split("\n").filter(Boolean));
}

/** Walk a directory, returning repo-relative paths of every file beneath it. */
function walk(dir: string): string[] {
  const abs = resolve(REPO_ROOT, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const full = join(abs, entry);
    if (statSync(full).isDirectory()) out.push(...walk(relative(REPO_ROOT, full)));
    else out.push(relative(REPO_ROOT, full));
  }
  return out;
}

/** Server runtime source files (excluding tests, scripts, CLIs, seeds). */
function serverRuntimeFiles(): string[] {
  return walk("server")
    .filter((f) => f.endsWith(".ts"))
    .filter((f) => !NON_RUNTIME_SERVER.some((prefix) => f.startsWith(prefix)));
}

const tracked = trackedPaths();

// ── 1. Declared runtime assets exist and are tracked ────────────────────────────
{
  const missing: string[] = [];
  const untracked: string[] = [];
  for (const asset of RUNTIME_ASSETS) {
    if (!existsSync(resolve(REPO_ROOT, asset.path))) missing.push(asset.path);
    else if (!tracked.has(asset.path)) untracked.push(asset.path);
  }
  if (missing.length === 0 && untracked.length === 0) {
    push("Declared runtime assets tracked", "PASS", `All ${RUNTIME_ASSETS.length} runtime assets exist and are committed`);
  } else {
    const parts = [
      missing.length ? `absent from disk: ${missing.join(", ")}` : "",
      untracked.length ? `present but UNTRACKED (would not be in a deploy): ${untracked.join(", ")}` : "",
    ].filter(Boolean);
    push("Declared runtime assets tracked", "FAIL", parts.join(" | "));
  }
}

// ── 2. No untracked files in asset directories ─────────────────────────────────
{
  const untracked = git(["ls-files", "--others", "--exclude-standard", "--", ...ASSET_DIRS])
    .split("\n")
    .filter(Boolean);
  if (untracked.length === 0) {
    push("Asset directories fully committed", "PASS", `No untracked files under ${ASSET_DIRS.join(", ")}`);
  } else {
    const shown = untracked.slice(0, 10).join(", ");
    const more = untracked.length > 10 ? ` (+${untracked.length - 10} more)` : "";
    push(
      "Asset directories fully committed",
      "FAIL",
      `${untracked.length} untracked file(s) would not reach a deploy: ${shown}${more}`,
    );
  }
}

// ── 3. Server `data/` references resolve to tracked files ──────────────────────
{
  // Quoted literals only — a path named in a comment is documentation, not a load.
  const LITERAL = /["'`]((?:\.\.\/)+data\/[^"'`]+)["'`]/g;
  const broken: string[] = [];
  let refCount = 0;

  for (const file of serverRuntimeFiles()) {
    const src = readFileSync(resolve(REPO_ROOT, file), "utf8");
    for (const m of src.matchAll(LITERAL)) {
      refCount++;
      const resolved = relative(REPO_ROOT, resolve(dirname(resolve(REPO_ROOT, file)), m[1]));
      // A directory reference passes if anything beneath it is tracked.
      const isTracked = tracked.has(resolved) || [...tracked].some((t) => t.startsWith(resolved + "/"));
      if (!isTracked) broken.push(`${file} → ${m[1]} (resolves to ${resolved})`);
    }
  }

  if (broken.length === 0) {
    push("Server data/ references resolve", "PASS", `${refCount} reference(s) from server runtime source all resolve to tracked paths`);
  } else {
    push("Server data/ references resolve", "FAIL", `Server runtime code reads paths absent from the repository: ${broken.join("; ")}`);
  }
}

// ── 4. Repo-root data/ is never read by unguarded production code ──────────────
{
  // `data/` is a dev + seed-source tree and is NOT in the production release package.
  // Anything in server runtime that reaches into it must refuse to run in production.
  const ROOT_DATA = /["'`](?:\.\.\/){2,}data\/[^"'`]+["'`]/;
  const GUARD = /assertDevelopmentWorldAllowed|NODE_ENV\s*!==\s*["'`]production["'`]/;

  const unguarded: string[] = [];
  const guarded: string[] = [];

  for (const file of serverRuntimeFiles()) {
    const src = readFileSync(resolve(REPO_ROOT, file), "utf8");
    if (!ROOT_DATA.test(src)) continue;
    if (GUARD.test(src)) guarded.push(file);
    else unguarded.push(file);
  }

  if (unguarded.length === 0) {
    push(
      "Repo-root data/ guarded against production",
      "PASS",
      guarded.length
        ? `${guarded.length} server file(s) read repo-root data/, all production-guarded: ${guarded.join(", ")}`
        : "No server runtime file reads repo-root data/",
    );
  } else {
    push(
      "Repo-root data/ guarded against production",
      "FAIL",
      `Production code would read repo-root data/, which the release package does not ship: ${unguarded.join(", ")}`,
    );
  }
}

// ── 5. Build artefact completeness ─────────────────────────────────────────────
{
  const distDir = resolve(REPO_ROOT, "dist");
  if (!existsSync(distDir)) {
    push("Build artefact complete", "SKIP", "dist/ not present — run `npm run build` to verify the artefact");
  } else {
    const required = ["dist/index.cjs", "dist/public/index.html"];
    const absent = required.filter((f) => !existsSync(resolve(REPO_ROOT, f)));
    if (absent.length === 0) {
      push("Build artefact complete", "PASS", `dist/ contains ${required.join(" and ")}`);
    } else {
      push("Build artefact complete", "FAIL", `dist/ exists but is missing: ${absent.join(", ")} — \`npm start\` would fail to serve`);
    }
  }
}

// ── Report ─────────────────────────────────────────────────────────────────────
console.log("\n=== REL1 — Release Packaging Verification ===\n");
for (const r of results) {
  const icon = r.status === "PASS" ? "✓" : r.status === "SKIP" ? "–" : "✗";
  console.log(`  ${icon} [${r.status}] ${r.name}`);
  if (r.status !== "PASS") console.log(`         ${r.detail}`);
}

const passed = results.filter((r) => r.status === "PASS").length;
const skipped = results.filter((r) => r.status === "SKIP").length;
const failed = results.filter((r) => r.status === "FAIL").length;
console.log(`\n  Total: ${passed} passed, ${skipped} skipped, ${failed} failed\n`);

if (failed > 0) {
  console.error(
    "RESULT: FAIL — the release package is incomplete. A deploy from this checkout would ship\n" +
      "code that reads files the repository does not contain. Fix the items above before deploying.\n",
  );
  process.exit(1);
}
console.log("RESULT: PASS — production is reproducible from a clean checkout.\n");
