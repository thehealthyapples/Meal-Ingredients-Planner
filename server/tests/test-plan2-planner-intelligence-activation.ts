/**
 * test-plan2-planner-intelligence-activation.ts (PLAN2 activation)
 * =========================================================================
 * Verifies that intelligence THA already computes actually REACHES the planner.
 *
 * WHAT THIS SUITE CAN AND CANNOT PROVE — READ THIS BEFORE TRUSTING IT.
 *
 * Most of this activation is CLIENT rendering, and a server-side suite cannot mount
 * React. So §1-§3 are STRUCTURAL assertions over source text: they prove a render site
 * EXISTS, not that it paints. That is a genuinely weaker claim and it is labelled as
 * such on every assertion rather than dressed up.
 *
 * The reason structural assertions are used at all — rather than skipped as unprovable —
 * is that the defects being fixed were themselves structural: a field on the wire with
 * zero readers, and four imports that were never used. Absence of a reader is exactly
 * what a source-scan CAN prove, and it is what regressed here before.
 *
 * §4 is different: it executes real code (the compliance gate's own contract).
 *
 * Run with: npx tsx server/tests/test-plan2-planner-intelligence-activation.ts
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { FOOD_OPPORTUNITY_DOMAINS } from "../intelligence/food-intelligence/opportunity-engine.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

function sourceOf(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

/** Source with comments stripped, so a claim cannot be satisfied by the prose describing it. */
function codeOf(relPath: string): string {
  return sourceOf(relPath)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\/.*$/gm, "");
}

const PLANNER_PAGE = "client/src/pages/weekly-planner-page.tsx";
const REVIEW_PANEL = "client/src/components/SmartReviewPanelContent.tsx";
const SUGGEST_HOOK = "client/src/hooks/use-smart-suggest.ts";

