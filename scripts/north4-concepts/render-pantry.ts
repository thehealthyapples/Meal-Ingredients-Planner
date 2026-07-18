/**
 * HOUSE6 · THE PANTRY — render "what's in the house" at desktop · tablet · mobile,
 * in two views: the stocked pantry and the near-bare pantry. Sanity check on every
 * render: the small orchard window is one committed region and NO reading content
 * (item name, tier name, heading) crosses onto the glass (E2 — the smallest window,
 * the content never covers the view). This is the Pantry's "honest, never inventory"
 * defence made mechanical.
 *
 *   LD_LIBRARY_PATH=<curated-chromium-libs> npx tsx scripts/north4-concepts/render-pantry.ts
 *
 * Design/exploration only — nothing here is imported by the app.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const OUT = resolve("docs/ui-audit/house6-pantry");
const SRC = "file://" + resolve("scripts/north4-concepts/pantry-experience.html");

const VIEWS = ["stocked", "bare"] as const;
const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 960 },
  { id: "tablet", width: 834, height: 1112 },
  { id: "mobile", width: 390, height: 844 },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--no-sandbox", "--font-render-hinting=none"] });
  let fraunces = false;
  let problems = 0;

  for (const view of VIEWS) {
    for (const v of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 2 });
      await page.goto(`${SRC}?view=${view}`, { waitUntil: "networkidle" });
      await page.evaluate(() => (document as any).fonts?.ready);
      await page.waitForTimeout(450);
      if (!fraunces) fraunces = await page.evaluate(() => (document as any).fonts.check('300 44px "Fraunces"'));

      // E2 sanity: the window is one committed region; no reading content overlaps it.
      const audit = await page.evaluate(() => {
        const winEl = document.querySelector(".window") as HTMLElement | null;
        const w = winEl ? winEl.getBoundingClientRect() : null;
        const p: string[] = [];
        if (w) {
          const readers = [".item .n", ".tier-name", ".title", ".bare-invite .bi-body"];
          for (const sel of readers) {
            const els = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
            for (const el of els) {
              const b = el.getBoundingClientRect();
              if (b.width <= 0 || b.height <= 0) continue;
              const overlap = b.left < w.right - 2 && b.right > w.left + 2 && b.top < w.bottom - 2 && b.bottom > w.top + 2;
              if (overlap) { p.push(sel + " overlaps the window"); break; }
            }
          }
        }
        const items = document.querySelectorAll(".strata:not([style*='none']) .item").length;
        // freshness must never render as a red alarm — assert no reader used a red hue
        const reds = Array.from(document.querySelectorAll(".fresh")).filter((el) => {
          const c = getComputedStyle(el as HTMLElement).color;
          const m = c.match(/\d+/g);
          if (!m) return false;
          const [r, g, b2] = m.map(Number);
          return r > 150 && r > g + 60 && r > b2 + 60; // dominant-red test
        }).length;
        return { problems: p, pageH: document.body.scrollHeight, win: w ? Math.round(w.width) + "x" + Math.round(w.height) : "none", items, reds };
      });

      const base = `${OUT}/pantry-${view}-${v.id}`;
      await page.screenshot({ path: `${base}.png` });
      if (v.id !== "desktop") await page.screenshot({ path: `${base}-full.png`, fullPage: true });

      problems += audit.problems.length + audit.reds;
      const flags: string[] = [];
      if (audit.problems.length) flags.push(audit.problems.join("; "));
      if (audit.reds) flags.push(`${audit.reds} freshness label(s) read as red alarm`);
      const flag = flags.length ? `  ⚠ ${flags.join("; ")}` : "  ✓ clear";
      console.log(`  ${view.padEnd(7)} ${v.id.padEnd(7)}  window=${audit.win}  items=${audit.items}  page=${audit.pageH}px${flag}`);
      await page.close();
    }
  }
  console.log(`\ntype: Fraunces loaded = ${fraunces}${fraunces ? "" : "  (DejaVu Serif fallback)"}`);
  console.log(`E2 + honesty sanity: ${problems === 0 ? "ALL CLEAR (6/6) — content never covers the window; no freshness label reads as a red alarm" : problems + " problem(s) — see ⚠"}`);
  await browser.close();
  if (problems) process.exit(2);
}
main().catch((e) => { console.error(e); process.exit(1); });
