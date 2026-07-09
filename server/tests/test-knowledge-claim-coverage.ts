/**
 * KNOW1 — sourced-claim coverage and honest-gap verification.
 *
 * Governing documents:
 *   docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §4 (Rule KC8/KC9)
 *   docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md (Rules NK2, NK3)
 *   docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md §5 (Rules E1, E2)
 *
 * `test-knowledge-evidence-gate.ts` proves the GATE works. This proves the
 * KNOWLEDGE behind it is honest: that every claim which would render is sourced,
 * that the claim pack introduces no source domain nobody link-checked, and that
 * the benefits THA cannot yet cite stay visibly, deliberately dark rather than
 * quietly acquiring a plausible citation.
 *
 * Pure — reads the editorial seed only. No DB, no network. Run with:
 *   npm run test:knowledge-claim-coverage
 */
import {
  FOOD_NUTRIENTS,
  FOOD_BENEFITS,
  NUTRIENT_BENEFITS,
  NUTRIENT_BENEFIT_SOURCES,
  SOURCED_LAUNCH_BENEFITS,
  HEALTH_BENEFIT_SEED,
  isTrustedSourceUrl,
  isValidSourceRef,
  validateKnowledgeSeed,
} from "../../shared/knowledge/index.js";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

/**
 * The exact hostnames the claim pack's citations point at.
 *
 * Layer 1 (`TRUSTED_SOURCE_DOMAINS`) says which domains are *citable*. This says
 * which URLs a human has actually opened and read. A new URL on an already-trusted
 * domain still needs a link check, so adding one must fail here and be added
 * deliberately, with its `lastReviewed` date recorded in claim-sources.ts.
 */
const LINK_CHECKED_URLS: readonly string[] = [
  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32012R0432",
  "https://www.nhs.uk/live-well/eat-well/digestive-health/how-to-get-more-fibre-into-your-diet/",
  "https://www.nhs.uk/conditions/vitamins-and-minerals/calcium/",
  "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-d/",
  "https://www.nhs.uk/conditions/vitamins-and-minerals/vitamin-c/",
  "https://www.nhs.uk/conditions/vitamins-and-minerals/iron/",
];

/**
 * Benefits THA holds an editorial nutrient link for but CANNOT yet cite, and so
 * must never render (Rule E1: no citation, no card).
 *
 * These are honest gaps, not oversights — each was checked against the EU Register
 * of authorised claims and found to have none:
 *   · sleep-quality             — no authorised EU claim links magnesium to sleep.
 *   · blood-sugar-balance       — the authorised blood-glucose claim is specific to
 *                                 beta-glucans, not to the generic `fibre` identity.
 *   · anti-inflammatory-support — the EU authorises no anti-inflammatory claim for
 *                                 omega-3, selenium, polyphenols or sulforaphane.
 *
 * Shrinking this list requires a real source, not a better-sounding sentence. If a
 * claim is later authorised, add it to claim-sources.ts and remove it here — the
 * failure this list produces is the point.
 */
const EXPECTED_HONEST_GAPS: readonly string[] = [
  "anti-inflammatory-support",
  "blood-sugar-balance",
  "sleep-quality",
];

/** A claim is renderable-shaped iff ≥1 of its refs is structurally valid. */
const backedPairs = new Set(
  NUTRIENT_BENEFIT_SOURCES
    .filter((s) => s.sourceRefs.some(isValidSourceRef))
    .map((s) => `${s.nutrientSlug}|${s.benefitSlug}`),
);
const citableBenefits = new Set(Array.from(backedPairs, (p) => p.split("|")[1]));

/**
 * Replicate `nutrition-knowledge-registry.getFoodBenefitsForDisplay` over the seed:
 * a food's benefit chip renders iff the food editorially carries the benefit AND
 * contributes a nutrient whose link to that benefit is evidence-backed.
 */
function renderableChips(): { chips: number; total: number; foodsLit: Set<string> } {
  let chips = 0;
  let total = 0;
  const foodsLit = new Set<string>();
  for (const [food, benefits] of Object.entries(FOOD_BENEFITS)) {
    const nutrients = FOOD_NUTRIENTS[food] ?? [];
    for (const benefit of benefits) {
      total++;
      if (nutrients.some((n) => backedPairs.has(`${n}|${benefit}`))) {
        chips++;
        foodsLit.add(food);
      }
    }
  }
  return { chips, total, foodsLit };
}

