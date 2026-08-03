// Evidence capture for the CONCEPT-LOCK build: multi-selection Category workspace
// + Companion knowledge ownership. Arrival → Shelves → Flours → select one / many.
// No-password trial (POST /api/demo/start). Usage: npx tsx scripts/capture-living-home-concept.ts
import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/concept-evidence");
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

      await shot(page, `1-arrival-${vp.name}.png`);
      await page.getByRole("button", { name: /Walk to the shelves/ }).click();
      await page.waitForTimeout(900);
      await shot(page, `2-shelves-${vp.name}.png`);

      await page.getByRole("button", { name: /Move closer to Flours/ }).click();
      await page.waitForTimeout(900);
      await shot(page, `3-flours-workspace-${vp.name}.png`);

      // select one → the Living Object's controls + Ask Apple
      await page.getByRole("button", { name: "Wholemeal", exact: true }).click();
      await page.waitForTimeout(500);
      await shot(page, `4-one-selected-${vp.name}.png`);

      // select several → batch tray
      await page.getByRole("button", { name: "White", exact: true }).click();
      await page.getByRole("button", { name: "Spelt", exact: true }).click();
      await page.waitForTimeout(500);
      await shot(page, `5-many-selected-${vp.name}.png`);

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

run().then(() => console.log("done")).catch((e) => { console.error(e); process.exit(1); });
