// COOKBOOK1 — before/after evidence for the family cookbook transformation.
//
// One room, three widths. EXPREVIEW1 § 6 judged the Cookbook at 1920 and called
// it "the floor" of the house, so the evidence is captured where the judgement
// was made.
//
// The probe measures the two things this workstream claims to have changed, as
// numbers rather than as opinions:
//
//   shelfHeaders  — the section headers rendered, by name. "Wholefood
//                   Suggestions" appearing here means the retirement failed.
//   counts        — how many "· N" inventory counts survive above the shelves.
//   cardControls  — interactive controls inside the recipe cards. EXPREVIEW1
//                   counted "seventy-two unlabelled controls" across twelve
//                   cards; this is that count, taken the same way.
//   wands         — magic-wand glyphs standing in for a photograph.
//
// Usage: npx tsx scripts/capture-cookbook1-family-cookbook.ts <before|after>
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import path from "path";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = path.resolve("docs/ui-audit/cookbook1-family-cookbook");
const LABEL = process.argv[2] ?? "after";

const VIEWPORTS = [
  { tag: "1440", width: 1440, height: 900 },
  { tag: "1920", width: 1920, height: 1080 },
  { tag: "mobile", width: 390, height: 844 },
] as const;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const login = await ctx.request.post(`${BASE}/api/login`, {
      data: {
        username: "price.single.parent.owner@dev.thehealthyapples.dev",
        password: process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only",
      },
    });
    if (!login.ok()) throw new Error(`login failed: ${login.status()}`);

    const page = await ctx.newPage();
    await page.goto(`${BASE}/cookbook`, { waitUntil: "networkidle", timeout: 60000 });
    await page.evaluate(() => (document as any).fonts.ready);
    await page.waitForTimeout(2500);

    await page.screenshot({ path: path.join(OUT, `${LABEL}-${vp.tag}-fold.png`) });
    await page.screenshot({ path: path.join(OUT, `${LABEL}-${vp.tag}-full.png`), fullPage: true });

    const probe = await page.evaluate(() => {
      const headers = Array.from(
        document.querySelectorAll('[data-testid^="section-header-"]'),
      ).map(h => (h.textContent ?? "").trim());
      const cards = Array.from(document.querySelectorAll('[data-testid^="card-meal-"]'));
      const controls = cards.reduce(
        (n, c) => n + c.querySelectorAll("button, [role='button'], a").length,
        0,
      );
      return {
        shelfHeaders: headers,
        counts: headers.filter(h => /·\s*\d+/.test(h)).length,
        cards: cards.length,
        cardControls: controls,
        controlsPerCard: cards.length ? +(controls / cards.length).toFixed(1) : 0,
        // Match any lucide wand variant by class substring — the exact class
        // name has changed across lucide releases, and pinning it produced a
        // silent 0 that looked like a pass.
        wands: document.querySelectorAll('svg[class*="wand"]').length,
        loadMore:
          document
            .querySelector('[data-testid="button-load-more-meals"]')
            ?.textContent?.trim() ?? "(none)",
        libraryDoor:
          document
            .querySelector('[data-testid="button-open-wider-library"]')
            ?.textContent?.trim() ?? "(none)",
      };
    });

    console.log(`\n${LABEL} ${vp.tag} ──────────────────────────────`);
    console.log(`  shelves      : ${probe.shelfHeaders.join(" | ") || "(none)"}`);
    console.log(`  counts       : ${probe.counts}`);
    console.log(`  cards        : ${probe.cards}`);
    console.log(`  cardControls : ${probe.cardControls}  (${probe.controlsPerCard}/card)`);
    console.log(`  wand glyphs  : ${probe.wands}`);
    console.log(`  load more    : "${probe.loadMore}"`);
    console.log(`  library door : "${probe.libraryDoor}"`);

    await page.close();
    await ctx.close();
  }

  await browser.close();
  console.log(`\nEvidence written to ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
