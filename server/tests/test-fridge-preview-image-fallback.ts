/**
 * test-fridge-preview-image-fallback.ts
 * ======================================
 * FRIDGE-IMG1 — Codex's live post-fix review (THA-SYNTHETIC-POST-FIX-LIVE-REVIEW-
 * CODEX-2026-10-05.md) found seven rendered `<img>` elements with empty `src` and
 * `naturalWidth=0` at `/pantry/fridge-preview`, viewport 898×612, attached to
 * fridge "Move [item]" buttons.
 *
 * Trace result (source-only, no live app): the visible food in this scene is the
 * single master photo on `.fridge-preview-canvas`'s CSS background-image
 * (fridge-interaction-preview.css). Each `DraggableFood` button is a transparent
 * interaction hotspot layered on top of it. Its `<img src={item.src}>` has always
 * been `visibility: hidden` — it has never been part of the visible scene — and
 * exists only so `DragOverlay`'s drag-ghost (`active.src ? <img .../> : <span>…`)
 * has a thumbnail to show while an item is being picked up.
 *
 * `OBJECTS_ALL` carries `src: ""` for exactly seven items: Grapes, Fresh cream,
 * Lemon cordial, Eggs, Strawberries, Blueberries, Horseradish sauce — the exact
 * count Codex found live. The authoritative extraction record,
 * `fridge-labelled-master/manifest.json` (written by
 * `scripts/extract-labelled-fridge-objects.py`), has NO entry for any of these
 * seven names — confirming this is missing item image data (no individual crop
 * was ever extracted for them), not an invalid path or a rendering defect. No
 * other asset in the repository is a safe, already-established substitute (a
 * same-name asset exists for "eggs"/"grapes" under
 * client/src/assets/living-home/larder/fridge/, but it belongs to a different,
 * differently-cropped asset family with no established mapping to this
 * component's master-photo coordinate system — using it would be guessing a
 * mapping, which this fix does not do).
 *
 * The fix: `DraggableFood` now only renders its hidden `<img>` when `item.src` is
 * non-empty. This removes exactly the empty-src/zero-natural-size `<img>` element
 * Codex found, changes nothing visible (the element was never shown), invents no
 * product image, and leaves `DragOverlay`'s existing honest text fallback
 * (`<span>{active.name}</span>`) untouched for these seven items.
 *
 * Run with: npx tsx server/tests/test-fridge-preview-image-fallback.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const component = readFileSync(
  join(root, "client/src/pages/fridge-interaction-preview.tsx"),
  "utf8",
);
const css = readFileSync(
  join(root, "client/src/pages/fridge-interaction-preview.css"),
  "utf8",
);
const manifest = JSON.parse(
  readFileSync(
    join(root, "client/public/images/living-home/room/fridge-labelled-master/manifest.json"),
    "utf8",
  ),
) as { items: Record<string, unknown> };

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

// ─── Extract OBJECTS_ALL's { name, src } pairs from source text ────────────────
// (Mirrors the project's existing static-source-contract test convention —
// test-synthetic-review-ui-contract.ts — rather than importing the page module,
// which pulls in @dnd-kit/wouter/toast machinery unsafe to load outside a browser.)

const objectsAllBlock = component.match(/const OBJECTS_ALL: FridgeObject\[\] = \[([\s\S]*?)\n\];/)?.[1] ?? "";
assert(objectsAllBlock.length > 0, "OBJECTS_ALL array block is found in source");

const itemPattern = /\{\s*name:\s*"([^"]+)",\s*src:\s*"([^"]*)"/g;
const items: Array<{ name: string; src: string }> = [];
let m: RegExpExecArray | null;
while ((m = itemPattern.exec(objectsAllBlock)) !== null) {
  items.push({ name: m[1], src: m[2] });
}

section("1. Exactly the seven items Codex found live have empty src");

const EXPECTED_EMPTY_SRC_NAMES = [
  "Grapes",
  "Fresh cream",
  "Lemon cordial",
  "Eggs",
  "Strawberries",
  "Blueberries",
  "Horseradish sauce",
].sort();

const actualEmptySrcNames = items.filter((i) => i.src === "").map((i) => i.name).sort();

assert(items.length >= 20, "OBJECTS_ALL parsed a realistic number of items", `parsed ${items.length}`);
assert(
  actualEmptySrcNames.length === 7,
  "exactly seven OBJECTS_ALL items have an empty src",
  `found ${actualEmptySrcNames.length}: ${actualEmptySrcNames.join(", ")}`,
);
assert(
  JSON.stringify(actualEmptySrcNames) === JSON.stringify(EXPECTED_EMPTY_SRC_NAMES),
  "the seven empty-src items are exactly Grapes, Fresh cream, Lemon cordial, Eggs, Strawberries, Blueberries, Horseradish sauce",
  `got: ${actualEmptySrcNames.join(", ")}`,
);

section("2. Root cause — none of the seven has an extraction-manifest entry");

for (const name of EXPECTED_EMPTY_SRC_NAMES) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  assert(
    !(slug in manifest.items),
    `"${name}" (slug "${slug}") has no fridge-labelled-master/manifest.json entry — confirms missing data, not a broken reference`,
  );
}

section("3. Populated-src items DO have a manifest entry (sanity check on the parser/manifest)");

const populatedSample = items.filter((i) => i.src !== "").slice(0, 5);
assert(populatedSample.length === 5, "at least five populated-src items were parsed for the sanity check");
for (const item of populatedSample) {
  const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  assert(
    slug in manifest.items,
    `"${item.name}" (a populated-src item) DOES have a manifest entry, confirming the manifest is the real extraction record`,
  );
}

section("4. The fix — DraggableFood never renders an empty-src <img>");

const itemSrcImgOccurrences = component.match(/<img src=\{item\.src\}/g) ?? [];
assert(
  itemSrcImgOccurrences.length === 1,
  "exactly one <img src={item.src}> render site exists in the component",
  `found ${itemSrcImgOccurrences.length}`,
);
assert(
  /\{item\.src\s*&&\s*<img src=\{item\.src\}/.test(component),
  "that one render site is conditional on item.src being non-empty — no empty-src <img> is ever mounted",
);

section("5. Existing honest fallback (DragOverlay) is untouched, and aspect ratio is preserved");

assert(
  /active\.src \? <img src=\{active\.src\} alt="" \/> : <span>\{active\.name\}<\/span>/.test(component),
  "DragOverlay still falls back to the item's plain-text name when src is empty — unchanged by this fix",
);
assert(
  /\.fridge-preview-object img \{[^}]*object-fit:\s*contain/.test(css),
  "the (now-conditionally-rendered) hidden <img> still uses object-fit: contain — no stretching introduced",
);

console.log("\n" + "─".repeat(40));
console.log(`FRIDGE PREVIEW IMAGE FALLBACK TESTS: ${passed} passed, ${failed} failed`);
console.log("─".repeat(40));

if (failed > 0) {
  console.error("FAILED");
  process.exit(1);
} else {
  console.log("All tests passed.");
}
