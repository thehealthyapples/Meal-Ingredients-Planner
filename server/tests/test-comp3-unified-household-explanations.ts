/**
 * COMP3 — Unified Household Explanations.
 *
 * The convergence this suite protects: when THA withholds food from a household
 * on dietary-safety grounds, or cannot check, EVERY surface says it in the same
 * words, read from one owner.
 *
 * §1 is the ratchet and the reason this file exists. Converging sixteen copies
 * once is worth little if the seventeenth can be written tomorrow without
 * anyone noticing — which is exactly how there came to be sixteen. §1 SCANS for
 * the sentence family and fails on any authored copy outside the owner, so the
 * convergence is enforced by construction rather than by memory.
 *
 * §1.4 plants a violation and requires the scan to catch it, so a scan that has
 * silently stopped matching cannot pass by finding nothing.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const ROOT = process.cwd();
const OWNER = "shared/explanations/household-withholding.ts";
const SHAPE_OWNER = "shared/explanations/planner-explanation.ts";

function sourceOf(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf-8");
}

/** Every .ts/.tsx file in the product planes. Tests are excluded deliberately —
 *  a test may quote a sentence in order to assert it. */
function productSources(): string[] {
  const out: string[] = [];
  const skip = new Set(["node_modules", "dist", "build", ".git", "tests", "scripts"]);
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(name)) out.push(full.slice(ROOT.length + 1));
    }
  };
  for (const plane of ["server", "shared", "client/src"]) walk(join(ROOT, plane));
  return out;
}

