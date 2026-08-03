import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs"; import path from "path";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/prod1-evidence"); mkdirSync(OUT, { recursive: true });
async function open(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await fetch("/api/demo/start", { method: "POST", credentials: "include" }); });
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Walk to the shelves/ }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(1400);
}
async function run() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); await open(page);
  for (const z of ["fridge", "tea-coffee"]) {
    await page.getByTestId(`lh-hotspot-${z}`).click(); await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `${z}.png`) }); console.log(z);
    await page.getByTestId("lh-back").click(); await page.waitForTimeout(800);
  }
  await ctx.close(); await b.close();
}
run().then(() => console.log("done")).catch((e) => { console.error(String(e).split("\n")[0]); process.exit(1); });
