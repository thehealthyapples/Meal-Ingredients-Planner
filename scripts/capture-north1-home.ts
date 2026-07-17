// NORTH1 — before/after captures of the authenticated Home (/home), the North Star room.
// Usage: npx tsx scripts/capture-north1-home.ts <label>   (label = "before" | "after")
//
// Modelled on the ODL1 harness it replaces in purpose: zero-write DEV-world login,
// desktop + mobile viewports, saved under docs/ui-audit/north1-home/.
//
// Both a fullPage and a viewport-only crop are taken at each size. The viewport crop is
// the one that matters for the North Star: it is what a household actually sees on
// arrival, before it has scrolled anything.
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/north1-home");
const LABEL = process.argv[2] ?? "before";

// The shell scrolls an inner <main> inside a h-[100dvh] frame, so Playwright's
// `fullPage` returns the viewport and nothing more — the room below the fold is simply
// invisible to it. The tall viewports are the fix: the room lays itself out at that
// height, so one shot holds the whole of it. The 900/844 pair remains the one that
// matters for the North Star — it is what a household actually sees on arrival.
// 1024 is not decoration. It is the `lg` breakpoint — the narrowest room in which the
// orchard stands BESIDE the greeting rather than above it, and therefore the width at
// which the window's clearance over the household's name is tightest. Blueprint §6.1
// ("the orchard never carries text, without negotiation") is at its closest to being
// broken here and nowhere else, so this is the shot that proves it. The first version of
// this composition was correct at 1440 and laid the orchard through the greeting at 768;
// a harness that only ever looked at 1440 is how that shipped.
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "desktop-full", width: 1440, height: 2000 },
  { name: "lg-narrow", width: 1024, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
  { name: "mobile-full", width: 390, height: 1800 },
] as const;

// THE QUIET DAY — the state the North Star render could never be tested against, and the
// one the room most needs to survive.
//
// NORTH1 § 3 scored the reference against "composed emptiness, never bare emptiness" and
// returned the only honest verdict available: *cannot be assessed, and that is a finding*
// — "a rendered kitchen ALWAYS looks lived-in, even when the household has done nothing.
// The render cannot fail at the state the design most needs to survive."
//
// Software can fail at it, so software must be shown facing it. These stubs are the
// quiet day: nothing planned, nothing to buy, no weekly picture yet, and a Companion with
// nothing worth saying. If Home is only warm because it is full, it is not warm — it is
// busy. The proof is `quiet-day-*.png`, and it is captured every run so it cannot quietly
// stop being true.
const QUIET_DAY: Record<string, unknown> = {
  "**/api/planner/full": [],
  "**/api/shopping-list*": [],
  "**/api/home/intelligence": { weeklyProgress: null },
  "**/api/intelligence/companion/notices": { notices: [], gatheredCount: 0 },
};

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  // The quiet day, at the two sizes that matter.
  for (const vp of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 1500 },
  ]) {
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
    for (const [glob, body] of Object.entries(QUIET_DAY)) {
      await page.route(glob, (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }),
      );
    }
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, `quiet-day-${vp.name}.png`) });
    await ctx.close();
    console.log(`captured quiet-day-${vp.name}`);
  }

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
    // Let the queries land, the webfonts paint, and the Companion's held entrance settle.
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: path.join(OUT, `${LABEL}-${vp.name}.png`),
      fullPage: true,
    });
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
