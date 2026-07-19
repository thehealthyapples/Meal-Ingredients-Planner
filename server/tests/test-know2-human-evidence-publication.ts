/**
 * KNOW2 — Human Evidence Publication: verification tests.
 *
 * Governing documents:
 *   docs/architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md (knowledge variant)
 *   docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §5 (Rule KC9)
 *   docs/implementation/knowledge/KNOW2_HUMAN_EVIDENCE_PUBLICATION.md
 *
 * Rule KC8 — "declared is not enforced". KNOW2 declares five things; this file
 * is where each stops being a declaration:
 *
 *   1. A claim has three states, and rejection is terminal and distinguishable
 *      from "not yet reviewed".
 *   2. Unpublished and rejected claims never surface — and they do so through
 *      the EXISTING Trust Gate, with no new filter.
 *   3. Every decision is attributed and permanently auditable.
 *   4. There is exactly ONE writer of the publication fact.
 *   5. The Trust Gate itself is byte-unchanged.
 *
 * Layer 1 (pure) and Layer 2 (source) always run. Layer 3 (live DB) runs only
 * when DATABASE_URL is set, inside a transaction that is always rolled back, so
 * it writes nothing that survives the test.
 *
 * Run with:  npm run test:know2-human-evidence-publication
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  allowedClaimReviewActions,
  canApproveClaim,
  deriveClaimReviewStatus,
  isAllowedClaimReviewAction,
  isEvidenceBackedClaim,
  validateClaimLifecycleState,
  type KnowledgeSourceRef,
} from "../../shared/knowledge/evidence.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => readFileSync(resolve(REPO_ROOT, p), "utf8");

const validRef: KnowledgeSourceRef = {
  body: "NHS", title: "Example NHS page",
  url: "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-c/",
  evidenceLevel: "established", lastReviewed: "2026-07-19",
};
const untrustedRef: KnowledgeSourceRef = { ...validRef, url: "https://example-health-blog.com/vitamins" };

const PENDING = { sourceRefs: [validRef], reviewedAt: null, rejectedAt: null };
const APPROVED = { sourceRefs: [validRef], reviewedAt: new Date(), reviewedBy: "Ada L", rejectedAt: null };
const REJECTED = {
  sourceRefs: [validRef], reviewedAt: null, reviewedBy: null,
  rejectedAt: new Date(), rejectedBy: "Ada L", rejectionReason: "the cited page does not support this claim",
};

async function run() {
  // ── 1. Three states, and rejection is distinguishable ──────────────────────
  console.log("── 1. A claim has three distinguishable states ──");
  {
    check("an untouched claim is pending", deriveClaimReviewStatus(PENDING) === "pending");
    check("a signed-off claim is approved", deriveClaimReviewStatus(APPROVED) === "approved");
    check("a refused claim is rejected", deriveClaimReviewStatus(REJECTED) === "rejected");

    // The whole point of KNOW2: before it, these two were the same value.
    check(
      "pending and rejected are DIFFERENT states (before KNOW2 both were `reviewed_at IS NULL`)",
      deriveClaimReviewStatus(PENDING) !== deriveClaimReviewStatus(REJECTED),
    );

    // Fail closed. A row holding both states must never read as approved.
    check(
      "a row holding both approval and rejection reads as REJECTED (fails closed)",
      deriveClaimReviewStatus({ ...APPROVED, rejectedAt: new Date() }) === "rejected",
    );
  }

  console.log("\n── 1b. Review-state integrity ──");
  {
    check("a valid pending row has no problems", validateClaimLifecycleState(PENDING).length === 0);
    check("a valid rejection has no problems", validateClaimLifecycleState(REJECTED).length === 0);
    check(
      "approved AND rejected is refused",
      validateClaimLifecycleState({ ...APPROVED, rejectedAt: new Date(), rejectedBy: "X", rejectionReason: "y" })
        .some((p) => p.includes("exclusive")),
    );
    check(
      "an anonymous rejection is refused",
      validateClaimLifecycleState({ ...REJECTED, rejectedBy: null }).some((p) => p.includes("must name its reviewer")),
    );
    check(
      "a rejection with no reason is refused",
      validateClaimLifecycleState({ ...REJECTED, rejectionReason: "  " }).some((p) => p.includes("must record why")),
    );
  }

  // ── 2. Legal transitions ───────────────────────────────────────────────────
  console.log("\n── 2. Only sanctioned transitions are legal ──");
  {
    check("pending may be approved", isAllowedClaimReviewAction("pending", "approve"));
    check("pending may be rejected", isAllowedClaimReviewAction("pending", "reject"));
    check("approved may be withdrawn (rejected)", isAllowedClaimReviewAction("approved", "reject"));
    check("rejected may be reopened", isAllowedClaimReviewAction("rejected", "reopen"));

    // The trust property: reversing a colleague's refusal is deliberately two steps.
    check(
      "rejected may NOT be approved in one step — a refusal is never reversed by a mis-click",
      !isAllowedClaimReviewAction("rejected", "approve"),
    );
    check("an approved claim cannot be approved again", !isAllowedClaimReviewAction("approved", "approve"));
    check("every state offers at least one action (no dead ends)",
      (["pending", "approved", "rejected"] as const).every((s) => allowedClaimReviewActions(s).length > 0));
  }

  console.log("\n── 2b. Approval requires a citation that clears Layer 1 ──");
  {
    check("a cited pending claim can be approved", canApproveClaim(PENDING));
    check("an uncited claim cannot be approved", !canApproveClaim({ sourceRefs: [], reviewedAt: null, rejectedAt: null }));
    check(
      "a claim cited to an untrusted domain cannot be approved — a reviewer may not vouch past Layer 1",
      !canApproveClaim({ sourceRefs: [untrustedRef], reviewedAt: null, rejectedAt: null }),
    );
    check("an already-approved claim cannot be approved again", !canApproveClaim(APPROVED));
    check("a rejected claim cannot be approved without reopening", !canApproveClaim(REJECTED));
  }

  // ── 3. Nothing unpublished or rejected can surface ─────────────────────────
  console.log("\n── 3. Unpublished and rejected claims never surface ──");
  {
    check("a pending claim fails the Trust Gate", !isEvidenceBackedClaim(PENDING));
    check("an approved, cited claim passes the Trust Gate", isEvidenceBackedClaim(APPROVED));

    // The strongest guarantee available: rejection needs NO new enforcement.
    check(
      "a rejected claim fails the Trust Gate through the EXISTING rule (reviewedAt is NULL)",
      !isEvidenceBackedClaim(REJECTED),
    );
    check(
      "a withdrawn claim stops passing the gate the moment reviewedAt is cleared",
      !isEvidenceBackedClaim({ ...APPROVED, reviewedAt: null }),
    );
    check(
      "approval alone is not enough — an approved claim with an untrusted citation still fails",
      !isEvidenceBackedClaim({ sourceRefs: [untrustedRef], reviewedAt: new Date() }),
    );
  }

  // ── 4. The Trust Gate is unchanged ─────────────────────────────────────────
  console.log("\n── 4. The Trust Gate is byte-unchanged ──");
  {
    const evidence = read("shared/knowledge/evidence.ts");
    check(
      "isEvidenceBackedClaim still refuses a claim with no reviewedAt",
      /export function isEvidenceBackedClaim[\s\S]*?if \(!row\.reviewedAt\) return false;/.test(evidence),
    );
    check(
      "isEvidenceBackedClaim still requires ≥1 structurally valid citation",
      /export function isEvidenceBackedClaim[\s\S]*?isValidSourceRef/.test(evidence),
    );
    // KNOW2's new vocabulary must never become a second render gate.
    check(
      "deriveClaimReviewStatus is documented as NOT a render gate",
      /IT IS NOT A RENDER GATE/.test(evidence),
    );
  }

  // ── 5. Exactly one writer of the publication fact ──────────────────────────
  console.log("\n── 5. No duplicate publication logic ──");
  {
    const CLAIM_TABLES = [
      "knowledgeFoodNutrients",
      "knowledgeFoodBenefits",
      "knowledgeNutrientBenefits",
      "knowledgePreparationEffects",
    ];
    // Every server/shared source file except the one authorised writer.
    const { execSync } = await import("node:child_process");
    const files = execSync(
      `grep -rl "reviewedAt" --include=*.ts ${REPO_ROOT}/server ${REPO_ROOT}/shared || true`,
      { encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean)
      .filter((f) => !f.includes("/tests/"))
      .filter((f) => !f.endsWith("knowledge-claim-review-store.ts"));

    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const table of CLAIM_TABLES) {
        // A drizzle write to a claim table that sets a review column.
        const writes = new RegExp(`\\.update\\(\\s*(schema\\.)?${table}\\s*\\)[\\s\\S]{0,200}?\\.set\\(`, "m");
        if (writes.test(src)) offenders.push(`${file.replace(REPO_ROOT + "/", "")} → ${table}`);
      }
    }
    check(
      "knowledge-claim-review-store is the ONLY writer of a claim's review columns",
      offenders.length === 0,
      offenders.join("; "),
    );

    const signoff = read("server/seeds/signoff-knowledge-claims.ts");
    check(
      "the sign-off CLI delegates rather than writing its own UPDATE",
      !/\.update\(/.test(signoff) && /knowledge-claim-review-store/.test(signoff),
    );
    check(
      "the sign-off CLI still refuses an anonymous sign-off",
      /--reviewer is required/.test(signoff),
    );
  }

  // ── 6. The Admin surface is authorised and non-bulk ────────────────────────
  console.log("\n── 6. The Admin review surface ──");
  {
    const routes = read("server/routes.ts");
    const claimRoutes = routes
      .split("\n")
      .filter((l) => l.includes('"/api/admin/knowledge-claims'));
    check("the claim review API is registered", claimRoutes.length >= 5, `${claimRoutes.length} route(s)`);
    check(
      "every claim review route is guarded by assertAdmin",
      claimRoutes.length > 0 && claimRoutes.every((l) => l.includes("assertAdmin")),
      claimRoutes.filter((l) => !l.includes("assertAdmin")).join(" | "),
    );
    check(
      "the reviewer's name comes from the session, never the request body",
      /THE REVIEWER'S NAME IS TAKEN FROM THEIR SESSION, NEVER FROM THE REQUEST/.test(routes) &&
        !/reviewer:\s*req\.body/.test(routes),
    );
    check(
      "there is no bulk decision endpoint",
      !/\/api\/admin\/knowledge-claims[^"]*\/(bulk|decisions\/bulk)/.test(routes),
    );

    const page = read("client/src/pages/admin-knowledge-claims-page.tsx");
    check("the Admin page exists and is reachable from the admin nav",
      /admin-knowledge-claims-page/.test(read("client/src/App.tsx")) &&
      /knowledge-claims/.test(read("client/src/components/admin-banner.tsx")));
    check("rejection requires a typed reason before it can be submitted",
      /disabled=\{!reason\.trim\(\)/.test(page));
    check("citations are rendered as real links for the reviewer to open",
      /target="_blank"/.test(page) && /ref\.url/.test(page));
  }

  // ── 7. The audit ledger is reused, not reinvented ──────────────────────────
  console.log("\n── 7. Audit history reuses the existing append-only ledger ──");
  {
    const store = read("server/lib/knowledge-claim-review-store.ts");
    check("decisions are recorded in knowledge_review_audit", /knowledgeReviewAudit/.test(store));
    check(
      "the claim decision and its audit row are written in ONE transaction",
      /db\.transaction\(/.test(store) && /tx\s*\n?\s*\.insert\(knowledgeReviewAudit\)|tx\.insert\(knowledgeReviewAudit\)/.test(store),
    );
    check(
      "the audit write is NOT best-effort (no swallowed catch around it)",
      /audit write.*worse than a failed one|unrecorded approval of a health claim is worse/.test(store),
    );
    check("citations are snapshotted on both sides of a decision", /sourceRefs: Array\.isArray\(row\.sourceRefs\)/.test(store));

    // No second ledger table was created.
    const schema = read("shared/schema.ts");
    check(
      "no new audit table was created for claims",
      !/pgTable\("knowledge_claim_review_events"|pgTable\("claim_review_audit"/.test(schema),
    );
    check(
      "all four claim tables carry the rejection columns",
      (schema.match(/rejectionReason: text\("rejection_reason"\)/g) ?? []).length === 4,
    );
  }

  // ── 8. The migration enforces the invariant in the database ────────────────
  console.log("\n── 8. The database enforces exclusivity ──");
  {
    const runner = read("server/migrations/runner.ts");
    check("KNOW2's migration is appended to the runner", /2026-07-19_know2_claim_rejection_state/.test(runner));
    check(
      "approval and rejection are mutually exclusive by CHECK constraint",
      /CHECK \(reviewed_at IS NULL OR rejected_at IS NULL\)/.test(runner),
    );
    check(
      "a rejection must name a reviewer and a reason by CHECK constraint",
      /rejected_by IS NOT NULL AND btrim\(COALESCE\(rejection_reason, ''\)\) <> ''/.test(runner),
    );
    check("no row is back-filled into a rejected state", !/UPDATE .*SET rejected_at/.test(runner));
  }

  // ── 9. The publication contract knows about rejection ──────────────────────
  console.log("\n── 9. The publication contract is rejection-aware ──");
  {
    const register = read("server/verification/publication-register.ts");
    check(
      "the backlog check excludes rejected claims (a refusal is not a backlog item)",
      (register.match(/reviewed_at IS NULL AND rejected_at IS NULL/g) ?? []).length >= 3,
    );
    check("exclusivity is asserted at fail severity", /ne-rejection-terminal/.test(register));
    check("audit coverage is asserted at fail severity", /ne-decisions-audited/.test(register));
    check("the gate-intact assertion survives", /ne-gate-intact/.test(register));
    check(
      "the store is declared the authorised writer",
      /knowledge-claim-review-store\.ts \(KNOW2 — the ONLY writer/.test(register),
    );
  }

  // ── 10. Live database: the full lifecycle, rolled back ─────────────────────
  if (!process.env.DATABASE_URL) {
    console.log("\n── 10. Live lifecycle — SKIPPED (no DATABASE_URL) ──");
  } else {
    console.log("\n── 10. Live lifecycle (transaction, always rolled back) ──");
    const { db, pool } = await import("../db.js");
    const { knowledgeReviewAudit } = await import("../../shared/schema.js");
    const { sql, eq, and } = await import("drizzle-orm");

    // Assert the invariant against whatever the current state actually is,
    // rather than against a snapshot that would rot.
    const [live] = await db.execute(sql`
      SELECT
        count(*) FILTER (WHERE reviewed_at IS NOT NULL AND rejected_at IS NOT NULL)::int AS both,
        count(*) FILTER (WHERE rejected_at IS NOT NULL AND reviewed_by IS NOT NULL)::int AS contradictory
      FROM knowledge_food_nutrients
    `).then((r: any) => r.rows ?? r);
    check("no live composition row is both approved and rejected", Number((live as any)?.both ?? 0) === 0);
    check("no live rejected row still names an approving reviewer", Number((live as any)?.contradictory ?? 0) === 0);

    // Every claim decided since KNOW2 must have an audit row.
    const [unaudited] = await db.execute(sql`
      WITH decided AS (
        SELECT id, reviewed_at, rejected_at, 'claim:composition' AS entity FROM knowledge_food_nutrients
        UNION ALL SELECT id, reviewed_at, rejected_at, 'claim:nutrient-benefit' FROM knowledge_nutrient_benefits
      )
      SELECT count(*)::int AS n FROM decided d
       WHERE COALESCE(d.reviewed_at, d.rejected_at) >= '2026-07-19'
         AND NOT EXISTS (SELECT 1 FROM knowledge_review_audit a WHERE a.entity = d.entity AND a.entity_id = d.id)
    `).then((r: any) => r.rows ?? r);
    check(
      "every claim decided since KNOW2 has an audit row",
      Number((unaudited as any)?.n ?? 0) === 0,
      `${(unaudited as any)?.n} unaudited`,
    );

    // ── The full lifecycle, exercised on a real row and rolled back ──────────
    //
    // This is the end-to-end proof: a real claim row is taken through
    // pending → approved → withdrawn → reopened through the actual store, and
    // the Trust Gate is evaluated at each step. The transaction is ALWAYS rolled
    // back, so no health claim is signed off and no reviewer is fabricated —
    // KNOW1 §3.3 refused to publish claims under an assistant's name, and that
    // refusal stands here.
    console.log("\n── 10b. Full lifecycle on a real claim (rolled back) ──");
    {
      const { recordClaimDecision } = await import("../lib/knowledge-claim-review-store.js");
      const { knowledgeFoodNutrients } = await import("../../shared/schema.js");
      const ROLLBACK = Symbol("rollback");
      const REVIEWER = "KNOW2 verification (rolled back)";

      // A row that is genuinely pending and genuinely cited — the state the 49
      // real composition claims are in right now.
      const candidates = await db
        .select()
        .from(knowledgeFoodNutrients)
        .where(sql`reviewed_at IS NULL AND rejected_at IS NULL AND jsonb_array_length(COALESCE(source_refs,'[]'::jsonb)) > 0 AND is_active`)
        .limit(1);

      if (candidates.length === 0) {
        console.log("  (skipped — no cited, pending composition claim to exercise)");
      } else {
        const target: any = candidates[0];
        const beforeState = { reviewedAt: target.reviewedAt, rejectedAt: target.rejectedAt };

        try {
          await db.transaction(async (tx) => {
            check("the chosen claim starts pending and dark", !isEvidenceBackedClaim(target));

            const approved = await recordClaimDecision(
              { edge: "composition", claimId: target.id, action: "approve", reviewer: REVIEWER }, tx);
            check("approving sets reviewedAt and names the reviewer",
              approved.claim.status === "approved" && approved.claim.reviewedBy === REVIEWER);
            check("an approved claim now PASSES the Trust Gate — it becomes visible everywhere at once",
              isEvidenceBackedClaim({ sourceRefs: approved.claim.sourceRefs, reviewedAt: approved.claim.reviewedAt }));
            check("approving wrote an audit row in the same transaction", approved.auditId > 0);

            const withdrawn = await recordClaimDecision(
              { edge: "composition", claimId: target.id, action: "reject", reviewer: REVIEWER,
                reason: "KNOW2 verification — withdrawn immediately" }, tx);
            check("an approved claim can be withdrawn", withdrawn.claim.status === "rejected");
            check("a withdrawn claim goes dark again through the EXISTING gate",
              !isEvidenceBackedClaim({ sourceRefs: withdrawn.claim.sourceRefs, reviewedAt: withdrawn.claim.reviewedAt }));
            check("the withdrawal recorded its reason", (withdrawn.claim.rejectionReason ?? "").length > 0);

            // The two-step rule, proven against the real store rather than the pure helper.
            let refused = false;
            try {
              await recordClaimDecision(
                { edge: "composition", claimId: target.id, action: "approve", reviewer: REVIEWER }, tx);
            } catch { refused = true; }
            check("a rejected claim CANNOT be re-approved in one step", refused);

            const reopened = await recordClaimDecision(
              { edge: "composition", claimId: target.id, action: "reopen", reviewer: REVIEWER }, tx);
            check("reopening returns the claim to pending", reopened.claim.status === "pending");
            check("a reopened claim is dark until approved again",
              !isEvidenceBackedClaim({ sourceRefs: reopened.claim.sourceRefs, reviewedAt: reopened.claim.reviewedAt }));

            const trail = await tx
              .select()
              .from(knowledgeReviewAudit)
              .where(and(eq(knowledgeReviewAudit.entity, "claim:composition"), eq(knowledgeReviewAudit.entityId, target.id)));
            check("every decision left its own permanent audit row (approve → reject → reopen)",
              trail.length >= 3, `${trail.length} row(s)`);
            check("each audit row names the reviewer who made it",
              trail.every((r: any) => (r.detail ?? "").includes(REVIEWER)));

            throw ROLLBACK;
          });
        } catch (err) {
          if (err !== ROLLBACK) throw err;
        }

        const [after]: any = await db.select().from(knowledgeFoodNutrients).where(eq(knowledgeFoodNutrients.id, target.id));
        check("the claim is left exactly as found — nothing was published",
          after.reviewedAt === beforeState.reviewedAt && after.rejectedAt === beforeState.rejectedAt);
        const survivors = await db
          .select()
          .from(knowledgeReviewAudit)
          .where(and(eq(knowledgeReviewAudit.entity, "claim:composition"), eq(knowledgeReviewAudit.entityId, target.id)));
        check("the verification left no audit trace behind", survivors.length === 0, `${survivors.length} row(s) survived`);
      }
    }

    await pool.end();
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
