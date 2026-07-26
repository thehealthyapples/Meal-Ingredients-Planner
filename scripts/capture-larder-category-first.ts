// LARDER_CATEGORY_FIRST — capture the category-first Living Larder for the
// implementation report: the shelf wall and one open shelf, on desktop and on a
// phone, light and dark.
// Usage: npx tsx scripts/capture-larder-category-first.ts
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/implementation/evidence/2026-07-24-larder-category-first");

interface Shot {
  label: string;
  url: string;
  width: number;
  height: number;
  dark?: boolean;
  full?: boolean;
}

const SHOTS: Shot[] = [
  { label: "desktop-wall", url: "/pantry", width: 1440, height: 1000, full: true },
  { label: "desktop-shelf-grains", url: "/pantry?shelf=grains", width: 1440, height: 1000, full: true },
  { label: "desktop-shelf-herbs-spices", url: "/pantry?shelf=herbs-spices", width: 1440, height: 1000, full: true },
  { label: "desktop-wall-dark", url: "/pantry", width: 1440, height: 1000, dark: true, full: true },
  { label: "tablet-wall", url: "/pantry", width: 820, height: 1100, full: true },
  { label: "mobile-wall", url: "/pantry", width: 390, height: 844, full: true },
  { label: "mobile-shelf-grains", url: "/pantry?shelf=grains", width: 390, height: 844, full: true },
  { label: "mobile-shelf-fridge", url: "/pantry?shelf=fridge", width: 390, height: 844, full: true },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const shot of SHOTS) {
    const ctx = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 2,
      colorScheme: shot.dark ? "dark" : "light",
    });
    const login = await ctx.request.post(`${BASE}/api/login`, {
      data: {
        username: "price.single.parent.owner@dev.thehealthyapples.dev",
        password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
      },
    });
    if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
    const page = await ctx.newPage();
    await page.addStyleTag({ content: `
      [data-testid="preview-banner"], .replit-dev-banner, #replit-dev-banner { display:none !important; }
    ` }).catch(() => {});
    await page.goto(`${BASE}${shot.url}`, { waitUntil: "networkidle" });
    await page.evaluate(() => (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready);
    await page.waitForSelector('[data-testid="larder-room"]', { timeout: 20000 });
    if (shot.dark) await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(800);

    // Measure horizontal overflow before anything is unclipped for the capture.
    const overflow = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    console.log(`${shot.label}: horizontal overflow ${overflow}px`);

    await page.screenshot({ path: path.join(OUT, `${shot.label}-viewport.png`) });

    if (shot.full) {
      // The room scrolls inside the shell's fixed-height <main>; unclip its scroll
      // ancestors (capture-time only) so a full-page shot reaches every shelf.
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
        document.querySelectorAll<HTMLElement>("*").forEach((n) => {
          if (getComputedStyle(n).position === "fixed") n.style.setProperty("position", "static", "important");
        });
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, `${shot.label}.png`), fullPage: true });
    }
    console.log(`captured ${shot.label}`);
    await ctx.close();
  }

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
