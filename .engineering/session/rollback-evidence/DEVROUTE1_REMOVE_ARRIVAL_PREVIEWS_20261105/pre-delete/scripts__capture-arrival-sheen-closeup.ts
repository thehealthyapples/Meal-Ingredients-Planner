/**
 * ARRIVAL1 refine — verify + photograph the sunrise sheen up close.
 *
 *   npx tsx scripts/capture-arrival-sheen-closeup.ts
 *
 * The sheen crosses the long THA logo, which on Home is ~24px tall in the top-left
 * of the canonical header — too small to read in a full-page still. This waits for
 * the sheen element to mount, confirms it is masked to the logo and pinned to the
 * logo's box, then captures a crisp (2× DPR) clip of the logo region across the
 * sweep so the "morning light catching the mark" is actually visible. Zero-write.
 */
import { chromium, type Browser } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/ui-audit/arrival-experience");
const DW_USER = "price.single.parent.owner@dev.thehealthyapples.dev";
const DW_PASS = process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only";
const ROUTE = "/dev/arrival";

async function main() {
  mkdirSync(OUT, { recursive: true });
  const executablePath = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
  const browser: Browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const [label, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
    const r = await ctx.request.post(`${BASE}/api/login`, { data: { username: DW_USER, password: DW_PASS } });
    if (!r.ok()) throw new Error(`login failed: ${r.status()}`);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${ROUTE}`, { waitUntil: "domcontentloaded", timeout: 30_000 });

    // Wait for the sheen to actually mount, then confirm the mechanism.
    await page.waitForSelector('[data-testid="arrival-logo-sheen"]', { timeout: 30_000 });
    const info = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="arrival-logo-sheen"]') as HTMLElement | null;
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const header = document.querySelector('[data-testid="workspace-header"]');
      const logo = header
        ? Array.from(header.querySelectorAll('img[src="/logo-long.png"]')).map((n) => (n as HTMLElement).getBoundingClientRect()).find((b) => b.width > 0)
        : null;
      return {
        maskImage: cs.maskImage || cs.webkitMask || "(none)",
        sheen: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
        logo: logo ? { x: Math.round(logo.left), y: Math.round(logo.top), w: Math.round(logo.width), h: Math.round(logo.height) } : null,
      };
    });
    console.log(`[${label}]`, JSON.stringify(info));
    if (!info?.logo) throw new Error(`[${label}] no visible logo found under the canonical header`);
    if (!/logo-long\.png/.test(info.maskImage)) throw new Error(`[${label}] sheen is not masked to the logo`);
    const aligned =
      Math.abs(info.sheen.x - info.logo.x) <= 2 &&
      Math.abs(info.sheen.y - info.logo.y) <= 2 &&
      Math.abs(info.sheen.w - info.logo.w) <= 2 &&
      Math.abs(info.sheen.h - info.logo.h) <= 2;
    console.log(`[${label}] sheen aligned to logo box: ${aligned ? "YES" : "NO"}`);

    // A generous clip around the logo, captured just after mount (band mid-sweep).
    const clip = {
      x: Math.max(0, info.logo.x - 8),
      y: Math.max(0, info.logo.y - 8),
      width: Math.min(viewport.width, info.logo.w + 240),
      height: info.logo.h + 16,
    };
    await page.screenshot({ path: resolve(OUT, `${label}-03b-logo-sheen-closeup.png`), clip });
    console.log(`  ✓ ${label}-03b-logo-sheen-closeup.png`);
    await ctx.close();
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
