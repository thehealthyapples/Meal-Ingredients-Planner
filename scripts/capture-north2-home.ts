// NORTH2 — before/after captures of the authenticated Home (/home), the North Star room.
// Usage: npx tsx scripts/capture-north2-home.ts <label>   (label = "before" | "after")
//
// The NORTH1 harness, repointed at docs/ui-audit/north2-home/. Its viewport choices are
// inherited deliberately and none of them is decoration — each was paid for by a defect
// that shipped past every gate and was only ever findable by looking:
//
//   • 1024 (`lg`) — the narrowest room where the orchard stands BESIDE the greeting, so
//     the window's clearance over the household's name is tightest here and nowhere else.
//     NORTH1 §6.1: a composition correct at 1440 laid the orchard through "Welcome home,"
//     at 768.
//   • 820 (tablet) — NORTH1 §6.2's tailwind-merge variant trap (`sm:pt-6` beating an
//     unprefixed `pt-[…]`) was invisible at 390 and at 1440, and only 820 showed it.
//   • The quiet day — the state a rendered kitchen can never fail at and software can.
//
// NORTH2 adds one shot NORTH1 did not have, and it is the one this change is judged by:
//   • `room-*` — a tight crop of the counter and the doors at 1440, where the material
//     actually lives. The warmth of a surface is a thing you cannot see in a 1440×900
//     thumbnail; it is a thing you see when the plaster fills the frame.
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/north2-home");
const LABEL = process.argv[2] ?? "before";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "desktop-full", width: 1440, height: 2000 },
  { name: "lg-narrow", width: 1024, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
  { name: "mobile-full", width: 390, height: 1800 },
] as const;

const QUIET_DAY: Record<string, unknown> = {
  "**/api/planner/full": [],
  "**/api/shopping-list*": [],
  "**/api/home/intelligence": { weeklyProgress: null },
  "**/api/intelligence/companion/notices": { notices: [], gatheredCount: 0 },
};

const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

async function login(ctx: any) {
  const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
  if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
}

async function settle(page: any) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => (document as any).fonts.ready);
  await page.waitForTimeout(2500);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  // The quiet day.
  for (const vp of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 1500 },
  ]) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    await login(ctx);
    const page = await ctx.newPage();
    for (const [glob, body] of Object.entries(QUIET_DAY)) {
      await page.route(glob, (route: any) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }),
      );
    }
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-quiet-day-${vp.name}.png`) });
    await ctx.close();
    console.log(`captured ${LABEL}-quiet-day-${vp.name}`);
  }

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    await login(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-${vp.name}.png`), fullPage: true });
    await page.screenshot({ path: path.join(OUT, `${LABEL}-${vp.name}-viewport.png`), fullPage: false });
    await ctx.close();
    console.log(`captured ${LABEL}-${vp.name}`);
  }

  // THE MATERIAL, CLOSE UP — the shot NORTH1 lacked and the one this change is judged by.
  // A 1440×900 thumbnail cannot show whether a surface is plaster or paper. This can.
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1600 },
      deviceScaleFactor: 2,
    });
    await login(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await settle(page);
    const ground = page.locator('[data-testid="ground-home"]');
    if (await ground.count()) {
      await ground.screenshot({ path: path.join(OUT, `${LABEL}-room-material.png`) });
      console.log(`captured ${LABEL}-room-material`);
    }
    const doors = page.locator('[data-testid="home-doors"]');
    if (await doors.count()) {
      await doors.screenshot({ path: path.join(OUT, `${LABEL}-room-doors.png`) });
      console.log(`captured ${LABEL}-room-doors`);
    }
    await ctx.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
