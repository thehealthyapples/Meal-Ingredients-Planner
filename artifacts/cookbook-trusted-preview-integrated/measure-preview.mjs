import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const base = "http://127.0.0.1:5197";
const out = {};
const meals = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1, name: `Family recipe ${i + 1}`, userId: 1,
  ingredients: ["carrots", "onion"], instructions: ["Prepare.", "Cook."],
  isDrink: false, mealFormat: "meal", isReadyMeal: false, mealSourceType: "manual",
  isSystemMeal: false, sourceUrl: null, retiredAt: null, imageUrl: null,
}));
const webRecipes = [{ id: "trusted-1", name: "Roasted tomato and lentil soup", image: "", url: "https://example.test/recipe", category: "Soup", cuisine: "British", ingredients: [], instructions: [], source: "BBC Good Food" }];
const browser = await chromium.launch({ args: ["--no-sandbox"] });
for (const vp of [{ name: "desktop-1440x900", width: 1440, height: 900 }, { name: "mobile-390x844", width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.route("**/api/**", route => {
    const p = new URL(route.request().url()).pathname;
    const body = p === "/api/user" ? { id: 1, username: "review", onboardingCompleted: true }
      : p === "/api/meals" ? meals
      : p === "/api/search-recipes" ? { recipes: webRecipes, hasMore: false }
      : p === "/api/preview-recipe" ? { ingredients: ["6 ripe tomatoes", "150g red lentils", "vegetable stock"], instructions: ["Roast the tomatoes.", "Simmer with lentils and stock.", "Blend and serve."] }
      : p === "/api/site-settings/banner" ? { enabled: false }
      : [];
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto(`${base}/cookbook/concept-real-book`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="real-book-stage"]');
  await page.getByRole("button", { name: "Trusted recipe sources", exact: true }).filter({ visible: true }).click();
  await page.locator('input[aria-label="Search recipes"]:visible').fill("soup");
  await page.getByRole("button", { name: /Preview recipe Roasted/ }).filter({ visible: true }).click();
  await page.getByText("6 ripe tomatoes", { exact: true }).filter({ visible: true }).waitFor();
  out[vp.name] = await page.locator(".rb-web-preview:visible").evaluate(el => {
    const title = el.querySelector("h2");
    const subhead = el.querySelector("h3");
    const box = el.getBoundingClientRect();
    const last = el.lastElementChild?.getBoundingClientRect();
    return {
      preview: { width: box.width, height: box.height, scrollHeight: el.scrollHeight, overflowY: getComputedStyle(el).overflowY },
      title: title ? { fontSize: getComputedStyle(title).fontSize, lineHeight: getComputedStyle(title).lineHeight, fontFamily: getComputedStyle(title).fontFamily } : null,
      subhead: subhead ? { fontSize: getComputedStyle(subhead).fontSize, fontFamily: getComputedStyle(subhead).fontFamily } : null,
      lastChildInside: last ? last.bottom <= box.bottom + 0.5 : null,
      pageSafeScrollHeight: el.parentElement?.scrollHeight,
      pageSafeClientHeight: el.parentElement?.clientHeight,
    };
  });
  await page.close();
}
await browser.close();
writeFileSync("artifacts/cookbook-trusted-preview-integrated/computed-layout.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
