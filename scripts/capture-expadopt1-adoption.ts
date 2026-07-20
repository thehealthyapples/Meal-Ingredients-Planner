// EXPADOPT1 — before/after evidence for the Experience Constitution adoption.
//
// Captures the rooms this workstream changed, at the two widths that matter:
//   • 1440×900  — the laptop the design was drawn at
//   • 1920×1080 — the large display GEA11 governs ("surplus space becomes air
//     and view, never additional interface"). The Cookbook's grid escalation was
//     only ever visible here, which is exactly why it survived so long.
//
// Usage: npx tsx scripts/capture-expadopt1-adoption.ts <before|after>
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/expadopt1-adoption");
const LABEL = process.argv[2] ?? "after";

// The five E2 rooms the governing map (Blueprint § 5.1) assigns a window, plus
// two E1 working rooms that must prove they did NOT gain one, plus Home (E3,
// unchanged — the control).
const ROOMS = [
  { name: "cookbook", path: "/cookbook", exposure: "E2" },
  { name: "pantry", path: "/pantry", exposure: "E2" },
  { name: "nutrition", path: "/nutrition", exposure: "E2" },
  { name: "diary", path: "/my-diary", exposure: "E2" },
  { name: "orchard", path: "/orchard", exposure: "E2" },
  { name: "planner", path: "/planner", exposure: "E1 — must show NO window" },
  { name: "shopping", path: "/shopping-workspace", exposure: "E1 — must show NO window" },
  { name: "home", path: "/home", exposure: "E3 — control, unchanged" },
] as const;

const VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "1920", width: 1920, height: 1080 },
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
      deviceScaleFactor: 1,
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
        await page.goto(`${BASE}${room.path}`, { waitUntil: "networkidle", timeout: 45000 });
        await page.evaluate(() => (document as any).fonts.ready);
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(OUT, `${LABEL}-${vp.tag}-${room.name}.png`),
        });
        // Report what the room actually resolved, so the claim has a measurement
        // beside it rather than only a picture.
        const probe = await page.evaluate(() => {
          const win = document.querySelector('[data-testid="room-orchard-window"]');
          const cs = getComputedStyle(document.documentElement);
          return {
            window: !!win,
            e2: cs.getPropertyValue("--orchard-exposure-e2").trim(),
            realm:
              document.querySelector("[data-realm]")?.getAttribute("data-realm") ?? "(none)",
          };
        });
        console.log(
          `${LABEL} ${vp.tag} ${room.name.padEnd(10)} ${room.exposure.padEnd(24)} ` +
            `window=${probe.window} realm=${probe.realm} --e2=${probe.e2}`,
        );
      } catch (e) {
        console.log(`SKIP ${vp.tag} ${room.name}: ${(e as Error).message.split("\n")[0]}`);
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
