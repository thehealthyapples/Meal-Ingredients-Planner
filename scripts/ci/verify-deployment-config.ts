/**
 * REL2 — Deployment configuration verification
 * ============================================
 * Answers one question, mechanically: **is the deployment configuration the one in the
 * repository?**
 *
 * REL1's sibling gate (`verify-release-packaging.ts`) asks whether the repository contains
 * everything production *loads*. This one asks whether the repository contains everything that
 * decides *how production runs* — and whether it says so exactly once.
 *
 * The failure this exists to prevent already happened, twice, in the same file.
 *
 *   1. `.replit` sat MODIFIED and uncommitted for days (`exposeLocalhost = true`, added by
 *      workspace tooling, referenced by nothing). The deployed configuration was therefore not
 *      the configuration in the repository, and nothing was checking. TRUST1 found it by reading
 *      `git status` by hand; REL1 raised it as a blocker and could not close it.
 *
 *   2. `.replit` declared `[deployment] deploymentTarget = "autoscale"` — a Replit Deployments
 *      target THA has never released from. Production is GitHub -> Render. That dead block was
 *      not merely untidy: REL1 read it, believed it, and diagnosed the ephemeral-uploads blocker
 *      against the wrong platform. A rival deployment declaration does not sit quietly; it gets
 *      believed.
 *
 * That class of defect is invisible to typecheck, to the test suite, and to the build. None of
 * them reads `.replit`, and none of them asks git whether the config on disk is the config that
 * is committed. That is the whole job of this script.
 *
 * THE SIX CHECKS
 * --------------
 *   1. DEPLOYMENT CONFIG IS COMMITTED — `.replit` is tracked AND has no uncommitted
 *      modifications. This is the check that would have caught REL1 Blocker 3 on the day it
 *      appeared, and it catches the *next* silent edit by workspace tooling without anyone having
 *      to remember to read `git status`.
 *
 *   2. NO RIVAL DEPLOYMENT TARGET — `.replit` declares no `[deployment]` block. THA deploys from
 *      GitHub to Render and from nowhere else. If the block returns, this fails.
 *
 *   3. NO SILENT LOCALHOST EXPOSURE — no `[[ports]]` entry carries `exposeLocalhost`. That flag
 *      publishes a service that deliberately bound to localhost, which is a security decision and
 *      may never arrive as a tooling artefact.
 *
 *   4. THE SERVED PORT IS DECLARED ONCE — `.replit`'s `[env] PORT` matches the server's own
 *      default in `server/index.ts`. Two disagreeing port declarations mean one of them is a lie.
 *
 *   5. DECLARED HOOKS RESOLVE — `[postMerge] path` names a file that exists and is tracked. A
 *      hook pointing at a file absent from a clean checkout is a hook that silently does nothing.
 *
 *   6. THE START COMMAND MATCHES THE BUILD OUTPUT — `npm start` runs the artefact that
 *      `script/build.ts` actually emits. Render runs `npm start`; if these drift, the deploy boots
 *      nothing.
 *
 * WHAT IT IS NOT
 * --------------
 * It CANNOT verify Render. Render's service configuration — build command, start command,
 * environment variables, health check, instance count — lives in the Render dashboard, and there
 * is no `render.yaml` in this repository. **That is a real, open gap, and this gate reports it as
 * a NOTE rather than passing over it in silence.** A green result here means the repository's own
 * deployment configuration is coherent and committed. It does not mean Render agrees with it,
 * because nothing in the repository can know what Render thinks.
 *
 * Usage:
 *   npm run verify:deployment-config
 *
 * Touches no database, needs no DATABASE_URL, contacts no deployment provider, and writes
 * nothing. It reads files and asks git. Exits 1 if any check fails.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

type Status = "PASS" | "FAIL";
const results: Array<{ name: string; status: Status; detail: string }> = [];
const push = (name: string, status: Status, detail: string) => results.push({ name, status, detail });

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function read(relPath: string): string {
  return readFileSync(resolve(REPO_ROOT, relPath), "utf8");
}

/** Strip whole-line `#` comments so a commented-out block never reads as a live declaration. */
function withoutComments(toml: string): string {
  return toml
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("#"))
    .join("\n");
}

