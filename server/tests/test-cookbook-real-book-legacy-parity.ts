import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const route = readFileSync(path.join(root, "client/src/pages/cookbook-real-book-concept.tsx"), "utf8");
const serverRoutes = readFileSync(path.join(root, "server/routes.ts"), "utf8");

function handlerBody(source: string, signature: string, nextSignature: string): string {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `route exists: ${signature}`);
  const end = source.indexOf(nextSignature, start + signature.length);
  assert.notEqual(end, -1, `next route boundary exists after ${signature}`);
  return source.slice(start, end);
}

// The physical Cookbook must preserve legacy recipe-search capability rather than
// presenting its saved-recipe filter as if it were the complete Search feature.
assert.match(route, /usePlannerMealSearch/, "Real Book reuses the canonical shared local/web recipe search hook");
assert.match(route, /enableWebSearch:\s*true/, "Real Book activates trusted web recipe discovery");
assert.match(route, /setIncludeWeb\(mode\s*===\s*["']trusted["']\)/, "Network search state follows the visible Real Book search mode");
assert.match(route, /My Cookbook/, "Real Book names the saved-recipe search mode explicitly");
assert.match(route, /Trusted recipe sources/, "Real Book names the external search mode explicitly");
assert.match(route, /webResults/, "Real Book renders external recipe results separately from saved meals");
assert.match(route, /webLoading/, "Real Book exposes the external-search loading state");
assert.match(route, /Preview recipe/, "External recipes can be previewed before they are saved");
assert.match(route, /Add to my Cookbook/, "External recipes can be imported into the household Cookbook");
assert.match(route, /recipe\.source/, "External results preserve visible source/provider attribution");
assert.match(route, /recipe\.url/, "External results retain a link to the original source");
assert.match(route, /acquisitionLane/, "Imported web recipes preserve canonical acquisition provenance");
assert.match(route, /Scan recipe/, "The Real Book retains the legacy scan-recipe entry");
assert.match(route, /\/cookbook\?openScan=1/, "Scan recipe enters the canonical legacy Cookbook scanner");
assert.match(route, /\/api\/preview-recipe/, "Sparse external results use the canonical preview fallback");
assert.match(route, /\}, \[selectedWeb\]\);/, "Preview cache updates do not cancel their own in-flight request");
assert.match(route, /Loading recipe details/, "The Real Book exposes preview loading state");
assert.match(route, /Couldn.t load recipe details/, "The Real Book exposes preview failure state");

// The legacy endpoint has a recorded fail-open gap. Closing parity must not expose
// web results until the canonical full-household dietary context is resolved.
const searchHandler = handlerBody(
  serverRoutes,
  'app.get(api.search.recipes.path',
  'app.post(api.import.recipe.path',
);
assert.match(searchHandler, /resolveHouseholdSafetyContext\(req\.user!\.id\)/, "Web recipe search resolves canonical household safety");
assert.match(searchHandler, /status\s*===\s*["']unavailable["']/, "Web recipe search detects an unavailable safety context");
assert.match(searchHandler, /HOUSEHOLD_SAFETY_UNAVAILABLE/, "Web recipe search fails closed with the canonical safety code");
assert.match(searchHandler, /isMealSafeForHousehold/, "Every returned external recipe passes the canonical household gate");

const previewStart = serverRoutes.indexOf("app.post('/api/preview-recipe'");
const previewEnd = serverRoutes.indexOf("app.get('/api/product-alternatives'", previewStart);
assert.ok(previewStart >= 0 && previewEnd > previewStart, "preview recipe handler boundaries exist");
const previewHandler = serverRoutes.slice(previewStart, previewEnd);
assert.match(previewHandler, /resolveHouseholdSafetyContext\(req\.user!\.id\)/, "Preview resolves canonical household safety");
assert.match(previewHandler, /HOUSEHOLD_SAFETY_UNAVAILABLE/, "Preview fails closed when household safety is unavailable");
assert.match(previewHandler, /isMealSafeForHousehold/, "Extracted preview content passes the canonical household gate");
assert.match(previewHandler, /RECIPE_UNSAFE_FOR_HOUSEHOLD/, "Unsafe preview content is withheld explicitly");

console.log("cookbook legacy-grid functional parity contract: ok");
