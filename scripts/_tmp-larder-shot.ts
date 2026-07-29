import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = process.env.OUT ?? "/tmp/claude-1000/-home-runner-workspace/b6f4bae3-6d63-41a6-b8ae-7d570e0f6cee/scratchpad/shots";

interface Shot { label: string; url: string; width: number; height: number; dark?: boolean; full?: boolean }

const ALL: Shot[] = [
  { label: "desktop", url: "/pantry", width: 1440, height: 1000, full: true },
  { label: "desktop-open", url: "/pantry?shelf=grains", width: 1440, height: 1000, full: true },
  { label: "mobile", url: "/pantry", width: 390, height: 844, full: true },
  { label: "tablet", url: "/pantry", width: 820, height: 1100, full: true },
  { label: "desktop-dark", url: "/pantry", width: 1440, height: 1000, dark: true, full: true },
];
const only = process.env.ONLY?.split(",");
const SHOTS = only ? ALL.filter(s => only.includes(s.label)) : ALL;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  for (const shot of SHOTS) {
    const ctx = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 1,
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
    const errs: string[] = [];
    page.on("pageerror", e => errs.push(String(e)));
    page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    await page.goto(`${BASE}${shot.url}`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="larder-room"]', { timeout: 20000 });
    if (shot.dark) await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.addStyleTag({ content: `nav[class*="fixed"], [data-testid="bottom-nav"], .lardr-dock { visibility: hidden !important; }` }).catch(()=>{});
    await page.waitForTimeout(900);
    const overflow = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    console.log(`${shot.label}: overflow ${overflow}px${errs.length ? ` | errors: ${errs.slice(0, 3).join(" || ")}` : ""}`);
    await page.screenshot({ path: path.join(OUT, `${shot.label}-viewport.png`) });
    if (shot.full) {
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
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, `${shot.label}-full.png`), fullPage: true });
    }
    await ctx.close();
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
