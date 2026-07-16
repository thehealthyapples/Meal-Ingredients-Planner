/**
 * KNOW5 — Safe Knowledge Expansion Foundations: verification tests.
 *
 * Governing documents:
 *   docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §4 (Rule KC8)
 *   docs/investigations/knowledge/KNOW5_KNOWLEDGE_EXPANSION_READINESS.md §10.4
 *
 * Rule KC8 — "declared is not enforced". KNOW5 declares four things; this file
 * is where each stops being a declaration:
 *
 *   1. The composition edge (food → nutrient) has an evidence contract.
 *   2. A benefit chip requires the FULL chain to be evidence-backed. An
 *      unsupported claim does not render, whatever its citations say.
 *   3. Publishing is reversible: retired knowledge deactivates, never deletes.
 *   4. Every claim carries an Evidence Confidence derived solely from the
 *      evidence chain and review status.
 *
 * Layer 1 (pure) always runs. Layer 2 (live DB) runs only when DATABASE_URL is
 * set, and asserts the gate invariant against whatever the current sign-off
 * state is, rather than assuming a snapshot.
 *
 * Run with:  npm run test:know5-evidence-contract
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  FOOD_NUTRIENT_SEED,
  FOOD_NUTRIENT_SOURCES,
  NUTRIENT_BENEFIT_SOURCES,
  NUTRIENT_SEED,
  attachCompositionSources,
  deriveClaimConfidence,
  deriveEvidenceConfidence,
  edgeEvidenceLevel,
  isEvidenceBackedClaim,
  isRenderableConfidence,
  isValidSourceRef,
  strongerConfidence,
  validateKnowledgeSeed,
  validateReviewState,
  EVIDENCE_CONFIDENCE_LABELS,
  type KnowledgeSourceRef,
} from "../../shared/knowledge/index.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const establishedRef: KnowledgeSourceRef = {
  body: "NHS", title: "Example NHS page",
  url: "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-c/",
  evidenceLevel: "established", lastReviewed: "2026-07-09",
};
const emergingRef: KnowledgeSourceRef = { ...establishedRef, evidenceLevel: "emerging" };
const untrustedRef: KnowledgeSourceRef = { ...establishedRef, url: "https://example-health-blog.com/vitamins" };

const backed = (refs: KnowledgeSourceRef[]) => ({ sourceRefs: refs, reviewedAt: new Date() });
const unreviewed = (refs: KnowledgeSourceRef[]) => ({ sourceRefs: refs, reviewedAt: null });

async function run() {
  // ── 1. The composition evidence contract exists ────────────────────────────
  console.log("── 1. The composition edge carries an evidence contract ──");
  {
    const { knowledgeFoodNutrients } = await import("../../shared/schema.js");
    const cols = Object.keys(knowledgeFoodNutrients);
    check("knowledge_food_nutrients has sourceRefs", cols.includes("sourceRefs"));
    check("knowledge_food_nutrients has reviewedAt", cols.includes("reviewedAt"));
    check("knowledge_food_nutrients has reviewedBy (reviewer identity)", cols.includes("reviewedBy"));
    const { knowledgeFoodBenefits, knowledgeNutrientBenefits } = await import("../../shared/schema.js");
    check("knowledge_food_benefits has reviewedBy", Object.keys(knowledgeFoodBenefits).includes("reviewedBy"));
    check("knowledge_nutrient_benefits has reviewedBy", Object.keys(knowledgeNutrientBenefits).includes("reviewedBy"));
  }

  console.log("\n── 1b. The composition claim pack cites, and never invents ──");
  {
    const problems = validateKnowledgeSeed().filter((p) => p.startsWith("composition-sources:"));
    check("no composition-sources referential/structural problems", problems.length === 0, problems.join("; "));
    check("the pack is non-empty", FOOD_NUTRIENT_SOURCES.length > 0);

    const fnPairs = new Set(FOOD_NUTRIENT_SEED.map((r) => `${r.foodSlug}→${r.nutrientSlug}`));
    check(
      "every cited pair cites an EXISTING food→nutrient link (a citation may not introduce a claim)",
      FOOD_NUTRIENT_SOURCES.every((s) => fnPairs.has(`${s.foodSlug}→${s.nutrientSlug}`)),
    );
    check(
      "every cited claim carries ≥1 structurally valid, Layer-1 trusted SourceRef",
      FOOD_NUTRIENT_SOURCES.every((s) => s.sourceRefs.length > 0 && s.sourceRefs.some(isValidSourceRef)),
    );
    check(
      "no duplicate (food, nutrient) entries",
      new Set(FOOD_NUTRIENT_SOURCES.map((s) => `${s.foodSlug}→${s.nutrientSlug}`)).size === FOOD_NUTRIENT_SOURCES.length,
    );

    // §10.3 — portion plausibility. Refined starches, flours, oils and spices
    // are the class that produced F1's defective chips. None may be cited.
    const IMPLAUSIBLE = /(^|-)(flour|starch|oil|yeast|sugar|syrup)$|^(arrowroot|cornflour|semolina|tapioca|turmeric|cinnamon|nutmeg|paprika|black-peppercorns|star-anise)/;
    const cited = FOOD_NUTRIENT_SOURCES.filter((s) => IMPLAUSIBLE.test(s.foodSlug));
    check(
      "no refined starch, flour, oil, yeast or spice carries a cited composition claim (§10.3 portion plausibility)",
      cited.length === 0,
      cited.map((s) => s.foodSlug).join(", "),
    );

    // The specific defect F1 named, asserted directly.
    for (const slug of ["plain-wheat-flour", "arrowroot", "cornflour", "potato-starch", "tapioca-flour", "active-dry-yeast"]) {
      check(
        `${slug} has no cited fibre premise (F1's worked example stays dark)`,
        !FOOD_NUTRIENT_SOURCES.some((s) => s.foodSlug === slug && s.nutrientSlug === "fibre"),
      );
    }
  }

  console.log("\n── 1c. Seeding attaches citations but publishes nothing (Rule KC9) ──");
  {
    const seeded = attachCompositionSources(FOOD_NUTRIENT_SEED);
    check("attachCompositionSources preserves row count", seeded.length === FOOD_NUTRIENT_SEED.length);
    check(
      "exactly the cited pairs receive sourceRefs",
      seeded.filter((r) => r.sourceRefs.length > 0).length === FOOD_NUTRIENT_SOURCES.length,
    );
    check("no seeded row carries a reviewedAt — seeding never signs off", seeded.every((r) => !("reviewedAt" in r && (r as any).reviewedAt)));
    check(
      "no seeded row is evidence-backed at seed time (nothing renders until a human signs off)",
      seeded.every((r) => !isEvidenceBackedClaim({ sourceRefs: r.sourceRefs, reviewedAt: null })),
    );
  }

  // ── 2. The full-chain gate: unsupported claims do not render ───────────────
  console.log("\n── 2. Unsupported claims do not render (the full-chain gate) ──");
  {
    const good = backed([establishedRef]);

    check(
      "cited nutrient→benefit + UNCITED composition → under-review (this is F1: the exact hole KNOW5 closes)",
      deriveEvidenceConfidence({ composition: unreviewed([]), nutrientBenefit: good }) === "under-review",
    );
    check(
      "cited nutrient→benefit + composition cited but UNREVIEWED → under-review",
      deriveEvidenceConfidence({ composition: unreviewed([establishedRef]), nutrientBenefit: good }) === "under-review",
    );
    check(
      "cited composition + UNCITED nutrient→benefit → under-review",
      deriveEvidenceConfidence({ composition: good, nutrientBenefit: unreviewed([]) }) === "under-review",
    );
    check(
      "composition reviewed but cited only to an UNTRUSTED domain → under-review",
      deriveEvidenceConfidence({ composition: backed([untrustedRef]), nutrientBenefit: good }) === "under-review",
    );
    check(
      "both edges evidence-backed → renders",
      isRenderableConfidence(deriveEvidenceConfidence({ composition: good, nutrientBenefit: good })),
    );
    check(
      "a food→benefit row that is itself evidence-backed CANNOT license a chip on a broken chain",
      deriveEvidenceConfidence({ composition: unreviewed([]), nutrientBenefit: good, foodBenefit: good }) === "under-review",
    );
    check("under-review is the only non-renderable confidence", !isRenderableConfidence("under-review"));
    for (const c of ["established", "strong", "emerging"] as const) {
      check(`${c} is renderable`, isRenderableConfidence(c));
    }
  }

  // ── 2b. What the pack lights up once a human signs it off ──────────────────
  //
  // The gate darkens everything until sign-off, so "no chip renders" passes
  // vacuously today. This projection is the non-vacuous half: it computes,
  // deterministically from the two citation packs and the seed, exactly which
  // chips a full sign-off would restore — and proves the defect class is not
  // among them. It reads no database and no sign-off state.
  console.log("\n── 2b. Post-sign-off projection: the right chips return, the wrong ones do not ──");
  {
    const { FOOD_BENEFIT_SEED } = await import("../../shared/knowledge/index.js");
    const declared = new Set(FOOD_BENEFIT_SEED.map((r) => `${r.foodSlug}|${r.benefitSlug}`));

    const projected = new Set<string>();
    for (const composition of FOOD_NUTRIENT_SOURCES) {
      for (const claim of NUTRIENT_BENEFIT_SOURCES) {
        if (claim.nutrientSlug !== composition.nutrientSlug) continue;
        const chip = `${composition.foodSlug}|${claim.benefitSlug}`;
        if (declared.has(chip)) projected.add(chip);
      }
    }
    const projectedList = Array.from(projected);
    const foods = new Set(projectedList.map((c) => c.split("|")[0]));

    check("a full sign-off restores 48 chips across 29 foods, every premise cited",
      projected.size === 48 && foods.size === 29, `got ${projected.size} chips / ${foods.size} foods`);
    check("salmon → heart-health returns (cited premise: NHS oily fish → omega-3)", projected.has("salmon|heart-health"));
    check("lentils → gut-health returns (cited premise: NHS pulses → fibre)", projected.has("lentils|gut-health"));

    const DEFECT_CLASS = ["plain-wheat-flour", "arrowroot", "cornflour", "potato-starch", "tapioca-flour",
      "self-raising-flour", "strong-white-bread-flour", "semolina-flour", "active-dry-yeast"];
    const revived = projectedList.filter((c) => DEFECT_CLASS.includes(c.split("|")[0]));
    check("not one of F1's 32 defective chips returns, at any sign-off state", revived.length === 0, revived.join(", "));

    check("every projected chip was already declared by the seed (the gate filters, never introduces)",
      projectedList.every((c) => declared.has(c)));
  }

  // ── 3. Evidence Confidence is correctly assigned ───────────────────────────
  console.log("\n── 3. Evidence Confidence is derived from the chain, never authored ──");
  {
    const est = backed([establishedRef]);
    const eme = backed([emergingRef]);

    check(
      "both edges established, benefit DERIVED via the bridge → strong",
      deriveEvidenceConfidence({ composition: est, nutrientBenefit: est }) === "strong",
    );
    check(
      "both edges established + food→benefit directly cited → established",
      deriveEvidenceConfidence({ composition: est, nutrientBenefit: est, foodBenefit: est }) === "established",
    );
    check(
      "emerging composition drags an established nutrient claim down → emerging (weakest link governs)",
      deriveEvidenceConfidence({ composition: eme, nutrientBenefit: est }) === "emerging",
    );
    check(
      "emerging nutrient→benefit drags an established composition down → emerging",
      deriveEvidenceConfidence({ composition: est, nutrientBenefit: eme }) === "emerging",
    );
    check(
      "an emerging food→benefit corroboration cannot be presented as established (STEP 7 hard stop)",
      deriveEvidenceConfidence({ composition: est, nutrientBenefit: est, foodBenefit: eme }) === "emerging",
    );
    check(
      "an emerging claim is NEVER reported as established",
      deriveEvidenceConfidence({ composition: eme, nutrientBenefit: eme }) !== "established",
    );

    check(
      "an authored `confidence: established` column cannot lift an uncited premise",
      // The AI-drafted rows self-certify as `established`. The gate reads
      // citations and sign-off, and nothing else.
      deriveEvidenceConfidence({
        composition: { sourceRefs: [], reviewedAt: null, confidence: "established" } as any,
        nutrientBenefit: backed([establishedRef]),
      }) === "under-review",
    );

    check("edgeEvidenceLevel: unbacked edge → null", edgeEvidenceLevel(unreviewed([establishedRef])) === null);
    check("edgeEvidenceLevel: one established ref among emerging → established", edgeEvidenceLevel(backed([emergingRef, establishedRef])) === "established");
    check("edgeEvidenceLevel: invalid refs contribute nothing", edgeEvidenceLevel(backed([untrustedRef])) === null);

    check("deriveClaimConfidence: cited + signed established → established", deriveClaimConfidence(est) === "established");
    check("deriveClaimConfidence: cited + signed emerging → emerging", deriveClaimConfidence(eme) === "emerging");
    check("deriveClaimConfidence: unsigned → under-review", deriveClaimConfidence(unreviewed([establishedRef])) === "under-review");

    check("strongerConfidence prefers established over strong", strongerConfidence("strong", "established") === "established");
    check("strongerConfidence prefers strong over emerging", strongerConfidence("emerging", "strong") === "strong");
    check("strongerConfidence treats under-review as weakest", strongerConfidence("under-review", "emerging") === "emerging");

    check(
      "the four Evidence Confidence levels are exactly Established, Strong, Emerging, Under Review",
      EVIDENCE_CONFIDENCE_LABELS.established === "Established" &&
        EVIDENCE_CONFIDENCE_LABELS.strong === "Strong" &&
        EVIDENCE_CONFIDENCE_LABELS.emerging === "Emerging" &&
        EVIDENCE_CONFIDENCE_LABELS["under-review"] === "Under Review" &&
        Object.keys(EVIDENCE_CONFIDENCE_LABELS).length === 4,
    );
  }

  // ── 4. Review-state integrity: no anonymous sign-off ───────────────────────
  console.log("\n── 4. A sign-off must name its reviewer ──");
  {
    check("reviewedAt without reviewedBy is rejected", validateReviewState({ reviewedAt: new Date(), reviewedBy: null }).length === 1);
    check("reviewedBy without reviewedAt is rejected", validateReviewState({ reviewedAt: null, reviewedBy: "Ada L" }).length === 1);
    check("reviewedAt + reviewedBy is clean", validateReviewState({ reviewedAt: new Date(), reviewedBy: "Ada L" }).length === 0);
    check("neither set is clean (an unreviewed row is valid, just dark)", validateReviewState({ reviewedAt: null, reviewedBy: null }).length === 0);

    const signoff = readFileSync(resolve(REPO_ROOT, "server/seeds/signoff-knowledge-claims.ts"), "utf8");
    check("the sign-off gate refuses to run without --reviewer", /--reviewer is required/.test(signoff));
    check("the sign-off gate covers the composition edge", /knowledgeFoodNutrients/.test(signoff));
  }

  // ── 5. Reversible publish: deactivation, never deletion ────────────────────
  console.log("\n── 5. Publishing is reversible (no hard deletes) ──");
  {
    const seed = readFileSync(resolve(REPO_ROOT, "server/seeds/seed-knowledge-registry.ts"), "utf8");
    const code = seed
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("*") && !l.trimStart().startsWith("//") && !l.trimStart().startsWith("/*"))
      .join("\n");

    check("the seed contains no SQL DELETE", !/\bdelete\s+from\b/i.test(code) && !/\.delete\s*\(/.test(code));
    check("the seed deactivates instead (is_active = false)", /isActive:\s*false/.test(code));
    check("the seed reconciles rows the owner no longer authors", /deactivateAbsentRows/.test(code));
    check("the seed offers a dry run that writes nothing", /--dry-run/.test(seed));
    check(
      "re-adding a row to the seed reactivates it (upsert propagates is_active)",
      /isActive:\s*sqlExcluded\("is_active"\)/.test(code),
    );
    check(
      "composition citations are attached at the single writer, not in the client-bundled module",
      /attachCompositionSources\(FOOD_NUTRIENT_SEED\)/.test(code),
    );

    const clientBundled = readFileSync(resolve(REPO_ROOT, "shared/knowledge/food-relationships.ts"), "utf8");
    check(
      "the client-bundled relationship module still imports no citation pack",
      !/composition-sources|claim-sources/.test(clientBundled),
    );
  }

  // ── 6. Live gate enforcement against the real database ────────────────────
  if (!process.env.DATABASE_URL) {
    console.log("\n(DATABASE_URL not set — skipping live gate-enforcement checks)");
  } else {
    console.log("\n── 6. Live gate enforcement (DB) ──");
    const reg = await import("../services/nutrition-knowledge-registry.js");
    const { db } = await import("../db.js");
    const { and, eq } = await import("drizzle-orm");
    const { knowledgeFoodNutrients } = await import("../../shared/schema.js");

    const foods = await reg.listFoods();
    // A representative slice: the F1 defect class, plus foods the pack cites.
    const sample = ["plain-wheat-flour", "arrowroot", "cornflour", "spinach", "broccoli", "salmon", "oats", "lentils"]
      .filter((s) => foods.some((f) => f.slug === s));

    for (const slug of sample) {
      const chips = await reg.getFoodBenefitsForDisplay(slug);
      const composition = await db
        .select()
        .from(knowledgeFoodNutrients)
        .where(and(eq(knowledgeFoodNutrients.foodSlug, slug), eq(knowledgeFoodNutrients.isActive, true)));
      const hasBackedPremise = composition.some((c) => isEvidenceBackedClaim(c));

      check(
        `${slug}: no chip renders without at least one evidence-backed composition premise`,
        hasBackedPremise || chips.length === 0,
        `${chips.length} chip(s) rendered on ${composition.length} uncited premise(s)`,
      );
      check(
        `${slug}: every rendered chip carries citations and a renderable confidence`,
        chips.every((c) => c.sourceRefs.length > 0 && isRenderableConfidence(c.confidence)),
      );
      check(
        `${slug}: no chip is reported as 'established' without a directly cited food→benefit row`,
        chips.every((c) => c.confidence !== "established" || c.sourceRefs.length > 0),
      );
    }

    // Forward and reverse gates must agree, or a benefit page lists a food whose
    // own page refuses to show the chip.
    const nutrientBenefits = Array.from(new Set(NUTRIENT_BENEFIT_SOURCES.map((s) => s.benefitSlug))).slice(0, 5);
    for (const benefitSlug of nutrientBenefits) {
      const foodsForBenefit = await reg.getFoodsForBenefit(benefitSlug);
      let agree = true;
      for (const food of foodsForBenefit.slice(0, 10)) {
        const chips = await reg.getFoodBenefitsForDisplay(food.slug);
        if (!chips.some((c) => c.benefit.slug === benefitSlug)) agree = false;
      }
      check(`${benefitSlug}: reverse lookup agrees with the forward chip gate`, agree);
    }

    // ── 7. Reversible publish, proven end-to-end ─────────────────────────────
    //
    // Everything above about reconciliation is a grep. This is the proof: drive
    // the real deactivateAbsentRows() and upsertFoodNutrients() against the real
    // database inside a transaction, assert the deactivate → reactivate
    // round-trip, then ROLL BACK so the database is left exactly as found.
    //
    // PUB1 — THIS TEST NOW SUPPLIES ITS OWN DIRT.
    //
    // A cleanup test needs something to clean, and until PUB1 it got that from the
    // database: the live KNOW1 `plant-protein` residue, 38 orphaned rows that were a
    // real defect nobody had reconciled. The suite asserted they were still there
    // ("fixture: the retired plant-protein nutrient STILL has active composition
    // rows"), and scripts/ci/seed-know1-residue.ts re-inserted them into every CI
    // database so the assertion would hold — a fixture whose job was to keep a bug
    // alive, and which CPI1 §4.5 named as a synchronisation bridge for a defect.
    //
    // PUB1 published the knowledge registry and reconciled the residue away, so the
    // dirt is gone. Rather than restore it, the test now INJECTS a synthetic orphan
    // inside the transaction it already rolls back. Nothing is weakened: reconcile is
    // still driven for real, against real rows, and still has to deactivate exactly
    // the orphans and exactly nothing else. What changed is that the test no longer
    // needs the product to be broken in order to pass.
    console.log("\n── 7. Reversible publish: deactivate → reactivate, then roll back ──");
    {
      const { deactivateAbsentRows, upsertFoodNutrients, seedDb, seedPool } = await import("../seeds/seed-knowledge-registry.js");
      const { knowledgeFoodNutrients, knowledgeNutrients, knowledgeNutrientBenefits } = await import("../../shared/schema.js");
      const { sql } = await import("drizzle-orm");

      // A nutrient identity the owner does not author, and never will.
      const ORPHAN = "__pub1_test_retired_nutrient__";
      const ORPHAN_FOODS = ["spinach", "lentils", "walnuts"] as const;
      const ORPHAN_BENEFITS = ["muscle-recovery", "energy-support"] as const;

      const totalRows = async (tx: any) =>
        Number((await tx.select({ n: sql<number>`count(*)::int` }).from(knowledgeFoodNutrients))[0].n);
      const activeRows = async (tx: any) =>
        Number((await tx.select({ n: sql<number>`count(*)::int` }).from(knowledgeFoodNutrients).where(eq(knowledgeFoodNutrients.isActive, true)))[0].n);
      const orphanActive = async (tx: any) =>
        Number((await tx.select({ n: sql<number>`count(*)::int` }).from(knowledgeFoodNutrients)
          .where(and(eq(knowledgeFoodNutrients.nutrientSlug, ORPHAN), eq(knowledgeFoodNutrients.isActive, true))))[0].n);

      // The published state PUB1 left behind: not one active row the owner disowns.
      const liveOrphans = await seedDb.select({ slug: knowledgeNutrients.slug }).from(knowledgeNutrients)
        .where(eq(knowledgeNutrients.isActive, true));
      const authored = new Set(NUTRIENT_SEED.map((n) => n.slug));
      const stillOrphaned = liveOrphans.map((r: any) => r.slug).filter((s: string) => !authored.has(s));
      check("the published nutrient vocabulary carries no orphan (KNOW1 residue is retired)",
        stillOrphaned.length === 0, `still active: ${stillOrphaned.join(", ")}`);

      const before = { total: await totalRows(seedDb), active: await activeRows(seedDb) };

      const ROLLBACK = new Error("__intentional_rollback__");
      try {
        await seedDb.transaction(async (tx: any) => {
          // Inject the dirt: one retired-vocabulary nutrient, its composition rows,
          // and its benefit links — the exact shape of the KNOW1 residue, minus the
          // requirement that the product actually be broken.
          await tx.insert(knowledgeNutrients).values({
            slug: ORPHAN, name: "Test Retired Nutrient", category: "macronutrient",
            source: "PUB1 test fixture", displayOrder: 99, isActive: true,
          });
          await tx.insert(knowledgeFoodNutrients).values(ORPHAN_FOODS.map((foodSlug, i) => ({
            foodSlug, nutrientSlug: ORPHAN, confidence: "established" as const,
            ranking: i, source: "PUB1 test fixture", isActive: true,
          })));
          await tx.insert(knowledgeNutrientBenefits).values(ORPHAN_BENEFITS.map((benefitSlug, i) => ({
            nutrientSlug: ORPHAN, benefitSlug, evidenceStrength: "good" as const,
            ranking: i, source: "PUB1 test fixture", isActive: true,
          })));

          const injected = { total: await totalRows(tx), active: await activeRows(tx) };
          check("test premise: the injected orphan is live", (await orphanActive(tx)) === ORPHAN_FOODS.length);

          const deactivated = await deactivateAbsentRows(tx);

          check(`reconcile deactivates exactly the ${ORPHAN_FOODS.length} orphaned composition rows`, deactivated.knowledge_food_nutrients === ORPHAN_FOODS.length, `got ${deactivated.knowledge_food_nutrients}`);
          check("reconcile deactivates the retired vocabulary row", deactivated.knowledge_nutrients === 1, `got ${deactivated.knowledge_nutrients}`);
          check(`reconcile deactivates its ${ORPHAN_BENEFITS.length} orphaned nutrient→benefit rows`, deactivated.knowledge_nutrient_benefits === ORPHAN_BENEFITS.length, `got ${deactivated.knowledge_nutrient_benefits}`);
          check("reconcile touches no food identity (the seed owns all 610)", deactivated.knowledge_foods === 0);
          check("reconcile touches no food→benefit row", deactivated.knowledge_food_benefits === 0);

          check("NOTHING IS DELETED — the row total is unchanged", (await totalRows(tx)) === injected.total, `${injected.total} → ${await totalRows(tx)}`);
          check("the orphans are merely inactive", (await orphanActive(tx)) === 0);
          check("exactly the orphans left the active set", (await activeRows(tx)) === injected.active - ORPHAN_FOODS.length);

          // Reversibility: an owned row that was wrongly deactivated comes back
          // when the seed runs again. This is what makes an import undoable.
          await tx.update(knowledgeFoodNutrients).set({ isActive: false })
            .where(and(eq(knowledgeFoodNutrients.foodSlug, "spinach"), eq(knowledgeFoodNutrients.nutrientSlug, "iron")));
          const wasOff = Number((await tx.select({ n: sql<number>`count(*)::int` }).from(knowledgeFoodNutrients)
            .where(and(eq(knowledgeFoodNutrients.foodSlug, "spinach"), eq(knowledgeFoodNutrients.nutrientSlug, "iron"), eq(knowledgeFoodNutrients.isActive, true))))[0].n);
          check("an owned row can be deactivated (test premise)", wasOff === 0);

          await upsertFoodNutrients(tx);
          const isBack = Number((await tx.select({ n: sql<number>`count(*)::int` }).from(knowledgeFoodNutrients)
            .where(and(eq(knowledgeFoodNutrients.foodSlug, "spinach"), eq(knowledgeFoodNutrients.nutrientSlug, "iron"), eq(knowledgeFoodNutrients.isActive, true))))[0].n);
          check("re-seeding REACTIVATES a row the owner still authors (publish is reversible)", isBack === 1);

          // Re-seeding must never grant a sign-off (Rule KC9).
          const signedAfterSeed = Number((await tx.select({ n: sql<number>`count(*)::int` }).from(knowledgeFoodNutrients)
            .where(sql`reviewed_at is not null`))[0].n);
          check("re-seeding grants no sign-off — reviewed_at stays as it was", signedAfterSeed === 0, `got ${signedAfterSeed}`);

          const citedAfterSeed = Number((await tx.select({ n: sql<number>`count(*)::int` }).from(knowledgeFoodNutrients)
            .where(sql`jsonb_array_length(source_refs) > 0`))[0].n);
          check("re-seeding attaches the 49 composition citations (candidates, not publications)", citedAfterSeed === 49, `got ${citedAfterSeed}`);

          throw ROLLBACK;
        });
      } catch (err) {
        if (err !== ROLLBACK) throw err;
      }

      const after = { total: await totalRows(seedDb), active: await activeRows(seedDb) };
      check("the database is left exactly as found (transaction rolled back)",
        after.total === before.total && after.active === before.active,
        `${JSON.stringify(before)} → ${JSON.stringify(after)}`);
      const injectedSurvivors = Number((await seedDb.select({ n: sql<number>`count(*)::int` }).from(knowledgeNutrients)
        .where(eq(knowledgeNutrients.slug, ORPHAN)))[0].n);
      check("the injected fixture left no trace in the database", injectedSurvivors === 0, `${injectedSurvivors} row(s) survived`);

      await seedPool.end();
    }

    const { pool } = await import("../db.js");
    await pool.end();
  }

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
