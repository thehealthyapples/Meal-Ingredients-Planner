/**
 * EXP4 — photograph and film the three Materiality & Depth studies.
 *
 *   npx tsx scripts/capture-exp4-materiality-depth.ts
 *
 * ZERO-WRITE. It authenticates as an existing, fictional, DEV-only Development
 * World household (the same one the ARRIVAL1/EXP2/EXP3 capture scripts use,
 * same documented shared DEV password), reads, and photographs. No account
 * creation, no business data, no mutation of any kind.
 *
 * For each study it captures the composed room (desktop + mobile), films the
 * micro-interactions (hover → press → keyboard focus) as video, lifts stills
 * at each interaction state, takes close-up element shots of the primary and
 * supporting surfaces (the material IS the deliverable here), and converts
 * each video to a GIF with ffmpeg — because "hover lifts the surface",
 * "hover brings it into the light", "press settles it back down" are CLAIMS,
 * and a claim with no picture attached is a claim nobody checked.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/ui-audit/exp4-materiality-depth");
const VIDEO_OUT = resolve(OUT, "video");

// Fictional, DEV-only household. Documented shared DEV password.
const DW_USER = "price.single.parent.owner@dev.thehealthyapples.dev";
const DW_PASS = process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

interface Study {
  key: string;            // file prefix, e.g. "a-warm-layers"
  route: string;
  mountTestId: string;    // page root
  primaryTestId: string;  // the primary surface (close-up)
  supportTestId: string;  // the hover/press/focus target (shopping)
  supportPairSel: string; // the supporting tier, for a close-up of both
}

const STUDIES: Study[] = [
  {
    key: "a-warm-layers",
    route: "/dev/material-a-warm-layers",
    mountTestId: "material-a",
    primaryTestId: "card-ma-todays-meals",
    supportTestId: "card-ma-shopping",
    supportPairSel: '[data-testid="card-ma-shopping"] >> xpath=ancestor::div[contains(@class,"grid")]',
  },
  {
    key: "b-atmosphere",
    route: "/dev/material-b-atmosphere",
    mountTestId: "material-b",
    primaryTestId: "card-mb-todays-meals",
    supportTestId: "card-mb-shopping",
    supportPairSel: '[data-testid="card-mb-shopping"] >> xpath=ancestor::div[contains(@class,"grid")]',
  },
  {
    key: "c-restraint",
    route: "/dev/material-c-restraint",
    mountTestId: "material-c",
    primaryTestId: "card-mc-todays-meals",
    supportTestId: "row-mc-shopping",
    supportPairSel: '[data-testid="mc-support"]',
  },
];

async function login(ctx: BrowserContext) {
  const r = await ctx.request.post(`${BASE}/api/login`, {
    data: { username: DW_USER, password: DW_PASS },
  });
  if (!r.ok()) throw new Error(`dev-world login failed: ${r.status()} — is the dev server up?`);
}

async function shot(page: Page, name: string, opts: { fullPage?: boolean } = {}) {
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: opts.fullPage });
  console.log(`  ✓ ${name}.png`);
}

/** Tab until the shopping link owns focus, so the ring in the still is the
 *  real keyboard focus-visible ring, never a scripted imitation. */
async function tabToSupport(page: Page): Promise<boolean> {
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? null);
    if (label === "Go to shopping") return true;
  }
  return false;
}

function toGif(webm: string, gif: string, width: number) {
  // Two-pass palette so the Calm Orchard canvas doesn't band.
  const filters = `fps=10,scale=${width}:-1:flags=lanczos`;
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", webm,
    "-filter_complex", `[0:v]${filters},split[a][b];[a]palettegen[p];[b][p]paletteuse`,
    gif,
  ]);
  console.log(`  ✓ ${gif.split("/").pop()}`);
}

