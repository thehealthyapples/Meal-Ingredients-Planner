import { chromium } from "playwright";
import { mkdirSync } from "fs";
const OUT = "/tmp/claude-1000/-home-runner-workspace/04d2a2c7-41e9-485b-8a56-a24bfec3b5f6/scratchpad/shots";
const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const SHOTS = [
  { label: "desktop", w: 1440, h: 900 },
  { label: "tablet", w: 820, h: 1100 },
  { label: "mobile", w: 390, h: 844 },
];
(async () => {
  mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  for (const s of SHOTS) {
    const ctx = await b.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
    const login = await ctx.request.post(`${BASE}/api/login`, {
      data: { username: "price.single.parent.owner@dev.thehealthyapples.dev",
              password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only" },
    });
    if (!login.ok()) throw new Error(`login failed ${login.status()}`);
    const p = await ctx.newPage();
    await p.goto(`${BASE}/pantry`, { waitUntil: "networkidle" });
    await p.waitForSelector('[data-testid="larder-room"]', { timeout: 20000 }).catch(() => {});
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `${OUT}/${s.label}.png` });
    await ctx.close();
  }
  await b.close();
  console.log("done");
})();