const REPLIT = ".replit";
const replitRaw = existsSync(resolve(REPO_ROOT, REPLIT)) ? read(REPLIT) : "";
const replit = withoutComments(replitRaw);

// ── 1. Deployment config is committed ──────────────────────────────────────────
{
  const tracked = git(["ls-files", "--", REPLIT]) === REPLIT;
  // Porcelain is empty when the file is clean; non-empty for M / ?? / D alike.
  const dirty = git(["status", "--porcelain", "--", REPLIT]);

  if (!tracked) {
    push("Deployment config committed", "FAIL", `${REPLIT} is not tracked by git — the deployed configuration exists in no commit`);
  } else if (dirty) {
    push(
      "Deployment config committed",
      "FAIL",
      `${REPLIT} has uncommitted changes (\`${dirty}\`) — the active deployment configuration is NOT the one in the repository. Commit it or revert it.`,
    );
  } else {
    push("Deployment config committed", "PASS", `${REPLIT} is tracked and clean — config on disk == config in the repository`);
  }
}

// ── 2. No rival deployment target ──────────────────────────────────────────────
{
  // THA's production deployment target is Render, declared in RELEASE.md. `.replit` must not
  // declare a second one. REL1 believed the block that used to be here and blamed the wrong
  // platform for a real blocker.
  if (/^\s*\[deployment\]/m.test(replit)) {
    push(
      "No rival deployment target",
      "FAIL",
      `${REPLIT} declares a [deployment] block. THA deploys GitHub -> Render and from nowhere else (RELEASE.md § Deployment Configuration). A second deployment declaration will be believed. Remove it, or declare the new target in RELEASE.md and update this gate.`,
    );
  } else {
    push("No rival deployment target", "PASS", `${REPLIT} declares no [deployment] block — Render remains the single declared target`);
  }
}

// ── 3. No silent localhost exposure ────────────────────────────────────────────
{
  if (/exposeLocalhost/.test(replit)) {
    // Resolve the flag to its OWN [[ports]] block. A regex spanning the whole file will happily
    // pair the first localPort it sees with an exposeLocalhost several blocks later and name the
    // wrong port — which is the exact species of confidently-wrong evidence this gate exists to
    // stamp out. Split first, then ask each block about itself.
    const ports = replit
      .split(/^\s*\[\[ports\]\]/m)
      .slice(1)
      .filter((block) => /exposeLocalhost/.test(block))
      .map((block) => block.match(/localPort\s*=\s*(\d+)/)?.[1] ?? "unknown");
    push(
      "No silent localhost exposure",
      "FAIL",
      `${REPLIT} sets exposeLocalhost${ports.length ? ` (port ${ports.join(", ")})` : ""}. That publishes a service which deliberately bound to localhost. It is a security decision, not a tooling artefact — if it is genuinely wanted, say why in RELEASE.md and amend this check.`,
    );
  } else {
    push("No silent localhost exposure", "PASS", "No port mapping exposes a localhost-bound service");
  }
}

