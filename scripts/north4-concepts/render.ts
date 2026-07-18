/**
 * NORTH4 — render the three entrance-hall concepts at every breakpoint.
 *
 * These are composition studies, not implementations. Nothing here is imported
 * by the app; the mockups are standalone HTML and reference the canonical
 * orchard asset in place (no substitute asset is authored).
 *
 *   LD_LIBRARY_PATH=<chromium libs> npx tsx scripts/north4-concepts/render.ts [a|b|c]
 */
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { resolve } from "path";

const OUT = resolve("docs/ui-audit/north4-concepts");

const CONCEPTS = [
  { id: "a", name: "The Quiet Entrance Hall" },
  { id: "b", name: "The Panoramic Living Room" },
  { id: "c", name: "The Modern Family Kitchen" },
];

const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "tablet", width: 834, height: 1112 },
  { id: "mobile", width: 390, height: 844 },
];

async function main() {
  const only = process.argv[2]?.toLowerCase();
  const targets = only ? CONCEPTS.filter((c) => c.id === only) : CONCEPTS;
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ args: ["--no-sandbox", "--font-render-hinting=none"] });

  for (const c of targets) {
    const url = "file://" + resolve(`scripts/north4-concepts/concept-${c.id}.html`);
    for (const v of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: v.width, height: v.height },
        deviceScaleFactor: 2,
      });
      await page.goto(url, { waitUntil: "networkidle" });
      // Webfonts may be unreachable in this sandbox; render whatever resolved.
      await page.evaluate(() => (document as any).fonts?.ready);
      await page.waitForTimeout(350);

      const file = `${OUT}/concept-${c.id}-${v.id}.png`;
      await page.screenshot({ path: file });

      // The arrival is what the viewport holds. Also capture the whole page for
      // tablet/mobile, where the room legitimately continues below the fold.
      if (v.id !== "desktop") {
        await page.screenshot({ path: `${OUT}/concept-${c.id}-${v.id}-full.png`, fullPage: true });
      }
      const h = await page.evaluate(() => document.body.scrollHeight);
      console.log(`  ${c.id}/${v.id.padEnd(7)} ${String(v.width).padStart(4)}×${v.height}  page=${h}px  ${h > v.height ? `(scrolls +${h - v.height})` : "(fits)"}`);
      await page.close();
    }
    console.log(`✓ Concept ${c.id.toUpperCase()} — ${c.name}\n`);
  }

  // Report which font actually resolved, so the study is honest about its type.
  const p = await browser.newPage();
  await p.goto("file://" + resolve("scripts/north4-concepts/concept-a.html"), { waitUntil: "networkidle" });
  const font = await p.evaluate(() => {
    const el = document.querySelector(".name") as HTMLElement;
    return {
      requested: getComputedStyle(el).fontFamily,
      // Measure against a known fallback to see if the webfont really loaded.
      loaded: (document as any).fonts.check('300 88px "Fraunces"'),
    };
  });
  console.log(`type: requested ${font.requested}\n      Fraunces loaded: ${font.loaded}`);
  await browser.close();
}

main();
