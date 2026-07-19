// PROD6 browser verification — drives the WITHHELD household-safe preview branch.
// The server-side gate drops the preview and sets householdSafeUnavailableReason;
// this mocks exactly that response shape so the new client branch renders for real.
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/prod6-safety-gate");
const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

// What the PROD6 gate returns when the AI proposed something unsafe.
const WITHHELD_VIOLATION = {
  adaptations: [],
  householdExtraIngredients: [],
  cookingNote: null,
  householdSafePreview: null,
  householdSafeUnavailableReason: "adaptation-violates-restrictions",
};
const WITHHELD_UNRESOLVED = {
  ...WITHHELD_VIOLATION,
  householdSafeUnavailableReason: "safety-context-unavailable",
};

async function run(browser: any, label: string, body: unknown) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
  if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e: any) => errors.push(String(e)));
  page.on("console", (m: any) => { if (m.type() === "error") errors.push(m.text()); });

  await page.route("**/api/planner/entries/*/adapt", (route: any) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));

  await page.goto(`${BASE}/planner`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // Open the first meal in the planner.
  const mealBtn = page.locator('[data-testid^="button-meal-"]').first();
  if (await mealBtn.count() === 0) { console.log(`${label}: NO MEAL IN PLANNER`); await ctx.close(); return; }
  await mealBtn.click();
  await page.waitForTimeout(2000);

  const adapt = page.locator('[data-testid="button-adapt"]');
  if (await adapt.count() === 0) { console.log(`${label}: NO ADAPT BUTTON`); await ctx.close(); return; }
  await adapt.first().click();
  await page.waitForTimeout(2500);

  const text = await page.locator("body").innerText();
  const expected = body === WITHHELD_UNRESOLVED
    ? "couldn't confirm your household's dietary needs"
    : "couldn't find a household-safe version";
  const shown = text.includes(expected);
  // The withheld suggestion must not appear anywhere.
  const leaked = /tahini|almond flour|smoked tofu/i.test(text);

  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: false });
  console.log(`${label}: notice=${shown ? "SHOWN" : "MISSING"} leak=${leaked ? "LEAKED" : "none"} jsErrors=${errors.length}`);
  if (errors.length) console.log(errors.slice(0, 3));
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  await run(browser, "withheld-violation", WITHHELD_VIOLATION);
  await run(browser, "withheld-unresolved", WITHHELD_UNRESOLVED);
  await browser.close();
})();
