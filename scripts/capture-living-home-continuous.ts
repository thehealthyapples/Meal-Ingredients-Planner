import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs"; import path from "path";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/refine02-evidence"); mkdirSync(OUT, { recursive: true });
async function open(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await fetch("/api/demo/start", { method: "POST", credentials: "include" }); });
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Walk to the shelves/ }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(1400);
}
async function shot(p: Page, n: string){ await p.screenshot({ path: path.join(OUT, n) }); console.log(n); }
async function run() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); await open(page);
  await shot(page, "1-arrival.png");
  // continuous nav: arrival → shelves → fridge → cupboard, NO returning to arrival
  await page.getByTestId("lh-hotspot-shelves").click(); await page.waitForTimeout(1100); await shot(page, "2-shelves.png");
  await page.getByTestId("lh-hotspot-fridge").click();  await page.waitForTimeout(1100); await shot(page, "3-shelves-to-fridge.png");
  await page.getByTestId("lh-hotspot-cupboard").click(); await page.waitForTimeout(1100); await shot(page, "4-fridge-to-cupboard.png");
  // cupboard hierarchy: categories → a category's items
  await page.getByTestId("lh-opencat-beans").click(); await page.waitForTimeout(1000); await shot(page, "5-cupboard-beans.png");
  await ctx.close(); await b.close();
}
run().then(() => console.log("done")).catch((e) => { console.error(String(e).split("\n")[0]); process.exit(1); });
