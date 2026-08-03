import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs";
import path from "path";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/rooms-evidence");
mkdirSync(OUT, { recursive: true });
async function openPantry(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await fetch("/api/demo/start", { method: "POST", credentials: "include" }); });
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Walk to the shelves/ }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(1400);
}
async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await openPantry(page);
  await page.screenshot({ path: path.join(OUT, "arrival.png") }); console.log("arrival");
  for (const z of ["fridge", "freezer", "cupboard", "baskets"]) {
    await page.getByTestId(`lh-hotspot-${z}`).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `${z}.png`) }); console.log(z);
    await page.getByTestId("lh-back").click();
    await page.waitForTimeout(900);
  }
  await context.close(); await browser.close();
}
run().then(() => console.log("done")).catch((e) => { console.error(String(e).split("\n")[0]); process.exit(1); });
