// NORTH3 — before/after captures of the authenticated Home (/home), the entrance hall.
// Usage: npx tsx scripts/capture-north3-home.ts <label>   (label = "before" | "after")
//
// The NORTH2 harness, repointed at docs/ui-audit/north3-home/. Every viewport below was
// paid for by a defect that shipped past every gate and was only ever findable by looking
// — the notes are NORTH1 §6 and NORTH2 §7, kept because the traps are still live:
//
//   • 1024 (`lg`) — the narrowest room where the orchard stands BESIDE the greeting, so
//     the window's clearance over the household's name is tightest here and nowhere else.
//   • 820 (tablet) — NORTH1 §6.2's tailwind-merge variant trap (`sm:pt-6` beating an
//     unprefixed `pt-[…]`) was invisible at 390 and at 1440, and only 820 showed it.
//   • 1440×900 viewport (NOT fullPage) — NORTH2 §7 found `lg:mt-24` pushed the one door
//     behind the bottom nav here. A fullPage shot cannot see a door below the fold; only
//     the real viewport can. This is the shot the one-door rule is checked in.
//   • The quiet day — the state a rendered kitchen can never fail at and software can.
//
// NORTH3 adds the threshold crop: the greeting and the air around it at 1440, where the
// arrival either reads as a welcome or as a caption on a dashboard.
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/north3-home");
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

  // THE MATERIAL AND THE THRESHOLD, CLOSE UP.
  {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1600 },
      deviceScaleFactor: 2,
    });
    await login(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await settle(page);
    for (const [id, name] of [
      ["ground-home", "room-material"],
      ["home-doors", "room-doors"],
      ["home-room", "room-full"],
    ] as const) {
      const el = page.locator(`[data-testid="${id}"]`);
      if (await el.count()) {
        await el.screenshot({ path: path.join(OUT, `${LABEL}-${name}.png`) });
        console.log(`captured ${LABEL}-${name}`);
      }
    }
    await ctx.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
