import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs"; import path from "path";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/pantry-final-evidence"); mkdirSync(OUT, { recursive: true });
async function open(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await fetch("/api/demo/start", { method: "POST", credentials: "include" }); });
  await page.waitForTimeout(700);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("lh-area-fruit-bowl").waitFor({ timeout: 15000 });
  await page.waitForTimeout(1000);
}
async function shot(p: Page, n: string){ await p.screenshot({ path: path.join(OUT, n) }); console.log(n); }
async function run() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); await open(page);
  const areas = ["cupboard","tea-coffee","rootveg","bread","freezer","worktop"];
  for (const a of areas) {
    await page.getByTestId(`lh-area-${a}`).click();
    await page.waitForTimeout(1100);
    await shot(page, `${a}.png`);
  }
  await ctx.close(); await b.close();
}
run().then(() => console.log("done")).catch((e) => { console.error(String(e).split("\n")[0]); process.exit(1); });
