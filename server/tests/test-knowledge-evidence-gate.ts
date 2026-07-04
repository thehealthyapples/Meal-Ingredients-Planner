/**
 * PKC Phase 0 — Layer-2 claim-trust gate verification tests.
 *
 * Governing document: docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §4.
 * Rule KC8 ("declared is not enforced") requires every evidence layer to have
 * a running, automated validator — this is that validator's test coverage.
 *
 * Two layers:
 *   1. Pure gate-logic + editorial-data checks (no DB needed) — always run.
 *   2. Live end-to-end checks against the seeded DB — run only when
 *      DATABASE_URL is set (skipped cleanly otherwise). These assert the
 *      gate invariant holds against whatever the current sign-off state is,
 *      rather than assuming a specific reviewed/unreviewed snapshot.
 *
 * Run with:  npm run test:knowledge-evidence-gate
 */
import {
  validateSourceRef,
  isValidSourceRef,
  isEvidenceBackedClaim,
  isTrustedSourceUrl,
  NUTRIENT_BENEFIT_SOURCES,
  SOURCED_LAUNCH_BENEFITS,
  NUTRIENT_BENEFITS,
  validateKnowledgeSeed,
  type KnowledgeSourceRef,
} from "../../shared/knowledge/index.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

const validRef: KnowledgeSourceRef = {
  body: "NHS",
  title: "Example NHS page",
  url: "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-c/",
  evidenceLevel: "established",
  lastReviewed: "2026-07-03",
};

