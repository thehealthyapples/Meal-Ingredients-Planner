import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { filterCookbookMeals, paginateCookbookMeals } from "../../client/src/lib/cookbook-real-book/collection";

const meals = [
  { id: 1, name: "Family Soup", ingredients: ["carrot"], isDrink: false, mealFormat: "meal", isReadyMeal: false, mealSourceType: "manual", isSystemMeal: false, sourceUrl: null, retiredAt: null },
  { id: 2, name: "Apple Cake", ingredients: ["apple"], isDrink: false, mealFormat: "meal", isReadyMeal: false, mealSourceType: "manual", isSystemMeal: false, sourceUrl: null, retiredAt: null },
  { id: 3, name: "Herbal Tea", ingredients: [], isDrink: true, mealFormat: "drink", isReadyMeal: false, mealSourceType: "manual", isSystemMeal: false, sourceUrl: null, retiredAt: null },
  { id: 4, name: "More Soup", ingredients: ["carrot"], isDrink: false, mealFormat: "meal", isReadyMeal: false, mealSourceType: "manual", isSystemMeal: false, sourceUrl: null, retiredAt: null },
] as unknown as import("../../shared/schema").Meal[];

const all = filterCookbookMeals(meals, "", "all");
assert.equal(all.length, 4);
assert.equal(filterCookbookMeals(meals, "carrot", "household").length, 2);
assert.equal(filterCookbookMeals(meals, "", "drinks")[0].id, 3);
assert.deepEqual(paginateCookbookMeals(all, 1, 2).map((meal) => meal.id), [3, 4]);
assert.deepEqual(paginateCookbookMeals(all, 99, 2).map((meal) => meal.id), []);

