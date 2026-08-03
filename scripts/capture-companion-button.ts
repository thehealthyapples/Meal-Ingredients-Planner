import { chromium } from "playwright";
import path from "path";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/interaction-evidence");
async function run() {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 6 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await fetch("/api/demo/start", { method: "POST", credentials: "include" }); });
  await page.waitForTimeout(700);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  // the canonical Companion door (top-right) — the button itself
  const btn = page.getByTestId("button-open-assistant");
  await btn.waitFor({ timeout: 15000 });
  await page.waitForTimeout(1000);
  await btn.screenshot({ path: path.join(OUT, "companion-button.png"), omitBackground: true });
  console.log("companion-button.png");
  // and the bare emblem/mark only (no button padding), from the in-room destination
  const mark = page.locator(".lh-companion-mark .companion-emblem");
  if (await mark.count()) {
    await mark.first().screenshot({ path: path.join(OUT, "companion-emblem.png"), omitBackground: true });
    console.log("companion-emblem.png");
  }
  await ctx.close(); await b.close();
}
run().then(() => console.log("done")).catch((e) => { console.error(String(e).split("\n")[0]); process.exit(1); });
