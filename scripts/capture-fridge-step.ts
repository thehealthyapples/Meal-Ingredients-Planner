import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs"; import path from "path";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/pantry-final-evidence"); mkdirSync(OUT, { recursive: true });
async function run() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await fetch("/api/demo/start", { method: "POST", credentials: "include" }); });
  await page.waitForTimeout(700);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("lh-area-fridge").waitFor({ timeout: 15000 });
  await page.waitForTimeout(900);
  await page.getByTestId("lh-area-fridge").click();
  await page.waitForTimeout(1600); // let the step-in zoom settle
  await page.screenshot({ path: path.join(OUT, "fridge-step-closer.png") });
  console.log("fridge-step-closer.png");
  await ctx.close(); await b.close();
}
run().then(() => console.log("done")).catch((e) => { console.error(String(e).split("\n")[0]); process.exit(1); });
