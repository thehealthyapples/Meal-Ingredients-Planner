// Phase-2 evidence capture for the Living Home vertical slice.
//
// Uses the no-password instant-access trial (no credentials handled) to reach the
// protected /pantry room, then captures both working positions and the Living
// Object interaction states at desktop and mobile.
//
// Usage: npx tsx scripts/capture-living-home-phase2.ts
import { chromium, type Page } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/phase2-evidence");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function startTrialAndOpenPantry(page: Page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  // Instant-access trial — the same no-password call the "Start a free trial"
  // button makes (POST /api/demo/start sets the session cookie). No credentials.
  await page.evaluate(async () => {
    await fetch("/api/demo/start", { method: "POST", credentials: "include" });
  });
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/pantry`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Walk to the shelves/ }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(1500); // let the Arrival plate paint
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, name) });
  // eslint-disable-next-line no-console
  console.log("captured", name);
}

async function run() {
  const browser = await chromium.launch();
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await startTrialAndOpenPantry(page);

      // Position 1 — Arrival
      await shot(page, `arrival-${vp.name}.png`);

      // Move to the shelves
      await page.getByRole("button", { name: /Walk to the shelves/ }).click();
      await page.waitForTimeout(1400); // crossfade + jars paint
      await page.getByRole("button", { name: /Rolled oats/ }).waitFor({ timeout: 10000 });

      // Position 2 — Shelves (resting)
      await shot(page, `shelves-${vp.name}.png`);

      // Hover-lift on a jar (desktop only — hover is meaningful with a pointer)
      if (vp.name === "desktop") {
        const oats = page.getByRole("button", { name: /Rolled oats/ });
        await oats.hover();
        await page.waitForTimeout(400);
        await shot(page, `shelves-hover-lift-${vp.name}.png`);

        // Mid-drag: lift + contact shadow + drop-target highlight
        const box = await oats.boundingBox();
        if (box) {
          const sx = box.x + box.width / 2;
          const sy = box.y + box.height / 2;
          await page.mouse.move(sx, sy);
          await page.mouse.down();
          await page.mouse.move(sx + 40, sy + 120, { steps: 8 });
          await page.mouse.move(sx + 120, sy + 190, { steps: 10 }); // toward the lower board
          await page.waitForTimeout(300);
          await shot(page, `shelves-drag-${vp.name}.png`);
          await page.mouse.up();
          await page.waitForTimeout(500);
          await shot(page, `shelves-after-drop-${vp.name}.png`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

run().then(() => console.log("done")).catch((e) => { console.error(e); process.exit(1); });
