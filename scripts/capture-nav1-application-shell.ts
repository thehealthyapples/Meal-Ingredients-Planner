// NAV1 — captures of the shared application shell.
//
// Usage: npx tsx scripts/capture-nav1-application-shell.ts
//
// The point of these captures is HEADER PERMANENCE, so the route list is chosen
// to prove exactly that, not to tour the product:
//
//   • /compare and /import-recipe had NO HEADER AT ALL before NAV1. They render
//     no `WorkspaceHeader` of their own and were never changed by NAV1 — if the
//     header is in these shots, it is the shell's, not the page's.
//   • /admin is one of 13 admin pages in the same state.
//   • /home, /cookbook and /pantry are rooms that DO draw their own header, and
//     are here to prove the opposite case: the shell's default stands down, and
//     there is exactly one header on screen rather than two.
//
// Both viewports, because the shell's responsive behaviour is part of the claim:
// the bottom nav is primary navigation at BOTH sizes (UX1), and the contextual
// rail is desktop-only.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/nav1-application-shell");

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const CREDS = {
  username: "price.single.parent.owner@dev.thehealthyapples.dev",
  password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
};

/** `headerOwner` records what the page contributed BEFORE NAV1. */
const ROUTES = [
  { slug: "compare", path: "/compare", headerOwner: "none-before-nav1" },
  { slug: "import-recipe", path: "/import-recipe", headerOwner: "none-before-nav1" },
  { slug: "admin", path: "/admin", headerOwner: "none-before-nav1" },
  { slug: "home", path: "/home", headerOwner: "page" },
  { slug: "cookbook", path: "/cookbook", headerOwner: "page" },
  { slug: "pantry", path: "/pantry", headerOwner: "page" },
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

      // The assertions the screenshots are evidence FOR. Counted, not eyeballed:
      // exactly one header, and the shell's furniture present on every route.
      //
      // VISIBLE, not present. The first run of this harness asserted DOM counts
      // and reported `companion: 2` on every route, which read as a duplicate
      // Companion button and is not one: `WorkspaceHeader` renders a desktop arm
      // and a mobile arm and hides one with CSS, so the basket and the profile
      // menu have always been in the DOM twice too. The harness was wrong, not
      // the header — recorded here because a passing assertion for the wrong
      // reason is worse than a failing one.
      const visible = (sel: string) => page.locator(`${sel}:visible`).count();
      const headers = await visible('[data-testid="workspace-header"]');
      const nav = await visible('[data-testid="mobile-bottom-nav"]');
      const companion = await visible('[data-testid="button-workspace-companion"]');
      const rail = await page.locator('[data-testid="room-actions-rail"]').count();
      const activePips = await visible('[data-testid^="mobile-nav-"][aria-current="page"]');
      // Where the router actually LANDED. `/import-recipe` reported an active nav
      // pip on the first run, which is impossible for a route that is in neither
      // NAV_ITEMS nor its aliases — so the URL is recorded rather than assumed.
      const landedOn = new URL(page.url()).pathname;

      await page.screenshot({
        path: path.join(OUT, `${route.slug}-${vp.name}.png`),
        fullPage: false,
      });

      results.push({
        route: route.path,
        landedOn,
        viewport: vp.name,
        headerOwnerBeforeNav1: route.headerOwner,
        headers,
        bottomNav: nav,
        companionEntry: companion,
        railMounted: rail,
        activeNavPips: activePips,
        newPageErrors: pageErrors.length - before,
        pass: headers === 1 && nav === 1 && companion === 1,
      });

      console.log(
        `${vp.name.padEnd(8)} ${route.path.padEnd(16)} landed=${landedOn.padEnd(16)} headers=${headers} nav=${nav} companion=${companion} rail=${rail} activePips=${activePips} errors=${pageErrors.length - before}`,
      );
    }

    await ctx.close();
  }

  writeFileSync(path.join(OUT, "shell-results.json"), JSON.stringify(results, null, 2) + "\n");
  await browser.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("FAILED:", JSON.stringify(failed, null, 2));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
