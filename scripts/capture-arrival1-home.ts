// ARRIVAL1 — captures of the definitive Home (/home): the archway, the plaster wall,
// the oak console, the stone floor. Reuses the NORTH3 dev-world harness.
//
// Usage: npx tsx scripts/capture-arrival1-home.ts
//
// Three states, because the room must survive all of them:
//   • real     — the dev household exactly as it renders (no mocks)
//   • populated — an anchored week: meals, shopping, plants, the Companion, a real action
//   • quiet     — the unanchored default (192/195 households): intentional, complete, calm
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/arrival1-home");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const POPULATED: Record<string, unknown> = {
  "**/api/planner/current-week": { anchored: true, weekNumber: 1, todayDayOfWeek: 5 },
  "**/api/planner/full": [
    { weekNumber: 1, days: [{ dayOfWeek: 5, entries: [
      { id: 1, mealId: "m1", mealType: "breakfast" },
      { id: 2, mealId: "m2", mealType: "lunch" },
      { id: 3, mealId: "m3", mealType: "dinner" },
    ] }] },
  ],
  "**/api/meals/summary": [
    { id: "m1", name: "Green Protein Smoothie", imageUrl: null },
    { id: "m2", name: "Spring Lentil Salad", imageUrl: null },
    { id: "m3", name: "Herb-Roasted Chicken", imageUrl: null },
  ],
  "**/api/shopping-list*": [
    { id: 1, name: "Milk", checked: false },
    { id: 2, name: "Mixed Nuts", checked: false },
    { id: 3, name: "Olive Oil", checked: false },
    { id: 4, name: "Spinach", checked: false },
    { id: 5, name: "Oats", checked: false },
  ],
  "**/api/home/intelligence": { weeklyProgress: { plantCount: 28, mealsPlanned: 12, daysWithMeals: 6 } },
  "**/api/intelligence/companion/notices": { notices: [
    { id: "n1", text: "Spring greens are at their best — perfect for gentle meals that nourish and restore. Shall we plan something for the weekend?" },
  ], gatheredCount: 1 },
  "**/api/intelligence/food-opportunities": { resolved: true, opportunities: [], grouped: {} },
};

const QUIET: Record<string, unknown> = {
  "**/api/planner/current-week": { anchored: false },
  "**/api/planner/full": [],
  "**/api/shopping-list*": [],
  "**/api/home/intelligence": { weeklyProgress: null },
  "**/api/intelligence/companion/notices": { notices: [], gatheredCount: 0 },
  "**/api/intelligence/food-opportunities": { resolved: false, opportunities: [], grouped: {} },
};

const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

async function login(ctx: any) {
  const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
  if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
}
async function mock(page: any, table: Record<string, unknown>) {
  for (const [glob, body] of Object.entries(table)) {
    await page.route(glob, (route: any) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
  }
}
async function settle(page: any) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => (document as any).fonts.ready);
  await page.waitForTimeout(2200);
}

async function shoot(browser: any, state: string, table: Record<string, unknown> | null) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
    await login(ctx);
    const page = await ctx.newPage();
    if (table) await mock(page, table);
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await settle(page);
    await page.screenshot({ path: path.join(OUT, `${state}-${vp.name}.png`), fullPage: false });
    await page.screenshot({ path: path.join(OUT, `${state}-${vp.name}-full.png`), fullPage: true });
    await ctx.close();
    console.log(`captured ${state}-${vp.name}`);
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  await shoot(browser, "populated", POPULATED);
  await shoot(browser, "quiet", QUIET);
  await shoot(browser, "real", null);

  // Close-ups of the material — the arch and the oak console.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1400 }, deviceScaleFactor: 2 });
    await login(ctx);
    const page = await ctx.newPage();
    await mock(page, POPULATED);
    await page.goto(`${BASE}/home`, { waitUntil: "networkidle" });
    await settle(page);
    for (const [id, name] of [
      ["home-orchard-arch", "arch"],
      ["ground-home", "console"],
      ["home-room", "room-full"],
    ] as const) {
      const el = page.locator(`[data-testid="${id}"]`);
      if (await el.count()) { await el.screenshot({ path: path.join(OUT, `closeup-${name}.png`) }); console.log(`captured closeup-${name}`); }
    }
    await ctx.close();
  }

  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
