/**
 * THA Extract Detection — Count Accuracy Tests
 *
 * Verifies that extract detection is precise and consistent with THA rules:
 *   - Grouped phrases count once each
 *   - Separate declarations count individually
 *   - Nested extract words inside parentheses do NOT inflate the count
 *   - Plain "spice" / "spices" / "herbs" without "extract" → 0
 *
 * Uses EXTRACT_PATTERN directly from production code — no logic duplication.
 *
 * Run with:  npm run test:extracts
 */

import { EXTRACT_PATTERN } from "../lib/upf-analysis-service.js";

// ─── Helper ──────────────────────────────────────────────────────────────────

function countExtracts(text: string): { count: number; matches: string[] } {
  // Reset lastIndex — global regex is stateful.
  EXTRACT_PATTERN.lastIndex = 0;
  const matches = text.match(EXTRACT_PATTERN) ?? [];
  return { count: matches.length, matches };
}

// ─── Test cases ───────────────────────────────────────────────────────────────

interface ExtractCase {
  id: number;
  label: string;
  input: string;
  expectedCount: number;
  note?: string;
}

const CASES: ExtractCase[] = [
  {
    id: 1,
    label: "No extract — plain spices",
    input: "Spices",
    expectedCount: 0,
  },
  {
    id: 2,
    label: "Single named extract",
    input: "Rosemary Extract",
    expectedCount: 1,
  },
  {
    id: 3,
    label: "Grouped extract phrase — spice and herb",
    input: "Spice and Herb Extracts",
    expectedCount: 1,
    note: "'Spice and' does not match — only 'Herb Extracts' is captured",
  },
  {
    id: 4,
    label: "Grouped extract phrase — vegetable with parenthetical list",
    input: "Vegetable Extracts (Carrot, Beetroot)",
    expectedCount: 1,
    note: "Parenthetical items are not in the pattern so they cannot trigger extra matches",
  },
  {
    id: 5,
    label: "Two separate grouped declarations",
    input: "Spice and Herb Extracts, Vegetable Extracts (Carrot, Beetroot)",
    expectedCount: 2,
  },
  {
    id: 6,
    label: "Mixed real-world — extracts + flavouring",
    input: "Tomatoes, Salt, Spice and Herb Extracts, Vegetable Extracts (Carrot, Beetroot), Natural Flavouring",
    expectedCount: 2,
    note: "Natural Flavouring is a soft UPF term, not an extract — must not inflate extract count",
  },
  {
    id: 7,
    label: "CRITICAL — nested extract words inside parentheses",
    input: "Vegetable Extracts (Carrot Extract, Beetroot Extract)",
    expectedCount: 1,
    note: "'carrot' and 'beetroot' are not in EXTRACT_PATTERN, so inner phrases cannot match",
  },
  {
    id: 8,
    label: "Multiple separate named extracts",
    input: "Rosemary Extract, Garlic Extract, Onion Extract",
    expectedCount: 3,
  },
  {
    id: 9,
    label: "Mixed extract + non-extract form of same ingredient",
    input: "Garlic, Onion, Garlic Extract",
    expectedCount: 1,
    note: "Plain 'Garlic' and 'Onion' without 'extract' must not match",
  },
  // Additional edge cases
  {
    id: 10,
    label: "Plain herbs — no extract keyword",
    input: "Herbs, Spices, Salt",
    expectedCount: 0,
  },
  {
    id: 11,
    label: "Yeast extract — must NOT match (handled by soft UPF terms)",
    input: "Yeast Extract",
    expectedCount: 0,
    note: "Yeast is not in EXTRACT_PATTERN to prevent double-counting with SOFT_UPF_TERMS",
  },
  {
    id: 12,
    label: "Single grouped phrase in a full ingredient string",
    input: "Chicken, Water, Salt, Pepper, Spice and Herb Extracts",
    expectedCount: 1,
  },
  {
    id: 13,
    label: "Case insensitivity",
    input: "ROSEMARY EXTRACT, vegetable extracts (carrot)",
    expectedCount: 2,
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

const PASS = "✅";
const FAIL = "❌";

let passed = 0;
let failed = 0;

console.log("\nTHA Extract Detection — Count Accuracy Tests");
console.log("═".repeat(65));

for (const tc of CASES) {
  const { count, matches } = countExtracts(tc.input);
  const ok = count === tc.expectedCount;

  console.log(`\nCASE ${tc.id}: ${tc.label}`);
  console.log(`  Input:    "${tc.input}"`);
  console.log(`  Matches:  [${matches.map(m => `"${m}"`).join(", ")}]`);
  console.log(`  Count:    ${count}  (expected ${tc.expectedCount})`);
  if (tc.note) console.log(`  Note:     ${tc.note}`);
  console.log(`  ${ok ? PASS + " PASS" : FAIL + " FAIL"}`);

  if (ok) passed++; else failed++;
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(65)}`);
console.log(`RESULTS: ${passed}/${CASES.length} passed`);

if (failed > 0) {
  console.log(`${FAIL} ${failed} case(s) FAILED`);
  process.exit(1);
} else {
  console.log(`${PASS} All cases passed.\n`);

  console.log("Validation summary:");
  const grouped   = countExtracts("Spice and Herb Extracts");
  const separate  = countExtracts("Spice and Herb Extracts, Vegetable Extracts (Carrot, Beetroot)");
  const nested    = countExtracts("Vegetable Extracts (Carrot Extract, Beetroot Extract)");
  const noSpice   = countExtracts("Spices");
  const noYeast   = countExtracts("Yeast Extract");

  console.log(`  ${grouped.count  === 1 ? PASS : FAIL} Grouped phrase counts once:        "Spice and Herb Extracts" → ${grouped.count}`);
  console.log(`  ${separate.count === 2 ? PASS : FAIL} Separate declarations count each:  two phrases → ${separate.count}`);
  console.log(`  ${nested.count   === 1 ? PASS : FAIL} Nested words do not overcount:     "${CASES[6].input}" → ${nested.count}`);
  console.log(`  ${noSpice.count  === 0 ? PASS : FAIL} Plain spice = 0:                   "Spices" → ${noSpice.count}`);
  console.log(`  ${noYeast.count  === 0 ? PASS : FAIL} Yeast extract excluded:            "Yeast Extract" → ${noYeast.count}`);
  console.log("");
}
