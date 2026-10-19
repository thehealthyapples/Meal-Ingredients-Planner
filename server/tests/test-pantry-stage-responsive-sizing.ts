/**
 * test-pantry-stage-responsive-sizing.ts
 * =======================================
 * PANTRY-LAYOUT1 — the owner's 5 October acceptance screenshot showed the Pantry
 * room scene (`client/src/pages/living-home-room.css`, `.lh-stage`) rendering at
 * ~894px wide inside a 1278px-wide window (~190px unused margin each side), at a
 * viewport above the `@media (min-width: 820px)` breakpoint where `.lh-stage` is
 * sized by HEIGHT alone (`width: auto`, aspect-ratio 1536/1024 derives width).
 *
 * Root cause (source-only, no live browser): the height was an independent
 * `88dvh` guess, disconnected from the one place the app already knows the real
 * available height — `.lh-room-page` (this box's flex parent, `flex: 1` inside
 * `<main class="main-safe …">`). `main-safe` (client/src/index.css) reserves the
 * fixed BottomNav's clearance exactly once, project-wide, so `.lh-room-page`'s
 * own flex-resolved height is already correct and already excludes it. Using
 * `height: 100%` of that parent instead of a second, looser `dvh` guess removes
 * the redundant margin without any new risk of overlapping the BottomNav, since
 * it can never resolve taller than the parent the BottomNav clearance is already
 * subtracted from.
 *
 * This test is a static source contract (reads the CSS as text; no browser, no
 * render). It cannot confirm the actual rendered pixel sizes the owner's
 * screenshots show — only a live check can. It proves: the fix is present, the
 * `88dvh` guess it replaces is gone, and the aspect-ratio / no-stretch / no-crop
 * guarantees the task required are still in source.
 *
 * Run with: npx tsx server/tests/test-pantry-stage-responsive-sizing.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(
  join(process.cwd(), "client/src/pages/living-home-room.css"),
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

// Isolate the ≥820px media block for `.lh-stage` so these assertions can't
// accidentally match the <820px base rule (which intentionally differs).
const wideBlockMatch = css.match(/@media \(min-width: 820px\) \{\s*\.lh-stage \{([\s\S]*?)\}\s*\}/);
const wideBlock = wideBlockMatch?.[1] ?? "";

section("1. The 88dvh guess is gone; the parent's own resolved height is reused");

assert(wideBlock.length > 0, "found the ≥820px .lh-stage media block");
assert(!/88dvh/.test(wideBlock), "the old independent 88dvh guess no longer appears in the wide-viewport rule");
assert(/height:\s*min\(\s*100%\s*,\s*1120px\s*\)/.test(wideBlock), "height is now min(100%, 1120px) — the flex parent's own already-correct height, still ceilinged at 1120px for very tall screens");

section("2. No stretching, no crop, no nav overlap introduced");

assert(/width:\s*auto/.test(wideBlock), "width is still auto — derived from height via aspect-ratio, never a stretched fixed value");
assert(/max-width:\s*100%/.test(wideBlock), "max-width: 100% is still present — a viewport narrower than it is tall still falls back to width-bound sizing, never overflowing its container");
assert(/aspect-ratio:\s*1536\s*\/\s*1024/.test(css), "the base rule's aspect-ratio (1536/1024, the master photo's real ratio) is untouched — the artwork is never stretched");
assert(
  !/overflow:\s*(hidden|clip)/.test(wideBlock),
  "the ≥820px override introduces no new overflow/clip of its own — scene content is never hidden by this fix",
);
assert(
  /overflow:\s*hidden/.test(css.match(/^\.lh-stage\s*\{([\s\S]*?)\}/m)?.[1] ?? ""),
  "the base rule's pre-existing overflow:hidden (for the stage's own rounded corners, not viewport cropping) is untouched",
);

section("3. The existing BottomNav clearance mechanism this fix relies on is still in place");

assert(
  fileContains("client/src/index.css", /\.main-safe\s*\{\s*padding-bottom:\s*calc\(env\(safe-area-inset-bottom/),
  "client/src/index.css still defines .main-safe's BottomNav clearance — the one thing this fix trusts instead of re-guessing",
);
assert(
  fileContains("client/src/components/layout/app-shell.tsx", /<main className="[^"]*\bmain-safe\b/),
  "<main> in app-shell.tsx still applies main-safe unconditionally, including on Living Home routes",
);

function fileContains(path: string, pattern: RegExp): boolean {
  return pattern.test(readFileSync(join(process.cwd(), path), "utf8"));
}

console.log("\n" + "─".repeat(40));
console.log(`PANTRY STAGE RESPONSIVE SIZING TESTS: ${passed} passed, ${failed} failed`);
console.log("─".repeat(40));
console.log("Note: this proves the fix is present and the stated guarantees hold in source.");
console.log("It does NOT confirm the owner's exact pixel targets — that needs a live screenshot.");

if (failed > 0) {
  console.error("FAILED");
  process.exit(1);
} else {
  console.log("All tests passed.");
}
