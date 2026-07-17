// NORTH2 — the OTHER rooms.
//
// NORTH2 warmed `--card`, `--background`, `--popover` and `--sidebar` off pure white,
// platform-wide, on Colin Clapson's authorisation. Those tokens are read by every room
// in the house, not just the one this change was art-directed for — so the obligation
// that comes with a platform-wide change is to LOOK at the platform, not at the room you
// were enjoying. A palette that flatters Home and breaks the Planner is not a warmer
// house; it is a prettier front door on a worse building.
//
// This harness exists to make that check cheap enough that there is no excuse to skip it.
// Usage: npx tsx scripts/capture-north2-rooms.ts <label>
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/north2-home/rooms");
const LABEL = process.argv[2] ?? "after";

const ROOMS = [
  { name: "planner", path: "/planner" },
  { name: "cookbook", path: "/cookbook" },
  { name: "pantry", path: "/pantry" },
  { name: "shopping", path: "/shopping-workspace" },
  { name: "dashboard", path: "/dashboard" },
] as const;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const login = await ctx.request.post(`${BASE}/api/login`, {
    data: {
      username: "price.single.parent.owner@dev.thehealthyapples.dev",
      password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
    },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);

  for (const room of ROOMS) {
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}${room.path}`, { waitUntil: "networkidle" });
      await page.evaluate(() => (document as any).fonts.ready);
      await page.waitForTimeout(2200);
      await page.screenshot({ path: path.join(OUT, `${LABEL}-${room.name}.png`) });
      console.log(`captured ${LABEL}-${room.name}`);
    } catch (e) {
      console.log(`SKIP ${room.name}: ${(e as Error).message.split("\n")[0]}`);
    }
    await page.close();
  }
  await ctx.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
