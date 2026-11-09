/**
 * EXP3 — photograph and film the two Arrival SYNTHESIS prototypes.
 *
 *   npx tsx scripts/capture-exp3-arrival-synthesis.ts
 *
 * ZERO-WRITE. It authenticates as an existing, fictional, DEV-only Development
 * World household (the same one the ARRIVAL1/EXP2 capture scripts use, same
 * documented shared DEV password), reads, and photographs. No account creation,
 * no business data, no mutation of any kind.
 *
 * For each prototype it records the FULL arrival as video (desktop + mobile),
 * lifts stills at that prototype's own defining moments, captures the
 * reduced-motion state (which must show NO arrival), and converts each video to
 * a GIF with ffmpeg — because "the greeting is held inside the visible shell",
 * "the trees never move, only clear", "nothing moves after the settle" are
 * CLAIMS, and a claim with no picture attached is a claim nobody checked.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/ui-audit/exp3-arrival-synthesis");
const VIDEO_OUT = resolve(OUT, "video");

// Fictional, DEV-only household. Documented shared DEV password.
const DW_USER = "price.single.parent.owner@dev.thehealthyapples.dev";
const DW_PASS = process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

interface Proto {
  key: string;                 // file prefix, e.g. "s1-quiet"
  route: string;
  mountTestId: string;         // waits for the page root
  /** stills, as [absolute seconds after mount-selector, name] — ascending */
  moments: Array<[number, string]>;
  videoTail: number;           // seconds to keep recording after the last still
}

const PROTOS: Proto[] = [
  {
    key: "s1-quiet",
    route: "/dev/arrival-s1-quiet",
    mountTestId: "arrival-s1",
    moments: [
      [2.4, "greeting-held"],      // hand + name settled, still — INSIDE the visible shell
      [4.0, "giving-way"],         // the one crossfade: words receding, room coming through
      [5.4, "workspace"],          // at rest: state sentence first, then the room
      [6.8, "companion-arrived"],  // the Companion has settled in, a beat after the person
    ],
    videoTail: 0.8,
  },
  {
    key: "s2-walking-home",
    route: "/dev/arrival-s2-walking-home",
    mountTestId: "arrival-s2",
    moments: [
      [0.7, "beneath-the-trees"],  // shade + glimpses + morning light; orchard is the content
      [1.9, "walking-in"],         // near planes clearing nearest-first; Home beginning to rise
      [4.2, "arrived"],            // at rest in the open; stillness
      [5.8, "companion-arrived"],  // the Companion has settled in, after the person
    ],
    videoTail: 0.8,
  },
];

async function login(ctx: BrowserContext) {
  const r = await ctx.request.post(`${BASE}/api/login`, {
    data: { username: DW_USER, password: DW_PASS },
  });
  if (!r.ok()) throw new Error(`dev-world login failed: ${r.status()} — is the dev server up?`);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: resolve(OUT, `${name}.png`) });
  console.log(`  ✓ ${name}.png`);
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

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(VIDEO_OUT, { recursive: true });
  const executablePath = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;
  const browser: Browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  for (const proto of PROTOS) {
    console.log(`\n── ${proto.key} (${proto.route})`);
    for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]] as const) {
      // ── The full arrival, RECORDED, with stills lifted from its moments.
      {
        const ctx = await browser.newContext({
          viewport,
          recordVideo: { dir: VIDEO_OUT, size: viewport },
        });
        await login(ctx);
        const page = await ctx.newPage();
        await page.goto(`${BASE}${proto.route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await page.waitForSelector(`[data-testid="${proto.mountTestId}"]`, { timeout: 30_000 });

        let elapsed = 0;
        let i = 0;
        for (const [at, name] of proto.moments) {
          i += 1;
          await page.waitForTimeout(Math.max(0, at - elapsed) * 1000);
          elapsed = at;
          await shot(page, `${proto.key}-${label}-0${i}-${name}`);
        }
        await page.waitForTimeout(proto.videoTail * 1000);

        const video = page.video();
        await ctx.close(); // flushes the video file
        if (video) {
          const webm = resolve(VIDEO_OUT, `${proto.key}-${label}.webm`);
          await video.saveAs(webm);
          await video.delete();
          toGif(webm, resolve(VIDEO_OUT, `${proto.key}-${label}.gif`), label === "desktop" ? 720 : 320);
        }
      }

      // ── REDUCED MOTION — a different person, not a faster animation: NO arrival.
      {
        const ctx = await browser.newContext({ viewport, reducedMotion: "reduce" });
        await login(ctx);
        const page = await ctx.newPage();
        await page.goto(`${BASE}${proto.route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
        await page.waitForSelector(`[data-testid="${proto.mountTestId}-workspace"]`, { timeout: 30_000 });
        await page.waitForTimeout(400); // deliberately EARLY — nothing should be pending
        await shot(page, `${proto.key}-${label}-0${proto.moments.length + 1}-reduced-motion`);
        await ctx.close();
      }
    }
  }

  // ── THE CONTROL — the live Home, unchanged by this workstream.
  for (const [label, viewport] of [["desktop", DESKTOP], ["mobile", MOBILE]] as const) {
    const ctx = await browser.newContext({ viewport });
    await login(ctx);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/home`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(600);
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
