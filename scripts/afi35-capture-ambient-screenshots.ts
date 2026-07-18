/**
 * AFI3–AFI5 — Capture the completed Ambient Food Intelligence surface against a live
 * dev server + seeded demo household. Read-only w.r.t. the product; writes only PNGs
 * into docs/implementation/assets/afi35/.
 *
 * Covers the six generators added to the ONE existing opportunity engine:
 *   AFI3 (SHOP1)   shopping-item-already-in-pantry / -higher-rated-product-available /
 *                  -less-processed-option
 *   AFI3 (PANTRY1) pantry-need-not-on-shopping-list
 *   AFI4 (CBK2)    cookbook-recipe-cookable-now / cookbook-recipe-household-conflict
 *   AFI5           the `cookbook` domain registered end-to-end — Companion notice + card
 *
 * The ambient surface is collapsed-by-default (calm before capability), so each shot
 * expands it via its own toggle testid before capturing.
 *
 *   AFI35_BASE_URL=http://localhost:5055 npx tsx scripts/afi35-capture-ambient-screenshots.ts
 *
 * Captured by session AFI3_5_Ambient_Food_Intelligence_Completion.
 */
import { chromium, type Browser, type BrowserContext } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.AFI35_BASE_URL ?? "http://localhost:5055";
const OUT = resolve(import.meta.dirname, "..", "docs/implementation/assets/afi35");
const EXECUTABLE = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
const VIEWPORT = { width: 430, height: 932 };

/** The six types AFI3–AFI5 added, in report order. */
const AFI35_TYPES = [
  "shopping-item-already-in-pantry",
  "shopping-higher-rated-product-available",
  "shopping-less-processed-option",
  "pantry-need-not-on-shopping-list",
  "cookbook-recipe-cookable-now",
  "cookbook-recipe-household-conflict",
];

