/**
 * HOUSE5 · THE KITCHEN — render the recipe book by the window at desktop · tablet ·
 * mobile, in two views: the shelf (arrival) and a recipe, opened. Sanity check on
 * every render: the orchard window is one committed region and the shelf/page never
 * crosses onto the glass (E2 — the content never covers the view).
 *
 *   LD_LIBRARY_PATH=<curated-chromium-libs> npx tsx scripts/north4-concepts/render-kitchen.ts
 *
 * Design/exploration only — nothing here is imported by the app.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const OUT = resolve("docs/ui-audit/house5-kitchen");
const SRC = "file://" + resolve("scripts/north4-concepts/kitchen-experience.html");

const VIEWS = ["shelf", "recipe"] as const;
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
      if (!fraunces) fraunces = await page.evaluate(() => (document as any).fonts.check('300 46px "Fraunces"'));

      // E2 sanity: the window is one committed region; no reading content overlaps it.
      const audit = await page.evaluate(() => {
        const winEl = document.querySelector(".window") as HTMLElement | null;
        const w = winEl ? winEl.getBoundingClientRect() : null;
        const p: string[] = [];
        if (w) {
          const readers = [".card .name", ".page-title", ".ing li", ".method li", ".title"];
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
        const cards = document.querySelectorAll(".shelf .card").length;
        return { problems: p, pageH: document.body.scrollHeight, win: w ? Math.round(w.width) + "x" + Math.round(w.height) : "none", cards };
      });

      const base = `${OUT}/kitchen-${view}-${v.id}`;
      await page.screenshot({ path: `${base}.png` });
      if (v.id !== "desktop") await page.screenshot({ path: `${base}-full.png`, fullPage: true });

      problems += audit.problems.length;
      const flag = audit.problems.length ? `  ⚠ ${audit.problems.join("; ")}` : "  ✓ clear";
      console.log(`  ${view.padEnd(6)} ${v.id.padEnd(7)}  window=${audit.win}  cards=${audit.cards}  page=${audit.pageH}px${flag}`);
      await page.close();
    }
  }
  console.log(`\ntype: Fraunces loaded = ${fraunces}${fraunces ? "" : "  (DejaVu Serif fallback)"}`);
  console.log(`E2 sanity: ${problems === 0 ? "ALL CLEAR (6/6) — content never covers the window" : problems + " overlap(s) — see ⚠"}`);
  await browser.close();
  if (problems) process.exit(2);
}
main().catch((e) => { console.error(e); process.exit(1); });
