/**
 * HOME · ARRIVAL — PRODUCTION LOCK render harness.
 * Renders the single locked composition (Concept B · The Kept House · pressed-apple
 * identity · Companion apple) at desktop · tablet · mobile, on both honest days,
 * with a programmatic collision check on every render.
 *
 *   LD_LIBRARY_PATH=<curated-chromium-libs> npx tsx scripts/north4-concepts/render-arrival-lock.ts
 *
 * Curated-libs recipe: .engineering/session/runs/HOME_ARRIVAL_PRODUCTION_LOCK.md § Tooling.
 * Design lock only — nothing here is imported by the app; no product source changes.
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const OUT = resolve("docs/ui-audit/home-arrival-lock");
const SRC = "file://" + resolve("scripts/north4-concepts/home-arrival-lock.html");

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
  let problems = 0;

  for (const day of DAYS) {
    for (const v of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 2 });
      await page.goto(`${SRC}?day=${day}`, { waitUntil: "networkidle" });
      await page.evaluate(() => (document as any).fonts?.ready);
      await page.waitForTimeout(450);
      if (!fraunces) fraunces = await page.evaluate(() => (document as any).fonts.check('300 72px "Fraunces"'));

      // The sill line is sacred: nothing the household READS may cross it onto the
      // glass, overlap the doors, or fall through the fold. The pressed apple and
      // the Companion are decorative (tone-on-tone relief / a fixed launcher) and
      // are checked only for the one inviolable rule — never onto the glass.
      const audit = await page.evaluate(() => {
        const sillEl = document.querySelector(".sill") as HTMLElement | null;
        const doorsEl = document.querySelector(".doors") as HTMLElement | null;
        const glassEl = document.querySelector(".glass") as HTMLElement | null;
        const waEl = document.querySelector(".wall-apple") as HTMLElement | null;
        const sillBottom = sillEl ? sillEl.getBoundingClientRect().bottom : 0;
        const doorsTop = doorsEl ? doorsEl.getBoundingClientRect().top : Infinity;
        const p: string[] = [];
        // content that must stay in the room, below the sill, above the doors
        const selectors = [".name", ".note", ".console", ".date"];
        for (const sel of selectors) {
          const els = Array.from(document.querySelectorAll(sel)) as HTMLElement[];
          for (const el of els) {
            const b = el.getBoundingClientRect();
            if (b.width <= 0 || b.height <= 0) continue;
            if (b.top < sillBottom - 1) p.push(sel + " crosses the sill");
            if (b.bottom > doorsTop + 1) p.push(sel + " overlaps the doors");
          }
        }
        // visible action button too
        const actions = Array.from(document.querySelectorAll(".action")) as HTMLElement[];
        for (const el of actions) {
          const b = el.getBoundingClientRect();
          if (b.width <= 0 || b.height <= 0) continue;
          if (b.top < sillBottom - 1) p.push(".action crosses the sill");
          if (b.bottom > doorsTop + 1) p.push(".action overlaps the doors");
        }
        // the pressed apple is decorative tone-on-tone relief — the one rule is
        // that it may never sit on the glass
        const wa = waEl ? waEl.getBoundingClientRect() : null;
        if (wa && wa.top < sillBottom - 1) p.push("pressed apple crosses the sill onto the glass");
        const g = glassEl ? glassEl.getBoundingClientRect() : null;
        return {
          problems: p,
          pageH: document.body.scrollHeight,
          glassTop: g ? Math.round(g.top) : -1,
          glassH: g ? Math.round(g.height) : -1,
          apple: wa ? Math.round(wa.left) + "," + Math.round(wa.top) + " " + Math.round(wa.width) + "px" : "none",
        };
      });

      const base = `${OUT}/lock-${day}-${v.id}`;
      await page.screenshot({ path: `${base}.png` });
      if (v.id !== "desktop") await page.screenshot({ path: `${base}-full.png`, fullPage: true });

      problems += audit.problems.length;
      const flag = audit.problems.length ? `  ⚠ ${audit.problems.join("; ")}` : "  ✓ clear";
      console.log(`  ${day.padEnd(5)} ${v.id.padEnd(7)}  glass@${audit.glassTop}h${audit.glassH}  apple@${audit.apple}  page=${audit.pageH}px${flag}`);
      await page.close();
    }
  }
  console.log(`\ntype: Fraunces loaded = ${fraunces}${fraunces ? "" : "  (DejaVu Serif fallback)"}`);
  console.log(`collision: ${problems === 0 ? "ALL CLEAR (12/12)" : problems + " problem(s) — see ⚠ above"}`);
  await browser.close();
  if (problems) process.exit(2);
}
main().catch((e) => { console.error(e); process.exit(1); });
