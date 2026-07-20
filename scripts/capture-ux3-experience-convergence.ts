// UX3 — before/after captures of the Experience Convergence Programme.
//
// Usage:
//   npx tsx scripts/capture-ux3-experience-convergence.ts before
//   npx tsx scripts/capture-ux3-experience-convergence.ts after
//
// Deliberately a sibling of capture-ux2-experience-language.ts rather than a new
// invention — same login, same settle, same zero-write guarantee.
//
// WHAT THIS ROUTE × VIEWPORT MATRIX IS FOR. It exercises the five things UX3
// changed, and nothing else:
//
//   • THE HEADER — the 1px rule beneath it is retired for a warm shadow, and the
//     ruled divider beside the brand mark is gone. Visible in every capture.
//   • THE COACHING CONVERGENCE — the eight ambient surfaces, the coaching
//     eyebrows, the first-visit tips and the duplicate reminder cards are gone
//     from the rooms and the Companion owns them. Home, planner, pantry,
//     cookbook, shopping and nutrition are where they used to be.
//   • THE COMPANION — `aware` is live for the first time, so the emblem is
//     photographed in a state that has never existed in the product before.
//   • THE ORCHARD LAW — dialogs no longer mount the orchard (E0), and Shopping's
//     writing surface no longer hides a landscape under an 80% white sheet (E1).
//   • THE SCALING — the reason this script carries FOUR desktop widths where UX2
//     carried one. The claim under test is that 1280 → 2560 differs in how much
//     AIR surrounds the work, never in how far the work is stretched. One width
//     cannot show that; the spread is the evidence.
//
// Mobile stays in the matrix because BottomNav is primary navigation at both
// sizes (UX1) and the header's mobile arm is a separate layout branch.
//
// ZERO-WRITE. Authenticates as an existing fictional Development World household
// and only reads; its sole file output is PNGs under docs/ui-audit/.
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const PHASE = (process.argv[2] ?? "after").toLowerCase();
if (!["before", "after"].includes(PHASE)) {
  console.error(`phase must be "before" or "after", got "${PHASE}"`);
  process.exit(1);
}
const OUT = path.resolve("docs/ui-audit/ux3-experience-convergence", PHASE);

// Four desktop widths, chosen as real monitors rather than as breakpoints:
// a 13-inch laptop, a 24-inch, a 32-inch, and the ultrawide class. 1920 is the
// one that crosses into the new `spacious` density; 2560 is the one that used to
// stretch the column to 1920px and now does not.
const VIEWPORTS = [
  { name: "1280", width: 1280, height: 860 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
  { name: "2560", width: 2560, height: 1080 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

const ROUTES = [
  { slug: "home", path: "/home" },
  { slug: "planner", path: "/planner" },
  { slug: "cookbook", path: "/cookbook" },
  { slug: "pantry", path: "/pantry" },
  { slug: "shopping", path: "/shopping-workspace" },
  { slug: "nutrition", path: "/nutrition" },
  { slug: "diary", path: "/my-diary" },
] as const;

async function login(ctx: any) {
  const r = await ctx.request.post(`${BASE}/api/login`, { data: CREDS });
  if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
}

async function settle(page: any) {
  await page.waitForLoadState("networkidle").catch(() => {});
  // The Companion's arrival is deliberately withheld on /home (UXHOME1), and the
  // emblem's breath is a 4.2s cycle. Waiting past both means the capture shows the
  // settled room rather than a frame of it still arriving.
  await page.waitForTimeout(2200);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.width >= 1920 ? 1 : 2,
      // Motion is stilled for the capture, not for the product: a breathing light
      // photographs as a random frame otherwise, and the still state is the one
      // reduced-motion households actually get (COMP1 § 8).
      reducedMotion: "reduce",
    });
    await login(ctx);

    for (const route of ROUTES) {
      const page = await ctx.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
      try {
        await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await settle(page);
        await page.screenshot({ path: path.join(OUT, `${route.slug}-${vp.name}.png`) });
        console.log(`  ✓ ${PHASE}/${route.slug}-${vp.name}${errors.length ? `  (${errors.length} page error(s))` : ""}`);
        for (const e of errors) console.log(`      ! ${e}`);
      } catch (e) {
        console.log(`  ✗ ${PHASE}/${route.slug}-${vp.name} — ${String(e).slice(0, 160)}`);
      }
      await page.close();
    }

    // The Companion, opened — the other half of `aware`. Captured once per
    // viewport on Home, because the panel is where the notices it holds are read.
    const cp = await ctx.newPage();
    try {
      await cp.goto(`${BASE}/home`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await settle(cp);
      await cp.click('[data-testid="button-open-assistant"]', { timeout: 10_000 });
      await cp.waitForTimeout(900);
      await cp.screenshot({ path: path.join(OUT, `companion-open-${vp.name}.png`) });
      console.log(`  ✓ ${PHASE}/companion-open-${vp.name}`);
    } catch (e) {
      console.log(`  ✗ ${PHASE}/companion-open-${vp.name} — ${String(e).slice(0, 160)}`);
    }
    await cp.close();

    await ctx.close();
  }

  await browser.close();
  console.log(`\n${PHASE} captures → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
