/**
 * NORTH4 · Concept B, Evolved — render the definitive Arrival at every
 * breakpoint, on both honest days (the full day and the quiet default day).
 *
 * Refinement study, not an implementation. Nothing here is imported by the app;
 * the mockup is standalone HTML and references the canonical orchard asset in
 * place (no substitute asset is authored).
 *
 *   LD_LIBRARY_PATH=<curated-chromium-libs> npx tsx scripts/north4-concepts/render-b-evolution.ts
 *
 * The curated-libs recipe (Chromium will not launch without it in this sandbox)
 * is in .engineering/session/runs/NORTH4_CONCEPT_B_EVOLUTION.md § Tooling.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const OUT = resolve("docs/ui-audit/north4-concept-b-evolution");
const SRC = "file://" + resolve("scripts/north4-concepts/concept-b-evolved.html");

const DAYS = ["full", "quiet"] as const;
const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "tablet", width: 834, height: 1112 },
  { id: "mobile", width: 390, height: 844 },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ["--no-sandbox", "--font-render-hinting=none"] });

  let fraunces = false;
  for (const day of DAYS) {
    for (const v of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: v.width, height: v.height },
        deviceScaleFactor: 2,
      });
      await page.goto(`${SRC}?day=${day}`, { waitUntil: "networkidle" });
      await page.evaluate(() => (document as any).fonts?.ready);
      await page.waitForTimeout(400);

      if (!fraunces) fraunces = await page.evaluate(() => (document as any).fonts.check('300 72px "Fraunces"'));

      // Collision check: nothing the household reads may collide with the sill
      // (the boundary), the doors, or the fold. The sill line is sacred — no
      // content may cross ABOVE it onto the glass.
      const audit = await page.evaluate(() => {
        const sillEl = document.querySelector(".sill") as HTMLElement | null;
        const doorsEl = document.querySelector(".doors") as HTMLElement | null;
        const sillBottom = sillEl ? sillEl.getBoundingClientRect().bottom : 0;
        const doorsTop = doorsEl ? doorsEl.getBoundingClientRect().top : Infinity;
        const selectors = [".name", ".greeting .action", ".note", ".console", ".date"];
        const problems: string[] = [];
        for (const s of selectors) {
          const els = Array.from(document.querySelectorAll(s)) as HTMLElement[];
          for (const el of els) {
            const box = el.getBoundingClientRect();
            if (box.height <= 0 || box.width <= 0) continue;   // hidden by the day toggle
            if (box.top < sillBottom - 1) problems.push(s + " crosses the sill (top " + Math.round(box.top) + " < sill " + Math.round(sillBottom) + ")");
            if (box.bottom > doorsTop + 1) problems.push(s + " overlaps the doors");
          }
        }
        return { problems, pageH: document.body.scrollHeight };
      });

      const base = `${OUT}/b-evolved-${day}-${v.id}`;
      await page.screenshot({ path: `${base}.png` });
      if (v.id !== "desktop") await page.screenshot({ path: `${base}-full.png`, fullPage: true });

      const flag = audit.problems.length ? `  ⚠ ${audit.problems.join("; ")}` : "  ✓ clear";
      const fits = audit.pageH > v.height ? `scrolls +${audit.pageH - v.height}` : "fits";
      console.log(`  ${day.padEnd(5)} ${v.id.padEnd(7)} ${String(v.width).padStart(4)}×${v.height}  page=${audit.pageH}px (${fits})${flag}`);
      await page.close();
    }
  }
  console.log(`\ntype: Fraunces loaded = ${fraunces}${fraunces ? "" : "  (rendered in DejaVu Serif fallback)"}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
