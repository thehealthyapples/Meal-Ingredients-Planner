/**
 * HOME · Emotional Interior Design — render six interior languages over the ONE
 * unchanged Concept B architecture, at desktop + mobile.
 *
 *   LD_LIBRARY_PATH=<curated-chromium-libs> npx tsx scripts/north4-concepts/render-interior.ts
 *
 * The curated-libs recipe is in .engineering/session/runs/HOME_EMOTIONAL_INTERIOR_DESIGN.md § Tooling.
 * Refinement study, not an implementation — nothing here is imported by the app.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const OUT = resolve("docs/ui-audit/home-emotional-interior");
const SRC = "file://" + resolve("scripts/north4-concepts/concept-b-interior.html");

const STUDIES = [
  { n: 1, id: "kept-house" },
  { n: 2, id: "warm-hour" },
  { n: 3, id: "linen-calm" },
  { n: 4, id: "morning-table" },
  { n: 5, id: "gardeners-sill" },
  { n: 6, id: "family-record" },
];
const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "mobile", width: 390, height: 844 },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--no-sandbox", "--font-render-hinting=none"] });
  let fraunces = false;

  for (const s of STUDIES) {
    for (const v of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 2 });
      await page.goto(`${SRC}?study=${s.n}`, { waitUntil: "networkidle" });
      await page.evaluate(() => (document as any).fonts?.ready);
      await page.waitForTimeout(400);
      if (!fraunces) fraunces = await page.evaluate(() => (document as any).fonts.check('300 72px "Fraunces"'));

      // architecture-invariance + collision check: the sill line is sacred; nothing
      // the household reads may cross it onto the glass, or overlap the doors.
      const audit = await page.evaluate(() => {
        const sillEl = document.querySelector(".sill") as HTMLElement | null;
        const doorsEl = document.querySelector(".doors") as HTMLElement | null;
        const glassEl = document.querySelector(".glass") as HTMLElement | null;
        const sillBottom = sillEl ? sillEl.getBoundingClientRect().bottom : 0;
        const doorsTop = doorsEl ? doorsEl.getBoundingClientRect().top : Infinity;
        const problems: string[] = [];
        const selectors = [".name", ".greeting .action", ".note", ".console", ".date"];
        for (const sel of selectors) {
          const els = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
          for (const el of els) {
            const b = el.getBoundingClientRect();
            if (b.height <= 0 || b.width <= 0) continue;
            if (b.top < sillBottom - 1) problems.push(sel + " crosses the sill");
            if (b.bottom > doorsTop + 1) problems.push(sel + " overlaps the doors");
          }
        }
        const g = glassEl ? glassEl.getBoundingClientRect() : null;
        return { problems, pageH: document.body.scrollHeight, glassTop: g ? Math.round(g.top) : -1, glassH: g ? Math.round(g.height) : -1 };
      });

      const base = `${OUT}/${String(s.n)}-${s.id}-${v.id}`;
      await page.screenshot({ path: `${base}.png` });
      if (v.id !== "desktop") await page.screenshot({ path: `${base}-full.png`, fullPage: true });

      const flag = audit.problems.length ? `  ⚠ ${audit.problems.join("; ")}` : "  ✓ clear";
      console.log(`  ${String(s.n)} ${s.id.padEnd(15)} ${v.id.padEnd(7)}  glass@${audit.glassTop}h${audit.glassH}  page=${audit.pageH}px${flag}`);
      await page.close();
    }
  }
  console.log(`\ntype: Fraunces loaded = ${fraunces}${fraunces ? "" : "  (DejaVu Serif fallback)"}`);
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
