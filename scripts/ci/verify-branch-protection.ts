/**
 * TRUST1-V3 — Branch protection verifier
 * ======================================
 * Branch protection is the one Phase 0 deliverable that git cannot prove. It is a setting on
 * GitHub, not a file in this repository, and TRUST1 exists precisely because a control that is
 * *declared* and never *verified* is not a control (Rule KC8 — and EWO-PRO1, which declared
 * three controls that were not in the code).
 *
 * So this script verifies it, mechanically, against the live API:
 *
 *   npm run verify:branch-protection                 — is main actually protected, as specified?
 *   npm run verify:branch-protection -- --print-apply — print the command a human runs to apply it
 *   npm run verify:branch-protection -- --from-file X — check a saved API response (offline test)
 *
 * It NEVER changes anything. It reads GitHub and exits non-zero if the gate is not what
 * scripts/ci/branch-protection.json says it must be. Applying the setting is a change to
 * production configuration, which COMMIT_PUSH_DEPLOY_PROTOCOL.md §3 reserves to a named human.
 *
 * THE DRIFT IT EXISTS TO CATCH. A required status check is matched on the CI job's NAME. Rename
 * the job in ci.yml and the required context never reports again — every PR then waits forever
 * on a check that no longer exists. That fails closed (nothing merges), so it will not leak a
 * bad deploy; it will simply make the gate look broken, and a gate that looks broken gets turned
 * off. Check 1 below asserts the job name in ci.yml still equals the required context in the
 * spec, so the drift is caught here rather than on a Friday.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const SPEC_PATH = path.join(ROOT, "scripts", "ci", "branch-protection.json");

interface Spec {
  branch: string;
  workflow: string;
  job: string;
  requiredCheck: string;
  protection: {
    required_status_checks: { strict: boolean; contexts: string[] };
    enforce_admins: boolean;
    required_pull_request_reviews: Record<string, unknown> | null;
    allow_force_pushes: boolean;
    allow_deletions: boolean;
    required_linear_history: boolean;
    required_conversation_resolution: boolean;
  };
}

const spec: Spec = JSON.parse(readFileSync(SPEC_PATH, "utf8"));

let failed = 0;
const pass = (msg: string) => console.log(`  PASS  ${msg}`);
const fail = (msg: string, detail?: string) => {
  console.log(`  FAIL  ${msg}`);
  if (detail) console.log(`        ${detail}`);
  failed++;
};

/**
 * The job name out of ci.yml, without a YAML dependency (there is none in this tree, and
 * TRUST1-V3 is not the task that adds one). Deliberately narrow: it finds the `name:` that sits
 * directly under `jobs.<job>:` and refuses to guess if the shape is not what it expects. A
 * parser that silently returns nothing would turn this check into decoration.
 */
