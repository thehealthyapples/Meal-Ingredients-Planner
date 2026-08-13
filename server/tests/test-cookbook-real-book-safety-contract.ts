import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const routes = readFileSync(path.join(root, "server/routes.ts"), "utf8");
const start = routes.indexOf('app.get(api.search.recipes.path');
const end = routes.indexOf('app.post(api.import.recipe.path', start);
assert.ok(start >= 0 && end > start, "search recipe handler boundaries exist");
const body = routes.slice(start, end);

assert.match(body, /resolveHouseholdSafetyContext\(req\.user!\.id\)/);
assert.match(body, /status\s*===\s*["']unavailable["']/);
assert.match(body, /HOUSEHOLD_SAFETY_UNAVAILABLE/);
assert.match(body, /isMealSafeForHousehold\(/);
assert.match(body, /name:\s*recipe\.name/);
assert.match(body, /ingredients:\s*recipe\.ingredients/);
assert.match(body, /instructions:\s*recipe\.instructions/);
assert.ok(body.indexOf("isMealSafeForHousehold") < body.indexOf("const start = (page - 1)"), "safety gate precedes pagination");

console.log("cookbook search canonical safety contract: ok");