async function settle(page: Page, study: Study) {
  await page.waitForSelector(`[data-testid="${study.mountTestId}"]`, { timeout: 30_000 });
  await page.waitForSelector(`[data-testid="${study.primaryTestId}"]`, { timeout: 30_000 });
  // Let the queries resolve so the room is photographed settled, not loading.
  await page.waitForTimeout(1600);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(VIDEO_OUT, { recursive: true });
  const executablePath = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
  const browser: Browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const study of STUDIES) {
    console.log(`\n── ${study.key} (${study.route})`);
    for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]] as const) {
      // ── The room + its micro-interactions, RECORDED, stills lifted live.
      const ctx = await browser.newContext({
        viewport,
        recordVideo: { dir: VIDEO_OUT, size: viewport },
      });
      await login(ctx);
      const page = await ctx.newPage();
      await page.goto(`${BASE}${study.route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await settle(page, study);

      // 1 — the composed room, at rest.
      await shot(page, `${study.key}-${label}-01-composed`);
      if (label === "mobile") {
        await shot(page, `${study.key}-${label}-01b-composed-full`, { fullPage: true });
      }

      const support = page.locator(`[data-testid="${study.supportTestId}"]`);
      await support.scrollIntoViewIfNeeded();
      const box = await support.boundingBox();
      if (!box) throw new Error(`no bounding box for ${study.supportTestId}`);
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;

      // 2 — hover: the surface answers the pointer (desktop only; there is
      //     no hover on a phone, and pretending otherwise photographs a lie).
      if (label === "desktop") {
        await page.mouse.move(cx, cy, { steps: 12 });
        await page.waitForTimeout(700);
        await shot(page, `${study.key}-${label}-02-hover-support`);
      }

      // 3 — press: held down, photographed mid-press, then released OFF the
      //     surface so the study never navigates away mid-film.
      await page.mouse.move(cx, cy, { steps: 6 });
      await page.mouse.down();
      await page.waitForTimeout(650);
      await shot(page, `${study.key}-${label}-03-press-support`);
      await page.mouse.move(viewport.width - 8, 8, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(500);

      // 4 — keyboard focus: the real focus-visible ring, reached by Tab.
      const focused = await tabToSupport(page);
      if (focused) {
        await page.waitForTimeout(400);
        await shot(page, `${study.key}-${label}-04-focus-support`);
      } else {
        console.warn(`  ⚠ could not Tab to the shopping surface on ${label}`);
      }
      await page.waitForTimeout(600);

      const video = page.video();
      await ctx.close(); // flushes the video file
      if (video) {
        const webm = resolve(VIDEO_OUT, `${study.key}-${label}.webm`);
        await video.saveAs(webm);
        await video.delete();
        toGif(webm, resolve(VIDEO_OUT, `${study.key}-${label}.gif`), label === "desktop" ? 720 : 320);
      }
    }

    // ── Close-ups (desktop, unrecorded): the material itself — the primary
    //    surface and the supporting tier, cropped to the element.
    {
      const ctx = await browser.newContext({ viewport: DESKTOP });
      await login(ctx);
      const page = await ctx.newPage();
      await page.goto(`${BASE}${study.route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await settle(page, study);
      await page
        .locator(`[data-testid="${study.primaryTestId}"]`)
        .screenshot({ path: resolve(OUT, `${study.key}-05-detail-primary.png`) });
      console.log(`  ✓ ${study.key}-05-detail-primary.png`);
      await page
        .locator(study.supportPairSel)
        .first()
        .screenshot({ path: resolve(OUT, `${study.key}-06-detail-support.png`) });
      console.log(`  ✓ ${study.key}-06-detail-support.png`);
      await ctx.close();
    }
  }

  // ── THE CONTROL — the live Home, unchanged by this workstream.
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]] as const) {
    const ctx = await browser.newContext({ viewport });
    await login(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/home`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(1600);
    await shot(page, `control-${label}-live-home-unchanged`);
    await ctx.close();
  }

  await browser.close();
  console.log(`\nWrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
