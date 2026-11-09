/**
 * EXP2 — photograph and film the five Arrival Experience exploration prototypes.
 *
 *   npx tsx scripts/capture-exp2-arrival-explorations.ts
 *
 * ZERO-WRITE. It authenticates as an existing, fictional, DEV-only Development
 * World household (the same one capture-arrival-experience.ts uses, same
 * documented shared DEV password), reads, and photographs. No account creation,
 * no business data, no mutation of any kind.
 *
 * For each prototype it records the FULL arrival as video (desktop + mobile),
 * lifts stills at that prototype's own defining moments, captures the
 * reduced-motion state (which must show NO arrival), and converts each video to
 * a GIF with ffmpeg — because "the greeting lingers", "the light settles",
 * "nothing moves after the fade" are CLAIMS, and a claim with no picture
 * attached is a claim nobody checked.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const BASE = process.env.UX_BASE_URL ?? "http://localhost:5000";
const OUT = resolve(import.meta.dirname, "..", "docs/ui-audit/exp2-arrival-explorations");
const VIDEO_OUT = resolve(OUT, "video");

// Fictional, DEV-only household. Documented shared DEV password.
const DW_USER = "price.single.parent.owner@dev.thehealthyapples.dev";
const DW_PASS = process.env.DEV_WORLD_PASSWORD ?? "devworld-dev-only";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

interface Proto {
  key: string;                 // file prefix, e.g. "a-welcome"
  route: string;
  mountTestId: string;         // waits for the page root
  /** stills, as [absolute seconds after mount-selector, name] — ascending */
  moments: Array<[number, string]>;
  videoTail: number;           // seconds to keep recording after the last still
}

const PROTOS: Proto[] = [
  {
    key: "a-welcome",
    route: "/dev/arrival-a-welcome",
    mountTestId: "arrival-a",
    moments: [
      [3.2, "greeting-held"],     // hand + name settled, in the emotional pause
      [6.4, "giving-way"],        // the slow crossfade: words receding, room coming through
      [8.4, "workspace"],         // settled; the Companion may arrive
    ],
    videoTail: 1.0,
  },
  {
    key: "b-orchard",
    route: "/dev/arrival-b-orchard",
    mountTestId: "arrival-b",
    moments: [
      [0.8, "morning-light"],     // in the orchard: shell present, warm wash, no workspace yet
      [2.0, "furnishing"],        // the room rising into place, one piece
      [4.2, "settled"],           // daylight; stillness
    ],
    videoTail: 1.0,
  },
  {
    key: "c-workspace",
    route: "/dev/arrival-c-workspace",
    mountTestId: "arrival-c",
    moments: [
      [0.9, "orientation"],       // beat one: date, "Today", the state sentence
      [2.6, "composed"],          // beat two landed: the whole kitchen, still
    ],
    videoTail: 1.0,
  },
  {
    key: "d-quiet",
    route: "/dev/arrival-d-quiet",
    mountTestId: "arrival-d",
    moments: [
      [1.1, "prepared"],          // the one fade done: greeting, note, workspace
      [3.2, "companion-arrived"], // the Companion has settled in, after the person
    ],
    videoTail: 0.8,
  },
  {
    key: "e-restraint",
    route: "/dev/arrival-e-restraint",
    mountTestId: "arrival-e",
    moments: [
      [1.8, "settled"],           // the one fade done; nothing will ever move again
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

  // ── THE CONTROLS — the live Home and ARRIVAL1's prototype, both unchanged
  //    by this workstream (ARRIVAL1 awaits its own decision; EXP2 must not
  //    have touched either).
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
