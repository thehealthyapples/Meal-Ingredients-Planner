/**
 * validate-companion-benchmark.ts — INTQ3
 * ========================================
 * Validates the executable import of the THA Companion Benchmark 100 (v1.0).
 *
 * This is an IMPORT-INTEGRITY validator, not a benchmark run. It does NOT call the
 * Companion, does NOT touch a database, and changes NO Companion behaviour. It only
 * proves that `fixtures/companion-benchmark-100.v1.json` is a complete, faithful,
 * non-drifted encoding of the canonical source document.
 *
 * It checks, and exits non-zero on the first class of failure it finds:
 *   §1  Fixture loads and has the expected top-level shape.
 *   §2  Exactly 100 questions.
 *   §3  No duplicate IDs.
 *   §4  No missing IDs — every category's canonical ID range is fully present,
 *       and global numbering 001..100 is complete and sequential.
 *   §5  Category IDs use the correct prefix and category counts match.
 *   §6  Required fields exist and are non-empty on every question.
 *   §7  Source-of-truth fidelity: re-parse the canonical markdown independently and
 *       confirm the fixture's IDs, utterances, capabilities, and ChatGPT grades match
 *       verbatim — this is the guard that no question wording was changed on import.
 *
 * Run: npx tsx server/tests/benchmark/validate-companion-benchmark.ts
 *      npm run test:companion-benchmark:validate
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const FIXTURE_PATH = resolve(__dirname, "fixtures/companion-benchmark-100.v1.json");
const SOURCE_PATH = resolve(
  REPO_ROOT,
  "docs/intelligence/benchmark/questions/THA_COMPANION_BENCHMARK_100_V1.md",
);

// ── Canonical structure (from the source document §6) ───────────────────────────
// Category → { prefix, first id number, count }. Numbering is global and sequential.
const CANONICAL_CATEGORIES: Array<{ name: string; prefix: string; first: number; count: number }> = [
  { name: "Profile & Household", prefix: "PH", first: 1, count: 10 },
  { name: "Cookbook", prefix: "CB", first: 11, count: 12 },
  { name: "Planner", prefix: "PL", first: 23, count: 12 },
  { name: "Shopping", prefix: "SH", first: 35, count: 10 },
  { name: "Pantry", prefix: "PA", first: 45, count: 8 },
  { name: "Nutrition & Diary", prefix: "ND", first: 53, count: 10 },
  { name: "Product Intelligence", prefix: "PR", first: 63, count: 10 },
  { name: "Food Knowledge", prefix: "FK", first: 73, count: 10 },
  { name: "Companion Guidance", prefix: "CG", first: 83, count: 8 },
  { name: "Trust & Safety", prefix: "TS", first: 91, count: 10 },
];
const EXPECTED_TOTAL = 100;
const HORIZONS = ["launch", "y1", "y2", "y3", "y5", "y10"] as const;

const failures: string[] = [];
const fail = (section: string, msg: string) => failures.push(`[${section}] ${msg}`);

// ── §7 helper: independent parse of the canonical markdown ───────────────────────
type ParsedRow = { id: string; utterance: string; capability: string; chatgptPredicted: string };

function parseSourceMarkdown(): Map<string, ParsedRow> {
  const rows = new Map<string, ParsedRow>();
  const idRe = /^[A-Z]{2}-\d{3}$/;
  for (const line of readFileSync(SOURCE_PATH, "utf8").split("\n")) {
    if (!line.startsWith("|")) continue;
    const cols = line.split("|").map((c) => c.trim());
    if (cols.length < 11) continue;
    const id = cols[1];
    if (!idRe.test(id)) continue;
    const capIdx = cols[3].indexOf("<br>**Capability:**");
    const capability =
      capIdx === -1
        ? ""
        : cols[3].slice(capIdx + "<br>**Capability:**".length).replace(/`/g, "").trim();
    rows.set(id, {
      id,
      utterance: cols[2],
      capability,
      chatgptPredicted: cols[7],
    });
  }
  return rows;
}

// ── §1 Load fixture ──────────────────────────────────────────────────────────────
let fixture: any;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
} catch (err) {
  console.error(`FATAL: could not read/parse fixture at ${FIXTURE_PATH}: ${(err as Error).message}`);
  process.exit(1);
}

if (fixture.bundleComponent !== "questions") fail("§1", `bundleComponent should be "questions", got ${JSON.stringify(fixture.bundleComponent)}`);
if (fixture.version !== "v1.0.0") fail("§1", `version should be "v1.0.0", got ${JSON.stringify(fixture.version)}`);
if (!Array.isArray(fixture.questions)) {
  fail("§1", "fixture.questions is not an array");
}

const questions: any[] = Array.isArray(fixture.questions) ? fixture.questions : [];

// ── §2 Exactly 100 ───────────────────────────────────────────────────────────────
if (questions.length !== EXPECTED_TOTAL) fail("§2", `expected ${EXPECTED_TOTAL} questions, found ${questions.length}`);
if (fixture.totalQuestions !== EXPECTED_TOTAL) fail("§2", `fixture.totalQuestions should be ${EXPECTED_TOTAL}, got ${fixture.totalQuestions}`);

// ── §3 No duplicate IDs ──────────────────────────────────────────────────────────
const seen = new Set<string>();
for (const q of questions) {
  if (seen.has(q.id)) fail("§3", `duplicate ID: ${q.id}`);
  seen.add(q.id);
}

// ── §4 / §5 No missing IDs, correct prefixes, correct category counts ────────────
const expectedIds: string[] = [];
const idToCategory = new Map<string, string>();
for (const cat of CANONICAL_CATEGORIES) {
  for (let i = 0; i < cat.count; i++) {
    const num = cat.first + i;
    const id = `${cat.prefix}-${String(num).padStart(3, "0")}`;
    expectedIds.push(id);
    idToCategory.set(id, cat.name);
  }
}
// global numbering must be 001..100 with no gaps
if (expectedIds.length !== EXPECTED_TOTAL) {
  fail("§4", `canonical category table sums to ${expectedIds.length}, not ${EXPECTED_TOTAL} — validator config error`);
}

for (const id of expectedIds) {
  if (!seen.has(id)) fail("§4", `missing canonical ID: ${id}`);
}
for (const id of seen) {
  if (!idToCategory.has(id)) fail("§4", `unexpected / non-canonical ID present: ${id}`);
}

// category counts + prefix/category agreement
const countsByCategory = new Map<string, number>();
for (const q of questions) {
  countsByCategory.set(q.category, (countsByCategory.get(q.category) || 0) + 1);
  const expectedCat = idToCategory.get(q.id);
  if (expectedCat && q.category !== expectedCat) {
    fail("§5", `${q.id} is in category "${q.category}" but its ID range belongs to "${expectedCat}"`);
  }
}
for (const cat of CANONICAL_CATEGORIES) {
  const actual = countsByCategory.get(cat.name) || 0;
  if (actual !== cat.count) fail("§5", `category "${cat.name}" expected ${cat.count} questions, found ${actual}`);
}

// ── §6 Required fields present and non-empty ─────────────────────────────────────
const nonEmpty = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;
for (const q of questions) {
  const where = q.id ?? "(unknown id)";
  for (const field of ["id", "category", "utterance", "rationale", "capability", "evidenceExpected", "trustConcern"]) {
    if (!nonEmpty(q[field])) fail("§6", `${where}: required field "${field}" is missing or empty`);
  }
  if (!q.maturityHorizons || typeof q.maturityHorizons !== "object") {
    fail("§6", `${where}: maturityHorizons missing`);
  } else {
    for (const h of HORIZONS) if (!nonEmpty(q.maturityHorizons[h])) fail("§6", `${where}: maturity horizon "${h}" missing or empty`);
  }
  if (!q.grades || typeof q.grades !== "object") {
    fail("§6", `${where}: grades missing`);
  } else {
    for (const g of ["chatgptPredicted", "claudePredicted", "actual"]) {
      if (!nonEmpty(q.grades[g])) fail("§6", `${where}: grade "${g}" missing or empty`);
    }
    if (!/^[A-F]$/.test(q.grades.chatgptPredicted) && q.grades.chatgptPredicted !== "TBC") {
      fail("§6", `${where}: chatgptPredicted "${q.grades.chatgptPredicted}" is not a valid grade (A–F) or TBC`);
    }
  }
}

// ── §7 Fidelity vs canonical source (no wording drift) ───────────────────────────
let sourceRows: Map<string, ParsedRow> | null = null;
try {
  sourceRows = parseSourceMarkdown();
} catch (err) {
  fail("§7", `could not parse source markdown: ${(err as Error).message}`);
}
if (sourceRows) {
  if (sourceRows.size !== EXPECTED_TOTAL) fail("§7", `source markdown parsed ${sourceRows.size} questions, expected ${EXPECTED_TOTAL}`);
  for (const q of questions) {
    const src = sourceRows.get(q.id);
    if (!src) {
      fail("§7", `${q.id}: present in fixture but not found in source document`);
      continue;
    }
    if (q.utterance !== src.utterance) fail("§7", `${q.id}: utterance drifted from source.\n    fixture: ${JSON.stringify(q.utterance)}\n    source:  ${JSON.stringify(src.utterance)}`);
    if (q.capability !== src.capability) fail("§7", `${q.id}: capability drifted from source (fixture=${JSON.stringify(q.capability)}, source=${JSON.stringify(src.capability)})`);
    if (q.grades?.chatgptPredicted !== src.chatgptPredicted) fail("§7", `${q.id}: chatgptPredicted grade drifted (fixture=${q.grades?.chatgptPredicted}, source=${src.chatgptPredicted})`);
  }
  for (const id of sourceRows.keys()) {
    if (!seen.has(id)) fail("§7", `${id}: present in source document but missing from fixture`);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error(`\n✗ Companion Benchmark 100 import validation FAILED — ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("");
  process.exit(1);
}

console.log("✓ Companion Benchmark 100 import validation PASSED");
console.log(`  • ${questions.length} questions, IDs 001–100 complete, no duplicates`);
console.log(`  • ${CANONICAL_CATEGORIES.length} categories with expected counts:`);
for (const cat of CANONICAL_CATEGORIES) {
  console.log(`      ${cat.prefix}  ${String(countsByCategory.get(cat.name) || 0).padStart(2)}  ${cat.name}`);
}
console.log(`  • required fields present on every question`);
console.log(`  • verbatim fidelity vs source document confirmed (no wording drift)`);
console.log(`  • fixture bundle: questions@${fixture.version} (frozen=${fixture.frozen})`);
process.exit(0);