// ── 4. The served port is declared once ────────────────────────────────────────
{
  const declared = replit.match(/^\s*PORT\s*=\s*["'](\d+)["']/m)?.[1];
  // server/index.ts: parseInt(process.env.PORT || "5000", 10)
  const serverDefault = read("server/index.ts").match(/process\.env\.PORT\s*\|\|\s*["'](\d+)["']/)?.[1];

  if (!declared || !serverDefault) {
    push(
      "Served port declared once",
      "FAIL",
      `Could not read both port declarations (${REPLIT} [env] PORT: ${declared ?? "NOT FOUND"}; server/index.ts default: ${serverDefault ?? "NOT FOUND"})`,
    );
  } else if (declared !== serverDefault) {
    push(
      "Served port declared once",
      "FAIL",
      `${REPLIT} declares PORT=${declared} but server/index.ts defaults to ${serverDefault}. One of them is wrong, and which one bites depends on whether the environment happens to set PORT.`,
    );
  } else {
    push("Served port declared once", "PASS", `PORT=${declared} in ${REPLIT} and in server/index.ts's fallback — they agree`);
  }
}

// ── 5. Declared hooks resolve ──────────────────────────────────────────────────
{
  const hookPath = replit.match(/\[postMerge\][\s\S]*?path\s*=\s*["']([^"']+)["']/)?.[1];

  if (!hookPath) {
    push("Declared hooks resolve", "PASS", "No [postMerge] hook declared — nothing to resolve");
  } else {
    const onDisk = existsSync(resolve(REPO_ROOT, hookPath));
    const tracked = git(["ls-files", "--", hookPath]) === hookPath;
    if (onDisk && tracked) {
      push("Declared hooks resolve", "PASS", `[postMerge] -> ${hookPath} exists and is committed`);
    } else {
      push(
        "Declared hooks resolve",
        "FAIL",
        `[postMerge] -> ${hookPath} ${!onDisk ? "does not exist" : "is not tracked by git"} — the hook would silently do nothing in a clean checkout`,
      );
    }
  }
}

// ── 6. The start command matches the build output ──────────────────────────────
{
  const pkg = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
  const start = pkg.scripts?.start ?? "";
  // The artefact `npm start` executes — Render's start command.
  const started = start.match(/node\s+(?:\.\/)?(\S+\.c?js)/)?.[1];
  // The artefact the build actually emits.
  const emitted = read("script/build.ts").match(/outfile:\s*["'](\S+?)["']/)?.[1];

  if (!started || !emitted) {
    push(
      "Start command matches build output",
      "FAIL",
      `Could not read both ends (npm start runs: ${started ?? "NOT FOUND"}; script/build.ts emits: ${emitted ?? "NOT FOUND"})`,
    );
  } else if (started !== emitted) {
    push(
      "Start command matches build output",
      "FAIL",
      `\`npm start\` runs ${started} but the build emits ${emitted}. Render runs \`npm start\`, so the deploy would boot nothing.`,
    );
  } else {
    push("Start command matches build output", "PASS", `\`npm start\` runs ${started}, which is exactly what script/build.ts emits`);
  }
}

// ── Report ─────────────────────────────────────────────────────────────────────
console.log("\n=== REL2 — Deployment Configuration Verification ===\n");
for (const r of results) {
  console.log(`  ${r.status === "PASS" ? "✓" : "✗"} [${r.status}] ${r.name}`);
  if (r.status !== "PASS") console.log(`         ${r.detail}`);
}

const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;
console.log(`\n  Total: ${passed} passed, ${failed} failed\n`);

// The honest gap. Stated on every run, pass or fail, so a green gate is never mistaken for a
// verified deployment.
console.log(
  "  NOTE — what this gate cannot see: Render's service configuration (build command, start\n" +
    "  command, environment variables, health check) lives in the Render dashboard. There is no\n" +
    "  render.yaml in this repository, so production's deployment configuration is NOT fully\n" +
    "  reproducible from the repository. A PASS means THA's own config is coherent and committed;\n" +
    "  it does not mean Render agrees with it. See RELEASE.md § Deployment Configuration.\n",
);

if (failed > 0) {
  console.error(
    "RESULT: FAIL — the deployment configuration in this checkout is not the one that would\n" +
      "deploy. Fix the items above before releasing.\n",
  );
  process.exit(1);
}
console.log("RESULT: PASS — the repository's deployment configuration is committed, coherent, and singular.\n");
