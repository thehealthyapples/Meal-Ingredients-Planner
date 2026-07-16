// ODL1 — before/after captures of the authenticated Home (/home).
// Usage: npx tsx scripts/capture-odl1-home.ts <label>   (label = "before" | "after")
// Modeled on scripts/capture-exp4-materiality-depth.ts: zero-write DEV-world login,
// desktop + mobile viewports, saved under docs/ui-audit/odl1-home-orchard/.
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/odl1-home-orchard");
const LABEL = process.argv[2] ?? "before";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const login = await ctx.request.post(`${BASE}/api/login`, {
      data: {
        username: "price.single.parent.owner@dev.thehealthyapples.dev",
        password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
      },
    });
    if (!login.ok()) throw new Error(`login failed: ${login.status()}`);

    const page = await ctx.newPage();
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2200); // let queries + entrance settle
    await page.screenshot({
      path: path.join(OUT, `${LABEL}-${vp.name}.png`),
      fullPage: true,
    });
    // viewport-only crop too (what a household actually sees on arrival)
    await page.screenshot({
      path: path.join(OUT, `${LABEL}-${vp.name}-viewport.png`),
      fullPage: false,
    });
    await ctx.close();
    console.log(`captured ${LABEL}-${vp.name}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
