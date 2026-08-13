import { chromium, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = "http://127.0.0.1:5197";
const OUT = path.resolve("artifacts/cookbook-real-book-integrated-review");
mkdirSync(OUT, { recursive: true });

const names = [
  "Roast chicken with thyme", "Garden vegetable soup", "Apple and oat crumble",
  "Tomato basil pasta", "Lentil shepherd's pie", "Salmon with new potatoes",
  "Family bean chilli", "Mushroom risotto", "Berry breakfast oats",
  "Carrot and coriander soup", "Sunday beef casserole", "Courgette fritters",
  "Chickpea tray bake", "Herby fish cakes", "Butternut squash pasta",
  "Spinach and ricotta bake", "Chicken noodle broth", "Leek and potato pie",
  "Pea and mint soup", "Warm lentil salad", "Apple cinnamon pancakes",
  "Roasted vegetable couscous", "Creamy tomato gnocchi", "Turkey cottage pie",
  "Broccoli cheddar bake", "Lemon herb chicken", "Vegetable noodle bowl",
];
const meals = names.map((name, i) => ({
  id: i + 1, name, brand: null, categoryId: null, userId: 1,
  ingredients: ["2 carrots", "1 onion", "fresh herbs", "olive oil"],
  instructions: ["Prepare the ingredients.", "Cook gently until tender.", "Season and serve warm."],
  imageUrl: null, servings: 4, prepTime: 15, cookTime: 35, difficulty: "easy",
  calories: null, protein: null, carbs: null, fat: null, fibre: null, sugar: null,
  dietTypes: [], tags: [], audience: "adult", isDrink: false, kind: "recipe",
  mealFormat: "meal", isReadyMeal: false, mealSourceType: "manual", isSystemMeal: false,
  sourceUrl: null, acquisitionLane: "manual", acquisitionType: "manual", acquisitionKey: null,
  variantKind: null, variantOfMealId: null, retiredAt: null, retiredReason: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}));

async function mock(page: Page) {
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/user") return json({ id: 1, username: "review", email: "review@example.test", isAdmin: false, onboardingCompleted: true, trialEndsAt: null });
    if (p === "/api/meals") return json(meals);
    if (p === "/api/site-settings/banner") return json({ enabled: false });
    if (p === "/api/user/planner-settings") return json({ enableBabyMeals: false, enableChildMeals: false, enableDrinks: false });
    if (p === "/api/planner/full" || p === "/api/household/eaters") return json([]);
    if (p.includes("unread") || p.includes("notices") || p.includes("opportunit")) return json([]);
    return json([]);
  });
}

const results: Record<string, unknown> = {};
const browser = await chromium.launch({ args: ["--no-sandbox"] });
for (const vp of [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "mobile-390x844", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  await mock(page);
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(`${BASE}/cookbook/concept-real-book`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="real-book-stage"]', { timeout: 20000 });
  await page.screenshot({ path: path.join(OUT, `${vp.name}-collection.png`) });
  const heading = await page.getByRole("heading", { name: "Our Family Favourites" }).count();
  const search = page.locator('input[aria-label="Search recipes"]:visible');
  await search.fill("soup");
  const soupButtons = await page.locator('button[aria-label^="Open recipe"]:visible').count();
  await search.fill("");
  const recipeButtons = page.locator('button[aria-label^="Open recipe"]:visible');
  const visibleRecipes = await recipeButtons.count();
  if (visibleRecipes) await recipeButtons.nth(1).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(OUT, `${vp.name}-recipe.png`) });
  results[vp.name] = {
    heading, soupButtons, visibleRecipes,
    selectedRecipe: await page.locator('article[aria-label^="Recipe:"]:visible').getAttribute("aria-label"),
    desktopCollectionVisible: await page.locator('[data-testid="real-book-desktop-collection"]').isVisible(),
    mobilePageVisible: await page.locator('[data-testid="real-book-mobile-page"]').isVisible(),
    searchAfterCreate: await page.evaluate(() => {
      const create = Array.from(document.querySelectorAll("*"))[Symbol.iterator]();
      void create;
      const input = document.querySelector('input[aria-label="Search recipes"]');
      const section = document.querySelector('section[aria-label="Create or import a recipe"]');
      return !!input && !!section && !!(section.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING);
    }),
    errors,
  };
  await page.close();
}
await browser.close();
writeFileSync(path.join(OUT, "interaction-results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
