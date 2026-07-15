/**
 * ARRIVAL1 — photograph and film the Arrival Experience prototype (`/dev/arrival`).
 *
 *   npx tsx scripts/capture-arrival-experience.ts
 *
 * ZERO-WRITE. It authenticates as an existing, fictional, DEV-only Development
 * World household (the same one `capture-ux-evidence.ts` uses, same documented
 * shared DEV password), reads, and photographs. It creates no account, writes no
 * business data, and performs no mutation of any kind.
 *
 * It captures the prototype at both widths in the arrival modes — because "the
 * orchard emerges", "the header is the standard one", "the workspace fits one
 * viewport" and "reduced motion has no arrival" are all CLAIMS, and a claim with
 * no picture attached is a claim nobody checked:
 *
 *   welcome   — the calm cream field with the handwritten "Welcome home, <name>".
 *   emerging  — the cream lifting: the orchard and the standard header arriving.
 *   sheen     — the one soft sunrise sheen passing across the long THA logo.
 *   workspace — where the gentle glide sets you down: the one-viewport Home.
 *   reduced   — prefers-reduced-motion: the finished workspace, immediately, no arrival.
 *
 * It also RECORDS the complete arrival as video (desktop + mobile), so the whole
 * sequence — cream → hello → orchard → header → glide → workspace — can be watched
 * rather than inferred from stills. The live Home is captured alongside as the
 * control, unchanged by this workstream.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/ui-audit/arrival-experience");
const VIDEO_OUT = resolve(OUT, "video");

// Fictional, DEV-only household. Documented shared DEV password.
const DW_USER = "price.single.parent.owner@dev.thehealthyapples.dev";
const DW_PASS = process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const ROUTE = "/dev/arrival";

async function login(ctx: BrowserContext) {
  const r = await ctx.request.post(`${BASE}/api/login`, {
    data: { username: DW_USER, password: DW_PASS },
  });
  if (!r.ok()) throw new Error(`dev-world login failed: ${r.status()} — is the dev server up?`);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: resolve(OUT, `${name}.png`) });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(VIDEO_OUT, { recursive: true });
  // Some sandboxes (Replit/Nix) ship a prebuilt Chromium rather than the one
  // `playwright install` fetches; honour its executable path when present.
  const executablePath = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
  const browser: Browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]] as const) {
    // ── The full arrival, RECORDED end to end, with stills lifted from the moments.
    {
      const ctx = await browser.newContext({
        viewport,
        recordVideo: { dir: VIDEO_OUT, size: viewport },
      });
      await login(ctx);
      const page = await ctx.newPage();

      await page.goto(`${BASE}${ROUTE}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForSelector('[data-testid="text-arrival-signature"]', { timeout: 30_000 });

      // WELCOME — the greeting fully written and HELD, readable, before it fades
      // (name settles ~1.5s; fade begins 4.5s). Captured in that readable hold.
      await page.waitForTimeout(2300);         // ≈ t 2.3s
      await shot(page, `${label}-01-welcome`);

      // EMERGING — the cream lifting (3.9→5.7s), the greeting slowly receding as
      // the orchard + standard header become dominant.
      await page.waitForTimeout(2700);         // ≈ t 5.0s
      await shot(page, `${label}-02-emerging`);

      // SHEEN — the single sunrise sheen crossing the long THA logo (fires 6.0s,
      // ~1.15s pass); captured mid-sweep.
      await page.waitForTimeout(1500);         // ≈ t 6.5s
      await shot(page, `${label}-03-sheen`);

      // WORKSPACE — after the glide lands (drift starts 6.8s, ~1.7s long).
      await page.waitForTimeout(2400);         // ≈ t 8.9s, settled
      await shot(page, `${label}-04-workspace`);

      await page.waitForTimeout(400);
      const video = page.video();
      await ctx.close();                        // flushes the video file
      if (video) {
        await video.saveAs(resolve(VIDEO_OUT, `${label}-arrival.webm`));
        await video.delete();                   // drop the GUID-named original
      }
      console.log(`  ✓ ${label} arrival recorded → ${VIDEO_OUT}/${label}-arrival.webm`);
    }

    // ── REDUCED MOTION — a different person, not a faster animation. No arrival.
    {
      const ctx = await browser.newContext({ viewport, reducedMotion: "reduce" });
      await login(ctx);
      const page = await ctx.newPage();
      await page.goto(`${BASE}${ROUTE}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForSelector('[data-testid="arrival-workspace"]', { timeout: 30_000 });
      await page.waitForTimeout(300);          // deliberately EARLY — nothing should be pending
      await shot(page, `${label}-05-reduced-motion`);
      await ctx.close();
    }

    // ── THE CONTROL — live Home, unchanged by this workstream.
    {
      const ctx = await browser.newContext({ viewport });
      await login(ctx);
      const page = await ctx.newPage();
      await page.goto(`${BASE}/home`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(500);
      await shot(page, `${label}-06-live-home-unchanged`);
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`\nWrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
