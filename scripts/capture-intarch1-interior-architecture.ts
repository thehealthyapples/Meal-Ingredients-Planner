// INTARCH1 — before/after evidence for the Interior Architecture completion.
//
// Walks every room in the house and photographs it, at the two widths that
// matter:
//   • 1440×900  — the laptop the design was drawn at
//   • 1920×1080 — the large display GEA11 governs ("surplus space becomes air
//     and view, never additional interface").
//
// Unlike EXPADOPT1's harness, which probed for ONE element (the orchard
// window), this one probes the MATERIAL layer: whether the room stands on a
// ground plane, and what the ground/primary/support triad actually resolves to
// at the moment of the picture. The whole finding of this workstream is that
// those tokens were valued and consumed by nothing, so the probe has to be able
// to say "defined = yes, consumed = no" — a distinction a screenshot cannot
// make on its own and a grep cannot make at runtime.
//
// Usage: npx tsx scripts/capture-intarch1-interior-architecture.ts <before|after>
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/intarch1-interior-architecture");
const LABEL = process.argv[2] ?? "after";

// Every room in the house. The nine canonical rooms of NAV_ITEMS, plus the two
// surfaces that are rooms in every sense except the nav shelf: the family record
// (Profile) and the study off the hall (Admin). Admin is included precisely
// because it is E0 — it must prove it is still unmistakably in the house
// (OHDB § 13.9) without gaining a view it is not entitled to.
const ROOMS = [
  { name: "home", path: "/home", note: "E3 — draws its own window" },
  { name: "planner", path: "/planner", note: "E1 — the family table" },
  { name: "cookbook", path: "/cookbook", note: "E2 — the book by the window" },
  { name: "shopping", path: "/shopping-workspace", note: "E1 — the list by the door" },
  { name: "pantry", path: "/pantry", note: "E2 — the pantry" },
  { name: "nutrition", path: "/nutrition", note: "E2" },
  { name: "diary", path: "/my-diary", note: "E2 — the window seat" },
  { name: "analyser", path: "/analyser", note: "E1" },
  { name: "orchard", path: "/orchard", note: "E2" },
  { name: "profile", path: "/profile", note: "E1 — the family record" },
  { name: "admin", path: "/admin", note: "E0 — the study off the hall" },
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

        // The measurement that names this workstream's finding. `defined` reads
        // the token off :root; `consumed` counts elements that actually stand on
        // it. Before this change the two disagree in every room, which is the
        // defect stated as a number rather than as an opinion.
        const probe = await page.evaluate(() => {
          const cs = getComputedStyle(document.documentElement);
          const ground = document.querySelectorAll("[data-room-ground]");
          return {
            groundDefined: cs.getPropertyValue("--ground-plane").trim() || "(unset)",
            groundConsumers: ground.length,
            realm:
              document.querySelector("[data-realm]")?.getAttribute("data-realm") ?? "(none)",
            window: !!document.querySelector('[data-testid="room-orchard-window"]'),
          };
        });
        console.log(
          `${LABEL} ${vp.tag} ${room.name.padEnd(10)} ` +
            `ground=${String(probe.groundConsumers).padEnd(2)} ` +
            `window=${String(probe.window).padEnd(5)} ` +
            `realm=${probe.realm.padEnd(10)} ${room.note}`,
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
