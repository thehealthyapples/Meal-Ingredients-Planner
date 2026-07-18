/**
 * AFI2 — Capture the Planner Ambient Intelligence surface (the new
 * `planner-batch-cook` recommendation — "cook one batch and it covers the week")
 * against a live dev server + seeded demo household. Read-only w.r.t. the product;
 * writes only PNGs into docs/implementation/assets/afi2/.
 *
 * The ambient surface is collapsed-by-default (calm before capability), so each
 * shot expands it via its own toggle testid before capturing.
 *
 *   AFI2_BASE_URL=http://localhost:5055 npx tsx scripts/afi2-capture-ambient-screenshots.ts
 *
 * Captured by session AFI2_Planner_Ambient_Intelligence.
 */
import { chromium, type Browser, type BrowserContext } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.AFI2_BASE_URL ?? "http://localhost:5055";
const OUT = resolve(import.meta.dirname, "..", "docs/implementation/assets/afi2");
const EXECUTABLE = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const VIEWPORT = { width: 430, height: 932 };

async function shoot(
  ctx: BrowserContext,
  s: { id: string; route: string; toggle?: string; wait?: string; name: string },
  results: any[],
) {
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}${s.route}`, { waitUntil: "networkidle", timeout: 40_000 });
    if (s.wait) await page.waitForSelector(s.wait, { timeout: 15_000 }).catch(() => {});
    if (s.toggle) {
      const toggle = await page.waitForSelector(`[data-testid="${s.toggle}"]`, { timeout: 15_000 }).catch(() => null);
      if (toggle) {
        await toggle.click();
        await page.waitForTimeout(600); // expansion animation
      }
    }
    await page.waitForTimeout(1200);
    const file = `${s.id}.png`;
    await page.screenshot({ path: resolve(OUT, file), fullPage: true });
    results.push({ ...s, file, status: resp?.status() ?? null, toggled: !!s.toggle, ok: true });
    console.log(`  ✓ ${s.id.padEnd(28)} ${s.route}`);
  } catch (e: any) {
    results.push({ ...s, file: null, ok: false, error: e.message });
    console.log(`  ✗ ${s.id.padEnd(28)} ${s.route}  — ${e.message.split("\n")[0]}`);
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
    const demo = await ctx.request.post(`${BASE}/api/demo/start`);
    if (!demo.ok()) throw new Error(`/api/demo/start returned ${demo.status()}`);
    console.log(`  demo household opened (${demo.status()})`);

    // Confirm the new opportunity is live before shooting, and log it.
    const bundle = await ctx.request.get(`${BASE}/api/intelligence/food-opportunities`);
    if (bundle.ok()) {
      const body: any = await bundle.json();
      const batch = (body.opportunities ?? []).find((o: any) => o.type === "planner-batch-cook");
      console.log(`  batch-cook: ${batch ? batch.explanation : "none"}`);
    }

    const shots = [
      {
        id: "planner-ambient-batchcook",
        name: "Planner — ambient (gaps + uplift + the new cook-once)",
        route: "/planner",
        toggle: "ambient-intelligence-planner-toggle",
        wait: '[data-testid="ambient-intelligence-planner"]',
      },
      {
        id: "home-ambient-aggregate",
        name: "Home — aggregate ambient (the new cook-once among the week's opportunities)",
        route: "/home",
        toggle: "ambient-intelligence-home-toggle",
        wait: '[data-testid="ambient-intelligence-home"]',
      },
    ];
    for (const s of shots) await shoot(ctx, s, results);

    // A focused, element-level shot of the new card itself (it is `low` priority, so it
    // sits below the medium empty-day gaps in the full-page shot). Locate it by its own
    // text, scroll it into view, and screenshot just that card.
    {
      const page = await ctx.newPage();
      try {
        await page.goto(`${BASE}/planner`, { waitUntil: "networkidle", timeout: 40_000 });
        const toggle = await page.waitForSelector('[data-testid="ambient-intelligence-planner-toggle"]', { timeout: 15_000 }).catch(() => null);
        if (toggle) { await toggle.click(); await page.waitForTimeout(600); }
        const card = page.locator('[data-testid="food-opportunity-card"]', { hasText: "cook one batch" }).first();
        await card.scrollIntoViewIfNeeded({ timeout: 15_000 });
        await page.waitForTimeout(500);
        await card.screenshot({ path: resolve(OUT, "planner-batchcook-card.png") });
        results.push({ id: "planner-batchcook-card", name: "Planner — the cook-once card, focused", route: "/planner", file: "planner-batchcook-card.png", ok: true });
        console.log(`  ✓ planner-batchcook-card        (element)`);
      } catch (e: any) {
        results.push({ id: "planner-batchcook-card", ok: false, error: e.message });
        console.log(`  ✗ planner-batchcook-card — ${e.message.split("\n")[0]}`);
      } finally {
        await page.close();
      }
    }

    await ctx.close();
  } finally {
    await browser?.close();
  }

  const captured = results.filter((r) => r.ok).length;
  writeFileSync(
    resolve(OUT, "manifest.json"),
    JSON.stringify(
      { captured_by: "AFI2_Planner_Ambient_Intelligence", base_url: BASE, viewport: VIEWPORT, captured, failed: results.length - captured, shots: results },
      null,
      2,
    ) + "\n",
  );
  console.log(`\n  ${captured}/${results.length} surfaces captured → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
