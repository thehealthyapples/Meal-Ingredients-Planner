// UX2 — before/after captures of the Experience Language completion.
//
// Usage:
//   npx tsx scripts/capture-ux2-experience-language.ts before
//   npx tsx scripts/capture-ux2-experience-language.ts after
//
// This is a VISUAL change, so the captures are the evidence — the same argument
// UX_NAV1 made, and this script is deliberately its sibling rather than a new
// invention.
//
// WHAT THE ROUTE LIST IS FOR. It is chosen to exercise the four things UX2
// changed, not to tour the product:
//
//   • the PERMANENT HEADER, which used to be a different colour in every room —
//     so the list crosses the widest realm-hue spread the house contains
//     (planner 172 · cookbook 38 · pantry 115 · diary 348 · orchard 20). If the
//     header reads as one material across those, it reads as one everywhere.
//   • HOME, where the arch and the oak console were retired for Concept B.
//   • the BRAND MARK, in every header, at both sizes.
//   • the PLATFORM GREEN, hue 132 → 74, which lands on every primary button,
//     focus ring and intelligence tint in the product.
//
// Both viewports, because BottomNav is primary navigation at BOTH sizes (UX1)
// and because the header's mobile arm is a separate layout branch.
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
const OUT = path.resolve("docs/ui-audit/ux2-experience-language", PHASE);

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
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
  { slug: "diary", path: "/my-diary" },
  { slug: "orchard", path: "/orchard" },
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
      deviceScaleFactor: 2,
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
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${PHASE} captures → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
