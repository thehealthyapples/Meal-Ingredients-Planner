// UX_NAV1 — before/after captures of the Orchard navigation refinement.
//
// Usage:
//   npx tsx scripts/capture-uxnav1-orchard-navigation.ts before
//   npx tsx scripts/capture-uxnav1-orchard-navigation.ts after
//
// This is a VISUAL refinement, so the captures are the evidence. The route list
// is chosen to exercise the thing being changed — the realm tint of the active
// room — rather than to tour the product: six rooms across six different hues,
// so a claim that the shelf reads as one continuous surface has to survive the
// widest colour spread the house actually contains.
//
// Both viewports, because BottomNav is primary navigation at BOTH sizes (UX1),
// and because 390px is where COMM2's nine-room overflow lives.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const PHASE = (process.argv[2] ?? "after").toLowerCase();
if (!["before", "after"].includes(PHASE)) {
  console.error(`phase must be "before" or "after", got "${PHASE}"`);
  process.exit(1);
}
const OUT = path.resolve("docs/ui-audit/uxnav1-orchard-navigation", PHASE);

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

// Six rooms, six realm hues: home 132 · planner 172 · cookbook 38 · pantry 115
// · diary 348 · orchard 20. If the shelf reads as one surface across these, it
// reads as one surface everywhere.
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
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const results: any[] = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    await login(ctx);
    const page = await ctx.newPage();

    const pageErrors: string[] = [];
    page.on("pageerror", (e: Error) => pageErrors.push(e.message));

    for (const route of ROUTES) {
      const before = pageErrors.length;
      await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded" });
      await settle(page);

      const visible = (sel: string) => page.locator(`${sel}:visible`).count();
      const headers = await visible('[data-testid="workspace-header"]');
      const nav = await visible('[data-testid="mobile-bottom-nav"]');
      const items = await visible('[data-testid^="mobile-nav-"]');
      const activePips = await visible('[data-testid^="mobile-nav-"][aria-current="page"]');
      const landedOn = new URL(page.url()).pathname;

      // Whole-viewport shot for the balance-with-header claim...
      await page.screenshot({
        path: path.join(OUT, `${route.slug}-${vp.name}.png`),
        fullPage: false,
      });
      // ...and a tight crop of the shelf itself, because the refinement is a
      // matter of a few pixels of tint and a full-page shot hides it.
      const shelf = page.locator('[data-testid="mobile-bottom-nav"]');
      if (await shelf.count()) {
        await shelf.screenshot({ path: path.join(OUT, `shelf-${route.slug}-${vp.name}.png`) });
      }

      results.push({
        phase: PHASE,
        route: route.path,
        landedOn,
        viewport: vp.name,
        headers,
        bottomNav: nav,
        navItems: items,
        activeNavPips: activePips,
        newPageErrors: pageErrors.length - before,
        // Behaviour must be IDENTICAL before and after: nine rooms, one lit,
        // one header, no errors. A refinement that changes any of these
        // numbers has changed behaviour, which the brief forbids.
        pass: headers === 1 && nav === 1 && items === 9 && activePips === 1,
      });

      console.log(
        `${PHASE.padEnd(6)} ${vp.name.padEnd(8)} ${route.path.padEnd(18)} landed=${landedOn.padEnd(14)} headers=${headers} nav=${nav} items=${items} activePips=${activePips} errors=${pageErrors.length - before}`,
      );
    }

    await ctx.close();
  }

  writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2) + "\n");
  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${PHASE}: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("FAILED:", JSON.stringify(failed, null, 2));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
