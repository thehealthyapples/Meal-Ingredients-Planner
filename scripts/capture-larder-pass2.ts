// LARDER Pass 2 — capture the composed Living Larder room (/larder) for the
// implementation report. Desktop (light + dark) and mobile. Full-page.
// Usage: npx tsx scripts/capture-larder-pass2.ts
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/screenshots");

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  async function shoot(label: string, opts: {
    width: number; height: number; scale: number; dark: boolean;
  }) {
    const ctx = await browser.newContext({
      viewport: { width: opts.width, height: opts.height },
      deviceScaleFactor: opts.scale,
      colorScheme: opts.dark ? "dark" : "light",
    });
    const login = await ctx.request.post(`${BASE}/api/login`, {
      data: {
        username: "price.single.parent.owner@dev.thehealthyapples.dev",
        password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
      },
    });
    if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
    const page = await ctx.newPage();
    // Hide dev/preview chrome for a clean room shot.
    await page.addStyleTag({ content: `
      [data-testid="preview-banner"], .replit-dev-banner, #replit-dev-banner { display:none !important; }
    ` }).catch(() => {});
    await page.goto(`${BASE}/larder`, { waitUntil: "networkidle" });
    await page.evaluate(() => (document as any).fonts?.ready);
    await page.waitForSelector('[data-testid="larder-room"]', { timeout: 15000 });
    if (opts.dark) {
      // The house toggles a `.dark` class on <html>; force it for the night shot.
      await page.evaluate(() => document.documentElement.classList.add("dark"));
    }
    await page.waitForTimeout(700);
    // A viewport shot of the top of the room (threshold + first wing), as framed.
    await page.screenshot({ path: path.join(OUT, `${label}_top.png`) });
    // The room scrolls inside the shell's fixed-height <main>, so the document
    // stays viewport-sized and fullPage cannot reach the lower wings. Unclip the
    // room's scroll ancestors (capture-time only; the app is untouched) so the
    // page flows to its true height and fullPage captures every wing.
    await page.evaluate(() => {
      let el: HTMLElement | null = document.querySelector('[data-testid="larder-room"]');
      while (el && el !== document.body) {
        const s = getComputedStyle(el);
        if (s.overflowY !== "visible" || s.height.endsWith("px")) {
          el.style.setProperty("height", "auto", "important");
          el.style.setProperty("max-height", "none", "important");
          el.style.setProperty("overflow", "visible", "important");
        }
        el = el.parentElement;
      }
      // Lift the fixed bottom nav out of the flow so it doesn't overlap a wing.
      document.querySelectorAll<HTMLElement>('[class*="fixed"]').forEach((n) => {
        if (getComputedStyle(n).position === "fixed") n.style.setProperty("position", "static", "important");
      });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: true });
    console.log(`captured ${label}`);
    await ctx.close();
  }

  await shoot("LARDER_PASS2_desktop_light", { width: 1440, height: 900, scale: 2, dark: false });
  await shoot("LARDER_PASS2_desktop_dark",  { width: 1440, height: 900, scale: 2, dark: true });
  await shoot("LARDER_PASS2_mobile_light",  { width: 390, height: 844, scale: 3, dark: false });

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