function jobNameFromWorkflow(workflowPath: string, job: string): string {
  const lines = readFileSync(path.join(ROOT, workflowPath), "utf8").split("\n");
  const jobLine = lines.findIndex((l) => l.match(new RegExp(`^\\s{2}${job}:\\s*$`)));
  if (jobLine === -1) throw new Error(`job '${job}' not found in ${workflowPath}`);

  for (let i = jobLine + 1; i < lines.length; i++) {
    if (lines[i].match(/^\s{0,2}\S/)) break; // dedented out of the job block
    const m = lines[i].match(/^\s{4}name:\s*(.+?)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  throw new Error(`job '${job}' in ${workflowPath} has no name: — the required check has no context`);
}

function originSlug(): string {
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  const m = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!m) throw new Error(`origin is not a GitHub remote: ${url}`);
  return m[1];
}

function token(): string | null {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

// ── --print-apply ────────────────────────────────────────────────────────────────────────────
// Prints. Never runs. The human runs it, having read the protocol.
if (process.argv.includes("--print-apply")) {
  const slug = originSlug();
  console.log(`# Apply the TRUST1-V3 gate to ${slug}@${spec.branch}. Run this yourself — nothing here runs it.`);
  console.log(`# You must be a repository admin. Read .engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md first.`);
  console.log(
    `gh api -X PUT repos/${slug}/branches/${spec.branch}/protection \\\n` +
      `  -H "Accept: application/vnd.github+json" \\\n` +
      `  --input - <<'JSON'\n${JSON.stringify(spec.protection, null, 2)}\nJSON`,
  );
  console.log(`\n# Then prove it took effect — a setting you have not verified is a claim, not a control:`);
  console.log(`npm run verify:branch-protection`);
  process.exit(0);
}

console.log("TRUST1-V3 — pre-deployment verification gate\n");

// ── Check 1 — the required check still names a job that exists (offline; always runs) ────────
try {
  const actual = jobNameFromWorkflow(spec.workflow, spec.job);
  if (actual === spec.requiredCheck) {
    pass(`required check "${spec.requiredCheck}" matches the ${spec.job} job in ${spec.workflow}`);
  } else {
    fail(
      `required check name has drifted from the CI job that produces it`,
      `spec: "${spec.requiredCheck}"  ci.yml: "${actual}" — every PR would wait forever on a check that never reports.`,
    );
  }
} catch (e) {
  fail(`could not read the job name from ${spec.workflow}`, String(e));
}

// ── Check 2 — the live setting on GitHub ─────────────────────────────────────────────────────
async function liveProtection(): Promise<Record<string, any> | null> {
  const fromFile = process.argv.indexOf("--from-file");
  if (fromFile !== -1) {
    const p = process.argv[fromFile + 1];
    console.log(`  NOTE  reading a saved API response from ${p} — this proves the comparison, not the repository`);
    return JSON.parse(readFileSync(p, "utf8"));
  }

  const t = token();
  if (!t) {
    fail(
      "no GitHub credential — cannot verify the live setting",
      "Set GITHUB_TOKEN, or run `gh auth login`. Until this check runs against GitHub, main's protection is UNVERIFIED.",
    );
    return null;
  }

  const slug = originSlug();
  const res = await fetch(`https://api.github.com/repos/${slug}/branches/${spec.branch}/protection`, {
    headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json" },
  });

  if (res.status === 404) {
    fail(
      `${slug}@${spec.branch} is NOT protected`,
      "GitHub returned 404: no protection rule, or this token is not an admin. Nothing blocks an untested merge to main.",
    );
    return null;
  }
  if (res.status === 403) {
    fail(
      `GitHub refused the request (403)`,
      "Branch protection is unavailable on private repositories on the Free plan. If that is this repository, the gate " +
        "CANNOT be enforced by GitHub — see the protocol's 'If protection is unavailable' section before assuming it is on.",
    );
    return null;
  }
  if (!res.ok) {
    fail(`GitHub returned ${res.status}`, await res.text());
    return null;
  }
  return res.json();
}

const live = await liveProtection();

if (live) {
  const want = spec.protection;
  const contexts: string[] = live.required_status_checks?.contexts ?? live.required_status_checks?.checks?.map((c: any) => c.context) ?? [];

  contexts.includes(spec.requiredCheck)
    ? pass(`"${spec.requiredCheck}" is a REQUIRED status check on ${spec.branch}`)
    : fail(`"${spec.requiredCheck}" is not required on ${spec.branch}`, `required: [${contexts.join(", ") || "none"}] — CI runs, and nothing waits for it.`);

  live.required_status_checks?.strict === want.required_status_checks.strict
    ? pass(`branches must be up to date before merging (strict: ${want.required_status_checks.strict})`)
    : fail(`strict is ${live.required_status_checks?.strict}, expected ${want.required_status_checks.strict}`, "A stale branch can pass CI and still break main.");

  live.enforce_admins?.enabled === want.enforce_admins
    ? pass(`administrators are subject to the gate (enforce_admins: ${want.enforce_admins})`)
    : fail(`enforce_admins is ${live.enforce_admins?.enabled}, expected ${want.enforce_admins}`, "An admin can merge a red build silently. The bypass must be an explicit, auditable act — that is the whole design.");

  const prRequired = live.required_pull_request_reviews != null;
  prRequired === (want.required_pull_request_reviews != null)
    ? pass("a pull request is required — direct pushes to main are rejected")
    : fail("main accepts direct pushes", "`git push origin main` (and deploy.sh) can reach production without a PR, and therefore without the gate.");

  live.allow_force_pushes?.enabled === want.allow_force_pushes
    ? pass(`force pushes are ${want.allow_force_pushes ? "allowed" : "blocked"}`)
    : fail(`allow_force_pushes is ${live.allow_force_pushes?.enabled}, expected ${want.allow_force_pushes}`, "History on main could be rewritten around the gate.");

  live.allow_deletions?.enabled === want.allow_deletions
    ? pass(`branch deletion is ${want.allow_deletions ? "allowed" : "blocked"}`)
    : fail(`allow_deletions is ${live.allow_deletions?.enabled}, expected ${want.allow_deletions}`);
}

console.log();
if (failed > 0) {
  console.log(`✗ The pre-deployment verification gate is NOT fully enforced (${failed} failing).`);
  console.log(`  Read .engineering/protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md, then:`);
  console.log(`  npm run verify:branch-protection -- --print-apply`);
  process.exit(1);
}
console.log("✓ The pre-deployment verification gate is enforced on main.");
