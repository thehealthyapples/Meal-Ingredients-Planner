/**
 * UX_REFINE1 (resumed) — verify D4, D6, D7 in the running product.
 *
 *   npx tsx scripts/ux-refine1-verify-shell.ts
 *
 * ZERO-WRITE. Authenticates as an existing fictional Development World household
 * and only reads. It writes nothing to the database; its only file output is
 * screenshots under docs/ui-audit/experience-verify1/.
 *
 * It MEASURES rather than photographs:
 *   D4 — the shell logo must be the same rendered height on a page with a
 *        contextBar (Pantry) and one without (Home).
 *   D6 — the pantry scroller's clip edge must coincide with its card edge, so a
 *        part-visible row reads as "more below" rather than as a broken row.
 *   D7 — no planner intelligence pill may end mid-word, and every shortened pill
 *        must expose its full text via title.
 * Console errors and React key warnings are collected on every room.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/ui-audit/experience-verify1");

// Fictional, DEV-only household; documented shared DEV password.
const DW_USER = "price.single.parent.owner@dev.thehealthyapples.dev";
const DW_PASS = process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only";

const DESKTOP = { width: 1440, height: 900 };

type RoomLog = { room: string; errors: string[]; keyWarnings: number };

const results: Record<string, unknown> = {};
const roomLogs: RoomLog[] = [];

async function openRoom(ctx: BrowserContext, room: string, route: string): Promise<Page> {
  const page = await ctx.newPage();
  const log: RoomLog = { room, errors: [], keyWarnings: 0 };
  page.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return;
    const t = m.text();
    if (t.includes("unique \"key\" prop") || t.includes("unique key prop")) log.keyWarnings++;
    else if (m.type() === "error") log.errors.push(t.slice(0, 200));
  });
  page.on("pageerror", (e) => log.errors.push(`pageerror: ${String(e).slice(0, 200)}`));
  await page.setViewportSize(DESKTOP);
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(2500);
  roomLogs.push(log);
  return page;
}

/** The rendered height of the shell logo inside the sticky workspace header. */
async function logoHeight(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const header = document.querySelector('[data-testid="workspace-header"]');
    if (!header) return null;
    const imgs = Array.from(header.querySelectorAll('img[src="/logo-long.png"]'));
    // Only the arm that is actually laid out (the mobile arm is display:none here).
    const visible = imgs.filter((i) => (i as HTMLElement).offsetParent !== null);
    if (visible.length === 0) return null;
    return Math.round(visible[0].getBoundingClientRect().height);
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser: Browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 2 });
  const r = await ctx.request.post(`${BASE}/api/login`, {
    data: { username: DW_USER, password: DW_PASS },
  });
  if (!r.ok()) throw new Error(`dev-world login failed: ${r.status()}`);

  // ── D4: the shell logo must not vary with the contextBar branch ──────────
  const home = await openRoom(ctx, "home", "/home");
  const homeLogo = await logoHeight(home);
  await home.screenshot({ path: `${OUT}/ux-refine1b-home.png`, fullPage: false });
  await home.close();

  const pantry = await openRoom(ctx, "pantry", "/pantry");
  const pantryLogo = await logoHeight(pantry);

  // ── D6: the scroller clip edge must coincide with the card edge ──────────
  const d6 = await pantry.evaluate(() => {
    const scrollers = Array.from(document.querySelectorAll("div.max-h-72.overflow-y-auto"));
    return scrollers.map((s) => {
      const el = s as HTMLElement;
      const card = el.closest("div.rounded-lg.border") as HTMLElement | null;
      if (!card) return null;
      const gap = Math.round(card.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom);
      return {
        overflowing: el.scrollHeight > el.clientHeight + 1,
        // Dead card background between the clip edge and the card edge, in px.
        deadSpaceBelowClip: gap,
        padBottom: getComputedStyle(el).paddingBottom,
      };
    }).filter(Boolean);
  });
  await pantry.screenshot({ path: `${OUT}/ux-refine1b-pantry.png`, fullPage: false });
  await pantry.close();

  // ── D7: no pill may end mid-word; shortened pills must carry title ───────
  const planner = await openRoom(ctx, "planner", "/planner");
  const d7 = await planner.evaluate(() => {
    const pills = Array.from(document.querySelectorAll("span.text-xs.whitespace-nowrap"))
      .map((e) => e as HTMLElement)
      .filter((e) => (e.textContent ?? "").trim().length > 0);
    return pills.map((e) => {
      const text = (e.textContent ?? "").trim();
      const shortened = text.endsWith("…");
      // A mid-word cut = the ellipsis directly follows a letter that was part of
      // a longer word, i.e. the full text continues that word rather than a space.
      const full = e.getAttribute("title");
      let midWord = false;
      if (shortened && full) {
        const stem = text.slice(0, -1);
        midWord = full.startsWith(stem) && !!full[stem.length] && /\S/.test(full[stem.length]);
      }
      return { text, shortened, hasTitle: !!full, midWord };
    });
  });
  await planner.screenshot({ path: `${OUT}/ux-refine1b-planner.png`, fullPage: false });
  await planner.close();

  const shopping = await openRoom(ctx, "shopping", "/shopping-workspace");
  await shopping.screenshot({ path: `${OUT}/ux-refine1b-shopping.png`, fullPage: false });
  await shopping.close();

  const nutrition = await openRoom(ctx, "nutrition", "/plant-diversity");
  await nutrition.screenshot({ path: `${OUT}/ux-refine1b-nutrition.png`, fullPage: false });
  await nutrition.close();

  results.D4 = { homeLogoPx: homeLogo, pantryLogoPx: pantryLogo, equal: homeLogo === pantryLogo };
  results.D6 = d6;
  results.D7 = d7;
  results.console = roomLogs;

  console.log(JSON.stringify(results, null, 2));
  writeFileSync(`${OUT}/ux-refine1b-results.json`, JSON.stringify(results, null, 2));

  // ── Summary ──────────────────────────────────────────────────────────────
  const pills = d7 as { shortened: boolean; hasTitle: boolean; midWord: boolean }[];
  const totalErrors = roomLogs.reduce((n, l) => n + l.errors.length, 0);
  const totalKeys = roomLogs.reduce((n, l) => n + l.keyWarnings, 0);
  console.log("\n──────── SUMMARY ────────");
  console.log(`D4 logo Home ${homeLogo}px vs Pantry ${pantryLogo}px — ${homeLogo === pantryLogo ? "EQUAL ✓" : "DIFFERENT ✗"}`);
  console.log(`D6 scrollers: ${JSON.stringify(d6)}`);
  console.log(`D7 pills: ${pills.length}, mid-word cuts: ${pills.filter((p) => p.midWord).length}, shortened without title: ${pills.filter((p) => p.shortened && !p.hasTitle).length}`);
  console.log(`Console errors: ${totalErrors} · key warnings: ${totalKeys}`);

  await ctx.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