const here = path.dirname(fileURLToPath(import.meta.url));
const pageSource = readFileSync(path.resolve(here, "../../client/src/pages/cookbook-real-book-concept.tsx"), "utf8");
assert.match(pageSource, /import\s+\{[^}]*\bRealBookStage\b[^}]*\}\s+from\s+["']@\/components\/cookbook-real-book["']/);
assert.doesNotMatch(pageSource, /function\s+RealBookStageSeam/);
assert.match(pageSource, /<RealBookStage\s+collectionPage=/);
const createPosition = pageSource.indexOf("Create your own");
const searchPosition = pageSource.indexOf('aria-label="Search recipes"');
assert.ok(createPosition >= 0 && searchPosition > createPosition, "Search is semantically after Create at the approved bottom-left");
assert.match(pageSource, /const PAGE_SIZE = 6;/, "compact page shows six recipes without internal scrolling");
assert.match(pageSource, /openCompanion\(\)/, "recipe offers a keyboard-accessible Companion action");
assert.doesNotMatch(pageSource, /aspect-\[4\/3\].*No photograph yet/, "missing photos do not become a large white web panel");

const stageSource = readFileSync(path.resolve(here, "../../client/src/components/cookbook-real-book/RealBookStage.tsx"), "utf8");
assert.doesNotMatch(stageSource, /cookbook-(collection|recipe)-mobile-candidate\.png/, "live mobile uses no populated candidate raster");
assert.match(stageSource, /DESKTOP_PLATE/, "the blank plate is the only live book surface");

const stageCss = readFileSync(path.resolve(here, "../../client/src/components/cookbook-real-book/real-book.css"), "utf8");
const desktopStageRule = stageCss.match(/\.rb-stage\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
assert.match(
  desktopStageRule,
  /width:\s*max\(/,
  "Phase 1: the photographed tabletop covers the desktop stage instead of exposing side gutters",
);
assert.doesNotMatch(
  desktopStageRule,
  /width:\s*min\(/,
  "Phase 1: contained plate sizing must not return",
);
assert.match(
  desktopStageRule,
  /flex:\s*0\s+0\s+auto/,
  "Phase 1: the enlarged book keeps its photographic aspect ratio while the desktop crops overflow",
);

const leftPlaneRule = stageCss.match(/\.rb-plane--left\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const rightPlaneRule = stageCss.match(/\.rb-plane--right\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const leftSafeRule = stageCss.match(/\.rb-plane--left \.rb-plane__safe\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const thumbnailRule = stageCss.match(/\.rb-recipe-grid img, \.rb-thumb-placeholder\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const lowerPrintRule = stageCss.match(/\.rb-page-nav, \.rb-create, \.rb-search, \.rb-ink-actions\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
assert.match(leftPlaneRule, /18\.6% 11\.5%/, "Page correctness: top-sheet mask excludes the exposed page stack");
assert.match(leftSafeRule, /left:\s*22\.25%/, "Page correctness: the entire left-page print field sits visibly inside the paper edge");
assert.match(leftSafeRule, /width:\s*23\.5%/, "Page correctness: the shifted left-page field still clears the spine");
assert.match(leftSafeRule, /top:\s*14%/, "Page correctness: print clears the curled top edge");
const rightSafeRule = stageCss.match(/\.rb-plane--right \.rb-plane__safe\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
assert.match(rightSafeRule, /left:\s*52\.65%/, "Page correctness: the right-page print field moves left toward the spine");
assert.match(rightSafeRule, /width:\s*29\.1%/, "Page correctness: the shifted right-page field clears the outer edge");
assert.match(thumbnailRule, /aspect-ratio:\s*4\s*\/\s*3/, "Page correctness: collection photographs are landscape");
assert.match(thumbnailRule, /height:\s*auto/, "Page correctness: collection photographs cannot stretch into portrait slots");
assert.match(lowerPrintRule, /font-size:\s*12px/, "Page correctness: lower-page controls have a legible minimum size");
assert.match(lowerPrintRule, /font-weight:\s*600/, "Page correctness: lower-page controls use clear printed contrast");
const mobileSafeRule = stageCss.match(/\.rb-plane--mobile-collection \.rb-plane__safe\s*\{([\s\S]*?)\n\s*\}/g)?.at(-1) ?? "";
assert.match(mobileSafeRule, /left:\s*24%/, "Page correctness: mobile print clears the visible stack of pages");
assert.match(mobileSafeRule, /width:\s*65%/, "Page correctness: mobile print remains within the top sheet");

// Typographic clarity: page planes stay flat and unmasked so live text is not
// rasterised and resampled through a transformed/offscreen compositing layer.
assert.doesNotMatch(leftPlaneRule, /rotateY|perspective\(/, "Clarity: the left page plane uses no 3D transform that softens live text");
assert.doesNotMatch(rightPlaneRule, /rotateY|perspective\(/, "Clarity: the right page plane uses no 3D transform that softens live text");
assert.doesNotMatch(leftPlaneRule, /mask-image/, "Clarity: the left page plane uses no offscreen gutter mask");
assert.doesNotMatch(rightPlaneRule, /mask-image/, "Clarity: the right page plane uses no offscreen gutter mask");

// The text slot stays in normal blend while photographs retain printed-on-paper
// multiply compositing.
const safeBaseRule = stageCss.match(/\.rb-plane__safe\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
assert.doesNotMatch(safeBaseRule, /mix-blend-mode/, "Clarity: the text slot keeps subpixel antialiasing");
assert.match(
  stageCss,
  /\.rb-plane__safe img[^{]*\{[^}]*mix-blend-mode:\s*multiply/,
  "Print treatment: photographs still multiply into the paper",
);

// Trusted external-recipe results and preview previously had no scoped type, so
// preflight collapsed headings to body size and result names/sources ran together.
const webPreviewRule = stageCss.match(/\.rb-web-preview\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const webPreviewHeadingRule = stageCss.match(/\.rb-web-preview h2\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const webPreviewSubheadRule = stageCss.match(/\.rb-web-preview h3\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const webResultsRule = stageCss.match(/\.rb-web-results\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const webResultsButtonRule = stageCss.match(/\.rb-web-results li button\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const webResultsSourceRule = stageCss.match(/\.rb-web-results li button > small\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
assert.match(webPreviewHeadingRule, /clamp\(23px,\s*2\.4vw,\s*38px\)/, "Legibility: trusted preview title reuses the recto heading scale");
assert.match(webPreviewHeadingRule, /Georgia/, "Legibility: trusted preview title uses the printed serif face");
assert.match(webPreviewSubheadRule, /1\.35em/, "Legibility: trusted preview subheads reuse the recto subhead scale");
assert.match(webPreviewRule, /font-size:\s*clamp\(11px,/, "Legibility: trusted preview body has a scoped minimum");
assert.match(webResultsRule, /font-size:\s*clamp\(11px,/, "Legibility: trusted result labels have a scoped minimum");
assert.match(webResultsButtonRule, /display:\s*grid/, "Spacing: trusted result name and source use separate grid lines");
assert.match(webResultsButtonRule, /gap:/, "Spacing: trusted result labels reserve a gap");
assert.match(webResultsSourceRule, /var\(--rb-ink-muted\)/, "Spacing: trusted result source is a muted secondary line");
assert.doesNotMatch(safeBaseRule, /clamp\(11px,/, "Scope: trusted-region type does not alter the global page slot");

console.log("cookbook real book contract: ok");