function run() {
  const allBenefits = HEALTH_BENEFIT_SEED.map((b) => b.slug);
  const darkBenefits = allBenefits.filter((b) => !citableBenefits.has(b));
  const { chips, total, foodsLit } = renderableChips();
  const edges = Object.values(NUTRIENT_BENEFITS).reduce((a, b) => a + b.length, 0);

  console.log("── Coverage (post-sign-off projection) ──");
  console.log(`  sourced nutrient→benefit claims : ${NUTRIENT_BENEFIT_SOURCES.length} of ${edges} editorial edges`);
  console.log(`  benefits citable                : ${citableBenefits.size} of ${allBenefits.length}`);
  console.log(`  food benefit chips renderable   : ${chips} of ${total} (${((chips / total) * 100).toFixed(1)}%)`);
  console.log(`  foods showing ≥1 benefit chip   : ${foodsLit.size} of ${Object.keys(FOOD_BENEFITS).length}`);
  console.log(`  honest gaps (uncitable benefits): ${darkBenefits.join(", ") || "none"}`);

  console.log("\n── Editorial integrity (Rule KC9: citations never invent claims) ──");
  const seedProblems = validateKnowledgeSeed().filter((p) => p.startsWith("claim-sources:"));
  check("no claim-sources referential/structural problems", seedProblems.length === 0, seedProblems.join("; "));
  check(
    "every sourced pair cites an EXISTING NUTRIENT_BENEFITS link",
    NUTRIENT_BENEFIT_SOURCES.every((s) => (NUTRIENT_BENEFITS[s.nutrientSlug] ?? []).includes(s.benefitSlug)),
  );
  check(
    "no duplicate (nutrient, benefit) entries",
    new Set(NUTRIENT_BENEFIT_SOURCES.map((s) => `${s.nutrientSlug}→${s.benefitSlug}`)).size ===
      NUTRIENT_BENEFIT_SOURCES.length,
  );
  check(
    "the seed authors no reviewedAt — sign-off is a human gate (Rule KC9)",
    !NUTRIENT_BENEFIT_SOURCES.some((s) => "reviewedAt" in (s as unknown as Record<string, unknown>)),
  );

  console.log("\n── Source discipline (Rule E2: never show emerging as established) ──");
  check(
    "every sourced claim is evidenceStrength 'established'",
    NUTRIENT_BENEFIT_SOURCES.every((s) => s.evidenceStrength === "established"),
  );
  check(
    "every ref on an 'established' claim is itself evidenceLevel 'established'",
    NUTRIENT_BENEFIT_SOURCES.every((s) => s.sourceRefs.every((r) => r.evidenceLevel === "established")),
  );
  check(
    "every ref URL is on a Layer-1 trusted domain",
    NUTRIENT_BENEFIT_SOURCES.every((s) => s.sourceRefs.every((r) => isTrustedSourceUrl(r.url))),
  );

  const usedUrls = Array.from(new Set(NUTRIENT_BENEFIT_SOURCES.flatMap((s) => s.sourceRefs.map((r) => r.url))));
  const unchecked = usedUrls.filter((u) => !LINK_CHECKED_URLS.includes(u));
  check(
    "the claim pack cites no URL that has not been link-checked",
    unchecked.length === 0,
    unchecked.length ? `unchecked: ${unchecked.join(", ")}` : "",
  );

  console.log("\n── The bridge invariant (Rule E1: no citation, no card) ──");
  check(
    "no benefit chip can render for a benefit with zero sourced nutrient claims",
    !Object.entries(FOOD_BENEFITS).some(([food, benefits]) => {
      const nutrients = FOOD_NUTRIENTS[food] ?? [];
      return benefits.some(
        (b) => darkBenefits.includes(b) && nutrients.some((n) => backedPairs.has(`${n}|${b}`)),
      );
    }),
  );
  check(
    "every citable benefit is reachable from ≥1 real food via the nutrient bridge",
    Array.from(citableBenefits).every((b) =>
      Object.entries(FOOD_BENEFITS).some(([food, benefits]) =>
        benefits.includes(b) && (FOOD_NUTRIENTS[food] ?? []).some((n) => backedPairs.has(`${n}|${b}`)),
      ),
    ),
  );

  console.log("\n── Honest gaps stay gaps (Rule NK3: no fabricated knowledge) ──");
  check(
    "the uncitable benefits are exactly the documented honest gaps",
    darkBenefits.length === EXPECTED_HONEST_GAPS.length &&
      EXPECTED_HONEST_GAPS.every((b) => darkBenefits.includes(b)),
    `expected [${EXPECTED_HONEST_GAPS.join(", ")}], found [${darkBenefits.join(", ")}]`,
  );
  check(
    "every honest gap still holds an editorial nutrient link (the gap is evidence, not absence)",
    EXPECTED_HONEST_GAPS.every((b) => Object.values(NUTRIENT_BENEFITS).some((bs) => bs.includes(b))),
  );

  console.log("\n── Launch minimum (Master Roadmap §6) is not regressed ──");
  check(
    "all 5 launch benefits remain citable",
    SOURCED_LAUNCH_BENEFITS.every((b) => citableBenefits.has(b)),
  );
  check("coverage never shrinks below the launch minimum", citableBenefits.size >= SOURCED_LAUNCH_BENEFITS.length);

  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
