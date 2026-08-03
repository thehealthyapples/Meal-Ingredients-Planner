// Evidence capture for the first complete Living Home journey:
// Arrival → Shelves → Flours → Wholemeal → Lift → Return.
//
// Uses the no-password instant-access trial (POST /api/demo/start). No credentials.
// Usage: npx tsx scripts/capture-living-home-journey.ts
import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/journey-evidence");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function openPantry(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await fetch("/api/demo/start", { method: "POST", credentials: "include" }); });
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Walk to the shelves/ }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(1400);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("captured", name);
}

async function run() {
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await openPantry(page);

      // 1 · Arrival
      await shot(page, `1-arrival-${vp.name}.png`);

      // 2 · Shelves (groups)
      await page.getByRole("button", { name: /Walk to the shelves/ }).click();
      await page.waitForTimeout(900);
      await page.getByRole("button", { name: /Move closer to Flours/ }).waitFor({ timeout: 8000 });
      await shot(page, `2-shelves-${vp.name}.png`);

      // 3 · Flours (category)
      await page.getByRole("button", { name: /Move closer to Flours/ }).click();
      await page.waitForTimeout(900);
      await page.getByRole("button", { name: /Move closer to Wholemeal/ }).waitFor({ timeout: 8000 });
      await shot(page, `3-flours-${vp.name}.png`);

      // 4 · Wholemeal (object)
      await page.getByRole("button", { name: /Move closer to Wholemeal/ }).click();
      await page.waitForTimeout(900);
      const hero = page.getByRole("button", { name: /Wholemeal .* lift it/ });
      await hero.waitFor({ timeout: 8000 });
      await shot(page, `4-wholemeal-${vp.name}.png`);

      // 5 · Lift (desktop only — pointer drag mid-lift)
      if (vp.name === "desktop") {
        const box = await hero.boundingBox();
        if (box) {
          const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
          await page.mouse.move(cx, cy);
          await page.mouse.down();
          await page.mouse.move(cx + 30, cy - 60, { steps: 8 });
          await page.waitForTimeout(250);
          await shot(page, `5-lift-${vp.name}.png`);
          await page.mouse.up();          // Return — settles back onto its point
          await page.waitForTimeout(600);
          await shot(page, `6-return-${vp.name}.png`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

run().then(() => console.log("done")).catch((e) => { console.error(e); process.exit(1); });
