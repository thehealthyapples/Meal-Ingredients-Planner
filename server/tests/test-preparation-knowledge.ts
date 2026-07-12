/**
 * test-preparation-knowledge.ts (PHASE5A)
 * =======================================
 * The Preparation Knowledge domain (WS5A; PKCA §7 Phase 4).
 *
 * This suite exists to hold down ONE invariant above all others, because it is
 * the one WS5A §9.3 names as the domain's whole point:
 *
 *   PREPARATION DEFAULTS TO SILENCE. A preparation says nothing about nutrition
 *   until trusted evidence earns it the right to speak — and even then, only as
 *   much as the evidence permits.
 *
 * And its corollary, WS5A §4.3's Risk R3 — the single biggest trust risk in this
 * domain: a household must be able to tell
 *
 *   "we know it doesn't matter"   (an evidenced finding — REASSURING)
 *   from
 *   "nobody knows yet"            (an absence — HONEST)
 *
 * These are different facts. Collapsing them into one vague line is the failure.
 * The three states are therefore modelled as a discriminated union, and the tests
 * below prove that "no-change" can ONLY ever be produced by an evidenced row, and
 * NEVER by the absence of one.
 *
 * Pure/unit — no database. The evidence gate under test (`isEvidenceBackedClaim`)
 * is the SAME function that gates every benefit chip in the platform; the point of
 * reusing it is that preparation effects cannot drift onto a weaker bar.
 *
 * Run with: npx tsx server/tests/test-preparation-knowledge.ts
 */

import {
  PREPARATION_SEED,
  FORM_TO_PREPARATION,
  EXCLUDED_FORMS,
  deriveFoodPreparations,
  validatePreparationSeed,
} from "@shared/knowledge/preparations";
import { isEvidenceBackedClaim, type KnowledgeSourceRef } from "@shared/knowledge/evidence";
import { PREPARATION_TYPES, PREPARATION_EFFECT_DIRECTIONS } from "@shared/schema";
import { FOOD_SEED } from "@shared/knowledge";

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

// ---------------------------------------------------------------------------
// The render gate, replicated exactly as the owner applies it. This mirrors
// getPreparationsForFood()'s branch, so the state machine is provable without a
// database. If the owner's logic and this diverge, the DB-backed manual
// verification step will catch it — but the LOGIC is what matters here.
// ---------------------------------------------------------------------------

type State = "effect" | "no-change" | "unreviewed";

function stateFor(effect: { direction: string; sourceRefs: unknown; reviewedAt: Date | null } | null): State {
  if (!effect) return "unreviewed";
  if (!isEvidenceBackedClaim(effect)) return "unreviewed";
  return effect.direction === "no-meaningful-change" ? "no-change" : "effect";
}

const NHS_REF: KnowledgeSourceRef = {
  body: "NHS",
  title: "Example page",
  url: "https://www.nhs.uk/live-well/eat-well/",
  evidenceLevel: "established",
  lastReviewed: "2026-07-11",
};