async function run() {
  console.log("── Layer 1 — source trust (isTrustedSourceUrl) ──");
  check("nhs.uk is trusted", isTrustedSourceUrl("https://www.nhs.uk/some/page"));
  check("efsa.europa.eu is trusted", isTrustedSourceUrl("https://efsa.europa.eu/some/page"));
  check("a subdomain of a trusted domain is trusted", isTrustedSourceUrl("https://eur-lex.europa.eu/legal-content"));
  check("an untrusted domain is rejected", !isTrustedSourceUrl("https://example-health-blog.com/vitamins"));
  check("a banned-style AI/blog domain is rejected", !isTrustedSourceUrl("https://medium.com/@someone/vitamins"));
  check("http (non-https) is rejected even on a trusted domain", !isTrustedSourceUrl("http://www.nhs.uk/some/page"));
  check("a malformed URL is rejected, not thrown", !isTrustedSourceUrl("not a url"));

  console.log("\n── Layer 2 — structural SourceRef validation ──");
  check("a fully valid ref passes", isValidSourceRef(validRef), validateSourceRef(validRef).join("; "));
  check("missing body fails", !isValidSourceRef({ ...validRef, body: "" }));
  check("missing title fails", !isValidSourceRef({ ...validRef, title: "" }));
  check("missing url fails", !isValidSourceRef({ ...validRef, url: "" }));
  check("untrusted url fails", !isValidSourceRef({ ...validRef, url: "https://example.com/vitamin-c" }));
  check("invalid evidenceLevel fails", !isValidSourceRef({ ...validRef, evidenceLevel: "very-strong" as any }));
  check("non-ISO lastReviewed fails", !isValidSourceRef({ ...validRef, lastReviewed: "3rd July 2026" }));
  check("null is not a valid ref", !isValidSourceRef(null));
  check("a non-object is not a valid ref", !isValidSourceRef("a source"));
  check("validateSourceRef on a valid ref returns no problems", validateSourceRef(validRef).length === 0);
  check("validateSourceRef on an empty object returns multiple problems", validateSourceRef({}).length >= 4);

  console.log("\n── Layer 2 — the Phase 0 render gate (isEvidenceBackedClaim) ──");
  check(
    "no reviewedAt (even with a valid ref) → not evidence-backed (Rule KC9: automation authors, never publishes)",
    !isEvidenceBackedClaim({ sourceRefs: [validRef], reviewedAt: null }),
  );
  check(
    "reviewedAt set but zero sourceRefs → not evidence-backed",
    !isEvidenceBackedClaim({ sourceRefs: [], reviewedAt: new Date() }),
  );
  check(
    "reviewedAt set but only invalid refs → not evidence-backed",
    !isEvidenceBackedClaim({ sourceRefs: [{ ...validRef, url: "https://example.com" }], reviewedAt: new Date() }),
  );
  check(
    "reviewedAt set + ≥1 structurally valid ref → evidence-backed",
    isEvidenceBackedClaim({ sourceRefs: [validRef], reviewedAt: new Date() }),
  );
  check(
    "a mix of one bad ref and one good ref still passes if any ref is valid",
    isEvidenceBackedClaim({ sourceRefs: [{ ...validRef, url: "https://example.com" }, validRef], reviewedAt: new Date() }),
  );
  check(
    "sourceRefs that isn't an array → not evidence-backed (defensive, no throw)",
    !isEvidenceBackedClaim({ sourceRefs: "not-an-array" as any, reviewedAt: new Date() }),
  );

  console.log("\n── Sourced claim pack (claim-sources.ts) — editorial integrity ──");
  const seedProblems = validateKnowledgeSeed().filter((p) => p.startsWith("claim-sources:"));
  check("no claim-sources referential/structural problems", seedProblems.length === 0, seedProblems.join("; "));
  check("claim pack is non-empty", NUTRIENT_BENEFIT_SOURCES.length > 0);
  check(
    "every sourced pair cites an existing NUTRIENT_BENEFITS link (citations never invent claims)",
    NUTRIENT_BENEFIT_SOURCES.every((s) => (NUTRIENT_BENEFITS[s.nutrientSlug] ?? []).includes(s.benefitSlug)),
  );
  check(
    "every sourced claim carries ≥1 structurally valid SourceRef",
    NUTRIENT_BENEFIT_SOURCES.every((s) => s.sourceRefs.length > 0 && s.sourceRefs.some(isValidSourceRef)),
  );
  check(
    "no duplicate (nutrient, benefit) entries in the claim pack",
    new Set(NUTRIENT_BENEFIT_SOURCES.map((s) => `${s.nutrientSlug}→${s.benefitSlug}`)).size === NUTRIENT_BENEFIT_SOURCES.length,
  );
  check(
    "covers the Master Roadmap §6 minimum 5 launch benefits",
    SOURCED_LAUNCH_BENEFITS.length === 5 &&
      SOURCED_LAUNCH_BENEFITS.every((b) => NUTRIENT_BENEFIT_SOURCES.some((s) => s.benefitSlug === b)),
  );
  check(
    "every launch benefit is reachable via at least one evidence-backed-shaped claim",
    SOURCED_LAUNCH_BENEFITS.every((benefitSlug) =>
      NUTRIENT_BENEFIT_SOURCES.some(
        (s) => s.benefitSlug === benefitSlug && isEvidenceBackedClaim({ sourceRefs: s.sourceRefs, reviewedAt: new Date() }),
      ),
    ),
  );

  if (!process.env.DATABASE_URL) {
    console.log("\n(DATABASE_URL not set — skipping live gate-enforcement checks)");
  } else {
    console.log("\n── Live gate enforcement (DB) — the render gate holds for real rows ──");
    const reg = await import("../services/nutrition-knowledge-registry.js");

    // Cross-check the gate against every nutrient this claim pack covers: the
    // display helper must include a benefit iff the underlying raw row is
    // evidence-backed — regardless of current sign-off state.
    const nutrientSlugs = Array.from(new Set(NUTRIENT_BENEFIT_SOURCES.map((s) => s.nutrientSlug)));
    for (const nutrientSlug of nutrientSlugs) {
      const raw = await reg.getBenefitsForNutrient(nutrientSlug);
      const display = await reg.getNutrientBenefitsForDisplay(nutrientSlug);
      const displaySlugs = new Set(display.map((d) => d.benefit.slug));

      check(
        `${nutrientSlug}: every displayed benefit is evidence-backed`,
        display.every((d) => {
          const rawRow = raw.find((r) => r.benefit.slug === d.benefit.slug);
          return !!rawRow && isEvidenceBackedClaim(rawRow);
        }),
      );
      check(
        `${nutrientSlug}: every evidence-backed raw row is displayed (no under-rendering)`,
        raw.filter((r) => isEvidenceBackedClaim(r)).every((r) => displaySlugs.has(r.benefit.slug)),
      );
      check(
        `${nutrientSlug}: every non-evidence-backed raw row is absent from display (no leak)`,
        raw.filter((r) => !isEvidenceBackedClaim(r)).every((r) => !displaySlugs.has(r.benefit.slug)),
      );
      check(
        `${nutrientSlug}: display rows carry the citations that earned them the right to render`,
        display.every((d) => Array.isArray(d.sourceRefs) && d.sourceRefs.length > 0),
      );
    }

    // Food-level chips render only via the nutrient bridge — spot-check a food
    // known to link to a benefit this claim pack corroborates via nutrients.
    const foods = await reg.listFoods();
    if (foods.length > 0) {
      const sampleFood = foods[0].slug;
      const foodDisplay = await reg.getFoodBenefitsForDisplay(sampleFood);
      check(
        `${sampleFood}: food-level display benefits all carry inherited citations`,
        foodDisplay.every((d) => Array.isArray(d.sourceRefs) && d.sourceRefs.length > 0),
      );
    }

    const { pool } = await import("../db.js");
    await pool.end();
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
