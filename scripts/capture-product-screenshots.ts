/**
 * Capture the Product Knowledge Registry screenshot baseline (PKR §24, Rule PKR10).
 *
 *   LD_LIBRARY_PATH=<chromium-libs> npx tsx scripts/capture-product-screenshots.ts
 *
 * One canonical screenshot per household-reachable surface, plus the public
 * surfaces, captured against a live dev server (default http://localhost:5000).
 *
 * Household surfaces are gated behind a session, so the script opens a demo
 * household via POST /api/demo/start (a real, seeded, 20-minute demo account —
 * no credentials, no fixture data invented) and reuses that cookie. Public
 * surfaces are captured unauthenticated. Admin/developer surfaces are NOT
 * captured here: doing so would require minting an admin session, and the
 * baseline's job is the household experience. Their absence is recorded in the
 * manifest rather than papered over.
 *
 * Read-only with respect to the product. Writes only into
 * docs/product/assets/screenshots/. The images live with the app per PKR §18
 * ("Images live with the app"); this directory is their canonical home in-repo.
 *
 * Captured by investigation PDA1.
 */
import { chromium, type Browser, type BrowserContext } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.PDA1_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/product/assets/screenshots");
const VIEWPORT = { width: 390, height: 844 }; // iPhone-class; THA is mobile-first (UI Architecture).

// One entry per canonical surface. `id` matches the screenshot's registry link;
// `route` is from the Pages/Routes section of product.yaml; `auth` says which
// session captures it. `wait` is an optional selector to settle on before shot.
type Shot = { id: string; name: string; route: string; auth: "public" | "household"; full?: boolean };
const SHOTS: Shot[] = [
  { id: "landing", name: "Landing", route: "/", auth: "public", full: true },
  { id: "auth", name: "Sign in", route: "/auth", auth: "public" },
  { id: "home", name: "Home", route: "/home", auth: "household", full: true },
  { id: "dashboard", name: "Dashboard", route: "/dashboard", auth: "household", full: true },
  { id: "planner", name: "Planner", route: "/planner", auth: "household", full: true },
  { id: "cookbook", name: "Cookbook", route: "/cookbook", auth: "household", full: true },
  { id: "analyser", name: "Analyser", route: "/analyser", auth: "household" },
  { id: "shopping-workspace", name: "Shopping", route: "/shopping-workspace", auth: "household", full: true },
  { id: "pantry", name: "Pantry", route: "/pantry", auth: "household", full: true },
  { id: "nutrition", name: "Nutrition (Plant Diversity)", route: "/plant-diversity", auth: "household", full: true },
  { id: "diary", name: "My Diary", route: "/my-diary", auth: "household", full: true },
  { id: "profile", name: "Profile", route: "/profile", auth: "household", full: true },
  { id: "partners", name: "Partners", route: "/partners", auth: "household", full: true },
  { id: "supermarkets", name: "Supermarkets (hidden)", route: "/supermarkets", auth: "household", full: true },
  { id: "quick-meal", name: "Build a Meal (hidden)", route: "/quick-meal", auth: "household" },
  { id: "onboarding", name: "Onboarding", route: "/onboarding", auth: "household", full: true },
  { id: "not-found", name: "Not Found", route: "/this-route-does-not-exist", auth: "public" },
];


async function shoot(ctx: BrowserContext, s: Shot, results: any[]) {
  const page = await ctx.newPage();
  const file = `${s.id}.png`;
  try {
    const resp = await page.goto(`${BASE}${s.route}`, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(1500); // let client render + animations settle
    await page.screenshot({ path: resolve(OUT, file), fullPage: !!s.full });
    results.push({ id: s.id, name: s.name, route: s.route, auth: s.auth, file, status: resp?.status() ?? null, ok: true });
    console.log(`  ✓ ${s.id.padEnd(20)} ${s.route}`);
  } catch (e: any) {
    results.push({ id: s.id, name: s.name, route: s.route, auth: s.auth, file: null, ok: false, error: e.message });
    console.log(`  ✗ ${s.id.padEnd(20)} ${s.route}  — ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let browser: Browser | undefined;
  const results: any[] = [];
  try {
    browser = await chromium.launch({ args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] });

    const publicCtx = await browser.newContext({ viewport: VIEWPORT });
    const householdCtx = await browser.newContext({ viewport: VIEWPORT });
    // Open a demo household THROUGH the household context, so the session cookie
    // lands in that context's own cookie jar natively — no cross-fetch copy.
    const demo = await householdCtx.request.post(`${BASE}/api/demo/start`);
    if (!demo.ok()) throw new Error(`/api/demo/start returned ${demo.status()}`);
    console.log(`  demo household opened (${demo.status()})`);

    for (const s of SHOTS) {
      await shoot(s.auth === "household" ? householdCtx : publicCtx, s, results);
    }
    await publicCtx.close();
    await householdCtx.close();
  } finally {
    await browser?.close();
  }

  const captured = results.filter((r) => r.ok).length;
  const manifest = {
    captured_by: "PDA1",
    base_url: BASE,
    viewport: VIEWPORT,
    surface_count: SHOTS.length,
    captured: captured,
    failed: SHOTS.length - captured,
    note: "Admin and developer surfaces are intentionally excluded — see README.md.",
    shots: results,
  };
  writeFileSync(resolve(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n  ${captured}/${SHOTS.length} surfaces captured → ${OUT}`);
  if (captured < SHOTS.length) process.exitCode = 0; // partial baseline is still a baseline; failures are recorded, not fatal.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
