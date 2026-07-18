/**
 * AFI1 — Capture the Ambient Food Intelligence surfaces (the new
 * `planner-meal-uplift` recommendation) against a live dev server + seeded demo
 * household. Read-only w.r.t. the product; writes only PNGs into
 * docs/implementation/assets/afi1/.
 *
 * The ambient surface is collapsed-by-default (calm before capability), so each
 * shot expands it via its own toggle testid before capturing.
 *
 *   npx tsx scripts/afi1-capture-ambient-screenshots.ts
 *
 * Captured by session AFI1_Ambient_Food_Intelligence.
 */
import { chromium, type Browser, type BrowserContext } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.AFI1_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/implementation/assets/afi1");
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
    // Expand the collapsed ambient surface so the card content is visible.
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

    // Discover the planned meal that carries the uplift, so the meal-card shot is
    // on the real, relevant meal. The opportunity's subject.id is the planner
    // ENTRY id (what the opportunity is keyed on), not the meal id — so resolve the
    // meal id by matching the uplift's meal-name label against the cookbook.
    let mealId: number | null = null;
    let upliftLabel: string | null = null;
    const bundle = await ctx.request.get(`${BASE}/api/intelligence/food-opportunities`);
    if (bundle.ok()) {
      const body: any = await bundle.json();
      const uplift = (body.opportunities ?? []).find((o: any) => o.type === "planner-meal-uplift");
      upliftLabel = uplift?.subject?.label ?? null;
      console.log(`  uplift meal: ${upliftLabel ?? "none"}`);
    }
    if (upliftLabel) {
      const meals = await ctx.request.get(`${BASE}/api/meals`);
      if (meals.ok()) {
        const body: any = await meals.json();
        const list = Array.isArray(body) ? body : body.meals ?? body.items ?? [];
        const hit = list.find((m: any) => m?.name === upliftLabel) ?? list.find((m: any) => String(m?.name ?? "").includes(upliftLabel!));
        mealId = hit?.id ?? null;
        console.log(`  resolved meal id: ${mealId ?? "none"}`);
      }
    }

    const shots = [
      {
        id: "planner-ambient-uplift",
        name: "Planner — ambient (gaps + the new small lift)",
        route: "/planner",
        toggle: "ambient-intelligence-planner-toggle",
        wait: '[data-testid="ambient-intelligence-planner"]',
      },
      {
        id: "home-ambient-aggregate",
        name: "Home — aggregate ambient",
        route: "/home",
        toggle: "ambient-intelligence-home-toggle",
        wait: '[data-testid="ambient-intelligence-home"]',
      },
    ];
    for (const s of shots) await shoot(ctx, s, results);

    // The meal card that now carries the scoped "A small lift for this week" surface.
    if (mealId != null) {
      await shoot(
        ctx,
        {
          id: "meal-card-ambient-uplift",
          name: "Meal card — scoped ambient uplift",
          route: `/meals/${mealId}`,
          toggle: "ambient-meal-uplift-toggle",
          wait: '[data-testid="ambient-meal-uplift"]',
        },
        results,
      );
    } else {
      results.push({ id: "meal-card-ambient-uplift", ok: false, error: "no uplift subject id resolved" });
      console.log("  ✗ meal-card-ambient-uplift — no uplift subject id resolved");
    }

    await ctx.close();
  } finally {
    await browser?.close();
  }

  const captured = results.filter((r) => r.ok).length;
  writeFileSync(
    resolve(OUT, "manifest.json"),
    JSON.stringify(
      { captured_by: "AFI1_Ambient_Food_Intelligence", base_url: BASE, viewport: VIEWPORT, captured, failed: results.length - captured, shots: results },
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
