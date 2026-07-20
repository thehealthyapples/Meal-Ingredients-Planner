// INTARCH2 — before/after evidence for the material surface adoption.
//
// The continuation of INTARCH1. That workstream gave every room a GROUND; this
// one gives the things STANDING on the ground their material. Same eleven rooms,
// same two widths, so the two evidence sets are directly comparable:
//   • 1440×900  — the laptop the design was drawn at
//   • 1920×1080 — the large display GEA11 governs.
//
// INTARCH1's probe counted `[data-room-ground]` and could therefore say nothing
// at all about the surface tier — which is precisely this workstream's subject.
// The probe below measures the SURFACES: how many card surfaces exist in the
// room, and how many of them are actually made of `--surface-primary` rather
// than of the scaffold's own translucent fill. Before this change those two
// numbers disagree in every room, which is the defect stated as a number rather
// than as an opinion — the same instrument INTARCH1 used, pointed one tier up.
//
// Usage: npx tsx scripts/capture-intarch2-material-surfaces.ts <before|after>
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/intarch2-material-surfaces");
const LABEL = process.argv[2] ?? "after";

// The same eleven rooms INTARCH1 walked, in the same order, so a reader can put
// the two evidence sets side by side without re-deriving the mapping.
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

        // The measurement that names this workstream's finding.
        //
        // `cards` is how many card surfaces the room contains. `plaster` is how
        // many of them are ACTUALLY MADE of --surface-primary, decided by
        // comparing each card's computed background against the token resolved
        // in the same document — not by looking for a class name, because a
        // class name proves only that a string was written. A resolved computed
        // colour is the browser's own answer to "what is this made of".
        //
        // `grooves` counts the support tier the same way: elements standing in
        // the counter rather than on it.
        const probe = await page.evaluate(() => {
          const cs = getComputedStyle(document.documentElement);

          // Resolve the token to the same rgb() form getComputedStyle returns,
          // by letting the browser do the conversion rather than parsing hsl().
          const probeEl = document.createElement("div");
          probeEl.style.backgroundColor = "var(--surface-primary)";
          probeEl.style.position = "absolute";
          probeEl.style.pointerEvents = "none";
          document.body.appendChild(probeEl);
          const resolvedPrimary = getComputedStyle(probeEl).backgroundColor;
          probeEl.remove();

          const cards = Array.from(document.querySelectorAll(".shadcn-card"));
          const plaster = cards.filter(
            (c) => getComputedStyle(c).backgroundColor === resolvedPrimary,
          ).length;

          return {
            primaryDefined: cs.getPropertyValue("--surface-primary").trim() || "(unset)",
            resolvedPrimary,
            cards: cards.length,
            plaster,
            grooves: document.querySelectorAll(".surface-support").length,
            groundConsumers: document.querySelectorAll("[data-room-ground]").length,
            realm:
              document.querySelector("[data-realm]")?.getAttribute("data-realm") ?? "(none)",
          };
        });
        console.log(
          `${LABEL} ${vp.tag} ${room.name.padEnd(10)} ` +
            `cards=${String(probe.cards).padEnd(3)} ` +
            `plaster=${String(probe.plaster).padEnd(3)} ` +
            `grooves=${String(probe.grooves).padEnd(2)} ` +
            `ground=${String(probe.groundConsumers).padEnd(2)} ` +
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
