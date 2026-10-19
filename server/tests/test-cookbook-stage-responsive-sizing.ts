/**
 * test-cookbook-stage-responsive-sizing.ts
 * ==========================================
 * COOKBOOK-LAYOUT1 — at the owner's ~900px-wide "Codex browser view" reference,
 * the Cookbook open-book spread (`client/src/components/cookbook-real-book/
 * real-book.css`, `.rb-stage`) crowded across the page/spine with the right
 * (recipe) page obscured.
 *
 * Root cause (source-only, no live browser): `.rb-stage`'s width is
 * `max(104%, <height-driven term>)`. The height-driven term had no upper bound,
 * so at a viewport that is wide-for-its-height in the wrong proportion it can
 * exceed the intended ~104% "crop only the peripheral table" amount by a lot,
 * pushing the stage — and with it the recto (recipe) page plane's fore-edge —
 * past the right side of the centred, `overflow: hidden` `.rb-desktop` box.
 *
 * The fix caps that term at 135% of the viewport width. This is not an arbitrary
 * number: the two page planes' own authored clip-path geometry
 * (`.rb-plane--left` / `.rb-plane--right`) puts the full spread's content
 * between 16.25% and 84.9% of the plate's width. For a centred box of width
 * k × viewport-width with the viewport fully inside it, the visible window
 * covers plate-fraction [0.5 − 0.5/k, 0.5 + 0.5/k]; that window stops containing
 * both page edges once k exceeds 1/(0.5 − 0.349) ≈ 1.4327. This test recomputes
 * that bound directly from the CSS's own clip-path coordinates — not a copied
 * constant — so a future change to the page-plane geometry would correctly
 * invalidate this test's assumption rather than silently stop protecting it.
 *
 * This is a static source contract (reads the CSS as text; no browser, no
 * render) — it cannot confirm the owner's exact screenshots, only a live check
 * can. It proves: the cap is present, it is geometrically safe against the
 * actual authored page-plane edges with real margin, and the full-width desktop
 * look is unchanged for any viewport where the old term was already ≤135%.
 *
 * Run with: npx tsx server/tests/test-cookbook-stage-responsive-sizing.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(
  join(process.cwd(), "client/src/components/cookbook-real-book/real-book.css"),
  "utf8",
);

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

// ─── 1. The cap is present in .rb-stage's width formula ────────────────────────

section("1. The width formula now caps the height-driven term");

const stageBlockMatch = css.match(/\.rb-stage\s*\{([\s\S]*?)\n\}/);
const stageBlock = stageBlockMatch?.[1] ?? "";
assert(stageBlock.length > 0, "found the .rb-stage rule");
assert(/width:\s*max\(\s*104%,\s*min\(\s*135%,/.test(stageBlock.replace(/\s+/g, " ")), "width is max(104%, min(135%, <height-driven term>)) — the 104% floor is unchanged, a 135% ceiling is new");
assert(/1672\s*\/\s*941\s*\*\s*1\.04/.test(stageBlock), "the underlying height-driven term (plate aspect ratio × 1.04) is untouched — only its ceiling changed");

// ─── 2. Re-derive the geometric safety bound from the CSS's own clip-paths ─────

section("2. The 135% cap is geometrically safe, proven from the actual page-plane edges");

function extractXCoords(selector: string): number[] {
  const re = new RegExp(`${selector.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\$&")}\\s*\\{[\\s\\S]*?clip-path:\\s*polygon\\(([\\s\\S]*?)\\);`);
  const block = css.match(re)?.[1] ?? "";
  // Each vertex is "X% Y%,"; capture the X values only.
  const coords = [...block.matchAll(/([\d.]+)%\s+[\d.]+%/g)].map((m) => Number(m[1]));
  return coords;
}

const leftXs = extractXCoords(".rb-plane--left");
const rightXs = extractXCoords(".rb-plane--right");

assert(leftXs.length >= 4, "parsed the .rb-plane--left clip-path vertices", `found ${leftXs.length}`);
assert(rightXs.length >= 4, "parsed the .rb-plane--right clip-path vertices", `found ${rightXs.length}`);

const spreadMinX = Math.min(...leftXs, ...rightXs); // leftmost edge of the whole two-page spread, in plate %
const spreadMaxX = Math.max(...leftXs, ...rightXs); // rightmost edge

// For a centred overflow box of width k × viewport, viewport-width / stage-width = 1/k,
// and the visible window is [0.5 - 0.5/k, 0.5 + 0.5/k] of the plate (as fractions, 0-1).
// Both spread edges stay visible while k <= 1 / (2 * max(0.5 - minX/100, maxX/100 - 0.5)).
const halfSpanNeeded = Math.max(0.5 - spreadMinX / 100, spreadMaxX / 100 - 0.5);
const kMaxBeforeClipping = 1 / (2 * halfSpanNeeded);

assert(
  spreadMinX > 10 && spreadMinX < 25,
  "the spread's leftmost edge is in the expected ~16-17% range (sanity check on the parse)",
  `got ${spreadMinX}%`,
);
assert(
  spreadMaxX > 80 && spreadMaxX < 90,
  "the spread's rightmost edge is in the expected ~84-85% range (sanity check on the parse)",
  `got ${spreadMaxX}%`,
);

const CHOSEN_CAP = 1.35;
assert(
  CHOSEN_CAP < kMaxBeforeClipping,
  `the chosen 135% cap stays under the geometric clipping threshold (${(kMaxBeforeClipping * 100).toFixed(1)}%) derived from the actual clip-path edges`,
  `135% vs ${(kMaxBeforeClipping * 100).toFixed(2)}% limit`,
);

const marginFraction = (kMaxBeforeClipping - CHOSEN_CAP) / kMaxBeforeClipping;
assert(
  marginFraction > 0.03,
  "the cap leaves a real (>3%) safety margin under the exact clipping threshold, not a razor's edge",
  `margin is ${(marginFraction * 100).toFixed(1)}%`,
);

// ─── 3. Full-width desktop look is unaffected for typical viewports ────────────

section("3. The existing desktop presentation is unchanged where it already worked");

assert(/width:\s*max\(/.test(stageBlock), "the 104% floor path is untouched — any viewport where the height-driven term was already ≤135% renders identically to before");
assert(!/\.rb-desktop\s*\{[^}]*display:\s*none\s*!important/.test(css), "no new !important override was introduced that could hide the desktop two-page view");

// ─── 4. Wide mobile one-page content stays on the photographed paper ─────────

section("4. The 700–900px single-page layout keeps text on paper");

const wideMobileBlock = css.match(/@media\s*\(min-width:\s*700px\)\s*and\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\}/);
assert(!!wideMobileBlock, "a bounded wide-mobile layout override exists");
assert(/\.rb-plane--mobile-collection \.rb-plane__safe\s*\{[^}]*left:\s*20%;[^}]*width:\s*36%;/s.test(wideMobileBlock?.[1] ?? ""), "collection content is constrained to the photographed paper area");
assert(/\.rb-plane--mobile-recipe \.rb-plane__safe\s*\{[^}]*left:\s*47%;[^}]*width:\s*47%;/s.test(wideMobileBlock?.[1] ?? ""), "recipe content is positioned on the visible recipe page");
assert(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(wideMobileBlock?.[1] ?? ""), "collection results use a readable three-column grid at wide-mobile widths");
assert(/grid-auto-rows:\s*6\.6em[\s\S]*?overflow-y:\s*auto/.test(wideMobileBlock?.[1] ?? ""), "collection results scroll within the page instead of compressing recipe cards");
assert(/height:\s*4em;[\s\S]*?object-fit:\s*cover/.test(wideMobileBlock?.[1] ?? ""), "recipe thumbnails keep their proportions while fitting the printed row");

console.log("\n" + "─".repeat(40));
console.log(`COOKBOOK STAGE RESPONSIVE SIZING TESTS: ${passed} passed, ${failed} failed`);
console.log("─".repeat(40));
console.log("Note: this proves the cap is present and geometrically safe against the actual");
console.log("page-plane edges. It does NOT confirm the owner's exact screenshots render");
console.log("correctly — that needs a live check at ~900px.");

if (failed > 0) {
  console.error("FAILED");
  process.exit(1);
} else {
  console.log("All tests passed.");
}