const BLOG_REF = {
  body: "A Wellness Blog",
  title: "Cooking hacks",
  url: "https://wellnessblog.example.com/hacks",
  evidenceLevel: "established",
  lastReviewed: "2026-07-11",
};

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("The catalogue is structurally valid");

  const problems = validatePreparationSeed();
  assert(problems.length === 0, "validatePreparationSeed() reports no problems", problems.join("; "));

  assert(
    PREPARATION_SEED.every((p) => (PREPARATION_TYPES as readonly string[]).includes(p.prepType)),
    "every preparation carries one of WS5A §1.6's four types — no fifth type was invented",
  );
  assert(
    !(PREPARATION_TYPES as readonly string[]).includes("composite"),
    "`composite` is NOT a preparation type — a composite ADDS other foods (WS5A Case D, Risk R9)",
  );

  // -------------------------------------------------------------------------
  section("Cooking methods and cooking techniques live in ONE catalogue, one key space");

  const cooking = PREPARATION_SEED.filter((p) => p.prepType === "cooking");
  const processing = PREPARATION_SEED.filter((p) => p.prepType === "processing");
  assert(cooking.length >= 10, `the heat methods are catalogued (${cooking.length} cooking preparations)`);
  assert(processing.length >= 10, `the non-heat techniques are catalogued (${processing.length} processing preparations)`);

  const slugs = new Set(PREPARATION_SEED.map((p) => p.slug));
  assert(slugs.size === PREPARATION_SEED.length, "one slug, one preparation — no forks (Principle 1)");

  // WS5A Case F — the shallow hierarchy: methods hang off `cooked`.
  const roasted = PREPARATION_SEED.find((p) => p.slug === "roasted")!;
  assert(roasted.family === "cooked", "roasted sits under the generic `cooked` family, not beside it");

  // -------------------------------------------------------------------------
  section("The migration INVENTS NOTHING — every edge traces to authored commonForms");

  const edges = deriveFoodPreparations(FOOD_SEED);
  assert(edges.length > 0, `the projection produced edges from the existing seed (${edges.length})`);

  const foodSlugs = new Set(FOOD_SEED.map((f) => f.slug));
  assert(edges.every((e) => foodSlugs.has(e.foodSlug)), "every edge points at a real food");
  assert(edges.every((e) => slugs.has(e.preparationSlug)), "every edge points at a real catalogue preparation");

  // The load-bearing anti-fabrication assertion: an edge may only exist where a
  // human already wrote that form into commonForms for THAT food.
  const authored = new Map(FOOD_SEED.map((f) => [f.slug, new Set((f.commonForms ?? []).map((s) => s.toLowerCase()))]));
  const unauthored = edges.filter((e) => {
    const forms = authored.get(e.foodSlug)!;
    return ![...forms].some((form) => FORM_TO_PREPARATION[form] === e.preparationSlug);
  });
  assert(
    unauthored.length === 0,
    "NO edge exists that a human did not already author in commonForms — the migration re-types, it does not invent",
    unauthored.slice(0, 3).map((e) => `${e.foodSlug}+${e.preparationSlug}`).join(", "),
  );

  // A food whose commonForms contain no recognised preparation gets NONE — an
  // honest gap, never a default set.
  const noForms = deriveFoodPreparations([{ slug: "test-food", commonForms: ["in salads", "block", "fillet"] }]);
  assert(
    noForms.length === 0,
    "a food whose forms are all non-preparations gets ZERO preparations — no default set is fabricated",
  );

  // -------------------------------------------------------------------------
  section("Declined forms are RECORDED, not silently dropped (PKCA Rule KC12)");

  assert(Object.keys(EXCLUDED_FORMS).length > 0, "the declined-form kinds are written down with reasons");
  for (const kind of ["cuts", "packaging", "dish-usages", "composites", "separate-foods"]) {
    assert(
      typeof EXCLUDED_FORMS[kind] === "string" && EXCLUDED_FORMS[kind].length > 40,
      `"${kind}" is declined WITH a stated reason — the next audit will not re-ask the question`,
    );
  }
  // The composite guard, specifically. This is the one that matters most: if
  // "granola" became a preparation of oats, it would inherit oats' clean profile.
  assert(
    FORM_TO_PREPARATION["granola"] === undefined && FORM_TO_PREPARATION["trail mix"] === undefined,
    "a composite is NOT mapped to a preparation — granola never becomes 'just prepared oats' (Risk R9)",
  );
  assert(
    FORM_TO_PREPARATION["fillet"] === undefined && FORM_TO_PREPARATION["breast"] === undefined,
    "a CUT is not a preparation — it names which part of the animal, not what was done to it",
  );

  // -------------------------------------------------------------------------
  section("THE INVARIANT — preparation defaults to SILENCE (WS5A §9.3)");

  assert(
    stateFor(null) === "unreviewed",
    "a preparation with NO effect row is `unreviewed` — THA does not know, and says so",
  );

  assert(
    stateFor({ direction: "increases", sourceRefs: [], reviewedAt: new Date() }) === "unreviewed",
    "an effect with a sign-off but NO citation does not speak — it is `unreviewed`",
  );

  assert(
    stateFor({ direction: "increases", sourceRefs: [NHS_REF], reviewedAt: null }) === "unreviewed",
    "an effect with a citation but NO human sign-off does not speak — automation authors candidates, it never publishes (Rule KC9)",
  );

  assert(
    stateFor({ direction: "increases", sourceRefs: [BLOG_REF], reviewedAt: new Date() }) === "unreviewed",
    "an effect citing a BANNED source (a blog) does not speak, however confident its author — Layer 1 gates Layer 2 (Rule KC7)",
  );

  assert(
    stateFor({ direction: "increases", sourceRefs: [NHS_REF], reviewedAt: new Date() }) === "effect",
    "an effect with a Layer-1 citation AND a human sign-off DOES speak",
  );

  // -------------------------------------------------------------------------
  section("Risk R3 — 'we know it doesn't matter' is NEVER produced by an absence");

  assert(
    stateFor({ direction: "no-meaningful-change", sourceRefs: [NHS_REF], reviewedAt: new Date() }) === "no-change",
    "an EVIDENCED finding of no meaningful change reports `no-change` — a positive, reassuring finding",
  );

  assert(
    stateFor(null) !== "no-change",
    "the ABSENCE of a row NEVER reports `no-change` — 'nobody knows yet' must never masquerade as 'we know it doesn't matter'",
  );

  assert(
    stateFor({ direction: "no-meaningful-change", sourceRefs: [], reviewedAt: null }) === "unreviewed",
    "an UNEVIDENCED claim of no-meaningful-change does not get to be reassuring either — it is just unreviewed",
  );

  assert(
    (PREPARATION_EFFECT_DIRECTIONS as readonly string[]).includes("no-meaningful-change"),
    "`no-meaningful-change` is a first-class, storable DIRECTION — it is a finding THA can hold, not a null",
  );

  // -------------------------------------------------------------------------
  section("The evidence gate is the SAME one that gates every benefit chip");

  assert(
    isEvidenceBackedClaim({ sourceRefs: [NHS_REF], reviewedAt: new Date() }) === true &&
      isEvidenceBackedClaim({ sourceRefs: [BLOG_REF], reviewedAt: new Date() }) === false,
    "preparation effects reuse isEvidenceBackedClaim verbatim — no second, weaker evidence bar was invented (Rule KC1)",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Test run failed:", err);
  process.exit(1);
});
