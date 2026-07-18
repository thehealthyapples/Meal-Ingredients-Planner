/**
 * FI20 — Capture the Food Comparison surface (COMP1 activation) screenshot set.
 *
 *   npx tsx scripts/fi20-capture-comparison-screenshots.ts
 *
 * Drives the newly-wired Food Comparison surface against a live dev server
 * (default http://localhost:5000) using a real, seeded demo household
 * (POST /api/demo/start — the same discipline as scripts/capture-product-
 * screenshots.ts). Read-only with respect to the product; writes only PNGs into
 * docs/implementation/assets/fi20/.
 *
 * Surfaces captured (the FI20 way-in for COMP1):
 *   1. /compare?items=cheddar,brie        — deep-linked comparison (the flagship)
 *   2. /compare                           — the empty entry state (manual entry)
 *   3. /compare?items=broccoli,spinach    — a second grounded comparison
 *   4. /foods/<a food>                     — the Food page carrying the new
 *                                            "Compare with another food" entry
 *
 * Captured by session FI20_Food_Intelligence_Activation.
 */
import { chromium, type Browser, type BrowserContext } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.FI20_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/implementation/assets/fi20");
const EXECUTABLE = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const VIEWPORT = { width: 430, height: 932 }; // mobile-first (THA UI Architecture)

type Shot = {
  id: string;
  name: string;
  route: string;
  wait?: string; // optional selector to settle on before the shot
  full?: boolean;
};

const SHOTS: Shot[] = [
  {
    id: "compare-deeplink-cheddar-brie",
    name: "Compare — deep-linked (cheddar vs brie)",
    route: "/compare?items=cheddar,brie",
    wait: '[data-testid="food-comparison"], [data-testid="compare-error"]',
    full: true,
  },
  {
    id: "compare-empty-entry",
    name: "Compare — empty entry state",
    route: "/compare",
    wait: '[data-testid="compare-title"]',
    full: true,
  },
  {
    id: "compare-broccoli-spinach",
    name: "Compare — broccoli vs spinach",
    route: "/compare?items=broccoli,spinach",
    wait: '[data-testid="food-comparison"], [data-testid="compare-error"]',
    full: true,
  },
];

async function shoot(ctx: BrowserContext, s: Shot, results: any[]) {
  const page = await ctx.newPage();
  const file = `${s.id}.png`;
  try {
    const resp = await page.goto(`${BASE}${s.route}`, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    if (s.wait) {
      await page.waitForSelector(s.wait, { timeout: 15_000 }).catch(() => {});
    }
    await page.waitForTimeout(1500); // let client render + animations settle
    await page.screenshot({ path: resolve(OUT, file), fullPage: !!s.full });
    results.push({ ...s, file, status: resp?.status() ?? null, ok: true });
    console.log(`  ✓ ${s.id.padEnd(34)} ${s.route}`);
  } catch (e: any) {
    results.push({ ...s, file: null, ok: false, error: e.message });
    console.log(`  ✗ ${s.id.padEnd(34)} ${s.route}  — ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let browser: Browser | undefined;
  const results: any[] = [];
  try {
    browser = await chromium.launch({
      executablePath: EXECUTABLE,
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });
    const ctx = await browser.newContext({ viewport: VIEWPORT });

    // Open a seeded demo household so household-suitability ("for us") can apply.
    const demo = await ctx.request.post(`${BASE}/api/demo/start`);
    if (!demo.ok()) throw new Error(`/api/demo/start returned ${demo.status()}`);
    console.log(`  demo household opened (${demo.status()})`);

    for (const s of SHOTS) await shoot(ctx, s, results);

    // The Food page that now carries the "Compare with another food" entry. We
    // pick the first canonical food the demo household can reach rather than
    // hard-coding a slug that may not be seeded.
    try {
      const page = await ctx.newPage();
      // Prefer a known canonical whole food so the Compare entry actually
      // renders (additive/knowledge pages correctly show an empty state and no
      // entry). Fall back to the first slug the knowledge API returns.
      const PREFERRED = ["cheddar", "broccoli", "spinach", "salmon"];
      let slug: string | null = null;
      const foods = await ctx.request.get(`${BASE}/api/food-knowledge`);
      if (foods.ok()) {
        const body: any = await foods.json();
        const list = Array.isArray(body) ? body : body.foods ?? body.items ?? [];
        const slugs = new Set(list.map((f: any) => f?.slug).filter(Boolean));
        slug = PREFERRED.find((s) => slugs.has(s)) ?? list?.[0]?.slug ?? null;
      }
      if (slug) {
        const route = `/foods/${slug}`;
        const resp = await page.goto(`${BASE}${route}`, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        await page.waitForSelector('[data-testid="link-compare"]', { timeout: 15_000 }).catch(() => {});
        await page.waitForTimeout(1500);
        const file = "food-page-compare-entry.png";
        await page.screenshot({ path: resolve(OUT, file), fullPage: true });
        results.push({ id: "food-page-compare-entry", name: `Food page — Compare entry (${slug})`, route, file, status: resp?.status() ?? null, ok: true });
        console.log(`  ✓ ${"food-page-compare-entry".padEnd(34)} ${route}`);
      } else {
        results.push({ id: "food-page-compare-entry", ok: false, error: "no canonical food slug resolved from /api/food-knowledge" });
        console.log(`  ✗ food-page-compare-entry — no food slug resolved`);
      }
      await page.close();
    } catch (e: any) {
      results.push({ id: "food-page-compare-entry", ok: false, error: e.message });
      console.log(`  ✗ food-page-compare-entry — ${e.message.split("\n")[0]}`);
    }

    await ctx.close();
  } finally {
    await browser?.close();
  }

  const captured = results.filter((r) => r.ok).length;
  const manifest = {
    captured_by: "FI20_Food_Intelligence_Activation",
    base_url: BASE,
    viewport: VIEWPORT,
    captured,
    failed: results.length - captured,
    shots: results,
  };
  writeFileSync(resolve(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n  ${captured}/${results.length} surfaces captured → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