async function main(): Promise<void> {
  console.log("\nCOMP3 — Unified Household Explanations\n");

  // ─────────────────────────────────────────────────────────────────────────
  console.log("§1 The withholding sentence family has exactly one author");

  const family = /suit\s+your household's dietary needs|against\s+your household's dietary needs|confirm your household's dietary needs/;

  const offenders = productSources().filter(
    (f) => f !== OWNER && family.test(sourceOf(f)),
  );
  assert(
    offenders.length === 0,
    "[scan] no file outside the canonical owner authors the withholding sentence",
    offenders.join(", ").slice(0, 300),
  );

  const owner = sourceOf(OWNER);
  assert(
    /export function withheldClause\(/.test(owner) &&
      /export function withheldNote\(/.test(owner) &&
      /export function nothingSuitableNote\(/.test(owner) &&
      /export function safetyUnavailableNote\(/.test(owner),
    "the owner exports all four sentence shapes the family needs",
  );

  // §1.2 — the defect convergence exposed. One of the three counted copies
  // pluralised the noun but hard-coded "don't", so it read "We left out 1
  // suggestion that DON'T suit…". Its two siblings agreed correctly.
  const { withheldClause, withheldNote, nothingSuitableNote, safetyUnavailableNote } =
    await import("../../shared/explanations/household-withholding.js");

  assert(
    withheldNote({ count: 1, noun: "suggestion" }) ===
      "We left out 1 suggestion that doesn't suit your household's dietary needs.",
    "[executed] the singular counted note agrees — the defect that convergence exposed",
    withheldNote({ count: 1, noun: "suggestion" }),
  );
  assert(
    withheldNote({ count: 3, noun: "meal" }) ===
      "We left out 3 meals that don't suit your household's dietary needs.",
    "[executed] the plural counted note agrees",
    withheldNote({ count: 3, noun: "meal" }),
  );
  assert(
    withheldClause(1) === "it doesn't suit your household's dietary needs" &&
      withheldClause(2) === "they don't suit your household's dietary needs",
    "[executed] the bare clause agrees in both numbers",
  );

  // §1.3 — the rule these sentences exist under. A withhold note is a broadcast
  // surface; it must name no restriction and no member.
  const produced = [
    withheldClause(1),
    withheldClause(4),
    withheldNote({ count: 1, noun: "idea" }),
    withheldNote({ count: 2, noun: "swap" }),
    nothingSuitableNote({ attempt: "suggest anything from these ingredients" }),
    nothingSuitableNote({ attempt: "suggest swaps for this recipe", subjectIsPlural: true }),
    safetyUnavailableNote({ subject: "this", consequence: "we're not going to guess", retryable: true }),
  ];
  assert(
    !produced.some((s) => /allerg|vegan|vegetarian|gluten|dairy|nut\b|coeliac|halal|kosher/i.test(s)),
    "[executed] no sentence the owner can produce names a restriction or a member",
  );
  assert(
    produced.every((s) => s.trim().length > 0 && !/undefined|null|NaN/.test(s)),
    "[executed] no sentence can render a placeholder into a household's face",
  );

  // §1.4 — prove the scan can still SEE a violation. A scan that has stopped
  // matching passes by finding nothing, which is indistinguishable from success.
  const planted = 'const x = "We left out 2 meals that don\'t suit your household\'s dietary needs.";';
  assert(
    family.test(planted),
    "[planted] the scan catches a newly authored copy — it is not passing by blindness",
  );

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n§2 The client authors no claim about household dietary data");

  const hook = sourceOf("client/src/hooks/use-smart-suggest.ts");
  assert(
    !/\?\?\s*["'`][^"'`]*dietary needs/.test(hook),
    "the planner hook no longer supplies its OWN safety claim as a fallback",
  );
  assert(
    /withheldClause/.test(hook) && /@shared\/explanations\/household-withholding/.test(hook),
    "…it reads the fallback from the canonical owner instead",
  );

  const plannerPage = sourceOf("client/src/pages/weekly-planner-page.tsx");
  assert(
    /safetyUnavailableNote/.test(plannerPage),
    "the planner page reads its safety refusal from the owner, not a local literal",
  );

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n§3 The planner explanation SHAPE is declared once");

  const shape = sourceOf(SHAPE_OWNER);
  assert(
    /export interface MealExplanation/.test(shape) &&
      /export interface PlannerExplanationEvidence/.test(shape) &&
      /export type PlannerExplanationDimension/.test(shape),
    "the shared module declares the explanation shape",
  );

  const clientTypes = sourceOf("client/src/lib/planner-types.ts");
  assert(
    !/^\s*export interface MealExplanation/m.test(clientTypes) &&
      !/^\s*export interface PlannerExplanationEvidence/m.test(clientTypes),
    "the client no longer RE-DECLARES the shape as a structural twin",
  );
  assert(
    /@shared\/explanations\/planner-explanation/.test(clientTypes),
    "…it imports the one declaration",
  );

  const explain = sourceOf("server/lib/explainability-service.ts");
  assert(
    /@shared\/explanations\/planner-explanation/.test(explain),
    "the producer reads the same declaration",
  );
  // The shape converged; the OWNERSHIP must not have. This file is still the
  // only thing that authors planner explanation sentences.
  assert(
    /export function generateMealExplanation/.test(explain),
    "…and remains the single owner of 'why was this meal recommended?'",
  );
  assert(
    /GeneratedMealExplanation/.test(explain) &&
      /evidence: PlannerExplanationEvidence\[\]/.test(explain),
    "the producer's stronger guarantee (evidence always present) survived convergence",
  );

  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n§4 Explanation ownership is not duplicated downstream");

  // The Opportunity delivery framework and the Companion notice engine must
  // PROJECT a producer's explanation, never reword it. Paraphrase is where
  // "you tend to skip fish" becomes "you don't like fish".
  const framework = sourceOf("server/intelligence/opportunity-delivery/framework.ts");
  assert(
    /explanation: (rec|opportunity)\.explanation/.test(framework),
    "opportunity delivery projects the producer's explanation verbatim",
  );

  const notice = sourceOf("server/intelligence/conversation/notice-engine.ts");
  assert(
    /explanation/.test(notice) && !/explanation:\s*[`"']/.test(notice),
    "the Companion notice engine carries explanations, it does not author them",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`COMP3 Unified Household Explanations: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
