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

console.log("cookbook real book contract: ok");
