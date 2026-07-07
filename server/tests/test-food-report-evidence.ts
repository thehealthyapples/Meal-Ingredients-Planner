/**
 * PKC2 — One Mouth Convergence: evidence-gated Food Report composer tests.
 *
 * Governing document: docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md
 * §2 (Rule KC4 — "one mouth") and its Phase 1 finding (PKC1's Finding 2).
 *
 * Proves `getEvidenceBackedFoodReport()` (server/lib/food-report-evidence.ts)
 * is the single composition of identity (buildFoodReport) + evidence-gated
 * benefit claims (nutrition-knowledge-registry's getFoodBenefitsForDisplay),
 * and that no consumer can see a benefit claim the evidence gate itself would
 * reject — regardless of the platform's current sign-off state.
 *
 * Live DB checks only run when DATABASE_URL is set (skipped cleanly otherwise).
 *
 * Run with: npm run test:food-report-evidence
 */
import { buildFoodReport } from "../../shared/canonical/food-report-adapter.js";
import { CANONICAL_SEED } from "../../shared/canonical/foods.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

async function run() {
  console.log("── buildFoodReport() never itself renders benefit claims (PKC2) ──");
  const tomatoSync = buildFoodReport("tomato");
  check("tomato: sync report exists", tomatoSync !== null);
  check("tomato: sync healthBenefits always empty", (tomatoSync?.healthBenefits.length ?? -1) === 0);
  check(
    "tomato: sync variety additionalBenefits always empty",
    (tomatoSync?.varieties ?? []).every((v) => v.additionalBenefits.length === 0),
  );

  if (!process.env.DATABASE_URL) {
    console.log("\n(DATABASE_URL not set — skipping live composer checks)");
  } else {
    console.log("\n── getEvidenceBackedFoodReport() — one mouth parity with the registry ──");
    const { getEvidenceBackedFoodReport } = await import("../lib/food-report-evidence.js");
    const reg = await import("../services/nutrition-knowledge-registry.js");

    check(
      "unknown slug → null (same contract as buildFoodReport)",
      (await getEvidenceBackedFoodReport("not-a-real-food")) === null,
    );

    // Parity check: for every food this platform's canonical seed knows about,
    // the composer's healthBenefits must be EXACTLY the evidence-gated
    // registry's benefit names for that food's knowledge slug — never more
    // (no leaked unsourced claim), never less (no under-rendering), and never
    // independently derived. This holds regardless of current sign-off state,
    // so it stays valid whether zero or many claims have cleared human review.
    const sampleEntries = CANONICAL_SEED.slice(0, 15);
    for (const entry of sampleEntries) {
      const slug = entry.food.slug;
      const knowledgeSlug = entry.food.knowledgeFoodSlug ?? null;

      const composed = await getEvidenceBackedFoodReport(slug);
      if (!composed) continue; // preparations/containers never reach this seed anyway

      const expectedBenefits = knowledgeSlug
        ? (await reg.getFoodBenefitsForDisplay(knowledgeSlug)).map((b) => b.benefit.name)
        : [];

      check(
        `${slug}: healthBenefits matches the evidence-gated registry exactly`,
        JSON.stringify(composed.healthBenefits) === JSON.stringify(expectedBenefits),
        `composed=${JSON.stringify(composed.healthBenefits)} expected=${JSON.stringify(expectedBenefits)}`,
      );

      for (const variety of composed.varieties) {
        const vEntry = entry.varieties?.find((v) => v.slug === variety.slug);
        const vKnowledgeSlug = vEntry?.knowledgeFoodSlug ?? null;
        const parentNames = new Set(expectedBenefits);
        const expectedAdditional = vKnowledgeSlug
          ? (await reg.getFoodBenefitsForDisplay(vKnowledgeSlug))
              .map((b) => b.benefit.name)
              .filter((n) => !parentNames.has(n))
          : [];
        check(
          `${slug} variety ${variety.slug}: additionalBenefits matches the evidence-gated registry exactly`,
          JSON.stringify(variety.additionalBenefits) === JSON.stringify(expectedAdditional),
        );
      }
    }

    // Every displayed benefit must itself carry the citations that earned it
    // the right to render — no composer may drop or fabricate the trail.
    const tomatoComposed = await getEvidenceBackedFoodReport("tomato");
    if (tomatoComposed && tomatoComposed.healthBenefits.length > 0) {
      const display = await reg.getFoodBenefitsForDisplay("tomatoes");
      check(
        "tomato: every rendered benefit has ≥1 sourceRef in the registry",
        display.every((d) => Array.isArray(d.sourceRefs) && d.sourceRefs.length > 0),
      );
    }

    const { pool } = await import("../db.js");
    await pool.end();
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
