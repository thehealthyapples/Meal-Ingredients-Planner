/**
 * PKC Phase 0 / KNOW5 / KNOW2 — the human sign-off gate for sourced nutrition claims.
 *
 * Rule KC9 (PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §5): automation
 * authors candidates, never publishes them. Seeding attaches citations
 * (source_refs) but leaves reviewed_at NULL, so nothing renders. THIS script
 * is the explicit confirmation step: a human reviews the printed claims and
 * their sources, then re-runs with the confirmation flag to set reviewed_at —
 * the moment the claims "light up" across every consuming surface.
 *
 * Usage:
 *   npm run knowledge:signoff                                        # dry run
 *   npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Ada L"
 *   npm run knowledge:signoff -- --edge composition --confirm REVIEWED --reviewer "Ada L"
 *
 * KNOW5 changed two things: SCOPE (it covers the composition edge as well as
 * nutrient→benefit, because a chip requires both) and REVIEWER IDENTITY
 * (`--reviewer` is mandatory — an anonymous reviewed_at records that *someone*
 * approved a health claim without recording who).
 *
 * KNOW2 changes a third: THIS SCRIPT NO LONGER WRITES.
 *
 * It delegates every decision to `server/lib/knowledge-claim-review-store.ts`,
 * which is now the single authorised writer of the review columns. The reason is
 * ownership, not tidiness: KNOW2 adds an Admin review surface, and a surface with
 * its own UPDATE beside this script's own UPDATE would be two owners of the
 * publication fact (ARCHITECTURE_PRINCIPLES.md Principle 2). The script keeps its
 * behaviour and gains two properties it could not have had alone — each claim now
 * gets its own audit row, and each is approved individually rather than in one
 * undifferentiated UPDATE ... WHERE id IN (...).
 *
 * Still approve-all-valid at this entry point (KNOW1 finding F5), and that is
 * now a deliberate division rather than a gap: the Admin surface reviews claims
 * ONE AT A TIME and offers no bulk button, while the bulk path lives here —
 * behind a printed list, a typed confirmation flag and a typed reviewer name.
 */
import {
  approveAllValid,
  listClaims,
  CLAIM_EDGES,
  CLAIM_EDGE_LABELS,
  isClaimEdge,
  type ClaimEdge,
} from "../lib/knowledge-claim-review-store";
import { pool } from "../db";

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
}

async function run() {
  const args = process.argv.slice(2);
  const confirming = flag(args, "--confirm") === "REVIEWED";
  const reviewer = flag(args, "--reviewer")?.trim();
  const edgeArg = flag(args, "--edge");

  if (edgeArg && !isClaimEdge(edgeArg)) {
    console.error(`Unknown --edge "${edgeArg}". Use one of: ${CLAIM_EDGES.join(", ")}.`);
    process.exit(1);
  }
  const edges: ClaimEdge[] = edgeArg && isClaimEdge(edgeArg) ? [edgeArg] : [...CLAIM_EDGES];

  // Reviewer identity is required BEFORE anything is written, not after.
  if (confirming && !reviewer) {
    console.error(
      "Refusing to sign off anonymously: --reviewer is required.\n" +
        '  npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Your Name"\n\n' +
        "A sign-off is a human taking responsibility for a health claim. A reviewed_at\n" +
        "with no reviewed_by cannot be audited, attributed, or withdrawn.",
    );
    process.exit(1);
  }

  let total = 0;
  let validTotal = 0;

  for (const edge of edges) {
    const pending = await listClaims({ edge, status: "pending", citedOnly: true, limit: 1000 });
    total += pending.length;
    if (pending.length === 0) continue;

    console.log(`\n── ${edge} — ${pending.length} sourced claim(s) awaiting sign-off ──\n`);
    for (const claim of pending) {
      console.log(`  [${claim.canApprove ? "OK " : "BAD"}] ${claim.subject}`);
      if (claim.approvedWording) console.log(`         “${claim.approvedWording}”`);
      for (const ref of claim.sourceRefs) {
        console.log(`         • ${ref.body}: ${ref.title}`);
        console.log(`           ${ref.url}  (link checked ${ref.lastReviewed})`);
      }
      for (const problem of claim.citationProblems) console.log(`         ✗ ${problem}`);
      if (claim.canApprove) validTotal++;
    }
  }

  if (total === 0) {
    console.log("No sourced claims awaiting sign-off.");
    await pool.end();
    return;
  }

  if (!confirming) {
    console.log(
      "\nDry run — nothing signed off. Review each claim against its source, then run:" +
        '\n  npm run knowledge:signoff -- --confirm REVIEWED --reviewer "Your Name"' +
        "\n\nTo approve or REJECT claims one at a time, with a recorded reason and a full" +
        "\ndecision history, use the Admin review surface at /admin/knowledge-claims.",
    );
    await pool.end();
    return;
  }

  if (validTotal === 0) {
    console.log("\nNo structurally valid claims to sign off.");
    await pool.end();
    return;
  }

  console.log("");
  for (const edge of edges) {
    const { approved, skipped } = await approveAllValid(edge, reviewer!);
    if (approved > 0) {
      console.log(`Signed off ${approved} ${CLAIM_EDGE_LABELS[edge]} claim(s) as "${reviewer}".`);
    }
    if (skipped > 0) {
      console.log(`  (${skipped} skipped — citation not structurally valid.)`);
    }
  }

  console.log("\nA benefit chip renders only where BOTH its composition premise and its");
  console.log("nutrient→benefit claim are now signed off. Everything else stays an honest gap.");
  console.log("A preparation note renders only where its own effect row is signed off; until");
  console.log("then the preparation is shown as existing, with no claim attached to it.");
  console.log("\nEvery decision above is recorded in knowledge_review_audit and is permanent.");

  await pool.end();
}

run().catch((err) => {
  console.error("Sign-off failed:", err);
  process.exit(1);
});