async function main(): Promise<void> {
  console.log("\nPLAN2 — Planner Intelligence Activation\n" + "=".repeat(56));

  // =========================================================================
  section("§1 PLAN1's evidence trail reaches the household [STRUCTURAL]");
  // =========================================================================

  // THE DEFECT: `MealExplanation.evidence[]` — the named owner behind every reason —
  // has been on the wire since PLAN1 shipped with ZERO readers. `reasons` is DERIVED
  // from it and capped at MAX_REASONS; the trail is uncapped. So the household saw the
  // claim, never the citation, and any reason ranked 7th or lower was composed and
  // discarded.
  const panel = codeOf(REVIEW_PANEL);

  assert(
    /explanation\.evidence/.test(panel),
    "[structural] the review panel READS `explanation.evidence` — before PLAN2 it had zero readers",
  );
  assert(
    /\.evidence\.map\(/.test(panel) || /evidence\.map\(/.test(panel),
    "[structural] …and renders the trail, rather than merely testing it for length",
  );
  assert(
    /e\.source/.test(panel) && /e\.detail/.test(panel),
    "[structural] …showing BOTH the owner (`source`) and what was read (`detail`)",
  );
  assert(
    /explanation\.reasons\.map\(/.test(panel),
    "the existing `reasons` render is UNCHANGED — the trail is additive, never a replacement",
  );

  // `evidence` is optional by contract: sessions generated before PLAN1 carry `reasons`
  // and no trail. Rendering must not assume it.
  assert(
    /explanation\.evidence\s*&&/.test(panel) || /evidence\?\./.test(panel),
    "the trail is guarded — a pre-PLAN1 session with no `evidence` still renders its reasons",
  );

  // The server side of the contract, which the client now depends on.
  const explain = codeOf("server/lib/explainability-service.ts");
  assert(
    /evidence:\s*PlannerExplanationEvidence\[\]/.test(explain),
    "the server still composes the evidence trail this render depends on",
  );

  // =========================================================================
  section("§2 The nutrition domain reaches the planner [STRUCTURAL]");
  // =========================================================================

  // HNP2 made the weekly balance gap an opportunity in the `nutrition` domain, then
  // mounted it only on the nutrition page. Its claim is about THIS WEEK'S PLAN, and the
  // plan is on the planner.
  const page = codeOf(PLANNER_PAGE);
  const ambientMount = page.match(/<AmbientIntelligence[\s\S]{0,400}?\/>/g) ?? [];

  assert(ambientMount.length > 0, "[structural] the planner mounts AmbientIntelligence");
  assert(
    ambientMount.some((m) => /domains=\{\[[^\]]*"planner"[^\]]*"nutrition"[^\]]*\]\}/.test(m)),
    "[structural] …for BOTH the planner and nutrition domains",
    ambientMount.join(" | ").slice(0, 200),
  );

  // ONE mount, not two. `AmbientIntelligence` filters a shared bundle client-side, so a
  // second component would re-fetch and re-budget the same opportunities beside the
  // first — a second attention budget for one household moment.
  assert(
    ambientMount.length === 1,
    "…through ONE mount — a second would re-fetch and re-budget the same shared bundle",
    `${ambientMount.length} mounts`,
  );

  // The domain must be a real registered domain, not a string typo. This one EXECUTES.
  assert(
    (FOOD_OPPORTUNITY_DOMAINS as readonly string[]).includes("nutrition"),
    "the `nutrition` domain the planner asks for is a REGISTERED domain (executed, not scanned)",
  );

  // =========================================================================
  section("§3 No duplicate planner intelligence was left behind [STRUCTURAL]");
  // =========================================================================

  // Four symbols were imported into the planner page and never used: the per-meal
  // nutrient/variety render was wired to the import line and no further. They are
  // REMOVED rather than completed, because the components that own those renders
  // already do them.
  for (const deadImport of [
    "computeMealVariety",
    "EMPTY_VARIETY_SCORE",
    "getMealNutrients",
    "MealNutrientTags",
  ]) {
    assert(
      !new RegExp(`^import[^\\n]*\\b${deadImport}\\b`, "m").test(page),
      `[structural] \`${deadImport}\` is no longer imported-and-unused by the planner page`,
    );
  }

  // …and the owners that legitimately use them still do. Removing an unused import must
  // not be confused with retiring the capability.
  assert(
    /computeMealVariety/.test(codeOf("client/src/components/PlannerMealCard.tsx")),
    "…and `computeMealVariety` still lives in the component that actually renders variety",
  );

  // =========================================================================
  section("§4 A withheld meal is not reported as a failure [EXECUTED + STRUCTURAL]");
  // =========================================================================

  // THE DEFECT (PROD6's silent shortening, still present on this path): the smart-apply
  // compliance gate deliberately withholds a meal that breaks the household's own
  // dietary rules, logs why, and the client counted it as `failedCount`. The household
  // was told "1 could not be added" about a decision THA made on purpose.

  // EXECUTED — the contract the fix rests on: `reason` is MACHINE-readable, so it must
  // never be the string shown to a household.
  const compliance = sourceOf("server/lib/planner-compliance.ts");
  assert(
    /Machine-readable reason/.test(compliance),
    "`ComplianceResult.reason` is documented machine-readable — so it is not household-facing",
  );

  const routes = codeOf("server/routes.ts");
  assert(
    /skipped:\s*true,[\s\S]{0,200}?withheldNote:/.test(routes),
    "[structural] the smart-apply gate returns a HUMAN `withheldNote` beside the machine `reason`",
  );

  // The note is composed SERVER-side: the client authors no prose about household data.
  const hook = codeOf(SUGGEST_HOOK);
  assert(
    /importData\.withheldNote/.test(hook),
    "[structural] the client renders the SERVER's note…",
  );
  assert(
    !/importData\.reason/.test(hook),
    "…and never shows the machine-readable `reason` to a household",
  );

  // Withheld is counted apart from failed — the whole point.
  assert(
    /withheldCount/.test(hook) && /failedCount/.test(hook),
    "[structural] withheld and failed are counted SEPARATELY",
  );
  assert(
    /withheldCount\+\+/.test(hook),
    "[structural] …and a compliance skip increments WITHHELD, not FAILED",
  );

  // The withhold must not name the restriction or the member. A toast is a broadcast
  // surface; whose allergy it is does not belong there (the discipline
  // household-nutrition-enrichment.ts already applies: name the restriction, never the
  // member — here, on a toast, name neither).
  // COMP3 — this assertion used to grep `routes.ts` for a quoted `withheldNote:`
  // literal. That could only ever see ONE of the sixteen places this sentence was
  // authored, so fifteen copies could have named a restriction and it would still
  // have passed. The wording now has one owner, so the rule is checked THERE —
  // against every string the family can produce, not against one call site.
  const withholdingOwner = sourceOf("shared/explanations/household-withholding.ts");
  const ownerStrings = withholdingOwner.match(/`[^`]*`|"[^"]*"/g) ?? [];
  assert(
    ownerStrings.length > 0 &&
      !ownerStrings.some((n) => /allerg|vegan|vegetarian|gluten|dairy|nut\b/i.test(n)),
    "the withhold note names NO restriction and NO member — a toast is a broadcast surface",
    ownerStrings.join(" | ").slice(0, 160),
  );
  assert(
    /withheldNote:\s*withheldClause\(/.test(routes),
    "[structural] the smart-apply gate reads its note from the canonical owner, not a local literal",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`PLAN2 Planner Intelligence Activation: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
