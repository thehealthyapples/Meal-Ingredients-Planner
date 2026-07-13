/**
 * CPV1 — Canonical Publication Verification gate.
 *
 * Runs the platform's canonical publication verifier
 * (server/verification/publication-verifier.ts — the one owner of what
 * "correctly published" means) and reports each domain's status:
 *
 *   🟢 Healthy · 🟡 Needs Attention · 🔴 Publication Failure
 *
 * Exit codes:
 *   0 — no domain is in publication failure
 *   1 — at least one domain is in publication failure, or a fatal error
 *   with --strict, any warned/skipped check also exits 1
 *
 * Read-only: SELECT-only database access, no file writes.
 * Run with: npm run verify:publication [-- --strict]
 */

import { runPublicationVerification } from "../../server/verification/publication-verifier";

const STATUS_ICON: Record<string, string> = {
  healthy: "🟢",
  "needs-attention": "🟡",
  "publication-failure": "🔴",
};

const OUTCOME_ICON: Record<string, string> = {
  pass: "✓",
  warn: "⚠",
  fail: "✗",
  skipped: "○",
};

async function main(): Promise<void> {
  const strict = process.argv.includes("--strict");
  console.log("CPV1 — Canonical Publication Verification");
  console.log("==========================================\n");

  const report = await runPublicationVerification();

  if (!report.databaseAvailable) {
    console.log("⚠ Database unreachable — projection checks report as skipped.\n");
  }

  for (const domain of report.domains) {
    console.log(`${STATUS_ICON[domain.status]} ${domain.name}  [${domain.variant}]`);
    console.log(`   owner: ${domain.canonicalOwner}`);
    for (const check of domain.checks) {
      if (check.outcome === "pass") continue;
      const ref = check.cpi1 ? ` (CPI1 ${check.cpi1})` : "";
      console.log(`   ${OUTCOME_ICON[check.outcome]} [${check.outcome.toUpperCase()}] ${check.title}${ref}`);
      console.log(`       ${check.detail}`);
    }
    console.log("");
  }

  console.log("── Cross-cutting (CPI1 §4) ──");
  for (const check of report.crossCutting) {
    const ref = check.cpi1 ? ` (CPI1 ${check.cpi1})` : "";
    console.log(` ${OUTCOME_ICON[check.outcome]} [${check.outcome.toUpperCase()}] ${check.title}${ref}`);
    console.log(`     ${check.detail}`);
  }

  const s = report.summary;
  console.log("\n── Platform verification status ──");
  console.log(
    `Domains: ${s.domains} — 🟢 ${s.healthy} healthy · 🟡 ${s.needsAttention} need attention · 🔴 ${s.publicationFailure} publication failure`,
  );
  console.log(
    `Checks:  ${s.checksRun} run — ${s.passed} passed, ${s.warned} warned, ${s.failed} failed, ${s.skipped} skipped`,
  );

  const strictDirty = strict && (s.warned > 0 || s.skipped > 0);
  if (s.publicationFailure > 0 || strictDirty) {
    console.error(
      `\nRESULT: FAIL — ${s.publicationFailure} domain(s) in publication failure` +
        (strictDirty ? ` (strict: ${s.warned} warned, ${s.skipped} skipped)` : ""),
    );
    process.exitCode = 1;
  } else {
    console.log("\nRESULT: PASS");
  }

  // Close the shared pool so the CLI exits instead of holding the event loop.
  try {
    const { pool } = await import("../../server/db");
    await pool.end();
  } catch {
    // No pool was opened (database unreachable) — nothing to close.
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