async function shoot(
  ctx: BrowserContext,
  s: { id: string; route: string; toggle?: string; wait?: string; name: string },
  results: any[],
) {
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(`${BASE}${s.route}`, { waitUntil: "networkidle", timeout: 40_000 });
    // Record what ACTUALLY happened, not what was configured — a surface that never
    // appeared and a toggle that was never clicked must not be reported as captured.
    const surfaceFound = s.wait
      ? await page.waitForSelector(s.wait, { timeout: 15_000 }).then(() => true).catch(() => false)
      : null;
    // The surface persists its own expanded state in sessionStorage and is collapsed by
    // default (calm before capability). Seeding that key in `addInitScript` (see main())
    // expands it deterministically; clicking the toggle instead races the opportunity
    // fetch, which is why an earlier run screenshotted a still-collapsed panel.
    let toggled = false;
    if (s.toggle) {
      const btn = await page.waitForSelector(`[data-testid="${s.toggle}"]`, { timeout: 15_000 }).catch(() => null);
      if (btn) {
        if ((await btn.getAttribute("aria-expanded")) !== "true") {
          await btn.click();
          await page.waitForTimeout(600); // expansion animation
        }
        toggled = (await btn.getAttribute("aria-expanded")) === "true";
      }
    }
    await page.waitForTimeout(1200);
    const file = `${s.id}.png`;
    await page.screenshot({ path: resolve(OUT, file), fullPage: true });
    results.push({ ...s, file, status: resp?.status() ?? null, surfaceFound, toggled, ok: true });
    console.log(`  ✓ ${s.id.padEnd(30)} ${s.route}`);
  } catch (e: any) {
    results.push({ ...s, file: null, ok: false, error: e.message });
    console.log(`  ✗ ${s.id.padEnd(30)} ${s.route}  — ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

/** A focused, element-level shot of one card, located by its own rendered text. */
async function shootCard(
  ctx: BrowserContext,
  s: { id: string; route: string; toggle: string; hasText: string; name: string },
  results: any[],
) {
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}${s.route}`, { waitUntil: "networkidle", timeout: 40_000 });
    const toggle = await page.waitForSelector(`[data-testid="${s.toggle}"]`, { timeout: 15_000 }).catch(() => null);
    if (toggle && (await toggle.getAttribute("aria-expanded")) !== "true") {
      await toggle.click();
      await page.waitForTimeout(600);
    }
    const card = page.locator('[data-testid="food-opportunity-card"]', { hasText: s.hasText }).first();
    // Wait for the card to EXIST before scrolling to it — `scrollIntoViewIfNeeded` on a
    // not-yet-rendered locator reports a bare timeout that reads like a missing surface.
    await card.waitFor({ state: "visible", timeout: 20_000 });
    await card.scrollIntoViewIfNeeded({ timeout: 15_000 });
    await page.waitForTimeout(500);
    await card.screenshot({ path: resolve(OUT, `${s.id}.png`) });
    results.push({ ...s, file: `${s.id}.png`, ok: true });
    console.log(`  ✓ ${s.id.padEnd(30)} (element)`);
  } catch (e: any) {
    results.push({ ...s, file: null, ok: false, error: e.message });
    console.log(`  ✗ ${s.id.padEnd(30)} — ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  let browser: Browser | undefined;
  const results: any[] = [];
  let live: Record<string, string> = {};

  try {
    browser = await chromium.launch({
      executablePath: EXECUTABLE,
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });
    const ctx = await browser.newContext({ viewport: VIEWPORT });

    // Expand every ambient surface before first paint — the component reads these keys in
    // its `useState` initialiser (AmbientIntelligence.tsx:80).
    await ctx.addInitScript(() => {
      for (const k of ["home", "planner", "pantry", "shopping", "cookbook"]) {
        window.sessionStorage.setItem(`tha.ambient.${k}`, "1");
      }
    });

    // `/api/demo/start` is rate-limited (429) — deliberately, it creates a real household.
    // AFI35_SESSION_COOKIE reuses an ALREADY-OPEN demo session instead of forcing a new
    // one, so a re-capture never depends on the limiter's window.
    const reuse = process.env.AFI35_SESSION_COOKIE;
    if (reuse) {
      const [name, ...rest] = reuse.split("=");
      const url = new URL(BASE);
      await ctx.addCookies([
        { name, value: rest.join("="), domain: url.hostname, path: "/", httpOnly: true, secure: false, sameSite: "Lax" },
      ]);
      console.log(`  reusing existing demo session via ${name}`);
    } else {
      const demo = await ctx.request.post(`${BASE}/api/demo/start`);
      if (!demo.ok()) throw new Error(`/api/demo/start returned ${demo.status()}`);
      console.log(`  demo household opened (${demo.status()})`);
    }

    // `/api/demo/start` returns as soon as the user row exists; its pantry, shopping and
    // cookbook seeding lands slightly AFTER. Polling before shooting is what separates
    // "the household has no such observation" from "the household was not seeded yet" —
    // the first capture run raced this and recorded an empty `live_observations`, which
    // read as an honest gap but was in fact a timing artifact.
    let all: any[] = [];
    for (let attempt = 1; attempt <= 12; attempt++) {
      const bundle = await ctx.request.get(`${BASE}/api/intelligence/food-opportunities`);
      if (bundle.ok()) {
        const body: any = await bundle.json();
        all = body.opportunities ?? [];
        if (all.some((o: any) => AFI35_TYPES.includes(o.type))) {
          console.log(`  household seeded (attempt ${attempt}, ${all.length} opportunities)`);
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 2500));
    }

    // Log each of the six verbatim — the screenshots are evidence, this is the record of
    // what they show.
    console.log(`\n  --- live bundle: ${all.length} opportunities ---`);
    for (const t of AFI35_TYPES) {
      const hit = all.find((o: any) => o.type === t);
      if (hit) live[t] = hit.explanation;
      console.log(`  ${hit ? "●" : "○"} ${t.padEnd(42)} ${hit ? hit.explanation : "(not present for this household)"}`);
    }

    // The Companion's own voice — proves the `cookbook` domain is registered and not
    // silently dropped one step before the household could read it (AFI5).
    const notices = await ctx.request.get(`${BASE}/api/intelligence/companion/notices`);
    if (notices.ok()) {
      const body: any = await notices.json();
      console.log(`\n  --- companion notices (cap ${body?.trust?.cap}) ---`);
      for (const n of body.notices ?? []) console.log(`  • [${n.category}] ${n.text}`);
    }
    console.log("");

    const shots = [
      {
        id: "cookbook-ambient",
        name: "Cookbook — the new ambient surface (AFI4/AFI5, the `cookbook` domain's first)",
        route: "/meals",
        toggle: "ambient-cookbook-toggle",
        wait: '[data-testid="ambient-cookbook"]',
      },
      {
        id: "shopping-ambient",
        name: "Shopping — ambient (AFI3: already-in-pantry, rating comparison, less-processed)",
        route: "/shopping-workspace",
        toggle: "ambient-intelligence-shopping-toggle",
        wait: '[data-testid="ambient-intelligence-shopping"]',
      },
      {
        id: "pantry-ambient",
        name: "Pantry — ambient (AFI3/PANTRY1: a recorded need missing from the list)",
        route: "/pantry",
        toggle: "ambient-intelligence-pantry-toggle",
        wait: '[data-testid="ambient-intelligence-pantry"]',
      },
      {
        id: "home-ambient-aggregate",
        name: "Home — aggregate ambient (all domains, incl. the new Cookbook, in one calm surface)",
        route: "/home",
        toggle: "ambient-intelligence-home-toggle",
        wait: '[data-testid="ambient-intelligence-home"]',
      },
      {
        id: "home-companion-notices",
        name: "Home — the Companion card (AFI5: the new observations reach the household's own voice)",
        route: "/home",
        wait: '[data-testid="card-home-companion"]',
      },
    ];
    for (const s of shots) await shoot(ctx, s, results);

    // Focused card shots, one per surface that produced a live AFI3–5 observation.
    const cards: { id: string; route: string; toggle: string; hasText: string; name: string }[] = [];
    if (live["cookbook-recipe-cookable-now"]) {
      cards.push({
        id: "cookbook-cookable-now-card",
        name: "Cookbook — \"you have everything for this\" (AFI4/CBK2), focused",
        route: "/meals",
        toggle: "ambient-cookbook-toggle",
        hasText: "You have everything for",
      });
    }
    if (live["cookbook-recipe-household-conflict"]) {
      cards.push({
        id: "cookbook-household-conflict-card",
        name: "Cookbook — a recipe colliding with a household restriction (AFI4/CBK2), focused",
        route: "/meals",
        toggle: "ambient-cookbook-toggle",
        hasText: "conflicts with a stored household restriction",
      });
    }
    if (live["shopping-item-already-in-pantry"]) {
      cards.push({
        id: "shopping-already-in-pantry-card",
        name: "Shopping — \"already in your pantry\" (AFI3/SHOP1), focused",
        route: "/shopping-workspace",
        toggle: "ambient-intelligence-shopping-toggle",
        hasText: "is already in your pantry",
      });
    }
    if (live["shopping-less-processed-option"]) {
      cards.push({
        id: "shopping-less-processed-card",
        name: "Shopping — WS9's less-processed option, cited verbatim (AFI3/SHOP1), focused",
        route: "/shopping-workspace",
        toggle: "ambient-intelligence-shopping-toggle",
        hasText: "less processed option",
      });
    }
    if (live["pantry-need-not-on-shopping-list"]) {
      cards.push({
        id: "pantry-need-card",
        name: "Pantry — a recorded need missing from the list (AFI3/PANTRY1), focused",
        route: "/pantry",
        toggle: "ambient-intelligence-pantry-toggle",
        hasText: "isn't on your shopping list",
      });
    }
    for (const c of cards) await shootCard(ctx, c, results);

    await ctx.close();
  } finally {
    await browser?.close();
  }

  const captured = results.filter((r) => r.ok).length;
  writeFileSync(
    resolve(OUT, "manifest.json"),
    JSON.stringify(
      {
        captured_by: "AFI3_5_Ambient_Food_Intelligence_Completion",
        base_url: BASE,
        viewport: VIEWPORT,
        captured,
        failed: results.length - captured,
        live_observations: live,
        shots: results,
      },
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
